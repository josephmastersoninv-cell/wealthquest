import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, Check, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { SCENARIOS } from '@/lib/scenarioData';
import { useUserProgress } from '@/lib/useUserProgress';
import { toast } from 'sonner';

const COMPLETED_KEY = 'wealthquest_scenarios_done';
function getCompleted() {
  try { return JSON.parse(localStorage.getItem(COMPLETED_KEY) ?? '{}'); } catch { return {}; }
}
function markCompleted(id, xp) {
  const d = getCompleted();
  d[id] = { xp, ts: Date.now() };
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(d));
}

// ── Scenario Runner ────────────────────────────────────────────────────────────
function ScenarioRunner({ scenario, onDone }) {
  const [phase, setPhase] = useState('root'); // root | followup | results
  const [rootChoice, setRootChoice] = useState(null);
  const [followChoice, setFollowChoice] = useState(null);
  const totalXp = (rootChoice?.followUp?.xp ?? 0) + (followChoice?.xp ?? 0);

  function pickRoot(choice) {
    setRootChoice(choice);
    setPhase('followup');
  }

  function pickFollow(choice) {
    setFollowChoice(choice);
    setPhase('results');
  }

  return (
    <div className="flex flex-col min-h-screen bg-background max-w-lg mx-auto pb-10">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 px-4 pt-12 pb-6 text-white">
        <button onClick={onDone} className="inline-flex items-center gap-1 text-white/70 text-sm font-bold mb-4">
          <ArrowLeft className="w-4 h-4" /> Scenarios
        </button>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{scenario.emoji}</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide opacity-70">Financial Scenario</p>
            <h1 className="text-xl font-extrabold">{scenario.title}</h1>
          </div>
        </div>
      </div>

      <div className="px-4 pt-6 flex-1">
        <AnimatePresence mode="wait">
          {/* Root question */}
          {phase === 'root' && (
            <motion.div key="root" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="bg-card border border-border rounded-2xl p-5 mb-5">
                <p className="font-bold text-foreground leading-relaxed">{scenario.setup}</p>
              </div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground mb-3">What do you do?</p>
              <div className="space-y-3">
                {scenario.choices.map(choice => (
                  <button key={choice.id} onClick={() => pickRoot(choice)}
                    className="w-full text-left p-4 bg-card border-2 border-border rounded-2xl font-semibold text-sm text-foreground hover:border-primary/40 active:scale-[0.98] transition-all">
                    {choice.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Follow-up */}
          {phase === 'followup' && rootChoice && (
            <motion.div key="followup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className={`rounded-2xl p-5 mb-5 border-2 ${rootChoice.followUp.correct ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700'}`}>
                <div className="flex items-start gap-2 mb-2">
                  {rootChoice.followUp.correct
                    ? <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    : <X className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />}
                  <p className={`text-sm font-semibold leading-relaxed ${rootChoice.followUp.correct ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}`}>
                    {rootChoice.followUp.outcome}
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-current/20">
                  <p className={`text-xs font-extrabold uppercase tracking-wide mb-1 ${rootChoice.followUp.correct ? 'text-emerald-600' : 'text-rose-500'}`}>
                    Key lesson
                  </p>
                  <p className={`text-xs italic font-semibold ${rootChoice.followUp.correct ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                    "{rootChoice.followUp.lesson}"
                  </p>
                </div>
              </div>

              <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground mb-3">Now what?</p>
              <div className="space-y-3">
                {rootChoice.followUp.followChoices.map(fc => (
                  <button key={fc.id} onClick={() => pickFollow(fc)}
                    className="w-full text-left p-4 bg-card border-2 border-border rounded-2xl font-semibold text-sm text-foreground hover:border-primary/40 active:scale-[0.98] transition-all">
                    {fc.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Results */}
          {phase === 'results' && rootChoice && followChoice && (
            <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className={`rounded-2xl p-5 mb-4 border-2 ${followChoice.correct ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700'}`}>
                <div className="flex items-start gap-2">
                  {followChoice.correct
                    ? <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    : <X className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />}
                  <p className={`text-sm font-semibold leading-relaxed ${followChoice.correct ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}`}>
                    {followChoice.outcome}
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5 mb-6">
                <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground mb-3">Scenario complete</p>
                <div className="flex gap-3">
                  <div className="flex-1 bg-primary/10 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-primary">+{totalXp}</p>
                    <p className="text-xs text-muted-foreground font-bold">XP earned</p>
                  </div>
                  <div className="flex-1 bg-muted rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-foreground">
                      {rootChoice.followUp.correct && followChoice.correct ? '⭐⭐' : rootChoice.followUp.correct || followChoice.correct ? '⭐' : '📖'}
                    </p>
                    <p className="text-xs text-muted-foreground font-bold">Performance</p>
                  </div>
                </div>
              </div>

              <button onClick={() => onDone(totalXp)}
                className="w-full h-14 rounded-2xl bg-primary text-white font-extrabold text-base active:scale-95 transition-all">
                Continue →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Scenario List ─────────────────────────────────────────────────────────────
export default function Scenarios() {
  const { progress, updateProgress } = useUserProgress();
  const [active, setActive] = useState(null);
  const completed = getCompleted();

  function handleDone(xp) {
    if (active && xp > 0) {
      markCompleted(active.id, xp);
      updateProgress({
        xp: (progress?.xp ?? 0) + xp,
        coins: (progress?.coins ?? 0) + 15,
      });
      toast.success(`+${xp} XP earned!`);
    }
    setActive(null);
  }

  if (active) return <ScenarioRunner scenario={active} onDone={handleDone} />;

  return (
    <div className="min-h-screen bg-background pb-28 max-w-lg mx-auto">
      <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 px-4 pt-12 pb-6 text-white">
        <Link to="/play" className="inline-flex items-center gap-1 text-white/70 text-sm font-bold mb-4">
          <ArrowLeft className="w-4 h-4" /> Play
        </Link>
        <h1 className="text-2xl font-extrabold">Scenarios</h1>
        <p className="text-white/70 text-sm mt-1">Real financial decisions. What would you do?</p>
      </div>

      <div className="px-4 pt-5 space-y-3">
        {SCENARIOS.map(sc => {
          const done = !!completed[sc.id];
          return (
            <button key={sc.id} onClick={() => setActive(sc)}
              className="w-full text-left bg-card border border-border rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-all hover:border-primary/30">
              <span className="text-3xl shrink-0">{sc.emoji}</span>
              <div className="flex-1">
                <p className="font-extrabold text-sm text-foreground">{sc.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{sc.setup}</p>
                {done && (
                  <p className="text-[10px] font-bold text-emerald-500 mt-1">✓ Completed · +{completed[sc.id].xp} XP</p>
                )}
              </div>
              <div className="shrink-0">
                {done
                  ? <Check className="w-5 h-5 text-emerald-500" />
                  : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>
          );
        })}

        <div className="bg-muted rounded-2xl p-4 text-center">
          <p className="text-xs font-bold text-muted-foreground">More scenarios unlock as you level up</p>
          <p className="text-xs text-muted-foreground mt-1">{Object.keys(completed).length}/{SCENARIOS.length} completed</p>
        </div>
      </div>
    </div>
  );
}
