const BASE = "https://www.ovalorcapital.com.br";
const LOGO = `${BASE}/images/logo-ovc.png`;
const OG_DEFAULT = `${BASE}/assets/og-default.jpg`;
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

function instRailLeft(activeKey){
  const links = [
    {key:'quem-somos', href:'/quem-somos/', label:'Quem Somos', icon:'🏛️'},
    {key:'politica-editorial', href:'/politica-editorial/', label:'Política Editorial', icon:'📋'},
    {key:'contato', href:'/vc/contato/', label:'Contato', icon:'✉️'},
    {key:'colunistas', href:'/colunistas/', label:'Colunistas OVC', icon:'✍️'},
  ];
  const navItems = links.map(l => {
    const active = l.key === activeKey;
    return `<a href="${l.href}" style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:${active?'800':'600'};color:${active?'#1d4ed8':'#374151'};background:${active?'#eff6ff':'transparent'};border-left:3px solid ${active?'#1d4ed8':'transparent'};transition:background .15s,color .15s;margin-bottom:2px">${l.icon} ${l.label}</a>`;
  }).join('');
  return `
<aside class="rail-left" style="padding-top:8px">
  <div style="background:var(--bg-elevated,#fff);border-radius:10px;border:1px solid #e2e8f0;overflow:hidden;margin-bottom:18px">
    <div style="background:${NAVY};padding:12px 14px">
      <div style="font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.6)">ÁREA INSTITUCIONAL</div>
      <div style="font-size:14px;font-weight:900;color:#fff;margin-top:4px">O Valor Capital</div>
    </div>
    <div style="padding:10px 8px">${navItems}</div>
  </div>
  <div style="background:var(--bg-elevated,#fff);border-radius:10px;border:1px solid #e2e8f0;padding:14px">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:10px">Editorias</div>
    <div style="display:flex;flex-direction:column;gap:4px">
      <a href="/politica/" style="font-size:12px;color:#374151;text-decoration:none;padding:4px 0;border-bottom:1px solid #f1f5f9">→ Política</a>
      <a href="/economia/" style="font-size:12px;color:#374151;text-decoration:none;padding:4px 0;border-bottom:1px solid #f1f5f9">→ Economia</a>
      <a href="/brasil-on/" style="font-size:12px;color:#374151;text-decoration:none;padding:4px 0;border-bottom:1px solid #f1f5f9">→ Brasil On</a>
      <a href="/investimentos/" style="font-size:12px;color:#374151;text-decoration:none;padding:4px 0;border-bottom:1px solid #f1f5f9">→ Investimentos</a>
      <a href="/negocios/" style="font-size:12px;color:#374151;text-decoration:none;padding:4px 0">→ Negócios</a>
    </div>
  </div>
</aside>`;
}

function instRailRight(){
  return `
<aside class="rail-right" style="padding-top:8px">
  <div style="background:var(--bg-elevated,#fff);border-radius:10px;border:1px solid #e2e8f0;overflow:hidden;margin-bottom:18px">
    <div style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:12px 14px">
      <div style="font-size:11px;font-weight:800;color:#fbbf24;text-transform:uppercase;letter-spacing:.1em">Fale com a Redação</div>
    </div>
    <div style="padding:14px">
      <p style="font-size:12px;color:#374151;line-height:1.6;margin:0 0 12px">Tem uma pauta, denúncia ou sugestão editorial? Nossa equipe responde em até 48h úteis.</p>
      <a href="mailto:${EMAIL_DISPLAY}" style="display:block;background:#1d4ed8;color:#fff;font-size:12px;font-weight:700;padding:9px 14px;border-radius:6px;text-decoration:none;text-align:center">✉️ Enviar mensagem</a>
      <div style="font-size:10px;color:#94a3b8;text-align:center;margin-top:8px">${EMAIL_DISPLAY}</div>
    </div>
  </div>
  <div style="background:var(--bg-elevated,#fff);border-radius:10px;border:1px solid #e2e8f0;overflow:hidden;margin-bottom:18px">
    <div style="background:#0f172a;padding:12px 14px">
      <div style="font-size:11px;font-weight:800;color:#d4af37;text-transform:uppercase;letter-spacing:.1em">Newsletter OVC</div>
    </div>
    <div style="padding:14px">
      <p style="font-size:12px;color:#374151;line-height:1.6;margin:0 0 12px">Receba o resumo diário do que importa na economia e política brasileira.</p>
      <a href="/newsletter/" style="display:block;background:#d4af37;color:#111;font-size:12px;font-weight:800;padding:9px 14px;border-radius:6px;text-decoration:none;text-align:center">📩 Assinar grátis</a>
    </div>
  </div>
  <div style="background:var(--bg-elevated,#fff);border-radius:10px;border:1px solid #e2e8f0;padding:14px">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:10px">Seja Colunista</div>
    <p style="font-size:12px;color:#374151;line-height:1.6;margin:0 0 10px">Especialistas em economia, direito, política e mercado financeiro podem enviar artigos para análise.</p>
    <a href="/colunista/" style="font-size:12px;font-weight:700;color:#1d4ed8;text-decoration:none">Saiba mais →</a>
  </div>
</aside>`;
}

