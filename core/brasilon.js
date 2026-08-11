// core/brasilon.js — Brasil ON: captura de perfis/sites monitorados
//
// Brasil ON é a divisão popular de notícias do OVC (Roberto Terrasan, 11/08/2026):
// reescrita 100% de conteúdo de um número pequeno de perfis/sites específicos,
// quase em tempo real. Opera "dentro do OVC" (mesmo repo/banco/pipeline) mas
// publica sob categoria própria (brasil-on) e, futuramente, sob domínio próprio.
//
// Fase de teste inicial (2 fontes, aprovadas por Roberto):
//   - Bacci Notícias (https://baccinoticias.com.br/) — SEM RSS funcional
//     (/feed/ redireciona pra home — confirmado 11/08/2026), captura via
//     raspagem da homepage + scrape() do artigo (core/scraper.js).
//   - Revista Oeste (https://www.revistaoeste.com/) — RSS funcional em /feed/,
//     inclui <media:content> com imagem em múltiplos tamanhos já prontos.
//
// NUNCA adicionar fonte nova aqui sem aprovação explícita de Roberto (mesmo
// espírito da Regra "NUNCA adicionar fontes sem aprovação" em core/rss.js).
import axios from "axios";
import RSSParser from "rss-parser";

const parser = new RSSParser({ timeout: 8000 });

export const FONTES_BRASILON = [
  { key: "bacci", nome: "Bacci Notícias", homepage: "https://baccinoticias.com.br/" },
  { key: "oeste", nome: "Revista Oeste", feed: "https://www.revistaoeste.com/feed/" }
];

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Páginas da Bacci que NÃO são matéria de verdade — repost cru do Instagram
// ("vi-no-instagram"), institucional, etc. Excluídas do pool de candidatos.
const BACCI_EXCLUIR = /vi-no-instagram|categoria|category|\/tag\/|\/page\/|politica-editorial|politica-de-privacidade|\/contato\/?$|\/sobre\/?$|anuncie|quem-somos/i;

async function buscarBacci() {
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

async function buscarRevistaOeste() {
  try {
    const feed = await parser.parseURL("https://www.revistaoeste.com/feed/");
    return (feed.items || []).slice(0, 15).map(item => ({
      link: item.link || "",
      title: item.title || "",
      source: "Revista Oeste",
      description: item.contentSnippet || item.content || "",
      pubDate: item.isoDate || item.pubDate || new Date().toISOString()
    })).filter(i => i.link);
  } catch (_) {
    return [];
  }
}

// Retorna candidatos das 2 fontes combinados, sem dedup entre si (dedup por
// hash/pauta-parecida acontece no pipeline em api/run_portal.js, igual ao
// resto do OVC).
export async function buscarCandidatosBrasilOn() {
  const [bacci, oeste] = await Promise.all([buscarBacci(), buscarRevistaOeste()]);
  return [...bacci, ...oeste];
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
