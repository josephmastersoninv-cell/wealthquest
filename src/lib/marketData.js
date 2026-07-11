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

// ── IPO / launch data: split-adjusted prices for all-time return ───────────────
export const IPO_DATA = {
  AAPL:  { date: '1980-12-12', ipoPrice: 0.10,    label: 'Dec 1980' },
  MSFT:  { date: '1986-03-13', ipoPrice: 0.09,    label: 'Mar 1986' },
  GOOGL: { date: '2004-08-19', ipoPrice: 4.25,    label: 'Aug 2004' },
  NVDA:  { date: '1999-01-22', ipoPrice: 0.047,   label: 'Jan 1999' },
  META:  { date: '2012-05-18', ipoPrice: 38.0,    label: 'May 2012' },
  AVGO:  { date: '2009-08-06', ipoPrice: 15.0,    label: 'Aug 2009' },
  TSM:   { date: '1997-10-09', ipoPrice: 10.4,    label: 'Oct 1997' },
  ORCL:  { date: '1986-03-12', ipoPrice: 0.13,    label: 'Mar 1986' },
  CRM:   { date: '2004-06-23', ipoPrice: 11.0,    label: 'Jun 2004' },
  AMD:   { date: '1972-09-27', ipoPrice: 0.18,    label: 'Sep 1972' },
  INTC:  { date: '1971-10-13', ipoPrice: 0.06,    label: 'Oct 1971' },
  QCOM:  { date: '1991-12-13', ipoPrice: 0.75,    label: 'Dec 1991' },
  ADBE:  { date: '1986-08-20', ipoPrice: 0.42,    label: 'Aug 1986' },
  NOW:   { date: '2012-06-29', ipoPrice: 18.0,    label: 'Jun 2012' },
  SNOW:  { date: '2020-09-16', ipoPrice: 120.0,   label: 'Sep 2020' },
  PLTR:  { date: '2020-09-30', ipoPrice: 10.0,    label: 'Sep 2020' },
  PANW:  { date: '2012-07-20', ipoPrice: 42.0,    label: 'Jul 2012' },
  AMZN:  { date: '1997-05-15', ipoPrice: 0.90,    label: 'May 1997' },
  TSLA:  { date: '2010-06-29', ipoPrice: 1.13,    label: 'Jun 2010' },
  WMT:   { date: '1972-08-25', ipoPrice: 0.05,    label: 'Aug 1972' },
  MCD:   { date: '1965-04-21', ipoPrice: 0.08,    label: 'Apr 1965' },
  NKE:   { date: '1980-12-02', ipoPrice: 0.18,    label: 'Dec 1980' },
  SBUX:  { date: '1992-06-26', ipoPrice: 0.54,    label: 'Jun 1992' },
  COST:  { date: '1985-12-05', ipoPrice: 2.50,    label: 'Dec 1985' },
  HD:    { date: '1981-09-22', ipoPrice: 0.33,    label: 'Sep 1981' },
  NFLX:  { date: '2002-05-23', ipoPrice: 2.14,    label: 'May 2002' },
  DIS:   { date: '1957-11-12', ipoPrice: 0.07,    label: 'Nov 1957' },
  JPM:   { date: '1969-03-05', ipoPrice: 0.12,    label: 'Mar 1969' },
  V:     { date: '2008-03-19', ipoPrice: 44.0,    label: 'Mar 2008' },
  MA:    { date: '2006-05-25', ipoPrice: 3.90,    label: 'May 2006' },
  BAC:   { date: '1972-01-01', ipoPrice: 0.06,    label: 'Jan 1972' },
  GS:    { date: '1999-05-04', ipoPrice: 53.0,    label: 'May 1999' },
  PYPL:  { date: '2015-07-20', ipoPrice: 36.0,    label: 'Jul 2015' },
  AXP:   { date: '1977-05-18', ipoPrice: 0.25,    label: 'May 1977' },
  BLK:   { date: '1999-10-01', ipoPrice: 14.0,    label: 'Oct 1999' },
  C:     { date: '1977-01-01', ipoPrice: 0.60,    label: 'Jan 1977' },
  JNJ:   { date: '1944-09-24', ipoPrice: 0.04,    label: 'Sep 1944' },
  UNH:   { date: '1984-10-17', ipoPrice: 0.25,    label: 'Oct 1984' },
  LLY:   { date: '1952-01-01', ipoPrice: 0.22,    label: 'Jan 1952' },
  PFE:   { date: '1972-01-01', ipoPrice: 0.15,    label: 'Jan 1972' },
  ABBV:  { date: '2013-01-02', ipoPrice: 20.0,    label: 'Jan 2013' },
  MRK:   { date: '1946-06-21', ipoPrice: 0.05,    label: 'Jun 1946' },
  XOM:   { date: '1970-01-01', ipoPrice: 0.20,    label: 'Jan 1970' },
  CVX:   { date: '1984-01-01', ipoPrice: 1.00,    label: 'Jan 1984' },
  COP:   { date: '1981-01-01', ipoPrice: 1.50,    label: 'Jan 1981' },
  NEE:   { date: '1984-01-01', ipoPrice: 0.35,    label: 'Jan 1984' },
  CAT:   { date: '1929-01-01', ipoPrice: 0.10,    label: 'Jan 1929' },
  BA:    { date: '1962-01-01', ipoPrice: 0.08,    label: 'Jan 1962' },
  GE:    { date: '1962-01-01', ipoPrice: 0.06,    label: 'Jan 1962' },
  LMT:   { date: '1977-01-01', ipoPrice: 0.20,    label: 'Jan 1977' },
  UPS:   { date: '1999-11-09', ipoPrice: 50.0,    label: 'Nov 1999' },
  T:     { date: '1984-11-21', ipoPrice: 0.30,    label: 'Nov 1984' },
  VZ:    { date: '1983-11-21', ipoPrice: 0.50,    label: 'Nov 1983' },
  FCX:   { date: '1995-01-01', ipoPrice: 2.00,    label: 'Jan 1995' },
  NEM:   { date: '1987-01-01', ipoPrice: 0.60,    label: 'Jan 1987' },
  AMT:   { date: '1998-06-04', ipoPrice: 15.0,    label: 'Jun 1998' },
  SPY:   { date: '1993-01-22', ipoPrice: 43.94,   label: 'Jan 1993' },
  QQQ:   { date: '1999-03-10', ipoPrice: 53.14,   label: 'Mar 1999' },
  VTI:   { date: '2001-05-24', ipoPrice: 73.04,   label: 'May 2001' },
  IWM:   { date: '2000-05-22', ipoPrice: 52.05,   label: 'May 2000' },
  GLD:   { date: '2004-11-18', ipoPrice: 44.79,   label: 'Nov 2004' },
  SLV:   { date: '2006-04-28', ipoPrice: 14.00,   label: 'Apr 2006' },
  TLT:   { date: '2002-07-26', ipoPrice: 88.00,   label: 'Jul 2002' },
  ARKK:  { date: '2014-10-31', ipoPrice: 20.00,   label: 'Oct 2014' },
  SOXX:  { date: '2001-07-13', ipoPrice: 37.00,   label: 'Jul 2001' },
  XLE:   { date: '1998-12-22', ipoPrice: 39.43,   label: 'Dec 1998' },
  XLF:   { date: '1998-12-22', ipoPrice: 13.00,   label: 'Dec 1998' },
  XLV:   { date: '1998-12-22', ipoPrice: 21.00,   label: 'Dec 1998' },
  bitcoin:  { date: '2010-07-17', ipoPrice: 0.0009,  label: 'Jul 2010' },
  ethereum: { date: '2015-08-07', ipoPrice: 0.31,    label: 'Aug 2015' },
  solana:   { date: '2020-03-24', ipoPrice: 0.95,    label: 'Mar 2020' },
  ripple:   { date: '2013-08-04', ipoPrice: 0.005,   label: 'Aug 2013' },
  cardano:  { date: '2017-10-01', ipoPrice: 0.02,    label: 'Oct 2017' },
  dogecoin: { date: '2013-12-19', ipoPrice: 0.0002,  label: 'Dec 2013' },
};

