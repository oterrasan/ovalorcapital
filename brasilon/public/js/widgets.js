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

  // ── CLIMA — Open-Meteo (grátis, sem chave), as 27 capitais (26 estados +
  // DF) agrupadas por região — Roberto: "o clima tem que ser de todo o
  // Brasil". Lista rola dentro da caixa (max-height no CSS) pra não
  // estourar a lateral inteira.
  function initClima() {
    var slot = document.querySelector("[data-bon-w-clima]");
    if (!slot) return;
    var cidades = [
      { nome: "Manaus", uf: "AM", regiao: "Norte", lat: -3.10, lon: -60.02 },
      { nome: "Belém", uf: "PA", regiao: "Norte", lat: -1.46, lon: -48.50 },
      { nome: "Porto Velho", uf: "RO", regiao: "Norte", lat: -8.76, lon: -63.90 },
      { nome: "Rio Branco", uf: "AC", regiao: "Norte", lat: -9.97, lon: -67.81 },
      { nome: "Boa Vista", uf: "RR", regiao: "Norte", lat: 2.82, lon: -60.67 },
      { nome: "Macapá", uf: "AP", regiao: "Norte", lat: 0.03, lon: -51.05 },
      { nome: "Palmas", uf: "TO", regiao: "Norte", lat: -10.25, lon: -48.32 },
      { nome: "Salvador", uf: "BA", regiao: "Nordeste", lat: -12.97, lon: -38.51 },
      { nome: "Recife", uf: "PE", regiao: "Nordeste", lat: -8.05, lon: -34.90 },
      { nome: "Fortaleza", uf: "CE", regiao: "Nordeste", lat: -3.73, lon: -38.53 },
      { nome: "São Luís", uf: "MA", regiao: "Nordeste", lat: -2.53, lon: -44.30 },
      { nome: "Natal", uf: "RN", regiao: "Nordeste", lat: -5.79, lon: -35.21 },
      { nome: "João Pessoa", uf: "PB", regiao: "Nordeste", lat: -7.12, lon: -34.86 },
      { nome: "Maceió", uf: "AL", regiao: "Nordeste", lat: -9.65, lon: -35.70 },
      { nome: "Aracaju", uf: "SE", regiao: "Nordeste", lat: -10.91, lon: -37.07 },
      { nome: "Teresina", uf: "PI", regiao: "Nordeste", lat: -5.09, lon: -42.80 },
      { nome: "Brasília", uf: "DF", regiao: "Centro-Oeste", lat: -15.78, lon: -47.93 },
      { nome: "Goiânia", uf: "GO", regiao: "Centro-Oeste", lat: -16.68, lon: -49.25 },
      { nome: "Cuiabá", uf: "MT", regiao: "Centro-Oeste", lat: -15.60, lon: -56.10 },
      { nome: "Campo Grande", uf: "MS", regiao: "Centro-Oeste", lat: -20.44, lon: -54.65 },
      { nome: "São Paulo", uf: "SP", regiao: "Sudeste", lat: -23.55, lon: -46.63 },
      { nome: "Rio de Janeiro", uf: "RJ", regiao: "Sudeste", lat: -22.90, lon: -43.21 },
      { nome: "Belo Horizonte", uf: "MG", regiao: "Sudeste", lat: -19.92, lon: -43.94 },
      { nome: "Vitória", uf: "ES", regiao: "Sudeste", lat: -20.32, lon: -40.34 },
      { nome: "Curitiba", uf: "PR", regiao: "Sul", lat: -25.43, lon: -49.27 },
      { nome: "Florianópolis", uf: "SC", regiao: "Sul", lat: -27.60, lon: -48.55 },
      { nome: "Porto Alegre", uf: "RS", regiao: "Sul", lat: -30.03, lon: -51.23 },
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
        var porRegiao = {};
        var ordemRegioes = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"];
        cidades.forEach(function (c, i) {
          var w = lista[i] && lista[i].current_weather;
          var cidadeLabel = c.nome + " (" + c.uf + ")";
          var meio = w
            ? '<span class="bon-clima-ico">' + iconeDoCodigo(w.weathercode) + '</span><span class="bon-clima-city">' + cidadeLabel + '</span><span class="bon-clima-temp">' + Math.round(w.temperature) + "°C</span>"
            : '<span class="bon-clima-city">' + cidadeLabel + '</span><span class="bon-clima-na">—</span>';
          var linha = '<div class="bon-clima-item">' + meio + "</div>";
          (porRegiao[c.regiao] = porRegiao[c.regiao] || []).push(linha);
        });
        slot.innerHTML = ordemRegioes.map(function (r) {
          return '<div class="bon-clima-regiao">' + r + '</div>' + (porRegiao[r] || []).join("");
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