function buildQuemsomosContent(){
  return `
<article style="background:var(--bg-elevated,#fff);border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;margin-bottom:20px">
  <div style="background:linear-gradient(135deg,${NAVY} 0%,#1e293b 100%);padding:36px 32px;position:relative;overflow:hidden">
    <div style="position:absolute;right:-10px;top:-10px;font-size:80px;opacity:.07">🏛️</div>
    <div style="position:relative">
      <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(212,175,55,.2);border:1px solid rgba(212,175,55,.4);color:${GOLD};font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;padding:4px 14px;border-radius:3px;margin-bottom:16px">◆ INSTITUCIONAL</div>
      <h1 style="color:#fff;font-size:clamp(1.8rem,4vw,2.6rem);font-weight:900;margin:0 0 12px;line-height:1.1;letter-spacing:-.5px">Quem Somos —<br><span style="color:${GOLD}">O Valor Capital</span></h1>
      <p style="color:rgba(255,255,255,.7);font-size:.97rem;line-height:1.65;margin:0;max-width:560px">Portal independente de jornalismo econômico, político e financeiro fundado em 2026, com compromisso inabalável com a verdade e a democratização da informação.</p>
    </div>
  </div>
  <div style="padding:28px 32px">
    <div style="border-left:4px solid ${GOLD};padding-left:20px;margin-bottom:28px">
      <p style="font-size:1.15rem;font-weight:700;color:#111;line-height:1.45;margin:0 0 8px">"Informação de qualidade é direito, não privilégio."</p>
      <span style="color:#64748b;font-size:.85rem;font-weight:600">— Princípio fundador do O Valor Capital</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px">
      <div>
        <h2 style="font-size:.95rem;font-weight:800;color:#111;margin:0 0 10px;text-transform:uppercase;letter-spacing:.8px;display:flex;align-items:center;gap:8px"><span style="display:inline-block;width:3px;height:16px;background:${GOLD};border-radius:2px"></span>Nossa Missão</h2>
        <p style="color:#374151;line-height:1.75;font-size:.9rem;margin:0">O <strong>O Valor Capital</strong> nasceu com a missão de democratizar o acesso à informação econômica e política de qualidade no Brasil. Acreditamos que um cidadão bem informado faz escolhas melhores — para si, para sua família e para o país.</p>
      </div>
      <div>
        <h2 style="font-size:.95rem;font-weight:800;color:#111;margin:0 0 10px;text-transform:uppercase;letter-spacing:.8px;display:flex;align-items:center;gap:8px"><span style="display:inline-block;width:3px;height:16px;background:${GOLD};border-radius:2px"></span>Nossa Visão</h2>
        <p style="color:#374151;line-height:1.75;font-size:.9rem;margin:0">Ser o portal de referência em economia, política e mercado financeiro para o cidadão brasileiro, combinando o rigor do jornalismo tradicional com a agilidade e escala das melhores tecnologias editoriais disponíveis.</p>
      </div>
    </div>
    <h2 style="font-size:1.1rem;font-weight:900;color:#111;margin:0 0 16px;border-bottom:2px solid #e2e8f0;padding-bottom:10px">Corpo Editorial</h2>
    <div style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;padding:20px;display:flex;gap:20px;align-items:center;flex-wrap:wrap;margin-bottom:24px">
      <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,${GOLD} 0%,#b8860b 100%);display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:900;color:${NAVY};flex-shrink:0;box-shadow:0 4px 16px rgba(212,175,55,.35)">OVC</div>
      <div style="flex:1;min-width:180px">
        <div style="font-size:1.1rem;font-weight:900;color:#111;margin-bottom:4px">Redação OVC</div>
        <div style="color:${GOLD};font-size:.85rem;font-weight:700;margin-bottom:8px">Equipe Editorial — O Valor Capital</div>
        <p style="color:#374151;line-height:1.7;font-size:.87rem;margin:0 0 10px">Portal jornalístico independente fundado em 2026. Equipe editorial responsável pela curadoria, produção e governança de todo o conteúdo publicado.</p>
        <a href="mailto:${EMAIL_DISPLAY}" style="color:#1a56db;font-size:.85rem;font-weight:600;text-decoration:none">✉️ ${EMAIL_DISPLAY}</a>
      </div>
    </div>
    <h2 style="font-size:1.1rem;font-weight:900;color:#111;margin:0 0 16px;border-bottom:2px solid #e2e8f0;padding-bottom:10px">Nossos Pilares</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px">
      ${[
        ["🎯","Precisão","Verificação rigorosa de fatos em fontes primárias, documentos públicos e agências de credibilidade reconhecida."],
        ["🔓","Independência","Sem afiliações partidárias ou corporativas. Liberdade editorial total para cobrir os fatos como eles são."],
        ["🏆","Qualidade","Padrão editorial de excelência em cada publicação, com revisão humana antes da publicação."],
        ["⚖️","Equilíbrio","Cobertura plural que apresenta múltiplos ângulos e dá voz a diferentes perspectivas."],
      ].map(([icon,title,desc])=>`<div style="background:#f8fafc;border-radius:8px;padding:16px;border:1px solid #e2e8f0"><div style="font-size:1.4rem;margin-bottom:8px">${icon}</div><div style="font-size:.87rem;font-weight:800;color:#111;margin-bottom:6px">${title}</div><p style="color:#64748b;font-size:.8rem;line-height:1.6;margin:0">${desc}</p></div>`).join("")}
    </div>
    <div style="background:linear-gradient(135deg,${NAVY},#1e293b);border-radius:10px;padding:20px;text-align:center">
      <div style="font-size:1.1rem;font-weight:900;color:#fff;margin-bottom:8px">Canais de Contato</div>
      <p style="color:rgba(255,255,255,.65);font-size:.87rem;margin:0 0 14px">Redação, parceiros e imprensa</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <a href="mailto:${EMAIL_DISPLAY}" style="background:${GOLD};color:#111;font-size:12px;font-weight:800;padding:9px 20px;border-radius:6px;text-decoration:none">✉️ Redação</a>
        <a href="/politica-editorial/" style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);color:#fff;font-size:12px;font-weight:700;padding:9px 20px;border-radius:6px;text-decoration:none">Política Editorial →</a>
      </div>
    </div>
  </div>
</article>`;
}

