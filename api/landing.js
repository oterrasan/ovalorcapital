import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const OG_DEFAULT = "https://www.ovalorcapital.com.br/images/og-default.jpg";
const LOGO = "https://www.ovalorcapital.com.br/images/logo-ovc.png";

const SECTIONS = {
  trabalho: {
    title: "Trabalho & Carreira",
    desc: "Concursos públicos, vagas de emprego, profissões e mercado de trabalho no Brasil. Tudo para crescer na carreira.",
    canonical: "https://www.ovalorcapital.com.br/trabalho/",
    cats: ["vagas", "concursos", "profissoes", "parcerias", "educacao"],
    color: "#0d2137", accent: "#f5a623",
    icon: "💼", badge: "Trabalho & Carreira",
  },
  financas: {
    title: "Finanças Pessoais",
    desc: "Investimentos, seguros, tributação e mercados. Cotações ao vivo, análises e tudo para fazer seu dinheiro trabalhar.",
    canonical: "https://www.ovalorcapital.com.br/financas/",
    cats: ["investimentos", "seguros", "tributacao", "regulacao", "mercados"],
    color: "#0a2218", accent: "#00c853",
    icon: "📈", badge: "Finanças Pessoais",
  },
  moradia: {
    title: "Moradia & Imóveis",
    desc: "Mercado imobiliário, lançamentos, aluguel, Minha Casa Minha Vida e financiamento habitacional.",
    canonical: "https://www.ovalorcapital.com.br/moradia/",
    cats: ["imoveis"],
    color: "#1c0f05", accent: "#e8813a",
    icon: "🏠", badge: "Moradia & Imóveis",
  },
  vc: {
    title: "O Valor Capital — Institucional",
    desc: "Quem somos, princípios editoriais, parcerias e contato. O portal premium de política, economia, negócios e família do Brasil.",
    canonical: "https://www.ovalorcapital.com.br/vc/",
    cats: ["vc", "colunistas"],
    color: "#0d0d0d", accent: "#c9a84c",
    icon: "🏛️", badge: "Institucional",
  },
  seguranca: {
    title: "Segurança & Defesa",
    desc: "Segurança pública, forças armadas, investigações e defesa nacional. Cobertura completa de segurança no Brasil.",
    canonical: "https://www.ovalorcapital.com.br/seguranca/",
    cats: ["seguranca", "defesa", "investigativo"],
    color: "#0d1b2a", accent: "#e63946",
    icon: "🛡️", badge: "Segurança & Defesa",
  },
  "bem-estar": {
    title: "Bem-Estar & Sociedade",
    desc: "Saúde, família, cultura, espiritualidade e ESG. Informação que melhora sua vida e fortalece sua família.",
    canonical: "https://www.ovalorcapital.com.br/bem-estar/",
    cats: ["saude", "familia", "cultura", "religiao", "esg"],
    color: "#0a1f14", accent: "#52b788",
    icon: "🌱", badge: "Bem-Estar & Sociedade",
  },
};

const CAT_PATH = {
  vagas:"vagas",concursos:"concursos",profissoes:"profissoes",parcerias:"parcerias",educacao:"educacao",
  investimentos:"investimentos",seguros:"seguros",tributacao:"tributos",regulacao:"regulacao",mercados:"mercados",
  economia:"economia",imoveis:"imoveis",vc:"vc",colunistas:"vc",
  seguranca:"seguranca",defesa:"defesa",investigativo:"investigativo",
  saude:"saude",familia:"familia",cultura:"cultura",religiao:"religiao",esg:"esg",
  variedades:"variedades",
};

const CAT_LABEL = {
  vagas:"Vagas",concursos:"Concursos Públicos",profissoes:"Profissões",parcerias:"Parcerias",educacao:"Educação",
  investimentos:"Investimentos",seguros:"Seguros",tributacao:"Tributação",regulacao:"Regulação",
  mercados:"Mercados",economia:"Economia",imoveis:"Imóveis",vc:"Editorial",colunistas:"Editorial",
  seguranca:"Segurança",defesa:"Defesa",investigativo:"Investigativo",
  saude:"Saúde",familia:"Família",cultura:"Cultura",religiao:"Fé & Espiritualidade",esg:"ESG",
  variedades:"Variedades",
};

