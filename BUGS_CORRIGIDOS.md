# BUGS CORRIGIDOS — O Valor Capital

> Histórico completo de todos os bugs críticos identificados e corrigidos.
> **Leia antes de qualquer sessão de trabalho.**
> Se você está a ponto de "simplificar" alguma dessas correções — pare. Cada uma delas corrige um bug real que derrubou o portal.

---

## BUG #1 — Artigos antigos abrindo página em branco
**Data:** Mai/2026 | **Arquivo:** `api/article.js`

### Sintoma
Qualquer artigo publicado há mais de 2 dias retornava página completamente em branco.

### Causa raiz
`conteudo` de artigos antigos tinha `</script>` literais. Embutido em `JSON.stringify()` dentro de `<script>` → parser do browser fechava o bloco → JS quebrava.

### Correção
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
**Data:** Mai/2026 | **Arquivo:** `core/rss.js`

### Causa raiz
`isHoje()` rejeitava itens sem data (Google News omite pubDate) e artigos de ontem.

### Correção
```js
function isRecente(dateStr) {
  if (!dateStr) return true;
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
**Data:** Mai/2026 | **Arquivo:** `api/run_portal.js`, `core/rss.js`

### Causa raiz
Quando `catForcada` era definida, pipeline mesclava feeds da categoria alvo com feeds gerais. Sem validação de família temática.

### Correção
1. Feeds exclusivos quando `catForcada`
2. Mapa `FAMILIA_CAT` exportado de `core/rss.js`
3. Validação: se família do conteúdo gerado ≠ família da categoria forçada → descarta

### Regra permanente
Ao adicionar nova categoria, adicionar ao `FAMILIA_CAT` com a família correta.

---

## BUG #4 — Subcategoria "Geral" sendo salva no banco
**Data:** Mai/2026 | **Arquivo:** `api/run_portal.js`

### Correção
```js
const subcatForcada = /^(geral|qualquer|qualquer subcategoria|any|todos?)$/i.test(subcatRaw)
  ? '' : subcatRaw;
