import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://yntwvfcxjardzafdqanj.supabase.co", process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40");

const hoje = () => new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

const OPENAI_KEY = process.env.OPENAI_API_KEY;

// PROMPT OFICIAL OVC — APROVADO PELO DONO EM 18/06/2026 — VERSÃO OVC V8.0 — NÃO ALTERAR SEM AUTORIZAÇÃO
const MASTER_PROMPT = `Você é o redator-sênior do O Valor Capital. O OVC defende liberdade econômica, livre mercado e Estado mínimo. Sua apuração não tem lado: cobra PT e PL com o mesmo rigor. Fatos não têm ideologia. Esse é o único critério.

**MISSÃO**
Transforme o INPUT em matéria jornalística publicável. Não crie. Não invente. Não extrapole além do que o INPUT confirma. Se o INPUT não sustentar uma matéria factual e completa, ou se o conteúdo gerado tiver menos de 2.500 caracteres de texto puro, retorne apenas:
<p>INCONSISTENCIA: [motivo em uma frase]</p>

**VOZ**
Escreva como Reuters em português. Lead direto no primeiro parágrafo — o fato, sem introdução. Dados e números quando disponíveis no INPUT. Declare a fonte: "segundo X", "de acordo com Y". Mínimo 8 parágrafos. O último parágrafo é um fato — nunca conclusão, moral ou previsão vaga.

**TRAVAS ABSOLUTAS**

1. Crime e invenção
Nunca afirme crime sem condenação. Nunca invente perícia, órgão, reação de mercado, bastidor ou declaração não confirmada no INPUT.

2. Isenção política
Nunca proteja nenhum lado político. O mesmo rigor para PT e PL, para Lula e Bolsonaro, para qualquer figura pública de qualquer espectro.

3. Cheiro de IA — proibição absoluta
Se qualquer termo ou padrão abaixo aparecer, reescreva o parágrafo. Se não conseguir reescrever sem eles, descarte o parágrafo.

Conectivos de enchimento: vale ressaltar, vale lembrar, cabe destacar, cabe mencionar, importa notar, convém lembrar, não se pode ignorar, é válido ressaltar, isso posto, sendo assim, desse modo, dessa forma, nesse sentido, nesse contexto, diante disso, diante desse cenário, diante desse quadro, com efeito, haja vista

Análise inventada: especialistas apontam, analistas destacam, especialistas alertam, analistas avaliam, observadores apontam, economistas alertam, isso demonstra, isso revela, isso evidencia, isso sinaliza, fica claro que, é notório que, é consenso que, é inegável que, tudo indica que

Aberturas de IA: em um mundo cada vez mais, na era digital, em tempos de, no cenário atual, a questão é complexa, o assunto é delicado, em meio a, num contexto de

Fechamento de IA: resta saber, o futuro dirá, o tempo mostrará, apenas o tempo dirá, a situação ainda é incerta, o desfecho ainda é incerto

Palavras infladas: impacto significativo, mudança significativa, transformação profunda, desafios e oportunidades, momento histórico, marco histórico, passo importante, avanço significativo, cenário de incerteza, ambiente desafiador, situação complexa, de forma significativa, de maneira geral, de forma geral, substancialmente, consideravelmente, historicamente

Notícia genérica: o assunto ganhou repercussão, o tema voltou ao debate, o debate se intensifica, as reações foram imediatas, a medida gerou controvérsia, o caso voltou a chamar atenção, a notícia causou impacto, especialistas divergem

Estruturas: não apenas X mas também Y, tanto X quanto Y, por outro lado, em outras palavras, em suma, em síntese, em linhas gerais, ou seja

4. Alucinação — tolerância zero
Cada fato, número, nome, data, cargo e valor deve estar explicitamente no INPUT. Se não está no INPUT, não existe. Não arredonde números. Não complete nomes. Não presuma datas. Não infira cargos. Não preencha lacunas. Um único fato inventado invalida a matéria inteira — retorne INCONSISTENCIA.

5. O portal não fala de si mesmo
Nunca escreva "O Valor Capital apurou", "o OVC constatou", "nossa redação", "apuramos", "constatamos", "segundo o OVC" ou qualquer variação. O texto é sobre a notícia. O veículo não aparece no corpo.

6. Nunca citar veículos concorrentes
O texto nunca menciona outro portal, site, jornal, revista, canal ou veículo de comunicação como fonte. Cite o fato diretamente na origem: o órgão que publicou o dado, a entidade que emitiu a nota, o político que declarou, o documento que confirma. "Segundo a Folha", "conforme o G1", "de acordo com o Estadão" — proibido. A assinatura é OVC. A apuração é OVC.

**FORMATO DE SAÍDA**
TITULO: [factual, impactante — máx 100 chars]
META_TITLE: [SEO — máx 55 chars]
FOCO_KEYWORD: [1 keyword]
SLUG: [url-com-hifens]
META_DESCRICAO: [120–160 chars]
CATEGORIA: [brasil-on|politica|economia|investimentos|negocios|tecnologia|internacional|saude|tributos|carreira|imoveis|seguros|industria|familia|esportes|cultura|religiao]
SUBCATEGORIA: [ou em branco]
CORPO:
[HTML puro — <p> por parágrafo — nunca markdown]`;


