import { createClient } from "@supabase/supabase-js";
import axios from 'axios';
import RSSParser from 'rss-parser';

const supabase = createClient("https://yntwvfcxjardzafdqanj.supabase.co", process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40");

const parser = new RSSParser({
  timeout: 5000,
  customFields: {
    item: [['pubDate','pubDate'],['published','published'],['updated','updated']],
  }
});

const GN = (q, lang="pt-BR", gl="BR", ceid="BR:pt-BR") =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=${lang}&gl=${gl}&ceid=${ceid}`;

const GN_EN = (q) => GN(q, "en", "US", "US:en");

// ═══════════════════════════════════════════════════════════════════════════
// FONTES APROVADAS OVC — 70 FONTES OFICIAIS
// Aprovadas por Roberto Terrasan em 18/06/2026
// NUNCA adicionar fontes sem aprovação explícita de Roberto
// ═══════════════════════════════════════════════════════════════════════════
const FEEDS_DIRETOS_GARANTIDOS = [
  // ━━━ BRASILEIRAS (50) ━━━
  { url: "https://feeds.folha.uol.com.br/emcimadahora/rss091.xml",              name: "Folha de S.Paulo",          cats: ["brasil-on","politica","economia"] },
  { url: "https://www.estadao.com.br/arc/outbound/feed/rss/?outputType=xml",    name: "O Estado de S. Paulo",      cats: ["politica","brasil-on","economia"] },
  { url: "https://oglobo.globo.com/rss.xml",                                    name: "O Globo",                   cats: ["brasil-on","politica","economia"] },
  { url: "https://g1.globo.com/rss/g1/",                                        name: "G1",                        cats: ["brasil-on","politica","saude","economia"] },
  { url: "https://noticias.uol.com.br/ultnot/rss/home.xml",                    name: "UOL Notícias",              cats: ["brasil-on","politica"] },
  { url: "https://www.cnnbrasil.com.br/feed/",                                  name: "CNN Brasil",                cats: ["brasil-on","politica","economia"] },
  { url: "https://veja.abril.com.br/feed/",                                     name: "Veja",                      cats: ["politica","brasil-on"] },
  { url: "https://istoe.com.br/feed/",                                          name: "IstoÉ",                     cats: ["brasil-on","politica"] },
  { url: "https://www.metropoles.com/feed",                                     name: "Metrópoles",                cats: ["brasil-on","cultura","politica"] },
  { url: "https://www.correiobraziliense.com.br/rss_feed/?tipo=1",              name: "Correio Braziliense",       cats: ["brasil-on","politica"] },
  { url: "https://agenciabrasil.ebc.com.br/feed.xml",                          name: "Agência Brasil",            cats: ["brasil-on","politica","saude","economia"] },
  { url: "https://noticias.r7.com/feed.xml",                                    name: "R7",                        cats: ["brasil-on"] },
  { url: "https://www.valor.com.br/rss",                                        name: "Valor Econômico",           cats: ["economia","negocios","investimentos","tributos","industria","seguros","imoveis"] },
  { url: "https://exame.com/feed/",                                             name: "Exame",                     cats: ["negocios","economia","tecnologia","carreira"] },
  { url: "https://www.infomoney.com.br/feed/",                                  name: "InfoMoney",                 cats: ["investimentos","economia","seguros"] },
  { url: "https://epocanegocios.globo.com/rss/",                                name: "Época Negócios",            cats: ["negocios","economia"] },
  { url: "https://forbes.com.br/feed/",                                         name: "Forbes Brasil",             cats: ["negocios","carreira","investimentos"] },
  { url: "https://istoedinheiro.com.br/feed/",                                  name: "IstoÉ Dinheiro",            cats: ["economia","investimentos","negocios"] },
  { url: "https://braziljournal.com/feed/",                                     name: "Brazil Journal",            cats: ["negocios","economia","investimentos"] },
  { url: "https://neofeed.com.br/feed/",                                        name: "NeoFeed",                   cats: ["negocios","tecnologia","investimentos"] },
  { url: "https://www.moneytimes.com.br/feed/",                                 name: "Money Times",               cats: ["investimentos","economia","negocios"] },
  { url: "https://www.bloomberglinea.com/rss/",                                 name: "Bloomberg Línea",           cats: ["economia","negocios","investimentos","internacional"] },
  { url: "https://www.bbc.com/portuguese/index.xml",                            name: "BBC Brasil",                cats: ["internacional","brasil-on","saude","tecnologia"] },
  { url: "https://www.poder360.com.br/feed/",                                   name: "Poder360",                  cats: ["politica","brasil-on"] },
  { url: "https://congressoemfoco.uol.com.br/feed/",                            name: "Congresso em Foco",         cats: ["politica","brasil-on","tributos"] },
  { url: "https://www.jota.info/feed",                                          name: "JOTA",                      cats: ["tributos","politica","negocios"] },
  { url: "https://www.conjur.com.br/rss.xml",                                   name: "Conjur",                    cats: ["tributos","brasil-on"] },
  { url: "https://www.migalhas.com.br/rss.aspx",                               name: "Migalhas",                  cats: ["tributos","brasil-on"] },
  { url: "https://canaltech.com.br/rss/",                                       name: "Canaltech",                 cats: ["tecnologia","industria"] },
  { url: "https://www.techtudo.com.br/rss.xml",                                 name: "TechTudo",                  cats: ["tecnologia"] },
  { url: "https://olhardigital.com.br/feed/",                                   name: "Olhar Digital",             cats: ["tecnologia"] },
  { url: "https://tiinside.com.br/feed/",                                       name: "TI Inside",                 cats: ["tecnologia","industria"] },
  { url: "https://ge.globo.com/rss/ge.xml",                                     name: "GE Globo",                  cats: ["esportes"] },
  { url: "https://www.espn.com.br/rss/",                                        name: "ESPN Brasil",               cats: ["esportes"] },
  { url: "https://www.lance.com.br/rss.xml",                                    name: "Lance!",                    cats: ["esportes"] },
  { url: "https://saude.abril.com.br/feed/",                                    name: "Saúde (Abril)",             cats: ["saude","familia"] },
  { url: "https://vocesa.abril.com.br/feed/",                                   name: "Você S/A",                  cats: ["carreira","negocios"] },
  { url: "https://crescer.globo.com/rss.xml",                                   name: "Crescer",                   cats: ["familia","saude"] },
  { url: "https://claudia.abril.com.br/feed/",                                  name: "Claudia",                   cats: ["familia","cultura"] },
  { url: "https://www.zapimoveis.com.br/blog/feed/",                            name: "ZAP Imóveis",               cats: ["imoveis"] },
  { url: "https://www.automotivebusiness.com.br/feed/",                         name: "Automotive Business",       cats: ["industria","negocios"] },
  { url: "https://www.vaticannews.va/pt/rss.xml",                               name: "Vatican News Brasil",       cats: ["religiao"] },
  { url: "https://www.gazetadopovo.com.br/feed/",                               name: "Gazeta do Povo",            cats: ["brasil-on","politica","religiao"] },
  { url: "https://gauchazh.clicrbs.com.br/rss.xml",                            name: "GaúchaZH",                  cats: ["brasil-on","esportes"] },
  { url: "https://www.otempo.com.br/rss.xml",                                   name: "O Tempo",                   cats: ["brasil-on"] },
  { url: "https://odia.ig.com.br/rss.xml",                                      name: "O Dia",                     cats: ["brasil-on"] },
  { url: "https://diariodonordeste.verdesmares.com.br/rss.xml",                 name: "Diário do Nordeste",        cats: ["brasil-on"] },
  { url: "https://atarde.com.br/feed/",                                         name: "A Tarde",                   cats: ["brasil-on"] },
  { url: "https://jc.ne10.uol.com.br/feed/",                                   name: "Jornal do Commercio",       cats: ["brasil-on","economia"] },
  // ━━━ INTERNACIONAIS (20) ━━━
  { url: "https://feeds.reuters.com/reuters/topNews",                           name: "Reuters",                   cats: ["internacional","economia","politica"] },
  { url: GN_EN("AP associated press top news world breaking"),                  name: "Associated Press",          cats: ["internacional"] },
  { url: GN_EN("AFP agence france presse breaking news world"),                 name: "AFP",                       cats: ["internacional"] },
  { url: "https://feeds.bloomberg.com/markets/news.rss",                        name: "Bloomberg",                 cats: ["economia","investimentos","internacional"] },
  { url: "https://www.ft.com/rss/home",                                         name: "Financial Times",           cats: ["economia","negocios","investimentos"] },
  { url: "https://feeds.wsj.com/xml/rss/3_7085.xml",                           name: "The Wall Street Journal",   cats: ["economia","negocios","internacional"] },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",             name: "The New York Times",        cats: ["internacional","politica"] },
  { url: "https://feeds.washingtonpost.com/rss/world",                          name: "The Washington Post",       cats: ["internacional","politica"] },
  { url: "https://www.theguardian.com/world/rss",                               name: "The Guardian",              cats: ["internacional","economia","saude"] },
  { url: "https://feeds.bbci.co.uk/news/rss.xml",                              name: "BBC News",                  cats: ["internacional","saude","tecnologia","economia"] },
  { url: "http://rss.cnn.com/rss/edition.rss",                                 name: "CNN International",         cats: ["internacional","politica"] },
  { url: "https://www.aljazeera.com/xml/rss/all.xml",                          name: "Al Jazeera",                cats: ["internacional","politica"] },
  { url: "https://www.scmp.com/rss/91/feed",                                   name: "South China Morning Post",  cats: ["internacional","economia"] },
  { url: "https://asia.nikkei.com/rss/feed/nar",                               name: "Nikkei Asia",               cats: ["economia","negocios","internacional"] },
  { url: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada",   name: "El País",                   cats: ["internacional","cultura","politica"] },
  { url: "https://www.economist.com/rss.xml",                                   name: "The Economist",             cats: ["economia","internacional","politica"] },
  { url: "https://www.politico.com/rss/politicopicks.xml",                      name: "Politico",                  cats: ["internacional","politica"] },
  { url: "https://foreignpolicy.com/feed/",                                     name: "Foreign Policy",            cats: ["internacional","politica"] },
  { url: "https://api.axios.com/feed/",                                         name: "Axios",                     cats: ["internacional","tecnologia","economia"] },
  { url: "https://www.lemonde.fr/rss/une.xml",                                  name: "Le Monde",                  cats: ["internacional","cultura","politica"] },
];

const FAMILIA_CAT = {
  seguros:'financas', investimentos:'financas', economia:'financas',
  negocios:'financas', imoveis:'financas', tributos:'financas', industria:'financas',
  politica:'poder', internacional:'poder', 'brasil-on':'poder',
  esportes:'entretenimento', cultura:'entretenimento', religiao:'entretenimento',
  tecnologia:'conhecimento', saude:'conhecimento', familia:'conhecimento', carreira:'trabalho',
};

const CATEGORIA_PARA_GRUPO = {};

export { FAMILIA_CAT, CATEGORIA_PARA_GRUPO };

// Exported list for manage.js archive action
export const FONTES_APROVADAS_URLS = FEEDS_DIRETOS_GARANTIDOS.map(f => ({ url: f.url, name: f.name, cat: f.cats[0] }));

function parseXmlFallback(xml) {
  const items = [];
  const itemRx = /<(?:item|entry)[\s>][\s\S]*?<\/(?:item|entry)>/gi;
  let m;
  while ((m = itemRx.exec(xml)) !== null) {
    const block = m[0];
    const title = (block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i) || [])[1]?.trim().replace(/<[^>]+>/g, '') || '';
    const link =
      (block.match(/<link[^>]+href=["']([^"']+)["']/i) || [])[1] ||
      (block.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i) || [])[1]?.trim() || '';
    const pubDate = (block.match(/<(?:pubDate|published|updated)[^>]*>([\s\S]*?)<\/(?:pubDate|published|updated)>/i) || [])[1]?.trim() || '';
    const desc = (block.match(/<(?:description|summary|content(?:encoded)?)[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:description|summary|content(?:encoded)?)>/i) || [])[1]?.trim().replace(/<[^>]+>/g, '').slice(0, 500) || '';
    if (title && link) items.push({ title, link, isoDate: pubDate, pubDate, description: desc });
  }
  return items;
}

async function fetchFeed(url) {
  try {
    const res = await axios.get(url, {
      timeout: 5000,
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
      },
      maxRedirects: 5,
      validateStatus: s => s < 500,
    });
    const xml = res.data;
    if (!xml || typeof xml !== 'string' || xml.length < 50) return [];
    try {
      const feed = await parser.parseString(xml);
      if (feed.items && feed.items.length > 0) return feed.items;
    } catch (_) {}
    return parseXmlFallback(xml);
  } catch (_) {
    return [];
  }
}

// REGRA #34: isRecente MÍNIMO 48h — NUNCA reduzir abaixo de 48h
function isRecente(dateStr) {
  if (!dateStr) return false;
  try {
    const itemDate = new Date(dateStr);
    if (isNaN(itemDate.getTime())) return false;
    return (Date.now() - itemDate.getTime()) < 48 * 60 * 60 * 1000;
  } catch (_) { return false; }
}

function extrairItem(i, sourceName) {
  const dateStr = i.isoDate || i.pubDate || i.published || i.updated || "";
  if (!isRecente(dateStr)) return null;
  if (!i.link && !i.guid) return null;
  if (!i.title) return null;
  return {
    title: i.title,
    link: i.link || i.guid,
    source: sourceName,
    description: i.contentSnippet || i.summary || i.description || i.content || "",
    pubDate: dateStr,
  };
}

async function buscarFeedsEmParalelo(feeds) {
  const results = await Promise.allSettled(
    feeds.map(source =>
      fetchFeed(source.url)
        .then(items => items.slice(0, 10)
          .map(i => extrairItem(i, source.name))
          .filter(Boolean))
        .catch(() => [])
    )
  );
  const items = results.filter(r => r.status === "fulfilled").flatMap(r => r.value);
  return dedupPorTitulo(items.sort(() => Math.random() - 0.5));
}

const buscarFeedsEspecificos = buscarFeedsEmParalelo;
export { buscarFeedsEspecificos };

function titulosSimilares(a, b) {
  const norm = t => (t || "").toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 3);
  const wa = new Set(norm(a));
  const wb = new Set(norm(b));
  if (wa.size === 0 || wb.size === 0) return false;
  const intersect = [...wa].filter(w => wb.has(w)).length;
  const union = new Set([...wa, ...wb]).size;
  return (intersect / union) >= 0.65;
}

function dedupPorTitulo(items) {
  const unicos = [];
  for (const item of items) {
    if (!unicos.some(u => titulosSimilares(u.title, item.title))) unicos.push(item);
  }
  return unicos;
}

export async function getNewsByCategoria(categoria) {
  try {
    const fontesCat = FEEDS_DIRETOS_GARANTIDOS.filter(f => Array.isArray(f.cats) && f.cats.includes(categoria));
    // Se menos de 5 fontes para a categoria, usa todas as 70 (conteúdo geral)
    const feedsParaUsar = fontesCat.length >= 5 ? fontesCat : FEEDS_DIRETOS_GARANTIDOS;
    console.log(`[rss] getNewsByCategoria(${categoria}): ${feedsParaUsar.length} fontes`);
    return await buscarFeedsEmParalelo(feedsParaUsar);
  } catch (_) { return []; }
}

export async function getNews() {
  try {
    console.log(`[rss] getNews: ${FEEDS_DIRETOS_GARANTIDOS.length} fontes aprovadas`);
    const items = await buscarFeedsEmParalelo(FEEDS_DIRETOS_GARANTIDOS);
    console.log('[rss] total itens:', items.length);
    if (items.length === 0) {
      // fallback: tentar novamente só com fontes confiáveis BR
      const br = FEEDS_DIRETOS_GARANTIDOS.filter(f => f.cats.includes('brasil-on') || f.cats.includes('economia'));
      return await buscarFeedsEmParalelo(br);
    }
    return dedupPorTitulo(items.sort(() => Math.random() - 0.5));
  } catch (e) {
    console.error('[rss] erro em getNews:', e.message);
    return [];
  }
}
