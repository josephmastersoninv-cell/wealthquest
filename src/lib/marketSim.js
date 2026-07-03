// Market simulation singleton — runs forever, independent of any React component.
// Portfolio.jsx subscribes to price ticks and snapshot updates.
// This means the chart keeps advancing and prices keep moving even when the
// user is on a different page.

import { ASSETS, fetchAllPrices, syntheticPoints, getMarketStatus, simulatePriceTick } from './marketData';

const TICK_MS      = 8000;
const SPEED_MULT   = 5;
const STARTING_CASH = 10000;
const SNAP_KEY     = 'wq_portfolio_snapshots';

function loadSnapshots() {
  try { return JSON.parse(localStorage.getItem(SNAP_KEY) ?? '[]'); }
  catch { return []; }
}

const marketSim = {
  prices: {},
  snapshots: loadSnapshots(),
  portfolio: null,

  _priceListeners: new Set(),
  _snapListeners:  new Set(),
  _ticker:         null,
  _initPromise:    null,

  // Call once (idempotent) to fetch initial prices and start the tick loop.
  init() {
    if (this._initPromise) return this._initPromise;
    this._initPromise = fetchAllPrices().then(p => {
      Object.keys(p).forEach(id => {
        if (!p[id].points?.length)
          p[id] = { ...p[id], points: syntheticPoints(p[id].price, p[id].change) };
      });
      this.prices = p;
      this._notifyPrices();
      this._startTick();
    });
    return this._initPromise;
  },

  _startTick() {
    if (this._ticker) return;
    this._ticker = setInterval(() => this._tick(), TICK_MS);
  },

  _tick() {
    const status = getMarketStatus();
    const next   = { ...this.prices };
    let changed  = false;

    Object.keys(next).forEach(id => {
      const asset = ASSETS.find(a => a.id === id);
      if (asset?.type === 'crypto' || status.open) {
        const mult = status.open ? SPEED_MULT : asset?.type === 'crypto' ? 3 : 0;
        if (mult === 0) return;
        const single = simulatePriceTick({ [id]: next[id] }, mult);
        next[id] = single[id];
        changed  = true;
      }
    });

    if (changed) {
      this.prices = next;
      this._notifyPrices();
    }

    // Record portfolio snapshot regardless of whether prices moved
    const p  = this.portfolio;
    const px = this.prices;
    if (p && Object.keys(px).length > 0) {
      const hs       = (p.holdings ?? []).filter(h => h.shares > 0.0001);
      const inv      = hs.reduce((s, h) => s + (px[h.assetId]?.price ?? h.avgCost) * h.shares, 0);
      const shortPnl = (p.shorts ?? []).reduce((s, sh) =>
        s + (sh.entryPrice - (px[sh.assetId]?.price ?? sh.entryPrice)) * sh.shares, 0);
      const margin   = (p.shorts ?? []).reduce((s, sh) => s + sh.entryPrice * sh.shares, 0);
      const val      = (p.cash ?? STARTING_CASH) + inv + margin + shortPnl;
      this.snapshots = [...this.snapshots.slice(-299), val];
      try { localStorage.setItem(SNAP_KEY, JSON.stringify(this.snapshots)); } catch {}
      this._notifySnaps();
    }
  },

  // Apply a price updater function without broadcasting a tick notification.
  // The caller is responsible for syncing React state after calling this.
  updatePrices(updater) {
    this.prices = updater(this.prices);
  },

  setPortfolio(p) {
    this.portfolio = p;
  },

  // Subscribe to price ticks (fired every 8 s by the interval).
  onPrices(fn)    { this._priceListeners.add(fn); return () => this._priceListeners.delete(fn); },
  // Subscribe to snapshot updates (fired every 8 s alongside price ticks).
  onSnapshots(fn) { this._snapListeners.add(fn);  return () => this._snapListeners.delete(fn);  },

  _notifyPrices() { this._priceListeners.forEach(fn => fn()); },
  _notifySnaps()  { this._snapListeners.forEach(fn => fn());  },
};

export default marketSim;
