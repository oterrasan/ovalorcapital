# CLAUDE.md — OPMED (portal separado)

> Este arquivo documenta EXCLUSIVAMENTE o portal OPMED. Igual foi feito com
> o Brasil ON ("separa bem o projeto"), toda documentação nova do OPMED vai
> AQUI, não no CLAUDE.md gigante da raiz (que é sobre o OVC) nem no
> `brasilon/CLAUDE.md` (que é sobre o Brasil ON). Leia este arquivo inteiro
> antes de mexer em qualquer coisa dentro de `opmed/`.
>
> Para o histórico de criação (05/09/2026), ver o CLAUDE.md da raiz —
> sessão "05/09/2026" onde o Roberto pediu o portal.

---

## 1. O QUE É O OPMED

Terceiro portal do **Grupo Terrasan** (mesmo grupo do O Valor Capital e do
Brasil ON), com propósito próprio: **notícias e informações sobre saúde,
medicina, odontologia, ciência e bem-estar**. Roberto foi explícito: **é
um portal de notícias — nunca de receita médica, conselho clínico ou
prescrição.**

- **Nome:** OPMED (provisório — reaproveita a conta @opmedbrasil, já
  ativa no Instagram: 1.720 seguidores, bio "OPMED — O Portal do Médico",
  "ESTRÉIA DIA 20.09.2026", curadoria @oterrasan)
- **Domínio:** AINDA NÃO COMPRADO (05/09/2026) — Roberto disse
  explicitamente "eu vou comprar o dominio ainda". Não travar nada
  esperando isso — construir com URL provisória e trocar depois.
- **Dono:** Roberto Cesar Terrasan (mesmo do OVC e do Brasil ON)
- **Instagram:** @opmedbrasil (já existe e está ativo — diferente do
  Brasil ON, que teve que nascer do zero no Instagram)
- **Repositório:** MESMO repo do OVC (`oterrasan/ovalorcapital`), vive
  inteiramente dentro da pasta `opmed/` — mesma arquitetura de monorepo já
  usada pelo Brasil ON (a integração GitHub desta sessão não tem permissão
  `repo:create`, então repo separado nunca foi opção)
- **Projeto Vercel:** AINDA NÃO CRIADO. Quando for a hora, replicar
  exatamente o padrão do Brasil ON: projeto próprio com "Root Directory:
  opmed", **separado** dos projetos do OVC e do Brasil ON
- **Supabase:** ainda não decidido se reaproveita o mesmo banco do OVC
  (like Brasil ON faz, numa tabela própria) ou tem banco/projeto próprio —
  conversar com Roberto quando chegar a hora do backend

---

## 2. PEDIDO ORIGINAL DE ROBERTO (05/09/2026) — arquitetura visual

> "voce vai pegar exatamente o codigo dos rails, topo e rodape do ovc e
> emendar no codigo do brasilON de todo o milogo, com estes cards todos
> organizados de maneira diferente" — depois esclarecido: "claro, que nao
> querom remendo, foi apenas uma maneira de falar pra voce entender"

Ou seja: **não é código colado/gambiarra** — é o mesmo esqueleto do OVC e
do Brasil ON reescrito limpo, em CSS/JS próprios do OPMED:

- **Topo + Rails + Rodapé** — estrutura/classes portadas de
  `public/css/home.css` do OVC: `.header-topbar`+ticker,
  `.header-identity` (logo/busca/ações), `.header-menu-bar`+`.supermenu`,
  grid `.main-grid`/`.rail-left`/`.rail-right`/`.hero-region`/`.cols-region`,
  e o `.footer` completo.
- **Miolo (motor de cards)** — portado de `brasilon/public/js/blocks.js`:
  8 formatos de card que nunca repetem seguidos (trio, grade miniúscula,
  assimétrico, lista com thumb, dupla grande, spotlight escuro, caixa de
  destaque sem foto, dupla escalonada). Classes `bon-*` do Brasil ON
  renomeadas para `op-*` no OPMED.

### 🚨 Regra confirmada por Roberto (05/09/2026) — rails com conteúdo real

> "voce compreendeu que é um portal e nao um simples site? ou seja, existem
> conteudos nos rails?"

