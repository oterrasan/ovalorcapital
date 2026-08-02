/**
 * ovc-audio.js — Ouvir em áudio TODO conteúdo do OVC (matérias, pílulas, radar, minuto,
 * micro-pílulas, cards principais). REGRA ZERO-I: 100% independente, não toca em
 * home.js / internal-page-v2.js / ovc-cards.js / ovc-nichos.js — puramente aditivo.
 *
 * Estratégia: em vez de integrar arquivo por arquivo (frágil, alto risco), escaneia
 * o DOM em busca de qualquer link que aponte para uma matéria/curtinha (padrão de URL
 * /{categoria}/{slug}-{id8}/, usado por TODOS os tipos de conteúdo do portal) e injeta
 * um botão de áudio. Isso garante cobertura universal sem depender de conhecer cada
 * classe CSS de cada widget. Página de matéria completa usa window.__OVC_ARTICLE__
 * (já setado pelo SSR) para ler o corpo inteiro.
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
  var SKIP_TAGS = { NAV: 1, FOOTER: 1, HEADER: 1 };

  var processed = new WeakSet();
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

  // ---------- barra flutuante global ----------
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
      '#ovc-audio-article-btn{position:fixed;right:18px;bottom:16px;z-index:99998;background:#dc2626;color:#fff;border:none;padding:10px 16px;border-radius:999px;font-weight:700;font-size:12.5px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.3);}'
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

  // ---------- botão de matéria completa (artigo em página própria) ----------
  function initArticleButton() {
    var art = window.__OVC_ARTICLE__;
    if (!art || !art.titulo) return;
    buildBar();
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'ovc-audio-article-btn';
    btn.textContent = '🔊 Ouvir esta matéria';
    btn.addEventListener('click', function () {
      var text = (art.titulo ? art.titulo + '. ' : '') + stripHtml(art.corpo || art.resumo || '');
      speak(text, art.titulo);
    });
    document.body.appendChild(btn);
  }

  // ---------- injeção universal em cards/links (pílulas, radar, minuto, micro, cards) ----------
  function extractCardText(a) {
    var title = (a.textContent || '').replace(/\s+/g, ' ').trim();
    var card = a.closest('article, li, div') || a.parentElement;
    var summary = '';
    if (card) {
      var candidates = card.querySelectorAll('p');
      for (var i = 0; i < candidates.length; i++) {
        var t = candidates[i].textContent.replace(/\s+/g, ' ').trim();
        if (t && t !== title && t.length > 6) { summary = t; break; }
      }
    }
    return (title + (summary ? ('. ' + summary) : '')).trim();
  }

  function injectCardButton(a) {
    if (processed.has(a)) return;
    processed.add(a);
    var text = extractCardText(a);
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
      speak(text, a.textContent.trim().slice(0, 60));
    });
    if (getComputedStyle(a).position === 'static') a.classList.add('ovc-audio-card-wrap');
    a.appendChild(btn);
  }

  function scan(root) {
    var links = (root || document).querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      if (processed.has(a)) continue;
      var href = a.getAttribute('href') || '';
      var path = href;
      try { path = new URL(href, location.origin).pathname; } catch (_) {}
      if (!LINK_RE.test(path)) continue;
      var p = a.parentElement, skip = false, depth = 0;
      while (p && depth < 6) {
        if (SKIP_TAGS[p.tagName]) { skip = true; break; }
        p = p.parentElement; depth++;
      }
      if (skip) continue;
      injectCardButton(a);
    }
  }

  var scanTimer = null;
  function scheduleScan() {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(function () { scan(document); }, 400);
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
