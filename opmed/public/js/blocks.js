// OPMED — motor de disposição de cards. PORTADO de brasilon/public/js/blocks.js
// (mesmo motor, mesma lógica, prefixo de classe trocado de "bon-" para "op-"
// e mapa de categorias trocado para o escopo de saúde/medicina/ciência).
// Nunca dois blocos seguidos do mesmo formato — 8 templates, tamanho,
// paleta e presença de foto variando. home.js e category.js só chamam
// OpBlocks.renderBlocks(posts) e injetam o HTML.
//
// Taxonomia de 6 macro-editorias definida por Roberto em 06/09/2026 (ver
// opmed/CLAUDE.md seção 4 pro mapa completo de subcategorias/slugs) —
// substitui o placeholder de 5 categorias soltas da primeira versão.
(function () {
  var CAT_LABEL = {
    "mercado-negocios": "Mercado & Negócios",
    "pratica-clinica": "Prática Clínica",
    "inovacao-digital": "Inovação Digital",
    "saude-mental": "Saúde Mental",
    "prevencao-longevidade": "Prevenção & Longevidade",
    "saude-coletiva": "Saúde Coletiva"
  };
  var CAT_SLUG = {
    "mercado-negocios": "mercado-negocios",
    "pratica-clinica": "pratica-clinica",
    "inovacao-digital": "inovacao-digital",
    "saude-mental": "saude-mental",
    "prevencao-longevidade": "prevencao-longevidade",
    "saude-coletiva": "saude-coletiva"
  };

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
    return '<span class="op-catpill ' + catClass(categoria) + (extraClass ? " " + extraClass : "") + '">' + esc(cat) + "</span>";
  }

  // Linha de metadado do card: subcategoria (quando existe) + tempo — dá
  // credibilidade editorial mostrando a especialidade real, não só a
  // macro-categoria genérica do pill. Some sozinho se não houver subcategoria.
  function metaHtml(p) {
    var t = timeAgo(p.published_at);
    if (p.subcategoria) return "<time>" + esc(p.subcategoria) + " · " + t + "</time>";
    return "<time>" + t + "</time>";
  }

  function img(p, cls) {
    return p.imagem ? '<div class="' + cls + '"><img src="' + p.imagem + '" alt="" loading="lazy"></div>' : "";
  }

  // ── T1 — TRIO EQUILIBRADO: 3 fotos 4:3 lado a lado ──
  function trioItem(p, showPill) {
    return (
      '<a class="op-featured-item" href="' + p.url + '">' +
      img(p, "op-featured-media") +
      pillHtml(p.categoria, showPill) +
      "<h3>" + esc(p.titulo) + "</h3>" +
      "</a>"
    );
  }
  function blockTrio(items, showPill) {
    return '<div class="op-block op-block-trio">' + items.map(function (p) { return trioItem(p, showPill); }).join("") + "</div>";
  }

  // ── T2 — GRADE MINIÚSCULA: 4 fotos quadradas pequenas ──
  function quadItem(p, showPill) {
    return (
      '<a class="op-quad-item" href="' + p.url + '">' +
      img(p, "op-quad-media") +
      pillHtml(p.categoria, showPill) +
      "<h5>" + esc(p.titulo) + "</h5>" +
      metaHtml(p) +
      "</a>"
    );
  }
  function blockQuad(items, showPill) {
    return '<div class="op-block op-block-quad">' + items.map(function (p) { return quadItem(p, showPill); }).join("") + "</div>";
  }

  // ── T3 — ASSIMÉTRICO: 1 card grande (16:9) + 2 pequenos ao lado ──
  function asymLead(p, showPill) {
    return (
      '<a class="op-asym-lead" href="' + p.url + '">' +
      img(p, "op-asym-media") +
      pillHtml(p.categoria, showPill) +
      "<h2>" + esc(p.titulo) + "</h2>" +
      (p.resumo ? '<p class="op-asym-deck">' + esc(p.resumo).slice(0, 140) + "</p>" : "") +
      metaHtml(p) +
      "</a>"
    );
  }
  function asymSide(p, showPill) {
    return (
      '<a class="op-thumb-item op-asym-side-item" href="' + p.url + '">' +
      '<div class="op-thumb"><img src="' + (p.imagem || "") + '" alt="" loading="lazy"></div>' +
      '<div class="op-thumb-body">' + pillHtml(p.categoria, showPill) + "<h4>" + esc(p.titulo) + "</h4>" +
      metaHtml(p) + "</div>" +
      "</a>"
    );
  }
  function blockAsym(items, showPill) {
    var lead = items[0];
    var side = items.slice(1);
    return (
      '<div class="op-block op-block-asym">' +
      asymLead(lead, showPill) +
      '<div class="op-asym-side">' + side.map(function (p) { return asymSide(p, showPill); }).join("") + "</div>" +
      "</div>"
    );
  }

  // ── T4 — LISTA COM THUMB: linhas verticais, foto pequena à esquerda ──
  function thumbItem(p, showPill) {
    var body = pillHtml(p.categoria, showPill) + "<h4>" + esc(p.titulo) + "</h4>" + metaHtml(p);
    if (p.imagem) {
      return (
        '<a class="op-dense-item op-thumb-item" href="' + p.url + '">' +
        '<div class="op-thumb"><img src="' + p.imagem + '" alt="" loading="lazy"></div>' +
        '<div class="op-thumb-body">' + body + "</div>" +
        "</a>"
      );
    }
    return '<a class="op-dense-item" href="' + p.url + '">' + body + "</a>";
  }
  function blockThumblist(items, showPill) {
    return '<div class="op-block op-block-thumblist">' + items.map(function (p) { return thumbItem(p, showPill); }).join("") + "</div>";
  }

  // ── T5 — DUPLA GRANDE: 2x2, fotos 16:9 maiores ──
  function duoItem(p, showPill) {
    return (
      '<a class="op-duogrid-item" href="' + p.url + '">' +
      img(p, "op-duogrid-media") +
      pillHtml(p.categoria, showPill) +
      "<h4>" + esc(p.titulo) + "</h4>" +
      metaHtml(p) +
      "</a>"
    );
  }
  function blockDuogrid(items, showPill) {
    return '<div class="op-block op-block-duogrid">' + items.map(function (p) { return duoItem(p, showPill); }).join("") + "</div>";
  }

  // ── T6 — SPOTLIGHT ESCURO: 1 card full-width, fundo invertido ──
  function spotlightItem(p, showPill) {
    return (
      '<a class="op-spotlight-card" href="' + p.url + '">' +
      img(p, "op-spotlight-media") +
      '<div class="op-spotlight-overlay">' +
      pillHtml(p.categoria, showPill, "op-catpill-inverse") +
      "<h2>" + esc(p.titulo) + "</h2>" +
      metaHtml(p) +
      "</div></a>"
    );
  }
  function blockSpotlight(items) {
    return '<div class="op-block op-block-spotlight">' + spotlightItem(items[0]) + "</div>";
  }

  // ── T7 — CAIXA DE DESTAQUE: 3 itens SEM foto, barra colorida lateral ──
  function briefItem(p, showPill) {
    return (
      '<a class="op-brief-item" href="' + p.url + '">' +
      pillHtml(p.categoria, showPill) +
      "<h3>" + esc(p.titulo) + "</h3>" +
      metaHtml(p) +
      "</a>"
    );
  }
  function blockBriefs(items, showPill) {
    return '<div class="op-block op-block-briefs">' + items.map(function (p) { return briefItem(p, showPill); }).join("") + "</div>";
  }

  // ── T8 — DUPLA ESCALONADA (masonry): proporções e posições diferentes ──
  function staggerItem(p, cls, mediaCls) {
    return (
      '<a class="op-stagger-item ' + cls + '" href="' + p.url + '">' +
      img(p, mediaCls) +
      "<h3>" + esc(p.titulo) + "</h3>" +
      metaHtml(p) +
      "</a>"
    );
  }
  function blockStagger(items) {
    var a = items[0], b = items[1];
    return (
      '<div class="op-block op-block-stagger">' +
      staggerItem(a, "op-stagger-tall", "op-stagger-media-tall") +
      staggerItem(b, "op-stagger-wide", "op-stagger-media-wide") +
      "</div>"
    );
  }

  var TEMPLATES = [
    { take: 3, min: 3, render: blockTrio },
    { take: 1, min: 1, render: blockSpotlight },
    { take: 4, min: 3, render: blockQuad },
    { take: 3, min: 2, render: blockBriefs },
    { take: 3, min: 2, render: blockAsym },
    { take: 2, min: 2, render: blockStagger },
    { take: 4, min: 3, render: blockThumblist },
    { take: 4, min: 3, render: blockDuogrid }
  ];

  // Retorna {html, nextIndex} — nextIndex é por onde o ciclo de formatos
  // parou, pra paginação continuar de onde ficou em vez de reiniciar do T1.
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
      if (remaining < tpl.min) { tIdx++; continue; }
      var chunk = posts.slice(i, i + tpl.take);
      out.push(tpl.render(chunk, showPill));
      i += chunk.length;
      tIdx++;
    }
    return { html: out.join(""), nextIndex: tIdx };
  }

  window.OpBlocks = { renderBlocks: renderBlocks, esc: esc, timeAgo: timeAgo, pillHtml: pillHtml, CAT_LABEL: CAT_LABEL };
})();
