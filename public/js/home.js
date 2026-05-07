(function(){

  // IDs de posts já exibidos nas áreas de destaque (hero/feature/lions)
  // As seções dinâmicas filtram esses IDs para não duplicar
  const idsDestaque = new Set();

  // === COTAÇÕES AO VIVO ===
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
    } catch(e) { console.error(e); }
  }

  // ============================================================
  // CARD HERO — REGRA INVIOLÁVEL
  // ACEITA: "politica" OU "economia" — todas subcategorias
  // REJEITA: qualquer outra categoria, sem exceção
  // ============================================================
  async function carregarCardHero() {
    try {
      let post = null;
      for (const cat of ['politica','economia']) {
        if (post) break;
        const r = await fetch(`/api/portal-posts?categoria=${cat}&limit=10`);
        if (!r.ok) continue;
        const d = await r.json();
        post = (d.posts||[]).find(p => p.categoria===cat) || null;
      }
      if (!post) return;
      if (post.id) idsDestaque.add(post.id);
      const el = id => document.getElementById(id);
      if (el('card-hero-titulo')) el('card-hero-titulo').textContent = post.titulo;
      if (el('card-hero-meta'))   el('card-hero-meta').textContent   = 'Redação OVC';
      if (el('card-hero-resumo')) el('card-hero-resumo').textContent = post.resumo || post.subtitulo || '';
      if (el('card-hero-link'))   el('card-hero-link').href          = post.url || '/politica/';
    } catch(e) { console.error('[Hero]',e); }
  }

  // ============================================================
  // CARD MEIO — REGRA INVIOLÁVEL
  // ACEITA: "negocios" — todas subcategorias
  // REJEITA: qualquer outra categoria, sem exceção
  // ============================================================
  async function carregarCardNegocios() {
    try {
      const r = await fetch('/api/portal-posts?categoria=negocios&limit=10');
      if (!r.ok) return;
      const d = await r.json();
      const post = (d.posts||[]).find(p => p.categoria==='negocios');
      if (!post) return;
      if (post.id) idsDestaque.add(post.id);
      const el = id => document.getElementById(id);
      if (el('card-feature-titulo')) el('card-feature-titulo').textContent = post.titulo;
      if (el('card-feature-resumo')) el('card-feature-resumo').textContent = post.resumo || post.subtitulo || '';
      if (el('card-feature-link'))   el('card-feature-link').href          = post.url || '/negocios/';
    } catch(e) { console.error('[Negocios]',e); }
  }

  // ============================================================
  // CARD LIONS — REGRA INVIOLÁVEL
  // ACEITA: "seguros" — subcategorias: saude-e-odonto, vida, auto,
  //   residencial, empresarial-e-rc, viagem, kpis
  // REJEITA: qualquer outra categoria, sem exceção
  // ============================================================
  async function carregarCardLions() {
    try {
      const r = await fetch('/api/portal-posts?categoria=seguros&limit=10');
      if (!r.ok) return;
      const d = await r.json();
      const post = (d.posts||[]).find(p => p.categoria==='seguros');
      if (!post) return;
      if (post.id) idsDestaque.add(post.id);
      const el = id => document.getElementById(id);
      if (el('card-lions-titulo')) el('card-lions-titulo').textContent = post.titulo;
      if (el('card-lions-resumo')) el('card-lions-resumo').textContent = post.resumo || post.subtitulo || '';
      if (el('card-lions-link'))   el('card-lions-link').href          = post.url || '/seguros/';
    } catch(e) { console.error('[Lions]',e); }
  }

  // ============================================================
  // SEÇÕES DINÂMICAS — REGRA INVIOLÁVEL POR CATEGORIA
  // Cada seção aceita APENAS posts da categoria declarada.
  // Mapa: gridId -> categoria -> href da seção
  // ============================================================
  const SECOES = [
    { grid: 'grid-politica-economia', cats: ['politica','economia'], href: '/politica/' },
    { grid: 'grid-negocios',          cats: ['negocios'],            href: '/negocios/' },
    { grid: 'grid-investimentos',     cats: ['investimentos'],       href: '/investimentos/' },
    { grid: 'grid-mercados',          cats: ['mercados'],            href: '/mercados/' },
    { grid: 'grid-seguros',           cats: ['seguros'],             href: '/seguros/' },
    { grid: 'grid-familia',           cats: ['familia'],             href: '/familia/' },
    { grid: 'grid-saude',             cats: ['saude'],               href: '/saude/' },
    { grid: 'grid-educacao',          cats: ['educacao'],            href: '/educacao/' },
    { grid: 'grid-tributos',          cats: ['tributacao'],          href: '/tributos/' },
    { grid: 'grid-regulacao',         cats: ['regulacao'],           href: '/regulacao/' },
    { grid: 'grid-tecnologia',        cats: ['tecnologia'],          href: '/tecnologia/' },
    { grid: 'grid-industria',         cats: ['industria'],           href: '/industria/' },
    { grid: 'grid-esportes',          cats: ['esportes'],            href: '/esportes/' },
    { grid: 'grid-parcerias',         cats: ['parcerias'],           href: '/parcerias/' },
    { grid: 'grid-internacional',     cats: ['internacional'],       href: '/internacional/' },
    { grid: 'grid-variedades',        cats: ['variedades'],          href: '/variedades/' },
    { grid: 'grid-investigativo',     cats: ['investigativo'],       href: '/investigativo/' },
    { grid: 'grid-seguranca',         cats: ['seguranca'],           href: '/seguranca/' },
    { grid: 'grid-cultura',           cats: ['cultura'],             href: '/cultura/' },
    { grid: 'grid-profissoes',        cats: ['profissoes'],          href: '/profissoes/' },
    { grid: 'grid-vagas',             cats: ['vagas'],               href: '/vagas/' },
  ];

  function renderCard(post) {
    const a = document.createElement('article');
    a.className = 'ovc-card-item';
    a.innerHTML = `
      <div class="ovc-card-tag">${post.subcategoria || post.categoria}</div>
      <div class="ovc-card-titulo">${post.titulo}</div>
      <div class="ovc-card-resumo">${(post.resumo || post.subtitulo || '').slice(0,160)}...</div>
      <a class="ovc-card-link" href="${post.url}">Leia mais ↗</a>
    `;
    return a;
  }

  async function carregarSecao(secao) {
    const grid = document.getElementById(secao.grid);
    if (!grid) return;
    try {
      let posts = [];
      for (const cat of secao.cats) {
        // Busca mais posts para compensar os filtrados por já estarem no destaque
        const r = await fetch(`/api/portal-posts?categoria=${cat}&limit=12`);
        if (!r.ok) continue;
        const d = await r.json();
        const filtrados = (d.posts||[]).filter(p => secao.cats.includes(p.categoria));
        posts = posts.concat(filtrados);
      }
      // Dedup por id
      const vistos = new Set();
      posts = posts.filter(p => { if(vistos.has(p.id)) return false; vistos.add(p.id); return true; });
      // Remove posts já exibidos nas áreas de destaque (hero/feature/lions)
      posts = posts.filter(p => !idsDestaque.has(p.id));
      posts = posts.slice(0, 6);
      if (!posts.length) {
        grid.innerHTML = '<p class="ovc-card-vazio">Aguardando conteúdo...</p>';
        return;
      }
      grid.innerHTML = '';
      posts.forEach(p => grid.appendChild(renderCard(p)));
    } catch(e) {
      console.error(`[Secao ${secao.grid}]`, e);
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    updateLiveWidgets();
    setInterval(updateLiveWidgets, 120000);
    // Carregar destaque primeiro — registra IDs usados
    await Promise.all([carregarCardHero(), carregarCardNegocios(), carregarCardLions()]);
    // Só então carregar as seções — garantindo que idsDestaque está populado
    SECOES.forEach(s => carregarSecao(s));
  });

})();
