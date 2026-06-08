/**
 * ovc-nichos.js — Blocos de nichos OVC na home
 * REGRA ZERO-I: este arquivo é 100% independente do home.js e ovc-cards.js
 * Se este arquivo falhar, os cards da home continuam funcionando normalmente.
 * Injeta os 3 nichos ENTRE os blocos existentes — nunca dentro deles.
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
      if (tentativas > 40) clearInterval(timer); // desiste após 4s
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
  function stripHtml(s) {
    return String(s || '').replace(/<[^>]+>/g, '').trim();
  }

  // Badge por tipo
  var BADGE = {
    pilula:      { label: 'Nota',        cor: '#6366f1' },
    micropilula: { label: 'Nota',        cor: '#6366f1' },
    radar:       { label: '● Radar OVC', cor: '#dc2626' },
    minuto:      { label: 'Minuto OVC',  cor: '#0369a1' }
  };

  // ── Criar bloco PÍLULAS — lista compacta de notas rápidas ───────────────────
  function criarBlocoPilulas(items) {
    if (!items.length) return null;

    var bloco = document.createElement('div');
    bloco.id = 'ovc-nicho-pilulas';
    bloco.style.cssText = 'margin:0;padding:20px 0 4px;border-top:2px solid #e2e8f0;';

    var header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:0 4px;';
    header.innerHTML =
      '<span style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;' +
      'color:#6366f1;background:#ede9fe;padding:3px 10px;border-radius:20px;">Notas do Dia</span>' +
      '<span style="flex:1;height:1px;background:#e2e8f0;"></span>';
    bloco.appendChild(header);

    var lista = document.createElement('div');
    lista.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;';

    items.forEach(function (p) {
      var resumo = stripHtml(p.resumo || '').slice(0, 120);
      var item = document.createElement('a');
      item.href = '/'+p.categoria+'/'+slugify(p.titulo)+'-'+p.id.slice(0,8)+'/';
      item.style.cssText =
        'display:block;padding:12px 14px;background:var(--bg-elevated,#fff);' +
        'border:1px solid #e2e8f0;border-left:3px solid #6366f1;border-radius:6px;' +
        'text-decoration:none;transition:border-color .15s,box-shadow .15s;';
      item.onmouseover = function(){ this.style.borderLeftColor='#4f46e5'; this.style.boxShadow='0 2px 8px rgba(0,0,0,.08)'; };
      item.onmouseout  = function(){ this.style.borderLeftColor='#6366f1'; this.style.boxShadow='none'; };
      item.innerHTML =
        '<div style="font-size:13px;font-weight:600;color:var(--text-main,#0f172a);line-height:1.4;margin-bottom:5px;">' +
        esc(p.titulo) + '</div>' +
        '<div style="font-size:12px;color:var(--text-soft,#475569);line-height:1.5;">' +
        esc(resumo) + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted,#94a3b8);margin-top:6px;">' +
        dataBr(p.data) + ' · ' + esc(p.categoria) + '</div>';
      lista.appendChild(item);
    });

    bloco.appendChild(lista);
    return bloco;
  }

  // ── Criar bloco RADAR OVC — destaque urgente ─────────────────────────────────
  function criarBlocoRadar(items) {
    if (!items.length) return null;

    var bloco = document.createElement('div');
    bloco.id = 'ovc-nicho-radar';
    bloco.style.cssText = 'margin:0;padding:20px 0 4px;border-top:2px solid #dc2626;';

    var header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:0 4px;';
    header.innerHTML =
      '<span style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;' +
      'color:#dc2626;background:#fee2e2;padding:3px 10px;border-radius:20px;">● Radar OVC — Ao Vivo</span>' +
      '<span style="flex:1;height:1px;background:#fecaca;"></span>';
    bloco.appendChild(header);

    var lista = document.createElement('div');
    lista.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

    items.forEach(function (p) {
      var resumo = stripHtml(p.resumo || '').slice(0, 160);
      var item = document.createElement('a');
      item.href = '/'+p.categoria+'/'+slugify(p.titulo)+'-'+p.id.slice(0,8)+'/';
      item.style.cssText =
        'display:flex;gap:14px;align-items:flex-start;padding:14px 16px;' +
        'background:#fff5f5;border:1px solid #fecaca;border-left:4px solid #dc2626;' +
        'border-radius:6px;text-decoration:none;transition:background .15s;';
      item.onmouseover = function(){ this.style.background='#fee2e2'; };
      item.onmouseout  = function(){ this.style.background='#fff5f5'; };
      item.innerHTML =
        '<div style="flex:1;">' +
        '<div style="font-size:14px;font-weight:700;color:#991b1b;line-height:1.4;margin-bottom:4px;">' +
        esc(p.titulo) + '</div>' +
        '<div style="font-size:12px;color:#7f1d1d;line-height:1.5;">' + esc(resumo) + '</div>' +
        '<div style="font-size:11px;color:#b91c1c;margin-top:6px;font-weight:600;">' +
        dataBr(p.data) + '</div></div>';
      lista.appendChild(item);
    });

    bloco.appendChild(lista);
    return bloco;
  }

  // ── Criar bloco MINUTO OVC — resumos executivos ──────────────────────────────
  function criarBlocoMinuto(items) {
    if (!items.length) return null;

    var bloco = document.createElement('div');
    bloco.id = 'ovc-nicho-minuto';
    bloco.style.cssText = 'margin:0;padding:20px 0 4px;border-top:2px solid #0369a1;';

    var header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:0 4px;';
    header.innerHTML =
      '<span style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;' +
      'color:#0369a1;background:#e0f2fe;padding:3px 10px;border-radius:20px;">Minuto OVC</span>' +
      '<span style="flex:1;height:1px;background:#bae6fd;"></span>' +
      '<span style="font-size:11px;color:#0369a1;font-style:italic;">Economia & Negócios</span>';
    bloco.appendChild(header);

    var lista = document.createElement('div');
    lista.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px;';

    items.forEach(function (p) {
      var resumo = stripHtml(p.resumo || '').slice(0, 140);
      var item = document.createElement('a');
      item.href = '/'+p.categoria+'/'+slugify(p.titulo)+'-'+p.id.slice(0,8)+'/';
      item.style.cssText =
        'display:block;padding:14px 16px;background:#f0f9ff;' +
        'border:1px solid #bae6fd;border-left:3px solid #0369a1;border-radius:6px;' +
        'text-decoration:none;transition:background .15s;';
      item.onmouseover = function(){ this.style.background='#e0f2fe'; };
      item.onmouseout  = function(){ this.style.background='#f0f9ff'; };
      item.innerHTML =
        '<div style="font-size:13px;font-weight:700;color:#0c4a6e;line-height:1.4;margin-bottom:5px;">' +
        esc(p.titulo) + '</div>' +
        '<div style="font-size:12px;color:#075985;line-height:1.5;">' + esc(resumo) + '</div>' +
        '<div style="font-size:11px;color:#0369a1;margin-top:6px;">' +
        dataBr(p.data) + ' · ' + esc(p.categoria) + '</div>';
      lista.appendChild(item);
    });

    bloco.appendChild(lista);
    return bloco;
  }

  // ── Slugify simples ───────────────────────────────────────────────────────────
  function slugify(s) {
    return String(s||'').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55);
  }

  // ── Inserir bloco após um filho específico do miolo ──────────────────────────
  function inserirApos(miolo, referencia, bloco) {
    if (!bloco) return;
    var ref = miolo.querySelector(referencia);
    if (ref && ref.nextSibling) {
      miolo.insertBefore(bloco, ref.nextSibling);
    } else {
      miolo.appendChild(bloco);
    }
  }

  // ── MAIN ─────────────────────────────────────────────────────────────────────
  esperarMiolo(function (miolo) {
    buscarNichos(function (err, nichos) {
      if (err || !nichos.length) return;

      // Separar por tipo
      var pilulas = nichos.filter(function(n){ return n.tipo==='pilula'||n.tipo==='micropilula'; }).slice(0,8);
      var radares = nichos.filter(function(n){ return n.tipo==='radar'; }).slice(0,3);
      var minutos = nichos.filter(function(n){ return n.tipo==='minuto'; }).slice(0,6);

      // Criar blocos (só cria se tiver conteúdo)
      var blocoRadar  = criarBlocoRadar(radares);
      var blocoPilulas = criarBlocoPilulas(pilulas);
      var blocoMinuto  = criarBlocoMinuto(minutos);

      var filhos = Array.from(miolo.children);
      var total  = filhos.length;

      // Posicionamento estratégico entre os blocos existentes:
      // Radar → logo no início (urgente, chama atenção)
      // Minuto → no meio (após 1/3 dos blocos)
      // Pílulas → no final (antes do último bloco)

      if (blocoRadar && total >= 1) {
        miolo.insertBefore(blocoRadar, filhos[0]);
      }

      if (blocoMinuto && total >= 3) {
        var posMin = Math.floor(total / 3);
        var refMin = miolo.children[posMin];
        if (refMin) miolo.insertBefore(blocoMinuto, refMin);
        else miolo.appendChild(blocoMinuto);
      }

      if (blocoPilulas && total >= 2) {
        var ultimo = miolo.lastChild;
        if (ultimo) miolo.insertBefore(blocoPilulas, ultimo);
        else miolo.appendChild(blocoPilulas);
      }
    });
  });

})();
