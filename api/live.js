import { readFileSync } from "fs";
import { join } from "path";

const OG_DEFAULT = "https://www.ovalorcapital.com.br/images/og-default.jpg";
const LOGO = "https://www.ovalorcapital.com.br/images/logo-ovc.png";
const SITE = "O Valor Capital";

const PAGES = {
  radar: { title: "Radar OVC | Indicadores Econômicos em Tempo Real | O Valor Capital", desc: "Painel de indicadores econômicos e financeiros em tempo real: Ibovespa, dólar, Selic, inflação, desemprego e principais dados do Brasil.", canonical: "https://www.ovalorcapital.com.br/radar/", tplPath: "radar", schema: "WebPage" },
  "tv-ovc": { title: "TV OVC | Notícias ao Vivo | O Valor Capital", desc: "TV OVC: assista a notícias de política, economia e negócios ao vivo. O melhor do jornalismo brasileiro em tempo real.", canonical: "https://www.ovalorcapital.com.br/tv-ovc/", tplPath: "tv-ovc", schema: "WebPage" },
  "radio-ovc": { title: "Rádio OVC | Notícias em Áudio | O Valor Capital", desc: "Rádio OVC: ouça notícias de política, economia, negócios e mercados. Jornalismo em áudio para ouvir quando e onde quiser.", canonical: "https://www.ovalorcapital.com.br/radio-ovc/", tplPath: "radio-ovc", schema: "WebPage" },
  dados: { title: "Dados Econômicos | Cotações, Agenda e Indicadores | O Valor Capital", desc: "Central de dados econômicos: cotações ao vivo, agenda econômica, indicadores macroeconômicos e painel de mercados financeiros.", canonical: "https://www.ovalorcapital.com.br/dados/", tplPath: "dados", schema: "DataCatalog" },
  cotacoes: { title: "Cotações ao Vivo | Dólar, Ibovespa, Bitcoin Hoje | O Valor Capital", desc: "Cotações em tempo real: dólar hoje, euro, bitcoin, Ibovespa, S&P 500, Nasdaq, ouro, petróleo e todas as principais moedas e índices.", canonical: "https://www.ovalorcapital.com.br/dados/cotacoes/", tplPath: "dados/cotacoes", schema: "Dataset" },
  agenda: { title: "Agenda Econômica | Calendário de Indicadores e Eventos | O Valor Capital", desc: "Agenda econômica completa: COPOM, IPCA, PIB, payroll, Fed e todos os indicadores e eventos que movem os mercados financeiros.", canonical: "https://www.ovalorcapital.com.br/dados/agenda-economica/", tplPath: "dados/agenda-economica", schema: "Event" }
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

const SPORT_LIGAS = {
  soccer: new Set(['bra.1', 'bra.2', 'conmebol.libertadores', 'conmebol.sudamericana', 'uefa.champions', 'eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1']),
  basketball: new Set(['nba']),
  football: new Set(['nfl'])
};
const LEADER_CAT_REGEX = { basketball: /points|pts/i, football: /passing|touchdown|yard/i, soccer: /goal|gol/i };

// Esportes individuais (piloto/equipe, não time-vs-time) — F1: próxima corrida, último resultado, classificação de pilotos/equipes
async function handleEspnRacing(liga, res) {
  try {
    const opts = { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OVC/1.0)' }, signal: AbortSignal.timeout(7000) };
    const [sR, stR] = await Promise.all([
      fetch(`https://site.api.espn.com/apis/site/v2/sports/racing/${liga}/scoreboard`, opts),
      fetch(`https://site.api.espn.com/apis/v2/sports/racing/${liga}/standings`, opts)
    ]);
    const [sD, stD] = await Promise.all([sR.ok ? sR.json() : null, stR.ok ? stR.json() : null]);

    const escudo = t => t?.logos?.[0]?.href || t?.logo || '';
    const events = sD?.events || [];
    const agora = Date.now();

    const corridas = events.map(ev => {
      const comp = ev.competitions?.[0];
      const completa = ev.status?.type?.completed === true;
      const competidores = (comp?.competitors || []).slice().sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));
      const pódio = competidores.slice(0, 3).map(c => ({
        nome: c.athlete?.displayName || c.vehicle?.displayName || '—',
        equipe: c.team?.displayName || c.vehicle?.manufacturer || '',
        escudo: escudo(c.team || c.vehicle)
      }));
      return {
        nome: ev.name || ev.shortName || '',
        circuito: comp?.venue?.fullName || comp?.venue?.address?.city || '',
        data: ev.date || '',
        completa,
        podio: pódio
      };
    });

    const proxima = corridas.find(c => !c.completa) || null;
    const ultimaCompleta = corridas.filter(c => c.completa).slice(-1)[0] || null;

    const getPts = stats => {
      const s = (stats || []).find(x => /points|pts/i.test(x.name || x.abbreviation || ''));
      return s ? Number(s.value) || 0 : 0;
    };
    const standingsSrc = Array.isArray(stD?.standings) ? stD.standings
      : stD?.standings?.children?.length ? stD.standings.children
      : stD?.children?.length ? stD.children
      : [];
    const classificacoes = standingsSrc.map(g => ({
      nome: g.name || g.abbreviation || g.title || '',
      itens: (g.standings?.entries || g.entries || []).map(e => ({
        nome: e.athlete?.displayName || e.team?.displayName || '—',
        escudo: escudo(e.team),
        pts: getPts(e.stats)
      })).sort((a, b) => b.pts - a.pts)
    })).filter(g => g.itens.length > 0);

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json({ proxima, ultimaCompleta, classificacoes, updated_at: new Date().toISOString(), ok: true });
  } catch (err) {
    return res.json({ proxima: null, ultimaCompleta: null, classificacoes: [], error: err.message, ok: false });
  }
}

