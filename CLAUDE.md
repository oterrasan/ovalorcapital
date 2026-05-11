# CLAUDE.md — Contexto completo do projeto O Valor Capital

> Este arquivo serve para retomar qualquer sessão de trabalho sem precisar explicar nada novamente.
> Leia do início ao fim antes de qualquer ação.
> **REGRA PERMANENTE:** Ao final de cada sessão, atualize este arquivo com tudo o que foi feito/planejado. O próximo Claude depende disso.

---

# 🔴 REGRA NÚMERO 1 — LEI ABSOLUTA E INVIOLÁVEL DO PORTAL

## TODA PÁGINA DO PORTAL DEVE TER SEO 100% COMPLETO. SEM EXCEÇÃO. SEM NEGOCIAÇÃO.

> Esta regra foi estabelecida pelo dono Roberto (Terrasan) em mai/2026 e nunca pode ser revertida, ignorada ou contornada por nenhuma IA, nenhum desenvolvedor, nenhuma atualização futura.
>
> **Se você está lendo isso, esta regra se aplica a você agora.**

### O QUE SIGNIFICA "SEO 100% COMPLETO" — CHECKLIST OBRIGATÓRIO

Não existe página, seção, rota ou template no portal que não tenha TODOS os itens abaixo.
Se uma página nova for criada e não tiver isso, está ERRADA. Corrija antes de publicar.

```
Para TODA e qualquer página do portal (artigos, categorias, landing pages,
radar, cotações, tv, rádio, agenda, busca, newsletter, 404, etc.):

✅ <title> único, descritivo, com keywords reais (não placeholder)
✅ <meta name="description"> única, entre 120-160 chars, com keywords
✅ <link rel="canonical"> apontando para a URL canônica correta (sempre www)
✅ <meta property="og:type">
✅ <meta property="og:site_name" content="O Valor Capital">
✅ <meta property="og:title">
✅ <meta property="og:description">
✅ <meta property="og:image"> (mínimo: og-default.jpg)
✅ <meta property="og:url">
✅ <meta property="og:locale" content="pt_BR">
✅ <meta name="twitter:card" content="summary_large_image">
✅ <meta name="twitter:site" content="@ovalorcapital">
✅ <meta name="twitter:title">
✅ <meta name="twitter:description">
✅ <meta name="twitter:image">
✅ JSON-LD schema (NewsArticle para artigos, CollectionPage para categorias/landing,
   WebPage para radar/tv/rádio, Dataset para cotações)
✅ SSR — o Googlebot recebe TODO o HTML acima sem executar JavaScript
✅ Cache adequado — nunca "no-cache" em páginas de conteúdo
✅ URL com slug legível (nunca ?id=, nunca parâmetros na URL de artigos)
✅ Presente no sitemap.xml dinâmico
```

### O QUE É PROIBIDO — PARA SEMPRE

```
❌ <title>Política no O Valor Capital</title>  ← placeholder sem keywords
❌ <meta name="description" content="Radar OVC no O Valor Capital.">  ← zero valor
❌ Página sem canonical
❌ Canonical apontando para ?id= (formato morto)
❌ og:image ausente em qualquer página
❌ twitter:card ausente em qualquer página
❌ Página de conteúdo com Cache-Control: no-cache (mata CDN e Core Web Vitals)
❌ Página nova criada sem SEO completo
❌ Template de categoria com description genérica
❌ 404 sem <meta name="robots" content="noindex, nofollow">
❌ Página acessível mas ausente do sitemap
❌ Landing page SSR sem og:image
❌ Rota existente sem rewrite configurado no vercel.json
```

### PADRÃO DE IMPLEMENTAÇÃO — COMO FAZER CERTO

Toda página nova segue este padrão (copie de `api/category.js` ou `api/live.js`):