// ── Per-asset base volatility (amplified by speed multiplier during simulation) ─
const ASSET_VOL = {
  bitcoin: 0.012, ethereum: 0.013, solana: 0.018, ripple: 0.016, cardano: 0.015, dogecoin: 0.022,
  TSLA: 0.010, NVDA: 0.009, PLTR: 0.009, SNOW: 0.008, ARKK: 0.009, AMD: 0.008,
  NFLX: 0.006, META: 0.006, PYPL: 0.007, LLY: 0.006, FCX: 0.006,
  GOOGL: 0.005, AMZN: 0.005, CRM: 0.005, NOW: 0.005, ADBE: 0.005, GS: 0.005,
  AVGO: 0.005, TSM: 0.005, PANW: 0.005, DIS: 0.005, BA: 0.005, UNH: 0.005,
  AAPL: 0.004, MSFT: 0.004, QCOM: 0.004, INTC: 0.004, NKE: 0.004,
  SBUX: 0.004, AXP: 0.004, BAC: 0.004, MA: 0.004, JPM: 0.004, XOM: 0.004,
  ABBV: 0.004, ORCL: 0.004, GE: 0.004, CAT: 0.004, CVX: 0.004, COP: 0.005,
  COST: 0.003, HD: 0.003, WMT: 0.003, MCD: 0.003, V: 0.003, JNJ: 0.003,
  MRK: 0.003, PFE: 0.003, NEE: 0.003, LMT: 0.003, UPS: 0.003, AMT: 0.003,
  T: 0.002, VZ: 0.002,
  SPY: 0.0018, VTI: 0.0018, QQQ: 0.0025, IWM: 0.003,
  GLD: 0.003, SLV: 0.004, TLT: 0.003, XLE: 0.004, XLF: 0.003, XLV: 0.002, SOXX: 0.004,
};

