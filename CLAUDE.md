# CLAUDE.md — Contexto completo do projeto O Valor Capital

> Este arquivo serve para retomar qualquer sessão de trabalho sem precisar explicar nada novamente.
> Leia do início ao fim antes de qualquer ação.
> **REGRA PERMANENTE:** Ao final de cada sessão, atualize este arquivo com tudo o que foi feito/planejado. O próximo Claude depende disso.

---

# 🚨 ALERTA CRÍTICO — VERCEL HOBBY PLAN — LER ANTES DE QUALQUER COISA

## LIMITES QUE MATAM O BUILD SILENCIOSAMENTE

Se esses limites forem violados, o Vercel **rejeita o deploy sem aviso visível**. O portal continua rodando código antigo. Ninguém percebe. Isso ficou assim por ~1 semana em mai/2026.

### Regras absolutas do Vercel Hobby:
```
❌ NUNCA mais de 12 arquivos em api/ — limit é 12 funções serverless
❌ NUNCA usar maxDuration > 10 no vercel.json — Hobby plan máx é 10s
```

### Estado atual: 12 funções (no limite exato)
```
api/article.js
api/category.js
api/ig_publish.js
api/institutional.js
api/landing.js
api/live.js
api/manage.js
api/manual_post.js
api/portal-posts.js
api/refresh_token.js
api/run_portal.js   ← PIPELINE AUTOMÁTICO
api/sitemap.js
```

### Arquivos DELETADOS em 14/05/2026 para caber no limite:
```
api/debug_rss.js       — diagnóstico
api/fix_images.js      — utilitário
api/recategorizar-vc.js — utilitário
api/run.js             — era alias redundante de run_portal.js
api/article-ssr.js     — rota /materia agora vai para api/article
api/auditoria.js       — utilitário de auditoria
api/editor_ia.js       — tab Editor IA do admin (quebrou — ok por ora)
api/live-data.js       — widgets de dados ao vivo (quebrou — ok por ora)
```

### REGRA PERMANENTE:
```
Antes de criar qualquer arquivo novo em api/, delete um existente primeiro.
Se precisar de mais de 12 funções: upgrade para Vercel Pro ($20/mês).
Vercel Pro: 160 funções, maxDuration até 300s.
```

### Por que isso fica invisível:
O Vercel não manda email de erro. O dashboard mostra deployment como "falhou" mas o site continua servindo o último deploy bem-sucedido. O admin mostra respostas do código antigo. Parece que as mudanças não surtiram efeito.

---

# 🔴 REGRA NÚMERO 1 — LEI ABSOLUTA E INVIOLÁVEL DO PORTAL

## TODA PÁGINA DO PORTAL DEVE TER SEO 100% COMPLETO. SEM EXCEÇÃO. SEM NEGOCIAÇÃO.

> Esta regra foi estabelecida pelo dono Roberto (Terrasan) em mai/2026 e nunca pode ser revertida, ignorada ou contornada por nenhuma IA, nenhum desenvolvedor, nenhuma atualização futura.

### CHECKLIST OBRIGATÓRIO

```
Para TODA e qualquer página do portal:

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
✅ JSON-LD schema (NewsArticle para artigos, CollectionPage para categorias/landing)
✅ SSR — o Googlebot recebe TODO o HTML sem executar JavaScript
✅ Cache adequado — nunca "no-cache" em páginas de conteúdo
✅ URL com slug legível (nunca ?id=)
✅ Presente no sitemap.xml dinâmico
```

### O QUE É PROIBIDO

```
❌ <title> usando TITULO completo (65+ chars) — Google trunca acima de ~60 chars
   → Artigos: usar META_TITLE (≤55 chars) + " | O Valor Capital"
❌ Página sem canonical
❌ Canonical apontando para ?id= (formato morto)
❌ og:image ausente
❌ Página de conteúdo com Cache-Control: no-cache
❌ Página nova sem SEO completo
❌ Imagens salvas como JPEG — sempre WebP quality 82
❌ /admin/ indexado pelo Google — robots.txt DEVE bloquear
```

