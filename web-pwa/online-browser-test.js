// Test-only provider doubles verify wiring; these are not GPT quality evaluations.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { ConversationCoach } = require('../online-coach/coach');
const { createServer } = require('../online-coach/server');
(async()=>{
  let failOnce = true;
  const provider = { ready:true, model:'test-double', async generate(stage,payload) {
    if(stage==='interpret'&&payload.text==='暫時故障'&&failOnce){failOnce=false;throw new Error('test-only failure');}
    if(stage==='interpret') return {value:{intent:payload.text.includes('嗎')?'question':'action',understanding:payload.text,question:'',needsClarification:false,
      actions:payload.text==='我把房門帶上'?[{id:'close',evidence:payload.text}]:payload.text==='我搭電梯'?[{id:'elevator',evidence:payload.text}]:[]}};
    return {value:{reply:`測試替身回覆：${payload.text}。此文字只測接線，不代表 GPT 品質。`,sourceIds:[]}};
  }};
  const coach=new ConversationCoach(provider); const server=createServer(coach);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({executablePath:process.env.POCKETKB_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:375,height:812},reducedMotion:'reduce'});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/online.html');
    await page.locator('#onlineScenario option').nth(5).waitFor({state:'attached'});
    await page.locator('#onlineStart').click();await page.locator('#onlineInput').waitFor();
    const send=async(text)=>{await page.locator('#onlineInput').fill(text);await page.locator('#onlineSend').click();await page.locator('#onlineSend:not([disabled])').waitFor();};
    await send('可以解釋嗎');assert.match(await page.locator('.judge-box').innerText(),/可以解釋嗎/);
    assert.equal(await page.locator('#onlineInput').inputValue(),'');
    await send('暫時故障');
    assert.match(await page.locator('.online-reply').first().innerText(),/我收到你說的/);
    await page.getByText('目前使用離線判讀',{exact:true}).waitFor();
    assert.equal(await page.locator('#onlineInput').inputValue(),'');
    await send('我把房門帶上');assert.match(await page.locator('.task-box').innerText(),/119/);
    const session=[...coach.sessions.values()][0];assert.equal(session.state.node,1);assert.equal(session.history.length,6);
    for(const viewport of [{width:320,height:640},{width:812,height:375},{width:1280,height:900}]){
      await page.setViewportSize(viewport);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`horizontal overflow ${viewport.width}`);
    }
    await page.setViewportSize({width:375,height:812});
    await page.addStyleTag({content:'body{font-size:24px}'});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    fs.mkdirSync(path.join(__dirname,'test-results'),{recursive:true});
    await page.screenshot({path:path.join(__dirname,'test-results','online-test-double.png'),fullPage:true});
    // Keep the test profile open within this page only; next scenario starts after confirmed leave.
    page.on('dialog',dialog=>dialog.accept());await page.locator('#onlineRestart').click();
    await page.locator('#onlineStart').click();await page.locator('#onlineInput').waitFor();
    await page.locator('#onlineInput').fill('我搭電梯');await page.locator('#onlineSend').click();
    await page.locator('.fire-review').waitFor();assert.equal(await page.locator('#onlineInput').count(),0);
    assert.ok(await page.getByRole('link',{name:/火災發生時之逃生狀況及方法/}).first().isVisible());
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pocketkb-online-records')).length),1);
    assert.deepEqual(errors,[]);
    await page.locator('#onlineRestart').click();
    await page.locator('#onlineStart').click();
    const transportFault = route => route.abort('internetdisconnected');
    await page.route('**/turn',transportFault);
    await send('我把房門關好');
    await page.getByText('目前使用離線判讀',{exact:true}).waitFor();
    assert.match(await page.locator('.task-box').innerText(),/119/);
    await page.unroute('**/turn',transportFault);
    await send('我撥119求救');
    assert.match(await page.locator('.judge-box').innerText(),/已記住/);
    assert.equal([...coach.sessions.values()].at(-1).revision,0);
    await page.locator('#onlineRestart').click();
    coach.provider={ready:false,model:'unconfigured'};
    await page.locator('#onlineStart').click();
    await send('我把房門關好');
    await page.getByText('目前使用離線判讀',{exact:true}).waitFor();
    assert.match(await page.locator('.task-box').innerText(),/119/);
    console.log('PASS online browser: six scenarios, upstream failure, local transport fallback and next turn, semantic wiring, responsive layouts, terminal lock, unique record, missing-key rules. Model provider is a test double.');
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
