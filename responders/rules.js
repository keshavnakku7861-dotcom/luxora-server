// Built-in rule-based responder (keyword matching). Replace or wrap it - see README "Plugging in SENDER".
// Contract: async respond(message, ctx) -> { reply: string, products: Product[], title?: string, followUp?: string }
const { products, categories } = require('../products');
const CHECKED_TXT = 'price checked Nov 3, 2026';
const ck = p => p && p.checkedAt && p.checkedAt !== '2026-11-03' ? 'price checked ' + new Date(p.checkedAt + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : CHECKED_TXT;
const pre = p => p && p.preorder && Date.now() < Date.parse(p.preorder.releases + 'T00:00:00-06:00') ? ` It's a pre-order on Amazon; it releases ${new Date(p.preorder.releases + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}.` : '';

const money = n => '$' + (Number.isInteger(n) ? n : n.toFixed(2));   // one price format everywhere: $349, $324.99

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
  const diff = other.price - cheaper.price;
  return { title: 'Side by side', reply: `${a.name} is ${money(a.price)} (${facts(a)}) and ${b.name} is ${money(b.price)} (${facts(b)}).${diff >= 1 ? ` ${cheaper.name} saves you about $${Math.round(diff)}.` : ''} I go by price and features, not reviews. Prices checked Nov 3.`, products: [a, b], followUp: 'Want me to add one of them to your cart?' };
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
  const attr = (lower.match(/\b(battery|noise|sleep|fitness|running|gps|iphone|android|weight|light|display|screen|storage)\b/) || [])[1];
  if (attr && /\b(better|best|which|longer|more|good)\b/.test(lower) && last.length >= 2) {
    const key = { light: 'weight', screen: 'display' }[attr] || attr;
    const hits = last.map(p => [p, [...(p.highlights || []), p.description || ''].find(h => h.toLowerCase().includes(key))]).filter(x => x[1]);
    if (hits.length) return { keep: true, title: 'Side by side', products: last.slice(0, 3), followUp: 'Want me to save one for later?', reply: `On ${key}: ${hits.map(([p, h]) => `${p.name}: ${h.replace(/\.$/, '')}`).join('; ')}.${hits.length < last.length ? ` I don't have ${key} details for ${last.filter(p => !hits.some(h => h[0] === p)).map(p => p.name).join(' or ')}, so check the Amazon listing.` : ''}` };
    return { keep: true, title: 'Side by side', products: last.slice(0, 3), followUp: 'Want me to compare them on price instead?', reply: `I don't have verified ${key} numbers for these, so I can't honestly rank them on that. Check each Amazon listing for the specs.` };
  }
  if (/\b(better|best|top rated|highest rated|best rated|higher rated|worth it|should i (get|buy|pick|choose)|recommend)\b/.test(lower) && last.length) {
    const p = [...last].sort((a, b) => dealPct(b) - dealPct(a) || a.price - b.price)[0];
    return pick(p, last.length > 1 ? `I don't have verified reviews, so I'm going by price and features. ${p.name} looks like the best value of those at ${money(p.price)}${dealPct(p) ? ` (${dealPct(p)}% below its listed price)` : ''}: ${facts(p)}. Prices checked Nov 3.` : `${p.name} is ${money(p.price)}: ${facts(p)} (${CHECKED_TXT}).`);
  }
  if (/\b(tell me more|more about|more info|details?|describe|what about)\b/.test(lower) || ord >= 0) {
    const p = last[ord >= 0 && ord < last.length ? ord : 0];
    return pick(p, `${p.name} (${p.store}) is ${money(p.price)}, ${CHECKED_TXT}. ${p.description || ''} Tap ${pre(p) ? 'Pre-order' : 'Buy now'} on the card to get it.`.trim());
  }
  return null;
}

/* sizing and colour questions answered from the catalog (sizes, colors, variants, optionsNote) */
const COLOR_WORDS = ['black', 'white', 'silver', 'gold', 'gray', 'grey', 'blue', 'pink', 'green', 'red', 'midnight', 'graphite', 'rose', 'purple', 'brown'];
function sizeOrColor(lower, p) {
  const ask = (reply, followUp) => ({ title: 'Your pick', products: [p], reply, followUp: followUp || 'Want me to save it, or compare it with another one?' });
  if (/\b(size|sizes|sizing|fit|fits)\b/.test(lower)) {
    const real = (p.sizes || []).filter(x => x !== 'One size' && /\d/.test(x)).map(x => x.replace(/^size\s*/i, ''));
    if (real.length) return ask(`Good question! ${p.name} comes in sizes ${real[0]} to ${real[real.length - 1]}. ${p.optionsNote || 'Check the sizing guide on the product page before you buy.'}`.trim());
    return ask(`${p.name} is one size, so there's nothing to pick. ${p.optionsNote || ''}`.trim());
  }
  const asked = COLOR_WORDS.find(c => new RegExp('\\b' + c + '\\b').test(lower));
  if (asked || /\b(colou?rs?|finish(es)?)\b/.test(lower)) {
    const names = (p.colors || []).filter(c => c !== 'standard').map(c => (p.colorNames && p.colorNames[c]) || c[0].toUpperCase() + c.slice(1));
    const list = names.length ? names.join(' and ') : '';
    const vprice = Object.values(p.variants || {}).map(v => `${v.label} is ${money(v.price)}`).join(', ');
    if (!list) return ask(`Here we only list one colour of ${p.name}. ${p.optionsNote || 'Other colours may be on the retailer page.'}`.trim());
    const hit = asked && names.some(n => n.toLowerCase().includes(asked === 'grey' ? 'gray' : asked));
    const dark = asked === 'black' && names.some(n => /midnight|graphite/i.test(n));
    const lead = hit ? `Yes! ${p.name} comes in ${list}.` : dark ? `Not black exactly, but close: ${p.name} comes in ${list}.` : asked ? `Not in ${asked} here. ${p.name} comes in ${list}.` : `${p.name} comes in ${list}.`;
    return ask(`${lead}${vprice ? ` The base is ${money(p.price)}; ${vprice}.` : ''}`, 'Want me to pull up one of them?');
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
  const NOT = (lower.match(/\b(laptops?|computers?|pcs?|macbooks?|phones?|iphones?|smartphones?|tvs?|televisions?|cameras?|consoles?|xbox|playstation|ps5|nintendo|monitors?|printers?|keyboards?|mice|mouse|drones?|furniture|toys?|books?|cars?|bikes?)\b/) || [])[1];
  if (NOT && cats.length === 0 && !namedProducts(lower).length) {
    return { keep: true, reply: `Luxora doesn't carry ${NOT.replace(/s?$/, 's').replace(/ss$/, 's')} yet, sorry! Right now I can help with smart rings, smartwatches, earbuds, headphones, tablets, e-readers and smart speakers.`, products: [] };
  }
  if (/^(hi|hello|hey|yo|good (morning|afternoon|evening))\b/.test(lower) && cats.length === 0) {
    return { reply: "Hi! I'm Luxora, your AI shopping assistant. Tell me what you're shopping for, your budget, or a brand, and I'll recommend the best options. Try “best smart ring under $500”.", products: [] };
  }
  if (/\b(track|where is|delivery|shipping|order status)\b/.test(lower)) {
    return { reply: "Luxora doesn't take or ship orders, so there's nothing for me to track. You buy from the retailer with the Buy now button, and you can track the order with them.", products: [] };
  }
  const named = namedProducts(lower);
  const last = (ctx && Array.isArray(ctx.last) ? ctx.last : []).map(id => products.find(p => p.id === id)).filter(Boolean);
  const comparing = /\b(compare|vs|versus|difference|differ)\b/.test(lower) || /\bwhich\b.*\b(better|best|cheaper|cheapest|worth|pricier|higher rated)\b/.test(lower) || (named.length >= 2 && /\b(better|cheaper|prefer|choose|pick|or)\b/.test(lower) && /\b(which|better|cheaper|prefer|should|choose|pick)\b/.test(lower));
  if (comparing && named.length >= 2) return sideBySide(named[0], named[1]);
  const fu = followUp(lower, last, cats, named);
  if (fu) return fu;
  /* "AirPods Pro or Sony earbuds?": one named product plus another brand counts as a comparison */
  const whichish = /\b(which|better|or|vs|versus|prefer|choose|pick)\b/.test(lower);
  if (named.length === 1 && whichish) {
    const other = products.find(p => p !== named[0] && p.store !== named[0].store && new RegExp('\\b' + p.store.toLowerCase() + '\\b').test(lower) && (p.category === named[0].category || cats.includes(p.category)));
    if (other) return sideBySide(named[0], other);
  }
  if (named.length === 1 && !comparing) {
    const so = sizeOrColor(lower, named[0]);
    if (so) return so;
  }
  if (named.length === 1 && !comparing) {
    const p = named[0], also = (p.alsoAt || []).map(a => `${a.name}${a.price ? ' (' + money(a.price) + ')' : ''}`).join(', ');
    return { title: 'Your pick', products: [p], followUp: 'Want me to save it, or compare it with another one?', reply: `${p.name} (${p.store}) is ${money(p.price)} (${ck(p)}), and the ${pre(p) ? 'Pre-order' : 'Buy now'} button takes you to it.${pre(p)} ${p.description || ''}${also ? ` Also at ${also}.` : ''}`.replace(/\s+/g, ' ').trim() };
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
    reply: `Based on ${budgetText} and ${needs} needs, I recommend ${top.name} (${money(top.price)}, ${ck(top)}).${pre(top)} ${pool.length > 1 ? 'Here are a few more worth a look.' : ''}`.replace(/\s+/g, ' ').trim(),
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
