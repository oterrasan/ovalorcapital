# CLAUDE.md — Contexto completo do projeto O Valor Capital

> Este arquivo serve para retomar qualquer sessão de trabalho sem precisar explicar nada novamente.
> Leia do início ao fim antes de qualquer ação.
> **REGRA PERMANENTE:** Ao final de cada sessão, atualize este arquivo com tudo o que foi feito/planejado. O próximo Claude depende disso.

---

## ⚠️ LEIA ISSO PRIMEIRO — VISÃO ESTRATÉGICA INEGOCIÁVEL

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

1. **Topo e rodapé do portal NUNCA mudam.** Header e footer são identidade da marca. Qualquer landing page, seção nova, redesign — tudo preserva 100% o topo e o rodapé existentes.
2. **Nada publica sem aprovação manual do Roberto** — proteção obrigatória contra penalidade Google HCU
3. **URLs sempre com slug** — nunca regredir para `?id=`
4. **SSR obrigatório** — Googlebot não pode depender de JS para ver o conteúdo
5. **Sitemap sempre atualizado** — `api/sitemap.js` é dinâmico, não editar sitemap estático
6. **300 artigos/dia sem falha** — consistência é sinal de ranqueamento
7. **REGRA DE DOCUMENTAÇÃO:** Ao final de toda sessão, atualizar este CLAUDE.md e fazer push para main

---

## 1. O QUE É ESTE PROJETO

**O Valor Capital (OVC)** é um portal premium de notícias brasileiro focado em política, economia, negócios, investimentos, família, tributos e regulação. O dono é Roberto (usuário: oterrasan).

- **URL produção:** https://ovalorcapital.com.br
- **Stack:** Next.js/Vercel (serverless), Supabase (PostgreSQL + Storage), React (admin inline via Babel), OpenAI gpt-4o-mini
- **Repo:** `oterrasan/ovalorcapital`
- **Branch principal:** `main` (Vercel deploya automaticamente)
- **Branch de desenvolvimento Claude:** `claude/check-system-status-1lBv5`
- **Instagram:** 2,6M views/mês em Reels autorais — integração com portal é prioridade

---

## 2. ARQUITETURA DO SISTEMA

### APIs (Vercel serverless)
| Arquivo | Função |
|---|---|
| `api/article.js` | SSR completo de artigos por slug URL — **crítico para SEO** |
| `api/article-ssr.js` | SSR para rota /materia/ (legacy) |
| `api/sitemap.js` | Sitemap dinâmico com todos os artigos publicados |
| `api/manage.js` | Status, aprovação, track_view, newsletter |
| `api/run_portal.js` | Pipeline automático RSS → scrape → IA → salva como pendente |
| `api/portal-posts.js` | Serve posts publicados para o frontend |
| `api/editor_ia.js` | Editor IA do admin |
| `api/ig_publish.js` | Publica no Instagram via bot Playwright |
| `api/refresh_token.js` | Renova token do Instagram |
| `api/live-data.js` | Cotações ao vivo |
| `api/landing.js` | **SSR landing pages temáticas** — /trabalho/, /financas/, /moradia/, /vc/ |

### Core (lógica de negócio)
- `core/ai_portal.js` — chamada OpenAI com prompt PAUTA EDITORIAL
- `core/rss.js` — busca notícias dos feeds RSS (**240+ feeds em 16 grupos**)
- `core/scraper.js` — extrai texto de URLs
- `core/image_finder.js` — busca imagem relevante (timeout 10s, 1 chamada Wikimedia)
- `core/image_processor.js` — processa/recorta imagem e salva no Supabase Storage

### Frontend público
- `public/index.html` — homepage
- `public/[categoria]/index.html` — 29+ páginas de categoria (usadas como template pelo api/article.js)
- `public/materia/index.html` — página standalone de artigo (legacy)
- `public/admin/index.html` — painel admin
- `public/js/internal-page-v2.js` — JS principal de todas as páginas de categoria + artigos
- `public/js/ovc-cards.js` — cards dinâmicos da homepage (inclui seção colunistas 3+3)
- `public/js/materia-page.js` — JS da página /materia/
- `public/js/ovc-vc.js` — JS standalone do editorial /vc/ (dark mode, trio de cards + lista)

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

### Como funciona o roteamento
1. Usuário/Googlebot acessa `/{cat}/{slug}-{id8}/`
2. Vercel rewrite (vercel.json) detecta padrão slug via regex → rota para `api/article.js`
3. `api/article.js` extrai `id8`, busca artigo no Supabase com `.ilike("id", "${id8}%").limit(1)`, retorna HTML completo com:
   - `<title>` e `<meta description>` do artigo
   - Todos os og: e twitter: meta tags
   - `<link rel="canonical">` apontando para a URL slug
   - JSON-LD `NewsArticle` schema
   - Conteúdo do artigo em HTML estático (visível sem JS)
   - `window.__OVC_ARTICLE__` para hidratação no cliente sem double-fetch
