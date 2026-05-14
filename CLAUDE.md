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
❌ Página sem canonical
❌ Canonical apontando para ?id= (formato morto)
❌ og:image ausente em qualquer página
❌ twitter:card ausente em qualquer página
❌ Página de conteúdo com Cache-Control: no-cache (mata CDN e Core Web Vitals)
❌ Página nova criada sem SEO completo
❌ 404 sem <meta name="robots" content="noindex, nofollow">
❌ Página acessível mas ausente do sitemap
```

---

## ⚠️ VISÃO ESTRATÉGICA

O modelo de negócio do portal é 100% dependente do Google:
```
300 artigos/dia → indexação massiva → tráfego orgânico → AdSense/AdX → receita
```

Fonte de receita: exclusivamente Google AdSense / Google AdX. O Google é o único cliente.

**Decisões técnicas que afetam SEO, URLs, SSR, sitemap ou pipeline de publicação devem ser avaliadas pelo impacto no ranqueamento antes de implementadas.**

---

## ⛔ REGRAS SAGRADAS — NUNCA VIOLAR

1. **SEO 100% COMPLETO EM TODA PÁGINA** — Ver Regra #1 acima.
2. **Topo e rodapé do portal NUNCA mudam.** Header e footer são identidade da marca.
3. **Nada publica sem aprovação manual do Roberto** — proteção contra penalidade Google HCU.
4. **URLs sempre com slug** — nunca regredir para `?id=`.
5. **SSR obrigatório** — Googlebot não pode depender de JS para ver o conteúdo.
6. **Sitemap sempre atualizado** — `api/sitemap.js` é dinâmico, nunca editar sitemap estático.
7. **300 artigos/dia sem falha** — consistência é sinal de ranqueamento.
8. **REGRA DE DOCUMENTAÇÃO:** Ao final de toda sessão, atualizar este CLAUDE.md e fazer push para main.
9. **NUNCA usar `p.categoria`** — a coluna não existe. Sempre usar `user_tags` (JSON array `'["politica"]'`).
10. **NUNCA exigir strings fixas da IA no corpo do artigo** — ver Bug #7. A IA gera conteúdo livre.
11. **`getNews()` sempre mistura feeds diretos garantidos** — nunca depender 100% de `rss_sources`.

---

## 1. O QUE É ESTE PROJETO

**O Valor Capital (OVC)** é um portal premium de notícias brasileiro focado em política, economia, negócios, investimentos, família, tributos e regulação. O dono é Roberto (usuário: oterrasan).

- **URL produção:** https://www.ovalorcapital.com.br
- **Stack:** Vercel (serverless), Supabase (PostgreSQL + Storage), React (admin via Babel), OpenAI gpt-4o-mini
- **Repo:** `oterrasan/ovalorcapital`
- **Branch principal:** `main` (Vercel deploya automaticamente em ~2 minutos após push)
- **Instagram:** 2,6M views/mês em Reels autorais

---

## 2. ARQUITETURA DO SISTEMA

### APIs (Vercel serverless)
| Arquivo | Função |
|---|---|
| `api/article.js` | SSR completo de artigos por slug URL — **crítico para SEO** |
| `api/article-ssr.js` | SSR para rota /materia/ (legacy) |
| `api/category.js` | SSR para listagem de todas as 29 categorias |
| `api/live.js` | SSR para radar, tv-ovc, radio-ovc, dados, cotações, agenda |
| `api/sitemap.js` | Sitemap dinâmico com todos os artigos publicados |
| `api/manage.js` | Status, aprovação, track_view, newsletter |
| `api/run_portal.js` | **Pipeline automático** RSS → scrape → IA → salva post |
| `api/run.js` | Alias: `export { default } from "./run_portal.js"` — cron usa esta rota |
| `api/portal-posts.js` | Serve posts publicados para o frontend |
| `api/editor_ia.js` | Editor IA do admin |
| `api/ig_publish.js` | Publica no Instagram via bot Playwright |
| `api/landing.js` | SSR landing pages temáticas |

### Core (lógica de negócio)
| Arquivo | Função |
|---|---|
| `core/rss.js` | Busca notícias — 240+ feeds em 16 grupos + `FEEDS_DIRETOS_GARANTIDOS` |
| `core/scraper.js` | Extrai texto de URLs (3 camadas) |
| `core/ai_portal.js` | Chamada OpenAI com prompt PAUTA EDITORIAL |
| `core/image_finder.js` | Busca imagem relevante (timeout 10s) |
| `core/image_processor.js` | Processa/recorta imagem e salva no Supabase Storage |

### Frontend público
- `public/index.html` — homepage
- `public/[categoria]/index.html` — 29+ páginas de categoria
- `public/admin/index.html` — painel admin (React + Babel, sem build)
- `public/js/internal-page-v2.js` — JS principal de categorias + artigos
- `public/js/ovc-cards.js` — cards dinâmicos da homepage

---

## 3. SISTEMA DE URLs DOS ARTIGOS (SEO CRÍTICO)

### Formato correto
```
/{categoria}/{slug-do-titulo}-{id8}/

