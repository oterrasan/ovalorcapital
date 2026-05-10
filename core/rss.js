import Parser from "rss-parser";
import { createClient } from "@supabase/supabase-js";

const parser = new Parser({ timeout: 8000, headers: { "User-Agent": "Mozilla/5.0" } });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Google News RSS base — sempre retorna notícias de hoje
const GN = (q, lang="pt-BR", gl="BR", ceid="BR:pt-BR") =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=${lang}&gl=${gl}&ceid=${ceid}`;

const GN_EN = (q) => GN(q, "en", "US", "US:en");

const FEEDS_POR_GRUPO = {
  politica: [
    { url: "https://agenciabrasil.ebc.com.br/politica/feed.xml",      name: "Agência Brasil Política" },
    { url: "https://www.metropoles.com/feed",                          name: "Metrópoles" },
    { url: GN("politica governo lula congresso brasil"),               name: "GN Política Brasil" },
    { url: GN("senado camara votacao aprovacao lei"),                  name: "GN Congresso" },
    { url: GN("stf supremo tribunal federal decisao"),                 name: "GN STF" },
    { url: GN("eleicoes 2026 candidatos pesquisa eleitoral"),          name: "GN Eleições 2026" },
    { url: GN("ministerio governo federal anuncia programa"),          name: "GN Governo Federal" },
    { url: GN("lula bolsonaro oposicao politica brasileira"),          name: "GN Político" },
    { url: GN("partidos politicos filiacao candidatura"),              name: "GN Partidos" },
    { url: GN("governadores prefeitos politica estadual municipal"),   name: "GN Política Local" },
    { url: GN("corrupcao desvio denuncia operacao policia federal"),   name: "GN Anticorrupção" },
    { url: GN("reforma administrativa tributaria proposta"),           name: "GN Reformas" },
    { url: GN_EN("brazil politics government lula"),                   name: "GN Brazil Politics EN" },
    { url: GN_EN("brazil congress senate election 2026"),              name: "GN Brazil Election EN" },
    { url: "https://apublica.org/feed/",                               name: "Agência Pública" },
    { url: GN("autonomia banco central politica monetaria brasil"),    name: "GN BCB Política" },
    { url: GN("orçamento federal PPA LOA LDO aprovacao"),              name: "GN Orçamento" },
    { url: GN("relacoes exteriores diplomacia itamaraty brasil"),      name: "GN Diplomacia" },
  ],
  economia: [
    { url: "https://www.valor.com.br/rss",                             name: "Valor Econômico" },
    { url: "https://www.infomoney.com.br/feed/",                       name: "InfoMoney" },
    { url: "https://www.moneytimes.com.br/feed/",                      name: "Money Times" },
    { url: GN("economia brasil pib inflacao juros crescimento"),       name: "GN Economia Brasil" },
    { url: GN("taxa selic banco central copom decisao"),               name: "GN Selic COPOM" },
    { url: GN("ipca inflacao precos alta queda"),                      name: "GN Inflação" },
    { url: GN("pib crescimento economia trimestre resultado"),         name: "GN PIB" },
    { url: GN("cambio dolar real moeda apreciacao depreciacao"),       name: "GN Câmbio" },
    { url: GN("desemprego emprego caged mercado trabalho formal"),     name: "GN Emprego" },
    { url: GN("exportacao importacao comercio exterior balanca"),      name: "GN Comércio Ext." },
    { url: GN("superavit deficit fiscal resultado primario governo"),  name: "GN Fiscal" },
    { url: GN("industria producao pim ibge resultado"),                name: "GN Produção Industrial" },
    { url: GN("varejo vendas pmc servicos pms ibge"),                  name: "GN Varejo" },
    { url: GN_EN("brazil economy gdp inflation interest rate"),        name: "GN Brazil Economy EN" },
    { url: GN_EN("emerging markets latin america economy"),            name: "GN EM Economy EN" },
    { url: "https://br.investing.com/rss/news.rss",                   name: "Investing.com BR" },
    { url: GN("agenda economica focus relatorio banco central"),       name: "GN Focus BCB" },
    { url: GN("credito financiamento emprestimo banco pessoa fisica"), name: "GN Crédito" },
    { url: GN("receita federal arrecadacao imposto record"),           name: "GN Receita Federal" },
  ],
  negocios_mercados: [
    { url: "https://exame.com/feed/",                                  name: "Exame" },
    { url: "https://www.sunoresearch.com.br/feed/",                    name: "Suno Research" },
    { url: GN("empresas negocios fusao aquisicao brasil"),             name: "GN Negócios" },
    { url: GN("bolsa ibovespa acoes alta baixa fechamento"),           name: "GN Bolsa" },
    { url: GN("resultados lucro receita empresa trimestre"),           name: "GN Resultados Empresas" },
    { url: GN("petrobras vale itau bradesco magazineluiza"),           name: "GN Blue Chips" },
    { url: GN("startup unicornio valuation rodada aporte"),            name: "GN Startups Brasil" },
    { url: GN("ipo oferta publica acoes listagem b3"),                 name: "GN IPO B3" },
    { url: GN("juros bonds credito corporativo debentures"),           name: "GN Crédito Corp." },
    { url: GN("commodities agronegocio soja milho minerio"),           name: "GN Commodities" },
    { url: GN("criptomoeda bitcoin ethereum blockchain web3"),         name: "GN Cripto" },
    { url: GN_EN("mergers acquisitions m&a deal billion"),            name: "GN M&A EN" },
    { url: GN_EN("stock market wall street nasdaq s&p500"),            name: "GN Wall Street EN" },
    { url: GN_EN("fed federal reserve interest rate economy"),        name: "GN Fed EN" },
    { url: "https://feeds.bbci.co.uk/news/business/rss.xml",          name: "BBC Business" },
    { url: "https://www.theguardian.com/business/rss",                 name: "Guardian Business" },
    { url: GN("gestao lideranca ceo diretor executivo empresa"),       name: "GN Liderança" },
    { url: GN("ecommerce marketplace varejo digital amazon mercadolivre"), name: "GN E-commerce" },
  ],
  seguros_investimentos: [
    { url: "https://www.seudinheiro.com/feed/",                        name: "Seu Dinheiro" },
    { url: GN("investimentos renda fixa acoes fundos tesouro"),        name: "GN Investimentos" },
    { url: GN("seguro vida saude auto patrimonial corretora"),         name: "GN Seguros" },
    { url: GN("previdencia privada pgbl vgbl aposentadoria"),          name: "GN Previdência" },
    { url: GN("fiis fundos imobiliarios dividendos rendimento"),       name: "GN FIIs" },
    { url: GN("tesouro direto lci lca cdb rentabilidade"),             name: "GN Renda Fixa" },
    { url: GN("acoes small caps midcaps analise recomendacao"),        name: "GN Ações" },
    { url: GN("susep ans regulacao seguro saude plano"),               name: "GN SUSEP ANS" },
    { url: GN("bitcoin ethereum cripto carteira rendimento"),          name: "GN Crypto BR" },
    { url: GN("imposto renda declaracao restituicao isencao"),         name: "GN IRPF" },
    { url: GN("planejamento financeiro pessoal orcamento divida"),     name: "GN Finanças Pessoais" },
    { url: GN("educacao financeira investidor iniciante juros compostos"), name: "GN Educação Financeira" },
    { url: GN_EN("personal finance investing etf bond yield"),        name: "GN Personal Finance EN" },
    { url: GN_EN("cryptocurrency bitcoin ethereum price analysis"),   name: "GN Crypto EN" },
    { url: GN("hedge fund gestora anbima cvm regulacao"),              name: "GN Gestoras" },
    { url: GN("dividendos yield proventos pagamento empresa"),         name: "GN Dividendos" },
    { url: GN("cambio dolar hedge protecao carteira"),                 name: "GN Hedge Câmbio" },
    { url: GN("ibovespa analise tecnica suporte resistencia"),         name: "GN Análise Técnica" },
  ],
  tributacao_regulacao: [
    { url: GN("reforma tributaria regulamentacao impacto empresa"),    name: "GN Reforma Tributária" },
    { url: GN("receita federal fisco autuacao notificacao"),           name: "GN Receita Federal" },
    { url: GN("imposto renda irpf declaracao prazo malha"),            name: "GN IRPF" },
    { url: GN("simples nacional mei microempresa tributacao"),         name: "GN Simples Nacional" },
    { url: GN("bacen banco central regulacao norma circular"),         name: "GN BCB Regulação" },
    { url: GN("cvm comissao valores mobiliarios regulacao"),           name: "GN CVM" },
    { url: GN("anatel aneel ana anvisa agencia reguladora"),           name: "GN Agências Reg." },
    { url: GN("lei complementar emenda constitucional aprovada"),      name: "GN Legislação" },
    { url: GN("planejamento tributario elisao fiscal legal"),          name: "GN Planejamento Trib." },
    { url: GN("nota fiscal nfe difal icms iss pis cofins"),            name: "GN Obrigações Fiscais" },
    { url: GN("desoneracao folha beneficio fiscal incentivo"),         name: "GN Desonerações" },
    { url: GN_EN("tax reform compliance regulation corporate tax"),   name: "GN Tax EN" },
    { url: GN("open finance open banking pix resolucao"),              name: "GN Open Finance" },
    { url: GN("lgpd dados pessoais privacidade anpd"),                 name: "GN LGPD" },
  ],
  tecnologia_industria: [
    { url: "https://canaltech.com.br/rss/",                           name: "Canaltech" },
    { url: "https://techcrunch.com/feed/",                             name: "TechCrunch" },
    { url: "https://www.theverge.com/rss/index.xml",                  name: "The Verge" },
    { url: "http://feeds.arstechnica.com/arstechnica/index/",         name: "Ars Technica" },
    { url: "https://www.wired.com/feed/rss",                          name: "Wired" },
    { url: "https://venturebeat.com/feed/",                           name: "VentureBeat" },
    { url: "https://www.technologyreview.com/feed/",                  name: "MIT Tech Review" },
    { url: "https://rss.tecmundo.com.br/feed",                        name: "TecMundo" },
    { url: GN("inteligencia artificial ia generativa llm brasil"),     name: "GN IA Brasil" },
    { url: GN("chatgpt openai gemini google anthropic ia"),            name: "GN LLMs" },
    { url: GN("ciberseguranca hack ataque ransomware vunerabilidade"), name: "GN Cibersegurança" },
    { url: GN("startup brasil ecossistema inovacao fintechs"),         name: "GN Startups BR" },
    { url: GN("5g fibra optica telecomunicacoes banda larga"),         name: "GN Telecom" },
    { url: GN("industria 4.0 automacao robotica manufatura"),          name: "GN Indústria 4.0" },
    { url: GN("chip semicondutor semicondutores nvidia amd intel"),    name: "GN Semicondutores" },
    { url: GN("nuvem cloud computing aws azure google cloud"),         name: "GN Cloud" },
    { url: GN_EN("artificial intelligence machine learning tech"),    name: "GN AI EN" },
    { url: GN_EN("silicon valley big tech microsoft google meta"),    name: "GN Big Tech EN" },
    { url: "https://feeds.bbci.co.uk/news/technology/rss.xml",        name: "BBC Technology" },
    { url: GN("blockchain web3 nft metaverso realidade virtual"),      name: "GN Web3" },
    { url: GN("agritech biotech medtech deeptech inovacao"),           name: "GN DeepTech" },
  ],
  saude_familia: [
    { url: "https://agenciabrasil.ebc.com.br/saude/feed.xml",         name: "Agência Brasil Saúde" },
    { url: GN("saude medicina tratamento doenca sus ministerio"),      name: "GN Saúde" },
    { url: GN("vacina vacinacao campanha imunizacao ministerio"),      name: "GN Vacinação" },
    { url: GN("cancer diabetes hipertensao doenca cronica tratamento"),name: "GN Doenças Crônicas" },
    { url: GN("plano saude convenio unimed bradesco sulamerica"),      name: "GN Planos de Saúde" },
    { url: GN("anvisa medicamento aprovacao registro"),                name: "GN ANVISA" },
    { url: GN("saude mental depressao ansiedade burnout bem estar"),   name: "GN Saúde Mental" },
    { url: GN("familia crianca adolescente educacao filhos"),          name: "GN Família" },
    { url: GN("nutricao alimentacao dieta emagrecimento saude"),       name: "GN Nutrição" },
    { url: GN("hospital sus sus atendimento ubs upa"),                 name: "GN SUS" },
    { url: GN("pesquisa medica ciencia descoberta cura"),              name: "GN Pesquisa Médica" },
    { url: GN_EN("health medicine vaccine disease treatment"),        name: "GN Health EN" },
    { url: "https://feeds.bbci.co.uk/news/health/rss.xml",            name: "BBC Health" },
    { url: GN("envelhecimento longevidade terceira idade idosos"),     name: "GN Longevidade" },
    { url: GN("maternidade gravidez gestacao bebe recemnascido"),      name: "GN Maternidade" },
    { url: GN("direitos crianca estatuto eca violencia bullying"),     name: "GN Direitos Criança" },
  ],
  educacao_profissoes: [
    { url: "https://agenciabrasil.ebc.com.br/educacao/feed.xml",      name: "Agência Brasil Educação" },
    { url: GN("educacao escola universidade enem vestibular"),         name: "GN Educação" },
    { url: GN("enem resultado inscricao gabarito nota corte"),         name: "GN ENEM" },
    { url: GN("fies prouni bolsa faculdade ensino superior"),          name: "GN FIES PROUNI" },
    { url: GN("mec ministerio educacao base curricular reforma"),      name: "GN MEC" },
    { url: GN("profissoes carreira mercado trabalho salario"),         name: "GN Profissões" },
    { url: GN("tecnologia profissao futuro automatizacao emprego"),    name: "GN Futuro do Trabalho" },
    { url: GN("pos graduacao mba especializacao certificacao"),        name: "GN Pós-Graduação" },
    { url: GN("cursinho preparatorio tecnico clt pj regime"),          name: "GN Formação" },
    { url: GN("pedagogia educacao basica fundamental medio"),          name: "GN Educação Básica" },
    { url: GN("home office trabalho remoto hibrido modelo"),           name: "GN Trabalho Remoto" },
    { url: GN_EN("education university degree career skills"),        name: "GN Education EN" },
    { url: GN("salario minimo reajuste piso salarial categoria"),      name: "GN Salário Mínimo" },
    { url: GN("concurso vestibular selecao publica educacao"),         name: "GN Seleção Educação" },
  ],
  vagas_concursos: [
    { url: GN("vagas emprego contratacao recrutamento selecao"),       name: "GN Vagas Emprego" },
    { url: GN("concurso publico edital inscricao gabarito prova"),     name: "GN Concursos" },
    { url: GN("concurso federal inss receita policia pf pcf"),         name: "GN Concursos Federais" },
    { url: GN("concurso estadual municipal prefeitura governo"),       name: "GN Concursos Estaduais" },
    { url: GN("trainee estagio jovem aprendiz programa empresa"),      name: "GN Trainee Estágio" },
    { url: GN("home office remoto vaga contratacao emprego"),          name: "GN Vagas Remoto" },
    { url: GN("recolocacao demissao desemprego seguro desemprego"),    name: "GN Recolocação" },
    { url: GN("linkedin selecao curriculo entrevista contratacao"),    name: "GN Recrutamento" },
    { url: GN("clt pj mei freelance autonomo regime contrato"),        name: "GN CLT vs PJ" },
    { url: GN("salario beneficio plano carreira promoção"),            name: "GN Salário Benefícios" },
    { url: GN("setor publico carreira servidor efetivo cargo"),        name: "GN Servidor Público" },
    { url: GN("tecnologia ti desenvolvedor programador vagas"),        name: "GN Vagas TI" },
    { url: GN("saude enfermagem medico fisioterapeuta vaga"),          name: "GN Vagas Saúde" },
    { url: GN("engenharia arquitetura construcao vaga oportunidade"),  name: "GN Vagas Eng." },
    { url: GN_EN("jobs remote work hiring recruitment"),              name: "GN Jobs EN" },
    { url: GN("sindicato greve paralisacao categoria trabalhador"),    name: "GN Sindicatos" },
  ],
  imoveis_parcerias: [
    { url: GN("imoveis mercado imobiliario lancamento construtora"),   name: "GN Imóveis" },
    { url: GN("minha casa minha vida mcmv financiamento habitacao"),   name: "GN MCMV" },
    { url: GN("aluguel preco reajuste igpm locacao contrato"),         name: "GN Aluguel" },
    { url: GN("incorporadora construtora lançamento vendas imovel"),   name: "GN Construtoras" },
    { url: GN("fii fundos imobiliarios logistica shoppings lajes"),    name: "GN FIIs Imóveis" },
    { url: GN("financiamento habitacional caixa bb banco fgts"),       name: "GN Financiamento Hab." },
    { url: GN("construcao civil materiais obra reforma custo"),        name: "GN Construção Civil" },
    { url: GN("metro quadrado indice fipe zap preco imovel"),          name: "GN Preço m²" },
    { url: GN("interior sao paulo rj mg df imovel valorizacao"),       name: "GN Imóveis Regionais" },
    { url: GN("parceria acordo joint venture alianca empresa"),        name: "GN Parcerias" },
    { url: GN("arquitetura design interiores decoracao projeto"),      name: "GN Arquitetura" },
    { url: GN_EN("real estate property market housing mortgage"),     name: "GN Real Estate EN" },
    { url: GN("retrofit sustentavel construcao verde certificacao"),   name: "GN Construção Verde" },
  ],
  esg_internacional: [
    { url: "https://www.aljazeera.com/xml/rss/all.xml",               name: "Al Jazeera" },
    { url: "https://feeds.bbci.co.uk/news/world/rss.xml",             name: "BBC World" },
    { url: "https://www.theguardian.com/world/rss",                   name: "Guardian World" },
    { url: GN("esg sustentabilidade ambiental social governanca"),     name: "GN ESG Brasil" },
    { url: GN("mudancas climaticas emissoes carbono cop acordo"),      name: "GN Clima" },
    { url: GN("energia renovavel solar eolica hidrogênio verde"),      name: "GN Energia Limpa" },
    { url: GN("geopolitica guerra conflito diplomatico internacional"), name: "GN Geopolítica" },
    { url: GN("eua estados unidos trump biden washington"),            name: "GN EUA" },
    { url: GN("china asia economia crescimento exportacao"),           name: "GN China" },
    { url: GN("europa uniao europeia bce mario draghi"),               name: "GN Europa" },
    { url: GN("mercosul america latina brasil argentina chile"),       name: "GN América Latina" },
    { url: GN("russia ucrania guerra sancoes energia"),                name: "GN Rússia/Ucrânia" },
    { url: GN("opep petroleo producao preco barril"),                  name: "GN OPEP" },
    { url: GN_EN("geopolitics war conflict diplomacy international"), name: "GN Geopolitics EN" },
    { url: GN_EN("climate change environment sustainability cop"),    name: "GN Climate EN" },
    { url: GN_EN("united nations g20 g7 summit multilateral"),       name: "GN UN G20 EN" },
    { url: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada", name: "El País" },
    { url: GN("fmi banco mundial ocde dados economia global"),         name: "GN FMI/BM" },
    { url: GN("israel palestina oriente medio geopolitica"),           name: "GN Oriente Médio" },
    { url: GN("india africa emergente economia crescimento"),          name: "GN Mercados Emerg." },
  ],
  defesa_seguranca: [
    { url: GN("exercito marinha aeronautica forcas armadas defesa"),   name: "GN Defesa" },
    { url: GN("policia federal pf operacao investigacao flagrante"),   name: "GN Polícia Federal" },
    { url: GN("seguranca publica violencia crime assassinato"),        name: "GN Segurança Pública" },
    { url: GN("trafico drogas pcc cv bope crime organizado"),          name: "GN Crime Organizado" },
    { url: GN("ministerio defesa equipamento militar compra"),         name: "GN Ministério Defesa" },
    { url: GN("lavagem dinheiro coaf rastreamento financeiro"),        name: "GN COAF" },
    { url: GN("cybercrime hackers ataque digital infraestrutura"),     name: "GN Cybercrime" },
    { url: GN("fronteira fronteiras tráfico contrabando migracao"),    name: "GN Fronteiras" },
    { url: GN_EN("military defense nato army security"),              name: "GN Defense EN" },
    { url: GN("sistema prisional carcerario preso regaio"),            name: "GN Sistema Prisional" },
    { url: GN("terrorismo extremismo seguranca internacional"),        name: "GN Terrorismo" },
  ],
  cultura_variedades_esportes: [
    { url: "https://ge.globo.com/rss/ge.xml",                         name: "GE Esportes" },
    { url: GN("brasileirao campeonato flamengo corinthians palmeiras"), name: "GN Brasileirão" },
    { url: GN("copa mundo eurocopa selecao brasileira futebol"),       name: "GN Copa" },
    { url: GN("formula 1 gp corrida lewis hamilton verstappen"),       name: "GN F1" },
    { url: GN("olimpiadas jogos paris atleta medalhista"),             name: "GN Olimpíadas" },
    { url: GN("nba nfl mlb beisebol basquete americana esporte"),      name: "GN Esportes USA" },
    { url: GN("cultura arte cinema festival premio oscar"),            name: "GN Cultura" },
    { url: GN("musica show lancamento album festival"),                name: "GN Música" },
    { url: GN("serie filme streaming netflix amazon disney"),          name: "GN Streaming" },
    { url: GN("gastronomia restaurante chef culinaria receita"),       name: "GN Gastronomia" },
    { url: GN("turismo viagem destino internacional nacional"),        name: "GN Turismo" },
    { url: GN("moda estilo roupa tendência marca luxo"),               name: "GN Moda" },
    { url: GN("entretenimento celebridade fama comportamento viral"),  name: "GN Entretenimento" },
    { url: GN_EN("sports soccer champions league premier league"),    name: "GN Sports EN" },
    { url: "https://feeds.bbci.co.uk/sport/rss.xml",                  name: "BBC Sport" },
  ],
  espiritualidade: [
    { url: GN("religiao fe evangelico catolicismo espirita"),          name: "GN Religião" },
    { url: GN("espiritualidade bem estar meditacao mindfulness"),      name: "GN Espiritualidade" },
    { url: GN("papa vaticano igreja catolica brasil"),                 name: "GN Igreja Católica" },
    { url: GN("igrejas evangelicas protestantes denominacoes"),        name: "GN Igrejas" },
    { url: GN("semana santa pascoa natal celebracao religiosa"),       name: "GN Celebrações" },
    { url: GN("missao evangelismo christianismo fé"),                  name: "GN Missão" },
    { url: GN("diversidade religiosa umbanda candomble espiritismo"),  name: "GN Pluralidade" },
    { url: GN("ética moral valores familia tradicional"),              name: "GN Valores" },
    { url: GN_EN("religion faith church christianity spiritual"),     name: "GN Religion EN" },
  ],
  investigativo: [
    { url: "https://apublica.org/feed/",                               name: "Agência Pública" },
    { url: GN("investigacao corrupcao denuncia operacao pf"),          name: "GN Investigativo" },
    { url: GN("jornalismo investigativo reportagem especial"),         name: "GN Jornalismo Inv." },
    { url: GN("lavagem dinheiro desvio recurso publico corrupto"),     name: "GN Corrupção" },
    { url: GN("delacao premiada acordo leniência cpi comissao"),       name: "GN Delação" },
    { url: GN("fake news desinformacao checagem fact-checking"),       name: "GN Checagem" },
    { url: GN("whistleblower vazamento documento secreto"),            name: "GN Vazamentos" },
    { url: GN_EN("corruption investigation fraud scandal expose"),    name: "GN Investigation EN" },
    { url: GN("stj stf ação penal processo condenacao"),               name: "GN Judiciário" },
    { url: GN("orgaos controle cgu tcu ministerio publico mp"),        name: "GN Controle Público" },
  ],
  agronegocio: [
    { url: GN("agronegocio soja milho boi cafe algodao laranja"),      name: "GN Agronegócio" },
    { url: GN("exportacao grao carne frango suino abiec"),             name: "GN Exportação Agro" },
    { url: GN("safra colheita producao estimativa conab"),             name: "GN Safra" },
    { url: GN("fazenda produtor rural financiamento credito rural"),   name: "GN Crédito Rural" },
    { url: GN("fertilizante defensivo insumo agro custo"),             name: "GN Insumos Agro" },
    { url: GN("rastreabilidade carne boi sustentavel desmatamento"),   name: "GN Agro Sustentável" },
    { url: GN_EN("agriculture soybean corn commodity price harvest"), name: "GN Agriculture EN" },
    { url: GN("mapa ministerio agricultura pec portaria"),             name: "GN MAPA" },
  ],
};

const CATEGORIA_PARA_GRUPO = {
  politica:      ["politica"],
  economia:      ["economia"],
  negocios:      ["negocios_mercados"],
  mercados:      ["negocios_mercados"],
  investimentos: ["seguros_investimentos"],
  seguros:       ["seguros_investimentos"],
  tributacao:    ["tributacao_regulacao"],
  regulacao:     ["tributacao_regulacao"],
  tecnologia:    ["tecnologia_industria"],
  industria:     ["tecnologia_industria"],
  saude:         ["saude_familia"],
  familia:       ["saude_familia"],
  educacao:      ["educacao_profissoes"],
  profissoes:    ["educacao_profissoes"],
  vagas:         ["vagas_concursos"],
  concursos:     ["vagas_concursos"],
  imoveis:       ["imoveis_parcerias"],
  parcerias:     ["imoveis_parcerias"],
  esg:           ["esg_internacional"],
  internacional: ["esg_internacional"],
  defesa:        ["defesa_seguranca"],
  seguranca:     ["defesa_seguranca"],
  cultura:       ["cultura_variedades_esportes"],
  variedades:    ["cultura_variedades_esportes"],
  esportes:      ["cultura_variedades_esportes"],
  religiao:      ["espiritualidade"],
  investigativo: ["investigativo"],
  agronegocio:   ["agronegocio"],
};

function selecionarFeedsBalanceados() {
  const selecionados = [];
  for (const grupo of Object.values(FEEDS_POR_GRUPO)) {
    const embaralhado = [...grupo].sort(() => Math.random() - 0.5);
    selecionados.push(...embaralhado.slice(0, 2));
  }
  return selecionados;
}

// Brasília = UTC-3. Rejeita qualquer item que não seja de hoje.
function isHoje(dateStr) {
  if (!dateStr) return false;
  try {
    const itemDate = new Date(dateStr);
    if (isNaN(itemDate.getTime())) return false;
    const offsetMs = -3 * 60 * 60 * 1000;
    const hojeStr = new Date(Date.now() + offsetMs).toISOString().slice(0, 10);
    const itemStr = new Date(itemDate.getTime() + offsetMs).toISOString().slice(0, 10);
    return itemStr === hojeStr;
  } catch (_) { return false; }
}

function extrairItem(i, sourceName) {
  const dateStr = i.isoDate || i.pubDate || "";
  if (!isHoje(dateStr)) return null;
  if (!i.link && !i.guid) return null;
  if (!i.title) return null;
  return {
    title: i.title,
    link: i.link || i.guid,
    source: sourceName,
    description: i.contentSnippet || i.summary || i.description || i.content || "",
    pubDate: dateStr,
  };
}

async function buscarFeedsEspecificos(feeds) {
  const results = await Promise.allSettled(
    feeds.slice(0, 10).map(source =>
      parser.parseURL(source.url)
        .then(feed => (feed.items || []).slice(0, 10)
          .map(i => extrairItem(i, source.name))
          .filter(Boolean))
        .catch(() => [])
    )
  );
  const items = results.filter(r => r.status === "fulfilled").flatMap(r => r.value);
  return dedupPorTitulo(items.sort(() => Math.random() - 0.5));
}

export async function getNewsByCategoria(categoria) {
  try {
    const gruposAlvo = CATEGORIA_PARA_GRUPO[categoria] || [];
    const feedsEspecificos = gruposAlvo.flatMap(g => FEEDS_POR_GRUPO[g] || []);
    if (feedsEspecificos.length > 0) return await buscarFeedsEspecificos(feedsEspecificos);
    return await getNews();
  } catch (_) { return []; }
}

function titulosSimilares(a, b) {
  const norm = t => (t || "").toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 3);
  const wa = new Set(norm(a));
  const wb = new Set(norm(b));
  if (wa.size === 0 || wb.size === 0) return false;
  const intersect = [...wa].filter(w => wb.has(w)).length;
  const union = new Set([...wa, ...wb]).size;
  return (intersect / union) >= 0.45;
}

function dedupPorTitulo(items) {
  const unicos = [];
  for (const item of items) {
    if (!unicos.some(u => titulosSimilares(u.title, item.title))) unicos.push(item);
  }
  return unicos;
}

export async function getNews() {
  try {
    const { data: allSources } = await supabase
      .from("rss_sources")
      .select("url,name,active")
      .order("created_at", { ascending: false });
    let feedsParaUsar;
    if (allSources && allSources.length > 0) {
      feedsParaUsar = allSources.filter(s => s.active !== false);
      if (!feedsParaUsar.length) feedsParaUsar = selecionarFeedsBalanceados();
    } else {
      feedsParaUsar = selecionarFeedsBalanceados();
    }
    feedsParaUsar = feedsParaUsar.sort(() => Math.random() - 0.5).slice(0, 20);
    const results = await Promise.allSettled(
      feedsParaUsar.map(source =>
        parser.parseURL(source.url)
          .then(feed => (feed.items || []).slice(0, 8)
            .map(i => extrairItem(i, source.name))
            .filter(Boolean))
          .catch(() => [])
      )
    );
    const allItems = results.filter(r => r.status === "fulfilled").flatMap(r => r.value);
    return dedupPorTitulo(allItems.sort(() => Math.random() - 0.5));
  } catch (_) { return []; }
}
