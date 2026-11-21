'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {ConversationCoach,createOpenAIProvider}=require('../coach');
const {createSessionWriter}=require('../session-log');
const director=require('../director-registry').get('earthquake_school');
const cases=require('./earthquake-director-cases.json');

const correct=[
  '我馬上鑽到堅固的桌底下抓牢桌腳，護住頭頸，跟小維說千萬別衝出去開門。',
  '我繼續留在桌下，等搖晃停止再動。小維，我知道你很怕家裡那邊也在搖，我陪你先等老師指示。',
  '地板又晃了，我就地重新掩護頭頸並抓穩桌腳，等餘震停了再走。',
  '我用書包護住頭頸，不推不跑，跟著老師走已確認的內側樓梯下樓，繞開電線及外牆往操場空曠處集合。',
  '我留在操場集合區，聽老師點到我的名字就回一聲。',
];
const risky=cases.find(x=>x.draft==='B' && x.n===11).text;
const easy=[21,22,23,24,26,28,30,27].map(n=>cases.find(x=>x.draft==='A' && x.n===n).text);
const groups={
  正確:correct,
  先犯錯再修正:[risky,...correct],
  拖延或離題:Array.from({length:6},(_,i)=>['我繼續想晚餐吃什麼','今天的作業好多','我不知道，先發呆'][i%3]),
  易誤判安全句:easy,
};
const clean=value=>String(value??'—').replace(/\|/g,'\\|').replace(/\r?\n/g,'<br>');
module.exports={groups};
if (require.main===module) (async()=>{
  const limit=Number(process.env.POCKETKB_MAX_CALLS || 120);
  const prior=Number(process.env.POCKETKB_LIVE_CALLS_USED || 0);
  const provider=createOpenAIProvider({apiKey:process.env.OPENAI_API_KEY,model:process.env.OPENAI_MODEL || 'gpt-6.1-terra'});
  assert.ok(provider.ready,'需要 OPENAI_API_KEY');
  assert.ok(Number.isInteger(limit) && limit<=120 && Number.isInteger(prior) && prior>=0 && prior<limit);
  const coach=new ConversationCoach(provider,{formal:true,quality:true,director:true,logText:true,maxCalls:limit-prior,record:createSessionWriter()});
  const lines=['# 學校地震導演模式｜真實 API 重播','','題組按原文送出，全程未使用建議句。',''];
  const outcomes=[];
  for(const [label,inputs] of Object.entries(groups)){
    let state=coach.create('earthquake_school');
    const callsBefore=coach.calls;
    const turns=[];
    lines.push('## '+label,'','場次：'+state.sessionId,'',
      '| 回合 | 玩家原文 | 畫面全文 | 判定／危險 | 時間 | 事件 | 退回 |','|---:|---|---|---|---:|---|---|');
    for(const [i,text] of inputs.entries()) {
      if(state.terminal || coach.calls>=coach.maxCalls)break;
      state=await coach.turn(state.sessionId,{revision:state.revision,requestId:'school-director-'+i,text,intent:'action'});
      const decision=state.decision.director || {};
      turns.push({kind:state.kind,danger:decision.danger?.id || null,fallback:state.fallbackReason});
      lines.push('| '+[i+1,text,state.researchRecord.reply_text,state.kind+(decision.danger?' / '+decision.danger.id:'')+
        ' '+(decision.matches||[]).map(m=>m.id).join('、'),decision.clock,(decision.beats||[]).join('、'),state.fallbackReason].map(clean).join(' | ')+' |');
      console.log(label,i+1,state.kind,decision.clock,state.fallbackReason || '');
    }
    const {lastText,...live}=state.state.director;
    assert.deepEqual(director.replay(state.decisions),live);
    const metrics=state.state.directorResearch;
    const result={label,type:state.state.endingType,injury:state.state.injuryLevel,calls:coach.calls-callsBefore,metrics,turns};
    outcomes.push(result);
    lines.push('',`結局：${state.ending?.type || '未完成'}／${state.ending?.injury || '—'}，API ${result.calls} 次。`,'',
      `首次決策安全：${metrics.first_decision_safe}，回到當下：${metrics.rewind_count}，行為：${metrics.rewind_hazards.join('、') || '—'}，修正後完成：${metrics.completed_after_rewind ?? '—'}。`,'');
  }
  lines.splice(3,0,`本次 API 呼叫 ${coach.calls} 次，前次 ${prior} 次，累計 ${prior+coach.calls}/${limit}。`,'');
  fs.writeFileSync(path.join(__dirname,'../../docs/EARTHQUAKE_DIRECTOR_REPLAY.md'),'\uFEFF'+lines.join('\n'));
  const checks=[outcomes[0].type==='SELF_EVACUATION' && outcomes[0].injury==='NONE',
    outcomes[1].type==='SELF_EVACUATION' && outcomes[1].metrics.rewind_count===1 && outcomes[1].metrics.completed_after_rewind,
    outcomes[2].type==='DELAYED_EVACUATION' && outcomes[2].turns.length===6,
    outcomes[3].type==='DELAYED_EVACUATION' && outcomes[3].turns.every(turn=>!turn.danger)];
  console.log(JSON.stringify({calls:coach.calls,checks,groups:outcomes.map(({turns,...outcome})=>outcome)}));
  if (!checks.every(Boolean) || outcomes.some(group=>group.turns.some(turn=>turn.fallback))) process.exitCode=2;
})().catch(error=>{console.error(error.code || error.message);process.exitCode=1;});
