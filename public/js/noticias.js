(function(){
  var API = '/api/portal-posts';

  var CAT_HERO = ['politica','economia','internacional','regulacao','tributacao','geral'];
  var CAT_SIDE = ['seguros','saude','investimentos','negocios','empregos','familia','educacao','mercados','industria','tecnologia','cultura','patrimonio','esportes'];

  var _heroIndex = 0, _heroPosts = [], _heroTimer = null;

  var CAT_PATH = {
    politica:'politica',economia:'economia',negocios:'negocios',
    investimentos:'investimentos',seguros:'seguros',mercados:'mercados',
    educacao:'educacao',industria:'industria',tecnologia:'tecnologia',
    esportes:'esportes',saude:'saude',familia:'familia',
    tributacao:'tributos',regulacao:'regulacao',internacional:'economia',
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

  var LABEL = {politica:'Política',economia:'Economia',negocios:'Negócios',
    investimentos:'Investimentos',mercados:'Mercados',tributacao:'Tributação',
    regulacao:'Regulação',seguros:'Seguros',saude:'Saúde',familia:'Família',
    tecnologia:'Tecnologia',industria:'Indústria',educacao:'Educação',
    esportes:'Esportes',cultura:'Cultura',patrimonio:'Patrimônio',
    internacional:'Internacional',geral:'Geral'};

  function label(c){ return LABEL[c]||c||'Geral'; }

  function setTag(el, cat){
    if(!el) return;
    el.innerHTML = '<span class="tag-dot"></span> ' + label(cat);
    // Atualizar classe do tag
    el.className = el.className.replace(/tag-\w+/g,'') + ' tag-' + (cat||'geral');
  }

  function injectImg(card, p){
    if(!p.imagem || !card) return;
    // Verificar se ja tem img
    if(card.querySelector('img.ovc-card-img')) return;
    var img = document.createElement('img');
    img.className = 'ovc-card-img';
    img.src = p.imagem;
    img.alt = '';
    img.style.cssText = 'width:100%;height:160px;object-fit:cover;border-radius:6px;margin-bottom:8px;display:block;';
    img.onerror = function(){ this.style.display='none'; };
    card.insertBefore(img, card.firstChild);
  }

  function preencherHero(heroEl, p){
    if(!heroEl||!p) return;
    var url = buildUrl(p);
    var tit  = heroEl.querySelector('.card-title, h1, h2');
    var exc  = heroEl.querySelector('.card-excerpt, p:not(.card-meta)');
    var tag  = heroEl.querySelector('.tag');
    var cta  = heroEl.querySelector('.card-cta');
    var meta = heroEl.querySelector('.card-meta');
    if(tit)  tit.textContent = p.titulo;
    if(exc)  exc.textContent = (p.resumo||'').slice(0,160);
    if(tag)  setTag(tag, p.categoria);
    if(meta) meta.textContent = 'Redação OVC · ' + dataBr(p.data);
    if(cta){ cta.href = url; }
    if(p.imagem){
      heroEl.style.backgroundImage = "linear-gradient(135deg,rgba(15,116,210,0.55),rgba(0,0,0,0.72)), url('" + p.imagem + "')";
      heroEl.style.backgroundSize = 'cover';
      heroEl.style.backgroundPosition = 'center';
    }
    heroEl.style.cursor = 'pointer';
    heroEl.onclick = function(e){ if(!e.target.closest('a')) location.href = url; };
  }

  function setupHeroRotation(heroEl, posts){
    if(!heroEl||!posts.length) return;
    _heroPosts = posts.slice(0,6);
    _heroIndex = 0;

    var dotsEl = heroEl.querySelector('.ovc-hero-dots');
    if(!dotsEl){
      dotsEl = document.createElement('div');
      dotsEl.className = 'ovc-hero-dots';
      dotsEl.style.cssText = 'display:flex;gap:6px;margin-top:auto;padding-top:8px;';
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

  function preencherCard(el, p){
    if(!el||!p) return;
    var url = buildUrl(p);
    var tit  = el.querySelector('.card-title,.card-feature-title,h2,h3');
    var exc  = el.querySelector('.card-excerpt,.card-feature-excerpt,p:not(.card-meta)');
    var tag  = el.querySelector('.tag');
    var cta  = el.querySelector('.card-cta');
    var meta = el.querySelector('.card-meta');
    if(tit)  tit.textContent = p.titulo;
    if(exc)  exc.textContent = (p.resumo||'').slice(0,150);
    if(tag)  setTag(tag, p.categoria);
    if(meta) meta.textContent = 'Redação OVC · ' + label(p.categoria);
    if(cta)  cta.href = url;
    injectImg(el, p);
    el.style.cursor = 'pointer';
    el.onclick = function(e){ if(!e.target.closest('a')) location.href = url; };
  }

  function preencherMini(el, p){
    if(!el||!p) return;
    var url = buildUrl(p);
    var tit  = el.querySelector('.card-title,h3,h4');
    var tag  = el.querySelector('.tag');
    var cta  = el.querySelector('.card-cta');
    var meta = el.querySelector('.card-meta');
    if(tit)  tit.textContent = p.titulo;
    if(tag)  setTag(tag, p.categoria);
    if(meta) meta.textContent = 'Redação OVC · ' + label(p.categoria);
    if(cta)  cta.href = url;
    injectImg(el, p);
    el.style.cursor = 'pointer';
    el.onclick = function(e){ if(!e.target.closest('a')) location.href = url; };
  }

  function filtra(posts, cats){
    return posts.filter(function(p){ return cats.indexOf(p.categoria||'geral') !== -1; });
  }

  function loadNoticias(){
    fetch(API + '?limit=80')
      .then(function(res){ return res.json(); })
      .then(function(json){
        var todos = (json.posts||[]).filter(function(p){ return p.titulo && p.titulo.length > 0; });
        if(!todos.length) return;

        var heroPool = filtra(todos, CAT_HERO);
        var sidePool = filtra(todos, CAT_SIDE);
        if(heroPool.length < 2) heroPool = todos;
        if(sidePool.length < 2) sidePool = todos;

        var heroEl = document.querySelector('.card-hero-main');
        if(heroEl) setupHeroRotation(heroEl, heroPool);

        preencherCard(document.querySelector('.card-feature'), sidePool[0]);
        preencherCard(document.querySelector('.card-monetizado'), sidePool[1]);

        var stdPosts = todos.slice(0, 20);
        ['ovc-card-std-1','ovc-card-std-2','ovc-card-std-3',
         'ovc-card-std-4','ovc-card-std-5','ovc-card-std-6'].forEach(function(id, idx){
          preencherCard(document.getElementById(id), stdPosts[idx+2]);
        });

        ['ovc-card-mini-1','ovc-card-mini-2','ovc-card-mini-3',
         'ovc-card-mini-4','ovc-card-mini-5'].forEach(function(id, idx){
          preencherMini(document.getElementById(id), stdPosts[idx+8]);
        });
      })
      .catch(function(e){ console.warn('OVC noticias:', e.message); });
  }

  document.addEventListener('DOMContentLoaded', function(){
    loadNoticias();
    setInterval(loadNoticias, 120000);
  });
})();
