import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { fetchNews } from '@/lib/newsClient';
import { getMonthEvents } from '@/lib/realEstateData';
import { executeTrade, getPortfolio, getLivePriceById, canTradeAsset, getHolding } from '@/lib/tradeActions';
import marketSim from '@/lib/marketSim';
import { toast } from 'sonner';

// Map news ticker symbols → tradable asset ids
const SYMBOL_TO_ASSET = {
  'AAPL': 'AAPL', 'TSLA': 'TSLA', 'MSFT': 'MSFT', 'GOOGL': 'GOOGL',
  'META': 'META', 'NVDA': 'NVDA', 'AMZN': 'AMZN', 'NFLX': 'NFLX',
  'BTC-USD': 'bitcoin', 'ETH-USD': 'ethereum',
};

const TYPE_LABEL = {
  news:         { label: 'MARKETS',      color: '#e11d48' },
  city_event:   { label: 'CITY EVENT',   color: '#0891b2' },
  central_bank: { label: 'CENTRAL BANK', color: '#d97706' },
  rumour:       { label: 'UNVERIFIED',   color: '#7c3aed' },
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

// ── Quick trade panel under each story ─────────────────────────────────────
function TradePanel({ symbol }) {
  const assetId = SYMBOL_TO_ASSET[symbol];
  const [amount, setAmount] = useState(100);
  const [, force] = useState(0);
  useEffect(() => marketSim.onPrices(() => force(t => t + 1)), []);

  if (!assetId) return null;
  const price = getLivePriceById(assetId);
  const cash = getPortfolio().cash ?? 0;
  const holding = getHolding(assetId);
  const holdingValue = holding && price ? holding.shares * price : 0;
  const tradable = canTradeAsset(assetId);
  // MAX = everything available on either side: all your cash (buy) or the whole holding (sell)
  const maxAmt = Math.floor(Math.max(cash, holdingValue) * 100) / 100;

  const doTrade = (mode) => {
    const dollars = mode === 'sell' ? Math.min(amount, holdingValue) : amount;
    const r = executeTrade(assetId, dollars, mode);
    if (r.ok) {
      toast.success(`${mode === 'buy' ? 'Bought' : 'Sold'} $${dollars.toFixed(0)} of ${symbol}`);
      force(t => t + 1);
    } else {
      toast.error(r.error);
    }
  };

  return (
    <div className="border-t border-border pt-4 mt-5" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Trade this story</p>
          <p className="text-lg font-black text-foreground">
            {symbol} {price ? <span className="text-muted-foreground font-bold text-sm">${price >= 100 ? price.toFixed(0) : price.toFixed(2)}</span> : null}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Cash</p>
          <p className={`text-sm font-black ${cash > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>${cash.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      {!tradable ? (
        <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2.5">Market closed — this asset can't be traded right now.</p>
      ) : cash <= 0 && !holding ? (
        <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2.5">No cash available. Complete lessons to earn money, then invest it here.</p>
      ) : (
        <>
          <div className="flex gap-1.5 mb-2.5">
            {[100, 500, 1000].map(v => (
              <button key={v} onClick={() => setAmount(v)}
                className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition-all ${amount === v ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}`}>
                ${v}
              </button>
            ))}
            <button onClick={() => setAmount(maxAmt)}
              className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition-all ${amount === maxAmt ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}`}>
              MAX
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => doTrade('buy')} disabled={cash < Math.min(amount, 1)}
              className="flex-1 h-11 rounded-lg bg-emerald-600 text-white font-extrabold text-sm active:scale-95 transition-all disabled:opacity-40">
              Buy
            </button>
            <button onClick={() => doTrade('sell')} disabled={!holding}
              className="flex-1 h-11 rounded-lg bg-rose-600 text-white font-extrabold text-sm active:scale-95 transition-all disabled:opacity-40">
              Sell{holding ? ` ($${holdingValue.toFixed(0)} held)` : ''}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── One clean story page ────────────────────────────────────────────────────
function StoryPage({ item, isLast, onFinish }) {
  const type = TYPE_LABEL[item.type] ?? TYPE_LABEL.news;
  const sent = SENTIMENT[item.sentiment] ?? SENTIMENT.neutral;
  const primarySymbol = item.stocks?.[0];

  return (
    <div className="w-full h-full overflow-y-auto bg-background">
      <div className="max-w-lg mx-auto px-5 pt-16 pb-10">

        {/* Kicker */}
        <div className="flex items-center gap-2.5 mb-4">
          <span className="text-[11px] font-black tracking-[0.2em] text-white px-2 py-1" style={{ background: type.color }}>
            {type.label}
          </span>
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
            {item.source}{item.date ? ` · ${timeAgo(item.date)}` : ''}
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-[28px] font-black text-foreground leading-[1.1] tracking-tight mb-4">
          {item.title}
        </h1>

        {/* Sentiment */}
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md mb-5 ${sent.cls}`}>
          <sent.Icon className="w-3.5 h-3.5" />
          <span className="text-[11px] font-black tracking-widest">{sent.label}</span>
        </div>

        {/* Summary */}
        {item.desc && (
          <p className="text-[15px] text-muted-foreground leading-relaxed mb-5">{item.desc}</p>
        )}

        {/* Tickers */}
        {item.stocks?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-1">
            {item.stocks.map(sym => {
              const aid = SYMBOL_TO_ASSET[sym];
              const p = aid ? getLivePriceById(aid) : null;
              const chg = aid ? marketSim.prices[aid]?.change : null;
              return (
                <span key={sym} className="text-xs font-extrabold bg-card border border-border rounded-lg px-2.5 py-1.5 text-foreground">
                  {sym}{p ? ` $${p >= 100 ? p.toFixed(0) : p.toFixed(2)}` : ''}
                  {chg != null && <span className={chg >= 0 ? 'text-emerald-500' : 'text-rose-500'}> {chg >= 0 ? '+' : ''}{chg.toFixed(1)}%</span>}
                </span>
              );
            })}
          </div>
        )}

        {item.type === 'rumour' && (
          <p className="text-xs text-violet-500 font-bold mt-3">⚠️ Unverified — treat as rumour, not fact.</p>
        )}

        {/* City-event CTA */}
        {item.cityId && (
          <button
            onClick={e => { e.stopPropagation(); window.location.href = '/estate'; }}
            className="w-full h-12 mt-4 rounded-xl bg-cyan-700 text-white font-extrabold text-sm active:scale-95 transition-all">
            {item.cityFlag} View {item.cityName} on the Estate map → ({item.pct > 0 ? '+' : ''}{item.pct}%)
          </button>
        )}

        {/* Trade panel */}
        {primarySymbol && <TradePanel symbol={primarySymbol} />}

        {/* CTA / hint */}
        <div className="mt-8">
          {isLast ? (
            <button
              onClick={e => { e.stopPropagation(); onFinish(); }}
              className="w-full h-13 py-4 rounded-xl bg-foreground text-background font-extrabold text-sm tracking-wide active:scale-95 transition-all">
              Done — I'm informed ✓
            </button>
          ) : (
            <p className="text-center text-[11px] font-bold tracking-[0.2em] text-muted-foreground/60">TAP TO CONTINUE ▸</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewsBriefing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromHub = ['arena', 'nudge'].includes(searchParams.get('from'));

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    marketSim.init();
    fetchNews().then(items => {
      const eventStories = getMonthEvents().map(ev => ({
        type: 'city_event',
        title: `${ev.emoji} ${ev.title}`,
        desc: `${ev.desc} Property prices in ${ev.city.name} are moving ${ev.pct > 0 ? 'up' : 'down'} ${Math.abs(ev.pct)}% this month.`,
        source: 'Global Property Desk',
        date: null,
        sentiment: ev.boom ? 'positive' : 'negative',
        stocks: [],
        cityId: ev.cityId,
        cityName: ev.city.name,
        cityFlag: ev.city.flag,
        pct: ev.pct,
      }));
      setNews([...items, ...eventStories]);
      setLoading(false);
    });
  }, []);

  function handleFinish() {
    localStorage.setItem('wealthquest_briefing_read', new Date().toISOString().slice(0, 10));
    if (fromHub) navigate('/league');
    else navigate(-1);
  }

  const next = () => { if (idx < news.length - 1) { setDir(1); setIdx(i => i + 1); } };
  const prev = () => { if (idx > 0) { setDir(-1); setIdx(i => i - 1); } };

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">

      {/* Progress segments */}
      <div className="absolute top-0 left-0 right-0 z-50 flex gap-1 px-3 pt-3">
        {news.map((_, i) => (
          <div key={i} className="flex-1 h-[3px] rounded-full bg-muted-foreground/20">
            <div className="h-full rounded-full bg-foreground transition-all duration-300" style={{ width: i <= idx ? '100%' : '0%' }} />
          </div>
        ))}
      </div>

      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="absolute top-6 left-4 z-50 flex items-center gap-1 text-foreground font-bold text-xs bg-card border border-border px-2.5 py-1.5 rounded-full">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
            <RefreshCw className="w-8 h-8 text-muted-foreground" />
          </motion.div>
          <p className="text-muted-foreground text-sm font-bold">Loading market news…</p>
        </div>
      )}

      {!loading && news.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
          <p className="text-5xl">📡</p>
          <div>
            <p className="text-foreground font-extrabold text-xl">News unavailable</p>
            <p className="text-muted-foreground text-sm mt-2">Live feeds are temporarily down. Check back in a few minutes.</p>
          </div>
          {fromHub && (
            <button onClick={handleFinish}
              className="mt-2 h-12 px-6 rounded-xl bg-foreground text-background font-extrabold text-sm active:scale-95 transition-all">
              Back to the News hub →
            </button>
          )}
        </div>
      )}

      {!loading && news.length > 0 && (
        <div className="flex-1 relative">
          <AnimatePresence mode="popLayout" custom={dir}>
            <motion.div
              key={idx}
              custom={dir}
              initial={{ x: dir > 0 ? 60 : -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: dir > 0 ? -40 : 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="absolute inset-0"
              onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                if (e.clientX - rect.left < rect.width * 0.25) prev();
                else next();
              }}
            >
              <StoryPage item={news[idx]} isLast={idx === news.length - 1} onFinish={handleFinish} />
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