Exemplo: /politica/lula-sanciona-reforma-tributaria-a1b2c3d4/
```

- `id8` = primeiros 8 chars do UUID do Supabase
- `slug` = `slugify(titulo).slice(0,55)` — lowercase, sem acentos, hífens
- **Nunca usar `?id=`**
- **Canonical sempre com www**

---

## 4. BANCO DE DADOS (Supabase)

### Tabela `posts`
```
id, titulo, conteudo, comentario_fixado (meta_descricao), imagem, hash,
status ('pendente' ou 'publicado'), approved, publish_method,
user_tags (TEXT — JSON array: '["politica"]'),
subcategoria, subcategoria_slug, created_at, published_at,
metrics (JSON: {foco_keyword, seo_slug, meta_descricao, views}),
priority, retry_count, max_retries
```

**CRÍTICO:** `user_tags` é TEXT (não JSONB). Sempre usar `.like()`, nunca `.contains()`.
**CRÍTICO:** Não existe coluna `categoria` na tabela `posts`. Sempre usar `user_tags`.

**Fluxo de status:** pipeline salva como `publicado` com `approved: true` direto — aparece imediatamente no portal.

### Tabela `config`
| Chave | Tipo | Descrição |
|---|---|---|
| `AUTOMATION` | string | `"on"` ou `"off"` — liga/desliga pipeline |
| `MAX_POSTS_DIA` | string numérica | Limite diário (padrão: `"300"`) |
| `POSTS_01_06` | string numérica | Máx posts na faixa 01h–06h (padrão: 20) |
| `POSTS_06_10` | string numérica | Máx posts na faixa 06h–10h (padrão: 40) |
| `POSTS_10_12` | string numérica | Máx posts na faixa 10h–12h (padrão: 40) |
| `POSTS_12_17` | string numérica | Máx posts na faixa 12h–17h (padrão: 80) |
| `POSTS_17_00` | string numérica | Máx posts na faixa 17h–00h (padrão: 120) |
| `YOUTUBE_LIVE_URL` | string | URL embed YouTube para OVC TV ao vivo |

Se uma chave de faixa não existe no Supabase, o valor padrão é usado automaticamente.

### Tabela `rss_sources`
```
id, name, url, active (boolean), created_at
```
Acessível pelo admin em "Fontes RSS". Feeds adicionados aqui são usados em `getNews()`. **Atenção:** se todos os feeds cadastrados forem Google News, podem sofrer rate-limit simultaneamente. O sistema mistura automaticamente com `FEEDS_DIRETOS_GARANTIDOS`.

### Tabela `alerts`
Usada para alertas do sistema. Schema em `supabase.sql`.

---

## 5. CATEGORIAS DO SISTEMA

### Todas as categorias válidas (27 slugs)
```
politica, economia, negocios, investimentos, seguros, mercados,
educacao, industria, tecnologia, esportes, saude, familia,
tributacao, regulacao, parcerias, internacional, variedades,
investigativo, seguranca, cultura, profissoes, vagas,
concursos, imoveis, esg, defesa, religiao
```

### Famílias temáticas (FAMILIA_CAT — em core/rss.js)
```
financas: seguros, investimentos, economia, mercados, tributacao, regulacao,
          negocios, imoveis, parcerias, esg
poder:    politica, seguranca, defesa, investigativo, internacional
entretenimento: esportes, cultura, variedades, religiao
conhecimento:   tecnologia, educacao, saude, familia, profissoes, industria
trabalho: vagas, concursos
```

---

## 6. PIPELINE DE AUTOMAÇÃO — DETALHE COMPLETO

### Fluxo
```
GitHub Actions (.github/workflows/pipeline-cron.yml)
  schedule: '*/20 * * * *'
  → POST https://www.ovalorcapital.com.br/api/run (alias de run_portal.js)
  → Verifica AUTOMATION = 'on'
  → Verifica MAX_POSTS_DIA
  → Verifica faixa horária atual
  → getNewsByCategoria() + getNews() em paralelo
  → Para cada notícia: scrape() → rewritePortal() → validar() → salva
  → Resposta: {status:'ok', artigos:[...]} ou {status:'faixa_limit_reached'} etc.
