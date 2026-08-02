/**
 * ovc-audio.js — Ouvir em áudio a MANCHETE e o CORPO das matérias (matérias completas,
 * pílulas, radar, minuto, micro-pílulas, cards principais). REGRA ZERO-I: 100%
 * independente, não toca em home.js / internal-page-v2.js / ovc-cards.js / ovc-nichos.js
 * — puramente aditivo (só lê o DOM já renderizado por eles).
 *
 * Estratégia: escaneia o DOM em busca de links que apontem para uma matéria/curtinha
 * (padrão de URL /{categoria}/{slug}-{id8}/) e injeta UM botão de áudio por card,
 * lendo APENAS manchete (heading) + texto de resumo/corpo — nunca texto de botão/CTA
 * ("leia mais", "avançar", "compartilhar" etc). Página de matéria completa usa
 * window.__OVC_ARTICLE__ (já setado pelo SSR) para ler o corpo inteiro, e o botão é
 * inserido na própria barra de "Compartilhar esta matéria" (identificada pelo link do
 * WhatsApp, que é estável em todas as páginas), sem editar internal-page-v2.js.
 *
 * Motor: Web Speech API (100% grátis, client-side, sem chave, sem custo, sem
 * infraestrutura nova — não usa nenhum dos 10 slots de api/).
 */