---

## ⚠️ VISÃO ESTRATÉGICA

O modelo de negócio do portal é 100% dependente do Google:
```
300 artigos/dia → indexação massiva → tráfego orgânico → AdSense/AdX → receita
```

Fonte de receita: exclusivamente Google AdSense / Google AdX. O Google é o único cliente.

---

## ⛔ REGRAS SAGRADAS — NUNCA VIOLAR

1. **SEO 100% COMPLETO EM TODA PÁGINA** — Ver Regra #1.
2. **Topo e rodapé do portal NUNCA mudam.** Header e footer são identidade da marca.
3. **Pipeline publica direto como `publicado`** — nunca salvar como `pendente` sem fluxo de aprovação.
4. **URLs sempre com slug** — nunca regredir para `?id=`.
5. **SSR obrigatório** — Googlebot não pode depender de JS para ver conteúdo.
6. **Sitemap sempre atualizado** — `api/sitemap.js` é dinâmico.
7. **300 artigos/dia sem falha** — consistência é sinal de ranqueamento.
8. **REGRA DE DOCUMENTAÇÃO:** Ao final de toda sessão, atualizar CLAUDE.md e BUGS_CORRIGIDOS.md e fazer push para main.
9. **NUNCA usar `p.categoria`** — a coluna não existe. Sempre usar `user_tags` (JSON array `'["politica"]'`).
10. **NUNCA exigir strings fixas da IA no corpo** — ver Bug #7.
11. **`getNews()` sempre mistura feeds diretos garantidos** — nunca depender 100% de `rss_sources`.
12. **Todo INSERT em `posts` usa `status:'publicado'`, `approved:true`, `published_at:now`** — ver Bug #13.
13. **`category.js` redireciona `?id=` para `/og?id=`** — ver Bug #14.
14. **`vc` e `colunistas` NÃO são categorias do pipeline** — o pipeline nunca gera artigos com essas tags. São reservadas para conteúdo manual de colunistas.
15. **Landing pages (`/vc/`, `/trabalho/`, etc.) têm footer inline** — não usam a classe `.footer-bottom`. Qualquer mudança no footer dessas páginas deve ser feita diretamente em `api/landing.js` `buildFooter()`.
16. **META_TITLE (≤55 chars) separado do TITULO** — `<title>` usa META_TITLE + " | O Valor Capital". og:title e JSON-LD usam TITULO completo.
17. **VERCEL: máximo 12 arquivos em api/**  — exceder esse número faz o build falhar silenciosamente. Ver seção de alerta no topo deste arquivo.

---

## 1. O QUE É ESTE PROJETO

**O Valor Capital (OVC)** é um portal premium de notícias brasileiro focado em política, economia, negócios, investimentos, família, tributos e regulação. O dono é Roberto Cesar Terrasan (usuário: oterrasan).

- **URL produção:** https://www.ovalorcapital.com.br
- **Stack:** Vercel (serverless — plano Hobby, 12 funções máx, 10s máx), Supabase (PostgreSQL + Storage), React (admin via Babel), OpenAI gpt-4o-mini
- **Repo:** `oterrasan/ovalorcapital`
- **Branch principal:** `main` (Vercel deploya automaticamente em ~2 min após push)
- **Instagram:** 2,6M views/mês em Reels autorais
- **Contato público:** contato@ovalorcapital.com.br (mascarado → betoterrasan@gmail.com até ovalorcapital@gmail.com ser ativado)
- **Endereço:** Rua Juiz de Fora, 367 — Via Ema — São Paulo/SP — CEP 03286-000

---

## 2. ARQUITETURA DO SISTEMA

### APIs (Vercel serverless) — 12 FUNÇÕES TOTAL (LIMITE HOBBY)
| Arquivo | Função |
|---|---|
| `api/article.js` | SSR completo de artigos por slug URL — **crítico para SEO** |
| `api/category.js` | SSR para listagem das 29 categorias |
| `api/ig_publish.js` | Publica no Instagram via bot Playwright |
| `api/institutional.js` | SSR páginas institucionais (/quem-somos/, /politica-editorial/) |
| `api/landing.js` | SSR landing pages temáticas (/vc/, /trabalho/, /financas/, /moradia/, /seguranca/, /bem-estar/) |
| `api/live.js` | SSR para radar, tv-ovc, radio-ovc, dados, cotações, agenda |
| `api/manage.js` | Status, aprovação, track_view, newsletter — gestão geral do admin |
| `api/manual_post.js` | Geração manual de artigos via URL — chamado pelo admin "Novo Post" |
| `api/portal-posts.js` | Serve posts publicados para o frontend |
| `api/refresh_token.js` | Renova token do Instagram (cron mensal) |
| `api/run_portal.js` | **Pipeline automático** RSS → scrape → IA → salva post |
| `api/sitemap.js` | Sitemap dinâmico com todos os artigos publicados |

> ⚠️ ATENÇÃO: Se precisar criar um novo arquivo em api/, você DEVE deletar um existente primeiro.
> As funções `editor_ia.js` (Editor IA do admin) e `live-data.js` (dados ao vivo) foram deletadas
> em 14/05/2026 para caber no limite. Para restaurá-las, upgrade para Vercel Pro.

### Core (lógica de negócio)
| Arquivo | Função |
|---|---|
| `core/rss.js` | Busca notícias — 240+ feeds em 16 grupos + `FEEDS_DIRETOS_GARANTIDOS` |
| `core/scraper.js` | Extrai texto de URLs (3 camadas: p → div → og:meta) |
| `core/ai_portal.js` | Chamada OpenAI com prompt PAUTA EDITORIAL — retorna META_TITLE, TITULO, CORPO, etc. |
| `core/image_finder.js` | Busca imagem relevante (timeout 10s) |
| `core/image_processor.js` | Processa/recorta imagem → salva como **WebP quality 82** no Supabase Storage |

### Frontend público
- `public/index.html` — homepage (**302KB — não editar via MCP, usar newsletter-bar.js como vetor**)
- `public/[categoria]/index.html` — 29+ páginas de categoria (templates estáticos)
- `public/admin/index.html` — painel admin
- `public/js/newsletter-bar.js` — carregado via `<script defer>` em TODAS as páginas de categoria e homepage. Injeta newsletter bar + patcha footer (funciona APENAS em páginas com `<footer class="footer">` e `.footer-bottom`)
- `public/robots.txt` — bloqueia `/admin/` para Googlebot

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
metrics (JSON: {foco_keyword, seo_slug, meta_descricao, meta_title, views}),
priority, retry_count, max_retries
```

**CRÍTICO:** `user_tags` é TEXT (não JSONB). Sempre usar `.like()`, nunca `.contains()`.
**CRÍTICO:** Não existe coluna `categoria`. Sempre usar `user_tags`.
**CRÍTICO:** `comentario_fixado` = meta description. Gerada pela IA, usada no SSR.
**CRÍTICO:** `metrics.meta_title` = título SEO ≤55 chars. Usado no `<title>` tag.

**Fluxo de status:** pipeline salva direto como `publicado` com `approved: true` — aparece imediatamente.

### Tabela `config`
| Chave | Descrição |
|---|---|
| `AUTOMATION` | `"on"` ou `"off"` — liga/desliga pipeline |
| `MAX_POSTS_DIA` | Limite diário (padrão: `"300"`) |
| `POSTS_01_06` … `POSTS_17_00` | Máx posts por faixa horária |
| `YOUTUBE_LIVE_URL` | URL embed YouTube para OVC TV |

---

## 5. CATEGORIAS DO SISTEMA

### Categorias válidas do pipeline (27 slugs — NUNCA incluir vc/colunistas)
```
politica, economia, negocios, investimentos, seguros, mercados,
educacao, industria, tecnologia, esportes, saude, familia,
tributacao, regulacao, parcerias, internacional, variedades,
investigativo, seguranca, cultura, profissoes, vagas,
concursos, imoveis, esg, defesa, religiao
```

### Categorias reservadas (NÃO usadas pelo pipeline automático)
```
vc, colunistas — reservadas para conteúdo manual de colunistas/editorial
```

### Landing pages e o que cada uma mostra
| URL | cats usadas na query |
|---|---|
| `/vc/` | investigativo, variedades, cultura (**não** vc/colunistas — ver Bug #15) |
| `/trabalho/` | vagas, concursos, profissoes, parcerias, educacao |
| `/financas/` | investimentos, seguros, tributacao, regulacao, mercados |
| `/moradia/` | imoveis |
| `/seguranca/` | seguranca, defesa, investigativo |
| `/bem-estar/` | saude, familia, cultura, religiao, esg |

---

## 6. PIPELINE DE AUTOMAÇÃO — DETALHE COMPLETO

### Fluxo atual (14/05/2026)
```
GitHub Actions (.github/workflows/pipeline_portal.yml)
  schedule: '*/2 * * * *'   ← a cada 2 minutos
  → POST https://www.ovalorcapital.com.br/api/run_portal
  → body: {"count":1}        ← 1 artigo por execução, SEM force
  → Verifica janela horária 07:00–01:00 BRT
  → getNewsByCategoria() + getNews() em paralelo
  → Para cada notícia: scrape() → rewritePortal() → validar() → salva como publicado
