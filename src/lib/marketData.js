// Market data — Yahoo Finance (stocks/ETFs) + CoinGecko (crypto)
// ~90 assets across NYSE, NASDAQ, and crypto

export const ASSETS = [
  // ── Technology ──────────────────────────────────────────────
  { id: 'AAPL',  name: 'Apple',              symbol: 'AAPL',  type: 'stock', emoji: '🍎', sector: 'Technology' },
  { id: 'MSFT',  name: 'Microsoft',          symbol: 'MSFT',  type: 'stock', emoji: '🪟', sector: 'Technology' },
  { id: 'GOOGL', name: 'Alphabet',           symbol: 'GOOGL', type: 'stock', emoji: '🔍', sector: 'Technology' },
  { id: 'NVDA',  name: 'NVIDIA',             symbol: 'NVDA',  type: 'stock', emoji: '🎮', sector: 'Technology' },
  { id: 'META',  name: 'Meta',               symbol: 'META',  type: 'stock', emoji: '👥', sector: 'Technology' },
  { id: 'AVGO',  name: 'Broadcom',           symbol: 'AVGO',  type: 'stock', emoji: '🔌', sector: 'Technology' },
  { id: 'TSM',   name: 'TSMC',               symbol: 'TSM',   type: 'stock', emoji: '🔬', sector: 'Technology' },
  { id: 'ORCL',  name: 'Oracle',             symbol: 'ORCL',  type: 'stock', emoji: '🗄️', sector: 'Technology' },
  { id: 'CRM',   name: 'Salesforce',         symbol: 'CRM',   type: 'stock', emoji: '☁️', sector: 'Technology' },
  { id: 'AMD',   name: 'AMD',                symbol: 'AMD',   type: 'stock', emoji: '💾', sector: 'Technology' },
  { id: 'INTC',  name: 'Intel',              symbol: 'INTC',  type: 'stock', emoji: '⚙️', sector: 'Technology' },
  { id: 'QCOM',  name: 'Qualcomm',           symbol: 'QCOM',  type: 'stock', emoji: '📡', sector: 'Technology' },
  { id: 'ADBE',  name: 'Adobe',              symbol: 'ADBE',  type: 'stock', emoji: '🎨', sector: 'Technology' },
  { id: 'NOW',   name: 'ServiceNow',         symbol: 'NOW',   type: 'stock', emoji: '🔧', sector: 'Technology' },
  { id: 'SNOW',  name: 'Snowflake',          symbol: 'SNOW',  type: 'stock', emoji: '❄️', sector: 'Technology' },
  { id: 'PLTR',  name: 'Palantir',           symbol: 'PLTR',  type: 'stock', emoji: '🕵️', sector: 'Technology' },
  { id: 'PANW',  name: 'Palo Alto Networks', symbol: 'PANW',  type: 'stock', emoji: '🛡️', sector: 'Technology' },
  // ── Consumer ────────────────────────────────────────────────
  { id: 'AMZN',  name: 'Amazon',             symbol: 'AMZN',  type: 'stock', emoji: '📦', sector: 'Consumer' },
  { id: 'TSLA',  name: 'Tesla',              symbol: 'TSLA',  type: 'stock', emoji: '⚡', sector: 'Consumer' },
  { id: 'WMT',   name: 'Walmart',            symbol: 'WMT',   type: 'stock', emoji: '🛒', sector: 'Consumer' },
  { id: 'MCD',   name: "McDonald's",         symbol: 'MCD',   type: 'stock', emoji: '🍔', sector: 'Consumer' },
  { id: 'NKE',   name: 'Nike',               symbol: 'NKE',   type: 'stock', emoji: '👟', sector: 'Consumer' },
  { id: 'SBUX',  name: 'Starbucks',          symbol: 'SBUX',  type: 'stock', emoji: '☕', sector: 'Consumer' },
  { id: 'COST',  name: 'Costco',             symbol: 'COST',  type: 'stock', emoji: '🏬', sector: 'Consumer' },
  { id: 'HD',    name: 'Home Depot',         symbol: 'HD',    type: 'stock', emoji: '🏠', sector: 'Consumer' },
  { id: 'NFLX',  name: 'Netflix',            symbol: 'NFLX',  type: 'stock', emoji: '🎬', sector: 'Consumer' },
  { id: 'DIS',   name: 'Disney',             symbol: 'DIS',   type: 'stock', emoji: '🏰', sector: 'Consumer' },
  // ── Finance ─────────────────────────────────────────────────
  { id: 'JPM',   name: 'JPMorgan',           symbol: 'JPM',   type: 'stock', emoji: '🏦', sector: 'Finance' },
  { id: 'V',     name: 'Visa',               symbol: 'V',     type: 'stock', emoji: '💳', sector: 'Finance' },
  { id: 'MA',    name: 'Mastercard',         symbol: 'MA',    type: 'stock', emoji: '💲', sector: 'Finance' },
  { id: 'BAC',   name: 'Bank of America',    symbol: 'BAC',   type: 'stock', emoji: '🏛️', sector: 'Finance' },
  { id: 'GS',    name: 'Goldman Sachs',      symbol: 'GS',    type: 'stock', emoji: '🐂', sector: 'Finance' },
  { id: 'PYPL',  name: 'PayPal',             symbol: 'PYPL',  type: 'stock', emoji: '💰', sector: 'Finance' },
  { id: 'AXP',   name: 'American Express',   symbol: 'AXP',   type: 'stock', emoji: '🟦', sector: 'Finance' },
  { id: 'BLK',   name: 'BlackRock',          symbol: 'BLK',   type: 'stock', emoji: '🪨', sector: 'Finance' },
  { id: 'C',     name: 'Citigroup',          symbol: 'C',     type: 'stock', emoji: '🏙️', sector: 'Finance' },
  // ── Healthcare ──────────────────────────────────────────────
  { id: 'JNJ',   name: 'Johnson & Johnson',  symbol: 'JNJ',   type: 'stock', emoji: '💊', sector: 'Healthcare' },
  { id: 'UNH',   name: 'UnitedHealth',       symbol: 'UNH',   type: 'stock', emoji: '🏥', sector: 'Healthcare' },
  { id: 'LLY',   name: 'Eli Lilly',          symbol: 'LLY',   type: 'stock', emoji: '🧬', sector: 'Healthcare' },
  { id: 'PFE',   name: 'Pfizer',             symbol: 'PFE',   type: 'stock', emoji: '💉', sector: 'Healthcare' },
  { id: 'ABBV',  name: 'AbbVie',             symbol: 'ABBV',  type: 'stock', emoji: '🔬', sector: 'Healthcare' },
  { id: 'MRK',   name: 'Merck',              symbol: 'MRK',   type: 'stock', emoji: '🧪', sector: 'Healthcare' },
  // ── Energy ──────────────────────────────────────────────────
  { id: 'XOM',   name: 'ExxonMobil',         symbol: 'XOM',   type: 'stock', emoji: '⛽', sector: 'Energy' },
  { id: 'CVX',   name: 'Chevron',            symbol: 'CVX',   type: 'stock', emoji: '🛢️', sector: 'Energy' },
  { id: 'COP',   name: 'ConocoPhillips',     symbol: 'COP',   type: 'stock', emoji: '🔥', sector: 'Energy' },
  { id: 'NEE',   name: 'NextEra Energy',     symbol: 'NEE',   type: 'stock', emoji: '🌬️', sector: 'Energy' },
  // ── Industrials ─────────────────────────────────────────────
  { id: 'CAT',   name: 'Caterpillar',        symbol: 'CAT',   type: 'stock', emoji: '🚜', sector: 'Industrials' },
  { id: 'BA',    name: 'Boeing',             symbol: 'BA',    type: 'stock', emoji: '✈️', sector: 'Industrials' },
  { id: 'GE',    name: 'GE Aerospace',       symbol: 'GE',    type: 'stock', emoji: '⚙️', sector: 'Industrials' },
  { id: 'LMT',   name: 'Lockheed Martin',    symbol: 'LMT',   type: 'stock', emoji: '🛩️', sector: 'Industrials' },
  { id: 'UPS',   name: 'UPS',               symbol: 'UPS',   type: 'stock', emoji: '📮', sector: 'Industrials' },
  // ── Communication ───────────────────────────────────────────
  { id: 'T',     name: 'AT&T',               symbol: 'T',     type: 'stock', emoji: '📞', sector: 'Communication' },
  { id: 'VZ',    name: 'Verizon',            symbol: 'VZ',    type: 'stock', emoji: '📱', sector: 'Communication' },
  // ── Materials / Real Estate ─────────────────────────────────
  { id: 'FCX',   name: 'Freeport-McMoRan',   symbol: 'FCX',   type: 'stock', emoji: '🪙', sector: 'Materials' },
  { id: 'NEM',   name: 'Newmont',            symbol: 'NEM',   type: 'stock', emoji: '🥇', sector: 'Materials' },
  { id: 'AMT',   name: 'American Tower',     symbol: 'AMT',   type: 'stock', emoji: '📡', sector: 'Real Estate' },
  // ── ETFs ────────────────────────────────────────────────────
  { id: 'SPY',   name: 'S&P 500 ETF',        symbol: 'SPY',   type: 'etf',   emoji: '📊', sector: 'Broad Market' },
  { id: 'QQQ',   name: 'Nasdaq-100 ETF',     symbol: 'QQQ',   type: 'etf',   emoji: '💹', sector: 'Technology' },
  { id: 'VTI',   name: 'Total Market ETF',   symbol: 'VTI',   type: 'etf',   emoji: '🌍', sector: 'Broad Market' },
  { id: 'IWM',   name: 'Russell 2000 ETF',   symbol: 'IWM',   type: 'etf',   emoji: '📉', sector: 'Broad Market' },
  { id: 'GLD',   name: 'Gold ETF',           symbol: 'GLD',   type: 'etf',   emoji: '🥇', sector: 'Commodities' },
  { id: 'SLV',   name: 'Silver ETF',         symbol: 'SLV',   type: 'etf',   emoji: '🥈', sector: 'Commodities' },
  { id: 'TLT',   name: '20Y Treasury ETF',   symbol: 'TLT',   type: 'etf',   emoji: '🏛️', sector: 'Bonds' },
  { id: 'ARKK',  name: 'ARK Innovation',     symbol: 'ARKK',  type: 'etf',   emoji: '🚀', sector: 'Innovation' },
  { id: 'SOXX',  name: 'Semiconductor ETF',  symbol: 'SOXX',  type: 'etf',   emoji: '🖥️', sector: 'Technology' },
  { id: 'XLE',   name: 'Energy Select ETF',  symbol: 'XLE',   type: 'etf',   emoji: '⛽', sector: 'Energy' },
  { id: 'XLF',   name: 'Financial ETF',      symbol: 'XLF',   type: 'etf',   emoji: '💵', sector: 'Finance' },
  { id: 'XLV',   name: 'Health Care ETF',    symbol: 'XLV',   type: 'etf',   emoji: '🏥', sector: 'Healthcare' },
  // ── Crypto ──────────────────────────────────────────────────
  { id: 'bitcoin',  name: 'Bitcoin',  symbol: 'BTC',  type: 'crypto', emoji: '₿',  coingeckoId: 'bitcoin'  },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH',  type: 'crypto', emoji: '💎', coingeckoId: 'ethereum' },
  { id: 'solana',   name: 'Solana',   symbol: 'SOL',  type: 'crypto', emoji: '☀️', coingeckoId: 'solana'   },
  { id: 'ripple',   name: 'XRP',      symbol: 'XRP',  type: 'crypto', emoji: '🌊', coingeckoId: 'ripple'   },
  { id: 'cardano',  name: 'Cardano',  symbol: 'ADA',  type: 'crypto', emoji: '🔷', coingeckoId: 'cardano'  },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', type: 'crypto', emoji: '🐕', coingeckoId: 'dogecoin' },
];