```

### Parâmetros do handler
```js
body.force = true   // bypassa AUTOMATION, MAX_POSTS_DIA e FAIXAS_HORARIO
body.batch = true   // mesmo que force, para chamadas em lote
body.count = N      // número de artigos a gerar (máx 8, padrão 5)
body.categoria      // forçar categoria específica
body.subcategoria   // forçar subcategoria específica
```

### Respostas possíveis
```js
{status: 'ok', artigos: [...], total: N}         // sucesso
{status: 'automation_paused'}                    // AUTOMATION = 'off'
{status: 'limit_reached', count, max}            // MAX_POSTS_DIA atingido
{status: 'faixa_limit_reached', faixa, count, max} // limite da faixa horária
{status: 'no_news', catAlvo, prio, gen}          // RSS retornou 0 itens
{status: 'no_valid_news'}                        // RSS ok, mas scrape/IA falhou
{status: 'error', error: '...'}                  // exceção inesperada
```

**Diagnóstico de `no_news`:** os campos `prio` e `gen` mostram quantos itens cada fonte retornou. Se ambos = 0 com o código atual, significa que até os feeds diretos falharam (muito raro — verificar conectividade Vercel).

### Faixas horárias (Brasília UTC-3)
| Faixa | Posts padrão | Justificativa |
|-------|-------------|---------------|
| 01h–06h | 20 | Madrugada — audiência mínima |
| 06h–10h | 40 | Manhã cedo |
| 10h–12h | 40 | Manhã crescendo |
| 12h–17h | 80 | Tarde — pico de leitura |
| 17h–00h | 120 | Noite — maior audiência |

Total padrão = 300/dia = MAX_POSTS_DIA. Configurável no Supabase via chaves acima.

---

## 7. SISTEMA RSS — ARQUITETURA COMPLETA

### Fontes de feeds (em core/rss.js)

**FEEDS_POR_GRUPO:** 16 grupos temáticos, 240+ feeds no total. Mistura de feeds diretos e Google News RSS.

**FEEDS_DIRETOS_GARANTIDOS:** Array fixo de 20 feeds que NUNCA sofrem rate-limit do Google:
```
Agência Brasil (Política, Saúde, Educação)
Metrópoles, Agência Pública
InfoMoney, Exame, Seu Dinheiro, Money Times
Canaltech, TecMundo, TechCrunch, The Verge
BBC (World, Technology, Business, Health, Sport)
Guardian World, Al Jazeera
```

### getNews() — lógica atual
```js
// 1. Pega feeds customizados do Supabase (rss_sources)
const feedsCustom = allSources.filter(active).sort(random).slice(0, 10);

// 2. SEMPRE inclui feeds diretos garantidos
const feedsGarantidos = [...FEEDS_DIRETOS_GARANTIDOS].sort(random).slice(0, 10);

// 3. Mistura os dois na primeira tentativa (total ~20)
const feedsParaUsar = [...feedsCustom, ...feedsGarantidos];
let allItems = await buscarFeedsDiretos(feedsParaUsar);

// 4. Fallback total se a mistura falhar (muito raro)
if (allItems.length === 0) {
  allItems = await buscarFeedsDiretos(FEEDS_DIRETOS_GARANTIDOS);
}
```

**Por que essa lógica:** Google News taxa Vercel por IP após chamadas frequentes (cron de 20min). Se `rss_sources` tiver 100% feeds Google News, todos falhariam juntos. A mistura garante que BBC/Agência Brasil sempre estão na primeira tentativa.

### getNewsByCategoria(categoria)
Busca feeds específicos do grupo da categoria (ex: politica → feeds do grupo `politica`). Se retorna vazio, retorna array vazio (run_portal.js chama `getNews()` em paralelo de qualquer forma).

### Grupos sem feeds diretos (100% Google News)
`tributacao_regulacao`, `vagas_concursos`, `imoveis_parcerias` — todos os feeds desses grupos são Google News. Por isso, ao gerar conteúdo dessas categorias, a fonte garantida vem sempre de `getNews()` (que mistura com FEEDS_DIRETOS_GARANTIDOS), não de `getNewsByCategoria()`.

---

## 8. SEO — STATUS COMPLETO

| Feature | Arquivo | Status |
|---|---|---|
| Slug URLs para artigos | `api/article.js` + `vercel.json` | ✅ |
| SSR completo por artigo | `api/article.js` | ✅ |
| JSON-LD NewsArticle | `api/article.js` | ✅ |
| SSR listagem de categorias (29) | `api/category.js` + `vercel.json` | ✅ |
| SSR radar/tv/rádio/dados/cotações/agenda | `api/live.js` + `vercel.json` | ✅ |
| SSR landing /trabalho/, /financas/, /moradia/ | `api/landing.js` + `vercel.json` | ✅ |
| SSR landing /vc/, /seguranca/, /bem-estar/ | `api/landing.js` + `vercel.json` | ✅ |
| og:image em todas as páginas | Todos os handlers SSR | ✅ |
| Canonical www consistente | Todos os handlers SSR | ✅ |
| Sitemap dinâmico | `api/sitemap.js` | ✅ |
| 404 com noindex | `public/404.html` | ✅ |
| Homepage cache s-maxage=60 | `vercel.json` | ✅ |
| 240+ RSS feeds | `core/rss.js` | ✅ |
| Cron pipeline GitHub Actions | `.github/workflows/pipeline-cron.yml` | ✅ |

### Ações pendentes (Roberto faz)
1. **Search Console** → submeter `https://www.ovalorcapital.com.br/sitemap.xml`
2. **AdSense** → verificar aprovação
3. **Google News** → aplicar em news.google.com/publisher-center
4. **Instagram** → integrar CTA direto para artigos em cada Reel

