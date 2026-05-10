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

---

## ⛔ REGRAS SAGRADAS — NUNCA VIOLAR

1. **Topo e rodapé do portal NUNCA mudam.** Header e footer são identidade da marca.
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
- **Stack:** Vercel (serverless functions), Supabase (PostgreSQL + Storage), OpenAI gpt-4o-mini
- **Repo:** `oterrasan/ovalorcapital`
- **Branch principal:** `main` (Vercel deploya automaticamente ao fazer merge)
- **Instagram:** 2,6M views/mês em Reels autorais

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
| `api/landing.js` | **SSR landing pages temáticas standalone** — ver seção 9 |

### Core (lógica de negócio)
- `core/ai_portal.js` — chamada OpenAI com prompt PAUTA EDITORIAL
- `core/rss.js` — busca notícias dos feeds RSS (**240+ feeds em 16 grupos**)
- `core/scraper.js` — extrai texto de URLs
- `core/image_finder.js` — busca imagem relevante (timeout 10s, 1 chamada Wikimedia)
- `core/image_processor.js` — processa/recorta imagem e salva no Supabase Storage

### Frontend público
- `public/index.html` — homepage
- `public/[categoria]/index.html` — 29+ páginas de categoria
- `public/admin/index.html` — painel admin
- `public/js/internal-page-v2.js` — JS principal de todas as páginas de categoria + artigos
- `public/js/ovc-cards.js` — cards dinâmicos da homepage (inclui seção colunistas 3+3)
- `public/js/materia-page.js` — JS da página /materia/

---

## 3. SISTEMA DE URLs DOS ARTIGOS (SEO CRÍTICO)

```
/{categoria}/{slug-do-titulo}-{id8}/
Exemplo: /politica/lula-sanciona-reforma-tributaria-a1b2c3d4/
```

- `id8` = primeiros 8 chars do UUID do Supabase
- `slug` = `slugify(titulo).slice(0,55)` — lowercase, sem acentos, hífens
- **Nunca usar `?id=`**

---

## 4. BANCO DE DADOS (Supabase)

### Tabela `posts`
Campos: `id, titulo, conteudo, comentario_fixado (meta_descricao), imagem, hash, status, approved, publish_method, user_tags (JSON array com categoria), subcategoria, published_at, metrics (JSON com SEO + views)`

**CRÍTICO:** `user_tags` é coluna **TEXT** contendo JSON string (ex: `["politica"]`), **NÃO** é JSONB nativo.
- **NUNCA usar `.contains()` do Supabase** para filtrar por categoria — não funciona em coluna TEXT
- **SEMPRE usar `.like('user_tags', '%"categoria"%')`** ou `.or()` com múltiplos `.like()`
- Exemplo correto: `.or('user_tags.like.%"politica"%,user_tags.like.%"economia"%')`

**Fluxo de status:** `pendente` → (Roberto aprova) → `publicado`

### Tabela `config`
- `AUTOMATION` = `"on"` — pipeline ativo
- `MAX_POSTS_DIA` = `"300"`
- `YOUTUBE_LIVE_URL` = URL embed YouTube para OVC TV

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
| Slug URLs para artigos | `api/article.js` + `vercel.json` | ✅ |
| SSR completo por artigo | `api/article.js` | ✅ |
| JSON-LD NewsArticle | `api/article.js` | ✅ |
| Sitemap dinâmico | `api/sitemap.js` | ✅ |
| OG meta tags SSR | `api/article.js` + `api/article-ssr.js` | ✅ |
| Canonical URL | `api/article.js` | ✅ |
| RSS apenas artigos de HOJE | `core/rss.js` — `isHoje()` | ✅ |
| Cron pipeline via GitHub Actions | `.github/workflows/pipeline-cron.yml` | ✅ |
| Seção Colunistas 3+3 na homepage | `public/js/ovc-cards.js` | ✅ |
| SSR landing /trabalho/ | `api/landing.js` + `vercel.json` | ✅ Deploy feito, **NÃO TESTADO** |
| SSR landing /financas/ | `api/landing.js` + `vercel.json` | ✅ Deploy feito, **NÃO TESTADO** |
| SSR landing /moradia/ | `api/landing.js` + `vercel.json` | ✅ Deploy feito, **NÃO TESTADO** |
| SSR editorial /vc/ | `api/landing.js` + `vercel.json` | ✅ Deploy feito, **NÃO TESTADO** |
| SSR landing /bem-estar/ | `api/landing.js` + `vercel.json` | ✅ Deploy feito, **NÃO TESTADO** |
| 240+ RSS feeds internacionais | `core/rss.js` | ✅ |

