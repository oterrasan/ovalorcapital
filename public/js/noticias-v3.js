(function(){
  var API = '/api/portal-posts';

  // Card 1 — Hero: só Política e Economia
  var CAT_HERO = ['politica','economia'];

  // Card 3 — Direito: só Seguros, Investimentos e Parcerias
  var CAT_DIREITO = ['seguros','investimentos','parcerias'];

  // Card 2 — Central: TODAS exceto VC, Política, Economia, Seguros, Investimentos, Parcerias
  var CAT_EXCLUIDAS_CENTRAL = ['politica','economia','seguros','investimentos','parcerias','vc','tecnologia','esportes','industria'];

  var _heroIndex = 0, _heroPosts = [], _heroTimer = null;
  var _centralIndex = 0, _centralPosts = [], _centralTimer = null;
  var _direitoIndex = 0, _direitoPosts = [], _direitoTimer = null;

  var CAT_PATH = {
    politica:'politica', economia:'economia', negocios:'negocios',
    investimentos:'investimentos', seguros:'seguros', mercados:'mercados',
    educacao:'educacao', industria:'industria', tecnologia:'tecnologia',
    esportes:'esportes', saude:'saude', familia:'familia',
    tributacao:'tributos', regulacao:'regulacao', internacional:'economia',
    previdencia:'investimentos', consorcio:'seguros', parcerias:'parcerias',
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
    esportes:'Esportes', cultura:'Cultura', patrimonio:'Patrimônio',
    internacional:'Internacional', geral:'Geral', parcerias:'Parcerias',
    previdencia:'Previdência', consorcio:'Consórcio'
  };

  function label(c){ return LABEL[c]||c||'Geral'; }

  function setTag(el, cat){
    if(!el) return;
    el.innerHTML = '<span class="tag-dot"></span> ' + label(cat);
    el.className = el.className.replace(/tag-\w+/g,'') + ' tag-' + (cat||'geral');
  }

  // Bloqueio de imagens inválidas — segunda barreira no frontend
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
    // Sem height inline — o CSS define altura fixa e inviolável por classe do card pai
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
    if(tit)  tit.textContent = p.titulo;
    if(exc)  exc.textContent = (p.resumo||'').slice(0,150);
    if(tag)  setTag(tag, p.categoria);
    if(meta) meta.textContent = 'Redação OVC · ' + label(p.categoria);
    if(cta)  cta.href = url;
    injectImg(el, p);
    el.style.cursor = 'pointer';
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
  // Card GRANDE: imagem + categoria + título + resumo + botão
  function preencherCard(el, p){
    if(!el||!p) return;
    var url = buildUrl(p);
    var cat = p.categoria||'geral';

    var tag  = el.querySelector('.tag');
    var tit  = el.querySelector('.card-title');
    var meta = el.querySelector('.card-meta');
    var exc  = el.querySelector('.card-excerpt');
    var cta  = el.querySelector('.card-cta');
    var titLink = tit ? tit.querySelector('a') : null;

    if(tag){
      tag.className = tag.className.replace(/tag-\w+/g,'') + ' tag-'+cat;
      tag.innerHTML = '<span class="tag-dot"></span>'+label(cat);
    }
    if(tit){
      if(titLink){ titLink.textContent = p.titulo||''; titLink.href = url; }
      else { tit.textContent = p.titulo||''; }
    }
    if(meta) meta.textContent = 'Redação OVC · '+dataBr(p.data);
    if(exc)  exc.textContent = (p.resumo||'').replace(/^Redação OVC.*?\n/,'').slice(0,150);
    if(cta)  cta.href = url;

    if(isValidImage(p.imagem)){
      var existingImg = el.querySelector('img.ovc-card-img');
      if(!existingImg){
        var img = document.createElement('img');
        img.className = 'ovc-card-img';
        img.src = p.imagem;
        img.alt = '';
        img.onerror = function(){ this.remove(); };
        el.insertBefore(img, el.firstChild);
      } else {
        existingImg.src = p.imagem;
      }
    }

    el.style.cursor = 'pointer';
    el.onclick = function(e){ if(!e.target.closest('a')) location.href=url; };
  }

  // Card MINI: SEM imagem — só categoria + título + botão (igual ao HTML estático)
  function preencherMini(el, p){
    if(!el||!p) return;
    var url = buildUrl(p);
    var cat = p.categoria||'geral';
    el.innerHTML =
      '<span class="tag tag-'+cat+'"><span class="tag-dot"></span>'+label(cat)+'</span>' +
      '<h3 class="card-title"><a href="'+url+'" style="color:inherit;text-decoration:none;">'+escHtml(p.titulo||'')+'</a></h3>' +
      '<div class="card-meta">Redação OVC · '+label(cat)+'</div>' +
      '<a class="card-cta" href="'+url+'"><span>Leia mais</span><span class="icon">↗</span></a>';
    el.style.cursor = 'pointer';
    el.onclick = function(e){ if(!e.target.closest('a')) location.href=url; };
  }

  function escHtml(str){
    return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // Dedup por ID E por título normalizado — elimina duplicatas de qualquer tipo
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

  function loadNoticias(){
    var dbgEl = document.getElementById('ovc-card-std-8');
    if(dbgEl){ var dbgSpan = document.createElement('div'); dbgSpan.id='ovc-debug'; dbgSpan.style='background:red;color:white;padding:4px;font-size:12px;'; dbgSpan.textContent='JS RODANDO...'; dbgEl.insertBefore(dbgSpan, dbgEl.firstChild); }
    fetch(API + '?limit=120')
      .then(function(res){ return res.json(); })
      .then(function(json){
        // 1. Dedup global por ID e título
        var todos = dedup((json.posts||[]).filter(function(p){
          return p.titulo && p.titulo.length > 0 && p.imagem && p.imagem.length > 10;
        }));
        if(!todos.length) return;

        // 2. Controle global de IDs já usados na home
        var usedIds = {};

        function pick(pool){
          for(var i=0;i<pool.length;i++){
            if(!usedIds[pool[i].id]){
              usedIds[pool[i].id] = true;
              return pool[i];
            }
          }
          return null;
        }

        function markUsed(pool){
          pool.forEach(function(p){ usedIds[p.id] = true; });
        }

        // ── Card 1: Hero — SOMENTE Política e Economia. SEM FALLBACK. ──
        var heroPool = todos.filter(function(p){ return CAT_HERO.indexOf(p.categoria) !== -1; });
        var heroEl = document.querySelector('.card-hero-main');
        if(heroEl && heroPool.length){
          markUsed(heroPool.slice(0, 20));
          setupHeroRotation(heroEl, heroPool);
        }

        // ── Card 2: Central — SOMENTE categorias permitidas. SEM FALLBACK. ──
        var centralPool = todos.filter(function(p){
          return CAT_EXCLUIDAS_CENTRAL.indexOf(p.categoria) === -1 && !usedIds[p.id];
        });
        var centralEl = document.querySelector('.card-feature');
        if(centralEl && centralPool.length){
          markUsed(centralPool.slice(0, 20));
          setupCentralRotation(centralEl, centralPool);
        }

        // ── Card 3: Direito — SOMENTE Seguros, Investimentos, Parcerias. SEM FALLBACK. ──
        var direitoPool = todos.filter(function(p){
          return CAT_DIREITO.indexOf(p.categoria) !== -1 && !usedIds[p.id];
        });
        var direitoEl = document.querySelector('.card-monetizado');
        if(direitoEl && direitoPool.length){
          markUsed(direitoPool.slice(0, 20));
          setupDireitoRotation(direitoEl, direitoPool);
        }

        // ════════════════════════════════════════════════════════════
        // REGRAS INVIOLÁVEIS DAS COLUNAS — MAPEADAS DO HTML
        // Coluna 1 — "Política & Economia"
        //   std-1, std-2: politica, economia
        //   mini-1: politica
        //   mini-2: economia, internacional
        // Coluna 2 — "Negócios, Investimentos & Mercados"
        //   std-3: negocios
        //   std-4: investimentos
        //   mini-3: mercados
        //   mini-4: investimentos
        // Coluna 3 — "Família, Saúde, Educação, Tributos & Regulação"
        //   std-5: tributacao, regulacao
        //   std-6: familia, saude, educacao
        //   mini-5: educacao, familia, saude
        // Bloco "Artigos técnicos": ESTÁTICO — nunca tocar
        // ════════════════════════════════════════════════════════════

        var col1_std  = todos.filter(function(p){ return ['politica','economia'].indexOf(p.categoria) !== -1 && !usedIds[p.id]; });
        var col1_mini1 = todos.filter(function(p){ return p.categoria === 'politica' && !usedIds[p.id]; });
        var col1_mini2 = todos.filter(function(p){ return ['economia','internacional'].indexOf(p.categoria) !== -1 && !usedIds[p.id]; });

        var col2_std3  = todos.filter(function(p){ return p.categoria === 'negocios' && !usedIds[p.id]; });
        var col2_std4  = todos.filter(function(p){ return p.categoria === 'investimentos' && !usedIds[p.id]; });
        var col2_mini3 = todos.filter(function(p){ return p.categoria === 'mercados' && !usedIds[p.id]; });
        var col2_mini4 = todos.filter(function(p){ return p.categoria === 'investimentos' && !usedIds[p.id]; });

        var col3_std5  = todos.filter(function(p){ return ['tributacao','regulacao'].indexOf(p.categoria) !== -1 && !usedIds[p.id]; });
        var col3_std6  = todos.filter(function(p){ return ['familia','saude','educacao'].indexOf(p.categoria) !== -1 && !usedIds[p.id]; });
        var col3_mini5 = todos.filter(function(p){ return ['educacao','familia','saude'].indexOf(p.categoria) !== -1 && !usedIds[p.id]; });

        // ════════════════════════════════════════════════════════════
        // NOVOS CARDS — Esportes, Tecnologia, Indústria
        // REGRA INVIOLÁVEL: só entra categoria específica, zero fallback
        // Bloqueadas aqui todas as categorias já alocadas acima
        // ════════════════════════════════════════════════════════════
        var col4_std7  = todos.filter(function(p){ return p.categoria === 'esportes' && !usedIds[p.id]; });
        var col4_mini6 = todos.filter(function(p){ return p.categoria === 'esportes' && !usedIds[p.id]; });
        var col5_std8  = todos.filter(function(p){ return p.categoria === 'tecnologia' && !usedIds[p.id]; });
        var col5_mini7 = todos.filter(function(p){ return p.categoria === 'tecnologia' && !usedIds[p.id]; });
        var col6_std9  = todos.filter(function(p){ return p.categoria === 'industria' && !usedIds[p.id]; });
        var col6_mini8 = todos.filter(function(p){ return p.categoria === 'industria' && !usedIds[p.id]; });

        // SEM FALLBACK — categoria errada nunca entra em card errado
        function pickFrom(pool){ for(var i=0;i<pool.length;i++){ if(!usedIds[pool[i].id]){ usedIds[pool[i].id]=true; return pool[i]; } } return null; }
        function pickCol(pool){ return pickFrom(pool); }

        // Coluna 1 — Política & Economia
        preencherCard(document.getElementById('ovc-card-std-1'), pickCol(col1_std));
        preencherCard(document.getElementById('ovc-card-std-2'), pickCol(col1_std));
        preencherMini(document.getElementById('ovc-card-mini-1'), pickCol(col1_mini1));
        preencherMini(document.getElementById('ovc-card-mini-2'), pickCol(col1_mini2));

        // Coluna 2 — Negócios, Investimentos & Mercados
        preencherCard(document.getElementById('ovc-card-std-3'), pickCol(col2_std3));
        preencherCard(document.getElementById('ovc-card-std-4'), pickCol(col2_std4));
        preencherMini(document.getElementById('ovc-card-mini-3'), pickCol(col2_mini3));
        preencherMini(document.getElementById('ovc-card-mini-4'), pickCol(col2_mini4));

        // Coluna 3 — Família, Saúde, Educação, Tributos & Regulação
        preencherCard(document.getElementById('ovc-card-std-5'), pickCol(col3_std5));
        preencherCard(document.getElementById('ovc-card-std-6'), pickCol(col3_std6));
        preencherMini(document.getElementById('ovc-card-mini-5'), pickCol(col3_mini5));
        // Bloco "Artigos técnicos" — ESTÁTICO, nunca tocado pelo JS

        // Esportes, Tecnologia & Indústria — REGRA INVIOLÁVEL: só categoria exata
        preencherCard(document.getElementById('ovc-card-std-7'), pickCol(col4_std7));
        preencherMini(document.getElementById('ovc-card-mini-6'), pickCol(col4_mini6));
        preencherCard(document.getElementById('ovc-card-std-8'), pickCol(col5_std8));
        preencherMini(document.getElementById('ovc-card-mini-7'), pickCol(col5_mini7));
        preencherCard(document.getElementById('ovc-card-std-9'), pickCol(col6_std9));
        preencherMini(document.getElementById('ovc-card-mini-8'), pickCol(col6_mini8));

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
