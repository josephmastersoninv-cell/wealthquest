// ─── LESSON CONSTANTS ──────────────────────────────────────────────────────
export const LESSON_XP    = 30;
export const LESSON_COINS = 10;

// ─── COMPAT EXPORTS ────────────────────────────────────────────────────────
// Map bg-* color strings → theme object used by Learn.jsx
const COLOR_MAP = {
  'emerald': { light: 'bg-emerald-500/20', ring: 'ring-emerald-400', text: 'text-emerald-600 dark:text-emerald-300', border: 'border-emerald-400/40' },
  'teal':    { light: 'bg-teal-500/20',    ring: 'ring-teal-400',    text: 'text-teal-600 dark:text-teal-300',    border: 'border-teal-400/40' },
  'cyan':    { light: 'bg-cyan-500/20',    ring: 'ring-cyan-400',    text: 'text-cyan-600 dark:text-cyan-300',    border: 'border-cyan-400/40' },
  'green':   { light: 'bg-green-500/20',   ring: 'ring-green-400',   text: 'text-green-600 dark:text-green-300',  border: 'border-green-400/40' },
  'blue':    { light: 'bg-blue-500/20',    ring: 'ring-blue-400',    text: 'text-blue-600 dark:text-blue-300',    border: 'border-blue-400/40' },
  'indigo':  { light: 'bg-indigo-500/20',  ring: 'ring-indigo-400',  text: 'text-indigo-600 dark:text-indigo-300',border: 'border-indigo-400/40' },
  'violet':  { light: 'bg-violet-500/20',  ring: 'ring-violet-400',  text: 'text-violet-600 dark:text-violet-300',border: 'border-violet-400/40' },
  'purple':  { light: 'bg-purple-500/20',  ring: 'ring-purple-400',  text: 'text-purple-600 dark:text-purple-300',border: 'border-purple-400/40' },
  'pink':    { light: 'bg-pink-500/20',    ring: 'ring-pink-400',    text: 'text-pink-600 dark:text-pink-300',    border: 'border-pink-400/40' },
  'rose':    { light: 'bg-rose-500/20',    ring: 'ring-rose-400',    text: 'text-rose-600 dark:text-rose-300',    border: 'border-rose-400/40' },
  'red':     { light: 'bg-red-500/20',     ring: 'ring-red-400',     text: 'text-red-600 dark:text-red-300',      border: 'border-red-400/40' },
  'amber':   { light: 'bg-amber-500/20',   ring: 'ring-amber-400',   text: 'text-amber-600 dark:text-amber-300',  border: 'border-amber-400/40' },
  'orange':  { light: 'bg-orange-500/20',  ring: 'ring-orange-400',  text: 'text-orange-600 dark:text-orange-300',border: 'border-orange-400/40' },
  'yellow':  { light: 'bg-yellow-500/20',  ring: 'ring-yellow-400',  text: 'text-yellow-600 dark:text-yellow-300',border: 'border-yellow-400/40' },
};

function unitColorObj(colorStr) {
  // colorStr is like 'bg-emerald-600' or 'bg-indigo-900'
  const match = colorStr.match(/bg-([a-z]+)-/);
  const key = match ? match[1] : 'teal';
  const theme = COLOR_MAP[key] ?? COLOR_MAP['teal'];
  return { bg: colorStr, ...theme };
}

// Proxy so LESSON_COLORS[unit.color] works
export const LESSON_COLORS = new Proxy({}, {
  get(_, color) { return unitColorObj(color); }
});

export const TOTAL_LESSONS = 400; // 100 units × 4 lessons

export function isLessonUnlocked(lessonId, completedLessons) {
  for (const unit of UNITS) {
    const idx = unit.lessons.findIndex(l => l.id === lessonId);
    if (idx === -1) continue;
    if (idx === 0) {
      // First lesson of first unit is always unlocked
      if (unit.id === 1) return true;
      // First lesson of other units: previous unit's last lesson must be done
      const prevUnit = UNITS[unit.id - 2];
      if (!prevUnit) return true;
      return completedLessons.includes(prevUnit.lessons[prevUnit.lessons.length - 1].id);
    }
    return completedLessons.includes(unit.lessons[idx - 1].id);
  }
  return false;
}

export function getLessonStars(lessonId, lessonStars) {
  return lessonStars?.[lessonId] ?? 0;
}

export function scoreToStars(correct, total) {
  if (correct === total) return 3;
  if (correct >= Math.ceil(total * 0.8)) return 2;
  if (correct >= 4) return 1;
  return 0;
}

// ─── CHAPTER EXAM DEFINITIONS ──────────────────────────────────────────────
export const CHAPTER_EXAMS = [
  {
    id: 'chapter-exam-1', chapter: 1, afterUnit: 10,
    title: 'Chapter 1 Boss Exam', subtitle: 'Money Foundations',
    description: "Prove you've mastered the fundamentals of personal finance. 25 questions. No mercy.",
    icon: '💰', color: 'from-emerald-600 to-teal-800',
    termIds: ['budget','net-worth','compound-interest','savings-rate','credit-score','emergency-fund','debt','apr','inflation','time-value-of-money','asset','liability','equity','diversification','risk','return','investment','dollar-cost-averaging','index-fund','financial-independence','rule-of-72','purchasing-power','opportunity-cost','income','liquidity'],
    xpReward: 1000, coinsReward: 500,
  },
  {
    id: 'chapter-exam-2', chapter: 2, afterUnit: 20,
    title: 'Chapter 2 Boss Exam', subtitle: 'Stock Market Mastery',
    description: '25 questions across the full stock market universe. Show you know your equities from your derivatives.',
    icon: '📈', color: 'from-violet-600 to-purple-900',
    termIds: ['equity','pe-ratio','earnings-per-share','market-cap','dividends','fundamental-analysis','technical-analysis','ipo','short-selling','options','call-option','put-option','beta','alpha','sharpe-ratio','momentum-investing','value-investing','growth-investing','candlestick','rsi','macd','bollinger-bands','loss-aversion','herding','market-efficiency'],
    xpReward: 1200, coinsReward: 600,
  },
  {
    id: 'chapter-exam-3', chapter: 3, afterUnit: 30,
    title: 'Chapter 3 Boss Exam', subtitle: 'Fixed Income & Bonds',
    description: '25 questions on bonds, rates, and credit markets. The bond market moves trillions — prove you move with it.',
    icon: '🏛️', color: 'from-blue-600 to-indigo-900',
    termIds: ['bonds','yield','coupon','duration','yield-curve','government-bonds','corporate-bond','credit-rating','high-yield-bond','inflation-protected-bond','zero-coupon-bond','convertible-bond','callable-bond','duration-risk','sovereign-debt','credit-spread','yield-spread','federal-reserve','monetary-policy','quantitative-easing','interest-rate','default','credit-default-swap','interest-rate-swap','amortization'],
    xpReward: 1400, coinsReward: 700,
  },
  {
    id: 'chapter-exam-4', chapter: 4, afterUnit: 40,
    title: 'Chapter 4 Boss Exam', subtitle: 'Funds & Portfolio Theory',
    description: '25 questions on portfolio construction, fund selection, and modern portfolio theory.',
    icon: '🧺', color: 'from-green-600 to-emerald-900',
    termIds: ['mutual-fund','etf','index-fund','expense-ratio','benchmark','alpha','beta','sharpe-ratio','sortino-ratio','information-ratio','modern-portfolio-theory','efficient-frontier','correlation','asset-allocation','diversification','rebalancing','factor-investing','risk-parity','target-date-fund','safe-withdrawal-rate','four-percent-rule','tax-loss-harvesting','tracking-error','hedge-fund','private-equity'],
    xpReward: 1500, coinsReward: 750,
  },
  {
    id: 'chapter-exam-5', chapter: 5, afterUnit: 50,
    title: 'Chapter 5 Boss Exam', subtitle: 'The Behavioural Edge',
    description: '25 questions on the psychology of money. Know your biases. Know yourself.',
    icon: '🧠', color: 'from-amber-500 to-orange-800',
    termIds: ['loss-aversion','anchoring','confirmation-bias','recency-bias','overconfidence','herding','sunk-cost-fallacy','disposition-effect','market-sentiment','black-swan','tail-risk','contrarian-investing','financial-independence','fire-movement','savings-rate','compound-interest','buy-and-hold','dollar-cost-averaging','mean-reversion','momentum-investing','value-investing','market-efficiency','debt-snowball','debt-avalanche','credit-utilization'],
    xpReward: 1600, coinsReward: 800,
  },
  {
    id: 'chapter-exam-6', chapter: 6, afterUnit: 60,
    title: 'Chapter 6 Boss Exam', subtitle: 'Advanced Trading',
    description: '25 questions. Derivatives, leverage, algorithmic trading — the deep end of the pool.',
    icon: '⚡', color: 'from-red-600 to-rose-900',
    termIds: ['derivatives','options','futures','call-option','put-option','implied-volatility','delta','leverage','margin-account','short-selling','pairs-trading','algorithmic-trading','hft','dark-pool','vwap','swing-trading','day-trading','trend-following','mean-reversion','credit-default-swap','interest-rate-swap','covered-call','arbitrage','drawdown','value-at-risk'],
    xpReward: 1800, coinsReward: 900,
  },
  {
    id: 'chapter-exam-7', chapter: 7, afterUnit: 70,
    title: 'Chapter 7 Boss Exam', subtitle: 'Corporate & Business Finance',
    description: '25 questions spanning M&A, valuation, startup finance, and ESG. Think like a CFO.',
    icon: '🏗️', color: 'from-yellow-500 to-amber-800',
    termIds: ['capital-structure','wacc','dcf','ebitda','free-cash-flow','revenue','profit-margin','gross-margin','roe','leveraged-buyout','goodwill','due-diligence','cap-table','vesting','angel-investor','seed-funding','series-a','burn-rate','runway','spac','esg','green-bond','net-zero','financial-regulation','financial-modeling'],
    xpReward: 2000, coinsReward: 1000,
  },
  {
    id: 'chapter-exam-8', chapter: 8, afterUnit: 80,
    title: 'Chapter 8 Boss Exam', subtitle: 'Crypto & Alternative Assets',
    description: '25 questions on the new financial frontier — crypto, DeFi, NFTs, real assets, and private markets.',
    icon: '₿', color: 'from-purple-600 to-pink-900',
    termIds: ['bitcoin','ethereum','blockchain','cryptocurrency','smart-contract','defi','dao','liquidity-pool','yield-farming','tokenomics','gas-fees','digital-wallet','layer2','stablecoin','nft','proof-of-work','proof-of-stake','cbdc','alternative-assets','commodities','real-estate-invest','private-equity','venture-capital','hedge-fund','noi'],
    xpReward: 2200, coinsReward: 1100,
  },
  {
    id: 'chapter-exam-9', chapter: 9, afterUnit: 90,
    title: 'Chapter 9 Boss Exam', subtitle: 'Global Markets & Macro',
    description: '25 questions spanning monetary policy, global trade, currency markets, and geopolitics.',
    icon: '🌍', color: 'from-teal-600 to-cyan-900',
    termIds: ['gdp','inflation','monetary-policy','fiscal-policy','federal-reserve','quantitative-easing','yield-curve','recession','exchange-rate','purchasing-power-parity','current-account','trade-balance','sovereign-debt','reserve-currency','geopolitical-risk','currency-hedging','foreign-direct-investment','emerging-market','economic-indicators','unemployment-rate','cpi','stagflation','sector-rotation','tactical-allocation','thematic-investing'],
    xpReward: 2400, coinsReward: 1200,
  },
  {
    id: 'chapter-exam-10', chapter: 10, afterUnit: 100,
    title: 'FINAL BOSS EXAM', subtitle: 'The Ultimate Mastery Challenge',
    description: "You've studied 100 units. Now prove everything. 25 expert-level questions across the full curriculum. Legendary status awaits.",
    icon: '🏆', color: 'from-indigo-600 via-purple-700 to-black',
    termIds: ['capm','modern-portfolio-theory','efficient-frontier','wacc','dcf','credit-default-swap','interest-rate-swap','value-at-risk','monte-carlo-simulation','longevity-risk','sequence-of-returns','four-percent-rule','tax-loss-harvesting','roth-conversion','estate-tax','step-up-basis','leverage','counterparty-risk','systematic-risk','tail-risk','stranded-assets','stakeholder-capitalism','financial-modeling','purchasing-power-parity','basis-point'],
    xpReward: 5000, coinsReward: 2500,
  },
];

