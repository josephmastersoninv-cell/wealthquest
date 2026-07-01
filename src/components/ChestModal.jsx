import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, DollarSign, X } from 'lucide-react';
import { openChest } from '@/lib/chestData';
import Confetti from '@/components/Confetti';

export default function ChestModal({ onClose, onReward }) {
  const [phase, setPhase] = useState('closed'); // closed | opening | revealed
  const [reward, setReward] = useState(null);
  const [confetti, setConfetti] = useState(false);

  function handleOpen() {
    if (phase !== 'closed') return;
    setPhase('opening');
    const r = openChest();
    if (!r) { onClose(); return; }
    setTimeout(() => {
      setReward(r);
      setPhase('revealed');
      if (r.label === 'Epic' || r.label === 'Legendary') setConfetti(true);
      onReward(r);
    }, 1200);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
      onClick={e => phase === 'revealed' && e.target === e.currentTarget && onClose()}
    >
      <Confetti active={confetti} onDone={() => setConfetti(false)} />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="w-full max-w-sm bg-card rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <AnimatePresence mode="wait">
          {phase === 'closed' && (
            <motion.div key="closed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
              <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-3">Reward Chest</p>
              <motion.div
                className="text-8xl mb-6 cursor-pointer select-none"
                animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                onClick={handleOpen}
              >
                📦
              </motion.div>
              <p className="text-foreground font-extrabold text-lg mb-2">You earned a chest!</p>
              <p className="text-muted-foreground text-sm mb-6">Tap to reveal your reward</p>
              <button
                onClick={handleOpen}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-extrabold text-base shadow-lg active:scale-95 transition-all"
              >
                Open Chest ✨
              </button>
            </motion.div>
          )}

          {phase === 'opening' && (
            <motion.div key="opening" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <motion.div
                className="text-8xl mb-6"
                animate={{ rotate: [-5, 5, -5, 5, 0], scale: [1, 1.2, 0.9, 1.3, 0] }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
              >
                📦
              </motion.div>
              <p className="text-muted-foreground font-bold">Opening...</p>
            </motion.div>
          )}

          {phase === 'revealed' && reward && (
            <motion.div key="revealed" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
              <div className={`w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br ${reward.color} flex items-center justify-center text-5xl shadow-xl mb-4`}>
                {reward.emoji}
              </div>
              <p className={`text-xs font-extrabold uppercase tracking-widest mb-1 bg-gradient-to-r ${reward.color} bg-clip-text text-transparent`}>
                {reward.label} Chest
              </p>
              <p className="text-foreground font-extrabold text-xl mb-5">You got rewards!</p>

              <div className="flex gap-3 mb-6">
                <div className="flex-1 bg-primary/10 rounded-2xl p-4">
                  <Zap className="w-6 h-6 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-black text-primary">+{reward.xp}</p>
                  <p className="text-xs text-muted-foreground font-bold">XP</p>
                </div>
                <div className="flex-1 bg-emerald-500/10 rounded-2xl p-4">
                  <DollarSign className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                  <p className="text-2xl font-black text-emerald-500">+{reward.coins}</p>
                  <p className="text-xs text-muted-foreground font-bold">Coins</p>
                </div>
              </div>

              <button onClick={onClose}
                className="w-full h-12 rounded-2xl bg-primary text-white font-extrabold active:scale-95 transition-all">
                Awesome! 🎉
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
