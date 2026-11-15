/* Pure, offline state machine. JSON is shared with Android; no claim of general language understanding. */
(function (root) {
  function create(spec) {
    return { version: spec.version, node: 0, completed: [], accepted: [], hints: [], events: [], outcome: 'CONTINUE' };
  }
  function mentions(spec, text, pattern) {
    const signs = new Set();
    for (const clause of text.replace(/\s/g, '').split(new RegExp(spec.splitPattern))) {
      for (const match of clause.matchAll(new RegExp(pattern, 'g'))) {
        const prefix = clause.slice(0, match.index);
        signs.add(new RegExp(spec.negationPattern).test(prefix) ? 'negative' : 'positive');
      }
    }
    return signs;
  }
  function step(spec, before, text, intent = 'action', resolved = null) {
    const state = JSON.parse(JSON.stringify(before));
    const node = spec.nodes[state.node];
    function result(kind, message, effects = []) {
      return { state, kind, message, effects, progressDelta: state.completed.length - before.completed.length,
        outcome: state.outcome, safety: state.outcome === 'FAILED' ? 'FAILED' : kind === 'risk' ? 'LOW' : 'MEDIUM',
        reason: message, shouldAskAgain: state.completed.length === before.completed.length, verdictLabel: {
          question: '詢問・尚未採取行動', observe: '觀察・不計入完成', clarify: '需要釐清', partial: '已記住你的行動',
          advance: '進入下一階段', success: '練習完成', risk: '請修正決定', failed: '演練已停止', locked: '本次已結束', hint: '提示'
        }[kind] };
    }
    if (state.outcome !== 'CONTINUE') return result('locked', '本次已結束，請重新開始新的演練。');
    text = text.trim();
    if (!text && intent === 'action') return result('clarify', '請描述行動，或使用下方的引導選項。');
    if (intent === 'observe') return result('observe', node.observation);
    if (intent === 'hint') {
      const used = state.hints.filter(x => x.node === node.id).length;
      if (used < node.hints.length) state.hints.push({ node: node.id, level: used + 1 });
      return result('hint', node.hints[Math.min(used, node.hints.length - 1)]);
    }
    if (intent === 'question' || (!resolved && new RegExp(spec.questionPattern).test(text)))
      return result('question', `我尚未把這句當成行動。以下是本階段的一般說明，不是自由問答：${node.answer}`);
    if (!resolved && new RegExp(spec.uncertainPattern).test(text)) return result('clarify', '這句包含假設或不確定語意。請確認你現在實際決定做什麼；也可以選擇引導行動。');
    if (resolved && (!Array.isArray(resolved.actionIds) || resolved.actionIds.some(id => ![...spec.actions, ...spec.hazards].some(a => a.id === id))))
      return result('clarify', '這項行動不在本情境可驗證的範圍，尚未執行。');
    const actionSigns = spec.actions.map(a => ({ ...a, signs: resolved ? new Set(resolved.actionIds.includes(a.id) ? ['positive'] : []) : mentions(spec, text, a.pattern) }));
    const hazardSigns = spec.hazards.map(a => ({ ...a, signs: resolved ? new Set(resolved.actionIds.includes(a.id) ? ['positive'] : []) : mentions(spec, text, a.pattern) }));
    const positives = actionSigns.filter(a => a.signs.has('positive'));
    const hazards = hazardSigns.filter(a => a.signs.has('positive'));
    const contradictory = [...actionSigns, ...hazardSigns].some(a => a.signs.size > 1)
      || actionSigns.some(a => state.accepted.includes(a.id) && a.signs.has('negative'))
      || (positives.some(a => a.id === 'close') && hazards.some(a => a.id === 'open'));
    if (contradictory) return result('clarify', '這次說法包含相反行動，或與已完成行動矛盾。我先不改變情境；請重新說明你最後採取的行動。');
    if (hazards.length) {
      const fatal = hazards.some(a => a.fatal);
      if (fatal) state.outcome = 'FAILED';
      state.events.push({ node: node.id, kind: fatal ? 'failed' : 'risk', labels: hazards.map(a => a.label) });
      return result(fatal ? 'failed' : 'risk', `${hazards.map(a => a.label).join('、')}不適合目前濃煙阻斷的設定。${fatal ? '本次模擬停止，可回顧後重新練習。' : '尚未執行此危險選擇；請重新決定，已完成的安全行動仍保留。'}`);
    }
    const allowed = [...node.required, ...node.optional];
    const fresh = positives.filter(a => allowed.includes(a.id) && !state.accepted.includes(a.id));
    state.accepted.push(...fresh.map(a => a.id));
    if (fresh.length) state.events.push({ node: node.id, kind: 'action', labels: fresh.map(a => a.label) });
    const missing = node.required.filter(id => !state.accepted.includes(id));
    if (!missing.length) {
      state.completed.push(node.id);
      if (state.node === spec.nodes.length - 1) state.outcome = 'SUCCESS';
      else { state.node++; state.accepted = []; }
      const deferred = positives.some(a => !allowed.includes(a.id));
      return result(state.outcome === 'SUCCESS' ? 'success' : 'advance', node.completion + (deferred ? ' 本回合只確認目前階段，其他行動請在下一階段確認。' : ''), fresh.map(a => a.effect));
    }
    if (!fresh.length) return result('clarify', '沒有新增已確認的行動。否定、重複或無法理解的描述不會算完成；請換句話說，或使用引導選項。');
    return result('partial', `已記住：${fresh.map(a => a.label).join('、')}。尚待完成：${missing.map(id => spec.actions.find(a => a.id === id).label).join('、')}。`, fresh.map(a => a.effect));
  }
  function review(spec, state) {
    const labels = state.events.filter(e => e.kind === 'action').flatMap(e => e.labels);
    const misses = spec.nodes.filter(n => !state.completed.includes(n.id)).flatMap(n => n.required.filter(id => n.id !== spec.nodes[state.node].id || !state.accepted.includes(id)))
      .map(id => spec.actions.find(a => a.id === id).label);
    const risks = state.events.filter(e => e.kind !== 'action').flatMap(e => e.labels);
    return `劇本 v${spec.version} · 學習模式\n完成 ${state.completed.length}/${spec.nodes.length} 階段\n已練習：${[...new Set(labels)].join('、') || '尚無'}\n待補強：${[...new Set(misses)].join('、') || '本劇本必要決策皆已完成'}\n需回顧的選擇：${risks.join('、') || '無已辨識風險選擇'}\n提示使用：${state.hints.length} 層\n${spec.reflection}`;
  }
  root.FireDrill = { create, step, review };
  if (typeof module !== 'undefined') module.exports = root.FireDrill;
})(globalThis);