// Tênis (ATP/WTA) — sem tabela de liga: próximos jogos, últimos resultados, ranking top 10
async function handleEspnTennis(liga, res) {
  try {
    const opts = { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OVC/1.0)' }, signal: AbortSignal.timeout(7000) };
    const [sR, rR] = await Promise.all([
      fetch(`https://site.api.espn.com/apis/site/v2/sports/tennis/${liga}/scoreboard`, opts),
      fetch(`https://site.api.espn.com/apis/site/v2/sports/tennis/${liga}/rankings`, opts)
    ]);
    const [sD, rD] = await Promise.all([sR.ok ? sR.json() : null, rR.ok ? rR.json() : null]);

    const events = sD?.events || [];
    const jogos = events.map(ev => {
      const comp = ev.competitions?.[0];
      const competidores = comp?.competitors || [];
      const j1 = competidores[0], j2 = competidores[1];
      const completo = ev.status?.type?.completed === true;
      const nome = a => a?.athlete?.displayName || a?.athlete?.shortName || '';
      return {
        torneio: sD?.leagues?.[0]?.name || ev.shortName || '',
        fase: comp?.notes?.[0]?.headline || '',
        jogador1: { nome: nome(j1), placar: completo ? (j1?.score || j1?.linescores?.map(l => l.value).join('-') || '') : '' },
        jogador2: { nome: nome(j2), placar: completo ? (j2?.score || j2?.linescores?.map(l => l.value).join('-') || '') : '' },
        data: ev.date || '',
        completo
      };
    }).filter(j => j.jogador1.nome && j.jogador2.nome);

    const proximosJogos = jogos.filter(j => !j.completo).slice(0, 10);
    const ultimosResultados = jogos.filter(j => j.completo).slice(-10);

    const rankSrc = rD?.rankings?.[0]?.ranks || rD?.athletes || (Array.isArray(rD?.rankings) ? rD.rankings : []) || [];
    const ranking = (Array.isArray(rankSrc) ? rankSrc : []).slice(0, 10).map((r, i) => ({
      pos: Number(r.current || r.rank || i + 1),
      nome: r.athlete?.displayName || r.displayName || '—',
      pts: Number(r.points || r.recordSummary || 0) || 0
    })).filter(r => r.nome !== '—');

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json({ proximosJogos, ultimosResultados, ranking, updated_at: new Date().toISOString(), ok: true });
  } catch (err) {
    return res.json({ proximosJogos: [], ultimosResultados: [], ranking: [], error: err.message, ok: false });
  }
}

// MMA (UFC) — evento é um card de lutas, não time-vs-time: próximo card + resultado do último card
async function handleEspnMma(liga, res) {
  try {
    const opts = { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OVC/1.0)' }, signal: AbortSignal.timeout(7000) };
    const sR = await fetch(`https://site.api.espn.com/apis/site/v2/sports/mma/${liga}/scoreboard`, opts);
    const sD = sR.ok ? await sR.json() : null;

    const events = sD?.events || [];
    const proximoEvento = events.find(ev => ev.status?.type?.completed !== true) || null;
    const ultimoEvento = events.filter(ev => ev.status?.type?.completed === true).slice(-1)[0] || null;

    const mapCard = ev => {
      if (!ev) return null;
      const lutas = (ev.competitions || []).map(c => {
        const f1 = c.competitors?.[0], f2 = c.competitors?.[1];
        const completo = c.status?.type?.completed === true;
        const vencedor = completo ? (f1?.winner ? (f1?.athlete?.displayName || '') : f2?.winner ? (f2?.athlete?.displayName || '') : '') : '';
        return {
          lutador1: f1?.athlete?.displayName || '—',
          lutador2: f2?.athlete?.displayName || '—',
          categoria: c.type?.text || c.notes?.[0]?.headline || '',
          vencedor,
          metodo: completo ? (c.status?.type?.description || '') : '',
          completo
        };
      }).filter(l => l.lutador1 !== '—' || l.lutador2 !== '—');
      return { nome: ev.name || ev.shortName || '', local: ev.competitions?.[0]?.venue?.fullName || '', data: ev.date || '', lutas };
    };

    const proxima = mapCard(proximoEvento);
    const ultima = mapCard(ultimoEvento);

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json({ proxima, ultima, updated_at: new Date().toISOString(), ok: true });
  } catch (err) {
    return res.json({ proxima: null, ultima: null, error: err.message, ok: false });
  }
}

