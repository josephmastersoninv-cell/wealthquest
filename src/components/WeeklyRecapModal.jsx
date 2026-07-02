import React from 'react';
import { motion } from 'framer-motion';
import { Zap, BookOpen, Flame, TrendingUp, X } from 'lucide-react';
import { markRecapSeen } from '@/lib/weeklyRecap';

export default function WeeklyRecapModal({ recap, portfolioGain, onClose }) {
  if (!recap) return null;

  function handleClose() {
    markRecapSeen();
    onClose();
  }

  const stats = [
    { icon: Zap,      color: 'text-primary',    bg: 'bg-primary/10',   label: 'XP Earned',       value: `+${recap.xpGained}` },
    { icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Lessons Done',  value: recap.lessonsCompleted },
    { icon: Flame,    color: 'text-amber-400',   bg: 'bg-amber-500/10', label: 'Days Active',     value: `${recap.daysActive}/7` },
    portfolioGain != null
      ? { icon: TrendingUp, color: portfolioGain >= 0 ? 'text-emerald-400' : 'text-rose-400', bg: portfolioGain >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10', label: 'Portfolio', value: `${portfolioGain >= 0 ? '+' : ''}${portfolioGain.toFixed(1)}%` }
      : null,
  ].filter(Boolean);

  const msgs = [];
  if (recap.xpGained >= 200) msgs.push('🔥 Incredible week — over 200 XP!');
  else if (recap.xpGained >= 100) msgs.push('💪 Solid week — keep the momentum!');
  else if (recap.xpGained > 0) msgs.push('📚 Good start — try to do a little more this week!');
  else msgs.push('👀 Quiet week — even 5 mins a day compounds fast!');
  if (recap.daysActive >= 5) msgs.push('Your consistency is your superpower.');
  if (portfolioGain != null && portfolioGain > 5) msgs.push(`Your portfolio gained ${portfolioGain.toFixed(1)}% — nice moves!`);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card rounded-3xl p-6 w-full max-w-sm shadow-2xl">

        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Week in Review</p>
            <h2 className="text-xl font-extrabold text-foreground">Your recap 📊</h2>
          </div>
          <button onClick={handleClose} className="p-2 rounded-xl bg-muted text-muted-foreground active:scale-95">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-5">
          {stats.map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground font-bold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-muted rounded-2xl p-4 mb-5">
          {msgs.map((m, i) => <p key={i} className={`text-sm ${i === 0 ? 'font-extrabold text-foreground' : 'text-muted-foreground mt-1'}`}>{m}</p>)}
        </div>

        <button onClick={handleClose}
          className="w-full bg-primary text-primary-foreground font-extrabold py-3.5 rounded-2xl text-sm active:scale-[0.98]">
          Start this week strong 🚀
        </button>
      </motion.div>
    </motion.div>
  );
}
