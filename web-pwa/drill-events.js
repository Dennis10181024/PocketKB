(function (root) {
  function advance(spec, result, text, before) {
    const state = result.state;
    if (!spec.deterioration?.length || !text) return result;
    if (state.onlineExperience) {
      if (['question','observe','hint','locked','failed','blocked'].includes(result.kind) ||
          /如果|假如|假設|想像|幻想|萬一|要是/.test(text) ||
          state.events.slice(before?.events.length ?? state.events.length).some(event=>event.kind==='npc_emotion')) return result;
      const elapsed = (state.elapsed || 0) + 1;
      const definition = state.sessionStatus === 'ACTIVE' && spec.deterioration.find(item=>(item.onlineAt ?? item.at)===elapsed);
      const event = definition && {...definition,message:definition.onlineMessageByNode?.[state.node] || definition.message};
      const progressed = event ? applyEvent(state,event,elapsed) : {...state,elapsed};
      if (!progressed.npc.handled && state.sessionStatus === 'ACTIVE' && spec.npc.online.remindAt.includes(elapsed)) {
        progressed.events = [...progressed.events,{node:state.node,kind:'npc_proposal',message:spec.npc.online.reminder}];
      }
      return {...result,state:progressed};
    }
    if (!['clarify','off_topic','unclear','question','emotion'].includes(result.kind)) {
      return state.consecutiveQuestions && result.kind !== 'locked'
        ? {...result,state:{...state,consecutiveQuestions:0}} : result;
    }
    const question = result.kind === 'question';
    const hypothetical = /如果|假如|假設|想像|幻想|萬一|要是|不會|不打算/.test(text);
    if (hypothetical) return result;
    const questions = question ? (state.consecutiveQuestions || 0) + 1 : 0;
    const elapsed = (state.elapsed || 0) + (question && questions < 3 ? 0 : 1);
    const next = {...state,consecutiveQuestions:questions,elapsed};
    const event = elapsed !== (state.elapsed || 0) && spec.deterioration.find(item=>item.at===elapsed);
    if (!event) return {...result,state:next};
    return {...result,state:{...applyEvent(state,event,elapsed),consecutiveQuestions:questions},message:result.message+' '+event.message};
  }
  function applyEvent(state,event,elapsed) {
    const resources = {...state.resources};
    for (const [key,delta] of Object.entries(event.adjust || {})) resources[key] = Math.max(0,(resources[key] || 0)+delta);
    return {...state,elapsed,resources,facts:{...state.facts,...event.setFacts},
      events:[...state.events,{node:state.node,kind:'environment_change',eventId:event.id,message:event.message,labels:[event.message]}]};
  }
  function citations(spec,before,result) {
    const ids = new Set();
    const actions = [...spec.actions,...(spec.hazards || [])];
    for (const event of result.state.events.slice(before.events.length)) {
      const matching = actions.filter(action=>event.action===action.id || event.labels?.includes(action.label));
      for (const action of matching) for (const id of action.sourceIds || []) ids.add(id);
      for (const id of spec.deterioration?.find(item=>item.id===event.eventId)?.sourceIds || []) ids.add(id);
      if (event.kind==='environment_change' && !event.eventId) {
        const node=spec.nodes.find(item=>item.id===event.node);
        for (const item of node?.timedEvents || []) if(item.message===event.message) for(const id of item.sourceIds || []) ids.add(id);
      }
    }
    for (const id of result.sourceIds || []) ids.add(id);
    return spec.sources.filter(source=>ids.has(source.id));
  }
  root.DrillEvents = {advance,citations};
  if (typeof module !== 'undefined') module.exports = root.DrillEvents;
})(globalThis);
