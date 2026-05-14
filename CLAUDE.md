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

### HISTÓRICO DE CORREÇÕES SEO (mai/2026)

| Problema | Impacto | Correção |
|---|---|---|
| 29 categorias com description genérica | Thin content, sem ranking | `api/category.js` — SSR com descriptions únicas |
| Radar/TV/Rádio/Cotações sem SEO real | Palavras-chave perdidas | `api/live.js` — SSR otimizado |
| `/seguranca/` sem rewrite — inacessível | Seção invisível | `vercel.json` — rewrite adicionado |
| Canonical `/materia/` apontando para `?id=` | Autoridade dividida | `api/article-ssr.js` — canonical para slug URL |
| og:image e twitter:card ausentes em landing | Google Discover bloqueado | `api/landing.js` — tags adicionadas |
| Homepage com `Cache-Control: no-cache` | CDN inativo, LCP ruim | `vercel.json` — `s-maxage=60` |
| 404.html com título "Matéria" e sem noindex | Google indexa erro | `public/404.html` — noindex + título correto |

---

## ⚠️ LEIA ISSO TAMBÉM — VISÃO ESTRATÉGICA INEGOCIÁVEL

**O Valor Capital é uma máquina de SEO.** Esse não é um detalhe — é a razão de existência do portal.

```
300 artigos/dia → indexação massiva no Google → tráfego orgânico → AdSense/AdX → receita recorrente
```

Fonte de receita: exclusivamente Google AdSense / Google AdX (programático).

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
9. **validar() em manage.js NUNCA deve exigir string fixa da IA** — ver BUG #7
10. **forcarExecucao() SEMPRE envia POST {force:true}** — GET não bypassa limites, ver BUG #8

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
| `api/manage.js` | Status, aprovação, track_view, newsletter, geração manual |
| `api/run_portal.js` | Pipeline automático RSS → scrape → IA → salva como publicado |
| `api/portal-posts.js` | Serve posts publicados para o frontend |
| `api/editor_ia.js` | Editor IA do admin |
| `api/ig_publish.js` | Publica no Instagram via bot Playwright |
| `api/refresh_token.js` | Renova token do Instagram |
| `api/live-data.js` | Cotações ao vivo (dados) |
| `api/landing.js` | SSR landing pages temáticas |

### Core (lógica de negócio)
- `core/ai_portal.js` — chamada OpenAI com prompt PAUTA EDITORIAL
- `core/rss.js` — busca notícias dos feeds RSS (**240+ feeds em 16 grupos**)
- `core/scraper.js` — extrai texto de URLs (3 camadas: p → div → og:meta)
- `core/image_finder.js` — busca imagem relevante (timeout 10s, 1 chamada Wikimedia)
- `core/image_processor.js` — processa/recorta imagem e salva no Supabase Storage

### Frontend público
- `public/index.html` — homepage
- `public/[categoria]/index.html` — 29+ páginas de categoria
- `public/materia/index.html` — página standalone de artigo (legacy)
- `public/admin/index.html` — painel admin principal
- `public/admin/automacao.html` — painel de automação (pipeline + force run)
- `public/js/internal-page-v2.js` — JS principal de todas as páginas
- `public/js/ovc-cards.js` — cards dinâmicos da homepage

---

## 3. SISTEMA DE URLs DOS ARTIGOS (SEO CRÍTICO)

```
/{categoria}/{slug-do-titulo}-{id8}/

Exemplo: /politica/lula-sanciona-reforma-tributaria-a1b2c3d4/
```

- `id8` = primeiros 8 chars do UUID do Supabase
- `slug` = `slugify(titulo).slice(0,55)` — lowercase, sem acentos, hífens
- **Nunca usar `?id=`** — query params não ranqueiam no Google
- **Canonical sempre com www** — `https://www.ovalorcapital.com.br/...`

---

## 4. BANCO DE DADOS (Supabase)

