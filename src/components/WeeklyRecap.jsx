import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { getWeeklyRecap, shouldShowRecap, markRecapSeen } from '@/lib/weeklyRecap';
import TickingNumber from '@/components/TickingNumber';

export default function WeeklyRecap({ progress }) {
  const recap = getWeeklyRecap(progress);
  const [visible, setVisible] = useState(() => !!recap && shouldShowRecap());

  if (!recap) return null;

  function dismiss() {
    markRecapSeen();
    setVisible(false);
  }

  const topPct = Math.max(5, Math.round(100 - (recap.xpGained / 20)));

  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          className="mx-4 mb-4 rounded-2xl overflow-hidden border border-primary/30 bg-gradient-to-br from-primary/10 to-violet-500/10">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <p className="font-extrabold text-sm text-foreground">Your week in review</p>
            </div>
            <button onClick={dismiss} className="text-muted-foreground active:scale-90">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 px-4 pb-4">
            {[
              { label: 'XP earned', value: recap.xpGained, prefix: '+', color: 'text-primary' },
              { label: 'Lessons done', value: recap.lessonsCompleted, color: 'text-emerald-500' },
              { label: 'Days active', value: recap.daysActive, suffix: '/7', color: 'text-amber-500' },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
                <p className={`text-xl font-black ${s.color}`}>
                  <TickingNumber value={s.value} prefix={s.prefix ?? ''} suffix={s.suffix ?? ''} />
                </p>
                <p className="text-[10px] text-muted-foreground font-bold mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {recap.xpGained > 0 && (
            <div className="px-4 pb-4">
              <p className="text-xs text-center text-muted-foreground font-semibold">
                🏆 You're ahead of <span className="font-extrabold text-foreground">{topPct}%</span> of learners this week
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
