// Floating "read the news" nudge — pops up now and then when the briefing is
// unread, personalized: calls out news on stocks YOU hold or city events that
// hit YOUR properties, so tapping through feels worth it.
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { getPortfolio } from '@/lib/tradeActions';
import { getMonthEvents, getCityById } from '@/lib/realEstateData';

const SNOOZE_KEY = 'wq_nudge_snooze';
const SNOOZE_MS = 4 * 60 * 60 * 1000; // 4h after dismissing
const SHOW_DELAY = 12_000;            // appear after 12s on a page

// What's the juiciest personal hook in today's news?
function buildMessage() {
  try {
    // 1. News that mentions a stock the player actually holds
    const idToSym = { AAPL: 'AAPL', TSLA: 'TSLA', MSFT: 'MSFT', GOOGL: 'GOOGL', META: 'META', NVDA: 'NVDA', AMZN: 'AMZN', NFLX: 'NFLX', bitcoin: 'BTC-USD', ethereum: 'ETH-USD' };
    const held = new Set((getPortfolio().holdings ?? []).map(h => idToSym[h.assetId]).filter(Boolean));
    if (held.size) {
      const cache = JSON.parse(localStorage.getItem('wealthquest_news_cache') ?? 'null');
      const hit = cache?.data?.find(n => n.stocks?.some(s => held.has(s)));
      if (hit) {
        const sym = hit.stocks.find(s => held.has(s));
        return { emoji: hit.sentiment === 'negative' ? '📉' : '📈', text: `Breaking news on ${sym} — you hold this!` };
      }
    }
    // 2. City event hitting a property the player owns
    const mine = JSON.parse(localStorage.getItem('wealthquest_re_holdings') ?? '{}');
    const myCities = new Set(Object.keys(mine).map(id => id.split('-')[0]));
    const ev = getMonthEvents().find(e => myCities.has(e.cityId));
    if (ev) return { emoji: ev.emoji, text: `${ev.city.name} event — your property is affected!` };
    // 3. Any city event at all
    const any = getMonthEvents()[0];
    if (any) return { emoji: any.emoji, text: `${any.city.flag} ${any.city.name} property ${any.boom ? 'boom' : 'shock'} — today's briefing` };
  } catch {}
  return { emoji: '📰', text: "Today's market briefing is out" };
}

export default function NewsNudge() {
  const navigate = useNavigate();
  const location = useLocation();
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    setMsg(null);
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem('wealthquest_briefing_read') === today) return;
    if (Date.now() < Number(localStorage.getItem(SNOOZE_KEY) ?? 0)) return;
    const t = setTimeout(() => setMsg(buildMessage()), SHOW_DELAY);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 16 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md"
        >
          <button
            onClick={() => { setMsg(null); navigate('/news?from=nudge'); }}
            className="w-full bg-card border border-border rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 active:scale-[0.98] transition-all"
          >
            <motion.span animate={{ rotate: [0, -12, 12, 0] }} transition={{ repeat: Infinity, duration: 2.2, repeatDelay: 1.5 }}
              className="text-2xl shrink-0">{msg.emoji}</motion.span>
            <span className="flex-1 text-left text-sm font-extrabold text-foreground leading-tight">{msg.text}</span>
            <span className="shrink-0 text-xs font-extrabold bg-primary text-primary-foreground rounded-lg px-2.5 py-1.5">Read →</span>
            <span
              role="button"
              onClick={e => { e.stopPropagation(); localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS)); setMsg(null); }}
              className="shrink-0 p-1 text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
