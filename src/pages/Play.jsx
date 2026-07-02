import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, CheckCircle2, Lock, Zap, Crown } from 'lucide-react';
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

  const dailyDone   = progress?.daily_challenge_date === getTodayKey();
  const hearts      = progress?.hearts ?? 5;
  const allDone     = (progress?.completed_lessons ?? []).length === LESSONS.length;
  const attemptsLeft = 3 - (progress?.exam_attempts ?? 0);
  const bestScore   = progress?.exam_best_score;
  const dueReviews  = getDueCount();
  const pendingChests = getPendingChests();
  const streak      = progress?.streak_days ?? 0;
  const xp          = progress?.xp ?? 0;
  const coins       = progress?.coins ?? 0;

  function handleChestReward(reward) {
    updateProgress({
      xp: (progress?.xp ?? 0) + reward.xp,
      coins: (progress?.coins ?? 0) + reward.coins,
    });
    toast.success(`${reward.emoji} ${reward.label} chest: +${reward.xp} XP, +${reward.coins} coins!`);
  }

  return (
    <div className="min-h-screen bg-background pb-28 max-w-lg mx-auto">

      {/* ─── Hero header ─── */}
      <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Game Hub</p>
            <p className="text-white text-2xl font-extrabold mt-0.5">Play</p>
          </div>
          <Link to="/shop">
            <div className="flex items-center gap-1.5 bg-white/15 rounded-2xl px-3.5 py-2 active:scale-95 transition-all">
              <span className="text-base">🛒</span>
              <span className="text-white font-extrabold text-sm">Shop</span>
            </div>
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { emoji: '🔥', val: `${streak}d`, label: 'Streak' },
            { emoji: '⚡', val: xp.toLocaleString(), label: 'XP' },
            { emoji: '💰', val: coins.toLocaleString(), label: 'Coins' },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-2xl p-3 text-center">
              <p className="text-xl mb-0.5">{s.emoji}</p>
              <p className="text-white font-extrabold text-sm">{s.val}</p>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5">

        {/* ─── Pending chest banner ─── */}
        {pendingChests > 0 && (
          <motion.button
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            onClick={() => setShowChest(true)}
            className="w-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-all shadow-lg">
            <span className="text-3xl">📦</span>
            <div className="flex-1 text-left">
              <p className="font-extrabold text-white text-sm">{pendingChests} Reward Chest{pendingChests > 1 ? 's' : ''} waiting!</p>
              <p className="text-white/80 text-xs">Tap to open and claim your prizes</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white shrink-0" />
          </motion.button>
        )}

        {/* ─── Daily Challenge (hero card) ─── */}
        <Link to="/daily">
          <div className={`rounded-3xl p-5 flex items-center gap-4 active:scale-[0.98] transition-all shadow-sm ${
            dailyDone
              ? 'bg-card border border-border'
              : 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg shadow-orange-500/20'
          }`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${
              dailyDone ? 'bg-muted' : 'bg-white/25'
            }`}>
              📅
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-extrabold text-base ${dailyDone ? 'text-foreground' : 'text-white'}`}>Daily Challenge</p>
              <p className={`text-xs mt-0.5 ${dailyDone ? 'text-muted-foreground' : 'text-white/80'}`}>
                {dailyDone ? 'Completed today ✓ — come back tomorrow' : '5 questions · +50 XP · +$20 coins'}
              </p>
            </div>
            {dailyDone
              ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              : <div className="bg-white/20 rounded-xl px-2.5 py-1 shrink-0">
                  <p className="text-white font-extrabold text-xs">NEW</p>
                </div>
            }
          </div>
        </Link>

        {/* ─── PLAY section ─── */}
        <div>
          <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-2 px-1">⚔️ Play Modes</p>
          <div className="space-y-2">
            {/* Scenarios */}
            <Link to="/scenarios">
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-all">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/15 flex items-center justify-center text-2xl shrink-0">🧠</div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-foreground text-sm">Scenarios</p>
                  <p className="text-xs text-muted-foreground">Branching decisions · +60 XP each</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </Link>

            {/* Practice Quiz */}
            {hearts === 0 ? (
              <Link to="/shop">
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center text-2xl shrink-0">💔</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-rose-400 text-sm">No hearts left!</p>
                    <p className="text-xs text-muted-foreground">Wrong answers cost hearts. Tap to refill in the Shop.</p>
                  </div>
                  <div className="bg-rose-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl shrink-0">Refill</div>
                </div>
              </Link>
            ) : (
              <Link to="/practice">
                <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/15 flex items-center justify-center text-2xl shrink-0">⚔️</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-foreground text-sm">Practice Quiz</p>
                    <p className="text-xs text-muted-foreground">{hearts}❤️ remaining · Wrong answers cost 1 heart · Combo XP bonus</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* ─── STUDY section ─── */}
        <div>
          <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-2 px-1">📚 Study</p>
          <div className="space-y-2">
            {/* Spaced Review */}
            <Link to="/review">
              <div className={`rounded-2xl p-4 flex items-center gap-4 border active:scale-[0.98] transition-all ${
                dueReviews > 0
                  ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
                  : 'bg-card border-border'
              }`}>
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 flex items-center justify-center text-2xl shrink-0">🔄</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold text-foreground text-sm">Spaced Review</p>
                    {dueReviews > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">{dueReviews}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dueReviews > 0 ? `${dueReviews} term${dueReviews > 1 ? 's' : ''} due for review` : 'All caught up — come back tomorrow'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </Link>

            {/* Flashcards */}
            <Link to="/flashcards">
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-all">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/15 flex items-center justify-center text-2xl shrink-0">📖</div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-foreground text-sm">Flashcards</p>
                  <p className="text-xs text-muted-foreground">{progress?.mastered_terms?.length ?? 0} terms mastered</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </Link>

            {/* Final Exam */}
            <Link to={allDone ? '/exam' : '#'} className={!allDone ? 'pointer-events-none' : ''}>
              <div className={`rounded-2xl p-4 flex items-center gap-4 border transition-all ${
                allDone ? 'bg-card border-border active:scale-[0.98]' : 'bg-muted/40 border-border opacity-60'
              }`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                  allDone ? 'bg-amber-500/15' : 'bg-muted'
                }`}>
                  {bestScore >= 75 ? '🎓' : '📝'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold text-foreground text-sm">Final Exam</p>
                    {bestScore >= 75 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {allDone
                      ? bestScore != null
                        ? `Best: ${bestScore}% · ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} left`
                        : `${attemptsLeft} attempts remaining`
                      : 'Complete all lessons to unlock'}
                  </p>
                </div>
                {!allDone
                  ? <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
              </div>
            </Link>
          </div>
        </div>

        {/* ─── TOOLS section ─── */}
        <div>
          <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-2 px-1">🛠️ Tools</p>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/glossary">
              <div className="bg-card border border-border rounded-2xl p-4 active:scale-95 transition-all">
                <span className="text-2xl">🔍</span>
                <p className="font-extrabold text-sm text-foreground mt-2">Glossary</p>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">Search 131 financial terms</p>
              </div>
            </Link>
            <Link to="/calculators">
              <div className="bg-card border border-border rounded-2xl p-4 active:scale-95 transition-all">
                <span className="text-2xl">🧮</span>
                <p className="font-extrabold text-sm text-foreground mt-2">Calculators</p>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">Compound interest, mortgage</p>
              </div>
            </Link>
          </div>
        </div>

        {/* ─── Pro upsell ─── */}
        <Link to="/pro">
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-all">
            <Crown className="w-6 h-6 text-white shrink-0" />
            <div className="flex-1">
              <p className="font-extrabold text-white text-sm">Upgrade to Pro</p>
              <p className="text-white/80 text-xs">Unlimited hearts, XP boosts & more</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white shrink-0" />
          </div>
        </Link>

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
