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

## 6. ✅ AUTOMAÇÃO DE INSTAGRAM PRA BRASIL ON — MOTOR CONSTRUÍDO (03/09/2026)

> Registrado em 27/08/2026, retomado e concluído em 03/09/2026. O motor
> de publicação (que faltava desde a fase de config/scaffolding do
> Codex) existe agora — ver estado real abaixo.

### ✅ Estado real confirmado em 03/09/2026 (não assumido — lido do código + testado)

- **Config/status/conta** — feito pelo Codex em 28-30/08/2026, inalterado:
  `action=instagram_status`, `action=instagram_config`,
  `action=instagram_account` (grava token/ig_user_id em `ig_accounts`,
  `username='obrasilon'` — mesma tabela do OVC, discriminada por
  username).
- **✅ Conta real já conectada** — confirmado com dado real (não
  suposição), via `action=instagram_status`: `ig_user_id:
  "17841468089936054"`, `token_configured: true`. Não precisou de
  nenhuma credencial nova.
- **✅ Imagem** — resolvida e confirmada visualmente em 03/09/2026 (ver
  detalhe abaixo). Full-bleed + caixa amarela + ícone, sem "layout"
  separado — o blocker `layoutReady`/`BON_IG_LAYOUT_READY` foi REMOVIDO
  de `instagramReadiness()`.
- **✅ Motor de publicação — construído em 03/09/2026:**
  - `brasilon/core/instagram.js` (novo) — client da Graph API v25.0,
    adaptado de `core/instagram.js` (raiz) pro caso de 1 conta só.
    `publish()` sempre inclui `collaborators: ["oterrasan"]` — pedido
    explícito de Roberto no mesmo dia, assim que a imagem foi aprovada:
    "os posts do brasil on, TODOS em collabs com o @oterrasan".
  - `brasilon/api/manage.js` — `_loadInstagram()`/`_loadInstagramImage()`
    (import DINÂMICO, nunca estático — mesma regra permanente do
    incidente de 31/08/2026 no OVC), `buildInstagramCaption()` (mesma
    lógica de extração de hashtags/corpo do OVC, adaptada — assinatura
    "BRASIL ON — {data}" em vez de "Redação OVC", hashtags temáticas
    próprias, CTA com link real via `buildArticleUrl()`), duas novas
    ações: `action=instagram_publish` (manual, escolhe 1 post) e
    `action=instagram_auto_publish` (cron).
  - **Anti-duplicata e contador diário — SEM migração de schema.**
    `brasilon_posts` não tem `metrics`/`ig_id` — em vez disso, tudo vive
    na tabela `config` (mesmo Supabase), padrão insert-only já
    comprovado no projeto (nunca `.upsert(...,{onConflict:"key"})` — a
    coluna `key` não tem constraint unique real): `BON_IG_POSTED__{id}`
    (1 linha por post, claim-antes-de-publicar + desfaz se falhar) e
    `BON_IG_AUTO_COUNT_{diaBRT}__{timestamp}_{rand}` (contador do dia,
    somado via `COUNT`, nunca lido+somado de 1 linha).
  - **Janela ativa 9h-12h e 14h-22h BRT, pausa de almoço 12h-14h**
    (ajustado 04/09/2026 — Roberto pediu 13h30 primeiro, corrigiu no
    mesmo dia pra 14h00 e deixou explícito que valia pras duas
    automações, OVC e Brasil ON — gate no próprio código, não só no
    cron — mesma lição do incidente do OVC de 02/09/2026, onde o
    scheduler do GitHub Actions disparou fora do range configurado).
    Cron do Vercel (`brasilon/vercel.json`) roda `*/15 * * * *` o dia
    inteiro DE PROPÓSITO (sem restringir hora no cron em si) — o gate
    real fica 100% no código (`_igAutoDentroDaJanelaAtiva()` em
    `brasilon/api/manage.js`).
    **⚠️ 04/09/2026 (mesmo dia, 3º ajuste) — DESSINCRONIZADO DO OVC DE
    PROPÓSITO:** Roberto pediu pra postergar só o OVC (retorno movido
    pra 15h00 lá) e deixar o Brasil ON liberado no horário que já
    estava. `brasilon/api/manage.js` **NÃO foi tocado nesta 3ª rodada**
    — Brasil ON continua retomando às **14h00**, diferente do OVC
    (15h00). Não assumir mais que as duas janelas são sempre iguais —
    conferir os dois arquivos (`api/manage.js` na raiz e
    `brasilon/api/manage.js`) antes de qualquer mudança futura de
    horário, e só voltar a sincronizá-los se Roberto pedir
    explicitamente.
  - **✅ LIGADO EM PRODUÇÃO (03/09/2026)** — Roberto: "pode ligar, deixa
    rodando. vamos ver qual é!". `config.enabled=true`, `dailyLimit:60`,
    `interval:15`, todas as 4 categorias. **Primeira publicação real
    confirmada com evidência da própria API** (não simulada): post "Piloto
    brasileiro desenha nome de Lito Sousa no céu do Texas", IG media id
    `18242911339311542`, comentário fixado publicado com sucesso (id
    `18021623927868051`, `first_comment_error: null`), hashtags reais
    geradas (`#LitoSousa #Aviacao #Texas #Brasil #DoencasRaras #Ciencia
    #PesquisaMedica #EstadosUnidos #Homenagem #BrasilOn`) — confirma a
    pergunta de Roberto "comentario e hashtags tambem devidamente
    preenchidas?" com dado real.

