import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, ChevronUp, ChevronDown, Shuffle, Target } from 'lucide-react';
import { GLOSSARY_TERMS, GLOSSARY_CATEGORIES } from '@/lib/glossaryData';
import { useUserProgress } from '@/lib/useUserProgress';
import { computeStreak } from '@/lib/streakUtils';
import { toast } from 'sonner';
import AchievementToast from '@/components/AchievementToast';

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const CATEGORY_THEMES = {
  'Investing':   { bg: 'from-violet-700 via-purple-800 to-indigo-900', accent: 'text-violet-300', badge: 'bg-violet-500/30 text-violet-200', emoji: '📈' },
  'Banking':     { bg: 'from-blue-700 via-blue-800 to-slate-900',      accent: 'text-blue-300',   badge: 'bg-blue-500/30 text-blue-200',   emoji: '🏦' },
  'Credit':      { bg: 'from-rose-700 via-red-800 to-slate-900',       accent: 'text-rose-300',   badge: 'bg-rose-500/30 text-rose-200',   emoji: '💳' },
  'Budgeting':   { bg: 'from-emerald-700 via-green-800 to-slate-900',  accent: 'text-emerald-300',badge: 'bg-emerald-500/30 text-emerald-200', emoji: '📊' },
  'Taxes':       { bg: 'from-amber-600 via-orange-700 to-slate-900',   accent: 'text-amber-300',  badge: 'bg-amber-500/30 text-amber-200', emoji: '🧾' },
  'Insurance':   { bg: 'from-indigo-700 via-blue-800 to-slate-900',    accent: 'text-indigo-300', badge: 'bg-indigo-500/30 text-indigo-200',emoji: '🛡️' },
  'Real Estate': { bg: 'from-orange-700 via-amber-800 to-slate-900',   accent: 'text-orange-300', badge: 'bg-orange-500/30 text-orange-200',emoji: '🏠' },
  'Economics':   { bg: 'from-teal-700 via-cyan-800 to-slate-900',      accent: 'text-teal-300',   badge: 'bg-teal-500/30 text-teal-200',  emoji: '🌍' },
};
const DEFAULT_THEME = { bg: 'from-slate-700 via-slate-800 to-slate-900', accent: 'text-slate-300', badge: 'bg-slate-500/30 text-slate-200', emoji: '💡' };
const getTheme = (cat) => CATEGORY_THEMES[cat] ?? DEFAULT_THEME;

function FlashCard({ term, index, total, isMastered, onKnow, onDontKnow, isActive }) {
  const [flipped, setFlipped] = useState(false);
  const theme = getTheme(term.category);

  useEffect(() => {
    if (!isActive) setFlipped(false);
  }, [isActive]);

  return (
    <div className="relative w-full h-full flex flex-col select-none">
      <div className={`absolute inset-0 bg-gradient-to-b ${theme.bg}`} />
      {isMastered && <div className="absolute inset-0 bg-emerald-500/10 z-10 pointer-events-none" />}

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between px-5 pt-5 pb-3">
        <span className={`text-xs font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full ${theme.badge}`}>
          {theme.emoji} {term.category}
        </span>
        <div className="flex items-center gap-2">
          {isMastered && (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Mastered
            </span>
          )}
          <span className="text-xs font-bold text-white/40">{index + 1}/{total}</span>
        </div>
      </div>

      {/* Card content */}
      <div
        className="relative z-20 flex-1 flex flex-col items-center justify-center px-6 pb-6 cursor-pointer"
        onClick={() => setFlipped(f => !f)}
      >
        <AnimatePresence mode="wait">
          {!flipped ? (
            <motion.div
              key="front"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col items-center text-center"
            >
              <div className="text-7xl mb-6 drop-shadow-lg">{theme.emoji}</div>
              <h1 className="text-4xl font-black text-white leading-tight mb-4 drop-shadow">
                {term.term}
              </h1>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`text-sm font-bold ${theme.accent} flex items-center gap-2 mt-2`}
              >
                Tap to reveal ↓
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="back"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col items-start text-left w-full max-w-sm"
            >
              <p className={`text-sm font-extrabold uppercase tracking-widest mb-3 ${theme.accent}`}>
                {term.term}
              </p>
              <p className="text-xl font-bold text-white leading-relaxed mb-5">
                {term.definition}
              </p>
              {term.example && (
                <div className={`w-full rounded-2xl p-4 ${theme.badge} border border-white/10`}>
                  <p className="text-xs font-extrabold uppercase tracking-wide mb-1.5 text-white/60">Real Example</p>
                  <p className="text-sm text-white/90 leading-relaxed">{term.example}</p>
                </div>
              )}
              {term.context && (
                <p className={`text-xs mt-3 leading-relaxed ${theme.accent} opacity-80`}>
                  💡 {term.context}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom action buttons — only when flipped */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.2 }}
            className="relative z-20 flex gap-3 px-5 pb-8"
          >
            <button
              onClick={(e) => { e.stopPropagation(); onDontKnow(); }}
              className="flex-1 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center gap-2 font-extrabold text-sm text-rose-300 active:scale-95 transition-all backdrop-blur-sm"
            >
              <XCircle className="w-5 h-5" /> Still Learning
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onKnow(); }}
              className="flex-1 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center gap-2 font-extrabold text-sm text-emerald-300 active:scale-95 transition-all backdrop-blur-sm"
            >
              <CheckCircle2 className="w-5 h-5" />
              {isMastered ? 'Got It ✓' : 'I Know This!'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipe hint */}
      {!flipped && (
        <div className="relative z-20 flex flex-col items-center pb-8 gap-1">
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <ChevronDown className="w-6 h-6 text-white/30" />
          </motion.div>
          <p className="text-xs text-white/25 font-bold">Swipe up for next</p>
        </div>
      )}
    </div>
  );
}

