import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, TrendingDown, Clock, Crown, Globe, X, CheckCircle2, XCircle, ChevronDown } from 'lucide-react';
import { useUserProgress } from '@/lib/useUserProgress';
import { COUNTRIES, getMyCountry, setMyCountry, getCountryByCode } from '@/lib/countryData';
import { generateRecruitPool, getSquad, recruitPlayer, dismissPlayer, getPassiveXpToday, claimPassiveXp, SQUAD_MAX, RECRUIT_TIERS, getWeekSeed } from '@/lib/squadData';
import { fetchXpLeaderboard, fetchCountryTotals, getMyPlayerId, getMyPlayerData } from '@/lib/playerSync';
import { getTodayArenaStocks, getTodayPicks, savePicks, canRevealResults, resolvePicksNow, getPendingResults, claimResults, getStockResult, getTimeUntilReveal } from '@/lib/arenaData';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// ── Helpers ───────────────────────────────────────────────────────────────────
function seededRand(seed) {
  let s = seed >>> 0;
  return () => { s = Math.imul(s ^ (s >>> 16), 0x45d9f3b); s ^= s >>> 16; return (s >>> 0) / 0xffffffff; };
}

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

const LEAGUES = [
  { name: 'Bronze',   minXp: 0,    icon: '🥉', gradient: 'from-amber-800 via-amber-600 to-amber-400',       bar: 'bg-amber-400',   accent: 'text-amber-300',   accentBg: 'bg-amber-500/15',   ring: 'ring-amber-500/40'   },
  { name: 'Silver',   minXp: 300,  icon: '🥈', gradient: 'from-slate-600 via-slate-500 to-slate-300',       bar: 'bg-slate-300',   accent: 'text-slate-200',   accentBg: 'bg-slate-400/15',   ring: 'ring-slate-400/40'   },
  { name: 'Gold',     minXp: 800,  icon: '🥇', gradient: 'from-yellow-700 via-yellow-500 to-amber-300',     bar: 'bg-yellow-300',  accent: 'text-yellow-200',  accentBg: 'bg-yellow-400/15',  ring: 'ring-yellow-400/40'  },
  { name: 'Platinum', minXp: 1500, icon: '💠', gradient: 'from-cyan-800 via-cyan-600 to-teal-300',          bar: 'bg-cyan-300',    accent: 'text-cyan-200',    accentBg: 'bg-cyan-400/15',    ring: 'ring-cyan-400/40'    },
  { name: 'Diamond',  minXp: 3000, icon: '💎', gradient: 'from-violet-800 via-violet-600 to-fuchsia-400',   bar: 'bg-violet-300',  accent: 'text-violet-200',  accentBg: 'bg-violet-400/15',  ring: 'ring-violet-400/40'  },
  { name: 'Legend',   minXp: 6000, icon: '👑', gradient: 'from-rose-700 via-orange-500 to-amber-300',       bar: 'bg-amber-300',   accent: 'text-amber-200',   accentBg: 'bg-amber-500/15',   ring: 'ring-amber-400/40'   },
];

function getCurrentLeague(xp) {
  for (let i = LEAGUES.length - 1; i >= 0; i--) { if (xp >= LEAGUES[i].minXp) return LEAGUES[i]; }
  return LEAGUES[0];
}

const GHOST_NAMES = ['AlphaHedge','BullRunner','ValueVault','MarketMaven','FundFlow','YieldYoda','DeltaTrader','PortfolioPro','RiskRanger','BondBreaker','IndexIris','CapGainCarl','SharpeSam','MacroMax','QuantFox','PivotBear','SigmaWolf','OmegaHawk','PrimeTiger','BetaEagle'];
const MEDALS = ['🥇','🥈','🥉'];

// Country competition — ranked by combined portfolio value
function buildCountryLeaderboard(weekSeed, myPortfolio, myCountryCode) {
  const rand = seededRand(weekSeed * 7919);
  const countryMap = {};
  COUNTRIES.forEach(c => { countryMap[c.code] = { ...c, players: 0, totalValue: 0, members: [] }; });

  // Named ghost players
  GHOST_NAMES.forEach((name, i) => {
    const countryIdx = Math.floor(rand() * COUNTRIES.length);
    const code = COUNTRIES[countryIdx].code;
    const portfolioValue = Math.round((5000 + rand() * 145000) * 100) / 100;
    const flag = COUNTRIES[countryIdx].flag;
    countryMap[code].players++;
    countryMap[code].totalValue += portfolioValue;
    if (countryMap[code].members.length < 3) countryMap[code].members.push({ name, flag, portfolioValue });
  });

  // Extra anonymous ghosts for volume
  for (let i = 0; i < 60; i++) {
    const countryIdx = Math.floor(rand() * COUNTRIES.length);
    const code = COUNTRIES[countryIdx].code;
    countryMap[code].players++;
    countryMap[code].totalValue += Math.round((3000 + rand() * 80000) * 100) / 100;
  }

  // Add real player to their country
  if (myCountryCode && countryMap[myCountryCode]) {
    countryMap[myCountryCode].players++;
    countryMap[myCountryCode].totalValue += myPortfolio;
    countryMap[myCountryCode].hasMe = true;
    countryMap[myCountryCode].myValue = myPortfolio;
  }

  const list = Object.values(countryMap)
    .filter(c => c.players > 0)
    .sort((a, b) => b.totalValue - a.totalValue);

  // Attach relative bar widths (percent of leader)
  const max = list[0]?.totalValue ?? 1;
  list.forEach(c => { c.barPct = Math.round((c.totalValue / max) * 100); });

  return list;
}

