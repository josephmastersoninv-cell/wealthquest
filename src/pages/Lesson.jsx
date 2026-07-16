import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, XCircle, ChevronRight, Star, Zap, DollarSign, Heart, Crown } from 'lucide-react';
import { getLessonById, LESSON_COLORS, scoreToStars, LESSON_XP, LESSON_COINS, isLessonUnlocked } from '@/lib/lessonData';
import { getTermById, GLOSSARY_TERMS } from '@/lib/glossaryData';
import { useUserProgress } from '@/lib/useUserProgress';
import { useIsPro } from '@/lib/useIsPro';
import { computeStreak } from '@/lib/streakUtils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import AchievementToast from '@/components/AchievementToast';
import Confetti from '@/components/Confetti';
import { markWrong } from '@/lib/reviewData';
import { sounds } from '@/lib/sound';
import { haptics } from '@/lib/haptics';
import { syncChestsFromLessons, getPendingChests } from '@/lib/chestData';
import { adjustCash } from '@/lib/tradeActions';
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
// Progressive micro-cards: one small piece of info per card, three levels.
// Level 1 = plain definitions (easiest terms first), Level 2 = real examples,
// Level 3 = why it matters. Same content, smaller bites, rising difficulty.
const STUDY_TIERS = [
  { key: 'definition', label: 'Level 1 · The Basics',    hint: 'Tap to see what it means',   emoji: '📖' },
  { key: 'example',    label: 'Level 2 · Real World',    hint: 'Tap to see a real example',  emoji: '💼' },
  { key: 'context',    label: 'Level 3 · Why It Matters', hint: 'Tap to see why it matters', emoji: '🧠' },
];

function buildStudyCards(terms) {
  // Easiest (shortest definition) terms first — simple → harder
  const sorted = [...terms].sort((a, b) => a.definition.length - b.definition.length);
  const cards = [];
  STUDY_TIERS.forEach((tier, ti) => {
    sorted.forEach(term => {
      const text = term[tier.key];
      if (text) cards.push({ term, tier, ti, text });
    });
  });
  return cards;
}

