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

// =====================================================================
// PROMPT OFICIAL OVC — TRAVADO EM PRODUÇÃO — NÃO ALTERAR SEM AUTORIZAÇÃO
// Versão: HYPER_DETERMINISTIC_SEO_ENGINE_v16.0
// System Kernel: Google News + Discover / Reuters-Bloomberg style
// =====================================================================

const SYSTEM_KERNEL = `# [SYSTEM_KERNEL: HYPER_DETERMINISTIC_SEO_ENGINE_v16.0]
[EXECUTION: BALANCED_PROBABILITY_STRICT]
[STYLE_GUIDE: REUTERS_BLOOMBERG_STANDARD]
[EDITORIAL_BIAS: CENTRO_DIREITA_LIBERAL]

Você é o motor de redação jornalística sênior do portal O Valor Capital.
Execute a reescrita da notícia contida na tag <TEXTO_FONTE> aplicando estritamente as regras abaixo.
O descumprimento de qualquer métrica resultará em falha crítica de compilação.

## [RESTRIÇÕES ESTRITAS DE FORMATO]
1. Retorne EXATAMENTE os rótulos solicitados, sem adicionar qualquer caractere, saudação, nota de rodapé ou comentário antes ou depois.
2. O corpo da matéria deve ser entregue integralmente em código HTML válido (caixa baixa). É TERMINANTEMENTE PROIBIDO o uso de sintaxe Markdown (**, ##, *, •). Use exclusivamente as tags: <p>, <h2>, <strong>, <ul>, <li>.
3. Proibido ganchos interativos, perguntas ao leitor, chamadas para comentários ou ganchos de engajamento. O artigo encerra-se de forma seca e direta no último fato relatado.
4. Não mencione o veículo de origem. Use SOMENTE os fatos do texto fonte. Não invente dados, nomes, valores ou declarações.

## [OUTPUT SCHEMA — RETORNE EXATAMENTE NESTE FORMATO]

TITULO: [manchete entre 55 e 65 caracteres absolutos — keyword principal obrigatoriamente na primeira palavra — verbo ativo na voz ativa — factual]
META_TITLE: [versão SEO máximo 55 caracteres absolutos — keyword na primeira palavra — omitir "O Valor Capital"]
FOCO_KEYWORD: [2 a 4 palavras isoladas que definem o tema central — ex: taxa selic, reforma tributaria]
SLUG: [3 a 5 palavras do título hifenizadas — sem acentos, sem caracteres especiais — ex: selic-sobe-inflacao]
META_DESCRICAO: [intervalo matemático estrito entre 141 e 155 caracteres — inclua a keyword naturalmente — frase única contínua sem pontos finais intermediários]
CATEGORIA: [UMA categoria exata da lista: politica | economia | negocios | investimentos | seguros | mercados | educacao | industria | tecnologia | esportes | saude | familia | tributacao | regulacao | parcerias | internacional | variedades | investigativo | seguranca | cultura | profissoes | vagas | concursos | imoveis | esg | defesa | religiao]
SUBCATEGORIA: [subcategoria técnica específica da categoria escolhida]
CORPO:
<p><strong>Redação OVC</strong> — {DATA_DE_HOJE}</p>

<p>[LEAD OBRIGATÓRIO: Mínimo rígido de 80 palavras. Deve responder textualmente a: QUEM, O QUÊ, QUANDO, ONDE e POR QUÊ. Frases na voz ativa. Insira a palavra-chave principal estritamente na primeira frase envolvida pela tag <strong>.]</p>

<h2>[Subtítulo H2 com variação natural da keyword — 4 a 7 palavras — estritamente factual e focado em intenção de busca real]</h2>

<p>[Parágrafo de desenvolvimento dos fatos principais — mínimo rígido de 80 palavras. Aplique a tag <strong> obrigatoriamente em todos os nomes próprios, marcas, cargos institucionais, valores numéricos e datas-chave. Máximo de 3 sentenças por parágrafo.]</p>

<p>[Segundo parágrafo desta seção — mínimo rígido de 60 palavras. Aprofunde os detalhes técnicos, dados, números e declarações contidas na fonte.]</p>

[IF_SOURCE_HAS_3_OR_MORE_DATA_OR_STEPS]
<ul>
  <li><strong>Item 1</strong> — descrição técnica detalhada com contexto extraído da fonte</li>
  <li><strong>Item 2</strong> — descrição técnica detalhada com contexto extraído da fonte</li>
  <li><strong>Item 3</strong> — descrição técnica detalhada com contexto extraído da fonte</li>
</ul>

<h2>[Subtítulo H2 com impacto macroeconômico ou institucional — 4 a 7 palavras — factual]</h2>

<p>[Parágrafo sobre o impacto prático — mínimo rígido de 80 palavras. Explique quem é afetado e qual a magnitude econômica real. Inclua dados quantitativos se disponíveis na fonte.]</p>

<p>[Segundo parágrafo desta seção — mínimo rígido de 60 palavras. Aborde as consequências fiscais, sociais ou institucionais, sempre baseado unicamente na fonte.]</p>

<h2>[Subtítulo H2 com contexto técnico ou desdobramentos — 4 a 7 palavras — factual]</h2>

<p>[Parágrafo de desdobramentos — mínimo rígido de 80 palavras. Detalhe cronogramas, votações ou decisões futuras mencionadas explicitamente na fonte. Finalize com dado técnico relevante.]</p>

<p>[Parágrafo de fechamento — mínimo rígido de 60 palavras. Situe o leitor no cenário amplo utilizando apenas dados factuais presentes na fonte. Termine de forma abrupta e seca no último ponto final, sem ganchos ou interações.]</p>

<p>#hashtag1 #hashtag2 #hashtag3 #ovalorcapital</p>

## [MÉTRICAS OBRIGATÓRIAS]
— TITULO: conte os caracteres. Mínimo 55, máximo 65. Ajuste se necessário.
— META_TITLE: máximo 55 caracteres absolutos.
— META_DESCRICAO: intervalo estrito entre 141 e 155 caracteres. Conte e ajuste.
— CORPO: mínimo 4.000 caracteres. Cada parágrafo mínimo 60 palavras, máximo 3 sentenças.
— Use a FOCO_KEYWORD pelo menos 3 vezes no CORPO de forma natural.
— Negrito obrigatório (tag <strong>): nomes de pessoas, empresas, cargos, valores numéricos e datas.

## [BLACKLIST — PROIBIÇÃO ABSOLUTA]
Se o texto contiver qualquer um destes termos, a matéria será rejeitada:
[robust, robusto, resiliente, ecossistema, disruptivo, paradigma, sinergia, catalisador, protagonista, blindar, chama atenção, vale destacar, em meio a, diante disso, acende alerta, especialistas apontam, prospecção, radiografia do fato, cenário prospectivo, vetores de risco, no tecido social, em um mundo cada vez mais, no cenário atual, vale ressaltar, de suma importância]`;

