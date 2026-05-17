import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const hoje = () => new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

const OPENAI_KEY = process.env.OPENAI_API_KEY;

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_KEY_2,
].filter(Boolean);

let geminiKeyIndex = 0;
function nextGeminiKey() {
  const k = GEMINI_KEYS[geminiKeyIndex % GEMINI_KEYS.length];
  geminiKeyIndex++;
  return k;
}

async function callOpenAI(prompt) {
  if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY não configurada");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Você é redator jornalístico sênior do portal O Valor Capital, especializado em SEO de alta performance para Google News e Google Discover. Seu estilo segue o padrão Reuters e Bloomberg: objetivo, denso, sem jargões. Siga o formato solicitado à risca — cada campo tem regras de caracteres obrigatórias. O campo CORPO deve ser entregue inteiramente em HTML válido com tags em caixa baixa. Nunca use markdown." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 8192
    })
  });
  const d = await res.json();
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${d.error?.message || ""}`);
  const text = d.choices?.[0]?.message?.content;
  if (text && text.length > 100) return text;
  throw new Error("OpenAI retornou resposta vazia");
}

async function callGemini(prompt) {
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const key = nextGeminiKey();
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }
        })
      });
      const d = await res.json();
      if (res.status === 429) continue;
      if (!res.ok) throw new Error(`Gemini ${res.status}: ${d.error?.message || ""}`);
      const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.length > 100) return text;
    } catch(e) {
      if (i === GEMINI_KEYS.length - 1) throw e;
    }
  }
  throw new Error("Gemini indisponível");
}

const SUBCATS_POR_CAT = {
  politica:      ["Governo Federal","Congresso Nacional","Eleições","Partidos Políticos","STF & Judiciário","Política Estadual","Câmara dos Deputados","Senado Federal","Poder Executivo"],
  economia:      ["Política Econômica","Inflação & Preços","Taxa Selic","PIB & Crescimento","Câmbio & Dólar","Fiscal & Orçamento","Emprego & Renda","Banco Central"],
  negocios:      ["Empresas & Corporações","Fusões & Aquisições","Startups","Empreendedorismo","Grandes Corporações","Setor Privado","Varejo","Agronegócio Empresarial"],
  investimentos: ["Bolsa de Valores","Renda Fixa","Fundos de Investimento","Tesouro Direto","Criptomoedas","Análise de Mercado","Finanças Pessoais","FIIs"],
  seguros:       ["Seguro de Vida","Planos de Saúde","Seguro Auto","Previdência Privada","Seguro Residencial","SUSEP & ANS","Seguro Empresarial","Corretoras de Seguros"],
  mercados:      ["Commodities","Petróleo & Energia","Ouro & Metais","B3 & Ibovespa","Câmbio Internacional","Índices Globais","Agro & Grãos"],
  educacao:      ["Ensino Superior","ENEM","Educação Básica","Cursos & Certificações","Pós-Graduação","Tecnologia na Educação","Bolsas de Estudo","Ensino Técnico"],
  industria:     ["Agronegócio","Manufatura","Energia","Infraestrutura","Exportações","Cadeia Produtiva","Mineração","Construção Civil"],
  tecnologia:    ["Inteligência Artificial","Segurança Digital","E-commerce","Telecomunicações","Inovação","Startups Tech","Blockchain","Computação em Nuvem"],
  esportes:      ["Futebol","Olimpíadas","Fórmula 1","Tênis","Basquete","Natação","Atletismo","Outros Esportes"],
  saude:         ["Medicina & Tratamentos","SUS","Saúde Mental","Medicamentos","Bem-estar","Epidemiologia","Pediatria","Nutrição"],
  familia:       ["Educação dos Filhos","Planejamento Familiar","Herança & Patrimônio","Casamento & Divórcio","Finanças Pessoais","Criação de Filhos"],
  tributacao:    ["IRPF","Reforma Tributária","ICMS & ISS","Receita Federal","Planejamento Tributário","Impostos Federais","Simples Nacional","CSLL & IRPJ"],
  regulacao:     ["BACEN","CVM","ANBIMA","SUSEP","ANS","ANATEL","ANEEL","Regulação Setorial"],
  parcerias:     ["Acordos Comerciais","Joint Ventures","Alianças Estratégicas","Contratos Públicos","PPP"],
  internacional: ["Relações Exteriores","Geopolítica","Conflitos Globais","América Latina","Estados Unidos","Europa","China & Ásia","Oriente Médio","Diplomacia"],
  variedades:    ["Comportamento","Lifestyle","Entretenimento","Tendências","Gastronomia","Turismo","Moda"],
  investigativo: ["Corrupção","Operações Policiais","Denúncias","Jornalismo de Dados","Fiscalização Pública","Lavagem de Dinheiro"],
  seguranca:     ["Segurança Pública","Crime Organizado","Violência Urbana","Polícia Federal","Narcotráfico","Facções","Homicídios"],
  cultura:       ["Cinema","Música","Arte","Teatro","Literatura","Patrimônio Cultural","Streaming","Festivais"],
  profissoes:    ["Medicina","Direito","Engenharia","Contabilidade","TI & Programação","Administração","Arquitetura","Recursos Humanos"],
  vagas:         ["Oportunidades CLT","Trabalho Remoto","Recrutamento & Seleção","Estágio","Trainee","Mercado de Trabalho"],
  concursos:     ["Concursos Federais","Concursos Estaduais","Concursos Municipais","Militares & Policiais","Judiciário","Saúde Pública"],
  imoveis:       ["Mercado Imobiliário","Financiamento Habitacional","Construtoras","Aluguel","Lançamentos","Minha Casa Minha Vida"],
  esg:           ["Sustentabilidade","Meio Ambiente","Governança Corporativa","Energia Limpa","Impacto Social","Carbono & Emissões"],
  defesa:        ["Forças Armadas","Segurança Nacional","Política de Defesa","Exército","Marinha","Aeronáutica","Fronteiras"],
  religiao:      ["Evangelicalismo","Catolicismo","Espiritualidade","Igrejas","Fé & Sociedade","Missões","Religiões Afro-brasileiras"],
};

// =====================================================================
// PROMPT OFICIAL OVC — TRAVADO EM PRODUÇÃO — NÃO ALTERAR SEM AUTORIZAÇÃO
// Versão: Google News + Discover / Reuters-Bloomberg style
// =====================================================================
const PROMPT = (data, text) => `Reescreva a notícia abaixo como matéria jornalística completa e densa do portal O Valor Capital, otimizada para SEO de Alta Performance (Google News e Discover).
Use SOMENTE os fatos do texto fonte. Não invente dados, nomes, valores ou declarações.
Não mencione o veículo de origem.

