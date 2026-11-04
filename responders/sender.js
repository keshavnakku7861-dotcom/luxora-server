// SENDER responder: reuses rules.js for product matching, rewrites the replies in a warm, casual voice.
// Contract: async respond(message, ctx) -> { reply, products, title?, followUp? }
const rules = require('./rules');
const { categories } = require('../products');

const money = n => '$' + (Number.isInteger(n) ? n : n.toFixed(2));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

async function respond(message, ctx = {}) {
  const text = String(message || '').trim();
  const lower = text.toLowerCase();

  if (/\b(are you (a )?(human|real|person|bot|ai|robot)|who are you|what are you|real person)\b/.test(lower)) {
    return { reply: "I'm Luxora's AI assistant, not a person, but I'm happy to help you find something good. What are you shopping for?", products: [] };
  }
  if (/^(hi|hello|hey|yo|hiya|sup|good (morning|afternoon|evening))\b/.test(lower) && text.split(/\s+/).length <= 4) {
    return { reply: pick(["Hey! What are you on the hunt for today?", "Hi there! Looking for anything in particular? Rings, watches, earbuds, headphones?", "Hey! Tell me what you need and your budget, and I'll find you something nice."]), products: [] };
  }
  if (/\b(thanks|thank you|thx|ty)\b/.test(lower)) {
    return { reply: pick(["Anytime! Shout if you need anything else.", "Happy to help! Enjoy your new gear."]), products: [] };
  }

  if (!/\b(rings?|watch(es)?|buds|earbuds?|headphones?|cans)\b/.test(lower) && /\b(grocer(y|ies)|food|snacks?|fashion|clothes|clothing|something to wear|shoes|sneakers|dress(es)?|shirts?|jackets?)\b/.test(lower)) {
    const which = /\b(fashion|clothes|clothing|something to wear|shoes|sneakers|dress(es)?|shirts?|jackets?)\b/.test(lower) ? 'Fashion' : 'Groceries';
    return { reply: `${which} isn't on Luxora's shelves just yet, so I can't recommend anything there right now. What I can do well is electronics: smart rings, smartwatches, earbuds and headphones. Want me to pull up the top picks?`, products: [] };
  }

  const out = await rules.respond(text, ctx);
  const p = out.products || [];

  if (/order status|track|where is|delivery|shipping/.test(lower) && p.length === 0) {
    return { reply: "Luxora doesn't take or ship orders itself, so there's nothing for me to track here. Use the Buy at button on a product to buy from the retailer, and you can track the order with them.", products: [] };
  }
  if (p.length === 0) {
    return { reply: "I can help with smart rings, smartwatches, earbuds and headphones. Tell me what you'll use it for and roughly what you want to spend, like \"earbuds for my commute under $150\".", products: [] };
  }
  if (out.title === 'Side by side' && p.length >= 2) {
    return { ...out, reply: `${pick(['Okay, here is how they stack up.', 'Good pair to compare.', 'Let me line them up for you.'])} ${out.reply}`, followUp: 'Want me to save one for later?' };
  }
  if (out.title === 'Your pick') {
    return { ...out, reply: `${pick(['Easy one!', 'Good question.', 'Sure thing.'])} ${out.reply}` };
  }
  if (out.title === 'Closest match') {
    const c = p[0];
    return { ...out, reply: `Hmm, nothing quite fits that budget, sorry! The closest I've got is ${c.name} at ${money(c.price)} (price checked Nov 3, 2026).`, followUp: 'Want me to see what a little more stretch gets you?' };
  }

  const top = p[0];
  const extra = p.length > 1 ? ` If you want options, ${p.slice(1).map(x => `${x.name} (${money(x.price)})`).join(' and ')} ${p.length > 2 ? 'are' : 'is'} worth a look too.` : '';
  const opener = pick(['Good call!', 'Ooh, nice.', 'Got you.', 'Love it.']);
  return {
    ...out,
    reply: `${opener} I'd go with ${top.name}: ${money(top.price)} at ${top.retailer.name} (price checked Nov 3, 2026).${extra}`,
    followUp: pick(['Want me to save it for later?', 'Want to see how it compares with another one?', 'Want me to add it to your cart? (Checkout here is a demo; you buy at the retailer.)'])
  };
}

module.exports = { respond };
