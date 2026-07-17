// Real Estate world data — 15 cities, 150 unique assets, real-world price levels.
// Prices move on a weekly "game month": deterministic city cycles + news nudges
// + real player demand (ownership share of a city).

// Game time: 1 real week = 1 game month. Epoch chosen so month 0 is launch week.
export const RE_EPOCH = Date.UTC(2026, 6, 6); // Mon Jul 6 2026
export function currentGameMonth() {
  return Math.max(0, Math.floor((Date.now() - RE_EPOCH) / (7 * 24 * 3600 * 1000)));
}

function seededRand(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s = Math.imul(s ^ (s >>> 16), 0x45d9f3b); s ^= s >>> 16; return (s >>> 0) / 0xffffffff; };
}
function hashStr(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0;
  return h >>> 0;
}

// ── Cities ──────────────────────────────────────────────────────────────────
// priceIndex ≈ cost multiplier vs global average. lat/lng for the globe.
export const CITIES = [
  { id: 'lagos',   name: 'Lagos',       country: 'Nigeria',   flag: '🇳🇬', lat: 6.52,   lng: 3.37,    priceIndex: 0.10, vibe: 'Fast-growing megacity — cheap entry, big swings' },
  { id: 'jakarta', name: 'Jakarta',     country: 'Indonesia', flag: '🇮🇩', lat: -6.2,   lng: 106.85,  priceIndex: 0.14, vibe: 'Sprawling boomtown on the rise' },
  { id: 'mumbai',  name: 'Mumbai',      country: 'India',     flag: '🇮🇳', lat: 19.08,  lng: 72.88,   priceIndex: 0.22, vibe: 'Bollywood, finance and relentless demand' },
  { id: 'mexico',  name: 'Mexico City', country: 'Mexico',    flag: '🇲🇽', lat: 19.43,  lng: -99.13,  priceIndex: 0.24, vibe: 'Culture capital with hungry rental demand' },
  { id: 'saopaulo',name: 'São Paulo',   country: 'Brazil',    flag: '🇧🇷', lat: -23.55, lng: -46.63,  priceIndex: 0.26, vibe: "South America's business engine" },
  { id: 'warsaw',  name: 'Warsaw',      country: 'Poland',    flag: '🇵🇱', lat: 52.23,  lng: 21.01,   priceIndex: 0.38, vibe: 'Europe’s scrappy growth story' },
  { id: 'seoul',   name: 'Seoul',       country: 'South Korea', flag: '🇰🇷', lat: 37.57, lng: 126.98, priceIndex: 0.60, vibe: 'Tech, K-culture and vertical living' },
  { id: 'berlin',  name: 'Berlin',      country: 'Germany',   flag: '🇩🇪', lat: 52.52,  lng: 13.40,   priceIndex: 0.65, vibe: 'Creative capital, rent-controlled quirks' },
  { id: 'madrid',  name: 'Madrid',      country: 'Spain',     flag: '🇪🇸', lat: 40.42,  lng: -3.70,   priceIndex: 0.62, vibe: 'Sun, tapas and steady yields' },
  { id: 'toronto', name: 'Toronto',     country: 'Canada',    flag: '🇨🇦', lat: 43.65,  lng: -79.38,  priceIndex: 0.85, vibe: 'Immigration-fuelled housing pressure' },
  { id: 'dublin',  name: 'Dublin',      country: 'Ireland',   flag: '🇮🇪', lat: 53.35,  lng: -6.26,   priceIndex: 0.90, vibe: 'Tech HQs meet a housing squeeze' },
  { id: 'tokyo',   name: 'Tokyo',       country: 'Japan',     flag: '🇯🇵', lat: 35.68,  lng: 139.69,  priceIndex: 0.95, vibe: 'The megacity that never overheats' },
  { id: 'sydney',  name: 'Sydney',      country: 'Australia', flag: '🇦🇺', lat: -33.87, lng: 151.21,  priceIndex: 1.10, vibe: 'Harbour views at harbour prices' },
  { id: 'london',  name: 'London',      country: 'UK',        flag: '🇬🇧', lat: 51.51,  lng: -0.13,   priceIndex: 1.40, vibe: 'Old money, new money, your money' },
  { id: 'nyc',     name: 'New York',    country: 'USA',       flag: '🇺🇸', lat: 40.71,  lng: -74.01,  priceIndex: 1.60, vibe: 'If you can buy here, you can buy anywhere' },
];

