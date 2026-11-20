const {test}=require('node:test');
const assert=require('node:assert/strict');
const {ConversationCoach,specs,unsupportedBehavior}=require('../coach');
const V3=require('../../web-pwa/scenario-engine-v3');
const {safe}=require('./step07-cases');
const nominal={intent:'clarify',needsClarification:true,actions:[],question:'',understanding:'待釐清'};
const decide=text=>({requestId:'step07-'+Math.random(),revision:0,text});

test('48 negative, causal denial, advice to others and observation examples cannot trigger danger',async()=>{
  const coach=new ConversationCoach({ready:true,model:'test',async generate(stage,payload){
    const proposed=payload.actionCatalog?.find(a=>a.danger);
    return {value:stage==='interpret' ? { ...nominal,intent:'action',needsClarification:false,
      actions:proposed ? [{id:proposed.id,evidence:payload.text}] : [] } : {reply:'你應該搭電梯。'}};
  }});
  for(const row of safe) {
    const spec=specs.get(row.scenario), engine=V3;
    const initial=engine.create(spec), local=engine.step(spec,initial,row.input);
    assert.ok(!['failed','risk'].includes(local.kind),row.input);
    const session=coach.create(spec.id);
    const server=await coach.turn(session.sessionId,decide(row.input));
    assert.equal(server.terminal,false,row.input);
    assert.ok(!['failed','risk'].includes(server.kind),row.input);
    assert.equal(server.narration,'template');
    assert.doesNotMatch(server.reply,/你應該搭電梯/);
  }
});

test('split acts have independently resolvable examples, grounded consequences, teaching and sources',()=>{
  for(const spec of specs.values()) {
    const engine=V3;
    for(const action of [...spec.actions,...(spec.hazards || [])].filter(a=>a.examples)) {
      for(const text of action.examples) {
        const initial=engine.create(spec);
        const node=spec.nodes.find(n=>n.available?.includes(action.id));
        if(node) initial.node=node.id;
        const result=engine.rawStep(spec,initial,text);
        assert.ok(['failed','risk'].includes(result.kind),text);
        assert.ok(result.state.events.some(e=>e.action===action.id || e.labels?.includes(action.label)),text);
        assert.ok(action.consequence && action.teaching, text);
        if (action.hazardMode === 'IMMEDIATE') assert.equal(result.message, action.consequenceTemplate, text);
        assert.ok(action.sourceIds.length);
      }
    }
  }
});

test('model may not replace a split hazard with a different executed act',async()=>{
  const spec=specs.get('flood_low_home');
  const initial=V3.create(spec);
  const text='我開車通過積水';
  const result=V3.rawStep(spec,initial,text);
  const lie='你游泳穿越積水，演練失敗。';
  assert.equal(unsupportedBehavior(lie,text,spec,initial,result),true);
  let narrations=0;
  const coach=new ConversationCoach({ready:true,model:'test',async generate(stage){
    if(stage==='interpret') return {value:nominal};
    narrations++; return {value:{reply:lie}};
  }});
  const s=coach.create(spec.id);
  const r=await coach.turn(s.sessionId,decide(text));
  assert.equal(narrations,1);
  assert.equal(r.narration,'engine_ending');
  assert.deepEqual(r.decision.narration_checks[0].failures,['quote_mismatch']);
  assert.match(r.reply,/把車開進積水路段/);
  assert.doesNotMatch(r.reply,/游泳/);
});
