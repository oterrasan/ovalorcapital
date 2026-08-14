/**
 * ovc-pulso-br.js — Pulso BR • Widget independente de Economia Nacional
 * REGRA ZERO-I: 100% independente — não toca em home.js, ovc-cards.js,
 * ovc-eleitoral.js nem ovc-radar-esporte.js. Nenhum dos outros widgets lê
 * ou escreve nada deste arquivo, e vice-versa.
 *
 * Pedido de Roberto (14/08/2026): "coloca ele de uma maneira diferente no
 * portal. no rail talvez. tipo um widget diferentao no rail esquerdo, logo
 * abaixo do radar da eleicao... mapeie tudo no economia nacional, nao
 * internacoipnal, so brasil... quero uma coisa realmente diferente... quero
 * que voce exagere neste layout... plugada em fontes primarias ou fontes
 * confiaveis e monitorando em tempo real, 24horas."
 *
 * Fontes dos vitais (via /api/portal-posts?format=live-data, endpoint já
 * existente estendido nesta sessão — zero cron novo, zero custo novo):
 *   - Selic (meta) e IPCA acum. 12m  → Banco Central do Brasil, API SGS oficial
 *   - Dólar, Euro                    → AwesomeAPI
 *   - Ibovespa                       → brapi.dev
 *   - Impostômetro                   → cálculo local (sempre real, sem dependência externa)
 * Atualização client-side a cada 60s (poll no endpoint on-demand — não é
 * automação de backend nova, é o mesmo padrão já usado pelo ticker do header
 * em site.js).
 *
 * Termômetro setorial: classificação client-side, por palavra-chave, dos
 * artigos reais mais recentes de economia/negócios do próprio banco do OVC
 * (via /api/portal-posts?recentes=true) — nenhum dado inventado, nenhuma
 * nova automação de geração de conteúdo.
 */
