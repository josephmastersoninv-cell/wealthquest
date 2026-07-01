// Market data layer — Yahoo Finance (stocks/ETFs) + CoinGecko (crypto)
// Prices are fetched live and cached in localStorage for 15 minutes.

export const ASSETS = [
  // US Stocks
  { id: 'AAPL',  name: 'Apple',         symbol: 'AAPL',  type: 'stock',  emoji: '🍎', sector: 'Technology' },
  { id: 'MSFT',  name: 'Microsoft',      symbol: 'MSFT',  type: 'stock',  emoji: '🪟', sector: 'Technology' },
  { id: 'GOOGL', name: 'Alphabet',       symbol: 'GOOGL', type: 'stock',  emoji: '🔍', sector: 'Technology' },
  { id: 'AMZN',  name: 'Amazon',         symbol: 'AMZN',  type: 'stock',  emoji: '📦', sector: 'Consumer' },
  { id: 'TSLA',  name: 'Tesla',          symbol: 'TSLA',  type: 'stock',  emoji: '⚡', sector: 'Automotive' },
  { id: 'NVDA',  name: 'NVIDIA',         symbol: 'NVDA',  type: 'stock',  emoji: '🎮', sector: 'Technology' },
  // ETFs
  { id: 'SPY',   name: 'S&P 500 ETF',    symbol: 'SPY',   type: 'etf',    emoji: '📊', sector: 'Broad Market' },
  { id: 'QQQ',   name: 'Nasdaq-100 ETF', symbol: 'QQQ',   type: 'etf',    emoji: '💹', sector: 'Technology' },
  { id: 'GLD',   name: 'Gold ETF',       symbol: 'GLD',   type: 'etf',    emoji: '🥇', sector: 'Commodities' },
  { id: 'TLT',   name: '20Y Treasury ETF', symbol: 'TLT', type: 'etf',    emoji: '🏛️', sector: 'Bonds' },
  // Crypto (via CoinGecko)
  { id: 'bitcoin',  name: 'Bitcoin',     symbol: 'BTC',   type: 'crypto', emoji: '₿',  coingeckoId: 'bitcoin' },
  { id: 'ethereum', name: 'Ethereum',    symbol: 'ETH',   type: 'crypto', emoji: '💎', coingeckoId: 'ethereum' },
];

const CACHE_KEY = 'wealthquest_market_prices';
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, prices } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL) return prices;
  } catch { /* ignore */ }
  return null;
}

function writeCache(prices) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), prices }));
  } catch { /* ignore */ }
}

async function fetchYahooPrice(symbol) {
  const url = `/api/yf/v8/finance/spark?symbols=${symbol}&range=1d&interval=5m`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YF HTTP ${res.status}`);
  const data = await res.json();
  const spark = data?.spark?.result?.[0];
  if (!spark) throw new Error('No data');
  const closes = spark.response?.[0]?.indicators?.quote?.[0]?.close ?? [];
  const price = closes.filter(Boolean).at(-1);
  if (!price) throw new Error('No close price');
  const prevClose = spark.response?.[0]?.meta?.previousClose ?? price;
  return { price, change: ((price - prevClose) / prevClose) * 100 };
}

async function fetchCryptoPrice(coingeckoId) {
  const url = `/api/cg/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd&include_24hr_change=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CG HTTP ${res.status}`);
  const data = await res.json();
  const info = data[coingeckoId];
  return { price: info.usd, change: info.usd_24h_change ?? 0 };
}

// Realistic fallback prices if APIs are unavailable (refreshed manually periodically)
const FALLBACK_PRICES = {
  AAPL:    { price: 211.45, change: 0.72 },
  MSFT:    { price: 429.15, change: 0.38 },
  GOOGL:   { price: 178.82, change: -0.21 },
  AMZN:    { price: 200.11, change: 1.05 },
  TSLA:    { price: 248.50, change: -1.42 },
  NVDA:    { price: 135.80, change: 2.15 },
  SPY:     { price: 574.30, change: 0.55 },
  QQQ:     { price: 502.44, change: 0.88 },
  GLD:     { price: 232.10, change: 0.31 },
  TLT:     { price: 89.55, change: -0.44 },
  bitcoin:  { price: 97820, change: 1.85 },
  ethereum: { price: 3485, change: 2.10 },
};

export async function fetchAllPrices() {
  const cached = readCache();
  if (cached) return cached;

  const prices = {};
  const results = await Promise.allSettled(
    ASSETS.map(async (asset) => {
      try {
        const data = asset.type === 'crypto'
          ? await fetchCryptoPrice(asset.coingeckoId)
          : await fetchYahooPrice(asset.symbol);
        prices[asset.id] = data;
      } catch {
        prices[asset.id] = FALLBACK_PRICES[asset.id] ?? { price: 0, change: 0 };
      }
    })
  );

  // If all failed, return fallbacks
  const anySuccess = results.some(r => r.status === 'fulfilled');
  const finalPrices = anySuccess ? prices : FALLBACK_PRICES;
  writeCache(finalPrices);
  return finalPrices;
}

export function getAssetById(id) {
  return ASSETS.find(a => a.id === id);
}

export function clearPriceCache() {
  localStorage.removeItem(CACHE_KEY);
}
