const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('./fire-engine');
const spec = require('./scenarios/fire-dorm.json');
const cases = require('./scenarios/fire-cases.json');
let count = 0;
for (const test of cases) {
  let state = engine.create(spec);
  for (const turn of test.turns) {
    const snapshot = JSON.stringify(state);
    const result = engine.step(spec, state, turn.text, turn.intent);
    assert.equal(JSON.stringify(state), snapshot, 'input state must stay immutable');
    assert.equal(result.kind, turn.kind, `${test.name}: ${turn.text}`);
    assert.equal(result.state.node, turn.node, test.name);
    assert.equal(result.state.outcome, turn.outcome || 'CONTINUE', test.name);
    state = result.state;
    count++;
  }
}
// Every displayed choice runs through the same interpreter; hints never auto-submit.
let state = engine.create(spec);
for (const node of spec.nodes) {
  for (const choice of node.choices.filter(c => !/衝出去|浴室|跳窗/.test(c))) state = engine.step(spec, state, choice).state;
}
assert.equal(state.outcome, 'SUCCESS', 'guided path is completable');
assert.equal(state.completed.length, 3);
assert.match(engine.review(spec, state), /必要決策皆已完成/);
assert.notEqual(engine.create(spec), engine.create(spec));
console.log(`PASS ${count} shared turns + complete guided path + review + immutable states`);
