'use strict';

const fs = require('node:fs');
const assert = require('node:assert/strict');
const Experience = require('../experience');
const {specs} = require('../coach');

const [input,report,replacement] = process.argv.slice(2);
const read = path=>fs.readFileSync(path,'utf8').trim().split(/\r?\n/).map(JSON.parse);
const primary = read(input);
const primaryUsage = primary.pop();
const corrected = replacement ? read(replacement) : [];
const usage = corrected.pop() || primaryUsage;
const replacedIds = new Set(corrected.filter(row=>row.opening).map(row=>row.scenario));
const raw = [...primary.filter(row=>!replacedIds.has(row.scenario)),...corrected];
const rows = raw.filter(row=>row.turn);
const openings = raw.filter(row=>row.opening);
const oldHeading = '## 步驟 2.2 舊版實測原文\n\n';
const old = fs.readFileSync(report,'utf8').replace(/^\uFEFF/,'').replace(/\r\n/g,'\n').split(oldHeading).at(-1);
const originalReplies = old.split(/\r?\n/).filter(line=>/畫面敘事　|修正後畫面　/.test(line)).map(line=>line.split('　').at(-1));
assert.equal(originalReplies.length,36,'前版應保留 30 回合與 6 則定點複驗。');

function metrics(items) {
  const drafts = items.flatMap(row=>row.decision.narration_checks).filter(check=>check.stage==='narrate');
  const hits = id=>drafts.filter(check=>check.failures.includes(id)).length;
  const narrative = items.filter(row=>!['sourced_question','engine_ending'].includes(row.decision.narration));
  const repeated = [];
  const prior = new Map();
  for (const row of narrative) {
    const allDetails = specs.get(row.scenario).nodes.flatMap(node=>node.experience.sensory);
    const ids = Experience.sensoryIds(row.reply,allDetails);
    const preceding = prior.get(row.scenario) || [];
    if (ids.some(id=>preceding.flat().includes(id))) repeated.push(row.turn);
    prior.set(row.scenario,[...preceding,ids].slice(-2));
  }
  return {turns:items.length,average:Number((items.reduce((sum,row)=>sum+Experience.size(row.reply),0)/items.length).toFixed(1)),
    closing:hits('banned_closing'),copied:hits('input_repeated'),sensory:hits('repeated_sensory_detail'),
    shownClosing:narrative.filter(row=>Experience.bannedClosings.some(p=>p.test(row.reply))).length,
    shownCopied:narrative.filter(row=>Experience.sharedSubstring(row.reply,row.input)>10).length,shownSensory:repeated.length,
    answered:items.filter(row=>row.decision.question_answer_id && row.decision.source_ids.length).length,
    questions:items.filter(row=>row.decision.narration==='sourced_question').length,
    environment:items.flatMap(row=>row.events).filter(e=>e.eventId?.startsWith('elapsed-')).length,
    retry:items.filter(row=>row.decision.narration_checks.filter(check=>check.stage==='narrate').length>1).length,
    template:items.filter(row=>row.decision.narration==='template').length};
}

const lines = ['# 步驟 2.2b 真實 API 試玩','','## 淹水關電安全核對','',
  '依 2.2 原始紀錄重播前六回合，第 7 回合動作執行前的 `standingDry`、`handsDry` 與 `panelSafelyReachable` 均為 `true`。關電前已觸發的水位變化描述室外與地下停車場入口，這三個旗標維持乾燥場景的設定。共用引擎對規則判讀和模型提案都會比對 `power_off.requires.facts`。玩家文字不能覆寫旗標。逐一改成 `false` 或未知的 6 種快照均通過回歸，規則回 `risk` 且未執行，模型提案回 `MODEL_GUARD_FAILED`。來源為劇本 `cdc-electrical`。','',
  '## 本輪驗證','',`透過共用線上教練實玩，每次讀取回合敘事後才提交下句。先導 ${primaryUsage.prior} 次，主批 ${primaryUsage.calls} 次${replacement ? `，修正後重跑學校與淹水 ${usage.calls} 次` : ''}，合計 ${usage.total}/120 次。`,
  `模型 ${usage.model}。畫面文字取自既有介面使用的 node.situation 與 reply 欄位。明確提問使用劇本內的有來源答案。`,'',
  '本次 JS 85 項、Kotlin 37 項通過，宿舍火災 38/38 維持等價。線上及舊火災的 Chrome 回歸通過。','',
  '| 場次 | 回合 | 平均字元 | 禁用收尾草稿命中 | 複述草稿不通過 | 感官重複草稿 | 顯示收尾／複述／重複 | 提問有來源回答 | 惡化 | 重生 | 模板 |',
  '| --- | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: |'];
