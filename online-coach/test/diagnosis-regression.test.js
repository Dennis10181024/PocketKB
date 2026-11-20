const {test} = require('node:test');
const assert = require('node:assert/strict');
const {ConversationCoach, specs} = require('../coach');
const V3 = require('../../web-pwa/scenario-engine-v3');

test('non-action language preserves exact state in both engines', () => {
  for (const [engine,id,danger] of [[V3,'drill_fire_dorm','搭電梯'],[V3,'earthquake_school','衝去搭電梯']]) {
    const spec=specs.get(id), state=engine.create(spec);
    for (const input of [`我只是想像${danger}`,`如果我${danger}會怎樣？`,`我不會${danger}`,`可以${danger}嗎？`]) {
      const actual=engine.step(spec,state,input);
      const {elapsed,consecutiveQuestions,...physicalState}=actual.state; assert.deepEqual(physicalState,state);
      assert.ok(actual.message.includes(input));
    }
  }
});

test('every declared condition rejects the action when removed or broken', () => {
  let requirements=0;
  for (const spec of specs.values()) {
    for (const action of spec.actions.filter(item=>item.requires)) {
      const node=spec.nodes.find(item=>item.available.includes(action.id));
      const ready={...V3.create(spec),node:node.id};
      Object.assign(ready.facts,action.requires.facts);
      for (const [key,rule] of Object.entries(action.requires.resources || {})) ready.resources[key]=rule.min;
      assert.ok(!['blocked','risk','clarify'].includes(V3.step(spec,ready,action.label).kind),action.id);
      for (const key of Object.keys(action.requires.facts || {})) {
        for (const value of [undefined,!ready.facts[key]]) {
          const unsafe={...ready,facts:{...ready.facts,[key]:value}};
          const result=V3.step(spec,unsafe,action.label);
          assert.equal(result.kind,action.unsafeWhenBlocked?'risk':'blocked');
          assert.deepEqual(result.state.accepted,ready.accepted);
        }
        requirements++;
      }
      for (const [key,rule] of Object.entries(action.requires.resources || {})) {
        const result=V3.step(spec,{...ready,resources:{...ready.resources,[key]:rule.min-1}},action.label);
        assert.equal(result.kind,'blocked'); requirements++;
      }
    }
  }
  assert.equal(requirements,10);
});

test('deadline discards late model output and commits one fallback for duplicate requests', async () => {
  let unblock;
  const slow = new Promise(resolve => {unblock=resolve;});
  const coach = new ConversationCoach({ready:true,model:'test',generate:()=>slow},{turnTimeoutMs:20});
  const initial=coach.create('drill_fire_dorm');
  const request={requestId:'test-timeout',revision:0,text:'我把房門關好'};
  const keepAlive=setInterval(()=>{},100);
  try {
    const result=await coach.turn(initial.sessionId,request);
    assert.equal(result.offline,true); assert.equal(result.state.node,'report');
    unblock({value:{intent:'action',understanding:'晚到',question:'',needsClarification:false,actions:[]}});
    assert.deepEqual(await coach.turn(initial.sessionId,request),result);
    assert.equal(coach.calls,1); assert.equal(coach.sessions.get(initial.sessionId).history.length,2);
  } finally {clearInterval(keepAlive);}
});
