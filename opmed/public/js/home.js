// OPMED — homepage: hero + miolo com disposições de card variando (motor
// portado do Brasil ON, ver blocks.js) + rail lateral "Mais Lidas"/"Últimas".
// Mesma lógica de dados do Brasil ON (fetch /api/portal-posts), só a
// disposição visual do topo/rails é que segue o padrão OVC (ver index.html).
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
      ? '<div class="op-hero-media"><img src="' + p.imagem + '" alt=""></div>'
      : "";
    return (
      '<a class="op-hero-card" href="' + p.url + '">' +
      img +
      window.OpBlocks.pillHtml(p.categoria) +
      "<h1>" + esc(p.titulo) + "</h1>" +
      (p.resumo ? '<p class="op-hero-deck">' + esc(p.resumo).slice(0, 180) + "</p>" : "") +
      '<div class="op-hero-time">' + timeAgo(p.published_at) + "</div>" +
      "</a>"
    );
  }

  function sideItemHtml(p) {
    return (
      '<a class="op-side-item" href="' + p.url + '">' +
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
    var heroSlot = document.querySelector("[data-op-hero]");
    var blocksSlot = document.querySelector("[data-op-blocks]");
    var ultimasSlot = document.querySelector("[data-op-ultimas]");
    var maisLidasSlot = document.querySelector("[data-op-w-maislidas]");
    if (!blocksSlot) return;

    try {
      var d = await fetchJson("/api/portal-posts?limit=60");
      var posts = d.posts || [];
      if (!posts.length) {
        blocksSlot.innerHTML = '<div class="op-empty">Nenhuma matéria publicada ainda.</div>';
        return;
      }

      if (ultimasSlot) {
        ultimasSlot.innerHTML = posts.slice(0, 12).map(sideItemHtml).join("");
      }

      if (maisLidasSlot) {
        // Ranking real de views ainda depende do endpoint dedicado
        // (mesmo padrão do Brasil ON — ver mais-lidas.js). Fallback aqui
        // por ordem de publicação até esse endpoint existir.
        maisLidasSlot.innerHTML = posts.slice(0, 8).map(sideItemHtml).join("");
      }

      var hero = posts[0];
      var resto = posts.slice(1);

      if (heroSlot) heroSlot.innerHTML = heroHtml(hero);
      blocksSlot.innerHTML = resto.length
        ? window.OpBlocks.renderBlocks(resto).html
        : '<div class="op-empty">Sem mais matérias no momento.</div>';
    } catch (_) {
      blocksSlot.innerHTML = '<div class="op-empty">Não foi possível carregar as matérias agora.</div>';
    }
  }

  document.addEventListener("DOMContentLoaded", load);
})();
