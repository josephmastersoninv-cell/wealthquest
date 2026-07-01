const KEY = 'wealthquest_weekly_recap';

function getWeekKey() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  return monday.toISOString().split('T')[0];
}

export function recordDailySnapshot(progress) {
  const week = getWeekKey();
  const store = JSON.parse(localStorage.getItem(KEY) ?? '{}');
  if (!store[week]) store[week] = { snapshots: [], startXp: progress?.xp ?? 0, startLessons: (progress?.completed_lessons ?? []).length };
  const today = new Date().toISOString().split('T')[0];
  store[week].snapshots = store[week].snapshots.filter(s => s.date !== today);
  store[week].snapshots.push({ date: today, xp: progress?.xp ?? 0, lessons: (progress?.completed_lessons ?? []).length });
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function getWeeklyRecap(progress) {
  const week = getWeekKey();
  const store = JSON.parse(localStorage.getItem(KEY) ?? '{}');
  const data = store[week];
  if (!data || data.snapshots.length < 2) return null;

  const startXp = data.startXp ?? 0;
  const currentXp = progress?.xp ?? 0;
  const xpGained = Math.max(0, currentXp - startXp);
  const startLessons = data.startLessons ?? 0;
  const currentLessons = (progress?.completed_lessons ?? []).length;
  const lessonsCompleted = Math.max(0, currentLessons - startLessons);
  const daysActive = new Set(data.snapshots.map(s => s.date)).size;

  return { xpGained, lessonsCompleted, daysActive, week };
}

export function shouldShowRecap() {
  // Show on Mondays or if it's been shown less than once this week
  const shownKey = `wealthquest_recap_shown_${getWeekKey()}`;
  return !localStorage.getItem(shownKey);
}

export function markRecapSeen() {
  localStorage.setItem(`wealthquest_recap_shown_${getWeekKey()}`, '1');
}
