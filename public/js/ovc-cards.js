(function(){
  'use strict';

  // ── CATEGORIAS — ordem e slugs exatos do supermenu ──────────────
  var CATS = [
    { id:'vc',           label:'OVC',          path:'/vc/',           cats:['vc'] },
    { id:'investimentos',label:'Investimentos', path:'/investimentos/',cats:['investimentos'] },
    { id:'mercados',     label:'Mercados',      path:'/mercados/',     cats:['mercados'] },
    { id:'educacao',     label:'Educação',      path:'/educacao/',     cats:['educacao'] },
    { id:'industria',    label:'Indústria',     path:'/industria/',    cats:['industria'] },
    { id:'tecnologia',   label:'Tecnologia',    path:'/tecnologia/',   cats:['tecnologia'] },
    { id:'esportes',     label:'Esportes',      path:'/esportes/',     cats:['esportes'] },
    { id:'saude',        label:'Saúde',         path:'/saude/',        cats:['saude'] },
    { id:'familia',      label:'Família',       path:'/familia/',      cats:['familia'] },
    { id:'tributos',     label:'Tributos',      path:'/tributos/',     cats:['tributacao'] },
    { id:'regulacao',    label:'Regulação',     path:'/regulacao/',    cats:['regulacao'] },
    { id:'parcerias',    label:'Parcerias',     path:'/parcerias/',    cats:['parcerias'] },
    { id:'variedades',   label:'Variedades',    path:'/variedades/',   cats:['variedades'] },
    { id:'colunistas',   label:'Colunistas',    path:'/colunistas/',   cats:['colunistas'] }
  ];

  var ROTATION_INTERVAL = 7000;
  var ROTATION_MAX      = 10;

  // ── HELPERS ──────────────────────────────────────────────────────
  function dataBr(s){
    if(!s) return '';
    var d = new Date(s);
    if(isNaN(d)) return '';
    return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});
  }

  function buildUrl(p){
    var catPath = {
      politica:'politica', economia:'economia', negocios:'negocios',
      investimentos:'investimentos', seguros:'seguros', mercados:'mercados',
      educacao:'educacao', industria:'industria', tecnologia:'tecnologia',
      esportes:'esportes', saude:'saude', familia:'familia',
      tributacao:'tributos', regulacao:'regulacao', parcerias:'parcerias',
      vc:'vc', colunistas:'colunistas', variedades:'variedades', internacional:'economia', geral:'politica'
    };
    var cat = catPath[p.categoria] || 'politica';
    return '/' + cat + '/?id=' + (p.id||'').slice(0,8);
  }

  var BLOCKED = [
    /perfil/i,/author/i,/avatar/i,/reporter/i,/profile/i,/headshot/i,
    /\/autores?\//i,/\/pessoas?\//i,/columnist/i,/byline/i,/editor/i,
    /icon/i,/logo/i,/favicon/i,/sprite/i,/watermark/i,/\.svg$/i,/\.gif$/i,/\.ico$/i
  ];
  function imgOk(url){
    if(!url||url.length<12) return false;
    return !BLOCKED.some(function(r){ return r.test(url); });
  }

  // ── RENDERIZAR CARD ──────────────────────────────────────────────
  function renderCard(el, post, path){
    if(!el||!post) return;
    var url = buildUrl(post);

    // Imagem
    if(imgOk(post.imagem)){
      el.style.backgroundImage = "url('"+post.imagem+"')";
      el.style.backgroundSize  = 'cover';
      el.style.backgroundPosition = 'center';
    } else {
      el.style.backgroundImage = '';
    }

    // Conteúdo
    el.querySelector('.ovc-card-title').textContent = post.titulo || '';
    el.querySelector('.ovc-card-meta').textContent  = 'Redação OVC · ' + dataBr(post.data);
    var cta = el.querySelector('.ovc-card-cta');
    if(cta) cta.href = url;

    // Clique
    el.onclick = null;
    el.onclick = function(e){
      if(!e.target.closest('a')) location.href = url;
    };
    el.style.cursor = 'pointer';
  }

  // ── ROTAÇÃO ──────────────────────────────────────────────────────
  function startRotation(el, posts, path){
    if(!el||!posts||!posts.length) return;
    var idx = 0, count = 0;
    renderCard(el, posts[0], path);
    var timer = setInterval(function(){
      count++;
      if(count >= ROTATION_MAX){ clearInterval(timer); return; }
      idx = (idx+1) % posts.length;
      renderCard(el, posts[idx], path);
    }, ROTATION_INTERVAL);
  }

  // ── CONSTRUIR HTML DA SEÇÃO ──────────────────────────────────────
  function buildSection(container){
    // Grid wrapper
    var grid = document.createElement('div');
    grid.className = 'ovc-cat-grid';
    grid.style.cssText = [
      'display:grid',
      'grid-template-columns:repeat(3,minmax(0,1fr))',
      'gap:18px',
      'margin-top:22px',
      'width:100%'
    ].join(';');

    CATS.forEach(function(cat){
      var card = document.createElement('article');
      card.className = 'ovc-cat-card';
      card.id = 'ovc-cat-' + cat.id;
      card.style.cssText = [
        'position:relative',
        'border-radius:12px',
        'overflow:hidden',
        'min-height:260px',
        'display:flex',
        'flex-direction:column',
        'justify-content:flex-end',
        'padding:16px',
        'background:#0f172a',
        'background-size:cover',
        'background-position:center',
        'box-shadow:0 2px 12px rgba(0,0,0,0.15)',
        'transition:transform 0.2s,box-shadow 0.2s',
        'cursor:pointer'
      ].join(';');

      // Overlay gradiente via pseudo — feito com div interno
      var overlay = document.createElement('div');
      overlay.style.cssText = [
        'position:absolute',
        'inset:0',
        'background:linear-gradient(to top,rgba(0,0,0,0.82) 0%,rgba(0,0,0,0.28) 55%,rgba(0,0,0,0.04) 100%)',
        'border-radius:inherit',
        'pointer-events:none',
        'z-index:0'
      ].join(';');
      card.appendChild(overlay);

      // Conteúdo
      var inner = document.createElement('div');
      inner.style.cssText = 'position:relative;z-index:1;display:flex;flex-direction:column;gap:6px;';

      var tag = document.createElement('span');
      tag.className = 'ovc-card-tag';
      tag.style.cssText = [
        'display:inline-flex',
        'align-items:center',
        'gap:5px',
        'font-size:11px',
        'font-weight:700',
        'letter-spacing:0.08em',
        'text-transform:uppercase',
        'color:#fff',
        'background:rgba(255,255,255,0.15)',
        'border:1px solid rgba(255,255,255,0.35)',
        'backdrop-filter:blur(4px)',
        'padding:3px 9px',
        'border-radius:999px',
        'width:fit-content'
      ].join(';');
      tag.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:#ffc800;display:inline-block;flex-shrink:0;"></span>' + cat.label;

      var title = document.createElement('h2');
      title.className = 'ovc-card-title';
      title.style.cssText = [
        'font-size:15px',
        'font-weight:800',
        'color:#fff',
        'text-shadow:0 2px 8px rgba(0,0,0,0.8)',
        'margin:0',
        'line-height:1.35',
        'display:-webkit-box',
        '-webkit-line-clamp:3',
        '-webkit-box-orient:vertical',
        'overflow:hidden'
      ].join(';');
      title.textContent = 'Carregando...';

      var meta = document.createElement('div');
      meta.className = 'ovc-card-meta';
      meta.style.cssText = 'font-size:11px;color:rgba(255,255,255,0.7);font-weight:500;';
      meta.textContent = 'Redação OVC';

      var cta = document.createElement('a');
      cta.className = 'ovc-card-cta';
      cta.href = cat.path;
      cta.style.cssText = [
        'display:inline-flex',
        'align-items:center',
        'gap:4px',
        'margin-top:4px',
        'font-size:11px',
        'font-weight:700',
        'color:#ffc800',
        'text-decoration:none',
        'letter-spacing:0.06em',
        'width:fit-content'
      ].join(';');
      cta.textContent = 'LEIA MAIS';

      inner.appendChild(tag);
      inner.appendChild(title);
      inner.appendChild(meta);
      inner.appendChild(cta);
      card.appendChild(inner);

      // Hover
      card.addEventListener('mouseenter', function(){ this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 24px rgba(0,0,0,0.25)'; });
      card.addEventListener('mouseleave', function(){ this.style.transform=''; this.style.boxShadow='0 2px 12px rgba(0,0,0,0.15)'; });

      grid.appendChild(card);
    });

    container.appendChild(grid);
  }

  // ── CARREGAR POSTS E PREENCHER ───────────────────────────────────
  function load(){
    var container = document.getElementById('ovc-cards-section');
    if(!container) return;

    // Construir HTML uma vez
    if(!container.querySelector('.ovc-cat-grid')){
      buildSection(container);
    }

    fetch('/api/portal-posts?limit=200')
      .then(function(r){ return r.json(); })
      .then(function(data){
        var posts = (data.posts || data || []);

        CATS.forEach(function(cat){
          var el = document.getElementById('ovc-cat-' + cat.id);
          if(!el) return;

          // Filtrar pela categoria exata — regra inviolável
          var pool = posts.filter(function(p){
            return cat.cats.indexOf(p.categoria) !== -1;
          });

          // Priorizar posts com imagem
          pool.sort(function(a,b){
            var ai = imgOk(a.imagem) ? 0 : 1;
            var bi = imgOk(b.imagem) ? 0 : 1;
            return ai - bi;
          });

          if(pool.length) startRotation(el, pool, cat.path);
        });
      })
      .catch(function(e){ console.warn('OVC cards:', e.message); });
  }

  document.addEventListener('DOMContentLoaded', function(){
    load();
    setInterval(load, 120000);
  });
})();