async function callOpenAI(systemKernel, userContent, maxTokens = 8192) {
  if (!OPENAI_KEY) throw new Error("OPENAI_API_KEY não configurada no Vercel");
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
      max_tokens: maxTokens
    })
  });
  const d = await res.json();
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${d.error?.message || ""}`);
  const text = d.choices?.[0]?.message?.content;
  if (text && text.length > 100) return text;
  throw new Error("OpenAI retornou resposta vazia");
}

let _geminiKeysCache = null;
let _geminiKeysCacheTs = 0;
async function _getGeminiKeys() {
  const now = Date.now();
  if (_geminiKeysCache && now - _geminiKeysCacheTs < 300000) return _geminiKeysCache;
  try {
    const { data } = await supabase.from("config").select("key,value").in("key", ["GEMINI_API_KEY", "GEMINI_API_KEY_2"]);
    const keys = {};
    (data || []).forEach(r => { keys[r.key] = r.value; });
    const list = [keys["GEMINI_API_KEY"], keys["GEMINI_API_KEY_2"]].filter(Boolean);
    if (list.length) { _geminiKeysCache = list; _geminiKeysCacheTs = now; return list; }
  } catch (_) {}
  return [];
}

async function _callGeminiWithKey(key, systemKernel, userContent, maxTokens) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tools: [{ google_search: {} }],
      systemInstruction: { parts: [{ text: systemKernel }] },
      contents: [{ role: "user", parts: [{ text: userContent }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: maxTokens }
    })
  });
  const d = await res.json();
  if (!res.ok) {
    const err = new Error(`Gemini ${res.status}: ${d.error?.message || JSON.stringify(d)}`);
    err.status = res.status;
    throw err;
  }
  const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text && text.length > 100) return text;
  throw new Error("Gemini retornou resposta vazia");
}

async function callGemini(systemKernel, userContent, maxTokens = 8192) {
  const keys = await _getGeminiKeys();
  if (!keys.length) throw new Error("GEMINI_API_KEY não configurada no Supabase config");
  let lastErr;
  for (const key of keys) {
    try {
      return await _callGeminiWithKey(key, systemKernel, userContent, maxTokens);
    } catch (err) {
      lastErr = err;
      if (err.status === 429) { console.warn("Gemini quota atingida, tentando próxima chave..."); continue; }
      throw err;
    }
  }
  throw lastErr;
}

async function callIA(systemKernel, userContent, maxTokens = 8192) {
  try {
    return await callGemini(systemKernel, userContent, maxTokens);
  } catch (geminiErr) {
    console.error("Gemini falhou, fallback OpenAI:", geminiErr.message);
    return await callOpenAI(systemKernel, userContent, maxTokens);
  }
}

const SUBCATS_POR_CAT = {
  politica:      ["Governo Federal","Congresso Nacional","Eleições","Partidos Políticos","STF & Judiciário","Política Estadual","Câmara dos Deputados","Senado Federal","Poder Executivo"],
  economia:      ["Política Econômica","Inflação & Preços","Taxa Selic","PIB & Crescimento","Câmbio & Dólar","Fiscal & Orçamento","Emprego & Renda","Banco Central"],
  negocios:      ["Empresas & Corporações","Fusões & Aquisições","Startups","Empreendedorismo","Grandes Corporações","Setor Privado","Varejo","Agronegócio Empresarial"],
  investimentos: ["Bolsa de Valores","Renda Fixa","Fundos de Investimento","Tesouro Direto","Criptomoedas","Análise de Mercado","Finanças Pessoais","FIIs"],
  seguros:       ["Seguro de Vida","Planos de Saúde","Seguro Auto","Previdência Privada","Seguro Residencial","SUSEP & ANS","Seguro Empresarial","Corretoras de Seguros"],
  industria:     ["Agronegócio","Manufatura","Energia","Infraestrutura","Exportações","Cadeia Produtiva","Mineração","Construção Civil"],
  tecnologia:    ["Inteligência Artificial","Segurança Digital","E-commerce","Telecomunicações","Inovação","Startups Tech","Blockchain","Computação em Nuvem"],
  esportes:      ["Futebol","Copa do Mundo","Olimpíadas","Fórmula 1","Tênis","Basquete","Atletismo","Outros Esportes"],
  saude:         ["Medicina & Tratamentos","SUS","Saúde Mental","Medicamentos","Bem-estar","Epidemiologia","Pediatria","Nutrição"],
  familia:       ["Educação dos Filhos","Planejamento Familiar","Herança & Patrimônio","Casamento & Divórcio","Finanças Pessoais","Criação de Filhos"],
  tributos:      ["IRPF","Reforma Tributária","ICMS & ISS","Receita Federal","Planejamento Tributário","Impostos Federais","Simples Nacional","CSLL & IRPJ"],
  internacional: ["Relações Exteriores","Geopolítica","Conflitos Globais","América Latina","Estados Unidos","Europa","China & Ásia","Oriente Médio"],
  cultura:       ["Cinema","Música","Arte","Teatro","Literatura","Patrimônio Cultural","Streaming","Festivais"],
  imoveis:       ["Mercado Imobiliário","Financiamento Habitacional","Construtoras","Aluguel","Lançamentos","Minha Casa Minha Vida"],
  religiao:      ["Evangelicalismo","Catolicismo","Espiritualidade","Igrejas","Fé & Sociedade","Missões","Religiões Afro-brasileiras"],
  "brasil-on":   ["Política Nacional","Fiscalização Pública","Corrupção","Movimentos Sociais","Cidadania","Direitos & Deveres","Segurança Pública","Crise Institucional"],
  carreira:      ["Mercado de Trabalho","Trabalho Remoto","Recrutamento & Seleção","Estágio & Trainee","Concursos Públicos","Pós-Graduação","Empreendedorismo Pessoal","Renda Extra"],
  // legado — aceitos mas não gerados pelo pipeline
  tributacao:    ["IRPF","Reforma Tributária","ICMS & ISS","Receita Federal","Planejamento Tributário","Impostos Federais","Simples Nacional","CSLL & IRPJ"],
  variedades:    ["Comportamento","Lifestyle","Entretenimento","Tendências","Gastronomia","Turismo","Moda"],
  seguranca:     ["Segurança Pública","Crime Organizado","Violência Urbana","Polícia Federal","Narcotráfico","Facções","Homicídios"],
  defesa:        ["Forças Armadas","Segurança Nacional","Política de Defesa","Exército","Marinha","Aeronáutica","Fronteiras"],
  educacao:      ["Ensino Superior","ENEM","Educação Básica","Cursos & Certificações","Tecnologia na Educação","Bolsas de Estudo","Ensino Técnico"],
  investigativo: ["Corrupção","Operações Policiais","Denúncias","Jornalismo de Dados","Fiscalização Pública","Lavagem de Dinheiro"],
  radar:         ["Copa do Mundo","Campeonato Brasileiro","Libertadores","Fórmula 1","Eleições","Olimpíadas","Dólar & Câmbio","Cinema & Streaming"],
};

function buildUserContent(data, text, context = '') {
  const ctxBlock = context ? `\n<CONTEXTO_EDITORIAL>\n${context}\n</CONTEXTO_EDITORIAL>\n` : '';
  return `Data de hoje: ${data}${ctxBlock}\n<TEXTO_FONTE>\n${text}\n</TEXTO_FONTE>`;
}

export function buildDynamicContext({ recentTitles = [], recentKeywords = [], recentCategories = [] } = {}) {
  const parts = [];
  if (recentTitles.length > 0) {
    parts.push(`TEMAS PUBLICADOS HOJE — NÃO repetir ângulo ou abordagem:\n${recentTitles.slice(0, 20).map(t => `— ${t}`).join('\n')}`);
  }
  if (recentKeywords.length > 0) {
    const uniq = [...new Set(recentKeywords)].slice(0, 12);
    parts.push(`KEYWORDS SATURADAS HOJE: ${uniq.join(', ')}`);
  }
  if (recentCategories.length > 0) {
    parts.push(`CATEGORIAS ATIVAS HOJE: ${recentCategories.join(', ')}`);
  }
  return parts.join('\n\n');
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

function markdownToHtml(texto) {
  if (!texto || typeof texto !== 'string') return texto;
  if (/^\s*<[a-z]/i.test(texto.trim())) {
    return texto.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  }
  const linhas = texto.split('\n');
  const saida = [];
  let listaAberta = false;
  for (const linha of linhas) {
    const t = linha.trim();
    if (!t) { if (listaAberta) { saida.push('</ul>'); listaAberta = false; } continue; }
    const conv = s => s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    const mH = t.match(/^#{1,3}\s+(.+)$/);
    if (mH) { if (listaAberta) { saida.push('</ul>'); listaAberta = false; } saida.push('<h2>' + conv(mH[1]) + '</h2>'); continue; }
    const mL = t.match(/^[\*\-]\s+(.+)$/);
    if (mL) { if (!listaAberta) { saida.push('<ul>'); listaAberta = true; } saida.push('<li>' + conv(mL[1]) + '</li>'); continue; }
    if (t.startsWith('<')) { if (listaAberta) { saida.push('</ul>'); listaAberta = false; } saida.push(conv(t)); continue; }
    if (listaAberta) { saida.push('</ul>'); listaAberta = false; }
    saida.push('<p>' + conv(t) + '</p>');
  }
  if (listaAberta) saida.push('</ul>');
  return saida.join('\n');
}

function parse(raw) {
  if (!raw) return null;
  let normalized = String(raw);
  if (/<T[IÍ]TULO\b/i.test(normalized) || /<CORPO\b/i.test(normalized)) {
    normalized = normalized
      .replace(/<T[IÍ]TULO[^>]*>([\s\S]*?)<\/T[IÍ]TULO>/gi, (_, v) => `TITULO: ${v.trim()}`)
      .replace(/<META[\s_]TITLE[^>]*>([\s\S]*?)<\/META[\s_]TITLE>/gi, (_, v) => `META_TITLE: ${v.trim()}`)
      .replace(/<FOCO[\s_]KEYWORD[^>]*>([\s\S]*?)<\/FOCO[\s_]KEYWORD>/gi, (_, v) => `FOCO_KEYWORD: ${v.trim()}`)
      .replace(/<SLUG[^>]*>([\s\S]*?)<\/SLUG>/gi, (_, v) => `SLUG: ${v.trim()}`)
      .replace(/<META[\s_]DESCRI[CÇ][AÃ]O[^>]*>([\s\S]*?)<\/META[\s_]DESCRI[CÇ][AÃ]O>/gi, (_, v) => `META_DESCRICAO: ${v.trim()}`)
      .replace(/<CATEGORIA[^>]*>([\s\S]*?)<\/CATEGORIA>/gi, (_, v) => `CATEGORIA: ${v.trim()}`)
      .replace(/<SUBCATEGORIA[^>]*>([\s\S]*?)<\/SUBCATEGORIA>/gi, (_, v) => `SUBCATEGORIA: ${v.trim()}`)
      .replace(/<CORPO\b[^>]*>([\s\S]*?)<\/CORPO[^>]*>/gi, (_, v) => `CORPO EM HTML:\n${v.trim()}`);
  }
  const lines = normalized.split("\n");
  let titulo = "", metaTitle = "", focoKeyword = "", slug = "", metaDescricao = "", categoriaRaw = "", subcategoriaRaw = "", auditoriaOvc = "", corpo = "";
  let inCorpo = false, inAuditoria = false;
  const auditLines = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (inAuditoria) {
      auditLines.push(line);
      if (trimmed === "}" || trimmed.endsWith("}")) {
        inAuditoria = false;
        auditoriaOvc = auditLines.join("\n");
      }
      continue;
    }
    if (/^T[IÍ]TULO:/i.test(trimmed))             titulo        = trimmed.replace(/^T[IÍ]TULO:/i, "").trim();
    else if (/^META_TITLE:/i.test(trimmed))        metaTitle     = trimmed.replace(/^META_TITLE:/i, "").trim().slice(0, 55);
    else if (/^META TITLE:/i.test(trimmed))        metaTitle     = metaTitle || trimmed.replace(/^META TITLE:/i, "").trim().slice(0, 55);
    else if (/^FOCO_KEYWORD:/i.test(trimmed))      focoKeyword   = trimmed.replace(/^FOCO_KEYWORD:/i, "").trim();
    else if (/^FOCO KEYWORD:/i.test(trimmed))      focoKeyword   = focoKeyword || trimmed.replace(/^FOCO KEYWORD:/i, "").trim();
    else if (/^SLUG:/i.test(trimmed))              slug          = slugify(trimmed.replace(/^SLUG:/i, "").trim());
    else if (/^META_DESCRI/i.test(trimmed))        metaDescricao = trimmed.replace(/^META_DESCRI[^:]*:/i, "").trim();
    else if (/^META DESCRI/i.test(trimmed))        metaDescricao = metaDescricao || trimmed.replace(/^META DESCRI[^:]*:/i, "").trim();
    else if (/^SUBTITULO:/i.test(trimmed))         { if (!metaDescricao) metaDescricao = trimmed.replace(/^SUBTITULO:/i, "").trim(); }
    else if (/^CATEGORIA:/i.test(trimmed))         categoriaRaw  = trimmed.replace(/^CATEGORIA:/i, "").trim().split(/[\s→|]/)[0].toLowerCase();
    else if (/^SUBCATEGORIA:/i.test(trimmed))      subcategoriaRaw = trimmed.replace(/^SUBCATEGORIA:/i, "").trim();
    else if (/^AUDITORIA_OVC:/i.test(trimmed)) {
      const afterColon = trimmed.replace(/^AUDITORIA_OVC:/i, "").trim();
      if (afterColon.startsWith("{") && !afterColon.includes("}")) {
        auditLines.push(afterColon);
        inAuditoria = true;
      } else {
        auditoriaOvc = afterColon;
      }
    }
    else if (/^CORPO(?: EM HTML)?:/i.test(trimmed)) inCorpo = true;
    else if (inCorpo)                              corpo += line + "\n";
  }

  titulo = titulo.replace(/\*\*/g, '').replace(/^#+\s*/, '').trim();

  corpo = corpo.trim();
  if (!corpo && normalized.length > 200) {
    corpo = normalized.trim();
    const firstLine = normalized.split("\n")[0].trim();
    if (firstLine.length < 120 && firstLine.length > 5) titulo = titulo || firstLine;
  }

  if (corpo) corpo = markdownToHtml(corpo);

  const catsValidas = ["politica","economia","negocios","investimentos","seguros","industria",
    "tecnologia","esportes","saude","familia","tributos","internacional",
    "cultura","imoveis","religiao","brasil-on","carreira",
    // legado
    "tributacao","variedades","seguranca","defesa","educacao","investigativo","radar"];
  if (!catsValidas.includes(categoriaRaw)) categoriaRaw = "economia";

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
    auditoria_ovc: auditoriaOvc || "APROVADO",
    corpo
  };
}

export function normalizarParagrafos(html) {
  if (!html) return html;
  let prev, result = html, passes = 0;
  do {
    prev = result;
    result = result.replace(/<p>([\s\S]+?)<\/p>/gi, function(match, inner) {
      if (inner.length < 350) return match;
      const partes = inner.split(/([.!?]\s+)/);
      const frases = [];
      let buf = '';
      for (let i = 0; i < partes.length; i++) {
        buf += partes[i];
        if (/[.!?]\s*$/.test(buf) && buf.trim().length > 60) {
          frases.push(buf.trim());
          buf = '';
        }
      }
      if (buf.trim()) frases.push(buf.trim());
      if (frases.length <= 1) return match;
      const maxPorGrupo = passes === 0 ? 3 : 2;
      let out = '', chunk = '', count = 0;
      frases.forEach(function(f) {
        chunk += (chunk ? ' ' : '') + f;
        count++;
        if (count >= maxPorGrupo) { out += '<p>' + chunk + '</p>\n'; chunk = ''; count = 0; }
      });
      if (chunk) out += '<p>' + chunk + '</p>';
      return out;
    });
    passes++;
  } while (result !== prev && passes < 5);
  return result;
}

const PROIBIDOS_ABERTURA = ["prezado", "caro", "dear", "editor(a)", "redator-chefe", "headline:", "assunto:", "erro:", "teste:"];

const OVC_REPAIR_BASE = `
REESCRITA CORRETIVA OVC:
- Nunca inventar fatos, datas, valores, fontes, crimes, intencoes ou declaracoes.
- Usar apenas fatos verificaveis do material recebido. Se algo for incerto, escrever [VERIFICAR].
- O artigo final deve ser diferente da fonte: novo angulo, nova estrutura, nova abertura e analise propria.
- Proibido copiar, resumir mecanicamente ou apenas trocar palavras da fonte.
- Padrao OVC: texto humano, juridicamente cauteloso, factual, com atribuicao quando houver numero ou acusacao.
- Para materia padrao, mirar 4.000 caracteres minimos no CORPO. Curto pode; pobre nao pode.
- Usar paragrafos curtos: cada <p> com no maximo 3 frases e 350 caracteres.
`;

const OVC_REPAIR_RULES = `${OVC_REPAIR_BASE}
- Retornar exatamente os mesmos campos tecnicos do formato OVC, sem texto antes ou depois.
`;

const COLUNA_REPAIR_RULES = `${OVC_REPAIR_BASE}
- Isto e uma COLUNA ASSINADA, nao uma materia da redacao.
- Proibido usar "Redacao OVC", "Redação OVC" ou assinatura institucional no CORPO.
- A assinatura obrigatoria deve ser do proprio colunista informado no kernel.
- O fechamento deve soar autoral, sem formula fixa.
- Retornar exatamente os mesmos campos tecnicos do formato da coluna, sem texto antes ou depois.
`;

function auditarConteudoOVC(result, opts = {}) {
  const corpo = result?.corpo || "";
  const titulo = (result?.titulo || "").toLowerCase().trim();
  const issues = [];
  if (!result || !result.titulo || !corpo) issues.push("estrutura incompleta");
  if (titulo.length < 15 || titulo.length > 120) issues.push("titulo fora do tamanho seguro");
  if (PROIBIDOS_ABERTURA.some(p => titulo.startsWith(p) || corpo.slice(0, 160).toLowerCase().includes(p))) issues.push("abertura invalida");
  if (opts.minChars) {
    const textoLimpo = corpo.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (textoLimpo.length < opts.minChars) issues.push(`corpo curto: ${textoLimpo.length}/${opts.minChars} chars puro`);
  }
  if (opts.minParagraphs && (corpo.match(/<p>/gi) || []).length < opts.minParagraphs) issues.push("poucos paragrafos");
  if (opts.requireSignature) {
    const sigPat = opts.signaturePattern || /<p>\s*<strong>Reda/i;
    if (!sigPat.test(corpo)) issues.push("assinatura ausente");
  }
  if (opts.forbidOvcSignature && /Reda(?:ç|c|&ccedil;)ao OVC|Reda(?:ç|c|&ccedil;)[aã]o OVC/i.test(corpo)) issues.push("assinatura Redacao OVC proibida em coluna");
  if (opts.forbidOvcConclusion && /<h2[^>]*>\s*Conclus(?:a|ã|&atilde;)o OVC\s*<\/h2>/i.test(corpo)) issues.push("Conclusao OVC proibida em coluna");
  if (/\*\*|^##|\n##|\n\s*[-*]\s+/m.test(corpo)) issues.push("markdown no corpo");
  return issues;
}

function buildRepairContent(originalUserContent, issues) {
  return `${originalUserContent}\n\nO conteudo anterior falhou na auditoria editorial OVC:\n${issues.map(i => `- ${i}`).join("\n")}\n\nReescreva integralmente agora, corrigindo os pontos acima e obedecendo ao padrao editorial.`;
}

function limparCorpoColuna(corpo, colunistaNome) {
  let out = String(corpo || "");
  out = out
    .replace(/<p>\s*<strong>\s*Reda(?:ç|c|&ccedil;)[aã]o OVC\s*<\/strong>\s*(?:—|&mdash;|-)\s*[^<]*<\/p>\s*/gi, "")
    .replace(/<h2[^>]*>\s*Conclus(?:a|ã|&atilde;)o OVC\s*<\/h2>\s*/gi, "");
  if (colunistaNome && !new RegExp(`<p>\\s*<strong>\\s*${colunistaNome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(out)) {
    out = `<p><strong>${colunistaNome}</strong> &mdash; ${hoje()}</p>\n${out.trim()}`;
  }
  return out.trim();
}

