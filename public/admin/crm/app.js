const navSections = [
  {
    label: "Comando",
    items: [
      { id: "cockpit", label: "Cockpit", icon: "radar", count: "live" },
      { id: "empresas", label: "Empresas 360", icon: "building-2", count: "72k" },
      { id: "contatos", label: "Contatos", icon: "users", count: "193k" },
      { id: "relacionamento", label: "Relacionamento", icon: "heart-handshake", count: "IA" },
    ],
  },
  {
    label: "Receita",
    items: [
      { id: "pipeline", label: "Pipeline", icon: "kanban-square", count: "R$" },
      { id: "propostas", label: "Propostas", icon: "file-pen-line", count: "34" },
      { id: "contratos", label: "Contratos", icon: "file-check-2", count: "128" },
      { id: "faturamento", label: "Faturamento", icon: "receipt-text", count: "MRR" },
    ],
  },
  {
    label: "Operacao",
    items: [
      { id: "suporte", label: "Suporte e Pos-venda", icon: "headphones", count: "SLA" },
      { id: "produtos", label: "Produtos e Modulos", icon: "package-plus", count: "21" },
      { id: "arquivos", label: "Arquivos", icon: "folder-kanban", count: "docs" },
      { id: "inteligencia", label: "Inteligencia", icon: "network", count: "CI" },
    ],
  },
  {
    label: "Plataforma",
    items: [
      { id: "automacoes", label: "Automacoes", icon: "workflow", count: "bot" },
      { id: "usuarios", label: "Usuarios e Acessos", icon: "shield-check", count: "ACL" },
      { id: "migracao", label: "Migracao Merlin", icon: "database-zap", count: "ok" },
      { id: "config", label: "Configuracoes", icon: "settings-2", count: "" },
    ],
  },
];

const moduleData = {
  cockpit: {
    context: "Cockpit executivo",
    title: "Centro de comando operacional",
    eyebrow: "Valor Command / admin CRM",
    subtitle: "Receita, carteira, pipeline, agenda, riscos, suporte e IA em uma tela de controle.",
  },
  empresas: {
    context: "Empresa aberta: Super Terminais",
    title: "Empresa 360",
    eyebrow: "Ficha operacional",
    subtitle: "Cadastro limpo, contatos laterais, inteligencia competitiva, relatos e proximas acoes.",
  },
  contatos: {
    context: "Base de contatos",
    title: "Contatos e rede pessoal",
    eyebrow: "Relacionamento",
    subtitle: "Decisores, influenciadores, subcontatos, datas importantes e preferencias de abordagem.",
  },
  relacionamento: {
    context: "Relacionamento",
    title: "Mapa de relacionamento",
    eyebrow: "Network intelligence",
    subtitle: "Papeis, forca de vinculo, eventos pessoais, presentes, indicacoes e historico por contato.",
  },
  pipeline: {
    context: "Pipeline comercial",
    title: "Pipeline e oportunidades",
    eyebrow: "Receita futura",
    subtitle: "Funil visual, forecast, responsaveis, proximas acoes e concorrentes envolvidos.",
  },
  propostas: {
    context: "Propostas",
    title: "Propostas e negociacao",
    eyebrow: "Comercial",
    subtitle: "Versoes, descontos, aprovadores, anexos, assinatura e historico de envio.",
  },
  contratos: {
    context: "Contratos",
    title: "Contratos e recorrencia",
    eyebrow: "ERP comercial",
    subtitle: "Vigencia, modulos ativos, renovacao, SLA, reajuste, arquivos e alertas.",
  },
  faturamento: {
    context: "Faturamento",
    title: "Faturamento e financeiro",
    eyebrow: "Receita e cobranca",
    subtitle: "MRR, vencimentos, inadimplencia, notas, pagamentos e receita por carteira.",
  },
  suporte: {
    context: "Suporte",
    title: "Suporte, manutencao e sucesso",
    eyebrow: "Pos-venda",
    subtitle: "Chamados, SLA, upgrades, risco de churn, manutencoes e historico tecnico.",
  },
  produtos: {
    context: "Produtos e modulos",
    title: "Catalogo de produtos",
    eyebrow: "Modulos vendaveis",
    subtitle: "Planos, features, clientes ativos, upsell e permissao por produto.",
  },
  arquivos: {
    context: "Arquivos",
    title: "Arquivos e documentos",
    eyebrow: "Repositorio operacional",
    subtitle: "Contratos, propostas, prints, anexos, comprovantes e documentos por entidade.",
  },
  inteligencia: {
    context: "Inteligencia competitiva",
    title: "Inteligencia competitiva",
    eyebrow: "Mercado",
    subtitle: "Concorrentes, parceiros, argumentos comerciais, sinais externos e enriquecimento.",
  },
  automacoes: {
    context: "Automacoes",
    title: "Automacoes e playbooks",
    eyebrow: "Operacao assistida",
    subtitle: "Fluxos comerciais, cobranca, tarefas recorrentes, enriquecimento e alertas.",
  },
  usuarios: {
    context: "Usuarios e permissoes",
    title: "Usuarios, times e hierarquia",
    eyebrow: "SaaS admin",
    subtitle: "Permissoes, carteiras, gestores, trilha de auditoria e controle de acesso.",
  },
  migracao: {
    context: "Migracao Merlin",
    title: "Migracao e qualidade de dados",
    eyebrow: "Data foundation",
    subtitle: "Cargas, auditorias, segunda parte do Merlin, conflitos e flags de qualidade.",
  },
  config: {
    context: "Configuracoes",
    title: "Configuracoes da plataforma",
    eyebrow: "Admin",
    subtitle: "Tenants, modulos, billing do SaaS, chaves de IA, webhooks e parametros.",
  },
};

