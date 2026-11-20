'use strict';

const fs = require('node:fs');
const { isDeepStrictEqual } = require('node:util');
const { ConversationCoach, createOpenAIProvider, specs } = require('../coach');
const Engine = require('../../web-pwa/scenario-engine-v3');
const { size } = require('../experience');
const development = require('./step21b-development-cases.json');

const plays = {
  drill_fire_dorm: [
    '我在想晚餐要吃雞排', '我瞬移到樓下', '我拒絕搭電梯',
    '我把房門帶上，再拿濕毛巾堵住門底下那條縫', '小岑，我聽見你擔心同學。我會留在這裡陪你。',
    '如果打開門看一眼，會有什麼風險？', '我先打119', '我告知安學路100號A棟宿舍，五樓503室',
    '我留在房內等待消防救援', '我保持通訊，配合消防指示',
  ],
  earthquake_school: [
    '我想訂宵夜', '我把時間倒轉到下課', '我不會衝出去', '現在要是直接跑出去會怎樣？',
    '我趴下躲到桌下護住頭頸，抓穩桌腳', '小維，我知道你在擔心家人，我會用聲音回應你。',
    '我等待搖晃停止', '我依照老師指示走樓梯疏散', '現在要回去拿手機嗎？', '我到集合點點名，不返回教室',
  ],
  flood_low_home: [
    '我想先聊晚餐吃什麼', '我召喚一條龍把我帶走', '我不會游泳穿越積水', '要是我先下去看車呢？',
    '我不下地下室搶救車輛', '阿敏，我聽到你很自責。我在這裡，可以陪你回報位置。',
    '我關閉總電源', '我們先上二樓避難，再回報地址和受困位置', '我可以先等等看水會不會退嗎？',
    '我保留飲水、手機電量和體力',
  ],
};

