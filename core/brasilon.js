// core/brasilon.js — Brasil ON: captura de perfis/sites monitorados
//
// Brasil ON é a divisão popular de notícias do OVC (Roberto Terrasan, 11/08/2026):
// reescrita 100% de conteúdo de um número pequeno de perfis/sites específicos,
// quase em tempo real. Opera "dentro do OVC" (mesmo repo/banco/pipeline) mas
// publica sob categoria própria (brasil-on) e, futuramente, sob domínio próprio.
//
// Fase de teste inicial — SOMENTE Bacci Notícias por enquanto (Roberto,
// 11/08/2026: "esqueca a oeste. remova e mantenha somente o bacci por
// enquanto"). Revista Oeste (www.revistaoeste.com) foi removida — o site
// está atrás de proteção Cloudflare que bloqueou 100% dos testes desta
// sessão com HTTP 403, e em produção causava posts publicados sem imagem
// (og:image não extraído de forma confiável). Bacci nunca teve esse
// problema — 100% de sucesso em todos os testes desta sessão.
//   - Bacci Notícias (https://baccinoticias.com.br/) — SEM RSS funcional
//     (/feed/ redireciona pra home — confirmado 11/08/2026).
//
// CAPTURA — reescrito 12/08/2026 (mesma sessão, poucas horas depois do
// lançamento). Root cause de "nada novo há horas" reportado por Roberto:
// a raspagem original (regex na home) só encontrava ~3 links úteis, SEMPRE
// os mesmos, por horas seguidas — confirmado via workflow one-off que a
// home da Bacci, como o nosso scraper via, tem só 37KB e 3 links de
// matéria (contra dezenas de matérias/dia reais do site). A causa exata
// (bot-detection, home parcialmente renderizada por JS, cache de borda)
// não foi 100% isolada — mas achamos fonte MUITO melhor: a Bacci roda
// WordPress com Yoast SEO, que expõe `sitemap_index.xml` → lista de
// `post-sitemapN.xml`, cada um com até 1000 URLs + <lastmod>. O chunk MAIS
// RECENTE é sempre o ÚLTIMO da lista (Yoast preenche em ordem cronológica,
// nunca insere/atualiza chunks antigos). Confirmado ao vivo (12/08/2026,
// via workflow one-off): esse sitemap tinha o post mais novo com apenas
// ~40min de idade, e dezenas de posts das últimas 6h — o scraper de home
// não via NENHUM deles. Sitemap é HTML estático puro (sem depender de JS
// renderizado) e não exige adivinhar layout de cards.
//
// buscarBacciSitemap() é agora o caminho PRIMÁRIO. buscarBacciHomepage()
// (a raspagem original) fica como FALLBACK só se o sitemap falhar/mudar de
// estrutura — nunca remover o fallback, WordPress plugins podem sumir.
//
// NUNCA adicionar fonte nova aqui sem aprovação explícita de Roberto (mesmo
// espírito da Regra "NUNCA adicionar fontes sem aprovação" em core/rss.js).
import axios from "axios";

export const FONTES_BRASILON = [
  { key: "bacci", nome: "Bacci Notícias", homepage: "https://baccinoticias.com.br/" }
];

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Páginas da Bacci que NÃO são matéria de verdade — repost cru do Instagram
// ("vi-no-instagram"), institucional, etc. Excluídas do pool de candidatos.
const BACCI_EXCLUIR = /vi-no-instagram|categoria|category|\/tag\/|\/page\/|politica-editorial|politica-de-privacidade|\/contato\/?$|\/sobre\/?$|anuncie|quem-somos/i;

// Janela de recência: só usa candidatos do sitemap publicados nas últimas
// N horas — mantém o espírito "quase instantâneo" do Brasil ON e evita
// reprocessar o histórico inteiro (chunk atual tem até 1000 URLs).
const SITEMAP_JANELA_HORAS = 8;

async function buscarBacciSitemap() {
  try {
    const idxRes = await axios.get("https://baccinoticias.com.br/sitemap_index.xml", {
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
    }).filter(e => e.loc && !BACCI_EXCLUIR.test(e.loc));
    entradas.sort((a, b) => new Date(b.lastmod) - new Date(a.lastmod));
    const corte = Date.now() - SITEMAP_JANELA_HORAS * 60 * 60 * 1000;
    const recentes = entradas.filter(e => new Date(e.lastmod).getTime() >= corte);
    const usados = (recentes.length ? recentes : entradas).slice(0, 15);
    return usados.map(e => ({
      link: e.loc, source: "Bacci Notícias", title: "", description: "",
      pubDate: e.lastmod || new Date().toISOString()
    }));
  } catch (_) {
    return [];
  }
}

