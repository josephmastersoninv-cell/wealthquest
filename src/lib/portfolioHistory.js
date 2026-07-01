// Track portfolio value over time for the chart

const HISTORY_KEY = 'wealthquest_portfolio_history';
const MAX_POINTS = 90; // 90 days

export function recordPortfolioValue(totalValue) {
  const today = new Date().toISOString().slice(0, 10);
  const history = getPortfolioHistory();
  const last = history.at(-1);
  if (last?.date === today) {
    last.value = totalValue;
  } else {
    history.push({ date: today, value: totalValue });
    if (history.length > MAX_POINTS) history.shift();
  }
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch {}
}

export function getPortfolioHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]'); } catch { return []; }
}

export function getPortfolioReturn(history, startingCash) {
  if (!history.length) return 0;
  const current = history.at(-1).value;
  return ((current - startingCash) / startingCash) * 100;
}
