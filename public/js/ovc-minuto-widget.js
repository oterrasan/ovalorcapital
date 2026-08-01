/**
 * ovc-minuto-widget.js — Componente compartilhado das páginas "X Hoje" (Dólar/Selic/Ibovespa)
 * e do hub /minuto/. REGRA ZERO-I: 100% independente — não toca internal-page-v2.js nem home.js.
 * Consome ?curtinhas=true&tipo=minuto[&topico=SLUG] — modo isolado da query balanceada usada
 * por ovc-nichos.js na home, nunca mistura com ela.
 * Config via atributos data-* no elemento alvo:
 *   data-topico  — "dolar" | "selic" | "ibovespa" | ausente (= hub, todos os Minutos)
 */
(function () {
  'use strict';

  var REFRESH_MS = 120000; // reconsulta a cada 2min — reforça a proposta "ao vivo" sem SSR

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
    if (document.getElementById('ovc-mnt-css')) return;
    var sty = document.createElement('style');
    sty.id = 'ovc-mnt-css';
    sty.textContent = [
      '.ovc-mnt-wrap{margin:18px 0;}',
      '.ovc-mnt-trust{font-size:11.5px;color:#64748b;margin:0 0 16px;display:flex;align-items:center;gap:6px;font-weight:600;}',
      '.ovc-mnt-trust b{color:#059669;}',
      '.ovc-mnt-featured{display:block;border:1px solid #e5e7eb;border-radius:14px;padding:22px 24px;margin-bottom:18px;background:#fff;text-decoration:none;transition:box-shadow .15s,transform .15s;}',
      '.ovc-mnt-featured:hover{box-shadow:0 10px 26px rgba(0,0,0,.1);transform:translateY(-2px);}',
      '.ovc-mnt-featured-badge{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;font-weight:800;color:#059669;text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px;}',
      '.ovc-mnt-dot{width:7px;height:7px;border-radius:50%;background:#059669;display:inline-block;animation:ovc-mnt-pulse 1.6s infinite;}',
      '@keyframes ovc-mnt-pulse{0%{opacity:1}50%{opacity:.3}100%{opacity:1}}',
      '.ovc-mnt-featured-title{font-size:21px;font-weight:800;color:var(--text-main,#0f172a);line-height:1.3;margin-bottom:8px;}',
      '.ovc-mnt-featured-resumo{font-size:14px;color:#475569;line-height:1.6;margin-bottom:10px;}',
      '.ovc-mnt-featured-time{font-size:11.5px;color:#94a3b8;font-weight:600;}',
      '.ovc-mnt-list{display:flex;flex-direction:column;gap:0;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;background:#fff;}',
      '.ovc-mnt-item{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;text-decoration:none;border-bottom:1px solid #f1f5f9;transition:background .12s;}',
      '.ovc-mnt-item:last-child{border-bottom:none;}',
      '.ovc-mnt-item:hover{background:#f8fafc;}',
      '.ovc-mnt-item-time{font-size:10.5px;color:#94a3b8;font-weight:700;white-space:nowrap;padding-top:2px;min-width:80px;}',
      '.ovc-mnt-item-body{flex:1;min-width:0;}',
      '.ovc-mnt-item-title{font-size:13.5px;font-weight:700;color:var(--text-main,#0f172a);line-height:1.4;}',
      '.ovc-mnt-item-resumo{font-size:12px;color:#64748b;line-height:1.5;margin-top:3px;}',
      '.ovc-mnt-empty{padding:26px 14px;text-align:center;color:#94a3b8;font-size:13px;border:1px dashed #e5e7eb;border-radius:10px;}',
      '.ovc-mnt-section-title{font-size:12.5px;font-weight:800;color:#0f172a;margin:18px 0 10px;text-transform:uppercase;letter-spacing:.05em;}',
    ].join('');
    document.head.appendChild(sty);
  }

  function buildHref(p) {
    return p.url || ('/' + (p.categoria || 'economia') + '/');
  }

  function renderFeatured(p) {
    return '<a class="ovc-mnt-featured" href="' + esc(buildHref(p)) + '">' +
      '<span class="ovc-mnt-featured-badge"><span class="ovc-mnt-dot"></span>Minuto OVC · ' + minutosAtras(p.data) + '</span>' +
      '<div class="ovc-mnt-featured-title">' + esc(p.titulo) + '</div>' +
      '<div class="ovc-mnt-featured-resumo">' + esc(p.resumo) + '</div>' +
      '</a>';
  }

  function renderItem(p) {
    return '<a class="ovc-mnt-item" href="' + esc(buildHref(p)) + '">' +
      '<span class="ovc-mnt-item-time">' + esc(minutosAtras(p.data)) + '</span>' +
      '<span class="ovc-mnt-item-body">' +
        '<span class="ovc-mnt-item-title">' + esc(p.titulo) + '</span>' +
        '<span class="ovc-mnt-item-resumo">' + esc(p.resumo) + '</span>' +
      '</span></a>';
  }

  function montar(alvo, lista) {
    injetarCSS();
    if (!lista.length) {
      alvo.innerHTML = '<div class="ovc-mnt-wrap"><div class="ovc-mnt-empty">Nenhum Minuto OVC publicado na última hora. Volte em instantes.</div></div>';
      return;
    }
    var featured = lista[0];
    var resto = lista.slice(1, 15);
    var html = '<div class="ovc-mnt-wrap">' +
      '<div class="ovc-mnt-trust"><b>&#9679;</b> Atualizado automaticamente com fatos publicados na última hora</div>' +
      renderFeatured(featured);
    if (resto.length) {
      html += '<div class="ovc-mnt-section-title">Últimos registros</div>' +
        '<div class="ovc-mnt-list">' + resto.map(renderItem).join('') + '</div>';
    }
    html += '</div>';
    alvo.innerHTML = html;
  }

  function carregar(alvo, topico) {
    var qs = 'curtinhas=true&tipo=minuto&limit=' + (topico ? 15 : 30);
    if (topico) qs += '&topico=' + encodeURIComponent(topico);
    fetch('/api/portal-posts?' + qs)
      .then(function (r) { return r.json(); })
      .then(function (d) { montar(alvo, d.curtinhas || []); })
      .catch(function () { montar(alvo, []); });
  }

  function init() {
    var alvo = document.getElementById('ovc-minuto-dash');
    if (!alvo) return;
    var topico = (alvo.getAttribute('data-topico') || '').trim().toLowerCase();
    alvo.innerHTML = '<div class="ovc-mnt-wrap"><div class="ovc-mnt-empty">Carregando…</div></div>';
    carregar(alvo, topico);
    setInterval(function () { carregar(alvo, topico); }, REFRESH_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
