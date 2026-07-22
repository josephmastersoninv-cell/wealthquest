import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { CITIES, getCityById, getCityAssets, getAssetById, assetPrice, monthlyRent, cityTrend, currentGameMonth, MIN_DOWN_PCT, MORTGAGE_RATES, monthlyPayment, getCityEvent, getMonthEvents } from '@/lib/realEstateData';
import { fetchWorldOwnership, ownedCountsByCity, buyProperty, sellProperty, collectRent, pendingRent, settleMyProperties, myRealEstateEquity, propertyMeta, isVacant, rentMult, upgradeCost, upgradeProperty, fillVacancy, MAX_UPGRADE_LEVEL } from '@/lib/realEstateEngine';
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
    <canvas ref={canvasRef} className="w-full h-[300px] touch-none cursor-grab active:cursor-grabbing"
      onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={() => (state.current.dragging = false)}
      onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp} />
  );
}

// ── Per-city visual identity for the city map ───────────────────────────────
// ── Google-Maps-style city map: top-down streets + 3D building extrusions ────
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = v => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${ch((n >> 16) & 255)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}
const P = arr => arr.map(p => p.join(',')).join(' ');

// Per-city map palette + where the water sits (Google-Maps night styling)
const MAP_THEMES = {
  lagos:    { land: '#2a2f25', park: '#38452b', water: 'bottom', bld: '#cbb892' },
  jakarta:  { land: '#232a26', park: '#2f4034', water: 'top',    bld: '#c7cdbf' },
  mumbai:   { land: '#2b2620', park: '#3c3524', water: 'left',   bld: '#d8cbb0' },
  mexico:   { land: '#2b2820', park: '#3f3a24', water: null,     bld: '#d9c9a8' },
  saopaulo: { land: '#22271f', park: '#33422a', water: null,     bld: '#c9cbc0' },
  warsaw:   { land: '#242730', park: '#2c3a2e', water: 'river',  bld: '#c3c7d0' },
  seoul:    { land: '#20222e', park: '#2a3a34', water: 'river',  bld: '#c9d0e0' },
  berlin:   { land: '#252528', park: '#31402f', water: 'river',  bld: '#d0cdc8' },
  madrid:   { land: '#2a2820', park: '#3b3f26', water: null,     bld: '#e0d6bf' },
  toronto:  { land: '#1f2530', park: '#294031', water: 'bottom', bld: '#cdd6e0' },
  dublin:   { land: '#212a22', park: '#2e4530', water: 'bottom', bld: '#d8d0bd' },
  tokyo:    { land: '#242028', park: '#33362a', water: 'right',  bld: '#e0d5dc' },
  sydney:   { land: '#1e2a30', park: '#28402f', water: 'top',    bld: '#d4dbdf' },
  london:   { land: '#232630', park: '#2c3a2c', water: 'river',  bld: '#cdd2da' },
  nyc:      { land: '#20222c', park: '#2a3a30', water: 'right',  bld: '#c9d0e2' },
};

// 10 building footprints laid out inside the road-grid blocks (x, y = top-left)
// [x, y, w, d, height, isLandmark]
const FOOTPRINTS = [
  [ 38,  40, 26, 20, 14, 0],   // studio
  [122,  36, 30, 22, 40, 0],   // apartment tower
  [232,  42, 30, 22, 16, 0],   // house
  [ 40, 128, 30, 24, 24, 0],   // townhouse
  [232, 126, 26, 22, 15, 0],   // cafe
  [122, 130, 30, 22, 20, 0],   // shop
  [ 34, 214, 34, 26, 16, 0],   // school
  [230, 210, 30, 24, 52, 0],   // office
  [126, 212, 30, 24, 42, 0],   // hotel
  [158,  92, 44, 34, 66, 1],   // landmark — center
];
const PARKS = [[288, 150, 46, 46], [16, 96, 34, 30]];

