import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { CITIES, getCityById, getCityAssets, getAssetById, assetPrice, monthlyRent, cityTrend, currentGameMonth, MIN_DOWN_PCT, MORTGAGE_RATES, monthlyPayment } from '@/lib/realEstateData';
import { fetchWorldOwnership, ownedCountsByCity, buyProperty, sellProperty, collectRent, pendingRent, settleMyProperties, myRealEstateEquity } from '@/lib/realEstateEngine';
import { getPortfolio } from '@/lib/tradeActions';
import { getCountryByCode } from '@/lib/countryData';
import marketSim from '@/lib/marketSim';
import { toast } from 'sonner';

// ── Per-city visual identity for the SimCity map ────────────────────────────
const CITY_THEMES = {
  lagos:    { sky: ['#fbbf24', '#f97316'], ground: '#b45309', tile: '#d97706', edge: '#92400e', skyline: '🌴🏚️🏢🌴🛖🏢🌴', scenery: ['🌴', '🚌', '🌴'] },
  jakarta:  { sky: ['#fde68a', '#34d399'], ground: '#047857', tile: '#059669', edge: '#065f46', skyline: '🌴🏙️🕌🏢🌴🏢', scenery: ['🌴', '🛵', '🌺'] },
  mumbai:   { sky: ['#fed7aa', '#fb923c'], ground: '#9a3412', tile: '#c2410c', edge: '#7c2d12', skyline: '🕌🏢🏛️🏢🌴🏢', scenery: ['🛺', '🌴', '🐄'] },
  mexico:   { sky: ['#fef3c7', '#f59e0b'], ground: '#b45309', tile: '#d97706', edge: '#78350f', skyline: '🏜️⛰️🏛️🏢🌵', scenery: ['🌵', '💀', '🌮'] },
  saopaulo: { sky: ['#bbf7d0', '#22c55e'], ground: '#15803d', tile: '#16a34a', edge: '#14532d', skyline: '🏙️🌳🏢🏢🌳🏢', scenery: ['🌳', '⚽', '🦜'] },
  warsaw:   { sky: ['#e2e8f0', '#94a3b8'], ground: '#475569', tile: '#64748b', edge: '#334155', skyline: '🏰🏢⛪🏢🌲', scenery: ['🌲', '🏰', '❄️'] },
  seoul:    { sky: ['#c4b5fd', '#8b5cf6'], ground: '#5b21b6', tile: '#7c3aed', edge: '#4c1d95', skyline: '🌸🏯🏙️📡🏢', scenery: ['🌸', '🏮', '📱'] },
  berlin:   { sky: ['#d1d5db', '#9ca3af'], ground: '#4b5563', tile: '#6b7280', edge: '#374151', skyline: '📡🏛️🏢🧱🏢', scenery: ['🌳', '🧸', '🎧'] },
  madrid:   { sky: ['#fef9c3', '#fbbf24'], ground: '#a16207', tile: '#ca8a04', edge: '#854d0e', skyline: '🏛️⛪🏢🌇🏟️', scenery: ['☀️', '🥘', '💃'] },
  toronto:  { sky: ['#bfdbfe', '#60a5fa'], ground: '#1e40af', tile: '#2563eb', edge: '#1e3a8a', skyline: '🗼🏙️🏢🍁🏢', scenery: ['🍁', '🏒', '🦫'] },
  dublin:   { sky: ['#d9f99d', '#4ade80'], ground: '#166534', tile: '#15803d', edge: '#14532d', skyline: '⛪🏰🏢🌉🍺', scenery: ['☘️', '🐑', '🌈'] },
  tokyo:    { sky: ['#fbcfe8', '#f472b6'], ground: '#9d174d', tile: '#be185d', edge: '#831843', skyline: '🗼🌸🏯🏙️🗻', scenery: ['🌸', '🏮', '🍜'] },
  sydney:   { sky: ['#a5f3fc', '#22d3ee'], ground: '#0e7490', tile: '#0891b2', edge: '#155e75', skyline: '🎭🌉🏙️🌊🏄', scenery: ['🌊', '🐨', '🏄'] },
  london:   { sky: ['#cbd5e1', '#64748b'], ground: '#334155', tile: '#475569', edge: '#1e293b', skyline: '🎡🏰🕰️🏙️☂️', scenery: ['☂️', '💂', '🚌'] },
  nyc:      { sky: ['#fda4af', '#6366f1'], ground: '#312e81', tile: '#4338ca', edge: '#1e1b4b', skyline: '🗽🏙️🌆🏙️🌉', scenery: ['🚕', '🗽', '🥨'] },
};

