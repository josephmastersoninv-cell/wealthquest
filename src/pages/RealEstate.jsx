import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { CITIES, getCityById, getCityAssets, getAssetById, assetPrice, monthlyRent, cityTrend, currentGameMonth, MIN_DOWN_PCT, MORTGAGE_RATES, monthlyPayment, getCityEvent, getMonthEvents } from '@/lib/realEstateData';
import { fetchWorldOwnership, ownedCountsByCity, buyProperty, sellProperty, collectRent, pendingRent, settleMyProperties, myRealEstateEquity, propertyMeta, isVacant, rentMult, upgradeCost, upgradeProperty, fillVacancy, MAX_UPGRADE_LEVEL } from '@/lib/realEstateEngine';
import { getPortfolio } from '@/lib/tradeActions';
import { useUserProgress } from '@/lib/useUserProgress';
import { Link } from 'react-router-dom';

const UNLOCK_LESSONS = 3;
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

// ── Illustrated isometric town map (warm storybook style) ────────────────────
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = v => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${ch((n >> 16) & 255)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}
const P = arr => arr.map(p => p.join(',')).join(' ');

// Per-city look (grass, road, water side) — themed to make sense for the place
const CITY_LOOK = {
  lagos:    { grass: '#7fae55', grass2: '#6f9e48', road: '#d9c9a0', water: 'bottom' },
  jakarta:  { grass: '#6fae62', grass2: '#5f9e54', road: '#cfc6a4', water: 'top' },
  mumbai:   { grass: '#8faa55', grass2: '#7f9a48', road: '#d8cba2', water: 'left' },
  mexico:   { grass: '#9aac5a', grass2: '#8a9c4c', road: '#e0d3a6', water: null },
  saopaulo: { grass: '#6bab55', grass2: '#5c9b49', road: '#d3caa2', water: null },
  warsaw:   { grass: '#7ba85f', grass2: '#6b9852', road: '#cfcbbe', water: 'river' },
  seoul:    { grass: '#74ac6a', grass2: '#649c5c', road: '#cdccc6', water: 'river' },
  berlin:   { grass: '#79a75f', grass2: '#699752', road: '#cececa', water: 'river' },
  madrid:   { grass: '#9aad57', grass2: '#8a9d4a', road: '#e2d6a8', water: null },
  toronto:  { grass: '#74ac66', grass2: '#649c58', road: '#d0d2d6', water: 'bottom' },
  dublin:   { grass: '#5fb35a', grass2: '#4fa34d', road: '#cdd0c2', water: 'bottom' },
  tokyo:    { grass: '#84b070', grass2: '#74a062', road: '#d6d0d4', water: 'right' },
  sydney:   { grass: '#77b06a', grass2: '#67a05c', road: '#d0d4d6', water: 'top' },
  london:   { grass: '#72a760', grass2: '#629752', road: '#cdd0d4', water: 'river' },
  nyc:      { grass: '#6fa663', grass2: '#5f9656', road: '#cfd2d8', water: 'right' },
};

const WALL = '#efe3cc', WALL_SHADE = 0.8;

// Iso box from front-bottom vertex S=(fx,fy): returns the 4 base + 4 roof pts
function isoBox(fx, fy, hw, h) {
  const S = [fx, fy];
  const E = [fx + hw, fy - hw / 2];
  const W = [fx - hw, fy - hw / 2];
  const N = [fx, fy - hw];
  const up = ([x, y]) => [x, y - h];
  return { S, E, W, N, Sr: up(S), Er: up(E), Wr: up(W), Nr: up(N) };
}

