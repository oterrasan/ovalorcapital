(function(){
  'use strict';

  function normalize(value){
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function sectionIsGeneric(section){
    var s = normalize(section);
    return !s || s === 'geral' || s === 'home' || s === 'institucional';
  }

  function postMatchesSection(post, section){
    var target = normalize(section);
    if (!target) return true;
    var candidates = [
      post && post.subcategoria_slug,
      post && post.subcategoria,
      post && post.subcategoria_nome
    ].map(normalize).filter(Boolean);

    if (!candidates.length) return false;
    return candidates.some(function(candidate){
      return candidate === target ||
        candidate.indexOf(target) !== -1 ||
        target.indexOf(candidate) !== -1;
    });
  }

  var nativeFetch = window.fetch ? window.fetch.bind(window) : null;

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
      return new Date(value).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (_) {
      return '';
    }
  }

  function isColunistasPage(){
    return document.body && document.body.dataset && document.body.dataset.category === 'colunistas';
  }

  function normalizeColumnistsPage(){
    if (!isColunistasPage()) return;
    var blocked = ['gabriel-thiede', 'gabriel-tiede', 'fabiana-campos', 'fabiane-campos'];
    var path = location.pathname.split('/').filter(Boolean);

    if (path[0] === 'colunistas' && blocked.indexOf(normalize(path[1])) !== -1) {
      location.replace('/colunistas/');
      return;
    }

    document.querySelectorAll('.col-card').forEach(function(card){
      var text = normalize((card.getAttribute('onclick') || '') + ' ' + card.textContent);
      if (blocked.some(function(slug){ return text.indexOf(slug) !== -1; })) card.remove();
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
          return blocked.indexOf(normalize(post && post.subcategoria_slug)) === -1;
        }).slice(0, 5);
        if (!slot) return;
        slot.innerHTML = posts.length ? posts.map(function(post){
          return '<article class="ovc-mini-item"><div><h4><a href="' + (post.url || '#') + '">' + (post.titulo || 'Coluna OVC') + '</a></h4><p>' + (post.subcategoria || 'Colunistas') + '</p></div><div></div></article>';
        }).join('') : '<p style="font-size:13px;color:#64748b;margin:0">Conteudo em organizacao editorial.</p>';
      })
      .catch(function(){});
  }

  function forceColumnistProfile(){
    if (!isColunistasPage()) return;
    var path = location.pathname.split('/').filter(Boolean);
    var section = normalize(path[1] || (document.body && document.body.dataset && document.body.dataset.section));
    var blocked = ['gabriel-thiede', 'gabriel-tiede', 'fabiana-campos', 'fabiane-campos'];
    if (path[0] !== 'colunistas' || !section || sectionIsGeneric(section)) return;
    if (/-[a-f0-9]{8}$/i.test(section) || blocked.indexOf(section) !== -1) return;

    var filter = document.getElementById('col-filter-view');
    var grid = document.getElementById('col-grid-view');
    var articles = document.getElementById('cfv-arts');
    if (!filter || !grid || !articles) return;

    grid.style.display = 'none';
    filter.style.display = '';
    articles.innerHTML = '<p class="col-no-posts">Carregando artigos...</p>';

    var card = Array.prototype.find.call(document.querySelectorAll('.col-card'), function(item){
      return normalize((item.getAttribute('onclick') || '') + ' ' + item.innerHTML).indexOf(section) !== -1;
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
    if (bioEl) bioEl.textContent = bio || '';
    if (av && !av.querySelector('img')) {
      av.innerHTML = '<img src="/assets/colunistas/' + section + '.jpg" alt="' + escapeHtml(name || fallbackName) + '" loading="lazy" onerror="this.remove()">';
    }
    if (accent && tagEl) {
      tagEl.style.color = accent;
      tagEl.style.background = 'rgba(255,255,255,.14)';
    }

    var fetcher = nativeFetch || (window.fetch && window.fetch.bind(window));
    if (!fetcher) return;
    fetcher('/api/portal-posts?categoria=colunistas&limit=100')
      .then(function(r){ return r.json(); })
      .then(function(payload){
        var posts = ((payload && payload.posts) || []).filter(function(post){
          return postMatchesSection(post, section);
        });
        articles.innerHTML = posts.length ? posts.map(function(post){
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
      })
      .catch(function(){
        articles.innerHTML = '<p class="col-no-posts">Nao foi possivel carregar os artigos agora.</p>';
      });
  }

  var parts = location.pathname.split('/').filter(Boolean);
  if (parts[0] === 'colunistas' && parts[1] && /-[a-f0-9]{8}$/i.test(parts[1])) {
    return;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){
      normalizeColumnistsPage();
      forceColumnistProfile();
      setTimeout(normalizeColumnistsPage, 500);
      setTimeout(forceColumnistProfile, 650);
      setTimeout(normalizeColumnistsPage, 1200);
      setTimeout(forceColumnistProfile, 1300);
    });
  } else {
    normalizeColumnistsPage();
    forceColumnistProfile();
    setTimeout(normalizeColumnistsPage, 500);
    setTimeout(forceColumnistProfile, 650);
    setTimeout(normalizeColumnistsPage, 1200);
    setTimeout(forceColumnistProfile, 1300);
  }

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
        var section = body.dataset && body.dataset.section;
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
        }).catch(function(){
          return response;
        });
      } catch (_) {
        return response;
      }
    });
  };
})();
