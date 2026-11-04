// Built-in rule-based responder (keyword matching). Replace or wrap it - see README "Plugging in SENDER".
// Contract: async respond(message, ctx) -> { reply: string, products: Product[], title?: string, followUp?: string }
const { products, categories } = require('../products');
const CHECKED_TXT = 'price checked Nov 3, 2026';
const ck = p => p && p.checkedAt && p.checkedAt !== '2026-11-03' ? 'price checked ' + new Date(p.checkedAt + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : CHECKED_TXT;
const pre = p => p && p.preorder && Date.now() < Date.parse(p.preorder.releases + 'T00:00:00-06:00') ? ` It's a pre-order on Amazon; it releases ${new Date(p.preorder.releases + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}.` : '';

const money = n => '$' + n.toFixed(2);

function parseBudget(text) {
  const m = text.match(/(?:under|below|less than|max(?:imum)?|up to|<)\s*\$?\s*(\d+(?:[.,]\d+)?)/i)
         || text.match(/\$\s*(\d+(?:[.,]\d+)?)/);
  return m ? parseFloat(m[1].replace(',', '')) : null;
}

function detectCategories(text) {
  const t = ' ' + text.toLowerCase().replace(/[^a-z0-9\-$ ]/g, ' ') + ' ';
  return Object.entries(categories)
    .filter(([, c]) => c.words.some(w => t.includes(' ' + w + ' ')))
    .map(([key]) => key);
}

/* products named in the text, in the order they appear ("Oura Ring 4", "galaxy ring", "airpods"...) */
function namedProducts(lower) {
  const esc = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hits = [];
  products.forEach(p => {
    const toks = [p.name.toLowerCase(), ...(p.aliases || [])];
    let idx = -1;
    for (const t of toks) { const m = lower.match(new RegExp('(^|[^a-z0-9])' + esc(t) + '(?![a-z0-9])')); if (m && (idx < 0 || m.index < idx)) idx = m.index; }
    if (idx >= 0) hits.push([idx, p]);
  });
  return hits.sort((a, b) => a[0] - b[0]).map(h => h[1]);
}

const dealPct = p => p.listPrice ? Math.round((1 - p.price / p.listPrice) * 100) : 0;
const facts = p => (p.highlights || []).slice(0, 2).join(', ');
/* There are no verified review scores, so "better" is answered with price, discount and specs only. */
function sideBySide(a, b) {
  const cheaper = a.price <= b.price ? a : b, other = cheaper === a ? b : a;
  return { title: 'Side by side', reply: `${a.name} is ${money(a.price)} (${facts(a)}) and ${b.name} is ${money(b.price)} (${facts(b)}), ${CHECKED_TXT}. ${cheaper.name} costs ${money(other.price - cheaper.price)} less. I don't have verified reviews to rank them on quality, so it comes down to price and features.`, products: [a, b], followUp: 'Want me to add one of them to your cart?' };
}

/* follow-up questions about the products shown last ("which one is cheaper?", "tell me more about the first one") */
function followUp(lower, last, cats, named) {
  if (!last.length || cats.length || named.length >= 2) return null;
  const pick = (p, reply, extra) => ({ title: 'Your pick', reply, products: [p], followUp: extra || 'Want me to save it, or compare it with another one?' });
  const ord = /\b(first|1st)\b/.test(lower) ? 0 : /\b(second|2nd)\b/.test(lower) ? 1 : /\b(third|3rd)\b/.test(lower) ? 2 : -1;
  if (/\b(compare|difference|differ)\b.*\b(them|these|those|both|two)\b|\b(them|these|those|both)\b.*\b(compare|differ)/.test(lower) && last.length >= 2) return sideBySide(last[0], last[1]);
  if (/\b(cheaper|cheapest|less expensive|lowest price|least expensive|most affordable|budget[- ]friendly)\b/.test(lower)) {
    const p = [...last].sort((a, b) => a.price - b.price)[0];
    return pick(p, last.length > 1 ? `${p.name} is the cheaper one at ${money(p.price)}, versus ${last.filter(x => x !== p).map(x => `${x.name} at ${money(x.price)}`).join(' and ')}.` : `${p.name} is the only one I showed, at ${money(p.price)}.`);
  }
  if (/\b(pricier|more expensive|most expensive|priciest|costs? more|highest price)\b/.test(lower)) {
    const p = [...last].sort((a, b) => b.price - a.price)[0];
    return pick(p, `${p.name} is the priciest at ${money(p.price)}.`);
  }
  if (/\b(better|best|top rated|highest rated|best rated|higher rated|worth it|should i (get|buy|pick|choose)|recommend)\b/.test(lower) && last.length) {
    const p = [...last].sort((a, b) => dealPct(b) - dealPct(a) || a.price - b.price)[0];
    return pick(p, last.length > 1 ? `I don't have verified reviews, so I'm going by price and features. ${p.name} looks like the best value of those at ${money(p.price)}${dealPct(p) ? ` (${dealPct(p)}% below its listed price)` : ''}: ${facts(p)}. Prices ${CHECKED_TXT}.` : `${p.name} is ${money(p.price)}: ${facts(p)} (${CHECKED_TXT}).`);
  }
  if (/\b(tell me more|more about|more info|details?|describe|what about)\b/.test(lower) || ord >= 0) {
    const p = last[ord >= 0 && ord < last.length ? ord : 0];
    return pick(p, `${p.name} (${p.store}) is ${money(p.price)}, ${CHECKED_TXT}. ${p.description || ''} You can buy it at ${p.retailer.name} (button on the product card).`.trim());
  }
  return null;
}

function score(p, words) {
  let s = dealPct(p) / 100;
  for (const w of words) if (p.tags.includes(w)) s += 1.5;
  return s;
}

async function respond(message, ctx = {}) {
  const text = String(message || '').trim();
  const lower = text.toLowerCase();
  const budget = parseBudget(text);
  const cats = detectCategories(text);
  const words = lower.split(/[^a-z]+/).filter(Boolean);

  if (cats.length === 0 && /\b(grocer(y|ies)|food|snacks?|fashion|clothes|clothing|something to wear|shoes|sneakers|dress(es)?|shirts?|jackets?)\b/.test(lower)) {
    const which = /\b(fashion|clothes|clothing|something to wear|shoes|sneakers|dress(es)?|shirts?|jackets?)\b/.test(lower) ? 'Fashion' : 'Groceries';
    return { reply: `${which} isn't available on Luxora yet. I can help with electronics: smart rings, smartwatches, earbuds, headphones, tablets, e-readers and smart speakers. Try “best smart ring under $500”.`, products: [] };
  }
  if (/^(hi|hello|hey|yo|good (morning|afternoon|evening))\b/.test(lower) && cats.length === 0) {
    return { reply: "Hi! I'm Luxora, your AI shopping assistant. Tell me what you're shopping for, your budget, or a brand, and I'll recommend the best options. Try “best smart ring under $500”.", products: [] };
  }
  if (/\b(track|where is|delivery|shipping|order status)\b/.test(lower)) {
    return { reply: "Luxora doesn't take or ship orders, so there's nothing for me to track. Use the Buy at link on a product to buy from the retailer, and track the order with them.", products: [] };
  }
  const named = namedProducts(lower);
  const last = (ctx && Array.isArray(ctx.last) ? ctx.last : []).map(id => products.find(p => p.id === id)).filter(Boolean);
  const comparing = /\b(compare|vs|versus|difference|differ)\b/.test(lower) || /\bwhich\b.*\b(better|best|cheaper|cheapest|worth|pricier|higher rated)\b/.test(lower) || (named.length >= 2 && /\b(better|cheaper|prefer|choose|pick|or)\b/.test(lower) && /\b(which|better|cheaper|prefer|should|choose|pick)\b/.test(lower));
  if (comparing && named.length >= 2) return sideBySide(named[0], named[1]);
  const fu = followUp(lower, last, cats, named);
  if (fu) return fu;
  if (named.length === 1 && !comparing) {
    const p = named[0], also = (p.alsoAt || []).map(a => `${a.name}${a.price ? ' (' + money(a.price) + ')' : ''}`).join(', ');
    return { title: 'Your pick', products: [p], followUp: 'Want me to save it, or compare it with another one?', reply: `${p.name} (${p.store}) is ${money(p.price)} at ${p.retailer.name}, ${ck(p)}.${pre(p)} ${p.description || ''}${also ? ` Also at ${also}.` : ''} Use the Buy at button on the product to buy it from the retailer.`.replace(/\s+/g, ' ').trim() };
  }
  if (comparing && named.length === 1 && last.length) return sideBySide(named[0], last.find(p => p !== named[0]) || named[0]);

  let pool = products.filter(p => cats.length === 0 || cats.includes(p.category));
  const noCategory = cats.length === 0;
  if (noCategory) {
    const tagHit = pool.filter(p => p.tags.some(t => words.includes(t)));
    if (tagHit.length) pool = tagHit;
  }
  if (budget != null) {
    const within = pool.filter(p => p.price <= budget);
    if (within.length === 0) {
      const cheapest = [...pool].sort((a, b) => a.price - b.price)[0];
      if (!cheapest) return fallback();
      return { reply: `I couldn't find anything under $${Number.isInteger(budget) ? budget : budget.toFixed(2)} in that category. The closest is ${cheapest.name} at ${money(cheapest.price)} (${ck(cheapest)}).`, products: [cheapest], title: 'Closest match', followUp: 'Would you like me to look at a higher budget?' };
    }
    pool = within;
  }
  if (noCategory && pool.length === products.length && budget == null && !words.some(w => ['best', 'recommend', 'suggest', 'show', 'popular', 'deal', 'deals', 'top'].includes(w))) {
    return fallback();
  }
  pool = pool.sort((a, b) => score(b, words) - score(a, words)).slice(0, 3);
  const top = pool[0];
  const label = cats.length === 1 ? categories[cats[0]].label : 'picks';
  const needs = words.includes('everyday') ? 'everyday' : (words.find(w => ['fitness', 'sleep', 'health', 'music', 'travel', 'work', 'running', 'commute', 'workout'].includes(w)) || 'everyday');
  const budgetText = budget != null ? `your budget (under $${Number.isInteger(budget) ? budget : budget.toFixed(2)})` : 'your budget';
  return {
    title: `Top suggested ${label}`,
    reply: `Based on ${budgetText} and ${needs} needs, I recommend ${top.name} (${money(top.price)} at ${top.retailer.name}, ${ck(top)}).${pre(top)} ${pool.length > 1 ? 'Here are a few more worth a look.' : ''}`.replace(/\s+/g, ' ').trim(),
    products: pool,
    followUp: 'Want me to compare any of these, or save one for later?'
  };
}

function fallback() {
  return {
    reply: "I can help with smart rings, smartwatches, earbuds, headphones, tablets, e-readers and smart speakers. Try something like “best smart ring under $500”, “earbuds for my commute” or “compare Oura Ring 4 and Samsung Galaxy Ring”.",
    products: []
  };
}

module.exports = { ck, pre, respond, name: 'rules' };
