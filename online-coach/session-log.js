'use strict';
const {appendFileSync,mkdirSync} = require('node:fs');
const path = require('node:path');
const taiwanDay = new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'});

// Free text can contain arbitrary personal information. Keep the complete decision schema,
// with a stable marker in any position that otherwise contains player/model evidence.
function researchTurn(session, decision, kind, text, timing) {
  const {controlInput, npcInput, actionValidation, emotion, disagreement, ...fields} = decision;
  const ids = values=>(values || []).filter(id=>session.spec.actions.some(action=>action.id===id));
  return {schema:'2.2',sessionId:session.id,scenarioId:session.spec.id,version:session.spec.version,
    startedAt:new Date(session.createdAt).toISOString(),recordedAt:new Date().toISOString(),kind,inputLength:[...text].length,...fields,
    ...(controlInput !== undefined ? {controlInput:'[redacted]'} : {}),
    ...(npcInput !== undefined ? {npcInput:'[redacted]'} : {}),
    actionValidation:actionValidation.map(({id,result})=>({id:session.spec.actions.some(action=>action.id===id) ? id : null,result,evidence:'[redacted]'})),
    emotion:emotion ? {category:emotion.category,source:emotion.source,evidence:'[redacted]'} : null,
    disagreement:disagreement ? {...disagreement,actionIds:ids(disagreement.actionIds),modelIds:ids(disagreement.modelIds),literalIds:ids(disagreement.literalIds)} : null,
    elapsedMs:timing};
}

function createSessionWriter(root = path.join(__dirname,'logs')) {
  return row=>{
    const date=taiwanDay.format(new Date(row.startedAt));
    const directory=path.join(root,date);
    mkdirSync(directory,{recursive:true});
    appendFileSync(path.join(directory,row.sessionId+'.jsonl'),JSON.stringify(row)+'\n',{encoding:'utf8',mode:0o600});
  };
}
module.exports={researchTurn,createSessionWriter};
