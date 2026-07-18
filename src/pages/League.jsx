import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, TrendingDown, Clock, Crown, Globe, X, CheckCircle2, XCircle, ChevronDown } from 'lucide-react';
import { useUserProgress } from '@/lib/useUserProgress';
import { COUNTRIES, getMyCountry, setMyCountry, getCountryByCode } from '@/lib/countryData';
import { generateRecruitPool, getSquad, recruitPlayer, dismissPlayer, SQUAD_MAX, RECRUIT_TIERS, getWeekSeed } from '@/lib/squadData';
import { getDailyAdvice } from '@/lib/advisorData';
import { fetchXpLeaderboard, fetchCountryTotals, fetchPlayersByCountry, subscribeToLeaderboard, getMyPlayerId, getMyPlayerData } from '@/lib/playerSync';
import { useAuth } from '@/lib/authContext';
import { checkWeeklyReward, claimWeeklyReward, MIN_COMPETITIVE } from '@/lib/leagueRewards';
import { fetchMyDuels, challengePlayer, respondToDuel, duelGains, settleDuelIfDue, DUEL_PRIZE, DUEL_DAYS } from '@/lib/duelData';
import { sounds } from '@/lib/sound';
import { haptics } from '@/lib/haptics';
import Confetti from '@/components/Confetti';
import NewsHub from '@/components/NewsHub';
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