function _isBloqueioPauta(raw) {
  if (!raw) return false;
  const texto = String(raw).replace(/<[^>]*>/g, "").trim();
  return /^INCONSISTENCIA:/i.test(texto) && texto.length < 500;
}

async function gerarComRevisao(kernel, userContent, {
  maxTokens = 8192,
  auditOptions = {},
  tipoConteudo = "padrao"
} = {}) {
  const repairRules = tipoConteudo === "coluna" ? COLUNA_REPAIR_RULES : OVC_REPAIR_RULES;
  let raw = await callIA(kernel + "\n\n" + repairRules, userContent, maxTokens);

  // Detectar bloqueio editorial antes de parsear
  if (_isBloqueioPauta(raw)) {
    throw new Error(`Bloqueio editorial: ${raw.replace(/<[^>]*>/g, "").trim().slice(0, 300)}`);
  }

  let result = parse(raw);

  // Detectar bloqueio no campo corpo
  if (result?.corpo && _isBloqueioPauta(result.corpo)) {
    throw new Error(`Bloqueio editorial: ${result.corpo.replace(/<[^>]*>/g, "").trim().slice(0, 300)}`);
  }

  let issues = auditarConteudoOVC(result, auditOptions);
  if (issues.length > 0) {
    raw = await callIA(kernel + "\n\n" + repairRules, buildRepairContent(userContent, issues), maxTokens);

    // Detectar bloqueio na retentativa
    if (_isBloqueioPauta(raw)) {
      throw new Error(`Bloqueio editorial na revisão: ${raw.replace(/<[^>]*>/g, "").trim().slice(0, 300)}`);
    }

    result = parse(raw);
    issues = auditarConteudoOVC(result, auditOptions);
  }
  if (issues.length > 0) {
    throw new Error(`Conteudo fora do padrao OVC apos reescrita corretiva: ${issues.join("; ")}`);
  }
  result.tipo_conteudo = tipoConteudo;
  result.corpo = normalizarParagrafos(result.corpo);
  return result;
}