// ─── Bonds ────────────────────────────────────────────────────────────────────
// Tradeable via the existing Trade modal (as ETFs/stocks); this is reference data for Research tab
export const BONDS = [
  // US Treasuries
  { id: 'UST2Y',  name: '2-Year Treasury',   symbol: 'UST2Y',  coupon: 4.85, maturity: '2026',  rating: 'AAA', type: 'government', emoji: '🏛️', assetId: 'TLT', yieldTo: 4.82, faceValue: 1000, description: 'Short-term US government bond. Very safe, lower yield.' },
  { id: 'UST10Y', name: '10-Year Treasury',  symbol: 'UST10Y', coupon: 4.20, maturity: '2034',  rating: 'AAA', type: 'government', emoji: '🏛️', assetId: 'TLT', yieldTo: 4.18, faceValue: 1000, description: 'Benchmark US bond. Drives mortgage rates and stock valuations.' },
  { id: 'UST30Y', name: '30-Year Treasury',  symbol: 'UST30Y', coupon: 4.35, maturity: '2054',  rating: 'AAA', type: 'government', emoji: '🏛️', assetId: 'TLT', yieldTo: 4.32, faceValue: 1000, description: 'Long-term government bond. Higher duration risk but steady income.' },
  // Investment-grade corporate
  { id: 'AAPL4',  name: 'Apple 4.65% 2030',  symbol: 'AAPL4',  coupon: 4.65, maturity: '2030', rating: 'AAA', type: 'corporate',   emoji: '🍎', assetId: 'AAPL', yieldTo: 4.70, faceValue: 1000, description: 'Apple corporate bond. Excellent credit rating, slight yield premium over Treasuries.' },
  { id: 'MSFT5',  name: 'MSFT 5.00% 2033',  symbol: 'MSFT5',  coupon: 5.00, maturity: '2033', rating: 'AAA', type: 'corporate',   emoji: '🪟', assetId: 'MSFT', yieldTo: 5.05, faceValue: 1000, description: 'Microsoft bond. Strong balance sheet, very low default risk.' },
  { id: 'JPM5',   name: 'JPM 5.30% 2031',   symbol: 'JPM5',   coupon: 5.30, maturity: '2031', rating: 'A',   type: 'corporate',   emoji: '🏦', assetId: 'JPM',  yieldTo: 5.35, faceValue: 1000, description: 'JPMorgan Chase bond. Investment grade, higher yield than tech.' },
  // High yield
  { id: 'FORD7',  name: 'Ford 7.45% 2031',  symbol: 'FORD7',  coupon: 7.45, maturity: '2031', rating: 'BB',  type: 'high-yield',  emoji: '🚗', assetId: 'SPY',  yieldTo: 7.60, faceValue: 1000, description: 'Ford Motor junk bond. High coupon compensates for higher default risk.' },
  { id: 'AMC9',   name: 'AMC 9.00% 2028',   symbol: 'AMC9',   coupon: 9.00, maturity: '2028', rating: 'CCC', type: 'high-yield',  emoji: '🎬', assetId: 'SPY',  yieldTo: 9.80, faceValue: 1000, description: 'Distressed corporate bond. Very high yield, significant default risk.' },
];

