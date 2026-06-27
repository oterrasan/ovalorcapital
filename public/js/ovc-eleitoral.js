/**
 * ovc-eleitoral.js — Radar Eleitoral 2026 • Widget independente
 * REGRA ZERO-I: 100% independente — não afeta home.js nem ovc-cards.js
 * Injeta bloco Radar Eleitoral no rail esquerdo (.rail-left)
 */
(function () {
  'use strict';

  var ELEICAO_URL  = '/politica/';
  var PESQUISAS_URL = '/politica/';

  // 1º turno: 4 out 2026
  var DATA_1T = new Date('2026-10-04T00:00:00-03:00');
  // 2º turno: 25 out 2026
  var DATA_2T = new Date('2026-10-25T00:00:00-03:00');

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function dataBr(iso) {
    try {
      return new Date(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'short' });
    } catch (_) { return ''; }
  }
  function slugify(s) {
    return String(s||'').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g,'')
      .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55);
  }
  function buildHref(p) {
    var cat = p.categoria || 'politica';
    return '/' + cat + '/' + slugify(p.titulo) + '-' + String(p.id||'').slice(0,8) + '/';
  }
  function diasAte(data) {
    var diff = data.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  }

  function injetarCSS() {
    if (document.getElementById('ovc-eleitoral-css')) return;
    var sty = document.createElement('style');
    sty.id = 'ovc-eleitoral-css';
    sty.textContent = [
      '@keyframes el-pulse{0%,100%{opacity:1}50%{opacity:.3}}',
      '.ovc-eleitoral-rail{margin-top:18px;border-radius:8px;overflow:hidden;',
      '  border:1.5px solid #1d4ed8;}',
      '.ovc-el-header{background:linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 60%,#7c3aed 100%);',
      '  padding:12px 14px;position:relative;overflow:hidden;}',
      '.ovc-el-header::before{content:"🗳️";position:absolute;right:-4px;top:-4px;font-size:46px;opacity:.15;}',
      '.ovc-el-live-row{display:flex;align-items:center;gap:6px;margin-bottom:4px;}',
      '.ovc-el-dot{display:inline-block;width:7px;height:7px;background:#fbbf24;border-radius:50%;',
      '  animation:el-pulse 1.4s ease-in-out infinite;flex-shrink:0;}',
      '.ovc-el-live-txt{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#fbbf24;}',
      '.ovc-el-title{font-size:14px;font-weight:800;color:#fff;letter-spacing:-.01em;line-height:1.2;}',
      '.ovc-el-sub{font-size:10px;color:rgba(255,255,255,.7);margin-top:2px;}',
      '.ovc-el-countdown{background:#1e3a8a;padding:10px 12px;display:grid;grid-template-columns:1fr 1fr;gap:8px;}',
      '.ovc-el-cd-bloco{background:rgba(255,255,255,.08);border-radius:6px;padding:8px 10px;text-align:center;}',
      '.ovc-el-cd-label{font-size:9px;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.07em;display:block;margin-bottom:4px;}',
      '.ovc-el-cd-dias{font-size:22px;font-weight:800;color:#fbbf24;display:block;font-variant-numeric:tabular-nums;line-height:1;}',
      '.ovc-el-cd-tipo{font-size:9px;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.06em;display:block;margin-top:2px;}',
      '.ovc-el-pesquisas{background:var(--bg-elevated,#fff);padding:10px 12px;border-bottom:1px solid #e2e8f0;}',
      '.ovc-el-pesq-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#1d4ed8;margin-bottom:8px;}',
      '.ovc-el-barra-row{margin-bottom:7px;}',
      '.ovc-el-barra-label{display:flex;justify-content:space-between;margin-bottom:3px;}',
      '.ovc-el-nome{font-size:11px;font-weight:600;color:var(--text-main,#0f172a);}',
      '.ovc-el-pct{font-size:11px;font-weight:700;color:#1d4ed8;}',
      '.ovc-el-barra{height:6px;border-radius:3px;background:#e2e8f0;overflow:hidden;}',
      '.ovc-el-fill{height:100%;border-radius:3px;transition:width .6s ease;}',
      '.ovc-el-pesq-fonte{font-size:9px;color:#94a3b8;margin-top:6px;}',
      '.ovc-el-body{background:var(--bg-elevated,#fff);padding:10px 12px;}',
      '.ovc-el-sec-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:8px;}',
      '.ovc-el-article{display:block;padding:8px 0;border-bottom:1px solid var(--border-subtle,#e2e8f0);',
      '  text-decoration:none;transition:padding-left .12s;}',
      '.ovc-el-article:last-child{border-bottom:none;}',
      '.ovc-el-article:hover{padding-left:4px;}',
      '.ovc-el-artitle{font-size:12px;font-weight:600;color:var(--text-main,#0f172a);line-height:1.4;margin-bottom:2px;}',
      '.ovc-el-artmeta{font-size:10px;color:#64748b;}',
      '.ovc-el-cta{display:flex;align-items:center;justify-content:space-between;',
      '  padding:9px 12px;background:#eff6ff;border-top:1px solid #bfdbfe;',
      '  text-decoration:none;font-size:11px;font-weight:700;color:#1e3a8a;transition:background .15s;}',
      '.ovc-el-cta:hover{background:#dbeafe;}',
    ].join('');
    document.head.appendChild(sty);
  }

  var PESQUISAS_DEFAULT = [
    { nome: 'Lula', pct: 37, cor: '#e11d48' },
    { nome: 'Bolsonaro', pct: 29, cor: '#2563eb' },
    { nome: 'Outros', pct: 34, cor: '#94a3b8' }
  ];
  var FONTE_DEFAULT = 'Quaest / Datafolha — jun/2026';

  function construirBloco(artigos, pesquisaData) {
    injetarCSS();

    var bloco = document.createElement('div');
    bloco.className = 'ovc-eleitoral-rail';
    bloco.id = 'ovc-radar-eleitoral';

    // Header
    var header = document.createElement('div');
    header.className = 'ovc-el-header';
    header.innerHTML =
      '<div class="ovc-el-live-row"><span class="ovc-el-dot"></span><span class="ovc-el-live-txt">🗳️ Eleições 2026</span></div>' +
      '<div class="ovc-el-title">RADAR ELEITORAL</div>' +
      '<div class="ovc-el-sub">Presidencial · Governadores · Senado</div>';
    bloco.appendChild(header);

    // Countdown duplo: 1T e 2T
    var d1 = diasAte(DATA_1T);
    var d2 = diasAte(DATA_2T);
    var cd = document.createElement('div');
    cd.className = 'ovc-el-countdown';
    cd.innerHTML =
      '<div class="ovc-el-cd-bloco">' +
      '<span class="ovc-el-cd-label">1º Turno</span>' +
      '<span class="ovc-el-cd-dias">' + d1 + '</span>' +
      '<span class="ovc-el-cd-tipo">dias</span>' +
      '</div>' +
      '<div class="ovc-el-cd-bloco">' +
      '<span class="ovc-el-cd-label">2º Turno</span>' +
      '<span class="ovc-el-cd-dias">' + d2 + '</span>' +
      '<span class="ovc-el-cd-tipo">dias</span>' +
      '</div>';
    bloco.appendChild(cd);

    // Pesquisas eleitorais
    var candidatos = (pesquisaData && pesquisaData.candidatos) || PESQUISAS_DEFAULT;
    var fonte = (pesquisaData && pesquisaData.fonte) || FONTE_DEFAULT;

    var pesqDiv = document.createElement('div');
    pesqDiv.className = 'ovc-el-pesquisas';
    pesqDiv.innerHTML = '<div class="ovc-el-pesq-title">Intenção de voto — Presidencial</div>';
    candidatos.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'ovc-el-barra-row';
      row.innerHTML =
        '<div class="ovc-el-barra-label"><span class="ovc-el-nome">' + esc(item.nome) + '</span><span class="ovc-el-pct">' + item.pct + '%</span></div>' +
        '<div class="ovc-el-barra"><div class="ovc-el-fill" style="width:' + item.pct + '%;background:' + item.cor + ';"></div></div>';
      pesqDiv.appendChild(row);
    });
    var fonteDiv = document.createElement('div');
    fonteDiv.className = 'ovc-el-pesq-fonte';
    fonteDiv.textContent = 'Fonte: ' + (fonte || '');
    pesqDiv.appendChild(fonteDiv);
    bloco.appendChild(pesqDiv);

    // Artigos políticos
    var body = document.createElement('div');
    body.className = 'ovc-el-body';
    body.innerHTML = '<div class="ovc-el-sec-title">Cobertura eleitoral OVC</div>';

    if (artigos.length) {
      artigos.slice(0, 5).forEach(function (p) {
        var a = document.createElement('a');
        a.className = 'ovc-el-article';
        a.href = buildHref(p);
        a.innerHTML =
          '<div class="ovc-el-artitle">' + esc(p.titulo) + '</div>' +
          '<div class="ovc-el-artmeta">🗳️ Política OVC · ' + dataBr(p.published_at || p.data || p.created_at) + '</div>';
        body.appendChild(a);
      });
    } else {
      body.innerHTML += '<p style="font-size:12px;color:#64748b;margin:0;padding:4px 0;">Cobertura eleitoral chegando em breve.</p>';
    }

    bloco.appendChild(body);

    // CTA
    var cta = document.createElement('a');
    cta.href = ELEICAO_URL;
    cta.className = 'ovc-el-cta';
    cta.innerHTML = '🗳️ Cobertura eleitoral completa <span>→</span>';
    bloco.appendChild(cta);

    return bloco;
  }

  function injetar(artigos, pesquisaData) {
    var rail = document.querySelector('.rail-right');
    if (!rail) return;
    var bloco = construirBloco(artigos, pesquisaData);
    // Inserir antes do bloco Radar Mercados (exatamente onde ficava a TV OVC)
    var radarMercados = rail.querySelector('[data-home-radar-link]');
    if (radarMercados) {
      rail.insertBefore(bloco, radarMercados);
    } else {
      rail.appendChild(bloco);
    }
  }

  function init() {
    var EL_KEYWORDS = ['eleição','eleições','candidat','presidencial','eleitoral','voto','urna','tse','pleito','campanha eleitoral','pesquisa eleitoral','datafolha','quaest','ipespe','intenção de voto','debate presidencial','chapa','coligação','programa de governo','registro de candidatura','primeiro turno','segundo turno','governador','senado federal','câmara dos deputados','vereador','prefeito'];

    // Busca pesquisa e artigos em paralelo
    Promise.all([
      fetch('/api/manage?action=get_pesquisa_eleitoral').then(function(r){ return r.json(); }).catch(function(){ return null; }),
      fetch('/api/portal-posts?recentes=true&limit=300').then(function(r){ return r.json(); }).catch(function(){ return { posts: [] }; })
    ]).then(function(results) {
      var pesquisaData = (results[0] && results[0].pesquisa) || null;
      var todos = (results[1] && results[1].posts) || [];
      var artigos = todos.filter(function (p) {
        var titulo = (p.titulo || '').toLowerCase();
        return EL_KEYWORDS.some(function (kw) { return titulo.indexOf(kw) >= 0; });
      });
      injetar(artigos, pesquisaData);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
