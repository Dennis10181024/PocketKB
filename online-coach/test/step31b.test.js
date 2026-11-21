'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {ConversationCoach,specs}=require('../coach');
const V3=require('../../web-pwa/scenario-engine-v3');

const fire='drill_fire_dorm';
const makeAction=(id,evidence,confidence='high')=>({id,evidence,confidence});
const resultOf=(actions=[])=>({intent:'action',needsClarification:false,understanding:'',question:'',actions,emotion:'none',emotionEvidence:''});
function coachFor(interpret,records=[]) {
  return new ConversationCoach({ready:true,async generate(stage,payload){
    if (stage==='interpret') return {value:resultOf(interpret(payload))};
    return {value:{reply:'',sensoryId:'',quote:''}};
  }},{formal:true,logText:true,record:row=>records.push(row)});
}
const send=(coach,state,text)=>coach.turn(state.sessionId,{revision:state.revision,requestId:'step31b-turn-'+state.revision,text});
const fixture=[
  ['我會去把門關起來 並跟小岑說不能開門並找濕毛巾把門縫塞住，然後找濕毛巾摀住自己的口鼻，接著找到教室的對外窗把窗戶打開，大聲向外面呼救',
    [makeAction('close','我會去把門關起來'),makeAction('npc_dissuade','跟小岑說不能開門'),makeAction('seal','找濕毛巾把門縫塞住'),makeAction('towel_face','找濕毛巾摀住自己的口鼻')],['close','seal','towel_face'], 'report'],
  ['跟他說，開一條縫也不行，門一定要緊閉。',[makeAction('npc_dissuade','跟他說，開一條縫也不行')],[], 'report'],
  ['把門關起來並找濕毛巾把門縫堵上',[makeAction('close','把門關起來'),makeAction('seal','找濕毛巾把門縫堵上')],[], 'report'],
  ['打電話給 119，並跟他說我們的地址跟現在遇到的情況',[makeAction('call','打電話給 119'),makeAction('address','我們的地址'),makeAction('smoke_report','現在遇到的情況')],['call','address','smoke_report'], 'report'],
  ['先打 119 跟他們說現在我們遇到的情況，然後待在教室把門關緊、不要亂動，保持冷靜，降低呼吸的頻率以免氧氣消耗太快',
    [makeAction('call','先打 119'),makeAction('smoke_report','現在我們遇到的情況')],[], 'report'],
  ['跟裡面的人說，外面濃煙很重',[],[], 'report'],
  ['把煙的情況告訴 119 接線員',[makeAction('smoke_report','把煙的情況告訴 119 接線員')],[], 'report'],
  ['我打119，說安學路100號A棟宿舍五樓503室，兩人受困、走廊都是煙。',
    [makeAction('address','安學路100號A棟宿舍'),makeAction('room','五樓503室'),makeAction('headcount','兩人'),makeAction('smoke_report','走廊都是煙')],['room','headcount'], 'feelings'],
  ['跟她說絕對不行開門',[makeAction('npc_dissuade','跟她說絕對不行開門')],[], 'feelings'],
  ['跟他說不能開門',[makeAction('npc_dissuade','跟他說不能開門')],[], 'feelings'],
  ['小岑先不要把門打開，聽電話那頭怎麼說。',[makeAction('npc_dissuade','小岑先不要把門打開')],[], 'feelings'],
  ['堅決不能開門 等待接線員指示',[makeAction('npc_dissuade','堅決不能開門')],[], 'feelings'],
];

test('original first twelve turns retain concrete, idempotent fire decisions',async()=>{
  const coach=coachFor(({text,semanticGoals})=>{
    assert.ok(semanticGoals.some(goal=>goal.id==='npc_dissuade'));
    return fixture.find(row=>row[0]===text)[1];
  });
  let state=coach.create(fire);
  for(const [i,[text,proposals,ids,node]] of fixture.entries()){
    state=await send(coach,state,text);
    assert.deepEqual(state.decision.actionIds,ids,'T'+(i+1));
    assert.equal(state.state.node,node,'T'+(i+1));
    assert.equal(state.state.npc.handled,true);
    assert.equal(state.state.npc.emotion,null);
    assert.doesNotMatch(state.reply,/系統攔下|你打算/);
    if(i===0) assert.ok([...state.reply].length<=120,state.reply);
    if(proposals.some(item=>item.id==='npc_dissuade'))
      assert.ok(state.decision.actionValidation.some(item=>item.id==='npc_dissuade' && item.result==='ACCEPTED'));
    if(i===3) assert.match(state.reply,/接線員問：「在幾樓、哪一間？/);
  }
});