const aiMessages = {
  cockpit: [
    ["Resumo executivo", "Pipeline com R$ 4,8 mi em aberto; 17 follow-ups vencem hoje; 9 clientes com contrato em renovacao."],
    ["Acao sugerida", "Priorize empresas com decisor ativo e fatura recorrente acima de R$ 12 mil."],
    ["Sinal externo", "12 empresas da carteira possuem site sem LinkedIn mapeado. Enriquecimento pode rodar em lote."],
  ],
  empresas: [
    ["Empresa 360", "Super Terminais tem 4 contatos historicos, 1 decisor operacional e oportunidade de modulo financeiro."],
    ["Contato recomendado", "Júlio Almeida tem validacao recente e perfil de obras. Melhor canal: e-mail + WhatsApp."],
    ["Proxima abordagem", "Use argumento de controle de fornecedores e historico de manutencao portuaria."],
  ],
  default: [
    ["Copiloto ativo", "A IA carrega o contexto da tela, respeita permissoes e pode consultar base interna e web."],
    ["Pronta para acao", "Peça resumos, listas, oportunidades paradas, clientes em risco ou textos comerciais."],
    ["Auditoria", "Toda acao executada pela IA deve gerar log com usuario, horario, entidade e ferramenta usada."],
  ],
};

const modules = [
  ["Empresas", "building-2", "Ficha 360, contatos, concorrentes, arquivos e historico.", "--cyan"],
  ["Contatos", "users", "Papeis, rede pessoal, subcontatos, preferencias e logs.", "--green"],
  ["Pipeline", "kanban-square", "Funil, forecast, perda, ganho, concorrencia e proximas acoes.", "--amber"],
  ["Faturamento", "receipt-text", "MRR, vencimentos, inadimplencia, contratos e cobranca.", "--blue"],
  ["Suporte", "headphones", "Chamados, SLA, upgrades, renovacao e sucesso do cliente.", "--red"],
  ["IA", "brain-circuit", "Copiloto contextual, RAG, busca web e enriquecimento.", "--violet"],
  ["Arquivos", "folder-kanban", "Documentos ligados a empresas, propostas, contratos e chamados.", "--steel"],
  ["Automacoes", "workflow", "Playbooks, robos, alertas, tarefas e integrações.", "--cyan"],
  ["Usuarios", "shield-check", "Times, hierarquia, permissao, auditoria e carteira.", "--green"],
];

