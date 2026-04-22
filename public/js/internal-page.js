(async function(){
  document.addEventListener('DOMContentLoaded', async () => {
    const slug = document.body.dataset.category;
    const section = document.body.dataset.section || 'geral';

    if (typeof OVC !== 'undefined' && OVC.applyCategoryColor) {
      OVC.applyCategoryColor(slug);
    }

    // Buscar matérias da nossa API
    let all = [];
    try {
      const res = await fetch('/api/portal-posts?limit=60');
      const json = await res.json();
      all = (json.posts || []).filter(p => p.titulo && p.titulo.length > 0);
    } catch(e) {
      console.warn('OVC internal-page:', e.message);
      return;
    }

    // Filtrar por categoria
    const filtered = slug
      ? all.filter(p => p.categoria === slug || (p.tags && p.tags.includes(slug)))
      : all;

    const toShow = filtered.length > 0 ? filtered : all;

    function buildUrl(p) {
      const CAT_PATH = {
        politica:'politica',economia:'economia',negocios:'negocios',
        investimentos:'investimentos',seguros:'seguros',mercados:'mercados',
        educacao:'educacao',industria:'industria',tecnologia:'tecnologia',
        esportes:'esportes',saude:'saude',familia:'familia',
        tributacao:'tributos',regulacao:'regulacao',internacional:'economia',
        geral:'politica'
      };
      const cat = CAT_PATH[p.categoria||'geral'] || 'politica';
      return '/' + cat + '/?id=' + (p.id||'').slice(0,8);
    }

    function slugify(str) {
      return (str||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
        .replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').slice(0,60);
    }

    function dataBr(dt) {
      if(!dt) return '';
      try { return new Date(dt).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}); }
      catch(_){ return ''; }
    }

    function catLabel(c) {
      const m = {politica:'Política',economia:'Economia',negocios:'Negócios',investimentos:'Investimentos',
        mercados:'Mercados',tributacao:'Tributação',regulacao:'Regulação',seguros:'Seguros',
        saude:'Saúde',familia:'Família',tecnologia:'Tecnologia',industria:'Indústria',
        educacao:'Educação',esportes:'Esportes',cultura:'Cultura',patrimonio:'Patrimônio',
        internacional:'Internacional',geral:'Geral'};
      return m[c]||c||'Geral';
    }

    // Renderizar mini-item
    function renderMini(p) {
      const url = buildUrl(p);
      return `<article class="ovc-mini-item" style="cursor:pointer" onclick="location.href='${url}'">
        <div>
          <div class="ovc-kicker">Redação OVC</div>
          <h4><a href="${url}">${p.titulo||''}</a></h4>
          <p>${p.resumo||''}</p>
          <div class="ovc-meta"><span>${dataBr(p.data)}</span></div>
        </div>
        ${p.imagem ? `<a class="ovc-thumb" href="${url}"><img src="${p.imagem}" alt="" onerror="this.style.display='none'"></a>` : ''}
      </article>`;
    }

    // Preencher hero card (destaque principal da categoria)
    const heroEl = document.querySelector('[data-hero-card]');
    if (heroEl && toShow[0]) {
      const p = toShow[0];
      const url = buildUrl(p);
      heroEl.innerHTML = `
        <article class="ovc-story-card" style="cursor:pointer" onclick="location.href='${url}'">
          <div>
            <div class="ovc-kicker">${catLabel(p.categoria)}</div>
            <h2><a href="${url}">${p.titulo||''}</a></h2>
            <p>${p.resumo||''}</p>
            <div class="ovc-meta"><span>${dataBr(p.data)}</span></div>
          </div>
          ${p.imagem ? `<a class="ovc-thumb" href="${url}"><img src="${p.imagem}" alt="" onerror="this.style.display='none'" style="width:100%;height:200px;object-fit:cover;border-radius:8px;"></a>` : ''}
        </article>`;
    }

    // Preencher listas
    const safeRender = (selector, items) => {
      const el = document.querySelector(selector);
      if (el) el.innerHTML = items.map(renderMini).join('');
    };

    safeRender('[data-main-list]', toShow.slice(1, 5));
    safeRender('[data-local-list]', toShow.slice(5, 8));
    safeRender('[data-rail-list]', toShow.slice(8, 11));

    // Preencher topic grid (grade de tópicos na parte inferior)
    const topicGrid = document.querySelector('[data-topic-grid]');
    if (topicGrid) {
      const titles = (document.body.dataset.topicTitles || '').split('|');
      const bottom = toShow.slice(11, 20);
      const groups = [0,1,2].map(idx => bottom.slice(idx*3, idx*3+3));
      topicGrid.innerHTML = groups.map((group, idx) =>
        `<section class="ovc-panel ovc-topic-box">
          <h3>${titles[idx] || catLabel(slug)}</h3>
          ${group.map(renderMini).join('')}
        </section>`
      ).join('');
    }
  });
})();

// Detectar ?id= na URL e renderizar matéria completa dentro do layout de categoria
(async function(){
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if(!id) return; // sem ?id= — renderização normal da categoria

  document.addEventListener('DOMContentLoaded', async function(){
    try{
      const res = await fetch('/api/portal-posts?id=' + id);
      if(!res.ok) return;
      const p = await res.json();
      if(!p || !p.titulo) return;

      // Atualizar categoria no body
      document.body.setAttribute('data-category', p.categoria||'geral');
      document.title = p.titulo + ' | O Valor Capital';

      // Preencher o hero card com a matéria completa
      const heroEl = document.querySelector('[data-hero-card]');
      if(heroEl){
        const corpo = (p.corpo||p.resumo||'').split(/\n\n+/).filter(l=>l.trim())
          .map(l => '<p style="font-size:15px;line-height:1.8;margin:0 0 14px;">' + l + '</p>').join('');
        heroEl.innerHTML = '<article class="ovc-story-card no-thumb" style="padding:0;">' +
          '<div>' +
          (p.imagem ? '<img src="'+p.imagem+'" alt="" style="width:100%;max-height:380px;object-fit:cover;border-radius:12px;margin-bottom:20px;" onerror="this.style.display=\'none\'">' : '') +
          '<div style="font-size:12px;color:var(--ovc-muted);margin-bottom:8px;">Redação OVC · ' +
          new Date(p.data||Date.now()).toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'}) +
          '</div>' +
          '<h1 style="font-size:26px;font-weight:800;line-height:1.2;margin:0 0 14px;">' + p.titulo + '</h1>' +
          (p.subtitulo ? '<p style="font-size:16px;color:var(--ovc-muted);margin:0 0 18px;">' + p.subtitulo + '</p>' : '') +
          '<div style="border-top:1px solid var(--ovc-line);padding-top:18px;margin-top:4px;">' + corpo + '</div>' +
          '</div></article>';
      }
    } catch(e){ console.warn('OVC materia:', e.message); }
  });
})();
