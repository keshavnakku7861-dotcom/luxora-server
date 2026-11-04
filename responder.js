// Single seam for the chat backend. server.js only ever calls `respond(message, ctx)`.
//
//   default                      -> ./responders/rules.js (keyword matching)
//   RESPONDER=./responders/x.js  -> your own module exporting async respond(message, ctx)
//   RESPONDER_URL=https://...    -> forward {message} to an HTTP service (e.g. the SENDER bot)
//                                   that answers {reply, products}
const path = require('path');
const { products: catalog } = require('./products');

function normalizeProducts(list) {
  if (!Array.isArray(list)) return [];
  return list.map(item => {
    const id = typeof item === 'string' ? item : item && item.id;
    const known = catalog.find(p => p.id === id);
    if (known) return { ...known, ...(typeof item === 'object' ? item : {}) };
    if (item && typeof item === 'object' && item.name && typeof item.price === 'number') {
      return { kind: 'ring', tone: 'silver', store: 'Luxora', sizes: ['One size'], colors: ['black'], retailer: { name: 'the retailer', url: '#' }, highlights: [], aliases: [], ...item, id: item.id || 'x-' + item.name.toLowerCase().replace(/\W+/g, '-') };
    }
    return null;
  }).filter(Boolean);
}

async function viaHttp(url, message, ctx) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), Number(process.env.RESPONDER_TIMEOUT_MS || 15000));
  try {
    const res = await fetch(url, {
      method: 'POST', signal: ctl.signal,
      headers: { 'content-type': 'application/json', ...(process.env.RESPONDER_TOKEN ? { authorization: 'Bearer ' + process.env.RESPONDER_TOKEN } : {}) },
      body: JSON.stringify({ message, ...ctx })
    });
    if (!res.ok) throw new Error('responder HTTP ' + res.status);
    return await res.json();
  } finally { clearTimeout(timer); }
}

async function respond(message, ctx = {}) {
  let out;
  if (process.env.RESPONDER_URL) out = await viaHttp(process.env.RESPONDER_URL, message, ctx);
  else {
    const mod = require(process.env.RESPONDER ? path.resolve(process.env.RESPONDER) : './responders/sender.js');
    out = await mod.respond(message, ctx);
  }
  if (!out || typeof out.reply !== 'string') throw new Error('responder must return { reply: string, products: [] }');
  return { ...out, reply: out.reply, products: normalizeProducts(out.products) };
}

module.exports = { respond };
