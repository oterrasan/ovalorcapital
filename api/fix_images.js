// /api/fix_images — reprocessa posts sem categoria ou conteudo curto
// GET /api/fix_images?token=ovc2026&batch=0
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const CAT_FALLBACK = {
  politica:      "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80",
  economia:      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
  negocios:      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80",
  investimentos: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80",
  seguros:       "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
  mercados:      "https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=800&q=80",
  educacao:      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80",
  industria:     "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",
  tecnologia:    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
  esportes:      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80",
  saude:         "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
  familia:       "https://images.unsplash.com/photo-1511895426328-dc8714191011?w=800&q=80",
  tributacao:    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80",
  regulacao:     "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80",
  internacional: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=800&q=80",
  parcerias:     "https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?w=800&q=80",
  geral:         "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80"
};

function detectCategoria(texto) {
  const t = (texto||"").toLowerCase();
  if (/lula|stf|congresso|câmara|senado|governo federal|ministro|presidente|reforma|judiciário|partido|eleição|política|policia|crime|violência/.test(t)) return "politica";
  if (/ibovespa|bolsa|dólar|pib|inflação|selic|copom|juros|banco central|fiscal|orçamento|déficit|economia/.test(t)) return "economia";
  if (/empresa|negócio|startup|mercado|empreend|fusão|aquisição|corporat/.test(t)) return "negocios";
  if (/renda fixa|tesouro|fundo de investimento|cdi|bitcoin|cripto|ação|dividendo|investimento/.test(t)) return "investimentos";
  if (/imposto|tributação|irpf|receita federal/.test(t)) return "tributacao";
  if (/regulação|anatel|anvisa|susep|ans|bacen|cvm/.test(t)) return "regulacao";
  if (/seguro|apólice|sinistro|previdência/.test(t)) return "seguros";
  if (/saúde|médico|hospital|vacina|doença|tratamento/.test(t)) return "saude";
  if (/família|filho|escola|criança|adolescente/.test(t)) return "familia";
  if (/tecnologia|inteligência artificial|ia |tech|software/.test(t)) return "tecnologia";
  if (/indústria|manufatura|fábrica|agro|logística/.test(t)) return "industria";
  if (/futebol|nba|esporte|campeonato|atleta|olimpíada|tênis|mma/.test(t)) return "esportes";
  if (/eua|estados unidos|china|europa|guerra|ucrânia|israel|trump|internacional/.test(t)) return "internacional";
  return "geral";
}

async function findImage(titulo, categoria) {
  try {
    const stop = new Set(['de','da','do','em','no','na','para','com','que','se','uma','um','e','o','a','é']);
    const kw = titulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s]/g," ")
      .split(/\s+/).filter(w=>w.length>3&&!stop.has(w)).slice(0,4).join(" ");
    if (!kw) return CAT_FALLBACK[categoria]||CAT_FALLBACK.geral;
    const r = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(kw)}&srnamespace=6&srlimit=5&format=json&origin=*`,
      { headers:{"User-Agent":"OVCPortal/1.0"}, signal: AbortSignal.timeout(7000) });
    const d = await r.json();
    for (const result of (d?.query?.search||[])) {
      const r2 = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(result.title)}&prop=imageinfo&iiprop=url|mime|size&format=json&origin=*`,
        { headers:{"User-Agent":"OVCPortal/1.0"}, signal: AbortSignal.timeout(6000) });
      const d2 = await r2.json();
      for (const page of Object.values(d2?.query?.pages||{})) {
        const ii = page?.imageinfo?.[0];
        if (!ii||(!ii.mime?.includes("jpeg")&&!ii.mime?.includes("png"))) continue;
        if ((ii.width||0)<300) continue;
        if (/logo|icon|flag|coat|seal|badge|portrait|autor|reporter|selfie|headshot/i.test(ii.url||"")) continue;
        return ii.url;
      }
    }
  } catch {}
  return CAT_FALLBACK[categoria]||CAT_FALLBACK.geral;
}

async function callGemini(prompt) {
  const keys = [process.env.GEMINI_API_KEY, process.env.GEMINI_KEY_2].filter(Boolean);
  for (const key of keys) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
        { method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.7,maxOutputTokens:3000} }),
          signal: AbortSignal.timeout(25000) });
      const d = await res.json();
      if (res.status===429) continue;
      const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text&&text.length>100) return text;
    } catch {}
  }
  return null;
}

