'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { createHash } = require('node:crypto');
const { parseArgs, serve, lanAddresses } = require('../../scripts/play-server');
const sha256 = require('../../web-pwa/vendor/sha256.min.js');

test('localhost is the default and LAN/TLS require explicit arguments', () => {
  assert.deepEqual(parseArgs([]), { port: 4173 });
  assert.throws(() => parseArgs(['--host', '127.0.0.1']), /--lan/);
  assert.throws(() => parseArgs(['--cert', 'cert.pem']), /--key/);
  assert.throws(() => parseArgs(['--port', 'xyz']), /連接埠/);
  assert.equal(serve(parseArgs([])).listenHost, '127.0.0.1');
  if (lanAddresses().length) {
    assert.equal(serve(parseArgs(['--lan'])).listenHost, '0.0.0.0');
    const address = lanAddresses()[0];
    assert.equal(serve(parseArgs(['--lan', '--host', address])).listenHost, address);
  }
});

test('standalone play server serves only the boundary needed by offline choice play', async () => {
  const { server, listenHost } = serve(parseArgs([]));
  await new Promise(resolve => server.listen(0, listenHost, resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    const page = await fetch(base);
    assert.ok(page.url.endsWith('/play.html'));
    assert.match(await page.text(), /lang="zh-Hant-TW"/);
    const manifest = await (await fetch(base + '/scenarios/choice/manifest.json')).json();
    assert.ok(manifest.packs.length >= 5);
    for (const name of ['/online.html', '/api/health', '/.env', '/%2E%2E/online-coach/server.js',
      '/scenarios/choice/test-vectors.json', '/scenarios/choice/parity-v1.json']) {
      assert.equal((await fetch(base + name)).status, 404, name);
    }
    assert.equal((await fetch(base + '/play.html', { method: 'POST' })).status, 405);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('software SHA-256 used by plain LAN HTTP matches Node for every original pack file', () => {
  const folder = path.resolve(__dirname, '../../web-pwa/scenarios/choice');
  const { packs } = require(path.join(folder, 'manifest.json'));
  for (const item of packs) {
    const buffer = fs.readFileSync(path.join(folder, item.file));
    assert.equal(sha256.hex(new Uint8Array(buffer)), createHash('sha256').update(buffer).digest('hex'));
  }
});
