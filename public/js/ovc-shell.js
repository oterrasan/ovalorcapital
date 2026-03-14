(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // Theme ALWAYS light (dark mode removed)
  const body = document.body;
  body.setAttribute('data-theme', 'light');
  localStorage.removeItem('ovc-theme');

  // Theme toggle removed - always light mode

  // Active menu highlight
  const path = (location.pathname || '/').replace(/\/+$/,'/') || '/';
  $$('.supermenu-item > a.label').forEach(a => {
    const href = (a.getAttribute('href') || '').replace(/\/+$/,'/');
    if (href && (path === href || (href !== '/' && path.startsWith(href)))) {
      a.classList.add('active');
    }
  });

  // Make chips clickable without changing markup (preserva visual)
  const chipRoutes = new Map([
    ['IRPF 2025','/tributos/irpf-2025/'],
    ['Reforma Tributária','/tributos/reforma-tributaria/'],
    ['Salário & Empregos','/educacao/'],
    ['Família & Patrimônio','/familia/'],

    ['CÂMBIO','/dados/cotacoes/?asset=usd'],
    ['ORÇAMENTO','/economia/fiscal-orcamento-divida-pib-primario/'],
    ['BACEN','/regulacao/'],
    ['CVM','/regulacao/'],
    ['SUSEP','/regulacao/'],
    ['ANS','/regulacao/'],
    ['INDÚSTRIA','/industria/'],
    ['LOGÍSTICA','/industria/logistica/'],
    ['TECNOLOGIA','/tecnologia/'],
    ['ESPORTES','/esportes/'],
    ['SAÚDE','/saude/'],
    ['FAMÍLIA','/familia/'],
    ['EVENTOS','/dados/agenda-economica/'],
    ['IRPF','/tributos/irpf-2025/'],
    ['COTAÇÕES','/dados/cotacoes/'],
    ['CONSULTORIA','/vc/'],
    ['EMPREGOS','/educacao/'],
    ['SELIC','/dados/agenda-economica/'],
    ['IPCA','/dados/agenda-economica/']
  ]);

  function wireChip(el){
    const txt = (el.textContent || '').trim();
    const target = chipRoutes.get(txt);
    if (!target) return;
    el.setAttribute('tabindex','0');
    el.setAttribute('role','link');
    el.addEventListener('click', () => { location.href = target; });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); location.href = target; }
    });
  }

  $$('.search-chip').forEach(chip => {
    // ignore <a.search-chip>
    if (chip.tagName.toLowerCase() === 'a') return;
    wireChip(chip);
  });
  $$('.chip-pill').forEach(pill => {
    if (pill.tagName.toLowerCase() === 'a') return;
    wireChip(pill);
  });

  // Impostômetro (header + sidebar)
  function fmtBRL(n){
    try { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(n); }
    catch { return 'R$ ' + String(n); }
  }

  async function updateImpostometro(){
    const elTop = document.getElementById('impostometro');
    const els = $$('[data-impostometro]');
    if (!elTop && !els.length) return;
    try {
      const r = await fetch('/api/impostometro', { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP '+r.status);
      const j = await r.json();
      const v = j && typeof j.value === 'number' ? j.value : null;
      if (v == null) return;
      if (elTop) elTop.textContent = fmtBRL(v);
      els.forEach(x => x.textContent = fmtBRL(v));
    } catch(e) {
      // silencioso
    }
  }
  updateImpostometro();
})();