### Ações pendentes (Roberto faz)
1. **Testar** todas as landing pages acima no browser
2. **Search Console** → submeter `https://www.ovalorcapital.com.br/sitemap.xml`
3. **AdSense** → verificar aprovação
4. **Google News** → aplicar em news.google.com/publisher-center
5. **Instagram** → integrar CTA direto para artigos em cada Reel
6. **GitHub Actions** → verificar se está rodando: github.com/oterrasan/ovalorcapital/actions

---

## 7. PIPELINE DE AUTOMAÇÃO

**Vercel Hobby plan não suporta cron a cada 20min.** Solução: GitHub Actions (gratuito).

```
.github/workflows/pipeline-cron.yml
  schedule: '*/20 * * * *'  (a cada 20 min)
  → curl POST https://www.ovalorcapital.com.br/api/run
  → api/run.js → api/run_portal.js
  → RSS → scrape → IA → post pendente
```

Fluxo: GitHub Actions → `api/run_portal.js` → categoria HIGH_PRIORITY aleatória → RSS → `isHoje()` filtra só artigos de HOJE → scrape → OpenAI gpt-4o-mini → post pendente → Roberto aprova → publicado.

```js
const HIGH_PRIORITY_CATS = [
  'politica', 'economia', 'internacional', 'tecnologia',
  'investigativo', 'esportes', 'saude', 'negocios', 'investimentos'
];
```

---

## 8. HOMEPAGE — SEÇÕES DINÂMICAS

### Seção Colunistas & Opinião (3+3 cards)
Implementada em `public/js/ovc-cards.js` — função `carregarColunistas()`.
Fonte de dados: `GET /api/portal-posts?categoria=vc&limit=6`

**Nota:** `public/js/ovc-colunistas.js` é código morto — não está carregado. Pode ser deletado.

---

## 9. LANDING PAGES SSR TEMÁTICAS

### Arquitetura atual (após PR #26 — mai/2026)

**`api/landing.js` gera página HTML COMPLETA E STANDALONE** — sem usar template do portal.

**POR QUÊ mudou:** As tentativas anteriores de injetar conteúdo no template das páginas de categoria falharam porque:
1. O template usa `<div class="ovc-main">` (não `<main>`), então a função `injectMain()` não encontrava onde injetar
2. O script `internal-page-v2.js` sobrescrevia o `<main>` com "Carregando..." mesmo após remoção via regex
3. A query Supabase com `.contains()` não funcionava porque `user_tags` é TEXT não JSONB

**Solução implementada:** página 100% standalone com header/footer hardcoded, CSS do site carregado via `home.css`, zero JavaScript, conteúdo gerado servidor-side.

### Seções implementadas
| URL | Tema | Categorias | Status |
|---|---|---|---|
| `/trabalho/` | Trabalho & Carreira | vagas, concursos, profissoes, parcerias, educacao | Deploy feito, **testar** |
| `/financas/` | Finanças Pessoais | investimentos, seguros, tributacao, regulacao, mercados | Deploy feito, **testar** |
| `/moradia/` | Moradia & Imóveis | imoveis | Deploy feito, **testar** |
| `/vc/` | Colunistas & Opinião | vc, colunistas | Deploy feito, **testar** |
| `/bem-estar/` | Bem-Estar & Sociedade | saude, familia, cultura, religiao, esg | Deploy feito, **testar** |

### Rewrites ativos no vercel.json
```json
{ "source": "/trabalho",   "destination": "/api/landing?section=trabalho" },
{ "source": "/trabalho/",  "destination": "/api/landing?section=trabalho" },
{ "source": "/financas",   "destination": "/api/landing?section=financas" },
{ "source": "/financas/",  "destination": "/api/landing?section=financas" },
{ "source": "/moradia",    "destination": "/api/landing?section=moradia" },
{ "source": "/moradia/",   "destination": "/api/landing?section=moradia" },
{ "source": "/vc",         "destination": "/api/landing?section=vc" },
{ "source": "/vc/",        "destination": "/api/landing?section=vc" },
{ "source": "/bem-estar",  "destination": "/api/landing?section=bem-estar" },
{ "source": "/bem-estar/", "destination": "/api/landing?section=bem-estar" }
```

---

## 10. EXPANSÃO RSS — 240+ FEEDS (implementado mai/2026)

