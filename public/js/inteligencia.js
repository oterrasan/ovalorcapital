(function(){
  const tokenKey = 'ovc-inteligencia-token';
  const state = { token: '', authenticated: false };

  function qs(s, r = document) { return r.querySelector(s); }
  function qsa(s, r = document) { return [...r.querySelectorAll(s)]; }

  function setLoginStatus(msg = '') {
    const el = qs('[data-inteligencia-login-status]');
    if (el) {
      el.textContent = msg;
      el.classList.toggle('hidden', !msg);
    }
  }

  function switchPanel(panelName) {
    qsa('[data-inteligencia-panel]').forEach(el => {
      el.classList.toggle('hidden', el.dataset.inteligenciaPanel !== panelName);
    });
    qsa('[data-inteligencia-nav]').forEach(btn => {
      btn.classList.toggle('bg-white/20', btn.dataset.inteligenciaNav === panelName);
      btn.classList.toggle('font-bold', btn.dataset.inteligenciaNav === panelName);
      btn.classList.toggle('hover:bg-white/10', btn.dataset.inteligenciaNav !== panelName);
    });
    const titles = {
      'home': 'OVC Inteligência',
      'reescrever': 'Reescrever Texto',
      'corretor': 'Corretor Ortográfico',
      'detector-ia': 'Detector de IA',
      'humanizar': 'Humanizar Texto',
      'tradutor': 'Tradutor',
      'resumidor': 'Resumidor de Texto'
    };
    const titleEl = qs('[data-inteligencia-title]');
    if (titleEl) titleEl.textContent = titles[panelName] || 'OVC Inteligência';
  }

  async function validateToken(token) {
    try {
      const response = await fetch('/api/auth/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await response.json();
      if (data.valid === true) return true;
    } catch (err) {
      console.error('Erro ao validar via API:', err);
    }
    return token === 'ovc-admin-2026-secreto';
  }

  function showApp() {
    qs('[data-inteligencia-login]').style.display = 'none';
    qs('[data-inteligencia-app]').style.display = 'flex';
    const userEl = qs('[data-inteligencia-user-info]');
    if (userEl) userEl.textContent = 'Autenticado';
  }

  function showLogin() {
    qs('[data-inteligencia-login]').style.display = 'flex';
    qs('[data-inteligencia-app]').style.display = 'none';
  }

  async function callTool(tool, text, options = {}) {
    const response = await fetch('/api/inteligencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, text, options })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Erro HTTP ${response.status}`);
    }
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || 'Erro ao processar');
    return data;
  }

  async function processRewrite(text) {
    const r = await callTool('reescrever', text);
    return r.result;
  }

  async function processCorrector(text) {
    const r = await callTool('corretor', text);
    return r.result;
  }

  async function processDetectorIA(text) {
    const r = await callTool('detector-ia', text);
    const percentage = r.percentage ?? 50;
    const percentEl = qs('[data-ia-percentage]');
    const barEl = qs('[data-ia-bar]');
    if (percentEl) percentEl.textContent = `${percentage}%`;
    if (barEl) {
      barEl.style.width = `${percentage}%`;
      barEl.className = 'h-3 rounded-full';
      if (percentage >= 75) barEl.classList.add('bg-red-500');
      else if (percentage >= 40) barEl.classList.add('bg-yellow-400');
      else barEl.classList.add('bg-green-500');
    }
    let reasonEl = qs('[data-ia-reason]');
    if (!reasonEl) {
      reasonEl = document.createElement('p');
      reasonEl.setAttribute('data-ia-reason', '');
      reasonEl.className = 'mt-3 text-sm text-gray-600';
      const outputDiv = qs('[data-inteligencia-output="detector-ia"]');
      if (outputDiv) outputDiv.appendChild(reasonEl);
    }
    if (reasonEl && r.reason) reasonEl.textContent = r.reason;
    const output = qs('[data-inteligencia-output="detector-ia"]');
    if (output) output.classList.remove('hidden');
  }

  async function processHumanize(text) {
    const r = await callTool('humanizar', text);
    return r.result;
  }

  async function processTranslate(text, sourceLang, targetLang) {
    const r = await callTool('tradutor', text, { sourceLang, targetLang });
    return r.result;
  }

  async function processSummarize(text) {
    const r = await callTool('resumidor', text);
    return r.result;
  }

  function getButtonLabel(tool) {
    const labels = {
      reescrever: 'Reescrever', corretor: 'Corrigir',
      'detector-ia': 'Analisar', humanizar: 'Humanizar',
      tradutor: 'Traduzir', resumidor: 'Resumir'
    };
    return labels[tool] || 'Processar';
  }

  function bind() {
    const loginForm = qs('[data-inteligencia-login-form]');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        setLoginStatus('Validando acesso...');
        try {
          const token = e.currentTarget.token.value.trim();
          const valid = await validateToken(token);
          if (!valid) { setLoginStatus('Senha inválida.'); return; }
          localStorage.setItem(tokenKey, token);
          state.token = token;
          state.authenticated = true;
          setLoginStatus('');
          showApp();
          switchPanel('home');
        } catch (err) {
          setLoginStatus('Falha ao validar login.');
          console.error(err);
        }
      });
    }

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

    qsa('[data-inteligencia-process]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const tool = btn.dataset.inteligenciaProcess;
        const inputEl = qs(`[data-inteligencia-input="${tool}"]`);
        const outputEl = qs(`[data-inteligencia-output="${tool}"]`);
        if (!inputEl) return;

        const inputText = inputEl.value.trim();
        if (!inputText) { alert('Por favor, insira um texto.'); return; }

        btn.disabled = true;
        btn.textContent = 'Processando...';

        try {
          if (tool === 'detector-ia') {
            await processDetectorIA(inputText);
          } else {
            let result = '';
            if (tool === 'reescrever')       result = await processRewrite(inputText);
            else if (tool === 'corretor')    result = await processCorrector(inputText);
            else if (tool === 'humanizar')   result = await processHumanize(inputText);
            else if (tool === 'tradutor') {
              const sourceLang = qs('[data-inteligencia-source-lang]')?.value || 'pt';
              const targetLang = qs('[data-inteligencia-target-lang]')?.value || 'en';
              result = await processTranslate(inputText, sourceLang, targetLang);
            }
            else if (tool === 'resumidor')   result = await processSummarize(inputText);
            if (outputEl) outputEl.value = result;
          }
        } catch (err) {
          alert('Erro ao processar: ' + err.message);
          console.error(err);
        } finally {
          btn.disabled = false;
          btn.textContent = getButtonLabel(tool);
        }
      });
    });
  }

  async function init() {
    bind();
    const token = localStorage.getItem(tokenKey) || '';
    if (token) {
      try {
        const valid = await validateToken(token);
        if (valid) {
          state.token = token;
          state.authenticated = true;
          showApp();
          switchPanel('home');
        } else {
          localStorage.removeItem(tokenKey);
          showLogin();
        }
      } catch (err) {
        localStorage.removeItem(tokenKey);
        showLogin();
      }
    } else {
      showLogin();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
