const CACHE_KEY = 'wealthquest_news_cache';
const CACHE_TTL = 15 * 60 * 1000; // 15 min

// Map stock symbols to keywords that appear in news
const STOCK_KEYWORDS = {
  'AAPL':    ['apple', 'iphone', 'ipad', 'mac', 'tim cook', 'app store', 'cupertino'],
  'TSLA':    ['tesla', 'elon musk', 'electric vehicle', ' ev ', 'gigafactory', 'musk'],
  'MSFT':    ['microsoft', 'windows', 'azure', 'bing', 'copilot', 'satya nadella', 'openai'],
  'GOOGL':   ['google', 'alphabet', 'youtube', 'android', 'gemini', 'sundar pichai', 'waymo'],
  'META':    ['meta', 'facebook', 'instagram', 'whatsapp', 'zuckerberg', 'threads', 'oculus'],
  'NVDA':    ['nvidia', 'gpu', 'graphics', 'jensen huang', 'cuda', 'h100', 'ai chip'],
  'AMZN':    ['amazon', 'aws', 'prime', 'andy jassy', 'alexa', 'whole foods'],
  'NFLX':    ['netflix', 'streaming', 'subscriber'],
  'BTC-USD': ['bitcoin', 'btc', 'crypto', 'cryptocurrency', 'blockchain', 'satoshi', 'coinbase', 'binance', 'halving'],
  'ETH-USD': ['ethereum', 'eth', 'defi', 'smart contract', 'vitalik', 'layer 2', 'nft'],
};

// Macro keywords that affect multiple stocks
const MACRO_IMPACTS = [
  { keywords: ['interest rate', 'fed rate', 'federal funds', 'rate hike', 'rate cut', 'powell', 'fomc'],
    symbols: ['AAPL', 'MSFT', 'GOOGL', 'NVDA'], sentiment: 'negative' },
  { keywords: ['inflation', 'cpi', 'consumer price', 'price index'],
    symbols: ['BTC-USD', 'ETH-USD', 'NVDA'], sentiment: 'positive' },
  { keywords: ['ai ', 'artificial intelligence', 'machine learning', 'chatgpt', 'llm', 'language model'],
    symbols: ['NVDA', 'MSFT', 'GOOGL', 'META'], sentiment: 'positive' },
  { keywords: ['recession', 'gdp decline', 'economic slowdown', 'layoffs', 'mass layoff'],
    symbols: ['AAPL', 'AMZN', 'META', 'NFLX'], sentiment: 'negative' },
  { keywords: ['war', 'conflict', 'geopolit', 'sanctions', 'invasion', 'military'],
    symbols: ['BTC-USD', 'ETH-USD'], sentiment: 'positive' },
  { keywords: ['regulation', 'antitrust', 'sec ', 'ftc ', 'doj ', 'fine', 'lawsuit'],
    symbols: ['GOOGL', 'META', 'AAPL', 'AMZN'], sentiment: 'negative' },
  { keywords: ['china', 'tariff', 'trade war', 'supply chain'],
    symbols: ['AAPL', 'TSLA', 'NVDA'], sentiment: 'negative' },
  { keywords: ['earnings', 'revenue beat', 'profit', 'quarterly results'],
    symbols: ['AAPL', 'MSFT', 'GOOGL', 'META', 'AMZN', 'NVDA'], sentiment: 'positive' },
];

const RUMOUR_TEMPLATES = [
  { template: '{company} in secret talks to acquire {target} — sources say deal could close by Q{q}', type: 'M&A' },
  { template: 'Insider chatter: {company} preparing surprise product launch that could "change everything"', type: 'Product' },
  { template: '{company} executives quietly selling shares ahead of earnings — red flag?', type: 'Insider' },
  { template: 'Whispers on Wall Street: {company} may slash {pct}% of workforce in coming weeks', type: 'Layoffs' },
  { template: 'Unconfirmed: {company} and {partner} in advanced partnership talks — could threaten {rival}', type: 'Partnership' },
  { template: '{company} faces undisclosed regulatory probe — sources say announcement imminent', type: 'Regulatory' },
  { template: 'Market chatter: major hedge fund quietly building {company} position — bullish signal?', type: 'Whale' },
  { template: 'Rumour mill: {company} eyeing massive share buyback — could send price soaring', type: 'Buyback' },
];

