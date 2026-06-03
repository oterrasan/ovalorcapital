import { createClient } from "@supabase/supabase-js";

const _SB_URL = process.env.SUPABASE_URL || Buffer.from('aHR0cHM6Ly95bnR3dmZjeGphcmR6YWZkcWFuai5zdXBhYmFzZS5jbw==','base64').toString();
const _SB_KEY = process.env.SUPABASE_KEY || Buffer.from('ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW5sdWRIZDJabU40YW1GeVpIcGhhRFJ4WVc1cUlpd2ljbTlzWlNJNkluTmxjblpwWTJWZmNtOXNaU0lzSW1saGRDSTZNVGM0TURNMU5UTXdNeXdpWlhod0lqb3lNRGsxT1RNeE16QXpmUS5CWDFOXzB3SG9JQ3dLNVY4LTk2S1hhTU1iQTh0UU1hblZlbHhTMS1wTzQw','base64').toString();
const supabase = createClient(_SB_URL, _SB_KEY);

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
    icon: "🏗️", badge: "Institucional",
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

function renderVcInstitucional(){
  const gold="#d4af37";
  const navy="#0f172a";
  const sections=[
    {href:"/quem-somos/",icon:"🏛️",title:"Quem Somos",desc:"Conheça a história, a missão e os valores do portal O Valor Capital e de seu fundador Roberto Cesar Terrasan.",cta:"Ver expediente"},
    {href:"/politica-editorial/",icon:"📋",title:"Princípios Editoriais",desc:"Nossas diretrizes de conduta: precisão factual, independência editorial e uso ético de inteligência artificial.",cta:"Ler política"},
    {href:"/colunistas/",icon:"✍️",title:"Colunistas & Articulistas",desc:"Especialistas independentes que contribuem com análises, opiniões e perspectivas sobre economia, política e mercado.",cta:"Ver colunistas"},
    {href:`mailto:ovalorcapital@gmail.com`,icon:"✉️",title:"Contato & Ouvidoria",desc:"Redação, pautas, parcerias, retificações e ouvidoria. Nossa equipe responde em até 48 horas úteis.",cta:"Entrar em contato"},
  ];
  const cardsHtml=sections.map(s=>`
  <a href="${s.href}" style="display:flex;flex-direction:column;background:#fff;border-radius:14px;box-shadow:0 2px 20px rgba(0,0,0,.07);padding:32px 28px;text-decoration:none;border:1px solid #e2e8f0;transition:transform .2s,box-shadow .2s" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 32px rgba(0,0,0,.12)'" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 2px 20px rgba(0,0,0,.07)'">
    <div style="font-size:2.2rem;margin-bottom:14px">${s.icon}</div>
    <div style="font-size:1.05rem;font-weight:800;color:#111;margin-bottom:8px">${s.title}</div>
    <div style="color:#64748b;font-size:.88rem;line-height:1.65;flex:1;margin-bottom:16px">${s.desc}</div>
    <div style="color:${gold};font-size:.88rem;font-weight:700">${s.cta} →</div>
  </a>`).join("");

  const pillars=[
    ["🎯","Precisão","Verificação rigorosa via fontes primárias e documentos públicos."],
    ["🔓","Independência","Sem afiliações políticas, partidárias ou corporativas."],
    ["🤖","Inovação","IA supervisionada para ampla cobertura com responsabilidade editorial."],
    ["⚖️","Pluralidade","Múltiplos ângulos, perspectivas diversas e contexto completo."],
  ];
  const pillarsHtml=pillars.map(([ic,t,d])=>`
  <div style="text-align:center;padding:28px 20px">
    <div style="font-size:2rem;margin-bottom:10px">${ic}</div>
    <div style="font-size:.95rem;font-weight:800;color:#fff;margin-bottom:6px">${t}</div>
    <div style="font-size:.82rem;color:rgba(255,255,255,.55);line-height:1.55">${d}</div>
  </div>`).join("");

  return `
<!-- HERO INSTITUCIONAL -->
<section style="background:linear-gradient(135deg,${navy} 0%,#0a0f1e 50%,#0d1a2e 100%);padding:100px 24px 84px;text-align:center;position:relative;overflow:hidden">
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% -10%,rgba(212,175,55,.14) 0%,transparent 60%);pointer-events:none"></div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(212,175,55,.4),transparent)"></div>
  <div style="position:relative;max-width:860px;margin:0 auto">
    <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(212,175,55,.15);border:1px solid rgba(212,175,55,.35);color:${gold};font-size:11px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;padding:5px 18px;border-radius:3px;margin-bottom:28px">◆ INSTITUCIONAL</div>
    <h1 style="color:#fff;font-size:clamp(2.8rem,7vw,4.8rem);font-weight:900;line-height:1.02;margin:0 0 22px;letter-spacing:-2px">O <span style="color:${gold}">Valor</span> Capital</h1>
    <p style="color:rgba(255,255,255,.72);font-size:1.15rem;max-width:640px;margin:0 auto 16px;line-height:1.7">Portal independente de jornalismo econômico, político e financeiro. Fundado em 2026 com o compromisso de democratizar a informação de qualidade no Brasil.</p>
    <p style="color:rgba(255,255,255,.45);font-size:.9rem;font-style:italic;margin:0 0 36px">"Informação de qualidade é direito, não privilégio."</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <a href="/quem-somos/" style="background:${gold};color:#111;font-size:14px;font-weight:800;padding:13px 30px;border-radius:7px;text-decoration:none;letter-spacing:.3px">Quem Somos →</a>
      <a href="/politica-editorial/" style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff;font-size:14px;font-weight:700;padding:13px 30px;border-radius:7px;text-decoration:none">Princípios Editoriais</a>
    </div>
  </div>
</section>

<!-- PILLARS STRIP -->
<section style="background:${navy};border-bottom:1px solid rgba(255,255,255,.07)">
  <div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));border-left:1px solid rgba(255,255,255,.07)">
    ${pillars.map(([ic,t,d])=>`<div style="text-align:center;padding:28px 20px;border-right:1px solid rgba(255,255,255,.07)"><div style="font-size:2rem;margin-bottom:10px">${ic}</div><div style="font-size:.95rem;font-weight:800;color:#fff;margin-bottom:6px">${t}</div><div style="font-size:.82rem;color:rgba(255,255,255,.5);line-height:1.55">${d}</div></div>`).join("")}
  </div>
</section>

<!-- SOBRE O PORTAL -->
<section style="background:#fff;padding:72px 24px">
  <div style="max-width:960px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center">
    <div>
      <span style="font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${gold}">SOBRE O PORTAL</span>
      <h2 style="font-size:2.2rem;font-weight:900;color:#111;margin:10px 0 20px;letter-spacing:-.8px;line-height:1.1">Jornalismo independente com tecnologia de ponta</h2>
      <p style="color:#374151;line-height:1.8;font-size:.97rem;margin:0 0 16px">O <strong>O Valor Capital</strong> nasceu da convicção de que o cidadão brasileiro merece acesso a informação econômica e política de qualidade, sem intermediários e sem viés ideológico.</p>
      <p style="color:#374151;line-height:1.8;font-size:.97rem;margin:0 0 24px">Utilizamos sistemas de <strong>Inteligência Artificial supervisionada</strong> para ampliar nossa cobertura, mantendo controle editorial humano rigoroso sobre todo o conteúdo publicado.</p>
      <a href="/quem-somos/" style="color:${gold};font-size:.93rem;font-weight:700;text-decoration:none">Leia nosso expediente completo →</a>
    </div>
    <div>
      <div style="background:linear-gradient(135deg,${navy} 0%,#1e3a5f 100%);border-radius:16px;padding:36px;color:#fff">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:28px">
          <div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,${gold} 0%,#b8860b 100%);display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:900;color:${navy};flex-shrink:0">RT</div>
          <div>
            <div style="font-weight:800;font-size:1rem">Roberto Cesar Terrasan</div>
            <div style="color:${gold};font-size:.82rem;font-weight:600;margin-top:2px">Fundador & Diretor Editorial</div>
          </div>
        </div>
        <p style="color:rgba(255,255,255,.75);font-size:.88rem;line-height:1.7;margin:0 0 20px">"Fundei o O Valor Capital para oferecer ao brasileiro informação de qualidade sobre os temas que realmente impactam sua vida: economia, política e mercado."</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          ${[["2026","Fundação"],["6+","Editorias"],["11","Colunistas"],["24/7","Cobertura"]].map(([n,l])=>`
          <div style="background:rgba(255,255,255,.08);border-radius:8px;padding:12px;text-align:center">
            <div style="color:${gold};font-size:1.4rem;font-weight:900">${n}</div>
            <div style="color:rgba(255,255,255,.55);font-size:.78rem;font-weight:600">${l}</div>
          </div>`).join("")}
        </div>
      </div>
    </div>
  </div>
</section>

<!-- NAVIGATION CARDS -->
<section style="background:#f8fafc;padding:64px 24px;border-top:1px solid #e2e8f0">
  <div style="max-width:960px;margin:0 auto">
    <div style="text-align:center;margin-bottom:40px">
      <span style="font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${gold}">SEÇÕES INSTITUCIONAIS</span>
      <h2 style="font-size:1.8rem;font-weight:900;color:#111;margin:8px 0 0;letter-spacing:-.5px">Explore o portal</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:20px">
      ${cardsHtml}
    </div>
  </div>
</section>`;
}

export default async function handler(req,res){
  const section=(req.query.section||"").toLowerCase();
  const cfg=SECTIONS[section];
  if(!cfg)return res.status(404).send("Not found");

  const isVc=section==="vc";
  const posts=isVc?[]:await fetchPosts(cfg.cats);
  const bodyHtml=isVc?renderVcInstitucional():renderLanding(section,posts,cfg);

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
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3652391568977586" crossorigin="anonymous"></script>
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