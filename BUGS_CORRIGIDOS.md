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
O campo `conteudo` de artigos antigos continha HTML bruto com tags `</script>` literais (ex: snippets de código, embeds). Quando esse conteúdo era serializado com `JSON.stringify()` e embutido diretamente em um bloco `<script>` no HTML:

```html
<script>
  window.__ARTICLE_DATA__ = {"titulo":"...","conteudo":"...texto com </script> aqui..."};
</script>
```

O parser HTML do navegador (e do Googlebot) fechava o bloco `<script>` na primeira `</script>` encontrada DENTRO do JSON — quebrando o JavaScript e deixando a página em branco.

### Correção
Função `safeJsonForScript()` adicionada em `api/article.js`:

```js
function safeJsonForScript(obj) {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")  // </script> nunca vai fechar o bloco
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
`isHoje()` em `core/rss.js` tinha dois erros: rejeitava itens sem data (Google News omite pubDate em muitos itens) e rejeitava artigos de ontem.

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
**1. Feeds exclusivos quando catForcada:**
```js
if (catForcada && CATS_VALIDAS.has(catForcada)) {
  news = await getNewsByCategoria(catForcada);  // APENAS feeds da categoria
}
```

**2. Mapa de famílias `FAMILIA_CAT` em `core/rss.js`:**
```js
export const FAMILIA_CAT = {
  seguros:'financas', investimentos:'financas', economia:'financas', ...
  politica:'poder', seguranca:'poder', defesa:'poder', ...
  esportes:'entretenimento', cultura:'entretenimento', ...
  tecnologia:'conhecimento', educacao:'conhecimento', ...
  vagas:'trabalho', concursos:'trabalho',
};
```

**3. Validação familiar antes de forçar:**
```js
if (familiaForcada && familiaConteudo && familiaForcada !== familiaConteudo) continue;
```

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
for (const item of news.slice(0, 80)) { ... }  // 40 → 80
// Dedup Jaccard ≥40% em palavras >4 chars
```

### Regra permanente
GitHub Actions sempre envia `{"count":8}`. Padrão nunca abaixo de 5.

---

## BUG #6 — Sem controle de distribuição horária de posts
**Data:** Mai/2026 | **Arquivo:** `api/run_portal.js` | **PRs:** #36

### Implementação — Faixas horárias (Brasília UTC-3)

```js
const FAIXAS_HORARIO = [
  { chave: 'POSTS_01_06', hInicio: 1,  hFim: 6,  padrao: 20  },
  { chave: 'POSTS_06_10', hInicio: 6,  hFim: 10, padrao: 40  },
  { chave: 'POSTS_10_12', hInicio: 10, hFim: 12, padrao: 40  },
  { chave: 'POSTS_12_17', hInicio: 12, hFim: 17, padrao: 80  },
  { chave: 'POSTS_17_00', hInicio: 17, hFim: 25, padrao: 120 },
];
```

| Faixa | Posts | Justificativa |
|-------|-------|---------------|
| 01h–06h | 20 | Madrugada — audiência mínima |
| 06h–10h | 40 | Manhã cedo |
| 10h–12h | 40 | Manhã — audiência crescendo |
| 12h–17h | 80 | Tarde — pico de leitura |
| 17h–00h | 120 | Noite — maior audiência |

**Configuração:** Supabase → tabela `config` → chaves `POSTS_01_06`, `POSTS_06_10`, `POSTS_10_12`, `POSTS_12_17`, `POSTS_17_00`.
**force=true ou batch=true:** ignoram os limites de faixa completamente.

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
A IA nunca escreve essa string no corpo do artigo — era uma string de controle que foi colocada por engano e nunca removida. Resultado: 100% dos artigos gerados eram rejeitados silenciosamente.

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
**NUNCA** exigir strings fixas da IA no corpo do artigo. A IA gera conteúdo livre — strings de controle devem ser verificadas apenas em campos de metadados, nunca no corpo.

---

## BUG #8 — Botão "Forçar Execução" enviava GET sem body
**Data:** Mai/2026 | **Arquivo:** `public/admin/automacao.html`

### Sintoma
Clicar em "▶ Forçar agora" no painel de automação retornava `{"status":"no_news"}` ou `automation_paused` — como se a automação estivesse desligada.

### Causa raiz
```js
// ERRADO — envia GET, body é ignorado, force=false
const res = await fetch('/api/run_portal');
```
Sem `method: 'POST'` e sem body, o servidor recebia um GET. O handler lê `req.body.force` — que é `undefined` em GET — e tratava como `force=false`, passando por todos os checks de automação e faixas normalmente.

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
A tabela de posts recentes no painel de automação mostrava "undefined" na coluna de categoria para todos os posts.

### Causa raiz
O select usava `.select('id,titulo,categoria,...')` e o template usava `p.categoria`, mas a tabela `posts` não tem coluna `categoria`. A categoria fica em `user_tags` como JSON array: `'["politica"]'`.

