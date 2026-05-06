(function(){
  'use strict';
  document.addEventListener('DOMContentLoaded', function(){
    var footer = document.querySelector('footer.footer');
    if(!footer) return;
    var cat = (document.body.dataset.category || 'geral');

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
      +'<input id="ovc-nl-email" type="email" placeholder="seu@email.com.br" required '
      +'style="flex:1;min-width:180px;padding:14px 18px;border:2px solid #334155;border-radius:10px;background:#1e293b;color:#fff;font-size:14px;outline:none;transition:border-color .2s;" '
      +'onfocus="this.style.borderColor=\'#ffc800\'" onblur="this.style.borderColor=\'#334155\'" />'
      +'<button type="submit" style="padding:14px 22px;background:#ffc800;color:#0f172a;font-weight:800;font-size:14px;border:none;border-radius:10px;cursor:pointer;white-space:nowrap;transition:opacity .2s;" '
      +'onmouseover="this.style.opacity=\'.85\'" onmouseout="this.style.opacity=\'1\'">Assinar grátis</button>'
      +'</form>'
      +'<div id="ovc-nl-msg" style="margin-top:10px;font-size:13px;display:none;"></div>'
      +'</div></div>';

    footer.parentNode.insertBefore(section, footer);

    var form = document.getElementById('ovc-nl-form');
    var msg  = document.getElementById('ovc-nl-msg');
    if(!form) return;

    form.addEventListener('submit', function(e){
      e.preventDefault();
      var email = (document.getElementById('ovc-nl-email')||{}).value||'';
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
          document.getElementById('ovc-nl-form-wrap').innerHTML =
            '<div style="background:#064e3b;border:1px solid #065f46;border-radius:10px;padding:20px;text-align:center;">'
            +'<div style="font-size:24px;margin-bottom:8px;">✓</div>'
            +'<div style="font-weight:700;color:#6ee7b7;font-size:15px;">Cadastro confirmado!</div>'
            +'<div style="color:#a7f3d0;font-size:13px;margin-top:4px;">Fique de olho no seu e-mail.</div></div>';
        } else {
          msg.style.display='block'; msg.style.color='#f87171';
          msg.textContent = d.error || 'Erro ao cadastrar. Tente novamente.';
          if(btn){ btn.disabled=false; btn.textContent='Assinar grátis'; }
        }
      })
      .catch(function(){
        msg.style.display='block'; msg.style.color='#f87171';
        msg.textContent='Erro de conexão. Tente novamente.';
        if(btn){ btn.disabled=false; btn.textContent='Assinar grátis'; }
      });
    });
  });
})();