export const BOND_RATING_COLOR = { AAA: 'text-emerald-400', AA: 'text-emerald-400', A: 'text-sky-400', BBB: 'text-amber-400', BB: 'text-orange-400', B: 'text-rose-400', CCC: 'text-rose-500' };

// ─── Dividends ────────────────────────────────────────────────────────────────
// annualYield as decimal (e.g. 0.03 = 3%), all pay quarterly
export const DIVIDENDS = {
  AAPL: { annualYield: 0.0052, label: '0.52%' },
  MSFT: { annualYield: 0.0072, label: '0.72%' },
  JNJ:  { annualYield: 0.031,  label: '3.10%' },
  XOM:  { annualYield: 0.035,  label: '3.50%' },
  CVX:  { annualYield: 0.042,  label: '4.20%' },
  JPM:  { annualYield: 0.025,  label: '2.50%' },
  V:    { annualYield: 0.008,  label: '0.80%' },
  MA:   { annualYield: 0.006,  label: '0.60%' },
  BAC:  { annualYield: 0.028,  label: '2.80%' },
  WMT:  { annualYield: 0.012,  label: '1.20%' },
  MCD:  { annualYield: 0.021,  label: '2.10%' },
  T:    { annualYield: 0.065,  label: '6.50%' },
  VZ:   { annualYield: 0.065,  label: '6.50%' },
  PFE:  { annualYield: 0.056,  label: '5.60%' },
  ABBV: { annualYield: 0.038,  label: '3.80%' },
  MRK:  { annualYield: 0.026,  label: '2.60%' },
  UNH:  { annualYield: 0.015,  label: '1.50%' },
  CAT:  { annualYield: 0.015,  label: '1.50%' },
  LMT:  { annualYield: 0.028,  label: '2.80%' },
  UPS:  { annualYield: 0.045,  label: '4.50%' },
  SPY:  { annualYield: 0.013,  label: '1.30%' },
  QQQ:  { annualYield: 0.007,  label: '0.70%' },
  VTI:  { annualYield: 0.014,  label: '1.40%' },
  TLT:  { annualYield: 0.040,  label: '4.00%' },
  BLK:  { annualYield: 0.025,  label: '2.50%' },
  NEE:  { annualYield: 0.030,  label: '3.00%' },
  NEM:  { annualYield: 0.018,  label: '1.80%' },
  AMT:  { annualYield: 0.030,  label: '3.00%' },
  COST: { annualYield: 0.006,  label: '0.60%' },
  HD:   { annualYield: 0.023,  label: '2.30%' },
  GE:   { annualYield: 0.003,  label: '0.30%' },
  AXP:  { annualYield: 0.012,  label: '1.20%' },
  GS:   { annualYield: 0.024,  label: '2.40%' },
  C:    { annualYield: 0.032,  label: '3.20%' },
  FCX:  { annualYield: 0.016,  label: '1.60%' },
  NKE:  { annualYield: 0.019,  label: '1.90%' },
  SBUX: { annualYield: 0.025,  label: '2.50%' },
  QCOM: { annualYield: 0.020,  label: '2.00%' },
  INTC: { annualYield: 0.010,  label: '1.00%' },
};

