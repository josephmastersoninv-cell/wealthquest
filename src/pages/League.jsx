import React, { useMemo, useState, useEffect } from 'react';
import { Zap, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { useUserProgress } from '@/lib/useUserProgress';

function getWeekSeed() {
  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return week;
}

function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s ^= s >>> 16;
    return (s >>> 0) / 0xffffffff;
  };
}

// Time until next Monday 00:00 UTC
function getTimeUntilReset() {
  const now = new Date();
  const next = new Date(now);
  next.setUTCDate(now.getUTCDate() + ((1 + 7 - now.getUTCDay()) % 7 || 7));
  next.setUTCHours(0, 0, 0, 0);
  const diff = next - now;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`;
}

const GHOST_NAMES = [
  'AlphaHedge', 'BullRunner', 'ValueVault', 'MarketMaven', 'FundFlow',
  'YieldYoda', 'DeltaTrader', 'PortfolioPro', 'RiskRanger', 'BondBreaker',
  'IndexIris', 'CapGainCarl', 'SharpeSam', 'DivDave', 'MacroMax',
];
const GHOST_FLAGS = ['🇺🇸','🇬🇧','🇩🇪','🇫🇷','🇯🇵','🇨🇦','🇦🇺','🇧🇷','🇮🇳','🇰🇷'];

const LEAGUES = [
  {
    name: 'Bronze',
    minXp: 0,
    icon: '🥉',
    gradient: 'from-[#7c4a1e] via-[#b5651d] to-[#cd853f]',
    accent: 'text-amber-300',
    accentBg: 'bg-amber-500/15',
    ring: 'ring-amber-500/40',
    bar: 'bg-amber-400',
  },
  {
    name: 'Silver',
    minXp: 300,
    icon: '🥈',
    gradient: 'from-slate-600 via-slate-500 to-slate-400',
    accent: 'text-slate-200',
    accentBg: 'bg-slate-400/15',
    ring: 'ring-slate-400/40',
    bar: 'bg-slate-400',
  },
  {
    name: 'Gold',
    minXp: 800,
    icon: '🥇',
    gradient: 'from-yellow-700 via-yellow-500 to-amber-400',
    accent: 'text-yellow-200',
    accentBg: 'bg-yellow-400/15',
    ring: 'ring-yellow-400/40',
    bar: 'bg-yellow-400',
  },
  {
    name: 'Platinum',
    minXp: 1500,
    icon: '💠',
    gradient: 'from-cyan-800 via-cyan-600 to-teal-400',
    accent: 'text-cyan-200',
    accentBg: 'bg-cyan-400/15',
    ring: 'ring-cyan-400/40',
    bar: 'bg-cyan-400',
  },
  {
    name: 'Diamond',
    minXp: 3000,
    icon: '💎',
    gradient: 'from-violet-800 via-violet-600 to-fuchsia-500',
    accent: 'text-violet-200',
    accentBg: 'bg-violet-400/15',
    ring: 'ring-violet-400/40',
    bar: 'bg-violet-400',
  },
];

function getCurrentLeague(xp) {
  for (let i = LEAGUES.length - 1; i >= 0; i--) {
    if (xp >= LEAGUES[i].minXp) return LEAGUES[i];
  }
  return LEAGUES[0];
}

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export default function League() {
  const { progress } = useUserProgress();
  const myXp = progress?.xp ?? 0;
  const league = getCurrentLeague(myXp);
  const [timeLeft, setTimeLeft] = useState(getTimeUntilReset);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(getTimeUntilReset()), 60000);
    return () => clearInterval(t);
  }, []);

  const leaderboard = useMemo(() => {
    const rand = seededRandom(getWeekSeed() * 31 + league.name.length);
    const ghosts = Array.from({ length: 14 }, (_, i) => {
      const nameIdx = Math.floor(rand() * GHOST_NAMES.length);
      const flagIdx = Math.floor(rand() * GHOST_FLAGS.length);
      const baseXp = Math.max(myXp, 80);
      const variance = Math.floor(rand() * baseXp * 0.9) - baseXp * 0.35;
      return {
        id: `ghost-${i}`,
        name: GHOST_NAMES[nameIdx % GHOST_NAMES.length] + (i + 1),
        flag: GHOST_FLAGS[flagIdx % GHOST_FLAGS.length],
        xp: Math.max(10, Math.round(baseXp + variance)),
        isGhost: true,
      };
    });
    const me = { id: 'me', name: 'You', flag: '⭐', xp: myXp, isMe: true };
    return [...ghosts, me].sort((a, b) => b.xp - a.xp);
  }, [myXp, league.name]);

  const myRank = leaderboard.findIndex(p => p.isMe) + 1;
  const PROMO = 3;
  const DANGER_START = leaderboard.length - 2;

  // XP to reach promotion zone
  const promoXp = leaderboard[PROMO - 1]?.xp ?? 0;
  const xpToPromo = Math.max(0, promoXp - myXp + 1);
  const promoPct = Math.min(100, myRank <= PROMO ? 100 : (myXp / promoXp) * 100);

  return (
    <div className="min-h-screen bg-background pb-28 max-w-lg mx-auto">

      {/* ── League header ─────────────────────────────────────── */}
      <div className={`bg-gradient-to-br ${league.gradient} px-4 pt-12 pb-6 relative overflow-hidden`}>
        {/* Decorative glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/5 blur-2xl" />

        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1">Your League</p>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className="text-5xl drop-shadow-lg">{league.icon}</span>
              <div>
                <h1 className="text-2xl font-extrabold text-white">{league.name} League</h1>
                <p className={`text-sm font-bold ${league.accent}`}>
                  Rank #{myRank} of {leaderboard.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-black/20 rounded-xl px-3 py-2">
              <Clock className="w-3.5 h-3.5 text-white/60" />
              <span className="text-xs font-bold text-white/80">{timeLeft}</span>
            </div>
          </div>

          {/* XP to promotion */}
          {myRank > PROMO ? (
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-white/70">XP to promotion zone</span>
                <span className="text-white">{xpToPromo} XP needed</span>
              </div>
              <div className="h-2.5 bg-black/20 rounded-full overflow-hidden">
                <div
                  className={`h-full ${league.bar} rounded-full transition-all duration-700`}
                  style={{ width: `${promoPct}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 rounded-xl px-3 py-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-extrabold text-emerald-300">You're in the promotion zone! 🎉</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Podium (top 3) ────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-end justify-center gap-2">
          {[1, 0, 2].map(pos => {
            const player = leaderboard[pos];
            if (!player) return null;
            const rank = pos + 1;
            const heights = [20, 28, 14]; // index 0=rank2, 1=rank1, 2=rank3
            const podiumH = ['h-20', 'h-28', 'h-14'];
            const sizes = ['w-[88px]', 'w-[100px]', 'w-20'];

            return (
              <div key={player.id} className={`flex flex-col items-center ${sizes[pos === 0 ? 1 : pos === 1 ? 0 : 2]}`}>
                {/* Medal */}
                <span className="text-2xl mb-1">{RANK_MEDALS[rank - 1]}</span>
                {/* Avatar/flag */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl mb-1 border-2 ${
                  player.isMe ? 'border-primary bg-primary/20' : 'border-border bg-muted'
                }`}>
                  {player.flag}
                </div>
                <p className={`text-[10px] font-extrabold text-center truncate w-full px-1 ${player.isMe ? 'text-primary' : 'text-foreground'}`}>
                  {player.isMe ? 'You' : player.name.replace(/\d+$/, '').slice(0, 9)}
                </p>
                <div className="flex items-center gap-0.5 text-xs font-bold text-primary mt-0.5 mb-1">
                  <Zap className="w-3 h-3" />{player.xp}
                </div>
                {/* Podium block */}
                <div className={`w-full ${podiumH[pos === 0 ? 1 : pos === 1 ? 0 : 2]} rounded-t-xl ${
                  rank === 1 ? `bg-gradient-to-b ${league.gradient} opacity-80` :
                  rank === 2 ? 'bg-muted border border-border' :
                  'bg-muted/70 border border-border'
                }`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Legend ───────────────────────────────────────────── */}
      <div className="px-4 pb-2 flex items-center gap-4 text-[11px] font-bold text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          Top {PROMO} promote
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
          Bottom 3 relegate
        </span>
      </div>

      {/* ── Full leaderboard ─────────────────────────────────── */}
      <div className="px-4 space-y-1.5">
        {leaderboard.map((player, idx) => {
          const rank = idx + 1;
          const isPromo = rank <= PROMO;
          const isDanger = rank > DANGER_START;
          const isMe = player.isMe;

          return (
            <div
              key={player.id}
              className={`flex items-center gap-3 py-3 px-3.5 rounded-2xl border transition-all ${
                isMe
                  ? `${league.accentBg} border-primary/40 ring-2 ${league.ring}`
                  : isPromo
                  ? 'bg-emerald-500/8 border-emerald-500/20'
                  : isDanger
                  ? 'bg-rose-500/8 border-rose-500/20'
                  : 'bg-card border-border'
              }`}
            >
              {/* Rank number */}
              <div className="w-7 shrink-0 text-center">
                {rank <= 3
                  ? <span className="text-lg">{RANK_MEDALS[rank - 1]}</span>
                  : <span className={`text-sm font-extrabold ${isMe ? 'text-primary' : 'text-muted-foreground'}`}>{rank}</span>}
              </div>

              {/* Flag */}
              <span className="text-base shrink-0">{player.flag}</span>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-extrabold truncate ${isMe ? 'text-primary' : 'text-foreground'}`}>
                  {player.name}{isMe && ' ← You'}
                </p>
              </div>

              {/* XP */}
              <div className={`flex items-center gap-1 text-sm font-extrabold ${isMe ? 'text-primary' : 'text-muted-foreground'}`}>
                <Zap className="w-3.5 h-3.5" />
                {player.xp}
              </div>

              {/* Zone arrow */}
              {isPromo && !isDanger && (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              )}
              {isDanger && (
                <TrendingDown className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-5 mb-2 px-4">
        Leaderboard resets every Monday · Earn XP to climb the ranks
      </p>
    </div>
  );
}
