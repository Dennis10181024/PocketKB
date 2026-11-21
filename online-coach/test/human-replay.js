'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {ConversationCoach,createOpenAIProvider}=require('../coach');
const {createSessionWriter}=require('../session-log');
const Quality=require('../quality');
const sets=require('./human-replay-sets.json');

const root=path.resolve(__dirname,'../..');
const report=path.join(root,'docs/STEP_32R_REPLAY.md');
const labels=['推進','已完成','確認','卡住'];

function classify(before,result,spec) {
  if (result.decision.quality_effect) {
    const effect=result.decision.quality_effect;
    return {label:effect==='advanced'?'推進':effect==='remembered'?'已完成':'卡住',
      reason:effect==='advanced'?[...result.decision.new_principles,...result.decision.completed_points.map(p=>p.node+(p.remembered?'（提前完成）':''))].join('、')
        :effect==='remembered'?'承接已完成原則，沒有要求重做':effect==='danger'?'獨立危險流程':'尚未完成本情境的核心應對'};
  }
  const events=result.state.events.slice(before.events.length);
  const goalEvents=events.filter(event=>['action','npc_handled','npc_emotion'].includes(event.kind));
  if (goalEvents.length || result.terminal) return {label:'推進',reason:goalEvents.map(event=>event.action || event.kind).join('、') || '結局'};
  if (events.some(event=>event.kind==='npc_acknowledged') || result.decision.actionValidation.some(item=>item.result==='ALREADY_COMPLETE'))
    return {label:'已完成',reason:'勸阻或動作目標先前已完成'};
  if (result.kind==='confirm' || result.decision.actionValidation.some(item=>item.result==='CONFIRMATION_PENDING'))
    return {label:'確認',reason:'現場角色詢問是否採取提議的動作'};

  const {actionValidation,validation}=result.decision;
  const here=spec.nodes.find(node=>node.id===before.node);
  if (result.kind==='question') return {label:'卡住',reason:'已回答提問；本回合沒有完成目標'};
  if (result.fallbackReason) return {label:'卡住',reason:`模型退回規則（${result.fallbackReason}）`};
  if (events.some(event=>event.kind==='blocked')) return {label:'卡住',reason:'程式擋下：前置現場條件未滿足'};
  if (actionValidation.some(item=>item.result==='NOT_EXECUTED' && item.confidence==='high' && !here.available.includes(item.id) && item.id!=='npc_dissuade'))
    return {label:'卡住',reason:'順序限制：目前節點未開放模型提議的動作'};
  if (actionValidation.some(item=>item.result!=='NOT_EXECUTED'))
    return {label:'卡住',reason:`程式擋下或證據受保護（${actionValidation.map(item=>item.result).join('、')}）`};
  return {label:'卡住',reason:actionValidation.length ? '模型信心低或可行動作未被採用' :
    `模型未提出動作（${validation}）；是否屬劇本缺項需查對原句`};
}

function cell(value) {
  return String(value ?? '—').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\|/g,'\\|').replace(/\r?\n/g,'<br>');
}
const row=values=>'| '+values.map(cell).join(' | ')+' |';