```

### Parâmetros do handler
```js
body.force = true   // bypassa verificação de horário (07:00-01:00 BRT)
body.count = N      // número de artigos a gerar (máx 8, padrão 1)
body.categoria      // forçar categoria específica
body.subcategoria   // forçar subcategoria específica
```

### Janela horária
```
Roda de 07:00 às 01:00 BRT — fora desse horário retorna {status:'fora_horario'}
BRT = UTC-3 (Brasil não usa horário de verão desde 2019)
```

### Diagnóstico da resposta
```
{"status":"ok"}           → artigo gerado com sucesso
{"status":"no_news"}      → RSS retornou vazio (prio:N, gen:N, ts:timestamp)
{"status":"no_valid_news"} → RSS retornou itens mas todos falharam (scrape/IA/dedup)
{"status":"fora_horario"} → fora da janela 07:00-01:00 BRT
{"status":"error"}        → exceção não tratada
```

Se a resposta de `no_news` NÃO tiver campo `ts`: **o código novo não deployou** → verificar limite de funções/maxDuration no vercel.json.

### RSS — como funciona
- `core/rss.js` usa **axios** (browser headers) para buscar + **rss-parser** para parsear + **regex fallback** se rss-parser falhar
- `FEEDS_DIRETOS_GARANTIDOS`: 20 feeds diretos (BBC, Agência Brasil, TechCrunch, The Verge, etc.)
- `FEEDS_POR_GRUPO`: 240+ feeds Google News RSS por categoria
- `isRecente()`: janela de 48h — items sem data são aceitos

---

## 7. META_TITLE — IMPLEMENTAÇÃO COMPLETA

### Problema que resolveu
`<title>` usava o TITULO completo (50-65 chars) + " | O Valor Capital" (17) = até 83 chars. Google trunca acima de ~60. CTR caia.

### Fluxo implementado

**`core/ai_portal.js`** — campo no prompt:
```
META_TITLE: versão SEO da manchete com NO MÁXIMO 55 caracteres — keyword no início, sem marca "O Valor Capital"
```
`parse()` extrai a linha `META_TITLE:` → objeto com `meta_title` (truncado a 55 chars).

**`api/run_portal.js`** — salva no banco:
```js
metrics: { foco_keyword, seo_slug, meta_descricao, meta_title: content.meta_title || '' }
```

**`api/article.js`** — usa no `<title>`:
```js
const metricsJson = JSON.parse(article.metrics || '{}');
const metaTitleRaw = (metricsJson.meta_title || titulo).slice(0, 55).trim();
const titleTag = `${metaTitleRaw} | O Valor Capital`;  // ≤72 chars
// <title> usa titleTag
// og:title e JSON-LD headline usam titulo completo (visual)
```

---

## 8. PÁGINAS INSTITUCIONAIS — GOOGLE NEWS E-E-A-T

**`api/institutional.js`** — SSR para duas páginas:
- `/quem-somos/` → dados reais do responsável editorial
- `/politica-editorial/` → critérios editoriais e uso de IA

**Dados reais:**
- Responsável: Roberto Cesar Terrasan
- Endereço: Rua Juiz de Fora, 367 — Via Ema — São Paulo/SP — CEP 03286-000
- Email display: `contato@ovalorcapital.com.br` → href real: `betoterrasan@gmail.com`

**Email masking** (constante no topo do arquivo — atualizar quando ovalorcapital@gmail.com for ativado):
```js
const EMAIL_REAL    = "betoterrasan@gmail.com";
const EMAIL_DISPLAY = "contato@ovalorcapital.com.br";
```

---

## 9. FOOTER — ESTRUTURA E LIMITAÇÕES CONHECIDAS

### Páginas de categoria e homepage (public/[cat]/index.html, public/index.html)
- Têm `<footer class="footer">` com `<div class="footer-bottom">` dentro
- `newsletter-bar.js` injeta: newsletter bar acima do footer + patcha copyright + links legais + disclaimer
- **Para ver mudanças: hard refresh (Ctrl+Shift+R)**

### Landing pages (api/landing.js — /vc/, /trabalho/, /financas/, etc.)
- Footer é construído inline por `buildFooter()` em `api/landing.js`
- **Não tem classes CSS** — `newsletter-bar.js` não consegue patchá-las
- Footer atualizado diretamente em `buildFooter()` com copyright 2026, links institucionais, disclaimer

---

## 10. SEO — STATUS COMPLETO

| Feature | Arquivo | Status |
|---|---|---|
| Slug URLs para artigos | `api/article.js` + `vercel.json` | ✅ |
| SSR completo por artigo | `api/article.js` | ✅ |
| JSON-LD NewsArticle | `api/article.js` | ✅ |
| META_TITLE ≤55 chars no `<title>` | `api/article.js` + `core/ai_portal.js` | ✅ |
| Meta description por artigo | `api/article.js` (`comentario_fixado`) | ✅ |
| Meta description por categoria (29) | `api/category.js` (hardcoded) | ✅ |
| SSR listagem de categorias (29) | `api/category.js` + `vercel.json` | ✅ |
| SSR radar/tv/rádio/dados/cotações/agenda | `api/live.js` + `vercel.json` | ✅ |
| SSR landing /trabalho/ /financas/ /moradia/ | `api/landing.js` + `vercel.json` | ✅ |
| SSR landing /vc/ /seguranca/ /bem-estar/ | `api/landing.js` + `vercel.json` | ✅ |
| SSR /quem-somos/ e /politica-editorial/ | `api/institutional.js` + `vercel.json` | ✅ |
| WebP quality 82 (era JPEG) | `core/image_processor.js` | ✅ |
| robots.txt bloqueia /admin/ | `public/robots.txt` | ✅ |
| Footer copyright 2026 + links em landing pages | `api/landing.js` `buildFooter()` | ✅ |
| Footer copyright 2026 + links em cat pages | `public/js/newsletter-bar.js` | ✅ (requer hard refresh) |
| og:image em todas as páginas | Todos os handlers SSR | ✅ |
| Canonical www consistente | Todos os handlers SSR | ✅ |
| Sitemap dinâmico | `api/sitemap.js` | ✅ |
| 404 com noindex | `public/404.html` | ✅ |
| Homepage cache s-maxage=60 | `vercel.json` | ✅ |
| Redirect links antigos ?id= | `api/category.js` | ✅ |

### Ações pendentes (Roberto faz manualmente)
1. **Search Console** → submeter `https://www.ovalorcapital.com.br/sitemap.xml`
2. **AdSense** → verificar aprovação
3. **Google Publisher Center** → `https://publishercenter.google.com` — cadastrar portal e submeter sitemap
4. **Email** → quando `ovalorcapital@gmail.com` ativado, atualizar `EMAIL_REAL` em `api/institutional.js`

