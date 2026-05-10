(function(){
  'use strict';

  var BLOCKED = [
    /perfil/i,/author/i,/avatar/i,/reporter/i,/profile/i,/headshot/i,
    /\/autores?\//i,/\/pessoas?\//i,/columnist/i,/byline/i,/editor/i,
    /icon/i,/logo/i,/favicon/i,/sprite/i,/watermark/i,/\.svg$/i,/\.gif$/i,/\.ico$/i
  ];
  function imgOk(url){
    if(!url||url.length<12) return false;
    return !BLOCKED.some(function(r){ return r.test(url); });
  }

  function dataBr(s){
    if(!s) return '';
    var d = new Date(s);
    if(isNaN(d)) return '';
    return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});
  }

  function slugify(s){
    return (s||'').toLowerCase().normalize('NFD')
      .replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9\s-]/g,'')
      .trim().replace(/\s+/g,'-').slice(0,55);
  }

  function buildUrl(p){
    var sl = p.slug ? p.slug.slice(0,55) : slugify(p.titulo||'');
    var id8 = (p.id||'').slice(0,8);
    return '/vc/' + sl + '-' + id8 + '/';
  }

  function esc(s){
    return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function bigCard(p){
    var url = buildUrl(p);
    var img = p.imagem && imgOk(p.imagem) ? p.imagem : '';
    return '<a href="'+url+'" style="'
      +'position:relative;border-radius:14px;overflow:hidden;min-height:240px;'
      +'display:flex;flex-direction:column;justify-content:flex-end;padding:20px;'
      +'text-decoration:none;cursor:pointer;'
      +(img?'background:url(\''+img+'\') center/cover;':'background:linear-gradient(135deg,#0f172a 0%,#1a0a2e 100%);')
      +'box-shadow:0 4px 20px rgba(0,0,0,0.18);'
      +'transition:transform 0.22s,box-shadow 0.22s;" '
      +'onmouseover="this.style.transform=\'translateY(-4px)\';this.style.boxShadow=\'0 14px 36px rgba(0,0,0,0.28)\'" '
      +'onmouseout="this.style.transform=\'\';this.style.boxShadow=\'0 4px 20px rgba(0,0,0,0.18)\'" '
      +'aria-label="'+esc(p.titulo)+'">' 
      +'<div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.93) 0%,rgba(0,0,0,0.38) 55%,rgba(0,0,0,0.06) 100%);border-radius:14px;"></div>'
      +'<div style="position:relative;z-index:1;display:flex;flex-direction:column;gap:8px;">'
        +'<span style="background:#b8860b;color:#fff;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;padding:3px 10px;border-radius:4px;width:fit-content;">Opinião</span>'
        +'<h2 style="font-size:17px;font-weight:800;color:#fff;margin:0;line-height:1.3;text-shadow:0 2px 10px rgba(0,0,0,0.7);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">'+esc(p.titulo)+'</h2>'
        +'<span style="font-size:11px;color:rgba(255,255,255,0.5);">Redação OVC · '+dataBr(p.data)+'</span>'
      +'</div>'
    +'</a>';
  }

  function smallCard(p){
    var url = buildUrl(p);
    var img = p.imagem && imgOk(p.imagem) ? p.imagem : '';
    return '<a href="'+url+'" style="'
      +'display:flex;gap:12px;align-items:flex-start;padding:12px 14px;'
      +'text-decoration:none;border-radius:10px;'
      +'transition:background 0.18s;" '
      +'onmouseover="this.style.background=\'#f8f7f3\'" '
      +'onmouseout="this.style.background=\'\'">'
      +(img
        ?'<div style="width:72px;height:56px;border-radius:8px;overflow:hidden;flex-shrink:0;">'
          +'<img src="'+img+'" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" onerror="this.parentNode.style.display=\'none\';">'
          +'</div>'
        :'<div style="width:8px;flex-shrink:0;"><div style="width:3px;height:100%;background:#b8860b;border-radius:2px;margin-top:4px;"></div></div>'
      )
      +'<div style="display:flex;flex-direction:column;gap:4px;min-width:0;">'
        +'<span style="background:rgba(184,134,11,0.12);color:#92670a;font-size:8px;font-weight:900;text-transform:uppercase;padding:2px 7px;border-radius:3px;width:fit-content;">Opinião</span>'
        +'<p style="font-size:12px;font-weight:700;color:#0f172a;margin:0;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">'+esc(p.titulo)+'</p>'
        +'<span style="font-size:10px;color:#94a3b8;">'+dataBr(p.data)+'</span>'
      +'</div>'
    +'</a>';
  }

  function render(posts){
    var container = document.getElementById('ovc-cards-section');
    if(!container) return;
    if(document.getElementById('ovc-colunistas-346')) return;

    var big   = posts.slice(0,3);
    var small = posts.slice(3,6);
    if(!big.length) return;

    var sec = document.createElement('section');
    sec.id  = 'ovc-colunistas-346';
    sec.setAttribute('aria-label','Colunistas & Opinião OVC');
    sec.style.cssText = 'margin:0 0 36px 0;';

    // Cabeçalho da seção
    var header = '<div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">'
      +'<div style="width:4px;height:26px;background:#b8860b;border-radius:2px;flex-shrink:0;"></div>'
      +'<div>'
        +'<div style="font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:.12em;color:#0f172a;line-height:1;">Colunistas & Opinião</div>'
        +'<div style="font-size:10px;color:#94a3b8;font-weight:500;margin-top:2px;">Análise, crônica e opinião autoral</div>'
      +'</div>'
      +'<span style="flex:1;height:1px;background:linear-gradient(to right,#b8860b44,transparent);"></span>'
      +'<a href="/vc/" style="font-size:11px;color:#b8860b;font-weight:700;text-decoration:none;white-space:nowrap;border:1px solid #b8860b33;padding:5px 12px;border-radius:6px;">Ver todos →</a>'
      +'</div>';

    // Linha 1: 3 cards grandes
    var row1 = '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-bottom:12px;">'
      + big.map(bigCard).join('')
      +'</div>';

    // Linha 2: 3 cards pequenos (só se houver conteúdo)
    var row2 = '';
    if(small.length){
      row2 = '<div style="background:#fff;border:1px solid #f1f0ea;border-radius:12px;overflow:hidden;">'
        +'<div style="display:grid;grid-template-columns:repeat('+Math.min(small.length,3)+',minmax(0,1fr));gap:0;">'
        + small.map(function(p,i){
            return '<div style="'+(i>0?'border-left:1px solid #f1f0ea;':'')+'">'+smallCard(p)+'</div>';
          }).join('')
        +'</div>'
      +'</div>';
    }

    sec.innerHTML = header + row1 + row2;
    container.parentNode.insertBefore(sec, container);
  }

  function load(){
    if(document.getElementById('ovc-colunistas-346')) return;
    fetch('/api/portal-posts?categoria=vc&limit=6')
      .then(function(r){ return r.json(); })
      .then(function(d){
        var posts = (d.posts||[]).filter(function(p){ return p.titulo; }).slice(0,6);
        if(posts.length) render(posts);
      })
      .catch(function(){});
  }

  document.addEventListener('DOMContentLoaded', load);
})();
