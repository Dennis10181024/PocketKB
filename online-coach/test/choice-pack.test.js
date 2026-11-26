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
const {optionAudit,run}=require('./step51b-report');
const parity=require('./step52-parity');
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

test('Kotlin parity snapshots are current against JS reference and shared vectors',()=>{
  assert.deepEqual(parity.collect(),JSON.parse(readFileSync(parity.file,'utf8')));
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
  if(expected.endingId)assert.equal(state.ending.id,expected.endingId);
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
test('metro vectors preserve the driver intercom fact and the official equipment link',()=>{
  const scenario=vectors.scenarios.find(row=>row.file==='metro-attack-draft.json');
  const pack=readPack(scenario.file);
  const allText=JSON.stringify(pack);
  assert.doesNotMatch(allText,/對講機.*行控|行控.*對講機/u);
  assert.match(allText,/高運量列車的緊急對講機接通司機員/u);
  const equipmentUrl='https://www.metro.taipei/cp.aspx?n=C4B618682DB27979&s=7AB21391531CA32D';
  for(const vector of scenario.cases.filter(row=>row.expected)){
    const {review}=run(pack,vector.choices);
    assert.ok(review.sources.some(source=>source.id==='metro'&&source.url===equipmentUrl),vector.id);
    assert.doesNotMatch(JSON.stringify(review),/對講機.*行控|行控.*對講機/u,vector.id);
  }
});
for(const scenario of vectors.scenarios){
  const pack=readPack(scenario.file);
  const find=id=>scenario.cases.find(row=>row.id===id);
  test(scenario.file+' has no unreachable decision or ending or invalid path',()=>{
    const result=createRuntime(validatePack(pack,schema)).verifyReachability({consistentInjury:true});
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
      if(row.id.startsWith('fatal'))assert.equal(debrief.injury,null);
    }else if(row.checkpoint){
      const view=play(runtime,session,row.choices);
      assert.equal(view.state.clock,row.checkpoint.clock);
      for(const [id,value] of Object.entries(row.checkpoint.facts))assert.equal(view.state.facts[id],value);
      if(row.checkpoint.exposure)assert.deepEqual(view.state.exposure,row.checkpoint.exposure);
      if(row.checkpoint.hazards)assert.deepEqual(runtime.records(session).at(-1).hazards,row.checkpoint.hazards);
      if(row.checkpoint.event)assert.ok(view.state.events.some(event=>event.id===row.checkpoint.event));
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

test('option length, visible actions and negative wording do not leak the answer',()=>{
  const packs=manifest.packs.map(entry=>readPack(entry.file));
  const rows=optionAudit(packs);
  for(const set of [rows.filter(row=>packs.find(p=>p.meta.id===row.packId).meta.status!=='draft'),
    ...packs.filter(p=>p.meta.status==='draft').map(p=>rows.filter(row=>row.packId===p.meta.id))]){
    for(const key of ['lengthBias','significantBias','actionBias'])assert.ok(set.filter(row=>row[key]).length/set.length<=0.35,key+' '+set[0].packId);
  }
  for(const row of rows){
    assert.ok(row.spread<=4&&row.significantSpread<=4,row.id+' length spread');
    for(const option of row.options){
      assert.equal(option.negative,false,option.id);
      if(option.class==='partial')assert.ok(option.missingStep,option.id);
    }
  }
  for(const pack of packs.filter(p=>['draft','pending_review'].includes(p.meta.status))){
    const questions=rows.filter(row=>row.packId===pack.meta.id);
    for(const key of ['shortestBias','shortestSignificantBias'])
      assert.ok(questions.filter(row=>row[key]).length/questions.length<=0.35,key+' '+pack.meta.id);
  }
});

test('the formal flood rough vector escalates companion and rescue delays; the safe vector prevents both',()=>{
  const bundle=vectors.scenarios.find(row=>row.file==='flood-low-home-draft.json');
  const pack=readPack(bundle.file);
  for(const [id,count] of [['all-correct',0],['reckless',2]]){
    const {state,records}=run(pack,bundle.cases.find(row=>row.id===id).choices);
    for(const event of ['peer_ramp_omission','missed_location_signal']){
      assert.equal(state.counters[event]??0,count,event+' '+id);
      const impacts=records.flatMap(row=>row.impacts).filter(row=>row.id===event);
      assert.equal(impacts.length,count);
      if(count===2)assert.notEqual(impacts[0].outcome,impacts[1].outcome);
    }
    assert.equal(state.npc.peer.injured,Boolean(count));
    assert.equal(state.facts.upper,true);
  }
});

test('each rough debrief uses the cited choice’s direct events and at most two actual delays',()=>{
  for(const scenario of vectors.scenarios.filter(item=>readPack(item.file).meta.status!=='draft')){
    const pack=readPack(scenario.file);
    const sample=scenario.cases.find(row=>row.id==='reckless');
    const {state,records,review}=run(pack,sample.choices);
    assert.equal(new Set(review.dangers.map(item=>item.tip)).size,review.dangers.length);
    for(const item of [...review.dangers,review.turning]){
      const row=records.find(row=>row.optionId===item.optionId&&row.impacts.some(impact=>impact.id===item.eventId&&
        (item.at===undefined||item.at===impact.at)));
      assert.notEqual(item.outcome,review.type);
      const direct=row.impacts.filter(impact=>impact.direct);
      assert.ok(direct.some(impact=>impact.id===item.eventId));
      for(const impact of direct)assert.ok(item.outcome.includes(impact.outcome.replace(/。$/u,'')));
      for(const impact of row.impacts.filter(impact=>!impact.direct))assert.ok(!item.outcome.includes(impact.outcome));
    }
    assert.equal(review.delays.length,2);
    assert.ok(review.delays.every(reason=>state.delays.some(item=>item.reason===reason)));
    assert.deepEqual(records.flatMap(row=>row.delays),state.delays);
    assert.equal(review.delays[0],records.find(row=>row.safety==='unsafe'&&row.delays.length).delays[0].reason);
    assert.ok(review.dangers.some(item=>item.optionId===review.turning.optionId));
    const goodTexts=pack.decisions.flatMap(d=>d.options.filter(o=>o.class==='correct').map(o=>o.text));
    assert.ok(review.good.every(item=>goodTexts.includes(item.optionText)));
    if(scenario.file==='fire-dorm.json'){
      assert.match(review.dangers.find(item=>item.optionId==='bathroom').outcome,/浴室.*煙/);
      assert.match(review.dangers.find(item=>item.optionId==='grab_handle').outcome,/掌心接觸燙傷/);
      assert.match(review.improvements.find(item=>item.id==='close_only').text,/小岑/);
    }else if(scenario.file==='earthquake-school.json'){
      assert.match(records.find(item=>item.optionId==='rush_aftershock').impacts.find(item=>item.direct).outcome,/小腿/);
      assert.match(review.dangers.find(item=>item.optionId==='watch_door').outcome,/手腕受傷/);
    }
  }
});
