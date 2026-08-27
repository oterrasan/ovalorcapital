// Brasil ON — motor de disposição de cards. Roberto: "NAO QUERO CARDS
// TODOS IGUAIS DEPOIS DA PARTE PRINCIPAL DA HOME... construa disposições
// de cards variando a cada 3 ou 4, quero tudo diferente, nao quero
// simetria... cards de tamanhos e proporcoes diferentes por todo o
// portal" — e depois: "PARA DE USAR SOLUCOES DE VAGABUNDO, quero o
// portal todo brincando com cards e posicoes, dimensoes e ESTILOS
// diferentes". Por isso os 8 templates abaixo não variam só tamanho —
// alguns invertem a paleta (fundo escuro), alguns não têm foto nenhuma
// (caixa de destaque com barra colorida), um deles desalinha a posição
// vertical dos itens de propósito (masonry escalonado). home.js e
// category.js só chamam BonBlocks.renderBlocks(posts) e injetam o HTML.
(function () {
  var CAT_LABEL = { "brasil-on": "Brasil ON", politica: "Política", policia: "Polícia", futebol: "Futebol" };
  var CAT_SLUG = { "brasil-on": "brasil-on", politica: "politica", policia: "policia", futebol: "futebol" };

  function esc(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function catClass(categoria) {
    return CAT_SLUG[categoria] ? "cat-" + CAT_SLUG[categoria] : "";
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

  function pillHtml(categoria, showPill, extraClass) {
    if (showPill === false) return "";
    var cat = CAT_LABEL[categoria] || categoria;
    return '<span class="bon-catpill ' + catClass(categoria) + (extraClass ? " " + extraClass : "") + '">' + esc(cat) + "</span>";
  }

  function img(p, cls) {
    return p.imagem ? '<div class="' + cls + '"><img src="' + p.imagem + '" alt="" loading="lazy"></div>' : "";
  }

  // ── T1 — TRIO EQUILIBRADO: 3 fotos 4:3 lado a lado, estilo claro padrão ──
  function trioItem(p, showPill) {
    return (
      '<a class="bon-featured-item" href="' + p.url + '">' +
      img(p, "bon-featured-media") +
      pillHtml(p.categoria, showPill) +
      "<h3>" + esc(p.titulo) + "</h3>" +
      "</a>"
    );
  }
  function blockTrio(items, showPill) {
    return '<div class="bon-block bon-block-trio">' + items.map(function (p) { return trioItem(p, showPill); }).join("") + "</div>";
  }

  // ── T2 — GRADE MINIÚSCULA: 4 fotos quadradas pequenas, bem denso ──
  function quadItem(p, showPill) {
    return (
      '<a class="bon-quad-item" href="' + p.url + '">' +
      img(p, "bon-quad-media") +
      pillHtml(p.categoria, showPill) +
      "<h5>" + esc(p.titulo) + "</h5>" +
      "<time>" + timeAgo(p.published_at) + "</time>" +
      "</a>"
    );
  }
  function blockQuad(items, showPill) {
    return '<div class="bon-block bon-block-quad">' + items.map(function (p) { return quadItem(p, showPill); }).join("") + "</div>";
  }

  // ── T3 — ASSIMÉTRICO: 1 card grande (16:9) + 2 pequenos ao lado —
  //    tamanhos DIFERENTES dentro do mesmo bloco, de propósito ──
  function asymLead(p, showPill) {
    return (
      '<a class="bon-asym-lead" href="' + p.url + '">' +
      img(p, "bon-asym-media") +
      pillHtml(p.categoria, showPill) +
      "<h2>" + esc(p.titulo) + "</h2>" +
      (p.resumo ? '<p class="bon-asym-deck">' + esc(p.resumo).slice(0, 140) + "</p>" : "") +
      "<time>" + timeAgo(p.published_at) + "</time>" +
      "</a>"
    );
  }
  function asymSide(p, showPill) {
    return (
      '<a class="bon-thumb-item bon-asym-side-item" href="' + p.url + '">' +
      '<div class="bon-thumb"><img src="' + (p.imagem || "") + '" alt="" loading="lazy"></div>' +
      '<div class="bon-thumb-body">' + pillHtml(p.categoria, showPill) + "<h4>" + esc(p.titulo) + "</h4>" +
      "<time>" + timeAgo(p.published_at) + "</time></div>" +
      "</a>"
    );
  }
  function blockAsym(items, showPill) {
    var lead = items[0];
    var side = items.slice(1);
    return (
      '<div class="bon-block bon-block-asym">' +
      asymLead(lead, showPill) +
      '<div class="bon-asym-side">' + side.map(function (p) { return asymSide(p, showPill); }).join("") + "</div>" +
      "</div>"
    );
  }

  // ── T4 — LISTA COM THUMB: linhas verticais, foto pequena à esquerda ──
  function thumbItem(p, showPill) {
    var body = pillHtml(p.categoria, showPill) + "<h4>" + esc(p.titulo) + "</h4>" + "<time>" + timeAgo(p.published_at) + "</time>";
    if (p.imagem) {
      return (
        '<a class="bon-dense-item bon-thumb-item" href="' + p.url + '">' +
        '<div class="bon-thumb"><img src="' + p.imagem + '" alt="" loading="lazy"></div>' +
        '<div class="bon-thumb-body">' + body + "</div>" +
        "</a>"
      );
    }
    return '<a class="bon-dense-item" href="' + p.url + '">' + body + "</a>";
  }
  function blockThumblist(items, showPill) {
    return '<div class="bon-block bon-block-thumblist">' + items.map(function (p) { return thumbItem(p, showPill); }).join("") + "</div>";
  }

  // ── T5 — DUPLA GRANDE: 2x2, fotos 16:9 maiores que a grade miniúscula ──
  function duoItem(p, showPill) {
    return (
      '<a class="bon-duogrid-item" href="' + p.url + '">' +
      img(p, "bon-duogrid-media") +
      pillHtml(p.categoria, showPill) +
      "<h4>" + esc(p.titulo) + "</h4>" +
      "<time>" + timeAgo(p.published_at) + "</time>" +
      "</a>"
    );
  }
  function blockDuogrid(items, showPill) {
    return '<div class="bon-block bon-block-duogrid">' + items.map(function (p) { return duoItem(p, showPill); }).join("") + "</div>";
  }

  // ── T6 — SPOTLIGHT ESCURO: 1 card full-width, fundo invertido (foto com
  //    overlay escuro + título grande branco) — quebra total de paleta,
  //    não é só "outro tamanho", é outro ESTILO ──
  function spotlightItem(p, showPill) {
    return (
      '<a class="bon-spotlight-card" href="' + p.url + '">' +
      img(p, "bon-spotlight-media") +
      '<div class="bon-spotlight-overlay">' +
      pillHtml(p.categoria, showPill, "bon-catpill-inverse") +
      "<h2>" + esc(p.titulo) + "</h2>" +
      "<time>" + timeAgo(p.published_at) + "</time>" +
      "</div></a>"
    );
  }
  function blockSpotlight(items) {
    return '<div class="bon-block bon-block-spotlight">' + spotlightItem(items[0]) + "</div>";
  }

  // ── T7 — CAIXA DE DESTAQUE: 3 itens SEM foto, fundo bege/creme, barra
  //    colorida lateral, tipografia grande de "manchete curta" — o oposto
  //    de todos os blocos com foto ──
  function briefItem(p, showPill) {
    return (
      '<a class="bon-brief-item" href="' + p.url + '">' +
      pillHtml(p.categoria, showPill) +
      "<h3>" + esc(p.titulo) + "</h3>" +
      "<time>" + timeAgo(p.published_at) + "</time>" +
      "</a>"
    );
  }
  function blockBriefs(items, showPill) {
    return '<div class="bon-block bon-block-briefs">' + items.map(function (p) { return briefItem(p, showPill); }).join("") + "</div>";
  }

  // ── T8 — DUPLA ESCALONADA (masonry): 2 cards de proporção DIFERENTE
  //    entre si (um retrato 3:4, outro paisagem 16:9) e POSIÇÃO vertical
  //    deslocada — não alinham na mesma linha de propósito ──
  function staggerItem(p, cls, mediaCls) {
    return (
      '<a class="bon-stagger-item ' + cls + '" href="' + p.url + '">' +
      img(p, mediaCls) +
      "<h3>" + esc(p.titulo) + "</h3>" +
      "<time>" + timeAgo(p.published_at) + "</time>" +
      "</a>"
    );
  }
  function blockStagger(items) {
    var a = items[0], b = items[1];
    return (
      '<div class="bon-block bon-block-stagger">' +
      staggerItem(a, "bon-stagger-tall", "bon-stagger-media-tall") +
      staggerItem(b, "bon-stagger-wide", "bon-stagger-media-wide") +
      "</div>"
    );
  }

  // Ciclo de templates — tamanho de "take" quase sempre 3-4 (pedido de
  // Roberto), mas também alterna PALETA (claro/escuro), PRESENÇA DE FOTO
  // (com/sem) e POSIÇÃO (grade alinhada vs. escalonada). Nunca duas
  // entradas seguidas do mesmo estilo.
  var TEMPLATES = [
    { take: 3, min: 3, render: blockTrio },
    { take: 1, min: 1, render: blockSpotlight },
    { take: 4, min: 3, render: blockQuad },
    { take: 3, min: 2, render: blockBriefs },
    { take: 3, min: 2, render: blockAsym },
    { take: 2, min: 2, render: blockStagger },
    { take: 4, min: 3, render: blockThumblist },
    { take: 4, min: 3, render: blockDuogrid },
  ];

  // Retorna {html, nextIndex} — nextIndex é o índice de template por onde
  // parou, pra paginação (public/js/category.js) continuar o ciclo de
  // formatos na página seguinte em vez de reiniciar sempre do T1.
  function renderBlocks(posts, opts) {
    opts = opts || {};
    var showPill = opts.showPill !== false;
    var startAt = opts.startAt || 0;
    var out = [];
    var i = 0;
    var tIdx = startAt;
    var guard = 0;
    while (i < posts.length && guard < 200) {
      guard++;
      var tpl = TEMPLATES[tIdx % TEMPLATES.length];
      var remaining = posts.length - i;
      // se não sobrar gente pro mínimo exigido por este template (ex: asym
      // precisa de 2, stagger precisa de 2), pula pro próximo formato em
      // vez de renderizar um bloco quebrado.
      if (remaining < tpl.min) { tIdx++; continue; }
      var chunk = posts.slice(i, i + tpl.take);
      out.push(tpl.render(chunk, showPill));
      i += chunk.length;
      tIdx++;
    }
    return { html: out.join(""), nextIndex: tIdx };
  }

  window.BonBlocks = { renderBlocks: renderBlocks, esc: esc, timeAgo: timeAgo, pillHtml: pillHtml };
})();
