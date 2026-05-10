# CLAUDE.md — Contexto completo do projeto O Valor Capital

> Este arquivo serve para retomar qualquer sessão de trabalho sem precisar explicar nada novamente.
> Leia do início ao fim antes de qualquer ação.

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

## 1. O QUE É ESTE PROJETO

**O Valor Capital (OVC)** é um portal premium de notícias brasileiro focado em política, economia, negócios, investimentos, família, tributos e regulação. O dono é Roberto (usuário: oterrasan).

- **URL produção:** https://ovalorcapital.com.br
- **Stack:** Next.js/Vercel (serverless), Supabase (PostgreSQL + Storage), React (admin inline via Babel), OpenAI gpt-4o-mini
- **Repo:** `oterrasan/ovalorcapital`
- **Branch principal:** `main` (Vercel deploya automaticamente)
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

### Core (lógica de negócio)
- `core/ai_portal.js` — chamada OpenAI com prompt PAUTA EDITORIAL
- `core/rss.js` — busca notícias dos feeds RSS
- `core/scraper.js` — extrai texto de URLs
- `core/image_finder.js` — busca imagem relevante (timeout 10s, 1 chamada Wikimedia)
- `core/image_processor.js` — processa/recorta imagem e salva no Supabase Storage

### Frontend público
- `public/index.html` — homepage
- `public/[categoria]/index.html` — 29+ páginas de categoria (usadas como template pelo api/article.js)
- `public/materia/index.html` — página standalone de artigo (legacy)
- `public/admin/index.html` — painel admin
- `public/js/internal-page-v2.js` — JS principal de todas as páginas de categoria + artigos
- `public/js/ovc-cards.js` — cards dinâmicos da homepage
- `public/js/materia-page.js` — JS da página /materia/

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
3. `api/article.js` extrai `id8`, busca artigo no Supabase, retorna HTML completo com:
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

### buildUrl() — todas as ocorrências
Presente em 4 arquivos JS, **todas** gerando slug URLs:
- `public/js/noticias-v3.js` — homepage (hero, rotating cards, seção central/direito)
- `public/js/ovc-cards.js` — cards de categoria
- `public/js/internal-page-v2.js` — páginas internas de categoria
- `public/js/materia-page.js` — página /materia/ (legacy)

Formato: `/{catPath}/{slug}-{id8}/`

⚠️ **Atenção:** noticias-v3.js já estava correto desde mai/2026. Se um dia precisar tocar nele, manter o `_slugify()` e o `buildUrl()` com slug — nunca regredir para `?id=`.

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
- `AUTOMATION` = `"on"` ou `"off"` — liga/desliga pipeline automático
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

### Ações pendentes (Roberto faz)
1. **Search Console** → submeter `https://www.ovalorcapital.com.br/sitemap.xml`
2. **AdSense** → verificar aprovação / aplicar se não aprovado
3. **Google News** → aplicar em news.google.com/publisher-center
4. **Instagram** → integrar CTA direto para artigos em cada Reel
5. **Meta Reels Play Bonus** → aplicar se não inscrito

---

## 7. PIPELINE DE AUTOMAÇÃO

### Fluxo completo
```
Cron a cada 20min → api/run.js → api/run_portal.js
  → RSS feeds → scrape → OpenAI gpt-4o-mini → post pendente
  → (background) corrigirPostsExistentes() — corrige categoria/imagem nos últimos 100 posts
  → Admin aprova → status = publicado → aparece no portal
```

### Regras de categoria (REGRAS_CATEGORIA)
Keywords no título sobrescrevem a categoria sugerida pela IA.
Implementado em `api/run_portal.js` — `corrigirCategoria()`.

### findImage() — timeout garantido
`core/image_finder.js` usa `Promise.race` com timeout de 10s.
Nunca mais trava o pipeline por imagem.

---

## 8. REGRAS DE NEGÓCIO INVIOLÁVEIS

1. **Nada publica sem aprovação manual do Roberto** — proteção contra penalidade Google HCU
2. **URLs sempre com slug** — nunca regredir para `?id=`
3. **SSR obrigatório** — Googlebot não pode depender de JS para ver o conteúdo
4. **Sitemap sempre atualizado** — `api/sitemap.js` é dinâmico, não editar sitemap estático
5. **300 artigos/dia sem falha** — consistência é sinal de ranqueamento
6. **Só OpenAI ativo** — Gemini, Groq não configurados
7. **Aprovação obrigatória mantida** — nunca auto-publicar

---

## 9. BUGS CORRIGIDOS — HISTÓRICO

### Sessão mai/2026 — 3 bugs críticos corrigidos (commit 87d9059)

**Bug 1 — noticias-v3.js `buildUrl()` gerava URLs `?id=` (CRÍTICO SEO)**
- Todos os links da homepage (hero, cards rotacionados, seções central/direito) geravam `/{cat}/?id={id8}` em vez de slug URLs
- Google estava indexando URLs não-canônicas a partir da página mais visitada do portal
- Correção: adicionado `_slugify()`, reescrito `buildUrl()`, expandido `CAT_PATH` com todas as 29 categorias

**Bug 2 — `api/article.js` limitava a 400 posts (CRÍTICO SEO)**
- Buscava os 400 posts mais recentes e fazia `.find(r => r.id.startsWith(id8))` em memória
- Com 300 artigos/dia, qualquer artigo com mais de ~33h retornava 404 para o Googlebot
- Correção: substituído por `.ilike("id", "${id8}%").limit(1)` — consulta direta no banco, sem limite de janela

**Bug 3 — `core/rss.js` sem fallback quando todos os feeds DB estão desativados (MÉDIO)**
- Se admin configurava `rss_sources` no Supabase mas desativava todos, `feedsParaUsar` ficava array vazio — pipeline silenciosamente sem feeds
- Correção: `if (!feedsParaUsar.length) feedsParaUsar = selecionarFeedsBalanceados();`

---

## 10. COMO RETOMAR EM NOVA SESSÃO

1. Ler este arquivo (CLAUDE.md) completamente
2. Ler `ESTRATEGIA_SEO.md` para contexto de negócio
3. Verificar estado do git: `git log --oneline -5`
4. Trabalhar direto na branch `main` (Vercel deploya automaticamente)
5. Roberto testa em `ovalorcapital.com.br`

---

## 11. CONTATO / CONTEXTO DO DONO

- **Nome:** Roberto (Terrasan)
- **Objetivo:** maior portal premium de notícias do Brasil sustentado por Google AdSense/AdX
- **Instagram:** 2,6M views/mês em Reels — audiência real que alimenta o SEO
- **Perfil técnico:** não é programador — precisa de implementações diretas, sem explicações longas
- **Estilo:** cobra resultados reais, não quer links para clicar, não quer status — quer feito
- **Lema do projeto:** cada artigo, cada categoria, cada pixel deve virar dinheiro com o Google
