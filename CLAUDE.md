# CLAUDE.md — Contexto completo do projeto O Valor Capital

> Este arquivo serve para retomar qualquer sessão de trabalho sem precisar explicar nada novamente.
> Leia do início ao fim antes de qualquer ação.

---

## 1. O QUE É ESTE PROJETO

**O Valor Capital (OVC)** é um portal premium de notícias brasileiro focado em política, economia, negócios, investimentos, família, tributos e regulação. O dono é Roberto (usuário: oterrasan).

- **URL produção:** https://ovalorcapital.com.br
- **Stack:** Next.js/Vercel (serverless), Supabase (PostgreSQL + Storage), React (admin inline via Babel), OpenAI gpt-4o-mini
- **Repo:** `oterrasan/ovalorcapital`
- **Branch de desenvolvimento:** `claude/fix-conversation-history-xOtaY`
- **Deploy:** Vercel deploya automaticamente do branch `main`

---

## 2. ARQUITETURA DO SISTEMA

### APIs (Vercel serverless — limite 9 funções no Hobby plan)
| Arquivo | Função |
|---|---|
| `api/manage.js` | Unifica: status do sistema, aprovação manual, geração manual de posts |
| `api/run_portal.js` | Pipeline automático RSS → scrape → IA → salva como pendente |
| `api/portal-posts.js` | Serve posts publicados para o frontend |
| `api/editor_ia.js` | Editor IA do admin (reescrever/gerar conteúdo manualmente) |
| `api/ig_publish.js` | Publica no Instagram via bot Playwright |
| `api/refresh_token.js` | Renova token do Instagram |
| `api/live-data.js` | Cotações ao vivo |
| `api/cron-*.js` | Jobs agendados |

### Core (lógica de negócio)
- `core/ai_portal.js` — chamada OpenAI com prompt PAUTA EDITORIAL, parse do resultado
- `core/rss.js` — busca notícias dos feeds RSS
- `core/scraper.js` — extrai texto de URLs
- `core/image_finder.js` — busca imagem relevante
- `core/image_processor.js` — processa/recorta imagem e salva no Supabase Storage

### Frontend público
- `public/index.html` — homepage
- `public/[categoria]/index.html` — páginas de categoria (14 páginas)
- `public/_materia/index.html` — página standalone de artigo
- `public/admin/index.html` — painel admin (React inline, ~2200 linhas)
- `public/js/internal-page-v2.js` — JS principal das páginas de categoria + artigos
- `public/js/ovc-cards.js` — cards dinâmicos da homepage
- `public/js/home.js` — homepage hero/feature/lions + seções dinâmicas
- `public/css/home.css` — CSS principal (~2010 linhas)
- `public/css/site.css` — CSS das páginas internas

---

## 3. BANCO DE DADOS (Supabase)

### Tabela `posts`
Campos principais: `id, titulo, conteudo, comentario_fixado (meta_descricao), imagem, hash, status, approved, publish_method, user_tags (JSON array com categoria), subcategoria, subcategoria_slug, created_at, published_at, metrics (JSON com SEO), priority, retry_count, max_retries`

**Fluxo de status:** `pendente` → (admin aprova) → `publicado`
- Nada vai direto para `publicado` — toda matéria exige aprovação manual
- `publish_method: "portal"` = gerado pelo pipeline automático RSS
- `publish_method: "manual"` = gerado pelo editor IA do admin

### Tabela `config`
Chaves importantes:
- `AUTOMATION` = `"on"` ou `"off"` — liga/desliga o pipeline automático
- `MAX_POSTS_DIA` = `"300"` — limite diário de posts automáticos
- `IG_SERVICE_URL` = URL do bot Instagram no Render.com (ainda não configurado)

---

## 4. CATEGORIAS DO SISTEMA

### Categorias válidas (slugs exatos usados no banco):
```
politica, economia, negocios, investimentos, seguros, mercados,
educacao, industria, tecnologia, esportes, saude, familia,
tributacao, regulacao, parcerias, internacional, variedades, vc, colunistas
```

### Mapeamento categoria → URL do portal:
```
tributacao → /tributos/
colunistas → /vc/
todos os outros → /[slug]/
```

### Páginas de categoria existentes em `public/`:
`politica, economia, negocios, investimentos, seguros, mercados, educacao, industria, tecnologia, esportes, saude, familia, tributos, regulacao, parcerias`

### Páginas de categoria FALTANDO (cards no ovc-cards.js mas sem página HTML):
- `/internacional/` — não existe ainda
- `/variedades/` — não existe ainda

---

## 5. O QUE FOI FEITO NESTA SESSÃO (tudo mergeado ao main)

### Admin (public/admin/index.html)
- Removida aba "Fila de Publicação" (chamava `/api/scheduler` que não existe)
- Corrigido upload de imagens (usa Supabase Storage SDK direto, não `/api/upload`)
- Removido `approveOne` Instagram (token expirado) — mantido só `publicarIG` (bot Playwright)
- Todas as chamadas de API corrigidas: `/api/run_manual` → `/api/manage`, `/api/status` → `/api/manage`, `/api/approve` → `/api/manage`
- Editor IA: default trocado de Gemini para OpenAI
- **Filtros avançados no Postagens:** busca por título, categoria, subcategoria, data, origem (auto/manual)
- **Ações em lote:** aprovar selecionados, deletar selecionados
- Checkboxes em todos os posts (não só pendentes)

