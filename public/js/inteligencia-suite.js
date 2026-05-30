(function(){
  const STORE = {
    business: 'ovc-suite-business-v1',
    history: 'ovc-suite-history-v1',
    favorites: 'ovc-suite-favorites-v1',
    crm: 'ovc-suite-crm-v1',
    tasks: 'ovc-suite-tasks-v1',
    knowledge: 'ovc-suite-knowledge-v1',
    assistant: 'ovc-suite-assistant-v1'
  };

  const professions = ['Corretor de seguros','Medico','Advogado','Contador','Dentista','Psicologo','Nutricionista','Consultor','Imobiliario','Social media','Professor','Empresario','Vendedor','RH','Financeiro'];
  const localTools = [
    ['contador','Contador avancado','Conta palavras, caracteres, frases e tempo de leitura.'],
    ['limpador','Limpador de texto','Remove HTML, espacos duplos e sujeira de texto.'],
    ['emails','Extrator de e-mails','Extrai e-mails de qualquer texto colado.'],
    ['telefones','Extrator de telefones','Extrai telefones e WhatsApps.'],
    ['duplicados','Removedor de duplicados','Remove linhas repetidas de listas.'],
    ['maiusculas','Maiusculas/minusculas','Converte texto para formatos comuns.'],
    ['slug','Gerador de slug','Cria URL amigavel.'],
    ['comparador','Comparador de textos','Mostra diferencas simples entre dois textos.'],
    ['comissao','Calculadora de comissao','Calcula valor de comissao e meta.'],
    ['hora','Preco por hora','Ajuda a precificar trabalho por hora.'],
    ['roi','Simulador de ROI','Simula retorno sobre investimento.'],
    ['checklist','Checklist interativo','Cria checklist a partir de texto.']
  ];

  function qs(sel, root=document){ return root.querySelector(sel); }
  function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
  function read(key, fallback){ try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } }
  function write(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function esc(s){ return String(s || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function uid(){ return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2); }

  function loadCss(){
    if (document.querySelector('link[data-ovc-suite-css]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/inteligencia-suite.css?v=1';
    link.setAttribute('data-ovc-suite-css','true');
    document.head.appendChild(link);
  }

  function install(){
    loadCss();
    injectNav();
    injectPanel();
    injectAssistant();
    bindGlobalNav();
  }

  function injectNav(){
    const nav = qs('aside nav');
    if (!nav || qs('[data-inteligencia-nav="suite"]')) return;
    const home = qs('[data-inteligencia-nav="home"]');
    const btn = document.createElement('button');
    btn.setAttribute('data-inteligencia-nav','suite');
    btn.className = 'nav-btn';
    btn.innerHTML = '<span class="nav-icon"><i class="fas fa-layer-group text-cyan-300 text-[11px]"></i></span><span>Central OVC</span>';
    if (home) home.insertAdjacentElement('afterend', btn); else nav.prepend(btn);
  }

  function injectPanel(){
    const content = qs('main > div.flex-1');
    if (!content || qs('[data-inteligencia-panel="suite"]')) return;
    const panel = document.createElement('div');
    panel.setAttribute('data-inteligencia-panel','suite');
    panel.className = 'hidden ovc-suite-shell';
    panel.innerHTML = renderSuiteShell();
    content.prepend(panel);
    bindSuite(panel);
    injectHomeCards();
  }

  function injectHomeCards(){
    const home = qs('[data-inteligencia-panel="home"] .max-w-5xl');
    if (!home || qs('[data-suite-home-card]')) return;
    const block = document.createElement('div');
    block.setAttribute('data-suite-home-card','true');
    block.className = 'mb-7';
    block.innerHTML = '<div class="text-[10px] font-bold uppercase tracking-widest text-cyan-500 mb-2.5">Central OVC</div>'
      + '<div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">'
      + homeCard('suite','Central operacional','Dia, CRM, documentos, negocio, conhecimento e ferramentas locais.')
      + homeCard('suite','Estudio Criativo','Crie artes, posts e campanhas dentro da propria OVC Inteligencia.')
      + homeCard('suite','Assistente IA','Pergunte, gere ideias e transforme contexto em acao pratica.')
      + '</div>';
    const first = home.querySelector('.mb-7');
    if (first) first.insertAdjacentElement('afterend', block); else home.appendChild(block);
  }

  function homeCard(nav, title, desc){
    return '<button data-inteligencia-nav="' + nav + '" class="card-hover bg-white rounded-xl p-4 border border-cyan-50 text-left shadow-sm">'
      + '<div class="w-8 h-8 bg-cyan-50 rounded-lg flex items-center justify-center mb-2.5"><i class="fas fa-bolt text-cyan-500 text-sm"></i></div>'
      + '<div class="font-semibold text-primary text-xs">' + esc(title) + '</div>'
      + '<div class="text-gray-400 text-[10px] mt-0.5">' + esc(desc) + '</div>'
      + '</button>';
  }

  function renderSuiteShell(){
    return '<div class="ovc-suite-hero">'
      + '<section class="ovc-suite-card pad"><p class="ovc-suite-eyebrow">OVC INTELIGENCIA</p><h2 class="ovc-suite-title">Central de trabalho inteligente.</h2><p class="ovc-suite-sub">Um unico ambiente para escrever, vender, atender, organizar clientes, criar artes, analisar documentos e transformar ideias em acoes praticas sem custo adicional de API.</p><div class="ovc-suite-kpis"><div class="ovc-suite-kpi"><strong>Free</strong><span>sem API nova</span></div><div class="ovc-suite-kpi"><strong>Local</strong><span>historico e CRM</span></div><div class="ovc-suite-kpi"><strong>IA</strong><span>quando precisar</span></div></div></section>'
      + '<section class="ovc-suite-card pad"><p class="ovc-suite-eyebrow">PROXIMA ACAO</p><div id="ovcNextAction"></div></section>'
      + '</div>'
      + '<div class="ovc-suite-grid">'
      + moduleButton('dia','fa-calendar-check','Central do Dia','Tarefas, oportunidades e proximas acoes.')
      + moduleButton('crm','fa-address-book','Mini CRM','Contatos, etapas, notas e follow-up.')
      + moduleButton('negocio','fa-building','Meu Negocio','Ficha base para personalizar textos.')
      + moduleButton('profissoes','fa-user-tie','Profissoes','Assistentes por area de atuacao.')
      + moduleButton('documentos','fa-file-lines','Documentos','Resumo, riscos e respostas por texto colado.')
      + moduleButton('atendimento','fa-comments','Atendimento','WhatsApp, objeções, reclamacoes e follow-ups.')
      + moduleButton('comercial','fa-chart-line','Comercial','Propostas, campanhas e rotina de vendas.')
      + moduleButton('conhecimento','fa-vault','Cofre de Conhecimento','Produtos, objeções, tom de voz e modelos.')
      + moduleButton('utilitarios','fa-screwdriver-wrench','Utilitarios locais','Ferramentas 100% no navegador.')
      + moduleButton('radar','fa-satellite-dish','Radar Inteligente','Ideias, noticias coladas e oportunidades.')
      + moduleButton('estudio','fa-palette','Estudio Criativo','Mini Canva integrado.')
      + moduleButton('historico','fa-clock-rotate-left','Historico e Favoritos','Textos gerados, rascunhos e favoritos.')
      + '</div>'
      + '<div class="ovc-suite-workspace" style="margin-top:18px"><nav class="ovc-suite-tabs" id="ovcSuiteTabs"></nav><section class="ovc-suite-view" id="ovcSuiteView"></section></div>';
  }

  function moduleButton(id, icon, title, desc){
    return '<button class="ovc-suite-module" data-suite-open="' + id + '"><i class="fas ' + icon + '"></i><strong>' + esc(title) + '</strong><span>' + esc(desc) + '</span></button>';
  }

  const views = [
    ['dia','Central do Dia'], ['crm','Mini CRM'], ['negocio','Meu Negocio'], ['profissoes','Profissoes'], ['documentos','Documentos'], ['atendimento','Atendimento'], ['comercial','Comercial'], ['conhecimento','Cofre'], ['utilitarios','Utilitarios'], ['radar','Radar'], ['estudio','Estudio'], ['historico','Historico']
  ];

  function bindSuite(panel){
    const tabs = qs('#ovcSuiteTabs', panel);
    tabs.innerHTML = views.map(v => '<button class="ovc-suite-tab" data-suite-tab="' + v[0] + '"><i class="fas fa-chevron-right"></i>' + v[1] + '</button>').join('');
    qsa('[data-suite-open]', panel).forEach(btn => btn.onclick = () => openView(btn.dataset.suiteOpen));
    qsa('[data-suite-tab]', panel).forEach(btn => btn.onclick = () => openView(btn.dataset.suiteTab));
    openView('dia');
    renderNextAction();
  }

  function openView(id){
    qsa('[data-suite-tab]').forEach(b => b.classList.toggle('active', b.dataset.suiteTab === id));
    const view = qs('#ovcSuiteView');
    if (!view) return;
    const renderers = { dia, crm, negocio, profissoes, documentos, atendimento, comercial, conhecimento, utilitarios, radar, estudio, historico };
    view.innerHTML = (renderers[id] || dia)();
    bindView(id, view);
  }

  function renderNextAction(){
    const box = qs('#ovcNextAction');
    if (!box) return;
    const tasks = read(STORE.tasks, []);
    const crm = read(STORE.crm, []);
    const openTasks = tasks.filter(t => !t.done);
    const hot = crm.filter(c => c.stage && c.stage !== 'perdido' && c.stage !== 'fechado');
    box.innerHTML = '<p>Abra a Central OVC e comece por uma acao concreta.</p><div class="ovc-suite-list">'
      + '<div class="ovc-suite-item"><strong>' + openTasks.length + ' tarefas abertas</strong><small>Registre tarefas do dia e marque o que foi resolvido.</small></div>'
      + '<div class="ovc-suite-item"><strong>' + hot.length + ' oportunidades no CRM</strong><small>Gere follow-ups com IA e avance contatos.</small></div>'
      + '</div>';
  }

  function dia(){
    const tasks = read(STORE.tasks, []);
    return '<h3>Central do Dia</h3><p>Planeje o dia, registre pendencias e transforme tarefas em mensagens ou acoes.</p>'
      + '<div class="ovc-suite-form"><div class="ovc-suite-row"><input id="taskTitle" placeholder="Tarefa ou oportunidade"><select id="taskType"><option>Comercial</option><option>Atendimento</option><option>Conteudo</option><option>Operacional</option></select></div><textarea id="taskNote" placeholder="Contexto, cliente, prazo ou objetivo"></textarea><div class="ovc-suite-actions"><button id="addTask">Adicionar tarefa</button><button class="ghost" id="planDay">Gerar plano do dia</button></div></div>'
      + '<div id="dayOutput" class="ovc-suite-output"></div><div class="ovc-suite-list">' + tasks.map(taskItem).join('') + '</div>';
  }

  function taskItem(t){ return '<div class="ovc-suite-item"><strong>' + esc(t.title) + '</strong><small>' + esc(t.type) + ' - ' + esc(t.note || '') + '</small><div class="ovc-suite-actions"><button class="ghost" data-task-done="' + t.id + '">Concluir</button><button class="ghost" data-task-ai="' + t.id + '">Gerar acao</button></div></div>'; }

  function crm(){
    const data = read(STORE.crm, []);
    return '<h3>Mini CRM</h3><p>CRM simples local: contatos, etapa, notas e proxima acao sugerida.</p>'
      + '<div class="ovc-suite-form"><div class="ovc-suite-row"><input id="crmName" placeholder="Nome do contato"><input id="crmContact" placeholder="WhatsApp, e-mail ou origem"></div><div class="ovc-suite-row"><select id="crmStage"><option value="novo">Novo lead</option><option value="conversa">Em conversa</option><option value="proposta">Proposta enviada</option><option value="negociacao">Negociacao</option><option value="fechado">Fechado</option><option value="perdido">Perdido</option></select><input id="crmProduct" placeholder="Produto/servico de interesse"></div><textarea id="crmNote" placeholder="Ultima conversa, objeção, necessidade ou contexto"></textarea><div class="ovc-suite-actions"><button id="addCrm">Adicionar contato</button><button class="ghost" id="crmFollowups">Gerar follow-ups</button></div></div><div id="crmOutput" class="ovc-suite-output"></div><div class="ovc-suite-list">' + data.map(crmItem).join('') + '</div>';
  }

  function crmItem(c){ return '<div class="ovc-suite-item"><strong>' + esc(c.name) + ' - ' + esc(c.stage) + '</strong><small>' + esc(c.product || '') + ' | ' + esc(c.contact || '') + '</small><p>' + esc(c.note || '') + '</p><div class="ovc-suite-actions"><button class="ghost" data-crm-ai="' + c.id + '">Proxima mensagem</button><button class="ghost" data-crm-delete="' + c.id + '">Excluir</button></div></div>'; }

  function negocio(){
    const b = read(STORE.business, {});
    return '<h3>Meu Negocio</h3><p>Ficha que personaliza textos, propostas, campanhas e respostas.</p><div class="ovc-suite-form"><div class="ovc-suite-row"><input id="bizName" placeholder="Nome da empresa/profissional" value="' + esc(b.name) + '"><input id="bizSegment" placeholder="Segmento" value="' + esc(b.segment) + '"></div><textarea id="bizProducts" placeholder="Produtos e servicos">' + esc(b.products) + '</textarea><textarea id="bizAudience" placeholder="Publico-alvo">' + esc(b.audience) + '</textarea><textarea id="bizVoice" placeholder="Tom de voz e diferenciais">' + esc(b.voice) + '</textarea><div class="ovc-suite-actions"><button id="saveBiz">Salvar ficha</button><button class="ghost" id="bizPrompt">Gerar briefing mestre</button></div></div><div id="bizOutput" class="ovc-suite-output"></div>';
  }

  function profissoes(){
    return '<h3>Assistentes por profissao</h3><p>Escolha a area, o objetivo e gere material de trabalho especifico.</p><div class="ovc-suite-form"><div class="ovc-suite-row"><select id="profSelect">' + professions.map(p => '<option>' + p + '</option>').join('') + '</select><select id="profGoal"><option>Vender</option><option>Atender cliente</option><option>Criar conteudo</option><option>Responder objeção</option><option>Montar proposta</option><option>Explicar documento</option></select></div><textarea id="profContext" placeholder="Descreva o caso, cliente, produto ou situacao"></textarea><div class="ovc-suite-actions"><button id="profGenerate">Gerar assistente</button></div></div><div id="profOutput" class="ovc-suite-output"></div>';
  }

  function documentos(){
    return '<h3>Central de Documentos</h3><p>Cole um contrato, e-mail, proposta, laudo textual ou reclamacao. A ferramenta resume e transforma em acao.</p><div class="ovc-suite-form"><select id="docMode"><option>Resumo executivo</option><option>Pontos importantes</option><option>Riscos e cuidados</option><option>Resposta ao documento</option><option>Versao simples para cliente</option></select><textarea id="docText" placeholder="Cole o documento aqui"></textarea><div class="ovc-suite-actions"><button id="docAnalyze">Analisar documento</button><button class="ghost" id="docLocal">Resumo local rapido</button></div></div><div id="docOutput" class="ovc-suite-output"></div>';
  }

  function atendimento(){
    return '<h3>Assistente de Atendimento</h3><p>WhatsApp, reclamacoes, follow-ups, objeções e respostas profissionais.</p><div class="ovc-suite-form"><div class="ovc-suite-row"><select id="attType"><option>Cliente pediu desconto</option><option>Cliente sumiu</option><option>Cliente reclamou</option><option>Cliente esta indeciso</option><option>Primeiro contato</option><option>Pos-venda</option></select><select id="attTone"><option>Consultivo</option><option>Objetivo</option><option>Elegante</option><option>Firme e educado</option><option>Proximo e humano</option></select></div><textarea id="attContext" placeholder="Cole a mensagem do cliente ou descreva a situacao"></textarea><div class="ovc-suite-actions"><button id="attGenerate">Gerar resposta</button></div></div><div id="attOutput" class="ovc-suite-output"></div>';
  }

  function comercial(){
    return '<h3>Comercial</h3><p>Propostas, campanhas, rotina de vendas, scripts e sequencias de follow-up.</p><div class="ovc-suite-form"><div class="ovc-suite-row"><select id="comType"><option>Proposta comercial</option><option>Plano de acao semanal</option><option>Sequencia de follow-up</option><option>Script de ligacao</option><option>Pagina de vendas</option><option>Anuncio</option><option>Calendario editorial</option></select><input id="comGoal" placeholder="Meta ou objetivo"></div><textarea id="comContext" placeholder="Produto, publico, preco, diferenciais, objeções e contexto"></textarea><div class="ovc-suite-actions"><button id="comGenerate">Gerar material</button></div></div><div id="comOutput" class="ovc-suite-output"></div>';
  }

  function conhecimento(){
    const data = read(STORE.knowledge, []);
    return '<h3>Cofre de Conhecimento</h3><p>Guarde produtos, respostas padrao, objeções, tom de voz e modelos. Fica local neste navegador.</p><div class="ovc-suite-form"><div class="ovc-suite-row"><input id="knowTitle" placeholder="Titulo"><select id="knowType"><option>Produto</option><option>Objeção</option><option>Resposta padrao</option><option>Tom de voz</option><option>Modelo</option><option>Link util</option></select></div><textarea id="knowBody" placeholder="Conteudo"></textarea><div class="ovc-suite-actions"><button id="addKnow">Salvar conhecimento</button><button class="ghost" id="useKnow">Gerar prompt com o cofre</button></div></div><div id="knowOutput" class="ovc-suite-output"></div><div class="ovc-suite-list">' + data.map(k => '<div class="ovc-suite-item"><strong>' + esc(k.title) + '</strong><small>' + esc(k.type) + '</small><p>' + esc(k.body) + '</p></div>').join('') + '</div>';
  }

  function utilitarios(){
    return '<h3>Utilitarios locais</h3><p>Ferramentas sem IA, sem API, rodando no navegador.</p><div class="ovc-suite-tools">' + localTools.map(t => '<button class="ovc-suite-tool" data-local-tool="' + t[0] + '"><strong>' + t[1] + '</strong><span>' + t[2] + '</span></button>').join('') + '</div><div class="ovc-suite-form"><textarea id="localInput" placeholder="Cole aqui o texto, lista ou numeros"></textarea><textarea id="localInput2" placeholder="Segundo texto, quando necessario"></textarea><div id="localOutput" class="ovc-suite-output"></div></div>';
  }

  function radar(){
    return '<h3>Radar Inteligente</h3><p>Cole uma noticia, tendencia ou informacao. A IA transforma em oportunidade, post, argumento ou alerta para cliente.</p><div class="ovc-suite-form"><div class="ovc-suite-row"><select id="radarMode"><option>Transformar em post</option><option>Argumento de venda</option><option>Alerta para cliente</option><option>Oportunidade comercial</option><option>Resumo critico</option></select><select id="radarAudience"><option>Clientes</option><option>Leads</option><option>Equipe</option><option>Instagram</option><option>LinkedIn</option></select></div><textarea id="radarText" placeholder="Cole a noticia ou informacao aqui"></textarea><div class="ovc-suite-actions"><button id="radarGenerate">Gerar leitura do radar</button></div></div><div id="radarOutput" class="ovc-suite-output"></div>';
  }

  function estudio(){
    return '<h3>Estudio Criativo</h3><p>Modulo visual integrado. Tudo continua dentro da OVC Inteligencia; a tela abaixo carrega o editor de artes.</p><div class="ovc-suite-actions"><a href="/estudio/" target="_blank"><button>Abrir em tela cheia</button></a></div><div style="height:720px;margin-top:14px;border:1px solid rgba(255,255,255,.12);border-radius:18px;overflow:hidden;background:#050711"><iframe src="/estudio/?embedded=1" title="Estudio Criativo" style="width:100%;height:100%;border:0"></iframe></div>';
  }

  function historico(){
    const h = read(STORE.history, []); const f = read(STORE.favorites, []);
    return '<h3>Historico e Favoritos</h3><p>Registro local das geracoes feitas nesta maquina.</p><div class="ovc-suite-actions"><button class="ghost" id="clearHistory">Limpar historico</button></div><h4>Favoritos</h4><div class="ovc-suite-list">' + f.map(histItem).join('') + '</div><h4>Historico</h4><div class="ovc-suite-list">' + h.map(histItem).join('') + '</div>';
  }

  function histItem(x){ return '<div class="ovc-suite-item"><strong>' + esc(x.title || 'Geracao') + '</strong><small>' + esc(x.date || '') + '</small><p>' + esc((x.text || '').slice(0, 700)) + '</p><div class="ovc-suite-actions"><button class="ghost" data-copy-text="' + encodeURIComponent(x.text || '') + '">Copiar</button><button class="ghost" data-fav-text="' + encodeURIComponent(JSON.stringify(x)) + '">Favoritar</button></div></div>'; }

  function bindView(id, view){
    if (id === 'dia') bindDay(view);
    if (id === 'crm') bindCrm(view);
    if (id === 'negocio') bindBusiness(view);
    if (id === 'profissoes') bindSimpleAi(view, '#profGenerate', '#profOutput', () => 'Profissao: ' + val('#profSelect') + '. Objetivo: ' + val('#profGoal') + '. Contexto: ' + val('#profContext') + '. Gere um material pratico, direto e pronto para uso.');
    if (id === 'documentos') bindDocs(view);
    if (id === 'atendimento') bindSimpleAi(view, '#attGenerate', '#attOutput', () => 'Tipo: ' + val('#attType') + '. Tom: ' + val('#attTone') + '. Contexto: ' + val('#attContext') + '. Gere resposta pronta para WhatsApp, humana e profissional.');
    if (id === 'comercial') bindSimpleAi(view, '#comGenerate', '#comOutput', () => 'Material: ' + val('#comType') + '. Meta: ' + val('#comGoal') + '. Contexto: ' + val('#comContext') + '. Gere estrutura completa, pratica e pronta para uso comercial.');
    if (id === 'conhecimento') bindKnowledge(view);
    if (id === 'utilitarios') bindLocalTools(view);
    if (id === 'radar') bindSimpleAi(view, '#radarGenerate', '#radarOutput', () => 'Modo: ' + val('#radarMode') + '. Publico: ' + val('#radarAudience') + '. Informacao: ' + val('#radarText') + '. Transforme em acao pratica e oportunidade.');
    if (id === 'historico') bindHistory(view);
  }

  function val(sel){ const el = qs(sel); return el ? el.value.trim() : ''; }
  function out(sel, text){ const el = qs(sel); if (el) el.textContent = text; }
  function saveHistory(title, text){ const h = read(STORE.history, []); h.unshift({ title, text, date: new Date().toLocaleString('pt-BR') }); write(STORE.history, h.slice(0,80)); }
  async function askAi(prompt){
    const fallback = localAnswer(prompt);
    try {
      const res = await fetch('/api/inteligencia', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ tool:'reescrever', text: prompt }) });
      const data = await res.json();
      if (data.ok && data.result) return data.result;
    } catch (err) { console.warn(err); }
    return fallback;
  }
  function localAnswer(prompt){ return 'Resposta local: ' + prompt.slice(0, 900) + '\n\nProxima acao sugerida: organize o contexto, defina o objetivo e gere uma mensagem curta com chamada para acao.'; }

  function bindSimpleAi(view, btnSel, outSel, promptFn){
    const btn = qs(btnSel, view); if (!btn) return;
    btn.onclick = async () => { out(outSel,'Gerando...'); const text = await askAi(promptFn()); out(outSel,text); saveHistory(btn.textContent, text); };
  }

  function bindDay(view){
    const add = qs('#addTask', view); if (add) add.onclick = () => { const tasks = read(STORE.tasks, []); tasks.unshift({ id:uid(), title:val('#taskTitle'), type:val('#taskType'), note:val('#taskNote'), done:false }); write(STORE.tasks,tasks); openView('dia'); renderNextAction(); };
    const plan = qs('#planDay', view); if (plan) plan.onclick = async () => { const tasks = read(STORE.tasks, []); out('#dayOutput','Gerando...'); const text = await askAi('Monte um plano do dia com prioridade, ordem de execucao e mensagens se necessario: ' + JSON.stringify(tasks)); out('#dayOutput',text); saveHistory('Plano do dia', text); };
    qsa('[data-task-done]', view).forEach(b => b.onclick = () => { const tasks = read(STORE.tasks, []).map(t => t.id === b.dataset.taskDone ? {...t, done:true} : t); write(STORE.tasks,tasks); openView('dia'); renderNextAction(); });
    qsa('[data-task-ai]', view).forEach(b => b.onclick = async () => { const t = read(STORE.tasks, []).find(x => x.id === b.dataset.taskAi); out('#dayOutput','Gerando...'); const text = await askAi('Gere a proxima acao para esta tarefa: ' + JSON.stringify(t)); out('#dayOutput',text); saveHistory('Acao da tarefa', text); });
  }

  function bindCrm(view){
    const add = qs('#addCrm', view); if (add) add.onclick = () => { const data = read(STORE.crm, []); data.unshift({ id:uid(), name:val('#crmName'), contact:val('#crmContact'), stage:val('#crmStage'), product:val('#crmProduct'), note:val('#crmNote') }); write(STORE.crm,data); openView('crm'); renderNextAction(); };
    const fol = qs('#crmFollowups', view); if (fol) fol.onclick = async () => { out('#crmOutput','Gerando...'); const text = await askAi('Gere follow-ups priorizados para estes contatos: ' + JSON.stringify(read(STORE.crm, []))); out('#crmOutput', text); saveHistory('Follow-ups CRM', text); };
    qsa('[data-crm-ai]', view).forEach(b => b.onclick = async () => { const c = read(STORE.crm, []).find(x => x.id === b.dataset.crmAi); out('#crmOutput','Gerando...'); const text = await askAi('Gere a proxima mensagem para este lead: ' + JSON.stringify(c)); out('#crmOutput',text); saveHistory('Mensagem CRM', text); });
    qsa('[data-crm-delete]', view).forEach(b => b.onclick = () => { write(STORE.crm, read(STORE.crm, []).filter(c => c.id !== b.dataset.crmDelete)); openView('crm'); });
  }

  function bindBusiness(view){
    const save = qs('#saveBiz', view); if (save) save.onclick = () => { write(STORE.business, { name:val('#bizName'), segment:val('#bizSegment'), products:val('#bizProducts'), audience:val('#bizAudience'), voice:val('#bizVoice') }); out('#bizOutput','Ficha salva neste navegador.'); };
    const prompt = qs('#bizPrompt', view); if (prompt) prompt.onclick = async () => { const b = read(STORE.business, {}); const text = 'Briefing mestre do negocio:\n' + JSON.stringify(b, null, 2); out('#bizOutput', text); saveHistory('Briefing do negocio', text); };
  }

  function bindDocs(view){
    bindSimpleAi(view, '#docAnalyze', '#docOutput', () => 'Modo: ' + val('#docMode') + '. Documento: ' + val('#docText') + '. Analise com clareza, destaque riscos, pontos importantes e proxima acao.');
    const local = qs('#docLocal', view); if (local) local.onclick = () => { const text = val('#docText'); const words = text.split(/\s+/).filter(Boolean); const res = 'Resumo local rapido:\n- Caracteres: ' + text.length + '\n- Palavras: ' + words.length + '\n- Primeiras linhas:\n' + text.split('\n').filter(Boolean).slice(0,6).join('\n'); out('#docOutput', res); saveHistory('Resumo local documento', res); };
  }

  function bindKnowledge(view){
    const add = qs('#addKnow', view); if (add) add.onclick = () => { const data = read(STORE.knowledge, []); data.unshift({ id:uid(), title:val('#knowTitle'), type:val('#knowType'), body:val('#knowBody') }); write(STORE.knowledge,data); openView('conhecimento'); };
    const use = qs('#useKnow', view); if (use) use.onclick = () => { const text = 'Contexto salvo no cofre:\n' + JSON.stringify(read(STORE.knowledge, []), null, 2); out('#knowOutput', text); };
  }

  function bindLocalTools(view){
    qsa('[data-local-tool]', view).forEach(btn => btn.onclick = () => { const res = runLocal(btn.dataset.localTool, val('#localInput'), val('#localInput2')); out('#localOutput', res); saveHistory('Utilitario: ' + btn.textContent.trim(), res); });
  }
  function runLocal(tool, a, b){
    if (tool === 'contador') return 'Caracteres: ' + a.length + '\nPalavras: ' + a.split(/\s+/).filter(Boolean).length + '\nLinhas: ' + a.split('\n').length;
    if (tool === 'limpador') return a.replace(/<[^>]*>/g,'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();
    if (tool === 'emails') return (a.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi) || []).join('\n') || 'Nenhum e-mail encontrado.';
    if (tool === 'telefones') return (a.match(/(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}/g) || []).join('\n') || 'Nenhum telefone encontrado.';
    if (tool === 'duplicados') return Array.from(new Set(a.split('\n').map(x => x.trim()).filter(Boolean))).join('\n');
    if (tool === 'maiusculas') return 'MAIUSCULO:\n' + a.toUpperCase() + '\n\nminusculo:\n' + a.toLowerCase() + '\n\nTitulo:\n' + a.toLowerCase().replace(/\b\w/g, m => m.toUpperCase());
    if (tool === 'slug') return a.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    if (tool === 'comparador') return compareTexts(a,b);
    if (tool === 'comissao') { const nums = a.match(/[\d.,]+/g) || []; const venda = parseFloat((nums[0]||'0').replace('.','').replace(',','.')); const pct = parseFloat((nums[1]||'0').replace(',','.')); return 'Comissao: R$ ' + (venda * pct / 100).toLocaleString('pt-BR',{minimumFractionDigits:2}); }
    if (tool === 'hora') { const nums = a.match(/[\d.,]+/g) || []; const renda = parseFloat((nums[0]||'0').replace('.','').replace(',','.')); const horas = parseFloat((nums[1]||'160').replace(',','.')); return 'Preco/hora sugerido: R$ ' + (renda / horas).toLocaleString('pt-BR',{minimumFractionDigits:2}); }
    if (tool === 'roi') { const nums = a.match(/[\d.,]+/g) || []; const ganho = parseFloat((nums[0]||'0').replace('.','').replace(',','.')); const inv = parseFloat((nums[1]||'1').replace('.','').replace(',','.')); return 'ROI: ' + (((ganho - inv) / inv) * 100).toFixed(2) + '%'; }
    if (tool === 'checklist') return a.split('\n').filter(Boolean).map(x => '[ ] ' + x.trim()).join('\n');
    return a;
  }
  function compareTexts(a,b){ const aw = new Set(a.split(/\s+/)); const bw = new Set(b.split(/\s+/)); return 'So no texto 1:\n' + [...aw].filter(x => !bw.has(x)).slice(0,120).join(' ') + '\n\nSo no texto 2:\n' + [...bw].filter(x => !aw.has(x)).slice(0,120).join(' '); }

  function bindHistory(view){
    const clear = qs('#clearHistory', view); if (clear) clear.onclick = () => { localStorage.removeItem(STORE.history); openView('historico'); };
    qsa('[data-copy-text]', view).forEach(b => b.onclick = () => navigator.clipboard.writeText(decodeURIComponent(b.dataset.copyText || '')));
    qsa('[data-fav-text]', view).forEach(b => b.onclick = () => { const f = read(STORE.favorites, []); f.unshift(JSON.parse(decodeURIComponent(b.dataset.favText))); write(STORE.favorites, f.slice(0,40)); openView('historico'); });
  }

  function injectAssistant(){
    if (qs('#ovcAiAssistant')) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = '<button class="ovc-ai-launch" id="ovcAiLaunch" title="Pergunte a IA"><i class="fas fa-sparkles"></i></button><aside class="ovc-ai-assistant" id="ovcAiAssistant"><header class="ovc-ai-head"><div><strong>Assistente OVC</strong><small>IA simples com fallback local</small></div><button class="ovc-ai-close" id="ovcAiClose">x</button></header><div class="ovc-ai-messages" id="ovcAiMessages"></div><div class="ovc-ai-quick"><button data-ai-q="Explique esta tela">Explique esta tela</button><button data-ai-q="Crie uma proxima acao">Proxima acao</button><button data-ai-q="Gere uma legenda curta">Legenda</button></div><form class="ovc-ai-form" id="ovcAiForm"><textarea id="ovcAiInput" placeholder="Pergunte algo..."></textarea><button>Enviar</button></form></aside>';
    document.body.appendChild(wrap);
    bindAssistant();
  }

  function bindAssistant(){
    const launch = qs('#ovcAiLaunch'), box = qs('#ovcAiAssistant'), close = qs('#ovcAiClose'), form = qs('#ovcAiForm'), input = qs('#ovcAiInput');
    launch.onclick = () => box.classList.toggle('open'); close.onclick = () => box.classList.remove('open');
    qsa('[data-ai-q]').forEach(b => b.onclick = () => { input.value = b.dataset.aiQ; form.requestSubmit(); });
    form.onsubmit = async e => { e.preventDefault(); const text = input.value.trim(); if (!text) return; input.value = ''; addAiMsg('user', text); addAiMsg('bot','Pensando...'); const context = getPageContext(); const ans = await askAi('Voce e o Assistente OVC dentro da OVC Inteligencia. Contexto da tela: ' + context + '. Pergunta: ' + text + '. Responda curto, pratico e orientado a acao.'); const msgs = qsa('.ovc-ai-msg.bot'); msgs[msgs.length-1].textContent = ans; saveHistory('Assistente OVC', ans); };
    addAiMsg('bot','Estou aqui para orientar o uso da OVC Inteligencia, criar ideias, resumir contexto e transformar trabalho em acao pratica.');
  }
  function addAiMsg(type, text){ const m = qs('#ovcAiMessages'); if (!m) return; const div = document.createElement('div'); div.className = 'ovc-ai-msg ' + type; div.textContent = text; m.appendChild(div); m.scrollTop = m.scrollHeight; }
  function getPageContext(){ const title = qs('[data-inteligencia-title]'); const active = qs('[data-inteligencia-nav].active'); return [title && title.textContent, active && active.textContent, location.pathname].filter(Boolean).join(' | '); }

  function bindGlobalNav(){
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-inteligencia-nav="suite"]');
      if (!btn) return;
      setTimeout(() => openView('dia'), 0);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();