---

## 11. BUGS CRÍTICOS — RESUMO

Documentação completa em `BUGS_CORRIGIDOS.md`.

| # | Bug | Arquivo | Status |
|---|-----|---------|--------|
| 1 | `</script>` em JSON → página branca | `api/article.js` | ✅ |
| 2 | `isHoje()` rejeita itens sem data → no_valid_news | `core/rss.js` | ✅ |
| 3 | Feeds gerais misturados na geração forçada | `api/run_portal.js` | ✅ |
| 4 | Subcategoria "Geral" salva no banco | `api/run_portal.js` | ✅ |
| 5 | targetCount=1, pool=40, sem dedup → volume baixo | `api/run_portal.js` | ✅ |
| 6 | Sem faixas horárias → posts esgotados na madrugada | `api/run_portal.js` | ✅ |
| 7 | validar() exigia 'redação ovc' → 100% das gerações falhavam | `api/manage.js` | ✅ |
| 8 | forcarExecucao() enviava GET → force ignorado | `automacao.html` | ✅ |
| 9 | p.categoria inexistente → undefined na tabela | `automacao.html` | ✅ |
| 10 | getNews() fallback usava GN → mesmo rate-limit | `core/rss.js` | ✅ |
| 11 | Scraper só `<p>` → texto vazio em 70%+ sites | `core/scraper.js` | ✅ |
| 12 | no_news persistente — 1a tentativa 100% Google News | `core/rss.js` | ✅ |
| 13 | Pipeline salvava como pendente → portal vazio por ~3 dias | `run_portal.js` + `manage.js` | ✅ |
| 14 | Links ?id= abriam categoria vazia | `api/category.js` | ✅ |
| 15 | /vc/ mostrava conteúdo sem sentido (cats vc/colunistas inexistentes no pipeline) | `api/landing.js` | ✅ |
| 16 | Footer de landing pages sem copyright/links institucionais | `api/landing.js` | ✅ |
| 17 | **Build Vercel falhando silenciosamente por ~1 semana** — maxDuration:60 no vercel.json (Hobby máx é 10s) + 20 funções em api/ (Hobby máx é 12) → portal rodava código de semana atrás | `vercel.json` + `api/` | ✅ 14/05/2026 |

