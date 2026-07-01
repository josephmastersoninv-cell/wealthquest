export function getStreakMultiplier(streakDays) {
  if (streakDays >= 30) return 2.0;
  if (streakDays >= 14) return 1.75;
  if (streakDays >= 7)  return 1.5;
  if (streakDays >= 3)  return 1.25;
  return 1.0;
}

export function getMultiplierLabel(streakDays) {
  const m = getStreakMultiplier(streakDays);
  if (m === 1.0) return null;
  return `${m}× XP`;
}

export function applyStreakMultiplier(xp, streakDays) {
  return Math.round(xp * getStreakMultiplier(streakDays));
}
