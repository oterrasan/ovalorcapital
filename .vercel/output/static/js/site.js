
window.OVC_CONFIG = {
  categories: {
    politica:{title:'Política',color:'#b91c1c'}, economia:{title:'Economia',color:'#1d4ed8'}, negocios:{title:'Negócios',color:'#15803d'}, investimentos:{title:'Investimentos',color:'#0f766e'}, seguros:{title:'Seguros',color:'#7c3aed'}, mercados:{title:'Mercados',color:'#0f766e'}, educacao:{title:'Educação',color:'#c2410c'}, industria:{title:'Indústria',color:'#475569'}, tecnologia:{title:'Tecnologia',color:'#2563eb'}, esportes:{title:'Esportes',color:'#15803d'}, saude:{title:'Saúde',color:'#be123c'}, familia:{title:'Família',color:'#9333ea'}, tributos:{title:'Tributos',color:'#b45309'}, regulacao:{title:'Regulação',color:'#4338ca'}, parcerias:{title:'Parcerias',color:'#0f766e'}, vc:{title:'VC',color:'#1d4ed8'}
  },
  themes: {
    classic: { name: 'Clássico OVC', bodyBg: '#f4f6fb', surface: '#ffffff', text: '#0f172a', muted: '#475569', accent: '#b91c1c' },
    gold: { name: 'Executivo Gold', bodyBg: '#faf7f0', surface: '#fffdf8', text: '#1f2937', muted: '#6b7280', accent: '#9a6700' },
    graphite: { name: 'Grafite', bodyBg: '#0f172a', surface: '#111827', text: '#f8fafc', muted: '#cbd5e1', accent: '#38bdf8' }
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
    const name = window.OVC_CONFIG.themes[themeName] ? themeName : 'classic';
    const theme = window.OVC_CONFIG.themes[name];
    const root = document.documentElement;
    root.style.setProperty('--ovc-body-bg', theme.bodyBg);
    root.style.setProperty('--ovc-surface', theme.surface);
    root.style.setProperty('--ovc-text', theme.text);
    root.style.setProperty('--ovc-muted', theme.muted);
    document.body.setAttribute('data-theme', name);
    localStorage.setItem('ovc-theme', name);
    const label = document.querySelector('[data-theme-label]');
    if (label) label.textContent = theme.name;
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
    try {
      const [content, live] = await Promise.all([
        this.loadContent(['site-settings']),
        this.fetchJSON('/api/live-data')
      ]);
      document.querySelectorAll('.search-input').forEach(input => input.placeholder = content['site-settings']?.searchPlaceholder || input.placeholder);
      const tax = live.rates || {};
      const write = (selector, value) => document.querySelectorAll(selector).forEach(el => el.textContent = value);
      write('#cotacao-usd', `R$ ${Number(tax.usd || 0).toFixed(2)}`);
      write('#cotacao-eur', `R$ ${Number(tax.eur || 0).toFixed(2)}`);
      write('#cotacao-ibov', `${Number(live.indices?.ibov || 0).toLocaleString('pt-BR')} pts`);
      write('#impostometro', new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(live.impostometro || 0)));
    } catch (error) {
      console.error(error);
    }
  },
  renderMiniItems(items){ return items.map(item => `<article class="ovc-mini-item"><div><div class="ovc-kicker">${item.source || 'OVC'}</div><h4><a href="${this.articleUrl(item)}">${item.title}</a></h4><p>${item.excerpt || ''}</p><div class="ovc-meta"><span>${item.relativeDate || ''}</span></div></div><a class="ovc-thumb" href="${this.articleUrl(item)}">${item.image ? `<img src="${item.image}" alt="">` : ''}</a></article>`).join(''); }
};

(function(){
  document.addEventListener('DOMContentLoaded', () => {
    OVC.initThemePicker();
    OVC.bindGlobalSearch();
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
