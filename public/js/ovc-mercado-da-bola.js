/**
 * ovc-mercado-da-bola.js — Feed de notícias de mercado (transferências, contratações, negociações)
 * REGRA ZERO-I: 100% independente — não toca internal-page-v2.js nem home.js
 * Sem dados ao vivo (não é placar/tabela): filtra o feed editorial do portal por keywords de mercado.
 * Separa cobertura Nacional x Internacional e mostra volume real de cobertura do OVC por tipo de movimentação.
 */
(function () {
  'use strict';

  // Keywords específicas de mercado de transferências — evita falsos positivos
  // com termos genéricos de negócios (ex: "acordo", "compra", "agente" sozinhos
  // batiam em notícias de economia/internacional sem nenhuma relação com futebol)
  var KEYWORDS = [
    'transferência', 'transferencia', 'contratação', 'contratacao',
    'negociação pelo jogador', 'negociacao pelo jogador', 'venda do jogador', 'venda de jogador',
    'compra do jogador', 'compra de jogador', 'empréstimo', 'emprestimo', 'emprestado ao',
    'multa rescisória', 'multa rescisoria', 'reforço do', 'reforco do', 'reforço para', 'reforco para',
    'novo reforço', 'novo reforco', 'agente do jogador', 'empresário do jogador', 'empresario do jogador',
    'procurador do jogador', 'janela de transferências', 'janela de transferencias',
    'pré-contrato', 'pre-contrato', 'proposta de transferência', 'proposta de transferencia',
    'sondagem por', 'sondando o', 'interesse no jogador', 'mercado da bola', 'passe livre',
    'rescisão de contrato', 'rescisao de contrato', 'renovação de contrato', 'renovacao de contrato',
    'permuta de jogador', 'troca de jogador', 'acerto com o clube', 'acertou com o clube',
    'assinou contrato com', 'assina contrato com', 'acerta a contratação', 'acerta a contratacao'
  ];

  // Clubes/contexto do futebol nacional — presença classifica a notícia como "nacional"
  var CLUBES_BR = [
    'flamengo', 'palmeiras', 'corinthians', 'são paulo', 'sao paulo', 'santos', 'grêmio', 'gremio',
    'cruzeiro', 'atlético-mg', 'atletico-mg', 'atlético mineiro', 'atletico mineiro', 'galo',
    'botafogo', 'fluminense', 'vasco da gama', 'vasco', 'bahia', 'fortaleza',
    'athletico-pr', 'athletico paranaense', 'red bull bragantino', 'bragantino',
    'cuiabá', 'cuiaba', 'criciúma', 'criciuma', 'juventude', 'vitória', 'vitoria',
    'sport recife', 'ceará', 'ceara', 'goiás', 'goias', 'coritiba', 'chapecoense',
    'américa-mg', 'america-mg', 'avaí', 'avai', 'ponte preta', 'guarani', 'crb', 'náutico', 'nautico',
    'csa', 'remo', 'paysandu', 'operário', 'operario', 'ituano', 'novorizontino', 'mirassol',
    'vila nova', 'brusque', 'londrina', 'sampaio corrêa', 'sampaio correa', 'confiança', 'confianca',
    'tombense', 'volta redonda', 'brasileirão', 'brasileirao', 'série a do brasileiro',
    'serie a do brasileiro', 'copa do brasil', 'seleção brasileira', 'selecao brasileira', 'cbf'
  ];

  // Clubes/ligas do futebol internacional — presença (sem clube BR) classifica como "internacional"
  var TERMOS_INTL = [
    'real madrid', 'barcelona', 'manchester city', 'manchester united', 'chelsea', 'liverpool',
    'arsenal', 'tottenham', 'psg', 'paris saint-germain', 'bayern de munique', 'bayern munich',
    'borussia dortmund', 'juventus', 'milan', 'internazionale', 'inter de milão', 'inter de milao',
    'napoli', 'atlético de madrid', 'atletico de madrid', 'sevilla', 'porto', 'benfica', 'sporting',
    'ajax', 'premier league', 'la liga', 'bundesliga', 'ligue 1', 'serie a italiana',
    'champions league', 'liga dos campeões', 'liga dos campeoes', 'liga europa',
    'mls', 'al-nassr', 'al nassr', 'al-hilal', 'al hilal', 'saudi pro league'
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
  function contemAlgum(texto, lista) {
    for (var i = 0; i < lista.length; i++) {
      if (texto.indexOf(lista[i]) >= 0) return true;
    }
    return false;
  }
  function classificarClasse(texto) {
    if (contemAlgum(texto, CLUBES_BR)) return 'nacional';
    if (contemAlgum(texto, TERMOS_INTL)) return 'internacional';
    return 'nacional';
  }
  function classificarTipo(texto) {
    if (/venda (do|de) jogador|vendeu o jogador|negocia(ç|c)[aã]o pelo jogador/.test(texto)) return 'venda';
    if (/empr[ée]stimo|emprestado ao|emprestado a/.test(texto)) return 'emprestimo';
    if (/renova(ç|c)[aã]o de contrato/.test(texto)) return 'renovacao';
    if (/compra (do|de) jogador|contrata(ç|c)[aã]o|reforço|reforco|assinou contrato|assina contrato|acerta a contrata(ç|c)[aã]o|pr[ée]-contrato/.test(texto)) return 'compra';
    return 'outro';
  }

  function injetarCSS() {
    if (document.getElementById('ovc-mdb-css')) return;
    var sty = document.createElement('style');
    sty.id = 'ovc-mdb-css';
    sty.textContent = [
      '.ovc-mdb-wrap{margin:18px 0;}',
      '.ovc-mdb-trust{font-size:11.5px;color:#64748b;margin:0 0 16px;display:flex;align-items:center;gap:6px;font-weight:600;}',
      '.ovc-mdb-trust b{color:#059669;}',
      '.ovc-mdb-chart-wrap{border:1px solid #e5e7eb;border-radius:12px;padding:16px 18px;margin-bottom:18px;background:#fafafa;}',
      '.ovc-mdb-chart-title{font-size:12.5px;font-weight:800;color:#0f172a;margin-bottom:2px;}',
      '.ovc-mdb-chart-sub{font-size:10.5px;color:#94a3b8;margin-bottom:14px;}',
      '.ovc-mdb-chart-row{display:flex;align-items:center;gap:10px;margin-bottom:10px;}',
      '.ovc-mdb-chart-row:last-child{margin-bottom:0;}',
      '.ovc-mdb-chart-label{width:96px;font-size:11px;font-weight:700;color:#475569;flex-shrink:0;}',
      '.ovc-mdb-chart-bars{flex:1;display:flex;flex-direction:column;gap:4px;}',
      '.ovc-mdb-chart-bar-line{display:flex;align-items:center;gap:8px;}',
      '.ovc-mdb-chart-bar-track{flex:1;background:#eef2f7;border-radius:4px;overflow:hidden;height:8px;}',
      '.ovc-mdb-chart-bar-fill{height:100%;border-radius:4px;min-width:2px;transition:width .3s;}',
      '.ovc-mdb-chart-bar-fill.nac{background:#059669;}',
      '.ovc-mdb-chart-bar-fill.intl{background:#2563eb;}',
      '.ovc-mdb-chart-bar-n{font-size:10px;color:#94a3b8;width:20px;text-align:right;flex-shrink:0;}',
      '.ovc-mdb-chart-legend{display:flex;gap:14px;margin-top:12px;padding-top:10px;border-top:1px solid #e5e7eb;font-size:10.5px;color:#64748b;}',
      '.ovc-mdb-chart-legend span{display:inline-flex;align-items:center;gap:4px;}',
      '.ovc-mdb-chart-dot{width:8px;height:8px;border-radius:2px;display:inline-block;}',
      '.ovc-mdb-chart-dot.nac{background:#059669;}',
      '.ovc-mdb-chart-dot.intl{background:#2563eb;}',
      '.ovc-mdb-tabs{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;}',
      '.ovc-mdb-tab{padding:7px 16px;border-radius:20px;border:1px solid #e5e7eb;background:#fff;font-size:12.5px;font-weight:700;color:#475569;cursor:pointer;transition:.15s;}',
      '.ovc-mdb-tab.active{background:#b45309;border-color:#b45309;color:#fff;}',
      '.ovc-mdb-tab:hover{border-color:#b45309;}',
      '.ovc-mdb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;}',
      '.ovc-mdb-card{display:flex;flex-direction:column;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;text-decoration:none;background:#fff;transition:transform .15s,box-shadow .15s;}',
      '.ovc-mdb-card:hover{transform:translateY(-3px);box-shadow:0 8px 18px rgba(0,0,0,.1);}',
      '.ovc-mdb-card-img{width:100%;height:140px;object-fit:cover;background:#f3f4f6;}',
      '.ovc-mdb-card-body{padding:12px 14px;display:flex;flex-direction:column;gap:6px;flex:1;}',
      '.ovc-mdb-card-badge{font-size:9px;font-weight:800;color:#b45309;text-transform:uppercase;letter-spacing:.07em;display:flex;gap:6px;align-items:center;}',
      '.ovc-mdb-card-flag{font-size:11px;}',
      '.ovc-mdb-card-title{font-size:13.5px;font-weight:700;color:var(--text-main,#0f172a);line-height:1.4;}',
      '.ovc-mdb-card-date{font-size:10.5px;color:#94a3b8;margin-top:auto;}',
      '.ovc-mdb-empty{padding:26px 14px;text-align:center;color:#94a3b8;font-size:13px;border:1px dashed #e5e7eb;border-radius:10px;}',
    ].join('');
    document.head.appendChild(sty);
  }

  function filtrar(lista) {
    var vistos = {};
    return lista.filter(function (p) {
      if (vistos[p.id]) return false;
      if (p.categoria && p.categoria !== 'esportes') return false;
      var t = ((p.titulo || '') + ' ' + (p.comentario_fixado || '')).toLowerCase();
      var ok = KEYWORDS.some(function (k) { return t.indexOf(k) >= 0; });
      if (ok) vistos[p.id] = true;
      return ok;
    });
  }

  function enriquecer(lista) {
    return lista.map(function (p) {
      var t = ((p.titulo || '') + ' ' + (p.comentario_fixado || '')).toLowerCase();
      p._classe = classificarClasse(t);
      p._tipo = classificarTipo(t);
      return p;
    });
  }

  function contarTipos(lista) {
    var c = { compra: 0, venda: 0, emprestimo: 0, renovacao: 0, outro: 0 };
    lista.forEach(function (p) { c[p._tipo] = (c[p._tipo] || 0) + 1; });
    return c;
  }

  function renderCard(p) {
    var img = imgOk(p.imagem)
      ? '<img class="ovc-mdb-card-img" src="' + esc(p.imagem) + '" alt="" loading="lazy">'
      : '';
    var bandeira = p._classe === 'internacional' ? '🌍' : '🇧🇷';
    return '<a class="ovc-mdb-card" href="' + buildHref(p) + '">' +
      img +
      '<div class="ovc-mdb-card-body">' +
      '<span class="ovc-mdb-card-badge"><span class="ovc-mdb-card-flag">' + bandeira + '</span>Mercado da Bola</span>' +
      '<span class="ovc-mdb-card-title">' + esc(p.titulo) + '</span>' +
      '<span class="ovc-mdb-card-date">' + dataCurta(p.data || p.published_at || p.created_at) + '</span>' +
      '</div></a>';
  }

  function renderGrid(lista) {
    if (!lista.length) {
      return '<div class="ovc-mdb-empty">Nenhuma movimentação nesta categoria no momento.</div>';
    }
    return '<div class="ovc-mdb-grid">' + lista.slice(0, 24).map(renderCard).join('') + '</div>';
  }

  function renderTabs(nQtd, iQtd, tQtd) {
    return '<div class="ovc-mdb-tabs">' +
      '<button type="button" class="ovc-mdb-tab active" data-tab="todos">Todos (' + tQtd + ')</button>' +
      '<button type="button" class="ovc-mdb-tab" data-tab="nacional">🇧🇷 Nacional (' + nQtd + ')</button>' +
      '<button type="button" class="ovc-mdb-tab" data-tab="internacional">🌍 Internacional (' + iQtd + ')</button>' +
      '</div>';
  }

  function renderChart(stats) {
    var linhas = [
      { key: 'compra', label: 'Contratações' },
      { key: 'venda', label: 'Vendas' },
      { key: 'emprestimo', label: 'Empréstimos' },
      { key: 'renovacao', label: 'Renovações' }
    ];
    var max = 1;
    linhas.forEach(function (l) {
      max = Math.max(max, stats.nacional[l.key] || 0, stats.internacional[l.key] || 0);
    });
    var rows = linhas.map(function (l) {
      var nN = stats.nacional[l.key] || 0;
      var nI = stats.internacional[l.key] || 0;
      var wN = Math.round((nN / max) * 100);
      var wI = Math.round((nI / max) * 100);
      return '<div class="ovc-mdb-chart-row">' +
        '<span class="ovc-mdb-chart-label">' + l.label + '</span>' +
        '<div class="ovc-mdb-chart-bars">' +
          '<div class="ovc-mdb-chart-bar-line"><div class="ovc-mdb-chart-bar-track"><div class="ovc-mdb-chart-bar-fill nac" style="width:' + wN + '%"></div></div><span class="ovc-mdb-chart-bar-n">' + nN + '</span></div>' +
          '<div class="ovc-mdb-chart-bar-line"><div class="ovc-mdb-chart-bar-track"><div class="ovc-mdb-chart-bar-fill intl" style="width:' + wI + '%"></div></div><span class="ovc-mdb-chart-bar-n">' + nI + '</span></div>' +
        '</div>' +
        '</div>';
    }).join('');
    return '<div class="ovc-mdb-chart-wrap">' +
      '<div class="ovc-mdb-chart-title">Cobertura do OVC por tipo de movimentação</div>' +
      '<div class="ovc-mdb-chart-sub">Volume de matérias publicadas pelo portal — não representa valores oficiais de mercado</div>' +
      rows +
      '<div class="ovc-mdb-chart-legend">' +
        '<span><span class="ovc-mdb-chart-dot nac"></span>Nacional</span>' +
        '<span><span class="ovc-mdb-chart-dot intl"></span>Internacional</span>' +
      '</div>' +
      '</div>';
  }

  function montar(artigos) {
    injetarCSS();
    var alvo = document.getElementById('ovc-mercado-dash');
    if (!alvo) return;
    if (!artigos.length) {
      alvo.innerHTML = '<div class="ovc-mdb-wrap"><div class="ovc-mdb-empty">Cobertura do mercado chegando em breve.</div></div>';
      return;
    }

    var enriched = enriquecer(artigos);
    var nacional = enriched.filter(function (p) { return p._classe === 'nacional'; });
    var internacional = enriched.filter(function (p) { return p._classe === 'internacional'; });
    var stats = { nacional: contarTipos(nacional), internacional: contarTipos(internacional) };

    alvo.innerHTML = '<div class="ovc-mdb-wrap">' +
      '<div class="ovc-mdb-trust"><b>✓</b> Cobertura baseada nas fontes jornalísticas verificadas do OVC</div>' +
      renderChart(stats) +
      renderTabs(nacional.length, internacional.length, enriched.length) +
      '<div id="ovc-mdb-grid-mount">' + renderGrid(enriched) + '</div>' +
      '</div>';

    var tabs = alvo.querySelectorAll('.ovc-mdb-tab');
    var mount = alvo.querySelector('#ovc-mdb-grid-mount');
    tabs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        tabs.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var f = btn.getAttribute('data-tab');
        var lista = f === 'nacional' ? nacional : (f === 'internacional' ? internacional : enriched);
        mount.innerHTML = renderGrid(lista);
      });
    });
  }

  function init() {
    var alvo = document.getElementById('ovc-mercado-dash');
    if (!alvo) return;
    alvo.innerHTML = '<div class="ovc-mdb-wrap"><div class="ovc-mdb-empty">Carregando…</div></div>';

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
