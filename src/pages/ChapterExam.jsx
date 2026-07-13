import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Star, Trophy, Flame, ArrowRight, XCircle, CheckCircle, ChevronRight } from 'lucide-react';
import { CHAPTER_EXAMS, UNITS } from '@/lib/unitData';
import { getTermById } from '@/lib/glossaryData';
import { useUserProgress } from '@/lib/useUserProgress';
import { sounds } from '@/lib/sound';
import { haptics } from '@/lib/haptics';

// ─── Question generator ────────────────────────────────────────────────────
function buildQuestions(termIds) {
  const terms = termIds.map(id => getTermById(id)).filter(Boolean);
  const shuffled = [...terms].sort(() => Math.random() - 0.5);
  const pool = shuffled.slice(0, 25);

  return pool.map((term, i) => {
    const type = i % 3;
    // Pick 3 wrong answers from remaining terms
    const others = terms.filter(t => t.id !== term.id).sort(() => Math.random() - 0.5).slice(0, 3);

    if (type === 0) {
      // Definition: "What is [term]?"
      const opts = [...others.map(t => t.definition), term.definition].sort(() => Math.random() - 0.5);
      return { id: i, question: `What is ${term.term}?`, options: opts, correct: term.definition, term };
    } else if (type === 1) {
      // Recognition: "Which term matches this definition?"
      const opts = [...others.map(t => t.term), term.term].sort(() => Math.random() - 0.5);
      return { id: i, question: term.definition, options: opts, correct: term.term, term };
    } else {
      // Scenario: use the example field if available
      const question = term.example
        ? `${term.example}\n\nThis scenario demonstrates which concept?`
        : `Which concept best describes: "${term.definition.slice(0, 80)}…"`;
      const opts = [...others.map(t => t.term), term.term].sort(() => Math.random() - 0.5);
      return { id: i, question, options: opts, correct: term.term, term };
    }
  });
}

