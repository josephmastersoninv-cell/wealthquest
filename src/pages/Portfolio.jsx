import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCw, Lock, Search, X, Plus, Minus, ChevronRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserProgress } from '@/lib/useUserProgress';
import { ASSETS, fetchAllPrices, getAssetById, clearPriceCache } from '@/lib/marketData';
import { Button } from '@/components/ui/button';

const STARTING_CASH = 10000;
const UNLOCK_LESSONS = 5;
const PORTFOLIO_KEY = 'wealthquest_portfolio';

// ── Local portfolio state in localStorage (separate from UserProgress) ────────
function loadPortfolio() {
  try {
    const raw = localStorage.getItem(PORTFOLIO_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { cash: STARTING_CASH, holdings: {}, transactions: [] };
}

function savePortfolio(p) {
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(p));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n, dec = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function fmtPct(n) {
  const s = n >= 0 ? '+' : '';
  return `${s}${fmt(n)}%`;
}
function fmtDollar(n, showSign = false) {
  const s = showSign && n >= 0 ? '+' : '';
  return `${s}$${fmt(Math.abs(n))}`;
}

// ── Tiny sparkline ─────────────────────────────────────────────────────────────
function MiniChange({ change }) {
  const pos = change >= 0;
  return (
    <span className={`text-xs font-bold ${pos ? 'text-emerald-600' : 'text-rose-500'}`}>
      {pos ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
    </span>
  );
}

// ── Trade Modal ───────────────────────────────────────────────────────────────
function TradeModal({ asset, price, portfolio, onClose, onTrade }) {
  const [mode, setMode] = useState('buy');
  const [qty, setQty] = useState('');
  const numQty = parseFloat(qty) || 0;
  const isCrypto = asset.type === 'crypto';
  const held = portfolio.holdings[asset.id]?.qty ?? 0;
  const maxBuy = price > 0 ? Math.floor(portfolio.cash / price * (isCrypto ? 10000 : 1)) / (isCrypto ? 10000 : 1) : 0;
  const cost = numQty * price;
  const canBuy = mode === 'buy' && numQty > 0 && cost <= portfolio.cash;
  const canSell = mode === 'sell' && numQty > 0 && numQty <= held;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="w-full max-w-md bg-card rounded-3xl p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{asset.emoji}</span>
            <div>
              <p className="font-extrabold text-foreground">{asset.name}</p>
              <p className="text-xs text-muted-foreground">{asset.symbol} · ${fmt(price)}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Buy / Sell tabs */}
        <div className="flex bg-muted rounded-2xl p-1 mb-5">
          {['buy', 'sell'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setQty(''); }}
              className={`flex-1 py-2 rounded-xl font-extrabold text-sm capitalize transition-all ${
                mode === m
                  ? m === 'buy' ? 'bg-emerald-500 text-white shadow' : 'bg-rose-500 text-white shadow'
                  : 'text-muted-foreground'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Quantity input */}
        <div className="mb-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
            {isCrypto ? 'Amount (units)' : 'Shares'}
          </label>
          <div className="flex items-center gap-2 mt-1.5">
            <button
              onClick={() => setQty(q => Math.max(0, (parseFloat(q) || 0) - 1).toString())}
              className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              min="0"
              step={isCrypto ? '0.001' : '1'}
              value={qty}
              onChange={e => setQty(e.target.value)}
              className="flex-1 h-10 bg-muted rounded-xl px-4 text-center font-extrabold text-lg text-foreground outline-none border-2 border-transparent focus:border-primary"
              placeholder="0"
            />
            <button
              onClick={() => setQty(q => ((parseFloat(q) || 0) + 1).toString())}
              className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick-fill buttons */}
        <div className="flex gap-2 mb-5">
          {mode === 'buy'
            ? [25, 50, 75, 100].map(pct => (
                <button key={pct} onClick={() => {
                  const units = isCrypto
                    ? Math.floor(portfolio.cash * pct / 100 / price * 1000) / 1000
                    : Math.floor(portfolio.cash * pct / 100 / price);
                  setQty(units.toString());
                }}
                  className="flex-1 py-1.5 text-xs font-bold rounded-xl bg-muted text-muted-foreground hover:text-foreground"
                >
                  {pct}%
                </button>
              ))
            : [25, 50, 75, 100].map(pct => (
                <button key={pct} onClick={() => {
                  const units = isCrypto
                    ? Math.floor(held * pct / 100 * 1000) / 1000
                    : Math.floor(held * pct / 100);
                  setQty(units.toString());
                }}
                  className="flex-1 py-1.5 text-xs font-bold rounded-xl bg-muted text-muted-foreground hover:text-foreground"
                >
                  {pct}%
                </button>
              ))
          }
        </div>

        {/* Order summary */}
        <div className="bg-muted rounded-2xl p-4 mb-5 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Est. cost</span>
            <span className="font-extrabold text-foreground">${fmt(cost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{mode === 'buy' ? 'Cash after' : 'Cash after'}</span>
            <span className={`font-extrabold ${mode === 'buy' ? (canBuy ? 'text-foreground' : 'text-rose-500') : 'text-foreground'}`}>
              ${fmt(mode === 'buy' ? portfolio.cash - cost : portfolio.cash + cost)}
            </span>
          </div>
          {mode === 'sell' && held > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">You hold</span>
              <span className="font-bold text-foreground">{held} {asset.symbol}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => { onTrade(asset.id, mode, numQty, price); onClose(); }}
          disabled={!(mode === 'buy' ? canBuy : canSell)}
          className={`w-full h-14 rounded-2xl font-extrabold text-base text-white disabled:opacity-40 transition-all active:scale-[0.98] ${
            mode === 'buy' ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        >
          {mode === 'buy' ? `Buy ${numQty} ${asset.symbol}` : `Sell ${numQty} ${asset.symbol}`}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Main Portfolio page ────────────────────────────────────────────────────────
export default function Portfolio() {
  const { progress } = useUserProgress();
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState(loadPortfolio);
  const [tradeAsset, setTradeAsset] = useState(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('market'); // market | holdings | history
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const completedCount = (progress?.completed_lessons ?? []).length;
  const unlocked = completedCount >= UNLOCK_LESSONS;

  const loadPrices = useCallback(async (force = false) => {
    if (force) { clearPriceCache(); setRefreshing(true); }
    try {
      const data = await fetchAllPrices();
      setPrices(data);
      setLastUpdated(new Date());
    } catch { /* fallback already handled inside fetchAllPrices */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { if (unlocked) loadPrices(); }, [unlocked]);

  const handleTrade = useCallback((assetId, mode, qty, price) => {
    setPortfolio(prev => {
      const next = {
        ...prev,
        holdings: { ...prev.holdings },
        transactions: [...(prev.transactions ?? [])],
      };
      const held = prev.holdings[assetId] ?? { qty: 0, avgCost: 0 };

      if (mode === 'buy') {
        const totalCost = qty * price;
        const newQty = held.qty + qty;
        const newAvg = (held.qty * held.avgCost + totalCost) / newQty;
        next.holdings[assetId] = { qty: newQty, avgCost: newAvg };
        next.cash = prev.cash - totalCost;
      } else {
        const newQty = held.qty - qty;
        next.holdings[assetId] = { qty: newQty, avgCost: held.avgCost };
        if (newQty <= 0) delete next.holdings[assetId];
        next.cash = prev.cash + qty * price;
      }

      next.transactions.unshift({
        id: Date.now(),
        assetId,
        mode,
        qty,
        price,
        ts: new Date().toISOString(),
      });
      // Keep last 100 transactions
      if (next.transactions.length > 100) next.transactions = next.transactions.slice(0, 100);

      savePortfolio(next);
      return next;
    });
  }, []);

  // Portfolio value calculations
  const holdingsValue = Object.entries(portfolio.holdings).reduce((sum, [id, { qty }]) => {
    return sum + qty * (prices[id]?.price ?? 0);
  }, 0);
  const totalValue = portfolio.cash + holdingsValue;
  const totalReturn = totalValue - STARTING_CASH;
  const totalReturnPct = (totalReturn / STARTING_CASH) * 100;

  const filteredAssets = ASSETS.filter(a =>
    search === '' ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.symbol.toLowerCase().includes(search.toLowerCase())
  );

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-background pb-28 max-w-lg mx-auto px-4 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-3xl bg-muted flex items-center justify-center mb-6">
          <Lock className="w-12 h-12 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground mb-2">Portfolio Simulator</h1>
        <p className="text-muted-foreground mb-6 leading-relaxed max-w-xs">
          Trade real stocks, ETFs, and crypto with virtual money. Powered by live market data.
          Complete <strong>{UNLOCK_LESSONS} lessons</strong> to unlock.
        </p>
        <div className="w-full bg-card border border-border rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-foreground">Lessons completed</span>
            <span className="text-sm font-extrabold text-primary">{completedCount}/{UNLOCK_LESSONS}</span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (completedCount / UNLOCK_LESSONS) * 100)}%` }} />
          </div>
        </div>
        <Link to="/"><Button className="w-full h-14 font-extrabold rounded-2xl">Go to Learning Path →</Button></Link>
        <div className="mt-10 w-full grid grid-cols-2 gap-3">
          {[
            { icon: '📊', label: 'Live Prices', sub: 'Yahoo Finance + CoinGecko' },
            { icon: '💵', label: '$10,000 Start', sub: 'Virtual capital to invest' },
            { icon: '📈', label: '12 Assets', sub: 'Stocks, ETFs, crypto' },
            { icon: '📉', label: 'Real P&L', sub: 'Track gains & losses' },
          ].map(f => (
            <div key={f.label} className="bg-card border border-border rounded-2xl p-3 text-left opacity-60">
              <span className="text-2xl">{f.icon}</span>
              <p className="text-xs font-extrabold text-foreground mt-2">{f.label}</p>
              <p className="text-xs text-muted-foreground">{f.sub}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28 max-w-lg mx-auto">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-extrabold text-foreground">Portfolio</h1>
          <button
            onClick={() => loadPrices(true)}
            disabled={refreshing}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Portfolio value card */}
        <div className="bg-gradient-to-br from-primary via-violet-600 to-fuchsia-600 rounded-3xl p-6 text-white mb-4 shadow-xl">
          <p className="text-sm font-bold opacity-70 mb-1">Total Portfolio</p>
          <p className="text-4xl font-black mb-1">${fmt(totalValue)}</p>
          <div className="flex items-center gap-2">
            {totalReturn >= 0
              ? <TrendingUp className="w-4 h-4 text-emerald-300" />
              : <TrendingDown className="w-4 h-4 text-rose-300" />}
            <span className={`text-sm font-bold ${totalReturn >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {fmtDollar(totalReturn, true)} ({fmtPct(totalReturnPct)})
            </span>
            <span className="text-xs opacity-60 ml-auto">vs $10k start</span>
          </div>

          {/* Cash / Invested split */}
          <div className="flex gap-3 mt-4 text-xs">
            <div className="flex-1 bg-white/10 rounded-xl p-2.5">
              <p className="opacity-70">Cash</p>
              <p className="font-extrabold text-sm">${fmt(portfolio.cash)}</p>
            </div>
            <div className="flex-1 bg-white/10 rounded-xl p-2.5">
              <p className="opacity-70">Invested</p>
              <p className="font-extrabold text-sm">${fmt(holdingsValue)}</p>
            </div>
            <div className="flex-1 bg-white/10 rounded-xl p-2.5">
              <p className="opacity-70">Assets</p>
              <p className="font-extrabold text-sm">{Object.keys(portfolio.holdings).length}</p>
            </div>
          </div>
        </div>

        {lastUpdated && (
          <p className="text-[10px] text-muted-foreground text-right mb-2">
            Prices updated {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="px-4">
        <div className="flex bg-muted rounded-2xl p-1 mb-4">
          {[
            { id: 'market', label: 'Market' },
            { id: 'holdings', label: 'Holdings' },
            { id: 'history', label: 'History' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
                tab === t.id ? 'bg-card text-foreground shadow' : 'text-muted-foreground'
              }`}
            >
              {t.label}
              {t.id === 'holdings' && Object.keys(portfolio.holdings).length > 0 && (
                <span className="ml-1 text-[10px] font-extrabold text-primary">
                  {Object.keys(portfolio.holdings).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === 'market' && (
          <motion.div key="market" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4">
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search stocks, ETFs, crypto..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-10 bg-muted rounded-xl pl-9 pr-4 text-sm text-foreground outline-none"
              />
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Group by type */}
                {['stock', 'etf', 'crypto'].map(type => {
                  const typeAssets = filteredAssets.filter(a => a.type === type);
                  if (typeAssets.length === 0) return null;
                  return (
                    <div key={type}>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5 mt-2">
                        {type === 'stock' ? 'Stocks' : type === 'etf' ? 'ETFs' : 'Crypto'}
                      </p>
                      {typeAssets.map(asset => {
                        const p = prices[asset.id] ?? {};
                        const held = portfolio.holdings[asset.id];
                        const heldValue = held ? held.qty * (p.price ?? 0) : 0;
                        const pnl = held ? heldValue - held.qty * held.avgCost : 0;
                        return (
                          <button
                            key={asset.id}
                            onClick={() => setTradeAsset(asset)}
                            className="w-full bg-card border border-border rounded-2xl p-3.5 flex items-center gap-3 text-left active:scale-[0.98] transition-all hover:border-primary/30"
                          >
                            <span className="text-2xl shrink-0">{asset.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-sm text-foreground">{asset.symbol}</span>
                                <span className="font-extrabold text-sm text-foreground">
                                  {p.price ? `$${fmt(p.price)}` : '—'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-0.5">
                                <span className="text-xs text-muted-foreground truncate">{asset.name}</span>
                                {p.change !== undefined && <MiniChange change={p.change} />}
                              </div>
                              {held && held.qty > 0 && (
                                <div className={`text-[10px] font-bold mt-0.5 ${pnl >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                  {held.qty} held · {pnl >= 0 ? '+' : ''}${fmt(pnl)} P&L
                                </div>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'holdings' && (
          <motion.div key="holdings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4">
            {Object.keys(portfolio.holdings).length === 0 ? (
              <div className="text-center py-16">
                <span className="text-5xl mb-4 block">📊</span>
                <p className="font-extrabold text-foreground mb-2">No positions yet</p>
                <p className="text-sm text-muted-foreground">Tap Market to buy your first asset</p>
                <button onClick={() => setTab('market')} className="mt-4 text-sm font-bold text-primary">
                  Browse Market →
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(portfolio.holdings)
                  .filter(([, h]) => h.qty > 0)
                  .map(([id, holding]) => {
                    const asset = getAssetById(id);
                    if (!asset) return null;
                    const price = prices[id]?.price ?? 0;
                    const currentValue = holding.qty * price;
                    const costBasis = holding.qty * holding.avgCost;
                    const pnl = currentValue - costBasis;
                    const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
                    return (
                      <button
                        key={id}
                        onClick={() => setTradeAsset(asset)}
                        className="w-full bg-card border border-border rounded-2xl p-4 text-left active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{asset.emoji}</span>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-extrabold text-sm text-foreground">{asset.name}</p>
                                <p className="text-xs text-muted-foreground">{holding.qty} {asset.symbol} · avg ${fmt(holding.avgCost)}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-extrabold text-sm text-foreground">${fmt(currentValue)}</p>
                                <p className={`text-xs font-bold ${pnl >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                  {pnl >= 0 ? '+' : ''}{fmt(pnl)} ({fmtPct(pnlPct)})
                                </p>
                              </div>
                            </div>
                            {/* P&L bar */}
                            <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${pnl >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}
                                style={{ width: `${Math.min(100, Math.abs(pnlPct))}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                {/* Cash card */}
                <div className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💵</span>
                    <div className="flex-1">
                      <p className="font-extrabold text-sm text-foreground">Cash</p>
                      <p className="text-xs text-muted-foreground">Available to invest</p>
                    </div>
                    <p className="font-extrabold text-sm text-foreground">${fmt(portfolio.cash)}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {tab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4">
            {(portfolio.transactions ?? []).length === 0 ? (
              <div className="text-center py-16">
                <span className="text-5xl mb-4 block">📋</span>
                <p className="font-extrabold text-foreground mb-2">No transactions yet</p>
                <p className="text-sm text-muted-foreground">Your trades will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(portfolio.transactions ?? []).map(tx => {
                  const asset = getAssetById(tx.assetId);
                  if (!asset) return null;
                  const total = tx.qty * tx.price;
                  const date = new Date(tx.ts);
                  return (
                    <div key={tx.id} className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-3">
                      <span className="text-xl">{asset.emoji}</span>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="font-bold text-sm text-foreground">{asset.symbol}</span>
                          <span className={`text-xs font-extrabold ${tx.mode === 'buy' ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {tx.mode === 'buy' ? '▲ BUY' : '▼ SELL'}
                          </span>
                        </div>
                        <div className="flex justify-between mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {tx.qty} @ ${fmt(tx.price)} = ${fmt(total)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {date.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trade Modal */}
      <AnimatePresence>
        {tradeAsset && (
          <TradeModal
            asset={tradeAsset}
            price={prices[tradeAsset.id]?.price ?? 0}
            portfolio={portfolio}
            onClose={() => setTradeAsset(null)}
            onTrade={handleTrade}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
