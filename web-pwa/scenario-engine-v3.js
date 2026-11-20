/* Generic, deterministic scenario runtime. Language adapters may propose action IDs,
 * but this module alone owns state transitions and terminal outcomes. */
(function (root) {
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function create(spec) {
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
    const rescued = currentNode(spec,state).terminal?.rescueHandoff === true;
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
    const input = String(text || '').trim();
    if (!input) return result('clarify', '請描述你現在實際要採取的行動。');
    const language = typeof module === 'undefined' ? root.DrillLanguage : require('./drill-language');
    const nonAction = language.nonAction(spec, input, intent, node);
    if (nonAction) return result(nonAction.kind, nonAction.message);
    if (spec.uncertainPattern && new RegExp(spec.uncertainPattern).test(input)) return result('clarify', language.unclear(input, node.task));

    if (resolved && (!Array.isArray(resolved.actionIds) || resolved.actionIds.some(id => !spec.actions.some(a => a.id === id))))
      return result('clarify', '這項行動不在本情境可驗證的範圍，尚未執行。');
    const owned = inputClauses(spec, input).filter(clause => clause.owned).map(clause => clause.part).join('');
    if (!owned.trim()) return result('clarify', language.unclear(input, node.task));
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
      return result(dangerous ? 'risk' : 'blocked', blocked.action.blockedMessage || `${blocked.reason}，因此沒有執行。請改用目前仍可行的方法。`);
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
      injury = injuryEvent(spec,state,action.id) || injury;
      if (action.id === spec.npc?.handleAction && !state.npc.handled) {
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

    const missing = node.required.filter(id => !state.accepted.includes(id));
    if (missing.length) {
      return result('partial', `已記住：${fresh.map(action => action.label).join('、')}。本階段仍有必要行動尚未完成。`);
    }

    if (node.terminal) {
      applyPatch(state, node.terminal);
      state.sessionStatus = node.terminal.sessionStatus;
      state.completionKind = node.terminal.completionKind;
      return result('completed', finish(spec,state) || node.terminal.message);
    }

    applyPatch(state, node.onComplete);
    state.node = node.onComplete.to;
    state.accepted = [];
    state.nodeTurn = 0;
    return result('transition', node.onComplete.message);
  }

  function step(spec, before, text, intent = 'action', resolved = null) {
    const result = resolveTurn(spec,before,text,intent,resolved);
    const proposal = spec.npc?.responsePattern;
    if (intent === 'action' && before.npc && !before.npc.handled && result.kind === 'clarify' &&
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

  function applyEmotion(spec, before, category) {
    const emotion = category && spec.actions.find(action => action.emotion === category);
    if (!emotion || !before.npc?.handled || before.npc.emotion) return before;
    return {...before,npc:{...before.npc,emotion:category},events:[...before.events,
      {node:before.node,action:emotion.id,kind:'npc_emotion',message:emotion.label}]};
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
    const requiredIds = [...new Set(spec.nodes.flatMap(node => node.required || []))];
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
      if (decision.actionBatches?.length) {
        const result = decision.actionBatches.reduce((prior,batch) =>
          step(spec,prior.state,'已確認行動',decision.intent,{actionIds:batch.ids}),{state});
        return applyEmotion(spec,events().advance(spec,result,'已確認行動').state,decision.emotion?.category);
      }
      const text = decision.actionIds.length ? '已確認行動' : decision.controlInput || '';
      const resolved = decision.actionIds.length ? {actionIds:decision.actionIds} : null;
      const result = step(spec,state,text,decision.intent,resolved);
      const updated = decision.emotion ? result.state : events().advance(spec,result,text).state;
      return applyEmotion(spec,updated,decision.emotion?.category);
    }, create(spec));
  }

  root.ScenarioEngineV3 = {
    create, rawStep:step, review, validateProposal, adoptedActionIds, replayDecisions, applyEmotion,
    step:(spec,state,text,intent,resolved)=>events().advance(spec,step(spec,state,text,intent,resolved),text)
  };
  if (typeof module !== 'undefined') module.exports = root.ScenarioEngineV3;
})(globalThis);
