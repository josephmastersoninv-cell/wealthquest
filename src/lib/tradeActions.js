// Shared trade engine — lets any page (news briefing, arena, prompts) execute
// real trades against the same portfolio the Portfolio page uses.

import marketSim from './marketSim';
import { ASSETS, getMarketStatus } from './marketData';
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
  const shares = dollars / price;

  if (mode === 'buy') {
    if (dollars > p.cash + 0.001) return { ok: false, error: 'Not enough cash' };
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
    if (!h || h.shares * price < dollars - 0.01) return { ok: false, error: 'Not enough shares to sell' };
    h.shares -= shares;
    if (h.shares < 0.0001) p.holdings = p.holdings.filter(x => x.assetId !== assetId);
    p.cash += dollars;
  }

  p.cash = Math.round(p.cash * 100) / 100;
  p.trades.push({ type: mode, assetId, shares, price, ts: Date.now() });
  savePortfolio(p);
  return { ok: true, portfolio: p };
}
