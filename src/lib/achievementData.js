export const ACHIEVEMENTS = [
  // Learning
  { id: 'first_lesson',   title: 'First Step',        description: 'Complete your first lesson',         icon: '🎒', rarity: 'common'   },
  { id: 'lessons_5',      title: 'Getting Warmed Up', description: 'Complete 5 lessons',                 icon: '📚', rarity: 'common'   },
  { id: 'lessons_all',    title: 'Graduate',          description: 'Complete all lessons',               icon: '🎓', rarity: 'epic'     },
  // Terms
  { id: 'first_study',    title: 'Flash!',            description: 'Master your first term',             icon: '⚡', rarity: 'common'   },
  { id: 'mastered_10',    title: 'Vocab Builder',     description: 'Master 10 financial terms',          icon: '🎯', rarity: 'common'   },
  { id: 'mastered_25',    title: 'Halfway There',     description: 'Master 25 financial terms',          icon: '🌟', rarity: 'rare'     },
  { id: 'mastered_all',   title: 'Glossary Master',   description: 'Master all 50 financial terms',      icon: '🏆', rarity: 'legendary'},
  // Streak
  { id: 'streak_3',       title: 'On a Roll',         description: '3-day learning streak',              icon: '🔥', rarity: 'common'   },
  { id: 'streak_7',       title: 'Week Warrior',      description: '7-day learning streak',              icon: '⚡', rarity: 'rare'     },
  { id: 'streak_30',      title: 'Month Master',      description: '30-day learning streak',             icon: '🌙', rarity: 'legendary'},
  // Exam
  { id: 'exam_pass',      title: 'Certified',         description: 'Pass the Final Exam (75%+)',         icon: '📜', rarity: 'rare'     },
  { id: 'exam_ace',       title: 'Top of the Class',  description: 'Ace the Final Exam (90%+)',          icon: '💎', rarity: 'epic'     },
  // Practice
  { id: 'practice_5',     title: 'Drill Sergeant',    description: 'Complete 5 practice sessions',       icon: '🎮', rarity: 'common'   },
  { id: 'practice_10',    title: 'Grinder',           description: 'Complete 10 practice sessions',      icon: '⚔️', rarity: 'rare'     },
  // Daily challenge
  { id: 'daily_first',    title: 'Daily Devotee',     description: 'Complete your first daily challenge', icon: '📅', rarity: 'common'   },
  { id: 'daily_7',        title: 'Weekly Ritual',     description: 'Complete 7 daily challenges',        icon: '🗓️', rarity: 'rare'     },
  // Boss
  { id: 'boss_first',     title: 'Boss Slayer',       description: 'Beat your first boss battle',        icon: '⚔️', rarity: 'rare'     },
  { id: 'boss_3',         title: 'Dragon Hunter',     description: 'Beat 3 boss battles',                icon: '🐉', rarity: 'epic'     },
  // Portfolio / investing
  { id: 'first_trade',    title: 'First Trade',       description: 'Make your first stock purchase',     icon: '📈', rarity: 'common'   },
  { id: 'diversified',    title: 'Diversified',       description: 'Hold 5 different assets',            icon: '🌍', rarity: 'rare'     },
  { id: 'profit_maker',   title: 'In The Green',      description: 'Portfolio value above starting cash',icon: '💚', rarity: 'rare'     },
  // Login
  { id: 'login_7',        title: 'Loyal Player',      description: 'Log in 7 days in a row',             icon: '🗝️', rarity: 'rare'     },
  // Level
  { id: 'level_5',        title: 'Rising Star',       description: 'Reach Level 5: Market Watcher',      icon: '🌠', rarity: 'rare'     },
  { id: 'level_10',       title: 'Wolf of Wall St.',  description: 'Reach the max level',                icon: '🐺', rarity: 'legendary'},
  // XP
  { id: 'xp_1000',        title: 'XP Machine',        description: 'Earn 1,000 total XP',                icon: '🔋', rarity: 'common'   },
  { id: 'xp_5000',        title: 'Power Player',      description: 'Earn 5,000 total XP',                icon: '💥', rarity: 'epic'     },
];

export const RARITY_COLOR = {
  common:    'from-slate-400 to-slate-500',
  rare:      'from-blue-400 to-indigo-500',
  epic:      'from-violet-500 to-purple-600',
  legendary: 'from-amber-400 to-orange-500',
};

export const RARITY_LABEL = {
  common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary',
};

export function checkNewAchievements(oldProgress, newProgress) {
  const already = new Set(oldProgress?.achievements ?? []);
  const unlocked = [];
  const p = newProgress;
  const checks = {
    first_lesson:  () => (p.completed_lessons?.length ?? 0) >= 1,
    lessons_5:     () => (p.completed_lessons?.length ?? 0) >= 5,
    lessons_all:   () => (p.completed_lessons?.length ?? 0) >= 26,
    first_study:   () => (p.mastered_terms?.length ?? 0) >= 1,
    mastered_10:   () => (p.mastered_terms?.length ?? 0) >= 10,
    mastered_25:   () => (p.mastered_terms?.length ?? 0) >= 25,
    mastered_all:  () => (p.mastered_terms?.length ?? 0) >= 50,
    streak_3:      () => (p.streak_days ?? 0) >= 3,
    streak_7:      () => (p.streak_days ?? 0) >= 7,
    streak_30:     () => (p.streak_days ?? 0) >= 30,
    exam_pass:     () => (p.exam_best_score ?? 0) >= 75,
    exam_ace:      () => (p.exam_best_score ?? 0) >= 90,
    practice_5:    () => (p.practice_sessions ?? 0) >= 5,
    practice_10:   () => (p.practice_sessions ?? 0) >= 10,
    daily_first:   () => (p.daily_challenge_streak ?? 0) >= 1 || !!p.daily_challenge_date,
    daily_7:       () => (p.daily_challenge_streak ?? 0) >= 7,
    boss_first:    () => (p.boss_wins ?? 0) >= 1,
    boss_3:        () => (p.boss_wins ?? 0) >= 3,
    first_trade:   () => (p.trade_count ?? 0) >= 1,
    diversified:   () => (p.unique_assets_held ?? 0) >= 5,
    profit_maker:  () => (p.portfolio_profit ?? 0) > 0,
    login_7:       () => (p.login_streak ?? 0) >= 7,
    level_5:       () => (p.current_level ?? 1) >= 5,
    level_10:      () => (p.current_level ?? 1) >= 10,
    xp_1000:       () => (p.xp ?? 0) >= 1000,
    xp_5000:       () => (p.xp ?? 0) >= 5000,
  };
  for (const a of ACHIEVEMENTS) {
    if (!already.has(a.id) && checks[a.id]?.()) unlocked.push(a);
  }
  return unlocked;
}
