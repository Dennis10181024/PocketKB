'use strict';
// Authoring command. Receives one reviewed draft registration as JSON on stdin.
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {readJson,validatePack}=require('../../web-pwa/choice-pack');
const {createRuntime}=require('../../web-pwa/choice-runtime');
const dir=path.resolve(__dirname,'../../web-pwa/scenarios/choice');
const schema=require(path.join(dir,'schema-v1.json'));
const {file,audit,safe,rough,fatalRuns,roughInjury,extraCases=[]}=JSON.parse(fs.readFileSync(0,'utf8'));
if(!/^[a-z][a-z0-9-]+-draft\.json$/.test(file))throw Error('Expected draft filename');
const bytes=fs.readFileSync(path.join(dir,file));
const pack=validatePack(readJson(bytes.toString('utf8')),schema);
if(pack.meta.status!=='draft')throw Error('Expected draft status');
createRuntime(pack).verifyReachability({consistentInjury:true});
const sha256=createHash('sha256').update(bytes).digest('hex');
const manifestFile=path.join(dir,'manifest.json');
const vectorsFile=path.join(dir,'test-vectors.json');
const auditFile=path.join(__dirname,'step51b-option-audit.json');
const manifest=JSON.parse(fs.readFileSync(manifestFile));
const vectors=JSON.parse(fs.readFileSync(vectorsFile));
const notes=JSON.parse(fs.readFileSync(auditFile));
const id=pack.meta.id;
const draft={id,title:pack.meta.title,file,sha256,status:'draft'};
if(pack.meta.contentNotice)draft.contentNotice=pack.meta.contentNotice;
manifest.packs=manifest.packs.filter(item=>item.id!==id).concat(draft);
const injuryFor=score=>score===0?'NONE':score===1?'MILD':score<=3?'MODERATE':'SEVERE';
const clock=safe.length;
const harm=rough.reduce((sum,id,index)=>{
  const decision=pack.decisions[index];
  const hazard=decision.options.find(o=>o.id===id).steps[0].id;
  return sum+(pack.catalog.hazards.find(a=>a.id===hazard).normal.effect.add?.['exposure.harm']||0);
},0);
const expected=(clock,ending,injury,exposure)=>({clock,ending,injury,exposure});
const delayed=pack.endings.find(e=>e.id==='delayed');
if(delayed.injury==='fromInjuries'&&!['NONE','MILD','MODERATE','SEVERE'].includes(roughInjury))
  throw Error('Specify expected worst player injury for the reckless vector');
const cases=[
  {id:'all-correct',choices:safe,expected:expected(clock,pack.endings.find(e=>e.id==='safe').type,'NONE',{harm:0,delay:0})},
  {id:'reckless',choices:rough,expected:expected(clock,delayed.type,roughInjury??injuryFor(harm),{harm,delay:clock})},
];
for(const [index,fatal] of fatalRuns.entries()){
  const prefix=fatal.prefix||safe.slice(0,fatal.at);
  cases.push({id:index===0?'fatal':'fatal-'+fatal.choice,choices:[...prefix,fatal.choice],
    expected:expected(fatal.at,'CRITICAL_FAILURE','NOT_ASSESSED',fatal.exposure||{harm:0,delay:0})});
}
const retry=fatalRuns.find(item=>!item.prefix);
if(!retry)throw Error('Need a fatal vector from an all-correct prefix');
cases.push({id:'retry',choices:[...safe.slice(0,retry.at),retry.choice],
  retry:{decisionId:pack.decisions[retry.at].id,clock:retry.at,facts:{}},resume:safe.slice(retry.at),sameAs:'all-correct'});
cases.push(...extraCases);
vectors.scenarios=vectors.scenarios.filter(item=>item.file!==file).concat({file,packSha256:sha256,cases});
Object.assign(notes,audit);
const encode=value=>JSON.stringify(value,null,2)+'\n';
fs.writeFileSync(manifestFile,encode(manifest));
fs.writeFileSync(vectorsFile,encode(vectors));
fs.writeFileSync(auditFile,encode(notes));
