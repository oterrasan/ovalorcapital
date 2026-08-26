// Brasil ON — página de categoria: mesmo motor de disposição de card
// da home (blocks.js), sem pill de categoria repetida (a página já é
// só de uma categoria).
(function () {
  async function load() {
    var blocksSlot = document.querySelector("[data-bon-grid]");
    if (!blocksSlot) return;
    var categoria = document.body.getAttribute("data-category");
    try {
      var r = await fetch("/api/portal-posts?categoria=" + encodeURIComponent(categoria) + "&limit=60");
      var d = await r.json();
      var posts = d.posts || [];
      if (!posts.length) {
        blocksSlot.innerHTML = '<div class="bon-empty">Nenhuma notícia publicada nesta categoria ainda.</div>';
        return;
      }
      blocksSlot.innerHTML = window.BonBlocks.renderBlocks(posts, { showPill: false });
    } catch (_) {
      blocksSlot.innerHTML = '<div class="bon-empty">Não foi possível carregar as notícias agora.</div>';
    }
  }

  document.addEventListener("DOMContentLoaded", load);
})();
