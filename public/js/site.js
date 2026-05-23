window.OVC_CONFIG = {
  categories: {
    politica:{title:'Política',color:'#b91c1c'}, economia:{title:'Economia',color:'#1d4ed8'}, negocios:{title:'Negócios',color:'#15803d'}, investimentos:{title:'Investimentos',color:'#0f766e'}, seguros:{title:'Seguros',color:'#7c3aed'}, mercados:{title:'Mercados',color:'#0f766e'}, educacao:{title:'Educação',color:'#c2410c'}, industria:{title:'Indústria',color:'#475569'}, tecnologia:{title:'Tecnologia',color:'#2563eb'}, esportes:{title:'Esportes',color:'#15803d'}, saude:{title:'Saúde',color:'#be123c'}, familia:{title:'Família',color:'#9333ea'}, tributos:{title:'Tributos',color:'#b45309'}, regulacao:{title:'Regulação',color:'#4338ca'}, parcerias:{title:'Parcerias',color:'#0f766e'}, vc:{title:'VC',color:'#1d4ed8'}
  },
  themes: {
    classic:  { name: 'Clássico OVC',    key: 'classic'  },
    gold:     { name: 'Executivo Gold',   key: 'gold'     },
    graphite: { name: 'Grafite',          key: 'graphite' }
  }
};

