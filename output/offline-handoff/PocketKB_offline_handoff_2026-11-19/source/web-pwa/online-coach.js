import './drill-language.js';
import './drill-events.js';
import './fire-engine.js';
import './scenario-engine-v3.js';

// Browser adapter: no API key or cloud credentials are stored in this client.
const app = document.querySelector('#app');
const online = { catalog: [], session: null, messages: [], draft: '', mode: 'action', busy: false, error: '', pending: null, selected: 'drill_fire_dorm', saved: new Set() };
const esc = text => String(text ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
const physicalLabel = status => ({ EXPOSED:'仍在風險中', EVACUATED:'已撤離至相對安全處', WAITING_RESCUE:'穩定待救・尚未獲救', SHELTERED:'暫時掩蔽', RESCUED:'已由救援人員接觸', CRITICAL:'危急失敗' }[status] || '請依目前現場判斷');
async function api(route, body) {
  const response = await fetch(route, { method: body ? 'POST' : 'GET', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(route.endsWith('/turn') ? 8500 : 4000) });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || '連線未完成，請確認電腦的線上教練已啟動。');
  return value;
}
function saveReview(result) {
  if (!result.terminal || online.saved.has(result.sessionId)) return;
  const key = 'pocketkb-online-records';
  const rows = JSON.parse(localStorage.getItem(key) || '[]');
  if (!rows.some(row => row.sessionId === result.sessionId)) {
    rows.unshift({ sessionId: result.sessionId, title: result.scene.title, physicalStatus: result.scene.physicalStatus, review: result.review, messages: online.messages, time: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(rows.slice(0, 30)));
  }
  online.saved.add(result.sessionId);
}
function render() {
  const s = online.session;
  const node = s?.scene.node;
  app.innerHTML = `<main class="app-shell"><div class="app-frame online-frame">
    <a href="./index.html">返回離線功能</a><div class="fire-heading"><h1 class="section-title">GPT 情境演練</h1><span class="status-pill">線上教練 · 學習模式</span></div>
    ${!s ? `<p class="section-note">說出你的想法、疑問或下一步。教練會參考現場與前文回應。對話會傳送至 OpenAI，請勿填寫真實姓名、地址等個人資料。</p>
    <label for="onlineScenario">選擇情境</label><select id="onlineScenario" ${online.busy ? 'disabled' : ''}>${online.catalog.map(row=>`<option value="${esc(row.id)}" ${online.selected===row.id?'selected':''}>${esc(row.title)}</option>`).join('')}</select>
    <div class="button-row"><button class="primary" id="onlineStart" ${online.busy || !online.catalog.length?'disabled':''}>開始線上練習</button></div>` : `
    <h2>${esc(s.scene.title)}</h2><p class="stage-summary">${s.terminal ? '演練已結束' : esc(node.title)} · ${esc(physicalLabel(s.scene.physicalStatus))}</p>
    ${s.offline ? '<p class="tiny" role="status">目前使用離線判讀</p>' : ''}
    <section class="task-box"><h3>現場發生什麼</h3><p>${esc(node.situation)}</p>${!s.terminal?`<h3>目前要決定什麼</h3><p>${esc(node.task)}</p>`:''}</section>
    ${online.pending && online.pending.intent!=='observe' ? `<p class="tiny">待確認內容：${esc(online.pending.text)}</p>`:''}
    ${online.messages.length ? `<section class="judge-box ${s.state.sessionStatus==='FAILED'||s.state.outcome==='FAILED'?'failed':''}" aria-live="polite"><p class="tiny">你的輸入：${esc(online.messages.at(-2)?.text)}</p><p class="online-reply">${esc(online.messages.at(-1)?.text)}</p></section>` : ''}
    ${(s.citations || []).map(source=>`<p class="tiny"><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a></p>`).join('')}
    ${!s.terminal ? `<div class="button-row"><button class="ghost" id="onlineObserve" ${online.busy?'disabled':''}>觀察環境</button></div>
    <fieldset class="intent-picker"><legend>你的輸入</legend>${[['action','想法或行動'],['question','只詢問，不執行']].map(([value,label])=>`<label><input type="radio" name="onlineIntent" value="${value}" ${online.mode===value?'checked':''} ${online.busy?'disabled':''}>${label}</label>`).join('')}</fieldset>
    <label for="onlineInput">你想做什麼，或想確認什麼？</label><textarea id="onlineInput" maxlength="2000" rows="3" ${online.busy?'disabled':''}>${esc(online.draft)}</textarea>
    <div class="button-row"><button class="primary" id="onlineSend" ${online.busy?'disabled':''}>${online.busy?'教練正在理解你的回答…':online.pending?'重試上一筆回答':'送出'}</button></div>` : `<section class="fire-review"><h3>這次練習的回顧</h3><p>${esc(s.review)}</p></section>`}
    ${online.messages.length ? `<details><summary>完整對話（${online.messages.length} 則）</summary>${online.messages.map(m=>`<p class="online-reply"><strong>${m.role==='user'?'你':'教練'}：</strong>${esc(m.text)}</p>`).join('')}</details>`:''}
    <details><summary>適用範圍與來源</summary><p>${esc(s.scene.notice)}</p>${s.scene.sources.map(source=>`<p><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a></p>`).join('')}</details>
    <div class="button-row"><button class="ghost" id="onlineRestart" ${online.busy?'disabled':''}>${s.terminal?'另開一次練習':'結束並返回情境選擇'}</button></div>`}
    <p id="onlineError" class="online-error" role="status">${esc(online.error)}</p>
    ${!s ? '<p class="tiny"><a href="./setup.html">設定這台電腦的 GPT 教練</a></p>' : ''}
    ${!s ? `<details><summary>線上演練紀錄</summary>${readRecords().map(row=>`<article class="record-card"><h3>${esc(row.title)} · ${esc(physicalLabel(row.physicalStatus))}</h3><p class="online-reply">${esc(row.review)}</p></article>`).join('') || '<p>尚無完成的線上演練紀錄。</p>'}</details>`:''}
    </div></main>`;
  document.querySelector('#onlineScenario')?.addEventListener('change', e=>{online.selected=e.target.value;});
  document.querySelector('#onlineStart')?.addEventListener('click', start);
  document.querySelector('#onlineInput')?.addEventListener('input', e=>{online.draft=e.target.value;});
  document.querySelectorAll('[name="onlineIntent"]').forEach(el=>el.addEventListener('change', e=>{online.mode=e.target.value;}));
  document.querySelector('#onlineSend')?.addEventListener('click', ()=>send(online.draft, online.mode));
  document.querySelector('#onlineObserve')?.addEventListener('click', ()=>send('', 'observe'));
  document.querySelector('#onlineRestart')?.addEventListener('click', ()=>{
    if (!s.terminal && !confirm('這次演練尚未完成，確定結束？已完成的紀錄仍保留。')) return;
    online.session=null; online.messages=[]; online.pending=null; online.draft=''; online.error=''; render();
  });
}
function readRecords() { try { return JSON.parse(localStorage.getItem('pocketkb-online-records') || '[]'); } catch { return []; } }
async function start() {
  online.busy=true; online.error=''; render();
  try {
    try {
      online.session=await api('/api/sessions',{scenarioId:online.selected});
    } catch {
      const spec = online.catalog.find(row => row.id === online.selected).spec;
      online.session=localResult({sessionId:crypto.randomUUID(), scenarioId:spec.id, revision:-1}, null);
    }
    online.messages=[]; online.pending=null; online.draft='';
  } catch(e) { online.error=e.message; }
  finally { online.busy=false; render(); }
}
function localResult(session, request) {
  const spec = online.catalog.find(row => row.id === session.scenarioId).spec;
  const fire = spec.id === 'drill_fire_dorm';
  const engine = fire ? globalThis.FireDrill : globalThis.ScenarioEngineV3;
  const result = request ? engine.step(spec, session.state, request.text, request.intent) : {state:engine.create(spec), message:''};
  const {state} = result;
  const terminal = fire ? state.outcome !== 'CONTINUE' : state.sessionStatus !== 'ACTIVE';
  const physicalStatus = fire ? ({FAILED:'CRITICAL',SUCCESS:'WAITING_RESCUE'}[state.outcome] || 'EXPOSED') : state.physicalStatus;
  const node = fire ? spec.nodes[state.node] : spec.nodes.find(item => item.id === state.node);
  const citations = request ? globalThis.DrillEvents.citations(spec,session.state,result) : [];
  const reply = request && !citations.length && !['observe','hint'].includes(request.intent)
    ? `我收到你說的「${request.text.slice(0,120)}」。你是在描述現場、詢問，還是在說自己現在決定採取的行動？` : result.message;
  return {...session, revision:session.revision+1, state, terminal, offline:true, localOnly:true, reply,
    citations,
    review:terminal ? engine.review(spec,state) : '', scene:{title:spec.title, notice:spec.notice, sources:spec.sources, node, physicalStatus}};
}
async function send(text, intent) {
  if (online.busy || !online.session || (intent!=='observe' && !text.trim())) return;
  if (online.pending && (online.pending.text!==text || online.pending.intent!==intent)) {
    online.error='上一筆回答尚未確認，請先重試原內容，或結束並另開一次練習。'; render(); return;
  }
  online.pending ||= { requestId:crypto.randomUUID(),revision:online.session.revision,text,intent };
  const request=online.pending; const sessionId=online.session.sessionId;
  online.busy=true; online.error=''; render();
  try {
    const snapshot=online.session;
    let result;
    try {
      result=snapshot.localOnly ? localResult(snapshot,request) : await api(`/api/sessions/${sessionId}/turn`,request);
    } catch {
      // Abandon the remote session after an ambiguous transport failure.
      result=localResult(snapshot,request);
    }
    if (online.session?.sessionId!==sessionId) return;
    online.session=result; online.messages.push({role:'user',text:text || '觀察環境'},{role:'assistant',text:result.reply});
    online.pending=null; if(intent!=='observe') online.draft=''; saveReview(result);
  } catch(e) { online.error=e.message+' 草稿仍保留；同筆重試不會重複執行行動。'; }
  finally { online.busy=false; render(); }
}
window.addEventListener('beforeunload',event=>{if(online.session&&!online.session.terminal){event.preventDefault();event.returnValue='';}});
render();
api('/api/scenarios').then(value=>{online.catalog=value.scenarios;render();}).catch(()=>{online.error='請透過電腦的 http://127.0.0.1:5175/ 開啟線上演練。';render();});
