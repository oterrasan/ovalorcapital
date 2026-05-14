# BUGS CORRIGIDOS — O Valor Capital

> Histórico completo de todos os bugs críticos identificados e corrigidos.
> **Leia antes de qualquer sessão de trabalho.**
> Se você está a ponto de "simplificar" alguma dessas correções — pare. Cada uma delas corrige um bug real que derrubou o portal.

---

## BUG #1 — Artigos antigos abrindo página em branco
**Data:** Mai/2026 | **Arquivo:** `api/article.js` | **PRs:** #33

### Sintoma
Qualquer artigo publicado há mais de 2 dias retornava página completamente em branco. Artigos novos abriam normalmente.

### Causa raiz
O campo `conteudo` de artigos antigos continha HTML bruto com tags `</script>` literais. Quando esse conteúdo era serializado com `JSON.stringify()` e embutido diretamente em um bloco `<script>` no HTML, o parser HTML do navegador fechava o bloco `<script>` na primeira `</script>` encontrada DENTRO do JSON — quebrando o JavaScript e deixando a página em branco.

### Correção
Função `safeJsonForScript()` adicionada em `api/article.js`:
```js
function safeJsonForScript(obj) {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
```

### Regra permanente
**NUNCA** embutir `JSON.stringify()` diretamente em tag `<script>`. Sempre usar `safeJsonForScript()`.

---

## BUG #2 — Pipeline retornando `no_valid_news` em 100% das chamadas
**Data:** Mai/2026 | **Arquivo:** `core/rss.js` | **PRs:** #35

### Sintoma
Todas as chamadas automatizadas retornavam `{status: 'no_valid_news'}`. O portal gerou apenas 4 artigos em 48 horas.

### Causa raiz
`isHoje()` em `core/rss.js` rejeitava itens sem data (Google News omite pubDate em muitos itens) e rejeitava artigos de ontem.

### Correção
```js
function isRecente(dateStr) {
  if (!dateStr) return true;  // aceita item sem data (Google News)
  try {
    const itemDate = new Date(dateStr);
    if (isNaN(itemDate.getTime())) return true;
    return (Date.now() - itemDate.getTime()) < 48 * 60 * 60 * 1000;
  } catch (_) { return true; }
}
```

### Regra permanente
**NUNCA** reverter para `isHoje()`. `isRecente()` é a função correta e definitiva.

---

## BUG #3 — Categorias erradas na geração forçada
**Data:** Mai/2026 | **Arquivo:** `api/run_portal.js`, `core/rss.js` | **PRs:** #35

### Sintoma
Quando o admin forçava geração para "Seguros", o sistema gerava artigos de entretenimento e os salvava com categoria errada.

### Causa raiz
Quando `catForcada` era definida, o pipeline mesclava feeds da categoria alvo com feeds gerais. Sem validação de família temática.

### Correção
1. Feeds exclusivos quando `catForcada`
2. Mapa `FAMILIA_CAT` exportado de `core/rss.js`
3. Validação familiar antes de salvar: se família do conteúdo gerado ≠ família da categoria forçada → descarta

### Regra permanente
Ao adicionar nova categoria, adicionar ao `FAMILIA_CAT` com a família correta.

---

## BUG #4 — Subcategoria "Geral" sendo salva no banco
**Data:** Mai/2026 | **Arquivo:** `api/run_portal.js` | **PRs:** #35

### Sintoma
Artigos eram salvos com `subcategoria: "Geral"` quebrando a navegação por subcategoria.

### Correção
```js
const subcatForcada = /^(geral|qualquer|qualquer subcategoria|any|todos?)$/i.test(subcatRaw)
  ? '' : subcatRaw;
```

### Regra permanente
O banco NUNCA deve ter `subcategoria = 'Geral'`.

---

## BUG #5 — Volume de artigos muito baixo (4 artigos em 48h)
**Data:** Mai/2026 | **Arquivo:** `api/run_portal.js` | **PRs:** #34

### Sintoma
Com automação ligada, apenas 4 artigos em 48 horas.

### Causa raiz
Combinação: BUG #2 (isHoje), `targetCount` padrão = 1, pool de 40 itens, sem dedup de títulos.

