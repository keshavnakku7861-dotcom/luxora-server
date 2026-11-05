// REAL PRODUCTS (names, brands, prices and retailer links) from the DEALS bot's verified mapping, prices checked Nov 3, 2026
// (America/Chicago). Source: deals-proposal/product-mapping.json. Prices change; always confirm at the retailer.
// Ids are kept from the earlier prototype so saved items, carts and product photo filenames keep working.
// Photos in public/images/<id>-1..3.webp are generated, illustrative images, NOT official product photos.
// Fields: store = brand, retailer = where the "Buy at" button goes, alsoAt = other retailers, listPrice = verified higher
// price (only set where a deal in deals.json is verified), checkedAt = date the price was read from the retailer page.
const CHECKED = '2026-11-03';
const RING_SIZES = ['Sizing kit', 'Size 6', 'Size 7', 'Size 8', 'Size 9', 'Size 10', 'Size 11'];
const products = [
  { id: 'aura-ring-4', name: 'Oura Ring 4', store: 'Oura', category: 'smart-rings', kind: 'ring', tone: 'silver',
    aliases: ['oura ring 4', 'oura 4', 'ring 4'],
    description: 'Titanium smart ring (Silver) for sleep, readiness and activity tracking.',
    highlights: ['Titanium', 'Sleep + readiness tracking'],
    price: 349, tags: ['health', 'sleep', 'everyday', 'fitness', 'titanium'],
    sizes: RING_SIZES, colors: ['silver', 'midnight'], optionsNote: 'Confirm your ring size at Oura before you buy; a sizing kit is recommended.',
    /* finish variants: Silver is the base listing; Ceramic Midnight is its own Amazon page (B0FKQW8LTZ, $399 list; opened Nov 4, 2026) */
    variants: { midnight: { label: 'Ceramic Midnight', name: 'Oura Ring 4 Ceramic Midnight', price: 399, asin: 'B0FKQW8LTZ', imageId: 'aura-ring-4-midnight',
      description: 'Ceramic smart ring (Midnight) for sleep, readiness and activity tracking.', retailer: { name: 'Amazon', url: 'https://www.amazon.com/dp/B0FKQW8LTZ' }, checkedAt: '2026-11-04' } },
    colorNames: { silver: 'Silver', midnight: 'Ceramic Midnight' },
    retailer: { name: 'Oura', url: 'https://ouraring.com/store/rings/oura-ring-4/silver' }, alsoAt: [], checkedAt: CHECKED },
  { id: 'nova-ring', name: 'Samsung Galaxy Ring', store: 'Samsung', category: 'smart-rings', kind: 'ring', tone: 'silver',
    aliases: ['samsung galaxy ring', 'galaxy ring', 'samsung ring'],
    description: 'Titanium smart ring (Titanium Silver) from Samsung. Works with Android and Samsung phones only.',
    highlights: ['Titanium', 'Android / Samsung only'],
    price: 324.99, tags: ['health', 'sleep', 'titanium', 'everyday', 'fitness', 'android'],
    sizes: RING_SIZES, colors: ['silver'], optionsNote: 'Confirm your ring size at the retailer before you buy. Samsung.com lists the ring "from $299.99" before trade-in; the Amazon price shown here was verified.',
    retailer: { name: 'Amazon', url: 'https://www.amazon.com/SAMSUNG-Subscription-Monitoring-Titanium-Manufacturer/dp/B0D3JDPB11' },
    alsoAt: [{ name: 'Samsung', url: 'https://www.samsung.com/us/rings/galaxy-ring/' }], checkedAt: CHECKED },
  { id: 'ring-pro', name: 'Oura Ring 5', store: 'Oura', category: 'smart-rings', kind: 'ring', tone: 'silver',
    aliases: ['oura ring 5', 'oura 5', 'ring 5'],
    description: "Oura's newest smart ring (Silver).",
    highlights: ['Newest Oura ring'],
    price: 399, tags: ['health', 'sleep', 'premium', 'everyday', 'fitness'],
    sizes: RING_SIZES, colors: ['silver'], optionsNote: 'Confirm your ring size at Oura before you buy; a sizing kit is recommended. Other finishes may cost more.',
    retailer: { name: 'Oura', url: 'https://ouraring.com/store/rings/oura-ring-5/silver' }, alsoAt: [], checkedAt: CHECKED },
  { id: 'pulse-watch-s', name: 'Garmin Forerunner 165', store: 'Garmin', category: 'smartwatches', kind: 'watch', tone: 'dark',
    aliases: ['garmin forerunner 165', 'forerunner 165', 'forerunner', 'garmin'],
    description: 'GPS running watch with an AMOLED display. Comes in a single 43 mm case size.',
    highlights: ['GPS', 'AMOLED display', '43 mm case'],
    price: 249.99, tags: ['fitness', 'gps', 'running', 'health', 'workout'],
    sizes: ['One size'], colors: ['gray'], optionsNote: 'Single 43 mm case size.',
    retailer: { name: 'Garmin', url: 'https://www.garmin.com/en-US/p/1055469/' },
    alsoAt: [{ name: 'Running Warehouse', url: 'https://www.runningwarehouse.com/Garmin_Forerunner_165_GPS_Watch/descpage-GFR165.html' }], checkedAt: CHECKED },
  { id: 'orbit-watch', name: 'Apple Watch Series 12', store: 'Apple', category: 'smartwatches', kind: 'watch', tone: 'silver',
    aliases: ['apple watch series 12', 'apple watch', 'series 12'],
    description: 'The current Apple Watch on apple.com.',
    highlights: ['Current Apple Watch', 'Price is a starting price'],
    price: 399, priceFrom: true, tags: ['premium', 'health', 'everyday', 'sleep', 'fitness', 'iphone'],
    sizes: ['One size'], colors: ['standard'], optionsNote: 'Starting price. Case size, finish and band are chosen at Apple.',
    retailer: { name: 'Apple', url: 'https://www.apple.com/shop/buy-watch/apple-watch' }, alsoAt: [], checkedAt: CHECKED },
  { id: 'drift-buds', name: 'Sony WF-C710N', store: 'Sony', category: 'earbuds', kind: 'earbuds', tone: 'dark',
    aliases: ['sony wf-c710n', 'wf-c710n', 'c710n'],
    description: 'Noise-cancelling wireless earbuds (Black). Up to 30 hours total battery with ANC, IPX4 water resistance.',
    highlights: ['Noise cancelling', 'Up to 30 h total battery with ANC', 'IPX4'],
    price: 99.99, listPrice: 129.99, tags: ['music', 'commute', 'noise', 'battery', 'everyday', 'workout'],
    sizes: ['One size'], colors: ['black'],
    retailer: { name: 'Sony', url: 'https://electronics.sony.com/audio/headphones/all-headphones/p/wfc710n-b' }, alsoAt: [], checkedAt: CHECKED },
  { id: 'echo-buds-pro', name: 'Apple AirPods Pro 3', store: 'Apple', category: 'earbuds', kind: 'earbuds', tone: 'silver',
    aliases: ['apple airpods pro 3', 'airpods pro 3', 'airpods pro', 'airpods'],
    description: "Apple's current AirPods Pro. $199 at Amazon (sold by Amazon.com) versus $249 at apple.com.",
    highlights: ['Current AirPods Pro', '$199 at Amazon vs $249 at Apple'],
    price: 199, listPrice: 249, tags: ['music', 'noise', 'premium', 'commute', 'workout', 'iphone', 'everyday'],
    sizes: ['One size'], colors: ['white'], optionsNote: 'Ear tip sizes are chosen when you unbox them.',
    retailer: { name: 'Amazon', url: 'https://www.amazon.com/dp/B0FQFB8FMG' },
    alsoAt: [{ name: 'Apple', url: 'https://www.apple.com/shop/buy-airpods/airpods-pro-3', price: 249 }], checkedAt: CHECKED },
  { id: 'studio-cans', name: 'Sony WH-1000XM5', store: 'Sony', category: 'headphones', kind: 'headphones', tone: 'dark',
    aliases: ['sony wh-1000xm5', 'wh-1000xm5', '1000xm5', 'xm5'],
    description: 'Over-ear noise-cancelling headphones (Black). 30 hours of battery and a design that folds flat.',
    highlights: ['Noise cancelling', '30 h battery', 'Folds flat'],
    price: 199.99, listPrice: 399.99, tags: ['music', 'noise', 'premium', 'work', 'travel', 'battery', 'commute'],
    sizes: ['One size'], colors: ['black'],
    retailer: { name: 'Sony', url: 'https://electronics.sony.com/audio/headphones/headband/p/wh1000xm5-b' }, alsoAt: [], checkedAt: CHECKED },
  { id: 'calm-over-ear', name: 'Sony WH-CH720N', store: 'Sony', category: 'headphones', kind: 'headphones', tone: 'dark',
    aliases: ['sony wh-ch720n', 'wh-ch720n', 'ch720n'],
    description: 'Lightweight over-ear noise-cancelling headphones (Black) with 35 hours of battery.',
    highlights: ['Noise cancelling', '35 h battery', 'Lightweight'],
    price: 89.99, listPrice: 179.99, tags: ['music', 'noise', 'work', 'travel', 'battery', 'commute'],
    sizes: ['One size'], colors: ['black'],
    retailer: { name: 'Sony', url: 'https://electronics.sony.com/audio/headphones/headband/p/whch720n-b' }, alsoAt: [], checkedAt: CHECKED },
  /* added Nov 4, 2026 (Keshav approved): each Amazon page opened live that day; title, price and availability confirmed */
  { id: 'ipad-mini-a20', name: 'Apple iPad mini (A20 Pro)', store: 'Apple', category: 'tablets', kind: 'tablet', tone: 'dark',
    aliases: ['apple ipad mini', 'ipad mini a20 pro', 'ipad mini', 'ipad'],
    description: 'Apple iPad mini with the A20 Pro chip: 128GB, Wi-Fi, Midnight.',
    highlights: ['A20 Pro chip', '128GB, Wi-Fi', 'Compact tablet'],
    price: 699, tags: ['premium', 'work', 'travel', 'reading', 'iphone', 'everyday'],
    sizes: ['One size'], colors: ['standard'], optionsNote: 'This listing is the 128GB Wi-Fi model in Midnight.',
    preorder: { releases: '2026-11-06' },
    retailer: { name: 'Amazon', url: 'https://www.amazon.com/dp/B0HPC1JLCQ' }, alsoAt: [], checkedAt: '2026-11-04' },
  { id: 'kindle-16gb-2026', name: 'Amazon Kindle 16GB (2026)', store: 'Amazon', category: 'e-readers', kind: 'ereader', tone: 'dark',
    aliases: ['amazon kindle', 'kindle 16gb', 'kindle'],
    description: 'The newest basic Kindle: 6-inch glare-free display, 16GB, thinner and lighter. This listing shows lockscreen ads.',
    highlights: ['6-inch display', '16GB', 'With lockscreen ads'],
    price: 149.99, tags: ['reading', 'travel', 'everyday', 'battery'],
    sizes: ['One size'], colors: ['standard'], optionsNote: 'This listing is the ad-supported 16GB model; the version without lockscreen ads costs more on Amazon.',
    retailer: { name: 'Amazon', url: 'https://www.amazon.com/dp/B0FXJ8VZ39' }, alsoAt: [], checkedAt: '2026-11-04' },
  { id: 'echo-dot-2026', name: 'Amazon Echo Dot (2026)', store: 'Amazon', category: 'smart-home', kind: 'speaker', tone: 'dark',
    aliases: ['amazon echo dot', 'echo dot', 'echo'],
    description: 'Compact Alexa smart speaker and smart home hub (Graphite), designed for Alexa+.',
    highlights: ['Smart speaker', 'Smart home hub', 'Designed for Alexa+'],
    price: 99.99, tags: ['music', 'home', 'everyday', 'alexa'],
    sizes: ['One size'], colors: ['standard'], optionsNote: 'This listing is the Graphite colour.',
    retailer: { name: 'Amazon', url: 'https://www.amazon.com/dp/B0FXN2JWST' }, alsoAt: [], checkedAt: '2026-11-04' },
  { id: 'alexa-tablet-8', name: 'Amazon Alexa Tablet 8 (64GB)', store: 'Amazon', category: 'tablets', kind: 'tablet', tone: 'dark',
    aliases: ['amazon alexa tablet 8', 'alexa tablet 8', 'alexa tablet', 'fire tablet', 'tablette', 'tablettes', 'tableta', 'tabletas'],
    description: '8.7-inch Alexa tablet with 4GB RAM and 64GB storage (Graphite), with Google Play. This listing has no lockscreen ads.',
    highlights: ['8.7-inch display', '4GB RAM, 64GB', 'Google Play'],
    price: 219.99, tags: ['reading', 'travel', 'everyday', 'alexa', 'home'],
    sizes: ['One size'], colors: ['standard'], optionsNote: 'This listing is the 64GB Graphite model without lockscreen ads.',
    retailer: { name: 'Amazon', url: 'https://www.amazon.com/dp/B0H8ZN512S' }, alsoAt: [], checkedAt: '2026-11-04' }
];

