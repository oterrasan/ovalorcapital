/**
 * ovc-pulso-br-page.js — lógica da página dedicada /pulso-br/
 * REGRA ZERO-I: arquivo independente, exclusivo desta página. Não é
 * carregado em nenhuma outra rota do portal e não lê/escreve nada de
 * ovc-pulso-br.js (o widget do rail da Home) — mesmo princípio editorial,
 * implementações totalmente separadas, como motor/index.html + ovc-radar-motor.js.
 */
(function () {
  'use strict';

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function slugify(s) {
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 55);
  }
  function buildHref(p) {
    var cat = p.categoria || 'economia';
    return '/' + cat + '/' + slugify(p.titulo) + '-' + String(p.id || '').slice(0, 8) + '/';
  }
  function kwMatch(text, kw) {
    var re = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(?:^|[^\\p{L}\\p{N}])' + re + '(?:[^\\p{L}\\p{N}]|$)', 'iu').test(text);
  }
  function fmtNum(n, casas) {
    if (n == null || !isFinite(n)) return '—';
    return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
  }
  function fmtBig(n) {
    if (n == null || !isFinite(n)) return 'R$ —';
    return 'R$ ' + Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  }
  function tempoAtras(iso) {
    try {
      var diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
      if (diffMin < 1) return 'agora mesmo';
      if (diffMin < 60) return 'há ' + diffMin + ' min';
      var diffH = Math.floor(diffMin / 60);
      if (diffH < 24) return 'há ' + diffH + 'h';
      return 'há ' + Math.floor(diffH / 24) + 'd';
    } catch (_) { return ''; }
  }

  var SETORES = [
    { key: 'agro',       label: 'Agronegócio',        icon: '🌾', kw: ['agronegócio','soja','milho','safra','commodities agrícolas','embrapa','conab','fertilizante','pecuária','agro '] },
    { key: 'industria',  label: 'Indústria',           icon: '🏭', kw: ['indústria','industrial','manufatura','fiesp','cni ','produção industrial','fábrica','chão de fábrica'] },
    { key: 'varejo',     label: 'Varejo & Consumo',    icon: '🛒', kw: ['varejo','consumo','vendas no varejo','black friday','shopping','e-commerce','inflação de alimentos'] },
    { key: 'energia',    label: 'Energia',             icon: '⚡', kw: ['petrobras','energia elétrica','combustível','gasolina','diesel','aneel','ons ','petróleo','pré-sal'] },
    { key: 'financeiro', label: 'Sistema Financeiro',  icon: '🏦', kw: ['banco central','febraban','crédito','inadimplência','juros bancários','fintech','b3 ','bolsa de valores'] },
    { key: 'trabalho',   label: 'Emprego & Renda',     icon: '👷', kw: ['caged','desemprego','carteira assinada','salário mínimo','mercado de trabalho','emprego formal'] },
    { key: 'fiscal',     label: 'Contas Públicas',     icon: '📑', kw: ['déficit','superávit','arcabouço fiscal','dívida pública','orçamento da união','tesouro nacional','meta fiscal'] },
    { key: 'cambio',     label: 'Câmbio & Comércio Ext.', icon: '🌐', kw: ['balança comercial','exportação','importação','câmbio','dólar comercial','superávit comercial'] },
    { key: 'imoveis',    label: 'Imóveis & Construção', icon: '🏗️', kw: ['construção civil','financiamento imobiliário','minha casa minha vida','incorporadora','imóveis'] },
    { key: 'tecnologia', label: 'Tecnologia & Inovação', icon: '💻', kw: ['startup','fintech ','inteligência artificial','tecnologia','inovação','venture capital'] }
  ];

  function classificarSetor(titulo) {
    var t = (titulo || '').toLowerCase();
    for (var i = 0; i < SETORES.length; i++) {
      var s = SETORES[i];
      for (var j = 0; j < s.kw.length; j++) {
        if (kwMatch(t, s.kw[j].trim())) return s.key;
      }
    }
    return null;
  }

  function trendClass(v) {
    if (v == null) return 'pb-flat';
    if (v > 0) return 'pb-up';
    if (v < 0) return 'pb-down';
    return 'pb-flat';
  }
  function trendArrow(v) {
    if (v == null) return '—';
    if (v > 0) return '▲ ' + fmtNum(Math.abs(v), 2) + '%';
    if (v < 0) return '▼ ' + fmtNum(Math.abs(v), 2) + '%';
    return '· estável';
  }

  function renderTicker(live) {
    var itens = [
      ['SELIC', live && live.selic ? fmtNum(live.selic.valor, 2) + '%' : '—'],
      ['IPCA 12M', live && live.ipca ? fmtNum(live.ipca.valor, 2) + '%' : '—'],
      ['USD/BRL', live && live.usd ? fmtNum(live.usd.valor, 3) : '—'],
      ['EUR/BRL', live && live.eur ? fmtNum(live.eur.valor, 3) : '—'],
      ['IBOVESPA', live && live.ibov ? fmtNum(live.ibov.valor, 0) + ' pts' : '—'],
      ['BTC/BRL', live && live.btc ? fmtNum(live.btc.valor, 0) : '—'],
      ['IMPOSTÔMETRO', live ? fmtBig(live.impostometro) : '—']
    ];
    var frag = itens.map(function (it) {
      return '<span class="pb-tick-item"><b>' + it[0] + '</b> ' + it[1] + '</span>';
    }).join('<span class="pb-tick-sep">•</span>');
    // Duplicado para o loop de scroll contínuo ficar sem costura
    return frag + '<span class="pb-tick-sep">•</span>' + frag;
  }

  function renderVitals(live) {
    var cards = [
      { label: 'Selic (meta)', valor: live && live.selic ? fmtNum(live.selic.valor, 2) + '%' : '—', v: live && live.selic ? live.selic.variacao : null, desc: 'Taxa básica de juros definida pelo Copom, referência para todo o crédito no país.' },
      { label: 'IPCA · 12 meses', valor: live && live.ipca ? fmtNum(live.ipca.valor, 2) + '%' : '—', v: live && live.ipca ? live.ipca.variacao : null, desc: 'Inflação oficial acumulada, medida pelo IBGE, referência das metas do Banco Central.' },
      { label: 'Dólar comercial', valor: live && live.usd ? 'R$ ' + fmtNum(live.usd.valor, 3) : '—', v: live && live.usd ? live.usd.variacao : null, desc: 'Cotação de fechamento/tempo real do câmbio USD/BRL.' },
      { label: 'Euro', valor: live && live.eur ? 'R$ ' + fmtNum(live.eur.valor, 3) : '—', v: live && live.eur ? live.eur.variacao : null, desc: 'Cotação do euro frente ao real.' },
      { label: 'Ibovespa', valor: live && live.ibov ? fmtNum(live.ibov.valor, 0) + ' pts' : '—', v: live && live.ibov ? live.ibov.variacao : null, desc: 'Principal índice da bolsa brasileira (B3).' },
      { label: 'Impostômetro 2026', valor: live ? fmtBig(live.impostometro) : '—', v: null, desc: 'Estimativa da arrecadação de impostos no Brasil desde 1º de janeiro.', big: true }
    ];
    return cards.map(function (c) {
      return '' +
        '<div class="pb-vcard' + (c.big ? ' pb-vcard-big' : '') + '">' +
        '  <div class="pb-vcard-label">' + esc(c.label) + '</div>' +
        '  <div class="pb-vcard-val">' + c.valor + '</div>' +
        (c.v !== null ? '  <div class="pb-vcard-trend ' + trendClass(c.v) + '">' + trendArrow(c.v) + '</div>' : '') +
        '  <div class="pb-vcard-desc">' + esc(c.desc) + '</div>' +
        '</div>';
    }).join('');
  }

  function renderSetores(porSetor) {
    return SETORES.map(function (s) {
      var lista = porSetor[s.key] || [];
      var corpo = lista.length
        ? lista.slice(0, 3).map(function (p) {
            return '<a class="pb-setor-item" href="' + buildHref(p) + '">' +
              '<span class="pb-setor-item-dot"></span>' +
              '<span>' + esc(p.titulo) + '</span>' +
              '</a>';
          }).join('')
        : '<div class="pb-setor-empty">Sem novidade nas últimas horas.</div>';
      return '' +
        '<div class="pb-setor-card">' +
        '  <div class="pb-setor-head"><span class="pb-setor-icon">' + s.icon + '</span><span class="pb-setor-label">' + esc(s.label) + '</span></div>' +
        '  <div class="pb-setor-body">' + corpo + '</div>' +
        '</div>';
    }).join('');
  }

  function renderFeed(posts) {
    if (!posts.length) return '<div class="pb-feed-empty">Nenhuma matéria de economia nacional publicada nas últimas horas.</div>';
    return posts.slice(0, 24).map(function (p) {
      var img = p.imagem ? '<div class="pb-feed-img" style="background-image:url(\'' + esc(p.imagem) + '\')"></div>' : '<div class="pb-feed-img pb-feed-img-empty">🇧🇷</div>';
      return '' +
        '<a class="pb-feed-item" href="' + buildHref(p) + '">' +
        img +
        '  <div class="pb-feed-body">' +
        '    <span class="pb-feed-cat">' + esc((p.categoria || 'economia').toUpperCase()) + '</span>' +
        '    <div class="pb-feed-title">' + esc(p.titulo) + '</div>' +
        '    <span class="pb-feed-time">' + esc(tempoAtras(p.data)) + '</span>' +
        '  </div>' +
        '</a>';
    }).join('');
  }

  function buscarLive() {
    return fetch('/api/portal-posts?format=live-data').then(function (r) { return r.json(); }).catch(function () { return null; });
  }
  function buscarArtigos() {
    return fetch('/api/portal-posts?recentes=true&limit=300').then(function (r) { return r.json(); }).then(function (d) {
      var todos = (d && d.posts) || [];
      return todos.filter(function (p) {
        return p.categoria === 'economia' || p.categoria === 'negocios' || p.categoria === 'financas';
      });
    }).catch(function () { return []; });
  }

  function montarSetorMapa(posts) {
    var mapa = {};
    for (var i = 0; i < posts.length; i++) {
      var p = posts[i];
      var setor = classificarSetor(p.titulo);
      if (!setor) continue;
      if (!mapa[setor]) mapa[setor] = [];
      mapa[setor].push(p);
    }
    return mapa;
  }

  function atualizarTudo(live, artigos) {
    var ticker = document.getElementById('pb-ticker-track');
    if (ticker) ticker.innerHTML = renderTicker(live);

    var vitals = document.getElementById('pb-vitals-grid');
    if (vitals) vitals.innerHTML = renderVitals(live);

    var setoresEl = document.getElementById('pb-setores-grid');
    if (setoresEl) setoresEl.innerHTML = renderSetores(montarSetorMapa(artigos));

    var feedEl = document.getElementById('pb-feed-list');
    if (feedEl) feedEl.innerHTML = renderFeed(artigos);

    var upd = document.getElementById('pb-updated-at');
    if (upd) upd.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function init() {
    Promise.all([buscarLive(), buscarArtigos()]).then(function (results) {
      atualizarTudo(results[0], results[1]);
    });

    setInterval(function () {
      buscarLive().then(function (live) {
        var ticker = document.getElementById('pb-ticker-track');
        if (ticker) ticker.innerHTML = renderTicker(live);
        var vitals = document.getElementById('pb-vitals-grid');
        if (vitals) vitals.innerHTML = renderVitals(live);
        var upd = document.getElementById('pb-updated-at');
        if (upd) upd.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      });
    }, 60000);

    setInterval(function () {
      buscarArtigos().then(function (artigos) {
        var setoresEl = document.getElementById('pb-setores-grid');
        if (setoresEl) setoresEl.innerHTML = renderSetores(montarSetorMapa(artigos));
        var feedEl = document.getElementById('pb-feed-list');
        if (feedEl) feedEl.innerHTML = renderFeed(artigos);
      });
    }, 180000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
