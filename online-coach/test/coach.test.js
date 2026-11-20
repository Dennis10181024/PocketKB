'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ConversationCoach, createOpenAIProvider, specs } = require('../coach');
const { createServer } = require('../server');
const Fire = require('../../web-pwa/fire-engine');
const V3 = require('../../web-pwa/scenario-engine-v3');
const input = (text, actions = [], intent = 'action', extra = {}) => ({ intent, understanding: text, question: '', needsClarification: false, actions: actions.map(id => ({ id, evidence: text })), ...extra });
const withoutClock = ({elapsed,consecutiveQuestions,...state}) => state;
const request = (text, revision = 0, intent = 'action', requestId = `test-${Math.random()}`) => ({ text, revision, intent, requestId });
function fakeProvider(interpret, narrate = payload => {
  if (payload.evidence) return {quote:payload.evidence};
  const detail = payload.sensoryChoices[0];
  return { reply:`我${detail.text}。${payload.requiredChange || '我重新看向眼前的情況。'}`,sensoryId:detail.id };
}) {
  const calls = [];
  return { ready: true, model: 'test-double', calls,
    async generate(stage, payload) {
      calls.push({ stage, payload: structuredClone(payload) });
      return { value: await (stage === 'interpret' ? interpret(payload) : narrate(payload)), usage: {} };
    },
  };
}

