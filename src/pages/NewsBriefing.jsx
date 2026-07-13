import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { fetchNews } from '@/lib/newsClient';

const TYPE_CONFIG = {
  news:         { label: 'MARKET NEWS',   ink: '#1d4ed8', paper: '#f7f1e1', emoji: '📰', kicker: 'THE BUSINESS DESK' },
  central_bank: { label: 'CENTRAL BANK',  ink: '#92400e', paper: '#f6eedd', emoji: '🏦', kicker: 'FROM THE FED WIRE' },
  rumour:       { label: 'GOSSIP COLUMN', ink: '#6d28d9', paper: '#f3ecdf', emoji: '🤫', kicker: 'HEARD ON THE STREET' },
};

const SENTIMENT = {
  positive: { stamp: 'BULLISH', arrow: '▲', color: '#15803d' },
  negative: { stamp: 'BEARISH', arrow: '▼', color: '#b91c1c' },
  neutral:  { stamp: 'NEUTRAL', arrow: '■', color: '#525252' },
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

const todayMasthead = () =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();

// One cartoon-tabloid front page per story
function NewspaperPage({ item, index, total, isLast, onFinish }) {
  const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.news;
  const sent = SENTIMENT[item.sentiment] ?? SENTIMENT.neutral;

  return (
    <div
      className="w-full h-full flex flex-col overflow-y-auto"
      style={{
        background: `radial-gradient(circle, rgba(0,0,0,0.045) 1px, transparent 1.5px) 0 0 / 7px 7px, ${cfg.paper}`,
        color: '#1c1917',
      }}
    >
      {/* Masthead */}
      <div className="px-5 pt-14 pb-2 text-center border-b-4 border-double shrink-0" style={{ borderColor: '#1c1917' }}>
        <p className="text-[9px] font-bold tracking-[0.3em]" style={{ color: '#78716c' }}>
          {todayMasthead()} · DAILY MARKET EDITION · 5¢
        </p>
        <h1 className="font-serif font-black text-3xl tracking-tight leading-none mt-1" style={{ fontFamily: 'Georgia, serif' }}>
          The Monelingo Times
        </h1>
        <p className="text-[9px] font-bold tracking-[0.25em] mt-1" style={{ color: '#78716c' }}>
          "ALL THE MONEY NEWS FIT TO LEARN" · PAGE {index + 1} OF {total}
        </p>
      </div>

      {/* Kicker strip */}
      <div className="flex items-center justify-between px-5 py-1.5 border-b-2 shrink-0" style={{ borderColor: '#1c1917' }}>
        <span className="text-[10px] font-black tracking-[0.2em] px-2 py-0.5 border-2" style={{ borderColor: cfg.ink, color: cfg.ink }}>
          {cfg.emoji} {cfg.label}
        </span>
        <span className="text-[10px] font-bold tracking-widest" style={{ color: '#78716c' }}>{cfg.kicker}</span>
      </div>

      {/* Story body */}
      <div className="flex-1 px-5 py-4 relative">
        {/* Rubber stamp */}
        <motion.div
          initial={{ scale: 3, opacity: 0, rotate: -25 }}
          animate={{ scale: 1, opacity: 1, rotate: -12 }}
          transition={{ type: 'spring', damping: 14, delay: 0.35 }}
          className="absolute top-2 right-4 px-2.5 py-1 border-4 rounded font-black text-sm tracking-widest pointer-events-none select-none"
          style={{ borderColor: sent.color, color: sent.color, opacity: 0.85, background: 'rgba(255,255,255,0.35)' }}
        >
          {sent.stamp} {sent.arrow}
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className="font-black leading-[1.05] text-[27px] pr-16 mt-1"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {item.title}
        </motion.h2>

        {/* Byline */}
        <p className="text-[10px] font-bold tracking-widest mt-2 uppercase" style={{ color: '#78716c' }}>
          By {item.source ?? 'Wire Services'}{item.date ? ` · ${timeAgo(item.date)}` : ''}
        </p>

        {/* Emoji illustration */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
          className="my-4 border-2 relative overflow-hidden"
          style={{ borderColor: '#1c1917', background: 'radial-gradient(circle, rgba(0,0,0,0.09) 1.2px, transparent 1.6px) 0 0 / 6px 6px, #fff' }}
        >
          <div className="flex items-center justify-center gap-3 py-6 text-6xl">
            <span>{cfg.emoji}</span>
            <span>{item.sentiment === 'positive' ? '🚀' : item.sentiment === 'negative' ? '📉' : '🤷'}</span>
            <span>{item.stocks?.length ? (STOCK_EMOJIS[item.stocks[0]] ?? '📊') : '💸'}</span>
          </div>
          <p className="text-[9px] font-bold text-center pb-1.5 tracking-widest uppercase" style={{ color: '#78716c' }}>
            Artist's impression of today's market
          </p>
        </motion.div>

        {/* Body copy */}
        {item.desc && (
          <p className="text-[13px] leading-relaxed font-medium" style={{ fontFamily: 'Georgia, serif', color: '#292524' }}>
            <span className="font-black text-2xl float-left mr-1.5 leading-none" style={{ fontFamily: 'Georgia, serif' }}>
              {item.desc.charAt(0)}
            </span>
            {item.desc.slice(1)}
          </p>
        )}

        {/* Tickers — classifieds strip */}
        {item.stocks?.length > 0 && (
          <div className="mt-4 border-t-2 border-b-2 py-2" style={{ borderColor: '#1c1917' }}>
            <p className="text-[9px] font-black tracking-[0.25em] mb-1.5" style={{ color: '#78716c' }}>■ TICKERS IN THIS STORY</p>
            <div className="flex flex-wrap gap-1.5">
              {item.stocks.map(sym => (
                <span key={sym} className="text-[11px] font-black px-2 py-1 border" style={{ borderColor: '#1c1917' }}>
                  {STOCK_EMOJIS[sym] ?? '📊'} {sym} <span style={{ color: sent.color }}>{sent.arrow}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Rumour disclaimer */}
        {item.type === 'rumour' && (
          <p className="mt-3 text-[10px] font-bold italic" style={{ color: '#6d28d9' }}>
            ⚠️ The Gossip Column prints what it hears — unverified! Do your own research, dear reader.
          </p>
        )}
      </div>

      {/* Bottom */}
      <div className="px-5 pb-8 pt-2 shrink-0">
        {isLast ? (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            onClick={e => { e.stopPropagation(); onFinish(); }}
            className="w-full h-14 rounded-none border-4 font-black text-base tracking-widest active:scale-95 transition-all"
            style={{ borderColor: '#1c1917', background: '#1c1917', color: cfg.paper }}
          >
            EXTRA! EXTRA! MAKE YOUR PICKS ⚡
          </motion.button>
        ) : (
          <p className="text-center text-[10px] font-black tracking-[0.25em]" style={{ color: '#78716c' }}>
            TAP RIGHT FOR NEXT PAGE ▸
          </p>
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
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1); // page-turn direction

  useEffect(() => {
    fetchNews().then(items => {
      setNews(items);
      setLoading(false);
    });
  }, []);

  function handleFinish() {
    localStorage.setItem('wealthquest_briefing_read', new Date().toISOString().slice(0, 10));
    if (fromArena) navigate('/league');
    else navigate(-1);
  }

  const next = () => { if (idx < news.length - 1) { setDir(1); setIdx(i => i + 1); } };
  const prev = () => { if (idx > 0) { setDir(-1); setIdx(i => i - 1); } };

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">

      {/* Story-style progress segments */}
      <div className="absolute top-0 left-0 right-0 z-50 flex gap-1 px-3 pt-3">
        {news.map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-white/25">
            <div className="h-full bg-white transition-all duration-300" style={{ width: i < idx ? '100%' : i === idx ? '100%' : '0%', opacity: i === idx ? 1 : i < idx ? 0.7 : 0 }} />
          </div>
        ))}
      </div>

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-3 z-50 flex items-center gap-1 text-white font-bold text-xs bg-black/50 backdrop-blur-sm px-2.5 py-1.5 rounded-full"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
            <RefreshCw className="w-8 h-8 text-white/40" />
          </motion.div>
          <p className="text-white/50 text-sm font-bold">Hot off the press…</p>
        </div>
      )}

      {/* Empty */}
      {!loading && news.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
          <p className="text-5xl">🗞️</p>
          <div>
            <p className="text-white font-extrabold text-xl">The presses are down</p>
            <p className="text-white/50 text-sm mt-2">Live feeds are temporarily unavailable. Check back in a few minutes.</p>
          </div>
          {fromArena && (
            <button onClick={handleFinish}
              className="mt-2 h-12 px-6 rounded-2xl bg-primary text-white font-extrabold text-sm active:scale-95 transition-all">
              Make Picks Without News →
            </button>
          )}
        </div>
      )}

      {/* Newspaper pages with page-turn animation */}
      {!loading && news.length > 0 && (
        <div className="flex-1 relative max-w-lg mx-auto w-full">
          <AnimatePresence mode="popLayout" custom={dir}>
            <motion.div
              key={idx}
              custom={dir}
              initial={{ x: dir > 0 ? '100%' : '-100%', rotate: dir > 0 ? 4 : -4, opacity: 0.6 }}
              animate={{ x: 0, rotate: 0, opacity: 1 }}
              exit={{ x: dir > 0 ? '-40%' : '40%', rotate: dir > 0 ? -3 : 3, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 240 }}
              className="absolute inset-0 shadow-2xl"
              onClick={e => {
                // Story-style tap navigation: left third = back, rest = forward.
                // Real buttons inside the page call stopPropagation.
                const rect = e.currentTarget.getBoundingClientRect();
                if (e.clientX - rect.left < rect.width * 0.3) prev();
                else next();
              }}
            >
              <NewspaperPage
                item={news[idx]}
                index={idx}
                total={news.length}
                isLast={idx === news.length - 1}
                onFinish={handleFinish}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
