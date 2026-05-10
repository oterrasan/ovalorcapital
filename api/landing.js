import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const SECTIONS = {
  trabalho: {
    title: "Trabalho & Carreira",
    desc: "Concursos públicos, vagas de emprego, profissões e mercado de trabalho no Brasil. Tudo para crescer na carreira.",
    canonical: "https://ovalorcapital.com.br/trabalho/",
    cats: ["vagas", "concursos", "profissoes", "parcerias", "educacao"],
    color: "#0d2137", accent: "#f5a623",
    icon: "💼", badge: "O Valor Capital · Trabalho & Carreira",
  },
  financas: {
    title: "Finanças Pessoais",
    desc: "Investimentos, seguros, tributação e mercados. Cotações ao vivo, análises e tudo para fazer seu dinheiro trabalhar.",
    canonical: "https://ovalorcapital.com.br/financas/",
    cats: ["investimentos", "seguros", "tributacao", "regulacao", "mercados"],
    color: "#0a2218", accent: "#00c853",
    icon: "📈", badge: "O Valor Capital · Finanças Pessoais",
  },
  moradia: {
    title: "Moradia & Imóveis",
    desc: "Mercado imobiliário, lançamentos, aluguel, Minha Casa Minha Vida e financiamento habitacional. Decisão de imóvel com informação de qualidade.",
    canonical: "https://ovalorcapital.com.br/moradia/",
    cats: ["imoveis"],
    color: "#1c0f05", accent: "#e8813a",
    icon: "🏠", badge: "O Valor Capital · Moradia & Imóveis",
  },
  vc: {
    title: "Colunistas & Opinião",
    desc: "Análise, opinião e contexto dos principais pensadores sobre política, economia e sociedade brasileira. Sem censura, sem concessões.",
    canonical: "https://ovalorcapital.com.br/vc/",
    cats: ["vc", "colunistas"],
    color: "#0d0d0d", accent: "#c9a84c",
    icon: "✍️", badge: "O Valor Capital · Opinião",
  },
};

const CAT_PATH = {
  vagas: "vagas", concursos: "concursos", profissoes: "profissoes",
  parcerias: "parcerias", educacao: "educacao",
  investimentos: "investimentos", seguros: "seguros",
  tributacao: "tributos", regulacao: "regulacao", mercados: "mercados",
  economia: "economia", imoveis: "imoveis",
  vc: "vc", colunistas: "vc",
};

const CAT_LABEL = {
  vagas: "Vagas", concursos: "Concursos Públicos", profissoes: "Profissões",
  parcerias: "Parcerias", educacao: "Educação",
  investimentos: "Investimentos", seguros: "Seguros",
  tributacao: "Tributação", regulacao: "Regulação",
  mercados: "Mercados", economia: "Economia", imoveis: "Imóveis",
  vc: "Opinião", colunistas: "Colunistas",
};

const CAT_DESC = {
  vagas: "As melhores oportunidades no mercado de trabalho",
  concursos: "Editais, inscrições e gabaritos de concursos",
  profissoes: "Tendências e análises do mercado profissional",
  parcerias: "Acordos e oportunidades de crescimento",
  educacao: "Formação, ENEM, e educação corporativa",
  investimentos: "Renda fixa, ações, fundos e previdência",
  seguros: "Vida, saúde, patrimônio e proteção familiar",
  tributacao: "IRPF, reforma tributária e obrigações fiscais",
  regulacao: "BACEN, CVM e ambiente regulatório",
  mercados: "Bolsa, câmbio, juros e criptomoedas",
  imoveis: "Compra, venda, aluguel e financiamento",
};

function slugify(str) {
  return (str || "").toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 55);
}

