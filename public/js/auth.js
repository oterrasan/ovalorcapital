(function () {
  'use strict';

  var _supabase = null;

  function getSupabase() {
    if (_supabase) return _supabase;
    var url = 'https://bfsegqdgscudtdgwdyci.supabase.co';
    var key = window.SUPABASE_ANON_KEY || '';
    if (!key) { console.warn('OVCAuth: SUPABASE_ANON_KEY not set'); return null; }
    _supabase = window.supabase.createClient(url, key);
    return _supabase;
  }

  var MODAL_AUTH = 'ovc-auth-modal';
  var MODAL_PROFILE = 'ovc-profile-modal';

  function showModal(id) {
    var m = document.getElementById(id);
    if (m) { m.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
  }
  function hideModal(id) {
    var m = document.getElementById(id);
    if (m) { m.style.display = 'none'; document.body.style.overflow = ''; }
  }

  async function loginEmail(email, pass) {
    var sb = getSupabase(); if (!sb) return { error: { message: 'Supabase not configured' } };
    return sb.auth.signInWithPassword({ email: email, password: pass });
  }

  async function registerEmail(email, pass, profile) {
    var sb = getSupabase(); if (!sb) return { error: { message: 'Supabase not configured' } };
    var r = await sb.auth.signUp({ email: email, password: pass });
    if (r.error) return r;
    if (r.data && r.data.user) {
      await sb.from('profiles').upsert({
        id: r.data.user.id,
        nome: profile.nome || '',
        sobrenome: profile.sobrenome || '',
        celular: profile.celular || null,
        cidade: profile.cidade || null,
        idade: profile.idade ? parseInt(profile.idade) : null
      });
    }
    return r;
  }

  async function loginGoogle() {
    var sb = getSupabase(); if (!sb) return;
    var redirectTo = window.location.href;
    await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTo } });
  }

  async function loginFacebook() {
    var sb = getSupabase(); if (!sb) return;
    var redirectTo = window.location.href;
    await sb.auth.signInWithOAuth({ provider: 'facebook', options: { redirectTo: redirectTo } });
  }

  async function logout() {
    var sb = getSupabase(); if (!sb) return;
    await sb.auth.signOut();
    updateUI(null);
  }

  async function getSession() {
    var sb = getSupabase(); if (!sb) return null;
    var r = await sb.auth.getSession();
    return r.data && r.data.session ? r.data.session : null;
  }

  async function checkProfileComplete(user) {
    var sb = getSupabase(); if (!sb) return true;
    var r = await sb.from('profiles').select('celular').eq('id', user.id).single();
    if (r.error || !r.data || !r.data.celular) return false;
    return true;
  }

  async function saveProfile(userId, data) {
    var sb = getSupabase(); if (!sb) return { error: { message: 'Supabase not configured' } };
    return sb.from('profiles').upsert({
      id: userId,
      nome: data.nome || '',
      sobrenome: data.sobrenome || '',
      celular: data.celular || null,
      cidade: data.cidade || null,
      idade: data.idade ? parseInt(data.idade) : null
    });
  }

  function updateUI(session) {
    var loggedEls = document.querySelectorAll('[data-ovc-logged-in]');
    var guestEls = document.querySelectorAll('[data-ovc-guest]');
    var nameEls = document.querySelectorAll('[data-ovc-user-name]');
    var commentForm = document.getElementById('ovc-comment-form');
    var commentLogin = document.getElementById('ovc-comment-login-cta');

    if (session && session.user) {
      loggedEls.forEach(function(el) { el.style.display = ''; });
      guestEls.forEach(function(el) { el.style.display = 'none'; });
      var name = (session.user.user_metadata && (session.user.user_metadata.full_name || session.user.user_metadata.name)) || session.user.email || 'Usuário';
      nameEls.forEach(function(el) { el.textContent = name; });
      if (commentForm) commentForm.style.display = 'block';
      if (commentLogin) commentLogin.style.display = 'none';
    } else {
      loggedEls.forEach(function(el) { el.style.display = 'none'; });
      guestEls.forEach(function(el) { el.style.display = ''; });
      nameEls.forEach(function(el) { el.textContent = ''; });
      if (commentForm) commentForm.style.display = 'none';
      if (commentLogin) commentLogin.style.display = 'block';
    }
  }

  function initAuthListener() {
    var sb = getSupabase(); if (!sb) return;
    sb.auth.onAuthStateChange(async function(event, session) {
      updateUI(session);
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session && session.user) {
        var complete = await checkProfileComplete(session.user);
        if (!complete) {
          var meta = session.user.user_metadata || {};
          var nomeEl = document.getElementById('ovc-profile-nome');
          var sobrenomeEl = document.getElementById('ovc-profile-sobrenome');
          if (nomeEl && meta.full_name) {
            var parts = (meta.full_name || '').split(' ');
            nomeEl.value = parts[0] || '';
            if (sobrenomeEl) sobrenomeEl.value = parts.slice(1).join(' ') || '';
          }
          showModal(MODAL_PROFILE);
        }
      }
    });
  }

  function bindAuthModal() {
    document.querySelectorAll('[data-ovc-close-auth]').forEach(function(btn) {
      btn.addEventListener('click', function() { hideModal(MODAL_AUTH); });
    });
    document.querySelectorAll('[data-ovc-close-profile]').forEach(function(btn) {
      btn.addEventListener('click', function() { hideModal(MODAL_PROFILE); });
    });
    var authModal = document.getElementById(MODAL_AUTH);
    if (authModal) {
      authModal.addEventListener('click', function(e) {
        if (e.target === authModal) hideModal(MODAL_AUTH);
      });
    }

    var tabLogin = document.getElementById('ovc-tab-login');
    var tabRegister = document.getElementById('ovc-tab-register');
    var panelLogin = document.getElementById('ovc-panel-login');
    var panelRegister = document.getElementById('ovc-panel-register');
    if (tabLogin) tabLogin.addEventListener('click', function() {
      tabLogin.classList.add('active'); if(tabRegister) tabRegister.classList.remove('active');
      if(panelLogin) panelLogin.style.display = 'block';
      if(panelRegister) panelRegister.style.display = 'none';
    });
    if (tabRegister) tabRegister.addEventListener('click', function() {
      tabRegister.classList.add('active'); if(tabLogin) tabLogin.classList.remove('active');
      if(panelRegister) panelRegister.style.display = 'block';
      if(panelLogin) panelLogin.style.display = 'none';
    });

    document.querySelectorAll('[data-ovc-login-google]').forEach(function(btn) {
      btn.addEventListener('click', function() { hideModal(MODAL_AUTH); loginGoogle(); });
    });
    document.querySelectorAll('[data-ovc-login-facebook]').forEach(function(btn) {
      btn.addEventListener('click', function() { hideModal(MODAL_AUTH); loginFacebook(); });
    });
    document.querySelectorAll('[data-ovc-logout]').forEach(function(btn) {
      btn.addEventListener('click', logout);
    });
    document.querySelectorAll('[data-ovc-open-auth]').forEach(function(btn) {
      btn.addEventListener('click', function() { showModal(MODAL_AUTH); });
    });

    var loginForm = document.getElementById('ovc-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        var email = loginForm.querySelector('[name=email]').value.trim();
        var pass = loginForm.querySelector('[name=password]').value;
        var errEl = document.getElementById('ovc-login-error');
        var btn = loginForm.querySelector('button[type=submit]');
        if (btn) btn.disabled = true;
        var r = await loginEmail(email, pass);
        if (btn) btn.disabled = false;
        if (r.error) {
          if (errEl) errEl.textContent = 'E-mail ou senha incorretos.';
        } else {
          hideModal(MODAL_AUTH);
          if (errEl) errEl.textContent = '';
        }
      });
    }

    var regForm = document.getElementById('ovc-register-form');
    if (regForm) {
      regForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        var email = regForm.querySelector('[name=email]').value.trim();
        var pass = regForm.querySelector('[name=password]').value;
        var nome = regForm.querySelector('[name=nome]') ? regForm.querySelector('[name=nome]').value.trim() : '';
        var errEl = document.getElementById('ovc-register-error');
        var btn = regForm.querySelector('button[type=submit]');
        if (btn) btn.disabled = true;
        var r = await registerEmail(email, pass, { nome: nome });
        if (btn) btn.disabled = false;
        if (r.error) {
          if (errEl) errEl.textContent = r.error.message || 'Erro ao cadastrar.';
        } else {
          hideModal(MODAL_AUTH);
          if (errEl) errEl.textContent = '';
        }
      });
    }

    var profileForm = document.getElementById('ovc-profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        var session = await getSession();
        if (!session) return;
        var data = {
          nome: profileForm.querySelector('[name=nome]') ? profileForm.querySelector('[name=nome]').value.trim() : '',
          sobrenome: profileForm.querySelector('[name=sobrenome]') ? profileForm.querySelector('[name=sobrenome]').value.trim() : '',
          celular: profileForm.querySelector('[name=celular]') ? profileForm.querySelector('[name=celular]').value.trim() : '',
          cidade: profileForm.querySelector('[name=cidade]') ? profileForm.querySelector('[name=cidade]').value.trim() : '',
          idade: profileForm.querySelector('[name=idade]') ? profileForm.querySelector('[name=idade]').value.trim() : ''
        };
        var btn = profileForm.querySelector('button[type=submit]');
        if (btn) btn.disabled = true;
        var r = await saveProfile(session.user.id, data);
        if (btn) btn.disabled = false;
        if (!r.error) hideModal(MODAL_PROFILE);
      });
    }
  }

  async function loadComments(postId) {
    var container = document.getElementById('ovc-comments-list');
    var pinnedContainer = document.getElementById('ovc-pinned-comment');
    if (!container) return;
    container.innerHTML = '<p style="color:#94a3b8;font-size:14px;text-align:center;padding:20px 0">Carregando comentários...</p>';

    try {
      var r = await fetch('/api/portal-posts?format=comments&post_id=' + encodeURIComponent(postId));
      var data = await r.json();
      var comments = data.comments || [];

      if (pinnedContainer) {
        var pinned = data.pinned || null;
        if (pinned) {
          pinnedContainer.style.display = 'block';
          pinnedContainer.innerHTML =
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
            '<span style="background:#d4af37;color:#0f172a;font-size:10px;font-weight:800;padding:3px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:.08em;">Editorial</span>' +
            '</div>' +
            '<p style="font-size:15px;color:#1e293b;line-height:1.7;margin:0;font-style:italic;">' + escHtml(pinned) + '</p>';
        } else {
          pinnedContainer.style.display = 'none';
        }
      }

      if (!comments.length) {
        container.innerHTML = '<p style="color:#94a3b8;font-size:14px;text-align:center;padding:20px 0">Seja o primeiro a comentar.</p>';
        return;
      }
      container.innerHTML = comments.map(function(c) {
        return '<div style="padding:16px 0;border-bottom:1px solid #f1f5f9;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
          '<div style="width:32px;height:32px;border-radius:50%;background:#0f172a;display:flex;align-items:center;justify-content:center;color:#d4af37;font-weight:800;font-size:13px;flex-shrink:0;">' +
          escHtml((c.user_nome || 'U')[0].toUpperCase()) + '</div>' +
          '<div><div style="font-size:13px;font-weight:700;color:#0f172a;">' + escHtml(c.user_nome || 'Usuário') + '</div>' +
          '<div style="font-size:11px;color:#94a3b8;">' + fmtDate(c.created_at) + '</div></div></div>' +
          '<p style="font-size:15px;color:#334155;line-height:1.65;margin:0;">' + escHtml(c.texto) + '</p></div>';
      }).join('');
    } catch(e) {
      container.innerHTML = '<p style="color:#94a3b8;font-size:14px;text-align:center;padding:20px 0">Não foi possível carregar os comentários.</p>';
    }
  }

  function bindCommentForm(postId) {
    var form = document.getElementById('ovc-new-comment-form');
    if (!form) return;
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      var textarea = form.querySelector('textarea');
      var texto = textarea ? textarea.value.trim() : '';
      if (!texto) return;
      var session = await getSession();
      if (!session) { showModal(MODAL_AUTH); return; }
      var btn = form.querySelector('button[type=submit]');
      var errEl = document.getElementById('ovc-comment-error');
      if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }
      try {
        var r = await fetch('/api/portal-posts?action=comment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: postId, texto: texto, token: session.access_token })
        });
        var data = await r.json();
        if (data.ok) {
          if (textarea) textarea.value = '';
          if (errEl) errEl.textContent = data.flagged ? 'Seu comentário foi recebido e está em análise.' : '';
          await loadComments(postId);
        } else {
          if (errEl) errEl.textContent = data.error || 'Erro ao enviar comentário.';
        }
      } catch(err) {
        if (errEl) errEl.textContent = 'Erro de conexão.';
      }
      if (btn) { btn.disabled = false; btn.textContent = 'Comentar'; }
    });
  }

  function escHtml(s) {
    return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function fmtDate(dt) {
    if (!dt) return '';
    try { return new Date(dt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch(_) { return ''; }
  }

  window.OVCAuth = {
    loginEmail: loginEmail,
    registerEmail: registerEmail,
    loginGoogle: loginGoogle,
    loginFacebook: loginFacebook,
    logout: logout,
    getSession: getSession,
    showLoginModal: function() { showModal(MODAL_AUTH); }
  };

  document.addEventListener('DOMContentLoaded', function() {
    var sb = getSupabase();
    if (!sb) return;
    initAuthListener();
    bindAuthModal();

    var art = window.__OVC_ARTICLE__;
    if (art && art.id) {
      loadComments(art.id);
      bindCommentForm(art.id);
    }

    sb.auth.getSession().then(function(r) {
      updateUI(r.data && r.data.session ? r.data.session : null);
    });
  });
})();
