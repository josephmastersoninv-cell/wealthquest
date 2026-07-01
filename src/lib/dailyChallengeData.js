import { GLOSSARY_TERMS } from './glossaryData';

function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s ^= s >>> 16;
    return (s >>> 0) / 0xffffffff;
  };
}

function seededShuffle(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getTodaySeed() {
  const today = new Date().toISOString().split('T')[0];
  return today.split('-').reduce((acc, part) => acc * 100 + parseInt(part, 10), 0);
}

export function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

export function generateDailyQuestions() {
  const seed = getTodaySeed();
  const rand = seededRandom(seed);
  const terms = seededShuffle(GLOSSARY_TERMS, rand).slice(0, 5);

  return terms.map((term) => {
    const wrong = GLOSSARY_TERMS.filter((t) => t.id !== term.id);
    const distractors = seededShuffle(wrong, seededRandom(seed + term.id.charCodeAt(0)))
      .slice(0, 3)
      .map((t) => t.definition);
    const options = seededShuffle([term.definition, ...distractors], seededRandom(seed + 7));
    return {
      id: `daily-${term.id}`,
      term: term.term,
      category: term.category,
      options,
      correct: options.indexOf(term.definition),
      explanation: term.definition + (term.context ? ` — ${term.context}` : ''),
    };
  });
}

export const DAILY_XP = 50;
export const DAILY_COINS = 20;