// ── Asset archetypes (base = global-average USD price, yield = annual rent %) ──
const ARCHETYPES = [
  { type: 'studio',    emoji: '🚪', base: 90_000,   yield: 0.075, label: 'Studio Flat' },
  { type: 'apartment', emoji: '🏢', base: 220_000,  yield: 0.065, label: 'City Apartment' },
  { type: 'house',     emoji: '🏠', base: 380_000,  yield: 0.055, label: 'Family House' },
  { type: 'townhouse', emoji: '🏘️', base: 550_000,  yield: 0.050, label: 'Townhouse' },
  { type: 'cafe',      emoji: '☕', base: 160_000,  yield: 0.110, label: 'Café' },
  { type: 'shop',      emoji: '🛍️', base: 300_000,  yield: 0.095, label: 'Retail Shop' },
  { type: 'school',    emoji: '🏫', base: 900_000,  yield: 0.060, label: 'Private School' },
  { type: 'office',    emoji: '🏙️', base: 1_400_000, yield: 0.080, label: 'Office Block' },
  { type: 'hotel',     emoji: '🏨', base: 2_500_000, yield: 0.090, label: 'Boutique Hotel' },
];

// Per-city flavor names: [studio, apartment, house, townhouse, cafe, shop, school, office, hotel, LANDMARK]
const FLAVOR = {
  lagos:    ['Yaba Studio', 'Lekki Heights Apt', 'Ikeja Family Home', 'Victoria Island Row', 'Surulere Suya Spot', 'Balogun Market Stall', 'Lagos Prep Academy', 'Marina Business Tower', 'Eko Beach Hotel', { name: 'Tafawa Balewa Square', emoji: '🏟️', base: 4_000_000, yield: 0.10 }],
  jakarta:  ['Kemang Studio', 'Sudirman Apartemen', 'Menteng Villa', 'Kebayoran Rowhouse', 'Kopi Tuku Café', 'Grand Indonesia Boutique', 'Jakarta Intl. School', 'SCBD Office Tower', 'Kota Tua Hotel', { name: 'Monas Plaza', emoji: '🗼', base: 5_500_000, yield: 0.095 }],
  mumbai:   ['Andheri Studio', 'Bandra Sea-View Apt', 'Juhu Bungalow', 'Colaba Heritage Row', 'Irani Chai Café', 'Linking Road Boutique', 'South Mumbai Academy', 'BKC Office Floor', 'Marine Drive Hotel', { name: 'Gateway Plaza', emoji: '🕌', base: 9_000_000, yield: 0.09 }],
  mexico:   ['Roma Norte Studio', 'Condesa Apartment', 'Coyoacán Casa', 'Polanco Townhome', 'Café de la Ciudad', 'Mercado Boutique', 'Colegio Reforma', 'Reforma Office Tower', 'Zócalo Grand Hotel', { name: 'Ángel de la Reforma Offices', emoji: '👼', base: 8_000_000, yield: 0.09 }],
  saopaulo: ['Vila Madalena Studio', 'Pinheiros Apartamento', 'Jardins Casa', 'Moema Sobrado', 'Café Paulista', 'Oscar Freire Boutique', 'Colégio Paulista', 'Faria Lima Offices', 'Hotel Ibirapuera', { name: 'Avenida Paulista Tower', emoji: '🏦', base: 10_000_000, yield: 0.088 }],
  warsaw:   ['Praga Studio', 'Mokotów Apartment', 'Żoliborz House', 'Old Town Rowhouse', 'Kawiarnia Nowa', 'Nowy Świat Boutique', 'Warsaw Lyceum', 'Wola Business Center', 'Hotel Bristol Annex', { name: 'Palace View Offices', emoji: '🏰', base: 12_000_000, yield: 0.085 }],
  seoul:    ['Hongdae Studio', 'Gangnam Officetel', 'Seongbuk House', 'Bukchon Hanok Row', 'Ikseon Tea House', 'Myeongdong K-Beauty Shop', 'Seoul Global Academy', 'Yeouido Office Tower', 'Han River Hotel', { name: 'Gangnam Media Tower', emoji: '📺', base: 25_000_000, yield: 0.082 }],
  berlin:   ['Neukölln Studio', 'Prenzlauer Altbau', 'Charlottenburg Haus', 'Kreuzberg Rowhouse', 'Späti & Café', 'Hackescher Markt Boutique', 'Berlin Intl. Schule', 'Potsdamer Platz Offices', 'Mitte Design Hotel', { name: 'Alexanderplatz Tower', emoji: '📡', base: 28_000_000, yield: 0.08 }],
  madrid:   ['Lavapiés Studio', 'Malasaña Piso', 'Chamberí Casa', 'La Latina Rowhouse', 'Churrería Real', 'Gran Vía Boutique', 'Colegio de Madrid', 'Castellana Offices', 'Hotel Puerta del Sol', { name: 'Plaza Mayor Arcade', emoji: '🏛️', base: 26_000_000, yield: 0.08 }],
  toronto:  ['Kensington Studio', 'King West Condo', 'The Beaches House', 'Cabbagetown Row', 'Queen St Coffee Bar', 'Yorkville Boutique', 'Upper Canada Academy', 'Bay Street Offices', 'Distillery District Hotel', { name: 'Harbourfront Tower', emoji: '🗼', base: 38_000_000, yield: 0.075 }],
  dublin:   ['Rathmines Bedsit', 'Grand Canal Dock Apt', 'Clontarf Semi-D', 'Portobello Terrace', 'Temple Bar Pub', 'Grafton Street Boutique', "St. Enda's College", 'IFSC Office Block', 'The Liberties Hotel', { name: 'The Spire Quarter', emoji: '🗼', base: 42_000_000, yield: 0.078 }],
  tokyo:    ['Nakano 1K Studio', 'Shibuya Mansion Apt', 'Setagaya House', 'Yanaka Machiya Row', 'Golden Gai Izakaya', 'Ginza Boutique', 'Tokyo Intl. Academy', 'Marunouchi Office Floor', 'Shinjuku Capsule Hotel Deluxe', { name: 'Shibuya Crossing Tower', emoji: '🗼', base: 45_000_000, yield: 0.072 }],
  sydney:   ['Newtown Studio', 'Bondi Beach Apt', 'Paddington Terrace House', 'Surry Hills Row', 'Flat White Roastery', 'The Rocks Boutique', 'Harbour Grammar School', 'Barangaroo Offices', 'Manly Beachfront Hotel', { name: 'Opera Quay Tower', emoji: '🎭', base: 55_000_000, yield: 0.07 }],
  london:   ['Peckham Studio', 'Shoreditch Loft', 'Islington Terrace', 'Notting Hill Rowhouse', 'Borough Market Café', 'Savile Row Tailor', 'Kensington Prep School', 'Canary Wharf Offices', 'Mayfair Boutique Hotel', { name: 'The Shard View Floors', emoji: '🔷', base: 90_000_000, yield: 0.065 }],
  nyc:      ['East Village Studio', 'Williamsburg Loft', 'Park Slope Brownstone', 'West Village Rowhouse', 'SoHo Espresso Bar', 'Fifth Avenue Boutique', 'Manhattan Prep Academy', 'Midtown Office Floors', 'Tribeca Boutique Hotel', { name: 'Empire View Tower', emoji: '🗽', base: 120_000_000, yield: 0.06 }],
};

