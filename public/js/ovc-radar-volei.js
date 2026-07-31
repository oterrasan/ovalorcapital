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
      '.ovc-vly-wrap{margin:18px 0;}',
      '.ovc-vly-trust{font-size:11.5px;color:#64748b;margin:0 0 16px;display:flex;align-items:center;gap:6px;font-weight:600;}',
      '.ovc-vly-trust b{color:' + ACC + ';}',
      '.ovc-vly-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;}',
      '.ovc-vly-card{display:flex;flex-direction:column;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;text-decoration:none;background:#fff;transition:transform .15s,box-shadow .15s;}',
      '.ovc-vly-card:hover{transform:translateY(-3px);box-shadow:0 8px 18px rgba(0,0,0,.1);}',
      '.ovc-vly-card-img{width:100%;height:140px;object-fit:cover;background:#f3f4f6;}',
      '.ovc-vly-card-body{padding:12px 14px;display:flex;flex-direction:column;gap:6px;flex:1;}',
      '.ovc-vly-card-badge{font-size:9px;font-weight:800;color:' + ACC + ';text-transform:uppercase;letter-spacing:.07em;}',
      '.ovc-vly-card-title{font-size:13.5px;font-weight:700;color:var(--text-main,#0f172a);line-height:1.4;}',
      '.ovc-vly-card-date{font-size:10.5px;color:#94a3b8;margin-top:auto;}',
      '.ovc-vly-empty{padding:26px 14px;text-align:center;color:#94a3b8;font-size:13px;border:1px dashed #e5e7eb;border-radius:10px;}',
    ].join('');
    document.head.appendChild(sty);
  }

  function filtrar(lista) {
    var vistos = {};
    return lista.filter(function (p) {
      if (vistos[p.id]) return false;
      if (p.categoria && p.categoria !== 'esportes') return false;
      var t = ((p.titulo || '') + ' ' + (p.comentario_fixado || '')).toLowerCase();
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
    if (!artigos.length) {
      alvo.innerHTML = '<div class="ovc-vly-wrap"><div class="ovc-vly-empty">Cobertura de vôlei chegando em breve.</div></div>';
      return;
    }
    alvo.innerHTML = '<div class="ovc-vly-wrap">' +
      '<div class="ovc-vly-trust"><b>✓</b> Cobertura editorial baseada nas fontes jornalísticas verificadas do OVC</div>' +
      '<div class="ovc-vly-grid">' + artigos.slice(0, 24).map(renderCard).join('') + '</div>' +
      '</div>';
  }

  function init() {
    var alvo = document.getElementById('ovc-volei-dash');
    if (!alvo) return;
    alvo.innerHTML = '<div class="ovc-vly-wrap"><div class="ovc-vly-empty">Carregando…</div></div>';

    Promise.all([
      fetch('/api/portal-posts?curtinhas=true&categoria=esportes&limit=30').then(function (r) { return r.json(); }).catch(function () { return { curtinhas: [] }; }),
      fetch('/api/portal-posts?recentes=true&limit=300').then(function (r) { return r.json(); }).catch(function () { return { posts: [] }; })
    ]).then(function (results) {
      var todos = (results[0].curtinhas || []).concat(results[1].posts || []);
      montar(filtrar(todos));
    }).catch(function () { montar([]); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
