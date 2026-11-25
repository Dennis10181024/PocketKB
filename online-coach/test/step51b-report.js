'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {createRuntime}=require('../../web-pwa/choice-runtime');
const manifest=require('../../web-pwa/scenarios/choice/manifest.json');
const vectors=require('../../web-pwa/scenarios/choice/test-vectors.json');
const authored=require('./step51b-option-audit.json');
const optionClass={correct:'正確',misconception:'迷思',risk_or_delay:'危險／延誤',partial:'不完整'};
const negative=/沒有|沒再|沒做|只|暫時不|不做其他|先不|不再|並未|不打算|不採取/u;
const cell=value=>String(value).replaceAll('|','｜');
const length=value=>[...value].length;
const significant=value=>length(value.replace(/[\p{P}\s]/gu,''));
const readPack=file=>require('../../web-pwa/scenarios/choice/'+file);
const plausibleAlternatives={
  handoff:'門外聲音可能聽不清楚，所以先靠近聽再答覆看似謹慎。',
  door:'關門後先拿手機，符合準備通報的直覺，也容易漏掉同伴。',
  roommate:'開一小縫向隔壁喊話，看上去像能立刻確認對方是否聽見警報。',
  report:'請樓下目擊者代報有助求援，也容易讓人以為能代替直接報位置。',
  seal:'再拉緊門或檢查把手看似都能查出漏煙處，徒手握門把另有風險。',
  window:'先靠近室內窗邊看煙和找人，可以取得線索，也容易就此停下。',
  contact:'保留剩餘電量很合理，和持續回報受困位置之間有取捨。',
  wait:'在窗旁聽門外動靜可掌握救援情況，但容易忘了維持隔煙。',
  main:'雙手護頭能擋落物，也讓人容易漏掉固定桌腳的動作。',
  companion:'先讓小維回桌下可處理眼前的事，可能忽略他想去找人的焦慮。',
  aftershock:'蹲低、找可扶的家具看似符合穩住身體的直覺，仍缺上方掩護。',
  stairs:'和前方保持距離及跟隊有道理，也容易漏掉護頭。',
  outside:'貼牆可避開眼前的電線，卻會走進外牆落物範圍。',
  assembly:'朋友招手提供了明顯集合目標，可能讓人忽略原班還需要確認人員。',
  roll_call:'先核對名單看似審慎，但老師此時需要聽到本人的回應。'
};

function optionAudit(packs){
  return packs.flatMap(pack=>pack.decisions.map(decision=>{
    const options=decision.options.map(option=>{
      const annotation=authored[option.id];
      if(annotation?.text!==option.text||!Number.isInteger(annotation.visibleActions)||annotation.visibleActions<1)
        throw Error('Recheck visible action annotation for '+option.id);
      return {...option,length:length(option.text),significant:significant(option.text),actions:annotation.visibleActions,
        negative:negative.test(option.text)};
    });
    const bestOf=metric=>options.some(option=>option.class==='correct'&&option[metric]===Math.max(...options.map(o=>o[metric])));
    const shortest=metric=>options.some(option=>option.class==='correct'&&option[metric]===Math.min(...options.map(o=>o[metric])));
    const spread=metric=>Math.max(...options.map(o=>o[metric]))-Math.min(...options.map(o=>o[metric]));
    return {packId:pack.meta.id,id:decision.id,prompt:decision.prompt,options,lengthBias:bestOf('length'),
      significantBias:bestOf('significant'),actionBias:bestOf('actions'),spread:spread('length'),significantSpread:spread('significant'),
      shortestBias:shortest('length'),shortestSignificantBias:shortest('significant')};
  }));
}

function run(pack,options){
  const runtime=createRuntime(pack,{random:()=>0.41});
  const session=runtime.start();
  let state=runtime.snapshot(session);
  for(const optionId of options){
    state=runtime.submitChoice(session,{decisionId:state.decision.id,optionId,revision:state.revision,inputId:'turn-'+state.revision});
  }
  return {state:state.state,records:runtime.records(session),review:state.state.ending?runtime.debrief(session):null};
}

function reviewText({review,records}){
  const points=[
    ['做對的決定',review.good.map(row=>'「'+row.optionText+'」 '+row.why)],
    ['下次可以補上的',review.improvements.map(row=>(row.optionText?'「'+row.optionText+'」 ':'')+row.text)],
    ['這次的危險選擇與後果',review.dangers.map(row=>'第 '+row.at+' 回合「'+row.optionText+'」 '+row.outcome+' '+row.tip)],
    ['關鍵轉折',review.turning?[['「'+review.turning.optionText+'」',review.turning.outcome,review.turning.tip].join(' → ')]:[]],
    ['官方依據',review.sources.map(source=>'['+source.title+']('+source.url+')')],
    ['帶走一個思考題',[review.reflection]]
  ];
  const lines=['#### 結果','',review.result,'',review.summary,''];
  for(const [title,items] of points)lines.push('#### '+title,'',...(items.length?items.map(item=>'- '+item):['本場無此項。']),'');
  lines.push('#### 因果核對','',
    '| 位置 | 原選項 | 當回合直接事件 | 事件中的傷勢／NPC 傷勢 |','|---|---|---|---|');
  for(const reviewed of [...review.dangers,...(review.turning?[review.turning]:[])]){
    const row=records.find(record=>record.optionId===reviewed.optionId&&(!reviewed.eventId||
      record.impacts?.some(item=>item.id===reviewed.eventId&&(reviewed.at===undefined||item.at===reviewed.at))));
    const events=row.impacts.filter(impact=>impact.direct);
    lines.push('| '+[reviewed.at===undefined?'關鍵轉折':'第 '+reviewed.at+' 回合',reviewed.optionText,events.map(item=>item.id).join('、'),
      events.flatMap(item=>item.injuries.map(injury=>injury.label+(injury.subject==='player'?'':'（同伴）'))).join('、')||'—'].map(cell).join(' | ')+' |');
  }
  lines.push('');
  return lines;
}

