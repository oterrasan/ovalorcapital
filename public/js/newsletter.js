
(async function(){
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('[data-newsletter-form]');
    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const email = form.querySelector('input[type="email"]').value.trim();
      const topics = Array.from(form.querySelectorAll('input[name="topics"]:checked')).map(item => item.value);
      if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }
      try {
        const result = await OVC.fetchJSON('/api/manage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'newsletter_subscribe', email, topics, source: 'newsletter-page' })
        });
        alert(result.ok ? (result.duplicate ? 'Este e-mail já está cadastrado.' : 'Cadastro realizado com sucesso.') : (result.error || 'Erro ao cadastrar. Tente novamente.'));
        if (result.ok) form.reset();
      } catch (_) {
        alert('Erro de conexão. Tente novamente.');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Quero receber'; }
      }
    });
  });
})();
