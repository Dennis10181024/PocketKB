// Run with NODE_PATH pointing to a Playwright installation. Uses a fresh headless profile, not user data.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.POCKETKB_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try {
    const context=await browser.newContext({viewport:{width:375,height:812},reducedMotion:'reduce'});
    const page=await context.newPage();
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:5173/');
    await page.getByRole('button',{name:'開始練習',exact:true}).click();
    await page.getByRole('button',{name:'觀察環境',exact:true}).click();
    await page.getByRole('button',{name:'給我下一層提示',exact:true}).click();
    assert.equal(await page.locator('#actionInput').inputValue(),'');
    const send=async text=>{await page.locator('#actionInput').fill(text);await page.locator('#submitBtn').click();};
    await send('我不關門，不塞門縫，也不打119');
    assert.match(await page.locator('.judge-box').innerText(),/需要釐清/);
    await page.getByLabel('詢問',{exact:true}).check();
    await send('為什麼不能搭電梯？');
    assert.match(await page.locator('.judge-box').innerText(),/詢問/);
    await page.getByLabel('採取行動',{exact:true}).check();
    await send('我關門');
    await send('我撥119');
    await send('我告知地址A棟宿舍');
    await send('我回報五樓503室');
    await send('我等待救援');
    await send('我保持通訊並依消防人員指示');
    assert.match(await page.locator('.fire-review').innerText(),/完成 3\/3/);
    assert.equal(await page.locator('#submitBtn').count(),0);
    const records=await page.evaluate(()=>JSON.parse(localStorage.getItem('pocketkb-records')));
    assert.equal(records.length,1);
    const output=path.join(__dirname,'test-results');fs.mkdirSync(output,{recursive:true});
    await page.screenshot({path:path.join(output,'fire-mobile-complete.png'),fullPage:true});
    for (const viewport of [{width:375,height:812},{width:812,height:375},{width:1280,height:900}]) {
      await page.setViewportSize(viewport);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${viewport.width}`);
    }
    await page.getByRole('button',{name:'另開一次練習'}).click();
    await send('我搭電梯');
    assert.equal(await page.locator('#submitBtn').count(),0);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('pocketkb-records')).length),2);
    await page.evaluate(()=>navigator.serviceWorker.ready);
    await page.reload();
    await page.getByRole('button',{name:'開始練習',exact:true}).waitFor();
    await context.setOffline(true);
    await page.reload();
    await page.getByRole('button',{name:'開始練習',exact:true}).click();
    await send('我關門');
    assert.match(await page.locator('.task-box').innerText(),/模擬聯絡119/);
    await page.setViewportSize({width:375,height:812});
    await page.screenshot({path:path.join(output,'fire-mobile-active.png'),fullPage:true});
    await page.locator('#actionInput').fill('尚未送出的文字');
    await page.getByRole('button',{name:'觀察環境',exact:true}).click();
    assert.equal(await page.locator('#actionInput').inputValue(),'尚未送出的文字');
    assert.deepEqual(errors,[]);
    console.log('PASS browser: mobile complete, question, negative, partial, failure, unique records, 3 widths, offline reload, retained draft, no page errors');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
