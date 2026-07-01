// Financial news via GNews API (free tier: 100 req/day)
// Falls back to curated static headlines if API unavailable.

const GNEWS_KEY = 'demo'; // Replace with real key from gnews.io — free tier is generous
const CACHE_KEY = 'wealthquest_news';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

const FALLBACK_NEWS = [
  { title: 'Federal Reserve holds rates steady amid mixed economic signals', source: 'Reuters', url: '#', publishedAt: new Date().toISOString(), emoji: '🏛️' },
  { title: 'S&P 500 hits new all-time high driven by tech sector gains', source: 'Bloomberg', url: '#', publishedAt: new Date().toISOString(), emoji: '📈' },
  { title: 'Bitcoin surpasses $100,000 as institutional adoption grows', source: 'CoinDesk', url: '#', publishedAt: new Date().toISOString(), emoji: '₿' },
  { title: 'Warren Buffett increases cash position to record levels', source: 'WSJ', url: '#', publishedAt: new Date().toISOString(), emoji: '💵' },
  { title: 'Inflation cools to 2.4% as energy prices fall sharply', source: 'FT', url: '#', publishedAt: new Date().toISOString(), emoji: '📊' },
  { title: 'Apple reports record quarterly earnings, beats estimates', source: 'CNBC', url: '#', publishedAt: new Date().toISOString(), emoji: '🍎' },
  { title: 'Gold prices rise to record as central banks continue buying', source: 'MarketWatch', url: '#', publishedAt: new Date().toISOString(), emoji: '🥇' },
  { title: 'Bond yields rise as stronger jobs data reduces rate-cut bets', source: 'Reuters', url: '#', publishedAt: new Date().toISOString(), emoji: '🏦' },
];

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, articles } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL) return articles;
  } catch { /* ignore */ }
  return null;
}

function writeCache(articles) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), articles }));
  } catch { /* ignore */ }
}

function assignEmoji(title = '') {
  const t = title.toLowerCase();
  if (t.includes('bitcoin') || t.includes('crypto') || t.includes('ethereum')) return '₿';
  if (t.includes('gold')) return '🥇';
  if (t.includes('oil') || t.includes('energy')) return '🛢️';
  if (t.includes('apple') || t.includes('tech')) return '💻';
  if (t.includes('fed') || t.includes('rate') || t.includes('central bank')) return '🏛️';
  if (t.includes('inflation') || t.includes('cpi')) return '📊';
  if (t.includes('stock') || t.includes('s&p') || t.includes('nasdaq')) return '📈';
  if (t.includes('bond') || t.includes('yield') || t.includes('treasury')) return '🏦';
  if (t.includes('recession') || t.includes('gdp')) return '🌍';
  if (t.includes('earnings') || t.includes('profit')) return '💰';
  return '📰';
}

export async function fetchFinancialNews() {
  const cached = readCache();
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://gnews.io/api/v4/search?q=finance+stocks+investing&lang=en&max=10&apikey=${GNEWS_KEY}`
    );
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    const articles = (data.articles ?? []).map(a => ({
      title: a.title,
      source: a.source?.name ?? 'News',
      url: a.url,
      publishedAt: a.publishedAt,
      emoji: assignEmoji(a.title),
    }));
    if (articles.length > 0) {
      writeCache(articles);
      return articles;
    }
    throw new Error('No articles');
  } catch {
    return FALLBACK_NEWS;
  }
}

export function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
