const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const directory = path.join(__dirname, 'scenarios', 'v3');
const files = fs.readdirSync(directory).filter(name => name.endsWith('.json'));
assert.ok(files.length >= 5, 'v3 library must contain multiple disaster and location types');

const ids = new Set();
for (const file of files) {
  const spec = JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8'));
  assert.ok(!ids.has(spec.id), `${file}: scenario id must be unique`);
  ids.add(spec.id);
  assert.ok(spec.learningObjectives?.length >= 3, `${file}: needs at least 3 learning objectives`);
  assert.ok(spec.commonMisconceptions?.length >= 3, `${file}: needs at least 3 misconceptions`);
  assert.ok(spec.reflectionQuestions?.length >= 2, `${file}: needs at least 2 reflection questions`);
  assert.ok(spec.sources?.length >= 1, `${file}: needs an official source`);
  for (const source of spec.sources) {
    assert.ok(source.agency && source.title, `${file}: source needs agency and title`);
    assert.match(source.url, /^https:\/\//, `${file}: source must be a secure direct URL`);
  }
  assert.ok(spec.nodes?.length >= 2, `${file}: needs multiple causal decision stages`);
  assert.ok(spec.nodes.some(node => Object.values(node.hazards || {}).some(hazard => hazard.terminal)), `${file}: needs a genuine failure path`);
  assert.ok(spec.nodes.some(node => node.terminal), `${file}: needs an explicit physical outcome`);
  const actionIds = new Set(spec.actions.map(action => action.id));
  for (const node of spec.nodes) {
    for (const id of [...node.required, ...(node.optional || []), ...node.available]) {
      assert.ok(actionIds.has(id), `${file}/${node.id}: unknown action ${id}`);
    }
    for (const hazardId of Object.keys(node.hazards || {})) {
      assert.ok(node.available.includes(hazardId), `${file}/${node.id}: hazard must be available to the user`);
    }
  }
}

console.log(`PASS ${files.length} v3 scenarios meet education, source, branching, and outcome contracts`);
