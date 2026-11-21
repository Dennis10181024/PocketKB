'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const {ConversationCoach}=require('../coach');
const V3=require('../../web-pwa/scenario-engine-v3');
const Quality=require('../quality');
const inputs=require('./human-replay-sets.json');

const fire='drill_fire_dorm',school='earthquake_school';
function provider(assess) {
  return {ready:true,async generate(stage,payload) {
    assert.equal(stage,'assess');
    return {value:assess(payload)};
  }};
}
const tagged=(ids,evidence)=>ids.map(id=>({id,evidence}));
const proposal=(text,ids,fields=[],category='good')=>({category,evidence:text,matches:tagged(ids,text),
  fields:tagged(fields,text),hazard:'',hazardEvidence:''});
const submit=(coach,s,text)=>coach.turn(s.sessionId,{revision:s.revision,requestId:'quality-test-'+s.revision,text});

test('the authored points have unique IDs, two to four sourced principles and two E probes',()=>{
  const coach=new ConversationCoach(provider(()=>{}),{formal:true,quality:true});
  for(const [id,count] of [[fire,8],[school,9]]) {
    const spec=coach.specs.get(id),points=Quality.points(spec);
    assert.equal(points.length,count);
    assert.equal(new Set(points.map(item=>item.node)).size,count);
    for(const item of points) {
      assert.ok(item.principles.length>=2 && item.principles.length<=4);
      assert.ok(item.situation && item.mistake && item.question.includes('？'));
      assert.equal(inputs.E.probes[id][item.node].length,2);
      for(const p of item.principles) assert.ok(spec.sources.some(source=>source.id===p.source),p.source);
    }
  }
});

test('D1 keeps the call and seal; one phone follow-up, compounds and quality replay reach the same ending',async()=>{
  const d=inputs.D.inputs.map(item=>item.text);
  const model=({text})=>{
    if(text===d[0]) return {...proposal(text,[]),matches:[
      {id:'stop_roommate',evidence:'跟小岑說千萬不能開門'},{id:'barrier',evidence:'把門關緊'},
      {id:'dial',evidence:'用手機撥通119'},{id:'seal_gap',evidence:'堵住門縫跟口鼻'},
      {id:'signal',evidence:'將窗戶打開大聲呼救'}]};
    if(text===d[1]) return {...proposal(text,[]),matches:[{id:'ground',evidence:'先顧好自己'}],
      fields:[{id:'condition',evidence:'外面有濃煙'}]};
    if(text===d[4]) return proposal(text,['handoff','keep_contact'],['room'],'acceptable');
    return proposal(text,['wait_inside'],[],'acceptable');
  };
  const rows=[];
  const coach=new ConversationCoach(provider(model),{formal:true,quality:true,logText:false,record:row=>rows.push(row)});
  let s=await submit(coach,coach.create(fire),d[0]);
  assert.equal(s.state.node,'report');
  assert.equal(s.state.quality.met.dial,'isolate');
  assert.equal(s.state.quality.met.seal_gap,'isolate');
  assert.match(s.reply,/接線員問.*樓層和房號.*受困人數/);
  assert.equal(rows[0].assessment.matches[0].evidence,'[redacted]');
  s=await submit(coach,s,d[1]);
  assert.equal(s.state.node,'wait');
  assert.ok(s.decision.completed_points.some(p=>p.node==='smoke_gap'&&p.remembered));
  assert.doesNotMatch(s.reply,/接線員問/);
  assert.match(s.scene.node.task,/503有人嗎/);
  s=await submit(coach,s,d[4]);
  assert.equal(s.state.quality.report.room,true);
  assert.equal(s.terminal,false,'a room number never confirms rescue handoff');
  assert.equal(s.decision.assessment.matches.length,0);
  s=await submit(coach,s,d[8]);
  assert.equal(s.terminal,true);
  assert.equal(s.state.endingType,'SAFE_RESCUE');
  assert.ok(s.ending.lessons.some(item=>item.sources.length));
  assert.deepEqual(Quality.replay(coach.specs.get(fire),rows),s.state);
});

