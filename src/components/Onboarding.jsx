import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check } from 'lucide-react';
import { COUNTRIES, setMyCountry } from '@/lib/countryData';

const ONBOARDING_KEY = 'wealthquest_onboarded';
const NAME_KEY       = 'wealthquest_display_name';
const AVATAR_KEY     = 'wealthquest_avatar';

const AVATARS = ['🦁', '🦊', '🐺', '🦅', '🐉', '🦋', '🐬', '🦄', '🐯', '🦉', '🐼', '🦝'];
const GOALS   = [
  { id: 'casual',  emoji: '☕', label: 'Learn casually',    desc: '10 XP/day',   xp: 10 },
  { id: 'regular', emoji: '📚', label: 'Study regularly',   desc: '30 XP/day',   xp: 30 },
  { id: 'serious', emoji: '🎯', label: 'Get serious',       desc: '60 XP/day',   xp: 60 },
  { id: 'intense', emoji: '🔥', label: 'Max out',           desc: '100 XP/day',  xp: 100 },
];

export function needsOnboarding() {
  return !localStorage.getItem(ONBOARDING_KEY);
}

export function markOnboarded() {
  localStorage.setItem(ONBOARDING_KEY, '1');
}

export default function Onboarding({ onComplete }) {
  const [step, setStep]     = useState(0);
  const [name, setName]     = useState('');
  const [avatar, setAvatar] = useState('🦁');
  const [country, setCountry] = useState(null);
  const [goal, setGoal]     = useState('regular');
  const [search, setSearch] = useState('');

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  function finish() {
    if (name.trim()) localStorage.setItem(NAME_KEY, name.trim());
    localStorage.setItem(AVATAR_KEY, avatar);
    if (country) setMyCountry(country);
    localStorage.setItem('wealthquest_daily_goal', goal);
    markOnboarded();
    onComplete({ name: name.trim(), avatar, country, goal });
  }

  const steps = [
    // 0 — Welcome
    {
      render: () => (
        <div className="flex flex-col items-center text-center px-4">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
            className="text-7xl mb-6">💰</motion.div>
          <h1 className="text-3xl font-extrabold text-foreground mb-3">Welcome to<br />Monelingo</h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            Learn investing, build a portfolio, climb the leaderboard. The financial literacy game that actually teaches you something.
          </p>
          <div className="flex flex-col gap-2 w-full text-left text-sm text-muted-foreground">
            {['📖 50+ financial terms to master', '📈 Real stock market simulator', '🏆 Compete in weekly leagues', '🌍 Represent your country'].map(f => (
              <div key={f} className="flex items-center gap-2">
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      ),
      cta: "Let's go →",
    },
    // 1 — Name
    {
      render: () => (
        <div className="flex flex-col items-center text-center px-4">
          <span className="text-5xl mb-5">👤</span>
          <h2 className="text-2xl font-extrabold text-foreground mb-2">What's your name?</h2>
          <p className="text-sm text-muted-foreground mb-6">Shown on the leaderboard</p>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your name"
            autoFocus
            maxLength={20}
            className="w-full bg-muted rounded-2xl px-5 py-4 text-foreground font-bold text-lg text-center focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground mt-3">You can always skip this</p>
        </div>
      ),
      cta: name.trim() ? `Hi, ${name.trim()}! →` : 'Skip →',
    },
    // 2 — Avatar
    {
      render: () => (
        <div className="flex flex-col items-center text-center px-4">
          <span className="text-6xl mb-2">{avatar}</span>
          <h2 className="text-2xl font-extrabold text-foreground mb-1">Pick your avatar</h2>
          <p className="text-sm text-muted-foreground mb-5">Represent yourself on the leaderboard</p>
          <div className="grid grid-cols-4 gap-3 w-full">
            {AVATARS.map(e => (
              <button key={e} onClick={() => setAvatar(e)}
                className={`h-16 rounded-2xl text-3xl flex items-center justify-center transition-all active:scale-90 ${
                  avatar === e ? 'bg-primary/20 ring-2 ring-primary scale-105' : 'bg-muted hover:bg-muted/70'
                }`}>
                {e}
              </button>
            ))}
          </div>
        </div>
      ),
      cta: 'Choose →',
    },
    // 3 — Country
    {
      render: () => (
        <div className="flex flex-col items-center px-4 w-full">
          <span className="text-5xl mb-3">🌍</span>
          <h2 className="text-2xl font-extrabold text-foreground mb-1 text-center">Where are you from?</h2>
          <p className="text-sm text-muted-foreground mb-4 text-center">Your portfolio value counts toward your country's ranking</p>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search countries..."
            className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="w-full overflow-y-auto max-h-52 space-y-1 rounded-2xl border border-border">
            {filteredCountries.map(c => (
              <button key={c.code} onClick={() => setCountry(c.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-border/50 last:border-0 transition-colors ${
                  country === c.code ? 'bg-primary/10' : 'hover:bg-muted/50'
                }`}>
                <span className="text-xl">{c.flag}</span>
                <span className={`text-sm font-bold ${country === c.code ? 'text-primary' : 'text-foreground'}`}>{c.name}</span>
                {country === c.code && <Check className="w-4 h-4 text-primary ml-auto" />}
              </button>
            ))}
          </div>
        </div>
      ),
      cta: country ? `Representing ${COUNTRIES.find(c => c.code === country)?.flag ?? ''} →` : 'Skip →',
    },
    // 4 — Daily goal
    {
      render: () => (
        <div className="flex flex-col items-center text-center px-4">
          <span className="text-5xl mb-3">🎯</span>
          <h2 className="text-2xl font-extrabold text-foreground mb-1">Set your daily goal</h2>
          <p className="text-sm text-muted-foreground mb-5">How much do you want to learn each day?</p>
          <div className="w-full space-y-2">
            {GOALS.map(g => (
              <button key={g.id} onClick={() => setGoal(g.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                  goal === g.id ? 'border-primary bg-primary/10' : 'border-border bg-card'
                }`}>
                <span className="text-2xl">{g.emoji}</span>
                <div className="flex-1">
                  <p className={`font-extrabold text-sm ${goal === g.id ? 'text-primary' : 'text-foreground'}`}>{g.label}</p>
                  <p className="text-xs text-muted-foreground">{g.desc}</p>
                </div>
                {goal === g.id && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </div>
      ),
      cta: "I'm ready! 🚀",
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 pt-12 pb-4">
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
            i === step ? 'w-6 bg-primary' : i < step ? 'w-3 bg-primary/40' : 'w-3 bg-muted'
          }`} />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center w-full max-w-sm mx-auto overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col justify-center w-full py-4">
            {current.render()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CTA */}
      <div className="px-6 pb-12 pt-4 w-full max-w-sm mx-auto">
        <button
          onClick={() => isLast ? finish() : setStep(s => s + 1)}
          className="w-full bg-primary text-primary-foreground font-extrabold py-4 rounded-2xl text-base active:scale-[0.98] transition-all shadow-lg shadow-primary/20">
          {current.cta}
        </button>
      </div>
    </motion.div>
  );
}
