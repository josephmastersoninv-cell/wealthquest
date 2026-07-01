// Portfolio Score — gamified 0-100 investor rating

export function calcPortfolioScore({ holdings, prices, history, startingCash }) {
  let score = 0;
  const sectors = new Set();

  if (!holdings || holdings.length === 0) return { score: 20, grade: 'F', label: 'New Investor' };

  // Diversification (0-35): number of unique sectors
  holdings.forEach(h => {
    const asset = prices[h.assetId];
    if (asset) sectors.add(h.sector ?? 'Unknown');
  });
  const sectorCount = sectors.size;
  const diversityScore = Math.min(35, Math.round((sectorCount / 5) * 35));
  score += diversityScore;

  // Performance (0-35): portfolio return vs "expected" 10% benchmark
  const current = holdings.reduce((sum, h) => {
    const p = prices[h.assetId];
    return sum + (p ? p.price * h.shares : 0);
  }, 0);
  const returnPct = ((current - startingCash) / startingCash) * 100;
  const perfScore = Math.max(0, Math.min(35, 17.5 + returnPct * 0.7));
  score += perfScore;

  // Activity (0-20): number of holdings
  const activityScore = Math.min(20, holdings.length * 4);
  score += activityScore;

  // Consistency (0-10): number of history points / max
  const historyScore = Math.min(10, Math.round((history.length / 30) * 10));
  score += historyScore;

  score = Math.max(0, Math.min(100, Math.round(score)));

  const grade =
    score >= 90 ? 'S' :
    score >= 80 ? 'A' :
    score >= 70 ? 'B' :
    score >= 60 ? 'C' :
    score >= 50 ? 'D' : 'F';

  const label =
    score >= 90 ? 'Elite Investor' :
    score >= 80 ? 'Skilled Trader' :
    score >= 70 ? 'Rising Star' :
    score >= 60 ? 'Building Wealth' :
    score >= 50 ? 'Getting Started' : 'New Investor';

  return { score, grade, label, diversityScore, perfScore, activityScore, historyScore };
}

export function getGradeColor(grade) {
  return {
    S: 'text-amber-400',
    A: 'text-emerald-400',
    B: 'text-blue-400',
    C: 'text-orange-400',
    D: 'text-rose-400',
    F: 'text-muted-foreground',
  }[grade] ?? 'text-muted-foreground';
}