(function () {
  'use strict';

  var PULSO_URL = '/pulso-br/';

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function slugify(s) {
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 55);
  }
  function buildHref(p) {
    var cat = p.categoria || 'economia';
    return '/' + cat + '/' + slugify(p.titulo) + '-' + String(p.id || '').slice(0, 8) + '/';
  }
  function kwMatch(text, kw) {
    var re = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(?:^|[^\\p{L}\\p{N}])' + re + '(?:[^\\p{L}\\p{N}]|$)', 'iu').test(text);
  }
  function fmtNum(n, casas) {
    if (n == null || !isFinite(n)) return '—';
    return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
  }
  function fmtBig(n) {
    if (n == null || !isFinite(n)) return 'R$ —';
    return 'R$ ' + Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  }

  var SETORES = [
    { key: 'agro',       label: 'Agronegócio',   icon: '🌾', kw: ['agronegócio','soja','milho','safra','commodities agrícolas','embrapa','conab','fertilizante','pecuária','agro '] },
    { key: 'industria',  label: 'Indústria',      icon: '🏭', kw: ['indústria','industrial','manufatura','fiesp','cni ','produção industrial','fábrica','chão de fábrica'] },
    { key: 'varejo',     label: 'Varejo & Consumo', icon: '🛒', kw: ['varejo','consumo','vendas no varejo','black friday','shopping','e-commerce','inflação de alimentos'] },
    { key: 'energia',    label: 'Energia',        icon: '⚡', kw: ['petrobras','energia elétrica','combustível','gasolina','diesel','aneel','ons ','petróleo','pré-sal'] },
    { key: 'financeiro', label: 'Sistema Financeiro', icon: '🏦', kw: ['banco central','febraban','crédito','inadimplência','juros bancários','fintech','b3 ','bolsa de valores'] },
    { key: 'trabalho',   label: 'Emprego & Renda', icon: '👷', kw: ['caged','desemprego','carteira assinada','salário mínimo','mercado de trabalho','emprego formal'] },
    { key: 'fiscal',     label: 'Contas Públicas', icon: '📑', kw: ['déficit','superávit','arcabouço fiscal','dívida pública','orçamento da união','tesouro nacional','meta fiscal'] },
    { key: 'cambio',     label: 'Câmbio & Comércio Ext.', icon: '🌐', kw: ['balança comercial','exportação','importação','câmbio','dólar comercial','superávit comercial'] }
  ];

  function classificarSetor(titulo) {
    var t = (titulo || '').toLowerCase();
    for (var i = 0; i < SETORES.length; i++) {
      var s = SETORES[i];
      for (var j = 0; j < s.kw.length; j++) {
        if (kwMatch(t, s.kw[j].trim())) return s.key;
      }
    }
    return null;
  }

  function injetarCSS() {
    if (document.getElementById('ovc-pulso-br-css')) return;
    var css = [
      '.ovc-pulso-br{position:relative;overflow:hidden;border-radius:14px;',
      '  background:linear-gradient(165deg,#12140f 0%,#1a1c14 55%,#0d0e0a 120%);',
      '  border:1.5px solid #3a3420;box-shadow:0 10px 32px rgba(0,0,0,.28);',
      '  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;margin:0 0 18px;}',

      '.ovc-pb-header{position:relative;padding:16px 16px 13px;',
      '  background:linear-gradient(120deg,#8a6d1f 0%,#5c4a15 55%,#12140f 130%);overflow:hidden;}',
      '.ovc-pb-header::after{content:"";position:absolute;inset:0;',
      '  background:repeating-linear-gradient(-45deg,rgba(255,255,255,.05) 0 2px,transparent 2px 14px);pointer-events:none;}',
      '.ovc-pb-sweep{position:absolute;top:0;left:-40%;width:40%;height:100%;',
      '  background:linear-gradient(90deg,transparent,rgba(255,255,255,.10),transparent);',
      '  animation:ovcPbSweep 4.5s ease-in-out infinite;}',
      '@keyframes ovcPbSweep{0%{left:-40%;}100%{left:120%;}}',
      '.ovc-pb-badge{position:relative;display:inline-flex;align-items:center;gap:6px;',
      '  font-size:10.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#fff7dd;',
      '  background:rgba(0,0,0,.28);padding:4px 10px;border-radius:20px;margin-bottom:8px;}',
      '.ovc-pb-dot{width:7px;height:7px;border-radius:50%;background:#4ade80;',
      '  box-shadow:0 0 0 0 rgba(74,222,128,.65);animation:ovcPbPulse 1.8s infinite;}',
      '@keyframes ovcPbPulse{0%{box-shadow:0 0 0 0 rgba(74,222,128,.55);}70%{box-shadow:0 0 0 7px rgba(74,222,128,0);}100%{box-shadow:0 0 0 0 rgba(74,222,128,0);}}',
      '.ovc-pb-title{position:relative;font-size:20px;font-weight:900;color:#fff;margin:0 0 2px;',
      '  letter-spacing:-.01em;text-shadow:0 2px 10px rgba(0,0,0,.4);}',
      '.ovc-pb-sub{position:relative;font-size:11.5px;color:#f2e6bd;font-weight:600;opacity:.92;}',

      '.ovc-pb-vitals{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#2a2617;}',
      '.ovc-pb-vital{background:#14150f;padding:11px 12px;position:relative;}',
      '.ovc-pb-vital-label{font-size:9.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;',
      '  color:#a89968;margin-bottom:3px;}',
      '.ovc-pb-vital-val{font-family:"SF Mono",ui-monospace,"Courier New",monospace;font-size:16px;',
      '  font-weight:800;color:#fef3c7;letter-spacing:-.01em;line-height:1.15;}',
      '.ovc-pb-vital-trend{font-family:ui-monospace,monospace;font-size:10.5px;font-weight:700;margin-top:2px;}',
      '.ovc-pb-trend-up{color:#f87171;}',
      '.ovc-pb-trend-down{color:#4ade80;}',
      '.ovc-pb-trend-flat{color:#94a3b8;}',
      '.ovc-pb-vital-wide{grid-column:1/3;display:flex;align-items:center;justify-content:space-between;',
      '  background:#191a12;padding:10px 12px;}',
      '.ovc-pb-vital-wide .ovc-pb-vital-label{margin:0;}',
      '.ovc-pb-vital-wide .ovc-pb-vital-val{font-size:15px;}',

      '.ovc-pb-setores{padding:12px 12px 4px;}',
      '.ovc-pb-setores-title{font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;',
      '  color:#8a7c50;margin:0 0 8px;}',
      '.ovc-pb-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;}',
      '.ovc-pb-setor{display:block;text-decoration:none;background:#191a12;border:1px solid #2e2a19;',
      '  border-radius:9px;padding:8px 9px;transition:border-color .15s,transform .15s;}',
      '.ovc-pb-setor:hover{border-color:#8a6d1f;transform:translateY(-1px);}',
      '.ovc-pb-setor-top{display:flex;align-items:center;gap:5px;margin-bottom:3px;}',
      '.ovc-pb-setor-icon{font-size:13px;}',
      '.ovc-pb-setor-label{font-size:10px;font-weight:700;color:#e5d8ab;letter-spacing:.01em;}',
      '.ovc-pb-setor-headline{font-size:10.5px;color:#9c957a;line-height:1.3;',
      '  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
      '.ovc-pb-setor-empty{font-size:10px;color:#5c5638;font-style:italic;}',

      '.ovc-pb-cta{display:flex;align-items:center;justify-content:space-between;margin:12px 12px 12px;',
      '  padding:11px 14px;background:linear-gradient(90deg,#8a6d1f,#b8923a);border-radius:10px;',
      '  text-decoration:none;font-size:12.5px;font-weight:800;color:#171407;}',
      '.ovc-pb-cta span{font-size:15px;}',
      '.ovc-pb-cta:hover{background:linear-gradient(90deg,#9c7c26,#caa348);}',
      '.ovc-pb-updated{padding:0 14px 10px;font-size:9px;color:#5c5638;text-align:right;}'
    ].join('');
    var tag = document.createElement('style');
    tag.id = 'ovc-pulso-br-css';
    tag.textContent = css;
    document.head.appendChild(tag);
  }

  function trendClass(v) {
    if (v == null) return 'ovc-pb-trend-flat';
    if (v > 0) return 'ovc-pb-trend-up';
    if (v < 0) return 'ovc-pb-trend-down';
    return 'ovc-pb-trend-flat';
  }
  function trendArrow(v) {
    if (v == null) return '—';
    if (v > 0) return '▲ ' + fmtNum(Math.abs(v), 2) + '%';
    if (v < 0) return '▼ ' + fmtNum(Math.abs(v), 2) + '%';
    return '· estável';
  }

  function renderVitals(live) {
    var selic = live && live.selic;
    var ipca = live && live.ipca;
    var usd = live && live.usd;
    var ibov = live && live.ibov;
    var impost = live && live.impostometro;

    var html = '';
    html += '<div class="ovc-pb-vital">';
    html += '  <div class="ovc-pb-vital-label">Selic (meta)</div>';
    html += '  <div class="ovc-pb-vital-val">' + (selic ? fmtNum(selic.valor, 2) + '%' : '—') + '</div>';
    html += '  <div class="ovc-pb-vital-trend ' + trendClass(selic ? selic.variacao : null) + '">' + (selic ? trendArrow(selic.variacao) : 'aguardando') + '</div>';
    html += '</div>';

    html += '<div class="ovc-pb-vital">';
    html += '  <div class="ovc-pb-vital-label">IPCA 12 meses</div>';
    html += '  <div class="ovc-pb-vital-val">' + (ipca ? fmtNum(ipca.valor, 2) + '%' : '—') + '</div>';
    html += '  <div class="ovc-pb-vital-trend ' + trendClass(ipca ? ipca.variacao : null) + '">' + (ipca ? trendArrow(ipca.variacao) : 'aguardando') + '</div>';
    html += '</div>';

    html += '<div class="ovc-pb-vital">';
    html += '  <div class="ovc-pb-vital-label">Dólar comercial</div>';
    html += '  <div class="ovc-pb-vital-val">' + (usd ? 'R$ ' + fmtNum(usd.valor, 3) : '—') + '</div>';
    html += '  <div class="ovc-pb-vital-trend ' + trendClass(usd ? usd.variacao : null) + '">' + (usd ? trendArrow(usd.variacao) : 'aguardando') + '</div>';
    html += '</div>';

    html += '<div class="ovc-pb-vital">';
    html += '  <div class="ovc-pb-vital-label">Ibovespa</div>';
    html += '  <div class="ovc-pb-vital-val">' + (ibov ? fmtNum(ibov.valor, 0) + ' pts' : '—') + '</div>';
    html += '  <div class="ovc-pb-vital-trend ' + trendClass(ibov ? ibov.variacao : null) + '">' + (ibov ? trendArrow(ibov.variacao) : 'aguardando') + '</div>';
    html += '</div>';

    html += '<div class="ovc-pb-vital-wide">';
    html += '  <div>';
    html += '    <div class="ovc-pb-vital-label">Impostômetro 2026 (ao vivo)</div>';
    html += '    <div class="ovc-pb-vital-val" data-pb-impostometro="1">' + fmtBig(impost) + '</div>';
    html += '  </div>';
    html += '  <div style="font-size:9px;color:#8a7c50;text-align:right;">arrecadação<br>desde 01/jan</div>';
    html += '</div>';

    return html;
  }

  function renderSetores(porSetor) {
    var html = '<div class="ovc-pb-setores">';
    html += '<div class="ovc-pb-setores-title">Termômetro Setorial</div>';
    html += '<div class="ovc-pb-grid">';
    for (var i = 0; i < SETORES.length; i++) {
      var s = SETORES[i];
      var artigo = porSetor[s.key];
      if (artigo) {
        html += '<a class="ovc-pb-setor" href="' + buildHref(artigo) + '">';
        html += '  <div class="ovc-pb-setor-top"><span class="ovc-pb-setor-icon">' + s.icon + '</span><span class="ovc-pb-setor-label">' + esc(s.label) + '</span></div>';
        html += '  <div class="ovc-pb-setor-headline">' + esc(artigo.titulo) + '</div>';
        html += '</a>';
      } else {
        html += '<div class="ovc-pb-setor">';
        html += '  <div class="ovc-pb-setor-top"><span class="ovc-pb-setor-icon">' + s.icon + '</span><span class="ovc-pb-setor-label">' + esc(s.label) + '</span></div>';
        html += '  <div class="ovc-pb-setor-empty">sem novidade agora</div>';
        html += '</div>';
      }
    }
    html += '</div></div>';
    return html;
  }

  function construirBloco(live, porSetor) {
    var bloco = document.createElement('div');
    bloco.className = 'ovc-pulso-br';
    bloco.id = 'ovc-pulso-br';

    var header = document.createElement('div');
    header.className = 'ovc-pb-header';
    header.innerHTML =
      '<div class="ovc-pb-sweep"></div>' +
      '<div class="ovc-pb-badge"><span class="ovc-pb-dot"></span>PULSO BR · AO VIVO</div>' +
      '<div class="ovc-pb-title">🇧🇷 Pulso BR</div>' +
      '<div class="ovc-pb-sub">O termômetro da economia nacional, 24 horas por dia</div>';
    bloco.appendChild(header);

    var vitals = document.createElement('div');
    vitals.className = 'ovc-pb-vitals';
    vitals.setAttribute('data-pb-vitals', '1');
    vitals.innerHTML = renderVitals(live);
    bloco.appendChild(vitals);

    var setoresWrap = document.createElement('div');
    setoresWrap.setAttribute('data-pb-setores', '1');
    setoresWrap.innerHTML = renderSetores(porSetor);
    bloco.appendChild(setoresWrap);

    var cta = document.createElement('a');
    cta.href = PULSO_URL;
    cta.className = 'ovc-pb-cta';
    cta.innerHTML = 'Abrir o painel completo do Pulso BR <span>→</span>';
    bloco.appendChild(cta);

    var updated = document.createElement('div');
    updated.className = 'ovc-pb-updated';
    updated.setAttribute('data-pb-updated', '1');
    updated.textContent = 'atualizado agora';
    bloco.appendChild(updated);

    return bloco;
  }

  function injetar(live, porSetor) {
    var rail = document.querySelector('.rail-left');
    if (!rail) return null;
    var bloco = construirBloco(live, porSetor);
    var eleitoral = document.getElementById('ovc-radar-eleitoral');
    if (eleitoral && eleitoral.parentNode === rail) {
      // Sempre logo ABAIXO do Radar Eleitoral, nunca disputa o topo do rail
      if (eleitoral.nextSibling) rail.insertBefore(bloco, eleitoral.nextSibling);
      else rail.appendChild(bloco);
    } else {
      // Radar Eleitoral ainda não injetou (corrida de fetch) — entra no topo;
      // quando o Eleitoral injetar depois, ele mesmo sempre reivindica o
      // primeiro lugar (rail.firstChild), então o Pulso BR acaba empurrado
      // para a posição certa de qualquer forma.
      rail.insertBefore(bloco, rail.firstChild);
    }
    return bloco;
  }

  function atualizarVitals(bloco, live) {
    var el = bloco.querySelector('[data-pb-vitals]');
    if (el) el.innerHTML = renderVitals(live);
    var upd = bloco.querySelector('[data-pb-updated]');
    if (upd) {
      var agora = new Date();
      upd.textContent = 'atualizado às ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
  }

  function buscarLive() {
    return fetch('/api/portal-posts?format=live-data').then(function (r) { return r.json(); }).catch(function () { return null; });
  }
  function buscarSetores() {
    return fetch('/api/portal-posts?recentes=true&limit=300').then(function (r) { return r.json(); }).then(function (d) {
      var todos = (d && d.posts) || [];
      var porSetor = {};
      for (var i = 0; i < todos.length; i++) {
        var p = todos[i];
        if (p.categoria !== 'economia' && p.categoria !== 'negocios' && p.categoria !== 'financas') continue;
        var setor = classificarSetor(p.titulo);
        if (setor && !porSetor[setor]) porSetor[setor] = p;
      }
      return porSetor;
    }).catch(function () { return {}; });
  }

  function init() {
    injetarCSS();
    Promise.all([buscarLive(), buscarSetores()]).then(function (results) {
      var live = results[0];
      var porSetor = results[1] || {};
      var bloco = injetar(live, porSetor);
      if (!bloco) return;

      // Vitais ao vivo — poll a cada 60s (mesmo padrão do ticker do header
      // em site.js, reaproveitando o endpoint on-demand já existente).
      setInterval(function () {
        buscarLive().then(function (novo) {
          if (novo) atualizarVitals(bloco, novo);
        });
      }, 60000);

      // Termômetro setorial — refresh a cada 3min (mesma cadência do
      // ovc-minuto-widget.js para conteúdo econômico).
      setInterval(function () {
        buscarSetores().then(function (novoPorSetor) {
          var el = bloco.querySelector('[data-pb-setores]');
          if (el) el.innerHTML = renderSetores(novoPorSetor);
        });
      }, 180000);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
