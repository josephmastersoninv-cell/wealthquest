// News hub — the League's info center. Everything you need to act on in one
// feed: personal notifications (mortgages, vacancies, rent, duels, advisor
// calls), monthly city events, and live market news with inline trading.
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { fetchNews } from '@/lib/newsClient';
import { getMonthEvents, getAssetById } from '@/lib/realEstateData';
import { fetchWorldOwnership, ownedCountsByCity, pendingRent, isVacant } from '@/lib/realEstateEngine';
import { executeTrade, getPortfolio, getLivePriceById, getHolding } from '@/lib/tradeActions';
import { getSquad } from '@/lib/squadData';
import { getDailyAdvice } from '@/lib/advisorData';
import { fetchMyDuels } from '@/lib/duelData';
import marketSim from '@/lib/marketSim';
import { toast } from 'sonner';

const SYMBOL_TO_ASSET = {
  'AAPL': 'AAPL', 'TSLA': 'TSLA', 'MSFT': 'MSFT', 'GOOGL': 'GOOGL',
  'META': 'META', 'NVDA': 'NVDA', 'AMZN': 'AMZN', 'NFLX': 'NFLX',
  'BTC-USD': 'bitcoin', 'ETH-USD': 'ethereum',
};
const SENTIMENT = {
  positive: { label: 'BULLISH', Icon: TrendingUp,   cls: 'text-emerald-500 bg-emerald-500/10' },
  negative: { label: 'BEARISH', Icon: TrendingDown, cls: 'text-rose-500 bg-rose-500/10' },
  neutral:  { label: 'NEUTRAL', Icon: Minus,        cls: 'text-muted-foreground bg-muted' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

// Compact inline trade row for a news story's main ticker
function MiniTrade({ symbol }) {
  const assetId = SYMBOL_TO_ASSET[symbol];
  const [amount, setAmount] = useState(100);
  const [, force] = useState(0);
  useEffect(() => marketSim.onPrices(() => force(t => t + 1)), []);
  if (!assetId) return null;

  const price = getLivePriceById(assetId);
  const cash = getPortfolio().cash ?? 0;
  const holding = getHolding(assetId);
  const holdingValue = holding && price ? holding.shares * price : 0;
  const maxAmt = Math.floor(Math.max(cash, holdingValue) * 100) / 100;

  const doTrade = mode => {
    const dollars = mode === 'sell' ? Math.min(amount, holdingValue) : amount;
    const r = executeTrade(assetId, dollars, mode);
    r.ok ? toast.success(`${mode === 'buy' ? 'Bought' : 'Sold'} $${dollars.toFixed(0)} of ${symbol}`) : toast.error(r.error);
    force(t => t + 1);
  };

  return (
    <div className="mt-3 pt-3 border-t border-border/60 flex items-center gap-1.5">
      <span className="text-[11px] font-black text-foreground shrink-0">
        {symbol}{price ? <span className="text-muted-foreground font-bold"> ${price >= 100 ? price.toFixed(0) : price.toFixed(2)}</span> : ''}
      </span>
      <div className="flex-1" />
      {[100, 500].map(v => (
        <button key={v} onClick={() => setAmount(v)}
          className={`px-2 py-1 rounded-md text-[10px] font-extrabold ${amount === v ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}`}>
          ${v}
        </button>
      ))}
      <button onClick={() => setAmount(maxAmt)}
        className={`px-2 py-1 rounded-md text-[10px] font-extrabold ${amount === maxAmt ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}`}>
        MAX
      </button>
      <button onClick={() => doTrade('buy')} disabled={cash < 1}
        className="px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[10px] font-extrabold active:scale-95 disabled:opacity-40">Buy</button>
      <button onClick={() => doTrade('sell')} disabled={!holding}
        className="px-2.5 py-1 rounded-md bg-rose-600 text-white text-[10px] font-extrabold active:scale-95 disabled:opacity-40">Sell</button>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-1 mb-2">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export default function NewsHub({ onOpenDuels }) {
  const [news, setNews] = useState(null);
  const [world, setWorld] = useState({});
  const [duelsIn, setDuelsIn] = useState(0);

  useEffect(() => {
    marketSim.init();
    fetchNews().then(setNews);
    fetchWorldOwnership().then(setWorld);
    fetchMyDuels().then(r => {
      if (!r.unavailable) setDuelsIn((r.duels ?? []).filter(d => d.status === 'pending' && d.opponent_id === r.uid).length);
    });
    // reading the hub counts as reading the briefing
    localStorage.setItem('wealthquest_briefing_read', new Date().toISOString().slice(0, 10));
  }, []);

  const ownedCounts = useMemo(() => ownedCountsByCity(world), [world]);
  const mine = useMemo(() => Object.values(world).filter(r => r.mine), [world]);

  // ── Personal notifications ────────────────────────────────────────────────
  const notifications = useMemo(() => {
    const n = [];
    mine.forEach(rec => {
      const a = getAssetById(rec.assetId);
      if (!a) return;
      if ((rec.mortgage?.strikes ?? 0) > 0)
        n.push({ emoji: '⚠️', text: `Mortgage ${rec.mortgage.strikes}/3 behind on ${a.name} — top up your cash or it gets repossessed`, to: '/estate', urgent: true });
      if (isVacant(rec.assetId))
        n.push({ emoji: '🚪', text: `${a.name} is VACANT — advertise for a tenant to restart the rent`, to: '/estate', urgent: true });
    });
    const rentDue = mine.reduce((s, r) => s + pendingRent(r, ownedCounts), 0);
    if (rentDue > 0) n.push({ emoji: '💰', text: `$${Math.round(rentDue).toLocaleString()} rent is ready to collect`, to: '/estate' });
    if (duelsIn > 0) n.push({ emoji: '🥊', text: `${duelsIn} duel challenge${duelsIn > 1 ? 's' : ''} waiting for your answer`, onClick: onOpenDuels });
    getDailyAdvice(getSquad()).forEach(a => {
      n.push({ emoji: '📨', text: `${a.name} (${a.winRate}%): "${a.text}" — their call: ${a.call.toUpperCase()}`, to: null });
    });
    return n;
  }, [mine, ownedCounts, duelsIn, onOpenDuels]);

  const events = getMonthEvents();

  return (
    <div className="px-4 pt-4 pb-6">
      {/* For you */}
      <Section title="🔔 For you">
        {notifications.length === 0 && (
          <div className="bg-card border border-border rounded-2xl px-4 py-3">
            <p className="text-xs font-bold text-muted-foreground">All quiet — nothing needs your attention. ✅</p>
          </div>
        )}
        {notifications.map((n, i) => {
          const inner = (
            <div className={`rounded-2xl px-4 py-3 flex items-center gap-3 border ${n.urgent ? 'bg-rose-500/10 border-rose-500/25' : 'bg-card border-border'} ${n.to || n.onClick ? 'active:scale-[0.98] transition-all' : ''}`}>
              <span className="text-xl shrink-0">{n.emoji}</span>
              <p className="text-xs font-bold text-foreground flex-1 leading-snug">{n.text}</p>
              {(n.to || n.onClick) && <span className="text-muted-foreground text-xs shrink-0">→</span>}
            </div>
          );
          if (n.to) return <Link key={i} to={n.to}>{inner}</Link>;
          if (n.onClick) return <button key={i} onClick={n.onClick} className="w-full text-left">{inner}</button>;
          return <div key={i}>{inner}</div>;
        })}
      </Section>

      {/* City events */}
      <Section title="🏙️ City events this month">
        {events.map(ev => (
          <Link key={ev.cityId} to="/estate">
            <div className={`rounded-2xl px-4 py-3 border active:scale-[0.98] transition-all ${ev.boom ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
              <p className="text-xs font-extrabold text-foreground">{ev.emoji} {ev.title}</p>
              <p className={`text-[11px] font-bold mt-0.5 ${ev.boom ? 'text-emerald-500' : 'text-rose-500'}`}>
                {ev.city.flag} {ev.city.name} property {ev.pct > 0 ? '+' : ''}{ev.pct}% this month · tap to view the map
              </p>
            </div>
          </Link>
        ))}
      </Section>

      {/* Market news with inline trading */}
      <Section title="📈 Market news — trade the story">
        {news === null && (
          <div className="flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-2xl">
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
            <p className="text-xs font-bold text-muted-foreground">Loading live news…</p>
          </div>
        )}
        {news?.length === 0 && (
          <div className="bg-card border border-border rounded-2xl px-4 py-3">
            <p className="text-xs font-bold text-muted-foreground">📡 Live feeds are quiet right now — check back soon.</p>
          </div>
        )}
        {(news ?? []).slice(0, 12).map((item, i) => {
          const sent = SENTIMENT[item.sentiment] ?? SENTIMENT.neutral;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="bg-card border border-border rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${sent.cls}`}>
                  <sent.Icon className="w-3 h-3" />
                  <span className="text-[9px] font-black tracking-widest">{sent.label}</span>
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.source}{item.date ? ` · ${timeAgo(item.date)}` : ''}</span>
              </div>
              <p className="text-sm font-extrabold text-foreground leading-snug">{item.title}</p>
              {item.desc && <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">{item.desc}</p>}
              {item.stocks?.[0] && <MiniTrade symbol={item.stocks[0]} />}
            </motion.div>
          );
        })}
      </Section>
    </div>
  );
}
