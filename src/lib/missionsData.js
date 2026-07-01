const MISSIONS_KEY = 'wealthquest_missions';

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

// Build context-aware missions based on the player's actual state
export function buildMissionsForPlayer(progress) {
  const lessons = (progress?.completed_lessons ?? []).length;
  const streak = progress?.streak_days ?? 0;
  const hearts = progress?.hearts ?? 5;
  const xp = progress?.xp ?? 0;
  const level = progress?.current_level ?? 1;
  const coins = progress?.coins ?? 0;

  // Check situational context
  const pendingReviews = (() => {
    try {
      const q = JSON.parse(localStorage.getItem('wealthquest_review_queue') ?? '[]');
      const today = Date.now();
      return q.filter(r => r.nextReview <= today).length;
    } catch { return 0; }
  })();
  const pendingChests = (() => {
    try {
      const c = JSON.parse(localStorage.getItem('wealthquest_chests') ?? '{}');
      return c.pending ?? 0;
    } catch { return 0; }
  })();

  const candidates = [];

  // ── Always available ──────────────────────────────────────────────────
  candidates.push({ id: 'daily_challenge', label: 'Complete the Daily Challenge', icon: '📅', xp: 40, coins: 15, type: 'daily_done', target: 1, priority: 10 });

  // ── Streak-based ──────────────────────────────────────────────────────
  if (streak === 0) {
    candidates.push({ id: 'start_streak', label: 'Start a new streak today', icon: '🔥', xp: 25, coins: 10, type: 'streak_today', target: 1, priority: 9 });
  } else if (streak >= 3 && streak < 7) {
    candidates.push({ id: 'reach_7', label: `Keep going — ${7 - streak} more days to a week streak!`, icon: '🔥', xp: 30, coins: 10, type: 'streak_today', target: 1, priority: 8 });
  } else if (streak >= 7) {
    candidates.push({ id: 'protect_streak', label: `Protect your ${streak}-day streak`, icon: '🛡️', xp: 20, coins: 10, type: 'streak_today', target: 1, priority: 8 });
  }

  // ── Heart-based ───────────────────────────────────────────────────────
  if (hearts <= 2) {
    candidates.push({ id: 'low_hearts_practice', label: 'Practice without losing hearts in Review', icon: '❤️', xp: 20, coins: 5, type: 'reviews_today', target: 1, priority: 9 });
  }

  // ── Review queue ──────────────────────────────────────────────────────
  if (pendingReviews >= 5) {
    candidates.push({ id: 'clear_reviews', label: `Clear ${Math.min(pendingReviews, 10)} overdue review cards`, icon: '🔄', xp: 35, coins: 10, type: 'reviews_today', target: 1, priority: 9 });
  } else if (pendingReviews > 0) {
    candidates.push({ id: 'do_review', label: 'Complete a spaced review session', icon: '🔄', xp: 25, coins: 8, type: 'reviews_today', target: 1, priority: 7 });
  }

  // ── Chest ─────────────────────────────────────────────────────────────
  if (pendingChests > 0) {
    candidates.push({ id: 'open_chest', label: `Open your ${pendingChests} waiting reward chest${pendingChests > 1 ? 's' : ''}`, icon: '📦', xp: 15, coins: 5, type: 'chest_today', target: 1, priority: 8 });
  }

  // ── Beginner (0–4 lessons) ────────────────────────────────────────────
  if (lessons < 5) {
    candidates.push({ id: 'first_lesson', label: 'Complete your first lesson today', icon: '📚', xp: 40, coins: 15, type: 'lessons_today', target: 1, priority: 10 });
    candidates.push({ id: 'flip_5_cards', label: 'Study 5 flashcards', icon: '📖', xp: 15, coins: 5, type: 'flashcards_today', target: 5, priority: 6 });
  }

  // ── Early game (5–10 lessons) ─────────────────────────────────────────
  if (lessons >= 3 && lessons < 12) {
    candidates.push({ id: 'complete_lesson', label: 'Complete 1 lesson', icon: '📚', xp: 30, coins: 10, type: 'lessons_today', target: 1, priority: 8 });
    candidates.push({ id: 'master_3', label: 'Master 3 new terms on flashcards', icon: '🧠', xp: 30, coins: 10, type: 'mastered_today', target: 3, priority: 7 });
    candidates.push({ id: 'practice_once', label: 'Finish a practice quiz', icon: '⚔️', xp: 20, coins: 8, type: 'practice_today', target: 1, priority: 7 });
  }

  // ── Mid game (10–20 lessons) ──────────────────────────────────────────
  if (lessons >= 8 && lessons < 22) {
    candidates.push({ id: 'complete_2_lessons', label: 'Complete 2 lessons today', icon: '📚', xp: 60, coins: 20, type: 'lessons_today', target: 2, priority: 8 });
    candidates.push({ id: 'scenario', label: 'Complete a financial scenario', icon: '🎭', xp: 35, coins: 12, type: 'scenario_today', target: 1, priority: 7 });
    candidates.push({ id: 'earn_xp_100', label: 'Earn 100 XP in a single day', icon: '⚡', xp: 50, coins: 15, type: 'xp_today', target: 100, priority: 7 });
  }

  // ── Late game (20+ lessons) ───────────────────────────────────────────
  if (lessons >= 18) {
    candidates.push({ id: 'boss_battle', label: 'Win a unit boss battle', icon: '👑', xp: 80, coins: 30, type: 'boss_today', target: 1, priority: 9 });
    candidates.push({ id: 'earn_xp_200', label: 'Earn 200 XP today', icon: '⚡', xp: 75, coins: 25, type: 'xp_today', target: 200, priority: 8 });
    candidates.push({ id: 'master_5', label: 'Master 5 new flashcard terms', icon: '🧠', xp: 45, coins: 15, type: 'mastered_today', target: 5, priority: 7 });
  }

  // ── High level bonuses ────────────────────────────────────────────────
  if (level >= 4) {
    candidates.push({ id: 'portfolio_check', label: 'Check your portfolio & review holdings', icon: '📈', xp: 20, coins: 5, type: 'portfolio_today', target: 1, priority: 6 });
  }
  if (level >= 5) {
    candidates.push({ id: 'combo_10', label: 'Get a 10-answer combo in practice', icon: '💥', xp: 60, coins: 20, type: 'combo_today', target: 10, priority: 7 });
  }
  if (coins < 50 && lessons > 5) {
    candidates.push({ id: 'earn_coins', label: 'Earn 30 coins today', icon: '💰', xp: 20, coins: 10, type: 'coins_today', target: 30, priority: 7 });
  }

  // Sort by priority, pick top 3 unique
  candidates.sort((a, b) => b.priority - a.priority);
  const seen = new Set();
  const picked = [];
  for (const c of candidates) {
    if (picked.length >= 3) break;
    if (!seen.has(c.id)) {
      seen.add(c.id);
      picked.push({ ...c, progress: 0, completed: false, claimed: false });
    }
  }

  return picked;
}

