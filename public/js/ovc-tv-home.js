(function () {
  "use strict";
  // Liga o card "OVC TV" da home (antes 100% estático/decorativo) a um
  // player real de canais públicos ao vivo. Independente de home.js e de
  // internal-page-v2.js — se este script falhar, nada mais no portal quebra.
  //
  // 25/11/2026 — causa real da "tela preta" (confirmada com evidência real,
  // não suposição): embed/live_stream?channel= do YouTube só funciona
  // quando o canal está, naquele instante exato, com um "live event" ativo
  // e corretamente marcado. Testado em produção: TV Senado/TV Justiça/TV
  // Cultura/Câmara Notícias estavam LIVE_STREAM_OFFLINE ou UNPLAYABLE no
  // momento do teste — todos os 5 embeds mostravam errorScreen. Canais
  // institucionais raramente transmitem 24h — isso é normal, não é bug.
  // Fix: TV Câmara tem um stream HLS real e contínuo 24h, com CORS liberado
  // (confirmado: access-control-allow-origin:*, manifest .m3u8 válido) —
  // colocado como primeiro/padrão em data/live-config.json, garantindo que
  // o card SEMPRE abre com algo tocando. Os canais do YouTube continuam
  // disponíveis no seletor, mas podem estar fora do ar fora de horário de
  // sessão/transmissão específica — comportamento esperado desses órgãos.
  var HLS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.17/hls.min.js";
  var hlsLibPromise = null;

  function loadHlsJs() {
    if (hlsLibPromise) return hlsLibPromise;
    hlsLibPromise = new Promise(function (resolve) {
      if (window.Hls) return resolve(window.Hls);
      var s = document.createElement("script");
      s.src = HLS_CDN;
      s.onload = function () { resolve(window.Hls || null); };
      s.onerror = function () { resolve(null); };
      document.head.appendChild(s);
    });
    return hlsLibPromise;
  }

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
    var hlsInstance = null;

    var frame = document.createElement("div");
    frame.className = "tv-player-frame";

    var picker = document.createElement("div");
    picker.className = "tv-channel-picker";

    function autoplayYoutubeUrl(url) {
      if (!/youtube\.com\/embed\//.test(url)) return url;
      return url + (url.indexOf("?") >= 0 ? "&" : "?") + "autoplay=1&mute=1&playsinline=1";
    }

    function destroyPlayer() {
      if (hlsInstance) {
        try { hlsInstance.destroy(); } catch (e) {}
        hlsInstance = null;
      }
      frame.innerHTML = "";
    }

    function montarYoutube(url) {
      var iframe = document.createElement("iframe");
      iframe.setAttribute("loading", "lazy");
      iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("title", "OVC TV ao vivo");
      iframe.src = autoplayYoutubeUrl(url);
      frame.appendChild(iframe);
    }

    function montarHls(url) {
      var video = document.createElement("video");
      video.setAttribute("controls", "");
      video.setAttribute("autoplay", "");
      video.setAttribute("playsinline", "");
      video.muted = true;
      frame.appendChild(video);
      // Ordem correta (padrão da própria hls.js): tentar MSE via hls.js
      // primeiro — é o caminho real em Chrome/Firefox/Edge. canPlayType()
      // pode responder "maybe" (truthy) mesmo sem conseguir de fato
      // decodificar HLS — confirmado em teste real: isso gerava
      // DEMUXER_ERROR_COULD_NOT_PARSE e tela preta. Só cai pro <video src>
      // nativo quando hls.js detecta que o browser não suporta MSE
      // (caso real: Safari/iOS, que toca HLS nativamente).
      loadHlsJs().then(function (Hls) {
        if (Hls && Hls.isSupported()) {
          hlsInstance = new Hls();
          hlsInstance.loadSource(url);
          hlsInstance.attachMedia(video);
          hlsInstance.on(Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(function () {});
          });
          return;
        }
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = url;
          video.play().catch(function () {});
          return;
        }
        frame.innerHTML = '<div class="tv-player-fallback">Não foi possível carregar este canal agora.</div>';
      });
    }

    function trocar(i) {
      ativo = i;
      var canal = canais[i];
      destroyPlayer();
      var titleEl = bloco.querySelector(".tv-title");
      if (titleEl) titleEl.textContent = canal.label || "OVC TV";
      var botoes = picker.querySelectorAll(".tv-channel-btn");
      for (var b = 0; b < botoes.length; b++) {
        botoes[b].classList.toggle("active", b === i);
      }
      if (canal.kind === "hls") {
        montarHls(canal.url);
      } else {
        montarYoutube(canal.url);
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
