import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://yntwvfcxjardzafdqanj.supabase.co", process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40");

const hoje = () => new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

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

let _geminiKeysCache = null;
let _geminiKeysCacheTs = 0;
// 18/08/2026 — Roberto autorizou criar novos projetos Google (contas/AI Studio
// separados) para somar mais cota grátis de 20/dia cada (ver sessão 17/08/2026 —
// teto real confirmado por projeto, as chaves de um mesmo projeto dividem o
// mesmo pool, não somam). Generalizado para buscar GEMINI_API_KEY,
// GEMINI_API_KEY_2 ... até GEMINI_API_KEY_20 dinamicamente do Supabase config —
// basta Roberto inserir uma nova linha (GEMINI_API_KEY_3, _4, etc.) que ela
// entra no rodízio automaticamente, sem precisar de novo deploy.
const GEMINI_MAX_KEYS = 20;
async function _getGeminiKeys() {
  const now = Date.now();
  if (_geminiKeysCache && now - _geminiKeysCacheTs < 300000) return _geminiKeysCache;
  try {
    const wantedKeys = ["GEMINI_API_KEY"];
    for (let i = 2; i <= GEMINI_MAX_KEYS; i++) wantedKeys.push(`GEMINI_API_KEY_${i}`);
    const { data } = await supabase.from("config").select("key,value").in("key", wantedKeys);
    const keys = {};
    (data || []).forEach(r => { keys[r.key] = r.value; });
    const list = wantedKeys.map(k => keys[k]).filter(Boolean);
    if (list.length) { _geminiKeysCache = list; _geminiKeysCacheTs = now; return list; }
  } catch (_) {}
  return [];
}