```js
// 1. Definir SEO data com title, desc e canonical únicos para a página
const seoTags = [
  `<title>${esc(title)}</title>`,
  `<meta name="description" content="${esc(desc)}">`,
  `<link rel="canonical" href="${canonical}">`,
  `<meta property="og:type" content="website">`,
  `<meta property="og:site_name" content="O Valor Capital">`,
  `<meta property="og:title" content="${esc(title)}">`,
  `<meta property="og:description" content="${esc(desc)}">`,
  `<meta property="og:image" content="${OG_DEFAULT}">`,
  `<meta property="og:url" content="${canonical}">`,
  `<meta property="og:locale" content="pt_BR">`,
  `<meta name="twitter:card" content="summary_large_image">`,
  `<meta name="twitter:site" content="@ovalorcapital">`,
  `<meta name="twitter:title" content="${esc(title)}">`,
  `<meta name="twitter:description" content="${esc(desc)}">`,
  `<meta name="twitter:image" content="${OG_DEFAULT}">`,
  `<script type="application/ld+json">${jsonLd}</script>`,
].join("\n");

// 2. Injetar no template ANTES de </head>
html = html.replace(/<title>[^<]*<\/title>/i, "");
html = html.replace(/<meta\s+name="description"[^>]*>/i, "");
html = html.replace("</head>", seoTags + "\n</head>");

// 3. Cache adequado — NUNCA no-cache em conteúdo
res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
```

### POR QUE ESTA REGRA EXISTE

O modelo de negócio do portal é 100% dependente do Google:
```
SEO perfeito → Google indexa → tráfego orgânico → AdSense/AdX → receita
```
Uma página sem SEO é uma página que não existe para o Google.
Uma página que não existe para o Google não gera receita.
Uma página que não gera receita não tem razão de existir.

**Portanto: página sem SEO = dinheiro jogado fora.**

### HISTÓRICO DE CORREÇÕES SEO (mai/2026)

Em mai/2026 foram identificados e corrigidos os seguintes problemas críticos:

| Problema | Impacto | Correção |
|---|---|---|
| 29 categorias com description "Política no O Valor Capital." | Thin content, sem ranking | `api/category.js` — SSR com descriptions únicas |
| Radar/TV/Rádio/Cotações sem SEO real | Palavras-chave valiosas perdidas | `api/live.js` — SSR com titles/descriptions otimizados |
| `/seguranca/` sem rewrite — landing SSR inacessível | Seção inteira invisível | `vercel.json` — rewrite adicionado |
| Canonical do `/materia/` apontando para `?id=` | Autoridade dividida | `api/article-ssr.js` — canonical para slug URL |
| og:image e twitter:card ausentes em landing pages | Google Discover bloqueado | `api/landing.js` — tags adicionadas |
| Homepage com `Cache-Control: no-cache` | CDN inativo, LCP ruim | `vercel.json` — `s-maxage=60` |
| `/bem-estar/` e `/inteligencia/` fora do sitemap | Google não descobre | `api/sitemap.js` — URLs adicionadas |
| 404.html com título "Matéria" e sem noindex | Google indexa erro como conteúdo | `public/404.html` — noindex + título correto |
| Canonical sem www inconsistente | Autoridade dividida entre www/non-www | `api/article.js` — normalizado para www |

---

# 🚨 BUGS CRÍTICOS CORRIGIDOS — SESSÃO MAI/2026

> Estes bugs causaram colapso do pipeline e páginas em branco. Cada um documentado em detalhe no arquivo `BUGS_CORRIGIDOS.md`.
> **NUNCA reverter estas correções.**

## BUG 1 — Artigos antigos abrindo página em branco (`api/article.js`)

**Sintoma:** Qualquer artigo com mais de 2 dias retornava página completamente em branco.

**Causa raiz:** O campo `conteudo` de artigos antigos continha HTML bruto com tags `</script>` literais. Quando esse conteúdo era embutido diretamente em um bloco `<script>` via `JSON.stringify()`, o parser HTML do navegador fechava o bloco na primeira `</script>` encontrada dentro do JSON, corrompendo toda a página.

**Correção — `api/article.js`:**
```js
// ANTES (quebrado):
const dataScript = `<script>window.__ARTICLE_DATA__=${JSON.stringify(article)}</script>`;

// DEPOIS (correto) — safeJsonForScript() obrigatório:
function safeJsonForScript(obj) {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")   // nunca deixa </script> fechar o bloco
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
const dataScript = `<script>window.__ARTICLE_DATA__=${safeJsonForScript(article)}</script>`;
```

**Aplica-se a:** `preload` (dados do artigo + `conteudo`) e `jsonLd` (Schema.org). Ambos precisam de `safeJsonForScript()`.

