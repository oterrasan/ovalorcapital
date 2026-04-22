(function(){
  const API = "/api/portal-posts";
  let _heroIndex = 0;
  let _heroPosts = [];
  let _heroTimer = null;

  function buildUrl(p){
    return "/materia/?id=" + (p.id||"").slice(0,8);
  }

  function dataBr(dt){
    if(!dt) return "";
    try{ return new Date(dt).toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"}); }
    catch(_){ return ""; }
  }

  const CAT = {politica:"Política",economia:"Economia",negocios:"Negócios",
    investimentos:"Investimentos",mercados:"Mercados",tributacao:"Tributação",
    regulacao:"Regulação",seguros:"Seguros",saude:"Saúde",familia:"Família",
    tecnologia:"Tecnologia",industria:"Indústria",educacao:"Educação",
    esportes:"Esportes",cultura:"Cultura",patrimonio:"Patrimônio",
    internacional:"Internacional",geral:"Geral"};

  function catLabel(c){ return CAT[c]||c||"Geral"; }

  // Preenche hero principal com rotação — SEM alterar estrutura, só texto
  function setupHeroRotation(el, posts){
    if(!el || !posts.length) return;
    _heroPosts = posts.slice(0,5);
    _heroIndex = 0;

    // Criar dots de navegação uma vez
    if(!document.getElementById("ovc-hero-dots")){
      const dots = document.createElement("div");
      dots.id = "ovc-hero-dots";
      dots.style.cssText = "display:flex;gap:6px;margin-top:8px;";
      _heroPosts.forEach((_,i)=>{
        const d = document.createElement("span");
        d.style.cssText = "width:6px;height:6px;border-radius:50%;background:#ffc800;cursor:pointer;transition:opacity .3s;";
        d.onclick = ()=>{ _heroIndex=i; showHero(i); };
        dots.appendChild(d);
      });
      el.parentNode && el.parentNode.insertBefore(dots, el.nextSibling);
    }

    function showHero(i){
      const p = _heroPosts[i];
      if(!p) return;
      const url = buildUrl(p);
      // Só alterar texto e links — NÃO tocar em CSS/estrutura
      const tit = el.querySelector(".card-title, h1, h2");
      const exc = el.querySelector(".card-excerpt, p:not(.card-meta)");
      const tag = el.querySelector(".tag");
      const cta = el.querySelector(".card-cta");
      const meta = el.querySelector(".card-meta");
      if(tit) tit.textContent = p.titulo;
      if(exc) exc.textContent = (p.resumo||"").slice(0,120);
      if(tag) tag.innerHTML = '<span class="tag-dot"></span> ' + catLabel(p.categoria);
      if(meta) meta.textContent = "Redação OVC • " + dataBr(p.data);
      if(cta){ cta.href = url; }
      el.style.cursor = "pointer";
      el.onclick = e=>{ if(!e.target.closest("a")) location.href = url; };

      // Atualizar dots
      const dotsEl = document.getElementById("ovc-hero-dots");
      if(dotsEl){
        Array.from(dotsEl.children).forEach((d,di)=>{
          d.style.opacity = di===i ? "1" : "0.3";
        });
      }
    }

    showHero(0);
    if(_heroTimer) clearInterval(_heroTimer);
    _heroTimer = setInterval(()=>{
      _heroIndex = (_heroIndex+1) % _heroPosts.length;
      showHero(_heroIndex);
    }, 7000);
  }

  // Preenche qualquer card — SÓ texto e links, sem tocar no layout
  function preencherCard(el, p){
    if(!el||!p) return;
    const url = buildUrl(p);
    const tit = el.querySelector(".card-title, .card-feature-title, h2, h3");
    const exc = el.querySelector(".card-excerpt, .card-feature-excerpt, p");
    const tag = el.querySelector(".tag");
    const cta = el.querySelector(".card-cta");
    const meta = el.querySelector(".card-meta");
    if(tit) tit.textContent = p.titulo;
    if(exc) exc.textContent = (p.resumo||"").slice(0,150);
    if(tag) tag.innerHTML = '<span class="tag-dot"></span> ' + catLabel(p.categoria);
    if(meta) meta.textContent = "Redação OVC • " + catLabel(p.categoria);
    if(cta){ cta.href = url; }
    el.style.cursor = "pointer";
    el.onclick = e=>{ if(!e.target.closest("a")) location.href = url; };
  }

  function preencherMini(el, p){
    if(!el||!p) return;
    const url = buildUrl(p);
    const tit = el.querySelector(".card-title, h3");
    const tag = el.querySelector(".tag");
    const cta = el.querySelector(".card-cta");
    const meta = el.querySelector(".card-meta");
    if(tit) tit.textContent = p.titulo;
    if(tag) tag.innerHTML = '<span class="tag-dot"></span> ' + catLabel(p.categoria);
    if(meta) meta.textContent = "Redação OVC • " + catLabel(p.categoria);
    if(cta){ cta.href = url; }
    el.style.cursor = "pointer";
    el.onclick = e=>{ if(!e.target.closest("a")) location.href = url; };
  }

  async function loadNoticias(){
    try{
      const res = await fetch(API+"?limit=50");
      if(!res.ok) return;
      const json = await res.json();
      const posts = (json.posts||[]).filter(p=>p.titulo&&p.titulo.length>0);
      if(!posts.length) return;

      let i = 0;

      // Hero com rotação
      const heroEl = document.querySelector(".card-hero-main");
      if(heroEl){ setupHeroRotation(heroEl, posts); i = 5; }

      // Cards secundários
      preencherCard(document.querySelector(".card-feature"), posts[i++]);
      preencherCard(document.querySelector(".card-monetizado"), posts[i++]);

      // Cards da grade (com IDs)
      ["ovc-card-std-1","ovc-card-std-2","ovc-card-std-3",
       "ovc-card-std-4","ovc-card-std-5","ovc-card-std-6"].forEach(id=>{
        preencherCard(document.getElementById(id), posts[i++]);
      });
      ["ovc-card-mini-1","ovc-card-mini-2","ovc-card-mini-3",
       "ovc-card-mini-4","ovc-card-mini-5"].forEach(id=>{
        preencherMini(document.getElementById(id), posts[i++]);
      });

    }catch(e){ console.warn("OVC noticias:", e.message); }
  }

  document.addEventListener("DOMContentLoaded",()=>{
    loadNoticias();
    setInterval(loadNoticias, 120000);
  });
})();
