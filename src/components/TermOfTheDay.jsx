import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GLOSSARY_TERMS } from '@/lib/glossaryData';

function getDayTerm() {
  const day = Math.floor(Date.now() / 86400000);
  return GLOSSARY_TERMS[day % GLOSSARY_TERMS.length];
}

export default function TermOfTheDay() {
  const term = getDayTerm();
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="mx-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">✨</span>
        <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Term of the Day</p>
      </div>
      <motion.div whileTap={{ scale: 0.98 }}
        onClick={() => setRevealed(r => !r)}
        className="bg-card border border-border rounded-2xl p-4 cursor-pointer active:border-primary/40 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">{term.category}</p>
            <p className="text-lg font-extrabold text-foreground">{term.term}</p>
            <motion.div
              initial={false}
              animate={{ height: revealed ? 'auto' : 0, opacity: revealed ? 1 : 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden">
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">{term.definition}</p>
              {term.example && (
                <p className="text-xs text-muted-foreground/70 italic mt-2">e.g. {term.example}</p>
              )}
            </motion.div>
            {!revealed && (
              <p className="text-xs text-muted-foreground mt-1">Tap to reveal →</p>
            )}
          </div>
          <span className="text-2xl shrink-0">📖</span>
        </div>
      </motion.div>
    </div>
  );
}
