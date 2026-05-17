(function(){
  'use strict';

  var CATS = [
    { id:'politica',     label:'Política',       path:'/politica/',     cats:['politica'] },
    { id:'economia',     label:'Economia',       path:'/economia/',     cats:['economia'] },
    { id:'internacional',label:'Internacional',  path:'/internacional/',cats:['internacional'] },
    { id:'investigativo',label:'Investigativo',  path:'/investigativo/',cats:['investigativo'] },
    { id:'negocios',     label:'Negócios',      path:'/negocios/',     cats:['negocios'] },
    { id:'investimentos',label:'Investimentos',  path:'/investimentos/',cats:['investimentos'] },
    { id:'mercados',     label:'Mercados',       path:'/mercados/',     cats:['mercados'] },
    { id:'seguros',      label:'Seguros',        path:'/seguros/',      cats:['seguros'] },
    { id:'tributacao',   label:'Tributos',       path:'/tributos/',     cats:['tributacao'] },
    { id:'tecnologia',   label:'Tecnologia',     path:'/tecnologia/',   cats:['tecnologia'] },
    { id:'industria',    label:'Indústria',      path:'/industria/',    cats:['industria'] },
    { id:'regulacao',    label:'Regulação',      path:'/regulacao/',    cats:['regulacao'] },
    { id:'saude',        label:'Saúde',          path:'/saude/',        cats:['saude'] },
    { id:'educacao',     label:'Educação',       path:'/educacao/',     cats:['educacao'] },
    { id:'esportes',     label:'Esportes',       path:'/esportes/',     cats:['esportes'] },
    { id:'seguranca',    label:'Seg. Pública',   path:'/seguranca/',    cats:['seguranca'] },
    { id:'familia',      label:'Família',        path:'/familia/',      cats:['familia'] },
    { id:'cultura',      label:'Cultura',        path:'/cultura/',      cats:['cultura'] },
    { id:'variedades',   label:'Variedades',     path:'/variedades/',   cats:['variedades'] },
    { id:'profissoes',   label:'Profissões',     path:'/profissoes/',   cats:['profissoes'] },
    { id:'vagas',        label:'Vagas',          path:'/vagas/',        cats:['vagas'] },
    { id:'concursos',    label:'Concursos',      path:'/concursos/',    cats:['concursos'] },
    { id:'imoveis',      label:'Imóveis',        path:'/imoveis/',      cats:['imoveis'] },
    { id:'esg',          label:'ESG',            path:'/esg/',          cats:['esg'] },
    { id:'defesa',       label:'Defesa',         path:'/defesa/',       cats:['defesa'] },
    { id:'religiao',     label:'Fé & Espiritualidade', path:'/religiao/', cats:['religiao'] },
    { id:'parcerias',    label:'Parcerias',      path:'/parcerias/',    cats:['parcerias'] },
    { id:'vc',           label:'OVC / Colunistas',path:'/vc/',          cats:['vc','colunistas'] }
  ];

  var CATS_DESTAQUE = ['politica','economia','internacional','investigativo','negocios','seguros'];

  var CORES_CAT = {
    politica:'#dc2626',economia:'#2563eb',negocios:'#7c3aed',
    investimentos:'#059669',mercados:'#0891b2',seguros:'#0284c7',
    tributacao:'#b45309',regulacao:'#9333ea',tecnologia:'#6366f1',
    industria:'#ea580c',educacao:'#8b5cf6',saude:'#16a34a',
    familia:'#db2777',esportes:'#16a34a',internacional:'#dc2626',
    variedades:'#ec4899',cultura:'#7e22ce',investigativo:'#1a1a2e',
    seguranca:'#7f1d1d',profissoes:'#0369a1',vagas:'#065f46',
    concursos:'#1e40af',imoveis:'#b45309',parcerias:'#14b8a6',
    esg:'#166534',defesa:'#1e3a5f',religiao:'#6d28d9',vc:'#b8860b'
  };

  var ROTATION_INTERVAL = 7000;
  var ROTATION_MAX      = 10;

  function dataBr(s){
    if(!s) return '';
    var d = new Date(s);
    if(isNaN(d)) return '';
    return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});
  }

  function _slugify(s){
    return (s||'').toLowerCase().normalize('NFD')
      .replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9\s-]/g,'')
      .trim().replace(/\s+/g,'-').slice(0,55);
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
    var cp = catPath[p.categoria] || 'politica';
    var sl = p.slug ? p.slug.slice(0,55) : _slugify(p.titulo||'');
    var id8 = (p.id||'').slice(0,8);
    return '/' + cp + '/' + sl + '-' + id8 + '/';
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

  function escHtml(s){
    return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  var STYLE = {
    card: [
      'position:relative','border-radius:12px','overflow:hidden','min-height:220px',
      'display:flex','flex-direction:column','justify-content:flex-end','padding:16px',
      'background:#0f172a','background-size:cover','background-position:center',
      'box-shadow:0 2px 12px rgba(0,0,0,0.15)','transition:transform 0.2s,box-shadow 0.2s','cursor:pointer'
    ].join(';'),
    overlay: [
      'position:absolute','inset:0',
      'background:linear-gradient(to top,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.30) 55%,rgba(0,0,0,0.04) 100%)',
      'border-radius:inherit','pointer-events:none','z-index:0'
    ].join(';'),
    inner: 'position:relative;z-index:1;display:flex;flex-direction:column;gap:5px;',
    tag: [
      'display:inline-flex','align-items:center','gap:5px','font-family:inherit',
      'font-size:10px','font-weight:700','letter-spacing:0.09em','text-transform:uppercase',
      'color:#fff','background:rgba(255,255,255,0.13)','border:1px solid rgba(255,255,255,0.32)',
      'backdrop-filter:blur(4px)','padding:3px 9px','border-radius:999px','width:fit-content'
    ].join(';'),
    title: [
      'font-family:inherit','font-size:14px','font-weight:700','line-height:1.38','color:#fff',
      'text-shadow:0 2px 8px rgba(0,0,0,0.75)','margin:0','display:-webkit-box',
      '-webkit-line-clamp:3','-webkit-box-orient:vertical','overflow:hidden'
    ].join(';'),
    meta: ['font-family:inherit','font-size:11px','font-weight:500','color:rgba(255,255,255,0.65)','line-height:1.3'].join(';'),
    cta: [
      'display:inline-flex','align-items:center','gap:4px','margin-top:5px','font-family:inherit',
      'font-size:11px','font-weight:700','letter-spacing:0.06em','color:#ffc800','text-decoration:none','width:fit-content'
    ].join(';')
  };

  function renderCard(el, post, catId){
    if(!el||!post) return;
    var url = buildUrl(post);
    if(imgOk(post.imagem)){
      el.style.backgroundImage = "url('"+post.imagem+"')";
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
    } else {
      var cor = CORES_CAT[catId] || CORES_CAT[post.categoria] || '#1e293b';
      el.style.backgroundImage = 'none';
      el.style.background = 'linear-gradient(135deg,'+cor+' 0%,'+cor+'aa 100%)';
    }
    el.querySelector('.ovc-card-title').textContent = post.titulo || '';
    el.querySelector('.ovc-card-meta').textContent  = 'Redação OVC · ' + dataBr(post.data);
    var cta = el.querySelector('.ovc-card-cta');
    if(cta) cta.href = url;
    el.onclick = null;
    el.onclick = function(e){ if(!e.target.closest('a')) location.href = url; };
  }

  function startRotation(el, posts, catId, startIdx){
    if(!el||!posts||!posts.length) return;
    var idx = (startIdx || 0) % posts.length;
    var count = 0;
    renderCard(el, posts[idx], catId);
    var timer = setInterval(function(){
      count++;
      if(count >= ROTATION_MAX){ clearInterval(timer); return; }
      idx = (idx+1) % posts.length;
      renderCard(el, posts[idx], catId);
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
    inner.appendChild(tag); inner.appendChild(title); inner.appendChild(meta); inner.appendChild(cta);
    card.appendChild(inner);
    card.addEventListener('mouseenter', function(){ this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 24px rgba(0,0,0,0.25)'; });
    card.addEventListener('mouseleave', function(){ this.style.transform=''; this.style.boxShadow='0 2px 12px rgba(0,0,0,0.15)'; });
    return card;
  }

  function buildSection(container){
    var grid = document.createElement('div');
    grid.className = 'ovc-cat-grid';
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:22px;width:100%;';
    CATS.forEach(function(cat){ grid.appendChild(buildCard(cat)); });
    container.appendChild(grid);
  }

  function mostrarVazio(el, catId){
    if(!el) return;
    var cor = CORES_CAT[catId] || '#1e293b';
    el.style.backgroundImage = '';
    el.style.background = 'linear-gradient(135deg,'+cor+' 0%,'+cor+'99 100%)';
    var t = el.querySelector('.ovc-card-title'); if(t) t.textContent = 'Em breve — aguarde novos conteúdos';
    var m = el.querySelector('.ovc-card-meta');  if(m) m.textContent = 'Redação OVC';
  }

  function carregarCat(cat){
    return fetch('/api/portal-posts?categoria='+cat.cats[0]+'&limit=10')
      .then(function(r){ return r.json(); })
      .then(function(data){
        var posts = (data.posts||[]).filter(function(p){ return cat.cats.indexOf(p.categoria)!==-1; });
        posts.sort(function(a,b){ return (imgOk(a.imagem)?0:1)-(imgOk(b.imagem)?0:1); });
        return { cat:cat, pool:posts };
      })
      .catch(function(){ return { cat:cat, pool:[] }; });
  }

  function load(){
    var container = document.getElementById('ovc-cards-section');
    if(!container) return;
    if(!container.querySelector('.ovc-cat-grid')) buildSection(container);
    Promise.all(CATS.map(carregarCat)).then(function(results){
      results.forEach(function(item){
        var el = document.getElementById('ovc-cat-'+item.cat.id);
        if(!el) return;
        if(!item.pool.length){ mostrarVazio(el, item.cat.id); return; }
        var overlap = item.cat.cats.some(function(c){ return CATS_DESTAQUE.indexOf(c)!==-1; });
        startRotation(el, item.pool, item.cat.id, overlap&&item.pool.length>1?1:0);
      });
    });
  }

  // ── SEÇÃO COLUNISTAS 3+3 ────────────────────────────────────────────
  function bigCard(p){
    var url = buildUrl(p);
    var img = p.imagem && imgOk(p.imagem) ? p.imagem : '';
    return '<a href="'+url+'" style="'
      +'position:relative;border-radius:14px;overflow:hidden;min-height:240px;'
      +'display:flex;flex-direction:column;justify-content:flex-end;padding:20px;'
      +'text-decoration:none;'
      +(img?'background:url(\''+img+'\') center/cover;':'background:linear-gradient(135deg,#0f172a,#1a0a2e);')
      +'box-shadow:0 4px 20px rgba(0,0,0,0.18);transition:transform 0.22s,box-shadow 0.22s;" '
      +'onmouseover="this.style.transform=\'translateY(-4px)\';this.style.boxShadow=\'0 14px 36px rgba(0,0,0,0.28)\'" '
      +'onmouseout="this.style.transform=\'\';this.style.boxShadow=\'0 4px 20px rgba(0,0,0,0.18)\'">' 
      +'<div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.93) 0%,rgba(0,0,0,0.38) 55%,rgba(0,0,0,0.06) 100%);border-radius:14px;"></div>'
      +'<div style="position:relative;z-index:1;display:flex;flex-direction:column;gap:8px;">'
        +'<span style="background:#b8860b;color:#fff;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;padding:3px 10px;border-radius:4px;width:fit-content;">Opinião</span>'
        +'<h2 style="font-size:16px;font-weight:800;color:#fff;margin:0;line-height:1.3;text-shadow:0 2px 10px rgba(0,0,0,0.7);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">'+escHtml(p.titulo)+'</h2>'
        +'<span style="font-size:11px;color:rgba(255,255,255,0.5);">Redação OVC · '+dataBr(p.data)+'</span>'
      +'</div>'
    +'</a>';
  }

  function smallCard(p){
    var url = buildUrl(p);
    var img = p.imagem && imgOk(p.imagem) ? p.imagem : '';
    return '<a href="'+url+'" style="'
      +'display:flex;gap:12px;align-items:flex-start;padding:12px 14px;'
      +'text-decoration:none;border-radius:10px;transition:background 0.18s;" '
      +'onmouseover="this.style.background=\'#f8f7f3\'" '
      +'onmouseout="this.style.background=\'\'">'
      +(img
        ?'<div style="width:68px;height:52px;border-radius:7px;overflow:hidden;flex-shrink:0;">'
          +'<img src="'+img+'" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" onerror="this.parentNode.style.display=\'none\';" >'
          +'</div>'
        :'<div style="width:3px;height:40px;background:#b8860b;border-radius:2px;flex-shrink:0;margin-top:3px;"></div>'
      )
      +'<div style="display:flex;flex-direction:column;gap:4px;min-width:0;">'
        +'<span style="background:rgba(184,134,11,0.12);color:#92670a;font-size:8px;font-weight:900;text-transform:uppercase;padding:2px 7px;border-radius:3px;width:fit-content;">Opinião</span>'
        +'<p style="font-size:12px;font-weight:700;color:#0f172a;margin:0;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">'+escHtml(p.titulo)+'</p>'
        +'<span style="font-size:10px;color:#94a3b8;">'+dataBr(p.data)+'</span>'
      +'</div>'
    +'</a>';
  }

  function carregarColunistas(){
    var container = document.getElementById('ovc-cards-section');
    if(!container || document.getElementById('ovc-colunistas-346')) return;

    fetch('/api/portal-posts?categoria=vc&limit=6')
      .then(function(r){ return r.json(); })
      .then(function(data){
        var posts = (data.posts||[]).filter(function(p){ return p.titulo; }).slice(0,6);
        if(!posts.length) return;

        var sec = document.createElement('section');
        sec.id  = 'ovc-colunistas-346';
        sec.setAttribute('aria-label','Colunistas & Opinião OVC');
        sec.style.cssText = 'margin:0 0 36px 0;';

        var big   = posts.slice(0,3);
        var small = posts.slice(3,6);

        var html = '<div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">'
          +'<div style="width:4px;height:26px;background:#b8860b;border-radius:2px;flex-shrink:0;"></div>'
          +'<div>'
            +'<div style="font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:.12em;color:#0f172a;line-height:1;">Colunistas & Opinião</div>'
            +'<div style="font-size:10px;color:#94a3b8;font-weight:500;margin-top:2px;">Análise, crônica e opinião autoral</div>'
          +'</div>'
          +'<span style="flex:1;height:1px;background:linear-gradient(to right,#b8860b44,transparent);"></span>'
          +'<a href="/vc/" style="font-size:11px;color:#b8860b;font-weight:700;text-decoration:none;white-space:nowrap;border:1px solid #b8860b33;padding:5px 12px;border-radius:6px;">Ver todos →</a>'
          +'</div>';

        html += '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-bottom:12px;">';
        html += big.map(bigCard).join('');
        html += '</div>';

        if(small.length){
          html += '<div style="background:#fff;border:1px solid #f0ede4;border-radius:12px;overflow:hidden;">';
          html += '<div style="display:grid;grid-template-columns:repeat('+Math.min(small.length,3)+',minmax(0,1fr));">';
          small.forEach(function(p,i){
            html += '<div style="'+(i>0?'border-left:1px solid #f0ede4;':'')+'">'+ smallCard(p)+'</div>';
          });
          html += '</div></div>';
        }

        sec.innerHTML = html;
        container.parentNode.insertBefore(sec, container);
      })
      .catch(function(){});
  }

  document.addEventListener('DOMContentLoaded', function(){
    load();
    setInterval(load, 120000);
    injetarMenuProfissoes();
    carregarMaisLidas();
    carregarOvcTv();
    carregarColunistas();
    // Carrega sistema de banners Lions na home
    if(!document.getElementById('ovc-banner-home')){
      var bs = document.createElement('script');
      bs.src = '/js/banners.js';
      document.head.appendChild(bs);
    }
  });

  function carregarMaisLidas(){
    var sec = document.getElementById('ovc-mais-lidas-home');
    if(!sec) return;
    fetch('/api/portal-posts?sort=popular&limit=10')
      .then(function(r){ return r.json(); })
      .then(function(d){
        var posts = (d.posts||[]).slice(0,8);
        if(!posts.length){ sec.style.display='none'; return; }
        var CORES={politica:'#dc2626',economia:'#2563eb',negocios:'#7c3aed',investimentos:'#059669',mercados:'#0891b2',tributacao:'#b45309',regulacao:'#9333ea',seguros:'#0284c7',saude:'#16a34a',familia:'#db2777',tecnologia:'#6366f1',industria:'#ea580c',educacao:'#8b5cf6',esportes:'#16a34a',internacional:'#dc2626',variedades:'#ec4899',parcerias:'#14b8a6',vc:'#ffc800',investigativo:'#7f1d1d',seguranca:'#7f1d1d',cultura:'#7e22ce',profissoes:'#0369a1',vagas:'#065f46',concursos:'#1e40af',imoveis:'#b45309',esg:'#166534',defesa:'#1e3a5f',religiao:'#6d28d9'};
        var LABELS={politica:'Política',economia:'Economia',negocios:'Negócios',investimentos:'Investimentos',mercados:'Mercados',tributacao:'Tributação',regulacao:'Regulação',seguros:'Seguros',saude:'Saúde',familia:'Família',tecnologia:'Tecnologia',industria:'Indústria',educacao:'Educação',esportes:'Esportes',internacional:'Internacional',variedades:'Variedades',parcerias:'Parcerias',vc:'OVC',investigativo:'Investigativo',seguranca:'Seg. Pública',cultura:'Cultura',profissoes:'Profissões',vagas:'Vagas',concursos:'Concursos',imoveis:'Imóveis',esg:'ESG',defesa:'Defesa',religiao:'Fé & Espiritualidade'};
        function c(cat){ return CORES[cat]||'#64748b'; }
        function lbl(cat){ return LABELS[cat]||cat; }
        function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
        var html='<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">'
          +'<span style="background:#e11d48;color:#fff;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;padding:5px 14px;border-radius:4px;">Mais Lidas</span>'
          +'<span style="flex:1;height:2px;background:linear-gradient(to right,#e11d48,transparent);border-radius:2px;"></span>'
          +'<a href="/busca/" style="font-size:12px;color:#64748b;text-decoration:none;font-weight:600;">Ver todas &rarr;</a>'
          +'</div>';
        html+='<div style="display:grid;grid-template-columns:repeat('+posts.length+',minmax(0,1fr));gap:10px;">';
        posts.forEach(function(p,i){
          var cor=c(p.categoria);
          html+='<a href="'+buildUrl(p)+'" style="display:flex;flex-direction:column;text-decoration:none;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.10);transition:transform 0.18s,box-shadow 0.18s;" onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 6px 20px rgba(0,0,0,0.16)\'" onmouseout="this.style.transform=\'\';this.style.boxShadow=\'0 2px 8px rgba(0,0,0,0.10)\'">';
          html+='<div style="position:relative;height:90px;background:'+(p.imagem?'#0f172a':cor)+';flex-shrink:0;overflow:hidden;">';
          if(p.imagem) html+='<img src="'+p.imagem+'" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" onerror="this.parentNode.style.background=\''+cor+'\';this.remove();">';
          html+='<div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 55%);pointer-events:none;"></div>';
          html+='<div style="position:absolute;top:6px;left:6px;"><span style="'+(i===0?'background:#e11d48;font-size:10px;':'background:rgba(0,0,0,0.6);font-size:9px;')+'color:#fff;font-weight:900;padding:2px 7px;border-radius:4px;">#'+(i+1)+'</span></div>';
          html+='</div><div style="flex:1;background:#fff;padding:8px 10px;display:flex;flex-direction:column;gap:4px;">';
          html+='<span style="font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:'+cor+';">'+lbl(p.categoria)+'</span>';
          html+='<p style="font-size:11px;font-weight:700;color:#0f172a;margin:0;line-height:1.3;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">'+esc(p.titulo)+'</p>';
          html+='</div></a>';
        });
        html+='</div>';
        sec.innerHTML=html; sec.style.display='block';
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
        if(!document.getElementById('ovc-pulse-style')){
          var st=document.createElement('style'); st.id='ovc-pulse-style';
          st.textContent='@keyframes ovc-pulse{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.4)}70%{box-shadow:0 0 0 8px rgba(34,197,94,0)}}'; document.head.appendChild(st);
        }
        sec.innerHTML='<div style="background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%);border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.25);">'
          +'<div style="display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid rgba(255,255,255,0.08);">'
            +'<div style="display:flex;align-items:center;gap:12px;"><span style="background:#e11d48;color:#fff;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;padding:6px 14px;border-radius:6px;">OVC TV</span>'
            +'<div style="display:flex;align-items:center;gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:#22c55e;display:inline-block;animation:ovc-pulse 2s infinite;"></span><span style="font-size:12px;color:rgba(255,255,255,0.6);font-weight:500;">AO VIVO</span></div></div>'
            +'<span style="font-size:11px;color:rgba(255,255,255,0.3);">Transmissão integrada &bull; O Valor Capital</span>'
          +'</div><div style="position:relative;padding-bottom:42.86%;height:0;overflow:hidden;">'
          +'<iframe style="position:absolute;top:0;left:0;width:100%;height:100%;" src="'+ytUrl+'" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;picture-in-picture" allowfullscreen loading="lazy"></iframe>'
          +'</div></div>';
        sec.style.display='block';
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
    if (maisItem) { var profLink = maisItem.querySelector('a[href="/profissoes/"]'); if (profLink) profLink.remove(); }
    var profItem = document.createElement('div');
    profItem.className = 'supermenu-item';
    profItem.innerHTML = '<a class="label" href="/profissoes/">Profissões</a><div class="submenu">'
      +'<div class="submenu-title">Saúde</div><a href="/profissoes/medicina/">Medicina</a><a href="/profissoes/enfermagem/">Enfermagem</a><a href="/profissoes/odontologia/">Odontologia</a><a href="/profissoes/farmacia/">Farmácia</a><a href="/profissoes/psicologia/">Psicologia</a><a href="/profissoes/fisioterapia/">Fisioterapia</a><a href="/profissoes/nutricao/">Nutrição</a><a href="/profissoes/veterinaria/">Med. Veterinária</a><a href="/profissoes/biomedicina/">Biomedicina</a><a href="/profissoes/fonoaudiologia/">Fonoaudiologia</a>'
      +'<div class="submenu-title">Jurídico &amp; Finanças</div><a href="/profissoes/direito/">Direito &amp; Advocacia</a><a href="/profissoes/contabilidade/">Contabilidade</a><a href="/profissoes/administracao/">Administração</a><a href="/profissoes/economia/">Economia</a><a href="/profissoes/auditoria/">Auditoria &amp; Compliance</a>'
      +'<div class="submenu-title">Engenharia &amp; TI</div><a href="/profissoes/engenharia-civil/">Eng. Civil &amp; Construção</a><a href="/profissoes/arquitetura/">Arquitetura &amp; Urbanismo</a><a href="/profissoes/engenharia-eletrica/">Eng. Elétrica &amp; Eletrônica</a><a href="/profissoes/engenharia-quimica/">Eng. Química &amp; Materiais</a><a href="/profissoes/ti/">TI &amp; Programação</a><a href="/profissoes/agronomia/">Agronomia &amp; Agro</a>'
      +'<div class="submenu-title">Comunicação &amp; Educação</div><a href="/profissoes/jornalismo/">Jornalismo</a><a href="/profissoes/publicidade/">Publicidade &amp; Propaganda</a><a href="/profissoes/relacoes-publicas/">Relações Públicas</a><a href="/profissoes/pedagogia/">Pedagogia &amp; Docência</a><a href="/profissoes/rh/">Recursos Humanos</a><a href="/profissoes/servico-social/">Serviço Social</a>'
      +'</div>';
    if (maisItem) nav.insertBefore(profItem, maisItem);
    else nav.appendChild(profItem);
  }
})();
