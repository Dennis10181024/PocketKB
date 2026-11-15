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
    };
  }

  function currentNode(spec, state) {
    const node = spec.nodes.find(item => item.id === state.node);
    if (!node) throw new Error(`Unknown scenario node: ${state.node}`);
    return node;
  }

  function matchedActions(spec, text) {
    const normalized = text.replace(/\s/g, '');
    const clauses = normalized.split(new RegExp(spec.splitPattern));
    return spec.actions.filter(action => normalized === action.label.replace(/\s/g, '') || clauses.some(clause => {
      const match = new RegExp(action.pattern).exec(clause);
      if (!match) return false;
      const prefix = clause.slice(0, match.index);
      return !new RegExp(spec.negationPattern).test(prefix);
    }));
  }

  function applyPatch(state, effect) {
    if (!effect) return;
    if (effect.physicalStatus) state.physicalStatus = effect.physicalStatus;
    for (const [key, value] of Object.entries(effect.setFacts || {})) state.facts[key] = value;
    for (const [key, value] of Object.entries(effect.adjust || {})) {
      state.resources[key] = Math.max(0, (state.resources[key] || 0) + value);
    }
  }

  function unmetRequirement(state, action) {
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

  function step(spec, before, text, intent = 'action', resolved = null) {
    const state = clone(before);
    const node = currentNode(spec, state);
    const result = (kind, message) => ({ state, kind, message });

    if (state.sessionStatus !== 'ACTIVE') return result('locked', '本次演練已結束，請另開新紀錄再練習。');
    if (intent === 'observe') return result('observe', node.situation);
    const input = String(text || '').trim();
    if (!input) return result('clarify', '請描述你現在實際要採取的行動。');
    if (intent === 'question' || (!resolved && new RegExp(spec.questionPattern).test(input))) {
      return result('question', '這句被視為詢問，尚未執行任何行動。');
    }

    if (resolved && (!Array.isArray(resolved.actionIds) || resolved.actionIds.some(id => !spec.actions.some(a => a.id === id))))
      return result('clarify', '這項行動不在本情境可驗證的範圍，尚未執行。');
    const actions = resolved ? spec.actions.filter(a => resolved.actionIds.includes(a.id)) : matchedActions(spec, input);
    if (resolved && actions.some(action => !node.available.includes(action.id)))
      return result('clarify', '你提到的行動目前還不能在此階段確認；請先確認現場條件。');
    const available = actions.filter(action => node.available.includes(action.id));
    if (!available.length) return result('clarify', '目前無法確認這項行動，情境狀態沒有改變。請重新描述或先觀察環境。');
    const actionIds = available.map(action => action.id);
    const conflict = (spec.conflicts || []).find(group => group.every(id => actionIds.includes(id)));
    if (conflict) return result('clarify', '這次回答同時包含互相衝突的決定。我先不改變情境；請確認你最後真正要採取的行動。');

    const blocked = available.map(action => ({ action, reason: unmetRequirement(state, action) })).find(item => item.reason);
    if (blocked) {
      state.events.push({ node: node.id, action: blocked.action.id, kind: 'blocked' });
      return result('blocked', `${blocked.reason}，因此沒有執行。請改用目前仍可行的方法。`);
    }

    for (const action of available) {
      const hazard = node.hazards?.[action.id];
      if (hazard) {
        applyPatch(state, hazard);
        state.events.push({ node: node.id, action: action.id, kind: 'hazard' });
        if (hazard.terminal) {
          state.sessionStatus = hazard.sessionStatus || 'FAILED';
          state.completionKind = hazard.completionKind || 'CRITICAL_FAILURE';
          return result('failed', hazard.message);
        }
        return result('risk', hazard.message);
      }
    }

    const fresh = available.filter(action => !state.accepted.includes(action.id));
    if (!fresh.length) return result('clarify', '這項行動已經完成，請根據目前情境決定下一步。');
    for (const action of fresh) {
      state.accepted.push(action.id);
      state.events.push({ node: node.id, action: action.id, kind: 'action' });
      applyPatch(state, node.effects?.[action.id]);
    }
    state.nodeTurn += 1;
    const timed = applyTimedEvent(state, node, fresh.map(action => action.id));
    if (timed) return result('environment_change', timed.message);
    const riskEffect = fresh.map(action => node.effects?.[action.id]).find(effect => effect?.kind === 'risk');
    if (riskEffect) return result('risk', riskEffect.message);

    const missing = node.required.filter(id => !state.accepted.includes(id));
    if (missing.length) {
      return result('partial', `已記住：${fresh.map(action => action.label).join('、')}。本階段仍有必要行動尚未完成。`);
    }

    if (node.terminal) {
      applyPatch(state, node.terminal);
      state.sessionStatus = node.terminal.sessionStatus;
      state.completionKind = node.terminal.completionKind;
      return result('completed', node.terminal.message);
    }

    applyPatch(state, node.onComplete);
    state.node = node.onComplete.to;
    state.accepted = [];
    state.nodeTurn = 0;
    return result('transition', node.onComplete.message);
  }

  function review(spec, state) {
    const label = {
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
      `劇本 v${state.version}`,
      `結果：${label}`,
      `學習目標：\n${list(spec.learningObjectives || [])}`,
      `做對的決策：\n${list(completedIds.map(id => actionById[id] || id))}`,
      `危險決策：\n${list(hazardIds.map(id => actionById[id] || id))}`,
      `需要補強：\n${list(missingIds.map(id => actionById[id] || id))}`,
      `剩餘資源：手機 ${state.resources.battery ?? 0}%、飲水 ${state.resources.water ?? 0}、體力 ${state.resources.energy ?? 0}%`,
      `常見錯誤觀念：\n${list(spec.commonMisconceptions || [])}`,
      `反思問題：\n${list(spec.reflectionQuestions || [spec.reflection])}`,
    ].join('\n');
  }

  root.ScenarioEngineV3 = { create, step, review };
  if (typeof module !== 'undefined') module.exports = root.ScenarioEngineV3;
})(globalThis);
