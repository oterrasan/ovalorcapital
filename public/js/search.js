(async function(){
  const q = new URLSearchParams(location.search).get('q') || '';
  const input = document.getElementById('ovc-search-input');
  const results = document.getElementById('ovc-search-results');
  const all = await OVC.loadJson('/data/articles.json');
  input.value = q;
  function render(term) {
    const query = term.trim().toLowerCase();
    const items = !query ? [] : all.filter(item => [item.title,item.excerpt,item.categoryLabel,item.sectionLabel].join(' ').toLowerCase().includes(query)).slice(0, 24);
    results.innerHTML = items.length ? items.map(item => `<article class="ovc-result"><div class="ovc-kicker">${item.categoryLabel} · ${item.sectionLabel}</div><h3><a href="${item.url}">${item.title}</a></h3><p>${item.excerpt}</p><div class="ovc-meta"><span>${item.relativeDate || ''}</span></div></article>`).join('') : `<div class="ovc-empty">Nenhum resultado encontrado.</div>`;
  }
  render(q);
  input.addEventListener('input', e => {
    const term = e.target.value;
    const url = new URL(location.href);
    if (term) url.searchParams.set('q', term); else url.searchParams.delete('q');
    history.replaceState({}, '', url);
    render(term);
  });
})();
