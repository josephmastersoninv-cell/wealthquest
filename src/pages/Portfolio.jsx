import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCw, X, ChevronUp, ChevronDown, Eye, EyeOff, Trophy, Crown, Star, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useUserProgress } from '@/lib/useUserProgress';
import { ASSETS, fetchAllPrices, syntheticPoints, SECTORS } from '@/lib/marketData';
import SectionIntro, { useSectionIntro } from '@/components/SectionIntro';
import { recordPortfolioValue, getPortfolioHistory } from '@/lib/portfolioHistory';
import { calcPortfolioScore, getGradeColor } from '@/lib/portfolioScore';
import MilestoneModal, { checkMilestone } from '@/components/MilestoneModal';
import { toast } from 'sonner';
import { fetchLeaderboard, syncPortfolioValue, getMyPlayerId, getMyPlayerData } from '@/lib/playerSync';
import { getCountryByCode } from '@/lib/countryData';

const PORTFOLIO_KEY = 'wealthquest_portfolio';
const WATCHLIST_KEY = 'wealthquest_watchlist';
const STARTING_CASH = 10000;
const UNLOCK_LESSONS = 5;

// ─── Seeded RNG ───────────────────────────────────────────────────────────────
function seededRand(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xFFFFFFFF; };
}

function generateLeaderboard(prices) {
  const names = [
    { name: 'Jake M.',  avatar: '👨‍💼', badge: '🏆' },
    { name: 'Sofia K.',  avatar: '👩‍💻', badge: '🔥' },
    { name: 'Alex R.',   avatar: '👨‍🎓', badge: '📈' },
    { name: 'Priya S.',  avatar: '👩‍🔬', badge: '💎' },
    { name: 'Tom B.',    avatar: '🧑‍🚀', badge: '⚡' },
    { name: 'Lea C.',    avatar: '👩‍🏫', badge: '🌟' },
    { name: 'Finn D.',   avatar: '🧑‍🎨', badge: '🚀' },
    { name: 'Mia W.',    avatar: '👩‍💼', badge: '💰' },
    { name: 'Noah T.',   avatar: '👨‍🔬', badge: '📊' },
    { name: 'Yuki A.',   avatar: '👩‍🎤', badge: '✨' },
  ];
  return names.map((p, i) => {
    const rand = seededRand(i * 31337 + 9999);
    const cash = 10000 * (0.8 + rand() * 0.4);
    const shuffled = [...ASSETS].sort(() => rand() - 0.5).slice(0, 2 + Math.floor(rand() * 3));
    let value = cash;
    let topHolding = null;
    let topVal = 0;
    shuffled.forEach(asset => {
      const price = prices[asset.id]?.price ?? 100;
      const spent = (10000 - cash) * rand();
      const shares = spent / price;
      const val = shares * price;
      value += val;
      if (val > topVal) { topVal = val; topHolding = asset; }
    });
    const returnPct = ((value - 10000) / 10000) * 100;
    return { ...p, id: i, value: Math.round(value * 100) / 100, returnPct, topHolding };
  }).sort((a, b) => b.value - a.value);
}