### Correção
```js
const targetCount = Math.min(parseInt(meta.count || body.count || '5', 10), 8);
for (const item of news.slice(0, 80)) { ... }  // pool 40 → 80
// Dedup Jaccard ≥40% em palavras >4 chars
```

### Regra permanente
GitHub Actions sempre envia `{"count":8}`. Padrão nunca abaixo de 5.

---

## BUG #6 — Sem controle de distribuição horária de posts
**Data:** Mai/2026 | **Arquivo:** `api/run_portal.js` | **PRs:** #36

### Sintoma
Na madrugada, o cron esgotava o limite diário (300 posts) nas primeiras horas — deixando o restante do dia sem conteúdo novo.

### Correção — Faixas horárias (Brasília UTC-3)
```js
const FAIXAS_HORARIO = [
  { chave: 'POSTS_01_06', hInicio: 1,  hFim: 6,  padrao: 20  },
  { chave: 'POSTS_06_10', hInicio: 6,  hFim: 10, padrao: 40  },
  { chave: 'POSTS_10_12', hInicio: 10, hFim: 12, padrao: 40  },
  { chave: 'POSTS_12_17', hInicio: 12, hFim: 17, padrao: 80  },
  { chave: 'POSTS_17_00', hInicio: 17, hFim: 25, padrao: 120 },
];
```
`force=true` ou `batch=true` ignoram todas as faixas.

### Regra permanente
Nunca remover o bloco de faixas horárias sem criar mecanismo equivalente de distribuição.

---

## BUG #7 — Geração manual sempre falhava silenciosamente (CRÍTICO)
**Data:** Mai/2026 | **Arquivo:** `api/manage.js`

### Sintoma
100% dos pedidos de geração manual no admin retornavam `"Conteúdo inválido gerado pela IA"`. O Editor IA também falhava com qualquer fonte.

### Causa raiz
A função `validar()` em `api/manage.js` tinha a linha:
```js
if (!c.includes("redação ovc")) return false;
```
A IA nunca escreve essa string no corpo do artigo. Resultado: 100% dos artigos gerados eram rejeitados silenciosamente.

### Correção
Linha removida. A validação agora verifica apenas título, comprimento mínimo e palavras proibidas:
```js
function validar(content) {
  if (!content?.titulo || !content?.corpo) return false;
  const t = content.titulo.toLowerCase().trim();
  const c = content.corpo.toLowerCase();
  const proibidos = ["prezado","caro usuário","olá,","atenção:","dear","editor(a)"];
  if (proibidos.some(p => t.startsWith(p) || c.slice(0,100).includes(p))) return false;
  if (content.corpo.length < 500) return false;
  return true;
}
```

### Regra permanente
**NUNCA** exigir strings fixas da IA no corpo do artigo.

---

## BUG #8 — Botão "Forçar Execução" enviava GET sem body
**Data:** Mai/2026 | **Arquivo:** `public/admin/automacao.html`

### Sintoma
Clicar em "▶ Forçar agora" no painel de automação retornava `{"status":"no_news"}` ou `automation_paused`.

### Causa raiz
```js
// ERRADO — envia GET, body é ignorado, force=false
const res = await fetch('/api/run_portal');
```

### Correção
```js
const res = await fetch('/api/run_portal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ force: true, count: 3 })
});
```

### Regra permanente
Todo fetch para `/api/run_portal` que pretende forçar execução DEVE ser POST com `{force:true}` no body.

---

## BUG #9 — Tabela de posts no admin usava coluna inexistente
**Data:** Mai/2026 | **Arquivo:** `public/admin/automacao.html`

### Sintoma
A tabela de posts no painel de automação mostrava "undefined" na coluna de categoria.

### Causa raiz
Usava `.select('id,titulo,categoria,...')` e `p.categoria`. A coluna `categoria` não existe na tabela `posts`. A categoria fica em `user_tags` como JSON array: `'["politica"]'`.

### Correção
```js
// Select correto:
.select('id,titulo,user_tags,publish_method,created_at,status')

// Helper:
function getCat(post) {
  try { return JSON.parse(post.user_tags || '[]')[0] || '—'; } catch(_) { return '—'; }
}
```

