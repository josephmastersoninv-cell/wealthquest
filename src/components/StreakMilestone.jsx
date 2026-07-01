import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from '@/components/Confetti';

const MILESTONES = [3, 7, 14, 30, 60, 100, 365];

function getMilestoneData(days) {
  if (days >= 365) return { emoji: '👑', label: 'One Year!',    color: 'from-yellow-400 to-amber-600',   message: 'Legendary dedication. You are a Finance Master.' };
  if (days >= 100) return { emoji: '💎', label: '100 Days!',   color: 'from-violet-400 to-fuchsia-600', message: 'Diamond streak! You\'re in elite company.' };
  if (days >= 60)  return { emoji: '🔥', label: '60 Day Blaze!',color: 'from-orange-400 to-rose-600',   message: 'Two months straight. Truly unstoppable.' };
  if (days >= 30)  return { emoji: '🏆', label: '30 Days!',    color: 'from-amber-400 to-yellow-600',   message: 'A full month! Your habit is now automatic.' };
  if (days >= 14)  return { emoji: '⚡', label: '2 Week Streak!',color: 'from-blue-400 to-violet-600',  message: 'Two weeks of consistency. Real growth starts here.' };
  if (days >= 7)   return { emoji: '🌟', label: '7 Day Streak!',color: 'from-emerald-400 to-teal-600', message: 'One full week! Studies show habits form after 21 days.' };
  if (days >= 3)   return { emoji: '🔥', label: '3 Day Streak!',color: 'from-primary to-violet-600',    message: 'You\'re building momentum. Keep it going!' };
  return null;
}

const SEEN_KEY = 'wealthquest_streak_seen';

function getSeenMilestones() {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]'); } catch { return []; }
}
function markSeen(days) {
  const seen = getSeenMilestones();
  if (!seen.includes(days)) { seen.push(days); localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); }
}

export default function StreakMilestone({ streak }) {
  const [show, setShow] = useState(false);
  const [data, setData] = useState(null);
  const prevStreak = useRef(null);

  useEffect(() => {
    if (streak == null) return;
    const seen = getSeenMilestones();
    const hit = MILESTONES.find(m => streak >= m && !seen.includes(m) && (prevStreak.current ?? 0) < m);
    if (hit) {
      const d = getMilestoneData(hit);
      if (d) { setData(d); setShow(true); markSeen(hit); }
    }
    prevStreak.current = streak;
  }, [streak]);

  function dismiss() { setShow(false); }

  return (
    <AnimatePresence>
      {show && data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
          onClick={dismiss}
        >
          <Confetti active={show} onDone={() => {}} />
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 180 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm text-center"
          >
            <div className={`bg-gradient-to-br ${data.color} rounded-3xl p-8 shadow-2xl`}>
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [-5, 5, -5, 5, 0] }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-7xl mb-4"
              >
                {data.emoji}
              </motion.div>
              <p className="text-white/70 text-xs font-extrabold uppercase tracking-widest mb-1">Streak Milestone</p>
              <p className="text-white text-3xl font-black mb-3">{data.label}</p>
              <p className="text-white/90 text-sm leading-relaxed mb-6">{data.message}</p>
              <button
                onClick={dismiss}
                className="w-full h-12 rounded-2xl bg-white/20 border border-white/30 text-white font-extrabold backdrop-blur active:scale-95 transition-all"
              >
                Keep the streak going! 🔥
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
