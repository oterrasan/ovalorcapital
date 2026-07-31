(function(){
  'use strict';

  function loadColunistasFix(){
    if (!document.body || !document.body.dataset || document.body.dataset.category !== 'colunistas') return;
    if (document.getElementById('ovc-colunistas-fix-loader')) return;
    var script = document.createElement('script');
    script.id = 'ovc-colunistas-fix-loader';
    script.src = '/js/colunistas-fix.js?v=20260731-1';
    script.defer = true;
    document.head.appendChild(script);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadColunistasFix);
  else loadColunistasFix();

  document.addEventListener('DOMContentLoaded', function(){
    loadColunistasFix();

    var footer = document.querySelector('footer.footer');
    if(!footer) return;
    var cat = (document.body.dataset && document.body.dataset.category) || 'geral';

    if(!document.getElementById('ovc-newsletter')){
      var section = document.createElement('section');
      section.id = 'ovc-newsletter';
      section.style.cssText = 'background:#0f172a;padding:56px 24px;';
      section.innerHTML = '<div style="max-width:960px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:40px;flex-wrap:wrap;">'
        +'<div style="flex:1;min-width:240px;">'
        +'<div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#ffc800;margin-bottom:10px;">Newsletter OVC</div>'
        +'<div style="font-size:26px;font-weight:800;color:#fff;line-height:1.25;margin-bottom:10px;">Fique por dentro</div>'
        +'<div style="font-size:14px;color:#94a3b8;line-height:1.6;">Receba as melhores análises do portal direto no seu e-mail.<br>Sem spam. Cancele quando quiser.</div>'
        +'</div>'
        +'<div id="ovc-nl-form-wrap" style="flex:1;min-width:280px;max-width:420px;">'
        +'<form id="ovc-nl-form" style="display:flex;gap:8px;flex-wrap:wrap;">'
        +'<input id="ovc-nl-email" type="email" placeholder="seu@email.com.br" required style="flex:1;min-width:180px;padding:14px 18px;border:2px solid #334155;border-radius:10px;background:#1e293b;color:#fff;font-size:14px;outline:none;transition:border-color .2s;" />'
        +'<button type="submit" style="padding:14px 22px;background:#ffc800;color:#0f172a;font-weight:800;font-size:14px;border:none;border-radius:10px;cursor:pointer;white-space:nowrap;transition:opacity .2s;">Assinar grátis</button>'
        +'</form>'
        +'<div id="ovc-nl-msg" style="margin-top:10px;font-size:13px;display:none;"></div>'
        +'</div></div>';
      footer.parentNode.insertBefore(section, footer);
    }

    var form = document.getElementById('ovc-nl-form');
    var msg  = document.getElementById('ovc-nl-msg');
    if(form && form.dataset.bound !== '1'){
      form.dataset.bound = '1';
      form.addEventListener('submit', function(e){
        e.preventDefault();
        var emailInput = document.getElementById('ovc-nl-email');
        var email = (emailInput && emailInput.value) || '';
        var btn = form.querySelector('button[type="submit"]');
        if(btn){ btn.disabled=true; btn.textContent='Enviando...'; }
        fetch('/api/manage', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ action:'newsletter_subscribe', email:email, categoria:cat })
        })
        .then(function(r){ return r.json(); })
        .then(function(d){
          if(d.ok){
            var wrap = document.getElementById('ovc-nl-form-wrap');
            if(wrap) wrap.innerHTML = '<div style="background:#064e3b;border:1px solid #065f46;border-radius:10px;padding:20px;text-align:center;"><div style="font-size:24px;margin-bottom:8px;">✓</div><div style="font-weight:700;color:#6ee7b7;font-size:15px;">Cadastro confirmado!</div><div style="color:#a7f3d0;font-size:13px;margin-top:4px;">Fique de olho no seu e-mail.</div></div>';
          } else {
            if(msg){ msg.style.display='block'; msg.style.color='#f87171'; msg.textContent = d.error || 'Erro ao cadastrar. Tente novamente.'; }
            if(btn){ btn.disabled=false; btn.textContent='Assinar grátis'; }
          }
        })
        .catch(function(){
          if(msg){ msg.style.display='block'; msg.style.color='#f87171'; msg.textContent='Erro de conexão. Tente novamente.'; }
          if(btn){ btn.disabled=false; btn.textContent='Assinar grátis'; }
        });
      });
    }

    var bottom = document.querySelector('.footer-bottom');
    if (bottom) {
      var copy = bottom.querySelector('div:first-child');
      if (copy) copy.innerHTML = '© 2026 <strong>O Valor Capital</strong> — Redação OVC. Todos os direitos reservados. &nbsp;&nbsp;<span style="color:#aaa;font-size:.82em;">Conexão segura HTTPS</span>';

      var links = bottom.querySelector('.footer-bottom-links');
      if (links) {
        links.innerHTML = '<a href="/quem-somos/">Quem Somos</a>'
          + '<a href="/politica-editorial/">Política Editorial</a>'
          + '<a href="/termos/">Termos de Uso</a>'
          + '<a href="/privacidade/">Privacidade</a>'
          + '<a href="/cookies/">Cookies</a>';
      }

      if (!bottom.querySelector('.footer-disclaimer')) {
        var disc = document.createElement('div');
        disc.className = 'footer-disclaimer';
        disc.style.cssText = 'font-size:.76rem;color:#999;margin-top:12px;line-height:1.6;text-align:center;padding-top:10px;border-top:1px solid #222;';
        disc.innerHTML = 'O conteúdo publicado tem caráter informativo e jornalístico. Não constitui recomendação de investimento. '
          + 'Reprodução permitida mediante citação da fonte. '
          + 'Redação OVC utiliza Inteligência Artificial supervisionada por equipe editorial. '
          + 'Responsável editorial: <strong>Roberto Cesar Terrasan</strong>.';
        bottom.appendChild(disc);
      }
    }
  });

  if (!window.__OVC_CONTENT_PROTECTION__) {
    window.__OVC_CONTENT_PROTECTION__ = true;
    var s = document.createElement('style');
    s.textContent = '*{-webkit-user-select:none!important;user-select:none!important}'
      + 'input,textarea,[contenteditable]{-webkit-user-select:text!important;user-select:text!important}'
      + 'img{-webkit-user-drag:none!important;pointer-events:none!important}'
      + 'a img,a>img{pointer-events:auto!important}';
    document.head.appendChild(s);
    document.addEventListener('contextmenu', function(e){ e.preventDefault(); });
    document.addEventListener('keydown', function(e){
      if(e.ctrlKey || e.metaKey){
        if(['c','a','u','s','p'].indexOf(String(e.key || '').toLowerCase()) > -1) e.preventDefault();
      }
      if(e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['i','j','c'].indexOf(String(e.key || '').toLowerCase()) > -1)) e.preventDefault();
    });
    document.addEventListener('dragstart', function(e){ if(e.target && e.target.tagName === 'IMG') e.preventDefault(); });
  }
})();
