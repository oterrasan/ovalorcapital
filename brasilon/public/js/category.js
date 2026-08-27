// Brasil ON — página de categoria: mesmo motor de disposição de card
// da home (blocks.js), sem pill de categoria repetida (a página já é
// só de uma categoria). Roberto, 27/08/2026: "precisa ter as mais
// lidas, precisa ter as ultimas, precisa ter paginacao... que nao tem
// nada disso" — os 3 adicionados aqui: paginação real ("Carregar mais",
// preserva o ciclo de formatos entre páginas), lateral "Últimas"
// (sitewide, não só desta categoria) e "Mais Lidas" (ver mais-lidas.js).
(function () {
  var PAGE_SIZE = 20;
  var state = { categoria: "", offset: 0, total: 0, tIdx: 0 };

  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function timeAgo(iso) {
    if (!iso) return "";
    var diffMs = Date.now() - new Date(iso).getTime();
    var min = Math.floor(diffMs / 60000);
    if (min < 1) return "agora";
    if (min < 60) return "há " + min + " min";
    var h = Math.floor(min / 60);
    if (h < 24) return "há " + h + "h";
    var d = Math.floor(h / 24);
    return "há " + d + "d";
  }
  function sideItemHtml(p) {
    return '<a class="bon-side-item" href="' + p.url + '"><h5>' + esc(p.titulo) + "</h5><time>" + timeAgo(p.published_at) + "</time></a>";
  }

  function renderPagination(container) {
    var carregados = state.offset;
    if (carregados >= state.total) {
      container.innerHTML = '<div class="bon-pagination-done">Você viu todas as notícias desta categoria.</div>';
      return;
    }
    container.innerHTML = '<button type="button" class="bon-pagination-btn" data-bon-load-more>Carregar mais notícias</button>';
  }

  async function carregarPagina(blocksSlot, paginationSlot) {
    var r = await fetch("/api/portal-posts?categoria=" + encodeURIComponent(state.categoria) + "&limit=" + PAGE_SIZE + "&offset=" + state.offset);
    var d = await r.json();
    var posts = d.posts || [];
    state.total = d.total || 0;

    if (state.offset === 0 && !posts.length) {
      blocksSlot.innerHTML = '<div class="bon-empty">Nenhuma notícia publicada nesta categoria ainda.</div>';
      if (paginationSlot) paginationSlot.innerHTML = "";
      return;
    }

    var result = window.BonBlocks.renderBlocks(posts, { showPill: false, startAt: state.tIdx });
    if (state.offset === 0) blocksSlot.innerHTML = result.html;
    else blocksSlot.insertAdjacentHTML("beforeend", result.html);
    state.tIdx = result.nextIndex;
    state.offset += posts.length;

    if (paginationSlot) renderPagination(paginationSlot);
  }

  async function carregarUltimasLateral() {
    var slot = document.querySelector("[data-bon-ultimas]");
    if (!slot) return;
    try {
      var r = await fetch("/api/portal-posts?limit=10");
      var d = await r.json();
      var posts = d.posts || [];
      slot.innerHTML = posts.length ? posts.map(sideItemHtml).join("") : '<div class="bon-widget-empty">Sem notícias no momento.</div>';
    } catch (_) {
      slot.innerHTML = '<div class="bon-widget-empty">Não foi possível carregar agora.</div>';
    }
  }

  async function load() {
    var blocksSlot = document.querySelector("[data-bon-grid]");
    if (!blocksSlot) return;
    state.categoria = document.body.getAttribute("data-category") || "";
    var paginationSlot = document.querySelector("[data-bon-pagination]");

    try {
      await carregarPagina(blocksSlot, paginationSlot);
    } catch (_) {
      blocksSlot.innerHTML = '<div class="bon-empty">Não foi possível carregar as notícias agora.</div>';
      return;
    }

    if (paginationSlot) {
      paginationSlot.addEventListener("click", function (e) {
        if (!e.target.closest("[data-bon-load-more]")) return;
        var btn = e.target.closest("[data-bon-load-more]");
        btn.disabled = true;
        btn.textContent = "Carregando…";
        carregarPagina(blocksSlot, paginationSlot).catch(function () {
          paginationSlot.innerHTML = '<button type="button" class="bon-pagination-btn" data-bon-load-more>Tentar de novo</button>';
        });
      });
    }

    carregarUltimasLateral();
  }

  document.addEventListener("DOMContentLoaded", load);
})();
