import { readFileSync } from "fs";
import { join } from "path";

const OG_DEFAULT = "https://www.ovalorcapital.com.br/images/og-default.jpg";
const LOGO = "https://www.ovalorcapital.com.br/images/logo-ovc.png";
const SITE = "O Valor Capital";

const PAGES = {
  radar: { title: "Radar OVC | Indicadores EconÃ´micos em Tempo Real | O Valor Capital", desc: "Painel de indicadores econÃ´micos e financeiros em tempo real: Ibovespa, dÃ³lar, Selic, inflaÃ§Ã£o, desemprego e principais dados do Brasil.", canonical: "https://www.ovalorcapital.com.br/radar/", tplPath: "radar", schema: "WebPage" },
  "tv-ovc": { title: "TV OVC | NotÃ­cias ao Vivo | O Valor Capital", desc: "TV OVC: assista a notÃ­cias de polÃ­tica, economia e negÃ³cios ao vivo. O melhor do jornalismo brasileiro em tempo real.", canonical: "https://www.ovalorcapital.com.br/tv-ovc/", tplPath: "tv-ovc", schema: "WebPage" },
  "radio-ovc": { title: "RÃ¡dio OVC | NotÃ­cias em Ãudio | O Valor Capital", desc: "RÃ¡dio OVC: ouÃ§a notÃ­cias de polÃ­tica, economia, negÃ³cios e mercados. Jornalismo em Ã¡udio para ouvir quando e onde quiser.", canonical: "https://www.ovalorcapital.com.br/radio-ovc/", tplPath: "radio-ovc", schema: "WebPage" },
  dados: { title: "Dados EconÃ´micos | CotaÃ§Ãµes, Agenda e Indicadores | O Valor Capital", desc: "Central de dados econÃ´micos: cotaÃ§Ãµes ao vivo, agenda econÃ´mica, indicadores macroeconÃ´micos e painel de mercados financeiros.", canonical: "https://www.ovalorcapital.com.br/dados/", tplPath: "dados", schema: "DataCatalog" },
  cotacoes: { title: "CotaÃ§Ãµes ao Vivo | DÃ³lar, Ibovespa, Bitcoin Hoje | O Valor Capital", desc: "CotaÃ§Ãµes em tempo real: dÃ³lar hoje, euro, bitcoin, Ibovespa, S&P 500, Nasdaq, ouro, petrÃ³leo e todas as principais moedas e Ã­ndices.", canonical: "https://www.ovalorcapital.com.br/dados/cotacoes/", tplPath: "dados/cotacoes", schema: "Dataset" },
  agenda: { title: "Agenda EconÃ´mica | CalendÃ¡rio de Indicadores e Eventos | O Valor Capital", desc: "Agenda econÃ´mica completa: COPOM, IPCA, PIB, payroll, Fed e todos os indicadores e eventos que movem os mercados financeiros.", canonical: "https://www.ovalorcapital.com.br/dados/agenda-economica/", tplPath: "dados/agenda-economica", schema: "Event" }
};

