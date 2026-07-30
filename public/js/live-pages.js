(function(){
  function ensureLiveRails(){
    const main = document.querySelector('main.ovc-main');
    const mount = main && main.querySelector('[data-tv-page],[data-radio-page],[data-radar-page],[data-quotes-page],[data-agenda-page],[data-impostometro-page]');
    if (!main || !mount || main.querySelector('.ovc-right-rail')) return;
    const grid = document.createElement('section');
    grid.className = 'ovc-grid';
    const left = document.createElement('div');
    left.className = 'ovc-story-stack';
    const right = document.createElement('aside');
    right.className = 'ovc-right-rail';
    right.innerHTML = '<section data-banner-sidebar></section>';
    left.appendChild(mount);
    grid.appendChild(left);
    grid.appendChild(right);
    main.appendChild(grid);
  }
  ensureLiveRails();
  const script = document.createElement('script');
  script.src = '/js/live-pages-core.js?v=4';
  script.async = false;
  script.onload = function(){
    if (document.readyState !== 'loading') document.dispatchEvent(new Event('DOMContentLoaded'));
  };
  document.head.appendChild(script);
})();
