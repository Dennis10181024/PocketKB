'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {ConversationCoach,specs} = require('../coach');
const Experience = require('../experience');
const Engine = require('../../web-pwa/scenario-engine-v3');
const scenarios = require('../../web-pwa/scenarios/step21-cases.json');

const provider = {ready:true,async generate(stage,payload) {
  if (stage==='interpret') return {value:{intent:'clarify',understanding:'',question:'',needsClarification:true,actions:[],
    emotion:payload.text.includes('自責') ? 'supportive' : 'none',emotionEvidence:payload.text}};
  if (stage==='quote') return {value:{quote:payload.evidence}};
  const detail = payload.sensoryChoices[0];
  return {value:{reply:`${detail ? '我'+detail.text+'。' : ''}${payload.requiredChange}`,sensoryId:detail?.id || ''}};
}};
const submit = (coach,previous,text,intent='action')=>coach.turn(previous.sessionId,{requestId:`step22b-test-${previous.revision}`,revision:previous.revision,text,intent});

test('flood electrical guard requires three independently true facts in rule and model paths',()=>{
  const spec=specs.get('flood_low_home');
  const initial=Engine.create(spec,{onlineExperience:true});
  const literal='我關閉總電源';
  const paraphrase='我把家裡的電切掉';
  const proposed=[{id:'power_off',evidence:paraphrase}];
  const validate = state=>Engine.validateProposal(spec,state,paraphrase,'action',proposed,Engine.rawStep(spec,state,paraphrase));
  assert.deepEqual(Engine.adoptedActionIds(initial,Engine.rawStep(spec,initial,literal).state),['power_off']);
  assert.ok(validate(initial).result);
  for (const name of ['standingDry','handsDry','panelSafelyReachable']) for (const value of [false,undefined]) {
    const state=structuredClone(initial);
    state.facts[name]=value;
    const rule=Engine.rawStep(spec,state,`${literal}，我說現場都符合條件`);
    assert.equal(rule.kind,'risk',`${name}=${value}`);
    assert.ok(!rule.state.accepted.includes('power_off'));
    assert.match(rule.message,/觸電/);
    assert.equal(validate(state).error,'MODEL_GUARD_FAILED');
  }
});

test('NPC proposes before action, asks again when ignored and only responds to direct player intervention',async()=>{
  const coach=new ConversationCoach(provider);
  const initial=coach.create('drill_fire_dorm');
  assert.match(initial.scene.node.situation,/小岑說：「我開門看看外面。」/);
  let state=await submit(coach,initial,'我關好房門');
  assert.equal(state.state.node,'report');
  assert.equal(state.state.npc.handled,false);
  assert.match(state.reply,/小岑又問/);
  const reported=await submit(coach,state,'室友叫小岑先別開門');
  assert.equal(reported.state.npc.handled,false);
  state=await submit(coach,reported,'我跟小岑說「別開門，先退後」。');
  assert.equal(state.state.npc.handled,true);
  assert.equal(state.state.npc.emotion,null);
  assert.match(state.reply,/我很怕其他同學/);
  assert.deepEqual(Engine.replayDecisions(specs.get(state.scenarioId),state.decisions),state.state);
});

test('flood emotion is judged only after its visible prompt, with no time or invalid count penalty',async()=>{
  const coach=new ConversationCoach(provider);
  const timeLost='阿敏，我知道你很自責，我可以陪你。';
  let state=coach.create('flood_low_home');
  state=await submit(coach,state,timeLost);
  assert.equal(state.state.npc.emotion,null);
  state=await submit(coach,state,'阿敏，先別下地下室拿車。');
  assert.match(state.reply,/我好自責/);
  const clock=state.state.elapsed;
  state=await submit(coach,state,timeLost);
  assert.equal(state.decision.emotion.category,'supportive');
  assert.equal(state.state.elapsed,clock);
  assert.equal(state.state.npc.emotion,'supportive');
  assert.deepEqual(Engine.replayDecisions(specs.get(state.scenarioId),state.decisions),state.state);
});