const _tpl = {};
function getTemplate(tplPath) {
  if (_tpl[tplPath]) return _tpl[tplPath];
  try { _tpl[tplPath] = readFileSync(join(process.cwd(), "public", tplPath, "index.html"), "utf8"); return _tpl[tplPath]; }
  catch (_) { return null; }
}
function esc(s) { return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function ensurePortalRails(html, page) {
  if (html.includes("ovc-right-rail")) return html;
  const mountByPage = {
    radar: "data-radar-page",
    "tv-ovc": "data-tv-page",
    "radio-ovc": "data-radio-page",
    cotacoes: "data-quotes-page",
    agenda: "data-agenda-page",
    dados: "data-dados-page"
  };
  const mount = mountByPage[page];
  if (!mount) return html;
  const mountedMain = new RegExp(`<main class="ovc-main"><section ${mount}></section></main>`, "i");
  const standardMain = `<main class="ovc-main"><section class="ovc-grid"><div class="ovc-story-stack"><section ${mount}></section></div><aside class="ovc-right-rail"><section data-banner-sidebar></section></aside></section></main>`;
  if (mountedMain.test(html)) return html.replace(mountedMain, standardMain);
  return html.replace(/<main class="ovc-main">([\s\S]*?)<\/main>/i, '<main class="ovc-main"><section class="ovc-grid"><div class="ovc-story-stack">$1</div><aside class="ovc-right-rail"><section data-banner-sidebar></section></aside></section></main>');
}

async function handleCopa(_req, res) {
  try {
    const [sR, stR] = await Promise.all([
      fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard', {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OVC/1.0)' },
        signal: AbortSignal.timeout(7000)
      }),
      fetch('https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings', {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OVC/1.0)' },
        signal: AbortSignal.timeout(7000)
      })
    ]);
    const [sD, stD] = await Promise.all([sR.ok ? sR.json() : null, stR.ok ? stR.json() : null]);

    const getStat = (stats, ...names) => {
      for (const n of names) {
        const s = (stats || []).find(x => x.name === n || x.abbreviation === n || x.shortDisplayName === n);
        if (s != null) return Number(s.value) || 0;
      }
      return 0;
    };

    const partidas = (sD?.events || []).map(ev => {
      const comp = ev.competitions?.[0];
      const home = comp?.competitors?.find(c => c.homeAway === 'home');
      const away = comp?.competitors?.find(c => c.homeAway === 'away');
      if (!home || !away) return null;
      const st = ev.status?.type?.name || '';
      const isLive = st.includes('IN_PROGRESS');
      const isDone = st.includes('FINAL') || ev.status?.type?.completed === true;
      const dateUTC = new Date(ev.date || comp?.date || '');
      const dateBRT = new Date(dateUTC.getTime() - 3 * 60 * 60 * 1000);
      return {
        id: ev.id,
        home: { nome: home.team?.displayName || '', sigla: home.team?.abbreviation || '', placar: (isLive || isDone) ? (home.score || '0') : null },
        away: { nome: away.team?.displayName || '', sigla: away.team?.abbreviation || '', placar: (isLive || isDone) ? (away.score || '0') : null },
        status: isLive ? 'ao_vivo' : isDone ? 'encerrado' : 'agendado',
        relogio: ev.status?.displayClock || '',
        grupo: comp?.notes?.find(n => n.type === 'event')?.headline || '',
        estadio: comp?.venue?.fullName || '',
        dataBRT: dateBRT.toISOString()
      };
    }).filter(Boolean);

    const standingsSrc = Array.isArray(stD?.standings) ? stD.standings
      : stD?.standings?.children?.length ? stD.standings.children
      : stD?.children?.length ? stD.children
      : stD?.groups?.length ? stD.groups
      : [];
    const grupos = standingsSrc.map(g => ({
      nome: g.name || g.abbreviation || g.title || '',
      times: (g.standings?.entries || g.entries || []).map(e => ({
        nome: e.team?.displayName || e.team?.name || '',
        sigla: e.team?.abbreviation || '',
        pj: getStat(e.stats, 'gamesPlayed', 'GP'),
        v: getStat(e.stats, 'wins', 'W'),
        e: getStat(e.stats, 'ties', 'D', 'draws'),
        d: getStat(e.stats, 'losses', 'L'),
        gp: getStat(e.stats, 'pointsFor', 'GF', 'goalsFor'),
        gc: getStat(e.stats, 'pointsAgainst', 'GA', 'goalsAgainst'),
        sg: getStat(e.stats, 'pointDifferential', 'GD', 'goalDifference'),
        pts: getStat(e.stats, 'points', 'Pts', 'PTS')
      }))
    }));

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json({ partidas, grupos, updated_at: new Date().toISOString(), ok: true });
  } catch (err) {
    return res.json({ partidas: [], grupos: [], error: err.message, ok: false });
  }
}

export default async function handler(req, res) {
  if (req.query.action === 'copa') return handleCopa(req, res);
  const page = (req.query.page || "").toLowerCase();
  const cfg = PAGES[page];
  if (!cfg) return res.status(404).send("Not found");
  const tpl = getTemplate(cfg.tplPath);
  if (!tpl) return res.status(500).send("Template error");
  const jsonLd = JSON.stringify({ "@context": "https://schema.org", "@type": cfg.schema, "name": cfg.title, "description": cfg.desc, "url": cfg.canonical, "publisher": { "@type": "Organization", "name": SITE, "logo": { "@type": "ImageObject", "url": LOGO } }, "inLanguage": "pt-BR", "isAccessibleForFree": true });
  const seoTags = [
    `<title>${esc(cfg.title)}</title>`, `<meta name="description" content="${esc(cfg.desc)}">`, `<link rel="canonical" href="${cfg.canonical}">`,
    `<meta property="og:type" content="website">`, `<meta property="og:site_name" content="${SITE}">`, `<meta property="og:title" content="${esc(cfg.title)}">`, `<meta property="og:description" content="${esc(cfg.desc)}">`, `<meta property="og:image" content="${OG_DEFAULT}">`, `<meta property="og:url" content="${cfg.canonical}">`, `<meta property="og:locale" content="pt_BR">`,
    `<meta name="twitter:card" content="summary_large_image">`, `<meta name="twitter:site" content="@ovalorcapital">`, `<meta name="twitter:title" content="${esc(cfg.title)}">`, `<meta name="twitter:description" content="${esc(cfg.desc)}">`, `<meta name="twitter:image" content="${OG_DEFAULT}">`,
    `<script type="application/ld+json">${jsonLd}</script>`, `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3652391568977586" crossorigin="anonymous"></script>`
  ].join("\n");
  let html = ensurePortalRails(tpl, page);
  html = html.replace(/<title>[^<]*<\/title>/i, "");
  html = html.replace(/<meta\s+name="description"[^>]*>/i, "");
  html = html.replace("</head>", seoTags + "\n</head>");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=180, stale-while-revalidate=300");
  return res.status(200).send(html);
}
