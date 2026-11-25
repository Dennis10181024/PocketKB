'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { analyze } = require('../../scripts/metrics/analyze');
const { run } = require('../../scripts/metrics');

const base = { sessionId: 'demo-1', scenarioId: 'school', packVersion: '1.0.3', packDigest: 'a'.repeat(64) };
const chosen = (decisionId, optionId, additional = {}) => ({
  ...base, inputSource: 'choice', attempt: 1, decisionId, optionId, occurrence: 1,
  safety: 'safe', displayOrderOptionIds: ['better', 'later'], responseTimeMs: 1000, ...additional
});
const retry = (attempt, decisionId = 'd1', extra = {}) => ({ ...base, attempt, retryFrom: { decisionId }, ...extra });
const ending = (type, injury = 'NONE') => ({ type, injury });

test('synthetic mixed exports produce exact safety, fatal and retry denominators', () => {
  const unsafe = chosen('d1', 'later', { revision: 1, safety: 'unsafe', responseTimeMs: 3000 });
  const fatal = chosen('d2', 'later', { revision: 3, safety: 'unsafe', fatal: true,
    ending: ending('CRITICAL_FAILURE', 'NOT_ASSESSED') });
  const inputs = [
    { ...base, attempt: 1, eventType: 'start', decisionId: 'd1' },
    unsafe, { ...unsafe }, chosen('d1', 'better', { occurrence: 2, revision: 2 }), fatal,
    retry(2), chosen('d1', 'later', { attempt: 2, revision: 5, safety: 'unsafe', fatal: true,
      ending: ending('CRITICAL_FAILURE', 'NOT_ASSESSED'), displayOrderOptionIds: ['later', 'better'] }),
    retry(3), chosen('d1', 'better', { attempt: 3, revision: 7, ending: ending('SELF_EVACUATION'), responseTimeMs: 0 }),
    retry(4),
    chosen('d1', 'better', { sessionId: 'demo-2', revision: 1, responseTimeMs: null }),
    { ...base, sessionId: 'demo-2', attempt: 1, decisionId: 'd2', ending: 'EXITED', inputSource: 'choice' },
    { ...base, sessionId: 'demo-3', attempt: 1, eventType: 'start', decisionId: 'd1' },
    chosen('d1', 'later', { sessionId: 'demo-4', safety: 'unsafe', fatal: true, ending: ending('CRITICAL_FAILURE', 'NOT_ASSESSED') }),
    retry(2, 'd1', { sessionId: 'demo-4' }),
    { ...base, sessionId: 'demo-4', attempt: 2, decisionId: 'd1', ending: 'EXITED', eventType: 'exit' },
    { ...base, inputSource: 'free-text-old', rawText: 'INTERNAL' }
  ];
  const out = analyze(inputs);
  assert.deepEqual(out.summary, {
    sessions: 4, safeFirst: 1, totalFirst: 4, safetyRate: .25, fatalities: 3,
    retryCount: 4, retryCompleted: 1, retryRate: .25,
    retryEndings: { 'CRITICAL_FAILURE / NOT_ASSESSED': 1, 'SELF_EVACUATION / NONE': 1, OPEN: 1, EXITED: 1 },
    knownUnanswered: 4, ignored: 1, duplicateChoices: 1
  });
  assert.equal(out.responses.find(row => row.attempt === 2).selectedPosition, 1);
  assert.equal(out.responses.find(row => row.optionId === 'later' && row.decisionId === 'd1').selectedPosition, 2);
  assert.equal(out.attempts.find(row => row.attempt === 3).responseTimeMs, 0);
  assert.equal(out.attempts.find(row => row.sessionId === 'demo-2').responseTimeMs, null);
  assert.equal(out.attempts.find(row => row.sessionId === 'demo-1').sessionFatalities, 2);
  assert.ok(out.responses.every(row => row.packVersion === '1.0.3'));
  assert.equal(out.responses.filter(row => row.firstDecision).length, 4);
});

test('zero denominators, legacy version matching and incompatible duplicates', () => {
  assert.equal(analyze([]).summary.safetyRate, null);
  assert.equal(analyze([]).summary.retryRate, null);
  const yes = chosen('d1', 'better');
  assert.equal(analyze([yes, { ...yes, packDigest: undefined }]).summary.duplicateChoices, 1);
  assert.throws(() => analyze([yes, { ...yes, optionId: 'later' }]), /互相衝突/);
  assert.throws(() => analyze([yes, { ...yes, displayOrderOptionIds: ['later', 'better'] }]), /互相衝突/);
  assert.equal(analyze([yes, { ...yes, packDigest: 'b'.repeat(64) }]).summary.sessions, 2);
  assert.equal(analyze([{ ...yes, packDigest: undefined }]).summary.sessions, 1);
  const badOrdering = analyze([{ ...yes, displayOrderOptionIds: ['later'] }]);
  assert.equal(badOrdering.responses[0].selectedPosition, null);
});

test('CLI merges exported JSONL and emits CSV and self-contained HTML without raw text', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pocketkb-synthetic-metrics-'));
  const input = path.join(dir, 'web.jsonl');
  const android = path.join(dir, 'android.jsonl');
  const out = path.join(dir, 'report');
  try {
    const value = chosen('d1', 'better', { text: 'PERSONAL-TEXT', actionLines: ['PRIVATE-LINE'] });
    fs.writeFileSync(input, '\uFEFF' + JSON.stringify(value) + '\r\n');
    fs.writeFileSync(android, JSON.stringify({ ...value, sessionId: 'realistic-opaque-id', requestId: 'android-request' }) + '\n');
    const summary = run([input, android, '--out', out]);
    assert.equal(summary.sessions, 2);
    const report = fs.readFileSync(path.join(out, 'summary.html'), 'utf8');
    assert.match(report, /100\.0%/);
    assert.match(report, /1\.00/);
    assert.doesNotMatch(report, /realistic-opaque-id|PERSONAL-TEXT|PRIVATE-LINE|https?:/);
    assert.match(fs.readFileSync(path.join(out, 'responses.csv'), 'utf8'), /\uFEFFsessionId.*selectedPosition/);
    assert.match(fs.readFileSync(path.join(out, 'attempts.csv'), 'utf8'), /sessionFatalities/);
    fs.writeFileSync(input, '{bad');
    assert.throws(() => run([input, '--out', out]), /web\.jsonl 第 1 列/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
