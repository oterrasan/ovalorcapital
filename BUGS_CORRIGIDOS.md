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
**NUNCA** reverter para `isHoje()`. `isRecente()` é a função correta e definitiva. **Janela MÍNIMA: 48h.** Ver também Bug #50 (regressão para 3h que matou o pipeline).

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

## QUALIDADE #1 — Conteúdos praticamente idênticos publicados
**Data:** 18/Mai/2026 | **Arquivo:** `api/run_portal.js` | **Commit:** `8be31a95`

### Sintoma
Artigos com títulos e tópicos muito parecidos sendo publicados em sequência. "dão vergonha num portal desta magnitude" — Roberto.

### Causa raiz
Dedup Jaccard com threshold 0.40 muito permissivo. Stopwords PT ("para", "pelo", "sobre", etc.) inflacionavam a interseção de palavras sem valor semântico. Dois artigos cobrindo exatamente o mesmo evento com títulos ligeiramente diferentes passavam sem bloqueio.

### Correção
```js
const STOPWORDS_DEDUP = new Set([
  'para','pelo','pela','pelos','pelas','como','mais','sobre','apos','entre',
  'nova','novo','novas','novos','com','sem','que','uma','uns','umas',
  'dos','das','nos','nas','aos','seu','sua','seus','suas','sera',
  'antes','nao','nem','mas','ate','alem','desde','isso','esta','este',
  'esse','essa','eles','elas','onde','quando','qual','quais','fica',
  'faz','fez','foi','sao','tem','ter','tinha','seria','pode','deve',
  'diz','disse','afirma','anuncia','revela','aponta','destaca','alerta',
]);

// Dedup 1: Jaccard 0.40 → 0.55, filtra stopwords antes
function tituloSimilar(a, b) {
  const norm = t => (t || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 4 && !STOPWORDS_DEDUP.has(w));
  const wa = new Set(norm(a));
  const wb = new Set(norm(b));
  if (wa.size === 0 || wb.size === 0) return false;
  const intersect = [...wa].filter(w => wb.has(w)).length;
  const union = new Set([...wa, ...wb]).size;
  return (intersect / union) >= 0.55;
}

// Dedup 2: tópico — bloqueia mesmo evento com título diferente
function topicoDuplicado(novoTitulo, titulos) {
  const kws = t => (t || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 5 && !STOPWORDS_DEDUP.has(w));
  const kw = kws(novoTitulo);
  if (kw.length < 3) return false;
  return titulos.some(t => kws(t).filter(w => kw.includes(w)).length >= 3);
}

// recentTitles: janela 24h, limit 500
const { data: rt } = await supabase.from('posts').select('titulo')
  .gte('created_at', new Date(Date.now() - 24 * 3600000).toISOString())
  .limit(500);
```

### Instruções críticas de Roberto (18/05/2026 — INVIOLÁVEIS)
1. **Janela `recentTitles` PERMANECE 24h** — "o portal deve buscar nas fontes apenas conteúdos DO DIA, NUNCA DO DIA ANTERIOR PARA TRÁS"
2. **Dedup de entidade NÃO PODE EXISTIR** — "especialmente em eleições, copa do mundo, política, sempre, o dia todo tem assuntos envolvendo as mesmas figuras"

### Regra permanente
- **NUNCA reduzir** o threshold Jaccard abaixo de 0.55
- **NUNCA remover** `topicoDuplicado()` — é a segunda camada essencial para bloqueio de mesmo evento
- **NUNCA criar** dedup por entidade/personagem — em eleições/Copa/política a mesma figura aparece legitimamente o dia todo
- **NUNCA alterar** a janela `recentTitles` de 24h — é o ciclo fundamental do portal

---

## QUALIDADE #2 — Imagens aleatórias e inadequadas (ilustrações, desenhos, gráficos)
**Data:** 18/Mai/2026 | **Arquivos:** `core/image_finder.js`, `core/image_processor.js` | **Commit:** `8be31a95`

### Sintoma
Artigos publicados com desenhos, ilustrações, gráficos, cliparts e imagens sem relação com o conteúdo. "dão vergonha" — Roberto.

### Causa raiz
O filtro `BLOQUEIO_PATTERNS` existente cobria apenas logos e fotos de autores. O Wikimedia Commons tem muitas ilustrações e diagramas que passavam o filtro por terem URLs aparentemente válidas. A Vision API verificava logos e gráficos/tabelas mas não detectava ilustrações/desenhos.

### Correção — 3 camadas

**Camada 1 — `BLOQUEIO_PATTERNS` em `core/image_finder.js` (filtro URL):**
```js
// Novos patterns adicionados:
'vector', 'ilustra', 'illustration', 'diagram', 'diagrama',
'infograph', 'infografia', 'cartoon', 'drawing', 'clipart',
'clip-art', 'clip_art', 'sketch', 'esquema', 'graphic-design',
'template', 'stock-illustr', 'shutterstock', 'gettyimages',
```