Os rails NUNCA podem ter caixa vazia/"Em construção" — sempre conteúdo
real. A primeira versão do scaffold errou nisso (2 widgets ficaram
"Em construção" esperando decisão de fonte externa) — corrigido no mesmo
dia: os 2 widgets viraram filtros dos PRÓPRIOS posts do portal por
categoria (mesmo mecanismo que o rail "Futebol" do Brasil ON usa em
`home.js` — filtra os posts já carregados, sem chamada de rede extra), e
cada bloco só aparece se tiver conteúdo de verdade (nunca deixa espaço
vazio — mesma regra do OVC pros nichos).

**Se no futuro Roberto quiser widgets "ao vivo" mais robustos** (tipo o
Radar Eleitoral/Radar do Esporte/Pulso BR do OVC — dado externo, não só
filtro de categoria), isso depende de decidir uma fonte de dado externa
antes — não assumir nem inventar dado, perguntar primeiro.

---

## 3. MAPA DE ARQUIVOS (estado em 05/09/2026 — scaffold inicial)

```
opmed/
├── package.json          (mesmas dependências do brasilon: supabase-js, sharp)
├── CLAUDE.md             (este arquivo)
└── public/
    ├── index.html        homepage — topo/rails/rodapé do OVC + miolo do Brasil ON
    ├── css/
    │   └── site.css      paleta própria (teal/saúde), classes portadas do OVC+Brasil ON
    └── js/
        ├── site.js       ticker/tema/menu — adaptado de brasilon/public/js/site.js
        ├── blocks.js     motor de 8 formatos de card — portado de blocks.js do Brasil ON
        └── home.js       carrega hero+miolo+rails via fetch /api/portal-posts
```

**Ainda NÃO existe:** `opmed/api/` (backend), fontes RSS, tabela Supabase
própria, `opmed/vercel.json`, projeto Vercel, domínio.

**Zero import cruzado com `core/`/`api/` da raiz nem com `brasilon/`** —
mesma regra do Brasil ON: tudo autocontido dentro de `opmed/`, mesmo que
duplique lógica pequena.

---

## 4. IDENTIDADE VISUAL (placeholder — 05/09/2026)

⚠️ **Tudo abaixo é ponto de partida, não está fechado com Roberto:**

- **Nome:** OPMED
- **Cor de destaque:** teal (`#14b8a6`/`#0d9488` — reaproveita
  `--cat-saude` que já existe no design system do OVC)
- **Categorias:** as 5 categorias soltas do scaffold inicial foram
  **substituídas em 06/09/2026** por uma taxonomia completa de 6
  macro-editorias com subcategorias, escrita e entregue por Roberto —
  ver seção 8 pro mapa completo (nome/slug/subcats de cada uma)