// Draw one building sprite → array of SVG nodes. cx,cy = front-bottom vertex.
function drawBuilding(cx, cy, spec, key) {
  const { hw, h, roof, roofColor, wall = WALL, awning, glass, sign, flag, chimney } = spec;
  const b = isoBox(cx, cy, hw, h);
  const els = [];
  // ground shadow
  els.push(<polygon key="sh" points={P([b.S, b.E, [b.E[0]+4,b.E[1]+4], [b.S[0]+4,b.S[1]+4]])} fill="#000" opacity="0.12" />);
  // walls (right = brighter, left = shaded)
  const wR = glass ? '#bcd3e6' : wall;
  const wL = glass ? shade('#bcd3e6', 0.82) : shade(wall, WALL_SHADE);
  els.push(<polygon key="wr" points={P([b.S, b.E, b.Er, b.Sr])} fill={wR} stroke={shade(wR,0.75)} strokeWidth="0.5" />);
  els.push(<polygon key="wl" points={P([b.S, b.W, b.Wr, b.Sr])} fill={wL} stroke={shade(wL,0.8)} strokeWidth="0.5" />);
  // windows (rows up the two front walls)
  const rows = Math.max(1, Math.floor(h / 11));
  for (let i = 0; i < rows; i++) {
    const t = (i + 0.6) / rows;
    const wy = -h * t;
    const winC = glass ? '#8fb7d8' : '#a9cbe0';
    // right wall window
    els.push(<rect key={`wr${i}`} x={cx + hw*0.28} y={cy - hw*0.14 + wy} width={hw*0.34} height="5" fill={winC} transform={`skewY(-26.57 ${cx} ${cy})`} opacity="0.9" />);
    // left wall window
    els.push(<rect key={`wl${i}`} x={cx - hw*0.62} y={cy - hw*0.14 + wy} width={hw*0.34} height="5" fill={shade(winC,0.85)} transform={`skewY(26.57 ${cx} ${cy})`} opacity="0.9" />);
  }
  // door on the front-right wall
  els.push(<rect key="door" x={cx + hw*0.05} y={cy - 9} width={hw*0.34} height="9" rx="1" fill="#7c4a2c" transform={`skewY(-26.57 ${cx} ${cy})`} />);
  // awning (shops/cafes)
  if (awning) {
    els.push(<polygon key="aw" points={P([[cx, cy-1], b.E, [b.E[0], b.E[1]-5], [cx, cy-6]])} fill={awning} />);
    els.push(<polygon key="aw2" points={P([[cx, cy-1], b.W, [b.W[0], b.W[1]-5], [cx, cy-6]])} fill={shade(awning,0.8)} />);
  }
  if (sign) els.push(<rect key="sg" x={cx-hw*0.5} y={cy-h+2} width={hw} height="5" rx="1.5" fill="#334155" transform={`skewY(-26.57 ${cx} ${cy})`} opacity="0.85" />);

  // roof
  if (roof === 'flat') {
    els.push(<polygon key="rf" points={P([b.Nr, b.Er, b.Sr, b.Wr])} fill={shade(roofColor,1.05)} stroke={shade(roofColor,0.8)} strokeWidth="0.6" />);
    els.push(<polygon key="par" points={P([b.Wr, b.Sr, [b.Sr[0], b.Sr[1]-3], [b.Wr[0], b.Wr[1]-3]])} fill={shade(roofColor,0.7)} />);
  } else if (roof === 'spire') {
    els.push(<polygon key="rf" points={P([b.Nr, b.Er, b.Sr, b.Wr])} fill={shade(roofColor,1.05)} />);
    const apex = [cx, cy - h - hw*1.5];
    els.push(<polygon key="sp1" points={P([b.Wr, b.Sr, apex])} fill={roofColor} />);
    els.push(<polygon key="sp2" points={P([b.Sr, b.Er, apex])} fill={shade(roofColor,0.7)} />);
    els.push(<circle key="ball" cx={apex[0]} cy={apex[1]} r="2.4" fill="#fbbf24" />);
  } else {
    // hip / gable pyramid
    const rh = roof === 'gable' ? hw*0.9 : hw*0.7;
    const apex = [cx, cy - h - hw/2 - rh];
    els.push(<polygon key="r1" points={P([b.Nr, b.Er, apex])} fill={shade(roofColor,1.12)} />);
    els.push(<polygon key="r2" points={P([b.Er, b.Sr, apex])} fill={roofColor} />);
    els.push(<polygon key="r3" points={P([b.Sr, b.Wr, apex])} fill={shade(roofColor,0.72)} />);
    els.push(<polygon key="r4" points={P([b.Wr, b.Nr, apex])} fill={shade(roofColor,0.9)} />);
    if (chimney) els.push(<rect key="ch" x={cx-hw*0.55} y={cy-h-hw*0.5} width="4" height="8" fill="#8a5a3a" />);
  }
  if (flag) {
    els.push(<line key="fp" x1={cx} y1={cy-h-hw/2-2} x2={cx} y2={cy-h-hw/2-16} stroke="#94a3b8" strokeWidth="1.2" />);
    els.push(<polygon key="fg" points={`${cx},${cy-h-hw/2-16} ${cx+9},${cy-h-hw/2-13} ${cx},${cy-h-hw/2-10}`} fill="#ef4444" />);
  }
  return <g key={key}>{els}</g>;
}

