import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle2, XCircle, ChevronRight, Zap, DollarSign, Trophy } from 'lucide-react';
import { generateDailyQuestions, getTodayKey, DAILY_XP, DAILY_COINS } from '@/lib/dailyChallengeData';
import { useUserProgress } from '@/lib/useUserProgress';
import { Button } from '@/components/ui/button';
import { computeStreak } from '@/lib/streakUtils';
import { toast } from 'sonner';
import AchievementToast from '@/components/AchievementToast';
import Confetti from '@/components/Confetti';

function Countdown() {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono font-extrabold">{timeLeft}</span>;
}

export default function DailyChallenge() {
  const { progress, updateProgress, newAchievements, dismissAchievements } = useUserProgress();
  const [phase, setPhase] = useState('intro'); // intro | quiz | results
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [confetti, setConfetti] = useState(false);

  const todayKey = getTodayKey();
  const alreadyDone = progress?.daily_challenge_date === todayKey;
  const questions = useMemo(() => generateDailyQuestions(), []);

  const handleAnswer = (i) => {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
  };

  const handleNext = async () => {
    const correct = selected === questions[currentQ].correct;
    const newAnswers = [...answers, { selected, correct }];

    if (currentQ < questions.length - 1) {
      setAnswers(newAnswers);
      setCurrentQ((q) => q + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setAnswers(newAnswers);
      const score = newAnswers.filter((a) => a.correct).length;
      const allCorrect = score === questions.length;

      if (progress) {
        const today = new Date().toISOString().split('T')[0];
        const { streak } = computeStreak(progress.last_active_date, progress.streak_days);
        const earned = { xp: DAILY_XP, coins: DAILY_COINS };
        await updateProgress({
          xp: (progress.xp ?? 0) + earned.xp,
          coins: (progress.coins ?? 0) + earned.coins,
          daily_challenge_date: todayKey,
          daily_challenge_streak: (progress.daily_challenge_streak ?? 0) + 1,
          streak_days: streak,
          last_active_date: today,
        });
        toast.success(`+${earned.xp} XP · +$${earned.coins} Daily Bonus!`);
        if (allCorrect) setConfetti(true);
      }
      setPhase('results');
    }
  };

  const score = answers.filter((a) => a.correct).length;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <Confetti active={confetti} onDone={() => setConfetti(false)} />
      <AnimatePresence mode="wait">

        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="px-4 py-8">
            <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground mb-6">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>

            <div className="flex flex-col items-center text-center pt-2">
              <div className="w-20 h-20 rounded-3xl bg-amber-100 flex items-center justify-center mb-5">
                <Calendar className="w-10 h-10 text-amber-500" />
              </div>
              <h1 className="text-3xl font-extrabold text-foreground mb-2">Daily Challenge</h1>
              <p className="text-muted-foreground mb-2 leading-relaxed">
                5 new questions every day. Complete it for bonus XP and coins.
              </p>
              <p className="text-xs text-muted-foreground mb-8">Resets in <Countdown /></p>

              {alreadyDone ? (
                <>
                  <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-6 text-center">
                    <div className="text-4xl mb-3">✅</div>
                    <p className="text-lg font-extrabold text-emerald-800">Done for today!</p>
                    <p className="text-sm text-emerald-600 mt-1">Come back tomorrow for a new challenge.</p>
                    <p className="text-xs text-muted-foreground mt-3">Next challenge in <Countdown /></p>
                  </div>
                  <Link to="/" className="w-full">
                    <Button variant="outline" className="w-full h-12 font-bold rounded-2xl">Back to Home</Button>
                  </Link>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3 w-full mb-8">
                    {[
                      { label: 'Questions', value: '5', icon: '📋' },
                      { label: 'XP Bonus', value: `+${DAILY_XP}`, icon: '⚡' },
                      { label: 'Cash Bonus', value: `+$${DAILY_COINS}`, icon: '💵' },
                    ].map((item) => (
                      <div key={item.label} className="bg-card border border-border rounded-2xl p-3 text-center">
                        <p className="text-xl mb-1">{item.icon}</p>
                        <p className="text-lg font-extrabold text-foreground">{item.value}</p>
                        <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                      </div>
                    ))}
                  </div>
                  <Button onClick={() => setPhase('quiz')} className="w-full h-14 text-base font-extrabold rounded-2xl bg-amber-500 hover:bg-amber-600 border-0">
                    Start Today's Challenge
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}

        {phase === 'quiz' && questions[currentQ] && (
          <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="sticky top-0 bg-background border-b border-border z-10 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-extrabold text-foreground">Daily Challenge</span>
              </div>
              <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-lg">
                {currentQ + 1} / {questions.length}
              </span>
            </div>

            <div className="px-4 pt-5 pb-8">
              <div className="flex gap-1.5 mb-6">
                {questions.map((_, i) => (
                  <div key={i} className={`flex-1 h-1.5 rounded-full ${
                    i < currentQ ? 'bg-amber-400' : i === currentQ ? 'bg-amber-300' : 'bg-muted'
                  }`} />
                ))}
              </div>

              <motion.div key={currentQ} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">{questions[currentQ].category}</span>
                <p className="text-xs font-bold text-muted-foreground mt-1 mb-1">What is the definition of…</p>
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
                        className={`w-full text-left p-4 rounded-2xl border-2 font-semibold text-sm transition-all ${cls} ${!answered ? 'hover:border-amber-400/60 active:scale-[0.98]' : ''}`}>
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
                    className={`mt-4 p-3 rounded-2xl border text-xs font-semibold leading-relaxed ${
                      selected === questions[currentQ].correct
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                    {selected === questions[currentQ].correct ? '✓ Correct! ' : '✗ Incorrect. '}
                    {questions[currentQ].explanation}
                  </motion.div>
                )}
              </motion.div>

              {answered && (
                <div className="mt-5">
                  <Button onClick={handleNext} className="w-full h-14 text-base font-extrabold rounded-2xl bg-amber-500 hover:bg-amber-600 border-0">
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
            className="px-4 py-10 flex flex-col items-center text-center">
            <div className={`w-full rounded-3xl p-8 mb-5 shadow-xl ${
              score === 5 ? 'bg-emerald-500' : score >= 3 ? 'bg-amber-500' : 'bg-primary'
            } text-white`}>
              <div className="text-6xl font-black mb-2">{score}/5</div>
              <div className="text-xl font-bold">
                {score === 5 ? 'Perfect Score! 🎉' : score >= 3 ? 'Good job!' : 'Keep studying!'}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4 w-full mb-6">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Daily Bonus Earned</p>
              <div className="flex gap-3">
                <div className="flex-1 bg-primary/10 rounded-xl p-3 text-center">
                  <Zap className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-lg font-extrabold text-primary">+{DAILY_XP}</p>
                  <p className="text-xs text-muted-foreground">XP</p>
                </div>
                <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center">
                  <DollarSign className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  <p className="text-lg font-extrabold text-emerald-600">+${DAILY_COINS}</p>
                  <p className="text-xs text-muted-foreground">Cash</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <Link to="/practice">
                <Button className="w-full h-14 font-extrabold rounded-2xl">Keep Practising</Button>
              </Link>
              <Link to="/">
                <Button variant="outline" className="w-full h-12 font-bold rounded-2xl">Back to Home</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AchievementToast achievements={newAchievements} onDismiss={dismissAchievements} />
    </div>
  );
}