const titles = new Map(openings.map(row=>[row.scenario,specs.get(row.scenario).title]));
const all = metrics(rows);
const pooled = [...openings.map(row=>[row.scenario, metrics(rows.filter(item=>item.scenario===row.scenario))]),['all',all]];
for (const [id,n] of pooled) lines.push(`| ${titles.get(id) || '合計'} | ${n.turns} | ${n.average} | ${n.closing} | ${n.copied} | ${n.sensory} | ${n.shownClosing}／${n.shownCopied}／${n.shownSensory} | ${n.answered}/${n.questions} | ${n.environment} | ${n.retry} | ${n.template} |`);
const closureCounts = list=>Experience.bannedClosings.map(pattern=>list.filter(reply=>pattern.test(reply)).length);
const previous30 = originalReplies.slice(0,30);
lines.push('',
  ...rows.filter(row=>row.offline).map(row=>`${titles.get(row.scenario)}第 ${row.turn} 回合已實際呼叫模型。模型提議未通過語氣驗證（${row.decision.validation}），同一回合轉用規則，並顯示劇本的 NPC 台詞。`),
  `2.2 禁用收尾四類依序為「我還沒決定」、「還要／還得決定」、「接下來怎麼做」、「在這個抉擇前又停了一會兒」。首輪 30 回合命中 ${closureCounts(previous30).join('／')} 次，共 ${previous30.filter(reply=>Experience.bannedClosings.some(p=>p.test(reply))).length} 回合命中。含定點複驗共 36 段，四類命中 ${closureCounts(originalReplies).join('／')} 次；同一回覆可命中多類。`,
  '2.2 的「緊閉的房門」首輪出現在宿舍第 4、6、8、10 回合，並在定點複驗第 10 回合再出現一次。舊程式只比上一回合的完整線索字串，間隔一回合的交替及同義改寫都可通過。新版掃描實際顯示文字，以全劇本的線索 ID 加同義模式辨認，並保留最近兩次敘事紀錄。獨立提問不清空紀錄。','',
  ...(replacement ? ['主批淹水試玩發現「外面積水還沒退」和「仍看得見外部道路上的水」共指同一線索，資料卻用了兩個 ID。修正為共用 flood_water。學校則補上「回教室拿書包」的明確拒絕判讀，避免誤計時間。兩場均從開場重跑。',''] : []),
  '禁用收尾、複述與感官重複的草稿統計含重生。顯示統計只計第一人稱敘事，獨立的有來源問答和危險結局原話引句依各自格式驗證。字元平均涵蓋所有顯示回覆。');
for (const opening of openings) {
  lines.push('',`## ${titles.get(opening.scenario)}`,'',`開場　${opening.opening}`,'');
  for (const row of rows.filter(item=>item.scenario===opening.scenario)) {
    const decision = row.decision;
    const events = row.events.map(event=>event.eventId || event.action || event.kind).join('、');
    lines.push(`### 第 ${row.turn} 回合`,'',`- 玩家輸入　${row.input}`,`- 畫面敘事　${row.reply}`,
      `- 狀態　${row.beforeNode} → ${row.node}，時間 ${row.beforeTime} → ${row.time}，事件 ${events || '無'}。`,
      `- 紀錄　${row.kind}／${decision.narration}，來源 ${decision.source_ids.join('、') || '無'}，情緒 ${decision.emotion?.category || '無'}，結局 ${decision.ending_type || '進行中'}，敘事檢查 ${decision.narration_checks.flatMap(check=>check.failures).join('、') || '無拒絕'}。`,'');
  }
}
lines.push('', '---','','## 步驟 2.2 舊版實測原文','',old.trimEnd(),'');
fs.writeFileSync(report,'\uFEFF'+lines.join('\n'),'utf8');
console.log(JSON.stringify({usage,metrics:all,scenarios:pooled.slice(0,-1),offline:rows.filter(row=>row.offline).length,
  replayMismatch:rows.filter(row=>!row.replay).length}));
assert.equal(openings.length,3);
assert.ok(usage.total<=120);
assert.ok(rows.every(row=>row.replay));
assert.ok(rows.filter(row=>row.decision.narration==='sourced_question' || row.decision.emotion).every(row=>row.beforeTime===row.time));
assert.equal(all.shownClosing+all.shownCopied+all.shownSensory,0);
assert.ok(all.questions>0);
assert.equal(all.answered,all.questions);
for (const {scenario} of openings) {
  const turns = rows.filter(row=>row.scenario===scenario);
  assert.ok(turns.length>=10 && turns.at(-1).terminal);
  const kinds = turns.flatMap(row=>row.events.map(event=>event.kind));
  assert.ok(kinds.indexOf('npc_handled')>=0 && kinds.indexOf('npc_emotion_prompt')>kinds.indexOf('npc_handled') &&
    kinds.indexOf('npc_emotion')>kinds.indexOf('npc_emotion_prompt'));
  assert.equal(metrics(turns).environment,2);
}
