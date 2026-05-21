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
    this.fetchJSON('/api/live-data').then(async live => {
      if (!live) return;

      // Fallback client-side: moedas via AwesomeAPI quando servidor retorna 0
      if (!live.usd?.valor) {
        try {
          const raw = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL,BTC-BRL,XAU-BRL').then(r => r.json());
          if (!live.usd) live.usd = {};
          if (!live.eur) live.eur = {};
          if (!live.gbp) live.gbp = {};
          if (!live.btc) live.btc = {};
          if (!live.xau) live.xau = {};
          live.usd.valor    = parseFloat(raw.USDBRL?.bid || 0);
          live.eur.valor    = parseFloat(raw.EURBRL?.bid || 0);
          live.gbp.valor    = parseFloat(raw.GBPBRL?.bid || 0);
          live.btc.valor    = parseFloat(raw.BTCBRL?.bid || 0);
          live.xau.valor    = parseFloat(raw.XAUBRL?.bid || 0);
          live.usd.variacao = parseFloat(raw.USDBRL?.pctChange || 0);
          live.eur.variacao = parseFloat(raw.EURBRL?.pctChange || 0);
          live.btc.variacao = parseFloat(raw.BTCBRL?.pctChange || 0);
          live.xau.variacao = parseFloat(raw.XAUBRL?.pctChange || 0);
        } catch(_) {}
      }

      // Índices: IBOV, S&P500, NASDAQ via brapi.dev
      if (!live.ibov?.valor) {
        try {
          const idx = await fetch('https://brapi.dev/api/quote/%5EBVSP,%5EGSPC,%5EIXIC?token=demo&fundamental=false&dividends=false').then(r => r.json());
          for (const item of (idx?.results || [])) {
            const sym = (item.symbol || '').toUpperCase();
            if (sym === '^BVSP') {
              if (!live.ibov) live.ibov = {};
              live.ibov.valor    = item.regularMarketPrice || 0;
              live.ibov.variacao = item.regularMarketChangePercent || 0;
            } else if (sym === '^GSPC') {
              if (!live.sp500) live.sp500 = {};
              live.sp500.valor    = item.regularMarketPrice || 0;
              live.sp500.variacao = item.regularMarketChangePercent || 0;
            } else if (sym === '^IXIC') {
              if (!live.nasdaq) live.nasdaq = {};
              live.nasdaq.valor    = item.regularMarketPrice || 0;
              live.nasdaq.variacao = item.regularMarketChangePercent || 0;
            }
          }
        } catch(_) {}
      }

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
      const xau   = live.xau?.valor   || 0;
      const ibov  = live.ibov?.valor  || live.indices?.ibov  || 0;
      const nasdaq= live.nasdaq?.valor|| live.indices?.nasdaq || 0;
      const sp500 = live.sp500?.valor || 0;
      const dow   = live.dow?.valor   || 0;
      const impost= live.impostometro || 0;

      const fmtBrl = v => `R$ ${Number(v).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
      const fmtPts = v => `${Number(v).toLocaleString('pt-BR', {maximumFractionDigits:0})} pts`;

      write('#cotacao-usd',    fmtBrl(usd));
      write('#cotacao-eur',    fmtBrl(eur));
      write('#cotacao-gbp',    fmtBrl(gbp));
      write('#cotacao-btc',    fmtBrl(btc));
      write('#cotacao-ibov',   ibov  ? fmtPts(ibov)  : '—');
      write('#cotacao-nasdaq', nasdaq? fmtPts(nasdaq) : '—');
      write('#cotacao-dow',    dow   ? fmtPts(dow)    : '—');
      write('#cotacao-sp500',  sp500 ? fmtPts(sp500)  : '—');
      write('#cotacao-xau',    xau   ? fmtBrl(xau)    : '—');

      const fmtImposto = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
      write('#impostometro', fmtImposto(Number(impost)));
      if (!window.__ovcImpostTicker) {
        let _impostVal = Number(impost);
        const _rate = Number(live.ratePerSec || 114155);
        window.__ovcImpostTicker = setInterval(() => {
          _impostVal += _rate;
          document.querySelectorAll('#impostometro').forEach(el => { el.textContent = fmtImposto(_impostVal); });
        }, 1000);
      }

      const tickerMap = {
        'dolar': fmtBrl(usd), 'usd': fmtBrl(usd),
        'euro': fmtBrl(eur),  'eur': fmtBrl(eur),
        'libra': fmtBrl(gbp), 'gbp': fmtBrl(gbp),
        'bitcoin': fmtBrl(btc), 'btc': fmtBrl(btc),
        'ibov': ibov ? fmtPts(ibov) : '—', 'ibovespa': ibov ? fmtPts(ibov) : '—',
        'nasdaq': nasdaq ? fmtPts(nasdaq) : '—',
        'dow': dow ? fmtPts(dow) : '—'
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
          'ibov':      { val: ibov   ? fmtPts(ibov)   : '—', chg: live.ibov?.variacao },
          'sandp 500': { val: sp500  ? fmtPts(sp500)  : '—', chg: live.sp500?.variacao },
          's&p 500':   { val: sp500  ? fmtPts(sp500)  : '—', chg: live.sp500?.variacao },
          'nasdaq':    { val: nasdaq ? fmtPts(nasdaq) : '—', chg: live.nasdaq?.variacao },
          'dow jones': { val: dow    ? fmtPts(dow)    : '—', chg: live.dow?.variacao },
          'dolar':     { val: usd    ? fmtBrl(usd)    : '—', chg: live.usd?.variacao },
          'euro':      { val: eur    ? fmtBrl(eur)    : '—', chg: live.eur?.variacao },
          'libra':     { val: gbp    ? fmtBrl(gbp)    : '—', chg: live.gbp?.variacao },
          'bitcoin':   { val: btc    ? `US$ ${Number(btc / (usd||1)).toLocaleString('pt-BR',{maximumFractionDigits:0})}` : '—', chg: live.btc?.variacao },
          'ouro':      { val: xau    ? fmtBrl(xau)    : '—', chg: live.xau?.variacao }
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

(function(){
  const s = document.createElement('style');
  s.textContent = '.header-identity{padding:6px 28px!important;column-gap:20px!important}.logo-mark{height:42px!important}.search-input{padding:6px 16px 6px 34px!important}.header-menu-bar{padding:5px 28px 6px!important}.logo-block .logo-link{text-decoration:none!important;color:inherit!important;display:flex!important;align-items:center!important;gap:14px!important}';
  document.head.appendChild(s);
})();
