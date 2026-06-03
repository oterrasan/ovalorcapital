(function(){
  'use strict';

  var WA_BASE = 'https://wa.me/5511988510361';

  function detectCat(){
    if(window.__OVC_ARTICLE__ && window.__OVC_ARTICLE__.categoria) return window.__OVC_ARTICLE__.categoria;
    var segs = location.pathname.split('/').filter(Boolean);
    return segs[0] || 'geral';
  }

  function waUrl(msg, cat, id){
    var full = msg + ' | OVC/' + cat + ' | ref:' + id;
    return WA_BASE + '?text=' + encodeURIComponent(full);
  }

  function waSvg(){
    return '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="flex-shrink:0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
  }

  function renderRect(b, cat){
    var url = waUrl(b.whatsapp_msg, cat, b.id);
    return '<div style="font-family:system-ui,-apple-system,sans-serif;background:linear-gradient(135deg,#0A192F 0%,#0d1f3c 100%);border-radius:12px;padding:22px 24px;margin:32px auto;max-width:460px;border:1px solid rgba(212,175,55,0.22);box-shadow:0 4px 28px rgba(0,0,0,0.22);">'
      +'<div style="font-size:9px;text-transform:uppercase;letter-spacing:.14em;color:rgba(212,175,55,0.55);margin-bottom:12px;">Publicidade · Lions Corretora de Seguros</div>'
      +'<div style="font-size:17px;font-weight:800;color:#fff;line-height:1.3;margin-bottom:8px;">'+b.headline+'</div>'
      +'<div style="font-size:12px;color:rgba(255,255,255,0.65);line-height:1.55;margin-bottom:18px;">'+b.subheadline+'</div>'
      +'<a href="'+url+'" target="_blank" rel="noopener sponsored" style="display:inline-flex;align-items:center;gap:8px;background:#25D366;color:#fff;font-size:12px;font-weight:800;text-decoration:none;padding:11px 22px;border-radius:8px;text-transform:uppercase;letter-spacing:.05em;">'
      +waSvg()+b.cta+'</a>'
      +'</div>';
  }

  function renderLeaderboard(b, cat){
    var url = waUrl(b.whatsapp_msg, cat, b.id);
    return '<div style="font-family:system-ui,-apple-system,sans-serif;background:linear-gradient(90deg,#0A192F 0%,#0f2645 100%);border-radius:10px;padding:14px 24px;margin:20px 0;border:1px solid rgba(212,175,55,0.18);box-shadow:0 2px 16px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">'
      +'<div style="display:flex;flex-direction:column;gap:2px;min-width:0;">'
        +'<div style="font-size:8px;text-transform:uppercase;letter-spacing:.14em;color:rgba(212,175,55,0.5);">Publicidade · Lions Corretora</div>'
        +'<div style="font-size:15px;font-weight:800;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:520px;">'+b.headline+'</div>'
      +'</div>'
      +'<a href="'+url+'" target="_blank" rel="noopener sponsored" style="display:inline-flex;align-items:center;gap:7px;background:#25D366;color:#fff;font-size:12px;font-weight:800;text-decoration:none;padding:9px 18px;border-radius:7px;flex-shrink:0;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;">'
      +waSvg()+b.cta+'</a>'
      +'</div>';
  }

  function injectArticle(b, cat){
    if(document.getElementById('ovc-banner-article')) return;
    var wrap = document.createElement('aside');
    wrap.id = 'ovc-banner-article';
    wrap.setAttribute('aria-label', 'Conteúdo patrocinado');
    wrap.innerHTML = renderRect(b, cat);
    var selectors = ['#article-body','#post-content','.article-body','.post-body','article','main'];
    for(var i=0;i<selectors.length;i++){
      var el = document.querySelector(selectors[i]);
      if(el && el.parentNode){ el.parentNode.insertBefore(wrap, el.nextSibling); return; }
    }
    document.body.appendChild(wrap);
  }

  function injectHome(b, cat){
    // Fill the pre-allocated slot (avoids insertBefore CLS)
    var wrap = document.getElementById('ovc-banner-home');
    if(!wrap || wrap.innerHTML.trim()) return;
    wrap.innerHTML = renderLeaderboard(b, cat);
  }

  function removeExtraColumnistsBlock(){
    if(location.pathname !== '/' && location.pathname !== '/index.html') return;
    var block = document.getElementById('ovc-colunistas-346');
    if(block) block.remove();
  }

  function init(){
    removeExtraColumnistsBlock();
    setTimeout(removeExtraColumnistsBlock, 400);
    setTimeout(removeExtraColumnistsBlock, 1200);
    var cat = detectCat();
    fetch('/api/manage?action=banners&cat='+encodeURIComponent(cat))
      .then(function(r){ return r.json(); })
      .then(function(d){
        var list = d.banners||[];
        if(!list.length) return;
        var b = list[0];
        if(window.__OVC_ARTICLE__) injectArticle(b, cat);
        else injectHome(b, cat);
      }).catch(function(){});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){ setTimeout(init,400); });
  else setTimeout(init,400);

})();
