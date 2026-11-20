'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const {ConversationCoach,specs} = require('../coach');
const {checkNarration} = require('../experience');
const Engine = require('../../web-pwa/scenario-engine-v3');

const proposal = (id,evidence) => ({id,evidence});
const noAction = {intent:'clarify',understanding:'',question:'',needsClarification:true,actions:[]};
const action = actions=>({...noAction,intent:'action',needsClarification:false,actions});
const provider = (interpret, narration) => ({ready:true,model:'test-double',async generate(stage,payload) {
  if (stage==='interpret') return {value:interpret(payload)};
  if (stage==='quote') return {value:{quote:payload.evidence}};
  const detail = payload.sensoryChoices[0];
  return {value:narration ? narration(payload) : {
    reply:`我${detail.text}。${payload.requiredChange || '我重新看向眼前的情況。'}`,sensoryId:detail.id}};
}});
const submit = (coach,s,text,extra={})=>coach.turn(s.sessionId,{requestId:`step22-test-${s.revision}`,revision:s.revision,text,...extra});
const close = '我把房門帶上';
const seal = '拿濕毛巾堵住門底下那條縫';

test('executes distinct ordered evidence across nodes and replays with identical graded state',async()=>{
  const coach = new ConversationCoach(provider(p=>action(p.text.includes('濕毛巾') ? [proposal('close',close),proposal('seal',seal)] : [])));
  const first = coach.create('drill_fire_dorm');
  const next = await submit(coach,first,`${close}，再${seal}`);
  assert.equal(next.state.node,'report');
  assert.deepEqual(next.decision.actionIds,['close','seal']);
  assert.deepEqual(next.decision.actionBatches,[{ids:['close'],source:'model'},{ids:['seal'],source:'model'}]);
  assert.deepEqual(next.decision.actionValidation.map(row=>row.result),['ACCEPTED','ACCEPTED']);
  for (let index=0;index<5;index++) assert.deepEqual(Engine.replayDecisions(specs.get(first.scenarioId),next.decisions),next.state);
});

test('keeps the executed prefix, rejects out-of-order evidence, and skips suffix actions',async()=>{
  const coach = new ConversationCoach(provider(()=>action([proposal('close',close),proposal('wait','我先等人'),proposal('seal',seal)])));
  const first = coach.create('drill_fire_dorm');
  const next = await submit(coach,first,`${close}，我先等人，再${seal}`);
  assert.deepEqual(next.decision.actionIds,['close']);
  assert.equal(next.decision.validation,'MODEL_ACTION_UNAVAILABLE');
  assert.equal(next.stopped,true);
  const outOfOrder = new ConversationCoach(provider(()=>action([proposal('close',close),proposal('seal',seal)])));
  const second = await submit(outOfOrder,outOfOrder.create('drill_fire_dorm'),`${seal}，再${close}`);
  assert.deepEqual(second.decision.actionIds,['close']);
  assert.equal(second.decision.validation,'MODEL_EVIDENCE');
});

test('independent raw danger blocks later acts and preserves an earlier verified action',async()=>{
  const coach = new ConversationCoach(provider(()=>action([proposal('close',close),proposal('seal',seal)])));
  const first = coach.create('drill_fire_dorm');
  const next = await submit(coach,first,`${close}，再搭電梯，然後${seal}`);
  assert.deepEqual(next.decision.actionBatches,[{ids:['close'],source:'model'},{ids:['elevator'],source:'rule'}]);
  assert.equal(next.decision.validation,'RULE_DANGER_OVERRIDE');
  assert.equal(next.state.injuryLevel,'NOT_ASSESSED');
  assert.match(next.reply,/^「搭電梯」/);
  assert.deepEqual(Engine.replayDecisions(specs.get(first.scenarioId),next.decisions),next.state);
});

test('refusal preserves the clock and previous invalid count; hints shuffle once and hide upon switching points',async()=>{
  let randomCalls = 0;
  const coach = new ConversationCoach(provider(()=>noAction),{random:()=>{randomCalls++;return 0;}});
  let state = coach.create('drill_fire_dorm');
  assert.deepEqual(state.suggestions,[]);
  state = await submit(coach,state,'我瞬移到外面');
  assert.deepEqual(state.suggestions,[]);
  const firstInvalid = state.state;
  state = await submit(coach,state,'我拒絕搭電梯');
  assert.deepEqual(state.state,firstInvalid);
  assert.deepEqual(state.decision.actionIds,[]);
  assert.equal(state.decision.validation,'RULE_REFUSAL');
  assert.deepEqual(state.suggestions,[]);
  state = await submit(coach,state,'我的晚餐是披薩');
  assert.equal(state.decision.hint_trigger,'invalid_streak');
  assert.equal(state.decision.hint_shown_turn,4);
  assert.equal(state.decision.hint_shown,false);
  assert.deepEqual(state.decision.hint_exposure,{trigger:'invalid_streak',after_turn:3,first_eligible_turn:4});
  assert.equal(state.decision.hint_seen_before_submit,false);
  assert.equal(state.suggestions.length,3);
  const originalOrder = state.suggestions;
  state = await submit(coach,state,'',{intent:'hint',hintTrigger:'button'});
  assert.deepEqual(state.suggestions,originalOrder);
  assert.equal(randomCalls,2);
  state = await submit(coach,state,'我關好房門',{hintSelectedIndex:2,hintEditedBeforeSubmit:true});
  assert.equal(state.decision.hint_selected_index,2);
  assert.equal(state.decision.hint_edited_before_submit,true);
  assert.equal(state.decision.hint_seen_before_submit,true);
  assert.deepEqual(state.suggestions,[]);
  assert.deepEqual(Engine.replayDecisions(specs.get(state.scenarioId),state.decisions),state.state);
  for (const hintTrigger of ['button','idle']) {
    const initial = coach.create('earthquake_school');
    const hinted = await submit(coach,initial,'',{intent:'hint',hintTrigger});
    assert.deepEqual(hinted.state,initial.state);
    assert.equal(hinted.decision.hint_trigger,hintTrigger);
  }
  for (const spec of specs.values()) for (const node of spec.nodes) assert.equal(new Set(node.experience.suggestions).size,3);
});