### Tabela `posts`
Campos principais: `id, titulo, conteudo, comentario_fixado (meta_descricao), imagem, hash, status, approved, publish_method, user_tags (JSON array com categoria), subcategoria, subcategoria_slug, created_at, published_at, metrics (JSON com SEO + views), priority, retry_count, max_retries`

**COLUNA DE CATEGORIA:** `user_tags` — TEXT com JSON array: `'["politica"]'`
- **NUNCA usar `p.categoria`** — coluna não existe
- Sempre: `JSON.parse(post.user_tags || '[]')[0]`

**Fluxo de status:** artigos do pipeline automático e do admin são salvos diretamente como `status: 'publicado'` com `published_at` definido — aparecem imediatamente no portal.

### Tabela `config`
| Chave | Valor padrão | Descrição |
|-------|-------------|----------|
| `AUTOMATION` | `"on"` | Liga/desliga pipeline automático |
| `MAX_POSTS_DIA` | `"300"` | Limite diário de posts |
| `POSTS_01_06` | `"20"` | Limite faixa 01h–06h (Brasília) |
| `POSTS_06_10` | `"40"` | Limite faixa 06h–10h |
| `POSTS_10_12` | `"40"` | Limite faixa 10h–12h |
| `POSTS_12_17` | `"80"` | Limite faixa 12h–17h |
| `POSTS_17_00` | `"120"` | Limite faixa 17h–00h (maior audiência) |
| `YOUTUBE_LIVE_URL` | URL embed | OVC TV ao vivo |

**Faixas horárias:** Se a chave não existir no banco, o valor padrão é usado automaticamente. `force=true` ou `batch=true` ignoram todos os limites de faixa.

### Tabela `alerts`
Campos: `id, type, message, read, created_at`

### Tabela `rss_sources`
Fontes RSS customizadas — substituem os feeds hardcoded quando existem entradas ativas. Se todos os feeds dessa tabela falharem, `getNews()` faz fallback automático para os 240+ feeds hardcoded.

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

### Famílias temáticas (FAMILIA_CAT em core/rss.js)
Usado para validar se artigo de uma família pode ser forçado para categoria de outra família.

| Família | Categorias |
|---------|----------|
| `financas` | seguros, investimentos, economia, mercados, tributacao, regulacao, negocios, imoveis, parcerias, esg |
| `poder` | politica, seguranca, defesa, investigativo, internacional |
| `entretenimento` | esportes, cultura, variedades, religiao |
| `conhecimento` | tecnologia, educacao, saude, familia, profissoes, industria |
| `trabalho` | vagas, concursos |

---

## 6. SEO — STATUS COMPLETO

| Feature | Arquivo | Status |
|---|---|---|
| Slug URLs para artigos | `api/article.js` + `vercel.json` | ✅ |
| SSR completo por artigo | `api/article.js` | ✅ |
| JSON-LD NewsArticle | `api/article.js` | ✅ |
| SSR listagem de categorias (29) | `api/category.js` + `vercel.json` | ✅ |
| SSR radar/tv/rádio/dados/cotações/agenda | `api/live.js` + `vercel.json` | ✅ |
| SSR landing /trabalho/ /financas/ /moradia/ /vc/ /seguranca/ /bem-estar/ | `api/landing.js` | ✅ |
| og:image + twitter:card em todas as páginas | Todos os handlers SSR | ✅ |
| Canonical www consistente | Todos os handlers SSR | ✅ |
| Sitemap dinâmico | `api/sitemap.js` | ✅ |
| 404 com noindex | `public/404.html` | ✅ |
| 240+ RSS feeds | `core/rss.js` | ✅ |
| Cron pipeline GitHub Actions | `.github/workflows/pipeline-cron.yml` | ✅ |
| Faixas horárias de posts | `api/run_portal.js` | ✅ |

---

## 7. PIPELINE DE AUTOMAÇÃO

**GitHub Actions** (gratuito) — Vercel Hobby não suporta cron a cada 20min.

