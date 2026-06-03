import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const _SB_URL = process.env.SUPABASE_URL || Buffer.from('aHR0cHM6Ly95bnR3dmZjeGphcmR6YWZkcWFuai5zdXBhYmFzZS5jbw==','base64').toString();
const _SB_KEY = process.env.SUPABASE_KEY || Buffer.from('ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW5sdWRIZDJabU40YW1GeVpIcGhhRFJ4WVc1cUlpd2ljbTlzWlNJNkluTmxjblpwWTJWZmNtOXNaU0lzSW1saGRDSTZNVGM0TURNMU5UTXdNeXdpWlhod0lqb3lNRGsxT1RNeE16QXpmUS5CWDFOXzB3SG9JQ3dLNVY4LTk2S1hhTU1iQTh0UU1hblZlbHhTMS1wTzQw','base64').toString();
const supabase = createClient(_SB_URL, _SB_KEY);

const BASE = "https://www.ovalorcapital.com.br";

const CAT_PATH = {
  politica:"politica", economia:"economia", negocios:"negocios",
  investimentos:"investimentos", seguros:"seguros", mercados:"mercados",
  educacao:"educacao", industria:"industria", tecnologia:"tecnologia",
  esportes:"esportes", saude:"saude", familia:"familia",
  tributacao:"tributos", regulacao:"regulacao", parcerias:"parcerias",
  vc:"colunistas", colunistas:"colunistas", internacional:"internacional", variedades:"variedades",
  investigativo:"investigativo", seguranca:"seguranca",
  cultura:"cultura", profissoes:"profissoes", vagas:"vagas",
  concursos:"concursos", imoveis:"imoveis", esg:"esg", defesa:"defesa", religiao:"religiao",
  geral:"politica"
};

const SLUG_TO_CAT = {
  tributos:"tributacao", tributacao:"tributacao",
  politica:"politica", economia:"economia", negocios:"negocios",
  investimentos:"investimentos", seguros:"seguros", mercados:"mercados",
  educacao:"educacao", industria:"industria", tecnologia:"tecnologia",
  esportes:"esportes", saude:"saude", familia:"familia",
  internacional:"internacional", variedades:"variedades",
  parcerias:"parcerias", regulacao:"regulacao", vc:"colunistas", colunistas:"colunistas",
  investigativo:"investigativo", seguranca:"seguranca",
  cultura:"cultura", profissoes:"profissoes", vagas:"vagas",
  concursos:"concursos", imoveis:"imoveis", esg:"esg", defesa:"defesa", religiao:"religiao"
};

const CAT_LABEL = {
  politica:"Política", economia:"Economia", negocios:"Negócios",
  investimentos:"Investimentos", mercados:"Mercados", tributacao:"Tributação",
  regulacao:"Regulação", seguros:"Seguros", saude:"Saúde", familia:"Família",
  tecnologia:"Tecnologia", industria:"Indústria", educacao:"Educação",
  esportes:"Esportes", internacional:"Internacional", variedades:"Variedades",
  parcerias:"Parcerias", vc:"OVC", colunistas:"Colunistas",
  investigativo:"Investigativo", seguranca:"Segurança Pública",
  cultura:"Cultura", profissoes:"Profissões", vagas:"Vagas",
  concursos:"Concursos Públicos", imoveis:"Imóveis", esg:"ESG",
  defesa:"Defesa", religiao:"Fé & Espiritualidade"
};

const _tpl = {};

function getTemplate(catPath) {
  if (_tpl[catPath]) return _tpl[catPath];
  try {
    const p = join(process.cwd(), "public", catPath, "index.html");
    _tpl[catPath] = readFileSync(p, "utf8");
    return _tpl[catPath];
  } catch(_) {
    try {
      const p = join(process.cwd(), "public", "politica", "index.html");
      _tpl[catPath] = readFileSync(p, "utf8");
      return _tpl[catPath];
    } catch(__) { return null; }
  }
}

function esc(s) {
  return (s||"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;");
}

function slugify(str) {
  return (str||"")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g,"")
    .replace(/[^a-z0-9\s-]/g,"")
    .trim()
    .replace(/\s+/g,"-")
    .slice(0,55);
}

