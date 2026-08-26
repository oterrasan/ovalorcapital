// Brasil ON — homepage estilo jornal de banca: manchete gigante + corpo
// principal com disposições de card variando (ver blocks.js) + lateral
// "Últimas"/"Futebol" compacta.
(function () {
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

  function heroHtml(p) {
    var img = p.imagem
      ? '<div class="bon-hero-media"><img src="' + p.imagem + '" alt=""></div>'
      : "";
    return (
      '<a class="bon-hero-card" href="' + p.url + '">' +
      img +
      window.BonBlocks.pillHtml(p.categoria) +
      "<h1>" + esc(p.titulo) + "</h1>" +
      (p.resumo ? '<p class="bon-hero-deck">' + esc(p.resumo).slice(0, 180) + "</p>" : "") +
      '<div class="bon-hero-time">' + timeAgo(p.published_at) + "</div>" +
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
    var blocksSlot = document.querySelector("[data-bon-blocks]");
    var ultimasSlot = document.querySelector("[data-bon-ultimas]");
    var futebolSideSlot = document.querySelector("[data-bon-futebol-side]");
    if (!blocksSlot) return;

    try {
      var d = await fetchJson("/api/portal-posts?limit=60");
      var posts = d.posts || [];
      if (!posts.length) {
        blocksSlot.innerHTML = '<div class="bon-empty">Nenhuma notícia publicada ainda.</div>';
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

      // Manchete gigante (1) + todo o resto em disposições de card que
      // variam a cada 3-4 itens (blocks.js) — nunca um formato só.
      var hero = posts[0];
      var resto = posts.slice(1);

      if (heroSlot) heroSlot.innerHTML = heroHtml(hero);
      blocksSlot.innerHTML = resto.length
        ? window.BonBlocks.renderBlocks(resto)
        : '<div class="bon-empty">Sem mais notícias no momento.</div>';
    } catch (_) {
      blocksSlot.innerHTML = '<div class="bon-empty">Não foi possível carregar as notícias agora.</div>';
    }
  }

  document.addEventListener("DOMContentLoaded", load);
})();
