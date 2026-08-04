/**
 * ovc-futebol-europeu.js — Dashboard premium multi-liga (Champions + principais ligas europeias)
 * REGRA ZERO-I: 100% independente — não toca internal-page-v2.js nem home.js
 * Config via window.OVC_EUROPA = {ligas:[{code,nome,stats[]}], keywords[], cor, corDark}
 * Fonte de dados: ESPN (scoreboard, standings, leaders) via proxy server-side em api/live.js?action=espn
 * Visual "espetacular" (04/08/2026): tema dark carbon, mini-pódio de líderes,
 * mesma linguagem do piloto do Motor/F1 e do ovc-torneio-espn.js.
 */
(function () {
  'use strict';

  function kwMatch(text, kw) {
    var esc = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(?:^|[^\\p{L}\\p{N}])' + esc + '(?:[^\\p{L}\\p{N}]|$)', 'iu').test(text);
  }

  var CFG = window.OVC_EUROPA;
  if (!CFG || !CFG.ligas || !CFG.ligas.length) return;

  var ACC = CFG.cor || '#1e40af';
  var ACC_DARK = CFG.corDark || '#0b0e14';
  var cache = {};
  var ligaAtual = CFG.ligas[0].code;
  var tabAtual = 'jogos';

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
  function dataBr(iso) {
    try { return new Date(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }); }
    catch (_) { return ''; }
  }
  function escudoImg(url, cls) {
    if (!url) return '<span class="ovc-eur-badge-ph"></span>';
    return '<img class="' + (cls || 'ovc-eur-badge') + '" src="' + esc(url) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.outerHTML=\'<span class=&quot;ovc-eur-badge-ph&quot;></span>\'">';
  }

  function injetarCSS() {
    if (document.getElementById('ovc-eur-css')) return;
    var sty = document.createElement('style');
    sty.id = 'ovc-eur-css';
    sty.textContent = [
      '@keyframes eur-sweep{0%{transform:translateX(-140%) skewX(-18deg)}100%{transform:translateX(260%) skewX(-18deg)}}',
      '@keyframes eur-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.8)}}',
      '@keyframes eur-rise{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}',
      '.ovc-eur-wrap{margin:18px 0;border-radius:14px;overflow:hidden;background:#0b0e14;',
        'box-shadow:0 20px 50px -20px rgba(0,0,0,.55);border:1px solid #1f2430;}',
      '.ovc-eur-hd{position:relative;overflow:hidden;padding:22px 22px 18px;',
        'background:repeating-linear-gradient(120deg,' + ACC_DARK + ' 0 26px,#0a0e1e 26px 52px);}',
      '.ovc-eur-stripe{position:absolute;top:0;right:-8%;width:55%;height:100%;',
        'background:linear-gradient(100deg,transparent 0%,' + ACC + '33 45%,transparent 70%);pointer-events:none;}',
      '.ovc-eur-sweep{position:absolute;top:0;left:0;width:22%;height:100%;',
        'background:linear-gradient(100deg,transparent,rgba(255,255,255,.09),transparent);',
        'animation:eur-sweep 5.5s ease-in-out infinite;pointer-events:none;}',
      '.ovc-eur-hd-live{display:flex;align-items:center;gap:7px;margin-bottom:8px;position:relative;}',
      '.ovc-eur-dot{width:9px;height:9px;background:#38bdf8;border-radius:50%;animation:eur-pulse 1.1s ease-in-out infinite;flex-shrink:0;box-shadow:0 0 10px 2px rgba(56,189,248,.6);}',
      '.ovc-eur-hd-txt{font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#38bdf8;}',
      '.ovc-eur-hd-title{font-size:22px;font-weight:900;color:#fff;letter-spacing:-.02em;line-height:1.1;font-style:italic;position:relative;}',
      '.ovc-eur-stats{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;background:#0b0e14;border-bottom:1px solid #1f2430;}',
      '.ovc-eur-stat{text-align:center;padding:10px 4px;border-right:1px solid #1f2430;}',
      '.ovc-eur-stat:last-child{border-right:none;}',
      '.ovc-eur-stat-n{display:block;font-size:16px;font-weight:900;color:#38bdf8;line-height:1;}',
      '.ovc-eur-stat-l{display:block;font-size:8px;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.05em;margin-top:3px;}',
      '.ovc-eur-ligas{display:flex;flex-wrap:wrap;gap:6px;padding:12px 14px;background:#0b0e14;border-bottom:1px solid #1f2430;}',
      '.ovc-eur-liga-btn{padding:6px 12px;border-radius:16px;font-size:11px;font-weight:700;color:rgba(255,255,255,.55);',
        'background:transparent;border:1.5px solid #1f2430;cursor:pointer;transition:all .15s;}',
      '.ovc-eur-liga-btn:hover{border-color:' + ACC + ';color:#fff;}',
      '.ovc-eur-liga-btn.active{color:#fff;background:' + ACC + ';border-color:' + ACC + ';}',
      '.ovc-eur-tabs{display:flex;background:#0b0e14;border-bottom:1px solid #1f2430;}',
      '.ovc-eur-tab{flex:1;padding:11px 8px;text-align:center;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.4);cursor:pointer;border-bottom:2px solid transparent;background:none;border-top:none;border-left:none;border-right:none;transition:color .15s;}',
      '.ovc-eur-tab.active{color:#fff;border-bottom-color:' + ACC + ';}',
      '.ovc-eur-body{padding:16px 18px;min-height:80px;background:#0b0e14;}',
      '.ovc-eur-subhd{font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:rgba(255,255,255,.35);margin:10px 0 8px;}',
      '.ovc-eur-subhd:first-child{margin-top:0;}',
      '.ovc-eur-badge{width:20px;height:20px;object-fit:contain;flex-shrink:0;}',
      '.ovc-eur-badge-ph{width:20px;height:20px;border-radius:3px;background:#1f2430;flex-shrink:0;display:inline-block;}',
      '.ovc-eur-match{display:flex;align-items:center;justify-content:space-between;padding:9px 4px;border-bottom:1px solid #1a1f2c;font-size:12px;}',
      '.ovc-eur-match:last-child{border-bottom:none;}',
      '.ovc-eur-match-side{display:flex;align-items:center;gap:6px;flex:1;min-width:0;}',
      '.ovc-eur-match-side.away{justify-content:flex-end;text-align:right;flex-direction:row-reverse;}',
      '.ovc-eur-team{font-weight:700;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.ovc-eur-score{font-weight:900;font-size:13px;padding:0 10px;color:' + ACC + ';white-space:nowrap;}',
      '.ovc-eur-meta{font-size:9px;color:rgba(255,255,255,.4);text-align:center;min-width:56px;}',
      '.ovc-eur-empty{padding:22px 12px;text-align:center;color:rgba(255,255,255,.4);font-size:12.5px;}',
      '.ovc-eur-groups{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;}',
      '.ovc-eur-gcard{border:1px solid #1f2430;border-radius:8px;overflow:hidden;}',
      '.ovc-eur-gcard-hd{background:' + ACC_DARK + ';color:#fff;padding:7px 10px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;}',

      // Mini-pódio de líderes — mesma linguagem visual do Motor e do torneio-espn
      '.ovc-eur-leaders{padding:2px 2px 16px;}',
      '.ovc-eur-leaders-row{display:flex;align-items:flex-end;justify-content:center;gap:8px;}',
      '.ovc-eur-leader{flex:1;max-width:120px;text-align:center;animation:eur-rise .5s ease-out;}',
      '.ovc-eur-leader-badge{width:32px;height:32px;object-fit:contain;background:#fff;border-radius:50%;margin:0 auto 8px;display:block;padding:3px;}',
      '.ovc-eur-leader-badge-ph{width:32px;height:32px;border-radius:50%;background:#1f2430;margin:0 auto 8px;display:block;}',
      '.ovc-eur-leader-nome{font-size:11px;font-weight:800;color:#fff;line-height:1.25;margin-bottom:8px;',
        'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:28px;}',
      '.ovc-eur-leader-bar{border-radius:8px 8px 0 0;display:flex;align-items:flex-start;justify-content:center;padding-top:8px;color:#0b0e14;font-weight:900;}',
      '.ovc-eur-leader-bar .n{font-size:12px;}',
      '.ovc-eur-leader-bar .p{display:block;font-size:16px;margin-top:2px;}',
      '.ovc-eur-leader.p1 .ovc-eur-leader-bar{height:66px;background:linear-gradient(160deg,#fbbf24,#d97706);}',
      '.ovc-eur-leader.p2 .ovc-eur-leader-bar{height:48px;background:linear-gradient(160deg,#cbd5e1,#94a3b8);}',
      '.ovc-eur-leader.p3 .ovc-eur-leader-bar{height:36px;background:linear-gradient(160deg,#d97757,#b45309);}',

      '.ovc-eur-table{width:100%;border-collapse:collapse;font-size:11px;}',
      '.ovc-eur-table th{background:#0e1220;color:rgba(255,255,255,.4);text-transform:uppercase;font-size:8px;font-weight:800;padding:6px 4px;text-align:center;border-bottom:1px solid #1f2430;}',
      '.ovc-eur-table th:nth-child(2){text-align:left;}',
      '.ovc-eur-table td{padding:6px 4px;text-align:center;border-bottom:1px solid #1a1f2c;color:#cbd5e1;}',
      '.ovc-eur-table td:nth-child(2){text-align:left;font-weight:700;}',
      '.ovc-eur-table tr:last-child td{border-bottom:none;}',
      '.ovc-eur-table tr{border-left:3px solid transparent;}',
      '.ovc-eur-table tr:nth-child(-n+4){border-left-color:#22c55e;}',
      '.ovc-eur-table tr:nth-child(-n+4) td:first-child{color:#4ade80;font-weight:900;}',
      '.ovc-eur-table tr.rebaixa{border-left-color:#ef4444;}',
      '.ovc-eur-table tr.rebaixa td:first-child{color:#f87171;font-weight:900;}',
      '.ovc-eur-team-cell{display:flex;align-items:center;gap:6px;}',
      '.ovc-eur-pts{font-weight:900;color:#fff !important;}',
      '.ovc-eur-art{position:relative;display:flex;align-items:center;gap:9px;padding:9px 4px;border-bottom:1px solid #1a1f2c;font-size:12.5px;overflow:hidden;}',
      '.ovc-eur-art:last-child{border-bottom:none;}',
      '.ovc-eur-art-bar{position:absolute;left:37px;right:70px;bottom:0;height:2px;background:' + ACC + ';border-radius:2px;opacity:.35;}',
      '.ovc-eur-art-rank{width:22px;font-weight:800;color:rgba(255,255,255,.35);font-size:11px;text-align:center;flex-shrink:0;}',
      '.ovc-eur-art-rank.top{color:' + ACC + ';}',
      '.ovc-eur-art-name{flex:1;min-width:0;font-weight:700;color:#e2e8f0;}',
      '.ovc-eur-art-team{font-size:10px;color:rgba(255,255,255,.4);display:flex;align-items:center;gap:4px;}',
      '.ovc-eur-art-team .ovc-eur-badge,.ovc-eur-art-team .ovc-eur-badge-ph{width:13px;height:13px;}',
      '.ovc-eur-art-gols{font-weight:900;color:' + ACC + ';font-size:13px;flex-shrink:0;}',
      '.ovc-eur-news{border-top:1px solid #1f2430;padding:16px 18px;background:#0b0e14;}',
      '.ovc-eur-news h4{font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.45);margin:0 0 10px;}',
      '.ovc-eur-news a{display:block;padding:9px 0;border-bottom:1px solid #1a1f2c;text-decoration:none;font-size:13px;',
        'font-weight:700;color:#e2e8f0;line-height:1.4;transition:color .15s,padding-left .15s;}',
      '.ovc-eur-news a:last-child{border-bottom:none;}',
      '.ovc-eur-news a:hover{color:' + ACC + ';padding-left:5px;}',
    ].join('');
    document.head.appendChild(sty);
  }

  function renderMatch(p) {
    var scoreHtml = p.status === 'agendado'
      ? '<span class="ovc-eur-meta">' + dataBr(p.data) + '</span>'
      : '<span class="ovc-eur-score">' + p.home.placar + ' - ' + p.away.placar + (p.status === 'ao_vivo' ? ' ●' : '') + '</span>';
    return '<div class="ovc-eur-match">' +
      '<div class="ovc-eur-match-side">' + escudoImg(p.home.escudo) + '<span class="ovc-eur-team">' + esc(p.home.nome) + '</span></div>' +
      scoreHtml +
      '<div class="ovc-eur-match-side away">' + escudoImg(p.away.escudo) + '<span class="ovc-eur-team">' + esc(p.away.nome) + '</span></div>' +
      '</div>';
  }

  function renderMatches(partidas) {
    if (!partidas.length) return '<div class="ovc-eur-empty">Nenhum jogo agendado no momento</div>';
    var aoVivo = partidas.filter(function (p) { return p.status === 'ao_vivo'; });
    var encerrados = partidas.filter(function (p) { return p.status === 'encerrado'; }).slice(0, 6);
    var proximos = partidas.filter(function (p) { return p.status === 'agendado'; }).slice(0, 8);
    var html = '';
    if (aoVivo.length) html += '<div class="ovc-eur-subhd">🔴 Ao vivo agora</div>' + aoVivo.map(renderMatch).join('');
    if (proximos.length) html += '<div class="ovc-eur-subhd">Próximos jogos</div>' + proximos.map(renderMatch).join('');
    if (encerrados.length) html += '<div class="ovc-eur-subhd">Resultados recentes</div>' + encerrados.map(renderMatch).join('');
    return html || '<div class="ovc-eur-empty">Nenhum jogo agendado no momento</div>';
  }

  function renderLeaders(grupos) {
    if (!grupos.length) return '';
    var times = grupos[0].times || [];
    if (times.length < 3) return '';
    var ord = [1, 0, 2];
    return '<div class="ovc-eur-leaders"><div class="ovc-eur-leaders-row">' + ord.map(function (i) {
      var t = times[i];
      if (!t) return '';
      var cls = ['p2', 'p1', 'p3'][ord.indexOf(i)];
      return '<div class="ovc-eur-leader ' + cls + '">' +
        escudoImg(t.escudo, 'ovc-eur-leader-badge') +
        '<div class="ovc-eur-leader-nome">' + esc(t.nome) + '</div>' +
        '<div class="ovc-eur-leader-bar"><span><span class="n">' + (i + 1) + 'º</span><span class="p">' + t.pts + '</span></span></div>' +
        '</div>';
    }).join('') + '</div></div>';
  }

  function renderTable(times) {
    var n = times.length;
    return '<table class="ovc-eur-table"><thead><tr><th>#</th><th>Time</th><th>Pts</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th></tr></thead><tbody>' +
      times.map(function (t, i) {
        var rebaixa = n >= 10 && i >= n - 3;
        return '<tr' + (rebaixa ? ' class="rebaixa"' : '') + '><td>' + (i + 1) + '</td>' +
          '<td><div class="ovc-eur-team-cell">' + escudoImg(t.escudo) + '<span>' + esc(t.nome) + '</span></div></td>' +
          '<td class="ovc-eur-pts">' + t.pts + '</td><td>' + t.pj + '</td><td>' + t.v + '</td><td>' + t.e + '</td><td>' + t.d + '</td><td>' + t.sg + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  function renderStandings(grupos) {
    if (!grupos.length) return '<div class="ovc-eur-empty">Classificação disponível após o início da temporada</div>';
    var leaders = renderLeaders(grupos);
    if (grupos.length === 1) return leaders + renderTable(grupos[0].times);
    return leaders + '<div class="ovc-eur-groups">' + grupos.map(function (g) {
      return '<div class="ovc-eur-gcard"><div class="ovc-eur-gcard-hd">' + esc(g.nome) + '</div>' + renderTable(g.times) + '</div>';
    }).join('') + '</div>';
  }

  function renderArtilheiros(scorers) {
    if (!scorers.length) return '<div class="ovc-eur-empty">Artilharia disponível após o início dos jogos</div>';
    var maxG = Math.max.apply(null, scorers.slice(0, 12).map(function (s) { return s.gols || 0; })) || 1;
    return scorers.slice(0, 12).map(function (s, i) {
      var pct = Math.max(6, Math.round((s.gols || 0) / maxG * 100));
      return '<div class="ovc-eur-art">' +
        '<span class="ovc-eur-art-bar" style="width:' + pct + '%;"></span>' +
        '<span class="ovc-eur-art-rank' + (i < 3 ? ' top' : '') + '">' + (i + 1) + 'º</span>' +
        '<div style="flex:1;min-width:0;position:relative;"><div class="ovc-eur-art-name">' + esc(s.nome) + '</div><div class="ovc-eur-art-team">' + escudoImg(s.escudo) + '<span>' + esc(s.time) + '</span></div></div>' +
        '<span class="ovc-eur-art-gols" style="position:relative;">' + s.gols + ' ⚽</span>' +
        '</div>';
    }).join('');
  }

  function renderStatsStrip(liga) {
    var stats = liga.stats || [];
    if (!stats.length) return '';
    return '<div class="ovc-eur-stats">' + stats.map(function (s) {
      return '<div class="ovc-eur-stat"><span class="ovc-eur-stat-n">' + esc(s.n) + '</span><span class="ovc-eur-stat-l">' + esc(s.l) + '</span></div>';
    }).join('') + '</div>';
  }

  function fetchLiga(code) {
    if (cache[code]) return Promise.resolve(cache[code]);
    return fetch('/api/live?action=espn&liga=' + encodeURIComponent(code), { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var dados = (!d || !d.ok) ? { partidas: [], grupos: [], artilheiros: [] } :
          { partidas: d.partidas || [], grupos: d.grupos || [], artilheiros: d.artilheiros || [] };
        cache[code] = dados;
        return dados;
      })
      .catch(function () { return { partidas: [], grupos: [], artilheiros: [] }; });
  }

  function ligaObj(code) {
    return CFG.ligas.filter(function (x) { return x.code === code; })[0] || { code: code, nome: code };
  }

  function renderBody(root, dados) {
    var body = root.querySelector('.ovc-eur-body');
    if (!body) return;
    if (tabAtual === 'jogos') body.innerHTML = renderMatches(dados.partidas);
    else if (tabAtual === 'tabela') body.innerHTML = renderStandings(dados.grupos);
    else body.innerHTML = renderArtilheiros(dados.artilheiros);
  }

  function carregar(root) {
    var body = root.querySelector('.ovc-eur-body');
    if (body) body.innerHTML = '<div class="ovc-eur-empty">Carregando…</div>';
    var liga = ligaObj(ligaAtual);
    fetchLiga(ligaAtual).then(function (dados) {
      root.querySelector('.ovc-eur-hd-title').textContent = liga.nome;
      var statsEl = root.querySelector('.ovc-eur-stats-mount');
      if (statsEl) statsEl.outerHTML = '<div class="ovc-eur-stats-mount">' + renderStatsStrip(liga) + '</div>';
      renderBody(root, dados);
    });
  }

  function montarDashboard() {
    injetarCSS();
    var wrap = document.createElement('div');
    wrap.className = 'ovc-eur-wrap';
    var ligaIni = ligaObj(ligaAtual);
    wrap.innerHTML =
      '<div class="ovc-eur-hd"><div class="ovc-eur-stripe"></div><div class="ovc-eur-sweep"></div>' +
      '<div class="ovc-eur-hd-live"><span class="ovc-eur-dot"></span><span class="ovc-eur-hd-txt">Dados ao vivo · ESPN</span></div>' +
      '<div class="ovc-eur-hd-title">' + esc(ligaIni.nome) + '</div>' +
      '</div>' +
      '<div class="ovc-eur-stats-mount">' + renderStatsStrip(ligaIni) + '</div>' +
      '<div class="ovc-eur-ligas">' + CFG.ligas.map(function (l) {
        return '<button class="ovc-eur-liga-btn' + (l.code === ligaAtual ? ' active' : '') + '" data-liga="' + esc(l.code) + '">' + esc(l.nome) + '</button>';
      }).join('') + '</div>' +
      '<div class="ovc-eur-tabs">' +
      '<button class="ovc-eur-tab active" data-tab="jogos">Jogos</button>' +
      '<button class="ovc-eur-tab" data-tab="tabela">Classificação</button>' +
      '<button class="ovc-eur-tab" data-tab="artilheiros">Artilheiros</button>' +
      '</div>' +
      '<div class="ovc-eur-body"><div class="ovc-eur-empty">Carregando…</div></div>' +
      '<div class="ovc-eur-news" id="ovc-eur-news"><h4>Notícias do mercado europeu</h4><div id="ovc-eur-news-list"><div class="ovc-eur-empty">Carregando…</div></div></div>';

    wrap.querySelectorAll('.ovc-eur-liga-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        ligaAtual = btn.dataset.liga;
        wrap.querySelectorAll('.ovc-eur-liga-btn').forEach(function (b) { b.classList.toggle('active', b === btn); });
        carregar(wrap);
      });
    });
    wrap.querySelectorAll('.ovc-eur-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        tabAtual = btn.dataset.tab;
        wrap.querySelectorAll('.ovc-eur-tab').forEach(function (b) { b.classList.toggle('active', b === btn); });
        fetchLiga(ligaAtual).then(function (dados) { renderBody(wrap, dados); });
      });
    });
    return wrap;
  }

  function montarNoticias(artigos) {
    var list = document.getElementById('ovc-eur-news-list');
    if (!list) return;
    if (!artigos.length) { list.innerHTML = '<div class="ovc-eur-empty">Cobertura chegando em breve.</div>'; return; }
    list.innerHTML = artigos.slice(0, 8).map(function (p) {
      return '<a href="' + buildHref(p) + '">' + esc(p.titulo) + '</a>';
    }).join('');
  }

  function fetchNoticias() {
    var kw = CFG.keywords || [];
    Promise.all([
      fetch('/api/portal-posts?curtinhas=true&categoria=esportes&limit=30').then(function (r) { return r.json(); }).catch(function () { return { curtinhas: [] }; }),
      fetch('/api/portal-posts?recentes=true&limit=300').then(function (r) { return r.json(); }).catch(function () { return { posts: [] }; })
    ]).then(function (results) {
      var todos = (results[0].curtinhas || []).concat(results[1].posts || []);
      var vistos = {};
      var filtrados = todos.filter(function (p) {
        if (vistos[p.id]) return false;
        if (p.categoria && p.categoria !== 'esportes') return false;
        // busca no título E no resumo — manchete reescrita pela IA nem sempre
        // preserva a palavra-chave literal (ex: nome do campeonato)
        var t = ((p.titulo || '') + ' ' + (p.resumo || p.comentario_fixado || '')).toLowerCase();
        var ok = kw.some(function (k) { return kwMatch(t, k); });
        if (ok) vistos[p.id] = true;
        return ok;
      });
      montarNoticias(filtrados);
    }).catch(function () { montarNoticias([]); });
  }

  function init() {
    var alvo = document.getElementById('ovc-europa-dash');
    if (!alvo) return;
    var wrap = montarDashboard();
    alvo.innerHTML = '';
    alvo.appendChild(wrap);
    carregar(wrap);
    fetchNoticias();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