### Regra permanente
**NUNCA usar `p.categoria`** — a coluna não existe. Sempre usar `user_tags` com parse JSON.

---

## BUG #10 — getNews() sem fallback real quando rss_sources falha em runtime
**Data:** Mai/2026 | **Arquivo:** `core/rss.js`

### Sintoma
Botão "Forçar agora" e pipeline automático retornavam `{"status":"no_news"}` mesmo com feeds hardcoded configurados.

### Causa raiz
`getNews()` consultava `rss_sources` do Supabase. Se os feeds retornavam 0 itens em runtime (rate-limit, falha de rede), a função retornava array vazio sem tentar os feeds hardcoded. A lógica só ativava fallback se `active=false` — não se os feeds falhassem.

### Correção
Extração da função `buscarFeedsDiretos()` e adição de fallback duplo:
```js
if (allItems.length === 0) {
  const fallback = selecionarFeedsBalanceados();
  allItems = await buscarFeedsDiretos(fallback);
}
```

### Regra permanente
`getNews()` NUNCA deve retornar array vazio se os feeds hardcoded existem.

---

## BUG #11 — Scraper retornava texto vazio para maioria dos sites
**Data:** Mai/2026 | **Arquivo:** `core/scraper.js`

### Sintoma
Editor IA falhava ao receber link de matéria. Sites com layout baseado em divs, paywalls ou JavaScript retornavam texto vazio.

### Causa raiz
O scraper usava apenas `$('p')` para extrair texto — falha em layouts div-based, JS-rendered e paywalls.

### Correção — 3 camadas de extração
1. **Camada 1:** seletores semânticos (`article p`, `[class*="content"] p`, `itemprop="articleBody"`, etc.)
2. **Camada 2:** fallback para divs quando `<p>` insuficiente (`< 200 chars`)
3. **Camada 3:** `og:description` + `og:title` como último recurso (paywall/JS)

Timeout: 8s → 12s. Headers Chrome real completo.

### Regra permanente
O scraper deve ter as 3 camadas. **Nunca simplificar para apenas `$('p')`** — quebra 70%+ dos sites brasileiros.

---

## BUG #12 — `no_news` persistente apesar do fallback (CRÍTICO)
**Data:** Mai/2026 | **Arquivo:** `core/rss.js` | **Commit:** `65928cb`

### Sintoma
Botão "Forçar agora" continuava retornando `{"status":"no_news"}` mesmo após o BUG #10 ter adicionado um fallback. O problema ocorria especificamente quando o cron tinha rodado nos últimos 60-90 minutos.

### Causa raiz — diagnóstico completo
**Passo 1:** `getNews()` consulta `rss_sources` do Supabase. Se a tabela tem entradas ativas, usa essas 20 fontes (seleção aleatória). Se todas são feeds Google News → rate-limit ativo após o cron → `allItems = []`.

