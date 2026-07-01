import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, CheckCircle2, Zap } from 'lucide-react';
import { GLOSSARY_TERMS } from '@/lib/glossaryData';
import { getTodaySeed } from '@/lib/dailyChallengeData';

function getTodaysTerm() {
  const seed = getTodaySeed();
  return GLOSSARY_TERMS[seed % GLOSSARY_TERMS.length];
}

export default function WordOfTheDay({ progress, onMark }) {
  const [expanded, setExpanded] = useState(false);
  const term = getTodaysTerm();
  const mastered = (progress?.mastered_terms ?? []).includes(term.id);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
      <button
        className="w-full px-4 py-3.5 flex items-center justify-between text-left"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xl">📅</span>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Word of the Day</p>
            <p className="text-sm font-extrabold text-foreground">{term.term}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mastered && <span className="text-xs font-bold text-emerald-600">✓ Known</span>}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border pt-3">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full mb-2 inline-block bg-primary/10 text-primary`}>
                {term.category}
              </span>
              <p className="text-sm text-foreground leading-relaxed mb-2">{term.definition}</p>
              {term.example && (
                <p className="text-xs text-muted-foreground italic mb-3">e.g. {term.example}</p>
              )}
              {term.context && (
                <p className="text-xs text-muted-foreground leading-relaxed mb-3 border-l-2 border-primary/30 pl-2">{term.context}</p>
              )}
              {!mastered && (
                <button
                  onClick={() => onMark(term)}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 hover:bg-emerald-100 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark as Known (+10 XP)
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