**Camada 2 — Filtro de título em `buscarWikimedia()`:**
```js
if (/flag|bandeira|icon|logo|coat|arms|seal|emblem|svg|mapa|map|diagram|schema|vector|illustration|ilustr|cartoon|chart|graph|infograph|drawing|sketch|template|clipart|badge/i.test(title)) continue;
```
`buscarWikipedia()`: size check — rejeita imagens com `width < 400px` na URL.

**Camada 3 — Vision API em `core/image_processor.js` (novo campo `is_illustration`):**
```js
text: 'Analyze this image. Respond ONLY with valid JSON: {"has_competitor_logo":true/false,"is_chart_or_table":true/false,"is_illustration":true/false}\nis_illustration: true if image is a drawing, cartoon, illustration, clipart, painting, animation, or any non-photographic artwork — NOT a real photograph of a person, place or event.'

// Pipeline rejeita 3 tipos:
if (visionMetrics?.has_competitor_logo === true) return null;
if (visionMetrics?.is_chart_or_table === true) return null;
if (visionMetrics?.is_illustration === true) return null;
```

### Regra permanente
- **NUNCA remover** nenhuma das 3 camadas de rejeição — cada uma cobre casos que as outras não pegam
- Ao adicionar nova fonte de imagens, verificar se passa pelas 3 camadas
- `is_illustration` é tão importante quanto `has_competitor_logo` — ilustrações destroem a credibilidade do portal

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

## BUG #50 — Pipeline sem artigos de madrugada + conteúdo repetitivo (REGRESSÃO do Bug #2)
**Data:** 26/Mai/2026 | **Arquivo:** `core/rss.js` | **Commits:** `764af56` (rss.js), `5554dce` (ai_portal.js)

### Sintoma
Pipeline não gerava NENHUM artigo automático. De madrugada (21:00-07:00 BRT): `no_valid_news` em 100% das rodadas. Nas horas ativas: artigos repetitivos cobrindo os mesmos eventos. Roberto: "esse resumo que voce me deu aqui, é literalmente um absurdo... ele precisa varrer TODAS AS FONTES".

### Causa raiz — Dupla

