import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCw, X, ChevronUp, ChevronDown, Eye, EyeOff,
         Trophy, Crown, Star, ArrowLeft, CheckCircle2, Lock, Clock, Activity, AlertTriangle } from 'lucide-react';
import { useUserProgress } from '@/lib/useUserProgress';
import { ASSETS, fetchAllPrices, syntheticPoints, SECTORS,
         getMarketStatus, simulatePriceTick, IPO_DATA, generateAllTimeCurve, generateCandles,
         DIVIDENDS, getEarningsHistory, earningsShockMultiplier,
         BONDS, BOND_RATING_COLOR, SECTOR_ROTATION_EVENTS, getBondPrice, RECESSION_NEWS } from '@/lib/marketData';
import SectionIntro, { useSectionIntro } from '@/components/SectionIntro';
import { recordPortfolioValue, getPortfolioHistory } from '@/lib/portfolioHistory';
import { calcPortfolioScore, getGradeColor } from '@/lib/portfolioScore';
import MilestoneModal, { checkMilestone } from '@/components/MilestoneModal';
import { toast } from 'sonner';
import { fetchLeaderboard, syncPortfolioValue, getMyPlayerId, getMyPlayerData } from '@/lib/playerSync';
import marketSim from '@/lib/marketSim';
import { getCountryByCode } from '@/lib/countryData';
import { useAuth } from '@/lib/authContext';
import { pushPortfolio, flushNow } from '@/lib/cloudSync';

const PORTFOLIO_KEY   = 'wealthquest_portfolio';
const WATCHLIST_KEY   = 'wealthquest_watchlist';
const STARTING_CASH   = 10000;
const UNLOCK_LESSONS  = 5;
const TICK_INTERVAL   = 8000; // ms between live price ticks
const SPEED_MULT      = 5;    // 5× amplified volatility

// (snapshot cache is now owned by marketSim — see src/lib/marketSim.js)

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatIPOReturn(pct) {
  if (pct >= 1e9)  return `+${(pct / 1e9).toFixed(1)}b%`;
  if (pct >= 1e6)  return `+${(pct / 1e6).toFixed(1)}m%`;
  if (pct >= 1000) return `+${Math.round(pct / 1000)}k%`;
  return `+${Math.round(pct)}%`;
}

function canAssetTrade(asset, mktStatus) {
  // Crypto trades 24/7; stocks & ETFs only during NYSE hours
  return asset.type === 'crypto' || mktStatus.canTrade;
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

// ─── Portfolio live chart — touch/drag to scrub any point ─────────────────────
function PortfolioChart({ history, startingCash, livePoints }) {
  const boxRef = useRef(null);
  const [scrub, setScrub] = useState(null); // index into values, or null

  const useLive = livePoints?.length >= 2;
  const values = useLive
    ? livePoints
    : history?.length >= 2 ? history.map(h => h.value) : null;

  if (!values) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-1">
        <TrendingUp className="w-6 h-6 opacity-30" />
        <span>Chart grows as you invest</span>
      </div>
    );
  }
  const latest   = values.at(-1);
  const first    = values[0];
  const positive = latest >= first;
  const color    = positive ? '#10b981' : '#f43f5e';
  const min = Math.min(...values) * 0.999;
  const max = Math.max(...values) * 1.001;
  const range = max - min || 1;
  const W = 340, H = 100;
  const step = W / Math.max(values.length - 1, 1);
  const py = v => H - 2 - ((v - min) / range) * (H - 8);
  const d = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(1)} ${py(v).toFixed(1)}`).join(' ');
  const fillD = `${d} L ${((values.length - 1) * step).toFixed(1)} ${H} L 0 ${H} Z`;
  const cx = (values.length - 1) * step;
  const cy = py(latest);

  const idxFromEvent = e => {
    const rect = boxRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    return Math.max(0, Math.min(values.length - 1, Math.round(x / step)));
  };
  const onScrub = e => setScrub(idxFromEvent(e));

  const sv = scrub != null ? values[scrub] : null;
  const sx = scrub != null ? scrub * step : 0;
  const sy = scrub != null ? py(sv) : 0;
  const sPct = scrub != null && first > 0 ? ((sv - first) / first) * 100 : 0;
  const sDate = scrub != null && !useLive ? history[scrub]?.date : null;
  // keep the readout pill inside the chart
  const pillX = Math.max(2, Math.min(W - 96, sx - 47));

  return (
    <div ref={boxRef} className="w-full h-full touch-none select-none cursor-crosshair"
      onPointerDown={onScrub} onPointerMove={e => e.buttons > 0 || e.pointerType === 'touch' ? onScrub(e) : scrub != null && onScrub(e)}
      onPointerUp={() => setScrub(null)} onPointerLeave={() => setScrub(null)}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="pf-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* baseline at session start */}
        <line x1="0" y1={py(first)} x2={W} y2={py(first)} stroke={color} strokeOpacity="0.25" strokeWidth="1" strokeDasharray="3 4" />
        <path d={fillD} fill="url(#pf-grad)" />
        <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {scrub == null ? (
          <>
            <circle cx={cx} cy={cy} r="3.5" fill={color} />
            <circle cx={cx} cy={cy} r="7"   fill={color} fillOpacity="0.18" />
            <rect x={cx - 38} y={cy - 16} width="46" height="13" rx="3" fill={color} fillOpacity="0.15" />
            <text x={cx - 15} y={cy - 6} fill={color} fontSize="8.5" fontFamily="monospace" textAnchor="middle">
              ${latest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </text>
          </>
        ) : (
          <>
            {/* crosshair */}
            <line x1={sx} y1="0" x2={sx} y2={H} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 3" />
            <circle cx={sx} cy={sy} r="4.5" fill={color} stroke="#fff" strokeWidth="1.5" />
            {/* readout pill */}
            <rect x={pillX} y="1" width="94" height={sDate ? 26 : 16} rx="4" fill="#0f172a" fillOpacity="0.92" />
            <text x={pillX + 47} y="12" fill="#fff" fontSize="9" fontWeight="700" fontFamily="monospace" textAnchor="middle">
              ${sv.toLocaleString(undefined, { maximumFractionDigits: 0 })} <tspan fill={sPct >= 0 ? '#34d399' : '#fb7185'}>{sPct >= 0 ? '+' : ''}{sPct.toFixed(1)}%</tspan>
            </text>
            {sDate && (
              <text x={pillX + 47} y="23" fill="#94a3b8" fontSize="7.5" fontFamily="monospace" textAnchor="middle">{sDate}</text>
            )}
          </>
        )}
      </svg>
    </div>
  );
}

// ─── Seen-learn persistence ───────────────────────────────────────────────────
const SEEN_LEARN_KEY = 'wq_seen_learn';
const getSeenLearn = () => { try { return new Set(JSON.parse(localStorage.getItem(SEEN_LEARN_KEY) ?? '[]')); } catch { return new Set(); } };
const markSeen = topic => { const s = getSeenLearn(); s.add(topic); localStorage.setItem(SEEN_LEARN_KEY, JSON.stringify([...s])); };

// ─── Chart education content ──────────────────────────────────────────────────
const LEARN_TOPICS = {
  candles: {
    icon: '🕯️', title: 'Candlesticks',
    body: 'Each candle shows price action for one time period. The body (thick part) goes from the opening price to the closing price. The wicks (thin lines) show the highest and lowest prices reached.',
    tip: '📈 Green candle = price went UP. Red candle = price went DOWN. A big body with short wicks means strong, decisive movement.',
  },
  ohlc: {
    icon: '📊', title: 'OHLC Values',
    body: 'O = Open (first price in the period), H = High (peak price), L = Low (lowest price), C = Close (final price). These four numbers fully describe what happened in any candle.',
    tip: '💡 If Close > Open, buyers were in control. If Close < Open, sellers won the period.',
  },
  volume: {
    icon: '📦', title: 'Volume Bars',
    body: 'The bars at the bottom show how many shares were traded. High volume during a price move confirms the trend is real. Low volume moves can be fake-outs.',
    tip: '🔥 Big price move + high volume = strong signal. Big move + low volume = be cautious, it might reverse.',
  },
  ma20: {
    icon: '📉', title: 'Moving Average (MA20)',
    body: 'The amber line is the average of the last 20 closing prices. It smooths out noise to show the overall trend direction.',
    tip: '✅ Price above MA20 = uptrend. Price below MA20 = downtrend. When price crosses the line = potential turning point.',
  },
  short: {
    icon: '🔻', title: 'Short Selling',
    body: 'Going short means borrowing shares and selling them now, hoping to buy them back cheaper later. You profit when the price falls. Risk: if price rises, losses are unlimited.',
    tip: '⚠️ Shorting is advanced. Your profit zone is DOWN. You need the price to fall below your entry price to make money.',
  },
  buy: {
    icon: '🟢', title: 'Going Long (Buy)',
    body: 'Buying a stock means you own it and profit when the price rises. This is the most common way to invest. Your risk is limited to what you paid.',
    tip: '💰 "Buy low, sell high" — you want the price to go UP after you buy.',
  },
  sell: {
    icon: '🔴', title: 'Selling / Closing Long',
    body: 'Selling closes your long position. You receive cash equal to shares × current price. Your profit is the difference between your buy price and sell price.',
    tip: '📌 Sell when your target price is hit, or to cut losses. Don\'t let emotions keep you in a losing trade.',
  },
  cover: {
    icon: '🔵', title: 'Covering a Short',
    body: 'Covering means buying back the shares you borrowed to close your short position. If price fell since you shorted, you profit. If it rose, you take a loss.',
    tip: '⏱️ Cover your short before losses compound. Set a mental stop-loss — e.g. exit if price rises 10% from your entry.',
  },
  tf: {
    icon: '⏱️', title: 'Timeframes',
    body: '1M = 1 minute per candle (day trading). 5M/15M = short-term trading. 1H/4H = swing trading. 1D = long-term investing.',
    tip: '🎯 Day traders use 1M–15M. Investors use 1D. Longer timeframes = less noise, clearer trends.',
  },
};

// ─── Learn card popup ─────────────────────────────────────────────────────────
function LearnCard({ topic, onClose }) {
  const t = LEARN_TOPICS[topic];
  if (!t) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.18 }}
      className="absolute inset-x-3 bottom-3 z-10 rounded-2xl p-4 shadow-2xl"
      style={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{t.icon}</span>
          <p className="font-extrabold text-white text-sm">{t.title}</p>
        </div>
        <button onClick={onClose} className="text-white/30 active:text-white/60 text-lg leading-none">×</button>
      </div>
      <p className="text-xs leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>{t.body}</p>
      <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{t.tip}</p>
      </div>
    </motion.div>
  );
}

// ─── TradingView-style Candlestick Chart ──────────────────────────────────────
const PRICE_PAD_R = 52;

// style: 'solid' (buy/long), 'hollow' (sell/close), 'inverted' (short)
function CandlestickChart({ candles, currentPrice, style: chartStyle = 'solid', markers = [] }) {
  if (!candles?.length) return null;

  const CHART_H = 210;
  const VOL_GAP = 5;
  const VOL_H   = 38;
  const TOTAL_H = CHART_H + VOL_GAP + VOL_H;

  const prices = candles.flatMap(c => [c.h, c.l]);
  const pMin = Math.min(...prices);
  const pMax = Math.max(...prices);
  const pad  = (pMax - pMin) * 0.06 || pMax * 0.003;
  const vMin = pMin - pad, vMax = pMax + pad;
  const vRange = vMax - vMin || 1;
  const volMax = Math.max(...candles.map(c => c.v)) || 1;

  const py  = v => CHART_H - ((v - vMin) / vRange) * CHART_H;
  const cW  = 340 / candles.length;
  const bW  = Math.max(1, cW * 0.6);

  const ma = candles.map((_, i) =>
    i < 19 ? null : candles.slice(i - 19, i + 1).reduce((s, c) => s + c.c, 0) / 20
  );
  const maD = ma.reduce((acc, v, i) => {
    if (!v) return acc;
    return acc + `${!ma[i - 1] ? 'M' : 'L'} ${i * cW + cW / 2} ${py(v)} `;
  }, '');

  const curY = py(currentPrice);
  const gridLevels = [0, 0.25, 0.5, 0.75, 1].map(t => vMin + t * vRange);
  const fmtP = p => p >= 1000 ? p.toFixed(0) : p >= 10 ? p.toFixed(2) : p.toFixed(4);

  // Color scheme per chart style
  // solid: standard green/red filled
  // hollow: outline only (close > open = empty body with green border, close < open = filled red)
  // inverted: bear candles highlighted (purple for up, emerald for down — short perspective)
  const getColors = (isUp) => {
    if (chartStyle === 'solid')   return { wick: isUp ? '#22c55e' : '#ef4444', fill: isUp ? '#22c55e' : '#ef4444', stroke: 'none', filled: true };
    if (chartStyle === 'hollow')  return isUp
      ? { wick: '#22c55e', fill: 'none', stroke: '#22c55e', filled: false }
      : { wick: '#ef4444', fill: '#ef4444', stroke: 'none', filled: true };
    // inverted (short view): down = good (emerald), up = bad (violet)
    return isUp
      ? { wick: '#a78bfa', fill: '#a78bfa', stroke: 'none', filled: true }
      : { wick: '#22c55e', fill: '#22c55e', stroke: 'none', filled: true };
  };

  const curTagColor = chartStyle === 'inverted' ? '#a78bfa' : '#22c55e';
  const maColor = chartStyle === 'inverted' ? '#fb923c' : '#f59e0b';

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${340 + PRICE_PAD_R} ${TOTAL_H}`}
         preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      {/* Legend top-left */}
      {chartStyle === 'solid' && <>
        <rect x={4} y={3} width={8} height={8} fill="#22c55e" rx={1} />
        <text x={14} y={10} fill="rgba(255,255,255,0.2)" fontSize="6.5" fontFamily="monospace">Up</text>
        <rect x={28} y={3} width={8} height={8} fill="#ef4444" rx={1} />
        <text x={38} y={10} fill="rgba(255,255,255,0.2)" fontSize="6.5" fontFamily="monospace">Down</text>
      </>}
      {chartStyle === 'hollow' && <>
        <rect x={4} y={3} width={8} height={8} fill="none" stroke="#22c55e" strokeWidth={1} rx={1} />
        <text x={14} y={10} fill="rgba(255,255,255,0.2)" fontSize="6.5" fontFamily="monospace">Up</text>
        <rect x={28} y={3} width={8} height={8} fill="#ef4444" rx={1} />
        <text x={38} y={10} fill="rgba(255,255,255,0.2)" fontSize="6.5" fontFamily="monospace">Down</text>
      </>}
      {chartStyle === 'inverted' && <>
        <rect x={4} y={3} width={8} height={8} fill="#22c55e" rx={1} />
        <text x={14} y={10} fill="rgba(255,255,255,0.2)" fontSize="6.5" fontFamily="monospace">↓ Profit</text>
        <rect x={54} y={3} width={8} height={8} fill="#a78bfa" rx={1} />
        <text x={64} y={10} fill="rgba(255,255,255,0.2)" fontSize="6.5" fontFamily="monospace">↑ Loss</text>
      </>}

      {/* Grid */}
      {gridLevels.map((p, i) => {
        const y = py(p);
        return (
          <g key={i}>
            <line x1={0} y1={y} x2={340} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
            <text x={344} y={y + 3} fill="rgba(255,255,255,0.22)" fontSize="7.5" fontFamily="monospace">{fmtP(p)}</text>
          </g>
        );
      })}

      {/* Candles */}
      {candles.map((c, i) => {
        const x     = i * cW + cW / 2;
        const isUp  = c.c >= c.o;
        const col   = getColors(isUp);
        const bTop  = py(Math.max(c.o, c.c));
        const bBot  = py(Math.min(c.o, c.c));
        const bH    = Math.max(1, bBot - bTop);
        const isLast = i === candles.length - 1;
        return (
          <g key={i}>
            <line x1={x} y1={py(c.h)} x2={x} y2={py(c.l)}
              stroke={col.wick} strokeWidth={Math.max(0.7, cW * 0.08)} />
            <rect x={x - bW / 2} y={bTop} width={bW} height={bH}
              fill={col.fill} stroke={col.stroke} strokeWidth={col.filled ? 0 : 1}
              opacity={isLast ? 1 : 0.88} rx={0.5} />
          </g>
        );
      })}

      {/* MA20 */}
      {maD && <path d={maD} fill="none" stroke={maColor} strokeWidth={1} opacity={0.6} />}
      <rect x={4} y={CHART_H - 10} width={8} height={2} fill={maColor} opacity={0.6} rx={1} />
      <text x={14} y={CHART_H - 5} fill="rgba(255,255,255,0.18)" fontSize="6.5" fontFamily="monospace">MA20</text>

      {/* Current price line */}
      <line x1={0} y1={curY} x2={340} y2={curY}
        stroke={curTagColor} strokeWidth={0.7} strokeDasharray="3 2" opacity={0.6} />
      <rect x={341} y={curY - 7.5} width={PRICE_PAD_R - 2} height={15} fill={curTagColor} rx={2.5} />
      <text x={341 + (PRICE_PAD_R - 2) / 2} y={curY + 4}
        fill="white" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
        {fmtP(currentPrice)}
      </text>

      {/* Volume bars */}
      {candles.map((c, i) => {
        const bH  = (c.v / volMax) * VOL_H;
        const col = getColors(c.c >= c.o);
        return (
          <rect key={i} x={i * cW + 0.5} y={CHART_H + VOL_GAP + VOL_H - bH}
            width={Math.max(0.5, cW - 1)} height={bH}
            fill={col.filled ? col.fill : col.stroke} opacity={0.3} />
        );
      })}
      <text x={2} y={CHART_H + VOL_GAP + 9} fill="rgba(255,255,255,0.15)" fontSize="6.5" fontFamily="monospace">VOL</text>

      {/* Trade markers */}
      {markers.map((m, i) => {
        const ci  = Math.min(m.candleIndex, candles.length - 1);
        const x   = ci * cW + cW / 2;
        const y   = py(m.price);
        const isBuy  = m.type === 'buy';
        const isShort = m.type === 'short';
        const isCover = m.type === 'cover';
        // buy/cover: triangle below candle pointing up; sell/short: triangle above pointing down
        const above = m.type === 'sell' || m.type === 'short';
        const col   = isBuy ? '#22c55e' : isShort ? '#a78bfa' : isCover ? '#60a5fa' : '#f43f5e';
        const label = isBuy ? 'B' : isShort ? 'SH' : isCover ? 'C' : 'S';
        const ty    = above ? y - 10 : y + 10;
        const tri   = above
          ? `${x},${ty + 6} ${x - 5},${ty} ${x + 5},${ty}`
          : `${x},${ty - 6} ${x - 5},${ty} ${x + 5},${ty}`;
        return (
          <g key={i}>
            <polygon points={tri} fill={col} opacity={0.9} />
            <text x={x} y={above ? ty - 3 : ty + 9} fill={col} fontSize="5.5"
              fontWeight="bold" textAnchor="middle" fontFamily="monospace">{label}</text>
            {/* Dotted line from marker to price level */}
            <line x1={x} y1={y} x2={x} y2={ty + (above ? 6 : -6)}
              stroke={col} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.5} />
          </g>
        );
      })}
    </svg>
  );
}