// One 3D building: ground footprint + extruded roof with shaded walls
function Building3D({ x, y, w, d, h, base, accent, landmark }) {
  const dx = -h * 0.42, dy = -h * 0.72;               // oblique extrude vector
  const g  = [[x, y], [x + w, y], [x + w, y + d], [x, y + d]];        // ground
  const r  = g.map(([px, py]) => [px + dx, py + dy]);                 // roof
  const wallF = [g[3], g[2], r[2], r[3]];             // front (toward viewer)
  const wallL = [g[0], g[3], r[3], r[0]];             // left
  const lit = shade(base, 1.12), mid = shade(base, 0.82), dark = shade(base, 0.6);
  return (
    <g>
      <polygon points={P([g[3], g[2], [g[2][0] + 6, g[2][1] + 5], [g[3][0] + 6, g[3][1] + 5]])} fill="#000" opacity="0.18" />
      <polygon points={P(wallL)} fill={dark} />
      <polygon points={P(wallF)} fill={mid} />
      {/* window rows on the two visible walls */}
      {Array.from({ length: Math.min(6, Math.floor(h / 9)) }).map((_, i) => {
        const t = (i + 1) / (Math.floor(h / 9) + 1);
        const ay = dy * t, ax = dx * t;
        return <g key={i}>
          <line x1={x + ax + 3} y1={y + d + ay} x2={x + w + ax - 3} y2={y + d + ay} stroke={accent ?? '#fde68a'} strokeWidth="1" opacity="0.5" />
        </g>;
      })}
      <polygon points={P(r)} fill={lit} stroke={shade(base, 0.9)} strokeWidth="0.5" />
      {landmark && <circle cx={r[0][0] + w / 2} cy={r[0][1] + d / 2} r="3" fill="#fbbf24" />}
      {accent && <polygon points={P([r[3], r[2], [r[2][0], r[2][1] + 4], [r[3][0], r[3][1] + 4]])} fill={accent} />}
    </g>
  );
}

const BLD_ACCENT = [null, null, '#b91c1c', '#b91c1c', '#dc2626', '#2563eb', '#16a34a', null, '#7c3aed', null];

