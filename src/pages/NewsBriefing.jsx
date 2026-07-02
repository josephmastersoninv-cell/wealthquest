import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { fetchNews } from '@/lib/newsClient';

const TYPE_CONFIG = {
  news:         { label: 'Market News',   badge: 'bg-blue-500/30 text-blue-200',    bg: 'from-blue-900 via-slate-900 to-black',    emoji: '📰' },
  central_bank: { label: 'Central Bank',  badge: 'bg-amber-500/30 text-amber-200',  bg: 'from-amber-900 via-stone-900 to-black',   emoji: '🏦' },
  rumour:       { label: 'Market Rumour', badge: 'bg-violet-500/30 text-violet-200', bg: 'from-violet-900 via-slate-900 to-black', emoji: '🤫' },
};

const SENTIMENT_ICON = {
  positive: { icon: TrendingUp,   color: 'text-emerald-400', label: 'Bullish signal' },
  negative: { icon: TrendingDown, color: 'text-rose-400',    label: 'Bearish signal' },
  neutral:  { icon: Minus,        color: 'text-slate-400',   label: 'Neutral'        },
};

const STOCK_EMOJIS = {
  'AAPL': '🍎', 'TSLA': '⚡', 'MSFT': '🪟', 'GOOGL': '🔍',
  'META': '📘', 'NVDA': '🟢', 'AMZN': '📦', 'NFLX': '🎬',
  'BTC-USD': '₿', 'ETH-USD': '💎',
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function NewsCard({ item, index, total, isActive, onNext, isLast, onFinish }) {
  const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.news;
  const sent = SENTIMENT_ICON[item.sentiment] ?? SENTIMENT_ICON.neutral;
  const SentIcon = sent.icon;

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className={`absolute inset-0 bg-gradient-to-b ${cfg.bg}`} />

      {/* Top meta */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-2">
        <span className={`text-xs font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full ${cfg.badge}`}>
          {cfg.emoji} {cfg.label}
        </span>
        <span className="text-xs font-bold text-white/40">{index + 1}/{total}</span>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 py-4">
        {/* Source + time */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold text-white/50">{item.source}</span>
          {item.date && <span className="text-xs text-white/30">{timeAgo(item.date)}</span>}
        </div>

        {/* Headline */}
        <h2 className="text-2xl font-black text-white leading-tight mb-4">
          {item.title}
        </h2>

        {/* Description */}
        {item.desc && (
          <p className="text-sm text-white/70 leading-relaxed mb-5">
            {item.desc}
          </p>
        )}

        {/* Sentiment */}
        <div className={`flex items-center gap-2 mb-5 ${sent.color}`}>
          <SentIcon className="w-4 h-4" />
          <span className="text-xs font-extrabold uppercase tracking-wide">{sent.label}</span>
        </div>

        {/* Affected stocks */}
        {item.stocks?.length > 0 && (
          <div>
            <p className="text-xs font-extrabold text-white/40 uppercase tracking-widest mb-2">Stocks affected</p>
            <div className="flex flex-wrap gap-2">
              {item.stocks.map(sym => (
                <div key={sym} className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-xl px-3 py-1.5">
                  <span className="text-sm">{STOCK_EMOJIS[sym] ?? '📊'}</span>
                  <span className="text-xs font-extrabold text-white">{sym}</span>
                  {item.sentiment !== 'neutral' && (
                    <SentIcon className={`w-3 h-3 ${sent.color}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rumour disclaimer */}
        {item.type === 'rumour' && (
          <div className="mt-4 bg-violet-500/10 border border-violet-500/20 rounded-xl px-3 py-2">
            <p className="text-xs text-violet-300 font-bold">⚠️ Unverified rumour — use as context only. Do your own research.</p>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="relative z-10 px-5 pb-8">
        {isLast ? (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            onClick={onFinish}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-extrabold text-base active:scale-95 transition-all shadow-lg shadow-primary/30"
          >
            Make Your Picks ⚡
          </motion.button>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              <ChevronDown className="w-6 h-6 text-white/30" />
            </motion.div>
            <p className="text-xs text-white/25 font-bold">Swipe up for next story</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NewsBriefing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromArena = searchParams.get('from') === 'arena';

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | news | central_bank | rumour
  const [activeIndex, setActiveIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const cardRefs = useRef([]);

  useEffect(() => {
    fetchNews().then(items => {
      setNews(items);
      setLoading(false);
    });
  }, []);

  const filtered = filter === 'all' ? news : news.filter(n => n.type === filter);

  // IntersectionObserver for active card
  useEffect(() => {
    const els = cardRefs.current.filter(Boolean);
    if (!els.length) return;
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) setActiveIndex(parseInt(e.target.dataset.index, 10));
      }),
      { threshold: 0.6 }
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [filtered]);

  const scrollTo = (i) => {
    cardRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  function handleFinish() {
    localStorage.setItem('wealthquest_briefing_read', new Date().toISOString().slice(0, 10));
    if (fromArena) navigate('/league');
    else navigate(-1);
  }

  const FILTERS = [
    { id: 'all',          label: '📋 All' },
    { id: 'news',         label: '📰 News' },
    { id: 'central_bank', label: '🏦 Central Bank' },
    { id: 'rumour',       label: '🤫 Rumours' },
  ];

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pt-4 pb-2 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          className="pointer-events-auto flex items-center gap-1.5 text-white/80 font-bold text-sm bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setShowFilters(s => !s)}
            className="bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-extrabold text-white"
          >
            {FILTERS.find(f => f.id === filter)?.label} ▾
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 z-50 h-1 bg-white/10">
        <motion.div
          className="h-full bg-primary"
          animate={{ width: filtered.length ? `${((activeIndex + 1) / filtered.length) * 100}%` : '0%' }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
            <RefreshCw className="w-8 h-8 text-white/40" />
          </motion.div>
          <p className="text-white/50 text-sm font-bold">Loading live market news…</p>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <p className="text-4xl mb-3">📡</p>
          <p className="text-white font-extrabold text-lg">No stories found</p>
          <p className="text-white/50 text-sm mt-1">Try a different filter or check back later</p>
        </div>
      )}

      {/* Cards */}
      {!loading && filtered.length > 0 && (
        <div
          className="flex-1 overflow-y-scroll"
          style={{ scrollSnapType: 'y mandatory', scrollbarWidth: 'none' }}
        >
          {filtered.map((item, i) => (
            <div
              key={i}
              ref={el => { cardRefs.current[i] = el; }}
              data-index={i}
              className="w-full flex-shrink-0"
              style={{ height: '100dvh', scrollSnapAlign: 'start' }}
            >
              <NewsCard
                item={item}
                index={i}
                total={filtered.length}
                isActive={i === activeIndex}
                isLast={i === filtered.length - 1}
                onNext={() => scrollTo(i + 1)}
                onFinish={handleFinish}
              />
            </div>
          ))}
        </div>
      )}

      {/* Filter sheet */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 z-[70] bg-zinc-900 rounded-t-3xl p-5 pb-10"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-5" />
              <p className="text-xs font-extrabold text-white/40 uppercase tracking-widest mb-4">Filter Stories</p>
              <div className="space-y-2">
                {FILTERS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => { setFilter(f.id); setActiveIndex(0); setShowFilters(false); setTimeout(() => scrollTo(0), 50); }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
                      filter === f.id ? 'bg-white text-black' : 'bg-white/10 text-white/80'
                    }`}
                  >
                    {f.label}
                    {f.id !== 'all' && (
                      <span className="ml-auto text-xs opacity-60">
                        {news.filter(n => n.type === f.id).length} stories
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