- **Ticker do topo:** no OVC mostra cotação financeira (ibov, dólar...) —
  não faz sentido aqui. Deixado como contador genérico ("Casos
  monitorados hoje") até Roberto decidir o que mostrar de verdade

---

## 5. PENDÊNCIAS (05/09/2026)

| # | Pendência | Quem |
|---|---|---|
| 1 | Comprar domínio | Roberto ("eu vou comprar o dominio ainda") |
| 2 | Confirmar nome definitivo (OPMED ou outro) | Roberto |
| 3 | ~~Confirmar/expandir as 5 categorias~~ — **RESOLVIDO 06/09/2026**, ver seção 8 | — |
| 4 | Confirmar paleta de cor definitiva | Roberto |
| 5 | Decidir conteúdo real do ticker/contador do topo | Roberto |
| 6 | Backend (`api/`), fontes RSS de saúde confiáveis, tabela Supabase | Claude, quando Roberto autorizar — pesquisa inicial de fontes já feita numa sessão anterior (Agência Fiocruz, Ministério da Saúde/Gov.br, BVS-MS — todas institucionais, baixo risco) |
| 7 | Criar projeto Vercel próprio (Root Directory: opmed) | Claude, só depois que o resto acima estiver mais definido |
| 8 | Widgets "ao vivo" mais robustos no rail (equivalente ao Radar Eleitoral/Radar do Esporte/Pulso BR do OVC) | Roberto decide a fonte de dado antes |

---

## 6. ONDE ESTÁ O CÓDIGO AGORA

PR #661 (`oterrasan/ovalorcapital`, branch `feat/opmed-scaffold`) —
**draft**, não mergeado em `main`. Nada disso está em produção real — é só
código guardado no GitHub esperando as decisões da seção 5.

### ✅ Ambiente de teste ao vivo (05/09/2026)

A pedido de Roberto ("COLOCA NO AR em um ambiente de teste no vercel, pra
eu ir vendo e me mostra"), foi criado um projeto Vercel novo e separado
(`roberto-terrasans-projects/opmed`) só pra visualização — **não é
produção real, é só um preview pra Roberto avaliar o layout**.

**URL estável:** https://opmed-teal.vercel.app

Mostra o layout completo (topo+rails+rodapé do OVC + miolo do Brasil ON)
com **dados de exemplo (mock)**, já que ainda não existe backend/`api/`
próprio — a página busca `/api/portal-posts` (que não existe ainda em
`opmed/`), recebe erro, e cai automaticamente num fallback de 22 posts
fictícios cobrindo as 5 categorias, com um banner amarelo fixo no topo
avisando "⚠️ DADOS DE EXEMPLO — o OPMED ainda não tem backend/matérias
reais" — nunca finge que é dado real. Esse fallback (`MOCK_POSTS` em
`opmed/public/js/home.js`) é temporário e deve ser removido assim que o
backend de verdade existir.

**Como atualizar esse ambiente de teste** (o mesmo padrão de deploy manual
usado pelo Brasil ON antes de `deploy-brasilon.yml` existir — aqui ainda
não vale a pena automatizar, é só um preview de avaliação, não produção):
escrever um script one-off em `.github/workflows/diag-once.yml` que roda
`vercel --token="${{ secrets.VERCEL_TOKEN }}" --yes --prod` dentro de
`opmed/` (checkout da branch `feat/opmed-scaffold`), commitar, abrir PR,
mergear, conferir o log, e resetar `diag-once.yml` ao placeholder.

**⚠️ Lição real desta sessão — sempre usar `--prod`:** rodar o comando
SEM `--prod` cria um preview novo com URL aleatória
(`opmed-xxxxxxxxx-roberto-terrasans-projects.vercel.app`) e NÃO atualiza
`opmed-teal.vercel.app` — a primeira vez só virou produção porque foi o
primeiro deploy do projeto (qualquer primeiro deploy vira produção
automaticamente, mesmo sem `--prod`). Todo redeploy seguinte precisa do
`--prod` explícito pra continuar atualizando essa mesma URL estável que
Roberto já tem em mãos.

---

## 7. IMAGENS REAIS NOS CARDS MOCK (06/09/2026)

### Pedido de Roberto

Depois de ver o layout pela primeira vez, Roberto pediu (com bastante
ênfase) fotos reais e temáticas em todos os cards, não emoji nem imagem
aleatória:

> "coloca imagens em todos os cards e informacoes da saude pra eu ver ne?
> [...] e coloca imagens que remetam, imagens reais, nao emogis ou coisas
> aleatorias"

As imagens originais eram todas `picsum.photos` (fotos de banco de
imagens genéricas, aleatórias, sem nenhuma relação com saúde) — ou campo
`imagem` vazio em vários posts.

### Fonte usada: Wikimedia Commons (grátis, sem chave de API)

Buscas via `action=query&generator=search&gsrsearch=<termo>+filetype:bitmap`,
filtrando por `mime` (`image/jpeg`/`image/png` — nunca vetor/SVG) e por
`LicenseShortName` (precisa conter "public domain", "cc0", "pd" ou
"cc-by"). **Isso sozinho NÃO é suficiente** — ver as 3 rodadas de erro
reais abaixo.

### 🚨 3 rodadas de erro real, até acertar — lição pra qualquer busca futura de imagem

**Rodada 1** (busca simples + filtro de licença só): pegou uma gravura
histórica (odontologia), um sadhu de arquivo sem camisa (bem-estar), foto
de ginásio do Exército americano (bem-estar) e uma foto com uniforme
militar/"Guantanamo Bay" (saúde pública) — real, mas fora de contexto pra
um portal de saúde civil brasileiro.

**Rodada 2** (adicionado blocklist de palavras no título — military, army,
navy, guantanamo, wellcome etc.): resolveu odontologia e saúde pública, mas
bem-estar continuou errado — uma foto de arquivo de 1917 numa fábrica de
aviões (bateu por coincidência léxica com "stretching") e um infográfico
gráfico "WORKOUT at HOME" (não é fotografia).

**Rodada 3** (blocklist bem maior — nara/archive/aviation/infographic/
poster/chart/diagram/vector/cartoon/illustration/banner/logo/1917/1918 —
E MUDANÇA DE ESTRATÉGIA: baixar 3 candidatos por vaga sem escolher
automaticamente, pra revisão visual manual antes de decidir): finalmente
resolveu — yoga real numa trilha de montanha (bem-estar-1) e corrida real
num parque (bem-estar-2).

**🚨🚨🚨 REGRA PERMANENTE — nunca confiar só em filtro automático:**
```
❌ "bateu no termo de busca + licença Public Domain + mime correto" NÃO é
   prova de que uma imagem do Wikimedia Commons é o que ela diz ser —
   pode ser gravura histórica, arquivo militar, infográfico, ou conteúdo
   real mas fora de contexto (ex: uniforme militar americano num portal
   de saúde civil brasileiro).
✅ SEMPRE inspecionar visualmente cada imagem via a ferramenta Read (que
   renderiza imagem) antes de usá-la em qualquer card ou reportar
   "concluído" pro Roberto — principalmente quando ele pede "imagens
   reais" de forma explícita.
✅ Quando a 1ª tentativa automática errar 2x seguidas pra uma mesma vaga,
   trocar de estratégia: baixar 2-3 candidatos SEM escolher sozinho, e
   revisar visualmente antes de decidir — evita uma 3ª/4ª rodada de
   suposição errada.
```

### Estado final das imagens (06/09/2026) — `opmed/public/assets/mock/`

| Categoria | Arquivos | Origem |
|---|---|---|
| `medicina` | `medicina-{1,2,3}.webp` | Reaproveitadas de `public/img/banners/medico-paciente-{1,2,3}.webp` do OVC (já verificadas antes) |
| `odontologia` | `odontologia-{1,2}.jpg` | Wikimedia Commons, fotos reais de clínica odontológica |
| `bem-estar` | `bemestar-{1,2}.jpg` | Wikimedia Commons — yoga em trilha de montanha / corrida em parque |
| `ciencia` | `ciencia-{1,2}.jpg` | Wikimedia Commons, fotos reais de laboratório |
| `saude-publica` | `saudepublica-{1,2}.jpg` | Wikimedia Commons, fotos reais de vacinação/atendimento |

`home.js`'s `MOCK_POSTS` — os 22 posts fictícios (nota: a categoria usada
no dado é `"saude-publica"`, hifenizada; os arquivos de imagem usam o
prefixo `saudepublica`, sem hífen — não confundir os dois) — agora têm
`imagem` sempre apontando pra um desses arquivos locais (rotação entre as
imagens disponíveis daquela categoria), nunca mais `picsum.photos` nem
campo vazio.