// ── Build the 150 assets ────────────────────────────────────────────────────
export const RE_ASSETS = CITIES.flatMap(city => {
  const flavors = FLAVOR[city.id];
  const assets = ARCHETYPES.map((a, i) => {
    const rand = seededRand(hashStr(city.id + a.type));
    const wobble = 0.85 + rand() * 0.3; // ±15% so no two cities are identical
    return {
      id: `${city.id}-${a.type}`,
      cityId: city.id,
      name: flavors[i],
      emoji: a.emoji,
      type: a.type,
      label: a.label,
      basePrice: Math.round(a.base * city.priceIndex * wobble / 1000) * 1000,
      baseYield: a.yield * (0.9 + rand() * 0.25),
      landmark: false,
    };
  });
  const lm = flavors[9];
  assets.push({
    id: `${city.id}-landmark`,
    cityId: city.id,
    name: lm.name,
    emoji: lm.emoji,
    type: 'landmark',
    label: 'Landmark',
    basePrice: Math.round(lm.base * city.priceIndex / 1000) * 1000,
    baseYield: lm.yield,
    landmark: true,
  });
  return assets;
});

export function getAssetById(id) { return RE_ASSETS.find(a => a.id === id); }
export function getCityById(id)  { return CITIES.find(c => c.id === id); }
export function getCityAssets(cityId) { return RE_ASSETS.filter(a => a.cityId === cityId); }