/* Amazon.com product pages (checked in a browser Nov 3, 2026) with Keshav's Amazon Associates tag. Every product has a direct /dp/ page. */
const AMAZON_TAG = 'luxora004-20';
const AMAZON_DISCLOSURE = 'As an Amazon Associate, Luxora earns from qualifying purchases.';
const ASIN = {
  'ipad-mini-a20': 'B0HPC1JLCQ',      // Apple iPad mini (A20 Pro) — Midnight, 128GB Wi-Fi ($699.00, pre-order, releases Nov 6, 2026)
  'kindle-16gb-2026': 'B0FXJ8VZ39',   // Amazon Kindle 16GB (newest model), lockscreen ad-supported ($149.99, in stock)
  'echo-dot-2026': 'B0FXN2JWST',      // Amazon Echo Dot (newest model), Graphite ($99.99, in stock)
  'alexa-tablet-8': 'B0H8ZN512S',     // Amazon Alexa Tablet 8, 4GB RAM, 64GB, Graphite, without lockscreen ads ($219.99, in stock)
  'aura-ring-4': 'B0D9WT1S2T',     // Oura Ring 4 Smart Ring - Silver
  'nova-ring': 'B0D3JDPB11',       // SAMSUNG Galaxy Ring
  'ring-pro': 'B0GRJVBPH3',
  'pulse-watch-s': 'B0CT3SGHXL',   // Garmin Forerunner 165, 43mm, Black
  'orbit-watch': 'B0HJBCX8VS',     // Apple Watch Series 12 GPS 42mm
  'drift-buds': 'B0DWHPBK42',      // Sony WF-C710N, Black
  'echo-buds-pro': 'B0FQFB8FMG',   // Apple AirPods Pro 3
  'studio-cans': 'B09XS7JWHH',     // Sony WH-1000XM5, Black
  'calm-over-ear': 'B0BS1QCFHX'    // Sony WH-CH720N, Black
};
products.forEach(p => {
  const asin = ASIN[p.id];
  p.amazon = { asin, url: `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`, kind: 'product-page' };
  if (p.retailer.name === 'Amazon') p.retailer.url = p.amazon.url;      // Amazon is already the main retailer: one tagged link
  (p.alsoAt || []).forEach(a => { if (a.name === 'Amazon') a.url = p.amazon.url; });
  Object.values(p.variants || {}).forEach(v => { v.amazon = { asin: v.asin, url: `https://www.amazon.com/dp/${v.asin}?tag=${AMAZON_TAG}`, kind: 'product-page' }; if (v.retailer && v.retailer.name === 'Amazon') v.retailer.url = v.amazon.url; });
});