**⚠️ ATENÇÃO FUTURA:** Se qualquer campo de texto livre (conteudo, titulo, comentario_fixado) for injetado em tag `<script>`, SEMPRE usar `safeJsonForScript()`. NUNCA usar `JSON.stringify()` diretamente dentro de `<script>`.

---

## BUG 2 — Pipeline retornando `no_valid_news` em 100% das chamadas (`core/rss.js`)

**Sintoma:** Todas as chamadas automatizadas retornavam `{status: 'no_valid_news'}`. O portal gerou apenas 4 artigos em 48h.

**Causa raiz:** A função `isHoje()` em `core/rss.js` tinha dois problemas fatais:
1. Rejeitava itens RSS sem `pubDate`/`isoDate` — o Google News frequentemente omite datas
2. Rejeitava qualquer item de ontem (mesmo que publicado há 1 hora, às 23:59)

Como resultado, TODOS os itens RSS eram descartados antes de qualquer processamento.

**Correção — `core/rss.js`:**
```js
// ANTES (quebrado) — isHoje() rejeitava itens sem data e itens de ontem:
function isHoje(dateStr) {
  if (!dateStr) return false;  // ← PROBLEMA: Google News não envia data
  // ... só aceitava artigos do dia atual no fuso Brasília
}

// DEPOIS (correto) — isRecente() aceita últimas 48h e sem data:
function isRecente(dateStr) {
  if (!dateStr) return true;  // ← aceita item sem data (Google News)
  try {
    const itemDate = new Date(dateStr);
    if (isNaN(itemDate.getTime())) return true;  // data inválida → aceita
    return (Date.now() - itemDate.getTime()) < 48 * 60 * 60 * 1000;  // últimas 48h
  } catch (_) { return true; }
}
```

**⚠️ ATENÇÃO FUTURA:** Nunca reverter para `isHoje()`. O Google News é a maior fonte de RSS do portal e frequentemente omite datas. `isRecente()` é a função correta e definitiva.

---

## BUG 3 — Categorias erradas na geração forçada (`api/run_portal.js`)

**Sintoma:** Pedir geração para categoria "Seguros" gerava artigos de entretenimento (ex: "O Diabo Veste Prada 2") salvos com categoria `seguros`.

**Causa raiz 1:** Quando `catForcada` era definida, o pipeline mesclava feeds da categoria alvo com feeds gerais (`getNews()`). Artigos de entretenimento dos feeds gerais eram então forçados para a categoria errada.

**Causa raiz 2:** Não havia validação de compatibilidade de família temática entre o conteúdo gerado e a categoria forçada.

**Correção — `api/run_portal.js` + `core/rss.js`:**
```js
// FAMILIA_CAT — exportado de core/rss.js
// Define qual família temática cada categoria pertence
const FAMILIA_CAT = {
  seguros:'financas', investimentos:'financas', economia:'financas',
  mercados:'financas', tributacao:'financas', regulacao:'financas',
  negocios:'financas', imoveis:'financas', parcerias:'financas', esg:'financas',
  politica:'poder', seguranca:'poder', defesa:'poder', investigativo:'poder', internacional:'poder',
  esportes:'entretenimento', cultura:'entretenimento', variedades:'entretenimento', religiao:'entretenimento',
  tecnologia:'conhecimento', educacao:'conhecimento', saude:'conhecimento',
  familia:'conhecimento', profissoes:'conhecimento', industria:'conhecimento',
  vagas:'trabalho', concursos:'trabalho',
};

// Quando catForcada definida: usar APENAS feeds da categoria alvo
if (catForcada) {
  news = await getNewsByCategoria(catForcada);
}

// Validação de família antes de forçar categoria:
const familiaForcada = FAMILIA_CAT[catForcada];
const familiaConteudo = FAMILIA_CAT[content.categoria];
if (familiaForcada && familiaConteudo && familiaForcada !== familiaConteudo) {
  continue;  // artigo de entretenimento NUNCA vai para categoria financeira
}
content.categoria = catForcada;
```

**⚠️ ATENÇÃO FUTURA:** Sempre que adicionar nova categoria, adicionar ao `FAMILIA_CAT` com a família correta. As famílias são: `financas`, `poder`, `entretenimento`, `conhecimento`, `trabalho`.