**Passo 2 (BUG #10 fix insuficiente):** O fallback adicionado em BUG #10 usava `selecionarFeedsBalanceados()` — que sorteia 2 feeds de cada um dos 16 grupos. Grupos `tributacao_regulacao`, `vagas_concursos` e `imoveis_parcerias` têm **ZERO** feeds diretos (100% Google News). Em cenário de rate-limit, o fallback também podia retornar 0 itens pelo mesmo motivo.

**Passo 3:** Mesmo que o fallback do BUG #10 tivesse alguns feeds diretos, se `rss_sources` tinha muitas entradas GN, a probabilidade de sortear só GN era alta.

**Diagnóstico de deploy:** A resposta `{"status":"no_news"}` sem os campos de debug `catAlvo`, `prio`, `gen` (adicionados em commit anterior) confirmou que o código novo não tinha deployado ainda no Vercel. Um commit adicional forçou o deploy.

### Solução definitiva (commit `65928cb`)
Mudança na lógica de `getNews()`: em vez de tentar `rss_sources` puro e só depois ir para fallback, **sempre misturar** feeds customizados com feeds diretos garantidos na primeira tentativa:

```js
// Feeds customizados do banco (até 10 aleatórios)
const feedsCustom = (allSources || [])
  .filter(s => s.active !== false)
  .sort(() => Math.random() - 0.5)
  .slice(0, 10);

// Sempre inclui feeds diretos garantidos (até 10 aleatórios)
const feedsGarantidos = [...FEEDS_DIRETOS_GARANTIDOS]
  .sort(() => Math.random() - 0.5)
  .slice(0, 10);

const feedsParaUsar = [...feedsCustom, ...feedsGarantidos];
```

### `FEEDS_DIRETOS_GARANTIDOS` — o que é
Array de 20 feeds diretos (sem Google News) que nunca sofrem rate-limit:
- Agência Brasil (Política, Saúde, Educação)
- Metrópoles, Agência Pública
- InfoMoney, Exame, Seu Dinheiro, Money Times
- Canaltech, TecMundo, TechCrunch, The Verge
- BBC (World, Technology, Business, Health, Sport)
- Guardian World, Al Jazeera

### Confirmação de funcionamento
Após deploy, "Forçar agora" retornou:
```json
{"status":"ok","artigos":[{"titulo":"Xi e Trump discutem futuro da humanidade em encontro em Pequim","categoria":"internacional","subcategoria":"Relações Exteriores","id":"0aa3b6cd-cc85-444f-9f78-ebb2e80a1827"}],"total":1}
```

### Regra permanente
**`getNews()` deve SEMPRE misturar feeds customizados com `FEEDS_DIRETOS_GARANTIDOS` na primeira chamada.** Não depender só de `rss_sources`. Não usar `selecionarFeedsBalanceados()` como fallback de segurança — pode ser 100% GN.

---

## BUG #13 — Pipeline e admin salvavam artigos como `pendente` — portal sem novos artigos por ~3 dias (CRÍTICO)
**Data:** 14/Mai/2026 | **Arquivos:** `api/run_portal.js`, `api/manage.js` | **Commits:** `9c41679`, `89be842`

### Sintoma
O portal ficou aproximadamente 3 dias sem publicar novos artigos. A automação rodava normalmente (GitHub Actions disparando a cada 20min, sem erros), o admin aceitava geração manual sem erro — mas nenhum artigo aparecia no portal.

### Causa raiz
Ambos os arquivos salvavam artigos no banco com `status: 'pendente'` e `approved: false`. O `api/portal-posts.js` — que serve todos os artigos para o frontend — filtra exclusivamente por `status = 'publicado'`. Não existia nenhum mecanismo de aprovação automática. Resultado: todos os artigos ficavam invisíveis no portal indefinidamente.

**Em `api/run_portal.js` (INSERT do pipeline automático):**
```js
// ERRADO — artigos nunca apareciam
{ status: 'pendente', approved: false }
// sem published_at
```

**Em `api/manage.js` `handleManual()` (dois blocos INSERT — fonteManual e RSS):**
```js
// ERRADO — artigos nunca apareciam
{ status: 'pendente', approved: false }
// sem published_at
```

### Correção
Ambos os arquivos alterados para publicar direto:
```js
const now = new Date().toISOString();

// run_portal.js e manage.js — ambos os INSERTs:
{
  status: 'publicado',
  approved: true,
  published_at: now,
  // ... demais campos
}
```

### Por que isso é seguro
O pipeline gera conteúdo via OpenAI a partir de notícias reais de feeds confiáveis (Agência Brasil, BBC, InfoMoney, etc.) com validação de qualidade (`validar()`). Publicação direta é o comportamento correto e esperado para 300 artigos/dia.

### Regra permanente
**Todo INSERT na tabela `posts` pelo pipeline ou admin deve sempre usar `status: 'publicado'`, `approved: true` e `published_at: now`.** Nunca salvar como `pendente` sem um fluxo de aprovação implementado — causa silêncio total no portal.

---

## BUG #14 — Links antigos `?id=` abriam página de categoria vazia
**Data:** 14/Mai/2026 | **Arquivo:** `api/category.js` | **Commit:** `8318e70`

### Sintoma
Links no formato `/esportes/?id=dc226eae` (formato legado) exibiam a página de listagem de categoria normalmente, mas o conteúdo do artigo nunca carregava — página ficava em branco onde o artigo deveria aparecer. Problema ocorria em TODAS as categorias do portal, não apenas esportes.

### Causa raiz — fluxo completo
1. URL `/esportes/?id=dc226eae` → `vercel.json` rewrite → `api/category.js?cat=esportes`
2. `category.js` ignora o parâmetro `?id=` e serve o template HTML de categoria normalmente
3. O JS do frontend (`internal-page-v2.js`) detecta `artId` via `params.get('id')` e faz fetch para `/api/portal-posts?id=dc226eae&full=true`
4. Como os artigos estavam em `pendente` (BUG #13), `portal-posts.js` retornava 404
5. `internal-page-v2.js` silencia o erro 404 — página fica em branco sem mensagem de erro

**Mesmo com o BUG #13 corrigido**, links `?id=` antigos continuam sendo problemáticos porque:
- A URL canônica correta é `/{categoria}/{slug}-{id8}/` — usar `?id=` é formato morto (Regra #4 do CLAUDE.md)
- `category.js` nunca deveria processar um `?id=` — deveria redirecionar

### Correção
Adicionado redirect 302 no início do handler de `api/category.js`, antes de qualquer lógica de categoria:
```js
export default async function handler(req, res) {
  const artId = (req.query.id || "").trim();
  if (artId) {
    return res.redirect(302, "/og?id=" + encodeURIComponent(artId));
  }
  // ... resto do handler de categoria
}
```

**Fluxo após correção:**
`/esportes/?id=dc226eae` → `category.js` detecta `?id=` → redirect 302 → `/og?id=dc226eae` → `api/portal-posts?format=og` → lookup no banco → redirect para URL canônica `/esportes/titulo-do-artigo-dc226eae/`

### Por que `/og` e não direto para o artigo
`/og` já existia como rota em `vercel.json` → `api/portal-posts?format=og`. Ele faz o lookup pelo ID parcial no banco e redireciona para a URL slug correta. Reutilizamos infraestrutura existente sem criar nova lógica.

### Regra permanente
- **`api/category.js` deve SEMPRE redirecionar qualquer request com `?id=`** para `/og?id=`
- Nunca criar nova lógica de lookup por ID em `category.js` — isso pertence ao `portal-posts.js`
- Links `?id=` são formato morto — nunca gerar novos links nesse formato

---

## CONFLITO DE MERGE — Branch `claude/review-project-docs-1mLkx`
**Data:** Mai/2026

### O que aconteceu
Os bugs críticos #7-#12 foram corrigidos diretamente no `main` porque o branch tinha divergido. O PR #36 documenta as faixas horárias e docs.

### Lição
Sempre sincronizar o branch de desenvolvimento com main a cada 2-3 dias.

---

## CHECKLIST — Antes de qualquer mudança no pipeline

```
□ isRecente() ainda existe em core/rss.js? (não deve ter voltado para isHoje())
□ safeJsonForScript() é usado em todo JSON embutido em <script>?
□ FAMILIA_CAT está sendo importado e usado na validação de catForcada?
□ Subcategoria 'Geral' está sendo filtrada antes de salvar no banco?
□ FAIXAS_HORARIO definido e verificado antes de gerar artigos?
□ O GitHub Actions ainda envia count=8 no body?
□ MAX_POSTS_DIA=300 ainda está sendo verificado?
□ validar() em manage.js NÃO exige strings fixas da IA no corpo?
□ forcarExecucao() em automacao.html envia POST com {force:true, count:3}?
□ automacao.html usa user_tags (não categoria) no select e na tabela?
□ getNews() mistura feedsCustom + feedsGarantidos na 1a tentativa?
□ getNews() tem fallback total com FEEDS_DIRETOS_GARANTIDOS se allItems=[]?
□ scraper.js tem 3 camadas de extração (p → div → og:meta)?
□ Todo INSERT em posts usa status:'publicado', approved:true, published_at:now?
□ category.js redireciona ?id= para /og?id= antes de qualquer lógica de categoria?
```
