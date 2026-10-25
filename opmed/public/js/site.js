// OPMED — globals: ticker do topo (faixa 1), alternância de tema, menu
// mobile, marcação de navegação ativa.
//
// ⚠️ PLACEHOLDER — a faixa de ticker do OVC mostra cotações financeiras
// (ibov, dólar, bitcoin...), que não fazem sentido num portal de saúde.
// Aqui ela mostra data/hora + uma frase fixa até Roberto decidir o que
// deve rodar ali (ex: "casos monitorados hoje", manchetes de última hora,
// um indicador de saúde pública real). A ESTRUTURA da faixa (mesma classe
// .header-topbar/.ticker-wrapper do OVC) foi mantida — só o conteúdo é
// placeholder.
(function () {
  function initTicker() {
    var track = document.querySelector("[data-op-ticker-track]");
    if (!track) return;
    var agora = new Date();
    var dataFmt = agora.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
    dataFmt = dataFmt.charAt(0).toUpperCase() + dataFmt.slice(1);
    track.innerHTML =
      '<span class="ticker-item"><span class="ticker-label">' + dataFmt + '</span></span>' +
      '<span class="ticker-item"><span class="ticker-label">OPMED — atualizado ao longo do dia</span></span>';
  }

  var THEME_KEY = "op-theme";
  function isDark() { return document.documentElement.getAttribute("data-theme") === "dark"; }
  function paintThemeButtons() {
    var dark = isDark();
    document.querySelectorAll("[data-op-theme-toggle]").forEach(function (btn) {
      btn.querySelector(".icon") && (btn.querySelector(".icon").textContent = dark ? "☀" : "☾");
    });
  }
  function setTheme(dark) {
    if (dark) document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    try { localStorage.setItem(THEME_KEY, dark ? "dark" : "light"); } catch (_) {}
    paintThemeButtons();
  }
  function initThemeToggle() {
    paintThemeButtons();
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-op-theme-toggle]");
      if (!btn) return;
      setTheme(!isDark());
    });
  }

  function markActiveNav() {
    var path = window.location.pathname.replace(/\/+$/, "") || "/";
    document.querySelectorAll(".supermenu-item .label").forEach(function (a) {
      var href = (a.getAttribute("href") || "").replace(/\/+$/, "") || "/";
      if (href === path) a.classList.add("active");
    });
  }

  function initAccessMenu() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("#opAccessBtn");
      var menu = document.getElementById("opAccessMenu");
      if (btn && menu) { menu.classList.toggle("open"); e.stopPropagation(); return; }
      if (menu && menu.classList.contains("open") && !e.target.closest("#opAccessWrap")) {
        menu.classList.remove("open");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    try { if (localStorage.getItem(THEME_KEY) === "dark") document.documentElement.setAttribute("data-theme", "dark"); } catch (_) {}
    initTicker();
    markActiveNav();
    initThemeToggle();
    initAccessMenu();
  });
})();
