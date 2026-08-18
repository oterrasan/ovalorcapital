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
      /* Altura fixa compartilhada com .ovc-eleitoral-rail (ovc-eleitoral.js) —
         os dois widgets ficam lado a lado no topo dos rails da Home e devem
         começar e terminar exatamente na mesma posição. Mudar aqui? Mudar lá também.
         box-sizing:border-box trava a altura total em 740px INCLUINDO a borda —
         sem isso, bordas de espessuras diferentes entre os dois widgets somam
         2px extras fora do height declarado e desalinham o fim dos dois blocos. */
      '.ovc-esporte-rail{margin-bottom:18px;border-radius:12px;overflow:hidden;box-sizing:border-box;',
      '  border:1px solid #064e3b;box-shadow:0 10px 30px -12px rgba(6,78,59,.45);',
      '  height:740px;display:flex;flex-direction:column;}',
      '.ovc-esporte-header{background:linear-gradient(150deg,#059669 0%,#065f46 55%,#0f172a 115%);',
      '  padding:14px 16px 16px;position:relative;overflow:hidden;flex-shrink:0;}',
      '.ovc-esporte-header::before{content:"🏆";position:absolute;right:-10px;top:-12px;font-size:64px;opacity:.12;',
      '  transform:rotate(-18deg);}',
      '.ovc-esporte-shine{position:absolute;top:0;left:0;width:35%;height:100%;',
      '  background:linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent);',
      '  animation:esporte-shine 4.5s ease-in-out infinite;pointer-events:none;}',
      '.ovc-esporte-live-row{display:flex;align-items:center;gap:6px;margin-bottom:6px;position:relative;}',
      '.ovc-esporte-dot{display:inline-block;width:8px;height:8px;background:#facc15;border-radius:50%;',
      '  animation:esporte-pulse 1s ease-in-out infinite;flex-shrink:0;',
      '  box-shadow:0 0 8px 1px rgba(250,204,21,.7);}',
      '.ovc-esporte-live-txt{font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#facc15;}',
      '.ovc-esporte-title{font-size:16px;font-weight:900;color:#fff;letter-spacing:-.01em;line-height:1.15;',
      '  position:relative;text-shadow:0 2px 10px rgba(0,0,0,.25);}',
      '.ovc-esporte-sub{font-size:10.5px;color:rgba(255,255,255,.8);margin-top:4px;position:relative;',
      '  letter-spacing:.01em;}',
      /* Grid de 7 colunas fixas — Roberto: "nao da pra ter um menu de esportes
         que empurra pra os lados... precisam estar fixados e sempre a vista".
         Antes era flex nowrap + overflow-x:auto (scroll horizontal escondido,
         sem indicação visual) — usuário não descobria que dava pra rolar e
         via só 2-3 esportes. Grid força as 7 abas sempre visíveis de uma vez,
         cada uma ocupando exatamente 1/7 da largura, sem scroll algum. */
      '.ovc-esporte-tabs{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;padding:9px 8px 7px;',
      '  background:var(--bg-elevated,#fff);border-bottom:1px solid var(--border-subtle,#e2e8f0);flex-shrink:0;}',
      '.ovc-esporte-tab{border:1.5px solid var(--border-subtle,#e2e8f0);background:transparent;border-radius:9px;',
      '  padding:6px 2px 5px;cursor:pointer;transition:all .15s;display:flex;flex-direction:column;',
      '  align-items:center;justify-content:center;gap:2px;min-width:0;}',
      '.ovc-esporte-tab-emoji{font-size:19px;line-height:1;}',
      /* Rótulo de texto (label) REMOVIDO visualmente — bug real reportado por
         Roberto 12/08/2026 (screenshot): com 7 abas espremidas em 270px de
         rail, cada uma tinha só ~28px de largura útil — "Futebol", "Basquete",
         "Motor", "Tênis", "MMA", "Vôlei" a 7px de fonte truncavam com
         text-overflow:ellipsis para lixo ilegível tipo "F…", "B…", "M…"
         (Motor E MMA colidindo no mesmo "M…"), "T…", "V…". Emoji sozinho
         (19px, glifo único) nunca trunca e já é reconhecível por esporte —
         o nome completo continua acessível via title/aria-label no <button>
         (tooltip ao passar o mouse) e via classe sr-only visualmente oculta
         mas lida por leitor de tela. NÃO reverter para mostrar texto de novo
         sem alargar a largura do rail (que é compartilhada com
         .ovc-eleitoral-rail — ver nota acima sobre altura).*/
      '.ovc-esporte-tab-label{position:absolute;width:1px;height:1px;padding:0;margin:-1px;',
      '  overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}',
      '.ovc-esporte-tab:hover{border-color:#059669;transform:translateY(-1px);}',
      '.ovc-esporte-tab.active{border-color:var(--sport-accent,#059669);',
      '  background:var(--sport-accent,#059669);box-shadow:0 3px 10px -3px var(--sport-accent,#059669);}',
      '.ovc-esporte-body{background:var(--bg-elevated,#fff);padding:10px 12px;flex:1 1 auto;overflow:hidden;',
      '  display:flex;flex-direction:column;min-height:0;}',
      '.ovc-esporte-article-list{flex:1 1 auto;display:flex;flex-direction:column;justify-content:space-evenly;overflow:hidden;}',
      '.ovc-esporte-article{display:block;padding:10px 4px;border-bottom:1px solid var(--border-subtle,#e2e8f0);',
      '  text-decoration:none;transition:all .14s;border-left:3px solid transparent;margin-left:-4px;',
      '  padding-left:8px;border-radius:4px;}',
      '.ovc-esporte-article:last-child{border-bottom:none;}',
      '.ovc-esporte-article:hover{padding-left:12px;border-left-color:var(--sport-accent,#059669);',
      '  background:rgba(5,150,105,.05);}',
      '.ovc-esporte-artitle{font-size:12.5px;font-weight:650;color:var(--text-main,#0f172a);line-height:1.4;margin-bottom:3px;',
      '  display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;}',
      '.ovc-esporte-artmeta{font-size:10px;color:var(--sport-accent,#059669);font-weight:700;',
      '  text-transform:uppercase;letter-spacing:.02em;}',
      '.ovc-esporte-empty{font-size:12px;color:#64748b;margin:0;padding:14px 4px;text-align:center;}',
      '.ovc-esporte-cta{display:flex;align-items:center;justify-content:space-between;',
      '  padding:11px 14px;background:linear-gradient(90deg,#ecfdf5,#f0fdfa);border-top:1px solid #a7f3d0;flex-shrink:0;',
      '  text-decoration:none;font-size:11.5px;font-weight:800;color:#065f46;',
      '  transition:background .15s;}',
      '.ovc-esporte-cta:hover{background:linear-gradient(90deg,#d1fae5,#ccfbf1);}',
      /* Variante mobile — ver injetar(). Em telas <=768px, public/css/
         responsive.css aplica ".rail-right{display:none}" (todo o rail
         direito some — Copa, Eleitoral, Mais Lidos, TV, banner: TODOS os
         widgets desse rail ficam invisíveis no celular, não é bug deste
         arquivo). Confirmado ao vivo via Playwright em viewport 390x844
         (12/08/2026): elemento existe no DOM mas isVisible:false,
         boundingBox:null. Em vez de alterar responsive.css (mudaria o
         comportamento de TODOS os outros widgets do rail — fora de escopo
         e arriscado demais pra decidir sozinho), este widget também se
         injeta no fluxo principal (entre o hero e os cards) quando o rail
         estiver oculto — self-contained, não toca em home.js nem CSS
         compartilhado. Bug real reportado por Roberto 12/08/2026.*/
      '@media(max-width:768px){',
      '  .ovc-esporte-rail.ovc-esporte-mobile{height:auto;grid-column:1;margin:0 0 18px;}',
      '  .ovc-esporte-rail.ovc-esporte-mobile .ovc-esporte-body{overflow:visible;}',
      '  .ovc-esporte-rail.ovc-esporte-mobile .ovc-esporte-article-list{overflow:visible;}',
      '}',
      /* 18/08/2026 — Roberto: "quero que os widgets virem expansiveis, fecham
         por padrão, só o cabeçalho clicável, ao clicar expande e fica como já
         é agora". Fechado = altura vira automática (só o header), tabs/body/
         cta somem. Aberto = exatamente o comportamento de sempre (height fixo
         de 740px no desktop, sincronizado com .ovc-eleitoral-rail). */
      '.ovc-esporte-rail.ovc-esporte-collapsed{height:auto!important;}',
      '.ovc-esporte-rail.ovc-esporte-collapsed .ovc-esporte-tabs,',
      '.ovc-esporte-rail.ovc-esporte-collapsed .ovc-esporte-body,',
      '.ovc-esporte-rail.ovc-esporte-collapsed .ovc-esporte-cta{display:none;}',
      '.ovc-esporte-header{cursor:pointer;}',
      '.ovc-esporte-toggle{position:absolute;right:12px;top:12px;font-size:13px;color:rgba(255,255,255,.85);',
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
    artigos.slice(0, 5).forEach(function (p) {
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
    bloco.className = 'ovc-esporte-rail ovc-esporte-collapsed'; // fechado por padrão — Roberto, 18/08/2026
    bloco.id = 'ovc-radar-esporte'; // ovc-copa.js ancora nele para entrar logo depois

    var header = document.createElement('div');
    header.className = 'ovc-esporte-header';
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.setAttribute('aria-expanded', 'false');
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

    var ctaFallback = document.createElement('a');
    ctaFallback.href = CAT_URL;
    ctaFallback.className = 'ovc-esporte-cta';
    ctaFallback.innerHTML = '🏆 Ver todos os esportes <span>→</span>';
    bloco.appendChild(ctaFallback);

    return bloco;
  }

  function injetar(porEsporte) {
    var rail = document.querySelector('.rail-right');
    var railVisivel = rail && getComputedStyle(rail).display !== 'none';
    var bloco = construirBloco(porEsporte);
    if (railVisivel) {
      rail.insertBefore(bloco, rail.firstChild);
      return;
    }
    // .rail-right oculto (mobile, <=768px). TENTATIVA ANTERIOR (12/08/2026,
    // manhã) inseria em .main-grid — PARECIA visível (isVisible:true no
    // Playwright) mas na prática ficava invisível pra usuário real: .main-grid
    // é CSS GRID com grid-row EXPLÍCITO em .hero-region(1)/.cols-region(2)/
    // .cols-region-2(3) (ver home.css ~734-751) que continua valendo mesmo
    // no breakpoint mobile. Um filho SEM grid-row (como o bloco inserido)
    // é auto-posicionado pelo algoritmo de grid nas próximas linhas livres —
    // ou seja, DEPOIS de todas as linhas explícitas, ficando abaixo de TODO
    // o feed de cards, ~4675px pra baixo (quase no rodapé), mesmo aparecendo
    // antes no DOM. Confirmado ao vivo (Playwright, iPhone 13 emulado):
    // widgetAbsTop:4675 vs cardsAbsTop:320 — por isso Roberto continuou
    // reportando "não funciona" mesmo com o fix anterior no ar.
    // FIX REAL: injeta como PRIMEIRO FILHO de #ovc-cards-section
    // (.cols-region) em vez de em .main-grid. cols-region é
    // display:flex;flex-direction:column — nesse contexto ordem no DOM
    // SEMPRE é ordem visual, sem nenhuma dependência de grid-row hardcoded
    // que quebraria silenciosamente se home.css mudar as linhas do grid.
    bloco.classList.add('ovc-esporte-mobile');
    var cardsSection = document.getElementById('ovc-cards-section');
    if (cardsSection) {
      cardsSection.insertBefore(bloco, cardsSection.firstChild);
      return;
    }
    var mainGrid = document.querySelector('.main-grid');
    if (mainGrid) mainGrid.appendChild(bloco);
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
