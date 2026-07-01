import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GLOSSARY_TERMS, GLOSSARY_CATEGORIES } from '@/lib/glossaryData';

export default function GlossarySearch() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [expanded, setExpanded] = useState(null);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    return GLOSSARY_TERMS.filter(t => {
      const matchesCat = category === 'All' || t.category === category;
      if (!q) return matchesCat;
      return matchesCat && (
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  function highlight(text, q) {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-primary/20 text-primary rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 pt-12 pb-3">
        <Link to="/play" className="inline-flex items-center gap-1 text-muted-foreground text-sm font-bold mb-3">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-xl font-extrabold text-foreground mb-3">Glossary</h1>
        {/* Search bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search 131 terms..."
            className="w-full h-11 pl-9 pr-9 rounded-xl bg-muted border border-border text-sm font-semibold text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
          {['All', ...GLOSSARY_CATEGORIES].map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
                category === c ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border'
              }`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-xs font-bold text-muted-foreground">{results.length} term{results.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Results */}
      <div className="px-4 space-y-2">
        <AnimatePresence mode="popLayout">
          {results.map(term => (
            <motion.div key={term.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-card border border-border rounded-2xl overflow-hidden">
              <button onClick={() => setExpanded(expanded === term.id ? null : term.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-sm text-foreground">{highlight(term.term, query)}</p>
                  <p className="text-[10px] font-bold text-primary mt-0.5">{term.category}</p>
                </div>
                <span className={`text-muted-foreground transition-transform text-xs ${expanded === term.id ? 'rotate-180' : ''}`}>▾</span>
              </button>
              <AnimatePresence>
                {expanded === term.id && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    className="overflow-hidden border-t border-border">
                    <div className="px-4 py-3 space-y-2">
                      <p className="text-sm text-foreground leading-relaxed">{highlight(term.definition, query)}</p>
                      {term.example && (
                        <p className="text-xs text-muted-foreground italic">e.g. {term.example}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
        {results.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-extrabold text-foreground">No results for "{query}"</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different word</p>
          </div>
        )}
      </div>
    </div>
  );
}
