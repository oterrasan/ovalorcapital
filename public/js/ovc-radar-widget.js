/**
 * ovc-radar-widget.js — Listagem completa do Radar OVC (tipo_conteudo="radar")
 * REGRA ZERO-I: 100% independente — não toca internal-page-v2.js nem home.js.
 * Consome ?curtinhas=true&tipo=radar[&categoria=SLUG] — modo isolado da query balanceada
 * usada por ovc-nichos.js na home, nunca mistura com ela.
 * Desde 31/07/2026 (Roberto), tipo_conteudo="radar" é exclusivamente conteúdo de futebol
 * (grande repercussão nacional/continental) — este widget é a listagem completa e
 * cronológica desse nicho, no mesmo padrão do hub /minuto/ (ovc-minuto-widget.js).
 * Config via atributos data-* no elemento alvo:
 *   data-categoria — filtra por categoria (opcional, ex: "esportes")
 */
(function () {
  'use strict';

  var REFRESH_MS = 120000; // reconsulta a cada 2min — mesma proposta "ao vivo" do Minuto OVC

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function dataCurta(dt) {
    try { return new Date(dt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch (_) { return ''; }
  }

  function minutosAtras(dt) {
    try {
      var diff = Math.floor((Date.now() - new Date(dt).getTime()) / 60000);
      if (diff < 1) return 'agora mesmo';
      if (diff === 1) return 'há 1 minuto';
      if (diff < 60) return 'há ' + diff + ' minutos';
      return dataCurta(dt);
    } catch (_) { return ''; }
  }

  function injetarCSS() {
    if (document.getElementById('ovc-rdr-css')) return;
    var sty = document.createElement('style');
    sty.id = 'ovc-rdr-css';
    sty.textContent = [
      '.ovc-rdr-wrap{margin:18px 0;}',
      '.ovc-rdr-trust{font-size:11.5px;color:#64748b;margin:0 0 16px;display:flex;align-items:center;gap:6px;font-weight:600;}',
      '.ovc-rdr-trust b{color:#dc2626;}',
      '.ovc-rdr-featured{display:block;border:1px solid #e5e7eb;border-radius:14px;padding:22px 24px;margin-bottom:18px;background:#fff;text-decoration:none;transition:box-shadow .15s,transform .15s;}',
      '.ovc-rdr-featured:hover{box-shadow:0 10px 26px rgba(0,0,0,.1);transform:translateY(-2px);}',
      '.ovc-rdr-featured-badge{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;font-weight:800;color:#dc2626;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px;}',
      '.ovc-rdr-dot{width:7px;height:7px;border-radius:50%;background:#dc2626;display:inline-block;animation:ovc-rdr-pulse 1.6s infinite;}',
      '@keyframes ovc-rdr-pulse{0%{opacity:1}50%{opacity:.3}100%{opacity:1}}',
      '.ovc-rdr-featured-title{font-size:21px;font-weight:800;color:var(--text-main,#0f172a);line-height:1.3;margin-bottom:8px;}',
      '.ovc-rdr-featured-resumo{font-size:14px;color:#475569;line-height:1.6;margin-bottom:10px;}',
      '.ovc-rdr-featured-time{font-size:11.5px;color:#94a3b8;font-weight:600;}',
      '.ovc-rdr-list{display:flex;flex-direction:column;gap:0;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;background:#fff;}',
      '.ovc-rdr-item{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;text-decoration:none;border-bottom:1px solid #f1f5f9;transition:background .12s;}',
      '.ovc-rdr-item:last-child{border-bottom:none;}',
      '.ovc-rdr-item:hover{background:#f8fafc;}',
      '.ovc-rdr-item-time{font-size:10.5px;color:#94a3b8;font-weight:700;white-space:nowrap;padding-top:2px;min-width:80px;}',
      '.ovc-rdr-item-body{flex:1;min-width:0;}',
      '.ovc-rdr-item-title{font-size:13.5px;font-weight:700;color:var(--text-main,#0f172a);line-height:1.4;}',
      '.ovc-rdr-item-resumo{font-size:12px;color:#64748b;line-height:1.5;margin-top:3px;}',
      '.ovc-rdr-empty{padding:26px 14px;text-align:center;color:#94a3b8;font-size:13px;border:1px dashed #e5e7eb;border-radius:10px;}',
      '.ovc-rdr-section-title{font-size:12.5px;font-weight:800;color:#0f172a;margin:18px 0 10px;text-transform:uppercase;letter-spacing:.05em;}',
    ].join('');
    document.head.appendChild(sty);
  }

  function buildHref(p) {
    return p.url || ('/' + (p.categoria || 'esportes') + '/');
  }

  function renderFeatured(p) {
    return '<a class="ovc-rdr-featured" href="' + esc(buildHref(p)) + '">' +
      '<span class="ovc-rdr-featured-badge"><span class="ovc-rdr-dot"></span>Radar OVC · ' + minutosAtras(p.data) + '</span>' +
      '<div class="ovc-rdr-featured-title">' + esc(p.titulo) + '</div>' +
      '<div class="ovc-rdr-featured-resumo">' + esc(p.resumo) + '</div>' +
      '</a>';
  }

  function renderItem(p) {
    return '<a class="ovc-rdr-item" href="' + esc(buildHref(p)) + '">' +
      '<span class="ovc-rdr-item-time">' + esc(minutosAtras(p.data)) + '</span>' +
      '<span class="ovc-rdr-item-body">' +
        '<span class="ovc-rdr-item-title">' + esc(p.titulo) + '</span>' +
        '<span class="ovc-rdr-item-resumo">' + esc(p.resumo) + '</span>' +
      '</span></a>';
  }

  function montar(alvo, lista) {
    injetarCSS();
    if (!lista.length) {
      alvo.innerHTML = '<div class="ovc-rdr-wrap"><div class="ovc-rdr-empty">Nenhum Radar OVC publicado nas últimas horas. Volte em instantes.</div></div>';
      return;
    }
    var featured = lista[0];
    var resto = lista.slice(1, 30);
    var html = '<div class="ovc-rdr-wrap">' +
      '<div class="ovc-rdr-trust"><b>&#9679;</b> Grande repercussão do futebol nacional e continental, em ordem cronológica</div>' +
      renderFeatured(featured);
    if (resto.length) {
      html += '<div class="ovc-rdr-section-title">Últimos registros</div>' +
        '<div class="ovc-rdr-list">' + resto.map(renderItem).join('') + '</div>';
    }
    html += '</div>';
    alvo.innerHTML = html;
  }

  function carregar(alvo, categoria) {
    var qs = 'curtinhas=true&tipo=radar&limit=30';
    if (categoria) qs += '&categoria=' + encodeURIComponent(categoria);
    fetch('/api/portal-posts?' + qs)
      .then(function (r) { return r.json(); })
      .then(function (d) { montar(alvo, d.curtinhas || []); })
      .catch(function () { montar(alvo, []); });
  }

  function init() {
    var alvo = document.getElementById('ovc-radar-dash');
    if (!alvo) return;
    var categoria = (alvo.getAttribute('data-categoria') || '').trim().toLowerCase();
    alvo.innerHTML = '<div class="ovc-rdr-wrap"><div class="ovc-rdr-empty">Carregando…</div></div>';
    carregar(alvo, categoria);
    setInterval(function () { carregar(alvo, categoria); }, REFRESH_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