(function () {
  'use strict';
  if (window.__OVC_AUDIO_INIT__) return;
  window.__OVC_AUDIO_INIT__ = true;

  var HAS_TTS = typeof window.speechSynthesis !== 'undefined';
  if (!HAS_TTS) return;

  var STORAGE_KEY = 'ovc_audio_gender';
  var LINK_RE = /^\/[a-z0-9-]+\/[a-z0-9-]+-[a-f0-9]{8}\/?$/i;
  var SKIP_TAGS = { NAV: 1, FOOTER: 1, HEADER: 1, BUTTON: 1 };
  var HEADING_SEL = 'h1,h2,h3,h4,h5,h6';
  var HIDDEN_SEL = '.sr-only,.visually-hidden,.visuallyhidden,[aria-hidden="true"]';
  var CARD_SEL = 'article, li, .ovc-cat-card, .ovc-mini-card, .ovc-mnt-item, .ovc-mnt-featured, .ovc-cat-hero, .ovc-ml-item, .ovc-cat-card-lg';
  // texto de UI (botão/CTA/navegação) — nunca é manchete nem corpo
  var CTA_RE = /^(leia|ler|veja|ver|saiba|continue|continuar|avan[çc]|pr[óo]xim|anterior|voltar|seta|compartilh|coment|assinar|inscrev|buscar|pesquisar|menu|fechar|abrir|expandir|carregar|topo|clique|toque|ouvir|copiar|copiado)/i;

  var cardIdMap = new WeakMap();
  var cardIdCounter = 0;
  var processedCards = {};
  var articleBtnPlaced = false;
  var state = {
    gender: localStorage.getItem(STORAGE_KEY) || 'female',
    lastText: '',
    label: ''
  };

  // ---------- vozes ----------
  var voicesCache = [];
  function loadVoices() { voicesCache = speechSynthesis.getVoices() || []; }
  loadVoices();
  if ('onvoiceschanged' in speechSynthesis) speechSynthesis.onvoiceschanged = loadVoices;

  function pickVoice(gender) {
    var voices = voicesCache.length ? voicesCache : speechSynthesis.getVoices();
    if (!voices.length) return null;
    var pt = voices.filter(function (v) { return /^pt/i.test(v.lang); });
    var pool = pt.length ? pt : voices;
    var femaleHints = /fem|luciana|maria|ana(?!drea)|fernanda|camila|vitória|joana|google português/i;
    var maleHints = /masc|daniel|felipe|ricardo|joão|pedro|diego|thiago/i;
    var hints = gender === 'male' ? maleHints : femaleHints;
    var match = pool.filter(function (v) { return hints.test(v.name); });
    return match[0] || pool[0] || null;
  }

  function stripHtml(html) {
    var d = document.createElement('div');
    d.innerHTML = html || '';
    return (d.textContent || d.innerText || '').replace(/\s+/g, ' ').trim();
  }
  function cleanText(t) { return (t || '').replace(/\s+/g, ' ').trim(); }
  function isBoilerplate(t) { return !t || CTA_RE.test(t) || t.length < 6; }

  // ---------- motor de fala ----------
  function speak(text, label) {
    if (!text) return;
    stop();
    state.lastText = text;
    state.label = label || '';
    var u = new SpeechSynthesisUtterance(text.slice(0, 32000));
    u.lang = 'pt-BR';
    var v = pickVoice(state.gender);
    if (v) u.voice = v;
    // fallback de pitch quando o navegador só expõe 1 voz PT — garante diferença audível
    u.pitch = state.gender === 'male' ? 0.82 : 1.12;
    u.rate = 1;
    u.onend = function () { updateBar(); };
    u.onerror = function () { updateBar(); };
    speechSynthesis.speak(u);
    updateBar();
  }
  function stop() {
    if (speechSynthesis.speaking || speechSynthesis.pending || speechSynthesis.paused) speechSynthesis.cancel();
  }
  function togglePause() {
    if (speechSynthesis.paused) speechSynthesis.resume();
    else if (speechSynthesis.speaking) speechSynthesis.pause();
    updateBar();
  }

  // ---------- barra flutuante global (transporte: play/pause/stop/voz) ----------
  var bar, barLabel, playBtn, genderBtn;
  function buildBar() {
    if (bar) return;
    var sty = document.createElement('style');
    sty.id = 'ovc-audio-css';
    sty.textContent = [
      '#ovc-audio-bar{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:99999;display:none;align-items:center;gap:8px;background:#0f172a;color:#fff;padding:9px 14px;border-radius:999px;box-shadow:0 8px 28px rgba(0,0,0,.35);font-family:inherit;font-size:12.5px;max-width:92vw;}',
      '#ovc-audio-bar.ovc-audio-show{display:flex;}',
      '#ovc-audio-bar button{background:rgba(255,255,255,.14);border:none;color:#fff;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}',
      '#ovc-audio-bar button:hover{background:rgba(255,255,255,.26);}',
      '#ovc-audio-label{max-width:210px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.9;}',
      '.ovc-audio-btn{position:absolute;top:6px;right:6px;z-index:6;display:inline-flex;align-items:center;justify-content:center;width:25px;height:25px;border-radius:50%;background:rgba(15,23,42,.75);color:#ffc800;border:none;cursor:pointer;font-size:12px;line-height:1;}',
      '.ovc-audio-btn:hover{background:#0f172a;}',
      '.ovc-audio-card-wrap{position:relative;}',
      '.ovc-audio-share-btn{display:inline-flex;align-items:center;gap:5px;background:#dc2626;color:#fff;padding:8px 14px;border-radius:8px;font-size:13px;font-weight:700;border:none;cursor:pointer;}',
      '.ovc-audio-share-btn:hover{background:#b91c1c;}',
      '.ovc-audio-sep{width:1px;align-self:stretch;background:#e2e8f0;margin:2px 4px;}',
      '.ovc-audio-article-fallback{position:fixed;right:18px;bottom:16px;z-index:99998;box-shadow:0 8px 24px rgba(0,0,0,.3);border-radius:999px;}'
    ].join('');
    document.head.appendChild(sty);

    bar = document.createElement('div');
    bar.id = 'ovc-audio-bar';
    bar.innerHTML =
      '<button type="button" data-act="playpause" title="Pausar/Retomar">⏸</button>' +
      '<button type="button" data-act="stop" title="Parar">⏹</button>' +
      '<span id="ovc-audio-label"></span>' +
      '<button type="button" data-act="gender" title="Alternar voz masculina/feminina"></button>';
    document.body.appendChild(bar);
    barLabel = bar.querySelector('#ovc-audio-label');
    playBtn = bar.querySelector('[data-act="playpause"]');
    genderBtn = bar.querySelector('[data-act="gender"]');
    genderBtn.textContent = state.gender === 'male' ? '👨' : '👩';

    bar.addEventListener('click', function (e) {
      var act = e.target.getAttribute('data-act');
      if (act === 'playpause') togglePause();
      else if (act === 'stop') { stop(); updateBar(); }
      else if (act === 'gender') {
        state.gender = state.gender === 'male' ? 'female' : 'male';
        localStorage.setItem(STORAGE_KEY, state.gender);
        genderBtn.textContent = state.gender === 'male' ? '👨' : '👩';
        if (state.lastText) speak(state.lastText, state.label);
      }
    });
  }
  function updateBar() {
    buildBar();
    var active = speechSynthesis.speaking || speechSynthesis.pending || speechSynthesis.paused;
    bar.classList.toggle('ovc-audio-show', !!active);
    barLabel.textContent = state.label ? ('Ouvindo: ' + state.label) : '';
    playBtn.textContent = speechSynthesis.paused ? '▶' : '⏸';
  }

  // ---------- botão de matéria completa — inserido na linha de "Compartilhar esta matéria" ----------
  function buildArticleBtn(art) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ovc-audio-share-btn';
    btn.title = 'Ouvir esta matéria em áudio';
    btn.innerHTML = '🔊 Ouvir';
    btn.addEventListener('click', function () {
      var text = (art.titulo ? art.titulo + '. ' : '') + stripHtml(art.corpo || art.resumo || '');
      speak(text, art.titulo);
    });
    return btn;
  }

  function placeArticleButtonInShareRow(art) {
    if (articleBtnPlaced) return true;
    var waLink = document.querySelector('a[href^="https://api.whatsapp.com/send"]');
    var row = waLink && waLink.parentElement;
    if (!row) return false;
    var sep = document.createElement('span');
    sep.className = 'ovc-audio-sep';
    row.appendChild(sep);
    row.appendChild(buildArticleBtn(art));
    articleBtnPlaced = true;
    return true;
  }

  function initArticleButton() {
    var art = window.__OVC_ARTICLE__;
    if (!art || !art.titulo) return;
    buildBar();
    if (placeArticleButtonInShareRow(art)) return;
    // barra de compartilhamento ainda não renderizou (internal-page-v2.js é assíncrono) —
    // o scan periódico tenta de novo; após 6s sem sucesso, usa botão flutuante de segurança
    setTimeout(function () {
      if (!placeArticleButtonInShareRow(art) && !articleBtnPlaced) {
        var btn = buildArticleBtn(art);
        btn.classList.add('ovc-audio-article-fallback');
        document.body.appendChild(btn);
        articleBtnPlaced = true;
      }
    }, 6000);
  }

  // ---------- injeção universal em cards/links (pílulas, radar, minuto, micro, cards) ----------
  function getCardRoot(a) {
    var el = a.closest(CARD_SEL);
    if (!el) el = a.parentElement || a;
    return el;
  }
  function cardKey(root) {
    if (!cardIdMap.has(root)) cardIdMap.set(root, ++cardIdCounter);
    return cardIdMap.get(root);
  }

  // extrai manchete (heading) + resumo/corpo do card — nunca texto de botão/CTA
  function extractCardText(root, fallbackAnchor) {
    var headingEl = null;
    var headings = root.querySelectorAll(HEADING_SEL);
    for (var i = 0; i < headings.length; i++) {
      if (headings[i].closest(HIDDEN_SEL)) continue;
      var ht = cleanText(headings[i].textContent);
      if (!isBoilerplate(ht)) { headingEl = headings[i]; break; }
    }
    var title = headingEl ? cleanText(headingEl.textContent) : '';
    if (!title) {
      // sem heading no card — usa o texto do próprio link, se não for boilerplate
      var at = cleanText(fallbackAnchor.textContent);
      if (!isBoilerplate(at)) title = at;
    }
    if (!title) return null;

    var summary = '';
    var paras = root.querySelectorAll('p');
    for (var j = 0; j < paras.length; j++) {
      if (paras[j].closest(HIDDEN_SEL)) continue;
      var pt = cleanText(paras[j].textContent);
      if (pt && pt !== title && !isBoilerplate(pt)) { summary = pt; break; }
    }
    return (title + (summary ? ('. ' + summary) : '')).trim();
  }

  function injectCardButton(root, anchorForClickTarget) {
    var key = cardKey(root);
    if (processedCards[key]) return;
    processedCards[key] = true;
    var text = extractCardText(root, anchorForClickTarget);
    if (!text || text.length < 8) return;
    buildBar();
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ovc-audio-btn';
    btn.title = 'Ouvir';
    btn.textContent = '🔊';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      speak(text, text.split('.')[0].slice(0, 60));
    });
    if (getComputedStyle(root).position === 'static') root.classList.add('ovc-audio-card-wrap');
    root.appendChild(btn);
  }

  function scan(root) {
    var links = (root || document).querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var href = a.getAttribute('href') || '';
      // ignora âncoras internas/handlers de UI (carrosséis, "avançar", modais) — nunca
      // são conteúdo, e "#" resolve para a própria página atual (pode colidir com o
      // padrão de URL de matéria se você estiver dentro de uma)
      if (!href || href.charAt(0) === '#' || /^javascript:/i.test(href)) continue;
      var path = href;
      try { path = new URL(href, location.origin).pathname; } catch (_) {}
      if (!LINK_RE.test(path)) continue;
      var p = a.parentElement, skip = false, depth = 0;
      while (p && depth < 6) {
        if (SKIP_TAGS[p.tagName]) { skip = true; break; }
        p = p.parentElement; depth++;
      }
      if (skip) continue;
      injectCardButton(getCardRoot(a), a);
    }
  }

  var scanTimer = null;
  function scheduleScan() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(function () {
      scan(document);
      if (window.__OVC_ARTICLE__ && !articleBtnPlaced) placeArticleButtonInShareRow(window.__OVC_ARTICLE__);
    }, 400);
  }

  function boot() {
    initArticleButton();
    scan(document);
    var mo = new MutationObserver(scheduleScan);
    mo.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
