'use strict';

// Interactive live play. The next action is entered only after reading the latest reply.
const fs = require('node:fs');
const readline = require('node:readline');
const { ConversationCoach, createOpenAIProvider, specs } = require('../coach');
const { replayDecisions } = require('../../web-pwa/scenario-engine-v3');
const { isDeepStrictEqual } = require('node:util');

async function run(path,priorPath) {
  if (!path || !process.env.OPENAI_API_KEY) throw new Error('缺少輸出路徑或 API 金鑰。');
  const priorRun = priorPath ? JSON.parse(fs.readFileSync(priorPath,'utf8').trim().split(/\r?\n/).at(-1)) : {};
  const prior = priorRun.total ?? priorRun.calls ?? 0;
  if (!Number.isInteger(prior) || prior<0 || prior>=120) throw new Error('無法確認剩餘呼叫預算。');
  const log = fs.openSync(path,'wx');
  let calls = 0;
  const provider = createOpenAIProvider({apiKey:process.env.OPENAI_API_KEY,model:process.env.OPENAI_MODEL,
    fetchImpl:async (...args)=>{calls++;return fetch(...args);}});
  const coach = new ConversationCoach(provider,{maxCalls:120-prior});
  const active = new Map();
  const write = row=>fs.writeSync(log,JSON.stringify(row)+'\n');
  const commands = readline.createInterface({input:process.stdin,terminal:false});
  process.stdout.write('READY — enter an action after reading the scene.\n');
  try {
    for await (const line of commands) {
      const [id,input] = line.split('\t');
      if (id==='end') break;
      if (!input) {
        if (active.has(id)) throw new Error('場次已存在。');
        const start = coach.create(id);
        active.set(id,start);
        const opening = {scenario:id,opening:start.scene.node.situation,model:provider.model};
        write(opening); console.log(JSON.stringify(opening)); continue;
      }
      const previous = active.get(id);
      const response = await coach.turn(previous.sessionId,{requestId:`live22b-${previous.revision}`,revision:previous.revision,text:input});
      active.set(id,response);
      const d = response.decision;
      const record = {scenario:id,turn:response.revision,input,reply:response.reply,kind:response.kind,
        beforeNode:previous.state.node,node:response.state.node,beforeTime:previous.state.elapsed || 0,time:response.state.elapsed || 0,
        terminal:response.terminal,events:response.state.events.slice(previous.state.events.length),decision:d,
        offline:response.offline,narrationReason:response.narrationReason,calls,
        replay:isDeepStrictEqual(response.state,replayDecisions(specs.get(id),response.decisions))};
      write(record);
      console.log(JSON.stringify({scenario:id,turn:record.turn,reply:record.reply,time:record.time,node:record.node,terminal:record.terminal,
        action:d.actionIds,npc:record.events.filter(e=>e.kind.startsWith('npc')).map(e=>e.kind),question:d.question_answer_id,
        sources:d.source_ids,checks:d.narration_checks,offline:record.offline,calls,replay:record.replay}));
    }
  } finally {
    write({calls,prior,total:calls+prior,model:provider.model});
    fs.closeSync(log);
  }
}

run(...process.argv.slice(2)).catch(error=>{console.error(error.code || error.message);process.exitCode=1;});
