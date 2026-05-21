(function(){

  // IDs de posts já exibidos nas áreas de destaque (hero/feature/lions)
  // As seções dinâmicas filtram esses IDs para não duplicar
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

  // === COTAÇÕES AO VIVO ===
  async function updateLiveWidgets() {
    try {
      const data = await OVC.fetchJSON('/api/live-data');
      let usdVal  = data.usd?.valor  || 0;
      let eurVal  = data.eur?.valor  || 0;
      let ibovVal = data.ibov?.valor || 0;
      let usdVar  = data.usd?.variacao || 0;
      let btcVar  = data.btc?.variacao || 0;
      const fmtBrl  = v => `R$ ${Number(v).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}`;

      if (!usdVal) {
        try {
          const raw = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL').then(r=>r.json());
          usdVal = parseFloat(raw.USDBRL?.bid || 0);
          eurVal = parseFloat(raw.EURBRL?.bid || 0);
          usdVar = parseFloat(raw.USDBRL?.pctChange || 0);
          btcVar = parseFloat(raw.BTCBRL?.pctChange || 0);
        } catch(_) {}
      }

      const usdEl  = document.getElementById('cotacao-usd');
      const eurEl  = document.getElementById('cotacao-eur');
      const ibovEl = document.getElementById('cotacao-ibov');
      if (usdEl)  usdEl.textContent  = fmtBrl(usdVal);
      if (eurEl)  eurEl.textContent  = fmtBrl(eurVal);
      if (ibovEl) ibovEl.textContent = `${Number(ibovVal).toLocaleString('pt-BR')} pts`;

      // Impostômetro: valor base + ticking em tempo real
      const fmtImposto = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
      let impostVal = Number(data.impostometro || 0);
      const ratePerSec = Number(data.ratePerSec || 114155);
      if (window.__ovcImpostTicker) clearInterval(window.__ovcImpostTicker);
      document.querySelectorAll('#impostometro').forEach(el => { el.textContent = fmtImposto(impostVal); });
      window.__ovcImpostTicker = setInterval(() => {
        impostVal += ratePerSec;
        document.querySelectorAll('#impostometro').forEach(el => { el.textContent = fmtImposto(impostVal); });
      }, 1000);

      // Atualiza chips do Radar OVC (variações USD e BTC)
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

  // ============================================================
  // CARD HERO — REGRA INVIOLÁVEL
  // ACEITA: "politica" OU "economia" — todas subcategorias
  // REJEITA: qualquer outra categoria, sem exceção
  // ============================================================
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
      if (el('card-hero-link'))   el('card-hero-link').href          = buildUrl(post);
    } catch(e) { console.error('[Hero]',e); }
  }

  // ============================================================
  // CARD MEIO — REGRA INVIOLÁVEL
  // ACEITA: "negocios" — todas subcategorias
  // REJEITA: qualquer outra categoria, sem exceção
  // ============================================================
  function carregarCardMeio(cache) {
    try {
      const post = (cache['negocios']||[]).find(p => p.categoria==='negocios') || null;
      if (!post) return;
      if (post.id) idsDestaque.add(post.id);
      const el = id => document.getElementById(id);
      if (el('card-meio-titulo')) el('card-meio-titulo').textContent = stripMd(post.titulo);
      if (el('card-meio-meta'))   el('card-meio-meta').textContent   = 'Redação OVC';
      if (el('card-meio-link'))   el('card-meio-link').href          = buildUrl(post);
      if (post.imagem) {
        const imgEl = document.getElementById('card-meio-img');
        if (imgEl) { imgEl.src = post.imagem; imgEl.style.display='block'; }
        const wrapEl = document.getElementById('card-meio-wrap');
        if (wrapEl) wrapEl.style.backgroundImage = `url('${post.imagem}')`;
      }
    } catch(e) { console.error('[Meio]',e); }
  }

  // ============================================================
  // CARD LIONS — REGRA INVIOLÁVEL
  // ACEITA: "investimentos", "seguros", "mercados", "economia"
  // REJEITA: qualquer outra categoria, sem exceção
  // ============================================================
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
      if (el('card-lions-link'))   el('card-lions-link').href          = buildUrl(post);
      if (post.imagem) {
        const imgEl = document.getElementById('card-lions-img');
        if (imgEl) { imgEl.src = post.imagem; imgEl.style.display='block'; }
        const wrapEl = document.getElementById('card-lions-wrap');
        if (wrapEl) wrapEl.style.backgroundImage = `url('${post.imagem}')`;
      }
    } catch(e) { console.error('[Lions]',e); }
  }

  // ============================================================
  // SEÇÕES DINÂMICAS — filtram idsDestaque automaticamente
  // ============================================================
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

  function renderSecaoStandard(containerId, cats, cache, max) {
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
        return `<a class="card card-standard" href="${url}">
          ${img}
          <span class="tag tag-${p.categoria}">${p.categoria}</span>
          <h3 class="card-title">${stripMd(p.titulo)}</h3>
          <span class="card-meta">Redação OVC</span>
          <span class="card-cta">LEIA +</span>
        </a>`;
      }).join('');
    } catch(e) { console.error('[SecaoStd '+containerId+']',e); }
  }

  // ============================================================
  // BOOT — 1 fetch bulk, distribui por categoria
  // ============================================================
  async function boot() {
    try {
      const res  = await OVC.fetchJSON('/api/portal-posts?recentes=true&limit=300');
      const list = res.posts || [];

      // monta cache por categoria
      const cache = {};
      for (const p of list) {
        const cat = p.categoria || 'geral';
        if (!cache[cat]) cache[cat] = [];
        cache[cat].push(p);
      }

      carregarCardHero(cache);
      carregarCardMeio(cache);
      carregarCardLions(cache);

      renderSecaoStandard('secao-politica',      ['politica'],                           cache, 3);
      renderSecaoStandard('secao-economia',      ['economia'],                           cache, 3);
      renderSecaoStandard('secao-negocios',      ['negocios'],                           cache, 3);
      renderSecao('secao-investimentos', ['investimentos','seguros','mercados'],          cache, 6);
      renderSecao('secao-tecnologia',    ['tecnologia','industria'],                     cache, 4);
      renderSecao('secao-saude',         ['saude','familia','bem_estar'],                cache, 4);
      renderSecao('secao-internacional', ['internacional'],                              cache, 4);
      renderSecao('secao-variedades',    ['variedades','cultura','religiao','esportes'], cache, 4);
      renderSecao('secao-educacao',      ['educacao','profissoes','vagas','concursos'],  cache, 4);
      renderSecao('secao-regulacao',     ['regulacao','tributacao','tributos'],          cache, 4);
      renderSecao('secao-seguranca',     ['seguranca','defesa','investigativo'],         cache, 4);
      renderSecao('secao-imoveis',       ['imoveis','esg'],                              cache, 4);

    } catch(e) { console.error('[boot]',e); }
  }

  document.addEventListener('DOMContentLoaded', () => {
    boot();
    updateLiveWidgets();
    setInterval(updateLiveWidgets, 120000);
  });

})();
