import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Star, Zap, Flame, Heart, ChevronRight, BookOpen, Swords, Eye, TrendingUp, TrendingDown } from 'lucide-react';
import { LESSON_COLORS, isLessonUnlocked, getLessonStars, TOTAL_LESSONS, UNITS, CHAPTER_EXAMS } from '@/lib/unitData';
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
import { getNetWorth } from '@/lib/tradeActions';
const fmtMoney = n => n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n/1e3).toFixed(1)}k` : `$${Math.round(n)}`;
import NewsFeed from '@/components/NewsFeed';
import TermOfTheDay from '@/components/TermOfTheDay';
import WeeklyRecap from '@/components/WeeklyRecap';
import DailyLoginModal from '@/components/DailyLoginModal';
import SectionIntro, { useSectionIntro } from '@/components/SectionIntro';
import { shouldShowLoginReward } from '@/lib/dailyLoginReward';
import { getPortfolioHistory } from '@/lib/portfolioHistory';
import { getCountryByCode, getMyCountry } from '@/lib/countryData';
import { LearnAdBanner } from '@/components/AdBanner';
import { fetchUnitLearnerCounts } from '@/lib/playerSync';

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
  const { progress, updateProgress, newAchievements, dismissAchievements } = useUserProgress();
  const [activeTip, setActiveTip] = useState(null);
  const [showLoginReward, setShowLoginReward] = useState(() => shouldShowLoginReward());
  const [learnerCounts, setLearnerCounts] = useState({});

  useEffect(() => {
    const firstLessonIds = UNITS.map(u => u.lessons[0].id);
    fetchUnitLearnerCounts(firstLessonIds).then(setLearnerCounts);
  }, []);
  const { show: showIntroRaw, dismiss: dismissIntro } = useSectionIntro('learn', (progress?.completed_lessons?.length ?? 0) > 0);
  // Show section intro only after login reward is dismissed
  const showIntro = showIntroRaw && !showLoginReward;

  const completedLessons = progress?.completed_lessons ?? [];
  const lessonStars = progress?.lesson_stars ?? {};
  const xp = progress?.xp ?? 0;
  const { current: level, pct } = getXpProgress(xp);
  const netWorth = getNetWorth();
  const streak = progress?.streak_days ?? 0;
  const hearts = progress?.hearts ?? 5;
  const dailyDone = progress?.daily_challenge_date === getTodayKey();

  const allDone = completedLessons.length >= TOTAL_LESSONS;
  const completedCount = completedLessons.length;
  const multiplierLabel = getMultiplierLabel(streak);
  const bossWins = getBossWins();

  // Chapter context for progress display
  const currentChapter = (() => {
    for (let ch = 1; ch <= 10; ch++) {
      const chUnits = UNITS.filter(u => u.chapter === ch);
      const chLessons = chUnits.flatMap(u => u.lessons);
      const chDone = chLessons.filter(l => completedLessons.includes(l.id)).length;
      if (chDone < chLessons.length) return { num: ch, done: chDone, total: chLessons.length };
    }
    return { num: 10, done: 40, total: 40 };
  })();
  const EXAM_UNLOCK_THRESHOLD = 40; // Chapter 1 complete

  return (
    <div className="min-h-screen bg-background pb-28" onClick={(e) => { if (!e.target.closest('button, a')) setActiveTip(null); }}>

      {/* Sticky header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border z-30 px-4 py-3 max-w-lg mx-auto">
        <div className="flex items-center justify-between">
          <Link to="/portfolio" className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-2.5 py-1 active:scale-95 transition-all">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-500/70">Net worth</span>
            <span className="text-sm font-black text-emerald-500">{fmtMoney(netWorth)}</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
              <Flame className="w-4 h-4" />{streak}
            </div>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`text-sm ${i < hearts ? 'text-rose-500' : 'text-muted-foreground/20'}`}>♥</span>
              ))}
            </div>
            <DailyGoalRing size={36} />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto">

        {/* Slim progress strip */}
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">
                Ch.{currentChapter.num} · {currentChapter.done}/{currentChapter.total} lessons
              </span>
              <span className="text-[10px] text-muted-foreground/50 font-bold">({completedCount} total)</span>
            </div>
            <div className="flex items-center gap-2">
              {multiplierLabel && <span className="text-[10px] font-extrabold text-amber-500">{multiplierLabel} 🔥</span>}
              <span className="text-xs font-bold text-primary">{Math.round(completedCount / TOTAL_LESSONS * 100)}%</span>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${Math.round(completedCount / TOTAL_LESSONS * 100)}%` }} />
          </div>
        </div>

        {/* Streak at risk — only if urgent */}
        {streak > 1 && !dailyDone && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 px-4 py-2.5 flex items-center gap-3">
            <span className="text-lg">🔥</span>
            <p className="text-sm font-extrabold text-amber-400 flex-1">{streak}-day streak at risk!</p>
            <Link to="/daily" className="bg-amber-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl active:scale-95 shrink-0">Go →</Link>
          </motion.div>
        )}

        {/* ── Units + Chapter Exam Gates ─────────────────────────── */}
        {UNITS.map((unit, unitIdx) => {
          const unitColors = LESSON_COLORS[unit.color];
          const unitCompleted = unit.lessons.filter(l => completedLessons.includes(l.id)).length;
          const unitTotal = unit.lessons.length;
          const unitDone = unitCompleted === unitTotal;
          const unitUnlocked = unitIdx === 0 || (() => {
            const prevUnit = UNITS[unitIdx - 1];
            return completedLessons.includes(prevUnit.lessons[prevUnit.lessons.length - 1].id);
          })();

          // ── LOCKED UNIT — mysterious teaser ──────────────────────
          if (!unitUnlocked) {
            const realCount = learnerCounts[unit.lessons[0].id] ?? 0;
            const teaserTerms = unit.lessons.flatMap(l => l.termIds ?? l.terms ?? []).slice(0, 4);
            return (
              <div key={unit.id} className="mx-4 mt-5 mb-2">
                <div className="relative rounded-2xl overflow-hidden border border-border bg-card">

                  {/* Coloured top strip — same style as unlocked banners but dimmed */}
                  <div className={`${unitColors.bg} opacity-30 px-4 py-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl grayscale opacity-60">{unit.icon ?? unit.emoji}</span>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-white/70">Section {unitIdx + 1}</p>
                        <h2 className="text-base font-extrabold text-white leading-tight">{unit.title}</h2>
                      </div>
                    </div>
                    <Lock className="w-5 h-5 text-white/50" />
                  </div>

                  {/* Ghost lesson nodes — blurred, using muted colours */}
                  <div className="flex items-center justify-around px-6 pt-5 pb-3 pointer-events-none select-none">
                    {unit.lessons.map((_, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 opacity-30 blur-[2px]">
                        <div className={`w-12 h-12 rounded-full ${unitColors.bg} opacity-40 flex items-center justify-center text-xl`}>
                          {unit.icon ?? unit.emoji}
                        </div>
                        <div className="w-8 h-1 rounded-full bg-muted-foreground/30" />
                      </div>
                    ))}
                  </div>

                  {/* Teaser pills */}
                  <div className="flex flex-wrap gap-1.5 justify-center px-4 mb-3">
                    {teaserTerms.map(t => (
                      <span key={t} className="bg-muted text-muted-foreground/50 text-[10px] font-bold px-2.5 py-1 rounded-full blur-[1.5px] select-none">
                        {t.replace(/-/g, ' ')}
                      </span>
                    ))}
                    <span className="bg-muted text-muted-foreground text-[10px] font-bold px-2.5 py-1 rounded-full">+more</span>
                  </div>

                  {/* Social proof + unlock hint */}
                  <div className="border-t border-border px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-bold">
                      <Eye className="w-3 h-3" />
                      <span>{realCount > 0 ? `${realCount.toLocaleString()} learner${realCount === 1 ? '' : 's'} unlocked this` : 'Be the first to unlock this'}</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-muted-foreground">
                      Finish Section {unitIdx} →
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          // ── UNLOCKED UNIT — normal render ─────────────────────────
          return (
            <div key={unit.id} className="mb-2">
              {/* Ad every 3 units (after unit 2, 5, 8 …) */}
              {unitIdx > 0 && unitIdx % 3 === 2 && <LearnAdBanner />}
              {/* Unit section banner */}
              <div className="mx-4 mt-5 rounded-2xl overflow-hidden">
                <div className={`${unitColors.bg} px-4 py-4 flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{unit.icon ?? unit.emoji}</span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-white/70">
                        Section {unitIdx + 1}
                      </p>
                      <h2 className="text-base font-extrabold text-white leading-tight">{unit.title}</h2>
                      <p className="text-xs text-white/80 mt-0.5">{unit.subtitle ?? unit.description}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <p className="text-xs font-bold text-white/70">{unitCompleted}/{unitTotal}</p>
                    {unitDone && (
                      <Link to={`/boss/${unit.id}`} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1 bg-white/20 hover:bg-white/30 rounded-xl px-2.5 py-1 transition-all active:scale-95">
                          <Swords className="w-3.5 h-3.5 text-white" />
                          <span className="text-white font-extrabold text-xs">
                            {(bossWins[unit.id] ?? 0) > 0 ? 'Boss ✓' : 'Boss!'}
                          </span>
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
                <div className={`h-1 ${unitColors.light}`}>
                  <div className={`h-full ${unitColors.bg} transition-all duration-500`}
                    style={{ width: `${(unitCompleted / unitTotal) * 100}%` }} />
                </div>
              </div>

              {/* Lesson nodes */}
              <div className="relative px-4 pt-6 pb-4">
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                  {unit.lessons.map((lesson, lessonIdx) => {
                    if (lessonIdx === 0) return null;
                    const nodeSize = 68;
                    const colWidth = Math.min(340, window.innerWidth - 32) / Math.max(unit.lessons.length, 3);
                    const prevX = (lessonIdx - 1) * colWidth + nodeSize / 2 + 16 + (OFFSETS[(lessonIdx - 1) % OFFSETS.length] ?? 0);
                    const currX = lessonIdx * colWidth + nodeSize / 2 + 16 + (OFFSETS[lessonIdx % OFFSETS.length] ?? 0);
                    return (
                      <line key={lesson.id}
                        x1={prevX} y1={50} x2={currX} y2={50}
                        strokeWidth="2" strokeDasharray="4 3"
                        className={completedLessons.includes(lesson.id) ? 'stroke-muted-foreground/40' : 'stroke-muted-foreground/20'}
                      />
                    );
                  })}
                </svg>
                <div className="flex items-start justify-around relative z-10">
                  {unit.lessons.map((lesson, lessonIdx) => {
                    const completed = completedLessons.includes(lesson.id);
                    const unlocked = isLessonUnlocked(lesson.id, completedLessons);
                    const isNext = !completed && unlocked;
                    const stars = getLessonStars(lesson.id, lessonStars);
                    const marginOffset = OFFSETS[lessonIdx % OFFSETS.length] ?? 0;
                    return (
                      <div key={lesson.id} className="relative flex flex-col items-center" style={{ marginTop: Math.abs(marginOffset) * 0.3 }}>
                        <LessonNode
                          lesson={lesson}
                          colors={unitColors}
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
        }).reduce((acc, node, idx) => {
          // Insert chapter header banner before the first unit of chapters 2–10
          if (idx > 0 && idx % 10 === 0) {
            const chapterNum = Math.ceil((idx + 1) / 10);
            const chExam = CHAPTER_EXAMS.find(e => e.chapter === chapterNum);
            const CHAPTER_NAMES = ['', 'Financial Foundations', 'Stock Market Mastery', 'Banking & Credit', 'Investing Essentials', 'Real Estate & Loans', 'Taxes & Government', 'Business Finance', 'Retirement & Wealth', 'Risk & Insurance', 'Advanced Markets'];
            acc.push(
              <div key={`ch-header-${chapterNum}`} className="mx-4 mt-6 mb-2">
                <div className={`rounded-2xl bg-gradient-to-r ${chExam?.color ?? 'from-gray-700 to-gray-900'} p-px`}>
                  <div className="rounded-2xl bg-black/60 px-4 py-3 flex items-center gap-3">
                    <span className="text-2xl">{chExam?.icon ?? '📚'}</span>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/50">Chapter {chapterNum}</p>
                      <p className="font-black text-white text-sm leading-tight">{CHAPTER_NAMES[chapterNum]}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          acc.push(node);
          // Insert chapter exam gate after units 10, 20, 30 … 100 (1-indexed)
          const unitId = idx + 1;
          if (unitId % 10 === 0) {
            const exam = CHAPTER_EXAMS.find(e => e.afterUnit === unitId);
            if (exam) {
              const chapterDone = UNITS.slice(0, unitId).every(u =>
                u.lessons.every(l => completedLessons.includes(l.id))
              );
              const bestKey = `chapter_exam_${exam.id}`;
              const bestScore = progress?.[bestKey] ?? 0;
              acc.push(
                <Link key={exam.id} to={`/chapter-exam/${exam.id}`}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`mx-4 mt-4 mb-2 rounded-3xl overflow-hidden bg-gradient-to-br ${exam.color} p-px shadow-2xl`}
                  >
                    <div className="rounded-3xl bg-black/30 backdrop-blur p-5 flex items-center gap-4">
                      <motion.div
                        animate={chapterDone ? { rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className="text-4xl shrink-0"
                      >
                        {bestScore >= 70 ? '✅' : chapterDone ? exam.icon : '🔒'}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/60 text-[10px] font-extrabold uppercase tracking-widest">⚡ Chapter {exam.chapter} Boss</p>
                        <p className="text-white font-black text-base leading-tight">{exam.title}</p>
                        <p className="text-white/60 text-xs mt-0.5">
                          {bestScore >= 70 ? `Best: ${bestScore}% · ` : ''}Win ${exam.coinsReward.toLocaleString()} cash
                        </p>
                      </div>
                      <div className="shrink-0">
                        {bestScore >= 70
                          ? <div className="bg-green-400/30 rounded-xl px-2.5 py-1 text-green-300 font-extrabold text-xs">✓ Passed</div>
                          : <div className={`rounded-xl px-2.5 py-1 font-extrabold text-xs ${chapterDone ? 'bg-white/20 text-white' : 'bg-white/10 text-white/40'}`}>
                              {chapterDone ? 'Fight →' : 'Locked'}
                            </div>
                        }
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            }
          }
          return acc;
        }, [])}

        {/* ── Bottom widgets (after lessons) ── */}
        <div className="px-4 mt-6 space-y-3">

          {/* Daily challenge */}
          {!dailyDone && (
            <Link to="/daily">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 flex items-center justify-between active:scale-[0.98] transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔥</span>
                  <div>
                    <p className="text-sm font-extrabold text-amber-400">Daily Challenge</p>
                    <p className="text-xs text-muted-foreground">5 questions · win $50 cash</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-500 shrink-0" />
              </div>
            </Link>
          )}

          {/* Portfolio snapshot */}
          {(() => {
            const port = (() => { try { return JSON.parse(localStorage.getItem('wealthquest_portfolio') ?? 'null'); } catch { return null; } })();
            if (!port) return null;
            const totalValue = (port.cash ?? 10000) + (port.holdings ?? []).reduce((s, h) => s + h.avgCost * h.shares, 0);
            const gain = totalValue - 10000;
            const pct = (gain / 10000) * 100;
            const myCountryCode = getMyCountry();
            const myCountry = myCountryCode ? getCountryByCode(myCountryCode) : null;
            return (
              <Link to="/portfolio">
                <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-3 active:scale-[0.98] transition-all">
                  <span className="text-xl">📈</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-muted-foreground">Portfolio</p>
                    <p className="text-sm font-extrabold text-foreground">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })} <span className={`text-xs font-bold ${pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{pct >= 0 ? '+' : ''}{pct.toFixed(2)}%</span></p>
                  </div>
                  {myCountry && <span className="text-2xl">{myCountry.flag}</span>}
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </Link>
            );
          })()}

          {/* Country / league */}
          {(() => {
            const myCountryCode = getMyCountry();
            const myCountry = myCountryCode ? getCountryByCode(myCountryCode) : null;
            return (
              <Link to="/league">
                <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-3 active:scale-[0.98] transition-all">
                  <span className="text-2xl">{myCountry ? myCountry.flag : '🌍'}</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-muted-foreground">League</p>
                    <p className="text-sm font-extrabold text-foreground">{myCountry ? `Representing ${myCountry.name}` : 'Set your country'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </Link>
            );
          })()}
        </div>

        {/* Weekly recap + term + missions */}
        <div className="mt-4">
          <WeeklyRecap progress={progress} />
        </div>
        <div className="mt-2">
          <TermOfTheDay />
        </div>
        <div className="px-4 mt-2">
          <DailyMissions />
        </div>

        {/* News Feed */}
        <div className="mx-4 mt-4 mb-2">
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
                  {allDone ? 'Prove your mastery — win a $500 cash bonus!' : `Complete all ${TOTAL_LESSONS} lessons to unlock`}
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

      <AnimatePresence>
        {showLoginReward && (
          <DailyLoginModal
            onClaim={(reward) => {
              updateProgress({
                xp: (progress?.xp ?? 0) + reward.xp,
                coins: (progress?.coins ?? 0) + reward.coins,
                hearts: reward.bonus === '❤️ Heart Refill' ? 5 : undefined,
              });
            }}
            onClose={() => setShowLoginReward(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showIntro && <SectionIntro section="learn" onDismiss={dismissIntro} />}
      </AnimatePresence>
    </div>
  );
}
