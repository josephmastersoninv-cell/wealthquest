// Arena — daily stock prediction game resolved against REAL market prices.
// Each day 5 assets are selected. Players pick UP or DOWN; entry prices are
// snapshotted at lock-in and compared to live prices at reveal (1 hour later).
// Weekends feature crypto only (NYSE is closed, so stock prices don't move).
// Reading the daily briefing before locking in grants +50% XP on wins.

import marketSim from './marketSim';

const KEY_PICKS   = 'wealthquest_arena_picks';
const KEY_RESULTS = 'wealthquest_arena_results';
const LOCK_MS     = 60 * 60 * 1000; // 1 hour before results

export const BRIEFING_XP_MULT = 1.5;

export const ARENA_STOCKS = [
  { symbol: 'AAPL',     assetId: 'AAPL',     name: 'Apple',     emoji: '🍎', type: 'stock'  },
  { symbol: 'TSLA',     assetId: 'TSLA',     name: 'Tesla',     emoji: '⚡', type: 'stock'  },
  { symbol: 'MSFT',     assetId: 'MSFT',     name: 'Microsoft', emoji: '🪟', type: 'stock'  },
  { symbol: 'GOOGL',    assetId: 'GOOGL',    name: 'Alphabet',  emoji: '🔍', type: 'stock'  },
  { symbol: 'META',     assetId: 'META',     name: 'Meta',      emoji: '📘', type: 'stock'  },
  { symbol: 'NVDA',     assetId: 'NVDA',     name: 'NVIDIA',    emoji: '🟢', type: 'stock'  },
  { symbol: 'AMZN',     assetId: 'AMZN',     name: 'Amazon',    emoji: '📦', type: 'stock'  },
  { symbol: 'NFLX',     assetId: 'NFLX',     name: 'Netflix',   emoji: '🎬', type: 'stock'  },
  { symbol: 'BTC-USD',  assetId: 'bitcoin',  name: 'Bitcoin',   emoji: '₿',  type: 'crypto' },
  { symbol: 'ETH-USD',  assetId: 'ethereum', name: 'Ethereum',  emoji: '💎', type: 'crypto' },
  { symbol: 'SOL-USD',  assetId: 'solana',   name: 'Solana',    emoji: '☀️', type: 'crypto' },
  { symbol: 'XRP-USD',  assetId: 'ripple',   name: 'XRP',       emoji: '🌊', type: 'crypto' },
  { symbol: 'ADA-USD',  assetId: 'cardano',  name: 'Cardano',   emoji: '🔷', type: 'crypto' },
  { symbol: 'DOGE-USD', assetId: 'dogecoin', name: 'Dogecoin',  emoji: '🐕', type: 'crypto' },
];

function todayKey() { return new Date().toISOString().slice(0, 10); }

function seededRand(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s = Math.imul(s ^ (s >>> 16), 0x45d9f3b); s ^= s >>> 16; return (s >>> 0) / 0xffffffff; };
}

function hashStr(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0;
  return h >>> 0;
}

// The market now runs 24/7 (simulated ticks around the clock), so the arena
// always uses the full stock + crypto pool — no weekend crypto-only mode.
export function isWeekendArena() {
  return false;
}

// 5 assets for today — deterministic, same for all players
export function getTodayArenaStocks() {
  const day = Math.floor(Date.now() / 86400000);
  const rand = seededRand(day * 1337);
  const pool = isWeekendArena()
    ? ARENA_STOCKS.filter(s => s.type === 'crypto')
    : [...ARENA_STOCKS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 5);
}

// Legacy fallback — only used when a pick has no recorded entry price
// (e.g. picks saved before the real-price update).
export function getStockResult(symbol) {
  const seed = hashStr(symbol + todayKey());
  const rand = seededRand(seed);
  return rand() > 0.42 ? 'up' : 'down';
}

export function getLivePrice(symbol) {
  const stock = ARENA_STOCKS.find(s => s.symbol === symbol);
  return stock ? marketSim.prices[stock.assetId]?.price ?? null : null;
}

export function getTodayPicks() {
  try {
    const raw = localStorage.getItem(KEY_PICKS);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.date !== todayKey()) return null;
    return data;
  } catch { return null; }
}

export function savePicks(picks) {
  // Snapshot real entry prices at lock-in — results compare against these.
  const entryPrices = {};
  picks.forEach(p => { entryPrices[p.symbol] = getLivePrice(p.symbol); });

  // Briefing bonus is earned by reading BEFORE locking in
  const briefingBonus = localStorage.getItem('wealthquest_briefing_read') === todayKey();

  localStorage.setItem(KEY_PICKS, JSON.stringify({
    date: todayKey(),
    submittedAt: Date.now(),
    picks,
    entryPrices,
    briefingBonus,
    resolved: false,
  }));
}

export function canRevealResults() {
  const data = getTodayPicks();
  if (!data || data.resolved) return false;
  return Date.now() - data.submittedAt >= LOCK_MS;
}

export function resolvePicksNow() {
  const data = getTodayPicks();
  if (!data || data.resolved) return null;

  const results = data.picks.map(pick => {
    const entry = data.entryPrices?.[pick.symbol];
    const now   = getLivePrice(pick.symbol);
    let trueResult, movePct = null;
    if (entry != null && now != null && entry > 0) {
      movePct = ((now - entry) / entry) * 100;
      // Flat price counts as a push — the player keeps their call
      trueResult = now > entry ? 'up' : now < entry ? 'down' : pick.direction;
    } else {
      trueResult = getStockResult(pick.symbol); // legacy fallback
    }
    return { ...pick, trueResult, won: pick.direction === trueResult, movePct };
  });

  const wins = results.filter(r => r.won).length;
  const losses = results.length - wins;
  const baseChange = wins * 500 - losses * 200 + (wins === 5 ? 500 : 0);
  // Informed Investor bonus: reading the briefing boosts positive winnings by 50%
  const bonusCash = data.briefingBonus && baseChange > 0 ? Math.round(baseChange * 0.5) : 0;
  const portfolioChange = baseChange + bonusCash;

  const resolved = {
    date: data.date, results, wins, losses,
    portfolioChange, bonusCash,
    briefingBonus: !!data.briefingBonus,
    claimed: false,
  };
  localStorage.setItem(KEY_RESULTS, JSON.stringify(resolved));
  localStorage.setItem(KEY_PICKS, JSON.stringify({ ...data, resolved: true }));
  return resolved;
}

export function getPendingResults() {
  try {
    const raw = localStorage.getItem(KEY_RESULTS);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.date !== todayKey()) return null; // stale
    return data;
  } catch { return null; }
}

export function claimResults() {
  const r = getPendingResults();
  if (!r || r.claimed) return null;
  r.claimed = true;
  localStorage.setItem(KEY_RESULTS, JSON.stringify(r));
  return r;
}

export function getTimeUntilReveal() {
  const data = getTodayPicks();
  if (!data) return null;
  const remaining = LOCK_MS - (Date.now() - data.submittedAt);
  if (remaining <= 0) return '0m';
  const m = Math.ceil(remaining / 60000);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}
