import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLevelForXp } from '@/lib/levelData';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import Confetti from '@/components/Confetti';

export default function LevelUpModal({ progress }) {
  const [show, setShow] = useState(false);
  const [newLevel, setNewLevel] = useState(null);
  const prevLevel = useRef(null);

  useEffect(() => {
    if (!progress) return;
    const current = getLevelForXp(progress.xp ?? 0);
    if (prevLevel.current !== null && current.level > prevLevel.current) {
      setNewLevel(current);
      setShow(true);
    }
    prevLevel.current = current.level;
  }, [progress?.xp]);

  return (
    <>
      <Confetti active={show} onDone={() => {}} />
    <AnimatePresence>
      {show && newLevel && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setShow(false)}
        >
          <motion.div
            initial={{ scale: 0.8, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 40 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl ${newLevel.bg} border-4 border-white`}
          >
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Level Up!</p>
            <p className={`text-4xl font-black mb-2 ${newLevel.color}`}>Level {newLevel.level}</p>
            <p className={`text-xl font-extrabold mb-6 ${newLevel.color}`}>{newLevel.title}</p>
            <div className={`flex items-center justify-center gap-2 mb-6 ${newLevel.color}`}>
              <Star className="w-4 h-4" />
              <span className="text-sm font-bold">You're progressing fast!</span>
              <Star className="w-4 h-4" />
            </div>
            <Button onClick={() => setShow(false)} className="w-full h-12 font-extrabold rounded-2xl">
              Keep Going!
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
