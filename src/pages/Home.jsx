import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, BookOpen, Zap, DollarSign, Flame, Heart, Swords, Trophy, RotateCcw, Calendar, Star, Target } from 'lucide-react';
import { useUserProgress } from '@/lib/useUserProgress';
import { Button } from '@/components/ui/button';
import { GLOSSARY_TERMS } from '@/lib/glossaryData';
import { getXpProgress } from '@/lib/levelData';
import { ACHIEVEMENTS } from '@/lib/achievementData';
import { getTodayKey } from '@/lib/dailyChallengeData';
import { computeStreak } from '@/lib/streakUtils';
import AchievementToast from '@/components/AchievementToast';
import LevelUpModal from '@/components/LevelUpModal';
import OnboardingModal from '@/components/OnboardingModal';
import WordOfTheDay from '@/components/WordOfTheDay';
import { base44 } from '@/lib/localClient';
import { useAnimatedNumber } from '@/components/AnimatedNumber';

export default function Home() {
  const { progress, loading, updateProgress, newAchievements, dismissAchievements } = useUserProgress();
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const totalTerms = GLOSSARY_TERMS.length;
  const masteredCount = progress?.mastered_terms?.length ?? 0;
  const xp = progress?.xp ?? 0;
  const { current: level, pct, xpInLevel, xpNeeded } = getXpProgress(xp);
  const hearts = progress?.hearts ?? 5;
  const streak = progress?.streak_days ?? 0;
  const coins = progress?.coins ?? 0;
  const bestScore = progress?.exam_best_score;
  const examPassed = bestScore != null && bestScore >= 75;
  const dailyDone = progress?.daily_challenge_date === getTodayKey();
  const unlockedAchievements = progress?.achievements ?? [];
  const achievementCount = unlockedAchievements.length;
  const weakSpots = totalTerms - masteredCount;

  const animXp = useAnimatedNumber(xp);
  const animCoins = useAnimatedNumber(coins);

  const handleMarkWordOfDay = async (term) => {
    if (!progress) return;
    const already = progress.mastered_terms ?? [];
    if (already.includes(term.id)) return;
    const newMastered = [...already, term.id];
    await updateProgress({
      mastered_terms: newMastered,
      xp: (progress.xp ?? 0) + 10,
      coins: (progress.coins ?? 0) + 2,
    });
  };

  const handleReset = async () => {
    setResetting(true);
    await base44.entities.UserProgress._resetAll();
    localStorage.removeItem('wealthquest_onboarded');
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Monelingo</h1>
          <p className="text-sm text-muted-foreground">Financial literacy, gamified.</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-extrabold ${level.bg} ${level.color}`}>
          <Star className="w-4 h-4" />
          Lv {level.level} · {level.title}
        </div>
      </div>

      {/* XP Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-extrabold text-foreground">{animXp} XP</span>
          </div>
          {level.maxXp !== Infinity ? (
            <span className="text-xs text-muted-foreground">{xpInLevel}/{xpNeeded} to Lv {level.level + 1}</span>
          ) : (
            <span className="text-xs text-amber-600 font-bold">Max Level!</span>
          )}
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <StatCard
          icon={<Heart className="w-4 h-4 text-rose-500" />}
          label="Hearts"
          value={
            <span className="flex gap-0.5 justify-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`text-xs ${i < hearts ? 'text-rose-500' : 'text-muted-foreground/30'}`}>♥</span>
              ))}
            </span>
          }
        />
        <StatCard icon={<Flame className="w-4 h-4 text-amber-500" />} label="Streak" value={`${streak}d`} />
        <StatCard icon={<DollarSign className="w-4 h-4 text-emerald-600" />} label="Cash" value={`$${animCoins}`} />
        <StatCard icon={<Trophy className="w-4 h-4 text-violet-500" />} label="Badges" value={`${achievementCount}/${ACHIEVEMENTS.length}`} />
      </div>

      {/* Daily Challenge CTA */}
      <Link to="/daily">
        <div className={`rounded-2xl border p-4 mb-4 flex items-center justify-between transition-colors ${
          dailyDone
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-amber-50 border-amber-300 hover:bg-amber-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dailyDone ? 'bg-emerald-100' : 'bg-amber-100'}`}>
              <Calendar className={`w-5 h-5 ${dailyDone ? 'text-emerald-600' : 'text-amber-600'}`} />
            </div>
            <div>
              <p className={`text-sm font-extrabold ${dailyDone ? 'text-emerald-800' : 'text-amber-900'}`}>
                {dailyDone ? 'Daily Challenge Complete ✓' : "Today's Daily Challenge"}
              </p>
              <p className={`text-xs ${dailyDone ? 'text-emerald-600' : 'text-amber-700'}`}>
                {dailyDone ? 'Come back tomorrow for more' : `+50 XP · +$20 bonus · 5 questions`}
              </p>
            </div>
          </div>
          {!dailyDone && (
            <span className="text-xs font-extrabold text-amber-700 bg-amber-200 px-2.5 py-1 rounded-full">Start</span>
          )}
        </div>
      </Link>

      {/* Word of the Day */}
      <WordOfTheDay progress={progress} onMark={handleMarkWordOfDay} />

      {/* Term mastery */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-extrabold text-foreground">Term Mastery</span>
          </div>
          <span className="text-sm font-extrabold text-primary">{masteredCount}/{totalTerms}</span>
        </div>
        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.round((masteredCount / totalTerms) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {masteredCount === 0 ? 'Start studying to track your mastery' :
           masteredCount < totalTerms ? `${weakSpots} terms left — use Weak Spots mode` :
           '🎉 All terms mastered!'}
        </p>
      </div>

      {/* Exam status */}
      {bestScore != null && (
        <div className={`rounded-2xl border p-3 mb-4 flex items-center gap-3 ${
          examPassed ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
        }`}>
          <Award className={`w-5 h-5 shrink-0 ${examPassed ? 'text-emerald-600' : 'text-amber-500'}`} />
          <div>
            <p className={`text-sm font-extrabold ${examPassed ? 'text-emerald-800' : 'text-amber-800'}`}>
              {examPassed ? `Exam Passed — ${bestScore}%` : `Best Score: ${bestScore}% — Need 75% to pass`}
            </p>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <Link to="/flashcards">
            <Button variant="outline" className="w-full h-14 text-sm font-extrabold rounded-2xl flex-col gap-0.5 h-16">
              <BookOpen className="w-5 h-5" />
              <span>Flashcards</span>
            </Button>
          </Link>
          {weakSpots > 0 ? (
            <Link to="/flashcards?mode=weak">
              <Button variant="outline" className="w-full h-16 text-sm font-extrabold rounded-2xl flex-col gap-0.5 border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100">
                <Target className="w-5 h-5" />
                <span>Weak Spots ({weakSpots})</span>
              </Button>
            </Link>
          ) : (
            <Link to="/practice">
              <Button variant="outline" className="w-full h-16 text-sm font-extrabold rounded-2xl flex-col gap-0.5">
                <Swords className="w-5 h-5" />
                <span>Practice</span>
              </Button>
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/practice">
            <Button variant="outline" className="w-full h-16 text-sm font-extrabold rounded-2xl flex-col gap-0.5">
              <Swords className="w-5 h-5" />
              <span>Practice Quiz</span>
            </Button>
          </Link>
          <Link to="/exam">
            <Button className="w-full h-16 text-sm font-extrabold rounded-2xl flex-col gap-0.5">
              <Award className="w-5 h-5" />
              <span>Final Exam</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Achievements strip */}
      {achievementCount > 0 && (
        <div className="mb-6">
          <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide mb-2">Your Badges</p>
          <div className="flex flex-wrap gap-2">
            {ACHIEVEMENTS.filter((a) => unlockedAchievements.includes(a.id)).map((a) => (
              <div key={a.id} className="flex items-center gap-1.5 bg-card border border-border rounded-xl px-2.5 py-1.5">
                <span className="text-base">{a.icon}</span>
                <span className="text-xs font-bold text-foreground">{a.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset */}
      <div className="border-t border-border pt-4">
        {!showReset ? (
          <button onClick={() => setShowReset(true)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            <RotateCcw className="w-3 h-3" /> Reset all progress
          </button>
        ) : (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
            <p className="text-sm font-bold text-rose-800 mb-2">Reset all progress? This cannot be undone.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowReset(false)} className="flex-1">Cancel</Button>
              <Button size="sm" onClick={handleReset} disabled={resetting}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white border-0">
                {resetting ? 'Resetting…' : 'Yes, reset'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <AchievementToast achievements={newAchievements} onDismiss={dismissAchievements} />
      <LevelUpModal progress={progress} />
      <OnboardingModal />
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-2.5 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-sm font-extrabold text-foreground leading-tight">{value}</div>
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </div>
  );
}