let activeModule = "cockpit";

function icon(name) {
  return `<i data-lucide="${name}"></i>`;
}

function renderNav() {
  const nav = document.getElementById("mainNav");
  nav.innerHTML = navSections
    .map(
      (section) => `
        <div class="nav-group">${section.label}</div>
        ${section.items
          .map(
            (item) => `
              <button class="nav-item ${item.id === activeModule ? "active" : ""}" data-module="${item.id}">
                ${icon(item.icon)}
                <span>${item.label}</span>
                <em class="nav-count">${item.count}</em>
              </button>
            `,
          )
          .join("")}
      `,
    )
    .join("");
  nav.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => setModule(button.dataset.module));
  });
}

function pageHead(data, actions = true) {
  return `
    <div class="page-head">
      <div>
        <span class="eyebrow">${data.eyebrow}</span>
        <h1>${data.title}</h1>
        <p>${data.subtitle}</p>
      </div>
      ${
        actions
          ? `<div class="head-actions">
              <button class="btn">${icon("download")}Exportar</button>
              <button class="btn warning">${icon("alert-triangle")}Risco</button>
              <button class="btn primary">${icon("plus")}Novo</button>
            </div>`
          : ""
      }
    </div>
  `;
}

function renderCockpit() {
  const data = moduleData.cockpit;
  return `
    <div class="page">
      ${pageHead(data)}
      <div class="kpi-grid">
        ${kpi("MRR projetado", "R$ 812k", "+18,4% vs mes anterior", "signal")}
        ${kpi("Pipeline aberto", "R$ 4,8M", "63 oportunidades ativas", "signal amber")}
        ${kpi("Follow-ups hoje", "117", "32 acima do SLA interno", "signal red")}
        ${kpi("Base migrada", "72.380", "195.770 vinculos validados", "signal")}
      </div>

      <div class="dashboard-layout">
        <section class="panel">
          <div class="panel-title">
            <h2>Mapa operacional</h2>
            <span class="status-chip">live simulation</span>
          </div>
          <div class="ops-map">
            <svg class="map-lines" viewBox="0 0 620 268" preserveAspectRatio="none">
              <path d="M92 72 L300 134 L502 68" stroke="#49d5d1" stroke-width="1.2" fill="none" opacity=".85" />
              <path d="M130 210 L300 134 L520 210" stroke="#f2bd55" stroke-width="1.2" fill="none" opacity=".8" />
              <path d="M300 134 L280 42" stroke="#72e188" stroke-width="1.2" fill="none" opacity=".8" />
              <path d="M300 134 L382 224" stroke="#ff6d61" stroke-width="1.2" fill="none" opacity=".8" />
            </svg>
            <div class="node" style="left: 48%; top: 50%">EMPRESAS</div>
            <div class="node green" style="left: 15%; top: 27%">CONTATOS</div>
            <div class="node amber" style="left: 82%; top: 26%">PIPELINE</div>
            <div class="node blue" style="left: 22%; top: 78%">FATURAMENTO</div>
            <div class="node red" style="left: 84%; top: 78%">SUPORTE</div>
            <div class="node green" style="left: 45%; top: 16%">IA</div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-title">
            <h2>Receita e operacao</h2>
            <span class="status-chip">D+0</span>
          </div>
          <div class="metric-bars">
            ${bar("Comercial", 82, "cyan")}
            ${bar("Faturamento", 68, "green")}
            ${bar("Renovacao", 54, "amber")}
            ${bar("Suporte", 31, "red")}
            ${bar("Enriquecimento", 76, "cyan")}
          </div>
          ${radarSvg()}
        </section>

        <section class="panel">
          <div class="panel-title">
            <h2>Fila critica</h2>
            <span class="status-chip">17:41</span>
          </div>
          <div class="worklist">
            ${workItem("red", "Renovacao vencendo", "14 contratos precisam de decisao ate sexta", "14")}
            ${workItem("amber", "Follow-up de decisor", "Júlio Almeida sem retorno ha 9 dias", "9d")}
            ${workItem("green", "Upsell recomendado", "Clientes com suporte alto e modulo basico", "23")}
            ${workItem("cyan", "Carga Merlin 2", "Preparar pipeline incremental com auditoria", "70%")}
            ${workItem("amber", "LinkedIn ausente", "2.893 vinculos exigem enriquecimento", "IA")}
          </div>
        </section>
      </div>

      <div class="module-grid">
        ${modules.map(moduleTile).join("")}
      </div>
    </div>
  `;
}

