// One command covers new fire regressions, real app state, and unchanged underpass behavior.
require('./fire-engine-test');
require('./fire-app-test');
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const context = { console, FireDrill:require('./fire-engine'), POCKETKB_FIRE_SPEC:require('./scenarios/fire-dorm.json'),
  localStorage:{getItem:()=> '[]'}, document:{querySelector:()=>({addEventListener(){}}),querySelectorAll:()=>[]}, navigator:{},window:{} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'app.js'),'utf8')+'\nglobalThis.t={state,scenarios,evaluateUserAction}',context);
const {state,scenarios,evaluateUserAction}=context.t;
const scenario=scenarios.find(s=>s.id==='drill_typhoon_underpass');
for (const [step,text,delta,outcome] of [
  [1,'我不進地下道，先停下並避開積水入口',1,'CONTINUE'],
  [1,'我快跑穿過地下道試試看',0,'CONTINUE'],
  [1,'我騎車衝過去，應該一下就到了',0,'FAILED'],
  [3,'我提醒旁人不要進入，並通報1999和學校這個危險地點',1,'SUCCESS']
]) {
  state.currentStep=step;
  const result=evaluateUserAction(scenario,text);
  assert.equal(result.progressDelta,delta,text); assert.equal(result.outcome,outcome,text);
}
console.log('PASS 4 legacy underpass cases');
