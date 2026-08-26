// Brasil ON — homepage estilo jornal de banca: manchete gigante, 3
// destaques médios, lista densa em 2 colunas (índice de jornal), lateral
// "Últimas" + "Futebol" bem compacta. MUITO conteúdo na mesma tela,
// hierarquia real — nada de cards todos iguais.
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

  function heroHtml(p) {
    var img = p.imagem
      ? '<div class="bon-hero-media"><img src="' + p.imagem + '" alt=""></div>'
      : "";
    return (
      '<a class="bon-hero-card" href="' + p.url + '">' +
      img +
      pillHtml(p.categoria) +
      "<h1>" + esc(p.titulo) + "</h1>" +
      (p.resumo ? '<p class="bon-hero-deck">' + esc(p.resumo).slice(0, 180) + "</p>" : "") +
      '<div class="bon-hero-time">' + timeAgo(p.published_at) + "</div>" +
      "</a>"
    );
  }

  function featuredHtml(p) {
    var img = p.imagem
      ? '<div class="bon-featured-media"><img src="' + p.imagem + '" alt="" loading="lazy"></div>'
      : "";
    return (
      '<a class="bon-featured-item" href="' + p.url + '">' +
      img +
      pillHtml(p.categoria) +
      "<h3>" + esc(p.titulo) + "</h3>" +
      "</a>"
    );
  }

  function denseHtml(p) {
    return (
      '<a class="bon-dense-item" href="' + p.url + '">' +
      pillHtml(p.categoria) +
      "<h4>" + esc(p.titulo) + "</h4>" +
      "<time>" + timeAgo(p.published_at) + "</time>" +
      "</a>"
    );
  }

  function sideItemHtml(p) {
    return (
      '<a class="bon-side-item" href="' + p.url + '">' +
      "<h5>" + esc(p.titulo) + "</h5>" +
      "<time>" + timeAgo(p.published_at) + "</time>" +
      "</a>"
    );
  }

  async function fetchJson(url) {
    var r = await fetch(url);
    return r.json();
  }

  async function load() {
    var heroSlot = document.querySelector("[data-bon-hero]");
    var featuredSlot = document.querySelector("[data-bon-featured]");
    var denseSlot = document.querySelector("[data-bon-dense]");
    var ultimasSlot = document.querySelector("[data-bon-ultimas]");
    var futebolSideSlot = document.querySelector("[data-bon-futebol-side]");
    if (!denseSlot) return;

    try {
      var d = await fetchJson("/api/portal-posts?limit=60");
      var posts = d.posts || [];
      if (!posts.length) {
        denseSlot.innerHTML = '<div class="bon-empty">Nenhuma notícia publicada ainda.</div>';
        return;
      }

      // Lateral "Últimas" — as 12 mais recentes de qualquer categoria, sempre.
      if (ultimasSlot) {
        ultimasSlot.innerHTML = posts.slice(0, 12).map(sideItemHtml).join("");
      }

      // Lateral "Futebol" — as 10 mais recentes só de futebol.
      if (futebolSideSlot) {
        var futebolPosts = posts.filter(function (p) { return p.categoria === "futebol"; }).slice(0, 10);
        futebolSideSlot.innerHTML = futebolPosts.length
          ? futebolPosts.map(sideItemHtml).join("")
          : '<div class="bon-empty" style="padding:10px 0;text-align:left;">Sem notícias de futebol no momento.</div>';
      }

      // Corpo principal: hero (1) + destaques com foto (3) + resto em lista densa.
      var hero = posts[0];
      var featured = posts.slice(1, 4);
      var resto = posts.slice(4);

      if (heroSlot) heroSlot.innerHTML = heroHtml(hero);
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
