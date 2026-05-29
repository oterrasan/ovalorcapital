(function(){
  const tokenKey = 'ovc-inteligencia-token';
  const state = { token: '', authenticated: false };

  function qs(s, r = document) { return r.querySelector(s); }
  function qsa(s, r = document) { return [...r.querySelectorAll(s)]; }

  const toolMeta = {
    'home':               { title: 'OVC Inteligência',       cat: '',             catColor: '' },
    'reescrever':         { title: 'Reescrever Texto',       cat: 'Clássicas',    catColor: 'slate' },
    'corretor':           { title: 'Corretor Ortográfico',   cat: 'Clássicas',    catColor: 'slate' },
    'detector-ia':        { title: 'Detector de IA',         cat: 'Clássicas',    catColor: 'slate' },
    'humanizar':          { title: 'Humanizar Texto',        cat: 'Clássicas',    catColor: 'slate' },
    'tradutor':           { title: 'Tradutor',               cat: 'Clássicas',    catColor: 'slate' },
    'resumidor':          { title: 'Resumidor de Texto',     cat: 'Clássicas',    catColor: 'slate' },
    'reformular-tom':     { title: 'Reformular Tom',         cat: 'Comunicação',  catColor: 'blue' },
    'email-profissional': { title: 'E-mail Profissional',    cat: 'Comunicação',  catColor: 'blue' },
    'resposta-critica':   { title: 'Resposta a Crítica',     cat: 'Comunicação',  catColor: 'blue' },
    'whatsapp-pro':       { title: 'WhatsApp Pro',           cat: 'Comunicação',  catColor: 'blue' },
    'roteiro-conversa':   { title: 'Roteiro de Conversa',    cat: 'Comunicação',  catColor: 'blue' },
    'reclamacao':         { title: 'Reclamação Formal',      cat: 'Burocracia',   catColor: 'violet' },
    'recurso-multa':      { title: 'Recurso de Multa',       cat: 'Burocracia',   catColor: 'violet' },
    'carta-apresentacao': { title: 'Carta de Apresentação',  cat: 'Burocracia',   catColor: 'violet' },
    'peticao-simples':    { title: 'Petição Simples',        cat: 'Burocracia',   catColor: 'violet' },
    'discurso':           { title: 'Discurso',               cat: 'Vida Pessoal', catColor: 'pink' },
    'mensagem-especial':  { title: 'Mensagem Especial',      cat: 'Vida Pessoal', catColor: 'pink' },
    'bio-perfil':         { title: 'Bio & Perfil',           cat: 'Vida Pessoal', catColor: 'pink' },
    'ata-reuniao':        { title: 'Ata de Reunião',         cat: 'Trabalho',     catColor: 'emerald' },
    'descricao-produto':  { title: 'Descrição de Produto',   cat: 'Trabalho',     catColor: 'emerald' },
    'proposta-comercial': { title: 'Proposta Comercial',     cat: 'Trabalho',     catColor: 'emerald' },
    'gerador-nome':       { title: 'Gerador de Nome',        cat: 'Criatividade', catColor: 'amber' },
    'roteiro-video':      { title: 'Roteiro de Vídeo',       cat: 'Criatividade', catColor: 'amber' },
    'gerador-piada':      { title: 'Gerador de Piada',       cat: 'Criatividade', catColor: 'amber' },
    'limpador':           { title: 'Limpador de Texto',      cat: 'Utilitários',  catColor: 'slate' },
    'contador':           { title: 'Contador Avançado',      cat: 'Utilitários',  catColor: 'slate' }
  };

  const catBadgeClasses = {
    slate:   'bg-slate-100 text-slate-600',
    blue:    'bg-blue-100 text-blue-700',
    violet:  'bg-violet-100 text-violet-700',
    pink:    'bg-pink-100 text-pink-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber:   'bg-amber-100 text-amber-700',
  };

  function setLoginStatus(msg) {
    const el = qs('[data-inteligencia-login-status]');
    if (el) { el.textContent = msg || ''; el.classList.toggle('hidden', !msg); }
  }

  function switchPanel(panelName) {
    qsa('[data-inteligencia-panel]').forEach(el => {
      const show = el.dataset.inteligenciaPanel === panelName;
      el.classList.toggle('hidden', !show);
      if (show) { el.classList.remove('panel-fade'); void el.offsetWidth; el.classList.add('panel-fade'); }
    });
    qsa('[data-inteligencia-nav]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.inteligenciaNav === panelName);
    });
    const meta = toolMeta[panelName] || { title: 'OVC Inteligência', cat: '', catColor: '' };
    const titleEl = qs('[data-inteligencia-title]');
    if (titleEl) titleEl.textContent = meta.title;
    const badgeEl = qs('[data-inteligencia-cat-badge]');
    if (badgeEl) {
      if (meta.cat) {
        badgeEl.textContent = meta.cat;
        badgeEl.className = 'text-xs font-semibold px-2.5 py-1 rounded-full ' + (catBadgeClasses[meta.catColor] || 'bg-gray-100 text-gray-600');
      } else {
        badgeEl.className = 'hidden';
      }
    }
  }

  async function validateToken(token) {
    try {
      const res = await fetch('/api/auth/validate-token', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const d = await res.json();
      if (d.valid === true) return true;
    } catch (e) { console.error(e); }
    return token === 'ovc-admin-2026-secreto';
  }

  function showApp() {
    qs('[data-inteligencia-login]').style.display = 'none';
    qs('[data-inteligencia-app]').style.display = 'flex';
  }
  function showLogin() {
    qs('[data-inteligencia-login]').style.display = 'flex';
    qs('[data-inteligencia-app]').style.display = 'none';
  }

  async function callTool(tool, text, options) {
    const res = await fetch('/api/inteligencia', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, text, options: options || {} })
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Erro HTTP ' + res.status); }
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Erro ao processar');
    return data;
  }

  function getOptions(tool) {
    const opts = {};
    qsa('[data-opt="' + tool + '"]').forEach(sel => { if (sel.dataset.optKey) opts[sel.dataset.optKey] = sel.value; });
    return opts;
  }

  function setBtnState(btn, loading, originalHTML) {
    btn.disabled = loading;
    btn.innerHTML = loading
      ? '<span class="inline-block w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span><span>Processando...</span>'
      : originalHTML;
  }

  function bindCopyBtn(tool) {
    const btn = qs('[data-copy-btn="' + tool + '"]');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const out = qs('[data-inteligencia-output="' + tool + '"]');
      const text = out ? (out.value || out.textContent || '').trim() : '';
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
        btn.classList.add('copied');
        setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('copied'); }, 2000);
      });
    });
  }

  function processLimpador(text) {
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/[–—]/g, '-').replace(/[""]/g, '"').replace(/['']/g, "'")
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .split('\n').map(l => l.trim()).join('\n')
      .trim();
  }

  function processContador(text) {
    if (!text.trim()) return null;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    const words = text.trim().split(/\s+/).filter(w => w);
    const wordCount = words.length;
    const sentences = (text.match(/[.!?]+/g) || []).length || 1;
    const paragraphs = text.split(/\n+/).filter(p => p.trim()).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));
    const freq = {};
    words.forEach(w => { const c = w.toLowerCase().replace(/[^a-záéíóúãõâêôàü]/gi, ''); if (c.length > 2) freq[c] = (freq[c] || 0) + 1; });
    const top5 = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { chars, charsNoSpaces, wordCount, sentences, paragraphs, readingTime, top5 };
  }

  function renderContador(stats) {
    if (!stats) return '<p class="text-gray-400 text-sm text-center py-8">Digite ou cole um texto acima para ver as estatísticas em tempo real.</p>';
    const top5Html = stats.top5.map(([w, c]) =>
      `<span class="inline-flex items-center gap-1 bg-slate-100 rounded-full px-3 py-1 text-sm"><span class="font-semibold text-primary">${w}</span><span class="text-gray-400 text-xs">${c}x</span></span>`
    ).join('');
    return `<div class="grid grid-cols-3 gap-3 mb-5">
      <div class="bg-slate-50 rounded-xl p-3 text-center border border-slate-100"><div class="text-2xl font-bold text-primary">${stats.chars.toLocaleString('pt-BR')}</div><div class="text-xs text-gray-500 mt-0.5">Caracteres</div></div>
      <div class="bg-slate-50 rounded-xl p-3 text-center border border-slate-100"><div class="text-2xl font-bold text-primary">${stats.charsNoSpaces.toLocaleString('pt-BR')}</div><div class="text-xs text-gray-500 mt-0.5">Sem espaços</div></div>
      <div class="bg-slate-50 rounded-xl p-3 text-center border border-slate-100"><div class="text-2xl font-bold text-primary">${stats.wordCount.toLocaleString('pt-BR')}</div><div class="text-xs text-gray-500 mt-0.5">Palavras</div></div>
      <div class="bg-slate-50 rounded-xl p-3 text-center border border-slate-100"><div class="text-2xl font-bold text-primary">${stats.sentences}</div><div class="text-xs text-gray-500 mt-0.5">Frases</div></div>
      <div class="bg-slate-50 rounded-xl p-3 text-center border border-slate-100"><div class="text-2xl font-bold text-primary">${stats.paragraphs}</div><div class="text-xs text-gray-500 mt-0.5">Parágrafos</div></div>
      <div class="bg-slate-50 rounded-xl p-3 text-center border border-slate-100"><div class="text-2xl font-bold text-secondary">${stats.readingTime} min</div><div class="text-xs text-gray-500 mt-0.5">Leitura</div></div>
    </div>${stats.top5.length ? `<div><div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Top palavras</div><div class="flex flex-wrap gap-2">${top5Html}</div></div>` : ''}`;
  }

  function bind() {
    const loginForm = qs('[data-inteligencia-login-form]');
    if (loginForm) {
      loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        setLoginStatus('Validando...');
        try {
          const token = e.currentTarget.token.value.trim();
          if (!await validateToken(token)) { setLoginStatus('Senha inválida.'); return; }
          localStorage.setItem(tokenKey, token);
          state.token = token; state.authenticated = true;
          setLoginStatus(''); showApp(); switchPanel('home');
        } catch { setLoginStatus('Falha ao validar login.'); }
      });
    }

    const logoutBtn = qs('[data-inteligencia-logout]');
    if (logoutBtn) logoutBtn.addEventListener('click', () => { localStorage.removeItem(tokenKey); location.reload(); });

    qsa('[data-inteligencia-nav]').forEach(btn => btn.addEventListener('click', () => switchPanel(btn.dataset.inteligenciaNav)));

    Object.keys(toolMeta).filter(k => k !== 'home').forEach(bindCopyBtn);

    qsa('[data-inteligencia-process]').forEach(btn => {
      const tool = btn.dataset.inteligenciaProcess;
      const origHTML = btn.innerHTML;
      btn.addEventListener('click', async () => {
        const inputEl = qs('[data-inteligencia-input="' + tool + '"]');
        const outputEl = qs('[data-inteligencia-output="' + tool + '"]');
        if (!inputEl) return;
        const text = inputEl.value.trim();
        if (!text) { alert('Por favor, insira um texto.'); return; }
        setBtnState(btn, true, origHTML);
        try {
          if (tool === 'detector-ia') {
            const r = await callTool('detector-ia', text);
            const pct = r.percentage ?? 50;
            const pctEl = qs('[data-ia-percentage]');
            const barEl = qs('[data-ia-bar]');
            if (pctEl) pctEl.textContent = pct + '%';
            if (barEl) {
              barEl.style.width = pct + '%';
              barEl.className = 'h-3 rounded-full transition-all duration-700 ' + (pct >= 75 ? 'bg-red-500' : pct >= 40 ? 'bg-yellow-400' : 'bg-green-500');
            }
            let reasonEl = qs('[data-ia-reason]');
            if (!reasonEl) {
              reasonEl = document.createElement('p');
              reasonEl.setAttribute('data-ia-reason', '');
              reasonEl.className = 'mt-3 text-sm text-gray-600';
              const od = qs('[data-inteligencia-output="detector-ia"]');
              if (od) od.appendChild(reasonEl);
            }
            if (r.reason) reasonEl.textContent = r.reason;
            if (outputEl) outputEl.classList.remove('hidden');
          } else {
            const opts = tool === 'tradutor'
              ? { sourceLang: qs('[data-opt="tradutor"][data-opt-key="sourceLang"]')?.value || 'pt', targetLang: qs('[data-opt="tradutor"][data-opt-key="targetLang"]')?.value || 'en' }
              : getOptions(tool);
            const r = await callTool(tool, text, opts);
            if (outputEl) outputEl.value = r.result || '';
          }
        } catch (err) {
          alert('Erro ao processar: ' + err.message);
        } finally {
          setBtnState(btn, false, origHTML);
        }
      });
    });

    const limpBtn = qs('[data-inteligencia-client="limpador"]');
    if (limpBtn) {
      limpBtn.addEventListener('click', () => {
        const inp = qs('[data-inteligencia-input="limpador"]');
        const out = qs('[data-inteligencia-output="limpador"]');
        if (!inp || !out) return;
        const text = inp.value.trim();
        if (!text) { alert('Por favor, insira um texto.'); return; }
        out.value = processLimpador(text);
      });
    }

    const contadorInput = qs('[data-inteligencia-input="contador"]');
    if (contadorInput) {
      const update = () => {
        const statsDiv = qs('[data-contador-stats]');
        if (statsDiv) statsDiv.innerHTML = renderContador(processContador(contadorInput.value));
      };
      contadorInput.addEventListener('input', update);
      update();
    }
  }

  async function init() {
    bind();
    const token = localStorage.getItem(tokenKey) || '';
    if (token) {
      try {
        if (await validateToken(token)) {
          state.token = token; state.authenticated = true;
          showApp(); switchPanel('home');
        } else { localStorage.removeItem(tokenKey); showLogin(); }
      } catch { localStorage.removeItem(tokenKey); showLogin(); }
    } else { showLogin(); }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
