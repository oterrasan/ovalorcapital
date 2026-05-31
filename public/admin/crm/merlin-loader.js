(() => {
  let merlinData = null;
  let merlinError = "";
  let selectedCompanyId = "";
  let companyFilter = "";

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeText(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function compact(value, fallback = "-") {
    const text = String(value ?? "").trim();
    return text && text !== "-" ? text : fallback;
  }

  function fmtNumber(value) {
    return Number(value || 0).toLocaleString("pt-BR");
  }

  function companyName(company) {
    return company?.nome_fantasia || company?.nome_lista || company?.razao_social || "Empresa sem nome";
  }

  function contactInitials(name) {
    const parts = String(name || "Contato").trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] || "C") + (parts[1]?.[0] || "")).toUpperCase();
  }

  function normalizeMerlinPayload(payload) {
    return {
      sample: {
        empresa_count: payload.s?.[0] || 0,
        contact_count: payload.s?.[1] || 0,
        companies_with_contacts: payload.s?.[2] || 0,
      },
      companies: (payload.c || []).map((company) => {
        const tiny = Array.isArray(company[4]);
        return {
          empresa_id_legado: company[0] || "",
          nome_fantasia: company[1] || "",
          nome_lista: company[1] || "",
          razao_social: tiny ? company[1] || "" : company[2] || "",
          cidade: tiny ? company[2] || "" : company[3] || "",
          uf: tiny ? company[3] || "" : company[4] || "",
          site: tiny ? "" : company[5] || "",
          telefone_1: tiny ? "" : company[6] || "",
          segmento_principal: tiny ? "" : company[7] || "",
          contatos: (tiny ? company[4] : company[8] || []).map((contact) => ({
            contato_id_legado: contact[0] || "",
            nome: contact[1] || "",
            cargo: contact[2] || "",
          })),
        };
      }),
    };
  }

  async function readMerlinPayload(response) {
    const text = (await response.text()).trim();
    if (!text) throw new Error("Amostra Merlin vazia.");
    if (text.startsWith("{")) return JSON.parse(text);
    if (!("DecompressionStream" in window)) {
      throw new Error("Navegador sem suporte para carga compactada.");
    }
    const bytes = Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
    const stream = new Response(bytes).body.pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).json();
  }

  function filteredCompanies() {
    if (!merlinData?.companies) return [];
    const query = normalizeText(companyFilter);
    if (!query) return merlinData.companies;
    return merlinData.companies.filter((company) =>
      normalizeText([
        company.empresa_id_legado,
        companyName(company),
        company.razao_social,
        company.cidade,
        company.uf,
        company.site,
      ].join(" ")).includes(query),
    );
  }

  function selectedCompany() {
    const companies = filteredCompanies();
    if (!companies.length) return null;
    return companies.find((company) => company.empresa_id_legado === selectedCompanyId) || companies[0];
  }

  function companyRow(company) {
    const active = company.empresa_id_legado === selectedCompanyId ? "active" : "";
    const location = [company.cidade, company.uf].filter(Boolean).join(" / ") || "Local nao informado";
    return `
      <button class="company-row ${active}" data-company-id="${escapeHtml(company.empresa_id_legado)}">
        <strong>${escapeHtml(companyName(company))}</strong>
        <span>${escapeHtml(location)} - ${escapeHtml(company.contatos?.length || 0)} contatos - ID ${escapeHtml(company.empresa_id_legado)}</span>
      </button>
    `;
  }

  function merlinContactCard(contact) {
    const name = compact(contact.nome, "Contato sem nome");
    return `
      <article class="contact-card">
        <div class="contact-head">
          <div class="avatar">${escapeHtml(contactInitials(name))}</div>
          <div>
            <strong>${escapeHtml(name)}</strong>
            <span>${escapeHtml(compact(contact.cargo, "Cargo nao informado"))}</span>
          </div>
          <em class="role-pill">ID ${escapeHtml(contact.contato_id_legado)}</em>
        </div>
        <div class="contact-actions">
          <button class="mini-action" title="Email">${icon("mail")}</button>
          <button class="mini-action" title="WhatsApp">${icon("message-circle")}</button>
          <button class="mini-action" title="LinkedIn">${icon("linkedin")}</button>
          <button class="mini-action" title="Relato">${icon("notebook-pen")}</button>
        </div>
        <div class="personal-net">
          <strong>Contato importado do Merlin</strong><br />
          Cargo e vinculo preservados para teste de relacionamento.
        </div>
      </article>
    `;
  }

  function merlinTimelinePanel(company, summary) {
    return `
      <section class="timeline">
        <div class="panel-title">
          <h2>Relatos e auditoria</h2>
          <span class="status-chip">Merlin teste</span>
        </div>
        <div class="timeline-list">
          ${event("Agora", "Amostra carregada", `${fmtNumber(summary.empresa_count)} empresas e ${fmtNumber(summary.contact_count)} contatos vinculados prontos para teste visual.`)}
          ${event("Fonte", "Merlin CRM", `Empresa ${escapeHtml(company.empresa_id_legado)} importada da planilha compilada local.`)}
          ${event("Proximo passo", "Supabase", "Depois da validacao visual, a carga completa deve ir para tabelas privadas e API autenticada.")}
        </div>
      </section>
    `;
  }

  renderCompany = function renderCompanyWithMerlin() {
    const data = moduleData.empresas;
    if (!merlinData) {
      return `
        <div class="page">
          ${pageHead(data)}
          <section class="panel">
            <div class="panel-title">
              <h2>Carga Merlin de teste</h2>
              <span class="status-chip">${merlinError ? "erro" : "carregando"}</span>
            </div>
            <p style="color: var(--muted); margin: 0">${merlinError ? `Nao foi possivel carregar a amostra: ${escapeHtml(merlinError)}` : "Carregando 500 empresas e contatos vinculados..."}</p>
          </section>
        </div>
      `;
    }

    const companies = filteredCompanies();
    const company = selectedCompany();
    const summary = merlinData.sample;
    if (!company) {
      return `
        <div class="page">
          ${pageHead(data)}
          <section class="panel">
            <div class="merlin-search">
              <input id="companyFilter" value="${escapeHtml(companyFilter)}" placeholder="Buscar empresa..." />
            </div>
            <p style="color: var(--muted); margin: 0">Nenhuma empresa encontrada para esse filtro.</p>
          </section>
        </div>
      `;
    }

    selectedCompanyId = company.empresa_id_legado;
    const contacts = company.contatos || [];
    return `
      <div class="page">
        ${pageHead({
          ...data,
          subtitle: `Amostra real do Merlin com ${fmtNumber(summary.empresa_count)} empresas, ${fmtNumber(summary.contact_count)} contatos vinculados e ${fmtNumber(summary.companies_with_contacts)} empresas com contato.`,
        })}
        <div class="company-page">
          <div class="page">
            <section class="company-strip">
              <div>
                <span class="eyebrow">empresa_id_legado ${escapeHtml(company.empresa_id_legado)}</span>
                <h2>${escapeHtml(companyName(company))}</h2>
                <div class="company-meta">
                  <span>${escapeHtml(compact(company.cidade, "Cidade nao informada"))} / ${escapeHtml(compact(company.uf, "UF"))}</span>
                  <span>${escapeHtml(compact(company.segmento_principal, "Segmento nao informado"))}</span>
                  <span>${escapeHtml(contacts.length)} contatos</span>
                  <span>amostra 500</span>
                </div>
              </div>
              <div class="score-block">
                <div class="score"><strong>${escapeHtml(contacts.length)}</strong><span>contatos</span></div>
                <div class="score"><strong>${escapeHtml(compact(company.uf))}</strong><span>uf</span></div>
                <div class="score"><strong>${escapeHtml(compact(company.empresa_id_legado))}</strong><span>id</span></div>
              </div>
            </section>

            <section class="panel merlin-browser">
              <div>
                <div class="panel-title">
                  <h2>Empresas Merlin</h2>
                  <span class="status-chip">${companies.length}/${summary.empresa_count}</span>
                </div>
                <div class="merlin-search">
                  <input id="companyFilter" value="${escapeHtml(companyFilter)}" placeholder="Buscar empresa..." />
                </div>
                <div class="company-list-scroll">
                  ${companies.slice(0, 80).map(companyRow).join("")}
                </div>
              </div>
              <div class="merlin-detail">
                <div class="section-title">
                  <h2>Ficha cadastral</h2>
                  <button class="btn">${icon("pencil")}Editar</button>
                </div>
                <div class="field-grid">
                  ${field("Razao social", escapeHtml(compact(company.razao_social)))}
                  ${field("Site", escapeHtml(compact(company.site, "Nao informado")))}
                  ${field("Cidade", escapeHtml(compact(company.cidade, "Nao informado")))}
                  ${field("UF", escapeHtml(compact(company.uf, "Nao informado")))}
                  ${field("Telefone", escapeHtml(compact(company.telefone_1, "Nao informado")))}
                  ${field("Segmento", escapeHtml(compact(company.segmento_principal, "Nao informado")))}
                </div>
              </div>
            </section>

            ${merlinTimelinePanel(company, summary)}
          </div>
          <aside class="contact-stack">
            <section class="panel">
              <div class="panel-title">
                <h2>Contatos vinculados</h2>
                <span class="status-chip">${contacts.length}</span>
              </div>
              ${contacts.length ? contacts.map(merlinContactCard).join("") : `<p style="color: var(--muted); margin: 0">Esta empresa veio sem contato vinculado na amostra.</p>`}
            </section>
          </aside>
        </div>
      </div>
    `;
  };

  function bindMerlinControls() {
    const input = document.getElementById("companyFilter");
    if (input) {
      input.addEventListener("input", (event) => {
        companyFilter = event.target.value;
        selectedCompanyId = "";
        render();
        const nextInput = document.getElementById("companyFilter");
        if (nextInput) {
          nextInput.focus();
          nextInput.setSelectionRange(companyFilter.length, companyFilter.length);
        }
      });
    }

    document.querySelectorAll("[data-company-id]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedCompanyId = button.dataset.companyId;
        render();
      });
    });
  }

  const baseRender = render;
  render = function renderWithMerlin() {
    baseRender();
    bindMerlinControls();
  };

  async function loadMerlinSample() {
    try {
      const response = await fetch("/admin/crm/data/merlin-sample-500.b64", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      merlinData = normalizeMerlinPayload(await readMerlinPayload(response));
      selectedCompanyId =
        merlinData.companies.find((company) => company.contatos?.length)?.empresa_id_legado ||
        merlinData.companies[0]?.empresa_id_legado ||
        "";
    } catch (error) {
      merlinError = error.message || "Falha ao carregar amostra Merlin.";
    }
    render();
  }

  render();
  loadMerlinSample();
})();
