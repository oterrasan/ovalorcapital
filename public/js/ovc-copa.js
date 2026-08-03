/**
 * ovc-copa.js — Radar da Copa 2026 • Widget independente
 * REGRA ZERO-I: 100% independente — não afeta home.js nem ovc-cards.js
 * Injeta bloco Radar da Copa no rail direito (.rail-right), logo após
 * o Radar da Bola (ovc-futebol.js) — que tem prioridade de topo.
 */
(function () {
  'use strict';

  function kwMatch(text, kw) {
    var esc = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(?:^|[^\\p{L}\\p{N}])' + esc + '(?:[^\\p{L}\\p{N}]|$)', 'iu').test(text);
  }

  var COPA_URL = '/copa/';
  var CAT_URL  = '/esportes/';

  // Copa do Mundo 2026 — USA/CAN/MEX — começa 11/jun/2026
  var DATA_INICIO = new Date('2026-06-11T15:00:00-04:00'); // 15h ET = abertura USA×Canadá

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function dataBr(iso) {
    try {
      return new Date(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
    } catch (_) { return ''; }
  }
  function slugify(s) {
    return String(s||'').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g,'')
      .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55);
  }
  function buildHref(p) {
    var cat = p.categoria || 'esportes';
    return '/' + cat + '/' + slugify(p.titulo) + '-' + String(p.id||'').slice(0,8) + '/';
  }

  function injetarCSS() {
    if (document.getElementById('ovc-copa-css')) return;
    var sty = document.createElement('style');
    sty.id = 'ovc-copa-css';
    sty.textContent = [
      '@keyframes copa-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}',
      '@keyframes copa-glow{0%,100%{box-shadow:0 0 4px rgba(255,220,0,.3)}50%{box-shadow:0 0 12px rgba(255,220,0,.7)}}',
      '.ovc-copa-rail{margin-bottom:18px;border-radius:8px;overflow:hidden;',
      '  border:1.5px solid #009c3b;}',
      '.ovc-copa-header{background:linear-gradient(135deg,#009c3b 0%,#006225 60%,#002776 100%);',
      '  padding:12px 14px;position:relative;overflow:hidden;}',
      '.ovc-copa-header::before{content:"⚽";position:absolute;right:-8px;top:-8px;font-size:52px;opacity:.15;',
      '  transform:rotate(-20deg);}',
      '.ovc-copa-live-row{display:flex;align-items:center;gap:6px;margin-bottom:4px;}',
      '.ovc-copa-dot{display:inline-block;width:8px;height:8px;background:#ffdf00;border-radius:50%;',
      '  animation:copa-pulse 1s ease-in-out infinite;flex-shrink:0;}',
      '.ovc-copa-live-txt{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#ffdf00;}',
      '.ovc-copa-title{font-size:14px;font-weight:800;color:#fff;letter-spacing:-.01em;line-height:1.2;}',
      '.ovc-copa-sub{font-size:10px;color:rgba(255,255,255,.7);margin-top:2px;}',
      '.ovc-copa-body{background:var(--bg-elevated,#fff);padding:10px 12px;}',
      '.ovc-copa-countdown{background:linear-gradient(90deg,#009c3b,#002776);padding:10px 12px;',
      '  display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px;}',
      '.ovc-copa-cd-unit{text-align:center;}',
      '.ovc-copa-cd-num{display:block;font-size:20px;font-weight:800;color:#ffdf00;line-height:1;font-variant-numeric:tabular-nums;}',
      '.ovc-copa-cd-label{display:block;font-size:9px;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.08em;margin-top:2px;}',
      '.ovc-copa-article{display:block;padding:9px 0;border-bottom:1px solid var(--border-subtle,#e2e8f0);',
      '  text-decoration:none;transition:padding-left .12s;}',
      '.ovc-copa-article:last-child{border-bottom:none;}',
      '.ovc-copa-article:hover{padding-left:4px;}',
      '.ovc-copa-artitle{font-size:12px;font-weight:600;color:var(--text-main,#0f172a);line-height:1.4;margin-bottom:2px;}',
      '.ovc-copa-artmeta{font-size:10px;color:#009c3b;font-weight:500;}',
      '.ovc-copa-cta{display:flex;align-items:center;justify-content:space-between;',
      '  padding:9px 12px;background:#f0fdf4;border-top:1px solid #bbf7d0;',
      '  text-decoration:none;font-size:11px;font-weight:700;color:#006225;',
      '  transition:background .15s;}',
      '.ovc-copa-cta:hover{background:#dcfce7;}',
    ].join('');
    document.head.appendChild(sty);
  }

  function calcCountdown() {
    var now = Date.now();
    var diff = DATA_INICIO.getTime() - now;
    if (diff <= 0) return null; // Copa já começou
    var d = Math.floor(diff / 86400000);
    var h = Math.floor((diff % 86400000) / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);
    return { d:d, h:h, m:m, s:s };
  }

  function construirBloco(artigos) {
    injetarCSS();

    var bloco = document.createElement('div');
    bloco.className = 'ovc-copa-rail';
    bloco.id = 'ovc-radar-copa';

    // Header
    var header = document.createElement('div');
    header.className = 'ovc-copa-header';
    header.innerHTML =
      '<div class="ovc-copa-live-row">' +
      '<span class="ovc-copa-dot"></span>' +
      '<span class="ovc-copa-live-txt">🏆 Copa do Mundo 2026</span>' +
      '</div>' +
      '<div class="ovc-copa-title">RADAR DA COPA</div>' +
      '<div class="ovc-copa-sub">USA · Canadá · México · 11 jun – 19 jul · ⏰ Horários em Brasília (BRT)</div>';
    bloco.appendChild(header);

    // Countdown ou placar ao vivo
    var cd = calcCountdown();
    if (cd) {
      var cdDiv = document.createElement('div');
      cdDiv.className = 'ovc-copa-countdown';
      cdDiv.id = 'ovc-copa-cd';
      cdDiv.innerHTML =
        '<div class="ovc-copa-cd-unit"><span class="ovc-copa-cd-num" id="ovc-cd-d">' + String(cd.d).padStart(2,'0') + '</span><span class="ovc-copa-cd-label">dias</span></div>' +
        '<div class="ovc-copa-cd-unit"><span class="ovc-copa-cd-num" id="ovc-cd-h">' + String(cd.h).padStart(2,'0') + '</span><span class="ovc-copa-cd-label">horas</span></div>' +
        '<div class="ovc-copa-cd-unit"><span class="ovc-copa-cd-num" id="ovc-cd-m">' + String(cd.m).padStart(2,'0') + '</span><span class="ovc-copa-cd-label">min</span></div>' +
        '<div class="ovc-copa-cd-unit"><span class="ovc-copa-cd-num" id="ovc-cd-s">' + String(cd.s).padStart(2,'0') + '</span><span class="ovc-copa-cd-label">seg</span></div>';
      bloco.appendChild(cdDiv);

      // Atualiza countdown a cada segundo
      setInterval(function () {
        var c2 = calcCountdown();
        if (!c2) {
          var cdEl = document.getElementById('ovc-copa-cd');
          if (cdEl) cdEl.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#ffdf00;font-weight:700;font-size:12px;">⚽ A Copa já começou!</div>';
          return;
        }
        var dEl = document.getElementById('ovc-cd-d');
        var hEl = document.getElementById('ovc-cd-h');
        var mEl = document.getElementById('ovc-cd-m');
        var sEl = document.getElementById('ovc-cd-s');
        if (dEl) dEl.textContent = String(c2.d).padStart(2,'0');
        if (hEl) hEl.textContent = String(c2.h).padStart(2,'0');
        if (mEl) mEl.textContent = String(c2.m).padStart(2,'0');
        if (sEl) sEl.textContent = String(c2.s).padStart(2,'0');
      }, 1000);
    } else {
      // Copa em andamento: mensagem ao vivo
      var vivo = document.createElement('div');
      vivo.style.cssText = 'background:#009c3b;padding:10px 12px;text-align:center;color:#ffdf00;font-weight:700;font-size:12px;letter-spacing:.05em;';
      vivo.textContent = '⚽ COPA AO VIVO — Acompanhe tudo aqui (horários em BRT)';
      bloco.appendChild(vivo);
    }

    // Artigos
    var body = document.createElement('div');
    body.className = 'ovc-copa-body';

    if (artigos.length) {
      artigos.slice(0, 5).forEach(function (p) {
        var a = document.createElement('a');
        a.className = 'ovc-copa-article';
        a.href = buildHref(p);
        a.innerHTML =
          '<div class="ovc-copa-artitle">' + esc(p.titulo) + '</div>' +
          '<div class="ovc-copa-artmeta">⚽ Esportes OVC · ' + dataBr(p.published_at || p.data || p.created_at) + '</div>';
        body.appendChild(a);
      });
    } else {
      body.innerHTML = '<p style="font-size:12px;color:#64748b;margin:0;padding:4px 0;">Cobertura da Copa chegando em breve.</p>';
    }

    bloco.appendChild(body);

    // CTA
    var cta = document.createElement('a');
    cta.href = COPA_URL;
    cta.className = 'ovc-copa-cta';
    cta.innerHTML = '🏆 Cobertura completa da Copa 2026 <span>→</span>';
    bloco.appendChild(cta);

    return bloco;
  }

  function injetar(artigos) {
    var rail = document.querySelector('.rail-right');
    if (!rail) return;
    var bloco = construirBloco(artigos);
    // Radar da Bola (ovc-futebol.js) tem prioridade de topo — se já estiver
    // no ar, a Copa entra logo depois dele, nunca na frente.
    var futebolBlock = rail.querySelector('#ovc-radar-futebol');
    if (futebolBlock) {
      rail.insertBefore(bloco, futebolBlock.nextSibling);
    } else {
      rail.insertBefore(bloco, rail.firstChild);
    }
  }

  var COPA_KEYWORDS = ['copa do mundo','world cup','mundial','fifa','seleção brasileira','copa 2026','fase de grupos','oitavas','quartas','semifinal','final da copa','campeão do mundo','grupo a','grupo b','grupo c','grupo d','grupo e','grupo f','grupo g','grupo h','eliminado da copa','classificado para'];

  function init() {
    Promise.all([
      fetch('/api/portal-posts?curtinhas=true&categoria=esportes&limit=30').then(function(r){ return r.json(); }).catch(function(){ return {curtinhas:[]}; }),
      fetch('/api/portal-posts?recentes=true&limit=300').then(function(r){ return r.json(); }).catch(function(){ return {posts:[]}; })
    ]).then(function(results) {
      var todosCurtinhas = results[0].curtinhas || [];
      var todosArtigos   = results[1].posts    || [];

      // Curtinhas Copa: radar ou pílula com Copa no título
      var copaCurtinhas = todosCurtinhas.filter(function(n) {
        var tipo = n.tipo_conteudo || n.tipo || '';
        if (tipo !== 'radar' && tipo !== 'pilula' && tipo !== 'micropilula') return false;
        var t = (n.titulo || '').toLowerCase();
        return COPA_KEYWORDS.some(function(kw) { return kwMatch(t, kw); });
      });

      // Artigos normais Copa (sem repetir o que já é curtinha)
      var idsCurtinhas = {};
      copaCurtinhas.forEach(function(n){ idsCurtinhas[n.id] = true; });
      var artigosNormais = todosArtigos.filter(function(p) {
        if (idsCurtinhas[p.id]) return false;
        var titulo = (p.titulo || '').toLowerCase();
        return COPA_KEYWORDS.some(function(kw) { return kwMatch(titulo, kw); });
      });

      // Curtinhas primeiro (mais recentes e específicas), depois artigos normais
      var artigos = copaCurtinhas.concat(artigosNormais).slice(0, 5);
      injetar(artigos);
    }).catch(function() {
      injetar([]);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
