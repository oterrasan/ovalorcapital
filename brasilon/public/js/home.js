// Brasil ON — homepage: hero (post mais recente) + 2 sub-destaques + grid.
// Identidade popular: manchete grande, foto com presença, selo de categoria
// colorido (verde=Brasil ON, azul=Futebol), tempo relativo tipo "há 12 min".
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

  function cardHtml(p) {
    var img = p.imagem
      ? '<img src="' + p.imagem + '" alt="" loading="lazy">'
      : '<div style="width:100%;height:100%;background:#e2e8e2"></div>';
    return (
      '<a class="bon-card" href="' + p.url + '">' +
      '<div class="bon-card-media">' + img + pillHtml(p.categoria) + "</div>" +
      '<div class="bon-card-body">' +
      "<h3>" + esc(p.titulo) + "</h3>" +
      (p.resumo ? "<p>" + esc(p.resumo).slice(0, 100) + "</p>" : "") +
      "<time>" + timeAgo(p.published_at) + "</time>" +
      "</div></a>"
    );
  }

  function subHtml(p) {
    var img = p.imagem ? '<img src="' + p.imagem + '" alt="" loading="lazy">' : "";
    return (
      '<a class="bon-sub-card" href="' + p.url + '">' +
      img +
      '<div class="bon-sub-body">' +
      pillHtml(p.categoria) +
      "<h3>" + esc(p.titulo) + "</h3>" +
      "</div></a>"
    );
  }

  function heroHtml(p) {
    var cat = CAT_LABEL[p.categoria] || p.categoria;
    var img = p.imagem || "/assets/og-default.jpg";
    return (
      '<a class="bon-hero-card" href="' + p.url + '">' +
      '<img src="' + img + '" alt="">' +
      '<div class="bon-hero-overlay">' +
      '<span class="bon-kicker ' + catClass(p.categoria) + '">' + esc(cat) + "</span>" +
      "<h1>" + esc(p.titulo) + "</h1>" +
      '<div class="bon-hero-time">' + timeAgo(p.published_at) + "</div>" +
      "</div></a>"
    );
  }

  async function load() {
    var heroSlot = document.querySelector("[data-bon-hero]");
    var subSlot = document.querySelector("[data-bon-subhero]");
    var gridSlot = document.querySelector("[data-bon-grid]");
    if (!gridSlot) return;
    try {
      var r = await fetch("/api/portal-posts?limit=25");
      var d = await r.json();
      var posts = d.posts || [];
      if (!posts.length) {
        gridSlot.innerHTML = '<div class="bon-empty">Nenhuma notícia publicada ainda.</div>';
        return;
      }
      if (heroSlot) {
        heroSlot.innerHTML = heroHtml(posts[0]);
        posts = posts.slice(1);
      }
      if (subSlot && posts.length >= 2) {
        subSlot.innerHTML = subHtml(posts[0]) + subHtml(posts[1]);
        posts = posts.slice(2);
      }
      gridSlot.innerHTML = posts.map(cardHtml).join("");
    } catch (_) {
      gridSlot.innerHTML = '<div class="bon-empty">Não foi possível carregar as notícias agora.</div>';
    }
  }

  document.addEventListener("DOMContentLoaded", load);
})();
