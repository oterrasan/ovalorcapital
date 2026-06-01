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

  var parts = location.pathname.split('/').filter(Boolean);
  if (parts[0] === 'colunistas' && parts[1] && /-[a-f0-9]{8}$/i.test(parts[1])) {
    return;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){
      normalizeColumnistsPage();
      setTimeout(normalizeColumnistsPage, 500);
      setTimeout(normalizeColumnistsPage, 1200);
    });
  } else {
    normalizeColumnistsPage();
    setTimeout(normalizeColumnistsPage, 500);
    setTimeout(normalizeColumnistsPage, 1200);
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
