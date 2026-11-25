'use strict';
const assert = require('node:assert/strict');
const { mkdir, readFile } = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.POCKETKB_PLAYWRIGHT_MODULE || 'playwright');
const { serve, lanAddresses } = require('../scripts/play-server');
const { scenarios } = require('./scenarios/choice/test-vectors.json');

async function test() {
  const { server } = serve({ lan: lanAddresses().length > 0 });
  await new Promise(resolve => server.listen(0, lanAddresses().length ? '0.0.0.0' : '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const endpoint = base + '/play.html';
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: process.env.POCKETKB_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
      args: ['--no-proxy-server'], headless: true
    });
    if (process.argv.includes('--icons')) {
      const page = await browser.newPage();
      const svg = await readFile(path.join(__dirname, 'icon.svg'), 'utf8');
      await page.setContent('<style>html,body{margin:0;background:#172438}svg{width:100vw;display:block}</style>' + svg);
      for (const size of [192, 512]) {
        await page.setViewportSize({ width: size, height: size });
        await page.screenshot({ path: path.join(__dirname, 'play-icon-' + size + '.png') });
      }
      await page.close();
    }
    const context = await browser.newContext({
      viewport: { width: 402, height: 874 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true
    });
    const page = await context.newPage();
    const errors = [], api = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      if (new URL(request.url()).pathname.startsWith('/api/')) api.push(request.url());
    });
    const artifacts = path.resolve(__dirname, '../docs/ios-web-screens');
    if (process.argv.includes('--screens')) await mkdir(artifacts, { recursive: true });
    async function capture(name) {
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 402);
      assert.ok(await page.locator('.choice-drill button').evaluateAll(buttons => buttons.every(button =>
        parseFloat(getComputedStyle(button).fontSize) >= 16 && button.getBoundingClientRect().height >= 48
      )));
      if (process.argv.includes('--screens')) {
        await page.screenshot({ path: path.join(artifacts, name + '.png'), fullPage: true });
      }
    }
    await page.goto(endpoint);
    await page.waitForFunction(() => document.querySelector('#play-connectivity').textContent === '可離線遊玩');
    const install = await page.evaluate(async () => (await fetch('./play.webmanifest')).json());
    assert.equal(install.display, 'standalone');
    assert.equal(install.start_url, './play.html');
    assert.equal(await page.locator('#choice-legacy').count(), 0);
    await capture('01-情境清單');
    await context.setOffline(true);
    await page.reload();
    await page.locator('[data-choice-pack="earthquake_school"]').tap();
    await capture('02-內容提醒');
    await page.locator('#choice-start').tap();
    await page.locator('[data-choice-option]').first().waitFor();
    await capture('03-離線作答');
    const run = scenarios.find(row => row.file === 'earthquake-school.json').cases.find(row => row.id === 'reckless');
    for (const option of run.choices) await page.locator('[data-choice-option="' + option + '"]').tap();
    await capture('04-結局與回顧');
    assert.match(await page.locator('#play-root').innerText(), /傷勢清單/);
    assert.deepEqual(errors, []);
    assert.deepEqual(api, []);
    const privateHost = lanAddresses()[0];
    if (privateHost) {
      const lanPage = await (await browser.newContext()).newPage();
      await lanPage.goto('http://' + privateHost + ':' + server.address().port + '/play.html');
      assert.equal(await lanPage.evaluate(() => window.isSecureContext), false);
      assert.match(await lanPage.locator('#play-connectivity').innerText(), /保持 Wi-Fi 連線/);
      await lanPage.locator('[data-choice-pack="drill_fire_dorm"]').click();
      await lanPage.locator('#choice-start').click();
      await lanPage.locator('[data-choice-option]').first().waitFor();
      console.log('PASS plain LAN HTTP: digest verification without Web Crypto and a playable opening');
    }
    console.log('PASS phone Web 402×874: 16px/48px, content notice, offline reload, ending and review, zero API');
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}

test().catch(error => { console.error(error); process.exitCode = 1; });
