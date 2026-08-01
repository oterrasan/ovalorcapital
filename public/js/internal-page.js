(function(){
  // Detectar ?id= na URL PRIMEIRO
  var params = new URLSearchParams(window.location.search);
  var id = params.get('id');

  if (id) {
    // MODO MATERIA — renderiza artigo completo
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
              return '<p style="font-size:16px;line-height:1.9;margin:0 0 16px;">' + l + '</p>';
            }).join('');

          var heroEl = document.querySelector('[data-hero-card]');
          if (heroEl) {
            heroEl.innerHTML =
              '<article class="ovc-story-card" style="padding:0;">'
                + '<div style="max-width:820px;">'
                  + (p.imagem ? '<img src="' + p.imagem + '" alt="" style="width:100%;max-height:420px;object-fit:cover;border-radius:12px;margin-bottom:24px;" onerror="this.style.display=\'none\'">' : '')
                  + '<div style="font-size:12px;color:var(--ovc-muted,#64748b);margin-bottom:10px;text-transform:uppercase;letter-spacing:.05em;">Redação OVC · ' + data + '</div>'
                  + '<h1 style="font-size:28px;font-weight:800;line-height:1.25;margin:0 0 16px;">' + (p.titulo || '') + '</h1>'
                  + (p.subtitulo ? '<p style="font-size:17px;color:var(--ovc-muted,#64748b);margin:0 0 20px;line-height:1.5;">' + p.subtitulo + '</p>' : '')
                  + '<div style="border-top:2px solid var(--ovc-line,#e2e8f0);padding-top:20px;">' + corpo + '</div>'
                + '</div>'
              + '</article>';
          }

          // Limpar listas de categoria
          ['[data-main-list]','[data-local-list]','[data-rail-list]','[data-topic-grid]'].forEach(function(sel){
            var el = document.querySelector(sel);
            if (el) el.innerHTML = '';
          });
        })
        .catch(function(e){ console.warn('OVC materia:', e.message); });
    });
    return; // NAO executa modo categoria
  }

  // MODO CATEGORIA — sem ?id=
  document.addEventListener('DOMContentLoaded', function(){
    var slug = document.body.dataset.category;

    // VC é área institucional — sem feed de artigos
    if (slug === 'vc') return;

    if (typeof OVC !== 'undefined' && OVC.applyCategoryColor) {
      OVC.applyCategoryColor(slug);
    }

    var CAT_PATH = {
      politica:'politica',economia:'economia',negocios:'negocios',
      financas:'financas',investimentos:'financas',seguros:'financas',mercados:'financas',
      educacao:'educacao',industria:'industria',tecnologia:'tecnologia',
      esportes:'esportes',saude:'saude',familia:'familia',
      tributacao:'tributos',regulacao:'regulacao',internacional:'internacional',
      parcerias:'parcerias',variedades:'variedades',investigativo:'investigativo',
      seguranca:'seguranca',cultura:'cultura',profissoes:'profissoes',
      vagas:'vagas',concursos:'concursos',imoveis:'imoveis',esg:'esg',
      defesa:'defesa',religiao:'religiao',colunistas:'colunistas',vc:'colunistas',
      geral:'politica'
    };

    var LABEL = {
      politica:'Política',economia:'Economia',negocios:'Negócios',
      financas:'Finanças',investimentos:'Investimentos',mercados:'Mercados',tributacao:'Tributação',
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
      return '<article class="ovc-mini-item" style="cursor:pointer;display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--ovc-line,#e2e8f0);" onclick="location.href=\'' + url + '\'">' +
        (p.imagem ? '<a href="' + url + '" style="flex-shrink:0;"><img src="' + p.imagem + '" alt="" style="width:80px;height:60px;object-fit:cover;border-radius:6px;" onerror="this.parentElement.style.display=\'none\'"></a>' : '') +
        '<div style="flex:1;">'
          + '<div style="font-size:11px;color:var(--ovc-muted,#64748b);margin-bottom:4px;">Redação OVC</div>'
          + '<h4 style="font-size:14px;font-weight:600;line-height:1.35;margin:0 0 4px;"><a href="' + url + '" style="color:inherit;text-decoration:none;">' + (p.titulo||'') + '</a></h4>'
          + '<div style="font-size:11px;color:var(--ovc-muted,#64748b);">' + dataBr(p.data) + '</div>'
        + '</div>'
      + '</article>';
    }

    fetch('/api/portal-posts?limit=60')
      .then(function(res){ return res.json(); })
      .then(function(json){
        var all = (json.posts||[]).filter(function(p){ return p.titulo && p.titulo.length > 0; });
        if (!all.length) return;

        var filtered = slug
          ? all.filter(function(p){
              var mappedCat = CAT_PATH[p.categoria] || p.categoria;
              return mappedCat === slug || (p.tags && p.tags.indexOf(slug) !== -1);
            })
          : all;

        var toShow = filtered;

        // Hero
        var heroEl = document.querySelector('[data-hero-card]');
        if (heroEl && toShow[0]) {
          var p = toShow[0];
          var url = buildUrl(p);
          heroEl.innerHTML =
            '<article class="ovc-story-card" style="cursor:pointer;" onclick="location.href=\'' + url + '\'">' +
              (p.imagem ? '<a href="' + url + '"><img src="' + p.imagem + '" alt="" style="width:100%;height:220px;object-fit:cover;border-radius:8px;margin-bottom:12px;" onerror="this.style.display=\'none\'"></a>' : '') +
              '<div>' +
                '<div style="font-size:11px;color:var(--ovc-accent,#2563eb);font-weight:600;margin-bottom:6px;">' + label(p.categoria) + '</div>' +
                '<h2 style="font-size:20px;font-weight:800;line-height:1.25;margin:0 0 8px;"><a href="' + url + '" style="color:inherit;text-decoration:none;">' + (p.titulo||'') + '</a></h2>' +
                '<p style="font-size:13px;color:var(--ovc-muted,#64748b);margin:0 0 8px;">' + (p.resumo||'').slice(0,140) + '</p>' +
                '<div style="font-size:11px;color:var(--ovc-muted,#64748b);">Redação OVC · ' + dataBr(p.data) + '</div>' +
              '</div>' +
            '</article>';
        }

        function safeRender(selector, items){
          var el = document.querySelector(selector);
          if (el) el.innerHTML = items.map(renderMini).join('');
        }

        safeRender('[data-main-list]', toShow.slice(1,5));
        safeRender('[data-local-list]', toShow.slice(5,8));
        safeRender('[data-rail-list]', toShow.slice(8,11));

        var topicGrid = document.querySelector('[data-topic-grid]');
        if (topicGrid) {
          var titles = (document.body.dataset.topicTitles||'').split('|');
          var bottom = toShow.slice(11,20);
          var groups = [0,1,2].map(function(idx){ return bottom.slice(idx*3,idx*3+3); });
          topicGrid.innerHTML = groups.map(function(group,idx){
            return '<section class="ovc-panel ovc-topic-box">'
              + '<h3>' + (titles[idx]||label(slug)) + '</h3>'
              + group.map(renderMini).join('')
            + '</section>';
          }).join('');
        }
      })
      .catch(function(e){ console.warn('OVC internal-page:', e.message); });
  });
})();
