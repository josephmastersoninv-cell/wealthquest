// Arena — daily stock prediction game
// Each day 5 stocks are selected. Players pick UP or DOWN.
// Results reveal after a 1-hour lock. Correct picks earn portfolio money + XP.

const KEY_PICKS   = 'wealthquest_arena_picks';
const KEY_RESULTS = 'wealthquest_arena_results';
const LOCK_MS     = 60 * 60 * 1000; // 1 hour before results

export const ARENA_STOCKS = [
  { symbol: 'AAPL',    name: 'Apple',      emoji: '🍎' },
  { symbol: 'TSLA',    name: 'Tesla',      emoji: '⚡' },
  { symbol: 'MSFT',    name: 'Microsoft',  emoji: '🪟' },
  { symbol: 'GOOGL',   name: 'Alphabet',   emoji: '🔍' },
  { symbol: 'META',    name: 'Meta',       emoji: '📘' },
  { symbol: 'NVDA',    name: 'NVIDIA',     emoji: '🟢' },
  { symbol: 'AMZN',    name: 'Amazon',     emoji: '📦' },
  { symbol: 'NFLX',    name: 'Netflix',    emoji: '🎬' },
  { symbol: 'BTC-USD', name: 'Bitcoin',    emoji: '₿'  },
  { symbol: 'ETH-USD', name: 'Ethereum',   emoji: '💎' },
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

// 5 stocks for today — deterministic, same for all players
export function getTodayArenaStocks() {
  const day = Math.floor(Date.now() / 86400000);
  const rand = seededRand(day * 1337);
  const pool = [...ARENA_STOCKS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 5);
}

// Predetermined result for each stock on a given day
// (same answer for all players — if you pick right, you win)
export function getStockResult(symbol) {
  const seed = hashStr(symbol + todayKey());
  const rand = seededRand(seed);
  return rand() > 0.42 ? 'up' : 'down'; // 58% chance up, realistic skew
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
  // picks: [{ symbol, direction: 'up'|'down' }]
  localStorage.setItem(KEY_PICKS, JSON.stringify({
    date: todayKey(),
    submittedAt: Date.now(),
    picks,
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
    const trueResult = getStockResult(pick.symbol);
    const won = pick.direction === trueResult;
    return { ...pick, trueResult, won };
  });

  const wins = results.filter(r => r.won).length;
  const losses = results.length - wins;
  const portfolioChange = wins * 500 - losses * 200;
  const xpGain = wins * 30 + (wins === 5 ? 100 : 0); // bonus for perfect

  const resolved = { date: data.date, results, wins, losses, portfolioChange, xpGain, claimed: false };
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
