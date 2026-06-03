(function(){

  const idsDestaque = new Set();

  function buildUrl(p) {
    if (p && p.url && /^\/[a-z0-9-]+\/.+-[a-f0-9]{8}\/?$/i.test(p.url)) return p.url;
    const catPath = {
      politica:'politica', economia:'economia', negocios:'negocios',
      investimentos:'investimentos', seguros:'seguros', mercados:'mercados',
      educacao:'educacao', industria:'industria', tecnologia:'tecnologia',
      esportes:'esportes', saude:'saude', familia:'familia',
      tributacao:'tributos', regulacao:'regulacao', parcerias:'parcerias',
      vc:'colunistas', colunistas:'colunistas', internacional:'internacional',
      variedades:'variedades', geral:'politica',
      investigativo:'investigativo', seguranca:'seguranca', cultura:'cultura',
      profissoes:'profissoes', vagas:'vagas', concursos:'concursos',
      imoveis:'imoveis', esg:'esg', defesa:'defesa', religiao:'religiao'
    };
    const cat = catPath[p.categoria] || 'politica';
    const rawSlug = p.slug || stripMd(p.titulo || '').toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,'')
      .trim().replace(/\s+/g,'-').slice(0,55);
    return '/' + cat + '/' + rawSlug + '-' + (p.id || '').slice(0, 8) + '/';
  }

  function stripMd(t){ return (t||'').replace(/\*\*/g,'').replace(/^#+\s*/gm,'').trim(); }

  function wireFeaturedCard(cardId, url) {
    const card = document.getElementById(cardId);
    if (!card || !url) return;
    card.style.cursor = 'pointer';
    card.setAttribute('role', 'link');
    card.setAttribute('tabindex', '0');
    card.onclick = (e) => {
      if (e.target.closest('a,button,input,select,textarea')) return;
      location.href = url;
    };
    card.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        location.href = url;
      }
    };
  }

  async function updateLiveWidgets() {
    try {
      const data = await OVC.fetchJSON('/api/portal-posts?format=live-data');
      let usdVal  = data.usd?.valor  || 0;
      let eurVal  = data.eur?.valor  || 0;
      let ibovVal = data.ibov?.valor || 0;
      let usdVar  = data.usd?.variacao || 0;
      let btcVar  = data.btc?.variacao || 0;
      const fmtBrl  = v => `R$ ${Number(v).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}`;

      const usdEl  = document.getElementById('cotacao-usd');
      const eurEl  = document.getElementById('cotacao-eur');
      const ibovEl = document.getElementById('cotacao-ibov');
      if (usdEl)  usdEl.textContent  = fmtBrl(usdVal);
      if (eurEl)  eurEl.textContent  = fmtBrl(eurVal);
      if (ibovEl) ibovEl.textContent = `${Number(ibovVal).toLocaleString('pt-BR')} pts`;

      const fmtImposto = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
      let impostVal = Number(data.impostometro || 0);
      const ratePerSec = Number(data.ratePerSec || 114155);
      if (window.__ovcImpostTicker) clearInterval(window.__ovcImpostTicker);
      document.querySelectorAll('#impostometro').forEach(el => { el.textContent = fmtImposto(impostVal); });
      window.__ovcImpostTicker = setInterval(() => {
        impostVal += ratePerSec;
        document.querySelectorAll('#impostometro').forEach(el => { el.textContent = fmtImposto(impostVal); });
      }, 1000);

      document.querySelectorAll('.market-chip').forEach(chip => {
        const sym = (chip.querySelector('.market-symbol')?.textContent || '').trim().toUpperCase();
        const changeEl = chip.querySelector('.market-change');
        if (!changeEl) return;
        const chgMap = { 'USD/BRL': usdVar, 'BTC': btcVar };
        const chg = chgMap[sym];
        if (chg !== undefined && chg !== null) {
          const v = Number(chg);
          changeEl.textContent = (v >= 0 ? '+' : '') + v.toFixed(2).replace('.', ',') + '%';
          changeEl.className = 'market-change ' + (v >= 0 ? 'up' : 'down');
        }
      });
    } catch(e) { console.error(e); }
  }

  function carregarCardHero(cache) {
    try {
      let post = null;
      for (const cat of ['politica','economia']) {
        if (post) break;
        post = (cache[cat]||[]).find(p => p.categoria===cat) || null;
      }
      if (!post) return;
      if (post.id) idsDestaque.add(post.id);
      const el = id => document.getElementById(id);
      if (el('card-hero-titulo')) el('card-hero-titulo').textContent = stripMd(post.titulo);
      if (el('card-hero-meta'))   el('card-hero-meta').textContent   = 'Redação OVC';
      if (el('card-hero-resumo')) el('card-hero-resumo').textContent = stripMd(post.resumo || post.subtitulo || '');
      const url = buildUrl(post);
      if (el('card-hero-link'))   el('card-hero-link').href          = url;
      wireFeaturedCard('card-hero-politica-economia', url);
    } catch(e) { console.error('[Hero]',e); }
  }

  function carregarCardNegocios(cache) {
    try {
      const post = (cache['negocios']||[]).find(p => p.categoria==='negocios');
      if (!post) return;
      if (post.id) idsDestaque.add(post.id);
      const el = id => document.getElementById(id);
      if (el('card-meio-titulo')) el('card-meio-titulo').textContent = stripMd(post.titulo);
      if (el('card-meio-meta'))   el('card-meio-meta').textContent   = 'Redação OVC';
      const url = buildUrl(post);
      if (el('card-meio-link'))   el('card-meio-link').href          = url;
      if (el('card-feature-titulo')) el('card-feature-titulo').textContent = stripMd(post.titulo);
      if (el('card-feature-resumo')) el('card-feature-resumo').textContent = stripMd(post.resumo || post.subtitulo || '');
      if (el('card-feature-link'))   el('card-feature-link').href          = url;
      wireFeaturedCard('card-feature-negocios', url);
      if (post.imagem) {
        const imgEl = document.getElementById('card-meio-img');
        if (imgEl) { imgEl.src = post.imagem; imgEl.style.display='block'; }
        const wrapEl = document.getElementById('card-meio-wrap');
        if (wrapEl) wrapEl.style.backgroundImage = `url('${post.imagem}')`;
      }
    } catch(e) { console.error('[Negocios]',e); }
  }

  function carregarCardLions(cache) {
    try {
      let post = null;
      for (const cat of ['investimentos','seguros','mercados','economia']) {
        if (post) break;
        const pool = (cache[cat]||[]).filter(p => !idsDestaque.has(p.id));
        post = pool.find(p => p.categoria===cat) || null;
      }
      if (!post) return;
      if (post.id) idsDestaque.add(post.id);
      const el = id => document.getElementById(id);
      if (el('card-lions-titulo')) el('card-lions-titulo').textContent = stripMd(post.titulo);
      if (el('card-lions-meta'))   el('card-lions-meta').textContent   = 'Redação OVC';
      if (el('card-lions-resumo')) el('card-lions-resumo').textContent = stripMd(post.resumo || post.subtitulo || '');
      const url = buildUrl(post);
      if (el('card-lions-link'))   el('card-lions-link').href          = url;
      wireFeaturedCard('card-lions-seguros', url);
      if (post.imagem) {
        const imgEl = document.getElementById('card-lions-img');
        if (imgEl) { imgEl.src = post.imagem; imgEl.style.display='block'; }
        const wrapEl = document.getElementById('card-lions-wrap');
        if (wrapEl) wrapEl.style.backgroundImage = `url('${post.imagem}')`;
      }
    } catch(e) { console.error('[Lions]',e); }
  }

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
    const url = buildUrl(post);
    const a = document.createElement('article');
    a.className = 'ovc-card-item';
    a.style.cursor = 'pointer';
    a.onclick = (e) => { if (!e.target.closest('a')) location.href = url; };
    a.innerHTML = `
      <div class="ovc-card-tag">${post.subcategoria || post.categoria}</div>
      <div class="ovc-card-titulo">${stripMd(post.titulo)}</div>
      <div class="ovc-card-resumo">${stripMd(post.resumo || post.subtitulo || '').slice(0,160)}...</div>
      <a class="ovc-card-link" href="${url}">Leia mais →</a>
    `;
    return a;
  }

  function renderSecao(containerId, cats, cache, max) {
    try {
      const el = document.getElementById(containerId);
      if (!el) return;
      const posts = [];
      for (const cat of cats) {
        for (const p of (cache[cat]||[])) {
          if (!idsDestaque.has(p.id) && posts.length < max) posts.push(p);
        }
      }
      if (!posts.length) return;
      el.innerHTML = posts.map(p => {
        const url = buildUrl(p);
        const img = p.imagem ? `<img class="ovc-card-img" src="${p.imagem}" alt="" loading="lazy">` : '';
        return `<a class="card card-mini" href="${url}">
          ${img}
          <span class="tag tag-${p.categoria}">${p.categoria}</span>
          <h3 class="card-title">${stripMd(p.titulo)}</h3>
          <span class="card-meta">Redação OVC</span>
          <span class="card-cta">LEIA +</span>
        </a>`;
      }).join('');
    } catch(e) { console.error('[Secao '+containerId+']',e); }
  }

  function carregarSecao(secao, cache) {
    const grid = document.getElementById(secao.grid);
    if (!grid) return;
    try {
      let posts = [];
      for (const cat of secao.cats) {
        const filtrados = (cache[cat]||[]).filter(p => {
          const tags = Array.isArray(p.tags) ? p.tags : [];
          return secao.cats.includes(p.categoria) || tags.some(t => secao.cats.includes(t));
        });
        posts = posts.concat(filtrados);
      }
      const vistos = new Set();
      posts = posts.filter(p => { if(vistos.has(p.id)) return false; vistos.add(p.id); return true; });
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

    const cache = {};
    try {
      const r = await fetch('/api/portal-posts?recentes=true&limit=300');
      if (r.ok) {
        const d = await r.json();
        (d.posts||[]).forEach(p => {
          if (!cache[p.categoria]) cache[p.categoria] = [];
          cache[p.categoria].push(p);
          (p.tags||[]).forEach(tag => {
            if (!tag || tag === p.categoria) return;
            if (!cache[tag]) cache[tag] = [];
            cache[tag].push(p);
          });
        });
      }
    } catch(e) { console.error('[Home]', e); }

    carregarCardHero(cache);
    carregarCardNegocios(cache);
    carregarCardLions(cache);

    SECOES.forEach(s => carregarSecao(s, cache));


    renderSecao('secao-politica',      ['politica'],                           cache, 3);
    renderSecao('secao-economia',      ['economia'],                           cache, 3);
    renderSecao('secao-negocios',      ['negocios'],                           cache, 3);
    renderSecao('secao-investimentos', ['investimentos','seguros','mercados'],  cache, 6);
    renderSecao('secao-tecnologia',    ['tecnologia','industria'],             cache, 4);
    renderSecao('secao-saude',         ['saude','familia'],                    cache, 4);
    renderSecao('secao-internacional', ['internacional'],                      cache, 4);
    renderSecao('secao-variedades',    ['variedades','cultura','religiao','esportes'], cache, 4);
    renderSecao('secao-educacao',      ['educacao','profissoes','vagas','concursos'],  cache, 4);
    renderSecao('secao-regulacao',     ['regulacao','tributacao','tributos'],  cache, 4);
    renderSecao('secao-seguranca',     ['seguranca','defesa','investigativo'], cache, 4);
    renderSecao('secao-imoveis',       ['imoveis','esg'],                      cache, 4);
  });

})();
