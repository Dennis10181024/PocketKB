'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {ConversationCoach,CoachError,specs} = require('../coach');
const V3 = require('../../web-pwa/scenario-engine-v3');
const Experience = require('../experience');
const {fallbackNotice,isConnectionFallback,questionAnswer} = require('../../web-pwa/drill-presentation');

const submission = (coach, session, text) =>
  coach.turn(session.sessionId,{requestId:'step25-'+session.revision,revision:session.revision,text});
const interpretation = {intent:'action',needsClarification:false,understanding:'',question:'',actions:[],emotion:'none',emotionEvidence:''};

test('12 colloquial dissuasions handle the NPC but never assign the forbidden act to the player',async()=>{
  const coach = new ConversationCoach({ready:false});
  const examples = [
    ['drill_fire_dorm',['小岑不要把門打開，我們先留在這','小岑別開房門啦','小岑你先不要把那扇門推開','小岑拜託不要再把門拉開']],
    ['earthquake_school',['小維先不要往外跑','小維，別衝出教室欸','小維不行，往外跑','小維你拜託不要跑出去']],
    ['flood_low_home',['阿敏先不要下樓拿車','阿敏，別回去牽車啦','阿敏不行，下去拿車','阿敏拜託不要去地下室']],
  ];
  for (const [scenario,phrases] of examples) for (const text of phrases) {
    const start=coach.create(scenario);
    const response=await submission(coach,start,text);
    assert.equal(response.state.npc.handled,true,text);
    assert.ok(response.state.events.some(event=>event.kind==='npc_emotion_prompt'),text);
    assert.deepEqual(response.decision.actionIds,[],text);
  }
  for (const text of ['我不關門','我看到小岑不要把門打開','如果我叫小岑不要開門呢？']) {
    const s=await submission(coach,coach.create('drill_fire_dorm'),text);
    assert.equal(s.state.facts.doorClosed,false,text);
    assert.equal(s.state.npc.handled,false,text);
  }
  const danger=await submission(coach,coach.create('drill_fire_dorm'),'小岑別開房門，我搭電梯');
  assert.equal(danger.terminal,true);
});

test('window, report and route answers use the state, without a transition or an OpenAI call',async()=>{
  const coach=new ConversationCoach({ready:true,generate:async()=>{assert.fail('known question should not call the API');}});
  const spec=specs.get('drill_fire_dorm');
  const start=coach.create(spec.id);
  const text='窗戶那邊有煙嗎，可以開窗嗎？';
  const response=await submission(coach,start,text);
  assert.deepEqual(response.state,start.state);
  assert.match(response.reply,/窗外現在看不見煙，但房門還留著一道縫/);
  assert.deepEqual(response.decision.source_ids,['nfa','window-guide']);
  const fixed=(facts)=>questionAnswer(spec,{...start.state,facts},text).message;
  assert.match(fixed({doorClosed:true,windowOutsideClear:true}),/房門也關好了/);
  assert.match(fixed({doorClosed:true,windowOutsideClear:false}),/窗外有煙，窗戶保持關閉/);
  assert.match(fixed({doorClosed:true}),/從這裡看不清楚窗外/);
  assert.match(questionAnswer(spec,start.state,'房門關了嗎？').message,/房門還半開/);
  assert.match(questionAnswer(spec,{...start.state,facts:{doorClosed:true}},'房門關了嗎？').message,/房門已經關好/);
  const reported={...start.state,node:'wait',events:['call','address','room'].map(action=>({action,kind:'action'}))};
  assert.match(questionAnswer(spec,reported,'通報完成了嗎？').message,/房號都報過了/);
  assert.match(questionAnswer(spec,reported,'我還需要再跟他說一次房號嗎？').message,/房號都報過了/);
  assert.match(questionAnswer(spec,start.state,'通報完成了嗎？').message,/還沒有接通119/);
  assert.match(questionAnswer(spec,start.state,'我拿手機打119，現在來得及嗎？').message,/現在就能打119/);
  const school=specs.get('earthquake_school');
  const before=V3.create(school,{onlineExperience:true});
  assert.match(questionAnswer(school,before,'現在可以走樓梯嗎？').message,/教室還在晃/);
  assert.match(questionAnswer(school,{...before,node:'evacuate',facts:{shaking:false,stairsChecked:true}},'可以走樓梯嗎？').message,/指定樓梯已確認/);
  const closed = V3.rawStep(spec,start.state,'我關門').state;
  const call = V3.rawStep(spec,closed,'我要打119，跟他說我們還在宿舍');
  assert.deepEqual(V3.adoptedActionIds(closed,call.state),['call']);
  assert.equal(V3.rawStep(spec,closed,'他說要打119').kind,'question');
});

test('rejections have a scene cue and the emotion turn contains only the NPC response',async()=>{
  const coach=new ConversationCoach({ready:true,async generate(stage,payload){
    if (stage==='interpret') return {value:{...interpretation,emotion:'supportive',emotionEvidence:payload.text}};
    return {value:{reply:'我在這個位置還找不到能照剛才那個做法行動的條件。',sensoryId:''}};
  }});
  let s=await submission(coach,coach.create('drill_fire_dorm'),'我用魔法瞬移');
  assert.doesNotMatch(s.reply,/做法|條件/);
  assert.match(s.reply,/門縫|警報/);
  assert.ok(s.decision.narration_checks.some(check=>check.failures.includes('banned_pattern')));
  s=await submission(coach,s,'小岑不要把門打開，我們先留在這');
  s=await submission(coach,s,'我也有點怕，但我在你旁邊。小岑你不用自己去找人');
  assert.equal(s.decision.emotion.category,'supportive');
  assert.equal(s.decision.narration,'engine_emotion');
  assert.match(s.reply,/小岑/);
  assert.doesNotMatch(s.reply,/做法|條件|沒有繼續/);
  assert.equal(Experience.validFixedLine('我在這個位置還找不到能照剛才那個做法行動的條件。',[]),false);
});

test('logs distinguish safety fallback from transport, timeout and upstream outages',async()=>{
  const reasons=['MODEL_PROTECTED_LANGUAGE','MODEL_GUARD_FAILED','MODEL_INVALID','NOT_CONFIGURED','CALL_LIMIT','MODEL_UNAVAILABLE','PROVIDER_ERROR','TURN_TIMEOUT','MODEL_TIMEOUT','MODEL_INCOMPLETE','CLIENT_TRANSPORT'];
  for (const [index,reason] of reasons.entries()) {
    const coach=new ConversationCoach({ready:true,async generate(){throw new CoachError(reason,'test');}});
    const result=await submission(coach,coach.create('drill_fire_dorm'),'我關門');
    assert.equal(result.state.node,'report');
    assert.equal(result.decision.fallbackReason,reason);
    assert.equal(result.offline,index>=5,reason);
    assert.equal(isConnectionFallback(reason),index>=5,reason);
    assert.equal(Boolean(fallbackNotice(reason)),index>=5,reason);
  }
  for (const reason of ['CLIENT_API_ERROR','CLIENT_SYNC']) {
    const coach=new ConversationCoach({ready:false});
    const start=coach.create('drill_fire_dorm');
    const replay=await coach.turn(start.sessionId,{requestId:'replay-step25',revision:0,text:'我關門',rulesOnly:true,clientFallbackReason:reason});
    assert.equal(replay.state.node,'report');
    assert.equal(replay.decision.fallbackReason,reason);
    assert.equal(replay.offline,reason==='CLIENT_API_ERROR');
  }
});
