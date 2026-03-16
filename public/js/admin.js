
(function(){
  const tokenKey = 'ovc-admin-token';
  const state = { role: 'guest', data: {} };

  function authHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem(tokenKey) || ''}` };
  }

  async function api(url, options = {}) {
    const response = await fetch(url, { cache: 'no-store', ...options });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'request_failed');
    return data;
  }

  function setStatus(text = '') {
    document.querySelectorAll('[data-admin-status]').forEach(el => el.textContent = text);
  }

  function switchTab(name) {
    document.querySelectorAll('[data-admin-tab]').forEach(button => button.classList.toggle('active', button.dataset.adminTab === name));
    document.querySelectorAll('[data-admin-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.adminPanel === name));
  }

  function upsert(list, item, key = 'id') {
    const clone = Array.isArray(list) ? [...list] : [];
    const index = clone.findIndex(entry => entry[key] === item[key]);
    if (index >= 0) clone[index] = item; else clone.unshift(item);
    return clone;
  }

  async function saveResource(resource, item) {
    return api('/api/admin/resource', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ resource, item }) });
  }

  function bindUploadPreview(fileInput, hiddenInput) {
    fileInput?.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => { hiddenInput.value = String(reader.result || ''); };
      reader.readAsDataURL(file);
    });
  }

  function renderTables() {
    const articles = state.data['articles'] || [];
    const posts = state.data['social-posts'] || [];
    const campaigns = state.data['campaigns'] || [];
    const leads = state.data['newsletter'] || [];
    const alerts = state.data['alerts'] || [];
    const reminders = state.data['reminders'] || [];
    const banners = state.data['banners'] || [];
    const tv = state.data['live-config']?.tv || [];

    const fill = (selector, html) => { const el = document.querySelector(selector); if (el) el.innerHTML = html; };
    fill('[data-table-articles]', articles.slice(0, 20).map(item => `<tr><td>${item.title}</td><td>${item.categoryLabel}</td><td>${item.status || 'published'}</td><td>${item.publishAt ? new Date(item.publishAt).toLocaleString('pt-BR') : item.relativeDate || ''}</td></tr>`).join('') || '<tr><td colspan="4">Sem matérias.</td></tr>');
    fill('[data-table-posts]', posts.slice(0, 20).map(item => `<tr><td>${item.title || item.caption.slice(0, 40)}</td><td>${item.platform}</td><td>${item.format}</td><td>${item.status}</td></tr>`).join('') || '<tr><td colspan="4">Sem posts sociais.</td></tr>');
    fill('[data-table-campaigns]', campaigns.slice(0, 20).map(item => `<tr><td>${item.name}</td><td>${item.status}</td><td>${item.startsAt || ''}</td><td>${item.endsAt || ''}</td></tr>`).join('') || '<tr><td colspan="4">Sem campanhas.</td></tr>');
    fill('[data-table-leads]', leads.slice(0, 20).map(item => `<tr><td>${item.email}</td><td>${(item.topics || []).join(', ')}</td><td>${new Date(item.createdAt).toLocaleString('pt-BR')}</td></tr>`).join('') || '<tr><td colspan="3">Sem leads.</td></tr>');
    fill('[data-table-alerts]', alerts.slice(0, 20).map(item => `<tr><td>${item.title}</td><td>${item.level}</td><td>${item.startsAt || ''}</td></tr>`).join('') || '<tr><td colspan="3">Sem alertas.</td></tr>');
    fill('[data-table-reminders]', reminders.slice(0, 20).map(item => `<tr><td>${item.title}</td><td>${item.dueAt || ''}</td><td>${item.status || 'ativo'}</td></tr>`).join('') || '<tr><td colspan="3">Sem lembretes.</td></tr>');
    fill('[data-table-banners]', banners.slice(0, 20).map(item => `<tr><td>${item.slot}</td><td>${item.label}</td><td>${item.active ? 'ativo' : 'inativo'}</td></tr>`).join('') || '<tr><td colspan="3">Sem banners.</td></tr>');
    fill('[data-table-tv]', tv.slice(0, 20).map(item => `<tr><td>${item.label}</td><td>${item.kind}</td><td>${item.group}</td></tr>`).join('') || '<tr><td colspan="3">Sem canais.</td></tr>');
  }

  function hydrateStats(stats = {}) {
    Object.entries(stats).forEach(([key, value]) => {
      document.querySelectorAll(`[data-stat="${key}"]`).forEach(el => el.textContent = value);
    });
  }

  function fillSettings() {
    const settings = state.data['site-settings'] || {};
    document.querySelector('[name="siteName"]').value = settings.siteName || '';
    document.querySelector('[name="newsletterHeadline"]').value = settings.newsletterHeadline || '';
    document.querySelector('[name="searchPlaceholder"]').value = settings.searchPlaceholder || '';
    document.querySelector('[name="defaultTheme"]').value = settings.defaultTheme || 'classic';
    const radio = state.data['live-config']?.radio || {};
    document.querySelector('[name="radioName"]').value = radio.name || 'Rádio OVC';
    document.querySelector('[name="radioStreamUrl"]').value = radio.streamUrl || '';
    document.querySelector('[name="radioFallbackUrl"]').value = radio.fallbackUrl || '';
  }

  async function loadDashboard() {
    const payload = await api('/api/admin/dashboard', { headers: authHeaders() });
    state.role = payload.role;
    state.data = payload.data;
    hydrateStats(payload.stats);
    renderTables();
    fillSettings();
    document.querySelectorAll('[data-master-only]').forEach(el => el.style.display = state.role === 'master' ? '' : 'none');
    document.querySelector('[data-storage-mode]').textContent = payload.storage;
  }

  function buildArticleFromForm(form) {
    const category = form.category.value;
    const title = form.title.value.trim();
    const slug = OVC.slugify(form.slug.value.trim() || title);
    return {
      id: form.articleId.value || `article_${Date.now()}`,
      slug,
      title,
      excerpt: form.excerpt.value.trim(),
      body: `<p>${form.body.value.trim().replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>')}</p>`,
      category,
      categoryLabel: OVC.getCategoryConfig(category).title,
      section: form.section.value.trim() || 'geral',
      sectionLabel: form.section.value.trim() || 'Geral',
      source: form.author.value.trim() || 'Redação OVC',
      author: form.author.value.trim() || 'Redação OVC',
      image: form.imageUrl.value.trim() || form.imageData.value || '',
      publishedAt: form.publishAt.value || new Date().toISOString(),
      publishAt: form.publishAt.value || new Date().toISOString(),
      relativeDate: 'Agora',
      featured: form.featured.checked,
      readingTime: form.readingTime.value.trim() || '4 min',
      audioEnabled: form.audioEnabled.checked,
      status: form.status.value,
      tags: form.tags.value.split(',').map(item => item.trim()).filter(Boolean),
      url: `/materia/?slug=${encodeURIComponent(slug)}`
    };
  }

  function bindForms() {
    bindUploadPreview(document.querySelector('[name="socialMediaFile"]'), document.querySelector('[name="socialMediaData"]'));
    bindUploadPreview(document.querySelector('[name="imageFile"]'), document.querySelector('[name="imageData"]'));

    document.querySelector('[data-admin-tabs]')?.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-admin-tab]');
      if (!btn) return;
      switchTab(btn.dataset.adminTab);
    });

    document.querySelector('[data-form-login]')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      setStatus('Validando acesso...');
      const token = event.currentTarget.token.value.trim();
      const result = await api('/api/auth/validate-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
      if (!result.valid) return setStatus('Senha inválida.');
      localStorage.setItem(tokenKey, token);
      document.querySelector('[data-admin-login]').style.display = 'none';
      document.querySelector('[data-admin-app]').style.display = 'block';
      await loadDashboard();
      setStatus('');
    });

    document.querySelector('[data-admin-logout]')?.addEventListener('click', () => {
      localStorage.removeItem(tokenKey);
      location.reload();
    });

    document.querySelector('[data-form-article]')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const article = buildArticleFromForm(event.currentTarget);
      const list = upsert(state.data['articles'], article);
      await saveResource('articles', list);
      state.data['articles'] = list;
      renderTables();
      setStatus('Matéria salva.');
      event.currentTarget.reset();
    });

    document.querySelector('[data-form-banner]')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const item = { id: `banner_${Date.now()}`, slot: form.slot.value, label: form.label.value, cta: form.cta.value, url: form.url.value, active: form.active.checked };
      const list = upsert(state.data['banners'], item);
      await saveResource('banners', list);
      state.data['banners'] = list;
      renderTables();
      setStatus('Banner salvo.');
      form.reset();
    });

    document.querySelector('[data-form-alert]')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const item = { id: `alert_${Date.now()}`, title: form.title.value, message: form.message.value, level: form.level.value, startsAt: form.startsAt.value, active: true };
      const list = upsert(state.data['alerts'], item);
      await saveResource('alerts', list);
      state.data['alerts'] = list;
      renderTables();
      setStatus('Alerta salvo.');
      form.reset();
    });

    document.querySelector('[data-form-reminder]')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const item = { id: `rem_${Date.now()}`, title: form.title.value, dueAt: form.dueAt.value, notes: form.notes.value, status: 'ativo' };
      const list = upsert(state.data['reminders'], item);
      await saveResource('reminders', list);
      state.data['reminders'] = list;
      renderTables();
      setStatus('Lembrete salvo.');
      form.reset();
    });

    document.querySelector('[data-form-campaign]')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const item = { id: `camp_${Date.now()}`, name: form.name.value, objective: form.objective.value, status: form.status.value, startsAt: form.startsAt.value, endsAt: form.endsAt.value };
      const list = upsert(state.data['campaigns'], item);
      await saveResource('campaigns', list);
      state.data['campaigns'] = list;
      renderTables();
      setStatus('Campanha salva.');
      form.reset();
    });

    document.querySelector('[data-form-settings]')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const settings = {
        ...(state.data['site-settings'] || {}),
        siteName: form.siteName.value,
        newsletterHeadline: form.newsletterHeadline.value,
        searchPlaceholder: form.searchPlaceholder.value,
        defaultTheme: form.defaultTheme.value,
        homeLockedVisual: true,
        headerFooterLocked: true,
        themeOptions: ['classic','gold','graphite']
      };
      await saveResource('site-settings', settings);
      state.data['site-settings'] = settings;
      const liveConfig = { ...(state.data['live-config'] || {}), radio: { ...(state.data['live-config']?.radio || {}), name: form.radioName.value, streamUrl: form.radioStreamUrl.value, fallbackUrl: form.radioFallbackUrl.value } };
      await saveResource('live-config', liveConfig);
      state.data['live-config'] = liveConfig;
      setStatus('Configurações salvas.');
    });

    document.querySelector('[data-form-integration]')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      await api('/api/integrations/connect', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ platform: form.platform.value, connected: form.connected.checked, accountLabel: form.accountLabel.value, pageId: form.pageId.value, channelId: form.channelId.value, profileId: form.profileId.value, notes: form.notes.value, hasToken: form.hasToken.checked }) });
      await loadDashboard();
      setStatus('Integração atualizada.');
      form.reset();
    });

    document.querySelector('[data-form-social]')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      await api('/api/integrations/publish', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ title: form.title.value, caption: form.caption.value, platform: form.platform.value, format: form.format.value, mediaUrl: form.mediaUrl.value, mediaData: form.socialMediaData.value, sourceType: form.sourceType.value, sourceLink: form.sourceLink.value, publishAt: form.publishAt.value || new Date().toISOString(), publishNow: form.publishNow.checked }) });
      await loadDashboard();
      setStatus('Post social registrado.');
      form.reset();
    });

    document.querySelector('[data-form-live-tv]')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const liveConfig = { ...(state.data['live-config'] || {}), tv: upsert(state.data['live-config']?.tv, { id: `tv_${Date.now()}`, label: form.label.value, url: form.url.value, kind: form.kind.value, group: form.group.value, active: form.active.checked }) };
      await saveResource('live-config', liveConfig);
      state.data['live-config'] = liveConfig;
      renderTables();
      setStatus('Canal ao vivo salvo.');
      form.reset();
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    bindForms();
    switchTab('dashboard');
    const token = localStorage.getItem(tokenKey);
    if (!token) return;
    try {
      const result = await api('/api/auth/validate-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
      if (!result.valid) return;
      document.querySelector('[data-admin-login]').style.display = 'none';
      document.querySelector('[data-admin-app]').style.display = 'block';
      await loadDashboard();
    } catch (error) {
      console.error(error);
    }
  });
})();
