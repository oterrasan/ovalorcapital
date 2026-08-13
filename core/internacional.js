// core/internacional.js — Internacional: captura de matérias da BBC News e CNN
//
// Mesma estrutura do Brasil ON (core/brasilon.js) e Jovem Pan Política
// (core/jovempanpolitica.js) — Roberto Terrasan, 13/08/2026: "quero
// monitoramento 24 horas por dia em pelo menos 2 sites internacionais de
// relevância mundial... as mesmas regras do Bacci e jovens pan... neste
// caso, internacional cobre tudo o que for internacional, sem restrição
// de temas."
//
// FONTES ESCOLHIDAS — BBC News e CNN International:
// Testadas ao vivo (13/08/2026) contra 6 candidatos: Reuters (HTTP 401,
// bloqueia bot), Bloomberg (HTTP 403, bloqueia bot), Al Jazeera e DW
// (funcionais, mas descartadas — Roberto quer "veiculo grande americano,
// ingles"), New York Post (funcional e imagem limpa, mantido como reserva
// não usado por ora), BBC e CNN (ambas funcionais, exatamente o pedido
// original de Roberto: "CNN / Bloomberg / BBC / New York POST").
//
// IMAGEM — marca d'água autorizada: diferente de Bacci/Jovem Pan, Roberto
// autorizou expressamente usar a imagem do veículo de origem MESMO COM
// marca d'água ("nao tem problema... podem usar estas... que usem marca
// dagua") — confirmado que BBC aplica logo "BBC News" via CDN
// ichef.bbci.co.uk/.../branded_news/... em praticamente toda foto
// editorial. Por isso api/run_portal.js NÃO precisa de
// allowCompetitorImage aqui (bbc.com/cnn.com nem estão em
// COMPETITOR_IMG_HOSTS de core/scraper.js) nem de filtro extra de marca
// d'água — a imagem é salva como vier da fonte.
//
// CAPTURA — sem sitemap dedicado testado como confiável para candidatos
// recentes: raspagem direta das seções internacionais de cada veículo
// (BBC: bbc.com/news/world · CNN: cnn.com/world), mesmo padrão da Jovem
// Pan Política. Ambas testadas com links de matéria reais e datados do
// dia da sessão.
//
// NUNCA adicionar fonte nova aqui sem aprovação explícita de Roberto.
import axios from "axios";

export const FONTES_INTERNACIONAL = [
  { key: "bbc-news", nome: "BBC News", homepage: "https://www.bbc.com/news/world" },
  { key: "cnn-international", nome: "CNN International", homepage: "https://www.cnn.com/world" }
];

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Páginas da seção que não são matéria de verdade (vídeo puro, galeria,
// tag, paginação) OU publicidade/promoção disfarçada de link de matéria.
// Mesmo espírito do filtro em core/jovempanpolitica.js — Roberto,
// 12/08/2026: "ATENCAO PARA PROMOCOES, PROPAGANDAS, ANUNCIOS, ETC"
// (instrução dada para Jovem Pan, aplicada aqui por padrão igual).
const EXCLUIR_URL = /\/video\/|\/videos\/|\/gallery\/|\/live-news\/|\/tag\/|\/page\/|\/author\/|publieditorial|sponsored|advertisement|\/shopping\//i;

const PROMO_SINAIS_RE = /buy now|shop now|discount code|promo code|sponsored content|advertisement feature|exclusive offer|limited time offer|click here to claim|% off\b/i;
export function pareceConteudoPromocional(titulo, texto) {
  const alvo = `${titulo || ""} ${texto || ""}`;
  return PROMO_SINAIS_RE.test(alvo);
}

async function buscarBbcHomepage() {
  try {
    const res = await axios.get("https://www.bbc.com/news/world", { timeout: 10000, headers: { "User-Agent": UA } });
    const html = String(res.data || "");
    const links = [...html.matchAll(/href="(\/news\/articles\/[a-z0-9]+)"/g)].map(m => "https://www.bbc.com" + m[1]);
    const unicos = [...new Set(links)].filter(l => !EXCLUIR_URL.test(l)).slice(0, 15);
    return unicos.map(link => ({ link, source: "BBC News", title: "", description: "", pubDate: new Date().toISOString() }));
  } catch (_) {
    return [];
  }
}

async function buscarCnnHomepage() {
  try {
    const res = await axios.get("https://www.cnn.com/world", { timeout: 10000, headers: { "User-Agent": UA } });
    const html = String(res.data || "");
    const links = [...html.matchAll(/href="(\/2026\/[0-9]{2}\/[0-9]{2}\/[a-zA-Z0-9/._-]+)"/g)].map(m => "https://www.cnn.com" + m[1]);
    const unicos = [...new Set(links)].filter(l => !EXCLUIR_URL.test(l)).slice(0, 15);
    return unicos.map(link => ({ link, source: "CNN International", title: "", description: "", pubDate: new Date().toISOString() }));
  } catch (_) {
    return [];
  }
}

// Retorna candidatos de ambas as fontes internacionais, embaralhados para
// não sempre priorizar a mesma no início da fila (mesmo espírito do que
// autoBrasilOn() já faz ao combinar múltiplas fontes).
export async function buscarCandidatosInternacional() {
  const [bbc, cnn] = await Promise.all([buscarBbcHomepage(), buscarCnnHomepage()]);
  const combinados = [];
  const max = Math.max(bbc.length, cnn.length);
  for (let i = 0; i < max; i++) {
    if (bbc[i]) combinados.push(bbc[i]);
    if (cnn[i]) combinados.push(cnn[i]);
  }
  return combinados;
}