function fmtValue(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Math.round(n)}`;
}

// ── Country Picker Modal ──────────────────────────────────────────────────────
function CountryPicker({ onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center p-4" onClick={onClose}>
      <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
        className="w-full max-w-sm bg-card rounded-3xl overflow-hidden shadow-2xl max-h-[70vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <p className="font-extrabold text-foreground">Select Your Country</p>
            <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search countries..." autoFocus
            className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="overflow-y-auto flex-1">
          {filtered.map(c => (
            <button key={c.code} onClick={() => { onSelect(c.code); onClose(); }}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted/50 active:bg-muted transition-colors text-left border-b border-border/50 last:border-0">
              <span className="text-2xl">{c.flag}</span>
              <span className="font-bold text-sm text-foreground">{c.name}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Recruit Card ──────────────────────────────────────────────────────────────
function RecruitCard({ player, inSquad, squadFull, onRecruit, onDismiss, coins }) {
  const tierConfig = RECRUIT_TIERS[player.tierIdx];
  const canAfford = coins >= player.cost;
  return (
    <div className={`rounded-2xl border p-4 ${tierConfig.bg} ${tierConfig.border}`}>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-2xl shrink-0">{player.avatar}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-extrabold text-foreground text-sm">{player.name}</p>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border ${tierConfig.color} ${tierConfig.border} ${tierConfig.bg}`}>
              {tierConfig.emoji} {player.tier}
            </span>
          </div>
          <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
            <span>+{player.xpDay} XP/day</span>
            <span>Win rate {player.winRate}%</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          {inSquad ? (
            <button onClick={() => onDismiss(player.id)}
              className="text-xs font-extrabold text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-2.5 py-1.5 active:scale-95">
              Release
            </button>
          ) : (
            <button
              disabled={squadFull || !canAfford}
              onClick={() => onRecruit(player)}
              className={`text-xs font-extrabold rounded-xl px-2.5 py-1.5 active:scale-95 transition-all ${
                squadFull ? 'bg-muted text-muted-foreground opacity-50' :
                !canAfford ? 'bg-muted text-muted-foreground opacity-50' :
                'bg-primary text-primary-foreground'
              }`}>
              {squadFull ? 'Full' : `💰 ${player.cost}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function League() {
  const navigate = useNavigate();
  const { progress, updateProgress } = useUserProgress();
  const briefingReadToday = localStorage.getItem('wealthquest_briefing_read') === new Date().toISOString().slice(0, 10);
  const myXp        = progress?.xp ?? 0;
  const myCoins     = progress?.coins ?? 0;
  const myPortfolio = progress?.portfolio_balance ?? 10000;
  const league      = getCurrentLeague(myXp);

  const [tab, setTab]         = useState('arena');
  const [timeLeft, setTimeLeft] = useState(getTimeUntilReset);
  const [myCountry, setMyCountryState] = useState(getMyCountry);
  const [showPicker, setShowPicker]   = useState(false);
  const [squad, setSquad]     = useState(getSquad);
  const [passiveXp, setPassiveXp] = useState(getPassiveXpToday);

  // Arena state
  const [arenaStocks]       = useState(getTodayArenaStocks);
  const [selections, setSelections] = useState({}); // { symbol: 'up'|'down' }
  const [submitted, setSubmitted]   = useState(() => getTodayPicks());
  const [results, setResults]       = useState(() => getPendingResults());
  const [timeUntilReveal, setTimeUntilReveal] = useState(getTimeUntilReveal);
  const [realPlayers, setRealPlayers] = useState([]);
  const [realCountryTotals, setRealCountryTotals] = useState(null);
  const weekSeed = getWeekSeed();
  const myPlayerData = getMyPlayerData();
  const myPlayerId = getMyPlayerId();

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(getTimeUntilReset()), 60000);
    return () => clearInterval(t);
  }, []);

  // Poll arena reveal timer every 30s
  useEffect(() => {
    const t = setInterval(() => {
      setTimeUntilReveal(getTimeUntilReveal());
      if (canRevealResults()) {
        const r = resolvePicksNow();
        if (r) setResults(r);
      }
    }, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchXpLeaderboard().then(p => { if (p.length) setRealPlayers(p); });
    fetchCountryTotals().then(t => { if (t) setRealCountryTotals(t); });
  }, []);

  // ── Weekly leaderboard ────────────────────────────────────────────────────
  const leaderboard = useMemo(() => {
    const rand = seededRand(weekSeed * 31 + league.name.length);
    const ghosts = Array.from({ length: 14 }, (_, i) => {
      const nameIdx = Math.floor(rand() * GHOST_NAMES.length);
      const countryIdx = Math.floor(rand() * COUNTRIES.length);
      const baseXp = Math.max(myXp, 80);
      const variance = Math.floor(rand() * baseXp * 0.9) - baseXp * 0.35;
      const country = COUNTRIES[countryIdx];
      return { id: `ghost-${i}`, name: GHOST_NAMES[nameIdx % GHOST_NAMES.length], flag: country.flag, countryName: country.name, xp: Math.max(10, Math.round(baseXp + variance)), isGhost: true };
    });
    const myCountryData = myCountry ? getCountryByCode(myCountry) : null;
    const me = { id: 'me', name: myPlayerData?.name ?? 'You', avatar: myPlayerData?.avatar, flag: myCountryData?.flag ?? '⭐', xp: myXp, isMe: true };

    if (realPlayers.length) {
      const others = realPlayers
        .filter(p => p.id !== myPlayerId)
        .map(p => {
          const c = getCountryByCode(p.country_code);
          return { id: p.id, name: p.name, avatar: p.avatar, flag: c?.flag ?? '🌍', xp: p.xp ?? 0, real: true };
        });
      const padded = others.length < 5 ? [...others, ...ghosts.slice(0, 10 - others.length)] : others;
      return [...padded, me].sort((a, b) => b.xp - a.xp);
    }

    return [...ghosts, me].sort((a, b) => b.xp - a.xp);
  }, [myXp, league.name, myCountry, realPlayers, myPlayerId, myPlayerData]);

  const myRank = leaderboard.findIndex(p => p.isMe) + 1;
  const PROMO = 3;
  const DANGER_START = leaderboard.length - 3;
  const promoXp = leaderboard[PROMO - 1]?.xp ?? 0;
  const xpToPromo = Math.max(0, promoXp - myXp + 1);
  const promoPct = Math.min(100, myRank <= PROMO ? 100 : (myXp / promoXp) * 100);

  // ── Country leaderboard ───────────────────────────────────────────────────
  const countryBoard = useMemo(() => {
    if (realCountryTotals) {
      // Build from real Supabase data + add ghost volume for empty countries
      const rand = seededRand(weekSeed * 7919);
      const countryMap = {};
      COUNTRIES.forEach(c => { countryMap[c.code] = { ...c, players: 0, totalValue: 0, members: [], hasMe: false, myValue: 0 }; });

      // Real players from Supabase
      Object.entries(realCountryTotals).forEach(([code, data]) => {
        if (countryMap[code]) {
          countryMap[code].players = data.count;
          countryMap[code].totalValue = data.total;
        }
      });

      // My country contribution (using real portfolio key)
      const myPortfolioVal = (() => {
        try { const p = JSON.parse(localStorage.getItem('wealthquest_portfolio') ?? 'null'); if (!p) return 10000; const h = p.holdings ?? []; return p.cash + h.reduce((s, hh) => s + hh.avgCost * hh.shares, 0); } catch { return 10000; }
      })();
      if (myCountry && countryMap[myCountry]) {
        countryMap[myCountry].hasMe = true;
        countryMap[myCountry].myValue = myPortfolioVal;
      }

      // Pad with ghosts if few real players
      if (Object.values(realCountryTotals).reduce((s, v) => s + v.count, 0) < 20) {
        GHOST_NAMES.forEach((name, i) => {
          const countryIdx = Math.floor(rand() * COUNTRIES.length);
          const code = COUNTRIES[countryIdx].code;
          const portfolioValue = Math.round((5000 + rand() * 145000) * 100) / 100;
          countryMap[code].players++;
          countryMap[code].totalValue += portfolioValue;
        });
      }

      const list = Object.values(countryMap).filter(c => c.players > 0).sort((a, b) => b.totalValue - a.totalValue);
      const max = list[0]?.totalValue ?? 1;
      list.forEach(c => { c.barPct = Math.round((c.totalValue / max) * 100); });
      return list;
    }
    return buildCountryLeaderboard(weekSeed, myPortfolio, myCountry);
  }, [weekSeed, myPortfolio, myCountry, realCountryTotals]);
  const myCountryRank = countryBoard.findIndex(c => c.hasMe) + 1;

  // ── Squad ─────────────────────────────────────────────────────────────────
  const recruitPool = useMemo(() => generateRecruitPool(weekSeed), [weekSeed]);
  const squadIds = new Set(squad.map(m => m.id));
  const totalSquadXp = squad.reduce((s, m) => s + (m.xpDay ?? 0), 0);

  function handleRecruit(player) {
    if (myCoins < player.cost) { toast.error(`Need ${player.cost} coins`); return; }
    if (recruitPlayer(player)) {
      updateProgress({ coins: myCoins - player.cost });
      setSquad(getSquad());
      toast.success(`${player.avatar} ${player.name} recruited! +${player.xpDay} XP/day`);
    } else {
      toast.error(squad.length >= SQUAD_MAX ? 'Squad is full!' : 'Already recruited');
    }
  }

  function handleDismiss(id) {
    dismissPlayer(id);
    setSquad(getSquad());
    toast('Player released from squad');
  }

  function handleClaimPassive() {
    if (passiveXp <= 0) { toast('Already claimed today'); return; }
    const xp = claimPassiveXp();
    updateProgress({ xp: myXp + xp });
    setPassiveXp(0);
    toast.success(`+${xp} XP from your squad!`);
  }

  function handleSelectCountry(code) {
    setMyCountry(code);
    setMyCountryState(code);
    toast.success(`${getCountryByCode(code)?.flag} Country set to ${getCountryByCode(code)?.name}!`);
  }

  function handleSelect(symbol, dir) {
    setSelections(prev => ({ ...prev, [symbol]: prev[symbol] === dir ? undefined : dir }));
  }

  function handleSubmitPicks() {
    const picks = arenaStocks.map(s => ({ symbol: s.symbol, direction: selections[s.symbol] }));
    savePicks(picks);
    setSubmitted(getTodayPicks());
    toast.success('Picks locked in! Results in 1 hour 🔒');
  }

  function handleRevealResults() {
    const r = resolvePicksNow();
    if (r) setResults(r);
  }

  function handleClaimArena() {
    const r = claimResults();
    if (!r) return;
    const newBalance = (progress?.portfolio_balance ?? 10000) + r.portfolioChange;
    updateProgress({
      xp: (progress?.xp ?? 0) + r.xpGain,
      portfolio_balance: Math.max(0, newBalance),
    });
    setResults({ ...r, claimed: true });
    const emoji = r.wins === 5 ? '🏆' : r.wins >= 3 ? '🎉' : '💸';
    toast.success(`${emoji} ${r.wins}/5 correct! ${r.portfolioChange >= 0 ? '+' : ''}$${r.portfolioChange} to portfolio`);
  }

  const allPicked = arenaStocks.every(s => selections[s.symbol]);

  const tabs = [
    { id: 'arena',   label: '⚡ Arena'     },
    { id: 'weekly',  label: '🏆 Weekly'    },
    { id: 'country', label: '🌍 Countries' },
    { id: 'squad',   label: '👥 Squad'     },
  ];

  const myCountryData = myCountry ? getCountryByCode(myCountry) : null;

  return (
    <div className="min-h-screen bg-background pb-28 max-w-lg mx-auto">

      {/* ── Header ── */}
      <div className={`bg-gradient-to-br ${league.gradient} px-4 pt-12 pb-6 relative overflow-hidden`}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-5xl drop-shadow-lg">{league.icon}</span>
              <div>
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Your League</p>
                <h1 className="text-2xl font-extrabold text-white">{league.name}</h1>
                <p className={`text-sm font-bold ${league.accent}`}>Rank #{myRank} · {myXp} XP</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1.5 bg-black/20 rounded-xl px-3 py-1.5">
                <Clock className="w-3 h-3 text-white/60" />
                <span className="text-xs font-bold text-white/80">{timeLeft}</span>
              </div>
              {myCountryData ? (
                <button onClick={() => setShowPicker(true)}
                  className="flex items-center gap-1.5 bg-black/20 rounded-xl px-3 py-1.5 active:scale-95">
                  <span className="text-base">{myCountryData.flag}</span>
                  <span className="text-xs font-bold text-white/80">{myCountryData.name}</span>
                </button>
              ) : (
                <button onClick={() => setShowPicker(true)}
                  className="flex items-center gap-1.5 bg-white/20 rounded-xl px-3 py-1.5 active:scale-95">
                  <Globe className="w-3 h-3 text-white" />
                  <span className="text-xs font-bold text-white">Set country</span>
                </button>
              )}
            </div>
          </div>

          {/* Promo bar */}
          {myRank > PROMO ? (
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-white/70">XP to promotion zone</span>
                <span className="text-white">{xpToPromo} XP needed</span>
              </div>
              <div className="h-2.5 bg-black/20 rounded-full overflow-hidden">
                <div className={`h-full ${league.bar} rounded-full transition-all duration-700`} style={{ width: `${promoPct}%` }} />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 rounded-xl px-3 py-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-extrabold text-emerald-300">In the promotion zone! 🎉</span>
            </div>
          )}
        </div>
      </div>

      {/* ── "Someone passed you" alert ── */}
      {(() => {
        const prevRankKey = 'wealthquest_prev_league_rank';
        const prevRank = parseInt(localStorage.getItem(prevRankKey) ?? '0', 10);
        if (prevRank && myRank > prevRank) {
          return (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mx-4 mt-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl px-4 py-3 flex items-center gap-3">
              <span className="text-xl">😤</span>
              <div className="flex-1">
                <p className="text-sm font-extrabold text-rose-400">You dropped to #{myRank}!</p>
                <p className="text-xs text-muted-foreground">Someone just passed you. Fight back — earn XP now.</p>
              </div>
              <button onClick={() => { localStorage.setItem(prevRankKey, String(myRank)); }}
                className="text-xs font-bold text-muted-foreground">✕</button>
            </motion.div>
          );
        }
        if (myRank !== prevRank) localStorage.setItem(prevRankKey, String(myRank));
        return null;
      })()}

      {/* ── Tabs ── */}
      <div className="flex border-b border-border bg-card">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-xs font-extrabold uppercase tracking-wide border-b-2 transition-all ${
              tab === t.id ? 'text-primary border-primary' : 'text-muted-foreground border-transparent'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence>

        {/* ── ARENA TAB ── */}
        {tab === 'arena' && (
          <motion.div key="arena" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="px-4 pt-5 pb-6 space-y-4">

            {/* Hero headline */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-foreground">Market Clash ⚡</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Pick 5 stocks UP or DOWN · Results in 1 hour · Affects your portfolio & rank</p>
              </div>
              <button
                onClick={() => navigate('/news?from=arena')}
                className={`shrink-0 flex items-center gap-1.5 text-xs font-extrabold px-3 py-2 rounded-xl transition-all active:scale-95 ${
                  briefingReadToday
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-primary text-primary-foreground shadow-md shadow-primary/20 animate-pulse'
                }`}
              >
                {briefingReadToday ? '📰 Briefing read ✓' : '📰 Read Briefing'}
              </button>
            </div>

            {/* Briefing nudge — shown if not yet read today and no picks submitted */}
            {!briefingReadToday && !submitted && !results && (
              <motion.button
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate('/news?from=arena')}
                className="w-full bg-gradient-to-r from-blue-900 to-violet-900 border border-blue-500/30 rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl shrink-0">📡</div>
                <div className="flex-1 text-left">
                  <p className="font-extrabold text-white text-sm">Read Today's Briefing First</p>
                  <p className="text-xs text-white/60 mt-0.5">Live news, central bank reports & rumours — then make informed picks</p>
                </div>
                <ChevronDown className="w-4 h-4 text-white/40 -rotate-90 shrink-0" />
              </motion.button>
            )}

            {/* ── Results unclaimed ── */}
            {results && !results.claimed && (
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-card border border-border rounded-3xl overflow-hidden">
                <div className={`px-4 py-3 ${results.wins >= 3 ? 'bg-emerald-500/20 border-b border-emerald-500/30' : 'bg-rose-500/10 border-b border-rose-500/20'}`}>
                  <p className="font-extrabold text-foreground">
                    {results.wins === 5 ? '🏆 Perfect score!' : results.wins >= 3 ? `🎉 ${results.wins}/5 correct` : `💸 ${results.wins}/5 correct`}
                  </p>
                  <p className={`text-sm font-bold mt-0.5 ${results.portfolioChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {results.portfolioChange >= 0 ? '+' : ''}${results.portfolioChange} to portfolio · +{results.xpGain} XP
                  </p>
                </div>
                <div className="p-4 space-y-2">
                  {results.results.map(r => (
                    <div key={r.symbol} className="flex items-center gap-3">
                      <span className={`text-lg ${r.won ? 'grayscale-0' : 'opacity-40'}`}>
                        {arenaStocks.find(s => s.symbol === r.symbol)?.emoji ?? '📊'}
                      </span>
                      <span className="text-sm font-bold text-foreground flex-1">{r.symbol}</span>
                      <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${r.direction === 'up' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {r.direction === 'up' ? '📈 UP' : '📉 DOWN'}
                      </span>
                      {r.won
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        : <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                    </div>
                  ))}
                </div>
                <div className="px-4 pb-4">
                  <button onClick={handleClaimArena}
                    className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm active:scale-95 transition-all">
                    Claim Rewards 🎁
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Results already claimed ── */}
            {results?.claimed && (
              <div className="bg-muted/40 border border-border rounded-2xl px-4 py-5 text-center">
                <p className="text-2xl mb-1">✅</p>
                <p className="font-extrabold text-foreground">Rewards claimed!</p>
                <p className="text-xs text-muted-foreground mt-1">New picks available tomorrow</p>
              </div>
            )}

            {/* ── Picks pending reveal ── */}
            {submitted && !submitted.resolved && !results && (
              <div className="bg-card border border-border rounded-3xl overflow-hidden">
                <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 flex items-center gap-3">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="flex-1">
                    <p className="font-extrabold text-foreground text-sm">Picks locked in 🔒</p>
                    <p className="text-xs text-muted-foreground">
                      {canRevealResults() ? 'Ready to reveal!' : `Results in ~${timeUntilReveal}`}
                    </p>
                  </div>
                  {canRevealResults() && (
                    <button onClick={handleRevealResults}
                      className="bg-primary text-primary-foreground text-xs font-extrabold px-3 py-1.5 rounded-xl active:scale-95">
                      Reveal!
                    </button>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  {submitted.picks.map(pick => (
                    <div key={pick.symbol} className="flex items-center gap-3">
                      <span className="text-lg">{arenaStocks.find(s => s.symbol === pick.symbol)?.emoji ?? '📊'}</span>
                      <span className="text-sm font-bold text-foreground flex-1">{pick.symbol}</span>
                      <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${pick.direction === 'up' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {pick.direction === 'up' ? '📈 UP' : '📉 DOWN'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Pick phase ── */}
            {!submitted && !results && (
              <>
                <div className="space-y-3">
                  {arenaStocks.map((stock, i) => {
                    const sel = selections[stock.symbol];
                    return (
                      <motion.div key={stock.symbol}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className={`rounded-2xl border-2 transition-all overflow-hidden ${
                          sel === 'up' ? 'border-emerald-500 bg-emerald-500/5' :
                          sel === 'down' ? 'border-rose-500 bg-rose-500/5' :
                          'border-border bg-card'
                        }`}>
                        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                          <span className="text-3xl">{stock.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-extrabold text-foreground">{stock.name}</p>
                            <p className="text-xs text-muted-foreground font-bold">{stock.symbol}</p>
                          </div>
                          {sel && (
                            <span className={`text-xs font-extrabold px-2.5 py-1 rounded-xl ${sel === 'up' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                              {sel === 'up' ? '📈 UP' : '📉 DOWN'}
                            </span>
                          )}
                        </div>
                        <div className="flex border-t border-border/50">
                          <button onClick={() => handleSelect(stock.symbol, 'down')}
                            className={`flex-1 py-3 text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                              sel === 'down' ? 'bg-rose-500 text-white' : 'text-rose-400 hover:bg-rose-500/10'
                            }`}>
                            📉 DOWN
                          </button>
                          <div className="w-px bg-border/50" />
                          <button onClick={() => handleSelect(stock.symbol, 'up')}
                            className={`flex-1 py-3 text-sm font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                              sel === 'up' ? 'bg-emerald-500 text-white' : 'text-emerald-400 hover:bg-emerald-500/10'
                            }`}>
                            📈 UP
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <div className="flex justify-center gap-1 mb-3">
                    {arenaStocks.map(s => (
                      <div key={s.symbol} className={`w-2 h-2 rounded-full transition-all ${selections[s.symbol] ? 'bg-primary' : 'bg-muted'}`} />
                    ))}
                  </div>
                  <button
                    onClick={handleSubmitPicks}
                    disabled={!allPicked}
                    className={`w-full h-14 rounded-2xl font-extrabold text-base transition-all ${
                      allPicked ? 'bg-primary text-primary-foreground active:scale-95 shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}>
                    {allPicked ? 'Lock In Picks 🔒' : `Pick ${5 - Object.values(selections).filter(Boolean).length} more…`}
                  </button>
                  <p className="text-center text-xs text-muted-foreground mt-2">Correct picks earn $500 · Wrong picks cost $200</p>
                </div>
              </>
            )}

            {/* How it works */}
            <div className="bg-muted/40 border border-border rounded-2xl p-4">
              <p className="text-xs font-extrabold text-foreground mb-2">⚡ How Arena works</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>• Pick 5 stocks UP or DOWN each day</p>
                <p>• Results reveal after 1 hour</p>
                <p>• Correct → <span className="text-emerald-400 font-bold">+$500</span> to portfolio · +30 XP</p>
                <p>• Wrong → <span className="text-rose-400 font-bold">-$200</span> from portfolio</p>
                <p>• Perfect 5/5 = bonus +100 XP 🏆</p>
                <p>• Portfolio value drives your league rank</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── WEEKLY TAB ── */}
        {tab === 'weekly' && (
          <motion.div key="weekly" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Podium */}
            <div className="px-4 pt-5 pb-3">
              <div className="flex items-end justify-center gap-3">
                {[1, 0, 2].map(pos => {
                  const player = leaderboard[pos];
                  if (!player) return null;
                  const rank = pos + 1;
                  const podiumH  = ['h-20', 'h-28', 'h-14'];
                  const podiumIdx = pos === 0 ? 1 : pos === 1 ? 0 : 2;
                  const sizeClass = pos === 0 ? 'w-[90px]' : pos === 1 ? 'w-[80px]' : 'w-[80px]';
                  return (
                    <div key={player.id} className={`flex flex-col items-center ${sizeClass}`}>
                      <span className="text-2xl mb-1">{MEDALS[rank - 1]}</span>
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl mb-1 border-2 ${player.isMe ? 'border-primary bg-primary/20' : 'border-border bg-muted'}`}>
                        {player.flag}
                      </div>
                      <p className={`text-[10px] font-extrabold text-center truncate w-full px-1 ${player.isMe ? 'text-primary' : 'text-foreground'}`}>
                        {player.isMe ? 'You' : player.name.slice(0, 10)}
                      </p>
                      <div className="flex items-center gap-0.5 text-xs font-bold text-primary mb-1 mt-0.5">
                        <Zap className="w-3 h-3" />{player.xp}
                      </div>
                      <div className={`w-full ${podiumH[podiumIdx]} rounded-t-xl ${rank === 1 ? `bg-gradient-to-b ${league.gradient} opacity-80` : 'bg-muted border border-border'}`} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="px-4 pb-2 flex items-center gap-4 text-[11px] font-bold text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Top {PROMO} promote</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />Bottom 3 relegate</span>
            </div>

            {/* Full list */}
            <div className="px-4 space-y-1.5">
              {leaderboard.map((player, idx) => {
                const rank = idx + 1;
                const isPromo  = rank <= PROMO;
                const isDanger = rank > DANGER_START;
                const isMe = player.isMe;
                return (
                  <div key={player.id} className={`flex items-center gap-3 py-3 px-3.5 rounded-2xl border transition-all ${
                    isMe ? `${league.accentBg} border-primary/40 ring-2 ${league.ring}` :
                    isPromo ? 'bg-emerald-500/5 border-emerald-500/20' :
                    isDanger ? 'bg-rose-500/5 border-rose-500/20' :
                    'bg-card border-border'
                  }`}>
                    <div className="w-7 shrink-0 text-center">
                      {rank <= 3 ? <span className="text-lg">{MEDALS[rank - 1]}</span>
                        : <span className={`text-sm font-extrabold ${isMe ? 'text-primary' : 'text-muted-foreground'}`}>{rank}</span>}
                    </div>
                    <span className="text-base shrink-0">{player.avatar ?? player.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-sm font-extrabold truncate ${isMe ? 'text-primary' : 'text-foreground'}`}>
                          {isMe ? 'You ← ' : ''}{player.name}
                        </p>
                        {player.real && <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1 py-0.5 rounded-full">LIVE</span>}
                      </div>
                      {!player.avatar && player.countryName && <p className="text-[10px] text-muted-foreground">{player.countryName}</p>}
                      {player.avatar && <span className="text-[10px] text-muted-foreground">{player.flag}</span>}
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-extrabold ${isMe ? 'text-primary' : 'text-muted-foreground'}`}>
                      <Zap className="w-3.5 h-3.5" />{player.xp}
                    </div>
                    {isPromo && <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    {isDanger && <TrendingDown className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                  </div>
                );
              })}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-5 mb-2 px-4">Resets every Monday · Earn XP to climb</p>
          </motion.div>
        )}

        {/* ── COUNTRY TAB ── */}
        {tab === 'country' && (
          <motion.div key="country" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="px-4 pt-4">
            {!myCountry ? (
              <div className="text-center py-10">
                <p className="text-4xl mb-3">🌍</p>
                <p className="font-extrabold text-foreground mb-2">Represent your country</p>
                <p className="text-sm text-muted-foreground mb-5">Your portfolio value will count toward your country's total. Compete globally!</p>
                <button onClick={() => setShowPicker(true)}
                  className="bg-primary text-primary-foreground font-extrabold py-3 px-8 rounded-2xl active:scale-95">
                  Choose Country
                </button>
              </div>
            ) : (
              <>
                {/* My country hero card */}
                {myCountryData && (
                  <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-4xl">{myCountryData.flag}</span>
                      <div className="flex-1">
                        <p className="font-extrabold text-foreground">{myCountryData.name}</p>
                        <p className="text-xs text-muted-foreground">Global rank #{myCountryRank || '—'} · {countryBoard.find(c => c.hasMe)?.players ?? 0} investors</p>
                      </div>
                      <button onClick={() => setShowPicker(true)} className="text-xs text-primary font-bold bg-primary/10 rounded-xl px-3 py-1.5 active:scale-95">Change</button>
                    </div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground font-bold">Your contribution</span>
                      <span className="font-extrabold text-emerald-400">{fmtValue(myPortfolio)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-bold">Country total</span>
                      <span className="font-extrabold text-foreground">{fmtValue(countryBoard.find(c => c.hasMe)?.totalValue ?? 0)}</span>
                    </div>
                  </div>
                )}

                {/* Country leaderboard */}
                <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-3">🌍 Rankings — Combined Portfolio Value</p>
                <div className="space-y-2">
                  {countryBoard.slice(0, 15).map((c, i) => (
                    <div key={c.code} className={`rounded-2xl border px-4 py-3 ${c.hasMe ? 'bg-primary/10 border-primary/30' : 'bg-card border-border'}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-7 text-center shrink-0">
                          {i === 0 ? <Crown className="w-5 h-5 text-amber-400 mx-auto" />
                            : i === 1 ? <span className="text-lg">🥈</span>
                            : i === 2 ? <span className="text-lg">🥉</span>
                            : <span className="text-xs font-extrabold text-muted-foreground">#{i + 1}</span>}
                        </div>
                        <span className="text-2xl shrink-0">{c.flag}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-extrabold ${c.hasMe ? 'text-primary' : 'text-foreground'}`}>
                            {c.name}{c.hasMe ? ' ← You' : ''}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{c.players} investor{c.players !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-extrabold ${c.hasMe ? 'text-emerald-400' : 'text-foreground'}`}>{fmtValue(c.totalValue)}</p>
                          <p className="text-[10px] text-muted-foreground">combined</p>
                        </div>
                      </div>
                      {/* Value bar */}
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${c.hasMe ? 'bg-primary' : i === 0 ? 'bg-amber-400' : 'bg-muted-foreground/40'}`}
                          style={{ width: `${c.barPct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-muted-foreground mt-4 mb-2">Grow your portfolio to boost your country's ranking</p>
              </>
            )}
          </motion.div>
        )}

        {/* ── SQUAD TAB ── */}
        {tab === 'squad' && (
          <motion.div key="squad" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="px-4 pt-4">
            {/* Squad overview */}
            <div className="bg-card border border-border rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-extrabold text-foreground">My Squad</p>
                  <p className="text-xs text-muted-foreground">{squad.length}/{SQUAD_MAX} slots · {totalSquadXp} activity score</p>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-2.5 py-1">
                  <span className="text-sm">💰</span>
                  <span className="font-extrabold text-sm text-foreground">{myCoins}</span>
                </div>
              </div>

              {/* Squad member list (expanded, not just icons) */}
              {squad.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {squad.map(member => {
                    const tier = RECRUIT_TIERS[member.tierIdx];
                    const barPct = Math.round((member.xpDay / 50) * 100);
                    return (
                      <div key={member.id} className={`rounded-xl border p-3 ${tier.bg} ${tier.border}`}>
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl shrink-0">{member.avatar}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs font-extrabold text-foreground">{member.name}</p>
                              <span className={`text-[9px] font-extrabold px-1 py-0.5 rounded-full border ${tier.color} ${tier.border} ${tier.bg}`}>
                                {tier.emoji} {tier.tier}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 bg-black/10 rounded-full overflow-hidden">
                                <div className="h-full rounded-full opacity-70"
                                  style={{ width: `${Math.min(100, barPct)}%`, background: member.tierIdx === 0 ? '#60a5fa' : member.tierIdx === 1 ? '#34d399' : member.tierIdx === 2 ? '#a78bfa' : '#fbbf24' }} />
                              </div>
                              <span className={`text-[10px] font-extrabold ${tier.color}`}>+{member.xpDay} XP/day</span>
                            </div>
                          </div>
                          <button onClick={() => handleDismiss(member.id)}
                            className="text-[10px] font-extrabold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-2 py-1 shrink-0 active:scale-95">
                            Release
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-xl py-5 text-center mb-3">
                  <p className="text-2xl mb-1">👥</p>
                  <p className="text-xs text-muted-foreground font-bold">No squad members yet</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Recruit investors below to earn passive XP daily</p>
                </div>
              )}

              {/* Empty slots indicator */}
              {squad.length < SQUAD_MAX && (
                <p className="text-[10px] text-muted-foreground text-center mb-3">
                  {SQUAD_MAX - squad.length} slot{SQUAD_MAX - squad.length !== 1 ? 's' : ''} open ↓ recruit below
                </p>
              )}

              {/* Claim passive XP */}
              {passiveXp > 0 ? (
                <button onClick={handleClaimPassive}
                  className="w-full bg-gradient-to-r from-primary to-violet-600 text-white font-extrabold py-3 rounded-xl text-sm active:scale-[0.98] transition-all shadow-lg shadow-primary/20">
                  🎁 Claim +{passiveXp} XP from your squad
                </button>
              ) : (
                <div className="w-full bg-muted rounded-xl py-2.5 text-center text-xs text-muted-foreground font-bold">
                  {totalSquadXp > 0 ? '✓ Squad XP claimed today — come back tomorrow' : 'Recruit players below to start earning'}
                </div>
              )}
            </div>

            {/* Recruit pool */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">Available Investors</p>
              <p className="text-[10px] text-muted-foreground font-bold">Pool refreshes weekly</p>
            </div>
            <div className="space-y-2">
              {recruitPool.map(player => (
                <RecruitCard
                  key={player.id}
                  player={player}
                  inSquad={squadIds.has(player.id)}
                  squadFull={squad.length >= SQUAD_MAX}
                  onRecruit={handleRecruit}
                  onDismiss={handleDismiss}
                  coins={myCoins}
                />
              ))}
            </div>

            <div className="mt-4 bg-muted/60 border border-border rounded-2xl p-4 mb-2">
              <p className="text-xs font-extrabold text-foreground mb-2">💡 How Activity Score works</p>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p>• Each squad member has an <span className="text-foreground font-bold">Activity Score</span> — the passive XP they generate for you per day.</p>
                <p>• Higher-tier investors (Trader → Mogul) have higher scores and cost more coins to recruit.</p>
                <p>• Claim your daily XP here. The pool refreshes every Monday with new recruits.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Country picker modal */}
      <AnimatePresence>
        {showPicker && <CountryPicker onSelect={handleSelectCountry} onClose={() => setShowPicker(false)} />}
      </AnimatePresence>
    </div>
  );
}
