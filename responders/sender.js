// SENDER responder: reuses rules.js for product matching, rewrites the replies in a warm, casual voice.
// Contract: async respond(message, ctx) -> { reply, products, title?, followUp? }
const rules = require('./rules');
const { ck, pre } = rules;
const facts = p => (p.highlights || []).slice(0, 2).join(', ');
const { categories, products: allProducts } = require('../products');

const money = n => '$' + (Number.isInteger(n) ? n.toLocaleString('en-US') : n.toFixed(2));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

async function respond(message, ctx = {}) {
  const text = String(message || '').trim();
  const lower = text.toLowerCase();

  if (/\b(am i (talking|chatting|speaking) (to|with) (a |an )?(human|bot|real person|person|ai|robot|machine)|are you (a |an )?(human|real|person|bot|ai|robot|machine)|is this (a |an )?(bot|ai|human|real person)|who are you|what are you|real person)\b/.test(lower)) {
    return { reply: /talking|chatting|speaking|is this/.test(lower) ? "Yep, I'm Luxora's AI assistant, not a person. Happy to help you find something though. What are you after?" : "I'm Luxora's AI assistant, not a person, but I'm happy to help you find something good. What are you shopping for?", products: [] };
  }
  if (/^(hi|hello|hey|yo|hiya|sup|good (morning|afternoon|evening))\b/.test(lower) && text.split(/\s+/).length <= 4) {
    return { reply: pick(["Hey! What are you on the hunt for today?", "Hi there! Looking for anything in particular? Rings, watches, earbuds, headphones?", "Hey! Tell me what you need and your budget, and I'll find you something nice."]), products: [] };
  }
  if (/\b(thanks|thank you|thx|ty)\b/.test(lower)) {
    return { reply: pick(["Anytime! Shout if you need anything else.", "Happy to help! Enjoy your new gear."]), products: [] };
  }

  if (!/\b(rings?|watch(es)?|buds|earbuds?|headphones?|cans|tablets?|ipads?|kindles?|e-?readers?|echo|speakers?)\b/.test(lower) && /\b(grocer(y|ies)|food|snacks?|fashion|clothes|clothing|something to wear|shoes|sneakers|dress(es)?|shirts?|jackets?)\b/.test(lower)) {
    const which = /\b(fashion|clothes|clothing|something to wear|shoes|sneakers|dress(es)?|shirts?|jackets?)\b/.test(lower) ? 'Fashion' : 'Groceries';
    return { reply: `${which} isn't on Luxora's shelves just yet, so I can't recommend anything there right now. What I can do well is electronics: smart rings, smartwatches, earbuds, headphones, tablets, e-readers and smart speakers. Want me to pull up the top picks?`, products: [] };
  }

  const productWords = /\b(rings?|watch(es)?|smartwatch(es)?|buds|earbuds?|airpods|headphones?|cans|tablets?|ipads?|kindles?|e-?readers?|echo|speakers?|alexa|oura|garmin|sony|apple|samsung)\b/.test(lower);

  // returns: Luxora doesn't sell, so no return window is promised here
  if (/\b(returns?|refunds?|exchanges?|send (it )?back)\b/.test(lower)) {
    return { reply: "Returns go through the store you bought from, since Luxora doesn't sell anything directly. Check the Amazon listing (or the retailer's page) for return details before you buy. Anything else I can help you find?", products: [] };
  }
  // shipping time (not tracking)
  if (/\b(how long|how fast|when will|shipping time|delivery time|ship to|deliver to)\b/.test(lower) && /\b(ship|shipping|deliver|delivery|arrive)\b/.test(lower)) {
    return { reply: "Luxora doesn't ship orders itself. You buy straight from the retailer, mostly Amazon, so shipping times depend on them. You'll see the delivery date at checkout after you tap Buy now.", products: [] };
  }
  // gifts
  if (/\b(gifts?|present|birthday|christmas|holiday|for my (mom|mum|mother|dad|father|wife|husband|partner|girlfriend|boyfriend|friend|sister|brother|son|daughter|grandma|grandpa|teacher|boss))\b|\bsomething for (my|a|her|him)\b/.test(lower) && !productWords && !/\$\s*\d|\b(under|below|less than)\s*\$?\d/.test(lower)) {
    const who = (lower.match(/\bfor (?:my )?(mom|mum|mother|dad|father|wife|husband|partner|girlfriend|boyfriend|friend|sister|brother|son|daughter|grandma|grandpa|teacher|boss)\b/) || [])[1];
    const her = /mom|mum|mother|wife|girlfriend|sister|daughter|grandma/.test(who || ''), him = /dad|father|husband|boyfriend|brother|son|grandpa/.test(who || '');
    const pr = her ? 'she' : him ? 'he' : 'they';
    return { reply: who ? `Aw, nice! What's ${pr === 'they' ? 'your ' + who : pr} into: fitness, sleep, music or reading? And roughly what's your budget? A Kindle or a smart ring makes a lovely gift.` : "Love a gift hunt! Who's it for, and roughly what do you want to spend? Smart rings, earbuds and Kindles all make great gifts.", products: [] };
  }

  // --- popular / best-selling and budget-only follow-ups (no live sales data: never invent unit counts) ---
  const histText = (Array.isArray(ctx.history) ? ctx.history : []).map(h => typeof h === 'string' ? h : h && (h.role === 'user' || h.r === 'u' || h.role == null) ? (h.content || h.text || h.t || '') : '').filter(Boolean).slice(-6).join(' ').toLowerCase();
  const catsIn = s => { const t = ' ' + s.replace(/[^a-z0-9\- ]/g, ' ') + ' '; return Object.keys(categories).filter(k => categories[k].words.some(w => t.includes(' ' + w + ' '))); };
  const popRe = /\b(most\s+(com+on|coman|comon|comman|commen|popular|populer|bought|sold|liked|wanted|purchased)|popular|populer|best\s*-?\s*sell(ing|ers?)|top\s*sell(ing|ers?)|sold\s+(the\s+)?most|sells?\s+(the\s+)?most|trending|what'?s\s+hot|fan\s+favou?rites?|everyone\s+(buys|wants|gets))\b/;
  const amt = (() => {
    const m = lower.match(/\b(?:budget|spend|spending|afford|have|got|around|about|roughly|max|maximum|up to|under|below|less than|within)\b[^\d$]{0,15}\$?\s*(\d[\d,]*(?:\.\d+)?)\s*(k\b)?/) || lower.match(/^\s*(?:like\s+|maybe\s+|about\s+|around\s+)?\$?\s*(\d[\d,]*(?:\.\d+)?)\s*(k\b)?\s*(?:dollars?|bucks|usd|\$)?\s*[.!?]?\s*$/) || lower.match(/\$\s*(\d[\d,]*(?:\.\d+)?)\s*(k\b)?/) || lower.match(/\b(\d[\d,]*(?:\.\d+)?)\s*(k\b)?\s*(?:dollars?|bucks|usd)\b/);
    if (!m) return null; const n = parseFloat(m[1].replace(/,/g, '')) * (m[2] ? 1000 : 1); return n >= 10 ? n : null;
  })();
  const FEATURED = ['aura-ring-4', 'echo-buds-pro', 'studio-cans', 'orbit-watch', 'kindle-16gb-2026', 'drift-buds', 'calm-over-ear', 'pulse-watch-s', 'echo-dot-2026', 'ipad-mini-a20'];
  const featured = (cats, max) => { const ps = FEATURED.map(id => allProducts.find(p => p.id === id)).filter(Boolean).filter(p => (!cats.length || cats.includes(p.category)) && (max == null || p.price <= max)); const seen = new Set(), out = []; for (const p of ps) if (!seen.has(p.category) || cats.length) { seen.add(p.category); out.push(p); if (out.length === 3) break; } return out; };
  const list = ps => ps.map(x => `${x.name} (${money(x.price)})`).join(', ').replace(/, ([^,]*)$/, ' and $1');
  const curCats = catsIn(lower);
  if (popRe.test(lower)) {
    const cats = curCats, ps = featured(cats, amt);
    if (ps.length) {
      const noData = /\b(sold|sell|sells|selling|bought|purchased|today|this week|right now)\b/.test(lower) ? "I don't have live sales numbers, so I can't tell you exactly what sold the most" + (/\btoday\b/.test(lower) ? ' today' : '') + ". " : '';
      return { title: 'Popular on Luxora', products: ps, reply: `${noData}${noData ? 'But the' : 'The'} picks Luxora shoppers ask about most${cats.length === 1 ? ' in ' + categories[cats[0]].label.toLowerCase() : ''} are ${list(ps)}. ${ps[0].name} is a real crowd favorite${(ps[0].highlights || [])[0] ? ` (${ps[0].highlights[0].toLowerCase()})` : ''}. Prices checked Nov 3.`, followUp: 'Got a budget in mind? I can narrow it down.' };
    }
  }
  if (amt != null && !productWords && curCats.length === 0 && !/\b(compare|vs|versus)\b/.test(lower)) {
    const hc = catsIn(histText), wasPop = popRe.test(histText);
    let ps = hc.length ? allProducts.filter(p => hc.includes(p.category) && p.price <= amt).sort((a, b) => b.price - a.price).slice(0, 3) : featured([], amt);
    if (!ps.length) {
      const cheapest = [...allProducts].filter(p => !hc.length || hc.includes(p.category)).sort((a, b) => a.price - b.price)[0];
      return { title: 'Closest match', products: [cheapest], reply: `Ah, ${money(amt)} is a little tight for what we carry${hc.length ? ' there' : ''}. The most affordable is ${cheapest.name} at ${money(cheapest.price)}. Prices checked Nov 3.`, followUp: 'Want me to look at something else instead?' };
    }
    const lead = wasPop ? `Nice, with ${money(amt)} you can grab any of the popular picks` : hc.length ? `Got it, ${money(amt)} for ${categories[hc[0]].label.toLowerCase()}` : `Nice, ${money(amt)} goes a long way here`;
    return { title: `Picks under ${money(amt)}`, products: ps, reply: `${lead}. I'd look at ${list(ps)}. ${ps[0].name} is my favorite of those${(ps[0].highlights || [])[0] ? ` (${ps[0].highlights[0].toLowerCase()})` : ''}. Prices checked Nov 3.`, followUp: 'Want me to focus on one type, like earbuds or a smartwatch?' };
  }

  const out = await rules.respond(text, ctx);
  const p = out.products || [];
  if (out.keep) { const { keep, ...rest } = out; return rest; }

  if (/order status|track|where is|delivery|shipping/.test(lower) && p.length === 0) {
    return { reply: "Luxora doesn't take or ship orders itself, so there's no order for me to track. You buy from the retailer with the Buy now button, and you can track the order with them.", products: [] };
  }
  if (p.length === 0) {
    if (!productWords && /\b(weather|news|joke|time is it|sports?|score|homework|math|movie|song|recipe|cook|politic|game)\b/.test(lower)) {
      return { reply: "Ha, I'm no good with that one, but I'm great with gadgets! Looking for a smart ring, watch, earbuds, headphones or a tablet?", products: [] };
    }
    if (/\b(something|anything|stuff|ideas?|nice|cool|good|help|suggest|recommend|shopping|buy|looking)\b/.test(lower)) {
      return { reply: "Happy to help! What kind of thing, and what's your budget? I've got smart rings, watches, earbuds, headphones, tablets, Kindles and smart speakers.", products: [] };
    }
    return { reply: pick(["Hmm, I'm not sure I caught that. I'm best with smart rings, smartwatches, earbuds, headphones, tablets, e-readers and smart speakers. What are you shopping for?", "Sorry, I didn't quite get that one! Could you tell me what kind of gadget you're after, or just a budget? I can pull up good picks either way.", "I might be missing what you mean. Want me to show you what's popular right now, or are you after something specific like earbuds or a smart ring?"]), products: [] };
  }
  if (out.title === 'Side by side' && p.length >= 2) {
    const [a, b] = p, ios = x => /iphone|apple/i.test((x.highlights || []).join(' ') + ' ' + x.store), android = x => /android|samsung only/i.test((x.highlights || []).join(' '));
    const cheap = a.price <= b.price ? a : b, dear = cheap === a ? b : a, diff = Math.round(dear.price - cheap.price);
    const tip = android(a) || android(b) ? ` ${android(a) ? a.name : b.name} only works with Android/Samsung phones, so on iPhone go with ${android(a) ? b.name : a.name}.`
      : ios(dear) && !ios(cheap) ? ` ${dear.name} is the pick if you're on iPhone; ${cheap.name} costs${diff >= 1 ? ` about $${diff}` : ''} less.`
      : diff >= 1 ? ` If price matters most, ${cheap.name} saves you about $${diff}.` : '';
    return { ...out, reply: `Good pair! ${a.name} is ${money(a.price)} (${facts(a)}) and ${b.name} is ${money(b.price)} (${facts(b)}).${tip} Prices checked Nov 3.`, followUp: 'Want me to save one for later?' };
  }
  if (out.title === 'Your pick') {
    return { ...out, reply: /^(Good question|Yes!|Not |Here we)/.test(out.reply) ? out.reply : `Sure thing. ${out.reply}` };
  }
  if (out.title === 'Closest match') {
    const c = p[0], cat = categories[c.category], label = cat ? cat.label.toLowerCase() : 'these';
    return { ...out, reply: `${label[0].toUpperCase() + label.slice(1)} start at ${money(c.price)}, so that budget won't quite get there, sorry! The cheapest is ${c.name} at ${money(c.price)}. Prices checked Nov 3.`, followUp: 'Want me to look at something else in your budget instead?' };
  }

  const top = p[0];
  const extra = p.length > 1 ? ` ${p.slice(1).map(x => `${x.name} (${money(x.price)})`).join(' and ')} ${p.length > 2 ? 'are good options' : 'is a good option'} too.` : '';
  const budget = (lower.match(/(?:under|below|less than|max|up to)\s*\$?\s*(\d+)/) || lower.match(/\$\s*(\d+)/) || [])[1];
  const need = (lower.replace(/\bworks?\s+(?:well\s+)?with\b/g, 'compatible with').match(/\b(running|workouts?|gym|fitness|sleep|travel|commute|work|music|reading|kids)\b/) || [])[1];
  const opener = need ? `For ${need}, ` : budget ? `Under $${budget}, ` : '';
  const why = (top.highlights || [])[0];
  return {
    ...out,
    reply: `${opener ? opener + "I'd" : "I'd"} go with ${top.name} at ${money(top.price)}${why ? ` (${why.toLowerCase()})` : ''}.${pre(top)}${extra} Prices checked Nov 3.`,
    followUp: pick(['Want me to save it for later?', 'Want to see how it compares with another one?', 'Want me to add it to your demo cart?'])
  };
}

module.exports = { respond };
