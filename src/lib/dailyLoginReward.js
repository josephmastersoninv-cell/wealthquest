// Daily login reward — 7-day cycle, resets after completion
const KEY_LAST = 'wealthquest_login_last';
const KEY_DAY  = 'wealthquest_login_day';
const KEY_CLAIMED = 'wealthquest_login_claimed_today';

export const LOGIN_REWARDS = [
  { day: 1, xp: 20,  coins: 10,  bonus: null,                   label: 'Day 1' },
  { day: 2, xp: 30,  coins: 20,  bonus: null,                   label: 'Day 2' },
  { day: 3, xp: 40,  coins: 30,  bonus: '❤️ Heart Refill',      label: 'Day 3' },
  { day: 4, xp: 50,  coins: 40,  bonus: null,                   label: 'Day 4' },
  { day: 5, xp: 60,  coins: 50,  bonus: '⚡ XP Boost (30min)',  label: 'Day 5' },
  { day: 6, xp: 75,  coins: 60,  bonus: null,                   label: 'Day 6' },
  { day: 7, xp: 100, coins: 100, bonus: '🛡️ Streak Shield',     label: 'Day 7', special: true },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function shouldShowLoginReward() {
  const last = localStorage.getItem(KEY_LAST);
  const claimedToday = localStorage.getItem(KEY_CLAIMED);
  if (claimedToday === todayStr()) return false;
  return last !== todayStr();
}

export function getCurrentLoginDay() {
  const last = localStorage.getItem(KEY_LAST);
  const day = parseInt(localStorage.getItem(KEY_DAY) ?? '0', 10);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yd = yesterday.toISOString().slice(0, 10);
  // If last login was yesterday, continue the streak; otherwise reset
  if (last === yd) return Math.min(day + 1, 7);
  if (last === todayStr()) return day; // already incremented today (shouldn't happen if shouldShow is false)
  return 1; // reset
}

export function claimLoginReward() {
  const day = getCurrentLoginDay();
  const reward = LOGIN_REWARDS[day - 1];
  localStorage.setItem(KEY_LAST, todayStr());
  localStorage.setItem(KEY_DAY, String(day >= 7 ? 0 : day)); // reset after day 7
  localStorage.setItem(KEY_CLAIMED, todayStr());

  // Apply side effects
  if (reward.bonus === '⚡ XP Boost (30min)') {
    localStorage.setItem('wealthquest_xp_boost', String(Date.now() + 30 * 60 * 1000));
  }
  if (reward.bonus === '🛡️ Streak Shield') {
    localStorage.setItem('wealthquest_streak_shield', '1');
  }

  return { ...reward, day };
}

export function getLoginStreak() {
  return parseInt(localStorage.getItem(KEY_DAY) ?? '0', 10);
}

export function hasStreakShield() {
  return localStorage.getItem('wealthquest_streak_shield') === '1';
}

export function useStreakShield() {
  localStorage.removeItem('wealthquest_streak_shield');
}
