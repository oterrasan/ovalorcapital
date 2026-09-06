// OPMED — homepage: hero + miolo com disposições de card variando (motor
// portado do Brasil ON, ver blocks.js) + rail lateral "Mais Lidas"/"Últimas".
// Mesma lógica de dados do Brasil ON (fetch /api/portal-posts), só a
// disposição visual do topo/rails é que segue o padrão OVC (ver index.html).
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

  function heroHtml(p) {
    var img = p.imagem
      ? '<div class="op-hero-media"><img src="' + p.imagem + '" alt=""></div>'
      : "";
    return (
      '<a class="op-hero-card" href="' + p.url + '">' +
      img +
      window.OpBlocks.pillHtml(p.categoria) +
      "<h1>" + esc(p.titulo) + "</h1>" +
      (p.resumo ? '<p class="op-hero-deck">' + esc(p.resumo).slice(0, 180) + "</p>" : "") +
      '<div class="op-hero-time">' + timeAgo(p.published_at) + "</div>" +
      "</a>"
    );
  }

  function sideItemHtml(p) {
    return (
      '<a class="op-side-item" href="' + p.url + '">' +
      "<h5>" + esc(p.titulo) + "</h5>" +
      "<time>" + timeAgo(p.published_at) + "</time>" +
      "</a>"
    );
  }

  async function fetchJson(url) {
    var r = await fetch(url);
    return r.json();
  }

  // ⚠️ DADOS DE EXEMPLO (mock) — o backend do OPMED ainda não existe
  // (sem banco, sem API, sem matéria real). Sem isso, a homepage carregava
  // vazia/com erro e não dava pra avaliar o layout de verdade. Isso NUNCA
  // deve ser confundido com conteúdo real — some sozinho assim que
  // /api/portal-posts existir e responder com posts de verdade (o fetch()
  // real é sempre tentado primeiro; isso só entra em cena se ele falhar).
  var MOCK_POSTS = [
    { titulo: "Ministério da Saúde amplia campanha de vacinação contra a gripe em todo o país", resumo: "Nova fase da campanha prioriza idosos, gestantes e profissionais da saúde, com previsão de ampliação dos postos de atendimento.", categoria: "saude-publica", imagem: "/assets/mock/saudepublica-1.jpg", published_at: mockDate(8), url: "#" },
    { titulo: "Estudo brasileiro identifica novo marcador genético associado a doenças cardíacas", resumo: "Pesquisa de dez anos conduzida por universidades públicas pode abrir caminho para diagnósticos mais precoces.", categoria: "ciencia", imagem: "/assets/mock/ciencia-1.jpg", published_at: mockDate(25), url: "#" },
    { titulo: "Uso de fio dental reduz em até 40% risco de doenças gengivais, aponta levantamento", resumo: "", categoria: "odontologia", imagem: "/assets/mock/odontologia-1.jpg", published_at: mockDate(40), url: "#" },
    { titulo: "Especialistas recomendam pausas regulares para reduzir fadiga visual no trabalho remoto", resumo: "", categoria: "bem-estar", imagem: "/assets/mock/bemestar-1.jpg", published_at: mockDate(55), url: "#" },
    { titulo: "Hospitais brasileiros ampliam uso de telemedicina para consultas de acompanhamento", resumo: "", categoria: "medicina", imagem: "/assets/mock/medicina-1.webp", published_at: mockDate(70), url: "#" },
    { titulo: "Anvisa aprova novo protocolo para testes rápidos de doenças respiratórias", resumo: "", categoria: "saude-publica", imagem: "/assets/mock/saudepublica-2.jpg", published_at: mockDate(90), url: "#" },
    { titulo: "Pesquisadores desenvolvem sensor que detecta níveis de glicose sem picada de agulha", resumo: "", categoria: "ciencia", imagem: "/assets/mock/ciencia-2.jpg", published_at: mockDate(100), url: "#" },
    { titulo: "Sono de má qualidade está ligado a maior risco de ansiedade, mostra revisão de estudos", resumo: "", categoria: "bem-estar", imagem: "/assets/mock/bemestar-2.jpg", published_at: mockDate(115), url: "#" },
    { titulo: "Nova diretriz orienta pediatras sobre uso de telas em crianças pequenas", resumo: "", categoria: "medicina", imagem: "/assets/mock/medicina-2.webp", published_at: mockDate(130), url: "#" },
    { titulo: "Clareamento dental caseiro: dentistas alertam para riscos de produtos sem regulamentação", resumo: "", categoria: "odontologia", imagem: "/assets/mock/odontologia-2.jpg", published_at: mockDate(140), url: "#" },
    { titulo: "Ministério da Saúde divulga boletim semanal de monitoramento de arboviroses", resumo: "", categoria: "saude-publica", imagem: "/assets/mock/saudepublica-1.jpg", published_at: mockDate(150), url: "#" },
    { titulo: "Simulações em laboratório indicam nova via para tratamento de resistência a antibióticos", resumo: "", categoria: "ciencia", imagem: "/assets/mock/ciencia-1.jpg", published_at: mockDate(160), url: "#" },
    { titulo: "Caminhada leve de 20 minutos por dia já traz benefícios cardiovasculares, diz estudo", resumo: "", categoria: "bem-estar", imagem: "/assets/mock/bemestar-1.jpg", published_at: mockDate(170), url: "#" },
    { titulo: "Cirurgias eletivas voltam a crescer na rede pública após redução de filas de espera", resumo: "", categoria: "medicina", imagem: "/assets/mock/medicina-3.webp", published_at: mockDate(180), url: "#" },
    { titulo: "Aparelho ortodôntico invisível ganha popularidade entre adultos, mostra levantamento", resumo: "", categoria: "odontologia", imagem: "/assets/mock/odontologia-1.jpg", published_at: mockDate(190), url: "#" },
    { titulo: "Campanha de conscientização sobre saúde mental chega às escolas públicas", resumo: "", categoria: "saude-publica", imagem: "/assets/mock/saudepublica-2.jpg", published_at: mockDate(200), url: "#" },
    { titulo: "Vacina experimental contra dengue mostra resultados promissores em nova fase de testes", resumo: "", categoria: "ciencia", imagem: "/assets/mock/ciencia-2.jpg", published_at: mockDate(210), url: "#" },
    { titulo: "Meditação guiada reduz níveis de cortisol em apenas quatro semanas, aponta pesquisa", resumo: "", categoria: "bem-estar", imagem: "/assets/mock/bemestar-2.jpg", published_at: mockDate(220), url: "#" },
    { titulo: "Hospitais universitários relatam avanço no uso de inteligência artificial em diagnósticos", resumo: "", categoria: "medicina", imagem: "/assets/mock/medicina-1.webp", published_at: mockDate(230), url: "#" },
    { titulo: "Dor de dente persistente pode ser sinal de problema mais sério, alertam especialistas", resumo: "", categoria: "odontologia", imagem: "/assets/mock/odontologia-2.jpg", published_at: mockDate(240), url: "#" },
    { titulo: "Município amplia rede de UBS e reduz tempo médio de espera por consulta", resumo: "", categoria: "saude-publica", imagem: "/assets/mock/saudepublica-1.jpg", published_at: mockDate(250), url: "#" },
    { titulo: "Novo estudo mapeia impacto da poluição do ar em doenças respiratórias crônicas", resumo: "", categoria: "ciencia", imagem: "/assets/mock/ciencia-1.jpg", published_at: mockDate(260), url: "#" }
  ];

  function mockDate(minutesAgo) {
    return new Date(Date.now() - minutesAgo * 60000).toISOString();
  }

  // Widget de rail filtrado por categoria — mesmo mecanismo do rail
  // "Futebol" do Brasil ON (home.js): filtra os PRÓPRIOS posts do
  // portal já carregados, sem chamada extra de rede. O wrapper (passado
  // via data-attr "-wrap" ao lado do slot) só aparece se houver conteúdo
  // de verdade — nunca deixa caixa vazia (mesma regra do OVC: "se não
  // houver conteúdo disponível, o bloco não aparece").
  function renderCategoriaWidget(posts, categoria, slotAttr, limit) {
    var slot = document.querySelector("[data-op-w-" + slotAttr + "]");
    if (!slot) return;
    var wrap = document.querySelector("[data-op-w-" + slotAttr + "-wrap]");
    var itens = posts.filter(function (p) { return p.categoria === categoria; }).slice(0, limit || 6);
    if (!itens.length) { if (wrap) wrap.hidden = true; return; }
    slot.innerHTML = itens.map(sideItemHtml).join("");
    if (wrap) wrap.hidden = false;
  }

  function showMockBanner() {
    if (document.querySelector("[data-op-mock-banner]")) return;
    var b = document.createElement("div");
    b.setAttribute("data-op-mock-banner", "");
    b.style.cssText = "background:#fef3c7;color:#78350f;font:600 13px/1.4 var(--font-base);text-align:center;padding:8px 16px;border-bottom:1px solid #fde68a;";
    b.textContent = "⚠️ DADOS DE EXEMPLO — o OPMED ainda não tem backend/matérias reais. Este conteúdo é só pra visualizar o layout.";
    document.body.insertBefore(b, document.body.firstChild);
  }

  async function load() {
    var heroSlot = document.querySelector("[data-op-hero]");
    var blocksSlot = document.querySelector("[data-op-blocks]");
    var ultimasSlot = document.querySelector("[data-op-ultimas]");
    var maisLidasSlot = document.querySelector("[data-op-w-maislidas]");
    if (!blocksSlot) return;

    var posts;
    try {
      var d = await fetchJson("/api/portal-posts?limit=60");
      posts = d.posts || [];
    } catch (_) {
      posts = [];
    }

    if (!posts.length) {
      posts = MOCK_POSTS;
      showMockBanner();
    }

    try {
      if (ultimasSlot) {
        ultimasSlot.innerHTML = posts.slice(0, 12).map(sideItemHtml).join("");
      }

      if (maisLidasSlot) {
        // Ranking real de views ainda depende do endpoint dedicado
        // (mesmo padrão do Brasil ON — ver mais-lidas.js). Fallback aqui
        // por ordem de publicação até esse endpoint existir.
        maisLidasSlot.innerHTML = posts.slice(0, 8).map(sideItemHtml).join("");
      }

      renderCategoriaWidget(posts, "saude-publica", "saudepublica", 6);
      renderCategoriaWidget(posts, "ciencia", "ciencia", 6);

      var hero = posts[0];
      var resto = posts.slice(1);

      if (heroSlot) heroSlot.innerHTML = heroHtml(hero);
      blocksSlot.innerHTML = resto.length
        ? window.OpBlocks.renderBlocks(resto).html
        : '<div class="op-empty">Sem mais matérias no momento.</div>';
    } catch (_) {
      blocksSlot.innerHTML = '<div class="op-empty">Não foi possível carregar as matérias agora.</div>';
    }
  }

  document.addEventListener("DOMContentLoaded", load);
})();
