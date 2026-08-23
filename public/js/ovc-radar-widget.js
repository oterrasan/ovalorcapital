/**
 * ovc-radar-widget.js — Listagem completa do Radar do Futebol (/radar-da-bola/)
 * REGRA ZERO-I: 100% independente — não toca internal-page-v2.js nem home.js.
 *
 * SISTEMA DE CURTINHAS DELETADO — 23/08/2026, Roberto: "TODAS AS CURTINHAS,
 * PILULAS E O CARALHO A QUATRO" + "O RADAR DOS ESPORTES DEVERIAM SER MATERIAS
 * COMPLETAS E COM IMAGENS, RASPADAS DE FONTES CONFIAVEIS". autoFutebolCurtinhas()
 * (api/run_portal.js) agora grava matéria PADRÃO completa (tipo_conteudo="padrao",
 * subcategoria="Futebol") em vez do antigo tipo_conteudo="radar" — este widget
 * passou a consumir ?recentes=true (mesmo endpoint normal de artigos do portal,
 * usado por handleRecentes()) filtrado por categoria=esportes + palavra-chave de
 * futebol, mesmo padrão já usado pelos outros widgets de esporte
 * (ovc-radar-motor.js, ovc-radar-mma.js, ovc-torneio-espn.js etc — todos já
 * combinavam recentes+curtinhas antes, só perderam a metade curtinhas agora).
 *
 * Visual "espetacular" (04/08/2026): dark carbon + destaque em pôster de manchete,
 * mesma linguagem do piloto do Motor/F1 e do ovc-torneio-espn.js.
 * Config via atributos data-* no elemento alvo:
 *   data-categoria — filtra por categoria (opcional, ex: "esportes")
 */
