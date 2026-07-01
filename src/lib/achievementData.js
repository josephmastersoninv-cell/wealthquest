export const ACHIEVEMENTS = [
  {
    id: 'first_study',
    title: 'First Step',
    description: 'Study your first flashcard',
    icon: '📖',
    check: (p) => (p.mastered_terms?.length ?? 0) >= 1,
  },
  {
    id: 'mastered_10',
    title: 'Getting Started',
    description: 'Master 10 financial terms',
    icon: '🎯',
    check: (p) => (p.mastered_terms?.length ?? 0) >= 10,
  },
  {
    id: 'mastered_25',
    title: 'Halfway There',
    description: 'Master 25 financial terms',
    icon: '🌟',
    check: (p) => (p.mastered_terms?.length ?? 0) >= 25,
  },
  {
    id: 'mastered_all',
    title: 'Glossary Master',
    description: 'Master all 50 financial terms',
    icon: '🏆',
    check: (p) => (p.mastered_terms?.length ?? 0) >= 50,
  },
  {
    id: 'streak_3',
    title: 'On a Roll',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    check: (p) => (p.streak_days ?? 0) >= 3,
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '⚡',
    check: (p) => (p.streak_days ?? 0) >= 7,
  },
  {
    id: 'exam_pass',
    title: 'Certified',
    description: 'Pass the Final Exam (75%+)',
    icon: '📜',
    check: (p) => (p.exam_best_score ?? 0) >= 75,
  },
  {
    id: 'exam_ace',
    title: 'Top of the Class',
    description: 'Ace the Final Exam (90%+)',
    icon: '💎',
    check: (p) => (p.exam_best_score ?? 0) >= 90,
  },
  {
    id: 'practice_10',
    title: 'Drill Sergeant',
    description: 'Complete 10 practice sessions',
    icon: '🎮',
    check: (p) => (p.practice_sessions ?? 0) >= 10,
  },
  {
    id: 'max_level',
    title: 'Market Wizard',
    description: 'Reach the maximum level',
    icon: '🧙',
    check: (p) => (p.xp ?? 0) >= 8000,
  },
];

export function checkNewAchievements(oldProgress, newProgress) {
  const already = new Set(oldProgress?.achievements ?? []);
  const unlocked = [];
  for (const a of ACHIEVEMENTS) {
    if (!already.has(a.id) && a.check(newProgress)) {
      unlocked.push(a);
    }
  }
  return unlocked;
}
