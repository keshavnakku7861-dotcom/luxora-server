// Luxora chat API (dependency-free Node server) for hosting on Render's free tier.
// Endpoints: POST /api/chat, GET /api/products, GET /api/deals, GET /healthz (also /api/health).
// Listens on process.env.PORT. CORS allows only the Luxora GitHub Pages origin (extra origins via ALLOWED_ORIGINS, comma separated).
const http = require('http');
const { products } = require('./products');
const deals = require('./deals.json');
const { respond } = require('./responder');

const PORT = Number(process.env.PORT || 3000);
const ORIGINS = new Set(['https://keshavnakku7861-dotcom.github.io', ...String(process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)]);

function send(res, status, body, headers = {}) { res.writeHead(status, { 'cache-control': 'no-store', ...headers }); res.end(body); }
const json = (res, status, obj, h) => send(res, status, JSON.stringify(obj), { 'content-type': 'application/json; charset=utf-8', ...h });

function readBody(req, limit = 20000) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > limit) { reject(Object.assign(new Error('too large'), { status: 413 })); req.destroy(); } });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  const cors = origin && ORIGINS.has(origin)
    ? { 'access-control-allow-origin': origin, vary: 'Origin', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400' }
    : { vary: 'Origin' };
  if (req.method === 'OPTIONS') return send(res, origin && !ORIGINS.has(origin) ? 403 : 204, '', cors);
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname === '/healthz' || url.pathname === '/api/health') return json(res, 200, { ok: true }, cors);
    if (url.pathname === '/api/chat') {
      if (req.method !== 'POST') return json(res, 405, { error: 'POST only' }, cors);
      let body;
      try { body = JSON.parse(await readBody(req)); } catch { return json(res, 400, { error: 'invalid JSON' }, cors); }
      const message = body && typeof body.message === 'string' ? body.message.trim() : '';
      if (!message) return json(res, 400, { error: '"message" is required' }, cors);
      try { return json(res, 200, await respond(message.slice(0, 1000), { history: Array.isArray(body.history) ? body.history.slice(-10) : [], last: Array.isArray(body.last) ? body.last.filter(x => typeof x === 'string').slice(0, 6) : [] }), cors); }
      catch (e) { console.error('responder error:', e.message); return json(res, 502, { error: 'responder failed' }, cors); }
    }
    if (url.pathname === '/api/products' && req.method === 'GET') return json(res, 200, { products }, cors);
    if (url.pathname === '/api/deals' && req.method === 'GET') return json(res, 200, deals, cors);
    if (url.pathname === '/') return send(res, 200, 'Luxora chat API. See /healthz, POST /api/chat, GET /api/products, GET /api/deals.', { 'content-type': 'text/plain; charset=utf-8', ...cors });
    return json(res, 404, { error: 'not found' }, cors);
  } catch (e) { console.error(e); json(res, e.status || 500, { error: 'server error' }, cors); }
});

server.listen(PORT, '0.0.0.0', () => console.log(`Luxora API listening on port ${PORT}`));
