// Weekly leaderboard rewards.
// Snapshots the user's rank each week; when a new week begins, the previous
// week's final rank becomes a claimable coin reward (once per week).

const WEEK_KEY    = 'wq_league_week';        // last week seed we recorded a rank for
const RANK_KEY    = 'wq_league_final_rank';  // rank recorded for that week
const FIELD_KEY   = 'wq_league_field_size';  // number of competitors that week
const CLAIMED_KEY = 'wq_league_reward_week'; // last week seed whose reward was claimed

// Podium/top-10 rewards only count when the league was actually competitive.
// Below this many players you can't be "champion" of an empty room.
export const MIN_COMPETITIVE = 5;

export function getWeeklyReward(rank, fieldSize = MIN_COMPETITIVE) {
  // Not enough competitors for a real ranking — flat participation reward.
  if (fieldSize < MIN_COMPETITIVE) {
    return { coins: 40, rank, tier: 'finisher', emoji: '⭐', title: 'Weekly Finisher',
      blurb: `Play against ${MIN_COMPETITIVE}+ rivals to unlock podium prizes.` };
  }
  if (rank === 1)  return { coins: 300, rank, tier: 'champion', emoji: '🥇', title: 'Champion',    blurb: '1st place — you topped the league!' };
  if (rank === 2)  return { coins: 200, rank, tier: 'silver',   emoji: '🥈', title: 'Runner-Up',   blurb: '2nd place — so close to the top!' };
  if (rank === 3)  return { coins: 150, rank, tier: 'bronze',   emoji: '🥉', title: 'Third Place',  blurb: '3rd place — on the podium!' };
  if (rank <= 10)  return { coins: 80,  rank, tier: 'top10',    emoji: '🏅', title: 'Top 10',       blurb: `#${rank} — a strong finish.` };
  return             { coins: 40,  rank, tier: 'finisher', emoji: '⭐', title: 'Weekly Finisher', blurb: `#${rank} — every week counts.` };
}

// Record this week's rank + field size. If a previous week just ended with an
// unclaimed reward, return it (otherwise null). Safe to call repeatedly.
export function checkWeeklyReward(currentWeek, currentRank, currentFieldSize) {
  const lastWeek    = parseInt(localStorage.getItem(WEEK_KEY) ?? '0', 10);
  const claimedWeek = parseInt(localStorage.getItem(CLAIMED_KEY) ?? '0', 10);
  let pending = null;

  if (lastWeek && lastWeek < currentWeek) {
    const finalRank  = parseInt(localStorage.getItem(RANK_KEY) ?? '0', 10);
    const fieldSize  = parseInt(localStorage.getItem(FIELD_KEY) ?? '0', 10);
    if (finalRank > 0 && claimedWeek < lastWeek) {
      pending = { week: lastWeek, ...getWeeklyReward(finalRank, fieldSize) };
    }
  }

  // Update the rolling snapshot for the current week.
  localStorage.setItem(WEEK_KEY, String(currentWeek));
  localStorage.setItem(RANK_KEY, String(currentRank));
  localStorage.setItem(FIELD_KEY, String(currentFieldSize));

  return pending;
}

export function claimWeeklyReward(week) {
  localStorage.setItem(CLAIMED_KEY, String(week));
}
