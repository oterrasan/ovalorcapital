import { createClient } from "@supabase/supabase-js";
import { emergencyPosts } from "../lib/emergency-content.js";

const supabase = createClient("https://yntwvfcxjardzafdqanj.supabase.co", process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40");

const BASE = "https://www.ovalorcapital.com.br";
const PAGE_SIZE = 500;

// 27/08/2026 — CRÍTICO: este mapa estava desatualizado desde a reestruturação
// de categorias de 24/06/2026 — faltavam "brasil-on" e "financas" (as duas
// categorias mais usadas hoje, incluindo TODO o Brasil ON/Bacci e a maior
// parte do pipeline geral), então TODO post nessas categorias caía no
// fallback `|| "politica"` em sendPostUrlset() e o sitemap anunciava pro
// Google uma URL ERRADA (ex: /politica/titulo-id8/ pra um post que é
// brasil-on de verdade) — o canonical real da página (api/article.js, que
// já usa o mapa certo) aponta pra /brasil-on/titulo-id8/, uma URL diferente
// da anunciada. Isso é exatamente o padrão "Página alternativa com tag
// canônica adequada" que dominava o Google Search Console. Mapa agora é
// cópia exata do CAT_PATH de api/article.js — mesma fonte da verdade.
const CAT_PATH = {
  "brasil-on": "brasil-on", politica: "politica", economia: "economia",
  financas: "financas", negocios: "negocios", tecnologia: "tecnologia",
  internacional: "internacional", industria: "industria", familia: "familia",
  esportes: "esportes", vc: "colunistas", colunistas: "colunistas",
  // Legado → novas categorias (artigos antigos no banco, mesmo de-para de article.js)
  investimentos: "financas", seguros: "financas", mercados: "financas",
  saude: "brasil-on", carreira: "brasil-on", imoveis: "brasil-on",
  cultura: "brasil-on", religiao: "brasil-on", educacao: "brasil-on",
  variedades: "brasil-on", investigativo: "brasil-on", seguranca: "brasil-on",
  esg: "brasil-on", defesa: "brasil-on", profissoes: "brasil-on",
  vagas: "brasil-on", concursos: "brasil-on", parcerias: "negocios",
  tributos: "economia", tributacao: "economia", regulacao: "economia",
  geral: "politica"
};

function slugify(text) {
  return (text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 55);
}

// 27/08/2026 — CRÍTICO: removidas as ~20 categorias legadas (investimentos,
// seguros, mercados, educacao, saude, tributos, regulacao, parcerias, vagas,
// concursos, imoveis, esg, defesa, religiao, cultura, profissoes,
// investigativo, seguranca, variedades) e suas ~150 subpáginas fictícias —
// confirmado em vercel.json que TODA URL sob esses prefixos (raiz e
// subcaminho) é 301 pra categoria atual (ex: /investimentos/(.+) →
// /financas/$1). O sitemap estava anunciando ~170 URLs que são sempre
// redirect — exatamente o padrão "Página com redirecionamento" que dominava
// o Search Console. Adicionadas as 3 raízes atuais que nunca estiveram no
// sitemap (brasil-on, financas, internacional) + as páginas reais novas
// (radares esportivos dedicados, futebol, institucionais) confirmadas
// existindo em public/ mas nunca anunciadas antes.
const STATIC_PATHS = [
  "/","/busca/","/newsletter/","/radar/","/tv-ovc/","/radio-ovc/","/dados/","/dados/cotacoes/","/dados/agenda-economica/","/pulso-br/",
  "/politica/","/economia/","/negocios/","/industria/","/tecnologia/","/esportes/","/familia/","/brasil-on/","/financas/","/internacional/","/colunistas/",
  "/vc/","/vc/quem-somos/","/vc/principios-editoriais/","/vc/liberdade-economica/","/vc/familia-e-patrimonio/",
  "/politica/executivo/","/politica/legislativo-congresso-ao-vivo/","/politica/judiciario/","/politica/projetos-de-lei/","/politica/eleicoes/","/politica/agenda-regulatoria/","/politica/geral/",
  "/economia/monetaria-copom-selic/","/economia/fiscal-orcamento-divida-pib-primario/","/economia/conjuntura-pib-emprego-consumo-focus/","/economia/internacional-eua-europa-china-commodities/","/economia/minuto-fiscal/","/economia/geral/",
  "/negocios/empreender-mei-me-ltda/","/negocios/tributacao-pj/","/negocios/gestao-financeira/","/negocios/credito/","/negocios/vendas-e-preco/","/negocios/contratos-e-societario/","/negocios/lgpd-e-compliance/","/negocios/startups/","/negocios/geral/",
  "/industria/construcao-e-imobiliario/","/industria/energia-e-infra/","/industria/agro/","/industria/mineracao-e-siderurgia/","/industria/quimica-e-materiais/","/industria/automotivo/","/industria/logistica-e-portos-e-ferrovias/","/industria/industria-4-0/","/industria/geral/",
  "/tecnologia/ia-e-dados/","/tecnologia/fintechs-e-pagamentos/","/tecnologia/e-commerce/","/tecnologia/ciberseguranca/","/tecnologia/telecom-e-5g/","/tecnologia/transformacao-digital/","/tecnologia/govtech/","/tecnologia/saude-digital/","/tecnologia/geral/",
  "/familia/orcamento/","/familia/educacao-dos-filhos/","/familia/habitacao/","/familia/lazer-e-esportes/","/familia/seguranca/","/familia/seguros-da-familia/","/familia/sucessao-e-patrimonio/","/familia/geral/",
  "/radar-da-bola/","/mercado-da-bola/","/copa/","/libertadores/","/brasileirao-serie-a/","/brasileirao-serie-b/","/sul-americana/","/futebol-europeu/","/basquete/","/motor/","/tenis/","/mma/","/volei/","/nfl/",
  "/contato/","/cookies/","/privacidade/","/termos/","/anuncie/","/seja-parceiro/"
];

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600");

  const type = req.query.type || "index";
  const page = Math.max(0, parseInt(req.query.page || "0", 10));
  const today = new Date().toISOString().slice(0, 10);

  if (type === "static") return sendStatic(res);
  if (type === "posts") return sendPosts(res, page);
  return sendIndex(res, today);
}

