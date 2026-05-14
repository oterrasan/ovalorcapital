// footer-patch.js — atualiza rodapé em todas as páginas do portal
(function () {
  function patch() {
    var bottom = document.querySelector('.footer-bottom');
    if (!bottom) return;

    // Atualiza copyright
    var copy = bottom.querySelector('div:first-child');
    if (copy) {
      copy.innerHTML = '© 2026 <strong>O Valor Capital</strong> — Redação OVC. Todos os direitos reservados. &nbsp;<span style="color:#aaa;font-size:.85em;">🔒 Conexão segura HTTPS</span>';
    }

    // Atualiza links do rodapé
    var links = bottom.querySelector('.footer-bottom-links');
    if (links) {
      links.innerHTML = [
        '<a href="/quem-somos/">Quem Somos</a>',
        '<a href="/politica-editorial/">Política Editorial</a>',
        '<a href="/termos/">Termos de Uso</a>',
        '<a href="/privacidade/">Privacidade</a>',
        '<a href="/cookies/">Cookies</a>'
      ].join('\n');
    }

    // Adiciona disclaimer editorial se ainda não existe
    if (!bottom.querySelector('.footer-disclaimer')) {
      var disc = document.createElement('div');
      disc.className = 'footer-disclaimer';
      disc.style.cssText = 'font-size:.78rem;color:#999;margin-top:12px;line-height:1.5;text-align:center;';
      disc.innerHTML = 'O conteúdo publicado no portal O Valor Capital tem caráter informativo e jornalístico. Não constitui recomendação de investimento. ' +
        'Reprodução permitida mediante citação da fonte. ' +
        'Redação OVC utiliza Inteligência Artificial supervisionada por equipe editorial. ' +
        'Responsável editorial: <strong>Roberto Cesar Terrasan</strong>.';
      bottom.appendChild(disc);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patch);
  } else {
    patch();
  }
})();
