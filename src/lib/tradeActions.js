// Shared trade engine — lets any page (news briefing, arena, prompts) execute
// real trades against the same portfolio the Portfolio page uses.

import marketSim from './marketSim';
import { ASSETS, getMarketStatus } from './marketData';
import { getAssetById as getREAsset, assetPrice as reAssetPrice } from './realEstateData';
import { pushPortfolio } from './cloudSync';

const PORTFOLIO_KEY = 'wealthquest_portfolio';
export const STARTING_CASH = 10000;

export function getPortfolio() {
  try {
    const p = JSON.parse(localStorage.getItem(PORTFOLIO_KEY) ?? 'null');
    if (p) return p;
  } catch {}
  return { cash: STARTING_CASH, holdings: [], trades: [], bondHoldings: [] };
}

export function savePortfolio(p) {
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(p));
  marketSim.setPortfolio(p);
  pushPortfolio(p);
}

export function getCash() {
  return getPortfolio().cash ?? 0;
}

export function getHolding(assetId) {
  return getPortfolio().holdings?.find(h => h.assetId === assetId) ?? null;
}

export function getLivePriceById(assetId) {
  return marketSim.prices[assetId]?.price ?? null;
}

// Property equity from LOCAL real-estate holdings (value − remaining mortgage).
// Covers local-mode owners live; cloud owners come through the wq_re_equity
// cache the Estate page writes. We take the larger so it's never understated.
function localREEquity() {
  try {
    const h = JSON.parse(localStorage.getItem('wealthquest_re_holdings') ?? '{}');
    let eq = 0;
    for (const rec of Object.values(h)) {
      const a = getREAsset(rec.assetId);
      if (!a) continue;
      eq += reAssetPrice(a, {}) - (rec.mortgage?.remaining ?? 0);
    }
    return eq;
  } catch { return 0; }
}

// Net worth = cash + live value of stock holdings + real-estate equity.
// This is the game's single score — "how rich are you".
export function getNetWorth() {
  const p = getPortfolio();
  const cash = p.cash ?? 0;
  const invested = (p.holdings ?? []).reduce((sum, h) => {
    const price = getLivePriceById(h.assetId) ?? h.avgCost ?? 0;
    return sum + price * h.shares;
  }, 0);
  const reEquity = Math.max(Number(localStorage.getItem('wq_re_equity') ?? 0), localREEquity());
  return Math.round(cash + invested + reEquity);
}

// Crypto trades 24/7; stocks & ETFs only during NYSE hours
export function canTradeAsset(assetId) {
  const a = ASSETS.find(x => x.id === assetId);
  return a?.type === 'crypto' || getMarketStatus().open;
}

// Add or remove raw cash (arena winnings/losses, prizes). Clamps at 0.
export function adjustCash(amount) {
  const p = getPortfolio();
  p.cash = Math.max(0, Math.round(((p.cash ?? 0) + amount) * 100) / 100);
  savePortfolio(p);
  return p.cash;
}

// Execute a market buy/sell for a dollar amount. Returns { ok, error, portfolio }.
export function executeTrade(assetId, dollars, mode = 'buy') {
  const price = getLivePriceById(assetId);
  if (!price || price <= 0) return { ok: false, error: 'No live price available' };
  if (!canTradeAsset(assetId)) return { ok: false, error: 'Market is closed for this asset' };
  if (dollars <= 0) return { ok: false, error: 'Enter an amount' };

  const p = getPortfolio();
  p.holdings = [...(p.holdings ?? [])];
  p.trades   = [...(p.trades ?? [])];

  let shares;
  if (mode === 'buy') {
    // "Max" plus a cent of drift (price tick / rounding) means all-in, not an error
    if (dollars > p.cash && dollars - p.cash <= 1) dollars = p.cash;
    if (dollars > p.cash + 0.001) return { ok: false, error: 'Not enough cash' };
    shares = dollars / price;
    const ex = p.holdings.find(h => h.assetId === assetId);
    if (ex) {
      const tot = ex.shares + shares;
      ex.avgCost = (ex.avgCost * ex.shares + price * shares) / tot;
      ex.shares = tot;
    } else {
      p.holdings.push({ assetId, shares, avgCost: price });
    }
    p.cash -= dollars;
  } else {
    const h = p.holdings.find(x => x.assetId === assetId);
    if (!h) return { ok: false, error: 'Not enough shares to sell' };
    const holdingValue = h.shares * price;
    // Selling "Max" after the price ticked down → sell the whole holding
    if (dollars > holdingValue && dollars - holdingValue <= holdingValue * 0.02 + 1) dollars = holdingValue;
    if (holdingValue < dollars - 0.01) return { ok: false, error: 'Not enough shares to sell' };
    shares = dollars / price;
    if (shares > h.shares) shares = h.shares;
    h.shares -= shares;
    if (h.shares < 0.0001) p.holdings = p.holdings.filter(x => x.assetId !== assetId);
    p.cash += dollars;
  }

  p.cash = Math.round(p.cash * 100) / 100;
  p.trades.push({ type: mode, assetId, shares, price, ts: Date.now() });
  savePortfolio(p);
  return { ok: true, portfolio: p };
}
