'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {createRuntime}=require('../../web-pwa/choice-runtime');
const vectors=require('../../web-pwa/scenarios/choice/test-vectors.json');
const folder=path.resolve(__dirname,'../../web-pwa/scenarios/choice');

function collect(){
  return {schemaVersion:1,scenarios:vectors.scenarios.map(bundle=>{
    const pack=require(path.join(folder,bundle.file));
    const cases=bundle.cases.map(row=>{
      const original=bundle.cases.find(candidate=>candidate.id===row.sameAs);
      const runtime=createRuntime(pack,{random:()=>row.id==='shuffle'?0.99:0.41});
      const session=runtime.start();
      const checkpoints=[];
      let view=runtime.snapshot(session);
      function capture(op,extra={}){
        const {sessionId,...rest}=view;
        checkpoints.push({op,...extra,view:rest});
      }
      capture('start');
      function choose(choice){
        const input={decisionId:view.decision.id,optionId:choice,inputId:'turn-'+view.revision,revision:view.revision};
        view=runtime.submitChoice(session,input);
        capture('choice',{choice});
        if(row.id==='dedupe'){
          view=runtime.submitChoice(session,input);
          capture('dedupe');
        }
      }
      for(const choice of row.choices||original?.choices||[]){
        if(row.id==='observe'){
          capture('observe',{text:runtime.observe(session)});
          capture('ask',{text:runtime.ask(session)});
        }
        choose(choice);
      }
      const terminalReview=view.state.ending?JSON.parse(JSON.stringify(runtime.debrief(session))):null;
      if(row.retry){
        view=runtime.retry(session);
        capture('retry');
        for(const choice of row.resume)choose(choice);
      }
      return {id:row.id,checkpoints,terminalReview,finalReview:view.state.ending?JSON.parse(JSON.stringify(runtime.debrief(session))):null};
    });
    return {file:bundle.file,packSha256:bundle.packSha256,cases};
  })};
}

const file=path.join(folder,'parity-v1.json');
if(require.main===module)fs.writeFileSync(file,JSON.stringify(collect())+'\n','utf8');
module.exports={collect,file};
