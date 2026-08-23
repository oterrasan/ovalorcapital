/**
 * ovc-radar-motor.js — Painel espetacular Fórmula 1 (dados ESPN, tempo real)
 * REGRA ZERO-I: 100% independente — não toca internal-page-v2.js nem home.js
 * Identidade visual própria: fibra de carbono, vermelho de corrida, contador
 * regressivo ao vivo, pódio visual, ranking estilo telemetria de box.
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

  var ACC = CFG.cor || '#e10600';

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
    if (!url) return '<span class="' + cls + '-ph"></span>';
    return '<img class="' + cls + '" src="' + esc(url) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.outerHTML=\'<span class=&quot;' + cls + '-ph&quot;></span>\'">';
  }

  function injetarCSS() {
    if (document.getElementById('ovc-mtr-css')) return;
    var sty = document.createElement('style');
    sty.id = 'ovc-mtr-css';
    sty.textContent = [
      '@keyframes mtr-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.7)}}',
      '@keyframes mtr-sweep{0%{transform:translateX(-140%) skewX(-18deg)}100%{transform:translateX(260%) skewX(-18deg)}}',
      '@keyframes mtr-rise{from{transform:scaleY(0);opacity:0}to{transform:scaleY(1);opacity:1}}',

      '.ovc-mtr-wrap{margin:18px 0;border-radius:14px;overflow:hidden;background:#0b0e14;',
      '  box-shadow:0 20px 50px -20px rgba(0,0,0,.55);border:1px solid #1f2430;}',

      /* Header: carbono + faixa vermelha diagonal */
      '.ovc-mtr-hd{position:relative;padding:22px 22px 18px;overflow:hidden;',
      '  background:#0b0e14 repeating-linear-gradient(45deg,rgba(255,255,255,.025) 0,rgba(255,255,255,.025) 1px,transparent 1px,transparent 7px);}',
      '.ovc-mtr-hd::before{content:"";position:absolute;top:0;right:-10%;width:60%;height:100%;',
      '  background:linear-gradient(100deg,transparent 30%,' + ACC + ' 30%,' + ACC + ' 38%,transparent 38%,transparent 46%,' + ACC + ' 46%,' + ACC + ' 50%,transparent 50%);opacity:.85;}',
      '.ovc-mtr-sweep{position:absolute;top:0;left:0;width:22%;height:100%;',
      '  background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent);',
      '  animation:mtr-sweep 5s ease-in-out infinite;pointer-events:none;}',
      '.ovc-mtr-hd-live{display:flex;align-items:center;gap:7px;margin-bottom:8px;position:relative;}',
      '.ovc-mtr-dot{width:9px;height:9px;background:#22c55e;border-radius:50%;animation:mtr-pulse 1.1s ease-in-out infinite;flex-shrink:0;',
      '  box-shadow:0 0 10px 2px rgba(34,197,94,.7);}',
      '.ovc-mtr-hd-txt{font-size:10.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#22c55e;}',
      '.ovc-mtr-hd-title{font-size:26px;font-weight:900;color:#fff;letter-spacing:-.02em;font-style:italic;',
      '  position:relative;text-shadow:0 3px 14px rgba(0,0,0,.5);line-height:1.05;}',
      '.ovc-mtr-hd-sobre{font-size:12px;color:rgba(255,255,255,.62);margin-top:8px;line-height:1.55;max-width:640px;position:relative;}',

      /* Stats HUD */
      '.ovc-mtr-stats{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;background:#131722;',
      '  border-top:1px solid #232838;border-bottom:1px solid #232838;}',
      '.ovc-mtr-stat{text-align:center;padding:11px 4px;border-right:1px solid #1f2430;}',
      '.ovc-mtr-stat:last-child{border-right:none;}',
      '.ovc-mtr-stat-n{display:block;font-size:17px;font-weight:900;color:#fff;line-height:1;font-variant-numeric:tabular-nums;}',
      '.ovc-mtr-stat-l{display:block;font-size:8px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em;margin-top:3px;}',

      /* Contador regressivo — peça central do "espetacular" */
      '.ovc-mtr-cd{padding:20px 22px 18px;text-align:center;background:radial-gradient(ellipse at top,#1a1f2e 0%,#0b0e14 75%);}',
      '.ovc-mtr-cd-label{font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:4px;}',
      '.ovc-mtr-cd-race{font-size:15px;font-weight:800;color:#fff;margin-bottom:2px;}',
      '.ovc-mtr-cd-circ{font-size:11px;color:rgba(255,255,255,.5);margin-bottom:14px;}',
      '.ovc-mtr-cd-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:380px;margin:0 auto;}',
      '.ovc-mtr-cd-unit{background:#151a26;border:1px solid #262c3d;border-radius:10px;padding:10px 4px;}',
      '.ovc-mtr-cd-num{display:block;font-size:26px;font-weight:900;color:' + ACC + ';font-variant-numeric:tabular-nums;',
      '  line-height:1;text-shadow:0 0 18px rgba(225,6,0,.45);}',
      '.ovc-mtr-cd-unl{display:block;font-size:8px;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.08em;margin-top:5px;}',
      '.ovc-mtr-cd-live{font-size:15px;font-weight:900;color:#22c55e;letter-spacing:.04em;padding:14px 0;}',

      /* Tabs */
      '.ovc-mtr-tabs{display:flex;background:#0b0e14;border-bottom:1px solid #1f2430;}',
      '.ovc-mtr-tab{flex:1;padding:12px 8px;text-align:center;font-size:11px;font-weight:800;text-transform:uppercase;',
      '  letter-spacing:.06em;color:rgba(255,255,255,.4);cursor:pointer;border:none;background:none;',
      '  border-bottom:2.5px solid transparent;transition:all .15s;}',
      '.ovc-mtr-tab:hover{color:rgba(255,255,255,.7);}',
      '.ovc-mtr-tab.active{color:#fff;border-bottom-color:' + ACC + ';}',
      '.ovc-mtr-body{display:none;padding:18px;background:var(--bg-elevated,#fff);}',
      '.ovc-mtr-body.active{display:block;}',
      '.ovc-mtr-subhd{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;margin:0 0 10px;padding-top:4px;}',
      '.ovc-mtr-subhd:first-child{padding-top:0;}',

      /* Pódio visual — a peça mais "espetacular" da última corrida */
      '.ovc-mtr-podio{display:flex;align-items:flex-end;justify-content:center;gap:8px;margin:6px 0 18px;padding:0 4px;}',
      '.ovc-mtr-pod-col{flex:1;max-width:120px;text-align:center;transform-origin:bottom;animation:mtr-rise .5s ease-out;}',
      '.ovc-mtr-pod-badge{width:34px;height:34px;border-radius:50%;object-fit:contain;background:#f1f5f9;',
      '  margin:0 auto 8px;display:block;}',
      '.ovc-mtr-pod-badge-ph{width:34px;height:34px;border-radius:50%;background:#e2e8f0;margin:0 auto 8px;display:block;}',
      '.ovc-mtr-pod-nome{font-size:11.5px;font-weight:800;color:var(--text-main,#0f172a);line-height:1.25;',
      '  margin-bottom:2px;min-height:28px;display:flex;align-items:center;justify-content:center;}',
      '.ovc-mtr-pod-eq{font-size:9.5px;color:#94a3b8;margin-bottom:8px;text-transform:uppercase;letter-spacing:.03em;}',
      '.ovc-mtr-pod-bar{border-radius:8px 8px 0 0;display:flex;align-items:flex-start;justify-content:center;',
      '  padding-top:8px;font-weight:900;color:#fff;}',
      '.ovc-mtr-pod-bar .n{font-size:22px;text-shadow:0 2px 6px rgba(0,0,0,.3);}',
      '.ovc-mtr-pod-col.p1 .ovc-mtr-pod-bar{height:74px;background:linear-gradient(160deg,#fbbf24,#d97706);}',
      '.ovc-mtr-pod-col.p2 .ovc-mtr-pod-bar{height:54px;background:linear-gradient(160deg,#cbd5e1,#94a3b8);}',
      '.ovc-mtr-pod-col.p3 .ovc-mtr-pod-bar{height:40px;background:linear-gradient(160deg,#d97757,#b45309);}',

      '.ovc-mtr-race-card{border:1px solid var(--border-subtle,#e2e8f0);border-radius:10px;padding:14px;margin-bottom:12px;',
      '  background:linear-gradient(180deg,rgba(225,6,0,.03),transparent);}',
      '.ovc-mtr-race-name{font-size:14.5px;font-weight:800;color:var(--text-main,#0f172a);}',
      '.ovc-mtr-race-circ{font-size:11.5px;color:#64748b;margin-top:2px;}',
      '.ovc-mtr-race-data{font-size:11px;color:' + ACC + ';font-weight:800;margin-top:7px;text-transform:uppercase;letter-spacing:.03em;}',
      '.ovc-mtr-empty{padding:22px 4px;text-align:center;color:#94a3b8;font-size:12px;}',

      /* Ranking estilo telemetria */
      '.ovc-mtr-rank{display:flex;align-items:center;gap:10px;padding:9px 6px;border-bottom:1px solid var(--border-subtle,#f1f5f9);',
      '  font-size:12.5px;position:relative;}',
      '.ovc-mtr-rank:last-child{border-bottom:none;}',
      '.ovc-mtr-rank-pos{width:24px;font-weight:900;color:#94a3b8;font-size:11.5px;text-align:center;flex-shrink:0;',
      '  font-variant-numeric:tabular-nums;}',
      '.ovc-mtr-rank-pos.top{color:' + ACC + ';}',
      '.ovc-mtr-badge{width:22px;height:22px;object-fit:contain;flex-shrink:0;border-radius:4px;}',
      '.ovc-mtr-badge-ph{width:22px;height:22px;border-radius:4px;background:#e2e8f0;flex-shrink:0;display:inline-block;}',
      '.ovc-mtr-rank-nome{flex:1;min-width:0;font-weight:700;color:var(--text-main,#0f172a);}',
      '.ovc-mtr-rank-bar{position:absolute;left:34px;right:64px;bottom:0;height:2px;background:' + ACC + ';border-radius:2px;opacity:.35;}',
      '.ovc-mtr-rank-pts{font-weight:900;color:' + ACC + ';font-size:13px;flex-shrink:0;font-variant-numeric:tabular-nums;}',
      '.ovc-mtr-gcard{margin-bottom:16px;}',
      '.ovc-mtr-gcard-hd{font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:6px;}',

      '.ovc-mtr-news{border-top:1px solid #1f2430;padding:16px 18px;background:#0b0e14;}',
      '.ovc-mtr-news h4{font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.45);margin:0 0 10px;}',
      '.ovc-mtr-news a{display:block;padding:9px 0;border-bottom:1px solid #1a1f2c;text-decoration:none;font-size:13px;',
      '  font-weight:650;color:#fff;line-height:1.45;transition:padding-left .12s;}',
      '.ovc-mtr-news a:last-child{border-bottom:none;}',
      '.ovc-mtr-news a:hover{color:' + ACC + ';padding-left:5px;}',
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

  var countdownTimer = null;
  function pad2(n) { return String(n).padStart(2, '0'); }

  function renderCountdown(proxima) {
    if (!proxima || !proxima.data) return '';
    return '<div class="ovc-mtr-cd" id="ovc-mtr-cd-wrap">' +
      '<div class="ovc-mtr-cd-label">Contagem para a próxima corrida</div>' +
      '<div class="ovc-mtr-cd-race">' + esc(proxima.nome) + '</div>' +
      (proxima.circuito ? '<div class="ovc-mtr-cd-circ">' + esc(proxima.circuito) + '</div>' : '') +
      '<div id="ovc-mtr-cd-body"></div>' +
      '</div>';
  }

  function tickCountdown(dataIso) {
    var body = document.getElementById('ovc-mtr-cd-body');
    if (!body) { if (countdownTimer) clearInterval(countdownTimer); return; }
    var diff = new Date(dataIso).getTime() - Date.now();
    if (diff <= 0) {
      body.innerHTML = '<div class="ovc-mtr-cd-live">🏁 CORRIDA EM ANDAMENTO</div>';
      if (countdownTimer) clearInterval(countdownTimer);
      return;
    }
    var d = Math.floor(diff / 86400000);
    var h = Math.floor((diff % 86400000) / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    body.innerHTML = '<div class="ovc-mtr-cd-grid">' +
      '<div class="ovc-mtr-cd-unit"><span class="ovc-mtr-cd-num">' + pad2(d) + '</span><span class="ovc-mtr-cd-unl">dias</span></div>' +
      '<div class="ovc-mtr-cd-unit"><span class="ovc-mtr-cd-num">' + pad2(h) + '</span><span class="ovc-mtr-cd-unl">horas</span></div>' +
      '<div class="ovc-mtr-cd-unit"><span class="ovc-mtr-cd-num">' + pad2(m) + '</span><span class="ovc-mtr-cd-unl">min</span></div>' +
      '<div class="ovc-mtr-cd-unit"><span class="ovc-mtr-cd-num">' + pad2(s) + '</span><span class="ovc-mtr-cd-unl">seg</span></div>' +
      '</div>';
  }

  function renderCorridas(proxima, ultima) {
    var html = '';
    if (!proxima && !ultima) return '<div class="ovc-mtr-empty">Calendário da temporada disponível em breve</div>';
    if (ultima) {
      html += '<div class="ovc-mtr-subhd">Pódio da última corrida</div>';
      html += '<div class="ovc-mtr-race-card"><div class="ovc-mtr-race-name">' + esc(ultima.nome) + '</div>' +
        (ultima.circuito ? '<div class="ovc-mtr-race-circ">' + esc(ultima.circuito) + '</div>' : '') + '</div>';
      if (ultima.podio && ultima.podio.length) {
        var ord = [1, 0, 2]; // P2, P1(maior), P3 — visual de pódio
        html += '<div class="ovc-mtr-podio">' + ord.map(function (i) {
          var p = ultima.podio[i];
          if (!p) return '';
          var cls = ['p2', 'p1', 'p3'][ord.indexOf(i)];
          return '<div class="ovc-mtr-pod-col ' + cls + '">' +
            escudoImg(p.escudo, 'ovc-mtr-pod-badge') +
            '<div class="ovc-mtr-pod-nome">' + esc(p.nome) + '</div>' +
            '<div class="ovc-mtr-pod-eq">' + esc(p.equipe || '') + '</div>' +
            '<div class="ovc-mtr-pod-bar"><span class="n">' + (i + 1) + 'º</span></div>' +
            '</div>';
        }).join('') + '</div>';
      }
    }
    return html;
  }

  function renderClassificacoes(grupos) {
    if (!grupos.length) return '<div class="ovc-mtr-empty">Classificação disponível após o início da temporada</div>';
    var maxPts = 0;
    grupos.forEach(function (g) { (g.itens || []).forEach(function (it) { if (it.pts > maxPts) maxPts = it.pts; }); });
    return grupos.map(function (g) {
      return '<div class="ovc-mtr-gcard"><div class="ovc-mtr-gcard-hd">' + esc(g.nome) + '</div>' +
        g.itens.slice(0, 12).map(function (it, i) {
          var pct = maxPts ? Math.max(4, Math.round((it.pts / maxPts) * 100)) : 0;
          return '<div class="ovc-mtr-rank"><span class="ovc-mtr-rank-pos' + (i < 3 ? ' top' : '') + '">' + (i + 1) + 'º</span>' +
            escudoImg(it.escudo, 'ovc-mtr-badge') + '<span class="ovc-mtr-rank-nome">' + esc(it.nome) + '</span>' +
            '<span class="ovc-mtr-rank-bar" style="width:' + pct + '%;"></span>' +
            '<span class="ovc-mtr-rank-pts">' + it.pts + ' pts</span></div>';
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
      '<div class="ovc-mtr-hd"><div class="ovc-mtr-sweep"></div>' +
      '<div class="ovc-mtr-hd-live"><span class="ovc-mtr-dot"></span><span class="ovc-mtr-hd-txt">Ao vivo · ESPN · 24h</span></div>' +
      '<div class="ovc-mtr-hd-title">' + esc(CFG.nome) + '</div>' +
      (CFG.sobre ? '<div class="ovc-mtr-hd-sobre">' + esc(CFG.sobre) + '</div>' : '') +
      '</div>' +
      renderStatsStrip() +
      renderCountdown(dados.proxima) +
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

    if (dados.proxima && dados.proxima.data) {
      tickCountdown(dados.proxima.data);
      countdownTimer = setInterval(function () { tickCountdown(dados.proxima.data); }, 1000);
    }

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
    fetch('/api/portal-posts?recentes=true&categoria=esportes&limit=300').then(function (r) { return r.json(); }).then(function (d) {
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