function buildPoliticaContent(){
  const principles = [
    {n:"01", icon:"🎯", title:"Precisão e Verificação de Fatos",
     body:`Todo o conteúdo reproduzido ou produzido pelo O Valor Capital passa por processo rigoroso de triagem baseado em <strong>fontes oficiais</strong>, agências de notícias de credibilidade reconhecida (Reuters, AFP, AP, Agência Brasil) e documentos públicos verificáveis. Informações sem comprovação documental não são publicadas como fato.`},
    {n:"02", icon:"🔓", title:"Independência Editorial",
     body:`O Valor Capital não possui afiliações políticas, partidárias ou corporativas. A linha editorial é determinada exclusivamente pelo valor jornalístico dos fatos, sem influência de anunciantes, governos ou grupos de pressão. A autonomia editorial é condição inegociável para a credibilidade do portal.`},
    {n:"03", icon:"🏆", title:"Padrão de Produção Editorial",
     body:`Todo o conteúdo publicado é produzido com rigor editorial e supervisionado pela equipe de redação antes da publicação. O portal assume <strong>total responsabilidade editorial</strong> por todo o conteúdo final publicado, independentemente do método de produção utilizado.`},
    {n:"04", icon:"✏️", title:"Política de Correções e Retificações",
     body:`Erros factuais, imprecisões ou informações desatualizadas serão corrigidos de forma transparente, com nota de retificação visível ao leitor. Solicitações de correção são analisadas em até 48 horas úteis. Não há correção retroativa de opiniões ou análises, desde que claramente identificadas como tal.`},
    {n:"05", icon:"©️", title:"Direitos Autorais e Reprodução",
     body:`O conteúdo editorial do portal é protegido por direitos autorais. A reprodução parcial (até 50 palavras) é permitida com citação de fonte e link para o original. Reprodução integral requer autorização expressa da redação. Imagens de terceiros são utilizadas sob licenças Creative Commons, fair use jornalístico ou com autorização.`},
    {n:"06", icon:"📧", title:"Canal de Contato Editorial",
     body:`Para solicitações de pauta, retificações, parcerias editoriais ou qualquer questão relacionada ao conteúdo publicado, entre em contato exclusivamente por meio do canal oficial: <a href="mailto:${EMAIL_DISPLAY}" style="color:#1a56db">${EMAIL_DISPLAY}</a>. Nossa equipe responde em até 48 horas úteis.`},
  ];

  return `
<article style="background:var(--bg-elevated,#fff);border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;margin-bottom:20px">
  <div style="background:linear-gradient(135deg,${NAVY} 0%,#1e293b 100%);padding:36px 32px;position:relative;overflow:hidden">
    <div style="position:absolute;right:-10px;top:-10px;font-size:80px;opacity:.07">📋</div>
    <div style="position:relative">
      <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(212,175,55,.2);border:1px solid rgba(212,175,55,.4);color:${GOLD};font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;padding:4px 14px;border-radius:3px;margin-bottom:16px">◆ INSTITUCIONAL</div>
      <h1 style="color:#fff;font-size:clamp(1.8rem,4vw,2.6rem);font-weight:900;margin:0 0 12px;line-height:1.1;letter-spacing:-.5px">Princípios Editoriais —<br><span style="color:${GOLD}">O Valor Capital</span></h1>
      <p style="color:rgba(255,255,255,.7);font-size:.97rem;line-height:1.65;margin:0;max-width:560px">A carta de valores que norteia cada publicação: independência, rigor factual e responsabilidade editorial integral.</p>
    </div>
  </div>
  <div style="padding:28px 32px">
    <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;border-left:4px solid ${GOLD};margin-bottom:24px">
      <p style="font-size:1rem;font-weight:300;color:#374151;line-height:1.6;margin:0;font-style:italic">"A imparcialidade não é silêncio — é a coragem de apresentar todos os lados com a mesma seriedade e o mesmo rigor."</p>
      <div style="color:#64748b;font-size:.82rem;font-weight:600;margin-top:8px">— Política Editorial OVC</div>
    </div>
    <h2 style="font-size:1.1rem;font-weight:900;color:#111;margin:0 0 16px;border-bottom:2px solid #e2e8f0;padding-bottom:10px">Nossos 6 Princípios</h2>
    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px">
      ${principles.map(p=>`
      <div style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;overflow:hidden;display:flex;gap:0;align-items:stretch">
        <div style="background:linear-gradient(135deg,${NAVY} 0%,#1e293b 100%);padding:16px 14px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:72px;text-align:center;flex-shrink:0">
          <div style="font-size:1.3rem;margin-bottom:6px">${p.icon}</div>
          <div style="color:${GOLD};font-size:1rem;font-weight:900;line-height:1">${p.n}</div>
        </div>
        <div style="padding:16px 20px;flex:1">
          <h3 style="font-size:.93rem;font-weight:800;color:#111;margin:0 0 8px">${p.title}</h3>
          <p style="color:#374151;line-height:1.75;font-size:.87rem;margin:0">${p.body}</p>
        </div>
      </div>`).join("")}
    </div>
    <div style="background:linear-gradient(135deg,${NAVY},#1e293b);border-radius:10px;padding:20px;text-align:center">
      <div style="font-size:1rem;font-weight:900;color:#fff;margin-bottom:6px">Encontrou um erro?</div>
      <p style="color:rgba(255,255,255,.65);font-size:.87rem;margin:0 0 14px">Nossa equipe analisa pedidos de retificação em até <strong style="color:${GOLD}">48 horas úteis</strong>.</p>
      <a href="mailto:${EMAIL_DISPLAY}?subject=Retificação%20-%20O%20Valor%20Capital" style="background:${GOLD};color:#111;font-size:12px;font-weight:800;padding:9px 20px;border-radius:6px;text-decoration:none">Solicitar Retificação</a>
    </div>
  </div>
</article>`;
}

function buildPage(pageKey){
  const isQuemSomos = pageKey === "quem-somos";
  const title    = isQuemSomos ? "Quem Somos e Expediente | O Valor Capital"          : "Política Editorial | O Valor Capital";
  const metaT    = isQuemSomos ? "Quem Somos | O Valor Capital"                        : "Política Editorial | O Valor Capital";
  const desc     = isQuemSomos
    ? "Conheça o portal O Valor Capital: jornalismo independente de economia, política e mercado financeiro fundado em 2026."
    : "Conheça os princípios editoriais do portal O Valor Capital: verificação de fatos, política de correções e responsabilidade editorial integral.";
  const canonical = isQuemSomos ? `${BASE}/quem-somos/` : `${BASE}/politica-editorial/`;
  const bodyContent = isQuemSomos ? buildQuemsomosContent() : buildPoliticaContent();

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
</head>
<body class="ovc-inner-page" data-theme="light">
${buildHeader()}
<main class="page-main">
  <div class="main-grid" style="align-items:start">
    ${instRailLeft(pageKey)}
    <div style="grid-column:span 3;padding:20px 0">
      ${bodyContent}
    </div>
    ${instRailRight()}
  </div>
</main>
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