---

## 12. COMO RETOMAR EM NOVA SESSÃO

1. **Ler este arquivo completamente** — especialmente a seção de ALERTA VERCEL no topo
2. Ler `BUGS_CORRIGIDOS.md` — nunca desfazer correções listadas
3. **ANTES de criar qualquer arquivo em api/**: verificar que há ≤11 arquivos lá. Hobby plan = 12 máx.
4. **NUNCA adicionar maxDuration > 10 no vercel.json** — Hobby plan máx é 10s
5. Qualquer página nova: verificar checklist SEO da Regra #1
6. Verificar GitHub Actions rodando (repo → Actions)
7. **Ao terminar:** atualizar CLAUDE.md + BUGS_CORRIGIDOS.md e fazer push para main

---

## 13. CONTATO / CONTEXTO DO DONO

- **Nome:** Roberto Cesar Terrasan
- **Objetivo:** maior portal premium de notícias do Brasil sustentado por Google AdSense/AdX
- **Instagram:** 2,6M views/mês em Reels
- **Perfil técnico:** não é programador — implementações diretas, sem explicações longas
- **Estilo:** cobra resultados reais. Não quer links, não quer status — quer feito e funcionando.
- **Comunicação:** português, direto ao ponto
- **NUNCA perguntar** coisas óbvias sobre infraestrutura que claramente está no ar

---

## 14. HISTÓRICO DE SESSÕES

### Sessão mai/2026 — Rodada 1
- isRecente, catForcada, subcatForcada (Bugs #2, #3, #4)
- validar() Bug #7, automacao.html Bugs #8, #9
- scraper 3 camadas Bug #11, getNews() fallback Bugs #10, #12
- faixas horárias Bug #6

### Sessão mai/2026 — Rodada 2 (14/mai/2026)
- Bug #13: pipeline e manage.js salvam como publicado (era pendente)
- Bug #14: category.js redireciona ?id= para /og?id=

### Sessão mai/2026 — Rodada 3 (14/mai/2026)
**Implementações:**
- `public/robots.txt` → bloqueia /admin/ para Googlebot
- `core/image_processor.js` → WebP quality 82 (era JPEG)
- `core/ai_portal.js` → campo META_TITLE ≤55 chars no prompt + parse()
- `api/article.js` → `<title>` usa metrics.meta_title; og:title usa titulo completo
- `api/run_portal.js` → salva meta_title em metrics JSON
- `api/institutional.js` → NOVO — SSR /quem-somos/ e /politica-editorial/ com dados reais
- `vercel.json` → rotas para /quem-somos/ e /politica-editorial/
- `public/js/newsletter-bar.js` → footer patch
- Bug #15: `api/landing.js` → vc section: cats mudadas de [vc,colunistas] para [investigativo,variedades,cultura]
- Bug #16: `api/landing.js` → `buildFooter()` agora tem copyright 2026, links institucionais, disclaimer

### Sessão mai/2026 — Rodada 4 (14/mai/2026) — BUG #17 — CRÍTICO
**Diagnóstico:** Build Vercel falhando silenciosamente por ~1 semana. Causa: dois problemas simultâneos no vercel.json:
1. `maxDuration: 60` em várias funções — Hobby plan permite máx 10s
2. 20 arquivos em `api/` — Hobby plan permite máx 12 funções

O Vercel rejeitava cada novo deploy sem aviso visível. O portal continuava servindo código antigo. Nenhuma das correções das últimas semanas estava chegando ao ar.

**Correções aplicadas:**
- Deletados 8 arquivos de `api/` (debug_rss, fix_images, recategorizar-vc, run, article-ssr, auditoria, editor_ia, live-data)
- `vercel.json` → removido todo bloco `functions` com maxDuration (usa default do plano)
- `vercel.json` → rota `/materia` atualizada para `/api/article`
- `core/rss.js` → restaurado `rss-parser` + adicionado fallback regex para XML malformado
- `core/rss.js` → `fetchFeed()` agora: axios (HTTP) → rss-parser (parse) → regex fallback
- `.github/workflows/pipeline_portal.yml` → cron volta para `*/2 * * * *` com `count:1`

**Estado atual do pipeline:**
- Cron: `*/2 * * * *` — POST `/api/run_portal` com `{"count":1}` sem force
- Janela: 07:00–01:00 BRT
- `run_portal.js` tem timeout de 10s no Hobby plan — funciona para artigos rápidos
- Se pipeline travar de novo: verificar plano Vercel → se Hobby, considerar upgrade Pro

**Funcionalidades temporariamente quebradas (aceitável):**
- Tab "Editor IA" no admin → 404 (api/editor_ia.js deletado)
- Widgets de dados ao vivo → 404 (api/live-data.js deletado)
- Auditoria de posts → 404 (api/auditoria.js deletado)
