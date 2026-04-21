(function(){
  const API = "/api/portal-posts";

  function slugify(str){
    return (str||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-").slice(0,60);
  }

  function buildUrl(post){
    const s = slugify(post.titulo || "materia");
    const id8 = (post.id||"").slice(0,8);
    return `/materia/${s}-${id8}`;
  }

  function dataBr(dt){
    if(!dt) return "";
    try { return new Date(dt).toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"}); }
    catch(_){ return ""; }
  }

  function catLabel(cat){
    const m = {politica:"Política",economia:"Economia",negocios:"Negócios",investimentos:"Investimentos",
      mercados:"Mercados",tributacao:"Tributação",regulacao:"Regulação",seguros:"Seguros",
      saude:"Saúde",familia:"Família",tecnologia:"Tecnologia",industria:"Indústria",
      educacao:"Educação",esportes:"Esportes",cultura:"Cultura",patrimonio:"Patrimônio",
      internacional:"Internacional",geral:"Geral"};
    return m[cat] || cat || "Geral";
  }

  function esc(str){ return (str||"").replace(/"/g,"&quot;").replace(/</g,"&lt;"); }

  // Card grande (hero destaque)
  function renderHero(post){
    const url = buildUrl(post);
    return `<div class="ovc-news-card ovc-news-hero" onclick="location.href='${url}'" style="cursor:pointer">
      ${post.imagem?`<div class="ovc-news-img" style="background-image:url('${esc(post.imagem)}')"></div>`:""}
      <div class="ovc-news-body">
        <span class="ovc-news-cat">${catLabel(post.categoria)}</span>
        <h2 class="ovc-news-titulo">${esc(post.titulo)}</h2>
        <p class="ovc-news-resumo">${esc(post.resumo)}</p>
        <span class="ovc-news-meta">Redação OVC · ${dataBr(post.data)}</span>
      </div>
    </div>`;
  }

  // Card médio
  function renderCard(post){
    const url = buildUrl(post);
    return `<div class="ovc-news-card ovc-news-medium" onclick="location.href='${url}'" style="cursor:pointer">
      ${post.imagem?`<div class="ovc-news-img-sm" style="background-image:url('${esc(post.imagem)}')"></div>`:""}
      <div class="ovc-news-body">
        <span class="ovc-news-cat">${catLabel(post.categoria)}</span>
        <h3 class="ovc-news-titulo-sm">${esc(post.titulo)}</h3>
        <p style="font-size:13px;color:#94a3b8;margin:4px 0 0;line-height:1.5">${esc(post.resumo).slice(0,100)}...</p>
        <span class="ovc-news-meta">Redação OVC · ${dataBr(post.data)}</span>
      </div>
    </div>`;
  }

  // Item de lista
  function renderSmall(post){
    const url = buildUrl(post);
    return `<div class="ovc-news-item" onclick="location.href='${url}'" style="cursor:pointer">
      <span class="ovc-news-cat-xs">${catLabel(post.categoria)}</span>
      <span class="ovc-news-titulo-xs">${esc(post.titulo)}</span>
      <span class="ovc-news-meta-xs">${dataBr(post.data)}</span>
    </div>`;
  }

  // Preencher cards fixos do portal (hero-main, card-feature, etc.)
  function preencherCardsExistentes(posts){
    if(!posts.length) return;

    // Card hero principal (card-hero-main)
    const hero = document.querySelector(".card-hero-main");
    if(hero && posts[0]){
      const p = posts[0];
      const url = buildUrl(p);
      const tit = hero.querySelector(".card-title");
      const exc = hero.querySelector(".card-excerpt");
      const tag = hero.querySelector(".tag");
      const cta = hero.querySelector(".card-cta");
      if(tit) tit.textContent = p.titulo;
      if(exc) exc.textContent = p.resumo;
      if(tag) tag.innerHTML = `<span class="tag-dot"></span> ${catLabel(p.categoria)}`;
      if(cta) cta.href = url;
      hero.style.cursor = "pointer";
      hero.onclick = () => location.href = url;
    }

    // Card feature (segundo destaque)
    const feature = document.querySelector(".card-feature");
    if(feature && posts[1]){
      const p = posts[1];
      const url = buildUrl(p);
      const tit = feature.querySelector(".card-feature-title");
      const exc = feature.querySelector(".card-feature-excerpt");
      const tag = feature.querySelector(".tag");
      const cta = feature.querySelector(".card-cta");
      if(tit) tit.textContent = p.titulo;
      if(exc) exc.textContent = p.resumo;
      if(tag) tag.innerHTML = `<span class="tag-dot"></span> ${catLabel(p.categoria)}`;
      if(cta) cta.href = url;
      feature.style.cursor = "pointer";
      feature.onclick = () => location.href = url;
    }

    // Card monetizado (terceiro)
    const mono = document.querySelector(".card-monetizado");
    if(mono && posts[2]){
      const p = posts[2];
      const url = buildUrl(p);
      const tit = mono.querySelector(".card-title");
      const exc = mono.querySelector(".card-excerpt");
      const tag = mono.querySelector(".tag");
      const cta = mono.querySelector(".card-cta");
      if(tit) tit.textContent = p.titulo;
      if(exc) exc.textContent = p.resumo;
      if(tag) tag.innerHTML = `<span class="tag-dot"></span> ${catLabel(p.categoria)}`;
      if(cta) cta.href = url;
      mono.style.cursor = "pointer";
      mono.onclick = () => location.href = url;
    }

    // Cards mini (card-mini) — preencher com posts 3+
    const minis = document.querySelectorAll(".card-mini");
    minis.forEach((el, i) => {
      const p = posts[3 + i];
      if(!p) return;
      const url = buildUrl(p);
      const tit = el.querySelector(".card-title");
      const tag = el.querySelector(".tag");
      const cta = el.querySelector(".card-cta");
      if(tit) tit.textContent = p.titulo;
      if(tag) tag.innerHTML = `<span class="tag-dot"></span> ${catLabel(p.categoria)}`;
      if(cta) cta.href = url;
      el.style.cursor = "pointer";
      el.onclick = () => location.href = url;
    });
  }

  async function loadNoticias(){
    try {
      const res = await fetch(`${API}?limit=40`);
      if(!res.ok) return;
      const json = await res.json();
      const posts = (json.posts || []).filter(p => p.titulo && p.titulo.length > 0);
      if(!posts.length) return;

      // 1. Preencher cards fixos do portal
      preencherCardsExistentes(posts);

      // 2. Destaque dinâmico
      const heroEl = document.getElementById("ovc-news-hero");
      if(heroEl && posts[0]) heroEl.innerHTML = renderHero(posts[0]);

      // 3. Grid secundário
      const gridEl = document.getElementById("ovc-news-grid");
      if(gridEl) gridEl.innerHTML = posts.slice(1,4).map(renderCard).join("");

      // 4. Lista de últimas
      const listaEl = document.getElementById("ovc-news-lista");
      if(listaEl) listaEl.innerHTML = posts.slice(4,24).map(renderSmall).join("");

      // 5. Seções por categoria
      const cats = ["politica","economia","investimentos","negocios","tributacao","seguros","saude","familia","tecnologia","esportes","cultura","internacional"];
      for(const cat of cats){
        const el = document.getElementById(`ovc-sec-${cat}`);
        if(!el) continue;
        const catPosts = posts.filter(p => p.categoria === cat).slice(0,4);
        if(catPosts.length) el.innerHTML = catPosts.map(renderCard).join("");
      }

    } catch(e){
      console.warn("OVC noticias:", e.message);
    }
  }

  // Página de matéria individual
  async function loadMateria(){
    const bodyEl = document.getElementById("ovc-materia-body");
    if(!bodyEl) return;

    const path = window.location.pathname;
    // Extrair ID parcial (últimos 8 chars antes do fim)
    const match = path.match(/-([a-f0-9]{8})(?:\/)?$/);
    if(!match) { bodyEl.innerHTML = "<p>Matéria não encontrada.</p>"; return; }

    const id8 = match[1];
    try {
      const res = await fetch(`${API}?id=${id8}`);
      if(!res.ok) { bodyEl.innerHTML = "<p>Matéria não encontrada.</p>"; return; }
      const post = await res.json();
      if(!post || !post.titulo) { bodyEl.innerHTML = "<p>Matéria não encontrada.</p>"; return; }

      // Preencher elementos da página
      const titEl = document.getElementById("ovc-materia-titulo");
      const subEl = document.getElementById("ovc-materia-subtitulo");
      const imgEl = document.getElementById("ovc-materia-img");
      const catEl = document.getElementById("ovc-materia-cat");
      const datEl = document.getElementById("ovc-materia-data");

      if(titEl) titEl.textContent = post.titulo;
      if(subEl) subEl.textContent = post.subtitulo || "";
      if(catEl) catEl.textContent = catLabel(post.categoria);
      if(datEl) datEl.textContent = "Redação OVC · " + dataBr(post.data);
      if(imgEl && post.imagem){
        imgEl.src = post.imagem;
        imgEl.style.display = "block";
        imgEl.onerror = () => imgEl.style.display = "none";
      }

      // Formatar corpo em parágrafos
      const corpo = post.corpo || post.resumo || "";
      const paragrafos = corpo.split(/\n\n+/).filter(l => l.trim());
      bodyEl.innerHTML = paragrafos.map(p =>
        `<p>${p.replace(/\n/g,"<br>")}</p>`
      ).join("");

      // Atualizar título da página
      document.title = post.titulo + " | O Valor Capital";

      // Meta description
      const meta = document.querySelector('meta[name="description"]');
      if(meta) meta.setAttribute("content", post.resumo || post.titulo);

    } catch(e){
      bodyEl.innerHTML = "<p>Erro ao carregar matéria.</p>";
      console.warn("OVC materia:", e.message);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadNoticias();
    loadMateria();
    setInterval(loadNoticias, 120000);
  });
})();