async function _callGeminiWithKey(key, systemKernel, userContent, maxTokens) {
  // 17/08/2026 — Roberto contestou (com razão) o "limite de 20/dia" como explicação
  // completa: "nós chegamos a ter 200, até 300 conteudos por dia com esta mesma
  // configuracao e nunca travou". Investigação real (não suposição) confirmou:
  // o "gemini-2.0-flash" usado por meses tinha cota GRÁTIS de 1.500/dia — 75x
  // mais que o "gemini-2.5-flash" (20/dia, confirmado de novo ao vivo em
  // 17/08/2026, mesmo erro 429 com quotaValue:"20"). A troca para 2.5-flash foi
  // forçada pela descontinuação do 2.0-flash pelo Google (16/08/2026) — não é
  // "sempre foi assim", mudou porque o MODELO mudou. Fix: usar o apelido
  // "gemini-flash-latest" (o Google sempre aponta pro modelo flash atual dele —
  // hoje é o gemini-3.7-flash, testado ao vivo e confirmado com cota livre,
  // sem o teto de 20) em vez de fixar um nome de modelo específico que o Google
  // pode descontinuar/reduzir a cota de novo no futuro sem aviso.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // 17/08/2026 — Roberto autorizou desligar a busca ao vivo do Google (tools:
      // google_search): estava com cota própria, separada da cota do modelo, e
      // travando o pipeline mesmo com chave nova. Como a reescrita já trabalha
      // em cima do texto da fonte confiável (não pesquisa aberta) e o prompt já
      // proíbe inventar fato fora do input, a busca ao vivo era só uma camada
      // extra — desligar não muda o formato/regras do prompt (Regra Zero-B
      // respeitada, nada do MASTER_PROMPT foi tocado).
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

// 17/08/2026 — CORREÇÃO DE UM ERRO MEU NO MESMO DIA: cheguei a elevar este
// número pra 300 achando que "gemini-flash-latest" tinha escapado do teto de
// 20/dia — várias chamadas diretas de teste tinham sucesso sem 429. Errado.
// Confirmado poucos minutos depois com evidência real, em produção: um 429
// legítimo do Google, mensagem completa "Quota exceeded for metric:
// generate_content_free_tier_requests, limit: 20, model: gemini-3.7-flash"
// (gemini-flash-latest resolve pra gemini-3.7-flash hoje). Ou seja: o teto de
// 20 requisições/dia/projeto do free tier NÃO é exclusivo do modelo antigo —
// vale pra qualquer modelo flash "padrão" do Google (só o "gemini-2.0-flash",
// descontinuado, tinha o teto maior de 1.500/dia). As duas chaves
// (GEMINI_API_KEY e GEMINI_API_KEY_2) parecem compartilhar o mesmo projeto
// Google Cloud — os 429 batem nas duas juntas, não uma de cada vez.
//
// 17/08/2026 (continuação) — TESTE REAL E EXAUSTIVO confirmou uma saída
// GRÁTIS de verdade: "gemini-flash-lite-latest" (resolve hoje pra
// gemini-3.5-flash-lite, um modelo DIFERENTE de gemini-flash-latest/
// gemini-3.7-flash — quota separada, confirmado por 44 chamadas reais e
// consecutivas sem bater NENHUM 429 diário). Achado por teste, não por
// documentação — a página oficial de rate-limits do Google não publica RPD
// por modelo do free tier (só diz "veja no AI Studio", que este sandbox não
// acessa; os números grandes tipo 10M/500M ali são de Batch API paga,
// irrelevantes aqui). O teto real de RPD deste modelo não foi encontrado
// (44 chamadas não bastaram pra esgotar) — só confirmado que é MAIOR que 44,
// e que tem RPM=15/min separado (confirmado via 429 real depois de 14
// chamadas em sequência sem espera — por isso o código já respeita esse
// limite de rajada através do retry/dual-key normal, sem rajada artificial).
// LIÇÃO: nunca declarar "escapou do teto" sem esgotar de verdade (foi
// exatamente o erro do "300" logo acima) — aqui o teste foi até bater 429
// de verdade OU passar de 40+ chamadas reais sem nenhum, então a confiança é
// maior, mas ainda não é uma garantia absoluta de teto infinito.
// 17/08/2026 (continuação 2) — Roberto pediu volume mínimo garantido de
// 110-120 conteúdos/dia. Elevado de 18 pra 200 — não é uma alegação de que
// o teto REAL do Google é 200 (continua desconhecido, só confirmado >44).
// Este número é um gate LOCAL/interno, não o limite do Google: serve só pra
// não desperdiçar tempo de scrape+IA em chamadas fadadas a falhar depois que
// JÁ SABEMOS que a cota do dia acabou. Subir esse número não cria risco novo —
// se o teto real do Google for menor que 200, as chamadas simplesmente vão
// começar a bater 429 de verdade (o código já trata isso: tenta a outra
// chave, depois cai pro fallback) em vez de serem bloqueadas cedo demais por
// um teto interno artificialmente baixo. 18 estava ativamente atrapalhando o
// volume pedido por Roberto sem nenhum benefício real. Cada tentativa (sucesso
// OU falha) consome 1 do orçamento — o volume de CHAMADAS necessário pra
// chegar em 110-120 artigos PUBLICADOS é maior que 120 (dedup/validação/etc.
// também gastam tentativas) — monitorar produção real nos próximos dias e
// reajustar (pra cima ou pra baixo) com base em evidência, não suposição.
//
// 17/08/2026 (continuação) — Roberto: "o sistema de geracao de materias
// esta travado". Causa raiz real confirmada: o contador diário bateu
// exatamente 200/200 (consultado direto no Supabase), fazendo TODO canal
// (materias, Brasil ON, Jovem Pan, Internacional etc.) cair no
// orcamentoEsgotado sem sequer chamar o Google — e caiam pro Groq, que por
// sua vez estava morto (modelo llama-3.3-70b-versatile removido pelo Groq,
// ver _callGroq() abaixo). Testado ao vivo, com evidência real (não
// suposição): 4 chamadas diretas ao Gemini, feitas DEPOIS do contador
// interno já estar em 200/200, todas retornaram HTTP 200 — ou seja, o teto
// real do Google HOJE não está em 200, o gate interno é que ficou
// artificialmente baixo demais pro volume real de uso. Subido pra 500 —
// ainda é só um gate de eficiência local, não uma alegação sobre o teto
// real do Google (que segue desconhecido). Se 500 também se provar baixo
// ou alto demais, ajustar de novo com base em evidência real (429 de
// verdade vindo do Google), nunca em suposição.
const GEMINI_DAILY_BUDGET = 500;
const GEMINI_MODEL = "gemini-flash-lite-latest"; // 17/08/2026 — trocado de gemini-flash-latest (20/dia) pra este (quota separada, > 44/dia confirmado ao vivo). Nome único, usado tanto na URL quanto na chave do contador abaixo

function _diaAtualBRT() {
  const brt = new Date(Date.now() - 3 * 60 * 60 * 1000); // BRT = UTC-3
  return brt.toISOString().slice(0, 10).replace(/-/g, "");
}

// 17/08/2026 — a chave do contador inclui o NOME DO MODELO, não só a data.
// Motivo: ao trocar de modelo (ex: gemini-2.5-flash → gemini-flash-latest,
// mesmo commit), o contador do modelo antigo ficava "cheio" (a cota real do
// Google para aquele modelo específico já tinha esgotado) e continuava
// bloqueando TODAS as chamadas do dia mesmo depois da troca — o modelo novo
// tem cota própria e separada no Google, então o contador precisa resetar
// junto com a troca de modelo, não só à meia-noite. Confirmado ao vivo: o
// primeiro teste pós-deploy do fix de modelo ainda bloqueou com
// "Orçamento diário esgotado (18/18)" — contador estava contando as
// chamadas do gemini-2.5-flash antigo contra o teto do modelo novo.
function _chaveOrcamentoHoje() {
  return `GEMINI_BUDGET_${_diaAtualBRT()}_${GEMINI_MODEL}`;
}

let _orcamentoCache = null; // { key, count }
async function _lerOrcamentoDiario() {
  const key = _chaveOrcamentoHoje();
  if (_orcamentoCache && _orcamentoCache.key === key) return _orcamentoCache.count;
  try {
    const { data } = await supabase.from("config").select("value").eq("key", key).maybeSingle();
    const count = data ? parseInt(data.value, 10) || 0 : 0;
    _orcamentoCache = { key, count };
    return count;
  } catch (_) {
    return 0; // se a leitura falhar, não bloqueia (fail-open — nunca trava o pipeline por causa do próprio gate)
  }
}

// Update-se-existir-a-linha, senão insert — NUNCA .upsert(...,{onConflict:"key"}).
// A tabela config não tem constraint unique/PK na coluna key; upsert com
// onConflict falha silenciosamente nesse schema (causa raiz real documentada
// em 13/08/2026 — card Internacional travado por exatamente este motivo).
async function _incrementarOrcamentoDiario() {
  const key = _chaveOrcamentoHoje();
  try {
    const atual = await _lerOrcamentoDiario();
    const novo = atual + 1;
    const { data: existing } = await supabase.from("config").select("key").eq("key", key).maybeSingle();
    if (existing) {
      await supabase.from("config").update({ value: String(novo) }).eq("key", key);
    } else {
      await supabase.from("config").insert({ key, value: String(novo) });
    }
    _orcamentoCache = { key, count: novo };
  } catch (_) {} // falha ao gravar o contador não pode derrubar a chamada de IA em si
}

async function callGemini(systemKernel, userContent, maxTokens = 8192) {
  const keys = await _getGeminiKeys();
  if (!keys.length) throw new Error("GEMINI_API_KEY não configurada no Supabase config");

  const usoHoje = await _lerOrcamentoDiario();
  if (usoHoje >= GEMINI_DAILY_BUDGET) {
    const err = new Error(`Orçamento diário do Gemini esgotado (${usoHoje}/${GEMINI_DAILY_BUDGET}) — aguardando reset 00:00 BRT`);
    err.orcamentoEsgotado = true;
    throw err;
  }

  // 17/08/2026 — 503 "high demand" confirmado como transitório, não cota nem
  // modelo morto: testado ao vivo, uma chamada simples logo após um 503 real
  // no pipeline completo teve sucesso imediato nas duas chaves. Google já
  // documenta esse erro como "usually temporary" — vale a pena tentar de
  // novo. 429 é o OPOSTO: é a cota real do dia batida, e não volta em 2
  // segundos — insistir só gasta mais chamadas reais contra o Google à toa
  // (e infla o contador local sem chance nenhuma de sucesso). Por isso a 2ª
  // rodada abaixo só acontece se pelo menos uma das duas chaves bateu 503 na
  // 1ª rodada — se as duas bateram só 429, desiste na hora.
  //
  // Achado real 17/08/2026 (madrugada): com a versão anterior deste código,
  // que retentava 429 igual a 503, os 7 canais automáticos disparando juntos
  // logo depois da virada do dia inflaram o contador local pra 161 num único
  // dia — a maioria eram tentativas repetidas contra uma cota de 20/dia já
  // esgotada, não chamadas novas. Fix abaixo reduz esse desperdício.
  let lastErr;
  for (let rodada = 0; rodada < 2; rodada++) {
    let teve503 = false;
    for (const key of keys) {
      try {
        const result = await _callGeminiWithKey(key, systemKernel, userContent, maxTokens);
        await _incrementarOrcamentoDiario(); // consumiu 1 requisição real da cota do dia
        return result;
      } catch (err) {
        lastErr = err;
        if (err.status === 429) {
          await _incrementarOrcamentoDiario(); // 429 é sinal real de cota — conta
          console.warn("Gemini quota atingida, tentando próxima chave...");
          continue;
        }
        if (err.status === 503) {
          teve503 = true;
          console.warn("Gemini 503 (sobrecarga temporária do Google), tentando próxima chave...");
          continue;
        }
        throw err;
      }
    }
    if (rodada === 0) {
      if (!teve503) break; // só 429 nas duas chaves — cota real esgotada, não insiste
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw lastErr;
}

// 16/08/2026 — Roberto Terrasan: "EU JA MANDEI EXCLUIR A PORRA DA OPEN AI, SÓ
// DEIXAR AS DO GEMINI". OpenAI removido por completo como fallback — antes,
// quando o Gemini falhava (ex: cota de free tier estourada por causa do volume
// de chamadas de 7 automações rodando a cada 15min 24h/dia), callIA() caía
// silenciosamente pro OpenAI, que estava sem crédito (429) — mascarando o erro
// real do Gemini atrás de um fallback morto.
//
// 17/08/2026 — Roberto: "ENCONTRE UMA SOLUCAO GRATUITA... O SISTEMA PRECISA
// SER CAPAZ DE PUBLICAR AO MENOS 200 ARTIGOS DIARIAMENTE". Gemini free tier
// tem 20 requisições/dia/projeto — catastroficamente pouco pra 7 canais
// rodando o dia todo. Pesquisado (WebSearch) e confirmado: Groq (grátis, sem
// cartão de crédito) tem free tier de 14.400 requisições/dia — 720x mais que
// o Gemini. Groq vira fallback real quando o Gemini falha (cota esgotada,
// 503 persistente, etc.) — mesma MASTER_PROMPT, mesmo formato de entrada,
// endpoint compatível com OpenAI (chat/completions). NÃO é o fallback OpenAI
// morto que Roberto mandou tirar — é um provedor diferente, com chave e
// cota próprias, genuinamente grátis.
//
// ⚠️ Ressalva honesta: o teto de 14.400/dia é por REQUISIÇÃO — Groq também
// limita por TOKENS/MINUTO (6.000 no free tier). O MASTER_PROMPT é longo
// (~2-3 mil tokens só de instrução), então o gargalo real na prática pode
// ser o de tokens, não o de 14.400 pedidos — throughput real só se confirma
// testando com uma chave de verdade. Ainda assim, é uma capacidade MUITO
// maior que os 20/dia atuais do Gemini, e continua 100% grátis.
async function _getGroqKey() {
  try {
    const { data } = await supabase.from("config").select("value").eq("key", "GROQ_API_KEY").maybeSingle();
    return data?.value || "";
  } catch (_) {
    return "";
  }
}

async function _callGroq(systemKernel, userContent, maxTokens) {
  const key = await _getGroqKey();
  if (!key) throw new Error("GROQ_API_KEY não configurada no Supabase config");
  // 17/08/2026 — testado ao vivo: a chave funciona (200, resposta real), mas
  // o pipeline real falhou com "413 Request too large... tokens per minute
  // (TPM): Limit 12000, Requested 13211/12331". Groq soma o max_tokens
  // PEDIDO (não o realmente usado) ao total contra o teto de TPM — com
  // maxTokens=8192 (default de callIA/callGemini) + MASTER_PROMPT +
  // artigo-fonte, estourava os 12.000 quase sempre. Fix: teto próprio pro
  // Groq, bem abaixo do default do Gemini — ainda dá margem de sobra pro
  // mínimo de 8 parágrafos/2.500+ chars exigido pelo MASTER_PROMPT.
  //
  // 17/08/2026 (continuação) — testado de novo com o teto de 4000: ainda
  // batia 429 de TPM (12.000/min é do GROQ INTEIRO — compartilhado entre
  // os 7 canais automáticos + qualquer chamada manual, não por chave/canal;
  // Groq só tem 1 chave, ao contrário do Gemini que tem 2). Não dá pra
  // esperar o "try again in Ns" do próprio erro (Vercel Hobby só tem 10s de
  // execução — REGRA ZERO-A — um sleep de 16-36s estouraria o timeout).
  // Único ajuste seguro dentro de 1 chamada: pedir MENOS tokens no total
  // (prompt de entrada + saída) — reduz "Requested" por chamada, dando mais
  // margem dentro do teto compartilhado. userContent (texto-fonte bruto)
  // cortado pra até 4000 chars — sobra de sobra pro MASTER_PROMPT reescrever
  // (mínimo exigido é só 2.500+ chars de SAÍDA, não de entrada).
  // 17/08/2026 — CONFIRMADO com evidência real: "llama-3.3-70b-versatile" foi
  // removido do catálogo do Groq (404 "does not exist or you do not have
  // access to it" — testado ao vivo). A lista real de modelos disponíveis na
  // conta hoje (GET /v1/models) não tem NENHUM modelo Llama de chat — Groq
  // trocou a linha para modelos OpenAI open-weight (gpt-oss) + Qwen. Trocado
  // pra "openai/gpt-oss-120b" — testado ao vivo com prompt real (~1600
  // tokens de entrada), respondeu HTTP 200 com conteúdo real. É um modelo de
  // RACIOCÍNIO — a resposta da API vem com dois campos separados,
  // message.reasoning (o "pensamento" interno) e message.content (a
  // resposta final) — _callGroq() já lê só .content abaixo, então o
  // raciocínio nunca vaza pro texto do artigo. reasoning_effort:"low" reduz
  // o quanto o modelo "pensa" antes de responder, sobrando mais do
  // orçamento de tokens pro CONTEÚDO real do artigo (groqMaxTokens subido
  // de 2200→2600 de margem). ⚠️ Testado só com prompt curto até agora — a
  // próxima geração real de artigo via Groq (fallback do Gemini) confirma
  // se o teto é suficiente pra um artigo completo; se sair truncado, subir
  // groqMaxTokens de novo com evidência real.
  const groqMaxTokens = Math.min(maxTokens, 2600);
  const groqUserContent = userContent.length > 4000 ? userContent.slice(0, 4000) : userContent;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemKernel },
        { role: "user", content: groqUserContent }
      ],
      max_tokens: groqMaxTokens,
      temperature: 0.3,
      reasoning_effort: "low"
    })
  });
  const d = await res.json();
  if (!res.ok) {
    const err = new Error(`Groq ${res.status}: ${d.error?.message || JSON.stringify(d)}`);
    err.status = res.status;
    throw err;
  }
  const text = d.choices?.[0]?.message?.content;
  if (text && text.length > 100) return _sanitizarMarkdownGroq(text);
  throw new Error("Groq retornou resposta vazia");
}