test('high semantic match can exceed rule vocabulary; low and medium are never treated as consent',async()=>{
  const input='我會去讓出入口只剩門板擋著';
  const spec=V3.formalSpec(specs.get(fire));
  assert.equal(V3.rawStep(spec,V3.create(spec,{onlineExperience:true}),input).kind,'clarify');
  const rows=[];
  const coach=coachFor(({text})=>[makeAction('close',text,text===input?'medium':'low')],rows);
  const start=coach.create(fire);
  const low=await send(coach,start,'我弄一下那個好了');
  assert.equal(low.state.node,'isolate');
  const medium=await send(coach,low,input);
  assert.equal(medium.kind,'confirm');
  assert.equal(medium.state.node,'isolate');
  assert.equal(medium.state.elapsed,low.state.elapsed);
  assert.match(medium.reply,/小岑問：「是要關好房門嗎？/);
  const confirmed=await send(coach,medium,'好');
  assert.deepEqual(confirmed.decision.actionIds,['close']);
  assert.equal(rows.at(-1).actionValidation[0].confirmed,true);
  assert.equal(rows.at(-1).actionValidation[0].confidence,'medium');
  assert.equal(V3.replayDecisions(spec,confirmed.decisions).node,confirmed.state.node);
  const high=coachFor(({text})=>[makeAction('close',text)]);
  const accepted=await send(high,high.create(fire),input);
  assert.deepEqual(accepted.decision.actionIds,['close']);
  const noProposal=coachFor(()=>[]);
  const deferred=await send(noProposal,noProposal.create(fire),'我把房門關好');
  assert.deepEqual(deferred.decision.actionIds,[]);
});

test('explicit danger still wins, protected speech and self-negation never execute',async()=>{
  const coach=coachFor(({text})=>[makeAction(text.includes('電梯')?'elevator':'close',text.includes('電梯')?'搭電梯':'關門','low')]);
  const danger=await send(coach,coach.create(fire),'我現在就搭電梯下樓');
  assert.equal(danger.state.endingType,'CRITICAL_FAILURE');
  for(const text of ['假設我搭電梯呢？','我不會搭電梯','我看到同學搭電梯','我不關門']){
    const guarded=await send(coach,coach.create(fire),text);
    assert.equal(guarded.state.endingType,null,text);
    assert.deepEqual(guarded.decision.actionIds,[],text);
  }
});

test('towel for a closed door is action; blocked seal and going elsewhere remain distinct',()=>{
  const spec=V3.formalSpec(specs.get(fire));
  const state=V3.create(spec,{onlineExperience:true});
  const blocked=V3.rawStep(spec,state,'我拿濕毛巾把門縫塞住');
  assert.equal(blocked.kind,'blocked');
  assert.match(blocked.message,/門扇和門框/);
  const compound=V3.rawStep(spec,state,fixture[2][0]);
  assert.deepEqual(V3.adoptedActionIds(state,compound.state),['close','seal']);
  const notConnected=V3.rawStep(spec,compound.state,'五樓503室');
  assert.deepEqual(V3.adoptedActionIds(compound.state,notConnected.state),[]);
  assert.equal(V3.rawStep(spec,state,'我離開房間去找濕毛巾').kind,'risk');
});

test('school report slots accept multiple values and ask for only the missing value',()=>{
  const spec=V3.formalSpec(specs.get('earthquake_school'));
  const state={...V3.create(spec,{onlineExperience:true}),node:'assembly'};
  const partial=V3.rawStep(spec,state,'我回報二年二班，大家在操場集合點');
  assert.deepEqual(V3.adoptedActionIds(state,partial.state),['school_class','school_location']);
  assert.match(partial.outcomes.at(-1),/老師問：「有幾人受傷/);
  const complete=V3.rawStep(spec,partial.state,'我回報一位同學腳踝受傷');
  assert.equal(complete.state.node,'return_choice');
});

test('a high-confidence action can cite evidence across a comma without being dropped',()=>{
  const spec=V3.formalSpec(specs.get(fire));
  const start=V3.create(spec,{onlineExperience:true});
  const state={...start,node:'window'};
  const input='我到窗邊揮衣服，從房內向外示意。';
  const action=makeAction('signal_window','我到窗邊揮衣服，從房內向外示意');
  assert.equal(V3.validateSafeEvidence(spec,state,input,action),null);
  const result=V3.formalStep(spec,state,input,'action',[action]);
  assert.deepEqual(V3.adoptedActionIds(state,result.state),['signal_window']);
  assert.equal(result.state.node,'smoke_gap');
});