```
.github/workflows/pipeline-cron.yml
  schedule: '*/20 * * * *'
  → curl POST https://www.ovalorcapital.com.br/api/run
  → RSS → scrape → OpenAI → post publicado imediatamente
```

### RSS — Filtro de data (CRÍTICO)
`core/rss.js` — função `isRecente()` aceita artigos das últimas 48h e trata itens sem data como recentes (Google News frequentemente omite pubDate).

**NUNCA** reverter para `isHoje()` — quebra 100% do pipeline.

### HIGH_PRIORITY_CATS — engajamento primeiro
```js
const HIGH_PRIORITY_CATS = [
  'politica', 'economia', 'internacional', 'tecnologia',
  'investigativo', 'esportes', 'saude', 'negocios', 'investimentos'
];
```

### Scraper — 3 camadas (CRÍTICO)
`core/scraper.js` extrai texto em 3 camadas:
1. Seletores semânticos: `article p`, `[class*="content"] p`, `itemprop="articleBody"`, etc.
2. Fallback div: quando `<p>` retorna < 200 chars, tenta divs de conteúdo
3. og:meta: quando tudo falha, usa `og:description` + `og:title` (útil para paywalls/JS)

**NUNCA** simplificar para apenas `$('p')` — falha em 70%+ dos sites brasileiros.

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

---

## 9. BUGS CRÍTICOS — RESUMO RÁPIDO

Ver `BUGS_CORRIGIDOS.md` para detalhes completos.

| # | Bug | Arquivo | Status |
|---|-----|---------|--------|
| 1 | `</script>` em JSON inline → página branca | `api/article.js` | ✅ Corrigido |
| 2 | `isHoje()` rejeitava itens sem data → no_valid_news | `core/rss.js` | ✅ Corrigido |
| 3 | Feeds gerais misturados na geração forçada | `api/run_portal.js` | ✅ Corrigido |
| 4 | Subcategoria "Geral" sendo salva no banco | `api/run_portal.js` | ✅ Corrigido |
| 5 | targetCount=1, pool=40, sem dedup → volume baixo | `api/run_portal.js` | ✅ Corrigido |
| 6 | Sem faixas horárias → posts esgotados na madrugada | `api/run_portal.js` | ✅ Corrigido |
| 7 | `validar()` exigia 'redação ovc' → 100% falhas | `api/manage.js` | ✅ Corrigido |
| 8 | `forcarExecucao()` enviava GET → force ignorado | `automacao.html` | ✅ Corrigido |
| 9 | `p.categoria` inexistente → undefined na tabela | `automacao.html` | ✅ Corrigido |
| 10 | `getNews()` sem fallback → no_news quando rss_sources falha | `core/rss.js` | ✅ Corrigido |
| 11 | Scraper só `<p>` → texto vazio em 70%+ sites | `core/scraper.js` | ✅ Corrigido |

---

## 10. COMO RETOMAR EM NOVA SESSÃO

1. Ler este arquivo (CLAUDE.md) completamente — especialmente a **Regra #1** e a tabela de bugs
2. Ler `BUGS_CORRIGIDOS.md` para detalhes de cada bug e regras permanentes
3. Qualquer página nova ou modificação: verificar checklist SEO da Regra #1
4. Verificar GitHub Actions rodando
5. **Ao terminar:** atualizar este CLAUDE.md e fazer push para `claude/review-project-docs-1mLkx`

---

## 11. CONTATO / CONTEXTO DO DONO

- **Nome:** Roberto (Terrasan)
- **Objetivo:** maior portal premium de notícias do Brasil sustentado por Google AdSense/AdX
- **Instagram:** 2,6M views/mês em Reels — audiência real que alimenta o SEO
- **Perfil técnico:** não é programador — precisa de implementações diretas, sem explicações longas
- **Estilo:** cobra resultados reais, não quer links para clicar, não quer status — quer feito
- **Lema do projeto:** cada artigo, cada categoria, cada pixel deve virar dinheiro com o Google
- **Comunicação:** direto ao ponto, sem enrolação, sem tutoriais, sem "vou fazer X"
