import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

const MILESTONE_KEY = 'wealthquest_milestones_hit';

export const MILESTONES = [
  { value: 11000, label: 'First Profit!',      emoji: '🌱', msg: 'Your portfolio is up $1,000. The journey begins.' },
  { value: 12500, label: '$12,500 Portfolio',   emoji: '📈', msg: "You've grown your portfolio by 25%. Solid investing." },
  { value: 15000, label: '$15k Club',           emoji: '💸', msg: "Halfway to doubling your money. Keep compounding." },
  { value: 20000, label: 'Portfolio Doubled!',  emoji: '🎯', msg: "You doubled your starting $10k. That's real alpha." },
  { value: 25000, label: '$25k Milestone',      emoji: '🚀', msg: 'Your portfolio is worth $25,000. Top 10% territory.' },
  { value: 50000, label: '$50k Portfolio',      emoji: '👑', msg: "Five-figure gains. You're playing a different game." },
  { value: 100000, label: 'Six Figures!',       emoji: '💎', msg: "Six-figure portfolio. Legend status unlocked." },
];

export function getHitMilestones() {
  try { return JSON.parse(localStorage.getItem(MILESTONE_KEY) ?? '[]'); } catch { return []; }
}

export function checkMilestone(totalValue) {
  const hit = getHitMilestones();
  const next = MILESTONES.find(m => totalValue >= m.value && !hit.includes(m.value));
  if (next) {
    localStorage.setItem(MILESTONE_KEY, JSON.stringify([...hit, next.value]));
    return next;
  }
  return null;
}

export default function MilestoneModal({ milestone, onClose, onShare }) {
  if (!milestone) return null;

  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="bg-card rounded-3xl p-8 w-full max-w-xs text-center shadow-2xl"
        onClick={e => e.stopPropagation()}>

        <motion.div animate={{ rotate: [0, -10, 10, -10, 10, 0] }} transition={{ duration: 0.5, delay: 0.3 }}
          className="text-7xl mb-4">{milestone.emoji}</motion.div>

        <div className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-400 rounded-full px-3 py-1 text-xs font-extrabold mb-3">
          <TrendingUp className="w-3.5 h-3.5" />
          MILESTONE REACHED
        </div>

        <h2 className="text-2xl font-extrabold text-foreground mb-2">{milestone.label}</h2>
        <p className="text-sm text-muted-foreground mb-6">{milestone.msg}</p>

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 bg-muted text-muted-foreground font-extrabold py-3 rounded-2xl text-sm active:scale-95">
            Nice!
          </button>
          <button onClick={() => { onShare(milestone); onClose(); }}
            className="flex-1 bg-emerald-500 text-white font-extrabold py-3 rounded-2xl text-sm active:scale-95">
            Share 🔗
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
