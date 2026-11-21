'use strict';
// Real-API replay of dorm-fire inputs through director mode. Usage: node online-coach/test/director-live.js
const fs=require('node:fs');
const path=require('node:path');
const {ConversationCoach,createOpenAIProvider}=require('../coach');
const {createSessionWriter}=require('../session-log');
const sets=require('./human-replay-sets.json');
const assert=require('node:assert/strict');
const latest=['把門關緊 並跟小岑說千萬不能開門\n找濕毛巾把門縫堵住，然後再找一條濕毛巾捂住自己的口鼻\n並且拿起手機撥打 110，通報接線員我們在宿舍 5 樓 503 室，門外有陣陣濃煙。',
  '跟小岑說我們先顧好自己，現在沒有餘力去管外面的同學。\n並且跟接線員說，我們在 503 室，目前房間內有兩個人，但不確定房間外走廊的情況。',
  '尋找宿舍對外窗 朝外面呼救 並跟接線員保持聯絡','保持冷靜 減少呼吸頻率 降低氧氣消耗 等待救援','將手機開啟省電模式，儘可能保持通話','回答有人 盡量製造聲音求救'];
const danger=['我才不要搭電梯咧，樓梯比較快吧？','小岑你千萬不要跳窗啦','我去搭電梯','好吧，那我把門關緊，跟小岑說不要開門','我先看一下窗外有沒有煙','打119跟他說我們在安學路100號A棟五樓503，兩個人，走廊都是煙'];
const groups={B:sets.B.inputs,D:sets.D.inputs,F:latest,G:danger};
const cell=v=>String(v ?? '—').replace(/\|/g,'\\|').replace(/\r?\n/g,'<br>');
(async()=>{
  const provider=createOpenAIProvider({apiKey:process.env.OPENAI_API_KEY,model:process.env.OPENAI_MODEL || 'gpt-6.1-terra'});
  if (!provider.ready) throw Error('請先設定 OPENAI_API_KEY');
  const limit=Number(process.env.POCKETKB_MAX_CALLS || 120);
  const prior=Number(process.env.POCKETKB_LIVE_CALLS_USED || 0);
  assert.ok(Number.isInteger(limit) && limit<=120 && Number.isInteger(prior) && prior>=0 && prior<limit);
  const coach=new ConversationCoach(provider,{formal:true,quality:true,director:true,logText:true,maxCalls:limit-prior,record:createSessionWriter()});
  const lines=['# 新版宿舍火災（導演模式）真實 API 重播','','每句照原文送出、不使用建議句；玩家句子用完後，以「我們留在房間等救援」補到結局。',''];
  const expected={B:['SAFE_RESCUE','NONE'],D:['SAFE_RESCUE','NONE'],F:['DELAYED_RESCUE','NONE'],G:['DELAYED_RESCUE','MODERATE']};
  const outcomes={};
  let fallback=false;
  for (const [id,inputs] of Object.entries(groups)) {
    let s=coach.create('drill_fire_dorm');
    lines.push(`## ${id} 組（場次 ${s.sessionId}）`,'','| # | 玩家 | 畫面 | 判定 | 時間 | 事件 |','|---|---|---|---|---:|---|');
    const queue=inputs.map(x=>typeof x==='string'?x:x.text).filter(Boolean);
    for (let i=0;i<16 && !s.terminal;i++) {
      if (coach.calls>=coach.maxCalls) break;
      const text=queue[i] ?? '我們留在房間等救援';
      s=await coach.turn(s.sessionId,{revision:s.revision,requestId:`director-live-${id}-${i}`,text,intent:'action'});
      const dd=s.decision.director || {};
      fallback ||= Boolean(s.decision.fallbackReason);
      lines.push(`| ${i+1} | ${cell(text)} | ${cell(s.ending?.text || s.reply)} | ${cell((s.decision.assessment?.category||s.kind)+' '+(dd.matches||[]).map(x=>x.id).join('、')+(dd.dialed?' 撥'+dd.dialed:'')+(dd.danger?' 危險:'+dd.danger.id:''))} | ${dd.clock ?? ''} | ${cell((dd.beats||[]).join('、'))} |`);
      console.log(id,i+1,s.kind,s.decision.fallbackReason||'',s.reply.slice(0,40));
    }
    lines.push('',`結局：${s.ending?.type || '未結束'}・${s.ending?.injury || ''}`,'',`回顧：${cell(s.review)}`,'');
    outcomes[id]=[s.state.endingType,s.state.injuryLevel];
  }
  lines.splice(5,0,`API 呼叫 ${coach.calls} 次，前次 ${prior} 次，合計 ${prior+coach.calls}/${limit}。`,'');
  fs.writeFileSync(path.join(__dirname,'../../docs/DIRECTOR_REPLAY.md'),'﻿'+lines.join('\n'));
  console.log(JSON.stringify({calls:coach.calls,total:prior+coach.calls,outcomes,expected,fallback}));
  if (fallback || JSON.stringify(outcomes)!==JSON.stringify(expected)) process.exitCode=2;
})().catch(e=>{console.error(e);process.exit(1);});
