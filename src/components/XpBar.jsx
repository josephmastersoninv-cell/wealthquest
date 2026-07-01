import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getLevelForXp, getXpProgress } from '@/lib/levelData';

export default function XpBar({ xp = 0, showLabel = true, compact = false }) {
  const { current, pct, xpInLevel, xpNeeded } = getXpProgress(xp);
  const prevXpRef = useRef(xp);
  const [animPct, setAnimPct] = useState(pct);

  useEffect(() => {
    setAnimPct(pct);
    prevXpRef.current = xp;
  }, [xp, pct]);

  if (compact) return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-xs font-extrabold text-primary shrink-0">Lv.{current.level}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <motion.div className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full"
          initial={{ width: 0 }} animate={{ width: `${animPct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
      </div>
      <span className="text-[10px] font-bold text-muted-foreground shrink-0">{xpInLevel}/{xpNeeded}</span>
    </div>
  );

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-xs font-extrabold text-foreground">{current.title} · Level {current.level}</span>
          {current.maxXp !== Infinity && (
            <span className="text-[10px] font-bold text-muted-foreground">{xpInLevel} / {xpNeeded} XP</span>
          )}
        </div>
      )}
      <div className="h-3 bg-muted rounded-full overflow-hidden relative">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary via-violet-500 to-fuchsia-500 relative"
          initial={{ width: 0 }}
          animate={{ width: `${animPct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}>
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-full" />
        </motion.div>
      </div>
    </div>
  );
}
