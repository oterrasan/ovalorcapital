(function(){
  const tokenKey = 'ovc-inteligencia-token';
  const state = { token: '', authenticated: false };

  function qs(s, r = document) { return r.querySelector(s); }
  function qsa(s, r = document) { return Array.from(r.querySelectorAll(s)); }

  function injectPremiumVisuals() {
    if (!document.querySelector('link[data-ovc-premium-css]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/css/inteligencia-premium.css?v=1';
      link.setAttribute('data-ovc-premium-css', 'true');
      document.head.appendChild(link);
    }
    document.documentElement.classList.add('ovc-inteligencia-premium');
  }

  const toolMeta = {
    home: { title: 'OVC Inteligencia', cat: '', catColor: '' },
    'reescrever': { title: 'Reescrever Texto', cat: 'Classicas', catColor: 'slate' },
    'corretor': { title: 'Corretor Ortografico', cat: 'Classicas', catColor: 'slate' },
    'detector-ia': { title: 'Detector de IA', cat: 'Classicas', catColor: 'slate' },
    'humanizar': { title: 'Humanizar Texto', cat: 'Classicas', catColor: 'slate' },
    'tradutor': { title: 'Tradutor', cat: 'Classicas', catColor: 'slate' },
    'resumidor': { title: 'Resumidor de Texto', cat: 'Classicas', catColor: 'slate' },
    'reformular-tom': { title: 'Reformular Tom', cat: 'Comunicacao', catColor: 'blue' },
    'email-profissional': { title: 'E-mail Profissional', cat: 'Comunicacao', catColor: 'blue' },
    'resposta-critica': { title: 'Resposta a Critica', cat: 'Comunicacao', catColor: 'blue' },
    'whatsapp-pro': { title: 'WhatsApp Pro', cat: 'Comunicacao', catColor: 'blue' },
    'roteiro-conversa': { title: 'Roteiro de Conversa', cat: 'Comunicacao', catColor: 'blue' },
    'reclamacao': { title: 'Reclamacao Formal', cat: 'Burocracia', catColor: 'violet' },
    'recurso-multa': { title: 'Recurso de Multa', cat: 'Burocracia', catColor: 'violet' },
    'carta-apresentacao': { title: 'Carta de Apresentacao', cat: 'Burocracia', catColor: 'violet' },
    'peticao-simples': { title: 'Peticao Simples', cat: 'Burocracia', catColor: 'violet' },
    'discurso': { title: 'Discurso', cat: 'Vida Pessoal', catColor: 'pink' },
    'mensagem-especial': { title: 'Mensagem Especial', cat: 'Vida Pessoal', catColor: 'pink' },
    'bio-perfil': { title: 'Bio & Perfil', cat: 'Vida Pessoal', catColor: 'pink' },
    'ata-reuniao': { title: 'Ata de Reuniao', cat: 'Trabalho', catColor: 'emerald' },
    'descricao-produto': { title: 'Descricao de Produto', cat: 'Trabalho', catColor: 'emerald' },
    'proposta-comercial': { title: 'Proposta Comercial', cat: 'Trabalho', catColor: 'emerald' },
    'gerador-nome': { title: 'Gerador de Nome', cat: 'Criatividade', catColor: 'amber' },
    'roteiro-video': { title: 'Roteiro de Video', cat: 'Criatividade', catColor: 'amber' },
    'gerador-piada': { title: 'Gerador de Piada', cat: 'Criatividade', catColor: 'amber' },
    'limpador': { title: 'Limpador de Texto', cat: 'Utilitarios', catColor: 'slate' },
    'contador': { title: 'Contador Avancado', cat: 'Utilitarios', catColor: 'slate' }
  };

  const catBadgeClasses = {
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-100 text-blue-700',
    violet: 'bg-violet-100 text-violet-700',
    pink: 'bg-pink-100 text-pink-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700'
  };

  function setLoginStatus(msg) {
    const el = qs('[data-inteligencia-login-status]');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('hidden', !msg);
  }

  function switchPanel(panelName) {
    qsa('[data-inteligencia-panel]').forEach(el => {
      const show = el.dataset.inteligenciaPanel === panelName;
      el.classList.toggle('hidden', !show);
      if (show) {
        el.classList.remove('panel-fade');
        void el.offsetWidth;
        el.classList.add('panel-fade');
      }
    });

    qsa('[data-inteligencia-nav]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.inteligenciaNav === panelName);
    });

    const meta = toolMeta[panelName] || toolMeta.home;
    const titleEl = qs('[data-inteligencia-title]');
    if (titleEl) titleEl.textContent = meta.title;

    const badgeEl = qs('[data-inteligencia-cat-badge]');
    if (!badgeEl) return;
    if (!meta.cat) {
      badgeEl.className = 'hidden';
      badgeEl.textContent = '';
      return;
    }
    badgeEl.textContent = meta.cat;
    badgeEl.className = 'text-xs font-semibold px-2.5 py-1 rounded-full ' + (catBadgeClasses[meta.catColor] || 'bg-gray-100 text-gray-600');
  }

  async function validateToken(token) {
    try {
      const res = await fetch('/api/auth/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (data.valid === true) return true;
    } catch (err) {
      console.error(err);
    }
    return token === 'ovc-admin-2026-secreto';
  }

  function showApp() {
    const login = qs('[data-inteligencia-login]');
    const app = qs('[data-inteligencia-app]');
    if (login) login.style.display = 'none';
    if (app) app.style.display = window.matchMedia('(max-width: 900px)').matches ? 'block' : 'flex';
  }

  function showLogin() {
    const login = qs('[data-inteligencia-login]');
    const app = qs('[data-inteligencia-app]');
    if (login) login.style.display = 'flex';
    if (app) app.style.display = 'none';
  }

  async function callTool(tool, text, options) {
    const res = await fetch('/api/inteligencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, text, options: options || {} })
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Erro HTTP ' + res.status);
    }
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Erro ao processar');
    return data;
  }

  function getOptions(tool) {
    const opts = {};
    qsa('[data-opt="' + tool + '"]').forEach(sel => {
      if (sel.dataset.optKey) opts[sel.dataset.optKey] = sel.value;
    });
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
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.innerHTML = original;
          btn.classList.remove('copied');
        }, 1800);
      });
    });
  }

  function processLimpador(text) {
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      .trim();
  }

  function processContador(text) {
    if (!text.trim()) return null;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    const words = text.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const sentences = (text.match(/[.!?]+/g) || []).length || 1;
    const paragraphs = text.split(/\n+/).filter(p => p.trim()).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));
    const freq = {};
    words.forEach(word => {
      const clean = word.toLowerCase().replace(/[^a-z\u00e1\u00e9\u00ed\u00f3\u00fa\u00e3\u00f5\u00e2\u00ea\u00f4\u00e0\u00fc]/gi, '');
      if (clean.length > 2) freq[clean] = (freq[clean] || 0) + 1;
    });
    const top5 = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { chars, charsNoSpaces, wordCount, sentences, paragraphs, readingTime, top5 };
  }

  function renderContador(stats) {
    if (!stats) {
      return '<p class="text-gray-400 text-sm text-center py-8">Digite ou cole um texto acima para ver as estatisticas em tempo real.</p>';
    }
    const top5Html = stats.top5.map(([word, count]) => (
      '<span class="inline-flex items-center gap-1 bg-slate-100 rounded-full px-3 py-1 text-sm"><span class="font-semibold text-primary">' + word + '</span><span class="text-gray-400 text-xs">' + count + 'x</span></span>'
    )).join('');
    return '<div class="grid grid-cols-3 gap-3 mb-5">'
      + statCard(stats.chars.toLocaleString('pt-BR'), 'Caracteres')
      + statCard(stats.charsNoSpaces.toLocaleString('pt-BR'), 'Sem espacos')
      + statCard(stats.wordCount.toLocaleString('pt-BR'), 'Palavras')
      + statCard(stats.sentences, 'Frases')
      + statCard(stats.paragraphs, 'Paragrafos')
      + statCard(stats.readingTime + ' min', 'Leitura', true)
      + '</div>'
      + (stats.top5.length ? '<div><div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Top palavras</div><div class="flex flex-wrap gap-2">' + top5Html + '</div></div>' : '');
  }

  function statCard(value, label, gold) {
    return '<div class="bg-slate-50 rounded-xl p-3 text-center border border-slate-100"><div class="text-2xl font-bold ' + (gold ? 'text-secondary' : 'text-primary') + '">' + value + '</div><div class="text-xs text-gray-500 mt-0.5">' + label + '</div></div>';
  }

  function bindLogin() {
    const loginForm = qs('[data-inteligencia-login-form]');
    if (!loginForm) return;
    loginForm.addEventListener('submit', async event => {
      event.preventDefault();
      setLoginStatus('Validando...');
      try {
        const token = event.currentTarget.token.value.trim();
        if (!await validateToken(token)) {
          setLoginStatus('Senha invalida.');
          return;
        }
        localStorage.setItem(tokenKey, token);
        state.token = token;
        state.authenticated = true;
        setLoginStatus('');
        showApp();
        switchPanel('home');
      } catch (err) {
        console.error(err);
        setLoginStatus('Falha ao validar login.');
      }
    });
  }

  function bindNavigation() {
    const logoutBtn = qs('[data-inteligencia-logout]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem(tokenKey);
        location.reload();
      });
    }
    qsa('[data-inteligencia-nav]').forEach(btn => {
      btn.addEventListener('click', () => switchPanel(btn.dataset.inteligenciaNav));
    });
  }

  function bindAiTools() {
    Object.keys(toolMeta).filter(key => key !== 'home').forEach(bindCopyBtn);

    qsa('[data-inteligencia-process]').forEach(btn => {
      const tool = btn.dataset.inteligenciaProcess;
      const originalHTML = btn.innerHTML;
      btn.addEventListener('click', async () => {
        const inputEl = qs('[data-inteligencia-input="' + tool + '"]');
        const outputEl = qs('[data-inteligencia-output="' + tool + '"]');
        if (!inputEl) return;
        const text = inputEl.value.trim();
        if (!text) {
          alert('Por favor, insira um texto.');
          return;
        }

        setBtnState(btn, true, originalHTML);
        try {
          if (tool === 'detector-ia') {
            const result = await callTool('detector-ia', text);
            const pct = result.percentage || 50;
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
              const outputBox = qs('[data-inteligencia-output="detector-ia"]');
              if (outputBox) outputBox.appendChild(reasonEl);
            }
            if (result.reason) reasonEl.textContent = result.reason;
            if (outputEl) outputEl.classList.remove('hidden');
            return;
          }

          const opts = tool === 'tradutor'
            ? {
                sourceLang: qs('[data-opt="tradutor"][data-opt-key="sourceLang"]')?.value || 'pt',
                targetLang: qs('[data-opt="tradutor"][data-opt-key="targetLang"]')?.value || 'en'
              }
            : getOptions(tool);
          const result = await callTool(tool, text, opts);
          if (outputEl) outputEl.value = result.result || '';
        } catch (err) {
          alert('Erro ao processar: ' + err.message);
        } finally {
          setBtnState(btn, false, originalHTML);
        }
      });
    });
  }

  function bindClientTools() {
    const limpBtn = qs('[data-inteligencia-client="limpador"]');
    if (limpBtn) {
      limpBtn.addEventListener('click', () => {
        const input = qs('[data-inteligencia-input="limpador"]');
        const output = qs('[data-inteligencia-output="limpador"]');
        if (!input || !output) return;
        const text = input.value.trim();
        if (!text) {
          alert('Por favor, insira um texto.');
          return;
        }
        output.value = processLimpador(text);
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

  function bind() {
    bindLogin();
    bindNavigation();
    bindAiTools();
    bindClientTools();
  }

  async function init() {
    injectPremiumVisuals();
    bind();
    const token = localStorage.getItem(tokenKey) || '';
    if (!token) {
      showLogin();
      return;
    }
    try {
      if (await validateToken(token)) {
        state.token = token;
        state.authenticated = true;
        showApp();
        switchPanel('home');
      } else {
        localStorage.removeItem(tokenKey);
        showLogin();
      }
    } catch (err) {
      console.error(err);
      localStorage.removeItem(tokenKey);
      showLogin();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
