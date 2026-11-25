(function publish(root) {
  'use strict';

  function create({ sessionId, scenarioId, packVersion, packDigest }) {
    const identity = { sessionId, scenarioId, packVersion, packDigest, evaluatorVersion: 1, inputSource: 'choice' };
    const rows = [];
    const add = row => rows.push({ ...identity, ...row });
    function marker(eventType, view) {
      add({ eventType, attempt: view.attempt, revision: view.revision,
        decisionId: view.decision?.id ?? null, retryFrom: view.retryFrom,
        displayOrderOptionIds: view.decision?.options.map(option => option.id) ?? [],
        ...(eventType === 'exit' ? { ending: 'EXITED' } : {}) });
    }
    function choice(record, { revision, backgroundTimeMs = 0, requestId }) {
      add({ eventType: 'choice', attempt: record.attempt, revision, requestId, decisionId: record.decisionId,
        occurrence: record.occurrence, optionId: record.optionId, optionClass: record.optionClass,
        displayOrderOptionIds: record.displayOrderOptionIds, responseTimeMs: record.responseTimeMs,
        backgroundTimeMs, fallback: null, sourceIds: record.sourceIds, safety: record.safety,
        fatal: record.fatal, ending: record.ending, principles: record.principles, hazards: record.hazards,
        events: record.impacts.map(impact => ({ id: impact.id, direct: impact.direct })) });
    }
    return { marker, choice, jsonl: () => rows.map(row => JSON.stringify(row)).join('\n') + '\n' };
  }

  function save(sessionId, jsonl) {
    if (!/^[a-z0-9-]+$/i.test(sessionId)) throw new TypeError('Invalid session ID');
    const url = URL.createObjectURL(new Blob([jsonl], { type: 'application/x-ndjson' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'PocketKB-' + sessionId + '.jsonl';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  const api = { create, save };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PocketPlayStudyLog = api;
})(globalThis);