// ─── Earnings reports (seeded, deterministic) ─────────────────────────────────
const QUARTERS = ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'];
const GUIDANCE = ['positive', 'positive', 'neutral', 'neutral', 'negative'];

function mkSeed(id) {
  let s = [...id].reduce((a, c) => a + c.charCodeAt(0) * 31, 0);
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}

export function getEarningsHistory(assetId) {
  const rand = mkSeed(assetId);
  return QUARTERS.map(q => {
    const beat       = rand() > 0.35;
    const surprisePct = beat ? rand() * 8 + 0.5 : -(rand() * 6 + 0.5);
    const epsEst     = +(0.8 + rand() * 5).toFixed(2);
    const epsActual  = +(epsEst * (1 + surprisePct / 100)).toFixed(2);
    const revEst     = +(5 + rand() * 95).toFixed(1);    // $B, normalized
    const revActual  = +(revEst * (1 + (beat ? rand() * 0.07 : -rand() * 0.04))).toFixed(1);
    const guidance   = GUIDANCE[Math.floor(rand() * GUIDANCE.length)];
    return { quarter: q, beat, surprisePct: +surprisePct.toFixed(1), epsEst, epsActual, revEst, revActual, guidance };
  });
}

// Price multiplier when earnings event fires (shock applied to current price)
export function earningsShockMultiplier(beat, surprisePct) {
  const mag = Math.min(Math.abs(surprisePct) * 0.9, 14) / 100;
  return beat ? 1 + mag : 1 - mag;
}

// Simulate one price tick at 5× speed — call this on an interval during market hours
export function simulatePriceTick(prices, multiplier = 5) {
  const next = {};
  Object.entries(prices).forEach(([id, pd]) => {
    const vol = (ASSET_VOL[id] ?? 0.004) * multiplier;
    const move = (Math.random() - 0.45) * vol; // 0.45 bias → ~55% of ticks are positive
    const base = pd.basePrice ?? pd.price;
    const newPrice = Math.max(pd.price * (1 + move), base * 0.25);
    const points = [...(pd.points?.slice(-49) ?? []), newPrice];
    next[id] = { ...pd, price: newPrice, change: ((newPrice - base) / base) * 100, points, basePrice: base };
  });
  return next;
}

// NYSE market hours — returns status object used across Portfolio
export function getMarketStatus() {
  const nyStr = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  const ny    = new Date(nyStr);
  const day = ny.getDay();
  const h   = ny.getHours();
  const m   = ny.getMinutes();
  const min = h * 60 + m;
  const OPEN  = 570;   // 9:30 AM ET
  const CLOSE = 960;   // 4:00 PM ET
  const isWD  = day >= 1 && day <= 5;
  const isOpen = isWD && min >= OPEN && min < CLOSE;
  const isPre  = isWD && h >= 4 && min < OPEN;
  const isAH   = isWD && min >= CLOSE && h < 20;

  let minsUntilOpen = null;
  if (!isOpen) {
    if (isPre) {
      minsUntilOpen = OPEN - min;
    } else {
      const toMid = 1440 - min;
      // How many extra full days until the next Monday (or next weekday)?
      let extra = 0;
      if (day === 5) extra = 2;   // Fri after close → Mon
      else if (day === 6) extra = 1; // Sat → Mon
      minsUntilOpen = toMid + extra * 1440 + OPEN;
    }
  }

  const fmt = (mins) => {
    if (!mins) return '';
    const hh = Math.floor(mins / 60);
    const mm  = mins % 60;
    return hh > 0 ? `${hh}h ${mm}m` : `${mm}m`;
  };

  // Why is it closed? (weekend / after-hours / pre-market / overnight)
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let reason = 'open';
  let reasonText = '';
  if (!isOpen) {
    if (!isWD) {
      reason = 'weekend';
      reasonText = `It's the weekend (${DAY_NAMES[day]}) — the NYSE is closed Saturday and Sunday.`;
    } else if (isPre) {
      reason = 'premarket';
      reasonText = "It's before the 9:30 AM opening bell — the regular session hasn't started yet.";
    } else if (isAH) {
      reason = 'afterhours';
      reasonText = 'The 4:00 PM closing bell has rung — the regular session is over for today.';
    } else {
      reason = 'overnight';
      reasonText = 'The market is closed overnight between trading days.';
    }
  }

  return {
    open: isOpen,
    preMarket: isPre,
    afterHours: isAH,
    canTrade: isOpen,
    label: isOpen ? 'Open' : isPre ? 'Pre-Market' : isAH ? 'After-Hours' : 'Closed',
    color: isOpen ? 'emerald' : (isPre || isAH) ? 'amber' : 'rose',
    minutesLeft: isOpen ? CLOSE - min : null,
    countdown: fmt(minsUntilOpen),
    nyTime: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')} ET`,
    reason,
    reasonText,
  };
}