// ─── Particle burst ───────────────────────────────────────────────────────
function Particles({ count = 20, color = '#facc15' }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * 360;
        const distance = 120 + Math.random() * 180;
        const x = Math.cos((angle * Math.PI) / 180) * distance;
        const y = Math.sin((angle * Math.PI) / 180) * distance;
        return (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
            style={{ background: color }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x, y, opacity: 0, scale: 0.2 }}
            transition={{ duration: 1.2 + Math.random() * 0.6, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
}

// ─── Intro screen ─────────────────────────────────────────────────────────
function IntroScreen({ exam, onStart }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-br ${exam.color} px-6 text-center`}
    >
      {/* Lightning bolts */}
      <motion.div
        animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="text-8xl mb-6 drop-shadow-lg"
      >
        {exam.icon}
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="inline-block bg-white/20 backdrop-blur rounded-full px-4 py-1 text-white/80 text-xs font-extrabold uppercase tracking-widest mb-3">
          ⚡ Chapter {exam.chapter} Final Boss
        </div>
        <h1 className="text-4xl font-black text-white leading-tight mb-2">{exam.title}</h1>
        <p className="text-white/70 text-lg font-bold mb-1">{exam.subtitle}</p>
        <p className="text-white/60 text-sm max-w-xs mx-auto mb-8">{exam.description}</p>
      </motion.div>

      {/* Stakes */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex gap-4 mb-10"
      >
        <div className="flex flex-col items-center bg-white/15 backdrop-blur rounded-2xl px-5 py-3">
          <Zap className="w-5 h-5 text-yellow-300 mb-1" />
          <span className="text-white font-black text-xl">{exam.xpReward.toLocaleString()}</span>
          <span className="text-white/60 text-xs font-bold">XP</span>
        </div>
        <div className="flex flex-col items-center bg-white/15 backdrop-blur rounded-2xl px-5 py-3">
          <span className="text-xl mb-1">💰</span>
          <span className="text-white font-black text-xl">{exam.coinsReward.toLocaleString()}</span>
          <span className="text-white/60 text-xs font-bold">Coins</span>
        </div>
        <div className="flex flex-col items-center bg-white/15 backdrop-blur rounded-2xl px-5 py-3">
          <span className="text-xl mb-1">❓</span>
          <span className="text-white font-black text-xl">25</span>
          <span className="text-white/60 text-xs font-bold">Questions</span>
        </div>
      </motion.div>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={onStart}
        className="bg-white text-gray-900 font-black text-lg px-10 py-4 rounded-2xl shadow-2xl flex items-center gap-3"
      >
        ⚔️ Begin Battle
        <ArrowRight className="w-5 h-5" />
      </motion.button>

      <p className="text-white/40 text-xs mt-6 font-bold">You need 70%+ to pass · No hearts lost</p>
    </motion.div>
  );
}

// ─── Result screen ────────────────────────────────────────────────────────
function ResultScreen({ exam, correct, total, onDone }) {
  const pct = Math.round((correct / total) * 100);
  const passed = pct >= 70;
  const perfect = correct === total;
  const [showParticles, setShowParticles] = useState(passed);

  useEffect(() => {
    // Boss victory deserves a full fanfare
    if (passed) {
      sounds.levelUp();
      haptics.levelUp();
      if (perfect) setTimeout(() => sounds.streak(), 500);
      const t = setTimeout(() => setShowParticles(false), 2000);
      return () => clearTimeout(t);
    }
    sounds.wrong();
    haptics.wrong();
  }, [passed]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-br ${exam.color} px-6 text-center`}
    >
      {showParticles && <Particles count={40} color={perfect ? '#818cf8' : '#facc15'} />}

      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
        className="text-8xl mb-4"
      >
        {perfect ? '🏆' : passed ? '⭐' : '💀'}
      </motion.div>

      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
        <h2 className="text-4xl font-black text-white mb-1">
          {perfect ? 'LEGENDARY!' : passed ? 'VICTORY!' : 'DEFEATED'}
        </h2>
        <p className="text-white/70 text-base mb-6 font-bold">
          {perfect ? 'Absolute perfection. Maximum XP awarded.' : passed ? 'You beat the Chapter Boss!' : 'Study more and try again.'}
        </p>

        <div className="flex justify-center gap-6 mb-8">
          <div className="flex flex-col items-center">
            <span className="text-5xl font-black text-white">{pct}%</span>
            <span className="text-white/60 text-xs font-bold">Score</span>
          </div>
          <div className="w-px bg-white/20" />
          <div className="flex flex-col items-center">
            <span className="text-5xl font-black text-white">{correct}/{total}</span>
            <span className="text-white/60 text-xs font-bold">Correct</span>
          </div>
        </div>

        {passed && (
          <div className="flex gap-4 justify-center mb-8">
            <div className="flex flex-col items-center bg-white/15 rounded-2xl px-5 py-3">
              <Zap className="w-5 h-5 text-yellow-300 mb-1" />
              <span className="text-white font-black text-xl">
                {perfect ? exam.xpReward : Math.round(exam.xpReward * (pct / 100))}
              </span>
              <span className="text-white/60 text-xs font-bold">XP Earned</span>
            </div>
            <div className="flex flex-col items-center bg-white/15 rounded-2xl px-5 py-3">
              <span className="text-xl mb-1">💰</span>
              <span className="text-white font-black text-xl">
                {perfect ? exam.coinsReward : Math.round(exam.coinsReward * (pct / 100))}
              </span>
              <span className="text-white/60 text-xs font-bold">Coins Earned</span>
            </div>
          </div>
        )}
      </motion.div>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        whileTap={{ scale: 0.97 }}
        onClick={onDone}
        className="bg-white text-gray-900 font-black text-base px-8 py-4 rounded-2xl shadow-xl flex items-center gap-2"
      >
        {passed ? '🏠 Back to Learn' : '🔄 Try Again'}
        <ChevronRight className="w-5 h-5" />
      </motion.button>
    </motion.div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function ChapterExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { progress, updateProgress } = useUserProgress();

  const exam = CHAPTER_EXAMS.find(e => e.id === examId);
  const [phase, setPhase] = useState('intro'); // intro | question | result
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [showParticle, setShowParticle] = useState(false);
  const [wrongShake, setWrongShake] = useState(false);

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl mb-4">🔒</p>
          <p className="font-bold text-foreground">Exam not found</p>
          <button onClick={() => navigate('/')} className="mt-4 text-primary font-bold">Back</button>
        </div>
      </div>
    );
  }

  // Gate: all units up to this chapter must be complete — no deep-link XP farming
  const completedLessons = progress?.completed_lessons ?? [];
  const chapterDone = UNITS.slice(0, exam.afterUnit).every(u =>
    u.lessons.every(l => completedLessons.includes(l.id))
  );
  if (!chapterDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center">
          <p className="text-5xl mb-4">🔒</p>
          <p className="font-extrabold text-foreground text-lg">Boss locked</p>
          <p className="text-sm text-muted-foreground mt-2">Complete all units in Chapter {exam.chapter} to challenge this boss.</p>
          <button onClick={() => navigate('/')} className="mt-5 bg-primary text-primary-foreground font-extrabold px-6 py-3 rounded-2xl active:scale-95">
            Back to Learn
          </button>
        </div>
      </div>
    );
  }

  const handleStart = () => {
    const qs = buildQuestions(exam.termIds);
    setQuestions(qs);
    setCurrent(0);
    setCorrect(0);
    setPhase('question');
  };

  const handleSelect = useCallback((opt) => {
    if (answered) return;
    setSelected(opt);
    setAnswered(true);
    const isCorrect = opt === questions[current].correct;
    if (isCorrect) {
      setCorrect(c => c + 1);
      setShowParticle(true);
      setTimeout(() => setShowParticle(false), 800);
    } else {
      setWrongShake(true);
      setTimeout(() => setWrongShake(false), 500);
    }
  }, [answered, current, questions]);

  const handleNext = useCallback(async () => {
    if (current + 1 >= questions.length) {
      // Save result
      const finalCorrect = selected === questions[current].correct ? correct + 1 : correct;
      const pct = Math.round((finalCorrect / questions.length) * 100);
      const passed = pct >= 70;
      const perfect = finalCorrect === questions.length;

      if (passed) {
        const xpEarned = perfect ? exam.xpReward : Math.round(exam.xpReward * (pct / 100));
        const coinsEarned = perfect ? exam.coinsReward : Math.round(exam.coinsReward * (pct / 100));
        const key = `chapter_exam_${exam.id}`;
        const prevBest = progress?.[key] ?? 0;
        const updates = {
          xp: (progress?.xp ?? 0) + xpEarned,
          coins: (progress?.coins ?? 0) + coinsEarned,
          [key]: Math.max(prevBest, pct),
        };
        await updateProgress(updates);
      }
      setCorrect(finalCorrect);
      setPhase('result');
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setAnswered(false);
    }
  }, [current, questions, selected, correct, exam, progress, updateProgress]);

  if (phase === 'intro') return <IntroScreen exam={exam} onStart={handleStart} />;
  if (phase === 'result') {
    return (
      <ResultScreen
        exam={exam}
        correct={correct}
        total={questions.length}
        onDone={() => navigate('/')}
      />
    );
  }

  if (!questions.length) return null;
  const q = questions[current];
  const progress_pct = ((current) / questions.length) * 100;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${exam.color} flex flex-col`}>
      {showParticle && <Particles count={16} color="#facc15" />}

      {/* Header */}
      <div className="pt-safe px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate('/')} className="text-white/70 font-bold text-sm active:opacity-70">✕</button>
          <div className="flex-1">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                animate={{ width: `${progress_pct}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
          <span className="text-white/70 text-xs font-extrabold">{current + 1}/{questions.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">{exam.icon}</span>
          <span className="text-white/70 text-xs font-extrabold uppercase tracking-wider">{exam.subtitle}</span>
        </div>
      </div>

      {/* Question card */}
      <div className="flex-1 px-4 pt-4 pb-8 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -60, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col"
          >
            {/* Question */}
            <div className="bg-white/10 backdrop-blur rounded-3xl p-5 mb-5 flex-shrink-0">
              <div className="text-[10px] font-extrabold text-white/50 uppercase tracking-widest mb-2">
                Question {current + 1}
              </div>
              <p className="text-white font-extrabold text-lg leading-snug whitespace-pre-line">{q.question}</p>
            </div>

            {/* Options */}
            <div className={`flex flex-col gap-3 ${wrongShake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
              {q.options.map((opt, i) => {
                const isSelected = selected === opt;
                const isCorrect = opt === q.correct;
                let bg = 'bg-white/10 border-white/20';
                if (answered) {
                  if (isCorrect) bg = 'bg-green-400/90 border-green-300';
                  else if (isSelected) bg = 'bg-red-400/80 border-red-300';
                  else bg = 'bg-white/5 border-white/10 opacity-60';
                } else if (isSelected) {
                  bg = 'bg-white/25 border-white/50';
                }

                return (
                  <motion.button
                    key={i}
                    whileTap={!answered ? { scale: 0.97 } : {}}
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 transition-all duration-200 ${bg} flex items-center gap-3`}
                  >
                    <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white font-extrabold text-xs shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-white font-bold text-sm leading-snug">{opt}</span>
                    {answered && isCorrect && <CheckCircle className="w-5 h-5 text-white ml-auto shrink-0" />}
                    {answered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-white ml-auto shrink-0" />}
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation after answer */}
            <AnimatePresence>
              {answered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 bg-white/10 rounded-2xl p-4"
                >
                  <p className="text-white/70 text-xs font-bold mb-1">💡 {q.term.term}</p>
                  <p className="text-white text-sm leading-relaxed line-clamp-3">{q.term.definition}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        {/* Next button */}
        <AnimatePresence>
          {answered && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={handleNext}
              className="mt-4 w-full bg-white text-gray-900 font-black py-4 rounded-2xl text-base shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              {current + 1 >= questions.length ? '⚔️ See Results' : 'Next Question'}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Register chapter exam completion in localStorage
export function getChapterExamScores() {
  try { return JSON.parse(localStorage.getItem('chapter_exam_scores') ?? '{}'); }
  catch { return {}; }
}
