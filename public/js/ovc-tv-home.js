(function () {
  "use strict";
  // Liga o card "OVC TV" da home (antes 100% estático/decorativo) a um
  // player real de canais públicos ao vivo. Independente de home.js e de
  // internal-page-v2.js — se este script falhar, nada mais no portal quebra.
  function montar(live) {
    var bloco = document.querySelector(".rail-block-tv");
    if (!bloco) return;
    var placeholder = bloco.querySelector(".tv-player-placeholder");
    if (!placeholder) return;

    var canais = (live && Array.isArray(live.tv) ? live.tv : []).filter(function (c) {
      return c && c.url && c.active !== false;
    });
    if (!canais.length) return; // sem canal real, deixa o placeholder como estava

    var ativo = 0;

    var frame = document.createElement("div");
    frame.className = "tv-player-frame";

    var iframe = document.createElement("iframe");
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
    iframe.setAttribute("allowfullscreen", "");
    iframe.setAttribute("title", "OVC TV ao vivo");
    frame.appendChild(iframe);

    var picker = document.createElement("div");
    picker.className = "tv-channel-picker";

    function autoplayUrl(url) {
      if (!/youtube\.com\/embed\//.test(url)) return url;
      return url + (url.indexOf("?") >= 0 ? "&" : "?") + "autoplay=1&mute=1&playsinline=1";
    }

    function trocar(i) {
      ativo = i;
      var canal = canais[i];
      iframe.src = autoplayUrl(canal.url);
      var titleEl = bloco.querySelector(".tv-title");
      if (titleEl) titleEl.textContent = canal.label || "OVC TV";
      var botoes = picker.querySelectorAll(".tv-channel-btn");
      for (var b = 0; b < botoes.length; b++) {
        botoes[b].classList.toggle("active", b === i);
      }
    }

    canais.forEach(function (canal, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tv-channel-btn";
      btn.textContent = canal.label || "Canal";
      btn.addEventListener("click", function () { trocar(i); });
      picker.appendChild(btn);
    });

    placeholder.replaceWith(frame);
    bloco.appendChild(picker);
    trocar(0);
  }

  function init() {
    if (!document.querySelector(".rail-block-tv")) return;
    fetch("/api/live-data")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) { if (data) montar(data); })
      .catch(function () {});
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