function writeReport(groups,probes,coach,limit,priorCalls) {
  const lines=['# 真人口吻重播','',
    '真實 OpenAI API，直接送入線上教練。句子照題組送出，每句一回合，全程未使用建議句。', '',
    '重跑指令：`node online-coach/test/human-replay.js --set all`。可指定單組或逗號分隔的組別，例如 `--set A,B,C,D`。', '',
    `本輪 API 呼叫 ${coach.calls} 次。含先前 ${priorCalls} 次，累計 ${priorCalls+coach.calls}/${limit}（包含理解、敘事及重試）。模型 \`${coach.provider.model}\`。`,
    '「卡住」按有無完成遊戲目標統計，含有回答但未改變目標的提問。程式會依動作紀錄初判原因，判斷不明的行保留待核對。','',
    '| 組別 | 推進 | 已完成 | 確認 | 卡住 | 最長連續卡住 | 不靠建議句到結局 | 結局 | 傷勢 | API 呼叫數 | 評估分布（良好／可接受／次佳／危險／無關） | 重播一致 |',
    '|---|---:|---:|---:|---:|---:|---|---|---|---:|---|---|'];
  for (const group of groups) lines.push(row([group.id,...labels.map(label=>group.counts[label]),group.longest,
    group.state.terminal&&!group.usedOriginalHint?'是':'否',group.state.state.endingType,group.state.state.injuryLevel,group.calls,
    Object.keys(Quality.names).map(key=>group.grades[key] || 0).join('／'),group.replay?'是':'否']));
  for (const group of groups) {
    lines.push('',`## ${group.id} 組 · ${group.label}`,'',`JSONL 場次 ID：\`${group.state.sessionId}\``,'',
      '| 回合 | 玩家原文 | 畫面敘事 | 採用動作 | 評估與命中原則 | 來源 | 驗證 | fallbackReason | 分類與原因 | 危險比對差異 |',
      '|---:|---|---|---|---|---|---|---|---|---|');
    for (const turn of group.turns) lines.push(row(turn));
    if (group.skipped.length) lines.push('',`未送出的原始回合：${group.skipped.join('、')}。`);
  }
  if (probes.length) {
    lines.push('','## E 組 · 每決策點的兩句異詞同義',
      '',`通過 ${probes.filter(item=>item.pass).length}/${probes.length}，以真實模型判為良好或可接受為準。`,'',
      '| 劇本 | 決策點 | 輸入 | 評估 | 命中原則 | 危險比對差異 |','|---|---|---|---|---|---|');
    for (const p of probes) lines.push(row([p.scenario,p.node,p.input,p.grade,p.principles,p.disagreement]));
  }
  fs.writeFileSync(report,'\uFEFF'+lines.join('\n')+'\n');
}

