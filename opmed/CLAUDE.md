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
- **Categorias (5):** Medicina, Odontologia, Bem-Estar, Ciência, Saúde
  Pública — discutido com Roberto como ponto de partida
  ("saude, medicina, odontologica, ciencia, bem estar"), nunca confirmado
  como lista definitiva
- **Ticker do topo:** no OVC mostra cotação financeira (ibov, dólar...) —
  não faz sentido aqui. Deixado como contador genérico ("Casos
  monitorados hoje") até Roberto decidir o que mostrar de verdade

---

## 5. PENDÊNCIAS (05/09/2026)

| # | Pendência | Quem |
|---|---|---|
| 1 | Comprar domínio | Roberto ("eu vou comprar o dominio ainda") |
| 2 | Confirmar nome definitivo (OPMED ou outro) | Roberto |
| 3 | Confirmar/expandir as 5 categorias | Roberto |
| 4 | Confirmar paleta de cor definitiva | Roberto |
| 5 | Decidir conteúdo real do ticker/contador do topo | Roberto |
| 6 | Backend (`api/`), fontes RSS de saúde confiáveis, tabela Supabase | Claude, quando Roberto autorizar — pesquisa inicial de fontes já feita numa sessão anterior (Agência Fiocruz, Ministério da Saúde/Gov.br, BVS-MS — todas institucionais, baixo risco) |
| 7 | Criar projeto Vercel próprio (Root Directory: opmed) | Claude, só depois que o resto acima estiver mais definido |
| 8 | Widgets "ao vivo" mais robustos no rail (equivalente ao Radar Eleitoral/Radar do Esporte/Pulso BR do OVC) | Roberto decide a fonte de dado antes |

---

## 6. ONDE ESTÁ O CÓDIGO AGORA

PR #661 (`oterrasan/ovalorcapital`, branch `feat/opmed-scaffold`) —
**draft**, não mergeado em `main`. Nada disso está em produção — é só
código guardado no GitHub esperando as decisões da seção 5.
