const ENABLED_KEY = 'wealthquest_haptics';

export function isHapticsEnabled() {
  return localStorage.getItem(ENABLED_KEY) !== 'false';
}
export function toggleHaptics() {
  const next = !isHapticsEnabled();
  localStorage.setItem(ENABLED_KEY, String(next));
  return next;
}

export function vibrate(pattern) {
  if (!isHapticsEnabled()) return;
  try { navigator.vibrate?.(pattern); } catch {}
}

export const haptics = {
  correct: () => vibrate([30]),
  wrong:   () => vibrate([60, 40, 60]),
  levelUp: () => vibrate([50, 30, 50, 30, 100]),
  tap:     () => vibrate([10]),
  streak:  () => vibrate([20, 10, 20, 10, 60]),
};