```

### Regra permanente
O banco NUNCA deve ter `subcategoria = 'Geral'`.

---

## BUG #5 — Volume de artigos muito baixo (4 artigos em 48h)
**Data:** Mai/2026 | **Arquivo:** `api/run_portal.js`

### Causa raiz
`targetCount` padrão = 1, pool de 40 itens, sem dedup de títulos, combinado com BUG #2.

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
**Data:** Mai/2026 | **Arquivo:** `api/run_portal.js`

### Causa raiz
Cron esgotava o limite diário (300 posts) nas primeiras horas da madrugada.

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
Nunca remover o bloco de faixas horárias sem criar mecanismo equivalente.

---

## BUG #7 — Geração manual sempre falhava silenciosamente (CRÍTICO)
**Data:** Mai/2026 | **Arquivo:** `api/manage.js`

### Causa raiz
`validar()` tinha `if (!c.includes("redação ovc")) return false;` — a IA nunca escreve isso. 100% das gerações eram rejeitadas silenciosamente.

### Correção
Linha removida. Validação verifica apenas título, comprimento mínimo e palavras proibidas.

### Regra permanente
**NUNCA** exigir strings fixas da IA no corpo do artigo.

### ⚠️ REGRESSÃO REGISTRADA — 14/mai/2026
A linha `if (!c.includes("redação ovc")) return false;` voltou ao código em alguma sessão e ficou por ~1 semana matando 100% das gerações manuais do admin. Corrigida novamente em 14/mai/2026. **NUNCA mais colocar essa linha de volta.**

---

## BUG #8 — Botão "Forçar Execução" enviava GET sem body
**Data:** Mai/2026 | **Arquivo:** `public/admin/automacao.html`

### Causa raiz
`fetch('/api/run_portal')` sem método POST → body ignorado → `force=false`.

### Correção
```js
fetch('/api/run_portal', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ force: true, count: 3 }) })
```

### Regra permanente
Todo fetch para `/api/run_portal` que pretende forçar execução DEVE ser POST com `{force:true}`.

---

## BUG #9 — Tabela de posts no admin usava coluna inexistente
**Data:** Mai/2026 | **Arquivo:** `public/admin/automacao.html`

### Causa raiz
Usava `p.categoria`. A coluna `categoria` não existe em `posts`. A categoria fica em `user_tags`.

### Correção
```js
.select('id,titulo,user_tags,publish_method,created_at,status')
function getCat(post) {
  try { return JSON.parse(post.user_tags || '[]')[0] || '—'; } catch(_) { return '—'; }
}
```

### Regra permanente
**NUNCA usar `p.categoria`** — a coluna não existe. Sempre usar `user_tags` com parse JSON.

---

## BUG #10 — getNews() sem fallback real quando rss_sources falha
**Data:** Mai/2026 | **Arquivo:** `core/rss.js`

### Causa raiz
Se `rss_sources` retornava 0 itens (rate-limit), função retornava array vazio sem tentar feeds hardcoded.

### Correção
`buscarFeedsDiretos()` com fallback duplo.

### Regra permanente
`getNews()` NUNCA deve retornar array vazio se os feeds hardcoded existem.

---

## BUG #11 — Scraper retornava texto vazio para maioria dos sites
**Data:** Mai/2026 | **Arquivo:** `core/scraper.js`

### Causa raiz
Scraper usava apenas `$('p')` → falha em layouts div-based, JS-rendered e paywalls.

### Correção — 3 camadas
1. Seletores semânticos (`article p`, `[class*="content"] p`, etc.)
2. Fallback para divs quando `<p>` insuficiente
3. `og:description` + `og:title` como último recurso

### Regra permanente
**Nunca simplificar para apenas `$('p')`** — quebra 70%+ dos sites brasileiros.

---

## BUG #12 — `no_news` persistente apesar do fallback (CRÍTICO)
**Data:** Mai/2026 | **Arquivo:** `core/rss.js` | **Commit:** `65928cb`

### Causa raiz
Fallback do BUG #10 usava `selecionarFeedsBalanceados()` que podia sortear 100% Google News → mesmo rate-limit.

### Solução definitiva
`getNews()` SEMPRE mistura feeds customizados com `FEEDS_DIRETOS_GARANTIDOS` na primeira tentativa:
```js
const feedsParaUsar = [...feedsCustom, ...feedsGarantidos];
```

### Regra permanente
**`getNews()` deve SEMPRE misturar `FEEDS_DIRETOS_GARANTIDOS` na 1a tentativa.** Nunca depender só de `rss_sources`.

---

## BUG #13 — Pipeline salvava como `pendente` — portal sem artigos por ~3 dias (CRÍTICO)
**Data:** 14/Mai/2026 | **Arquivos:** `api/run_portal.js`, `api/manage.js`

### Causa raiz
Ambos salvavam `status: 'pendente'`, `approved: false`. `portal-posts.js` filtra só por `status = 'publicado'`. Resultado: artigos invisíveis indefinidamente.

### Correção (14/mai/2026)
```js
const now = new Date().toISOString();
{ status: 'publicado', approved: true, published_at: now }
```

### ⚠️ ATENÇÃO — INVERTIDO INTENCIONALMENTE pelo Block 6 (17/mai/2026)
> Roberto determinou em 17/05/2026 que **o pipeline automático deve salvar como `pendente`** para aprovação humana obrigatória antes de publicar. Isso é o **Block 6 — Staging Protocol** e é intencional.
>
> **O que mudou:**
> - Pipeline (`api/run_portal.js`): salva `status:'pendente'`, `approved:false`, SEM `published_at` ✅ INTENCIONAL
> - Posts manuais (`handleManual` em `api/manage.js`): CONTINUAM salvando como `publicado` — apenas o pipeline automático virou pendente
>
> **Fluxo correto desde 17/mai/2026:**
> Pipeline gera → salva como pendente → Roberto aprova no admin (Postagens > filtro pendente > Publicar no Portal) → status vira publicado

### Regra permanente
**NUNCA reverter `api/run_portal.js` para `status:'publicado'` sem autorização explícita de Roberto.** O staging protocol é intencional e inviolável (ver Regra Zero-D no CLAUDE.md).

---

## BUG #14 — Links antigos `?id=` abriam página de categoria vazia
**Data:** 14/Mai/2026 | **Arquivo:** `api/category.js`

### Causa raiz
URL `/esportes/?id=dc226eae` chegava em `category.js`, que ignorava o `?id=` e servia o template. O JS do frontend fazia fetch por ID, recebia 404 (artigos em pendente), silenciava o erro → página branca.

### Correção
```js
export default async function handler(req, res) {
  const artId = (req.query.id || "").trim();
  if (artId) {
    return res.redirect(302, "/og?id=" + encodeURIComponent(artId));
  }
  // ...resto do handler
}
```

### Regra permanente
`api/category.js` deve SEMPRE redirecionar `?id=` para `/og?id=` antes de qualquer lógica de categoria.

---

## BUG #15 — /vc/ mostrava conteúdo sem sentido ou vazio
**Data:** 14/Mai/2026 | **Arquivo:** `api/landing.js`

### Sintoma
A página `/vc/` mostrava artigos completamente fora de contexto, ou ficava vazia.

### Causa raiz
O objeto `vc` em `SECTIONS` de `api/landing.js` tinha `cats: ["vc", "colunistas"]`. A query buscava artigos com `user_tags` contendo `"vc"` ou `"colunistas"`. O pipeline automático **nunca** gera artigos com essas tags — elas são reservadas para conteúdo de colunistas humanos.

### Correção
```js
vc: {
  title: "Variedades & Editorial",
  desc: "Investigação jornalística, cultura, variedades e análises.",
  cats: ["investigativo", "variedades", "cultura"],
}
```

### Regra permanente
- **`vc` e `colunistas` NÃO são categorias do pipeline automático.**
- A landing page `/vc/` deve usar cats que o pipeline efetivamente usa (`investigativo`, `variedades`, `cultura`).

---

## BUG #16 — Footer de landing pages sem copyright 2026 e links institucionais
**Data:** 14/Mai/2026 | **Arquivo:** `api/landing.js`

### Correção
Atualização direta de `buildFooter()` em `api/landing.js`.

### Regra permanente
- **Qualquer mudança no footer das landing pages DEVE ser feita diretamente em `buildFooter()` em `api/landing.js`.**
- O `newsletter-bar.js` NÃO funciona em landing pages.

---

## BUG #17 — Regressão do Bug #7 — geração manual parada por ~1 semana (CRÍTICO)
**Data:** 14/Mai/2026 | **Arquivo:** `api/manage.js`

### Causa raiz
A linha `if (!c.includes("redação ovc")) return false;` voltou para dentro da função `validar()` em alguma sessão anterior.

### Correção
Linha removida novamente.

### Regra permanente
**ABSOLUTAMENTE NUNCA** adicionar `c.includes("qualquer string fixa")` dentro de `validar()`. A IA não produz strings deterministas. Isso mata 100% das gerações sem erro visível.

---

---

## BUG #23 — Markdown bruto visível nos títulos e corpo dos artigos (CRÍTICO)
**Data:** 17/Mai/2026 | **Arquivos:** `core/ai_portal.js`, `public/js/internal-page-v2.js`, `api/article.js`

### Sintoma
Títulos aparecendo como `**Lula sanciona reforma**` e corpo com `## Contexto`, `* bullet` visíveis no portal para artigos gerados após 16/05/2026.