RETORNE EXATAMENTE neste formato (copie os rótulos):

TITULO: [manchete entre 55 e 65 caracteres — keyword principal obrigatoriamente no início — verbo ativo — factual]
META_TITLE: [versão SEO máximo 55 caracteres — keyword no início — sem "O Valor Capital"]
FOCO_KEYWORD: [2 a 4 palavras que definem o tema central — ex: taxa selic, reforma tributária]
SLUG: [3 a 5 palavras do título hifenizadas sem acentos — ex: selic-sobe-inflacao]
META_DESCRICAO: [exatamente entre 141 e 155 caracteres para Discover — inclua a keyword de forma natural — termine com ponto — sem pontos intermediários]
CATEGORIA: [UMA categoria: politica | economia | negocios | investimentos | seguros | mercados | educacao | industria | tecnologia | esportes | saude | familia | tributacao | regulacao | parcerias | internacional | variedades | investigativo | seguranca | cultura | profissoes | vagas | concursos | imoveis | esg | defesa | religiao]
SUBCATEGORIA: [subcategoria específica da categoria escolhida]
CORPO:
<p><strong>Redação OVC</strong> — ${data}</p>

<p>[LEAD obrigatório: 3 a 4 frases densas respondendo QUEM, O QUÊ, QUANDO, ONDE e POR QUÊ. Estrutura MobileUX: frases diretas na voz ativa. Coloque a <strong>keyword principal em negrito</strong> na primeira frase. Mínimo 80 palavras neste parágrafo.]</p>

<h2>[Subtítulo H2 com variação natural da keyword — 4 a 7 palavras — factual — focado em intenção de busca real]</h2>

<p>[Parágrafo com desenvolvimento dos fatos principais — mínimo 80 palavras. Use <strong>negrito</strong> em nomes de pessoas, empresas, cargos, valores numéricos e datas-chave. Desenvolva o contexto com profundidade jornalística.]</p>

