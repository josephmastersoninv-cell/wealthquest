import React from 'react';
import { motion } from 'framer-motion';
import { getGoalConfig, getTodayXp } from '@/lib/dailyGoal';

export default function DailyGoalRing({ size = 44 }) {
  const goal = getGoalConfig();
  const todayXp = getTodayXp();
  const pct = Math.min(1, todayXp / goal.xp);
  const met = pct >= 1;

  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
          className="text-muted" strokeWidth={5} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={met ? '#10b981' : '#6366f1'}
          strokeWidth={5} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute text-[11px] font-extrabold" style={{ color: met ? '#10b981' : '#6366f1' }}>
        {met ? '✓' : goal.emoji}
      </span>
    </div>
  );
}