### Causa raiz
O prompt (corrigido em 17/05) passou a gerar HTML, mas artigos gerados entre 16/05 e início de 17/05 ainda tinham markdown. Além disso, os SEO tags (`<title>`, og:title) em article.js não faziam strip de `**`.

### Correções aplicadas
1. `core/ai_portal.js`: função `markdownToHtml()` — converte `##`→`<h2>`, `* item`→`<ul><li>`, `**bold**`→`<strong>`, texto plano→`<p>`. Aplicada no `parse()` antes de salvar no banco. Strip de `**` no titulo também.
2. `api/article.js`: strip de `**` do `titulo` no topo do handler (antes dos SEO tags).
3. `api/article.js`: injeção do "Leia também" só ocorre quando `corpo` é HTML (guard `^\s*<[a-z]`).
4. `public/js/internal-page-v2.js`: `stripMd()` aplicada em todos os 4 renders de card e no h1/title do artigo.

### Regra permanente
O corpo dos artigos SEMPRE deve ser HTML. Qualquer conteúdo markdown que entrar no banco deve ser convertido via `markdownToHtml()` no `parse()`. O frontend tem `stripMd()` como linha de defesa adicional nos títulos.

---

## BUG #24 — "Leia também" aparecendo como texto escapado no corpo do artigo
**Data:** 17/Mai/2026 | **Arquivo:** `api/article.js`

### Sintoma
Bloco `&lt;div class="leia-tambem"&gt;...&lt;/div&gt;` visível como texto no final dos artigos.

### Causa raiz
`corpoFinal` tinha conteúdo markdown (não HTML). O inject do bloco "Leia também" injetava HTML no meio de markdown, que depois era renderizado via path legado do `renderCorpo()` que usa `esc()` — escapando todo o HTML.

