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
    { id:'vc',           label:'Colunistas OVC',  path:'/colunistas/',  cats:['vc','colunistas'] }
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
      vc:'colunistas', colunistas:'colunistas', internacional:'internacional', variedades:'variedades', geral:'politica',
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


// ── NOVO MIOLO OVC — LAYOUT COM GRANDEZA ─────────────────────────────────────
// Substitui buildSection() e load() do ovc-cards.js
// Preserva: rotação, renderCard, buildUrl, imgOk, dataBr, escHtml, STYLE, CATS
// Blocos: A (grade 3), B (pilulas), C (assimétrico), D (mini 4), E (full-width)

// ── ESTILOS DO NOVO MIOLO ────────────────────────────────────────────────────
function injetarEstilosMiolo(){
  if(document.getElementById('ovc-miolo-style')) return;
  var st = document.createElement('style');
  st.id = 'ovc-miolo-style';
  st.textContent = [
    '.ovc-miolo{display:flex;flex-direction:column;gap:0;width:100%;}',
    '.ovc-bloco{margin-bottom:40px;}',
    '.ovc-bloco:last-child{margin-bottom:0;}',

    /* Bloco A — grade 3, cards com imagem sobre fundo branco */
    '.ovc-grade-3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;width:100%;}',

    /* Card padrão — imagem com overlay, mantém visual atual mas com mais altura */
    '.ovc-cat-card{position:relative;border-radius:14px;overflow:hidden;min-height:240px;',
    'display:flex;flex-direction:column;justify-content:flex-end;padding:18px;',
    'background:#1a1a2e;background-size:cover;background-position:center;',
    'box-shadow:0 2px 12px rgba(0,0,0,0.10);transition:transform 0.22s,box-shadow 0.22s;cursor:pointer;}',
    '.ovc-cat-card:hover{transform:translateY(-4px);box-shadow:0 10px 32px rgba(0,0,0,0.18);}',

    /* Separador */
    '.ovc-sep{height:1px;background:#e8eaed;margin:0 0 40px;}',

    /* Bloco B — faixa pílulas: fundo branco, borda sutil */
    '.ovc-faixa-pilulas{background:#fff;border:1px solid #e2e5ea;',
    'border-radius:12px;padding:16px 18px;width:100%;}',
    '.ovc-pilulas-header{display:flex;align-items:center;gap:10px;margin-bottom:16px;',
    'border-bottom:1px solid #f0f2f5;padding-bottom:10px;}',
    '.ovc-pilulas-dot{width:7px;height:7px;border-radius:50%;background:#c81e1e;',
    'animation:ovc-pulse-dot 1.6s infinite;}',
    '@keyframes ovc-pulse-dot{0%,100%{opacity:1}50%{opacity:.35}}',
    '.ovc-pilulas-label{font-size:10px;letter-spacing:.12em;text-transform:uppercase;',
    'color:#c81e1e;font-weight:700;font-family:inherit;}',
    '.ovc-pilulas-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:0;width:100%;}',
    '.ovc-pilula-item{padding:0 8px;border-right:1px solid #f0f2f5;min-width:0;overflow:hidden;word-break:break-word;}',
    '.ovc-pilula-item:first-child{padding-left:0;}',
    '.ovc-pilula-item:last-child{border-right:none;}',
    '.ovc-pilula-cat{font-size:9px;letter-spacing:.1em;text-transform:uppercase;',
    'font-weight:700;margin-bottom:5px;font-family:inherit;}',
    '.ovc-pilula-texto{font-size:11px;color:#1a1a2e;line-height:1.45;font-weight:500;max-width:100%;',
    'font-family:inherit;display:-webkit-box;-webkit-line-clamp:3;',
    '-webkit-box-orient:vertical;overflow:hidden;}',
    '.ovc-pilula-hora{font-size:10px;color:#9aa0ab;margin-top:5px;font-family:inherit;}',
    '.ovc-pilula-link{text-decoration:none;display:block;}',
    '.ovc-pilula-link:hover .ovc-pilula-texto{color:#c81e1e;}',

    /* Bloco C — assimétrico */
    '.ovc-grade-assimetrica{display:grid;grid-template-columns:1.65fr 1fr;gap:22px;width:100%;}',
    '.ovc-card-grande{border-radius:14px;overflow:hidden;min-height:280px;',
    'position:relative;display:flex;flex-direction:column;justify-content:flex-end;',
    'padding:24px;background:#1a1a2e;background-size:cover;background-position:center;',
    'box-shadow:0 2px 12px rgba(0,0,0,0.10);transition:transform 0.22s,box-shadow 0.22s;cursor:pointer;}',
    '.ovc-card-grande:hover{transform:translateY(-4px);box-shadow:0 12px 36px rgba(0,0,0,0.18);}',
    '.ovc-card-grande .ovc-card-title-g{font-size:17px;font-weight:800;color:#fff;',
    'line-height:1.35;text-shadow:0 2px 10px rgba(0,0,0,0.8);margin:0;',
    'display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}',
    '.ovc-pilha{display:flex;flex-direction:column;gap:16px;}',

    /* Card horizontal (Bloco C pilha) — BRANCO */
    '.ovc-card-horizontal{background:#fff;border-radius:12px;overflow:hidden;',
    'display:grid;grid-template-columns:96px 1fr;gap:0;cursor:pointer;',
    'border:1px solid #e2e5ea;',
    'box-shadow:0 1px 6px rgba(0,0,0,0.06);transition:transform 0.2s,box-shadow 0.2s;}',
    '.ovc-card-horizontal:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,0.12);}',
    '.ovc-card-h-img{width:96px;min-height:96px;background-size:cover;background-position:center;background-color:#e8eaed;flex-shrink:0;}',
    '.ovc-card-h-body{padding:12px 14px;display:flex;flex-direction:column;gap:4px;justify-content:center;}',
    '.ovc-card-h-cat{font-size:9px;letter-spacing:.09em;text-transform:uppercase;font-weight:700;font-family:inherit;}',
    '.ovc-card-h-titulo{font-size:12px;font-weight:700;color:#0f172a;line-height:1.45;',
    'font-family:inherit;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}',
    '.ovc-card-h-meta{font-size:10px;color:#9aa0ab;font-family:inherit;}',

    /* Bloco D — 4 mini cards BRANCOS */
    '.ovc-grade-4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;width:100%;}',
    '.ovc-mini-card{background:#fff;border-radius:11px;overflow:hidden;',
    'border:1px solid #e2e5ea;',
    'box-shadow:0 1px 6px rgba(0,0,0,0.06);transition:transform 0.2s,box-shadow 0.2s;cursor:pointer;text-decoration:none;display:block;}',
    '.ovc-mini-card:hover{transform:translateY(-3px);box-shadow:0 8px 22px rgba(0,0,0,0.12);}',
    '.ovc-mini-img{width:100%;aspect-ratio:4/3;background-size:cover;background-position:center;background-color:#e8eaed;}',
    '.ovc-mini-body{padding:10px 12px 14px;}',
    '.ovc-mini-cat{font-size:9px;letter-spacing:.09em;text-transform:uppercase;font-weight:700;font-family:inherit;margin-bottom:5px;}',
    '.ovc-mini-titulo{font-size:12px;font-weight:700;color:#0f172a;line-height:1.42;font-family:inherit;',
    'display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}',

    /* Bloco E — editorial full width BRANCO */
    '.ovc-card-editorial{background:#fff;border-radius:16px;overflow:hidden;',
    'display:grid;grid-template-columns:1fr 1fr;width:100%;',
    'border:1px solid #e2e5ea;',
    'box-shadow:0 2px 14px rgba(0,0,0,0.07);transition:box-shadow 0.22s;cursor:pointer;text-decoration:none;display:grid;}',
    '.ovc-card-editorial:hover{box-shadow:0 12px 48px rgba(0,0,0,0.14);}',
    '.ovc-editorial-img{min-height:260px;background-size:cover;background-position:center;background-color:#e8eaed;}',
    '.ovc-editorial-body{padding:36px 40px;display:flex;flex-direction:column;justify-content:center;gap:14px;}',
    '.ovc-editorial-cat{font-size:9px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;font-family:inherit;}',
    '.ovc-editorial-titulo{font-size:22px;font-weight:800;color:#0f172a;line-height:1.32;font-family:inherit;}',
    '.ovc-editorial-desc{font-size:13px;color:#64748b;line-height:1.75;font-family:inherit;}',
    '.ovc-editorial-leia{font-size:11px;letter-spacing:.1em;text-transform:uppercase;',
    'font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:5px;}',
    '.ovc-editorial-leia:hover{text-decoration:underline;}',
  ].join('');
  document.head.appendChild(st);
}

