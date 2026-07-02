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
    if (!title || title.length < 5) continue;
    items.push({ title, desc: desc.slice(0, 280), link, date, type, source });
  }
  return items;
}

const FEEDS = [
  {
    url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?region=US&lang=en-US',
    type: 'news', source: 'Yahoo Finance', limit: 7,
  },
  {
    url: 'https://www.federalreserve.gov/feeds/press_all.xml',
    type: 'central_bank', source: 'Federal Reserve', limit: 4,
  },
  {
    url: 'https://cointelegraph.com/rss',
    type: 'news', source: 'CoinTelegraph', limit: 4,
  },
  {
    url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',
    type: 'news', source: 'Wall Street Journal', limit: 5,
  },
];

export default async function handler(req) {
  const results = await Promise.allSettled(
    FEEDS.map(async ({ url, type, source, limit }) => {
      const r = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; WealthQuestApp/1.0)',
          'Accept': 'application/rss+xml, text/xml, */*',
        },
      });
      if (!r.ok) return [];
      const xml = await r.text();
      return parseItems(xml, type, source, limit);
    })
  );

  const items = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .filter(i => i.title);

  return new Response(JSON.stringify(items), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=900, s-maxage=900',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