### Correção
Guard no inject: `if (related.length > 0 && /^\s*<[a-z]/i.test(corpoFinal.trim())) { ... inject ... }`

### Regra permanente
**NUNCA** injetar HTML em `corpoFinal` sem verificar primeiro que o corpo já é HTML.

---

## BUG #25 — Foto errada para entidades Bolsonaro (Jair usado para Flávio/Eduardo/Carlos)
**Data:** 17/Mai/2026 | **Arquivo:** `core/image_finder.js`

### Sintoma
Artigos sobre Flávio Bolsonaro, Eduardo Bolsonaro ou Carlos Bolsonaro exibiam foto de Jair Bolsonaro.

### Causa raiz
No objeto `ALIASES`, a entrada genérica `'bolsonaro': 'Jair Bolsonaro'` aparecia ANTES das específicas `'flávio bolsonaro': 'Flávio Bolsonaro'`. O texto "Flávio Bolsonaro" batia primeiro na string "bolsonaro" genérica.

### Correção
Reordenamento: aliases específicos multi-palavra (`'flávio bolsonaro'`, `'eduardo bolsonaro'`, `'carlos bolsonaro'`, `'jair bolsonaro'`) ANTES do genérico `'bolsonaro'`. Lógica de dedup em `extrairEntidades()` para pular alias genérico se específico já foi encontrado.

### Regra permanente
**SEMPRE** colocar aliases mais específicos (multi-palavra) ANTES dos genéricos no objeto `ALIASES`. Nunca inverter essa ordem.

---

## BUG #26 — Artigos sem imagem quando `processAndSaveImage` falha
**Data:** 17/Mai/2026 | **Arquivo:** `api/run_portal.js`

### Sintoma
Artigos salvos com `imagem: null` quando a imagem scrapeada era de domínio concorrente ou inválida.

### Causa raiz
O pipeline chamava `processAndSaveImage(scraped_image)` mas, se a imagem era de concorrente ou inválida, retornava `null`. Não havia fallback para buscar uma imagem via `findImage()`.

### Correção
Após `processAndSaveImage` retornar null, pipeline tenta `findImage(titulo, categoria)` como fallback. Se o resultado ainda falhar no `processAndSaveImage`, usa a URL direta como último recurso.

### Regra permanente
O pipeline NUNCA deve salvar artigo com `imagem: null` sem ter tentado todas as opções: scrape → processAndSaveImage → findImage → URL direta.

---

## BUG #27 — Artigos duplicados (15+ sobre mesma entidade em 1 dia)
**Data:** 17/Mai/2026 | **Arquivo:** `api/run_portal.js`

### Sintoma
15+ artigos sobre Flávio Bolsonaro publicados no mesmo dia.

### Causa raiz
O dedup existente era apenas por Jaccard de títulos (40% threshold). Dois artigos com títulos diferentes mas sobre a mesma pessoa passavam o filtro.

### Correção
Função `extrairNomePrincipal(titulo)` identifica o nome principal de um título. No pipeline, antes de processar cada item, conta quantos artigos das últimas 24h contêm o sobrenome da entidade. Se ≥3, descarta. Limite: 3 artigos por entidade por 24h.

### Regra permanente
Dedup duplo: Jaccard de títulos (40%) + entidade (máx 3/entidade/24h). Nunca remover um sem o outro.

---

## BUG #28 — Conteúdo gerado muito curto (3 parágrafos, < 800 chars)
**Data:** 17/Mai/2026 | **Arquivos:** `api/run_portal.js`, `core/ai_portal.js`

### Sintoma
Artigos com apenas 3 parágrafos, ~600–800 chars de conteúdo.

### Causa raiz
`validarConteudo()` em `run_portal.js` aceitava conteúdo com ≥800 chars. `rewritePortal()` em `ai_portal.js` aceitava ≥2500 chars. Thresholds muito baixos.

### Correção
- `validarConteudo()`: threshold 800 → 2500 chars
- `rewritePortal()`: threshold 2500 → 3000 chars

### Regra permanente
Artigo mínimo aceitável: 2500 chars de `corpo` (≈ 5–6 parágrafos HTML). NUNCA reduzir esses thresholds.

---

## PERF #1 — 57 requests simultâneos na homepage travando o portal (18/05/2026)
**Data:** 18/Mai/2026 | **Arquivos:** `api/portal-posts.js`, `public/js/home.js`, `public/js/ovc-cards.js`

