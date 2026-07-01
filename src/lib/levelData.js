export const LEVELS = [
  { level: 1, title: 'Novice',       minXp: 0,    maxXp: 200,  color: 'text-slate-500',   bg: 'bg-slate-100'   },
  { level: 2, title: 'Learner',      minXp: 200,  maxXp: 500,  color: 'text-green-600',   bg: 'bg-green-100'   },
  { level: 3, title: 'Analyst',      minXp: 500,  maxXp: 1000, color: 'text-blue-600',    bg: 'bg-blue-100'    },
  { level: 4, title: 'Investor',     minXp: 1000, maxXp: 1800, color: 'text-violet-600',  bg: 'bg-violet-100'  },
  { level: 5, title: 'Strategist',   minXp: 1800, maxXp: 3000, color: 'text-amber-600',   bg: 'bg-amber-100'   },
  { level: 6, title: 'Portfolio Mgr',minXp: 3000, maxXp: 5000, color: 'text-orange-600',  bg: 'bg-orange-100'  },
  { level: 7, title: 'Fund Manager', minXp: 5000, maxXp: 8000, color: 'text-rose-600',    bg: 'bg-rose-100'    },
  { level: 8, title: 'Market Wizard',minXp: 8000, maxXp: Infinity, color: 'text-yellow-600', bg: 'bg-yellow-100' },
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
