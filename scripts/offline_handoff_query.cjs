'use strict';
// Handoff-only lexical retrieval example; no networking, model, or product changes.
const fs = require('node:fs');
const path = require('node:path');
const base = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(base, 'data', name), 'utf8').replace(/^\uFEFF/, ''));
const corpus = read('android-knowledge-public-reference.json').chunks;
const sources = new Map(read('android-sources.json').sources.map(s => [s.id, s]));
const stops = new Set(['的','了','我','你','他','她','它','是','在','有','和','與','就','都','也','要','會','先','再','並','或','及','可以']);
function tokenize(value) {
  const text = value.toLowerCase();
  // Split on CJK and all non letters/digits. Keep runs of Latin/numeric text.
  const words = []; let word = '';
  for (const char of text) {
    if (/[\p{L}\p{N}]/u.test(char) && !/[\u4e00-\u9fff]/u.test(char)) word += char;
    else if (word) { words.push(word); word = ''; }
  }
  if (word) words.push(word);
  const cjk = [...text].filter(c => /[\u4e00-\u9fff]/u.test(c));
  const bigrams = cjk.slice(1).map((c, i) => cjk[i] + c);
  return [...new Set([...words, ...cjk, ...bigrams])].filter(t => !stops.has(t));
}
const docs = corpus.map(chunk => {
  const source = sources.get(chunk.sourceId);
  return new Set(tokenize(`${chunk.title} ${chunk.content} ${chunk.tags.join(' ')} ${source.agency} ${source.title}`));
});
const avg = docs.reduce((sum, doc) => sum + doc.size, 0) / Math.max(1, docs.length);
const df = new Map();
for (const doc of docs) for (const token of doc) df.set(token, (df.get(token) || 0) + 1);
const query = process.argv.slice(2).join(' ');
const terms = tokenize(query);
const hits = corpus.map((chunk, index) => {
  let score = 0;
  const matchedTerms = terms.filter(t => docs[index].has(t));
  for (const term of matchedTerms) {
    const idf = Math.log((docs.length - df.get(term) + .5) / (df.get(term) + .5) + 1);
    score += idf * 2.5 / (1 + 1.5 * (.25 + .75 * docs[index].size / avg));
  }
  return {chunkId: chunk.id, title: chunk.title, content: chunk.content, score, matchedTerms,
    sourceIds: [chunk.sourceId], source: sources.get(chunk.sourceId), reviewStatus: chunk.reviewStatus, index};
}).filter(h => h.score > 0).sort((a,b) => b.score-a.score || a.index-b.index).slice(0,3)
  .map(({index, ...hit}) => hit);
process.stdout.write(JSON.stringify({status: hits.length ? 'hits' : 'no_match',
  retrieverVersion: 'handoff-lexical-example-1', corpus: 'public-reference-16-unreviewed',
  query, note: 'Original text retrieval only; not a generated safety answer or validated vector RAG.', hits}, null, 2) + '\n');