const CAT_DESC = {
  vagas:"As melhores oportunidades no mercado de trabalho",
  concursos:"Editais, inscrições e gabaritos de concursos",
  profissoes:"Tendências e análises do mercado profissional",
  parcerias:"Acordos e oportunidades de crescimento",
  educacao:"Formação, ENEM, e educação corporativa",
  investimentos:"Renda fixa, ações, fundos e previdência",
  seguros:"Vida, saúde, patrimônio e proteção familiar",
  tributacao:"IRPF, reforma tributária e obrigações fiscais",
  regulacao:"BACEN, CVM e ambiente regulatório",
  mercados:"Bolsa, câmbio, juros e criptomoedas",
  imoveis:"Compra, venda, aluguel e financiamento",
  seguranca:"Segurança pública, polícia e criminalidade",
  defesa:"Forças armadas e defesa nacional",
  investigativo:"Investigações e jornalismo de profundidade",
  saude:"Saúde pública, SUS e medicina",
  familia:"Família, filhos e educação dos filhos",
  cultura:"Arte, entretenimento e cultura brasileira",
  religiao:"Fé, espiritualidade e tradições religiosas",
  esg:"Sustentabilidade, ESG e impacto social",
  variedades:"Comportamento, lifestyle e curiosidades",
};

const NAV_LINKS = [
  ["Política","/politica/"],["Economia","/economia/"],["Investimentos","/investimentos/"],
  ["Negócios","/negocios/"],["Seguros","/seguros/"],["Família","/familia/"],
];

