const {test}=require('node:test');
const assert=require('node:assert/strict');
const {ConversationCoach,specs,actionCatalog}=require('../coach');
const Fire=require('../../web-pwa/fire-engine');
const V3=require('../../web-pwa/scenario-engine-v3');
const probes={
  drill_fire_dorm:['我從窗戶跳下去','我搭升降機下樓','我穿進走廊，開始穿過濃煙'],
  earthquake_school:['我在搖晃時跑到外面','地在晃我衝出去','我從窗戶跳下去'],
  earthquake_home_trapped:['我從倒塌物上爬出去','我挪開倒塌的櫃子逃出去','我踩過碎石爬出去'],
  flood_low_home:['我游出去','我開車通過積水','我用游的出去'],
  landslide_mountain_road:['我開進封閉路段','我闖過封鎖線','我走溪谷捷徑'],
  barrier_lake_downstream:['我跳進河裡','我跑到溪邊看','我去橋上看'],
};
const clarify={intent:'clarify',needsClarification:true,actions:[],question:'',understanding:'待釐清'};
let request=0;
const turn=(coach,s,input)=>coach.turn(s.sessionId,{requestId:'step06-'+ ++request,revision:s.revision,text:input});

test('raw hazard overrides missing model proposals, but explicit non-action does not cause failure',async()=>{
  const coach=new ConversationCoach({ready:true,model:'test',async generate(stage){return {value:stage==='interpret'?clarify:{reply:'已收到這項輸入。'}};}},{maxSessions:100});
  for(const [id,inputs] of Object.entries(probes)) for(const text of inputs) {
    const result=await turn(coach,coach.create(id),text);
    assert.equal(result.kind,'failed',text);
    assert.ok(result.disagreement,text);
    assert.ok(result.citations.length,text);
  }
  const past=await turn(coach,coach.create('landslide_mountain_road'),'我開過封閉路段');
  assert.equal(past.terminal,false);
  assert.match(past.reply,/尚未執行.*風險/);
  assert.ok(past.disagreement);
  const hypothetical=await turn(coach,coach.create('earthquake_school'),'如果我衝去搭電梯會怎樣？');
  assert.equal(hypothetical.terminal,false);
  assert.equal(hypothetical.state.elapsed,undefined);
});

test('each catalog has every node hazard and each action and event has valid sources',()=>{
  for(const spec of specs.values()) {
    const sourceIds=spec.sources.map(source=>source.id);
    for(const item of [...spec.actions,...(spec.hazards||[]),...spec.deterioration,...spec.nodes.flatMap(n=>n.timedEvents||[])])
      assert.ok(item.sourceIds.length && item.sourceIds.every(id=>sourceIds.includes(id)), item.id);
    for(const node of spec.nodes) for(const id of Object.keys(node.hazards||{}))
      assert.ok(actionCatalog(spec,node).some(action=>action.id===id && action.danger),id);
  }
});

test('each rule engine advances two nonterminal events and allows a question grace period',()=>{
  for(const spec of specs.values()) {
    const engine=spec.id==='drill_fire_dorm'?Fire:V3;
    let state=engine.create(spec);
    for(let i=0;i<4;i++) state=engine.step(spec,state,'哈哈哈').state;
    assert.equal(state.elapsed,4);
    assert.equal(state.events.filter(e=>e.eventId).length,2);
    assert.ok(!['FAILED','COMPLETED'].includes(state.sessionStatus || state.outcome));
    state=engine.create(spec);
    for(let i=0;i<3;i++) state=engine.step(spec,state,'現在情況怎麼樣？','question').state;
    assert.equal(state.elapsed,1);
  }
});

test('out-of-spec directives are regenerated once then fall back to authoritative template',async()=>{
  let narrations=0;
  const coach=new ConversationCoach({ready:true,model:'test',async generate(stage){
    if(stage==='interpret') return {value:{...clarify,intent:'off_topic'}};
    narrations++;
    return {value:{reply:'建議搭電梯離開。'}};
  }});
  const s=coach.create('drill_fire_dorm');
  coach.sessions.get(s.sessionId).state.elapsed=1;
  const result=await turn(coach,s,'我要吃雞排');
  assert.equal(narrations,2);
  assert.equal(result.narration,'template');
  assert.doesNotMatch(result.reply,/搭電梯/);
  assert.equal(result.state.elapsed,2);
});
