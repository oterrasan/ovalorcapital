(function(){
  const API = "/api/portal-posts";

  function slugify(str){
    return (str||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-").slice(0,60);
  }

  function buildUrl(post){
    return `/materia/${slugify(post.titulo)}-${post.id.slice(0,8)}`;
  }

  function dataBr(dt){
    if(!dt) return "";
    return new Date(dt).toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"});
  }

  function catLabel(cat){
    const m = {politica:"Política",economia:"Economia",negocios:"Negócios",investimentos:"Investimentos",
      mercados:"Mercados",tributacao:"Tributação",regulacao:"Regulação",seguros:"Seguros",
      saude:"Saúde",familia:"Família",tecnologia:"Tecnologia",industria:"Indústria",
      educacao:"Educação",esportes:"Esportes",cultura:"Cultura",patrimonio:"Patrimônio",
      internacional:"Internacional",geral:"Geral"};
    return m[cat] || cat || "Geral";
  }

  // Renderiza card destaque (grande)
  function renderHero(post){
    return `
    <div class="ovc-news-card ovc-news-hero" onclick="window.location='${buildUrl(post)}'">
      ${post.imagem ? `<div class="ovc-news-img" style="background-image:url('${post.imagem}')"></div>` : ""}
      <div class="ovc-news-body">
        <span class="ovc-news-cat">${catLabel(post.categoria)}</span>
        <h2 class="ovc-news-titulo">${post.titulo}</h2>
        <p class="ovc-news-resumo">${post.resumo || ""}</p>
        <span class="ovc-news-meta">Redação OVC · ${dataBr(post.data)}</span>
      </div>
    </div>`;
  }

  // Renderiza card médio
  function renderCard(post){
    return `
    <div class="ovc-news-card ovc-news-medium" onclick="window.location='${buildUrl(post)}'">
      ${post.imagem ? `<div class="ovc-news-img-sm" style="background-image:url('${post.imagem}')"></div>` : ""}
      <div class="ovc-news-body">
        <span class="ovc-news-cat">${catLabel(post.categoria)}</span>
        <h3 class="ovc-news-titulo-sm">${post.titulo}</h3>
        <span class="ovc-news-meta">Redação OVC · ${dataBr(post.data)}</span>
      </div>
    </div>`;
  }

  // Renderiza card pequeno (lista)
  function renderSmall(post){
    return `
    <div class="ovc-news-item" onclick="window.location='${buildUrl(post)}'">
      <span class="ovc-news-cat-xs">${catLabel(post.categoria)}</span>
      <span class="ovc-news-titulo-xs">${post.titulo}</span>
      <span class="ovc-news-meta-xs">${dataBr(post.data)}</span>
    </div>`;
  }

  async function loadNoticias(){
    try {
      const res = await fetch(`${API}?limit=30`);
      if(!res.ok) return;
      const json = await res.json();
      const posts = json.posts || [];
      if(!posts.length) return;

      // Destaque principal
      const hero = document.getElementById("ovc-news-hero");
      if(hero && posts[0]) hero.innerHTML = renderHero(posts[0]);

      // Grid secundário (2-4)
      const grid = document.getElementById("ovc-news-grid");
      if(grid) grid.innerHTML = posts.slice(1,4).map(renderCard).join("");

      // Lista de matérias (5-20)
      const lista = document.getElementById("ovc-news-lista");
      if(lista) lista.innerHTML = posts.slice(4,20).map(renderSmall).join("");

      // Seções por categoria
      const cats = ["politica","economia","investimentos","negocios","tributacao","seguros","saude","familia","tecnologia","esportes"];
      for(const cat of cats){
        const el = document.getElementById(`ovc-sec-${cat}`);
        if(!el) continue;
        const catPosts = posts.filter(p=>p.categoria===cat).slice(0,4);
        if(catPosts.length) el.innerHTML = catPosts.map(renderCard).join("");
      }

    } catch(e){
      console.warn("OVC noticias:", e.message);
    }
  }

  // Carregar matéria individual
  async function loadMateria(){
    const el = document.getElementById("ovc-materia-body");
    if(!el) return;
    const path = window.location.pathname;
    const match = path.match(/([a-f0-9]{8})$/);
    if(!match) return;
    const id8 = match[1];

    // Buscar por ID parcial
    try {
      const res = await fetch(`${API}?limit=200`);
      const json = await res.json();
      const post = (json.posts||[]).find(p=>p.id.startsWith(id8));
      if(!post) { el.innerHTML = "<p>Matéria não encontrada.</p>"; return; }

      const tit = document.getElementById("ovc-materia-titulo");
      const sub = document.getElementById("ovc-materia-subtitulo");
      const img = document.getElementById("ovc-materia-img");
      const cat = document.getElementById("ovc-materia-cat");
      const data = document.getElementById("ovc-materia-data");

      if(tit) tit.textContent = post.titulo;
      if(sub) sub.textContent = post.subtitulo || "";
      if(img && post.imagem) { img.src = post.imagem; img.style.display="block"; }
      if(cat) cat.textContent = catLabel(post.categoria);
      if(data) data.textContent = "Redação OVC · " + dataBr(post.data);

      // Formatar corpo com parágrafos
      const corpo = (post.corpo||"").split("\n\n").map(p=>`<p>${p.replace(/\n/g,"<br>")}</p>`).join("");
      el.innerHTML = corpo;

      // Title da página
      document.title = post.titulo + " | O Valor Capital";
    } catch(e){
      el.innerHTML = "<p>Erro ao carregar matéria.</p>";
    }
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    loadNoticias();
    loadMateria();
    setInterval(loadNoticias, 120000); // Atualizar a cada 2 min
  });
})();
