import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Star, Zap, Flame, Heart, ChevronRight, BookOpen, Swords } from 'lucide-react';
import { LESSON_COLORS, isLessonUnlocked, getLessonStars, TOTAL_LESSONS, UNITS } from '@/lib/unitData';
import { useUserProgress } from '@/lib/useUserProgress';
import { getXpProgress } from '@/lib/levelData';
import { getTodayKey } from '@/lib/dailyChallengeData';
import { getMultiplierLabel } from '@/lib/streakMultiplier';
import { getBossWins } from '@/pages/BossBattle';
import AchievementToast from '@/components/AchievementToast';
import LevelUpModal from '@/components/LevelUpModal';
import DailyGoalRing from '@/components/DailyGoalRing';
import DailyMissions from '@/components/DailyMissions';
import XpBar from '@/components/XpBar';
import NewsFeed from '@/components/NewsFeed';

function StarRow({ stars }) {
  return (
    <div className="flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <Star key={i} className={`w-3 h-3 ${i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/20'}`} />
      ))}
    </div>
  );
}

// Each unit's lessons are laid out in a gentle zig-zag within that unit section
const OFFSETS = [0, 60, 100, 60, 0, -60, -100, -60];

function LessonNode({ lesson, colors, completed, isNext, unlocked, stars, activeTip, setActiveTip, offset }) {
  const isActive = activeTip === lesson.id;
  return (
    <div className="flex flex-col items-center" style={{ marginLeft: offset }}>
      {/* Pulse ring on next lesson */}
      <div className="relative">
        {isNext && (
          <motion.div
            className={`absolute -inset-3 rounded-full ${colors.bg} opacity-20`}
            animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.05, 0.2] }}
            transition={{ repeat: Infinity, duration: 2.2 }}
          />
        )}
        <button
          onClick={() => setActiveTip(isActive ? null : lesson.id)}
          className={`relative w-[68px] h-[68px] rounded-full flex flex-col items-center justify-center text-2xl shadow-md transition-all active:scale-95 ${
            completed
              ? `${colors.bg} text-white ring-4 ring-offset-2 ${colors.ring}`
              : isNext
              ? `${colors.bg} text-white shadow-xl`
              : unlocked
              ? `${colors.bg} opacity-60 text-white`
              : 'bg-muted text-muted-foreground border-2 border-border'
          }`}
        >
          {unlocked ? lesson.emoji : <Lock className="w-5 h-5" />}
        </button>
        {completed && (
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2">
            <StarRow stars={stars} />
          </div>
        )}
      </div>

      {/* Label below node */}
      <p className={`text-[11px] font-bold text-center mt-7 leading-tight max-w-[80px] ${unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
        {lesson.title}
      </p>

      {/* Tooltip pop-up */}
      <AnimatePresence>
        {isActive && unlocked && (
          <motion.div
            key="tip"
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -4 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-20 w-64 rounded-2xl border-2 p-4 shadow-xl ${colors.light} ${colors.border}`}
            style={{ top: '100%', marginTop: 8 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{lesson.emoji}</span>
              <p className={`text-sm font-extrabold ${colors.text}`}>{lesson.title}</p>
            </div>
            <p className="text-xs text-foreground/80 mb-3 leading-relaxed">{lesson.description}</p>
            <div className="flex gap-2">
              <Link to={`/lesson/${lesson.id}`} className="flex-1" onClick={() => setActiveTip(null)}>
                <button className={`w-full py-2.5 rounded-xl font-extrabold text-sm text-white ${colors.bg}`}>
                  {completed ? '⭐ Practice' : 'Start →'}
                </button>
              </Link>
              <button
                onClick={() => setActiveTip(null)}
                className="px-3 py-2 rounded-xl text-sm font-bold bg-white/70 border border-border text-foreground"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Learn() {
  const { progress, newAchievements, dismissAchievements } = useUserProgress();
  const [activeTip, setActiveTip] = useState(null);

  const completedLessons = progress?.completed_lessons ?? [];
  const lessonStars = progress?.lesson_stars ?? {};
  const xp = progress?.xp ?? 0;
  const { current: level, pct } = getXpProgress(xp);
  const streak = progress?.streak_days ?? 0;
  const hearts = progress?.hearts ?? 5;
  const dailyDone = progress?.daily_challenge_date === getTodayKey();

  const allDone = completedLessons.length >= TOTAL_LESSONS;
  const completedCount = completedLessons.length;
  const multiplierLabel = getMultiplierLabel(streak);
  const bossWins = getBossWins();

  return (
    <div className="min-h-screen bg-background pb-28" onClick={(e) => { if (!e.target.closest('button, a')) setActiveTip(null); }}>

      {/* Sticky header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border z-30 px-4 py-3 max-w-lg mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${level.bg} text-white`}>
              Lv {level.level}
            </div>
            <div className="relative w-28 h-2.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
              <Flame className="w-4 h-4" />{streak}
            </div>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`text-sm ${i < hearts ? 'text-rose-500' : 'text-muted-foreground/20'}`}>♥</span>
              ))}
            </div>
            <div className="flex items-center gap-1 text-sm font-bold text-primary">
              <Zap className="w-3.5 h-3.5" />{xp}
            </div>
            <DailyGoalRing size={36} />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {/* Daily challenge nudge */}
        {!dailyDone && (
          <div className="px-4 pt-4">
            <Link to="/daily">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🔥</span>
                  <div>
                    <p className="text-sm font-extrabold text-amber-900">Daily Challenge!</p>
                    <p className="text-xs text-amber-700">5 questions · +50 XP · +$20</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-500 shrink-0" />
              </div>
            </Link>
          </div>
        )}

        {/* XP bar + streak multiplier */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground">{completedCount} / {TOTAL_LESSONS} lessons</span>
            <div className="flex items-center gap-2">
              {multiplierLabel && (
                <span className="text-[10px] font-extrabold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">{multiplierLabel} Streak Bonus</span>
              )}
              <span className="text-xs font-bold text-primary">{Math.round(completedCount / TOTAL_LESSONS * 100)}%</span>
            </div>
          </div>
          <XpBar xp={xp} showLabel={false} compact />
        </div>

        {/* Daily missions */}
        <div className="px-4 pt-3">
          <DailyMissions />
        </div>

        {/* ── Units ─────────────────────────────────────────────── */}
        {UNITS.map((unit, unitIdx) => {
          const unitColors = LESSON_COLORS[unit.color];
          const unitCompleted = unit.lessons.filter(l => completedLessons.includes(l.id)).length;
          const unitTotal = unit.lessons.length;
          const unitDone = unitCompleted === unitTotal;
          const unitUnlocked = unitIdx === 0 || (() => {
            const prevUnit = UNITS[unitIdx - 1];
            return completedLessons.includes(prevUnit.lessons[prevUnit.lessons.length - 1].id);
          })();

          return (
            <div key={unit.id} className="mb-2">
              {/* Unit section banner */}
              <div className={`mx-4 mt-5 rounded-2xl overflow-hidden`}>
                <div className={`${unitColors.bg} px-4 py-4 flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{unit.emoji}</span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-white/70">
                        Section {unitIdx + 1}
                      </p>
                      <h2 className="text-base font-extrabold text-white leading-tight">{unit.title}</h2>
                      <p className="text-xs text-white/80 mt-0.5">{unit.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <p className="text-xs font-bold text-white/70">{unitCompleted}/{unitTotal}</p>
                    {unitDone ? (
                      <Link to={`/boss/${unit.id}`} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1 bg-white/20 hover:bg-white/30 rounded-xl px-2.5 py-1 transition-all active:scale-95">
                          <Swords className="w-3.5 h-3.5 text-white" />
                          <span className="text-white font-extrabold text-xs">
                            {(bossWins[unit.id] ?? 0) > 0 ? `Boss ✓` : 'Boss!'}
                          </span>
                        </div>
                      </Link>
                    ) : null}
                  </div>
                </div>
                {/* Unit progress bar */}
                <div className={`h-1 ${unitColors.light}`}>
                  <div
                    className={`h-full ${unitColors.bg} transition-all duration-500`}
                    style={{ width: `${(unitCompleted / unitTotal) * 100}%` }}
                  />
                </div>
              </div>

              {/* Lesson nodes in zig-zag path inside this unit */}
              <div className="relative px-4 pt-6 pb-4">
                {/* Connector lines between nodes */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                  {unit.lessons.map((lesson, lessonIdx) => {
                    if (lessonIdx === 0) return null;
                    const nodeSize = 68;
                    const colWidth = Math.min(340, window.innerWidth - 32) / Math.max(unit.lessons.length, 3);
                    const prevX = (lessonIdx - 1) * colWidth + nodeSize / 2 + 16 + (OFFSETS[(lessonIdx - 1) % OFFSETS.length] ?? 0);
                    const currX = lessonIdx * colWidth + nodeSize / 2 + 16 + (OFFSETS[lessonIdx % OFFSETS.length] ?? 0);
                    return (
                      <line
                        key={lesson.id}
                        x1={prevX} y1={50}
                        x2={currX} y2={50}
                        strokeWidth="2"
                        strokeDasharray="4 3"
                        className={completedLessons.includes(lesson.id) ? 'stroke-muted-foreground/40' : 'stroke-muted-foreground/20'}
                      />
                    );
                  })}
                </svg>

                {/* Node row */}
                <div className="flex items-start justify-around relative z-10">
                  {unit.lessons.map((lesson, lessonIdx) => {
                    const completed = completedLessons.includes(lesson.id);
                    const unlocked = unitUnlocked && isLessonUnlocked(lesson.id, completedLessons);
                    const isNext = !completed && unlocked;
                    const stars = getLessonStars(lesson.id, lessonStars);
                    const colors = unitColors;
                    const marginOffset = OFFSETS[lessonIdx % OFFSETS.length] ?? 0;

                    return (
                      <div key={lesson.id} className="relative flex flex-col items-center" style={{ marginTop: Math.abs(marginOffset) * 0.3 }}>
                        <LessonNode
                          lesson={lesson}
                          colors={colors}
                          completed={completed}
                          isNext={isNext}
                          unlocked={unlocked}
                          stars={stars}
                          activeTip={activeTip}
                          setActiveTip={setActiveTip}
                          offset={0}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* News Feed */}
        <div className="mx-4 mt-6 mb-2">
          <NewsFeed />
        </div>

        {/* Final Exam node */}
        <div className="mx-4 mt-4 mb-8">
          <div className={`rounded-2xl overflow-hidden border-2 ${allDone ? 'border-yellow-400' : 'border-border'}`}>
            <div className={`px-4 py-4 flex items-center gap-4 ${allDone ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-muted'}`}>
              <span className="text-3xl">{allDone ? '🎓' : '🔒'}</span>
              <div className="flex-1">
                <p className={`font-extrabold ${allDone ? 'text-white' : 'text-muted-foreground'}`}>Final Exam</p>
                <p className={`text-xs ${allDone ? 'text-white/80' : 'text-muted-foreground'}`}>
                  {allDone ? 'Prove your mastery — earn 500 XP!' : `Complete all ${TOTAL_LESSONS} lessons to unlock`}
                </p>
              </div>
              {allDone && (
                <Link to="/exam">
                  <button className="bg-white text-amber-600 font-extrabold text-sm px-4 py-2 rounded-xl shadow active:scale-95">
                    Take Exam
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <AchievementToast achievements={newAchievements} onDismiss={dismissAchievements} />
      <LevelUpModal progress={progress} />
    </div>
  );
}
