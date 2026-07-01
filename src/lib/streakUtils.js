export function computeStreak(lastActiveDate, currentStreak) {
  const today = new Date().toISOString().split('T')[0];
  if (!lastActiveDate) return { streak: 1, isNew: true };

  const last = new Date(lastActiveDate);
  const now = new Date(today);
  const diffDays = Math.round((now - last) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Already played today
    return { streak: currentStreak || 1, isNew: false };
  } else if (diffDays === 1) {
    // Consecutive day — extend streak
    return { streak: (currentStreak || 0) + 1, isNew: true };
  } else {
    // Streak broken
    return { streak: 1, isNew: true };
  }
}

export function shouldRefillHearts(heartsLastRefill) {
  if (!heartsLastRefill) return true;
  const last = new Date(heartsLastRefill);
  const now = new Date();
  // Refill hearts after each new day
  const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
  return diffDays >= 1;
}
