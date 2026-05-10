(function () {
  "use strict";

  function slugify(str) {
    return (str || "").toLowerCase().normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 55);
  }

  function buildUrl(post) {
    let tags = [];
    try { tags = typeof post.user_tags === "string" ? JSON.parse(post.user_tags) : (post.user_tags || []); } catch (_) {}
    const cat = tags[0] || "vc";
    const catPath = cat === "tributacao" ? "tributos" : (cat === "colunistas" ? "vc" : cat);
    const id8 = (post.id || "").slice(0, 8);
    return `/${catPath}/${slugify(post.titulo)}-${id8}/`;
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
    const trio = document.getElementById("vc-trio");
    if (!trio) return;
    if (!posts.length) {
      trio.innerHTML = '<div class="vc-empty">Nenhuma coluna publicada ainda.</div>';
      return;
    }
    trio.innerHTML = posts.slice(0, 3).map(p => {
      const url = buildUrl(p);
      const imgStyle = p.imagem
        ? `background-image:linear-gradient(to top,rgba(0,0,0,.92) 0%,rgba(0,0,0,.35) 55%,transparent 100%),url('${p.imagem.replace(/'/g, "\\'")}')` 
        : "background:#111";
      return `
<a class="vc-trio-card" href="${url}" style="${imgStyle}">
  <div class="vc-trio-overlay"></div>
  <div class="vc-trio-body">
    <span class="vc-trio-badge">Opinião</span>
    <div class="vc-trio-title">${p.titulo || ""}</div>
    <div class="vc-trio-excerpt">${(p.comentario_fixado || "").slice(0, 100)}</div>
  </div>
</a>`;
    }).join("");
  }

  function renderList(posts) {
    const list = document.getElementById("vc-list");
    if (!list) return;
    const items = posts.slice(3);
    if (!items.length) { list.innerHTML = ""; return; }
    list.innerHTML = items.map(p => {
      const url = buildUrl(p);
      const thumb = p.imagem
        ? `<img class="vc-list-thumb" src="${p.imagem}" alt="" loading="lazy">`
        : `<div class="vc-list-thumb-empty"></div>`;
      return `
<a class="vc-list-item" href="${url}">
  ${thumb}
  <div>
    <div class="vc-list-cat">Opinião</div>
    <div class="vc-list-title">${p.titulo || ""}</div>
    <div class="vc-list-date">${formatDate(p.published_at)}</div>
  </div>
</a>`;
    }).join("");
  }

  async function init() {
    try {
      const r = await fetch("/api/portal-posts?categoria=vc&limit=18");
      if (!r.ok) throw new Error("fetch failed");
      const posts = await r.json();
      renderTrio(posts);
      renderList(posts);
    } catch (_) {
      const trio = document.getElementById("vc-trio");
      const list = document.getElementById("vc-list");
      if (trio) trio.innerHTML = '<div class="vc-empty">Conteúdo indisponível no momento.</div>';
      if (list) list.innerHTML = "";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
