'use strict';

const fs = require('node:fs');
const assert = require('node:assert/strict');
const { ConversationCoach,createOpenAIProvider,specs } = require('../coach');
const Engine = require('../../web-pwa/scenario-engine-v3');

async function main(previous, output, report, priorVerification) {
  assert.ok(process.env.OPENAI_API_KEY,'API 金鑰未設定。');
  const records = fs.readFileSync(previous,'utf8').trim().split(/\r?\n/).map(JSON.parse);
  const {summary} = records.pop();
  const previousCalls = summary.calls + (priorVerification ? fs.readFileSync(priorVerification,'utf8').trim().split(/\r?\n/)
    .map(JSON.parse).reduce((total,row)=>total+row.calls,0) : 0);
  const remaining = 120-previousCalls;
  assert.ok(remaining>0,'實測呼叫上限已用完。');
  let calls = 0;
  const provider = createOpenAIProvider({apiKey:process.env.OPENAI_API_KEY,model:process.env.OPENAI_MODEL,
    fetchImpl:async (...args)=>{calls++;return fetch(...args);}});
  const coach = new ConversationCoach(provider,{maxCalls:remaining});
  const targets = priorVerification ? [['flood_low_home',3]] :
    [['drill_fire_dorm',10], ['earthquake_school',10], ['flood_low_home',3], ['flood_low_home',5], ['flood_low_home',6]];
  const log = fs.openSync(output,'wx');
  const evaluated = [];
  try {
    for (const [id,turn] of targets) {
      const spec = specs.get(id);
      const refs = records.filter(row=>row.group==='playthrough' && row.scenario===id);
      const prior = refs.slice(0,turn-1);
      const target = refs[turn-1];
      const {sessionId} = coach.create(id);
      const session = coach.sessions.get(sessionId);
      session.revision = turn-1;
      session.decisions = prior.map(row=>row.decision);
      session.state = Engine.replayDecisions(spec,session.decisions);
      session.history = prior.flatMap(row=>[{role:'user',content:row.text},{role:'assistant',content:row.reply}]);
      session.sensory = spec.nodes.flatMap(node=>node.experience.sensory)
        .filter(detail=>prior.at(-1)?.reply.includes(detail.text)).map(detail=>detail.id);
      const visible = prior.at(-1);
      if (visible.suggestions.length) session.hint = {options:visible.suggestions,trigger:visible.decision.hint_trigger,turn:visible.decision.hint_shown_turn+1};
      if (turn===3) session.invalidStreak = 2;
      const beforeCalls = calls;
      const elapsed = session.state.elapsed;
      const result = await coach.turn(sessionId,{requestId:`recheck-${turn}`,revision:turn-1,text:target.text});
      const decision = result.decision;
      const specific = id==='drill_fire_dorm' ? result.reply.includes('並接手') : id==='earthquake_school' ? result.reply.includes('集合點') :
        turn===3 ? decision.validation==='RULE_REFUSAL' && result.state.elapsed===elapsed :
        turn===5 ? decision.actionIds.includes('avoid_basement') : decision.emotion?.category==='supportive';
      const refusalText = !priorVerification || result.reply.includes('排除「游泳穿越積水」');
      const row = {id,turn,text:target.text,reply:result.reply,decision,offline:result.offline,calls:calls-beforeCalls,
        passed:!result.offline && specific && refusalText && calls>beforeCalls};
      evaluated.push(row);
      fs.writeSync(log,JSON.stringify(row)+'\n');
      console.log(`${id} #${turn}: ${row.passed ? 'PASS' : 'FAIL'} (${previousCalls+calls}/120)`);
    }
  } finally {
    fs.closeSync(log);
  }
  const additions = ['',priorVerification ? '### 拒絕句的敘事複驗' : '## 實測發現及修正後定點複驗','',
    '上方保留第一次實測的完整對話。下列從各回合前的狀態與實測對話歷史重建快照，對同一句輸入再次實際呼叫 API。各回合採用自己的快照，屬於修正定點複驗。',
    '',`先前 ${previousCalls} 次，本次定點複驗 ${calls} 次，合計 ${previousCalls+calls}/120 次。`,''];
  for (const row of evaluated) additions.push(`- ${specs.get(row.id).title}第 ${row.turn} 回合（${row.passed ? '通過' : '未通過'}）`,
    `  - 玩家輸入　${row.text}`,`  - 修正後畫面　${row.reply}`,`  - 紀錄　${row.decision.validation}／${row.decision.source}，動作 ${row.decision.actionIds.join(' → ') || '無'}，情緒 ${row.decision.emotion?.category || '無'}，敘事 ${row.decision.narration}，離線提示 ${row.offline ? '有' : '無'}。`);
  fs.appendFileSync(report,additions.join('\n')+'\n','utf8');
  if (evaluated.some(row=>!row.passed)) process.exitCode = 1;
}

main(...process.argv.slice(2)).catch(error=>{console.error(error.code || error.message);process.exitCode=1;});