---

## BUG 4 — Subcategoria "Geral" sendo salva no banco (`api/run_portal.js`)

**Sintoma:** Artigos sendo salvos com `subcategoria: "Geral"` — um valor inválido que quebra a navegação por subcategoria.

**Causa raiz:** O dropdown de subcategoria do admin enviava literalmente o texto "Geral" quando nenhuma subcategoria específica era selecionada. O pipeline aceitava esse valor e salvava diretamente no banco.

**Correção — `api/run_portal.js`:**
```js
// Trata 'Geral'/'Qualquer' como ausência de subcategoria forçada
const subcatForcada = /^(geral|qualquer|qualquer subcategoria|any|todos?)$/i.test(subcatRaw)
  ? ''
  : subcatRaw;
```

**⚠️ ATENÇÃO FUTURA:** O banco NUNCA deve ter `subcategoria = 'Geral'`. Se o admin enviar "Geral", tratar como vazio e deixar a IA ou o `SUBCAT_DEFAULT` definir a subcategoria correta.

---

## BUG 5 — Volume de artigos muito baixo (4 artigos em 48h)

**Causa raiz:** Combinação de múltiplos fatores:
1. `targetCount` padrão era `'1'` — cada chamada manual gerava apenas 1 artigo
2. `news.slice(0, 40)` limitava o pool de notícias a apenas 40 itens
3. Sem deduplicação de títulos similares → artigos duplicados sobre o mesmo fato
4. O BUG 2 (`isHoje()`) descartava TODOS os itens antes de qualquer processamento

**Correção — `api/run_portal.js`:**
```js
// targetCount padrão: '1' → '5' (GitHub Actions sempre passa count=8 explicitamente)
const targetCount = Math.min(parseInt(meta.count || body.count || '5', 10), 8);

// Pool ampliado: 40 → 80 itens
for (const item of news.slice(0, 80)) { ... }

// Deduplicação por similaridade de título (Jaccard ≥40% em palavras >4 chars)
function tituloSimilar(a, b) {
  const palavras = t => new Set(t.toLowerCase().split(/\W+/).filter(w => w.length > 4));
  const pa = palavras(a), pb = palavras(b);
  const intersec = [...pa].filter(w => pb.has(w)).length;
  const uniao = new Set([...pa, ...pb]).size;
  return uniao > 0 && intersec / uniao >= 0.4;
}
```

**Obs:** O GitHub Actions (`.github/workflows/pipeline-cron.yml`) sempre passa `count=8` explicitamente no body. O `targetCount` padrão afeta apenas execuções manuais via botão no admin.

---

## BUG 6 — Sem controle por faixa horária (implementado mai/2026)

**Contexto:** O pipeline gerava artigos uniformemente durante o dia (72 chamadas/dia a cada 20min via GitHub Actions). Sem nenhum controle por horário, todo o limite diário poderia ser consumido durante a madrugada.

**Implementação — `api/run_portal.js`:**

```js
const FAIXAS_HORARIO = [
  { chave: 'POSTS_01_06', hInicio: 1,  hFim: 6,  padrao: 20  },
  { chave: 'POSTS_06_10', hInicio: 6,  hFim: 10, padrao: 40  },
  { chave: 'POSTS_10_12', hInicio: 10, hFim: 12, padrao: 40  },
  { chave: 'POSTS_12_17', hInicio: 12, hFim: 17, padrao: 80  },
  { chave: 'POSTS_17_00', hInicio: 17, hFim: 25, padrao: 120 }, // hFim=25 cobre hora 0
];
```

| Faixa | Chave Supabase | Posts máx (padrão) |
|-------|---------------|--------------------|
| 01h – 06h (madrugada) | `POSTS_01_06` | 20 |
| 06h – 10h (manhã cedo) | `POSTS_06_10` | 40 |
| 10h – 12h (manhã) | `POSTS_10_12` | 40 |
| 12h – 17h (tarde) | `POSTS_12_17` | 80 |
| 17h – 00h (noite, pico) | `POSTS_17_00` | 120 |
| **Total** | | **300/dia** |

**Para alterar:** Supabase → tabela `config` → inserir/atualizar a chave desejada.
**Execuções com `force=true` ou `batch=true` ignoram os limites** (geração manual do admin).