function esc(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function getCat(post) {
  let tags = [];
  try { tags = typeof post.user_tags === "string" ? JSON.parse(post.user_tags) : (post.user_tags || []); } catch (_) {}
  return tags[0] || "geral";
}

function buildUrl(post) {
  const cat = getCat(post);
  const catPath = CAT_PATH[cat] || cat;
  const id8 = (post.id || "").slice(0, 8);
  return `/${catPath}/${slugify(post.titulo)}-${id8}/`;
}

let _tpl = null;
function getTemplate() {
  if (_tpl) return _tpl;
  try {
    _tpl = readFileSync(join(process.cwd(), "public", "politica", "index.html"), "utf8");
  } catch (_) { _tpl = ""; }
  return _tpl;
}

// Dark editorial layout for /vc/
function renderEditorialHTML(posts, cfg) {
  const trio = posts.slice(0, 3);
  const list = posts.slice(3, 18);

  const trioCards = trio.map(p => {
    const imgBg = p.imagem
      ? `background-image:linear-gradient(to top,rgba(0,0,0,.9) 0%,rgba(0,0,0,.35) 55%,transparent 100%),url('${esc(p.imagem)}')`
      : `background:#1a1a1a`;
    return `
<a class="ed-trio-card" href="${buildUrl(p)}" style="${imgBg}">
  <div class="ed-trio-body">
    <span class="ed-badge">Opinião</span>
    <h2 class="ed-trio-title">${esc(p.titulo)}</h2>
    <p class="ed-trio-excerpt">${esc((p.comentario_fixado || "").slice(0, 110))}</p>
  </div>
</a>`;
  }).join("");

  const listItems = list.map(p => {
    const thumb = p.imagem
      ? `<img class="ed-list-thumb" src="${esc(p.imagem)}" alt="" loading="lazy">`
      : `<div class="ed-list-thumb ed-list-thumb-empty"></div>`;
    return `
<a class="ed-list-item" href="${buildUrl(p)}">
  ${thumb}
  <div class="ed-list-text">
    <div class="ed-list-cat">Opinião</div>
    <div class="ed-list-title">${esc(p.titulo)}</div>
  </div>
</a>`;
  }).join("");

  return `
<style>
.ed-hero{background:#0d0d0d;padding:80px 24px 60px;text-align:center;position:relative;overflow:hidden;border-bottom:1px solid #1e1e1e}
.ed-hero-glow{position:absolute;top:-60px;left:50%;transform:translateX(-50%);width:700px;height:500px;background:radial-gradient(ellipse,#c9a84c14 0%,transparent 68%);pointer-events:none}
.ed-hero-inner{position:relative;max-width:820px;margin:0 auto}
.ed-hero-rule{display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:28px}
.ed-hero-rule-line{width:48px;height:1px;background:#c9a84c;opacity:.6}
.ed-hero-rule-text{font-size:10px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#c9a84c}
.ed-hero h1{color:#fff;font-size:clamp(2.6rem,7vw,5rem);font-weight:900;line-height:1.0;margin:0 0 20px;letter-spacing:-2px}
.ed-hero p{color:rgba(255,255,255,.55);font-size:1.05rem;max-width:560px;margin:0 auto;line-height:1.7;font-style:italic}
.ed-body{background:#0d0d0d;max-width:1280px;margin:0 auto;padding:56px 24px 80px}
.ed-section-label{font-size:10px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#c9a84c;margin-bottom:20px;display:flex;align-items:center;gap:12px}
.ed-section-label::after{content:"";flex:1;height:1px;background:#c9a84c22}
.ed-trio{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin-bottom:56px;border-radius:8px;overflow:hidden}
@media(max-width:768px){.ed-trio{grid-template-columns:1fr}}
.ed-trio-card{display:block;position:relative;height:400px;background:#111 center/cover no-repeat;text-decoration:none;overflow:hidden;transition:transform .25s}
.ed-trio-card:hover{transform:scale(1.015)}
.ed-trio-card:hover .ed-trio-title{color:#c9a84c}
.ed-trio-body{position:absolute;bottom:0;left:0;right:0;padding:28px 22px}
.ed-badge{display:inline-block;background:#c9a84c;color:#0d0d0d;font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;padding:3px 10px;border-radius:2px;margin-bottom:12px}
.ed-trio-title{color:#fff;font-size:1.05rem;font-weight:700;line-height:1.3;margin:0 0 8px;transition:color .2s}
.ed-trio-excerpt{color:rgba(255,255,255,.6);font-size:.8rem;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ed-list{display:flex;flex-direction:column}
.ed-list-item{display:flex;align-items:center;gap:14px;padding:16px 0;border-bottom:1px solid #1a1a1a;text-decoration:none}
.ed-list-item:first-child{border-top:1px solid #1a1a1a}
.ed-list-item:hover .ed-list-title{color:#c9a84c}
.ed-list-thumb{width:80px;height:58px;object-fit:cover;border-radius:4px;flex-shrink:0;background:#1a1a1a}
.ed-list-thumb-empty{width:80px;height:58px;background:#1a1a1a;border-radius:4px;flex-shrink:0}
.ed-list-cat{font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#c9a84c;margin-bottom:6px}
.ed-list-title{color:#d8d8d8;font-size:.9rem;font-weight:500;line-height:1.45;transition:color .18s}
</style>
<div class="ed-hero">
  <div class="ed-hero-glow"></div>
  <div class="ed-hero-inner">
    <div class="ed-hero-rule">
      <div class="ed-hero-rule-line"></div>
      <div class="ed-hero-rule-text">O Valor Capital</div>
      <div class="ed-hero-rule-line"></div>
    </div>
    <h1>Opinião &amp; Análise</h1>
    <p>Os melhores pensadores escrevem aqui. Política, economia e sociedade com profundidade e sem concessões.</p>
  </div>
</div>
<div class="ed-body">
  <div class="ed-section-label">Destaques</div>
  <div class="ed-trio">${trioCards || '<div style="padding:40px;color:#555;background:#111">Nenhuma coluna publicada ainda.</div>'}</div>
  <div class="ed-section-label">Últimas colunas</div>
  <div class="ed-list">${listItems}</div>
</div>`;
}

function renderLandingHTML(section, posts, cfg) {
  if (section === "vc") return renderEditorialHTML(posts, cfg);

  const featured = posts[0] || null;
  const gridPosts = posts.slice(1, 13);
  const byCat = {};
  for (const p of posts) {
    const cat = getCat(p);
    if (!byCat[cat]) byCat[cat] = [];
    byCat[cat].push(p);
  }

  const featuredHtml = featured ? `
<a class="lp-featured" href="${buildUrl(featured)}"${featured.imagem ? ` style="background-image:linear-gradient(to top,rgba(0,0,0,.85) 0%,rgba(0,0,0,.3) 60%,transparent 100%),url('${esc(featured.imagem)}')"` : ` style="background:${cfg.color}"`}>
  <div class="lp-featured-body">
    <span class="lp-badge">${esc(CAT_LABEL[getCat(featured)] || "")}</span>
    <h2 class="lp-featured-title">${esc(featured.titulo)}</h2>
    <p class="lp-featured-desc">${esc((featured.comentario_fixado || "").slice(0, 130))}</p>
    <span class="lp-featured-cta">Ler artigo <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>
  </div>
</a>` : "";

  const gridHtml = gridPosts.map(p => `
<a class="lp-card" href="${buildUrl(p)}">
  <div class="lp-card-img" style="${p.imagem ? `background-image:url('${esc(p.imagem)}')` : `background:${cfg.color}22`}"></div>
  <div class="lp-card-body">
    <span class="lp-card-cat">${esc(CAT_LABEL[getCat(p)] || "")}</span>
    <h3 class="lp-card-title">${esc(p.titulo)}</h3>
  </div>
</a>`).join("");

  const catBlocksHtml = cfg.cats.map(cat => {
    const catPosts = (byCat[cat] || []).slice(0, 5);
    if (!catPosts.length) return "";
    const items = catPosts.map(p => `
<a class="lp-list-item" href="${buildUrl(p)}">
  ${p.imagem ? `<img class="lp-list-thumb" src="${esc(p.imagem)}" alt="" loading="lazy">` : `<div class="lp-list-thumb lp-list-thumb-empty"></div>`}
  <span class="lp-list-title">${esc(p.titulo)}</span>
</a>`).join("");
    return `
<div class="lp-cat-block">
  <div class="lp-cat-hd">
    <div class="lp-cat-bar" style="background:${cfg.accent}"></div>
    <div>
      <div class="lp-cat-name">${CAT_LABEL[cat] || cat}</div>
      <div class="lp-cat-desc">${CAT_DESC[cat] || ""}</div>
    </div>
    <a class="lp-cat-link" href="/${CAT_PATH[cat] || cat}/">Ver tudo →</a>
  </div>
  <div class="lp-list">${items}</div>
</div>`;
  }).join("");

  return `
<style>
:root{--lp-color:${cfg.color};--lp-accent:${cfg.accent};}
.lp-hero{background:linear-gradient(135deg,${cfg.color} 0%,${cfg.color}cc 70%,${cfg.color}88 100%);position:relative;overflow:hidden;padding:72px 24px 56px;text-align:center}
.lp-hero-bg{position:absolute;inset:0;background:radial-gradient(ellipse at 70% 50%,${cfg.accent}18 0%,transparent 70%);pointer-events:none}
.lp-hero-inner{position:relative;max-width:760px;margin:0 auto}
.lp-hero-eyebrow{display:inline-flex;align-items:center;gap:8px;background:${cfg.accent};color:#111;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;padding:5px 16px;border-radius:3px;margin-bottom:24px}
.lp-hero h1{color:#fff;font-size:clamp(2.2rem,6vw,4rem);font-weight:900;line-height:1.05;margin:0 0 18px;letter-spacing:-1px;text-shadow:0 2px 20px rgba(0,0,0,.3)}
.lp-hero p{color:rgba(255,255,255,.82);font-size:1.1rem;max-width:580px;margin:0 auto;line-height:1.65}
.lp-hero-tags{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:28px}
.lp-hero-tag{background:rgba(255,255,255,.12);color:rgba(255,255,255,.85);font-size:12px;font-weight:600;padding:5px 14px;border-radius:20px;border:1px solid rgba(255,255,255,.2);text-decoration:none;transition:background .2s}
.lp-hero-tag:hover{background:rgba(255,255,255,.22)}
.lp-body{max-width:1240px;margin:0 auto;padding:48px 24px 64px}
.lp-featured{display:block;position:relative;height:460px;background:#111 center/cover no-repeat;border-radius:12px;overflow:hidden;margin-bottom:48px;text-decoration:none;transition:transform .2s,box-shadow .2s}
.lp-featured:hover{transform:translateY(-2px);box-shadow:0 16px 48px rgba(0,0,0,.22)}
.lp-featured-body{position:absolute;bottom:0;left:0;right:0;padding:48px 36px 36px}
.lp-badge{display:inline-block;background:${cfg.accent};color:#111;font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;padding:4px 12px;border-radius:3px;margin-bottom:14px}
.lp-featured-title{color:#fff;font-size:clamp(1.5rem,3.5vw,2.2rem);font-weight:800;line-height:1.2;margin:0 0 12px;text-shadow:0 1px 6px rgba(0,0,0,.4)}
.lp-featured-desc{color:rgba(255,255,255,.8);font-size:.95rem;margin:0 0 16px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.lp-featured-cta{display:inline-flex;align-items:center;gap:6px;color:${cfg.accent};font-size:.88rem;font-weight:700;letter-spacing:.5px}
.lp-section-title{font-size:1.15rem;font-weight:800;color:#1a1a1a;margin:0 0 24px;padding-bottom:12px;border-bottom:3px solid ${cfg.accent};display:flex;align-items:center;gap:10px}
.lp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:24px;margin-bottom:60px}
.lp-card{display:flex;flex-direction:column;border-radius:10px;overflow:hidden;background:#fff;box-shadow:0 2px 16px rgba(0,0,0,.07);text-decoration:none;transition:transform .2s,box-shadow .2s}
.lp-card:hover{transform:translateY(-4px);box-shadow:0 8px 32px rgba(0,0,0,.14)}
.lp-card-img{height:168px;background:#e8e8e8 center/cover no-repeat}
.lp-card-body{padding:16px;flex:1;display:flex;flex-direction:column;gap:8px}
.lp-card-cat{color:${cfg.color};font-size:10px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase}
.lp-card-title{color:#1a1a1a;font-size:.9rem;font-weight:600;line-height:1.45;margin:0}
.lp-cats{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:36px;padding-top:48px;border-top:1px solid #ebebeb}
.lp-cat-hd{display:flex;align-items:flex-start;gap:12px;margin-bottom:16px}
.lp-cat-bar{width:5px;height:42px;border-radius:3px;flex-shrink:0;margin-top:2px}
.lp-cat-name{font-size:1rem;font-weight:800;color:#1a1a1a;line-height:1.2}
.lp-cat-desc{font-size:.78rem;color:#777;margin-top:3px;line-height:1.4}
.lp-cat-link{margin-left:auto;color:${cfg.color};font-size:.8rem;font-weight:700;text-decoration:none;white-space:nowrap;padding-top:2px;flex-shrink:0}
.lp-cat-link:hover{text-decoration:underline}
.lp-list{display:flex;flex-direction:column}
.lp-list-item{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid #f2f2f2;text-decoration:none}
.lp-list-item:last-child{border-bottom:none}
.lp-list-item:hover .lp-list-title{color:${cfg.color}}
.lp-list-thumb{width:68px;height:50px;object-fit:cover;border-radius:5px;flex-shrink:0;background:#e8e8e8}
.lp-list-thumb-empty{background:${cfg.color}18;flex-shrink:0;width:68px;height:50px;border-radius:5px}
.lp-list-title{color:#2a2a2a;font-size:.87rem;font-weight:500;line-height:1.45;transition:color .15s}
@media(max-width:640px){.lp-featured{height:320px}.lp-featured-body{padding:32px 20px 24px}.lp-cats{grid-template-columns:1fr}.lp-body{padding:32px 16px 48px}}
</style>
<div class="lp-hero">
  <div class="lp-hero-bg"></div>
  <div class="lp-hero-inner">
    <div class="lp-hero-eyebrow">${cfg.icon} ${cfg.badge}</div>
    <h1>${cfg.title}</h1>
    <p>${cfg.desc}</p>
    <div class="lp-hero-tags">${cfg.cats.filter(c => CAT_PATH[c]).map(c => `<a class="lp-hero-tag" href="/${CAT_PATH[c] || c}/">${CAT_LABEL[c] || c}</a>`).join("")}</div>
  </div>
</div>
<div class="lp-body">
  ${featuredHtml}
  <div class="lp-section-title">Últimas notícias</div>
  <div class="lp-grid">${gridHtml}</div>
  <div class="lp-cats">${catBlocksHtml}</div>
</div>`;
}

export default async function handler(req, res) {
  const section = (req.query.section || "").toLowerCase();
  const cfg = SECTIONS[section];
  if (!cfg) return res.status(404).send("Not found");

  let posts = [];
  try {
    const { data } = await supabase.from("posts")
      .select("id,titulo,comentario_fixado,imagem,user_tags,published_at")
      .eq("status", "publicado")
      .contains("user_tags", JSON.stringify(cfg.cats))
      .order("published_at", { ascending: false })
      .limit(30);
    posts = data || [];
  } catch (_) {}

  if (!posts.length) {
    try {
      const results = await Promise.allSettled(
        cfg.cats.map(cat =>
          supabase.from("posts")
            .select("id,titulo,comentario_fixado,imagem,user_tags,published_at")
            .eq("status", "publicado")
            .contains("user_tags", `["${cat}"]`)
            .order("published_at", { ascending: false })
            .limit(8)
            .then(r => r.data || [])
        )
      );
      posts = results.filter(r => r.status === "fulfilled").flatMap(r => r.value);
      posts.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
    } catch (_) {}
  }

  const tpl = getTemplate();
  if (!tpl) return res.status(500).send("template error");

  const mainHtml = renderLandingHTML(section, posts, cfg);

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${cfg.title} | O Valor Capital`,
    "description": cfg.desc,
    "url": cfg.canonical,
    "publisher": {
      "@type": "Organization",
      "name": "O Valor Capital",
      "logo": { "@type": "ImageObject", "url": "https://ovalorcapital.com.br/images/logo-ovc.png" }
    },
    "inLanguage": "pt-BR"
  });

  const seoTags = [
    `<title>${esc(cfg.title)} | O Valor Capital</title>`,
    `<meta name="description" content="${esc(cfg.desc)}">`,
    `<link rel="canonical" href="${cfg.canonical}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="O Valor Capital">`,
    `<meta property="og:title" content="${esc(cfg.title)} | O Valor Capital">`,
    `<meta property="og:description" content="${esc(cfg.desc)}">`,
    `<meta property="og:url" content="${cfg.canonical}">`,
    `<meta property="og:locale" content="pt_BR">`,
    `<meta name="twitter:card" content="summary">`,
    `<meta name="twitter:site" content="@ovalorcapital">`,
    `<meta name="twitter:title" content="${esc(cfg.title)} | O Valor Capital">`,
    `<meta name="twitter:description" content="${esc(cfg.desc)}">`,
    `<script type="application/ld+json">${jsonLd}</script>`,
  ].join("\n");

  let html = tpl;
  html = html.replace(/<title>[^<]*<\/title>/i, "");
  html = html.replace("</head>", seoTags + "\n</head>");
  html = html.replace(/<main[^>]*>[\s\S]*?<\/main>/, `<main class="ovc-main">${mainHtml}</main>`);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=180, stale-while-revalidate=60");
  return res.status(200).send(html);
}
