(function(){
  'use strict';

  var CORES = {
    politica:'#dc2626', economia:'#2563eb', negocios:'#7c3aed',
    investimentos:'#059669', mercados:'#0891b2', tributacao:'#b45309',
    regulacao:'#9333ea', seguros:'#0284c7', saude:'#16a34a',
    familia:'#db2777', tecnologia:'#6366f1', industria:'#ea580c',
    educacao:'#8b5cf6', esportes:'#16a34a', internacional:'#dc2626',
    variedades:'#ec4899', parcerias:'#14b8a6', vc:'#ffc800',
    investigativo:'#1a1a2e', seguranca:'#7f1d1d', cultura:'#7e22ce',
    profissoes:'#0369a1', vagas:'#065f46', concursos:'#1e40af',
    imoveis:'#b45309', esg:'#166534', defesa:'#1e3a5f', religiao:'#6d28d9'
  };
  var LABELS = {
    politica:'Política', economia:'Economia', negocios:'Negócios',
    investimentos:'Investimentos', mercados:'Mercados', tributacao:'Tributação',
    regulacao:'Regulação', seguros:'Seguros', saude:'Saúde', familia:'Família',
    tecnologia:'Tecnologia', industria:'Indústria', educacao:'Educação',
    esportes:'Esportes', internacional:'Internacional', variedades:'Variedades',
    parcerias:'Parcerias', vc:'OVC', investigativo:'Investigativo',
    seguranca:'Seg. Pública', cultura:'Cultura', profissoes:'Profissões',
    vagas:'Vagas', concursos:'Concursos', imoveis:'Imóveis',
    esg:'ESG', defesa:'Defesa', religiao:'Religião'
  };

  var debounceTimer = null;

  function buildUrl(p) {
    var catPath = {
      politica:'politica', economia:'economia', negocios:'negocios',
      investimentos:'investimentos', seguros:'seguros', mercados:'mercados',
      educacao:'educacao', industria:'industria', tecnologia:'tecnologia',
      esportes:'esportes', saude:'saude', familia:'familia',
      tributacao:'tributos', regulacao:'regulacao', parcerias:'parcerias',
      vc:'vc', colunistas:'vc', internacional:'internacional',
      variedades:'variedades', geral:'politica',
      investigativo:'investigativo', seguranca:'seguranca', cultura:'cultura',
      profissoes:'profissoes', vagas:'vagas', concursos:'concursos',
      imoveis:'imoveis', esg:'esg', defesa:'defesa', religiao:'religiao'
    };
    var cat = catPath[p.categoria] || 'politica';
    return '/' + cat + '/?id=' + (p.id || '').slice(0, 8);
  }

  function cor(cat){ return CORES[cat] || '#64748b'; }
  function lbl(cat){ return LABELS[cat] || cat; }
  function dataBr(d){
    if(!d) return '';
    try{ return new Date(d).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}); }
    catch(_){ return ''; }
  }

  function stripMd(t){ return (t||'').replace(/\*\*/g,'').replace(/^#+\s*/gm,'').trim(); }

  function skeleton(){
    var s = '';
    for(var i=0;i<6;i++){
      s += '<div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">'
        +'<div style="height:180px;background:linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%);background-size:200% 100%;animation:ovc-shimmer 1.4s infinite;"></div>'
        +'<div style="padding:16px;">'
        +'<div style="height:12px;background:#e2e8f0;border-radius:4px;width:30%;margin-bottom:10px;animation:ovc-shimmer 1.4s infinite;"></div>'
        +'<div style="height:18px;background:#e2e8f0;border-radius:4px;width:90%;margin-bottom:8px;animation:ovc-shimmer 1.4s infinite;"></div>'
        +'<div style="height:14px;background:#e2e8f0;border-radius:4px;width:70%;animation:ovc-shimmer 1.4s infinite;"></div>'
        +'</div></div>';
    }
    return s;
  }

  function renderCard(p){
    var c = cor(p.categoria);
    var url = buildUrl(p);
    var img = p.imagem ? '<div style="height:180px;background:url(\''+p.imagem+'\') center/cover no-repeat;position:relative;">'
      +'<div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.4) 0%,transparent 60%);pointer-events:none;"></div></div>' : '';
    return '<a href="'+url+'" style="display:block;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);text-decoration:none;color:inherit;transition:transform .2s,box-shadow .2s;" '
      +'onmouseover="this.style.transform=\'translateY(-4px)\';this.style.boxShadow=\'0 8px 24px rgba(0,0,0,.15)\'" '
      +'onmouseout="this.style.transform=\'\';this.style.boxShadow=\'0 2px 8px rgba(0,0,0,.08)\'">' 
      + img
      +'<div style="padding:16px;">'
      +'<span style="display:inline-block;background:'+c+';color:#fff;font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:3px 9px;border-radius:99px;margin-bottom:10px;">'+lbl(p.categoria)+'</span>'
      +'<div style="font-size:15px;font-weight:700;line-height:1.4;color:#0f172a;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">'+stripMd(p.titulo)+'</div>'
      +'<div style="font-size:13px;color:#64748b;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:12px;">'+stripMd(p.resumo||p.subtitulo||'').slice(0,140)+'</div>'
      +'<div style="display:flex;align-items:center;justify-content:space-between;">'
      +'<span style="font-size:11px;color:#94a3b8;">'+dataBr(p.data)+'</span>'
      +'<span style="font-size:12px;font-weight:600;color:'+c+';">Ler mais →</span>'
      +'</div></div></a>';
  }

  function showResults(posts, query, total){
    var el = document.getElementById('ovc-search-results');
    if(!el) return;
    if(!posts || !posts.length){
      el.innerHTML = '<div style="text-align:center;padding:60px 20px;">'
        +'<div style="font-size:48px;margin-bottom:16px;">🔍</div>'
        +'<div style="font-size:20px;font-weight:700;color:#0f172a;margin-bottom:8px;">Nenhum resultado para <em>"'+query+'"</em></div>'
        +'<div style="font-size:14px;color:#64748b;margin-bottom:24px;">Tente termos mais simples ou explore nossas editorias.</div>'
        +'<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">'
        +'<a href="/politica/" style="background:#f1f5f9;color:#334155;padding:8px 16px;border-radius:99px;font-size:13px;font-weight:600;text-decoration:none;">Política</a>'
        +'<a href="/economia/" style="background:#f1f5f9;color:#334155;padding:8px 16px;border-radius:99px;font-size:13px;font-weight:600;text-decoration:none;">Economia</a>'
        +'<a href="/investigativo/" style="background:#f1f5f9;color:#334155;padding:8px 16px;border-radius:99px;font-size:13px;font-weight:600;text-decoration:none;">Investigativo</a>'
        +'<a href="/concursos/" style="background:#f1f5f9;color:#334155;padding:8px 16px;border-radius:99px;font-size:13px;font-weight:600;text-decoration:none;">Concursos</a>'
        +'</div></div>';
      return;
    }
    var count = '<div style="font-size:13px;color:#64748b;margin-bottom:20px;"><strong style="color:#0f172a;">'+total+'</strong> resultado'+(total!==1?'s':'')+' para <strong>"'+query+'"</strong></div>';
    var grid = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;">'+posts.map(renderCard).join('')+'</div>';
    el.innerHTML = count + grid;
  }

  function doSearch(query){
    if(!query || query.trim().length < 2) return;
    var q = query.trim();
    var el = document.getElementById('ovc-search-results');
    if(el) el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;">'+skeleton()+'</div>';

    fetch('/api/portal-posts?q='+encodeURIComponent(q))
      .then(function(r){ return r.json(); })
      .then(function(data){
        showResults(data.posts||[], q, data.total||0);
        try{ window.history.replaceState(null,'','/busca/?q='+encodeURIComponent(q)); }catch(_){}
      })
      .catch(function(e){ console.warn('Search error:', e); });
  }

  document.addEventListener('DOMContentLoaded', function(){
    var style = document.createElement('style');
    style.textContent = '@keyframes ovc-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}';
    document.head.appendChild(style);

    var input = document.getElementById('ovc-search-input') || document.querySelector('[data-search-page-input]');
    if(!input) return;

    // Premium search bar styling
    var wrap = input.parentNode;
    if(wrap){
      input.style.cssText = 'width:100%;padding:18px 60px 18px 24px;border:2px solid #e2e8f0;border-radius:16px;font-size:17px;background:#fff;color:#0f172a;outline:none;box-shadow:0 4px 20px rgba(0,0,0,.08);transition:border-color .2s,box-shadow .2s;box-sizing:border-box;';
      input.addEventListener('focus', function(){ this.style.borderColor='#ffc800'; this.style.boxShadow='0 4px 24px rgba(255,200,0,.18)'; });
      input.addEventListener('blur',  function(){ this.style.borderColor='#e2e8f0'; this.style.boxShadow='0 4px 20px rgba(0,0,0,.08)'; });
      var btn = document.createElement('button');
      btn.innerHTML = '🔍';
      btn.title = 'Buscar';
      btn.style.cssText = 'position:absolute;right:12px;top:50%;transform:translateY(-50%);background:#ffc800;border:none;border-radius:10px;width:40px;height:40px;font-size:17px;cursor:pointer;';
      btn.onclick = function(){ doSearch(input.value); };
      if(wrap.style.position !== 'relative') wrap.style.position = 'relative';
      wrap.appendChild(btn);
    }

    input.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); doSearch(this.value); } });
    input.addEventListener('input', function(){
      clearTimeout(debounceTimer);
      var v = this.value;
      if(v.length < 2) return;
      debounceTimer = setTimeout(function(){ doSearch(v); }, 400);
    });

    // Auto-search from ?q=
    var params = new URLSearchParams(window.location.search);
    var q = params.get('q');
    if(q){ input.value = q; doSearch(q); }
  });
})();
