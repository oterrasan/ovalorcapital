(function(){
  const API = "/api/portal-posts";

  const CAT = {
    politica:"Política",economia:"Economia",negocios:"Negócios",
    investimentos:"Investimentos",mercados:"Mercados",tributacao:"Tributação",
    regulacao:"Regulação",seguros:"Seguros",saude:"Saúde",familia:"Família",
    tecnologia:"Tecnologia",industria:"Indústria",educacao:"Educação",
    esportes:"Esportes",cultura:"Cultura",patrimonio:"Patrimônio",
    internacional:"Internacional",geral:"Geral"
  };

  const CAT_PATH_MAP = {
    politica:'politica', economia:'economia', negocios:'negocios',
    investimentos:'investimentos', seguros:'seguros', mercados:'mercados',
    educacao:'educacao', industria:'industria', tecnologia:'tecnologia',
    esportes:'esportes', saude:'saude', familia:'familia',
    tributacao:'tributos', regulacao:'regulacao', parcerias:'parcerias',
    vc:'vc', colunistas:'vc', internacional:'internacional', variedades:'variedades', geral:'politica',
    investigativo:'investigativo', seguranca:'seguranca', cultura:'cultura',
    profissoes:'profissoes', vagas:'vagas', concursos:'concursos',
    imoveis:'imoveis', esg:'esg', defesa:'defesa', religiao:'religiao'
  };

  function catLabel(c){ return CAT[c] || c || "Geral"; }

  function dataBr(dt){
    if(!dt) return "";
    try{ return new Date(dt).toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"}); }
    catch(_){ return ""; }
  }

  function cleanMd(t){
    return (t||'').replace(/\*\*/g,'').replace(/^#+\s*/,'').trim();
  }

  function renderBody(text){
    return (text||'').split(/\n\n+/).filter(l=>l.trim()).map(l=>{
      const tr = l.trim();
      if(/^###\s+/.test(tr)) return '<h3>'+cleanMd(tr.replace(/^###\s+/,''))+'</h3>';
      if(/^##\s+/.test(tr))  return '<h2>'+cleanMd(tr.replace(/^##\s+/,''))+'</h2>';
      if(/^#\s+/.test(tr))   return '<h2>'+cleanMd(tr.replace(/^#\s+/,''))+'</h2>';
      return '<p>'+tr.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')+'</p>';
    }).join('');
  }

  function set(id, val){
    const el = document.getElementById(id);
    if(el) el.textContent = val;
  }

  function buildUrl(p){
    const cp = CAT_PATH_MAP[p.categoria] || 'politica';
    const sl = cleanMd(p.titulo||'').toLowerCase().normalize('NFD')
      .replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9\s-]/g,'')
      .trim().replace(/\s+/g,'-').slice(0,55);
    return '/' + cp + '/' + sl + '-' + (p.id||'').slice(0,8) + '/';
  }

  async function loadMateria(){
    const params = new URLSearchParams(window.location.search);
    let id = params.get('id');
    if(!id){
      const ps = window.location.pathname.replace(/\/$/, '').split('/').pop() || '';
      const pm = ps.match(/-([a-f0-9]{8})$/i);
      if(pm) id = pm[1];
    }
    const bodyEl = document.getElementById('ovc-art-body');
    if(!id){ if(bodyEl) bodyEl.innerHTML='<p>Matéria não encontrada.</p>'; return; }

    try{
      const res = await fetch(API + '?id=' + id);
      if(!res.ok) throw new Error('not_found');
      const p = await res.json();
      if(!p || !p.titulo) throw new Error('empty');

      document.body.setAttribute('data-category', p.categoria || 'geral');

      const tituloLimpo = cleanMd(p.titulo);

      set('ovc-art-cat', catLabel(p.categoria));
      set('ovc-art-titulo', tituloLimpo);
      set('ovc-art-subtitulo', cleanMd(p.subtitulo || ''));
      set('ovc-art-data', 'Redação OVC · ' + dataBr(p.data));

      const img = document.getElementById('ovc-art-img');
      const imgWrap = document.getElementById('ovc-art-img-wrap');
      if(img && imgWrap && p.imagem){
        img.src = p.imagem;
        imgWrap.style.display = 'block';
        img.onerror = () => imgWrap.style.display = 'none';
      }

    
const notaEditorial = `
<div style="margin-top:40px;padding:20px 24px;border-top:2px solid #e2e5ea;border-radius:0 0 8px 8px;background:#f8f9fb;font-size:13px;line-height:1.7;color:#444;">
  <div style="display:flex;align-items:flex-start;gap:12px;">
    <div style="flex-shrink:0;width:36px;height:36px;background:#0A1A2F;border-radius:50%;display:flex;align-items:center;justify-content:center;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    </div>
    <div style="flex:1;">
      <div style="font-weight:700;color:#0A1A2F;font-size:13px;margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em;">Nota de Responsabilidade Editorial</div>
      <p style="margin:0 0 8px;">O conteúdo publicado pelo <strong>O Valor Capital</strong> tem caráter informativo e jornalístico, produzido com base em fontes públicas, comunicados oficiais e informações verificadas na data de publicação. As informações aqui veiculadas não constituem aconselhamento jurídico, financeiro, médico ou de qualquer outra natureza profissional.</p>
      <p style="margin:0 0 8px;">O portal não se responsabiliza por decisões tomadas com base exclusiva nas informações aqui veiculadas, tampouco por eventuais imprecisões decorrentes de alterações posteriores à publicação.</p>
      <p style="margin:0 0 12px;">O <strong>O Valor Capital</strong> está comprometido com a precisão e a transparência. Caso identifique erro factual, imprecisão ou informação desatualizada neste conteúdo, entre em contato com a nossa redação. Correções são realizadas com transparência e registradas na própria publicação.</p>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <a href="mailto:redacao@ovalorcapital.com.br" style="display:inline-flex;align-items:center;gap:6px;background:#0A1A2F;color:#D4AF37;text-decoration:none;padding:7px 14px;border-radius:6px;font-size:12px;font-weight:700;letter-spacing:.04em;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          Reportar erro ou correção
        </a>
        <span style="color:#9aa0ab;font-size:11px;">redacao@ovalorcapital.com.br</span>
      </div>
    </div>
  </div>
  <div style="margin-top:14px;padding-top:12px;border-top:1px solid #e2e5ea;font-size:11px;color:#9aa0ab;">
    © ${new Date().getFullYear()} O Valor Capital — Liberdade Econômica, Família e Patrimônio. Todos os direitos reservados. 
    Reprodução parcial ou total permitida desde que citada a fonte com link para o conteúdo original.
  </div>
</div>
`;

  const corpo = p.corpo || p.resumo || '';
      if(bodyEl) bodyEl.innerHTML = renderBody(corpo) + notaEditorial;

      document.title = tituloLimpo + ' | O Valor Capital';
      const metaDesc = document.querySelector('meta[name="description"]');
      if(metaDesc) metaDesc.setAttribute('content', cleanMd(p.resumo || p.titulo).slice(0,160));

      (function setOG(post){
        function upsertMeta(attr, key, val){
          let el = document.querySelector('meta[' + attr + '="' + key + '"]');
          if(!el){ el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
          el.setAttribute('content', val);
        }
        const titulo = tituloLimpo || 'O Valor Capital';
        const descricao = cleanMd(post.resumo || post.titulo || '').slice(0, 160);
        const imagem = post.imagem || 'https://www.ovalorcapital.com.br/assets/og-default.jpg';
        const url = window.location.href;
        upsertMeta('property','og:type','article');
        upsertMeta('property','og:site_name','O Valor Capital');
        upsertMeta('property','og:url', url);
        upsertMeta('property','og:title', titulo);
        upsertMeta('property','og:description', descricao);
        upsertMeta('property','og:image', imagem);
        upsertMeta('property','og:image:width','1200');
        upsertMeta('property','og:image:height','630');
        upsertMeta('property','og:locale','pt_BR');
        upsertMeta('name','twitter:card','summary_large_image');
        upsertMeta('name','twitter:site','@ovalorcapital');
        upsertMeta('name','twitter:title', titulo);
        upsertMeta('name','twitter:description', descricao);
        upsertMeta('name','twitter:image', imagem);
        let canonical = document.querySelector('link[rel="canonical"]');
        if(!canonical){ canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
        canonical.href = url;
      })(p);

      if(typeof OVC !== 'undefined' && OVC.applyCategoryColor){
        OVC.applyCategoryColor(p.categoria || 'geral');
      }

      loadMais(p.categoria, p.id);

    } catch(e){
      if(bodyEl) bodyEl.innerHTML = '<p>Matéria não encontrada.</p>';
    }
  }

  async function loadMais(categoria, idAtual){
    const maisEl = document.getElementById('ovc-art-mais');
    if(!maisEl) return;
    try{
      const res = await fetch(API + '?limit=6' + (categoria ? '&categoria=' + categoria : ''));
      const json = await res.json();
      const posts = (json.posts || []).filter(p => p.id !== idAtual && p.titulo).slice(0, 5);
      maisEl.innerHTML = posts.map(p => `
        <article class="ovc-mini-item" onclick="location.href='${buildUrl(p)}'" style="cursor:pointer">
          <div>
            <div class="ovc-kicker">${catLabel(p.categoria)}</div>
            <h4><a href="${buildUrl(p)}" onclick="event.stopPropagation()">${cleanMd(p.titulo)}</a></h4>
          </div>
          ${p.imagem ? `<a href="${buildUrl(p)}" onclick="event.stopPropagation()" class="ovc-thumb"><img src="${p.imagem}" alt="" onerror="this.parentElement.style.display='none'"></a>` : ''}
        </article>
      `).join('');
    } catch(_) {}
  }

  document.addEventListener('DOMContentLoaded', loadMateria);
})();