<p>[Segundo parágrafo desta seção — mínimo 60 palavras. Aprofunde os detalhes, números, declarações e implicações do fato.]</p>

[Se a fonte tiver 3 ou mais dados, datas ou etapas, use lista obrigatória:]
<ul>
  <li><strong>Item 1</strong> — descrição detalhada com contexto</li>
  <li><strong>Item 2</strong> — descrição detalhada com contexto</li>
  <li><strong>Item 3</strong> — descrição detalhada com contexto</li>
</ul>

<h2>[Subtítulo H2 com impacto concreto e institucional — 4 a 7 palavras — factual]</h2>

<p>[Parágrafo sobre o impacto prático — mínimo 80 palavras. Explique quem é afetado, de que forma e em que magnitude sob a ótica de mercado ou institucional. Inclua dados quantitativos se disponíveis na fonte.]</p>

<p>[Segundo parágrafo desta seção — mínimo 60 palavras. Aborde as consequências econômicas, sociais ou políticas do fato, sempre baseado na fonte.]</p>

<h2>[Subtítulo H2 com contexto técnico — 4 a 7 palavras — factual]</h2>

<p>[Parágrafo com contexto ou próximos passos — mínimo 80 palavras. Inclua cronograma, votações, decisões ou desdobramentos mencionados NA FONTE. Finalize com declaração ou dado relevante.]</p>

<p>[Parágrafo de fechamento — mínimo 60 palavras. Situe o leitor no cenário mais amplo usando apenas informações presentes na fonte. Termine com uma perspectiva concreta. Fica proibido incluir ganchos interativos, perguntas de engajamento ou pedidos de opinião. O texto encerra-se de forma seca e factual no último ponto final.]</p>

<p>#hashtag1 #hashtag2 #hashtag3 #ovalorcapital</p>