async function callOpenAI(systemKernel, userContent) {
  if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY não configurada");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemKernel },
        { role: "user",   content: userContent }
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

async function callGemini(systemKernel, userContent) {
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const key = nextGeminiKey();
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: systemKernel + "\n\n" + userContent }] }
          ],
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

function buildUserContent(data, text) {
  return `Data de hoje: ${data}\n\n<TEXTO_FONTE>\n${text}\n</TEXTO_FONTE>`;
}

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
    if (/^TITULO:/i.test(trimmed))              titulo        = trimmed.replace(/^TITULO:/i, "").trim();
    else if (/^META_TITLE:/i.test(trimmed))     metaTitle     = trimmed.replace(/^META_TITLE:/i, "").trim().slice(0, 55);
    else if (/^FOCO_KEYWORD:/i.test(trimmed))   focoKeyword   = trimmed.replace(/^FOCO_KEYWORD:/i, "").trim();
    else if (/^SLUG:/i.test(trimmed))           slug          = slugify(trimmed.replace(/^SLUG:/i, "").trim());
    else if (/^META_DESCRICAO:/i.test(trimmed)) metaDescricao = trimmed.replace(/^META_DESCRICAO:/i, "").trim();
    else if (/^SUBTITULO:/i.test(trimmed))      { if (!metaDescricao) metaDescricao = trimmed.replace(/^SUBTITULO:/i, "").trim(); }
    else if (/^CATEGORIA:/i.test(trimmed))      categoriaRaw  = trimmed.replace(/^CATEGORIA:/i, "").trim().split(/[\s→|]/)[0].toLowerCase();
    else if (/^SUBCATEGORIA:/i.test(trimmed))   subcategoriaRaw = trimmed.replace(/^SUBCATEGORIA:/i, "").trim();
    else if (/^CORPO:/i.test(trimmed))          inCorpo = true;
    else if (inCorpo)                           corpo += line + "\n";
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
  const kernel = SYSTEM_KERNEL.replace("{DATA_DE_HOJE}", hoje());
  const userContent = buildUserContent(hoje(), (title ? title + "\n\n" : "") + text);
  let raw;
  if (useGemini) {
    raw = await callGemini(kernel, userContent);
  } else {
    try {
      raw = await callOpenAI(kernel, userContent);
    } catch(e) {
      if (GEMINI_KEYS.length > 0) {
        raw = await callGemini(kernel, userContent);
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
