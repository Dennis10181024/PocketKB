'use strict';

const completeTypes = new Set(['SAFE_RESCUE', 'DELAYED_RESCUE', 'SELF_EVACUATION', 'DELAYED_EVACUATION']);
const loggedSources = new Set(['choice', 'other_gpt', 'other_gemma']);
const endTypes = new Set([...completeTypes, 'CRITICAL_FAILURE', 'EXITED']);
const id = value => typeof value === 'string' && /^[a-z0-9_-]{1,128}$/i.test(value);
const integer = value => Number.isSafeInteger(value) && value >= 0;
const ratio = (num, den) => den ? num / den : null;
const key = (...parts) => JSON.stringify(parts);
const add = (map, name) => map.set(name, (map.get(name) ?? 0) + 1);

function normalize(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const { sessionId, scenarioId, attempt } = input;
  if (!id(sessionId) || !id(scenarioId) || !integer(attempt) || attempt < 1) return null;
  if (input.inputSource && !loggedSources.has(input.inputSource)) return null;
  const packDigest = typeof input.packDigest === 'string' &&
    /^[0-9a-f]{64}$/i.test(input.packDigest) ? input.packDigest.toLowerCase() : '';
  const packVersion = /^[a-z0-9._+\-]{1,64}$/i.test(String(input.packVersion ?? '')) ? String(input.packVersion) : '';
  if (!packDigest && !packVersion) return null;
  const decisionId = id(input.decisionId) ? input.decisionId : null;
  const type = typeof input.ending === 'string' ? input.ending : input.ending?.type;
  const ending = endTypes.has(type) ? type : null;
  const injury = ['NONE', 'MILD', 'MODERATE', 'SEVERE', 'NOT_ASSESSED'].includes(input.ending?.injury) ?
    input.ending.injury : null;
  const eventType = input.eventType || (input.optionId ? 'choice' : ending === 'EXITED' ? 'exit' :
    input.retryFrom ? 'retry' : null);
  const base = { sessionId, scenarioId, attempt, packDigest, packVersion, decisionId, eventType,
    order: integer(input.revision) ? input.revision : integer(input.clock) ? input.clock : null };
  if (eventType === 'exit' && ending === 'EXITED') return { ...base, ending };
  if (eventType === 'start' && attempt === 1) return base;
  if (eventType === 'retry' && attempt > 1) {
    return { ...base, decisionId: decisionId ?? (id(input.retryFrom?.decisionId) ? input.retryFrom.decisionId : null) };
  }
  if (eventType !== 'choice' || !decisionId || !id(input.optionId) ||
      !integer(input.occurrence) || input.occurrence < 1 || !['safe', 'unsafe'].includes(input.safety)) return null;
  const shown = Array.isArray(input.displayOrderOptionIds) && input.displayOrderOptionIds.every(id) ?
    input.displayOrderOptionIds : [];
  const shownOrder = new Set(shown).size === shown.length && shown.includes(input.optionId) ? shown : [];
  return { ...base, occurrence: input.occurrence, optionId: input.optionId, displayOrderOptionIds: shownOrder,
    responseTimeMs: integer(input.responseTimeMs) ? input.responseTimeMs : null,
    backgroundTimeMs: integer(input.backgroundTimeMs) ? input.backgroundTimeMs : null,
    observationTimeMs: integer(input.observationTimeMs) ? input.observationTimeMs : null,
    safety: input.safety, fatal: input.fatal === true, ending, injury };
}