// FALLBACK — raspagem direta da home (método original). Só é usado se o
// sitemap falhar ou não retornar nada.
async function buscarBacciHomepage() {
  try {
    const res = await axios.get("https://baccinoticias.com.br/", {
      timeout: 10000,
      headers: { "User-Agent": UA }
    });
    const html = String(res.data || "");
    const links = [...html.matchAll(/href="(https:\/\/baccinoticias\.com\.br\/[a-z0-9-]{15,}\/?)"/g)].map(m => m[1]);
    const unicos = [...new Set(links)].filter(l => !BACCI_EXCLUIR.test(l)).slice(0, 15);
    return unicos.map(link => ({
      link, source: "Bacci Notícias", title: "", description: "", pubDate: new Date().toISOString()
    }));
  } catch (_) {
    return [];
  }
}

async function buscarBacci() {
  const viaSitemap = await buscarBacciSitemap();
  if (viaSitemap.length) return viaSitemap;
  return await buscarBacciHomepage();
}

// Retorna candidatos das fontes ativas (só Bacci por enquanto, ver nota no
// topo do arquivo). Dedup por hash/pauta-parecida acontece no pipeline em
// api/run_portal.js, igual ao resto do OVC.
export async function buscarCandidatosBrasilOn() {
  return await buscarBacci();
}

// Detecta posts institucionais/autopromoção de programa de TV/rádio do
// PRÓPRIO site fonte — não são notícia, são propaganda de um programa deles.
// Caso real, Roberto Terrasan 11/08/2026: post "Programa Esporte sem Firula
// é exibido diariamente ao meio-dia" (Bacci) publicado como se fosse matéria.
//
// CORRIGIDO 11/08/2026 (2ª iteração): a versão original (2+ sinais em
// qualquer lugar do texto) NÃO capturou uma segunda variação do MESMO
// anúncio, vinda via Revista Oeste com wording diferente ("Programa Esporte
// sem Firula é exibido de segunda a sexta-feira" — sem a grade "das Xh às
// Yh" explícita, então só batia 1 sinal). Duas causas, ambas corrigidas:
// (a) BUG DE REGEX — `\b` (word boundary) do JS nunca casa imediatamente
//     antes de uma letra acentuada (é, à, í...) porque o `\w` do JS é
//     ASCII-only. `\b(é exibido|...)` NUNCA batia — confirmado isolado:
//     /\bé exibido\b/i.test("é exibido") === false. O sinal "verbo de
//     exibição" estava morto silenciosamente desde a 1ª versão do filtro;
//     só funcionava por acidente quando grade+elenco batiam junto.
// (b) LIMIAR — quando o TÍTULO começa literalmente com "Programa " (ou
//     seja, o post é SOBRE o programa em si, não notícia que o menciona de
//     passagem), basta 1 sinal pra bloquear. Testado contra o caso real
//     "PF prende suspeito... durante participação no programa Bom Dia
//     Brasil, que é exibido diariamente..." — título NÃO começa com
//     "Programa", cai no fallback de 2+ sinais, não bloqueia (correto).
const _TITULO_COMECA_PROGRAMA_RE = /^programa\s+/i;
const _ANUNCIO_VERBO_RE = /(é exibido|é transmitido|vai ao ar|estreia\b|chega à\s)/i;
const _ANUNCIO_GRADE_RE = /de segunda a sexta[^.]{0,30}das\s?\d{1,2}h[^.]{0,20}às\s?\d{1,2}h/i;
const _ANUNCIO_ELENCO_RE = /\b(sob a apresentação de|com a participação dos comentaristas|apresentado por)\b/i;
export function pareceAnuncioDePrograma(titulo, texto) {
  const t = String(titulo || "").trim();
  const alvo = `${titulo || ""} ${texto || ""}`;
  const temSinal = _ANUNCIO_VERBO_RE.test(alvo) || _ANUNCIO_GRADE_RE.test(alvo) || _ANUNCIO_ELENCO_RE.test(alvo);
  if (_TITULO_COMECA_PROGRAMA_RE.test(t)) return temSinal;
  let sinais = 0;
  if (_ANUNCIO_VERBO_RE.test(alvo)) sinais++;
  if (_ANUNCIO_GRADE_RE.test(alvo)) sinais++;
  if (_ANUNCIO_ELENCO_RE.test(alvo)) sinais++;
  return sinais >= 2;
}