- **Agora:** 240+ feeds em 16 grupos, cobertura nacional + internacional
- `agronegocio`, BBC, Al Jazeera, Guardian, El País, TechCrunch, The Verge, InfoMoney, Suno Research, etc.

---

## 11. BUGS CORRIGIDOS — HISTÓRICO COMPLETO

### Sessão mai/2026 — bugs críticos anteriores

- **Bug 1** — `noticias-v3.js` `buildUrl()` gerava URLs `?id=` (CRÍTICO SEO) → corrigido
- **Bug 2** — `api/article.js` limitava a 400 posts, artigos antigos davam 404 → corrigido com `.ilike().limit(1)`
- **Bug 3** — `core/rss.js` sem fallback quando feeds DB desativados → corrigido
- **Bug 4** — Pipeline buscando artigos de meses atrás → corrigido com `isHoje()`
- **Bug 5** — Cron bloqueado no Vercel Hobby → migrado para GitHub Actions
- **Bug 6** — Admin: filtros de categoria não funcionavam → corrigido com `.like()` (PR #11)
- **Bug 7** — Imagens de concorrentes em posts manuais → corrigido
- **Bug 8** — Categorias faltando no editor admin → expandido para 29
- **Bug 9** — Seção Colunistas inexistente na homepage → `carregarColunistas()` em ovc-cards.js

### Sessão 10/mai/2026 — bugs das landing pages (PRs #24, #25, #26)

**Bug 10 — `api/landing.js`: query Supabase retornava sempre vazio**
- Causa: `.contains("user_tags", cfg.cats)` não funciona em coluna TEXT
- Correção (PR #24): mudado para `.or()` com `.like()` por categoria

**Bug 11 — Landing pages mostrando "Carregando..." em vez do conteúdo**
- Causa: o template das categorias usa `<div class="ovc-main">` e não `<main>`
  A função `injectMain()` procurava `<main>` e não encontrava, então não substituía o conteúdo.
  O script `internal-page-v2.js` continuava rodando e colocava "Carregando..." por cima.
- Correção (PR #26): abandonada a abordagem de template. `api/landing.js` agora gera
  **página HTML completa e standalone** com header/footer hardcoded e zero JavaScript.
  Deploy feito em 10/mai/2026, mas **não foi possível confirmar funcionamento** com Roberto
  (sessão encerrada pelo usuário antes da verificação).

**Ação para o próximo Claude:** Testar `ovalorcapital.com.br/financas/` e `ovalorcapital.com.br/trabalho/`.
Se ainda mostrar "Carregando...", o problema está no roteamento do Vercel (rewrite não está chegando em `api/landing.js`).
Nesse caso: adicionar um log simples no início do handler para confirmar que a função é chamada.

---

## 12. COMO RETOMAR EM NOVA SESSÃO

1. Ler este arquivo completamente
2. Ler `ESTRATEGIA_SEO.md` para contexto de negócio
3. **PRIMEIRA AÇÃO:** testar `ovalorcapital.com.br/financas/` no browser
   - Se mostrar página com artigos → landing pages funcionando, seguir para próximas prioridades
   - Se mostrar "Carregando..." → o roteamento Vercel não está chegando em `api/landing.js`, investigar
4. Verificar GitHub Actions rodando: Actions → Pipeline OVC
5. **Ao terminar:** atualizar este CLAUDE.md e fazer push para main

### Prioridades pendentes (por ordem)
1. 🔴 **VERIFICAR** se landing pages estão funcionando (deploy feito mas não confirmado)
2. 🔴 Adicionar `/trabalho/`, `/financas/`, `/moradia/`, `/bem-estar/` ao sitemap dinâmico (`api/sitemap.js`)
3. 🟡 Deletar `public/js/ovc-colunistas.js` (código morto)
4. 🟡 Mega-section `/seguranca/` já está em `api/landing.js` mas não tem rewrite no `vercel.json` — adicionar se desejado

---

## 13. CONTATO / CONTEXTO DO DONO

- **Nome:** Roberto (Terrasan)
- **Objetivo:** maior portal premium de notícias do Brasil sustentado por Google AdSense/AdX
- **Instagram:** 2,6M views/mês em Reels
- **Perfil técnico:** não é programador — precisa de implementações diretas, sem explicações longas
- **Estilo:** cobra resultados reais, quer feito — não quer status, links ou tutoriais
- **Lema do projeto:** cada artigo, cada categoria, cada pixel deve virar dinheiro com o Google
