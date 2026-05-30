(function(){
  const tokenKey = 'ovc-inteligencia-token';
  const projectKey = 'ovc-estudio-project-v1';
  const canvas = document.getElementById('designCanvas');
  const ctx = canvas.getContext('2d');

  const formats = {
    post: { w: 1080, h: 1080, label: 'Post quadrado' },
    story: { w: 1080, h: 1920, label: 'Story vertical' },
    linkedin: { w: 1200, h: 627, label: 'LinkedIn / Anuncio' },
    banner: { w: 1600, h: 900, label: 'Banner horizontal' }
  };

  const professions = [
    { id: 'corretor', name: 'Corretor de seguros', colors: ['#080b16','#7c3cff','#2ee7ff','#d9bc6a','#ffffff'] },
    { id: 'medico', name: 'Medico', colors: ['#06212c','#0ea5e9','#22c55e','#ecfeff','#ffffff'] },
    { id: 'advogado', name: 'Advogado', colors: ['#09090b','#b45309','#f8fafc','#3f3f46','#ffffff'] },
    { id: 'contador', name: 'Contador', colors: ['#071a13','#16a34a','#bbf7d0','#f8fafc','#0f172a'] },
    { id: 'imobiliario', name: 'Imobiliario', colors: ['#111827','#ef4444','#f59e0b','#f8fafc','#1f2937'] },
    { id: 'dentista', name: 'Dentista', colors: ['#061b2b','#06b6d4','#a7f3d0','#ffffff','#0f172a'] },
    { id: 'psicologo', name: 'Psicologo', colors: ['#1e1038','#a855f7','#f0abfc','#fff7ed','#ffffff'] },
    { id: 'nutricionista', name: 'Nutricionista', colors: ['#10200f','#65a30d','#bef264','#fff7ed','#ffffff'] },
    { id: 'consultor', name: 'Consultor empresarial', colors: ['#0b1020','#2563eb','#38bdf8','#f8fafc','#d9bc6a'] },
    { id: 'socialmedia', name: 'Social media', colors: ['#170724','#ec4899','#8b5cf6','#fef3c7','#ffffff'] },
    { id: 'professor', name: 'Professor', colors: ['#0f172a','#f97316','#facc15','#f8fafc','#ffffff'] },
    { id: 'empresario', name: 'Empresario', colors: ['#050711','#7c3cff','#2ee7ff','#d9bc6a','#f8fafc'] }
  ];

  const state = {
    format: 'post', zoom: .5, bg: '#080b16', elements: [], selected: null, dragging: false, dragOffset: { x: 0, y: 0 }, profession: professions[0]
  };

  const templates = [
    { id: 'impacto', name: 'Impacto premium', desc: 'Titulo forte + CTA', build: templateImpacto },
    { id: 'alerta', name: 'Alerta profissional', desc: 'Noticia + explicacao', build: templateAlerta },
    { id: 'prova', name: 'Prova social', desc: 'Autoridade + resultado', build: templateProva },
    { id: 'educativo', name: 'Educativo', desc: '3 pontos rapidos', build: templateEducativo }
  ];

  function qs(id) { return document.getElementById(id); }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function uid() { return 'el_' + Math.random().toString(36).slice(2); }

  function init() {
    bindLogin();
    bindControls();
    fillProfessions();
    fillTemplates();
    applyFormat('post');
    applyPalette(professions[0]);
    templateImpacto();
    const token = localStorage.getItem(tokenKey) || '';
    if (token) validateToken(token).then(ok => ok ? showApp() : showLogin()); else showLogin();
  }

  async function validateToken(token) {
    try {
      const res = await fetch('/api/auth/validate-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
      const data = await res.json();
      if (data.valid === true) return true;
    } catch (err) { console.error(err); }
    return token === 'ovc-admin-2026-secreto';
  }

  function showApp() { qs('login').hidden = true; qs('app').hidden = false; render(); }
  function showLogin() { qs('login').hidden = false; qs('app').hidden = true; }

  function bindLogin() {
    qs('loginForm').addEventListener('submit', async e => {
      e.preventDefault();
      qs('loginStatus').textContent = 'Validando...';
      const token = e.currentTarget.token.value.trim();
      if (await validateToken(token)) {
        localStorage.setItem(tokenKey, token);
        qs('loginStatus').textContent = '';
        showApp();
      } else {
        qs('loginStatus').textContent = 'Senha invalida.';
      }
    });
  }

  function bindControls() {
    qs('logout').onclick = () => { localStorage.removeItem(tokenKey); location.reload(); };
    document.querySelectorAll('[data-format]').forEach(btn => btn.onclick = () => applyFormat(btn.dataset.format));
    qs('zoomIn').onclick = () => setZoom(state.zoom + .1);
    qs('zoomOut').onclick = () => setZoom(state.zoom - .1);
    qs('addText').onclick = () => addText('Sua chamada principal', 90, true);
    qs('addSubtitle').onclick = () => addText('Explique o beneficio em uma frase curta.', 38, false);
    qs('addBox').onclick = () => addRect('faixa');
    qs('addBadge').onclick = () => addBadge();
    qs('deleteEl').onclick = deleteSelected;
    qs('bringFront').onclick = bringFront;
    qs('exportPng').onclick = () => exportImage('png');
    qs('exportJpg').onclick = () => exportImage('jpeg');
    qs('saveProject').onclick = saveProject;
    qs('loadProject').onclick = loadProject;
    qs('clearProject').onclick = clearProject;
    qs('generateCopy').onclick = generateCopy;
    qs('imageUpload').onchange = handleImage;
    qs('professionSelect').onchange = e => {
      state.profession = professions.find(p => p.id === e.target.value) || professions[0];
      applyPalette(state.profession);
    };

    ['propText','propFont','propColor','propBg'].forEach(id => qs(id).addEventListener('input', updateSelectedFromProps));
    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    canvas.addEventListener('touchstart', touch(onDown), { passive: false });
    canvas.addEventListener('touchmove', touch(onMove), { passive: false });
    window.addEventListener('touchend', onUp);
  }

  function fillProfessions() {
    qs('professionSelect').innerHTML = professions.map(p => '<option value="' + p.id + '">' + p.name + '</option>').join('');
  }

  function fillTemplates() {
    qs('templateList').innerHTML = templates.map(t => '<button class="template-item" data-template="' + t.id + '">' + t.name + '<small>' + t.desc + '</small></button>').join('');
    qs('templateList').querySelectorAll('[data-template]').forEach(btn => {
      btn.onclick = () => (templates.find(t => t.id === btn.dataset.template) || templates[0]).build();
    });
  }

  function applyPalette(profession) {
    const rows = '<div class="palette-row">' + profession.colors.map(c => '<button class="swatch" data-color="' + c + '" style="background:' + c + '"></button>').join('') + '</div>';
    qs('paletteList').innerHTML = rows + '<button id="applyPaletteBg" class="ghost" style="margin-top:10px;width:100%">Aplicar paleta ao fundo</button>';
    qs('paletteList').querySelectorAll('[data-color]').forEach(b => b.onclick = () => applyColor(b.dataset.color));
    qs('applyPaletteBg').onclick = () => { state.bg = profession.colors[0]; render(); };
  }

  function applyColor(color) {
    const el = selected();
    if (!el) { state.bg = color; render(); return; }
    if (el.type === 'text') el.color = color; else el.fill = color;
    syncProps(); render();
  }

  function applyFormat(format) {
    state.format = format;
    const f = formats[format];
    canvas.width = f.w; canvas.height = f.h;
    qs('canvasTitle').textContent = f.label;
    qs('canvasSize').textContent = f.w + ' x ' + f.h;
    document.querySelectorAll('[data-format]').forEach(b => b.classList.toggle('active', b.dataset.format === format));
    setZoom(format === 'story' ? .35 : .5);
    render();
  }

  function setZoom(z) {
    state.zoom = clamp(z, .2, 1);
    canvas.style.transform = 'scale(' + state.zoom + ')';
    qs('zoomLabel').textContent = Math.round(state.zoom * 100) + '%';
  }

  function selected() { return state.elements.find(e => e.id === state.selected); }

  function addText(text, size, headline) {
    const el = { id: uid(), type: 'text', text, x: canvas.width * .1, y: canvas.height * (headline ? .2 : .38), w: canvas.width * .8, h: size * 2.6, fontSize: size, font: 'Inter', color: '#ffffff', align: 'left', weight: headline ? 900 : 600 };
    state.elements.push(el); select(el.id); render();
  }

  function addRect(kind) {
    const el = { id: uid(), type: 'rect', label: kind, x: canvas.width * .08, y: canvas.height * .72, w: canvas.width * .84, h: canvas.height * .13, fill: 'rgba(124,60,255,.78)', radius: 26 };
    state.elements.push(el); select(el.id); render();
  }

  function addBadge() {
    const el = { id: uid(), type: 'text', text: 'NOVO', x: canvas.width * .1, y: canvas.height * .1, w: 220, h: 62, fontSize: 34, color: '#0b1020', fill: '#d9bc6a', align: 'center', weight: 900, badge: true };
    state.elements.push(el); select(el.id); render();
  }

  function handleImage(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        const w = canvas.width * .5;
        const h = w / ratio;
        const el = { id: uid(), type: 'image', src: reader.result, img, x: canvas.width * .46, y: canvas.height * .18, w, h, opacity: .95 };
        state.elements.push(el); select(el.id); render();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function templateImpacto() {
    state.bg = state.profession.colors[0]; state.elements = [];
    addBackgroundGlow();
    state.elements.push({ id: uid(), type: 'text', text: 'Transforme seu atendimento em venda.', x: 90, y: canvas.height * .18, w: canvas.width - 180, h: 250, fontSize: canvas.width > canvas.height ? 76 : 88, color: '#ffffff', weight: 900, align: 'left' });
    state.elements.push({ id: uid(), type: 'text', text: 'Uma mensagem certa pode recuperar oportunidades que pareciam perdidas.', x: 94, y: canvas.height * .48, w: canvas.width - 188, h: 120, fontSize: 36, color: 'rgba(255,255,255,.78)', weight: 600, align: 'left' });
    state.elements.push({ id: uid(), type: 'rect', x: 88, y: canvas.height * .76, w: canvas.width - 176, h: 112, fill: state.profession.colors[1], radius: 28 });
    state.elements.push({ id: uid(), type: 'text', text: 'Fale comigo hoje', x: 120, y: canvas.height * .79, w: canvas.width - 240, h: 70, fontSize: 38, color: '#ffffff', weight: 900, align: 'center' });
    select(null); render();
  }

  function templateAlerta() {
    state.bg = '#090b16'; state.elements = []; addBackgroundGlow();
    state.elements.push({ id: uid(), type: 'text', text: 'ALERTA PARA CLIENTES', x: 84, y: 92, w: 420, h: 54, fontSize: 30, color: state.profession.colors[2], weight: 900, align: 'left' });
    state.elements.push({ id: uid(), type: 'text', text: 'Uma decisao simples hoje pode evitar prejuizo amanha.', x: 84, y: 180, w: canvas.width - 168, h: 300, fontSize: 82, color: '#ffffff', weight: 900, align: 'left' });
    state.elements.push({ id: uid(), type: 'text', text: 'Revise suas opcoes com criterio antes de contratar ou renovar.', x: 88, y: canvas.height * .62, w: canvas.width - 176, h: 110, fontSize: 34, color: 'rgba(255,255,255,.74)', weight: 600, align: 'left' });
    select(null); render();
  }

  function templateProva() {
    state.bg = state.profession.colors[0]; state.elements = []; addBackgroundGlow();
    state.elements.push({ id: uid(), type: 'text', text: 'METODO PROFISSIONAL', x: 90, y: 110, w: 520, h: 56, fontSize: 30, color: state.profession.colors[3], weight: 900, align: 'left' });
    state.elements.push({ id: uid(), type: 'text', text: 'Clareza, estrategia e acompanhamento.', x: 90, y: 210, w: canvas.width - 180, h: 260, fontSize: 78, color: '#ffffff', weight: 900, align: 'left' });
    state.elements.push({ id: uid(), type: 'rect', x: 90, y: canvas.height * .68, w: canvas.width - 180, h: 170, fill: 'rgba(255,255,255,.09)', radius: 28 });
    state.elements.push({ id: uid(), type: 'text', text: 'Atendimento consultivo para quem precisa decidir melhor.', x: 130, y: canvas.height * .72, w: canvas.width - 260, h: 90, fontSize: 34, color: '#ffffff', weight: 700, align: 'left' });
    select(null); render();
  }

  function templateEducativo() {
    state.bg = '#06111f'; state.elements = []; addBackgroundGlow();
    state.elements.push({ id: uid(), type: 'text', text: '3 pontos antes de decidir', x: 86, y: 105, w: canvas.width - 172, h: 170, fontSize: 76, color: '#ffffff', weight: 900, align: 'left' });
    ['Entenda o custo real', 'Compare beneficios', 'Fale com um especialista'].forEach((txt, i) => {
      state.elements.push({ id: uid(), type: 'rect', x: 86, y: 340 + i * 150, w: canvas.width - 172, h: 105, fill: 'rgba(255,255,255,.08)', radius: 24 });
      state.elements.push({ id: uid(), type: 'text', text: (i + 1) + '. ' + txt, x: 120, y: 366 + i * 150, w: canvas.width - 240, h: 60, fontSize: 34, color: '#ffffff', weight: 800, align: 'left' });
    });
    select(null); render();
  }

  function addBackgroundGlow() {
    state.elements.push({ id: uid(), type: 'circle', x: canvas.width * .72, y: canvas.height * .18, r: canvas.width * .28, fill: state.profession.colors[1], opacity: .28 });
    state.elements.push({ id: uid(), type: 'circle', x: canvas.width * .18, y: canvas.height * .86, r: canvas.width * .24, fill: state.profession.colors[2], opacity: .18 });
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = state.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
    state.elements.forEach(drawElement);
    drawSelection();
    renderLayers();
  }

  function drawElement(el) {
    ctx.save(); ctx.globalAlpha = el.opacity == null ? 1 : el.opacity;
    if (el.type === 'circle') { ctx.fillStyle = el.fill; ctx.filter = 'blur(60px)'; ctx.beginPath(); ctx.arc(el.x, el.y, el.r, 0, Math.PI * 2); ctx.fill(); ctx.filter = 'none'; }
    if (el.type === 'rect') { roundRect(el.x, el.y, el.w, el.h, el.radius || 0, el.fill); }
    if (el.type === 'image' && el.img) { ctx.drawImage(el.img, el.x, el.y, el.w, el.h); }
    if (el.type === 'text') {
      if (el.badge || el.fill) roundRect(el.x, el.y, el.w, el.h, 18, el.fill || 'rgba(255,255,255,.08)');
      ctx.fillStyle = el.color || '#fff'; ctx.font = (el.weight || 700) + ' ' + (el.fontSize || 40) + 'px Inter, Arial, sans-serif'; ctx.textAlign = el.align || 'left'; ctx.textBaseline = 'top';
      wrapText(el.text || '', el.x, el.y, el.w, el.fontSize || 40, (el.fontSize || 40) * 1.08, el.align || 'left');
    }
    ctx.restore();
  }

  function roundRect(x, y, w, h, r, fill) {
    ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.fill();
  }

  function wrapText(text, x, y, maxWidth, fontSize, lineHeight, align) {
    const words = text.split(/\s+/); let line = ''; let yy = y; const tx = align === 'center' ? x + maxWidth / 2 : align === 'right' ? x + maxWidth : x;
    words.forEach((word, idx) => {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && idx > 0) { ctx.fillText(line, tx, yy); line = word; yy += lineHeight; } else { line = test; }
    });
    if (line) ctx.fillText(line, tx, yy);
  }

  function drawSelection() {
    const el = selected(); if (!el || el.type === 'circle') return;
    ctx.save(); ctx.strokeStyle = '#2ee7ff'; ctx.lineWidth = 3; ctx.setLineDash([12, 8]); ctx.strokeRect(el.x - 6, el.y - 6, el.w + 12, el.h + 12); ctx.setLineDash([]); ctx.fillStyle = '#2ee7ff'; ctx.fillRect(el.x + el.w - 10, el.y + el.h - 10, 20, 20); ctx.restore();
  }

  function getPoint(evt) {
    const rect = canvas.getBoundingClientRect(); const e = evt.touches ? evt.touches[0] : evt;
    return { x: (e.clientX - rect.left) / state.zoom, y: (e.clientY - rect.top) / state.zoom };
  }
  function touch(fn) { return e => { e.preventDefault(); fn(e); }; }

  function onDown(evt) {
    const p = getPoint(evt); const hit = [...state.elements].reverse().find(el => hitTest(el, p.x, p.y));
    select(hit ? hit.id : null);
    if (hit) { state.dragging = true; state.dragOffset = { x: p.x - hit.x, y: p.y - hit.y }; }
    render();
  }
  function onMove(evt) { if (!state.dragging) return; const el = selected(); if (!el) return; const p = getPoint(evt); el.x = p.x - state.dragOffset.x; el.y = p.y - state.dragOffset.y; syncProps(); render(); }
  function onUp() { state.dragging = false; }
  function hitTest(el, x, y) { if (el.type === 'circle') return false; return x >= el.x && y >= el.y && x <= el.x + el.w && y <= el.y + el.h; }

  function select(id) { state.selected = id; syncProps(); renderLayers(); }
  function syncProps() {
    const el = selected(); qs('selectedType').textContent = el ? el.type : 'nenhum';
    qs('propText').value = el && el.type === 'text' ? el.text : '';
    qs('propFont').value = el && el.type === 'text' ? el.fontSize : '';
    qs('propColor').value = rgbToHex(el && el.color ? el.color : '#ffffff');
    qs('propBg').value = rgbToHex(el && (el.fill || state.bg) ? (el.fill || state.bg) : '#080b16');
  }

  function updateSelectedFromProps() {
    const el = selected(); if (!el) return;
    if (el.type === 'text') { el.text = qs('propText').value; el.fontSize = Number(qs('propFont').value) || el.fontSize; el.color = qs('propColor').value; if (el.badge || el.fill) el.fill = qs('propBg').value; }
    else if (el.type === 'rect') { el.fill = qs('propBg').value; }
    render();
  }

  function rgbToHex(v) { return /^#/.test(v || '') ? v : '#ffffff'; }
  function deleteSelected() { if (!state.selected) return; state.elements = state.elements.filter(e => e.id !== state.selected); state.selected = null; syncProps(); render(); }
  function bringFront() { const el = selected(); if (!el) return; state.elements = state.elements.filter(e => e.id !== el.id); state.elements.push(el); render(); }

  function renderLayers() {
    qs('layersList').innerHTML = [...state.elements].reverse().filter(e => e.type !== 'circle').map(e => '<div class="layer ' + (e.id === state.selected ? 'active' : '') + '" data-layer="' + e.id + '">' + layerName(e) + '</div>').join('') || '<p class="muted">Nenhuma camada.</p>';
    qs('layersList').querySelectorAll('[data-layer]').forEach(l => l.onclick = () => { select(l.dataset.layer); render(); });
  }
  function layerName(el) { if (el.type === 'text') return 'Texto: ' + (el.text || '').slice(0, 24); if (el.type === 'image') return 'Imagem enviada'; return 'Forma'; }

  function exportImage(type) {
    const old = state.selected; state.selected = null; render();
    const mime = type === 'jpeg' ? 'image/jpeg' : 'image/png';
    const a = document.createElement('a'); a.download = 'estudio-ovc-' + Date.now() + '.' + (type === 'jpeg' ? 'jpg' : 'png'); a.href = canvas.toDataURL(mime, .94); a.click();
    state.selected = old; render();
  }

  function serialize() { return { format: state.format, bg: state.bg, profession: state.profession.id, elements: state.elements.map(e => ({ ...e, img: undefined })) }; }
  function saveProject() { localStorage.setItem(projectKey, JSON.stringify(serialize())); alert('Projeto salvo neste navegador.'); }
  function loadProject() {
    const raw = localStorage.getItem(projectKey); if (!raw) return alert('Nenhum projeto salvo.');
    const data = JSON.parse(raw); state.profession = professions.find(p => p.id === data.profession) || professions[0]; qs('professionSelect').value = state.profession.id; applyFormat(data.format || 'post'); state.bg = data.bg || '#080b16'; state.elements = data.elements || []; hydrateImages().then(() => { select(null); render(); });
  }
  async function hydrateImages() { await Promise.all(state.elements.filter(e => e.type === 'image' && e.src).map(e => new Promise(resolve => { const img = new Image(); img.onload = () => { e.img = img; resolve(); }; img.onerror = resolve; img.src = e.src; }))); }
  function clearProject() { if (!confirm('Limpar a tela atual?')) return; state.elements = []; state.bg = state.profession.colors[0]; select(null); render(); }

  async function generateCopy() {
    const profession = state.profession.name; const objective = qs('objectiveSelect').value; const brief = qs('briefInput').value.trim();
    if (!brief) return alert('Descreva o que voce quer criar.');
    const base = 'Profissao: ' + profession + '. Objetivo: ' + objective + '. Briefing: ' + brief + '. Gere uma chamada curta para arte, um subtitulo, uma legenda de Instagram e um CTA.';
    qs('copyResult').textContent = 'Gerando texto...';
    let text = localCopy(profession, objective, brief);
    try {
      const res = await fetch('/api/inteligencia', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tool: 'reescrever', text: base }) });
      const data = await res.json(); if (data.ok && data.result) text = data.result;
    } catch (err) { console.error(err); }
    qs('copyResult').innerHTML = escapeHtml(text) + '<br><button id="useCopy" class="ghost">Usar chamada na arte</button>';
    qs('useCopy').onclick = () => { const first = text.split(/[\n.]/).find(Boolean) || text; addText(first.slice(0, 90), 70, true); };
  }

  function localCopy(profession, objective, brief) {
    return 'Chamada: Decida melhor com orientacao profissional.\nSubtitulo: ' + brief + '\nLegenda: Para ' + profession.toLowerCase() + ', comunicacao clara gera confianca e acelera decisoes. Se voce quer ' + objective + ', comece explicando o beneficio de forma simples.\nCTA: Fale comigo e veja as melhores opcoes.';
  }
  function escapeHtml(str) { return str.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])); }

  document.addEventListener('DOMContentLoaded', init);
})();
