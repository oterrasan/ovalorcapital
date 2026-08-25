// Brasil ON — renderiza o artigo a partir de window.__BON_ARTICLE__ (preload
// SSR de api/article.js). O corpo já vem em HTML puro (mesmo padrão dos
// kernels de IA do OVC) — nunca escapar, só injetar direto.
(function () {
  var CAT_LABEL = { "brasil-on": "Brasil ON", futebol: "Futebol" };

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

    mount.innerHTML =
      '<span class="bon-card-cat">' + esc(cat) + "</span>" +
      "<h1>" + esc(art.titulo) + "</h1>" +
      '<div class="bon-meta">Redação Brasil ON · ' + fmtData(art.published_at) + "</div>" +
      cover +
      '<div class="bon-body">' + (art.corpo || "") + "</div>";
  });
})();
