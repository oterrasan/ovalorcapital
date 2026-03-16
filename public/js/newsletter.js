(function(){
  const form = document.getElementById('ovc-newsletter-form');
  const status = document.getElementById('ovc-newsletter-status');
  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = 'Enviando...';
    const email = form.email.value.trim();
    try {
      const response = await fetch('/api/newsletter/subscribe', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Falha ao cadastrar');
      status.textContent = 'Pronto. Você entrou na newsletter do OVC.';
      form.reset();
    } catch (error) { status.textContent = error.message; }
  });
})();