**Causa 1 — `isRecente()` regressão de 48h para 3h (Bug #2 havia corrigido para 48h, mas foi revertido em alguma sessão):**
```js
// ESTADO ERRADO (regressão):
return (Date.now() - itemDate.getTime()) < 3 * 60 * 60 * 1000; // só 3 horas
```
De madrugada, notícias publicadas às 18h-20h têm 5-10 horas → todas rejeitadas → pool vazio → zero artigos.

**Causa 2 — `getNews()` usando só 10 de 1000+ fontes:**
```js
// ESTADO ERRADO:
.sort(() => Math.random() - 0.5).slice(0, 10) // fontes customizadas: só 10 de 1000+
.sort(() => Math.random() - 0.5).slice(0, 10) // feeds garantidos: também limitados a 10
// Supabase query com .limit(100) — perdia a maioria das fontes
// buscarFeedsDiretos(): .slice(0, 20) — processava só 20
// buscarFeedsEspecificos(): .slice(0, 12) — processava só 12
```

### Correção — 4 fixes em `core/rss.js` (commit `764af56`)
```js
// Fix 1 — isRecente(): 3h → 48h (restaurado ao valor correto do Bug #2)
return (Date.now() - itemDate.getTime()) < 48 * 60 * 60 * 1000;

// Fix 2 — getNews() fontes customizadas: .slice(0, 10) → .slice(0, 100)
const feedsCustom = (allSources || []).filter(s => s.active !== false)
  .sort(() => Math.random() - 0.5).slice(0, 100);

// Fix 3 — getNews() feeds garantidos: removido .slice(0, 10) — processa todos
const feedsGarantidos = [...FEEDS_DIRETOS_GARANTIDOS].sort(() => Math.random() - 0.5);
// Supabase query: .limit(2000) para capturar todas as fontes

// Fix 4 — buscarFeedsDiretos(): removido .slice(0, 20) — processa todos em paralelo
feeds.map(source => fetchFeed(...)); // era feeds.slice(0, 20).map(...)

// Fix 5 — buscarFeedsEspecificos(): removido .slice(0, 12) — processa todos
feeds.map(source => ...); // era feeds.slice(0, 12).map(...)
```

**Também nesta sessão:** `core/ai_portal.js` restaurado ao commit limpo `5e5ccc7` (24/05/2026 16:08 UTC) via commit `5554dce` — removidas todas as experiências Gemini do caos de 25/05.

### Regra permanente
- **`isRecente()` NUNCA deve usar menos de 48h** — Bug #2 estabeleceu 48h. Se regredir para qualquer valor menor, o pipeline para de madrugada.
- **`getNews()` NUNCA usar `.slice(0, N)` com N < 50** — portal tem 1000+ fontes; amostra pequena causa repetição de conteúdo e falha na diversidade.
- **NUNCA adicionar `.slice()` cap em `buscarFeedsDiretos()` ou `buscarFeedsEspecificos()`** — devem processar todos os feeds em paralelo.
- **NUNCA adicionar cap no `.limit()` do Supabase para rss_sources** — usar ≥2000 para garantir que todas as fontes sejam consideradas.

---

## BUG #51 — `deploy.yml` deploying para projeto Vercel errado (CRÍTICO)
**Data:** 26/Mai/2026 | **Arquivo:** `.github/workflows/deploy.yml` | **Commit:** `8dd7f5d`

### Sintoma
Portal sem artigos automáticos há 2+ dias. Admin Reescrita OVC e pipeline com "OpenAI 401: Incorrect API key" MESMO APÓS correções em commits (incluindo base64 fallback em `core/ai_portal.js` no commit `4e5fd7c`). As correções simplesmente não chegavam ao site de produção.

### Causa raiz
`deploy.yml` usava `VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}`. A GitHub Secret `VERCEL_PROJECT_ID` pode apontar para qualquer projeto Vercel — se ela difere do ID real do projeto que serve `www.ovalorcapital.com.br` (que é `prj_ACuRPH3NLCgzsFysuSqnUqSjBr5b`, conforme `.vercel/project.json`), TODOS os deploys desde sempre foram para o projeto errado. O site de produção continuava rodando código antigo com a chave quebrada.

### Diagnóstico adicional
- `api/run_portal.js` tem `catch(e) { continue; }` que engole TODOS os erros OpenAI silenciosamente
- GitHub Actions recebia HTTP 200 `{"status":"no_valid_news"}` e marcava job como ✅ verde
- Resultado: 100% dos artigos falhavam em callOpenAI() mas o pipeline aparecia como funcionando

### Correção
```yaml
# ANTES (perigoso — depende de secret que pode apontar para projeto errado):
VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

# DEPOIS (correto — ID hardcoded confirmado via .vercel/project.json):
VERCEL_PROJECT_ID: prj_ACuRPH3NLCgzsFysuSqnUqSjBr5b
```

Também re-disparado `fix_openai_key.yml` (via commit `8dd7f5d`) para:
1. Atualizar `OPENAI_API_KEY` diretamente na API Vercel para o projeto correto
2. Disparar redeploy do projeto correto

### Regra permanente
**NUNCA** usar `secrets.VERCEL_PROJECT_ID` em `deploy.yml`. O ID do projeto é conhecido e imutável (`prj_ACuRPH3NLCgzsFysuSqnUqSjBr5b` — confirmado em `.vercel/project.json`). Hardcode sempre.

**Se 401 OpenAI persistir após fix:** a chave pode ter sido revogada pela OpenAI. Roberto deve:
1. Acessar `platform.openai.com` → API Keys → criar nova chave
2. Ir em GitHub → Actions → `update_openai_key.yml` → "Run workflow" → colar nova chave

---

## CHECKLIST — Antes de qualquer mudança no pipeline

```
□ isRecente() ainda existe em core/rss.js? (não deve ter voltado para isHoje() — limite MÍNIMO de 48h, nunca menos)
□ getNews() usa .slice(0, 100) para fontes customizadas? NUNCA reduzir abaixo de 50 (Bug #50)
□ buscarFeedsDiretos() e buscarFeedsEspecificos() SEM .slice() cap? (Bug #50 — processam todos os feeds)
□ Supabase query em getNews() usa .limit(2000)? (Bug #50 — não usar valores menores)
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
□ Dedup Jaccard threshold ≥ 0.55 em tituloSimilar()? (Qualidade #1 — NUNCA reduzir)
□ topicoDuplicado() existe e bloqueia ≥3 keywords em comum? (Qualidade #1)
□ STOPWORDS_DEDUP filtradas antes do Jaccard e do tópico? (Qualidade #1)
□ recentTitles tem janela de 24h e limit 500? (Qualidade #1 — 24h INVIOLÁVEL)
□ NÃO existe dedup por entidade/personagem no pipeline? (Qualidade #1 — REMOVIDO intencionalmente)
□ BLOQUEIO_PATTERNS inclui vector, illustration, cartoon, diagram, sketch, template? (Qualidade #2)
□ buscarWikimedia() rejeita títulos com illustration, cartoon, chart, diagram, sketch? (Qualidade #2)
□ Vision API verifica is_illustration E is_chart_or_table E has_competitor_logo? (Qualidade #2)
□ validarConteudo() rejeita corpo < 2500 chars?
□ rewritePortal() rejeita corpo < 3000 chars?
□ home.js faz 1 fetch bulk (/api/portal-posts?recentes=true) — NÃO retornar para múltiplos fetches? (Perf #1)
□ ovc-cards.js faz 1 fetch bulk — NÃO retornar para múltiplos fetches? NÃO tem setInterval(load)? (Perf #1)
□ api/portal-posts.js tem endpoint ?recentes=true com Cache-Control: public, max-age=60? (Perf #1)
□ deploy.yml usa VERCEL_PROJECT_ID: prj_ACuRPH3NLCgzsFysuSqnUqSjBr5b hardcoded (NÃO secrets)? (Bug #51)
□ core/ai_portal.js linha 7 tem base64 fallback com chave terminando em ...fb8xhlZo1FQkEA? (Bug #49)
□ fix_openai_key.yml usa PROJECT_ID hardcoded prj_ACuRPH3NLCgzsFysuSqnUqSjBr5b? (Bug #51)
□ core/image_processor.js usa OUT_WIDTH=1200, OUT_HEIGHT=675 (16:9 web)? NUNCA voltar para 1080×1350 (era formato IG, Instagram desabilitado)
□ public/index.html NÃO foi modificado para PageSpeed sem plano SSR aprovado? (Incidente 28/05)

---

## BUG #54 — INCIDENTE PAGESPEED — Extração de base64 inline piorou LCP de 6.8s para 27s
**Data:** 28/05/2026 | **Arquivos:** `public/index.html` (revertido), `core/image_processor.js` (mantido)

### Sintoma
Score PageSpeed mobile caiu de ~50 para ~43 após extração de imagens base64. Em seguida, nova tentativa de fix levou o score para ~30s mobile e derrubou desktop de 92 para ~70.

### Causa raiz
`public/index.html` tinha 3 imagens base64 inline: favicon (88KB PNG), logo (105KB PNG), thumbnail (2.3KB). Total: ~261KB de base64 num HTML de 295KB.

Ao extrair o logo para arquivo externo (`/img/logo-ovc.webp`), o browser mudou o candidato LCP:
- **Antes**: Logo (inline base64) = LCP instantâneo com o HTML → LCP ~6.8s
- **Depois**: Cards de artigo (carregados via JavaScript após chamada de API) = LCP ~27s

A segunda tentativa (logo WebP base64 inline, 9KB) ainda resultou em LCP alto e CLS 1.001 — os cards de artigo carregados via JS continuavam sendo o maior elemento na tela e causavam layout shifts ao serem inseridos dinamicamente.

### O problema real (estrutural)
O homepage é arquivo estático + JavaScript que busca artigos de uma API. O Google Lighthouse identifica o primeiro card de artigo com imagem como o elemento LCP. Esse elemento só aparece depois de:
1. HTML carregado
2. CSS+JS baixados e executados
3. Chamada para `/api/portal-posts?recentes=true` completada
4. Cards renderizados no DOM
5. Imagem do primeiro card baixada do Supabase Storage

**Nenhuma otimização de HTML resolve isso.** A solução correta é SSR da homepage.

### Correção aplicada
REVERT total de `public/index.html` ao estado do commit `e96f999` (commit `2fb2a0c`).

### O que FOI mantido desta sessão
`core/image_processor.js`: dimensões 1080×1350 → 1200×675 (16:9 web) — Roberto confirmou que Instagram está desabilitado. Artigos novos gerados pelo pipeline saem ~3x menores (50–100KB vs 150–300KB).

### Arquivos órfãos no repo (inofensivos mas não referenciados)
- `public/favicon.png` — criado mas index.html revertido ao base64 original
- `public/img/logo-ovc.webp` — idem
- `public/img/tv-thumb.webp` — idem

### Como resolver PageSpeed corretamente (SEM criar 11º arquivo em api/)
```
1. Adicionar ?format=homepage em api/portal-posts.js
   → retorna HTML completo com artigos pré-renderizados (SSR)
2. Adicionar rewrite em vercel.json (commit isolado!):
   { "source": "/", "destination": "/api/portal-posts?format=homepage" }
3. public/index.html passa a ser ignorado para a homepage
4. LCP: primeira imagem de artigo já está no HTML → browser faz preload → rápido
5. CLS: zero — layout não muda porque artigos já estão no HTML
```
**RISCO**: Mudança grande. Fazer com planejamento, com staging branch, NÃO na pressa.

### Regra permanente
```
❌❌❌ NUNCA mexer em public/index.html para PageSpeed sem plano SSR aprovado
❌❌❌ Extrair base64 inline piora LCP quando conteúdo principal carrega via JS
❌❌❌ NÃO tentar "otimizações rápidas" em arquivos críticos da homepage
```
```