// ─── 100 UNITS ─────────────────────────────────────────────────────────────
export const UNITS = [
  // ══════════════════════════════════════════════════════════════════
  // CHAPTER 1 — MONEY FOUNDATIONS  (Units 1–10)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 1, chapter: 1, title: 'Money Foundations', icon: '💰', color: 'bg-emerald-600',
    description: 'Build the bedrock — what money is, how it flows, and why it matters.',
    lessons: [
      { id: 'lesson-1-1', title: 'What Is Money?',          termIds: ['asset','income','budget','net-worth','liability','equity'] },
      { id: 'lesson-1-2', title: 'Earning & Spending',      termIds: ['gross-income','net-income','savings-rate','opportunity-cost','compound-interest','simple-interest'] },
      { id: 'lesson-1-3', title: 'Debt & Credit Basics',    termIds: ['debt','credit-score','apr','interest-rate','amortization','collateral'] },
      { id: 'lesson-1-4', title: 'Your Financial Blueprint',termIds: ['budget','emergency-fund','financial-independence','savings-rate','net-worth','time-value-of-money'] },
    ],
  },
  {
    id: 2, chapter: 1, title: 'Savings & Banking', icon: '🏦', color: 'bg-teal-600',
    description: 'Master the art of saving — emergency funds, high-yield accounts, and smart banking.',
    lessons: [
      { id: 'lesson-2-1', title: 'The Emergency Fund',      termIds: ['emergency-fund','savings-rate','money-market-account','certificate-of-deposit','liquidity','risk'] },
      { id: 'lesson-2-2', title: 'Saving Strategies',       termIds: ['debt-snowball','debt-avalanche','compound-interest','simple-interest','rule-of-72','time-value-of-money'] },
      { id: 'lesson-2-3', title: 'Banking Products',        termIds: ['certificate-of-deposit','money-market-account','savings-rate','net-income','credit-score','liquidity'] },
      { id: 'lesson-2-4', title: 'Smart Borrowing',         termIds: ['heloc','mortgage','amortization','ltv','collateral','interest-rate'] },
    ],
  },
  {
    id: 3, chapter: 1, title: 'Credit Mastery', icon: '💳', color: 'bg-cyan-600',
    description: 'Understand credit scores, credit cards, and how to borrow without getting burned.',
    lessons: [
      { id: 'lesson-3-1', title: 'Your Credit Score',       termIds: ['credit-score','credit-rating','credit-utilization','apr','balance-transfer','debt'] },
      { id: 'lesson-3-2', title: 'Managing Debt',           termIds: ['debt-snowball','debt-avalanche','refinancing','heloc','apr','amortization'] },
      { id: 'lesson-3-3', title: 'Borrowing Wisely',        termIds: ['mortgage','ltv','collateral','leverage','debt-to-equity','interest-rate'] },
      { id: 'lesson-3-4', title: 'Building Great Credit',   termIds: ['credit-score','credit-utilization','credit-rating','balance-transfer','apr','emergency-fund'] },
    ],
  },
  {
    id: 4, chapter: 1, title: 'Net Worth & Wealth', icon: '💎', color: 'bg-green-700',
    description: 'Calculate your net worth and build a framework for long-term wealth creation.',
    lessons: [
      { id: 'lesson-4-1', title: 'Assets vs Liabilities',   termIds: ['asset','liability','net-worth','equity','portfolio','balance-sheet'] },
      { id: 'lesson-4-2', title: 'Building Net Worth',      termIds: ['savings-rate','compound-interest','investment','return','asset-allocation','diversification'] },
      { id: 'lesson-4-3', title: 'Income & Revenue',        termIds: ['income','gross-income','net-income','revenue','profit-margin','earnings-per-share'] },
      { id: 'lesson-4-4', title: 'Cash Flow Basics',        termIds: ['budget','net-income','working-capital','free-cash-flow','savings-rate','opportunity-cost'] },
    ],
  },
  {
    id: 5, chapter: 1, title: 'Time Value of Money', icon: '⏰', color: 'bg-emerald-700',
    description: 'A dollar today is worth more than a dollar tomorrow — learn why and use it to your advantage.',
    lessons: [
      { id: 'lesson-5-1', title: 'Compound Interest',       termIds: ['compound-interest','simple-interest','rule-of-72','time-value-of-money','return','investment'] },
      { id: 'lesson-5-2', title: 'Future & Present Value',  termIds: ['npv','irr','dcf','payback-period','return','compound-interest'] },
      { id: 'lesson-5-3', title: "Inflation's Impact",       termIds: ['inflation','purchasing-power','cpi','monetary-policy','compound-interest','savings-rate'] },
      { id: 'lesson-5-4', title: 'The Power of Time',       termIds: ['time-value-of-money','compound-interest','rule-of-72','dollar-cost-averaging','return','financial-independence'] },
    ],
  },
  {
    id: 6, chapter: 1, title: 'Investment Basics', icon: '📈', color: 'bg-teal-700',
    description: 'Take your first steps into investing — what assets exist, how risk works, and where to start.',
    lessons: [
      { id: 'lesson-6-1', title: 'What Is Investing?',      termIds: ['investment','asset','return','risk','portfolio','diversification'] },
      { id: 'lesson-6-2', title: 'Asset Classes',           termIds: ['stocks','bonds','etf','real-estate-invest','commodities','alternative-assets'] },
      { id: 'lesson-6-3', title: 'Risk vs Return',          termIds: ['risk','return','volatility','beta','risk-premium','risk-free-rate'] },
      { id: 'lesson-6-4', title: 'Getting Started',         termIds: ['dollar-cost-averaging','index-fund','asset-allocation','diversification','compound-interest','buy-and-hold'] },
    ],
  },
  {
    id: 7, chapter: 1, title: 'Stock Market 101', icon: '📊', color: 'bg-green-600',
    description: 'How the stock market actually works — from how shares are traded to what drives prices.',
    lessons: [
      { id: 'lesson-7-1', title: 'What Are Stocks?',        termIds: ['equity','dividends','dividend-yield','stock-exchange','ipo','market-cap'] },
      { id: 'lesson-7-2', title: 'How Markets Work',        termIds: ['stock-exchange','market-order','limit-order','bid-ask-spread','volume','market-liquidity'] },
      { id: 'lesson-7-3', title: 'Reading a Stock',         termIds: ['earnings-per-share','pe-ratio','market-cap','price-to-book','peg-ratio','revenue'] },
      { id: 'lesson-7-4', title: 'Market Players',          termIds: ['market-making','dark-pool','hft','short-selling','long-position','market-sentiment'] },
    ],
  },
  {
    id: 8, chapter: 1, title: 'Bonds Basics', icon: '🏛️', color: 'bg-cyan-700',
    description: 'Fixed income 101 — what bonds are, how they pay, and why they belong in a portfolio.',
    lessons: [
      { id: 'lesson-8-1', title: 'What Are Bonds?',         termIds: ['bonds','coupon','face-value','yield','government-bonds','corporate-bond'] },
      { id: 'lesson-8-2', title: 'Bond Mechanics',          termIds: ['duration','yield-curve','interest-rate','credit-rating','amortization','bonds'] },
      { id: 'lesson-8-3', title: 'Bond Types',              termIds: ['government-bonds','corporate-bond','high-yield-bond','inflation-protected-bond','zero-coupon-bond','convertible-bond'] },
      { id: 'lesson-8-4', title: 'Bond Risks',              termIds: ['duration-risk','callable-bond','default','credit-rating','yield-spread','sovereign-debt'] },
    ],
  },
  {
    id: 9, chapter: 1, title: 'Funds & ETFs', icon: '🧺', color: 'bg-emerald-600',
    description: 'Index funds and ETFs changed investing forever — learn how they work and how to use them.',
    lessons: [
      { id: 'lesson-9-1', title: 'Fund Fundamentals',       termIds: ['mutual-fund','etf','index-fund','nav','expense-ratio','asset-class'] },
      { id: 'lesson-9-2', title: 'Active vs Passive',       termIds: ['index-fund','etf','mutual-fund','hedge-fund','alpha','benchmark'] },
      { id: 'lesson-9-3', title: 'Fund Metrics',            termIds: ['expense-ratio','tracking-error','benchmark','sharpe-ratio','alpha','beta'] },
      { id: 'lesson-9-4', title: 'Choosing Funds',          termIds: ['expense-ratio','index-fund','asset-allocation','diversification','rebalancing','dollar-cost-averaging'] },
    ],
  },
  {
    id: 10, chapter: 1, title: 'Risk & Diversification', icon: '⚠️', color: 'bg-teal-800',
    description: 'The only free lunch in finance — diversification. Understand risk types and how to manage them.',
    lessons: [
      { id: 'lesson-10-1', title: 'Types of Risk',               termIds: ['risk','volatility','beta','market-risk','systematic-risk','unsystematic-risk'] },
      { id: 'lesson-10-2', title: 'The Power of Diversification', termIds: ['diversification','correlation','asset-allocation','portfolio','efficient-frontier','modern-portfolio-theory'] },
      { id: 'lesson-10-3', title: 'Hedging & Black Swans',        termIds: ['hedging','risk-premium','sharpe-ratio','drawdown','tail-risk','black-swan'] },
      { id: 'lesson-10-4', title: 'Risk-Adjusted Returns',        termIds: ['sharpe-ratio','sortino-ratio','alpha','beta','information-ratio','value-at-risk'] },
    ],
  },
  // ══════════════════════════════════════════════════════════════════
  // CHAPTER 2 — STOCK MARKET MASTERY  (Units 11–20)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 11, chapter: 2, title: 'Equity Deep Dive', icon: '🔬', color: 'bg-violet-600',
    description: 'Go deep on stocks — shareholder rights, valuation, and financial statement analysis.',
    lessons: [
      { id: 'lesson-11-1', title: 'Shareholder Rights',     termIds: ['equity','dividends','share-buyback','share-dilution','earnings-per-share','dividend-yield'] },
      { id: 'lesson-11-2', title: 'Stock Valuation',        termIds: ['pe-ratio','peg-ratio','price-to-book','ev-ebitda','dcf','free-cash-flow'] },
      { id: 'lesson-11-3', title: 'Growth vs Value',        termIds: ['growth-investing','value-investing','pe-ratio','peg-ratio','earnings-per-share','free-cash-flow'] },
      { id: 'lesson-11-4', title: 'Reading Financials',     termIds: ['income-statement','balance-sheet','free-cash-flow','ebitda','earnings-per-share','revenue'] },
    ],
  },
  {
    id: 12, chapter: 2, title: 'Fundamental Analysis', icon: '🔍', color: 'bg-purple-700',
    description: 'Read between the financial statement lines — find undervalued companies before the market does.',
    lessons: [
      { id: 'lesson-12-1', title: 'FA Toolkit',             termIds: ['fundamental-analysis','income-statement','balance-sheet','free-cash-flow','ebitda','earnings-per-share'] },
      { id: 'lesson-12-2', title: 'Valuation Methods',      termIds: ['pe-ratio','ev-ebitda','price-to-book','dcf','peg-ratio','roe'] },
      { id: 'lesson-12-3', title: 'Business Quality',       termIds: ['roe','free-cash-flow','profit-margin','gross-margin','ebitda','capital-gain'] },
      { id: 'lesson-12-4', title: 'Competitive Moats',      termIds: ['market-cap','roe','profit-margin','earnings-per-share','revenue','dividend-yield'] },
    ],
  },
  {
    id: 13, chapter: 2, title: 'Technical Analysis', icon: '📉', color: 'bg-indigo-600',
    description: 'Chart patterns, indicators, and signals — learn to read price action like a professional trader.',
    lessons: [
      { id: 'lesson-13-1', title: 'Chart Reading Basics',   termIds: ['technical-analysis','candlestick','volume','moving-average','support','resistance'] },
      { id: 'lesson-13-2', title: 'Support & Resistance',   termIds: ['support','resistance','candlestick','moving-average','bollinger-bands','volume'] },
      { id: 'lesson-13-3', title: 'Momentum Indicators',    termIds: ['rsi','macd','bollinger-bands','moving-average','volume','vwap'] },
      { id: 'lesson-13-4', title: 'Technical Trading',      termIds: ['swing-trading','day-trading','momentum-investing','trend-following','support','resistance'] },
    ],
  },
  {
    id: 14, chapter: 2, title: 'Market Psychology', icon: '🧠', color: 'bg-violet-700',
    description: 'Why markets overshoot and undershoot — the behavioural forces behind every bubble and crash.',
    lessons: [
      { id: 'lesson-14-1', title: 'Cognitive Biases',       termIds: ['loss-aversion','anchoring','confirmation-bias','recency-bias','overconfidence','herding'] },
      { id: 'lesson-14-2', title: 'Fear & Greed',           termIds: ['market-sentiment','loss-aversion','herding','black-swan','recency-bias','sunk-cost-fallacy'] },
      { id: 'lesson-14-3', title: 'Investor Mistakes',      termIds: ['disposition-effect','anchoring','overconfidence','confirmation-bias','sunk-cost-fallacy','loss-aversion'] },
      { id: 'lesson-14-4', title: 'Thinking Rationally',    termIds: ['contrarian-investing','buy-and-hold','dollar-cost-averaging','market-sentiment','loss-aversion','recency-bias'] },
    ],
  },
  {
    id: 15, chapter: 2, title: 'IPOs & New Issues', icon: '🚀', color: 'bg-purple-600',
    description: 'How companies go public — the IPO process, SPACs, and how to evaluate new listings.',
    lessons: [
      { id: 'lesson-15-1', title: 'The IPO Process',        termIds: ['ipo','market-cap','stock-exchange','equity','share-dilution','investment'] },
      { id: 'lesson-15-2', title: 'SPACs & Alternatives',   termIds: ['spac','ipo','market-cap','private-equity','venture-capital','equity-crowdfunding'] },
      { id: 'lesson-15-3', title: 'Pre-IPO Investing',      termIds: ['venture-capital','angel-investor','seed-funding','series-a','cap-table','vesting'] },
      { id: 'lesson-15-4', title: 'Evaluating New Issues',  termIds: ['ipo','pe-ratio','market-cap','earnings-per-share','market-sentiment','fundamental-analysis'] },
    ],
  },
  {
    id: 16, chapter: 2, title: 'Dividends & Income', icon: '💸', color: 'bg-indigo-700',
    description: 'Build a stream of passive income — dividends, REITs, and income investing strategies.',
    lessons: [
      { id: 'lesson-16-1', title: 'Dividend Basics',        termIds: ['dividends','dividend-yield','earnings-per-share','share-buyback','free-cash-flow','equity'] },
      { id: 'lesson-16-2', title: 'Income Investing',       termIds: ['dividends','dividend-yield','high-yield-bond','bonds','coupon','income'] },
      { id: 'lesson-16-3', title: 'REITs & Property Income',termIds: ['real-estate-invest','rental-yield','noi','cap-rate','real-estate-appreciation','income'] },
      { id: 'lesson-16-4', title: 'Dividend Growth',        termIds: ['dividend-yield','earnings-per-share','free-cash-flow','growth-investing','pe-ratio','value-investing'] },
    ],
  },
  {
    id: 17, chapter: 2, title: 'Derivatives 101', icon: '🔄', color: 'bg-violet-800',
    description: 'Options, futures, and the instruments that give professional traders their edge.',
    lessons: [
      { id: 'lesson-17-1', title: 'Options Fundamentals',   termIds: ['options','call-option','put-option','strike-price','implied-volatility','derivatives'] },
      { id: 'lesson-17-2', title: 'Options Strategies',     termIds: ['covered-call','put-option','call-option','hedging','implied-volatility','options'] },
      { id: 'lesson-17-3', title: 'Futures & Forwards',     termIds: ['futures','derivatives','hedging','commodities','leverage','margin-account'] },
      { id: 'lesson-17-4', title: 'Short Selling',          termIds: ['short-selling','long-position','margin-account','leverage','derivatives','risk'] },
    ],
  },
  {
    id: 18, chapter: 2, title: 'Portfolio Management', icon: '📊', color: 'bg-purple-800',
    description: 'Construct and manage a portfolio with precision — allocation, rebalancing, and performance.',
    lessons: [
      { id: 'lesson-18-1', title: 'Building a Portfolio',   termIds: ['portfolio','asset-allocation','diversification','rebalancing','correlation','modern-portfolio-theory'] },
      { id: 'lesson-18-2', title: 'Allocation Strategies',  termIds: ['asset-allocation','risk','return','asset-class','tactical-allocation','sector-rotation'] },
      { id: 'lesson-18-3', title: 'Rebalancing',            termIds: ['rebalancing','asset-allocation','target-date-fund','dollar-cost-averaging','expense-ratio','tracking-error'] },
      { id: 'lesson-18-4', title: 'Performance Measurement',termIds: ['benchmark','alpha','beta','sharpe-ratio','information-ratio','sortino-ratio'] },
    ],
  },
  {
    id: 19, chapter: 2, title: 'Market Efficiency', icon: '⚡', color: 'bg-indigo-800',
    description: 'Can you beat the market? The EMH debate, market anomalies, and where alpha hides.',
    lessons: [
      { id: 'lesson-19-1', title: 'The EMH Theory',         termIds: ['market-efficiency','fundamental-analysis','technical-analysis','alpha','benchmark','price-discovery'] },
      { id: 'lesson-19-2', title: 'Active vs Passive',      termIds: ['index-fund','etf','alpha','benchmark','expense-ratio','tracking-error'] },
      { id: 'lesson-19-3', title: 'Market Anomalies',       termIds: ['momentum-investing','factor-investing','value-investing','market-efficiency','alpha','contrarian-investing'] },
      { id: 'lesson-19-4', title: 'Market Microstructure',  termIds: ['price-discovery','market-making','dark-pool','hft','bid-ask-spread','market-liquidity'] },
    ],
  },
  {
    id: 20, chapter: 2, title: 'Advanced Stock Strategies', icon: '♟️', color: 'bg-violet-900',
    description: 'Factor investing, algorithmic trading, and the quantitative edge used by elite funds.',
    lessons: [
      { id: 'lesson-20-1', title: 'Factor Investing',       termIds: ['factor-investing','alpha','beta','momentum-investing','value-investing','market-efficiency'] },
      { id: 'lesson-20-2', title: 'Pairs & Arbitrage',      termIds: ['pairs-trading','arbitrage','algorithmic-trading','hft','dark-pool','market-making'] },
      { id: 'lesson-20-3', title: 'Algorithmic Trading',    termIds: ['hft','algorithmic-trading','market-making','vwap','bid-ask-spread','market-liquidity'] },
      { id: 'lesson-20-4', title: 'Quantitative Methods',   termIds: ['algorithmic-trading','factor-investing','pairs-trading','risk-parity','mean-reversion','trend-following'] },
    ],
  },
  // ══════════════════════════════════════════════════════════════════
  // CHAPTER 3 — FIXED INCOME & BONDS  (Units 21–30)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 21, chapter: 3, title: 'Bond Deep Dive', icon: '🏦', color: 'bg-blue-700',
    description: 'Master bond mechanics — pricing, duration, and yield relationships.',
    lessons: [
      { id: 'lesson-21-1', title: 'Bond Anatomy',           termIds: ['bonds','coupon','face-value','yield','duration','amortization'] },
      { id: 'lesson-21-2', title: 'The Yield Curve',        termIds: ['yield-curve','interest-rate','bonds','government-bonds','monetary-policy','federal-reserve'] },
      { id: 'lesson-21-3', title: 'Duration & Sensitivity', termIds: ['duration','duration-risk','yield','bonds','interest-rate','zero-coupon-bond'] },
      { id: 'lesson-21-4', title: 'Bond Pricing',           termIds: ['bonds','yield','coupon','face-value','duration-risk','interest-rate'] },
    ],
  },
  {
    id: 22, chapter: 3, title: 'Government Bonds', icon: '🏛️', color: 'bg-blue-800',
    description: "The world's safest assets — Treasuries, gilts, bunds, and how they shape markets.",
    lessons: [
      { id: 'lesson-22-1', title: 'Treasury Securities',    termIds: ['government-bonds','bonds','yield','risk-free-rate','inflation-protected-bond','monetary-policy'] },
      { id: 'lesson-22-2', title: 'Sovereign Debt',         termIds: ['sovereign-debt','government-bonds','fiscal-policy','gdp','default','credit-rating'] },
      { id: 'lesson-22-3', title: 'Global Government Bonds',termIds: ['sovereign-debt','reserve-currency','exchange-rate','foreign-direct-investment','yield','currency-hedging'] },
      { id: 'lesson-22-4', title: 'Central Bank Policy',    termIds: ['federal-reserve','monetary-policy','quantitative-easing','interest-rate','yield-curve','inflation'] },
    ],
  },
  {
    id: 23, chapter: 3, title: 'Corporate Bonds', icon: '🏗️', color: 'bg-indigo-700',
    description: 'Corporate debt — credit analysis, ratings, spreads, and the high-yield universe.',
    lessons: [
      { id: 'lesson-23-1', title: 'Corporate Bond Basics',  termIds: ['corporate-bond','credit-rating','yield-spread','bonds','high-yield-bond','default'] },
      { id: 'lesson-23-2', title: 'Credit Analysis',        termIds: ['credit-rating','ebitda','debt-to-equity','leverage','free-cash-flow','default'] },
      { id: 'lesson-23-3', title: 'High Yield Bonds',       termIds: ['high-yield-bond','credit-rating','yield-spread','credit-spread','default','risk'] },
      { id: 'lesson-23-4', title: 'Investment Grade',       termIds: ['corporate-bond','credit-rating','credit-spread','bonds','yield','sharpe-ratio'] },
    ],
  },
  {
    id: 24, chapter: 3, title: 'Fixed Income Strategies', icon: '📐', color: 'bg-blue-600',
    description: 'Bond ladders, barbell strategies, and professional fixed income portfolio management.',
    lessons: [
      { id: 'lesson-24-1', title: 'Bond Laddering',         termIds: ['bonds','duration','yield','certificate-of-deposit','compound-interest','callable-bond'] },
      { id: 'lesson-24-2', title: 'Interest Rate Risk',     termIds: ['duration-risk','yield','interest-rate','bonds','monetary-policy','federal-reserve'] },
      { id: 'lesson-24-3', title: 'Inflation Protection',   termIds: ['inflation-protected-bond','inflation','purchasing-power','cpi','government-bonds','yield'] },
      { id: 'lesson-24-4', title: 'Total Return Strategies',termIds: ['bonds','yield','coupon','duration-risk','credit-spread','yield-spread'] },
    ],
  },
  {
    id: 25, chapter: 3, title: 'Mortgage & Real Estate Finance', icon: '🏠', color: 'bg-blue-700',
    description: 'How mortgages work, real estate finance, and why property is a unique asset class.',
    lessons: [
      { id: 'lesson-25-1', title: 'Mortgage Basics',        termIds: ['mortgage','amortization','ltv','interest-rate','refinancing','collateral'] },
      { id: 'lesson-25-2', title: 'Real Estate Investing',  termIds: ['real-estate-invest','rental-yield','noi','cap-rate','real-estate-appreciation','house-hacking'] },
      { id: 'lesson-25-3', title: 'Real Estate Finance',    termIds: ['heloc','mortgage','ltv','cash-on-cash','leverage','exchange-1031'] },
      { id: 'lesson-25-4', title: 'REITs',                  termIds: ['real-estate-invest','rental-yield','noi','cap-rate','diversification','income'] },
    ],
  },
  {
    id: 26, chapter: 3, title: 'Special Bond Structures', icon: '🔄', color: 'bg-indigo-800',
    description: 'Convertibles, zero coupons, callable bonds — the exotic side of fixed income.',
    lessons: [
      { id: 'lesson-26-1', title: 'Convertible Bonds',      termIds: ['convertible-bond','bonds','equity','strike-price','call-option','derivatives'] },
      { id: 'lesson-26-2', title: 'Zero Coupon Bonds',      termIds: ['zero-coupon-bond','bonds','duration-risk','compound-interest','face-value','yield'] },
      { id: 'lesson-26-3', title: 'Callable Bonds',         termIds: ['callable-bond','bonds','interest-rate','refinancing','yield','duration-risk'] },
      { id: 'lesson-26-4', title: 'Inflation-Linked Bonds', termIds: ['inflation-protected-bond','inflation','cpi','purchasing-power','bonds','yield'] },
    ],
  },
  {
    id: 27, chapter: 3, title: 'Credit Markets', icon: '💳', color: 'bg-blue-900',
    description: 'Deep inside credit markets — CDS, spreads, and credit risk management.',
    lessons: [
      { id: 'lesson-27-1', title: 'Credit Ratings Deep Dive',termIds: ['credit-rating','default','high-yield-bond','corporate-bond','credit-spread','risk'] },
      { id: 'lesson-27-2', title: 'Credit Derivatives',     termIds: ['credit-default-swap','derivatives','counterparty-risk','credit-rating','default','hedging'] },
      { id: 'lesson-27-3', title: 'Credit Spread Analysis', termIds: ['credit-spread','yield-spread','corporate-bond','high-yield-bond','risk-premium','bonds'] },
      { id: 'lesson-27-4', title: 'Credit Risk Management', termIds: ['credit-rating','credit-default-swap','counterparty-risk','default','risk','hedging'] },
    ],
  },
  {
    id: 28, chapter: 3, title: 'Central Banks & Policy', icon: '🏦', color: 'bg-indigo-900',
    description: 'The most powerful institutions in global finance — how central banks move markets.',
    lessons: [
      { id: 'lesson-28-1', title: 'The Federal Reserve',    termIds: ['federal-reserve','monetary-policy','interest-rate','inflation','quantitative-easing','yield-curve'] },
      { id: 'lesson-28-2', title: 'Monetary Policy Tools',  termIds: ['monetary-policy','quantitative-easing','interest-rate','inflation','federal-reserve','gdp'] },
      { id: 'lesson-28-3', title: 'Fiscal vs Monetary',     termIds: ['fiscal-policy','monetary-policy','gdp','government-bonds','inflation','sovereign-debt'] },
      { id: 'lesson-28-4', title: 'Global Central Banks',   termIds: ['monetary-policy','exchange-rate','reserve-currency','purchasing-power-parity','inflation','current-account'] },
    ],
  },
  {
    id: 29, chapter: 3, title: 'Interest Rate Dynamics', icon: '📊', color: 'bg-blue-800',
    description: 'Rate cycles, the inverted yield curve, and how rates impact every asset class.',
    lessons: [
      { id: 'lesson-29-1', title: 'Rate Cycles',            termIds: ['interest-rate','yield-curve','federal-reserve','monetary-policy','bonds','duration-risk'] },
      { id: 'lesson-29-2', title: 'Rates & Asset Prices',   termIds: ['interest-rate','bonds','duration-risk','real-estate-invest','mortgage','equity'] },
      { id: 'lesson-29-3', title: 'Inverted Yield Curve',   termIds: ['yield-curve','recession','interest-rate','government-bonds','monetary-policy','inflation'] },
      { id: 'lesson-29-4', title: 'Rate Risk Management',   termIds: ['duration-risk','interest-rate-swap','hedging','duration','bonds','callable-bond'] },
    ],
  },
  {
    id: 30, chapter: 3, title: 'Fixed Income Advanced', icon: '🎓', color: 'bg-blue-600',
    description: 'Synthesise your bond knowledge — spread analysis, portfolio strategy, and total return.',
    lessons: [
      { id: 'lesson-30-1', title: 'Yield Spread Analysis',  termIds: ['yield-spread','credit-spread','bonds','corporate-bond','government-bonds','risk-premium'] },
      { id: 'lesson-30-2', title: 'Duration Management',    termIds: ['duration','duration-risk','zero-coupon-bond','bonds','interest-rate','risk'] },
      { id: 'lesson-30-3', title: 'Bond Portfolio Strategy',termIds: ['bonds','asset-allocation','diversification','rebalancing','yield','duration-risk'] },
      { id: 'lesson-30-4', title: 'Fixed Income in a Portfolio', termIds: ['bonds','sharpe-ratio','correlation','asset-allocation','risk','return'] },
    ],
  },
  // ══════════════════════════════════════════════════════════════════
  // CHAPTER 4 — FUNDS & PORTFOLIO THEORY  (Units 31–40)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 31, chapter: 4, title: 'Index Fund Revolution', icon: '📈', color: 'bg-green-700',
    description: 'How Jack Bogle changed everything — index funds, passive investing, and the case for low fees.',
    lessons: [
      { id: 'lesson-31-1', title: 'Index Investing',        termIds: ['index-fund','etf','benchmark','expense-ratio','tracking-error','buy-and-hold'] },
      { id: 'lesson-31-2', title: 'Index Construction',     termIds: ['benchmark','market-cap','index-fund','etf','tracking-error','diversification'] },
      { id: 'lesson-31-3', title: 'Smart Beta',             termIds: ['factor-investing','etf','benchmark','alpha','beta','index-fund'] },
      { id: 'lesson-31-4', title: 'Index Fund Strategies',  termIds: ['dollar-cost-averaging','index-fund','rebalancing','expense-ratio','diversification','buy-and-hold'] },
    ],
  },
  {
    id: 32, chapter: 4, title: 'ETF Mastery', icon: '🧺', color: 'bg-emerald-700',
    description: 'Everything about ETFs — mechanics, types, liquidity, and how to use them effectively.',
    lessons: [
      { id: 'lesson-32-1', title: 'ETF Mechanics',          termIds: ['etf','nav','expense-ratio','bid-ask-spread','market-making','market-liquidity'] },
      { id: 'lesson-32-2', title: 'ETF Types',              termIds: ['etf','index-fund','sector-rotation','thematic-investing','leverage','derivatives'] },
      { id: 'lesson-32-3', title: 'ETF Selection',          termIds: ['etf','expense-ratio','tracking-error','liquidity','benchmark','diversification'] },
      { id: 'lesson-32-4', title: 'ETF vs Mutual Funds',    termIds: ['etf','mutual-fund','nav','expense-ratio','tax-loss-harvesting','index-fund'] },
    ],
  },
  {
    id: 33, chapter: 4, title: 'Mutual Funds', icon: '🏛️', color: 'bg-green-800',
    description: 'Active management, fund categories, and how to evaluate whether a fund earns its fees.',
    lessons: [
      { id: 'lesson-33-1', title: 'Mutual Fund Basics',     termIds: ['mutual-fund','nav','expense-ratio','asset-allocation','benchmark','diversification'] },
      { id: 'lesson-33-2', title: 'Active Management',      termIds: ['mutual-fund','alpha','benchmark','expense-ratio','sharpe-ratio','information-ratio'] },
      { id: 'lesson-33-3', title: 'Fund Categories',        termIds: ['mutual-fund','growth-investing','value-investing','bonds','asset-class','target-date-fund'] },
      { id: 'lesson-33-4', title: 'Evaluating Funds',       termIds: ['sharpe-ratio','alpha','benchmark','expense-ratio','tracking-error','information-ratio'] },
    ],
  },
  {
    id: 34, chapter: 4, title: 'Hedge Funds & Alternatives', icon: '💎', color: 'bg-teal-800',
    description: 'The elite world of hedge funds — strategies, performance, and who can access them.',
    lessons: [
      { id: 'lesson-34-1', title: 'Hedge Fund Basics',      termIds: ['hedge-fund','alpha','absolute-return','leverage','short-selling','derivatives'] },
      { id: 'lesson-34-2', title: 'Hedge Strategies',       termIds: ['pairs-trading','arbitrage','long-position','short-selling','hedging','leverage'] },
      { id: 'lesson-34-3', title: 'Private Equity',         termIds: ['private-equity','leveraged-buyout','venture-capital','angel-investor','series-a','equity-crowdfunding'] },
      { id: 'lesson-34-4', title: 'Alternative Assets',     termIds: ['alternative-assets','commodities','real-estate-invest','hedge-fund','private-equity','diversification'] },
    ],
  },
  {
    id: 35, chapter: 4, title: 'Modern Portfolio Theory', icon: '📐', color: 'bg-emerald-800',
    description: 'Markowitz, efficient frontiers, CAPM — the mathematical foundations of portfolio construction.',
    lessons: [
      { id: 'lesson-35-1', title: 'MPT Foundations',        termIds: ['modern-portfolio-theory','efficient-frontier','correlation','risk','return','diversification'] },
      { id: 'lesson-35-2', title: 'The Efficient Frontier', termIds: ['efficient-frontier','risk','return','portfolio','sharpe-ratio','asset-allocation'] },
      { id: 'lesson-35-3', title: 'CAPM',                   termIds: ['capm','beta','risk-free-rate','risk-premium','return','market-risk'] },
      { id: 'lesson-35-4', title: 'Portfolio Optimisation', termIds: ['modern-portfolio-theory','efficient-frontier','correlation','asset-allocation','sharpe-ratio','rebalancing'] },
    ],
  },
  {
    id: 36, chapter: 4, title: 'Risk-Adjusted Performance', icon: '⚖️', color: 'bg-green-700',
    description: 'Measure performance the right way — Sharpe, Sortino, drawdown, and attribution.',
    lessons: [
      { id: 'lesson-36-1', title: 'Sharpe Ratio',           termIds: ['sharpe-ratio','return','risk','volatility','risk-free-rate','benchmark'] },
      { id: 'lesson-36-2', title: 'Sortino & Info Ratio',   termIds: ['sortino-ratio','information-ratio','sharpe-ratio','alpha','benchmark','return'] },
      { id: 'lesson-36-3', title: 'Drawdown Analysis',      termIds: ['drawdown','volatility','value-at-risk','tail-risk','sharpe-ratio','return'] },
      { id: 'lesson-36-4', title: 'Attribution Analysis',   termIds: ['alpha','beta','benchmark','tracking-error','information-ratio','return'] },
    ],
  },
  {
    id: 37, chapter: 4, title: 'Asset Allocation', icon: '🎯', color: 'bg-teal-700',
    description: 'Strategic, tactical, and dynamic asset allocation — what to own and when.',
    lessons: [
      { id: 'lesson-37-1', title: 'Strategic Allocation',   termIds: ['asset-allocation','portfolio','risk','return','diversification','rebalancing'] },
      { id: 'lesson-37-2', title: 'Tactical Allocation',    termIds: ['tactical-allocation','sector-rotation','market-sentiment','asset-allocation','momentum-investing','contrarian-investing'] },
      { id: 'lesson-37-3', title: 'Risk Parity',            termIds: ['risk-parity','asset-allocation','bonds','equity','diversification','correlation'] },
      { id: 'lesson-37-4', title: 'Lifecycle Investing',    termIds: ['target-date-fund','asset-allocation','risk','return','rebalancing','longevity-risk'] },
    ],
  },
  {
    id: 38, chapter: 4, title: 'Tax-Efficient Investing', icon: '🔄', color: 'bg-green-600',
    description: 'Keep more of what you earn — tax-loss harvesting, account types, and tax-efficient placement.',
    lessons: [
      { id: 'lesson-38-1', title: 'Rebalancing Strategies', termIds: ['rebalancing','asset-allocation','tax-loss-harvesting','expense-ratio','dollar-cost-averaging','portfolio'] },
      { id: 'lesson-38-2', title: 'Tax-Loss Harvesting',    termIds: ['tax-loss-harvesting','capital-gain','capital-loss','wash-sale','tax-deferred','marginal-tax-rate'] },
      { id: 'lesson-38-3', title: 'Tax-Advantaged Accounts',termIds: ['ira','roth-conversion','tax-deferred','401k','hsa','tax-bracket'] },
      { id: 'lesson-38-4', title: 'Tax Efficiency',         termIds: ['tax-loss-harvesting','capital-gains-tax','expense-ratio','tax-bracket','roth-conversion','tax-deferred'] },
    ],
  },
  {
    id: 39, chapter: 4, title: 'Factor Investing Deep Dive', icon: '🔬', color: 'bg-emerald-600',
    description: 'The science of persistent return sources — value, momentum, quality, size, and low volatility.',
    lessons: [
      { id: 'lesson-39-1', title: 'What Are Factors?',      termIds: ['factor-investing','alpha','beta','value-investing','momentum-investing','roe'] },
      { id: 'lesson-39-2', title: 'Size & Value Factors',   termIds: ['factor-investing','value-investing','market-cap','price-to-book','pe-ratio','roe'] },
      { id: 'lesson-39-3', title: 'Momentum & Quality',     termIds: ['momentum-investing','factor-investing','roe','free-cash-flow','earnings-per-share','alpha'] },
      { id: 'lesson-39-4', title: 'Multi-Factor Strategies',termIds: ['factor-investing','alpha','beta','diversification','risk-parity','mean-reversion'] },
    ],
  },
  {
    id: 40, chapter: 4, title: 'Retirement Portfolios', icon: '🌅', color: 'bg-teal-600',
    description: 'Build and manage a portfolio designed to last a lifetime — withdrawal strategies and longevity risk.',
    lessons: [
      { id: 'lesson-40-1', title: 'Target Date Funds',      termIds: ['target-date-fund','asset-allocation','rebalancing','risk','bonds','etf'] },
      { id: 'lesson-40-2', title: 'The Glide Path',         termIds: ['target-date-fund','asset-allocation','risk','bonds','equity','longevity-risk'] },
      { id: 'lesson-40-3', title: 'Retirement Accounts',    termIds: ['401k','ira','roth-conversion','target-date-fund','asset-allocation','safe-withdrawal-rate'] },
      { id: 'lesson-40-4', title: 'Drawdown Phase',         termIds: ['safe-withdrawal-rate','four-percent-rule','sequence-of-returns','drawdown','asset-allocation','longevity-risk'] },
    ],
  },
  // ══════════════════════════════════════════════════════════════════
  // CHAPTER 5 — BEHAVIOURAL FINANCE  (Units 41–50)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 41, chapter: 5, title: 'The Psychology of Money', icon: '🧠', color: 'bg-amber-600',
    description: 'Why smart people make terrible financial decisions — and how to stop.',
    lessons: [
      { id: 'lesson-41-1', title: 'Loss Aversion',          termIds: ['loss-aversion','anchoring','recency-bias','confirmation-bias','overconfidence','herding'] },
      { id: 'lesson-41-2', title: 'Cognitive Biases',       termIds: ['anchoring','confirmation-bias','recency-bias','sunk-cost-fallacy','disposition-effect','overconfidence'] },
      { id: 'lesson-41-3', title: 'Herd Mentality',         termIds: ['herding','market-sentiment','loss-aversion','black-swan','recency-bias','contrarian-investing'] },
      { id: 'lesson-41-4', title: 'Better Decisions',       termIds: ['loss-aversion','sunk-cost-fallacy','anchoring','overconfidence','confirmation-bias','disposition-effect'] },
    ],
  },
  {
    id: 42, chapter: 5, title: 'Investor Behaviour', icon: '📉', color: 'bg-orange-600',
    description: 'How behavioural biases destroy returns — and systematic ways to counter them.',
    lessons: [
      { id: 'lesson-42-1', title: 'How Investors Behave',   termIds: ['loss-aversion','herding','market-sentiment','recency-bias','disposition-effect','overconfidence'] },
      { id: 'lesson-42-2', title: 'Disposition Effect',     termIds: ['disposition-effect','loss-aversion','capital-gain','capital-loss','tax-loss-harvesting','confirmation-bias'] },
      { id: 'lesson-42-3', title: 'Overconfidence Trap',    termIds: ['overconfidence','anchoring','confirmation-bias','market-sentiment','return','alpha'] },
      { id: 'lesson-42-4', title: 'Recency Bias',           termIds: ['recency-bias','herding','market-sentiment','black-swan','loss-aversion','anchoring'] },
    ],
  },
  {
    id: 43, chapter: 5, title: 'Bubbles & Crashes', icon: '💥', color: 'bg-amber-700',
    description: 'Anatomy of every financial bubble in history — the crowd psychology that inflates and pops them.',
    lessons: [
      { id: 'lesson-43-1', title: 'Market Bubbles',         termIds: ['market-sentiment','herding','black-swan','recency-bias','overconfidence','momentum-investing'] },
      { id: 'lesson-43-2', title: 'Crashes & Panics',       termIds: ['black-swan','tail-risk','loss-aversion','market-sentiment','volatility','drawdown'] },
      { id: 'lesson-43-3', title: 'Value vs Growth Cycles', termIds: ['value-investing','growth-investing','pe-ratio','anchoring','confirmation-bias','mean-reversion'] },
      { id: 'lesson-43-4', title: 'Beating Your Biases',    termIds: ['loss-aversion','dollar-cost-averaging','buy-and-hold','rebalancing','confirmation-bias','overconfidence'] },
    ],
  },
  {
    id: 44, chapter: 5, title: 'Rational Investing', icon: '🎯', color: 'bg-orange-700',
    description: 'Build a systematic, evidence-based investment process immune to emotional decision-making.',
    lessons: [
      { id: 'lesson-44-1', title: 'The Rational Framework', termIds: ['market-efficiency','buy-and-hold','dollar-cost-averaging','index-fund','diversification','rebalancing'] },
      { id: 'lesson-44-2', title: 'Fast vs Slow Thinking',  termIds: ['loss-aversion','anchoring','confirmation-bias','overconfidence','herding','recency-bias'] },
      { id: 'lesson-44-3', title: 'Contrarian Advantage',   termIds: ['contrarian-investing','market-sentiment','value-investing','loss-aversion','mean-reversion','herding'] },
      { id: 'lesson-44-4', title: 'Sustainable Discipline', termIds: ['dollar-cost-averaging','buy-and-hold','rebalancing','loss-aversion','market-sentiment','index-fund'] },
    ],
  },
  {
    id: 45, chapter: 5, title: 'Mental Accounting', icon: '💭', color: 'bg-amber-800',
    description: 'How we mentally categorise money — bucket strategies, mental accounts, and money mindset.',
    lessons: [
      { id: 'lesson-45-1', title: 'Mental Accounts',        termIds: ['sunk-cost-fallacy','anchoring','loss-aversion','budget','net-worth','opportunity-cost'] },
      { id: 'lesson-45-2', title: 'Bucket Strategy',        termIds: ['asset-allocation','budget','emergency-fund','income','dividend-yield','safe-withdrawal-rate'] },
      { id: 'lesson-45-3', title: 'Money Mindset',          termIds: ['net-worth','savings-rate','financial-independence','fire-movement','opportunity-cost','compound-interest'] },
      { id: 'lesson-45-4', title: 'Wealth Psychology',      termIds: ['loss-aversion','overconfidence','herding','recency-bias','confirmation-bias','anchoring'] },
    ],
  },
  {
    id: 46, chapter: 5, title: 'Risk Perception', icon: '⚠️', color: 'bg-orange-800',
    description: 'How we perceive risk vs how risk actually works — closing the dangerous gap.',
    lessons: [
      { id: 'lesson-46-1', title: 'Perceived vs Real Risk', termIds: ['risk','loss-aversion','tail-risk','black-swan','volatility','recency-bias'] },
      { id: 'lesson-46-2', title: 'Systematic vs Company Risk', termIds: ['volatility','risk','systematic-risk','unsystematic-risk','tail-risk','diversification'] },
      { id: 'lesson-46-3', title: 'Risk Tolerance',         termIds: ['risk','asset-allocation','volatility','drawdown','sharpe-ratio','loss-aversion'] },
      { id: 'lesson-46-4', title: 'Risk & Reward Tradeoff', termIds: ['risk-premium','return','risk','volatility','sharpe-ratio','capm'] },
    ],
  },
  {
    id: 47, chapter: 5, title: 'Debt Psychology', icon: '💳', color: 'bg-amber-600',
    description: 'The emotional relationship with debt — why we carry it and how to break free.',
    lessons: [
      { id: 'lesson-47-1', title: 'The Debt Trap',          termIds: ['debt','apr','compound-interest','credit-utilization','loss-aversion','sunk-cost-fallacy'] },
      { id: 'lesson-47-2', title: 'Getting Out of Debt',    termIds: ['debt-snowball','debt-avalanche','apr','savings-rate','financial-independence','compound-interest'] },
      { id: 'lesson-47-3', title: 'Good vs Bad Debt',       termIds: ['mortgage','leverage','debt','interest-rate','ltv','return'] },
      { id: 'lesson-47-4', title: 'Debt-Free Living',       termIds: ['financial-independence','savings-rate','emergency-fund','net-worth','debt-snowball','fire-movement'] },
    ],
  },
  {
    id: 48, chapter: 5, title: 'Wealth Building Mindset', icon: '🏆', color: 'bg-orange-600',
    description: 'The philosophy and psychology behind building lasting wealth.',
    lessons: [
      { id: 'lesson-48-1', title: 'FIRE Philosophy',        termIds: ['financial-independence','fire-movement','savings-rate','compound-interest','net-worth','four-percent-rule'] },
      { id: 'lesson-48-2', title: 'Income Mindset',         termIds: ['gross-income','net-income','savings-rate','financial-independence','opportunity-cost','investment'] },
      { id: 'lesson-48-3', title: 'Spending Psychology',    termIds: ['budget','sunk-cost-fallacy','opportunity-cost','savings-rate','compound-interest','financial-independence'] },
      { id: 'lesson-48-4', title: 'Long Game Thinking',     termIds: ['compound-interest','time-value-of-money','buy-and-hold','dollar-cost-averaging','financial-independence','rule-of-72'] },
    ],
  },
  {
    id: 49, chapter: 5, title: 'Market Timing & Sentiment', icon: '📅', color: 'bg-amber-700',
    description: 'Why timing the market almost never works — and what to do instead.',
    lessons: [
      { id: 'lesson-49-1', title: 'Fear & Greed Index',     termIds: ['market-sentiment','loss-aversion','herding','contrarian-investing','volatility','black-swan'] },
      { id: 'lesson-49-2', title: 'Market Timing Myth',     termIds: ['market-efficiency','buy-and-hold','dollar-cost-averaging','market-sentiment','loss-aversion','index-fund'] },
      { id: 'lesson-49-3', title: 'Bull & Bear Markets',    termIds: ['market-sentiment','recession','yield-curve','volatility','sector-rotation','tactical-allocation'] },
      { id: 'lesson-49-4', title: 'Staying the Course',     termIds: ['buy-and-hold','dollar-cost-averaging','loss-aversion','rebalancing','diversification','compound-interest'] },
    ],
  },
  {
    id: 50, chapter: 5, title: 'The Behavioural Edge', icon: '🎯', color: 'bg-orange-900',
    description: 'Synthesis — turn behavioural awareness into a genuine investment edge.',
    lessons: [
      { id: 'lesson-50-1', title: 'Systematic Investing',   termIds: ['dollar-cost-averaging','index-fund','rebalancing','buy-and-hold','diversification','expense-ratio'] },
      { id: 'lesson-50-2', title: 'Checklists & Frameworks',termIds: ['fundamental-analysis','technical-analysis','due-diligence','risk','benchmark','value-investing'] },
      { id: 'lesson-50-3', title: 'Emotions & Money',       termIds: ['loss-aversion','herding','market-sentiment','anchoring','overconfidence','recency-bias'] },
      { id: 'lesson-50-4', title: 'Master Investor Traits', termIds: ['contrarian-investing','value-investing','buy-and-hold','loss-aversion','compound-interest','financial-independence'] },
    ],
  },
  // ══════════════════════════════════════════════════════════════════
  // CHAPTER 6 — ADVANCED TRADING  (Units 51–60)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 51, chapter: 6, title: 'Technical Analysis Mastery', icon: '📉', color: 'bg-red-700',
    description: 'Master the full technical analysis toolkit — patterns, indicators, and trading signals.',
    lessons: [
      { id: 'lesson-51-1', title: 'Candlestick Patterns',   termIds: ['candlestick','support','resistance','volume','moving-average','technical-analysis'] },
      { id: 'lesson-51-2', title: 'Support & Resistance',   termIds: ['support','resistance','volume','moving-average','candlestick','technical-analysis'] },
      { id: 'lesson-51-3', title: 'Moving Averages',        termIds: ['moving-average','macd','bollinger-bands','technical-analysis','support','resistance'] },
      { id: 'lesson-51-4', title: 'Momentum Indicators',    termIds: ['rsi','macd','bollinger-bands','volume','vwap','momentum-investing'] },
    ],
  },
  {
    id: 52, chapter: 6, title: 'Oscillators & Signals', icon: '📡', color: 'bg-rose-700',
    description: 'Deep dive into RSI, MACD, Bollinger Bands, and volume-based indicators.',
    lessons: [
      { id: 'lesson-52-1', title: 'RSI Deep Dive',          termIds: ['rsi','technical-analysis','support','resistance','volume','momentum-investing'] },
      { id: 'lesson-52-2', title: 'MACD Strategy',          termIds: ['macd','moving-average','trend-following','momentum-investing','technical-analysis','candlestick'] },
      { id: 'lesson-52-3', title: 'Bollinger Bands',        termIds: ['bollinger-bands','volatility','moving-average','technical-analysis','support','resistance'] },
      { id: 'lesson-52-4', title: 'Volume Analysis',        termIds: ['volume','vwap','market-liquidity','dark-pool','hft','market-making'] },
    ],
  },
  {
    id: 53, chapter: 6, title: 'Trend Trading', icon: '📈', color: 'bg-red-800',
    description: 'The trend is your friend — identify, trade, and ride trends across all timeframes.',
    lessons: [
      { id: 'lesson-53-1', title: 'Trend Identification',   termIds: ['trend-following','moving-average','support','resistance','momentum-investing','technical-analysis'] },
      { id: 'lesson-53-2', title: 'Trend Following Systems',termIds: ['trend-following','algorithmic-trading','risk-parity','mean-reversion','momentum-investing','factor-investing'] },
      { id: 'lesson-53-3', title: 'Mean Reversion',         termIds: ['mean-reversion','pairs-trading','arbitrage','bollinger-bands','technical-analysis','volatility'] },
      { id: 'lesson-53-4', title: 'Breakout Trading',       termIds: ['support','resistance','volume','volatility','momentum-investing','swing-trading'] },
    ],
  },
  {
    id: 54, chapter: 6, title: 'Swing & Day Trading', icon: '⚡', color: 'bg-rose-800',
    description: 'Short-term trading strategies — timeframes, setups, risk management, and psychology.',
    lessons: [
      { id: 'lesson-54-1', title: 'Swing Trading Basics',   termIds: ['swing-trading','support','resistance','candlestick','risk','long-position'] },
      { id: 'lesson-54-2', title: 'Day Trading Essentials', termIds: ['day-trading','vwap','market-order','limit-order','bid-ask-spread','margin-account'] },
      { id: 'lesson-54-3', title: 'Trade Risk Management',  termIds: ['risk','drawdown','leverage','margin-account','volatility','value-at-risk'] },
      { id: 'lesson-54-4', title: 'Trading Psychology',     termIds: ['loss-aversion','overconfidence','anchoring','market-sentiment','buy-and-hold','herding'] },
    ],
  },
  {
    id: 55, chapter: 6, title: 'Options Mastery', icon: '🔄', color: 'bg-red-700',
    description: 'From basic calls and puts to multi-leg strategies and the Greeks.',
    lessons: [
      { id: 'lesson-55-1', title: 'Options Fundamentals',   termIds: ['options','call-option','put-option','strike-price','implied-volatility','derivatives'] },
      { id: 'lesson-55-2', title: 'The Greeks',             termIds: ['delta','implied-volatility','call-option','put-option','options','derivatives'] },
      { id: 'lesson-55-3', title: 'Options Strategies',     termIds: ['covered-call','put-option','hedging','implied-volatility','leverage','derivatives'] },
      { id: 'lesson-55-4', title: 'Options Pricing',        termIds: ['implied-volatility','delta','options','call-option','time-value-of-money','risk'] },
    ],
  },
  {
    id: 56, chapter: 6, title: 'Futures & Commodities', icon: '🌾', color: 'bg-rose-700',
    description: 'Commodity markets, futures contracts, and how to trade real-world assets.',
    lessons: [
      { id: 'lesson-56-1', title: 'Futures Basics',         termIds: ['futures','derivatives','commodities','hedging','leverage','margin-account'] },
      { id: 'lesson-56-2', title: 'Commodity Markets',      termIds: ['commodities','futures','inflation','market-sentiment','alternative-assets','derivatives'] },
      { id: 'lesson-56-3', title: 'Commodity Investing',    termIds: ['commodities','alternative-assets','inflation','real-estate-invest','portfolio','diversification'] },
      { id: 'lesson-56-4', title: 'Futures Strategies',     termIds: ['futures','hedging','leverage','derivatives','trend-following','algorithmic-trading'] },
    ],
  },
  {
    id: 57, chapter: 6, title: 'Algo & HFT', icon: '🤖', color: 'bg-red-800',
    description: 'How machines trade — algorithmic strategies, HFT, and the modern market structure.',
    lessons: [
      { id: 'lesson-57-1', title: 'Algo Trading Basics',    termIds: ['algorithmic-trading','hft','market-making','vwap','bid-ask-spread','dark-pool'] },
      { id: 'lesson-57-2', title: 'HFT Strategies',         termIds: ['hft','algorithmic-trading','market-making','pairs-trading','arbitrage','dark-pool'] },
      { id: 'lesson-57-3', title: 'Dark Pools',             termIds: ['dark-pool','market-liquidity','market-making','hft','price-discovery','bid-ask-spread'] },
      { id: 'lesson-57-4', title: 'Market Impact',          termIds: ['vwap','market-liquidity','bid-ask-spread','dark-pool','hft','market-making'] },
    ],
  },
  {
    id: 58, chapter: 6, title: 'Leverage & Margin', icon: '⚠️', color: 'bg-rose-900',
    description: 'The double-edged sword of leverage — amplifying gains, amplifying losses.',
    lessons: [
      { id: 'lesson-58-1', title: 'What Is Leverage?',      termIds: ['leverage','margin-account','debt-to-equity','risk','return','derivatives'] },
      { id: 'lesson-58-2', title: 'Margin Trading',         termIds: ['margin-account','leverage','short-selling','derivatives','risk','volatility'] },
      { id: 'lesson-58-3', title: 'Leverage in Investing',  termIds: ['leverage','etf','futures','derivatives','risk','return'] },
      { id: 'lesson-58-4', title: 'Leverage Risks',         termIds: ['leverage','drawdown','volatility','tail-risk','margin-account','value-at-risk'] },
    ],
  },
  {
    id: 59, chapter: 6, title: 'Short Selling', icon: '🐻', color: 'bg-red-600',
    description: 'Profit from falling prices — short selling mechanics, short squeezes, and risk.',
    lessons: [
      { id: 'lesson-59-1', title: 'Short Selling Mechanics',termIds: ['short-selling','long-position','margin-account','leverage','derivatives','risk'] },
      { id: 'lesson-59-2', title: 'Short Squeeze',          termIds: ['short-selling','market-sentiment','volatility','herding','momentum-investing','market-making'] },
      { id: 'lesson-59-3', title: 'Shorting Strategies',    termIds: ['short-selling','pairs-trading','hedging','derivatives','leverage','risk'] },
      { id: 'lesson-59-4', title: 'Short Selling Risk',     termIds: ['short-selling','leverage','margin-account','tail-risk','volatility','loss-aversion'] },
    ],
  },
  {
    id: 60, chapter: 6, title: 'Advanced Derivatives', icon: '🔬', color: 'bg-rose-900',
    description: 'CDS, interest rate swaps, structured products — the derivatives that move trillions.',
    lessons: [
      { id: 'lesson-60-1', title: 'Credit Default Swaps',   termIds: ['credit-default-swap','derivatives','counterparty-risk','credit-rating','default','hedging'] },
      { id: 'lesson-60-2', title: 'Interest Rate Swaps',    termIds: ['interest-rate-swap','derivatives','hedging','interest-rate','counterparty-risk','monetary-policy'] },
      { id: 'lesson-60-3', title: 'Structured Products',    termIds: ['derivatives','leverage','options','futures','risk','capital-structure'] },
      { id: 'lesson-60-4', title: 'Derivatives Risk',       termIds: ['counterparty-risk','tail-risk','leverage','derivatives','systematic-risk','credit-default-swap'] },
    ],
  },
  // ══════════════════════════════════════════════════════════════════
  // CHAPTER 7 — BUSINESS & CORPORATE FINANCE  (Units 61–70)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 61, chapter: 7, title: 'Corporate Finance Basics', icon: '🏗️', color: 'bg-yellow-600',
    description: 'The financial engine of a company — capital structure, cost of capital, and allocation.',
    lessons: [
      { id: 'lesson-61-1', title: 'Corporate Structure',    termIds: ['capital-structure','equity','debt','leverage','wacc','debt-to-equity'] },
      { id: 'lesson-61-2', title: 'Cost of Capital',        termIds: ['wacc','capm','risk-free-rate','beta','equity','debt'] },
      { id: 'lesson-61-3', title: 'Capital Allocation',     termIds: ['capital-structure','free-cash-flow','dividends','share-buyback','investment','wacc'] },
      { id: 'lesson-61-4', title: 'Financial Statements',   termIds: ['income-statement','balance-sheet','free-cash-flow','ebitda','revenue','profit-margin'] },
    ],
  },
  {
    id: 62, chapter: 7, title: 'Valuation Methods', icon: '🔍', color: 'bg-amber-600',
    description: 'DCF, comparables, LBO — every method used by bankers and analysts to value businesses.',
    lessons: [
      { id: 'lesson-62-1', title: 'DCF Valuation',          termIds: ['dcf','free-cash-flow','wacc','npv','irr','return'] },
      { id: 'lesson-62-2', title: 'Comparable Valuation',   termIds: ['pe-ratio','ev-ebitda','price-to-book','ebitda','market-cap','revenue'] },
      { id: 'lesson-62-3', title: 'LBO Valuation',          termIds: ['leveraged-buyout','private-equity','leverage','ebitda','free-cash-flow','debt-to-equity'] },
      { id: 'lesson-62-4', title: 'M&A Analysis',           termIds: ['due-diligence','goodwill','capital-structure','market-cap','equity','debt'] },
    ],
  },
  {
    id: 63, chapter: 7, title: 'Startup & Venture Finance', icon: '🚀', color: 'bg-yellow-700',
    description: 'The economics of startups — from idea to IPO, fundraising, equity, and exits.',
    lessons: [
      { id: 'lesson-63-1', title: 'Startup Financing',      termIds: ['angel-investor','seed-funding','series-a','venture-capital','cap-table','vesting'] },
      { id: 'lesson-63-2', title: 'Startup Metrics',        termIds: ['burn-rate','runway','revenue','profit-margin','gross-margin','bootstrapping'] },
      { id: 'lesson-63-3', title: 'Term Sheets & Equity',   termIds: ['cap-table','vesting','series-a','equity-crowdfunding','spac','ipo'] },
      { id: 'lesson-63-4', title: 'Exit Strategies',        termIds: ['ipo','spac','private-equity','venture-capital','leveraged-buyout','cap-table'] },
    ],
  },
  {
    id: 64, chapter: 7, title: 'Mergers & Acquisitions', icon: '🤝', color: 'bg-amber-700',
    description: 'How deals get done — the full M&A process from target identification to integration.',
    lessons: [
      { id: 'lesson-64-1', title: 'M&A Basics',             termIds: ['due-diligence','goodwill','market-cap','equity','capital-structure','wacc'] },
      { id: 'lesson-64-2', title: 'M&A Process',            termIds: ['due-diligence','leveraged-buyout','private-equity','capital-structure','goodwill','market-cap'] },
      { id: 'lesson-64-3', title: 'Deal Structures',        termIds: ['leveraged-buyout','goodwill','capital-gain','tax-bracket','exchange-1031','capital-structure'] },
      { id: 'lesson-64-4', title: 'Post-Merger Integration',termIds: ['goodwill','revenue','ebitda','free-cash-flow','profit-margin','gross-margin'] },
    ],
  },
  {
    id: 65, chapter: 7, title: 'Working Capital & Growth', icon: '💼', color: 'bg-yellow-800',
    description: 'Managing cash, funding growth, and keeping a business financially healthy.',
    lessons: [
      { id: 'lesson-65-1', title: 'Working Capital',        termIds: ['working-capital','free-cash-flow','revenue','ebitda','debt','liquidity'] },
      { id: 'lesson-65-2', title: 'Cash Management',        termIds: ['free-cash-flow','budget','working-capital','ebitda','revenue','net-income'] },
      { id: 'lesson-65-3', title: 'Business Debt',          termIds: ['debt','leverage','debt-to-equity','capital-structure','interest-rate','wacc'] },
      { id: 'lesson-65-4', title: 'Growth Finance',         termIds: ['revenue','gross-margin','profit-margin','free-cash-flow','venture-capital','seed-funding'] },
    ],
  },
  {
    id: 66, chapter: 7, title: 'Business Metrics', icon: '📊', color: 'bg-amber-800',
    description: 'The metrics that matter — revenue, margins, returns, and efficiency ratios.',
    lessons: [
      { id: 'lesson-66-1', title: 'Revenue & Growth',       termIds: ['revenue','gross-margin','profit-margin','earnings-per-share','ebitda','growth-investing'] },
      { id: 'lesson-66-2', title: 'Profitability',          termIds: ['roe','ebitda','free-cash-flow','profit-margin','gross-margin','revenue'] },
      { id: 'lesson-66-3', title: 'Efficiency Metrics',     termIds: ['roe','working-capital','free-cash-flow','ebitda','leverage','debt-to-equity'] },
      { id: 'lesson-66-4', title: 'Financial Modeling',     termIds: ['financial-modeling','dcf','free-cash-flow','revenue','profit-margin','ebitda'] },
    ],
  },
  {
    id: 67, chapter: 7, title: 'Tax Strategy', icon: '🧾', color: 'bg-yellow-600',
    description: 'Legal tax minimisation — individual and corporate strategies for keeping more wealth.',
    lessons: [
      { id: 'lesson-67-1', title: 'Tax Fundamentals',       termIds: ['tax-bracket','marginal-tax-rate','tax-deferred','capital-gains-tax','estate-tax','tax-loss-harvesting'] },
      { id: 'lesson-67-2', title: 'Corporate Tax Strategy', termIds: ['capital-structure','debt','wacc','tax-bracket','capital-gains-tax','marginal-tax-rate'] },
      { id: 'lesson-67-3', title: 'Investment Tax Planning',termIds: ['tax-loss-harvesting','wash-sale','roth-conversion','tax-deferred','capital-gain','capital-loss'] },
      { id: 'lesson-67-4', title: 'Advanced Tax',           termIds: ['estate-tax','step-up-basis','exchange-1031','rmd','hsa','tax-deferred'] },
    ],
  },
  {
    id: 68, chapter: 7, title: 'Financial Regulation', icon: '📋', color: 'bg-amber-600',
    description: 'The rules of the game — how markets, banks, and fintech are regulated.',
    lessons: [
      { id: 'lesson-68-1', title: 'Market Regulation',      termIds: ['financial-regulation','market-efficiency','price-discovery','market-making','market-cap','stock-exchange'] },
      { id: 'lesson-68-2', title: 'Banking Regulation',     termIds: ['financial-regulation','leverage','debt','capital-structure','counterparty-risk','systematic-risk'] },
      { id: 'lesson-68-3', title: 'Fintech Regulation',     termIds: ['fintech','open-banking','financial-regulation','cryptocurrency','blockchain','digital-wallet'] },
      { id: 'lesson-68-4', title: 'Compliance & Risk',      termIds: ['financial-regulation','counterparty-risk','tail-risk','systematic-risk','credit-default-swap','derivatives'] },
    ],
  },
  {
    id: 69, chapter: 7, title: 'ESG & Sustainable Finance', icon: '🌱', color: 'bg-yellow-700',
    description: 'Investing for impact — ESG criteria, green bonds, and the climate finance revolution.',
    lessons: [
      { id: 'lesson-69-1', title: 'ESG Basics',             termIds: ['esg','sri','impact-investing','green-bond','social-bond','stakeholder-capitalism'] },
      { id: 'lesson-69-2', title: 'ESG Investing',          termIds: ['esg','sri','greenwashing','net-zero','stranded-assets','carbon-credit'] },
      { id: 'lesson-69-3', title: 'Climate Finance',        termIds: ['green-bond','net-zero','stranded-assets','carbon-credit','impact-investing','esg'] },
      { id: 'lesson-69-4', title: 'Sustainable Portfolios', termIds: ['esg','sri','impact-investing','diversification','stakeholder-capitalism','green-bond'] },
    ],
  },
  {
    id: 70, chapter: 7, title: 'Financial Innovation', icon: '💡', color: 'bg-amber-900',
    description: 'How technology is rewriting the rules of finance — fintech, open banking, and CBDCs.',
    lessons: [
      { id: 'lesson-70-1', title: 'Fintech Revolution',     termIds: ['fintech','open-banking','blockchain','cryptocurrency','digital-wallet','smart-contract'] },
      { id: 'lesson-70-2', title: 'Payments & Banking',     termIds: ['fintech','open-banking','cbdc','stablecoin','cryptocurrency','digital-wallet'] },
      { id: 'lesson-70-3', title: 'Lending Innovation',     termIds: ['fintech','open-banking','credit-score','apr','financial-regulation','leverage'] },
      { id: 'lesson-70-4', title: 'Future of Finance',      termIds: ['fintech','blockchain','defi','cbdc','open-banking','financial-regulation'] },
    ],
  },
  // ══════════════════════════════════════════════════════════════════
  // CHAPTER 8 — ALTERNATIVE ASSETS & CRYPTO  (Units 71–80)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 71, chapter: 8, title: 'Bitcoin & Digital Gold', icon: '₿', color: 'bg-orange-600',
    description: "The original cryptocurrency — understand Bitcoin's technology, economics, and role as an asset.",
    lessons: [
      { id: 'lesson-71-1', title: 'Bitcoin Fundamentals',   termIds: ['bitcoin','cryptocurrency','blockchain','proof-of-work','proof-of-stake','digital-wallet'] },
      { id: 'lesson-71-2', title: 'Bitcoin as Asset',       termIds: ['bitcoin','alternative-assets','volatility','purchasing-power','inflation','market-cap'] },
      { id: 'lesson-71-3', title: 'Crypto Basics',          termIds: ['cryptocurrency','blockchain','digital-wallet','bitcoin','market-cap','market-sentiment'] },
      { id: 'lesson-71-4', title: 'Bitcoin Network',        termIds: ['bitcoin','proof-of-work','crypto-halving','blockchain','tokenomics','market-cap'] },
    ],
  },
  {
    id: 72, chapter: 8, title: 'Ethereum & Smart Contracts', icon: '⟠', color: 'bg-purple-700',
    description: 'The programmable blockchain — smart contracts, dApps, and the Ethereum ecosystem.',
    lessons: [
      { id: 'lesson-72-1', title: 'Ethereum Basics',        termIds: ['ethereum','smart-contract','blockchain','defi','layer2','gas-fees'] },
      { id: 'lesson-72-2', title: 'DeFi Ecosystem',         termIds: ['defi','smart-contract','ethereum','liquidity-pool','yield-farming','dao'] },
      { id: 'lesson-72-3', title: 'Layer 2 Solutions',      termIds: ['layer2','ethereum','gas-fees','blockchain','tokenomics','digital-wallet'] },
      { id: 'lesson-72-4', title: 'Ethereum Economics',     termIds: ['ethereum','tokenomics','proof-of-stake','gas-fees','layer2','defi'] },
    ],
  },
  {
    id: 73, chapter: 8, title: 'DeFi Deep Dive', icon: '🌐', color: 'bg-violet-700',
    description: 'Decentralised finance — liquidity pools, yield farming, DAOs, and the risks.',
    lessons: [
      { id: 'lesson-73-1', title: 'DeFi Foundations',       termIds: ['defi','smart-contract','ethereum','blockchain','dao','liquidity-pool'] },
      { id: 'lesson-73-2', title: 'Yield Farming',          termIds: ['yield-farming','liquidity-pool','defi','ethereum','tokenomics','gas-fees'] },
      { id: 'lesson-73-3', title: 'DAOs & Governance',      termIds: ['dao','defi','smart-contract','tokenomics','ethereum','blockchain'] },
      { id: 'lesson-73-4', title: 'DeFi Risks',             termIds: ['defi','smart-contract','counterparty-risk','liquidity-pool','yield-farming','tail-risk'] },
    ],
  },
  {
    id: 74, chapter: 8, title: 'Crypto Assets', icon: '🪙', color: 'bg-pink-700',
    description: 'Beyond Bitcoin — stablecoins, NFTs, tokenomics, and the full crypto asset universe.',
    lessons: [
      { id: 'lesson-74-1', title: 'Stablecoins',            termIds: ['stablecoin','cbdc','cryptocurrency','defi','blockchain','digital-wallet'] },
      { id: 'lesson-74-2', title: 'NFTs',                   termIds: ['nft','blockchain','ethereum','digital-wallet','market-sentiment','tokenomics'] },
      { id: 'lesson-74-3', title: 'Tokenomics Deep Dive',   termIds: ['tokenomics','cryptocurrency','bitcoin','ethereum','defi','proof-of-stake'] },
      { id: 'lesson-74-4', title: 'Crypto Market Structure',termIds: ['cryptocurrency','market-cap','volatility','market-sentiment','tokenomics','digital-wallet'] },
    ],
  },
  {
    id: 75, chapter: 8, title: 'Crypto Safety & Storage', icon: '🔐', color: 'bg-orange-700',
    description: "Not your keys, not your coins — wallets, custody, security, and managing crypto risk.",
    lessons: [
      { id: 'lesson-75-1', title: 'Wallets & Keys',         termIds: ['digital-wallet','cryptocurrency','blockchain','counterparty-risk','risk','smart-contract'] },
      { id: 'lesson-75-2', title: 'Custody Solutions',      termIds: ['digital-wallet','counterparty-risk','financial-regulation','cryptocurrency','blockchain','risk'] },
      { id: 'lesson-75-3', title: 'Crypto Risks',           termIds: ['cryptocurrency','volatility','tail-risk','counterparty-risk','financial-regulation','market-sentiment'] },
      { id: 'lesson-75-4', title: 'Crypto Portfolio',       termIds: ['cryptocurrency','diversification','volatility','alternative-assets','risk','portfolio'] },
    ],
  },
  {
    id: 76, chapter: 8, title: 'Alternative Investments', icon: '💎', color: 'bg-purple-800',
    description: 'Private equity, hedge funds, venture capital — the world beyond public markets.',
    lessons: [
      { id: 'lesson-76-1', title: 'Private Equity',         termIds: ['private-equity','leveraged-buyout','venture-capital','due-diligence','cap-table','equity'] },
      { id: 'lesson-76-2', title: 'Venture Capital',        termIds: ['venture-capital','angel-investor','seed-funding','series-a','burn-rate','runway'] },
      { id: 'lesson-76-3', title: 'Hedge Funds',            termIds: ['hedge-fund','alpha','absolute-return','leverage','short-selling','pairs-trading'] },
      { id: 'lesson-76-4', title: 'Access & Liquidity',     termIds: ['alternative-assets','private-equity','liquidity','market-cap','equity-crowdfunding','spac'] },
    ],
  },
  {
    id: 77, chapter: 8, title: 'Commodities & Real Assets', icon: '🌾', color: 'bg-amber-700',
    description: 'Gold, oil, agricultural products — tangible assets and their role in a portfolio.',
    lessons: [
      { id: 'lesson-77-1', title: 'Commodity Basics',       termIds: ['commodities','futures','inflation','alternative-assets','portfolio','diversification'] },
      { id: 'lesson-77-2', title: 'Commodity Sectors',      termIds: ['commodities','inflation','purchasing-power','market-sentiment','geopolitical-risk','risk'] },
      { id: 'lesson-77-3', title: 'Gold & Precious Metals', termIds: ['commodities','alternative-assets','inflation','purchasing-power','risk','diversification'] },
      { id: 'lesson-77-4', title: 'Energy Markets',         termIds: ['commodities','futures','geopolitical-risk','inflation','esg','stranded-assets'] },
    ],
  },
  {
    id: 78, chapter: 8, title: 'Real Estate Investing', icon: '🏠', color: 'bg-orange-800',
    description: 'From buy-to-let to commercial real estate — strategies, metrics, and financing.',
    lessons: [
      { id: 'lesson-78-1', title: 'Real Estate Basics',     termIds: ['real-estate-invest','rental-yield','noi','cap-rate','real-estate-appreciation','mortgage'] },
      { id: 'lesson-78-2', title: 'Property Finance',       termIds: ['mortgage','ltv','heloc','cash-on-cash','leverage','exchange-1031'] },
      { id: 'lesson-78-3', title: 'House Hacking & BRRRR',  termIds: ['house-hacking','real-estate-invest','rental-yield','mortgage','leverage','cap-rate'] },
      { id: 'lesson-78-4', title: 'Commercial Real Estate', termIds: ['noi','cap-rate','real-estate-invest','property-depreciation','exchange-1031','leverage'] },
    ],
  },
  {
    id: 79, chapter: 8, title: 'Private Markets', icon: '🔒', color: 'bg-purple-900',
    description: 'The private market universe — from angel rounds to LBOs and how to access them.',
    lessons: [
      { id: 'lesson-79-1', title: 'Private Market Stages',  termIds: ['angel-investor','seed-funding','series-a','venture-capital','private-equity','leveraged-buyout'] },
      { id: 'lesson-79-2', title: 'Deal Evaluation',        termIds: ['due-diligence','cap-table','vesting','financial-modeling','dcf','free-cash-flow'] },
      { id: 'lesson-79-3', title: 'Fund Structures',        termIds: ['private-equity','hedge-fund','venture-capital','equity-crowdfunding','spac','ipo'] },
      { id: 'lesson-79-4', title: 'Returns & Liquidity',    termIds: ['irr','return','liquidity','private-equity','capital-gain','tax-bracket'] },
    ],
  },
  {
    id: 80, chapter: 8, title: 'Alternative Asset Strategy', icon: '🏆', color: 'bg-violet-900',
    description: 'Constructing a portfolio with alternatives — allocation, correlation, and diversification benefits.',
    lessons: [
      { id: 'lesson-80-1', title: 'Role of Alternatives',   termIds: ['alternative-assets','correlation','diversification','portfolio','sharpe-ratio','risk'] },
      { id: 'lesson-80-2', title: 'Crypto Allocation',      termIds: ['cryptocurrency','bitcoin','ethereum','portfolio','volatility','diversification'] },
      { id: 'lesson-80-3', title: 'Real Assets Allocation', termIds: ['real-estate-invest','commodities','alternative-assets','inflation','portfolio','diversification'] },
      { id: 'lesson-80-4', title: 'Private Market Allocation', termIds: ['private-equity','venture-capital','liquidity','irr','portfolio','asset-allocation'] },
    ],
  },
  // ══════════════════════════════════════════════════════════════════
  // CHAPTER 9 — GLOBAL MARKETS & MACRO  (Units 81–90)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 81, chapter: 9, title: 'Global Economics', icon: '🌍', color: 'bg-teal-700',
    description: 'How the global economy works — GDP, trade, and the forces that drive growth.',
    lessons: [
      { id: 'lesson-81-1', title: 'GDP & Growth',           termIds: ['gdp','inflation','economic-indicators','unemployment-rate','fiscal-policy','monetary-policy'] },
      { id: 'lesson-81-2', title: 'Global Trade',           termIds: ['trade-balance','current-account','exchange-rate','foreign-direct-investment','gdp','geopolitical-risk'] },
      { id: 'lesson-81-3', title: 'Comparative Advantage',  termIds: ['trade-balance','current-account','exchange-rate','purchasing-power-parity','gdp','inflation'] },
      { id: 'lesson-81-4', title: 'Economic Cycles',        termIds: ['gdp','recession','inflation','unemployment-rate','economic-indicators','yield-curve'] },
    ],
  },
  {
    id: 82, chapter: 9, title: 'Monetary Policy', icon: '🏦', color: 'bg-cyan-700',
    description: 'Central banks, money supply, interest rates — the most powerful levers in global finance.',
    lessons: [
      { id: 'lesson-82-1', title: 'Money Supply',           termIds: ['monetary-policy','inflation','federal-reserve','quantitative-easing','interest-rate','cpi'] },
      { id: 'lesson-82-2', title: 'Interest Rate Policy',   termIds: ['federal-reserve','interest-rate','inflation','yield-curve','monetary-policy','bonds'] },
      { id: 'lesson-82-3', title: 'QE & Balance Sheet',     termIds: ['quantitative-easing','monetary-policy','federal-reserve','bonds','inflation','market-sentiment'] },
      { id: 'lesson-82-4', title: 'Global Monetary Policy', termIds: ['monetary-policy','exchange-rate','reserve-currency','purchasing-power-parity','inflation','current-account'] },
    ],
  },
  {
    id: 83, chapter: 9, title: 'Fiscal Policy', icon: '🏛️', color: 'bg-teal-800',
    description: 'Government spending, taxation, and debt — how fiscal policy shapes economies and markets.',
    lessons: [
      { id: 'lesson-83-1', title: 'Fiscal Policy Basics',   termIds: ['fiscal-policy','gdp','tax-bracket','government-bonds','sovereign-debt','inflation'] },
      { id: 'lesson-83-2', title: 'Government Debt',        termIds: ['sovereign-debt','fiscal-policy','government-bonds','gdp','interest-rate','default'] },
      { id: 'lesson-83-3', title: 'Deficit & Surplus',      termIds: ['fiscal-policy','sovereign-debt','gdp','current-account','trade-balance','reserve-currency'] },
      { id: 'lesson-83-4', title: 'Stimulus & Austerity',   termIds: ['fiscal-policy','quantitative-easing','monetary-policy','gdp','inflation','recession'] },
    ],
  },
  {
    id: 84, chapter: 9, title: 'International Trade & FX', icon: '💱', color: 'bg-cyan-800',
    description: 'Currency markets, trade flows, and how exchange rates affect your investments.',
    lessons: [
      { id: 'lesson-84-1', title: 'Foreign Exchange Basics',termIds: ['exchange-rate','purchasing-power-parity','inflation','monetary-policy','reserve-currency','trade-balance'] },
      { id: 'lesson-84-2', title: 'Currency Markets',       termIds: ['exchange-rate','currency-hedging','reserve-currency','foreign-direct-investment','trade-balance','current-account'] },
      { id: 'lesson-84-3', title: 'FX & Investments',       termIds: ['currency-hedging','exchange-rate','foreign-direct-investment','portfolio','diversification','risk'] },
      { id: 'lesson-84-4', title: 'Trade Wars & Policy',    termIds: ['trade-balance','geopolitical-risk','fiscal-policy','exchange-rate','inflation','current-account'] },
    ],
  },
  {
    id: 85, chapter: 9, title: 'Inflation & Deflation', icon: '📊', color: 'bg-teal-700',
    description: 'The enemy and friend of investors — how inflation works and how to protect against it.',
    lessons: [
      { id: 'lesson-85-1', title: 'Inflation Mechanics',    termIds: ['inflation','cpi','purchasing-power','monetary-policy','federal-reserve','stagflation'] },
      { id: 'lesson-85-2', title: 'Inflation & Assets',     termIds: ['inflation','real-estate-invest','commodities','inflation-protected-bond','bonds','equity'] },
      { id: 'lesson-85-3', title: 'Stagflation',            termIds: ['stagflation','inflation','gdp','unemployment-rate','monetary-policy','recession'] },
      { id: 'lesson-85-4', title: 'Deflation Risk',         termIds: ['inflation','monetary-policy','quantitative-easing','bonds','gdp','recession'] },
    ],
  },
  {
    id: 86, chapter: 9, title: 'Emerging Markets', icon: '🌏', color: 'bg-cyan-900',
    description: 'Investing in high-growth developing economies — the rewards and the risks.',
    lessons: [
      { id: 'lesson-86-1', title: 'EM Basics',              termIds: ['emerging-market','gdp','exchange-rate','foreign-direct-investment','geopolitical-risk','inflation'] },
      { id: 'lesson-86-2', title: 'EM Opportunities',       termIds: ['emerging-market','gdp','trade-balance','foreign-direct-investment','current-account','equity'] },
      { id: 'lesson-86-3', title: 'EM Risks',               termIds: ['emerging-market','geopolitical-risk','exchange-rate','currency-hedging','sovereign-debt','default'] },
      { id: 'lesson-86-4', title: 'EM in a Portfolio',      termIds: ['emerging-market','diversification','portfolio','correlation','currency-hedging','volatility'] },
    ],
  },
  {
    id: 87, chapter: 9, title: 'Geopolitics & Markets', icon: '🌐', color: 'bg-teal-800',
    description: 'War, sanctions, elections, and crises — how geopolitical events move financial markets.',
    lessons: [
      { id: 'lesson-87-1', title: 'Geopolitical Risk',      termIds: ['geopolitical-risk','market-sentiment','volatility','commodities','exchange-rate','tail-risk'] },
      { id: 'lesson-87-2', title: 'Sanctions & Trade',      termIds: ['geopolitical-risk','trade-balance','exchange-rate','reserve-currency','commodities','inflation'] },
      { id: 'lesson-87-3', title: 'War & Markets',          termIds: ['geopolitical-risk','tail-risk','black-swan','commodities','market-sentiment','inflation'] },
      { id: 'lesson-87-4', title: 'Geopolitical Hedging',   termIds: ['geopolitical-risk','currency-hedging','diversification','commodities','alternative-assets','risk'] },
    ],
  },
  {
    id: 88, chapter: 9, title: 'Economic Indicators', icon: '📈', color: 'bg-cyan-700',
    description: 'Read the economy like a dashboard — leading, lagging, and coincident indicators.',
    lessons: [
      { id: 'lesson-88-1', title: 'Key Indicators',         termIds: ['economic-indicators','gdp','inflation','unemployment-rate','cpi','yield-curve'] },
      { id: 'lesson-88-2', title: 'Labour Market',          termIds: ['unemployment-rate','gdp','inflation','monetary-policy','economic-indicators','stagflation'] },
      { id: 'lesson-88-3', title: 'Consumer & Business',    termIds: ['economic-indicators','gdp','inflation','market-sentiment','recession','fiscal-policy'] },
      { id: 'lesson-88-4', title: 'Indicators & Markets',   termIds: ['economic-indicators','yield-curve','sector-rotation','tactical-allocation','market-sentiment','recession'] },
    ],
  },
  {
    id: 89, chapter: 9, title: 'Recession & Recovery', icon: '🔄', color: 'bg-teal-900',
    description: 'How recessions happen, what assets survive, and how to position for recovery.',
    lessons: [
      { id: 'lesson-89-1', title: 'Recession Causes',       termIds: ['recession','gdp','yield-curve','unemployment-rate','inflation','monetary-policy'] },
      { id: 'lesson-89-2', title: 'Asset Behaviour',        termIds: ['recession','bonds','government-bonds','equity','commodities','market-sentiment'] },
      { id: 'lesson-89-3', title: 'Defensive Strategies',   termIds: ['recession','sector-rotation','dividends','bonds','diversification','hedging'] },
      { id: 'lesson-89-4', title: 'Recovery Playbook',      termIds: ['recession','sector-rotation','momentum-investing','contrarian-investing','dollar-cost-averaging','value-investing'] },
    ],
  },
  {
    id: 90, chapter: 9, title: 'Sector & Thematic Investing', icon: '🎯', color: 'bg-cyan-600',
    description: 'Rotate into winners, ride megatrends — sector analysis and thematic investment strategies.',
    lessons: [
      { id: 'lesson-90-1', title: 'Sector Rotation',        termIds: ['sector-rotation','economic-indicators','recession','tactical-allocation','etf','momentum-investing'] },
      { id: 'lesson-90-2', title: 'Business Cycle Sectors', termIds: ['sector-rotation','gdp','recession','inflation','market-sentiment','tactical-allocation'] },
      { id: 'lesson-90-3', title: 'Thematic Investing',     termIds: ['thematic-investing','etf','esg','fintech','blockchain','emerging-market'] },
      { id: 'lesson-90-4', title: 'Macro-Driven Strategy',  termIds: ['tactical-allocation','monetary-policy','fiscal-policy','inflation','yield-curve','sector-rotation'] },
    ],
  },
  // ══════════════════════════════════════════════════════════════════
  // CHAPTER 10 — EXPERT MASTERY  (Units 91–100)
  // ══════════════════════════════════════════════════════════════════
  {
    id: 91, chapter: 10, title: 'Portfolio Theory Advanced', icon: '📐', color: 'bg-indigo-700',
    description: 'Beyond Markowitz — advanced portfolio construction, factor exposure, and optimisation.',
    lessons: [
      { id: 'lesson-91-1', title: 'Advanced MPT',           termIds: ['modern-portfolio-theory','efficient-frontier','capm','beta','risk-premium','sharpe-ratio'] },
      { id: 'lesson-91-2', title: 'Multi-Factor Portfolios',termIds: ['factor-investing','alpha','beta','momentum-investing','value-investing','risk-parity'] },
      { id: 'lesson-91-3', title: 'Tail Risk Management',   termIds: ['tail-risk','black-swan','value-at-risk','drawdown','hedging','derivatives'] },
      { id: 'lesson-91-4', title: 'Dynamic Allocation',     termIds: ['tactical-allocation','sector-rotation','mean-reversion','trend-following','momentum-investing','rebalancing'] },
    ],
  },
  {
    id: 92, chapter: 10, title: 'Risk Management Pro', icon: '🛡️', color: 'bg-violet-800',
    description: 'Institutional-grade risk management — VaR, stress testing, and systemic risk.',
    lessons: [
      { id: 'lesson-92-1', title: 'Value at Risk',          termIds: ['value-at-risk','volatility','tail-risk','drawdown','systematic-risk','risk'] },
      { id: 'lesson-92-2', title: 'Stress Testing',         termIds: ['tail-risk','black-swan','systematic-risk','drawdown','value-at-risk','volatility'] },
      { id: 'lesson-92-3', title: 'Systemic Risk',          termIds: ['systematic-risk','counterparty-risk','credit-default-swap','leverage','financial-regulation','tail-risk'] },
      { id: 'lesson-92-4', title: 'Risk Frameworks',        termIds: ['risk','value-at-risk','sharpe-ratio','sortino-ratio','information-ratio','drawdown'] },
    ],
  },
  {
    id: 93, chapter: 10, title: 'Tax Strategy Expert', icon: '🧾', color: 'bg-indigo-800',
    description: 'Expert-level tax planning — asset location, Roth conversions, harvesting, and estate.',
    lessons: [
      { id: 'lesson-93-1', title: 'Asset Location',         termIds: ['tax-deferred','tax-bracket','roth-conversion','ira','401k','asset-allocation'] },
      { id: 'lesson-93-2', title: 'Advanced Harvesting',    termIds: ['tax-loss-harvesting','wash-sale','capital-gain','capital-loss','marginal-tax-rate','tax-bracket'] },
      { id: 'lesson-93-3', title: 'Roth Conversion Strategy',termIds: ['roth-conversion','ira','tax-deferred','rmd','tax-bracket','marginal-tax-rate'] },
      { id: 'lesson-93-4', title: 'Estate Tax Planning',    termIds: ['estate-tax','step-up-basis','exchange-1031','rmd','hsa','tax-deferred'] },
    ],
  },
  {
    id: 94, chapter: 10, title: 'Retirement Planning', icon: '🌅', color: 'bg-violet-700',
    description: 'Build a retirement plan that lasts — Monte Carlo, longevity risk, and withdrawal strategies.',
    lessons: [
      { id: 'lesson-94-1', title: 'Retirement Accounts',    termIds: ['401k','ira','roth-conversion','pension','defined-contribution-plan','defined-benefit-plan'] },
      { id: 'lesson-94-2', title: 'Withdrawal Strategies',  termIds: ['safe-withdrawal-rate','four-percent-rule','sequence-of-returns','rmd','longevity-risk','monte-carlo-simulation'] },
      { id: 'lesson-94-3', title: 'Monte Carlo Planning',   termIds: ['monte-carlo-simulation','safe-withdrawal-rate','longevity-risk','sequence-of-returns','inflation','asset-allocation'] },
      { id: 'lesson-94-4', title: 'Late Career Strategies', termIds: ['catch-up-contribution','401k','ira','roth-conversion','defined-benefit-plan','social-security'] },
    ],
  },
  {
    id: 95, chapter: 10, title: 'Estate & Legacy Planning', icon: '🏛️', color: 'bg-indigo-900',
    description: 'Protecting and transferring wealth across generations.',
    lessons: [
      { id: 'lesson-95-1', title: 'Estate Planning Basics', termIds: ['estate-tax','step-up-basis','net-worth','tax-deferred','rmd','defined-benefit-plan'] },
      { id: 'lesson-95-2', title: 'Trusts & Tax Vehicles',  termIds: ['estate-tax','step-up-basis','exchange-1031','roth-conversion','capital-gain','tax-bracket'] },
      { id: 'lesson-95-3', title: 'Charitable Giving',      termIds: ['estate-tax','esg','impact-investing','social-bond','green-bond','tax-deferred'] },
      { id: 'lesson-95-4', title: 'Generational Wealth',    termIds: ['estate-tax','step-up-basis','compound-interest','time-value-of-money','net-worth','financial-independence'] },
    ],
  },
  {
    id: 96, chapter: 10, title: 'Insurance & Protection', icon: '🛡️', color: 'bg-violet-900',
    description: "Protect everything you've built — life, disability, LTC, umbrella, and beyond.",
    lessons: [
      { id: 'lesson-96-1', title: 'Life Insurance',         termIds: ['life-insurance','term-life','whole-life','insurance-premium','insurance-deductible','net-worth'] },
      { id: 'lesson-96-2', title: 'Advanced Insurance',     termIds: ['umbrella-insurance','long-term-care-insurance','hsa','insurance-premium','insurance-deductible','risk'] },
      { id: 'lesson-96-3', title: 'Insurance Strategy',     termIds: ['life-insurance','term-life','whole-life','long-term-care-insurance','umbrella-insurance','annuity'] },
      { id: 'lesson-96-4', title: 'Risk & Coverage',        termIds: ['risk','insurance-premium','insurance-deductible','umbrella-insurance','long-term-care-insurance','net-worth'] },
    ],
  },
  {
    id: 97, chapter: 10, title: 'Advanced Valuation', icon: '🔬', color: 'bg-indigo-700',
    description: 'Beyond basic DCF — sum-of-the-parts, real options, and expert valuation techniques.',
    lessons: [
      { id: 'lesson-97-1', title: 'DCF Mastery',            termIds: ['dcf','free-cash-flow','wacc','capm','npv','irr'] },
      { id: 'lesson-97-2', title: 'Relative Valuation',     termIds: ['pe-ratio','ev-ebitda','price-to-book','peg-ratio','roe','ebitda'] },
      { id: 'lesson-97-3', title: 'Private Company Valuation',termIds: ['financial-modeling','dcf','private-equity','cap-table','ebitda','free-cash-flow'] },
      { id: 'lesson-97-4', title: 'Special Situations',     termIds: ['leveraged-buyout','spac','arbitrage','due-diligence','goodwill','capital-gain'] },
    ],
  },
  {
    id: 98, chapter: 10, title: 'Structured Finance', icon: '🏗️', color: 'bg-violet-800',
    description: 'Securitisation, CLOs, structured products — the complex instruments that power modern credit.',
    lessons: [
      { id: 'lesson-98-1', title: 'Securitisation',         termIds: ['collateral','leverage','credit-rating','default','bonds','capital-structure'] },
      { id: 'lesson-98-2', title: 'Credit Structures',      termIds: ['credit-default-swap','leverage','credit-rating','counterparty-risk','systematic-risk','derivatives'] },
      { id: 'lesson-98-3', title: 'Structured Products',    termIds: ['derivatives','options','bonds','leverage','credit-rating','risk'] },
      { id: 'lesson-98-4', title: 'Structured Finance Risk',termIds: ['systematic-risk','tail-risk','leverage','credit-default-swap','counterparty-risk','financial-regulation'] },
    ],
  },
  {
    id: 99, chapter: 10, title: 'The Future of Finance', icon: '🚀', color: 'bg-indigo-800',
    description: 'AI, DeFi, CBDCs, tokenisation — the financial system of tomorrow.',
    lessons: [
      { id: 'lesson-99-1', title: 'Digital Assets Tomorrow',termIds: ['cbdc','blockchain','ethereum','layer2','stablecoin','digital-wallet'] },
      { id: 'lesson-99-2', title: 'DeFi vs TradFi',        termIds: ['defi','fintech','open-banking','financial-regulation','blockchain','smart-contract'] },
      { id: 'lesson-99-3', title: 'AI in Finance',          termIds: ['algorithmic-trading','hft','financial-modeling','factor-investing','price-discovery','market-efficiency'] },
      { id: 'lesson-99-4', title: 'Sustainable Future',     termIds: ['esg','net-zero','green-bond','stakeholder-capitalism','stranded-assets','impact-investing'] },
    ],
  },
  {
    id: 100, chapter: 10, title: 'Master Class', icon: '👑', color: 'bg-indigo-900',
    description: 'The final unit. Synthesise 100 units of knowledge into a complete investment philosophy.',
    lessons: [
      { id: 'lesson-100-1', title: 'The Complete Investor', termIds: ['modern-portfolio-theory','capm','efficient-frontier','factor-investing','alpha','sharpe-ratio'] },
      { id: 'lesson-100-2', title: 'Wealth Architecture',   termIds: ['financial-independence','fire-movement','safe-withdrawal-rate','monte-carlo-simulation','longevity-risk','sequence-of-returns'] },
      { id: 'lesson-100-3', title: 'Crisis & Opportunity',  termIds: ['tail-risk','black-swan','contrarian-investing','mean-reversion','value-investing','buy-and-hold'] },
      { id: 'lesson-100-4', title: 'Your Investment Edge',  termIds: ['alpha','factor-investing','value-investing','momentum-investing','financial-modeling','financial-independence'] },
    ],
  },
];

// ─── DERIVED HELPERS ───────────────────────────────────────────────────────
// Flat array of all lessons with unit-inherited fields
export const ALL_LESSONS = UNITS.flatMap(unit =>
  unit.lessons.map((l, idx) => ({
    ...l,
    terms: l.termIds,          // compat: Lesson.jsx uses lesson.terms
    color: unit.color,
    emoji: unit.icon,
    description: unit.description,
    unitId: unit.id,
    lessonNumber: idx + 1,
  }))
);

export function getLessonById(id) {
  return ALL_LESSONS.find(l => l.id === id) ?? null;
}
