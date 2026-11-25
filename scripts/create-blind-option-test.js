'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const directory = path.resolve(__dirname, '../web-pwa/scenarios/choice');
const titles = ['宿舍火災', '學校地震', '捷運車廂', '低窪住宅淹水', '颱風停電'];
const files = ['fire-dorm', 'earthquake-school', 'metro-attack-draft', 'flood-low-home-draft', 'typhoon-outage-draft'];

function shuffle(options, salt) {
  return options.map((option, index) => ({
    option, order: createHash('sha256').update(salt + ':' + index).digest('hex')
  })).sort((a, b) => a.order.localeCompare(b.order)).map(row => row.option);
}

function generate() {
  const quiz = [
    '# PocketKB 選擇題盲測題本', '', '草稿，待人工審查。僅供組員試答。', '',
    '各題以當下資訊選一項最適合的做法，在答案欄填 A、B、C 或 D。可跳過任何題目。看完題本前請先不要試玩或查看答案。捷運一節涉及突發攻擊與人群恐慌，若感到不安可跳過整節。', ''
  ];
  const key = [
    '# PocketKB 選擇題盲測答案與計分', '', '草稿，待人工審查。此檔由主持人保留，收卷後再公開。', '',
    '正確答計 1 分，其他有效選項計 0 分，空白、多選或跳過個別記錄。單題答對率＝答對人數 ÷ 該題有效作答人數。答對率嚴格大於 80% 的題目標記「可能太好猜」，剛好 80% 不標記。請同時列出有效樣本數，少量答卷僅提供修題線索。', '',
    '題本離開了互動時序；主持人可讓作答者圈出「靠文字外形猜到」的題，另記以前是否玩過正式題組。答對率用於修整選項，不代表訓練成效。', ''
  ];
  for (const [index, file] of files.entries()) {
    const pack = JSON.parse(fs.readFileSync(path.join(directory, file + '.json'), 'utf8'));
    quiz.push('## ' + titles[index], '');
    key.push('## ' + titles[index], '', '| 題次 | 答案 |', '| --- | --- |');
    for (const [number, decision] of pack.decisions.entries()) {
      const ordinal = index + 1 + '-' + (number + 1);
      const options = shuffle(decision.options, file + ':blind-v1:' + number);
      quiz.push('### ' + ordinal + '　' + decision.prompt, '', ...options.map((option, optionIndex) =>
        '- ' + 'ABCD'[optionIndex] + '　' + option.text), '', '答案：＿＿', '');
      const letters = options.flatMap((option, optionIndex) => option.class === 'correct' ? ['ABCD'[optionIndex]] : []);
      key.push('| ' + ordinal + ' | ' + letters.join('、') + ' |');
    }
    key.push('');
  }
  return { quiz: quiz.join('\n'), key: key.join('\n') };
}

if (require.main === module) {
  const { quiz, key } = generate();
  const docs = path.resolve(__dirname, '../docs');
  fs.writeFileSync(path.join(docs, 'BLIND_OPTION_TEST.md'), '\uFEFF' + quiz);
  fs.writeFileSync(path.join(docs, 'BLIND_OPTION_TEST_KEY.md'), '\uFEFF' + key);
}
module.exports = { generate };
