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
      return data.valid === true;
    } catch (err) {
      console.error('Erro ao validar token:', err);
      return false;
    }
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

  function bind() {
    // Login Form
    const loginForm = qs('[data-inteligencia-login-form]');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        setLoginStatus('Validando acesso...');
        try {
          const token = e.currentTarget.token.value.trim();
          const valid = await validateToken(token);
          if (!valid) {
            setLoginStatus('Senha inválida.');
            return;
          }
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

    // Logout
    const logoutBtn = qs('[data-inteligencia-logout]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem(tokenKey);
        location.reload();
      });
    }

    // Navigation
    qsa('[data-inteligencia-nav]').forEach(btn => {
      btn.addEventListener('click', () => {
        const panel = btn.dataset.inteligenciaNav;
        switchPanel(panel);
      });
    });

    // Process Buttons
    qsa('[data-inteligencia-process]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const tool = btn.dataset.inteligenciaProcess;
        const inputEl = qs(`[data-inteligencia-input="${tool}"]`);
        const outputEl = qs(`[data-inteligencia-output="${tool}"]`);
        
        if (!inputEl || !outputEl) return;
        
        const inputText = inputEl.value.trim();
        if (!inputText) {
          alert('Por favor, insira um texto.');
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Processando...';

        try {
          let result = '';
          
          switch(tool) {
            case 'reescrever':
              result = await processRewrite(inputText);
              break;
            case 'corretor':
              result = await processCorrector(inputText);
              break;
            case 'detector-ia':
              result = await processDetectorIA(inputText);
              return;
            case 'humanizar':
              result = await processHumanize(inputText);
              break;
            case 'tradutor':
              const sourceLang = qs('[data-inteligencia-source-lang]').value;
              const targetLang = qs('[data-inteligencia-target-lang]').value;
              result = await processTranslate(inputText, sourceLang, targetLang);
              break;
            case 'resumidor':
              result = await processSummarize(inputText);
              break;
          }

          if (tool === 'detector-ia') {
            const output = qs(`[data-inteligencia-output="${tool}"]`);
            output.classList.remove('hidden');
          } else {
            outputEl.value = result;
          }
        } catch (err) {
          alert('Erro ao processar: ' + err.message);
          console.error(err);
        } finally {
          btn.disabled = false;
          btn.textContent = tool === 'reescrever' ? 'Reescrever' : 
                           tool === 'corretor' ? 'Corrigir' :
                           tool === 'detector-ia' ? 'Analisar' :
                           tool === 'humanizar' ? 'Humanizar' :
                           tool === 'tradutor' ? 'Traduzir' :
                           'Resumir';
        }
      });
    });
  }

  // Processamento das ferramentas
  async function processRewrite(text) {
    return `[Reescrita de] ${text}\n\n[Versão melhorada do texto mantendo o sentido original...]`;
  }

  async function processCorrector(text) {
    return `[Texto corrigido]\n\n${text}`;
  }

  async function processDetectorIA(text) {
    const percentage = Math.floor(Math.random() * 100);
    const percentEl = qs('[data-ia-percentage]');
    const barEl = qs('[data-ia-bar]');
    if (percentEl) percentEl.textContent = `${percentage}%`;
    if (barEl) barEl.style.width = `${percentage}%`;
  }

  async function processHumanize(text) {
    return `[Humanizado]\n\n${text}`;
  }

  async function processTranslate(text, sourceLang, targetLang) {
    return `[Tradução de ${sourceLang} para ${targetLang}]\n\n${text}`;
  }

  async function processSummarize(text) {
    const sentences = text.split('.').filter(s => s.trim());
    const summary = sentences.slice(0, Math.ceil(sentences.length / 3)).join('.');
    return summary || text.substring(0, 200);
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
