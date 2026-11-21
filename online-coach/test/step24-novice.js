'use strict';

const fs = require('node:fs');
const readline = require('node:readline');
const {ConversationCoach,createOpenAIProvider} = require('../coach');
const {createSessionWriter} = require('../session-log');

async function main(output, scenarioByRun = {}) {
  if (!output || !process.env.OPENAI_API_KEY) throw new Error('請提供輸出路徑與環境金鑰。');
  const fd = fs.openSync(output,'wx');
  const coach = new ConversationCoach(createOpenAIProvider({apiKey:process.env.OPENAI_API_KEY,model:process.env.OPENAI_MODEL}),
    {maxCalls:Object.keys(scenarioByRun).length ? 100 : 150,record:createSessionWriter()});
  const sessions = new Map();
  const publish = data=>{const line=JSON.stringify(data);fs.writeSync(fd,line+'\n');console.log(line);};
  const input = readline.createInterface({input:process.stdin,terminal:false});
  console.log('READY：每列為 JSON 物件，鍵是場次，值是本回合輸入。');
  try {
    for await (const line of input) {
      if (line.trim()==='end') break;
      const jobs = JSON.parse(line);
      await Promise.all(Object.entries(jobs).map(async ([id,text])=>{
        if (!sessions.has(id)) {
          if (text) throw new Error('請先開場。');
          const session = coach.create(scenarioByRun[id] || 'drill_fire_dorm');sessions.set(id,session);
          return publish({id,sessionId:session.sessionId,opening:session.scene.opening,decision:session.scene.node.task});
        }
        const before = sessions.get(id);
        const after = await coach.turn(before.sessionId,{requestId:'novice24-'+before.revision,revision:before.revision,text},()=>{});
        sessions.set(id,after);
        const events = after.state.events.slice(before.state.events.length);
        publish({id,turn:after.revision,text,reply:after.reply,task:after.scene.node.task,kind:after.kind,
          node:[before.state.node,after.state.node],elapsed:[before.state.elapsed || 0,after.state.elapsed || 0],events,
          citations:after.decision.source_ids,fallbackReason:after.fallbackReason || null,
          narrationFallbackReason:after.decision.narrationFallbackReason,ending:after.ending,
          terminal:after.terminal,source:after.decision.source,actionIds:after.decision.actionIds,offline:after.offline,
          recovered:after.onlineRecovered,answerId:after.decision.question_answer_id,npcHandled:after.state.npc?.handled,
          emotion:after.decision.emotion?.category});
      }));
    }
  } finally {publish({calls:coach.calls,model:coach.provider.model});fs.closeSync(fd);}
}
const scenarios = process.argv[3] === 'step25' ? {A:'drill_fire_dorm',B:'drill_fire_dorm',C:'earthquake_school'} : undefined;
main(process.argv[2], scenarios).catch(error=>{console.error(error.code || error.message);process.exitCode=1;});
