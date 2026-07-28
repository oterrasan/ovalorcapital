/**
 * ovc-mercado-da-bola.js — Feed de notícias de mercado (transferências, contratações, negociações)
 * REGRA ZERO-I: 100% independente — não toca internal-page-v2.js nem home.js
 * Sem dados ao vivo (não é placar/tabela): filtra o feed editorial do portal por keywords de mercado.
 */
(function () {
  'use strict';

  var KEYWORDS = [
    'transferência', 'transferencia', 'contratação', 'contratacao', 'contrata',
    'negociação', 'negociacao', 'venda', 'vendido', 'compra', 'comprado',
    'empréstimo', 'emprestimo', 'emprestado', 'acerta', 'acertou', 'acordo',
    'assina', 'assinou', 'assinatura', 'reforço', 'reforco', 'multa rescisória',
    'multa rescisoria', 'agente', 'empresário', 'empresario', 'procurador',
    'janela de transferências', 'janela de transferencias', 'pré-contrato',
    'pre-contrato', 'proposta', 'sondagem', 'sondando', 'interesse no jogador',
    'mercado da bola', 'passe livre', 'rescisão', 'rescisao', 'renovação',
    'renovacao', 'permuta', 'troca de jogador'
  ];

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
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
  function dataCurta(dt) {
    try { return new Date(dt).toLocaleDateString('pt-BR', { day:'2-digit', month:'short' }); }
    catch (_) { return ''; }
  }
  function imgOk(url) {
    return url && !/placeholder|default-og|og-default/i.test(url);
  }

  function injetarCSS() {
    if (document.getElementById('ovc-mdb-css')) return;
    var sty = document.createElement('style');
    sty.id = 'ovc-mdb-css';
    sty.textContent = [
      '.ovc-mdb-wrap{margin:18px 0;}',
      '.ovc-mdb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;}',
      '.ovc-mdb-card{display:flex;flex-direction:column;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;text-decoration:none;background:#fff;transition:transform .15s,box-shadow .15s;}',
      '.ovc-mdb-card:hover{transform:translateY(-3px);box-shadow:0 8px 18px rgba(0,0,0,.1);}',
      '.ovc-mdb-card-img{width:100%;height:140px;object-fit:cover;background:#f3f4f6;}',
      '.ovc-mdb-card-body{padding:12px 14px;display:flex;flex-direction:column;gap:6px;flex:1;}',
      '.ovc-mdb-card-badge{font-size:9px;font-weight:800;color:#b45309;text-transform:uppercase;letter-spacing:.07em;}',
      '.ovc-mdb-card-title{font-size:13.5px;font-weight:700;color:var(--text-main,#0f172a);line-height:1.4;}',
      '.ovc-mdb-card-date{font-size:10.5px;color:#94a3b8;margin-top:auto;}',
      '.ovc-mdb-empty{padding:26px 14px;text-align:center;color:#94a3b8;font-size:13px;border:1px dashed #e5e7eb;border-radius:10px;}',
    ].join('');
    document.head.appendChild(sty);
  }

  function filtrar(lista) {
    var vistos = {};
    return lista.filter(function (p) {
      if (vistos[p.id]) return false;
      var t = ((p.titulo || '') + ' ' + (p.comentario_fixado || '')).toLowerCase();
      var ok = KEYWORDS.some(function (k) { return t.indexOf(k) >= 0; });
      if (ok) vistos[p.id] = true;
      return ok;
    });
  }

  function renderCard(p) {
    var img = imgOk(p.imagem)
      ? '<img class="ovc-mdb-card-img" src="' + esc(p.imagem) + '" alt="" loading="lazy">'
      : '';
    return '<a class="ovc-mdb-card" href="' + buildHref(p) + '">' +
      img +
      '<div class="ovc-mdb-card-body">' +
      '<span class="ovc-mdb-card-badge">Mercado da Bola</span>' +
      '<span class="ovc-mdb-card-title">' + esc(p.titulo) + '</span>' +
      '<span class="ovc-mdb-card-date">' + dataCurta(p.data || p.published_at || p.created_at) + '</span>' +
      '</div></a>';
  }

  function montar(artigos) {
    injetarCSS();
    var alvo = document.getElementById('ovc-mercado-dash');
    if (!alvo) return;
    if (!artigos.length) {
      alvo.innerHTML = '<div class="ovc-mdb-wrap"><div class="ovc-mdb-empty">Cobertura do mercado chegando em breve.</div></div>';
      return;
    }
    alvo.innerHTML = '<div class="ovc-mdb-wrap"><div class="ovc-mdb-grid">' +
      artigos.slice(0, 24).map(renderCard).join('') +
      '</div></div>';
  }

  function init() {
    var alvo = document.getElementById('ovc-mercado-dash');
    if (!alvo) return;
    alvo.innerHTML = '<div class="ovc-mdb-wrap"><div class="ovc-mdb-empty">Carregando…</div></div>';

    Promise.all([
      fetch('/api/portal-posts?curtinhas=true&categoria=esportes&limit=30').then(function (r) { return r.json(); }).catch(function () { return { curtinhas: [] }; }),
      fetch('/api/portal-posts?recentes=true&limit=300').then(function (r) { return r.json(); }).catch(function () { return { posts: [] }; })
    ]).then(function (results) {
      var todos = (results[0].curtinhas || []).concat(results[1].posts || []);
      montar(filtrar(todos));
    }).catch(function () { montar([]); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