// ── Price dynamics ──────────────────────────────────────────────────────────
// City cycle: layered sine waves seeded per city → multi-year boom/bust, same
// for every player. Returns a multiplier around 1.0 (±~25%).
export function cityCycleMult(cityId, month = currentGameMonth()) {
  const h = hashStr(cityId);
  const p1 = 18 + (h % 14);        // 18–31 month primary cycle
  const p2 = 7 + (h % 5);          // shorter secondary wave
  const ph1 = (h % 100) / 100 * Math.PI * 2;
  const ph2 = (h % 37) / 37 * Math.PI * 2;
  return 1
    + 0.18 * Math.sin((month / p1) * Math.PI * 2 + ph1)
    + 0.07 * Math.sin((month / p2) * Math.PI * 2 + ph2);
}

// News nudge: today's cached news sentiment gently sways big financial hubs.
const NEWS_CITIES = ['nyc', 'london', 'tokyo', 'seoul', 'dublin', 'toronto'];
export function newsNudge(cityId) {
  if (!NEWS_CITIES.includes(cityId)) return 1;
  try {
    const cache = JSON.parse(localStorage.getItem('wealthquest_news_cache') ?? 'null');
    if (!cache?.data?.length) return 1;
    let score = 0;
    cache.data.forEach(n => { if (n.sentiment === 'positive') score++; if (n.sentiment === 'negative') score--; });
    return 1 + Math.max(-0.05, Math.min(0.05, score * 0.01));
  } catch { return 1; }
}

// Player demand: share of a city's assets owned by players pushes prices up
// (0 owned → 1.0, fully owned → +15%). Pass ownership map from the engine.
export function demandMult(cityId, ownedCounts = {}) {
  const total = 10;
  const owned = ownedCounts[cityId] ?? 0;
  return 1 + (owned / total) * 0.15;
}

export function assetPrice(asset, ownedCounts = {}, month = currentGameMonth()) {
  return Math.round(asset.basePrice * cityCycleMult(asset.cityId, month) * newsNudge(asset.cityId) * demandMult(asset.cityId, ownedCounts) * eventMult(asset.cityId, month));
}