async function handleEspn(req, res) {
  const sport = String(req.query.sport || 'soccer').trim();
  const liga = String(req.query.liga || '').trim();
  if (sport === 'racing') {
    if (liga !== 'f1') return res.status(400).json({ error: 'liga invalida', ok: false });
    return handleEspnRacing(liga, res);
  }
  if (sport === 'tennis') {
    if (!['atp', 'wta'].includes(liga)) return res.status(400).json({ error: 'liga invalida', ok: false });
    return handleEspnTennis(liga, res);
  }
  if (sport === 'mma') {
    if (liga !== 'ufc') return res.status(400).json({ error: 'liga invalida', ok: false });
    return handleEspnMma(liga, res);
  }
  const ligasOk = SPORT_LIGAS[sport];
  if (!ligasOk || !ligasOk.has(liga)) return res.status(400).json({ error: 'liga invalida', ok: false });
  try {
    const opts = { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OVC/1.0)' }, signal: AbortSignal.timeout(7000) };
    const [sR, stR, lR] = await Promise.all([
      fetch(`https://site.api.espn.com/apis/site/v2/sports/${sport}/${liga}/scoreboard`, opts),
      fetch(`https://site.api.espn.com/apis/v2/sports/${sport}/${liga}/standings`, opts),
      fetch(`https://site.api.espn.com/apis/site/v2/sports/${sport}/${liga}/leaders`, opts)
    ]);
    const [sD, stD, lD] = await Promise.all([sR.ok ? sR.json() : null, stR.ok ? stR.json() : null, lR.ok ? lR.json() : null]);

    const getStat = (stats, ...names) => {
      for (const n of names) {
        const s = (stats || []).find(x => x.name === n || x.abbreviation === n || x.shortDisplayName === n);
        if (s != null) return Number(s.value) || 0;
      }
      return 0;
    };

    const escudo = t => t?.logos?.[0]?.href || t?.logo || '';

    const partidas = (sD?.events || []).map(ev => {
      const comp = ev.competitions?.[0];
      const home = comp?.competitors?.find(c => c.homeAway === 'home');
      const away = comp?.competitors?.find(c => c.homeAway === 'away');
      if (!home || !away) return null;
      const st = ev.status?.type?.name || '';
      const isLive = st.includes('IN_PROGRESS');
      const isDone = st.includes('FINAL') || ev.status?.type?.completed === true;
      return {
        home: { nome: home.team?.displayName || '', escudo: escudo(home.team), placar: (isLive || isDone) ? (home.score || '0') : null },
        away: { nome: away.team?.displayName || '', escudo: escudo(away.team), placar: (isLive || isDone) ? (away.score || '0') : null },
        status: isLive ? 'ao_vivo' : isDone ? 'encerrado' : 'agendado',
        estadio: comp?.venue?.fullName || '',
        data: ev.date || ''
      };
    }).filter(Boolean);

    // Grupos podem vir aninhados 2 níveis em ligas por conferência/divisão (NBA/NFL) — achata se necessário
    const rawGroups = Array.isArray(stD?.standings) ? stD.standings
      : stD?.standings?.children?.length ? stD.standings.children
      : stD?.children?.length ? stD.children
      : stD?.groups?.length ? stD.groups
      : [];
    const flatGroups = [];
    rawGroups.forEach(g => {
      const entries = g.standings?.entries || g.entries || [];
      if (entries.length) { flatGroups.push(g); return; }
      (g.children || g.standings?.children || []).forEach(sub => flatGroups.push(sub));
    });
    const grupos = flatGroups.map(g => ({
      nome: g.name || g.abbreviation || g.title || '',
      times: (g.standings?.entries || g.entries || []).map(e => ({
        nome: e.team?.displayName || e.team?.name || '',
        escudo: escudo(e.team),
        pj: getStat(e.stats, 'gamesPlayed', 'GP'),
        v: getStat(e.stats, 'wins', 'W'),
        e: getStat(e.stats, 'ties', 'D', 'draws'),
        d: getStat(e.stats, 'losses', 'L'),
        sg: getStat(e.stats, 'pointDifferential', 'GD', 'goalDifference'),
        pts: getStat(e.stats, 'points', 'Pts', 'PTS'),
        pct: getStat(e.stats, 'winPercent', 'PCT')
      })).sort((a, b) => b.pts - a.pts || b.pct - a.pct || b.v - a.v || b.sg - a.sg)
    })).filter(g => g.times.length > 0);

    const artilheiros = [];
    const cats = lD?.categories || [];
    const catRegex = LEADER_CAT_REGEX[sport] || LEADER_CAT_REGEX.soccer;
    const golCat = cats.find(c => catRegex.test(`${c.name || ''} ${c.abbreviation || ''} ${c.displayName || ''}`)) || cats[0];
    (golCat?.leaders || []).forEach(l => {
      const a = l.athlete || {};
      const tm = l.team || {};
      artilheiros.push({ nome: a.displayName || a.fullName || '—', time: tm.displayName || tm.name || '—', escudo: escudo(tm), foto: a.headshot?.href || '', gols: Number(l.value) || 0 });
    });
    artilheiros.sort((a, b) => b.gols - a.gols);

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.json({ partidas, grupos, artilheiros, updated_at: new Date().toISOString(), ok: true });
  } catch (err) {
    return res.json({ partidas: [], grupos: [], artilheiros: [], error: err.message, ok: false });
  }
}

