import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDueTermIds, getDueCount, markWrong, markCorrect } from '@/lib/reviewData';
import { getTermById, GLOSSARY_TERMS } from '@/lib/glossaryData';
import { useUserProgress } from '@/lib/useUserProgress';
import { toast } from 'sonner';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ReviewCard({ term, allTerms, onResult }) {
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);

  const options = useMemo(() => {
    const wrong = shuffle(allTerms.filter(t => t.id !== term.id)).slice(0, 3);
    return shuffle([term, ...wrong]);
  }, [term]);

  const correctIdx = options.indexOf(term);

  function handlePick(i) {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    const correct = i === correctIdx;
    setTimeout(() => onResult(correct), 900);
  }

  return (
    <div className="px-4">
      <div className="bg-card border border-border rounded-2xl p-5 mb-5">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">{term.category}</p>
        <p className="text-xl font-extrabold text-foreground mb-1">{term.term}</p>
        <p className="text-xs text-muted-foreground italic">{term.example}</p>
      </div>

      <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground mb-3">Which is the correct definition?</p>

      <div className="space-y-2.5">
        {options.map((opt, i) => {
          const isCorrect = i === correctIdx;
          const isSel = i === selected;
          let cls = 'bg-card border-border text-foreground';
          if (answered) {
            if (isCorrect) cls = 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 text-emerald-800 dark:text-emerald-300';
            else if (isSel) cls = 'bg-rose-50 dark:bg-rose-900/20 border-rose-400 text-rose-700 dark:text-rose-300';
            else cls = 'bg-muted border-border text-muted-foreground';
          }

          return (
            <button key={i} onClick={() => handlePick(i)}
              className={`w-full text-left p-4 rounded-2xl border-2 font-semibold text-sm transition-all ${cls} ${!answered ? 'hover:border-primary/40 active:scale-[0.98]' : ''}`}>
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
    </div>
  );
}

export default function Review() {
  const { progress, updateProgress } = useUserProgress();
  const dueIds = useMemo(() => getDueTermIds(), []);
  const sessionIds = dueIds.slice(0, 10); // max 10 per session

  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState([]);
  const [done, setDone] = useState(false);

  const term = getTermById(sessionIds[idx]);

  function handleResult(correct) {
    if (correct) markCorrect(sessionIds[idx]);
    else markWrong(sessionIds[idx]);
    const newResults = [...results, correct];
    if (idx + 1 < sessionIds.length) {
      setResults(newResults);
      setIdx(i => i + 1);
    } else {
      setResults(newResults);
      const xpEarned = newResults.filter(Boolean).length * 5;
      if (xpEarned > 0) {
        updateProgress({ xp: (progress?.xp ?? 0) + xpEarned });
        toast.success(`+${xpEarned} XP from review!`);
      }
      setDone(true);
    }
  }

  if (dueIds.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-6 max-w-lg mx-auto">
        <span className="text-6xl mb-4">✅</span>
        <h1 className="text-2xl font-extrabold text-foreground mb-2">All caught up!</h1>
        <p className="text-muted-foreground mb-6">No terms due for review right now. Keep learning to build your review queue.</p>
        <Link to="/play">
          <button className="h-14 px-8 rounded-2xl bg-primary text-white font-extrabold">Back to Play</button>
        </Link>
      </div>
    );
  }

  if (done) {
    const correct = results.filter(Boolean).length;
    const pct = Math.round((correct / results.length) * 100);
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-6 max-w-lg mx-auto">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-full bg-gradient-to-br from-primary to-violet-600 rounded-3xl p-8 text-white mb-6 shadow-xl">
          <p className="text-5xl font-black mb-2">{correct}/{results.length}</p>
          <p className="text-2xl font-extrabold mb-1">{pct}% correct</p>
          <p className="text-white/70 text-sm">
            {pct >= 80 ? 'Great session! Terms are moving to longer intervals.' :
             pct >= 50 ? 'Keep practising — those terms will come back sooner.' :
             'Tough session. These terms will appear again tomorrow.'}
          </p>
        </motion.div>
        <p className="text-sm text-muted-foreground mb-2">
          {getDueCount() > 0 ? `${getDueCount()} terms still due` : 'No more terms due today!'}
        </p>
        <Link to="/play" className="w-full">
          <button className="w-full h-14 rounded-2xl bg-primary text-white font-extrabold">Done</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10 max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-violet-600 px-4 pt-12 pb-5 text-white">
        <Link to="/play" className="inline-flex items-center gap-1 text-white/70 text-sm font-bold mb-3">
          <ArrowLeft className="w-4 h-4" /> Play
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold">Review</h1>
            <p className="text-white/70 text-xs">Spaced repetition · {sessionIds.length} terms</p>
          </div>
          <p className="text-sm font-bold text-white/70">{idx + 1}/{sessionIds.length}</p>
        </div>
        <div className="flex gap-1 mt-3">
          {sessionIds.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
              i < idx ? (results[i] ? 'bg-emerald-400' : 'bg-rose-400') : i === idx ? 'bg-white' : 'bg-white/30'
            }`} />
          ))}
        </div>
      </div>

      <div className="pt-6">
        <AnimatePresence mode="wait">
          {term && (
            <motion.div key={term.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <ReviewCard term={term} allTerms={GLOSSARY_TERMS} onResult={handleResult} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
