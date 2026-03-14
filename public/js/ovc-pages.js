(function(){
  async function fetchJSON(url){
    const r = await fetch(url, {cache:'no-store'});
    if(!r.ok) throw new Error('HTTP '+r.status);
    return r.json();
  }

  // Radar / Cotações (PTAX)
  async function updatePTAX(){
    const elUsd = document.querySelector('[data-ptax="USD"]');
    const elEur = document.querySelector('[data-ptax="EUR"]');
    if(!elUsd && !elEur) return;
    try{
      const data = await fetchJSON('/api/ptax');
      if(!data.ok || !data.rates) return;
      if(elUsd && data.rates.USD) elUsd.textContent = 'R$ ' + Number(data.rates.USD.sell).toFixed(2);
      if(elEur && data.rates.EUR) elEur.textContent = 'R$ ' + Number(data.rates.EUR.sell).toFixed(2);
    }catch(e){}
  }

  // Impostômetro
  async function updateImpostometro(){
    const el = document.querySelector('[data-impostometro]');
    if(!el) return;
    try{
      const data = await fetchJSON('/api/impostometro');
      if(!data.ok) return;
      const formatted = new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL', maximumFractionDigits:0}).format(data.arrecadado);
      el.textContent = formatted;
    }catch(e){}
  }

  // Lista de artigos em categoria
  async function renderCategoryList(){
    const mount = document.querySelector('[data-ovc-list]');
    if(!mount) return;
    const category = mount.getAttribute('data-category') || '';
    const subcategory = mount.getAttribute('data-subcategory') || '';
    const limit = mount.getAttribute('data-limit') || '18';
    const url = '/api/articles/list?limit='+encodeURIComponent(limit) + (category?('&category='+encodeURIComponent(category)):'') + (subcategory?('&subcategory='+encodeURIComponent(subcategory)):'');
    try{
      const data = await fetchJSON(url);
      const items = (data && data.items) ? data.items : [];
      if(!items.length){
        mount.innerHTML = '<div class="notice">Sem publicações nesta seção no momento. Em breve.</div>';
        return;
      }
      mount.innerHTML = items.map(it => {
        const categorySlug = slugify(it.category || '');
        const href = it.slug ? ('/artigos/'+it.slug) : (categorySlug ? ('/' + categorySlug + '/') : '/');
        const kicker = (it.subcategory || it.category || '').toString().toUpperCase();
        const meta = [it.author || 'Redação OVC', it.location, it.date].filter(Boolean).join(' • ');
        const desc = it.excerpt || '';
        return `
          <a class="article" href="${href}">
            <div class="kicker">${kicker}</div>
            <h3>${escapeHtml(it.title || 'Sem título')}</h3>
            <div class="meta">${escapeHtml(meta)}</div>
            ${desc?`<div class="desc">${escapeHtml(desc)}</div>`:''}
          </a>
        `;
      }).join('');
    }catch(e){
      mount.innerHTML = '<div class="notice">Não foi possível carregar esta seção agora.</div>';
    }
  }

  function slugify(s){
    return String(s || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().trim()
      .replace(/&/g, ' e ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    updatePTAX(); updateImpostometro(); renderCategoryList();
    setInterval(updatePTAX, 5*60*1000);
    setInterval(updateImpostometro, 60*1000);
  });
})();