// ── RENDERIZAÇÃO DOS BLOCOS ───────────────────────────────────────────────────

function renderBlocoA(posts, cats3){
  // Grade 3 colunas — usa os cards existentes com novo gap
  var bloco = document.createElement('div');
  bloco.className = 'ovc-bloco';
  var grade = document.createElement('div');
  grade.className = 'ovc-grade-3';
  cats3.forEach(function(cat){
    var card = buildCard(cat);
    grade.appendChild(card);
  });
  bloco.appendChild(grade);
  return bloco;
}

function renderBlocoB(posts){
  // Faixa de pílulas — 4 posts mais recentes sem imagem ou qualquer tipo
  var bloco = document.createElement('div');
  bloco.className = 'ovc-bloco';
  var faixa = document.createElement('div');
  faixa.className = 'ovc-faixa-pilulas';
  faixa.innerHTML =
    '<div class="ovc-pilulas-header">'
    +'<span class="ovc-pilulas-dot"></span>'
    +'<span class="ovc-pilulas-label">Notas do dia</span>'
    +'</div>'
    +'<div class="ovc-pilulas-grid" id="ovc-pilulas-grid"></div>';
  bloco.appendChild(faixa);
  // Preencher após load
  bloco._posts = posts;
  return bloco;
}

function preencherBlocoB(bloco, posts){
  var grid = bloco.querySelector('#ovc-pilulas-grid');
  if(!grid) return;
  // Selecionar 4 posts com categorias todas diferentes entre si
  var usados = [];
  var catsUsadas = {};
  var tentativas = posts.slice(0, 40);
  for(var i=0; i<tentativas.length && usados.length<6; i++){
    var p = tentativas[i];
    var cat = p.categoria || 'geral';
    if(!catsUsadas[cat]){
      usados.push(p);
      catsUsadas[cat] = true;
    }
  }
  // Se não conseguiu 4 com categorias únicas, completa com posts não usados ainda
  if(usados.length < 4){
    for(var j=0; j<tentativas.length && usados.length<6; j++){
      if(usados.indexOf(tentativas[j]) === -1) usados.push(tentativas[j]);
    }
  }
  if(!usados.length){
    bloco.style.display='none';
    return;
  }
  grid.innerHTML = '';
  usados.forEach(function(p){
    var url = buildUrl(p);
    var cor = CORES_CAT[p.categoria] || '#c81e1e';
    var hora = p.data ? new Date(p.data).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : '';
    var item = document.createElement('a');
    item.className = 'ovc-pilula-link';
    item.href = url;
    item.innerHTML =
      '<div class="ovc-pilula-cat" style="color:'+cor+'">'+escHtml(p.categoria||'')+'</div>'
      +'<div class="ovc-pilula-texto">'+escHtml(p.titulo||'')+'</div>'
      +(hora?'<div class="ovc-pilula-hora">'+hora+'</div>':'');
    var wrapper = document.createElement('div');
    wrapper.className = 'ovc-pilula-item';
    wrapper.appendChild(item);
    grid.appendChild(wrapper);
  });
}

