/**
 * ovc-radar-esporte.js — Radar do Esporte • Widget independente
 * REGRA ZERO-I: 100% independente — não toca em home.js, ovc-cards.js nem em
 * internal-page-v2.js (lido só via polling defensivo, mesmo padrão já usado
 * por ovc-interruptor-artigo.js — internal-page-v2.js é "EXTREMAMENTE FRÁGIL"
 * e muito assíncrono: nunca alterado por este arquivo).
 *
 * 16/11/2026 — Roberto: "remova o radar do esporte da home e concentre tudo
 * o que existe nele, dentro da categoria de esportes." Removido de
 * public/index.html; agora vive exclusivamente em public/esportes/index.html
 * (o hub /esportes/, data-section="geral"). NUNCA roda nas 13 páginas
 * dedicadas por esporte (data-section !== "geral") — essas já têm seus
 * próprios widgets ao vivo (ovc-radar-motor.js, ovc-torneio-espn.js etc.),
 * duplicar aqui seria redundante.
 *
 * Cobre TODAS as subcategorias oficiais de esportes (admin/index.html
 * SUBCATS.esportes): Futebol, Basquete, Motor, Tênis, MMA, Vôlei, NFL —
 * divididas em abas.
 *
 * Ponto de injeção: #cat-centro-area (criado por internal-page-v2.js, nunca
 * tem seu innerHTML reatribuído por inteiro — só os filhos #cat-hero-slot/
 * #cat-main-grid/#cat-more-list são, de forma assíncrona, quando o fetch de
 * posts da categoria resolve). Inserir como PRIMEIRO FILHO desse container
 * (antes de #cat-hero-slot) evita ser apagado por esse fetch — inserir
 * DENTRO de #cat-hero-slot seria sobrescrito na hora (heroSlot.innerHTML=...)
 * assim que a categoria tiver qualquer post, o que é sempre o caso aqui.
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
      .normalize('NFD').replace(/\p{Mn}/gu,'')
      .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55);
  }
  function buildHref(p) {
    var cat = p.categoria || 'esportes';
    return '/' + cat + '/' + slugify(p.titulo) + '-' + String(p.id||'').slice(0,8) + '/';
  }

  // Ordem = prioridade de classificação quando um artigo bate em mais de um esporte.
  // Rótulos batem exatamente com admin/index.html SUBCATS.esportes (sem "Geral").
  // "accent" = cor de identidade daquele esporte, usada na aba ativa e no detalhe
  // das matérias — cada esporte com uma personalidade própria, mesmo dentro do widget.
  // "page" = página de luxo dedicada daquele esporte — o CTA do widget deve
  // sempre apontar pra lá, nunca pra categoria genérica /esportes/.
  var SPORTS = [
    { key:'futebol',  label:'Futebol',  emoji:'⚽', accent:'#16a34a', page:'/radar-da-bola/',
      keywords:['campeonato brasileiro','brasileirão','brasileirao','série a','serie a','série b','serie b',
        'libertadores','sul-americana','sulamericana','copa sul-americana','copa libertadores',
        'copa do mundo','seleção brasileira','fifa','mundial','champions league','liga dos campeões',
        'premier league','la liga','bundesliga','calcio','ligue 1'] },
    { key:'basquete',  label:'Basquete', emoji:'🏀', accent:'#f97316', page:'/basquete/',
      keywords:['nba','nbb','basquete','basketball'] },
    { key:'motor',     label:'Motor',    emoji:'🏎️', accent:'#e11d48', page:'/motor/',
      keywords:['fórmula 1','formula 1','f1','grande prêmio','grande premio','gp de','stock car','motogp','indycar','automobilismo'] },
    { key:'tenis',     label:'Tênis',    emoji:'🎾', accent:'#84cc16', page:'/tenis/',
      keywords:['tênis','tenis','atp','wta','wimbledon','roland garros','australian open','us open de tênis','grand slam'] },
    { key:'mma',       label:'MMA',      emoji:'🥊', accent:'#b91c1c', page:'/mma/',
      keywords:['mma','ufc','octógono','octogono','artes marciais mistas'] },
    { key:'volei',     label:'Vôlei',    emoji:'🏐', accent:'#0ea5e9', page:'/volei/',
      keywords:['vôlei','volei','superliga','fivb','vôlei de praia','volei de praia'] },
    { key:'nfl',       label:'NFL',      emoji:'🏈', accent:'#92400e', page:'/nfl/',
      keywords:['nfl','super bowl','futebol americano'] }
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
      '@keyframes esporte-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.75)}}',
      '@keyframes esporte-shine{0%{transform:translateX(-120%) skewX(-15deg)}100%{transform:translateX(220%) skewX(-15deg)}}',
      '.ovc-esporte-rail{margin-bottom:24px;border-radius:14px;overflow:hidden;box-sizing:border-box;',
      '  border:1px solid #064e3b;box-shadow:0 12px 32px -14px rgba(6,78,59,.45);display:flex;flex-direction:column;}',
      '.ovc-esporte-header{background:linear-gradient(150deg,#059669 0%,#065f46 55%,#0f172a 115%);',
      '  padding:18px 22px 20px;position:relative;overflow:hidden;flex-shrink:0;cursor:pointer;}',
      '.ovc-esporte-header::before{content:"🏆";position:absolute;right:-6px;top:-14px;font-size:76px;opacity:.12;',
      '  transform:rotate(-18deg);}',
      '.ovc-esporte-shine{position:absolute;top:0;left:0;width:35%;height:100%;',
      '  background:linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent);',
      '  animation:esporte-shine 4.5s ease-in-out infinite;pointer-events:none;}',
      '.ovc-esporte-live-row{display:flex;align-items:center;gap:7px;margin-bottom:8px;position:relative;}',
      '.ovc-esporte-dot{display:inline-block;width:9px;height:9px;background:#facc15;border-radius:50%;',
      '  animation:esporte-pulse 1s ease-in-out infinite;flex-shrink:0;',
      '  box-shadow:0 0 9px 1px rgba(250,204,21,.7);}',
      '.ovc-esporte-live-txt{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#facc15;}',
      '.ovc-esporte-title{font-size:22px;font-weight:900;color:#fff;letter-spacing:-.01em;line-height:1.15;',
      '  position:relative;text-shadow:0 2px 10px rgba(0,0,0,.25);}',
      '.ovc-esporte-sub{font-size:12px;color:rgba(255,255,255,.82);margin-top:6px;position:relative;',
      '  letter-spacing:.01em;}',
      '.ovc-esporte-tabs{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;padding:14px 16px 12px;',
      '  background:var(--bg-elevated,#fff);border-bottom:1px solid var(--border-subtle,#e2e8f0);flex-shrink:0;}',
      '.ovc-esporte-tab{border:1.5px solid var(--border-subtle,#e2e8f0);background:transparent;border-radius:10px;',
      '  padding:9px 2px 7px;cursor:pointer;transition:all .15s;display:flex;flex-direction:column;',
      '  align-items:center;justify-content:center;gap:4px;min-width:0;}',
      '.ovc-esporte-tab-emoji{font-size:21px;line-height:1;}',
      '.ovc-esporte-tab-label{font-size:10.5px;font-weight:700;color:var(--text-soft,#475569);',
      '  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;}',
      '.ovc-esporte-tab:hover{border-color:#059669;transform:translateY(-1px);}',
      '.ovc-esporte-tab.active{border-color:var(--sport-accent,#059669);',
      '  background:var(--sport-accent,#059669);box-shadow:0 3px 10px -3px var(--sport-accent,#059669);}',
      '.ovc-esporte-tab.active .ovc-esporte-tab-label{color:#fff;}',
      '.ovc-esporte-body{background:var(--bg-elevated,#fff);padding:14px 16px;}',
      '.ovc-esporte-article-list{display:block;}',
      '.ovc-esporte-article{display:block;padding:12px 6px;border-bottom:1px solid var(--border-subtle,#e2e8f0);',
      '  text-decoration:none;transition:all .14s;border-left:3px solid transparent;margin-left:-6px;',
      '  padding-left:10px;border-radius:4px;}',
      '.ovc-esporte-article:last-child{border-bottom:none;}',
      '.ovc-esporte-article:hover{padding-left:14px;border-left-color:var(--sport-accent,#059669);',
      '  background:rgba(5,150,105,.05);}',
      '.ovc-esporte-artitle{font-size:14.5px;font-weight:650;color:var(--text-main,#0f172a);line-height:1.4;margin-bottom:4px;',
      '  display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;}',
      '.ovc-esporte-artmeta{font-size:11px;color:var(--sport-accent,#059669);font-weight:700;',
      '  text-transform:uppercase;letter-spacing:.02em;}',
      '.ovc-esporte-empty{font-size:13px;color:#64748b;margin:0;padding:18px 4px;text-align:center;}',
      '.ovc-esporte-cta{display:flex;align-items:center;justify-content:space-between;',
      '  padding:13px 16px;background:linear-gradient(90deg,#ecfdf5,#f0fdfa);border-top:1px solid #a7f3d0;flex-shrink:0;',
      '  text-decoration:none;font-size:12.5px;font-weight:800;color:#065f46;',
      '  transition:background .15s;}',
      '.ovc-esporte-cta:hover{background:linear-gradient(90deg,#d1fae5,#ccfbf1);}',
      /* Fechado por padrão: só o cabeçalho visível, tabs/body/cta somem.
         Na home (até 16/11/2026) o padrão era fechado — aqui, na página
         /esportes/, é o conteúdo principal, então nasce ABERTO. O toggle
         continua existindo (ver construirBloco) caso o usuário prefira
         recolher. */
      '.ovc-esporte-rail.ovc-esporte-collapsed .ovc-esporte-tabs,',
      '.ovc-esporte-rail.ovc-esporte-collapsed .ovc-esporte-body,',
      '.ovc-esporte-rail.ovc-esporte-collapsed .ovc-esporte-cta{display:none;}',
      '.ovc-esporte-toggle{position:absolute;right:16px;top:18px;font-size:14px;color:rgba(255,255,255,.85);',
      '  transition:transform .2s ease;pointer-events:none;}',
      '.ovc-esporte-collapsed .ovc-esporte-toggle{transform:rotate(-90deg);}',
    ].join('');
    document.head.appendChild(sty);
  }

  function renderBody(body, artigos, sport) {
    body.innerHTML = '';
    if (!artigos.length) {
      body.innerHTML = '<p class="ovc-esporte-empty">Cobertura chegando em breve.</p>';
      return;
    }
    var list = document.createElement('div');
    list.className = 'ovc-esporte-article-list';
    artigos.slice(0, 8).forEach(function (p) {
      var a = document.createElement('a');
      a.className = 'ovc-esporte-article';
      a.href = buildHref(p);
      a.innerHTML =
        '<div class="ovc-esporte-artitle">' + esc(p.titulo) + '</div>' +
        '<div class="ovc-esporte-artmeta">' + (sport ? sport.emoji : '🏆') + ' ' + dataBr(p.published_at || p.data || p.created_at) + '</div>';
      list.appendChild(a);
    });
    body.appendChild(list);
  }

  function construirBloco(porEsporte) {
    injetarCSS();

    var bloco = document.createElement('div');
    bloco.className = 'ovc-esporte-rail'; // aberto por padrão aqui — é o conteúdo principal de /esportes/
    bloco.id = 'ovc-radar-esporte';

    var header = document.createElement('div');
    header.className = 'ovc-esporte-header';
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.setAttribute('aria-expanded', 'true');
    header.innerHTML =
      '<div class="ovc-esporte-shine"></div>' +
      '<span class="ovc-esporte-toggle">▾</span>' +
      '<div class="ovc-esporte-live-row">' +
      '<span class="ovc-esporte-dot"></span>' +
      '<span class="ovc-esporte-live-txt">Ao vivo · 24h</span>' +
      '</div>' +
      '<div class="ovc-esporte-title">RADAR DO ESPORTE</div>' +
      '<div class="ovc-esporte-sub">Agora em: <b class="ovc-esporte-sub-active">Futebol</b></div>';
    function toggleColapso() {
      var fechado = bloco.classList.toggle('ovc-esporte-collapsed');
      header.setAttribute('aria-expanded', String(!fechado));
    }
    header.addEventListener('click', toggleColapso);
    header.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggleColapso(); }
    });
    bloco.appendChild(header);
    var subActive = header.querySelector('.ovc-esporte-sub-active');

    // Sempre as 7 abas, mesmo sem conteúdo publicado no momento naquele esporte —
    // Roberto quer TODOS os esportes visíveis o tempo todo. renderBody() já mostra
    // "Cobertura chegando em breve" quando a aba clicada não tem artigos ainda.
    var disponiveis = SPORTS;

    var tabs = document.createElement('div');
    tabs.className = 'ovc-esporte-tabs';
    var body = document.createElement('div');
    body.className = 'ovc-esporte-body';
    bloco.style.setProperty('--sport-accent', disponiveis[0].accent);
    if (subActive) subActive.textContent = disponiveis[0].label;

    var cta = document.createElement('a');
    cta.className = 'ovc-esporte-cta';

    function setCta(s) {
      cta.href = s.page || CAT_URL;
      cta.innerHTML = s.emoji + ' Ver radar completo de ' + esc(s.label) + ' <span>→</span>';
    }

    disponiveis.forEach(function (s, idx) {
      var tab = document.createElement('button');
      tab.type = 'button';
      tab.title = s.label;
      tab.setAttribute('aria-label', s.label);
      tab.className = 'ovc-esporte-tab' + (idx === 0 ? ' active' : '');
      tab.innerHTML = '<span class="ovc-esporte-tab-emoji">' + s.emoji + '</span><span class="ovc-esporte-tab-label">' + esc(s.label) + '</span>';
      tab.addEventListener('click', function () {
        Array.prototype.forEach.call(tabs.children, function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        bloco.style.setProperty('--sport-accent', s.accent);
        renderBody(body, porEsporte[s.key] || [], s);
        setCta(s);
        if (subActive) subActive.textContent = s.label;
      });
      tabs.appendChild(tab);
    });

    bloco.appendChild(tabs);
    renderBody(body, porEsporte[disponiveis[0].key] || [], disponiveis[0]);
    bloco.appendChild(body);
    setCta(disponiveis[0]);
    bloco.appendChild(cta);
    return bloco;
  }

  // internal-page-v2.js (EXTREMAMENTE FRÁGIL, assíncrono) sobrescreve
  // #cat-hero-slot/#cat-main-grid/#cat-more-list por inteiro assim que o
  // fetch de posts da categoria resolve — nunca inserir ali. #cat-centro-area
  // (o próprio .cat-centro) nunca tem seu innerHTML reatribuído por inteiro,
  // só os 3 filhos acima — inserir como PRIMEIRO FILHO dele é seguro.
  function esperarCentroEInjetar(bloco) {
    var tentativas = 0;
    var timer = setInterval(function () {
      tentativas++;
      var centro = document.getElementById('cat-centro-area');
      if (centro && !document.getElementById('ovc-radar-esporte')) {
        clearInterval(timer);
        centro.insertBefore(bloco, centro.firstChild);
        return;
      }
      if (tentativas > 60) clearInterval(timer); // ~15s — desiste silenciosamente
    }, 250);
  }

  function injetar(porEsporte) {
    esperarCentroEInjetar(construirBloco(porEsporte));
  }

  // Sistema de curtinhas DELETADO — 23/08/2026 (Roberto). Todo o conteúdo de
  // esportes (Futebol via autoFutebolCurtinhas, demais esportes via
  // autoOutrosEsportesCurtinhas) agora salva como tipo_conteudo="padrao" —
  // artigo completo, com imagem real, aparecendo normalmente no feed geral.
  // A classificação por esporte usa exclusivamente o feed ?recentes=true,
  // igual a todos os outros radares (ovc-torneio-espn.js etc.).
  function init() {
    // Só o hub /esportes/ (data-section="geral") — as 13 páginas dedicadas
    // por esporte já têm seus próprios widgets ao vivo, não duplicar aqui.
    var categoria = document.body && document.body.dataset && document.body.dataset.category;
    var secao = document.body && document.body.dataset && document.body.dataset.section;
    if (categoria !== 'esportes' || secao !== 'geral') return;

    fetch('/api/portal-posts?recentes=true&categoria=esportes&limit=300').then(function(r){ return r.json(); }).then(function(d) {
      var todosArtigos = d.posts || [];

      var porEsporte = {};
      SPORTS.forEach(function (s) { porEsporte[s.key] = []; });

      todosArtigos.forEach(function (p) {
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
