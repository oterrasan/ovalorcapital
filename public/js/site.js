window.OVC_CONFIG = { categories: {
  politica:{title:'Política',color:'#b91c1c'}, economia:{title:'Economia',color:'#1d4ed8'}, negocios:{title:'Negócios',color:'#15803d'}, investimentos:{title:'Investimentos',color:'#0f766e'}, seguros:{title:'Seguros',color:'#7c3aed'}, mercados:{title:'Mercados',color:'#0f766e'}, educacao:{title:'Educação',color:'#c2410c'}, industria:{title:'Indústria',color:'#475569'}, tecnologia:{title:'Tecnologia',color:'#2563eb'}, esportes:{title:'Esportes',color:'#15803d'}, saude:{title:'Saúde',color:'#be123c'}, familia:{title:'Família',color:'#9333ea'}, tributos:{title:'Tributos',color:'#b45309'}, regulacao:{title:'Regulação',color:'#4338ca'}, parcerias:{title:'Parcerias',color:'#0f766e'}, vc:{title:'VC',color:'#1d4ed8'} } };
window.OVC = {
  async loadJson(path){ const response = await fetch(path,{cache:'no-store'}); if(!response.ok) throw new Error(`Falha ao carregar ${path}`); return response.json(); },
  slugify(text){ return String(text||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); },
  getCategoryConfig(slug){ return window.OVC_CONFIG.categories[slug] || {title:slug,color:'#1d4ed8'}; },
  applyCategoryColor(slug){ const config = this.getCategoryConfig(slug); document.documentElement.style.setProperty('--ovc-accent', config.color); document.documentElement.style.setProperty('--ovc-accent-soft', `${config.color}1A`); },
  renderMiniItems(items){ return items.map(item => `<article class="ovc-mini-item"><div><div class="ovc-kicker">${item.source || 'OVC'}</div><h4><a href="${item.url || '#'}">${item.title}</a></h4><p>${item.excerpt || ''}</p><div class="ovc-meta"><span>${item.relativeDate || item.dateLabel || ''}</span></div></div><a class="ovc-thumb" href="${item.url || '#'}">${item.image ? `<img src="${item.image}" alt="">` : ''}</a></article>`).join(''); }
};
(function(){ document.body.setAttribute('data-theme','light'); })();