---

## ⚠️ LEIA ISSO TAMBÉM — VISÃO ESTRATÉGICA INEGOCIÁVEL

**O Valor Capital é uma máquina de SEO.** Esse não é um detalhe — é a razão de existência do portal.

O modelo de negócio é:
```
300 artigos/dia → indexação massiva no Google → tráfego orgânico → AdSense/AdX → receita recorrente
```

**Todo pixel, toda linha de código, toda decisão técnica serve a esse objetivo.**

Fonte de receita: exclusivamente Google AdSense / Google AdX (programático).
Não há venda de espaços para anunciantes diretos. O Google é o único cliente.

Projeção de receita documentada em `ESTRATEGIA_SEO.md`.
Cenário conservador: R$ 5.766 (Jun–Dez 2026).
Cenário otimista: R$ 198.247 (Jun–Dez 2026).

**Decisões técnicas que afetam SEO nunca são triviais. Qualquer mudança em:**
- Estrutura de URLs
- Renderização de páginas (SSR vs client-side)
- Sitemap
- Meta tags / canonical
- Pipeline de publicação

**...deve ser avaliada pelo impacto no ranqueamento do Google antes de ser implementada.**

---

## ⛔ REGRAS SAGRADAS — NUNCA VIOLAR

1. **SEO 100% COMPLETO EM TODA PÁGINA** — Ver Regra #1 acima. Sem exceção.
2. **Topo e rodapé do portal NUNCA mudam.** Header e footer são identidade da marca.
3. **Nada publica sem aprovação manual do Roberto** — proteção obrigatória contra penalidade Google HCU
4. **URLs sempre com slug** — nunca regredir para `?id=`
5. **SSR obrigatório** — Googlebot não pode depender de JS para ver o conteúdo
6. **Sitemap sempre atualizado** — `api/sitemap.js` é dinâmico, não editar sitemap estático
7. **300 artigos/dia sem falha** — consistência é sinal de ranqueamento
8. **REGRA DE DOCUMENTAÇÃO:** Ao final de toda sessão, atualizar este CLAUDE.md e fazer push para main
9. **`safeJsonForScript()` OBRIGATÓRIO** — nunca injetar JSON em `<script>` sem escape. Ver BUG 1.
10. **`isRecente()` e não `isHoje()`** — nunca reverter para isHoje() em core/rss.js. Ver BUG 2.
11. **Subcategoria "Geral" é valor inválido** — tratar como vazio sempre. Ver BUG 4.
12. **`FAMILIA_CAT` é lei** — nunca forçar categoria sem validar família temática. Ver BUG 3.

---

## 1. O QUE É ESTE PROJETO

**O Valor Capital (OVC)** é um portal premium de notícias brasileiro focado em política, economia, negócios, investimentos, família, tributos e regulação. O dono é Roberto (usuário: oterrasan).

- **URL produção:** https://www.ovalorcapital.com.br
- **Stack:** Next.js/Vercel (serverless), Supabase (PostgreSQL + Storage), React (admin inline via Babel), OpenAI gpt-4o-mini
- **Repo:** `oterrasan/ovalorcapital`
- **Branch principal:** `main` (Vercel deploya automaticamente)
- **Branch de desenvolvimento Claude:** `claude/review-project-docs-1mLkx`
- **Instagram:** 2,6M views/mês em Reels autorais — integração com portal é prioridade

---

## 2. ARQUITETURA DO SISTEMA

### APIs (Vercel serverless)
| Arquivo | Função |
|---|---|
| `api/article.js` | SSR completo de artigos por slug URL — **crítico para SEO** |
| `api/article-ssr.js` | SSR para rota /materia/ (legacy) |
| `api/category.js` | SSR para listagem de todas as 29 categorias — SEO completo |
| `api/live.js` | SSR para radar, tv-ovc, radio-ovc, dados, cotações, agenda |
| `api/sitemap.js` | Sitemap dinâmico com todos os artigos publicados |
| `api/manage.js` | Status, aprovação, track_view, newsletter |
| `api/run_portal.js` | Pipeline automático RSS → scrape → IA → salva como pendente |
| `api/portal-posts.js` | Serve posts publicados para o frontend |
| `api/editor_ia.js` | Editor IA do admin |
| `api/ig_publish.js` | Publica no Instagram via bot Playwright |
| `api/refresh_token.js` | Renova token do Instagram |
| `api/live-data.js` | Cotações ao vivo (dados) |
| `api/landing.js` | SSR landing pages temáticas — /trabalho/, /financas/, /moradia/, /vc/, /seguranca/, /bem-estar/ |

