/**
 * ovc-radar-esporte.js — Radar do Esporte • Widget independente
 * REGRA ZERO-I: 100% independente — não afeta home.js nem ovc-cards.js
 * Substitui o antigo "Radar do Futebol" (ovc-futebol.js) — agora cobre
 * TODAS as subcategorias oficiais de esportes (admin/index.html SUBCATS.esportes):
 * Futebol, Basquete, Motor, Tênis, MMA, Vôlei, NFL — divididas em abas.
 * Injeta bloco no TOPO do rail direito (.rail-right) — tem prioridade
 * sobre o Radar da Copa (ovc-copa.js).
 */
(function () {
  'use strict';

  function kwMatch(text, kw) {
    var esc = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(?:^|[^\\p{L}\\p{N}])' + esc + '(?:[^\\p{L}\\p{N}]|$)', 'iu').test(text);
  }

  var CAT_URL = '/esportes/';

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

  // Ordem = prioridade de classificação quando um artigo bate em mais de um esporte.
  // Rótulos batem exatamente com admin/index.html SUBCATS.esportes (sem "Geral").
  var SPORTS = [
    { key:'futebol',  label:'Futebol',  emoji:'⚽',
      keywords:['campeonato brasileiro','brasileirão','brasileirao','série a','serie a','série b','serie b',
        'libertadores','sul-americana','sulamericana','copa sul-americana','copa libertadores',
        'copa do mundo','seleção brasileira','fifa','mundial','champions league','liga dos campeões',
        'premier league','la liga','bundesliga','calcio','ligue 1'] },
    { key:'basquete',  label:'Basquete', emoji:'🏀', keywords:['nba','nbb','basquete','basketball'] },
    { key:'motor',     label:'Motor',    emoji:'🏎️',
      keywords:['fórmula 1','formula 1','f1','grande prêmio','grande premio','gp de','stock car','motogp','indycar','automobilismo'] },
    { key:'tenis',     label:'Tênis',    emoji:'🎾',
      keywords:['tênis','tenis','atp','wta','wimbledon','roland garros','australian open','us open de tênis','grand slam'] },
    { key:'mma',       label:'MMA',      emoji:'🥊', keywords:['mma','ufc','octógono','octogono','artes marciais mistas'] },
    { key:'volei',     label:'Vôlei',    emoji:'🏐', keywords:['vôlei','volei','superliga','fivb','vôlei de praia','volei de praia'] },
    { key:'nfl',       label:'NFL',      emoji:'🏈', keywords:['nfl','super bowl','futebol americano'] }
  ];
  var LABEL_TO_KEY = {};
  SPORTS.forEach(function(s){ LABEL_TO_KEY[s.label.toLowerCase()] = s.key; });

  function classificar(texto, subcategoria) {
    var subKey = LABEL_TO_KEY[String(subcategoria || '').trim().toLowerCase()];
    if (subKey) return subKey;
    for (var i = 0; i < SPORTS.length; i++) {
      if (SPORTS[i].keywords.some(function (kw) { return kwMatch(texto, kw); })) return SPORTS[i].key;
    }
    return null;
  }

  function injetarCSS() {
    if (document.getElementById('ovc-esporte-css')) return;
    var sty = document.createElement('style');
    sty.id = 'ovc-esporte-css';
    sty.textContent = [
      '@keyframes esporte-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}',
      '.ovc-esporte-rail{margin-bottom:18px;border-radius:8px;overflow:hidden;',
      '  border:1.5px solid #dc2626;}',
      '.ovc-esporte-header{background:linear-gradient(135deg,#dc2626 0%,#991b1b 60%,#1e293b 100%);',
      '  padding:12px 14px;position:relative;overflow:hidden;}',
      '.ovc-esporte-header::before{content:"🏆";position:absolute;right:-8px;top:-8px;font-size:52px;opacity:.15;',
      '  transform:rotate(-20deg);}',
      '.ovc-esporte-live-row{display:flex;align-items:center;gap:6px;margin-bottom:4px;}',
      '.ovc-esporte-dot{display:inline-block;width:8px;height:8px;background:#fbbf24;border-radius:50%;',
      '  animation:esporte-pulse 1s ease-in-out infinite;flex-shrink:0;}',
      '.ovc-esporte-live-txt{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#fbbf24;}',
      '.ovc-esporte-title{font-size:14px;font-weight:800;color:#fff;letter-spacing:-.01em;line-height:1.2;}',
      '.ovc-esporte-sub{font-size:10px;color:rgba(255,255,255,.75);margin-top:2px;}',
      '.ovc-esporte-tabs{display:flex;flex-wrap:wrap;gap:4px;padding:8px 10px;background:var(--bg-elevated,#fff);',
      '  border-bottom:1px solid var(--border-subtle,#e2e8f0);}',
      '.ovc-esporte-tab{border:1px solid var(--border-subtle,#e2e8f0);background:transparent;border-radius:999px;',
      '  padding:4px 9px;font-size:10px;font-weight:700;color:var(--text-soft,#475569);cursor:pointer;',
      '  display:inline-flex;align-items:center;gap:4px;transition:all .12s;}',
      '.ovc-esporte-tab:hover{border-color:#dc2626;color:#dc2626;}',
      '.ovc-esporte-tab.active{background:#dc2626;border-color:#dc2626;color:#fff;}',
      '.ovc-esporte-body{background:var(--bg-elevated,#fff);padding:10px 12px;}',
      '.ovc-esporte-article{display:block;padding:9px 0;border-bottom:1px solid var(--border-subtle,#e2e8f0);',
      '  text-decoration:none;transition:padding-left .12s;}',
      '.ovc-esporte-article:last-child{border-bottom:none;}',
      '.ovc-esporte-article:hover{padding-left:4px;}',
      '.ovc-esporte-artitle{font-size:12px;font-weight:600;color:var(--text-main,#0f172a);line-height:1.4;margin-bottom:2px;}',
      '.ovc-esporte-artmeta{font-size:10px;color:#dc2626;font-weight:500;}',
      '.ovc-esporte-cta{display:flex;align-items:center;justify-content:space-between;',
      '  padding:9px 12px;background:#fef2f2;border-top:1px solid #fecaca;',
      '  text-decoration:none;font-size:11px;font-weight:700;color:#991b1b;',
      '  transition:background .15s;}',
      '.ovc-esporte-cta:hover{background:#fee2e2;}',
    ].join('');
    document.head.appendChild(sty);
  }

  function renderBody(body, artigos) {
    body.innerHTML = '';
    if (!artigos.length) {
      body.innerHTML = '<p style="font-size:12px;color:#64748b;margin:0;padding:4px 0;">Cobertura chegando em breve.</p>';
      return;
    }
    artigos.slice(0, 5).forEach(function (p) {
      var a = document.createElement('a');
      a.className = 'ovc-esporte-article';
      a.href = buildHref(p);
      a.innerHTML =
        '<div class="ovc-esporte-artitle">' + esc(p.titulo) + '</div>' +
        '<div class="ovc-esporte-artmeta">🏆 Esportes OVC · ' + dataBr(p.published_at || p.data || p.created_at) + '</div>';
      body.appendChild(a);
    });
  }

  function construirBloco(porEsporte) {
    injetarCSS();

    var bloco = document.createElement('div');
    bloco.className = 'ovc-esporte-rail';
    bloco.id = 'ovc-radar-esporte'; // ovc-copa.js ancora nele para entrar logo depois

    var header = document.createElement('div');
    header.className = 'ovc-esporte-header';
    header.innerHTML =
      '<div class="ovc-esporte-live-row">' +
      '<span class="ovc-esporte-dot"></span>' +
      '<span class="ovc-esporte-live-txt">🏆 Todos os Esportes</span>' +
      '</div>' +
      '<div class="ovc-esporte-title">RADAR DO ESPORTE</div>' +
      '<div class="ovc-esporte-sub">Futebol · Basquete · Motor · Tênis · MMA · Vôlei · NFL</div>';
    bloco.appendChild(header);

    var disponiveis = SPORTS.filter(function (s) { return (porEsporte[s.key] || []).length > 0; });

    if (!disponiveis.length) {
      var body0 = document.createElement('div');
      body0.className = 'ovc-esporte-body';
      renderBody(body0, []);
      bloco.appendChild(body0);
    } else {
      var tabs = document.createElement('div');
      tabs.className = 'ovc-esporte-tabs';
      var body = document.createElement('div');
      body.className = 'ovc-esporte-body';

      disponiveis.forEach(function (s, idx) {
        var tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'ovc-esporte-tab' + (idx === 0 ? ' active' : '');
        tab.innerHTML = '<span>' + s.emoji + '</span><span>' + esc(s.label) + '</span>';
        tab.addEventListener('click', function () {
          Array.prototype.forEach.call(tabs.children, function (t) { t.classList.remove('active'); });
          tab.classList.add('active');
          renderBody(body, porEsporte[s.key] || []);
        });
        tabs.appendChild(tab);
      });

      bloco.appendChild(tabs);
      renderBody(body, porEsporte[disponiveis[0].key] || []);
      bloco.appendChild(body);
    }

    var cta = document.createElement('a');
    cta.href = CAT_URL;
    cta.className = 'ovc-esporte-cta';
    cta.innerHTML = '🏆 Ver todos os esportes <span>→</span>';
    bloco.appendChild(cta);

    return bloco;
  }

  function injetar(porEsporte) {
    var rail = document.querySelector('.rail-right');
    if (!rail) return;
    var bloco = construirBloco(porEsporte);
    rail.insertBefore(bloco, rail.firstChild);
  }

  function init() {
    Promise.all([
      fetch('/api/portal-posts?curtinhas=true&categoria=esportes&limit=60').then(function(r){ return r.json(); }).catch(function(){ return {curtinhas:[]}; }),
      fetch('/api/portal-posts?recentes=true&limit=300').then(function(r){ return r.json(); }).catch(function(){ return {posts:[]}; })
    ]).then(function(results) {
      var todosCurtinhas = results[0].curtinhas || [];
      var todosArtigos   = results[1].posts    || [];

      var porEsporte = {};
      SPORTS.forEach(function (s) { porEsporte[s.key] = []; });
      var idsUsados = {};

      todosCurtinhas.forEach(function (n) {
        var tipo = n.tipo_conteudo || n.tipo || '';
        if (tipo !== 'radar' && tipo !== 'pilula' && tipo !== 'micropilula') return;
        var texto = ((n.titulo || '') + ' ' + (n.resumo || '')).toLowerCase();
        var key = classificar(texto, n.subcategoria);
        if (!key) return;
        porEsporte[key].push(n);
        idsUsados[n.id] = true;
      });

      todosArtigos.forEach(function (p) {
        if (idsUsados[p.id]) return;
        if (p.categoria !== 'esportes') return;
        var texto = ((p.titulo || '') + ' ' + (p.comentario_fixado || '')).toLowerCase();
        var key = classificar(texto, p.subcategoria);
        if (!key) return;
        porEsporte[key].push(p);
      });

      injetar(porEsporte);
    }).catch(function() {
      var vazio = {};
      SPORTS.forEach(function (s) { vazio[s.key] = []; });
      injetar(vazio);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