test('validated GPT evidence can execute a paraphrase missed by the rules', async () => {
  const provider = fakeProvider(p => input(p.text, ['close']));
  const coach = new ConversationCoach(provider); const s = coach.create('drill_fire_dorm');
  const result = await coach.turn(s.sessionId, request('我把房門帶上'));
  assert.equal(result.state.node, 'report'); assert.equal(result.revision, 1);
  const {turn,intent,actionIds,source,validation} = result.decision;
  assert.deepEqual({turn,intent,actionIds,source,validation}, {turn:1,intent:'action',actionIds:['close'],source:'model',validation:'ACCEPTED'});
});
test('model action IDs replay through the same state machine, and rule danger overrides a model omission', async () => {
  const provider = fakeProvider(p => input(p.text, p.text === '我把房門帶上' ? ['close'] : []));
  const coach = new ConversationCoach(provider);
  const initial = coach.create('drill_fire_dorm');
  const one = await coach.turn(initial.sessionId, request('我把房門帶上'));
  const two = await coach.turn(initial.sessionId, request('我搭電梯', one.revision));
  assert.deepEqual(two.decisions.map(row => [row.actionIds,row.source,row.validation]), [
    [['close'],'model','ACCEPTED'], [['elevator'],'rule','RULE_DANGER_OVERRIDE'],
  ]);
  assert.ok(two.disagreement);
  assert.equal(two.offline,false);
  const spec = specs.get('drill_fire_dorm');
  for (let n=0; n<5; n++) {
    const replay = V3.replayDecisions(spec,two.decisions);
    assert.deepEqual([replay.endingType,replay.injuryLevel,replay.exposure],
      [two.state.endingType,two.state.injuryLevel,two.state.exposure]);
  }
});
test('valid model-only dangerous paraphrases receive the engine consequence', async () => {
  const text = '我用升降設備往樓下移動';
  const spec = specs.get('drill_fire_dorm');
  assert.equal(V3.step(spec,V3.create(spec),text).kind,'clarify');
  const coach = new ConversationCoach(fakeProvider(p => input(p.text,['elevator'])));
  const s = coach.create(spec.id);
  const result = await coach.turn(s.sessionId, request(text));
  assert.equal(result.kind,'failed');
  assert.equal(result.state.injuryLevel,'NOT_ASSESSED');
  assert.equal(result.decision.source,'model');
  assert.equal(result.offline,false);
  assert.ok(result.disagreement);
});
test('a model cannot spend someone else’s action, conflicting evidence, or an unmet guard', async () => {
  for (const text of [
    '小岑用升降設備下樓',
    '我叫小岑搭電梯',
    '我不使用升降設備',
    '如果我用升降設備呢',
    '我打算用升降設備，但我不會使用它',
    '我把房門關好',
  ]) {
    const coach = new ConversationCoach(fakeProvider(p => input(p.text, ['elevator'])));
    const s = coach.create('drill_fire_dorm');
    const result = await coach.turn(s.sessionId,request(text));
    assert.ok(!['failed','risk'].includes(result.kind),text);
    assert.equal(result.decision.source,'rule',text);
    assert.ok(!result.decision.actionIds.includes('elevator'),text);
  }
  const coach = new ConversationCoach(fakeProvider(p => input(p.text, ['power_off'])));
  const s = coach.create('flood_low_home');
  coach.sessions.get(s.sessionId).state.facts.standingDry = false;
  const result = await coach.turn(s.sessionId, request('我把整棟用電切掉'));
  assert.equal(result.decision.validation,'MODEL_GUARD_FAILED');
  assert.deepEqual(result.decision.actionIds,[]);
});
for (const kind of ['question','emotion','off_topic','unclear','clarify']) test(`${kind}: no fabricated action or state change; history reaches the next turn`, async () => {
  const provider = fakeProvider(p => input(p.text, [], kind));
  const coach = new ConversationCoach(provider); const s = coach.create('drill_fire_dorm');
  const one = await coach.turn(s.sessionId, request('第一句'));
  assert.deepEqual(withoutClock(one.state), s.state); assert.equal(one.terminal, false);
  await coach.turn(s.sessionId, request('第二句', 1));
  assert.equal(provider.calls.filter(call=>call.stage==='interpret').at(-1).payload.history.length, 2);
});
test('explicit question mode cannot execute proposed action', async () => {
  const coach = new ConversationCoach(fakeProvider(p => input(p.text, ['elevator'])));
  const s = coach.create('drill_fire_dorm');
  const result = await coach.turn(s.sessionId, request('我要搭電梯',0,'question'));
  assert.deepEqual(withoutClock(result.state), s.state);
});
test('uncertain interpretation cannot execute actions', async () => {
  const coach = new ConversationCoach(fakeProvider(p => input(p.text, ['close'], 'action', { needsClarification:true })));
  const s = coach.create('drill_fire_dorm');
  assert.deepEqual(withoutClock((await coach.turn(s.sessionId, request('關門又開門'))).state), s.state);
});
test('explicit negation and questions remain unexecuted even if model proposes a positive action', async () => {
  for (const [text,id] of [['我不關門','close'],['我能不能搭電梯嗎','elevator'],['我關門又不關門','close']]) {
    const coach=new ConversationCoach(fakeProvider(p=>input(p.text,[id])));const s=coach.create('drill_fire_dorm');
    const result=await coach.turn(s.sessionId,request(text));assert.deepEqual(withoutClock(result.state),s.state);assert.ok(['clarify','question'].includes(result.kind));
  }
});
test('unknown actions and fabricated evidence use rules without model narration', async () => {
  for (const interpretation of [input('關門',['invented']), input('這不是原文',['close'])]) {
    const provider = fakeProvider(()=>interpretation); const coach = new ConversationCoach(provider); const s=coach.create('drill_fire_dorm');
    const result = await coach.turn(s.sessionId,request('我關門'));
    assert.equal(result.offline,true);
    assert.equal(result.state.node,'report');
    assert.equal(result.revision,1);
    assert.equal(provider.calls.length,1);
  }
});
test('known fatal intent locks the session and cannot become successful via another reply', async () => {
  const coach=new ConversationCoach(fakeProvider(p=>input(p.text,['elevator']))); const s=coach.create('drill_fire_dorm');
  const result=await coach.turn(s.sessionId,request('我要搭電梯'));
  assert.equal(result.state.sessionStatus,'FAILED'); assert.equal(result.terminal,true);
  assert.equal(result.scene.physicalStatus,'CRITICAL');
  await assert.rejects(coach.turn(s.sessionId,request('我關門',1)),{code:'SESSION_LOCKED'});
});
test('literal hazard catches a model omission on an action turn', async () => {
  const coach=new ConversationCoach(fakeProvider(p=>input(p.text,['close'])));const s=coach.create('drill_fire_dorm');
  const result=await coach.turn(s.sessionId,request('我關門，然後搭電梯'));
  assert.equal(result.state.sessionStatus,'FAILED');
});
test('narration failure preserves verified state and retries remain idempotent', async () => {
  let fail=true;
  const provider=fakeProvider(p=>input(p.text,['close']),()=>{if(fail)throw new Error('test timeout');return {reply:'測試回覆',sourceIds:[]};});
  const coach=new ConversationCoach(provider);const s=coach.create('drill_fire_dorm');const body=request('我關門');
  const fallback=await coach.turn(s.sessionId,body);
  assert.equal(fallback.narration,'template');assert.equal(fallback.state.node,'report');
  fail=false;assert.deepEqual(await coach.turn(s.sessionId,body),fallback);
  assert.equal(coach.sessions.get(s.sessionId).history.length,2);
  assert.equal(provider.calls.length,2);
});
test('model citations are ignored and engine attaches sources', async () => {
  const coach=new ConversationCoach(fakeProvider(p=>input(p.text,['close']),()=>({reply:'測試',sourceIds:['fabricated']})));
  const s=coach.create('drill_fire_dorm');const result=await coach.turn(s.sessionId,request('我關門'));
  assert.equal(result.offline,false);assert.ok(result.citations.every(source=>source.id!=='fabricated'));assert.ok(result.citations.length);
});
test('retry is idempotent and request ID cannot be reused for different content', async () => {
  const provider=fakeProvider(p=>input(p.text,['close']));const coach=new ConversationCoach(provider);const s=coach.create('drill_fire_dorm');const body=request('我關門');
  const [a,b]=await Promise.all([coach.turn(s.sessionId,body),coach.turn(s.sessionId,body)]);
  assert.deepEqual(a,b);assert.equal(provider.calls.length,2);
  assert.deepEqual(await coach.turn(s.sessionId,body),a);assert.equal(provider.calls.length,2);
  await assert.rejects(coach.turn(s.sessionId,{...body,text:'不同內容'}),{code:'REQUEST_CONFLICT'});
  await assert.rejects(coach.turn(s.sessionId,request('下一句',0)),{code:'STALE_TURN'});
});
test('concurrent different requests cannot overtake each other', async () => {
  let resume;const wait=new Promise(resolve=>{resume=resolve;});
  const provider=fakeProvider(async p=>{await wait;return input(p.text,[],'question');});
  const coach=new ConversationCoach(provider);const s=coach.create('drill_fire_dorm');const first=coach.turn(s.sessionId,request('第一句'));
  await assert.rejects(coach.turn(s.sessionId,request('第二句')),{code:'STALE_TURN'});
  resume();await first;
});
test('waiting rescue remains distinct from evacuated or rescued with semantic IDs', async () => {
  const spec=specs.get('earthquake_home_trapped');let state=V3.create(spec);
  for(const id of ['assess_injury','avoid_forcing_exit','send_location','conserve_phone','make_signal','conserve_supplies']) {
    state=V3.step(spec,state,'口語行動','action',{actionIds:[id]}).state;
  }
  assert.equal(state.physicalStatus,'WAITING_RESCUE');assert.notEqual(state.sessionStatus,'ACTIVE');
});
test('closing a route and waiting branch retain real causal effects', () => {
  const spec=specs.get('barrier_lake_downstream');let state=V3.create(spec);
  state=V3.step(spec,state,'我還要整理','action',{actionIds:['pack_more']}).state;
  assert.equal(state.node,'cutoff');
  for(const id of ['vertical_refuge','send_location','conserve'])state=V3.step(spec,state,'口語行動','action',{actionIds:[id]}).state;
  assert.equal(state.physicalStatus,'WAITING_RESCUE');
});
test('unsupported and future actions do not invent state transitions', () => {
  const spec=specs.get('earthquake_home_trapped');const initial=V3.create(spec);
  for(const actionIds of [['invented_exit'],['conserve_supplies']])assert.deepEqual(V3.rawStep(spec,initial,'試試','action',{actionIds}).state,initial);
  const fire=require('../../web-pwa/scenarios/fire-dorm.json');assert.deepEqual(Fire.rawStep(fire,Fire.create(fire),'試試','action',{actionIds:['invented_exit']}).state,Fire.create(fire));
});
test('missing key does not call a fake coach or move the scenario', async () => {
  const coach=new ConversationCoach(createOpenAIProvider({apiKey:''}));const s=coach.create('drill_fire_dorm');
  const result=await coach.turn(s.sessionId,request('為什麼'));
  assert.equal(result.offline,true);assert.deepEqual(withoutClock(result.state),s.state);
  assert.equal(coach.calls,0);assert.equal(result.revision,1);
});
test('call limit also guards second-stage calls and uses a factual template', async () => {
  const coach=new ConversationCoach(fakeProvider(p=>input(p.text,['close'])),{maxCalls:1});const s=coach.create('drill_fire_dorm');
  const result=await coach.turn(s.sessionId,request('我關門'));
  assert.equal(result.narration,'template');assert.equal(result.state.node,'report');assert.equal(coach.calls,1);
});
test('OpenAI adapter uses real Responses schema, store:false and validates completion', async () => {
  let captured;
  const provider=createOpenAIProvider({apiKey:'test-secret',fetchImpl:async(url,options)=>{
    captured={url,options};return {ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'{"reply":"測試"}'}]}]})};
  }});
  const result=await provider.generate('narrate',{text:'測試'},{type:'object'});
  assert.equal(result.value.reply,'測試');assert.equal(captured.url,'https://api.openai.com/v1/responses');
  const body=JSON.parse(captured.options.body);assert.equal(body.store,false);assert.equal(body.text.format.strict,true);assert.equal(body.model,'gpt-6.1-terra');
  const incomplete=createOpenAIProvider({apiKey:'x',fetchImpl:async()=>({ok:true,json:async()=>({status:'incomplete'})})});
  await assert.rejects(incomplete.generate('interpret',{},{}),{code:'MODEL_INCOMPLETE'});
});
test('HTTP adapter serves UI, rejects foreign origin and malformed JSON, exposes no key', async () => {
  const coach=new ConversationCoach(createOpenAIProvider({apiKey:'test-only-secret'}));const server=createServer(coach);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await fetch(base+'/online.html')).status,200);
    const health=await (await fetch(base+'/api/health')).text();assert.ok(!health.includes('test-only-secret'));
    assert.equal((await fetch(base+'/api/sessions',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://unrelated.example'},body:'{}'})).status,403);
    assert.equal((await fetch(base+'/api/sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:'null'})).status,400);
    assert.equal((await fetch(base+'/api/sessions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scenarioId:'invented'})})).status,400);
  } finally { await new Promise(resolve=>server.close(resolve)); }
});
test('local setup stores credentials only in provider memory and never returns the key', async () => {
  const coach=new ConversationCoach(createOpenAIProvider({apiKey:''}));const server=createServer(coach);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
  try {
    const response=await fetch(base+'/api/configure',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({apiKey:'sk-test-only-not-a-real-key-123456'})});
    assert.equal(response.status,200);assert.ok(!(await response.text()).includes('sk-test'));
    assert.equal(coach.provider.ready,true);assert.equal(coach.calls,0);
    const again=await fetch(base+'/api/configure',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({apiKey:'sk-another-test-only-123456'})});
    assert.equal(again.status,409);
  } finally { await new Promise(resolve=>server.close(resolve)); }
});