function Tree({ x, y, s = 1 }) {
  return <g>
    <ellipse cx={x} cy={y} rx={7*s} ry={3*s} fill="#000" opacity="0.1" />
    <rect x={x-1.2} y={y-8*s} width="2.4" height={8*s} fill="#7a5230" />
    <circle cx={x} cy={y-12*s} r={7*s} fill="#4f8f43" />
    <circle cx={x-4*s} cy={y-9*s} r={5*s} fill="#5da04f" />
    <circle cx={x+4*s} cy={y-10*s} r={5*s} fill="#458a3c" />
  </g>;
}
function Lamp({ x, y }) {
  return <g><line x1={x} y1={y} x2={x} y2={y-15} stroke="#3f4451" strokeWidth="1.6" /><circle cx={x} cy={y-16} r="2.6" fill="#fde68a" /></g>;
}

// asset-index → building spec (matches getCityAssets order)
function specFor(i, cityAccent) {
  const S = [
    { hw: 15, h: 12, roof: 'hip',   roofColor: '#c0563b' },                 // studio
    { hw: 17, h: 40, roof: 'flat',  roofColor: '#8a8f98' },                 // apartment
    { hw: 18, h: 13, roof: 'gable', roofColor: '#b5432f', chimney: true },  // house
    { hw: 16, h: 22, roof: 'hip',   roofColor: '#8a4e2c', chimney: true },  // townhouse
    { hw: 15, h: 13, roof: 'hip',   roofColor: '#3f7d52', awning: '#d64545' }, // cafe
    { hw: 18, h: 15, roof: 'flat',  roofColor: '#9a9a9a', awning: '#2f6fb0', sign: true }, // shop
    { hw: 22, h: 15, roof: 'gable', roofColor: '#3c6e9c', flag: true },     // school
    { hw: 17, h: 50, roof: 'flat',  roofColor: '#6b7280', glass: true },    // office
    { hw: 19, h: 40, roof: 'flat',  roofColor: '#7c5cae', sign: true },     // hotel
    { hw: 20, h: 34, roof: 'spire', roofColor: cityAccent ?? '#b08d57', flag: true }, // landmark
  ];
  return S[i] ?? S[0];
}

// front-bottom anchors, arranged around a central iso crossroads (kept clear)
const ANCHORS = [
  [78, 150],   // studio  — left
  [140, 108],  // apartment — back-left (tall)
  [225, 112],  // house — back-right
  [55, 196],   // townhouse — front-left
  [300, 152],  // cafe — right
  [258, 198],  // shop — front-right
  [180, 96],   // school — back-center
  [110, 244],  // office — front (tall)
  [250, 250],  // hotel — front-right (tall)
  [182, 176],  // landmark — center
];
const TREES = [[30, 150], [335, 138], [40, 250], [325, 250], [150, 285], [215, 292], [95, 120], [270, 120]];
const LAMPS = [[120, 168], [242, 168], [180, 220]];

