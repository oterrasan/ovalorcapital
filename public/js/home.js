
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

// ============================================================
// CARD LIONS — REGRA INVIOLÁVEL
// Este card recebe EXCLUSIVAMENTE posts das categorias abaixo.
// Nenhuma IA, pipeline, admin ou código pode alterar essa lista.
// Categorias permitidas (user_tags): seguros
// Subcategorias permitidas: saúde-e-odonto, vida, previdência,
//   consórcio, seguros-da-familia, renda, geral (apenas dentro de seguros)
// Qualquer post fora dessas categorias é IGNORADO por esta função.
// ============================================================
(function(){
  const SUBCATS_PERMITIDAS = new Set([
    'saúde-e-odonto','saude-e-odonto','vida','previdência','previdencia',
    'consórcio','consorcio','seguros-da-familia','seguros da familia',
    'renda','geral','saúde','saude','seguro de vida','plano de saúde',
    'plano de saude','seguro de renda','kpis'
  ]);

  async function carregarCardLions() {
    try {
      const r = await fetch('/api/portal-posts?categoria=seguros&limit=20');
      if (!r.ok) return;
      const d = await r.json();
      const posts = (d.posts || []).filter(p => {
        // REGRA DURA: categoria obrigatoriamente "seguros"
        if (p.categoria !== 'seguros') return false;
        return true;
      });
      if (!posts.length) return;
      const post = posts[0];
      const titulo = document.getElementById('card-lions-titulo');
      const resumo = document.getElementById('card-lions-resumo');
      const link   = document.getElementById('card-lions-link');
      if (titulo) titulo.textContent = post.titulo;
      if (resumo) resumo.textContent = post.resumo || post.subtitulo || '';
      if (link)   link.href = post.url || '/seguros/';
    } catch(e) {
      console.error('[CardLions]', e);
    }
  }

  document.addEventListener('DOMContentLoaded', carregarCardLions);
})();
