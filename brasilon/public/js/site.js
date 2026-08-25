// Brasil ON — globals: ticker + navegação ativa. Simples de propósito —
// este portal não tem cotações/painéis ao vivo, só notícias.
(function () {
  function initTicker() {
    var el = document.querySelector("[data-bon-ticker]");
    if (!el) return;
    var agora = new Date();
    var dataFmt = agora.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
    el.innerHTML = "<span>" + dataFmt.charAt(0).toUpperCase() + dataFmt.slice(1) + "</span><span>Brasil ON — atualizado ao longo do dia</span>";
  }

  function markActiveNav() {
    var path = window.location.pathname.replace(/\/+$/, "") || "/";
    document.querySelectorAll(".bon-nav a").forEach(function (a) {
      var href = a.getAttribute("href").replace(/\/+$/, "") || "/";
      if (href === path) a.classList.add("active");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTicker();
    markActiveNav();
  });
})();