### Core (lógica de negócio)
- `core/ai_portal.js` — chamada OpenAI com prompt PAUTA EDITORIAL
- `core/rss.js` — busca notícias dos feeds RSS (**240+ feeds em 16 grupos**). Exporta `isRecente()`, `getNews()`, `getNewsByCategoria()`, `FAMILIA_CAT`, `CATEGORIA_PARA_GRUPO`
- `core/scraper.js` — extrai texto de URLs
- `core/image_finder.js` — busca imagem relevante (timeout 10s, 1 chamada Wikimedia)
- `core/image_processor.js` — processa/recorta imagem e salva no Supabase Storage

### Frontend público
- `public/index.html` — homepage
- `public/[categoria]/index.html` — 29+ páginas de categoria (templates para api/article.js e api/category.js)
- `public/materia/index.html` — página standalone de artigo (legacy)
- `public/admin/index.html` — painel admin
- `public/js/internal-page-v2.js` — JS principal de todas as páginas de categoria + artigos
- `public/js/ovc-cards.js` — cards dinâmicos da homepage (inclui seção colunistas 3+3)
- `public/js/materia-page.js` — JS da página /materia/
- `public/js/ovc-vc.js` — JS standalone do editorial /vc/

---

## 3. SISTEMA DE URLs DOS ARTIGOS (SEO CRÍTICO)

### Formato correto (implementado)
```
/{categoria}/{slug-do-titulo}-{id8}/

Exemplo: /politica/lula-sanciona-reforma-tributaria-a1b2c3d4/
```

- `id8` = primeiros 8 chars do UUID do Supabase
- `slug` = `slugify(titulo).slice(0,55)` — lowercase, sem acentos, hífens
- **Nunca usar `?id=`** — query params não ranqueiam no Google
- **Canonical sempre com www** — `https://www.ovalorcapital.com.br/...`

### Como funciona o roteamento
1. Usuário/Googlebot acessa `/{cat}/{slug}-{id8}/`
2. Vercel rewrite detecta padrão → rota para `api/article.js`
3. `api/article.js` extrai `id8`, busca no Supabase com `.ilike("id", "${id8}%").limit(1)`, retorna HTML completo com SEO 100%

---

## 4. BANCO DE DADOS (Supabase)

### Tabela `posts`
Campos principais: `id, titulo, conteudo, comentario_fixado (meta_descricao), imagem, hash, status, approved, publish_method, user_tags (JSON array com categoria), subcategoria, subcategoria_slug, created_at, published_at, metrics (JSON com SEO + views), priority, retry_count, max_retries`

**Fluxo de status:** `pendente` → (Roberto aprova) → `publicado`
- **Nada publica sem aprovação manual** — proteção obrigatória contra penalidade Google HCU

### Tabela `config` — todas as chaves conhecidas
| Chave | Descrição | Valor padrão |
|-------|-----------|-------------|
| `AUTOMATION` | Liga/desliga pipeline automático | `"on"` ou `"off"` |
| `MAX_POSTS_DIA` | Limite total de posts por dia | `"300"` |
| `YOUTUBE_LIVE_URL` | URL embed YouTube para OVC TV | URL embed |
| `POSTS_01_06` | Limite faixa horária 01h-06h (Brasília) | `20` |
| `POSTS_06_10` | Limite faixa horária 06h-10h (Brasília) | `40` |
| `POSTS_10_12` | Limite faixa horária 10h-12h (Brasília) | `40` |
| `POSTS_12_17` | Limite faixa horária 12h-17h (Brasília) | `80` |
| `POSTS_17_00` | Limite faixa horária 17h-00h (Brasília) | `120` |
| `INTERVALO_MIN` | Intervalo mínimo entre posts (segundos) | `"180"` |
| `MODEL` | Modelo OpenAI para geração | `"gpt-4o-mini"` |
| `FALLBACK` | Modelo fallback | — |

