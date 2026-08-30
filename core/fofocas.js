// core/fofocas.js — Fofocas & Famosos: captura de matérias sobre celebridades,
// artistas, entretenimento e cultura pop.
//
// Mesma estrutura de Brasil ON/Jovem Pan Política/Internacional (Roberto
// Terrasan, 30/08/2026: "Construir uma nova automacao de raspagem identica
// ao que fizemos com a jovem pan e o bacci, para falar sobre famosos,
// artistas, fofocas, etc").
//
// FONTES ESCOLHIDAS — testadas ao vivo via GitHub Actions (este sandbox não
// tem rede de saída). Roberto (30/08/2026): "quero apenas uma destas
// fontes, no maximo duas, porque vai acabar gerando assuntos identicos" —
// cap de 2 fontes, aplicado abaixo.
//
// - Ofuxico (ofuxico.com.br) — WordPress + Yoast SEO, MESMA arquitetura da
//   Bacci Notícias (core/brasilon.js): sitemap_index.xml → post-sitemapN.xml,
//   chunk ativo sempre o ÚLTIMO da lista. Confirmado: HTTP 200, 1.001 URLs
//   no chunk atual, lastmod de ~40min de idade no momento do teste. NÃO
//   está em COMPETITOR_IMG_HOSTS (core/scraper.js) — imagem própria sem
//   precisar de allowCompetitorImage. 3 imagens reais inspecionadas
//   visualmente — todas limpas, sem marca d'água/logo.
// - Leo Dias (portalleodias.com) — Roberto (30/08/2026): "raspa leo dias
//   tambem. tudo pro GIRO". WordPress com plugin de sitemap DIFERENTE do
//   Yoast (Google Sitemap Generator, arnebrachhold): entry point é
//   /sitemap.xml (não /sitemap_index.xml, que dá 404), contendo um
//   <sitemapindex> com MUITOS tipos de sub-sitemap (tags, categorias,
//   autores, arquivo por data) além dos de matéria de verdade
//   (post-sitemapN.xml, hoje até o 70) — filtrar especificamente por esse
//   padrão antes de pegar o último (mesma heurística "pega o chunk mais
//   alto" da Ofuxico, mas precisa filtrar os outros tipos primeiro, senão
//   pega o índice de arquivo por data por engano). Imagem hospedada em
//   assets.portalleodias.com (CDN própria deles) — NÃO está em
//   COMPETITOR_IMG_HOSTS. ⚠️ ACHADO REAL (25/08/2026, verificado
//   visualmente): 1 de 3 imagens de amostra trazia a logo "LEO DIAS" bem
//   visível na flâmula do microfone do repórter deles (foto de cobertura
//   ao vivo) — as outras 2 (fotos pessoais/paparazzi) vieram limpas. Por
//   isso este canal usa geminiVision:true (fail-closed) em
//   processAndSaveImage() — ver core/image_processor.js — em vez do
//   skipVision:true simples usado por Brasil ON/Jovem Pan/Internacional
//   (cujas fontes foram confirmadas sem esse risco).
//   robots.txt deles desautoriza vários bots de IA (ClaudeBot, GPTBot,
//   Google-Extended, etc. — sinal voluntário Content-Signal, não bloqueio
//   técnico) — o scraper do OVC nunca se identifica como nenhum desses
//   (User-Agent genérico de navegador Chrome, sem nenhum header que
//   identifique o OVC — ver core/scraper.js scrape()), então não há
//   nenhum jeito técnico de o site detectar/atribuir a raspagem a nós.
//   Roberto autorizou explicitamente mesmo ciente disso.
//
// Candidatos testados e DESCARTADOS: Terra Diversão & Gente (funcionava —
// removida só pelo cap de 2 fontes, em favor da Leo Dias), Purepeople (404
// em sitemap e /feed/), Quem/Globo (404 em sitemap e rss), Caras e Contigo
// (403 Cloudflare — mesmo bloqueio já visto e descartado na Revista
// Oeste), Hugogloss (HTTP 200 mas nenhum link de matéria extraível via
// regex simples na home — provável conteúdo carregado via JS), Metrópoles
// Famosos (404 na seção /famosos específica, embora o domínio tenha
// sitemap_index.xml — não investigado a fundo por já estar em
// COMPETITOR_IMG_HOSTS, exigiria allowCompetitorImage), Estrelando
// (redirect 301, não seguido/confirmado).
//
// NUNCA adicionar fonte nova aqui sem aprovação explícita de Roberto (mesmo
// espírito da regra em core/rss.js, core/brasilon.js e demais canais).
import axios from "axios";

export const FONTES_FOFOCAS = [
  { key: "ofuxico", nome: "Ofuxico", homepage: "https://ofuxico.com.br/" },
  { key: "leo-dias", nome: "Leo Dias", homepage: "https://portalleodias.com/" }
];

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Janela de recência do sitemap da Ofuxico — mesmo espírito de
// SITEMAP_JANELA_HORAS em core/brasilon.js.
const OFUXICO_JANELA_HORAS = 8;

// Páginas que NÃO são matéria de verdade (listagem geral, categoria, tag,
// institucional).
const OFUXICO_EXCLUIR = /todas-as-noticias|\/categoria\/|\/category\/|\/tag\/|\/page\/|\/autor\/|\/author\/|politica-de-privacidade|\/contato\/?$|\/sobre\/?$|anuncie|quem-somos/i;

