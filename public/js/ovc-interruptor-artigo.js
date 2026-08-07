/**
 * ovc-interruptor-artigo.js — Interruptor Fim de Matéria (páginas de artigo)
 * REGRA ZERO-I: arquivo 100% independente — não compartilha DOM/estado com
 * ovc-interruptor-rail.js, ovc-interruptor-rodape.js, ovc-nota-luto.js nem
 * com internal-page-v2.js (que é EXTREMAMENTE FRÁGIL — nunca alterado aqui,
 * só observado via polling defensivo, mesmo padrão de esperarMiolo() em
 * ovc-nichos.js). Se este arquivo falhar, o resto da página continua
 * funcionando normalmente.
 *
 * Pedido por Roberto Terrasan em 07/08/2026: card interruptor em "areas do
 * portal onde possa fazer sentido" — matérias completas são a área com mais
 * tempo de leitura/atenção do usuário. Só aparece em páginas de artigo
 * (detecta via window.__OVC_ARTICLE__, setado pelo SSR de api/article.js —
 * mesma técnica já usada por ovc-audio.js) e só depois que
 * internal-page-v2.js termina de renderizar o corpo (.ovc-art-body).
 *
 * Controlado via api/manage.js — action=interruptor_status/interruptor_toggle,
 * slot=fim_artigo. Editável pelo admin (aba Configurações).
 */
(function () {
  'use strict';

  var SLOT = 'fim_artigo';

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function injetarCSS() {
    if (document.getElementById('ovc-interr-artigo-css')) return;
    var sty = document.createElement('style');
    sty.id = 'ovc-interr-artigo-css';
    sty.textContent = [
      '.ovc-interr-artigo{clear:both;margin:28px 0;padding:22px 26px;',
      '  background:#fdf8ec;border-left:4px solid #b8860b;border-radius:0 10px 10px 0;}',
      '.ovc-interr-artigo-eyebrow{font-size:10.5px;font-weight:800;letter-spacing:.08em;',
      '  text-transform:uppercase;color:#92670a;margin:0 0 8px;}',
      '.ovc-interr-artigo-titulo{font-size:17px;font-weight:800;color:var(--text-main,#0f172a);margin:0 0 8px;line-height:1.35;}',
      '.ovc-interr-artigo-texto{font-size:14.5px;line-height:1.65;color:var(--text-soft,#475569);margin:0 0 12px;}',
      '.ovc-interr-artigo-img{width:100%;max-height:220px;object-fit:cover;border-radius:6px;margin-bottom:12px;display:block;}',
      '.ovc-interr-artigo-cta{display:inline-flex;align-items:center;gap:6px;font-size:13px;',
      '  font-weight:700;color:#92670a;text-decoration:none;}',
      '.ovc-interr-artigo-cta:hover{text-decoration:underline;}'
    ].join('');
    document.head.appendChild(sty);
  }

  function montarCard(d) {
    var card = document.createElement('div');
    card.className = 'ovc-interr-artigo';
    card.id = 'ovc-interr-artigo';
    card.innerHTML =
      '<div class="ovc-interr-artigo-eyebrow">Destaque OVC</div>' +
      (d.imagem ? '<img class="ovc-interr-artigo-img" src="' + esc(d.imagem) + '" alt="" onerror="this.style.display=\'none\'">' : '') +
      '<h3 class="ovc-interr-artigo-titulo">' + esc(d.titulo) + '</h3>' +
      '<p class="ovc-interr-artigo-texto">' + esc(d.texto) + '</p>' +
      (d.link ? '<a class="ovc-interr-artigo-cta" href="' + esc(d.link) + '" target="_blank" rel="noopener">Saiba mais →</a>' : '');
    return card;
  }

  function esperarCorpoEInjetar(d) {
    var tentativas = 0;
    var timer = setInterval(function () {
      tentativas++;
      var corpo = document.querySelector('.ovc-art-body');
      if (corpo && !document.getElementById('ovc-interr-artigo')) {
        clearInterval(timer);
        injetarCSS();
        corpo.parentNode.insertBefore(montarCard(d), corpo.nextSibling);
        return;
      }
      if (tentativas > 60) clearInterval(timer); // ~15s — desiste silenciosamente
    }, 250);
  }

  function init() {
    if (!window.__OVC_ARTICLE__) return; // não é página de artigo

    fetch('/api/manage?action=interruptor_status&slot=' + SLOT)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.ativa) esperarCorpoEInjetar(d);
      })
      .catch(function () {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
