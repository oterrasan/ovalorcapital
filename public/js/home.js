(function(){

  const idsDestaque = new Set();

  function buildUrl(p) {
    const catPath = {
      politica:'politica', economia:'economia', negocios:'negocios',
      investimentos:'investimentos', seguros:'seguros', mercados:'mercados',
      educacao:'educacao', industria:'industria', tecnologia:'tecnologia',
      esportes:'esportes', saude:'saude', familia:'familia',
      tributacao:'tributos', regulacao:'regulacao', parcerias:'parcerias',
      vc:'vc', colunistas:'vc', internacional:'internacional',
      variedades:'variedades', geral:'politica',
      investigativo:'investigativo', seguranca:'seguranca', cultura:'cultura',
      profissoes:'profissoes', vagas:'vagas', concursos:'concursos',
      imoveis:'imoveis', esg:'esg', defesa:'defesa', religiao:'religiao'
    };
    const cat = catPath[p.categoria] || 'politica';
    return '/' + cat + '/?id=' + (p.id || '').slice(0, 8);
  }

  function stripMd(t){ return (t||'').replace(/\*\*/g,'').replace(/^#+\s*/gm,'').trim(); }

  function postTime(p) {
    return Date.parse(p?.published_at || p?.created_at || p?.updated_at || p?.data_publicacao || '') || 0;
  }

  function ordenarPosts(posts) {
    return [...posts].sort((a,b) => postTime(b) - postTime(a));
  }

  function postsPorCategorias(cache, cats) {
    const vistos = new Set();
    const posts = [];
    cats.forEach(cat => {
      (cache[cat] || []).forEach(p => {
        if (!p || vistos.has(p.id)) return;
        const tags = Array.isArray(p.tags) ? p.tags : [];
        if (p.categoria !== cat && !tags.includes(cat)) return;
        vistos.add(p.id);
        posts.push(p);
      });
    });
    return ordenarPosts(posts);
  }

  function aplicarFundoCard(cardId, post) {
    const card = document.getElementById(cardId);
    if (!card || !post || !post.imagem) return;
    card.style.backgroundImage = `linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.34) 58%, rgba(0,0,0,0.08) 100%), url('${post.imagem}')`;
    card.style.backgroundSize = 'cover';
    card.style.backgroundPosition = 'center';
    card.classList.add('has-image');
  }

  function prepararCardClicavel(cardId, post) {
    const card = document.getElementById(cardId);
    if (!card || !post) return;
    const url = buildUrl(post);
    card.style.cursor = 'pointer';
    card.dataset.href = url;
    card.setAttribute('role', 'link');
    card.setAttribute('tabindex', '0');
    card.onclick = event => {
      if (event.target.closest('a')) return;
      window.location.href = url;
    };
    card.onkeydown = event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      window.location.href = url;
    };
  }

  function aplicarDestaqueCard(cardId, post) {
    aplicarFundoCard(cardId, post);
    prepararCardClicavel(cardId, post);
  }

  function renderDestaque(slot, post) {
    if (!post) return;
    if (post.id) idsDestaque.add(post.id);
    const el = id => document.getElementById(id);
    if (el(slot.titleId)) el(slot.titleId).textContent = stripMd(post.titulo);
    if (slot.metaId && el(slot.metaId)) el(slot.metaId).textContent = 'Reda\u00e7\u00e3o OVC';
    if (slot.excerptId && el(slot.excerptId)) el(slot.excerptId).textContent = stripMd(post.resumo || post.subtitulo || '');
    if (el(slot.linkId)) el(slot.linkId).href = buildUrl(post);
    aplicarDestaqueCard(slot.cardId, post);
  }

  function iniciarRotacaoDestaques(cache) {
    const slots = [
      { cardId:'card-hero-politica-economia', titleId:'card-hero-titulo', metaId:'card-hero-meta', excerptId:'card-hero-resumo', linkId:'card-hero-link', cats:['politica','economia'], index:0 },
      { cardId:'card-feature-negocios', titleId:'card-feature-titulo', excerptId:'card-feature-resumo', linkId:'card-feature-link', cats:['negocios'], index:0 },
      { cardId:'card-lions-seguros', titleId:'card-lions-titulo', metaId:'card-lions-meta', excerptId:'card-lions-resumo', linkId:'card-lions-link', cats:['seguros','investimentos','mercados','economia'], index:0 },
    ].map(slot => ({ ...slot, posts: postsPorCategorias(cache, slot.cats) }));

    function escolher(slot, usados) {
      if (!slot.posts.length) return null;
      for (let tentativas = 0; tentativas < slot.posts.length; tentativas++) {
        const idx = (slot.index + tentativas) % slot.posts.length;
        const post = slot.posts[idx];
        if (!post?.id || !usados.has(post.id)) {
          slot.index = idx;
          usados.add(post?.id);
          return post;
        }
      }
      const post = slot.posts[slot.index % slot.posts.length];
      usados.add(post?.id);
      return post;
    }

    function renderTodos(avancar) {
      const usados = new Set();
      slots.forEach(slot => {
        if (avancar && slot.posts.length > 1) slot.index = (slot.index + 1) % slot.posts.length;
        renderDestaque(slot, escolher(slot, usados));
      });
    }

    renderTodos(false);

    if (window.__ovcDestaquesTimer) clearInterval(window.__ovcDestaquesTimer);
    if (slots.some(slot => slot.posts.length > 1)) {
      window.__ovcDestaquesTimer = setInterval(() => renderTodos(true), 30000);
    }
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
      const post = postsPorCategorias(cache, ['politica','economia'])[0] || null;
      if (!post) return;
      renderDestaque({ cardId:'card-hero-politica-economia', titleId:'card-hero-titulo', metaId:'card-hero-meta', excerptId:'card-hero-resumo', linkId:'card-hero-link' }, post);
    } catch(e) { console.error('[Hero]',e); }
  }

  function carregarCardNegocios(cache) {
    try {
      const post = postsPorCategorias(cache, ['negocios'])[0] || null;
      if (!post) return;
      renderDestaque({ cardId:'card-feature-negocios', titleId:'card-feature-titulo', excerptId:'card-feature-resumo', linkId:'card-feature-link' }, post);
    } catch(e) { console.error('[Negocios]',e); }
  }

  function carregarCardLions(cache) {
    try {
      const post = postsPorCategorias(cache, ['seguros','investimentos','mercados','economia']).find(p => !idsDestaque.has(p.id)) || null;
      if (!post) return;
      renderDestaque({ cardId:'card-lions-seguros', titleId:'card-lions-titulo', metaId:'card-lions-meta', excerptId:'card-lions-resumo', linkId:'card-lions-link' }, post);
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
      <a class="ovc-card-link" href="${url}">Leia mais \u2197</a>
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
        const img = p.imagem ? `<img class="ovc-card-img" src="${p.imagem}" alt="" loading="lazy" width="400" height="225" decoding="async">` : '';
        return `<a class="card card-mini" href="${url}">
          ${img}
          <span class="tag tag-${p.categoria}">${p.categoria}</span>
          <h3 class="card-title">${stripMd(p.titulo)}</h3>
          <span class="card-meta">Reda\u00e7\u00e3o OVC</span>
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
        const filtrados = (cache[cat]||[]).filter(p => secao.cats.includes(p.categoria));
        posts = posts.concat(filtrados);
      }
      const vistos = new Set();
      posts = posts.filter(p => { if(vistos.has(p.id)) return false; vistos.add(p.id); return true; });
      posts = posts.filter(p => !idsDestaque.has(p.id));
      posts = posts.slice(0, 6);
      if (!posts.length) {
        grid.innerHTML = '<p class="ovc-card-vazio">Aguardando conte\u00fado...</p>';
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
      const r = await fetch('/api/portal-posts?recentes=true&limit=180');
      if (r.ok) {
        const d = await r.json();
        (d.posts||[]).forEach(p => {
          if (!cache[p.categoria]) cache[p.categoria] = [];
          cache[p.categoria].push(p);
          (p.tags || []).forEach(tag => {
            if (!tag || tag === p.categoria) return;
            if (!cache[tag]) cache[tag] = [];
            cache[tag].push(p);
          });
        });
      }
    } catch(e) { console.error('[Home]', e); }

    iniciarRotacaoDestaques(cache);

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
