(function(root) {
  const endings = {SELF_EVACUATION:'自行撤離', SAFE_RESCUE:'安全待救獲救', DELAYED_RESCUE:'延誤後獲救', CRITICAL_FAILURE:'危急失敗', EXITED:'已退出'};
  const injuries = {NONE:'無傷', MILD:'輕傷', MODERATE:'中度傷勢（需送醫）', SEVERE:'重傷（需住院治療）', NOT_ASSESSED:'傷勢不評定', BASELINE:'傷勢未加重'};
  const sceneText = text => String(text || '').replace(/模擬119/g,'119').replace(/模擬通報/g,'通報').replace(/(?:模擬|演練)中/g,'現場').replace(/這段演練|此演練|本次演練/g,'目前情況').replace(/演練|模擬/g,'');
  const isConnectionFallback = reason => ['TURN_TIMEOUT','MODEL_TIMEOUT','CLIENT_TRANSPORT','CLIENT_API_ERROR','PROVIDER_ERROR','MODEL_UNAVAILABLE','MODEL_INCOMPLETE'].includes(reason);
  function fallbackNotice(reason,recovered) {
    if (reason==='TURN_TIMEOUT' || reason==='MODEL_TIMEOUT') return '這回合連線逾時，暫時改用離線判讀。';
    if (reason==='CLIENT_TRANSPORT') return '這回合連線中斷或逾時，暫時改用離線判讀。';
    if (isConnectionFallback(reason)) return '線上服務這回合未完成請求，暫時改用離線判讀。';
    return recovered ? '已恢復線上判讀。' : '';
  }
  function questionAnswer(spec,state,text) {
    const entry = spec.onlineExperience.questions.find(item=>(!item.nodes || item.nodes.includes(state.node)) && new RegExp(item.pattern).test(text));
    const quality=state.quality;
    const knownActions=quality ? {
      call:quality.met.dial,close:quality.met.barrier,seal:quality.met.seal_gap,
      address:quality.report.address,room:quality.report.room,headcount:quality.report.headcount,
      smoke_report:quality.report.condition,signal_window:quality.met.signal,
    } : {};
    const completed = id => Boolean(knownActions[id]) || state.events.some(event=>event.kind==='action' && event.action===id);
    const variant = entry?.variants?.find(item =>
      Object.entries(item.whenFacts || {}).every(([key,value])=>state.facts[key]===value) &&
      (item.whenActions || []).every(completed) && (item.withoutActions || []).every(id=>!completed(id)));
    const answer = variant?.answer || entry?.answer;
    let speaker = spec.onlineExperience.questionSpeaker?.[state.node] || spec.npc.name;
    if (speaker==='接線員' && !completed('call')) speaker=spec.npc.name;
    const unknown = spec.onlineExperience.unknownAnswer || '我望了一眼四周，這裡沒有能讓我確認的線索。';
    return {message:answer ? `${speaker}說：「${sceneText(answer)}」` : unknown,
      sourceIds:answer ? entry.sourceIds : [],answerId:answer ? entry.id : null};
  }
  function rejectionLine(spec,state) {
    const node = spec.nodes.find(item=>item.id===state.node);
    const lines = node.experience.rejection || [`我${node.experience.sensory[0].text}，眼前還有這件事得先確認。`];
    return lines[(state.elapsed || 0) % lines.length];
  }
  function resumeState(state) {
    const canonical = value=>Array.isArray(value)?value.map(canonical):value && typeof value==='object' ?
      Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])) : value;
    return JSON.stringify(canonical({node:state.node,accepted:state.accepted,facts:state.facts,resources:state.resources,elapsed:state.elapsed || 0,
      npc:state.npc, exposure:state.exposure, endingType:state.endingType, injuryLevel:state.injuryLevel}));
  }
  function status(spec,state) {
    const view = [];
    const events = state.events || [];
    const affected = events.some(event=>event.eventId?.startsWith('elapsed-'));
    if (spec.id==='drill_fire_dorm') view.push(affected ? '警示：走廊煙變濃' : '警示：走廊有濃煙');
    if (spec.id==='flood_low_home' && affected) view.push('警示：外部積水上升');
    if (spec.id==='barrier_lake_downstream') view.push(state.node==='cutoff' ? '警示：原撤離路線中斷' : '撤離窗口仍開放');
    if (spec.id==='landslide_mountain_road') view.push('警示：前方道路封閉');
    if (spec.id==='earthquake_school' && state.node==='shaking') view.push('警示：主要搖晃尚未停止');
    if (spec.id==='earthquake_home_trapped' && state.node==='contact') view.push('手機電量 '+state.resources.battery+'%');
    if (state.npc?.proposal) view.push(`${spec.npc.name}：${state.npc.proposal}`);
    return view.slice(0,2);
  }
  function summary(spec,state,reply) {
    const label = id=>spec.actions.find(action=>action.id===id)?.label || id;
    const risk = [...new Set(state.events.filter(event=>event.kind==='hazard').map(event=>event.action).filter(Boolean))];
    const good = [...new Set(state.events.filter(event=>event.kind==='action').map(event=>event.action).filter(id=>id && !risk.includes(id)))];
    const causes = state.injuryCauses || [];
    const ordered = [...new Set([...risk,...causes.map(item=>item.action),...good.reverse()])];
    const keys = ordered.map(id=>(risk.includes(id)?'風險決策　':causes.some(item=>item.action===id)?'傷勢相關　':'')+label(id));
    const lessons = state.endingType==='CRITICAL_FAILURE' ? risk.map(id=>spec.actions.find(action=>action.id===id)).filter(Boolean).map(action=>({
      why:sceneText(action.consequenceTemplate || action.consequence),next:action.teaching,
      sources:spec.sources.filter(source=>action.sourceIds?.includes(source.id)),
    })) : [];
    return {type:endings[state.endingType] || '情境結束', injury:injuries[state.injuryLevel] || (state.injuryWorsened===false && spec.initialState.exposure && Object.values(spec.initialState.exposure).some(x=>x>0) ? '傷勢未加重' : state.injuryLevel),
      text:sceneText(state.endingType==='CRITICAL_FAILURE' ? reply : spec.endingMessages?.[state.endingType]?.[state.injuryLevel] || reply),
      decisions:[...new Set(keys)].slice(0,3), causes:causes.map(c=>`第 ${c.turn} 個決策 · ${label(c.action)}`),lessons};
  }
  root.DrillPresentation = {status,summary,sceneText,fallbackNotice,isConnectionFallback,questionAnswer,rejectionLine,resumeState};
  if (typeof module!=='undefined') module.exports=root.DrillPresentation;
})(globalThis);
