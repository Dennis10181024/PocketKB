'use strict';

// Explicitly invoked development set. Never included in the model-double test suite.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { ConversationCoach, createOpenAIProvider, specs } = require('../coach');
const { createServer } = require('../server');
const engine = require('../../web-pwa/scenario-engine-v3');

async function main() {
  const [fixturePath, outputPath] = process.argv.slice(2);
  assert.ok(fixturePath && outputPath, '請指定開發集 JSON 與新 JSONL 路徑，或用 --check 只驗證基線');
  const cases = JSON.parse(await fs.readFile(fixturePath, 'utf8'));
  const source = (await fs.readFile('docs/DIAGNOSIS_GPT_STEP_07.jsonl', 'utf8')).trim().split(/\r?\n/).map(line => JSON.parse(line));
  assert.equal(cases.length, 20);
  for (const [category,count] of Object.entries({danger:8,correct:8,protected:4}))
    assert.equal(cases.filter(row => row.category === category).length,count);
  assert.equal(new Set(cases.filter(row => row.category === 'correct').map(row => row.scenario)).size,6);
  assert.equal(new Set(cases.map(row => row.text)).size, 20);
  for (const row of cases) {
    if (row.category !== 'correct')
      assert.ok(source.some(item => item.id === row.sourceId && item.scenario === row.scenario));
    const spec = specs.get(row.scenario);
    assert.ok(spec, row.scenario);
    const baseline = engine.step(spec,engine.create(spec),row.text);
    assert.equal(baseline.kind,'clarify',row.text);
    const node = spec.nodes.find(item => item.id === spec.initialNode);
    assert.equal(row.actionIds.length === 0,row.category === 'protected');
    assert.ok(row.actionIds.every(id => node.available.includes(id)),row.text);
    if (row.actionIds.length) {
      const state = engine.create(spec);
      const verdict = engine.validateProposal(spec,state,row.text,'action',
        row.actionIds.map(id => ({ id, evidence:row.text })),baseline);
      assert.ok(verdict.result, `${row.text}: ${verdict.error}`);
      assert.equal(['risk','failed'].includes(verdict.result.kind),row.category === 'danger',row.text);
      const adopted = engine.adoptedActionIds(state,verdict.result.state);
      assert.deepEqual([...adopted].sort(),[...row.actionIds].sort(),row.text);
    }
  }
  if (outputPath === '--check') {
    console.log(JSON.stringify({dataset:'development',ruleClarify:20,correctBaseline:8,correctScenarioCoverage:6,
      referenceDanger:8,referenceProtected:4,apiCalls:0}));
    return;
  }
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY 未設定，未送出任何請求。');

  const { chromium } = require('playwright');
  let upstreamStatus;
  const provider = createOpenAIProvider({apiKey:process.env.OPENAI_API_KEY,model:process.env.OPENAI_MODEL,
    fetchImpl: async (...args) => {
      const response = await fetch(...args);
      upstreamStatus = response.status;
      return response;
    }});
  const coach = new ConversationCoach(provider,{maxCalls:60});
  const server = createServer(coach);
  const browser = await chromium.launch({executablePath:process.env.POCKETKB_CHROME ||
    'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try {
    const out = await fs.open(outputPath,'wx');
    try {
      await new Promise((resolve,reject) => server.once('error',reject).listen(0,'127.0.0.1',resolve));
      const origin = `http://127.0.0.1:${server.address().port}`;
      const page = await browser.newPage();
      const rows = [];
      for (const row of cases) {
        upstreamStatus = undefined;
        await page.goto(origin+'/online.html');
        await page.locator('#onlineScenario option').nth(5).waitFor({state:'attached'});
        await page.locator('#onlineScenario').selectOption(row.scenario);
        await page.locator('#onlineStart').click();
        await page.locator('#onlineInput').fill(row.text);
        const [response] = await Promise.all([
          page.waitForResponse(res => res.url().endsWith('/turn') && res.request().method()==='POST'),
          page.locator('#onlineSend').click(),
        ]);
        const value = await response.json();
        assert.equal(response.ok(),true,`本機回合回傳 ${response.status()}`);
        await page.locator('.judge-box').waitFor();
        const offlineText = await page.getByText('目前使用離線判讀',{exact:true}).count() > 0;
        const dangerous = ['risk','failed'].includes(value.kind);
        const adopted = value.decision.actionIds;
        const exactActions = adopted.length === row.actionIds.length && row.actionIds.every(id => adopted.includes(id));
        const record = {...row,baseline:'clarify',kind:value.kind,decision:value.decision,
          upstreamStatus, fallbackReason:value.fallbackReason,modelInterpretation:value.interpretation,
          offline:value.offline,offlineText,dangerous,exactActions,reply:value.reply};
        rows.push(record);
        await out.write(JSON.stringify(record)+'\n');
        if ([401,403,404,429].includes(upstreamStatus)) {
          throw new Error(`實測停止：上游 HTTP ${upstreamStatus}，已呼叫 ${coach.calls} 次，成功完成 ${rows.filter(item=>!item.offline).length} 筆。`);
        }
      }
      const summary = {
        dataset:'development',cases:rows.length,calls:coach.calls,
        correctExecuted:rows.filter(row=>row.category==='correct' && row.exactActions && !row.dangerous).length,
        dangerDetected:rows.filter(row=>row.category==='danger' && row.dangerous).length,
        protectedMisexecuted:rows.filter(row=>row.category==='protected' && (!row.exactActions || row.dangerous)).length,
        correctFalseAlarm:rows.filter(row=>row.category==='correct' && row.dangerous).length,
        fallback:rows.filter(row=>row.offline).length,offlineIndicator:rows.filter(row=>row.offlineText).length,
      };
      await out.write(JSON.stringify({summary})+'\n');
      console.log(JSON.stringify(summary));
      assert.equal(summary.dangerDetected,8);
      assert.equal(summary.protectedMisexecuted + summary.correctFalseAlarm + summary.fallback + summary.offlineIndicator,0);
    } finally {
      await out.close();
    }
  } finally {
    await browser.close();
    if (server.listening) await new Promise(resolve=>server.close(resolve));
  }
}

main().catch(error=>{ console.error(error.message); process.exitCode=1; });
