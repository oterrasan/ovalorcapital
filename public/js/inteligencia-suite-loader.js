(function(){
  function qs(sel, root){ return (root || document).querySelector(sel); }
  function qsa(sel, root){ return Array.from((root || document).querySelectorAll(sel)); }

  function loadCss(){
    if (qs('link[data-ovc-suite-css]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/inteligencia-suite.css?v=1';
    link.setAttribute('data-ovc-suite-css','true');
    document.head.appendChild(link);
  }

  function loadSuite(){
    if (qs('script[data-ovc-suite-js]')) return;
    var script = document.createElement('script');
    script.src = '/js/inteligencia-suite.js?v=1';
    script.defer = true;
    script.setAttribute('data-ovc-suite-js','true');
    document.body.appendChild(script);
  }

  function showSuite(){
    qsa('[data-inteligencia-panel]').forEach(function(panel){
      var show = panel.getAttribute('data-inteligencia-panel') === 'suite';
      panel.classList.toggle('hidden', !show);
      if (show) {
        panel.classList.remove('panel-fade');
        void panel.offsetWidth;
        panel.classList.add('panel-fade');
      }
    });
    qsa('[data-inteligencia-nav]').forEach(function(btn){
      btn.classList.toggle('active', btn.getAttribute('data-inteligencia-nav') === 'suite');
    });
    var title = qs('[data-inteligencia-title]');
    if (title) title.textContent = 'Central OVC Inteligencia';
    var badge = qs('[data-inteligencia-cat-badge]');
    if (badge) {
      badge.textContent = 'Suite';
      badge.className = 'text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-700';
    }
  }

  function bind(){
    document.addEventListener('click', function(event){
      var btn = event.target.closest('[data-inteligencia-nav="suite"]');
      if (!btn) return;
      event.preventDefault();
      showSuite();
    });
  }

  function init(){
    loadCss();
    loadSuite();
    bind();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
