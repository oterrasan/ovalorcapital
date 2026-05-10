# ESTRATÉGIA SEO — O Valor Capital

> Documento estratégico. Leia antes de qualquer decisão técnica ou editorial.
> Atualizado: maio 2026

---

## VISÃO CENTRAL: O PORTAL É UMA MÁQUINA DE SEO

O Valor Capital foi construído para ser sustentado financeiramente **exclusivamente pelo Google**.
A modelo de negócio é simples e direto:

```
Conteúdo em volume e qualidade
        ↓
Indexação massiva no Google (artigos com slug URL + SSR + sitemap)
        ↓
Tráfego orgânico crescente
        ↓
Google AdSense / AdX (programático, sem vender espaço para ninguém)
        ↓
Receita mensal recorrente e crescente
```

**Não há plano B. Não há dependência de anunciantes diretos. O Google é o cliente.**

Isso significa que CADA decisão técnica, editorial e de produto deve ser avaliada pela seguinte pergunta:
> *Isso ajuda o Google a encontrar, indexar e ranquear nosso conteúdo?*

---

## PILARES TÉCNICOS DA MÁQUINA DE SEO

### 1. URLs com Slug (implementado)
Todo artigo tem URL limpa e com palavras-chave:
```
/politica/lula-sanciona-reforma-tributaria-a1b2c3d4/
```
Nunca mais `?id=` — query params não ranqueiam.

### 2. SSR (Server-Side Rendering) em todo artigo (implementado)
O Googlebot recebe o HTML completo com título, descrição, og:tags e corpo do artigo **antes de executar qualquer JavaScript**.
Arquivo: `api/article.js`

### 3. JSON-LD NewsArticle Schema (implementado)
Em todo artigo, o Google recebe estrutura de dados explícita:
```json
{ "@type": "NewsArticle", "headline": "...", "datePublished": "...", ... }
```
Isso classifica o conteúdo como jornalístico e aumenta chances de aparecer no Google News e Discover.

### 4. Sitemap Dinâmico (implementado)
Endpoint `api/sitemap.js` gera XML em tempo real com **todos os artigos publicados**.
URL: `/sitemap.xml` — atualiza automaticamente a cada novo artigo.
Antes: sitemap estático com zero artigos. Agora: todos os artigos visíveis para o Google.

### 5. Volume sem falhas: 300 artigos/dia
O Google mede frequência de atualização como sinal de relevância.
- Queda no volume = queda na frequência de crawl = queda no ranking
- O pipeline automático (cron a cada 20min) é infraestrutura crítica, não opcional
- SLA esperado: 300 artigos/dia, 7 dias por semana, sem interrupção

### 6. Aprovação Editorial Humana (obrigatório)
Todo artigo exige aprovação do Roberto antes de publicar.
Isso protege o portal do **Google Helpful Content Update**, que penaliza conteúdo AI-gerado sem revisão humana.
**Remover aprovação manual = risco de penalidade = colapso do modelo.**

---

## INTEGRAÇÃO INSTAGRAM → SEO

O OVC tem **2,6 milhões de views/mês no Instagram** (base: maio 2026), majoritariamente em Reels autorais.

Isso não é só distribuição — é um multiplicador de SEO:

| Efeito | Como impacta o Google |
|---|---|
| Tráfego social imediato | Google vê engajamento real → ranqueia mais rápido |
| Links do Instagram para artigos | Sinal de relevância social |
| Buscas por marca "O Valor Capital" | Eleva autoridade do domínio |
| Engajamento → Google Discover | Discover ativa quando detecta audiência real |

**Protocolo de integração obrigatório:**
- Todo Reel deve ter CTA explícito para o artigo completo no portal
- Stories com link sticker para o mesmo conteúdo do Reel
- Nunca só "link na bio" — CTA direto converte 3-5x mais

**Benchmark de conversão Instagram → portal (mercado BR, notícias):**
- Conservador: 0,5% das views viram visitas no site
- Otimista: 1,5% das views viram visitas no site
- Com 2,6M views: 13.000 a 39.000 visitas/mês garantidas independente de SEO

---

## PROJEÇÃO DE RECEITA — JUNHO A DEZEMBRO 2026

### Premissas
- 300 artigos/dia sem falhas
- Aprovação editorial mantida
- AdSense ativo desde junho
- Instagram crescendo 15-20%/mês
- Nicho financeiro/economia tem RPM mais alto que notícia geral (R$ 8-15 vs R$ 3-6)
- Fonte de receita: apenas Google AdSense / AdX (programático, sem vendas diretas)

### Cenário Conservador — Pés no Chão

