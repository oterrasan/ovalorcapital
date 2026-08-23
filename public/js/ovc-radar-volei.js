/**
 * ovc-radar-volei.js — Cobertura editorial de Vôlei (sem dados ao vivo)
 * REGRA ZERO-I: 100% independente — não toca internal-page-v2.js nem home.js
 *
 * Diferente dos radares de Basquete/NFL/Motor/Tênis/MMA: a ESPN não tem
 * cobertura estruturada (scoreboard/standings) da Superliga Brasileira nem
 * da FIVB Volleyball Nations League — só de vôlei universitário americano
 * (NCAA), irrelevante para o público do OVC. Em vez de inventar placares
 * ou tabelas com uma fonte que não cobre o esporte relevante aqui, esta
 * página segue o mesmo padrão do Mercado da Bola: feed editorial filtrado
 * por keywords do próprio banco de artigos do portal, sem placar/tabela.
 * Visual "espetacular" (04/08/2026): header dark com identidade de quadra/
 * areia, mesma linguagem do piloto do Motor/F1 e dos demais radares.
 */
(function () {
  'use strict';

  function kwMatch(text, kw) {
    var esc = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(?:^|[^\\p{L}\\p{N}])' + esc + '(?:[^\\p{L}\\p{N}]|$)', 'iu').test(text);
  }

  var CFG = window.OVC_VOLEI;
  if (!CFG) return;

  var ACC = CFG.cor || '#f97316';
  var ACC_DARK = CFG.corDark || '#0b0e14';

  var KEYWORDS = CFG.keywords || [
    'vôlei', 'volei', 'superliga', 'superliga de vôlei', 'superliga de volei',
    'seleção brasileira de vôlei', 'selecao brasileira de volei', 'cbv',
    'fivb', 'liga das nações de vôlei', 'liga das nacoes de volei', 'volleyball nations league',
    'vôlei de praia', 'volei de praia', 'vôlei feminino', 'volei feminino', 'vôlei masculino', 'volei masculino'
  ];

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function slugify(s) {
    return String(s||'').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g,'')
      .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55);
  }
  function buildHref(p) {
    var cat = p.categoria || 'esportes';
    return '/' + cat + '/' + slugify(p.titulo) + '-' + String(p.id||'').slice(0,8) + '/';
  }
  function dataCurta(dt) {
    try { return new Date(dt).toLocaleDateString('pt-BR', { day:'2-digit', month:'short' }); }
    catch (_) { return ''; }
  }
  function imgOk(url) {
    return url && !/placeholder|default-og|og-default/i.test(url);
  }

  function injetarCSS() {
    if (document.getElementById('ovc-vly-css')) return;
    var sty = document.createElement('style');
    sty.id = 'ovc-vly-css';
    sty.textContent = [
      '@keyframes vly-sweep{0%{transform:translateX(-140%) skewX(-18deg)}100%{transform:translateX(260%) skewX(-18deg)}}',
      '@keyframes vly-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.8)}}',
      '.ovc-vly-wrap{margin:18px 0;border-radius:14px;overflow:hidden;background:#0b0e14;',
        'box-shadow:0 20px 50px -20px rgba(0,0,0,.55);border:1px solid #2a1c0e;}',
      '.ovc-vly-hd{position:relative;overflow:hidden;padding:22px 22px 18px;',
        'background:repeating-linear-gradient(120deg,' + ACC_DARK + ' 0 26px,#1a1206 26px 52px);}',
      '.ovc-vly-stripe{position:absolute;top:0;right:-8%;width:55%;height:100%;',
        'background:linear-gradient(100deg,transparent 0%,' + ACC + '33 45%,transparent 70%);pointer-events:none;}',
      '.ovc-vly-sweep{position:absolute;top:0;left:0;width:22%;height:100%;',
        'background:linear-gradient(100deg,transparent,rgba(255,255,255,.09),transparent);',
        'animation:vly-sweep 5.5s ease-in-out infinite;pointer-events:none;}',
      '.ovc-vly-hd-live{display:flex;align-items:center;gap:7px;margin-bottom:8px;position:relative;}',
      '.ovc-vly-dot{width:9px;height:9px;background:' + ACC + ';border-radius:50%;animation:vly-pulse 1.1s ease-in-out infinite;flex-shrink:0;box-shadow:0 0 10px 2px ' + ACC + '80;}',
      '.ovc-vly-hd-txt{font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:' + ACC + ';}',
      '.ovc-vly-hd-title{font-size:23px;font-weight:900;color:#fff;letter-spacing:-.02em;line-height:1.1;font-style:italic;position:relative;}',
      '.ovc-vly-hd-sobre{font-size:12px;color:rgba(255,255,255,.65);margin-top:8px;line-height:1.55;max-width:620px;position:relative;}',
      '.ovc-vly-body{background:#0b0e14;padding:18px;}',
      '.ovc-vly-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;}',
      '.ovc-vly-card{display:flex;flex-direction:column;border:1px solid #201607;border-radius:10px;overflow:hidden;',
        'text-decoration:none;background:#14100a;transition:transform .15s,box-shadow .15s,border-color .15s;}',
      '.ovc-vly-card:hover{transform:translateY(-3px);box-shadow:0 10px 24px -8px rgba(0,0,0,.5);border-color:' + ACC + ';}',
      '.ovc-vly-card-img{width:100%;height:130px;object-fit:cover;background:#1a1206;}',
      '.ovc-vly-card-body{padding:12px 14px;display:flex;flex-direction:column;gap:6px;flex:1;}',
      '.ovc-vly-card-badge{font-size:9px;font-weight:800;color:' + ACC + ';text-transform:uppercase;letter-spacing:.07em;}',
      '.ovc-vly-card-title{font-size:13px;font-weight:700;color:#e2e8f0;line-height:1.4;}',
      '.ovc-vly-card-date{font-size:10.5px;color:rgba(255,255,255,.4);margin-top:auto;}',
      '.ovc-vly-empty{padding:26px 14px;text-align:center;color:rgba(255,255,255,.4);font-size:13px;}',
    ].join('');
    document.head.appendChild(sty);
  }

  function filtrar(lista) {
    var vistos = {};
    return lista.filter(function (p) {
      if (vistos[p.id]) return false;
      if (p.categoria && p.categoria !== 'esportes') return false;
      // resumo = campo das curtinhas, comentario_fixado = campo das matérias normais
      var t = ((p.titulo || '') + ' ' + (p.resumo || p.comentario_fixado || '')).toLowerCase();
      var ok = KEYWORDS.some(function (k) { return kwMatch(t, k); });
      if (ok) vistos[p.id] = true;
      return ok;
    });
  }

  function renderCard(p) {
    var img = imgOk(p.imagem)
      ? '<img class="ovc-vly-card-img" src="' + esc(p.imagem) + '" alt="" loading="lazy">'
      : '';
    return '<a class="ovc-vly-card" href="' + buildHref(p) + '">' +
      img +
      '<div class="ovc-vly-card-body">' +
      '<span class="ovc-vly-card-badge">🏐 Vôlei</span>' +
      '<span class="ovc-vly-card-title">' + esc(p.titulo) + '</span>' +
      '<span class="ovc-vly-card-date">' + dataCurta(p.data || p.published_at || p.created_at) + '</span>' +
      '</div></a>';
  }

  function montar(artigos) {
    injetarCSS();
    var alvo = document.getElementById('ovc-volei-dash');
    if (!alvo) return;
    var corpo = artigos.length
      ? '<div class="ovc-vly-grid">' + artigos.slice(0, 24).map(renderCard).join('') + '</div>'
      : '<div class="ovc-vly-empty">Cobertura de vôlei chegando em breve.</div>';
    alvo.innerHTML = '<div class="ovc-vly-wrap">' +
      '<div class="ovc-vly-hd"><div class="ovc-vly-stripe"></div><div class="ovc-vly-sweep"></div>' +
      '<div class="ovc-vly-hd-live"><span class="ovc-vly-dot"></span><span class="ovc-vly-hd-txt">Cobertura editorial · OVC</span></div>' +
      '<div class="ovc-vly-hd-title">' + esc(CFG.nome || 'Vôlei') + '</div>' +
      '<div class="ovc-vly-hd-sobre">Superliga Brasileira, Seleção Brasileira e Liga das Nações — cobertura baseada nas fontes jornalísticas verificadas do OVC.</div>' +
      '</div>' +
      '<div class="ovc-vly-body">' + corpo + '</div>' +
      '</div>';
  }

  function init() {
    var alvo = document.getElementById('ovc-volei-dash');
    if (!alvo) return;
    alvo.innerHTML = '<div class="ovc-vly-wrap"><div class="ovc-vly-body"><div class="ovc-vly-empty">Carregando…</div></div></div>';

    fetch('/api/portal-posts?recentes=true&limit=300').then(function (r) { return r.json(); }).then(function (d) {
      montar(filtrar(d.posts || []));
    }).catch(function () { montar([]); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
