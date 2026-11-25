'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { lint, promptReview } = require('../../scripts/pack-lint');

test('prompt audit distinguishes scene objects from explicit answer cues', () => {
  const options = [
    { class: 'correct', text: '我沿著樓梯維持原隊伍。' },
    { class: 'misconception', text: '我等附近的電梯抵達。' }
  ];
  assert.deepEqual(promptReview({ prompt: '樓梯和電梯都在眼前。我怎麼選？', options }),
    { found: ['電梯', '樓梯'], exclusive: ['樓梯'], duplicated: false, explicit: false });
  assert.equal(promptReview({ prompt: '正確做法是跟好原隊伍。', options }).explicit, true);
  assert.equal(promptReview({ prompt: '老師說：「沿著樓梯維持原隊伍。」', options }).duplicated, true);
});

test('the command verifies registered packs, shared paths and draft status', () => {
  const result = lint();
  assert.deepEqual(result.errors, []);
  assert.ok(result.results.length >= 5);
  assert.ok(result.results.every(row => row.pathCheck.decisions === row.rows.length));
});
