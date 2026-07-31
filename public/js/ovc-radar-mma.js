/**
 * ovc-radar-mma.js — Dashboard premium MMA/UFC (dados ESPN, tempo real)
 * REGRA ZERO-I: 100% independente — não toca internal-page-v2.js nem home.js
 * Layout adaptado: sem tabela de liga e sem ranking (MMA é evento/card de lutas,
 * não temporada de pontos corridos) — próximo card, resultado do último card.
 * Fonte de dados: ESPN via proxy server-side em api/live.js?action=espn&sport=mma
 */
(function () {
  'use strict';

  function kwMatch(text, kw) {
    var esc = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(?:^|[^\\p{L}\\p{N}])' + esc + '(?:[^\\p{L}\\p{N}]|$)', 'iu').test(text);
  }

  var CFG = window.OVC_MMA;
  if (!CFG || !CFG.liga) return;

  var ACC = CFG.cor || '#b91c1c';
  var ACC_DARK = CFG.corDark || '#18181b';

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
    if (document.getElementById('ovc-mma-css')) return;
    var sty = document.createElement('style');
    sty.id = 'ovc-mma-css';
    sty.textContent = [
      '.ovc-mma-wrap{margin:18px 0;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:var(--bg-elevated,#fff);}',
      '.ovc-mma-hd{background:linear-gradient(135deg,' + ACC_DARK + ' 0%,#27272a 60%,' + ACC + ' 140%);padding:16px 18px;}',
      '.ovc-mma-hd-live{display:flex;align-items:center;gap:6px;margin-bottom:4px;}',
      '.ovc-mma-dot{width:8px;height:8px;background:#fbbf24;border-radius:50%;animation:mma-pulse 1s ease-in-out infinite;flex-shrink:0;}',
      '@keyframes mma-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}',
      '.ovc-mma-hd-txt{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#fbbf24;}',
      '.ovc-mma-hd-title{font-size:18px;font-weight:800;color:#fff;letter-spacing:-.01em;}',
      '.ovc-mma-hd-sobre{font-size:11.5px;color:rgba(255,255,255,.72);margin-top:5px;line-height:1.5;max-width:640px;}',
      '.ovc-mma-tabs{display:flex;border-bottom:1px solid #e5e7eb;background:#f8fafc;}',
      '.ovc-mma-tab{flex:1;padding:10px 8px;text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#64748b;cursor:pointer;border-bottom:2px solid transparent;background:none;border-top:none;border-left:none;border-right:none;}',
      '.ovc-mma-tab.active{color:' + ACC + ';border-bottom-color:' + ACC + ';background:#fff;}',
      '.ovc-mma-body{display:none;padding:14px 16px;}',
      '.ovc-mma-body.active{display:block;}',
      '.ovc-mma-card-name{font-size:14px;font-weight:800;color:var(--text-main,#0f172a);}',
      '.ovc-mma-card-meta{font-size:11.5px;color:#64748b;margin-top:2px;}',
      '.ovc-mma-card-data{font-size:11px;color:' + ACC + ';font-weight:700;margin-top:6px;margin-bottom:10px;}',
      '.ovc-mma-fight{border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;margin-bottom:8px;}',
      '.ovc-mma-fight:last-child{margin-bottom:0;}',
      '.ovc-mma-fight-cat{font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;margin-bottom:4px;}',
      '.ovc-mma-fight-vs{display:flex;justify-content:space-between;align-items:center;font-size:13px;gap:8px;}',
      '.ovc-mma-fight-p{font-weight:700;color:var(--text-main,#0f172a);}',
      '.ovc-mma-fight-p.win{color:' + ACC + ';}',
      '.ovc-mma-fight-meta{font-size:10.5px;color:#94a3b8;margin-top:4px;}',
      '.ovc-mma-empty{padding:18px 4px;text-align:center;color:#94a3b8;font-size:12px;}',
      '.ovc-mma-news{border-top:1px solid #e5e7eb;padding:12px 16px;}',
      '.ovc-mma-news h4{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin:0 0 8px;}',
      '.ovc-mma-news a{display:block;padding:7px 0;border-bottom:1px solid #f1f5f9;text-decoration:none;font-size:13px;font-weight:600;color:var(--text-main,#0f172a);line-height:1.4;}',
      '.ovc-mma-news a:last-child{border-bottom:none;}',
      '.ovc-mma-news a:hover{color:' + ACC + ';}',
    ].join('');
    document.head.appendChild(sty);
  }

  function renderCard(card, tituloVazio) {
    if (!card || !card.lutas || !card.lutas.length) return '<div class="ovc-mma-empty">' + tituloVazio + '</div>';
    var html = '<div class="ovc-mma-card-name">' + esc(card.nome) + '</div>';
    if (card.local) html += '<div class="ovc-mma-card-meta">' + esc(card.local) + '</div>';
    if (card.data) html += '<div class="ovc-mma-card-data">' + dataBr(card.data) + '</div>';
    html += card.lutas.map(function (l) {
      var p1win = l.completo && l.vencedor === l.lutador1;
      var p2win = l.completo && l.vencedor === l.lutador2;
      return '<div class="ovc-mma-fight">' +
        (l.categoria ? '<div class="ovc-mma-fight-cat">' + esc(l.categoria) + '</div>' : '') +
        '<div class="ovc-mma-fight-vs"><span class="ovc-mma-fight-p' + (p1win ? ' win' : '') + '">' + esc(l.lutador1) + '</span>' +
        '<span style="color:#94a3b8;font-weight:400;font-size:11px;">vs</span>' +
        '<span class="ovc-mma-fight-p' + (p2win ? ' win' : '') + '">' + esc(l.lutador2) + '</span></div>' +
        (l.completo && l.metodo ? '<div class="ovc-mma-fight-meta">' + esc(l.metodo) + '</div>' : '') +
        '</div>';
    }).join('');
    return html;
  }

  function fetchDados() {
    return fetch('/api/live?action=espn&sport=mma&liga=' + encodeURIComponent(CFG.liga), { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.ok) return { proxima: null, ultima: null };
        return { proxima: d.proxima || null, ultima: d.ultima || null };
      })
      .catch(function () { return { proxima: null, ultima: null }; });
  }

  function switchTab(tab, root) {
    root.querySelectorAll('.ovc-mma-tab').forEach(function (el) { el.classList.toggle('active', el.dataset.tab === tab); });
    root.querySelectorAll('.ovc-mma-body').forEach(function (el) { el.classList.toggle('active', el.dataset.body === tab); });
  }

  function montarDashboard(dados) {
    injetarCSS();
    var wrap = document.createElement('div');
    wrap.className = 'ovc-mma-wrap';
    wrap.innerHTML =
      '<div class="ovc-mma-hd">' +
      '<div class="ovc-mma-hd-live"><span class="ovc-mma-dot"></span><span class="ovc-mma-hd-txt">Dados ao vivo · ESPN</span></div>' +
      '<div class="ovc-mma-hd-title">' + esc(CFG.nome) + '</div>' +
      (CFG.sobre ? '<div class="ovc-mma-hd-sobre">' + esc(CFG.sobre) + '</div>' : '') +
      '</div>' +
      '<div class="ovc-mma-tabs">' +
      '<button class="ovc-mma-tab active" data-tab="proximo">Próximo card</button>' +
      '<button class="ovc-mma-tab" data-tab="ultimo">Último card</button>' +
      '</div>' +
      '<div class="ovc-mma-body active" data-body="proximo">' + renderCard(dados.proxima, 'Nenhum evento agendado no momento') + '</div>' +
      '<div class="ovc-mma-body" data-body="ultimo">' + renderCard(dados.ultima, 'Resultado indisponível no momento') + '</div>' +
      '<div class="ovc-mma-news" id="ovc-mma-news"><h4>Notícias do MMA</h4><div id="ovc-mma-news-list"><div class="ovc-mma-empty">Carregando…</div></div></div>';

    wrap.querySelectorAll('.ovc-mma-tab').forEach(function (btn) {
      btn.addEventListener('click', function () { switchTab(btn.dataset.tab, wrap); });
    });
    return wrap;
  }

  function montarNoticias(artigos) {
    var list = document.getElementById('ovc-mma-news-list');
    if (!list) return;
    if (!artigos.length) { list.innerHTML = '<div class="ovc-mma-empty">Cobertura chegando em breve.</div>'; return; }
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
    var alvo = document.getElementById('ovc-mma-dash');
    if (!alvo) return;
    alvo.innerHTML = '<div class="ovc-mma-wrap"><div class="ovc-mma-body active" style="display:block;"><div class="ovc-mma-empty">Carregando dados ao vivo…</div></div></div>';
    fetchDados().then(function (dados) {
      alvo.innerHTML = '';
      alvo.appendChild(montarDashboard(dados));
      fetchNoticias();
    }).catch(function () {
      alvo.innerHTML = '<div class="ovc-mma-wrap"><div class="ovc-mma-body active" style="display:block;"><div class="ovc-mma-empty">Não foi possível carregar os dados agora.</div></div></div>';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
