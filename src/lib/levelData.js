export const LEVELS = [
  { level: 1,  title: 'Broke Student',      minXp: 0,     maxXp: 200,   emoji: '🎒', color: 'text-slate-500',   bg: 'bg-slate-100 dark:bg-slate-800'   },
  { level: 2,  title: 'Budget Beginner',     minXp: 200,   maxXp: 500,   emoji: '💸', color: 'text-green-600',   bg: 'bg-green-100 dark:bg-green-900'   },
  { level: 3,  title: 'Coin Collector',      minXp: 500,   maxXp: 1000,  emoji: '🪙', color: 'text-blue-600',    bg: 'bg-blue-100 dark:bg-blue-900'     },
  { level: 4,  title: 'Savings Scout',       minXp: 1000,  maxXp: 1800,  emoji: '🔭', color: 'text-violet-600',  bg: 'bg-violet-100 dark:bg-violet-900' },
  { level: 5,  title: 'Market Watcher',      minXp: 1800,  maxXp: 3000,  emoji: '📡', color: 'text-amber-600',   bg: 'bg-amber-100 dark:bg-amber-900'   },
  { level: 6,  title: 'Stock Rookie',        minXp: 3000,  maxXp: 5000,  emoji: '📈', color: 'text-orange-600',  bg: 'bg-orange-100 dark:bg-orange-900' },
  { level: 7,  title: 'Bull in Training',    minXp: 5000,  maxXp: 8000,  emoji: '🐂', color: 'text-rose-600',    bg: 'bg-rose-100 dark:bg-rose-900'     },
  { level: 8,  title: 'Wall St. Apprentice', minXp: 8000,  maxXp: 12000, emoji: '🏙️', color: 'text-yellow-600',  bg: 'bg-yellow-100 dark:bg-yellow-900' },
  { level: 9,  title: 'Money Mogul',         minXp: 12000, maxXp: 18000, emoji: '💎', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900'},
  { level: 10, title: 'Wolf of Wall St.',    minXp: 18000, maxXp: Infinity, emoji: '🐺', color: 'text-amber-400', bg: 'bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900 dark:to-yellow-900' },
];

export function getLevelForXp(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getXpProgress(xp) {
  const current = getLevelForXp(xp);
  if (current.maxXp === Infinity) return { current, pct: 100, xpInLevel: xp - current.minXp, xpNeeded: 0 };
  const xpInLevel = xp - current.minXp;
  const xpNeeded = current.maxXp - current.minXp;
  const pct = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));
  return { current, pct, xpInLevel, xpNeeded };
}

export function getNextLevel(xp) {
  const current = getLevelForXp(xp);
  return LEVELS.find(l => l.level === current.level + 1) ?? null;
}
