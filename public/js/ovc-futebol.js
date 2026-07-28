/**
 * ovc-futebol.js — Radar da Bola • Widget independente
 * REGRA ZERO-I: 100% independente — não afeta home.js nem ovc-cards.js
 * Cobre: Brasileirão Série A, Série B, Libertadores, Sul-Americana
 * Injeta bloco Radar da Bola ANTES da .rail-block-tv no rail direito
 */
(function () {
  'use strict';

  var CAT_URL = '/radar-da-bola/';

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function dataBr(iso) {
    try {
      return new Date(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
    } catch (_) { return ''; }
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

  function injetarCSS() {
    if (document.getElementById('ovc-futebol-css')) return;
    var sty = document.createElement('style');
    sty.id = 'ovc-futebol-css';
    sty.textContent = [
      '@keyframes futebol-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}',
      '.ovc-futebol-rail{margin-bottom:18px;border-radius:8px;overflow:hidden;',
      '  border:1.5px solid #dc2626;}',
      '.ovc-futebol-header{background:linear-gradient(135deg,#dc2626 0%,#991b1b 60%,#1e293b 100%);',
      '  padding:12px 14px;position:relative;overflow:hidden;}',
      '.ovc-futebol-header::before{content:"⚽";position:absolute;right:-8px;top:-8px;font-size:52px;opacity:.15;',
      '  transform:rotate(-20deg);}',
      '.ovc-futebol-live-row{display:flex;align-items:center;gap:6px;margin-bottom:4px;}',
      '.ovc-futebol-dot{display:inline-block;width:8px;height:8px;background:#fbbf24;border-radius:50%;',
      '  animation:futebol-pulse 1s ease-in-out infinite;flex-shrink:0;}',
      '.ovc-futebol-live-txt{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#fbbf24;}',
      '.ovc-futebol-title{font-size:14px;font-weight:800;color:#fff;letter-spacing:-.01em;line-height:1.2;}',
      '.ovc-futebol-sub{font-size:10px;color:rgba(255,255,255,.75);margin-top:2px;}',
      '.ovc-futebol-body{background:var(--bg-elevated,#fff);padding:10px 12px;}',
      '.ovc-futebol-article{display:block;padding:9px 0;border-bottom:1px solid var(--border-subtle,#e2e8f0);',
      '  text-decoration:none;transition:padding-left .12s;}',
      '.ovc-futebol-article:last-child{border-bottom:none;}',
      '.ovc-futebol-article:hover{padding-left:4px;}',
      '.ovc-futebol-artitle{font-size:12px;font-weight:600;color:var(--text-main,#0f172a);line-height:1.4;margin-bottom:2px;}',
      '.ovc-futebol-artmeta{font-size:10px;color:#dc2626;font-weight:500;}',
      '.ovc-futebol-cta{display:flex;align-items:center;justify-content:space-between;',
      '  padding:9px 12px;background:#fef2f2;border-top:1px solid #fecaca;',
      '  text-decoration:none;font-size:11px;font-weight:700;color:#991b1b;',
      '  transition:background .15s;}',
      '.ovc-futebol-cta:hover{background:#fee2e2;}',
    ].join('');
    document.head.appendChild(sty);
  }

  function construirBloco(artigos) {
    injetarCSS();

    var bloco = document.createElement('div');
    bloco.className = 'ovc-futebol-rail';
    bloco.id = 'ovc-radar-futebol';

    var header = document.createElement('div');
    header.className = 'ovc-futebol-header';
    header.innerHTML =
      '<div class="ovc-futebol-live-row">' +
      '<span class="ovc-futebol-dot"></span>' +
      '<span class="ovc-futebol-live-txt">⚽ Futebol Nacional e Continental</span>' +
      '</div>' +
      '<div class="ovc-futebol-title">RADAR DA BOLA</div>' +
      '<div class="ovc-futebol-sub">Brasileirão Série A · Série B · Libertadores · Sul-Americana</div>';
    bloco.appendChild(header);

    var body = document.createElement('div');
    body.className = 'ovc-futebol-body';

    if (artigos.length) {
      artigos.slice(0, 5).forEach(function (p) {
        var a = document.createElement('a');
        a.className = 'ovc-futebol-article';
        a.href = buildHref(p);
        a.innerHTML =
          '<div class="ovc-futebol-artitle">' + esc(p.titulo) + '</div>' +
          '<div class="ovc-futebol-artmeta">⚽ Esportes OVC · ' + dataBr(p.published_at || p.data || p.created_at) + '</div>';
        body.appendChild(a);
      });
    } else {
      body.innerHTML = '<p style="font-size:12px;color:#64748b;margin:0;padding:4px 0;">Cobertura do futebol chegando em breve.</p>';
    }

    bloco.appendChild(body);

    var cta = document.createElement('a');
    cta.href = CAT_URL;
    cta.className = 'ovc-futebol-cta';
    cta.innerHTML = '⚽ Radar da Bola: tabelas e jogos ao vivo <span>→</span>';
    bloco.appendChild(cta);

    return bloco;
  }

  function injetar(artigos) {
    var rail = document.querySelector('.rail-right');
    if (!rail) return;
    var tvBlock = rail.querySelector('.rail-block-tv');
    var bloco = construirBloco(artigos);
    if (tvBlock) {
      rail.insertBefore(bloco, tvBlock);
    } else {
      rail.insertBefore(bloco, rail.firstChild);
    }
  }

  var FUTEBOL_KEYWORDS = [
    'campeonato brasileiro','brasileirão','brasileirao','série a','serie a','série b','serie b',
    'libertadores','sul-americana','sulamericana','copa sul-americana','copa libertadores',
    'rodada do brasileirão','tabela do brasileirão','artilheiro do brasileirão'
  ];

  function init() {
    Promise.all([
      fetch('/api/portal-posts?curtinhas=true&categoria=esportes&limit=30').then(function(r){ return r.json(); }).catch(function(){ return {curtinhas:[]}; }),
      fetch('/api/portal-posts?recentes=true&limit=300').then(function(r){ return r.json(); }).catch(function(){ return {posts:[]}; })
    ]).then(function(results) {
      var todosCurtinhas = results[0].curtinhas || [];
      var todosArtigos   = results[1].posts    || [];

      var futebolCurtinhas = todosCurtinhas.filter(function(n) {
        var tipo = n.tipo_conteudo || n.tipo || '';
        if (tipo !== 'radar' && tipo !== 'pilula' && tipo !== 'micropilula') return false;
        var t = (n.titulo || '').toLowerCase();
        return FUTEBOL_KEYWORDS.some(function(kw) { return t.indexOf(kw) >= 0; });
      });

      var idsCurtinhas = {};
      futebolCurtinhas.forEach(function(n){ idsCurtinhas[n.id] = true; });
      var artigosNormais = todosArtigos.filter(function(p) {
        if (idsCurtinhas[p.id]) return false;
        var titulo = (p.titulo || '').toLowerCase();
        return FUTEBOL_KEYWORDS.some(function(kw) { return titulo.indexOf(kw) >= 0; });
      });

      var artigos = futebolCurtinhas.concat(artigosNormais).slice(0, 5);
      injetar(artigos);
    }).catch(function() {
      injetar([]);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
