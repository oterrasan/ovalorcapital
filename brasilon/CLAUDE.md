# CLAUDE.md — Brasil ON (portal separado)

> Este arquivo documenta EXCLUSIVAMENTE o portal Brasil ON. Desde 27/08/2026,
> por pedido explícito de Roberto ("separa bem o projeto do brasil on"),
> toda documentação nova do Brasil ON vai AQUI, não mais no CLAUDE.md
> gigante da raiz (que já passou de 600KB e é só sobre o OVC). Leia este
> arquivo inteiro antes de mexer em qualquer coisa dentro de `brasilon/`.
>
> O CLAUDE.md da raiz do repo ainda tem o histórico de criação do Brasil ON
> (sessão de 25/08/2026 em diante) — não precisa reler aquilo, está resumido
> aqui de forma atualizada e organizada.

---

## 1. O QUE É O BRASIL ON

Segundo portal do **Grupo Terrasan** (mesmo grupo do O Valor Capital), com
identidade e propósito diferentes: Roberto descreveu como "a divisão
POPULAR de notícias do OVC" — cobertura mais direta, popular, sem o tom
institucional/premium do OVC.

- **URL produção:** https://www.obrasilon.com.br (e https://obrasilon.com.br)
- **Dono:** Roberto Cesar Terrasan (mesmo do OVC)
- **Instagram:** @obrasilon (mencionado no JSON-LD do site — confirmar com
  Roberto se a conta já existe/está ativa antes de qualquer automação)
- **Repositório:** MESMO repo do OVC (`oterrasan/ovalorcapital`), vive
  inteiramente dentro da pasta `brasilon/` — não é um repo separado (a
  integração GitHub desta sessão não tinha permissão `repo:create`, então
  a solução foi um monorepo com "Root Directory: brasilon" na Vercel)
- **Projeto Vercel:** `brasilon` (conta roberto-terrasans-projects) — projeto
  **separado** dos 3 projetos do OVC (`ovalorcapital`, `ovalorcapital-hubx`,
  `ovalorcapital-xuhw`). Cota de deploy diário da Vercel (100/dia, Hobby)
  é **independente** da cota do OVC — mas na prática parece que os dois
  compartilham o mesmo teto por conta/dia (ver seção 5).
- **Supabase:** MESMO banco do OVC (`yntwvfcxjardzafdqanj`), mesma chave —
  não é um banco separado. Os dados do Brasil ON vivem numa tabela própria
  (`brasilon_posts`), alimentada por sincronização (não geração própria).

---

## 2. ARQUITETURA — COMO O CONTEÚDO CHEGA NO BRASIL ON

**Brasil ON não gera conteúdo próprio.** Ele **reposta** automaticamente
matérias que o pipeline do OVC já gerou, filtradas por categoria:

```
Pipeline do OVC gera matéria → salva em `posts` (banco do OVC)
        ↓
Job "brasilon_sync" (pipeline-cron.yml, a cada 20min) chama:
  POST https://www.obrasilon.com.br/api/manage?action=sync&pass=...
        ↓
brasilon/api/manage.js handleSync() busca posts recentes do OVC,
classifica em 4 categorias (ver abaixo), copia pra `brasilon_posts`
(vinculado por `origem_post_id`, com índice UNIQUE — nunca duplica)
        ↓
brasilon/api/*.js servem esse conteúdo já classificado no site
```

### As 4 categorias do Brasil ON (fechado em 27/08/2026, PR #519)

| Categoria | Como é classificada |
|---|---|
| `politica` | Post do OVC já vem com a tag `politica` — sincroniza direto |
| `policia` | Recorte de `brasil-on` do OVC, separado por palavra-chave de crime/polícia no título+meta descrição (o OVC não tem subcategoria estruturada de "polícia" — cai tudo em Cotidiano/Geral) |
| `brasil-on` | Geral/notícias — tudo do OVC que não é política/polícia/futebol |
| `futebol` | Post do OVC com tag `esportes` E subcategoria/palavra-chave de futebol |

