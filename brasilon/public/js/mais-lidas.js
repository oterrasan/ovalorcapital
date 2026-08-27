// Brasil ON — widget "Mais Lidas", reutilizável em home e categorias.
// Cada container [data-bon-w-maislidas] é independente: procura seu próprio
// atributo data-categoria (se ausente, busca mais lidas de TODO o site).
// Números de leitura não são exibidos (mesma decisão já tomada no OVC:
// contagens baixas para visitante novo "pega mal") — só o ranking importa.
(function () {
  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function itemHtml(p, rank) {
    return (
      '<a class="bon-ml-item" href="' + p.url + '">' +
      '<span class="bon-ml-rank">' + rank + "</span>" +
      '<span class="bon-ml-title">' + esc(p.titulo) + "</span>" +
      "</a>"
    );
  }

  async function carregar(container) {
    var categoria = container.getAttribute("data-categoria") || "";
    var limit = parseInt(container.getAttribute("data-limit"), 10) || 6;
    var url = "/api/portal-posts?maisLidas=true&limit=" + limit;
    if (categoria) url += "&categoria=" + encodeURIComponent(categoria);
    try {
      var r = await fetch(url);
      var d = await r.json();
      var posts = d.posts || [];
      container.innerHTML = posts.length
        ? posts.map(function (p, i) { return itemHtml(p, i + 1); }).join("")
        : '<div class="bon-widget-empty">Sem dados de leitura ainda.</div>';
    } catch (_) {
      container.innerHTML = '<div class="bon-widget-empty">Não foi possível carregar agora.</div>';
    }
  }

  function init() {
    var containers = document.querySelectorAll("[data-bon-w-maislidas]");
    containers.forEach(carregar);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
