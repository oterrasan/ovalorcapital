(function () {
  "use strict";
  // Liga o card "OVC TV" da home a um player real de canais públicos ao
  // vivo. Independente de home.js e de internal-page-v2.js — se este
  // script falhar, nada mais no portal quebra.
  //
  // 26/11/2026 (reescrita 2) — Roberto rejeitou com força a versão anterior
  // (link pra abrir o canal no YouTube em vez de tocar no portal): "NAO
  // QUERO QUE CLICANDO O LINK DIRECIONE PRA PORRA DE YOUTUBE... ISSO DEVE
  // ABRIR TUDO E RODAR OS PLAYERS NO PORTAL." Pedido explícito e literal:
  // TODOS os canais embutidos e tocando ao mesmo tempo, com som desligado
  // por padrão, um abaixo do outro — o usuário ativa o som do que quiser
  // clicando no próprio player (controle nativo de mudo do <video>/do
  // embed do YouTube, sem nenhum JS extra necessário pra isso).
  //
  // Nenhum canal mais abre em nova aba nem linka pra fora do portal.
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
      ".tv-ch-fallback{font-size:11px;color:#94a3b8;padding:10px 12px;text-align:center;}"
    ].join("");
    var tag = document.createElement("style");
    tag.id = "ovc-tv-home-css";
    tag.textContent = css;
    document.head.appendChild(tag);
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

  function montarYoutube(mediaEl, url) {
    var iframe = document.createElement("iframe");
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
    iframe.setAttribute("allowfullscreen", "");
    iframe.setAttribute("title", "Canal ao vivo OVC TV");
    // autoplay=1&mute=1: toca direto, mudo — navegadores sempre permitem
    // autoplay quando o som começa desligado. playsinline evita
    // tela cheia forçada em celular. O próprio player do YouTube mostra o
    // ícone de som — o usuário ativa clicando nele, sem JS extra nosso.
    iframe.src = url + (url.indexOf("?") >= 0 ? "&" : "?") + "autoplay=1&mute=1&playsinline=1";
    mediaEl.appendChild(iframe);
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
    media.className = "tv-ch-media";
    if (isHls) {
      montarHls(media, canal.url);
    } else {
      montarYoutube(media, canal.url);
    }
    card.appendChild(media);

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
