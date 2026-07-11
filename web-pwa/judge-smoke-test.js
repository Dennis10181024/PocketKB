const fs = require("fs");
const vm = require("vm");
const path = require("path");

const appJs = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");
const context = {
  console,
  localStorage: {
    getItem: () => "[]",
    setItem: () => {},
    removeItem: () => {}
  },
  document: {
    querySelector: () => ({
      innerHTML: "",
      addEventListener: () => {},
      scrollTop: 0,
      scrollHeight: 0,
      value: "",
      textContent: ""
    }),
    querySelectorAll: () => []
  },
  navigator: {},
  window: { isSecureContext: false },
  alert: () => {}
};

vm.createContext(context);
vm.runInContext(`${appJs}
globalThis.__test = {
  scenarios,
  state,
  evaluateUserAction
};`, context);

const { scenarios, state, evaluateUserAction } = context.__test;
const fire = scenarios.find((scenario) => scenario.id === "drill_fire_dorm");
const underpass = scenarios.find((scenario) => scenario.id === "drill_typhoon_underpass");

const cases = [
  {
    name: "fire off-topic stays unrelated",
    scenario: fire,
    step: 1,
    input: "我要打電話去麥當勞訂漢堡",
    progress: 0,
    outcome: "CONTINUE",
    reasonIncludes: "沒有明確關聯"
  },
  {
    name: "fire step1 door check advances",
    scenario: fire,
    step: 1,
    input: "我先用手背摸門把確認溫度，再看門縫有沒有濃煙",
    progress: 1,
    outcome: "CONTINUE",
    reasonIncludes: "動作有效"
  },
  {
    name: "fire elevator fails",
    scenario: fire,
    step: 1,
    input: "我搭電梯下樓逃生",
    progress: 0,
    outcome: "FAILED",
    safety: "FAILED",
    reasonIncludes: "致命錯誤"
  },
  {
    name: "fire signal only is partial",
    scenario: fire,
    step: 2,
    input: "我要用音響大聲播放音樂吸引注意",
    progress: 0,
    outcome: "CONTINUE",
    reasonIncludes: "還不是完整逃生待救策略",
    verdictLabel: "有創意但需補強"
  },
  {
    name: "fire creative plus call still needs supplement",
    scenario: fire,
    step: 2,
    input: "我要用音響播放音樂吸引注意，並打119求救",
    progress: 0,
    outcome: "CONTINUE",
    reasonIncludes: "創意做法可作為輔助",
    verdictLabel: "有創意但需補強"
  },
  {
    name: "fire call only misses smoke blocking",
    scenario: fire,
    step: 2,
    input: "我要打119求救",
    progress: 0,
    outcome: "CONTINUE",
    reasonIncludes: "還缺"
  },
  {
    name: "fire smoke block and location advances",
    scenario: fire,
    step: 2,
    input: "我關門，用衣物塞門縫阻煙，到窗邊打119說明五樓房號",
    progress: 1,
    outcome: "CONTINUE",
    reasonIncludes: "已涵蓋"
  },
  {
    name: "underpass negated entry advances",
    scenario: underpass,
    step: 1,
    input: "我不進地下道，先停下並避開積水入口",
    progress: 1,
    outcome: "CONTINUE",
    reasonIncludes: "動作有效"
  },
  {
    name: "underpass risky run does not advance",
    scenario: underpass,
    step: 1,
    input: "我快跑穿過地下道試試看",
    progress: 0,
    outcome: "CONTINUE",
    reasonIncludes: "危險"
  },
  {
    name: "underpass ride through fails",
    scenario: underpass,
    step: 1,
    input: "我騎車衝過去，應該一下就到了",
    progress: 0,
    outcome: "FAILED",
    safety: "FAILED",
    reasonIncludes: "致命錯誤"
  },
  {
    name: "underpass final report succeeds",
    scenario: underpass,
    step: 3,
    input: "我提醒旁人不要進入，並通報1999和學校這個危險地點",
    progress: 1,
    outcome: "SUCCESS",
    reasonIncludes: "放棄穿越積水區"
  }
];

for (const testCase of cases) {
  state.currentStep = testCase.step;
  const result = evaluateUserAction(testCase.scenario, testCase.input);
  assertEqual(testCase.name, "progress", result.progressDelta, testCase.progress);
  assertEqual(testCase.name, "outcome", result.outcome, testCase.outcome);
  if (testCase.safety) assertEqual(testCase.name, "safety", result.safety, testCase.safety);
  if (testCase.verdictLabel) assertEqual(testCase.name, "verdictLabel", result.verdictLabel, testCase.verdictLabel);
  if (!result.reason.includes(testCase.reasonIncludes)) {
    throw new Error(`${testCase.name} reason mismatch. Expected to include ${testCase.reasonIncludes}; got: ${result.reason}`);
  }
  console.log(`PASS ${testCase.name}: ${result.reason}`);
}

function assertEqual(name, field, actual, expected) {
  if (actual !== expected) {
    throw new Error(`${name} ${field} mismatch. Expected ${expected}; got ${actual}`);
  }
}

