(function () {
  "use strict";
  // Liga o card "OVC TV" da home a um player real de canais públicos ao
  // vivo. Independente de home.js e de internal-page-v2.js — se este
  // script falhar, nada mais no portal quebra.
  //
  // 25/11/2026 (reescrita) — Roberto pediu: (1) mostrar sempre os 5
  // canais, tratando todos como tendo programação 24h ("mesmo que nao
  // sejam conteudos ao vivo, sempre tem programacao rodando"); (2) uma
  // fileira de cards (um por canal, empilhados), não mais um frame único
  // com botões de seleção.
  //
  // Causa real confirmada (não suposição, teste real via ?debug=tv em
  // produção) de por que embutir canal do YouTube aqui sempre falhava: o
  // YouTube bloqueia a leitura da página pro IP da própria Vercel
  // (playabilityStatus:"LOGIN_REQUIRED"), então nunca dá pra confirmar
  // nem embutir um player real pra esses canais a partir do nosso
  // servidor — isso não é timing, é decisão do YouTube sobre esse IP
  // específico. Por isso: canal kind:"hls" (stream próprio, sempre
  // confiável — TV Câmara) continua tocando embutido de verdade aqui.
  // Canal kind:"youtube" nunca mais tenta embutir — o card sempre existe
  // e sempre mostra um "▶ Assistir no YouTube", que abre o canal de
  // verdade no navegador de quem clica (lá a sessão real do YouTube
  // decide o que mostrar — ao vivo se estiver, vídeo recente se não).
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

  function injetarCSS() {
    if (document.getElementById("ovc-tv-home-css")) return;
    var css = [
      ".tv-channel-stack{display:flex;flex-direction:column;gap:10px;margin-top:4px;}",
      ".tv-ch-card{background:#fff;border-radius:14px;overflow:hidden;",
      "  border:1px solid rgba(15,23,42,.08);box-shadow:0 4px 16px rgba(15,23,42,.06);}",
      ".tv-ch-head{display:flex;align-items:center;justify-content:space-between;",
      "  padding:9px 12px 0;}",
      ".tv-ch-eyebrow{font-size:9.5px;font-weight:800;letter-spacing:.08em;",
      "  text-transform:uppercase;color:#94a3b8;}",
      ".tv-ch-badge{display:inline-flex;align-items:center;gap:5px;font-size:9px;",
      "  font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#fff;",
      "  background:#b91c1c;padding:3px 8px;border-radius:999px;}",
      ".tv-ch-badge.tv-ch-badge-live{background:#b91c1c;}",
      ".tv-ch-badge.tv-ch-badge-24h{background:#475569;}",
      ".tv-ch-dot{width:6px;height:6px;border-radius:50%;background:#fecaca;",
      "  box-shadow:0 0 0 0 rgba(255,255,255,.6);animation:ovcTvDotPulse 1.6s infinite;}",
      "@keyframes ovcTvDotPulse{0%{opacity:1;}50%{opacity:.35;}100%{opacity:1;}}",
      ".tv-ch-title{padding:6px 12px 8px;font-size:13.5px;font-weight:800;color:#0f172a;}",
      ".tv-ch-media{position:relative;width:100%;aspect-ratio:16/9;background:#0b0f1a;",
      "  display:flex;align-items:center;justify-content:center;overflow:hidden;}",
      ".tv-ch-media video,.tv-ch-media iframe{width:100%;height:100%;display:block;border:0;}",
      ".tv-ch-media-yt{background:linear-gradient(145deg,#111827,#1e293b);}",
      ".tv-ch-yt-icon{font-size:34px;opacity:.9;}",
      ".tv-ch-cta{display:block;width:calc(100% - 24px);margin:10px 12px 12px;",
      "  text-align:center;padding:10px 0;border-radius:9px;font-size:12.5px;",
      "  font-weight:800;color:#fff;text-decoration:none;transition:filter .15s;}",
      ".tv-ch-cta-live{background:#b91c1c;}",
      ".tv-ch-cta-live:hover{filter:brightness(1.08);}",
      ".tv-ch-cta-yt{background:#0f172a;}",
      ".tv-ch-cta-yt:hover{filter:brightness(1.15);}",
      ".tv-ch-fallback{font-size:11px;color:#94a3b8;padding:10px 12px;text-align:center;}"
    ].join("");
    var tag = document.createElement("style");
    tag.id = "ovc-tv-home-css";
    tag.textContent = css;
    document.head.appendChild(tag);
  }

  function extractYoutubeChannelId(url) {
    var m = /[?&]channel=([a-zA-Z0-9_-]+)/.exec(url || "");
    return m ? m[1] : null;
  }
  function youtubeWatchUrl(canal) {
    var id = extractYoutubeChannelId(canal.url);
    return id ? ("https://www.youtube.com/channel/" + id + "/live") : canal.url;
  }

  function montarHls(mediaEl, url) {
    var video = document.createElement("video");
    video.setAttribute("controls", "");
    video.setAttribute("autoplay", "");
    video.setAttribute("playsinline", "");
    video.muted = true;
    mediaEl.appendChild(video);
    // Ordem correta (padrão da própria hls.js): tentar MSE via hls.js
    // primeiro — caminho real em Chrome/Firefox/Edge. canPlayType() pode
    // responder "maybe" mesmo sem conseguir decodificar — testado em
    // produção: isso gerava DEMUXER_ERROR_COULD_NOT_PARSE e tela preta.
    // Só cai pro <video src> nativo quando hls.js detecta que o browser
    // não suporta MSE (Safari/iOS, que toca HLS nativamente).
    loadHlsJs().then(function (Hls) {
      if (Hls && Hls.isSupported()) {
        var hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
          video.play().catch(function () {});
        });
        return;
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        video.play().catch(function () {});
        return;
      }
      mediaEl.innerHTML = '<div class="tv-ch-fallback">Não foi possível carregar este canal agora.</div>';
    });
  }

  function construirCard(canal) {
    var card = document.createElement("div");
    card.className = "tv-ch-card";

    var isHls = canal.kind === "hls";
    var head = document.createElement("div");
    head.className = "tv-ch-head";
    head.innerHTML =
      '<span class="tv-ch-eyebrow">OVC TV</span>' +
      '<span class="tv-ch-badge ' + (isHls ? "tv-ch-badge-live" : "tv-ch-badge-24h") + '">' +
      (isHls ? '<span class="tv-ch-dot"></span>AO VIVO' : "PROGRAMAÇÃO 24H") +
      "</span>";
    card.appendChild(head);

    var title = document.createElement("div");
    title.className = "tv-ch-title";
    title.textContent = canal.label || "Canal";
    card.appendChild(title);

    var media = document.createElement("div");
    media.className = "tv-ch-media" + (isHls ? "" : " tv-ch-media-yt");
    if (isHls) {
      montarHls(media, canal.url);
    } else {
      media.innerHTML = '<span class="tv-ch-yt-icon">▶</span>';
    }
    card.appendChild(media);

    var cta = document.createElement("a");
    if (isHls) {
      cta.className = "tv-ch-cta tv-ch-cta-live";
      cta.href = "/tv-ovc/";
      cta.textContent = "Tela cheia no portal";
    } else {
      cta.className = "tv-ch-cta tv-ch-cta-yt";
      cta.href = youtubeWatchUrl(canal);
      cta.target = "_blank";
      cta.rel = "noopener";
      cta.textContent = "▶ Assistir no YouTube";
    }
    card.appendChild(cta);

    return card;
  }

  function montar(live) {
    var bloco = document.querySelector(".rail-block-tv");
    if (!bloco) return;
    var placeholder = bloco.querySelector(".tv-player-placeholder");
    if (!placeholder) return;

    var canais = (live && Array.isArray(live.tv) ? live.tv : []).filter(function (c) {
      return c && c.url && c.active !== false;
    });
    if (!canais.length) return; // sem nenhum canal configurado, deixa o placeholder como estava

    var stack = document.createElement("div");
    stack.className = "tv-channel-stack";
    canais.forEach(function (canal) {
      stack.appendChild(construirCard(canal));
    });

    placeholder.replaceWith(stack);
  }

  function init() {
    if (!document.querySelector(".rail-block-tv")) return;
    injetarCSS();
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