Classificação é **regra fixa em código**, não gasta cota de IA nenhuma —
`classificar()` em `brasilon/api/manage.js`.

### Mapa de arquivos

```
brasilon/
├── api/
│   ├── article.js       SSR de artigo (JSON-LD NewsArticle, SEO completo)
│   ├── category.js      SSR de categoria (só as 4 acima)
│   ├── manage.js         action=sync (copia posts do OVC) + action=status
│   ├── portal-posts.js  feed JSON + handleMaisLidas() (ranking por views
│   │                    reais, usando metrics.views do post ORIGINAL do
│   │                    OVC via origem_post_id — brasilon_posts não tem
│   │                    coluna de views própria)
│   └── sitemap.js        sitemap.xml dinâmico
├── public/
│   ├── index.html + /brasil-on/ /politica/ /policia/ /futebol/  (páginas)
│   ├── /contato/ /quem-somos/ /politica-editorial/ /privacidade/
│   │   /termos-de-uso/  (institucionais)
│   ├── assets/
│   │   ├── og-brasilon.png       imagem de compartilhamento própria
│   │   └── icone-brasil-on.svg   ícone da marca (ver seção 4)
│   └── js/
│       ├── home.js, category.js, article.js   (client-side, próprios)
│       ├── blocks.js    motor de disposição de cards — 8 formatos (T1-T8),
│       │                nunca repete o mesmo 2x seguidas, usado por home
│       │                E category (todo o site)
│       ├── mais-lidas.js   widget [data-bon-w-maislidas], sem número de
│       │                   leituras exibido (mesma decisão do OVC)
│       ├── widgets.js   4 IIFEs independentes na home: clima (27 capitais,
│       │                Open-Meteo grátis), eleições 2026 (contagem
│       │                regressiva + manchetes), fofoca (manchetes
│       │                filtradas), horóscopo (client-side puro,
│       │                entretenimento, sem rede)
│       └── site.js      tema claro/escuro (alternador + localStorage)
└── vercel.json           rotas de categoria/artigo (SEM cron nativo —
                           ver seção 5, isso quebraria o plano Hobby)
```

**Zero import cruzado com `core/`/`api/` do OVC** — tudo autocontido dentro
de `brasilon/`, mesmo que duplique lógica pequena (ex: `slugify()`). Isso é
deliberado: os dois projetos rodam como deploys Vercel INDEPENDENTES
(Root Directory diferente), então qualquer import de fora de `brasilon/`
arriscaria quebrar o bundling.

---

## 3. DEPLOY — COMO FUNCIONA (ATUALIZADO 27/08/2026)

Até 27/08/2026, todo deploy do Brasil ON era manual: uma sessão do Claude
escrevia um workflow one-off em `.github/workflows/diag-once.yml` chamando
`vercel --token=... --scope=... --yes --prod` dentro de `brasilon/`, dava
push, conferia o log, e resetava o workflow — repetido dezenas de vezes ao
longo do dia (ver histórico completo no CLAUDE.md da raiz, sessões de
25-27/08/2026).

**A partir de 27/08/2026, isso foi automatizado — Roberto pediu
explicitamente pra não depender mais de sessão manual pra isso:**

- `.github/workflows/deploy-brasilon.yml` (permanente, não é mais one-off):
  dispara sozinho em **qualquer push a `main` que toque `brasilon/**`**, e
  também pode ser disparado manualmente via `workflow_dispatch` (GitHub
  Actions → Deploy Brasil ON → Run workflow).
- Depois do deploy, dispara um sync automático (`action=sync`) pra já
  puxar conteúdo novo pro `brasilon_posts` sem esperar o próximo ciclo do
  cron de 20min.