**As chaves de faixa horária são opcionais:** se não existirem no banco, o código usa os valores padrão acima automaticamente.

---

## 5. CATEGORIAS DO SISTEMA

### Todas as categorias válidas (29 slugs)
```
politica, economia, negocios, investimentos, seguros, mercados,
educacao, industria, tecnologia, esportes, saude, familia,
tributacao, regulacao, parcerias, internacional, variedades,
vc, colunistas, investigativo, seguranca, cultura, profissoes,
vagas, concursos, imoveis, esg, defesa, religiao
```

### Mapeamento categoria → URL
```
tributacao → /tributos/
colunistas → /vc/
todos os outros → /[slug]/
```

### Famílias temáticas (FAMILIA_CAT)
Usadas para impedir artigos de entretenimento sendo classificados como finanças, etc.
```
financas:      seguros, investimentos, economia, mercados, tributacao,
               regulacao, negocios, imoveis, parcerias, esg
poder:         politica, seguranca, defesa, investigativo, internacional
entretenimento: esportes, cultura, variedades, religiao
conhecimento:  tecnologia, educacao, saude, familia, profissoes, industria
trabalho:      vagas, concursos
```

---

## 6. SEO — STATUS COMPLETO

| Feature | Arquivo | Status |
|---|---|---|
| Slug URLs para artigos | `api/article.js` + `vercel.json` | ✅ |
| SSR completo por artigo | `api/article.js` | ✅ |
| JSON-LD NewsArticle | `api/article.js` | ✅ |
| `safeJsonForScript()` em todo JSON embutido | `api/article.js` | ✅ |
| SSR listagem de categorias (29) | `api/category.js` + `vercel.json` | ✅ |
| SSR radar/tv/rádio/dados/cotações/agenda | `api/live.js` + `vercel.json` | ✅ |
| SSR landing /trabalho/ | `api/landing.js` + `vercel.json` | ✅ |
| SSR landing /financas/ | `api/landing.js` + `vercel.json` | ✅ |
| SSR landing /moradia/ | `api/landing.js` + `vercel.json` | ✅ |
| SSR landing /vc/ | `api/landing.js` + `vercel.json` | ✅ |
| SSR landing /seguranca/ | `api/landing.js` + `vercel.json` | ✅ |
| SSR landing /bem-estar/ | `api/landing.js` + `vercel.json` | ✅ |
| og:image em todas as páginas | Todos os handlers SSR | ✅ |
| twitter:card em todas as páginas | Todos os handlers SSR | ✅ |
| Canonical www consistente | Todos os handlers SSR | ✅ |
| Sitemap dinâmico | `api/sitemap.js` | ✅ |
| /bem-estar/ e /inteligencia/ no sitemap | `api/sitemap.js` | ✅ |
| 404 com noindex | `public/404.html` | ✅ |
| Homepage cache s-maxage=60 | `vercel.json` | ✅ |
| 240+ RSS feeds | `core/rss.js` | ✅ |
| Cron pipeline GitHub Actions | `.github/workflows/pipeline-cron.yml` | ✅ |

### Ações pendentes (Roberto faz)
1. **Search Console** → submeter `https://www.ovalorcapital.com.br/sitemap.xml`
2. **AdSense** → verificar aprovação / aplicar se não aprovado
3. **Google News** → aplicar em news.google.com/publisher-center
4. **Instagram** → integrar CTA direto para artigos em cada Reel

---

## 7. PIPELINE DE AUTOMAÇÃO — DOCUMENTAÇÃO COMPLETA

**Solução:** GitHub Actions (gratuito) — Vercel Hobby não suporta cron a cada 20min.

```
.github/workflows/pipeline-cron.yml
  schedule: '*/20 * * * *'       ← executa a cada 20 minutos, 24h/dia
  → curl POST https://www.ovalorcapital.com.br/api/run  {"count":8}
  → RSS → scrape → OpenAI → post pendente → Roberto aprova → publicado
```

### Capacidade máxima
- 72 chamadas/dia × 8 artigos por chamada = **576 possíveis**
- Capped em `MAX_POSTS_DIA=300` (limite diário global)
- Distribuídos pelas faixas horárias (ver Seção 4)

