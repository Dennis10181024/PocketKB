const { test } = require('node:test');
const assert = require('node:assert/strict');
const V3 = require('./scenario-engine-v3');
const V2 = require('./fire-engine');
const oldFire = require('./scenarios/fire-dorm.json');
const fire = require('./scenarios/v3/fire-dorm.json');
const cases = require('./scenarios/step21-cases.json');
const run = (spec, inputs) => inputs.reduce((state, input) => V3.step(spec, state, input).state, V3.create(spec));
const view = state => [state.endingType, state.injuryLevel, state.exposure];

test('14 v2 fire cases retain all 38 turn classifications, nodes, clocks, and terminal locks', () => {
  for (const scenario of require('./scenarios/fire-cases.json')) {
    let old = V2.create(oldFire);
    let current = V3.create(fire);
    for (const input of scenario.turns) {
      const a = V2.step(oldFire, old, input.text, input.intent);
      const b = V3.step(fire, current, input.text, input.intent);
      old = a.state;
      current = b.state;
      const normalized = { transition: 'advance', completed: 'success' }[b.kind] || b.kind;
      assert.equal(a.kind, input.kind, input.text);
      assert.deepEqual([normalized, current.node, current.elapsed || 0],
        [a.kind, oldFire.nodes[old.node].id, old.elapsed || 0], input.text);
    }
  }
});

for (const row of cases) {
  const spec = require(`./scenarios/v3/${row.file}.json`);
  test(`${row.file}: best route and immediate termination`, () => {
    const best = run(spec, row.best);
    assert.deepEqual(view(best), [row.endingType, row.injuryLevel, row.exposure]);
    assert.equal(best.injuryWorsened, false);
    assert.equal(best.variantId, 'base');
    if (row.endingType === 'SAFE_RESCUE') assert.equal(best.events.filter(e=>e.kind==='rescue_contact').length, 1);
    const failed = run(spec, [row.danger]);
    assert.deepEqual(view(failed), ['CRITICAL_FAILURE','NOT_ASSESSED',row.exposure]);
    assert.equal(failed.injuryCauses.length,0);
  });
  test(`${row.file}: three inputs sequences each replay five times`, () => {
    for (const inputs of [row.best, [row.danger], ['哈哈哈', ...row.best]]) {
      const reference = run(spec, inputs);
      for (let attempt = 0; attempt < 5; attempt++) assert.deepEqual(run(spec, inputs), reference);
    }
  });
  test(`${row.file}: NPC actor, contradiction and eight emotion samples`, () => {
    const start = V3.create(spec);
    const danger = row.danger.replace(/^我/, '');
    assert.equal(V3.step(spec, start, '室友' + danger).kind, 'clarify');
    assert.equal(V3.step(spec,start,spec.npc.name+danger).kind,'clarify');
    const ready = V3.step(spec,start,`我請${spec.npc.name}先停手`).state;
    assert.equal(ready.npc.handled,true);
    assert.equal(ready.node,start.node);
    assert.equal(V3.step(spec, start, `我${danger}，但我不${danger}`).kind, 'clarify');
    for (const sample of row.emotion) {
      assert.ok(!['risk','failed'].includes(V3.step(spec,start,sample.text).kind), sample.text);
      const result = V3.step(spec,ready,sample.text);
      assert.ok(!['risk','failed'].includes(result.kind),sample.text);
      assert.equal(result.state.npc.emotion,sample.category,sample.text);
      assert.deepEqual(result.state.exposure,start.exposure);
    }
  });
  test(`${row.file}: previously verified danger and safe inputs`, () => {
    for (const input of row.regressionDanger) assert.equal(V3.step(spec,V3.create(spec),input.text).kind,input.kind,input.text);
    for (const text of row.regressionSafe) assert.ok(!['risk','failed'].includes(V3.step(spec,V3.create(spec),text).kind),text);
  });
  for (const graded of row.graded || []) {
    test(`${row.file}: ${graded.injuryLevel}`, () => {
      assert.deepEqual(view(run(spec, graded.actions)), [graded.endingType,graded.injuryLevel,graded.exposure]);
    });
  }
}

test('fire collection remains blocked, explicit delays occur at most twice, gates and immediate priority hold', () => {
  const start = V3.create(fire);
  const pack = V3.step(fire, start, '我要收拾行李');
  assert.equal(pack.kind, 'risk');
  assert.equal(pack.state.node, start.node);
  assert.deepEqual(pack.state.exposure, start.exposure);
  assert.equal(pack.state.elapsed || 0, 0);
  for (const flag of ['doorClosed', 'playerInside', 'hallSmoke']) {
    const state = {...start, facts:{...start.facts,[flag]:!start.facts[flag]}};
    assert.deepEqual(V3.step(fire,state,'先等一下').state.exposure,start.exposure);
  }
  assert.deepEqual(run(fire, ['先等一下','先等一下','先等一下']).exposure, {heat:0,smoke:5});
  const terminal = run(fire, ['我徒手抓住熱門把，我搭電梯']);
  assert.deepEqual(view(terminal), ['CRITICAL_FAILURE','NOT_ASSESSED',start.exposure]);
});

test('replay uses adopted action IDs across all six scripts, including graded endings', () => {
  for (const row of cases) {
    const spec = require(`./scenarios/v3/${row.file}.json`);
    for (const texts of [row.best, [row.danger], ...(row.graded || []).map(grade => grade.actions)]) {
      let state = V3.create(spec);
      const decisions = texts.map(text => {
        const prior = state;
        state = V3.step(spec,state,text).state;
        const actionIds = V3.adoptedActionIds(prior,state);
        assert.ok(actionIds.length,text);
        return {actionIds,intent:'action'};
      });
      for (let n = 0; n < 5; n++) assert.deepEqual(view(V3.replayDecisions(spec,decisions)),view(state));
    }
  }
});