function normNome(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, '').trim();
}

// Busca dados biográficos reais de um jogador (idade, altura, peso, clube) via ESPN.
// NUNCA inventa dados — se não houver correspondência confiável, retorna ok:false
// e o card simplesmente não exibe nenhum selo (comportamento idêntico ao anterior).
async function handleJogador(req, res) {
  const nome = String(req.query.nome || '').trim();
  if (!nome || nome.length < 4) return res.status(200).json({ ok: false });
  try {
    const opts = { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OVC/1.0)' }, signal: AbortSignal.timeout(6000) };
    const sR = await fetch(`https://site.api.espn.com/apis/search/v2?query=${encodeURIComponent(nome)}&limit=10`, opts);
    if (!sR.ok) return res.status(200).json({ ok: false });
    const sD = await sR.json();
    const grupos = Array.isArray(sD?.results) ? sD.results : [];
    const candidatos = [];
    grupos.forEach(g => (g.contents || []).forEach(c => {
      const href = c?.link?.web?.href || '';
      if (/\/soccer\/player\//i.test(href) || /athlete/i.test(c?.type || '')) candidatos.push(c);
    }));
    const alvo = normNome(nome);
    const alvoTokens = alvo.split(/\s+/).filter(Boolean);
    const match = candidatos.find(c => {
      const cand = normNome(c.displayName || '');
      return alvoTokens.length > 0 && alvoTokens.every(t => cand.indexOf(t) >= 0);
    });
    if (!match) return res.status(200).json({ ok: false });

    const idMatch = String(match.id || match?.link?.web?.href || '').match(/\/id\/(\d+)/) || [null, match.id];
    const id = idMatch[1] || match.id;
    const base = {
      ok: true,
      nome: match.displayName || nome,
      clube: match.subtitle || '',
      foto: match?.image?.default || '',
      idade: null, altura: '', peso: '', nascimento: ''
    };
    if (!id) return res.status(200).json(base);

    try {
      const oR = await fetch(`https://site.web.api.espn.com/apis/common/v3/sports/soccer/athletes/${id}`, opts);
      if (oR.ok) {
        const oD = await oR.json();
        const ath = oD?.athlete || oD;
        if (ath && typeof ath === 'object') {
          if (ath.age) base.idade = Number(ath.age) || null;
          if (ath.displayHeight) base.altura = ath.displayHeight;
          if (ath.displayWeight) base.peso = ath.displayWeight;
          if (ath.birthPlace) base.nascimento = [ath.birthPlace.city, ath.birthPlace.country].filter(Boolean).join(', ');
          if (ath.team?.displayName) base.clube = ath.team.displayName;
          if (ath.headshot?.href) base.foto = ath.headshot.href;
        }
      }
    } catch (_) { /* mantém dados básicos da busca — sem inventar bio */ }

    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(base);
  } catch (err) {
    return res.status(200).json({ ok: false, error: err.message });
  }
}

export default async function handler(req, res) {
  if (req.query.action === 'copa') return handleCopa(req, res);
  if (req.query.action === 'espn') return handleEspn(req, res);
  if (req.query.action === 'jogador') return handleJogador(req, res);
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