### Faixas horárias (horário Brasília, UTC-3)

| Faixa | Posts máx | Cadência aproximada |
|-------|-----------|--------------------|
| 01h–06h | 20 | ~1 post/15min |
| 06h–10h | 40 | ~2 posts/12min |
| 10h–12h | 40 | ~3 posts/10min |
| 12h–17h | 80 | ~3 posts/11min |
| 17h–00h | 120 | ~3 posts/7min |

### Validações do pipeline (ordem de execução)
1. `AUTOMATION = 'on'`? Se não → `automation_paused`
2. `posts_hoje < MAX_POSTS_DIA`? Se não → `limit_reached`
3. Posts na faixa atual `< limite_da_faixa`? Se não → `faixa_limit_reached`
4. Busca RSS: `getNewsByCategoria(catAlvo)` + `getNews()` dedupado por link
5. Para cada item: hash MD5 → verifica duplicata → scrape → rewritePortal → validarConteudo
6. Corrige categoria por `REGRAS_CATEGORIA` → valida família por `FAMILIA_CAT`
7. Processa imagem (evita domínios concorrentes) → salva no Supabase como `pendente`

### RSS — Filtro de data (CRÍTICO — NÃO REVERTER)
`core/rss.js` — função `isRecente()` aceita artigos das **últimas 48 horas** e itens **sem data** (Google News frequentemente omite `pubDate`).

**⚠️ NUNCA voltar para `isHoje()`** — ela rejeita itens sem data e artigos de ontem, causando `no_valid_news` em 100% das chamadas.

### HIGH_PRIORITY_CATS — engajamento primeiro
```js
const HIGH_PRIORITY_CATS = [
  'politica', 'economia', 'internacional', 'tecnologia',
  'investigativo', 'esportes', 'saude', 'negocios', 'investimentos'
];
```

---

## 8. LANDING PAGES SSR TEMÁTICAS

| URL | Tema | Categorias |
|---|---|---|
| `/trabalho/` | Trabalho & Carreira | vagas, concursos, profissoes, parcerias, educacao |
| `/financas/` | Finanças Pessoais | investimentos, seguros, tributacao, regulacao, mercados |
| `/moradia/` | Moradia & Imóveis | imoveis |
| `/vc/` | Colunistas & Opinião | vc, colunistas |
| `/seguranca/` | Segurança & Defesa | seguranca, defesa, investigativo |
| `/bem-estar/` | Bem-Estar & Sociedade | saude, familia, cultura, religiao, esg |

Todas SSR via `api/landing.js`. Todas com SEO 100% completo.

---

## 9. COMO RETOMAR EM NOVA SESSÃO

1. Ler este arquivo (CLAUDE.md) completamente — especialmente a **Regra #1** e os **Bugs Críticos**
2. Ler `BUGS_CORRIGIDOS.md` para histórico completo de tudo que já quebrou e foi corrigido
3. Ler `ESTRATEGIA_SEO.md` para contexto de negócio
4. Qualquer página nova ou modificação: verificar checklist SEO da Regra #1
5. Qualquer mudança no pipeline: verificar se `isRecente()` e `FAMILIA_CAT` estão intactos
6. Verificar GitHub Actions rodando
7. **Ao terminar:** atualizar este CLAUDE.md, atualizar `BUGS_CORRIGIDOS.md` se necessário, fazer push para main

---

## 10. CONTATO / CONTEXTO DO DONO

- **Nome:** Roberto (Terrasan)
- **Objetivo:** maior portal premium de notícias do Brasil sustentado por Google AdSense/AdX
- **Instagram:** 2,6M views/mês em Reels — audiência real que alimenta o SEO
- **Perfil técnico:** não é programador — precisa de implementações diretas, sem explicações longas
- **Estilo:** cobra resultados reais, não quer links para clicar, não quer status — quer feito
- **Lema do projeto:** cada artigo, cada categoria, cada pixel deve virar dinheiro com o Google
- **Comunicação:** direto ao ponto, sem enrolação, sem tutoriais, sem "vou fazer X"
- **IMPORTANTE:** Roberto não aceita respostas longas sobre o que você "vai fazer". Faça e reporte o resultado em 2 linhas.
