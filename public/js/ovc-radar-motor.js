/**
 * ovc-radar-motor.js — Dashboard premium Fórmula 1 (dados ESPN, tempo real)
 * REGRA ZERO-I: 100% independente — não toca internal-page-v2.js nem home.js
 * Layout adaptado: sem tabela de liga (F1 não tem times jogando entre si) —
 * próxima corrida, último pódio, classificação de pilotos e de equipes.
 * Fonte de dados: ESPN via proxy server-side em api/live.js?action=espn&sport=racing
 */
(function () {
  'use strict';

  function kwMatch(text, kw) {
    var esc = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(?:^|[^\\p{L}\\p{N}])' + esc + '(?:[^\\p{L}\\p{N}]|$)', 'iu').test(text);
  }

  var CFG = window.OVC_MOTOR;
  if (!CFG || !CFG.liga) return;

  var ACC = CFG.cor || '#d50a0a';
  var ACC_DARK = CFG.corDark || '#0f172a';

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
    if (!url) return '<span class="ovc-mtr-badge-ph"></span>';
    return '<img class="ovc-mtr-badge" src="' + esc(url) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.outerHTML=\'<span class=&quot;ovc-mtr-badge-ph&quot;></span>\'">';
  }

  function injetarCSS() {
    if (document.getElementById('ovc-mtr-css')) return;
    var sty = document.createElement('style');
    sty.id = 'ovc-mtr-css';
    sty.textContent = [
      '.ovc-mtr-wrap{margin:18px 0;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:var(--bg-elevated,#fff);}',
      '.ovc-mtr-hd{background:linear-gradient(135deg,' + ACC_DARK + ' 0%,#1e293b 60%,' + ACC + ' 140%);padding:16px 18px;}',
      '.ovc-mtr-hd-live{display:flex;align-items:center;gap:6px;margin-bottom:4px;}',
      '.ovc-mtr-dot{width:8px;height:8px;background:#fbbf24;border-radius:50%;animation:mtr-pulse 1s ease-in-out infinite;flex-shrink:0;}',
      '@keyframes mtr-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}',
      '.ovc-mtr-hd-txt{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#fbbf24;}',
      '.ovc-mtr-hd-title{font-size:18px;font-weight:800;color:#fff;letter-spacing:-.01em;}',
      '.ovc-mtr-hd-sobre{font-size:11.5px;color:rgba(255,255,255,.72);margin-top:5px;line-height:1.5;max-width:640px;}',
      '.ovc-mtr-stats{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;background:#0f172a;}',
      '.ovc-mtr-stat{text-align:center;padding:9px 4px;border-right:1px solid rgba(255,255,255,.08);}',
      '.ovc-mtr-stat:last-child{border-right:none;}',
      '.ovc-mtr-stat-n{display:block;font-size:16px;font-weight:900;color:#fbbf24;line-height:1;}',
      '.ovc-mtr-stat-l{display:block;font-size:8px;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:.05em;margin-top:2px;}',
      '.ovc-mtr-tabs{display:flex;border-bottom:1px solid #e5e7eb;background:#f8fafc;}',
      '.ovc-mtr-tab{flex:1;padding:10px 8px;text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#64748b;cursor:pointer;border-bottom:2px solid transparent;background:none;border-top:none;border-left:none;border-right:none;}',
      '.ovc-mtr-tab.active{color:' + ACC + ';border-bottom-color:' + ACC + ';background:#fff;}',
      '.ovc-mtr-body{display:none;padding:14px 16px;}',
      '.ovc-mtr-body.active{display:block;}',
      '.ovc-mtr-subhd{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;margin:0 0 8px;padding-top:4px;}',
      '.ovc-mtr-subhd:first-child{padding-top:0;}',
      '.ovc-mtr-badge{width:20px;height:20px;object-fit:contain;flex-shrink:0;border-radius:3px;}',
      '.ovc-mtr-badge-ph{width:20px;height:20px;border-radius:3px;background:#e5e7eb;flex-shrink:0;display:inline-block;}',
      '.ovc-mtr-race-card{border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-bottom:10px;}',
      '.ovc-mtr-race-name{font-size:14px;font-weight:800;color:var(--text-main,#0f172a);}',
      '.ovc-mtr-race-circ{font-size:11.5px;color:#64748b;margin-top:2px;}',
      '.ovc-mtr-race-data{font-size:11px;color:' + ACC + ';font-weight:700;margin-top:6px;}',
      '.ovc-mtr-podio{display:flex;flex-direction:column;gap:6px;margin-top:10px;}',
      '.ovc-mtr-podio-item{display:flex;align-items:center;gap:8px;font-size:12.5px;}',
      '.ovc-mtr-podio-pos{width:20px;font-weight:900;color:' + ACC + ';text-align:center;flex-shrink:0;}',
      '.ovc-mtr-podio-nome{font-weight:700;color:var(--text-main,#0f172a);}',
      '.ovc-mtr-podio-eq{font-size:10.5px;color:#94a3b8;}',
      '.ovc-mtr-empty{padding:18px 4px;text-align:center;color:#94a3b8;font-size:12px;}',
      '.ovc-mtr-rank{display:flex;align-items:center;gap:8px;padding:7px 4px;border-bottom:1px solid #f1f5f9;font-size:12.5px;}',
      '.ovc-mtr-rank:last-child{border-bottom:none;}',
      '.ovc-mtr-rank-pos{width:22px;font-weight:800;color:#94a3b8;font-size:11px;text-align:center;flex-shrink:0;}',
      '.ovc-mtr-rank-pos.top{color:' + ACC + ';}',
      '.ovc-mtr-rank-nome{flex:1;min-width:0;font-weight:700;color:var(--text-main,#0f172a);}',
      '.ovc-mtr-rank-pts{font-weight:900;color:' + ACC + ';font-size:13px;flex-shrink:0;}',
      '.ovc-mtr-gcard{margin-bottom:14px;}',
      '.ovc-mtr-gcard-hd{font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:6px;}',
      '.ovc-mtr-news{border-top:1px solid #e5e7eb;padding:12px 16px;}',
      '.ovc-mtr-news h4{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin:0 0 8px;}',
      '.ovc-mtr-news a{display:block;padding:7px 0;border-bottom:1px solid #f1f5f9;text-decoration:none;font-size:13px;font-weight:600;color:var(--text-main,#0f172a);line-height:1.4;}',
      '.ovc-mtr-news a:last-child{border-bottom:none;}',
      '.ovc-mtr-news a:hover{color:' + ACC + ';}',
    ].join('');
    document.head.appendChild(sty);
  }

  function renderStatsStrip() {
    var stats = CFG.stats || [];
    if (!stats.length) return '';
    return '<div class="ovc-mtr-stats">' + stats.map(function (s) {
      return '<div class="ovc-mtr-stat"><span class="ovc-mtr-stat-n">' + esc(s.n) + '</span><span class="ovc-mtr-stat-l">' + esc(s.l) + '</span></div>';
    }).join('') + '</div>';
  }

  function renderCorridas(proxima, ultima) {
    var html = '';
    if (proxima) {
      html += '<div class="ovc-mtr-subhd">Próxima corrida</div>' +
        '<div class="ovc-mtr-race-card"><div class="ovc-mtr-race-name">' + esc(proxima.nome) + '</div>' +
        (proxima.circuito ? '<div class="ovc-mtr-race-circ">' + esc(proxima.circuito) + '</div>' : '') +
        (proxima.data ? '<div class="ovc-mtr-race-data">' + dataBr(proxima.data) + '</div>' : '') +
        '</div>';
    }
    if (ultima) {
      html += '<div class="ovc-mtr-subhd">Resultado da última corrida</div>' +
        '<div class="ovc-mtr-race-card"><div class="ovc-mtr-race-name">' + esc(ultima.nome) + '</div>' +
        (ultima.circuito ? '<div class="ovc-mtr-race-circ">' + esc(ultima.circuito) + '</div>' : '') +
        (ultima.podio && ultima.podio.length ? '<div class="ovc-mtr-podio">' + ultima.podio.map(function (p, i) {
          return '<div class="ovc-mtr-podio-item"><span class="ovc-mtr-podio-pos">' + (i + 1) + 'º</span>' + escudoImg(p.escudo) +
            '<span><span class="ovc-mtr-podio-nome">' + esc(p.nome) + '</span> <span class="ovc-mtr-podio-eq">' + esc(p.equipe) + '</span></span></div>';
        }).join('') + '</div>' : '') +
        '</div>';
    }
    return html || '<div class="ovc-mtr-empty">Calendário da temporada disponível em breve</div>';
  }

  function renderClassificacoes(grupos) {
    if (!grupos.length) return '<div class="ovc-mtr-empty">Classificação disponível após o início da temporada</div>';
    return grupos.map(function (g) {
      return '<div class="ovc-mtr-gcard"><div class="ovc-mtr-gcard-hd">' + esc(g.nome) + '</div>' +
        g.itens.slice(0, 12).map(function (it, i) {
          return '<div class="ovc-mtr-rank"><span class="ovc-mtr-rank-pos' + (i < 3 ? ' top' : '') + '">' + (i + 1) + 'º</span>' +
            escudoImg(it.escudo) + '<span class="ovc-mtr-rank-nome">' + esc(it.nome) + '</span><span class="ovc-mtr-rank-pts">' + it.pts + ' pts</span></div>';
        }).join('') + '</div>';
    }).join('');
  }

  function fetchDados() {
    return fetch('/api/live?action=espn&sport=racing&liga=' + encodeURIComponent(CFG.liga), { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.ok) return { proxima: null, ultimaCompleta: null, classificacoes: [] };
        return { proxima: d.proxima || null, ultimaCompleta: d.ultimaCompleta || null, classificacoes: d.classificacoes || [] };
      })
      .catch(function () { return { proxima: null, ultimaCompleta: null, classificacoes: [] }; });
  }

  function switchTab(tab, root) {
    root.querySelectorAll('.ovc-mtr-tab').forEach(function (el) { el.classList.toggle('active', el.dataset.tab === tab); });
    root.querySelectorAll('.ovc-mtr-body').forEach(function (el) { el.classList.toggle('active', el.dataset.body === tab); });
  }

  function montarDashboard(dados) {
    injetarCSS();
    var wrap = document.createElement('div');
    wrap.className = 'ovc-mtr-wrap';
    wrap.innerHTML =
      '<div class="ovc-mtr-hd">' +
      '<div class="ovc-mtr-hd-live"><span class="ovc-mtr-dot"></span><span class="ovc-mtr-hd-txt">Dados ao vivo · ESPN</span></div>' +
      '<div class="ovc-mtr-hd-title">' + esc(CFG.nome) + '</div>' +
      (CFG.sobre ? '<div class="ovc-mtr-hd-sobre">' + esc(CFG.sobre) + '</div>' : '') +
      '</div>' +
      renderStatsStrip() +
      '<div class="ovc-mtr-tabs">' +
      '<button class="ovc-mtr-tab active" data-tab="corridas">Corridas</button>' +
      '<button class="ovc-mtr-tab" data-tab="classificacao">Classificação</button>' +
      '</div>' +
      '<div class="ovc-mtr-body active" data-body="corridas">' + renderCorridas(dados.proxima, dados.ultimaCompleta) + '</div>' +
      '<div class="ovc-mtr-body" data-body="classificacao">' + renderClassificacoes(dados.classificacoes) + '</div>' +
      '<div class="ovc-mtr-news" id="ovc-mtr-news"><h4>Notícias do Mundial</h4><div id="ovc-mtr-news-list"><div class="ovc-mtr-empty">Carregando…</div></div></div>';

    wrap.querySelectorAll('.ovc-mtr-tab').forEach(function (btn) {
      btn.addEventListener('click', function () { switchTab(btn.dataset.tab, wrap); });
    });
    return wrap;
  }

  function montarNoticias(artigos) {
    var list = document.getElementById('ovc-mtr-news-list');
    if (!list) return;
    if (!artigos.length) { list.innerHTML = '<div class="ovc-mtr-empty">Cobertura chegando em breve.</div>'; return; }
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
    var alvo = document.getElementById('ovc-motor-dash');
    if (!alvo) return;
    alvo.innerHTML = '<div class="ovc-mtr-wrap"><div class="ovc-mtr-body active" style="display:block;"><div class="ovc-mtr-empty">Carregando dados ao vivo…</div></div></div>';
    fetchDados().then(function (dados) {
      alvo.innerHTML = '';
      alvo.appendChild(montarDashboard(dados));
      fetchNoticias();
    }).catch(function () {
      alvo.innerHTML = '<div class="ovc-mtr-wrap"><div class="ovc-mtr-body active" style="display:block;"><div class="ovc-mtr-empty">Não foi possível carregar os dados agora.</div></div></div>';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
