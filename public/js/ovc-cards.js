(function(){
  'use strict';

  var CATS = [
    { id:'vc',           label:'OVC',          path:'/vc/',           cats:['vc','colunistas'] },
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
    { id:'internacional',  label:'Internacional',   path:'/internacional/',  cats:['internacional'] },
    { id:'variedades',     label:'Variedades',      path:'/variedades/',     cats:['variedades'] },
    { id:'investigativo',  label:'Investigativo',   path:'/investigativo/',  cats:['investigativo'] },
    { id:'seguranca',      label:'Seg. Pública',    path:'/seguranca/',      cats:['seguranca'] },
    { id:'cultura',        label:'Cultura',         path:'/cultura/',        cats:['cultura'] },
    { id:'profissoes',     label:'Profissões',      path:'/profissoes/',     cats:['profissoes'] },
    { id:'vagas',          label:'Vagas',           path:'/vagas/',          cats:['vagas'] },
    { id:'concursos',      label:'Concursos',       path:'/concursos/',      cats:['concursos'] },
    { id:'imoveis',        label:'Imóveis',         path:'/imoveis/',        cats:['imoveis'] },
    { id:'esg',            label:'ESG',             path:'/esg/',            cats:['esg'] },
    { id:'defesa',         label:'Defesa',          path:'/defesa/',         cats:['defesa'] },
    { id:'religiao',       label:'Religião',        path:'/religiao/',       cats:['religiao'] }
  ];

  var ROTATION_INTERVAL = 7000;
  var ROTATION_MAX      = 10;

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
      vc:'vc', colunistas:'vc', internacional:'internacional', variedades:'variedades', geral:'politica',
      investigativo:'investigativo', seguranca:'seguranca', cultura:'cultura', profissoes:'profissoes', vagas:'vagas',
      concursos:'concursos', imoveis:'imoveis', esg:'esg', defesa:'defesa', religiao:'religiao'
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

  // ── ESTILOS FIXOS — idênticos em todos os cards ──────────────────
  var STYLE = {
    card: [
      'position:relative',
      'border-radius:12px',
      'overflow:hidden',
      'min-height:220px',
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
    ].join(';'),
    overlay: [
      'position:absolute',
      'inset:0',
      'background:linear-gradient(to top,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.30) 55%,rgba(0,0,0,0.04) 100%)',
      'border-radius:inherit',
      'pointer-events:none',
      'z-index:0'
    ].join(';'),
    inner: 'position:relative;z-index:1;display:flex;flex-direction:column;gap:5px;',
    tag: [
      'display:inline-flex',
      'align-items:center',
      'gap:5px',
      'font-family:inherit',
      'font-size:10px',
      'font-weight:700',
      'letter-spacing:0.09em',
      'text-transform:uppercase',
      'color:#fff',
      'background:rgba(255,255,255,0.13)',
      'border:1px solid rgba(255,255,255,0.32)',
      'backdrop-filter:blur(4px)',
      'padding:3px 9px',
      'border-radius:999px',
      'width:fit-content'
    ].join(';'),
    title: [
      'font-family:inherit',
      'font-size:14px',
      'font-weight:700',
      'line-height:1.38',
      'color:#fff',
      'text-shadow:0 2px 8px rgba(0,0,0,0.75)',
      'margin:0',
      'display:-webkit-box',
      '-webkit-line-clamp:3',
      '-webkit-box-orient:vertical',
      'overflow:hidden'
    ].join(';'),
    meta: [
      'font-family:inherit',
      'font-size:11px',
      'font-weight:500',
      'color:rgba(255,255,255,0.65)',
      'line-height:1.3'
    ].join(';'),
    cta: [
      'display:inline-flex',
      'align-items:center',
      'gap:4px',
      'margin-top:5px',
      'font-family:inherit',
      'font-size:11px',
      'font-weight:700',
      'letter-spacing:0.06em',
      'color:#ffc800',
      'text-decoration:none',
      'width:fit-content'
    ].join(';')
  };

  function renderCard(el, post, path){
    if(!el||!post) return;
    var url = buildUrl(post);
    if(imgOk(post.imagem)){
      el.style.backgroundImage = "url('"+post.imagem+"')";
    } else {
      el.style.backgroundImage = '';
    }
    el.querySelector('.ovc-card-title').textContent = post.titulo || '';
    el.querySelector('.ovc-card-meta').textContent  = 'Redação OVC · ' + dataBr(post.data);
    var cta = el.querySelector('.ovc-card-cta');
    if(cta) cta.href = url;
    el.onclick = null;
    el.onclick = function(e){ if(!e.target.closest('a')) location.href = url; };
  }

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

  function buildCard(cat){
    var card = document.createElement('article');
    card.className = 'ovc-cat-card';
    card.id = 'ovc-cat-' + cat.id;
    card.style.cssText = STYLE.card;

    var overlay = document.createElement('div');
    overlay.style.cssText = STYLE.overlay;
    card.appendChild(overlay);

    var inner = document.createElement('div');
    inner.style.cssText = STYLE.inner;

    var tag = document.createElement('span');
    tag.className = 'ovc-card-tag';
    tag.style.cssText = STYLE.tag;
    tag.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:#ffc800;display:inline-block;flex-shrink:0;"></span>' + cat.label;

    var title = document.createElement('h2');
    title.className = 'ovc-card-title';
    title.style.cssText = STYLE.title;
    title.textContent = '';

    var meta = document.createElement('div');
    meta.className = 'ovc-card-meta';
    meta.style.cssText = STYLE.meta;
    meta.textContent = 'Redação OVC';

    var cta = document.createElement('a');
    cta.className = 'ovc-card-cta';
    cta.href = cat.path;
    cta.style.cssText = STYLE.cta;
    cta.textContent = 'LEIA MAIS';

    inner.appendChild(tag);
    inner.appendChild(title);
    inner.appendChild(meta);
    inner.appendChild(cta);
    card.appendChild(inner);

    card.addEventListener('mouseenter', function(){ this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 24px rgba(0,0,0,0.25)'; });
    card.addEventListener('mouseleave', function(){ this.style.transform=''; this.style.boxShadow='0 2px 12px rgba(0,0,0,0.15)'; });

    return card;
  }

  function buildSection(container){
    var grid = document.createElement('div');
    grid.className = 'ovc-cat-grid';
    grid.style.cssText = [
      'display:grid',
      'grid-template-columns:repeat(3,minmax(0,1fr))',
      'gap:18px',
      'margin-top:22px',
      'width:100%'
    ].join(';');
    CATS.forEach(function(cat){ grid.appendChild(buildCard(cat)); });
    container.appendChild(grid);
  }

  function load(){
    var container = document.getElementById('ovc-cards-section');
    if(!container) return;
    if(!container.querySelector('.ovc-cat-grid')) buildSection(container);

    fetch('/api/portal-posts?limit=200')
      .then(function(r){ return r.json(); })
      .then(function(data){
        var posts = (data.posts || data || []);
        var grid  = container.querySelector('.ovc-cat-grid');

        var comPost  = [];
        var semPost  = [];

        CATS.forEach(function(cat){
          var pool = posts.filter(function(p){ return cat.cats.indexOf(p.categoria) !== -1; });
          pool.sort(function(a,b){ return (imgOk(a.imagem)?0:1)-(imgOk(b.imagem)?0:1); });
          if(pool.length) comPost.push({ cat:cat, pool:pool });
          else            semPost.push({ cat:cat, pool:[] });
        });

        // Renderizar cards com conteúdo
        comPost.forEach(function(item){
          var el = document.getElementById('ovc-cat-' + item.cat.id);
          if(el){ startRotation(el, item.pool, item.cat.path); }
        });

        // Remover completamente os cards sem conteúdo
        semPost.forEach(function(item){
          var el = document.getElementById('ovc-cat-' + item.cat.id);
          if(el) el.remove();
        });
      })
      .catch(function(e){ console.warn('OVC cards:', e.message); });
  }

  document.addEventListener('DOMContentLoaded', function(){
    load();
    setInterval(load, 120000);
    injetarMenuProfissoes();
    carregarMaisLidas();
    carregarOvcTv();
  });

  function carregarMaisLidas(){
    var sec = document.getElementById('ovc-mais-lidas-home');
    if(!sec) return;
    fetch('/api/portal-posts?sort=popular&limit=8')
      .then(function(r){ return r.json(); })
      .then(function(d){
        var posts = (d.posts||[]).slice(0,7);
        if(!posts.length){ sec.style.display='none'; return; }
        var primeiro = posts[0];
        var resto    = posts.slice(1);
        var c = function(cat){ var CORES={politica:'#dc2626',economia:'#2563eb',negocios:'#7c3aed',investimentos:'#059669',mercados:'#0891b2',tributacao:'#b45309',regulacao:'#9333ea',seguros:'#0284c7',saude:'#16a34a',familia:'#db2777',tecnologia:'#6366f1',industria:'#ea580c',educacao:'#8b5cf6',esportes:'#16a34a',internacional:'#dc2626',variedades:'#ec4899',parcerias:'#14b8a6',vc:'#ffc800',investigativo:'#1a1a2e',seguranca:'#7f1d1d',cultura:'#7e22ce',profissoes:'#0369a1',vagas:'#065f46',concursos:'#1e40af',imoveis:'#b45309',esg:'#166534',defesa:'#1e3a5f',religiao:'#6d28d9'}; return CORES[cat]||'#64748b'; };
        var LABELS={politica:'Política',economia:'Economia',negocios:'Negócios',investimentos:'Investimentos',mercados:'Mercados',tributacao:'Tributação',regulacao:'Regulação',seguros:'Seguros',saude:'Saúde',familia:'Família',tecnologia:'Tecnologia',industria:'Indústria',educacao:'Educação',esportes:'Esportes',internacional:'Internacional',variedades:'Variedades',parcerias:'Parcerias',vc:'OVC',investigativo:'Investigativo',seguranca:'Seg. Pública',cultura:'Cultura',profissoes:'Profissões',vagas:'Vagas',concursos:'Concursos',imoveis:'Imóveis',esg:'ESG',defesa:'Defesa',religiao:'Religião'};
        var lbl = function(cat){ return LABELS[cat]||cat; };
        var esc = function(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };

        var priCol = primeiro.imagem
          ? 'background:url("'+primeiro.imagem+'") center/cover no-repeat;'
          : 'background:'+c(primeiro.categoria)+';';
        var html = '<div style="display:grid;grid-template-columns:1fr 300px;gap:0;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.12);min-height:320px;">'
          // Destaque principal
          +'<a href="'+(primeiro.url||'#')+'" style="display:block;position:relative;'+priCol+'text-decoration:none;">'
            +'<div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.9) 0%,rgba(0,0,0,0.2) 60%,rgba(0,0,0,0) 100%);"></div>'
            +'<div style="position:absolute;top:16px;left:16px;">'
              +'<span style="background:#e11d48;color:#fff;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;padding:3px 10px;border-radius:4px;">🔥 #1 Mais Lida</span>'
            +'</div>'
            +'<div style="position:absolute;bottom:0;left:0;right:0;padding:24px 20px;">'
              +'<span style="display:inline-block;background:'+c(primeiro.categoria)+';color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;padding:2px 8px;border-radius:4px;margin-bottom:8px;">'+lbl(primeiro.categoria)+'</span>'
              +'<h3 style="font-size:20px;font-weight:900;color:#fff;margin:0;line-height:1.25;text-shadow:0 2px 8px rgba(0,0,0,0.5);">'+esc(primeiro.titulo)+'</h3>'
            +'</div>'
          +'</a>'
          // Lista lateral
          +'<div style="background:#0f172a;padding:0;">'
            + resto.map(function(p, i){
              return '<a href="'+(p.url||'#')+'" style="display:flex;gap:12px;align-items:flex-start;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.07);text-decoration:none;transition:background 0.15s;" onmouseover="this.style.background=\'rgba(255,255,255,0.05)\'" onmouseout="this.style.background=\'transparent\'">'
                +'<span style="font-size:22px;font-weight:900;color:rgba(255,255,255,0.2);min-width:28px;font-family:Georgia,serif;">'+(i+2)+'</span>'
                +'<div style="flex:1;min-width:0;">'
                  +'<span style="font-size:9px;font-weight:700;text-transform:uppercase;color:'+c(p.categoria)+';letter-spacing:.06em;">'+lbl(p.categoria)+'</span>'
                  +'<p style="font-size:13px;font-weight:600;color:#f1f5f9;margin:3px 0 0;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">'+esc(p.titulo)+'</p>'
                +'</div>'
              +'</a>';
            }).join('')
          +'</div>'
        +'</div>';
        sec.innerHTML = html;
        sec.style.display = 'block';
      }).catch(function(){ sec.style.display='none'; });
  }

  function carregarOvcTv(){
    var sec = document.getElementById('ovc-tv-home');
    if(!sec) return;
    fetch('/api/manage')
      .then(function(r){ return r.json(); })
      .then(function(cfg){
        var ytUrl = cfg.youtube_live_url;
        if(!ytUrl){ sec.style.display='none'; return; }
        sec.innerHTML =
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">'
            +'<span style="display:inline-flex;align-items:center;gap:6px;background:#e11d48;color:#fff;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;padding:5px 12px;border-radius:4px;">📺 OVC TV — Ao Vivo</span>'
            +'<span style="width:8px;height:8px;border-radius:50%;background:#22c55e;display:inline-block;box-shadow:0 0 0 3px rgba(34,197,94,0.25);animation:ovc-pulse 2s infinite;"></span>'
            +'<span style="font-size:12px;color:#64748b;">Transmissão ao vivo</span>'
          +'</div>'
          +'<div style="border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.15);">'
          +'<iframe width="100%" height="400" src="'+ytUrl+'" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;picture-in-picture" allowfullscreen loading="lazy" style="display:block;"></iframe>'
          +'</div>';
        sec.style.display = 'block';

        // Injeta a animação pulse se não existir
        if(!document.getElementById('ovc-pulse-style')){
          var st = document.createElement('style');
          st.id = 'ovc-pulse-style';
          st.textContent = '@keyframes ovc-pulse{0%,100%{opacity:1}50%{opacity:0.4}}';
          document.head.appendChild(st);
        }
      }).catch(function(){ sec.style.display='none'; });
  }

  function injetarMenuProfissoes(){
    var nav = document.querySelector('nav.supermenu');
    if (!nav) return;
    var maisItem = null;
    nav.querySelectorAll('.supermenu-item').forEach(function(item){
      var lbl = item.querySelector('a.label');
      if (lbl && lbl.textContent.indexOf('Mais') !== -1) maisItem = item;
    });
    if (maisItem) {
      var profLink = maisItem.querySelector('a[href="/profissoes/"]');
      if (profLink) profLink.remove();
    }
    var profItem = document.createElement('div');
    profItem.className = 'supermenu-item';
    profItem.innerHTML =
      '<a class="label" href="/profissoes/">Profissões</a>' +
      '<div class="submenu">' +
        '<div class="submenu-title">Saúde</div>' +
        '<a href="/profissoes/medicina/">Medicina</a>' +
        '<a href="/profissoes/enfermagem/">Enfermagem</a>' +
        '<a href="/profissoes/odontologia/">Odontologia</a>' +
        '<a href="/profissoes/farmacia/">Farmácia</a>' +
        '<a href="/profissoes/psicologia/">Psicologia</a>' +
        '<a href="/profissoes/fisioterapia/">Fisioterapia</a>' +
        '<a href="/profissoes/nutricao/">Nutrição</a>' +
        '<a href="/profissoes/veterinaria/">Med. Veterinária</a>' +
        '<a href="/profissoes/biomedicina/">Biomedicina</a>' +
        '<a href="/profissoes/fonoaudiologia/">Fonoaudiologia</a>' +
        '<div class="submenu-title">Jurídico &amp; Finanças</div>' +
        '<a href="/profissoes/direito/">Direito &amp; Advocacia</a>' +
        '<a href="/profissoes/contabilidade/">Contabilidade</a>' +
        '<a href="/profissoes/administracao/">Administração</a>' +
        '<a href="/profissoes/economia/">Economia</a>' +
        '<a href="/profissoes/auditoria/">Auditoria &amp; Compliance</a>' +
        '<div class="submenu-title">Engenharia &amp; TI</div>' +
        '<a href="/profissoes/engenharia-civil/">Eng. Civil &amp; Construção</a>' +
        '<a href="/profissoes/arquitetura/">Arquitetura &amp; Urbanismo</a>' +
        '<a href="/profissoes/engenharia-eletrica/">Eng. Elétrica &amp; Eletrônica</a>' +
        '<a href="/profissoes/engenharia-quimica/">Eng. Química &amp; Materiais</a>' +
        '<a href="/profissoes/ti/">TI &amp; Programação</a>' +
        '<a href="/profissoes/agronomia/">Agronomia &amp; Agro</a>' +
        '<div class="submenu-title">Comunicação &amp; Educação</div>' +
        '<a href="/profissoes/jornalismo/">Jornalismo</a>' +
        '<a href="/profissoes/publicidade/">Publicidade &amp; Propaganda</a>' +
        '<a href="/profissoes/relacoes-publicas/">Relações Públicas</a>' +
        '<a href="/profissoes/pedagogia/">Pedagogia &amp; Docência</a>' +
        '<a href="/profissoes/rh/">Recursos Humanos</a>' +
        '<a href="/profissoes/servico-social/">Serviço Social</a>' +
      '</div>';
    if (maisItem) nav.insertBefore(profItem, maisItem);
    else nav.appendChild(profItem);
  }
})();
