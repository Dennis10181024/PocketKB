'use strict';
const assert=require('node:assert/strict');
const {chromium}=require(process.env.POCKETKB_PLAYWRIGHT_MODULE||'playwright');
const {createServer}=require('../online-coach/server');
const {ConversationCoach}=require('../online-coach/coach');
const vectors=require('./scenarios/choice/test-vectors.json');

async function main(){
  const server=createServer(new ConversationCoach({ready:false,generate(){throw Error('Unexpected provider call');}}));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({executablePath:process.env.POCKETKB_CHROME||
      'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
    const context=await browser.newContext({viewport:{width:375,height:812}});
    const page=await context.newPage();
    const pageErrors=[], api=[];
    page.on('pageerror',error=>pageErrors.push(error.message));
    page.on('request',request=>{if(new URL(request.url()).pathname.startsWith('/api/'))api.push(request.url());});
    const base='http://127.0.0.1:'+server.address().port;
    const open=async id=>{
      await page.locator('[data-choice-pack="'+id+'"]').click();
      await page.getByText('演練中可能出現受傷的結果，你可以隨時停止。',{exact:true}).waitFor();
      await page.locator('#choice-start').click();
      await page.locator('.choice-option[data-choice-option]').first().waitFor();
    };
    const play=async(file,id)=>{
      const run=vectors.scenarios.find(row=>row.file===file).cases.find(row=>row.id===id);
      for(const option of run.choices)await page.locator('[data-choice-option="'+option+'"]').click();
    };
    await page.goto(base+'/');
    await page.locator('[data-choice-pack]').nth(1).waitFor();
    assert.equal(await page.locator('[data-choice-pack]').count(),2);
    assert.equal(await page.locator('a[href*="?scenario="]').count(),0);
    await page.getByText('演練設定',{exact:true}).click();
    await page.getByLabel('顯示舊版對話劇本').check();
    assert.equal(await page.locator('a[href*="?scenario="]').count(),4);
    await page.getByLabel('顯示舊版對話劇本').uncheck();
    assert.equal(await page.locator('a[href*="?scenario="]').count(),0);
    if(await page.getByLabel('顯示草稿情境').count()){
      await page.getByLabel('顯示草稿情境').check();
      await page.locator('[data-choice-pack="metro_attack_draft"]').click();
      await page.getByText(/包含突發攻擊/).waitFor();
      await page.getByRole('button',{name:'跳過此情境'}).click();
      await page.getByLabel('顯示草稿情境').uncheck();
      assert.equal(await page.locator('[data-choice-pack]').count(),2);
    }
    await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>undefined));
    await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
    await context.setOffline(true);
    await page.reload();
    await open('drill_fire_dorm');
    const options=await page.locator('[data-choice-option]').allTextContents();
    const before=await page.locator('#choice-question + p').innerText();
    await page.locator('#choice-observe').click();
    assert.match(await page.locator('.choice-inspection').innerText(),/門仍開著/);
    await page.locator('#choice-ask').click();
    assert.match(await page.locator('.choice-inspection').innerText(),/小岑/);
    assert.deepEqual(await page.locator('[data-choice-option]').allTextContents(),options);
    assert.equal(await page.locator('#choice-question + p').innerText(),before);
    for(const width of [320,375,812]){
      await page.setViewportSize({width,height:812});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      assert.ok((await page.locator('[data-choice-option]').first().boundingBox()).height>=48);
    }
    const beforeFatal=await page.locator('#choice-question + p').innerText();
    await play('fire-dorm.json','fatal');
    assert.match(await page.locator('#choice-heading').innerText(),/受困電梯/);
    assert.equal(await page.locator('.choice-grade').count(),0);
    await page.locator('#choice-retry').click();
    assert.equal(await page.locator('#choice-question + p').innerText(),beforeFatal);
    await play('fire-dorm.json','all-correct');
    assert.match(await page.locator('#choice-heading').innerText(),/獲救/);
    assert.match(await page.locator('.choice-grade').innerText(),/無傷/);
    await page.locator('#choice-reset').click();
    await open('earthquake_school');
    await play('earthquake-school.json','reckless');
    assert.match(await page.locator('.choice-grade').innerText(),/需住院/);
    for(const line of ['手臂擦傷','小腿撞傷','腳踝扭傷','小維｜手腕受傷'])
      assert.ok((await page.locator('.choice-drill').innerText()).includes(line));
    assert.deepEqual(pageErrors,[]);
    assert.deepEqual(api,[]);
    console.log('PASS choice PWA: mobile widths, legacy toggle, offline cold reload, observe, ask, fatal, retry, rescue, injuries, no API');
  }finally{
    await browser?.close();
    server.close();
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