function renderBlocoC(catGrande, catsPilha){
  // 1 card grande + 2 horizontais empilhados
  var bloco = document.createElement('div');
  bloco.className = 'ovc-bloco';
  var grade = document.createElement('div');
  grade.className = 'ovc-grade-assimetrica';

  // Card grande
  var grande = document.createElement('article');
  grande.className = 'ovc-card-grande';
  grande.id = 'ovc-cat-' + catGrande.id;
  var overlayG = document.createElement('div');
  overlayG.style.cssText = 'position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.30) 55%,rgba(0,0,0,0.04) 100%);border-radius:inherit;pointer-events:none;z-index:0;';
  var innerG = document.createElement('div');
  innerG.style.cssText = 'position:relative;z-index:1;display:flex;flex-direction:column;gap:7px;';
  var tagG = document.createElement('span');
  tagG.className = 'ovc-card-tag';
  tagG.style.cssText = STYLE.tag;
  tagG.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:#ffc800;display:inline-block;flex-shrink:0;"></span>' + catGrande.label;
  var titleG = document.createElement('h2');
  titleG.className = 'ovc-card-title ovc-card-title-g';
  titleG.textContent = '';
  var metaG = document.createElement('div');
  metaG.className = 'ovc-card-meta';
  metaG.style.cssText = STYLE.meta;
  metaG.textContent = 'Redação OVC';
  var ctaG = document.createElement('a');
  ctaG.className = 'ovc-card-cta';
  ctaG.href = catGrande.path;
  ctaG.style.cssText = STYLE.cta;
  ctaG.textContent = 'LEIA MAIS';
  innerG.appendChild(tagG); innerG.appendChild(titleG); innerG.appendChild(metaG); innerG.appendChild(ctaG);
  grande.appendChild(overlayG); grande.appendChild(innerG);
  grande.addEventListener('mouseenter', function(){ this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 36px rgba(0,0,0,0.30)'; });
  grande.addEventListener('mouseleave', function(){ this.style.transform=''; this.style.boxShadow='0 2px 14px rgba(0,0,0,0.18)'; });
  grade.appendChild(grande);

  // Pilha de 2 horizontais
  var pilha = document.createElement('div');
  pilha.className = 'ovc-pilha';
  catsPilha.forEach(function(cat){
    var card = document.createElement('a');
    card.className = 'ovc-card-horizontal';
    card.href = cat.path;
    card.id = 'ovc-cat-' + cat.id;
    var cor = CORES_CAT[cat.id] || '#64748b';
    card.innerHTML =
      '<div class="ovc-card-h-img" id="ovc-h-img-'+cat.id+'" style="background-color:#1a1a2e;"></div>'
      +'<div class="ovc-card-h-body">'
      +'<div class="ovc-card-h-cat" style="color:'+cor+'">'+escHtml(cat.label)+'</div>'
      +'<div class="ovc-card-h-titulo ovc-card-title" id="ovc-h-titulo-'+cat.id+'">Carregando...</div>'
      +'<div class="ovc-card-h-meta ovc-card-meta" id="ovc-h-meta-'+cat.id+'">Redação OVC</div>'
      +'</div>';
    pilha.appendChild(card);
  });
  grade.appendChild(pilha);
  bloco.appendChild(grade);
  return bloco;
}

function renderBlocoD(cats4){
  // 4 mini cards
  var bloco = document.createElement('div');
  bloco.className = 'ovc-bloco';
  var grade = document.createElement('div');
  grade.className = 'ovc-grade-4';
  cats4.forEach(function(cat){
    var cor = CORES_CAT[cat.id] || '#64748b';
    var card = document.createElement('a');
    card.className = 'ovc-mini-card';
    card.href = cat.path;
    card.id = 'ovc-cat-' + cat.id;
    card.innerHTML =
      '<div class="ovc-mini-img" id="ovc-mini-img-'+cat.id+'"></div>'
      +'<div class="ovc-mini-body">'
      +'<div class="ovc-mini-cat" style="color:'+cor+'">'+escHtml(cat.label)+'</div>'
      +'<div class="ovc-mini-titulo ovc-card-title" id="ovc-mini-titulo-'+cat.id+'">Carregando...</div>'
      +'</div>';
    card.addEventListener('mouseenter', function(){ this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 22px rgba(0,0,0,0.24)'; });
    card.addEventListener('mouseleave', function(){ this.style.transform=''; this.style.boxShadow='0 2px 10px rgba(0,0,0,0.14)'; });
    grade.appendChild(card);
  });
  bloco.appendChild(grade);
  return bloco;
}

function renderBlocoE(cat){
  // Full width editorial
  var bloco = document.createElement('div');
  bloco.className = 'ovc-bloco';
  var cor = CORES_CAT[cat.id] || '#c81e1e';
  var card = document.createElement('a');
  card.className = 'ovc-card-editorial';
  card.href = cat.path;
  card.id = 'ovc-cat-' + cat.id;
  card.innerHTML =
    '<div class="ovc-editorial-img" id="ovc-e-img-'+cat.id+'"></div>'
    +'<div class="ovc-editorial-body">'
    +'<div class="ovc-editorial-cat" style="color:'+cor+'">'+escHtml(cat.label)+'</div>'
    +'<h2 class="ovc-editorial-titulo ovc-card-title" id="ovc-e-titulo-'+cat.id+'">Carregando...</h2>'
    +'<p class="ovc-editorial-desc ovc-card-meta" id="ovc-e-meta-'+cat.id+'">Redação OVC</p>'
    +'<span class="ovc-editorial-leia" style="color:'+cor+'">Ler análise completa <span>→</span></span>'
    +'</div>';
  bloco.appendChild(card);
  return bloco;
}

// ── NOVA buildSection ────────────────────────────────────────────────────────
function buildSection(container){
  injetarEstilosMiolo();
  var miolo = document.createElement('div');
  miolo.className = 'ovc-miolo';

  // Distribuição das categorias nos blocos
  // CATS array tem 32 categorias — distribuímos estrategicamente

  var blocoACats1 = CATS.slice(0,3);   // Política, Economia, Internacional
  var blocoBPosts = [];                 // Pílulas — preenchido após fetch
  var bloCACatGrande = CATS[3];        // Investigativo (grande)
  var blocoCCatsPilha = [CATS[4], CATS[5]]; // Negócios, Investimentos
  var blocoACats2 = CATS.slice(6,9);   // Mercados, Seguros, Tributos
  var blocoDCats = CATS.slice(9,13);   // Tecnologia, Indústria, Regulação, Saúde
  var blocoECat = CATS[13];            // Educação (editorial)
  var blocoACats3 = CATS.slice(14,17); // Esportes, Seg Pública, Família
  var blocoACats4 = CATS.slice(17,20); // Cultura, Variedades, Profissões

  // Montar sequência: A → B → A → C → sep → A → D → sep → E → A → A
  var bA1 = renderBlocoA([], blocoACats1);
  var bB  = renderBlocoB([]);
  var sep1 = document.createElement('div'); sep1.className='ovc-sep';
  var bA2 = renderBlocoA([], blocoACats2);
  var bC  = renderBlocoC(bloCACatGrande, blocoCCatsPilha);
  var sep2 = document.createElement('div'); sep2.className='ovc-sep';
  var bD  = renderBlocoD(blocoDCats);
  var sep3 = document.createElement('div'); sep3.className='ovc-sep';
  var bE  = renderBlocoE(blocoECat);
  var bA3 = renderBlocoA([], blocoACats3);
  var bA4 = renderBlocoA([], blocoACats4);

  miolo.appendChild(bB);
  miolo.appendChild(sep1);
  miolo.appendChild(bA1);
  miolo.appendChild(bC);
  miolo.appendChild(bA2);
  miolo.appendChild(sep2);
  miolo.appendChild(bD);
  miolo.appendChild(sep3);
  miolo.appendChild(bE);
  miolo.appendChild(bA3);
  miolo.appendChild(bA4);

  container.appendChild(miolo);
  container._blocoB = bB;
}

// ── NOVA load() ──────────────────────────────────────────────────────────────
function load(){
  var container = document.getElementById('ovc-cards-section');
  if(!container) return;
  if(!container.querySelector('.ovc-miolo')) buildSection(container);

  var fetchPosts = window.__OVC_CACHE__?.recentes
    || fetch('/api/portal-posts?recentes=true&limit=300').then(function(r){ return r.json(); });

  fetchPosts.then(function(data){
    var cache = {};
    (data.posts||[]).forEach(function(p){
      if(!cache[p.categoria]) cache[p.categoria] = [];
      cache[p.categoria].push(p);
    });

    // Preencher cards normais (grade A) — rotação existente
    CATS.forEach(function(item){
      var el = document.getElementById('ovc-cat-'+item.id);
      if(!el) return;

      // Verificar se é card horizontal (Bloco C pilha)
      if(el.classList.contains('ovc-card-horizontal')){
        var posts = [];
        item.cats.forEach(function(c){ posts=posts.concat(cache[c]||[]); });
        posts.sort(function(a,b){ return (imgOk(a.imagem)?0:1)-(imgOk(b.imagem)?0:1); });
        if(!posts.length) return;
        var p = posts[0];
        var url = buildUrl(p);
        el.href = url;
        var imgEl = document.getElementById('ovc-h-img-'+item.id);
        if(imgEl && imgOk(p.imagem)){
          imgEl.style.backgroundImage = 'url(\''+p.imagem+'\')';
        }
        var tituloEl = document.getElementById('ovc-h-titulo-'+item.id);
        if(tituloEl) tituloEl.textContent = p.titulo||'';
        var metaEl = document.getElementById('ovc-h-meta-'+item.id);
        if(metaEl) metaEl.textContent = 'Redação OVC · '+dataBr(p.data);
        return;
      }

      // Verificar se é mini card (Bloco D)
      if(el.classList.contains('ovc-mini-card')){
        var posts2 = [];
        item.cats.forEach(function(c){ posts2=posts2.concat(cache[c]||[]); });
        posts2.sort(function(a,b){ return (imgOk(a.imagem)?0:1)-(imgOk(b.imagem)?0:1); });
        if(!posts2.length) return;
        var p2 = posts2[0];
        var url2 = buildUrl(p2);
        el.href = url2;
        var imgEl2 = document.getElementById('ovc-mini-img-'+item.id);
        if(imgEl2 && imgOk(p2.imagem)){
          imgEl2.style.backgroundImage = 'url(\''+p2.imagem+'\')';
        }
        var tituloEl2 = document.getElementById('ovc-mini-titulo-'+item.id);
        if(tituloEl2) tituloEl2.textContent = p2.titulo||'';
        return;
      }

      // Verificar se é card editorial (Bloco E)
      if(el.classList.contains('ovc-card-editorial')){
        var posts3 = [];
        item.cats.forEach(function(c){ posts3=posts3.concat(cache[c]||[]); });
        posts3.sort(function(a,b){ return (imgOk(a.imagem)?0:1)-(imgOk(b.imagem)?0:1); });
        if(!posts3.length) return;
        var p3 = posts3[0];
        var url3 = buildUrl(p3);
        el.href = url3;
        var imgEl3 = document.getElementById('ovc-e-img-'+item.id);
        if(imgEl3 && imgOk(p3.imagem)){
          imgEl3.style.backgroundImage = 'url(\''+p3.imagem+'\')';
        }
        var tituloEl3 = document.getElementById('ovc-e-titulo-'+item.id);
        if(tituloEl3) tituloEl3.textContent = p3.titulo||'';
        var metaEl3 = document.getElementById('ovc-e-meta-'+item.id);
        if(metaEl3) metaEl3.textContent = 'Redação OVC · '+dataBr(p3.data);
        return;
      }

      // Card grande (Bloco C)
      if(el.classList.contains('ovc-card-grande')){
        var posts4 = [];
        item.cats.forEach(function(c){ posts4=posts4.concat(cache[c]||[]); });
        posts4.sort(function(a,b){ return (imgOk(a.imagem)?0:1)-(imgOk(b.imagem)?0:1); });
        if(!posts4.length){ mostrarVazio(el, item.id); return; }
        var overlap4 = item.cats.some(function(c){ return CATS_DESTAQUE.indexOf(c)!==-1; });
        startRotation(el, posts4, item.id, overlap4&&posts4.length>1?1:0);
        return;
      }

      // Card padrão Bloco A — rotação existente
      var posts5 = [];
      item.cats.forEach(function(c){ posts5=posts5.concat(cache[c]||[]); });
      posts5.sort(function(a,b){ return (imgOk(a.imagem)?0:1)-(imgOk(b.imagem)?0:1); });
      if(!posts5.length){ mostrarVazio(el, item.id); return; }
      var overlap5 = item.cats.some(function(c){ return CATS_DESTAQUE.indexOf(c)!==-1; });
      startRotation(el, posts5, item.id, overlap5&&posts5.length>1?1:0);
    });

    // Preencher Bloco B — pílulas (posts mais recentes de qualquer categoria)
    var bB = container._blocoB;
    if(bB){
      var todosPosts = (data.posts||[]).slice(0,8);
      preencherBlocoB(bB, todosPosts);
    }

  }).catch(function(){
    CATS.forEach(function(item){
      var el = document.getElementById('ovc-cat-'+item.id);
      if(el && el.classList.contains('ovc-cat-card')) mostrarVazio(el, item.id);
    });
  });
}


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
    // Skip on homepage — banners.js removes this block there causing double CLS
    if(location.pathname === '/' || location.pathname === '/index.html') return;

    (window.__OVC_CACHE__?.recentes || fetch('/api/portal-posts?recentes=true&limit=300').then(function(r){ return r.json(); }))
      .then(function(data){
        var posts = (data.posts||[]).filter(function(p){
          var cat = String(p.categoria||'').toLowerCase();
          var sub = String(p.subcategoria||'').toLowerCase();
          var method = String(p.publish_method||p.tipo||'').toLowerCase();
          return p.titulo && (cat==='colunistas' || cat==='vc' || sub.indexOf('colun')!==-1 || method.indexOf('colun')!==-1);
        }).slice(0,6);
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
            html += '<div style="'+(i>0?'border-left:1px solid #f0ede4;':'')+'">' + smallCard(p) + '</div>';
          });
          html += '</div></div>';
        }

        html = html.replace('href="/vc/"','href="/colunistas/"');
        sec.innerHTML = html;
        container.parentNode.insertBefore(sec, container);
      })
      .catch(function(){});
  }

  function injetarMenuColunistas(){
    var nav = document.querySelector('nav.supermenu');
    if(!nav || nav.querySelector('a[href="/colunistas/"]')) return;
    var item = document.createElement('div');
    item.className = 'supermenu-item';
    item.innerHTML = '<a class="label" href="/colunistas/">Colunistas</a><div class="submenu">'
      +'<div class="submenu-title">Opinião OVC</div>'
      +'<a href="/colunistas/">Todos os colunistas</a>'
      +'<a href="/colunistas/">Artigos e colunas</a>'
      +'</div>';
    var first = nav.querySelector('.supermenu-item');
    if(first && first.nextSibling) nav.insertBefore(item, first.nextSibling);
    else nav.appendChild(item);
  }

  function organizarRailsHome(){
    var right = document.querySelector('.rail-right');
    var left = document.querySelector('.rail-left');
    var tv = document.querySelector('.rail-block-tv');
    if(right && tv && right.firstElementChild !== tv) right.insertBefore(tv, right.firstElementChild);

    if(!left) return;
    var investigativo = null;
    var rightBlocks = right ? right.querySelectorAll('.rail-block') : [];
    Array.prototype.forEach.call(rightBlocks, function(block){
      var title = block.querySelector('.rail-title');
      if(!investigativo && title && title.textContent.toLowerCase().indexOf('investigativo') !== -1) investigativo = block;
    });
    if(!investigativo) return;

    var atalhos = null;
    var leftBlocks = left.querySelectorAll('.rail-block');
    Array.prototype.forEach.call(leftBlocks, function(block){
      var title = block.querySelector('.rail-title');
      if(!atalhos && title && title.textContent.toLowerCase().indexOf('atalhos') !== -1) atalhos = block;
    });
    if(atalhos){
      investigativo.classList.add('rail-block-investigativo');
      investigativo.style.marginTop = '10px';
      left.insertBefore(investigativo, atalhos.nextSibling);
    }
  }

  function garantirRailColunistas(){
    var tv = document.querySelector('.rail-block-tv');
    if(!tv || !tv.parentNode) return null;
    var block = document.querySelector('[data-home-colunistas-rail]');
    if(!block){
      block = document.createElement('div');
      block.className = 'rail-block rail-block-colunistas';
      block.setAttribute('data-home-colunistas-rail','1');
      block.innerHTML = '<div class="rail-title">Colunistas OVC</div>'
        +'<div class="home-colunistas-rail-body" style="font-size:11px;color:#6b7280;">Carregando colunistas...</div>';
    }
    if(tv.nextElementSibling !== block) tv.parentNode.insertBefore(block, tv.nextSibling);
    return block.querySelector('.home-colunistas-rail-body');
  }

  function iniciais(nome){
    return String(nome||'OVC').trim().split(/\s+/).slice(0,2).map(function(p){ return p.charAt(0).toUpperCase(); }).join('');
  }

  function carregarRailColunistas(){
    var body = garantirRailColunistas();
    if(!body) return;
    fetch('/api/manage?action=list_colunistas')
      .then(function(r){ return r.json(); })
      .then(function(data){
        var list = Array.isArray(data) ? data : (data.colunistas || data.data || data.items || []);
        list = list.filter(function(c){ return c && c.ativo !== false && (c.nome || c.name); });
        if(!list.length) throw new Error('sem colunistas');
        var ordem = ['Roberto Terrasan','Beta Ferreira','Adriana Ferreira','Michele Froiz','Coluna OVC','Prof. Marcos Pizzolatto','Larissa Corvetto','Taísa da Fonseca','André Oliveira'];
        list.sort(function(a,b){
          var an = a.nome || a.name || '';
          var bn = b.nome || b.name || '';
          var ai = ordem.indexOf(an); if(ai === -1) ai = 99;
          var bi = ordem.indexOf(bn); if(bi === -1) bi = 99;
          return ai - bi || an.localeCompare(bn);
        });
        var html = '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;">';
        list.slice(0,9).forEach(function(c){
          var nome = c.nome || c.name || 'Colunista OVC';
          var foto = c.foto_url || c.photo_url || c.avatar_url || c.imagem || '';
          html += '<a href="/colunistas/" title="'+escHtml(nome)+'" style="display:flex;flex-direction:column;align-items:center;gap:5px;text-decoration:none;color:#0f172a;min-width:0;">';
          if(foto){
            html += '<img src="'+foto+'" alt="'+escHtml(nome)+'" loading="lazy" style="width:42px;height:42px;border-radius:8px;object-fit:cover;object-position:center top;display:block;border:1px solid #e5e7eb;background:#111827;" onerror="this.outerHTML=\'<span style=&quot;width:42px;height:42px;border-radius:8px;background:#101827;color:#d4af37;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;&quot;>'+iniciais(nome)+'</span>\';">';
          } else {
            html += '<span style="width:42px;height:42px;border-radius:8px;background:#101827;color:#d4af37;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;">'+iniciais(nome)+'</span>';
          }
          html += '<span style="font-size:9px;font-weight:700;line-height:1.15;text-align:center;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">'+escHtml(nome)+'</span></a>';
        });
        html += '</div><a href="/colunistas/" style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding-top:9px;border-top:1px solid #edf0f5;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#b8860b;text-decoration:none;">Ver colunas <span>→</span></a>';
        body.innerHTML = html;
      })
      .catch(function(){
        body.innerHTML = '<a href="/colunistas/" style="display:block;text-decoration:none;color:#0f172a;font-size:12px;font-weight:700;line-height:1.35;">Acesse os artigos e colunas do O Valor Capital</a>';
      });
  }

  document.addEventListener('DOMContentLoaded', function(){
    injetarMenuColunistas();
    organizarRailsHome();
    carregarRailColunistas();
    load();
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
        if(!document.getElementById('ovc-pulse-style')){
          var st=document.createElement('style'); st.id='ovc-pulse-style';
          st.textContent='@keyframes ovc-pulse{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.4)}70%{box-shadow:0 0 0 8px rgba(34,197,94,0)}}'; document.head.appendChild(st);
        }
        // Sidebar rail TV
        var sidebarTv = document.querySelector('.rail-block-tv');
        if (sidebarTv) {
          if (ytUrl) {
            sidebarTv.innerHTML = '<div class="rail-title">OVC TV • Ao vivo</div>'
              +'<div class="tv-live-pill"><span class="tv-dot"></span> ao vivo agora</div>'
              +'<div style="border-radius:8px;overflow:hidden;margin-top:8px;">'
              +'<iframe width="100%" height="158" src="'+ytUrl+'" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;picture-in-picture" allowfullscreen loading="lazy" style="display:block;border-radius:8px;"></iframe>'
              +'</div>';
          } else {
            var ph = sidebarTv.querySelector('.tv-player-placeholder');
            if (ph) { ph.style.cursor='pointer'; ph.title='Abrir canal OVC no YouTube'; ph.onclick=function(){ window.open('https://youtube.com/@ovalorcapital','_blank'); }; }
          }
        }
        // Full-width TV section
        if(!ytUrl){ sec.style.display='none'; return; }
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

})();
