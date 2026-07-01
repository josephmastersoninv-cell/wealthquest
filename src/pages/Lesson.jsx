import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, XCircle, ChevronRight, Star, Zap, DollarSign } from 'lucide-react';
import { getLessonById, LESSON_COLORS, scoreToStars, LESSON_XP, LESSON_COINS } from '@/lib/lessonData';
import { getTermById, GLOSSARY_TERMS } from '@/lib/glossaryData';
import { useUserProgress } from '@/lib/useUserProgress';
import { computeStreak } from '@/lib/streakUtils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import AchievementToast from '@/components/AchievementToast';
import Confetti from '@/components/Confetti';
import { markWrong } from '@/lib/reviewData';
import { syncChestsFromLessons, getPendingChests } from '@/lib/chestData';
import ChestModal from '@/components/ChestModal';
import StreakMilestone from '@/components/StreakMilestone';

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Study phase ----------
function StudyPhase({ terms, colors, onDone }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const term = terms[idx];

  const next = () => {
    if (idx < terms.length - 1) { setIdx(i => i + 1); setFlipped(false); }
    else onDone();
  };

  return (
    <div className="px-4 pb-8">
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs font-bold text-muted-foreground">Study · {idx + 1}/{terms.length}</span>
        <div className="flex gap-1">
          {terms.map((_, i) => (
            <div key={i} className={`w-6 h-1.5 rounded-full ${i <= idx ? colors.bg : 'bg-muted'}`} />
          ))}
        </div>
      </div>

      <div className="relative h-64 mb-5" style={{ perspective: 1200 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={term.id + (flipped ? 'b' : 'f')}
            initial={{ opacity: 0, rotateY: flipped ? -90 : 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: flipped ? 90 : -90 }}
            transition={{ duration: 0.2 }}
            onClick={() => setFlipped(f => !f)}
            className={`absolute inset-0 rounded-3xl border-2 ${colors.border} ${colors.light} p-6 flex flex-col items-center justify-center text-center cursor-pointer`}
          >
            {!flipped ? (
              <>
                <span className={`text-xs font-bold uppercase tracking-wide mb-3 ${colors.text}`}>{term.category}</span>
                <p className="text-2xl font-extrabold text-foreground">{term.term}</p>
                <p className="text-xs text-muted-foreground mt-4">Tap to see definition</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-foreground leading-relaxed mb-3">{term.definition}</p>
                {term.example && <p className="text-xs text-muted-foreground italic">e.g. {term.example}</p>}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <Button onClick={next} className={`w-full h-14 font-extrabold rounded-2xl text-white border-0 ${colors.bg}`}>
        {idx < terms.length - 1 ? 'Next Card' : 'Start Quiz →'}
      </Button>
      <p className="text-xs text-center text-muted-foreground mt-3">Tap the card to flip it</p>
    </div>
  );
}

// ---------- Quiz phase ----------
function QuizPhase({ terms, allTerms, colors, onDone }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState([]);

  const questions = useMemo(() => terms.map(term => {
    const wrong = allTerms.filter(t => t.id !== term.id);
    const distractors = shuffleArray(wrong).slice(0, 3).map(t => t.definition);
    const options = shuffleArray([term.definition, ...distractors]);
    return { term, options, correct: options.indexOf(term.definition) };
  }), [terms]);

  const q = questions[idx];
  const isCorrect = answered && selected === q.correct;

  const handleAnswer = (i) => { if (!answered) { setSelected(i); setAnswered(true); } };

  const handleNext = () => {
    const newAnswers = [...answers, selected === q.correct];
    if (idx < questions.length - 1) {
      setAnswers(newAnswers);
      setIdx(i => i + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      const wrongIds = questions
        .filter((_, i) => !newAnswers[i])
        .map(q => q.term.id);
      onDone(newAnswers.filter(Boolean).length, wrongIds);
    }
  };

  return (
    <div className="px-4 pb-8">
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs font-bold text-muted-foreground">Quiz · {idx + 1}/{questions.length}</span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className={`w-6 h-1.5 rounded-full transition-colors ${
              i < idx ? (answers[i] ? 'bg-emerald-400' : 'bg-rose-400') : i === idx ? colors.bg : 'bg-muted'
            }`} />
          ))}
        </div>
      </div>

      <motion.div key={idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
        <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${colors.text}`}>What is the definition of…</p>
        <p className="text-xl font-extrabold text-foreground mb-6">{q.term.term}</p>

        <div className="flex flex-col gap-2.5">
          {q.options.map((opt, i) => {
            const correct = i === q.correct;
            const sel = i === selected;
            let cls = 'bg-card border-border text-foreground';
            if (answered) {
              if (correct) cls = 'bg-emerald-50 border-emerald-400 text-emerald-800';
              else if (sel) cls = 'bg-rose-50 border-rose-300 text-rose-700';
              else cls = 'bg-muted border-border text-muted-foreground';
            }
            return (
              <button key={i} onClick={() => handleAnswer(i)}
                className={`w-full text-left p-4 rounded-2xl border-2 font-semibold text-sm transition-all ${cls} ${!answered ? 'hover:border-primary/40 active:scale-[0.98]' : ''}`}>
                <span className="flex items-start gap-3">
                  <span className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center text-xs font-extrabold mt-0.5 ${
                    answered && correct ? 'border-emerald-500 bg-emerald-500 text-white' :
                    answered && sel ? 'border-rose-400 bg-rose-400 text-white' : 'border-current'
                  }`}>
                    {answered && correct ? '✓' : answered && sel ? '✗' : String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </span>
              </button>
            );
          })}
        </div>

        {answered && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-3 rounded-2xl border text-xs font-semibold leading-relaxed ${
              isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
            {isCorrect ? '✓ Correct! ' : '✗ Incorrect. '}{q.term.definition}
          </motion.div>
        )}
      </motion.div>

      {answered && (
        <div className="mt-5">
          <Button onClick={handleNext} className={`w-full h-14 font-extrabold rounded-2xl text-white border-0 ${colors.bg}`}>
            {idx < questions.length - 1 ? <><ChevronRight className="w-5 h-5 mr-1" /> Next</> : 'See Results'}
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------- Results phase ----------
function ResultsPhase({ lesson, score, total, stars, earned, colors, isRetry, onRetry }) {
  return (
    <div className="px-4 pb-8 flex flex-col items-center text-center">
      <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className={`w-full rounded-3xl p-8 mb-6 ${colors.bg} text-white shadow-xl`}>
        <div className="text-6xl font-black mb-2">{score}/{total}</div>
        <div className="flex justify-center gap-2 mb-2">
          {[0, 1, 2].map(i => (
            <Star key={i} className={`w-8 h-8 transition-all ${i < stars ? 'text-yellow-300 fill-yellow-300' : 'text-white/30'}`} />
          ))}
        </div>
        <p className="text-lg font-bold opacity-90">
          {stars === 3 ? 'Perfect! 🎉' : stars === 2 ? 'Great work!' : stars === 1 ? 'Passed!' : 'Keep practising'}
        </p>
      </motion.div>

      {stars >= 1 && earned && (
        <div className="bg-card border border-border rounded-2xl p-4 w-full mb-5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Rewards</p>
          <div className="flex gap-3">
            <div className="flex-1 bg-primary/10 rounded-xl p-3 text-center">
              <Zap className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-extrabold text-primary">+{earned.xp}</p>
              <p className="text-xs text-muted-foreground">XP</p>
            </div>
            <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center">
              <DollarSign className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-lg font-extrabold text-emerald-600">+${earned.coins}</p>
              <p className="text-xs text-muted-foreground">Cash</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 w-full">
        {stars < 3 && (
          <Button onClick={onRetry} className={`w-full h-14 font-extrabold rounded-2xl text-white border-0 ${colors.bg}`}>
            Try Again
          </Button>
        )}
        <Link to="/" className="w-full">
          <Button variant={stars >= 3 ? 'default' : 'outline'} className="w-full h-14 font-extrabold rounded-2xl">
            {stars >= 1 ? 'Continue Learning →' : 'Back to Path'}
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ---------- Main Lesson page ----------
export default function Lesson() {
  const { id } = useParams();
  const navigate = useNavigate();
  const lesson = getLessonById(id);
  const { progress, updateProgress, newAchievements, dismissAchievements } = useUserProgress();
  const [phase, setPhase] = useState('study'); // study | quiz | results
  const [score, setScore] = useState(0);
  const [confetti, setConfetti] = useState(false);
  const [earned, setEarned] = useState(null);
  const [showChest, setShowChest] = useState(false);
  const [finalStreak, setFinalStreak] = useState(null);

  if (!lesson) return <div className="p-8 text-center text-muted-foreground">Lesson not found.</div>;

  const colors = LESSON_COLORS[lesson.color];
  const terms = lesson.terms.map(id => getTermById(id)).filter(Boolean);

  const handleQuizDone = async (correctCount, wrongTermIds = []) => {
    const stars = scoreToStars(correctCount, terms.length);
    setScore(correctCount);

    // Queue wrong answers for spaced repetition review
    wrongTermIds.forEach(tid => markWrong(tid));

    const prevStars = progress?.lesson_stars?.[lesson.id] ?? 0;
    const isNew = !(progress?.completed_lessons ?? []).includes(lesson.id);
    const shouldReward = stars >= 1 && isNew;

    const earnedRewards = shouldReward ? { xp: LESSON_XP, coins: LESSON_COINS } : null;
    setEarned(earnedRewards);

    if (stars >= 1 && progress) {
      const today = new Date().toISOString().split('T')[0];
      const { streak } = computeStreak(progress.last_active_date, progress.streak_days);
      setFinalStreak(streak);

      const newCompleted = isNew
        ? [...(progress.completed_lessons ?? []), lesson.id]
        : progress.completed_lessons ?? [];

      const newLessonStars = {
        ...(progress.lesson_stars ?? {}),
        [lesson.id]: Math.max(prevStars, stars),
      };

      const masteredSet = new Set(progress.mastered_terms ?? []);
      lesson.terms.forEach(t => masteredSet.add(t));

      const updates = {
        completed_lessons: newCompleted,
        lesson_stars: newLessonStars,
        mastered_terms: [...masteredSet],
        streak_days: streak,
        last_active_date: today,
      };
      if (shouldReward) {
        updates.xp = (progress.xp ?? 0) + LESSON_XP;
        updates.coins = (progress.coins ?? 0) + LESSON_COINS;
        toast.success(`+${LESSON_XP} XP · +$${LESSON_COINS} earned!`);
      }
      await updateProgress(updates);

      // Check if a new chest was earned
      if (isNew) {
        const gotNew = syncChestsFromLessons(newCompleted.length);
        if (gotNew) setTimeout(() => setShowChest(true), 1200);
      }
    }

    if (stars === 3) setConfetti(true);
    setPhase('results');
  };

  return (
    <div className="min-h-screen bg-background pb-24 max-w-lg mx-auto">
      <Confetti active={confetti} onDone={() => setConfetti(false)} />

      {/* Header */}
      <div className={`${colors.bg} px-4 pt-12 pb-6 text-white`}>
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold opacity-80 mb-4 hover:opacity-100">
          <ArrowLeft className="w-4 h-4" /> Path
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{lesson.emoji}</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide opacity-70">Lesson {lesson.id.split('-')[1]}</p>
            <h1 className="text-2xl font-extrabold">{lesson.title}</h1>
            <p className="text-sm opacity-80">{lesson.description}</p>
          </div>
        </div>

        {/* Phase tabs */}
        <div className="flex gap-2 mt-5">
          {['study', 'quiz'].map((p, i) => (
            <div key={p} className={`flex-1 py-1.5 rounded-xl text-center text-xs font-extrabold transition-all ${
              phase === p || (phase === 'results' && p === 'quiz')
                ? 'bg-white text-foreground'
                : 'bg-white/20 text-white'
            }`}>
              {i + 1}. {p.charAt(0).toUpperCase() + p.slice(1)}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-6">
        <AnimatePresence mode="wait">
          {phase === 'study' && (
            <motion.div key="study" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <StudyPhase terms={terms} colors={colors} onDone={() => setPhase('quiz')} />
            </motion.div>
          )}
          {phase === 'quiz' && (
            <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <QuizPhase
                terms={terms}
                allTerms={GLOSSARY_TERMS}
                colors={colors}
                onDone={handleQuizDone}
              />
            </motion.div>
          )}
          {phase === 'results' && (
            <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <ResultsPhase
                lesson={lesson}
                score={score}
                total={terms.length}
                stars={scoreToStars(score, terms.length)}
                earned={earned}
                colors={colors}
                onRetry={() => { setPhase('study'); setScore(0); setConfetti(false); }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AchievementToast achievements={newAchievements} onDismiss={dismissAchievements} />

      <AnimatePresence>
        {showChest && (
          <ChestModal
            onClose={() => setShowChest(false)}
            onReward={(reward) => {
              updateProgress({
                xp: (progress?.xp ?? 0) + reward.xp,
                coins: (progress?.coins ?? 0) + reward.coins,
              });
            }}
          />
        )}
      </AnimatePresence>

      <StreakMilestone streak={finalStreak} />
    </div>
  );
}
