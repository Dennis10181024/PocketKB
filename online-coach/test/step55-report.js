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
  metro_attack_draft:[
    '公開查證：警政署彙編頁 10 的跑、躲、告及專案收錄原文頁 16、26–27。北捷公開設備頁區分高運量與文湖線，板南線採緊急對講機。危險選項以嘗試自行離車呈現，無操作細節。',
    '待人工查證：請北捷或演練教官確認板南線各車型廣播與引導的措辭。暫時無退路且無法躲藏的阻擋選項只呈現保護與等候安全離開。'
  ],
  flood_low_home_draft:[
    '公開查證：臺南市淹水避難須知、水利與消防宣導、CDC 淹水用電。斷電先確認手、站立處與配電箱動線乾燥安全。進水後避免涉水碰觸，退水後也先等專業確認。',
    '待人工查證：請電氣與防災專業人員複核以租屋／住宅為背景的總開關假設、樓層動線及救援交接。'
  ],
  typhoon_outage_draft:[
    '公開查證：消防防災館停電應變由區公所刊載，另以消防署 119、地方消防局一氧化碳宣導核對通報與燃燒設備。',
    '待人工查證：食品保存依品項與實測溫度而異。本包省略分鐘數、藥品可否繼續使用與再復電時的設備操作細節。'
  ]
};
const lines=['# 步驟 5.5 情境包草稿驗收','',
  '草稿預設隱藏。「演練設定 → 顯示草稿情境」可手動查看。所有播放為固定劇本的規則重播，OpenAI API 呼叫 0 次。傷勢、升級節點與救援時間是教學情境設定，待專業審查。',''];
for(const entry of manifest.packs.filter(item=>item.status==='draft')){
  const pack=require('../../web-pwa/scenarios/choice/'+entry.file);
  const stats=createRuntime(validatePack(pack,schema)).verifyReachability();
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
