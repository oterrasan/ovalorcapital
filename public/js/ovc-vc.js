(function () {
  "use strict";

  const API = "/api/portal-posts?categoria=vc&limit=18";

  function slugify(str) {
    return (str || "").toLowerCase().normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 55);
  }

  function buildUrl(post) {
    const cat = (post.categoria || post.subcategoria || "vc");
    const id8 = (post.id || "").slice(0, 8);
    return `/${cat}/${slugify(post.titulo)}-${id8}/`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "short", year: "numeric"
      });
    } catch (_) { return ""; }
  }

  function renderTrio(posts) {
    const el = document.getElementById("vc-trio");
    if (!el) return;
    el.innerHTML = posts.slice(0, 3).map(p => {
      const bg = p.imagem
        ? `background-image:linear-gradient(to top,rgba(0,0,0,.9) 0%,rgba(0,0,0,.35) 55%,transparent 100%),url('${p.imagem}')`
        : "background:#1a1a1a";
      return `
<a class="ed-trio-card" href="${buildUrl(p)}" style="${bg}">
  <div class="ed-trio-body">
    <span class="ed-badge">Opinião</span>
    <h2 class="ed-trio-title">${p.titulo || ""}</h2>
    <p class="ed-trio-excerpt">${(p.meta_descricao || p.comentario_fixado || "").slice(0, 110)}</p>
  </div>
</a>`;
    }).join("");
  }

  function renderList(posts) {
    const el = document.getElementById("vc-list");
    if (!el) return;
    el.innerHTML = posts.slice(3, 18).map(p => {
      const thumb = p.imagem
        ? `<img class="ed-list-thumb" src="${p.imagem}" alt="" loading="lazy">`
        : `<div class="ed-list-thumb ed-list-thumb-empty"></div>`;
      return `
<a class="ed-list-item" href="${buildUrl(p)}">
  ${thumb}
  <div class="ed-list-text">
    <div class="ed-list-cat">Opinião · ${formatDate(p.published_at)}</div>
    <div class="ed-list-title">${p.titulo || ""}</div>
  </div>
</a>`;
    }).join("");
  }

  async function init() {
    try {
      const res = await fetch(API);
      if (!res.ok) return;
      const posts = await res.json();
      if (!Array.isArray(posts) || !posts.length) return;
      renderTrio(posts);
      renderList(posts);
    } catch (_) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