function analyze(inputs) {
  const sessions = new Map();
  const versions = new Map();
  for (const input of inputs) {
    const row = normalize(input);
    if (!row?.packDigest || !row.packVersion) continue;
    const versionKey = key(row.sessionId, row.scenarioId, row.packVersion);
    if (!versions.has(versionKey)) versions.set(versionKey, new Set());
    versions.get(versionKey).add(row.packDigest);
  }
  let ignored = 0, duplicateChoices = 0;
  for (const input of inputs) {
    const row = normalize(input);
    if (!row) { ignored++; continue; }
    const { sessionId, scenarioId, packVersion, attempt } = row;
    const alternatives = versions.get(key(sessionId, scenarioId, packVersion));
    const packDigest = row.packDigest || (alternatives?.size === 1 ? [...alternatives][0] : '');
    if (!packDigest && alternatives?.size > 1) throw new Error('相同場次與版本對應多個摘要，請分開不同批次。');
    const sessionKey = key(sessionId, scenarioId, packDigest || packVersion);
    if (!sessions.has(sessionKey)) sessions.set(sessionKey, { sessionId, scenarioId, packDigest, packVersion, attempts: new Map() });
    const session = sessions.get(sessionKey);
    if (!session.attempts.has(attempt)) session.attempts.set(attempt, { rows: new Map(), observed: new Set(), exit: false });
    const state = session.attempts.get(attempt);
    if (row.eventType !== 'choice') {
      if (row.decisionId) state.observed.add(row.decisionId);
      if (row.eventType === 'exit') state.exit = true;
      continue;
    }
    const rowKey = key(row.decisionId, row.occurrence);
    const previous = state.rows.get(rowKey);
    if (previous) {
      if (key(previous.optionId, previous.safety, previous.fatal, previous.ending, previous.injury) !==
          key(row.optionId, row.safety, row.fatal, row.ending, row.injury) ||
          (previous.displayOrderOptionIds.length && row.displayOrderOptionIds.length &&
            key(previous.displayOrderOptionIds) !== key(row.displayOrderOptionIds)) ||
          (previous.responseTimeMs !== null && row.responseTimeMs !== null && previous.responseTimeMs !== row.responseTimeMs)) {
        throw new Error('同一場次與決策次序有互相衝突的結算資料，請分開原始檔。');
      }
      if (!previous.displayOrderOptionIds.length) previous.displayOrderOptionIds = row.displayOrderOptionIds;
      for (const field of ['order', 'responseTimeMs', 'backgroundTimeMs', 'observationTimeMs']) previous[field] ??= row[field];
      duplicateChoices++;
      continue;
    }
    state.rows.set(rowKey, row);
  }
  const attempts = [], responses = [];
  const retryEndings = new Map();
  let safeFirst = 0, totalFirst = 0, fatalities = 0, retryCount = 0, retryCompleted = 0;
  for (const { attempts: groups, ...identity } of sessions.values()) {
    for (const [attempt, state] of [...groups].sort((a, b) => a[0] - b[0])) {
      const rows = [...state.rows.values()].sort((a, b) =>
        (a.order ?? 0) - (b.order ?? 0) || a.occurrence - b.occurrence || a.decisionId.localeCompare(b.decisionId));
      const decisions = new Set();
      const terminal = rows.filter(row => row.ending);
      if (terminal.length > 1 || (terminal.length && state.exit)) throw new Error('同一嘗試有多個終止結果，請核對來源。');
      const ending = terminal[0]?.ending ?? (state.exit ? 'EXITED' : 'OPEN');
      const injury = terminal[0]?.injury ?? null;
      const unanswered = [...state.observed].filter(decision => !rows.some(row => row.decisionId === decision));
      let safe = 0, eligible = 0, fatal = 0;
      for (const row of rows) {
        const firstDecision = attempt === 1 && !decisions.has(row.decisionId);
        decisions.add(row.decisionId);
        if (firstDecision) {
          eligible++;
          if (row.safety === 'safe') safe++;
        }
        if (row.fatal) fatal++;
        responses.push({ ...identity, ...row, packDigest: identity.packDigest, packVersion: identity.packVersion,
          firstDecision, selectedPosition: row.displayOrderOptionIds.length ? row.displayOrderOptionIds.indexOf(row.optionId) + 1 : null });
      }
      safeFirst += safe;
      totalFirst += eligible;
      fatalities += fatal;
      if (attempt > 1) {
        retryCount++;
        if (completeTypes.has(ending)) retryCompleted++;
        add(retryEndings, ending + (injury ? ' / ' + injury : ''));
      }
      const timedRows = rows.filter(row => row.responseTimeMs !== null);
      attempts.push({ ...identity, attempt, ending, injury, answered: rows.length, knownUnanswered: unanswered.length,
        safeFirst: safe, totalFirst: eligible, safetyRate: ratio(safe, eligible), fatal,
        responseTimeMs: timedRows.length ? timedRows.reduce((sum, row) => sum + row.responseTimeMs, 0) : null,
        timedAnswers: timedRows.length });
    }
  }
  const sessionFatalities = new Map();
  for (const row of attempts) {
    const group = key(row.sessionId, row.scenarioId, row.packDigest || row.packVersion);
    sessionFatalities.set(group, (sessionFatalities.get(group) ?? 0) + row.fatal);
  }
  for (const row of attempts) row.sessionFatalities = sessionFatalities.get(key(row.sessionId, row.scenarioId, row.packDigest || row.packVersion));
  return { attempts, responses, summary: {
    sessions: sessions.size, safeFirst, totalFirst, safetyRate: ratio(safeFirst, totalFirst), fatalities,
    retryCount, retryCompleted, retryRate: ratio(retryCompleted, retryCount), retryEndings: Object.fromEntries(retryEndings),
    knownUnanswered: attempts.reduce((sum, row) => sum + row.knownUnanswered, 0), ignored, duplicateChoices
  } };
}

module.exports = { analyze };
