/**
 * ovc-radar-mma.js — Dashboard premium MMA/UFC (dados ESPN, tempo real)
 * REGRA ZERO-I: 100% independente — não toca internal-page-v2.js nem home.js
 * Visual "espetacular": tema dark octógono, luta principal em destaque estilo
 * pôster de card, mesma linguagem do piloto do Motor/F1 e do ovc-torneio-espn.js.
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

  var ACC = CFG.cor || '#dc2626';
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
    if (document.getElementById('ovc-mma-css')) return;
    var sty = document.createElement('style');
    sty.id = 'ovc-mma-css';
    sty.textContent = [
      '@keyframes mma-sweep{0%{transform:translateX(-140%) skewX(-18deg)}100%{transform:translateX(260%) skewX(-18deg)}}',
      '@keyframes mma-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.8)}}',
      '@keyframes mma-rise{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}',
      '.ovc-mma-wrap{margin:18px 0;border-radius:14px;overflow:hidden;background:#0b0e14;',
        'box-shadow:0 20px 50px -20px rgba(0,0,0,.55);border:1px solid #201316;}',
      '.ovc-mma-hd{position:relative;overflow:hidden;padding:22px 22px 18px;',
        'background:repeating-linear-gradient(120deg,' + ACC_DARK + ' 0 26px,#14090a 26px 52px);}',
      '.ovc-mma-stripe{position:absolute;top:0;right:-8%;width:55%;height:100%;',
        'background:linear-gradient(100deg,transparent 0%,' + ACC + '33 45%,transparent 70%);pointer-events:none;}',
      '.ovc-mma-sweep{position:absolute;top:0;left:0;width:22%;height:100%;',
        'background:linear-gradient(100deg,transparent,rgba(255,255,255,.09),transparent);',
        'animation:mma-sweep 5.5s ease-in-out infinite;pointer-events:none;}',
      '.ovc-mma-hd-live{display:flex;align-items:center;gap:7px;margin-bottom:8px;position:relative;}',
      '.ovc-mma-dot{width:9px;height:9px;background:#fbbf24;border-radius:50%;animation:mma-pulse 1.1s ease-in-out infinite;flex-shrink:0;box-shadow:0 0 10px 2px rgba(251,191,36,.5);}',
      '.ovc-mma-hd-txt{font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#fbbf24;}',
      '.ovc-mma-hd-title{font-size:23px;font-weight:900;color:#fff;letter-spacing:-.02em;line-height:1.1;font-style:italic;position:relative;}',
      '.ovc-mma-hd-sobre{font-size:12px;color:rgba(255,255,255,.65);margin-top:8px;line-height:1.55;max-width:620px;position:relative;}',
      '.ovc-mma-tabs{display:flex;background:#0b0e14;border-bottom:1px solid #201316;}',
      '.ovc-mma-tab{flex:1;padding:12px 8px;text-align:center;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:rgba(255,255,255,.4);cursor:pointer;border-bottom:2px solid transparent;background:none;border-top:none;border-left:none;border-right:none;transition:color .15s;}',
      '.ovc-mma-tab.active{color:#fff;border-bottom-color:' + ACC + ';}',
      '.ovc-mma-body{display:none;padding:16px 18px;background:#0b0e14;}',
      '.ovc-mma-body.active{display:block;}',
      '.ovc-mma-card-name{font-size:15px;font-weight:900;color:#fff;letter-spacing:-.01em;}',
      '.ovc-mma-card-meta{font-size:11.5px;color:rgba(255,255,255,.5);margin-top:2px;}',
      '.ovc-mma-card-data{display:inline-block;font-size:10.5px;color:#0b0e14;font-weight:800;margin-top:8px;margin-bottom:14px;background:' + ACC + ';padding:3px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:.05em;}',

      // Luta principal — pôster em destaque, octógono sutil ao fundo
      '.ovc-mma-main{position:relative;border-radius:12px;padding:20px 16px;margin-bottom:14px;overflow:hidden;',
        'background:radial-gradient(circle at 50% 120%,' + ACC + '2e 0%,#14090a 60%);border:1px solid ' + ACC + '55;animation:mma-rise .5s ease-out;}',
      '.ovc-mma-main-badge{display:inline-block;font-size:9.5px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#fff;background:' + ACC + ';padding:3px 10px;border-radius:4px;margin-bottom:12px;}',
      '.ovc-mma-main-vs{display:flex;align-items:center;justify-content:center;gap:14px;}',
      '.ovc-mma-main-p{flex:1;text-align:center;font-size:15px;font-weight:900;color:#fff;line-height:1.25;}',
      '.ovc-mma-main-p.win{color:' + ACC + ';}',
      '.ovc-mma-main-x{font-size:12px;font-weight:800;color:rgba(255,255,255,.35);flex-shrink:0;}',
      '.ovc-mma-main-cat{text-align:center;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.45);margin-bottom:10px;}',
      '.ovc-mma-main-result{text-align:center;font-size:11.5px;color:#fbbf24;font-weight:700;margin-top:10px;}',

      '.ovc-mma-fight{display:flex;align-items:center;gap:10px;padding:11px 4px;border-bottom:1px solid #1a1116;}',
      '.ovc-mma-fight:last-child{border-bottom:none;}',
      '.ovc-mma-fight-cat{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:rgba(255,255,255,.32);width:64px;flex-shrink:0;line-height:1.3;}',
      '.ovc-mma-fight-vs{flex:1;display:flex;justify-content:space-between;align-items:center;font-size:12.5px;gap:8px;min-width:0;}',
      '.ovc-mma-fight-p{font-weight:700;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.ovc-mma-fight-p.win{color:' + ACC + ';}',
      '.ovc-mma-fight-vstxt{font-size:9.5px;font-weight:800;color:rgba(255,255,255,.28);flex-shrink:0;}',

      '.ovc-mma-empty{padding:22px 12px;text-align:center;color:rgba(255,255,255,.4);font-size:12.5px;}',
      '.ovc-mma-news{border-top:1px solid #201316;padding:16px 18px;background:#0b0e14;}',
      '.ovc-mma-news h4{font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.45);margin:0 0 10px;}',
      '.ovc-mma-news a{display:block;padding:9px 0;border-bottom:1px solid #1a1116;text-decoration:none;font-size:13px;',
        'font-weight:700;color:#e2e8f0;line-height:1.4;transition:color .15s,padding-left .15s;}',
      '.ovc-mma-news a:last-child{border-bottom:none;}',
      '.ovc-mma-news a:hover{color:' + ACC + ';padding-left:5px;}',
    ].join('');
    document.head.appendChild(sty);
  }

  function renderCard(card, tituloVazio) {
    if (!card || !card.lutas || !card.lutas.length) return '<div class="ovc-mma-empty">' + tituloVazio + '</div>';
    var main = card.lutas[0];
    var resto = card.lutas.slice(1);
    var p1win = main.completo && main.vencedor === main.lutador1;
    var p2win = main.completo && main.vencedor === main.lutador2;

    var html = '<div class="ovc-mma-card-name">' + esc(card.nome) + '</div>';
    if (card.local) html += '<div class="ovc-mma-card-meta">' + esc(card.local) + '</div>';
    if (card.data) html += '<div class="ovc-mma-card-data">' + dataBr(card.data) + '</div>';

    html += '<div class="ovc-mma-main">' +
      '<div class="ovc-mma-main-badge">Luta principal</div>' +
      (main.categoria ? '<div class="ovc-mma-main-cat">' + esc(main.categoria) + '</div>' : '') +
      '<div class="ovc-mma-main-vs">' +
      '<div class="ovc-mma-main-p' + (p1win ? ' win' : '') + '">' + esc(main.lutador1) + '</div>' +
      '<div class="ovc-mma-main-x">VS</div>' +
      '<div class="ovc-mma-main-p' + (p2win ? ' win' : '') + '">' + esc(main.lutador2) + '</div>' +
      '</div>' +
      (main.completo && main.metodo ? '<div class="ovc-mma-main-result">🏆 ' + esc(main.metodo) + '</div>' : '') +
      '</div>';

    if (resto.length) {
      html += resto.map(function (l) {
        var w1 = l.completo && l.vencedor === l.lutador1;
        var w2 = l.completo && l.vencedor === l.lutador2;
        return '<div class="ovc-mma-fight">' +
          '<div class="ovc-mma-fight-cat">' + esc(l.categoria || '') + '</div>' +
          '<div class="ovc-mma-fight-vs">' +
          '<span class="ovc-mma-fight-p' + (w1 ? ' win' : '') + '">' + esc(l.lutador1) + '</span>' +
          '<span class="ovc-mma-fight-vstxt">vs</span>' +
          '<span class="ovc-mma-fight-p' + (w2 ? ' win' : '') + '">' + esc(l.lutador2) + '</span>' +
          '</div></div>';
      }).join('');
    }
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
      '<div class="ovc-mma-hd"><div class="ovc-mma-stripe"></div><div class="ovc-mma-sweep"></div>' +
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