export async function rewritePortalManual(text, title, context = '', useGemini = false) {
  const kernel = MASTER_PROMPT;
  const userContent = buildUserContent(hoje(), (title ? title + "\n\n" : "") + text, context);
  return gerarComRevisao(kernel, userContent, {
    auditOptions: { minChars: 1800, minParagraphs: 8 },
    tipoConteudo: "padrao"
  });
}

export async function rewritePortal(text, title, context = '', useGemini = false) {
  const kernel = MASTER_PROMPT;
  const userContent = buildUserContent(hoje(), (title ? title + "\n\n" : "") + text, context);
  return gerarComRevisao(kernel, userContent, {
    auditOptions: { minChars: 1800, minParagraphs: 8 },
    tipoConteudo: "padrao"
  });
}

export async function rewriteEsportes(text, title, context = '') {
  const kernel = MASTER_PROMPT;
  const userContent = buildUserContent(hoje(), (title ? title + "\n\n" : "") + text, context);
  return gerarComRevisao(kernel, userContent, {
    auditOptions: { minChars: 1800, minParagraphs: 8 },
    tipoConteudo: "padrao"
  });
}

export function auditarArtigo(titulo, corpo, categoria) {
  const texto = (corpo || "").replace(/<[^>]+>/g, " ").toLowerCase();
  const violacoes = [];
  const VICIOSAI = [
    "vale destacar","cabe ressaltar","nesse contexto","diante desse cenário",
    "diante desse cenario","por outro lado","no entanto","além disso","alem disso",
    "por sua vez","sendo assim","em suma","por fim",
    "resta acompanhar","o futuro dirá","o futuro dira",
    "os próximos meses serão decisivos","os proximos meses serao decisivos",
    "especialistas apontam","é importante ressaltar","e importante ressaltar",
    "é importante destacar","e importante destacar",
    "não apenas","nao apenas","vai muito além","vai muito alem",
    "a seguir, apresentamos","a seguir confira","veja a seguir",
    "jornada","ecossistema","desafios e oportunidades",
    "reforça compromisso","reforça o compromisso","movimento estratégico",
    "marco importante","novo capítulo","novo capitulo",
    "divisor de águas","divisor de aguas",
    "a empresa busca ampliar","a iniciativa visa",
    "o caso reacende debate","reacende o debate",
    "gera críticas","gera criticas",
    "o mercado vê","o mercado ve",
    "investidores temem","a população se revolta","a populacao se revolta",
    "não se trata apenas","nao se trata apenas",
    "posto isto","sob essa ótica","sob essa otica",
    "cabe lembrar","vale lembrar","vale notar","ao mesmo tempo","dessa forma"
  ];
  const VICIOSESPORTE = [
    "mostrou resiliência","mostrou resiliencia","buscou ampliar a vantagem",
    "equipe conseguiu se reorganizar","equipe se reagrupou","em busca do empate",
    "lutou bastante","fez uma grande partida","foi soberano","mostrou garra",
    "batalhou muito","contou com a sorte","saiu de cabeça erguida","saiu de cabeca erguida"
  ];
  const vFoundAI = VICIOSAI.filter(v => texto.includes(v));
  if (vFoundAI.length > 1) violacoes.push(`vícios de IA: ${vFoundAI.join(", ")}`);
  if (categoria === "esportes") {
    const vFoundEs = VICIOSESPORTE.filter(v => texto.includes(v));
    if (vFoundEs.length > 0) violacoes.push(`frases proibidas esportes: ${vFoundEs.join(", ")}`);
  }
  const ps = [...(corpo || "").matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)];
  if (ps.length > 0) {
    const lastP = ps[ps.length - 1][1].replace(/<[^>]+>/g, "").toLowerCase();
    const FECHAMENTOS = [
      "resta acompanhar","o futuro dirá","o futuro dira","aguarda-se",
      "a população aguarda","a populacao aguarda","o mercado espera",
      "acompanhar os desdobramentos"
    ];
    if (FECHAMENTOS.some(f => lastP.includes(f))) violacoes.push("fechamento genérico no último parágrafo");
  }
  const RISCO = [/ cometeu o crime/, / desviou recursos/, / recebeu propina/, / fraudou /, / participou do esquema/];
  if (RISCO.some(rx => rx.test(texto))) violacoes.push("risco jurídico: culpabilidade sem atribuição");
  const nota = Math.max(0, 10 - (violacoes.length * 1.5) - (vFoundAI.length * 0.3));
  const aprovado = violacoes.length === 0 || (violacoes.length === 1 && nota >= 8.5);
  return { aprovado, nota: Math.round(nota * 10) / 10, violacoes };
}