function getStore() {
  try { return JSON.parse(localStorage.getItem(MISSIONS_KEY) ?? '{}'); } catch { return {}; }
}
function saveStore(store) {
  localStorage.setItem(MISSIONS_KEY, JSON.stringify(store));
}

export function getTodayMissions(progress) {
  const today = getTodayKey();
  const store = getStore();
  if (store.date === today && store.missions?.length > 0) return store.missions;
  const missions = buildMissionsForPlayer(progress);
  saveStore({ date: today, missions, counters: {} });
  return missions;
}

export function refreshMissions(progress) {
  // Force regenerate missions based on current progress
  const today = getTodayKey();
  const store = getStore();
  if (store.date !== today) return getTodayMissions(progress);
  // Only regenerate uncompleted ones
  const existing = store.missions ?? [];
  const newMissions = buildMissionsForPlayer(progress);
  const merged = newMissions.map(nm => {
    const old = existing.find(e => e.id === nm.id);
    return old ? old : nm;
  });
  store.missions = merged;
  saveStore(store);
  return merged;
}

export function incrementMissionCounter(type, amount = 1) {
  const store = getStore();
  if (store.date !== getTodayKey()) return;
  store.counters = store.counters ?? {};
  store.counters[type] = (store.counters[type] ?? 0) + amount;
  store.missions = (store.missions ?? []).map(m => {
    if (m.type !== type || m.completed) return m;
    const newProgress = Math.min(m.target, (m.progress ?? 0) + amount);
    return { ...m, progress: newProgress, completed: newProgress >= m.target };
  });
  saveStore(store);
}

export function claimMissionReward(missionId) {
  const store = getStore();
  if (store.date !== getTodayKey()) return 0;
  const mission = store.missions?.find(m => m.id === missionId);
  if (!mission || !mission.completed || mission.claimed) return 0;
  store.missions = store.missions.map(m => m.id === missionId ? { ...m, claimed: true } : m);
  saveStore(store);
  return { xp: mission.xp, coins: mission.coins ?? 0 };
}

export function getMissionsProgress(progress) {
  const store = getStore();
  if (store.date !== getTodayKey()) return getTodayMissions(progress);
  return store.missions ?? getTodayMissions(progress);
}

export function getUnclaimedCompletedCount() {
  const store = getStore();
  if (store.date !== getTodayKey()) return 0;
  return (store.missions ?? []).filter(m => m.completed && !m.claimed).length;
}