(function () {
  'use strict';

  var REFRESH_MS = 120000; // reconsulta a cada 2min
  var ACC = '#16a34a';

  var FUTEBOL_KW = [
    'futebol', 'campeonato brasileiro', 'brasileirão', 'brasileirao', 'série a', 'serie a',
    'série b', 'serie b', 'libertadores', 'sul-americana', 'sulamericana',
    'copa sul-americana', 'copa libertadores', 'copa do mundo', 'world cup', 'mundial 2026',
    'fifa', 'seleção brasileira', 'selecao brasileira', 'champions league', 'liga dos campeões',
    'liga dos campeoes', 'premier league', 'la liga', 'bundesliga', 'calcio', 'ligue 1',
    'mercado da bola', 'janela de transferências', 'janela de transferencias'
  ];
  function kwMatch(text, kw) {
    var esc2 = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(?:^|[^\\p{L}\\p{N}])' + esc2 + '(?:[^\\p{L}\\p{N}]|$)', 'iu').test(text);
  }
  function ehFutebol(p) {
    var t = ((p.titulo || '') + ' ' + (p.resumo || p.comentario_fixado || '')).toLowerCase();
    return FUTEBOL_KW.some(function (kw) { return kwMatch(t, kw); });
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function dataCurta(dt) {
    try { return new Date(dt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch (_) { return ''; }
  }

  function minutosAtras(dt) {
    try {
      var diff = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
      if (diff < 1) return 'agora mesmo';
      if (diff === 1) return 'há 1 minuto';
      if (diff < 60) return 'há ' + diff + ' minutos';
      return dataCurta(dt);
    } catch (_) { return ''; }
  }

  function injetarCSS() {
    if (document.getElementById('ovc-rdr-css')) return;
    var sty = document.createElement('style');
    sty.id = 'ovc-rdr-css';
    sty.textContent = [
      '@keyframes rdr-sweep{0%{transform:translateX(-140%) skewX(-18deg)}100%{transform:translateX(260%) skewX(-18deg)}}',
      '@keyframes rdr-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.8)}}',
      '.ovc-rdr-wrap{margin:18px 0;}',
      '.ovc-rdr-trust{font-size:11px;color:var(--text-soft,#64748b);margin:0 0 14px;display:flex;align-items:center;gap:6px;font-weight:700;',
        'text-transform:uppercase;letter-spacing:.06em;}',
      '.ovc-rdr-trust b{color:' + ACC + ';font-size:14px;}',

      '.ovc-rdr-hero{display:block;position:relative;overflow:hidden;border-radius:14px;margin-bottom:18px;',
        'background:#0b0e14;box-shadow:0 20px 50px -20px rgba(0,0,0,.55);border:1px solid #1a2e22;text-decoration:none;',
        'transition:transform .15s,box-shadow .15s;}',
      '.ovc-rdr-hero:hover{transform:translateY(-2px);box-shadow:0 24px 60px -18px rgba(0,0,0,.65);}',
      '.ovc-rdr-hero-tex{position:absolute;inset:0;background:repeating-linear-gradient(120deg,#0b0e14 0 26px,#0a140f 26px 52px);pointer-events:none;}',
      '.ovc-rdr-hero-stripe{position:absolute;top:0;right:-8%;width:55%;height:100%;',
        'background:linear-gradient(100deg,transparent 0%,' + ACC + '33 45%,transparent 70%);pointer-events:none;}',
      '.ovc-rdr-hero-sweep{position:absolute;top:0;left:0;width:22%;height:100%;',
        'background:linear-gradient(100deg,transparent,rgba(255,255,255,.09),transparent);',
        'animation:rdr-sweep 5.5s ease-in-out infinite;pointer-events:none;}',
      '.ovc-rdr-hero-inner{position:relative;padding:26px 26px 24px;}',
      '.ovc-rdr-hero-badge{display:inline-flex;align-items:center;gap:7px;font-size:10.5px;font-weight:800;',
        'color:#fbbf24;text-transform:uppercase;letter-spacing:.14em;margin-bottom:14px;}',
      '.ovc-rdr-dot{width:9px;height:9px;border-radius:50%;background:#fbbf24;display:inline-block;',
        'animation:rdr-pulse 1.1s ease-in-out infinite;box-shadow:0 0 10px 2px rgba(251,191,36,.5);flex-shrink:0;}',
      '.ovc-rdr-hero-title{font-size:23px;font-weight:900;color:#fff;letter-spacing:-.02em;line-height:1.18;',
        'font-style:italic;margin-bottom:10px;}',
      '.ovc-rdr-hero-resumo{font-size:13.5px;color:rgba(255,255,255,.68);line-height:1.62;max-width:680px;margin-bottom:12px;}',
      '.ovc-rdr-hero-time{font-size:11px;color:rgba(255,255,255,.4);font-weight:700;text-transform:uppercase;letter-spacing:.05em;}',

      '.ovc-rdr-list{display:flex;flex-direction:column;gap:0;border-radius:12px;overflow:hidden;background:#0b0e14;',
        'border:1px solid #1f2430;}',
      '.ovc-rdr-item{display:flex;gap:14px;align-items:flex-start;padding:14px 18px;text-decoration:none;',
        'border-bottom:1px solid #1a1f2c;transition:background .12s,padding-left .12s;border-left:3px solid transparent;}',
      '.ovc-rdr-item:last-child{border-bottom:none;}',
      '.ovc-rdr-item:hover{background:#12161f;padding-left:22px;border-left-color:' + ACC + ';}',
      '.ovc-rdr-item-time{font-size:10px;color:' + ACC + ';font-weight:800;white-space:nowrap;padding-top:2px;',
        'min-width:82px;text-transform:uppercase;letter-spacing:.03em;}',
      '.ovc-rdr-item-body{flex:1;min-width:0;}',
      '.ovc-rdr-item-title{font-size:13.5px;font-weight:700;color:#e2e8f0;line-height:1.4;}',
      '.ovc-rdr-item-resumo{font-size:12px;color:rgba(255,255,255,.45);line-height:1.5;margin-top:3px;}',
      '.ovc-rdr-empty{padding:26px 14px;text-align:center;color:var(--text-soft,#94a3b8);font-size:13px;',
        'border:1px dashed var(--border-subtle,#e5e7eb);border-radius:10px;}',
      '.ovc-rdr-section-title{font-size:11px;font-weight:800;color:var(--text-main,#0f172a);margin:20px 0 10px;',
        'text-transform:uppercase;letter-spacing:.08em;}',
    ].join('');
    document.head.appendChild(sty);
  }

  function buildHref(p) {
    return p.url || ('/' + (p.categoria || 'esportes') + '/');
  }

  function renderFeatured(p) {
    return '<a class="ovc-rdr-hero" href="' + esc(buildHref(p)) + '">' +
      '<div class="ovc-rdr-hero-tex"></div><div class="ovc-rdr-hero-stripe"></div><div class="ovc-rdr-hero-sweep"></div>' +
      '<div class="ovc-rdr-hero-inner">' +
      '<span class="ovc-rdr-hero-badge"><span class="ovc-rdr-dot"></span>Radar OVC · ' + esc(minutosAtras(p.data)) + '</span>' +
      '<div class="ovc-rdr-hero-title">' + esc(p.titulo) + '</div>' +
      '<div class="ovc-rdr-hero-resumo">' + esc(p.resumo || p.comentario_fixado || '') + '</div>' +
      '<div class="ovc-rdr-hero-time">Grande repercussão · Futebol</div>' +
      '</div></a>';
  }

  function renderItem(p) {
    return '<a class="ovc-rdr-item" href="' + esc(buildHref(p)) + '">' +
      '<span class="ovc-rdr-item-time">' + esc(minutosAtras(p.data)) + '</span>' +
      '<span class="ovc-rdr-item-body">' +
        '<span class="ovc-rdr-item-title">' + esc(p.titulo) + '</span>' +
        '<span class="ovc-rdr-item-resumo">' + esc(p.resumo || p.comentario_fixado || '') + '</span>' +
      '</span></a>';
  }

  function montar(alvo, lista) {
    injetarCSS();
    if (!lista.length) {
      alvo.innerHTML = '<div class="ovc-rdr-wrap"><div class="ovc-rdr-empty">Nenhum Radar OVC publicado nas últimas horas. Volte em instantes.</div></div>';
      return;
    }
    var featured = lista[0];
    var resto = lista.slice(1, 30);
    var html = '<div class="ovc-rdr-wrap">' +
      '<div class="ovc-rdr-trust"><b>&#9679;</b> Grande repercussão do futebol nacional e continental, em ordem cronológica</div>' +
      renderFeatured(featured);
    if (resto.length) {
      html += '<div class="ovc-rdr-section-title">Últimos registros</div>' +
        '<div class="ovc-rdr-list">' + resto.map(renderItem).join('') + '</div>';
    }
    html += '</div>';
    alvo.innerHTML = html;
  }

  function carregar(alvo, categoria) {
    fetch('/api/portal-posts?recentes=true&limit=300')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var lista = (d.posts || []).filter(function (p) {
          if (categoria && p.categoria !== categoria) return false;
          return ehFutebol(p);
        });
        montar(alvo, lista);
      })
      .catch(function () { montar(alvo, []); });
  }

  function init() {
    var alvo = document.getElementById('ovc-radar-dash');
    if (!alvo) return;
    var categoria = (alvo.getAttribute('data-categoria') || '').trim().toLowerCase();
    alvo.innerHTML = '<div class="ovc-rdr-wrap"><div class="ovc-rdr-empty">Carregando…</div></div>';
    carregar(alvo, categoria);
    setInterval(function () { carregar(alvo, categoria); }, REFRESH_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