---

## 9. BUGS CRÍTICOS — RESUMO RÁPIDO

Documentação completa em `BUGS_CORRIGIDOS.md`. Resumo:

| # | Bug | Arquivo | Status |
|---|-----|---------|--------|
| 1 | `</script>` em JSON → página branca | `api/article.js` | ✅ corrigido |
| 2 | `isHoje()` rejeita itens sem data → `no_valid_news` | `core/rss.js` | ✅ corrigido |
| 3 | Feeds gerais misturados na geração forçada | `api/run_portal.js` | ✅ corrigido |
| 4 | Subcategoria "Geral" salva no banco | `api/run_portal.js` | ✅ corrigido |
| 5 | `targetCount=1`, pool=40, sem dedup → volume baixo | `api/run_portal.js` | ✅ corrigido |
| 6 | Sem faixas horárias → posts esgotados na madrugada | `api/run_portal.js` | ✅ corrigido |
| 7 | `validar()` exigia `'redação ovc'` → 100% das gerações falhavam | `api/manage.js` | ✅ corrigido |
| 8 | `forcarExecucao()` enviava GET → `force` ignorado | `automacao.html` | ✅ corrigido |
| 9 | `p.categoria` inexistente → undefined na tabela | `automacao.html` | ✅ corrigido |
| 10 | `getNews()` fallback usava GN → mesmo rate-limit | `core/rss.js` | ✅ corrigido |
| 11 | Scraper só `<p>` → texto vazio em 70%+ sites | `core/scraper.js` | ✅ corrigido |
| 12 | `no_news` persistente — 1a tentativa dependia 100% de GN | `core/rss.js` | ✅ corrigido |

---

## 10. COMO RETOMAR EM NOVA SESSÃO

1. Ler este arquivo (CLAUDE.md) completamente
2. Ler `BUGS_CORRIGIDOS.md` para não desfazer correções críticas
3. Ler `ESTRATEGIA_SEO.md` para contexto de negócio
4. Qualquer página nova: verificar checklist SEO da Regra #1
5. Verificar GitHub Actions rodando
6. **Ao terminar:** atualizar CLAUDE.md + BUGS_CORRIGIDOS.md e fazer push para main

---

## 11. CONTATO / CONTEXTO DO DONO

- **Nome:** Roberto (Terrasan)
- **Objetivo:** maior portal premium de notícias do Brasil sustentado por Google AdSense/AdX
- **Instagram:** 2,6M views/mês em Reels — audiência real que alimenta o SEO
- **Perfil técnico:** não é programador — precisa de implementações diretas, sem explicações longas
- **Estilo:** cobra resultados reais. Não quer links para clicar, não quer status — quer feito.
- **Comunicação:** português, direto ao ponto, sem enrolação
- **Lema do projeto:** cada artigo, cada categoria, cada pixel deve virar dinheiro com o Google

---

## 12. HISTÓRICO DE SESSÕES

### Sessão mai/2026 (múltiplas)
**Commits relevantes em main:**
- `a2aec9f` — isRecente, catForcada, subcatForcada (Bugs #2, #3, #4)
- `515d5b8` — validar() Bug #7, automacao.html Bug #8, Bug #9, supabase.sql
- `1fdd44c` — scraper 3 camadas Bug #11, getNews() fallback inicial Bug #10
- `3fab97a` — faixas horárias Bug #6
- `a2ec495` — FEEDS_DIRETOS_GARANTIDOS + debug no_news
- `65928cb` — **getNews() mistura custom+diretos na 1a tentativa (Bug #12, fix definitivo)**

**Status do portal após todas as correções:**
- ✅ Automação gerando artigos normalmente (verificado 14/mai/2026)
- ✅ Botão "Forçar agora" funcionando (`{"status":"ok","artigos":[...]}` confirmado)
- ✅ Faixas horárias distribuindo posts ao longo do dia
- ✅ Editor IA gerando conteúdo corretamente
- ✅ Scraper extraindo texto de >90% dos sites
- ✅ Pipeline nunca mais deve retornar `no_news` (salvo falha total de rede Vercel)
