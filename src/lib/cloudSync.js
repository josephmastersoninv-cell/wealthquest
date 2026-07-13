// Cloud sync helpers — fire-and-forget writes, blocking reads.
// All writes are debounced so rapid updates (trades, XP gains) don't spam Supabase.

import { supabase } from './supabase';

async function getCurrentUserId() {
  if (!supabase) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

// ── Debounced push helpers ────────────────────────────────────────────────────

let _progressTimer = null;
let _latestProgressRecord = null;

export function pushProgress(record) {
  _latestProgressRecord = record;
  clearTimeout(_progressTimer);
  _progressTimer = setTimeout(_flushProgress, 4000);
}

async function _flushProgress() {
  if (!_latestProgressRecord) return;
  const record = _latestProgressRecord;
  const userId = await getCurrentUserId();
  if (!userId) return;

  const {
    xp = 0, coins = 0, streak_days = 0, last_active_date,
    hearts = 5, hearts_last_refill, exam_attempts = 0, exam_best_score,
    completed_lessons = [], mastered_terms = [], practice_sessions = 0,
    achievements = [], current_level = 1, lesson_stars = {},
    daily_challenge_date, daily_challenge_streak = 0,
  } = record;

  supabase.from('players').update({
    xp, coins, streak_days, last_active_date,
    hearts, hearts_last_refill, exam_attempts, exam_best_score,
    completed_lessons, mastered_terms, practice_sessions,
    achievements, current_level, lesson_stars,
    daily_challenge_date, daily_challenge_streak,
    updated_at: new Date().toISOString(),
  }).eq('id', userId).then(() => {});
}

let _portfolioTimer = null;
let _latestPortfolio = null;

export function pushPortfolio(portfolio) {
  _latestPortfolio = portfolio;
  clearTimeout(_portfolioTimer);
  _portfolioTimer = setTimeout(_flushPortfolio, 4000);
}

async function _flushPortfolio() {
  if (!_latestPortfolio) return;
  const p = _latestPortfolio;
  const userId = await getCurrentUserId();
  if (!userId) return;

  supabase.from('players').update({
    portfolio_cash:     p.cash ?? 10000,
    portfolio_holdings: p.holdings ?? {},
    updated_at: new Date().toISOString(),
  }).eq('id', userId).then(() => {});
}

// Flush immediately (call on beforeunload so in-flight data isn't lost)
export function flushNow() {
  clearTimeout(_progressTimer);
  clearTimeout(_portfolioTimer);
  _flushProgress();
  _flushPortfolio();
}

// ── Pull and restore ──────────────────────────────────────────────────────────

const PROGRESS_KEY  = 'wealthquest_user_progress';
const PORTFOLIO_KEY = 'wealthquest_portfolio';

export async function pullAndRestore(userId) {
  if (!supabase || !userId) return false;
  try {
    const { data: player, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !player) return false;

    // ── Restore user progress ────────────────────────────────────────────────
    const raw = localStorage.getItem(PROGRESS_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const local = existing[0] ?? null;

    // If cloud data is all zeros and local has real data, keep local (new device, first login)
    const cloudHasData = (player.xp ?? 0) > 0
      || (player.coins ?? 0) > 0
      || (player.streak_days ?? 0) > 0
      || (player.exam_best_score ?? 0) > 0;
    const localHasData = (local?.xp ?? 0) > 0
      || (local?.coins ?? 0) > 0
      || (local?.streak_days ?? 0) > 0;

    // Merge: cloud wins if it has more XP (it's the authoritative source for signed-in users)
    const useCloud = cloudHasData || !localHasData;

    if (useCloud) {
      const merged = {
        id:                      local?.id ?? `cloud_${userId}`,
        created_date:            local?.created_date ?? new Date().toISOString(),
        xp:                      player.xp                ?? local?.xp                ?? 0,
        coins:                   player.coins              ?? local?.coins              ?? 0,
        streak_days:             player.streak_days        ?? local?.streak_days        ?? 0,
        last_active_date:        player.last_active_date   ?? local?.last_active_date   ?? null,
        hearts:                  player.hearts             ?? local?.hearts             ?? 5,
        hearts_last_refill:      player.hearts_last_refill ?? local?.hearts_last_refill ?? null,
        exam_attempts:           player.exam_attempts      ?? local?.exam_attempts      ?? 0,
        exam_best_score:         player.exam_best_score    ?? local?.exam_best_score    ?? null,
        completed_lessons:       player.completed_lessons  ?? local?.completed_lessons  ?? [],
        mastered_terms:          player.mastered_terms     ?? local?.mastered_terms     ?? [],
        practice_sessions:       player.practice_sessions  ?? local?.practice_sessions  ?? 0,
        achievements:            player.achievements       ?? local?.achievements       ?? [],
        current_level:           player.current_level      ?? local?.current_level      ?? 1,
        lesson_stars:            player.lesson_stars       ?? local?.lesson_stars       ?? {},
        daily_challenge_date:    player.daily_challenge_date   ?? local?.daily_challenge_date   ?? null,
        daily_challenge_streak:  player.daily_challenge_streak ?? local?.daily_challenge_streak ?? 0,
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify([merged]));
    }

    // ── Restore portfolio ────────────────────────────────────────────────────
    const hasCloudPortfolio = player.portfolio_holdings
      && typeof player.portfolio_holdings === 'object'
      && Object.keys(player.portfolio_holdings).length > 0;

    if (hasCloudPortfolio) {
      const existingPortfolio = (() => {
        try { return JSON.parse(localStorage.getItem(PORTFOLIO_KEY) ?? 'null'); } catch { return null; }
      })();

      // Restore from cloud ONLY on a fresh device (no meaningful local portfolio).
      // Auth token refreshes re-fire this — clobbering an active local portfolio
      // would revert recent trades and wipe local trade history.
      const localHoldings = Object.keys(existingPortfolio?.holdings ?? {}).length;
      const localIsFresh = !existingPortfolio || (localHoldings === 0 && !(existingPortfolio.trades?.length));
      if (localIsFresh) {
        localStorage.setItem(PORTFOLIO_KEY, JSON.stringify({
          cash:     player.portfolio_cash ?? 10000,
          holdings: player.portfolio_holdings,
          trades:   existingPortfolio?.trades ?? [],
        }));
      }
    }

    return true;
  } catch {
    return false;
  }
}