**Redeploy confirmado**: `https://opmed-teal.vercel.app` já reflete essas
imagens (run `34001065068`, log confirma `▲ Aliased
https://opmed-teal.vercel.app`).

### 🔧 Pendência pra próxima sessão

Roberto ainda não viu/aprovou este resultado — reportar em português e
aguardar feedback antes de qualquer novo ajuste visual.

---

## 8. TAXONOMIA DE 6 MACRO-EDITORIAS (definida por Roberto, 06/09/2026)

### Pedido de Roberto

Roberto rejeitou o layout inicial: "melhorou bastante, mas ainda está meio
bagunçado... nao gera muita credibilidade... fontes esquisitas, meio
desordenado, nao tem um menu, categorias, etc." — e entregou uma
arquitetura de conteúdo completa e escrita por ele, com 6 macro-editorias,
suas subcategorias, e uma "barra de serviços" fixa. Isso **substitui por
completo** a taxonomia placeholder de 5 categorias soltas do scaffold
inicial (seção 4).

### As 6 macro-editorias (slug → subcategorias → slug)

| Macro (slug) | Subcategorias (label → slug) |
|---|---|
| **Mercado, Negócios & Gestão** (`mercado-negocios`) | Planos de Saúde & Saúde Suplementar → `planos-de-saude` · Hospitais & Clínicas → `hospitais-clinicas` · Laboratórios & Diagnóstico → `laboratorios-diagnostico` · Indústria Farmacêutica & Insumos → `industria-farmaceutica` · Regulação & Compliance → `regulacao-compliance` |
| **Prática Clínica & Especialidades** (`pratica-clinica`) | Medicina & Enfermagem → `medicina-enfermagem` · Odontologia (Saúde Bucal) → `odontologia` · Reabilitação & Movimento → `reabilitacao-movimento` · Ciências Biológicas & Diagnósticas → `ciencias-biologicas` |
| **Inovação & Saúde Digital** (`inovacao-digital`) | Inteligência Artificial → `inteligencia-artificial` · Telessaúde & Telemedicina → `telessaude-telemedicina` · Engenharia Biomédica → `engenharia-biomedica` |
| **Saúde Mental & Comportamento** (`saude-mental`) | Psicologia & Psiquiatria → `psicologia-psiquiatria` · Saúde Mental do Profissional → `saude-mental-profissional` · Terapias Integrativas → `terapias-integrativas` |
| **Prevenção, Longevidade & Estilo de Vida** (`prevencao-longevidade`) | Nutrição & Dietética → `nutricao-dietetica` · Educação Física & Esporte → `educacao-fisica-esporte` |
| **Saúde Coletiva & Políticas Públicas** (`saude-coletiva`) | Epidemiologia & Surtos → `epidemiologia-surtos` · Políticas Públicas & SUS → `politicas-publicas-sus` · Saúde Corporativa & do Trabalho → `saude-corporativa-trabalho` · Vigilância Sanitária → `vigilancia-sanitaria` |