async function buscarOfuxicoSitemap() {
  try {
    const idxRes = await axios.get("https://ofuxico.com.br/sitemap_index.xml", {
      timeout: 8000, headers: { "User-Agent": UA }
    });
    const idxXml = String(idxRes.data || "");
    const locs = [...idxXml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
    // Yoast lista os post-sitemapN.xml em ordem crescente — o ÚLTIMO da
    // lista é sempre o chunk ativo, onde posts novos são anexados.
    const postSitemaps = locs.filter(l => /\/post-sitemap\d*\.xml$/.test(l));
    if (!postSitemaps.length) return [];
    const chunkAtual = postSitemaps[postSitemaps.length - 1];
    const smRes = await axios.get(chunkAtual, { timeout: 8000, headers: { "User-Agent": UA } });
    const smXml = String(smRes.data || "");
    const blocos = [...smXml.matchAll(/<url>([\s\S]*?)<\/url>/g)];
    const entradas = blocos.map(b => {
      const loc = (b[1].match(/<loc>(.*?)<\/loc>/) || [])[1] || "";
      const lastmod = (b[1].match(/<lastmod>(.*?)<\/lastmod>/) || [])[1] || "";
      return { loc, lastmod };
    }).filter(e => e.loc && !OFUXICO_EXCLUIR.test(e.loc));
    entradas.sort((a, b) => new Date(b.lastmod) - new Date(a.lastmod));
    const corte = Date.now() - OFUXICO_JANELA_HORAS * 60 * 60 * 1000;
    const recentes = entradas.filter(e => new Date(e.lastmod).getTime() >= corte);
    const usados = (recentes.length ? recentes : entradas).slice(0, 15);
    return usados.map(e => ({
      link: e.loc, source: "Ofuxico", title: "", description: "",
      pubDate: e.lastmod || new Date().toISOString()
    }));
  } catch (_) {
    return [];
  }
}

// Janela de recência do sitemap da Leo Dias — mesmo espírito de
// OFUXICO_JANELA_HORAS acima.
const LEODIAS_JANELA_HORAS = 8;

// Páginas que NÃO são matéria de verdade — mesmo espírito de OFUXICO_EXCLUIR.
const LEODIAS_EXCLUIR = /\/categoria\/|\/category\/|\/tag\/|\/page\/|\/autor\/|\/author\/|politica-de-privacidade|\/contato\/?$|\/sobre\/?$|anuncie|quem-somos/i;

async function buscarLeoDiasSitemap() {
  try {
    const idxRes = await axios.get("https://portalleodias.com/sitemap.xml", {
      timeout: 8000, headers: { "User-Agent": UA }
    });
    const idxXml = String(idxRes.data || "");
    const locs = [...idxXml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
    // Plugin diferente do Yoast — o índice tem MUITOS tipos de sub-sitemap
    // (tags, categoria, autores, arquivo por data). Filtrar especificamente
    // post-sitemapN.xml (matérias de verdade) antes de pegar o último —
    // senão pega o índice de arquivo por data por engano (confirmado ao
    // vivo, 25/08/2026).
    const postSitemaps = locs.filter(l => /\/post-sitemap\d*\.xml$/.test(l));
    if (!postSitemaps.length) return [];
    const chunkAtual = postSitemaps[postSitemaps.length - 1];
    const smRes = await axios.get(chunkAtual, { timeout: 8000, headers: { "User-Agent": UA } });
    const smXml = String(smRes.data || "");
    const blocos = [...smXml.matchAll(/<url>([\s\S]*?)<\/url>/g)];
    const entradas = blocos.map(b => {
      const loc = (b[1].match(/<loc>(.*?)<\/loc>/) || [])[1] || "";
      const lastmod = (b[1].match(/<lastmod>(.*?)<\/lastmod>/) || [])[1] || "";
      return { loc, lastmod };
    }).filter(e => e.loc && !LEODIAS_EXCLUIR.test(e.loc));
    entradas.sort((a, b) => new Date(b.lastmod) - new Date(a.lastmod));
    const corte = Date.now() - LEODIAS_JANELA_HORAS * 60 * 60 * 1000;
    const recentes = entradas.filter(e => new Date(e.lastmod).getTime() >= corte);
    const usados = (recentes.length ? recentes : entradas).slice(0, 15);
    return usados.map(e => ({
      link: e.loc, source: "Leo Dias", title: "", description: "",
      pubDate: e.lastmod || new Date().toISOString()
    }));
  } catch (_) {
    return [];
  }
}

// Mesmo espírito de filtro de promoção/anúncio já usado nos demais canais
// (Roberto, 12/08/2026: "ATENCAO PARA PROMOCOES, PROPAGANDAS, ANUNCIOS,
// ETC") — sites de fofoca costumam ter publieditorial de produto de beleza,
// curso, etc.
const PROMO_SINAIS_RE = /compre agora|cupom de desconto|c[oó]digo promocional|assine e ganhe|conte[uú]do patrocinado|publieditorial|oferta exclusiva|desconto exclusivo|frete gr[aá]tis|de\s?r\$\s?[\d.,]+\s?por\s?r\$\s?[\d.,]+|clique aqui e garanta|aproveite antes que acabe/i;
export function pareceConteudoPromocional(titulo, texto) {
  const alvo = `${titulo || ""} ${texto || ""}`;
  return PROMO_SINAIS_RE.test(alvo);
}

// Retorna candidatos de ambas as fontes, embaralhados para não sempre
// priorizar a mesma no início da fila (mesmo padrão de
// core/internacional.js).
export async function buscarCandidatosFofocas() {
  const [ofuxico, leodias] = await Promise.all([buscarOfuxicoSitemap(), buscarLeoDiasSitemap()]);
  const combinados = [];
  const max = Math.max(ofuxico.length, leodias.length);
  for (let i = 0; i < max; i++) {
    if (ofuxico[i]) combinados.push(ofuxico[i]);
    if (leodias[i]) combinados.push(leodias[i]);
  }
  return combinados;
}
