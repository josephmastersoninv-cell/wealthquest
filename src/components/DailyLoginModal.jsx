import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import { LOGIN_REWARDS, getCurrentLoginDay, claimLoginReward } from '@/lib/dailyLoginReward';
import Confetti from '@/components/Confetti';

export default function DailyLoginModal({ onClaim, onClose }) {
  const [claimed, setClaimed] = useState(false);
  const [reward, setReward] = useState(null);
  const currentDay = getCurrentLoginDay();

  function handleClaim() {
    const r = claimLoginReward();
    setReward(r);
    setClaimed(true);
    onClaim?.(r);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
      <Confetti active={claimed} onDone={() => {}} />

      <motion.div initial={{ scale: 0.85, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 40 }}
        className="w-full max-w-sm bg-card rounded-3xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 px-6 pt-8 pb-6 text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <p className="text-4xl mb-2">🎁</p>
          <p className="text-white font-extrabold text-xl">Daily Reward</p>
          <p className="text-white/80 text-sm mt-1">Come back every day for bigger rewards!</p>
        </div>

        {/* 7-day calendar */}
        <div className="px-5 pt-5">
          <div className="grid grid-cols-7 gap-1.5 mb-5">
            {LOGIN_REWARDS.map((r) => {
              const isPast = r.day < currentDay;
              const isCurrent = r.day === currentDay;
              const isFuture = r.day > currentDay;
              return (
                <div key={r.day} className={`flex flex-col items-center gap-1 rounded-xl py-2 px-1 border-2 transition-all ${
                  isCurrent && !claimed ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/30 scale-105' :
                  isPast || (isCurrent && claimed) ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' :
                  'border-border bg-muted/50 opacity-50'
                }`}>
                  <span className="text-base">{isPast || (isCurrent && claimed) ? '✅' : r.special ? '🌟' : r.bonus ? '🎁' : '💰'}</span>
                  <p className="text-[9px] font-extrabold text-muted-foreground uppercase">{r.label}</p>
                  {isCurrent && !claimed && (
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Current reward preview */}
          <AnimatePresence mode="wait">
            {!claimed ? (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-muted rounded-2xl p-4 mb-4">
                  <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide mb-2">Today's Reward (Day {currentDay})</p>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2 flex-1">
                      <div className="flex items-center gap-1.5 bg-primary/10 rounded-xl px-3 py-2">
                        <Zap className="w-3.5 h-3.5 text-primary" />
                        <span className="font-extrabold text-sm text-primary">+{LOGIN_REWARDS[currentDay - 1].xp} XP</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-amber-500/10 rounded-xl px-3 py-2">
                        <span className="text-sm">💰</span>
                        <span className="font-extrabold text-sm text-amber-600 dark:text-amber-400">+{LOGIN_REWARDS[currentDay - 1].coins}</span>
                      </div>
                    </div>
                    {LOGIN_REWARDS[currentDay - 1].bonus && (
                      <span className="text-xs font-bold text-foreground bg-card border border-border rounded-xl px-2 py-1">
                        {LOGIN_REWARDS[currentDay - 1].bonus}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={handleClaim}
                  className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-extrabold py-4 rounded-2xl text-base active:scale-[0.98] transition-all mb-5 shadow-lg">
                  Claim Reward 🎉
                </button>
              </motion.div>
            ) : (
              <motion.div key="claimed" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center pb-6">
                <p className="text-4xl mb-2">🎊</p>
                <p className="font-extrabold text-foreground text-lg mb-1">Reward Claimed!</p>
                <p className="text-muted-foreground text-sm mb-1">+{reward?.xp} XP · +{reward?.coins} coins</p>
                {reward?.bonus && <p className="text-amber-500 font-bold text-sm">{reward.bonus} added!</p>}
                <button onClick={onClose}
                  className="mt-4 bg-primary text-primary-foreground font-extrabold py-3 px-8 rounded-2xl active:scale-95">
                  Let's Go!
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
