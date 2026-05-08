(function(){
  var API = '/api/portal-posts';

  var CAT_HERO    = ['politica','economia'];
  var CAT_DIREITO = ['seguros'];
  var CAT_CENTRAL = ['negocios'];
  var CAT_EXCLUIDAS_CENTRAL = ['politica','economia','seguros','investimentos','parcerias','vc'];

  var _heroIndex = 0, _heroPosts = [], _heroTimer = null;
  var _centralIndex = 0, _centralPosts = [], _centralTimer = null;
  var _direitoIndex = 0, _direitoPosts = [], _direitoTimer = null;

  var CAT_PATH = {
    politica:'politica', economia:'economia', negocios:'negocios',
    investimentos:'investimentos', seguros:'seguros', mercados:'mercados',
    educacao:'educacao', industria:'industria', tecnologia:'tecnologia',
    esportes:'esportes', saude:'saude', familia:'familia',
    tributacao:'tributos', regulacao:'regulacao', internacional:'internacional',
    previdencia:'investimentos', consorcio:'seguros', parcerias:'parcerias',
    vc:'vc', colunistas:'vc',
    geral:'politica'
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

  var LABEL = {
    politica:'Política', economia:'Economia', negocios:'Negócios',
    investimentos:'Investimentos', mercados:'Mercados', tributacao:'Tributação',
    regulacao:'Regulação', seguros:'Seguros', saude:'Saúde', familia:'Família',
    tecnologia:'Tecnologia', industria:'Indústria', educacao:'Educação',
    esportes:'Esportes', cultura:'Cultura', patrimonio:'Patrimônio', variedades:'Variedades',
    internacional:'Internacional', geral:'Geral', parcerias:'Parcerias',
    previdencia:'Previdência', consorcio:'Consórcio',
    vc:'Colunistas OVC', colunistas:'Colunistas OVC'
  };

  function label(c){ return LABEL[c]||c||'Geral'; }

  function setTag(el, cat){
    if(!el) return;
    el.innerHTML = '<span class="tag-dot"></span> ' + label(cat);
    el.className = el.className.replace(/tag-\w+/g,'') + ' tag-' + (cat||'geral');
  }

  var BLOCKED_IMG = [
    /perfil/i,/author/i,/avatar/i,/reporter/i,/jornalista/i,
    /apresentador/i,/anchor/i,/staff/i,/\/autores?\//i,/\/pessoas?\//i,
    /foto-de-perfil/i,/profile/i,/headshot/i,/foto_autor/i,/\/time\//i,
    /columnist/i,/byline/i,/contributor/i,/editor/i,/redator/i,
    /icon/i,/logo/i,/favicon/i,/sprite/i,/brand/i,/marca/i,
    /watermark/i,/\.svg$/i,/\.gif$/i,/\.ico$/i
  ];

  function isValidImage(url){
    if(!url || url.length < 12) return false;
    return !BLOCKED_IMG.some(function(p){ return p.test(url); });
  }

  function injectImg(card, p){
    if(!card) return;
    var old = card.querySelector('img.ovc-card-img');
    if(old) old.remove();
    if(!isValidImage(p.imagem)) return;
    var img = document.createElement('img');
    img.className = 'ovc-card-img';
    img.src = p.imagem;
    img.alt = '';
    img.onerror = function(){ this.remove(); };
    card.insertBefore(img, card.firstChild);
  }

  // ─── CARD 1: HERO ───────────────────────────────────────────────
  function preencherHero(heroEl, p){
    if(!heroEl||!p) return;
    var url = buildUrl(p);
    var tit  = heroEl.querySelector('.card-title,h1,h2');
    var exc  = heroEl.querySelector('.card-excerpt,p:not(.card-meta)');
    var tag  = heroEl.querySelector('.tag');
    var cta  = heroEl.querySelector('.card-cta');
    var meta = heroEl.querySelector('.card-meta');
    if(tit)  tit.textContent = p.titulo;
    if(exc)  exc.textContent = (p.resumo||'').slice(0,160);
    if(tag)  setTag(tag, p.categoria);
    if(meta) meta.textContent = 'Redação OVC · ' + dataBr(p.data);
    if(cta){ cta.href = url; cta.innerHTML = '<span>LEIA MAIS</span>'; }
    if(p.imagem && isValidImage(p.imagem)){
      heroEl.style.backgroundImage = "linear-gradient(to bottom,rgba(0,0,0,0.25) 0%,rgba(0,0,0,0.80) 100%),url('" + p.imagem + "')";
      heroEl.style.backgroundSize = 'cover';
      heroEl.style.backgroundPosition = 'center';
    } else {
      heroEl.style.backgroundImage = 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)';
    }
    heroEl.style.cursor = 'pointer';
    heroEl.onclick = function(e){ if(!e.target.closest('a')) location.href=url; };
  }

  function setupHeroRotation(heroEl, posts){
    if(!heroEl||!posts.length) return;
    _heroPosts = posts.slice(0,20);
    _heroIndex = 0;
    var dotsEl = heroEl.querySelector('.ovc-hero-dots');
    if(!dotsEl){
      dotsEl = document.createElement('div');
      dotsEl.className = 'ovc-hero-dots';
      dotsEl.style.cssText = 'display:flex;gap:6px;margin-top:auto;padding-top:8px;flex-wrap:wrap;';
      _heroPosts.forEach(function(_,i){
        var d = document.createElement('span');
        d.style.cssText = 'width:7px;height:7px;border-radius:50%;background:#ffc800;cursor:pointer;transition:opacity .3s;opacity:0.3;flex-shrink:0;';
        d.onclick = function(){ _heroIndex=i; showHero(i); };
        dotsEl.appendChild(d);
      });
      heroEl.appendChild(dotsEl);
    }
    function showHero(i){
      var p = _heroPosts[i];
      if(!p) return;
      preencherHero(heroEl, p);
      Array.from(dotsEl.children).forEach(function(d,di){
        d.style.opacity = di===i ? '1' : '0.3';
      });
    }
    showHero(0);
    if(_heroTimer) clearInterval(_heroTimer);
    _heroTimer = setInterval(function(){
      _heroIndex = (_heroIndex+1) % _heroPosts.length;
      showHero(_heroIndex);
    }, 7000);
  }

  // ─── CARD 2: CENTRAL ────────────────────────────────────────────
  function preencherCentral(el, p){
    if(!el||!p) return;
    var url = buildUrl(p);
    var tit  = el.querySelector('.card-feature-title,.card-title,h2,h3');
    var exc  = el.querySelector('.card-feature-excerpt,.card-excerpt');
    var tag  = el.querySelector('.tag');
    var cta  = el.querySelector('.card-cta');
    if(tit)  tit.textContent = p.titulo;
    if(exc)  exc.textContent = (p.resumo||'').slice(0,160);
    if(tag)  setTag(tag, p.categoria);
    if(cta){ cta.href = url; cta.innerHTML = '<span>LEIA MAIS</span>'; }
    var metaEl = el.querySelector('.card-meta');
    if(metaEl) metaEl.textContent = 'Redação OVC · ' + dataBr(p.data);
    if(p.imagem && isValidImage(p.imagem)){
      el.style.backgroundImage = "url('"+p.imagem+"')";
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.classList.add('has-image');
    } else {
      el.style.backgroundImage = '';
      el.classList.remove('has-image');
    }
    el.style.cursor = 'pointer';
    el.onclick = null;
    el.onclick = function(e){ if(!e.target.closest('a')) location.href=url; };
  }

  function setupCentralRotation(el, pool){
    if(!el||!pool.length) return;
    _centralPosts = pool.slice(0,20);
    _centralIndex = 0;
    preencherCentral(el, _centralPosts[0]);
    if(_centralTimer) clearInterval(_centralTimer);
    _centralTimer = setInterval(function(){
      _centralIndex = (_centralIndex+1) % _centralPosts.length;
      preencherCentral(el, _centralPosts[_centralIndex]);
    }, 11000);
  }

  // ─── CARD 3: DIREITO ────────────────────────────────────────────
  function preencherDireito(el, p){
    if(!el||!p) return;
    var url = buildUrl(p);
    var tit  = el.querySelector('.card-title,.card-feature-title,h2,h3');
    var exc  = el.querySelector('.card-excerpt,.card-feature-excerpt,p:not(.card-meta)');
    var tag  = el.querySelector('.tag');
    var cta  = el.querySelector('.card-cta');
    var meta = el.querySelector('.card-meta');
    if(tit)  { tit.textContent = p.titulo; tit.style.position='relative'; tit.style.zIndex='2'; }
    if(exc)  { exc.textContent = (p.resumo||'').slice(0,150); exc.style.position='relative'; exc.style.zIndex='2'; }
    if(tag)  { setTag(tag, p.categoria); tag.style.position='relative'; tag.style.zIndex='2'; }
    if(meta) { meta.textContent = 'Redação OVC · ' + dataBr(p.data); meta.style.position='relative'; meta.style.zIndex='2'; }
    if(cta)  { cta.href = url; cta.style.position='relative'; cta.style.zIndex='2'; }
    if(p.imagem && isValidImage(p.imagem)){
      el.style.backgroundImage = "url('"+p.imagem+"')";
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
    }
    el.style.cursor = 'pointer';
    el.onclick = null;
    el.onclick = function(e){ if(!e.target.closest('a')) location.href=url; };
  }

  function setupDireitoRotation(el, pool){
    if(!el||!pool.length) return;
    _direitoPosts = pool.slice(0,20);
    _direitoIndex = 0;
    preencherDireito(el, _direitoPosts[0]);
    if(_direitoTimer) clearInterval(_direitoTimer);
    _direitoTimer = setInterval(function(){
      _direitoIndex = (_direitoIndex+1) % _direitoPosts.length;
      preencherDireito(el, _direitoPosts[_direitoIndex]);
    }, 13000);
  }

  // ─── CARDS STANDARD E MINI ──────────────────────────────────────
  function preencherCard(el, p){
    if(!el||!p) return;
    var url = buildUrl(p);
    var cat = p.categoria||'geral';
    var tag  = el.querySelector('.tag');
    var tit  = el.querySelector('.card-title');
    var meta = el.querySelector('.card-meta');
    var cta  = el.querySelector('.card-cta');
    if(tag){ tag.className = 'tag tag-'+cat; tag.innerHTML = '<span class="tag-dot"></span>'+label(cat); }
    if(tit){ tit.textContent = p.titulo||''; }
    if(meta) meta.textContent = 'Redação OVC · '+dataBr(p.data);
    if(cta){ cta.href = url; cta.innerHTML = '<span>LEIA MAIS</span>'; }
    if(p.imagem && isValidImage(p.imagem)){
      el.style.backgroundImage = "url('"+p.imagem+"')";
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
    } else {
      el.style.backgroundImage = '';
    }
    el.style.cursor = 'pointer';
    el.onclick = null;
    el.onclick = function(e){ if(!e.target.closest('a')) location.href=url; };
  }

  function preencherMini(el, p){
    if(!el||!p) return;
    var url = buildUrl(p);
    var cat = p.categoria||'geral';
    el.innerHTML =
      '<span class="tag tag-'+cat+'"><span class="tag-dot"></span>'+label(cat)+'</span>' +
      '<h3 class="card-title"><a href="'+url+'" style="color:inherit;text-decoration:none;">'+escHtml(p.titulo||'')+'</a></h3>' +
      '<div class="card-meta">Redação OVC · '+label(cat)+'</div>' +
      '<a class="card-cta" href="'+url+'"><span>LEIA MAIS</span></a>';
    el.style.cursor = 'pointer';
    el.onclick = null;
    el.onclick = function(e){ if(!e.target.closest('a')) location.href=url; };
  }

  function escHtml(str){
    return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function dedup(arr){
    var seenId = {}, seenTitulo = {};
    return arr.filter(function(p){
      if(!p.id || !p.titulo) return false;
      if(seenId[p.id]) return false;
      var tNorm = (p.titulo||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,30);
      if(seenTitulo[tNorm]) return false;
      seenId[p.id] = true;
      seenTitulo[tNorm] = true;
      return true;
    });
  }

  function sortComImagemPrimeiro(pool){
    return pool.slice().sort(function(a, b){
      var aOk = isValidImage(a.imagem) ? 0 : 1;
      var bOk = isValidImage(b.imagem) ? 0 : 1;
      return aOk - bOk;
    });
  }

  function loadNoticias(){
    fetch(API + '?limit=120')
      .then(function(res){ return res.json(); })
      .then(function(json){
        var todos = dedup((json.posts||[]).filter(function(p){
          return p.titulo && p.titulo.length > 0 && p.imagem && p.imagem.length > 10;
        }));
        if(!todos.length) return;

        var usedIds = {};

        function markUsedOne(post){
          if(post) usedIds[post.id] = true;
        }

        // ── Card 1: Hero ─────────────────────────────────────────
        var heroPool = sortComImagemPrimeiro(
          todos.filter(function(p){ return CAT_HERO.indexOf(p.categoria) !== -1; })
        );
        var heroEl = document.querySelector('.card-hero-main');
        if(heroEl && heroPool.length){
          markUsedOne(heroPool[0]);
          setupHeroRotation(heroEl, heroPool);
        }

        // ── Card 2: Central ──────────────────────────────────────
        var centralPool = sortComImagemPrimeiro(
          todos.filter(function(p){
            return CAT_CENTRAL.indexOf(p.categoria) !== -1 && !usedIds[p.id];
          })
        );
        var centralEl = document.querySelector('.card-feature');
        if(centralEl && centralPool.length){
          markUsedOne(centralPool[0]);
          setupCentralRotation(centralEl, centralPool);
        }

        // ── Card 3: Direito ──────────────────────────────────────
        var direitoPool = sortComImagemPrimeiro(
          todos.filter(function(p){
            return CAT_DIREITO.indexOf(p.categoria) !== -1 && !usedIds[p.id];
          })
        );
        var direitoEl = document.querySelector('.card-monetizado');
        if(direitoEl && direitoPool.length){
          markUsedOne(direitoPool[0]);
          setupDireitoRotation(direitoEl, direitoPool);
        }

        // ── Grids de categoria ───────────────────────────────────
        function pool(cats){
          var all = sortComImagemPrimeiro(
            todos.filter(function(p){ return cats.indexOf(p.categoria) !== -1; })
          );
          var novos     = all.filter(function(p){ return !usedIds[p.id]; });
          var repetidos = all.filter(function(p){ return !!usedIds[p.id]; });
          return novos.concat(repetidos);
        }

        function iniciarRotacao(elId, p){
          var el = document.getElementById(elId);
          if(!el || !p || !p.length) return;
          var idx = 0;
          preencherCard(el, p[0]);
          var count = 0;
          var timer = setInterval(function(){
            count++;
            if(count >= 10){ clearInterval(timer); return; }
            idx = (idx + 1) % p.length;
            preencherCard(el, p[idx]);
          }, 7000);
        }

        // SEÇÃO 1
        iniciarRotacao('ovc-card-std-1',  pool(['politica']));
        iniciarRotacao('ovc-card-std-2',  pool(['economia']));
        iniciarRotacao('ovc-card-std-2b', pool(['internacional']));

        iniciarRotacao('ovc-card-std-3',  pool(['negocios']));
        iniciarRotacao('ovc-card-std-4',  pool(['investimentos']));
        iniciarRotacao('ovc-card-std-4b', pool(['mercados']));

        iniciarRotacao('ovc-card-std-5',  pool(['familia']));
        iniciarRotacao('ovc-card-std-5b', pool(['saude']));
        iniciarRotacao('ovc-card-std-5c', pool(['educacao']));

        // SEÇÃO 2
        iniciarRotacao('ovc-card-std-6',  pool(['tributacao']));
        iniciarRotacao('ovc-card-std-6b', pool(['regulacao']));
        iniciarRotacao('ovc-card-std-7b', pool(['seguros']));
        iniciarRotacao('ovc-card-std-8b', pool(['parcerias']));
        iniciarRotacao('ovc-card-std-9b', pool(['vc','colunistas']));

        // SEÇÃO 3
        iniciarRotacao('ovc-card-std-7',  pool(['esportes']));
        iniciarRotacao('ovc-card-std-8',  pool(['tecnologia']));
        iniciarRotacao('ovc-card-std-9',  pool(['industria']));

        var grids = document.querySelectorAll('.card-grid,.cards-section,.section-cards,.standard-grid');
        grids.forEach(function(g){ g.style.gap = '22px'; });
      })
      .catch(function(e){ console.warn('OVC noticias:', e.message); });
  }

  document.addEventListener('DOMContentLoaded', function(){
    loadNoticias();
    setInterval(loadNoticias, 120000);
  });
})();
