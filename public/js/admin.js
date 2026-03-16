(async function(){
  const login = document.getElementById('admin-login-form');
  const loginWrap = document.getElementById('admin-login-wrap');
  const app = document.getElementById('admin-app');
  const tokenKey = 'ovc-admin-token';
  const tabs = document.querySelectorAll('.ovc-admin-tab');
  const panels = document.querySelectorAll('.ovc-admin-panel');
  const statusEls = document.querySelectorAll('#admin-status');
  const setStatus = (txt='') => statusEls.forEach(el => el.textContent = txt);
  async function validate(token){ const response = await fetch('/api/auth/validate-token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})}); const data = await response.json(); return !!data.valid; }
  function setActive(name){ tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tab===name)); panels.forEach(panel => panel.classList.toggle('active', panel.dataset.panel===name)); }
  function authHeaders(){ return { 'Content-Type':'application/json', 'Authorization': `Bearer ${localStorage.getItem(tokenKey) || ''}` }; }
  async function loadDashboard(){
    const [articles,banners,settings,leadsRes] = await Promise.all([
      OVC.loadJson('/data/articles.json'), OVC.loadJson('/data/banners.json'), OVC.loadJson('/data/site-settings.json'), fetch('/api/admin/newsletter-leads',{headers:{'Authorization':`Bearer ${localStorage.getItem(tokenKey)||''}`}}).then(r=>r.json()).catch(()=>({items:[]}))
    ]);
    document.getElementById('stat-articles').textContent = articles.length;
    document.getElementById('stat-banners').textContent = banners.filter(item=>item.active).length;
    document.getElementById('stat-leads').textContent = (leadsRes.items||[]).length;
    document.getElementById('settings-site-name').value = settings.siteName || 'O Valor Capital';
    document.getElementById('settings-newsletter-headline').value = settings.newsletterHeadline || '';
    document.getElementById('settings-search-placeholder').value = settings.searchPlaceholder || '';
    document.getElementById('table-articles-body').innerHTML = articles.slice(0,20).map(item => `<tr><td>${item.title}</td><td>${item.categoryLabel}</td><td>${item.sectionLabel}</td><td>${item.relativeDate || ''}</td></tr>`).join('') || `<tr><td colspan="4">Sem artigos.</td></tr>`;
    document.getElementById('table-banners-body').innerHTML = banners.map(item => `<tr><td>${item.slot}</td><td>${item.label}</td><td>${item.active ? 'Ativo' : 'Inativo'}</td><td>${item.url}</td></tr>`).join('') || `<tr><td colspan="4">Sem banners.</td></tr>`;
    document.getElementById('table-leads-body').innerHTML = (leadsRes.items||[]).map(item => `<tr><td>${item.email}</td><td>${new Date(item.createdAt).toLocaleString('pt-BR')}</td></tr>`).join('') || `<tr><td colspan="2">Sem leads.</td></tr>`;
  }
  login?.addEventListener('submit', async (event) => { event.preventDefault(); const token = login.password.value.trim(); setStatus('Validando acesso...'); const ok = await validate(token); if(!ok){ setStatus('Senha inválida.'); return; } localStorage.setItem(tokenKey, token); loginWrap.style.display='none'; app.style.display='block'; await loadDashboard(); setStatus(''); });
  document.getElementById('logout-btn')?.addEventListener('click', ()=>{ localStorage.removeItem(tokenKey); location.reload(); });
  tabs.forEach(tab => tab.addEventListener('click', ()=> setActive(tab.dataset.tab)));
  document.getElementById('settings-form')?.addEventListener('submit', async (event) => { event.preventDefault(); const payload = { siteName: document.getElementById('settings-site-name').value.trim(), newsletterHeadline: document.getElementById('settings-newsletter-headline').value.trim(), searchPlaceholder: document.getElementById('settings-search-placeholder').value.trim(), defaultTheme:'light', homeLockedVisual:true }; const response = await fetch('/api/admin/save-settings',{method:'POST',headers:authHeaders(),body:JSON.stringify(payload)}); setStatus(response.ok ? 'Configurações salvas.' : 'Falha ao salvar configurações.'); });
  document.getElementById('article-form')?.addEventListener('submit', async (event) => { event.preventDefault(); const articles = await OVC.loadJson('/data/articles.json'); const category = document.getElementById('article-category').value; articles.unshift({ id: Date.now(), slug: OVC.slugify(document.getElementById('article-title').value), title: document.getElementById('article-title').value, excerpt: document.getElementById('article-excerpt').value, category, categoryLabel: OVC.getCategoryConfig(category).title, section:'geral', sectionLabel:'Geral', source:'Admin OVC', url:`/${category}/`, image: document.getElementById('article-image').value, publishedAt:new Date().toISOString(), relativeDate:'Agora', featured:false, readingTime:'4 min' }); const response = await fetch('/api/admin/save-articles',{method:'POST',headers:authHeaders(),body:JSON.stringify({items:articles})}); setStatus(response.ok ? 'Artigo salvo.' : 'Falha ao salvar artigo.'); event.target.reset(); await loadDashboard(); });
  document.getElementById('banner-form')?.addEventListener('submit', async (event) => { event.preventDefault(); const banners = await OVC.loadJson('/data/banners.json'); banners.unshift({ slot: document.getElementById('banner-slot').value, label: document.getElementById('banner-label').value, cta: document.getElementById('banner-cta').value, url: document.getElementById('banner-url').value, active:true }); const response = await fetch('/api/admin/save-banners',{method:'POST',headers:authHeaders(),body:JSON.stringify({items:banners})}); setStatus(response.ok ? 'Banner salvo.' : 'Falha ao salvar banner.'); event.target.reset(); await loadDashboard(); });
  const saved = localStorage.getItem(tokenKey); if (saved && await validate(saved)) { loginWrap.style.display='none'; app.style.display='block'; await loadDashboard(); }
})();
