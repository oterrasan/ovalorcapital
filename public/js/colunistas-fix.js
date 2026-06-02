(function(){
  'use strict';
  if (window.__OVC_COLUNISTAS_FIX__) return;
  window.__OVC_COLUNISTAS_FIX__ = true;

  var blockedSlugs = ['gabriel-thiede', 'gabriel-tiede', 'fabiana-campos', 'fabiane-campos'];
  var blockedNames = ['gabriel thiede', 'gabriel tiede', 'fabiana campos', 'fabiane campos'];
  var columnists = {
    'roberto-terrasan': {name:'Roberto Terrasan', color:'#c81e1e'},
    'beta-ferreira': {name:'Beta Ferreira', color:'#7b1fa2'},
    'adriana-ferreira': {name:'Adriana Ferreira', color:'#1565c0'},
    'michele-froiz': {name:'Michele Froiz', color:'#00695c'},
    'coluna-ovc': {name:'Coluna OVC', color:'#455a64'},
    'prof-marcos-pizzolatto': {name:'Prof. Marcos Pizzolatto', color:'#283593'},
    'larissa-corvetto': {name:'Larissa Corvetto', color:'#ad1457'},
    'taisa-da-fonseca': {name:'Ta\u00edsa da Fonseca', color:'#8e24aa'},
    'andre-oliveira': {name:'Andr\u00e9 Oliveira', color:'#546e7a'}
  };

  function plain(value){
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function isColunistas(){
    return document.body && document.body.dataset && document.body.dataset.category === 'colunistas';
  }

  function addStyle(){
    if (document.getElementById('ovc-colunistas-premium-fix')) return;
    var style = document.createElement('style');
    style.id = 'ovc-colunistas-premium-fix';
    style.textContent = [
      '.col-hero{background:#07111e!important;padding:34px 28px 36px!important;position:relative!important;overflow:hidden!important;border-bottom:1px solid rgba(15,23,42,.08)!important}',
      '.col-hero:before{content:""!important;position:absolute!important;inset:0!important;background:linear-gradient(90deg,rgba(255,200,0,.10),transparent 34%,rgba(200,30,30,.14))!important;pointer-events:none!important}',
      '.col-hero:after{content:""!important;position:absolute!important;inset:0!important;background-image:linear-gradient(rgba(255,255,255,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px)!important;background-size:28px 28px!important;opacity:.18!important;pointer-events:none!important}',
      '.col-hero-grid{position:relative!important;z-index:1!important;max-width:1280px!important;margin:0 auto!important;display:grid!important;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr)!important;gap:26px!important;align-items:stretch!important}',
      '.col-hero-copy{display:flex!important;flex-direction:column!important;justify-content:center!important;min-height:258px!important}.col-hero-eye{font-size:11px!important;font-weight:900!important;letter-spacing:.18em!important;text-transform:uppercase!important;color:#ffc800!important;margin-bottom:12px!important}',
      '.col-hero h1{font-size:clamp(32px,4.4vw,58px)!important;font-weight:950!important;color:#fff!important;margin:0 0 14px!important;line-height:.98!important;max-width:760px!important;letter-spacing:0!important}.col-hero-sub{font-size:16px!important;color:#cbd5e1!important;max-width:680px!important;margin:0 0 26px!important;line-height:1.55!important}',
      '.col-stat{display:flex!important;flex-direction:column!important;min-width:128px!important;background:rgba(255,255,255,.07)!important;border:1px solid rgba(255,255,255,.11)!important;border-radius:8px!important;padding:12px 14px!important}.col-stat-n{font-size:28px!important;font-weight:950!important;color:#ffc800!important;line-height:1!important}.col-stat-l{font-size:10px!important;color:#94a3b8!important;margin-top:6px!important;text-transform:uppercase!important;letter-spacing:.08em!important}',
      '.col-card{display:grid!important;grid-template-columns:132px minmax(0,1fr)!important;background:#07111e!important;border:1px solid rgba(15,23,42,.18)!important;border-radius:8px!important;overflow:hidden!important;box-shadow:0 10px 28px rgba(15,23,42,.12)!important;transition:transform .18s,box-shadow .18s,border-color .18s!important;cursor:pointer!important;min-height:228px!important}.col-card:hover{transform:translateY(-3px)!important;box-shadow:0 16px 36px rgba(15,23,42,.18)!important;border-color:rgba(200,30,30,.42)!important}',
      '.col-card-cover{height:auto!important;min-height:228px!important;position:relative!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:17px!important;overflow:hidden!important}.col-card-av{position:relative!important;width:100px!important;height:138px!important;border-radius:8px!important;border:1px solid rgba(255,255,255,.26)!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:26px!important;font-weight:950!important;color:#fff!important;box-shadow:0 12px 30px rgba(0,0,0,.36)!important;overflow:hidden!important;flex-shrink:0!important;z-index:1!important;background:#0f172a!important;margin:0!important}.col-card-av img{width:100%!important;height:100%!important;object-fit:cover!important}',
      '.col-card-body{padding:20px 20px 18px!important;display:flex!important;flex-direction:column!important;gap:9px!important;text-align:left!important}.col-card-name{font-size:18px!important;font-weight:950!important;color:#fff!important;line-height:1.15!important}.col-card-tag{display:inline-block!important;font-size:10px!important;font-weight:900!important;letter-spacing:.08em!important;text-transform:uppercase!important;padding:4px 9px!important;border-radius:4px!important;align-self:flex-start!important}.col-card-bio{font-size:13px!important;color:#cbd5e1!important;line-height:1.58!important;margin:0!important}.col-card-foot{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:12px!important;padding-top:13px!important;border-top:1px solid rgba(255,255,255,.10)!important;margin-top:auto!important}.col-card-cnt{font-size:11.5px!important;color:#94a3b8!important}.col-card-cnt b{color:#ffc800!important}.col-card-btn{font-size:11.5px!important;font-weight:900!important;padding:7px 12px!important;border-radius:6px!important;text-decoration:none!important;color:#07111e!important;background:#ffc800!important;white-space:nowrap!important}',
      '.col-cta-box{background:#07111e!important;border:1px solid rgba(15,23,42,.16)!important;border-radius:8px!important;padding:28px 30px!important;text-align:left!important;margin:10px 0 38px!important;display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:22px!important;align-items:center!important}.col-cta-title{color:#fff!important}.col-cta-sub{color:#cbd5e1!important}.col-cta-btn{background:#ffc800!important;color:#0f172a!important;border-radius:6px!important}',
      '@media(max-width:900px){.col-hero-grid{grid-template-columns:1fr!important}.col-card{grid-template-columns:1fr!important}.col-card-cover{min-height:180px!important}.col-card-av{width:112px!important;height:150px!important}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function ensureRails(){
    var main = document.querySelector('main.ovc-main');
    if (!main) return;
    var grid = main.querySelector(':scope > .ovc-grid');
    if (!grid) {
      var children = Array.prototype.slice.call(main.children);
      grid = document.createElement('section');
      grid.className = 'ovc-grid';
      var stack = document.createElement('div');
      stack.className = 'ovc-story-stack';
      var rail = document.createElement('aside');
      rail.className = 'ovc-right-rail';
      children.forEach(function(child){ stack.appendChild(child); });
      grid.appendChild(stack);
      grid.appendChild(rail);
      main.appendChild(grid);
    }
    var right = grid.querySelector('.ovc-right-rail');
    if (!right || right.dataset.colunistasRailReady === '1') return;
    right.dataset.colunistasRailReady = '1';
    right.innerHTML = '<section class="ovc-panel ovc-story-list"><h3>\u00daltimas colunas</h3><div data-colunistas-latest><p style="font-size:13px;color:#64748b;margin:0">Carregando...</p></div></section>'
      + '<section class="ovc-panel ovc-story-list" style="margin-top:18px"><h3>Mais lidas</h3><div data-colunistas-popular><p style="font-size:13px;color:#64748b;margin:0">Carregando...</p></div></section>'
      + '<section class="ovc-panel ovc-story-list" style="margin-top:18px"><h3>OVC TV</h3><p style="font-size:13px;color:#64748b;line-height:1.55;margin:0 0 12px">An\u00e1lises, entrevistas e especiais do portal.</p><a class="ovc-btn" href="/tv-ovc/" style="display:flex;justify-content:center">Assistir</a></section>';

    function mini(posts){
      if (!posts.length) return '<p style="font-size:13px;color:#64748b;line-height:1.55;margin:0">Conte\u00fado em organiza\u00e7\u00e3o editorial.</p>';
      return '<div class="ovc-mini-list">' + posts.map(function(post){
        var href = post.url || '#';
        return '<article class="ovc-mini-item"><div><h4><a href="' + href + '">' + (post.titulo || 'Coluna OVC') + '</a></h4><p>' + (post.subcategoria || 'Colunistas') + '</p></div><div></div></article>';
      }).join('') + '</div>';
    }

    fetch('/api/portal-posts?categoria=colunistas&limit=5').then(function(r){ return r.json(); }).then(function(d){
      var slot = right.querySelector('[data-colunistas-latest]');
      var posts = ((d && d.posts) || []).filter(function(post){ return blockedSlugs.indexOf(post.subcategoria_slug) === -1; }).slice(0, 5);
      if (slot) slot.innerHTML = mini(posts);
    }).catch(function(){});

    fetch('/api/portal-posts?sort=popular&limit=5').then(function(r){ return r.json(); }).then(function(d){
      var slot = right.querySelector('[data-colunistas-popular]');
      if (slot) slot.innerHTML = mini(((d && d.posts) || []).slice(0, 5));
    }).catch(function(){});
  }

  function normalizeCards(){
    document.querySelectorAll('.col-card').forEach(function(card){
      var hrefText = plain(card.getAttribute('onclick') || card.innerHTML);
      var text = plain(card.textContent);
      if (blockedSlugs.some(function(slug){ return hrefText.indexOf(slug) !== -1; }) || blockedNames.some(function(name){ return text.indexOf(name) !== -1; })) {
        card.remove();
        return;
      }
      var slug = Object.keys(columnists).find(function(key){ return hrefText.indexOf(key) !== -1 || text.indexOf(plain(columnists[key].name)) !== -1; });
      if (!slug) return;
      var url = '/colunistas/' + slug + '/';
      card.onclick = function(){ location.href = url; };
      card.setAttribute('role', 'link');
      card.setAttribute('tabindex', '0');
      card.onkeydown = function(event){ if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); location.href = url; } };
      var btn = card.querySelector('.col-card-btn');
      if (btn) btn.href = url;
      var av = card.querySelector('.col-card-av');
      if (av && !av.querySelector('img')) av.innerHTML = '<img src="/assets/colunistas/' + slug + '.jpg" alt="' + columnists[slug].name + '" loading="lazy" onerror="this.remove()">';
      var tag = card.querySelector('.col-card-tag');
      if (tag) { tag.style.background = columnists[slug].color; tag.style.color = '#fff'; }
    });

    document.querySelectorAll('.col-stat-n').forEach(function(stat){ if ((stat.textContent || '').trim() === '11') stat.textContent = '9'; });
    var heroTitle = document.querySelector('.col-hero h1');
    if (heroTitle) heroTitle.textContent = 'As vozes que formam opini\u00e3o.';
    var heroSub = document.querySelector('.col-hero-sub');
    if (heroSub) heroSub.textContent = 'An\u00e1lise assinada, leitura de conjuntura e opini\u00e3o com responsabilidade editorial dentro do ecossistema O Valor Capital.';
    var firstStat = document.querySelector('.col-stat:first-child .col-stat-n');
    if (firstStat) firstStat.textContent = '9';
    var firstStatLabel = document.querySelector('.col-stat:first-child .col-stat-l');
    if (firstStatLabel) firstStatLabel.textContent = 'Colunistas ativos';
    var secLabel = document.querySelector('.col-sec-lbl');
    if (secLabel && !secLabel.querySelector('.col-sec-title')) secLabel.innerHTML = '<div><div class="col-sec-title">Colunistas e articulistas</div><div class="col-sec-sub">Perfis ativos do O Valor Capital</div></div><a href="/colunistas/" style="font-size:12px;font-weight:900;color:#b8860b;text-decoration:none">Ver todos</a>';
  }

  function run(){
    if (!isColunistas()) return;
    addStyle();
    ensureRails();
    normalizeCards();
    setTimeout(function(){ addStyle(); ensureRails(); normalizeCards(); }, 450);
    setTimeout(function(){ addStyle(); ensureRails(); normalizeCards(); }, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();