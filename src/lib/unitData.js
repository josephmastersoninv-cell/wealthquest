// WealthQuest — 11 units, ~30 lessons, ~170 terms
// Each lesson has exactly 5 terms drawn from glossaryData.js

export const UNITS = [
  {
    id: 'unit-1',
    title: 'Money Fundamentals',
    subtitle: 'The foundation of every financial decision',
    emoji: '💰',
    color: 'emerald',
    lessons: [
      {
        id: 'lesson-1-1',
        title: 'What Is Money?',
        emoji: '🏦',
        description: 'Assets, liabilities, and why they matter',
        terms: ['asset', 'liability', 'net-worth', 'income', 'investment'],
      },
      {
        id: 'lesson-1-2',
        title: 'Value & Time',
        emoji: '⏰',
        description: 'How money grows and loses value',
        terms: ['compound-interest', 'simple-interest', 'return', 'risk', 'liquidity'],
      },
      {
        id: 'lesson-1-3',
        title: 'Thinking Like an Investor',
        emoji: '🧠',
        description: 'Core concepts that shape every smart decision',
        terms: ['portfolio', 'opportunity-cost', 'time-value-of-money', 'purchasing-power', 'rule-of-72'],
      },
    ],
  },
  {
    id: 'unit-2',
    title: 'Banking & Credit',
    subtitle: 'Borrow smart, build your score',
    emoji: '🏛️',
    color: 'blue',
    lessons: [
      {
        id: 'lesson-2-1',
        title: 'Borrowing Basics',
        emoji: '💳',
        description: 'Understand debt before you take it on',
        terms: ['debt', 'interest-rate', 'apr', 'collateral', 'default'],
      },
      {
        id: 'lesson-2-2',
        title: 'Credit & Budgeting',
        emoji: '📋',
        description: 'Scores, mortgages, and financial safety nets',
        terms: ['credit-score', 'mortgage', 'amortization', 'emergency-fund', 'budget'],
      },
    ],
  },
  {
    id: 'unit-3',
    title: 'The Stock Market',
    subtitle: 'Own a piece of the world\'s best companies',
    emoji: '📈',
    color: 'violet',
    lessons: [
      {
        id: 'lesson-3-1',
        title: 'Owning Companies',
        emoji: '🏢',
        description: 'Stocks, shares, and how they work',
        terms: ['equity', 'stock-exchange', 'ipo', 'market-cap', 'dividends'],
      },
      {
        id: 'lesson-3-2',
        title: 'Reading Stock Prices',
        emoji: '📊',
        description: 'Valuation basics every investor needs',
        terms: ['earnings-per-share', 'pe-ratio', 'capital-gain', 'capital-loss', 'benchmark'],
      },
      {
        id: 'lesson-3-3',
        title: 'How Trading Works',
        emoji: '⚡',
        description: 'Orders, volume, and market mechanics',
        terms: ['market-order', 'limit-order', 'volume', 'bid-ask-spread', 'short-selling'],
      },
    ],
  },
  {
    id: 'unit-4',
    title: 'Funds & Passive Investing',
    subtitle: 'Let the market work for you',
    emoji: '🧺',
    color: 'teal',
    lessons: [
      {
        id: 'lesson-4-1',
        title: 'Pooled Investing',
        emoji: '🏦',
        description: 'ETFs, mutual funds, and why they dominate',
        terms: ['etf', 'mutual-fund', 'index-fund', 'expense-ratio', 'nav'],
      },
      {
        id: 'lesson-4-2',
        title: 'Building Long-Term Wealth',
        emoji: '🚀',
        description: 'Diversification, allocation, and tax-sheltered accounts',
        terms: ['diversification', 'asset-allocation', '401k', 'ira', 'tax-loss-harvesting'],
      },
    ],
  },
  {
    id: 'unit-5',
    title: 'Fixed Income',
    subtitle: 'Bonds, yields, and steady income',
    emoji: '📋',
    color: 'amber',
    lessons: [
      {
        id: 'lesson-5-1',
        title: 'Bond Basics',
        emoji: '🏛️',
        description: 'How governments and companies borrow money',
        terms: ['bonds', 'coupon', 'yield', 'face-value', 'duration'],
      },
      {
        id: 'lesson-5-2',
        title: 'Bond Markets',
        emoji: '📉',
        description: 'Yield curves, ratings, and credit risk',
        terms: ['yield-curve', 'government-bonds', 'corporate-bond', 'high-yield-bond', 'credit-rating'],
      },
    ],
  },
  {
    id: 'unit-6',
    title: 'Macroeconomics',
    subtitle: 'The big picture that moves every market',
    emoji: '🌍',
    color: 'orange',
    lessons: [
      {
        id: 'lesson-6-1',
        title: 'The Economy',
        emoji: '📊',
        description: 'GDP, inflation, and employment',
        terms: ['gdp', 'inflation', 'unemployment-rate', 'cpi', 'recession'],
      },
      {
        id: 'lesson-6-2',
        title: 'Central Banks & Policy',
        emoji: '🏛️',
        description: 'How governments and the Fed steer the economy',
        terms: ['federal-reserve', 'monetary-policy', 'fiscal-policy', 'quantitative-easing', 'stagflation'],
      },
    ],
  },
  {
    id: 'unit-7',
    title: 'Risk Management',
    subtitle: 'Protect what you build',
    emoji: '🎯',
    color: 'rose',
    lessons: [
      {
        id: 'lesson-7-1',
        title: 'Measuring Risk',
        emoji: '📐',
        description: 'Volatility, beta, correlation, and drawdowns',
        terms: ['volatility', 'beta', 'correlation', 'drawdown', 'market-risk'],
      },
      {
        id: 'lesson-7-2',
        title: 'Risk-Adjusted Returns',
        emoji: '⚖️',
        description: 'Sharpe ratio, alpha, leverage, and VaR',
        terms: ['sharpe-ratio', 'alpha', 'leverage', 'value-at-risk', 'risk-free-rate'],
      },
    ],
  },
  {
    id: 'unit-8',
    title: 'Derivatives & Options',
    subtitle: 'Hedge, speculate, and protect positions',
    emoji: '⚙️',
    color: 'fuchsia',
    lessons: [
      {
        id: 'lesson-8-1',
        title: 'Options Basics',
        emoji: '🎫',
        description: 'Calls, puts, and the right to buy or sell',
        terms: ['derivatives', 'options', 'call-option', 'put-option', 'strike-price'],
      },
      {
        id: 'lesson-8-2',
        title: 'Advanced Strategies',
        emoji: '🛡️',
        description: 'Futures, hedging, and volatility trading',
        terms: ['futures', 'hedging', 'covered-call', 'implied-volatility', 'black-swan'],
      },
    ],
  },
  {
    id: 'unit-9',
    title: 'Behavioral Finance',
    subtitle: 'The psychology of money decisions',
    emoji: '🧬',
    color: 'cyan',
    lessons: [
      {
        id: 'lesson-9-1',
        title: 'How We Think',
        emoji: '🧠',
        description: 'Cognitive biases that cost investors money',
        terms: ['loss-aversion', 'confirmation-bias', 'anchoring', 'recency-bias', 'overconfidence'],
      },
      {
        id: 'lesson-9-2',
        title: 'Beating Your Biases',
        emoji: '🏆',
        description: 'Systems and habits for rational investing',
        terms: ['herding', 'sunk-cost-fallacy', 'disposition-effect', 'dollar-cost-averaging', 'rebalancing'],
      },
    ],
  },
  {
    id: 'unit-10',
    title: 'Market Analysis',
    subtitle: 'Technical and fundamental tools',
    emoji: '🔬',
    color: 'indigo',
    lessons: [
      {
        id: 'lesson-10-1',
        title: 'Technical Analysis',
        emoji: '📈',
        description: 'Charts, patterns, and price action',
        terms: ['support', 'resistance', 'moving-average', 'rsi', 'macd'],
      },
      {
        id: 'lesson-10-2',
        title: 'Reading Financial Statements',
        emoji: '📑',
        description: 'Income statements, balance sheets, and cash flow',
        terms: ['income-statement', 'balance-sheet', 'free-cash-flow', 'ebitda', 'roe'],
      },
      {
        id: 'lesson-10-3',
        title: 'Valuation Metrics',
        emoji: '💎',
        description: 'Price ratios that reveal fair value',
        terms: ['debt-to-equity', 'ev-ebitda', 'peg-ratio', 'price-to-book', 'bollinger-bands'],
      },
      {
        id: 'lesson-10-4',
        title: 'Investment Styles',
        emoji: '🎯',
        description: 'Value, growth, and strategic approaches',
        terms: ['value-investing', 'growth-investing', 'long-position', 'market-sentiment', 'candlestick'],
      },
    ],
  },
  {
    id: 'unit-11',
    title: 'Alternative & Global Markets',
    subtitle: 'Beyond stocks and bonds',
    emoji: '🌐',
    color: 'yellow',
    lessons: [
      {
        id: 'lesson-11-1',
        title: 'Alternative Assets',
        emoji: '🏗️',
        description: 'Real estate, commodities, private equity, and more',
        terms: ['commodities', 'real-estate-invest', 'hedge-fund', 'venture-capital', 'private-equity'],
      },
      {
        id: 'lesson-11-2',
        title: 'Global Markets',
        emoji: '🌍',
        description: 'Exchange rates, economic signals, and market psychology',
        terms: ['exchange-rate', 'economic-indicators', 'market-sentiment', 'asset-class', 'absolute-return'],
      },
    ],
  },
];

