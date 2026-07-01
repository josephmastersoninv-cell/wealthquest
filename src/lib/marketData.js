// Market data — Yahoo Finance (stocks/ETFs) + CoinGecko (crypto)
// Returns prices + intraday sparkline points

export const ASSETS = [
  // Technology
  { id: 'AAPL',  name: 'Apple',          symbol: 'AAPL',  type: 'stock', emoji: '🍎', sector: 'Technology' },
  { id: 'MSFT',  name: 'Microsoft',      symbol: 'MSFT',  type: 'stock', emoji: '🪟', sector: 'Technology' },
  { id: 'GOOGL', name: 'Alphabet',       symbol: 'GOOGL', type: 'stock', emoji: '🔍', sector: 'Technology' },
  { id: 'NVDA',  name: 'NVIDIA',         symbol: 'NVDA',  type: 'stock', emoji: '🎮', sector: 'Technology' },
  { id: 'META',  name: 'Meta',           symbol: 'META',  type: 'stock', emoji: '👥', sector: 'Technology' },
  // Consumer / E-commerce
  { id: 'AMZN',  name: 'Amazon',         symbol: 'AMZN',  type: 'stock', emoji: '📦', sector: 'Consumer' },
  { id: 'TSLA',  name: 'Tesla',          symbol: 'TSLA',  type: 'stock', emoji: '⚡', sector: 'Consumer' },
  { id: 'WMT',   name: 'Walmart',        symbol: 'WMT',   type: 'stock', emoji: '🛒', sector: 'Consumer' },
  { id: 'MCD',   name: 'McDonald\'s',    symbol: 'MCD',   type: 'stock', emoji: '🍔', sector: 'Consumer' },
  // Finance
  { id: 'JPM',   name: 'JPMorgan',       symbol: 'JPM',   type: 'stock', emoji: '🏦', sector: 'Finance' },
  { id: 'V',     name: 'Visa',           symbol: 'V',     type: 'stock', emoji: '💳', sector: 'Finance' },
  { id: 'BAC',   name: 'Bank of America',symbol: 'BAC',   type: 'stock', emoji: '🏛️', sector: 'Finance' },
  // Healthcare
  { id: 'JNJ',   name: 'Johnson & Johnson', symbol: 'JNJ', type: 'stock', emoji: '💊', sector: 'Healthcare' },
  { id: 'UNH',   name: 'UnitedHealth',   symbol: 'UNH',  type: 'stock', emoji: '🏥', sector: 'Healthcare' },
  // Energy
  { id: 'XOM',   name: 'ExxonMobil',     symbol: 'XOM',  type: 'stock', emoji: '⛽', sector: 'Energy' },
  { id: 'CVX',   name: 'Chevron',        symbol: 'CVX',  type: 'stock', emoji: '🛢️', sector: 'Energy' },
  // ETFs
  { id: 'SPY',   name: 'S&P 500 ETF',    symbol: 'SPY',  type: 'etf',   emoji: '📊', sector: 'Broad Market' },
  { id: 'QQQ',   name: 'Nasdaq-100 ETF', symbol: 'QQQ',  type: 'etf',   emoji: '💹', sector: 'Technology' },
  { id: 'VTI',   name: 'Total Market ETF', symbol: 'VTI', type: 'etf',  emoji: '🌍', sector: 'Broad Market' },
  { id: 'GLD',   name: 'Gold ETF',       symbol: 'GLD',  type: 'etf',   emoji: '🥇', sector: 'Commodities' },
  { id: 'TLT',   name: '20Y Treasury',   symbol: 'TLT',  type: 'etf',   emoji: '🏛️', sector: 'Bonds' },
  { id: 'ARKK',  name: 'ARK Innovation', symbol: 'ARKK', type: 'etf',   emoji: '🚀', sector: 'Innovation' },
  // Crypto
  { id: 'bitcoin',   name: 'Bitcoin',  symbol: 'BTC', type: 'crypto', emoji: '₿',  coingeckoId: 'bitcoin' },
  { id: 'ethereum',  name: 'Ethereum', symbol: 'ETH', type: 'crypto', emoji: '💎', coingeckoId: 'ethereum' },
  { id: 'solana',    name: 'Solana',   symbol: 'SOL', type: 'crypto', emoji: '☀️', coingeckoId: 'solana' },
];