// Isometric tile slots (10 assets: 9 archetypes + landmark center)
const SLOTS = [
  [90, 118], [180, 108], [270, 118],
  [50, 168], [310, 168],
  [88, 222], [272, 222],
  [140, 262], [220, 262],
  [180, 178], // landmark — center stage
];
const SCENERY_POS = [[26, 145], [334, 140], [30, 265], [330, 268], [180, 305], [120, 300]];

function CityMap({ city, assets, world, ownedCounts, myFlag, onTap }) {
  const t = CITY_THEMES[city.id] ?? CITY_THEMES.dublin;
  // paint back-to-front so front buildings overlap correctly
  const order = assets.map((a, i) => ({ a, slot: SLOTS[i] })).sort((x, y) => x.slot[1] - y.slot[1]);
  return (
    <svg viewBox="0 0 360 330" className="w-full rounded-2xl border border-border" style={{ background: t.ground }}>
      <defs>
        <linearGradient id={`sky-${city.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={t.sky[0]} /><stop offset="100%" stopColor={t.sky[1]} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="360" height="96" fill={`url(#sky-${city.id})`} />
      <text x="180" y="90" textAnchor="middle" fontSize="20" opacity="0.9">{t.skyline}</text>

      {SCENERY_POS.map(([x, y], i) => (
        <text key={i} x={x} y={y} textAnchor="middle" fontSize="14" opacity="0.8">{t.scenery[i % t.scenery.length]}</text>
      ))}

      {order.map(({ a, slot: [cx, cy] }) => {
        const rec = world[a.id];
        const price = assetPrice(a, ownedCounts);
        const big = a.landmark;
        const w = big ? 46 : 38, h = big ? 23 : 19;
        const flag = rec ? (rec.mine ? (myFlag ?? '🚩') : (getCountryByCode(rec.ownerCountry)?.flag ?? '🚩')) : null;
        const ownerLabel = rec ? (rec.mine ? 'You' : (rec.ownerName ?? 'Taken').slice(0, 10)) : null;
        return (
          <g key={a.id} onClick={() => onTap(a)} style={{ cursor: 'pointer' }}>
            {/* tile */}
            <path d={`M ${cx} ${cy - h} L ${cx + w} ${cy} L ${cx} ${cy + h} L ${cx - w} ${cy} Z`}
              fill={t.tile} stroke={rec?.mine ? '#fbbf24' : t.edge} strokeWidth={rec?.mine ? 2.5 : 1.5} />
            {/* building */}
            <text x={cx} y={cy - (big ? 8 : 5)} textAnchor="middle" fontSize={big ? 40 : 28}>{a.emoji}</text>
            {big && <text x={cx} y={cy - 48} textAnchor="middle" fontSize="12">👑</text>}
            {/* owner flag on a pole */}
            {flag && (
              <>
                <line x1={cx + (big ? 20 : 16)} y1={cy - (big ? 40 : 30)} x2={cx + (big ? 20 : 16)} y2={cy - (big ? 18 : 12)} stroke="#e5e7eb" strokeWidth="1.5" />
                <text x={cx + (big ? 27 : 23)} y={cy - (big ? 34 : 25)} textAnchor="middle" fontSize="12">{flag}</text>
              </>
            )}
            {/* price / owner banner */}
            <rect x={cx - 30} y={cy + h + 2} width="60" height="13" rx="4"
              fill={rec ? (rec.mine ? '#b45309' : '#111827') : '#111827'} opacity="0.85" />
            <text x={cx} y={cy + h + 11.5} textAnchor="middle" fontSize="8.5" fontWeight="700"
              fill={rec ? (rec.mine ? '#fde68a' : '#c4b5fd') : '#fff'}>
              {rec ? `${flag} ${ownerLabel}` : fmtK(price)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const fmt = n => '$' + Math.round(n).toLocaleString();
const fmtK = n => n >= 1e6 ? `$${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M` : n >= 1e3 ? `$${Math.round(n / 1e3)}k` : fmt(n);

// ── Canvas globe (orthographic, drag to spin, tap a city) ───────────────────
function Globe({ onPickCity }) {
  const canvasRef = useRef(null);
  const state = useRef({ rot: -20, vel: 0.15, dragging: false, lastX: 0, hits: [] });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (canvas.width !== w * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const s = state.current;
      if (!s.dragging) s.rot += s.vel;

      const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 28;
      ctx.clearRect(0, 0, w, h);

      // stars
      for (let i = 0; i < 40; i++) {
        const sx = ((i * 137.5) % w), sy = ((i * 89.3) % h);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(sx, sy, 1.2, 1.2);
      }

      // sphere
      const grad = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      grad.addColorStop(0, '#1e3a8a'); grad.addColorStop(0.7, '#172554'); grad.addColorStop(1, '#0b1120');
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
      ctx.strokeStyle = 'rgba(96,165,250,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();

      // graticule
      ctx.strokeStyle = 'rgba(96,165,250,0.13)'; ctx.lineWidth = 1;
      for (let lat = -60; lat <= 60; lat += 30) {
        const ry = R * Math.cos(lat * Math.PI / 180), yy = cy - R * Math.sin(lat * Math.PI / 180);
        ctx.beginPath(); ctx.ellipse(cx, yy, ry, ry * 0.22, 0, 0, Math.PI * 2); ctx.stroke();
      }
      for (let i = 0; i < 6; i++) {
        const lng = (s.rot + i * 30) * Math.PI / 180;
        ctx.beginPath(); ctx.ellipse(cx, cy, Math.abs(R * Math.sin(lng)), R, 0, 0, Math.PI * 2); ctx.stroke();
      }

      // city pins
      s.hits = [];
      CITIES.forEach(c => {
        const lat = c.lat * Math.PI / 180, lng = (c.lng + s.rot) * Math.PI / 180;
        const x = Math.cos(lat) * Math.sin(lng), y = Math.sin(lat), z = Math.cos(lat) * Math.cos(lng);
        if (z < 0.05) return; // back of the globe
        const px = cx + R * x, py = cy - R * y;
        const trend = cityTrend(c.id);
        const glow = trend.dir > 0 ? '#f59e0b' : trend.dir < 0 ? '#38bdf8' : '#a3e635';
        ctx.beginPath(); ctx.arc(px, py, 10 + z * 3, 0, Math.PI * 2);
        ctx.fillStyle = glow + '33'; ctx.fill();
        ctx.beginPath(); ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = glow; ctx.fill();
        ctx.font = 'bold 10px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.textAlign = 'center';
        ctx.fillText(`${c.flag} ${c.name}`, px, py - 12);
        s.hits.push({ id: c.id, x: px, y: py });
      });

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  const pos = e => {
    const r = canvasRef.current.getBoundingClientRect();
    const t = e.touches?.[0] ?? e;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };

  const onDown = e => { const s = state.current; s.dragging = true; s.moved = 0; s.lastX = pos(e).x; };
  const onMove = e => {
    const s = state.current;
    if (!s.dragging) return;
    const x = pos(e).x;
    s.rot += (x - s.lastX) * 0.4; s.moved += Math.abs(x - s.lastX); s.lastX = x;
  };
  const onUp = e => {
    const s = state.current;
    s.dragging = false;
    if (s.moved > 6) return; // was a drag, not a tap
    const { x, y } = pos(e.changedTouches ? e.changedTouches[0] : e);
    const hit = s.hits.find(h => Math.hypot(h.x - x, h.y - y) < 22);
    if (hit) onPickCity(hit.id);
  };

  return (
    <canvas ref={canvasRef} className="w-full h-[380px] touch-none cursor-grab active:cursor-grabbing"
      onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={() => (state.current.dragging = false)}
      onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp} />
  );
}

// ── Buy sheet ────────────────────────────────────────────────────────────────
function BuySheet({ asset, ownedCounts, onClose, onBought }) {
  const price = assetPrice(asset, ownedCounts);
  const rent = monthlyRent(asset, ownedCounts);
  const cash = getPortfolio().cash ?? 0;
  const [downPct, setDownPct] = useState(cash >= price ? 1 : 0.2);
  const [term, setTerm] = useState(60);
  const [busy, setBusy] = useState(false);

  const down = Math.round(price * downPct);
  const financed = price - down;
  const payment = financed > 0 ? Math.round(monthlyPayment(financed, MORTGAGE_RATES[term], term)) : 0;
  const canAfford = down <= cash;

  async function confirm() {
    setBusy(true);
    const r = await buyProperty(asset.id, { downPct, term }, ownedCounts);
    setBusy(false);
    if (r.ok) { toast.success(`🔑 You bought ${asset.name}!`); onBought(); }
    else toast.error(r.error);
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed bottom-0 left-0 right-0 z-[70] bg-card rounded-t-3xl p-5 pb-8 max-w-lg mx-auto">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-2xl">{asset.emoji} <span className="text-lg font-black text-foreground align-middle">{asset.name}</span></p>
            <p className="text-xs text-muted-foreground mt-0.5">{asset.label} · earns {fmt(rent)}/mo rent</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <p className="text-3xl font-black text-foreground my-3">{fmtK(price)}</p>

        {/* Down payment */}
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1.5">Down payment · {Math.round(downPct * 100)}% = {fmtK(down)}</p>
        <input type="range" min={MIN_DOWN_PCT * 100} max={100} step={5} value={downPct * 100}
          onChange={e => setDownPct(Number(e.target.value) / 100)} className="w-full accent-emerald-500 mb-3" />

        {financed > 0 && (
          <div className="bg-muted rounded-xl p-3 mb-3">
            <div className="flex gap-2 mb-2">
              {[60, 120].map(t => (
                <button key={t} onClick={() => setTerm(t)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold ${term === t ? 'bg-foreground text-background' : 'bg-card text-muted-foreground'}`}>
                  {t} months · {(MORTGAGE_RATES[t] * 100).toFixed(1)}%
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Borrowing <b className="text-foreground">{fmtK(financed)}</b> · repay <b className="text-foreground">{fmt(payment)}/mo</b> auto-deducted each game month (1 real week).
              Rent covers {payment > 0 ? Math.round((rent / payment) * 100) : 0}% of it.
            </p>
            <p className="text-[11px] text-amber-500 font-bold mt-1.5">⚠️ Can't pay? Your stocks get sold as collateral. 3 missed months = repossession.</p>
          </div>
        )}

        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-3">
          <span>Your cash: <span className={cash >= down ? 'text-emerald-500' : 'text-rose-500'}>{fmtK(cash)}</span></span>
          <span>Net cash flow: <span className={rent - payment >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{fmt(rent - payment)}/mo</span></span>
        </div>

        <button onClick={confirm} disabled={!canAfford || busy}
          className="w-full h-13 py-4 rounded-xl bg-emerald-600 text-white font-extrabold text-sm active:scale-95 transition-all disabled:opacity-40">
          {busy ? 'Signing contracts…' : !canAfford ? `Need ${fmtK(down)} down — not enough cash` : financed > 0 ? `Buy with mortgage — ${fmtK(down)} down` : `Buy outright — ${fmtK(price)}`}
        </button>
      </motion.div>
    </>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function RealEstate() {
  const [world, setWorld] = useState({});
  const [cityId, setCityId] = useState(null);
  const [buyAsset, setBuyAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, force] = useState(0);

  const refresh = useCallback(async () => {
    const w = await fetchWorldOwnership();
    const events = await settleMyProperties(w);
    events.forEach(ev => {
      if (ev.type === 'liquidated') toast.warning(`🏦 ${ev.detail}`);
      if (ev.type === 'strike') toast.error(`⚠️ Missed mortgage payment (${ev.strikes}/3) on ${getAssetById(ev.assetId)?.name}`);
      if (ev.type === 'repossessed') toast.error(`🏚️ ${getAssetById(ev.assetId)?.name} was repossessed by the bank`);
    });
    setWorld({ ...w });
    // Cache equity so the Portfolio page can fold it into net worth
    localStorage.setItem('wq_re_equity', String(myRealEstateEquity(w, ownedCountsByCity(w))));
    setLoading(false);
  }, []);

  useEffect(() => { marketSim.init(); refresh(); }, [refresh]);

  const ownedCounts = useMemo(() => ownedCountsByCity(world), [world]);
  const mine = useMemo(() => Object.values(world).filter(r => r.mine), [world]);
  const equity = myRealEstateEquity(world, ownedCounts);
  const totalRentDue = mine.reduce((s, r) => s + pendingRent(r, ownedCounts), 0);
  const monthlyFlow = mine.reduce((s, r) => {
    const a = getAssetById(r.assetId);
    return s + (a ? monthlyRent(a, ownedCounts) : 0) - (r.mortgage?.payment ?? 0);
  }, 0);
  const cash = getPortfolio().cash ?? 0;

  async function handleCollectAll() {
    let total = 0;
    for (const r of mine) {
      const res = await collectRent(r.assetId, world, ownedCounts);
      if (res.ok) total += res.amount;
    }
    if (total > 0) { toast.success(`💰 Collected ${fmt(total)} rent!`); refresh(); }
    else toast('No rent due yet — rent lands every game month (1 real week)');
  }

  async function handleSell(assetId) {
    const r = await sellProperty(assetId, world, ownedCounts);
    if (r.ok) { toast.success(`Sold for ${fmtK(r.price)} — ${fmtK(r.proceeds)} after fees & mortgage`); refresh(); }
    else toast.error(r.error);
  }

  const city = cityId ? getCityById(cityId) : null;

  return (
    <div className="min-h-screen bg-background pb-28 max-w-lg mx-auto">
      {/* Header strip */}
      <div className="px-4 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-foreground">🌍 Real Estate</h1>
            <p className="text-xs text-muted-foreground">Game month {currentGameMonth() + 1} · 1 real week = 1 month</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">My equity</p>
            <p className="text-lg font-black text-emerald-500">{fmtK(equity)}</p>
          </div>
        </div>

        {/* Empire strip */}
        {mine.length > 0 && (
          <div className="mt-3 bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs font-extrabold text-foreground">{mine.length} propert{mine.length === 1 ? 'y' : 'ies'} · net flow <span className={monthlyFlow >= 0 ? 'text-emerald-500' : 'text-rose-500'}>{fmt(monthlyFlow)}/mo</span></p>
              <p className="text-[11px] text-muted-foreground">Cash {fmtK(cash)}{mine.some(r => (r.mortgage?.strikes ?? 0) > 0) && <span className="text-rose-500 font-bold"> · ⚠️ payments in arrears!</span>}</p>
            </div>
            <button onClick={handleCollectAll}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-extrabold active:scale-95 transition-all ${totalRentDue > 0 ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}>
              💰 Collect {totalRentDue > 0 ? fmt(totalRentDue) : 'rent'}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!city ? (
          /* ── GLOBE ── */
          <motion.div key="globe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Globe onPickCity={setCityId} />
            <p className="text-center text-[11px] font-bold text-muted-foreground -mt-2 mb-3">Spin the globe · tap a city to invest</p>
            <div className="px-4 grid grid-cols-3 gap-1.5">
              {CITIES.map(c => {
                const t = cityTrend(c.id);
                return (
                  <button key={c.id} onClick={() => setCityId(c.id)}
                    className="bg-card border border-border rounded-xl px-2 py-2 text-left active:scale-95 transition-all">
                    <p className="text-xs font-extrabold text-foreground truncate">{c.flag} {c.name}</p>
                    <p className={`text-[10px] font-bold ${t.dir > 0 ? 'text-amber-500' : t.dir < 0 ? 'text-sky-400' : 'text-muted-foreground'}`}>
                      {t.emoji} {t.label} {t.pct >= 0 ? '+' : ''}{t.pct.toFixed(1)}%
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          /* ── CITY VIEW ── */
          <motion.div key={cityId} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="px-4">
            <button onClick={() => setCityId(null)} className="flex items-center gap-1 text-xs font-bold text-muted-foreground mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Globe
            </button>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-2xl font-black text-foreground">{city.flag} {city.name}</h2>
              {(() => { const t = cityTrend(city.id); return (
                <span className={`text-xs font-extrabold px-2 py-1 rounded-lg ${t.dir > 0 ? 'bg-amber-500/15 text-amber-500' : t.dir < 0 ? 'bg-sky-500/15 text-sky-400' : 'bg-muted text-muted-foreground'}`}>
                  {t.emoji} {t.label} {t.pct >= 0 ? '+' : ''}{t.pct.toFixed(1)}%/mo
                </span>
              ); })()}
            </div>
            <p className="text-xs text-muted-foreground mb-1">{city.vibe}</p>
            <p className="text-[11px] font-bold text-muted-foreground mb-3">
              {ownedCounts[city.id] ?? 0}/10 owned by players{(ownedCounts[city.id] ?? 0) >= 5 ? ' · 📈 high demand is pushing prices up' : ''}
            </p>

            <CityMap
              city={city}
              assets={getCityAssets(city.id)}
              world={world}
              ownedCounts={ownedCounts}
              myFlag={getCountryByCode(localStorage.getItem('wealthquest_country'))?.flag}
              onTap={a => {
                const rec = world[a.id];
                if (!rec) { setBuyAsset(a); return; }
                if (rec.mine) {
                  const m = rec.mortgage;
                  const info = m ? ` Mortgage: ${fmtK(m.remaining)} left at ${fmt(m.payment)}/mo.` : '';
                  if (confirm(`${a.emoji} ${a.name} — sell at market value?${info} 5% agent fee, mortgage repaid from proceeds.`)) handleSell(a.id);
                  return;
                }
                toast(`🔒 ${a.name} is owned by ${rec.ownerName ?? 'another investor'}`);
              }}
            />
            <p className="text-center text-[11px] font-bold text-muted-foreground mt-2">
              Tap a building — 💰 price to buy · 🚩 flag = owned · gold tile = yours
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buy sheet — no AnimatePresence: BuySheet returns a fragment of two
          motion divs, which crashes PresenceChild on exit */}
      {buyAsset && (
        <BuySheet asset={buyAsset} ownedCounts={ownedCounts}
          onClose={() => setBuyAsset(null)}
          onBought={() => { setBuyAsset(null); refresh(); }} />
      )}
    </div>
  );
}
