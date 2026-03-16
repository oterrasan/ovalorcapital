(function(){
  const body = document.body;
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const current = body.getAttribute('data-theme') || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      body.setAttribute('data-theme', next);
      localStorage.setItem('ovc-theme', next);
    });
  }

  const saved = localStorage.getItem('ovc-theme');
  if (saved === 'dark') body.setAttribute('data-theme', 'dark');
  else body.setAttribute('data-theme', 'light');

  async function updateImpostometro() {
    try {
      const response = await fetch('/api/impostometro');
      const data = await response.json();
      if (data.ok && data.arrecadado) {
        const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(data.arrecadado);
        const elemento = document.querySelector('.impostometro-valor, #impostometro');
        if (elemento) elemento.textContent = formatted;
      }
    } catch (error) { console.error(error); }
  }

  async function updateCotacoes() {
    try {
      const response = await fetch('/api/ptax');
      const data = await response.json();
      if (data.ok && data.rates) {
        const write = (selector, value) => { const el = document.querySelector(selector); if (el) el.textContent = value; };
        if (data.rates.USD) write('#cotacao-usd', `R$ ${data.rates.USD.sell.toFixed(2)}`);
        if (data.rates.EUR) write('#cotacao-eur', `R$ ${data.rates.EUR.sell.toFixed(2)}`);
        if (data.indices?.IBOV) write('#cotacao-ibov', `${data.indices.IBOV.value.toLocaleString('pt-BR')} pts`);
      }
    } catch (error) { console.error(error); }
  }

  updateImpostometro();
  updateCotacoes();
  setInterval(updateImpostometro, 60000);
  setInterval(updateCotacoes, 180000);
})();
