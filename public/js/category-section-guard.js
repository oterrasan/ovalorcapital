(function(){
  'use strict';

  var blocked = ['gabriel-thiede', 'gabriel-tiede', 'fabiana-campos', 'fabiane-campos'];
  var nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  var profileCache = null;
  var profileLoading = false;

  function normalize(value){
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function escapeHtml(value){
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(value){
    try {
      if (!value) return '';
      return new Date(value).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (_) {
      return '';
    }
  }

  function sectionIsGeneric(section){
    var s = normalize(section);
    return !s || s === 'geral' || s === 'home' || s === 'institucional';
  }

  function isArticleSlug(value){
    return /-[a-f0-9]{8}$/i.test(String(value || ''));
  }

  function pathParts(){
    return location.pathname.split('/').filter(Boolean);
  }

  function querySection(){
    try {
      var params = new URLSearchParams(location.search || '');
      return params.get('c') || params.get('colunista') || params.get('section') || '';
    } catch (_) {
      return '';
    }
  }

  function activeSection(){
    var parts = pathParts();
    var bodySection = document.body && document.body.dataset ? document.body.dataset.section : '';
    return normalize(parts[1] || querySection() || bodySection);
  }

  function isColunistasPage(){
    return document.body && document.body.dataset && document.body.dataset.category === 'colunistas';
  }

  function isBlocked(section){
    return blocked.indexOf(normalize(section)) !== -1;
  }

  function postMatchesSection(post, section){
    var target = normalize(section);
    if (!target) return true;
    var candidates = [
      post && post.subcategoria_slug,
      post && post.colunista_slug,
      post && post.autor_slug,
      post && post.author_slug,
      post && post.subcategoria,
      post && post.colunista,
      post && post.autor,
      post && post.author,
      post && post.nome_colunista
    ].map(normalize).filter(Boolean);

    if (!candidates.length) return false;
    return candidates.some(function(candidate){
      return candidate === target ||
        candidate.indexOf(target) !== -1 ||
        target.indexOf(candidate) !== -1;
    });
  }

  function normalizeColumnistsPage(){
    if (!isColunistasPage()) return;
    var parts = pathParts();
    var section = activeSection();

    if (parts[0] === 'colunistas' && isBlocked(section)) {
      location.replace('/colunistas/');
      return;
    }

    if (parts[0] === 'colunistas' && !parts[1] && section && !sectionIsGeneric(section) && !isArticleSlug(section)) {
      try { history.replaceState(null, '', '/colunistas/' + encodeURIComponent(section) + '/'); } catch (_) {}
      if (document.body && document.body.dataset) document.body.dataset.section = section;
    }

    document.querySelectorAll('.col-card').forEach(function(card){
      var text = normalize((card.getAttribute('onclick') || '') + ' ' + card.innerHTML + ' ' + card.textContent);
      if (blocked.some(function(slug){ return text.indexOf(slug) !== -1; })) {
        card.remove();
        return;
      }
      var href = card.querySelector('a[href*="/colunistas/?c="]');
      if (href) {
        var slug = '';
        try { slug = new URL(href.getAttribute('href'), location.origin).searchParams.get('c') || ''; } catch (_) {}
        if (slug) href.setAttribute('href', '/colunistas/' + normalize(slug) + '/');
      }
    });

    document.querySelectorAll('.col-stat-n').forEach(function(el){
      if ((el.textContent || '').trim() === '11') el.textContent = '9';
    });
    document.querySelectorAll('.col-hero-sub').forEach(function(el){
      el.textContent = (el.textContent || '').replace(/^11\s+colunistas\.?\s*/i, '');
    });
    document.querySelectorAll('.col-sec-lbl').forEach(function(el){
      el.textContent = (el.textContent || '').replace(/^11\s+/i, '');
    });

    var main = document.querySelector('main.ovc-main');
    if (!main || main.querySelector(':scope > .ovc-grid')) return;
    var children = Array.prototype.slice.call(main.children);
    var grid = document.createElement('section');
    var stack = document.createElement('div');
    var rail = document.createElement('aside');
    grid.className = 'ovc-grid';
    stack.className = 'ovc-story-stack';
    rail.className = 'ovc-right-rail';
    rail.innerHTML = '<section class="ovc-panel ovc-story-list"><h3>Ultimas colunas</h3><div class="ovc-mini-list" data-colunistas-guard-list><p style="font-size:13px;color:#64748b;margin:0">Carregando...</p></div></section><section class="ovc-panel ovc-story-list" style="margin-top:18px"><h3>OVC TV</h3><p style="font-size:13px;color:#64748b;line-height:1.55;margin:0 0 12px">Analises, entrevistas e especiais do portal.</p><a class="ovc-btn" href="/tv-ovc/" style="display:flex;justify-content:center">Assistir</a></section>';
    children.forEach(function(child){ stack.appendChild(child); });
    grid.appendChild(stack);
    grid.appendChild(rail);
    main.appendChild(grid);

    if (!nativeFetch) return;
    nativeFetch('/api/portal-posts?categoria=colunistas&limit=5')
      .then(function(r){ return r.json(); })
      .then(function(d){
        var slot = rail.querySelector('[data-colunistas-guard-list]');
        var posts = ((d && d.posts) || []).filter(function(post){
          return !isBlocked(post && (post.subcategoria_slug || post.colunista_slug));
        }).slice(0, 5);
        if (!slot) return;
        slot.innerHTML = posts.length ? posts.map(function(post){
          return '<article class="ovc-mini-item"><div><h4><a href="' + escapeHtml(post.url || '#') + '">' + escapeHtml(post.titulo || post.title || 'Coluna OVC') + '</a></h4><p>' + escapeHtml(post.subcategoria || 'Colunistas') + '</p></div><div></div></article>';
        }).join('') : '<p style="font-size:13px;color:#64748b;margin:0">Conteudo em organizacao editorial.</p>';
      })
      .catch(function(){});
  }

  function renderProfilePosts(posts, section){
    var articles = document.getElementById('cfv-arts');
    if (!articles) return;
    var filtered = posts.filter(function(post){ return postMatchesSection(post, section); });
    articles.innerHTML = filtered.length ? filtered.map(function(post){
      var image = post.imagem
        ? '<img class="col-art-img" src="' + escapeHtml(post.imagem) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">'
        : '';
      return '<a class="col-art-card" href="' + escapeHtml(post.url || '#') + '">'
        + image
        + '<div class="col-art-body">'
        + '<div class="col-art-ttl">' + escapeHtml(post.titulo || post.title || 'Coluna OVC') + '</div>'
        + '<div class="col-art-meta">' + escapeHtml(formatDate(post.data || post.published_at || post.created_at)) + '</div>'
        + '</div></a>';
    }).join('') : '<p class="col-no-posts">Nenhum artigo publicado ainda por este colunista.</p>';
  }

  function forceColumnistProfile(){
    if (!isColunistasPage()) return;
    var parts = pathParts();
    var section = activeSection();
    if (parts[0] !== 'colunistas' || !section || sectionIsGeneric(section)) return;
    if (isArticleSlug(section) || isBlocked(section)) return;

    var filter = document.getElementById('col-filter-view');
    var grid = document.getElementById('col-grid-view');
    var articles = document.getElementById('cfv-arts');
    if (!filter || !grid || !articles) return;

    grid.style.display = 'none';
    filter.style.display = '';
    if (!articles.querySelector('.col-art-card')) {
      articles.innerHTML = '<p class="col-no-posts">Carregando artigos...</p>';
    }

    var card = Array.prototype.find.call(document.querySelectorAll('.col-card'), function(item){
      return normalize((item.getAttribute('onclick') || '') + ' ' + item.innerHTML + ' ' + item.textContent).indexOf(section) !== -1;
    });
    var fallbackName = section.split('-').map(function(part){
      return part ? part.charAt(0).toUpperCase() + part.slice(1) : part;
    }).join(' ');
    var name = card ? (card.querySelector('.col-card-name') || {}).textContent : fallbackName;
    var tag = card ? (card.querySelector('.col-card-tag') || {}).innerHTML : 'Colunista OVC';
    var bio = card ? (card.querySelector('.col-card-bio') || {}).textContent : '';
    var accent = card ? ((card.querySelector('.col-card-tag') || {}).style || {}).color : '';

    var nameEl = document.getElementById('cfv-name');
    var tagEl = document.getElementById('cfv-tag');
    var bioEl = document.getElementById('cfv-bio');
    var av = document.getElementById('cfv-av');
    if (nameEl) nameEl.textContent = name || fallbackName;
    if (tagEl) tagEl.innerHTML = tag || 'Colunista OVC';
    if (bioEl && bio) bioEl.textContent = bio;
    if (av && !av.querySelector('img')) {
      av.innerHTML = '<img src="/assets/colunistas/' + section + '.jpg" alt="' + escapeHtml(name || fallbackName) + '" loading="lazy" onerror="this.remove()">';
    }
    if (accent && tagEl) {
      tagEl.style.color = accent;
      tagEl.style.background = 'rgba(255,255,255,.14)';
    }

    if (profileCache) {
      renderProfilePosts(profileCache, section);
      return;
    }
    if (profileLoading) return;
    var fetcher = nativeFetch || (window.fetch && window.fetch.bind(window));
    if (!fetcher) return;
    profileLoading = true;
    fetcher('/api/portal-posts?categoria=colunistas&limit=100')
      .then(function(r){ return r.json(); })
      .then(function(payload){
        profileCache = (payload && payload.posts) || [];
        renderProfilePosts(profileCache, section);
      })
      .catch(function(){
        articles.innerHTML = '<p class="col-no-posts">Nao foi possivel carregar os artigos agora.</p>';
      })
      .finally(function(){ profileLoading = false; });
  }

  function run(){
    normalizeColumnistsPage();
    forceColumnistProfile();
  }

  var parts = pathParts();
  if (parts[0] === 'colunistas' && parts[1] && isArticleSlug(parts[1])) {
    return;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  var ticks = 0;
  var interval = setInterval(function(){
    run();
    ticks += 1;
    if (ticks >= 24) clearInterval(interval);
  }, 500);

  try {
    var observer = new MutationObserver(function(){ run(); });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function(){ observer.disconnect(); }, 15000);
  } catch (_) {}

  if (!window.fetch || window.__OVC_SECTION_GUARD__) return;
  window.__OVC_SECTION_GUARD__ = true;
  nativeFetch = nativeFetch || window.fetch.bind(window);
  window.fetch = function(input, init){
    return nativeFetch(input, init).then(function(response){
      try {
        var url = typeof input === 'string' ? input : (input && input.url) || '';
        var parsed = new URL(url, window.location.origin);
        if (parsed.pathname !== '/api/portal-posts') return response;
        if (!parsed.searchParams.has('categoria')) return response;

        var body = document.body || {};
        var category = body.dataset && body.dataset.category;
        var section = activeSection();
        if (!category || sectionIsGeneric(section)) return response;
        if (normalize(parsed.searchParams.get('categoria')) !== normalize(category)) return response;

        return response.clone().json().then(function(payload){
          if (!payload || !Array.isArray(payload.posts)) return response;
          var filtered = payload.posts.filter(function(post){
            return normalize(post && post.categoria) === normalize(category) &&
              postMatchesSection(post, section);
          });
          var headers = new Headers(response.headers);
          headers.set('Content-Type', 'application/json; charset=utf-8');
          return new Response(JSON.stringify(Object.assign({}, payload, {
            posts: filtered,
            total: filtered.length
          })), {
            status: response.status,
            statusText: response.statusText,
            headers: headers
          });
        }).catch(function(){ return response; });
      } catch (_) {
        return response;
      }
    });
  };
})();