function StudyPhase({ terms, colors, onDone }) {
  const cards = useMemo(() => buildStudyCards(terms), [terms]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[idx];

  const next = () => {
    sounds.cardNext();
    haptics.tap();
    if (idx < cards.length - 1) { setIdx(i => i + 1); setFlipped(false); }
    else onDone();
  };

  return (
    <div className="px-4 pb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-muted-foreground">Study · {idx + 1}/{cards.length}</span>
        <span className={`text-[11px] font-extrabold ${colors.text}`}>{card.tier.emoji} {card.tier.label}</span>
      </div>
      {/* three-segment level progress */}
      <div className="flex gap-1 mb-5">
        {STUDY_TIERS.map((t, ti) => {
          const tierCards = cards.filter(c => c.ti === ti);
          const done = cards.slice(0, idx + 1).filter(c => c.ti === ti).length;
          return (
            <div key={t.key} className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full ${colors.bg} transition-all`} style={{ width: tierCards.length ? `${(done / tierCards.length) * 100}%` : '0%' }} />
            </div>
          );
        })}
      </div>

      <div className="relative h-64 mb-5" style={{ perspective: 1200 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={card.term.id + card.tier.key + (flipped ? 'b' : 'f')}
            initial={{ opacity: 0, rotateY: flipped ? -90 : 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: flipped ? 90 : -90 }}
            transition={{ duration: 0.2 }}
            onClick={() => { setFlipped(f => !f); sounds.flip(); }}
            className={`absolute inset-0 rounded-3xl border-2 ${colors.border} bg-card flex flex-col cursor-pointer overflow-hidden`}
          >
            <div className={`${colors.bg} px-4 py-2 flex items-center justify-between shrink-0`}>
              <span className="text-xs font-extrabold uppercase tracking-widest text-white/90">{card.tier.emoji} {card.tier.label.split('· ')[1]}</span>
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-wide">{card.term.category}</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-4">
              {!flipped ? (
                <>
                  <p className="text-2xl font-extrabold text-foreground leading-snug">{card.term.term}</p>
                  <p className="text-xs text-muted-foreground mt-5">{card.tier.hint}</p>
                </>
              ) : (
                <p className={`font-semibold text-foreground leading-relaxed ${card.text.length > 180 ? 'text-sm' : 'text-base'}`}>
                  {card.ti === 1 && <span className="block text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">💼 Example</span>}
                  {card.ti === 2 && <span className="block text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">🧠 Why it matters</span>}
                  {card.text}
                </p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <Button onClick={next} className={`w-full h-14 font-extrabold rounded-2xl text-white border-0 ${colors.bg}`}>
        {idx < cards.length - 1 ? 'Next Card' : 'Start Quiz →'}
      </Button>
      <p className="text-xs text-center text-muted-foreground mt-3">Tap the card to flip it</p>
    </div>
  );
}

// ---------- Quiz phase ----------
function QuizPhase({ terms, allTerms, colors, onDone, onWrongAnswer, onStreakHeart, isPro }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  // XP bomb: one random question per session gets 2× XP
  const xpBombIdx = useMemo(() => Math.floor(Math.random() * terms.length), []);
  const [xpBombTriggered, setXpBombTriggered] = useState(false);

  const questions = useMemo(() => terms.map((term, i) => {
    // Distractors from the same category first — makes choices meaningful, not obvious
    const sameCat = allTerms.filter(t => t.id !== term.id && t.category === term.category);
    const others  = allTerms.filter(t => t.id !== term.id && t.category !== term.category);
    const pool    = [...shuffleArray(sameCat), ...shuffleArray(others)].slice(0, 3);

    // Cycle 3 question types so no two consecutive questions feel the same
    const type = i % 3 === 0 ? 'definition' : i % 3 === 1 ? 'reverse' : (term.example ? 'scenario' : 'reverse');

    if (type === 'definition') {
      const options = shuffleArray([term.definition, ...pool.map(t => t.definition)]);
      return { term, type, prompt: 'What is the definition of…', questionText: term.term, big: true,
        options, correct: options.indexOf(term.definition) };
    }
    if (type === 'reverse') {
      const options = shuffleArray([term.term, ...pool.map(t => t.term)]);
      return { term, type, prompt: 'Which term matches this definition?', questionText: term.definition, big: false,
        options, correct: options.indexOf(term.term) };
    }
    // scenario: real-world example → identify the concept
    const options = shuffleArray([term.term, ...pool.map(t => t.term)]);
    return { term, type, prompt: '💼 Real-world example — which concept is this?', questionText: term.example, big: false,
      options, correct: options.indexOf(term.term) };
  }), [terms]);

  const q = questions[idx];
  const isCorrect = answered && selected === q.correct;
  const isXpBomb = idx === xpBombIdx;

  const handleAnswer = (i) => {
    if (!answered) {
      setSelected(i);
      setAnswered(true);
      const correct = i === q.correct;
      if (correct) {
        if (isXpBomb) { sounds.xpBomb(); haptics.levelUp(); setXpBombTriggered(true); }
        else { sounds.correct(); haptics.correct(); }
        const newStreak = consecutiveCorrect + 1;
        setConsecutiveCorrect(newStreak);
        if (newStreak % 10 === 0) onStreakHeart?.();
      } else {
        sounds.wrong(); haptics.wrong();
        onWrongAnswer?.();
        setConsecutiveCorrect(0);
      }
    }
  };

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
        <div className="flex items-center justify-between mb-2">
          <p className={`text-xs font-bold uppercase tracking-wide ${colors.text}`}>{q.prompt}</p>
          {isXpBomb && !answered && (
            <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}
              className="text-[10px] font-extrabold bg-amber-400 text-white px-2 py-0.5 rounded-full">
              ⚡ XP BOMB
            </motion.span>
          )}
          {isXpBomb && answered && xpBombTriggered && (
            <span className="text-[10px] font-extrabold text-amber-500">⚡ 2× XP!</span>
          )}
        </div>
        <p className={`${q.big ? 'text-xl' : 'text-base leading-relaxed'} font-extrabold text-foreground mb-6`}>{q.questionText}</p>

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
            {isCorrect ? '✓ Correct! ' : '✗ Incorrect. '}<strong>{q.term.term}</strong> — {q.term.definition}
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
function ResultsPhase({ lesson, score, total, stars, earned, colors, isRetry, onRetry, onInvest }) {
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
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">You earned</p>
          <div className="bg-emerald-500/10 rounded-xl p-4 text-center mb-3">
            <DollarSign className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
            <p className="text-2xl font-black text-emerald-500">+${earned.coins}</p>
            <p className="text-xs text-muted-foreground">cash</p>
          </div>
          {onInvest && (
            <button onClick={onInvest}
              className="w-full h-12 rounded-xl bg-foreground text-background font-extrabold text-sm active:scale-95 transition-all">
              📈 Invest your ${earned.coins} — trade the news →
            </button>
          )}
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

// ---------- No Hearts Gate ----------
function NoHeartsScreen() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center gap-6">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
        <span className="text-7xl">💔</span>
      </motion.div>
      <div>
        <h2 className="text-2xl font-black text-foreground mb-2">Out of Hearts</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          You've used all your hearts. Hearts refill daily, or upgrade to Pro for unlimited hearts and no limits.
        </p>
      </div>
      <Link to="/pro">
        <motion.button
          whileTap={{ scale: 0.96 }}
          className="bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black px-8 py-4 rounded-2xl shadow-lg flex items-center gap-2 text-lg"
        >
          <Crown className="w-5 h-5" /> Get Unlimited Hearts
        </motion.button>
      </Link>
      <Link to="/" className="text-sm text-muted-foreground underline">Back to Learn</Link>
    </div>
  );
}

// ---------- Main Lesson page ----------
export default function Lesson() {
  const { id } = useParams();
  const navigate = useNavigate();
  const lesson = getLessonById(id);
  const { progress, updateProgress, newAchievements, dismissAchievements } = useUserProgress();
  const isPro = useIsPro();
  const [phase, setPhase] = useState('study'); // study | quiz | results
  const [score, setScore] = useState(0);
  const [confetti, setConfetti] = useState(false);
  const [earned, setEarned] = useState(null);
  const [showChest, setShowChest] = useState(false);
  const [finalStreak, setFinalStreak] = useState(null);

  if (!lesson) return <div className="p-8 text-center text-muted-foreground">Lesson not found.</div>;

  // Gate: deep links to locked lessons don't grant XP — back to the path
  if (!isLessonUnlocked(lesson.id, progress?.completed_lessons ?? [])) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center gap-4">
        <span className="text-5xl">🔒</span>
        <p className="font-extrabold text-foreground text-lg">Lesson locked</p>
        <p className="text-sm text-muted-foreground">Complete the previous lessons to unlock this one.</p>
        <Link to="/" className="bg-primary text-primary-foreground font-extrabold px-6 py-3 rounded-2xl active:scale-95">Back to Learn</Link>
      </div>
    );
  }

  const hearts = progress?.hearts ?? 5;
  if (!isPro && hearts === 0 && phase !== 'results') return <NoHeartsScreen />;

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
        toast.success(`+$${LESSON_COINS} earned!`);
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
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold opacity-80 hover:opacity-100">
            <ArrowLeft className="w-4 h-4" /> Path
          </Link>
          {/* Hearts display */}
          <div className="flex items-center gap-1">
            {isPro ? (
              <span className="flex items-center gap-1 text-xs font-extrabold text-amber-300 bg-white/20 px-2.5 py-1 rounded-full">
                <Crown className="w-3.5 h-3.5" /> Unlimited
              </span>
            ) : (
              Array.from({ length: 5 }).map((_, i) => (
                <motion.span
                  key={i}
                  initial={false}
                  animate={{ scale: i < hearts ? 1 : 0.7, opacity: i < hearts ? 1 : 0.3 }}
                  className="text-lg"
                >
                  ♥
                </motion.span>
              ))
            )}
          </div>
        </div>
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
                isPro={isPro}
                onWrongAnswer={async () => {
                  if (isPro) return;
                  const current = progress?.hearts ?? 5;
                  if (current > 0) await updateProgress({ hearts: current - 1 });
                }}
                onStreakHeart={async () => {
                  const current = progress?.hearts ?? 5;
                  if (current < 5) {
                    await updateProgress({ hearts: current + 1 });
                    toast.success('💖 10 in a row! +1 heart earned!');
                  } else {
                    toast.success('🔥 10 in a row! (hearts already full)');
                  }
                }}
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
                onInvest={earned ? () => {
                  // Move lesson earnings from wallet into portfolio cash, then trade the news
                  adjustCash(earned.coins);
                  updateProgress({ coins: Math.max(0, (progress?.coins ?? 0) - earned.coins) });
                  toast.success(`$${earned.coins} moved to your portfolio cash`);
                  navigate('/news?from=lesson');
                } : undefined}
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