function kpi(label, value, desc, signalClass) {
  return `
    <div class="kpi">
      <span>${label}</span>
      <strong>${value}</strong>
      <em>${desc}</em>
      <b class="${signalClass}">● operacional</b>
    </div>
  `;
}

function bar(label, value, color) {
  return `
    <div class="bar-row">
      <span>${label}</span>
      <div class="bar-track"><div class="bar-fill ${color}" style="width:${value}%"></div></div>
      <strong>${value}%</strong>
    </div>
  `;
}

function radarSvg() {
  return `
    <svg class="radar" viewBox="0 0 320 230">
      <rect x="0" y="0" width="320" height="230" fill="#0c0f0e"/>
      <g stroke="#2b332e" fill="none">
        <polygon points="160,28 246,76 246,174 160,216 74,174 74,76"/>
        <polygon points="160,58 220,92 220,158 160,188 100,158 100,92"/>
        <polygon points="160,88 194,106 194,144 160,158 126,144 126,106"/>
        <line x1="160" y1="28" x2="160" y2="216"/>
        <line x1="74" y1="76" x2="246" y2="174"/>
        <line x1="246" y1="76" x2="74" y2="174"/>
      </g>
      <polygon points="160,42 226,91 206,158 160,194 102,154 112,84" fill="rgba(73,213,209,.22)" stroke="#49d5d1" stroke-width="2"/>
      <text x="154" y="20" fill="#9aa79f" font-size="10">IA</text>
      <text x="250" y="78" fill="#9aa79f" font-size="10">Receita</text>
      <text x="248" y="184" fill="#9aa79f" font-size="10">Suporte</text>
      <text x="132" y="226" fill="#9aa79f" font-size="10">Faturamento</text>
      <text x="28" y="184" fill="#9aa79f" font-size="10">Base</text>
      <text x="28" y="78" fill="#9aa79f" font-size="10">Pipeline</text>
    </svg>
  `;
}

function workItem(color, title, desc, meta) {
  return `
    <div class="work-item">
      <i class="dot ${color}"></i>
      <div>
        <strong>${title}</strong>
        <span>${desc}</span>
      </div>
      <span>${meta}</span>
    </div>
  `;
}

function moduleTile([title, tileIcon, desc, accentVar]) {
  return `
    <article class="module-tile" style="--accent: var(${accentVar})">
      ${icon(tileIcon)}
      <h3>${title}</h3>
      <p>${desc}</p>
      <div class="tile-foot">
        <span class="tag">operacao</span>
        <span class="tag">IA</span>
      </div>
    </article>
  `;
}

