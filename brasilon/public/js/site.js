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
      '<span class="bon-masthead-top-right">Atualizado às ' + horaFmt +
      '<button type="button" class="bon-theme-toggle" data-bon-theme-toggle aria-label="Alternar tema escuro"></button></span>';
  }

  // Alternância clara/escura — Roberto, 27/08/2026: "fundo meio cinza ta
  // estranho, deixa tudo branco e de a opcao do usuario clicar na versao
  // dark". O tema salvo já é aplicado por um script inline no <head>
  // (antes do CSS carregar, evita piscar); aqui só cuida do botão e do
  // clique. Persistido em localStorage — por navegador, não sincroniza
  // entre dispositivos, mas é o suficiente pra essa preferência.
  function initThemeToggle() {
    var KEY = "bon-theme";
    function isDark() { return document.documentElement.getAttribute("data-theme") === "dark"; }
    function paintButtons() {
      var dark = isDark();
      document.querySelectorAll("[data-bon-theme-toggle]").forEach(function (btn) {
        btn.textContent = dark ? "☀️" : "🌙";
        btn.setAttribute("aria-pressed", dark ? "true" : "false");
      });
    }
    function setTheme(dark) {
      if (dark) document.documentElement.setAttribute("data-theme", "dark");
      else document.documentElement.removeAttribute("data-theme");
      try { localStorage.setItem(KEY, dark ? "dark" : "light"); } catch (_) { /* modo privado etc — só não persiste */ }
      paintButtons();
    }
    paintButtons();
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-bon-theme-toggle]");
      if (!btn) return;
      setTheme(!isDark());
    });
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
    initThemeToggle();
  });
})();
