// Daily XP goal system — tracks XP earned today vs target.
// Streak freeze: costs 200 coins, protects one missed day.

export const DAILY_GOALS = [
  { id: 'casual',   label: 'Casual',   xp: 10,  emoji: '🌱', desc: '~5 min/day' },
  { id: 'regular',  label: 'Regular',  xp: 20,  emoji: '🔥', desc: '~10 min/day' },
  { id: 'serious',  label: 'Serious',  xp: 50,  emoji: '⚡', desc: '~20 min/day' },
  { id: 'intense',  label: 'Intense',  xp: 100, emoji: '🏆', desc: '~35 min/day' },
];

export const STREAK_FREEZE_COST = 200; // coins

const GOAL_KEY = 'wealthquest_daily_goal';
const FREEZE_KEY = 'wealthquest_streak_freeze';
const TODAY_XP_KEY = 'wealthquest_today_xp';

export function getDailyGoal() {
  return localStorage.getItem(GOAL_KEY) ?? 'regular';
}

export function setDailyGoal(id) {
  localStorage.setItem(GOAL_KEY, id);
}

export function getGoalConfig() {
  const id = getDailyGoal();
  return DAILY_GOALS.find(g => g.id === id) ?? DAILY_GOALS[1];
}

export function hasStreakFreeze() {
  return localStorage.getItem(FREEZE_KEY) === '1';
}

export function setStreakFreeze(val) {
  if (val) localStorage.setItem(FREEZE_KEY, '1');
  else localStorage.removeItem(FREEZE_KEY);
}

// Track XP earned today (resets each new calendar day)
function getTodayXpRecord() {
  try {
    const raw = localStorage.getItem(TODAY_XP_KEY);
    if (!raw) return { date: '', xp: 0 };
    return JSON.parse(raw);
  } catch { return { date: '', xp: 0 }; }
}

export function getTodayXp() {
  const today = new Date().toISOString().split('T')[0];
  const rec = getTodayXpRecord();
  return rec.date === today ? rec.xp : 0;
}

export function addTodayXp(amount) {
  const today = new Date().toISOString().split('T')[0];
  const rec = getTodayXpRecord();
  const base = rec.date === today ? rec.xp : 0;
  localStorage.setItem(TODAY_XP_KEY, JSON.stringify({ date: today, xp: base + amount }));
}

export function isDailyGoalMet() {
  const goal = getGoalConfig();
  return getTodayXp() >= goal.xp;
}