function renderCompany() {
  const data = moduleData.empresas;
  return `
    <div class="page">
      ${pageHead(data)}
      <div class="company-page">
        <div class="page">
          <section class="company-strip">
            <div>
              <span class="eyebrow">empresa_id_legado 147066</span>
              <h2>Super Terminais</h2>
              <div class="company-meta">
                <span>Manaus / AM</span>
                <span>Servicos</span>
                <span>Cliente historico</span>
                <span>4 contatos</span>
                <span>Site validado</span>
              </div>
            </div>
            <div class="score-block">
              <div class="score"><strong>86</strong><span>relacao</span></div>
              <div class="score"><strong>72</strong><span>fit</span></div>
              <div class="score"><strong>14d</strong><span>acao</span></div>
            </div>
          </section>

          <section class="panel">
            <div class="section-title">
              <h2>Ficha cadastral</h2>
              <button class="btn">${icon("pencil")}Editar</button>
            </div>
            <div class="field-grid">
              ${field("Razao social", "Super Terminais Comercio e Industria Ltda - AM")}
              ${field("CNPJ", "A validar")}
              ${field("Site", "superterminais.com.br")}
              ${field("Endereco", "Rua Ponta Grossa, 256")}
              ${field("Bairro", "Colonia Oliveira Machado")}
              ${field("Telefone", "(92) 3623-3700")}
              ${field("Segmento", "Servicos / infraestrutura")}
              ${field("Responsavel interno", "Z_Reprospectar - Construtoras")}
              ${field("Origem", "Merlin CRM / carga 001")}
            </div>
          </section>

          <div class="split-panels">
            <section class="panel">
              <div class="panel-title">
                <h2>Inteligencia competitiva</h2>
                <span class="status-chip">draft</span>
              </div>
              <div class="worklist">
                ${workItem("amber", "Concorrente direto", "Terminais logisticos regionais a mapear", "CI")}
                ${workItem("cyan", "Argumento", "Controle de fornecedores, obras e manutencao portuaria", "IA")}
                ${workItem("green", "Sinal", "Site ativo e dominio de email consistente", "web")}
              </div>
            </section>
            <section class="panel">
              <div class="panel-title">
                <h2>Oportunidades</h2>
                <span class="status-chip">R$ 84k</span>
              </div>
              <div class="worklist">
                ${workItem("green", "Modulo financeiro", "Fit alto por recorrencia e operacao distribuida", "72%")}
                ${workItem("amber", "Upgrade relacionamento", "Ativar decisores e subcontatos", "IA")}
                ${workItem("cyan", "Arquivo", "Anexar proposta e contrato historico", "docs")}
              </div>
            </section>
          </div>

          ${timelinePanel()}
        </div>
        <aside class="contact-stack">
          <section class="panel">
            <div class="panel-title">
              <h2>Contatos vinculados</h2>
              <button class="icon-btn compact" title="Adicionar contato">${icon("user-plus")}</button>
            </div>
            ${contactCard("JB", "Joabe de Franca Barros", "Gerente Operacional", "saiu", "joabe@superterminais.com.br", "Ex-contato relevante; manter historico comercial.")}
            ${contactCard("JA", "Júlio Almeida", "Gerente de Obras", "influenciador", "julio@superterminais.com.br", "Validado em 27/05/2026. Melhor contato para obras e operacao.")}
            ${contactCard("MD", "Marcello di Gregorio", "Diretor", "decisor", "superterminais@superterminais.com.br", "Contato com papel executivo. Priorizar para proposta.")}
            ${contactCard("WA", "Washington", "Gerente de Engenharia", "tecnico", "washington@superterminais.com.br", "Mapear WhatsApp e LinkedIn.")}
          </section>
        </aside>
      </div>
    </div>
  `;
}

function field(label, value) {
  return `<div class="field"><span>${label}</span><strong>${value}</strong></div>`;
}

function contactCard(initials, name, cargo, role, email, note) {
  return `
    <article class="contact-card">
      <div class="contact-head">
        <div class="avatar">${initials}</div>
        <div>
          <strong>${name}</strong>
          <span>${cargo}</span>
        </div>
        <em class="role-pill">${role}</em>
      </div>
      <div class="contact-actions">
        <button class="mini-action" title="Email">${icon("mail")}</button>
        <button class="mini-action" title="WhatsApp">${icon("message-circle")}</button>
        <button class="mini-action" title="LinkedIn">${icon("linkedin")}</button>
        <button class="mini-action" title="Relato">${icon("notebook-pen")}</button>
      </div>
      <div class="personal-net">
        <strong>${email}</strong><br />
        ${note}
      </div>
    </article>
  `;
}