// 17/08/2026 — testado ao vivo: Groq gerou conteúdo válido (erro:0) mas o
// validador do pipeline rejeitou com "markdown/metadados no corpo" —
// diferente do Gemini, o Llama 3.3 (motor do Groq) tem o hábito de devolver
// **negrito** e ##título mesmo quando o MASTER_PROMPT pede HTML puro. Isso
// NÃO é alteração de prompt (Regra Zero-B intacta — nenhum texto do
// MASTER_PROMPT foi tocado) — é só limpeza mecânica da saída de UM provedor
// específico, antes de devolver o texto pro resto do pipeline.
//
// 17/08/2026 (continuação) — BUG REAL encontrado testando ao vivo: a versão
// anterior removia QUALQUER linha começando com TITULO:/META_TITLE:/
// FOCO_KEYWORD:/META_DESCRICAO: do texto INTEIRO, antes do parse() rodar —
// isso apagava as linhas de metadado de VERDADE (que o parser precisa pra
// extrair o título), não só linhas soltas que vazassem dentro do corpo.
// Resultado: titulo ficava vazio → parse() caía no fallback "Sem título"
// (10 chars) → auditoria rejeitava "titulo fora do tamanho seguro" (exige
// 15-120). Fix: só limpar metadado solto DEPOIS do marcador "CORPO EM
// HTML:" (onde ele pode vazar por engano) — as linhas de metadado real,
// antes desse marcador, ficam intocadas.
function _sanitizarMarkdownGroq(text) {
  const semNegritoEHeaders = text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "");
  const marcador = /CORPO(?: EM HTML)?:/i;
  const idx = semNegritoEHeaders.search(marcador);
  if (idx === -1) return semNegritoEHeaders;
  const cabecalho = semNegritoEHeaders.slice(0, idx);
  const corpo = semNegritoEHeaders.slice(idx).replace(/^(TITULO|META_TITLE|FOCO_KEYWORD|META_DESCRICAO):.*$/gim, "");
  return cabecalho + corpo;
}