| Mês | PV Orgânico | PV Instagram | PV Total | RPM | Receita |
|---|---|---|---|---|---|
| Jun/26 | 8.000 | 20.000 | **28.000** | R$ 3,50 | **R$ 98** |
| Jul/26 | 22.000 | 23.000 | **45.000** | R$ 4,00 | **R$ 180** |
| Ago/26 | 55.000 | 26.000 | **81.000** | R$ 4,50 | **R$ 365** |
| Set/26 | 100.000 | 30.000 | **130.000** | R$ 5,00 | **R$ 650** |
| Out/26 | 160.000 | 35.000 | **195.000** | R$ 5,00 | **R$ 975** |
| Nov/26 | 230.000 | 40.000 | **270.000** | R$ 5,50 | **R$ 1.485** |
| Dez/26 | 320.000 | 46.000 | **366.000** | R$ 5,50 | **R$ 2.013** |
| **TOTAL** | | | **~1,1M PV** | | **R$ 5.766** |

> AdSense cobre custos operacionais a partir de agosto/setembro.
> Crescimento lento mas sólido, sem dependência de viral.

### Cenário Otimista — Superando Expectativas

| Mês | PV Orgânico | PV Instagram | PV Discover | PV Total | RPM | Receita |
|---|---|---|---|---|---|---|
| Jun/26 | 45.000 | 60.000 | 20.000 | **125.000** | R$ 8 | **R$ 1.000** |
| Jul/26 | 220.000 | 72.000 | 60.000 | **352.000** | R$ 9 | **R$ 3.168** |
| Ago/26 | 580.000 | 86.000 | 130.000 | **796.000** | R$ 10 | **R$ 7.960** |
| Set/26 | 1.150.000 | 104.000 | 250.000 | **1.504.000** | R$ 11 | **R$ 16.544** |
| Out/26 | 2.050.000 | 125.000 | 400.000 | **2.575.000** | R$ 13 | **R$ 33.475** |
| Nov/26 | 3.100.000 | 150.000 | 600.000 | **3.850.000** | R$ 14 | **R$ 53.900** |
| Dez/26 | 4.400.000 | 180.000 | 900.000 | **5.480.000** | R$ 15 | **R$ 82.200** |
| **TOTAL** | | | | **~14,7M PV** | | **R$ 198.247** |

> Google Discover ativa em julho. AdX entra em outubro (requer ~2M PV/mês).
> Dezembro ultrapassa R$ 80k/mês.

### O Que Separa os Dois Cenários

| Fator | Conservador | Otimista |
|---|---|---|
| % artigos rankeando | 3–5% | 15–25% |
| Google Discover ativo | Não | Sim (mês 2) |
| AdX (premium) | Não | Outubro+ |
| Instagram com CTA integrado | Parcial | Total |
| Pipeline com zero falha | Quase | Sim |

---

## RISCOS QUE DESTROEM O MODELO

### 🔴 Risco Crítico: Google Helpful Content Update
O Google penaliza conteúdo AI-gerado em escala sem revisão editorial real.
**Proteção:** aprovação manual de cada artigo antes de publicar. Nunca remover essa etapa.

### 🔴 Risco Crítico: Pipeline com falha
- Queda para menos de 100 artigos/dia por mais de 3 dias → Google reduz frequência de crawl
- Recuperação leva semanas
- Monitorar: admin → Pipeline → status do cron

### 🟡 Risco Moderado: AdSense não aprovado
Sem AdSense, tráfego não gera receita. Aprovação leva 2-4 semanas.
**Ação:** aplicar imediatamente se ainda não aprovado.

### 🟡 Risco Moderado: URLs duplicadas / canonical errado
Se artigos tiverem múltiplas URLs (slug + ?id=), Google pode dividir autoridade.
**Proteção:** `api/article.js` injeta `<link rel="canonical">` correto em todo artigo.

---

## ALAVANCAS PARA ACELERAR

| Alavanca | Impacto | Esforço |
|---|---|---|
| Submeter sitemap no Search Console | Alto — indexação 3-5x mais rápida | Baixo (5 min) |
| Aplicar para Google News | Alto — multiplica tráfego de notícias | Médio |
| Instagram com CTA direto para artigos | Alto — aumenta conversão 3-5x | Baixo |
| Aplicar para Meta Reels Play Bonus | Médio — receita direta do Instagram | Baixo |
| Core Web Vitals (LCP < 2,5s) | Médio — fator de ranking | Médio |
| Categorias de alta demanda (vagas, concursos) | Alto — RPM alto, baixa concorrência | Já implementado |

---

## RECEITA DIRETA DO INSTAGRAM (adicional ao Google)

| Fonte | Requisito | Estimativa mensal |
|---|---|---|
| Meta Reels Play Bonus | Invite-based, elegível BR | R$ 200 – R$ 1.500 |
| Google AdSense (tráfego do Instagram) | AdSense aprovado | Incluso na projeção |

---

## AÇÃO IMEDIATA OBRIGATÓRIA

1. **Submeter sitemap** em search.google.com/search-console → Sitemaps → `https://www.ovalorcapital.com.br/sitemap.xml`
2. **Verificar AdSense** — se não aprovado, aplicar hoje
3. **Integrar Instagram** — todo Reel com link direto para o artigo via Stories
4. **Aplicar para Google News** em news.google.com/publisher-center
5. **Aplicar para Meta Reels Play Bonus** se não inscrito