// ─── Mode tip bar ─────────────────────────────────────────────────────────────
const MODE_TIPS = {
  buy:   { emoji: '🟢', text: 'You profit when price goes UP after you buy.' },
  sell:  { emoji: '🔴', text: 'Close your position. Profit = sell price − buy price.' },
  short: { emoji: '🔻', text: 'You profit when price goes DOWN. Borrow now, buy back cheaper.' },
  cover: { emoji: '🔵', text: 'Buy back borrowed shares to close your short position.' },
};

// ─── TradingView-style full-screen Chart Modal ────────────────────────────────
const TF_LIST  = ['1M', '5M', '15M', '1H', '4H', '1D'];
const TF_TICKS = { '1M': 8, '5M': 37, '15M': 112, '1H': 450, '4H': 1800, '1D': 10800 };

const CHART_STYLE = { buy: 'solid', sell: 'hollow', short: 'inverted', cover: 'inverted' };

function ChartModal({ asset, price, onClose, onTrade, cash, holding, shortPos, marketStatus }) {
  const [tf, setTf]           = useState('1M');
  const [candles, setCandles] = useState(() => generateCandles(asset.id, price, '1M'));
  const [mode, setMode]       = useState('buy');
  const [dollars, setDollars] = useState('');
  const [panel, setPanel]     = useState('chart');
  const [learnTopic, setLearnTopic] = useState(null);
  const [markers, setMarkers]       = useState([]);
  const [tradeResult, setTradeResult] = useState(null); // { pnl, mode, shares, price }
  const [seenLearn]                 = useState(getSeenLearn);
  const tickCount                   = useRef(0);

  const ipo       = IPO_DATA[asset.id];
  const tradeable = canAssetTrade(asset, marketStatus);
  const amt    = parseFloat(dollars) || 0;
  const fmtP = p => p >= 1000 ? p.toFixed(0) : p >= 10 ? p.toFixed(2) : p.toFixed(4);

  // Per-mode financials
  const shares    = price > 0 ? amt / price : 0;
  const maxSell   = holding ? holding.shares * price : 0;
  const maxCover  = shortPos ? shortPos.shares * price : 0;
  const activeMax = mode === 'buy' ? cash
                  : mode === 'sell' ? maxSell
                  : mode === 'short' ? cash           // margin = cost of shares
                  : maxCover;                          // cover = buy-back value
  const canReview = amt > 0 && shares > 0 && amt <= activeMax + 0.01 && tradeable;
  const cashAfter = mode === 'buy'   ? cash - amt
                  : mode === 'sell'  ? cash + amt
                  : mode === 'short' ? cash - amt      // collateral posted
                  : cash + (shortPos ? (shortPos.entryPrice - price) * shares : 0); // cover P&L

  // Short P&L on open position
  const shortPnl = shortPos ? (shortPos.entryPrice - price) * shortPos.shares : 0;

  useEffect(() => {
    setCandles(prev => {
      const upd  = [...prev];
      const last = { ...upd[upd.length - 1], c: price };
      last.h = Math.max(last.h, price);
      last.l = Math.min(last.l, price);
      upd[upd.length - 1] = last;
      return upd;
    });
    tickCount.current++;
    if (tickCount.current >= (TF_TICKS[tf] ?? 8)) {
      tickCount.current = 0;
      setCandles(prev => [
        ...prev.slice(-69),
        { o: price, h: price, l: price, c: price, v: 300000, t: Date.now() },
      ]);
    }
  }, [price]);

  function showLearn(topic) {
    if (seenLearn.has(topic)) return;
    markSeen(topic);
    setLearnTopic(topic);
    setTimeout(() => setLearnTopic(null), 4500);
  }

  function switchTf(newTf) {
    setTf(newTf);
    tickCount.current = 0;
    setCandles(generateCandles(asset.id, price, newTf));
    showLearn('tf');
  }

  function fireTradeResult(m, sh, px, avgCost, entryPx) {
    const pnl = m === 'sell'  ? (px - (avgCost ?? px)) * sh
              : m === 'cover' ? ((entryPx ?? px) - px) * sh
              : null;
    setTradeResult({ pnl, mode: m, shares: sh, price: px });
    setMarkers(prev => [...prev, { type: m, price: px, candleIndex: candles.length - 1 }]);
    setTimeout(() => setTradeResult(null), 3200);
  }

  const last       = candles[candles.length - 1];
  const first      = candles[0];
  const sessionPct = first ? ((price - first.o) / first.o) * 100 : 0;
  const positive   = sessionPct >= 0;
  const allTimeRet = ipo ? ((price - ipo.ipoPrice) / ipo.ipoPrice) * 100 : null;
  const modeColors = {
    buy:   { bg: '#22c55e', shadow: 'rgba(34,197,94,0.3)'   },
    sell:  { bg: '#ef4444', shadow: 'rgba(239,68,68,0.3)'   },
    short: { bg: '#a78bfa', shadow: 'rgba(167,139,250,0.3)' },
    cover: { bg: '#3b82f6', shadow: 'rgba(59,130,246,0.3)'  },
  };
  const mc = modeColors[mode];

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 60 }} transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#0b0e14' }}>

      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b"
           style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button onClick={onClose} className="p-1.5 rounded-lg active:scale-90"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
          <X className="w-4 h-4 text-white/50" />
        </button>
        <span className="text-2xl">{asset.emoji}</span>
        <div>
          <p className="font-extrabold text-white text-base leading-none">{asset.symbol}</p>
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{asset.name}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="font-extrabold text-white text-xl leading-none tabular-nums">${fmtP(price)}</p>
          <p className={`text-xs font-extrabold mt-0.5 ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {positive ? '+' : ''}{sessionPct.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* ── OHLC bar (tappable — each label opens learn card) ── */}
      {last && (
        <div className="flex items-center gap-2 px-3 py-1.5"
             style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          {[
            ['O', fmtP(last.o), 'rgba(255,255,255,0.55)', 'ohlc'],
            ['H', fmtP(last.h), '#22c55e',                'ohlc'],
            ['L', fmtP(last.l), '#ef4444',                'ohlc'],
            ['C', fmtP(price),  'rgba(255,255,255,0.7)',  'ohlc'],
          ].map(([lbl, val, col, topic]) => (
            <button key={lbl} onClick={() => setLearnTopic(learnTopic === topic ? null : topic)}
              style={{ color: 'rgba(255,255,255,0.22)', fontSize: 10, fontFamily: 'monospace', textDecoration: 'none' }}>
              {lbl}&nbsp;<span style={{ color: col }}>{val}</span>
            </button>
          ))}
          {allTimeRet !== null && (
            <span className="ml-auto text-emerald-400 font-extrabold" style={{ fontSize: 10 }}>
              {formatIPOReturn(allTimeRet)} since IPO
            </span>
          )}
          {/* ? help button */}
          <button onClick={() => { markSeen('candles'); setLearnTopic(learnTopic === 'candles' ? null : 'candles'); }}
            className="ml-1 rounded-full flex items-center justify-center text-xs font-extrabold"
            style={{ width: 16, height: 16, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>?</button>
        </div>
      )}

      {/* ── Timeframe selector ── */}
      <div className="flex items-center gap-0.5 px-3 py-1.5"
           style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {TF_LIST.map(t => (
          <button key={t} onClick={() => switchTf(t)}
            className="px-2.5 py-1 rounded text-xs font-extrabold transition-all active:scale-95"
            style={{ background: tf === t ? 'rgba(255,255,255,0.13)' : 'transparent', color: tf === t ? 'white' : 'rgba(255,255,255,0.28)' }}>
            {t}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9 }}>5× LIVE</span>
        </div>
      </div>

      {/* ── Chart + overlays ── */}
      <div className="flex-1 px-2 py-1 min-h-0 relative">
        <CandlestickChart candles={candles} currentPrice={price}
          style={CHART_STYLE[mode] ?? 'solid'} markers={markers} />

        {/* Trade result overlay */}
        <AnimatePresence>
          {tradeResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-1 px-8 py-5 rounded-3xl"
                style={{
                  background: tradeResult.pnl === null
                    ? 'rgba(30,35,55,0.92)'
                    : tradeResult.pnl >= 0
                    ? 'rgba(22,101,52,0.92)'
                    : 'rgba(127,29,29,0.92)',
                  border: `2px solid ${tradeResult.pnl === null ? 'rgba(255,255,255,0.15)' : tradeResult.pnl >= 0 ? '#22c55e' : '#ef4444'}`,
                  boxShadow: tradeResult.pnl === null ? 'none'
                    : tradeResult.pnl >= 0
                    ? '0 0 40px rgba(34,197,94,0.4)'
                    : '0 0 40px rgba(239,68,68,0.4)',
                }}>
                <span className="text-3xl">
                  {tradeResult.pnl === null
                    ? (tradeResult.mode === 'buy' ? '🟢' : '🔻')
                    : tradeResult.pnl >= 0 ? '💰' : '📉'}
                </span>
                {tradeResult.pnl !== null ? (
                  <>
                    <p className="text-3xl font-extrabold tabular-nums"
                      style={{ color: tradeResult.pnl >= 0 ? '#4ade80' : '#f87171' }}>
                      {tradeResult.pnl >= 0 ? '+' : ''}${Math.abs(tradeResult.pnl).toFixed(2)}
                    </p>
                    <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {tradeResult.pnl >= 0 ? 'Profit' : 'Loss'} on {tradeResult.mode}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-extrabold text-white">
                      {tradeResult.mode === 'buy' ? 'Bought' : 'Shorted'} @ ${fmtP(tradeResult.price)}
                    </p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {tradeResult.shares.toFixed(4)} {asset.symbol}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {tradeResult.mode === 'buy' ? '📈 Profit when price rises' : '📉 Profit when price falls'}
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {learnTopic && (
            <LearnCard topic={learnTopic} onClose={() => setLearnTopic(null)} />
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom panel ── */}
      <div className="border-t px-4 pb-10 pt-3"
           style={{ borderColor: 'rgba(255,255,255,0.07)', background: '#13161f' }}>

        {/* Market closed banner */}
        {!tradeable && (
          <div className="flex items-center gap-3 py-2 mb-3 px-3 rounded-xl"
               style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <Lock className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <p className="text-sm font-extrabold text-white">NYSE {marketStatus.label}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {marketStatus.countdown ? `Opens in ${marketStatus.countdown}` : 'Mon–Fri 9:30–16:00 ET'}
              </p>
            </div>
          </div>
        )}

        {/* Short P&L live badge */}
        {shortPos && (
          <button onClick={() => setLearnTopic('cover')}
            className="flex items-center justify-between w-full rounded-xl px-3 py-2 mb-2"
            style={{ background: shortPnl >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                     border: `1px solid ${shortPnl >= 0 ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
            <div className="flex items-center gap-2">
              <span className="text-sm">🔻</span>
              <div className="text-left">
                <p className="text-xs font-extrabold text-white">Short Position</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {shortPos.shares.toFixed(4)} sh @ ${fmtP(shortPos.entryPrice)} entry
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-extrabold ${shortPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {shortPnl >= 0 ? '+' : ''}${shortPnl.toFixed(2)}
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>tap to learn</p>
            </div>
          </button>
        )}

        {/* ─ chart panel: action buttons ─ */}
        {panel === 'chart' && (
          <>
            {/* Row 1: Buy / Sell */}
            <div className="flex gap-2 mb-2">
              <button onClick={() => { setMode('buy'); setPanel('order'); setDollars(''); showLearn('buy'); }}
                disabled={!tradeable}
                className="flex-1 py-3.5 rounded-2xl font-extrabold text-white text-sm active:scale-[0.97] disabled:opacity-30 transition-all"
                style={{ background: '#22c55e', boxShadow: '0 4px 16px rgba(34,197,94,0.2)' }}>
                🟢 Buy
              </button>
              <button onClick={() => { setMode('sell'); setPanel('order'); setDollars(''); showLearn('sell'); }}
                disabled={!tradeable || !holding}
                className="flex-1 py-3.5 rounded-2xl font-extrabold text-white text-sm active:scale-[0.97] disabled:opacity-30 transition-all"
                style={{ background: '#ef4444', boxShadow: '0 4px 16px rgba(239,68,68,0.2)' }}>
                🔴 Sell
              </button>
            </div>
            {/* Row 2: Short / Cover */}
            <div className="flex gap-2 mb-2">
              <button onClick={() => { setMode('short'); setPanel('order'); setDollars(''); showLearn('short'); }}
                disabled={!tradeable}
                className="flex-1 py-2.5 rounded-xl font-extrabold text-white text-xs active:scale-[0.97] disabled:opacity-30 transition-all"
                style={{ background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)', color: '#a78bfa' }}>
                🔻 Short
              </button>
              <button onClick={() => { setMode('cover'); setPanel('order'); setDollars(''); showLearn('cover'); }}
                disabled={!tradeable || !shortPos}
                className="flex-1 py-2.5 rounded-xl font-extrabold text-xs active:scale-[0.97] disabled:opacity-30 transition-all"
                style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', color: '#60a5fa' }}>
                🔵 Cover
              </button>
              <button onClick={() => setLearnTopic(learnTopic === 'short' ? null : 'short')}
                className="w-9 rounded-xl text-xs font-extrabold"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>?</button>
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between" style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>
              <span>Cash <span style={{ color: 'rgba(255,255,255,0.6)' }}>${cash.toFixed(2)}</span></span>
              {holding && <span>Long <span style={{ color: '#22c55e' }}>{holding.shares.toFixed(3)} sh</span></span>}
              {shortPos && <span>Short <span style={{ color: '#a78bfa' }}>{shortPos.shares.toFixed(3)} sh</span></span>}
              {asset.type === 'crypto' && <span style={{ color: '#a78bfa', fontWeight: 800 }}>24/7</span>}
            </div>
          </>
        )}

        {/* ─ order entry panel ─ */}
        {panel === 'order' && (
          <div>
            {/* Mode tip */}
            {MODE_TIPS[mode] && (
              <div className="flex items-center gap-2 rounded-xl px-3 py-2 mb-3"
                   style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-base">{MODE_TIPS[mode].emoji}</span>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{MODE_TIPS[mode].text}</p>
              </div>
            )}

            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => setPanel('chart')} className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <ArrowLeft className="w-4 h-4 text-white/50" />
              </button>
              {/* Mode tabs */}
              <div className="flex rounded-xl p-0.5 flex-1" style={{ background: 'rgba(255,255,255,0.07)' }}>
                {(['buy', 'sell', 'short', 'cover']).filter(m =>
                  (m !== 'sell'  || holding) &&
                  (m !== 'cover' || shortPos)
                ).map(m => (
                  <button key={m} onClick={() => { setMode(m); setDollars(''); }}
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-extrabold capitalize transition-all active:scale-95"
                    style={mode === m ? { background: modeColors[m].bg, color: 'white' } : { color: 'rgba(255,255,255,0.3)' }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative mb-3">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-extrabold" style={{ color: 'rgba(255,255,255,0.3)' }}>$</span>
              <input type="number" inputMode="decimal" value={dollars} onChange={e => setDollars(e.target.value)}
                placeholder="0.00" autoFocus
                className="w-full rounded-xl py-3.5 pl-9 pr-4 font-extrabold text-xl text-right text-white focus:outline-none"
                style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>

            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {[{ l:'25%', v: activeMax*.25 }, { l:'50%', v: activeMax*.50 }, { l:'75%', v: activeMax*.75 }, { l:'Max', v: activeMax }].map(({ l, v }) => (
                <button key={l} onClick={() => setDollars(String(Math.floor(v * 100) / 100))}
                  className="rounded-lg py-2 text-xs font-extrabold active:scale-95 transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>{l}</button>
              ))}
            </div>

            {shares > 0 && (
              <p className="text-center text-xs mb-2 tabular-nums" style={{ color: 'rgba(255,255,255,0.3)' }}>
                ≈ {shares < 0.01 ? shares.toFixed(6) : shares.toFixed(4)} shares @ ${fmtP(price)}
              </p>
            )}
            {amt > activeMax && amt > 0 && (
              <p className="text-center text-xs text-rose-400 font-bold mb-2">
                {mode === 'buy' || mode === 'short' ? 'Insufficient cash' : "You don't have that position size"}
              </p>
            )}
            {/* Extra short warning */}
            {mode === 'short' && amt > 0 && amt <= activeMax && (
              <p className="text-center text-[10px] mb-2" style={{ color: '#a78bfa' }}>
                ⚠️ Shorting: profit if price falls below ${fmtP(price)}
              </p>
            )}

            <button onClick={() => canReview && setPanel('confirm')} disabled={!canReview}
              className="w-full py-4 rounded-2xl font-extrabold text-white text-base active:scale-[0.98] disabled:opacity-25 transition-all"
              style={{ background: mc.bg, boxShadow: `0 4px 20px ${mc.shadow}` }}>
              Review {mode.charAt(0).toUpperCase() + mode.slice(1)} Order
            </button>
          </div>
        )}

        {/* ─ confirm panel ─ */}
        {panel === 'confirm' && (
          <div>
            <div className="rounded-2xl p-4 mb-4 space-y-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
              {[
                { l: 'Action',  v: `${MODE_TIPS[mode]?.emoji} ${mode.toUpperCase()}` },
                { l: 'Asset',   v: `${asset.emoji} ${asset.symbol}` },
                { l: 'Shares',  v: shares < 0.01 ? shares.toFixed(6) : shares.toFixed(4) },
                { l: 'Price',   v: `$${fmtP(price)}` },
                { l: 'Total',   v: `$${amt.toFixed(2)}`, bold: true },
                mode === 'cover'
                  ? { l: 'P&L', v: `${shortPnl >= 0 ? '+' : ''}$${((shortPos?.entryPrice - price) * shares).toFixed(2)}`,
                      col: (shortPos?.entryPrice ?? price) >= price ? '#22c55e' : '#ef4444' }
                  : { l: 'Cash after', v: `$${cashAfter.toFixed(2)}`, col: cashAfter < 0 ? '#ef4444' : 'rgba(255,255,255,0.7)' },
              ].map(r => (
                <div key={r.l} className="flex justify-between items-center">
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{r.l}</span>
                  <span style={{ fontSize: 12, fontWeight: r.bold ? 800 : 600, color: r.col ?? (r.bold ? 'white' : 'rgba(255,255,255,0.7)') }}>{r.v}</span>
                </div>
              ))}
            </div>
            {/* educational reminder */}
            <div className="rounded-xl px-3 py-2 mb-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <p className="text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {mode === 'buy'   && '📈 You profit when price rises above your buy price.'}
                {mode === 'sell'  && '💰 Gain = (sell price − avg cost) × shares.'}
                {mode === 'short' && '🔻 You profit when the price drops. Losses grow if price rises.'}
                {mode === 'cover' && '🔵 Your short P&L locks in when you cover.'}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPanel('order')}
                className="flex-1 py-3.5 rounded-2xl font-extrabold text-sm active:scale-95"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>Back</button>
              <button onClick={() => {
                  setPanel('done');
                  fireTradeResult(mode, shares, price, holding?.avgCost, shortPos?.entryPrice);
                  setTimeout(() => onTrade(mode, shares, amt), 1200);
                }}
                className="py-3.5 rounded-2xl font-extrabold text-white text-sm active:scale-[0.97] transition-all"
                style={{ flex: 2, background: mc.bg, boxShadow: `0 4px 16px ${mc.shadow}` }}>
                Confirm {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            </div>
          </div>
        )}

        {/* ─ done panel ─ */}
        {panel === 'done' && (
          <div className="flex flex-col items-center gap-3 py-1">
            <div className="flex items-center gap-3 w-full">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 22 }}>
                <CheckCircle2 className="w-8 h-8 shrink-0" style={{ color: mc.bg }} />
              </motion.div>
              <div>
                <p className="text-sm font-extrabold text-white">Order Filled</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {mode === 'buy'   && `Bought ${shares.toFixed(4)} sh @ $${fmtP(price)}`}
                  {mode === 'sell'  && `Sold ${shares.toFixed(4)} sh @ $${fmtP(price)}`}
                  {mode === 'short' && `Shorted ${shares.toFixed(4)} sh @ $${fmtP(price)}`}
                  {mode === 'cover' && `Covered ${shares.toFixed(4)} sh`}
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => { setPanel('order'); setDollars(''); }}
                className="flex-1 py-3 rounded-2xl font-extrabold text-sm active:scale-[0.98] transition-all"
                style={{ background: mc.bg, boxShadow: `0 4px 16px ${mc.shadow}` }}>
                Trade Again
              </button>
              <button
                onClick={() => { setPanel('chart'); setDollars(''); }}
                className="flex-1 py-3 rounded-2xl font-extrabold text-sm active:scale-[0.98] transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
                ← Chart
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── (LivePriceChart kept for reference — replaced by CandlestickChart) ───────
const SECTOR_COLORS = {
  Technology: '#6366f1', Consumer: '#f59e0b', Finance: '#10b981', Healthcare: '#ec4899',
  Energy: '#f97316', Industrials: '#64748b', Communication: '#06b6d4', Materials: '#84cc16',
  'Real Estate': '#a78bfa', Commodities: '#fbbf24', 'Broad Market': '#94a3b8',
  Innovation: '#8b5cf6', Bonds: '#f59e0b',
};

function EarningsModal({ data, onClose }) {
  const [progress, setProgress] = useState(100);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const start = Date.now();
    const dur   = 7000;
    const id    = setInterval(() => {
      const pct = Math.max(0, 100 - ((Date.now() - start) / dur) * 100);
      setProgress(pct);
      if (pct <= 0) { clearInterval(id); onCloseRef.current(); }
    }, 80);
    return () => clearInterval(id);
  }, []);
  const { asset, rpt, shock } = data;
  const changePct = ((shock - 1) * 100).toFixed(1);
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <motion.div className="relative bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl z-10"
        initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-muted-foreground active:opacity-70">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center mb-4">
          <p className="text-4xl mb-2">{asset.emoji}</p>
          <p className="text-lg font-extrabold text-foreground">{asset.symbol} Earnings Report</p>
          <p className="text-xs text-muted-foreground">{rpt.quarter} · Just Filed</p>
        </div>
        <div className={`text-center rounded-2xl p-4 mb-4 ${rpt.beat ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'}`}>
          <p className={`text-2xl font-extrabold mb-1 ${rpt.beat ? 'text-emerald-400' : 'text-rose-400'}`}>
            {rpt.beat ? '✅ BEAT' : '❌ MISS'}
          </p>
          <p className={`text-sm font-bold ${rpt.beat ? 'text-emerald-400' : 'text-rose-400'}`}>
            EPS {rpt.surprisePct > 0 ? '+' : ''}{rpt.surprisePct}% vs estimates
          </p>
          <p className="text-xs text-muted-foreground mt-1">Actual ${rpt.epsActual} · Estimated ${rpt.epsEst}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-muted rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground">Revenue</p>
            <p className="text-xs font-extrabold text-foreground">${rpt.revActual}B</p>
          </div>
          <div className="bg-muted rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground">Guidance</p>
            <p className="text-xs font-extrabold text-foreground capitalize">{rpt.guidance}</p>
          </div>
          <div className="bg-muted rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground">Price Impact</p>
            <p className={`text-xs font-extrabold ${rpt.beat ? 'text-emerald-400' : 'text-rose-400'}`}>
              {rpt.beat ? '+' : ''}{changePct}%
            </p>
          </div>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%`, transition: 'none' }} />
        </div>
        <p className="text-center text-[10px] text-muted-foreground mt-1.5">Tap × to dismiss</p>
      </motion.div>
    </motion.div>
  );
}

function LivePriceChart({ price, asset }) {
  const [pts, setPts] = useState([price]);
  const openRef = useRef(price);
  const ipo = IPO_DATA[asset.id];

  useEffect(() => {
    setPts(prev => {
      const next = [...prev.slice(-89), price];
      return next;
    });
  }, [price]);

  const sessionChange = ((price - openRef.current) / openRef.current) * 100;
  const positive = sessionChange >= 0;
  const color = positive ? '#10b981' : '#f43f5e';
  const high = Math.max(...pts);
  const low  = Math.min(...pts);
  const allTimeReturn = ipo ? ((price - ipo.ipoPrice) / ipo.ipoPrice) * 100 : null;

  const min = low * 0.9995;
  const max = high * 1.0005;
  const range = max - min || 1;
  const w = 300, h = 72;
  const step = w / Math.max(pts.length - 1, 1);
  const py = v => h - 2 - ((v - min) / range) * (h - 4);
  const d = pts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${py(v)}`).join(' ');
  const fillD = `${d} L ${(pts.length - 1) * step} ${h} L 0 ${h} Z`;
  const cx = (pts.length - 1) * step;
  const cy = py(price);

  return (
    <div className="bg-muted/40 rounded-2xl p-3 mb-4 border border-border/50">
      {/* Header row */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${positive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${positive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            </span>
            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Live · 1-min</p>
          </div>
          <p className="text-lg font-extrabold text-foreground">
            ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: price >= 10 ? 2 : 4 })}
          </p>
          <p className={`text-xs font-extrabold ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {positive ? '+' : ''}{sessionChange.toFixed(3)}% this session
          </p>
        </div>
        <div className="text-right text-[10px] text-muted-foreground space-y-0.5">
          <p>H <span className="text-foreground font-bold">${high.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
          <p>L <span className="text-foreground font-bold">${low.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
          {allTimeReturn !== null && (
            <p>IPO <span className="text-emerald-400 font-bold">{formatIPOReturn(allTimeReturn)}</span></p>
          )}
        </div>
      </div>
      {/* Chart */}
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="lc-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={fillD} fill="url(#lc-grad)" />
        <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={cx} cy={cy} r="3.5" fill={color} />
        <circle cx={cx} cy={cy} r="6" fill={color} fillOpacity="0.25" />
      </svg>
    </div>
  );
}

// ─── Market Status Banner ─────────────────────────────────────────────────────
function MarketBanner({ status }) {
  const colorMap = {
    emerald: { bg: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400', text: 'text-emerald-400', pulse: true },
    amber:   { bg: 'bg-amber-500/10 border-amber-500/20',   dot: 'bg-amber-400',   text: 'text-amber-400',   pulse: false },
    rose:    { bg: 'bg-rose-500/10 border-rose-500/20',     dot: 'bg-rose-400',    text: 'text-rose-400',    pulse: false },
  };
  const c = colorMap[status.color] ?? colorMap.rose;
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${c.bg} mb-3`}>
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          {c.pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${c.dot} opacity-60`} />}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${c.dot}`} />
        </span>
        <span className={`text-xs font-extrabold ${c.text}`}>NYSE {status.label}</span>
        <span className="text-xs text-muted-foreground">· {status.nyTime}</span>
      </div>
      <div className="flex items-center gap-2">
        {status.open && status.minutesLeft && (
          <span className="text-xs text-muted-foreground">Closes in {Math.floor(status.minutesLeft / 60)}h {status.minutesLeft % 60}m</span>
        )}
        {!status.open && status.countdown && (
          <span className="text-xs text-muted-foreground">Opens in {status.countdown}</span>
        )}
        <span className="text-[10px] font-extrabold text-muted-foreground bg-muted rounded px-1.5 py-0.5">
          {status.open ? '5× LIVE' : status.color === 'amber' ? 'LIMITED' : 'FROZEN'}
        </span>
      </div>
    </div>
  );
}

// ─── Market Closed Explainer (prominent, shown on open) ───────────────────────
function MarketClosedExplainer({ status, onDismiss }) {
  if (status.open) return null;
  const meta = {
    weekend:    { icon: '📅', title: 'Closed for the weekend' },
    premarket:  { icon: '🌅', title: 'Before the opening bell' },
    afterhours: { icon: '🌆', title: 'After the closing bell' },
    overnight:  { icon: '🌙', title: 'Closed overnight' },
  }[status.reason] ?? { icon: '🔔', title: 'Market closed' };
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
      className="px-4 pt-3 overflow-hidden">
      <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">{meta.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-extrabold text-foreground text-sm">{meta.title}</p>
              <button onClick={onDismiss} className="text-muted-foreground shrink-0"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{status.reasonText}</p>
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              {status.countdown && (
                <span className="text-[11px] font-extrabold text-rose-400 bg-rose-500/15 rounded-lg px-2 py-1">⏱ Opens in {status.countdown}</span>
              )}
              <span className="text-[11px] font-bold text-muted-foreground bg-muted rounded-lg px-2 py-1">Regular hours · Mon–Fri 9:30–16:00 ET</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2.5">💡 Stocks & ETFs are frozen while closed — but crypto trades 24/7, so you can still trade coins.</p>
          </div>
        </div>
      </div>
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

// ─── Trade Modal ──────────────────────────────────────────────────────────────
function TradeModal({ asset, price, onClose, onTrade, cash, holding, marketStatus }) {
  const [mode, setMode]   = useState('buy');
  const [dollars, setDollars] = useState('');
  const [step, setStep]   = useState('amount');

  const tradeable = canAssetTrade(asset, marketStatus);
  const amt    = parseFloat(dollars) || 0;
  const shares = price > 0 ? amt / price : 0;
  const maxSell   = holding ? holding.shares * price : 0;
  const activeMax = mode === 'buy' ? cash : maxSell;
  const canReview = amt > 0 && shares > 0 && amt <= activeMax + 0.01 && tradeable;
  const cashAfter = mode === 'buy' ? cash - amt : cash + (shares * price);
  const changeInfo = asset.change ?? 0;
  const positive = changeInfo >= 0;
  const ipo = IPO_DATA[asset.id];
  const allTimeReturn = ipo ? ((price - ipo.ipoPrice) / ipo.ipoPrice) * 100 : null;

  function confirm() {
    setStep('done');
    setTimeout(() => { onTrade(mode, shares, amt); }, 1200);
  }

  // Market closed screen for non-crypto
  if (!tradeable && step === 'amount') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center p-4" onClick={onClose}>
        <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
          className="bg-card rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="p-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/15 flex items-center justify-center">
              <Lock className="w-8 h-8 text-rose-400" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-foreground mb-1">Market Closed</p>
              <p className="text-sm text-muted-foreground">
                NYSE is currently {marketStatus.label.toLowerCase()}.<br />
                {marketStatus.countdown
                  ? `Opens in ${marketStatus.countdown}`
                  : 'Check back during trading hours.'}
              </p>
            </div>
            <div className="bg-muted rounded-2xl p-3 w-full">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{asset.emoji}</span>
                <div className="text-left">
                  <p className="font-extrabold text-foreground">{asset.symbol}</p>
                  <p className={`text-sm font-bold ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="ml-1">{positive ? '▲' : '▼'}{Math.abs(changeInfo).toFixed(2)}%</span>
                  </p>
                </div>
                {allTimeReturn !== null && (
                  <div className="ml-auto text-right">
                    <p className="text-[10px] text-muted-foreground">Since IPO</p>
                    <p className="text-xs font-extrabold text-emerald-400">{formatIPOReturn(allTimeReturn)}</p>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">NYSE Trading Hours: Mon–Fri 9:30–16:00 ET</p>
            <button onClick={onClose} className="w-full py-3 rounded-2xl bg-muted text-foreground font-extrabold text-sm active:scale-95">
              Got it
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center p-4" onClick={step === 'amount' ? onClose : undefined}>
      <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        className="bg-card rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Amount entry */}
        {step === 'amount' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-2xl">{asset.emoji}</div>
                <div>
                  <p className="font-extrabold text-foreground text-lg leading-none">{asset.symbol}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{asset.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="font-extrabold text-foreground">${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: price >= 10 ? 2 : 4 })}</p>
                    <span className={`text-xs font-extrabold ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {positive ? '▲' : '▼'}{Math.abs(changeInfo).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl bg-muted text-muted-foreground active:scale-95"><X className="w-4 h-4" /></button>
            </div>

            {/* Live 1-min chart */}
            <LivePriceChart price={price} asset={asset} />

            {/* Crypto 24/7 badge */}
            {asset.type === 'crypto' && (
              <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-xl px-3 py-2 mb-4">
                <Activity className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <p className="text-xs text-violet-400 font-bold">Crypto trades 24/7 — market always open</p>
              </div>
            )}

            {/* Buy / Sell toggle */}
            <div className="flex rounded-xl bg-muted p-1 mb-4">
              {['buy', 'sell'].map(m => (
                <button key={m} onClick={() => { setMode(m); setDollars(''); }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-extrabold capitalize transition-all ${
                    mode === m
                      ? m === 'buy' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-rose-500 text-white shadow-sm'
                      : 'text-muted-foreground'
                  }`}>{m}</button>
              ))}
            </div>

            <div className="relative mb-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-extrabold text-muted-foreground">$</span>
              <input
                type="number" inputMode="decimal" value={dollars}
                onChange={e => setDollars(e.target.value)}
                placeholder="0.00" autoFocus
                className="w-full bg-muted rounded-2xl py-4 pl-10 pr-4 text-foreground font-extrabold text-2xl focus:outline-none focus:ring-2 focus:ring-primary text-right"
              />
            </div>

            <p className="text-xs text-muted-foreground text-right mb-4 pr-1">
              {shares > 0 ? `≈ ${shares < 0.01 ? shares.toFixed(6) : shares.toFixed(4)} shares` : 'Enter amount'}
            </p>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {(mode === 'buy'
                ? [{ l: '10%', v: activeMax * 0.10 }, { l: '25%', v: activeMax * 0.25 }, { l: '50%', v: activeMax * 0.50 }, { l: 'All', v: activeMax }]
                : [{ l: '25%', v: maxSell * 0.25 }, { l: '50%', v: maxSell * 0.50 }, { l: '75%', v: maxSell * 0.75 }, { l: 'All', v: maxSell }]
              ).map(({ l, v }) => (
                <button key={l} onClick={() => setDollars(String(Math.floor(v * 100) / 100))}
                  className="bg-muted rounded-xl py-2 text-xs font-extrabold text-muted-foreground active:scale-95 hover:bg-muted/70 transition-colors">
                  {l}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 bg-muted/50 rounded-xl px-3 py-2.5">
              <span>{mode === 'buy' ? 'Available cash' : 'Position value'}</span>
              <span className="font-extrabold text-foreground">${activeMax.toFixed(2)}</span>
            </div>

            {amt > 0 && amt > activeMax && (
              <p className="text-xs text-rose-400 font-bold text-center mb-3">
                {mode === 'buy' ? 'Insufficient cash' : "You don't hold that many shares"}
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

        {/* Confirm */}
        {step === 'confirm' && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep('amount')} className="p-2 rounded-xl bg-muted text-muted-foreground active:scale-95">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <p className="font-extrabold text-foreground text-lg">Confirm Order</p>
            </div>

            <div className="flex items-center justify-center mb-4">
              <span className="text-xs font-extrabold bg-muted text-muted-foreground rounded-full px-4 py-1.5 tracking-widest uppercase">
                Market Order · Instant Fill
              </span>
            </div>

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

        {/* Done */}
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Portfolio() {
  const { progress } = useUserProgress();
  const { player: authPlayer } = useAuth();
  const [prices, setPrices]       = useState(() => ({ ...marketSim.prices }));
  const [loading, setLoading]     = useState(() => Object.keys(marketSim.prices).length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [portfolio, setPortfolio] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PORTFOLIO_KEY) ?? 'null'); } catch { return null; }
  });
  const [watchlist, setWatchlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem(WATCHLIST_KEY) ?? '[]'); } catch { return []; }
  });
  const [tab, setTab]           = useState('market');
  const [sector, setSector]     = useState('All');
  const [tradeAsset, setTradeAsset] = useState(null);
  const [showBalance, setShowBalance] = useState(true);
  const [history, setHistory]   = useState(getPortfolioHistory);
  const [sortByMovers, setSortByMovers] = useState(false);
  const [expandedNews, setExpandedNews] = useState(null);
  const [milestone, setMilestone] = useState(null);
  const [realPlayers, setRealPlayers] = useState([]);
  const [marketStatus, setMarketStatus] = useState(getMarketStatus);
  const [showClosedInfo, setShowClosedInfo] = useState(true);
  const [portfolioSnapshots, setPortfolioSnapshots] = useState(() => [...marketSim.snapshots]);
  const portfolioRef = useRef(null);
  // Research tab
  const [researchQuery, setResearchQuery] = useState('');
  const [researchAsset, setResearchAsset] = useState(null);
  // Dividends
  const DRIP_KEY = 'wq_drip';
  const [drip, setDrip] = useState(() => { try { return JSON.parse(localStorage.getItem(DRIP_KEY) ?? '{}'); } catch { return {}; } });
  const divTimerRef = useRef(null);
  const earningsTimerRef = useRef(null);
  const inflationTimerRef = useRef(null);
  const [inflationTick, setInflationTick] = useState(0);

  // Earnings center-modal
  const [earningsModal, setEarningsModal] = useState(null); // { asset, rpt, shock }
  // Sector rotation event (transient — shows news for 10s)
  const [sectorEvent, setSectorEvent] = useState(null); // { name, news, boomSector, crashSector }
  // Recession phase: null | 'warning3' | 'warning2' | 'warning1' | 'active'
  const [recessionPhase, setRecessionPhase] = useState(null);
  // Simulated base interest rate (affects bond prices)
  const [baseRate, setBaseRate] = useState(4.5);
  // Bond trade panel: { bond, mode:'buy'|'sell', qty: string }
  const [bondTrade, setBondTrade] = useState(null);

  const sectorTimerRef    = useRef(null);
  const recessionTimerRef = useRef(null);
  const rateTimerRef      = useRef(null);

  const lessons  = progress?.completed_lessons?.length ?? 0;
  const unlocked = lessons >= UNLOCK_LESSONS;
  const { show: showIntro, dismiss: dismissIntro } = useSectionIntro('portfolio');

  // ── Init portfolio ──
  useEffect(() => {
    if (!localStorage.getItem(PORTFOLIO_KEY)) {
      const init = { cash: STARTING_CASH, holdings: [], trades: [], bondHoldings: [] };
      localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(init));
      setPortfolio(init);
    }
    if (!localStorage.getItem('wq_game_start')) {
      localStorage.setItem('wq_game_start', Date.now().toString());
    }
  }, []);

  // Keep portfolio ref synced and push to sim so it can compute snapshots off-page
  useEffect(() => { portfolioRef.current = portfolio; marketSim.setPortfolio(portfolio); }, [portfolio]);

  // Flush any pending cloud sync when the tab is closed
  useEffect(() => {
    window.addEventListener('beforeunload', flushNow);
    return () => window.removeEventListener('beforeunload', flushNow);
  }, []);

  // ── Fetch real prices on mount (idempotent — sim skips if already loaded) ──
  const loadPrices = useCallback(async () => {
    setRefreshing(true);
    await marketSim.init();
    setPrices({ ...marketSim.prices });
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { loadPrices(); }, [loadPrices]);

  // ── Subscribe to marketSim tick updates (prices + snapshots) ──
  // marketSim runs its own interval forever — even when Portfolio is unmounted —
  // so the chart continues advancing while the user is on other pages.
  useEffect(() => {
    const unsubP = marketSim.onPrices(() => {
      setMarketStatus(getMarketStatus());
      setPrices({ ...marketSim.prices });
    });
    const unsubS = marketSim.onSnapshots(() => {
      setPortfolioSnapshots([...marketSim.snapshots]);
    });
    return () => { unsubP(); unsubS(); };
  }, []);

  // Helper: apply a price mutation via the sim (keeps sim.prices in sync) then update React state
  const updatePrices = useCallback(updater => {
    marketSim.updatePrices(updater);
    setPrices({ ...marketSim.prices });
  }, []);

  // ── Refresh market status every minute ──
  useEffect(() => {
    const id = setInterval(() => setMarketStatus(getMarketStatus()), 60000);
    return () => clearInterval(id);
  }, []);

  // ── Dividends — pay out every 120 s (= 1 simulated quarter) ──
  useEffect(() => {
    clearInterval(divTimerRef.current);
    divTimerRef.current = setInterval(() => {
      const p = portfolio;
      if (!p || Object.keys(prices).length === 0) return;
      const hs = (p.holdings ?? []).filter(h => h.shares > 0.0001 && DIVIDENDS[h.assetId]);
      if (hs.length === 0) return;
      const updated = { ...p, holdings: [...(p.holdings ?? [])], trades: [...(p.trades ?? [])] };
      let cashDelta = 0;
      const msgs = [];
      hs.forEach(h => {
        const div   = DIVIDENDS[h.assetId];
        const price = prices[h.assetId]?.price ?? h.avgCost;
        const amt   = h.shares * price * (div.annualYield / 4); // quarterly
        const isDrip = drip[h.assetId];
        if (isDrip) {
          // reinvest: buy more shares
          const newShares = amt / price;
          const holding = updated.holdings.find(x => x.assetId === h.assetId);
          if (holding) {
            const tot = holding.shares + newShares;
            holding.avgCost = (holding.avgCost * holding.shares + price * newShares) / tot;
            holding.shares  = tot;
          }
          msgs.push(`🔄 ${h.assetId} dividend reinvested — +${newShares.toFixed(4)} shares`);
        } else {
          cashDelta += amt;
          msgs.push(`💵 ${h.assetId} dividend $${amt.toFixed(2)} → cash`);
        }
      });
      // Bond coupon payments (quarterly, same timer)
      let bondCashDelta = 0;
      (p.bondHoldings ?? []).forEach(bh => {
        const bond = BONDS.find(b => b.id === bh.bondId);
        if (!bond) return;
        const coupon = bh.quantity * bond.faceValue * (bond.coupon / 100 / 4);
        bondCashDelta += coupon;
        if (coupon > 0.001) msgs.push(`🏛️ ${bond.name} coupon $${coupon.toFixed(2)} → cash`);
      });
      updated.cash = (updated.cash ?? STARTING_CASH) + cashDelta + bondCashDelta;
      savePortfolio(updated);
      msgs.forEach((m, i) => setTimeout(() => toast.success(m, { duration: 4000 }), i * 600));
    }, 120000);
    return () => clearInterval(divTimerRef.current);
  }, [portfolio, prices, drip]);

  // ── Earnings events — 4× per year means one per quarter (~8–12 min in game) ──
  useEffect(() => {
    clearTimeout(earningsTimerRef.current);
    const schedule = () => {
      const delay = 480000 + Math.random() * 240000; // 8–12 minutes
      earningsTimerRef.current = setTimeout(() => {
        const hs = (portfolio?.holdings ?? []).filter(h => h.shares > 0.0001 && ASSETS.find(a => a.id === h.assetId)?.type !== 'crypto');
        if (hs.length === 0 || Object.keys(prices).length === 0) { schedule(); return; }
        const h     = hs[Math.floor(Math.random() * hs.length)];
        const hist  = getEarningsHistory(h.assetId);
        const rpt   = hist[hist.length - 1]; // latest quarter
        const shock = earningsShockMultiplier(rpt.beat, rpt.surprisePct);
        // Apply earnings shock to the stock price
        updatePrices(prev => {
          const pd = prev[h.assetId];
          if (!pd) return prev;
          const newPrice = pd.price * shock;
          return {
            ...prev,
            [h.assetId]: {
              ...pd,
              price: newPrice,
              basePrice: (pd.basePrice ?? pd.price) * shock,
              change: ((newPrice - (pd.basePrice ?? newPrice)) / (pd.basePrice ?? newPrice)) * 100,
              points: [...(pd.points?.slice(-49) ?? []), newPrice],
            }
          };
        });
        const asset = ASSETS.find(a => a.id === h.assetId);
        if (asset) setEarningsModal({ asset, rpt, shock });
        schedule();
      }, delay);
    };
    if (!loading && Object.keys(prices).length > 0) schedule();
    return () => clearTimeout(earningsTimerRef.current);
  }, [loading, portfolio]);

  // ── Inflation — erodes idle cash ~3% annually, fires every 90 s ──
  // Each tick: cash × (1 - annualRate/4/10) roughly simulates quarterly inflation
  useEffect(() => {
    clearInterval(inflationTimerRef.current);
    inflationTimerRef.current = setInterval(() => {
      const p = portfolio;
      if (!p || (p.cash ?? STARTING_CASH) < 1) return;
      const ANNUAL_RATE = 0.03; // 3% annual
      const tickRate    = ANNUAL_RATE / (365 * 24 * 40); // 40 ticks/hr = ~every 90s
      const erosion     = (p.cash ?? STARTING_CASH) * tickRate;
      if (erosion < 0.001) return;
      savePortfolio({ ...p, cash: (p.cash ?? STARTING_CASH) - erosion });
      setInflationTick(n => n + 1);
    }, 90000);
    return () => clearInterval(inflationTimerRef.current);
  }, [portfolio]);

  // ── Recession check — runs on mount and every hour ──
  useEffect(() => {
    const check = () => {
      const gameStart  = parseInt(localStorage.getItem('wq_game_start') ?? Date.now());
      const daysSince  = (Date.now() - gameStart) / 86400000;
      const cycle      = Math.floor(daysSince / 100);
      const dayInCycle = daysSince % 100;
      const lastApplied = parseInt(localStorage.getItem('wq_last_recession_applied') ?? '-1');

      let phase = null;
      if      (dayInCycle >= 99) phase = 'active';
      else if (dayInCycle >= 98) phase = 'warning1';
      else if (dayInCycle >= 97) phase = 'warning2';
      else if (dayInCycle >= 96) phase = 'warning3';
      setRecessionPhase(phase);

      if (phase === 'active' && lastApplied < cycle && Object.keys(marketSim.prices).length > 0) {
        localStorage.setItem('wq_last_recession_applied', cycle.toString());
        updatePrices(prev => {
          const next = { ...prev };
          Object.keys(prev).forEach(id => {
            const asset = ASSETS.find(a => a.id === id);
            const isSafeHaven = ['GLD', 'SLV', 'TLT'].includes(id) || asset?.sector === 'Bonds';
            const mult = isSafeHaven
              ? 1.03 + Math.random() * 0.04
              : 0.68 + Math.random() * 0.14;
            const pd  = prev[id];
            const np  = pd.price * mult;
            const base = (pd.basePrice ?? pd.price) * mult;
            next[id]  = { ...pd, price: np, basePrice: base, change: ((np - base) / base) * 100, points: [...(pd.points?.slice(-49) ?? []), np] };
          });
          return next;
        });
        toast.error('🔴 RECESSION: Markets crash — bonds & gold holding. Diversification matters!', { duration: 10000 });
      }
    };
    check();
    recessionTimerRef.current = setInterval(check, 3600000);
    return () => clearInterval(recessionTimerRef.current);
  }, []); // eslint-disable-line

  // ── Sector rotation — every 2–4 min, one sector crashes while another booms ──
  useEffect(() => {
    if (loading) return;
    clearTimeout(sectorTimerRef.current);
    const schedule = () => {
      const delay = 120000 + Math.random() * 120000;
      sectorTimerRef.current = setTimeout(() => {
        const ev = SECTOR_ROTATION_EVENTS[Math.floor(Math.random() * SECTOR_ROTATION_EVENTS.length)];
        updatePrices(prev => {
          const next = { ...prev };
          Object.keys(prev).forEach(id => {
            const asset = ASSETS.find(a => a.id === id);
            if (!asset?.sector) return;
            const isCrash = asset.sector === ev.crashSector;
            const isBoom  = asset.sector === ev.boomSector;
            if (!isCrash && !isBoom) return;
            const mult = isCrash
              ? ev.crashMult + (Math.random() - 0.5) * 0.02
              : ev.boomMult  + (Math.random() - 0.5) * 0.02;
            const pd   = prev[id];
            const np   = pd.price * mult;
            const base = (pd.basePrice ?? pd.price) * mult;
            next[id]   = { ...pd, price: np, basePrice: base, change: ((np - base) / base) * 100, points: [...(pd.points?.slice(-49) ?? []), np] };
          });
          return next;
        });
        setSectorEvent(ev);
        setTimeout(() => setSectorEvent(null), 12000);
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(sectorTimerRef.current);
  }, [loading]);

  // ── Bond base rate — drifts ±0.05–0.12% every 60 s ──
  useEffect(() => {
    rateTimerRef.current = setInterval(() => {
      setBaseRate(r => Math.max(2.0, Math.min(8.0, r + (Math.random() - 0.48) * 0.12)));
    }, 60000);
    return () => clearInterval(rateTimerRef.current);
  }, []);

  const cash     = portfolio?.cash ?? STARTING_CASH;
  const holdings = (portfolio?.holdings ?? []).filter(h => h.shares > 0.0001);
  const shorts   = portfolio?.shorts   ?? [];

  const investedValue = useMemo(() =>
    holdings.reduce((sum, h) => sum + (prices[h.assetId]?.price ?? h.avgCost) * h.shares, 0),
  [holdings, prices]);

  const bondValue = useMemo(() =>
    (portfolio?.bondHoldings ?? []).reduce((sum, bh) => {
      const bond = BONDS.find(b => b.id === bh.bondId);
      return sum + bh.quantity * getBondPrice(bond, baseRate);
    }, 0),
  [portfolio, baseRate]);

  const totalValue = useMemo(() => {
    const shortPnl  = shorts.reduce((sum, s) => sum + (s.entryPrice - (prices[s.assetId]?.price ?? s.entryPrice)) * s.shares, 0);
    const margin    = shorts.reduce((sum, s) => sum + s.entryPrice * s.shares, 0);
    const reEquity  = Number(localStorage.getItem('wq_re_equity') ?? 0); // real-estate equity (value − mortgage debt)
    return cash + investedValue + margin + shortPnl + bondValue + reEquity;
  }, [investedValue, shorts, prices, cash, bondValue]);

  useEffect(() => {
    if (!loading && totalValue > 0) {
      recordPortfolioValue(totalValue);
      setHistory(getPortfolioHistory());
      syncPortfolioValue(totalValue, progress?.xp ?? 0);
    }
  }, [loading]);

  useEffect(() => {
    fetchLeaderboard().then(players => { if (players.length) setRealPlayers(players); });
  }, []);

  const totalGain    = totalValue - STARTING_CASH;
  const totalGainPct = (totalGain / STARTING_CASH) * 100;
  const spyReturn    = prices['SPY']?.change ?? 0;

  const score = useMemo(() => calcPortfolioScore({
    holdings: holdings.map(h => ({ ...h, sector: ASSETS.find(a => a.id === h.assetId)?.sector })),
    prices, history, startingCash: STARTING_CASH,
  }), [holdings, prices, history]);

  const myPlayerId   = getMyPlayerId();
  const myPlayerData = getMyPlayerData();
  // "me" can be identified by auth id (real Supabase row) or the local player id.
  const myId = authPlayer?.id ?? myPlayerId;

  const leaderboard = useMemo(() => {
    // Real signed-in players only — exclude my own row (matched by either id).
    return realPlayers
      .filter(p => p.id !== myId && p.id !== myPlayerId)
      .map(p => ({
        id: p.id, name: p.name, avatar: p.avatar,
        value: Number(p.portfolio_value),
        returnPct: ((Number(p.portfolio_value) - 10000) / 10000) * 100,
        topHolding: null, real: true, countryCode: p.country_code,
      }))
      .sort((a, b) => b.value - a.value);
  }, [realPlayers, myId, myPlayerId]);

  // Full ranking with "me" inserted in the correct spot by portfolio value.
  const rankedList = useMemo(() => {
    const me = {
      id: 'me',
      name: authPlayer?.name ?? myPlayerData?.name ?? 'You',
      avatar: authPlayer?.avatar ?? myPlayerData?.avatar,
      value: totalValue,
      returnPct: totalGainPct,
      real: true, isMe: true,
      countryCode: authPlayer?.country_code ?? myPlayerData?.country_code,
    };
    return [...leaderboard, me].sort((a, b) => b.value - a.value);
  }, [leaderboard, totalValue, totalGainPct, authPlayer, myPlayerData]);

  const myRank = useMemo(() => {
    const idx = rankedList.findIndex(p => p.isMe);
    return idx === -1 ? null : idx + 1;
  }, [rankedList]);

  function savePortfolio(p) {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(p));
    setPortfolio(p);
    pushPortfolio(p);
  }

  function handleTrade(mode, shares, dollars) {
    const asset = tradeAsset;
    if (!canAssetTrade(asset, marketStatus)) {
      toast.error('Market is closed — trading not available right now');
      return;
    }
    const price = prices[asset.id]?.price ?? 0;
    const p = {
      ...portfolio,
      holdings: [...(portfolio?.holdings ?? [])],
      shorts:   [...(portfolio?.shorts   ?? [])],
      trades:   [...(portfolio?.trades   ?? [])],
    };

    if (mode === 'buy') {
      // Clamp tiny drift (Max pressed, then price/cash moved a cent) to all-in
      if (dollars > p.cash && dollars - p.cash <= 1) { dollars = p.cash; shares = dollars / price; }
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
    } else if (mode === 'sell') {
      const h = p.holdings.find(h => h.assetId === asset.id);
      if (!h) return;
      // Selling "All" with a moved price → clamp to the entire holding
      if (shares > h.shares && shares - h.shares <= h.shares * 0.02 + 0.000001) shares = h.shares;
      if (h.shares < shares - 0.000001) return;
      h.shares -= shares;
      if (h.shares < 0.0001) p.holdings = p.holdings.filter(x => x.assetId !== asset.id);
      p.cash += price * shares;
    } else if (mode === 'short') {
      // Post cash as margin (collateral = shares × price)
      if (dollars > p.cash) return;
      const ex = p.shorts.find(s => s.assetId === asset.id);
      if (ex) {
        const tot = ex.shares + shares;
        ex.entryPrice = (ex.entryPrice * ex.shares + price * shares) / tot;
        ex.shares = tot;
      } else {
        p.shorts.push({ assetId: asset.id, shares, entryPrice: price });
      }
      p.cash -= dollars; // hold as margin
    } else if (mode === 'cover') {
      const s = p.shorts.find(s => s.assetId === asset.id);
      if (!s || s.shares < shares) return;
      const pnl = (s.entryPrice - price) * shares;
      // Return margin + P&L
      p.cash += dollars + pnl;
      s.shares -= shares;
      if (s.shares < 0.000001) p.shorts = p.shorts.filter(x => x.assetId !== asset.id);
    }

    const tradeTs = Date.now();
    p.trades.push({ type: mode, assetId: asset.id, shares, price, ts: tradeTs });
    savePortfolio(p);

    // Learning bridge: after a buy, ask WHY — later we score each strategy
    if (mode === 'buy') setTimeout(() => setRationaleFor(tradeTs), 1400);

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

  function toggleDrip(assetId) {
    setDrip(prev => {
      const next = { ...prev, [assetId]: !prev[assetId] };
      localStorage.setItem(DRIP_KEY, JSON.stringify(next));
      return next;
    });
  }

  function handleBondTrade(bond, mode, quantity) {
    const price = getBondPrice(bond, baseRate);
    const cost  = price * quantity;
    const p = {
      ...portfolio,
      bondHoldings: [...(portfolio?.bondHoldings ?? [])],
      trades: [...(portfolio?.trades ?? [])],
    };
    if (mode === 'buy') {
      if (cost > p.cash) { toast.error('Insufficient cash for this bond purchase'); return; }
      const ex = p.bondHoldings.find(bh => bh.bondId === bond.id);
      if (ex) { ex.quantity += quantity; }
      else    { p.bondHoldings.push({ bondId: bond.id, quantity, purchasePrice: price }); }
      p.cash -= cost;
      toast.success(`Bought ${quantity}× ${bond.name} @ $${price.toFixed(0)}/bond · ${bond.coupon}% coupon`);
    } else {
      const ex = p.bondHoldings.find(bh => bh.bondId === bond.id);
      if (!ex || ex.quantity < quantity) { toast.error('Not enough bonds to sell'); return; }
      ex.quantity -= quantity;
      if (ex.quantity <= 0) p.bondHoldings = p.bondHoldings.filter(bh => bh.bondId !== bond.id);
      p.cash += cost;
      toast.success(`Sold ${quantity}× ${bond.name} @ $${price.toFixed(0)}/bond`);
    }
    savePortfolio(p);
    setBondTrade(null);
  }

  const filteredAssets = useMemo(() => {
    let list = sector === 'Watchlist' ? ASSETS.filter(a => watchlist.includes(a.id))
      : sector === 'All' ? ASSETS : ASSETS.filter(a => a.sector === sector);
    if (sortByMovers) list = [...list].sort((a, b) => Math.abs(prices[b.id]?.change ?? 0) - Math.abs(prices[a.id]?.change ?? 0));
    return list;
  }, [sector, sortByMovers, watchlist, prices]);

  const hotMovers = useMemo(() => [...ASSETS].filter(a => prices[a.id])
    .sort((a, b) => Math.abs(prices[b.id].change) - Math.abs(prices[a.id].change)).slice(0, 5), [prices]);

  const NEWS = useMemo(() => {
    const base = {
      Technology:    [{ title: 'AI chip demand drives tech rally', sentiment: 'up', time: '2h ago' }, { title: 'Big Tech earnings beat expectations', sentiment: 'up', time: '5h ago' }],
      Finance:       [{ title: 'Banks report strong Q2 profits', sentiment: 'up', time: '3h ago' }, { title: 'Credit card spending rises 4%', sentiment: 'up', time: '6h ago' }],
      Consumer:      [{ title: 'Retail sales surprise to the upside', sentiment: 'up', time: '4h ago' }, { title: 'EV demand softens as rates stay high', sentiment: 'down', time: '8h ago' }],
      Energy:        [{ title: 'Oil climbs on OPEC supply cut rumours', sentiment: 'up', time: '1h ago' }, { title: 'Natural gas slides on warm weather', sentiment: 'down', time: '3h ago' }],
      Healthcare:    [{ title: 'Drug approvals fuel healthcare gains', sentiment: 'up', time: '2h ago' }, { title: 'Insurance costs weigh on UNH outlook', sentiment: 'down', time: '5h ago' }],
      'Broad Market':[{ title: 'S&P 500 sets new intraday high', sentiment: 'up', time: '1h ago' }, { title: 'VIX near 12-month low', sentiment: 'up', time: '4h ago' }],
      Crypto:        [{ title: 'BTC surges on ETF inflow momentum', sentiment: 'up', time: '30m ago' }, { title: 'SEC weighs new crypto custody rules', sentiment: 'down', time: '3h ago' }],
    };
    // Inject recession warning news
    if (recessionPhase && RECESSION_NEWS[recessionPhase]) {
      base['⚠️ Economic Outlook'] = RECESSION_NEWS[recessionPhase];
    }
    // Inject current sector rotation event
    if (sectorEvent) {
      const boomPct = Math.abs(((1 - sectorEvent.boomMult) * -100)).toFixed(0);
      const crashPct = Math.abs(((1 - sectorEvent.crashMult) * 100)).toFixed(0);
      base['📊 Sector Rotation'] = [
        { title: sectorEvent.news, sentiment: 'up', time: 'Just now' },
        { title: `${sectorEvent.boomSector} +${boomPct}% · ${sectorEvent.crashSector} −${crashPct}%`, sentiment: 'down', time: 'Just now' },
      ];
    }
    return base;
  }, [recessionPhase, sectorEvent]);

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

  const tabs = [{ id: 'market', label: 'Market' }, { id: 'holdings', label: 'Holdings' }, { id: 'research', label: 'Research' }, { id: 'leaderboard', label: 'Rank' }];

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

        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Cash Available</span>
            <span className="text-sm font-extrabold text-emerald-400">${cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>vs S&P: <span className={spyReturn >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{spyReturn >= 0 ? '+' : ''}{spyReturn.toFixed(2)}%</span></span>
            {myRank && <span>Rank: <span className="text-primary font-bold">#{myRank}</span></span>}
            {leaderboard.length > 0 && (() => {
              const totalPool = leaderboard.reduce((s, p) => s + p.value, 0) + totalValue;
              const share = totalPool > 0 ? (totalValue / totalPool * 100).toFixed(1) : '0';
              return <span>Market share: <span className="text-amber-400 font-bold">{share}%</span></span>;
            })()}
          </div>
        </div>
        <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground" style={{display:'none'}}>
          <span>vs S&P: <span className={spyReturn >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{spyReturn >= 0 ? '+' : ''}{spyReturn.toFixed(2)}%</span></span>
          {myRank && <span>Rank: <span className="text-primary font-bold">#{myRank}</span></span>}
          {leaderboard.length > 0 && (() => {
            const totalPool = leaderboard.reduce((s, p) => s + p.value, 0) + totalValue;
            const share = totalPool > 0 ? (totalValue / totalPool * 100).toFixed(1) : '0';
            return <span>Market share: <span className="text-amber-400 font-bold">{share}%</span></span>;
          })()}
        </div>

        <div className="h-36 mt-2">
          <PortfolioChart
            history={history}
            startingCash={STARTING_CASH}
            livePoints={portfolioSnapshots.length >= 2 ? portfolioSnapshots : undefined}
          />
        </div>
      </div>

      {/* Prominent closed-market explainer (shown when you open Portfolio) */}
      <AnimatePresence>
        {!marketStatus.open && showClosedInfo && (
          <MarketClosedExplainer status={marketStatus} onDismiss={() => setShowClosedInfo(false)} />
        )}
      </AnimatePresence>

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

            {/* Market status banner */}
            <MarketBanner status={marketStatus} />

            <div className="flex items-center justify-between mb-3">
              <MarketMood prices={prices} />
              <button onClick={() => setSortByMovers(v => !v)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl ${sortByMovers ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                Top Movers
              </button>
            </div>

            {/* Sector filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar">
              {allSectors.map(s => (
                <button key={s} onClick={() => setSector(s)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-extrabold transition-all ${sector === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {s === 'Watchlist' ? `⭐ ${s}` : s}
                </button>
              ))}
            </div>

            {/* Hot movers */}
            {!loading && hotMovers.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide mb-2">🔥 Hot Today</p>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {hotMovers.map(asset => {
                    const p = prices[asset.id];
                    const up = (p?.change ?? 0) >= 0;
                    const ipo = IPO_DATA[asset.id];
                    const atRet = ipo ? ((p?.price - ipo.ipoPrice) / ipo.ipoPrice) * 100 : null;
                    return (
                      <button key={asset.id} onClick={() => setTradeAsset(asset)}
                        className="flex-shrink-0 bg-card border border-border rounded-2xl p-3 min-w-[90px] active:scale-95 transition-all text-left">
                        <p className="text-xl mb-0.5">{asset.emoji}</p>
                        <p className="text-xs font-extrabold text-foreground">{asset.symbol}</p>
                        <p className={`text-xs font-bold ${up ? 'text-emerald-400' : 'text-rose-400'}`}>{up ? '+' : ''}{p?.change?.toFixed(2) ?? '—'}%</p>
                        {atRet !== null && <p className="text-[9px] text-muted-foreground">{formatIPOReturn(atRet)} IPO</p>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Asset list */}
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}</div>
            ) : (
              <div className="space-y-1.5">
                {filteredAssets.map(asset => {
                  const pd = prices[asset.id];
                  const up = (pd?.change ?? 0) >= 0;
                  const held = holdings.some(h => h.assetId === asset.id);
                  const watched = watchlist.includes(asset.id);
                  const ipo = IPO_DATA[asset.id];
                  const atRet = ipo && pd?.price ? ((pd.price - ipo.ipoPrice) / ipo.ipoPrice) * 100 : null;
                  const tradeable = canAssetTrade(asset, marketStatus);
                  return (
                    <div key={asset.id} className="flex items-center gap-3 bg-card border border-border rounded-2xl px-3 py-3 transition-all">
                      <span className="text-xl shrink-0">{asset.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-extrabold text-foreground">{asset.symbol}</p>
                          {held && <span className="text-[9px] font-extrabold bg-primary/15 text-primary rounded px-1 py-0.5">HELD</span>}
                          {asset.type === 'crypto' && <span className="text-[9px] font-extrabold bg-violet-500/15 text-violet-400 rounded px-1 py-0.5">24/7</span>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{asset.name}</p>
                        {atRet !== null && (
                          <p className="text-[9px] text-emerald-400 font-bold">{formatIPOReturn(atRet)} since {ipo.label}</p>
                        )}
                      </div>
                      <Sparkline points={pd?.points} positive={up} width={52} height={26} />
                      <div className="text-right shrink-0 min-w-[68px]">
                        <p className="text-sm font-extrabold text-foreground">${pd?.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: pd?.price >= 100 ? 2 : 4 }) ?? '—'}</p>
                        <p className={`text-xs font-bold ${up ? 'text-emerald-400' : 'text-rose-400'}`}>{up ? '+' : ''}{pd?.change?.toFixed(2) ?? '—'}%</p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => setTradeAsset(asset)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-extrabold active:scale-95 transition-all flex items-center gap-1 ${
                            tradeable
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                          {tradeable ? 'Trade' : <><Lock className="w-3 h-3" /> Closed</>}
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
                  { label: 'Performance',     val: Math.round(score.perfScore), max: 35 },
                  { label: 'Activity',        val: score.activityScore, max: 20 },
                  { label: 'Consistency',     val: score.historyScore, max: 10 },
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

            {/* Asset Allocation Breakdown */}
            {(holdings.length > 0 || (portfolio?.bondHoldings ?? []).length > 0) && (() => {
              const sectorVals = {};
              holdings.forEach(h => {
                const a = ASSETS.find(x => x.id === h.assetId);
                const v = (prices[h.assetId]?.price ?? h.avgCost) * h.shares;
                const sec = a?.sector ?? 'Other';
                sectorVals[sec] = (sectorVals[sec] ?? 0) + v;
              });
              const tot = cash + investedValue + bondValue;
              const segs = [
                { label: 'Cash', val: cash, color: '#10b981' },
                ...Object.entries(sectorVals).map(([s, v]) => ({ label: s, val: v, color: SECTOR_COLORS[s] ?? '#64748b' })),
                ...(bondValue > 0 ? [{ label: 'Bonds', val: bondValue, color: '#f59e0b' }] : []),
              ].filter(s => s.val > 0.01);
              if (tot <= 0) return null;
              return (
                <div className="bg-card border border-border rounded-2xl p-4 mb-4">
                  <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide mb-3">Asset Allocation</p>
                  <div className="flex h-3 rounded-full overflow-hidden mb-3 gap-0.5">
                    {segs.map((s, i) => (
                      <div key={i} style={{ width: `${(s.val / tot) * 100}%`, backgroundColor: s.color, minWidth: '2px' }} className="rounded-sm" />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {segs.map((s, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
                        <p className="text-[10px] text-muted-foreground flex-1 truncate">{s.label}</p>
                        <p className="text-[10px] font-bold text-foreground">{((s.val / tot) * 100).toFixed(1)}%</p>
                      </div>
                    ))}
                  </div>
                  {cash / tot > 0.5 && (
                    <p className="text-[10px] text-amber-400 font-bold mt-2 text-center">
                      ⚠️ Over 50% in cash — inflation is eroding it. Consider investing.
                    </p>
                  )}
                </div>
              );
            })()}

            {holdings.length === 0 && (portfolio?.bondHoldings ?? []).length === 0 ? (
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
                    const pd   = prices[h.assetId];
                    const cur  = pd?.price ?? h.avgCost;
                    const value = cur * h.shares;
                    const cost  = h.avgCost * h.shares;
                    const gain  = value - cost;
                    const gainPct = (gain / cost) * 100;
                    const up = gain >= 0;
                    const ipo = IPO_DATA[h.assetId];
                    const atRet = ipo ? ((cur - ipo.ipoPrice) / ipo.ipoPrice) * 100 : null;
                    return (
                      <div key={h.assetId} className="bg-card border border-border rounded-2xl p-4">
                        {/* Row 1: asset info + sparkline */}
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-xl">{asset.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-extrabold text-foreground text-sm leading-tight">{asset.symbol} <span className="text-muted-foreground font-normal text-xs">{asset.name}</span></p>
                            <p className="text-xs text-muted-foreground">{h.shares.toFixed(6)} sh · avg ${h.avgCost.toFixed(2)}</p>
                          </div>
                          <Sparkline points={pd?.points} positive={up} width={56} height={28} />
                        </div>
                        {/* Row 2: value + unrealized gain pill */}
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Value</p>
                            <p className="text-lg font-extrabold text-foreground">${value.toFixed(2)}</p>
                          </div>
                          <div className={`flex flex-col items-end px-3 py-1.5 rounded-xl ${up ? 'bg-emerald-500/12' : 'bg-rose-500/12'}`}>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Unrealized</p>
                            <p className={`text-base font-extrabold ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {up ? '+' : ''}${gain.toFixed(2)}
                            </p>
                            <p className={`text-xs font-bold ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {up ? '+' : ''}{gainPct.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                        {/* Row 3: now price + ipo + trade */}
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs text-muted-foreground">Now </span>
                            <span className="text-xs font-bold text-foreground">${cur.toFixed(2)}</span>
                            {atRet !== null && <span className="text-[10px] text-emerald-400 font-bold ml-2">{formatIPOReturn(atRet)} IPO</span>}
                          </div>
                          <button onClick={() => setTradeAsset(asset)}
                            className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-xs font-extrabold active:scale-95">Trade</button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bond Holdings */}
                {(portfolio?.bondHoldings ?? []).length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide mb-2">🏛️ Bond Holdings</p>
                    <div className="space-y-2">
                      {(portfolio.bondHoldings ?? []).filter(bh => bh.quantity > 0).map(bh => {
                        const bond = BONDS.find(b => b.id === bh.bondId);
                        if (!bond) return null;
                        const curPrice = getBondPrice(bond, baseRate);
                        const totalVal = curPrice * bh.quantity;
                        const totalCost = bh.purchasePrice * bh.quantity;
                        const gain = totalVal - totalCost;
                        const gainPct = totalCost > 0 ? (gain / totalCost) * 100 : 0;
                        return (
                          <div key={bh.bondId} className="bg-card border border-border rounded-2xl p-4">
                            <div className="flex items-start gap-2 mb-3">
                              <span className="text-xl">{bond.emoji}</span>
                              <div className="flex-1">
                                <p className="text-sm font-extrabold text-foreground">{bond.name}</p>
                                <p className="text-xs text-muted-foreground">{bh.quantity}× bond · {bond.coupon}% annual coupon</p>
                              </div>
                              <div className={`text-right px-2.5 py-1.5 rounded-xl ${gain >= 0 ? 'bg-emerald-500/12' : 'bg-rose-500/12'}`}>
                                <p className={`text-sm font-extrabold ${gain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {gain >= 0 ? '+' : ''}${gain.toFixed(2)}
                                </p>
                                <p className={`text-[10px] font-bold ${gain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {gainPct.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[10px] text-muted-foreground">Market Value</p>
                                <p className="text-base font-extrabold text-foreground">${totalVal.toFixed(0)}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] text-muted-foreground">Rate</p>
                                <p className="text-xs font-bold text-foreground">{baseRate.toFixed(2)}%</p>
                                <p className="text-[10px] text-amber-400">rates ↑ → price ↓</p>
                              </div>
                              <button onClick={() => setBondTrade({ bond, mode: 'sell', qty: '1' })}
                                className="bg-rose-500/15 text-rose-400 border border-rose-500/20 rounded-lg px-3 py-1.5 text-xs font-extrabold active:scale-95">
                                Sell
                              </button>
                            </div>
                            {bondTrade?.bond?.id === bond.id && bondTrade.mode === 'sell' && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="text-xs text-muted-foreground flex-1">Qty (${curPrice.toFixed(0)}/bond)</p>
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => setBondTrade(t => ({ ...t, qty: String(Math.max(1, parseInt(t.qty||'1') - 1)) }))} className="w-7 h-7 bg-muted rounded-lg text-foreground font-extrabold active:scale-95 text-sm">−</button>
                                    <span className="w-8 text-center text-sm font-extrabold text-foreground">{bondTrade.qty}</span>
                                    <button onClick={() => setBondTrade(t => ({ ...t, qty: String(Math.min(bh.quantity, parseInt(t.qty||'1') + 1)) }))} className="w-7 h-7 bg-muted rounded-lg text-foreground font-extrabold active:scale-95 text-sm">+</button>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => handleBondTrade(bond, 'sell', parseInt(bondTrade.qty)||1)} className="flex-1 bg-rose-500 text-white rounded-xl py-2 text-sm font-extrabold active:scale-95">
                                    Sell ${(curPrice * (parseInt(bondTrade.qty)||1)).toFixed(0)}
                                  </button>
                                  <button onClick={() => setBondTrade(null)} className="px-4 bg-muted text-muted-foreground rounded-xl py-2 text-sm font-bold active:scale-95">Cancel</button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* P&L Summary */}
            {(() => {
              const unrealizedLong  = holdings.reduce((sum, h) => {
                const cur = prices[h.assetId]?.price ?? h.avgCost;
                return sum + (cur - h.avgCost) * h.shares;
              }, 0);
              const unrealizedShort = shorts.reduce((sum, s) => {
                const cur = prices[s.assetId]?.price ?? s.entryPrice;
                return sum + (s.entryPrice - cur) * s.shares;
              }, 0);
              const trades = portfolio?.trades ?? [];
              // Realized P&L: sell trades gain = (price - avgCost) * shares, cover trades gain = pnl stored implicitly via cash
              // We approximate realized from trade pairs: for each sell, find the most recent buy's avgCost
              // Simpler: track realized as cash delta from sells/covers vs buy cost
              // Use trade history: sum sell proceeds - cost basis, sum cover proceeds - short cost
              let realizedPnl = 0;
              const costBasis = {};
              trades.forEach(t => {
                if (t.type === 'buy') {
                  if (!costBasis[t.assetId]) costBasis[t.assetId] = { shares: 0, cost: 0 };
                  costBasis[t.assetId].cost   = (costBasis[t.assetId].cost * costBasis[t.assetId].shares + t.price * t.shares) / (costBasis[t.assetId].shares + t.shares);
                  costBasis[t.assetId].shares += t.shares;
                } else if (t.type === 'sell') {
                  const cb = costBasis[t.assetId];
                  const avg = cb ? cb.cost : t.price;
                  realizedPnl += (t.price - avg) * t.shares;
                  if (cb) cb.shares = Math.max(0, cb.shares - t.shares);
                }
              });
              const shortBasis = {};
              trades.forEach(t => {
                if (t.type === 'short') {
                  if (!shortBasis[t.assetId]) shortBasis[t.assetId] = { shares: 0, cost: 0 };
                  shortBasis[t.assetId].cost   = (shortBasis[t.assetId].cost * shortBasis[t.assetId].shares + t.price * t.shares) / (shortBasis[t.assetId].shares + t.shares);
                  shortBasis[t.assetId].shares += t.shares;
                } else if (t.type === 'cover') {
                  const cb = shortBasis[t.assetId];
                  const entry = cb ? cb.cost : t.price;
                  realizedPnl += (entry - t.price) * t.shares;
                  if (cb) cb.shares = Math.max(0, cb.shares - t.shares);
                }
              });
              const totalUnrealized = unrealizedLong + unrealizedShort;
              const totalPnl        = realizedPnl + totalUnrealized;
              const rows = [
                { label: 'Unrealized (Stocks)', val: unrealizedLong,  show: holdings.length > 0 },
                { label: 'Unrealized (Shorts)',  val: unrealizedShort, show: shorts.length > 0 },
                { label: 'Realized P&L',         val: realizedPnl,     show: trades.some(t => t.type === 'sell' || t.type === 'cover') },
              ].filter(r => r.show);
              if (rows.length === 0 && realizedPnl === 0) return null;
              return (
                <div className="mt-6">
                  <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide mb-2">Profit & Loss</p>
                  <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    {rows.map((r, i) => (
                      <div key={i} className={`flex items-center justify-between px-4 py-3 ${i < rows.length - 1 ? 'border-b border-border' : ''}`}>
                        <p className="text-xs text-muted-foreground">{r.label}</p>
                        <p className={`text-sm font-extrabold ${r.val >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {r.val >= 0 ? '+' : ''}${Math.abs(r.val).toFixed(2)}
                        </p>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-t border-border">
                      <p className="text-xs font-extrabold text-foreground">Total P&L</p>
                      <p className={`text-base font-extrabold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {totalPnl >= 0 ? '+' : ''}${Math.abs(totalPnl).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {(portfolio?.trades?.length ?? 0) > 0 && (
              <div className="mt-6">
                <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide mb-2">Trade History</p>
                <div className="space-y-1.5">
                  {(() => {
                    const allTrades = portfolio?.trades ?? [];
                    // Pre-compute rolling avg cost for P&L display
                    const cb = {}, sb = {};
                    const withPnl = allTrades.map(t => {
                      let pnl = null;
                      if (t.type === 'buy') {
                        if (!cb[t.assetId]) cb[t.assetId] = { shares: 0, cost: 0 };
                        cb[t.assetId].cost   = (cb[t.assetId].cost * cb[t.assetId].shares + t.price * t.shares) / (cb[t.assetId].shares + t.shares);
                        cb[t.assetId].shares += t.shares;
                      } else if (t.type === 'sell') {
                        const avg = cb[t.assetId]?.cost ?? t.price;
                        pnl = (t.price - avg) * t.shares;
                        if (cb[t.assetId]) cb[t.assetId].shares = Math.max(0, cb[t.assetId].shares - t.shares);
                      } else if (t.type === 'short') {
                        if (!sb[t.assetId]) sb[t.assetId] = { shares: 0, cost: 0 };
                        sb[t.assetId].cost   = (sb[t.assetId].cost * sb[t.assetId].shares + t.price * t.shares) / (sb[t.assetId].shares + t.shares);
                        sb[t.assetId].shares += t.shares;
                      } else if (t.type === 'cover') {
                        const entry = sb[t.assetId]?.cost ?? t.price;
                        pnl = (entry - t.price) * t.shares;
                        if (sb[t.assetId]) sb[t.assetId].shares = Math.max(0, sb[t.assetId].shares - t.shares);
                      }
                      return { ...t, pnl };
                    });
                    const typeStyle = { buy: 'bg-emerald-500/20 text-emerald-400', sell: 'bg-rose-500/20 text-rose-400', short: 'bg-violet-500/20 text-violet-400', cover: 'bg-sky-500/20 text-sky-400' };
                    return [...withPnl].reverse().slice(0, 10).map((t, i) => {
                      const asset = ASSETS.find(a => a.id === t.assetId);
                      return (
                        <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-2.5">
                          <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${typeStyle[t.type] ?? typeStyle.buy}`}>{t.type.toUpperCase()}</span>
                          <span className="text-sm">{asset?.emoji}</span>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-foreground">{asset?.symbol} · {t.shares.toFixed(4)} shares</p>
                            <p className="text-[10px] text-muted-foreground">@ ${t.price.toFixed(2)} · {new Date(t.ts).toLocaleDateString()}</p>
                          </div>
                          {t.pnl !== null && (
                            <span className={`text-xs font-extrabold ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {t.pnl >= 0 ? '+' : ''}${Math.abs(t.pnl).toFixed(2)}
                            </span>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── RESEARCH ─── */}
        {tab === 'research' && (() => {
          const filteredSearch = researchQuery.trim().length >= 1
            ? ASSETS.filter(a =>
                a.symbol.toLowerCase().includes(researchQuery.toLowerCase()) ||
                a.name.toLowerCase().includes(researchQuery.toLowerCase()))
              .slice(0, 8)
            : [];
          const ra = researchAsset;
          const raPd = ra ? prices[ra.id] : null;
          const raDiv = ra ? DIVIDENDS[ra.symbol] ?? DIVIDENDS[ra.id] : null;
          const raEarnings = ra ? getEarningsHistory(ra.id) : [];
          const guidanceIcon = g => g === 'positive' ? '🟢' : g === 'neutral' ? '🟡' : '🔴';
          const guidanceLabel = g => g === 'positive' ? 'Positive' : g === 'neutral' ? 'Neutral' : 'Negative';
          return (
            <motion.div key="research" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="px-4 pt-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 flex items-center gap-2 bg-muted rounded-2xl px-3 py-2.5">
                  <span className="text-muted-foreground text-sm">🔍</span>
                  <input
                    value={researchQuery}
                    onChange={e => setResearchQuery(e.target.value)}
                    placeholder="Search stocks, ETFs…"
                    className="bg-transparent flex-1 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  />
                  {researchQuery && <button onClick={() => { setResearchQuery(''); setResearchAsset(null); }} className="text-muted-foreground text-xs">✕</button>}
                </div>
              </div>

              {/* Search results dropdown */}
              {filteredSearch.length > 0 && !ra && (
                <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
                  {filteredSearch.map((a, i) => {
                    const pd = prices[a.id];
                    const up = (pd?.change ?? 0) >= 0;
                    return (
                      <button key={a.id} onClick={() => { setResearchAsset(a); setResearchQuery(''); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 active:bg-muted transition-all ${i > 0 ? 'border-t border-border' : ''}`}>
                        <span className="text-lg">{a.emoji}</span>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-extrabold text-foreground">{a.symbol}</p>
                          <p className="text-xs text-muted-foreground">{a.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">${pd?.price?.toFixed(2) ?? '—'}</p>
                          <p className={`text-xs font-bold ${up ? 'text-emerald-400' : 'text-rose-400'}`}>{up ? '+' : ''}{pd?.change?.toFixed(2) ?? '—'}%</p>
                        </div>
                        {DIVIDENDS[a.symbol] || DIVIDENDS[a.id] ? <span className="text-[10px] bg-amber-400/20 text-amber-400 rounded px-1.5 py-0.5 font-bold">DIV</span> : null}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Placeholder when nothing searched */}
              {!ra && researchQuery.trim().length === 0 && (
                <div>
                  <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide mb-3">Dividend Payers</p>
                  <div className="space-y-1.5">
                    {ASSETS.filter(a => DIVIDENDS[a.symbol] || DIVIDENDS[a.id]).slice(0, 6).map(a => {
                      const div = DIVIDENDS[a.symbol] ?? DIVIDENDS[a.id];
                      const pd  = prices[a.id];
                      const up  = (pd?.change ?? 0) >= 0;
                      return (
                        <button key={a.id} onClick={() => setResearchAsset(a)}
                          className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 active:scale-[0.99] transition-all">
                          <span className="text-lg">{a.emoji}</span>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-extrabold text-foreground">{a.symbol} <span className="text-muted-foreground font-normal text-xs">{a.name}</span></p>
                            <p className="text-xs text-amber-400 font-bold">Yield {div.label} · Quarterly</p>
                          </div>
                          <p className={`text-sm font-bold ${up ? 'text-emerald-400' : 'text-rose-400'}`}>{up ? '+' : ''}{pd?.change?.toFixed(2) ?? '—'}%</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Bonds section */}
                  <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide mb-3 mt-5">🏛️ Bond Market</p>
                  <div className="bg-muted/40 border border-border rounded-2xl p-3 mb-3 text-xs text-muted-foreground">
                    Bonds pay a fixed <span className="text-foreground font-bold">coupon</span> and return face value at maturity. When interest rates rise, bond prices fall — and vice versa. Government bonds are safest; high-yield bonds pay more but carry default risk.
                  </div>
                  <div className="space-y-2">
                    {BONDS.map(b => (
                      <div key={b.id} className="bg-card border border-border rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{b.emoji}</span>
                            <div>
                              <p className="text-sm font-extrabold text-foreground">{b.name}</p>
                              <p className="text-[10px] text-muted-foreground">{b.type === 'government' ? 'US Government' : b.type === 'corporate' ? 'Corporate' : 'High-Yield'} · Matures {b.maturity}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full bg-muted ${BOND_RATING_COLOR[b.rating] ?? 'text-foreground'}`}>{b.rating}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div className="bg-muted rounded-xl p-2 text-center">
                            <p className="text-[10px] text-muted-foreground">Coupon</p>
                            <p className="text-xs font-extrabold text-amber-400">{b.coupon}%</p>
                          </div>
                          <div className="bg-muted rounded-xl p-2 text-center">
                            <p className="text-[10px] text-muted-foreground">YTM</p>
                            <p className="text-xs font-extrabold text-foreground">{b.yieldTo}%</p>
                          </div>
                          <div className="bg-muted rounded-xl p-2 text-center">
                            <p className="text-[10px] text-muted-foreground">Face Value</p>
                            <p className="text-xs font-extrabold text-foreground">${b.faceValue}</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mb-3">{b.description}</p>
                        <div className="flex items-center justify-between mb-2 text-[10px] text-muted-foreground">
                          <span>Rate: <span className="text-foreground font-bold">{baseRate.toFixed(2)}%</span></span>
                          <span>Price: <span className={`font-bold ${getBondPrice(b, baseRate) >= b.faceValue ? 'text-emerald-400' : 'text-rose-400'}`}>${getBondPrice(b, baseRate).toFixed(0)}</span></span>
                          {(portfolio?.bondHoldings ?? []).find(bh => bh.bondId === b.id) && (
                            <span className="text-primary font-bold">Held: {(portfolio.bondHoldings.find(bh => bh.bondId === b.id)?.quantity ?? 0)}×</span>
                          )}
                        </div>
                        {bondTrade?.bond?.id === b.id ? (
                          <div className="border-t border-border pt-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-muted-foreground">Quantity</p>
                              <div className="flex items-center gap-1">
                                <button onClick={() => setBondTrade(t => ({ ...t, qty: String(Math.max(1, parseInt(t.qty||'1') - 1)) }))} className="w-7 h-7 bg-muted rounded-lg text-foreground font-extrabold active:scale-95 text-sm">−</button>
                                <span className="w-8 text-center text-sm font-extrabold text-foreground">{bondTrade.qty}</span>
                                <button onClick={() => setBondTrade(t => ({ ...t, qty: String(parseInt(t.qty||'1') + 1) }))} className="w-7 h-7 bg-muted rounded-lg text-foreground font-extrabold active:scale-95 text-sm">+</button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-xs text-muted-foreground">Total cost</p>
                              <p className="text-sm font-extrabold text-foreground">${(getBondPrice(b, baseRate) * (parseInt(bondTrade.qty)||1)).toFixed(0)}</p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleBondTrade(b, 'buy', parseInt(bondTrade.qty)||1)}
                                className="flex-1 bg-primary text-primary-foreground rounded-xl py-2 text-sm font-extrabold active:scale-95">
                                Buy Bond
                              </button>
                              <button onClick={() => setBondTrade(null)} className="px-4 bg-muted text-muted-foreground rounded-xl py-2 text-sm font-bold active:scale-95">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setBondTrade({ bond: b, mode: 'buy', qty: '1' })}
                            className="w-full bg-primary/10 text-primary border border-primary/20 rounded-xl py-2 text-xs font-extrabold active:scale-95">
                            Buy Bond — ${getBondPrice(b, baseRate).toFixed(0)} / bond
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock detail */}
              {ra && (
                <div>
                  <button onClick={() => setResearchAsset(null)} className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 active:opacity-70">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to search
                  </button>

                  {/* Header card */}
                  <div className="bg-card border border-border rounded-2xl p-4 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{ra.emoji}</span>
                      <div className="flex-1">
                        <p className="text-lg font-extrabold text-foreground">{ra.symbol}</p>
                        <p className="text-xs text-muted-foreground">{ra.name} · {ra.sector}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-extrabold text-foreground">${raPd?.price?.toFixed(2) ?? '—'}</p>
                        <p className={`text-sm font-bold ${(raPd?.change ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {(raPd?.change ?? 0) >= 0 ? '+' : ''}{raPd?.change?.toFixed(2) ?? '—'}%
                        </p>
                      </div>
                    </div>
                    <Sparkline points={raPd?.points} positive={(raPd?.change ?? 0) >= 0} width={300} height={48} />
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => setTradeAsset(ra)}
                        className="flex-1 bg-primary text-primary-foreground rounded-xl py-2 text-sm font-extrabold active:scale-95">
                        Trade {ra.symbol}
                      </button>
                    </div>
                  </div>

                  {/* Dividend card */}
                  {raDiv && (
                    <div className="bg-card border border-border rounded-2xl p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide">Dividends</p>
                          <p className="text-lg font-extrabold text-amber-400">{raDiv.label} yield</p>
                          <p className="text-xs text-muted-foreground">Paid quarterly · ~every 2 min in-game</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground mb-1">Per share / qtr</p>
                          <p className="text-sm font-extrabold text-foreground">
                            ${raPd?.price ? ((raPd.price * raDiv.annualYield) / 4).toFixed(4) : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-muted rounded-xl px-4 py-3">
                        <div>
                          <p className="text-xs font-extrabold text-foreground">Auto-Reinvest (DRIP)</p>
                          <p className="text-xs text-muted-foreground">Dividends buy more shares automatically</p>
                        </div>
                        <button onClick={() => toggleDrip(ra.symbol)}
                          className={`relative w-11 h-6 rounded-full transition-all ${drip[ra.symbol] ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}>
                          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${drip[ra.symbol] ? 'left-6' : 'left-1'}`} />
                        </button>
                      </div>
                      {drip[ra.symbol] && (
                        <p className="text-[10px] text-emerald-400 mt-2 text-center font-bold">✅ DRIP enabled — dividends will buy more {ra.symbol} shares</p>
                      )}
                    </div>
                  )}

                  {/* Earnings history */}
                  {ra.type !== 'crypto' && (
                    <div className="mb-4">
                      <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide mb-2">Earnings History</p>
                      <div className="space-y-2">
                        {[...raEarnings].reverse().map((rpt, i) => (
                          <div key={i} className={`bg-card border rounded-2xl p-4 ${rpt.beat ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-extrabold text-foreground">{rpt.quarter}</span>
                              <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${rpt.beat ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                {rpt.beat ? '✅ BEAT' : '❌ MISS'} {rpt.surprisePct > 0 ? '+' : ''}{rpt.surprisePct}%
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <div className="bg-muted rounded-xl p-2.5">
                                <p className="text-[10px] text-muted-foreground font-bold mb-0.5">Revenue</p>
                                <p className="text-xs font-extrabold text-foreground">${rpt.revActual}B</p>
                                <p className="text-[10px] text-muted-foreground">est ${rpt.revEst}B</p>
                              </div>
                              <div className="bg-muted rounded-xl p-2.5">
                                <p className="text-[10px] text-muted-foreground font-bold mb-0.5">EPS</p>
                                <p className="text-xs font-extrabold text-foreground">${rpt.epsActual}</p>
                                <p className="text-[10px] text-muted-foreground">est ${rpt.epsEst}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span>{guidanceIcon(rpt.guidance)}</span>
                              <span className="text-[10px] text-muted-foreground">Guidance: <span className="font-bold text-foreground">{guidanceLabel(rpt.guidance)}</span></span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center mt-2">New earnings auto-fire for your held stocks every ~60–90 sec</p>
                    </div>
                  )}

                  {ra.type === 'crypto' && (
                    <div className="bg-muted/40 border border-border rounded-2xl p-4 text-center">
                      <p className="text-2xl mb-2">₿</p>
                      <p className="text-sm font-bold text-foreground">Crypto doesn't report earnings</p>
                      <p className="text-xs text-muted-foreground mt-1">Crypto is driven by sentiment, adoption, and macro trends — not quarterly reports or dividends.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })()}

        {/* ─── LEADERBOARD ─── */}
        {tab === 'leaderboard' && (
          <motion.div key="leaderboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="px-4 pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-extrabold text-foreground">Portfolio Leaderboard</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">All-time rankings by total portfolio value</p>

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
                leaderboard.length === 0 ? (
                  <div className="border-2 border-dashed border-border rounded-2xl py-8 text-center">
                    <p className="text-3xl mb-2">🌍</p>
                    <p className="text-sm font-extrabold text-foreground">You're first in line</p>
                    <p className="text-xs text-muted-foreground mt-1">Real players will appear here as they build their portfolios.</p>
                  </div>
                ) :
                rankedList.map((player, i) => {
                  const country = getCountryByCode(player.countryCode);
                  return (
                    <div key={player.id} className={`flex items-center gap-3 rounded-2xl px-4 py-3 border ${player.isMe ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/30' : 'bg-card border-border'}`}>
                      <div className="w-7 text-center shrink-0">
                        {i === 0 ? <Crown className="w-5 h-5 text-amber-400 mx-auto" />
                          : i === 1 ? <span className="text-sm">🥈</span>
                          : i === 2 ? <span className="text-sm">🥉</span>
                          : <span className={`text-xs font-extrabold ${player.isMe ? 'text-primary' : 'text-muted-foreground'}`}>#{i + 1}</span>}
                      </div>
                      <span className="text-xl shrink-0">{player.avatar}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-sm font-extrabold truncate ${player.isMe ? 'text-primary' : 'text-foreground'}`}>{player.isMe ? 'You' : player.name}</p>
                          {player.isMe
                            ? <span className="text-[10px] bg-primary/20 text-primary font-bold px-1.5 py-0.5 rounded-full">YOU</span>
                            : <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded-full">LIVE</span>}
                          {country && <span className="text-sm">{country.flag}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-extrabold text-foreground">${player.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
          <ChartModal
            asset={tradeAsset}
            price={prices[tradeAsset.id]?.price ?? 0}
            cash={cash}
            holding={holdings.find(h => h.assetId === tradeAsset.id)}
            shortPos={(portfolio?.shorts ?? []).find(s => s.assetId === tradeAsset.id)}
            onClose={() => setTradeAsset(null)}
            onTrade={handleTrade}
            marketStatus={marketStatus}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {milestone && (
          <MilestoneModal
            milestone={milestone}
            onClose={() => setMilestone(null)}
            onShare={m => {
              const text = `🏆 I just hit the "${m.label}" milestone on Monelingo! My portfolio is growing 📈\nhttps://monelingo.vercel.app`;
              navigator.share ? navigator.share({ text }) : navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard!'));
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showIntro && <SectionIntro section="portfolio" onDismiss={dismissIntro} />}
      </AnimatePresence>

      {/* Earnings center-screen modal */}
      <AnimatePresence>
        {earningsModal && (
          <EarningsModal data={earningsModal} onClose={() => setEarningsModal(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
