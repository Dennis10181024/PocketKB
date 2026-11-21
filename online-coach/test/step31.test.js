'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {ConversationCoach,specs}=require('../coach');
const V3=require('../../web-pwa/scenario-engine-v3');

const fire='drill_fire_dorm',school='earthquake_school';
const firePath=[
  ['isolate','我關門','我徒手抓住熱門把','risk'],
  ['report','我打119，安學路100號A棟宿舍五樓503室，兩人受困，走廊都是煙','我把手機關掉','risk'],
  ['roommate','小岑不要把門打開','我打開房門','risk'],
  ['feelings','我聽見你擔心同學我陪你留在這裡','小岑，放心，我保證大家都沒事。','emotion'],
  ['window','我到窗邊揮衣','我跳窗','failed'],
  ['smoke_gap','我塞住門縫','我去找濕毛巾','risk'],
  ['battery','我保持通話','我把手機關掉','risk'],
  ['wait','我依消防員指示','我搭電梯','failed'],
];
const schoolPath=[
  ['shaking','我趴下躲到桌下護住頭頸抓穩桌腳','我在地震搖晃中跑到戶外','risk'],
  ['classmate','小維不要往外跑','我在地震搖晃中跑到戶外','risk'],
  ['worry','我知道你擔心家人等老師確認動線後我陪你聽指示','小維，我保證你家人都不會有事。','emotion'],
  ['main_stop','我等待地震停止','我在地震搖晃中跑到戶外','risk'],
  ['aftershock','我重新趴下躲到桌下抓穩','我在地震搖晃中跑到戶外','risk'],
  ['injured','我告訴老師同學腳踝受傷','我硬拉同學站起來','risk'],
  ['evacuate','我依照老師走樓梯','我返回教室拿書包','risk'],
  ['assembly','我回報二年二班在操場有一位同學腳踝受傷','我離開操場去找朋友','risk'],
  ['return_choice','我留在集合點等消息','我返回教室拿手機','risk'],
];
const submit=(coach,s,text)=>coach.turn(s.sessionId,{requestId:'step31-'+s.revision,revision:s.revision,text});
async function play(id,path,{prefix=[],alternate={},pauseAt,extra=[]}={}){
  const coach=new ConversationCoach({ready:false},{formal:true});
  let s=coach.create(id);
  for(const text of prefix)s=await submit(coach,s,text);
  for(const [node,good] of path){
    if(s.state.node!==node)continue; // An explicit NPC skip or injury can branch around a checkpoint.
    if(node===pauseAt)break;
    s=await submit(coach,s,alternate[node]||good);
  }
  for(const text of extra)s=await submit(coach,s,text);
  return s;
}
for (const [id,path,best] of [[fire,firePath,'SAFE_RESCUE'],[school,schoolPath,'SELF_EVACUATION']]){
  test(id+' formal checkpoints, sources, two escalating events and action replay',async()=>{
    const spec=V3.formalSpec(specs.get(id));
    const coach=new ConversationCoach({ready:false},{formal:true});
    let s=coach.create(id);
    for(const [node,good,bad,result] of path){
      assert.equal(s.state.node,node);
      assert.equal(s.scene.node.experience.suggestions.length,3);
      const fork=V3.step(spec,s.state,bad);
      if(result==='emotion')assert.equal(fork.state.npc.emotion,'unsupportive');
      else assert.equal(fork.kind,result,bad);
      s=await submit(coach,s,good);
    }
    assert.equal(s.state.endingType,best);
    assert.equal(s.state.injuryLevel,'NONE');
    assert.ok(new Set(s.state.events.filter(event=>event.kind==='environment_change').map(e=>e.eventId)).size>=2);
    const replay=V3.replayDecisions(spec,s.decisions);
    assert.equal(replay.endingType,best);
    assert.deepEqual(replay.exposure,s.state.exposure);
    for(const action of spec.actions)for(const source of action.sourceIds || [])assert.ok(spec.sources.some(entry=>entry.id===source),source);
  });
}
test('dorm endpoints cover ignoring the NPC and all injury thresholds',async()=>{
  assert.equal((await play(fire,firePath,{alternate:{roommate:'我請接線員和小岑說話'}})).state.endingType,'DELAYED_RESCUE');
  const mild=await play(fire,firePath,{prefix:['我徒手抓住熱門把']});
  assert.equal(mild.state.node,'first_aid');
  const spec=V3.formalSpec(specs.get(fire));
  assert.equal(V3.step(spec,mild.state,'我拿冰塊敷').state.sessionStatus,'ACTIVE');
  assert.equal(V3.step(spec,mild.state,'沖脫泡蓋送').state.sessionStatus,'COMPLETED');
  const delayedMild=await play(fire,firePath,{prefix:['我徒手抓住熱門把'],alternate:{roommate:'我請接線員和小岑說話'}});
  assert.equal(delayedMild.state.endingType,'DELAYED_RESCUE');
  assert.equal(delayedMild.state.injuryLevel,'MILD');
  assert.equal(V3.step(spec,delayedMild.state,'沖脫泡蓋送').state.sessionStatus,'COMPLETED');
  for(const [rounds,level] of [[1,'MODERATE'],[2,'SEVERE']]){
    const s=await play(fire,firePath,{prefix:Array(rounds).fill('我先等一下')});
    assert.equal(s.state.endingType,'DELAYED_RESCUE');
    assert.equal(s.state.injuryLevel,level);
  }
  assert.equal((await play(fire,[],{prefix:['我搭電梯']})).state.endingType,'CRITICAL_FAILURE');
});
test('school endpoints cover ignoring the NPC, injury, return and handoff',async()=>{
  assert.equal((await play(school,schoolPath,{alternate:{classmate:'我請老師先攔小維'}})).state.endingType,'DELAYED_RESCUE');
  assert.equal((await play(school,schoolPath,{prefix:['我在地震搖晃中跑到戶外']})).state.injuryLevel,'MILD');
  const delayedMild=await play(school,schoolPath,{prefix:['我在地震搖晃中跑到戶外'],alternate:{classmate:'我請老師先攔小維'}});
  assert.equal(delayedMild.state.endingType,'DELAYED_RESCUE');
  assert.equal(delayedMild.state.injuryLevel,'MILD');
  const errors={alternate:{return_choice:'我返回教室拿手機'}};
  const pending=await play(school,schoolPath,{...errors,extra:['我先自己回教室拿東西']});
  assert.equal(pending.state.node,'injury_handoff');
  assert.equal(pending.state.sessionStatus,'ACTIVE');
  const s=await play(school,schoolPath,{...errors,extra:['我向老師回報我在二樓走廊，腳踝受傷，需要協助']});
  assert.equal(s.state.endingType,'DELAYED_RESCUE');
  assert.equal(s.state.injuryLevel,'MODERATE');
  assert.equal((await play(school,[],{prefix:['我衝去搭電梯']})).state.endingType,'CRITICAL_FAILURE');
});
test('specific compound phrases from the dialogues keep their safe meaning',async()=>{
  const ss=V3.formalSpec(specs.get(school)), fs=V3.formalSpec(specs.get(fire));
  const shaking=V3.create(ss,{onlineExperience:true});
  assert.equal(V3.step(ss,shaking,'我趴低鑽到桌底下，抓著桌腳不放').state.node,'classmate');
  assert.deepEqual(V3.step(ss,shaking,'我先用書包擋住頭，蹲低不要站著').state.accepted,['padding_head']);
  assert.equal(V3.step(ss,shaking,'我不趴低鑽到桌底下，抓著桌腳不放').state.node,'shaking');
  const injury=(await play(school,schoolPath,{pauseAt:'injured'})).state;
  for(const phrase of ['我先問他腳怎麼了，告訴老師同學腳踝很痛，需要人幫忙',
    '老師，這裡有同學腳踝很痛，他說站不起來，我先不把他拉起來']){
    assert.equal(V3.step(ss,injury,phrase).state.node,'evacuate');
  }
  const battery=(await play(fire,firePath,{pauseAt:'battery'})).state;
  assert.equal(V3.step(fs,battery,'手機快沒電，我先關掉不用的背景程式，不要掛電話').state.node,'wait');
  assert.equal(V3.step(fs,battery,'我把手機關掉').kind,'risk');
});
