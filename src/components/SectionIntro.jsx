import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';

const SECTION_INTROS = {
  portfolio: {
    title: 'Welcome to the Market',
    slides: [
      { emoji: '💰', heading: 'You have $10,000', body: 'This is virtual cash — no real money involved. Use it to buy stocks, ETFs, and crypto just like a real investor.' },
      { emoji: '📈', heading: 'Real prices, live', body: 'All prices are pulled from real markets in real time. Watch them move and decide when to buy and sell.' },
      { emoji: '🏆', heading: 'Climb the leaderboard', body: 'Your rank is based on total portfolio value. Grow your money to beat the ghost players and reach the top.' },
      { emoji: '⭐', heading: 'Earn your Investor Rating', body: 'Your portfolio score (0–100) rewards diversification, performance, and consistency. Aim for grade S.' },
    ],
    key: 'wq_intro_portfolio',
  },
  boss: {
    title: 'Boss Battle',
    slides: [
      { emoji: '⚔️', heading: 'It\'s a fight!', body: 'A Boss Battle is a 60-second quiz blitz. Answer 10 financial questions as fast as you can.' },
      { emoji: '🎯', heading: 'Score 7 out of 10', body: 'You need 7 correct answers to defeat the boss and claim the XP + coin reward.' },
      { emoji: '🔥', heading: 'Build your combo', body: 'Answering correctly without mistakes builds a combo multiplier. More combos = more XP.' },
      { emoji: '👑', heading: 'Win big', body: 'Beat the boss for +200 XP and +100 coins. Fail and you can try again anytime.' },
    ],
    key: 'wq_intro_boss',
  },
  play: {
    title: 'How to Play',
    slides: [
      { emoji: '📅', heading: 'Daily Challenge', body: 'Every day there\'s a fresh 5-question challenge. Complete it for +50 XP and keep your streak alive.' },
      { emoji: '❤️', heading: 'Hearts system', body: 'You have 5 hearts. Each wrong answer in Practice mode costs one heart. They refill daily.' },
      { emoji: '🧠', heading: 'Scenarios', body: 'Branching financial decision trees. Make choices and see how they play out in real life.' },
      { emoji: '🔄', heading: 'Spaced Review', body: 'Terms you\'ve seen before come back at the right time so they stick in long-term memory.' },
    ],
    key: 'wq_intro_play',
  },
  learn: {
    title: 'How Learning Works',
    slides: [
      { emoji: '🗺️', heading: 'Follow the path', body: 'Lessons are organised into units. Complete lessons in order to unlock the next ones.' },
      { emoji: '⚡', heading: 'Earn XP', body: 'Every lesson, quiz, and challenge earns you XP. XP increases your level and unlocks rewards.' },
      { emoji: '🔥', heading: 'Keep your streak', body: 'Complete at least one activity every day to keep your streak. Higher streaks give XP multipliers.' },
      { emoji: '⚔️', heading: 'Beat the Boss', body: 'Finish all lessons in a unit to unlock the Boss Battle — a 60-second high-stakes quiz.' },
    ],
    key: 'wq_intro_learn',
  },
};

export function useSectionIntro(section, skipForExperienced = false) {
  const key = SECTION_INTROS[section]?.key;
  const [show, setShow] = useState(() => key ? !localStorage.getItem(key) : false);

  // Experienced users (account already has progress) never see intros again,
  // even on a fresh device — their cloud progress proves they know the ropes.
  React.useEffect(() => {
    if (skipForExperienced && show && key) {
      localStorage.setItem(key, '1');
      setShow(false);
    }
  }, [skipForExperienced, show, key]);

  function dismiss() {
    if (key) localStorage.setItem(key, '1');
    setShow(false);
  }

  return { show: show && !skipForExperienced, dismiss };
}

export default function SectionIntro({ section, onDismiss }) {
  const config = SECTION_INTROS[section];
  const [slide, setSlide] = useState(0);
  if (!config) return null;

  const isLast = slide === config.slides.length - 1;
  const current = config.slides[slide];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center p-4">
      <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        className="w-full max-w-sm bg-card rounded-3xl overflow-hidden shadow-2xl">

        {/* Progress dots */}
        <div className="flex gap-1.5 px-6 pt-5 pb-2">
          {config.slides.map((_, i) => (
            <div key={i} className={`h-1 rounded-full flex-1 transition-all duration-300 ${i <= slide ? 'bg-primary' : 'bg-border'}`} />
          ))}
          <button onClick={onDismiss} className="ml-2 text-muted-foreground shrink-0"><X className="w-4 h-4" /></button>
        </div>

        {/* Slide content */}
        <AnimatePresence mode="wait">
          <motion.div key={slide} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="px-6 pt-4 pb-6 text-center">
            <p className="text-6xl mb-4">{current.emoji}</p>
            <p className="text-xl font-extrabold text-foreground mb-2">{current.heading}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{current.body}</p>
          </motion.div>
        </AnimatePresence>

        {/* Buttons */}
        <div className="px-6 pb-6 flex gap-3">
          {slide > 0 && (
            <button onClick={() => setSlide(s => s - 1)}
              className="flex-1 py-3 rounded-2xl bg-muted text-foreground font-extrabold text-sm active:scale-95">
              Back
            </button>
          )}
          <button onClick={() => isLast ? onDismiss() : setSlide(s => s + 1)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm active:scale-95">
            {isLast ? "Let's Go! 🚀" : 'Next'}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
