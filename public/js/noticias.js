(function(){
  const API = "/api/portal-posts";
  let _heroIndex = 0;
  let _heroPosts = [];
  let _heroTimer = null;

  function slugify(str){
    return (str||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-").slice(0,60);
  }

  function buildUrl(p){
    return "/api/materia/"+slugify(p.titulo||"materia")+"-"+(p.id||"").slice(0,8);
  }

  function dataBr(dt){
    if(!dt) return "";
    try{ return new Date(dt).toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"}); }
    catch(_){ return ""; }
  }

  const CAT = {politica:"Política",economia:"Economia",negocios:"Negócios",investimentos:"Investimentos",
    mercados:"Mercados",tributacao:"Tributação",regulacao:"Regulação",seguros:"Seguros",
    saude:"Saúde",familia:"Família",tecnologia:"Tecnologia",industria:"Indústria",
    educacao:"Educação",esportes:"Esportes",cultura:"Cultura",patrimonio:"Patrimônio",
    internacional:"Internacional",geral:"Geral"};

  function catLabel(c){ return CAT[c]||c||"Geral"; }

  // ── Rotação do hero principal ──
  function renderHeroRotation(el, posts){
    if(!el || !posts.length) return;
    _heroPosts = posts;
    _heroIndex = 0;

    function showHero(i){
      const p = _heroPosts[i];
      if(!p) return;
      const url = buildUrl(p);

      // Transição suave
      el.style.opacity = "0";
      el.style.transition = "opacity .4s";

      setTimeout(() => {
        const tit = el.querySelector(".card-title, .card-feature-title, h1, h2");
        const exc = el.querySelector(".card-excerpt, .card-feature-excerpt, p.excerpt");
        const tag = el.querySelector(".tag");
        const cta = el.querySelector(".card-cta");
        const meta = el.querySelector(".card-meta");

        if(tit) tit.textContent = p.titulo;
        if(exc) exc.textContent = p.resumo;
        if(tag) tag.innerHTML = '<span class="tag-dot"></span> '+catLabel(p.categoria);
        if(meta) meta.textContent = "Redação OVC • "+dataBr(p.data);
        if(cta){ cta.href = url; }

        // Imagem de fundo se disponível
        if(p.imagem){
          let imgDiv = el.querySelector(".ovc-hero-bg");
          if(!imgDiv){
            imgDiv = document.createElement("div");
            imgDiv.className = "ovc-hero-bg";
            imgDiv.style.cssText = "position:absolute;inset:0;background-size:cover;background-position:center;opacity:.18;border-radius:inherit;z-index:0;transition:background-image .4s;pointer-events:none;";
            el.style.position = "relative";
            el.insertBefore(imgDiv, el.firstChild);
          }
          imgDiv.style.backgroundImage = `url('${p.imagem}')`;
        }

        el.style.opacity = "1";
        el.style.cursor = "pointer";
        el.onclick = e => { if(!e.target.closest("a")) location.href = url; };
      }, 200);

      // Dots de navegação
      const dotsEl = document.getElementById("ovc-hero-dots");
      if(dotsEl){
        dotsEl.querySelectorAll(".ovc-dot").forEach((d,di) => {
          d.style.opacity = di===i ? "1" : "0.35";
          d.style.transform = di===i ? "scale(1.3)" : "scale(1)";
        });
      }
    }

    // Criar dots de navegação
    let dotsEl = document.getElementById("ovc-hero-dots");
    if(!dotsEl && el.parentNode){
      dotsEl = document.createElement("div");
      dotsEl.id = "ovc-hero-dots";
      dotsEl.style.cssText = "display:flex;gap:6px;justify-content:center;margin-top:10px;";
      _heroPosts.forEach((_,i) => {
        const dot = document.createElement("span");
        dot.className = "ovc-dot";
        dot.style.cssText = "width:7px;height:7px;border-radius:50%;background:#ffc800;cursor:pointer;transition:all .3s;";
        dot.onclick = () => { _heroIndex = i; showHero(i); };
        dotsEl.appendChild(dot);
      });
      el.parentNode.insertBefore(dotsEl, el.nextSibling);
    }

    showHero(0);

    // Rotação automática a cada 7 segundos
    if(_heroTimer) clearInterval(_heroTimer);
    _heroTimer = setInterval(() => {
      _heroIndex = (_heroIndex + 1) % _heroPosts.length;
      showHero(_heroIndex);
    }, 7000);
  }

  // ── Preencher card-feature (segundo destaque) ──
  function preencherCard(el, p){
    if(!el||!p) return;
    const url = buildUrl(p);
    const tit = el.querySelector(".card-title,.card-feature-title");
    const exc = el.querySelector(".card-excerpt,.card-feature-excerpt");
    const tag = el.querySelector(".tag");
    const cta = el.querySelector(".card-cta");
    const meta = el.querySelector(".card-meta");
    if(tit) tit.textContent = p.titulo;
    if(exc) exc.textContent = p.resumo;
    if(tag) tag.innerHTML = '<span class="tag-dot"></span> '+catLabel(p.categoria);
    if(meta) meta.textContent = "Redação OVC • "+catLabel(p.categoria);
    if(cta){ cta.href = url; }
    if(p.imagem && !el.querySelector(".ovc-card-img")){
      const img = document.createElement("div");
      img.className = "ovc-card-img";
      img.style.cssText = "width:100%;height:150px;background-size:cover;background-position:center;border-radius:6px;margin-bottom:10px;";
      img.style.backgroundImage = `url('${p.imagem}')`;
      el.insertBefore(img, el.firstChild);
    }
    el.style.cursor = "pointer";
    el.onclick = e => { if(!e.target.closest("a")) location.href = url; };
  }

  // ── Preencher card-mini ──
  function preencherMini(el, p){
    if(!el||!p) return;
    const url = buildUrl(p);
    const tit = el.querySelector(".card-title");
    const tag = el.querySelector(".tag");
    const cta = el.querySelector(".card-cta");
    const meta = el.querySelector(".card-meta");
    if(tit) tit.textContent = p.titulo;
    if(tag) tag.innerHTML = '<span class="tag-dot"></span> '+catLabel(p.categoria);
    if(meta) meta.textContent = "Redação OVC • "+catLabel(p.categoria);
    if(cta){ cta.href = url; }
    el.style.cursor = "pointer";
    el.onclick = e => { if(!e.target.closest("a")) location.href = url; };
  }

  // ── Carregar e preencher home ──
  async function loadNoticias(){
    try{
      const res = await fetch(API+"?limit=50");
      if(!res.ok) return;
      const json = await res.json();
      const posts = (json.posts||[]).filter(p => p.titulo && p.titulo.length > 0);
      if(!posts.length) return;

      let i = 0;

      // Hero principal — rotação com as 5 primeiras matérias
      const heroEl = document.querySelector(".card-hero-main");
      if(heroEl) renderHeroRotation(heroEl, posts.slice(0, 5));
      i = 5;

      // card-feature e card-monetizado
      preencherCard(document.querySelector(".card-feature"), posts[i++]);
      preencherCard(document.querySelector(".card-monetizado"), posts[i++]);

      // Cards da grade
      ["ovc-card-std-1","ovc-card-std-2","ovc-card-std-3","ovc-card-std-4","ovc-card-std-5","ovc-card-std-6"].forEach(id => {
        preencherCard(document.getElementById(id), posts[i++]);
      });
      ["ovc-card-mini-1","ovc-card-mini-2","ovc-card-mini-3","ovc-card-mini-4","ovc-card-mini-5"].forEach(id => {
        preencherMini(document.getElementById(id), posts[i++]);
      });

    }catch(e){ console.warn("OVC noticias:", e.message); }
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

      const set = (id,val) => { const el=document.getElementById(id); if(el) el.textContent=val; };
      set("ovc-materia-titulo", p.titulo);
      set("ovc-materia-subtitulo", p.subtitulo||"");
      set("ovc-materia-cat", catLabel(p.categoria));
      set("ovc-materia-data", "Redação OVC · "+dataBr(p.data));

      const imgEl = document.getElementById("ovc-materia-img");
      if(imgEl && p.imagem){
        imgEl.src = p.imagem;
        imgEl.style.display = "block";
        imgEl.onerror = () => imgEl.style.display = "none";
      }

      const corpo = p.corpo || p.resumo || "";
      bodyEl.innerHTML = corpo.split(/\n\n+/).filter(l=>l.trim())
        .map(l=>"<p>"+l.replace(/\n/g,"<br>")+"</p>").join("");

      document.title = p.titulo+" | O Valor Capital";

    }catch(e){ bodyEl.innerHTML="<p>Erro ao carregar matéria.</p>"; }
  }

  document.addEventListener("DOMContentLoaded",()=>{
    loadNoticias();
    loadMateria();
    setInterval(loadNoticias, 120000);
  });
})();