// Generate a synthetic all-time price curve from IPO → current price (60 data points)
export function generateAllTimeCurve(assetId, currentPrice, n = 60) {
  const ipo = IPO_DATA[assetId];
  if (!ipo || !currentPrice || currentPrice <= 0) return [];
  const { ipoPrice } = ipo;
  if (ipoPrice <= 0) return [];
  const asset = ASSETS.find(a => a.id === assetId);
  const isCrypto = asset?.type === 'crypto';

  // Seeded RNG so the curve is deterministic per asset
  let seed = [...assetId].reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0xFFFFFFFF; };

  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const trend = ipoPrice * Math.pow(Math.max(currentPrice / ipoPrice, 1.001), t);
    let dip = 1;
    if (isCrypto) {
      // Crypto winter ~2018 and 2022 crash
      if (t > 0.28 && t < 0.40) dip = 0.15 + rng() * 0.12;
      if (t > 0.65 && t < 0.76) dip = 0.18 + rng() * 0.12;
    } else {
      // 2008-09 financial crisis and 2020 COVID crash
      if (t > 0.32 && t < 0.44) dip = 0.55 + rng() * 0.18;
      if (t > 0.78 && t < 0.86) dip = 0.62 + rng() * 0.15;
    }
    // Smooth entry/exit from dip (blend over 4 points on each edge)
    const noise = trend * (rng() - 0.5) * 0.05;
    pts.push(Math.max(trend * dip + noise, ipoPrice * 0.05));
  }
  pts[n - 1] = currentPrice;
  return pts;
}

// ─── Sector Rotation Events ───────────────────────────────────────────────────
export const SECTOR_ROTATION_EVENTS = [
  { name: 'Oil Shock',       crashSector: 'Technology', boomSector: 'Energy',        crashMult: 0.88, boomMult: 1.13, news: 'Surprise OPEC+ cut drives oil spike — Energy surges, Tech sector sold off' },
  { name: 'Tech Rally',      crashSector: 'Energy',     boomSector: 'Technology',    crashMult: 0.91, boomMult: 1.10, news: 'AI spending boom accelerates — Tech rallies hard, Energy fades on demand fears' },
  { name: 'Rate Shock',      crashSector: 'Finance',    boomSector: 'Healthcare',    crashMult: 0.90, boomMult: 1.07, news: 'Surprise rate hike hammers bank stocks — defensive Healthcare holds firm' },
  { name: 'Safe Haven',      crashSector: 'Consumer',   boomSector: 'Materials',     crashMult: 0.91, boomMult: 1.08, news: 'Consumer confidence collapses — commodity stocks surge on supply fears' },
  { name: 'Pharma Surge',    crashSector: 'Industrials',boomSector: 'Healthcare',    crashMult: 0.92, boomMult: 1.12, news: 'FDA approves blockbuster drug — Healthcare soars, industrial data disappoints' },
  { name: 'Growth Rotation', crashSector: 'Technology', boomSector: 'Finance',       crashMult: 0.93, boomMult: 1.09, news: 'Rate cut expectations drive rotation — banks rally as growth stocks cool' },
  { name: 'Telecom Surge',   crashSector: 'Energy',     boomSector: 'Communication', crashMult: 0.92, boomMult: 1.08, news: 'Spectrum auction sparks Communication rally; oil slides on global demand' },
];

