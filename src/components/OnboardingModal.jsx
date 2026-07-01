import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'wealthquest_onboarded';

export default function OnboardingModal() {
  const [show, setShow] = useState(() => !localStorage.getItem(STORAGE_KEY));
  const [step, setStep] = useState(0);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  };

  const steps = [
    {
      emoji: '💰',
      title: 'Welcome to WealthQuest',
      body: 'Learn 50 essential financial terms used by real investors, analysts, and economists. No jargon — plain explanations with real examples.',
    },
    {
      emoji: '📖',
      title: 'Study Flashcards',
      body: 'Flip through terms at your own pace. Mark cards as "I Know This" to track mastery and earn XP. Earn 10 XP for every new term you master.',
    },
    {
      emoji: '⚔️',
      title: 'Practice & Exam',
      body: 'Test yourself in Practice Mode anytime (5 XP per correct answer). When you\'re ready, take the Final Exam — pass at 75%+ to earn your certification.',
    },
    {
      emoji: '🏆',
      title: 'Level Up & Earn Badges',
      body: 'XP drives your level from Novice to Market Wizard. Unlock 10 achievement badges along the way. Your streak resets if you miss a day — keep coming back!',
    },
  ];

  const current = steps[step];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-6"
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="w-full max-w-sm bg-card rounded-3xl p-7 shadow-2xl border border-border"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-5xl text-center mb-4">{current.emoji}</div>
                <h2 className="text-xl font-extrabold text-foreground text-center mb-3">{current.title}</h2>
                <p className="text-sm text-muted-foreground text-center leading-relaxed mb-6">{current.body}</p>
              </motion.div>
            </AnimatePresence>

            {/* Step dots */}
            <div className="flex justify-center gap-1.5 mb-5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all ${i === step ? 'w-5 h-2 bg-primary' : 'w-2 h-2 bg-muted-foreground/30'}`}
                />
              ))}
            </div>

            {step < steps.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} className="w-full h-12 font-extrabold rounded-2xl">
                Next
              </Button>
            ) : (
              <Button onClick={dismiss} className="w-full h-12 font-extrabold rounded-2xl">
                Let's Go! 🚀
              </Button>
            )}
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)} className="w-full text-center text-xs text-muted-foreground mt-3">
                Back
              </button>
            )}
            <button onClick={dismiss} className="w-full text-center text-xs text-muted-foreground mt-2">
              Skip intro
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
