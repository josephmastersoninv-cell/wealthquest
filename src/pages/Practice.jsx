import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Swords, CheckCircle2, XCircle, ChevronRight, Heart, Zap, RotateCcw, Flame } from 'lucide-react';
import { GLOSSARY_TERMS } from '@/lib/glossaryData';
import { Button } from '@/components/ui/button';
import { useUserProgress } from '@/lib/useUserProgress';
import { computeStreak } from '@/lib/streakUtils';
import { toast } from 'sonner';
import AchievementToast from '@/components/AchievementToast';

const PRACTICE_QUESTIONS = 10;
const BASE_XP = 5;

function getMultiplier(combo) {
  if (combo >= 6) return 3;
  if (combo >= 3) return 2;
  return 1;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generatePracticeQuestions(count) {
  const terms = shuffleArray([...GLOSSARY_TERMS]).slice(0, count * 3);
  return terms.slice(0, count).map((term) => {
    const wrong = GLOSSARY_TERMS.filter((t) => t.id !== term.id);
    const distractors = shuffleArray(wrong).slice(0, 3).map((t) => t.definition);
    const options = shuffleArray([term.definition, ...distractors]);
    return {
      id: `prac-${term.id}`,
      term: term.term,
      options,
      correct: options.indexOf(term.definition),
      explanation: term.definition,
    };
  });
}

export default function Practice() {
  const { progress, updateProgress, newAchievements, dismissAchievements } = useUserProgress();
  const [phase, setPhase] = useState('intro');
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [heartsLeft, setHeartsLeft] = useState(5);
  const [xpGained, setXpGained] = useState(0);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [lastXp, setLastXp] = useState(0);

  const hearts = progress?.hearts ?? 5;

  const startPractice = () => {
    setQuestions(generatePracticeQuestions(PRACTICE_QUESTIONS));
    setCurrentQ(0);
    setAnswers([]);
    setSelected(null);
    setAnswered(false);
    setHeartsLeft(hearts);
    setXpGained(0);
    setCombo(0);
    setShowCombo(false);
    setLastXp(0);
    setPhase('quiz');
  };

  const handleAnswer = (i) => {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    const correct = i === questions[currentQ].correct;
    if (correct) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo >= 3) setShowCombo(true);
      const mult = getMultiplier(newCombo);
      const xp = BASE_XP * mult;
      setLastXp(xp);
    } else {
      setCombo(0);
      setShowCombo(false);
      setHeartsLeft((h) => Math.max(0, h - 1));
      setLastXp(0);
    }
  };

  const handleNext = async () => {
    const correct = selected === questions[currentQ].correct;
    const mult = correct ? getMultiplier(combo) : 0;
    const xp = BASE_XP * mult;
    const newXpTotal = xpGained + xp;
    const newAnswers = [...answers, { selected, correct }];

    if (currentQ < questions.length - 1) {
      setAnswers(newAnswers);
      setCurrentQ((q) => q + 1);
      setSelected(null);
      setAnswered(false);
      setXpGained(newXpTotal);
      setShowCombo(false);
    } else {
      setAnswers(newAnswers);
      setXpGained(newXpTotal);
      const score = newAnswers.filter((a) => a.correct).length;
      if (progress) {
        const today = new Date().toISOString().split('T')[0];
        const { streak } = computeStreak(progress.last_active_date, progress.streak_days);
        const heartsLost = hearts - heartsLeft - (correct ? 0 : 1);
        const finalHearts = Math.max(0, hearts - Math.max(0, heartsLost));
        await updateProgress({
          xp: (progress.xp ?? 0) + newXpTotal,
          coins: (progress.coins ?? 0) + score,
          hearts: Math.min(5, finalHearts),
          practice_sessions: (progress.practice_sessions ?? 0) + 1,
          streak_days: streak,
          last_active_date: today,
        });
        if (newXpTotal > 0) toast.success(`+${newXpTotal} XP earned in practice!`);
      }
      setPhase('results');
    }
  };

  const score = answers.filter((a) => a.correct).length;
  const mult = getMultiplier(combo);

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <AnimatePresence mode="wait">

        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="px-4 py-8">
            <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground mb-6">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <div className="flex flex-col items-center text-center pt-4">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-5">
                <Swords className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-extrabold text-foreground mb-2">Practice Quiz</h1>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                {PRACTICE_QUESTIONS} questions. Build a combo streak for multiplied XP. Unlimited attempts.
              </p>

              <div className="grid grid-cols-3 gap-3 w-full mb-6">
                {[
                  { label: 'Questions', value: PRACTICE_QUESTIONS, icon: '📋' },
                  { label: 'Base XP', value: `+${BASE_XP}`, icon: '⚡' },
                  { label: 'Max Multiplier', value: '3×', icon: '🔥' },
                ].map((item) => (
                  <div key={item.label} className="bg-card border border-border rounded-2xl p-3 text-center">
                    <p className="text-xl mb-1">{item.icon}</p>
                    <p className="text-lg font-extrabold text-foreground">{item.value}</p>
                    <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 w-full mb-6 text-left">
                <p className="text-sm font-bold text-amber-800 mb-1">🔥 Combo System</p>
                <ul className="text-xs text-amber-700 space-y-0.5">
                  <li>• 3 correct in a row → <strong>2× XP</strong></li>
                  <li>• 6 correct in a row → <strong>3× XP</strong></li>
                  <li>• Wrong answer resets your combo (and costs a ❤️)</li>
                </ul>
              </div>

              <Button onClick={startPractice} disabled={hearts <= 0} className="w-full h-14 text-base font-extrabold rounded-2xl">
                {hearts <= 0 ? 'No Hearts Left — Come Back Tomorrow' : 'Start Practice'}
              </Button>
            </div>
          </motion.div>
        )}

        {phase === 'quiz' && questions[currentQ] && (
          <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Sticky header */}
            <div className="sticky top-0 bg-background border-b border-border z-10 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-primary" />
                <span className="text-sm font-extrabold text-foreground">Practice</span>
                {mult > 1 && (
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${mult >= 3 ? 'bg-rose-500 text-white' : 'bg-amber-400 text-white'}`}>
                    {mult}× XP
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="flex gap-0.5 text-sm">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < heartsLeft ? 'text-rose-500' : 'text-muted-foreground/30'}>♥</span>
                  ))}
                </span>
                <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-lg">
                  {currentQ + 1}/{questions.length}
                </span>
              </div>
            </div>

            <div className="px-4 pt-5 pb-8">
              {/* Progress dots */}
              <div className="flex gap-1 mb-5">
                {questions.map((_, i) => (
                  <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${
                    i < currentQ
                      ? answers[i]?.correct ? 'bg-emerald-400' : 'bg-rose-400'
                      : i === currentQ ? 'bg-primary' : 'bg-muted'
                  }`} />
                ))}
              </div>

              {/* Combo banner */}
              <AnimatePresence>
                {showCombo && combo >= 3 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`flex items-center justify-center gap-2 py-2 px-4 rounded-2xl mb-4 ${
                      mult >= 3 ? 'bg-rose-500 text-white' : 'bg-amber-400 text-white'
                    }`}
                  >
                    <Flame className="w-5 h-5" />
                    <span className="font-extrabold text-sm">{combo} in a row! {mult}× XP ACTIVE</span>
                    <Flame className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div key={currentQ} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}>
                <p className="text-xs font-bold text-primary uppercase tracking-wide mb-2">What is the definition of…</p>
                <p className="text-xl font-extrabold text-foreground mb-6">{questions[currentQ].term}</p>

                <div className="flex flex-col gap-2.5">
                  {questions[currentQ].options.map((opt, i) => {
                    const isCorrect = i === questions[currentQ].correct;
                    const isSelected = i === selected;
                    let cls = 'bg-card border-border text-foreground';
                    if (answered) {
                      if (isCorrect) cls = 'bg-emerald-50 border-emerald-400 text-emerald-800';
                      else if (isSelected) cls = 'bg-rose-50 border-rose-300 text-rose-700';
                      else cls = 'bg-muted border-border text-muted-foreground';
                    }
                    return (
                      <button key={i} onClick={() => handleAnswer(i)}
                        className={`w-full text-left p-4 rounded-2xl border-2 font-semibold text-sm transition-all ${cls} ${!answered ? 'hover:border-primary/50 active:scale-[0.98]' : ''}`}>
                        <span className="flex items-start gap-3">
                          <span className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center text-xs font-extrabold mt-0.5 ${
                            answered && isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' :
                            answered && isSelected && !isCorrect ? 'border-rose-400 bg-rose-400 text-white' :
                            'border-current'
                          }`}>
                            {answered && isCorrect ? '✓' : answered && isSelected ? '✗' : String.fromCharCode(65 + i)}
                          </span>
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {answered && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 p-4 rounded-2xl border flex items-start gap-2 ${
                      selected === questions[currentQ].correct
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-rose-50 border-rose-200'
                    }`}>
                    {selected === questions[currentQ].correct
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      : <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
                    <div>
                      <p className={`text-xs font-bold mb-0.5 ${selected === questions[currentQ].correct ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {selected === questions[currentQ].correct
                          ? `✓ Correct! +${lastXp} XP${mult > 1 ? ` (${mult}× combo!)` : ''}`
                          : '✗ Incorrect — combo reset, -1 heart'}
                      </p>
                      <p className={`text-xs font-semibold leading-relaxed ${selected === questions[currentQ].correct ? 'text-emerald-800' : 'text-rose-800'}`}>
                        {questions[currentQ].explanation}
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {answered && (
                <div className="mt-5">
                  <Button onClick={handleNext} className="w-full h-14 text-base font-extrabold rounded-2xl">
                    {currentQ < questions.length - 1 ? (
                      <><ChevronRight className="w-5 h-5 mr-1" /> Next</>
                    ) : 'See Results'}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {phase === 'results' && (
          <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="px-4 py-10">
            <div className={`rounded-3xl p-8 text-center mb-5 shadow-xl ${
              score >= 8 ? 'bg-emerald-500' : score >= 5 ? 'bg-primary' : 'bg-amber-500'
            } text-white`}>
              <div className="text-6xl font-black mb-2">{score}/{questions.length}</div>
              <div className="text-xl font-bold mb-1">
                {score >= 8 ? 'Excellent!' : score >= 5 ? 'Good job!' : 'Keep practising!'}
              </div>
              <div className="text-sm opacity-80">+{xpGained} XP earned</div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4 mb-6">
              <div className="flex gap-4 justify-around">
                <div className="text-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <p className="text-lg font-extrabold text-foreground">{score}</p>
                  <p className="text-xs text-muted-foreground">Correct</p>
                </div>
                <div className="text-center">
                  <XCircle className="w-5 h-5 text-rose-400 mx-auto mb-1" />
                  <p className="text-lg font-extrabold text-foreground">{questions.length - score}</p>
                  <p className="text-xs text-muted-foreground">Incorrect</p>
                </div>
                <div className="text-center">
                  <Heart className="w-5 h-5 text-rose-500 mx-auto mb-1" />
                  <p className="text-lg font-extrabold text-foreground">{heartsLeft}</p>
                  <p className="text-xs text-muted-foreground">Hearts Left</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={startPractice} disabled={heartsLeft <= 0} className="w-full h-14 font-extrabold rounded-2xl">
                <RotateCcw className="w-4 h-4 mr-2" /> Practice Again
              </Button>
              <Link to="/flashcards">
                <Button variant="outline" className="w-full h-14 font-extrabold rounded-2xl">Study Flashcards</Button>
              </Link>
              <Link to="/">
                <Button variant="secondary" className="w-full h-12 font-bold rounded-2xl">Back to Home</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AchievementToast achievements={newAchievements} onDismiss={dismissAchievements} />
    </div>
  );
}
