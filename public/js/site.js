(function(){
  var s=document.createElement('script');
  s.async=true;
  s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3652391568977586';
  s.crossOrigin='anonymous';
  document.head.appendChild(s);
})();

// Shared fetch cache — start network requests immediately, before DOMContentLoaded
// home.js and ovc-cards.js reuse these promises instead of making duplicate requests
window.__OVC_CACHE__ = {
  recentes: fetch('/api/portal-posts?recentes=true&limit=300', {cache:'no-store'}).then(function(r){ return r.json(); }).catch(function(){ return {posts:[]}; }),
  live: fetch('/api/portal-posts?format=live-data', {cache:'no-store'}).then(function(r){ return r.json(); }).catch(function(){ return {}; })
};

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
  slugify(text){ return String(text||'').toLowerCase().normalize('NFD').replace(/[Ì€-Í¯]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); },
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
        .normalize('NFD').replace(/[Ì€-Í¯]/g, '');
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
    (window.__OVC_CACHE__?.live || this.fetchJSON('/api/portal-posts?format=live-data')).then(live => {
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
        'ibov': fmtPts(ibov), 'ibovespa': fmtPts(ibov),
        'nasdaq': fmtPts(nasdaq), 'dow': fmtPts(dow)
      };
      document.querySelectorAll('.ticker-value, .market-value, .cotacao-valor').forEach(el => {
        const key = (el.dataset.ticker || el.closest('[data-ticker]')?.dataset.ticker || '').toLowerCase();
        if (tickerMap[key]) el.textContent = tickerMap[key];
      });

      document.querySelectorAll('.ticker-item').forEach(item => {
        const rawLabel = item.querySelector('.ticker-label')?.textContent?.trim().toLowerCase() || '';
        const label = rawLabel.normalize("NFD").replace(/[Ì€-Í¯]/g, "").replace(/&/g, "and");
        const valueEl = item.querySelector('.ticker-value');
        const changeEl = item.querySelector('.ticker-change');
        if (!label || !valueEl) return;
        const map = {
          'ibov':      { val: ibov   ? fmtPts(ibov)   : '—', chg: live.ibov?.variacao },
          'sandp 500': { val: '—',                            chg: null },
          's&p 500':   { val: '—',                            chg: null },
          'nasdaq':    { val: nasdaq ? fmtPts(nasdaq)  : '—', chg: live.nasdaq?.variacao },
          'dow jones': { val: dow    ? fmtPts(dow)     : '—', chg: live.dow?.variacao },
          'dolar':     { val: usd    ? fmtBrl(usd)     : '—', chg: live.usd?.variacao },
          'euro':      { val: eur    ? fmtBrl(eur)     : '—', chg: live.eur?.variacao },
          'libra':     { val: gbp    ? fmtBrl(gbp)     : '—', chg: live.gbp?.variacao },
          'bitcoin':   { val: btc    ? `US$ ${Number(btc / (usd||1)).toLocaleString('pt-BR',{maximumFractionDigits:0})}` : '—', chg: live.btc?.variacao },
          'ouro':      { val: '—',                            chg: null }
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
  renderMiniItems(items){ return items.map(item => `<article class="ovc-mini-item"><div><div class="ovc-kicker">${item.source || 'OVC'}</div><h4><a href="${this.articleUrl(item)}">${item.title}</a></h4><p>${item.excerpt || ''}</p><div class="ovc-meta"><span>${item.relativeDate || ''}</span></div></div><a class="ovc-thumb" href="${this.articleUrl(item)}">${item.image ? `<img src="${item.image}" alt="">` : ''}</a></article>`).join(''); },

  initMobileMenu() {
    if (document.querySelector('.btn-hamburger')) return;
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;
    const btn = document.createElement('button');
    btn.className = 'btn-hamburger';
    btn.setAttribute('aria-label', 'Abrir menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('id', 'hamburgerBtn');
    btn.innerHTML = '<span class="hamburger-bar"></span><span class="hamburger-bar"></span><span class="hamburger-bar"></span>';
    headerActions.appendChild(btn);
    const overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';
    overlay.id = 'mobileMenuOverlay';
    document.body.appendChild(overlay);
    const menu = document.createElement('div');
    menu.className = 'mobile-menu';
    menu.id = 'mobileMenu';
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-modal', 'true');
    menu.setAttribute('aria-label', 'Menu de navegação');
    const links = [['Brasil On','/brasil-on/'],['Política','/politica/'],['Economia','/economia/'],['Finanças','/financas/'],['Negócios','/negocios/'],['Tecnologia','/tecnologia/'],['Internacional','/internacional/'],['Indústria','/industria/'],['Família','/familia/'],['Esportes','/esportes/'],['Colunistas','/colunistas/'],['VC','/vc/'],['Dados & Indicadores','/dados/'],['Radar OVC','/radar/'],['Newsletter','/newsletter/']];
    menu.innerHTML='<div class="mobile-menu-header"><span class="mobile-menu-title">O Valor Capital</span><button class="mobile-menu-close" id="mobileMenuClose" aria-label="Fechar menu">✕</button></div><nav class="mobile-menu-nav" aria-label="Navegação mobile">'+links.map(([l,h])=>`<a class="mobile-menu-link" href="${h}">${l}</a>`).join('')+'</nav>';
    document.body.appendChild(menu);
    function openMenu(){menu.classList.add('open');overlay.classList.add('open');btn.classList.add('active');btn.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';}
    function closeMenu(){menu.classList.remove('open');overlay.classList.remove('open');btn.classList.remove('active');btn.setAttribute('aria-expanded','false');document.body.style.overflow='';}
    btn.addEventListener('click',openMenu);
    document.getElementById('mobileMenuClose').addEventListener('click',closeMenu);
    overlay.addEventListener('click',closeMenu);
    document.addEventListener('keydown',(e)=>{if(e.key==='Escape')closeMenu();});
  }
};

(function(){
  document.addEventListener('DOMContentLoaded', () => {
    // Impostômetro independente — funciona em todas as páginas sem esperar API
    (function(){
      var fmtI = function(v){ return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(v); };
      var start = new Date(new Date().getFullYear()+'-01-01T03:00:00Z').getTime();
      var val = Math.max(0, Math.floor((Date.now()-start)/1000)) * 114155;
      document.querySelectorAll('#impostometro').forEach(function(el){ el.textContent = fmtI(val); });
      if (!window.__ovcImpostTicker) {
        window.__ovcImpostTicker = setInterval(function(){
          val += 114155;
          document.querySelectorAll('#impostometro').forEach(function(el){ el.textContent = fmtI(val); });
        }, 1000);
      }
    })();
    OVC.initThemePicker();
    OVC.bindGlobalSearch();
    OVC.bindSearchChips();
    OVC.bindNewsletterForms();
    OVC.hydrateHeaderFooter();
    OVC.enhanceTickerLinks();
    OVC.bindHomeCriticalLinks();
    OVC.fillInstitutionalGaps();
    OVC.normalizeInnerLayout();
    OVC.moveSearchToActions();
    OVC.updateInnerNav();
    OVC.initMobileMenu();
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
OVC.fillInstitutionalGaps = function(){
  const bodyCat = document.body?.dataset?.category;
  if (bodyCat !== 'vc') return;
  const stack = document.querySelector('.ovc-story-stack');
  if (stack && !stack.textContent.trim()) {
    stack.innerHTML = '<section class="ovc-panel ovc-story-list"><h3>Institucional OVC</h3><div class="ovc-mini-list"><article class="ovc-mini-item"><div><h4><a href="/vc/quem-somos/">Quem somos</a></h4><p>Identidade, ambição editorial e razão de existir do portal.</p></div><div></div></article><article class="ovc-mini-item"><div><h4><a href="/vc/principios-editoriais/">Princípios editoriais</a></h4><p>Critérios de apuração, análise, opinião e responsabilidade pública.</p></div><div></div></article><article class="ovc-mini-item"><div><h4><a href="/vc/liberdade-economica/">Liberdade econômica</a></h4><p>Visão sobre mercado, Estado, iniciativa privada e prosperidade.</p></div><div></div></article><article class="ovc-mini-item"><div><h4><a href="/vc/familia-e-patrimonio/">Família e patrimônio</a></h4><p>O eixo familiar, sucessório e patrimonial da cobertura editorial.</p></div><div></div></article></div></section><section class="ovc-panel ovc-story-list"><h3>Como o portal se organiza</h3><div class="ovc-mini-list"><article class="ovc-mini-item"><div><h4>Conteúdo editorial</h4><p>Notícias, análises, colunas e especiais seguem a mesma hierarquia visual do portal.</p></div><div></div></article><article class="ovc-mini-item"><div><h4>Leitura por editoria</h4><p>Categorias e subcategorias mantêm cabeçalho, caixas, laterais, imagens e módulos no mesmo padrão.</p></div><div></div></article></div></section>';
  }
  const rail = document.querySelector('.ovc-right-rail');
  if (rail && !rail.textContent.trim()) {
    rail.innerHTML = '<section class="ovc-panel ovc-story-list"><h3>Navegação VC</h3><div class="ovc-mini-list"><article class="ovc-mini-item"><div><h4><a href="/vc/">Visão geral</a></h4><p>Centro institucional do O Valor Capital.</p></div><div></div></article><article class="ovc-mini-item"><div><h4><a href="/colunistas/">Colunistas</a></h4><p>Opinião, análise e leitura de contexto.</p></div><div></div></article><article class="ovc-mini-item"><div><h4><a href="/parcerias/">Parcerias</a></h4><p>Projetos comerciais, institucionais e editoriais.</p></div><div></div></article></div></section><section class="ovc-panel ovc-story-list" style="margin-top:18px"><h3>Redação OVC</h3><p style="font-size:13px;color:#64748b;line-height:1.6;margin:0 0 12px">Envie pautas, denúncias, sugestões editoriais ou propostas institucionais.</p><a class="ovc-btn" href="/contato/" style="display:flex;justify-content:center">Falar com a redação</a></section>';
  }
};
OVC.moveSearchToActions = function(){};
OVC.updateInnerNav = function(){
  var nav = document.querySelector('nav.supermenu');
  if(!nav) return;
  if(!nav.querySelector('.supermenu-item')) return; // already new style
  var currentPath = window.location.pathname;
  var navItems = [
    ['Colunistas','/colunistas/'],['Política','/politica/'],['Economia','/economia/'],
    ['Brasil On','/brasil-on/'],['Negócios','/negocios/'],['Investimentos','/investimentos/'],
    ['Tecnologia','/tecnologia/'],['Internacional','/internacional/'],['Saúde','/saude/'],
    ['Esportes','/esportes/'],['Família','/familia/'],['Indústria','/industria/'],
    ['Seguros','/seguros/'],['Tributos','/tributos/'],['Cultura','/cultura/'],
    ['Religião','/religiao/'],['Carreira','/carreira/'],['Imóveis','/imoveis/'],['VC','/vc/']
  ];
  nav.innerHTML = navItems.map(function(item){
    var isActive = currentPath === item[1] || currentPath.startsWith(item[1].slice(0,-1));
    return '<a class="supermenu-link'+(isActive?' ativo':'')+'" href="'+item[1]+'">'+item[0]+'</a>';
  }).join('');
};
OVC.normalizeInnerLayout = function(){
  document.querySelectorAll('main.ovc-main').forEach(main => {
    if (main.querySelector('.ovc-grid') || main.dataset.layoutNormalized === '1') return;
    const children = Array.from(main.children);
    if (!children.length) return;
    const grid = document.createElement('section');
    grid.className = 'ovc-grid';
    const left = document.createElement('div');
    left.className = 'ovc-story-stack';
    const right = document.createElement('aside');
    right.className = 'ovc-right-rail';
    right.innerHTML = '<section class="ovc-panel ovc-story-list"><h3>Atalhos OVC</h3><div class="ovc-mini-list"><article class="ovc-mini-item"><div><h4><a href="/radar/">Radar OVC</a></h4><p>Indicadores e temas em acompanhamento.</p></div><div></div></article><article class="ovc-mini-item"><div><h4><a href="/dados/">Dados OVC</a></h4><p>Cotações, agenda econômica e painéis úteis.</p></div><div></div></article><article class="ovc-mini-item"><div><h4><a href="/newsletter/">Newsletter</a></h4><p>Resumo editorial do portal.</p></div><div></div></article></div></section><section class="ovc-panel ovc-story-list" style="margin-top:18px"><h3>Redação OVC</h3><p style="font-size:13px;color:#64748b;line-height:1.6;margin:0 0 12px">Envie pautas, denúncias ou propostas institucionais.</p><a class="ovc-btn" href="/contato/" style="display:flex;justify-content:center">Falar com a redação</a></section>';
    children.forEach(child => left.appendChild(child));
    grid.appendChild(left);
    grid.appendChild(right);
    main.appendChild(grid);
    main.dataset.layoutNormalized = '1';
  });
};

(function(){
  const s = document.createElement('style');
  s.textContent = '.header-identity{padding:6px 28px!important;column-gap:20px!important}.logo-mark{height:42px!important}.search-input{padding:6px 16px 6px 34px!important}.header-menu-bar{padding:5px 28px 6px!important}.logo-block .logo-link{text-decoration:none!important;color:inherit!important;display:flex!important;align-items:center!important;gap:14px!important}'
  + '.ovc-theme-panel{display:none;position:fixed;bottom:70px;right:16px;z-index:9999;background:#0f172a;border:1px solid rgba(148,163,184,0.3);border-radius:12px;padding:8px;min-width:180px;box-shadow:0 8px 32px rgba(0,0,0,0.6)}'
  + '.ovc-theme-panel.is-open{display:flex;flex-direction:column;gap:4px}'
  + '.ovc-theme-choice{background:transparent;border:1px solid transparent;border-radius:8px;color:#cbd5e1;cursor:pointer;padding:8px 12px;text-align:left;display:flex;flex-direction:column;gap:2px}'
  + '.ovc-theme-choice:hover{background:rgba(148,163,184,0.15);border-color:rgba(148,163,184,0.3)}'
  + '.ovc-theme-choice strong{font-size:13px;color:#f1f5f9;display:block}.ovc-theme-choice span{font-size:10px;color:#94a3b8;display:block}';
  document.head.appendChild(s);
})();

// Impostômetro independente — não depende de API
(function(){
  var start = new Date(new Date().getFullYear(), 0, 1).getTime();
  var rate = 114155;
  var fmt = function(v){ return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(v); };
  function tick(){ var val = Math.max(0,Math.floor((Date.now()-start)/1000))*rate; document.querySelectorAll('#impostometro').forEach(function(el){ el.textContent = fmt(val); }); }
  document.addEventListener('DOMContentLoaded', function(){
    tick();
    if(!window.__ovcImpostTicker){ window.__ovcImpostTicker = setInterval(tick, 1000); }
  });
})();
