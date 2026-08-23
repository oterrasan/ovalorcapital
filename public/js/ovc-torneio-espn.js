/**
 * ovc-torneio-espn.js — Painel espetacular de torneio ao vivo (dados ESPN, tempo real)
 * REGRA ZERO-I: 100% independente — não toca internal-page-v2.js nem home.js
 * Compartilhado por: Basquete, NFL, Brasileirão Série A, Série B, Libertadores, Sul-Americana
 * Config por página via window.OVC_TORNEIO = {liga, nome, keywords[], cor, corDark, stats[], sobre}
 * Fonte de dados: ESPN (scoreboard, standings, leaders) via proxy server-side
 * em api/live.js?action=espn — evita bloqueio de CORS do fetch direto no navegador
 */
(function () {
  'use strict';

  var CFG = window.OVC_TORNEIO;
  if (!CFG || !CFG.liga) return;

  var ACC = CFG.cor || '#dc2626';
  var ACC_DARK = CFG.corDark || '#0b0e14';

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
  function escudoImg(url, cls) {
    cls = cls || 'ovc-trn-badge';
    if (!url) return '<span class="' + cls + '-ph"></span>';
    return '<img class="' + cls + '" src="' + esc(url) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.outerHTML=\'<span class=&quot;' + cls + '-ph&quot;></span>\'">';
  }

  function injetarCSS() {
    if (document.getElementById('ovc-trn-css')) return;
    var sty = document.createElement('style');
    sty.id = 'ovc-trn-css';
    sty.textContent = [
      '@keyframes trn-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.7)}}',
      '@keyframes trn-sweep{0%{transform:translateX(-140%) skewX(-18deg)}100%{transform:translateX(260%) skewX(-18deg)}}',
      '@keyframes trn-rise{from{transform:scaleY(0);opacity:0}to{transform:scaleY(1);opacity:1}}',

      '.ovc-trn-wrap{margin:18px 0;border-radius:14px;overflow:hidden;background:#0b0e14;',
      '  box-shadow:0 20px 50px -20px rgba(0,0,0,.5);border:1px solid #1f2430;}',

      '.ovc-trn-hd{position:relative;overflow:hidden;padding:22px 22px 18px;',
      '  background:' + ACC_DARK + ' repeating-linear-gradient(45deg,rgba(255,255,255,.025) 0,rgba(255,255,255,.025) 1px,transparent 1px,transparent 7px);',
      '  border-bottom:3px solid ' + ACC + ';}',
      '.ovc-trn-stripe{position:absolute;top:0;right:-8%;width:55%;height:100%;',
      '  background:linear-gradient(100deg,transparent 30%,' + ACC + ' 30%,' + ACC + ' 37%,transparent 37%,transparent 45%,' + ACC + ' 45%,' + ACC + ' 49%,transparent 49%);opacity:.8;}',
      '.ovc-trn-sweep{position:absolute;top:0;left:0;width:22%;height:100%;',
      '  background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent);',
      '  animation:trn-sweep 5s ease-in-out infinite;pointer-events:none;}',
      '.ovc-trn-hd-live{display:flex;align-items:center;gap:7px;margin-bottom:8px;position:relative;}',
      '.ovc-trn-dot{width:9px;height:9px;background:#22c55e;border-radius:50%;animation:trn-pulse 1.1s ease-in-out infinite;flex-shrink:0;',
      '  box-shadow:0 0 10px 2px rgba(34,197,94,.7);}',
      '.ovc-trn-dot.live{background:#ef4444;box-shadow:0 0 10px 2px rgba(239,68,68,.7);}',
      '.ovc-trn-hd-txt{font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#22c55e;}',
      '.ovc-trn-hd-txt.live{color:#ef4444;}',
      '.ovc-trn-hd-title{font-size:24px;font-weight:900;color:#fff;letter-spacing:-.02em;line-height:1.08;font-style:italic;',
      '  position:relative;text-shadow:0 3px 14px rgba(0,0,0,.5);}',
      '.ovc-trn-hd-sobre{font-size:12px;color:rgba(255,255,255,.65);margin-top:8px;line-height:1.55;max-width:620px;position:relative;}',

      '.ovc-trn-stats{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;background:#131722;',
      '  border-top:1px solid #232838;border-bottom:1px solid #232838;}',
      '.ovc-trn-stat{text-align:center;padding:11px 4px;border-right:1px solid #1f2430;}',
      '.ovc-trn-stat:last-child{border-right:none;}',
      '.ovc-trn-stat-n{display:block;font-size:17px;font-weight:900;color:#fff;line-height:1;font-variant-numeric:tabular-nums;}',
      '.ovc-trn-stat-l{display:block;font-size:8px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em;margin-top:3px;}',

      /* Líderes — mini-pódio dos 3 primeiros da tabela */
      '.ovc-trn-leaders{padding:18px 18px 6px;background:radial-gradient(ellipse at top,#1a1f2e 0%,#0b0e14 75%);}',
      '.ovc-trn-leaders-label{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.45);margin-bottom:12px;}',
      '.ovc-trn-leaders-row{display:flex;align-items:flex-end;justify-content:center;gap:8px;}',
      '.ovc-trn-leader{flex:1;max-width:120px;text-align:center;animation:trn-rise .5s ease-out;}',
      '.ovc-trn-leader-badge{width:32px;height:32px;object-fit:contain;background:#fff;border-radius:50%;margin:0 auto 8px;display:block;padding:3px;}',
      '.ovc-trn-leader-badge-ph{width:32px;height:32px;border-radius:50%;background:#232838;margin:0 auto 8px;display:block;}',
      '.ovc-trn-leader-nome{font-size:11px;font-weight:800;color:#fff;line-height:1.25;margin-bottom:8px;',
      '  min-height:28px;display:flex;align-items:center;justify-content:center;}',
      '.ovc-trn-leader-bar{border-radius:8px 8px 0 0;display:flex;align-items:flex-start;justify-content:center;',
      '  padding-top:8px;font-weight:900;color:#fff;}',
      '.ovc-trn-leader-bar .n{font-size:12px;}',
      '.ovc-trn-leader-bar .p{display:block;font-size:16px;margin-top:2px;}',
      '.ovc-trn-leader.p1 .ovc-trn-leader-bar{height:66px;background:linear-gradient(160deg,#fbbf24,#d97706);}',
      '.ovc-trn-leader.p2 .ovc-trn-leader-bar{height:48px;background:linear-gradient(160deg,#cbd5e1,#94a3b8);}',
      '.ovc-trn-leader.p3 .ovc-trn-leader-bar{height:36px;background:linear-gradient(160deg,#d97757,#b45309);}',

      '.ovc-trn-tabs{display:flex;background:#0b0e14;border-bottom:1px solid #1f2430;}',
      '.ovc-trn-tab{flex:1;padding:12px 6px;text-align:center;font-size:10.5px;font-weight:800;text-transform:uppercase;',
      '  letter-spacing:.05em;color:rgba(255,255,255,.4);cursor:pointer;border:none;background:none;',
      '  border-bottom:2.5px solid transparent;transition:all .15s;}',
      '.ovc-trn-tab:hover{color:rgba(255,255,255,.7);}',
      '.ovc-trn-tab.active{color:#fff;border-bottom-color:' + ACC + ';}',
      '.ovc-trn-body{display:none;padding:16px 18px;background:var(--bg-elevated,#fff);}',
      '.ovc-trn-body.active{display:block;}',
      '.ovc-trn-subhd{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;margin:0 0 8px;padding-top:10px;}',
      '.ovc-trn-subhd:first-child{padding-top:0;}',
      '.ovc-trn-badge{width:20px;height:20px;object-fit:contain;flex-shrink:0;}',
      '.ovc-trn-badge-ph{width:20px;height:20px;border-radius:3px;background:#e2e8f0;flex-shrink:0;display:inline-block;}',
      '.ovc-trn-match{display:flex;align-items:center;justify-content:space-between;padding:10px 6px;',
      '  border-bottom:1px solid var(--border-subtle,#f1f5f9);font-size:12.5px;border-radius:6px;transition:background .12s;}',
      '.ovc-trn-match:hover{background:rgba(0,0,0,.02);}',
      '.ovc-trn-match:last-child{border-bottom:none;}',
      '.ovc-trn-match-side{display:flex;align-items:center;gap:7px;flex:1;min-width:0;}',
      '.ovc-trn-match-side.away{justify-content:flex-end;text-align:right;flex-direction:row-reverse;}',
      '.ovc-trn-team{font-weight:700;color:var(--text-main,#0f172a);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.ovc-trn-score{font-weight:900;font-size:14px;padding:0 12px;color:' + ACC + ';white-space:nowrap;font-variant-numeric:tabular-nums;}',
      '.ovc-trn-meta{font-size:9.5px;color:#94a3b8;text-align:center;min-width:58px;font-weight:700;text-transform:uppercase;}',
      '.ovc-trn-empty{padding:22px 4px;text-align:center;color:#94a3b8;font-size:12px;}',
      '.ovc-trn-groups{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;}',
      '.ovc-trn-gcard{border:1px solid var(--border-subtle,#e2e8f0);border-radius:8px;overflow:hidden;}',
      '.ovc-trn-gcard-hd{background:' + ACC_DARK + ';color:#fff;padding:7px 10px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;}',
      '.ovc-trn-table{width:100%;border-collapse:collapse;font-size:11.5px;}',
      '.ovc-trn-table th{background:#f8fafc;color:#64748b;text-transform:uppercase;font-size:8px;font-weight:800;padding:7px 4px;text-align:center;border-bottom:1px solid var(--border-subtle,#e2e8f0);}',
      '.ovc-trn-table th:nth-child(2){text-align:left;}',
      '.ovc-trn-table td{padding:7px 4px;text-align:center;border-bottom:1px solid #f3f4f6;color:#374151;}',
      '.ovc-trn-table td:nth-child(2){text-align:left;font-weight:700;}',
      '.ovc-trn-table tr:last-child td{border-bottom:none;}',
      '.ovc-trn-table tr{border-left:3px solid transparent;}',
      '.ovc-trn-table tr:nth-child(-n+4){border-left-color:#22c55e;}',
      '.ovc-trn-table tr:nth-child(-n+4) td:first-child{color:#059669;font-weight:900;}',
      '.ovc-trn-table tr.rebaixa{border-left-color:#ef4444;}',
      '.ovc-trn-table tr.rebaixa td:first-child{color:#dc2626;font-weight:900;}',
      '.ovc-trn-team-cell{display:flex;align-items:center;gap:7px;}',
      '.ovc-trn-pts{font-weight:900;color:' + ACC + ' !important;font-size:12.5px;}',
      '.ovc-trn-art{display:flex;align-items:center;gap:9px;padding:9px 4px;border-bottom:1px solid var(--border-subtle,#f1f5f9);font-size:12.5px;position:relative;}',
      '.ovc-trn-art:last-child{border-bottom:none;}',
      '.ovc-trn-art-rank{width:24px;font-weight:900;color:#94a3b8;font-size:11.5px;text-align:center;flex-shrink:0;}',
      '.ovc-trn-art-rank.top{color:' + ACC + ';}',
      '.ovc-trn-art-name{flex:1;min-width:0;font-weight:700;color:var(--text-main,#0f172a);}',
      '.ovc-trn-art-team{font-size:10px;color:#94a3b8;display:flex;align-items:center;gap:5px;}',
      '.ovc-trn-art-team .ovc-trn-badge,.ovc-trn-art-team .ovc-trn-badge-ph{width:13px;height:13px;}',
      '.ovc-trn-art-bar{position:absolute;left:37px;right:70px;bottom:0;height:2px;background:' + ACC + ';border-radius:2px;opacity:.35;}',
      '.ovc-trn-art-gols{font-weight:900;color:' + ACC + ';font-size:13.5px;flex-shrink:0;font-variant-numeric:tabular-nums;}',
      '.ovc-trn-news{border-top:1px solid #1f2430;padding:16px 18px;background:#0b0e14;}',
      '.ovc-trn-news h4{font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.45);margin:0 0 10px;}',
      '.ovc-trn-news a{display:block;padding:9px 0;border-bottom:1px solid #1a1f2c;text-decoration:none;font-size:13px;',
      '  font-weight:650;color:#fff;line-height:1.45;transition:padding-left .12s;}',
      '.ovc-trn-news a:last-child{border-bottom:none;}',
      '.ovc-trn-news a:hover{color:' + ACC + ';padding-left:5px;}',
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

  function renderLeaders(grupos) {
    if (!grupos.length) return '';
    var times = grupos[0].times || [];
    if (times.length < 3) return '';
    var ord = [1, 0, 2]; // 2º, 1º(maior), 3º — visual de pódio
    var campoPts = CFG.tabelaSimples ? null : 'pts';
    return '<div class="ovc-trn-leaders">' +
      '<div class="ovc-trn-leaders-label">Líderes — ' + esc(grupos[0].nome !== 'Geral' ? grupos[0].nome : (CFG.nome || '')) + '</div>' +
      '<div class="ovc-trn-leaders-row">' + ord.map(function (i) {
        var t = times[i];
        if (!t) return '';
        var cls = ['p2', 'p1', 'p3'][ord.indexOf(i)];
        var valor = campoPts ? (t.pts + ' pts') : (t.pct ? (t.pct * 100).toFixed(0) + '%' : t.v + 'V');
        return '<div class="ovc-trn-leader ' + cls + '">' +
          escudoImg(t.escudo, 'ovc-trn-leader-badge') +
          '<div class="ovc-trn-leader-nome">' + esc(t.nome) + '</div>' +
          '<div class="ovc-trn-leader-bar"><span><span class="n">' + (i + 1) + 'º</span><span class="p">' + valor + '</span></span></div>' +
          '</div>';
      }).join('') + '</div></div>';
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
          return '<tr' + (i < 3 ? ' style="border-left-color:#22c55e"' : '') + '><td>' + (i + 1) + '</td>' +
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
    var maxG = 0;
    scorers.forEach(function (s) { if (s.gols > maxG) maxG = s.gols; });
    return scorers.slice(0, 12).map(function (s, i) {
      var pct = maxG ? Math.max(4, Math.round((s.gols / maxG) * 100)) : 0;
      return '<div class="ovc-trn-art">' +
        '<span class="ovc-trn-art-rank' + (i < 3 ? ' top' : '') + '">' + (i + 1) + 'º</span>' +
        '<div style="flex:1;min-width:0;"><div class="ovc-trn-art-name">' + esc(s.nome) + '</div><div class="ovc-trn-art-team">' + escudoImg(s.escudo) + '<span>' + esc(s.time) + '</span></div></div>' +
        '<span class="ovc-trn-art-bar" style="width:' + pct + '%;"></span>' +
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
    var temAoVivo = dados.partidas.some(function (p) { return p.status === 'ao_vivo'; });
    var wrap = document.createElement('div');
    wrap.className = 'ovc-trn-wrap';
    wrap.innerHTML =
      '<div class="ovc-trn-hd"><div class="ovc-trn-stripe"></div><div class="ovc-trn-sweep"></div>' +
      '<div class="ovc-trn-hd-live"><span class="ovc-trn-dot' + (temAoVivo ? ' live' : '') + '"></span>' +
      '<span class="ovc-trn-hd-txt' + (temAoVivo ? ' live' : '') + '">' + (temAoVivo ? 'Ao vivo agora' : 'Dados ao vivo · ESPN') + '</span></div>' +
      '<div class="ovc-trn-hd-title">' + esc(CFG.nome) + '</div>' +
      (CFG.sobre ? '<div class="ovc-trn-hd-sobre">' + esc(CFG.sobre) + '</div>' : '') +
      '</div>' +
      renderStatsStrip() +
      renderLeaders(dados.grupos) +
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
    fetch('/api/portal-posts?recentes=true&limit=300').then(function (r) { return r.json(); }).then(function (d) {
      var todos = d.posts || [];
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
