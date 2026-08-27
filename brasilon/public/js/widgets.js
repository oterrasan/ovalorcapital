// Brasil ON — widgets da lateral (rail direito da home). Roberto, 26/08/2026:
// "nada nas laterais, pobreza total... mete uns widgets ai — climatempo,
// eleições, fofoca, horóscopo". Cada widget é uma IIFE independente com
// try/catch próprio — se um falhar (ex: clima sem rede), os outros
// continuam funcionando normalmente. Só roda na home (precisa dos
// containers data-bon-w-*, que só existem em public/index.html).
(function () {
  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function timeAgo(iso) {
    if (!iso) return "";
    var diffMs = Date.now() - new Date(iso).getTime();
    var min = Math.floor(diffMs / 60000);
    if (min < 1) return "agora";
    if (min < 60) return "há " + min + " min";
    var h = Math.floor(min / 60);
    if (h < 24) return "há " + h + "h";
    var d = Math.floor(h / 24);
    return "há " + d + "d";
  }

  // Posts do feed são buscados 1x e reaproveitados pelos widgets de
  // Eleições/Fofoca (evita 2 fetches redundantes na mesma página).
  var postsPromise = fetch("/api/portal-posts?limit=60").then(function (r) { return r.json(); }).then(function (d) { return d.posts || []; });

  function matchAny(text, keywords) {
    text = text.toLowerCase();
    for (var i = 0; i < keywords.length; i++) if (text.indexOf(keywords[i]) !== -1) return true;
    return false;
  }

  function renderFilteredList(slot, keywords, emptyMsg, max) {
    postsPromise.then(function (posts) {
      var found = posts.filter(function (p) {
        return matchAny((p.titulo || "") + " " + (p.resumo || ""), keywords);
      }).slice(0, max || 3);
      if (!found.length) {
        slot.innerHTML = '<div class="bon-widget-empty">' + emptyMsg + "</div>";
        return;
      }
      slot.innerHTML = found.map(function (p) {
        return (
          '<a class="bon-side-item" href="' + p.url + '">' +
          "<h5>" + esc(p.titulo) + "</h5>" +
          "<time>" + timeAgo(p.published_at) + "</time>" +
          "</a>"
        );
      }).join("");
    }).catch(function () {
      slot.innerHTML = '<div class="bon-widget-empty">' + emptyMsg + "</div>";
    });
  }

  // ── CLIMA — Open-Meteo (grátis, sem chave), 5 capitais ──
  function initClima() {
    var slot = document.querySelector("[data-bon-w-clima]");
    if (!slot) return;
    var cidades = [
      { nome: "São Paulo", lat: -23.55, lon: -46.63 },
      { nome: "Rio de Janeiro", lat: -22.90, lon: -43.21 },
      { nome: "Brasília", lat: -15.78, lon: -47.93 },
      { nome: "Belo Horizonte", lat: -19.92, lon: -43.94 },
      { nome: "Salvador", lat: -12.97, lon: -38.51 },
    ];
    function iconeDoCodigo(code) {
      if (code === 0) return "☀️";
      if (code === 1 || code === 2) return "🌤️";
      if (code === 3) return "☁️";
      if (code === 45 || code === 48) return "🌫️";
      if (code >= 51 && code <= 57) return "🌦️";
      if (code >= 61 && code <= 67) return "🌧️";
      if (code >= 71 && code <= 77) return "❄️";
      if (code >= 80 && code <= 82) return "🌧️";
      if (code === 85 || code === 86) return "❄️";
      if (code >= 95) return "⛈️";
      return "🌡️";
    }
    var lats = cidades.map(function (c) { return c.lat; }).join(",");
    var lons = cidades.map(function (c) { return c.lon; }).join(",");
    fetch("https://api.open-meteo.com/v1/forecast?latitude=" + lats + "&longitude=" + lons + "&current_weather=true")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var lista = Array.isArray(d) ? d : [d];
        slot.innerHTML = cidades.map(function (c, i) {
          var w = lista[i] && lista[i].current_weather;
          if (!w) return '<div class="bon-clima-item"><span class="bon-clima-city">' + c.nome + "</span><span class=\"bon-clima-na\">—</span></div>";
          return (
            '<div class="bon-clima-item">' +
            '<span class="bon-clima-ico">' + iconeDoCodigo(w.weathercode) + "</span>" +
            '<span class="bon-clima-city">' + c.nome + "</span>" +
            '<span class="bon-clima-temp">' + Math.round(w.temperature) + "°C</span>" +
            "</div>"
          );
        }).join("");
      })
      .catch(function () {
        slot.innerHTML = '<div class="bon-widget-empty">Não foi possível carregar o clima agora.</div>';
      });
  }

  // ── ELEIÇÕES 2026 — contagem regressiva real + manchetes filtradas ──
  function initEleicoes() {
    var cdSlot = document.querySelector("[data-bon-w-eleicoes-cd]");
    var listSlot = document.querySelector("[data-bon-w-eleicoes-list]");
    if (cdSlot) {
      var turno1 = new Date("2026-10-04T00:00:00-03:00").getTime();
      var turno2 = new Date("2026-10-25T00:00:00-03:00").getTime();
      var agora = Date.now();
      var alvo = agora < turno1 ? turno1 : turno2;
      var label = agora < turno1 ? "1º turno" : "2º turno";
      var dias = Math.max(0, Math.ceil((alvo - agora) / 86400000));
      cdSlot.innerHTML = dias > 0
        ? '<strong>' + dias + "</strong> dia" + (dias === 1 ? "" : "s") + " para o " + label
        : "Dia de votação!";
    }
    if (listSlot) {
      renderFilteredList(
        listSlot,
        ["eleiç", "eleit", "candidat", "urna", "tse", "votaç", "pesquisa eleitoral", "presidencial", "primeiro turno", "segundo turno", "campanha eleitoral"],
        "Cobertura eleitoral chegando em breve.",
        3
      );
    }
  }

  // ── FOFOCA — filtra o feed por palavras de celebridade/entretenimento ──
  function initFofoca() {
    var slot = document.querySelector("[data-bon-w-fofoca]");
    if (!slot) return;
    renderFilteredList(
      slot,
      ["famos", "celebridade", "novela", "ator ", "atriz", "cantor", "cantora", "influenciador", "influenciadora", "bbb", "reality show"],
      "Sem fofocas por aqui no momento.",
      3
    );
  }

  // ── HORÓSCOPO — entretenimento puro, sem rede, muda a cada dia ──
  function initHoroscopo() {
    var grid = document.querySelector("[data-bon-w-horoscopo-grid]");
    var texto = document.querySelector("[data-bon-w-horoscopo-texto]");
    if (!grid || !texto) return;
    var SIGNOS = [
      ["Áries", "🐏"], ["Touro", "🐂"], ["Gêmeos", "👬"], ["Câncer", "🦀"],
      ["Leão", "🦁"], ["Virgem", "👧"], ["Libra", "⚖️"], ["Escorpião", "🦂"],
      ["Sagitário", "🏹"], ["Capricórnio", "🐐"], ["Aquário", "🏺"], ["Peixes", "🐟"],
    ];
    var FRASES = [
      "Dia favorável para conversas importantes — aproveite para resolver pendências.",
      "Sua energia está em alta. Bom momento para começar algo novo.",
      "Evite decisões precipitadas hoje. Pense duas vezes antes de agir.",
      "Relacionamentos ganham destaque — um encontro pode surpreender.",
      "No trabalho, paciência é a palavra de ordem. As coisas fluem aos poucos.",
      "Boa fase para cuidar de você mesmo. Reserve um tempo para descansar.",
      "Uma notícia inesperada pode mudar seus planos para melhor.",
      "Confie na sua intuição — ela está mais afiada que o normal hoje.",
      "Momento de organizar as finanças e repensar prioridades.",
      "O dia pede leveza. Não leve tudo tão a sério.",
    ];
    function fraseDoDia(signo) {
      var d = new Date();
      var key = signo + "-" + d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
      var h = 0;
      for (var i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
      return FRASES[h % FRASES.length];
    }
    grid.innerHTML = SIGNOS.map(function (s) {
      return '<button type="button" class="bon-signo-btn" data-signo="' + esc(s[0]) + '" title="' + esc(s[0]) + '">' + s[1] + "</button>";
    }).join("");
    grid.addEventListener("click", function (e) {
      var btn = e.target.closest(".bon-signo-btn");
      if (!btn) return;
      grid.querySelectorAll(".bon-signo-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      var signo = btn.getAttribute("data-signo");
      texto.innerHTML = "<strong>" + esc(signo) + ":</strong> " + fraseDoDia(signo);
    });
  }

  function safeInit(fn) {
    try { fn(); } catch (_) { /* um widget falhar não derruba os outros */ }
  }

  document.addEventListener("DOMContentLoaded", function () {
    safeInit(initClima);
    safeInit(initEleicoes);
    safeInit(initFofoca);
    safeInit(initHoroscopo);
  });
})();
