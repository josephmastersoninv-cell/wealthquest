import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Timer, Zap, Crown } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { UNITS } from '@/lib/unitData';
import { getTermById, GLOSSARY_TERMS } from '@/lib/glossaryData';
import { useUserProgress } from '@/lib/useUserProgress';
import { applyStreakMultiplier } from '@/lib/streakMultiplier';
import { incrementMissionCounter } from '@/lib/missionsData';
import { toast } from 'sonner';

const BOSS_XP = 200;
const BOSS_COINS = 100;
const TIME_LIMIT = 60;
const QUESTIONS = 10;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestion(term, allTerms) {
  const wrong = shuffle(allTerms.filter(t => t.id !== term.id)).slice(0, 3);
  const options = shuffle([term, ...wrong]);
  return { term, options, correct: options.indexOf(term) };
}

const BOSS_KEY = 'wealthquest_boss_wins';
export function getBossWins() {
  try { return JSON.parse(localStorage.getItem(BOSS_KEY) ?? '{}'); } catch { return {}; }
}
function markBossWin(unitId) {
  const w = getBossWins();
  w[unitId] = (w[unitId] ?? 0) + 1;
  localStorage.setItem(BOSS_KEY, JSON.stringify(w));
}

export default function BossBattle() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const { progress, updateProgress } = useUserProgress();

  const unit = UNITS.find(u => u.id === unitId);
  const terms = useMemo(() => {
    if (!unit) return [];
    const allTermIds = unit.lessons.flatMap(l => l.terms);
    const termObjs = allTermIds.map(id => getTermById(id)).filter(Boolean);
    return shuffle(termObjs).slice(0, QUESTIONS);
  }, [unit]);

  const questions = useMemo(() => terms.map(t => buildQuestion(t, GLOSSARY_TERMS)), [terms]);

  const [phase, setPhase] = useState('intro'); // intro | battle | results
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (phase !== 'battle') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setPhase('results');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  if (!unit) return <div className="p-8 text-center text-muted-foreground">Unit not found.</div>;

  const q = questions[idx];
  const passed = correct >= 7; // 70% to pass
  const multiplier = applyStreakMultiplier(1, progress?.streak_days ?? 0);
  const xpEarned = passed ? Math.round(BOSS_XP * multiplier) : Math.round(BOSS_XP * 0.3 * multiplier);
  const coinsEarned = passed ? BOSS_COINS : 0;

  function pick(i) {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    const isCorrect = i === q.correct;
    const newCombo = isCorrect ? combo + 1 : 0;
    setCombo(newCombo);
    setMaxCombo(c => Math.max(c, newCombo));
    if (isCorrect) setCorrect(c => c + 1);

    setTimeout(() => {
      if (idx + 1 < questions.length) {
        setIdx(i => i + 1);
        setSelected(null);
        setAnswered(false);
      } else {
        clearInterval(timerRef.current);
        setPhase('results');
      }
    }, 600);
  }

  async function handleFinish() {
    const xp = (progress?.xp ?? 0) + xpEarned;
    const coins = (progress?.coins ?? 0) + coinsEarned;
    if (passed) {
      markBossWin(unitId);
      incrementMissionCounter('boss_today');
    }
    await updateProgress({ xp, coins });
    toast.success(`${passed ? '👑' : '📖'} +${xpEarned} XP earned!`);
    navigate('/');
  }

  // Intro
  if (phase === 'intro') return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 max-w-lg mx-auto text-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${unit.color === 'emerald' ? 'from-emerald-500 to-teal-600' : 'from-violet-500 to-fuchsia-600'} flex items-center justify-center text-5xl mb-6 shadow-xl`}>
        {unit.emoji}
      </motion.div>
      <h1 className="text-3xl font-black text-foreground mb-2">Boss Battle</h1>
      <p className="text-xl font-extrabold text-foreground mb-1">{unit.title}</p>
      <p className="text-muted-foreground text-sm mb-8">Answer {QUESTIONS} questions in {TIME_LIMIT} seconds.<br/>Score 7+ to win and earn <span className="font-bold text-primary">+{BOSS_XP} XP</span> & <span className="font-bold text-amber-500">+{BOSS_COINS} coins</span>.</p>

      <div className="flex gap-4 w-full mb-6">
        {[`⏱ ${TIME_LIMIT}s`, `❓ ${QUESTIONS} Qs`, `🎯 70% to pass`].map(s => (
          <div key={s} className="flex-1 bg-card border border-border rounded-2xl py-3 text-center text-xs font-extrabold text-foreground">{s}</div>
        ))}
      </div>

      <button onClick={() => setPhase('battle')}
        className="w-full h-14 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-extrabold text-lg shadow-lg active:scale-95 transition-all">
        Start Battle ⚔️
      </button>
      <Link to="/" className="mt-4 text-sm text-muted-foreground">Back to path</Link>
    </div>
  );

  // Results
  if (phase === 'results') return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 max-w-lg mx-auto text-center">
      <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="text-8xl mb-4">{passed ? '👑' : '💀'}</motion.div>
      <h1 className="text-3xl font-black text-foreground mb-1">{passed ? 'Victory!' : 'Defeated!'}</h1>
      <p className="text-muted-foreground mb-6">{correct}/{QUESTIONS} correct · Max combo: {maxCombo}×</p>

      <div className={`w-full rounded-3xl p-6 mb-6 text-white ${passed ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-slate-600 to-slate-800'}`}>
        <div className="flex gap-4 justify-center">
          <div>
            <p className="text-3xl font-black">+{xpEarned}</p>
            <p className="text-white/70 text-xs font-bold">XP</p>
          </div>
          {passed && <div>
            <p className="text-3xl font-black">+{coinsEarned}</p>
            <p className="text-white/70 text-xs font-bold">Coins</p>
          </div>}
        </div>
        {multiplier > 1 && <p className="text-white/80 text-xs mt-2">{multiplier}× streak bonus applied</p>}
      </div>

      <button onClick={handleFinish}
        className="w-full h-14 rounded-2xl bg-primary text-white font-extrabold text-base active:scale-95 mb-3">
        {passed ? 'Claim Rewards →' : 'Try Again Tomorrow'}
      </button>
      {!passed && (
        <button onClick={() => { setPhase('intro'); setIdx(0); setCorrect(0); setCombo(0); setTimeLeft(TIME_LIMIT); setSelected(null); setAnswered(false); }}
          className="w-full h-12 rounded-2xl border border-border text-foreground font-bold text-sm active:scale-95">
          Retry Now
        </button>
      )}
    </div>
  );

  // Battle
  const timePct = (timeLeft / TIME_LIMIT) * 100;
  const timerColor = timeLeft > 20 ? 'bg-emerald-500' : timeLeft > 10 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-600 to-orange-500 px-4 pt-12 pb-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            <span className="font-extrabold">Boss Battle</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 rounded-xl px-3 py-1">
            <Timer className="w-4 h-4" />
            <span className="font-extrabold text-lg">{timeLeft}</span>
          </div>
        </div>
        <div className="h-2 bg-white/30 rounded-full overflow-hidden">
          <motion.div className={`h-full rounded-full ${timerColor}`}
            style={{ width: `${timePct}%` }} transition={{ duration: 0.5 }} />
        </div>
        <div className="flex justify-between text-xs mt-2 text-white/70">
          <span>{idx + 1}/{QUESTIONS} questions</span>
          <span>{correct} correct {combo >= 2 ? `· 🔥 ${combo}× combo` : ''}</span>
        </div>
      </div>

      <div className="px-4 pt-6">
        <AnimatePresence mode="wait">
          <motion.div key={idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="bg-card border border-border rounded-2xl p-5 mb-5">
              <p className="text-xs font-bold text-muted-foreground uppercase mb-2">{q.term.category}</p>
              <p className="text-xl font-extrabold text-foreground">{q.term.term}</p>
            </div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground mb-3">Choose the correct definition</p>
            <div className="space-y-2.5">
              {q.options.map((opt, i) => {
                const isCorrect = i === q.correct;
                const isSel = i === selected;
                let cls = 'bg-card border-border text-foreground';
                if (answered) {
                  if (isCorrect) cls = 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 text-emerald-800 dark:text-emerald-300';
                  else if (isSel) cls = 'bg-rose-50 dark:bg-rose-900/20 border-rose-400 text-rose-700';
                  else cls = 'bg-muted border-border text-muted-foreground';
                }
                return (
                  <button key={i} onClick={() => pick(i)}
                    className={`w-full text-left p-4 rounded-2xl border-2 text-sm font-semibold transition-all ${cls} ${!answered ? 'hover:border-primary/40 active:scale-[0.98]' : ''}`}>
                    <span className="flex items-start gap-3">
                      <span className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center text-xs font-extrabold mt-0.5 ${
                        answered && isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' :
                        answered && isSel ? 'border-rose-400 bg-rose-400 text-white' : 'border-current'
                      }`}>
                        {answered && isCorrect ? '✓' : answered && isSel ? '✗' : String.fromCharCode(65 + i)}
                      </span>
                      {opt.definition}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
