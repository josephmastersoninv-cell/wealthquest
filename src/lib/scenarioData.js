// Branching financial scenarios — choose your path, see real consequences
// Each scenario has a root choice, then a follow-up based on the first pick.

export const SCENARIOS = [
  {
    id: 'sc-1',
    title: 'The Inheritance',
    emoji: '🏠',
    setup: "Your grandmother leaves you €20,000. You have no high-interest debt. What do you do?",
    choices: [
      {
        id: 'a', label: 'Invest it all in the S&P 500 index fund',
        followUp: {
          outcome: 'Smart move. The S&P 500 has returned ~10%/year historically. In 10 years at 10%, your €20K grows to ~€51,000. Staying invested through market dips is the hard part.',
          lesson: 'Time in the market beats timing the market.',
          xp: 80, correct: true,
          followChoices: [
            { id: 'a1', label: 'Invest a fixed amount monthly (DCA)', outcome: 'Perfect. Dollar-cost averaging removes emotion from investing. +20 bonus XP!', xp: 20, correct: true },
            { id: 'a2', label: 'Invest it all at once', outcome: 'Also valid — studies show lump-sum investing beats DCA 2/3 of the time. No wrong answer here.', xp: 10, correct: true },
          ]
        }
      },
      {
        id: 'b', label: 'Buy individual stocks you\'ve been watching',
        followUp: {
          outcome: 'Risky. 85%+ of active stock pickers underperform a simple index fund after fees over 15 years. Even professional fund managers mostly fail to beat the market.',
          lesson: 'Diversification eliminates company-specific risk for free.',
          xp: 20, correct: false,
          followChoices: [
            { id: 'b1', label: 'At least diversify across 20+ stocks', outcome: 'Better — diversifying across sectors reduces risk significantly. Still trail an index fund in most cases.', xp: 15, correct: true },
            { id: 'b2', label: 'Concentrate in 2–3 high-conviction picks', outcome: 'Very high risk. One company scandal or bad earnings can wipe out 50%+. This has destroyed many portfolios.', xp: 5, correct: false },
          ]
        }
      },
      {
        id: 'c', label: 'Keep it in a high-yield savings account',
        followUp: {
          outcome: 'Too conservative for a long time horizon. At 5% savings rate vs 10% S&P 500, the difference over 20 years is €53K vs €134K — you left €81K on the table.',
          lesson: 'Cash is safe short-term but destroys purchasing power long-term.',
          xp: 30, correct: false,
          followChoices: [
            { id: 'c1', label: 'Keep 6 months expenses in savings, invest the rest', outcome: 'Now you\'re thinking clearly! Emergency fund first, then invest. This is the optimal approach.', xp: 40, correct: true },
            { id: 'c2', label: 'Keep all of it "safe" for now', outcome: 'Inflation is silently eroding your money. At 3% inflation, €20K loses €600/year of purchasing power doing nothing.', xp: 10, correct: false },
          ]
        }
      },
      {
        id: 'd', label: 'Spend it on things I\'ve been wanting',
        followUp: {
          outcome: 'That €20K invested at 20 years old becomes ~€134K by age 40 at market returns. Spending it now costs you €114K in future wealth.',
          lesson: 'Every €1 spent today costs you ~€6.7 at retirement (40-year horizon at 10%).',
          xp: 0, correct: false,
          followChoices: [
            { id: 'd1', label: 'At least spend on something appreciating (education, skill)', outcome: 'Investing in yourself can have the highest ROI of all. Education compounds too.', xp: 30, correct: true },
            { id: 'd2', label: 'Buy consumer goods and holiday', outcome: 'It\'s your money — but understand the compounding you\'re giving up. Financial freedom requires delayed gratification.', xp: 0, correct: false },
          ]
        }
      },
    ]
  },
  {
    id: 'sc-2',
    title: 'Market Crash',
    emoji: '📉',
    setup: "The stock market drops 35% in 3 months. Your portfolio is down €14,000. What do you do?",
    choices: [
      {
        id: 'a', label: 'Sell everything to stop further losses',
        followUp: {
          outcome: 'Classic loss aversion mistake. The S&P 500 has recovered from every crash in history. Selling locks in losses and you\'ll likely miss the recovery — which often happens suddenly.',
          lesson: 'Time in the market beats timing the market. Crashes are buying opportunities for long-term investors.',
          xp: 10, correct: false,
          followChoices: [
            { id: 'a1', label: 'Wait for clear recovery before reinvesting', outcome: 'By the time it\'s "clear," markets have already recovered 20–30%. You buy back at higher prices than you sold. Classic mistake.', xp: 5, correct: false },
            { id: 'a2', label: 'Reinvest immediately after selling', outcome: 'You locked in a 35% loss and paid taxes. Better to have never sold. Lesson learned.', xp: 10, correct: false },
          ]
        }
      },
      {
        id: 'b', label: 'Do nothing — stay the course',
        followUp: {
          outcome: 'Best default action for most investors. The average S&P 500 bear market lasts 14 months; the average bull market lasts 5.5 years. Patience is rewarded.',
          lesson: 'Be greedy when others are fearful. Crashes test your investing conviction.',
          xp: 80, correct: true,
          followChoices: [
            { id: 'b1', label: 'Continue regular monthly investments (DCA into the dip)', outcome: 'Outstanding. You\'re buying more units at lower prices. When markets recover, your average cost basis is lower. This is exactly what long-term investors should do.', xp: 30, correct: true },
            { id: 'b2', label: 'Stay the course but pause new contributions', outcome: 'Reasonable — missing the dip-buying opportunity, but at least you didn\'t sell. Acceptable.', xp: 10, correct: true },
          ]
        }
      },
      {
        id: 'c', label: 'Buy more — this is a sale',
        followUp: {
          outcome: 'Warren Buffett\'s approach. Provided you have cash reserves and won\'t need the money soon, buying quality assets at 35% discount is exactly right.',
          lesson: '"Be fearful when others are greedy, and greedy when others are fearful." — Warren Buffett',
          xp: 100, correct: true,
          followChoices: [
            { id: 'c1', label: 'Use your emergency fund to buy more', outcome: 'STOP. Never invest your emergency fund. What if you lose your job in the recession that caused this crash? Emergency funds are sacred.', xp: -10, correct: false },
            { id: 'c2', label: 'Invest cash reserves you had set aside for opportunities', outcome: 'Exactly right. Sophisticated investors keep 5–10% "dry powder" for exactly this scenario. Excellent decision.', xp: 30, correct: true },
          ]
        }
      },
      {
        id: 'd', label: 'Hedge with put options to protect the rest',
        followUp: {
          outcome: 'Valid for sophisticated investors, but expensive. Put options cost 2–5% of portfolio value annually. Long-term investors are better off accepting volatility than paying this ongoing insurance cost.',
          lesson: 'Hedging costs money. It\'s insurance — appropriate for short time horizons, not long-term portfolios.',
          xp: 40, correct: true,
          followChoices: [
            { id: 'd1', label: 'Hedge the whole portfolio', outcome: 'Over-hedging essentially turns equities into expensive bonds. You\'re paying for volatility protection you don\'t need long-term.', xp: 10, correct: false },
            { id: 'd2', label: 'Partial hedge on the most volatile positions only', outcome: 'Smart risk management. Protecting your highest-risk positions while keeping core holdings unhedged balances cost vs protection.', xp: 20, correct: true },
          ]
        }
      },
    ]
  },
  {
    id: 'sc-3',
    title: 'The Job Offer',
    emoji: '💼',
    setup: "You get a job offer: €75K salary with no pension vs €65K with a 10% employer pension match. Which do you take?",
    choices: [
      {
        id: 'a', label: 'Take the €75K — more cash now',
        followUp: {
          outcome: 'On the surface, €75K wins. But wait — the pension match on the €65K job adds €6,500/year free money. Your real compensation is €71,500. And the pension grows tax-deferred over decades.',
          lesson: 'Always calculate total compensation. Benefits — especially pension matches — are often worth more than salary differences.',
          xp: 20, correct: false,
          followChoices: [
            { id: 'a1', label: 'Negotiate the €75K job to also include pension', outcome: 'Best possible outcome! Never leave money on the table. Employer matches are the highest-return "investment" available.', xp: 40, correct: true },
            { id: 'a2', label: 'Invest the salary difference yourself instead', outcome: 'Possible but you lose the tax advantages and employer match. Self-investing the €10K difference in a regular account gives much less than a matched pension.', xp: 15, correct: false },
          ]
        }
      },
      {
        id: 'b', label: 'Take the €65K with the pension match',
        followUp: {
          outcome: 'Excellent thinking. The 10% match on €65K = €6,500/year free. Over 30 years at 8% growth, that employer contribution alone compounds to ~€740,000 — tax deferred.',
          lesson: 'An employer pension match is a 100% instant return on your contribution. Never leave it unclaimed.',
          xp: 90, correct: true,
          followChoices: [
            { id: 'b1', label: 'Contribute exactly 10% to maximize the match', outcome: 'Perfect — you\'re extracting every euro of free money available. Classic optimal move.', xp: 20, correct: true },
            { id: 'b2', label: 'Contribute more than 10% for additional tax benefits', outcome: 'Even better if you can afford it. Pension contributions are tax-deductible — double benefit.', xp: 25, correct: true },
          ]
        }
      },
      {
        id: 'c', label: 'Negotiate both offers higher before deciding',
        followUp: {
          outcome: 'Smart — always negotiate. But focus negotiation on the pension offer since the total comp math already favors it. Getting both salary AND match is the ideal outcome.',
          lesson: 'Negotiation is a skill that compounds over a career. A €5K salary win recurs every year and grows with future raises.',
          xp: 60, correct: true,
          followChoices: [
            { id: 'c1', label: 'Accept whatever counteroffer comes back', outcome: 'Be careful. Understand what you\'re accepting. Counter with the pension job unless the salary difference becomes massive (>€15K).', xp: 20, correct: true },
            { id: 'c2', label: 'Use competing offers as leverage for the better total package', outcome: 'Textbook negotiation. Competing offers are the single most powerful salary-negotiation tool available.', xp: 30, correct: true },
          ]
        }
      },
    ]
  },
  {
    id: 'sc-4',
    title: 'Debt Dilemma',
    emoji: '💳',
    setup: "You have €500/month spare cash. You have a 4% mortgage and a 22% credit card balance of €3,000. What do you do?",
    choices: [
      {
        id: 'a', label: 'Pay off the credit card first, then the mortgage',
        followUp: {
          outcome: 'Mathematically optimal — the avalanche method. 22% credit card interest vs 4% mortgage. Eliminating 22% guaranteed return beats any investment. At €500/month, the card is gone in ~6 months.',
          lesson: 'High-interest debt is a guaranteed negative return. Eliminating it beats investing in most markets.',
          xp: 100, correct: true,
          followChoices: [
            { id: 'a1', label: 'After card is cleared, invest the €500/month', outcome: 'Perfect sequence: eliminate high-cost debt → invest. Your mortgage at 4% is cheaper than market returns (~10%), so keep paying minimums and invest the rest.', xp: 30, correct: true },
            { id: 'a2', label: 'After card is cleared, aggressively pay the mortgage', outcome: 'Overpaying a 4% mortgage when markets return ~10% costs you the difference. Better to invest, unless peace of mind is worth the cost to you.', xp: 10, correct: false },
          ]
        }
      },
      {
        id: 'b', label: 'Split evenly between both debts',
        followUp: {
          outcome: 'Better than ignoring the card but suboptimal. You\'re prolonging 22% interest charges unnecessarily. The mathematically correct approach is to clear the highest-rate debt first.',
          lesson: 'Debt avalanche: always attack the highest interest rate first to minimize total interest paid.',
          xp: 40, correct: false,
          followChoices: [
            { id: 'b1', label: 'At least this keeps both moving', outcome: 'True, but you pay significantly more total interest. The card interest alone costs ~€55/month at 22%. Clear it fast.', xp: 15, correct: false },
            { id: 'b2', label: 'Switch to prioritizing the card', outcome: 'Good correction. Redirecting the full €500 to the card clears it ~4 months faster, saving ~€220 in interest.', xp: 30, correct: true },
          ]
        }
      },
      {
        id: 'c', label: 'Invest the €500 in stocks instead — better returns',
        followUp: {
          outcome: 'Wrong priority. You\'re paying 22% interest guaranteed while hoping stocks return 10%. That\'s a -12% guaranteed real return on the uncleared balance. This is one of the most common financial mistakes.',
          lesson: 'Eliminating high-interest debt has a guaranteed risk-free return equal to the interest rate. No investment reliably beats 22%.',
          xp: 10, correct: false,
          followChoices: [
            { id: 'c1', label: 'Continue investing, minimum payments on card', outcome: 'The math is clear: -12% net. For every €1,000 you invest growing at 10%, your card costs you 22%. You\'re losing money on net.', xp: 0, correct: false },
            { id: 'c2', label: 'Clear the card first, then invest', outcome: 'Correct pivot! Now you eliminate the 22% drag and can invest with a clean slate at the mortgage\'s 4% rate.', xp: 50, correct: true },
          ]
        }
      },
    ]
  },
  {
    id: 'sc-5',
    title: 'Startup Offer',
    emoji: '🚀',
    setup: "A friend asks you to invest €10,000 in their startup for 5% equity. They project €1M revenue in year 3. Do you invest?",
    choices: [
      {
        id: 'a', label: 'Yes — 5% of a €10M company would be €500K',
        followUp: {
          outcome: '90% of startups fail. The expected value of your €10K is ~€50K (10% × €500K) but you\'re far more likely to lose all €10K. Only invest money you can afford to lose completely.',
          lesson: 'Survivorship bias makes startups look attractive. You hear about the wins, not the 90% that fail quietly.',
          xp: 30, correct: false,
          followChoices: [
            { id: 'a1', label: 'Invest but only money I can afford to lose', outcome: 'At least you understand the risk. Treating startup investments as lottery tickets (fun money only) is the right mental model.', xp: 30, correct: true },
            { id: 'a2', label: 'Invest my emergency fund for higher upside', outcome: 'Never. Your emergency fund is not risk capital. If you need it during the 3-5 years the startup is developing, you\'re stuck.', xp: 0, correct: false },
          ]
        }
      },
      {
        id: 'b', label: 'No — too risky, I\'ll stick with index funds',
        followUp: {
          outcome: 'Rational default. Index funds give you diversified exposure to thousands of companies without the concentration risk of a single startup bet.',
          lesson: 'Saying no to exciting opportunities is often the most disciplined financial decision.',
          xp: 70, correct: true,
          followChoices: [
            { id: 'b1', label: 'Offer to help in another way instead (skills, network)', outcome: 'Excellent. Supporting a friend\'s startup without financial risk is the best of both worlds. Equity isn\'t the only way to participate.', xp: 20, correct: true },
            { id: 'b2', label: 'Decline and feel no guilt about it', outcome: 'Correct — FOMO is the enemy of rational investing. Your financial security comes first.', xp: 15, correct: true },
          ]
        }
      },
      {
        id: 'c', label: 'Ask to see financials and business plan first',
        followUp: {
          outcome: 'Best process. Due diligence before any investment is essential. Ask for: business plan, financial projections, cap table, how much runway they have, what the exit strategy is.',
          lesson: 'Professional investors spend weeks doing due diligence. Requests for quick decisions are red flags.',
          xp: 80, correct: true,
          followChoices: [
            { id: 'c1', label: 'Invest if the numbers look good', outcome: 'Reasonable — but remember, startups almost always miss projections. Build in a 70% haircut to any revenue forecast you see.', xp: 20, correct: true },
            { id: 'c2', label: 'Negotiate better terms (10% for €10K)', outcome: 'Smart negotiation. If they won\'t negotiate equity for friends and family, that\'s a red flag about how they\'ll treat you as an investor.', xp: 25, correct: true },
          ]
        }
      },
    ]
  },
];

export function getScenarioById(id) {
  return SCENARIOS.find(s => s.id === id);
}

export const SCENARIO_XP = 60;
export const SCENARIO_BONUS_XP = 40;
