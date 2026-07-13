// Squad advisors — each recruited investor sends one piece of trading advice
// per day about today's arena stocks. Whether the advice points the RIGHT way
// is decided by the investor's win rate; the "right way" comes from real news
// sentiment for that stock (falling back to today's live price direction).

import { getTodayArenaStocks } from './arenaData';
import marketSim from './marketSim';

const KEY = 'wealthquest_advisor_feed';

function todayKey() { return new Date().toISOString().slice(0, 10); }

function seededRand(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s = Math.imul(s ^ (s >>> 16), 0x45d9f3b); s ^= s >>> 16; return (s >>> 0) / 0xffffffff; };
}

function hashStr(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0;
  return h >>> 0;
}

// What does today's news say about this symbol? 'up' | 'down' | null
function newsSignal(symbol) {
  try {
    const cache = JSON.parse(localStorage.getItem('wealthquest_news_cache') ?? 'null');
    if (!cache?.data) return null;
    let score = 0;
    cache.data.forEach(item => {
      if (!item.stocks?.includes(symbol)) return;
      if (item.sentiment === 'positive') score++;
      if (item.sentiment === 'negative') score--;
    });
    return score > 0 ? 'up' : score < 0 ? 'down' : null;
  } catch { return null; }
}

// Live intraday direction fallback
function marketSignal(assetId) {
  const chg = marketSim.prices[assetId]?.change;
  if (chg == null) return null;
  return chg >= 0 ? 'up' : 'down';
}

const PHRASES = {
  up: [
    "the tape looks strong — I'd be a buyer here",
    'momentum is building, this wants to go higher',
    "the news flow backs it — I'm leaning UP today",
    'buyers are in control. UP is my call',
  ],
  down: [
    "I don't like the setup — I'd fade this one",
    'the pressure is on the sell side. DOWN for me',
    "today's headlines aren't kind — I'd bet DOWN",
    'weak hands everywhere. My call is DOWN',
  ],
};

// One advice message per squad member per day. Deterministic for the day.
export function getDailyAdvice(squad) {
  if (!squad?.length) return [];
  try {
    const cached = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (cached?.date === todayKey() && cached.forIds === squad.map(m => m.id).join(',')) return cached.advice;
  } catch {}

  const stocks = getTodayArenaStocks();
  const advice = squad.map((member, i) => {
    const rand = seededRand(hashStr(member.id + todayKey()));
    const stock = stocks[Math.floor(rand() * stocks.length)];
    // Ground truth: news sentiment first, live market direction as fallback
    const signal = newsSignal(stock.symbol) ?? marketSignal(stock.assetId) ?? (rand() > 0.5 ? 'up' : 'down');
    // Win rate decides whether this advisor reads it right today
    const correct = rand() * 100 < (member.winRate ?? 50);
    const call = correct ? signal : (signal === 'up' ? 'down' : 'up');
    const phrase = PHRASES[call][Math.floor(rand() * PHRASES[call].length)];
    return {
      memberId: member.id,
      name: member.name,
      avatar: member.avatar,
      winRate: member.winRate ?? 50,
      symbol: stock.symbol,
      emoji: stock.emoji,
      call,                     // 'up' | 'down'
      text: `${stock.emoji} ${stock.symbol}: ${phrase}.`,
    };
  });

  localStorage.setItem(KEY, JSON.stringify({ date: todayKey(), forIds: squad.map(m => m.id).join(','), advice }));
  return advice;
}