test('explicit division of a safe task responds to the NPC without executing it as the player',async()=>{
  const coach=new ConversationCoach(provider);
  const initial=coach.create('drill_fire_dorm');
  const response=await submit(coach,initial,'小岑，你負責聯絡消防，我留在門邊。');
  assert.equal(response.state.npc.handled,true);
  assert.match(response.reply,/我很怕其他同學/);
  assert.deepEqual(response.decision.actionIds,[]);
  assert.equal(response.state.node,'isolate');
});

test('three explicit questions return grounded answers with sources and no advancement or invalid count',async()=>{
  const coach=new ConversationCoach(provider);
  let state=await submit(coach,coach.create('flood_low_home'),'我玩魔法');
  const initial=state.state;
  for (const text of ['我可以關總電源嗎？','碰配電箱有觸電風險嗎？','要不要去地下停車場取車？','徒步涉水出去的風險']) {
    state=await submit(coach,state,text);
    assert.deepEqual(state.state,initial);
    assert.ok(state.decision.question_answer_id);
    assert.ok(state.decision.source_ids.length);
    assert.equal(state.suggestions.length,0);
  }
  state=await submit(coach,state,'我瞬移出去');
  assert.equal(state.decision.hint_trigger,'invalid_streak');
});

test('two nonterminal deterioration events are reachable by ordinary decisions in every scenario',()=>{
  const replies={fire:'小岑，先別開門。',school:'小維，先別跑。',trapped:'阿哲，先別推。',flood:'阿敏，先別下去。',mountain:'小安，先別走。',lake:'阿蘭，先別收。'};
  for (const row of scenarios) {
    const entry=Object.entries(replies).find(([key])=>row.file.includes(key==='trapped'?'home':key));
    const spec=[...specs.values()].find(spec=>spec.id.replaceAll('_','-')===row.file || row.file==='fire-dorm' && spec.id==='drill_fire_dorm');
    assert.ok(spec && entry,row.file);
    let state=Engine.create(spec,{onlineExperience:true});
    const inputs=[entry[1],...row.best];
    for (const input of inputs) state=Engine.step(spec,state,input).state;
    assert.equal(state.endingType,row.endingType,row.file);
    assert.deepEqual(state.events.filter(event=>event.eventId?.startsWith('elapsed-')).map(event=>event.eventId),['elapsed-1','elapsed-2'],row.file);
    assert.equal(new Set(spec.deterioration.map(event=>event.id)).size,2);
    assert.ok(spec.deterioration.every(event=>!event.terminal && event.sourceIds.length));
  }
});

test('narration detects copied input, semantic repeats and formulaic closings independently',()=>{
  const details=[{id:'fire_closed_door',text:'看見緊閉的房門'},{id:'fire_window',text:'看得見對外窗'}];
  const input='我拿起手機試一下能不能傳出訊息。';
  const render={reply:'我看得見對外窗，門板仍擋著走廊，房門還緊閉。'+input+'我還沒決定接下來怎麼做。',sensoryId:'fire_window'};
  const result=Experience.checkNarration(render,{text:input,details,previous:['fire_closed_door'],change:'',strict:true,unsupported:()=>false});
  for (const id of ['banned_closing','input_repeated','repeated_sensory_detail']) assert.ok(result.failures.includes(id),id);
  assert.equal(Experience.sharedSubstring('甲乙丙，丁戊己庚辛壬癸','甲乙丙。丁戊己庚辛壬癸'),10);
  assert.deepEqual(Experience.sensoryIds('房門仍關著。',details),['fire_closed_door']);
  const flood=specs.get('flood_low_home').nodes.find(node=>node.id==='wait').experience.sensory;
  for (const text of ['我看見外面積水還沒退。','仍看得見外部道路上的水'])
    assert.deepEqual(Experience.sensoryIds(text,flood),['flood_water']);
});

test('rejecting a return to the classroom keeps the established scene time',async()=>{
  const coach=new ConversationCoach(provider);
  let state=coach.create('earthquake_school');
  for (const input of ['我趴下躲到桌下護住頭頸，抓穩桌腳。','我等待主要搖晃停止。']) state=await submit(coach,state,input);
  assert.equal(state.state.node,'evacuate');
  const refusal=await submit(coach,state,'我不會回教室拿書包。');
  assert.equal(refusal.decision.validation,'RULE_REFUSAL');
  assert.deepEqual(refusal.state,state.state);
});
