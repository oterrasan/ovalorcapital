(function(){
  const API = "/api/portal-posts";

  function slugify(str){
    return (str||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-").slice(0,60);
  }

  function buildUrl(p){
    return "/materia/"+slugify(p.titulo||"materia")+"-"+(p.id||"").slice(0,8);
  }

  function dataBr(dt){
    if(!dt) return "";
    try{ return new Date(dt).toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"}); }catch(_){ return ""; }
  }

  const CAT = {politica:"Política",economia:"Economia",negocios:"Negócios",investimentos:"Investimentos",
    mercados:"Mercados",tributacao:"Tributação",regulacao:"Regulação",seguros:"Seguros",
    saude:"Saúde",familia:"Família",tecnologia:"Tecnologia",industria:"Indústria",
    educacao:"Educação",esportes:"Esportes",cultura:"Cultura",patrimonio:"Patrimônio",
    internacional:"Internacional",geral:"Geral"};

  function catLabel(c){ return CAT[c]||c||"Geral"; }

  // Preenche um card-hero-main ou card-feature
  function preencherHero(el, p){
    if(!el||!p) return;
    const url = buildUrl(p);
    const tit = el.querySelector(".card-title, .card-feature-title");
    const exc = el.querySelector(".card-excerpt, .card-feature-excerpt");
    const tag = el.querySelector(".tag");
    const cta = el.querySelector(".card-cta");
    const meta = el.querySelector(".card-meta");
    if(tit) tit.textContent = p.titulo||"";
    if(exc) exc.textContent = p.resumo||"";
    if(tag) tag.innerHTML = '<span class="tag-dot"></span> '+catLabel(p.categoria);
    if(meta) meta.textContent = "Redação OVC • "+dataBr(p.data);
    if(cta){ cta.href=url; cta.querySelector("span:first-child").textContent="Leia a análise completa"; }
    // Imagem no hero principal
    if(p.imagem && el.classList.contains("card-hero-main")){
      let imgDiv = el.querySelector(".card-hero-img");
      if(!imgDiv){
        imgDiv = document.createElement("div");
        imgDiv.className = "card-hero-img";
        imgDiv.style.cssText = "width:100%;height:200px;background-size:cover;background-position:center;border-radius:8px;margin-bottom:12px;";
        el.insertBefore(imgDiv, el.firstChild);
      }
      imgDiv.style.backgroundImage = "url('"+p.imagem+"')";
    }
    el.style.cursor = "pointer";
    el.onclick = function(e){ if(!e.target.closest("a")) location.href=url; };
  }

  // Preenche card-standard (com imagem no topo se disponível)
  function preencherStd(el, p){
    if(!el||!p) return;
    const url = buildUrl(p);
    const tit = el.querySelector(".card-title");
    const exc = el.querySelector(".card-excerpt");
    const tag = el.querySelector(".tag");
    const cta = el.querySelector(".card-cta");
    const meta = el.querySelector(".card-meta");
    if(tit) tit.textContent = p.titulo||"";
    if(exc) exc.textContent = p.resumo||"";
    if(tag) tag.innerHTML = '<span class="tag-dot"></span> '+catLabel(p.categoria);
    if(meta) meta.textContent = "Redação OVC • "+catLabel(p.categoria);
    if(cta){ cta.href=url; }
    // Inserir imagem se existir e não tiver ainda
    if(p.imagem && !el.querySelector(".card-img-top")){
      const img = document.createElement("div");
      img.className = "card-img-top";
      img.style.cssText = "width:100%;height:160px;background-size:cover;background-position:center;border-radius:6px 6px 0 0;margin-bottom:12px;";
      img.style.backgroundImage = "url('"+p.imagem+"')";
      el.insertBefore(img, el.firstChild);
    }
    el.style.cursor = "pointer";
    el.onclick = function(e){ if(!e.target.closest("a")) location.href=url; };
  }

  // Preenche card-mini
  function preencherMini(el, p){
    if(!el||!p) return;
    const url = buildUrl(p);
    const tit = el.querySelector(".card-title");
    const tag = el.querySelector(".tag");
    const cta = el.querySelector(".card-cta");
    const meta = el.querySelector(".card-meta");
    if(tit) tit.textContent = p.titulo||"";
    if(tag) tag.innerHTML = '<span class="tag-dot"></span> '+catLabel(p.categoria);
    if(meta) meta.textContent = "Redação OVC • "+catLabel(p.categoria);
    if(cta){ cta.href=url; }
    el.style.cursor = "pointer";
    el.onclick = function(e){ if(!e.target.closest("a")) location.href=url; };
  }

  async function loadNoticias(){
    try{
      const res = await fetch(API+"?limit=40");
      if(!res.ok) return;
      const json = await res.json();
      const posts = (json.posts||[]).filter(p=>p.titulo&&p.titulo.length>0);
      if(!posts.length) return;

      let i = 0;

      // ── Hero principal e cards de destaque ──
      preencherHero(document.querySelector(".card-hero-main"), posts[i++]);
      preencherHero(document.querySelector(".card-feature"), posts[i++]);
      preencherHero(document.querySelector(".card-monetizado"), posts[i++]);

      // ── Coluna 1: Política & Economia ──
      preencherStd(document.getElementById("ovc-card-std-1"), posts[i++]);
      preencherStd(document.getElementById("ovc-card-std-2"), posts[i++]);
      preencherMini(document.getElementById("ovc-card-mini-1"), posts[i++]);
      preencherMini(document.getElementById("ovc-card-mini-2"), posts[i++]);

      // ── Coluna 2: Negócios, Investimentos & Mercados ──
      preencherStd(document.getElementById("ovc-card-std-3"), posts[i++]);
      preencherStd(document.getElementById("ovc-card-std-4"), posts[i++]);
      preencherMini(document.getElementById("ovc-card-mini-3"), posts[i++]);
      preencherMini(document.getElementById("ovc-card-mini-4"), posts[i++]);

      // ── Coluna 3: Família, Saúde, Tributos ──
      preencherStd(document.getElementById("ovc-card-std-5"), posts[i++]);
      preencherStd(document.getElementById("ovc-card-std-6"), posts[i++]);
      preencherMini(document.getElementById("ovc-card-mini-5"), posts[i++]);

    }catch(e){
      console.warn("OVC noticias:", e.message);
    }
  }

  // ── Página de matéria individual ──
  async function loadMateria(){
    const bodyEl = document.getElementById("ovc-materia-body");
    if(!bodyEl) return;

    const match = window.location.pathname.match(/-([a-f0-9]{8})\/?$/);
    if(!match){ bodyEl.innerHTML="<p>Matéria não encontrada.</p>"; return; }

    try{
      const res = await fetch(API+"?id="+match[1]);
      if(!res.ok){ bodyEl.innerHTML="<p>Matéria não encontrada.</p>"; return; }
      const p = await res.json();
      if(!p||!p.titulo){ bodyEl.innerHTML="<p>Matéria não encontrada.</p>"; return; }

      const set = (id,val)=>{ const el=document.getElementById(id); if(el) el.textContent=val; };
      set("ovc-materia-titulo", p.titulo);
      set("ovc-materia-subtitulo", p.subtitulo||"");
      set("ovc-materia-cat", catLabel(p.categoria));
      set("ovc-materia-data", "Redação OVC · "+dataBr(p.data));

      const imgEl = document.getElementById("ovc-materia-img");
      if(imgEl && p.imagem){
        imgEl.src = p.imagem;
        imgEl.style.display = "block";
        imgEl.onerror = ()=>imgEl.style.display="none";
      }

      const corpo = p.corpo||p.resumo||"";
      bodyEl.innerHTML = corpo.split(/\n\n+/).filter(l=>l.trim())
        .map(l=>"<p>"+l.replace(/\n/g,"<br>")+"</p>").join("");

      document.title = p.titulo+" | O Valor Capital";

    }catch(e){
      bodyEl.innerHTML="<p>Erro ao carregar matéria.</p>";
    }
  }

  document.addEventListener("DOMContentLoaded",()=>{
    loadNoticias();
    loadMateria();
    setInterval(loadNoticias, 120000);
  });
})();
