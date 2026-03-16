(async function(){
  const slug = document.body.dataset.category;
  const section = document.body.dataset.section || 'geral';
  const config = OVC.getCategoryConfig(slug);
  OVC.applyCategoryColor(slug);
  const all = await OVC.loadJson('/data/articles.json');
  const banners = await OVC.loadJson('/data/banners.json').catch(() => []);
  const filtered = all.filter(item => item.category === slug && (section === 'geral' || item.section === section || item.section === 'geral'));
  const featured = filtered[0] || all.find(item => item.category === slug);
  const main = filtered.slice(1, 5);
  const local = filtered.slice(5, 8);
  const rail = filtered.slice(8, 11);
  const bottom = filtered.slice(11, 20);
  if (featured) {
    document.querySelector('[data-hero-card]').innerHTML = `<article class="ovc-story-card${featured.image ? '' : ' no-thumb'}"><div><div class="ovc-kicker">${featured.source || config.title}</div><h2><a href="${featured.url}">${featured.title}</a></h2><p>${featured.excerpt || ''}</p><div class="ovc-meta"><span>${featured.relativeDate || ''}</span><span>${featured.readingTime || ''}</span></div></div>${featured.image ? `<a class="ovc-thumb" href="${featured.url}"><img src="${featured.image}" alt=""></a>` : ''}</article>`;
  }
  document.querySelector('[data-main-list]').innerHTML = OVC.renderMiniItems(main);
  document.querySelector('[data-local-list]').innerHTML = OVC.renderMiniItems(local);
  document.querySelector('[data-rail-list]').innerHTML = OVC.renderMiniItems(rail);
  const topicBoxes = document.querySelector('[data-topic-grid]');
  const titles = (document.body.dataset.topicTitles || '').split('|');
  const groups = [0,1,2].map(index => bottom.slice(index*3, index*3+3));
  topicBoxes.innerHTML = groups.map((group, idx) => `<section class="ovc-panel ovc-topic-box"><h3>${titles[idx] || config.title}</h3>${OVC.renderMiniItems(group)}</section>`).join('');
  const railBanner = banners.find(item => item.slot === 'sidebar_1' && item.active);
  if (railBanner) document.querySelector('[data-banner-sidebar]').innerHTML = `<div class="ovc-banner-slot"><div><strong>${railBanner.label}</strong><span>${railBanner.cta}</span></div><a class="ovc-btn secondary" href="${railBanner.url}">Saiba mais</a></div>`;
})();