function CityMap({ city, assets, world, ownedCounts, myFlag, onTap }) {
  const L = CITY_LOOK[city.id] ?? CITY_LOOK.dublin;
  const W = 360, H = 300;
  const cityAccent = { dublin:'#5b7d3a', nyc:'#5a6072', tokyo:'#b05a7a', london:'#6a6f7c' }[city.id];

  const order = assets.map((a, i) => ({ a, i, anchor: ANCHORS[i] ?? ANCHORS[0], spec: specFor(i, cityAccent) }))
    .sort((x, y) => x.anchor[1] - y.anchor[1]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-2xl border border-border select-none" style={{ background: L.grass }}>
      {/* subtle grass checker */}
      {Array.from({ length: 6 }).map((_, r) => Array.from({ length: 7 }).map((_, c) =>
        (r + c) % 2 === 0 ? <rect key={`${r}-${c}`} x={c*54} y={r*54} width="54" height="54" fill={L.grass2} opacity="0.5" /> : null))}

      {/* water */}
      {L.water === 'bottom' && <rect x="0" y="266" width={W} height="34" fill="#5aa0c4" />}
      {L.water === 'top' && <rect x="0" y="0" width={W} height="26" fill="#5aa0c4" />}
      {L.water === 'left' && <rect x="0" y="0" width="24" height={H} fill="#5aa0c4" />}
      {L.water === 'right' && <rect x="336" y="0" width="24" height={H} fill="#5aa0c4" />}
      {L.water === 'river' && <path d="M -10 60 Q 120 100 200 150 T 380 220 L 380 250 Q 210 190 130 150 T -10 95 Z" fill="#5aa0c4" opacity="0.9" />}

      {/* iso crossroads */}
      <line x1="10" y1="220" x2="350" y2="82" stroke={L.road} strokeWidth="24" strokeLinecap="round" />
      <line x1="10" y1="82" x2="350" y2="220" stroke={L.road} strokeWidth="24" strokeLinecap="round" />
      <line x1="10" y1="220" x2="350" y2="82" stroke={shade(L.road,0.9)} strokeWidth="1.5" strokeDasharray="5 7" opacity="0.6" />
      <line x1="10" y1="82" x2="350" y2="220" stroke={shade(L.road,0.9)} strokeWidth="1.5" strokeDasharray="5 7" opacity="0.6" />

      {TREES.map(([x, y], i) => <Tree key={`t${i}`} x={x} y={y} s={0.9} />)}
      {LAMPS.map(([x, y], i) => <Lamp key={`l${i}`} x={x} y={y} />)}

      {/* buildings back-to-front */}
      {order.map(({ a, i, anchor: [cx, cy], spec }) => {
        const rec = world[a.id];
        const price = assetPrice(a, ownedCounts);
        const flag = rec ? (rec.mine ? (myFlag ?? '🚩') : (getCountryByCode(rec.ownerCountry)?.flag ?? '🚩')) : null;
        const vac = rec?.mine && isVacant(a.id);
        const lvl = rec?.mine ? propertyMeta(a.id).level : 0;
        const label = rec ? (rec.mine ? (vac ? 'VACANT' : 'You' + (lvl ? ' ' + '★'.repeat(lvl) : '')) : (rec.ownerName ?? 'Owned').slice(0, 9)) : fmtK(price);
        const s2 = rec?.mine ? { ...spec, wall: '#f5d98a' } : spec;
        const topY = cy - spec.h - spec.hw - 6;
        return (
          <motion.g key={a.id} onClick={() => onTap(a)} style={{ cursor: 'pointer', transformBox: 'fill-box', transformOrigin: '50% 100%' }}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 16, stiffness: 240, delay: i * 0.04 }}
            whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
            {drawBuilding(cx, cy, s2, a.id)}
            {rec ? (
              <g>
                <path d={`M ${cx} ${topY-18} a 7 7 0 1 0 0.1 0 Z`} fill={rec.mine ? (vac ? '#e11d48' : '#f59e0b') : '#6366f1'} />
                <path d={`M ${cx-6} ${topY-18} L ${cx+6} ${topY-18} L ${cx} ${topY-6} Z`} fill={rec.mine ? (vac ? '#e11d48' : '#f59e0b') : '#6366f1'} />
                <text x={cx} y={topY-15} textAnchor="middle" fontSize="8">{flag}</text>
                <rect x={cx-27} y={topY-3} width="54" height="12" rx="6" fill="#0f172a" opacity="0.9" />
                <text x={cx} y={topY+5.5} textAnchor="middle" fontSize="7.5" fontWeight="800" fill={rec.mine ? '#fde68a' : '#c7d2fe'}>{label}</text>
              </g>
            ) : (
              <g>
                <rect x={cx-22} y={topY-10} width="44" height="13" rx="6.5" fill="#0f172a" opacity="0.88" />
                <text x={cx} y={topY-1} textAnchor="middle" fontSize="8" fontWeight="800" fill="#fff">{fmtK(price)}</text>
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
  const { progress } = useUserProgress();
  const lessons = (progress?.completed_lessons ?? []).length;
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

  if (lessons < UNLOCK_LESSONS) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 pb-28 gap-4 text-center">
        <span className="text-6xl">🔒</span>
        <h2 className="text-xl font-extrabold text-foreground">Real Estate Locked</h2>
        <p className="text-sm text-muted-foreground max-w-xs">Complete {UNLOCK_LESSONS} lessons to unlock the global property market.</p>
        <div className="bg-muted rounded-2xl px-6 py-3">
          <p className="font-extrabold text-foreground">{lessons} / {UNLOCK_LESSONS} lessons done</p>
        </div>
        <Link to="/" className="mt-1 bg-primary text-primary-foreground font-extrabold px-6 py-3 rounded-2xl active:scale-95">
          Back to Learn
        </Link>
      </div>
    );
  }

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
