/* Generic, deterministic scenario runtime. Language adapters may propose action IDs,
 * but this module alone owns state transitions and terminal outcomes. */
(function (root) {
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }
  function formalSpec(spec) {
    if (!spec.formal) return spec;
    const {formal,...baseline}=spec;
    return {...baseline,...formal,formalPractice:true};
  }

  function create(spec, {onlineExperience = false} = {}) {
    return {
      scenarioId: spec.id,
      version: spec.version,
      node: spec.initialNode,
      sessionStatus: 'ACTIVE',
      physicalStatus: spec.initialState.physicalStatus,
      completionKind: null,
      nodeTurn: 0,
      accepted: [],
      resources: clone(spec.initialState.resources || {}),
      facts: clone(spec.initialState.facts || {}),
      events: [],
      variantId: spec.variantId || 'base',
      exposure: clone(spec.initialState.exposure || {}),
      injuryCauses: [],
      endingType: null,
      injuryLevel: null,
      injuryWorsened: null,
      npc: spec.npc ? { position: spec.npc.position, proposal: spec.npc.proposal, handled: false, emotion: null } : null,
      hints: [],
      ...(onlineExperience ? {onlineExperience:true} : {}),
    };
  }

  function currentNode(spec, state) {
    const node = spec.nodes.find(item => item.id === state.node);
    if (!node) throw new Error(`Unknown scenario node: ${state.node}`);
    return node;
  }

  function inputClauses(spec, text) {
    const name = spec.npc?.name;
    const other = /^(?:室友|同學|家人|別人|有人|鄰居|乘客|他|她)/;
    return text.split(/(?<=[，。；、,;!！])|(?=但是|但我|然後|接著)/).map(part => {
      const body = part.trim().replace(/^(?:但是|但|然後|接著)/, '');
      const attributed = body.replace(/^我(?:看見|看到|聽見|聽到|聽說|說|叫|請|讓|要求|告訴|提醒|勸)/, '');
      return { part, owned: !(name && attributed.startsWith(name)) && !other.test(attributed) };
    });
  }

  function matchedActions(spec, text) {
    const normalized = text.replace(/\s/g, '');
    const clauses = normalized.split(new RegExp(spec.splitPattern));
    return spec.actions.filter(action => action.wholeInput ? false : normalized === action.label.replace(/\s/g, '') || clauses.some(clause => {
      return [...clause.matchAll(new RegExp(action.pattern, 'g'))].some(match =>
        !new RegExp(spec.negationPattern).test(clause.slice(0, match.index)));
    }));
  }

  function contradictsAction(spec, text, actions) {
    const clauses = text.replace(/\s/g, '').split(new RegExp(spec.splitPattern));
    const negative = new RegExp(spec.negationPattern);
    return actions.some(action => clauses.some(clause =>
      [...clause.matchAll(new RegExp(action.pattern, 'g'))].some(match => negative.test(clause.slice(0, match.index)))));
  }

  function applyPatch(state, effect) {
    if (!effect) return;
    if (effect.physicalStatus) state.physicalStatus = effect.physicalStatus;
    for (const [key, value] of Object.entries(effect.setFacts || {})) state.facts[key] = value;
    for (const [key, value] of Object.entries(effect.adjust || {})) {
      state.resources[key] = Math.max(0, (state.resources[key] || 0) + value);
    }
  }

  function injuryEvent(spec, state, action) {
    const event = (spec.injuryEvents || []).find(e => e.action === action &&
      (!e.node || e.node === state.node) &&
      !state.injuryCauses.some(cause => cause.eventId === e.id) &&
      (!e.after || state.injuryCauses.some(cause => cause.eventId === e.after)) &&
      (!e.unless || !state.injuryCauses.some(cause => cause.eventId === e.unless)) &&
      Object.entries(e.facts || {}).every(([k,v]) => state.facts[k] === v));
    if (!event) return null;
    state.exposure[event.exposure] = Math.max(0, (state.exposure[event.exposure] || 0) + event.delta);
    state.injuryCauses.push({ node: state.node, action, eventId: event.id, exposure: event.exposure,
      delta: event.delta, turn: state.nodeTurn + 1 });
    state.events.push({ node: state.node, action, eventId: event.id, kind: 'hazard', message: event.message });
    if (event.delayed) state.facts.delayed = true;
    return event;
  }

  function finish(spec, state, failed = false) {
    const terminal = currentNode(spec,state).terminal;
    const rescued = terminal?.rescueHandoff === true || terminal?.unhandledHandoff === true && (!state.npc?.handled || state.facts.npcSkipped);
    if (terminal?.unhandledHandoff && rescued) state.facts.delayed = true;
    if (!failed && state.physicalStatus === 'WAITING_RESCUE' && !rescued) return null;
    state.endingType = failed ? 'CRITICAL_FAILURE' : rescued
      ? (state.facts.delayed ? 'DELAYED_RESCUE' : 'SAFE_RESCUE') : 'SELF_EVACUATION';
    if (!failed && rescued) {
      state.events.push({ node: state.node, kind: 'rescue_contact', eventId: 'rescue-handoff' });
      // Retain the published physical-status contract. The explicit handoff resolves the new ending axis.
    }
    const score = Math.max(0, ...Object.values(state.exposure));
    const thresholds = spec.injuryThresholds || {};
    state.injuryLevel = failed ? 'NOT_ASSESSED' : score >= (thresholds.severe ?? 5) ? 'SEVERE'
      : score >= (thresholds.moderate ?? 3) ? 'MODERATE' : score >= (thresholds.mild ?? 1) ? 'MILD' : 'NONE';
    state.injuryWorsened = failed ? null : Object.entries(state.exposure)
      .some(([key,value]) => value > (spec.initialState.exposure?.[key] || 0));
    return spec.endingMessages?.[state.endingType]?.[state.injuryLevel] || null;
  }

  function unmetRequirement(state, action) {
    if (action.blockedAfterInjury && state.injuryCauses.some(item => item.eventId === action.blockedAfterInjury)) return "動作已被安全攔截";
    for (const [key, rule] of Object.entries(action.requires?.resources || {})) {
      const value = state.resources[key] || 0;
      if (rule.min !== undefined && value < rule.min) return `${action.label}需要至少 ${rule.min} 的${key}資源，目前只剩 ${value}`;
    }
    for (const [key, expected] of Object.entries(action.requires?.facts || {})) {
      if (state.facts[key] !== expected) return `${action.label}的現場條件目前不成立`;
    }
    return null;
  }

  function applyTimedEvent(state, node, actionIds) {
    const timed = (node.timedEvents || []).find(event =>
      state.nodeTurn >= event.atTurn &&
      (!event.triggerActions || event.triggerActions.some(id => actionIds.includes(id))) &&
      !(event.unlessAccepted || []).some(id => state.accepted.includes(id))
    );
    if (!timed) return null;
    applyPatch(state, timed);
    state.events.push({ node: node.id, kind: 'environment_change', message: timed.message });
    if (timed.to) {
      state.node = timed.to;
      state.accepted = [];
      state.nodeTurn = 0;
    }
    return timed;
  }

  function resolveTurn(spec, before, text, intent = 'action', resolved = null) {
    const state = clone(before);
    const node = currentNode(spec, state);
    const result = (kind, message) => ({ state, kind, message });

    if (state.sessionStatus !== 'ACTIVE') return result('locked', '本次演練已結束，請另開新紀錄再練習。');
    if (intent === 'observe') return result('observe', node.observation || node.situation);
    if (intent === 'hint' && node.hints?.length) {
      const used = state.hints.filter(hint => hint.node === node.id).length;
      if (used < node.hints.length) state.hints.push({ node: node.id, level: used + 1 });
      return result('hint', node.hints[Math.min(used, node.hints.length - 1)]);
    }
    const rawInput = String(text || '').trim();
    const phrasing = node.phrasing?.find(item=>new RegExp(item.pattern).test(rawInput));
    const input = phrasing?.as || rawInput;
    if (!input) return result('clarify', '請描述你現在實際要採取的行動。');
    const language = typeof module === 'undefined' ? root.DrillLanguage : require('./drill-language');
    const nonAction = resolved?.verifiedSafe ? null : language.nonAction(spec, input, intent, node);
    if (nonAction) return result(nonAction.kind, nonAction.message);
    if (!resolved?.verifiedSafe && spec.uncertainPattern && new RegExp(spec.uncertainPattern).test(input)) return result('clarify', language.unclear(input, node.task));

    if (resolved && (!Array.isArray(resolved.actionIds) || resolved.actionIds.some(id => !spec.actions.some(a => a.id === id))))
      return result('clarify', '這項行動不在本情境可驗證的範圍，尚未執行。');
    const owned = inputClauses(spec, input).filter(clause => clause.owned).map(clause => clause.part).join('');
    if (!owned.trim() && !resolved?.verifiedSafe) return result('clarify', language.unclear(input, node.task));
    const literal = matchedActions(spec, owned);
    const actions = resolved ? spec.actions.filter(a => resolved.actionIds.includes(a.id)) : literal;
    if (resolved && actions.some(action => !node.available.includes(action.id)))
      return result('clarify', '你提到的行動目前還不能在此階段確認；請先確認現場條件。');
    const available = actions.filter(action => node.available.includes(action.id));
    if (!available.length) return result('clarify', language.unclear(input, node.task));
    const conflict = (spec.conflicts || []).find(group => group.every(id => actions.some(a => a.id === id)));
    if (conflict || contradictsAction(spec, owned, actions) || contradictsAction(spec, owned, spec.actions.filter(a => state.accepted.includes(a.id)))) return result('clarify', '這次回答包含否定或互相衝突的決定。請確認你最後真正要採取的行動。');

    if (!spec.fireCompatibility && /(?:曾經|以前|上次|我開過|我有做過)/.test(input) &&
      !/(?:現在|這次)我/.test(input) && available.some(action => node.hazards?.[action.id])) {
      const historical = available.find(action => node.hazards?.[action.id]);
      return {...result('clarify', '尚未執行。若現在採取這個做法，風險如下：' + (historical.consequenceTemplate || node.hazards[historical.id].message)),
        sourceIds: historical.sourceIds};
    }
    const immediate = available.find(action => node.hazards?.[action.id]?.terminal);
    if (immediate) {
      const hazard = node.hazards[immediate.id];
      applyPatch(state, hazard);
      state.events.push({ node: node.id, action: immediate.id, kind: 'hazard', message: hazard.message });
      state.sessionStatus = hazard.sessionStatus || 'FAILED';
      state.completionKind = hazard.completionKind || 'CRITICAL_FAILURE';
      finish(spec,state,true);
      return result('failed', immediate.consequenceTemplate || hazard.message);
    }
    const blocked = available.map(action => ({ action, reason: unmetRequirement(state, action) })).find(item => item.reason);
    if (blocked) {
      const dangerous = blocked.action.unsafeWhenBlocked;
      state.events.push({ node: node.id, action: blocked.action.id, kind: dangerous ? 'hazard' : 'blocked' });
      const fact = Object.entries(blocked.action.requires?.facts || {}).find(([key,value])=>state.facts[key]!==value)?.[0];
      return result(dangerous ? 'risk' : 'blocked', blocked.action.blockedByFact?.[fact] || blocked.action.blockedMessage || `${blocked.reason}，因此沒有執行。請改用目前仍可行的方法。`);
    }

    for (const action of available) {
      const hazard = node.hazards?.[action.id];
      if (hazard) {
        applyPatch(state, hazard);
        state.events.push({ node: node.id, action: action.id, kind: 'hazard', message:hazard.message });
        return result('risk', hazard.message + (action.teaching ? ' '+action.teaching : ''));
      }
    }

    const fresh = available.filter(action => (!action.emotion || state.npc?.handled) && (action.repeatable || !state.accepted.includes(action.id)));
    if (!fresh.length) return result('clarify', '這項行動已經完成，請根據目前情境決定下一步。');
    let injury = null;
    for (const action of fresh) {
      if (!state.accepted.includes(action.id)) state.accepted.push(action.id);
      state.events.push({ node: node.id, action: action.id, kind: 'action' });
      applyPatch(state, node.effects?.[action.id]);
      if (spec.earlyGoals?.includes(action.id)) state.facts['goal_'+action.id] = true;
      injury = injuryEvent(spec,state,action.id) || injury;
      if (!state.onlineExperience && action.id === spec.npc?.handleAction && !state.npc.handled) {
        state.npc.handled = true;
        state.npc.proposal = null;
        state.events.push({ node: node.id, action: action.id, kind: 'npc_handled' });
      }
    }
    state.nodeTurn += 1;
    if (injury) {
      if (injury.to) {
        state.node = injury.to;
        state.accepted = [];
        state.nodeTurn = 0;
      }
      return result('risk', injury.message);
    }
    const timed = applyTimedEvent(state, node, fresh.map(action => action.id));
    if (timed) return result('environment_change', timed.message);
    const riskEffect = fresh.map(action => node.effects?.[action.id]).find(effect => effect?.kind === 'risk');
    if (riskEffect) {
      const action = fresh.find(item=>node.effects?.[item.id]===riskEffect);
      return result('risk', riskEffect.message + (action?.teaching ? ' '+action.teaching : ''));
    }

    if (node.onNpcEmotion) return result('partial', fresh.at(-1).effect);
    const missing = missingGoals(node,state);
    if (missing.length) {
      return result('partial', `已記住：${fresh.map(action => action.label).join('、')}。本階段仍有必要行動尚未完成。`);
    }

    if (node.aftercareComplete) {
      state.sessionStatus = 'COMPLETED';
      return result('completed', fresh.at(-1).effect);
    }

    if (node.terminal) {
      const ignored = state.onlineExperience && (!state.npc?.handled || state.facts.npcSkipped) && spec.npc?.online?.unhandledRescue;
      if (ignored && node.terminal.rescueHandoff) {
        state.facts.delayed = true;
        state.events.push({node:state.node,kind:'npc_proposal',eventId:'npc-unhandled-rescue',message:ignored.reminder});
      }
      applyPatch(state, node.terminal);
      state.sessionStatus = node.terminal.sessionStatus;
      state.completionKind = node.terminal.completionKind;
      const ending = finish(spec,state) || node.terminal.message;
      if (state.onlineExperience && state.injuryLevel===spec.aftercare?.injuryLevel) {
        state.sessionStatus = 'ACTIVE';
        state.node = spec.aftercare.node;
        state.accepted = [];
        state.nodeTurn = 0;
        return result('transition', ending);
      }
      return result('completed', ending);
    }

    applyPatch(state, node.onComplete);
    state.node = node.onComplete.to;
    state.accepted = [];
    state.nodeTurn = 0;
    return result('transition', node.onComplete.message);
  }

  function missingGoals(node,state) {
    return node.required.filter(id => ![id,...(node.alternatives?.[id] || [])]
      .some(choice=>state.accepted.includes(choice) || state.facts['goal_'+choice]===true));
  }

  function dangerous(spec,node,action) {
    return Boolean(node.hazards?.[action.id] || action.hazardMode || action.unsafeWhenBlocked ||
      node.effects?.[action.id]?.kind==='risk' || spec.injuryEvents?.some(event=>event.action===action.id));
  }

  const nonCommitment = /[?？]|(?:如果|假如|假設|想像|幻想|萬一|要是|只是想想|以前|上次|差點|本來想)|(?:可以|能不能|可不可以|要不要|會不會).*(?:嗎|呢)|(?:怎麼辦|會怎樣|嗎|呢)[。！!]?$/;
  const ownNegation = /(?:不會|不打算|沒有要|沒打算|不是要|並未|不想|不要|不去|不做|拒絕|別|勿|不)(?:再|先|去|要|會)?$/;
  const attributed = /^(?:我)?(?:看見|看到|聽見|聽到|聽說|聽人說)|^(?:室友|同學|有人|他|她).{0,6}(?:說|想|要)/;
  const formalClauses = text=>text.split(/(?:然後|接著|並(?!非|未|無)|[，,；;。！!]|(?=\s+(?:等待|保持)))/)
    .map(clause=>clause.trim()).filter(Boolean);
  function negatesAction(spec,text,action) {
    const compact=text.replace(/\s/g,'');
    return inputClauses(spec,compact).some(({part,owned})=>owned && !recognizesNpcResponse(spec,part) &&
      [...part.matchAll(new RegExp(action.pattern,'g'))].some(match=>ownNegation.test(part.slice(0,match.index))));
  }

  function formalStep(spec,before,text,intent='action',proposals=null) {
    const base=step(spec,before,text,intent);
    if (intent!=='action' || !text || before.sessionStatus!=='ACTIVE' || nonCommitment.test(text) ||
        ['risk','failed'].includes(base.kind) || /互相衝突/.test(base.message)) return base;
    const semantic=proposals!==null;
    const permitted=(id, fragment)=>!semantic || proposals.some(item=> {
      if (item.id!==id) return false;
      // Evidence may span punctuation. Run the action at the first clause of the quoted span.
      return fragment.includes(item.evidence) || fragment.includes(formalClauses(item.evidence)[0] || item.evidence);
    });
    const clauses=formalClauses(text);
    // An independent literal hazard stays authoritative before any safe proposal is considered.
    for (const clause of clauses) {
      if (recognizesNpcResponse(spec,clause)) continue;
      const direct=resolveTurn(spec,before,clause,intent);
      if (['risk','failed'].includes(direct.kind)) {
        const hazard=spec.actions.find(action=>direct.state.events.slice(before.events.length).some(event=>event.action===action.id));
        if (!hazard || !negatesAction(spec,text,hazard)) return direct;
      }
    }
    let state=before, last=null;
    const outcomes=[];
    const addOutcome=(line)=>{if(line && !outcomes.includes(line))outcomes.push(line);};
    const speakerScope = clauses[0] && /^(?:我)?跟[他她]說$/.test(clauses[0]) ? clauses.slice(0,2).join('') : text;
    const npcAccepted=recognizesNpcResponse(spec,speakerScope) || clauses.some(clause=>recognizesNpcResponse(spec,clause));
    if ((!semantic && npcAccepted) || semantic && permitted('npc_dissuade',text)) {
      const npcResult=settleOnline(spec,state,{state,kind:'safe',message:''},speakerScope,intent,true);
      state=npcResult.state;last=npcResult;
      if (before.npc.handled) {
        state={...state,events:[...state.events,{node:state.node,kind:'npc_acknowledged'}]};
        addOutcome(spec.npc.online.alreadyHandled || '同伴記得我剛才的提醒。');
      } else addOutcome(spec.npc.online.acknowledge || '我聽見同伴答應照剛才說的做。');
    }
    const reportNode=currentNode(spec,state);
    if (reportNode.reportSlots && !attributed.test(text) && !/不(?:會|要|打算)?(?:打|撥|通報|回報|告知|說)|沒有要/.test(text)) {
      let ids=reportNode.reportSlots.filter(slot=>semantic ? permitted(slot.id,text) :
        new RegExp(slot.pattern).test(text.replace(/\s/g,''))).map(slot=>slot.id);
      if (reportNode.reportSlots.some(slot=>slot.id==='call') && !state.accepted.includes('call') && !ids.includes('call')) ids=[];
      if (ids.length) {
        const confirmed=reportNode.reportSlots.filter(slot=>ids.includes(slot.id) && state.accepted.includes(slot.id));
        for (const slot of confirmed) addOutcome(slot.already || slot.confirm);
        if (confirmed.length) last ||= {state,kind:'safe',message:confirmed[0].already || confirmed[0].confirm};
        const result=resolveTurn(spec,state,'回報已確認的資料',intent,{actionIds:ids,verifiedSafe:true});
        if (!['clarify','question'].includes(result.kind)) {
          for (const slot of reportNode.reportSlots.filter(slot=>ids.includes(slot.id)&&!state.accepted.includes(slot.id))) addOutcome(slot.confirm);
          state=result.state;last=result;
        }
      }
    }
    for (const clause of clauses) {
      if (state.sessionStatus!=='ACTIVE' || recognizesNpcResponse(spec,clause) || attributed.test(clause)) continue;
      const scene=currentNode(spec,state);
      if (spec.id==='drill_fire_dorm' && /教室.*(?:窗|門)|(?:窗|門).*教室/.test(clause)) {
        addOutcome('我眼前的是宿舍503室；我沒有到教室開窗或處理教室的門。');
        continue;
      }
      if (spec.id==='drill_fire_dorm' && /降低呼吸|減少呼吸|憋氣/.test(clause)) {
        addOutcome('我沒有刻意憋氣或放慢呼吸來省氧。');
        continue;
      }
      if (spec.id==='drill_fire_dorm' && /跟(?:裡面|房內|房裡)的人說/.test(clause)) {
        addOutcome('我的話是對房內的人說的；電話那頭還沒聽到這段話。');
      }
      if (state.node!==before.node) {
        const atNewPoint=resolveTurn(spec,state,clause,intent);
        if (['risk','failed'].includes(atNewPoint.kind)) {
          addOutcome(atNewPoint.message);
          return {...atNewPoint,outcomes};
        }
      }
      const literal=matchedActions(spec,clause);
      for (const action of spec.actions.filter(item=>state.facts['goal_'+item.id] && item.already &&
        !negatesAction(spec,text,item) && (semantic ? permitted(item.id,clause) : literal.includes(item)))) {
        addOutcome(action.already);
        last ||= {state,kind:'safe',message:action.already};
      }
      const matches=spec.actions.filter(action=>scene.available.includes(action.id) && !action.emotion && !dangerous(spec,scene,action) &&
        !negatesAction(spec,text,action) && !contradictsAction(spec,clause,[action]) &&
        (semantic ? permitted(action.id,clause) : literal.includes(action)));
      if (semantic) matches.sort((left,right)=>proposals.findIndex(item=>item.id===left.id)-proposals.findIndex(item=>item.id===right.id));
      if (!matches.length) continue;
      for (const action of matches) {
        const here=currentNode(spec,state);
        if (!here.available.includes(action.id)) continue;
        if (action.id!=='call' && here.reportSlots?.some(slot=>slot.id==='call') &&
            here.reportSlots.some(slot=>slot.id===action.id) && !state.accepted.includes('call')) continue;
        if (state.accepted.includes(action.id) || state.facts['goal_'+action.id]) continue;
        const result=resolveTurn(spec,state,clause,intent,{actionIds:[action.id],verifiedSafe:true});
        if (['clarify','question','locked'].includes(result.kind)) continue;
        if (result.kind==='blocked') addOutcome(result.message);
        else if (result.state.events.slice(state.events.length).some(event=>event.kind==='action'&&event.action===action.id))
          addOutcome(action.confirm || action.effect);
        state=result.state;last=result;
      }
    }
    const pending=currentNode(spec,state);
    const slot=pending.reportSlots?.find(field=>missingGoals(pending,state).includes(field.id));
    if (slot) {
      addOutcome(pending.reportSpeaker && (!pending.reportSlots.some(field=>field.id==='call') || state.accepted.includes('call'))
        ? `${pending.reportSpeaker}問：「${slot.ask}」` : slot.ask);
    }
    if (!last) {
      const mustConnect=reportNode.reportSlots?.some(field=>field.id==='call') && !before.accepted.includes('call');
      const unexecuted=semantic || mustConnect ? {state:before,kind:'clarify',message:''} : base;
      return outcomes.length ? {...unexecuted,outcomes} : unexecuted;
    }
    return {...last,state,outcomes,kind:state.sessionStatus!=='ACTIVE'?last.kind:state.node!==before.node?'transition':last.kind};
  }

  function validateSafeEvidence(spec,before,text,proposal) {
    const evidence=proposal?.evidence;
    if (typeof evidence!=='string' || evidence.trim().length<2 || !text.includes(evidence)) return 'MODEL_EVIDENCE';
    if (nonCommitment.test(text)) return 'MODEL_PROTECTED_LANGUAGE';
    if (proposal.id==='npc_dissuade') {
      const reminder=/不行|不能|不要|別|不可|不准|不許|攔住|勸阻|制止|阻止|拉住/.test(evidence);
      const dialogue=/^(?:我)?(?:跟|對|請|勸|攔住|阻止|告訴|提醒)|她說|他說/.test(evidence) ||
        evidence.includes(spec.npc.name) || /^(?:堅決|絕對)(?:不能|不行|不要)/.test(evidence);
      return reminder && dialogue && !/不要(?:去)?(?:阻止|勸)|沒有要(?:阻止|勸)|(?:不能|不行|不要)不|^(?:他|她|有人|室友|同學)(?:說|想|要)/.test(evidence)
        ? null : 'MODEL_NPC_SUBJECT';
    }
    const action=spec.actions.find(item=>item.id===proposal.id);
    if (!action || action.emotion || dangerous(spec,currentNode(spec,before),action)) return 'MODEL_UNKNOWN_ACTION';
    const first=formalClauses(evidence)[0] || evidence;
    const fragment=formalClauses(text).find(part=>part.includes(first)) || evidence;
    const span=inputClauses(spec,fragment)[0];
    if (!span?.owned || attributed.test(span.part.trim()) || /^(?:不會|不想|不要|拒絕|不打算|不能|不行|不|別|勿|沒有要)/.test(evidence))
      return 'MODEL_PROTECTED_LANGUAGE';
    const lead=fragment.slice(0,fragment.indexOf(first)).trim();
    if (ownNegation.test(lead) || negatesAction(spec,text,action)) return 'MODEL_PROTECTED_LANGUAGE';
    if (spec.id==='drill_fire_dorm' && /教室/.test(span.part) && /窗|門/.test(evidence)) return 'MODEL_OUT_OF_SCENE';
    return null;
  }

  function step(spec, before, text, intent = 'action', resolved = null) {
    const result = resolveTurn(spec,before,text,intent,resolved);
    const proposal = spec.npc?.responsePattern;
    if (!before.onlineExperience && intent === 'action' && before.npc && !before.npc.handled && result.kind === 'clarify' &&
        proposal && new RegExp(proposal).test(text.trim())) {
      result.state.npc.handled = true;
      result.state.npc.proposal = null;
      result.state.events.push({node:before.node,kind:'npc_handled'});
      return {...result,kind:'safe',message:'我聽見同伴答應先停下。'};
    }
    if (intent !== 'action' || !before.npc?.handled || before.npc.emotion ||
      !['clarify','question','partial'].includes(result.kind)) return result;
    const compact = text.replace(/[\s，。；、,;!！]/g,'');
    const emotion = spec.actions.find(action => action.emotion && new RegExp(action.pattern).test(compact));
    if (!emotion) return result;
    return {...result, state:applyEmotion(spec,result.state,emotion.emotion), message:emotion.label};
  }

  function settleOnline(spec, before, result, text, intent, confirmedNpc = false, allowLiteralNpc = true) {
    const state = result.state;
    if (intent !== 'action' || ['observe','hint','locked','failed'].includes(result.kind) || !text) return result;
    if (!state.npc?.handled && state.sessionStatus === 'ACTIVE' && result.kind !== 'risk' &&
        (confirmedNpc || allowLiteralNpc && recognizesNpcResponse(spec,text))) {
      const npc = {...state.npc,handled:true,proposal:null};
      const handled = {node:state.node,kind:'npc_handled',message:spec.npc.emotionResponses.handled};
      const emotion = {node:state.node,kind:'npc_emotion_prompt',message:spec.npc.online.emotion};
      return advanceConversation(spec,{...result,kind:['clarify','question'].includes(result.kind) ? 'safe' : result.kind,state:{...state,npc,events:[...state.events,handled,emotion]}});
    }
    return advanceConversation(spec,result);
  }

  function advanceConversation(spec,result) {
    if (!spec.formalPractice || result.state.sessionStatus!=='ACTIVE' || ['risk','blocked','question'].includes(result.kind)) return result;
    const state=clone(result.state);
    let message=null;
    for (let i=0;i<spec.nodes.length;i++) {
      const node=currentNode(spec,state);
      const next=(state.npc.handled && node.onNpcHandled) || (state.npc.emotion && node.onNpcEmotion) ||
        (node.earlyCompletion && !missingGoals(node,state).length && node.onComplete);
      if (!next) break;
      applyPatch(state,next);
      state.node=next.to;state.accepted=[];state.nodeTurn=0;
      state.events.push({node:node.id,kind:'milestone',to:next.to});
      message=next.message;
    }
    return message ? {...result,state,kind:'transition',message} : result;
  }

  function applyEmotion(spec, before, category) {
    const emotion = category && spec.actions.find(action => action.emotion === category);
    if (!emotion || !before.npc?.handled || before.npc.emotion) return before;
    return {...before,npc:{...before.npc,emotion:category},events:[...before.events,
      {node:before.node,action:emotion.id,kind:'npc_emotion',message:emotion.label}]};
  }

  function recognizesNpcResponse(spec,text) {
    if (/如果|假設|假如|萬一|互相衝突|[?？]|可不可以|要不要|不要阻止|不要勸/.test(text)) return false;
    const direct = text.replace(/^(?:我)?(?:跟|對|請|勸|攔住|阻止|告訴|提醒)?/,'');
    if (spec.formalPractice && spec.npc?.online?.indirectResponse &&
        new RegExp(spec.npc.online.indirectResponse).test(text.trim())) return true;
    if (!direct.startsWith(spec.npc.name)) return false;
    const addressed = direct.slice(spec.npc.name.length).replace(/^[\s，、,:：！!]*(?:你[\s，、,:：]*)?/,'');
    const veto = addressed.match(/^(?:拜託[\s，、,:：]*)?(?:先\s*)?(?:不要|別|不行|不可以|不能)[\s，、,:：]*/);
    const target = spec.npc.online.dissuasionTarget;
    return Boolean(veto && target && new RegExp('^(?:'+target+')').test(addressed.slice(veto[0].length))) ||
      new RegExp(spec.npc.online.response).test(text);
  }

  function review(spec, state) {
    const label = ['SAFE_RESCUE','DELAYED_RESCUE'].includes(state.endingType) ? '已由救援人員接手' : {
      EVACUATED: '已撤離至相對安全地點',
      RESCUED: '劇本明示已由救援人員接觸',
      WAITING_RESCUE: '已穩定待救，但尚未脫離災區',
      CRITICAL: '危急失敗',
    }[state.physicalStatus] || state.physicalStatus;
    const actionById = Object.fromEntries(spec.actions.map(action => [action.id, action.label]));
    const completedIds = [...new Set(state.events.filter(event => event.kind === 'action').map(event => event.action))];
    const hazardIds = [...new Set(state.events.filter(event => event.kind === 'hazard').map(event => event.action))];
    const requiredIds = [...new Set(spec.nodes
      .filter(node => (!node.aftercareComplete || state.node === node.id) && !node.onNpcHandled)
      .flatMap(node => (node.required || []).filter(id=>!(node.alternatives?.[id] || []).some(choice=>completedIds.includes(choice)))))];
    const missingIds = requiredIds.filter(id => !completedIds.includes(id));
    const list = values => values.length ? values.map(value => `- ${value}`).join('\n') : '- 無';
    return [
      `劇本 v${state.version} · 變體 ${state.variantId}`,
      `結果：${label}`,
      ...(state.endingType ? [`結局：${state.endingType} · 傷勢：${state.injuryLevel}`] : []),
      ...(state.endingType === 'CRITICAL_FAILURE' ? ['這個行動在真實情況下可能造成嚴重傷害，所以演練停止。'] : []),
      ...(state.injuryCauses?.length ? [`暴露成因：
${list(state.injuryCauses.map(c => `${c.node}／${actionById[c.action]} · ${c.exposure} +${c.delta}`))}`] : []),
      ...(state.npc?.emotion ? [`同伴回應：${state.npc.emotion}`] : []),
      `學習目標：\n${list(spec.learningObjectives || [])}`,
      `做對的決策：\n${list(completedIds.map(id => actionById[id] || id))}`,
      `危險決策：\n${list(hazardIds.map(id => actionById[id] || id))}`,
      `需要補強：\n${list(missingIds.map(id => actionById[id] || id))}`,
      `剩餘資源：手機 ${state.resources.battery ?? 0}%、飲水 ${state.resources.water ?? 0}、體力 ${state.resources.energy ?? 0}%`,
      `常見錯誤觀念：\n${list(spec.commonMisconceptions || [])}`,
      `反思問題：\n${list(spec.reflectionQuestions || [spec.reflection])}`,
    ].join('\n');
  }

  const events = () => typeof module === 'undefined' ? root.DrillEvents : require('./drill-events');
  function validateProposal(spec, state, text, intent, proposals, literal) {
    const node = currentNode(spec, state);
    const language = typeof module === 'undefined' ? root.DrillLanguage : require('./drill-language');
    if (language.nonAction(spec, text, intent, node) ||
        (spec.uncertainPattern && new RegExp(spec.uncertainPattern).test(text)) ||
        /(?:曾經|以前|上次|差點|本來想|我開過|我有做過)/.test(text) ||
        (literal.kind === 'clarify' && /包含否定|互相衝突|尚未執行/.test(literal.message))) {
      return { error: 'MODEL_PROTECTED_LANGUAGE' };
    }
    const clauses = inputClauses(spec, text);
    const negative = /不|別|勿|拒絕|避免|(?<![淹沉])沒/;
    // A paraphrase cannot safely resolve a negated or contradictory clause by dropping its prefix.
    if (clauses.some(({part}) => negative.test(part)) && !matchedActions(spec, text).length)
      return { error: 'MODEL_PROTECTED_LANGUAGE' };
    for (const proposal of proposals) {
      if (!proposal || typeof proposal.evidence !== 'string' || !proposal.evidence.trim() ||
          !text.includes(proposal.evidence)) return {error:'MODEL_EVIDENCE'};
      const action = spec.actions.find(item => item.id === proposal.id && !item.emotion);
      if (!action || !node.available.includes(action.id)) return {error:'MODEL_ACTION_UNAVAILABLE'};
      const locations = [];
      for (let offset = text.indexOf(proposal.evidence); offset !== -1;
        offset = text.indexOf(proposal.evidence, offset + proposal.evidence.length)) {
        let position = 0;
        for (const clause of clauses) {
          const end = position + clause.part.length;
          if (position < offset + proposal.evidence.length && end > offset)
            locations.push({ ...clause, prefix: clause.part.slice(0, Math.max(0, offset - position)) });
          position = end;
        }
      }
      if (!locations.length || locations.some(clause => !clause.owned ||
          negative.test(clause.prefix) || negative.test(proposal.evidence) ||
          /(?:我看見|我看到|我聽到|我聽說|(?:提醒|叫|告訴|勸)(?:室友|同學|家人|他|她))/.test(clause.part))) {
        return {error:'MODEL_UNSAFE_EVIDENCE'};
      }
      if (unmetRequirement(state, action)) return {error:'MODEL_GUARD_FAILED'};
    }
    const actionIds = [...new Set(proposals.map(item => item.id))];
    const result = step(spec,state,text,intent,{actionIds});
    if (['clarify','question','blocked','locked'].includes(result.kind)) return {error:'MODEL_ACTION_REJECTED'};
    return {result};
  }

  function adoptedActionIds(before, after) {
    return [...new Set(after.events.slice(before.events.length)
      .filter(event => ['action','hazard','blocked'].includes(event.kind) && event.action)
      .map(event => event.action))];
  }

  function replayDecisions(spec, decisions) {
    return decisions.reduce((state, decision) => {
      if (decision.noAdvance) return state;
      const input = decision.controlInput || decision.npcInput || '';
      const npcWasHandled = decision.actionValidation?.some(item=>item.id==='npc_dissuade' && item.result==='ACCEPTED');
      const initial = npcWasHandled && !state.npc?.handled ?
        settleOnline(spec,state,{state,kind:'safe',message:''},'已確認勸阻','action',true).state : state;
      const settle = (result,text) => {
        if (!state.onlineExperience) return events().advance(spec,result,text).state;
        const resolved = settleOnline(spec,state,result,input,decision.intent);
        if (decision.emotion) return advanceConversation(spec,{...resolved,state:applyEmotion(spec,resolved.state,decision.emotion.category)}).state;
        return events().advance(spec,resolved,text,state).state;
      };
      if (decision.actionBatches?.length) {
        const result = decision.actionBatches.reduce((prior,batch) =>
          step(spec,prior.state,'已確認行動',decision.intent,{actionIds:batch.ids}),{state:initial});
        return state.onlineExperience ? settle(result,'已確認行動') : applyEmotion(spec,events().advance(spec,result,'已確認行動').state,decision.emotion?.category);
      }
      const text = decision.actionIds.length ? '已確認行動' : decision.controlInput || '';
      const resolved = decision.actionIds.length ? {actionIds:decision.actionIds} : null;
      const result = npcWasHandled && !decision.actionIds.length ? {state:initial,kind:'safe',message:''} : step(spec,initial,text,decision.intent,resolved);
      if (state.onlineExperience) return settle(result,text);
      const updated = decision.emotion ? result.state : events().advance(spec,result,text).state;
      return applyEmotion(spec,updated,decision.emotion?.category);
    }, create(spec,{onlineExperience:decisions.some(decision=>decision.onlineExperience)}));
  }

  root.ScenarioEngineV3 = {
    formalSpec, create, rawStep:(spec,state,text,intent,resolved)=>spec.formalPractice && !resolved ? formalStep(spec,state,text,intent) : step(spec,state,text,intent,resolved),
    formalStep, validateSafeEvidence, review, validateProposal, adoptedActionIds, replayDecisions, applyEmotion, settleOnline, recognizesNpcResponse,
    step:(spec,state,text,intent,resolved)=> {
      const result = spec.formalPractice && !resolved ? formalStep(spec,state,text,intent) : step(spec,state,text,intent,resolved);
      return events().advance(spec,state.onlineExperience ? settleOnline(spec,state,result,text,intent || 'action') : result,text,state);
    }
  };
  if (typeof module !== 'undefined') module.exports = root.ScenarioEngineV3;
})(globalThis);
