import { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/lib/localClient';
import { shouldRefillHearts } from '@/lib/streakUtils';
import { getLevelForXp } from '@/lib/levelData';
import { checkNewAchievements } from '@/lib/achievementData';
import { addTodayXp } from '@/lib/dailyGoal';

const DEFAULT_PROGRESS = {
  xp: 0,
  current_level: 1,
  completed_lessons: [],
  coins: 0,
  portfolio_balance: 0,
  portfolio_holdings: [],
  streak_days: 0,
  last_active_date: null,
  hearts: 5,
  hearts_last_refill: null,
  exam_attempts: 0,
  exam_best_score: null,
  mastered_terms: [],
  practice_sessions: 0,
  achievements: [],
  daily_challenge_date: null,
  daily_challenge_streak: 0,
  lesson_stars: {},
};

// Read synchronously from localStorage so pages never start with null progress
function readInitialProgress() {
  try {
    const raw = localStorage.getItem('wealthquest_user_progress');
    const records = raw ? JSON.parse(raw) : [];
    return records[0] ?? null;
  } catch { return null; }
}

export function useUserProgress() {
  const [progress, setProgress] = useState(readInitialProgress);
  const [progressId, setProgressId] = useState(() => readInitialProgress()?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [newAchievements, setNewAchievements] = useState([]);
  const prevProgress = useRef(null);

  useEffect(() => {
    loadProgress();
    // Re-read localStorage whenever cloud sync restores data from Supabase
    const onRestore = () => loadProgress();
    window.addEventListener('wq:progress_restored', onRestore);
    return () => window.removeEventListener('wq:progress_restored', onRestore);
  }, []);

  const loadProgress = async () => {
    setLoading(true);
    const records = await base44.entities.UserProgress.list('-created_date', 1);
    let record;
    if (records.length > 0) {
      record = records[0];
      const updates = {};
      if (!record.is_premium && shouldRefillHearts(record.hearts_last_refill)) {
        const today = new Date().toISOString().split('T')[0];
        updates.hearts = 5;
        updates.hearts_last_refill = today;
      }
      // Sync level from XP
      const expectedLevel = getLevelForXp(record.xp ?? 0).level;
      if (record.current_level !== expectedLevel) {
        updates.current_level = expectedLevel;
      }
      if (Object.keys(updates).length > 0) {
        record = await base44.entities.UserProgress.update(record.id, updates);
      }
    } else {
      record = await base44.entities.UserProgress.create(DEFAULT_PROGRESS);
    }
    prevProgress.current = record;
    setProgress(record);
    setProgressId(record.id);
    setLoading(false);
  };

  const updateProgress = useCallback(async (updates) => {
    if (!progressId) return;

    // Auto-sync level if XP is changing; track daily XP
    if (updates.xp !== undefined) {
      updates.current_level = getLevelForXp(updates.xp).level;
      const prev = prevProgress.current?.xp ?? 0;
      const gained = updates.xp - prev;
      if (gained > 0) addTodayXp(gained);
    }

    const updated = await base44.entities.UserProgress.update(progressId, updates);

    // Check for new achievements
    const unlocked = checkNewAchievements(prevProgress.current, updated);
    if (unlocked.length > 0) {
      const achievementIds = [
        ...(updated.achievements ?? []),
        ...unlocked.map((a) => a.id),
      ];
      const withAchievements = await base44.entities.UserProgress.update(progressId, {
        achievements: achievementIds,
      });
      prevProgress.current = withAchievements;
      setProgress(withAchievements);
      setNewAchievements(unlocked);
      return withAchievements;
    }

    prevProgress.current = updated;
    setProgress(updated);
    return updated;
  }, [progressId]);

  const dismissAchievements = useCallback(() => setNewAchievements([]), []);

  return { progress, loading, updateProgress, newAchievements, dismissAchievements };
}
