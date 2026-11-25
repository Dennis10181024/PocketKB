'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { create } = require('../../web-pwa/play-study-log');
const { generate } = require('../../scripts/create-blind-option-test');

test('Web exports choice metadata without player text, optional PII or narration', () => {
  const log = create({ sessionId: 'random-id', scenarioId: 'demo', packVersion: 1, packDigest: 'a'.repeat(64) });
  const view = { attempt: 1, revision: 0, decision: { id: 'door', options: [{ id: 'close' }, { id: 'wait' }] } };
  log.marker('start', view);
  log.choice({ attempt: 1, decisionId: 'door', occurrence: 1, optionId: 'close', optionClass: 'correct',
    responseTimeMs: 3200, displayOrderOptionIds: ['close', 'wait'], safety: 'safe',
    fatal: false, ending: null, impacts: [{ id: 'closed', direct: true, ip: 'PRIVATE_IP' }],
    text: 'PRIVATE_TEXT', actionLines: ['PRIVATE_NARRATION'], sourceIds: ['source'], principles: ['p'], hazards: []
  }, { revision: 0, backgroundTimeMs: 1200, requestId: 'choice-0' });
  log.marker('exit', { ...view, revision: 1 });
  const content = log.jsonl();
  assert.doesNotMatch(content, /PRIVATE_/);
  const rows = content.trim().split('\n').map(JSON.parse);
  assert.deepEqual(rows.map(row => row.eventType), ['start', 'choice', 'exit']);
  assert.equal(rows[1].responseTimeMs, 3200);
  assert.deepEqual(rows[1].events, [{ id: 'closed', direct: true }]);
  assert.equal(rows[2].ending, 'EXITED');
});

test('blind question booklet and separate key match all five fixed packs', () => {
  const { quiz, key } = generate();
  const headings = [...quiz.matchAll(/^### (\d-\d+)　/gm)];
  const answers = [...key.matchAll(/^\| (\d-\d+) \| [A-D] \|$/gm)];
  assert.ok(headings.length > 30);
  assert.deepEqual(headings.map(row => row[1]), answers.map(row => row[1]));
  assert.doesNotMatch(quiz, /sourceIds|optionClass|hazardId|https?:/);
  for (const [name, expected] of [['BLIND_OPTION_TEST.md', quiz], ['BLIND_OPTION_TEST_KEY.md', key]]) {
    assert.equal(fs.readFileSync(path.resolve(__dirname, '../../docs', name), 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n'), expected);
  }
});