// ── City events ─────────────────────────────────────────────────────────────
// 2–3 cities get a random event each game month — deterministic (same for
// every player) so the shared-world prices stay consistent.
const EVENT_TEMPLATES = {
  boom: [
    c => ({ emoji: '🏗️', title: `Tech campus announced in ${c.name}`, desc: `A major tech employer is opening a campus in ${c.name}. Landlords expect a wave of new tenants and rising property demand.` }),
    c => ({ emoji: '🚇', title: `New metro line opens in ${c.name}`, desc: `The new transit line just cut commute times across ${c.name} — well-connected neighbourhoods are seeing prices climb.` }),
    c => ({ emoji: '🏟️', title: `${c.name} wins bid to host world games`, desc: `Hotels, rentals and commercial space in ${c.name} are heating up ahead of the influx of visitors and investment.` }),
    c => ({ emoji: '🏦', title: `Interest-rate relief boosts ${c.name} buyers`, desc: `Cheaper borrowing has buyers rushing back into the ${c.name} market. Sellers are raising asking prices.` }),
  ],
  bust: [
    c => ({ emoji: '🌊', title: `Flooding hits parts of ${c.name}`, desc: `Storm flooding has damaged properties across ${c.name}. Insurers are spooked and buyers are pausing.` }),
    c => ({ emoji: '📉', title: `Major employer leaves ${c.name}`, desc: `A big employer is relocating out of ${c.name}, taking thousands of jobs — and rental demand — with it.` }),
    c => ({ emoji: '🏚️', title: `Oversupply glut in ${c.name}`, desc: `A construction boom has flooded ${c.name} with unsold units. Prices are softening as sellers compete.` }),
    c => ({ emoji: '📜', title: `New property tax announced in ${c.name}`, desc: `${c.name} authorities announced higher property taxes, squeezing landlord margins and cooling the market.` }),
  ],
};

export function getMonthEvents(month = currentGameMonth()) {
  const rand = seededRand(hashStr('cityevents-' + month));
  // seeded fisher-yates over cities
  const pool = [...CITIES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const n = 2 + Math.floor(rand() * 2); // 2–3 events
  return pool.slice(0, n).map(city => {
    const boom = rand() > 0.45;
    const tpl = EVENT_TEMPLATES[boom ? 'boom' : 'bust'];
    const make = tpl[Math.floor(rand() * tpl.length)];
    const pct = boom ? +(4 + rand() * 6).toFixed(1) : -+(3 + rand() * 5).toFixed(1);
    return { cityId: city.id, city, boom, pct, month, ...make(city) };
  });
}

// Price shock from this month's event (if the city has one)
export function eventMult(cityId, month = currentGameMonth()) {
  const ev = getMonthEvents(month).find(e => e.cityId === cityId);
  return ev ? 1 + ev.pct / 100 : 1;
}

export function getCityEvent(cityId, month = currentGameMonth()) {
  return getMonthEvents(month).find(e => e.cityId === cityId) ?? null;
}

// Monthly rent for an asset at current valuation
export function monthlyRent(asset, ownedCounts = {}) {
  return Math.round(assetPrice(asset, ownedCounts) * asset.baseYield / 12);
}

// Is this city hot or cold right now? (price momentum vs 2 months ago)
export function cityTrend(cityId, month = currentGameMonth()) {
  const now = cityCycleMult(cityId, month);
  const then = cityCycleMult(cityId, Math.max(0, month - 2));
  const chg = (now - then) / then;
  if (chg > 0.015) return { label: 'HOT', emoji: '🔥', dir: 1, pct: chg * 100 };
  if (chg < -0.015) return { label: 'COOLING', emoji: '🧊', dir: -1, pct: chg * 100 };
  return { label: 'STEADY', emoji: '➖', dir: 0, pct: chg * 100 };
}

// ── Mortgage math ───────────────────────────────────────────────────────────
export const MIN_DOWN_PCT = 0.20;
export const MORTGAGE_RATES = { 60: 0.065, 120: 0.075 }; // annual, by term (game months)

export function monthlyPayment(principal, annualRate, termMonths) {
  const r = annualRate / 12;
  if (r === 0) return principal / termMonths;
  return principal * (r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}
