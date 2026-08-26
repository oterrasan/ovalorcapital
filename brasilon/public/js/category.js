// Brasil ON — página de categoria: mesma densidade da home — destaques
// com foto + lista densa em índice, sem cards uniformes.
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

  function pillHtml(categoria) {
    var cat = CAT_LABEL[categoria] || categoria;
    return '<span class="bon-catpill ' + catClass(categoria) + '">' + esc(cat) + "</span>";
  }

  function featuredHtml(p) {
    var img = p.imagem
      ? '<div class="bon-featured-media"><img src="' + p.imagem + '" alt="" loading="lazy"></div>'
      : "";
    return (
      '<a class="bon-featured-item" href="' + p.url + '">' +
      img +
      "<h3>" + esc(p.titulo) + "</h3>" +
      '<time style="display:block;font-size:11px;color:var(--ink-soft);margin-top:6px;font-weight:600;">' + timeAgo(p.published_at) + "</time>" +
      "</a>"
    );
  }

  function denseHtml(p) {
    return (
      '<a class="bon-dense-item" href="' + p.url + '">' +
      "<h4>" + esc(p.titulo) + "</h4>" +
      "<time>" + timeAgo(p.published_at) + "</time>" +
      "</a>"
    );
  }

  async function load() {
    var featuredSlot = document.querySelector("[data-bon-featured]");
    var denseSlot = document.querySelector("[data-bon-grid]");
    if (!denseSlot) return;
    var categoria = document.body.getAttribute("data-category");
    try {
      var r = await fetch("/api/portal-posts?categoria=" + encodeURIComponent(categoria) + "&limit=60");
      var d = await r.json();
      var posts = d.posts || [];
      if (!posts.length) {
        denseSlot.innerHTML = '<div class="bon-empty">Nenhuma notícia publicada nesta categoria ainda.</div>';
        return;
      }
      var featured = posts.slice(0, 3);
      var resto = posts.slice(3);
      if (featuredSlot) featuredSlot.innerHTML = featured.map(featuredHtml).join("");
      denseSlot.innerHTML = resto.length
        ? resto.map(denseHtml).join("")
        : '<div class="bon-empty">Sem mais notícias no momento.</div>';
    } catch (_) {
      denseSlot.innerHTML = '<div class="bon-empty">Não foi possível carregar as notícias agora.</div>';
    }
  }

  document.addEventListener("DOMContentLoaded", load);
})();
