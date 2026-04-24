(function(){
  var params = new URLSearchParams(window.location.search);
  var id = params.get('id');

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

          // Renderizar parágrafos com espaçamento correto
          var corpo = (p.corpo || p.resumo || '')
            .split(/\n\n+/).filter(function(l){ return l.trim(); })
            .map(function(l){
              return '<p style="margin:0 0 20px;font-size:17px;line-height:1.85;color:#1e293b;">' + l + '</p>';
            }).join('');

          var heroEl = document.querySelector('[data-hero-card]');
          if (heroEl) {
            // Forcar o container a ser full-width sem grid de 2 colunas
            heroEl.style.cssText = 'display:block;padding:28px 32px;box-sizing:border-box;width:100%;';

            heroEl.innerHTML =
              (p.imagem
                ? '<img src="' + p.imagem + '" alt="" style="width:100%;max-height:440px;object-fit:cover;border-radius:12px;margin-bottom:24px;display:block;" onerror="this.style.display=\'none\'">'
                : '') +
              '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:10px;">Redação OVC · ' + data + '</div>' +
              '<h1 style="font-size:30px;font-weight:800;line-height:1.2;margin:0 0 12px;color:#0f172a;">' + (p.titulo || '') + '</h1>' +
              (p.subtitulo
                ? '<p style="font-size:17px;color:#475569;margin:0 0 22px;line-height:1.5;font-style:italic;">' + p.subtitulo + '</p>'
                : '') +
              '<div style="border-top:2px solid #e2e8f0;padding-top:24px;margin-top:4px;">' + corpo + '</div>';
          }

          // Limpar listas laterais — mostrar apenas o rail (sidebar direita)
          ['[data-main-list]','[data-local-list]','[data-topic-grid]'].forEach(function(sel){
            var el = document.querySelector(sel);
            if (el) el.innerHTML = '';
          });
          // Ocultar o banner entre blocos
          var banner = document.querySelector('.ovc-banner-slot');
          if (banner) banner.style.display = 'none';
          // Ocultar o segundo bloco ovc-story-list (Mais da seção)
          var lists = document.querySelectorAll('.ovc-story-list');
          lists.forEach(function(l){ l.style.display='none'; });
        })
        .catch(function(e){ console.warn('OVC materia:', e.message); });
    });
    return;
  }

  // MODO CATEGORIA
  document.addEventListener('DOMContentLoaded', function(){
    var slug = document.body.dataset.category;

    if (typeof OVC !== 'undefined' && OVC.applyCategoryColor) {
      OVC.applyCategoryColor(slug);
    }

    var CAT_PATH = {
      politica:'politica',economia:'economia',negocios:'negocios',
      investimentos:'investimentos',seguros:'seguros',mercados:'mercados',
      educacao:'educacao',industria:'industria',tecnologia:'tecnologia',
      esportes:'esportes',saude:'saude',familia:'familia',
      tributacao:'tributos',regulacao:'regulacao',internacional:'economia',
      geral:'politica'
    };

    var LABEL = {
      politica:'Política',economia:'Economia',negocios:'Negócios',
      investimentos:'Investimentos',mercados:'Mercados',tributacao:'Tributação',
      regulacao:'Regulação',seguros:'Seguros',saude:'Saúde',familia:'Família',
      tecnologia:'Tecnologia',industria:'Indústria',educacao:'Educação',
      esportes:'Esportes',cultura:'Cultura',patrimonio:'Patrimônio',
      internacional:'Internacional',geral:'Geral'
    };

    function buildUrl(p){
      var cat = CAT_PATH[p.categoria||'geral'] || 'politica';
      return '/' + cat + '/?id=' + (p.id||'').slice(0,8);
    }

    function dataBr(dt){
      if(!dt) return '';
      try{ return new Date(dt).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}); }
      catch(_){ return ''; }
    }

    function label(c){ return LABEL[c]||c||'Geral'; }

    function renderMini(p){
      var url = buildUrl(p);
      return '<article class="ovc-mini-item" style="cursor:pointer;display:grid;grid-template-columns:minmax(0,1fr) 76px;gap:12px;padding:10px 0;border-top:1px solid var(--ovc-line);" onclick="location.href=\'' + url + '\'">' +
        '<div>' +
          '<div style="font-size:11px;color:var(--ovc-muted,#64748b);margin-bottom:4px;">Redação OVC</div>' +
          '<h4 style="font-size:15px;font-weight:600;line-height:1.3;margin:0 0 4px;"><a href="' + url + '" style="color:inherit;text-decoration:none;">' + (p.titulo||'') + '</a></h4>' +
          '<div style="font-size:11px;color:var(--ovc-muted,#64748b);">' + dataBr(p.data) + '</div>' +
        '</div>' +
        (p.imagem
          ? '<a class="ovc-thumb" href="' + url + '" style="border-radius:10px;overflow:hidden;height:56px;"><img src="' + p.imagem + '" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.style.display=\'none\'"></a>'
          : '<div></div>') +
      '</article>';
    }

    fetch('/api/portal-posts?limit=60')
      .then(function(res){ return res.json(); })
      .then(function(json){
        var all = (json.posts||[]).filter(function(p){ return p.titulo && p.titulo.length > 0; });
        if (!all.length) return;

        var filtered = slug
          ? all.filter(function(p){ return p.categoria===slug || (p.tags && p.tags.indexOf(slug)!==-1); })
          : all;

        var toShow = filtered.length > 0 ? filtered : all;

        // DEDUPLICAR — por ID e por título normalizado
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

        // Hero
        var heroEl = document.querySelector('[data-hero-card]');
        if (heroEl && deduped[0]) {
          var p = deduped[0];
          var url = buildUrl(p);
          heroEl.style.cssText = 'display:block;padding:18px;box-sizing:border-box;cursor:pointer;';
          heroEl.onclick = function(e){ if(!e.target.closest('a')) location.href=url; };
          heroEl.innerHTML =
            (p.imagem
              ? '<a href="' + url + '"><img src="' + p.imagem + '" alt="" style="width:100%;height:200px;object-fit:cover;border-radius:8px;margin-bottom:12px;display:block;" onerror="this.style.display=\'none\'"></a>'
              : '') +
            '<div style="font-size:11px;color:var(--ovc-accent,#2563eb);font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">' + label(p.categoria) + '</div>' +
            '<h2 style="font-size:21px;font-weight:800;line-height:1.25;margin:0 0 8px;"><a href="' + url + '" style="color:inherit;text-decoration:none;">' + (p.titulo||'') + '</a></h2>' +
            '<p style="font-size:13px;color:var(--ovc-muted,#64748b);margin:0 0 8px;line-height:1.5;">' + (p.resumo||'').slice(0,140) + '</p>' +
            '<div style="font-size:11px;color:var(--ovc-muted,#64748b);">Redação OVC · ' + dataBr(p.data) + '</div>';
        }

        function safeRender(selector, items){
          var el = document.querySelector(selector);
          if (el && items.length) el.innerHTML = items.map(renderMini).join('');
        }

        safeRender('[data-main-list]', deduped.slice(1,5));
        safeRender('[data-local-list]', deduped.slice(5,8));
        safeRender('[data-rail-list]', deduped.slice(8,11));

        var topicGrid = document.querySelector('[data-topic-grid]');
        if (topicGrid) {
          var titles = (document.body.dataset.topicTitles||'').split('|');
          var bottom = deduped.slice(11,20);
          var groups = [0,1,2].map(function(idx){ return bottom.slice(idx*3,idx*3+3); });
          topicGrid.innerHTML = groups.map(function(group,idx){
            return '<section class="ovc-panel ovc-topic-box">' +
              '<h3>' + (titles[idx]||label(slug)) + '</h3>' +
              group.map(renderMini).join('') +
            '</section>';
          }).join('');
        }
      })
      .catch(function(e){ console.warn('OVC internal-page:', e.message); });
  });
})();
