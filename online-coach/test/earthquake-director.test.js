'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const cases=require('./earthquake-director-cases.json');
const {createDirector}=require('../director-engine');
const {ConversationCoach}=require('../coach');
const d=require('../director-registry').get('earthquake_school');

test('the narrator cannot turn staying with a worried classmate into a promise to contact family',()=>{
  const state=d.start();
  state.facts.npcVoiced=true;
  const text='我陪你先等老師指示';
  const out=d.apply(state,{matches:[{id:'reassure',evidence:text}]});
  assert.deepEqual(d.narrationInput(state,out,text,[]).acceptedEvidence,[{id:'reassure',evidence:text}]);
  assert.doesNotMatch(d.compose(out,'我答應小維到安全處再聯絡家裡。'),/聯絡家裡/);
});

for(const row of cases) test(`school draft ${row.draft}${row.n}: ${row.expected}`,()=>{
  const state=d.start();
  if (row.n===19 || row.n===20 || row.expected==='fatal' && /電梯|升降|電線/.test(row.text))
    Object.assign(state.facts,{mainShake:false,shaking:false,routeReady:true,outdoors:true});
  const literal=d.literalDanger(row.text,state.facts);
  const validated=d.validate(state,row.text,{});
  if (row.expected==='fatal' || row.expected==='exposure') {
    assert.equal(d.HAZARDS[literal?.id]?.kind,row.expected,row.text);
    assert.equal(validated.pendingDanger?.id,literal.id,'model disagreement must go to confirm');
  } else {
    assert.equal(d.ruleAssessment(state,row.text).danger,null,row.text);
    if(row.expected==='good') assert.ok(d.ruleAssessment(state,row.text).matches.length,row.text);
  }
});

test('each occurrence is checked and a hazard applies only while its fact predicate passes',()=>{
  assert.equal(d.literalDanger('我不搭電梯，但我後來決定搭電梯下樓',d.start().facts)?.id,'elevator');
  const script=require('../director-scenarios/earthquake-school');
  const configurable=createDirector({...script,hazards:{
    conditional:{kind:'fatal',pattern:/危險選擇/,when:f=>f.canEscape,text:'後果',teach:'原因'},
  }});
  assert.equal(configurable.literalDanger('我的危險選擇',{canEscape:false}),null);
  assert.equal(configurable.literalDanger('我的危險選擇',{canEscape:true})?.id,'conditional');
});

test('school session: rewind metrics, then corrected evacuation; observations do not spend time',async()=>{
  const coach=new ConversationCoach({ready:false,generate(){throw new Error('no API permitted for unit test');}},
    {formal:true,quality:true,director:true,logText:false});
  let state=coach.create('earthquake_school');
  let i=0;
  const send=async(text,intent='action')=>{
    state=await coach.turn(state.sessionId,{requestId:'school-metrics-'+i++,text,intent,revision:state.revision});return state;
  };
  await send('','observe');
  assert.equal(state.state.director.clock,0);
  assert.equal(state.decision.director_research.first_decision_safe,null);
  await send('我跨出窗台');
  assert.equal(state.kind,'rewind');
  assert.equal(state.state.director.clock,0);
  assert.equal(state.decision.director_research.first_decision_safe,false);
  assert.deepEqual(state.researchRecord.director_research.rewind_hazards,['jump_window']);
  for(const text of ['我躲桌下抓住桌腳，叫小維不要跑','我等不搖了再走','餘震時我就地護頭','我走樓梯到操場，不推不跑','老師點名我答到']) {
    if (!state.terminal) await send(text);
  }
  assert.equal(state.terminal,true);
  assert.equal(state.decision.director_research.completed_after_rewind,true);
  assert.match(state.review,/修正後完成撤離或獲救：是/);
  const {lastText,...live}=state.state.director;
  assert.deepEqual(d.replay(state.decisions),live);
});