async function main(output, report) {
  if (!output || !report) throw new Error('請指定新 JSONL 路徑與 Markdown 路徑。');
  if (!process.env.OPENAI_API_KEY) throw new Error('API 金鑰未設定，實測尚未送出。');
  let upstreamStatus;
  let dispatches = 0;
  const provider = createOpenAIProvider({apiKey:process.env.OPENAI_API_KEY,model:process.env.OPENAI_MODEL,
    fetchImpl:async (...args)=>{dispatches++; const response = await fetch(...args); upstreamStatus = response.status; return response;}});
  const coach = new ConversationCoach(provider,{maxCalls:120});
  const log = fs.openSync(output,'wx');
  const dev = [], sessions = [];
  let failure;
  async function turn(session, text, group, metadata = {}) {
    upstreamStatus = undefined;
    const firstCall = dispatches;
    const response = await coach.turn(session.sessionId,{requestId:`step22-${session.revision}`,revision:session.revision,text});
    const record = {group,scenario:session.scenarioId,text,...metadata,kind:response.kind,reply:response.reply,
      decision:response.decision,terminal:response.terminal,offline:response.offline,fallbackReason:response.fallbackReason,
      upstreamStatus,calls:dispatches-firstCall,node:[session.state.node,response.state.node],
      elapsed:[session.state.elapsed || 0,response.state.elapsed || 0],npc:response.state.npc,
      events:response.state.events.slice(session.state.events.length),suggestions:response.suggestions,
      replayMatches:isDeepStrictEqual(Engine.replayDecisions(specs.get(session.scenarioId),response.decisions),response.state)};
    fs.writeSync(log,JSON.stringify(record)+'\n');
    if ([401,403,404,429].includes(upstreamStatus)) failure = `上游 HTTP ${upstreamStatus}`;
    console.log(`${group} ${session.scenarioId} #${response.revision} ${response.kind} (${dispatches}/120)`);
    return {response,record};
  }
  try {
    for (const item of development) {
      if (failure) break;
      const spec = specs.get(item.scenario);
      const baseline = Engine.step(spec,Engine.create(spec),item.text);
      const {record} = await turn(coach.create(item.scenario),item.text,'development',
        {category:item.category,expected:item.actionIds,baseline:baseline.kind});
      dev.push(record);
    }
    for (const [id, inputs] of Object.entries(plays)) {
      if (failure) break;
      let session = coach.create(id);
      const rows = [];
      sessions.push({id,rows});
      for (const text of inputs) {
        if (failure || session.terminal) break;
        const {response,record} = await turn(session,text,'playthrough');
        session = response;
        rows.push(record);
      }
    }
  } catch (error) {
    failure = error.code || error.name;
  } finally {
    const rows = sessions.flatMap(session=>session.rows);
    const dangerous = row=>['risk','failed'].includes(row.kind);
    const exact = row=>JSON.stringify(row.expected)===JSON.stringify(row.decision.actionIds);
    const standard = rows.filter(row=>row.decision.narration !== 'engine_ending');
    const summary = {model:provider.model,calls:dispatches,devCases:dev.length,
      devCorrect:dev.filter(row=>row.category==='correct' && exact(row) && !dangerous(row)).length,
      devDanger:dev.filter(row=>row.category==='danger' && dangerous(row) && exact(row)).length,
      devProtectedMisexecuted:dev.filter(row=>row.category==='protected' && (!exact(row) || dangerous(row))).length,
      playthroughs:sessions.map(({id,rows})=>({id,turns:rows.length,terminal:rows.at(-1)?.terminal || false})),
      averageCharacters:rows.length ? Number((rows.reduce((sum,row)=>sum+size(row.reply),0)/rows.length).toFixed(1)) : null,
      displayedOverLimit:standard.filter(row=>size(row.reply)>120).length,
      draftOverLimit:rows.flatMap(row=>row.decision.narration_checks).filter(check=>check.stage==='narrate' && check.length>120).length,
      bannedHits:rows.flatMap(row=>row.decision.narration_checks).filter(check=>check.failures.includes('banned_pattern')).length,
      regenerations:rows.filter(row=>row.decision.narration_checks.filter(check=>check.stage==='narrate').length>1).length,
      templates:rows.filter(row=>row.decision.narration==='template').length,
      offline:[...dev,...rows].filter(row=>row.offline).length,
      replayMismatches:[...dev,...rows].filter(row=>!row.replayMatches).length, failure};
    fs.writeSync(log,JSON.stringify({summary})+'\n');
    fs.closeSync(log);
    const lines = ['# 步驟 2.2 真實 API 試玩', '',
      '本輪透過與線上頁面共用的教練管線實際呼叫 API。畫面敘事欄逐字取自回合 API 的 `reply`。開發集用於驗證實作。',
      '', '```json',JSON.stringify(summary,null,2),'```','', '## 20 句開發集', ''];
    for (const row of dev) lines.push(`- ${row.text} → ${row.kind}／${row.decision.source}／${row.decision.actionIds.join(' → ') || '無動作'}。`);
    for (const {id,rows} of sessions) {
      lines.push('',`## ${specs.get(id).title}`,'');
      for (const row of rows) {
        const decision = row.decision;
        lines.push(`### 第 ${decision.turn} 回合`,'',`- 玩家輸入　${row.text}`,`- 畫面敘事　${row.reply}`,
          `- 狀態變化　${row.node.join(' → ')}，時間 ${row.elapsed.join(' → ')}，同伴 ${row.npc?.emotion || (row.npc?.handled ? '已停下' : '待處理')}，事件 ${row.events.map(event=>event.eventId || event.action || event.kind).join('、') || '無'}。`,
          `- 紀錄　${decision.actionIds.join(' → ') || '無動作'}／${decision.source}／${decision.validation}，敘事 ${decision.narration}，建議句 ${decision.hint_trigger || '未顯示'}，來源 ${decision.source_ids.join('、') || '無'}，暴露 ${JSON.stringify(decision.exposure)}，結局及傷勢 ${decision.ending_type || '未結束'}／${decision.injury_level || '未評定'}。`,'');
      }
    }
    fs.writeFileSync(report,'\uFEFF'+lines.join('\n')+'\n',{flag:'wx'});
    console.log(JSON.stringify(summary));
    if (failure || dev.length !== 20 || summary.devDanger !== 8 || summary.devProtectedMisexecuted ||
        sessions.length !== 3 || sessions.some(session=>session.rows.length < 10 || !session.rows.at(-1).terminal) ||
        summary.offline || summary.displayedOverLimit || summary.replayMismatches) process.exitCode = 1;
  }
}

if (require.main === module) main(...process.argv.slice(2)).catch(error=>{console.error(error.code || error.message);process.exitCode=1;});
module.exports = { plays };
