import { GLOSSARY_TERMS } from './glossaryData';

// Generate a large exam pool from glossary terms
export function generateExamQuestions(count = 30) {
  const questions = [];
  const terms = [...GLOSSARY_TERMS];

  // 1. Definition recognition questions (pick correct definition)
  terms.forEach(term => {
    const wrong = terms.filter(t => t.id !== term.id);
    const distractors = shuffleArray(wrong).slice(0, 3).map(t => t.definition);
    const options = shuffleArray([term.definition, ...distractors]);
    questions.push({
      id: `def-${term.id}`,
      type: 'definition',
      termId: term.id,
      question: `What is the correct definition of "${term.term}"?`,
      options,
      correct: options.indexOf(term.definition),
      explanation: term.definition + (term.context ? ` — ${term.context}` : ''),
    });
  });

  // 2. Term recognition questions (given definition, pick term)
  terms.forEach(term => {
    const wrong = terms.filter(t => t.id !== term.id);
    const distractors = shuffleArray(wrong).slice(0, 3).map(t => t.term);
    const options = shuffleArray([term.term, ...distractors]);
    questions.push({
      id: `term-${term.id}`,
      type: 'recognition',
      termId: term.id,
      question: `"${term.definition}" — Which term does this describe?`,
      options,
      correct: options.indexOf(term.term),
      explanation: `"${term.term}": ${term.definition}`,
    });
  });

  // 3. Scenario / applied questions
  const scenarioQuestions = [
    {
      id: 'scenario-inflation-bonds',
      type: 'scenario',
      question: 'Inflation rises from 2% to 6%. You hold bonds paying 3% fixed. What happened to your real return?',
      options: ['Increased to 9%', 'Stayed at 3%', 'Became negative (−3%)', 'Doubled'],
      correct: 2,
      explanation: 'Real return = nominal return − inflation = 3% − 6% = −3%. Your purchasing power is declining despite earning interest.',
    },
    {
      id: 'scenario-beta',
      type: 'scenario',
      question: 'A stock has a beta of 2.0. The market falls 10%. What would you expect from this stock?',
      options: ['Fall 5%', 'Fall 10%', 'Fall 20%', 'Rise 10%'],
      correct: 2,
      explanation: 'Beta of 2.0 means the stock moves 2× the market. If market falls 10%, the stock falls ~20%.',
    },
    {
      id: 'scenario-diversification',
      type: 'scenario',
      question: 'You hold 100% of your savings in your employer\'s stock. The company goes bankrupt. What is the best term for this situation?',
      options: ['Hedging failure', 'Concentration risk / lack of diversification', 'Alpha destruction', 'Market risk'],
      correct: 1,
      explanation: 'Concentration risk — having too much exposure to a single asset. Diversification would have protected against this.',
    },
    {
      id: 'scenario-yield-curve',
      type: 'scenario',
      question: 'Short-term Treasury yields rise above long-term yields. What signal does this send?',
      options: ['Economy is booming', 'Recession warning — inverted yield curve', 'Time to buy equities', 'Inflation is falling'],
      correct: 1,
      explanation: 'An inverted yield curve (short > long rates) has preceded every US recession since the 1950s.',
    },
    {
      id: 'scenario-leverage',
      type: 'scenario',
      question: 'You borrow $50,000 to invest $100,000 (2× leverage). The investment falls 30%. What is your actual loss?',
      options: ['30%', '50%', '60%', '100%'],
      correct: 2,
      explanation: '$100K falls 30% = $30K loss on $50K equity = 60% actual loss. Leverage amplifies losses proportionally.',
    },
    {
      id: 'scenario-pe',
      type: 'scenario',
      question: 'A stock trades at a P/E of 40× vs. the industry average of 18×. What does this suggest?',
      options: ['The stock is cheap', 'Investors expect high future growth or it\'s overvalued', 'The company is in debt', 'The stock pays high dividends'],
      correct: 1,
      explanation: 'A premium P/E means investors are paying more per dollar of earnings — usually expecting faster future growth.',
    },
    {
      id: 'scenario-duration',
      type: 'scenario',
      question: 'Interest rates rise by 1%. You hold a bond with 8-year duration. Approximately how much does the bond\'s price change?',
      options: ['Falls 1%', 'Falls 8%', 'Rises 8%', 'No change'],
      correct: 1,
      explanation: 'Duration × rate change = price change. 8 years × 1% = ~8% price decline. Higher duration = more interest rate sensitivity.',
    },
    {
      id: 'scenario-alpha',
      type: 'scenario',
      question: 'The S&P 500 returned 12% last year. Your fund returned 16%. What was your alpha?',
      options: ['12%', '16%', '4%', '28%'],
      correct: 2,
      explanation: 'Alpha = portfolio return − benchmark return = 16% − 12% = 4%. Alpha represents skill-based excess returns.',
    },
    {
      id: 'scenario-drawdown',
      type: 'scenario',
      question: 'Your portfolio hits $200K, then falls to $120K. What is your maximum drawdown?',
      options: ['$80K', '40%', '60%', '$80K and 40%'],
      correct: 3,
      explanation: 'Drawdown = (200K − 120K) / 200K = 40%. Both the dollar amount ($80K) and percentage (40%) matter.',
    },
    {
      id: 'scenario-liquidity',
      type: 'scenario',
      question: 'You need to sell an investment quickly but find no buyers at a fair price. What risk has materialized?',
      options: ['Market risk', 'Credit risk', 'Liquidity risk', 'Inflation risk'],
      correct: 2,
      explanation: 'Liquidity risk is the inability to convert an asset to cash quickly without accepting a steep price discount.',
    },
    {
      id: 'scenario-compound',
      type: 'scenario',
      question: 'You invest $5,000 at age 20 earning 10% annually and never add more. A friend invests $5,000 at age 40 with the same return. At age 60, roughly how much more do you have?',
      options: ['Twice as much', 'About the same', 'Six times as much', 'About 7x more'],
      correct: 3,
      explanation: 'At 10% for 40 years: $5K → ~$226K. At 10% for 20 years: $5K → ~$33K. Starting early is ~7x more powerful due to compound interest.',
    },
    {
      id: 'scenario-etf-vs-mutual',
      type: 'scenario',
      question: 'You want to invest in the S&P 500 but also want to trade during market hours. Which instrument fits best?',
      options: ['A mutual fund', 'An ETF', 'A futures contract', 'A debenture'],
      correct: 1,
      explanation: 'ETFs trade on exchanges throughout the day like stocks. Mutual funds price only once at the end of each trading day.',
    },
    {
      id: 'scenario-govt-bond-safe',
      type: 'scenario',
      question: 'Markets are crashing and investors are panic-selling. Where do most institutional investors move their money?',
      options: ['High-yield bonds', 'Emerging market stocks', 'US Treasury bonds', 'Commodities'],
      correct: 2,
      explanation: '"Flight to quality" — in crises, investors rush to US Treasury bonds, considered the safest asset in the world.',
    },
    {
      id: 'scenario-fiscal-vs-monetary',
      type: 'scenario',
      question: 'The Federal Reserve cuts interest rates to stimulate the economy. What type of policy is this?',
      options: ['Fiscal policy', 'Exchange rate policy', 'Monetary policy', 'Trade policy'],
      correct: 2,
      explanation: 'Monetary policy is controlled by the central bank (Federal Reserve) through interest rates and money supply. Fiscal policy is controlled by the government through taxation and spending.',
    },
    {
      id: 'scenario-rebalance',
      type: 'scenario',
      question: 'Your target is 60% stocks / 40% bonds. After a big stock rally it is now 80% stocks / 20% bonds. What should you do?',
      options: ['Do nothing — let it ride', 'Buy more stocks', 'Sell some stocks and buy bonds to return to 60/40', 'Move everything to cash'],
      correct: 2,
      explanation: 'Rebalancing: sell outperformers (stocks) and buy underperformers (bonds) to return to your target allocation. This systematically enforces "sell high, buy low."',
    },
    {
      id: 'scenario-short-selling',
      type: 'scenario',
      question: 'You believe a company is overvalued and will fall. You borrow and sell shares at $100. The stock rises to $150. What is your loss per share?',
      options: ['$50', '$100', '$150', 'Unlimited'],
      correct: 0,
      explanation: 'You shorted at $100 and must buy back at $150 — a $50 loss per share. Theoretically short losses are unlimited since prices can keep rising.',
    },
    {
      id: 'scenario-sharpe',
      type: 'scenario',
      question: 'Fund A returns 15% with 20% volatility. Fund B returns 12% with 8% volatility. Risk-free rate is 4%. Which has the better Sharpe Ratio?',
      options: ['Fund A (Sharpe: 0.55)', 'Fund B (Sharpe: 1.0)', 'They are equal', 'Cannot be determined'],
      correct: 1,
      explanation: 'Sharpe = (return − risk-free) / volatility. Fund A: (15−4)/20 = 0.55. Fund B: (12−4)/8 = 1.0. Fund B delivers more return per unit of risk.',
    },
    {
      id: 'scenario-recession-signal',
      type: 'scenario',
      question: 'GDP contracts for two consecutive quarters. What does this officially indicate?',
      options: ['A correction', 'A recession', 'A depression', 'Stagflation'],
      correct: 1,
      explanation: 'Two consecutive quarters of negative GDP growth is the standard definition of a recession.',
    },
    {
      id: 'scenario-dca',
      type: 'scenario',
      question: 'You invest $500/month in an index fund regardless of whether markets are up or down. What strategy is this?',
      options: ['Value averaging', 'Market timing', 'Dollar-cost averaging', 'Rebalancing'],
      correct: 2,
      explanation: 'Dollar-cost averaging (DCA): investing a fixed amount at regular intervals. You automatically buy more shares when prices are low and fewer when prices are high.',
    },
    {
      id: 'scenario-hedge',
      type: 'scenario',
      question: 'You own $100K in US stocks but fear a market crash. You buy put options on the S&P 500. What strategy is this?',
      options: ['Speculation', 'Arbitrage', 'Hedging', 'Leveraging'],
      correct: 2,
      explanation: 'Hedging: taking an offsetting position (put options) to reduce risk on an existing position (US stocks). If stocks fall, your puts gain value.',
    },
    {
      id: 'scenario-market-cap',
      type: 'scenario',
      question: 'A company has 10 million shares outstanding trading at $50 each. What is its market cap?',
      options: ['$50 million', '$500 million', '$5 billion', '$50 billion'],
      correct: 1,
      explanation: 'Market cap = shares × price = 10,000,000 × $50 = $500,000,000 ($500 million).',
    },
    {
      id: 'scenario-yield-price',
      type: 'scenario',
      question: 'Interest rates rise from 3% to 5%. What happens to the price of existing bonds paying 3%?',
      options: ['They rise', 'They stay the same', 'They fall', 'They mature immediately'],
      correct: 2,
      explanation: 'Bond prices and yields move inversely. New bonds now pay 5%, making old 3% bonds less attractive — their price falls until their yield matches current rates.',
    },
    {
      id: 'scenario-value-vs-growth',
      type: 'scenario',
      question: 'You invest in companies with low P/E ratios and strong balance sheets, expecting the market to recognize their true worth over time. What style is this?',
      options: ['Growth investing', 'Momentum investing', 'Value investing', 'Index investing'],
      correct: 2,
      explanation: 'Value investing: buying assets below their intrinsic value and waiting for the market to correct the mispricing. Championed by Benjamin Graham and Warren Buffett.',
    },
    {
      id: 'scenario-pe-high',
      type: 'scenario',
      question: 'A tech company has no earnings yet but a P/E of 200x based on projected future profits. Interest rates suddenly rise sharply. What typically happens to its stock?',
      options: ['It rises — rate hikes help growth', 'It falls — higher rates reduce the present value of future earnings', 'It is unaffected', 'Its dividend increases'],
      correct: 1,
      explanation: 'High-growth stocks are rate-sensitive: their value depends on distant future earnings. Higher rates reduce the present value of those earnings, hammering their valuations.',
    },
  ];

  questions.push(...scenarioQuestions);

  const shuffled = shuffleArray(questions);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const EXAM_REWARDS = {
  xp: { pass: 300, excellent: 500 },
  coins: { pass: 150, excellent: 250 },
};

export function getExamResult(score, total) {
  const pct = Math.round((score / total) * 100);
  if (pct >= 90) return { grade: 'Excellent', message: 'Outstanding! You have mastered financial concepts.', color: 'emerald' };
  if (pct >= 75) return { grade: 'Pass', message: 'Great job! You understand most key financial concepts.', color: 'blue' };
  if (pct >= 50) return { grade: 'Needs Review', message: 'Good effort. Review the terms you missed and try again.', color: 'amber' };
  return { grade: 'Keep Studying', message: 'Keep learning! Use flashcards to build your foundation.', color: 'rose' };
}