4. Template lido de `public/{categoria}/index.html` com data-category correto

### URLs antigas (`?id=`) — retrocompatibilidade
- Ainda funcionam via `internal-page-v2.js` (client-side rendering)
- `api/article-ssr.js` cobre `/materia/?id=` com SSR
- Canonical aponta para slug URL → Google consolida autoridade

---

## 4. BANCO DE DADOS (Supabase)

### Tabela `posts`
Campos principais: `id, titulo, conteudo, comentario_fixado (meta_descricao), imagem, hash, status, approved, publish_method, user_tags (JSON array com categoria), subcategoria, subcategoria_slug, created_at, published_at, metrics (JSON com SEO + views), priority, retry_count, max_retries`

**Fluxo de status:** `pendente` → (Roberto aprova) → `publicado`
- **Nada publica sem aprovação manual** — proteção obrigatória contra penalidade Google HCU
- `publish_method: "portal"` = pipeline automático RSS
- `publish_method: "manual"` = editor IA do admin
- `metrics.views` = contador de visualizações

### Tabela `config`
Chaves importantes:
- `AUTOMATION` = `"on"` ou `"off"` — liga/desliga pipeline automático (confirmado ON)
- `MAX_POSTS_DIA` = `"300"` — limite diário
- `YOUTUBE_LIVE_URL` = URL embed YouTube para OVC TV ao vivo

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

---

## 6. SEO — O QUE FOI IMPLEMENTADO

| Feature | Arquivo | Status |
|---|---|---|
| Slug URLs para artigos | `api/article.js` + `vercel.json` | ✅ Implementado |
| SSR completo por artigo | `api/article.js` | ✅ Implementado |
| JSON-LD NewsArticle | `api/article.js` | ✅ Implementado |
| Sitemap dinâmico | `api/sitemap.js` | ✅ Implementado |
| OG meta tags SSR | `api/article.js` + `api/article-ssr.js` | ✅ Implementado |
| Canonical URL | `api/article.js` | ✅ Implementado |
| buildUrl() com slug | `noticias-v3.js`, `ovc-cards.js`, `internal-page-v2.js`, `materia-page.js` | ✅ Implementado |
| Correção automática de categorias | `api/run_portal.js` — `corrigirPostsExistentes()` | ✅ Implementado |
| RSS apenas artigos de HOJE | `core/rss.js` — `isHoje()` | ✅ Implementado |
| Cron pipeline via GitHub Actions | `.github/workflows/pipeline-cron.yml` | ✅ Implementado |
| Seção Colunistas 3+3 na homepage | `public/js/ovc-cards.js` — `carregarColunistas()` | ✅ Implementado |
| SSR landing /trabalho/ | `api/landing.js` + `vercel.json` | ✅ Implementado |
| SSR landing /financas/ | `api/landing.js` + `vercel.json` | ✅ Implementado |
| SSR landing /moradia/ | `api/landing.js` + `vercel.json` | ✅ Implementado |
| SSR editorial /vc/ | `api/landing.js` + `vercel.json` | ✅ Implementado |
| 240+ RSS feeds internacionais | `core/rss.js` | ✅ Implementado |

### Ações pendentes (Roberto faz)
1. **Search Console** → submeter `https://www.ovalorcapital.com.br/sitemap.xml`
2. **AdSense** → verificar aprovação / aplicar se não aprovado
3. **Google News** → aplicar em news.google.com/publisher-center
4. **Instagram** → integrar CTA direto para artigos em cada Reel
5. **GitHub Actions** → verificar se está rodando: github.com/oterrasan/ovalorcapital/actions

---

## 7. PIPELINE DE AUTOMAÇÃO

### Como o pipeline roda (mai/2026 em diante)

**Vercel Hobby plan não suporta cron a cada 20min.** Solução: GitHub Actions (gratuito).

```
.github/workflows/pipeline-cron.yml
  schedule: '*/20 * * * *'  (a cada 20 min)
  → curl POST https://www.ovalorcapital.com.br/api/run
  → api/run.js → api/run_portal.js
  → RSS → scrape → IA → post pendente
```

**vercel.json** mantém apenas o cron mensal:
```json
{ "path": "/api/refresh_token", "schedule": "0 3 1 * *" }
```

### Fluxo completo
```
GitHub Actions (*/20min) → POST /api/run → api/run_portal.js
  → 1 categoria HIGH_PRIORITY (aleatória) + feeds gerais
  → RSS feeds → isHoje() filtra apenas artigos DE HOJE
  → scrape → OpenAI gpt-4o-mini → post pendente no Supabase
  → (background) corrigirPostsExistentes() — corrige categoria/imagem nos últimos 100 posts
  → Admin aprova → status = publicado → aparece no portal
```