test('only quality turns matter for progression; embedded questions can be evidence of a safe action',async()=>{
  const coach=new ConversationCoach(provider(({text})=>proposal(text,['assess'])),{formal:true,quality:true});
  const s=coach.create(school),session=coach.sessions.get(s.sessionId);
  Object.assign(session.state,{node:'injured'});
  Object.assign(session.state.facts,{shaking:false,stairsChecked:true});
  const answer=await submit(coach,s,inputs.E.probes[school].injured[0]);
  assert.equal(answer.decision.assessment.category,'good');
  assert.equal(answer.state.node,'evacuate');
});

test('without an outside signal, the communication scene is reachable and power saving remains a bonus',()=>{
  const coach=new ConversationCoach(provider(()=>{}),{formal:true,quality:true});
  const spec=coach.specs.get(fire);
  const before=Quality.start(V3.create(spec,{onlineExperience:true}));
  before.node='window';
  Object.assign(before.quality.met,{barrier:'isolate',dial:'report'});
  const apply=(s,key,evidence)=>Quality.apply(spec,s,proposal(evidence,[key]));
  const battery=apply(before,'check_window','我從房內看窗外有沒有煙').state;
  assert.equal(battery.node,'battery');
  const bonus=apply(battery,'save_power','我關閉不用的程式').state;
  assert.equal(bonus.node,'battery');
  assert.ok(bonus.quality.met.save_power);
  const waiting=apply(bonus,'keep_contact','我繼續維持通話').state;
  assert.equal(waiting.node,'wait');
});

test('danger rules win against optimistic model output and protected language cannot execute danger',async()=>{
  const coach=new ConversationCoach(provider(({text})=>proposal(text,['barrier'])),{formal:true,quality:true});
  const fatal=await submit(coach,coach.create(fire),'我去搭電梯');
  assert.equal(fatal.decision.assessment.category,'dangerous');
  assert.equal(fatal.decision.disagreement.model,'good');
  assert.equal(fatal.state.endingType,'CRITICAL_FAILURE');
  assert.deepEqual(Quality.replay(coach.specs.get(fire),fatal.decisions),fatal.state);
  const schoolStart=coach.create(school);
  const risk=await submit(coach,schoolStart,'我現在跑到戶外');
  assert.equal(risk.decision.assessment.category,'dangerous');
  assert.equal(risk.state.exposure.trauma,2);
  assert.deepEqual(Quality.replay(coach.specs.get(school),risk.decisions),risk.state);
  const dissuasion=inputs.C.inputs[1];
  const schoolModel=new ConversationCoach(provider(({text})=>proposal(text,['stop_classmate'])),{formal:true,quality:true});
  const seeded=schoolModel.create(school);
  schoolModel.sessions.get(seeded.sessionId).state.node='classmate';
  const warning=await submit(schoolModel,seeded,dissuasion);
  assert.equal(warning.decision.assessment.category,'good');
  assert.equal(warning.state.npc.handled,true);
  assert.equal(warning.state.node,'worry');
  const liar=new ConversationCoach(provider(({text})=>({...proposal(text,[],[],'dangerous'),
    hazard:'elevator',hazardEvidence:text})),{formal:true,quality:true});
  for(const input of ['我不會搭電梯','如果我去搭電梯會怎樣？','有人去搭電梯']) {
    const s=await submit(liar,liar.create(fire),input);
    assert.equal(s.terminal,false,input);
    assert.ok(!s.state.events.some(event=>event.kind==='hazard'),input);
  }
  const oldFire=V3.formalSpec(coach.specs.get(fire));
  assert.equal(V3.rawStep(oldFire,V3.create(oldFire,{onlineExperience:true}),'我去搭電梯').kind,'failed');
});
