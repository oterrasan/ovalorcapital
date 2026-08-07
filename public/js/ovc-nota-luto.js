/**
 * ovc-nota-luto.js — Card de Nota de Pesar/Luto na home
 * REGRA ZERO-I: arquivo 100% independente — não toca em home.js, ovc-cards.js
 * nem em nenhum outro widget. Se este arquivo falhar, o resto da home
 * continua funcionando normalmente.
 *
 * Pedido por Roberto Terrasan em 07/08/2026: card grande, reutilizável,
 * posicionado logo abaixo dos 3 cards de destaque (.hero-region), controlado
 * por um interruptor em config (api/manage.js — nota_luto_status/nota_luto_toggle)
 * em vez de expiração fixa por código — Roberto liga/desliga quando quiser,
 * sem precisar de novo deploy.
 *
 * Liga:    /api/manage?action=nota_luto_toggle&pass=SENHA&on=1
 * Desliga: /api/manage?action=nota_luto_toggle&pass=SENHA&on=0
 * Trocar texto ao ligar: &on=1&titulo=...&texto=... (URL-encoded)
 */
(function () {
  'use strict';

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function injetarCSS() {
    if (document.getElementById('ovc-nota-luto-css')) return;
    var sty = document.createElement('style');
    sty.id = 'ovc-nota-luto-css';
    sty.textContent = [
      '.ovc-nota-luto-slot{grid-column:2 / 5;margin:18px 0 0;}',
      '@media (max-width:1024px){.ovc-nota-luto-slot{grid-column:1;}}',
      '.ovc-nota-luto-card{background:#181818;color:#f1f1f1;border-radius:12px;',
      '  padding:26px 30px;display:flex;align-items:flex-start;gap:18px;',
      '  border-left:5px solid #6b7280;box-shadow:0 10px 30px -14px rgba(0,0,0,.5);}',
      '.ovc-nota-luto-icon{font-size:34px;line-height:1;flex-shrink:0;}',
      '.ovc-nota-luto-titulo{font-size:20px;font-weight:800;margin:0 0 8px;color:#fff;}',
      '.ovc-nota-luto-texto{font-size:15.5px;line-height:1.65;color:#d4d4d4;margin:0;}',
      '@media (max-width:560px){.ovc-nota-luto-card{flex-direction:column;padding:20px;}}'
    ].join('');
    document.head.appendChild(sty);
  }

  function injetar(titulo, texto) {
    var hero = document.querySelector('.hero-region');
    if (!hero || document.getElementById('ovc-nota-luto')) return;

    injetarCSS();

    var slot = document.createElement('div');
    slot.className = 'ovc-nota-luto-slot';
    slot.id = 'ovc-nota-luto';

    var card = document.createElement('div');
    card.className = 'ovc-nota-luto-card';
    card.innerHTML =
      '<span class="ovc-nota-luto-icon" aria-hidden="true">🕯️</span>' +
      '<div><h2 class="ovc-nota-luto-titulo">' + esc(titulo) + '</h2>' +
      '<p class="ovc-nota-luto-texto">' + esc(texto) + '</p></div>';

    slot.appendChild(card);
    hero.parentNode.insertBefore(slot, hero.nextSibling);
  }

  function init() {
    fetch('/api/manage?action=nota_luto_status')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.ativa) injetar(d.titulo, d.texto);
      })
      .catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