### 🔴 Bug real — "Redação OVC" vazando pro Brasil ON (03/09/2026, corrigido)

Descoberto em 2 camadas diferentes, mesma causa raiz:

1. **Na legenda do Instagram** — encontrado por mim, proativamente, no
   primeiro post real publicado (ver acima): o 1º parágrafo da legenda
   dizia "Redação OVC · 25 de agosto de 2026". Causa: `assinarBrasilOn()`
   (troca "Redação OVC"→"BRASIL ON") só roda em `handleSync()`, no
   momento da cópia — e só existe desde 26/08/2026. Toda matéria
   sincronizada ANTES dessa data ficou com o texto original pra sempre,
   já que o sync nunca reprocessa linha já copiada (dedup por
   `origem_post_id`). **Fix**: `buildInstagramCaption()` agora chama
   `assinarBrasilOn(post.conteudo)` defensivamente, no momento de montar
   a legenda — não depende mais de quando a linha foi sincronizada.
2. **No próprio site público** — Roberto descobriu sozinho, navegando o
   site ao vivo, e reportou com urgência: "BRASIL ON - NAO ASSINA REDACAO
   OVC CARALHO! CORRIJA NO SITE IMEDIATAMENTE É BRASIL ON". O fix da
   legenda (item 1) NÃO tocava o dado gravado — as páginas de artigo
   renderizam `brasilon_posts.conteudo` direto do banco. **Fix**: migração
   real no banco de produção (via `diag-once.yml`, já resetado ao
   placeholder depois) — varridas as 1.041 linhas de `brasilon_posts`,
   encontradas **164** ainda com "Redação OVC" no `conteudo`, todas
   corrigidas via `PATCH` individual pra "BRASIL ON". Confirmado por
   reconferência real pós-fix (segunda passada na tabela inteira): 0
   linhas residuais.

