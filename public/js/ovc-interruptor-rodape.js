/**
 * ovc-interruptor-rodape.js — Interruptor Rodapé (todas as páginas)
 * REGRA ZERO-I: arquivo 100% independente — não compartilha DOM/estado com
 * ovc-interruptor-rail.js, ovc-interruptor-artigo.js, ovc-nota-luto.js
 * nem com nenhum outro widget. Se este arquivo falhar, o resto da página
 * continua funcionando normalmente.
 *
 * Pedido por Roberto Terrasan em 07/08/2026: card interruptor "embaixo,
 * antes do rodape". Faixa horizontal, largura total, inserida imediatamente
 * antes de <footer class="footer"> — presente em toda página do portal
 * (home + todas as internas), então um único widget cobre o site inteiro.
 *
 * Controlado via api/manage.js — action=interruptor_status/interruptor_toggle,
 * slot=rodape. Editável pelo admin (aba Configurações).
 */
(function () {
  'use strict';

  var SLOT = 'rodape';

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function injetarCSS() {
    if (document.getElementById('ovc-interr-rodape-css')) return;
    var sty = document.createElement('style');
    sty.id = 'ovc-interr-rodape-css';
    sty.textContent = [
      '.ovc-interr-rodape{max-width:1280px;margin:32px auto 0;padding:20px 24px;',
      '  background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;',
      '  display:flex;align-items:center;gap:20px;flex-wrap:wrap;}',
      '.ovc-interr-rodape-img{width:96px;height:96px;object-fit:cover;border-radius:8px;flex-shrink:0;}',
      '.ovc-interr-rodape-body{flex:1 1 260px;min-width:0;}',
      '.ovc-interr-rodape-titulo{font-size:16px;font-weight:800;color:var(--text-main,#0f172a);margin:0 0 4px;}',
      '.ovc-interr-rodape-texto{font-size:13.5px;line-height:1.5;color:var(--text-soft,#475569);margin:0;}',
      '.ovc-interr-rodape-cta{flex-shrink:0;display:inline-flex;align-items:center;gap:6px;',
      '  padding:10px 18px;background:#b91c1c;color:#fff;font-size:13px;font-weight:700;',
      '  border-radius:6px;text-decoration:none;white-space:nowrap;transition:background .15s;}',
      '.ovc-interr-rodape-cta:hover{background:#991616;}',
      '@media (max-width:560px){.ovc-interr-rodape{padding:16px;}.ovc-interr-rodape-img{width:72px;height:72px;}}'
    ].join('');
    document.head.appendChild(sty);
  }

  function injetar(d) {
    var footer = document.querySelector('footer.footer');
    if (!footer || document.getElementById('ovc-interr-rodape')) return;

    injetarCSS();

    var faixa = document.createElement('div');
    faixa.className = 'ovc-interr-rodape';
    faixa.id = 'ovc-interr-rodape';
    faixa.innerHTML =
      (d.imagem ? '<img class="ovc-interr-rodape-img" src="' + esc(d.imagem) + '" alt="" onerror="this.style.display=\'none\'">' : '') +
      '<div class="ovc-interr-rodape-body">' +
      '<div class="ovc-interr-rodape-titulo">' + esc(d.titulo) + '</div>' +
      '<p class="ovc-interr-rodape-texto">' + esc(d.texto) + '</p>' +
      '</div>' +
      (d.link ? '<a class="ovc-interr-rodape-cta" href="' + esc(d.link) + '" target="_blank" rel="noopener">Saiba mais →</a>' : '');

    footer.parentNode.insertBefore(faixa, footer);
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