function buildPrompt(conteudo, titulo) {
  const data = new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"});
  return `Você é redator-chefe do portal O Valor Capital. Reescreva no padrão editorial OVC.

RESPONDA EXATAMENTE NESTE FORMATO (sem texto antes ou depois):

TITULO: [manchete máx 8 palavras, com verbo]
SUBTITULO: [frase direta até 100 caracteres]
CATEGORIA: [uma: politica | economia | negocios | investimentos | seguros | mercados | educacao | industria | tecnologia | esportes | saude | familia | tributacao | regulacao | parcerias | internacional | geral]
SUBCATEGORIA: [subcategoria específica]
CORPO:
Redação OVC — ${data}

[Parágrafo 1: gancho com fato ou número real. Mínimo 4 frases.]

[Parágrafo 2: contexto — por que importa agora. Mínimo 3 frases.]

[Parágrafo 3: dado concreto com número, nome ou data. Mínimo 3 frases.]

[Parágrafo 4: desdobramento — o que está em jogo. Mínimo 3 frases.]

[Parágrafo 5: impacto prático para o cidadão ou mercado. Mínimo 3 frases.]

[Parágrafo 6: reação ou declaração verificável. Mínimo 3 frases.]

[Parágrafo 7: histórico ou comparativo. Mínimo 3 frases.]

[Parágrafo 8: fechamento com tensão implícita, sem conclusão óbvia. Mínimo 2 frases.]

#hashtag1
#hashtag2
#hashtag3
#ovalorcapital

OBRIGATÓRIO: corpo com mínimo 1.600 caracteres, 8 parágrafos separados por linha em branco.
PROIBIDO: muralha, blindar, colapso, catalisador, ecossistema, disruptivo, paradigma, sinergia, protagonista, robusto, resiliente, isso mostra, vale destacar, em meio a, diante disso, chama atenção, acende alerta, especialistas apontam.

TÍTULO: ${titulo}
CONTEÚDO: ${(conteudo||"").slice(0,2500)}`;
}

function parse(raw) {
  const lines=(raw||"").split("\n");
  let titulo="",subtitulo="",categoriaRaw="geral",subcategoriaRaw="Geral",corpo="",inCorpo=false;
  for (const line of lines) {
    const t=line.trim();
    if (/^TITULO:/i.test(t)) titulo=t.replace(/^TITULO:/i,"").trim();
    else if (/^SUBTITULO:/i.test(t)) subtitulo=t.replace(/^SUBTITULO:/i,"").trim();
    else if (/^CATEGORIA:/i.test(t)) categoriaRaw=t.replace(/^CATEGORIA:/i,"").trim().toLowerCase();
    else if (/^SUBCATEGORIA:/i.test(t)) subcategoriaRaw=t.replace(/^SUBCATEGORIA:/i,"").trim();
    else if (/^CORPO:/i.test(t)) inCorpo=true;
    else if (inCorpo) corpo+=line+"\n";
  }
  return {titulo,subtitulo,categoria:categoriaRaw||"geral",subcategoria:subcategoriaRaw||"Geral",corpo:corpo.trim()};
}

const sleep = ms => new Promise(r=>setTimeout(r,ms));

export default async function handler(req, res) {
  if (req.query.token !== "ovc2026") return res.status(401).json({ error: "unauthorized" });

  const batch = parseInt(req.query.batch||"0");
  const LOTE = 12;

  // Buscar só os que precisam reprocessar: sem categoria ou conteudo curto
  const { data: todos } = await supabase.from("posts")
    .select("id,titulo,conteudo,user_tags")
    .eq("status","pendente")
    .order("created_at",{ascending:true})
    .limit(500);

  const precisam = (todos||[]).filter(p => {
    const tags = p.user_tags;
    const temCat = tags && tags !== '[]' && tags !== 'null';
    const chars = (p.conteudo||"").length;
    return !temCat || chars < 1000;
  });

  const lote = precisam.slice(batch*LOTE, (batch+1)*LOTE);
  if (!lote.length) return res.status(200).json({ msg:"todos processados", total_restante:0 });

  let ok=0, falha=0, log=[];

  for (const post of lote) {
    try {
      const raw = await callGemini(buildPrompt(post.conteudo, post.titulo));
      const parsed = parse(raw);

      if (!parsed.corpo || parsed.corpo.length < 800) {
        // Fallback: detectar categoria pelo conteudo e manter texto original
        const cat = detectCategoria(post.titulo+" "+(post.conteudo||""));
        await supabase.from("posts").update({
          user_tags: JSON.stringify([cat]),
          subcategoria: "Geral",
          subcategoria_slug: "geral",
          imagem: CAT_FALLBACK[cat]||CAT_FALLBACK.geral
        }).eq("id",post.id);
        log.push(`FALLBACK cat(${cat}): ${post.titulo}`);
        falha++;
        continue;
      }

      const imagem = await findImage(parsed.titulo||post.titulo, parsed.categoria);
      const subSlug = (parsed.subcategoria||"geral").toLowerCase().normalize("NFD")
        .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

      await supabase.from("posts").update({
        titulo: parsed.titulo||post.titulo,
        comentario_fixado: parsed.subtitulo||"",
        conteudo: parsed.corpo,
        imagem,
        user_tags: JSON.stringify([parsed.categoria]),
        subcategoria: parsed.subcategoria,
        subcategoria_slug: subSlug
      }).eq("id",post.id);

      ok++; log.push(`OK(${parsed.corpo.length}chars|${parsed.categoria}): ${parsed.titulo}`);
      await sleep(800);
    } catch(e) {
      falha++; log.push(`ERRO: ${post.titulo} — ${e.message}`);
      await sleep(1000);
    }
  }

  const restante = precisam.length - (batch+1)*LOTE;
  return res.status(200).json({
    batch, ok, falha,
    restante_para_processar: Math.max(0,restante),
    proximo_url: restante>0 ? `/api/fix_images?token=ovc2026&batch=${batch+1}` : null,
    log
  });
}