**Lição**: qualquer regra editorial "gravada" só no momento da
sincronização/geração (como `assinarBrasilOn()`) nunca corrige dado já
existente — se a regra mudar ou for criada depois, sempre checar se
precisa de um backfill retroativo além do fix pra frente.
- **Imagem — detalhe da spec fechada por Roberto:** "nao tem nada de
  arte. é a imagem inteira ocupando todo o card. o icone do brasil ON
  abaixo do titulo da manchete. manchete dentro de uma moldura amarela e
  fonte preta. acabeou. é isso". Implementado em
  `brasilon/core/instagram_image.js` — foto crua full-bleed (cover, sem
  banda/base como o OVC tem), caixa amarela sólida com a manchete em
  preto negrito (texto via sharp+Pango, fonte `Inter-Variable.ttf`
  copiada pra `brasilon/public/assets/fonts/` — zero dependência de
  fonte do SO), ícone `icone-brasil-on.svg` centralizado logo abaixo.
  Testado com dado real (post "Remo e Flamengo revivem no
  Mangueirão..."), resultado puxado de volta e inspecionado
  visualmente — bateu exatamente. `sharp` adicionado a
  `brasilon/package.json`.

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
4. **`.github/workflows/instagram-auto.yml`** — cron a cada 20min, **só
   do OVC** (não afeta o Brasil ON). Janela atual: ativo 9h-12h e
   15h-22h BRT, pausa 12h-15h (04/09/2026, 3 ajustes no mesmo dia:
   13h30 só OVC → 14h nas duas → 15h só OVC, postergado, Brasil ON ficou
   em 14h — ver o aviso de dessincronização acima). Antes de tudo isso,
   08h-22h sem pausa. Chama `ig_auto_publish`.
   Roteado via cron do GitHub Actions
   (não cron nativo da Vercel), com um gate redundante server-side em
   `api/manage.js` (`_igAutoDentroDaJanelaAtiva()`) — um bug real do
   scheduler do GitHub Actions já fez disparar fora da janela configurada
   uma vez, então o horário nunca deve depender só do cron externo.

### O que ainda falta decidir/construir pro motor (03/09/2026 — atualizado)

1. **Conta do Instagram** — já dá pra cadastrar via `action=instagram_account`
   (grava em `ig_accounts`, `username='obrasilon'`, mesma tabela do OVC,
   discriminada por username — não precisa de tabela nova). **Falta
   confirmar com Roberto se já foi cadastrada com token real** (pergunta 1
   acima).
2. **De onde vem o conteúdo:** publicar a partir de `brasilon_posts`, não
   de `posts` (tabela do OVC). Anti-duplicata: em vez de migração de schema
   (`ALTER TABLE brasilon_posts ADD COLUMN...`), preferir reaproveitar o
   padrão insert-only já comprovado nesse projeto pra tabela `config`
   (mesma usada pro orçamento diário do Gemini) — uma chave por post
   publicado, tipo `BON_IG_POSTED__{brasilon_posts.id}` — evita qualquer
   migração e evita o bug de `.upsert()` sem constraint já documentado.
3. **Overlay de imagem — RESOLVIDO** (ver acima, seção "Imagem").
4. **Escopo de categorias e limite diário/horário** — perguntado a
   Roberto em 03/09/2026, aguardando resposta (perguntas 2 e 3 acima).
5. **Onde vive o código:** dentro de `brasilon/api/manage.js` (mesmo
   padrão de isolamento — nunca importar de `core/`/`api/` da raiz) +
   `brasilon/core/instagram.js` (client da Graph API, adaptado do OVC,
   sem collaborators por padrão — perguntar se Roberto quer isso também)
   + cron nativo em `brasilon/vercel.json` (Pro permite granularidade de
   minuto, mesmo padrão já usado pelo `sync` — não precisa de workflow
   GitHub Actions separado, ao contrário do OVC que ainda usa Actions pro
   Instagram).

---

## 7. PENDÊNCIAS ATUAIS (atualizado 03/09/2026)

| # | Pendência | Quem |
|---|---|---|
| 1 | ~~Confirmar DNS de `obrasilon.com.br` propagado 100%~~ | ✅ Feito |
| 2 | ~~Automação de Instagram pro Brasil ON~~ — construída, LIGADA e publicando de verdade (ver seção 6). Corrigido também o bug de "Redação OVC" vazando (legenda + dado gravado no site, 164 linhas). Monitorar próximos ciclos do cron pra confirmar operação contínua | Claude monitora |
| 3 | Confirmar visualmente o ícone novo (`icone-brasil-on.svg`) depois do próximo deploy bem-sucedido | Roberto |
| 4 | Discutir mais definições de layout/design com Roberto (ele pediu que fosse a conversa seguinte depois do site estar 100% no ar) | Roberto |
| 5 | ~~Vincular `www.obrasilon.com.br` ao Google Search Console + submeter sitemap~~ | ✅ Feito (ver seção 8) |

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

---

## 8. GOOGLE SEARCH CONSOLE — VINCULADO E CONFIRMADO (02/09/2026)

Roberto pediu, com urgência ("RAPIDINHO... VOCE NAO FEZ ISSO AINDA"), pra
vincular `https://www.obrasilon.com.br` ao Google Search Console. Concluído
de ponta a ponta nesta sessão.

**Método usado — "Prefixo do URL" + "Arquivo HTML"** (não "Domínio"/DNS
TXT — a tentativa real de Roberto com verificação por domínio falhou:
"Não foi possível encontrar seu token de verificação nos registros TXT do
domínio". "Arquivo HTML" é mais rápido, não depende de propagação de DNS,
e fica inteiramente sob controle do Claude — só precisa commitar um
arquivo estático em `public/`).

**O que foi feito:**
1. Criado `brasilon/public/google2387e8258ddf2033.html` (conteúdo:
   `google-site-verification: google2387e8258ddf2033.html`), commit
   isolado (só esse arquivo).
2. PR #608 (squash `87a77a872065364d077a2d16ff9056ade31e62f9`) — mergeado,
   `deploy-brasilon.yml` disparou automaticamente (deploy 1m19s + sync
   12s, confirmado via `list_workflow_jobs`).
3. **Confirmado no ar com evidência real** (não assumido) — PR #609
   (squash `843d39c740ce4d650a921448ba0f175b60d24f8c`), `diag-once.yml`
   temporário com `curl` direto na URL de produção: `HTTP_CODE:200`, corpo
   idêntico ao commitado. PR #610 (squash
   `615ca0bcbf1a2f10351247eb3cee62e2208593ae`) resetou `diag-once.yml` de
   volta ao placeholder.
4. Roberto clicou em "Verificar" no Search Console → confirmado por print
   dele: "Propriedade verificada" (diálogo verde de sucesso).
5. Roberto submeteu `sitemap.xml` na aba Sitemaps → confirmado por print
   final: Status **"Processado"** (verde), **"861" páginas encontradas**,
   "0" vídeos encontrados.
6. Roberto perguntou explicitamente, antes de considerar encerrado: "tudo
   certo, mesmo? nao quero problemas neste site" — respondido com a
   garantia técnica de que o Search Console **só lê** dados públicos do
   site (nunca escreve/altera nada nele), e que a única mudança de código
   foi 1 arquivo estático isolado, já revisado linha a linha antes do
   commit — zero risco real à estabilidade ou à indexação do site.

**Não é necessária nenhuma ação futura sobre isso** — o arquivo de
verificação deve permanecer no repo indefinidamente (é assim que o Google
mantém a verificação válida; removê-lo poderia invalidar a propriedade no
Search Console).