// ─── SVG Sparkline ────────────────────────────────────────────────────────────
function Sparkline({ points, positive, width = 64, height = 28 }) {
  const pts = points?.length >= 2 ? points : null;
  if (!pts) return <div style={{ width, height }} className="flex items-end"><div className="w-full h-0.5 bg-border rounded" /></div>;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  const w = width, h = height;
  const step = w / (pts.length - 1);
  const py = v => h - 2 - ((v - min) / range) * (h - 4);
  const d = pts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${py(v)}`).join(' ');
  const fill = `${d} L ${(pts.length - 1) * step} ${h} L 0 ${h} Z`;
  const color = positive ? '#10b981' : '#f43f5e';
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <path d={fill} fill={positive ? '#10b98118' : '#f43f5e18'} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Portfolio chart ──────────────────────────────────────────────────────────
function PortfolioChart({ history, startingCash }) {
  if (history.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-28 text-muted-foreground text-xs gap-1">
        <TrendingUp className="w-6 h-6 opacity-30" />
        <span>Chart grows as you invest</span>
      </div>
    );
  }
  const values = history.map(h => h.value);
  const min = Math.min(startingCash * 0.9, ...values);
  const max = Math.max(startingCash * 1.1, ...values);
  const range = max - min || 1;
  const w = 340, h = 100;
  const step = w / (values.length - 1);
  const py = v => h - 4 - ((v - min) / range) * (h - 8);
  const d = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${py(v)}`).join(' ');
  const positive = values.at(-1) >= startingCash;
  const color = positive ? '#10b981' : '#f43f5e';
  const fillD = `${d} L ${(values.length - 1) * step} ${h} L 0 ${h} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <line x1="0" y1={py(startingCash)} x2={w} y2={py(startingCash)}
        stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 3" className="text-border" />
      <path d={fillD} fill={color} fillOpacity="0.12" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(values.length - 1) * step} cy={py(values.at(-1))} r="3.5" fill={color} />
    </svg>
  );
}

// ─── Trade Modal (brokerage-style: amount → confirm → executed) ───────────────
function TradeModal({ asset, price, onClose, onTrade, cash, holding }) {
  const [mode, setMode]   = useState('buy');
  const [dollars, setDollars] = useState('');
  const [step, setStep]   = useState('amount'); // 'amount' | 'confirm' | 'done'

  const amt    = parseFloat(dollars) || 0;
  const shares = price > 0 ? amt / price : 0;

  const maxSell      = holding ? holding.shares * price : 0;
  const activeMax    = mode === 'buy' ? cash : maxSell;
  const canReview    = amt > 0 && shares > 0 && amt <= activeMax;
  const cashAfter    = mode === 'buy' ? cash - amt : cash + (shares * price);
  const changeInfo   = asset.change ?? 0;
  const positive     = changeInfo >= 0;

  function confirm() {
    setStep('done');
    setTimeout(() => {
      onTrade(mode, shares, amt);
    }, 1200);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center p-4" onClick={step === 'amount' ? onClose : undefined}>
      <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        className="bg-card rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* ── Step: Amount entry ── */}
        {step === 'amount' && (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-2xl">{asset.emoji}</div>
                <div>
                  <p className="font-extrabold text-foreground text-lg leading-none">{asset.symbol}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{asset.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="font-extrabold text-foreground">${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: price >= 10 ? 2 : 4 })}</p>
                    <span className={`text-xs font-extrabold ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {positive ? '▲' : '▼'} {Math.abs(changeInfo).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl bg-muted text-muted-foreground active:scale-95"><X className="w-4 h-4" /></button>
            </div>

            {/* Buy / Sell toggle */}
            <div className="flex rounded-xl bg-muted p-1 mb-5">
              {['buy', 'sell'].map(m => (
                <button key={m} onClick={() => { setMode(m); setDollars(''); }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-extrabold capitalize transition-all ${
                    mode === m
                      ? m === 'buy' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-rose-500 text-white shadow-sm'
                      : 'text-muted-foreground'
                  }`}>{m}
                </button>
              ))}
            </div>

            {/* Amount input */}
            <div className="relative mb-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-extrabold text-muted-foreground">$</span>
              <input
                type="number" inputMode="decimal" value={dollars}
                onChange={e => setDollars(e.target.value)}
                placeholder="0.00" autoFocus
                className="w-full bg-muted rounded-2xl py-4 pl-10 pr-4 text-foreground font-extrabold text-2xl focus:outline-none focus:ring-2 focus:ring-primary text-right"
              />
            </div>

            {/* Share estimate */}
            <p className="text-xs text-muted-foreground text-right mb-4 pr-1">
              {shares > 0 ? `≈ ${shares < 0.01 ? shares.toFixed(6) : shares.toFixed(4)} shares` : 'Enter amount'}
            </p>

            {/* Quick % buttons */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {(mode === 'buy'
                ? [{ l: '10%', v: activeMax * 0.10 }, { l: '25%', v: activeMax * 0.25 }, { l: '50%', v: activeMax * 0.50 }, { l: 'All', v: activeMax }]
                : [{ l: '25%', v: maxSell * 0.25 }, { l: '50%', v: maxSell * 0.50 }, { l: '75%', v: maxSell * 0.75 }, { l: 'All', v: maxSell }]
              ).map(({ l, v }) => (
                <button key={l} onClick={() => setDollars(v.toFixed(2))}
                  className="bg-muted rounded-xl py-2 text-xs font-extrabold text-muted-foreground active:scale-95 hover:bg-muted/70 transition-colors">
                  {l}
                </button>
              ))}
            </div>

            {/* Cash / position info */}
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-5 bg-muted/50 rounded-xl px-3 py-2.5">
              <span>{mode === 'buy' ? 'Available cash' : 'Position value'}</span>
              <span className="font-extrabold text-foreground">${activeMax.toFixed(2)}</span>
            </div>

            {/* Validation message */}
            {amt > 0 && amt > activeMax && (
              <p className="text-xs text-rose-400 font-bold text-center mb-3">
                {mode === 'buy' ? 'Insufficient cash' : 'You don\'t hold that many shares'}
              </p>
            )}

            <button
              onClick={() => canReview && setStep('confirm')}
              disabled={!canReview}
              className={`w-full py-4 rounded-2xl font-extrabold text-white text-base transition-all active:scale-[0.98] disabled:opacity-30 ${
                mode === 'buy' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/25' : 'bg-rose-500 shadow-lg shadow-rose-500/25'
              }`}>
              Review Order →
            </button>
          </div>
        )}

        {/* ── Step: Confirm ── */}
        {step === 'confirm' && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep('amount')} className="p-2 rounded-xl bg-muted text-muted-foreground active:scale-95">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <p className="font-extrabold text-foreground text-lg">Confirm Order</p>
            </div>

            {/* Order type badge */}
            <div className="flex items-center justify-center mb-4">
              <span className="text-xs font-extrabold bg-muted text-muted-foreground rounded-full px-4 py-1.5 tracking-widest uppercase">
                Market Order · Instant Fill
              </span>
            </div>

            {/* Order summary */}
            <div className="bg-muted rounded-2xl p-4 mb-4 space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <span className="text-2xl">{asset.emoji}</span>
                <div>
                  <p className="font-extrabold text-foreground">{asset.symbol}</p>
                  <p className="text-xs text-muted-foreground">{asset.name}</p>
                </div>
                <span className={`ml-auto text-sm font-extrabold px-3 py-1 rounded-full ${
                  mode === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>{mode === 'buy' ? 'BUY' : 'SELL'}</span>
              </div>
              {[
                { label: 'Shares', value: shares < 0.01 ? shares.toFixed(6) : shares.toFixed(4) },
                { label: 'Price per share', value: `$${price.toFixed(price >= 10 ? 2 : 4)}` },
                { label: 'Order total', value: `$${amt.toFixed(2)}`, bold: true },
                { label: 'Cash after', value: `$${cashAfter.toFixed(2)}`, color: cashAfter < 0 ? 'text-rose-400' : 'text-foreground' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{r.label}</span>
                  <span className={`text-sm ${r.bold ? 'font-extrabold text-foreground' : r.color ?? 'text-foreground'}`}>{r.value}</span>
                </div>
              ))}
            </div>

            <button onClick={confirm}
              className={`w-full py-4 rounded-2xl font-extrabold text-white text-base transition-all active:scale-[0.98] ${
                mode === 'buy' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/25' : 'bg-rose-500 shadow-lg shadow-rose-500/25'
              }`}>
              Confirm {mode === 'buy' ? 'Buy' : 'Sell'}
            </button>
          </div>
        )}

        {/* ── Step: Done ── */}
        {step === 'done' && (
          <div className="p-10 flex flex-col items-center text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
              <CheckCircle2 className={`w-16 h-16 mb-4 ${mode === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`} />
            </motion.div>
            <p className="text-2xl font-extrabold text-foreground mb-1">Order Executed</p>
            <p className="text-sm text-muted-foreground">
              {mode === 'buy' ? 'Bought' : 'Sold'} {shares.toFixed(4)} {asset.symbol} @ ${price.toFixed(2)}
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Market Mood ──────────────────────────────────────────────────────────────
function MarketMood({ prices }) {
  const list = ASSETS.filter(a => prices[a.id]);
  const upCount = list.filter(a => (prices[a.id]?.change ?? 0) > 0).length;
  const ratio = list.length > 0 ? upCount / list.length : 0.5;
  const mood = ratio > 0.65 ? 'Bullish' : ratio < 0.35 ? 'Bearish' : 'Neutral';
  const color = ratio > 0.65 ? 'text-emerald-400' : ratio < 0.35 ? 'text-rose-400' : 'text-amber-400';
  const emoji = ratio > 0.65 ? '🐂' : ratio < 0.35 ? '🐻' : '😐';
  return (
    <div className="flex items-center gap-1.5 bg-muted/60 rounded-xl px-3 py-1.5">
      <span className="text-sm">{emoji}</span>
      <span className={`text-xs font-extrabold ${color}`}>{mood}</span>
      <span className="text-xs text-muted-foreground">· {upCount}/{list.length} up</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Portfolio() {
  const { progress } = useUserProgress();
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [portfolio, setPortfolio] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PORTFOLIO_KEY) ?? 'null'); } catch { return null; }
  });
  const [watchlist, setWatchlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem(WATCHLIST_KEY) ?? '[]'); } catch { return []; }
  });
  const [tab, setTab] = useState('market');
  const [sector, setSector] = useState('All');
  const [tradeAsset, setTradeAsset] = useState(null);
  const [showBalance, setShowBalance] = useState(true);
  const [history, setHistory] = useState(getPortfolioHistory);
  const [sortByMovers, setSortByMovers] = useState(false);
  const [expandedNews, setExpandedNews] = useState(null);
  const [milestone, setMilestone] = useState(null);
  const [realPlayers, setRealPlayers] = useState([]);

  const lessons = progress?.completed_lessons?.length ?? 0;
  const unlocked = lessons >= UNLOCK_LESSONS;
  const { show: showIntro, dismiss: dismissIntro } = useSectionIntro('portfolio');

  useEffect(() => {
    if (!localStorage.getItem(PORTFOLIO_KEY)) {
      const init = { cash: STARTING_CASH, holdings: [], trades: [] };
      localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(init));
      setPortfolio(init);
    }
  }, []);

  const loadPrices = useCallback(async () => {
    setRefreshing(true);
    const p = await fetchAllPrices();
    Object.keys(p).forEach(id => {
      if (!p[id].points?.length) p[id] = { ...p[id], points: syntheticPoints(p[id].price, p[id].change) };
    });
    setPrices(p);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { loadPrices(); }, [loadPrices]);

  const cash = portfolio?.cash ?? STARTING_CASH;
  const holdings = portfolio?.holdings ?? [];

  const totalValue = useMemo(() => {
    const inv = holdings.reduce((sum, h) => sum + (prices[h.assetId]?.price ?? h.avgCost) * h.shares, 0);
    return cash + inv;
  }, [holdings, prices, cash]);

  // Record history + sync to Supabase after prices load
  useEffect(() => {
    if (!loading && totalValue > 0) {
      recordPortfolioValue(totalValue);
      setHistory(getPortfolioHistory());
      syncPortfolioValue(totalValue, progress?.xp ?? 0);
    }
  }, [loading]);

  // Fetch real leaderboard
  useEffect(() => {
    fetchLeaderboard().then(players => { if (players.length) setRealPlayers(players); });
  }, []);

  const totalGain = totalValue - STARTING_CASH;
  const totalGainPct = (totalGain / STARTING_CASH) * 100;
  const spyReturn = prices['SPY']?.change ?? 0;

  const score = useMemo(() => calcPortfolioScore({
    holdings: holdings.map(h => ({ ...h, sector: ASSETS.find(a => a.id === h.assetId)?.sector })),
    prices, history, startingCash: STARTING_CASH,
  }), [holdings, prices, history]);

  const myPlayerId = getMyPlayerId();
  const myPlayerData = getMyPlayerData();

  const leaderboard = useMemo(() => {
    const ghosts = Object.keys(prices).length ? generateLeaderboard(prices) : [];
    if (!realPlayers.length) return ghosts;
    // merge real players (excluding me — I'll be inserted at real portfolio value)
    const others = realPlayers
      .filter(p => p.id !== myPlayerId)
      .map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        value: Number(p.portfolio_value),
        returnPct: ((Number(p.portfolio_value) - 10000) / 10000) * 100,
        topHolding: null,
        real: true,
        countryCode: p.country_code,
      }));
    // pad with enough ghosts so leaderboard isn't empty
    const padded = others.length < 5 ? [...others, ...ghosts.slice(0, 10 - others.length)] : others;
    return padded.sort((a, b) => b.value - a.value);
  }, [realPlayers, prices, myPlayerId]);

  const myRank = useMemo(() => {
    if (!leaderboard.length) return null;
    const r = leaderboard.findIndex(p => totalValue > p.value);
    return r === -1 ? leaderboard.length + 1 : r + 1;
  }, [leaderboard, totalValue]);

  function savePortfolio(p) {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(p));
    setPortfolio(p);
  }

  function handleTrade(mode, shares, dollars) {
    const asset = tradeAsset;
    const price = prices[asset.id]?.price ?? 0;
    const p = { ...portfolio, holdings: [...(portfolio?.holdings ?? [])], trades: [...(portfolio?.trades ?? [])] };
    if (mode === 'buy') {
      if (dollars > p.cash) return;
      const ex = p.holdings.find(h => h.assetId === asset.id);
      if (ex) {
        const tot = ex.shares + shares;
        ex.avgCost = (ex.avgCost * ex.shares + price * shares) / tot;
        ex.shares = tot;
      } else {
        p.holdings.push({ assetId: asset.id, shares, avgCost: price });
      }
      p.cash -= dollars;
    } else {
      const h = p.holdings.find(h => h.assetId === asset.id);
      if (!h || h.shares < shares) return;
      h.shares -= shares;
      if (h.shares < 0.000001) p.holdings = p.holdings.filter(x => x.assetId !== asset.id);
      p.cash += price * shares;
    }
    p.trades.push({ type: mode, assetId: asset.id, shares, price, ts: Date.now() });
    savePortfolio(p);
    setTradeAsset(null);

    setTimeout(() => {
      const inv = p.holdings.reduce((sum, h) => sum + (prices[h.assetId]?.price ?? h.avgCost) * h.shares, 0);
      const newTotal = p.cash + inv;
      const hit = checkMilestone(newTotal);
      if (hit) setMilestone(hit);
      syncPortfolioValue(newTotal, progress?.xp ?? 0);
    }, 400);
  }

  function toggleWatchlist(id) {
    const next = watchlist.includes(id) ? watchlist.filter(w => w !== id) : [...watchlist, id];
    setWatchlist(next);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
  }

  const allSectors = ['All', 'Watchlist', ...SECTORS];

  const filteredAssets = useMemo(() => {
    let list = sector === 'Watchlist' ? ASSETS.filter(a => watchlist.includes(a.id))
      : sector === 'All' ? ASSETS : ASSETS.filter(a => a.sector === sector);
    if (sortByMovers) list = [...list].sort((a, b) => Math.abs(prices[b.id]?.change ?? 0) - Math.abs(prices[a.id]?.change ?? 0));
    return list;
  }, [sector, sortByMovers, watchlist, prices]);

  const hotMovers = useMemo(() => [...ASSETS].filter(a => prices[a.id])
    .sort((a, b) => Math.abs(prices[b.id].change) - Math.abs(prices[a.id].change)).slice(0, 5), [prices]);

  const NEWS = useMemo(() => ({
    Technology: [
      { title: 'AI chip demand drives tech rally', sentiment: 'up', time: '2h ago' },
      { title: 'Big Tech earnings beat expectations', sentiment: 'up', time: '5h ago' },
      { title: 'Fed signals rate hold — tech benefits', sentiment: 'up', time: '1d ago' },
    ],
    Finance: [
      { title: 'Banks report strong Q2 profits', sentiment: 'up', time: '3h ago' },
      { title: 'Credit card spending rises 4%', sentiment: 'up', time: '6h ago' },
    ],
    Consumer: [
      { title: 'Retail sales surprise to the upside', sentiment: 'up', time: '4h ago' },
      { title: 'EV demand softens as rates stay high', sentiment: 'down', time: '8h ago' },
    ],
    Energy: [
      { title: 'Oil climbs on OPEC supply cut rumours', sentiment: 'up', time: '1h ago' },
      { title: 'Natural gas prices slide on warm weather', sentiment: 'down', time: '3h ago' },
    ],
    Healthcare: [
      { title: 'Drug approvals fuel healthcare gains', sentiment: 'up', time: '2h ago' },
      { title: 'Insurance costs weigh on UNH outlook', sentiment: 'down', time: '5h ago' },
    ],
    'Broad Market': [
      { title: 'S&P 500 sets new intraday high', sentiment: 'up', time: '1h ago' },
      { title: 'VIX near 12-month low', sentiment: 'up', time: '4h ago' },
    ],
    Crypto: [
      { title: 'BTC surges on ETF inflow momentum', sentiment: 'up', time: '30m ago' },
      { title: 'SEC weighs new crypto custody rules', sentiment: 'down', time: '3h ago' },
    ],
  }), []);

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 pb-28 gap-4 text-center">
        <span className="text-6xl">🔒</span>
        <h2 className="text-xl font-extrabold text-foreground">Portfolio Locked</h2>
        <p className="text-sm text-muted-foreground max-w-xs">Complete {UNLOCK_LESSONS} lessons to unlock the Portfolio Simulator.</p>
        <div className="bg-muted rounded-2xl px-6 py-3">
          <p className="font-extrabold text-foreground">{lessons} / {UNLOCK_LESSONS} lessons done</p>
        </div>
      </div>
    );
  }

  const tabs = [{ id: 'market', label: 'Market' }, { id: 'holdings', label: 'Holdings' }, { id: 'leaderboard', label: 'Rank' }];

  return (
    <div className="min-h-screen bg-background pb-28 max-w-lg mx-auto">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 bg-card border-b border-border">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Portfolio Value</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              {showBalance
                ? <p className="text-3xl font-extrabold text-foreground">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                : <p className="text-3xl font-extrabold text-foreground">••••••</p>
              }
              <button onClick={() => setShowBalance(v => !v)} className="text-muted-foreground">
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className={`flex items-center gap-1 text-sm font-bold mt-0.5 ${totalGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalGain >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {totalGain >= 0 ? '+' : ''}${Math.abs(totalGain).toFixed(2)} ({totalGain >= 0 ? '+' : ''}{totalGainPct.toFixed(2)}%)
              <span className="text-muted-foreground font-normal text-xs ml-1">all time</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <button onClick={loadPrices} className="p-2 rounded-xl bg-muted text-muted-foreground active:scale-95">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center gap-1 bg-muted rounded-xl px-2.5 py-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-extrabold text-foreground">{score.score}</span>
              <span className={`text-xs font-extrabold ${getGradeColor(score.grade)}`}>{score.grade}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
          <span>vs S&P 500: <span className={spyReturn >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{spyReturn >= 0 ? '+' : ''}{spyReturn.toFixed(2)}%</span></span>
          <span>Cash: <span className="text-foreground font-bold">${cash.toFixed(2)}</span></span>
          {myRank && <span>Rank: <span className="text-primary font-bold">#{myRank}</span></span>}
        </div>

        <div className="h-28">
          <PortfolioChart history={history} startingCash={STARTING_CASH} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-card px-4">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-xs font-extrabold uppercase tracking-wide transition-all border-b-2 ${tab === t.id ? 'text-primary border-primary' : 'text-muted-foreground border-transparent'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {/* ─── MARKET ─── */}
        {tab === 'market' && (
          <motion.div key="market" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="px-4 pt-4">
            <div className="flex items-center justify-between mb-3">
              <MarketMood prices={prices} />
              <button onClick={() => setSortByMovers(v => !v)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl ${sortByMovers ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                Top Movers
              </button>
            </div>

            {/* Hot movers chips */}
            {!loading && hotMovers.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide mb-2">🔥 Hot Today</p>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {hotMovers.map(asset => {
                    const p = prices[asset.id];
                    const up = (p?.change ?? 0) >= 0;
                    return (
                      <button key={asset.id} onClick={() => setTradeAsset(asset)}
                        className="flex-shrink-0 bg-card border border-border rounded-2xl p-3 min-w-[84px] active:scale-95 transition-all text-left">
                        <p className="text-xl mb-0.5">{asset.emoji}</p>
                        <p className="text-xs font-extrabold text-foreground">{asset.symbol}</p>
                        <p className={`text-xs font-bold ${up ? 'text-emerald-400' : 'text-rose-400'}`}>{up ? '+' : ''}{p?.change?.toFixed(2) ?? '—'}%</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sector filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">
              {allSectors.map(s => (
                <button key={s} onClick={() => setSector(s)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all ${sector === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {s === 'Watchlist' ? `⭐ ${s}` : s}
                </button>
              ))}
            </div>

            {/* Asset list */}
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />)}</div>
            ) : (
              <div className="space-y-1.5">
                {filteredAssets.map(asset => {
                  const pd = prices[asset.id];
                  const up = (pd?.change ?? 0) >= 0;
                  const held = holdings.some(h => h.assetId === asset.id);
                  const watched = watchlist.includes(asset.id);
                  return (
                    <div key={asset.id} className="flex items-center gap-3 bg-card border border-border rounded-2xl px-3 py-3 transition-all">
                      <span className="text-xl shrink-0">{asset.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-extrabold text-foreground">{asset.symbol}</p>
                          {held && <span className="text-[9px] font-extrabold bg-primary/15 text-primary rounded px-1 py-0.5">HELD</span>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{asset.name}</p>
                      </div>
                      <Sparkline points={pd?.points} positive={up} width={52} height={26} />
                      <div className="text-right shrink-0 min-w-[68px]">
                        <p className="text-sm font-extrabold text-foreground">${pd?.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: pd?.price >= 100 ? 2 : 4 }) ?? '—'}</p>
                        <p className={`text-xs font-bold ${up ? 'text-emerald-400' : 'text-rose-400'}`}>{up ? '+' : ''}{pd?.change?.toFixed(2) ?? '—'}%</p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button onClick={() => setTradeAsset(asset)}
                          className="bg-primary text-primary-foreground rounded-lg px-2.5 py-1 text-xs font-extrabold active:scale-95">
                          Trade
                        </button>
                        <button onClick={() => toggleWatchlist(asset.id)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-extrabold active:scale-95 ${watched ? 'bg-amber-400/20 text-amber-400' : 'bg-muted text-muted-foreground'}`}>
                          {watched ? '⭐' : '☆'}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filteredAssets.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    {sector === 'Watchlist' ? 'No assets watchlisted. Tap ☆ to add.' : 'No assets here.'}
                  </p>
                )}
              </div>
            )}

            {/* News */}
            <div className="mt-6 mb-2">
              <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide mb-2">Market News</p>
              <div className="space-y-2">
                {Object.entries(NEWS).map(([sec, articles]) => (
                  <div key={sec} className="bg-card border border-border rounded-2xl overflow-hidden">
                    <button onClick={() => setExpandedNews(expandedNews === sec ? null : sec)}
                      className="w-full flex items-center justify-between px-4 py-3 active:scale-[0.99]">
                      <p className="text-sm font-extrabold text-foreground">{sec}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{articles.length} stories</span>
                        {expandedNews === sec ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>
                    <AnimatePresence>
                      {expandedNews === sec && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                          <div className="px-4 pb-3 space-y-2 border-t border-border">
                            {articles.map((a, i) => (
                              <div key={i} className="flex items-start gap-2 pt-2">
                                <span className="text-sm mt-0.5">{a.sentiment === 'up' ? '📈' : '📉'}</span>
                                <div>
                                  <p className="text-xs text-foreground font-semibold">{a.title}</p>
                                  <p className="text-[10px] text-muted-foreground">{a.time}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── HOLDINGS ─── */}
        {tab === 'holdings' && (
          <motion.div key="holdings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="px-4 pt-4">
            {/* Score card */}
            <div className="bg-card border border-border rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Investor Rating</p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-3xl font-extrabold text-foreground">{score.score}</span>
                    <span className={`text-xl font-extrabold ${getGradeColor(score.grade)}`}>{score.grade}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{score.label}</p>
                </div>
                <span className="text-4xl">{score.grade === 'S' ? '👑' : score.grade === 'A' ? '🏆' : score.grade === 'B' ? '🥈' : '📈'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Diversification', val: score.diversityScore, max: 35 },
                  { label: 'Performance', val: Math.round(score.perfScore), max: 35 },
                  { label: 'Activity', val: score.activityScore, max: 20 },
                  { label: 'Consistency', val: score.historyScore, max: 10 },
                ].map(m => (
                  <div key={m.label} className="bg-muted rounded-xl p-2.5">
                    <div className="flex justify-between mb-1">
                      <p className="text-[10px] font-bold text-muted-foreground">{m.label}</p>
                      <p className="text-[10px] font-extrabold text-foreground">{m.val}/{m.max}</p>
                    </div>
                    <div className="h-1.5 bg-background rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(m.val / m.max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {holdings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">💼</p>
                <p className="font-extrabold text-foreground mb-1">No holdings yet</p>
                <p className="text-sm text-muted-foreground">Go to Market and make your first trade!</p>
                <button onClick={() => setTab('market')} className="mt-4 bg-primary text-primary-foreground rounded-xl px-6 py-2.5 text-sm font-extrabold active:scale-95">Browse Market</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-1 mb-2">
                  <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide">{holdings.length} Positions</p>
                  <p className="text-xs text-muted-foreground">Cash: ${cash.toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  {holdings.map(h => {
                    const asset = ASSETS.find(a => a.id === h.assetId);
                    if (!asset) return null;
                    const pd = prices[h.assetId];
                    const cur = pd?.price ?? h.avgCost;
                    const value = cur * h.shares;
                    const cost = h.avgCost * h.shares;
                    const gain = value - cost;
                    const gainPct = (gain / cost) * 100;
                    const up = gain >= 0;
                    return (
                      <div key={h.assetId} className="bg-card border border-border rounded-2xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xl">{asset.emoji}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-extrabold text-foreground text-sm">{asset.symbol} <span className="text-muted-foreground font-normal text-xs">{asset.name}</span></p>
                              <p className="font-extrabold text-foreground">${value.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-xs text-muted-foreground">{h.shares.toFixed(6)} shares</p>
                              <p className={`text-xs font-bold ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {up ? '+' : ''}${gain.toFixed(2)} ({up ? '+' : ''}{gainPct.toFixed(2)}%)
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">Avg ${h.avgCost.toFixed(2)} · Now ${cur.toFixed(2)}</div>
                          <div className="flex items-center gap-2">
                            <Sparkline points={pd?.points} positive={up} width={44} height={20} />
                            <button onClick={() => setTradeAsset(asset)}
                              className="bg-muted text-foreground rounded-lg px-2.5 py-1 text-xs font-extrabold active:scale-95">Trade</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Trade history */}
            {(portfolio?.trades?.length ?? 0) > 0 && (
              <div className="mt-6">
                <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide mb-2">Trade History</p>
                <div className="space-y-1.5">
                  {[...(portfolio?.trades ?? [])].reverse().slice(0, 10).map((t, i) => {
                    const asset = ASSETS.find(a => a.id === t.assetId);
                    return (
                      <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-2.5">
                        <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${t.type === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>{t.type.toUpperCase()}</span>
                        <span className="text-sm">{asset?.emoji}</span>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-foreground">{asset?.symbol} · {t.shares.toFixed(4)} shares</p>
                          <p className="text-[10px] text-muted-foreground">@ ${t.price.toFixed(2)} · {new Date(t.ts).toLocaleDateString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── LEADERBOARD ─── */}
        {tab === 'leaderboard' && (
          <motion.div key="leaderboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="px-4 pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-extrabold text-foreground">Portfolio Leaderboard</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">All-time rankings by total portfolio value</p>

            {/* My rank */}
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg font-extrabold text-primary">#{myRank ?? '?'}</div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="font-extrabold text-foreground">{myPlayerData?.name ?? 'You'}</p>
                  {myPlayerData?.avatar && <span>{myPlayerData.avatar}</span>}
                  {(() => { const c = getCountryByCode(myPlayerData?.country_code); return c ? <span className="text-sm">{c.flag}</span> : null; })()}
                </div>
                <p className="text-xs text-muted-foreground">Portfolio: ${totalValue.toFixed(2)}</p>
              </div>
              <div className={`text-sm font-extrabold ${totalGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalGain >= 0 ? '+' : ''}{totalGainPct.toFixed(1)}%
              </div>
            </div>

            <div className="space-y-2">
              {loading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />) : (
                leaderboard.map((player, i) => {
                  const country = player.real ? getCountryByCode(player.countryCode) : null;
                  return (
                    <div key={player.id} className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3">
                      <div className="w-7 text-center shrink-0">
                        {i === 0 ? <Crown className="w-5 h-5 text-amber-400 mx-auto" />
                          : i === 1 ? <span className="text-sm">🥈</span>
                          : i === 2 ? <span className="text-sm">🥉</span>
                          : <span className="text-xs font-extrabold text-muted-foreground">#{i + 1}</span>}
                      </div>
                      <span className="text-xl shrink-0">{player.avatar}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-extrabold text-foreground">{player.name}</p>
                          {player.real && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded-full">LIVE</span>}
                          {country && <span className="text-sm">{country.flag}</span>}
                        </div>
                        {!player.real && player.topHolding && (
                          <p className="text-xs text-muted-foreground">Top: {player.topHolding.emoji} {player.topHolding.symbol}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-extrabold text-foreground">${player.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        <p className={`text-xs font-bold ${player.returnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {player.returnPct >= 0 ? '+' : ''}{player.returnPct.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-6 bg-muted rounded-2xl p-4 text-center">
              <p className="text-sm font-extrabold text-foreground mb-1">How to climb</p>
              <p className="text-xs text-muted-foreground">Buy diversified assets, hold through gains, and grow your total portfolio value to beat the leaderboard.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trade Modal */}
      <AnimatePresence>
        {tradeAsset && (
          <TradeModal
            asset={tradeAsset}
            price={prices[tradeAsset.id]?.price ?? 0}
            cash={cash}
            holding={holdings.find(h => h.assetId === tradeAsset.id)}
            onClose={() => setTradeAsset(null)}
            onTrade={handleTrade}
          />
        )}
      </AnimatePresence>

      {/* Milestone Modal */}
      <AnimatePresence>
        {milestone && (
          <MilestoneModal
            milestone={milestone}
            onClose={() => setMilestone(null)}
            onShare={m => {
              const text = `🏆 I just hit the "${m.label}" milestone on WealthQuest! My portfolio is growing 📈\nhttps://monelingo.vercel.app`;
              navigator.share ? navigator.share({ text }) : navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard!'));
            }}
          />
        )}
      </AnimatePresence>

      {/* Section intro */}
      <AnimatePresence>
        {showIntro && <SectionIntro section="portfolio" onDismiss={dismissIntro} />}
      </AnimatePresence>
    </div>
  );
}