### HIGH_PRIORITY_CATS — engajamento primeiro
O pipeline sempre busca de uma categoria de alto engajamento por execução (aleatória):
```js
const HIGH_PRIORITY_CATS = [
  'politica', 'economia', 'internacional', 'tecnologia',
  'investigativo', 'esportes', 'saude', 'negocios', 'investimentos'
];
```

### RSS — Filtro de data (CRÍTICO)
`core/rss.js` contém `isHoje()` — rejeita qualquer artigo não publicado HOJE:
```js
function isHoje(dateStr) {
  // Compara com data atual no fuso Brasília (UTC-3)
  const offsetMs = -3 * 60 * 60 * 1000;
  const hojeStr = new Date(Date.now() + offsetMs).toISOString().slice(0, 10);
  const itemStr = new Date(new Date(dateStr).getTime() + offsetMs).toISOString().slice(0, 10);
  return itemStr === hojeStr;
}
```
**Regra absoluta: só artigos DO DIA, nunca do dia anterior ou de semanas/meses atrás.**

### Regras de categoria (REGRAS_CATEGORIA)
Keywords no título sobrescrevem a categoria sugerida pela IA.
Implementado em `api/run_portal.js` — `corrigirCategoria()`. 16 regras ativas.

### Controle no Supabase
- `config.AUTOMATION = "on"` — pipeline ativo
- `config.MAX_POSTS_DIA = "300"` — limite diário

---

## 8. HOMEPAGE — SEÇÕES DINÂMICAS

### Seção Colunistas & Opinião (3+3 cards)
Implementada em `public/js/ovc-cards.js` — função `carregarColunistas()`.

**Posicionamento:** inserida ANTES do `#ovc-cards-section` na homepage.

**Estrutura HTML gerada:**
- Header com barra dourada, título "Colunistas & Opinião", link "Ver todos →" para /vc/
- Row 1: 3 `bigCard()` — altura mínima 240px, imagem de fundo, overlay escuro, badge "Opinião"
- Row 2: 3 `smallCard()` — card horizontal com thumbnail + título + categoria

**Fonte de dados:** `GET /api/portal-posts?categoria=vc&limit=6`

**Nota:** existe `public/js/ovc-colunistas.js` mas é código morto — não está carregado no index.html. A lógica real está em ovc-cards.js.

---

## 9. LANDING PAGES SSR TEMÁTICAS (implementado mai/2026)

### Arquitetura
- Handler: `api/landing.js`
- Template base: `public/politica/index.html` (preserva header/footer sagrados)
- Padrão: lê template, injeta SEO tags antes de `</head>`, substitui `<main>...</main>`
- Cache: `public, s-maxage=180, stale-while-revalidate=60`

### Seções implementadas
| URL | Tema | Categorias | Cores |
|---|---|---|---|
| `/trabalho/` | Trabalho & Carreira | vagas, concursos, profissoes, parcerias, educacao | `#0d2137` / `#f5a623` |
| `/financas/` | Finanças Pessoais | investimentos, seguros, tributacao, regulacao, mercados | `#0a2218` / `#00c853` |
| `/moradia/` | Moradia & Imóveis | imoveis | `#1c0f05` / `#e8813a` |
| `/vc/` | Colunistas & Opinião | vc, colunistas | `#0d0d0d` / `#c9a84c` |

