(function(){
  function qs(sel, root){ return (root || document).querySelector(sel); }
  function qsa(sel, root){ return Array.from((root || document).querySelectorAll(sel)); }

  function clickNav(nav){
    var btn = qs('[data-inteligencia-nav="' + nav + '"]');
    if (btn) btn.click();
  }

  function scrollToLabel(text){
    var labels = qsa('[data-inteligencia-panel="home"] .text-[10px].font-bold.uppercase');
    var target = labels.find(function(el){ return (el.textContent || '').toLowerCase().includes(text.toLowerCase()); });
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function installDashboard(){
    var home = qs('[data-inteligencia-panel="home"] .max-w-5xl');
    if (!home || qs('[data-ovc-home-dashboard]', home)) return;

    var dash = document.createElement('section');
    dash.className = 'ovc-home-dashboard';
    dash.setAttribute('data-ovc-home-dashboard', 'true');
    dash.innerHTML = ''
      + '<div class="ovc-dash-primary">'
      + '  <div class="ovc-dash-topline">'
      + '    <div><p class="ovc-dash-kicker">Painel operacional</p><h2 class="ovc-dash-title">Escolha o que precisa fazer agora.</h2><p class="ovc-dash-sub">A OVC Inteligencia organiza escrita, atendimento, vendas, documentos, rotina comercial e criacao visual em fluxos praticos. Comece por uma acao, nao por uma lista gigante.</p></div>'
      + '    <div class="ovc-dash-status"><strong>26</strong>recursos ativos</div>'
      + '  </div>'
      + '  <div class="ovc-dash-actions">'
      + action('suite','fa-layer-group','Central de trabalho','CRM, tarefas, documentos, atendimento e comercial.')
      + action('estudio','fa-palette','Criar material visual','Posts, campanhas, artes e exportacao.')
      + action('home','fa-wand-magic-sparkles','Usar ferramenta rapida','Reescrever, corrigir, resumir, traduzir e humanizar.')
      + '  </div>'
      + '</div>'
      + '<aside class="ovc-dash-side"><h4>Fluxos recomendados</h4><div class="ovc-dash-flow">'
      + flow('suite','Rotina do dia','CRM + tarefas')
      + flow('suite','Responder cliente','Atendimento + IA')
      + flow('estudio','Campanha pronta','Texto + arte')
      + flow('home','Texto urgente','Ferramentas classicas')
      + '</div></aside>'
      + '<div class="ovc-dash-strip"><h4>Atalhos por necessidade</h4><div class="ovc-dash-pills">'
      + pill('Clássicas','Clássicas')
      + pill('Comunicação','Comunicação')
      + pill('Burocracia','Burocracia')
      + pill('Vida pessoal','Vida pessoal')
      + pill('Trabalho','Trabalho')
      + '</div></div>';

    home.prepend(dash);
    dash.addEventListener('click', function(e){
      var nav = e.target.closest('[data-dash-nav]');
      if (nav) { clickNav(nav.getAttribute('data-dash-nav')); return; }
      var scroll = e.target.closest('[data-dash-scroll]');
      if (scroll) scrollToLabel(scroll.getAttribute('data-dash-scroll'));
    });
  }

  function action(nav, icon, title, desc){
    return '<button class="ovc-dash-action" data-dash-nav="' + nav + '"><i class="fas ' + icon + '"></i><strong>' + title + '</strong><span>' + desc + '</span></button>';
  }

  function flow(nav, title, tag){
    return '<button data-dash-nav="' + nav + '"><span>' + title + '</span><small>' + tag + '</small></button>';
  }

  function pill(label, target){
    return '<button data-dash-scroll="' + target + '">' + label + '</button>';
  }

  function boot(){
    installDashboard();
    setTimeout(installDashboard, 250);
    setTimeout(installDashboard, 900);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