const COMPANIES = {
  'AAPL': { name: 'Apple', rival: 'Samsung', partner: 'Qualcomm', target: 'Disney' },
  'TSLA': { name: 'Tesla', rival: 'Rivian', partner: 'Panasonic', target: 'Uber' },
  'MSFT': { name: 'Microsoft', rival: 'Google', partner: 'OpenAI', target: 'Adobe' },
  'GOOGL': { name: 'Alphabet', rival: 'Meta', partner: 'Samsung', target: 'Spotify' },
  'META': { name: 'Meta', rival: 'TikTok', partner: 'Ray-Ban', target: 'Snapchat' },
  'NVDA': { name: 'NVIDIA', rival: 'AMD', partner: 'Microsoft', target: 'Arm' },
  'AMZN': { name: 'Amazon', rival: 'Walmart', partner: 'Stellantis', target: 'FedEx' },
  'NFLX': { name: 'Netflix', rival: 'Disney+', partner: 'Microsoft', target: 'Paramount' },
  'BTC-USD': { name: 'Bitcoin', rival: 'Ethereum', partner: 'BlackRock', target: null },
  'ETH-USD': { name: 'Ethereum', rival: 'Solana', partner: 'Coinbase', target: null },
};

function seededRand(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s = Math.imul(s ^ (s >>> 16), 0x45d9f3b); s ^= s >>> 16; return (s >>> 0) / 0xffffffff; };
}

function generateRumours() {
  const day = Math.floor(Date.now() / 86400000);
  const rand = seededRand(day * 99991);
  const symbols = Object.keys(COMPANIES);
  const rumours = [];

  for (let i = 0; i < 4; i++) {
    const symbol = symbols[Math.floor(rand() * symbols.length)];
    const co = COMPANIES[symbol];
    const template = RUMOUR_TEMPLATES[Math.floor(rand() * RUMOUR_TEMPLATES.length)];
    const q = Math.floor(rand() * 4) + 1;
    const pct = [5, 10, 12, 15, 20][Math.floor(rand() * 5)];

    if (!co.target && template.template.includes('{target}')) continue;

    const title = template.template
      .replace('{company}', co.name)
      .replace('{target}', co.target ?? '')
      .replace('{partner}', co.partner)
      .replace('{rival}', co.rival)
      .replace('{q}', q)
      .replace('{pct}', pct);

    rumours.push({
      title,
      desc: `Unverified market rumour circulating on trading desks. Not confirmed by ${co.name}. Treat with caution.`,
      type: 'rumour',
      source: '🤫 Market Rumours',
      symbol,
      date: new Date().toISOString(),
      tag: template.type,
    });
  }
  return rumours;
}

export function tagStocks(item) {
  const text = (item.title + ' ' + item.desc).toLowerCase();
  const tagged = new Set();

  // Direct symbol match
  Object.entries(STOCK_KEYWORDS).forEach(([sym, keywords]) => {
    if (keywords.some(kw => text.includes(kw))) tagged.add(sym);
  });

  // Macro match
  MACRO_IMPACTS.forEach(({ keywords, symbols }) => {
    if (keywords.some(kw => text.includes(kw))) symbols.forEach(s => tagged.add(s));
  });

  return [...tagged].slice(0, 4);
}

export function getSentiment(item) {
  const text = (item.title + ' ' + item.desc).toLowerCase();
  const positive = ['surge', 'soar', 'beat', 'jump', 'rally', 'gain', 'rise', 'boom', 'record', 'growth', 'strong', 'profit', 'upgrade', 'buy', 'bullish'];
  const negative = ['crash', 'fall', 'drop', 'slump', 'miss', 'warn', 'cut', 'loss', 'bearish', 'sell', 'downgrade', 'decline', 'risk', 'concern', 'fear', 'recession'];
  const posScore = positive.filter(w => text.includes(w)).length;
  const negScore = negative.filter(w => text.includes(w)).length;
  if (posScore > negScore) return 'positive';
  if (negScore > posScore) return 'negative';
  return 'neutral';
}

export async function fetchNews() {
  // Try cache first
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { ts, data } = JSON.parse(cached);
      if (Date.now() - ts < CACHE_TTL) return data;
    }
  } catch {}

  try {
    const res = await fetch('/api/news');
    if (!res.ok) throw new Error('API error');
    const raw = await res.json();

    const enriched = raw.map(item => ({
      ...item,
      stocks: tagStocks(item),
      sentiment: getSentiment(item),
    }));

    // Only add rumours if we actually got real news — they complement real news, not replace it
    const rumours = enriched.length > 0
      ? generateRumours().map(r => ({ ...r, stocks: [r.symbol], sentiment: 'neutral' }))
      : [];

    const all = [...enriched, ...rumours];
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: all }));
    return all;
  } catch {
    // Return empty — the UI will show a "news unavailable" state rather than fake content
    return [];
  }
}

// Returns the top stocks mentioned across today's news — used to order Arena picks
export function getNewsLinkedStocks(newsItems) {
  const counts = {};
  newsItems.forEach(item => {
    (item.stocks ?? []).forEach(sym => { counts[sym] = (counts[sym] ?? 0) + 1; });
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([sym]) => sym);
}
