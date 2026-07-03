export const config = { runtime: 'edge' };

function extractTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  if (!m) return '';
  return m[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .trim();
}

function parseItems(xml, type, source, limit = 6) {
  const items = [];
  const itemRe = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRe.exec(xml)) !== null && items.length < limit) {
    const chunk = match[1];
    const title = extractTag(chunk, 'title');
    const desc  = extractTag(chunk, 'description');
    const link  = extractTag(chunk, 'link') || extractTag(chunk, 'guid');
    const date  = extractTag(chunk, 'pubDate') || extractTag(chunk, 'updated');
    if (!title || title.length < 10) continue;
    // Skip titles that are clearly navigation/UI text
    if (/^(home|menu|search|subscribe|login|sign in)$/i.test(title.trim())) continue;
    items.push({ title, desc: desc.slice(0, 320), link, date, type, source });
  }
  return items;
}

const FEEDS = [
  // Yahoo Finance — most reliable, always has market headlines
  {
    url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?region=US&lang=en-US',
    type: 'news', source: 'Yahoo Finance', limit: 8,
  },
  // CNBC Markets — reliable, no paywall on RSS
  {
    url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
    type: 'news', source: 'CNBC', limit: 5,
  },
  // Federal Reserve press releases — real central bank news
  {
    url: 'https://www.federalreserve.gov/feeds/press_all.xml',
    type: 'central_bank', source: 'Federal Reserve', limit: 3,
  },
  // CoinTelegraph — crypto news
  {
    url: 'https://cointelegraph.com/rss',
    type: 'news', source: 'CoinTelegraph', limit: 4,
  },
  // Investopedia news
  {
    url: 'https://www.investopedia.com/feedbuilder/feed/getfeed/?feedName=rss_headline',
    type: 'news', source: 'Investopedia', limit: 4,
  },
];

export default async function handler(req) {
  const results = await Promise.allSettled(
    FEEDS.map(async ({ url, type, source, limit }) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const r = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Monelingo/1.0; +https://monelingo.vercel.app)',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          },
        });
        clearTimeout(timeout);
        if (!r.ok) return [];
        const xml = await r.text();
        return parseItems(xml, type, source, limit);
      } catch {
        clearTimeout(timeout);
        return [];
      }
    })
  );

  const items = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .filter(i => i.title && i.title.length > 10);

  // Deduplicate by title similarity
  const seen = new Set();
  const deduped = items.filter(item => {
    const key = item.title.toLowerCase().slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return new Response(JSON.stringify(deduped), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=900, s-maxage=900',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
