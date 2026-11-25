'use strict';

const http = require('node:http');
const https = require('node:https');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const makeQr = require('./vendor/qrcode.js');

const web = path.resolve(__dirname, '../web-pwa');
const folder = 'scenarios/choice/';
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8', '.png': 'image/png'
};
const policy = "default-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'";

function lanAddresses() {
  return [...new Set(Object.values(os.networkInterfaces()).flat().filter(address =>
    address?.family === 'IPv4' && !address.internal &&
    /^(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(address.address)
  ).map(address => address.address))];
}

function parseArgs(args) {
  const config = { port: 4173 };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--lan' || arg === '--open') config[arg.slice(2)] = true;
    else if (['--port', '--host', '--cert', '--key'].includes(arg) &&
      args[index + 1] && !args[index + 1].startsWith('--')) config[arg.slice(2)] = args[++index];
    else throw new Error('未知或缺少值的參數：' + arg);
  }
  if (!/^\d{1,5}$/.test(String(config.port)) || Number(config.port) > 65535) throw new Error('無效的連接埠');
  if (Boolean(config.cert) !== Boolean(config.key)) throw new Error('HTTPS 必須同時指定 --cert 和 --key');
  if (config.host && !config.lan) throw new Error('--host 必須與 --lan 一起使用');
  config.port = Number(config.port);
  return config;
}

function serve(config) {
  const publicFiles = new Set([
    'play.html', 'play.js', 'play.webmanifest', 'play-sw.js', 'play-icon-192.png', 'play-icon-512.png',
    'styles.css', 'vendor/sha256.min.js', 'choice-pack.js', 'choice-runtime.js', 'choice-view.js',
    folder + 'manifest.json', folder + 'schema-v1.json'
  ]);
  const catalog = JSON.parse(fs.readFileSync(path.join(web, folder + 'manifest.json'), 'utf8'));
  for (const entry of catalog.packs) {
    if (!/^[a-z0-9-]+\.json$/.test(entry.file)) throw new Error('情境檔名無效');
    publicFiles.add(folder + entry.file);
  }
  const network = lanAddresses();
  if (config.host && !network.includes(config.host)) throw new Error('請選擇這台電腦的私人區網 IPv4');
  if (config.lan && !network.length) throw new Error('找不到私人區網 IPv4，請先連上 Wi-Fi');
  const listenHost = config.lan ? config.host ?? '0.0.0.0' : '127.0.0.1';
  const transport = config.cert ? 'https' : 'http';
  const hosts = ['127.0.0.1', 'localhost', ...(config.lan ? (config.host ? [config.host] : network) : [])];
  const handler = (request, response) => {
    const hostsAtPort = hosts.map(host => host + ':' + server.address().port);
    const defaultPort = transport === 'https' ? 443 : 80;
    if (server.address().port === defaultPort) hostsAtPort.push(...hosts);
    if (!hostsAtPort.includes(request.headers.host)) return response.writeHead(403).end();
    const peer = request.socket.remoteAddress;
    if (peer !== '127.0.0.1' && !(config.lan && /^(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(peer))) {
      return response.writeHead(403).end();
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') return response.writeHead(405).end();
    const pathname = request.url.split('?')[0];
    if (pathname === '/') return response.writeHead(302, { Location: '/play.html' }).end();
    const relative = pathname.slice(1);
    if (!publicFiles.has(relative)) return response.writeHead(404).end();
    const filename = path.join(web, relative);
    fs.readFile(filename, (error, body) => {
      if (error) return response.writeHead(404).end();
      response.writeHead(200, {
        'Content-Type': types[path.extname(filename)], 'Content-Security-Policy': policy,
        'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer'
      }).end(request.method === 'HEAD' ? undefined : body);
    });
  };
  const server = config.cert ? https.createServer({
    cert: fs.readFileSync(config.cert), key: fs.readFileSync(config.key)
  }, handler) : http.createServer(handler);
  return { server, listenHost, transport, hosts };
}

function launchBrowser(url) {
  const binary = { win32: 'explorer.exe', darwin: 'open' }[process.platform] ?? 'xdg-open';
  const child = spawn(binary, [url], { stdio: 'ignore', detached: true });
  child.on('error', () => console.log('無法自動開啟瀏覽器，請手動開啟上述網址。'));
  child.unref();
}

if (require.main === module) {
  try {
    const config = parseArgs(process.argv.slice(2));
    const { server, listenHost, transport, hosts } = serve(config);
    server.on('error', error => {
      console.error('無法啟動試玩服務：' + error.message);
      process.exitCode = 1;
    });
    server.listen(config.port, listenHost, () => {
      const url = host => transport + '://' + host + ':' + server.address().port + '/play.html';
      const local = url(config.host ?? '127.0.0.1');
      console.log('PocketKB 選擇題試玩：' + local);
      for (const host of hosts.slice(2)) {
        const address = url(host);
        const qr = makeQr(0, 'M');
        qr.addData(address);
        qr.make();
        console.log('手機網址：' + address);
        const width = qr.getModuleCount();
        for (let row = -4; row < width + 4; row++) {
          let line = '';
          for (let col = -4; col < width + 4; col++) {
            const black = row >= 0 && col >= 0 && row < width && col < width && qr.isDark(row, col);
            line += black ? '\x1b[40m  ' : '\x1b[107m  ';
          }
          console.log(line + '\x1b[0m');
        }
      }
      if (config.open) launchBrowser(local);
    });
  } catch (error) {
    console.error('無法啟動試玩服務：' + error.message);
    process.exitCode = 1;
  }
}

module.exports = { parseArgs, serve, lanAddresses };
