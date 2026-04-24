(async function(){
  document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(location.search);
    const q = (params.get('q') || '').trim().toLowerCase();
    const input = document.querySelector('[data-search-page-input]') || document.getElementById('ovc-search-input');
    const results = document.querySelector('[data-search-results]') || document.getElementById('ovc-search-results');
    if (input) input.value = q;
    const content = await OVC.loadContent(['articles']);
    const articles = content.articles || [];
    function runSearch() {
      const query = (input?.value || '').trim().toLowerCase();
      const list = !query ? articles.slice(0, 30) : articles.filter(item => [item.title, item.excerpt, item.categoryLabel, item.sectionLabel, ...(item.tags || [])].join(' ').toLowerCase().includes(query));
      if (results) results.innerHTML = list.map(item => `<article class="ovc-search-result"><div class="ovc-kicker">${item.categoryLabel}</div><h3><a href="${OVC.articleUrl(item)}">${item.title}</a></h3><p>${item.excerpt || ''}</p><div class="ovc-meta"><span>${item.relativeDate || ''}</span><span>${item.readingTime || ''}</span></div></article>`).join('') || '<p>Nenhum resultado encontrado.</p>';
    }
    runSearch();
    document.querySelector('[data-search-submit]')?.addEventListener('click', () => {
      location.href = `/busca/?q=${encodeURIComponent(input?.value.trim() || '')}`;
    });
    input?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        location.href = `/busca/?q=${encodeURIComponent(input?.value.trim() || '')}`;
      }
    });
  });
})();
