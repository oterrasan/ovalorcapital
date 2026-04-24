
(async function(){
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('[data-newsletter-form]');
    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = form.querySelector('input[type="email"]').value.trim();
      const topics = Array.from(form.querySelectorAll('input[name="topics"]:checked')).map(item => item.value);
      const result = await OVC.fetchJSON('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, topics, source: 'newsletter-page' })
      });
      alert(result.duplicate ? 'Este e-mail já está cadastrado.' : 'Cadastro realizado com sucesso.');
      form.reset();
    });
  });
})();
