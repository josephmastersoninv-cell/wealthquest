import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { CITIES, getCityById, getCityAssets, getAssetById, assetPrice, monthlyRent, cityTrend, currentGameMonth, MIN_DOWN_PCT, MORTGAGE_RATES, monthlyPayment } from '@/lib/realEstateData';
import { fetchWorldOwnership, ownedCountsByCity, buyProperty, sellProperty, collectRent, pendingRent, settleMyProperties, myRealEstateEquity } from '@/lib/realEstateEngine';
import { getPortfolio } from '@/lib/tradeActions';
import { getCountryByCode } from '@/lib/countryData';
import marketSim from '@/lib/marketSim';
import { toast } from 'sonner';

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

      for (let i = 0; i < 40; i++) {
        const sx = ((i * 137.5) % w), sy = ((i * 89.3) % h);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(sx, sy, 1.2, 1.2);
      }

      const grad = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      grad.addColorStop(0, '#1e3a8a'); grad.addColorStop(0.7, '#172554'); grad.addColorStop(1, '#0b1120');
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
      ctx.strokeStyle = 'rgba(96,165,250,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();

      ctx.strokeStyle = 'rgba(96,165,250,0.13)'; ctx.lineWidth = 1;
      for (let lat = -60; lat <= 60; lat += 30) {
        const ry = R * Math.cos(lat * Math.PI / 180), yy = cy - R * Math.sin(lat * Math.PI / 180);
        ctx.beginPath(); ctx.ellipse(cx, yy, ry, ry * 0.22, 0, 0, Math.PI * 2); ctx.stroke();
      }
      for (let i = 0; i < 6; i++) {
        const lng = (s.rot + i * 30) * Math.PI / 180;
        ctx.beginPath(); ctx.ellipse(cx, cy, Math.abs(R * Math.sin(lng)), R, 0, 0, Math.PI * 2); ctx.stroke();
      }

      s.hits = [];
      CITIES.forEach(c => {
        const lat = c.lat * Math.PI / 180, lng = (c.lng + s.rot) * Math.PI / 180;
        const x = Math.cos(lat) * Math.sin(lng), y = Math.sin(lat), z = Math.cos(lat) * Math.cos(lng);
        if (z < 0.05) return;
        const px = cx + R * x, py = cy - R * y;
        const trend = cityTrend(c.id);
        const glow = trend.dir > 0 ? '#f59e0b' : trend.dir < 0 ? '#38bdf8' : '#a3e635';
        ctx.beginPath(); ctx.arc(px, py, 10 + z * 3, 0, Math.PI * 2);
        ctx.fillStyle = glow + '33'; ctx.fill();
        ctx.beginPath(); ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = glow; ctx.fill();
        ctx.font = 'bold 10px sans-serif, "Noto Color Emoji"'; ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.textAlign = 'center';
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
    if (s.moved > 6) return;
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

// ── Per-city visual identity for the city map ───────────────────────────────
const CITY_THEMES = {
  lagos:    { sky: ['#fcd34d', '#f97316'], ground: '#a16207', parcel: '#ca8a04', bld: ['#f5f0e8', '#e7d8c9', '#d4a373', '#fef3c7'], win: '#7c2d12', night: false },
  jakarta:  { sky: ['#fde68a', '#34d399'], ground: '#047857', parcel: '#059669', bld: ['#f1f5f9', '#e2e8f0', '#fda4af', '#fef9c3'], win: '#134e4a', night: false },
  mumbai:   { sky: ['#fed7aa', '#fb923c'], ground: '#9a3412', parcel: '#c2410c', bld: ['#fef3c7', '#fde68a', '#f8fafc', '#fecaca'], win: '#7c2d12', night: false },
  mexico:   { sky: ['#fef3c7', '#f59e0b'], ground: '#92400e', parcel: '#b45309', bld: ['#fecaca', '#fdba74', '#fef08a', '#f5f5f4'], win: '#78350f', night: false },
  saopaulo: { sky: ['#bbf7d0', '#22c55e'], ground: '#166534', parcel: '#15803d', bld: ['#e5e7eb', '#cbd5e1', '#f8fafc', '#d9f99d'], win: '#14532d', night: false },
  warsaw:   { sky: ['#e2e8f0', '#94a3b8'], ground: '#475569', parcel: '#64748b', bld: ['#f1f5f9', '#e2e8f0', '#fca5a5', '#cbd5e1'], win: '#1e293b', night: false },
  seoul:    { sky: ['#312e81', '#a855f7'], ground: '#3b0764', parcel: '#581c87', bld: ['#e0e7ff', '#c7d2fe', '#f5d0fe', '#ddd6fe'], win: '#fbbf24', night: true },
  berlin:   { sky: ['#d1d5db', '#9ca3af'], ground: '#44403c', parcel: '#57534e', bld: ['#f5f5f4', '#e7e5e4', '#fbbf24', '#d6d3d1'], win: '#292524', night: false },
  madrid:   { sky: ['#fef9c3', '#fbbf24'], ground: '#a16207', parcel: '#ca8a04', bld: ['#fef3c7', '#fed7aa', '#f5f5f4', '#fecaca'], win: '#713f12', night: false },
  toronto:  { sky: ['#bfdbfe', '#60a5fa'], ground: '#1e3a8a', parcel: '#1d4ed8', bld: ['#e0f2fe', '#bae6fd', '#f8fafc', '#c7d2fe'], win: '#0c4a6e', night: false },
  dublin:   { sky: ['#d9f99d', '#4ade80'], ground: '#14532d', parcel: '#166534', bld: ['#fef3c7', '#f5f5f4', '#fca5a5', '#e7e5e4'], win: '#14532d', night: false },
  tokyo:    { sky: ['#fbcfe8', '#f472b6'], ground: '#831843', parcel: '#9d174d', bld: ['#fdf2f8', '#fce7f3', '#e0e7ff', '#f5f5f4'], win: '#500724', night: false },
  sydney:   { sky: ['#a5f3fc', '#22d3ee'], ground: '#155e75', parcel: '#0e7490', bld: ['#ecfeff', '#cffafe', '#fef9c3', '#f8fafc'], win: '#164e63', night: false },
  london:   { sky: ['#cbd5e1', '#64748b'], ground: '#1e293b', parcel: '#334155', bld: ['#e2e8f0', '#cbd5e1', '#fca5a5', '#f1f5f9'], win: '#fbbf24', night: true },
  nyc:      { sky: ['#1e1b4b', '#f43f5e'], ground: '#1e1b4b', parcel: '#312e81', bld: ['#c7d2fe', '#a5b4fc', '#e0e7ff', '#cbd5e1'], win: '#fbbf24', night: true },
};

// ── Iso helpers ──────────────────────────────────────────────────────────────
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = v => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${ch((n >> 16) & 255)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}
const P = arr => arr.map(p => p.join(',')).join(' ');

// One extruded isometric building: shaded box + lit window bands + roof
function IsoBuilding({ cx, cy, w, H, base, win, floors = 0, roof = null, accent = null }) {
  const h2 = w / 2;
  const top   = [[cx, cy - h2 - H], [cx + w, cy - H], [cx, cy + h2 - H], [cx - w, cy - H]];
  const left  = [[cx - w, cy], [cx, cy + h2], [cx, cy + h2 - H], [cx - w, cy - H]];
  const right = [[cx, cy + h2], [cx + w, cy], [cx + w, cy - H], [cx, cy + h2 - H]];

  const bands = [];
  const nb = Math.min(floors, Math.floor((H - 8) / 9));
  for (let i = 0; i < nb; i++) {
    const t = 6 + i * 9;
    // left-face band (parallel to its bottom edge), then right-face band
    bands.push(<polygon key={`l${i}`} points={P([[cx - w + 2.5, cy + 1 - t], [cx - 2.5, cy + h2 - 1 - t], [cx - 2.5, cy + h2 - 5.5 - t], [cx - w + 2.5, cy - 4.5 - t]])} fill={win} opacity="0.9" />);
    bands.push(<polygon key={`r${i}`} points={P([[cx + 2.5, cy + h2 - 1 - t], [cx + w - 2.5, cy + 1 - t], [cx + w - 2.5, cy - 4.5 - t], [cx + 2.5, cy + h2 - 5.5 - t]])} fill={win} opacity="0.65" />);
  }

  let roofEl = null;
  if (roof === 'pitch') {
    const A = [cx, cy - H - w * 0.55];
    const rc = accent ?? '#b91c1c';
    roofEl = <>
      <polygon points={P([top[3], top[0], A])} fill={shade(rc, 1.2)} />
      <polygon points={P([top[3], top[2], A])} fill={rc} />
      <polygon points={P([top[2], top[1], A])} fill={shade(rc, 0.7)} />
    </>;
  } else if (roof === 'spire') {
    const A = [cx, cy - H - 30];
    roofEl = <>
      <polygon points={P([top[3], top[2], A])} fill={shade(base, 1.05)} />
      <polygon points={P([top[2], top[1], A])} fill={shade(base, 0.6)} />
      <circle cx={cx} cy={cy - H - 32} r="2.2" fill="#fbbf24" />
    </>;
  }

  return (
    <>
      <polygon points={P(left)}  fill={base} />
      <polygon points={P(right)} fill={shade(base, 0.68)} />
      {bands}
      {accent && !roof && <>
        <polygon points={P([[cx - w, cy - H + 7], [cx, cy + h2 - H + 7], [cx, cy + h2 - H + 1], [cx - w, cy - H + 1]])} fill={accent} />
        <polygon points={P([[cx, cy + h2 - H + 7], [cx + w, cy - H + 7], [cx + w, cy - H + 1], [cx, cy + h2 - H + 1]])} fill={shade(accent, 0.7)} />
      </>}
      <polygon points={P(top)} fill={shade(base, 1.3)} stroke={shade(base, 0.85)} strokeWidth="0.5" />
      {roofEl}
    </>
  );
}

// Building silhouette specs per archetype slot order (matches getCityAssets)
const BLD_SPECS = [
  { w: 15, H: 13, floors: 1 },                       // studio
  { w: 17, H: 34, floors: 3 },                       // apartment
  { w: 17, H: 13, roof: 'pitch' },                   // house
  { w: 19, H: 20, floors: 2, roof: 'pitch' },        // townhouse
  { w: 15, H: 12, accent: '#dc2626' },               // cafe (awning)
  { w: 18, H: 14, accent: '#2563eb' },               // shop (sign band)
  { w: 23, H: 13, floors: 1, accent: '#16a34a' },    // school
  { w: 18, H: 46, floors: 5 },                       // office
  { w: 19, H: 38, floors: 4, accent: '#7c3aed' },    // hotel
  { w: 21, H: 56, floors: 6, roof: 'spire' },        // landmark
];

const SLOTS = [
  [92, 128], [180, 112], [268, 128],
  [52, 178], [308, 178],
  [90, 232], [270, 232],
  [140, 272], [220, 272],
  [180, 192], // landmark — center stage
];
const ROADS = [[0, 1], [1, 2], [0, 3], [2, 4], [3, 5], [4, 6], [5, 7], [6, 8], [7, 8], [1, 9], [9, 7], [9, 8]];
const TREES = [[30, 152], [334, 150], [36, 266], [326, 270], [66, 304], [296, 306]];

function Tree({ x, y, c }) {
  return <g>
    <rect x={x - 1} y={y - 5} width="2" height="5" fill="#78350f" />
    <circle cx={x} cy={y - 8} r="4.5" fill={c} />
    <circle cx={x - 3} cy={y - 5.5} r="3" fill={shade(c, 0.85)} />
  </g>;
}

function CityMap({ city, assets, world, ownedCounts, myFlag, onTap }) {
  const t = CITY_THEMES[city.id] ?? CITY_THEMES.dublin;
  const treeC = shade(t.parcel, 1.35);
  // procedural skyline silhouette
  const sky = [];
  for (let i = 0; i < 12; i++) {
    const hgt = 10 + ((city.id.charCodeAt(i % city.id.length) * (i + 3)) % 24);
    sky.push(<rect key={i} x={i * 31 - 4} y={92 - hgt} width="20" height={hgt} rx="1.5" fill={shade(t.ground, 0.55)} opacity="0.9" />);
    if (t.night) sky.push(<rect key={`w${i}`} x={i * 31 + 1} y={97 - hgt} width="3" height="3" fill={t.win} opacity="0.8" />);
  }
  const order = assets.map((a, i) => ({ a, spec: BLD_SPECS[i] ?? BLD_SPECS[0], slot: SLOTS[i] ?? SLOTS[0], idx: i }))
    .sort((x, y) => x.slot[1] - y.slot[1]);

  return (
    <svg viewBox="0 0 360 340" className="w-full rounded-2xl border border-border select-none" style={{ background: t.ground }}>
      <defs>
        <linearGradient id={`sky-${city.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={t.sky[0]} /><stop offset="100%" stopColor={t.sky[1]} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="360" height="92" fill={`url(#sky-${city.id})`} />
      {t.night
        ? <>{[...Array(14)].map((_, i) => <circle key={i} cx={(i * 47 + 13) % 360} cy={(i * 29) % 70 + 6} r="0.9" fill="#fff" opacity="0.8" />)}<circle cx="312" cy="26" r="11" fill="#fef9c3" opacity="0.9" /></>
        : <><circle cx="310" cy="26" r="12" fill="#fffbeb" opacity="0.85" /><ellipse cx="80" cy="26" rx="20" ry="7" fill="#fff" opacity="0.7" /><ellipse cx="102" cy="31" rx="14" ry="5.5" fill="#fff" opacity="0.6" /><ellipse cx="240" cy="46" rx="17" ry="6" fill="#fff" opacity="0.55" /></>}
      {sky}
      <rect x="0" y="91" width="360" height="249" fill={t.ground} />

      {/* roads connecting parcels */}
      {ROADS.map(([a, b], i) => (
        <line key={i} x1={SLOTS[a][0]} y1={SLOTS[a][1]} x2={SLOTS[b][0]} y2={SLOTS[b][1]}
          stroke={shade(t.ground, 1.35)} strokeWidth="7" strokeLinecap="round" opacity="0.55" />
      ))}

      {/* parcels */}
      {SLOTS.map(([x, y], i) => {
        const pw = i === 9 ? 44 : 33, ph = pw / 2;
        return <polygon key={i} points={P([[x, y - ph], [x + pw, y], [x, y + ph], [x - pw, y]])}
          fill={i === 9 ? shade(t.parcel, 1.18) : t.parcel} stroke={shade(t.ground, 0.8)} strokeWidth="1" />;
      })}

      {TREES.map(([x, y], i) => <Tree key={i} x={x} y={y} c={treeC} />)}

      {/* buildings */}
      {order.map(({ a, spec, slot: [cx, cy], idx }) => {
        const rec = world[a.id];
        const price = assetPrice(a, ownedCounts);
        const base = t.bld[idx % t.bld.length];
        const flag = rec ? (rec.mine ? (myFlag ?? '🚩') : (getCountryByCode(rec.ownerCountry)?.flag ?? '🚩')) : null;
        const ownerLabel = rec ? (rec.mine ? 'You' : (rec.ownerName ?? 'Taken').slice(0, 9)) : null;
        const H = spec.H;
        return (
          <motion.g key={a.id} onClick={() => onTap(a)} style={{ cursor: 'pointer', transformBox: 'fill-box', transformOrigin: '50% 100%' }}
            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 14, stiffness: 260, delay: idx * 0.045 }}
            whileHover={{ y: -3 }} whileTap={{ scale: 0.93 }}>
            <ellipse cx={cx + 5} cy={cy + 4} rx={spec.w * 1.1} ry={spec.w * 0.5} fill="#000" opacity="0.22" />
            <IsoBuilding cx={cx} cy={cy} w={spec.w} H={H} base={base} win={t.win} floors={spec.floors ?? 0} roof={spec.roof} accent={spec.accent} />
            {rec?.mine && (
              <polygon points={P([[cx, cy - spec.w / 2 - 2], [cx + spec.w + 4, cy], [cx, cy + spec.w / 2 + 2], [cx - spec.w - 4, cy]])}
                fill="none" stroke="#fbbf24" strokeWidth="2" />
            )}
            {flag && <>
              <line x1={cx} y1={cy - H - (spec.roof ? 16 : 2)} x2={cx} y2={cy - H - (spec.roof ? 34 : 20)} stroke="#e5e7eb" strokeWidth="1.4" />
              <text x={cx + 7} y={cy - H - (spec.roof ? 27 : 13)} textAnchor="middle" fontSize="11">{flag}</text>
            </>}
            <rect x={cx - 27} y={cy + spec.w / 2 + 5} width="54" height="12.5" rx="6"
              fill={rec ? (rec.mine ? '#b45309' : '#111827') : '#111827'} opacity="0.88" />
            <text x={cx} y={cy + spec.w / 2 + 14} textAnchor="middle" fontSize="8" fontWeight="800"
              fill={rec ? (rec.mine ? '#fde68a' : '#c4b5fd') : '#f9fafb'}>
              {rec ? `${flag} ${ownerLabel}` : fmtK(price)}
            </text>
          </motion.g>
        );
      })}
    </svg>
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
