/**
 * ovc-interruptor-rail.js — Interruptor Rail Lateral (páginas internas)
 * REGRA ZERO-I: arquivo 100% independente — não compartilha DOM/estado com
 * ovc-interruptor-rodape.js, ovc-interruptor-artigo.js, ovc-nota-luto.js
 * nem com nenhum outro widget. Se este arquivo falhar, o resto da página
 * continua funcionando normalmente.
 *
 * Pedido por Roberto Terrasan em 07/08/2026: vários cards interruptores
 * pelo portal, cada um independente e visualmente distinto. Este cobre o
 * rail lateral (.ovc-right-rail) das páginas de categoria/artigo — card
 * compacto, vertical, entra como último item do rail para não empurrar
 * conteúdo existente (nav de subcategoria, últimas notícias etc.).
 *
 * Controlado via api/manage.js — action=interruptor_status/interruptor_toggle,
 * slot=rail_lateral. Editável pelo admin (aba Configurações).
 */
(function () {
  'use strict';

  var SLOT = 'rail_lateral';

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function injetarCSS() {
    if (document.getElementById('ovc-interr-rail-css')) return;
    var sty = document.createElement('style');
    sty.id = 'ovc-interr-rail-css';
    sty.textContent = [
      '.ovc-interr-rail{margin-top:16px;background:var(--bg-elevated,#fff);border:1px solid var(--border-subtle,#e2e8f0);',
      '  border-top:3px solid #0369a1;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.05);}',
      '.ovc-interr-rail-img{width:100%;height:120px;object-fit:cover;display:block;}',
      '.ovc-interr-rail-body{padding:14px 16px;}',
      '.ovc-interr-rail-titulo{font-size:14.5px;font-weight:800;color:var(--text-main,#0f172a);margin:0 0 6px;line-height:1.35;}',
      '.ovc-interr-rail-texto{font-size:12.5px;line-height:1.55;color:var(--text-soft,#475569);margin:0 0 10px;}',
      '.ovc-interr-rail-cta{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:700;color:#0369a1;text-decoration:none;}',
      '.ovc-interr-rail-cta:hover{text-decoration:underline;}'
    ].join('');
    document.head.appendChild(sty);
  }

  function injetar(d) {
    var rail = document.querySelector('.ovc-right-rail');
    if (!rail || document.getElementById('ovc-interr-rail')) return;

    injetarCSS();

    var card = document.createElement('div');
    card.className = 'ovc-interr-rail';
    card.id = 'ovc-interr-rail';
    card.innerHTML =
      (d.imagem ? '<img class="ovc-interr-rail-img" src="' + esc(d.imagem) + '" alt="" onerror="this.style.display=\'none\'">' : '') +
      '<div class="ovc-interr-rail-body">' +
      '<h3 class="ovc-interr-rail-titulo">' + esc(d.titulo) + '</h3>' +
      '<p class="ovc-interr-rail-texto">' + esc(d.texto) + '</p>' +
      (d.link ? '<a class="ovc-interr-rail-cta" href="' + esc(d.link) + '" target="_blank" rel="noopener">Saiba mais →</a>' : '') +
      '</div>';

    rail.appendChild(card);
  }

  function init() {
    fetch('/api/manage?action=interruptor_status&slot=' + SLOT)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.ativa) injetar(d);
      })
      .catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
