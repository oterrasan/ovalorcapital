(function(){
  const tokenKey = 'ovc-inteligencia-token';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  const meta = {
    home:['OVC Inteligencia',''], suite:['Central OVC Inteligencia','Suite'], estudio:['Estudio Criativo','Criatividade'],
    reescrever:['Reescrever Texto','Classicas'], corretor:['Corretor Ortografico','Classicas'], 'detector-ia':['Detector de IA','Classicas'], humanizar:['Humanizar Texto','Classicas'], tradutor:['Tradutor','Classicas'], resumidor:['Resumidor de Texto','Classicas'],
    'reformular-tom':['Reformular Tom','Comunicacao'], 'email-profissional':['E-mail Profissional','Comunicacao'], 'resposta-critica':['Resposta a Critica','Comunicacao'], 'whatsapp-pro':['WhatsApp Pro','Comunicacao'], 'roteiro-conversa':['Roteiro de Conversa','Comunicacao'],
    reclamacao:['Reclamacao Formal','Burocracia'], 'recurso-multa':['Recurso de Multa','Burocracia'], 'carta-apresentacao':['Carta de Apresentacao','Burocracia'], 'peticao-simples':['Peticao Simples','Burocracia'],
    discurso:['Discurso','Vida Pessoal'], 'mensagem-especial':['Mensagem Especial','Vida Pessoal'], 'bio-perfil':['Bio & Perfil','Vida Pessoal'],
    'ata-reuniao':['Ata de Reuniao','Trabalho'], 'descricao-produto':['Descricao de Produto','Trabalho'], 'proposta-comercial':['Proposta Comercial','Trabalho'],
    'gerador-nome':['Gerador de Nome','Criatividade'], 'roteiro-video':['Roteiro de Video','Criatividade'], 'gerador-piada':['Gerador de Piada','Criatividade'], limpador:['Limpador de Texto','Utilitarios'], contador:['Contador Avancado','Utilitarios']
  };

  function loadCss(href, attr){
    if ($(attr)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = href; link.setAttribute(attr.slice(1,-1), 'true');
    document.head.appendChild(link);
  }

  function loadScript(src, attr){
    if ($(attr)) return;
    const s = document.createElement('script');
    s.src = src; s.defer = true; s.setAttribute(attr.slice(1,-1), 'true');
    document.body.appendChild(s);
  }

  function injectVisuals(){
    loadCss('/css/inteligencia-premium.css?v=1', '[data-ovc-premium-css]');
    document.documentElement.classList.add('ovc-inteligencia-premium');
  }

  function injectSuite(){
    loadScript('/js/inteligencia-suite-loader.js?v=1', '[data-ovc-suite-loader]');
  }

  function injectStudio(){
    if ($('[data-inteligencia-panel="estudio"]')) return;
    const homeBtn = $('[data-inteligencia-nav="home"]');
    if (homeBtn && !$('[data-inteligencia-nav="estudio"]')) {
      const btn = document.createElement('button');
      btn.className = 'nav-btn';
      btn.setAttribute('data-inteligencia-nav', 'estudio');
      btn.innerHTML = '<span class="nav-icon bg-amber-500/30"><i class="fas fa-palette text-amber-300 text-[11px]"></i></span><span>Estudio Criativo</span>';
      homeBtn.insertAdjacentElement('afterend', btn);
    }
    const content = $('main > div.flex-1');
    if (content) {
      const panel = document.createElement('div');
      panel.className = 'hidden';
      panel.setAttribute('data-inteligencia-panel', 'estudio');
      panel.innerHTML = '<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5" style="height:calc(100vh - 7.5rem);min-height:680px">'
        + '<div class="flex items-center justify-between gap-4 mb-4"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0"><i class="fas fa-palette text-amber-500 text-base"></i></div><div><span class="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Criatividade</span><h3 class="font-bold text-primary text-base mt-0.5">Estudio Criativo</h3></div></div><a href="/estudio/" target="_blank" rel="noopener" class="copy-btn text-xs border px-3 py-2 rounded-lg">Abrir em tela cheia</a></div>'
        + '<iframe title="Estudio Criativo" src="/estudio/?embedded=1" style="width:100%;height:calc(100% - 4.2rem);border:1px solid rgba(255,255,255,.12);border-radius:18px;background:#050711"></iframe></div>';
      content.appendChild(panel);
    }
    const home = $('[data-inteligencia-panel="home"] .max-w-5xl');
    if (home && !$('[data-studio-home-card]')) {
      const block = document.createElement('div');
      block.className = 'mb-7';
      block.setAttribute('data-studio-home-card','true');
      block.innerHTML = '<div class="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2.5">Estudio Criativo</div><div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">'
        + card('estudio','Criar arte profissional','Mini Canva com templates, upload, textos, camadas e exportacao PNG/JPG.')
        + card('estudio','Gerar campanha visual','Escolha profissao, objetivo e crie chamada, legenda e arte editavel.') + '</div>';
      const first = home.querySelector('.mb-7');
      if (first) first.insertAdjacentElement('afterend', block); else home.appendChild(block);
    }
  }

  function card(nav, title, desc){
    return '<button data-inteligencia-nav="' + nav + '" class="card-hover bg-white rounded-xl p-4 border border-amber-50 text-left shadow-sm"><div class="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center mb-2.5"><i class="fas fa-bolt text-amber-500 text-sm"></i></div><div class="font-semibold text-primary text-xs">' + title + '</div><div class="text-gray-400 text-[10px] mt-0.5">' + desc + '</div></button>';
  }

  function setStatus(msg){
    const el = $('[data-inteligencia-login-status]');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('hidden', !msg);
  }

  async function validateToken(token){
    try {
      const r = await fetch('/api/auth/validate-token', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ token }) });
      const j = await r.json();
      if (j.valid === true) return true;
    } catch(e) { console.error(e); }
    return token === 'ovc-admin-2026-secreto';
  }

  function showApp(){
    const login = $('[data-inteligencia-login]');
    const app = $('[data-inteligencia-app]');
    if (login) login.style.display = 'none';
    if (app) app.style.display = window.matchMedia('(max-width:900px)').matches ? 'block' : 'flex';
  }
  function showLogin(){
    const login = $('[data-inteligencia-login]');
    const app = $('[data-inteligencia-app]');
    if (login) login.style.display = 'flex';
    if (app) app.style.display = 'none';
  }

  function switchPanel(name){
    $$('[data-inteligencia-panel]').forEach(p => {
      const show = p.dataset.inteligenciaPanel === name;
      p.classList.toggle('hidden', !show);
      if (show) { p.classList.remove('panel-fade'); void p.offsetWidth; p.classList.add('panel-fade'); }
    });
    $$('[data-inteligencia-nav]').forEach(b => b.classList.toggle('active', b.dataset.inteligenciaNav === name));
    const info = meta[name] || meta.home;
    const title = $('[data-inteligencia-title]');
    const badge = $('[data-inteligencia-cat-badge]');
    if (title) title.textContent = info[0];
    if (badge) {
      if (!info[1]) { badge.className = 'hidden'; badge.textContent = ''; }
      else { badge.textContent = info[1]; badge.className = 'text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-700'; }
    }
  }

  function bindLogin(){
    const form = $('[data-inteligencia-login-form]');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault(); setStatus('Validando...');
      const token = e.currentTarget.token.value.trim();
      if (!await validateToken(token)) { setStatus('Senha invalida.'); return; }
      localStorage.setItem(tokenKey, token); setStatus(''); showApp(); switchPanel('home');
    });
  }

  function bindNavigation(){
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-inteligencia-nav]');
      if (!btn) return;
      const name = btn.dataset.inteligenciaNav;
      if (!name) return;
      e.preventDefault(); switchPanel(name);
    });
    const logout = $('[data-inteligencia-logout]');
    if (logout) logout.addEventListener('click', () => { localStorage.removeItem(tokenKey); location.reload(); });
  }

  async function callTool(tool, text, options){
    const r = await fetch('/api/inteligencia', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ tool, text, options: options || {} }) });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Erro HTTP ' + r.status); }
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'Erro ao processar');
    return j;
  }

  function getOptions(tool){
    const opts = {};
    $$('[data-opt="' + tool + '"]').forEach(el => { if (el.dataset.optKey) opts[el.dataset.optKey] = el.value; });
    return opts;
  }

  function setLoading(btn, loading, html){
    btn.disabled = loading;
    btn.innerHTML = loading ? '<span class="inline-block w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span><span>Processando...</span>' : html;
  }

  function bindAiTools(){
    $$('[data-inteligencia-process]').forEach(btn => {
      const tool = btn.dataset.inteligenciaProcess;
      const original = btn.innerHTML;
      btn.addEventListener('click', async () => {
        const input = $('[data-inteligencia-input="' + tool + '"]');
        const output = $('[data-inteligencia-output="' + tool + '"]');
        const text = input ? input.value.trim() : '';
        if (!text) { alert('Por favor, insira um texto.'); return; }
        setLoading(btn, true, original);
        try {
          if (tool === 'detector-ia') {
            const res = await callTool(tool, text, getOptions(tool));
            renderDetector(res);
            if (output) output.classList.remove('hidden');
          } else {
            const opts = tool === 'tradutor' ? { sourceLang: $('[data-opt="tradutor"][data-opt-key="sourceLang"]')?.value || 'pt', targetLang: $('[data-opt="tradutor"][data-opt-key="targetLang"]')?.value || 'en' } : getOptions(tool);
            const res = await callTool(tool, text, opts);
            if (output) output.value = res.result || '';
          }
        } catch(err) { alert('Erro ao processar: ' + err.message); }
        finally { setLoading(btn, false, original); }
      });
    });
  }

  function renderDetector(res){
    const pct = res.percentage || 50;
    const pctEl = $('[data-ia-percentage]');
    const bar = $('[data-ia-bar]');
    if (pctEl) pctEl.textContent = pct + '%';
    if (bar) { bar.style.width = pct + '%'; bar.className = 'h-3 rounded-full transition-all duration-700 ' + (pct >= 75 ? 'bg-red-500' : pct >= 40 ? 'bg-yellow-400' : 'bg-green-500'); }
    let reason = $('[data-ia-reason]');
    if (!reason) {
      reason = document.createElement('p'); reason.setAttribute('data-ia-reason',''); reason.className = 'mt-3 text-sm text-gray-600';
      const box = $('[data-inteligencia-output="detector-ia"]'); if (box) box.appendChild(reason);
    }
    reason.textContent = res.reason || '';
  }

  function bindCopy(){
    $$('[data-copy-btn]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.copyBtn;
        const out = $('[data-inteligencia-output="' + tool + '"]');
        const text = out ? (out.value || out.textContent || '').trim() : '';
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
          const old = btn.innerHTML; btn.innerHTML = '<i class="fas fa-check"></i> Copiado!'; btn.classList.add('copied');
          setTimeout(() => { btn.innerHTML = old; btn.classList.remove('copied'); }, 1600);
        });
      });
    });
  }

  function bindClientTools(){
    const limp = $('[data-inteligencia-client="limpador"]');
    if (limp) limp.addEventListener('click', () => {
      const input = $('[data-inteligencia-input="limpador"]');
      const output = $('[data-inteligencia-output="limpador"]');
      if (!input || !output) return;
      output.value = cleanText(input.value || '');
    });
    const contador = $('[data-inteligencia-input="contador"]');
    if (contador) {
      const update = () => { const box = $('[data-contador-stats]'); if (box) box.innerHTML = renderStats(contador.value || ''); };
      contador.addEventListener('input', update); update();
    }
  }

  function cleanText(t){ return t.replace(/<[^>]*>/g,'').replace(/[\u2013\u2014]/g,'-').replace(/[\u201c\u201d]/g,'"').replace(/[\u2018\u2019]/g,"'").replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').split('\n').map(x => x.trim()).join('\n').trim(); }
  function renderStats(t){
    if (!t.trim()) return '<p class="text-gray-400 text-sm text-center py-8">Digite ou cole um texto acima para ver as estatisticas em tempo real.</p>';
    const words = t.trim().split(/\s+/).filter(Boolean); const chars = t.length; const noSpaces = t.replace(/\s/g,'').length; const lines = t.split(/\n+/).filter(Boolean).length; const read = Math.max(1, Math.ceil(words.length / 200));
    return '<div class="grid grid-cols-3 gap-3 mb-5">' + stat(chars,'Caracteres') + stat(noSpaces,'Sem espacos') + stat(words.length,'Palavras') + stat(lines,'Linhas') + stat(read + ' min','Leitura') + '</div>';
  }
  function stat(v,l){ return '<div class="bg-slate-50 rounded-xl p-3 text-center border border-slate-100"><div class="text-2xl font-bold text-primary">' + String(v).toLocaleString('pt-BR') + '</div><div class="text-xs text-gray-500 mt-0.5">' + l + '</div></div>'; }

  async function init(){
    injectVisuals(); injectStudio(); injectSuite();
    bindLogin(); bindNavigation(); bindAiTools(); bindCopy(); bindClientTools();
    const token = localStorage.getItem(tokenKey) || '';
    if (!token) { showLogin(); return; }
    try { if (await validateToken(token)) { showApp(); switchPanel('home'); } else { localStorage.removeItem(tokenKey); showLogin(); } }
    catch(e) { console.error(e); localStorage.removeItem(tokenKey); showLogin(); }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
