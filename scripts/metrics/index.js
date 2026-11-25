'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { analyze } = require('./analyze');

const attemptFields = ['sessionId', 'scenarioId', 'packVersion', 'packDigest', 'attempt', 'ending', 'injury',
  'answered', 'knownUnanswered', 'safeFirst', 'totalFirst', 'safetyRate', 'fatal', 'sessionFatalities', 'responseTimeMs', 'timedAnswers'];
const responseFields = ['sessionId', 'scenarioId', 'packVersion', 'packDigest', 'attempt', 'decisionId', 'occurrence', 'optionId',
  'displayOrderOptionIds', 'selectedPosition', 'responseTimeMs', 'backgroundTimeMs', 'observationTimeMs',
  'firstDecision', 'safety', 'fatal', 'ending', 'injury'];

function readLogs(filenames) {
  const rows = [];
  for (const filename of filenames) {
    const text = fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, '');
    for (const [index, line] of text.split(/\r?\n/).entries()) {
      if (!line.trim()) continue;
      try { rows.push(JSON.parse(line)); }
      catch { throw new Error(path.basename(filename) + ' 第 ' + (index + 1) + ' 列無法解析為 JSON。'); }
    }
  }
  return rows;
}

function cell(value) {
  if (value === null || value === undefined) return '';
  const raw = Array.isArray(value) ? value.join('|') : String(value);
  const safe = typeof value === 'string' && /^[\t\r\n =+@-]/u.test(raw) ? "'" + raw : raw;
  return '"' + safe.replaceAll('"', '""') + '"';
}

function csv(fields, rows) {
  return '\uFEFF' + [fields.join(','), ...rows.map(row => fields.map(field => cell(row[field])).join(','))].join('\r\n') + '\r\n';
}

function html({ summary, responses }) {
  const esc = text => String(text).replace(/[&<>"']/g, char =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const percent = number => number === null ? '無適用資料' : (100 * number).toFixed(1) + '%';
  const endLabels = { SAFE_RESCUE: '安全獲救', DELAYED_RESCUE: '延誤後獲救', SELF_EVACUATION: '自行撤離',
    DELAYED_EVACUATION: '延誤撤離', CRITICAL_FAILURE: '危急失敗', EXITED: '已退出', OPEN: '未觀察到結束' };
  const gradeLabels = { NONE: '無傷', MILD: '輕傷', MODERATE: '中度', SEVERE: '重傷', NOT_ASSESSED: '傷勢不評定' };
  const splitBy = new Map();
  for (const row of responses) {
    if (row.responseTimeMs === null) continue;
    const group = row.scenarioId + ' · ' + row.packVersion + (row.packDigest ? ' · ' + row.packDigest.slice(0, 8) : '');
    const phase = row.attempt === 1 ? '初次' : '重來';
    const groupKey = JSON.stringify([group, row.decisionId, phase]);
    const accumulated = splitBy.get(groupKey) ?? { group, phase, decision: row.decisionId, count: 0, total: 0 };
    accumulated.count++;
    accumulated.total += row.responseTimeMs;
    splitBy.set(groupKey, accumulated);
  }
  const timing = [...splitBy.values()].sort((a, b) =>
    a.group.localeCompare(b.group) || a.decision.localeCompare(b.decision) || a.phase.localeCompare(b.phase));
  const endingItems = Object.entries(summary.retryEndings).map(([value, count]) => {
    const [ending, grade] = value.split(' / ');
    return '<li>' + esc([endLabels[ending], gradeLabels[grade]].filter(Boolean).join(' · ')) + ' · ' + count + '</li>';
  }).join('');
  return '<!DOCTYPE html>\n<html lang="zh-Hant-TW"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>PocketKB 研究紀錄摘要</title><style>body{max-width:66rem;margin:2rem auto;padding:0 1rem;font:16px/1.65 system-ui;color:#182e2d}' +
    'table{border-collapse:collapse}td,th{border:1px solid #b9c7c5;padding:.35rem .55rem;text-align:left;overflow-wrap:anywhere}</style>' +
    '<h1>PocketKB 研究紀錄摘要</h1><p>草稿，待人工審查。統計取自匯入資料，資料來源與樣本性質需由主持人確認。</p>' +
    '<dl><dt>場次</dt><dd>' + summary.sessions +
    '</dd><dt>首次決策安全率</dt><dd>' + summary.safeFirst + '／' + summary.totalFirst + ' · ' + percent(summary.safetyRate) +
    '</dd><dt>致命錯誤次數</dt><dd>' + summary.fatalities +
    '</dd><dt>重來後完成率</dt><dd>' + summary.retryCompleted + '／' + summary.retryCount + ' · ' + percent(summary.retryRate) +
    '</dd><dt>有證據顯示已到達但沒答的題</dt><dd>' + summary.knownUnanswered +
    '</dd><dt>略過的非選擇題格式、去除的重複選擇</dt><dd>' + summary.ignored + '、' + summary.duplicateChoices +
    '</dd></dl><h2>重來後結局分布</h2>' + (endingItems ? '<ul>' + endingItems + '</ul>' : '<p>無重來紀錄。</p>') +
    '<h2>各題作答時間</h2><table><thead><tr><th>情境與版本</th><th>決策</th><th>階段</th><th>有效紀錄</th><th>平均（秒）</th></tr></thead><tbody>' +
    timing.map(row => '<tr><td>' + esc(row.group) + '</td><td>' + esc(row.decision) + '</td><td>' +
      row.phase + '</td><td>' + row.count + '</td><td>' + (row.total / (1000 * row.count)).toFixed(2) + '</td></tr>').join('') +
    '</tbody></table></html>\n';
}

function run(argv) {
  const index = argv.indexOf('--out');
  const out = index < 0 ? '' : argv[index + 1];
  const input = index < 0 ? argv : argv.filter((_value, i) => i !== index && i !== index + 1);
  if (!out || !input.length || input.some(name => name.startsWith('--'))) {
    throw new Error('用法：node scripts/metrics/index.js --out <輸出目錄> <JSONL 檔案> [其他 JSONL 檔案]');
  }
  const report = analyze(readLogs(input));
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'attempts.csv'), csv(attemptFields, report.attempts));
  fs.writeFileSync(path.join(out, 'responses.csv'), csv(responseFields, report.responses));
  fs.writeFileSync(path.join(out, 'summary.html'), html(report));
  return report.summary;
}

if (require.main === module) {
  try {
    const summary = run(process.argv.slice(2));
    console.log('已輸出 ' + summary.sessions + ' 個場次的統計。');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { run, readLogs, csv, html };
