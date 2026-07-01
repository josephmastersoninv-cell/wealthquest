// Spaced repetition queue — stores wrong answers with next-review timestamps
// Uses a simple 3-box system: wrong → 1 day → 3 days → 7 days → mastered

const KEY = 'wealthquest_review_queue';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { return {}; }
}
function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

// intervals in ms for each box level 0→3
const INTERVALS = [0, 24 * 3600000, 3 * 24 * 3600000, 7 * 24 * 3600000];

export function markWrong(termId) {
  const data = load();
  const existing = data[termId];
  // Reset to box 0 if wrong, keep existing box if already scheduled
  data[termId] = {
    termId,
    box: 0,
    nextReview: Date.now(),
    wrongCount: (existing?.wrongCount ?? 0) + 1,
  };
  save(data);
}

export function markCorrect(termId) {
  const data = load();
  const entry = data[termId];
  if (!entry) return;
  const nextBox = Math.min(entry.box + 1, 3);
  if (nextBox >= 3) {
    // Mastered — remove from queue
    delete data[termId];
  } else {
    data[termId] = {
      ...entry,
      box: nextBox,
      nextReview: Date.now() + INTERVALS[nextBox],
    };
  }
  save(data);
}

export function getDueTermIds() {
  const data = load();
  const now = Date.now();
  return Object.values(data)
    .filter(e => e.nextReview <= now)
    .sort((a, b) => a.nextReview - b.nextReview)
    .map(e => e.termId);
}

export function getTotalPending() {
  return Object.keys(load()).length;
}

export function getDueCount() {
  return getDueTermIds().length;
}

export function clearAll() {
  localStorage.removeItem(KEY);
}
