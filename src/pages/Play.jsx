import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Calendar, Swords, Award, ChevronRight, CheckCircle2, Lock, Flame, ShoppingBag, GitBranch, RotateCcw } from 'lucide-react';
import { useUserProgress } from '@/lib/useUserProgress';
import { getTodayKey } from '@/lib/dailyChallengeData';
import { LESSONS } from '@/lib/lessonData';
import { getDueCount } from '@/lib/reviewData';
import { getPendingChests } from '@/lib/chestData';
import ChestModal from '@/components/ChestModal';
import SectionIntro, { useSectionIntro } from '@/components/SectionIntro';
import { toast } from 'sonner';

export default function Play() {
  const { progress, updateProgress } = useUserProgress();
  const [showChest, setShowChest] = useState(false);
  const { show: showIntro, dismiss: dismissIntro } = useSectionIntro('play');

  const dailyDone = progress?.daily_challenge_date === getTodayKey();
  const hearts = progress?.hearts ?? 5;
  const allLessonsDone = (progress?.completed_lessons ?? []).length === LESSONS.length;
  const attemptsLeft = 3 - (progress?.exam_attempts ?? 0);
  const bestScore = progress?.exam_best_score;
  const dueReviews = getDueCount();
  const pendingChests = getPendingChests();

  function handleChestReward(reward) {
    updateProgress({
      xp: (progress?.xp ?? 0) + reward.xp,
      coins: (progress?.coins ?? 0) + reward.coins,
    });
    toast.success(`${reward.emoji} ${reward.label} chest: +${reward.xp} XP, +${reward.coins} coins!`);
  }

  const toolCards = [
    { to: '/glossary',     icon: '🔍', label: 'Glossary',     sub: 'Search all 131 financial terms' },
    { to: '/calculators',  icon: '🧮', label: 'Calculators',  sub: 'Compound interest, mortgage, savings' },
  ];

  const primaryModes = [
    {
      to: '/daily', icon: '📅', label: 'Daily Challenge',
      sub: dailyDone ? 'Completed today ✓' : '+50 XP · +$20 · 5 questions',
      badge: !dailyDone ? 'NEW' : null, done: dailyDone,
      color: dailyDone ? 'bg-card border-border' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700',
    },
    {
      to: '/scenarios', icon: '🧠', label: 'Scenarios',
      sub: 'Branching financial decisions · +60 XP each',
      badge: null, color: 'bg-card border-border',
    },
    {
      to: '/practice', icon: '⚔️', label: 'Practice Quiz',
      sub: hearts > 0 ? `${hearts}❤️ remaining · Combo XP bonus` : 'Out of hearts — refill in Shop',
      locked: hearts === 0, color: 'bg-card border-border',
    },
    {
      to: '/review', icon: '🔄', label: 'Spaced Review',
      sub: dueReviews > 0 ? `${dueReviews} term${dueReviews > 1 ? 's' : ''} due for review` : 'All caught up — come back tomorrow',
      badge: dueReviews > 0 ? String(dueReviews) : null,
      badgeColor: 'bg-rose-500',
      color: dueReviews > 0 ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800' : 'bg-card border-border',
    },
    {
      to: '/flashcards', icon: '📖', label: 'Flashcards',
      sub: `${progress?.mastered_terms?.length ?? 0} terms mastered`,
      color: 'bg-card border-border',
    },
    {
      to: '/exam', icon: '🎓', label: 'Final Exam',
      sub: allLessonsDone
        ? bestScore != null ? `Best: ${bestScore}% · ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} left` : `${attemptsLeft} attempts left`
        : 'Complete all lessons to unlock',
      done: bestScore >= 75, locked: !allLessonsDone,
      color: allLessonsDone ? 'bg-card border-border' : 'bg-muted/50 border-border',
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-28 max-w-lg mx-auto px-4 pt-6">

      {/* Pending chest banner */}
      {pendingChests > 0 && (
        <button onClick={() => setShowChest(true)}
          className="w-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 flex items-center gap-3 mb-4 text-left active:scale-[0.99] transition-all shadow-lg">
          <span className="text-3xl">📦</span>
          <div className="flex-1">
            <p className="font-extrabold text-white text-sm">
              {pendingChests} Reward Chest{pendingChests > 1 ? 's' : ''} ready!
            </p>
            <p className="text-white/80 text-xs">Tap to open and claim your prizes</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white shrink-0" />
        </button>
      )}

      {/* Streak reminder */}
      {(progress?.streak_days ?? 0) > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl px-4 py-3 mb-4">
          <Flame className="w-5 h-5 text-amber-500" />
          <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
            {progress.streak_days}-day streak! Keep it going.
          </p>
          <Link to="/shop" className="ml-auto text-xs font-extrabold text-amber-700 dark:text-amber-400">
            Shop →
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-extrabold text-foreground">Play</h1>
        <Link to="/shop" className="flex items-center gap-1.5 bg-amber-400 text-white px-3 py-1.5 rounded-xl text-xs font-extrabold active:scale-95">
          <ShoppingBag className="w-3.5 h-3.5" /> Shop
        </Link>
      </div>

      <div className="flex flex-col gap-2.5">
        {primaryModes.map((m) => (
          <Link key={m.to} to={m.locked ? '#' : m.to} className={m.locked ? 'pointer-events-none' : ''}>
            <div className={`rounded-2xl border p-4 flex items-center gap-4 transition-all ${m.color} ${!m.locked ? 'active:scale-[0.98]' : 'opacity-50'}`}>
              <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center text-2xl shrink-0">
                {m.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-extrabold text-foreground">{m.label}</p>
                  {m.badge && (
                    <span className={`text-[10px] font-extrabold text-white px-1.5 py-0.5 rounded-full ${m.badgeColor ?? 'bg-amber-400'}`}>{m.badge}</span>
                  )}
                  {m.done && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground">{m.sub}</p>
              </div>
              {m.locked ? <Lock className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
            </div>
          </Link>
        ))}
      </div>

      {/* Tools row */}
      <div className="flex gap-2.5 mt-1 mb-1">
        {toolCards.map(t => (
          <Link key={t.to} to={t.to} className="flex-1">
            <div className="bg-card border border-border rounded-2xl p-3.5 flex flex-col gap-1.5 active:scale-95 transition-all">
              <span className="text-2xl">{t.icon}</span>
              <p className="font-extrabold text-xs text-foreground">{t.label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{t.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats row */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <p className="text-lg font-extrabold text-foreground">{bestScore != null ? `${bestScore}%` : '—'}</p>
          <p className="text-[10px] text-muted-foreground uppercase font-bold">Best Exam</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <p className="text-lg font-extrabold text-foreground">{progress?.streak_days ?? 0}d</p>
          <p className="text-[10px] text-muted-foreground uppercase font-bold">Streak</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <p className="text-lg font-extrabold text-foreground">{progress?.practice_sessions ?? 0}</p>
          <p className="text-[10px] text-muted-foreground uppercase font-bold">Sessions</p>
        </div>
      </div>

      <AnimatePresence>
        {showChest && (
          <ChestModal onClose={() => setShowChest(false)} onReward={handleChestReward} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showIntro && <SectionIntro section="play" onDismiss={dismissIntro} />}
      </AnimatePresence>
    </div>
  );
}
