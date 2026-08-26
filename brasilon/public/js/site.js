// Brasil ON — globals: ticker, masthead (data por extenso), navegação ativa.
(function () {
  function initTicker() {
    var el = document.querySelector("[data-bon-ticker]");
    if (!el) return;
    var agora = new Date();
    var dataFmt = agora.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
    el.innerHTML =
      '<span><span class="bon-live-dot"></span>' + dataFmt.charAt(0).toUpperCase() + dataFmt.slice(1) + "</span>" +
      "<span>Brasil ON — atualizado ao longo do dia</span>";
  }

  function initMastheadTop() {
    var el = document.querySelector("[data-bon-masthead-date]");
    if (!el) return;
    var agora = new Date();
    var dataFmt = agora.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
    var horaFmt = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    el.innerHTML =
      "<span>" + dataFmt.charAt(0).toUpperCase() + dataFmt.slice(1) + "</span>" +
      "<span>Atualizado às " + horaFmt + "</span>";
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
    initMastheadTop();
    markActiveNav();
  });
})();