export async function rewritePilula(text, title, context = '') {
  const kernel = MASTER_PROMPT;
  const userContent = buildUserContent(hoje(), (title ? title + "\n\n" : "") + text, context);
  return gerarComRevisao(kernel, userContent, {
    auditOptions: { minChars: 1200, minParagraphs: 4 },
    tipoConteudo: "pilula"
  });
}

export async function rewriteMicroPilula(text, title, context = '') {
  const kernel = MASTER_PROMPT;
  const userContent = buildUserContent(hoje(), (title ? title + "\n\n" : "") + text, context);
  return gerarComRevisao(kernel, userContent, {
    maxTokens: 4096,
    auditOptions: { minChars: 1200, minParagraphs: 3 },
    tipoConteudo: "micropilula"
  });
}

// ── MAPA DE COLUNISTAS OVC ──
export const COLUNISTAS_OVC = {
  'Roberto Terrasan': {
    nome: 'Roberto Terrasan',
    tom: 'Visceral, feroz, incansável na busca pela verdade. Patriota convicto, defensor da família e dos valores conservadores. Posicionado à direita. Linguagem direta, sem meias palavras. Critica com dados e argumentos, nunca com eufemismos. Incorruptível e implacável com o poder quando age contra o povo.'
  },
  'Beta Ferreira': {
    nome: 'Beta Ferreira',
    tom: 'Intelectual, elegante, provocativa e investigativa. Conservadora de alto nível. Escreve com a sofisticação dos maiores jornais globais — The Economist, Le Monde, El País. Argumentos precisos, ironia refinada, profundidade analítica sem pedantismo.'
  },
  'Adriana Ferreira': {
    nome: 'Adriana Ferreira',
    tom: 'Intelectual, elegante, provocativa e investigativa. Conservadora de alto nível. Escreve com a sofisticação dos maiores jornais globais — The Economist, Le Monde, El País. Argumentos precisos, ironia refinada, profundidade analítica sem pedantismo.'
  },
  'Michele Froiz': {
    nome: 'Michele Froiz',
    tom: 'Leve, sutil, comunicativa. Fala a língua da galera sem perder substância. Tom próximo, acessível, com leveza que não trivializa — conservadora sem ser sisuda. Conecta política e cotidiano com naturalidade.'
  },
  'Coluna OVC': {
    nome: 'Coluna OVC',
    tom: 'Padrão editorial OVC em formato coluna. Conservador, posicionado à direita. Analítico, factual, sem sensacionalismo. Voz institucional do portal: segura, autoritativa, comprometida com a verdade.'
  },
  'Prof. Marcos Pizzolatto': {
    nome: 'Prof. Marcos Pizzolatto',
    tom: 'Filosófico, profundo, socrático. Professor e crítico político que desmonta argumentos progressistas com rigor intelectual e método filosófico. Usa Aristóteles, Hayek, Burke e Tocqueville com naturalidade. Cada coluna é uma aula.'
  },
  'Gabriel Thiede': {
    nome: 'Gabriel Thiede',
    tom: 'Didático, acessível, prático. Professor de finanças pessoais que ensina o leitor a tomar decisões financeiras melhores. Linguagem simples, exemplos concretos, sem jargão desnecessário. Conservador no sentido de preservar patrimônio e construir independência.'
  },
  'Fabiana Campos': {
    nome: 'Fabiana Campos',
    tom: 'Jornalística clássica: factual, objetiva, rigorosa. Conservadora com compromisso apuratório. Escreve como se cada linha pudesse ser questionada — e estaria certa. Sem opinião gratuita, apenas fatos e análise fundamentada.'
  },
  'Larissa Corvetto': {
    nome: 'Larissa Corvetto',
    tom: 'Incisiva, analítica, cirúrgica na crítica política. Desmonta narrativas progressistas com dados e lógica. Linguagem direta, argumentos afiados, tolerância zero com falsidades do poder. Conservadora declarada e sem desculpas.'
  },
  'Taísa da Fonseca': {
    nome: 'Taísa da Fonseca',
    tom: 'Inspiradora, feminina, empreendedora. Fala de negócios, moda, independência financeira e empoderamento feminino com elegância e pragmatismo. Conservadora que acredita que a mulher se emancipa pelo mérito e pela família, não pela ideologia.'
  },
  'André Oliveira': {
    nome: 'André Oliveira',
    tom: 'Experiente, equilibrado, jornalista de carreira. Temas amplos, abordagem clássica. Escreve com a maturidade de décadas de redação — preciso, sem sensacionalismo, respeitado mesmo por quem discorda. Conservador moderado.'
  },
};