### Correção
```js
// Select correto:
.select('id,titulo,user_tags,publish_method,created_at,status')

// Helper para exibir:
function getCat(post) {
  try { return JSON.parse(post.user_tags || '[]')[0] || '—'; } catch(_) { return '—'; }
}

// No template:
`<td>${getCat(p)}</td>`
```

### Regra permanente
NUNCA usar `p.categoria` — a coluna não existe. Sempre usar `user_tags` com parse JSON.

---

## BUG #10 — getNews() sem fallback quando rss_sources falha
**Data:** Mai/2026 | **Arquivo:** `core/rss.js`

### Sintoma
O botão "Forçar agora" e o pipeline automático retornavam `{"status":"no_news"}` mesmo com feeds hardcoded configurados.

### Causa raiz
`getNews()` consulta a tabela `rss_sources` do Supabase primeiro. Se as entradas dessa tabela existem mas os feeds retornam 0 itens (por falha de rede, rate-limit do Google News, etc.), a função retornava array vazio sem tentar os feeds hardcoded.

A lógica de fallback para os 240+ feeds hardcoded só ativava se `rss_sources` tivesse `active=false` — não se os feeds falhassem em tempo de execução.

### Correção
```js
async function buscarFeedsDiretos(feeds) {
  const results = await Promise.allSettled(
    feeds.slice(0, 20).map(source =>
      parser.parseURL(source.url)
        .then(feed => (feed.items || []).slice(0, 8)
          .map(i => extrairItem(i, source.name)).filter(Boolean))
        .catch(() => [])
    )
  );
  return results.filter(r => r.status === "fulfilled").flatMap(r => r.value);
}

export async function getNews() {
  // ... busca rss_sources normalmente ...
  let allItems = await buscarFeedsDiretos(feedsParaUsar);
  // Se retornou vazio (feeds com problema), usa feeds hardcoded balanceados
  if (allItems.length === 0) {
    const fallback = selecionarFeedsBalanceados();
    allItems = await buscarFeedsDiretos(fallback);
  }
  return dedupPorTitulo(allItems.sort(() => Math.random() - 0.5));
}
```

### Regra permanente
`getNews()` NUNCA deve retornar array vazio se os feeds hardcoded existem. O fallback duplo é obrigatório.

---

## BUG #11 — Scraper retornava texto vazio para maioria dos sites
**Data:** Mai/2026 | **Arquivo:** `core/scraper.js`

### Sintoma
Editor IA falhava ao receber um link de matéria. `sourceText.length < 50` era disparado com frequência. Sites com layout baseado em divs, paywalls ou JavaScript retornavam texto vazio.

### Causa raiz
O scraper usava apenas `$('p')` para extrair texto — seletor que falha em:
- Sites JS-rendered (axios busca apenas HTML inicial, sem executar JS)
- Layouts baseados em `<div>` em vez de `<p>`
- Sites com paywall (conteúdo atrás de overlay)
- Timeout curto (8s) — sites lentos expiravam antes de retornar

### Correção — 3 camadas de extração
```js
// Camada 1: seletores semânticos de artigo
let textParts = $('article p, [class*="content"] p, [class*="article"] p, '
  + '[itemprop="articleBody"] p, .entry-content p, main p, #content p, p')
  .map((_, el) => $(el).text().trim()).get().filter(t => t.length > 40);

// Camada 2: fallback para divs quando <p> insuficiente
if (textParts.join('').length < 200) {
  const divParts = $('[class*="content"], main, #content, #main')
    .find('p, div').map((_, el) => $(el).text().trim()).get()
    .filter(t => t.length > 50 && !/<[a-z]/i.test(t));
  if (divParts.join('').length > textParts.join('').length) textParts = divParts;
}

let text = textParts.join("\n").slice(0, 4000);

// Camada 3: og:description como último recurso (paywall/JS)
if (text.length < 100) {
  const ogTitle = $('meta[property="og:title"]').attr('content') || $('h1').first().text().trim() || '';
  const ogDesc  = $('meta[property="og:description"]').attr('content')
                  || $('meta[name="description"]').attr('content') || '';
  if (ogTitle || ogDesc) text = [ogTitle, ogDesc].filter(Boolean).join('. ');
}
```

Timeout: 8s → 12s. Headers: Chrome real completo (User-Agent, Accept, Cache-Control).

### Regra permanente
O scraper deve ter as 3 camadas de extração. **Nunca simplificar para apenas `$('p')`** — isso quebra 70%+ dos sites brasileiros que usam divs ou JS.

---

## CONFLITO DE MERGE — Branch `claude/review-project-docs-1mLkx`
**Data:** Mai/2026

### O que aconteceu
Os bugs críticos #7-#11 foram corrigidos diretamente no `main` (bypassing o PR #36) porque o branch tinha divergido muito. O PR #36 foi atualizado via `push_files` para refletir o estado final.

### Lição
Sempre sincronizar o branch de desenvolvimento com main a cada 2-3 dias. Branches muito desatualizados causam conflitos graves.

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
□ getNews() tem fallback duplo (rss_sources → hardcoded) em caso de vazio?
□ scraper.js tem 3 camadas de extração (p → div → og:meta)?
```
