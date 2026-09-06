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
    // ── 1. Mercado, Negócios & Gestão ──
    { titulo: "ANS aprova novo modelo de reajuste para planos de saúde coletivos empresariais", resumo: "Mudança na metodologia de cálculo da sinistralidade deve afetar renegociações de contratos corporativos a partir do próximo trimestre.", categoria: "mercado-negocios", subcategoria: "Planos de Saúde & Saúde Suplementar", imagem: "/assets/mock/medicina-2.webp", published_at: mockDate(8), url: "#" },
    { titulo: "Rede hospitalar brasileira investe em acreditação internacional para atrair pacientes de fora", resumo: "Certificações ONA e JCI viram diferencial competitivo em meio à disputa por leitos de alta complexidade.", categoria: "mercado-negocios", subcategoria: "Hospitais & Clínicas", imagem: "/assets/mock/medicina-1.webp", published_at: mockDate(45), url: "#" },
    { titulo: "Fusão entre grandes redes de laboratórios de análises clínicas avança no CADE", resumo: "", categoria: "mercado-negocios", subcategoria: "Laboratórios & Diagnóstico", imagem: "/assets/mock/ciencia-1.jpg", published_at: mockDate(95), url: "#" },
    { titulo: "Indústria farmacêutica reporta gargalo global na cadeia de insumos para medicamentos injetáveis", resumo: "", categoria: "mercado-negocios", subcategoria: "Indústria Farmacêutica & Insumos", imagem: "/assets/mock/ciencia-2.jpg", published_at: mockDate(150), url: "#" },

    // ── 2. Prática Clínica & Especialidades ──
    { titulo: "Novo protocolo de cirurgia robótica reduz tempo de recuperação em procedimentos abdominais", resumo: "Estudo multicêntrico acompanhou pacientes de oito hospitais brasileiros ao longo de dois anos.", categoria: "pratica-clinica", subcategoria: "Medicina & Enfermagem", imagem: "/assets/mock/medicina-3.webp", published_at: mockDate(20), url: "#" },
    { titulo: "Implantodontia guiada por computador ganha espaço em clínicas odontológicas do país", resumo: "", categoria: "pratica-clinica", subcategoria: "Odontologia (Saúde Bucal)", imagem: "/assets/mock/odontologia-1.jpg", published_at: mockDate(60), url: "#" },
    { titulo: "Fisioterapia baseada em realidade virtual acelera reabilitação de lesões esportivas", resumo: "", categoria: "pratica-clinica", subcategoria: "Reabilitação & Movimento", imagem: "/assets/mock/bemestar-2.jpg", published_at: mockDate(110), url: "#" },
    { titulo: "Pesquisa em imunologia identifica novo marcador genético associado a doenças cardíacas", resumo: "", categoria: "pratica-clinica", subcategoria: "Ciências Biológicas & Diagnósticas", imagem: "/assets/mock/odontologia-2.jpg", published_at: mockDate(165), url: "#" },

    // ── 3. Inovação & Saúde Digital ──
    { titulo: "Algoritmo de IA para triagem de pronto-socorro reduz tempo de espera em hospital-piloto", resumo: "Ferramenta prioriza casos de risco a partir de sinais vitais e histórico do paciente, com supervisão médica em todas as etapas.", categoria: "inovacao-digital", subcategoria: "Inteligência Artificial", imagem: "/assets/mock/ciencia-1.jpg", published_at: mockDate(32), url: "#" },
    { titulo: "Regulamentação de prescrição digital avança e amplia acesso à telemedicina no interior do país", resumo: "", categoria: "inovacao-digital", subcategoria: "Telessaúde & Telemedicina", imagem: "/assets/mock/medicina-1.webp", published_at: mockDate(80), url: "#" },
    { titulo: "Prótese biônica com controle neural entra em fase de testes clínicos no Brasil", resumo: "", categoria: "inovacao-digital", subcategoria: "Engenharia Biomédica", imagem: "/assets/mock/ciencia-2.jpg", published_at: mockDate(135), url: "#" },
    { titulo: "Wearables de monitoramento contínuo de glicose ganham nova geração de sensores", resumo: "", categoria: "inovacao-digital", subcategoria: "Telessaúde & Telemedicina", imagem: "/assets/mock/medicina-2.webp", published_at: mockDate(190), url: "#" },

    // ── 4. Saúde Mental & Comportamento ──
    { titulo: "Novo protocolo de terapia cognitivo-comportamental mostra resultados em quatro semanas", resumo: "Estudo clínico acompanhou pacientes com ansiedade generalizada em rede pública de saúde mental.", categoria: "saude-mental", subcategoria: "Psicologia & Psiquiatria", imagem: "/assets/mock/bemestar-1.jpg", published_at: mockDate(15), url: "#" },
    { titulo: "Hospitais lançam programas internos para prevenir burnout em equipes de enfermagem", resumo: "", categoria: "saude-mental", subcategoria: "Saúde Mental do Profissional", imagem: "/assets/mock/bemestar-2.jpg", published_at: mockDate(70), url: "#" },
    { titulo: "Acupuntura como terapia complementar ganha respaldo em revisão de estudos clínicos", resumo: "", categoria: "saude-mental", subcategoria: "Terapias Integrativas", imagem: "/assets/mock/bemestar-1.jpg", published_at: mockDate(125), url: "#" },

    // ── 5. Prevenção, Longevidade & Estilo de Vida ──
    { titulo: "Dieta rica em fibras reduz risco de doenças crônicas em estudo de longo prazo", resumo: "Pesquisa acompanhou hábitos alimentares de mais de dez mil participantes ao longo de uma década.", categoria: "prevencao-longevidade", subcategoria: "Nutrição & Dietética", imagem: "/assets/mock/bemestar-2.jpg", published_at: mockDate(28), url: "#" },
    { titulo: "Caminhada leve de 20 minutos por dia já traz benefícios cardiovasculares, diz estudo", resumo: "", categoria: "prevencao-longevidade", subcategoria: "Educação Física & Esporte", imagem: "/assets/mock/bemestar-1.jpg", published_at: mockDate(85), url: "#" },
    { titulo: "Medicina esportiva orienta clubes sobre prevenção de lesões em atletas de base", resumo: "", categoria: "prevencao-longevidade", subcategoria: "Educação Física & Esporte", imagem: "/assets/mock/bemestar-2.jpg", published_at: mockDate(145), url: "#" },

    // ── 6. Saúde Coletiva & Políticas Públicas ──
    { titulo: "Ministério da Saúde amplia campanha de vacinação contra a gripe em todo o país", resumo: "Nova fase da campanha prioriza idosos, gestantes e profissionais da saúde, com previsão de ampliação dos postos de atendimento.", categoria: "saude-coletiva", subcategoria: "Epidemiologia & Surtos", imagem: "/assets/mock/saudepublica-1.jpg", published_at: mockDate(12), url: "#" },
    { titulo: "Município amplia rede de UBS e reduz tempo médio de espera por consulta no SUS", resumo: "", categoria: "saude-coletiva", subcategoria: "Políticas Públicas & SUS", imagem: "/assets/mock/saudepublica-2.jpg", published_at: mockDate(55), url: "#" },
    { titulo: "Grandes empresas ampliam programas de medicina do trabalho e ergonomia após novas normas", resumo: "", categoria: "saude-coletiva", subcategoria: "Saúde Corporativa & do Trabalho", imagem: "/assets/mock/saudepublica-1.jpg", published_at: mockDate(105), url: "#" },
    { titulo: "Vigilância sanitária intensifica fiscalização de estabelecimentos após surto de intoxicação alimentar", resumo: "", categoria: "saude-coletiva", subcategoria: "Vigilância Sanitária", imagem: "/assets/mock/saudepublica-2.jpg", published_at: mockDate(160), url: "#" },
    { titulo: "OMS revisa diretrizes globais de resposta a surtos de doenças respiratórias", resumo: "", categoria: "saude-coletiva", subcategoria: "Epidemiologia & Surtos", imagem: "/assets/mock/saudepublica-1.jpg", published_at: mockDate(210), url: "#" },
    { titulo: "Anvisa aprova novo protocolo para testes rápidos de doenças respiratórias", resumo: "", categoria: "saude-coletiva", subcategoria: "Vigilância Sanitária", imagem: "/assets/mock/saudepublica-2.jpg", published_at: mockDate(240), url: "#" }
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

      renderCategoriaWidget(posts, "saude-coletiva", "coletiva", 6);
      renderCategoriaWidget(posts, "inovacao-digital", "inovacao", 6);

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
