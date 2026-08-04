/**
 * ovc-nichos.js — Blocos de nichos OVC na home
 * REGRA ZERO-I: este arquivo é 100% independente do home.js e ovc-cards.js
 * Se este arquivo falhar, os cards da home continuam funcionando normalmente.
 *
 * Layout:
 * - Minuto OVC → 3 mini-cards horizontais entre blocos do miolo
 * - Pílulas    → 3 mini-cards horizontais antes do último bloco do miolo
 *
 * Radar OVC REMOVIDO — 31/07/2026 (Roberto): consumia o mesmo tipo_conteudo="radar"
 * usado pelo Radar do Esporte (ovc-radar-esporte.js) sem filtrar por categoria, duplicando
 * conteúdo esportivo fora do lugar certo. Conteúdo de futebol vive exclusivamente
 * no Radar do Futebol/Radar da Bola.
 */
(function () {
  'use strict';

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
      var minutos = nichos.filter(function(n){ return n.tipo==='minuto'; }).slice(0,3);

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
          // filhos[5] = após bB(0)+sep(1)+z1(2)+sep(3)+blocoInternacional(4)+sep(5) — ver ovc-cards.js buildSection()
          var ref = filhos[6] || filhos[filhos.length - 1];
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
