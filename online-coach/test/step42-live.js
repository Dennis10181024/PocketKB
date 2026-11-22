'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {ConversationCoach,createOpenAIProvider}=require('../coach');
const {createSessionWriter}=require('../session-log');
const {groups}=require('./earthquake-director-live');

const M=[
  '感覺超好玩 趕緊衝出去拍個限動','跟他說來一起拍限動 超好玩的','餘震有甚麼好怕 超小的 直接衝出去',
  '不理老師 我想搭電梯','沒差拉 我懶得走路 去搭電梯','一邊跟同學嬉戲 一邊走路一邊唱歌',
  '低頭玩手機 不理老師','去隔壁班找別人玩',
];
const correct=[...groups.正確.slice(0,4),'我走另一側，離開外牆和垂在地上的電線，到操場空曠處。',
  '我留在本班的集合位置，跟本班待在一起。',...groups.正確.slice(4)];
const forbidden=/回到剛才|回到當下|這樣很危險|你應該|真的這樣做/;
const show=value=>String(value ?? '—').replaceAll('|','\\|').replace(/\r?\n/g,'<br>');

async function main(){
  const rulesOnly=process.argv.includes('--rules');
  const priorCalls=Number(process.env.POCKETKB_LIVE_CALLS_USED || 0);
  const maxCalls=Number(process.env.POCKETKB_MAX_CALLS || 100)-priorCalls;
  assert.ok(Number.isInteger(maxCalls)&&maxCalls>0&&priorCalls>=0&&maxCalls+priorCalls<=100);
  const provider=createOpenAIProvider({apiKey:process.env.OPENAI_API_KEY,model:process.env.OPENAI_MODEL || 'gpt-6.1-terra'});
  assert.ok(rulesOnly || provider.ready,'OPENAI_API_KEY 未設定');
  const coach=new ConversationCoach(provider,{formal:true,quality:true,director:true,logText:true,maxCalls,record:createSessionWriter()});
  const lines=[rulesOnly?'## 4.2b 新版回顧全文｜本機規則樣張':'# 步驟 4.2b 真實 API 重播與回顧','','M 原序列在第一個致命行動結束。為驗證剩餘原句，先完成回顧再從關鍵轉折重來。每次重來都保留場次 ID，另記 attempt。正確組保留原五句，在一樓與集合位置新增兩個輸入。全程不使用提示。',''];
  const outcomes=[];
  for(const [label,items] of [['M｜使用者原句',M],['全部做對',correct]]){
    let snapshot=coach.create('earthquake_school');
    const traces=[];
    const endings=[];
    const before=coach.calls;
    lines.push((rulesOnly?'### ':'## ')+label,'','場次 `'+snapshot.sessionId+'`。','','| 回合 | Attempt | 玩家原話 | 畫面 | 時鐘 | 事件與後果 | 判讀 |','|---:|---:|---|---|---:|---|---|');
    async function send(text,intent='action'){
      const old=snapshot;
      snapshot=await coach.turn(old.sessionId,{text,intent,rulesOnly,requestId:'step42-'+old.revision,revision:old.revision});
      const report=snapshot.decision?.director;
      const stages=[...(report?.beats || []),...(report?.consequences || []).map(c=>c.id)];
      const message=snapshot.researchRecord.reply_text;
      const errors=snapshot.researchRecord.provider_errors || [];
      const trace={kind:snapshot.kind,clock:snapshot.state.director.clock,stages,message,
        fallback:snapshot.fallbackReason || snapshot.decision?.narration_checks.some(c=>c.providerFailure) || errors.length>0};
      const mode=intent==='retry_decision'?'程式重來':rulesOnly?'本機規則':snapshot.fallbackReason
        ? '備援 '+snapshot.fallbackReason : (snapshot.decision?.source==='model'?'GPT':'程式');
      const source=[mode,...errors.map(e=>[e.stage,e.http_status,e.error_type,e.error_code].filter(Boolean).join(' '))].join('／');
      lines.push('| '+[snapshot.revision,snapshot.attempt,text || '從關鍵轉折重來',message,snapshot.state.director.clock,stages.join('、'),source].map(show).join(' | ')+' |');
      if(intent==='action') traces.push(trace);
      console.log(label,snapshot.revision,snapshot.attempt,snapshot.kind,trace.clock,stages.join(','));
      if(snapshot.terminal) endings.push({attempt:snapshot.attempt,ending:snapshot.ending,review:snapshot.review,
        metrics:snapshot.state.directorResearch,canRetry:snapshot.canRetry});
    }
    for(const text of items){
      if(snapshot.terminal){
        if(items!==M) break;
        await send('','retry_decision');
      }
      await send(text);
      if(snapshot.fallbackReason==='MODEL_UNAVAILABLE' || snapshot.researchRecord.provider_errors?.length) break;
    }
    for(let i=0;items===M&&!snapshot.terminal&&i<3&&(rulesOnly || !traces.at(-1)?.fallback);i++) await send('我沒回話，繼續低頭看手機');
    for(const entry of endings){
      lines.push('',(rulesOnly?'#### ':'### ')+`第 ${entry.attempt} 次｜`+[entry.ending.type,entry.ending.injury].filter(Boolean).join('／'),'',entry.ending.text,'');
      for(const section of entry.ending.lessons){
        lines.push((rulesOnly?'##### ':'#### ')+section.title,'',...[section.why,section.next].filter(Boolean).flatMap(t=>[t,'']),
          ...section.sources.map(source=>'- ['+source.title+']('+source.url+')'));
      }
      if(entry.canRetry) lines.push('','按鈕：從這個決定重來。');
      lines.push('','研究紀錄 `'+JSON.stringify(entry.metrics)+'`。');
    }
    const outcome={label,traces,endings,calls:coach.calls-before};
    outcomes.push(outcome);
    lines.push('',`本組 API 呼叫 ${outcome.calls} 次。非原句的續測輸入另列在回合表。`,'');
  }
  const interrupted=!rulesOnly && outcomes.some(group=>group.traces.some(trace=>trace.fallback));
  lines.splice(3,0,'驗收重跑用 '+coach.calls+' 次。前次診斷用 '+priorCalls+' 次，合計 '+(coach.calls+priorCalls)+'／'+(maxCalls+priorCalls)+' 次 API 呼叫。傷勢和校園事件是依官方應變原則設計的劇本分支，並非真實事故重建。','');
  if(interrupted) lines.splice(5,0,'> 有回合退回備援，本次未完成全程真實 API 驗收。','');
  const output=process.env.POCKETKB_STEP42_REPORT || path.resolve(__dirname,rulesOnly?'../logs/step42b-rule-samples.md':'../../docs/STEP_42_REVIEW_SAMPLES.md');
  fs.writeFileSync(output,'\uFEFF'+lines.join('\n'));
  console.log('API 呼叫 '+coach.calls+' 次，本輪累計 '+(coach.calls+priorCalls)+' 次。');
  const [m,good]=outcomes;
  assert.ok(outcomes.every(o=>o.traces.every(t=>(rulesOnly || !t.fallback)&&!forbidden.test(t.message))));
  assert.ok(m.endings.length===3 && m.endings.slice(0,2).every(e=>e.metrics.fatal_error_count===1&&e.canRetry));
  assert.ok(m.traces.some(t=>t.stages.includes('invited_npc')) && m.traces.some(t=>t.stages.includes('missed_roll_call')));
  assert.ok(m.traces.some(t=>t.stages.includes('pushing')) ? true : m.traces.some(t=>t.kind==='risk'&&/腳踝/.test(t.message)));
  assert.ok(m.endings[2].review.includes('關鍵轉折'));
  assert.equal(good.endings[0]?.ending.type,'安全撤離');
  assert.equal(good.endings[0]?.ending.injury,'無傷');
  assert.ok(good.traces.length>=7 && good.traces.length<=9);
  assert.ok(good.endings[0].review.includes('你做對的關鍵決定'));
  console.log(JSON.stringify({calls:coach.calls,outcomes:outcomes.map(o=>({label:o.label,turns:o.traces.length,
    endings:o.endings.map(e=>[e.ending.type,e.ending.injury])}))}));
}
module.exports={correct};
if(require.main===module) main().catch(error=>{console.error(error.message);process.exitCode=1;});
