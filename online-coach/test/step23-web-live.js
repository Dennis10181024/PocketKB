'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const {ConversationCoach,createOpenAIProvider} = require('../coach');
const {createServer} = require('../server');

async function run(directory,output,mode,limitText) {
  assert.ok(directory && output && process.env.OPENAI_API_KEY,'需要截圖路徑、紀錄路徑和環境金鑰。');
  fs.mkdirSync(directory,{recursive:true});
  let calls = 0;
  const limit = Number(limitText || 60);
  assert.ok(Number.isInteger(limit) && limit>=1 && limit<=60);
  const provider=createOpenAIProvider({apiKey:process.env.OPENAI_API_KEY,model:process.env.OPENAI_MODEL,
    fetchImpl:(...args)=>{if(calls>=limit) throw new Error('CAP');calls++;return fetch(...args);}});
  const coach=new ConversationCoach(provider,{maxCalls:limit});
  const server=createServer(coach);
  const results=[];
  const tokens=[];
  let browser;
  try {
    await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
    browser=await chromium.launch({executablePath:process.env.POCKETKB_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
    const page=await browser.newPage({viewport:{width:430,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});
    await page.goto('http://127.0.0.1:'+server.address().port+'/online.html');
    await page.locator('#onlineScenario option').nth(5).waitFor({state:'attached'});
    await page.evaluate(()=>{window.recordedTurns=[];document.addEventListener('pocketkb-turn',event=>window.recordedTurns.push(event.detail));});
    const capture=name=>page.screenshot({path:path.join(directory,name+'.png'),fullPage:true});
    const start=async()=>{await page.locator('#onlineStart').click();await page.locator('#onlineInput').waitFor();};
    const send=async(text,ending=false)=>{
      await page.locator('#onlineInput').fill(text);
      await page.locator('#onlineSend').click();
      await page.locator(ending?'.fire-review':'#onlineSend:not([disabled])').waitFor({timeout:17000});
      const {result,...timing} = await page.evaluate(()=>window.recordedTurns.at(-1));
      results.push({text,...timing,state:result.state?.node,actions:result.decision?.actionIds,
        kind:result.kind,ending:result.ending,offline:result.offline,narration:result.narration});
      console.log(text,timing.first,timing.complete,calls,result.kind);
    };
    const finish=async(called=false)=>{
      for(const action of [...(called?[]:['我撥119']),'我告知地址A棟宿舍','我回報五樓503室','我等待救援']) await send(action);
      await send('我保持通訊並依消防人員指示',true);
    };
    if (mode==='timings') {
      await start();
      await send('小岑，先別開門。');
      await send('我關門');
      await send('我撥119');
      await send('如果打開房門會有風險嗎？');
      await page.getByText('接線員說：',{exact:false}).waitFor();await capture('05-question');
      await finish(true);
      assert.equal(results.at(-1).ending.injury,'無傷');
      await capture('08-success-review');
      return;
    }
    await capture('01-reminder');
    await start();await capture('02-round');
    await page.locator('#onlineHint').click();
    await page.getByText('可以試著這樣說',{exact:true}).waitFor();await capture('03-hints');
    await send('小岑，先別開門。');await send('我關門');
    await page.getByText('警示：走廊煙變濃',{exact:true}).waitFor();await capture('04-escalation');
    await send('我撥119');await send('如果打開房門會有風險嗎？');
    await page.getByText('接線員說：',{exact:false}).waitFor();await capture('05-question');
    await finish(true);
    assert.equal(results.at(-1).ending.injury,'無傷');await capture('08-success-review');
    await page.locator('#onlineRestart').click();await start();
    await send('我搭電梯',true);
    assert.equal(results.at(-1).ending.injury,'傷勢不評定');await capture('06-critical');
    await page.locator('#onlineRestart').click();await start();
    await send('我徒手抓住熱門把');await send('我關門');await finish();
    assert.equal(results.at(-1).ending.injury,'輕傷');
    assert.ok(results.at(-1).ending.causes.length);await capture('07-injury');

    // Two fresh sessions, same model, same input order and starting state. Usage is API-reported.
    for(const compactNarration of [false,true]) {
      const trial=new ConversationCoach(provider,{compactNarration,maxCalls:18});
      let session=trial.create('drill_fire_dorm');
      for(const text of ['我關門','我撥119','我告知地址A棟宿舍']) {
        const result=await trial.turn(session.sessionId,{revision:session.revision,text,requestId:'bench-step23-'+session.revision});
        tokens.push({compactNarration,text,usage:result.narrationUsage || [],actions:result.decision.actionIds});
        session=result;
      }
    }
  } finally {
    fs.writeFileSync(output,JSON.stringify({model:provider.model,calls,results,tokens},null,2));
    if (browser) await browser.close();
    if(server.listening) await new Promise(resolve=>server.close(resolve));
  }
}
run(...process.argv.slice(2)).catch(error=>{console.error(error.message);process.exitCode=1;});
