
(function(){
  async function updateLiveWidgets() {
    try {
      const data = await OVC.fetchJSON('/api/live-data');
      const usd = document.getElementById('cotacao-usd');
      const eur = document.getElementById('cotacao-eur');
      const ibov = document.getElementById('cotacao-ibov');
      if (usd) usd.textContent = `R$ ${Number(data.rates?.usd || 0).toFixed(2)}`;
      if (eur) eur.textContent = `R$ ${Number(data.rates?.eur || 0).toFixed(2)}`;
      if (ibov) ibov.textContent = `${Number(data.indices?.ibov || 0).toLocaleString('pt-BR')} pts`;
      const impost = document.getElementById('impostometro');
      if (impost) impost.textContent = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(data.impostometro || 0));
      const tvCard = document.querySelector('[data-home-live-tv]');
      if (tvCard && data.tv?.length) tvCard.textContent = data.tv[0].label;
      const radioCard = document.querySelector('[data-home-live-radio]');
      if (radioCard && data.radio?.name) radioCard.textContent = `${data.radio.name} · ${data.radio.currentShow || 'Ao vivo'}`;
    } catch (error) {
      console.error(error);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateLiveWidgets();
    setInterval(updateLiveWidgets, 120000);
  });
})();
