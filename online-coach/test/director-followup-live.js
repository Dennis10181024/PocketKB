'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {ConversationCoach,createOpenAIProvider}=require('../coach');
const {createSessionWriter}=require('../session-log');
const {groups}=require('./earthquake-director-live');

const root=path.resolve(__dirname,'../..');
const logs=path.join(root,'online-coach/logs');
const fireReport=path.join(root,'docs/DIRECTOR_REPLAY.md');
const schoolReport=path.join(root,'docs/EARTHQUAKE_DIRECTOR_REPLAY.md');
const heading='## 4.1 補跑與旁白證據檢查';
const cell=value=>String(value??'—').replace(/\|/g,'\\|').replace(/\r?\n/g,'<br>');
const row=values=>'| '+values.map(cell).join(' | ')+' |';

function restoreFire(coach) {
  const source=fs.readFileSync(fireReport,'utf8').match(/^## G 組（場次 ([\w-]+)）/m)?.[1];
  assert.ok(source,'找不到 G 組原場次');
  const logfile=fs.readdirSync(logs).map(day=>path.join(logs,day,source+'.jsonl')).find(file=>fs.existsSync(file));
  assert.ok(logfile,'找不到 G 組 JSONL');
  const rows=fs.readFileSync(logfile,'utf8').trim().split(/\r?\n/).map(JSON.parse);
  assert.ok(rows.every(item=>typeof item.input_text==='string' && typeof item.reply_text==='string'));
  assert.ok(!rows.at(-1).ending_type,'G 組的原始場次已完成');
  const snapshot=coach.create('drill_fire_dorm');
  const session=coach.sessions.get(snapshot.sessionId);
  const director=session.director;
  let state=director.start();
  for(const item of rows) {
    if (item.director) {
      const turn=director.apply(state,item.director,{question:item.director.isQuestion});
      state=turn.state;
      session.state.events.push(...turn.events);
    }
    if (!item.director?.rewind) session.history.push({role:'user',content:item.input_text || item.intent},
      {role:'assistant',content:item.reply_text});
  }
  const last=rows.at(-1);
  assert.equal(state.clock,last.director.clock);
  assert.deepEqual(state.exposure,last.exposure);
  session.state.director={...state,lastText:last.reply_text};
  session.state.exposure={...state.exposure};
  Object.assign(session.state.npc,director.npcState(state));
  session.state.directorResearch=last.director_research;
  session.revision=last.turn;
  session.history=session.history.slice(-24);
  session.lastDisplayedReply=last.reply_text;
  return {snapshot:coach.snapshot(session),source};
}

function append(file,lines) {
  const original=fs.readFileSync(file,'utf8');
  fs.writeFileSync(file,original.split('\n'+heading+'\n')[0].trimEnd()+'\n\n'+heading+'\n\n'+lines.join('\n')+'\n');
}

async function main() {
  const limit=Number(process.env.POCKETKB_MAX_CALLS || 40);
  assert.ok(Number.isInteger(limit) && limit>=1 && limit<=40,'此補跑的 API 上限是 40 次');
  const provider=createOpenAIProvider({apiKey:process.env.OPENAI_API_KEY,model:process.env.OPENAI_MODEL || 'gpt-6.1-terra'});
  assert.ok(provider.ready,'需要 OPENAI_API_KEY');
  let reaction;
  const countedProvider={...provider,async generate(stage,...params) {
    const result=await provider.generate(stage,...params);
    if (stage==='narrate_director') reaction=result.value?.reaction || '';
    return result;
  }};
  const coach=new ConversationCoach(countedProvider,{formal:true,quality:true,director:true,logText:true,maxCalls:limit,record:createSessionWriter()});
  const continued=restoreFire(coach);
  const suites=[
    {name:'宿舍火災 G 組續跑',s:continued.snapshot,inputs:Array(7).fill('我們留在房間等救援'),file:fireReport,from:continued.source},
    ...['正確','易誤判安全句'].map(name=>({name,s:coach.create('earthquake_school'),inputs:groups[name],file:schoolReport})),
  ];
  const summaries=[];
  const reports=new Map();
  for(const suite of suites) {
    let s=suite.s;
    const startCalls=coach.calls;
    const turns=[];
    const lines=['### '+suite.name,'','補跑 JSONL 場次 `'+s.sessionId+'`。'];
    if(suite.from) lines.push('從原場次 `'+suite.from+'` 的已存判定與對話重建第 '+s.revision+' 回合後的狀態。沿用原本用於補足回合的等待句。');
    lines.push('','| 回合 | 輸入 | 判定 | 時鐘 | 旁白驗證 | 顯示內容 |','|---:|---|---|---:|---|---|');
    for(const text of suite.inputs) {
      if(s.terminal || coach.calls>=limit)break;
      reaction=null;
      s=await coach.turn(s.sessionId,{requestId:'director-followup-'+s.revision,text,intent:'action',revision:s.revision});
      const decision=s.decision;
      const check=decision.narration_checks[0];
      turns.push({turn:decision.turn,kind:s.kind,check,danger:decision.director?.danger?.id,fallback:s.fallbackReason});
      if (s.kind!=='rewind' && s.kind!=='failed' && !s.fallbackReason) assert.ok(check,'旁白驗證紀錄缺漏');
      lines.push(row([decision.turn,text,s.kind,decision.director?.clock,check?.accepted?'採用':check?.reason || '無旁白',
        s.researchRecord.reply_text]));
      if (check && !check.accepted && !check.providerFailure && reaction) lines.push(row(['','', '','', '被拒原句',reaction]));
      console.log(suite.name,decision.turn,s.kind,check?.reason || (check?.accepted?'ACCEPTED':'NO_NARRATION'));
    }
    const failures=turns.filter(turn=>turn.check && !turn.check.accepted && !turn.check.providerFailure);
    const summary={name:suite.name,ending:s.state.endingType,injury:s.state.injuryLevel,calls:coach.calls-startCalls,
      blocked:failures.length,reasons:failures.map(t=>[t.turn,t.check.reason]),
      narrated:turns.filter(turn=>turn.check).length,providerErrors:turns.filter(t=>t.check?.providerFailure || t.fallback).length,
      dangerousTurns:turns.filter(t=>t.danger).length};
    summaries.push(summary);
    lines.push('',`結局：${s.ending?.type || '未結束'}／${s.ending?.injury || '—'}。API ${summary.calls} 次。旁白驗證退回 ${summary.blocked}/${summary.narrated} 回合，API 失敗 ${summary.providerErrors} 回合。`,'');
    reports.set(suite.file,[...(reports.get(suite.file) || []),...lines]);
  }
  for(const [file,lines] of reports) append(file,lines);
  console.log(JSON.stringify({total:coach.calls,limit,summaries}));
  assert.ok(summaries[0].ending,'火災 G 未到結局');
  assert.equal(summaries[1].ending,'SELF_EVACUATION');
  assert.equal(summaries[1].injury,'NONE');
  assert.ok(summaries[2].ending,'易誤判安全句組未到結局');
  assert.equal(summaries[2].dangerousTurns,0);
  assert.ok(summaries.every(s=>s.providerErrors===0),'有 API 失敗');
}

main().catch(error=>{console.error(error.message);process.exitCode=1;});
