(function (root) {
  function referencedAction(text) {
    return /(?:我(?:看見|看到|聽到|聽說)|(?:提醒|叫|告訴|勸)(?:室友|同學|家人|別人|大家|他|她)|(?:有人|室友|同學|別人)(?:正在|想|在|說)|(?:我)?(?:拒絕|絕不|不會|不打算|不想|不要|並未)|(?:所以|因此)我(?:留|待|停|等))/.test(text)
      && !/(?:但|然而|可是|結果|接著|然後|之後|現在)我(?:要|仍要|還是要|已經|就|真的)/.test(text);
  }
  function nonAction(spec, text, intent, node) {
    const excerpt = text.slice(0, 120);
    const hypothetical = /如果|假如|假設|想像|幻想|萬一|要是|只是想想/.test(text);
    if (hypothetical) {
      const compact = text.replace(/\s/g, '');
      const hazard = Array.isArray(spec.hazards)
        ? spec.hazards.find(action => new RegExp(action.pattern).test(compact))
        : spec.actions.find(action => node.hazards?.[action.id] && new RegExp(action.pattern).test(compact));
      const detail = hazard && !Array.isArray(spec.hazards) ? node.hazards[hazard.id].message.split('本次演練')[0] : '';
      const consequence = hazard
        ? `若真的「${hazard.label}」，${detail || '可能增加走廊濃煙中的暴露與受困風險。'}`
        : '目前無法確認這個假設的後果。你想先確認哪個現場條件？';
      return {kind:'question', message:`你提的是假設「${excerpt}」。${consequence}`};
    }
    if (intent === 'question' || new RegExp(spec.questionPattern).test(text)) {
      return {kind:'question', message:`關於「${excerpt}」，目前的已知線索是：${node.situation} 你想先確認哪一項現場條件？`};
    }
    if (referencedAction(text) || /(?:不會|不打算|沒有要|沒打算|不是要|並未|我不想|我不要|開玩笑|只是想說)/.test(text)) {
      return {kind:'clarify', message:`「${excerpt}」尚未確認為行動。你現在決定做什麼？`};
    }
    return null;
  }

  function unclear(text, task) {
    return `「${text.slice(0, 120)}」無法確認為本情境的行動。現在的任務是：${task}`;
  }
  root.DrillLanguage = {nonAction, unclear, referencedAction};
  if (typeof module !== 'undefined') module.exports = root.DrillLanguage;
})(globalThis);
