/**
 * ovc-nichos.js — Blocos de nichos OVC na home
 * REGRA ZERO-I: este arquivo é 100% independente do home.js e ovc-cards.js
 * Se este arquivo falhar, os cards da home continuam funcionando normalmente.
 *
 * Layout:
 * - Radar OVC  → sidebar direito (.ovc-right-rail), compacto com ponto piscando
 * - Minuto OVC → 3 mini-cards horizontais entre blocos do miolo
 * - Pílulas    → 3 mini-cards horizontais antes do último bloco do miolo
 */
(function () {
  'use strict';

  function kwMatch(text, kw) {
    var esc = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(?:^|[^\\p{L}\\p{N}])' + esc + '(?:[^\\p{L}\\p{N}]|$)', 'iu').test(text);
  }

  // ── Aguarda o miolo estar pronto (ovc-cards.js termina primeiro) ─────────────
  function esperarMiolo(cb) {
    var tentativas = 0;
    var timer = setInterval(function () {
      tentativas++;
      var miolo = document.querySelector('.ovc-miolo');
      if (miolo) { clearInterval(timer); cb(miolo); return; }
      if (tentativas > 40) clearInterval(timer);
    }, 100);
  }

  // ── Busca os nichos da API ───────────────────────────────────────────────────
  function buscarNichos(cb) {
    fetch('/api/portal-posts?curtinhas=true&limit=30')
      .then(function (r) { return r.json(); })
      .then(function (d) { cb(null, d.curtinhas || []); })
      .catch(function (e) { cb(e, []); });
  }

  // ── Utilitários ─────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function dataBr(iso) {
    try {
      return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    } catch (_) { return ''; }
  }
  function slugify(s) {
    return String(s||'').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g,'')
      .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55);
  }
  function buildHref(p) {
    return '/' + p.categoria + '/' + slugify(p.titulo) + '-' + p.id.slice(0,8) + '/';
  }

  // ── Injeta CSS global (uma vez) ───────────────────────────────────────────────
  function injetarCSS() {
    if (document.getElementById('ovc-nichos-css')) return;
    var sty = document.createElement('style');
    sty.id = 'ovc-nichos-css';
    sty.textContent = [
      '@keyframes ovc-pulse{0%,100%{opacity:1}50%{opacity:.25}}',
      '.ovc-minirow{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}',
      '@media(max-width:700px){.ovc-minirow{grid-template-columns:1fr;}}',
      '@media(max-width:1000px) and (min-width:701px){.ovc-minirow{grid-template-columns:repeat(2,1fr);}}'
    ].join('');
    document.head.appendChild(sty);
  }

  // ── Bloco RADAR no right rail — lista compacta ───────────────────────────────
  function criarBlocoRadarRail(items) {
    if (!items.length) return null;

    var bloco = document.createElement('section');
    bloco.id = 'ovc-nicho-radar-rail';
    bloco.style.cssText = 'margin-top:22px;padding-top:14px;border-top:2px solid #dc2626;';

    var header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:10px;';
    header.innerHTML =
      '<span style="display:inline-block;width:7px;height:7px;background:#dc2626;border-radius:50%;' +
      'animation:ovc-pulse 1.2s ease-in-out infinite;flex-shrink:0;"></span>' +
      '<span style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#dc2626;">RADAR OVC</span>';
    bloco.appendChild(header);

    items.slice(0, 4).forEach(function (p) {
      var item = document.createElement('a');
      item.href = buildHref(p);
      item.style.cssText =
        'display:block;padding:8px 0;border-bottom:1px solid #fecaca;text-decoration:none;' +
        'transition:padding-left .12s;';
      item.onmouseover = function(){ this.style.paddingLeft='4px'; };
      item.onmouseout  = function(){ this.style.paddingLeft='0'; };
      item.innerHTML =
        '<div style="font-size:12px;font-weight:600;color:#991b1b;line-height:1.4;margin-bottom:3px;">' +
        esc(p.titulo) + '</div>' +
        '<div style="font-size:10px;color:#b91c1c;font-weight:500;">' + dataBr(p.data) + '</div>';
      bloco.appendChild(item);
    });

    return bloco;
  }

  // ── Linha de 3 mini-cards horizontais ─────────────────────────────────────────
  function criarLinhaMiniCards(items, cfg) {
    if (!items.length) return null;

    var wrap = document.createElement('div');
    wrap.id = cfg.id;
    wrap.style.cssText = 'margin:24px 0;';

    var header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:10px;';
    header.innerHTML =
      '<span style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;' +
      'color:' + cfg.cor + ';background:' + cfg.bgCor + ';padding:3px 10px;border-radius:20px;">' +
      esc(cfg.label) + '</span>' +
      '<span style="flex:1;height:1px;background:#e2e8f0;"></span>';
    wrap.appendChild(header);

    var grid = document.createElement('div');
    grid.className = 'ovc-minirow';

    items.slice(0, 3).forEach(function (p) {
      var card = document.createElement('a');
      card.href = buildHref(p);
      card.style.cssText =
        'display:block;padding:12px;background:var(--bg-elevated,#fff);' +
        'border:1px solid #e2e8f0;border-top:3px solid ' + cfg.cor + ';border-radius:6px;' +
        'text-decoration:none;transition:box-shadow .15s;';
      card.onmouseover = function(){ this.style.boxShadow='0 2px 10px rgba(0,0,0,.07)'; };
      card.onmouseout  = function(){ this.style.boxShadow='none'; };
      card.innerHTML =
        '<div style="font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;' +
        'color:' + cfg.cor + ';margin-bottom:6px;">' + esc(cfg.badge) + '</div>' +
        '<div style="font-size:13px;font-weight:600;color:var(--text-main,#0f172a);line-height:1.4;">' +
        esc(p.titulo) + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted,#94a3b8);margin-top:6px;">' +
        dataBr(p.data) + '</div>';
      grid.appendChild(card);
    });

    wrap.appendChild(grid);
    return wrap;
  }

  // ── MAIN ─────────────────────────────────────────────────────────────────────
  esperarMiolo(function (miolo) {
    buscarNichos(function (err, nichos) {
      if (err || !nichos.length) return;

      injetarCSS();

      var pilulas = nichos.filter(function(n){ return n.tipo==='pilula'||n.tipo==='micropilula'; }).slice(0,3);
      // Copa radares ficam no widget ovc-copa.js — excluir do Radar OVC genérico
      var COPA_KW_NICHO = ['copa do mundo','world cup','mundial','fifa','seleção brasileira','copa 2026','fase de grupos','oitavas','quartas','semifinal','final da copa'];
      var radares = nichos.filter(function(n){
        if (n.tipo !== 'radar') return false;
        var t = (n.titulo||'').toLowerCase();
        return !COPA_KW_NICHO.some(function(kw){ return kwMatch(t, kw); });
      }).slice(0,4);
      var minutos = nichos.filter(function(n){ return n.tipo==='minuto'; }).slice(0,3);

      // 1. Radar OVC → right rail (sidebar direito)
      // Homepage usa .rail-right; páginas internas usam .ovc-right-rail
      if (radares.length) {
        var rail = document.querySelector('.rail-right') || document.querySelector('.ovc-right-rail');
        if (rail) {
          var blocoRadar = criarBlocoRadarRail(radares);
          if (blocoRadar) rail.appendChild(blocoRadar);
        }
      }

      var filhos = Array.from(miolo.children);

      // 2. Minuto OVC → 3 mini-cards após filhos[3] (depois da 1ª fileira de cards)
      if (minutos.length) {
        var blocoMinuto = criarLinhaMiniCards(minutos, {
          id: 'ovc-nicho-minuto',
          label: 'Minuto OVC',
          badge: 'Economia',
          cor: '#0369a1',
          bgCor: '#e0f2fe'
        });
        if (blocoMinuto) {
          var ref = filhos[3];
          if (ref) miolo.insertBefore(blocoMinuto, ref);
          else miolo.appendChild(blocoMinuto);
        }
      }

      // 3. Pílulas → 3 mini-cards antes do último bloco original
      if (pilulas.length) {
        var blocoPilulas = criarLinhaMiniCards(pilulas, {
          id: 'ovc-nicho-pilulas',
          label: 'Notas do Dia',
          badge: 'Pílula',
          cor: '#6366f1',
          bgCor: '#ede9fe'
        });
        if (blocoPilulas) {
          var filhosAtual = Array.from(miolo.children);
          var ultimo = filhosAtual[filhosAtual.length - 1];
          if (ultimo) miolo.insertBefore(blocoPilulas, ultimo);
          else miolo.appendChild(blocoPilulas);
        }
      }
    });
  });

})();
