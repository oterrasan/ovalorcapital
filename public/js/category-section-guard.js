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

  if (!window.fetch || window.__OVC_SECTION_GUARD__) return;
  window.__OVC_SECTION_GUARD__ = true;

  var nativeFetch = window.fetch.bind(window);
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
