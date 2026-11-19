const assert = require('node:assert/strict');
const engine = require('./scenario-engine-v3');
const trappedHome = require('./scenarios/v3/earthquake-home-trapped.json');
const barrierLake = require('./scenarios/v3/barrier-lake-downstream.json');
const earthquakeSchool = require('./scenarios/v3/earthquake-school.json');
const floodHome = require('./scenarios/v3/flood-low-home.json');
const landslideRoad = require('./scenarios/v3/landslide-mountain-road.json');

let state = engine.create(trappedHome);
for (const text of [
  '我先檢查自己的傷口和周遭環境',
  '我不強行搬動倒塌物',
  '我傳送目前地址和受困位置',
  '我關閉非必要程式來節省手機電量',
  '我敲擊管線發出求救訊號',
  '我控制飲水並減少活動保存體力',
]) {
  state = engine.step(trappedHome, state, text).state;
}

assert.equal(state.sessionStatus, 'COMPLETED');
assert.equal(state.physicalStatus, 'WAITING_RESCUE');
assert.equal(state.completionKind, 'SURVIVAL_STABILIZED');
assert.notEqual(state.physicalStatus, 'EVACUATED');
assert.notEqual(state.physicalStatus, 'RESCUED');

let depleted = engine.create(trappedHome);
depleted = engine.step(trappedHome, depleted, '我先檢查自己的傷口和周遭環境').state;
depleted = engine.step(trappedHome, depleted, '我不強行搬動倒塌物').state;
depleted = engine.step(trappedHome, depleted, '我持續直播等待救援').state;
const blockedContact = engine.step(trappedHome, depleted, '我傳送受困位置');
assert.equal(depleted.resources.battery, 5);
assert.equal(blockedContact.kind, 'blocked');
assert.equal(blockedContact.state.node, 'contact');
assert.equal(blockedContact.state.accepted.includes('send_location'), false);

const untouched = engine.create(barrierLake);
const nonsense = engine.step(barrierLake, untouched, '我今天晚餐想吃拉麵');
assert.equal(nonsense.kind, 'clarify');
assert.deepEqual(nonsense.state, {...untouched,elapsed:1,consecutiveQuestions:0});
const conflict = engine.step(barrierLake, untouched, '我立即沿東側指定路線撤離，但我先繼續收拾行李');
assert.equal(conflict.kind, 'clarify');
assert.deepEqual(conflict.state, {...untouched,elapsed:1,consecutiveQuestions:0});

let delayed = engine.create(barrierLake);
const delayResult = engine.step(barrierLake, delayed, '我先繼續收拾行李和財物');
assert.equal(delayResult.kind, 'environment_change');
assert.equal(delayResult.state.node, 'cutoff');
assert.equal(delayResult.state.facts.eastRouteOpen, false);
assert.match(delayResult.message, /撤離窗口關閉/);
delayed = delayResult.state;
for (const text of [
  '我前往公告的就近垂直避難點',
  '我回報目前位置與受困人數',
  '我留在避難點等待並節省物資電量',
]) delayed = engine.step(barrierLake, delayed, text).state;
assert.equal(delayed.physicalStatus, 'WAITING_RESCUE');
assert.equal(delayed.completionKind, 'SURVIVAL_STABILIZED');

function run(spec, turns) {
  let current = engine.create(spec);
  for (const turn of turns) current = engine.step(spec, current, turn).state;
  return current;
}

const schoolSafe = run(earthquakeSchool, [
  '我立刻趴下並躲到桌下掩護頭頸抓穩桌腳',
  '我等待搖晃停止再行動',
  '我聽從老師指示走樓梯疏散',
  '我到集合點接受點名而且不返回教室',
]);
assert.equal(schoolSafe.physicalStatus, 'EVACUATED');

const schoolFailed = engine.step(earthquakeSchool, engine.create(earthquakeSchool), '我在搖晃時衝去搭電梯');
assert.equal(schoolFailed.state.sessionStatus, 'FAILED');
assert.equal(engine.step(earthquakeSchool, schoolFailed.state, '我趴下').kind, 'locked');
const schoolDebrief = engine.review(earthquakeSchool, schoolFailed.state);
assert.match(schoolDebrief, /學習目標/);
assert.match(schoolDebrief, /趴下、掩護、穩住/);
assert.match(schoolDebrief, /危險決策/);
assert.match(schoolDebrief, /搖晃時衝向電梯/);
assert.match(schoolDebrief, /需要補強/);
assert.match(schoolDebrief, /反思問題/);

const floodWaiting = run(floodHome, [
  '我不進地下室也不下樓搶救車子',
  '我在安全可及的情況下關閉總電源',
  '我移動到二樓以上的高處垂直避難',
  '我回報目前地址和受困位置',
  '我節省飲水電量和體力等待救援',
]);
assert.equal(floodWaiting.physicalStatus, 'WAITING_RESCUE');

const landslideSafe = run(landslideRoad, [
  '我確認官方土石流警戒和道路封閉資訊',
  '我立刻在安全地點迴轉，不穿越警戒區',
  '我改走官方公告的替代路線前往避難處所',
]);
assert.equal(landslideSafe.physicalStatus, 'EVACUATED');

for (const [spec, labels, expected] of [
  [earthquakeSchool, ['趴下、掩護、穩住', '等待主要搖晃停止', '依教師指示走安全樓梯疏散', '至集合點點名且不返回'], 'EVACUATED'],
  [trappedHome, ['確認傷勢與周遭危險', '不強行搬動大型倒塌物', '傳送位置與受困資訊', '節省手機電量並定時查看訊息', '製造容易被救援人員辨識的訊號', '控制飲水與體力消耗'], 'WAITING_RESCUE'],
  [floodHome, ['不進入地下室或搶救車輛', '安全可及時關閉總電源', '移動到較高樓層垂直避難', '回報地址與受困位置', '節省飲水、電量與體力'], 'WAITING_RESCUE'],
  [landslideRoad, ['確認官方警戒與封路資訊', '在安全點立即迴轉', '採用官方替代路線前往避難處所'], 'EVACUATED'],
  [barrierLake, ['確認官方撤離命令與指定路線', '立即沿東側指定路線撤往高地'], 'EVACUATED'],
]) {
  const guided = run(spec, labels);
  assert.equal(guided.physicalStatus, expected, `${spec.id} guided labels must be executable`);
}

console.log('PASS trapped, evacuation, failure lock, resource limits, changing routes, and guided labels');