test('emotion accepts verified evidence, preserves safety and records rule disagreement',async()=>{
  const coach = new ConversationCoach(provider(p=>({...noAction,emotion:'unsupportive',emotionEvidence:p.text})));
  let state = coach.create('drill_fire_dorm');
  state = await submit(coach,state,'我關好房門');
  state = await submit(coach,state,'小岑，先別開門。');
  const physical = {...state.state,npc:undefined,events:undefined};
  state = await submit(coach,state,'我聽見你擔心同學我陪你留在這裡');
  assert.deepEqual(state.decision.disagreement.emotion,{rule:'supportive',model:null});
  assert.equal(state.decision.emotion.category,'supportive');
  assert.deepEqual({...state.state,npc:undefined,events:undefined},physical);
  const other = new ConversationCoach(provider(p=>({...noAction,emotion:'supportive',emotionEvidence:p.text})));
  let model = await submit(other,other.create('drill_fire_dorm'),'我關好房門');
  model = await submit(other,model,'小岑，先別開門。');
  model = await submit(other,model,'小岑，我聽到你很怕，我在你旁邊。');
  assert.equal(model.decision.emotion.source,'model');
  assert.equal(model.state.npc.emotion,'supportive');
  assert.deepEqual(Engine.replayDecisions(specs.get(model.scenarioId),model.decisions),model.state);
});

test('a hazardous refusal using the action label leaves flood state and the invalid streak unchanged',async()=>{
  const coach = new ConversationCoach(provider(()=>noAction));
  const initial = await submit(coach,coach.create('flood_low_home'),'我召喚一條龍');
  const refusal = await submit(coach,initial,'我不會游泳穿越積水');
  assert.deepEqual(refusal.state,initial.state);
  assert.equal(refusal.decision.validation,'RULE_REFUSAL');
  assert.deepEqual(refusal.suggestions,[]);
  assert.match(refusal.reply,/拒絕的做法排除/);
  assert.doesNotMatch(refusal.reply,/「游泳穿越積水」/);
});

test('an accepted engine rescue cannot be described as ongoing waiting',async()=>{
  const coach = new ConversationCoach(provider(()=>noAction,payload=>{
    const detail = payload.sensoryChoices[0];
    return {reply:`我${detail.text}。${payload.requiredChange}我仍在房內等待。`,sensoryId:detail.id};
  }));
  let state = coach.create('drill_fire_dorm');
  for (const text of ['我關好房門','我打119','安學路100號A棟，五樓503室','我留在房內待救','我保持通訊'])
    state = await submit(coach,state,text);
  assert.equal(state.state.endingType,'SAFE_RESCUE');
  assert.match(state.reply,/並接手/);
  assert.doesNotMatch(state.reply,/仍在房內等待/);
  assert.ok(state.decision.narration_checks.every(entry=>entry.failures.includes('unsupported_content') || entry.failures.includes('voice_or_sentence_count')));
});

test('narration checker rejects length, quotes, banned structure, sensory repetition and missing change',()=>{
  const options = {text:'我瞬移出去',details:[{id:'smoke',text:'看見濃煙'},{id:'door',text:'摸到門板'}],
    previous:['smoke'],change:'我又等了一會兒。',unsupported:()=>false};
  assert.deepEqual(checkNarration({reply:'我摸到門板。我又等了一會兒。',sensoryId:'door'},options).failures,[]);
  const reply = '我收到你說的「我搭電梯」。我看見濃煙。'+'啊'.repeat(120);
  assert.deepEqual(checkNarration({reply,sensoryId:'smoke'},options).failures,
    ['length','banned_pattern','quote_mismatch','repeated_sensory_detail','missing_scene_change']);
  assert.ok(checkNarration({reply:'我看見滴水。我又等了一會兒。',sensoryId:'door'},options).failures.includes('ungrounded_sensory_detail'));
  const refused = {...options,refused:true,change:'',text:'我不會游出去'};
  assert.ok(checkNarration({reply:'我摸到門板。我還沒確定這是不是我的決定。',sensoryId:'door'},refused).failures.includes('contradicted_refusal'));
});