// ── 1v1 Portfolio Duels ───────────────────────────────────────────────────────
function DuelsCard({ players }) {
  const [state, setState] = useState({ duels: [], unavailable: true, uid: null });
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const r = await fetchMyDuels();
    setState(r);
    for (const d of (r.duels ?? [])) {
      const res = await settleDuelIfDue(d);
      if (res?.won) toast.success(`⚔️ You WON the duel vs ${d.challenger_name === undefined ? '' : (d.challenger_id === r.uid ? d.opponent_name : d.challenger_name)}! +$${DUEL_PRIZE} cash`);
      else if (res) toast(res.draw ? '⚔️ Duel ended in a draw' : '⚔️ Duel over — you lost this one');
    }
  };
  useEffect(() => { load(); }, []);

  if (state.unavailable) return null;
  const uid = state.uid;
  const active   = state.duels.filter(d => d.status === 'active');
  const incoming = state.duels.filter(d => d.status === 'pending' && d.opponent_id === uid);
  const outgoing = state.duels.filter(d => d.status === 'pending' && d.challenger_id === uid);
  const recent   = state.duels.filter(d => d.status === 'settled').slice(0, 2);

  async function sendChallenge() {
    if (!name.trim() || busy) return;
    setBusy(true);
    const r = await challengePlayer(name);
    setBusy(false);
    if (r.ok) { toast.success(`⚔️ Challenge sent to ${r.opponent}!`); setName(''); load(); }
    else toast.error(r.error);
  }

  const Row = ({ d }) => {
    const g = duelGains(d, players);
    const iAmChallenger = d.challenger_id === uid;
    const meName = iAmChallenger ? d.challenger_name : d.opponent_name;
    const themName = iAmChallenger ? d.opponent_name : d.challenger_name;
    const myG = iAmChallenger ? g.challenger : g.opponent;
    const theirG = iAmChallenger ? g.opponent : g.challenger;
    const daysLeft = d.ends_at ? Math.max(0, Math.ceil((new Date(d.ends_at) - Date.now()) / 86400000)) : DUEL_DAYS;
    const fmtG = v => v == null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
    const winning = myG != null && theirG != null && myG > theirG;
    return (
      <div className="bg-muted/50 rounded-xl px-3 py-2.5 flex items-center gap-3">
        <span className="text-lg shrink-0">⚔️</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-extrabold text-foreground truncate">You vs {themName}</p>
          <p className="text-[11px] font-bold">
            <span className={myG >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{fmtG(myG)}</span>
            <span className="text-muted-foreground"> vs </span>
            <span className={theirG >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{fmtG(theirG)}</span>
            <span className="text-muted-foreground"> · {daysLeft}d left</span>
          </p>
        </div>
        <span className={`text-[10px] font-extrabold px-2 py-1 rounded-lg shrink-0 ${winning ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
          {winning ? 'WINNING' : 'BEHIND'}
        </span>
      </div>
    );
  };

  return (
    <div className="mx-4 mt-4 mb-1 bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="font-extrabold text-foreground text-sm">⚔️ Portfolio Duels</p>
        <p className="text-[10px] font-bold text-muted-foreground">{DUEL_DAYS} days · winner +${DUEL_PRIZE}</p>
      </div>

      <div className="space-y-2 mb-3">
        {active.map(d => <Row key={d.id} d={d} />)}
        {incoming.map(d => (
          <div key={d.id} className="bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2.5 flex items-center gap-2">
            <p className="flex-1 text-xs font-extrabold text-foreground">🥊 {d.challenger_name} challenged you!</p>
            <button onClick={async () => { await respondToDuel(d, true); toast.success('Duel on! 7 days — go!'); load(); }}
              className="text-[11px] font-extrabold bg-emerald-600 text-white rounded-lg px-2.5 py-1.5 active:scale-95">Accept</button>
            <button onClick={async () => { await respondToDuel(d, false); load(); }}
              className="text-[11px] font-extrabold bg-muted text-muted-foreground rounded-lg px-2.5 py-1.5 active:scale-95">Decline</button>
          </div>
        ))}
        {outgoing.map(d => (
          <p key={d.id} className="text-[11px] font-bold text-muted-foreground px-1">⏳ Waiting for {d.opponent_name} to accept…</p>
        ))}
        {recent.map(d => (
          <p key={d.id} className="text-[11px] font-bold px-1">
            {d.winner_id === uid ? '🏆' : d.winner_id ? '💀' : '🤝'} vs {d.challenger_id === uid ? d.opponent_name : d.challenger_name} — {d.winner_id === uid ? `won +$${DUEL_PRIZE}` : d.winner_id ? 'lost' : 'draw'}
          </p>
        ))}
        {!active.length && !incoming.length && !outgoing.length && !recent.length && (
          <p className="text-[11px] text-muted-foreground">Challenge any player to a 7-day gains race — biggest % portfolio gain wins.</p>
        )}
      </div>

      <div className="flex gap-2">
        <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChallenge()}
          placeholder="Challenge a username…"
          className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        <button onClick={sendChallenge} disabled={busy || !name.trim()}
          className="shrink-0 bg-primary text-primary-foreground text-xs font-extrabold px-3.5 rounded-xl active:scale-95 disabled:opacity-40">
          Duel ⚔️
        </button>
      </div>
    </div>
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
            <span>📨 Daily advice</span>
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
  const { progress, updateProgress } = useUserProgress();
  const { player: authPlayer, isAuthenticated } = useAuth();
  const myXp        = progress?.xp ?? 0;
  const myCoins     = progress?.coins ?? 0;
  const myPortfolio = (() => {
    try {
      const p = JSON.parse(localStorage.getItem('wealthquest_portfolio') ?? 'null');
      if (!p) return progress?.portfolio_balance ?? 10000;
      const cash = p.cash ?? 0;
      const invested = (p.holdings ?? []).reduce((s, h) => s + h.avgCost * h.shares, 0);
      const bondVal  = (p.bondHoldings ?? []).reduce((s, b) => s + b.purchasePrice * b.quantity, 0);
      return cash + invested + bondVal;
    } catch { return progress?.portfolio_balance ?? 10000; }
  })();
  const league      = getCurrentLeague(myXp);

  const [tab, setTab]         = useState('news');
  const [timeLeft, setTimeLeft] = useState(getTimeUntilReset);
  const [myCountry, setMyCountryState] = useState(getMyCountry);
  const [showPicker, setShowPicker]   = useState(false);
  const [squad, setSquad]     = useState(getSquad);

  // Arena state
  const [realPlayers, setRealPlayers] = useState([]);
  const [realCountryTotals, setRealCountryTotals] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null); // country object for drill-down sheet
  const [countryPlayers, setCountryPlayers] = useState([]);
  const [countryPlayersLoading, setCountryPlayersLoading] = useState(false);
  const weekSeed = getWeekSeed();
  const myPlayerData = getMyPlayerData();
  const myPlayerId = getMyPlayerId();

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(getTimeUntilReset()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // Initial load
    fetchXpLeaderboard().then(p => { if (p.length) setRealPlayers(p); });
    fetchCountryTotals().then(t => { if (t) setRealCountryTotals(t); });

    // Real-time — updates the moment any player's XP or portfolio changes
    const unsub = subscribeToLeaderboard(({ players, countryTotals }) => {
      if (players.length) setRealPlayers(players);
      if (countryTotals)  setRealCountryTotals(countryTotals);
    });
    return unsub;
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
    const myName = authPlayer?.name ?? myPlayerData?.name ?? 'You';
    const myAvatar = authPlayer?.avatar ?? myPlayerData?.avatar;
    const me = { id: 'me', name: myName, avatar: myAvatar, flag: myCountryData?.flag ?? '⭐', xp: myXp, isMe: true };

    if (realPlayers.length) {
      const myAuthId = authPlayer?.id ?? myPlayerId;
      const others = realPlayers
        .filter(p => p.id !== myAuthId)
        .map(p => {
          const c = getCountryByCode(p.country_code);
          return { id: p.id, name: p.name, avatar: p.avatar, flag: c?.flag ?? '🌍', xp: p.xp ?? 0, real: true };
        });
      return [...others, me].sort((a, b) => b.xp - a.xp);
    }

    return [me];
  }, [myXp, league.name, myCountry, realPlayers, myPlayerId, myPlayerData]);

  const myRank = leaderboard.findIndex(p => p.isMe) + 1;

  // ── Weekly reward: claim last week's finish when a new week starts ──────────
  const [weeklyReward, setWeeklyReward] = useState(null);
  const [claimConfetti, setClaimConfetti] = useState(false);
  useEffect(() => {
    if (myRank < 1) return;
    const pending = checkWeeklyReward(weekSeed, myRank, leaderboard.length);
    if (pending) setWeeklyReward(pending);
  }, [weekSeed, myRank, leaderboard.length]);

  function claimReward() {
    if (!weeklyReward) return;
    updateProgress({ coins: (progress?.coins ?? 0) + weeklyReward.coins });
    claimWeeklyReward(weeklyReward.week);
    sounds.coinCollect();
    haptics.streak();
    setClaimConfetti(true);
    toast.success(`+${weeklyReward.coins} 💰 · ${weeklyReward.title}!`);
    setWeeklyReward(null);
  }

  const PROMO = 3;
  const DANGER_START = leaderboard.length - 3;
  const promoXp = leaderboard[PROMO - 1]?.xp ?? 0;
  const xpToPromo = Math.max(0, promoXp - myXp + 1);
  const promoPct = Math.min(100, myRank <= PROMO ? 100 : (myXp / promoXp) * 100);

  // ── Country leaderboard ───────────────────────────────────────────────────
  const countryBoard = useMemo(() => {
    const countryMap = {};

    // Seed with real Supabase data if available
    if (realCountryTotals) {
      Object.entries(realCountryTotals).forEach(([code, data]) => {
        const countryInfo = getCountryByCode(code);
        if (!countryInfo) return;
        countryMap[code] = { ...countryInfo, players: data.count, totalValue: data.total, hasMe: false };
      });
    }

    // Add the current user's country if signed in and has a country set
    if (myCountry) {
      const countryInfo = getCountryByCode(myCountry);
      if (countryInfo) {
        if (!countryMap[myCountry]) {
          countryMap[myCountry] = { ...countryInfo, players: 0, totalValue: 0, hasMe: false };
        }
        countryMap[myCountry].hasMe = true;
      }
    }

    const list = Object.values(countryMap).sort((a, b) => b.totalValue - a.totalValue);
    const max = list[0]?.totalValue ?? 1;
    list.forEach(c => { c.barPct = max > 0 ? Math.round((c.totalValue / max) * 100) : 0; });
    return list;
  }, [myCountry, realCountryTotals]);
  const myCountryRank = countryBoard.findIndex(c => c.hasMe) + 1;

  function handleCountryTap(country) {
    setSelectedCountry(country);
    setCountryPlayers([]);
    setCountryPlayersLoading(true);
    fetchPlayersByCountry(country.code).then(players => {
      setCountryPlayers(players);
      setCountryPlayersLoading(false);
    });
  }

  // ── Squad ─────────────────────────────────────────────────────────────────
  const recruitPool = useMemo(() => generateRecruitPool(weekSeed), [weekSeed]);
  const squadIds = new Set(squad.map(m => m.id));
  const totalSquadXp = squad.reduce((s, m) => s + (m.xpDay ?? 0), 0);

  function handleRecruit(player) {
    if (myCoins < player.cost) { toast.error(`Need ${player.cost} coins`); return; }
    if (recruitPlayer(player)) {
      updateProgress({ coins: myCoins - player.cost });
      setSquad(getSquad());
      toast.success(`${player.avatar} ${player.name} recruited! They'll send daily advice`);
    } else {
      toast.error(squad.length >= SQUAD_MAX ? 'Squad is full!' : 'Already recruited');
    }
  }

  function handleDismiss(id) {
    dismissPlayer(id);
    setSquad(getSquad());
    toast('Player released from squad');
  }

  function handleSelectCountry(code) {
    setMyCountry(code);
    setMyCountryState(code);
    toast.success(`${getCountryByCode(code)?.flag} Country set to ${getCountryByCode(code)?.name}!`);
  }

  const tabs = [
    { id: 'news',    label: '📰 News'      },
    { id: 'weekly',  label: '🏆 Weekly'    },
    { id: 'country', label: '🌍 Countries' },
    { id: 'squad',   label: '👥 Squad'     },
  ];

  const myCountryData = myCountry ? getCountryByCode(myCountry) : null;

  return (
    <div className="min-h-screen bg-background pb-28 max-w-lg mx-auto">
      <Confetti active={claimConfetti} onDone={() => setClaimConfetti(false)} />

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

        {/* ── NEWS TAB — the info hub: notifications, events, tradable news ── */}
        {tab === 'news' && (
          <motion.div key="news" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <NewsHub onOpenDuels={() => setTab('weekly')} />
          </motion.div>
        )}

        {/* ── WEEKLY TAB ── */}
        {tab === 'weekly' && (
          <motion.div key="weekly" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <DuelsCard players={realPlayers} />
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

            {/* Weekly prizes */}
            <div className="mx-4 mb-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 px-4 py-2.5">
              <p className="text-[11px] font-extrabold text-amber-500 mb-1.5 flex items-center gap-1.5">🎁 Weekly prizes · claim when the week resets</p>
              <div className="flex items-center gap-3 text-[11px] font-bold text-muted-foreground flex-wrap">
                <span>🥇 300💰</span><span>🥈 200💰</span><span>🥉 150💰</span><span>🏅 Top 10 · 80💰</span><span>⭐ 40💰</span>
              </div>
              <p className="text-[10px] text-muted-foreground/70 mt-1.5">Podium prizes need {MIN_COMPETITIVE}+ players in your league.</p>
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
            <p className="text-center text-xs text-muted-foreground mt-5 mb-2 px-4">Earn XP to climb the leaderboard</p>
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
                <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-3">🌍 Rankings — Combined Portfolio</p>
                <div className="space-y-2">
                  {countryBoard.slice(0, 15).map((c, i) => (
                    <div key={c.code} onClick={() => handleCountryTap(c)} className={`rounded-2xl border px-4 py-3 cursor-pointer active:scale-[0.98] transition-transform ${c.hasMe ? 'bg-primary/10 border-primary/30' : 'bg-card border-border'}`}>
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
                          <p className={`text-sm font-extrabold ${c.hasMe ? 'text-emerald-400' : 'text-foreground'}`}>{fmtValue(c.totalValue ?? 0)}</p>
                          <p className="text-[10px] text-muted-foreground">portfolio</p>
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
                  <p className="text-xs text-muted-foreground">{squad.length}/{SQUAD_MAX} advisors</p>
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
                              <span className={`text-[10px] font-extrabold ${tier.color}`}>{member.winRate ?? 50}% accuracy</span>
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

              {/* Daily advisor messages — grounded in real news & market direction */}
              {squad.length > 0 && (
                <div className="border-t border-border pt-3">
                  <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-2">📨 Today's advice from your squad</p>
                  <div className="space-y-2">
                    {getDailyAdvice(squad).map(a => (
                      <div key={a.memberId} className="flex items-start gap-2.5 bg-muted/50 rounded-xl p-3">
                        <span className="text-xl shrink-0">{a.avatar}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-extrabold text-foreground">{a.name}</p>
                            <span className="text-[9px] font-bold text-muted-foreground bg-muted rounded px-1 py-0.5">{a.winRate}% accuracy</span>
                          </div>
                          <p className="text-xs text-foreground/90 mt-0.5">"{a.text}"</p>
                          <p className={`text-[10px] font-extrabold mt-1 ${a.call === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            Their call: {a.call === 'up' ? '📈 UP' : '📉 DOWN'} · trust it {a.winRate}% of the time
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Higher win-rate investors read the news right more often. Use their calls in the Arena or trade the news directly.</p>
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

      {/* Country drill-down sheet */}
      <AnimatePresence>
        {selectedCountry && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedCountry(null)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-card rounded-t-3xl max-h-[75vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedCountry.flag}</span>
                  <div>
                    <p className="font-extrabold text-foreground">{selectedCountry.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {countryPlayersLoading ? 'Loading…' : `${countryPlayers.length} player${countryPlayers.length !== 1 ? 's' : ''} · ranked by XP`}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedCountry(null)} className="text-muted-foreground p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 px-5 py-3 space-y-2">
                {countryPlayersLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : countryPlayers.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">No players yet</p>
                ) : countryPlayers.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 py-2">
                    <span className="text-xs font-extrabold text-muted-foreground w-6 text-center">#{i + 1}</span>
                    <span className="text-2xl">{p.avatar ?? '🧑'}</span>
                    <p className="flex-1 font-bold text-sm text-foreground truncate">{p.name}</p>
                    <div className="flex items-center gap-1 text-primary">
                      <Zap className="w-3 h-3" />
                      <span className="text-sm font-extrabold">{(p.xp ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Weekly reward modal */}
      <AnimatePresence>
        {weeklyReward && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/75 flex items-center justify-center px-6"
          >
            <motion.div
              initial={{ scale: 0.8, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 18 }}
              className="w-full max-w-sm bg-card rounded-3xl overflow-hidden shadow-2xl border border-border text-center"
            >
              <div className={`bg-gradient-to-br ${league.gradient} px-6 py-8`}>
                <motion.div
                  initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', delay: 0.15, damping: 12 }}
                  className="text-7xl mb-2"
                >
                  {weeklyReward.emoji}
                </motion.div>
                <p className="text-white/80 text-xs font-extrabold uppercase tracking-widest">Last Week's Finish</p>
                <h2 className="text-white text-2xl font-black mt-1">{weeklyReward.title}</h2>
              </div>
              <div className="px-6 py-6 space-y-4">
                <p className="text-sm text-muted-foreground">{weeklyReward.blurb}</p>
                <div className="flex items-center justify-center gap-2 text-3xl font-black text-amber-500">
                  <span>+{weeklyReward.coins}</span><span>💰</span>
                </div>
                <button onClick={claimReward}
                  className="w-full h-14 rounded-2xl bg-primary text-white font-extrabold text-base active:scale-95 transition-all">
                  Claim Reward 🎁
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
