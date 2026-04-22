(async function(){
  // Detectar ?id= NA URL PRIMEIRO — se tiver, renderiza materia e para tudo
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (id) {
    // MODO MATERIA — renderiza artigo completo, nao carrega lista de categoria
    document.addEventListener('DOMContentLoaded', async function(){
      try {
        const res = await fetch('/api/portal-posts?id=' + encodeURIComponent(id));
        if (!res.ok) return;
        const p = await res.json();
        if (!p || !p.titulo) return;

        document.title = p.titulo + ' | O Valor Capital';
        if (typeof OVC !== 'undefined' && OVC.applyCategoryColor) {
          OVC.applyCategoryColor(p.categoria || 'geral');
        }

        const corpo = (p.corpo || p.resumo || '')
          .split(/\n\n+/).filter(l => l.trim())
          .map(l => '<p style="font-size:16px;line-height:1.9;margin:0 0 16px;">' + l.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</p>')
          .join('');

        const data = p.data
          ? new Date(p.data).toLocaleDateString('pt-BR', {day:'2-digit', month:'long', year:'numeric'})
          : '';

        // Preencher hero com materia completa
        const heroEl = document.querySelector('[data-hero-card]');
        if (heroEl) {
          heroEl.innerHTML =
            '<article class="ovc-story-card" style="padding:0;">' +
              '<div style="max-width:800px;">' +
                (p.imagem ? '<img src="' + p.imagem + '" alt="" style="width:100%;max-height:420px;object-fit:cover;border-radius:12px;margin-bottom:24px;" onerror="this.style.display=\'none\'">' : '') +
                '<div style="font-size:12px;color:var(--ovc-muted);margin-bottom:10px;text-transform:uppercase;letter-spacing:.05em;">Redação OVC · ' + data + '</div>' +
                '<h1 style="font-size:28px;font-weight:800;line-height:1.25;margin:0 0 16px;">' + (p.titulo || '') + '</h1>' +
                (p.subtitulo ? '<p style="font-size:17px;color:var(--ovc-muted);margin:0 0 20px;line-height:1.5;">' + p.subtitulo + '</p>' : '') +
                '<div style="border-top:2px solid var(--ovc-line);padding-top:20px;">' + corpo + '</div>' +
              '</div>' +
            '</article>';
        }

        // Limpar outras areas para nao mostrar lista de categoria misturada
        ['[data-main-list]','[data-local-list]','[data-rail-list]','[data-topic-grid]'].forEach(sel => {
          const el = document.querySelector(sel);
          if (el) el.innerHTML = '';
        });

      } catch(e) { console.warn('OVC materia:', e.message); }
    });

    return; // PARA AQUI — nao executa o bloco de lista de categoria
  }

  // MODO CATEGORIA — sem ?id=, renderiza lista normal
  document.addEventListener('DOMContentLoaded', async () => {
    const slug = document.body.dataset.category;

    if (typeof OVC !== 'undefined' && OVC.applyCategoryColor) {
      OVC.applyCategoryColor(slug);
    }

    let all = [];
    try {
      const res = await fetch('/api/portal-posts?limit=60');
      const json = await res.json();
      all = (json.posts || []).filter(p => p.titulo && p.titulo.length > 0);
    } catch(e) {
      console.warn('OVC internal-page:', e.message);
      return;
    }

    const filtered = slug
      ? all.filter(p => p.categoria === slug || (p.tags && p.tags.includes(slug)))
      : all;

    const toShow = filtered.length > 0 ? filtered : all;

    function buildUrl(p) {
      const CAT_PATH = {
        politica:'politica', economia:'economia', negocios:'negocios',
        investimentos:'investimentos', seguros:'seguros', mercados:'mercados',
        educacao:'educacao', industria:'industria', tecnologia:'tecnologia',
        esportes:'esportes', saude:'saude', familia:'familia',
        tributacao:'tributos', regulacao:'regulacao', internacional:'economia',
        geral:'politica'
      };
      const cat = CAT_PATH[p.categoria || 'geral'] || 'politica';
      return '/' + cat + '/?id=' + (p.id || '').slice(0, 8);
    }

    function dataBr(dt) {
      if (!dt) return '';
      try { return new Date(dt).toLocaleDateString('pt-BR', {day:'2-digit', month:'short', year:'numeric'}); }
      catch(_){ return ''; }
    }

    function catLabel(c) {
      const m = {
        politica:'Política', economia:'Economia', negocios:'Negócios',
        investimentos:'Investimentos', mercados:'Mercados', tributacao:'Tributação',
        regulacao:'Regulação', seguros:'Seguros', saude:'Saúde', familia:'Família',
        tecnologia:'Tecnologia', industria:'Indústria', educacao:'Educação',
        esportes:'Esportes', cultura:'Cultura', patrimonio:'Patrimônio',
        internacional:'Internacional', geral:'Geral'
      };
      return m[c] || c || 'Geral';
    }

    function renderMini(p) {
      const url = buildUrl(p);
      return '<article class="ovc-mini-item" style="cursor:pointer" onclick="location.href=\'' + url + '\'">' +
        '<div>' +
          '<div class="ovc-kicker">Redação OVC</div>' +
          '<h4><a href="' + url + '">' + (p.titulo || '') + '</a></h4>' +
          '<p>' + (p.resumo || '') + '</p>' +
          '<div class="ovc-meta"><span>' + dataBr(p.data) + '</span></div>' +
        '</div>' +
        (p.imagem ? '<a class="ovc-thumb" href="' + url + '"><img src="' + p.imagem + '" alt="" onerror="this.style.display=\'none\'"></a>' : '') +
      '</article>';
    }

    // Hero (destaque principal)
    const heroEl = document.querySelector('[data-hero-card]');
    if (heroEl && toShow[0]) {
      const p = toShow[0];
      const url = buildUrl(p);
      heroEl.innerHTML =
        '<article class="ovc-story-card" style="cursor:pointer" onclick="location.href=\'' + url + '\'">' +
          '<div>' +
            '<div class="ovc-kicker">' + catLabel(p.categoria) + '</div>' +
            '<h2><a href="' + url + '">' + (p.titulo || '') + '</a></h2>' +
            '<p>' + (p.resumo || '') + '</p>' +
            '<div class="ovc-meta"><span>' + dataBr(p.data) + '</span></div>' +
          '</div>' +
          (p.imagem ? '<a class="ovc-thumb" href="' + url + '"><img src="' + p.imagem + '" alt="" onerror="this.style.display=\'none\'" style="width:100%;height:200px;object-fit:cover;border-radius:8px;"></a>' : '') +
        '</article>';
    }

    const safeRender = (selector, items) => {
      const el = document.querySelector(selector);
      if (el) el.innerHTML = items.map(renderMini).join('');
    };

    safeRender('[data-main-list]', toShow.slice(1, 5));
    safeRender('[data-local-list]', toShow.slice(5, 8));
    safeRender('[data-rail-list]', toShow.slice(8, 11));

    const topicGrid = document.querySelector('[data-topic-grid]');
    if (topicGrid) {
      const titles = (document.body.dataset.topicTitles || '').split('|');
      const bottom = toShow.slice(11, 20);
      const groups = [0,1,2].map(idx => bottom.slice(idx*3, idx*3+3));
      topicGrid.innerHTML = groups.map((group, idx) =>
        '<section class="ovc-panel ovc-topic-box">' +
          '<h3>' + (titles[idx] || catLabel(slug)) + '</h3>' +
          group.map(renderMini).join('') +
        '</section>'
      ).join('');
    }
  });
})();