// Flat list of all lessons across all units (for Lesson.jsx getLessonById)
export const ALL_LESSONS = UNITS.flatMap((unit, unitIndex) =>
  unit.lessons.map((lesson, lessonIndex) => ({
    ...lesson,
    color: unit.color,
    unitId: unit.id,
    unitTitle: unit.title,
    unitEmoji: unit.emoji,
    unitIndex,
    lessonIndex,
    lessonNumber: lessonIndex + 1,
    unitLessonCount: unit.lessons.length,
  }))
);

// Total lesson count for unlocking exam
export const TOTAL_LESSONS = ALL_LESSONS.length;

export const LESSON_XP = 60;
export const LESSON_COINS = 25;

export const LESSON_COLORS = {
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-300', ring: 'ring-emerald-400', hex: '#10b981' },
  blue:    { bg: 'bg-blue-500',    text: 'text-blue-600',    light: 'bg-blue-50',    border: 'border-blue-300',    ring: 'ring-blue-400',    hex: '#3b82f6' },
  violet:  { bg: 'bg-violet-500',  text: 'text-violet-600',  light: 'bg-violet-50',  border: 'border-violet-300',  ring: 'ring-violet-400',  hex: '#8b5cf6' },
  teal:    { bg: 'bg-teal-500',    text: 'text-teal-600',    light: 'bg-teal-50',    border: 'border-teal-300',    ring: 'ring-teal-400',    hex: '#14b8a6' },
  amber:   { bg: 'bg-amber-500',   text: 'text-amber-600',   light: 'bg-amber-50',   border: 'border-amber-300',   ring: 'ring-amber-400',   hex: '#f59e0b' },
  orange:  { bg: 'bg-orange-500',  text: 'text-orange-600',  light: 'bg-orange-50',  border: 'border-orange-300',  ring: 'ring-orange-400',  hex: '#f97316' },
  rose:    { bg: 'bg-rose-500',    text: 'text-rose-600',    light: 'bg-rose-50',    border: 'border-rose-300',    ring: 'ring-rose-400',    hex: '#f43f5e' },
  fuchsia: { bg: 'bg-fuchsia-500', text: 'text-fuchsia-600', light: 'bg-fuchsia-50', border: 'border-fuchsia-300', ring: 'ring-fuchsia-400', hex: '#d946ef' },
  cyan:    { bg: 'bg-cyan-500',    text: 'text-cyan-600',    light: 'bg-cyan-50',    border: 'border-cyan-300',    ring: 'ring-cyan-400',    hex: '#06b6d4' },
  indigo:  { bg: 'bg-indigo-500',  text: 'text-indigo-600',  light: 'bg-indigo-50',  border: 'border-indigo-300',  ring: 'ring-indigo-400',  hex: '#6366f1' },
  yellow:  { bg: 'bg-yellow-500',  text: 'text-yellow-600',  light: 'bg-yellow-50',  border: 'border-yellow-300',  ring: 'ring-yellow-400',  hex: '#eab308' },
};

export function getLessonById(id) {
  return ALL_LESSONS.find(l => l.id === id) ?? null;
}

export function scoreToStars(correct, total) {
  const pct = correct / total;
  if (pct === 1) return 3;
  if (pct >= 0.8) return 2;
  if (pct >= 0.6) return 1;
  return 0;
}

// Returns cumulative lesson index (0-based) across all units
export function getLessonGlobalIndex(lessonId) {
  return ALL_LESSONS.findIndex(l => l.id === lessonId);
}

// A lesson is unlocked if every previous lesson (globally) is completed
export function isLessonUnlocked(lessonId, completedLessons) {
  const idx = getLessonGlobalIndex(lessonId);
  if (idx === 0) return true;
  const prev = ALL_LESSONS[idx - 1];
  return completedLessons.includes(prev.id);
}

export function getLessonStars(lessonId, lessonStars) {
  return lessonStars?.[lessonId] ?? 0;
}
