'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const {webcrypto}=require('node:crypto');
const {loadVerifiedPack,readJson,validatePack}=require('../../web-pwa/choice-pack');
const {createRuntime}=require('../../web-pwa/choice-runtime');
const schema=require('../../web-pwa/scenarios/choice/schema-v1.json');
const manifest=require('../../web-pwa/scenarios/choice/manifest.json');
const vectors=require('../../web-pwa/scenarios/choice/test-vectors.json');
const readPack=file=>readJson(readFileSync(join(__dirname,'../../web-pwa/scenarios/choice',file),'utf8'));

test('published packs load by pinned digest and a changed byte is rejected',async()=>{
  for(const entry of manifest.packs){
    const bytes=readFileSync(join(__dirname,'../../web-pwa/scenarios/choice',entry.file));
    const pack=await loadVerifiedPack(bytes,entry.sha256,schema,webcrypto.subtle);
    assert.equal(pack.meta.id,entry.id);
    assert.equal(vectors.scenarios.find(row=>row.file===entry.file).packSha256,entry.sha256);
    await assert.rejects(loadVerifiedPack(Buffer.concat([bytes,Buffer.from(' ')]),entry.sha256,schema,webcrypto.subtle),/SHA-256/);
  }
});

test('validation rejects duplicate keys, unknown references, untrusted URLs and unsafe correct options',()=>{
  assert.throws(()=>readJson('{"x": {"id":1,"id":2}}'),/Duplicate/i);
  const changes=[
    [pack=>{pack.decisions[0].options[0].steps[0].id='unlisted';},/Unknown/i],
    [pack=>{pack.meta.sources[0].url='https://untrusted.example/info';},/source/i],
    [pack=>{pack.decisions.find(row=>row.id==='door').options.find(row=>row.id==='elevator').class='correct';},/correct|risk_or_delay/i],
    [pack=>{pack.decisions[0].when={fact:'notARealFact',eq:true};},/Unknown|unavailable/i],
    [pack=>{pack.beats[0].after={beat:pack.beats[0].id,turns:1};},/cyclic/i],
  ];
  for(const [change,error] of changes){
    const pack=readPack('fire-dorm.json');
    change(pack);
    assert.throws(()=>validatePack(pack,schema),error);
  }
});

function verify(state,expected){
  assert.equal(state.clock,expected.clock);
  assert.equal(state.ending.type,expected.ending);
  assert.equal(state.ending.injury,expected.injury);
  assert.deepEqual(state.exposure,expected.exposure);
  for(const [id,value] of Object.entries(expected.facts||{}))assert.equal(state.facts[id],value);
  if(expected.injuries)assert.deepEqual([...new Set(state.injuries.map(item=>item.id))].sort(),[...expected.injuries].sort());
}

function input(view,optionId){
  assert.ok(view.decision.options.some(option=>option.id===optionId),'visible option '+optionId);
  return {revision:view.revision,decisionId:view.decision.id,optionId,inputId:'choice-'+view.revision,responseTimeMs:700};
}
function play(runtime,session,choices){
  let view=runtime.snapshot(session);
  for(const optionId of choices)view=runtime.submitChoice(session,input(view,optionId));
  return view;
}
for(const scenario of vectors.scenarios){
  const pack=readPack(scenario.file);
  const find=id=>scenario.cases.find(row=>row.id===id);
  test(scenario.file+' has no unreachable decision or ending or invalid path',()=>{
    const result=createRuntime(validatePack(pack,schema)).verifyReachability();
    assert.equal(result.decisions,pack.decisions.length);
    assert.equal(result.endings,pack.endings.length);
  });
  for(const row of scenario.cases)test(scenario.file+' '+row.id,()=>{
    const runtime=createRuntime(pack,{random:()=>0});
    const session=runtime.start();
    if(row.expected){
      const view=play(runtime,session,row.choices);
      verify(view.state,row.expected);
      const debrief=runtime.debrief(session);
      assert.ok(debrief.result&&debrief.turning&&debrief.sources.length);
      if(row.id==='reckless'){
        assert.ok(view.state.injuries.some(item=>item.subject!=='player'));
        if(scenario.file==='earthquake-school.json')assert.equal(view.state.injuries.filter(item=>item.id==='leg_bruise').length,1);
        assert.match(debrief.result,/延誤/);
        assert.ok(debrief.dangers.every((item,index)=>index===0||item.at>=debrief.dangers[index-1].at));
        const counters=view.state.counters;
        assert.ok(Math.max(...Object.values(counters))>=2);
      }
      if(row.id==='fatal')assert.equal(debrief.injury,null);
    }else if(row.retry){
      const terminal=play(runtime,session,row.choices);
      assert.equal(terminal.state.ending.type,'CRITICAL_FAILURE');
      const restarted=runtime.retry(session);
      assert.equal(restarted.sessionId,terminal.sessionId);
      assert.equal(restarted.attempt,2);
      assert.equal(restarted.decision.id,row.retry.decisionId);
      assert.equal(restarted.state.clock,row.retry.clock);
      for(const [id,value] of Object.entries(row.retry.facts))assert.equal(restarted.state.facts[id],value);
      verify(play(runtime,session,row.resume).state,find(row.sameAs).expected);
      assert.ok(runtime.records(session).some(record=>record.attempt===1&&record.fatal));
      assert.ok(runtime.records(session).some(record=>record.attempt===2&&record.retryFrom));
    }else if(row.id==='shuffle'){
      const other=createRuntime(pack,{random:()=>0.99});
      const another=other.start();
      assert.notDeepEqual(runtime.snapshot(session).decision.options,other.snapshot(another).decision.options);
      const choices=find(row.sameAs).choices;
      assert.deepEqual(play(runtime,session,choices).state,play(other,another,choices).state);
    }else if(row.id==='observe'){
      for(const option of row.choices){
        const previous=runtime.snapshot(session);
        const logs=runtime.records(session);
        assert.ok(runtime.observe(session)&&runtime.ask(session));
        assert.deepEqual(runtime.snapshot(session),previous);
        assert.deepEqual(runtime.records(session),logs);
        play(runtime,session,[option]);
      }
    }else if(row.id==='dedupe'){
      const request=input(runtime.snapshot(session),row.choices[0]);
      const first=runtime.submitChoice(session,request);
      const second=play(runtime,session,row.choices.slice(1));
      assert.deepEqual(runtime.submitChoice(session,request),first);
      assert.deepEqual(runtime.snapshot(session),second);
      assert.equal(runtime.records(session).length,2);
      assert.throws(()=>runtime.submitChoice(session,{...request,optionId:'other'}),/Conflicting/);
    }
  });
}