REGRAS OBRIGATÓRIAS DE RIGOR MÁXIMO E BLINDAGEM ALGORÍTMICA:
— TITULO: conte os caracteres. Mínimo 55, máximo 65. Ajuste se necessário.
— META_TITLE: máximo 55 caracteres absolutos. Google corta acima disso.
— META_DESCRICAO: intervalo estrito entre 141 e 155 caracteres. Conte e ajuste.
— CORPO: mínimo 4.000 caracteres. Escreva todos os blocos com máxima densidade jornalística. Parágrafos curtos são PROIBIDOS — cada parágrafo deve ter no mínimo 60 palavras e no máximo 3 sentenças (MobileUX).
— O CORPO deve ser entregue inteiramente em HTML válido. NUNCA use markdown (**, ##, *, •). Use apenas tags HTML em caixa baixa: <p>, <h2>, <strong>, <ul>, <li>.
— Use a FOCO_KEYWORD pelo menos 3 vezes no CORPO de forma natural.
— Negrito obrigatório (tag <strong>): nomes de pessoas, empresas, cargos, valores numéricos e datas.
— PROIBIÇÃO ABSOLUTA DE JARGÕES SINTÉTICOS: Fica terminantemente banido o uso de termos robóticos de IA ou clichês de marketing. Se o texto contiver qualquer um destes termos, a matéria será rejeitada: [robust, robusto, resiliente, ecossistema, disruptivo, paradigma, sinergia, catalisador, protagonista, blindar, chama atenção, vale destacar, em meio a, diante disso, acende alerta, especialistas apontam, prospecção, radiografia do fato, cenário prospectivo, vetores de risco, no tecido social, em um mundo cada vez mais, no cenário atual, vale ressaltar, de suma importância].
— Não comece com saudação, "Prezado", "Caro", "Olá" ou similar.
— Não adicione contexto histórico, geográfico ou especulativo que não está na fonte.
— O texto deve possuir a assinatura estilística limpa de agências de notícias internacionais (Reuters / Bloomberg).

<TEXTO_FONTE>
${text}
</TEXTO_FONTE>`;
// =====================================================================

function slugify(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function parse(raw) {
  if (!raw) return null;
  const lines = raw.split("\n");
  let titulo = "", metaTitle = "", focoKeyword = "", slug = "", metaDescricao = "", categoriaRaw = "", subcategoriaRaw = "", corpo = "";
  let inCorpo = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^TITULO:/i.test(trimmed))            titulo        = trimmed.replace(/^TITULO:/i, "").trim();
    else if (/^META_TITLE:/i.test(trimmed))   metaTitle     = trimmed.replace(/^META_TITLE:/i, "").trim().slice(0, 55);
    else if (/^FOCO_KEYWORD:/i.test(trimmed)) focoKeyword   = trimmed.replace(/^FOCO_KEYWORD:/i, "").trim();
    else if (/^SLUG:/i.test(trimmed))         slug          = slugify(trimmed.replace(/^SLUG:/i, "").trim());
    else if (/^META_DESCRICAO:/i.test(trimmed)) metaDescricao = trimmed.replace(/^META_DESCRICAO:/i, "").trim();
    else if (/^SUBTITULO:/i.test(trimmed))    { if (!metaDescricao) metaDescricao = trimmed.replace(/^SUBTITULO:/i, "").trim(); }
    else if (/^CATEGORIA:/i.test(trimmed))    categoriaRaw  = trimmed.replace(/^CATEGORIA:/i, "").trim().split(/[\s→|]/)[0].toLowerCase();
    else if (/^SUBCATEGORIA:/i.test(trimmed)) subcategoriaRaw = trimmed.replace(/^SUBCATEGORIA:/i, "").trim();
    else if (/^CORPO:/i.test(trimmed))        inCorpo = true;
    else if (inCorpo) corpo += line + "\n";
  }
  corpo = corpo.trim();
  if (!corpo && raw.length > 200) {
    corpo = raw.trim();
    const firstLine = raw.split("\n")[0].trim();
    if (firstLine.length < 120 && firstLine.length > 5) titulo = titulo || firstLine;
  }

  const catsValidas = ["politica","economia","negocios","investimentos","seguros","mercados",
    "educacao","industria","tecnologia","esportes","saude","familia","tributacao","regulacao",
    "parcerias","internacional","variedades","investigativo","seguranca","cultura",
    "profissoes","vagas","concursos","imoveis","esg","defesa","religiao"];
  if (!catsValidas.includes(categoriaRaw)) categoriaRaw = "geral";

  const subcatsValidas = SUBCATS_POR_CAT[categoriaRaw] || [];
  if (subcatsValidas.length > 0) {
    const subcatNorm = subcategoriaRaw.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
    const match = subcatsValidas.find(s =>
      s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim() === subcatNorm ||
      s.toLowerCase().includes(subcatNorm) ||
      subcatNorm.includes(s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().slice(0, 6))
    );
    subcategoriaRaw = match || subcatsValidas[0];
  }

  if (!slug && titulo) slug = slugify(titulo).split("-").slice(0, 5).join("-");

  const finalMetaTitle = (metaTitle || titulo || "").slice(0, 55).trim();

  return {
    titulo: titulo || "Sem título",
    meta_title: finalMetaTitle,
    subtitulo: metaDescricao || "",
    meta_descricao: metaDescricao || "",
    foco_keyword: focoKeyword || "",
    slug,
    categoria: categoriaRaw,
    subcategoria: subcategoriaRaw || (SUBCATS_POR_CAT[categoriaRaw]?.[0] || "Geral"),
    subcategoria_slug: slugify(subcategoriaRaw || "geral"),
    corpo
  };
}

export async function rewritePortal(text, title, useGemini = false) {
  const prompt = PROMPT(hoje(), (title ? title + "\n\n" : "") + text);
  let raw;
  if (useGemini) {
    raw = await callGemini(prompt);
  } else {
    try {
      raw = await callOpenAI(prompt);
    } catch(e) {
      if (GEMINI_KEYS.length > 0) {
        raw = await callGemini(prompt);
      } else {
        throw e;
      }
    }
  }
  const result = parse(raw);
  if (!result || !result.corpo || result.corpo.length < 2500) {
    throw new Error("Conteúdo gerado insuficiente: " + (result?.corpo?.length || 0) + " chars");
  }
  const tituloLower = (result.titulo || "").toLowerCase().trim();
  const corpoInicio = result.corpo.slice(0, 100).toLowerCase();
  const proibidos = ["prezado", "caro usuário", "olá,", "atenção:", "dear", "editor(a)", "redator-chefe"];
  if (proibidos.some(p => tituloLower.startsWith(p) || corpoInicio.includes(p))) {
    throw new Error("Conteúdo rejeitado — título ou abertura inválida");
  }
  return result;
}
