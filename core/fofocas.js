// core/fofocas.js — Fofocas & Famosos: captura de matérias sobre celebridades,
// artistas, entretenimento e cultura pop.
//
// Mesma estrutura de Brasil ON/Jovem Pan Política/Internacional (Roberto
// Terrasan, 30/08/2026: "Construir uma nova automacao de raspagem identica
// ao que fizemos com a jovem pan e o bacci, para falar sobre famosos,
// artistas, fofocas, etc").
//
// FONTES ESCOLHIDAS — testadas ao vivo (30/08/2026, via GitHub Actions,
// este sandbox não tem rede de saída):
//
// - Ofuxico (ofuxico.com.br) — WordPress + Yoast SEO, MESMA arquitetura da
//   Bacci Notícias (core/brasilon.js): sitemap_index.xml → post-sitemapN.xml,
//   chunk ativo sempre o ÚLTIMO da lista. Confirmado: HTTP 200, 1.001 URLs
//   no chunk atual, lastmod de ~40min de idade no momento do teste. NÃO
//   está em COMPETITOR_IMG_HOSTS (core/scraper.js) — imagem própria sem
//   precisar de allowCompetitorImage.
// - Terra Diversão & Gente (terra.com.br/diversao/gente/) — raspagem de
//   homepage, mesmo padrão de Jovem Pan Política/BBC/CNN. Confirmado ao
//   vivo com artigo real (Ana Castela): título e og:image presentes,
//   imagem hospedada em p2.trrsf.com (CDN própria da Terra — NÃO cai na
//   entrada "terra.com.br" de COMPETITOR_IMG_HOSTS, que só bloqueia esse
//   host exato ou subdomínios dele). ⚠️ Marca d'água NÃO confirmada
//   visualmente (sem acesso a navegador neste sandbox) — Roberto deve
//   checar as primeiras publicações reais e avisar se aparecer marca da
//   Terra nas fotos.
//
// Candidatos testados e DESCARTADOS nesta sessão: Purepeople (404 em
// sitemap e /feed/), Quem/Globo (404 em sitemap e rss), Caras e Contigo
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
  { key: "terra-diversao-gente", nome: "Terra Diversão & Gente", homepage: "https://www.terra.com.br/diversao/gente/" }
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

const TERRA_EXCLUIR = /\/video\/|\/videos\/|\/galeria\/|\/tag\/|\/page\/|\/autor\//i;

async function buscarTerraDiversaoGente() {
  try {
    const res = await axios.get("https://www.terra.com.br/diversao/gente/", {
      timeout: 10000, headers: { "User-Agent": UA }
    });
    const html = String(res.data || "");
    const links = [...html.matchAll(/href="(https:\/\/www\.terra\.com\.br\/diversao\/gente\/[a-z0-9-]{10,}[^"]*\.html)"/g)].map(m => m[1]);
    const unicos = [...new Set(links)].filter(l => !TERRA_EXCLUIR.test(l)).slice(0, 15);
    return unicos.map(link => ({
      link, source: "Terra Diversão & Gente", title: "", description: "", pubDate: new Date().toISOString()
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
  const [ofuxico, terra] = await Promise.all([buscarOfuxicoSitemap(), buscarTerraDiversaoGente()]);
  const combinados = [];
  const max = Math.max(ofuxico.length, terra.length);
  for (let i = 0; i < max; i++) {
    if (ofuxico[i]) combinados.push(ofuxico[i]);
    if (terra[i]) combinados.push(terra[i]);
  }
  return combinados;
}