URL de categoria: `/{macro-slug}/`. URL de subcategoria: `/{macro-slug}/{subcat-slug}/`
(nenhuma dessas páginas existe ainda — mesma situação de `/vagas/`,
`/eventos/`, `/colunistas/`, `/admin/`, `/newsletter/`: são links reais no
scaffold, sem página própria por trás, normal nesta fase de mock).

### Barra de Serviços fixa (pedido explícito — "o coração do engajamento")

3 itens sempre visíveis, numa faixa própria abaixo do supermenu editorial
(nunca dentro dele — Roberto foi claro que isso não é uma categoria de
conteúdo, é utilidade fixa):
- 💼 Hub de Carreiras (`/vagas/`) — painel de vagas filtrável por região/área
- 📅 Agenda de Eventos do Setor (`/eventos/`) — congressos, feiras (ex:
  Hospitalar), simpósios, webinars
- ✍️ Colunistas (`/colunistas/`) — artigos assinados por CEOs de hospital,
  presidentes de operadora, líderes de conselho de classe

### O que foi implementado nesta sessão (06/09/2026)

- `opmed/public/index.html` — supermenu reescrito com os 6 macros + submenu
  completo de subcategorias cada (mesmo padrão dropdown do OVC); nova faixa
  `.header-services-bar` com os 3 chips de serviço; footer reestruturado
  (mesmo grid de 4 colunas, 2 grupos macro empilhados por coluna + coluna
  de Serviços/Institucional); `search-chips` do topo atualizados pros
  termos novos.
- `opmed/public/js/blocks.js` — `CAT_LABEL`/`CAT_SLUG` trocados pros 6
  macros; nova função `metaHtml(p)` que mostra a **subcategoria real**
  junto do tempo (ex: "Planos de Saúde & Saúde Suplementar · há 2h") em
  todo card que tenha `<time>` — dá a sensação de especialização editorial
  que Roberto pediu, não só um pill genérico de macro-categoria.