function timelinePanel() {
  return `
    <section class="timeline">
      <div class="panel-title">
        <h2>Relatos e interacoes</h2>
        <button class="btn primary">${icon("notebook-pen")}Novo relato</button>
      </div>
      <div class="timeline-list">
        ${event("Hoje", "IA sugeriu abordagem", "Conectar modulo financeiro a controle de manutencao e fornecedores.")}
        ${event("27/05/2026", "Contato validado", "Júlio Almeida e Marcello di Gregorio confirmados na ficha da empresa.")}
        ${event("04/02/2020", "Relato historico", "Ligacao registrada no Merlin. Temperatura ignorada, funil lead.")}
      </div>
    </section>
  `;
}

function event(date, title, desc) {
  return `<div class="event"><time>${date}</time><div><strong>${title}</strong><p>${desc}</p></div></div>`;
}

function renderPipeline() {
  const data = moduleData.pipeline;
  const cols = [
    ["Entrada", "R$ 920k", ["IPHAN - ES", "13ANX", "2 Day Consultoria"]],
    ["Qualificacao", "R$ 1,1M", ["Super Terminais", "Octus Arquitetura", "Plano & Plano"]],
    ["Proposta", "R$ 1,6M", ["Grupo Carone", "Tauste", "Perkins&Will"]],
    ["Negociacao", "R$ 740k", ["Rede Super Maxi", "Kawakami"]],
    ["Fechamento", "R$ 420k", ["Casa Guanabara", "Grupo ABC"]],
  ];
  return `
    <div class="page">
      ${pageHead(data)}
      <div class="pipeline-board">
        ${cols
          .map(
            ([name, value, deals]) => `
              <section class="pipeline-col">
                <h3>${name}<span>${value}</span></h3>
                ${deals.map((deal, i) => `<div class="deal"><strong>${deal}</strong><span>Proxima acao em ${i + 2} dias</span><span>Fit ${74 + i * 6}% · IA ativa</span></div>`).join("")}
              </section>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderFinance() {
  const data = moduleData.faturamento;
  return `
    <div class="page">
      ${pageHead(data)}
      <div class="kpi-grid">
        ${kpi("Receita mensal", "R$ 812k", "MRR consolidado", "signal")}
        ${kpi("A receber", "R$ 231k", "42 faturas abertas", "signal amber")}
        ${kpi("Inadimplencia", "R$ 38k", "7 clientes em atraso", "signal red")}
        ${kpi("Renovacao", "R$ 496k", "Proximos 90 dias", "signal")}
      </div>
      <div class="finance-grid">
        ${moduleTile(["Contratos ativos", "file-check-2", "Vigencia, reajuste, SLA e arquivos vinculados.", "--green"])}
        ${moduleTile(["Faturas", "receipt", "Notas, vencimentos, cobrancas e pagamento.", "--amber"])}
        ${moduleTile(["Assinaturas", "repeat-2", "Planos recorrentes, MRR, ARR e churn.", "--cyan"])}
      </div>
      ${tablePanel("Faturas criticas", ["Cliente", "Valor", "Vencimento", "Status"], [
        ["Super Terminais", "R$ 12.400", "05/06", "A vencer"],
        ["13ANX", "R$ 4.900", "07/06", "Aberta"],
        ["Grupo ABC", "R$ 28.100", "Vencida", "Risco"],
      ])}
    </div>
  `;
}

function tablePanel(title, headers, rows) {
  return `
    <section class="data-table">
      <table>
        <thead><tr><th colspan="${headers.length}">${title}</th></tr><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${rows.map((r) => `<tr>${r.map((c, idx) => `<td>${idx === 0 ? `<strong>${c}</strong>` : c}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    </section>
  `;
}

function renderGeneric(id) {
  const data = moduleData[id];
  const moduleSpecific = {
    contatos: [
      ["Joabe de Franca", "Gerente Operacional", "Super Terminais", "Saiu"],
      ["Júlio Almeida", "Gerente de Obras", "Super Terminais", "Ativo"],
      ["Bruna", "Comprador", "13ANX", "Validar LinkedIn"],
      ["Daniel", "Arquiteto", "Octus Arquitetura", "Pequeno"],
    ],
    suporte: [
      ["Chamado #4921", "Super Terminais", "SLA 6h", "Aberto"],
      ["Upgrade #104", "Grupo ABC", "MRR +R$ 8k", "Sugerido"],
      ["Manutencao", "13ANX", "Agenda", "Planejar"],
    ],
    migracao: [
      ["Empresas", "72.380", "100%", "OK"],
      ["Contatos", "193.553", "base 1", "OK"],
      ["Vinculos", "195.770", "sem duplicidade", "OK"],
      ["Merlin 2", "+70%", "pendente", "Preparar"],
    ],
  };
  return `
    <div class="page">
      ${pageHead(data)}
      <div class="module-grid">
        ${modules.slice(0, 6).map(moduleTile).join("")}
      </div>
      <div class="empty-control">
        <section class="panel">
          <div class="panel-title">
            <h2>Fila operacional</h2>
            <span class="status-chip">${id}</span>
          </div>
          <div class="worklist">
            ${workItem("cyan", "Criar registro", "Acao rapida conectada ao modulo atual", "novo")}
            ${workItem("amber", "Revisar pendencias", "Itens que exigem decisao do responsavel", "12")}
            ${workItem("green", "Automacao sugerida", "IA identificou playbook aplicavel", "IA")}
            ${workItem("red", "Risco operacional", "Evento critico com SLA ou receita", "alerta")}
          </div>
        </section>
        <section class="panel">
          <div class="panel-title">
            <h2>Rede e sinais</h2>
            <span class="status-chip">web ready</span>
          </div>
          <div class="social-grid">
            ${social("LinkedIn", "company + contato")}
            ${social("Instagram", "marca")}
            ${social("YouTube", "conteudo")}
            ${social("Site", "dominio")}
          </div>
        </section>
      </div>
      ${
        moduleSpecific[id]
          ? tablePanel("Amostra do modulo", ["Item", "Contexto", "Sinal", "Status"], moduleSpecific[id])
          : tablePanel("Recursos previstos", ["Recurso", "Escopo", "Prioridade", "Status"], [
              ["IA contextual", "consulta base + web", "Alta", "Desenho"],
              ["Auditoria", "quem fez o que", "Alta", "Obrigatorio"],
              ["Permissoes", "tenant, time, usuario", "Alta", "Obrigatorio"],
            ])
      }
    </div>
  `;
}

function social(name, desc) {
  return `<div class="social-tile">${icon(name === "LinkedIn" ? "linkedin" : name === "Site" ? "globe" : "radio")}<strong>${name}</strong><span>${desc}</span></div>`;
}

function setModule(id) {
  activeModule = id;
  render();
}

function renderAi() {
  const context = moduleData[activeModule]?.context || "Sistema";
  document.getElementById("aiContext").textContent = context;
  const messages = aiMessages[activeModule] || aiMessages.default;
  document.getElementById("aiFeed").innerHTML = messages
    .map(([title, body]) => `<article class="ai-card"><strong>${title}</strong><p>${body}</p></article>`)
    .join("");
}

function renderStage() {
  const stage = document.getElementById("moduleStage");
  if (activeModule === "cockpit") stage.innerHTML = renderCockpit();
  else if (activeModule === "empresas") stage.innerHTML = renderCompany();
  else if (activeModule === "pipeline") stage.innerHTML = renderPipeline();
  else if (activeModule === "faturamento") stage.innerHTML = renderFinance();
  else stage.innerHTML = renderGeneric(activeModule);
}

function render() {
  renderNav();
  renderStage();
  renderAi();
  if (window.lucide) window.lucide.createIcons();
}

render();
