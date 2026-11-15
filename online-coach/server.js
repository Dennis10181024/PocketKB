'use strict';
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { ConversationCoach, createOpenAIProvider, CoachError } = require('./coach');
const root = path.resolve(__dirname, '../web-pwa');
function createServer(coach) {
  return http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const json = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); };
    try {
      // Local development only. Browser requests must originate from this server.
      const origin = req.headers.origin;
      if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host || '')) throw new CoachError('HOST_DENIED', '此服務僅供本機示範。', 403);
      if (origin && origin !== `http://${req.headers.host}`) throw new CoachError('ORIGIN_DENIED', '請從線上教練的網頁入口操作。', 403);
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'GET' && url.pathname === '/api/health') return json(200, { ready: coach.provider.ready, model: coach.provider.model, callsRemaining: Math.max(0, coach.maxCalls - coach.calls) });
      if (req.method === 'GET' && url.pathname === '/api/scenarios') return json(200, { scenarios: coach.catalog() });
      if (req.method === 'POST' && url.pathname.startsWith('/api/')) {
        if (!req.headers['content-type']?.startsWith('application/json')) throw new CoachError('JSON_REQUIRED', '請使用 JSON 請求。', 415);
        let raw = '';
        for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 12000) throw new CoachError('TOO_LARGE', '請求過長。', 413); }
        let body; try { body = JSON.parse(raw); } catch { throw new CoachError('INVALID_JSON', '請求格式不正確。'); }
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new CoachError('INVALID_JSON', '請求格式不正確。');
        if (url.pathname === '/api/configure') {
          if (coach.provider.ready) throw new CoachError('ALREADY_CONFIGURED', '金鑰已設定；若需更換，請重新啟動電腦服務。', 409);
          if (typeof body.apiKey !== 'string' || !/^sk-[A-Za-z0-9_-]{16,}$/.test(body.apiKey.trim()) || body.apiKey.length > 1000)
            throw new CoachError('INVALID_KEY', '請輸入 OpenAI 平台產生的完整 API 金鑰。');
          coach.provider = createOpenAIProvider({ apiKey: body.apiKey.trim(), model: process.env.OPENAI_MODEL || 'gpt-6.1-terra' });
          return json(200, { ready: true, message: '金鑰已存入本機後端記憶體；尚未驗證 API 權限與額度。可以開始演練。' });
        }
        if (url.pathname === '/api/sessions') return json(201, coach.create(body.scenarioId));
        const route = /^\/api\/sessions\/([a-f0-9-]+)\/turn$/.exec(url.pathname);
        if (route) return json(200, await coach.turn(route[1], body));
        return json(404, { code: 'NOT_FOUND', error: '找不到這個操作。' });
      }
      if (req.method !== 'GET') return json(405, { error: '不支援這個操作。' });
      const file = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
      if (!file.startsWith(root + path.sep)) return json(403, { error: '禁止存取。' });
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
      const bytes = await fs.readFile(file);
      res.writeHead(200, { 'Content-Type': (types[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8' }); res.end(bytes);
    } catch (error) {
      if (res.destroyed || res.headersSent) return;
      if (error instanceof CoachError) return json(error.status, { code: error.code, error: error.message });
      return json(error.code === 'ENOENT' ? 404 : 500, { code: 'SERVER_ERROR', error: '本機教練暫時無法完成操作。' });
    }
  });
}
if (require.main === module) {
  const coach = new ConversationCoach(createOpenAIProvider({ apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL || 'gpt-6.1-terra' }), { maxCalls: Number(process.env.POCKETKB_MAX_CALLS || 100) });
  createServer(coach).listen(5175, '127.0.0.1', () => console.log(`PocketKB 線上演練：http://127.0.0.1:5175/\nGPT 金鑰：${coach.provider.ready ? '已設定' : '尚未設定（只可預覽與連線測試）'}\n模型：${coach.provider.model}`));
}
module.exports = { createServer };