function safeJsonForScript(obj) {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

async function findByPrefix(id8, cols) {
  const lo = id8 + "-0000-0000-0000-000000000000";
  const hi = id8 + "-ffff-ffff-ffff-ffffffffffff";
  const { data: rows, error } = await supabase.from("posts")
    .select(cols)
    .eq("status", "publicado")
    .gte("id", lo)
    .lte("id", hi)
    .limit(1);
  return { row: rows?.[0] || null, error };
}

async function fetchRelatedArticles(catKey, excludeId) {
  try {
    const { data } = await supabase.from('posts')
      .select('id,titulo')
      .eq('status', 'publicado')
      .neq('id', excludeId)
      .like('user_tags', `%"${catKey}"%`)
      .order('published_at', { ascending: false })
      .limit(3);
    return data || [];
  } catch (_) { return []; }
}

export default async function handler(req, res) {
  const { cat, slug } = req.query;
  if (!slug) return res.status(400).send("bad request");

  const idMatch = (slug||"").match(/-([a-f0-9]{8})$/i);
  if (!idMatch) return res.status(400).send("invalid slug");
  const id8 = idMatch[1].toLowerCase();

  const catKey = SLUG_TO_CAT[cat] || cat || "politica";
  const catPath = CAT_PATH[catKey] || "politica";

  let article = null;
  try {
    const colsWithMetrics = "id,titulo,comentario_fixado,conteudo,imagem,user_tags,subcategoria,published_at,created_at,updated_at,metrics";
    const colsNoMetrics  = "id,titulo,comentario_fixado,conteudo,imagem,user_tags,subcategoria,published_at,created_at,updated_at";

    let { row, error } = await findByPrefix(id8, colsWithMetrics);
    if (error) {
      const r2 = await findByPrefix(id8, colsNoMetrics);
      if (r2.error) return res.status(500).send("db error");
      row = r2.row;
    }
    article = row;
  } catch(e) {
    return res.status(500).send("db error");
  }

  if (!article) return res.status(404).send("not found");

  const titulo = (article.titulo || "").replace(/\*\*/g, '').replace(/^#+\s*/, '').trim();

  let metricsJson = {};
  try { metricsJson = typeof article.metrics === "string" ? JSON.parse(article.metrics) : (article.metrics || {}); } catch(_) {}
  const metaTitleRaw = (metricsJson.meta_title || titulo).replace(/\*\*/g,'').slice(0, 55).trim();
  const titleTag = `${metaTitleRaw} | O Valor Capital`;

  const rawDesc = (article.comentario_fixado || (article.conteudo||"").slice(0,220).replace(/\n/g," ")).slice(0,200);
  const desc = rawDesc.trim();
  const imagem = article.imagem || `${BASE}/images/og-default.jpg`;
  const slug_clean = slugify(titulo);
  const canonical = `${BASE}/${catPath}/${slug_clean}-${id8}/`;
  const publishedAt = article.published_at || article.created_at || new Date().toISOString();
  const modifiedAt = article.updated_at || publishedAt;

  let tags = [];
  try { tags = typeof article.user_tags === "string" ? JSON.parse(article.user_tags) : (article.user_tags||[]); } catch(_) {}
  const artCat = tags[0] || catKey;
  const catLabel = CAT_LABEL[artCat] || CAT_LABEL[catKey] || "Notícias";

  const related = await fetchRelatedArticles(artCat, article.id);
  let corpoFinal = article.conteudo || '';

  if (related.length > 0 && /^\s*<[a-z]/i.test(corpoFinal.trim())) {
    const relItems = related.map(r => {
      const rId8 = r.id.slice(0, 8);
      const rSlug = slugify(r.titulo);
      return `<li><a href="/${catPath}/${rSlug}-${rId8}/" title="${esc(r.titulo)}">${esc(r.titulo)}</a></li>`;
    }).join('');
    const relBlock = `<div class="leia-tambem"><strong>Leia também</strong><ul>${relItems}</ul></div>`;
    corpoFinal = corpoFinal + relBlock;
  }

  const tpl = getTemplate(catPath);
  if (!tpl) return res.status(500).send("template not found");

  const jsonLd = safeJsonForScript({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": titulo,
    "description": desc,
    "image": [imagem],
    "datePublished": publishedAt,
    "dateModified": modifiedAt,
    "author": [{"@type":"Organization","name":"Redação OVC","url":BASE}],
    "publisher": {
      "@type": "Organization",
      "name": "O Valor Capital",
      "logo": {"@type":"ImageObject","url":`${BASE}/images/logo-ovc.png`}
    },
    "mainEntityOfPage": {"@type":"WebPage","@id": canonical},
    "articleSection": catLabel,
    "inLanguage": "pt-BR",
    "isAccessibleForFree": true
  });

  const orgJsonLd = safeJsonForScript({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "O Valor Capital",
    "url": BASE,
    "logo": {
      "@type": "ImageObject",
      "url": `${BASE}/images/logo-ovc.png`,
      "width": 200,
      "height": 60
    },
    "sameAs": [
      "https://www.instagram.com/ovalorcapital",
      "https://www.youtube.com/@ovalorcapital"
    ]
  });

  const preload = safeJsonForScript({
    id: article.id,
    titulo,
    subtitulo: article.comentario_fixado||"",
    resumo: desc,
    corpo: corpoFinal,
    imagem,
    categoria: artCat,
    subcategoria: article.subcategoria||"",
    tags,
    slug: slug_clean,
    url: `/${catPath}/${slug_clean}-${id8}/`,
    data: publishedAt
  });

  const anonKey = process.env.SUPABASE_ANON_KEY || '';

  const seoTags = [
    `<title>${esc(titleTag)}</title>`,
    `<meta name="description" content="${esc(desc)}">`,
    `<link rel="canonical" href="${canonical}">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:site_name" content="O Valor Capital">`,
    `<meta property="og:title" content="${esc(titulo)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:image" content="${esc(imagem)}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:locale" content="pt_BR">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:site" content="@ovalorcapital">`,
    `<meta name="twitter:title" content="${esc(titulo)}">`,
    `<meta name="twitter:description" content="${esc(desc)}">`,
    `<meta name="twitter:image" content="${esc(imagem)}">`,
    `<script type="application/ld+json">${jsonLd}</script>`,
    `<script type="application/ld+json">${orgJsonLd}</script>`,
    `<script>window.__OVC_ARTICLE__=${preload};window.SUPABASE_ANON_KEY=${JSON.stringify(anonKey)};</script>`,
    `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js" defer></script>`,
    `<script src="/js/auth.js" defer></script>`,
    `<script src="/js/banners.js" defer></script>`,
    `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3652391568977586" crossorigin="anonymous"></script>`
  ].join("\n");

  const commentsAndAuthHtml = `
<!-- OVC Auth + Comments -->
<style>
#ovc-auth-modal,#ovc-profile-modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;align-items:center;justify-content:center;padding:16px}
.ovc-modal-box{background:#fff;border-radius:16px;width:100%;max-width:440px;padding:32px 28px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.25)}
.ovc-modal-close{position:absolute;top:14px;right:16px;background:none;border:none;font-size:22px;cursor:pointer;color:#94a3b8;line-height:1}
.ovc-modal-close:hover{color:#0f172a}
.ovc-tabs{display:flex;border-bottom:2px solid #e2e8f0;margin-bottom:20px}
.ovc-tab{flex:1;padding:10px 0;text-align:center;font-size:14px;font-weight:700;color:#94a3b8;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;background:none;border-left:none;border-right:none;border-top:none}
.ovc-tab.active{color:#0f172a;border-bottom-color:#d4af37}
.ovc-input{width:100%;padding:10px 14px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;margin-bottom:12px;box-sizing:border-box;outline:none}
.ovc-input:focus{border-color:#d4af37;box-shadow:0 0 0 3px rgba(212,175,55,.15)}
.ovc-btn-primary{width:100%;padding:11px;background:#0f172a;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;margin-top:4px}
.ovc-btn-primary:hover{background:#1e293b}
.ovc-btn-primary:disabled{opacity:.6;cursor:not-allowed}
.ovc-oauth-btn{width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:10px;background:#fff}
.ovc-oauth-btn:hover{background:#f8fafc}
.ovc-error{color:#dc2626;font-size:12px;margin-top:-6px;margin-bottom:8px;min-height:16px}
.ovc-divider{display:flex;align-items:center;gap:12px;margin:16px 0;color:#94a3b8;font-size:12px}
.ovc-divider::before,.ovc-divider::after{content:'';flex:1;height:1px;background:#e2e8f0}
#ovc-comments-section{max-width:760px;margin:48px auto 0;padding:0 0 48px}
#ovc-comments-section h2{font-size:20px;font-weight:800;color:#0f172a;margin:0 0 20px;padding-bottom:12px;border-bottom:2px solid #d4af37}
#ovc-pinned-comment{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;margin-bottom:20px}
#ovc-comment-login-cta{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;text-align:center;margin-bottom:20px}
#ovc-comment-form{margin-bottom:24px;display:none}
#ovc-new-comment-form textarea{width:100%;padding:12px 14px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit;resize:vertical;min-height:80px;box-sizing:border-box;outline:none}
#ovc-new-comment-form textarea:focus{border-color:#d4af37;box-shadow:0 0 0 3px rgba(212,175,55,.15)}
#ovc-new-comment-form button[type=submit]{margin-top:8px;padding:10px 24px;background:#0f172a;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer}
#ovc-new-comment-form button[type=submit]:disabled{opacity:.6;cursor:not-allowed}
.ovc-auth-bar{display:flex;align-items:center;gap:12px;padding:10px 0;margin-bottom:4px;font-size:13px;color:#64748b}
</style>

<div id="ovc-comments-section">
  <div class="ovc-auth-bar">
    <span data-ovc-guest style="display:none">
      <button data-ovc-open-auth style="background:#0f172a;color:#fff;border:none;border-radius:8px;padding:7px 18px;font-size:13px;font-weight:700;cursor:pointer">Entrar para comentar</button>
    </span>
    <span data-ovc-logged-in style="display:none">
      Olá, <strong data-ovc-user-name></strong> &nbsp;···&nbsp;
      <button data-ovc-logout style="background:none;border:none;color:#94a3b8;font-size:12px;cursor:pointer;text-decoration:underline">Sair</button>
    </span>
  </div>

  <h2>Comentários</h2>

  <div id="ovc-pinned-comment" style="display:none"></div>

  <div id="ovc-comment-form">
    <form id="ovc-new-comment-form">
      <textarea name="texto" placeholder="Escreva seu comentário..." maxlength="2000"></textarea>
      <div id="ovc-comment-error" class="ovc-error"></div>
      <button type="submit">Comentar</button>
    </form>
  </div>

  <div id="ovc-comment-login-cta">
    <p style="margin:0 0 12px;font-size:14px;color:#475569">Faça login para deixar seu comentário.</p>
    <button data-ovc-open-auth style="background:#0f172a;color:#fff;border:none;border-radius:8px;padding:9px 22px;font-size:14px;font-weight:700;cursor:pointer">Entrar / Cadastrar</button>
  </div>

  <div id="ovc-comments-list"></div>
</div>

<div id="ovc-auth-modal" role="dialog" aria-modal="true" aria-label="Login">
  <div class="ovc-modal-box">
    <button class="ovc-modal-close" data-ovc-close-auth aria-label="Fechar">&times;</button>
    <div style="text-align:center;margin-bottom:20px">
      <strong style="font-size:18px;color:#0f172a">Acesse sua conta OVC</strong>
    </div>
    <button class="ovc-oauth-btn" data-ovc-login-google>
      <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/></svg>
      Continuar com Google
    </button>
    <button class="ovc-oauth-btn" data-ovc-login-facebook>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
      Continuar com Facebook
    </button>
    <div class="ovc-divider">ou</div>
    <div class="ovc-tabs">
      <button class="ovc-tab active" id="ovc-tab-login">Entrar</button>
      <button class="ovc-tab" id="ovc-tab-register">Cadastrar</button>
    </div>
    <div id="ovc-panel-login">
      <form id="ovc-login-form" autocomplete="on">
        <input class="ovc-input" type="email" name="email" placeholder="E-mail" required autocomplete="email">
        <input class="ovc-input" type="password" name="password" placeholder="Senha" required autocomplete="current-password">
        <div id="ovc-login-error" class="ovc-error"></div>
        <button class="ovc-btn-primary" type="submit">Entrar</button>
      </form>
    </div>
    <div id="ovc-panel-register" style="display:none">
      <form id="ovc-register-form" autocomplete="on">
        <input class="ovc-input" type="text" name="nome" placeholder="Nome" autocomplete="given-name">
        <input class="ovc-input" type="email" name="email" placeholder="E-mail" required autocomplete="email">
        <input class="ovc-input" type="password" name="password" placeholder="Senha (mín. 6 caracteres)" required minlength="6" autocomplete="new-password">
        <div id="ovc-register-error" class="ovc-error"></div>
        <button class="ovc-btn-primary" type="submit">Criar conta</button>
      </form>
    </div>
  </div>
</div>

<div id="ovc-profile-modal" role="dialog" aria-modal="true" aria-label="Complete seu perfil">
  <div class="ovc-modal-box">
    <button class="ovc-modal-close" data-ovc-close-profile aria-label="Fechar">&times;</button>
    <div style="text-align:center;margin-bottom:20px">
      <strong style="font-size:18px;color:#0f172a">Complete seu perfil</strong>
      <p style="font-size:13px;color:#64748b;margin:6px 0 0">Apenas mais algumas informações para personalizar sua experiência.</p>
    </div>
    <form id="ovc-profile-form">
      <input class="ovc-input" type="text" id="ovc-profile-nome" name="nome" placeholder="Nome" autocomplete="given-name">
      <input class="ovc-input" type="text" id="ovc-profile-sobrenome" name="sobrenome" placeholder="Sobrenome" autocomplete="family-name">
      <input class="ovc-input" type="tel" name="celular" placeholder="Celular (com DDD)" required autocomplete="tel">
      <input class="ovc-input" type="text" name="cidade" placeholder="Cidade" autocomplete="address-level2">
      <input class="ovc-input" type="number" name="idade" placeholder="Idade" min="10" max="120">
      <button class="ovc-btn-primary" type="submit">Salvar e continuar</button>
    </form>
  </div>
</div>
`;

  let html = tpl.replace(/<title>[^<]*<\/title>/i, "");
  html = html.replace("</head>", seoTags + "\n</head>");
  html = html.replace("</body>", commentsAndAuthHtml + "\n</body>");

  res.setHeader("Content-Type","text/html; charset=utf-8");
  res.setHeader("Cache-Control","public, s-maxage=300, stale-while-revalidate=60");
  return res.status(200).send(html);
}