async function main() {
  const args=process.argv.slice(2);
  const selected=args.length===0?'ALL':args[0]==='--set' && args.length===2 ? args[1].toUpperCase() : '';
  const requested=selected==='ALL'?Object.keys(sets):selected.split(',');
  if (requested.some(id=>!Object.hasOwn(sets,id))) throw Error('用法 node online-coach/test/human-replay.js --set all|A|B|C|D|E；可用逗號選多組');
  process.env.POCKETKB_MAX_CALLS ||= '200';
  const provider=createOpenAIProvider({apiKey:process.env.OPENAI_API_KEY,model:process.env.OPENAI_MODEL || 'gpt-6.1-terra'});
  if (!provider.ready) throw Error('請在執行程序的環境變數設定 OPENAI_API_KEY');
  const limit=Number(process.env.POCKETKB_MAX_CALLS);
  const priorCalls=Number(process.env.POCKETKB_REPLAY_PRIOR_CALLS || 0);
  if (!Number.isSafeInteger(limit) || limit<1 || limit>200) throw Error('POCKETKB_MAX_CALLS 限 1–200');
  if (!Number.isSafeInteger(priorCalls) || priorCalls<0 || priorCalls>=limit) throw Error('已使用的 API 呼叫數必須小於上限');
  const coach=new ConversationCoach(provider,{formal:true,quality:true,maxCalls:limit-priorCalls,logText:true,record:createSessionWriter()});
  const groups=[];
  const probes=[];
  try {
    for (const [id,fixture] of Object.entries(sets).filter(([id])=>id!=='E' && requested.includes(id))) {
      const group={id,label:fixture.label,state:coach.create(fixture.scenario),counts:Object.fromEntries(labels.map(label=>[label,0])),
        longest:0,calls:0,turns:[],grades:{},skipped:[],usedOriginalHint:false};
      groups.push(group);
      const startingCalls=coach.calls;
      let streak=0;
      for (const [index,entry] of fixture.inputs.entries()) {
        if (group.state.terminal || coach.calls>=coach.maxCalls || entry.intent==='hint') {group.skipped.push(index+1);continue;}
        const input=typeof entry==='string'?entry:entry.text;
        const before=group.state.state;
        const result=await coach.turn(group.state.sessionId,{requestId:`human-replay-${id}-${index+1}`,
          revision:group.state.revision,intent:'action',text:input});
        const {decision,researchRecord}=result;
        const grade=decision.assessment?.category;
        group.usedOriginalHint ||= entry.originalHint===true;
        if (grade) group.grades[grade]=(group.grades[grade] || 0)+1;
        assert.equal(decision.hint_selected_index,null);
        assert.equal(researchRecord.input_text,input);
        const {label,reason}=classify(before,result,coach.specs.get(fixture.scenario));
        group.counts[label]++;
        streak=label==='卡住'?streak+1:0;
        group.longest=Math.max(group.longest,streak);
        group.state=result;
        group.calls=coach.calls-startingCalls;
        const adopted=decision.actionBatches.flatMap(batch=>batch.ids.map(id=>`${id} (${batch.source})`));
        if (result.state.events.slice(before.events.length).some(event=>event.kind==='npc_handled')) adopted.push(`npc_dissuade (${decision.source})`);
        if (decision.emotion) adopted.push(`emotion_${decision.emotion.category} (${decision.emotion.source})`);
        const matches=decision.assessment?.matches.map(item=>item.id).join('、') || '';
        group.turns.push([index+1,researchRecord.input_text,researchRecord.reply_text,adopted.join('、') || null,
          [Quality.names[grade],matches].filter(Boolean).join(' · '),decision.source,decision.validation,decision.fallbackReason,
          `${label} · ${reason}`,decision.assessment?.disagreement?JSON.stringify(decision.assessment.disagreement):null]);
        console.log(`${id}${index+1} ${before.node} → ${result.state.node} ${label} ${grade || result.kind} ${matches} ${reason}`);
      }
      const replay=Quality.replay(coach.specs.get(fixture.scenario),group.state.decisions);
      group.replay=JSON.stringify([replay.node,replay.endingType,replay.injuryLevel,replay.exposure,replay.quality])===
        JSON.stringify([group.state.state.node,group.state.state.endingType,group.state.state.injuryLevel,group.state.state.exposure,group.state.state.quality]);
      console.log(JSON.stringify({set:id,counts:group.counts,longest:group.longest,ending:group.state.state.endingType,
        injury:group.state.state.injuryLevel,calls:group.calls}));
    }
    if (requested.includes('E')) for (const [scenario,nodes] of Object.entries(sets.E.probes)) {
      for (const [node,inputs] of Object.entries(nodes)) for (const [index,input] of inputs.entries()) {
        if (coach.calls>=coach.maxCalls) break;
        const session=coach.create(scenario);
        const liveState=coach.sessions.get(session.sessionId).state;
        liveState.node=node;
        const isFire=scenario==='drill_fire_dorm';
        if (isFire && node!=='isolate') {
          liveState.facts.doorClosed=true;
          liveState.quality.met.barrier='isolate';
        }
        if (['feelings','worry'].includes(node)) Object.assign(liveState.npc,{handled:true,proposal:null});
        if (!isFire && ['injured','evacuate','assembly','return_choice'].includes(node))
          Object.assign(liveState.facts,{shaking:false,stairsChecked:true});
        const result=await coach.turn(session.sessionId,{requestId:`quality-probe-${node}-${index}`,revision:0,text:input});
        const verdict=result.decision.assessment;
        const pass=result.decision.source==='model' && ['good','acceptable'].includes(verdict?.category) &&
          verdict.matches.some(match=>Quality.point(coach.specs.get(scenario),{node}).principles.some(p=>p.id===match.id));
        probes.push({scenario,node,input,grade:verdict?.category || result.kind,principles:verdict?.matches.map(item=>item.id).join('、'),
          disagreement:verdict?.disagreement?JSON.stringify(verdict.disagreement):null,pass});
        console.log(`E ${scenario} ${node} ${index+1}: ${verdict?.category || result.kind} ${pass?'PASS':'FAIL'}`);
      }
    }
  } finally {
    writeReport(groups,probes,coach,limit,priorCalls);
    console.log(`API ${coach.calls} this run, ${priorCalls+coach.calls}/${limit} overall`);
  }
  if (groups.some(group=>!group.state.terminal || group.longest>1 || group.usedOriginalHint || !group.replay) ||
      requested.includes('E') && (probes.length!==34 || probes.some(probe=>!probe.pass))) process.exitCode=2;
}

main().catch(error=>{console.error(error.code || error.message);process.exitCode=1;});