- `opmed/public/js/home.js` — `MOCK_POSTS` reescrito: 24 posts (era 22),
  4 por macro-categoria (exceto Saúde Coletiva com 6, Saúde Mental e
  Prevenção com 3 cada), cada um com campo novo `subcategoria` (label
  completo, não o slug) além de `categoria` (slug do macro). As imagens
  reais já existentes (`medicina-*`, `odontologia-*`, `bemestar-*`,
  `ciencia-*`, `saudepublica-*` — nomes de arquivo mantidos como estavam,
  são só temas de asset, não os slugs de categoria) foram redistribuídas
  por aproximação temática entre os 6 macros novos. Os 2 widgets de rail
  que filtram por categoria própria foram renomeados: `saude-publica`→
  `saude-coletiva` ("📋 Saúde Coletiva em Foco") e `ciencia`→
  `inovacao-digital` ("💻 Inovação & HealthTechs").
- `opmed/public/css/site.css` — `.header-services-bar`/`.service-chip`
  novos (chip com borda/fundo teal translúcido, mesmo `--accent-brand` já
  usado no resto do site); `.footer-links + .footer-col-title{margin-top}`
  pra empilhar 2 grupos título+lista dentro da mesma coluna do footer sem
  CSS novo de grid.
- Cache-bust: `site.css?v=2`, `blocks.js?v=2`, `home.js?v=2` (site.js não
  mudou, ficou em `v=1`).

### ⚠️ O que NÃO foi feito nesta rodada (fora de escopo, registrado)

- Nenhuma página de categoria/subcategoria real foi criada — os links do
  menu levam a URLs que ainda não existem (esperado nesta fase).
- Cores por macro-categoria (ex: pill colorido diferente por editoria,
  como o OVC faz) não foram adicionadas — o `.op-catpill` continua com uma
  única cor teal fixa. Se Roberto quiser diferenciação visual por cor
  entre as 6 editorias, é um pedido novo a confirmar antes de implementar.
- Fontes de conteúdo reais ("fontes esquisitas" na queixa de Roberto) —
  isso é sobre o **backend/RSS** (pendência #6 da seção 5, ainda não
  autorizada), não sobre o menu/categorias corrigidos aqui. A queixa dele
  cobria os dois problemas juntos; este commit resolve só o de
  estrutura/menu/categorias — a fonte de conteúdo real segue pendente.

### 🔧 Pendência pra próxima sessão

Redeploy feito, aguardando Roberto revisar `https://opmed-teal.vercel.app`
de novo com o menu/categorias novos antes de qualquer ajuste adicional.

---

## 9. POSICIONAMENTO ESTRATÉGICO (Roberto, 06/09/2026)

> **Objetivo declarado por Roberto, textual:** "quero me posicionar como o
> maior e unico portal que reune tudo isso em um unico local." — ou seja,
> o OPMED não compete pra ser "mais um" nicho — a tese é ser o único
> agregador que amarra TODOS os eixos do setor de saúde (clínico, negócios,
> tecnologia, bem-estar) num só lugar, ocupando um "oceano azul" que hoje
> não existe no Brasil (mercado fragmentado em players de nicho único).

### Mapeamento competitivo que Roberto trouxe (contexto, não fonte oficial —
### links e classificações vieram da pesquisa dele, não verificados por nós)

| Foco | Brasil | Internacional |
|---|---|---|
| Negócios/Gestão (B2B) | Saúde Insider, Futuro da Saúde, Medicina S/A | Modern Healthcare, Becker's Hospital Review |
| Prática Clínica (médico) | Medscape Brasil, PEBMED | Fierce Healthcare (+ Fierce Biotech/Pharma) |
| Saúde Digital/IA | — (lacuna no Brasil) | Healthcare IT News |
| Público geral (B2C) | Tua Saúde, Drauzio Varella | — |

**A tese de Roberto:** nenhum desses cobre TODOS os eixos ao mesmo tempo —
cada um é forte num nicho só. O espaço de "hub único que integra tudo" está
vazio no Brasil. O OPMED nasce pra ocupar exatamente esse vazio.

### Arquitetura "Multi-Home" proposta por Roberto — 4 "portas de entrada"