export const SECTORS = [...new Set(ASSETS.map(a => a.sector))];

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
  AAPL:  { price: 211.45, change: 0.72,  points: [] },
  MSFT:  { price: 429.15, change: 0.38,  points: [] },
  GOOGL: { price: 178.82, change: -0.21, points: [] },
  NVDA:  { price: 135.80, change: 2.15,  points: [] },
  META:  { price: 598.30, change: 1.14,  points: [] },
  AMZN:  { price: 200.11, change: 1.05,  points: [] },
  TSLA:  { price: 248.50, change: -1.42, points: [] },
  WMT:   { price: 97.85,  change: 0.33,  points: [] },
  MCD:   { price: 316.40, change: -0.18, points: [] },
  JPM:   { price: 261.72, change: 0.55,  points: [] },
  V:     { price: 356.88, change: 0.42,  points: [] },
  BAC:   { price: 44.32,  change: 0.61,  points: [] },
  JNJ:   { price: 152.10, change: -0.09, points: [] },
  UNH:   { price: 317.45, change: -0.77, points: [] },
  XOM:   { price: 111.25, change: 0.88,  points: [] },
  CVX:   { price: 154.30, change: 0.44,  points: [] },
  SPY:   { price: 574.30, change: 0.55,  points: [] },
  QQQ:   { price: 502.44, change: 0.88,  points: [] },
  VTI:   { price: 285.10, change: 0.51,  points: [] },
  GLD:   { price: 232.10, change: 0.31,  points: [] },
  TLT:   { price: 89.55,  change: -0.44, points: [] },
  ARKK:  { price: 54.20,  change: 1.88,  points: [] },
  bitcoin:  { price: 97820, change: 1.85, points: [] },
  ethereum: { price: 3485,  change: 2.10, points: [] },
  solana:   { price: 198.4, change: 3.22, points: [] },
};

async function fetchYahooPrice(symbol) {
  const url = `/api/yf/v8/finance/spark?symbols=${symbol}&range=1d&interval=5m`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YF ${res.status}`);
  const data = await res.json();
  const spark = data?.spark?.result?.[0]?.response?.[0];
  if (!spark) throw new Error('No spark');
  const closes = spark.indicators?.quote?.[0]?.close?.filter(Boolean) ?? [];
  const price = closes.at(-1);
  if (!price) throw new Error('No price');
  const prevClose = spark.meta?.previousClose ?? price;
  const change = ((price - prevClose) / prevClose) * 100;
  // Downsample to 20 points for sparkline
  const step = Math.max(1, Math.floor(closes.length / 20));
  const points = closes.filter((_, i) => i % step === 0).slice(-20);
  return { price, change, points };
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
  await Promise.allSettled(ASSETS.map(async asset => {
    try {
      prices[asset.id] = asset.type === 'crypto'
        ? await fetchCryptoPrice(asset.coingeckoId)
        : await fetchYahooPrice(asset.symbol);
    } catch {
      prices[asset.id] = FALLBACK[asset.id] ?? { price: 0, change: 0, points: [] };
    }
  }));

  const final = Object.keys(prices).length > 0 ? prices : FALLBACK;
  writeCache(final);
  return final;
}

export function getAssetById(id) { return ASSETS.find(a => a.id === id); }
export function clearPriceCache() { localStorage.removeItem(CACHE_KEY); }

// Generate synthetic sparkline from fallback price + change (for assets with no live data)
export function syntheticPoints(price, change, count = 20) {
  const prevPrice = price / (1 + change / 100);
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    const noise = (Math.random() - 0.5) * price * 0.003;
    return prevPrice + (price - prevPrice) * t + noise;
  });
}
