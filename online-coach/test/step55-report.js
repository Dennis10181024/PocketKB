'use strict';
const fs=require('node:fs');
const path=require('node:path');
const manifest=require('../../web-pwa/scenarios/choice/manifest.json');
const vectors=require('../../web-pwa/scenarios/choice/test-vectors.json');
const {optionAudit,run,reviewText}=require('./step51b-report');
const {validatePack}=require('../../web-pwa/choice-pack');
const {createRuntime}=require('../../web-pwa/choice-runtime');
const schema=require('../../web-pwa/scenarios/choice/schema-v1.json');
const labels={correct:'正確',misconception:'迷思',risk_or_delay:'危險／延誤',partial:'不完整'};
const sourceNotes={
  landslide_mountain_road_draft:[
    "草稿，待人工審查。農村水保署土石流指引及徵兆提供警戒、遠離危險區與撤離依據；公路局支援依最新交通管制選路。",
    "待人工查證：服務站、迴轉點與接應時機均為合成設定；任何真實路段應以當下公告和可用動線判斷。傷勢為教學事件。"
  ],
  metro_attack_draft:[
    '公開查證：警政署彙編頁 10 的跑、躲、告及專案收錄原文頁 16、26–27。北捷公開設備頁區分高運量與文湖線，板南線採緊急對講機。危險選項以嘗試自行離車呈現，無操作細節。',
    '待人工查證：請北捷或演練教官確認板南線各車型廣播與引導的措辭。暫時無退路且無法躲藏的阻擋選項只呈現保護與等候安全離開。'
  ],
  flood_low_home_draft:[
    '公開查證：臺南市淹水避難須知、水利與消防宣導、CDC 淹水用電。斷電先確認手、站立處與配電箱動線乾燥安全。進水後避免涉水碰觸，退水後也先等專業確認。',
    '待人工查證：請電氣與防災專業人員複核以租屋／住宅為背景的總開關假設、樓層動線及救援交接。'
  ],
  earthquake_home_trapped_draft:[
    '草稿，待人工審查。中央氣象署與內政部支持就地掩護、震後評估及敲擊求救，消防署報案要領支持通報位置。出入口是否安全依題內已呈現的狀態。',
    '待人工查證：公寓格局、斜櫃阻礙、餘震時點與各處傷勢均為合成情節。原舊包的 NCDR 大型 PDF 未能以網頁工具逐頁核對，本草稿不以其背書。'
  ],
  typhoon_outage_draft:[
    '公開查證：消防防災館停電應變由區公所刊載，另以消防署 119、地方消防局一氧化碳宣導核對通報與燃燒設備。',
    '待人工查證：食品保存依品項與實測溫度而異。本包省略分鐘數、藥品可否繼續使用與再復電時的設備操作細節。'
  ]
};
const lines=['# 步驟 5.5 情境包草稿驗收','',
  '草稿，待人工審查。預設隱藏，可由「演練設定 → 顯示草稿情境」開啟。以下為固定情境包的規則重播，OpenAI API 呼叫 0 次。傷勢、升級節點與救援時間是合成的教學情境設定。',''];
for(const entry of manifest.packs.filter(item=>item.status==='draft')){
  const pack=require('../../web-pwa/scenarios/choice/'+entry.file);
  const stats=createRuntime(validatePack(pack,schema)).verifyReachability({consistentInjury:true});
  const rows=optionAudit([pack]);
  lines.push('## '+pack.meta.title,'',
    stats.decisions+' 題，'+stats.endings+' 種可達結局，'+stats.states+' 個可達非終止狀態。',
    '',...(sourceNotes[pack.meta.id]||[]).map(note=>'- '+note),'',
    '| 檢查 | 數據 |','|---|---|');
  for(const [metric,label] of [['lengthBias','最長＝正確（標點計入）'],['significantBias','最長＝正確（忽略標點）'],
    ['actionBias','動作最多＝正確'],['shortestBias','最短＝正確（標點計入）'],['shortestSignificantBias','最短＝正確（忽略標點）']]){
    const count=rows.filter(row=>row[metric]).length;
    lines.push('| '+label+' | '+count+'/'+rows.length+'（'+(count/rows.length*100).toFixed(1)+'%） |');
  }
  const options=rows.flatMap(row=>row.options);
  lines.push('| 自我否定用詞 | '+options.filter(o=>o.negative).length+'/'+options.length+' |',
    '| 同題最大字差 | '+Math.max(...rows.map(row=>row.spread))+' 字 |','',
    '比例含並列。動作數為按原文核對的可見行動標註。','',
    '| 決策點／問題 | 選項 | 判定 | 字數 | 動作數 | 採用 ID | 來源 |','|---|---|---|---:|---:|---|---|');
  for(const row of rows){
    for(const o of row.options)lines.push('| '+[row.id+'／'+row.prompt,o.text,labels[o.class],o.length,o.actions,
      o.steps.map(s=>s.id).join('、'),o.sourceIds.map(id=>'['+id+']('+pack.meta.sources.find(s=>s.id===id).url+')').join('、')].join(' | ')+' |');
    lines.push('| '+row.id+' 字差 | — | — | '+row.spread+' | — | — | — |');
  }
  const cases=vectors.scenarios.find(row=>row.file===entry.file).cases;
  for(const [id,title] of [['all-correct','全對'],['reckless','亂玩']]){
    const result=run(pack,cases.find(row=>row.id===id).choices);
    lines.push('','### '+title+'重播回顧全文','',
      '結局傷勢清單｜'+(result.review.injuries.map(i=>i.subjectName+'：'+i.label).join('、')||'無紀錄傷勢')+'。','',
      ...reviewText(result));
  }
}
fs.writeFileSync(path.resolve(__dirname,'../../docs/STEP_55_DRAFT_REPORT.md'),'\uFEFF'+lines.join('\n').trimEnd()+'\n','utf8');
