/**
 * ovc-futebol-europeu.js — Dashboard premium multi-liga (Champions + principais ligas europeias)
 * REGRA ZERO-I: 100% independente — não toca internal-page-v2.js nem home.js
 * Config via window.OVC_EUROPA = {ligas:[{code,nome,stats[]}], keywords[], cor, corDark}
 * Fonte de dados: ESPN (scoreboard, standings, leaders) via proxy server-side em api/live.js?action=espn
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
  var ACC_DARK = CFG.corDark || '#0c1e4e';
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
  function escudoImg(url) {
    if (!url) return '<span class="ovc-eur-badge-ph"></span>';
    return '<img class="ovc-eur-badge" src="' + esc(url) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.outerHTML=\'<span class=&quot;ovc-eur-badge-ph&quot;></span>\'">';
  }

  function injetarCSS() {
    if (document.getElementById('ovc-eur-css')) return;
    var sty = document.createElement('style');
    sty.id = 'ovc-eur-css';
    sty.textContent = [
      '.ovc-eur-wrap{margin:18px 0;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:var(--bg-elevated,#fff);}',
      '.ovc-eur-hd{background:linear-gradient(135deg,' + ACC_DARK + ' 0%,#1e293b 60%,' + ACC + ' 140%);padding:14px 18px;}',
      '.ovc-eur-hd-live{display:flex;align-items:center;gap:6px;margin-bottom:4px;}',
      '.ovc-eur-dot{width:8px;height:8px;background:#38bdf8;border-radius:50%;animation:eur-pulse 1s ease-in-out infinite;flex-shrink:0;}',
      '@keyframes eur-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}',
      '.ovc-eur-hd-txt{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#93c5fd;}',
      '.ovc-eur-hd-title{font-size:17px;font-weight:800;color:#fff;letter-spacing:-.01em;}',
      '.ovc-eur-stats{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;background:#0c1e4e;}',
      '.ovc-eur-stat{text-align:center;padding:9px 4px;border-right:1px solid rgba(255,255,255,.08);}',
      '.ovc-eur-stat:last-child{border-right:none;}',
      '.ovc-eur-stat-n{display:block;font-size:16px;font-weight:900;color:#38bdf8;line-height:1;}',
      '.ovc-eur-stat-l{display:block;font-size:8px;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:.05em;margin-top:2px;}',
      '.ovc-eur-ligas{display:flex;flex-wrap:wrap;gap:6px;padding:10px 14px;background:#f8fafc;border-bottom:1px solid #e5e7eb;}',
      '.ovc-eur-liga-btn{padding:6px 12px;border-radius:16px;font-size:11px;font-weight:700;color:#475569;background:#fff;border:1px solid #e2e8f0;cursor:pointer;}',
      '.ovc-eur-liga-btn.active{color:#fff;background:' + ACC + ';border-color:' + ACC + ';}',
      '.ovc-eur-tabs{display:flex;border-bottom:1px solid #e5e7eb;background:#f8fafc;}',
      '.ovc-eur-tab{flex:1;padding:9px 8px;text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#64748b;cursor:pointer;border-bottom:2px solid transparent;background:none;border-top:none;border-left:none;border-right:none;}',
      '.ovc-eur-tab.active{color:' + ACC + ';border-bottom-color:' + ACC + ';background:#fff;}',
      '.ovc-eur-body{padding:14px 16px;min-height:80px;}',
      '.ovc-eur-subhd{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;margin:0 0 8px;padding-top:4px;}',
      '.ovc-eur-subhd:first-child{padding-top:0;}',
      '.ovc-eur-badge{width:20px;height:20px;object-fit:contain;flex-shrink:0;}',
      '.ovc-eur-badge-ph{width:20px;height:20px;border-radius:3px;background:#e5e7eb;flex-shrink:0;display:inline-block;}',
      '.ovc-eur-match{display:flex;align-items:center;justify-content:space-between;padding:8px 4px;border-bottom:1px solid #f1f5f9;font-size:12px;}',
      '.ovc-eur-match:last-child{border-bottom:none;}',
      '.ovc-eur-match-side{display:flex;align-items:center;gap:6px;flex:1;min-width:0;}',
      '.ovc-eur-match-side.away{justify-content:flex-end;text-align:right;flex-direction:row-reverse;}',
      '.ovc-eur-team{font-weight:600;color:var(--text-main,#0f172a);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.ovc-eur-score{font-weight:800;font-size:13px;padding:0 10px;color:' + ACC + ';white-space:nowrap;}',
      '.ovc-eur-meta{font-size:9px;color:#94a3b8;text-align:center;min-width:56px;}',
      '.ovc-eur-empty{padding:18px 4px;text-align:center;color:#94a3b8;font-size:12px;}',
      '.ovc-eur-groups{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;}',
      '.ovc-eur-gcard{border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;}',
      '.ovc-eur-gcard-hd{background:' + ACC_DARK + ';color:#fff;padding:6px 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;}',
      '.ovc-eur-table{width:100%;border-collapse:collapse;font-size:11px;}',
      '.ovc-eur-table th{background:#f8fafc;color:#64748b;text-transform:uppercase;font-size:8px;font-weight:700;padding:5px 4px;text-align:center;border-bottom:1px solid #e5e7eb;}',
      '.ovc-eur-table th:nth-child(2){text-align:left;}',
      '.ovc-eur-table td{padding:5px 4px;text-align:center;border-bottom:1px solid #f3f4f6;color:#374151;}',
      '.ovc-eur-table td:nth-child(2){text-align:left;font-weight:600;}',
      '.ovc-eur-table tr:last-child td{border-bottom:none;}',
      '.ovc-eur-table tr:nth-child(-n+4) td:first-child{color:#059669;font-weight:800;}',
      '.ovc-eur-table tr.rebaixa td:first-child{color:#dc2626;font-weight:800;}',
      '.ovc-eur-team-cell{display:flex;align-items:center;gap:6px;}',
      '.ovc-eur-pts{font-weight:900;color:#0f172a !important;}',
      '.ovc-eur-art{display:flex;align-items:center;gap:8px;padding:7px 4px;border-bottom:1px solid #f1f5f9;font-size:12px;}',
      '.ovc-eur-art:last-child{border-bottom:none;}',
      '.ovc-eur-art-rank{width:22px;font-weight:800;color:#94a3b8;font-size:11px;text-align:center;flex-shrink:0;}',
      '.ovc-eur-art-rank.top{color:' + ACC + ';}',
      '.ovc-eur-art-name{flex:1;min-width:0;font-weight:600;color:var(--text-main,#0f172a);}',
      '.ovc-eur-art-team{font-size:10px;color:#94a3b8;display:flex;align-items:center;gap:4px;}',
      '.ovc-eur-art-team .ovc-eur-badge,.ovc-eur-art-team .ovc-eur-badge-ph{width:13px;height:13px;}',
      '.ovc-eur-art-gols{font-weight:800;color:' + ACC + ';font-size:13px;flex-shrink:0;}',
      '.ovc-eur-news{border-top:1px solid #e5e7eb;padding:12px 16px;}',
      '.ovc-eur-news h4{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin:0 0 8px;}',
      '.ovc-eur-news a{display:block;padding:7px 0;border-bottom:1px solid #f1f5f9;text-decoration:none;font-size:13px;font-weight:600;color:var(--text-main,#0f172a);line-height:1.4;}',
      '.ovc-eur-news a:last-child{border-bottom:none;}',
      '.ovc-eur-news a:hover{color:' + ACC + ';}',
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
    if (grupos.length === 1) return renderTable(grupos[0].times);
    return '<div class="ovc-eur-groups">' + grupos.map(function (g) {
      return '<div class="ovc-eur-gcard"><div class="ovc-eur-gcard-hd">' + esc(g.nome) + '</div>' + renderTable(g.times) + '</div>';
    }).join('') + '</div>';
  }

  function renderArtilheiros(scorers) {
    if (!scorers.length) return '<div class="ovc-eur-empty">Artilharia disponível após o início dos jogos</div>';
    return scorers.slice(0, 12).map(function (s, i) {
      return '<div class="ovc-eur-art">' +
        '<span class="ovc-eur-art-rank' + (i < 3 ? ' top' : '') + '">' + (i + 1) + 'º</span>' +
        '<div style="flex:1;min-width:0;"><div class="ovc-eur-art-name">' + esc(s.nome) + '</div><div class="ovc-eur-art-team">' + escudoImg(s.escudo) + '<span>' + esc(s.time) + '</span></div></div>' +
        '<span class="ovc-eur-art-gols">' + s.gols + ' ⚽</span>' +
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
      '<div class="ovc-eur-hd">' +
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
        var t = (p.titulo || '').toLowerCase();
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