// Bond price model: when interest rates rise, bond prices fall (duration effect)
export function getBondPrice(bond, baseRate) {
  if (!bond) return 0;
  const maturityYear  = parseInt(bond.maturity ?? '2030');
  const duration      = Math.min(Math.max(maturityYear - 2024, 1), 30) * 0.9;
  const rateDiff      = baseRate - bond.yieldTo;
  const modifier      = -rateDiff * duration * 0.01;
  return Math.max(bond.faceValue * (1 + modifier), bond.faceValue * 0.5);
}

// Recession news shown in Market tab 3→1 days before and on the day
export const RECESSION_NEWS = {
  warning3: [
    { title: 'Fed signals concern over slowing GDP growth', sentiment: 'down', time: '2h ago' },
    { title: 'Yield curve flattens — economists on watch', sentiment: 'down', time: '5h ago' },
  ],
  warning2: [
    { title: '⚠️ Yield curve inverts — strong recession signal', sentiment: 'down', time: '1h ago' },
    { title: 'Manufacturing PMI falls below 50 for third month', sentiment: 'down', time: '3h ago' },
    { title: 'Unemployment claims rise unexpectedly', sentiment: 'down', time: '6h ago' },
  ],
  warning1: [
    { title: '🚨 GDP contracts 0.4% — technical recession confirmed', sentiment: 'down', time: '30m ago' },
    { title: 'Markets brace for broad selloff — VIX spikes to 38', sentiment: 'down', time: '1h ago' },
    { title: 'Federal Reserve holds emergency meeting', sentiment: 'down', time: '2h ago' },
  ],
  active: [
    { title: '🔴 RECESSION: Markets in freefall — all sectors lower', sentiment: 'down', time: 'Now' },
    { title: 'Bonds and gold surge as investors flee equities', sentiment: 'up', time: 'Now' },
    { title: 'Circuit breakers triggered on major indices', sentiment: 'down', time: '15m ago' },
  ],
};

// ── OHLC candle history ending at currentPrice (for TradingView-style chart) ──
export function generateCandles(assetId, currentPrice, tf = '1M', count = 70) {
  const TF_MIN = { '1M': 1, '5M': 5, '15M': 15, '1H': 60, '4H': 240, '1D': 1440 };
  const tfMin = TF_MIN[tf] ?? 1;
  const baseVol = ASSET_VOL[assetId] ?? 0.004;
  const candleVol = baseVol * 5 * Math.sqrt(Math.max(tfMin, 1));

  // Seed per asset+tf+day — chart shape is stable within a trading day
  let seed = [...(assetId + tf)].reduce((a, c) => a + c.charCodeAt(0), 0)
           + Math.floor(Date.now() / 86400000);
  const rng = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0xFFFFFFFF; };

  const candles = [];
  let closePrice = currentPrice;

  for (let i = count - 1; i >= 0; i--) {
    const bodyMove = (rng() - 0.5) * candleVol;
    const openPrice = closePrice / (1 + bodyMove);
    const high = Math.max(openPrice, closePrice) * (1 + rng() * candleVol * 0.4);
    const low  = Math.min(openPrice, closePrice) * (1 - rng() * candleVol * 0.4);
    const vol  = (200000 + rng() * 1500000) * (1 + Math.abs(bodyMove) / (candleVol || 0.001));
    candles.unshift({ o: openPrice, h: high, l: low, c: closePrice, v: vol,
                      t: Date.now() - i * tfMin * 60000 });
    closePrice = openPrice;
  }
  return candles;
}
