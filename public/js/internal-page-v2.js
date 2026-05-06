(function(){
  'use strict';

  // ── CONSTANTES ────────────────────────────────────────────────────
  var SLUG_TO_CAT = {
    tributos:'tributacao', tributacao:'tributacao',
    politica:'politica', economia:'economia', negocios:'negocios',
    investimentos:'investimentos', seguros:'seguros', mercados:'mercados',
    educacao:'educacao', industria:'industria', tecnologia:'tecnologia',
    esportes:'esportes', saude:'saude', familia:'familia',
    internacional:'internacional', variedades:'variedades',
    parcerias:'parcerias', regulacao:'regulacao', vc:'vc', colunistas:'vc',
    investigativo:'investigativo', seguranca:'seguranca',
    cultura:'cultura', profissoes:'profissoes', vagas:'vagas'
  };
  var LABEL = {
    politica:'Política', economia:'Economia', negocios:'Negócios',
    investimentos:'Investimentos', mercados:'Mercados', tributacao:'Tributação',
    regulacao:'Regulação', seguros:'Seguros', saude:'Saúde', familia:'Família',
    tecnologia:'Tecnologia', industria:'Indústria', educacao:'Educação',
    esportes:'Esportes', internacional:'Internacional', variedades:'Variedades',
    parcerias:'Parcerias', vc:'OVC', colunistas:'Colunistas',
    investigativo:'Investigativo', seguranca:'Segurança Pública',
    cultura:'Cultura', profissoes:'Profissões', vagas:'Vagas'
  };
  var CORES = {
    politica:'#dc2626', economia:'#2563eb', negocios:'#7c3aed',
    investimentos:'#059669', mercados:'#0891b2', tributacao:'#b45309',
    regulacao:'#9333ea', seguros:'#0284c7', saude:'#16a34a',
    familia:'#db2777', tecnologia:'#6366f1', industria:'#ea580c',
    educacao:'#8b5cf6', esportes:'#16a34a', internacional:'#dc2626',
    variedades:'#ec4899', parcerias:'#14b8a6', vc:'#ffc800', colunistas:'#ffc800',
    investigativo:'#1a1a2e', seguranca:'#7f1d1d',
    cultura:'#7e22ce', profissoes:'#0369a1', vagas:'#065f46'
  };
  var CAT_PATH = {
    politica:'politica', economia:'economia', negocios:'negocios',
    investimentos:'investimentos', seguros:'seguros', mercados:'mercados',
    educacao:'educacao', industria:'industria', tecnologia:'tecnologia',
    esportes:'esportes', saude:'saude', familia:'familia',
    tributacao:'tributos', regulacao:'regulacao', parcerias:'parcerias',
    vc:'vc', colunistas:'vc', internacional:'internacional',
    variedades:'variedades', geral:'politica',
    investigativo:'investigativo', seguranca:'seguranca',
    cultura:'cultura', profissoes:'profissoes', vagas:'vagas'
  };

  function lbl(c){ return LABEL[c]||c||'Geral'; }
  function cor(c){ return CORES[c]||CORES[SLUG_TO_CAT[c]]||'#dc2626'; }
  function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function dataCurta(dt){
    if(!dt) return '';
    try{ return new Date(dt).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}); }
    catch(_){ return ''; }
  }
  function dataLonga(dt){
    if(!dt) return '';
    try{ return new Date(dt).toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'}); }
    catch(_){ return ''; }
  }
  function buildUrl(p){
    var cat = p.categoria||'geral';
    return '/'+(CAT_PATH[cat]||CAT_PATH[SLUG_TO_CAT[cat]]||'politica')+'/?id='+encodeURIComponent((p.id||'').slice(0,8));
  }

  // ── RENDER CORPO DO ARTIGO ─────────────────────────────────────────
  function renderCorpo(texto){
    if(!texto) return '';
    var lines = texto.split('\n'), html = '', htags = [];
    for(var i=0;i<lines.length;i++){
      var t = lines[i].trim();
      if(!t) continue;
      if(/^##\s+/.test(t)){
        html += '<h2 style="font-size:21px;font-weight:800;line-height:1.25;margin:36px 0 14px;color:var(--text-main,#0f172a);border-left:3px solid var(--ovc-accent,#dc2626);padding-left:14px;">'+esc(t.replace(/^##\s+/,''))+'</h2>';
      } else if(/^(#[^\s#,]+[\s,]*)+$/.test(t) && t[0]==='#'){
        htags = htags.concat(t.match(/#[^\s#,]+/g)||[]);
      } else if(/^Redação OVC/i.test(t)){
        html += '<p style="font-size:13px;font-weight:600;color:#94a3b8;margin:0 0 24px;padding-bottom:16px;border-bottom:1px solid #e2e8f0;">'+esc(t)+'</p>';
      } else {
        html += '<p style="font-size:17px;line-height:1.9;color:var(--text-main,#1e293b);margin:0 0 22px;">'+esc(t)+'</p>';
      }
    }
    if(htags.length){
      html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin:28px 0 0;">'
        +htags.map(function(t){ return '<span style="font-size:12px;font-weight:600;color:#475569;background:#f1f5f9;padding:4px 12px;border-radius:20px;">'+esc(t)+'</span>'; }).join('')
        +'</div>';
    }
    return html;
  }

  // ── RENDER BARRA DE COMPARTILHAMENTO ──────────────────────────────
  function renderShare(titulo, urlRel){
    var full = 'https://ovalorcapital.com.br'+urlRel;
    var eu = encodeURIComponent(full);
    var et = encodeURIComponent((titulo||'O Valor Capital')+' — O Valor Capital');
    return '<div style="display:flex;align-items:center;gap:8px;padding:14px 0;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;margin:18px 0 26px;flex-wrap:wrap;">'
      +'<span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.1em;margin-right:4px;">Compartilhar</span>'
      +'<a href="https://api.whatsapp.com/send?text='+et+'%20'+eu+'" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;background:#25D366;color:#fff;padding:7px 14px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:700;">WhatsApp</a>'
      +'<a href="https://t.me/share/url?url='+eu+'&text='+et+'" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;background:#229ED9;color:#fff;padding:7px 14px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:700;">Telegram</a>'
      +'<a href="https://twitter.com/intent/tweet?text='+et+'&url='+eu+'" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;background:#000;color:#fff;padding:7px 14px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:700;">X</a>'
      +'<a href="https://www.facebook.com/sharer/sharer.php?u='+eu+'" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;background:#1877F2;color:#fff;padding:7px 14px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:700;">Facebook</a>'
      +'<button onclick="(function(b){var u=\''+full.replace(/'/g,"\\'")+'\';;if(navigator.clipboard){navigator.clipboard.writeText(u).then(function(){b.textContent=\'✓ Copiado\';setTimeout(function(){b.textContent=\'Copiar link\';},2200);})}else{var t=document.createElement(\'textarea\');t.value=u;document.body.appendChild(t);t.select();document.execCommand(\'copy\');document.body.removeChild(t);b.textContent=\'✓ Copiado\';setTimeout(function(){b.textContent=\'Copiar link\';},2200);}})(this)" style="display:inline-flex;align-items:center;background:#f1f5f9;color:#0f172a;padding:7px 14px;border-radius:6px;font-size:13px;font-weight:700;border:1px solid #e2e8f0;cursor:pointer;">Copiar link</button>'
      +'</div>';
  }

  // ── RENDER CTA CONTATO ────────────────────────────────────────────
  function renderCTA(){
    return '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:14px;padding:32px 28px;margin:48px 0 0;text-align:center;">'
      +'<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:#ffc800;margin-bottom:10px;">Fale com a Redação OVC</div>'
      +'<h3 style="font-size:20px;font-weight:800;color:#f1f5f9;margin:0 0 10px;line-height:1.3;">Tem uma pauta, denúncia ou quer colaborar?</h3>'
      +'<p style="font-size:14px;color:#94a3b8;margin:0 0 22px;line-height:1.65;">Envie notícias, denúncias e artigos. Seja colaborador ou correspondente do OVC. Toda proposta é analisada pela redação.</p>'
      +'<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">'
        +'<a href="/contato/" style="display:inline-flex;align-items:center;background:#ffc800;color:#0f172a;padding:11px 22px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:800;">Enviar pauta ou denúncia</a>'
        +'<a href="/contato/" style="display:inline-flex;align-items:center;background:transparent;color:#f1f5f9;padding:11px 22px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700;border:1px solid rgba(255,255,255,0.18);">Ser colaborador</a>'
      +'</div>'
    +'</div>';
  }

  // ── RENDER CARDS ─────────────────────────────────────────────────

  // Card hero — imagem grande com overlay gradient (destaque principal)
  function renderHeroCard(p){
    var url = buildUrl(p), c = cor(p.categoria);
    var bg = p.imagem
      ? 'background:url(\''+p.imagem+'\') center/cover no-repeat;'
      : 'background:'+c+';';
    return '<a href="'+url+'" style="display:block;text-decoration:none;border-radius:16px;overflow:hidden;position:relative;min-height:340px;'+bg+'">'
      +'<div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.35) 55%,rgba(0,0,0,0.05) 100%);"></div>'
      +'<div style="position:absolute;bottom:0;left:0;right:0;padding:24px 28px;">'
        +'<span style="display:inline-block;background:'+c+';color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;padding:3px 10px;border-radius:4px;margin-bottom:10px;">'+lbl(p.categoria)+(p.subcategoria?'&nbsp;·&nbsp;'+esc(p.subcategoria):'')+'</span>'
        +'<h2 style="font-size:24px;font-weight:900;line-height:1.2;color:#fff;margin:0 0 8px;text-shadow:0 2px 8px rgba(0,0,0,0.5);">'+esc(p.titulo||'')+'</h2>'
        +'<p style="font-size:14px;color:rgba(255,255,255,0.8);margin:0 0 10px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">'+esc((p.resumo||'').slice(0,160))+'</p>'
        +'<span style="font-size:12px;color:rgba(255,255,255,0.6);">Redação OVC · '+dataCurta(p.data)+'</span>'
      +'</div>'
    +'</a>';
  }

  // Card médio — grid 2 colunas (posts 2 e 3)
  function renderCardMedio(p){
    var url = buildUrl(p), c = cor(p.categoria);
    return '<a href="'+url+'" style="display:block;text-decoration:none;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;background:#fff;">'
      +(p.imagem
        ? '<div style="height:160px;overflow:hidden;"><img src="'+p.imagem+'" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.parentElement.style.display=\'none\'"></div>'
        : '<div style="height:100px;background:'+c+'18;display:flex;align-items:center;justify-content:center;"><span style="color:'+c+';font-weight:900;font-size:13px;">OVC</span></div>')
      +'<div style="padding:14px;">'
        +'<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:'+c+';margin-bottom:6px;">'+lbl(p.categoria)+(p.subcategoria?' · '+esc(p.subcategoria):'')+'</div>'
        +'<h3 style="font-size:15px;font-weight:800;line-height:1.3;margin:0 0 8px;color:#0f172a;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">'+esc(p.titulo||'')+'</h3>'
        +'<span style="font-size:11px;color:#94a3b8;">Redação OVC · '+dataCurta(p.data)+'</span>'
      +'</div>'
    +'</a>';
  }

  // Card compacto — linha com thumbnail (lista principal)
  function renderCardCompacto(p){
    var url = buildUrl(p), c = cor(p.categoria);
    var img = p.imagem
      ? '<div style="width:88px;min-width:88px;height:72px;border-radius:8px;overflow:hidden;flex-shrink:0;"><img src="'+p.imagem+'" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.parentElement.style.display=\'none\'"></div>'
      : '<div style="width:88px;min-width:88px;height:72px;border-radius:8px;background:'+c+'18;flex-shrink:0;display:flex;align-items:center;justify-content:center;"><span style="color:'+c+';font-size:10px;font-weight:900;">OVC</span></div>';
    return '<a href="'+url+'" style="display:flex;gap:14px;align-items:flex-start;text-decoration:none;color:inherit;padding:14px 0;border-top:1px solid #f1f5f9;">'
      +img
      +'<div style="flex:1;min-width:0;">'
        +'<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:'+c+';margin-bottom:5px;">'+lbl(p.categoria)+(p.subcategoria?' · '+esc(p.subcategoria):'')+'</div>'
        +'<h4 style="font-size:14px;font-weight:700;line-height:1.35;margin:0 0 5px;color:#0f172a;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">'+esc(p.titulo||'')+'</h4>'
        +'<span style="font-size:11px;color:#94a3b8;">Redação OVC · '+dataCurta(p.data)+'</span>'
      +'</div>'
    +'</a>';
  }

  // Card rail — mini com thumbnail quadrado (sidebar)
  function renderCardRail(p){
    var url = buildUrl(p), c = cor(p.categoria);
    return '<a href="'+url+'" style="display:flex;gap:10px;align-items:flex-start;text-decoration:none;color:inherit;padding:12px 0;border-top:1px solid #f1f5f9;">'
      +(p.imagem
        ? '<div style="width:60px;min-width:60px;height:60px;border-radius:6px;overflow:hidden;flex-shrink:0;"><img src="'+p.imagem+'" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\'"></div>'
        : '<div style="width:60px;min-width:60px;height:60px;border-radius:6px;background:'+c+'18;flex-shrink:0;display:flex;align-items:center;justify-content:center;"><span style="color:'+c+';font-size:9px;font-weight:900;">OVC</span></div>')
      +'<div style="flex:1;min-width:0;">'
        +'<h4 style="font-size:13px;font-weight:700;line-height:1.3;margin:0 0 4px;color:#0f172a;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">'+esc(p.titulo||'')+'</h4>'
        +'<span style="font-size:10px;color:#94a3b8;">'+dataCurta(p.data)+'</span>'
      +'</div>'
    +'</a>';
  }

  function secaoTitulo(texto, acento){
    return '<h2 style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#0f172a;margin:0 0 16px;padding-bottom:10px;border-bottom:2px solid '+acento+';">'+texto+'</h2>';
  }

  function railTitulo(texto, acento){
    return '<h3 style="font-size:13px;font-weight:800;color:#0f172a;margin:0 0 2px;padding-bottom:10px;border-bottom:2px solid '+acento+';">'+texto+'</h3>';
  }

  // ── MODO ARTIGO ───────────────────────────────────────────────────
  var params = new URLSearchParams(window.location.search);
  var artId = params.get('id');

  if(artId){
    document.addEventListener('DOMContentLoaded', function(){
      // Ocultar seção hero placeholder
      var sectionHero = document.querySelector('.ovc-section-hero');
      if(sectionHero) sectionHero.style.display = 'none';

      // Garantir rail visível e sticky
      var rail = document.querySelector('.ovc-right-rail');
      if(rail) rail.style.cssText = 'display:flex;flex-direction:column;gap:0;min-width:0;position:sticky;top:16px;';

      fetch('/api/portal-posts?id='+encodeURIComponent(artId)+'&full=true')
        .then(function(r){ return r.ok ? r.json() : null; })
        .then(function(p){
          if(!p||!p.titulo) return;

          document.title = p.titulo+' | O Valor Capital';

          // Open Graph para preview social
          (function(){
            function m(attr,key,val){
              var el=document.querySelector('meta['+attr+'="'+key+'"]');
              if(!el){el=document.createElement('meta');el.setAttribute(attr,key);document.head.appendChild(el);}
              el.setAttribute('content',val);
            }
            var desc=(p.subtitulo||p.resumo||'').slice(0,160);
            m('property','og:type','article'); m('property','og:title',p.titulo);
            m('property','og:description',desc); m('property','og:image',p.imagem||'');
            m('property','og:url',window.location.href); m('property','og:site_name','O Valor Capital');
            m('name','twitter:card','summary_large_image'); m('name','twitter:title',p.titulo);
            m('name','twitter:description',desc); m('name','twitter:image',p.imagem||'');
          })();

          var c = cor(p.categoria);
          var urlRel = buildUrl(p);
          var catSlug = CAT_PATH[p.categoria]||'politica';

          var heroEl = document.querySelector('[data-hero-card]');
          if(heroEl){
            heroEl.style.cssText = 'display:block;padding:24px 28px 32px;box-sizing:border-box;';
            heroEl.innerHTML =
              // Breadcrumb
              '<nav style="font-size:12px;color:#94a3b8;margin-bottom:20px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">'
                +'<a href="/" style="color:#94a3b8;text-decoration:none;">Início</a><span>›</span>'
                +'<a href="/'+catSlug+'/" style="color:#94a3b8;text-decoration:none;">'+lbl(p.categoria)+'</a>'
                +(p.subcategoria?'<span>›</span><span style="color:#64748b;">'+esc(p.subcategoria)+'</span>':'')
              +'</nav>'
              // Badge + data
              +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap;">'
                +'<span style="display:inline-block;background:'+c+';color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:4px;text-transform:uppercase;letter-spacing:.08em;">'+lbl(p.categoria)+'</span>'
                +(p.subcategoria?'<span style="font-size:11px;color:#64748b;font-weight:600;">'+esc(p.subcategoria)+'</span><span style="color:#e2e8f0;">·</span>':'')
                +'<span style="font-size:13px;color:#64748b;">Redação OVC · '+dataLonga(p.data)+'</span>'
              +'</div>'
              // Título
              +'<h1 style="font-size:30px;font-weight:900;line-height:1.18;margin:0 0 16px;color:var(--text-main,#0f172a);letter-spacing:-.02em;">'+esc(p.titulo||'')+'</h1>'
              // Subtítulo
              +(p.subtitulo?'<p style="font-size:18px;color:#475569;margin:0 0 4px;line-height:1.6;font-style:italic;border-left:4px solid '+c+';padding:6px 0 6px 16px;margin-bottom:4px;">'+esc(p.subtitulo)+'</p>':'')
              // Share
              +renderShare(p.titulo, urlRel)
              // Imagem
              +(p.imagem?'<div style="width:100%;border-radius:12px;overflow:hidden;margin-bottom:30px;"><img src="'+p.imagem+'" alt="'+esc(p.titulo||'')+'" style="width:100%;max-height:460px;object-fit:cover;display:block;" onerror="this.parentElement.style.display=\'none\'"></div>':'')
              // Corpo
              +'<div>'+renderCorpo(p.corpo||'')+'</div>'
              // CTA
              +renderCTA();
          }

          // Ocultar banner genérico
          var banner = document.querySelector('.ovc-banner-slot');
          if(banner) banner.style.display = 'none';

          // Relacionadas
          fetch('/api/portal-posts?categoria='+encodeURIComponent(p.categoria)+'&limit=24')
            .then(function(r){ return r.json(); })
            .then(function(json){
              var rel = (json.posts||[]).filter(function(r){
                return r.id!==p.id && r.categoria===p.categoria;
              }).slice(0,12);

              // "Leia também" na lista principal
              var mainWrap = document.querySelector('[data-main-list]') ? document.querySelector('[data-main-list]').closest('.ovc-story-list') : null;
              var mainEl = document.querySelector('[data-main-list]');
              if(mainEl && rel.length){
                if(mainWrap){
                  var h3a = mainWrap.querySelector('h3');
                  if(h3a) h3a.textContent = 'Leia também';
                  mainWrap.style.display = 'block';
                }
                mainEl.innerHTML = rel.slice(0,5).map(renderCardCompacto).join('');
              }

              // "Mais em [cat]" na lista secundária
              var localWrap = document.querySelector('[data-local-list]') ? document.querySelector('[data-local-list]').closest('.ovc-story-list') : null;
              var localEl = document.querySelector('[data-local-list]');
              if(localEl && rel.length>5){
                if(localWrap){
                  var h3b = localWrap.querySelector('h3');
                  if(h3b) h3b.textContent = 'Mais em '+lbl(p.categoria);
                  localWrap.style.display = 'block';
                }
                localEl.innerHTML = rel.slice(5,10).map(renderCardCompacto).join('');
              }

              // Rail direito — relacionadas
              var railSec = document.querySelector('[data-banner-sidebar]');
              if(railSec){
                railSec.innerHTML = railTitulo('Mais em '+lbl(p.categoria), c)
                  +(rel.length ? rel.slice(0,7).map(renderCardRail).join('')
                    : '<p style="font-size:13px;color:#94a3b8;padding:12px 0;">Mais conteúdo em breve.</p>')
                  +'<div style="margin-top:20px;background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:10px;padding:18px;text-align:center;">'
                    +'<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#ffc800;margin-bottom:6px;">Redação OVC</div>'
                    +'<p style="font-size:12px;color:#94a3b8;margin:0 0 12px;line-height:1.5;">Tem uma pauta ou denúncia?</p>'
                    +'<a href="/contato/" style="display:block;background:#ffc800;color:#0f172a;padding:8px 12px;border-radius:6px;text-decoration:none;font-size:12px;font-weight:800;text-align:center;">Enviar para a redação</a>'
                  +'</div>';
              }
            })
            .catch(function(){});
        })
        .catch(function(e){ console.warn('OVC artigo:', e.message); });
    });
    return;
  }

  // ── MODO CATEGORIA ────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function(){
    var slug = document.body.dataset.category;
    if(!slug) return;

    var catFiltro = SLUG_TO_CAT[slug]||slug;
    var acento    = cor(catFiltro);

    // Substituir seção hero estática por cabeçalho real da categoria
    var sectionHero = document.querySelector('.ovc-section-hero');
    if(sectionHero){
      sectionHero.style.cssText = 'display:block;margin-bottom:24px;padding:0;border:none;background:transparent;box-shadow:none;';
      sectionHero.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:20px 0 16px;border-bottom:2px solid '+acento+';">'
          +'<div style="display:flex;align-items:center;gap:12px;">'
            +'<span style="display:inline-block;background:'+acento+';color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:4px;text-transform:uppercase;letter-spacing:.08em;">'+lbl(catFiltro)+'</span>'
            +'<nav style="font-size:12px;color:#94a3b8;">'
              +'<a href="/" style="color:#94a3b8;text-decoration:none;">Início</a>'
              +' <span style="margin:0 4px;">›</span>'
              +'<span style="color:#64748b;font-weight:600;">'+lbl(catFiltro)+'</span>'
            +'</nav>'
          +'</div>'
          +'<a href="/busca/" style="font-size:12px;color:'+acento+';text-decoration:none;font-weight:700;">Ver todos ›</a>'
        +'</div>';
    }

    // Garantir rail visível
    var rail = document.querySelector('.ovc-right-rail');
    if(rail) rail.style.cssText = 'display:flex;flex-direction:column;gap:0;min-width:0;position:sticky;top:16px;';

    // Pré-preencher rail com indicador de carregamento
    var railSec = document.querySelector('[data-banner-sidebar]');
    if(railSec){
      railSec.innerHTML = railTitulo('Últimas em '+lbl(catFiltro), acento)
        +'<p style="font-size:13px;color:#94a3b8;padding:12px 0;">Carregando...</p>';
    }

    // Buscar posts com filtro de categoria no servidor
    fetch('/api/portal-posts?categoria='+encodeURIComponent(catFiltro)+'&limit=60')
      .then(function(r){ return r.json(); })
      .then(function(json){
        // Regra dura: SOMENTE posts exatamente desta categoria
        var posts = (json.posts||[]).filter(function(p){
          return p.titulo && p.categoria === catFiltro;
        });

        // Popular rail com as primeiras antes de dedup
        if(railSec){
          var railPosts = posts.slice(0,7);
          railSec.innerHTML = railTitulo('Últimas em '+lbl(catFiltro), acento)
            +(railPosts.length
              ? railPosts.map(renderCardRail).join('')
              : '<p style="font-size:13px;color:#94a3b8;padding:12px 0;">Aguardando conteúdo.</p>')
            +'<div style="margin-top:20px;background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:10px;padding:18px;text-align:center;">'
              +'<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#ffc800;margin-bottom:6px;">Redação OVC</div>'
              +'<p style="font-size:12px;color:#94a3b8;margin:0 0 12px;line-height:1.5;">Envie sua pauta ou denúncia</p>'
              +'<a href="/contato/" style="display:block;background:#ffc800;color:#0f172a;padding:8px 12px;border-radius:6px;text-decoration:none;font-size:12px;font-weight:800;">Falar com a redação</a>'
            +'</div>';
        }

        if(!posts.length){
          var heroEl2 = document.querySelector('[data-hero-card]');
          if(heroEl2){
            heroEl2.style.cssText = 'display:flex;align-items:center;justify-content:center;min-height:220px;padding:24px;border-radius:16px;border:2px dashed #e2e8f0;';
            heroEl2.innerHTML =
              '<div style="text-align:center;">'
                +'<div style="font-size:48px;margin-bottom:14px;">📰</div>'
                +'<p style="color:#64748b;font-size:16px;line-height:1.6;margin:0;">Aguardando conteúdo para <strong style="color:'+acento+';">'+lbl(catFiltro)+'</strong>.<br>A automação está gerando matérias. Volte em breve.</p>'
              +'</div>';
          }
          return;
        }

        // Deduplicar
        var usedIds={}, usedTitulos={}, deduped=[];
        posts.forEach(function(p){
          if(!p.id||!p.titulo) return;
          if(usedIds[p.id]) return;
          var tNorm=(p.titulo||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,30);
          if(usedTitulos[tNorm]) return;
          usedIds[p.id]=true; usedTitulos[tNorm]=true; deduped.push(p);
        });

        if(!deduped.length) return;

        // ── HERO (1º post — destaque com imagem full + overlay)
        var heroEl = document.querySelector('[data-hero-card]');
        if(heroEl){
          heroEl.style.cssText = 'display:block;padding:0;border:none;background:transparent;box-shadow:none;margin-bottom:20px;';
          heroEl.innerHTML = renderHeroCard(deduped[0]);
        }

        // ── GRID 2 COLUNAS (posts 2 e 3)
        var mainEl = document.querySelector('[data-main-list]');
        if(mainEl){
          var mainWrap = mainEl.closest('.ovc-story-list');
          if(mainWrap){
            var h3 = mainWrap.querySelector('h3');
            if(h3) h3.style.cssText = 'font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#0f172a;margin:0 0 16px;padding-bottom:10px;border-bottom:2px solid '+acento+';';
            if(h3) h3.textContent = 'Destaques de '+lbl(catFiltro);
          }
          var grid2 = '';
          if(deduped.length>1){
            grid2 += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">'
              +deduped.slice(1, Math.min(3, deduped.length)).map(renderCardMedio).join('')
              +'</div>';
          }
          // Lista compacta (posts 4+)
          if(deduped.length>3){
            grid2 += deduped.slice(3, 11).map(renderCardCompacto).join('');
          }
          mainEl.innerHTML = grid2;
        }

        // ── MAIS DA SEÇÃO (posts 12+)
        var localEl = document.querySelector('[data-local-list]');
        if(localEl && deduped.length>11){
          var localWrap = localEl.closest('.ovc-story-list');
          if(localWrap){
            var h3b = localWrap.querySelector('h3');
            if(h3b) h3b.style.cssText = 'font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#0f172a;margin:0 0 16px;padding-bottom:10px;border-bottom:2px solid '+acento+';';
            if(h3b) h3b.textContent = 'Mais em '+lbl(catFiltro);
          }
          localEl.innerHTML = deduped.slice(11, 20).map(renderCardCompacto).join('');
        } else if(localEl){
          var lw = localEl.closest('.ovc-story-list');
          if(lw) lw.style.display = 'none';
        }
      })
      .catch(function(e){ console.warn('OVC categoria:', e.message); });
  });
})();
