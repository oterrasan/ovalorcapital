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
      'body[data-category="colunistas"] main > .ovc-grid{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:24px!important;align-items:start!important;max-width:1400px!important;margin:0 auto!important;padding:22px 24px 36px!important;box-sizing:border-box!important}',
      'body[data-category="colunistas"] .ovc-story-stack{min-width:0!important;display:flex!important;flex-direction:column!important;gap:18px!important}',
      'body[data-category="colunistas"] .ovc-right-rail{display:none!important}',
      '.col-hero{background:#07111e!important;padding:26px 30px!important;margin:0!important;position:relative!important;overflow:hidden!important;border-bottom:1px solid rgba(15,23,42,.08)!important;text-align:left!important;box-sizing:border-box!important;border-radius:8px!important;min-height:0!important}',
      '.col-hero:before{content:""!important;position:absolute!important;inset:0!important;background:linear-gradient(90deg,rgba(255,200,0,.10),transparent 34%,rgba(200,30,30,.14))!important;pointer-events:none!important}',
      '.col-hero:after{content:""!important;position:absolute!important;inset:0!important;background-image:linear-gradient(rgba(255,255,255,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px)!important;background-size:28px 28px!important;opacity:.18!important;pointer-events:none!important}',
      '.col-hero-grid{position:relative!important;z-index:1!important;max-width:none!important;margin:0!important;display:grid!important;grid-template-columns:1fr!important;gap:14px!important;align-items:start!important}',
      '.col-hero-copy{display:flex!important;flex-direction:column!important;justify-content:center!important;min-height:0!important}.col-hero-eye{position:relative!important;z-index:1!important;font-size:10px!important;font-weight:900!important;letter-spacing:.18em!important;text-transform:uppercase!important;color:#ffc800!important;margin:0 0 10px!important}',
      '.col-hero h1{position:relative!important;z-index:1!important;font-size:clamp(26px,2.8vw,38px)!important;font-weight:950!important;color:#fff!important;margin:0 0 12px!important;line-height:1.04!important;max-width:720px!important;letter-spacing:0!important;text-align:left!important}.col-hero-sub{position:relative!important;z-index:1!important;font-size:14.5px!important;color:#cbd5e1!important;max-width:760px!important;margin:0 0 18px!important;line-height:1.55!important;text-align:left!important}',
      '.col-hero-panel{display:none!important}.col-hero-stats{position:relative!important;z-index:1!important;display:flex!important;justify-content:flex-start!important;gap:12px!important;flex-wrap:wrap!important}',
      '.col-stat{display:flex!important;flex-direction:column!important;min-width:128px!important;background:rgba(255,255,255,.07)!important;border:1px solid rgba(255,255,255,.11)!important;border-radius:8px!important;padding:12px 14px!important}.col-stat-n{font-size:28px!important;font-weight:950!important;color:#ffc800!important;line-height:1!important}.col-stat-l{font-size:10px!important;color:#94a3b8!important;margin-top:6px!important;text-transform:uppercase!important;letter-spacing:.08em!important}',
      '.col-card{display:grid!important;grid-template-columns:132px minmax(0,1fr)!important;background:#07111e!important;border:1px solid rgba(15,23,42,.18)!important;border-radius:8px!important;overflow:hidden!important;box-shadow:0 10px 28px rgba(15,23,42,.12)!important;transition:transform .18s,box-shadow .18s,border-color .18s!important;cursor:pointer!important;min-height:228px!important}.col-card:hover{transform:translateY(-3px)!important;box-shadow:0 16px 36px rgba(15,23,42,.18)!important;border-color:rgba(200,30,30,.42)!important}',
      '.col-card-cover{height:auto!important;min-height:228px!important;position:relative!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:17px!important;overflow:hidden!important}.col-card-av{position:relative!important;width:100px!important;height:138px!important;border-radius:8px!important;border:1px solid rgba(255,255,255,.26)!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:26px!important;font-weight:950!important;color:#fff!important;box-shadow:0 12px 30px rgba(0,0,0,.36)!important;overflow:hidden!important;flex-shrink:0!important;z-index:1!important;background:#0f172a!important;margin:0!important}.col-card-av img{width:100%!important;height:100%!important;object-fit:cover!important}',
      '.col-card-body{padding:20px 20px 18px!important;display:flex!important;flex-direction:column!important;gap:9px!important;text-align:left!important}.col-card-name{font-size:18px!important;font-weight:950!important;color:#fff!important;line-height:1.15!important}.col-card-tag{display:inline-block!important;font-size:10px!important;font-weight:900!important;letter-spacing:.08em!important;text-transform:uppercase!important;padding:4px 9px!important;border-radius:4px!important;align-self:flex-start!important}.col-card-bio{font-size:13px!important;color:#cbd5e1!important;line-height:1.58!important;margin:0!important}.col-card-foot{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:12px!important;padding-top:13px!important;border-top:1px solid rgba(255,255,255,.10)!important;margin-top:auto!important}.col-card-cnt{font-size:11.5px!important;color:#94a3b8!important}.col-card-cnt b{color:#ffc800!important}.col-card-btn{font-size:11.5px!important;font-weight:900!important;padding:7px 12px!important;border-radius:6px!important;text-decoration:none!important;color:#07111e!important;background:#ffc800!important;white-space:nowrap!important}',
      '.col-cta-box{background:#07111e!important;border:1px solid rgba(15,23,42,.16)!important;border-radius:8px!important;padding:28px 30px!important;text-align:left!important;margin:10px 0 38px!important;display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:22px!important;align-items:center!important}.col-cta-title{color:#fff!important}.col-cta-sub{color:#cbd5e1!important}.col-cta-btn{background:#ffc800!important;color:#0f172a!important;border-radius:6px!important}',
      '@media(max-width:1100px){body[data-category="colunistas"] main > .ovc-grid{grid-template-columns:1fr!important}.ovc-right-rail{position:static!important}.col-hero-grid{grid-template-columns:1fr!important}.col-card{grid-template-columns:1fr!important}.col-card-cover{min-height:180px!important}.col-card-av{width:112px!important;height:150px!important}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function ensureRails(){
    var main = document.querySelector('main.ovc-main') || document.querySelector('main');
    if (!main) return;
    if (!main.classList.contains('ovc-main')) main.classList.add('ovc-main');
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
    right.innerHTML = '';
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

    // Remove blocked columnists from sidebar
    document.querySelectorAll('a[href]').forEach(function(a){
      var href = a.getAttribute('href') || '';
      var text = plain(a.textContent);
      if (blockedSlugs.some(function(s){ return href.indexOf(s) !== -1; }) || blockedNames.some(function(n){ return text.indexOf(n) !== -1; })) {
        var li = a.closest('li');
        if (li) li.remove(); else a.remove();
      }
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