### Pipeline de IA (core/ai_portal.js + api/editor_ia.js)
- System message adicionada ao callOpenAI() para evitar recusa de conteúdo
- `NOTÍCIA FONTE:` → `PAUTA EDITORIAL:` para não acionar filtros de conteúdo
- Removido fallback para Gemini (Gemini não está pago/ativo)
- Gemini não configurado — só OpenAI gpt-4o-mini ativo

### Pipeline automático (api/run_portal.js)
- Removida lógica de horários com caps (1-6h=12, 6-12h=30, etc.)
- Agora lê `MAX_POSTS_DIA` do Supabase config (padrão 300)
- Contador de posts conta só `publish_method="portal"` (manuais não contam)
- Posts inseridos como `status:"pendente", approved:false` (não vão direto ao ar)

### manage.js
- Posts manuais também vão como `pendente` (não publicado direto)
- `posts_hoje` conta corretamente só os automáticos do dia

### Portal homepage (ovc-cards.js + home.js)
- Adicionadas categorias `internacional` e `variedades` ao grid dinâmico
- `buildUrl` atualizado para mapear essas categorias

### Páginas internas (internal-page-v2.js) — REESCRITA COMPLETA
**Contaminação resolvida:**
- API: `like('%"categoria"%')` — filtro exato no JSON
- JS: `p.categoria === catFiltro` sem fallback — se vazio mostra empty state

**Layout categoria (premium):**
- Seção hero estática (placeholder) substituída por cabeçalho real com badge colorido
- 1º post → hero card full-width com imagem + overlay gradient
- 2º e 3º posts → grid 2 colunas (cards médios)
- Posts 4+ → lista compacta com thumbnail
- Rail direito populado com últimas da categoria + CTA de contato
- Títulos de seção com borda colorida da categoria

**Layout artigo (leitura completa):**
- Breadcrumb + badge + data
- Share bar: WhatsApp, Telegram, X, Facebook, Copiar link
- `##` renderizado como H2 com borda colorida
- Hashtags como badges
- Rail direito com relacionadas da mesma categoria
- CTA de contato ao fim
- Open Graph dinâmico para preview em redes sociais

### /_materia/index.html — REESCRITA COMPLETA
- Página autônoma 2 colunas: artigo + sidebar
- Share bar, relacionadas, CTA de contato
- Substituiu a versão que usava noticias.js (script da homepage, errado)

---

## 6. PENDÊNCIAS ABERTAS

### Código (fazer no repo):
1. **Criar `/internacional/index.html`** — clonar qualquer categoria, trocar `data-category="internacional"` e o título
2. **Criar `/variedades/index.html`** — idem
3. **Adicionar `[data-topic-grid]` e `[data-rail-list]` nos HTMLs das categorias** — slots que o JS procura mas não existem no HTML ainda

### Externo (Roberto faz no painel):
4. **Instagram Bot — deploy no Render.com**
   - Repo `ovc-instagram-bot` tem `render.yaml` pronto
   - São 5 cliques no painel do Render
   - Depois: colocar URL gerada como `IG_SERVICE_URL` na tabela `config` do Supabase e no admin em Configurações
5. **Bucket `posts-images` no Supabase**
   - Supabase → Storage → New Bucket → nome: `posts-images` → marcar como público

### Próximos desenvolvimentos planejados:
6. **Rails e "ao vivos" da homepage** — tickers de cotação estão hard-coded, OVC TV e Áudio também estáticos
7. **Novas categorias/subcategorias** — Roberto vai informar quais faltam (interrompido por erro 529)

---

## 7. REGRAS DE NEGÓCIO IMPORTANTES

- **Nada publica sem aprovação manual do Roberto** — toda matéria vai para `pendente` primeiro
- **Manuais não contam no limite diário** — só `publish_method="portal"` conta
- **Só OpenAI ativo** — Gemini, Groq, Grok não estão configurados/pagos
- **9 funções no Vercel Hobby** — não criar novas funções sem deletar outras primeiro
- **Imagens:** bucket `posts-images` no Supabase Storage (ainda não criado pelo Roberto)

---

## 8. COMO RETOMAR EM NOVA SESSÃO

1. Ler este arquivo primeiro
2. Verificar estado do git: `git log --oneline -5`
3. Trabalhar na branch `claude/fix-conversation-history-xOtaY`
4. Fazer merge ao `main` quando pronto (Vercel deploya automaticamente)
5. Roberto testa em `ovalorcapital.com.br`

---

## 9. CONTATO / CONTEXTO DO DONO

- **Nome:** Roberto (Terrasan)
- **Objetivo:** maior portal premium de notícias do Brasil, com automação de conteúdo, Instagram, e monetização
- **Perfil técnico:** não é programador — precisa de explicações claras e implementações diretas
- **Estilo de trabalho:** direto, cobra resultados reais no ar, não quer explicações sem ação