Diferente da taxonomia de 6 macro-editorias já implementada (seção 8),
Roberto descreveu agora uma camada de **4 grandes portas de entrada**
(subportais/abas com identidade visual própria), cada uma "sob medida"
pro perfil de quem entra:

1. **Negócios & Mercado** — CEOs de plano de saúde, donos de laboratório:
   fusões, Anvisa/ANS, finanças, regulação
2. **Prática Clínica** — médico, dentista, enfermeiro, fisioterapeuta:
   protocolos, estudos, congressos
3. **Saúde Digital & Inovação** — startups (HealthTechs), investidores,
   engenheiros biomédicos, entusiastas de IA
4. **Longevidade & Bem-estar** — medicina integrativa, nutrição, esporte,
   prevenção — atrai também público geral de alto padrão e marcas de
   consumo

**🚨 PONTO EM ABERTO, NÃO RESOLVIDO — perguntado a Roberto, aguardando
resposta antes de mexer em navegação de novo:** essas 4 portas não batem
1:1 com as 6 macro-editorias já no menu (seção 8). Mercado & Negócios e
Prática Clínica batem direto; Saúde Digital & Inovação bate com Inovação
Digital; mas Longevidade & Bem-estar juntaria hoje 2 categorias (Prevenção
& Longevidade + Saúde Mental), e **Saúde Coletiva & Políticas Públicas
não tem porta própria nenhuma** nas 4 descritas — não colocar essa
categoria em nenhum canto sem confirmação, nem inventar mapeamento.
Perguntamos a Roberto qual das 3 rotas ele quer:
(a) manter as 6 categorias reais como estão e criar as 4 portas só como
uma camada visual de destaque na home (4 cards grandes agrupando por
baixo dos panos) — **opção recomendada**, não perde nenhuma categoria;
(b) reduzir de fato o menu pra 4 categorias reais, fundindo Saúde Coletiva
em alguma das 4; (c) deixar como está por enquanto e revisitar depois.
**Nenhuma das 3 foi implementada ainda.**

### Estratégia de monetização B2B (Media Kit segmentado)

Consequência direta de ter todas as verticais num só lugar: dá pra vender
patrocínio **cirúrgico por editoria** — ex.: indústria de implante odontológico
patrocina só a editoria de Odontologia; banco de investimento patrocina só
Economia da Saúde/Planos de Saúde; big tech patrocina a trilha de IA &
Saúde Digital. Isso é consistente com os 4 pilares de monetização já
registrados na seção de posicionamento anterior (ver histórico do
CLAUDE.md da raiz, sessão 06/09/2026) — publicidade segmentada, Hub de
Carreiras patrocinado, eventos/webinars, conteúdo premium.

### 3 pilares de autoridade rápida (produto/editorial, não código)

1. **Furos de reportagem** — jornalistas com fonte dentro de Anvisa, ANS,
   grandes hospitais (Einstein, Sírio-Libanês, Rede D'Or)
2. **Conselho editorial de peso** — médico famoso, CEO de plano de saúde,
   diretor de faculdade de odontologia, validando o portal publicamente
3. **Dados e relatórios anuais** — "Anuário do Ecossistema da Saúde",
   compilando dados de laboratórios/planos/tecnologia/clínicas — vira
   referência de mercado citada por terceiros

Nenhum desses 3 pilares é tarefa de código — são decisões editoriais/de
negócio de Roberto, registradas aqui só pra nenhuma sessão futura tratar
o OPMED como "mais um portal de notícias" sem entender a ambição real.

### Slogans propostos por Roberto (nenhum escolhido ainda)

- "O ponto de encontro definitivo da saúde: da bancada científica à mesa
  de negócios."
- "A engrenagem completa do ecossistema da saúde em um só lugar."
- "Ciência, Gestão, Tecnologia e Mercado. A saúde integrada de ponta a
  ponta."

### 🔧 Pendência pra próxima sessão (atualizado)

1. Aguardar resposta de Roberto sobre o mapeamento Multi-Home (ver ponto
   em aberto acima) antes de tocar em navegação/home de novo.
2. Nenhuma decisão de slogan definitivo, Media Kit real ou conselho
   editorial foi tomada — tudo registrado como visão, não implementado.
