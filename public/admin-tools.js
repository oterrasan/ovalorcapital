(function(){
  const SUPABASE_URL = 'https://bfsegqdgscudtdgwdyci.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIc3VwYWJhc2UiLCJyZWYiOiJiZnNlZ3FkZ3NjdWR0ZGd3ZHljaSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3NzU0NDYzNTIsImV4cCI6MjA5MTAyMjM1Mn0.WmkHzK33qqtlvtal92WXVeyIE1DGRZOrw_pZtPGeV50';
  let sb = null;
  const state = { semfoto: [], seo: [], blocos: [], conclusao: [], imagens: [] };

  function initSb(){
    if (!sb && window.supabase) sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return sb;
  }
  function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function fmt(d){if(!d)return '-';return new Date(d).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});}
  function text(s){return String(s||'').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\*\*/g,'').replace(/#+\s*/g,'').replace(/\s+/g,' ').trim();}
  function slugify(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-').slice(0,65);}
  function metricsOf(p){if(!p||!p.metrics)return {};if(typeof p.metrics==='string'){try{return JSON.parse(p.metrics)||{};}catch(e){return {};}}return p.metrics||{};}
  function msg(id, body, kind){const el=document.getElementById(id); if(el){el.className='ovc-tools-msg '+(kind||''); el.textContent=body;}}
  function panel(){return document.getElementById('ovc-tools-panel');}

  function ensureStyles(){
    if (document.getElementById('ovc-tools-style')) return;
    const st = document.createElement('style');
    st.id = 'ovc-tools-style';
    st.textContent = `
      #ovc-tools-panel{position:fixed;left:220px;top:0;right:0;bottom:0;background:var(--bg,#08080f);z-index:900;overflow:auto;color:var(--t1,#f1f1f1);box-shadow:-20px 0 60px rgba(0,0,0,.45)}
      .ovc-tools-head{position:sticky;top:0;z-index:2;background:var(--bg,#08080f);border-bottom:1px solid var(--border,rgba(255,255,255,.08));padding:22px 28px;display:flex;align-items:center;justify-content:space-between;gap:14px}.ovc-tools-head h1{font-size:21px;margin:0}.ovc-tools-head p{margin:3px 0 0;color:var(--t2,#888);font-size:13px}.ovc-tools-body{padding:22px 28px 40px}.ovc-tools-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}.ovc-tools-tab{border:1px solid var(--border,rgba(255,255,255,.08));background:rgba(255,255,255,.05);color:var(--t2,#888);border-radius:8px;padding:8px 12px;font-weight:700;cursor:pointer}.ovc-tools-tab.active{background:rgba(200,30,30,.16);border-color:rgba(200,30,30,.55);color:#fff}.ovc-tools-card{background:var(--card,#0f0f1a);border:1px solid var(--border,rgba(255,255,255,.08));border-radius:12px;padding:18px;margin-bottom:16px}.ovc-tools-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.ovc-tools-row h2{font-size:18px;margin:0;flex:1}.ovc-tools-btn{border:0;border-radius:8px;padding:8px 12px;font-weight:700;cursor:pointer;color:#fff;background:var(--red,#c81e1e)}.ovc-tools-btn:hover{background:var(--red-h,#e02222)}.ovc-tools-btn.secondary{background:rgba(255,255,255,.07);border:1px solid var(--border,rgba(255,255,255,.08));color:#fff}.ovc-tools-btn.green{background:#16a34a}.ovc-tools-btn.warn{background:#a16207}.ovc-tools-btn:disabled{opacity:.55;cursor:not-allowed}.ovc-tools-msg{white-space:pre-wrap;color:#d6d6de;background:rgba(255,255,255,.04);border:1px solid var(--border,rgba(255,255,255,.08));border-radius:10px;padding:12px;margin-top:12px;max-height:260px;overflow:auto}.ovc-tools-msg.ok{color:#4ade80}.ovc-tools-msg.bad{color:#f87171}.ovc-tools-msg.warn{color:#facc15}.ovc-tools-table{width:100%;border-collapse:collapse;margin-top:12px}.ovc-tools-table th,.ovc-tools-table td{border-bottom:1px solid rgba(255,255,255,.06);padding:10px;text-align:left;vertical-align:top}.ovc-tools-table th{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--t2,#888)}.ovc-tools-pill{display:inline-flex;border-radius:999px;padding:3px 8px;font-size:11px;font-weight:700;background:rgba(255,255,255,.08);color:#ddd}.ovc-tools-pill.green{background:rgba(22,163,74,.15);color:#4ade80}.ovc-tools-pill.yellow{background:rgba(255,200,0,.15);color:#facc15}.ovc-tools-pill.red{background:rgba(200,30,30,.18);color:#f87171}.ovc-tools-thumb{width:74px;height:48px;border-radius:6px;object-fit:cover;background:#191923;border:1px solid var(--border,rgba(255,255,255,.08))}.ovc-tools-two{display:grid;grid-template-columns:1fr 1fr;gap:16px}.ovc-tools-input{background:var(--input,#111120);border:1px solid var(--border,rgba(255,255,255,.08));border-radius:8px;color:#fff;padding:9px 11px;font:inherit;min-width:210px}
      @media(max-width:900px){#ovc-tools-panel{left:0}.ovc-tools-two{grid-template-columns:1fr}.ovc-tools-head{padding:18px}.ovc-tools-body{padding:18px}.ovc-tools-table th:nth-child(4),.ovc-tools-table td:nth-child(4){display:none}}
    `;
    document.head.appendChild(st);
  }

  function moveReescritaButton(){
    Array.from(document.querySelectorAll('button')).forEach(function(btn){
      if ((btn.textContent||'').toUpperCase().includes('REESCRITA OVC') && btn.style.position === 'fixed') {
        btn.style.top = 'auto';
        btn.style.bottom = '18px';
        btn.style.right = '18px';
        btn.style.zIndex = '850';
        btn.style.boxShadow = '0 8px 22px rgba(200,30,30,.45)';
      }
    });
  }

  function ensureNav(){
    const nav = document.querySelector('.nav');
    if (!nav || document.querySelector('[data-ovc-tools-nav]')) return;
    const item = document.createElement('div');
    item.className = 'nav-item';
    item.setAttribute('data-ovc-tools-nav','1');
    item.innerHTML = '<span class="nav-icon">🧰</span><span>Ferramentas</span>';
    item.onclick = openTools;
    const config = Array.from(nav.querySelectorAll('.nav-item')).find(function(x){return (x.textContent||'').includes('Configurações');});
    nav.insertBefore(item, config || nav.lastChild);
  }

  function openTools(){
    ensureStyles();
    let el = panel();
    if (!el) {
      el = document.createElement('div');
      el.id = 'ovc-tools-panel';
      document.body.appendChild(el);
    }
    el.innerHTML = `
      <div class="ovc-tools-head">
        <div><h1>Ferramentas Administrativas</h1><p>Recursos recuperados dentro do Centro de Comando OVC.</p></div>
        <button class="ovc-tools-btn secondary" data-close>Fechar</button>
      </div>
      <div class="ovc-tools-body">
        <div class="ovc-tools-tabs">
          <button class="ovc-tools-tab active" data-tab="semfoto">Sem Foto</button>
          <button class="ovc-tools-tab" data-tab="seo">SEO Batch</button>
          <button class="ovc-tools-tab" data-tab="blocos">Blocos Gigantes</button>
          <button class="ovc-tools-tab" data-tab="conclusao">Conclusão OVC</button>
          <button class="ovc-tools-tab" data-tab="imagens">Imagens Ruins</button>
          <button class="ovc-tools-tab" data-tab="limpeza">Limpeza</button>
        </div>
        <div id="ovc-tools-content"></div>
      </div>`;
    el.querySelector('[data-close]').onclick = function(){ el.remove(); };
    el.querySelectorAll('.ovc-tools-tab').forEach(function(b){b.onclick=function(){el.querySelectorAll('.ovc-tools-tab').forEach(function(x){x.classList.remove('active');}); b.classList.add('active'); renderTab(b.dataset.tab);};});
    renderTab('semfoto');
  }

  function renderTab(tab){
    const c = document.getElementById('ovc-tools-content'); if(!c) return;
    const titles = {semfoto:'Matérias sem foto',seo:'SEO Batch',blocos:'Corrigir blocos gigantes',conclusao:'Migrar para Conclusão OVC',imagens:'Varredura de imagens ruins',limpeza:'Limpeza operacional'};
    if(tab==='limpeza') {
      const d = new Date(Date.now()-7*24*3600*1000).toISOString().slice(0,10);
      c.innerHTML = `<div class="ovc-tools-two"><div class="ovc-tools-card"><h2 style="margin-top:0">Pendentes antigos</h2><div class="ovc-tools-row"><input id="ovc-cut-date" class="ovc-tools-input" type="date" value="${d}"><button class="ovc-tools-btn warn" id="ovc-clean-old">Arquivar pendentes antigos</button></div><div class="ovc-tools-msg" id="ovc-clean-msg">Ação manual. Nada roda automaticamente.</div></div><div class="ovc-tools-card"><h2 style="margin-top:0">Consulta rápida</h2><div class="ovc-tools-row"><button class="ovc-tools-btn secondary" id="ovc-status">Status do motor</button><button class="ovc-tools-btn secondary" id="ovc-counts">Contagens</button></div><div class="ovc-tools-msg" id="ovc-status-msg">Aguardando consulta.</div></div></div>`;
      document.getElementById('ovc-clean-old').onclick = cleanOld;
      document.getElementById('ovc-status').onclick = statusBox;
      document.getElementById('ovc-counts').onclick = countsBox;
      return;
    }
    const btn = tab==='imagens' ? '<button class="ovc-tools-btn warn" id="ovc-run-vision">Rodar IA em 4 publicadas</button>' : `<button class="ovc-tools-btn green" id="ovc-apply">${tab==='seo'?'Aplicar 10':tab==='blocos'?'Corrigir 10':'Migrar 10'}</button>`;
    c.innerHTML = `<div class="ovc-tools-card"><div class="ovc-tools-row"><h2>${titles[tab]}</h2><button class="ovc-tools-btn secondary" id="ovc-load">Carregar</button>${tab==='semfoto'?'':btn}</div><div class="ovc-tools-msg" id="ovc-msg">Aguardando carregamento.</div><div id="ovc-table"></div></div>`;
    document.getElementById('ovc-load').onclick = function(){ loadTab(tab); };
    const apply = document.getElementById('ovc-apply'); if(apply) apply.onclick = function(){ applyTab(tab); };
    const vision = document.getElementById('ovc-run-vision'); if(vision) vision.onclick = runVision;
  }

  async function fetchPosts(limit){
    if (!initSb()) throw new Error('Supabase não carregou ainda. Aguarde alguns segundos e tente de novo.');
    const r = await sb.from('posts').select('id,titulo,status,approved,imagem,user_tags,subcategoria,created_at,published_at,conteudo,comentario_fixado,metrics').order('created_at',{ascending:false}).limit(limit||100);
    if (r.error) throw r.error;
    return r.data || [];
  }
  function renderRows(rows, cols){
    const target=document.getElementById('ovc-table'); if(!target) return;
    target.innerHTML = rows.length ? `<table class="ovc-tools-table"><thead><tr>${cols.map(function(c){return `<th>${c.h}</th>`;}).join('')}</tr></thead><tbody>${rows.map(function(r){return `<tr>${cols.map(function(c){return `<td>${c.f(r)}</td>`;}).join('')}</tr>`;}).join('')}</tbody></table>` : '<div class="ovc-tools-msg">Nada encontrado.</div>';
  }
  async function loadTab(tab){
    msg('ovc-msg','Carregando...');
    try {
      const posts = await fetchPosts(120);
      if (tab==='semfoto') {
        state.semfoto = posts.filter(function(p){return !String(p.imagem||'').trim();});
        renderRows(state.semfoto,[{h:'Título',f:function(p){return esc(p.titulo);}},{h:'Status',f:function(p){return `<span class="ovc-tools-pill ${p.status==='publicado'?'green':'yellow'}">${esc(p.status)}</span>`;}},{h:'Data',f:function(p){return fmt(p.created_at);}},{h:'Ação',f:function(p){return `<button class="ovc-tools-btn secondary" data-pend="${p.id}">Mover p/ pendente</button>`;}}]);
        msg('ovc-msg',state.semfoto.length+' matérias sem foto encontradas.','ok');
      }
      if (tab==='seo') {
        state.seo = posts.filter(function(p){return p.status==='publicado';}).map(buildSeo).filter(function(x){return x.needs;});
        renderRows(state.seo,[{h:'Título',f:function(p){return esc(p.titulo);}},{h:'Meta title',f:function(p){return esc(p.meta_title);}},{h:'Meta descrição',f:function(p){return esc(p.meta_descricao);}},{h:'Slug',f:function(p){return esc(p.seo_slug);}}]);
        msg('ovc-msg',state.seo.length+' publicadas com SEO incompleto no lote recente.','ok');
      }
      if (tab==='blocos') {
        state.blocos = posts.map(function(p){p.longs = longCount(p.conteudo); return p;}).filter(function(p){return p.longs>0;});
        renderRows(state.blocos,[{h:'Título',f:function(p){return esc(p.titulo);}},{h:'Status',f:function(p){return `<span class="ovc-tools-pill">${esc(p.status)}</span>`;}},{h:'Blocos',f:function(p){return String(p.longs);}},{h:'Data',f:function(p){return fmt(p.created_at);}}]);
        msg('ovc-msg',state.blocos.length+' matérias com blocos grandes no lote recente.','ok');
      }
      if (tab==='conclusao') {
        state.conclusao = posts.filter(function(p){return fixConclusion(p.conteudo)!==String(p.conteudo||'');});
        renderRows(state.conclusao,[{h:'Título',f:function(p){return esc(p.titulo);}},{h:'Status',f:function(p){return `<span class="ovc-tools-pill">${esc(p.status)}</span>`;}},{h:'Data',f:function(p){return fmt(p.created_at);}},{h:'Achado',f:function(p){return esc(OLD_HEADINGS.find(function(h){return String(p.conteudo||'').toLowerCase().includes(h.toLowerCase());})||'Cabeçalho antigo');}}]);
        msg('ovc-msg',state.conclusao.length+' matérias com cabeçalho antigo no lote recente.','ok');
      }
      if (tab==='imagens') {
        state.imagens = posts.map(function(p){p.reason=imageReason(p); return p;}).filter(function(p){return p.reason;});
        renderRows(state.imagens,[{h:'Imagem',f:function(p){return p.imagem?`<img class="ovc-tools-thumb" src="${esc(p.imagem)}">`:'<span class="ovc-tools-pill red">sem foto</span>'; }},{h:'Título',f:function(p){return esc(p.titulo);}},{h:'Motivo',f:function(p){return `<span class="ovc-tools-pill yellow">${esc(p.reason)}</span>`;}},{h:'Ação',f:function(p){return `<button class="ovc-tools-btn secondary" data-pend="${p.id}">Mover p/ pendente</button>`;}}]);
        msg('ovc-msg',state.imagens.length+' imagens suspeitas por regra local.','ok');
      }
      document.querySelectorAll('[data-pend]').forEach(function(b){b.onclick=function(){ pendenciar(b.getAttribute('data-pend')); };});
    } catch(e) { msg('ovc-msg', e.message || String(e), 'bad'); }
  }
  async function pendenciar(id){
    if(!confirm('Mover esta matéria para pendente?')) return;
    if(!initSb()) return alert('Supabase não carregou.');
    const r = await sb.from('posts').update({status:'pendente',approved:false,updated_at:new Date().toISOString()}).eq('id',id);
    if(r.error) alert(r.error.message); else alert('Movido para pendente.');
  }

  function fit(s,max){let t=text(s); if(t.length>max)t=t.slice(0,max-1).replace(/\s+\S*$/,'')+'…'; return t;}
  function buildSeo(p){const m=metricsOf(p);const base=text(p.comentario_fixado||p.conteudo||p.titulo);const meta_title=m.meta_title||fit(p.titulo,55);const meta_descricao=m.meta_descricao||fit(base,155);const seo_slug=m.seo_slug||slugify(p.titulo).split('-').slice(0,5).join('-');return {id:p.id,titulo:p.titulo,meta_title,meta_descricao,seo_slug,metrics:Object.assign({},m,{meta_title,meta_descricao,seo_slug}),needs:!m.meta_title||!m.meta_descricao||!m.seo_slug||!p.comentario_fixado,comentario_fixado:p.comentario_fixado||meta_descricao};}
  function splitInner(inner){if(text(inner).length<=420)return [`<p>${inner.trim()}</p>`];const sentences=String(inner).match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)||[inner];const out=[];let buf='';sentences.forEach(function(s){const next=(buf+' '+s).trim();if(text(next).length>360&&buf){out.push(`<p>${buf.trim()}</p>`);buf=s.trim();}else buf=next;});if(buf)out.push(`<p>${buf.trim()}</p>`);return out;}
  function normalizeContent(html){const v=String(html||'').trim();if(!v)return v;if(/<p[\s>]/i.test(v))return v.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi,function(full,inner){return splitInner(inner).join('\n');});return splitInner(v).join('\n');}
  function longCount(html){let n=0;String(html||'').replace(/<p[^>]*>([\s\S]*?)<\/p>/gi,function(m,inner){if(text(inner).length>420)n++;return m;});if(!n&&text(html).length>900&&!/<p[\s>]/i.test(String(html||'')))n=1;return n;}
  const OLD_HEADINGS=['Interpretação Estratégica','Análise Estratégica','Reflexões Finais','Considerações Finais','Perspectiva Estratégica','Leitura de Segunda Ordem','Impactos Não Óbvios','Posicionamento Institucional'];
  function rxEscape(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
  function fixConclusion(html){let out=String(html||'');OLD_HEADINGS.forEach(function(h){out=out.replace(new RegExp(`<h2[^>]*>\\s*${rxEscape(h)}\\s*<\\/h2>`,'gi'),'<h2>Conclusão OVC</h2>');out=out.replace(new RegExp(`(^|\\n)#{1,3}\\s*${rxEscape(h)}\\s*(?=\\n|$)`,'gi'),'$1<h2>Conclusão OVC</h2>');});return out;}
  function imageReason(p){const u=String(p.imagem||'').trim().toLowerCase();if(!u)return 'sem imagem';if(u.endsWith('.svg'))return 'svg';if(/logo|placeholder|avatar|icon|default|favicon|sprite|banner/i.test(u))return 'arquivo suspeito';if(u.startsWith('data:image'))return 'imagem embutida';return '';}

  async function applyTab(tab){
    if(!initSb()) return msg('ovc-msg','Supabase não carregou.','bad');
    const list = (tab==='seo'?state.seo:tab==='blocos'?state.blocos:state.conclusao).slice(0,10);
    if(!list.length) return msg('ovc-msg','Carregue o lote primeiro.','warn');
    if(!confirm('Aplicar ação em '+list.length+' matérias?')) return;
    let ok=0;
    for (const p of list) {
      let r;
      if(tab==='seo') r = await sb.from('posts').update({metrics:p.metrics,comentario_fixado:p.comentario_fixado,updated_at:new Date().toISOString()}).eq('id',p.id);
      if(tab==='blocos') r = await sb.from('posts').update({conteudo:normalizeContent(p.conteudo),updated_at:new Date().toISOString()}).eq('id',p.id);
      if(tab==='conclusao') r = await sb.from('posts').update({conteudo:fixConclusion(p.conteudo),updated_at:new Date().toISOString()}).eq('id',p.id);
      if(r && !r.error) ok++;
    }
    msg('ovc-msg','Aplicado em '+ok+'/'+list.length+'.','ok');
  }
  async function runVision(){
    if(!confirm('A varredura por IA pode mover matérias publicadas para pendente. Rodar apenas 4 agora?')) return;
    msg('ovc-msg','Rodando IA do servidor...');
    try {const r=await fetch('/api/manage?action=audit_images&batch=4&offset=0');const j=await r.json();msg('ovc-msg',JSON.stringify(j,null,2),j.ok?'ok':'bad');} catch(e){msg('ovc-msg',e.message,'bad');}
  }
  async function cleanOld(){
    const d=document.getElementById('ovc-cut-date').value;if(!d)return msg('ovc-clean-msg','Informe a data de corte.','warn');
    if(!confirm('Arquivar pendentes anteriores a '+d+'?')) return;
    try {const r=await fetch('/api/manage?action=limpar_pendentes_antigos&antes='+encodeURIComponent(d+'T00:00:00'));const j=await r.json();msg('ovc-clean-msg',JSON.stringify(j,null,2),j.ok?'ok':'bad');} catch(e){msg('ovc-clean-msg',e.message,'bad');}
  }
  async function statusBox(){try{const r=await fetch('/api/manage');const j=await r.json();msg('ovc-status-msg',JSON.stringify(j,null,2),'ok');}catch(e){msg('ovc-status-msg',e.message,'bad');}}
  async function countsBox(){try{if(!initSb()) throw new Error('Supabase não carregou.');const out={};for(const s of ['publicado','pendente','rejeitado','arquivado','error']){const r=await sb.from('posts').select('id',{count:'exact',head:true}).eq('status',s);out[s]=r.count||0;}msg('ovc-status-msg',JSON.stringify(out,null,2),'ok');}catch(e){msg('ovc-status-msg',e.message,'bad');}}

  function boot(){
    moveReescritaButton();
    ensureNav();
    initSb();
  }
  const timer = setInterval(boot, 1200);
  setTimeout(function(){clearInterval(timer); setInterval(boot, 5000);}, 20000);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