const categories = {
  'smart-rings': { label: 'smart rings', words: ['ring', 'rings', 'oura', 'smart ring', 'galaxy ring', 'bague', 'bagues', 'anillo', 'anillos'] },
  'smartwatches': { label: 'smartwatches', words: ['watch', 'watches', 'smartwatch', 'smartwatches', 'wearable', 'wearables', 'garmin', 'forerunner', 'montre', 'montres', 'reloj', 'relojes', 'uhr'] },
  'earbuds': { label: 'earbuds', words: ['earbud', 'earbuds', 'buds', 'airpods', 'earphones'] },
  'headphones': { label: 'headphones', words: ['headphone', 'headphones', 'cans', 'over-ear', 'overear', 'casque', 'casques', 'auriculares'] },
  'tablets': { label: 'tablets', words: ['tablet', 'tablets', 'ipad', 'ipads', 'ipad mini', 'alexa tablet', 'fire tablet', 'tablette', 'tablettes', 'tableta', 'tabletas'] },
  'e-readers': { label: 'e-readers', words: ['kindle', 'kindles', 'e-reader', 'e-readers', 'ereader', 'ereaders', 'e-book', 'ebook', 'ebooks', 'reader', 'liseuse', 'liseuses', 'lector', 'lectores'] },
  'smart-home': { label: 'smart home devices', words: ['echo', 'echo dot', 'smart speaker', 'smart speakers', 'speaker', 'speakers', 'smart home', 'alexa speaker', 'home assistant', 'enceinte', 'enceintes', 'altavoz', 'altavoces', 'lautsprecher']}
};

module.exports = { products, categories, CHECKED, AMAZON_TAG, AMAZON_DISCLOSURE };
