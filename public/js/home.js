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

  // ============================================================
  // CARD HERO — REGRA INVIOLÁVEL
  // ACEITA: categoria "politica" OU "economia" — todas as subcategorias
  // REJEITA: qualquer outra categoria, sem exceção, sem interpretação
  // ============================================================
  const CATS_HERO = new Set(['politica', 'economia']);

  async function carregarCardHero() {
    try {
      let post = null;
      for (const cat of CATS_HERO) {
        if (post) break;
        const r = await fetch(`/api/portal-posts?categoria=${cat}&limit=20`);
        if (!r.ok) continue;
        const d = await r.json();
        const encontrado = (d.posts || []).find(p => CATS_HERO.has(p.categoria));
        if (encontrado) post = encontrado;
      }
      if (!post) return;
      const titulo = document.getElementById('card-hero-titulo');
      const meta   = document.getElementById('card-hero-meta');
      const resumo = document.getElementById('card-hero-resumo');
      const link   = document.getElementById('card-hero-link');
      if (titulo) titulo.textContent = post.titulo;
      if (meta)   meta.textContent   = 'Redação OVC';
      if (resumo) resumo.textContent = post.resumo || post.subtitulo || '';
      if (link)   link.href          = post.url || '/politica/';
    } catch(e) { console.error('[CardHero]', e); }
  }

  // ============================================================
  // CARD MEIO — REGRA INVIOLÁVEL
  // ACEITA: categoria "negocios" — todas as subcategorias abaixo:
  //   empreender-mei-me-ltda, tributacao-pj, gestao-financeira,
  //   credito, vendas-e-preco, contratos-e-societario,
  //   lgpd-e-compliance, startups
  // REJEITA: qualquer outra categoria, sem exceção, sem interpretação
  // ============================================================
  async function carregarCardNegocios() {
    try {
      const r = await fetch('/api/portal-posts?categoria=negocios&limit=20');
      if (!r.ok) return;
      const d = await r.json();
      const post = (d.posts || []).find(p => p.categoria === 'negocios');
      if (!post) return;
      const titulo = document.getElementById('card-feature-titulo');
      const resumo = document.getElementById('card-feature-resumo');
      const link   = document.getElementById('card-feature-link');
      if (titulo) titulo.textContent = post.titulo;
      if (resumo) resumo.textContent = post.resumo || post.subtitulo || '';
      if (link)   link.href          = post.url || '/negocios/';
    } catch(e) { console.error('[CardNegocios]', e); }
  }

  // ============================================================
  // CARD LIONS — REGRA INVIOLÁVEL
  // ACEITA: categoria "seguros" — subcategorias:
  //   saude-e-odonto, vida, auto, residencial,
  //   empresarial-e-rc, viagem, kpis
  // REJEITA: qualquer outra categoria, sem exceção, sem interpretação
  // ============================================================
  async function carregarCardLions() {
    try {
      const r = await fetch('/api/portal-posts?categoria=seguros&limit=20');
      if (!r.ok) return;
      const d = await r.json();
      const post = (d.posts || []).find(p => p.categoria === 'seguros');
      if (!post) return;
      const titulo = document.getElementById('card-lions-titulo');
      const resumo = document.getElementById('card-lions-resumo');
      const link   = document.getElementById('card-lions-link');
      if (titulo) titulo.textContent = post.titulo;
      if (resumo) resumo.textContent = post.resumo || post.subtitulo || '';
      if (link)   link.href          = post.url || '/seguros/';
    } catch(e) { console.error('[CardLions]', e); }
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateLiveWidgets();
    setInterval(updateLiveWidgets, 120000);
    carregarCardHero();
    carregarCardNegocios();
    carregarCardLions();
  });
})();
