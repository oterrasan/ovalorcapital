/**
 * ovc-nota-luto.js — Card de Nota (Luto/Campanha) na home
 * REGRA ZERO-I: arquivo 100% independente — não toca em home.js, ovc-cards.js
 * nem em nenhum outro widget. Se este arquivo falhar, o resto da home
 * continua funcionando normalmente.
 *
 * Pedido por Roberto Terrasan em 07/08/2026: card grande, com imagem, mesmo
 * padrão visual dos 3 cards de destaque (.hero-region) — imagem de fundo +
 * overlay escuro + título/texto sobrepostos + botão opcional — posicionado
 * logo abaixo deles. Controlado por interruptor em config (api/manage.js —
 * nota_luto_status/nota_luto_toggle), editável pelo admin (aba Configurações),
 * sem precisar de novo deploy.
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
      // Variante COM imagem — mesmo padrão visual dos cards de destaque:
      // background-image + overlay gradiente + texto branco sobreposto.
      '.ovc-nota-luto-card-img{position:relative;min-height:320px;border-radius:12px;overflow:hidden;',
      '  background-size:cover;background-position:center;display:flex;align-items:flex-end;',
      '  box-shadow:0 10px 30px -14px rgba(0,0,0,.5);}',
      '.ovc-nota-luto-card-img::before{content:"";position:absolute;inset:0;',
      '  background:linear-gradient(to top,rgba(0,0,0,.92) 0%,rgba(0,0,0,.55) 45%,rgba(0,0,0,.10) 100%);}',
      '.ovc-nota-luto-inner{position:relative;padding:28px 32px;z-index:1;}',
      '.ovc-nota-luto-titulo-img{font-size:26px;font-weight:800;margin:0 0 10px;color:#fff;',
      '  text-shadow:0 2px 10px rgba(0,0,0,.6);line-height:1.25;}',
      '.ovc-nota-luto-texto-img{font-size:15.5px;line-height:1.65;color:#e5e5e5;margin:0 0 14px;max-width:720px;}',
      '.ovc-nota-luto-cta{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;',
      '  background:#b91c1c;color:#fff;font-size:13px;font-weight:700;border-radius:6px;',
      '  text-decoration:none;transition:background .15s;}',
      '.ovc-nota-luto-cta:hover{background:#991616;}',
      // Variante SEM imagem — card escuro sóbrio (fallback quando nenhuma imagem foi definida).
      '.ovc-nota-luto-card{background:#181818;color:#f1f1f1;border-radius:12px;',
      '  padding:26px 30px;display:flex;align-items:flex-start;gap:18px;',
      '  border-left:5px solid #6b7280;box-shadow:0 10px 30px -14px rgba(0,0,0,.5);}',
      '.ovc-nota-luto-icon{font-size:34px;line-height:1;flex-shrink:0;}',
      '.ovc-nota-luto-titulo{font-size:20px;font-weight:800;margin:0 0 8px;color:#fff;}',
      '.ovc-nota-luto-texto{font-size:15.5px;line-height:1.65;color:#d4d4d4;margin:0;}',
      '@media (max-width:560px){.ovc-nota-luto-card,.ovc-nota-luto-inner{padding:20px;}',
      '  .ovc-nota-luto-card{flex-direction:column;}.ovc-nota-luto-titulo-img{font-size:21px;}}'
    ].join('');
    document.head.appendChild(sty);
  }

  function injetar(d) {
    var hero = document.querySelector('.hero-region');
    if (!hero || document.getElementById('ovc-nota-luto')) return;

    injetarCSS();

    var slot = document.createElement('div');
    slot.className = 'ovc-nota-luto-slot';
    slot.id = 'ovc-nota-luto';

    var ctaHtml = d.link
      ? '<a class="ovc-nota-luto-cta" href="' + esc(d.link) + '" target="_blank" rel="noopener">Saiba mais <span>→</span></a>'
      : '';

    if (d.imagem) {
      var cardImg = document.createElement('div');
      cardImg.className = 'ovc-nota-luto-card-img';
      cardImg.style.backgroundImage = "url('" + d.imagem.replace(/'/g, "%27") + "')";
      cardImg.innerHTML =
        '<div class="ovc-nota-luto-inner">' +
        '<h2 class="ovc-nota-luto-titulo-img">' + esc(d.titulo) + '</h2>' +
        '<p class="ovc-nota-luto-texto-img">' + esc(d.texto) + '</p>' +
        ctaHtml +
        '</div>';
      slot.appendChild(cardImg);
    } else {
      var card = document.createElement('div');
      card.className = 'ovc-nota-luto-card';
      card.innerHTML =
        '<span class="ovc-nota-luto-icon" aria-hidden="true">🕯️</span>' +
        '<div><h2 class="ovc-nota-luto-titulo">' + esc(d.titulo) + '</h2>' +
        '<p class="ovc-nota-luto-texto">' + esc(d.texto) + '</p>' +
        (ctaHtml ? '<div style="margin-top:12px;">' + ctaHtml + '</div>' : '') +
        '</div>';
      slot.appendChild(card);
    }

    hero.parentNode.insertBefore(slot, hero.nextSibling);
  }

  function init() {
    fetch('/api/manage?action=nota_luto_status')
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
