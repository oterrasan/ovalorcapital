// Brasil ON — página de categoria: lista todos os posts daquela categoria.
(function () {
  var CAT_LABEL = { "brasil-on": "Brasil ON", futebol: "Futebol" };
  var CAT_SLUG = { "brasil-on": "brasil-on", futebol: "futebol" };

  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function catClass(categoria) {
    return CAT_SLUG[categoria] ? "cat-" + CAT_SLUG[categoria] : "";
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

  function cardHtml(p) {
    var cat = CAT_LABEL[p.categoria] || p.categoria;
    var img = p.imagem
      ? '<img src="' + p.imagem + '" alt="" loading="lazy">'
      : '<div style="width:100%;height:100%;background:#e2e8e2"></div>';
    return (
      '<a class="bon-card" href="' + p.url + '">' +
      '<div class="bon-card-media">' + img + '<span class="bon-catpill ' + catClass(p.categoria) + '">' + esc(cat) + "</span></div>" +
      '<div class="bon-card-body">' +
      "<h3>" + esc(p.titulo) + "</h3>" +
      (p.resumo ? "<p>" + esc(p.resumo).slice(0, 100) + "</p>" : "") +
      "<time>" + timeAgo(p.published_at) + "</time>" +
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