export default function Flashcards() {
  const { progress, updateProgress, newAchievements, dismissAchievements } = useUserProgress();
  const [category, setCategory] = useState('All');
  const [weakMode, setWeakMode] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [order, setOrder] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const cardRefs = useRef([]);

  const mastered = useMemo(() => new Set(progress?.mastered_terms ?? []), [progress?.mastered_terms]);

  const baseTerms = useMemo(() => {
    const filtered = category === 'All' ? GLOSSARY_TERMS : GLOSSARY_TERMS.filter(t => t.category === category);
    return weakMode ? filtered.filter(t => !mastered.has(t.id)) : filtered;
  }, [category, weakMode, mastered]);

  const terms = useMemo(() => {
    if (order) return order.filter(t => baseTerms.some(b => b.id === t.id));
    return baseTerms;
  }, [baseTerms, order]);

  // Track visible card via IntersectionObserver
  useEffect(() => {
    const els = cardRefs.current.filter(Boolean);
    if (!els.length) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.dataset.index, 10);
            if (!isNaN(idx)) setActiveIndex(idx);
          }
        });
      },
      { threshold: 0.6 }
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [terms]);

  const scrollTo = (idx) => {
    const el = cardRefs.current[idx];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const changeCategory = (c) => {
    setCategory(c);
    setActiveIndex(0);
    setOrder(null);
    setShuffled(false);
    setShowFilters(false);
    setTimeout(() => scrollTo(0), 50);
  };

  const toggleShuffle = () => {
    if (shuffled) { setOrder(null); setShuffled(false); }
    else { setOrder(shuffleArray(baseTerms)); setShuffled(true); }
    setActiveIndex(0);
    setTimeout(() => scrollTo(0), 50);
  };

  const markKnow = useCallback(async (termId) => {
    if (!progress) { scrollTo(activeIndex + 1); return; }
    const alreadyMastered = mastered.has(termId);
    const xpGain = alreadyMastered ? 0 : 10;
    const newMastered = alreadyMastered ? [...mastered] : [...mastered, termId];
    const { streak } = computeStreak(progress.last_active_date, progress.streak_days);
    const today = new Date().toISOString().split('T')[0];
    await updateProgress({
      mastered_terms: newMastered,
      xp: (progress.xp ?? 0) + xpGain,
      coins: (progress.coins ?? 0) + (alreadyMastered ? 0 : 2),
      streak_days: streak,
      last_active_date: today,
    });
    if (!alreadyMastered) toast.success(`+${xpGain} XP · Term mastered! 🎉`, { duration: 1200 });
    scrollTo(activeIndex + 1);
  }, [progress, mastered, activeIndex, updateProgress]);

  const markDontKnow = useCallback(async () => {
    if (!progress) { scrollTo(activeIndex + 1); return; }
    const today = new Date().toISOString().split('T')[0];
    const { streak } = computeStreak(progress.last_active_date, progress.streak_days);
    await updateProgress({ streak_days: streak, last_active_date: today });
    scrollTo(activeIndex + 1);
  }, [progress, activeIndex, updateProgress]);

  const masteredCount = terms.filter(t => mastered.has(t.id)).length;
  const pct = terms.length ? Math.round(masteredCount / terms.length * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pt-4 pb-2 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <Link to="/" className="pointer-events-auto flex items-center gap-1.5 text-white/80 font-bold text-sm bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-extrabold text-white">{pct}% mastered</span>
          </div>
          <button
            onClick={() => setShowFilters(s => !s)}
            className="bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-extrabold text-white"
          >
            {category === 'All' ? 'All' : category} ▾
          </button>
        </div>
      </div>

      {/* Right side nav */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
        <button
          onClick={() => scrollTo(Math.max(0, activeIndex - 1))}
          disabled={activeIndex === 0}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/60 disabled:opacity-20 active:scale-90 transition-all"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          onClick={() => scrollTo(Math.min(terms.length - 1, activeIndex + 1))}
          disabled={activeIndex === terms.length - 1}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/60 disabled:opacity-20 active:scale-90 transition-all"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
        <button
          onClick={toggleShuffle}
          className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center active:scale-90 transition-all ${
            shuffled ? 'bg-primary text-primary-foreground' : 'bg-black/40 text-white/60'
          }`}
          title="Shuffle"
        >
          <Shuffle className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setWeakMode(w => !w); setActiveIndex(0); setTimeout(() => scrollTo(0), 50); }}
          className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center active:scale-90 transition-all ${
            weakMode ? 'bg-rose-500 text-white' : 'bg-black/40 text-white/60'
          }`}
          title="Weak spots only"
        >
          <Target className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 z-50 h-1 bg-white/10">
        <motion.div
          className="h-full bg-emerald-400"
          animate={{ width: terms.length ? `${((activeIndex + 1) / terms.length) * 100}%` : '0%' }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Empty state */}
      {weakMode && terms.length === 0 ? (
        <div className="flex-1 bg-gradient-to-b from-slate-800 to-slate-900 flex flex-col items-center justify-center text-center px-8">
          <div className="text-7xl mb-4">🎉</div>
          <p className="text-2xl font-black text-white mb-2">All mastered!</p>
          <p className="text-white/60 text-sm">You've mastered every term in this category.</p>
          <button onClick={() => setWeakMode(false)} className="mt-6 bg-white text-black font-extrabold px-6 py-3 rounded-2xl text-sm">
            Review All Terms
          </button>
        </div>
      ) : (
        /* TikTok scroll container */
        <div
          className="flex-1 overflow-y-scroll"
          style={{ scrollSnapType: 'y mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {terms.map((term, i) => (
            <div
              key={term.id}
              ref={el => { cardRefs.current[i] = el; }}
              data-index={i}
              className="w-full flex-shrink-0"
              style={{ height: '100dvh', scrollSnapAlign: 'start' }}
            >
              <FlashCard
                term={term}
                index={i}
                total={terms.length}
                isMastered={mastered.has(term.id)}
                onKnow={() => markKnow(term.id)}
                onDontKnow={markDontKnow}
                isActive={i === activeIndex}
              />
            </div>
          ))}
        </div>
      )}

      {/* Category filter sheet */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 z-[70] bg-zinc-900 rounded-t-3xl p-5 pb-10"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-5" />
              <p className="text-xs font-extrabold text-white/40 uppercase tracking-widest mb-4">Filter by Category</p>
              <div className="grid grid-cols-2 gap-2">
                {['All', ...GLOSSARY_CATEGORIES].map(c => {
                  const th = c === 'All' ? DEFAULT_THEME : getTheme(c);
                  return (
                    <button
                      key={c}
                      onClick={() => changeCategory(c)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm text-left transition-all active:scale-95 ${
                        category === c ? 'bg-white text-black' : 'bg-white/10 text-white/80'
                      }`}
                    >
                      {c !== 'All' && <span>{th.emoji}</span>}
                      {c}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AchievementToast achievements={newAchievements} onDismiss={dismissAchievements} />
    </div>
  );
}
