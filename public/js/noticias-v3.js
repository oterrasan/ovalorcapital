(function(){
  var API = '/api/portal-posts';

  var CAT_HERO = ['politica','economia','internacional','regulacao','tributacao','crise'];
  var CAT_SIDE = ['seguros','saude','investimentos','previdencia','consorcio'];
  var SIDE_KEYWORDS = [
    'seguro','seguros','apólice','sinistro','previdência','vida em grupo',
    'plano de saúde','plano saúde','operadora de saúde','convênio médico',
    'consórcio','carta de crédito',
    'investimento','renda fixa','tesouro direto','fundo de investimento','cdi','selic',
    'previdência privada','pgbl','vgbl',
    'seguro de vida','seguro residencial','seguro auto','seguro veículo',
    'proteção financeira','reserva de emergência'
  ];

  var _heroIndex = 0, _heroPosts = [], _heroTimer = null;
  var _sideIndexA = 0, _sideIndexB = 1, _sidePool = [], _sideTimer = null;

  var CAT_PATH = {
    politica:'politica',economia:'economia',negocios:'negocios',
    investimentos:'investimentos',seguros:'seguros',mercados:'mercados',
    educacao:'educacao',industria:'industria',tecnologia:'tecnologia',
    esportes:'esportes',saude:'saude',familia:'familia',
    tributacao:'tributos',regulacao:'regulacao',internacional:'economia',
    previdencia:'investimentos',consorcio:'seguros',geral:'politica'
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
    internacional:'Internacional',geral:'Geral',
    previdencia:'Previdência',consorcio:'Consórcio'};

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
    /icon/i,/logo/i,/favicon/i,/sprite/i,/\.svg$/i,/\.gif$/i,/\.ico$/i
  ];

  function isValidImage(url){
    if(!url || url.length < 10) return false;
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
    img.style.cssText = 'width:100%;height:150px;object-fit:cover;border-radius:6px;margin-bottom:8px;display:block;';
    img.onerror = function(){ this.remove(); };
    card.insertBefore(img, card.firstChild);
  }

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
    if(cta)  cta.href = url;
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

  // Preencher card de destaque (feature/monetizado) — suporta atualização dinâmica
  function preencherSideCard(el, p){
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
    el.onclick = function(e){ if(!e.target.closest('a')) location.href=url; };
  }

  // Rotação dos dois cards de destaque — nunca ficam vazios, sempre alternando
  function setupSideRotation(pool){
    if(!pool.length) return;
    _sidePool = pool.slice(0, 5); // máximo 5 matérias em rotação
    _sideIndexA = 0;
    _sideIndexB = _sidePool.length > 1 ? 1 : 0;

    var elA = document.querySelector('.card-feature');
    var elB = document.querySelector('.card-monetizado');

    if(elA) preencherSideCard(elA, _sidePool[_sideIndexA]);
    if(elB) preencherSideCard(elB, _sidePool[_sideIndexB]);

    if(_sideTimer) clearInterval(_sideTimer);
    _sideTimer = setInterval(function(){
      // Avançar cada card de forma independente, sem repetir o mesmo nos dois ao mesmo tempo
      _sideIndexA = (_sideIndexA + 2) % _sidePool.length;
      _sideIndexB = (_sideIndexA + 1) % _sidePool.length;
      if(elA) preencherSideCard(elA, _sidePool[_sideIndexA]);
      if(elB) preencherSideCard(elB, _sidePool[_sideIndexB]);
    }, 9000);
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
    el.onclick = function(e){ if(!e.target.closest('a')) location.href=url; };
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
    el.onclick = function(e){ if(!e.target.closest('a')) location.href=url; };
  }

  function qualificaSide(p){
    // APENAS categoria exata — sem keyword matching que causa falsos positivos
    return ['seguros','saude','investimentos','previdencia','consorcio'].indexOf(p.categoria) !== -1;
  }

  function dedup(arr){
    var seen = {};
    return arr.filter(function(p){ if(seen[p.id]) return false; seen[p.id]=true; return true; });
  }

  function loadNoticias(){
    fetch(API + '?limit=100')
      .then(function(res){ return res.json(); })
      .then(function(json){
        var todos = dedup((json.posts||[]).filter(function(p){ return p.titulo && p.titulo.length > 0; }));
        if(!todos.length) return;

        var usedIds = {};
        function pick(pool){
          for(var i=0;i<pool.length;i++){
            if(!usedIds[pool[i].id]){ usedIds[pool[i].id]=true; return pool[i]; }
          }
          return null;
        }

        // Hero rotativo
        var heroPool = todos.filter(function(p){ return CAT_HERO.indexOf(p.categoria) !== -1; });
        if(heroPool.length < 2) heroPool = todos;
        var heroEl = document.querySelector('.card-hero-main');
        if(heroEl){
          var heroItems = [];
          for(var i=0;i<heroPool.length && heroItems.length<6;i++){
            if(!usedIds[heroPool[i].id]){ usedIds[heroPool[i].id]=true; heroItems.push(heroPool[i]); }
          }
          setupHeroRotation(heroEl, heroItems);
        }

        // Cards de destaque — pool de até 5 matérias monetizadas em rotação
        var sidePool = todos.filter(qualificaSide);
        // Não marca como usados — os cards de destaque têm pool próprio e podem repetir entre si
        setupSideRotation(sidePool);

        // Cards standard — sem repetir com hero, sem repetir entre si
        // (side pool não bloqueia os standard — são seções independentes)
        ['ovc-card-std-1','ovc-card-std-2','ovc-card-std-3',
         'ovc-card-std-4','ovc-card-std-5','ovc-card-std-6'].forEach(function(id){
          preencherCard(document.getElementById(id), pick(todos));
        });

        ['ovc-card-mini-1','ovc-card-mini-2','ovc-card-mini-3',
         'ovc-card-mini-4','ovc-card-mini-5'].forEach(function(id){
          preencherMini(document.getElementById(id), pick(todos));
        });

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