function CityMap({ city, assets, world, ownedCounts, myFlag, onTap }) {
  const t = MAP_THEMES[city.id] ?? MAP_THEMES.dublin;
  const W = 360, H = 300;

  // road grid
  const vRoads = [90, 180, 270], hRoads = [96, 176, 256];
  const water = t.water;

  // paint buildings back-to-front (smaller y first)
  const order = assets.map((a, i) => ({ a, fp: FOOTPRINTS[i] ?? FOOTPRINTS[0], accent: BLD_ACCENT[i], idx: i }))
    .sort((x, y) => (x.fp[1] + x.fp[4] * -0.7) - (y.fp[1] + y.fp[4] * -0.7));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-2xl border border-border select-none" style={{ background: t.land }}>
      {/* water bodies */}
      {water === 'bottom' && <rect x="0" y="262" width={W} height="40" fill="#1c3a4a" />}
      {water === 'top' && <rect x="0" y="0" width={W} height="34" fill="#1c3a4a" />}
      {water === 'left' && <rect x="0" y="0" width="30" height={H} fill="#1c3a4a" />}
      {water === 'right' && <rect x="330" y="0" width="30" height={H} fill="#1c3a4a" />}
      {water === 'river' && <path d="M -10 70 Q 120 110 200 150 T 380 210 L 380 250 Q 200 190 120 150 T -10 110 Z" fill="#1c3a4a" opacity="0.9" />}

      {/* parks */}
      {PARKS.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} rx="6" fill={t.park} />)}

      {/* road network */}
      {hRoads.map((y, i) => <rect key={`h${i}`} x="0" y={y - 5} width={W} height="10" fill={shade(t.land, 1.7)} />)}
      {vRoads.map((x, i) => <rect key={`v${i}`} x={x - 5} y="0" width="10" height={H} fill={shade(t.land, 1.7)} />)}
      {/* diagonal avenue */}
      <line x1="0" y1="300" x2="360" y2="40" stroke={shade(t.land, 1.9)} strokeWidth="9" />
      {/* lane dashes on main roads */}
      {hRoads.map((y, i) => <line key={`hd${i}`} x1="0" y1={y} x2={W} y2={y} stroke={shade(t.land, 2.6)} strokeWidth="1" strokeDasharray="6 8" opacity="0.7" />)}

      {/* buildings */}
      {order.map(({ a, fp, accent, idx }) => {
        const [x, y, w, d, h, lm] = fp;
        const rec = world[a.id];
        const price = assetPrice(a, ownedCounts);
        const flag = rec ? (rec.mine ? (myFlag ?? '🚩') : (getCountryByCode(rec.ownerCountry)?.flag ?? '🚩')) : null;
        const vac = rec?.mine && isVacant(a.id);
        const lvl = rec?.mine ? propertyMeta(a.id).level : 0;
        const label = rec ? (rec.mine ? (vac ? 'VACANT' : 'You' + (lvl ? ' ' + '★'.repeat(lvl) : '')) : (rec.ownerName ?? 'Owned').slice(0, 9)) : fmtK(price);
        const base = rec?.mine ? '#f5d98a' : t.bld;   // your buildings tinted gold
        const cx = x + w / 2, topY = y + d / 2 - h * 0.72;
        return (
          <motion.g key={a.id} onClick={() => onTap(a)} style={{ cursor: 'pointer', transformBox: 'fill-box', transformOrigin: '50% 100%' }}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 16, stiffness: 240, delay: idx * 0.04 }}
            whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
            <Building3D x={x} y={y} w={w} d={d} h={h} base={base} accent={vac ? '#fb7185' : accent} landmark={lm} />
            {/* Google-Maps pin for owned; price chip for available */}
            {rec ? (
              <g>
                <path d={`M ${cx} ${topY - 20} a 7 7 0 1 0 0.1 0 Z`} fill={rec.mine ? (vac ? '#e11d48' : '#f59e0b') : '#6366f1'} />
                <path d={`M ${cx - 6} ${topY - 20} L ${cx + 6} ${topY - 20} L ${cx} ${topY - 8} Z`} fill={rec.mine ? (vac ? '#e11d48' : '#f59e0b') : '#6366f1'} />
                <text x={cx} y={topY - 17} textAnchor="middle" fontSize="8">{flag}</text>
                <rect x={cx - 26} y={topY - 5} width="52" height="12" rx="6" fill="#0f172a" opacity="0.9" />
                <text x={cx} y={topY + 3.5} textAnchor="middle" fontSize="7.5" fontWeight="800" fill={rec.mine ? '#fde68a' : '#c7d2fe'}>{label}</text>
              </g>
            ) : (
              <g>
                <rect x={cx - 22} y={topY - 12} width="44" height="13" rx="6.5" fill="#0f172a" opacity="0.88" />
                <text x={cx} y={topY - 3} textAnchor="middle" fontSize="8" fontWeight="800" fill="#fff">{fmtK(price)}</text>
              </g>
            )}
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

// ── Owned-property action sheet: upgrade, fill vacancy, sell ────────────────
function PropertySheet({ asset, rec, ownedCounts, onClose, onChanged, onSell }) {
  const price = assetPrice(asset, ownedCounts);
  const meta = propertyMeta(asset.id);
  const vacant = isVacant(asset.id);
  const rent = Math.round(monthlyRent(asset, ownedCounts) * rentMult(asset.id));
  const upCost = upgradeCost(asset, ownedCounts);
  const cash = getPortfolio().cash ?? 0;

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed bottom-0 left-0 right-0 z-[70] bg-card rounded-t-3xl p-5 pb-8 max-w-lg mx-auto">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-lg font-black text-foreground">{asset.name}</p>
            <p className="text-xs text-muted-foreground">{asset.label} · worth {fmtK(price)} · you paid {fmtK(rec.purchasePrice ?? price)}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="flex gap-2 mb-3">
          <div className={`flex-1 rounded-xl p-3 ${vacant ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Rent</p>
            <p className={`text-lg font-black ${vacant ? 'text-rose-500' : 'text-emerald-500'}`}>{vacant ? 'VACANT' : `${fmt(rent)}/mo`}</p>
            {vacant && <p className="text-[10px] text-muted-foreground">No tenant — no rent</p>}
          </div>
          <div className="flex-1 bg-muted rounded-xl p-3">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Renovation</p>
            <p className="text-lg font-black text-foreground">{'★'.repeat(meta.level) || '—'}<span className="text-muted-foreground">{'☆'.repeat(MAX_UPGRADE_LEVEL - meta.level)}</span></p>
            <p className="text-[10px] text-muted-foreground">+15% rent per star</p>
          </div>
        </div>

        {rec.mortgage && (
          <p className="text-[11px] font-bold text-amber-500 mb-3">🏦 Mortgage: {fmtK(rec.mortgage.remaining)} left · {fmt(rec.mortgage.payment)}/mo{(rec.mortgage.strikes ?? 0) > 0 ? ` · ⚠️ ${rec.mortgage.strikes}/3 strikes` : ''}</p>
        )}

        <div className="space-y-2">
          {vacant && (
            <button onClick={() => { const r = fillVacancy(asset.id, ownedCounts); r.ok ? (toast.success(`📢 New tenant found! (−${fmt(r.fee)} agent fee)`), onChanged()) : toast.error(r.error); }}
              className="w-full h-12 rounded-xl bg-sky-600 text-white font-extrabold text-sm active:scale-95 transition-all">
              📢 Advertise for a tenant — {fmtK(Math.round(price * 0.03))} fee
            </button>
          )}
          {meta.level < MAX_UPGRADE_LEVEL && (
            <button disabled={cash < upCost}
              onClick={() => { const r = upgradeProperty(asset.id, ownedCounts); r.ok ? (toast.success(`🔨 Renovated to ${'★'.repeat(r.level)} — rent up 15%!`), onChanged()) : toast.error(r.error); }}
              className="w-full h-12 rounded-xl bg-emerald-600 text-white font-extrabold text-sm active:scale-95 transition-all disabled:opacity-40">
              🔨 Renovate ({'★'.repeat(meta.level + 1)}) — {fmtK(upCost)}
            </button>
          )}
          <button onClick={onSell}
            className="w-full h-12 rounded-xl bg-muted text-foreground font-extrabold text-sm active:scale-95 transition-all">
            🏷️ Sell at market — {fmtK(price)} (5% fee{rec.mortgage ? ', mortgage repaid' : ''})
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function RealEstate() {
  const [world, setWorld] = useState({});
  const [cityId, setCityId] = useState(null);
  const [buyAsset, setBuyAsset] = useState(null);
  const [manageAsset, setManageAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, force] = useState(0);

  const refresh = useCallback(async () => {
    const w = await fetchWorldOwnership();
    const events = await settleMyProperties(w);
    events.forEach(ev => {
      if (ev.type === 'liquidated') toast.warning(`🏦 ${ev.detail}`);
      if (ev.type === 'strike') toast.error(`⚠️ Missed mortgage payment (${ev.strikes}/3) on ${getAssetById(ev.assetId)?.name}`);
      if (ev.type === 'repossessed') toast.error(`🏚️ ${getAssetById(ev.assetId)?.name} was repossessed by the bank`);
      if (ev.type === 'vacancy') toast.warning(`🚪 Your tenant left ${getAssetById(ev.assetId)?.name}! No rent until month ${ev.until + 1} — or pay an agent to refill it.`);
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
      {/* Hero header */}
      <div className="px-4 pt-6 pb-3">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950 border border-emerald-500/20 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-black text-white">🌍 Real Estate</h1>
              <p className="text-[11px] font-bold text-emerald-300/70 mt-0.5">Month {currentGameMonth() + 1} · 1 real week = 1 game month</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-300/60">Equity</p>
              <p className="text-2xl font-black text-emerald-400 leading-none mt-0.5">{fmtK(equity)}</p>
            </div>
          </div>
          {mine.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold text-white">
                  {mine.length} propert{mine.length === 1 ? 'y' : 'ies'} · <span className={monthlyFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{monthlyFlow >= 0 ? '+' : ''}{fmt(monthlyFlow)}/mo</span>
                </p>
                <p className="text-[11px] font-bold text-white/50">
                  Cash {fmtK(cash)}
                  {mine.some(r => (r.mortgage?.strikes ?? 0) > 0) && <span className="text-rose-400"> · ⚠️ mortgage in arrears</span>}
                  {mine.some(r => isVacant(r.assetId)) && <span className="text-amber-400"> · 🚪 vacancy</span>}
                </p>
              </div>
              <button onClick={handleCollectAll}
                className={`shrink-0 px-3.5 py-2.5 rounded-xl text-xs font-extrabold active:scale-95 transition-all ${totalRentDue > 0 ? 'bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/30' : 'bg-white/10 text-white/50'}`}>
                💰 {totalRentDue > 0 ? `Collect ${fmt(totalRentDue)}` : 'No rent due'}
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!city ? (
          /* ── GLOBE ── */
          <motion.div key="globe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Globe onPickCity={setCityId} />
            <p className="text-center text-[11px] font-bold text-muted-foreground -mt-1 mb-3">Spin the globe · tap a city to invest</p>
            <div className="px-4 grid grid-cols-2 gap-2">
              {CITIES.map(c => {
                const t = cityTrend(c.id);
                const ev = getCityEvent(c.id);
                const cheapest = Math.min(...getCityAssets(c.id).map(a => assetPrice(a, ownedCounts)));
                const owned = ownedCounts[c.id] ?? 0;
                return (
                  <button key={c.id} onClick={() => setCityId(c.id)}
                    className="relative bg-card border border-border rounded-2xl px-3 py-2.5 text-left active:scale-[0.97] transition-all overflow-hidden">
                    {ev && <span className="absolute top-1.5 right-2 text-sm">{ev.emoji}</span>}
                    <p className="text-sm font-extrabold text-foreground truncate pr-5">{c.flag} {c.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${t.dir > 0 ? 'bg-amber-500/15 text-amber-500' : t.dir < 0 ? 'bg-sky-500/15 text-sky-400' : 'bg-muted text-muted-foreground'}`}>
                        {t.emoji} {t.pct >= 0 ? '+' : ''}{t.pct.toFixed(1)}%
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground">from {fmtK(cheapest)}</span>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground/70 mt-1">{owned}/10 owned{owned >= 5 ? ' · 🔥 demand' : ''}</p>
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
            {(() => { const ev = getCityEvent(city.id); return ev ? (
              <div className={`rounded-xl px-3 py-2 mb-2 border ${ev.boom ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-rose-500/10 border-rose-500/25'}`}>
                <p className="text-xs font-extrabold text-foreground">{ev.emoji} {ev.title}</p>
                <p className={`text-[11px] font-bold ${ev.boom ? 'text-emerald-500' : 'text-rose-500'}`}>Prices {ev.pct > 0 ? '+' : ''}{ev.pct}% this month</p>
              </div>
            ) : null; })()}
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
                if (rec.mine) { setManageAsset(a); return; }
                toast(`🔒 ${a.name} is owned by ${rec.ownerName ?? 'another investor'}`);
              }}
            />
            <p className="text-center text-[11px] font-bold text-muted-foreground mt-2">
              Tap a building — price = for sale · 📍 pin = owned · gold = yours
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

      {/* Owned-property management sheet */}
      {manageAsset && world[manageAsset.id]?.mine && (
        <PropertySheet asset={manageAsset} rec={world[manageAsset.id]} ownedCounts={ownedCounts}
          onClose={() => setManageAsset(null)}
          onChanged={() => { setManageAsset(null); refresh(); }}
          onSell={() => { setManageAsset(null); handleSell(manageAsset.id); }} />
      )}
    </div>
  );
}
