// core/economia.js — Economia/Mercado/Finanças: Valor Econômico, Money
// Times e Seu Dinheiro.
//
// Mesma estrutura de Brasil ON/Jovem Pan Política/Internacional/Fofocas.
// Roberto Terrasan, 13/11/2026: "quero que aumente os conteudos de
// economia, mercado, financas, etc" — dentro do redesenho geral do
// volume do OVC (max 50/dia, 85%+ política/economia/finanças/negócios/
// empreendedorismo/indústria/internacional, max 15% o resto).
//
// FONTES ESCOLHIDAS — testadas AO VIVO via GitHub Actions (curl real com
// -L seguindo redirect; este sandbox não tem rede de saída):
// - Valor Econômico — valor.com.br/rss E valor.com.br/financas/rss AMBOS
//   redirecionam pro MESMO feed real: http://pox.globo.com/rss/valor
//   (syndication do Grupo Globo). HTTP 200, 413KB, matéria de minutos
//   antes do teste (13/11/2026). Maior jornal de economia/negócios do
//   Brasil — por isso usar o feed direto (pox.globo.com), não a URL
//   /rss ou /financas/rss (ambas só redirecionam pra ele mesmo).
// - Money Times (moneytimes.com.br/mercados/feed — redireciona mas
//   funciona) — HTTP 200, conteúdo fresco de bolsa/Ibovespa/mercados.
// - Seu Dinheiro (seudinheiro.com/feed/) — HTTP 200, 95KB, ~19 posts/dia
//   (estimativa de terceiro), mercado financeiro geral.
//
// DESCARTADO: InfoMoney (infomoney.com.br/ultimas-noticias/feed/) — feed
// existe e está ativo (lastBuildDate real, do dia do teste), mas vem
// ESTRUTURALMENTE VAZIO — zero <item> dentro do <channel>, confirmado
// lendo o XML bruto (não é bug de parsing nosso).
// RESERVA, não usados por ora: Brazil Journal (braziljournal.com/feed,
// testado e funcional) e Agência Brasil - Economia
// (agenciabrasil.ebc.com.br/rss/economia/feed.xml, testado e funcional).
//
// CATEGORIA — por fonte: Valor Econômico → "economia" (jornal geral de
// economia/negócios); Money Times e Seu Dinheiro → "financas" (mercado
// financeiro/bolsa). Ver uso em api/run_portal.js (salvarEconomia).
//
// IMAGEM — valor.com.br E seudinheiro.com JÁ ESTÃO em COMPETITOR_IMG_HOSTS
// (core/scraper.js) — allowCompetitorImage:true obrigatório nos 3 (Money
// Times não está na lista, mas tratado igual por segurança/consistência:
// fonte single-purpose aprovada por Roberto, imagem sempre da própria
// fonte, mesmo padrão já usado em Jovem Pan Política/jovempan.com.br e
// Futebol/GE Globo pelo mesmo motivo).
//
// NUNCA adicionar fonte nova aqui sem aprovação explícita de Roberto.
import RSSParser from "rss-parser";

export const FONTES_ECONOMIA = [
  { key: "valor-economico", nome: "Valor Econômico", feed: "http://pox.globo.com/rss/valor", categoria: "economia" },
  { key: "money-times", nome: "Money Times", feed: "https://www.moneytimes.com.br/mercados/feed", categoria: "financas" },
  { key: "seu-dinheiro", nome: "Seu Dinheiro", feed: "https://www.seudinheiro.com/feed/", categoria: "financas" }
];

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const parser = new RSSParser({ timeout: 8000, headers: { "User-Agent": UA } });

async function buscarFeed(fonte) {
  try {
    const feed = await parser.parseURL(fonte.feed);
    return (feed.items || []).slice(0, 15)
      .map(item => ({
        link: item.link || "",
        source: fonte.nome,
        categoria: fonte.categoria,
        title: item.title || "",
        description: item.contentSnippet || item.content || "",
        pubDate: item.pubDate || item.isoDate || new Date().toISOString()
      }))
      .filter(i => i.link);
  } catch (_) {
    return [];
  }
}

// Mesmo espírito do filtro de promoção/anúncio já usado nos demais canais
// (Roberto, 12/08/2026: "ATENCAO PARA PROMOCOES, PROPAGANDAS, ANUNCIOS,
// ETC") — sites financeiros costumam ter publieditorial de corretora,
// curso de investimento, etc.
const PROMO_SINAIS_RE = /compre agora|cupom de desconto|c[oó]digo promocional|assine e ganhe|conte[uú]do patrocinado|publieditorial|oferta exclusiva|desconto exclusivo|clique aqui e garanta|abra sua conta e ganhe|invista agora e ganhe|taxa zero por tempo limitado/i;
export function pareceConteudoPromocional(titulo, texto) {
  const alvo = `${titulo || ""} ${texto || ""}`;
  return PROMO_SINAIS_RE.test(alvo);
}

// Retorna candidatos das 3 fontes, embaralhados — mesmo padrão round-robin
// de core/internacional.js/core/fofocas.js (não sempre priorizar a mesma
// fonte no início da fila).
export async function buscarCandidatosEconomia() {
  const [valor, moneytimes, seudinheiro] = await Promise.all([
    buscarFeed(FONTES_ECONOMIA[0]),
    buscarFeed(FONTES_ECONOMIA[1]),
    buscarFeed(FONTES_ECONOMIA[2])
  ]);
  const combinados = [];
  const max = Math.max(valor.length, moneytimes.length, seudinheiro.length);
  for (let i = 0; i < max; i++) {
    if (valor[i]) combinados.push(valor[i]);
    if (moneytimes[i]) combinados.push(moneytimes[i]);
    if (seudinheiro[i]) combinados.push(seudinheiro[i]);
  }
  return combinados;
}
