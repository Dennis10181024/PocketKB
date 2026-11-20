import './drill-language.js';
import './drill-events.js';
import './scenario-engine-v3.js';
import './drill-presentation.js';

const app = document.querySelector('#app');
const presentation = globalThis.DrillPresentation;
const online = {catalog:[],session:null,draft:'',busy:false,error:'',selected:'drill_fire_dorm',observation:false,choice:null};
const idle = {remaining:45000,started:0,timer:null};
const esc = text => String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const specFor = id => online.catalog.find(row=>row.id===id)?.spec;
function post(body,signal) {
  return {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal};
}
async function json(route, body) {
  const signal = AbortSignal.timeout(4000);
  const response = await fetch(route,body ? post(body,signal) : {signal});
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || '無法連上線上教練。');
  return value;
}
async function streamTurn(id,request,onPart,signal) {
  const response = await fetch('/api/sessions/'+id+'/turn/stream',post(request,AbortSignal.any([signal,AbortSignal.timeout(12500)])));
  if (!response.ok) throw new Error('線上回合未完成。');
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  try {
    while (true) {
      const {value,done}=await reader.read();
      if (done) break;
      buffer+=value;
      const frames=buffer.split('\n\n');
      buffer=frames.pop();
      for (const frame of frames) {
        const [event,data]=frame.split('\n');
        const payload=JSON.parse(data.slice(6));
        if (event==='event: narration') onPart(payload);
        if (event==='event: settled') return payload;
      }
    }
  } finally { await reader.cancel(); }
  throw new Error('連線在確認回合前中斷。');
}
function records() {
  try { return JSON.parse(localStorage.getItem('pocketkb-online-records') || '[]'); } catch { return []; }
}
function save(result,exited=false) {
  const rows=records();
  if (rows.some(row=>row.sessionId===result.sessionId)) return;
  rows.unshift({sessionId:result.sessionId,title:result.scene.title,
    ending_type:exited?'EXITED':result.state.endingType,injury_level:result.state.injuryLevel,
    ending:result.ending,decisions:result.decisions,time:new Date().toISOString()});
  localStorage.setItem('pocketkb-online-records',JSON.stringify(rows.slice(0,30)));
}
function suspendIdle(reset=false) {
  if (idle.timer!==null) {
    clearTimeout(idle.timer);
    idle.remaining=Math.max(0,idle.remaining-(performance.now()-idle.started));
    idle.timer=null;
  }
  if (reset) idle.remaining=45000;
}
function syncIdle() {
  suspendIdle();
  if (document.hidden || online.busy || !online.session || online.session.terminal || online.session.suggestions?.length) return;
  idle.started=performance.now();
  idle.timer=setTimeout(()=>{
    idle.timer=null;
    idle.remaining=45000;
    if (!document.hidden && !online.busy && online.session && !online.session.terminal) void send('','hint','idle');
  },idle.remaining);
}
function render() {
  const s=online.session;
  const node=s?.scene.node;
  const disabled=online.busy?'disabled':'';
  app.innerHTML=`<main class="app-shell"><div class="app-frame online-frame step23">
    <header class="drill-head"><h1>情境演練</h1>${s ? '<button class="ghost" id="onlineRestart">'+(s.terminal?'另開一次練習':'停止演練')+'</button>' : '<a href="./index.html">返回離線功能</a>'}</header>
    ${!s ? `<section class="drill-panel"><h2>選一個情境</h2>
      <p class="drill-notice">演練中可能出現受傷的結果，你可以隨時停止。</p>
      <p>用自己的話輸入行動或問題。需要時先看看四周，或查看建議句。線上送出時請勿輸入個人資料。</p>
      <label for="onlineScenario">情境</label><select id="onlineScenario" ${disabled}>${online.catalog.map(row=>`<option value="${esc(row.id)}" ${online.selected===row.id?'selected':''}>${esc(row.title)}</option>`).join('')}</select>
      <button class="primary" id="onlineStart" ${online.busy||!online.catalog.length?'disabled':''}>開始線上練習</button></section>
      <details><summary>演練紀錄</summary>${records().map(row=>`<p>${esc(row.title)} · ${esc(row.ending_type==='EXITED'?'已退出':row.ending?.type || '已結束')}</p>`).join('') || '<p>目前沒有紀錄。</p>'}</details>` : `
      <h2>${esc(s.scene.title)}</h2>
      ${s.offline?'<p class="offline-label" role="status">目前使用離線判讀</p>':''}
      ${s.terminal ? `<section class="fire-review drill-panel" aria-live="polite">
        <h3>${esc(s.ending?.type)}</h3><p class="drill-notice">${esc(s.ending?.injury)}</p><p>${esc(s.ending?.text)}</p>
        <h3>簡單回顧</h3><p>結果：${esc(s.ending?.type)} · ${esc(s.ending?.injury)}</p>
        ${s.ending?.decisions.length ? `<h4>關鍵決策</h4><ul>${s.ending.decisions.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>` : ''}
        ${s.ending?.causes.length ? `<h4>造成傷勢的步驟</h4><ul>${s.ending.causes.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>` : ''}
      </section>` : `
      <section class="task-box drill-panel" ${online.timing ? `data-first-ms="${online.timing.first}" data-complete-ms="${online.timing.complete}"` : ''}>
        <h3>現在發生什麼</h3>
        <div class="judge-box" id="currentNarration" aria-live="${online.busy?'off':'polite'}"><p class="online-reply">${esc(s.reply || node.situation)}</p></div>
        ${s.scene.status?.length ? `<ul class="drill-status">${s.scene.status.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>` : ''}
        <h3>我面臨什麼決定</h3><p>${esc(node.task)}</p>
      </section>
      <section class="drill-panel drill-input" aria-label="你的輸入">
        <label for="onlineInput">你的行動或問題</label>
        <textarea id="onlineInput" maxlength="2000" rows="2" ${disabled}>${esc(online.draft)}</textarea>
        <div class="drill-commands">
          <button class="ghost" id="onlineObserve" aria-expanded="${online.observation}" ${disabled}>看看四周</button>
          <button class="ghost" id="onlineHint" aria-expanded="${Boolean(s.suggestions?.length)}" ${disabled}>我想不到怎麼做</button>
          <button class="primary" id="onlineSend" ${disabled}>${online.busy?'正在處理這次決定':'送出'}</button>
        </div>
        ${online.observation?`<p class="drill-observation">${esc(presentation.sceneText(node.observation || node.situation))}</p>`:''}
        ${s.suggestions?.length?`<div class="drill-hints"><h3>可以試著這樣說</h3>${s.suggestions.map((text,index)=>`<button class="ghost" data-hint="${index}" ${disabled}>${esc(text)}</button>`).join('')}</div>`:''}
      </section>`}
      ${s.citations?.length?`<details><summary>本回合來源</summary>${s.citations.map(item=>`<p><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.title)}</a></p>`).join('')}</details>`:''}
    `}
    <p id="onlineError" role="status">${esc(online.error)}</p></div></main>`;
  document.querySelector('#onlineScenario')?.addEventListener('change',event=>{online.selected=event.target.value;});
  document.querySelector('#onlineStart')?.addEventListener('click',start);
  document.querySelector('#onlineInput')?.addEventListener('input',event=>{
    online.draft=event.target.value;
    if (online.choice!==null) online.edited=true;
  });
  document.querySelector('#onlineSend')?.addEventListener('click',()=>send(online.draft));
  document.querySelector('#onlineObserve')?.addEventListener('click',()=>{online.observation=!online.observation;render();document.querySelector('#onlineObserve')?.focus();});
  document.querySelector('#onlineHint')?.addEventListener('click',()=>send('','hint','button'));
  document.querySelectorAll('[data-hint]').forEach(button=>button.addEventListener('click',()=>{
    online.choice=Number(button.dataset.hint);
    online.edited=false;online.draft=s.suggestions[online.choice];
    const field=document.querySelector('#onlineInput');field.value=online.draft;field.focus();
  }));
  document.querySelector('#onlineRestart')?.addEventListener('click',()=>{
    if (!s.terminal && !confirm('確定停止這次演練？紀錄會標為已退出。')) return;
    if (!s.terminal) save(s,true);
    online.controller?.abort();suspendIdle(true);
    Object.assign(online,{session:null,draft:'',choice:null,busy:false,observation:false,error:'',timing:null});
    render();document.querySelector('#onlineStart')?.focus();
  });
}

async function start() {
  online.busy=true;online.error='';render();
  try {
    online.session=await json('/api/sessions',{scenarioId:online.selected}).catch(()=>localResult({sessionId:crypto.randomUUID(),scenarioId:online.selected,revision:-1},null));
  } catch (error) {online.error=error.message;}
  finally {online.busy=false;suspendIdle(true);render();syncIdle();document.querySelector('#onlineInput')?.focus();}
}
function localResult(session,request) {
  const spec=specFor(session.scenarioId);
  const engine=globalThis.ScenarioEngineV3;
  const before=session.state || engine.create(spec,{onlineExperience:true});
  let result=request?.intent==='action'?engine.step(spec,before,request.text,request.intent):{state:before,kind:'hint',message:session.reply || ''};
  if (result.kind==='question') {
    const answer=spec.onlineExperience.questions.find(item=>new RegExp(item.pattern).test(request.text));
    const proposed=spec.onlineExperience.questionSpeaker[before.node];
    const speaker=proposed==='接線員' && !before.events.some(event=>event.action==='call')?spec.npc.name:proposed || spec.npc.name;
    result={...result,state:before,sourceIds:answer?.sourceIds || [],
      message:answer?`${speaker}說：「${answer.answer}」`:'眼前的資訊還不足以回答這個問題。'};
  }
  const state=result.state;
  const node=spec.nodes.find(item=>item.id===state.node);
  const terminal=state.sessionStatus!=='ACTIVE';
  const reset=before.node!==state.node || terminal;
  let hintContext=reset?null:session.hintContext;
  let invalidStreak=reset?0:session.invalidStreak || 0;
  if (!reset && request?.intent==='action' && result.kind!=='question') invalidStreak=result.kind==='clarify'?invalidStreak+1:0;
  if (!reset && !hintContext && (request?.hintTrigger || invalidStreak>=2)) {
    const options=[...node.experience.suggestions];
    for (let index=options.length-1;index>0;index--) {
      const other=Math.floor(Math.random()*(index+1));
      [options[index],options[other]]=[options[other],options[index]];
    }
    hintContext={options,trigger:request.hintTrigger || 'invalid_streak',turn:session.revision+2};
  }
  const decision=request?{turn:session.revision+1,source:'rule',hint_shown:Boolean(session.hintContext),hint_shown_turn:hintContext?.turn,
    hint_trigger:hintContext?.trigger,hint_selected_index:request.hintSelectedIndex,hint_edited_before_submit:request.hintEditedBeforeSubmit,
    actionIds:engine.adoptedActionIds(before,state)}:null;
  const reply=presentation.sceneText(result.message);
  return {...session,revision:session.revision+1,state,terminal,offline:true,localOnly:true,reply,
    suggestions:hintContext?.options || [],hintContext,invalidStreak,decisions:[...(session.decisions || []),...(decision?[decision]:[])],
    citations:globalThis.DrillEvents.citations(spec,before,result),
    ending:terminal?presentation.summary(spec,state,reply):null,
    scene:{title:spec.title,node:!request?{...node,situation:node.situation+' '+spec.npc.online.proposal}:node,status:presentation.status(spec,state)}};
}

async function send(text,intent='action',hintTrigger) {
  const snapshot=online.session;
  if (online.busy || !snapshot || snapshot.terminal || (intent==='action'&&!text.trim()) || (intent==='hint'&&snapshot.suggestions?.length)) return;
  const request={requestId:crypto.randomUUID(),revision:snapshot.revision,text,intent,hintTrigger,
    hintSelectedIndex:intent==='action'?online.choice:null,
    hintEditedBeforeSubmit:intent==='action'&&online.choice!==null?Boolean(online.edited):null};
  suspendIdle();
  const controller=new AbortController();
  Object.assign(online,{busy:true,controller,error:'',timing:null});render();
  const started=performance.now();
  let first=null,preview='';
  try {
    let result;
    try {
      result=snapshot.localOnly?localResult(snapshot,request):await streamTurn(snapshot.sessionId,request,part=>{
        if (controller.signal.aborted || intent==='hint') return;
        preview+=part;
        const output=document.querySelector('#currentNarration .online-reply');
        if (output) {output.textContent=preview;first ??= performance.now()-started;}
      },controller.signal);
    } catch {
      if (controller.signal.aborted) return;
      result=localResult(snapshot,request);
    }
    if (controller.signal.aborted || online.session?.sessionId!==snapshot.sessionId) return;
    if (intent==='hint') result={...result,reply:snapshot.reply,citations:snapshot.citations};
    else {
      online.timing={first:Math.round(first ?? performance.now()-started),complete:Math.round(performance.now()-started),
        usage:result.narrationUsage || []};
      document.dispatchEvent(new CustomEvent('pocketkb-turn',{detail:{...online.timing,result}}));
      Object.assign(online,{draft:'',choice:null,edited:false,observation:false});
    }
    online.session=result;
    if (result.terminal) save(result);
  } catch (error) {online.error=error.message;}
  finally {
    if (!controller.signal.aborted && online.controller===controller) {
      online.busy=false;suspendIdle(true);render();syncIdle();
      if (intent==='action') document.querySelector('#onlineInput')?.focus();
    }
  }
}
document.addEventListener('visibilitychange',syncIdle);
window.addEventListener('beforeunload',event=>{if(online.session&&!online.session.terminal){event.preventDefault();event.returnValue='';}});
render();
json('/api/scenarios').then(value=>{online.catalog=value.scenarios;render();}).catch(()=>{online.error='請透過電腦的本機線上教練開啟這個頁面。';render();});
