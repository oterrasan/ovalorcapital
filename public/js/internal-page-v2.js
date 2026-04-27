(function(){
  var params = new URLSearchParams(window.location.search);
  var id = params.get('id');

  // ── MODO MATÉRIA INDIVIDUAL
  if (id) {
    document.addEventListener('DOMContentLoaded', function(){
      fetch('/api/portal-posts?id=' + encodeURIComponent(id))
        .then(function(res){ return res.ok ? res.json() : null; })
        .then(function(p){
          if (!p || !p.titulo) return;
          document.title = p.titulo + ' | O Valor Capital';
          var data = p.data
            ? new Date(p.data).toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})
            : '';
          var corpo = (p.corpo || p.resumo || '')
            .split(/\n\n+/).filter(function(l){ return l.trim(); })
            .map(function(l){
              return '<p style="margin:0 0 22px;font-size:17px;line-height:1.85;color:var(--text-main,#1e293b);">' + l + '</p>';
            }).join('');
          var heroEl = document.querySelector('[data-hero-card]');
          if (heroEl) {
            heroEl.style.cssText = 'display:block;padding:0;box-sizing:border-box;width:100%;';
            heroEl.innerHTML =
              (p.imagem
                ? '<div style="width:100%;height:420px;border-radius:14px;overflow:hidden;margin-bottom:28px;">' +
                  '<img src="' + p.imagem + '" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.style.display=\'none\'">' +
                  '</div>'
                : '') +
              '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--accent,#dc2626);margin-bottom:10px;">' +
                (p.categoria||'').toUpperCase() + ' · ' + data +
              '</div>' +
              '<h1 style="font-size:32px;font-weight:800;line-height:1.2;margin:0 0 14px;color:var(--text-main,#0f172a);">' + (p.titulo || '') + '</h1>' +
              (p.subtitulo
                ? '<p style="font-size:18px;color:var(--text-soft,#475569);margin:0 0 24px;line-height:1.55;font-style:italic;border-left:3px solid var(--accent,#dc2626);padding-left:16px;">' + p.subtitulo + '</p>'
                : '') +
              '<div style="border-top:1px solid var(--ovc-line,#e2e8f0);padding-top:28px;margin-top:8px;">' + corpo + '</div>';
          }
          ['[data-main-list]','[data-local-list]','[data-topic-grid]'].forEach(function(sel){
            var el = document.querySelector(sel);
            if (el) el.innerHTML = '';
          });
          var banner = document.querySelector('.ovc-banner-slot');
          if (banner) banner.style.display = 'none';
          var lists = document.querySelectorAll('.ovc-story-list');
          lists.forEach(function(l){ l.style.display='none'; });
        })
        .catch(function(e){ console.warn('OVC materia:', e.message); });
    });
    return;
  }

  // ── MODO CATEGORIA
  document.addEventListener('DOMContentLoaded', function(){
    var slug = document.body.dataset.category;

    var SLUG_TO_CAT = {
      tributos:'tributacao', tributacao:'tributacao',
      regulacao:'regulacao', politica:'politica',
      economia:'economia', negocios:'negocios',
      investimentos:'investimentos', seguros:'seguros',
      mercados:'mercados', educacao:'educacao',
      industria:'industria', tecnologia:'tecnologia',
      esportes:'esportes', saude:'saude',
      familia:'familia', internacional:'internacional',
      variedades:'variedades', parcerias:'parcerias'
    };

    var LABEL = {
      politica:'Política', economia:'Economia', negocios:'Negócios',
      investimentos:'Investimentos', mercados:'Mercados', tributacao:'Tributação',
      regulacao:'Regulação', seguros:'Seguros', saude:'Saúde', familia:'Família',
      tecnologia:'Tecnologia', industria:'Indústria', educacao:'Educação',
      esportes:'Esportes', internacional:'Internacional', variedades:'Variedades',
      parcerias:'Parcerias'
    };

    var CAT_COLORS = {
      politica:'#dc2626', economia:'#2563eb', negocios:'#7c3aed',
      investimentos:'#059669', mercados:'#0891b2', tributacao:'#b45309',
      regulacao:'#9333ea', seguros:'#0284c7', saude:'#16a34a',
      familia:'#db2777', tecnologia:'#6366f1', industria:'#ea580c',
      educacao:'#8b5cf6', esportes:'#16a34a', internacional:'#dc2626',
      variedades:'#ec4899', parcerias:'#14b8a6'
    };

    function buildUrl(p) {
      var cat = SLUG_TO_CAT[p.categoria] || p.categoria || 'politica';
      var catReverse = {};
      Object.keys(SLUG_TO_CAT).forEach(function(k){ catReverse[SLUG_TO_CAT[k]] = k; });
      var urlSlug = catReverse[cat] || cat;
      return '/' + urlSlug + '/?id=' + encodeURIComponent(p.id);
    }

    function dataBr(dt){
      if(!dt) return '';
      try{ return new Date(dt).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}); }
      catch(_){ return ''; }
    }

    function label(c){ return LABEL[c] || c || 'Geral'; }

    function cor(c){ return CAT_COLORS[c] || CAT_COLORS[SLUG_TO_CAT[c]] || '#dc2626'; }

    // Card hero (destaque principal)
    function renderHero(p) {
      var url = buildUrl(p);
      var acento = cor(p.categoria);
      return '<a href="' + url + '" style="display:block;text-decoration:none;color:inherit;">' +
        (p.imagem
          ? '<div style="width:100%;height:260px;border-radius:12px;overflow:hidden;margin-bottom:16px;position:relative;">' +
            '<img src="' + p.imagem + '" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.style.display=\'none\'">' +
            '<div style="position:absolute;top:12px;left:12px;background:' + acento + ';color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:4px 10px;border-radius:20px;">' + label(p.categoria) + '</div>' +
            '</div>'
          : '<div style="background:' + acento + '22;border-radius:12px;height:120px;margin-bottom:16px;display:flex;align-items:center;justify-content:center;"><span style="color:' + acento + ';font-size:28px;font-weight:900;">OVC</span></div>') +
        '<h2 style="font-size:22px;font-weight:800;line-height:1.25;margin:0 0 8px;color:var(--text-main,#0f172a);">' + (p.titulo||'') + '</h2>' +
        '<p style="font-size:13px;color:var(--text-soft,#64748b);margin:0 0 8px;line-height:1.5;">' + (p.resumo||'').slice(0,160) + '</p>' +
        '<span style="font-size:11px;color:var(--text-soft,#94a3b8);">Redação OVC · ' + dataBr(p.data) + '</span>' +
        '</a>';
    }

    // Card compacto em grid (lista de notícias)
    // Card compacto — thumbnail 88x72px fixo, nunca achatado
    function renderCard(p) {
      var url = buildUrl(p);
      var acento = cor(p.categoria);
      var imgHtml = p.imagem
        ? '<div style="width:88px;min-width:88px;height:72px;border-radius:8px;overflow:hidden;flex-shrink:0;background:#f1f5f9;">' +
          '<img src="' + p.imagem + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.parentElement.style.display='none'">' +
          '</div>'
        : '<div style="width:88px;min-width:88px;height:72px;border-radius:8px;background:' + acento + '18;flex-shrink:0;display:flex;align-items:center;justify-content:center;"><span style="color:' + acento + ';font-weight:900;font-size:10px;">OVC</span></div>';
      return '<a href="' + url + '" style="display:flex;gap:14px;align-items:flex-start;text-decoration:none;color:inherit;padding:14px 0;border-top:1px solid var(--ovc-line,#f1f5f9);">' +
        imgHtml +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:' + acento + ';margin-bottom:5px;">' + label(p.categoria) + '</div>' +
          '<h4 style="font-size:14px;font-weight:700;line-height:1.35;margin:0 0 5px;color:var(--text-main,#0f172a);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + (p.titulo||'') + '</h4>' +
          '<span style="font-size:11px;color:var(--text-soft,#94a3b8);">Redação OVC · ' + dataBr(p.data) + '</span>' +
        '</div>' +
        '</a>';
    }


    function renderRail(p) {
      var url = buildUrl(p);
      var acento = cor(p.categoria);
      return '<a href="' + url + '" style="display:flex;gap:10px;align-items:flex-start;text-decoration:none;color:inherit;padding:10px 0;border-top:1px solid var(--ovc-line,#f1f5f9);">' +
        (p.imagem
          ? '<div style="width:60px;height:60px;border-radius:6px;overflow:hidden;flex-shrink:0;">' +
            '<img src="' + p.imagem + '" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\'">' +
            '</div>'
          : '') +
        '<div style="flex:1;min-width:0;">' +
          '<h4 style="font-size:13px;font-weight:700;line-height:1.3;margin:0 0 3px;color:var(--text-main,#0f172a);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">' + (p.titulo||'') + '</h4>' +
          '<span style="font-size:10px;color:var(--text-soft,#94a3b8);">' + dataBr(p.data) + '</span>' +
        '</div>' +
        '</a>';
    }

    fetch('/api/portal-posts?limit=80')
      .then(function(res){ return res.json(); })
      .then(function(json){
        var all = (json.posts||[]).filter(function(p){ return p.titulo && p.titulo.length > 0; });
        if (!all.length) return;

        var catFiltro = slug ? (SLUG_TO_CAT[slug] || slug) : null;
        var filtered = catFiltro
          ? all.filter(function(p){ return p.categoria===catFiltro || p.categoria===slug; })
          : all;
        // Se categoria sem posts: mostrar aviso, não misturar com outras categorias
        var toShow = filtered;
        if (!toShow.length) {
          var heroEl2 = document.querySelector('[data-hero-card]');
          if (heroEl2) {
            heroEl2.style.cssText = 'display:flex;align-items:center;justify-content:center;padding:40px;flex-direction:column;gap:12px;';
            heroEl2.innerHTML = '<div style="font-size:40px;">📰</div>' +
              '<h3 style="margin:0;font-size:18px;color:var(--text-main,#0f172a);">Primeiras matérias chegando</h3>' +
              '<p style="margin:0;font-size:14px;color:var(--text-soft,#64748b);text-align:center;">Nossa redação automática está gerando conteúdo para esta seção.<br>Volte em alguns minutos.</p>';
          }
          return;
        }

        // Deduplicar
        var usedIds = {}, usedTitulos = {};
        var deduped = [];
        toShow.forEach(function(p){
          if (!p.id || !p.titulo) return;
          if (usedIds[p.id]) return;
          var tNorm = (p.titulo||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,30);
          if (usedTitulos[tNorm]) return;
          usedIds[p.id] = true;
          usedTitulos[tNorm] = true;
          deduped.push(p);
        });

        if (!deduped.length) return;

        // ── Hero
        var heroEl = document.querySelector('[data-hero-card]');
        if (heroEl && deduped[0]) {
          heroEl.style.cssText = 'display:block;padding:20px;box-sizing:border-box;';
          heroEl.innerHTML = renderHero(deduped[0]);
        }

        // ── Lista principal (cards compactos)
        var mainEl = document.querySelector('[data-main-list]');
        if (mainEl && deduped.length > 1) {
          mainEl.innerHTML = deduped.slice(1, 9).map(renderCard).join('');
        }

        // ── Lista local
        var localEl = document.querySelector('[data-local-list]');
        if (localEl && deduped.length > 9) {
          localEl.innerHTML = deduped.slice(9, 15).map(renderCard).join('');
        }

        // ── Rail lateral
        var railEl = document.querySelector('[data-rail-list]');
        if (railEl && deduped.length > 15) {
          railEl.innerHTML = deduped.slice(15, 20).map(renderRail).join('');
        }

        // ── Topic grid — grid 3 colunas
        var topicEl = document.querySelector('[data-topic-grid]');
        if (topicEl && deduped.length > 20) {
          topicEl.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:16px;';
          topicEl.innerHTML = deduped.slice(20, 32).map(function(p){
            var url = buildUrl(p);
            var acento = cor(p.categoria);
            return '<a href="' + url + '" style="display:block;text-decoration:none;color:inherit;border-radius:10px;overflow:hidden;border:1px solid var(--ovc-line,#f1f5f9);">' +
              (p.imagem
                ? '<div style="height:130px;overflow:hidden;background:' + acento + '12;">' +
                  '<img src="' + p.imagem + '" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.style.background=\'' + acento + '15\'">' +
                  '</div>'
                : '<div style="height:80px;background:' + acento + '15;display:flex;align-items:center;justify-content:center;"><span style="color:' + acento + ';font-weight:900;">OVC</span></div>') +
              '<div style="padding:10px 12px;">' +
                '<div style="font-size:9px;font-weight:700;text-transform:uppercase;color:' + acento + ';margin-bottom:4px;">' + label(p.categoria) + '</div>' +
                '<h4 style="font-size:13px;font-weight:700;line-height:1.3;margin:0;color:var(--text-main,#0f172a);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + (p.titulo||'') + '</h4>' +
              '</div>' +
            '</a>';
          }).join('');
        }
      })
      .catch(function(e){ console.warn('OVC categoria:', e.message); });
  });
})();