function slugify(str){
  return (str||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")
    .replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-").slice(0,55);
}
function esc(s){
  return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
function getCat(post){
  let tags=[];
  try{tags=typeof post.user_tags==="string"?JSON.parse(post.user_tags):(post.user_tags||[]);}catch(_){}
  return tags[0]||"geral";
}
function buildUrl(post){
  const cat=getCat(post);
  const path=CAT_PATH[cat]||cat;
  return "/"+path+"/"+slugify(post.titulo)+"-"+(post.id||"").slice(0,8)+"/";
}

async function fetchPosts(cats){
  const filter=cats.map(c=>`user_tags.like.%"${c}"%`).join(",");
  try{
    const{data}=await supabase.from("posts")
      .select("id,titulo,comentario_fixado,imagem,user_tags,published_at")
      .eq("status","publicado").or(filter)
      .order("published_at",{ascending:false}).limit(30);
    if(data&&data.length)return data;
  }catch(_){}
  try{
    const results=await Promise.allSettled(cats.map(cat=>
      supabase.from("posts")
        .select("id,titulo,comentario_fixado,imagem,user_tags,published_at")
        .eq("status","publicado").like("user_tags",`%"${cat}"%`)
        .order("published_at",{ascending:false}).limit(8)
        .then(r=>r.data||[])
    ));
    const posts=results.filter(r=>r.status==="fulfilled").flatMap(r=>r.value);
    posts.sort((a,b)=>new Date(b.published_at)-new Date(a.published_at));
    return posts;
  }catch(_){}
  return[];
}

function buildHeader(){
  const navHtml=NAV_LINKS.map(([label,href])=>
    `<a href="${href}" style="color:rgba(255,255,255,.85);text-decoration:none;font-size:14px;font-weight:600;padding:6px 10px;border-radius:6px;transition:color .15s" onmouseover="this.style.color='#d4af37'" onmouseout="this.style.color='rgba(255,255,255,.85)'">${label}</a>`
  ).join("");
  return `<header style="background:#0f172a;border-bottom:1px solid rgba(255,255,255,.08);position:sticky;top:0;z-index:999">
<div style="max-width:1400px;margin:0 auto;padding:0 24px;height:58px;display:flex;align-items:center;justify-content:space-between;gap:24px">
  <a href="/" style="text-decoration:none;font-size:22px;font-weight:900;letter-spacing:-.5px;color:#d4af37;white-space:nowrap">O VALOR CAPITAL</a>
  <nav style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">${navHtml}</nav>
</div>
</header>`;
}

function buildFooter(){
  return `<footer style="background:#0f172a;border-top:1px solid rgba(255,255,255,.08);padding:40px 24px 32px;text-align:center;margin-top:auto">
<div style="max-width:960px;margin:0 auto;color:rgba(255,255,255,.6);font-size:13px;line-height:1.9">
  <strong style="color:#d4af37;font-size:16px;font-weight:900;display:block;margin-bottom:8px">O VALOR CAPITAL</strong>
  © 2026 O Valor Capital — Redação OVC. Todos os direitos reservados.&nbsp;&nbsp;<span style="font-size:.82em;opacity:.7">🔒 Conexão segura HTTPS</span>
  <br>
  <span style="display:inline-flex;flex-wrap:wrap;gap:4px 16px;justify-content:center;margin-top:10px">
    <a href="/quem-somos/" style="color:rgba(255,255,255,.45);text-decoration:none">Quem Somos</a>
    <a href="/politica-editorial/" style="color:rgba(255,255,255,.45);text-decoration:none">Política Editorial</a>
    <a href="/termos/" style="color:rgba(255,255,255,.45);text-decoration:none">Termos de Uso</a>
    <a href="/privacidade/" style="color:rgba(255,255,255,.45);text-decoration:none">Privacidade</a>
    <a href="/cookies/" style="color:rgba(255,255,255,.45);text-decoration:none">Cookies</a>
  </span>
  <span style="display:block;font-size:.76em;opacity:.45;margin-top:12px;line-height:1.6">O conteúdo tem caráter informativo e jornalístico. Não constitui recomendação de investimento. Redação OVC utiliza Inteligência Artificial supervisionada. Responsável editorial: <strong style="opacity:.8">Roberto Cesar Terrasan</strong>.</span>
</div>
</footer>`;
}

function renderLanding(section,posts,cfg){
  const featured=posts[0]||null;
  const grid=posts.slice(1,13);
  const byCat={};
  for(const p of posts){const c=getCat(p);if(!byCat[c])byCat[c]=[];byCat[c].push(p);}
  const a=cfg.accent,c=cfg.color;
  const featHtml=featured
    ?`<a href="${buildUrl(featured)}" style="display:block;position:relative;height:460px;background:#111 center/cover no-repeat;${featured.imagem?`background-image:linear-gradient(to top,rgba(0,0,0,.85) 0%,rgba(0,0,0,.3) 60%,transparent 100%),url('${esc(featured.imagem)}')`:`background:${c}`};border-radius:12px;overflow:hidden;margin-bottom:48px;text-decoration:none">
<div style="position:absolute;bottom:0;left:0;right:0;padding:48px 36px 36px">
<span style="display:inline-block;background:${a};color:#111;font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;padding:4px 12px;border-radius:3px;margin-bottom:14px">${esc(CAT_LABEL[getCat(featured)]||"Destaque")}</span>
<h2 style="color:#fff;font-size:clamp(1.5rem,3.5vw,2.2rem);font-weight:800;line-height:1.2;margin:0 0 12px">${esc(featured.titulo)}</h2>
<p style="color:rgba(255,255,255,.8);font-size:.95rem;margin:0 0 16px">${esc((featured.comentario_fixado||"").slice(0,130))}</p>
<span style="color:${a};font-size:.88rem;font-weight:700">Ler artigo &rarr;</span>
</div></a>`
    :"";
  const gridHtml=grid.map(p=>`<a href="${buildUrl(p)}" style="display:flex;flex-direction:column;border-radius:10px;overflow:hidden;background:#fff;box-shadow:0 2px 16px rgba(0,0,0,.07);text-decoration:none">
<div style="height:168px;background:#e8e8e8 center/cover no-repeat;${p.imagem?`background-image:url('${esc(p.imagem)}')`:`background:${c}22`}"></div>
<div style="padding:16px">
<div style="color:${c};font-size:10px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:6px">${esc(CAT_LABEL[getCat(p)]||"")}</div>
<div style="color:#1a1a1a;font-size:.9rem;font-weight:600;line-height:1.45">${esc(p.titulo)}</div>
</div></a>`).join("");
  const catHtml=cfg.cats.map(cat=>{
    const cp=(byCat[cat]||[]).slice(0,5);
    if(!cp.length)return"";
    const items=cp.map(p=>`<a href="${buildUrl(p)}" style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid #f2f2f2;text-decoration:none">
${p.imagem?`<img src="${esc(p.imagem)}" alt="${esc(p.titulo)}" style="width:68px;height:50px;object-fit:cover;border-radius:5px;flex-shrink:0" loading="lazy">`:`<div style="background:${c}18;flex-shrink:0;width:68px;height:50px;border-radius:5px"></div>`}
<span style="color:#2a2a2a;font-size:.87rem;font-weight:500;line-height:1.45">${esc(p.titulo)}</span></a>`).join("");
    return `<div>
<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:16px">
<div style="width:5px;height:42px;border-radius:3px;flex-shrink:0;margin-top:2px;background:${a}"></div>
<div style="flex:1"><div style="font-size:1rem;font-weight:800;color:#1a1a1a">${CAT_LABEL[cat]||cat}</div><div style="font-size:.78rem;color:#777;margin-top:3px">${CAT_DESC[cat]||""}</div></div>
<a href="/${CAT_PATH[cat]||cat}/" style="color:${c};font-size:.8rem;font-weight:700;text-decoration:none;white-space:nowrap">Ver tudo &rarr;</a>
</div><div>${items}</div></div>`;
  }).join("");
  const tagsHtml=cfg.cats.filter(x=>CAT_PATH[x]).map(x=>`<a href="/${CAT_PATH[x]||x}/" style="background:rgba(255,255,255,.12);color:rgba(255,255,255,.85);font-size:12px;font-weight:600;padding:5px 14px;border-radius:20px;border:1px solid rgba(255,255,255,.2);text-decoration:none">${CAT_LABEL[x]||x}</a>`).join("");
  return `<div style="background:linear-gradient(135deg,${c} 0%,${c}cc 70%,${c}88 100%);padding:72px 24px 56px;text-align:center">
<div style="position:relative;max-width:760px;margin:0 auto">
<div style="display:inline-flex;align-items:center;gap:8px;background:${a};color:#111;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;padding:5px 16px;border-radius:3px;margin-bottom:24px">${cfg.icon} ${cfg.badge}</div>
<h1 style="color:#fff;font-size:clamp(2.2rem,6vw,4rem);font-weight:900;line-height:1.05;margin:0 0 18px;letter-spacing:-1px">${cfg.title}</h1>
<p style="color:rgba(255,255,255,.82);font-size:1.1rem;max-width:580px;margin:0 auto;line-height:1.65">${cfg.desc}</p>
<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:28px">${tagsHtml}</div>
</div></div>
<div style="max-width:1240px;margin:0 auto;padding:48px 24px 64px">
${featHtml}
<div style="font-size:1.15rem;font-weight:800;color:#1a1a1a;margin:0 0 24px;padding-bottom:12px;border-bottom:3px solid ${a}">Últimas notícias</div>
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:24px;margin-bottom:60px">${gridHtml||'<div style="color:#999;padding:20px 0">Nenhum artigo encontrado nesta seção ainda.</div>'}</div>
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:36px;padding-top:48px;border-top:1px solid #ebebeb">${catHtml}</div>
</div>`;
}

export default async function handler(req,res){
  const section=(req.query.section||"").toLowerCase();
  const cfg=SECTIONS[section];
  if(!cfg)return res.status(404).send("Not found");

  const posts=await fetchPosts(cfg.cats);
  const bodyHtml=renderLanding(section,posts,cfg);

  const jsonLd=JSON.stringify({
    "@context":"https://schema.org","@type":"CollectionPage",
    "name":cfg.title+" | O Valor Capital","description":cfg.desc,
    "url":cfg.canonical,
    "publisher":{"@type":"Organization","name":"O Valor Capital","logo":{"@type":"ImageObject","url":LOGO}},
    "inLanguage":"pt-BR"
  });

  const html=`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(cfg.title)} | O Valor Capital</title>
<meta name="description" content="${esc(cfg.desc)}">
<link rel="canonical" href="${cfg.canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="O Valor Capital">
<meta property="og:title" content="${esc(cfg.title)} | O Valor Capital">
<meta property="og:description" content="${esc(cfg.desc)}">
<meta property="og:image" content="${OG_DEFAULT}">
<meta property="og:url" content="${cfg.canonical}">
<meta property="og:locale" content="pt_BR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@ovalorcapital">
<meta name="twitter:title" content="${esc(cfg.title)} | O Valor Capital">
<meta name="twitter:description" content="${esc(cfg.desc)}">
<meta name="twitter:image" content="${OG_DEFAULT}">
<script type="application/ld+json">${jsonLd}</script>
<link rel="stylesheet" href="/css/home.css">
<style>
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;background:#f5f5f5;color:#1a1a1a}
a img{border:0}
@media(max-width:768px){nav a{display:none}nav a:first-child,nav a:nth-child(2){display:inline}}
</style>
</head>
<body>
${buildHeader()}
<div style="min-height:80vh">
${bodyHtml}
</div>
${buildFooter()}
</body>
</html>`;

  res.setHeader("Content-Type","text/html; charset=utf-8");
  res.setHeader("Cache-Control","public, s-maxage=180, stale-while-revalidate=60");
  return res.status(200).send(html);
}
