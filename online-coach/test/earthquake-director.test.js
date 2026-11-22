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
    Object.assign(state.facts,{mainShake:false,shaking:false,routeReady:true,outdoors:row.n!==20});
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

test('fatal decisions end, debrief retry restores previous progress, and the same session can complete',async()=>{
  const coach=new ConversationCoach({ready:false,generate(){throw new Error('no API permitted for unit test');}},
    {formal:true,quality:true,director:true,logText:false});
  let state=coach.create('earthquake_school');
  const sessionId=state.sessionId;
  let i=0;
  const send=async(text,intent='action',hintTrigger)=> {
    state=await coach.turn(sessionId,{requestId:'school-metrics-'+i++,text,intent,hintTrigger,revision:state.revision});
    return state;
  };
  await send('','observe');
  assert.equal(state.state.director.clock,0);
  assert.equal(state.state.directorResearch.first_decision_safe_rate,null);
  await send('我躲桌下抓住桌腳，叫小維不要跑');
  await send('我陪小維留在掩護處，等搖晃停了再走');
  await send('餘震時我就地護頭');
  const saved=structuredClone(state.state.director);
  await send('我去搭電梯');
  assert.equal(state.kind,'failed');
  assert.equal(state.state.directorResearch.fatal_error_count,1);
  assert.equal(state.canRetry,true);
  assert.match(state.review,/關鍵轉折.*\n.*「我去搭電梯」/);
  assert.equal(state.researchRecord.director.inputEvidence,'[redacted]');
  await send('','retry_decision');
  assert.equal(state.sessionId,sessionId);
  assert.equal(state.attempt,2);
  assert.deepEqual(state.state.director,saved);
  assert.equal(state.terminal,false);
  for(const text of ['我用書包護頭，跟老師走樓梯，不推不跑','我繞開電線到操場','我留在本班集合處','老師點名我答到']) {
    await send(text);
  }
  assert.equal(state.terminal,true);
  assert.equal(state.state.endingType,'SELF_EVACUATION');
  assert.equal(state.state.injuryLevel,'NONE');
  assert.ok(state.state.directorResearch.retry_completed);
  assert.deepEqual(state.state.directorResearch.retry_outcome,{type:'SELF_EVACUATION',injury:'NONE'});
  const {lastText,...live}=state.state.director;
  assert.deepEqual(d.replay(state.decisions),live);
});