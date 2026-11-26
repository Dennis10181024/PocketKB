'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repo = path.resolve(__dirname, '../..');
const draft = fs.readFileSync(path.join(repo, 'docs/experiment/KNOWLEDGE_TEST_DRAFT.md'), 'utf8');
const letters = '甲乙丙丁';
const trim = text => text.replace(/[\p{P}\s]/gu, '');

test('knowledge draft has 30 four-option items, rationales and stem variants with length audit', () => {
  const questions = draft.split(/(?=^### \d{2}｜)/mu).slice(1);
  assert.equal(questions.length, 30);
  const totals = [[], []];
  const answerCounts = new Map();
  for (const body of questions) {
    const title = body.split(/\r?\n/u)[0];
    const options = [...body.matchAll(/^- ([甲乙丙丁])　(.+)$/gmu)];
    const rationales = [...body.matchAll(/^- ([甲乙丙丁])｜(.+)$/gmu)];
    const answer = body.match(/主持人答案為 \*\*([甲乙丙丁])\*\*。.*依據 /u)?.[1];
    assert.equal(options.map(row => row[1]).join(''), letters, title);
    assert.equal(new Set(options.map(row => trim(row[2]))).size, 4, title);
    assert.ok(answer, title);
    assert.equal(rationales.map(row => row[1]).sort().join(''), [...letters].filter(letter => letter !== answer).sort().join(''), title);
    assert.deepEqual([...body.matchAll(/^- ([AB]) 版：./gmu)].map(row => row[1]), ['A', 'B'], title);
    answerCounts.set(answer, (answerCounts.get(answer) ?? 0) + 1);
    for (const [mode, measure] of [text => text, trim].entries()) {
      const lengths = options.map(row => [...measure(row[2])].length);
      const best = lengths[letters.indexOf(answer)];
      totals[mode].push([best === Math.max(...lengths), best === Math.min(...lengths),
        Math.max(...lengths) - Math.min(...lengths)]);
    }
  }

  assert.deepEqual([...answerCounts.values()].sort((a, b) => a - b), [7, 7, 8, 8]);
  const percent = count => count + '/30（' + (count / 30 * 100).toFixed(1) + '%）';
  const modes = ['含標點，排除選項代號', '排除標點、空白與選項代號'];
  for (const [index, mode] of modes.entries()) {
    const set = totals[index];
    const longest = set.filter(row => row[0]).length;
    const shortest = set.filter(row => row[1]).length;
    const spread = Math.max(...set.map(row => row[2]));
    assert.ok(longest <= 10 && shortest <= 10 && spread <= 5, mode);
    assert.ok(draft.includes('| ' + mode + ' | ' + percent(longest) + ' | ' + percent(shortest) + ' | ' + spread + ' 字 |'));
  }
});

test('knowledge stems and options are distinct from the current choice pack text', () => {
  const folder = path.join(repo, 'web-pwa/scenarios/choice');
  const { packs } = require(path.join(folder, 'manifest.json'));
  const originals = packs.flatMap(row => require(path.join(folder, row.file)).decisions.flatMap(decision =>
    [decision.prompt, ...decision.options.map(option => option.text)]));
  const known = new Set(originals.map(trim));
  const written = [...draft.matchAll(/^- (?:[AB] 版：|[甲乙丙丁]　)(.+)$/gmu)];
  assert.equal(written.length, 180);
  assert.deepEqual(written.map(row => trim(row[1])).filter(text => known.has(text)), []);
});
