const BASE = "https://www.ovalorcapital.com.br";
const LOGO = `${BASE}/images/logo-ovc.png`;
const OG_DEFAULT = `${BASE}/images/og-default.jpg`;
const GOLD = "#d4af37";
const NAVY = "#0f172a";

const EMAIL_DISPLAY = "redacao@ovalorcapital.com.br";

function esc(s){ return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

function buildHeader(){
  return `<div class="ovc-shell"><header class="header">
<div class="header-topbar">
<div class="ticker-wrapper"><div class="ticker-track" id="ticker-track">
<div class="ticker-item"><span class="ticker-label">dólar</span><span class="ticker-value" data-ticker="usd">—</span></div>
<div class="ticker-item"><span class="ticker-label">euro</span><span class="ticker-value" data-ticker="eur">—</span></div>
<div class="ticker-item"><span class="ticker-label">bitcoin</span><span class="ticker-value" data-ticker="btc">—</span></div>
<div class="ticker-item"><span class="ticker-label">ibov</span><span class="ticker-value" data-ticker="ibov">—</span></div>
<div class="ticker-item"><span class="ticker-label">s&amp;p 500</span><span class="ticker-value" data-ticker="sp500">—</span></div>
<div class="ticker-item"><span class="ticker-label">dólar</span><span class="ticker-value" data-ticker="usd">—</span></div>
<div class="ticker-item"><span class="ticker-label">euro</span><span class="ticker-value" data-ticker="eur">—</span></div>
</div></div>
<div class="impostometro"><div class="impostometro-value"><span>impostômetro</span><span id="impostometro">R$ 0,00</span></div></div>
</div>
<div class="header-identity">
<div class="logo-block"><a class="logo-link" href="/"><span style="font-size:20px;font-weight:900;letter-spacing:-.5px;color:#d4af37;font-family:system-ui,sans-serif">O VALOR CAPITAL</span></a></div>
<div class="header-actions">
<a class="btn-acesso" href="/admin/">Acesso</a>
</div>
</div>
<div class="header-menu-bar">
<nav class="supermenu">
<div class="supermenu-item"><a class="label" href="/brasil-on/">Brasil On</a><div class="submenu"><div class="submenu-title">Brasil On</div><a href="/brasil-on/seguranca-publica/">Segurança Pública</a><a href="/brasil-on/defesa-nacional/">Defesa Nacional</a><a href="/brasil-on/justica-e-investigacao/">Justiça &amp; Investigação</a><a href="/brasil-on/corrupcao-e-transparencia/">Corrupção &amp; Transparência</a><a href="/brasil-on/consumidor/">Consumidor</a><a href="/brasil-on/infraestrutura-nacional/">Infraestrutura Nacional</a><a href="/brasil-on/meio-ambiente/">Meio Ambiente</a><a href="/brasil-on/ciencia-e-inovacao/">Ciência &amp; Inovação</a><a href="/brasil-on/sociedade/">Sociedade</a><a href="/brasil-on/geral/">Geral</a></div></div>
<div class="supermenu-item"><a class="label" href="/politica/">Política</a><div class="submenu"><div class="submenu-title">Política</div><a href="/politica/executivo/">Executivo</a><a href="/politica/legislativo-congresso-ao-vivo/">Legislativo (Congresso ao vivo)</a><a href="/politica/judiciario/">Judiciário</a><a href="/politica/projetos-de-lei/">Projetos de Lei</a><a href="/politica/eleicoes/">Eleições</a><a href="/politica/agenda-regulatoria/">Agenda Regulatória</a><a href="/politica/bastidores-de-brasilia/">Bastidores de Brasília</a><a href="/politica/geral/">Geral</a></div></div>
<div class="supermenu-item"><a class="label" href="/economia/">Economia</a><div class="submenu"><div class="submenu-title">Economia</div><a href="/economia/politica-monetaria/">Política Monetária</a><a href="/economia/politica-fiscal/">Política Fiscal</a><a href="/economia/indicadores-economicos/">Indicadores Econômicos</a><a href="/economia/mercado-de-trabalho/">Mercado de Trabalho</a><a href="/economia/consumo-e-varejo/">Consumo &amp; Varejo</a><a href="/economia/commodities/">Commodities</a><a href="/economia/cambio-e-moedas/">Câmbio &amp; Moedas</a><a href="/economia/economia-internacional/">Economia Internacional</a><a href="/economia/minuto-fiscal/">Minuto Fiscal</a><a href="/economia/geral/">Geral</a></div></div>
<div class="supermenu-item"><a class="label" href="/investimentos/">Investimentos</a><div class="submenu"><div class="submenu-title">Investimentos</div><a href="/investimentos/renda-fixa/">Renda Fixa</a><a href="/investimentos/bolsa-e-acoes/">Bolsa &amp; Ações</a><a href="/investimentos/dividendos/">Dividendos</a><a href="/investimentos/fiis/">FIIs</a><a href="/investimentos/fundos/">Fundos</a><a href="/investimentos/previdencia/">Previdência</a><a href="/investimentos/investimentos-internacionais/">Investimentos Internacionais</a><a href="/investimentos/alternativos/">Alternativos</a><a href="/investimentos/criptomoedas/">Criptomoedas</a><a href="/investimentos/estrategias/">Estratégias</a><a href="/investimentos/educacao-do-investidor/">Educação do Investidor</a><a href="/investimentos/calendario-e-dividendos/">Calendário Econômico &amp; Dividendos</a><a href="/investimentos/geral/">Geral</a></div></div>
<div class="supermenu-item"><a class="label" href="/negocios/">Negócios</a><div class="submenu"><div class="submenu-title">Negócios</div><a href="/negocios/empreendedorismo/">Empreendedorismo</a><a href="/negocios/gestao-financeira/">Gestão Financeira</a><a href="/negocios/credito-empresarial/">Crédito Empresarial</a><a href="/negocios/tributacao-empresarial/">Tributação Empresarial</a><a href="/negocios/vendas-e-precificacao/">Vendas &amp; Precificação</a><a href="/negocios/contratos-e-societario/">Contratos &amp; Societário</a><a href="/negocios/lgpd-e-compliance/">LGPD &amp; Compliance</a><a href="/negocios/franquias/">Franquias</a><a href="/negocios/startups/">Startups</a><a href="/negocios/geral/">Geral</a></div></div>
<div class="supermenu-item"><a class="label" href="/tecnologia/">Tecnologia</a><div class="submenu"><div class="submenu-title">Tecnologia</div><a href="/tecnologia/inteligencia-artificial/">Inteligência Artificial</a><a href="/tecnologia/dados-e-analytics/">Dados &amp; Analytics</a><a href="/tecnologia/fintechs/">Fintechs</a><a href="/tecnologia/e-commerce/">E-commerce</a><a href="/tecnologia/telecom-e-5g/">Telecom &amp; 5G</a><a href="/tecnologia/ciberseguranca/">Cibersegurança</a><a href="/tecnologia/govtech/">GovTech</a><a href="/tecnologia/healthtech/">HealthTech</a><a href="/tecnologia/transformacao-digital/">Transformação Digital</a><a href="/tecnologia/startups-tech/">Startups Tech</a><a href="/tecnologia/geral/">Geral</a></div></div>
<div class="supermenu-item"><a class="label" href="/internacional/">Internacional</a><div class="submenu"><div class="submenu-title">Internacional</div><a href="/internacional/estados-unidos/">Estados Unidos</a><a href="/internacional/china/">China</a><a href="/internacional/europa/">Europa</a><a href="/internacional/america-latina/">América Latina</a><a href="/internacional/oriente-medio/">Oriente Médio</a><a href="/internacional/russia-e-leste-europeu/">Rússia &amp; Leste Europeu</a><a href="/internacional/geopolitica/">Geopolítica</a><a href="/internacional/organismos-internacionais/">Organismos Internacionais</a><a href="/internacional/comercio-global/">Comércio Global</a><a href="/internacional/geral/">Geral</a></div></div>
<div class="supermenu-item"><a class="label" href="/saude/">Saúde</a><div class="submenu"><div class="submenu-title">Saúde</div><a href="/saude/saude-preventiva/">Saúde Preventiva</a><a href="/saude/saude-mental/">Saúde Mental</a><a href="/saude/saude-publica/">Saúde Pública</a><a href="/saude/planos-de-saude/">Planos de Saúde</a><a href="/saude/saude-digital/">Saúde Digital</a><a href="/saude/custos-e-indicadores/">Custos &amp; Indicadores</a><a href="/saude/longevidade/">Longevidade</a><a href="/saude/geral/">Geral</a></div></div>
<div class="supermenu-item"><a class="label" href="/tributos/">Tributos</a><div class="submenu"><div class="submenu-title">Tributos</div><a href="/tributos/irpf/">IRPF</a><a href="/tributos/irpj-e-empresas/">IRPJ &amp; Empresas</a><a href="/tributos/investimentos/">Investimentos</a><a href="/tributos/mei/">MEI</a><a href="/tributos/obrigacoes-fiscais/">Obrigações Fiscais</a><a href="/tributos/planejamento-tributario/">Planejamento Tributário</a><a href="/tributos/reforma-tributaria/">Reforma Tributária</a><a href="/tributos/simuladores/">Simuladores</a><a href="/tributos/geral/">Geral</a></div></div>
<div class="supermenu-item"><a class="label" href="/carreira/">Carreira</a><div class="submenu"><div class="submenu-title">Carreira</div><a href="/carreira/vagas-de-emprego/">Vagas de Emprego</a><a href="/carreira/concursos-publicos/">Concursos Públicos</a><a href="/carreira/educacao-e-cursos/">Educação &amp; Cursos</a><a href="/carreira/mercado-de-trabalho/">Mercado de Trabalho</a><a href="/carreira/clt/">CLT</a><a href="/carreira/pj/">PJ</a><a href="/carreira/trabalho-remoto/">Trabalho Remoto</a><a href="/carreira/renda-extra/">Renda Extra</a><a href="/carreira/carreira-internacional/">Carreira Internacional</a><a href="/carreira/geral/">Geral</a></div></div>
<div class="supermenu-item"><a class="label" href="/imoveis/">Imóveis</a><div class="submenu"><div class="submenu-title">Imóveis</div><a href="/imoveis/compra-e-venda/">Compra &amp; Venda</a><a href="/imoveis/aluguel/">Aluguel</a><a href="/imoveis/financiamento/">Financiamento</a><a href="/imoveis/mercado-imobiliario/">Mercado Imobiliário</a><a href="/imoveis/valorizacao-de-mercado/">Valorização de Mercado</a><a href="/imoveis/leiloes/">Leilões</a><a href="/imoveis/construcao-e-reforma/">Construção &amp; Reforma</a><a href="/imoveis/fiis/">FIIs</a><a href="/imoveis/geral/">Geral</a></div></div>
<div class="supermenu-item"><a class="label" href="/seguros/">Seguros</a><div class="submenu"><div class="submenu-title">Seguros</div><a href="/seguros/saude-e-odonto/">Saúde &amp; Odonto</a><a href="/seguros/vida/">Vida</a><a href="/seguros/auto/">Auto</a><a href="/seguros/residencial/">Residencial</a><a href="/seguros/empresarial/">Empresarial</a><a href="/seguros/responsabilidade-civil/">Responsabilidade Civil</a><a href="/seguros/viagem/">Viagem</a><a href="/seguros/indicadores-do-setor/">Indicadores do Setor</a><a href="/seguros/geral/">Geral</a></div></div>
<div class="supermenu-item"><a class="label" href="/industria/">Indústria</a><div class="submenu"><div class="submenu-title">Indústria</div><a href="/industria/energia/">Energia</a><a href="/industria/infraestrutura/">Infraestrutura</a><a href="/industria/agroindustria/">Agroindústria</a><a href="/industria/mineracao/">Mineração</a><a href="/industria/siderurgia/">Siderurgia</a><a href="/industria/quimica/">Química</a><a href="/industria/automotivo/">Automotivo</a><a href="/industria/logistica/">Logística</a><a href="/industria/portos/">Portos</a><a href="/industria/ferrovias/">Ferrovias</a><a href="/industria/industria-4-0/">Indústria 4.0</a><a href="/industria/geral/">Geral</a></div></div>
<div class="supermenu-item"><a class="label" href="/familia/">Família</a><div class="submenu"><div class="submenu-title">Família</div><a href="/familia/orcamento-familiar/">Orçamento Familiar</a><a href="/familia/educacao-dos-filhos/">Educação dos Filhos</a><a href="/familia/habitacao/">Habitação</a><a href="/familia/seguros-familiares/">Seguros Familiares</a><a href="/familia/sucessao-e-patrimonio/">Sucessão &amp; Patrimônio</a><a href="/familia/seguranca-familiar/">Segurança Familiar</a><a href="/familia/lazer/">Lazer</a><a href="/familia/geral/">Geral</a></div></div>
<div class="supermenu-item"><a class="label" href="/esportes/">Esportes</a><div class="submenu"><div class="submenu-title">Esportes</div><a href="/esportes/futebol/">Futebol</a><a href="/esportes/basquete/">Basquete</a><a href="/esportes/nfl/">NFL</a><a href="/esportes/mlb/">MLB</a><a href="/esportes/mma/">MMA</a><a href="/esportes/automobilismo/">Automobilismo</a><a href="/esportes/tenis/">Tênis</a><a href="/esportes/esports/">eSports</a><a href="/esportes/geral/">Geral</a></div></div>
<div class="supermenu-item"><a class="label" href="/cultura/">Cultura</a><div class="submenu"><div class="submenu-title">Cultura</div><a href="/cultura/cinema/">Cinema</a><a href="/cultura/musica/">Música</a><a href="/cultura/literatura/">Literatura</a><a href="/cultura/arte-e-exposicoes/">Arte &amp; Exposições</a><a href="/cultura/teatro-e-danca/">Teatro &amp; Dança</a><a href="/cultura/gastronomia/">Gastronomia</a><a href="/cultura/streaming-e-tv/">Streaming &amp; TV</a><a href="/cultura/geral/">Geral</a></div></div>
<div class="supermenu-item"><a class="label" href="/religiao/">Religião</a><div class="submenu"><div class="submenu-title">Religião</div><a href="/religiao/fe-e-sociedade/">Fé &amp; Sociedade</a><a href="/religiao/missoes/">Missões</a><a href="/religiao/familia-e-valores/">Família &amp; Valores</a><a href="/religiao/datas-e-celebracoes/">Datas &amp; Celebrações</a><a href="/religiao/espiritualidade/">Espiritualidade</a><a href="/religiao/comunidades-e-eventos/">Comunidades &amp; Eventos</a><a href="/religiao/geral/">Geral</a></div></div>
<div class="supermenu-item"><a class="label" href="/colunistas/">Colunistas</a><div class="submenu"><div class="submenu-title">Opinião OVC</div><a href="/colunistas/">Todos os colunistas</a><a href="/colunistas/">Artigos e colunas</a></div></div>
<div class="supermenu-item"><a class="label" href="/vc/">VC</a></div>
</nav>
</div>
</header>`;
}

function buildQuemsomosPage(){
  return `
<!-- HERO -->
<section style="background:linear-gradient(135deg,${NAVY} 0%,#0a0f1e 50%,#111827 100%);padding:96px 24px 80px;text-align:center;position:relative;overflow:hidden">
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(212,175,55,.12) 0%,transparent 65%);pointer-events:none"></div>
  <div style="position:relative;max-width:820px;margin:0 auto">
    <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(212,175,55,.15);border:1px solid rgba(212,175,55,.35);color:${GOLD};font-size:11px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;padding:5px 18px;border-radius:3px;margin-bottom:28px">
      ◆ INSTITUCIONAL
    </div>
    <h1 style="color:#fff;font-size:clamp(2.4rem,6vw,4rem);font-weight:900;line-height:1.05;margin:0 0 20px;letter-spacing:-1.5px">Quem Somos —<br><span style="color:${GOLD}">O Valor Capital</span></h1>
    <p style="color:rgba(255,255,255,.75);font-size:1.15rem;line-height:1.7;max-width:640px;margin:0 auto 32px">Portal independente de jornalismo econômico, político e financeiro fundado em 2026, com compromisso inabalável com a verdade e a democratização da informação.</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <a href="/politica-editorial/" style="background:${GOLD};color:#111;font-size:14px;font-weight:800;padding:12px 28px;border-radius:6px;text-decoration:none;letter-spacing:.3px">Princípios Editoriais →</a>
      <a href="/colunistas/" style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.25);color:#fff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:6px;text-decoration:none">Nossos Colunistas</a>
    </div>
  </div>
</section>

<!-- MISSÃO -->
<section style="background:#fff;padding:72px 24px">
  <div style="max-width:900px;margin:0 auto">
    <div style="border-left:5px solid ${GOLD};padding-left:32px;margin-bottom:56px">
      <p style="font-size:1.6rem;font-weight:700;color:#111;line-height:1.45;margin:0 0 12px">"Informação de qualidade é direito, não privilégio."</p>
      <span style="color:#64748b;font-size:.9rem;font-weight:600">— Princípio fundador do O Valor Capital</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:48px">
      <div>
        <h2 style="font-size:1.1rem;font-weight:800;color:#111;margin:0 0 14px;text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:10px"><span style="display:inline-block;width:4px;height:20px;background:${GOLD};border-radius:2px"></span>Nossa Missão</h2>
        <p style="color:#374151;line-height:1.8;font-size:.97rem;margin:0">O <strong>O Valor Capital</strong> nasceu com a missão de democratizar o acesso à informação econômica e política de qualidade no Brasil. Acreditamos que um cidadão bem informado faz escolhas melhores — para si, para sua família e para o país.</p>
      </div>
      <div>
        <h2 style="font-size:1.1rem;font-weight:800;color:#111;margin:0 0 14px;text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:10px"><span style="display:inline-block;width:4px;height:20px;background:${GOLD};border-radius:2px"></span>Nossa Visão</h2>
        <p style="color:#374151;line-height:1.8;font-size:.97rem;margin:0">Ser o portal de referência em economia, política e mercado financeiro para o cidadão brasileiro, combinando o rigor do jornalismo tradicional com a agilidade e escala das melhores tecnologias editoriais disponíveis.</p>
      </div>
    </div>
  </div>
</section>

<!-- EXPEDIENTE -->
<section style="background:#f8fafc;padding:72px 24px;border-top:1px solid #e2e8f0">
  <div style="max-width:900px;margin:0 auto">
    <div style="text-align:center;margin-bottom:48px">
      <span style="font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${GOLD}">EXPEDIENTE</span>
      <h2 style="font-size:2rem;font-weight:900;color:#111;margin:8px 0 0;letter-spacing:-.5px">Corpo Editorial</h2>
    </div>
    <div style="background:#fff;border-radius:16px;box-shadow:0 4px 40px rgba(0,0,0,.09);overflow:hidden;display:flex;flex-wrap:wrap">
      <div style="background:linear-gradient(135deg,${NAVY} 0%,#1e3a5f 100%);padding:48px 36px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:220px;flex:0 0 220px">
        <div style="width:100px;height:100px;border-radius:50%;background:linear-gradient(135deg,${GOLD} 0%,#b8860b 100%);display:flex;align-items:center;justify-content:center;font-size:2.2rem;font-weight:900;color:${NAVY};margin-bottom:16px;box-shadow:0 4px 20px rgba(212,175,55,.4)">OVC</div>
        <div style="text-align:center">
          <div style="color:rgba(255,255,255,.5);font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px">Portal</div>
          <div style="color:${GOLD};font-size:12px;font-weight:800;letter-spacing:.5px">Direção Editorial</div>
        </div>
      </div>
      <div style="padding:40px 40px 40px 36px;flex:1;min-width:260px">
        <h3 style="font-size:1.8rem;font-weight:900;color:#111;margin:0 0 6px;letter-spacing:-.5px">Redação OVC</h3>
        <p style="color:${GOLD};font-size:.95rem;font-weight:700;margin:0 0 20px">Equipe Editorial — O Valor Capital</p>
        <p style="color:#374151;line-height:1.8;font-size:.95rem;margin:0 0 20px">O <strong>O Valor Capital</strong> é um portal jornalístico independente fundado em 2026. Nossa equipe editorial é responsável pela curadoria, produção e governança de todo o conteúdo publicado, com compromisso integral com a qualidade informativa e os princípios do jornalismo ético.</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px">
          <span style="background:#f1f5f9;color:#374151;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px">#Economia</span>
          <span style="background:#f1f5f9;color:#374151;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px">#Política</span>
          <span style="background:#f1f5f9;color:#374151;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px">#Mercado Financeiro</span>
          <span style="background:#f1f5f9;color:#374151;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px">#Jornalismo Digital</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="${GOLD}" stroke-width="2"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
          <a href="mailto:${EMAIL_DISPLAY}" style="color:#1a56db;font-size:.9rem;font-weight:600;text-decoration:none">${EMAIL_DISPLAY}</a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- VALORES -->
<section style="background:#fff;padding:72px 24px;border-top:1px solid #e2e8f0">
  <div style="max-width:960px;margin:0 auto">
    <div style="text-align:center;margin-bottom:48px">
      <span style="font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${GOLD}">NOSSOS PILARES</span>
      <h2 style="font-size:2rem;font-weight:900;color:#111;margin:8px 0 0;letter-spacing:-.5px">O que nos guia</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:24px">
      ${[
        ["🎯","Precisão","Verificação rigorosa de fatos em fontes primárias, documentos públicos e agências de credibilidade reconhecida."],
        ["🔓","Independência","Sem afiliações partidárias ou corporativas. Liberdade editorial total para cobrir os fatos como eles são."],
        ["🏆","Qualidade","Padrão editorial de excelência em cada publicação, com revisão humana de todo o conteúdo antes da publicação."],
        ["⚖️","Equilíbrio","Cobertura plural que apresenta múltiplos ângulos, dando voz a diferentes perspectivas e setores da sociedade."],
      ].map(([icon,title,desc])=>`
      <div style="background:#f8fafc;border-radius:12px;padding:28px 24px;border:1px solid #e2e8f0;transition:transform .2s">
        <div style="font-size:2rem;margin-bottom:14px">${icon}</div>
        <h3 style="font-size:1rem;font-weight:800;color:#111;margin:0 0 10px">${title}</h3>
        <p style="color:#64748b;font-size:.87rem;line-height:1.65;margin:0">${desc}</p>
      </div>`).join("")}
    </div>
  </div>
</section>

<!-- CANAIS DE CONTATO -->
<section style="background:linear-gradient(135deg,${NAVY} 0%,#0a0f1e 100%);padding:72px 24px">
  <div style="max-width:900px;margin:0 auto">
    <div style="text-align:center;margin-bottom:48px">
      <span style="font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${GOLD}">FALE CONOSCO</span>
      <h2 style="font-size:2rem;font-weight:900;color:#fff;margin:8px 0 12px;letter-spacing:-.5px">Canais de Atendimento</h2>
      <p style="color:rgba(255,255,255,.6);font-size:.97rem;margin:0">Nossa equipe editorial está disponível para atender imprensa, leitores e parceiros.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px">
      ${[
        ["📧","E-mail de Contato Geral",EMAIL_DISPLAY,`mailto:${EMAIL_DISPLAY}`],
        ["📝","Redação e Pauta",EMAIL_DISPLAY,`mailto:${EMAIL_DISPLAY}`],
        ["🔔","Ouvidoria e Retificações",EMAIL_DISPLAY,`mailto:${EMAIL_DISPLAY}`],
      ].map(([icon,label,val,href])=>`
      <div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:24px">
        <div style="font-size:1.5rem;margin-bottom:10px">${icon}</div>
        <div style="color:rgba(255,255,255,.55);font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">${label}</div>
        <a href="${href}" style="color:${GOLD};font-size:.93rem;font-weight:700;text-decoration:none">${val}</a>
      </div>`).join("")}
    </div>
  </div>
</section>`;
}

function buildPoliticaPage(){
  const principles = [
    {
      n:"01", title:"Precisão e Verificação de Fatos",
      icon:"🎯",
      body:`Todo o conteúdo reproduzido ou produzido pelo portal O Valor Capital passa por processo rigoroso de triagem baseado em <strong>fontes oficiais</strong>, agências de notícias de credibilidade reconhecida (Reuters, AFP, AP, Agência Brasil) e documentos públicos verificáveis. Informações sem comprovação documental não são publicadas como fato.`
    },
    {
      n:"02", title:"Independência Editorial",
      icon:"🔓",
      body:`O Valor Capital não possui afiliações políticas, partidárias ou corporativas. A linha editorial é determinada exclusivamente pelo valor jornalístico dos fatos, sem influência de anunciantes, governos ou grupos de pressão. A autonomia editorial é condição inegociável para a credibilidade do portal.`
    },
    {
      n:"03", title:"Padrão de Produção Editorial",
      icon:"🏆",
      body:`Todo o conteúdo publicado é produzido com rigor editorial e supervisionado pela equipe de redação antes da publicação. O portal assume <strong>total responsabilidade editorial</strong> por todo o conteúdo final publicado, independentemente do método de produção utilizado.`
    },
    {
      n:"04", title:"Política de Correções e Retificações",
      icon:"✏️",
      body:`Erros factuais, imprecisões ou informações desatualizadas serão corrigidos de forma transparente, com nota de retificação visível ao leitor. Solicitações de correção são analisadas em até 48 horas úteis. Não há correção retroativa de opiniões ou análises, desde que claramente identificadas como tal.`
    },
    {
      n:"05", title:"Direitos Autorais e Reprodução",
      icon:"©️",
      body:`O conteúdo editorial do portal é protegido por direitos autorais. A reprodução parcial (até 50 palavras) é permitida com citação de fonte e link para o original. Reprodução integral requer autorização expressa da redação. Imagens de terceiros são utilizadas sob licenças Creative Commons, fair use jornalístico ou com autorização.`
    },
    {
      n:"06", title:"Canal de Contato Editorial",
      icon:"📧",
      body:`Para solicitações de pauta, retificações, parcerias editoriais ou qualquer questão relacionada ao conteúdo publicado, entre em contato exclusivamente por meio do canal oficial: <a href="mailto:${EMAIL_DISPLAY}" style="color:#1a56db">${EMAIL_DISPLAY}</a>. Nossa equipe responde em até 48 horas úteis.`
    },
  ];

  const principlesHtml = principles.map(p=>`
  <div style="background:#fff;border-radius:14px;box-shadow:0 2px 20px rgba(0,0,0,.06);overflow:hidden;display:flex;flex-wrap:wrap">
    <div style="background:linear-gradient(135deg,${NAVY} 0%,#1e293b 100%);padding:32px 28px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:100px;flex:0 0 100px;text-align:center">
      <div style="font-size:1.8rem;margin-bottom:10px">${p.icon}</div>
      <div style="color:${GOLD};font-size:1.4rem;font-weight:900;line-height:1">${p.n}</div>
    </div>
    <div style="padding:28px 32px;flex:1;min-width:240px">
      <h3 style="font-size:1.1rem;font-weight:800;color:#111;margin:0 0 12px">${p.title}</h3>
      <p style="color:#374151;line-height:1.8;font-size:.93rem;margin:0">${p.body}</p>
    </div>
  </div>`).join("\n");

  return `
<!-- HERO -->
<section style="background:linear-gradient(135deg,${NAVY} 0%,#0a0f1e 50%,#111827 100%);padding:96px 24px 80px;text-align:center;position:relative;overflow:hidden">
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(212,175,55,.12) 0%,transparent 65%);pointer-events:none"></div>
  <div style="position:relative;max-width:820px;margin:0 auto">
    <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(212,175,55,.15);border:1px solid rgba(212,175,55,.35);color:${GOLD};font-size:11px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;padding:5px 18px;border-radius:3px;margin-bottom:28px">
      ◆ INSTITUCIONAL
    </div>
    <h1 style="color:#fff;font-size:clamp(2.2rem,5vw,3.6rem);font-weight:900;line-height:1.07;margin:0 0 20px;letter-spacing:-1px">Princípios Editoriais —<br><span style="color:${GOLD}">O Valor Capital</span></h1>
    <p style="color:rgba(255,255,255,.75);font-size:1.1rem;line-height:1.7;max-width:600px;margin:0 auto 32px">A carta de valores que norteia cada publicação do portal: independência, rigor factual e responsabilidade editorial integral.</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <a href="/quem-somos/" style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.25);color:#fff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:6px;text-decoration:none">Quem Somos →</a>
      <a href="mailto:${EMAIL_DISPLAY}" style="background:${GOLD};color:#111;font-size:14px;font-weight:800;padding:12px 28px;border-radius:6px;text-decoration:none;letter-spacing:.3px">Enviar Retificação</a>
    </div>
  </div>
</section>

<!-- INTRO QUOTE -->
<section style="background:#fff;padding:56px 24px;text-align:center;border-bottom:1px solid #e2e8f0">
  <div style="max-width:700px;margin:0 auto">
    <p style="font-size:1.4rem;font-weight:300;color:#374151;line-height:1.6;margin:0;font-style:italic">"A imparcialidade não é silêncio — é a coragem de apresentar todos os lados com a mesma seriedade e o mesmo rigor."</p>
    <div style="display:inline-flex;align-items:center;gap:8px;margin-top:16px">
      <div style="width:32px;height:2px;background:${GOLD}"></div>
      <span style="color:#64748b;font-size:.85rem;font-weight:600">Política Editorial — O Valor Capital</span>
      <div style="width:32px;height:2px;background:${GOLD}"></div>
    </div>
  </div>
</section>

<!-- PRINCIPLES -->
<section style="background:#f8fafc;padding:64px 24px">
  <div style="max-width:900px;margin:0 auto">
    <div style="text-align:center;margin-bottom:48px">
      <span style="font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${GOLD}">DIRETRIZES</span>
      <h2 style="font-size:2rem;font-weight:900;color:#111;margin:8px 0 0;letter-spacing:-.5px">Nossos 6 Princípios</h2>
    </div>
    <div style="display:flex;flex-direction:column;gap:20px">
      ${principlesHtml}
    </div>
  </div>
</section>

<!-- CORRECTION CTA -->
<section style="background:linear-gradient(135deg,${NAVY} 0%,#0a0f1e 100%);padding:64px 24px;text-align:center">
  <div style="max-width:600px;margin:0 auto">
    <div style="font-size:2.5rem;margin-bottom:16px">✉️</div>
    <h2 style="color:#fff;font-size:1.8rem;font-weight:900;margin:0 0 12px;letter-spacing:-.5px">Encontrou um erro?</h2>
    <p style="color:rgba(255,255,255,.7);font-size:1rem;line-height:1.7;margin:0 0 28px">Nossa equipe analisa pedidos de retificação em até <strong style="color:${GOLD}">48 horas úteis</strong>. Envie o link do artigo, o trecho incorreto e a correção sugerida.</p>
    <a href="mailto:${EMAIL_DISPLAY}?subject=Retificação%20-%20O%20Valor%20Capital" style="display:inline-block;background:${GOLD};color:#111;font-size:15px;font-weight:800;padding:14px 36px;border-radius:8px;text-decoration:none;letter-spacing:.3px">Solicitar Retificação</a>
    <div style="margin-top:16px;color:rgba(255,255,255,.4);font-size:.85rem">${EMAIL_DISPLAY}</div>
  </div>
</section>`;
}

function buildPage(pageKey){
  const isQuemSomos = pageKey === "quem-somos";
  const title    = isQuemSomos ? "Quem Somos e Expediente | O Valor Capital"          : "Política Editorial | O Valor Capital";
  const metaT    = isQuemSomos ? "Quem Somos | O Valor Capital"                        : "Política Editorial | O Valor Capital";
  const desc     = isQuemSomos
    ? "Conheça o portal O Valor Capital: jornalismo independente de economia, política e mercado financeiro."
    : "Conheça os princípios editoriais do portal O Valor Capital: verificação de fatos, política de correções e responsabilidade editorial integral.";
  const canonical = isQuemSomos ? `${BASE}/quem-somos/` : `${BASE}/politica-editorial/`;
  const bodyContent = isQuemSomos ? buildQuemsomosPage() : buildPoliticaPage();

  const jsonLd = JSON.stringify({
    "@context":"https://schema.org",
    "@type": isQuemSomos ? "AboutPage" : "WebPage",
    "name": title,
    "description": desc,
    "url": canonical,
    "publisher":{"@type":"Organization","name":"O Valor Capital","logo":{"@type":"ImageObject","url":LOGO}},
    "inLanguage":"pt-BR"
  });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(metaT)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="O Valor Capital">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${OG_DEFAULT}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="pt_BR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@ovalorcapital">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${OG_DEFAULT}">
<script type="application/ld+json">${jsonLd}</script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3652391568977586" crossorigin="anonymous"></script>
<link rel="stylesheet" href="/css/home.css">
<link rel="stylesheet" href="/css/site.css">
<style>
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0}
@media(max-width:640px){
  [data-col2]{grid-template-columns:1fr!important}
  [data-flex-row]{flex-direction:column!important}
}
</style>
</head>
<body class="ovc-inner-page" data-theme="light">
${buildHeader()}
<div style="min-height:80vh">
${bodyContent}
</div>
</div>
<script src="/js/site.js" defer></script>
<script src="/js/newsletter-bar.js" defer></script>
</body>
</html>`;
}

export default async function handler(req, res){
  const url = req.query.page || req.url || "";
  const pageKey = url.includes("politica-editorial") ? "politica-editorial" : "quem-somos";
  res.setHeader("Content-Type","text/html; charset=utf-8");
  res.setHeader("Cache-Control","public, s-maxage=86400, stale-while-revalidate=3600");
  return res.status(200).send(buildPage(pageKey));
}