### Layout por seção
- **trabalho/financas/moradia**: Hero colorido + artigo destaque (460px) + grid 12 cards + blocos por categoria
- **vc/**: Dark editorial magazine — trio de 3 cards com bg image (400px, overlay gradiente, badge "Opinião" dourado) + lista de artigos restantes (thumb 80px)

### SEO de cada landing page
- `<title>`, `<meta description>`, `og:*`, `twitter:*`, canonical
- JSON-LD `CollectionPage` schema
- Cache `s-maxage=180` no Vercel Edge

### Rewrites vercel.json (todos ativos)
```json
{ "source": "/trabalho",  "destination": "/api/landing?section=trabalho" },
{ "source": "/trabalho/", "destination": "/api/landing?section=trabalho" },
{ "source": "/financas",  "destination": "/api/landing?section=financas" },
{ "source": "/financas/", "destination": "/api/landing?section=financas" },
{ "source": "/moradia",   "destination": "/api/landing?section=moradia" },
{ "source": "/moradia/",  "destination": "/api/landing?section=moradia" },
{ "source": "/vc",        "destination": "/api/landing?section=vc" },
{ "source": "/vc/",       "destination": "/api/landing?section=vc" }
```

---

## 10. EXPANSÃO RSS — 240+ FEEDS (implementado mai/2026)

### Estado
- **Antes:** ~35 feeds, cobertura básica nacional
- **Agora:** 240+ feeds em 16 grupos, cobertura nacional + internacional

### Novos grupos e feeds
- `agronegocio` — novo grupo com 8 feeds (GN agro, MAPA, exportação)
- Feeds internacionais: BBC (World/Business/Tech/Health/Sport), Al Jazeera, Guardian (World/Business), El País
- Feeds tech: TechCrunch, The Verge, Ars Technica, Wired, VentureBeat, MIT Tech Review, TecMundo
- Feeds financeiros: InfoMoney, Money Times, Suno Research, Investing.com BR, Agência Brasil

### Helpers GN
```js
const GN = (q, lang="pt-BR", gl="BR", ceid="BR:pt-BR") =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=${lang}&gl=${gl}&ceid=${ceid}`;
const GN_EN = (q) => GN(q, "en", "US", "US:en");
```

---

## 11. BUGS CORRIGIDOS — HISTÓRICO COMPLETO

### Sessão mai/2026 — 3 bugs críticos (commit 87d9059)

**Bug 1 — noticias-v3.js `buildUrl()` gerava URLs `?id=` (CRÍTICO SEO)**
- Todos os links da homepage geravam `/{cat}/?id={id8}` em vez de slug URLs
- Correção: adicionado `_slugify()`, reescrito `buildUrl()`, expandido `CAT_PATH` com todas as 29 categorias

**Bug 2 — `api/article.js` limitava a 400 posts (CRÍTICO SEO)**
- Artigos com mais de ~33h retornavam 404 para o Googlebot
- Correção: `.ilike("id", "${id8}%").limit(1)` — consulta direta no banco, sem limite de janela

**Bug 3 — `core/rss.js` sem fallback quando todos os feeds DB estão desativados (MÉDIO)**
- Correção: `if (!feedsParaUsar.length) feedsParaUsar = selecionarFeedsBalanceados();`

### Sessão mai/2026 — Fixes críticos de qualidade e infra

**Fix 4 — Pipeline buscando artigos de meses/anos atrás (CRÍTICO QUALIDADE)**
- Problema: RSS sem filtro de data — qualquer item do feed era aceito independente da data
- Correção: função `isHoje()` em `core/rss.js` com timezone Brasília (UTC-3)

**Fix 5 — Cron a cada 20min bloqueado no Vercel Hobby (CRÍTICO INFRA)**
- Problema: Hobby plan só suporta 1x/dia máximo
- Correção: removido cron do vercel.json, criado `.github/workflows/pipeline-cron.yml`

**Fix 6 — Pipeline sem prioridade de engajamento (MÉDIO)**
- Correção: `HIGH_PRIORITY_CATS` em `run_portal.js`

**Fix 7 — Imagens de concorrentes em posts manuais (MÉDIO)**
- Correção em `editor_ia.js` para usar `image_finder.js`

**Fix 8 — Categorias faltando no editor admin (MÉDIO)**
- Correção: expandido de 18 para 29 categorias no editor

**Fix 9 — Seção Colunistas inexistente na homepage (EDITORIAL)**
- Correção: `carregarColunistas()` em `ovc-cards.js` — 3 bigCards + 3 smallCards

---

## 12. COMO RETOMAR EM NOVA SESSÃO

1. Ler este arquivo (CLAUDE.md) completamente
2. Ler `ESTRATEGIA_SEO.md` para contexto de negócio
3. Verificar estado do git: branch de trabalho = `claude/check-system-status-1lBv5`
4. Verificar GitHub Actions rodando: Actions → Pipeline OVC
5. Roberto testa em `ovalorcapital.com.br`
6. **Ao terminar a sessão:** atualizar este CLAUDE.md e fazer push para main

### Prioridades pendentes
1. 🔴 Mega-section `/seguranca/` — seguranca, defesa, investigativo
2. 🔴 Mega-section `/bem-estar/` — saude, familia, cultura, religiao, esg
3. 🟡 Adicionar `/trabalho/`, `/financas/`, `/moradia/` ao sitemap dinâmico (`api/sitemap.js`)
4. 🟡 Deletar `public/js/ovc-colunistas.js` (código morto)

---

## 13. CONTATO / CONTEXTO DO DONO

- **Nome:** Roberto (Terrasan)
- **Objetivo:** maior portal premium de notícias do Brasil sustentado por Google AdSense/AdX
- **Instagram:** 2,6M views/mês em Reels — audiência real que alimenta o SEO
- **Perfil técnico:** não é programador — precisa de implementações diretas, sem explicações longas
- **Estilo:** cobra resultados reais, não quer links para clicar, não quer status — quer feito
- **Lema do projeto:** cada artigo, cada categoria, cada pixel deve virar dinheiro com o Google
- **Comunicação:** direto ao ponto, sem enrolação, sem tutoriais, sem "vou fazer X"
