'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {webcrypto}=require('node:crypto');
const {loadVerifiedPack}=require('../../web-pwa/choice-pack');
const {createRuntime}=require('../../web-pwa/choice-runtime');
const schema=require('../../web-pwa/scenarios/choice/schema-v1.json');
const manifest=require('../../web-pwa/scenarios/choice/manifest.json');
const vectors=require('../../web-pwa/scenarios/choice/test-vectors.json');

const packPath=path.resolve(__dirname,'../../web-pwa/scenarios/choice');
const kinds={correct:'正確',misconception:'迷思',risk_or_delay:'危險／延誤',partial:'不完整'};
const cell=value=>String(value).replaceAll('|','｜').replaceAll('\n',' ');
function reviewLines(review){
  const lines=['#### 回顧全文','',review.result,'',review.summary,'','**做對的決定**',''];
  lines.push(...(review.good.length?review.good.map(row=>' - 「'+row.optionText+'」'+row.why):['（本場無此項）']));
  lines.push('','**下次可以補上的**','',...(review.improvements.length?review.improvements.map(row=>' - '+row.text):['（本場無此項）']));
  lines.push('','**這次的危險選擇與後果**','',...(review.dangers.length?
    review.dangers.map(row=>' - 第 '+row.at+' 回合「'+row.optionText+'」'+row.outcome+' '+row.tip):['（本場無此項）']));
  if(review.turning)lines.push('','**關鍵轉折**','','「'+review.turning.optionText+'」',review.turning.outcome,review.turning.tip);
  lines.push('','**官方依據**','',...review.sources.map(row=>' - ['+row.title+']('+row.url+')'));
  lines.push('','**帶走一個思考題**','',review.reflection,'');
  return lines;
}
function play(pack,run){
  const runtime=createRuntime(pack,{random:()=>0.41});
  const session=runtime.start();
  const lines=['### '+(run.id==='all-correct'?'全對':'亂玩'),'','內容提醒「演練中可能出現受傷的結果，你可以隨時停止。」',''];
  let view=runtime.snapshot(session);
  for(const [index,optionId] of run.choices.entries()){
    const {decision,revision}=view;
    lines.push('#### 第 '+(index+1)+' 回合','',...view.lines.map(line=>'> '+line),'');
    if(view.status.length)lines.push('現場狀態｜'+view.status.slice(0,2).join('、'),'');
    lines.push('**'+decision.prompt+'**','',...decision.options.map(option=>' - '+option.text+(option.id===optionId?' **← 本次選擇**':'')),'');
    view=runtime.submitChoice(session,{decisionId:decision.id,optionId,revision,inputId:'report-'+revision});
    const exposure=Object.entries(view.state.exposure).map(([key,value])=>key+' '+value).join('、');
    lines.push('結算後｜時間 '+view.state.clock+'，'+exposure,'');
  }
  const review=runtime.debrief(session);
  lines.push('#### 結局畫面','',review.type+(review.injury?'｜本人傷勢 '+review.injury:''),'',
    ...view.lines.map(line=>'> '+line),'','**傷勢清單**','');
  lines.push(...(review.injuries.length?review.injuries.map(item=>' - 第 '+item.at+' 回合｜'+item.subjectName+'｜'+item.label):['本場無紀錄的傷勢事件。']),'',
    ...reviewLines(review));
  return lines;
}
async function main(){
  const lines=['# 步驟 5.1 選擇題驗收報告','',
    '下列畫面由固定情境包與瀏覽器共用的 JS runtime 實際結算。選項排序使用固定測試種子，Web 試玩每次顯示順序會洗牌。這些是開發重播，實驗數據仍待收集。本次 OpenAI API 呼叫數為 0。','',
    '## 導演模式移植對照','',
    '| 類別 | 範圍 | 5.1 行為與原因 |','|---|---|---|',
    '| 等價 | 宿舍隔煙、位置通報、靠窗示意與消防員接手 | 原則與來源保留。是否隔煙、是否聯絡、搜尋何時抵達仍由狀態和先前的選擇決定。 |',
    '| 等價 | 學校主震掩護、停震後走樓梯、餘震再次掩護、避開電線與外牆、清點 | 保留條件與確定性後果。致命選擇直接進入特定結局。 |',
    '| 等價 | 觀察、詢問、致命後重來 | 觀察與問同伴不耗時間或寫狀態。重來回復轉折前的 facts、暴露及同伴狀態，保留 session 與歷次作答。 |',
    '| 刻意調整 | 宿舍通報、等候時間 | 通報在同題一次選擇，後續可趁通訊題補報。最早救援事件在第 7 回合，留出通報、封門縫、靠窗示意與等待回應的練習。最慢分支仍會有搜尋延誤及暴露累積。 |',
    '| 刻意調整 | 學校集合與點名 | 新寫獨立集合題，讓玩家可選留班、找其他班朋友或回教室取物。未回應點名逐次記錄，再由教師另行找回，仍屬延誤撤離。 |',
    '| 刻意調整 | 題目適用範圍 | 固定選項以既有 principle／hazard 為主。學校新增門邊等候、貼外牆、跨班集合和未回覆點名的專屬資料列，讓旁白與回顧能說明實際行為。無法移植的自由話語與模型語氣裁判留在舊模式。 |',
    '| 刻意調整 | 傷勢與回顧 | 維持狀態機分級，另外列出本人及同伴的具體傷勢，回顧依實際事件和首次可作答的原則產生。挑出的危險選擇依時間排列，延誤原因優先進補強建議。 |',
    '| 待確認 | 正式實驗與內容審查 | 傷勢、暴露門檻與救援回合為教學分支設計。官方來源支持應變原則，個別傷勢與時間表仍須內容審查。受試者是否分得出迷思選項、實際時長與跨端一致性待驗收。 |',
    '| 待確認 | 新包准入與手機 | 固定包執行時檢查摘要及語意，發布前掃描可達性。生成內容白名單、照片處理、人工准入與 Kotlin 同 vectors 驗證列在後續階段。 |',
    '',
    '## 重現','',
    ' - `node --test online-coach/test/choice-pack.test.js` 驗證摘要、DSL、可達性與 14 個共用 vectors。',
    ' - `node online-coach/test/step51-report.js` 重新產出這份逐回合紀錄。',
    ' - `node web-pwa/choice-browser-test.js` 需可用的 Chrome 與 Playwright。檢查從首頁到斷網重開、觀察、致命後重來與傷勢清單。',''];
  for(const entry of manifest.packs){
    const pack=await loadVerifiedPack(fs.readFileSync(path.join(packPath,entry.file)),entry.sha256,schema,webcrypto.subtle);
    const reach=createRuntime(pack).verifyReachability();
    const order=pack.decisions.slice().sort((a,b)=>(a.when.clock?.eq??Infinity)-(b.when.clock?.eq??Infinity));
    lines.push('## '+pack.meta.title,'',
      '包版 '+pack.meta.version+'，'+reach.decisions+' 個決策點，'+reach.endings+' 個可達結局規則，'+reach.states.toLocaleString('en-US')+' 個可達非終止狀態。','',
      '### 全部選項','',
      '| 決策點 | 選項 | 判定 | 採用 ID | 來源 |','|---|---|---|---|---|');
    for(const decision of order)for(const option of decision.options)lines.push('| '+[
      decision.id+'｜'+decision.prompt,option.text,kinds[option.class],option.steps.map(s=>s.id).join('、'),
      option.sourceIds.map(id=>'['+id+']('+pack.meta.sources.find(row=>row.id===id).url+')').join('、')
    ].map(cell).join(' | ')+' |');
    lines.push('');
    const scenario=vectors.scenarios.find(row=>row.file===entry.file);
    for(const run of scenario.cases.filter(row=>['all-correct','reckless'].includes(row.id)))lines.push(...play(pack,run));
  }
  fs.writeFileSync(path.resolve(__dirname,'../../docs/STEP_51_REPORT.md'),'\uFEFF'+lines.join('\n').trimEnd()+'\n','utf8');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