### Sintoma
Portal muito lento, até travando no carregamento. Usuário relata portal "travando em alguns momentos".

### Causa raiz
Homepage disparava **57 requests HTTP simultâneos** a cada carregamento:
- `ovc-cards.js`: `Promise.all` com 28 fetches individuais (1 por categoria)
- `home.js`: ~25 fetches individuais (hero cards + 21 seções de categoria)
- Mais lidas, OVC TV, colunistas, banners: ~4 fetches
- `setInterval(load, 120000)` em `ovc-cards.js` repetia os 28 fetches a cada 2 minutos enquanto o usuário navegava

Cada fetch era uma serverless function separada no Vercel Hobby → esgotamento de concorrência.

### Solução
**Novo endpoint bulk `?recentes=true` em `api/portal-posts.js`:**
```js
if (req.query.recentes === 'true') {
  const lim = Math.min(parseInt(limit || '300', 10), 500);
  const { data: recentData } = await supabase.from("posts")
    .select("id,titulo,comentario_fixado,imagem,user_tags,subcategoria,subcategoria_slug,created_at,published_at")
    .eq("status", "publicado")
    .order("published_at", { ascending: false })
    .limit(lim);
  // filtra por CATS_VALIDAS_R, formata, retorna
  res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
  return res.status(200).json({ posts: recentPosts, total: recentPosts.length });
}
```

**`home.js`:** 1 fetch bulk → cache `{categoria: [posts]}` → distribui para todas as funções client-side.

**`ovc-cards.js`:** 1 fetch bulk → cache → distribui para todos os 28 CATS client-side. `setInterval(load, 120000)` removido.

### Resultado
57 requests → ~4 requests por carregamento de homepage. Cache de 60s evita re-fetch desnecessário.

### Regra permanente
**NUNCA** retornar para múltiplos fetches por categoria em `home.js` ou `ovc-cards.js`. O endpoint `?recentes=true` é a única fonte de dados para cards da homepage. Ao adicionar nova seção de categoria, usar o cache já carregado — não criar novo fetch.

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
□ validar() em manage.js NÃO tem c.includes("redação ovc")? (Bug #7 já regrediu 2x)
□ forçarExecucao() em automacao.html envia POST com {force:true, count:3}?
□ automacao.html usa user_tags (não categoria) no select e na tabela?
□ getNews() mistura feedsCustom + feedsGarantidos na 1a tentativa?
□ getNews() tem fallback total com FEEDS_DIRETOS_GARANTIDOS se allItems=[]?
□ scraper.js tem 3 camadas de extração (p → div → og:meta)?
□ api/run_portal.js pipeline salva status:'pendente', approved:false, SEM published_at? (Block 6 — INTENCIONAL)
□ api/manage.js handleManual salva status:'publicado', approved:true, published_at:now? (posts manuais publicam direto)
□ category.js redireciona ?id= para /og?id= antes de qualquer lógica?
□ api/landing.js vc section usa cats: ["investigativo","variedades","cultura"]?
□ api/landing.js buildFooter() tem copyright 2026 + links institucionais?
□ newsletter-bar.js NÃO é usado para patchear footer de landing pages?
□ api/ tem exatamente 10 arquivos? (contar antes de qualquer push)
□ vercel.json não tem maxDuration > 10?
□ markdownToHtml() existe em core/ai_portal.js e é chamado no parse()?
□ stripMd() existe em public/js/internal-page-v2.js e é aplicado nos 4 renders de card?
□ Injeção de "Leia também" em article.js tem guard de HTML antes de injetar?
□ ALIASES em image_finder.js tem específicos ANTES do genérico 'bolsonaro'?
□ Pipeline tem fallback findImage() quando processAndSaveImage retorna null?
□ Dedup de entidade (max 3/entidade/24h) ativo em run_portal.js?
□ validarConteudo() rejeita corpo < 2500 chars?
□ rewritePortal() rejeita corpo < 3000 chars?
□ home.js faz 1 fetch bulk (/api/portal-posts?recentes=true) — NÃO retornar para múltiplos fetches? (Perf #1)
□ ovc-cards.js faz 1 fetch bulk — NÃO retornar para múltiplos fetches? NÃO tem setInterval(load)? (Perf #1)
□ api/portal-posts.js tem endpoint ?recentes=true com Cache-Control: public, max-age=60? (Perf #1)
```
