// Brasil ON — página de categoria: lista todos os posts daquela categoria.
(function () {
  var CAT_LABEL = { "brasil-on": "Brasil ON", futebol: "Futebol" };

  function fmtData(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch (_) { return ""; }
  }

  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function cardHtml(p) {
    var cat = CAT_LABEL[p.categoria] || p.categoria;
    var img = p.imagem ? '<img src="' + p.imagem + '" alt="" loading="lazy">' : '<div style="aspect-ratio:16/9;background:#e5e7eb"></div>';
    return (
      '<a class="bon-card" href="' + p.url + '">' +
      img +
      '<div class="bon-card-body">' +
      '<span class="bon-card-cat">' + cat + "</span>" +
      "<h3>" + esc(p.titulo) + "</h3>" +
      (p.resumo ? "<p>" + esc(p.resumo).slice(0, 110) + "</p>" : "") +
      "<time>" + fmtData(p.published_at) + "</time>" +
      "</div></a>"
    );
  }

  async function load() {
    var gridSlot = document.querySelector("[data-bon-grid]");
    if (!gridSlot) return;
    var categoria = document.body.getAttribute("data-category");
    try {
      var r = await fetch("/api/portal-posts?categoria=" + encodeURIComponent(categoria) + "&limit=40");
      var d = await r.json();
      var posts = d.posts || [];
      if (!posts.length) {
        gridSlot.innerHTML = '<div class="bon-empty">Nenhuma notícia publicada nesta categoria ainda.</div>';
        return;
      }
      gridSlot.innerHTML = posts.map(cardHtml).join("");
    } catch (_) {
      gridSlot.innerHTML = '<div class="bon-empty">Não foi possível carregar as notícias agora.</div>';
    }
  }

  document.addEventListener("DOMContentLoaded", load);
})();
