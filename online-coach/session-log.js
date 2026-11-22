'use strict';
const {appendFileSync,mkdirSync} = require('node:fs');
const path = require('node:path');
const {isIP} = require('node:net');
const taiwanDay = new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'});

// Free text can contain arbitrary personal information. Keep the complete decision schema,
// with a stable marker in any position that otherwise contains player/model evidence.
function scrub(text) {
  const key = process.env.OPENAI_API_KEY;
  return (key ? text.replaceAll(key,'[redacted]') : text)
    .replace(/sk-[A-Za-z0-9_-]{16,}/gi,'[redacted]')
    .replace(/[0-9a-f:.]*:[0-9a-f:.]+(?:%[a-z0-9_.-]+)?/gi,candidate=>{
      const address = candidate.replace(/[.]$/,'');
      const looksLikeAddress = isIP(address)===6 || address.includes('::') || address.split(':').length >= 8;
      return looksLikeAddress ? '[redacted]'+candidate.slice(address.length) : candidate;
    })
    .replace(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g,'[redacted]');
}

function researchTurn(session, decision, kind, text, timing, {logText=false,reply='',suggestions=[],npcLines=[],proposals=[]}={}) {
  const {controlInput, npcInput, actionValidation, emotion, disagreement, assessment, director, ...fields} = decision;
  const ids = values=>(values || []).filter(id=>session.spec.actions.some(action=>action.id===id));
  const evidence = value => logText ? scrub(typeof value==='string' ? value : '') : '[redacted]';
  return {schema:'2.2',sessionId:session.id,scenarioId:session.spec.id,version:session.spec.version,
    startedAt:new Date(session.createdAt).toISOString(),recordedAt:new Date().toISOString(),kind,inputLength:[...text].length,...fields,
    ...(controlInput !== undefined ? {controlInput:evidence(controlInput)} : {}),
    ...(npcInput !== undefined ? {npcInput:evidence(npcInput)} : {}),
    ...(director ? {director:{...director,inputEvidence:evidence(director.inputEvidence),dialEvidence:evidence(director.dialEvidence),
      matches:director.matches.map(item=>({...item,evidence:evidence(item.evidence)})),
      danger:director.danger?{...director.danger,evidence:evidence(director.danger.evidence)}:null}} : {}),
    ...(assessment ? {assessment:{...assessment,evidence:evidence(assessment.evidence),
      matches:assessment.matches.map(item=>({...item,evidence:evidence(item.evidence)})),
      fields:assessment.fields.map(item=>({...item,evidence:evidence(item.evidence)})),
    }} : {}),
    actionValidation:actionValidation.map(({id,result,evidence:quote,confidence,confirmed})=>({
      id:id==='npc_dissuade' ? id : ids([id])[0] || null,result,evidence:evidence(quote),
      ...(confidence ? {confidence,confirmed:Boolean(confirmed)} : {}),
    })),
    emotion:emotion ? {category:emotion.category,source:emotion.source,evidence:evidence(emotion.evidence)} : null,
    disagreement:disagreement ? {...disagreement,actionIds:ids(disagreement.actionIds),modelIds:ids(disagreement.modelIds),literalIds:ids(disagreement.literalIds)} : null,
    ...(logText ? {input_text:scrub(text),reply_text:scrub(reply),suggestion_texts:suggestions.map(scrub),
      npc_lines:npcLines.map(scrub),model_actions:proposals.map(item=>({id:typeof item?.id==='string' ? scrub(item.id) : null,evidence:evidence(item?.evidence),
        ...(item?.confidence ? {confidence:item.confidence} : {})}))} : {}),
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
