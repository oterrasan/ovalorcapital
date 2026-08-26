// Brasil ON — renderiza o artigo a partir de window.__BON_ARTICLE__ (preload
// SSR de api/article.js). O corpo já vem em HTML puro (mesmo padrão dos
// kernels de IA do OVC) — nunca escapar, só injetar direto.
(function () {
  var CAT_LABEL = { "brasil-on": "Brasil ON", futebol: "Futebol" };
  var CAT_SLUG = { "brasil-on": "brasil-on", futebol: "futebol" };

  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function fmtData(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (_) { return ""; }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var art = window.__BON_ARTICLE__;
    var mount = document.querySelector("[data-bon-article]");
    if (!art || !mount) return;

    var cat = CAT_LABEL[art.categoria] || art.categoria;
    var cover = art.imagem ? '<img class="bon-cover" src="' + art.imagem + '" alt="">' : "";

    var catClass = CAT_SLUG[art.categoria] ? "cat-" + CAT_SLUG[art.categoria] : "";
    mount.innerHTML =
      '<span class="bon-catpill ' + catClass + '">' + esc(cat) + "</span>" +
      "<h1>" + esc(art.titulo) + "</h1>" +
      '<div class="bon-meta">BRASIL ON · ' + fmtData(art.published_at) + "</div>" +
      cover +
      '<div class="bon-body">' + (art.corpo || "") + "</div>";
  });
})();