function sendStatic(res) {
  const xml = STATIC_PATHS.map(path => `  <url><loc>${BASE}${path}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`).join("\n");
  return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xml}\n</urlset>`);
}

async function sendPosts(res, page) {
  try {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data: posts, error } = await supabase.from("posts")
      .select("id,titulo,user_tags,published_at,updated_at")
      .eq("status", "publicado")
      .order("published_at", { ascending: false })
      .range(from, to);
    if (error) throw error;
    return sendPostUrlset(res, posts || []);
  } catch (_) {
    const fallback = emergencyPosts().slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    res.setHeader("X-OVC-Emergency-Fallback", "static");
    return sendPostUrlset(res, fallback);
  }
}

async function sendIndex(res, today) {
  try {
    const { count, error } = await supabase.from("posts").select("*", { count: "exact", head: true }).eq("status", "publicado");
    if (error) throw error;
    return sendSitemapIndex(res, Math.ceil((count || 0) / PAGE_SIZE), today, false);
  } catch (_) {
    const totalPages = Math.max(1, Math.ceil(emergencyPosts().length / PAGE_SIZE));
    res.setHeader("X-OVC-Emergency-Fallback", "static");
    return sendSitemapIndex(res, totalPages, today, true);
  }
}

function sendSitemapIndex(res, totalPages, today, degraded) {
  const sitemaps = [`  <sitemap><loc>${BASE}/sitemap.xml?type=static</loc><lastmod>${today}</lastmod></sitemap>`];
  for (let i = 0; i < totalPages; i++) sitemaps.push(`  <sitemap><loc>${BASE}/sitemap.xml?type=posts&amp;page=${i}</loc><lastmod>${today}</lastmod></sitemap>`);
  return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps.join("\n")}\n</sitemapindex>`);
}

function sendPostUrlset(res, posts) {
  const xml = posts.map(p => {
    let tags = [];
    try { tags = typeof p.user_tags === "string" ? JSON.parse(p.user_tags || "[]") : (p.user_tags || []); } catch(_) {}
    const cat = (tags[0] || "politica").toLowerCase();
    const catPath = CAT_PATH[cat] || "politica";
    const id8 = (p.id || "").slice(0, 8);
    const sl = slugify(p.titulo || "");
    const lastmod = (p.updated_at || p.published_at || "").slice(0, 10);
    return `  <url><loc>${BASE}/${catPath}/${sl}-${id8}/</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>monthly</changefreq><priority>0.9</priority></url>`;
  }).join("\n");
  return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xml}\n</urlset>`);
}
