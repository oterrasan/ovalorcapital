/**
 * ovc-radar-tenis.js — Dashboard premium Tênis ATP/WTA (dados ESPN, tempo real)
 * REGRA ZERO-I: 100% independente — não toca internal-page-v2.js nem home.js
 * Visual "espetacular": tema dark com identidade de saibro/quadra, mini-pódio
 * de ranking (mesma linguagem do piloto do Motor/F1 e do ovc-torneio-espn.js).
 * Layout adaptado: sem tabela de liga (tênis não tem times jogando entre si) —
 * próximos jogos, últimos resultados e ranking ATP + WTA lado a lado.
 * Fonte de dados: ESPN via proxy server-side em api/live.js?action=espn&sport=tennis
 */
(function () {
  'use strict';

  function kwMatch(text, kw) {
    var esc = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(?:^|[^\\p{L}\\p{N}])' + esc + '(?:[^\\p{L}\\p{N}]|$)', 'iu').test(text);
  }

  var CFG = window.OVC_TENIS;
  if (!CFG) return;
  var LIGAS = CFG.ligas || ['atp', 'wta'];
  var LABEL = { atp: 'ATP · Masculino', wta: 'WTA · Feminino' };

  var ACC = CFG.cor || '#84cc16';
  var ACC_DARK = CFG.corDark || '#0b0e14';

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
      '@keyframes tns-sweep{0%{transform:translateX(-140%) skewX(-18deg)}100%{transform:translateX(260%) skewX(-18deg)}}',
      '@keyframes tns-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.8)}}',
      '@keyframes tns-rise{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}',
      '.ovc-tns-wrap{margin:18px 0;border-radius:14px;overflow:hidden;background:#0b0e14;',
        'box-shadow:0 20px 50px -20px rgba(0,0,0,.55);border:1px solid #1f2430;}',
      '.ovc-tns-hd{position:relative;overflow:hidden;padding:22px 22px 18px;',
        'background:repeating-linear-gradient(120deg,' + ACC_DARK + ' 0 26px,#0a1409 26px 52px);}',
      '.ovc-tns-stripe{position:absolute;top:0;right:-8%;width:55%;height:100%;',
        'background:linear-gradient(100deg,transparent 0%,' + ACC + '33 45%,transparent 70%);pointer-events:none;}',
      '.ovc-tns-sweep{position:absolute;top:0;left:0;width:22%;height:100%;',
        'background:linear-gradient(100deg,transparent,rgba(255,255,255,.09),transparent);',
        'animation:tns-sweep 5.5s ease-in-out infinite;pointer-events:none;}',
      '.ovc-tns-hd-live{display:flex;align-items:center;gap:7px;margin-bottom:8px;position:relative;}',
      '.ovc-tns-dot{width:9px;height:9px;background:' + ACC + ';border-radius:50%;animation:tns-pulse 1.1s ease-in-out infinite;flex-shrink:0;box-shadow:0 0 10px 2px ' + ACC + '80;}',
      '.ovc-tns-hd-txt{font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:' + ACC + ';}',
      '.ovc-tns-hd-title{font-size:23px;font-weight:900;color:#fff;letter-spacing:-.02em;line-height:1.1;font-style:italic;position:relative;}',
      '.ovc-tns-hd-sobre{font-size:12px;color:rgba(255,255,255,.65);margin-top:8px;line-height:1.55;max-width:620px;position:relative;}',
      '.ovc-tns-tabs{display:flex;background:#0b0e14;border-bottom:1px solid #1f2430;}',
      '.ovc-tns-tab{flex:1;padding:12px 8px;text-align:center;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:rgba(255,255,255,.4);cursor:pointer;border-bottom:2px solid transparent;background:none;border-top:none;border-left:none;border-right:none;transition:color .15s;}',
      '.ovc-tns-tab.active{color:#fff;border-bottom-color:' + ACC + ';}',
      '.ovc-tns-body{display:none;padding:16px 18px;background:#0b0e14;}',
      '.ovc-tns-body.active{display:block;}',
      '.ovc-tns-gcard{margin-bottom:18px;}',
      '.ovc-tns-gcard:last-child{margin-bottom:0;}',
      '.ovc-tns-gcard-hd{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:' + ACC + ';margin-bottom:10px;}',
      '.ovc-tns-subhd{font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:rgba(255,255,255,.35);margin:10px 0 8px;}',
      '.ovc-tns-subhd:first-of-type{margin-top:0;}',
      '.ovc-tns-match{border-radius:8px;padding:10px 12px;margin-bottom:7px;background:#12161f;border:1px solid #1f2430;}',
      '.ovc-tns-match:last-child{margin-bottom:0;}',
      '.ovc-tns-match-vs{display:flex;justify-content:space-between;align-items:center;font-size:12.5px;gap:8px;}',
      '.ovc-tns-match-p{font-weight:700;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.ovc-tns-match-sc{font-weight:900;color:' + ACC + ';font-size:12.5px;flex-shrink:0;margin-left:8px;}',
      '.ovc-tns-match-meta{font-size:10.5px;color:rgba(255,255,255,.4);margin-top:5px;}',
      '.ovc-tns-empty{padding:22px 12px;text-align:center;color:rgba(255,255,255,.4);font-size:12.5px;}',

      // Mini-pódio do ranking — top 3, mesma linguagem visual do Motor/torneio
      '.ovc-tns-leaders{display:flex;align-items:flex-end;justify-content:center;gap:8px;margin-bottom:16px;}',
      '.ovc-tns-leader{flex:1;max-width:110px;text-align:center;animation:tns-rise .5s ease-out;}',
      '.ovc-tns-leader-nome{font-size:10.5px;font-weight:800;color:#fff;line-height:1.25;margin-bottom:8px;',
        'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:26px;}',
      '.ovc-tns-leader-bar{border-radius:8px 8px 0 0;display:flex;align-items:flex-start;justify-content:center;padding-top:8px;color:#0b0e14;font-weight:900;}',
      '.ovc-tns-leader-bar .n{font-size:11px;}',
      '.ovc-tns-leader-bar .p{display:block;font-size:14px;margin-top:2px;}',
      '.ovc-tns-leader.p1 .ovc-tns-leader-bar{height:60px;background:linear-gradient(160deg,#fbbf24,#d97706);}',
      '.ovc-tns-leader.p2 .ovc-tns-leader-bar{height:44px;background:linear-gradient(160deg,#cbd5e1,#94a3b8);}',
      '.ovc-tns-leader.p3 .ovc-tns-leader-bar{height:34px;background:linear-gradient(160deg,#d97757,#b45309);}',
      '.ovc-tns-rank{display:flex;align-items:center;gap:9px;padding:8px 4px;border-bottom:1px solid #1a1f2c;font-size:12.5px;}',
      '.ovc-tns-rank:last-child{border-bottom:none;}',
      '.ovc-tns-rank-pos{width:24px;font-weight:800;color:rgba(255,255,255,.35);font-size:11px;text-align:center;flex-shrink:0;}',
      '.ovc-tns-rank-nome{flex:1;min-width:0;font-weight:700;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.ovc-tns-rank-pts{font-weight:900;color:' + ACC + ';font-size:12.5px;flex-shrink:0;}',

      '.ovc-tns-news{border-top:1px solid #1f2430;padding:16px 18px;background:#0b0e14;}',
      '.ovc-tns-news h4{font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.45);margin:0 0 10px;}',
      '.ovc-tns-news a{display:block;padding:9px 0;border-bottom:1px solid #1a1f2c;text-decoration:none;font-size:13px;',
        'font-weight:700;color:#e2e8f0;line-height:1.4;transition:color .15s,padding-left .15s;}',
      '.ovc-tns-news a:last-child{border-bottom:none;}',
      '.ovc-tns-news a:hover{color:' + ACC + ';padding-left:5px;}',
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
            '<span class="ovc-tns-match-p">' + esc(j.jogador1.nome) + ' <span style="color:rgba(255,255,255,.35);font-weight:400;">vs</span> ' + esc(j.jogador2.nome) + '</span></div>' +
            (j.data ? '<div class="ovc-tns-match-meta">' + dataBr(j.data) + (j.fase ? ' · ' + esc(j.fase) : '') + '</div>' : '') +
            '</div>';
        }).join('');
      }
      if (d.ultimosResultados.length) {
        html += '<div class="ovc-tns-subhd">Últimos resultados</div>' + d.ultimosResultados.slice(-5).reverse().map(function (j) {
          return '<div class="ovc-tns-match"><div class="ovc-tns-match-vs">' +
            '<span class="ovc-tns-match-p">' + esc(j.jogador1.nome) + '</span><span class="ovc-tns-match-sc">' + esc(j.jogador1.placar) + '</span></div>' +
            '<div class="ovc-tns-match-vs" style="margin-top:3px;"><span class="ovc-tns-match-p">' + esc(j.jogador2.nome) + '</span><span class="ovc-tns-match-sc">' + esc(j.jogador2.placar) + '</span></div>' +
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

  function renderLeaders(ranking) {
    if (ranking.length < 3) return '';
    var ord = [1, 0, 2];
    return '<div class="ovc-tns-leaders">' + ord.map(function (i) {
      var r = ranking[i];
      if (!r) return '';
      var cls = ['p2', 'p1', 'p3'][ord.indexOf(i)];
      return '<div class="ovc-tns-leader ' + cls + '">' +
        '<div class="ovc-tns-leader-nome">' + esc(r.nome) + '</div>' +
        '<div class="ovc-tns-leader-bar"><span><span class="n">' + r.pos + 'º</span><span class="p">' + (r.pts || '') + '</span></span></div>' +
        '</div>';
    }).join('') + '</div>';
  }

  function renderRanking(porLiga) {
    var html = '';
    LIGAS.forEach(function (liga) {
      var d = porLiga[liga] || { ranking: [] };
      html += '<div class="ovc-tns-gcard"><div class="ovc-tns-gcard-hd">' + esc(LABEL[liga] || liga.toUpperCase()) + '</div>';
      if (d.ranking.length) {
        html += renderLeaders(d.ranking);
        html += d.ranking.slice(3, 10).map(function (r) {
          return '<div class="ovc-tns-rank"><span class="ovc-tns-rank-pos">' + r.pos + 'º</span>' +
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
      '<div class="ovc-tns-hd"><div class="ovc-tns-stripe"></div><div class="ovc-tns-sweep"></div>' +
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
