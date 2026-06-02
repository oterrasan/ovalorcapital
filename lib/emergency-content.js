import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const LIVE_PATH = fileURLToPath(new URL("../data/live-snapshot.json", import.meta.url));
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
  const rows = [
    ...readList(LIVE_PATH),
    ...readList(DATA_PATH)
  ];
  const seenIds = new Set();
  const seenTitles = new Set();
  cache = rows.map(normalizeArticle).filter(Boolean).filter(article => {
    const idKey = String(article.id || "").slice(0, 8).toLowerCase();
    const titleKey = slugify(article.titulo).slice(0, 55);
    if ((idKey && seenIds.has(idKey)) || (titleKey && seenTitles.has(titleKey))) return false;
    if (idKey) seenIds.add(idKey);
    if (titleKey) seenTitles.add(titleKey);
    return true;
  }).sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
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

function readList(path) {
  try {
    const data = JSON.parse(readFileSync(path, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch (_) {
    return [];
  }
}

function normalizeArticle(article, index) {
  if (!article) return null;
  const title = String(article.title || article.titulo || "").trim();
  if (!title) return null;

  const tags = parseTags(article.user_tags);
  const cat = normalizeCat(article.category || tags[0]) || "politica";
  const slug = slugify(article.slug || title);
  const sourceId = String(article.id || "").trim();
  const id = isUuid(sourceId) ? sourceId : stableUuid(`${sourceId || index}|${slug}|${title}`);
  const excerpt = String(article.excerpt || article.comentario_fixado || "").trim() || `Leitura editorial do O Valor Capital sobre ${title}.`;
  const body = String(article.body || article.conteudo || "").trim() || paragraphsFor(title, excerpt);
  const date = article.publishedAt || article.published_at || article.createdAt || article.created_at || "2026-03-16T07:00:00.000Z";
  const section = article.section || article.subcategoria_slug || "geral";

  return {
    id,
    titulo: title,
    comentario_fixado: excerpt,
    conteudo: body,
    imagem: safeImage(article.image || article.imagem),
    user_tags: JSON.stringify([cat, section].filter(Boolean)),
    subcategoria: article.sectionLabel || article.subcategoria || article.section || "Geral",
    subcategoria_slug: slugify(section),
    created_at: article.createdAt || article.created_at || date,
    published_at: date,
    updated_at: article.updatedAt || article.updated_at || date,
    metrics: { views: Math.max(1, 1000 - index) },
    _rank: Math.max(1, 1000 - index),
    _emergency: true
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

function safeImage(url) {
  const value = String(url || "").trim();
  if (!/^https?:\/\//i.test(value)) return DEFAULT_IMAGE;
  if ((value.match(/https?:\/\//gi) || []).length > 1) return DEFAULT_IMAGE;
  if (/supabase\.co\/storage/i.test(value)) return DEFAULT_IMAGE;
  if (/\.(svg|gif)(\?|$)/i.test(value)) return DEFAULT_IMAGE;
  const safeHosts = [
    /^https:\/\/www\.ovalorcapital\.com\.br\//i,
    /^https:\/\/images\.unsplash\.com\//i,
    /^https:\/\/images\.pexels\.com\//i,
    /^https:\/\/cdn\.pixabay\.com\//i,
    /^https:\/\/upload\.wikimedia\.org\//i
  ];
  return safeHosts.some(rx => rx.test(value)) ? value : DEFAULT_IMAGE;
}

function parseTags(value) {
  try { return typeof value === "string" ? JSON.parse(value) : (Array.isArray(value) ? value : []); }
  catch (_) { return []; }
}
function isUuid(value) { return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value); }
function normalizeCat(cat) { const value = String(cat || "").toLowerCase().trim(); return CAT_ALIAS[value] || value; }
function firstTag(post) { const tags = parseTags(post.user_tags); return normalizeCat(tags[0]) || "politica"; }
function stableUuid(seed) { const h = stableHash(seed).padEnd(32, "0"); return `${h.slice(0, 8)}-${h.slice(8, 12)}-4000-8000-${h.slice(20, 32)}`; }
function stableHash(seed) { return createHash("sha1").update(String(seed || "")).digest("hex"); }
function titleFromSlug(slug) { return String(slug || "conteudo-ovc").replace(/-/g, " ").trim().replace(/\b\w/g, c => c.toUpperCase()); }
function escapeHtml(s) { return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
export function emergencyCategoryPath(cat) { return CAT_PATH[normalizeCat(cat)] || "politica"; }
