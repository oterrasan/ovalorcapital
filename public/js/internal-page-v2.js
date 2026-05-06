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
    parcerias:'parcerias', regulacao:'regulacao', vc:'vc', colunistas:'vc'
  };

  var LABEL = {
    politica:'Política', economia:'Economia', negocios:'Negócios',
    investimentos:'Investimentos', mercados:'Mercados', tributacao:'Tributação',
    regulacao:'Regulação', seguros:'Seguros', saude:'Saúde', familia:'Família',
    tecnologia:'Tecnologia', industria:'Indústria', educacao:'Educação',
    esportes:'Esportes', internacional:'Internacional', variedades:'Variedades',
    parcerias:'Parcerias', vc:'OVC', colunistas:'Colunistas'
  };

  var CAT_COLORS = {
    politica:'#dc2626', economia:'#2563eb', negocios:'#7c3aed',
    investimentos:'#059669', mercados:'#0891b2', tributacao:'#b45309',
    regulacao:'#9333ea', seguros:'#0284c7', saude:'#16a34a',
    familia:'#db2777', tecnologia:'#6366f1', industria:'#ea580c',
    educacao:'#8b5cf6', esportes:'#16a34a', internacional:'#dc2626',
    variedades:'#ec4899', parcerias:'#14b8a6', vc:'#ffc800', colunistas:'#ffc800'
  };

  var CAT_PATH = {
    politica:'politica', economia:'economia', negocios:'negocios',
    investimentos:'investimentos', seguros:'seguros', mercados:'mercados',
    educacao:'educacao', industria:'industria', tecnologia:'tecnologia',
    esportes:'esportes', saude:'saude', familia:'familia',
    tributacao:'tributos', regulacao:'regulacao', parcerias:'parcerias',
    vc:'vc', colunistas:'vc', internacional:'internacional',
    variedades:'variedades', geral:'politica'
  };

  // ── UTILS ─────────────────────────────────────────────────────────
  function label(c){ return LABEL[c] || c || 'Geral'; }
  function cor(c){ return CAT_COLORS[c] || CAT_COLORS[SLUG_TO_CAT[c]] || '#dc2626'; }

  function buildUrl(p){
    var cat = p.categoria || 'geral';
    var urlSlug = CAT_PATH[cat] || CAT_PATH[SLUG_TO_CAT[cat]] || 'politica';
    return '/' + urlSlug + '/?id=' + encodeURIComponent((p.id||'').slice(0,8));
  }

  function dataBr(dt, longo){
    if(!dt) return '';
    try{
      var opts = longo
        ? {day:'2-digit', month:'long', year:'numeric'}
        : {day:'2-digit', month:'short', year:'numeric'};
      return new Date(dt).toLocaleDateString('pt-BR', opts);
    } catch(_){ return ''; }
  }

  // ── RENDER — CORPO DO ARTIGO ──────────────────────────────────────
  // Converte markdown simples (## h2, #hashtags, Redação OVC) em HTML
  function renderCorpo(texto) {
    if (!texto) return '';
    var lines = texto.split('\n');
    var html = '';
    var hashtagLine = [];

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var trim = line.trim();
      if (!trim) continue;

      // ## Subheading
      if (/^##\s+/.test(trim)) {
        var heading = trim.replace(/^##\s+/, '');
        html += '<h2 style="font-size:21px;font-weight:800;line-height:1.25;margin:36px 0 14px;color:var(--text-main,#0f172a);border-left:3px solid var(--ovc-accent,#dc2626);padding-left:14px;">' + esc(heading) + '</h2>';
        continue;
      }

      // Linha só de hashtags
      if (/^(#[^\s#,]+[\s,]*){1,}$/.test(trim) && trim.indexOf('#') === 0) {
        var tags = trim.match(/#[^\s#,]+/g) || [];
        hashtagLine = hashtagLine.concat(tags);
        continue;
      }

      // Assinatura Redação OVC
      if (/^Redação OVC/i.test(trim)) {
        html += '<p style="font-size:13px;font-weight:600;color:#94a3b8;margin:0 0 24px;padding-bottom:18px;border-bottom:1px solid #e2e8f0;">' + esc(trim) + '</p>';
        continue;
      }

      // Parágrafo normal
      html += '<p style="font-size:17px;line-height:1.9;color:var(--text-main,#1e293b);margin:0 0 22px;">' + esc(trim) + '</p>';
    }

    // Hashtags ao final
    if (hashtagLine.length) {
      html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin:28px 0 0;">' +
        hashtagLine.map(function(t){
          return '<span style="font-size:12px;font-weight:600;color:#475569;background:#f1f5f9;padding:4px 12px;border-radius:20px;">' + esc(t) + '</span>';
        }).join('') +
      '</div>';
    }

    return html;
  }

  function esc(s){
    return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── RENDER — BARRA DE COMPARTILHAMENTO ───────────────────────────
  function renderShare(titulo, urlRelativa) {
    var fullUrl = 'https://ovalorcapital.com.br' + urlRelativa;
    var eu = encodeURIComponent(fullUrl);
    var et = encodeURIComponent((titulo || 'O Valor Capital') + ' — leia no OVC');
    return '<div id="ovc-share-bar" style="display:flex;align-items:center;gap:8px;padding:14px 0;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;margin:18px 0 26px;flex-wrap:wrap;">' +
      '<span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.1em;margin-right:4px;white-space:nowrap;">Compartilhar</span>' +
      '<a href="https://api.whatsapp.com/send?text=' + et + '%20' + eu + '" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;background:#25D366;color:#fff;padding:7px 13px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:700;gap:5px;">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.106 1.51 5.842L0 24l6.335-1.652A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.373l-.36-.214-3.728.973.994-3.628-.235-.374A9.818 9.818 0 1112 21.818z"/></svg>' +
        'WhatsApp' +
      '</a>' +
      '<a href="https://t.me/share/url?url=' + eu + '&text=' + et + '" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;background:#229ED9;color:#fff;padding:7px 13px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:700;gap:5px;">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>' +
        'Telegram' +
      '</a>' +
      '<a href="https://twitter.com/intent/tweet?text=' + et + '&url=' + eu + '" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;background:#000;color:#fff;padding:7px 13px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:700;gap:5px;">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' +
        'X' +
      '</a>' +
      '<a href="https://www.facebook.com/sharer/sharer.php?u=' + eu + '" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;background:#1877F2;color:#fff;padding:7px 13px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:700;gap:5px;">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>' +
        'Facebook' +
      '</a>' +
      '<button onclick="(function(btn){var url=\'' + fullUrl.replace(/\\/g,'\\\\').replace(/'/g,"\\'") + '\';if(navigator.clipboard){navigator.clipboard.writeText(url).then(function(){btn.textContent=\'✓ Copiado\';setTimeout(function(){btn.textContent=\'Copiar link\';},2200)});}else{var t=document.createElement(\'textarea\');t.value=url;document.body.appendChild(t);t.select();document.execCommand(\'copy\');document.body.removeChild(t);btn.textContent=\'✓ Copiado\';setTimeout(function(){btn.textContent=\'Copiar link\';},2200);}})(this)" style="display:inline-flex;align-items:center;background:#f1f5f9;color:#0f172a;padding:7px 13px;border-radius:6px;font-size:13px;font-weight:700;border:1px solid #e2e8f0;cursor:pointer;gap:5px;">Copiar link</button>' +
    '</div>';
  }

  // ── RENDER — CTA CONTATO ──────────────────────────────────────────
  function renderCTA() {
    return '<div style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);border-radius:14px;padding:32px 28px;margin:48px 0 0;text-align:center;">' +
      '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:#ffc800;margin-bottom:10px;">Fale com a Redação OVC</div>' +
      '<h3 style="font-size:22px;font-weight:800;color:#f1f5f9;margin:0 0 12px;line-height:1.3;">Tem uma pauta, denúncia ou quer colaborar?</h3>' +
      '<p style="font-size:14px;color:#94a3b8;margin:0 0 24px;line-height:1.65;">Envie notícias, denúncias e artigos. Seja um colaborador ou correspondente do OVC. Toda proposta editorial é analisada pela nossa redação.</p>' +
      '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">' +
        '<a href="/contato/" style="display:inline-flex;align-items:center;background:#ffc800;color:#0f172a;padding:11px 22px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:800;letter-spacing:-.01em;">Enviar pauta ou denúncia</a>' +
        '<a href="/contato/" style="display:inline-flex;align-items:center;background:transparent;color:#f1f5f9;padding:11px 22px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700;border:1px solid rgba(255,255,255,0.18);">Ser colaborador</a>' +
      '</div>' +
    '</div>';
  }

  // ── RENDER — CARDS COMPACTOS ──────────────────────────────────────
  function renderCard(p){
    var url = buildUrl(p);
    var acento = cor(p.categoria);
    var imgHtml = p.imagem
      ? '<div style="width:88px;min-width:88px;height:72px;border-radius:8px;overflow:hidden;flex-shrink:0;background:#f1f5f9;">' +
        '<img src="' + p.imagem + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.parentElement.style.display=\'none\'">' +
        '</div>'
      : '<div style="width:88px;min-width:88px;height:72px;border-radius:8px;background:' + acento + '18;flex-shrink:0;display:flex;align-items:center;justify-content:center;"><span style="color:' + acento + ';font-weight:900;font-size:10px;">OVC</span></div>';
    return '<a href="' + url + '" style="display:flex;gap:14px;align-items:flex-start;text-decoration:none;color:inherit;padding:14px 0;border-top:1px solid var(--ovc-line,#f1f5f9);">' +
      imgHtml +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:' + acento + ';margin-bottom:5px;">' + label(p.categoria) + '</div>' +
        '<h4 style="font-size:14px;font-weight:700;line-height:1.35;margin:0 0 5px;color:var(--text-main,#0f172a);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + esc(p.titulo||'') + '</h4>' +
        '<span style="font-size:11px;color:var(--text-soft,#94a3b8);">Redação OVC · ' + dataBr(p.data) + '</span>' +
      '</div>' +
    '</a>';
  }

  function renderRail(p){
    var url = buildUrl(p);
    var acento = cor(p.categoria);
    return '<a href="' + url + '" style="display:flex;gap:10px;align-items:flex-start;text-decoration:none;color:inherit;padding:12px 0;border-top:1px solid var(--ovc-line,#f1f5f9);">' +
      (p.imagem
        ? '<div style="width:60px;min-width:60px;height:60px;border-radius:6px;overflow:hidden;flex-shrink:0;">' +
          '<img src="' + p.imagem + '" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\'">' +
          '</div>'
        : '<div style="width:60px;min-width:60px;height:60px;border-radius:6px;background:' + acento + '18;flex-shrink:0;display:flex;align-items:center;justify-content:center;"><span style="color:' + acento + ';font-size:9px;font-weight:900;">OVC</span></div>') +
      '<div style="flex:1;min-width:0;">' +
        '<h4 style="font-size:13px;font-weight:700;line-height:1.3;margin:0 0 4px;color:var(--text-main,#0f172a);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">' + esc(p.titulo||'') + '</h4>' +
        '<span style="font-size:10px;color:var(--text-soft,#94a3b8);">Redação OVC · ' + dataBr(p.data) + '</span>' +
      '</div>' +
    '</a>';
  }

  function renderHero(p){
    var url = buildUrl(p);
    var acento = cor(p.categoria);
    return '<a href="' + url + '" style="display:block;text-decoration:none;color:inherit;">' +
      (p.imagem
        ? '<div style="width:100%;height:260px;border-radius:12px;overflow:hidden;margin-bottom:16px;position:relative;">' +
          '<img src="' + p.imagem + '" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.style.display=\'none\'">' +
          '<div style="position:absolute;top:12px;left:12px;background:' + acento + ';color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:4px 10px;border-radius:20px;">' + label(p.categoria) + '</div>' +
          '</div>'
        : '<div style="background:' + acento + '22;border-radius:12px;height:120px;margin-bottom:16px;display:flex;align-items:center;justify-content:center;"><span style="color:' + acento + ';font-size:28px;font-weight:900;">OVC</span></div>') +
      '<h2 style="font-size:22px;font-weight:800;line-height:1.25;margin:0 0 8px;color:var(--text-main,#0f172a);">' + esc(p.titulo||'') + '</h2>' +
      '<p style="font-size:13px;color:var(--text-soft,#64748b);margin:0 0 8px;line-height:1.5;">' + esc((p.resumo||'').slice(0,160)) + '</p>' +
      '<span style="font-size:11px;color:var(--text-soft,#94a3b8);">Redação OVC · ' + dataBr(p.data) + '</span>' +
    '</a>';
  }

  // ── MODO ARTIGO ───────────────────────────────────────────────────
  var params = new URLSearchParams(window.location.search);
  var id = params.get('id');

  if (id) {
    document.addEventListener('DOMContentLoaded', function(){
      // Layout 2 colunas imediato
      var sectionHero = document.querySelector('.ovc-section-hero');
      if (sectionHero) sectionHero.style.display = 'none';

      var grid = document.querySelector('.ovc-grid');
      if (grid) grid.style.cssText = 'display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:32px;align-items:start;padding:0;';

      var storyStack = document.querySelector('.ovc-story-stack');
      if (storyStack) storyStack.style.cssText = 'display:block;min-width:0;';

      var rail = document.querySelector('.ovc-right-rail');
      if (rail) rail.style.cssText = 'display:flex;flex-direction:column;gap:0;min-width:0;position:sticky;top:16px;';

      fetch('/api/portal-posts?id=' + encodeURIComponent(id) + '&full=true')
        .then(function(res){ return res.ok ? res.json() : null; })
        .then(function(p){
          if (!p || !p.titulo) return;

          document.title = p.titulo + ' | O Valor Capital';

          // Open Graph para preview social
          (function setOG(){
            function meta(attr, key, val){
              var el = document.querySelector('meta[' + attr + '="' + key + '"]');
              if (!el){ el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
              el.setAttribute('content', val);
            }
            var url = window.location.href;
            var desc = (p.subtitulo || p.resumo || '').slice(0,160);
            meta('property','og:type','article');
            meta('property','og:url', url);
            meta('property','og:title', p.titulo);
            meta('property','og:description', desc);
            meta('property','og:image', p.imagem || '');
            meta('property','og:site_name','O Valor Capital');
            meta('name','twitter:card','summary_large_image');
            meta('name','twitter:title', p.titulo);
            meta('name','twitter:description', desc);
            meta('name','twitter:image', p.imagem || '');
          })();

          var acento = cor(p.categoria);
          var urlRelativa = buildUrl(p);
          var catPathSlug = CAT_PATH[p.categoria] || 'politica';

          // Render artigo completo
          var heroEl = document.querySelector('[data-hero-card]');
          if (heroEl) {
            heroEl.style.cssText = 'display:block;padding:24px 28px 32px;box-sizing:border-box;';
            heroEl.innerHTML =
              // Breadcrumb
              '<nav aria-label="Localização" style="font-size:12px;color:#94a3b8;margin-bottom:20px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
                '<a href="/" style="color:#94a3b8;text-decoration:none;">Início</a>' +
                '<span>›</span>' +
                '<a href="/' + catPathSlug + '/" style="color:#94a3b8;text-decoration:none;">' + label(p.categoria) + '</a>' +
                (p.subcategoria ? '<span>›</span><span style="color:#64748b;">' + esc(p.subcategoria) + '</span>' : '') +
              '</nav>' +

              // Badge + data
              '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap;">' +
                '<span style="display:inline-block;background:' + acento + ';color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:4px;text-transform:uppercase;letter-spacing:.08em;">' + label(p.categoria) + '</span>' +
                (p.subcategoria ? '<span style="font-size:11px;color:#64748b;font-weight:600;">' + esc(p.subcategoria) + '</span><span style="color:#e2e8f0;">·</span>' : '') +
                '<span style="font-size:13px;color:#64748b;">Redação OVC · ' + dataBr(p.data, true) + '</span>' +
              '</div>' +

              // Título
              '<h1 style="font-size:30px;font-weight:900;line-height:1.18;margin:0 0 16px;color:var(--text-main,#0f172a);letter-spacing:-.02em;">' + esc(p.titulo||'') + '</h1>' +

              // Subtítulo / lead
              (p.subtitulo
                ? '<p style="font-size:18px;color:var(--text-soft,#475569);margin:0 0 0;line-height:1.6;font-style:italic;border-left:4px solid ' + acento + ';padding:6px 0 6px 16px;margin-bottom:4px;">' + esc(p.subtitulo) + '</p>'
                : '') +

              // Barra de compartilhamento
              renderShare(p.titulo, urlRelativa) +

              // Imagem destaque
              (p.imagem
                ? '<div style="width:100%;border-radius:12px;overflow:hidden;margin-bottom:30px;max-height:480px;">' +
                  '<img src="' + p.imagem + '" alt="' + esc(p.titulo||'') + '" style="width:100%;max-height:480px;object-fit:cover;display:block;" onerror="this.parentElement.style.display=\'none\'">' +
                  '</div>'
                : '') +

              // Corpo
              '<div style="font-size:17px;line-height:1.9;">' +
                renderCorpo(p.corpo || '') +
              '</div>' +

              // CTA Contato
              renderCTA();
          }

          // Ocultar banner genérico
          var banner = document.querySelector('.ovc-banner-slot');
          if (banner) banner.style.display = 'none';

          // Buscar relacionadas da mesma categoria
          fetch('/api/portal-posts?categoria=' + encodeURIComponent(p.categoria) + '&limit=24')
            .then(function(r){ return r.json(); })
            .then(function(json){
              var related = (json.posts||[]).filter(function(r){ return r.id !== p.id; }).slice(0,12);

              // Lista 1 — "Leia também"
              var mainWrap = document.querySelector('[data-main-list]') && document.querySelector('[data-main-list]').closest('.ovc-story-list');
              var mainEl = document.querySelector('[data-main-list]');
              if (mainEl && related.length) {
                if (mainWrap) {
                  var h3a = mainWrap.querySelector('h3');
                  if (h3a) h3a.textContent = 'Leia também';
                  mainWrap.style.display = 'block';
                }
                mainEl.style.display = 'block';
                mainEl.innerHTML = related.slice(0,5).map(renderCard).join('');
              }

              // Lista 2 — "Mais em [categoria]"
              var localWrap = document.querySelector('[data-local-list]') && document.querySelector('[data-local-list]').closest('.ovc-story-list');
              var localEl = document.querySelector('[data-local-list]');
              if (localEl && related.length > 5) {
                if (localWrap) {
                  var h3b = localWrap.querySelector('h3');
                  if (h3b) h3b.textContent = 'Mais em ' + label(p.categoria);
                  localWrap.style.display = 'block';
                }
                localEl.style.display = 'block';
                localEl.innerHTML = related.slice(5,10).map(renderCard).join('');
              }

              // Rail direito — relacionadas em destaque
              var railSection = document.querySelector('[data-banner-sidebar]');
              if (railSection && related.length) {
                railSection.innerHTML =
                  '<div style="margin-bottom:6px;">' +
                    '<h3 style="font-size:14px;font-weight:800;color:var(--text-main,#0f172a);margin:0 0 2px;padding-bottom:10px;border-bottom:2px solid ' + acento + ';">Mais em ' + label(p.categoria) + '</h3>' +
                  '</div>' +
                  related.slice(0,7).map(renderRail).join('');
              }
            })
            .catch(function(){});
        })
        .catch(function(e){ console.warn('OVC materia:', e.message); });
    });
    return;
  }

  // ── MODO CATEGORIA ────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function(){
    var slug = document.body.dataset.category;
    if (!slug) return;

    var catFiltro = SLUG_TO_CAT[slug] || slug;
    var acento = cor(catFiltro);

    // Fetch com filtro de categoria no servidor — sem fallback para outras categorias
    fetch('/api/portal-posts?categoria=' + encodeURIComponent(catFiltro) + '&limit=60')
      .then(function(res){ return res.json(); })
      .then(function(json){
        // Hard filter: somente posts exatamente desta categoria
        var posts = (json.posts||[]).filter(function(p){
          return p.titulo && p.titulo.length > 0 && p.categoria === catFiltro;
        });

        if (!posts.length) {
          var heroEl = document.querySelector('[data-hero-card]');
          if (heroEl) {
            heroEl.style.cssText = 'display:flex;align-items:center;justify-content:center;min-height:180px;padding:24px;';
            heroEl.innerHTML =
              '<div style="text-align:center;">' +
                '<div style="font-size:40px;margin-bottom:12px;">📰</div>' +
                '<p style="color:#64748b;font-size:16px;line-height:1.6;margin:0;">Aguardando conteúdo para <strong>' + label(catFiltro) + '</strong>.<br>Volte em breve.</p>' +
              '</div>';
          }
          return;
        }

        // Deduplicar
        var usedIds = {}, usedTitulos = {};
        var deduped = [];
        posts.forEach(function(p){
          if (!p.id || !p.titulo) return;
          if (usedIds[p.id]) return;
          var tNorm = (p.titulo||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,30);
          if (usedTitulos[tNorm]) return;
          usedIds[p.id] = true;
          usedTitulos[tNorm] = true;
          deduped.push(p);
        });

        if (!deduped.length) return;

        // Hero (1º post — destaque principal)
        var heroEl = document.querySelector('[data-hero-card]');
        if (heroEl && deduped[0]) {
          heroEl.style.cssText = 'display:block;padding:20px;box-sizing:border-box;';
          heroEl.innerHTML = renderHero(deduped[0]);
        }

        // Lista principal — posts 2 a 9
        var mainEl = document.querySelector('[data-main-list]');
        if (mainEl && deduped.length > 1) {
          mainEl.innerHTML = deduped.slice(1, 9).map(renderCard).join('');
        }

        // Lista secundária — posts 10 a 15
        var localEl = document.querySelector('[data-local-list]');
        if (localEl && deduped.length > 9) {
          localEl.innerHTML = deduped.slice(9, 15).map(renderCard).join('');
        }

        // Rail lateral — posts 16 a 20
        var railEl = document.querySelector('[data-rail-list]');
        if (railEl && deduped.length > 15) {
          railEl.innerHTML = deduped.slice(15, 20).map(renderRail).join('');
        }

        // Grid 3 colunas — posts 21 a 32 (se o slot existir no HTML)
        var topicEl = document.querySelector('[data-topic-grid]');
        if (topicEl && deduped.length > 20) {
          topicEl.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:16px;';
          topicEl.innerHTML = deduped.slice(20, 32).map(function(p){
            var url = buildUrl(p);
            var a = cor(p.categoria);
            return '<a href="' + url + '" style="display:block;text-decoration:none;color:inherit;border-radius:10px;overflow:hidden;border:1px solid var(--ovc-line,#f1f5f9);">' +
              (p.imagem
                ? '<div style="height:130px;overflow:hidden;background:' + a + '12;">' +
                  '<img src="' + p.imagem + '" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.style.background=\'' + a + '15\'">' +
                  '</div>'
                : '<div style="height:80px;background:' + a + '18;display:flex;align-items:center;justify-content:center;"><span style="color:' + a + ';font-weight:900;font-size:11px;">OVC</span></div>') +
              '<div style="padding:10px 12px;">' +
                '<div style="font-size:9px;font-weight:700;text-transform:uppercase;color:' + a + ';margin-bottom:4px;">' + esc(p.subcategoria || label(p.categoria)) + '</div>' +
                '<h4 style="font-size:13px;font-weight:700;line-height:1.3;margin:0;color:var(--text-main,#0f172a);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + esc(p.titulo||'') + '</h4>' +
                '<div style="font-size:10px;color:var(--text-soft,#94a3b8);margin-top:6px;">' + dataBr(p.data) + '</div>' +
              '</div>' +
            '</a>';
          }).join('');
        }
      })
      .catch(function(e){ console.warn('OVC categoria:', e.message); });
  });
})();
