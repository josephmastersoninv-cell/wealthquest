import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLevelForXp } from '@/lib/levelData';
import Confetti from '@/components/Confetti';

const LEVEL_UNLOCKS = {
  2:  '🛒 Shop unlocked',
  3:  '⚔️ Boss Battles unlocked',
  4:  '📊 Portfolio Simulator unlocked',
  5:  '🏆 Leaderboard unlocked',
  6:  '💎 Daily XP Multiplier activated',
  7:  '🗝️ Bonus chest slots unlocked',
  8:  '⚡ XP Boosts cost 50% less',
  9:  '🌟 Legendary achievement tier unlocked',
  10: '🐺 Wolf of Wall St. — You made it.',
};

export default function LevelUpModal({ progress }) {
  const [show, setShow] = useState(false);
  const [newLevel, setNewLevel] = useState(null);
  const [phase, setPhase] = useState('number'); // 'number' | 'title' | 'unlock'
  const prevLevel = useRef(null);

  useEffect(() => {
    if (!progress) return;
    const current = getLevelForXp(progress.xp ?? 0);
    if (prevLevel.current !== null && current.level > prevLevel.current) {
      setNewLevel(current);
      setPhase('number');
      setShow(true);
    }
    prevLevel.current = current.level;
  }, [progress?.xp]);

  // Auto-advance phases
  useEffect(() => {
    if (!show) return;
    const t1 = setTimeout(() => setPhase('title'), 800);
    const t2 = setTimeout(() => setPhase('unlock'), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [show]);

  function dismiss() { setShow(false); }

  if (!show || !newLevel) return null;

  return (
    <>
      <Confetti active={show} onDone={() => {}} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
        style={{ background: 'radial-gradient(ellipse at center, #1e1040 0%, #000 100%)' }}
        onClick={dismiss}>

        {/* Pulsing ring */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [0.5, 1.4, 1.1], opacity: [0, 0.4, 0] }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute w-64 h-64 rounded-full border-4 border-amber-400"
        />

        {/* Level number burst */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="flex flex-col items-center gap-2 mb-6">
          <p className="text-amber-400 font-extrabold text-sm uppercase tracking-[0.3em]">Level Up!</p>
          <motion.p
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            className="text-white font-black"
            style={{ fontSize: '6rem', lineHeight: 1, textShadow: '0 0 60px #f59e0b' }}>
            {newLevel.level}
          </motion.p>
        </motion.div>

        {/* Title reveal */}
        <AnimatePresence>
          {phase !== 'number' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
              <p className="text-3xl mb-2">{newLevel.emoji}</p>
              <p className="text-white font-extrabold text-2xl">{newLevel.title}</p>
              <p className="text-white/50 text-sm mt-1">New rank achieved</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unlock reveal */}
        <AnimatePresence>
          {phase === 'unlock' && LEVEL_UNLOCKS[newLevel.level] && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white/10 border border-white/20 rounded-2xl px-6 py-3 mb-8 text-center">
              <p className="text-white/60 text-xs font-bold uppercase tracking-wide mb-1">Unlocked</p>
              <p className="text-white font-extrabold text-sm">{LEVEL_UNLOCKS[newLevel.level]}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tap to continue */}
        <AnimatePresence>
          {phase === 'unlock' && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={dismiss}
              className="bg-gradient-to-r from-amber-400 to-orange-500 text-white font-extrabold py-4 px-10 rounded-2xl text-base shadow-2xl active:scale-95 transition-all">
              Keep Going! 🚀
            </motion.button>
          )}
        </AnimatePresence>

        {/* Stars decoration */}
        {[...Array(8)].map((_, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], x: Math.cos(i * 45 * Math.PI / 180) * 120, y: Math.sin(i * 45 * Math.PI / 180) * 120 }}
            transition={{ delay: 0.3 + i * 0.05, duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
            className="absolute text-amber-400 text-lg pointer-events-none">
            ✦
          </motion.div>
        ))}
      </motion.div>
    </>
  );
}