function main(){
  const packs=manifest.packs.filter(entry=>entry.status!=='draft').map(entry=>readPack(entry.file));
  const rows=optionAudit(packs);
  const stat=key=>{const matches=rows.filter(row=>row[key]).length;return matches+'/'+rows.length+'（'+(matches/rows.length*100).toFixed(1)+'%）';};
  const lines=['# 步驟 5.1b 選項與回顧驗收','',
    '以固定包 v1.0.1 和本機 JS runtime 重播。OpenAI API 呼叫 0 次。所有場次皆為開發驗證。','',
    '## 自動檢查','',
    '| 檢查 | 結果 |','|---|---|',
    '| 正確選項並列或單獨最長，標點計入 | '+stat('lengthBias')+' |',
    '| 正確選項並列或單獨最長，忽略空白與標點 | '+stat('significantBias')+' |',
    '| 正確選項並列或單獨動作最多 | '+stat('actionBias')+' |',
    '| 自我否定字樣 | '+rows.flatMap(row=>row.options).filter(option=>option.negative).length+' 筆／'+rows.flatMap(row=>row.options).length+' 個選項 |',
    '| 最大同題字差（計入標點／忽略標點） | '+Math.max(...rows.map(row=>row.spread))+'／'+Math.max(...rows.map(row=>row.significantSpread))+' 字 |','',
    '比例以題為單位，並列也計入。字數按 Unicode 字元計算。動作數依人工標注的可見行動單位計算，動機、結果、同一回報的資訊欄位和同一動作的姿勢細節不另外計算。測試核對標注是否對應完整原文，改動選項就需重審。採用 ID 數含通報欄位與引擎子步驟，另列供比對。','',
    '逐題人工檢查選項語意和採用 ID。門邊可在關門後拿手機，集合時可能想先去找熟識同學，通報時可能想到請樓下代報。選項的誘答效果待真人試玩。','',
    '## 與 5.1 向量的差異','',
    '- 兩個包升為 1.0.1，向量重新鎖定 SHA-256 摘要。全對、亂玩、致命、重來與其餘共用向量保留原選項 ID 序列與預期結局。',
    '- 宿舍不完整通報現在依文句寫入地址與人數，新增 partial-report 檢查樓層房號與煙況仍未填。',
    '- 宿舍消防員已抵達後再收拾物品，由 pack_before_handoff 記為延誤回應。該選項不會套用報案前翻找證件的旁白與煙霧增量。',
    '- 學校點名時「離開隊伍找小維」改採 leave_group_search，新增 leave-to-search 驗證原隊找不到本人，直接後果為離隊與清點延誤。',
    '- 回顧以該次結算的直接事件、傷勢和 NPC 反應為準。全局累積暴露造成的傷勢仍會進結果與紀錄，個別選項回顧不引用它。',''];
  for(const pack of packs){
    lines.push('## '+pack.meta.title,'','| 決策點 | 選項 | 字數 | 動作數 | 判定 | 採用 ID |','|---|---|---:|---:|---|---|');
    for(const row of rows.filter(item=>item.packId===pack.meta.id)){
      for(const option of row.options)lines.push('| '+[row.id+'｜'+row.prompt,option.text,option.length,option.actions,
        optionClass[option.class],option.steps.map(s=>s.id).join('、')].map(cell).join(' | ')+' |');
      lines.push('| '+row.id+' 字數差 | — | '+row.spread+' | — | — | — |');
    }
    lines.push('','**逐題可行感檢查**','');
    for(const row of rows.filter(item=>item.packId===pack.meta.id))
      lines.push('- '+row.id+'｜除了正確做法，'+plausibleAlternatives[row.id]);
    const file=manifest.packs.find(entry=>entry.id===pack.meta.id).file;
    const reckless=vectors.scenarios.find(row=>row.file===file).cases.find(row=>row.id==='reckless');
    lines.push('','### 亂玩重播回顧全文','',...reviewText(run(pack,reckless.choices)));
  }
  fs.writeFileSync(path.resolve(__dirname,'../../docs/STEP_51B_REPORT.md'),'\uFEFF'+lines.join('\n').trimEnd()+'\n','utf8');
}

if(require.main===module)main();
module.exports={optionAudit,run,reviewText};
