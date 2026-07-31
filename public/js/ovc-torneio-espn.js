/**
 * ovc-torneio-espn.js — Dashboard premium de torneio ao vivo (dados ESPN, tempo real)
 * REGRA ZERO-I: 100% independente — não toca internal-page-v2.js nem home.js
 * Compartilhado por: Brasileirão Série A, Série B, Libertadores, Sul-Americana
 * Config por página via window.OVC_TORNEIO = {liga, nome, keywords[], cor, corDark, stats[], sobre}
 * Fonte de dados: ESPN (scoreboard, standings, leaders) via proxy server-side
 * em api/live.js?action=espn — evita bloqueio de CORS do fetch direto no navegador
 */
(function () {
  'use strict';

  var CFG = window.OVC_TORNEIO;
  if (!CFG || !CFG.liga) return;

  var ACC = CFG.cor || '#dc2626';
  var ACC_DARK = CFG.corDark || '#0f172a';

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function kwMatch(text, kw) {
    var escKw = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(?:^|[^\\p{L}\\p{N}])' + escKw + '(?:[^\\p{L}\\p{N}]|$)', 'iu').test(text);
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
  function escudoImg(url, alt) {
    if (!url) return '<span class="ovc-trn-badge-ph"></span>';
    return '<img class="ovc-trn-badge" src="' + esc(url) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.outerHTML=\'<span class=&quot;ovc-trn-badge-ph&quot;></span>\'">';
  }

  function injetarCSS() {
    if (document.getElementById('ovc-trn-css')) return;
    var sty = document.createElement('style');
    sty.id = 'ovc-trn-css';
    sty.textContent = [
      '.ovc-trn-wrap{margin:18px 0;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:var(--bg-elevated,#fff);}',
      '.ovc-trn-hd{background:linear-gradient(135deg,' + ACC_DARK + ' 0%,#1e293b 60%,' + ACC + ' 140%);padding:16px 18px;}',
      '.ovc-trn-hd-live{display:flex;align-items:center;gap:6px;margin-bottom:4px;}',
      '.ovc-trn-dot{width:8px;height:8px;background:#fbbf24;border-radius:50%;animation:trn-pulse 1s ease-in-out infinite;flex-shrink:0;}',
      '@keyframes trn-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}',
      '.ovc-trn-hd-txt{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#fbbf24;}',
      '.ovc-trn-hd-title{font-size:18px;font-weight:800;color:#fff;letter-spacing:-.01em;}',
      '.ovc-trn-hd-sobre{font-size:11.5px;color:rgba(255,255,255,.72);margin-top:5px;line-height:1.5;max-width:640px;}',
      '.ovc-trn-stats{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;background:#0f172a;}',
      '.ovc-trn-stat{text-align:center;padding:9px 4px;border-right:1px solid rgba(255,255,255,.08);}',
      '.ovc-trn-stat:last-child{border-right:none;}',
      '.ovc-trn-stat-n{display:block;font-size:16px;font-weight:900;color:#fbbf24;line-height:1;}',
      '.ovc-trn-stat-l{display:block;font-size:8px;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:.05em;margin-top:2px;}',
      '.ovc-trn-tabs{display:flex;border-bottom:1px solid #e5e7eb;background:#f8fafc;}',
      '.ovc-trn-tab{flex:1;padding:10px 8px;text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#64748b;cursor:pointer;border-bottom:2px solid transparent;background:none;border-top:none;border-left:none;border-right:none;}',
      '.ovc-trn-tab.active{color:' + ACC + ';border-bottom-color:' + ACC + ';background:#fff;}',
      '.ovc-trn-body{display:none;padding:14px 16px;}',
      '.ovc-trn-body.active{display:block;}',
      '.ovc-trn-subhd{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;margin:0 0 8px;padding-top:4px;}',
      '.ovc-trn-subhd:first-child{padding-top:0;}',
      '.ovc-trn-badge{width:20px;height:20px;object-fit:contain;flex-shrink:0;}',
      '.ovc-trn-badge-ph{width:20px;height:20px;border-radius:3px;background:#e5e7eb;flex-shrink:0;display:inline-block;}',
      '.ovc-trn-match{display:flex;align-items:center;justify-content:space-between;padding:8px 4px;border-bottom:1px solid #f1f5f9;font-size:12px;}',
      '.ovc-trn-match:last-child{border-bottom:none;}',
      '.ovc-trn-match-side{display:flex;align-items:center;gap:6px;flex:1;min-width:0;}',
      '.ovc-trn-match-side.away{justify-content:flex-end;text-align:right;flex-direction:row-reverse;}',
      '.ovc-trn-team{font-weight:600;color:var(--text-main,#0f172a);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.ovc-trn-score{font-weight:800;font-size:13px;padding:0 10px;color:' + ACC + ';white-space:nowrap;}',
      '.ovc-trn-meta{font-size:9px;color:#94a3b8;text-align:center;min-width:56px;}',
      '.ovc-trn-empty{padding:18px 4px;text-align:center;color:#94a3b8;font-size:12px;}',
      '.ovc-trn-groups{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;}',
      '.ovc-trn-gcard{border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;}',
      '.ovc-trn-gcard-hd{background:' + ACC_DARK + ';color:#fff;padding:6px 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;}',
      '.ovc-trn-table{width:100%;border-collapse:collapse;font-size:11px;}',
      '.ovc-trn-table th{background:#f8fafc;color:#64748b;text-transform:uppercase;font-size:8px;font-weight:700;padding:5px 4px;text-align:center;border-bottom:1px solid #e5e7eb;}',
      '.ovc-trn-table th:nth-child(2){text-align:left;}',
      '.ovc-trn-table td{padding:5px 4px;text-align:center;border-bottom:1px solid #f3f4f6;color:#374151;}',
      '.ovc-trn-table td:nth-child(2){text-align:left;font-weight:600;}',
      '.ovc-trn-table tr:last-child td{border-bottom:none;}',
      '.ovc-trn-table tr:nth-child(-n+4) td:first-child{color:#059669;font-weight:800;}',
      '.ovc-trn-table tr.rebaixa td:first-child{color:#dc2626;font-weight:800;}',
      '.ovc-trn-team-cell{display:flex;align-items:center;gap:6px;}',
      '.ovc-trn-pts{font-weight:900;color:#0f172a !important;}',
      '.ovc-trn-art{display:flex;align-items:center;gap:8px;padding:7px 4px;border-bottom:1px solid #f1f5f9;font-size:12px;}',
      '.ovc-trn-art:last-child{border-bottom:none;}',
      '.ovc-trn-art-rank{width:22px;font-weight:800;color:#94a3b8;font-size:11px;text-align:center;flex-shrink:0;}',
      '.ovc-trn-art-rank.top{color:' + ACC + ';}',
      '.ovc-trn-art-name{flex:1;min-width:0;font-weight:600;color:var(--text-main,#0f172a);}',
      '.ovc-trn-art-team{font-size:10px;color:#94a3b8;display:flex;align-items:center;gap:4px;}',
      '.ovc-trn-art-team .ovc-trn-badge,.ovc-trn-art-team .ovc-trn-badge-ph{width:13px;height:13px;}',
      '.ovc-trn-art-gols{font-weight:800;color:' + ACC + ';font-size:13px;flex-shrink:0;}',
      '.ovc-trn-news{border-top:1px solid #e5e7eb;padding:12px 16px;}',
      '.ovc-trn-news h4{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin:0 0 8px;}',
      '.ovc-trn-news a{display:block;padding:7px 0;border-bottom:1px solid #f1f5f9;text-decoration:none;font-size:13px;font-weight:600;color:var(--text-main,#0f172a);line-height:1.4;}',
      '.ovc-trn-news a:last-child{border-bottom:none;}',
      '.ovc-trn-news a:hover{color:' + ACC + ';}',
    ].join('');
    document.head.appendChild(sty);
  }

  function renderStatsStrip() {
    var stats = CFG.stats || [];
    if (!stats.length) return '';
    return '<div class="ovc-trn-stats">' + stats.map(function (s) {
      return '<div class="ovc-trn-stat"><span class="ovc-trn-stat-n">' + esc(s.n) + '</span><span class="ovc-trn-stat-l">' + esc(s.l) + '</span></div>';
    }).join('') + '</div>';
  }

  function renderMatch(p) {
    var scoreHtml = p.status === 'agendado'
      ? '<span class="ovc-trn-meta">' + dataBr(p.data) + '</span>'
      : '<span class="ovc-trn-score">' + p.home.placar + ' - ' + p.away.placar + (p.status === 'ao_vivo' ? ' ●' : '') + '</span>';
    return '<div class="ovc-trn-match">' +
      '<div class="ovc-trn-match-side">' + escudoImg(p.home.escudo) + '<span class="ovc-trn-team">' + esc(p.home.nome) + '</span></div>' +
      scoreHtml +
      '<div class="ovc-trn-match-side away">' + escudoImg(p.away.escudo) + '<span class="ovc-trn-team">' + esc(p.away.nome) + '</span></div>' +
      '</div>';
  }

  function renderMatches(partidas) {
    if (!partidas.length) return '<div class="ovc-trn-empty">Nenhum jogo agendado no momento</div>';
    var aoVivo = partidas.filter(function (p) { return p.status === 'ao_vivo'; });
    var encerrados = partidas.filter(function (p) { return p.status === 'encerrado'; }).slice(0, 6);
    var proximos = partidas.filter(function (p) { return p.status === 'agendado'; }).slice(0, 8);
    var html = '';
    if (aoVivo.length) html += '<div class="ovc-trn-subhd">🔴 Ao vivo agora</div>' + aoVivo.map(renderMatch).join('');
    if (proximos.length) html += '<div class="ovc-trn-subhd">Próximos jogos</div>' + proximos.map(renderMatch).join('');
    if (encerrados.length) html += '<div class="ovc-trn-subhd">Resultados recentes</div>' + encerrados.map(renderMatch).join('');
    return html || '<div class="ovc-trn-empty">Nenhum jogo agendado no momento</div>';
  }

  function renderStandings(grupos) {
    if (!grupos.length) return '<div class="ovc-trn-empty">Classificação disponível após o início da temporada</div>';
    if (grupos.length === 1) return renderTable(grupos[0].times);
    return '<div class="ovc-trn-groups">' + grupos.map(function (g) {
      return '<div class="ovc-trn-gcard"><div class="ovc-trn-gcard-hd">' + esc(g.nome) + '</div>' + renderTable(g.times) + '</div>';
    }).join('') + '</div>';
  }

  function renderTable(times) {
    var n = times.length;
    var simples = !!CFG.tabelaSimples;
    if (simples) {
      return '<table class="ovc-trn-table"><thead><tr><th>#</th><th>Time</th><th>V</th><th>D</th><th>%</th></tr></thead><tbody>' +
        times.map(function (t, i) {
          return '<tr><td>' + (i + 1) + '</td>' +
            '<td><div class="ovc-trn-team-cell">' + escudoImg(t.escudo) + '<span>' + esc(t.nome) + '</span></div></td>' +
            '<td>' + t.v + '</td><td>' + t.d + '</td><td>' + (t.pct ? (t.pct * 100).toFixed(1).replace('.', ',') + '%' : '—') + '</td></tr>';
        }).join('') + '</tbody></table>';
    }
    return '<table class="ovc-trn-table"><thead><tr><th>#</th><th>Time</th><th>Pts</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th></tr></thead><tbody>' +
      times.map(function (t, i) {
        var rebaixa = !CFG.semRebaixamento && n >= 10 && i >= n - 4;
        return '<tr' + (rebaixa ? ' class="rebaixa"' : '') + '><td>' + (i + 1) + '</td>' +
          '<td><div class="ovc-trn-team-cell">' + escudoImg(t.escudo) + '<span>' + esc(t.nome) + '</span></div></td>' +
          '<td class="ovc-trn-pts">' + t.pts + '</td><td>' + t.pj + '</td><td>' + t.v + '</td><td>' + t.e + '</td><td>' + t.d + '</td><td>' + t.sg + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  function renderArtilheiros(scorers) {
    var unidade = CFG.statUnit || 'gols';
    var emoji = CFG.statEmoji || '⚽';
    if (!scorers.length) return '<div class="ovc-trn-empty">' + (CFG.statTabLabel || 'Artilharia') + ' disponível após o início dos jogos</div>';
    return scorers.slice(0, 12).map(function (s, i) {
      return '<div class="ovc-trn-art">' +
        '<span class="ovc-trn-art-rank' + (i < 3 ? ' top' : '') + '">' + (i + 1) + 'º</span>' +
        '<div style="flex:1;min-width:0;"><div class="ovc-trn-art-name">' + esc(s.nome) + '</div><div class="ovc-trn-art-team">' + escudoImg(s.escudo) + '<span>' + esc(s.time) + '</span></div></div>' +
        '<span class="ovc-trn-art-gols">' + s.gols + ' ' + unidade + ' ' + emoji + '</span>' +
        '</div>';
    }).join('');
  }

  // Busca via proxy server-side (api/live.js?action=espn) — evita CORS do fetch direto no navegador para site.api.espn.com
  function fetchDados() {
    return fetch('/api/live?action=espn&sport=' + encodeURIComponent(CFG.sport || 'soccer') + '&liga=' + encodeURIComponent(CFG.liga), { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.ok) return { partidas: [], grupos: [], artilheiros: [] };
        return { partidas: d.partidas || [], grupos: d.grupos || [], artilheiros: d.artilheiros || [] };
      })
      .catch(function () { return { partidas: [], grupos: [], artilheiros: [] }; });
  }

  function switchTab(tab, root) {
    root.querySelectorAll('.ovc-trn-tab').forEach(function (el) { el.classList.toggle('active', el.dataset.tab === tab); });
    root.querySelectorAll('.ovc-trn-body').forEach(function (el) { el.classList.toggle('active', el.dataset.body === tab); });
  }

  function montarDashboard(dados) {
    injetarCSS();
    var wrap = document.createElement('div');
    wrap.className = 'ovc-trn-wrap';
    wrap.innerHTML =
      '<div class="ovc-trn-hd">' +
      '<div class="ovc-trn-hd-live"><span class="ovc-trn-dot"></span><span class="ovc-trn-hd-txt">Dados ao vivo · ESPN</span></div>' +
      '<div class="ovc-trn-hd-title">' + esc(CFG.nome) + '</div>' +
      (CFG.sobre ? '<div class="ovc-trn-hd-sobre">' + esc(CFG.sobre) + '</div>' : '') +
      '</div>' +
      renderStatsStrip() +
      '<div class="ovc-trn-tabs">' +
      '<button class="ovc-trn-tab active" data-tab="jogos">Jogos</button>' +
      '<button class="ovc-trn-tab" data-tab="tabela">Classificação</button>' +
      '<button class="ovc-trn-tab" data-tab="artilheiros">' + esc(CFG.statTabLabel || 'Artilheiros') + '</button>' +
      '</div>' +
      '<div class="ovc-trn-body active" data-body="jogos">' + renderMatches(dados.partidas) + '</div>' +
      '<div class="ovc-trn-body" data-body="tabela">' + renderStandings(dados.grupos) + '</div>' +
      '<div class="ovc-trn-body" data-body="artilheiros">' + renderArtilheiros(dados.artilheiros) + '</div>' +
      '<div class="ovc-trn-news" id="ovc-trn-news"><h4>Notícias do torneio</h4><div id="ovc-trn-news-list"><div class="ovc-trn-empty">Carregando…</div></div></div>';

    wrap.querySelectorAll('.ovc-trn-tab').forEach(function (btn) {
      btn.addEventListener('click', function () { switchTab(btn.dataset.tab, wrap); });
    });
    return wrap;
  }

  function montarNoticias(artigos) {
    var list = document.getElementById('ovc-trn-news-list');
    if (!list) return;
    if (!artigos.length) { list.innerHTML = '<div class="ovc-trn-empty">Cobertura chegando em breve.</div>'; return; }
    list.innerHTML = artigos.slice(0, 8).map(function (p) {
      return '<a href="' + buildHref(p) + '">' + esc(p.titulo) + '</a>';
    }).join('');
  }

  function renderHeroFutebol(p) {
    var url = buildHref(p);
    var bg = p.imagem ? "background:url('" + p.imagem + "') center/cover no-repeat;" : 'background:' + ACC + ';';
    return '<a href="' + url + '" style="display:block;text-decoration:none;border-radius:12px;overflow:hidden;position:relative;min-height:260px;' + bg + '">'
      + '<div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.88) 0%,rgba(0,0,0,.35) 55%,rgba(0,0,0,.05) 100%);"></div>'
      + '<div style="position:absolute;bottom:0;left:0;right:0;padding:20px 22px;">'
      + '<span style="display:inline-block;background:' + ACC + ';color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;padding:3px 10px;border-radius:4px;margin-bottom:10px;">' + esc(CFG.nome) + '</span>'
      + '<h2 style="font-size:20px;font-weight:900;line-height:1.22;color:#fff;margin:0;text-shadow:0 2px 8px rgba(0,0,0,.5);">' + esc(p.titulo) + '</h2>'
      + '</div></a>';
  }

  function renderCardFutebol(p) {
    var url = buildHref(p);
    var img = p.imagem
      ? '<div style="width:84px;min-width:84px;height:68px;border-radius:8px;overflow:hidden;flex-shrink:0;"><img src="' + esc(p.imagem) + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.parentElement.style.display=\'none\'"></div>'
      : '<div style="width:84px;min-width:84px;height:68px;border-radius:8px;background:' + ACC + '18;flex-shrink:0;display:flex;align-items:center;justify-content:center;"><span style="color:' + ACC + ';font-size:10px;font-weight:900;">OVC</span></div>';
    return '<a href="' + url + '" style="display:flex;gap:12px;align-items:flex-start;text-decoration:none;color:inherit;padding:12px 0;border-top:1px solid #f1f5f9;">'
      + img
      + '<div style="flex:1;min-width:0;"><h4 style="font-size:13px;font-weight:700;line-height:1.35;margin:0 0 4px;color:#0f172a;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + esc(p.titulo) + '</h4><span style="font-size:11px;color:#94a3b8;">Redação OVC</span></div>'
      + '</a>';
  }

  // Popula o esqueleto padrão de categoria (data-hero-card/data-main-list/data-local-list)
  // herdado do template — cada painel some quando não há conteúdo, nunca fica em branco.
  function montarListas(artigos) {
    var heroEl = document.querySelector('[data-hero-card]');
    if (heroEl) {
      if (artigos[0]) { heroEl.innerHTML = renderHeroFutebol(artigos[0]); heroEl.style.display = ''; }
      else heroEl.style.display = 'none';
    }
    var resto = artigos.slice(1);
    var mainEl = document.querySelector('[data-main-list]');
    if (mainEl) {
      var mainWrap = mainEl.closest('.ovc-story-list');
      var principais = resto.slice(0, 5);
      if (principais.length) { mainEl.innerHTML = principais.map(renderCardFutebol).join(''); if (mainWrap) mainWrap.style.display = ''; }
      else if (mainWrap) mainWrap.style.display = 'none';
    }
    var localEl = document.querySelector('[data-local-list]');
    if (localEl) {
      var localWrap = localEl.closest('.ovc-story-list');
      var mais = resto.slice(5, 10);
      if (mais.length) { localEl.innerHTML = mais.map(renderCardFutebol).join(''); if (localWrap) localWrap.style.display = ''; }
      else if (localWrap) localWrap.style.display = 'none';
    }
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
      montarListas(filtrados);
    }).catch(function () { montarNoticias([]); montarListas([]); });
  }

  function init() {
    var alvo = document.getElementById('ovc-torneio-dash');
    if (!alvo) return;
    alvo.innerHTML = '<div class="ovc-trn-wrap"><div class="ovc-trn-body active" style="display:block;"><div class="ovc-trn-empty">Carregando dados ao vivo…</div></div></div>';
    fetchDados().then(function (dados) {
      alvo.innerHTML = '';
      alvo.appendChild(montarDashboard(dados));
      fetchNoticias();
    }).catch(function () {
      alvo.innerHTML = '<div class="ovc-trn-wrap"><div class="ovc-trn-body active" style="display:block;"><div class="ovc-trn-empty">Não foi possível carregar os dados agora.</div></div></div>';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
