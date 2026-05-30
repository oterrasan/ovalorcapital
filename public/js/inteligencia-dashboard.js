(function(){
  var STORE_KEY = 'ovc-inteligencia-command-state-v1';
  var DEFAULT_USERS = [
    { name: 'Roberto Terrasan', role: 'Owner', perm: 'Acesso total', status: 'Admin' },
    { name: 'Operacao OVC', role: 'Editor', perm: 'Conteudo, CRM e atendimento', status: 'Equipe' },
    { name: 'Comercial', role: 'Vendas', perm: 'Leads, propostas e follow-up', status: 'Time' }
  ];

  function qs(sel, root){ try { return (root || document).querySelector(sel); } catch(e){ return null; } }
  function qsa(sel, root){ try { return Array.from((root || document).querySelectorAll(sel)); } catch(e){ return []; } }
  function text(value){ return String(value == null ? '' : value); }
  function escapeHtml(value){
    return text(value).replace(/[&<>"']/g, function(ch){
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch];
    });
  }
  function nowLabel(){
    try { return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
    catch(e){ return 'agora'; }
  }
  function defaultLogs(){
    return [
      { time: nowLabel(), type: 'Sistema', text: 'Command center carregado.' },
      { time: 'Hoje', type: 'Controle', text: 'Acesso sem senha nesta versao privada.' },
      { time: 'Hoje', type: 'Dados', text: 'Logs e usuarios gravados localmente no navegador.' }
    ];
  }
  function readState(){
    var state = {};
    try { state = JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}; }
    catch(e){ state = {}; }
    if (!Array.isArray(state.users) || !state.users.length) state.users = DEFAULT_USERS.slice();
    if (!Array.isArray(state.logs) || !state.logs.length) state.logs = defaultLogs();
    return state;
  }
  function writeState(state){
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch(e){}
  }
  function addLog(state, message, type){
    state.logs = Array.isArray(state.logs) ? state.logs : [];
    state.logs.unshift({ time: nowLabel(), type: type || 'Acao', text: message });
    state.logs = state.logs.slice(0, 7);
    writeState(state);
  }

  function polishShell(){
    qsa('[data-inteligencia-app] span, [data-inteligencia-app] small, [data-inteligencia-app] div').forEach(function(el){
      if (el.children && el.children.length) return;
      var value = text(el.textContent).trim().toLowerCase();
      if (value === '26 ferramentas') el.textContent = 'Command OS';
    });
  }
  function clickNav(nav){
    var btn = qs('[data-inteligencia-nav="' + nav + '"]');
    if (btn) btn.click();
  }
  function scrollToLabel(textValue){
    var needle = text(textValue).toLowerCase();
    var labels = qsa('[data-inteligencia-panel="home"] [class*="uppercase"]');
    var target = labels.find(function(el){ return text(el.textContent).toLowerCase().includes(needle); });
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function hideNode(node){
    if (!node) return;
    node.hidden = true;
    node.style.display = 'none';
    node.setAttribute('data-ovc-hidden-legacy-intro', 'true');
  }
  function hideLegacyIntro(home){
    qsa(':scope > h3, :scope > h3 + p', home).forEach(hideNode);
    var firstCardGroup = qs(':scope > h3 + p + .mb-7', home);
    hideNode(firstCardGroup);
    Array.from(home.children).forEach(function(block){
      if (!block || block.hasAttribute('data-ovc-home-dashboard') || block.hasAttribute('data-suite-home-card') || block.hasAttribute('data-studio-home-card')) return;
      var body = text(block.textContent).toLowerCase();
      var legacy = body.includes('escolha o que precisa fazer agora') || body.includes('recursos ativos') || (body.includes('26 ferramentas') && body.includes('escolha uma categoria'));
      if (legacy) hideNode(block);
    });
  }

  function icon(name){ return '<i class="fas ' + name + '" aria-hidden="true"></i>'; }
  function commandCard(nav, iconName, title, tag, desc, accent){
    return ''
      + '<button class="ovc-command-card ovc-accent-' + accent + '" data-dash-nav="' + nav + '">'
      + '  <span class="ovc-command-icon">' + icon(iconName) + '</span>'
      + '  <span class="ovc-command-card-body"><strong>' + title + '</strong><small>' + tag + '</small><em>' + desc + '</em></span>'
      + '</button>';
  }
  function reportCard(title, metric, bars, accent){
    return ''
      + '<article class="ovc-report-card ovc-report-' + accent + '">'
      + '  <div><span>' + title + '</span><strong>' + metric + '</strong></div>'
      + '  <div class="ovc-report-bars">' + bars.map(function(v){ return '<i style="height:' + v + '%"></i>'; }).join('') + '</div>'
      + '</article>';
  }
  function signal(label, value, tone){
    return '<div class="ovc-signal ovc-signal-' + tone + '"><span>' + label + '</span><strong>' + value + '</strong></div>';
  }
  function gauge(label, value, accent){
    return '<div class="ovc-gauge" style="--p:' + value + ';--accent:' + accent + '"><span></span><strong>' + value + '%</strong><small>' + label + '</small></div>';
  }
  function initials(name){
    var parts = text(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'OV';
    var first = parts[0].charAt(0);
    var last = (parts.length > 1 ? parts[parts.length - 1] : parts[0]).charAt(0);
    return (first + last).toUpperCase();
  }
  function userRows(users){
    return users.map(function(user){
      return ''
        + '<div class="ovc-user-row">'
        + '  <span class="ovc-user-avatar">' + escapeHtml(initials(user.name)) + '</span>'
        + '  <span class="ovc-user-main"><strong>' + escapeHtml(user.name) + '</strong><small>' + escapeHtml(user.role) + ' - ' + escapeHtml(user.perm) + '</small></span>'
        + '  <em>' + escapeHtml(user.status || 'Ativo') + '</em>'
        + '</div>';
    }).join('');
  }
  function logRows(logs){
    return logs.map(function(row){
      return ''
        + '<div class="ovc-log-row">'
        + '  <span>' + escapeHtml(row.time) + '</span>'
        + '  <strong>' + escapeHtml(row.type) + '</strong>'
        + '  <small>' + escapeHtml(row.text) + '</small>'
        + '</div>';
    }).join('');
  }
  function pill(label, target){
    return '<button data-dash-scroll="' + target + '">' + label + '</button>';
  }

  function dashboardHtml(state){
    return ''
      + '<div class="ovc-command-main">'
      + '  <header class="ovc-command-hero">'
      + '    <div class="ovc-command-meta"><span>Grupo Terrasan OS</span><time>' + nowLabel() + '</time></div>'
      + '    <div class="ovc-command-headline"><div><p class="ovc-dash-kicker">Central premium</p><h2>OVC Inteligencia Command Center</h2><p>Produtividade, escrita, criacao visual, atendimento, CRM leve e operacao comercial em uma tela de controle.</p></div></div>'
      + '    <div class="ovc-command-toolbar">'
      + '      <button data-dash-nav="suite">' + icon('fa-layer-group') + '<span>Central</span></button>'
      + '      <button data-dash-nav="estudio">' + icon('fa-wand-magic-sparkles') + '<span>Estudio</span></button>'
      + '      <button data-dash-scroll="Classicas">' + icon('fa-bolt') + '<span>IA rapida</span></button>'
      + '      <button data-dash-scroll="Comunicacao">' + icon('fa-comments') + '<span>Comercial</span></button>'
      + '    </div>'
      + '  </header>'
      + '  <div class="ovc-command-grid">'
      + commandCard('suite','fa-network-wired','Central operacional','CRM, tarefas e pipeline','Controle diario para leads, clientes, demandas e follow-up.','cyan')
      + commandCard('estudio','fa-pen-nib','Estudio criativo','Artes e campanhas','Editor visual para posts, materiais, cards comerciais e exportacao.','violet')
      + commandCard('home','fa-microchip','Motor de texto','Gemini e utilitarios','Reescrita, traducao, resumo, correcao, humanizacao e documentos.','gold')
      + commandCard('suite','fa-chart-line','Relatorios executivos','Gestao e leitura','Visao de operacao, tarefas, produtividade e carteira comercial.','green')
      + '  </div>'
      + '  <section class="ovc-command-reports">'
      + reportCard('Produtividade IA', '87%', [35,52,66,48,75,82,68,90,76,84], 'cyan')
      + reportCard('Pipeline comercial', 'R$ 128k', [22,34,47,64,58,76,71,88,80,92], 'green')
      + reportCard('Demandas abertas', '14', [70,66,58,52,44,40,36,30,25,18], 'gold')
      + '  </section>'
      + '</div>'
      + '<aside class="ovc-command-side">'
      + '  <div class="ovc-side-head"><div><span>Command panel</span><strong>Painel direito</strong></div><time>online</time></div>'
      + '  <div class="ovc-signal-grid">'
      + signal('Operacao','online','cyan')
      + signal('IA','pronta','violet')
      + signal('CRM','local','green')
      + signal('Estudio','ativo','gold')
      + '  </div>'
      + '  <div class="ovc-cockpit-module">'
      + '    <div class="ovc-module-title"><span>Mostradores</span><strong>Controle</strong></div>'
      + '    <div class="ovc-gauge-row">' + gauge('Uso',91,'#5df4ff') + gauge('Entrega',84,'#9b7cff') + gauge('Rotina',76,'#d9f071') + '</div>'
      + '  </div>'
      + '  <div class="ovc-cockpit-module">'
      + '    <div class="ovc-module-title"><span>Logs</span><strong>Trilha operacional</strong></div>'
      + '    <div class="ovc-logs">' + logRows(state.logs.slice(0, 4)) + '</div>'
      + '  </div>'
      + '  <div class="ovc-cockpit-module">'
      + '    <div class="ovc-module-title"><span>Acesso</span><strong>Usuarios e permissoes</strong></div>'
      + '    <div class="ovc-users">' + userRows(state.users) + '</div>'
      + '    <form class="ovc-user-form" data-ovc-user-form>'
      + '      <input name="name" type="text" placeholder="Nome" autocomplete="off">'
      + '      <select name="role"><option>Admin</option><option>Editor</option><option>Vendas</option><option>Cliente</option></select>'
      + '      <input name="perm" type="text" placeholder="Permissoes">'
      + '      <button type="submit">Cadastrar acesso</button>'
      + '    </form>'
      + '  </div>'
      + '</aside>'
      + '<div class="ovc-dash-strip"><strong>Atalhos</strong><div class="ovc-dash-pills">'
      + pill('Classicas','Classicas') + pill('Comunicacao','Comunicacao') + pill('Burocracia','Burocracia') + pill('Trabalho','Trabalho') + pill('Vida pessoal','Vida pessoal')
      + '</div></div>';
  }

  function bindDashboard(dash, home, state){
    dash.onclick = function(e){
      var nav = e.target.closest('[data-dash-nav]');
      if (nav) {
        var label = text(nav.textContent).replace(/\s+/g, ' ').trim() || nav.getAttribute('data-dash-nav');
        addLog(state, 'Modulo aberto: ' + label + '.', 'Navegacao');
        clickNav(nav.getAttribute('data-dash-nav'));
        return;
      }
      var scroll = e.target.closest('[data-dash-scroll]');
      if (scroll) {
        var target = scroll.getAttribute('data-dash-scroll');
        addLog(state, 'Atalho acionado: ' + target + '.', 'Atalho');
        scrollToLabel(target);
      }
    };
    var form = qs('[data-ovc-user-form]', dash);
    if (form) {
      form.onsubmit = function(e){
        e.preventDefault();
        var data = new FormData(form);
        var name = text(data.get('name')).trim();
        var role = text(data.get('role')).trim() || 'Usuario';
        var perm = text(data.get('perm')).trim() || 'Acesso controlado';
        if (!name) return;
        state.users.unshift({ name: name, role: role, perm: perm, status: 'Local' });
        state.users = state.users.slice(0, 6);
        addLog(state, 'Usuario local cadastrado: ' + name + '.', 'Acesso');
        renderDashboard(home, state);
      };
    }
  }
  function renderDashboard(home, state){
    var dash = qs('[data-ovc-home-dashboard]', home);
    if (!dash) {
      dash = document.createElement('section');
      dash.setAttribute('data-ovc-home-dashboard', 'true');
      home.prepend(dash);
    }
    dash.className = 'ovc-home-dashboard ovc-command-deck';
    dash.innerHTML = dashboardHtml(state);
    bindDashboard(dash, home, state);
    hideLegacyIntro(home);
    polishShell();
  }
  function installDashboard(){
    var home = qs('[data-inteligencia-panel="home"] .max-w-5xl');
    polishShell();
    if (!home) return;
    var state = readState();
    renderDashboard(home, state);
  }
  function boot(){
    installDashboard();
    setTimeout(installDashboard, 250);
    setTimeout(installDashboard, 900);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
