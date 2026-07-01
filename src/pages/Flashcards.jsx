import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowLeft, CheckCircle2, XCircle, Shuffle, BookOpen, Zap, Target } from 'lucide-react';
import { GLOSSARY_TERMS, GLOSSARY_CATEGORIES } from '@/lib/glossaryData';
import { Button } from '@/components/ui/button';
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

export default function Flashcards() {
  const { progress, updateProgress, newAchievements, dismissAchievements } = useUserProgress();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'weak' ? 'weak' : 'all';
  const [category, setCategory] = useState('All');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [order, setOrder] = useState(null);
  const [weakMode, setWeakMode] = useState(initialMode === 'weak');

  const mastered = useMemo(() => new Set(progress?.mastered_terms ?? []), [progress?.mastered_terms]);

  const baseTerms = useMemo(() => {
    const filtered = category === 'All' ? GLOSSARY_TERMS : GLOSSARY_TERMS.filter((t) => t.category === category);
    return weakMode ? filtered.filter((t) => !mastered.has(t.id)) : filtered;
  }, [category, weakMode, mastered]);

  const terms = useMemo(() => {
    if (order) return order.filter((t) => baseTerms.some((b) => b.id === t.id));
    return baseTerms;
  }, [baseTerms, order]);

  const term = terms[index];
  const isMastered = term ? mastered.has(term.id) : false;

  const go = (delta) => {
    setFlipped(false);
    setIndex((i) => {
      const next = i + delta;
      if (next < 0) return terms.length - 1;
      if (next >= terms.length) return 0;
      return next;
    });
  };

  const changeCategory = (c) => {
    setCategory(c);
    setIndex(0);
    setFlipped(false);
    setOrder(null);
    setShuffled(false);
  };

  const toggleWeakMode = () => {
    setWeakMode((w) => !w);
    setIndex(0);
    setFlipped(false);
    setOrder(null);
    setShuffled(false);
  };

  const toggleShuffle = () => {
    if (shuffled) {
      setOrder(null);
      setShuffled(false);
    } else {
      setOrder(shuffleArray(baseTerms));
      setShuffled(true);
    }
    setIndex(0);
    setFlipped(false);
  };

  const markKnow = useCallback(async () => {
    if (!progress || isMastered) { go(1); return; }
    const newMastered = [...mastered, term.id];
    const xpGain = 10;
    const { streak, isNew } = computeStreak(progress.last_active_date, progress.streak_days);
    const today = new Date().toISOString().split('T')[0];
    const updates = {
      mastered_terms: newMastered,
      xp: (progress.xp ?? 0) + xpGain,
      coins: (progress.coins ?? 0) + 2,
      streak_days: streak,
      last_active_date: today,
    };
    await updateProgress(updates);
    toast.success(`+${xpGain} XP · Term mastered!`, { duration: 1500 });
    go(1);
  }, [progress, mastered, term, isMastered, updateProgress]);

  const markDontKnow = useCallback(async () => {
    if (!progress) { go(1); return; }
    const today = new Date().toISOString().split('T')[0];
    const { streak } = computeStreak(progress.last_active_date, progress.streak_days);
    await updateProgress({ streak_days: streak, last_active_date: today });
    go(1);
  }, [progress, updateProgress]);

  const masteredInView = terms.filter((t) => mastered.has(t.id)).length;

  return (
    <div className="min-h-screen bg-background px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
          <BookOpen className="w-4 h-4" />
          {masteredInView}/{terms.length} mastered
        </div>
      </div>

      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-extrabold text-foreground">Flashcards</h1>
        <button
          onClick={toggleWeakMode}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
            weakMode
              ? 'bg-rose-100 border-rose-300 text-rose-700'
              : 'bg-card border-border text-muted-foreground hover:border-rose-300'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          {weakMode ? 'Weak Spots ON' : 'Weak Spots'}
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {terms.length} terms {category !== 'All' && `in ${category}`}
        {shuffled && ' · Shuffled'}
        {weakMode && terms.length === 0 ? '' : weakMode && ' · Unmastered only'}
      </p>
      {weakMode && terms.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🎉</div>
          <p className="font-extrabold text-foreground">All terms mastered!</p>
          <p className="text-sm text-muted-foreground mt-1">Switch off Weak Spots to review everything.</p>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-4 px-4">
        {['All', ...GLOSSARY_CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => changeCategory(c)}
            className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
              category === c
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:border-primary/40'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {term && (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className="text-center text-xs font-bold text-muted-foreground">
              {index + 1} / {terms.length}
            </span>
            <button
              onClick={toggleShuffle}
              className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${
                shuffled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Shuffle className="w-3 h-3" /> Shuffle
            </button>
          </div>

          {/* Card */}
          <div className="relative h-72 mb-4" style={{ perspective: 1200 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={term.id + (flipped ? '-back' : '-front')}
                initial={{ opacity: 0, rotateY: flipped ? -90 : 90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                exit={{ opacity: 0, rotateY: flipped ? 90 : -90 }}
                transition={{ duration: 0.22 }}
                onClick={() => setFlipped((f) => !f)}
                className={`absolute inset-0 border-2 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm transition-colors ${
                  isMastered
                    ? 'bg-emerald-600 border-emerald-500'
                    : 'bg-card border-border'
                }`}
              >
                {isMastered && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 text-xs font-bold text-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mastered
                  </div>
                )}
                {!flipped ? (
                  <>
                    <span className={`text-xs font-bold uppercase tracking-wide mb-3 ${isMastered ? 'text-emerald-200' : 'text-primary'}`}>
                      {term.category}
                    </span>
                    <p className={`text-2xl font-extrabold ${isMastered ? 'text-white' : 'text-foreground'}`}>{term.term}</p>
                    <p className={`text-xs mt-4 ${isMastered ? 'text-emerald-200' : 'text-muted-foreground'}`}>Tap to reveal definition</p>
                  </>
                ) : (
                  <>
                    <p className={`text-sm font-semibold leading-relaxed mb-3 ${isMastered ? 'text-white' : 'text-foreground'}`}>
                      {term.definition}
                    </p>
                    {term.example && (
                      <p className={`text-xs italic leading-relaxed ${isMastered ? 'text-emerald-200' : 'text-muted-foreground'}`}>
                        e.g. {term.example}
                      </p>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Know / Don't Know */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={markDontKnow}
              className="flex-1 h-14 rounded-2xl border-2 border-rose-200 bg-rose-50 flex items-center justify-center gap-2 font-bold text-sm text-rose-700 hover:bg-rose-100 active:scale-95 transition-all"
            >
              <XCircle className="w-5 h-5" /> Still Learning
            </button>
            <button
              onClick={markKnow}
              className={`flex-1 h-14 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold text-sm active:scale-95 transition-all ${
                isMastered
                  ? 'border-emerald-300 bg-emerald-100 text-emerald-700'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              {isMastered ? 'Got It ✓' : 'I Know This'}
            </button>
          </div>

          {/* Nav */}
          <div className="flex gap-3">
            <Button variant="outline" size="icon" onClick={() => go(-1)} className="rounded-2xl h-12 w-12">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="secondary"
              onClick={() => setFlipped((f) => !f)}
              className="flex-1 rounded-2xl h-12 font-bold"
            >
              Flip Card
            </Button>
            <Button variant="outline" size="icon" onClick={() => go(1)} className="rounded-2xl h-12 w-12">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* XP hint */}
          {!isMastered && (
            <p className="text-xs text-center text-muted-foreground mt-3 flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-primary" /> +10 XP for marking a new term as mastered
            </p>
          )}
        </>
      )}

      <AchievementToast achievements={newAchievements} onDismiss={dismissAchievements} />
    </div>
  );
}
