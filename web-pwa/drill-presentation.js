(function(root) {
  const endings = {SELF_EVACUATION:'自行撤離', SAFE_RESCUE:'安全待救獲救', DELAYED_RESCUE:'延誤後獲救', CRITICAL_FAILURE:'危急失敗', EXITED:'已退出'};
  const injuries = {NONE:'無傷', MILD:'輕傷', MODERATE:'中度傷勢（需送醫）', SEVERE:'重傷（需住院治療）', NOT_ASSESSED:'傷勢不評定', BASELINE:'傷勢未加重'};
  const sceneText = text => String(text || '').replace(/模擬119/g,'119').replace(/模擬通報/g,'通報').replace(/(?:模擬|演練)中/g,'現場').replace(/這段演練|此演練|本次演練/g,'目前情況').replace(/演練|模擬/g,'');
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
    return {type:endings[state.endingType] || '情境結束', injury:injuries[state.injuryLevel] || (state.injuryWorsened===false && spec.initialState.exposure && Object.values(spec.initialState.exposure).some(x=>x>0) ? '傷勢未加重' : state.injuryLevel),
      text:sceneText(state.endingType==='CRITICAL_FAILURE' ? reply : spec.endingMessages?.[state.endingType]?.[state.injuryLevel] || reply),
      decisions:[...new Set(keys)].slice(0,3), causes:causes.map(c=>`第 ${c.turn} 個決策 · ${label(c.action)}`)};
  }
  root.DrillPresentation = {status,summary,sceneText};
  if (typeof module!=='undefined') module.exports=root.DrillPresentation;
})(globalThis);