function buildColunaKernel(colunistaNome) {
  const c = COLUNISTAS_OVC[colunistaNome];
  if (!c) throw new Error(`Colunista não encontrado: ${colunistaNome}`);
  return `# COLUNA OVC — ${c.nome.toUpperCase()}

Você está escrevendo uma COLUNA ASSINADA por ${c.nome} para o portal O Valor Capital.

IDENTIDADE DO COLUNISTA:
Nome: ${c.nome}
Tom e estilo: ${c.tom}

FUNÇÃO: Produzir uma coluna de opinião analítica com a voz autêntica e inconfundível de ${c.nome}. O texto deve soar como escrito pela própria pessoa — não como gerado por IA.

IDIOMA: Português brasileiro.

PROTOCOLO ANTI-PADRÃO IA:
Evitar: vale destacar | cabe ressaltar | nesse contexto | diante disso | acende alerta | especialistas apontam | em um mundo cada vez mais | no cenário atual | análise estratégica | reflexões finais | considerações finais | palavras finais

ESTRUTURA DA COLUNA:
— Abertura impactante sem <h2> — gancho pessoal ou factual que define o ponto de vista
— 3 a 6 seções com <h2> desenvolvendo o argumento central
— Fechamento contundente sem fórmula — a última linha deve ter peso

FORMATO DE SAÍDA OBRIGATÓRIO — retornar EXATAMENTE estes campos:
TITULO: [título da coluna — 50 a 70 caracteres — com voz do colunista]
META_TITLE: [máximo 55 caracteres]
FOCO_KEYWORD: [2 a 4 palavras — tema central]
SLUG: [4 a 5 palavras hifenizadas sem acento]
META_DESCRICAO: [entre 141 e 155 caracteres — frase única contínua]
CATEGORIA: [UMA: politica | economia | negocios | investimentos | tributacao | internacional | variedades | cultura | familia | defesa | religiao]
SUBCATEGORIA: [subcategoria específica]
CORPO:
<p><strong>${c.nome}</strong> — {DATA_DE_HOJE}</p>

[HTML completo com: <p>, <h2>, <strong>.
PROIBIDO: markdown, <ul>, perguntas retóricas ao leitor, ganchos de engajamento.
Cada <p> MÁXIMO 3 frases e MÁXIMO 350 caracteres.
<strong> em nomes, datas e dados-chave.
MÍNIMO 8.000 caracteres no CORPO total.]`;
}

export async function rewriteColuna(colunistaNome, tema, referencias = '', contexto = '') {
  const kernel = buildColunaKernel(colunistaNome).replace(/{DATA_DE_HOJE}/g, hoje());
  const parts = [`TEMA DA COLUNA: ${tema}`];
  if (referencias) parts.push(`REFERÊNCIAS E LINKS: ${referencias}`);
  if (contexto) parts.push(`CONTEXTO ADICIONAL: ${contexto}`);
  const userContent = parts.join('\n\n');
  const result = await gerarComRevisao(kernel, userContent, {
    maxTokens: 16000,
    auditOptions: { minChars: 4000, minParagraphs: 9, forbidOvcSignature: true, forbidOvcConclusion: true },
    tipoConteudo: "coluna"
  });
  result.colunista = colunistaNome;
  result.corpo = limparCorpoColuna(result.corpo, colunistaNome);
  return result;
}