export const SECTORS = [...new Set(ASSETS.map(a => a.sector).filter(Boolean))];

const CACHE_KEY = 'wealthquest_market_prices';
const CACHE_TTL = 15 * 60 * 1000;

function readCache() {
  try {
    const { ts, prices } = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}');
    if (Date.now() - ts < CACHE_TTL) return prices;
  } catch {}
  return null;
}
function writeCache(prices) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), prices })); } catch {}
}

const FALLBACK = {
  AAPL: { price: 211.45, change: 0.72, points: [] }, MSFT: { price: 429.15, change: 0.38, points: [] },
  GOOGL:{ price: 178.82, change:-0.21, points: [] }, NVDA: { price: 135.80, change: 2.15, points: [] },
  META: { price: 598.30, change: 1.14, points: [] }, AVGO: { price: 242.10, change: 0.88, points: [] },
  TSM:  { price: 188.40, change: 1.22, points: [] }, ORCL: { price: 198.55, change: 0.65, points: [] },
  CRM:  { price: 312.80, change: 0.44, points: [] }, AMD:  { price: 162.30, change: 1.88, points: [] },
  INTC: { price: 21.45,  change:-0.55, points: [] }, QCOM: { price: 172.20, change: 0.33, points: [] },
  ADBE: { price: 430.10, change:-0.28, points: [] }, NOW:  { price: 918.50, change: 1.10, points: [] },
  SNOW: { price: 148.20, change: 2.44, points: [] }, PLTR: { price: 38.80,  change: 3.22, points: [] },
  PANW: { price: 388.40, change: 0.77, points: [] }, AMZN: { price: 200.11, change: 1.05, points: [] },
  TSLA: { price: 248.50, change:-1.42, points: [] }, WMT:  { price: 97.85,  change: 0.33, points: [] },
  MCD:  { price: 316.40, change:-0.18, points: [] }, NKE:  { price: 72.30,  change:-0.44, points: [] },
  SBUX: { price: 81.50,  change: 0.22, points: [] }, COST: { price: 928.40, change: 0.55, points: [] },
  HD:   { price: 388.20, change: 0.44, points: [] }, NFLX: { price: 988.50, change: 1.77, points: [] },
  DIS:  { price: 98.30,  change: 0.33, points: [] }, JPM:  { price: 261.72, change: 0.55, points: [] },
  V:    { price: 356.88, change: 0.42, points: [] }, MA:   { price: 528.30, change: 0.61, points: [] },
  BAC:  { price: 44.32,  change: 0.61, points: [] }, GS:   { price: 588.20, change: 0.88, points: [] },
  PYPL: { price: 72.40,  change:-0.55, points: [] }, AXP:  { price: 288.30, change: 0.44, points: [] },
  BLK:  { price: 1028.40,change: 0.33, points: [] }, C:    { price: 78.50,  change: 0.55, points: [] },
  JNJ:  { price: 152.10, change:-0.09, points: [] }, UNH:  { price: 317.45, change:-0.77, points: [] },
  LLY:  { price: 838.20, change: 1.44, points: [] }, PFE:  { price: 24.80,  change:-0.33, points: [] },
  ABBV: { price: 188.30, change: 0.55, points: [] }, MRK:  { price: 98.40,  change: 0.22, points: [] },
  XOM:  { price: 111.25, change: 0.88, points: [] }, CVX:  { price: 154.30, change: 0.44, points: [] },
  COP:  { price: 98.50,  change: 0.66, points: [] }, NEE:  { price: 72.40,  change: 0.22, points: [] },
  CAT:  { price: 388.50, change: 0.55, points: [] }, BA:   { price: 188.40, change:-0.88, points: [] },
  GE:   { price: 188.50, change: 0.77, points: [] }, LMT:  { price: 488.20, change: 0.22, points: [] },
  UPS:  { price: 118.40, change:-0.44, points: [] }, T:    { price: 22.40,  change: 0.44, points: [] },
  VZ:   { price: 42.30,  change: 0.22, points: [] }, FCX:  { price: 38.50,  change: 1.22, points: [] },
  NEM:  { price: 48.30,  change: 0.88, points: [] }, AMT:  { price: 188.40, change: 0.33, points: [] },
  SPY:  { price: 574.30, change: 0.55, points: [] }, QQQ:  { price: 502.44, change: 0.88, points: [] },
  VTI:  { price: 285.10, change: 0.51, points: [] }, IWM:  { price: 208.40, change: 0.66, points: [] },
  GLD:  { price: 232.10, change: 0.31, points: [] }, SLV:  { price: 28.40,  change: 0.55, points: [] },
  TLT:  { price: 89.55,  change:-0.44, points: [] }, ARKK: { price: 54.20,  change: 1.88, points: [] },
  SOXX: { price: 218.40, change: 1.44, points: [] }, XLE:  { price: 88.30,  change: 0.55, points: [] },
  XLF:  { price: 48.40,  change: 0.44, points: [] }, XLV:  { price: 148.30, change: 0.22, points: [] },
  bitcoin:  { price: 97820, change: 1.85, points: [] },
  ethereum: { price: 3485,  change: 2.10, points: [] },
  solana:   { price: 198.4, change: 3.22, points: [] },
  ripple:   { price: 2.28,  change: 1.44, points: [] },
  cardano:  { price: 0.72,  change: 0.88, points: [] },
  dogecoin: { price: 0.18,  change: 2.11, points: [] },
};

