/**
 * ovc-radar-tenis.js — Dashboard premium Tênis ATP/WTA (dados ESPN, tempo real)
 * REGRA ZERO-I: 100% independente — não toca internal-page-v2.js nem home.js
 * Layout adaptado: sem tabela de liga (tênis não tem times jogando entre si) —
 * próximos jogos, últimos resultados e ranking ATP + WTA lado a lado.
 * Fonte de dados: ESPN via proxy server-side em api/live.js?action=espn&sport=tennis
 */
(function () {
  'use strict';

  var CFG = window.OVC_TENIS;
  if (!CFG) return;
  var LIGAS = CFG.ligas || ['atp', 'wta'];
  var LABEL = { atp: 'ATP (Masculino)', wta: 'WTA (Feminino)' };

  var ACC = CFG.cor || '#0ea5a4';
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

  function injetarCSS() {
    if (document.getElementById('ovc-tns-css')) return;
    var sty = document.createElement('style');
    sty.id = 'ovc-tns-css';
    sty.textContent = [
      '.ovc-tns-wrap{margin:18px 0;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:var(--bg-elevated,#fff);}',
      '.ovc-tns-hd{background:linear-gradient(135deg,' + ACC_DARK + ' 0%,#1e293b 60%,' + ACC + ' 140%);padding:16px 18px;}',
      '.ovc-tns-hd-live{display:flex;align-items:center;gap:6px;margin-bottom:4px;}',
      '.ovc-tns-dot{width:8px;height:8px;background:#fbbf24;border-radius:50%;animation:tns-pulse 1s ease-in-out infinite;flex-shrink:0;}',
      '@keyframes tns-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}',
      '.ovc-tns-hd-txt{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#fbbf24;}',
      '.ovc-tns-hd-title{font-size:18px;font-weight:800;color:#fff;letter-spacing:-.01em;}',
      '.ovc-tns-hd-sobre{font-size:11.5px;color:rgba(255,255,255,.72);margin-top:5px;line-height:1.5;max-width:640px;}',
      '.ovc-tns-tabs{display:flex;border-bottom:1px solid #e5e7eb;background:#f8fafc;}',
      '.ovc-tns-tab{flex:1;padding:10px 8px;text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#64748b;cursor:pointer;border-bottom:2px solid transparent;background:none;border-top:none;border-left:none;border-right:none;}',
      '.ovc-tns-tab.active{color:' + ACC + ';border-bottom-color:' + ACC + ';background:#fff;}',
      '.ovc-tns-body{display:none;padding:14px 16px;}',
      '.ovc-tns-body.active{display:block;}',
      '.ovc-tns-gcard{margin-bottom:16px;}',
      '.ovc-tns-gcard:last-child{margin-bottom:0;}',
      '.ovc-tns-gcard-hd{font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:8px;}',
      '.ovc-tns-subhd{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;margin:0 0 8px;padding-top:4px;}',
      '.ovc-tns-subhd:first-child{padding-top:0;}',
      '.ovc-tns-match{border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;margin-bottom:8px;}',
      '.ovc-tns-match:last-child{margin-bottom:0;}',
      '.ovc-tns-match-vs{display:flex;justify-content:space-between;align-items:center;font-size:13px;}',
      '.ovc-tns-match-p{font-weight:700;color:var(--text-main,#0f172a);}',
      '.ovc-tns-match-sc{font-weight:900;color:' + ACC + ';font-size:12.5px;flex-shrink:0;margin-left:8px;}',
      '.ovc-tns-match-meta{font-size:10.5px;color:#94a3b8;margin-top:4px;}',
      '.ovc-tns-empty{padding:18px 4px;text-align:center;color:#94a3b8;font-size:12px;}',
      '.ovc-tns-rank{display:flex;align-items:center;gap:8px;padding:7px 4px;border-bottom:1px solid #f1f5f9;font-size:12.5px;}',
      '.ovc-tns-rank:last-child{border-bottom:none;}',
      '.ovc-tns-rank-pos{width:22px;font-weight:800;color:#94a3b8;font-size:11px;text-align:center;flex-shrink:0;}',
      '.ovc-tns-rank-pos.top{color:' + ACC + ';}',
      '.ovc-tns-rank-nome{flex:1;min-width:0;font-weight:700;color:var(--text-main,#0f172a);}',
      '.ovc-tns-rank-pts{font-weight:900;color:' + ACC + ';font-size:13px;flex-shrink:0;}',
      '.ovc-tns-news{border-top:1px solid #e5e7eb;padding:12px 16px;}',
      '.ovc-tns-news h4{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin:0 0 8px;}',
      '.ovc-tns-news a{display:block;padding:7px 0;border-bottom:1px solid #f1f5f9;text-decoration:none;font-size:13px;font-weight:600;color:var(--text-main,#0f172a);line-height:1.4;}',
      '.ovc-tns-news a:last-child{border-bottom:none;}',
      '.ovc-tns-news a:hover{color:' + ACC + ';}',
    ].join('');
    document.head.appendChild(sty);
  }

  function renderJogos(porLiga) {
    var html = '';
    LIGAS.forEach(function (liga) {
      var d = porLiga[liga] || { proximosJogos: [], ultimosResultados: [] };
      html += '<div class="ovc-tns-gcard"><div class="ovc-tns-gcard-hd">' + esc(LABEL[liga] || liga.toUpperCase()) + '</div>';
      if (d.proximosJogos.length) {
        html += '<div class="ovc-tns-subhd">Próximos jogos</div>' + d.proximosJogos.slice(0, 5).map(function (j) {
          return '<div class="ovc-tns-match"><div class="ovc-tns-match-vs">' +
            '<span class="ovc-tns-match-p">' + esc(j.jogador1.nome) + ' <span style="color:#94a3b8;font-weight:400;">vs</span> ' + esc(j.jogador2.nome) + '</span></div>' +
            (j.data ? '<div class="ovc-tns-match-meta">' + dataBr(j.data) + (j.fase ? ' · ' + esc(j.fase) : '') + '</div>' : '') +
            '</div>';
        }).join('');
      }
      if (d.ultimosResultados.length) {
        html += '<div class="ovc-tns-subhd">Últimos resultados</div>' + d.ultimosResultados.slice(-5).reverse().map(function (j) {
          return '<div class="ovc-tns-match"><div class="ovc-tns-match-vs">' +
            '<span class="ovc-tns-match-p">' + esc(j.jogador1.nome) + '</span><span class="ovc-tns-match-sc">' + esc(j.jogador1.placar) + '</span></div>' +
            '<div class="ovc-tns-match-vs"><span class="ovc-tns-match-p">' + esc(j.jogador2.nome) + '</span><span class="ovc-tns-match-sc">' + esc(j.jogador2.placar) + '</span></div>' +
            '</div>';
        }).join('');
      }
      if (!d.proximosJogos.length && !d.ultimosResultados.length) {
        html += '<div class="ovc-tns-empty">Sem jogos no momento</div>';
      }
      html += '</div>';
    });
    return html || '<div class="ovc-tns-empty">Cobertura de jogos disponível em breve</div>';
  }

  function renderRanking(porLiga) {
    var html = '';
    LIGAS.forEach(function (liga) {
      var d = porLiga[liga] || { ranking: [] };
      html += '<div class="ovc-tns-gcard"><div class="ovc-tns-gcard-hd">' + esc(LABEL[liga] || liga.toUpperCase()) + '</div>';
      if (d.ranking.length) {
        html += d.ranking.map(function (r, i) {
          return '<div class="ovc-tns-rank"><span class="ovc-tns-rank-pos' + (i < 3 ? ' top' : '') + '">' + r.pos + 'º</span>' +
            '<span class="ovc-tns-rank-nome">' + esc(r.nome) + '</span>' + (r.pts ? '<span class="ovc-tns-rank-pts">' + r.pts + ' pts</span>' : '') + '</div>';
        }).join('');
      } else {
        html += '<div class="ovc-tns-empty">Ranking indisponível no momento</div>';
      }
      html += '</div>';
    });
    return html;
  }

  function fetchDados() {
    return Promise.all(LIGAS.map(function (liga) {
      return fetch('/api/live?action=espn&sport=tennis&liga=' + encodeURIComponent(liga), { cache: 'no-cache' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { return { liga: liga, d: (d && d.ok) ? d : { proximosJogos: [], ultimosResultados: [], ranking: [] } }; })
        .catch(function () { return { liga: liga, d: { proximosJogos: [], ultimosResultados: [], ranking: [] } }; });
    })).then(function (list) {
      var porLiga = {};
      list.forEach(function (item) { porLiga[item.liga] = item.d; });
      return porLiga;
    });
  }

  function switchTab(tab, root) {
    root.querySelectorAll('.ovc-tns-tab').forEach(function (el) { el.classList.toggle('active', el.dataset.tab === tab); });
    root.querySelectorAll('.ovc-tns-body').forEach(function (el) { el.classList.toggle('active', el.dataset.body === tab); });
  }

  function montarDashboard(porLiga) {
    injetarCSS();
    var wrap = document.createElement('div');
    wrap.className = 'ovc-tns-wrap';
    wrap.innerHTML =
      '<div class="ovc-tns-hd">' +
      '<div class="ovc-tns-hd-live"><span class="ovc-tns-dot"></span><span class="ovc-tns-hd-txt">Dados ao vivo · ESPN</span></div>' +
      '<div class="ovc-tns-hd-title">' + esc(CFG.nome) + '</div>' +
      (CFG.sobre ? '<div class="ovc-tns-hd-sobre">' + esc(CFG.sobre) + '</div>' : '') +
      '</div>' +
      '<div class="ovc-tns-tabs">' +
      '<button class="ovc-tns-tab active" data-tab="jogos">Jogos</button>' +
      '<button class="ovc-tns-tab" data-tab="ranking">Ranking</button>' +
      '</div>' +
      '<div class="ovc-tns-body active" data-body="jogos">' + renderJogos(porLiga) + '</div>' +
      '<div class="ovc-tns-body" data-body="ranking">' + renderRanking(porLiga) + '</div>' +
      '<div class="ovc-tns-news" id="ovc-tns-news"><h4>Notícias do Tênis</h4><div id="ovc-tns-news-list"><div class="ovc-tns-empty">Carregando…</div></div></div>';

    wrap.querySelectorAll('.ovc-tns-tab').forEach(function (btn) {
      btn.addEventListener('click', function () { switchTab(btn.dataset.tab, wrap); });
    });
    return wrap;
  }

  function montarNoticias(artigos) {
    var list = document.getElementById('ovc-tns-news-list');
    if (!list) return;
    if (!artigos.length) { list.innerHTML = '<div class="ovc-tns-empty">Cobertura chegando em breve.</div>'; return; }
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
        var ok = kw.some(function (k) { return t.indexOf(k) >= 0; });
        if (ok) vistos[p.id] = true;
        return ok;
      });
      montarNoticias(filtrados);
    }).catch(function () { montarNoticias([]); });
  }

  function init() {
    var alvo = document.getElementById('ovc-tenis-dash');
    if (!alvo) return;
    alvo.innerHTML = '<div class="ovc-tns-wrap"><div class="ovc-tns-body active" style="display:block;"><div class="ovc-tns-empty">Carregando dados ao vivo…</div></div></div>';
    fetchDados().then(function (porLiga) {
      alvo.innerHTML = '';
      alvo.appendChild(montarDashboard(porLiga));
      fetchNoticias();
    }).catch(function () {
      alvo.innerHTML = '<div class="ovc-tns-wrap"><div class="ovc-tns-body active" style="display:block;"><div class="ovc-tns-empty">Não foi possível carregar os dados agora.</div></div></div>';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
