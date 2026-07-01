import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AchievementToast({ achievements, onDismiss }) {
  useEffect(() => {
    if (achievements.length > 0) {
      const t = setTimeout(onDismiss, 4000);
      return () => clearTimeout(t);
    }
  }, [achievements, onDismiss]);

  return (
    <AnimatePresence>
      {achievements.map((a) => (
        <motion.div
          key={a.id}
          initial={{ opacity: 0, y: 80, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.9 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background rounded-2xl px-5 py-4 shadow-2xl flex items-center gap-3 max-w-xs w-full"
        >
          <span className="text-3xl">{a.icon}</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide opacity-60">Achievement Unlocked!</p>
            <p className="text-sm font-extrabold">{a.title}</p>
            <p className="text-xs opacity-70">{a.description}</p>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
