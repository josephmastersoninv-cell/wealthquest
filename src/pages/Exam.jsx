import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, CheckCircle2, XCircle, ChevronRight, BookOpen, Zap, DollarSign, RotateCcw, AlertTriangle, Clock } from 'lucide-react';
import { generateExamQuestions, getExamResult, EXAM_REWARDS } from '@/lib/examData';
import { useUserProgress } from '@/lib/useUserProgress';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { TOTAL_LESSONS } from '@/lib/unitData';
import { computeStreak } from '@/lib/streakUtils';
import AchievementToast from '@/components/AchievementToast';
import LevelUpModal from '@/components/LevelUpModal';
import Confetti from '@/components/Confetti';

const TOTAL_QUESTIONS = 50;
const MAX_RETRIES = 3;

function ExamIntro({ onStart, attemptsLeft, bestScore }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center px-4 pt-12 pb-8 max-w-lg mx-auto">
      <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
        <Award className="w-12 h-12 text-primary" />
      </div>
      <h1 className="text-3xl font-extrabold text-foreground mb-2">Final Exam</h1>
      <p className="text-muted-foreground mb-6 leading-relaxed">
        Test your knowledge of financial terms across {TOTAL_QUESTIONS} questions. No hints allowed — prove your mastery!
      </p>

      <div className="grid grid-cols-3 gap-3 w-full mb-8">
        {[
          { label: 'Questions', value: TOTAL_QUESTIONS, icon: '📋' },
          { label: 'Retries Left', value: attemptsLeft, icon: '🔄' },
          { label: 'Best Score', value: bestScore != null ? `${bestScore}%` : '—', icon: '🏆' },
        ].map(item => (
          <div key={item.label} className="bg-card border border-border rounded-2xl p-3 text-center">
            <p className="text-xl mb-1">{item.icon}</p>
            <p className="text-lg font-extrabold text-foreground">{item.value}</p>
            <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 w-full mb-6 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-left">
          <p className="text-sm font-bold text-amber-800 mb-0.5">Rules</p>
          <ul className="text-xs text-amber-700 space-y-0.5">
            <li>• No hints — choose carefully</li>
            <li>• {MAX_RETRIES} total attempts allowed</li>
            <li>• Pass (75%+) earns XP & bonus cash</li>
            <li>• Excellent (90%+) earns maximum rewards</li>
          </ul>
        </div>
      </div>

      <Button onClick={onStart} disabled={attemptsLeft <= 0} className="w-full h-14 text-base font-extrabold rounded-2xl">
        {attemptsLeft <= 0 ? 'No Retries Left' : 'Start Exam'}
      </Button>
      {attemptsLeft <= 0 && (
        <p className="text-xs text-muted-foreground mt-3">Use flashcards to study, then ask your teacher to reset</p>
      )}
    </motion.div>
  );
}

function ExamQuestion({ question, questionNumber, total, onAnswer, answered, selectedIndex }) {
  const isCorrect = answered && selectedIndex === question.correct;

  return (
    <div className="px-4 pb-8 max-w-lg mx-auto">
      {/* Progress */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-muted-foreground">Question {questionNumber} of {total}</span>
          <span className="text-xs font-bold text-primary">{Math.round((questionNumber / total) * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary rounded-full"
            animate={{ width: `${(questionNumber / total) * 100}%` }}
            transition={{ duration: 0.4 }} />
        </div>
      </div>

      {/* Type badge */}
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full mb-3 inline-block ${
        question.type === 'scenario' ? 'bg-amber-100 text-amber-700' :
        question.type === 'recognition' ? 'bg-blue-100 text-blue-700' :
        'bg-purple-100 text-purple-700'}`}>
        {question.type === 'scenario' ? '💡 Applied Scenario' :
         question.type === 'recognition' ? '🔍 Term Recognition' :
         '📖 Definition'}
      </span>

      <motion.div key={question.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
        <p className="text-base font-bold text-foreground mb-5 leading-snug">{question.question}</p>

        <div className="flex flex-col gap-2.5">
          {question.options.map((opt, i) => {
            let style = 'bg-card border-border text-foreground';
            if (answered) {
              if (i === question.correct) style = 'bg-emerald-50 border-emerald-400 text-emerald-800';
              else if (i === selectedIndex && i !== question.correct) style = 'bg-rose-50 border-rose-300 text-rose-700';
              else style = 'bg-muted border-border text-muted-foreground';
            }
            return (
              <button key={i} onClick={() => !answered && onAnswer(i)}
                className={`w-full text-left p-4 rounded-2xl border-2 font-semibold text-sm transition-all ${style} ${!answered ? 'hover:border-primary/50 active:scale-[0.98]' : ''}`}>
                <span className="flex items-start gap-3">
                  <span className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center text-xs font-extrabold mt-0.5 ${
                    answered && i === question.correct ? 'border-emerald-500 bg-emerald-500 text-white' :
                    answered && i === selectedIndex && i !== question.correct ? 'border-rose-400 bg-rose-400 text-white' :
                    'border-current'
                  }`}>
                    {answered && i === question.correct ? '✓' : answered && i === selectedIndex ? '✗' : String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </span>
              </button>
            );
          })}
        </div>

        {answered && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-4 rounded-2xl border ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
            <div className="flex items-start gap-2">
              {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
              <p className={`text-xs font-semibold leading-relaxed ${isCorrect ? 'text-emerald-800' : 'text-rose-800'}`}>
                {isCorrect ? '✓ Correct! ' : '✗ Incorrect. '}{question.explanation}
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function ExamResults({ score, total, answers, questions, onRestart, onReview, rewarded }) {
  const pct = Math.round((score / total) * 100);
  const result = getExamResult(score, total);
  const wrong = questions.filter((_, i) => answers[i] !== questions[i].correct);

  const colorMap = {
    emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
    blue: { bg: 'bg-primary', light: 'bg-primary/5 border-primary/20 text-primary' },
    amber: { bg: 'bg-amber-500', light: 'bg-amber-50 border-amber-200 text-amber-800' },
    rose: { bg: 'bg-rose-500', light: 'bg-rose-50 border-rose-200 text-rose-800' },
  };
  const colors = colorMap[result.color];

  return (
    <div className="px-4 pb-10 max-w-lg mx-auto pt-6">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className={`${colors.bg} text-white rounded-3xl p-8 text-center mb-5 shadow-xl`}>
        <div className="text-6xl font-black mb-2">{pct}%</div>
        <div className="text-xl font-bold mb-1">{result.grade}</div>
        <div className="text-sm opacity-80">{score} / {total} correct</div>
      </motion.div>

      <div className={`p-4 rounded-2xl border mb-5 ${colors.light}`}>
        <p className="text-sm font-semibold">{result.message}</p>
      </div>

      {/* Rewards */}
      {rewarded && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-4 mb-5">
          <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wide">Rewards Earned</p>
          <div className="flex gap-3">
            <div className="flex-1 bg-primary/10 rounded-xl p-3 text-center">
              <Zap className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-extrabold text-primary">+{rewarded.xp}</p>
              <p className="text-xs text-muted-foreground">XP</p>
            </div>
            <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center">
              <DollarSign className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-lg font-extrabold text-emerald-600">+${rewarded.coins}</p>
              <p className="text-xs text-muted-foreground">Cash</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Portfolio live connection — shown on pass */}
      {pct >= 75 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-primary/8 to-emerald-500/8 border border-primary/20 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📈</span>
            <p className="text-sm font-extrabold text-foreground">Now See It Live in Your Portfolio</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            The concepts you just mastered are moving in the market right now. Watch them play out:
          </p>
          {[
            { term: 'Dividend', stocks: 'JNJ, T, VZ', desc: 'These pay you cash every quarter — watch it appear in your portfolio.', emoji: '💵' },
            { term: 'Bond', stocks: 'Research → Bonds', desc: 'Buy a bond, then watch its price fall when interest rates rise.', emoji: '🏛️' },
            { term: 'Volatility', stocks: 'TSLA, NVDA, BTC', desc: 'These move the most — high risk but high potential reward.', emoji: '⚡' },
          ].map((c, i) => (
            <div key={i} className="flex items-start gap-2 py-2 border-t border-border/40 first:border-t-0">
              <span className="text-base mt-0.5">{c.emoji}</span>
              <div>
                <p className="text-xs font-extrabold text-foreground">{c.term} → <span className="text-primary">{c.stocks}</span></p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{c.desc}</p>
              </div>
            </div>
          ))}
          <Link to="/portfolio" className="block mt-3">
            <Button className="w-full rounded-xl font-bold h-11">Open Portfolio →</Button>
          </Link>
        </motion.div>
      )}

      {/* Mistakes */}
      {wrong.length > 0 && (
        <div className="mb-5">
          <p className="text-sm font-extrabold text-foreground mb-3">Review Mistakes ({wrong.length})</p>
          <div className="flex flex-col gap-2">
            {wrong.map((q, i) => (
              <div key={q.id} className="bg-rose-50 border border-rose-200 rounded-2xl p-3">
                <p className="text-xs font-bold text-rose-700 mb-0.5">Q: {q.question}</p>
                <p className="text-xs text-rose-600">✓ {q.options[q.correct]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Link to="/flashcards">
          <Button variant="outline" className="w-full rounded-2xl h-12 font-bold">
            <BookOpen className="w-4 h-4 mr-2" /> Study Flashcards
          </Button>
        </Link>
        {pct < 75 && (
          <Button onClick={onRestart} className="w-full rounded-2xl h-12 font-bold">
            <RotateCcw className="w-4 h-4 mr-2" /> Try Again
          </Button>
        )}
        <Link to="/">
          <Button variant="secondary" className="w-full rounded-2xl h-12 font-bold">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}

export default function Exam() {
  const navigate = useNavigate();
  const { progress, updateProgress, newAchievements, dismissAchievements } = useUserProgress();
  const [phase, setPhase] = useState('intro'); // 'intro' | 'exam' | 'results'
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [rewarded, setRewarded] = useState(null);
  const [confetti, setConfetti] = useState(false);

  const completedLessons = progress?.completed_lessons ?? [];
  const allDone = completedLessons.length >= TOTAL_LESSONS;

  useEffect(() => {
    if (progress !== null && !allDone) {
      navigate('/', { replace: true });
    }
  }, [progress, allDone, navigate]);

  const attemptsUsed = progress?.exam_attempts || 0;
  const attemptsLeft = MAX_RETRIES - attemptsUsed;
  const bestScore = progress?.exam_best_score ?? null;

  const startExam = () => {
    const qs = generateExamQuestions(TOTAL_QUESTIONS);
    setQuestions(qs);
    setCurrentQ(0);
    setAnswers([]);
    setSelectedIndex(null);
    setAnswered(false);
    setRewarded(null);
    setPhase('exam');
  };

  const handleAnswer = async (index) => {
    setSelectedIndex(index);
    setAnswered(true);
    const isWrong = index !== questions[currentQ]?.correct;
    if (isWrong) {
      const currentHearts = progress?.hearts ?? 5;
      if (currentHearts > 0) {
        await updateProgress({ hearts: currentHearts - 1 });
        toast.error('💔 Wrong! −1 heart');
      }
    }
  };

  const handleNext = async () => {
    const newAnswers = [...answers, selectedIndex];
    if (currentQ < questions.length - 1) {
      setAnswers(newAnswers);
      setCurrentQ(q => q + 1);
      setSelectedIndex(null);
      setAnswered(false);
    } else {
      // Exam complete
      const score = newAnswers.filter((a, i) => a === questions[i].correct).length;
      const pct = Math.round((score / questions.length) * 100);
      const result = getExamResult(score, questions.length);
      const isExcellent = pct >= 90;
      const isPassed = pct >= 75;

      const earnedXp = isPassed ? (isExcellent ? EXAM_REWARDS.xp.excellent : EXAM_REWARDS.xp.pass) : 0;
      const earnedCoins = isPassed ? (isExcellent ? EXAM_REWARDS.coins.excellent : EXAM_REWARDS.coins.pass) : 0;

      const today = new Date().toISOString().split('T')[0];
      const { streak } = computeStreak(progress?.last_active_date, progress?.streak_days);
      const updates = {
        exam_attempts: attemptsUsed + 1,
        exam_best_score: Math.max(bestScore ?? 0, pct),
        streak_days: streak,
        last_active_date: today,
      };
      if (isPassed) {
        updates.xp = (progress?.xp || 0) + earnedXp;
        updates.coins = (progress?.coins || 0) + earnedCoins;
        updates.portfolio_balance = (progress?.portfolio_balance || 0) + earnedCoins;
      }
      await updateProgress(updates);

      if (isPassed) {
        setRewarded({ xp: earnedXp, coins: earnedCoins });
        toast.success(`+${earnedXp} XP · +$${earnedCoins} earned!`);
        setConfetti(true);
      }

      setAnswers(newAnswers);
      setPhase('results');
    }
  };

  const score = answers.filter((a, i) => a === questions[i]?.correct).length;

  return (
    <div className="min-h-screen bg-background">
      <Confetti active={confetti} onDone={() => setConfetti(false)} />
      <AchievementToast achievements={newAchievements} onDismiss={dismissAchievements} />
      <LevelUpModal progress={progress} />
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ExamIntro onStart={startExam} attemptsLeft={attemptsLeft} bestScore={bestScore} />
          </motion.div>
        )}

        {phase === 'exam' && questions[currentQ] && (
          <motion.div key="exam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="sticky top-0 bg-background border-b border-border z-10 px-4 py-3 flex items-center justify-between max-w-lg mx-auto">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <span className="text-sm font-extrabold text-foreground">Final Exam</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex gap-0.5 text-sm">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < (progress?.hearts ?? 5) ? 'text-rose-500' : 'text-muted-foreground/30'}>♥</span>
                  ))}
                </span>
                <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-lg">
                  {currentQ + 1}/{questions.length}
                </span>
              </div>
            </div>
            <div className="pt-4">
              <ExamQuestion
                question={questions[currentQ]}
                questionNumber={currentQ + 1}
                total={questions.length}
                onAnswer={handleAnswer}
                answered={answered}
                selectedIndex={selectedIndex}
              />
              {answered && (
                <div className="px-4 max-w-lg mx-auto">
                  <Button onClick={handleNext} className="w-full h-13 text-base font-extrabold rounded-2xl h-14">
                    {currentQ < questions.length - 1 ? (
                      <><ChevronRight className="w-5 h-5 mr-1" /> Next Question</>
                    ) : (
                      <><Award className="w-5 h-5 mr-1" /> See Results</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {phase === 'results' && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="sticky top-0 bg-background border-b border-border z-10 px-4 py-3 max-w-lg mx-auto">
              <p className="text-sm font-extrabold text-foreground">Exam Complete</p>
            </div>
            <ExamResults
              score={score}
              total={questions.length}
              answers={answers}
              questions={questions}
              onRestart={startExam}
              rewarded={rewarded}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
