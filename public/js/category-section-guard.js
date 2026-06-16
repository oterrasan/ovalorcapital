(function(){
  'use strict';

  var blocked = [];
  var nativeFetch = window.fetch ? window.fetch.bind(window) : null;

  function normalize(value){
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
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

  function normalizeColunistasUrl(){
    if (!isColunistasPage()) return;
    var parts = pathParts();
    var qSection = querySection();
    var section = normalize(qSection);

    if (section && isBlocked(section)) {
      location.replace('/colunistas/');
      return;
    }

    // Redirect legacy ?c=slug to /colunistas/slug/
    if (parts[0] === 'colunistas' && !parts[1] && section && !sectionIsGeneric(section) && !isArticleSlug(section)) {
      try { history.replaceState(null, '', '/colunistas/' + encodeURIComponent(section) + '/'); } catch (_) {}
    }
  }

  var parts = pathParts();
  if (parts[0] === 'colunistas' && parts[1] && isArticleSlug(parts[1])) {
    return; // article page — no interception needed
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', normalizeColunistasUrl);
  } else {
    normalizeColunistasUrl();
  }

  // Fetch interceptor: filters colunista posts by active section (subcategoria_slug)
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
            return postMatchesSection(post, section);
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
