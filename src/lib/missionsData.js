const MISSIONS_KEY = 'wealthquest_missions';

const POOL = [
  { id: 'complete_1_lesson',   label: 'Complete 1 lesson',          icon: '📚', xp: 30,  type: 'lessons_today',  target: 1 },
  { id: 'complete_2_lessons',  label: 'Complete 2 lessons',         icon: '📚', xp: 60,  type: 'lessons_today',  target: 2 },
  { id: 'earn_50_xp',         label: 'Earn 50 XP today',           icon: '⚡', xp: 25,  type: 'xp_today',       target: 50 },
  { id: 'earn_100_xp',        label: 'Earn 100 XP today',          icon: '⚡', xp: 50,  type: 'xp_today',       target: 100 },
  { id: 'review_session',     label: 'Do a spaced review session',  icon: '🔄', xp: 25,  type: 'reviews_today',  target: 1 },
  { id: 'practice_quiz',      label: 'Finish a practice quiz',      icon: '⚔️', xp: 20,  type: 'practice_today', target: 1 },
  { id: 'master_term',        label: 'Master 3 new terms',          icon: '🧠', xp: 30,  type: 'mastered_today', target: 3 },
  { id: 'daily_challenge',    label: 'Complete daily challenge',    icon: '📅', xp: 40,  type: 'daily_done',     target: 1 },
  { id: 'scenario',           label: 'Complete a scenario',         icon: '🎭', xp: 35,  type: 'scenario_today', target: 1 },
  { id: 'boss_battle',        label: 'Win a boss battle',           icon: '👑', xp: 80,  type: 'boss_today',     target: 1 },
  { id: 'flashcard_10',       label: 'Study 10 flashcards',         icon: '📖', xp: 20,  type: 'flashcards_today', target: 10 },
  { id: 'streak_maintain',    label: 'Keep your streak alive',      icon: '🔥', xp: 15,  type: 'streak_today',   target: 1 },
];

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function getTodayMissions() {
  const today = getTodayKey();
  const stored = JSON.parse(localStorage.getItem(MISSIONS_KEY) ?? '{}');
  if (stored.date === today && stored.missions) return stored.missions;

  // Pick 3 from pool using date seed
  const seed = parseInt(today.replace(/-/g, ''), 10);
  const rand = seededRandom(seed);
  const shuffled = [...POOL].sort(() => rand() - 0.5);
  const picked = shuffled.slice(0, 3).map(m => ({ ...m, progress: 0, completed: false }));

  const data = { date: today, missions: picked, counters: {} };
  localStorage.setItem(MISSIONS_KEY, JSON.stringify(data));
  return picked;
}

function getStore() {
  return JSON.parse(localStorage.getItem(MISSIONS_KEY) ?? '{}');
}

function saveStore(store) {
  localStorage.setItem(MISSIONS_KEY, JSON.stringify(store));
}

export function incrementMissionCounter(type, amount = 1) {
  const store = getStore();
  if (store.date !== getTodayKey()) return; // stale
  store.counters = store.counters ?? {};
  store.counters[type] = (store.counters[type] ?? 0) + amount;

  // Update mission progress
  store.missions = store.missions.map(m => {
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
  store.missions = store.missions.map(m =>
    m.id === missionId ? { ...m, claimed: true } : m
  );
  saveStore(store);
  return mission.xp;
}

export function getMissionsProgress() {
  const store = getStore();
  if (store.date !== getTodayKey()) return getTodayMissions();
  return store.missions ?? getTodayMissions();
}

export function getAllMissionsClaimed() {
  const missions = getMissionsProgress();
  return missions.every(m => m.claimed);
}

export function getUnclaimedCompletedCount() {
  const missions = getMissionsProgress();
  return missions.filter(m => m.completed && !m.claimed).length;
}
