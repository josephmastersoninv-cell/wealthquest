import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { fetchFinancialNews, timeAgo } from '@/lib/newsData';

export default function NewsFeed() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(force = false) {
    if (force) {
      setRefreshing(true);
      localStorage.removeItem('wealthquest_news');
    }
    const data = await fetchFinancialNews();
    setArticles(data);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">📰 Market News</p>
        <button onClick={() => load(true)} disabled={refreshing}
          className="text-muted-foreground active:text-primary">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {articles.slice(0, 6).map((a, i) => (
            <motion.a
              key={i}
              href={a.url === '#' ? undefined : a.url}
              target={a.url === '#' ? undefined : '_blank'}
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3 bg-card border border-border rounded-2xl p-3.5 block active:scale-[0.98] transition-all"
            >
              <span className="text-xl shrink-0 mt-0.5">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground leading-snug line-clamp-2">{a.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-muted-foreground">{a.source}</span>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(a.publishedAt)}</span>
                </div>
              </div>
              {a.url !== '#' && <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-1" />}
            </motion.a>
          ))}
        </div>
      )}
    </div>
  );
}