window.OVC = {
  async fetchJSON(url, options = {}) {
    const response = await fetch(url, { cache: 'no-store', ...options });
    if (!response.ok) throw new Error(`Falha ao carregar ${url}`);
    return response.json();
  },
  async loadContent(resources = ['articles','banners','site-settings']) {
    const query = encodeURIComponent(resources.join(','));
    return this.fetchJSON(`/api/public/content?resources=${query}`);
  },
  slugify(text){ return String(text||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); },
  getCategoryConfig(slug){ return window.OVC_CONFIG.categories[slug] || {title:slug,color:'#1d4ed8'}; },
  articleUrl(item){ return item?.url || `/materia/?slug=${encodeURIComponent(item?.slug || '')}`; },
  formatDate(value){ try { return new Date(value).toLocaleString('pt-BR'); } catch { return value || ''; } },
  applyCategoryColor(slug){
    const config = this.getCategoryConfig(slug);
    document.documentElement.style.setProperty('--ovc-accent', config.color);
    document.documentElement.style.setProperty('--ovc-accent-soft', `${config.color}1A`);
  },
  applyTheme(themeName) {
    const validThemes = ['classic', 'gold', 'graphite'];
    const name = validThemes.includes(themeName) ? themeName : 'classic';
    document.body.setAttribute('data-theme', name);
    document.documentElement.setAttribute('data-theme', name);
    localStorage.setItem('ovc-theme', name);
    const label = document.querySelector('[data-theme-label]');
    if (label) {
      const names = { classic: 'Clássico OVC', gold: 'Executivo Gold', graphite: 'Grafite' };
      label.textContent = names[name] || name;
    }
  },
  initThemePicker() {
    const saved = localStorage.getItem('ovc-theme') || 'classic';
    this.applyTheme(saved);
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    if (!document.getElementById('ovc-theme-panel')) {
      const panel = document.createElement('div');
      panel.id = 'ovc-theme-panel';
      panel.className = 'ovc-theme-panel';
      panel.innerHTML = Object.entries(window.OVC_CONFIG.themes).map(([key, value]) => `<button type="button" class="ovc-theme-choice" data-theme-choice="${key}"><strong>${value.name}</strong><span>${key}</span></button>`).join('');
      document.body.appendChild(panel);
      panel.addEventListener('click', (event) => {
        const choice = event.target.closest('[data-theme-choice]');
        if (!choice) return;
        this.applyTheme(choice.dataset.themeChoice);
        panel.classList.remove('is-open');
      });
    }
    btn.addEventListener('click', () => document.getElementById('ovc-theme-panel')?.classList.toggle('is-open'));
  },
  bindGlobalSearch() {
    document.querySelectorAll('.search-input').forEach(input => {
      input.form?.addEventListener('submit', (event) => event.preventDefault());
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          const q = input.value.trim();
          location.href = `/busca/?q=${encodeURIComponent(q)}`;
        }
      });
    });
  },
  bindSearchChips() {
    const chipMap = {
      'irpf 2025':            '/tributos/irpf/',
      'reforma tributaria':   '/tributos/',
      'salario & empregos':   '/vagas/',
      'familia & patrimonio': '/familia/'
    };
    document.querySelectorAll('.search-chip').forEach(chip => {
      if (chip.tagName === 'A') return;
      const key = (chip.textContent || '').trim().toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '');
      const href = chipMap[key] || ('/busca/?q=' + encodeURIComponent((chip.textContent || '').trim()));
      const a = document.createElement('a');
      a.className = chip.className;
      a.href = href;
      a.textContent = chip.textContent;
      chip.parentNode.replaceChild(a, chip);
    });
  },
  bindNewsletterForms() {
    document.querySelectorAll('.footer-newsletter-form').forEach(form => {
      const input = form.querySelector('input[type="email"]');
      const button = form.querySelector('button');
      button?.addEventListener('click', async () => {
        const email = input?.value.trim();
        if (!email) return alert('Digite seu e-mail.');
        const data = await this.fetchJSON('/api/newsletter/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, source: 'footer' }) });
        alert(data.duplicate ? 'Este e-mail já está cadastrado.' : 'E-mail cadastrado com sucesso.');
        if (input) input.value = '';
      });
    });
  },
  async hydrateHeaderFooter() {
    this.fetchJSON('/api/portal-posts?format=live-data').then(live => {
      if (!live) return;
      this._applyLiveData(live);
    }).catch(() => {});

    try {
      const content = await this.loadContent(['site-settings']);
      document.querySelectorAll('.search-input').forEach(input => input.placeholder = content['site-settings']?.searchPlaceholder || input.placeholder);
    } catch(_) {}
  },

  _applyLiveData(live) {
    try {
      const write = (selector, value) => document.querySelectorAll(selector).forEach(el => el.textContent = value);

      const usd   = live.usd?.valor   || live.tax?.usd   || 0;
      const eur   = live.eur?.valor   || live.tax?.eur   || 0;
      const gbp   = live.gbp?.valor   || 0;
      const btc   = live.btc?.valor   || live.tax?.btc   || 0;
      const ibov  = live.ibov?.valor  || live.indices?.ibov  || 0;
      const nasdaq= live.nasdaq?.valor|| live.indices?.nasdaq || 0;
      const dow   = live.dow?.valor   || 0;
      const impost= live.impostometro || 0;

      const fmtBrl = v => `R$ ${Number(v).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
      const fmtPts = v => `${Number(v).toLocaleString('pt-BR', {maximumFractionDigits:0})} pts`;

      write('#cotacao-usd',    fmtBrl(usd));
      write('#cotacao-eur',    fmtBrl(eur));
      write('#cotacao-gbp',    fmtBrl(gbp));
      write('#cotacao-btc',    fmtBrl(btc));
      write('#cotacao-ibov',   fmtPts(ibov));
      write('#cotacao-nasdaq', fmtPts(nasdaq));
      write('#cotacao-dow',    fmtPts(dow));
      write('#impostometro',   new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(impost)));

      const tickerMap = {
        'dolar': fmtBrl(usd), 'usd': fmtBrl(usd),
        'euro': fmtBrl(eur),  'eur': fmtBrl(eur),
        'libra': fmtBrl(gbp), 'gbp': fmtBrl(gbp),
        'bitcoin': fmtBrl(btc), 'btc': fmtBrl(btc),
        'ibov': fmtPts(ibov), 'ibovespa': fmtPts(ibov),
        'nasdaq': fmtPts(nasdaq), 'dow': fmtPts(dow)
      };
      document.querySelectorAll('.ticker-value, .market-value, .cotacao-valor').forEach(el => {
        const key = (el.dataset.ticker || el.closest('[data-ticker]')?.dataset.ticker || '').toLowerCase();
        if (tickerMap[key]) el.textContent = tickerMap[key];
      });

      document.querySelectorAll('.ticker-item').forEach(item => {
        const rawLabel = item.querySelector('.ticker-label')?.textContent?.trim().toLowerCase() || '';
        const label = rawLabel.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/&/g, "and");
        const valueEl = item.querySelector('.ticker-value');
        const changeEl = item.querySelector('.ticker-change');
        if (!label || !valueEl) return;
        const map = {
          'ibov':      { val: fmtPts(ibov),   chg: live.ibov?.variacao },
          'sandp 500': { val: '—',             chg: null },
          's&p 500':   { val: '—',             chg: null },
          'nasdaq':    { val: fmtPts(nasdaq),  chg: live.nasdaq?.variacao },
          'dow jones': { val: fmtPts(dow),     chg: live.dow?.variacao },
          'dolar':     { val: fmtBrl(usd),     chg: live.usd?.variacao },
          'euro':      { val: fmtBrl(eur),     chg: live.eur?.variacao },
          'libra':     { val: fmtBrl(gbp),     chg: live.gbp?.variacao },
          'bitcoin':   { val: `US$ ${Number(btc / (usd||1)).toLocaleString('pt-BR',{maximumFractionDigits:0})}`, chg: live.btc?.variacao },
          'ouro':      { val: '—',             chg: null }
        };
        const entry = map[label];
        if (!entry) return;
        valueEl.textContent = entry.val;
        if (changeEl && entry.chg !== null && entry.chg !== undefined) {
          const v = Number(entry.chg);
          changeEl.textContent = (v >= 0 ? '+' : '') + v.toFixed(2).replace('.', ',') + '%';
          changeEl.className = 'ticker-change ' + (v >= 0 ? 'up' : 'down');
        }
      });
    } catch (error) {
      console.error('live-data apply error:', error);
    }
  },
  renderMiniItems(items){ return items.map(item => `<article class="ovc-mini-item"><div><div class="ovc-kicker">${item.source || 'OVC'}</div><h4><a href="${this.articleUrl(item)}">${item.title}</a></h4><p>${item.excerpt || ''}</p><div class="ovc-meta"><span>${item.relativeDate || ''}</span></div></div><a class="ovc-thumb" href="${this.articleUrl(item)}">${item.image ? `<img src="${item.image}" alt="">` : ''}</a></article>`).join(''); }
};

(function(){
  document.addEventListener('DOMContentLoaded', () => {
    OVC.initThemePicker();
    OVC.bindGlobalSearch();
    OVC.bindSearchChips();
    OVC.bindNewsletterForms();
    OVC.hydrateHeaderFooter();
    OVC.enhanceTickerLinks();
    OVC.bindHomeCriticalLinks();
  });
})();

OVC.enhanceTickerLinks = function(){
  const map = { 'ibov':'/dados/cotacoes/?ticker=ibov', 's&p 500':'/dados/cotacoes/?ticker=sp500', 'nasdaq':'/dados/cotacoes/?ticker=nasdaq', 'dólar':'/dados/cotacoes/?ticker=dolar', 'euro':'/dados/cotacoes/?ticker=euro', 'bitcoin':'/dados/cotacoes/?ticker=bitcoin', 'ouro':'/dados/cotacoes/?ticker=ouro' };
  document.querySelectorAll('.ticker-item').forEach(item => {
    if (item.querySelector('a.ovc-ticker-link')) return;
    const label = item.querySelector('.ticker-label')?.textContent?.trim().toLowerCase();
    const href = map[label];
    if (!href) return;
    const link = document.createElement('a');
    link.href = href;
    link.className = 'ovc-ticker-link';
    link.style.cssText = 'display:flex;gap:10px;align-items:center;color:inherit;text-decoration:none';
    while (item.firstChild) link.appendChild(item.firstChild);
    item.appendChild(link);
  });
};
OVC.bindHomeCriticalLinks = function(){
  const directMap = [
    ['.rail-block-tv','/tv-ovc/'],
    ['[data-home-radar-link]','/radar/'],
    ['[data-home-radio-link]','/radio-ovc/'],
    ['[data-home-impostometro-link]','/ferramentas/impostometro/']
  ];
  directMap.forEach(([selector, href]) => {
    document.querySelectorAll(selector).forEach(node => {
      node.style.cursor='pointer';
      node.addEventListener('click', (event) => {
        if (event.target.closest('a,button,input,label')) return;
        location.href = href;
      });
    });
  });
  document.querySelectorAll('.markets-grid .market-chip').forEach(chip => {
    chip.style.cursor='pointer';
    chip.addEventListener('click', ()=> {
      const ticker=(chip.querySelector('.market-symbol')?.textContent||'').toLowerCase().replace('/brl','').replace(/[^a-z0-9]+/g,'');
      location.href=`/dados/cotacoes/?ticker=${encodeURIComponent(ticker)}`;
    });
  });
  document.querySelectorAll('[data-home-audio-link]').forEach(link => {
    link.addEventListener('click', (event) => {
      if (!event.currentTarget.getAttribute('href') || event.currentTarget.getAttribute('href') === '/') {
        event.preventDefault();
        location.href = '/radio-ovc/';
      }
    });
  });
};
