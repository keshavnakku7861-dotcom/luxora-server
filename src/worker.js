// Luxora chat API as a Cloudflare Worker (Workers Free plan: no card needed).
// GET /healthz, POST /api/chat, GET /api/products, GET /api/deals. CORS: only the Luxora GitHub Pages origin
// (add more with the ALLOWED_ORIGINS variable, comma separated).
import sender from '../responders/sender.js';
import catalogMod from '../products.js';
import deals from '../deals.json';

const catalog = catalogMod.products;
const BASE_ORIGIN = 'https://keshavnakku7861-dotcom.github.io';

function normalizeProducts(list) {
  if (!Array.isArray(list)) return [];
  return list.map(item => {
    const id = typeof item === 'string' ? item : item && item.id;
    const known = catalog.find(p => p.id === id);
    return known ? { ...known, ...(typeof item === 'object' ? item : {}) } : null;
  }).filter(Boolean);
}

function corsFor(request, env) {
  const origin = request.headers.get('Origin');
  const allowed = new Set([BASE_ORIGIN, ...String((env && env.ALLOWED_ORIGINS) || '').split(',').map(s => s.trim()).filter(Boolean)]);
  if (origin && allowed.has(origin)) return { 'access-control-allow-origin': origin, vary: 'Origin', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400' };
  return { vary: 'Origin' };
}
const json = (status, obj, cors) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...cors } });

export default {
  async fetch(request, env) {
    const cors = corsFor(request, env), url = new URL(request.url);
    const origin = request.headers.get('Origin');
    if (request.method === 'OPTIONS') return new Response(null, { status: origin && !cors['access-control-allow-origin'] ? 403 : 204, headers: cors });
    if (url.pathname === '/healthz' || url.pathname === '/api/health') return json(200, { ok: true }, cors);
    if (url.pathname === '/api/chat') {
      if (request.method !== 'POST') return json(405, { error: 'POST only' }, cors);
      let body;
      try { const text = await request.text(); if (text.length > 20000) return json(413, { error: 'too large' }, cors); body = JSON.parse(text); } catch { return json(400, { error: 'invalid JSON' }, cors); }
      const message = body && typeof body.message === 'string' ? body.message.trim() : '';
      if (!message) return json(400, { error: '"message" is required' }, cors);
      try {
        const out = await sender.respond(message.slice(0, 1000), { history: Array.isArray(body.history) ? body.history.slice(-10) : [], last: Array.isArray(body.last) ? body.last.filter(x => typeof x === 'string').slice(0, 6) : [] });
        if (!out || typeof out.reply !== 'string') throw new Error('bad responder output');
        return json(200, { ...out, products: normalizeProducts(out.products) }, cors);
      } catch (e) { console.error('responder error:', e && e.message); return json(502, { error: 'responder failed' }, cors); }
    }
    if (url.pathname === '/api/products' && request.method === 'GET') return json(200, { products: catalog }, cors);
    if (url.pathname === '/api/deals' && request.method === 'GET') return json(200, deals, cors);
    if (url.pathname === '/') return new Response('Luxora chat API. See /healthz, POST /api/chat, GET /api/products, GET /api/deals.', { headers: { 'content-type': 'text/plain; charset=utf-8', ...cors } });
    return json(404, { error: 'not found' }, cors);
  }
};