async function fetchYahooBatch(symbols) {
  const url = `/api/yf/v8/finance/spark?symbols=${symbols.join(',')}&range=1d&interval=5m`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YF ${res.status}`);
  const data = await res.json();
  const results = data?.spark?.result ?? [];
  const out = {};
  results.forEach(r => {
    const sym = r.symbol;
    const spark = r.response?.[0];
    if (!spark) return;
    const closes = spark.indicators?.quote?.[0]?.close?.filter(Boolean) ?? [];
    const price = closes.at(-1);
    if (!price) return;
    const prevClose = spark.meta?.previousClose ?? price;
    const change = ((price - prevClose) / prevClose) * 100;
    const step = Math.max(1, Math.floor(closes.length / 20));
    const points = closes.filter((_, i) => i % step === 0).slice(-20);
    out[sym] = { price, change, points };
  });
  return out;
}

async function fetchCryptoPrice(coingeckoId) {
  const url = `/api/cg/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd&include_24hr_change=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CG ${res.status}`);
  const info = (await res.json())[coingeckoId];
  return { price: info.usd, change: info.usd_24h_change ?? 0, points: [] };
}

export async function fetchAllPrices() {
  const cached = readCache();
  if (cached) return cached;

  const prices = {};
  const stockAssets  = ASSETS.filter(a => a.type !== 'crypto');
  const cryptoAssets = ASSETS.filter(a => a.type === 'crypto');

  // Batch stocks in groups of 20
  const BATCH = 20;
  for (let i = 0; i < stockAssets.length; i += BATCH) {
    const batch = stockAssets.slice(i, i + BATCH);
    try {
      const batchPrices = await fetchYahooBatch(batch.map(a => a.symbol));
      batch.forEach(asset => {
        const p = batchPrices[asset.symbol];
        prices[asset.id] = p ?? FALLBACK[asset.id] ?? { price: 0, change: 0, points: [] };
      });
    } catch {
      batch.forEach(asset => { prices[asset.id] = FALLBACK[asset.id] ?? { price: 0, change: 0, points: [] }; });
    }
  }

  // Crypto (batch by id)
  try {
    const ids = cryptoAssets.map(a => a.coingeckoId).join(',');
    const url = `/api/cg/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      cryptoAssets.forEach(asset => {
        const info = json[asset.coingeckoId];
        if (info) prices[asset.id] = { price: info.usd, change: info.usd_24h_change ?? 0, points: [] };
        else prices[asset.id] = FALLBACK[asset.id] ?? { price: 0, change: 0, points: [] };
      });
    } else throw new Error('CG failed');
  } catch {
    cryptoAssets.forEach(asset => { prices[asset.id] = FALLBACK[asset.id] ?? { price: 0, change: 0, points: [] }; });
  }

  writeCache(prices);
  return prices;
}

export function getAssetById(id) { return ASSETS.find(a => a.id === id); }
export function clearPriceCache() { localStorage.removeItem(CACHE_KEY); }

export function syntheticPoints(price, change, count = 20) {
  const prevPrice = price / (1 + change / 100);
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    const noise = (Math.random() - 0.5) * price * 0.003;
    return prevPrice + (price - prevPrice) * t + noise;
  });
}
