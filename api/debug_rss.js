import axios from 'axios';

// Endpoint de diagnóstico — testa RSS e retorna resultado detalhado
// Chame: POST /api/debug_rss
export default async function handler(req, res) {
  const feeds = [
    { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
    { name: 'BBC Tech', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml' },
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
    { name: 'Google News BR', url: 'https://news.google.com/rss/search?q=brasil+economia&hl=pt-BR&gl=BR&ceid=BR:pt-BR' },
    { name: 'InfoMoney', url: 'https://www.infomoney.com.br/feed/' },
    { name: 'Exame', url: 'https://exame.com/feed/' },
    { name: 'Agência Brasil', url: 'https://agenciabrasil.ebc.com.br/politica/feed.xml' },
  ];

  const results = await Promise.all(feeds.map(async ({ name, url }) => {
    try {
      const r = await axios.get(url, {
        timeout: 10000,
        responseType: 'text',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
        },
        maxRedirects: 5,
        validateStatus: s => s < 500,
      });
      const xml = r.data || '';
      const itemCount = (xml.match(/<item>/g) || []).length + (xml.match(/<entry>/g) || []).length;
      const firstTitle = xml.match(/<title>(?:<![CDATA[)?(.*?)(?:]]>)?<\/title>/i)?.[1]?.slice(0, 80) || 'n/a';
      return { name, status: r.status, items: itemCount, firstTitle, bytes: xml.length };
    } catch(e) {
      return { name, status: 'ERROR', error: e.message };
    }
  }));

  const total = results.reduce((s, r) => s + (r.items || 0), 0);
  return res.status(200).json({ total_items: total, feeds: results });
}