async function callIA(systemKernel, userContent, maxTokens = 8192) {
  try {
    return await callGemini(systemKernel, userContent, maxTokens);
  } catch (err) {
    // orçamento do Gemini esgotado ou qualquer outra falha real (não mascara
    // erro — só tenta uma fonte de capacidade genuinamente diferente)
    console.warn(`Gemini falhou (${(err.message || "").slice(0, 100)}), tentando Groq...`);
    return await _callGroq(systemKernel, userContent, maxTokens);
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

// Remove tags <figure>/<img> espúrias que a IA às vezes injeta no meio do
// corpo — artefato de vazamento (ex: grounding/busca de imagem do modelo),
// nunca intencional: nenhuma parte do pipeline OVC insere imagem inline no
// corpo, a capa do artigo é sempre um campo separado (imagem, via
// processAndSaveImage()). Detectado 12/08/2026 (Roberto, print de matéria
// em /negocios/): tag <figure><img src="https://encrypted-tbn0.gstatic.com/...">
// </figure> aparecendo como TEXTO VISÍVEL no meio do artigo publicado.
function limparImagensEspurias(corpo) {
  if (!corpo || typeof corpo !== 'string') return corpo;
  return corpo
    .replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, '')
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
  if (corpo) corpo = limparImagensEspurias(corpo);

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
  const repairRules = OVC_REPAIR_RULES;
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

// KERNEL BRASIL ON — separado do MASTER_PROMPT (protegido, Regra Zero-B — nunca
// tocado aqui). O MASTER_PROMPT exige mínimo 2.500 chars de texto puro e manda a
// IA devolver "INCONSISTENCIA" abaixo disso, além de mirar 4.000 chars/8 parágrafos
// via OVC_REPAIR_RULES — inadequado pro conteúdo-fonte do Brasil ON (Bacci Notícias,
// Revista Oeste), que é tabloide/curto (ex: matéria real de 2 frases sobre uma babá
// presa). Roberto Terrasan, 11/08/2026, com exemplo real em mãos: "é só reescrever
// corretamente de maneira simples com o padrao ovc" — ou seja, reescrita fiel ao
// TAMANHO da fonte (sem inflar, sem inventar, sem forçar estrutura longa).
const BRASILON_KERNEL = `Você é editor de notícias curtas do Brasil ON, a divisão popular do O Valor Capital.

MISSÃO: reescrever o texto-fonte abaixo com palavras 100% próprias, mantendo os MESMOS fatos e a MESMA extensão aproximada do original — nunca copie frases da fonte, mas também não estenda, não infle, não invente detalhes que não estão nela. Fonte com 2 frases gera resultado com 2-4 frases. Fonte com 10 parágrafos gera resultado com 10 parágrafos.

ESTILO: direto, claro, correto gramaticalmente, objetivo — sem sensacionalismo, sem gírias, sem opinião, sem enrolação.

REGRAS INVIOLÁVEIS (mesmo padrão jurídico do OVC):
- Nunca afirme crime sem menção a prisão/investigação/condenação como consta na fonte.
- Nunca invente nome, data, valor, cargo, local ou fato que não está no texto-fonte.
- Quando a fonte atribuir a informação a alguém ou a algum órgão, mantenha a atribuição ("segundo", "de acordo com").
- Nunca mencione o nome do site de origem no corpo do texto.
- Nunca mencione nome de jornalista, repórter, apresentador, colunista, âncora ou qualquer outro veículo de imprensa/agência de notícia — mesmo que a fonte cite terceiros (ex: a fonte cita "segundo a Reuters"), reescreva o fato em si, sem repetir esse nome.
- HTML puro no corpo — apenas tags <p> — nunca markdown, nunca ## ou **.

FORMATO DE SAÍDA (sem texto antes ou depois, sem comentários):
TITULO: [direto, sem clickbait, até 100 caracteres]
META_TITLE: [até 55 caracteres]
SLUG: [url-com-hifens]
META_DESCRICAO: [120–160 caracteres]
CORPO:
[Primeiro parágrafo OBRIGATÓRIO: <p><strong>Redação OVC</strong> · {data de hoje informada acima}</p>
Depois, o restante do corpo em HTML puro — <p> por parágrafo.
Último parágrafo OBRIGATÓRIO: exatamente 10 hashtags relevantes ao tema da matéria, separadas por espaço, dentro de um único <p> (ex: <p>#Brasil #Política #Economia ...</p>)]`;

export async function rewriteBrasilOn(text, title, context = '') {
  // maxTokens 3072 (não 2048) — confirmado 11/08/2026 com exemplo real de Roberto
  // (matéria da Bacci sobre interferência dos EUA nas eleições, 3.294 chars de
  // texto-fonte) que fontes do Brasil ON NÃO são sempre curtíssimas — variam de
  // 2 frases a matérias políticas robustas. Margem extra evita corte no meio da
  // reescrita pra fonte no teto do que core/scraper.js extrai.
  // 13/08/2026: 3072→4096 — cap do scraper subiu 4000→7000 chars (Roberto: reescrita
  // sempre COMPLETA), então o teto de saída da IA também precisa de mais margem pra
  // não cortar o final de uma reescrita fiel a uma fonte mais longa.
  const userContent = buildUserContent(hoje(), (title ? title + "\n\n" : "") + text, context);
  const raw = await callIA(BRASILON_KERNEL, userContent, 4096);
  const result = parse(raw);
  if (!result?.titulo || !result?.corpo) throw new Error("Brasil ON: reescrita vazia/incompleta");
  result.tipo_conteudo = "padrao";
  return result;
}

// JOVEM PAN POLÍTICA — 12/08/2026, Roberto Terrasan: mesma estrutura do Brasil
// ON/Bacci ("mesma estrutura... INTEIRAMENTE IGUAL"), aplicada à seção Política
// da Jovem Pan (fonte já aprovada no pipe geral, core/rss.js — Roberto: "eles
// sao bem de direita"). Kernel próprio (não o MASTER_PROMPT) pelo mesmo motivo
// do Brasil ON: reescrita fiel ao TAMANHO da fonte, sem inflar pra 4.000 chars.
const JOVEMPAN_POLITICA_KERNEL = `Você é editor de política do O Valor Capital, reescrevendo matérias da seção Política a partir de uma fonte jornalística.

MISSÃO: reescrever o texto-fonte abaixo com palavras 100% próprias, mantendo os MESMOS fatos e a MESMA extensão aproximada do original — nunca copie frases da fonte, mas também não estenda, não infle, não invente detalhes que não estão nela.

ESTILO: direto, claro, correto gramaticalmente, objetivo — sem sensacionalismo, sem gírias, sem opinião, sem enrolação.

REGRAS INVIOLÁVEIS (mesmo padrão jurídico do OVC):
- Nunca afirme crime sem menção a prisão/investigação/condenação como consta na fonte.
- Nunca invente nome, data, valor, cargo, local ou fato que não está no texto-fonte.
- Quando a fonte atribuir a informação a alguém ou a algum órgão, mantenha a atribuição ("segundo", "de acordo com").
- Nunca mencione o nome do site de origem no corpo do texto.
- Nunca mencione nome de jornalista, repórter, apresentador, colunista, âncora ou qualquer outro veículo de imprensa/agência de notícia — mesmo que a fonte cite terceiros (ex: a fonte cita "segundo a Reuters"), reescreva o fato em si, sem repetir esse nome.
- HTML puro no corpo — apenas tags <p> — nunca markdown, nunca ## ou **.

FORMATO DE SAÍDA (sem texto antes ou depois, sem comentários):
TITULO: [direto, sem clickbait, até 100 caracteres]
META_TITLE: [até 55 caracteres]
SLUG: [url-com-hifens]
META_DESCRICAO: [120–160 caracteres]
CORPO:
[Primeiro parágrafo OBRIGATÓRIO: <p><strong>Redação OVC</strong> · {data de hoje informada acima}</p>
Depois, o restante do corpo em HTML puro — <p> por parágrafo.
Último parágrafo OBRIGATÓRIO: exatamente 10 hashtags relevantes ao tema da matéria, separadas por espaço, dentro de um único <p> (ex: <p>#Brasil #Política #STF ...</p>)]`;

export async function rewriteJovempanPolitica(text, title, context = '') {
  const userContent = buildUserContent(hoje(), (title ? title + "\n\n" : "") + text, context);
  const raw = await callIA(JOVEMPAN_POLITICA_KERNEL, userContent, 4096); // 13/08/2026 — ver comentário em rewriteBrasilOn
  const result = parse(raw);
  if (!result?.titulo || !result?.corpo) throw new Error("Jovem Pan Política: reescrita vazia/incompleta");
  result.tipo_conteudo = "padrao";
  return result;
}

// INTERNACIONAL — 13/08/2026, Roberto Terrasan: mesma estrutura do Brasil
// ON/Bacci e Jovem Pan Política ("mesmas regras do bacci e jovens pan").
// Diferença chave: aqui a categoria Internacional cobre QUALQUER tema
// internacional, sem restrição — não é uma só editoria como Política.
// Fontes: BBC News (bbc.com/news/world) + CNN International (cnn.com/world)
// — ambas testadas ao vivo (13/08/2026): sitemap/homepage acessíveis, links
// de matéria reais e recentes, sem bloqueio anti-bot (diferente de Reuters e
// Bloomberg, ambas retornam 401/403 e foram descartadas). Roberto autorizou
// expressamente usar imagem com marca d'água do veículo de origem nesse
// canal ("nao tem problema... podem usar estas... que usem marca dagua") —
// diferente de Bacci/Jovem Pan, aqui NÃO se exige imagem limpa.
const INTERNACIONAL_KERNEL = `Você é editor de internacional do O Valor Capital, reescrevendo matérias de agências e veículos internacionais (BBC, CNN e similares) a partir de uma fonte jornalística em inglês ou português.

MISSÃO: reescrever o texto-fonte abaixo em português do Brasil, com palavras 100% próprias, mantendo os MESMOS fatos e a MESMA extensão aproximada do original — nunca copie frases da fonte, nunca traduza literalmente frase por frase, mas também não estenda, não infle, não invente detalhes que não estão nela.

ESCOPO: qualquer tema internacional é válido — política, economia, conflitos, tecnologia, ciência, cultura, esportes, o que a fonte trouxer. Nunca restrinja a um único assunto.

ESTILO: direto, claro, correto gramaticalmente, objetivo — sem sensacionalismo, sem gírias, sem opinião, sem enrolação. Adapte nomes de cargos/instituições estrangeiras para o equivalente em português quando existir uso consagrado (ex: "Secretário de Estado" em vez de manter em inglês).

REGRAS INVIOLÁVEIS (mesmo padrão jurídico do OVC):
- Nunca afirme crime sem menção a prisão/investigação/condenação como consta na fonte.
- Nunca invente nome, data, valor, cargo, local ou fato que não está no texto-fonte.
- Quando a fonte atribuir a informação a alguém ou a algum órgão, mantenha a atribuição ("segundo", "de acordo com").
- Nunca mencione o nome do veículo de origem (BBC, CNN, etc) no corpo do texto — apenas o fato em si.
- Nunca mencione nome de jornalista, repórter, apresentador, colunista, âncora ou qualquer outro veículo de imprensa/agência de notícia — inclusive se a fonte citar terceiros (ex: a matéria da BBC cita "segundo a Reuters" ou "segundo a AFP"), reescreva o fato em si, sem repetir esse nome.
- HTML puro no corpo — apenas tags <p> — nunca markdown, nunca ## ou **.

FORMATO DE SAÍDA (sem texto antes ou depois, sem comentários):
TITULO: [direto, sem clickbait, até 100 caracteres]
META_TITLE: [até 55 caracteres]
SLUG: [url-com-hifens]
META_DESCRICAO: [120–160 caracteres]
CORPO:
[Primeiro parágrafo OBRIGATÓRIO: <p><strong>Redação OVC</strong> · {data de hoje informada acima}</p>
Depois, o restante do corpo em HTML puro — <p> por parágrafo.
Último parágrafo OBRIGATÓRIO: exatamente 10 hashtags relevantes ao tema da matéria, separadas por espaço, dentro de um único <p> (ex: <p>#Mundo #Internacional #EUA ...</p>)]`;

export async function rewriteInternacional(text, title, context = '') {
  const userContent = buildUserContent(hoje(), (title ? title + "\n\n" : "") + text, context);
  const raw = await callIA(INTERNACIONAL_KERNEL, userContent, 4096); // 13/08/2026 — ver comentário em rewriteBrasilOn
  const result = parse(raw);
  if (!result?.titulo || !result?.corpo) throw new Error("Internacional: reescrita vazia/incompleta");
  result.tipo_conteudo = "padrao";
  return result;
}
