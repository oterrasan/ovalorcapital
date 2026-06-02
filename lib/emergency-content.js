import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const DATA_PATH = fileURLToPath(new URL("../data/articles.json", import.meta.url));
const DEFAULT_IMAGE = "https://www.ovalorcapital.com.br/assets/template-ovc.jpg";

const CAT_ALIAS = { tributos: "tributacao", vc: "colunistas" };

const CAT_PATH = {
  politica: "politica", economia: "economia", negocios: "negocios", investimentos: "investimentos",
  seguros: "seguros", mercados: "mercados", educacao: "educacao", industria: "industria",
  tecnologia: "tecnologia", esportes: "esportes", saude: "saude", familia: "familia",
  tributacao: "tributos", regulacao: "regulacao", parcerias: "parcerias", colunistas: "colunistas",
  internacional: "internacional", variedades: "variedades", investigativo: "investigativo", seguranca: "seguranca",
  cultura: "cultura", profissoes: "profissoes", vagas: "vagas", concursos: "concursos", imoveis: "imoveis",
  esg: "esg", defesa: "defesa", religiao: "religiao", radar: "radar", geral: "politica"
};

let cache = null;

export function slugify(str) {
  return (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60);
}

export function emergencyPosts() {
  if (cache) return cache;
  try {
    const raw = JSON.parse(readFileSync(DATA_PATH, "utf8"));
    cache = raw.map(normalizeArticle).filter(Boolean)
      .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  } catch (_) { cache = []; }
  return cache;
}

export function emergencyList({ categoria, limit = 40, page = 0, q = "", sort = "" } = {}) {
  const wanted = normalizeCat(categoria);
  const term = String(q || "").trim().toLowerCase();
  const max = Math.min(Math.max(Number(limit) || 40, 1), 80);
  const start = Math.max(Number(page) || 0, 0) * max;
  let posts = emergencyPosts();
  if (wanted && wanted !== "all") posts = posts.filter(p => firstTag(p) === wanted);
  if (term) posts = posts.filter(p => (`${p.titulo || ""} ${p.comentario_fixado || ""} ${p.conteudo || ""}`).toLowerCase().includes(term));
  if (sort === "popular") posts = [...posts].sort((a, b) => (b._rank || 0) - (a._rank || 0));
  return posts.slice(start, start + max);
}

export function emergencyById8(id8) {
  const wanted = String(id8 || "").slice(0, 8).toLowerCase();
  if (!wanted) return null;
  return emergencyPosts().find(p => p.id.slice(0, 8).toLowerCase() === wanted) || null;
}

export function emergencyByArticleSlug(slug, catKey) {
  const rawSlug = String(slug || "").replace(/\/+$/g, "");
  const idMatch = rawSlug.match(/-([a-f0-9]{8})$/i);
  const id8 = idMatch ? idMatch[1].toLowerCase() : "";
  const byId = emergencyById8(id8);
  if (byId) return byId;
  const slugBase = idMatch ? rawSlug.slice(0, -9) : rawSlug;
  const bySlug = emergencyPosts().find(p => slugify(p.titulo) === slugBase || p.slug === slugBase);
  if (bySlug) return bySlug;
  return syntheticArticle(slugBase || rawSlug, id8, catKey);
}

function normalizeArticle(article, index) {
  if (!article || !article.title) return null;
  const cat = normalizeCat(article.category) || "politica";
  const title = String(article.title || "").trim();
  const slug = slugify(article.slug || title);
  const id = stableUuid(`${article.id || index}|${slug}|${title}`);
  const excerpt = String(article.excerpt || "").trim() || `Leitura editorial do O Valor Capital sobre ${title}.`;
  const body = String(article.body || "").trim() || paragraphsFor(title, excerpt);
  const date = article.publishedAt || article.createdAt || "2026-03-16T07:00:00.000Z";
  return {
    id, titulo: title, comentario_fixado: excerpt, conteudo: body, imagem: article.image || DEFAULT_IMAGE,
    user_tags: JSON.stringify([cat, article.section || "geral"].filter(Boolean)),
    subcategoria: article.sectionLabel || article.section || "Geral",
    subcategoria_slug: slugify(article.section || "geral"),
    created_at: date, published_at: date, updated_at: date,
    metrics: { views: Math.max(1, 1000 - index) }, _rank: Math.max(1, 1000 - index), _emergency: true
  };
}

function syntheticArticle(slugBase, id8, catKey) {
  const cat = normalizeCat(catKey) || "politica";
  const cleanSlug = slugify(slugBase || "conteudo-ovc");
  const title = titleFromSlug(cleanSlug);
  const id = id8 ? `${id8}-0000-4000-8000-${stableHash(cleanSlug).slice(0, 12)}` : stableUuid(cleanSlug);
  const now = new Date().toISOString();
  const excerpt = "Pagina mantida no ar enquanto a base editorial do O Valor Capital e recomposta em modo de contingencia.";
  return {
    id, titulo: title, comentario_fixado: excerpt, conteudo: paragraphsFor(title, excerpt), imagem: DEFAULT_IMAGE,
    user_tags: JSON.stringify([cat, "recuperacao-editorial"]), subcategoria: "Recuperacao editorial",
    subcategoria_slug: "recuperacao-editorial", created_at: now, published_at: now, updated_at: now,
    metrics: { views: 1 }, _rank: 1, _emergency: true
  };
}

function paragraphsFor(_title, excerpt) {
  return [
    `<p><strong>Redacao OVC</strong> - ${new Date().toLocaleDateString("pt-BR")}</p>`,
    `<p>${escapeHtml(excerpt)}</p>`,
    `<p>Esta pagina foi preservada para manter o acesso publico, a estrutura editorial e o endereco original durante a contingencia tecnica do banco de dados.</p>`,
    `<h2>Leitura OVC</h2>`,
    `<p>O conteudo sera recomposto com a versao integral assim que a base operacional estiver novamente disponivel. A prioridade neste momento e impedir erro publico, pagina em branco ou perda de rota indexada.</p>`,
    `<h2>Conclusao OVC</h2>`,
    `<p>O Valor Capital mantem esta URL ativa para proteger a continuidade editorial e a experiencia do leitor enquanto a restauracao definitiva dos dados e concluida.</p>`
  ].join("");
}

function normalizeCat(cat) { const value = String(cat || "").toLowerCase().trim(); return CAT_ALIAS[value] || value; }
function firstTag(post) { try { const tags = typeof post.user_tags === "string" ? JSON.parse(post.user_tags) : (post.user_tags || []); return normalizeCat(tags[0]); } catch (_) { return "politica"; } }
function stableUuid(seed) { const h = stableHash(seed).padEnd(32, "0"); return `${h.slice(0, 8)}-${h.slice(8, 12)}-4000-8000-${h.slice(20, 32)}`; }
function stableHash(seed) { return createHash("sha1").update(String(seed || "")).digest("hex"); }
function titleFromSlug(slug) { return String(slug || "conteudo-ovc").replace(/-/g, " ").trim().replace(/\b\w/g, c => c.toUpperCase()); }
function escapeHtml(s) { return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
export function emergencyCategoryPath(cat) { return CAT_PATH[normalizeCat(cat)] || "politica"; }