**NUNCA mais criar um workflow one-off em `diag-once.yml` só pra fazer
deploy do Brasil ON** — use `deploy-brasilon.yml` (push automático ou
`workflow_dispatch`). `diag-once.yml` continua existindo só pra
DIAGNÓSTICO de verdade (checar algo, rodar um teste), nunca deploy.

---

## 4. IDENTIDADE VISUAL

- **Cores:** paleta da bandeira do Brasil (verde/amarelo/azul), fundo
  branco por padrão com alternador de tema escuro (botão 🌙/☀️ no topo,
  persistido em localStorage)
- **Ícone da marca** (`public/assets/icone-brasil-on.svg`, criado
  27/08/2026): círculo com anel amarelo, disco azul, "BRASIL" (fino) +
  "ON" (bold) em branco. Recriado a partir da arte real que Roberto
  mandou — SEM o fundo escuro que vinha na arte original (pedido
  explícito dele: "nao coloca isso com esse fundo escuro no meio do
  portal branco... deixa do o icone e o nome é branco dentro do azul").
  Se Roberto mandar uma versão vetorial/arquivo real da logo no futuro,
  substituir este SVG mantendo layout+cores.
- **Rodapé:** faixa da bandeira + wordmark "BRASIL ON" grande + coluna
  "Grupo Terrasan" + frase explícita ligando os dois portais ao grupo.

---

## 5. LIMITES CONHECIDOS E ARMADILHAS

```
✅ 30/08/2026 — conta virou Vercel PRO. O sync AGORA roda via cron nativo
   da própria Vercel (`brasilon/vercel.json`, `crons: [...]`, */20min) —
   Pro permite intervalo mínimo de 1min (Hobby só permitia 1x/dia, por
   isso o sync vivia como workaround no GitHub Actions). O job
   `brasilon_sync` foi removido de `.github/workflows/pipeline-cron.yml`
   (esse arquivo não dispara mais nada por schedule — só workflow_dispatch
   manual). Handler (`brasilon/api/manage.js`) não precisou de nenhuma
   mudança — já lia `action`/`pass` via `req.query`, funciona igual pra
   GET (cron) e POST (chamada manual antiga).
❌ Cron nativo da Vercel é SEMPRE UTC, mesmo no Pro — não existe opção de
   timezone (confirmado 30/08/2026 via busca real, não suposição). Se
   algum dia um horário específico em BRT importar pro sync, calcular o
   offset UTC-3 na hora de escrever o `schedule`, igual já é feito em
   outras partes do projeto (`_igAutoDiaBRT()`, `janelaOk()` no OVC).
❌ NUNCA esquecer package.json próprio dentro de brasilon/ — já causou um
   incidente real (Bug: FUNCTION_INVOCATION_FAILED 500 em todas as
   functions que importavam @supabase/supabase-js, porque o projeto
   Vercel `brasilon` nunca instalava essa dependência sem um
   package.json próprio na pasta).
❌ A cota diária de deploy da Vercel (100/dia, plano Hobby) parece ser
   POR CONTA, não por projeto — no dia 26-27/08/2026, deploys do OVC E
   do Brasil ON falharam juntos com o mesmo erro
   "api-deployments-free-per-day" repetidamente. Ver seção 3 do CLAUDE.md
   da raiz (histórico completo do dia) — sempre que um estiver bloqueado,
   assumir que o outro também está.
❌ Nunca importar código de `core/`/`api/` do OVC dentro de `brasilon/` —
   os dois são deploys Vercel completamente independentes.
```

---

## 6. 🔴 PRÓXIMO PASSO — AUTOMAÇÃO DE INSTAGRAM PRA BRASIL ON (Codex)

> Registrado em 27/08/2026 por pedido explícito de Roberto: "proximo apsso
> e o codex construir o mesmo mecanismo pro brasil on, automacao de
> instagram". Ainda NÃO implementado — este é o brief pra quem for
> construir isso (Codex, ou uma sessão futura do Claude).

### O que já existe no OVC — o "mesmo mecanismo" a replicar

O OVC tem, desde 27/08/2026, publicação automática no Instagram
totalmente funcional (código em `core/instagram.js`, `core/instagram_image.js`
e `api/manage.js` na raiz do repo — **não** dentro de `brasilon/`):

1. **`core/instagram.js`** — client da Graph API v25.0: `publish()` (cria
   container + publica), `postComment()` (comentário fixado), `likeMedia()`
   (self-like), `getContentPublishingLimit()` (checa a cota real do
   Instagram antes de postar — ~100/dia por conta Business, imposta pelo
   próprio Instagram, não pelo nosso código).
2. **`core/instagram_image.js`** — baixa a imagem original da matéria,
   compõe com um overlay de marca (`public/assets/ig-overlay-ovc-canva.png`
   no caso do OVC) + headline em SVG com destaque automático de "palavra de
   impacto", sobe pro Supabase Storage.
3. **`api/manage.js`**:
   - `buildInstagramCaption(post)` — monta a legenda (título + resumo +
     hashtags + assinatura + **link de volta pra matéria no portal**,
     sempre no final).
   - `buildInstagramFirstComment(post)` — comentário fixado a partir do
     campo "comentário fixado" da matéria.
   - `handleIgPublish` — ação manual (`action=ig_publish`), publica 1 post
     específico escolhido no admin.
   - `handleIgAutoPublish` — ação automática (`action=ig_auto_publish`),
     escolhe sozinha o próximo post elegível (mais antigo ainda sem
     `metrics.instagram.ig_id` gravado — esse carimbo é o que impede
     duplicar, permanentemente), publica, e registra o carimbo. Limite
     diário controlado via tabela `config` (padrão insert-only + chave
     única por chamada, sem `.upsert()` — evita bug de concorrência já
     documentado no projeto).
4. **`.github/workflows/instagram-auto.yml`** — cron a cada ~10min, 07h–
   00h BRT, chama `ig_auto_publish`.

### O que precisa ser decidido/construído pro Brasil ON (perguntas em aberto — não assumir)

1. **Conta do Instagram:** o Brasil ON precisa da própria conta Business
   do Instagram conectada (token de acesso, `ig_account_id` etc.) — **não**
   pode usar a mesma conta/token do @ovalorcapital. Confirmar com Roberto
   se @obrasilon já existe e já está configurada como conta Business
   vinculada a uma Página do Facebook (pré-requisito da Graph API).
2. **Onde salvar o token/conta:** o OVC usa uma tabela `ig_accounts` no
   Supabase. Pro Brasil ON, avaliar se cria uma tabela própria
   (`brasilon_ig_accounts`) ou reaproveita a mesma `ig_accounts` com uma
   coluna discriminando o portal — evitar misturar posts do OVC com posts
   do Brasil ON na mesma lógica de seleção de conta.
3. **De onde vem o conteúdo:** publicar a partir de `brasilon_posts` (a
   tabela própria do Brasil ON), não de `posts` (tabela do OVC) — o
   carimbo anti-duplicata deve ser gravado em `brasilon_posts`, campo
   próprio (a tabela hoje não tem uma coluna `metrics`/`ig_id` — precisa
   de migração leve, `ALTER TABLE brasilon_posts ADD COLUMN metrics jsonb`
   ou equivalente).
4. **Overlay de imagem:** o Brasil ON precisa de um overlay de marca
   PRÓPRIO (não reaproveitar `ig-overlay-ovc-canva.png`, que é do OVC) —
   usar a identidade visual da seção 4 (verde/amarelo/azul, ícone novo).
   Pedir a Roberto se ele tem uma arte de overlay pronta, ou construir uma
   nova seguindo o mesmo padrão do OVC (headline + destaque automático).
5. **Escopo de categorias:** o Brasil ON só tem 4 categorias (política,
   polícia, brasil-on, futebol) — perguntar a Roberto se TODAS entram na
   automação ou se ele quer excluir alguma.
6. **Limite diário e horário:** perguntar a Roberto o número (o OVC usa
   100/dia, 07h–00h BRT, ~10min de intervalo) — não assumir que é igual.
7. **Onde vive o código:** dentro de `brasilon/api/manage.js` (mesmo
   padrão de isolamento do resto do projeto — nunca importar de `core/`ou
   `api/` da raiz) + um workflow próprio
   `.github/workflows/instagram-auto-brasilon.yml` (nome sugerido, evitar
   colidir com o `instagram-auto.yml` do OVC).

### Por que registrar isso aqui em vez de já implementar

Cada um dos 7 pontos acima é uma decisão de produto/infra que só Roberto
pode confirmar (conta do Instagram, overlay, limite diário) — implementar
sem essas respostas arriscaria construir a coisa errada e ter que refazer.
Este brief existe pra quem for construir (Codex ou sessão futura) começar
já sabendo exatamente o que perguntar e qual padrão replicar, sem precisar
reler o dia inteiro de histórico do CLAUDE.md da raiz.

---

## 7. PENDÊNCIAS ATUAIS (27/08/2026)

| # | Pendência | Quem |
|---|---|---|
| 1 | Confirmar DNS de `obrasilon.com.br` propagado 100% (já confirmado resolvendo pra Vercel, HTTP 200 — ver CLAUDE.md raiz) | Feito, monitorar |
| 2 | Automação de Instagram pro Brasil ON — ver seção 6 (bloqueado em decisões de Roberto) | Codex / próxima sessão |
| 3 | Confirmar visualmente o ícone novo (`icone-brasil-on.svg`) depois do próximo deploy bem-sucedido | Roberto |
| 4 | Discutir mais definições de layout/design com Roberto (ele pediu que fosse a conversa seguinte depois do site estar 100% no ar) | Roberto |

---

### Nota técnica (27/08/2026) — `workflow_dispatch` não é disparável via API nesta sessão

A tentativa de retry automático via `mcp__github__actions_run_trigger`
(`run_workflow`) bateu em `403 Resource not accessible by integration` —
a integração GitHub usada por esta sessão não tem permissão pra disparar
`workflow_dispatch` em nenhum dos dois workflows de deploy (mesma
limitação já documentada em outras sessões deste projeto pra outros
workflows). **Retry automático de verdade precisa ser via push real a
`main`** (qualquer commit dispara `deploy.yml`; um commit que toque
`brasilon/**` dispara `deploy-brasilon.yml` também) — não via
`workflow_dispatch`. A rotina agendada de retry foi ajustada pra isso.

### Bug real corrigido (27/08/2026) — `--scope` inválido em `deploy-brasilon.yml`

O workflow `deploy-brasilon.yml`, na primeira versão, incluía
`--scope="${{ secrets.VERCEL_ORG_ID }}"` no comando de deploy. Log real
confirmou o erro: `Error: You cannot set your Personal Account as the
scope.` — a conta Vercel usada aqui é pessoal, não de time, e `--scope`
só se aplica a contas de time. O comando correto (o mesmo usado com
sucesso o dia inteiro via `diag-once.yml` antes deste workflow existir)
nunca teve `--scope`: `vercel --token="..." --yes --prod`. Corrigido.
Se um dia a Vercel migrar pra uma conta de time, revisitar isso.

### Marcador `brasilon/.deploy-trigger` (27/08/2026)

Arquivo criado só pra ter um jeito confiável de forçar um novo push que
toque `brasilon/**` (dispara `deploy-brasilon.yml`) sem precisar de uma
mudança de código real toda vez que a cota da Vercel travar. A rotina
automática de retry atualiza a linha `last_retry_utc` dele e comita —
**não apagar**, é usado enquanto a cota da Vercel estiver instável.
