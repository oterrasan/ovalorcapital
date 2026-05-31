(function(){
  const CURRENCY = new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:2 });
  const BIG_CURRENCY = new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:0 });
  const INT = new Intl.NumberFormat('pt-BR');
  function q(sel,root=document){ return root.querySelector(sel); }
  function qa(sel,root=document){ return Array.from(root.querySelectorAll(sel)); }
  function pct(v){ return `${v>0?'+':''}${Number(v).toFixed(2).replace('.',',')}%`; }
  function safe(v, fallback='â€”'){ return (v===undefined||v===null||v==='') ? fallback : v; }
  async function loadLive(){
    try { return await OVC.fetchJSON('/api/live-data'); } catch { return null; }
  }
  function mountStandardRail(){
    const rail = q('[data-banner-sidebar]');
    if (!rail || rail.dataset.ready === '1') return;
    rail.dataset.ready = '1';
    rail.innerHTML = `
      <section class="ovc-panel ovc-story-list">
        <h3>Central OVC</h3>
        <div class="ovc-mini-list">
          <article class="ovc-mini-item"><div><h4><a href="/radar/">Radar OVC</a></h4><p>Indicadores, atalhos e atualizacoes do dia.</p></div><div></div></article>
          <article class="ovc-mini-item"><div><h4><a href="/dados/">Dados OVC</a></h4><p>Cotacoes, agenda economica e paineis do portal.</p></div><div></div></article>
          <article class="ovc-mini-item"><div><h4><a href="/newsletter/">Newsletter</a></h4><p>Resumo editorial para acompanhar os principais temas.</p></div><div></div></article>
        </div>
      </section>
      <section class="ovc-panel ovc-story-list" style="margin-top:18px">
        <h3>Redacao OVC</h3>
        <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0 0 12px">Tem uma pauta, denuncia ou oportunidade institucional?</p>
        <a class="ovc-btn" href="/contato/" style="display:flex;justify-content:center">Enviar para a redacao</a>
      </section>`;
  }
  function radioScheduleHtml(schedule=[]){
    return schedule.map(item => `<li><strong>${item.time}</strong><span>${item.label}</span></li>`).join('');
  }
  function mountTV(live){
    const mount = q('[data-tv-page]');
    if (!mount) return;
    const channels = (live?.tv || []).filter(item => item.active !== false);
    const hero = channels[0] || { label:'OVC TV', url:'', group:'ao vivo', kind:'embed' };
    mount.innerHTML = `
      <section class="ovc-live-grid">
        <div class="ovc-panel ovc-live-hero">
          <div class="ovc-kicker">TV OVC</div>
          <h1>${safe(hero.label,'TV OVC')}</h1>
          <p>Central de transmissÃµes pÃºblicas, institucionais e econÃ´micas selecionadas pelo OVC.</p>
          <div class="ovc-live-frame">${hero.url ? `<iframe src="${hero.url}" title="${hero.label}" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>` : '<div class="ovc-live-fallback">Canal em preparaÃ§Ã£o.</div>'}</div>
        </div>
        <aside class="ovc-panel ovc-live-side">
          <h3>Canais disponÃ­veis</h3>
          <div class="ovc-live-list">${channels.map(item => `<a class="ovc-live-link" href="${item.url}" target="_blank" rel="noopener"><strong>${item.label}</strong><span>${safe(item.group,'ao vivo')}</span></a>`).join('')}</div>
          <div class="ovc-banner-slot"><div><strong>Slot premium discreto</strong><span>PatrocÃ­nio para plataformas financeiras, dados e parceiros institucionais.</span></div></div>
        </aside>
      </section>`;
  }
  function mountRadio(live){
    const mount = q('[data-radio-page]');
    if (!mount) return;
    const radio = live?.radio || {};
    const stream = radio.streamUrl || radio.fallbackUrl || '';
    mount.innerHTML = `
      <section class="ovc-live-grid">
        <div class="ovc-panel ovc-live-hero">
          <div class="ovc-kicker">RÃ¡dio OVC</div>
          <h1>${safe(radio.name,'RÃ¡dio OVC')}</h1>
          <p>Boletins, programas curtos, cobertura de mercado e faixas especiais em Ã¡udio.</p>
          <audio controls preload="none" style="width:100%"><source src="${stream}"></audio>
          <div class="ovc-note" style="margin-top:12px">Programa atual: <strong>${safe(radio.currentShow,'Ao vivo')}</strong></div>
        </div>
        <aside class="ovc-panel ovc-live-side">
          <h3>Grade</h3>
          <ul class="ovc-schedule-list">${radioScheduleHtml(radio.schedule || [])}</ul>
          <div class="ovc-links-list"><a href="/tv-ovc/">TV OVC</a><a href="/radar/">Radar</a><a href="/newsletter/">Newsletter</a></div>
        </aside>
      </section>`;
  }
  async function mountRadar(live){
    const mount = q('[data-radar-page]');
    if (!mount) return;
    const SUBCATS = [
      'Copa do Mundo','FÃ³rmula 1','Campeonato Brasileiro SÃ©rie A','Libertadores',
      'Sul-Americana','Campeonatos Europeus','Campeonato Brasileiro SÃ©rie B',
      'OlimpÃ­adas','TÃªnis','Basquete','MMA & UFC',
      'Cinema & Streaming','MÃºsica','Games & E-sports','Viagens & Turismo',
      'CorrupÃ§Ã£o','FiscalizaÃ§Ã£o & Controle','FiscalizaÃ§Ã£o de PolÃ­ticos','EleiÃ§Ãµes',
      'DÃ³lar & CÃ¢mbio','Real & Economia DomÃ©stica','AutomÃ³veis & LanÃ§amentos',
      'ImÃ³vel & Casa','Impostos & Fiscal'
    ];
    const cards = [
      ['IBOV', `${INT.format(Number(live?.indices?.ibov||128450))} pts`, '/dados/cotacoes/?ticker=ibov'],
      ['Selic', `${safe(live?.indices?.selic,10.5)}%`, '/dados/cotacoes/?ticker=selic'],
      ['CDI', `${safe(live?.indices?.cdi,10.4)}%`, '/dados/cotacoes/?ticker=cdi'],
      ['IPCA', `${safe(live?.indices?.ipca,4.2)}%`, '/dados/cotacoes/?ticker=ipca'],
      ['DÃ³lar', CURRENCY.format(Number(live?.rates?.usd||5.2)), '/dados/cotacoes/?ticker=dolar'],
      ['Euro', CURRENCY.format(Number(live?.rates?.eur||5.7)), '/dados/cotacoes/?ticker=euro'],
      ['Bitcoin', BIG_CURRENCY.format(Number(live?.rates?.btc||380000)), '/dados/cotacoes/?ticker=bitcoin'],
      ['ImpostÃ´metro', BIG_CURRENCY.format(Number(live?.impostometro||0)), '/ferramentas/impostometro/']
    ];
    mount.innerHTML = `
      <section class="ovc-panel ovc-hero"><span class="ovc-badge">Radar OVC</span><h1>Radar OVC</h1><p>Painel de indicadores, notÃ­cias e atalhos editoriais do portal.</p></section>
      <section class="ovc-live-card-grid">${cards.map(([label,val,href]) => `<a class="ovc-data-card ovc-stat" href="${href}"><div class="ovc-kicker">Indicador</div><strong>${label}</strong><p>${val}</p></a>`).join('')}</section>
      <div id="radar-news-panels" style="margin-top:28px"><p style="color:#888;text-align:center;padding:32px 0">Carregando notÃ­ciasâ€¦</p></div>`;
    let posts = [];
    try {
      const data = await OVC.fetchJSON('/api/portal-posts?categoria=radar&limit=60');
      posts = Array.isArray(data) ? data : (data?.posts || []);
    } catch(e) {}
    const panelsEl = mount.querySelector('#radar-news-panels');
    if (!panelsEl) return;
    const bySubcat = {};
    for (const p of posts) {
      const sub = p.subcategoria || 'Outros';
      if (!bySubcat[sub]) bySubcat[sub] = [];
      bySubcat[sub].push(p);
    }
    const orderedSubs = [...SUBCATS, ...Object.keys(bySubcat).filter(k => !SUBCATS.includes(k))];
    const activeSubs = orderedSubs.filter(s => bySubcat[s]?.length);
    if (!activeSubs.length) {
      panelsEl.innerHTML = `<p style="color:#888;text-align:center;padding:40px 0">Nenhuma notÃ­cia disponÃ­vel ainda. Aguarde a prÃ³xima geraÃ§Ã£o do Radar.</p>`;
      return;
    }
    const panelHtml = activeSubs.map(sub => {
      const items = bySubcat[sub].slice(0, 5);
      const rows = items.map(p => {
        const date = p.data ? new Date(p.data).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}) : '';
        return `<article class="ovc-mini-item"><div><h4><a href="${p.url}">${p.titulo}</a></h4>${date ? `<time style="font-size:.75rem;color:#999">${date}</time>` : ''}</div></article>`;
      }).join('');
      return `<section class="ovc-panel ovc-story-list" style="break-inside:avoid;margin-bottom:0"><h3>${sub}</h3><div class="ovc-mini-list">${rows}</div></section>`;
    }).join('');
    panelsEl.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">${panelHtml}</div>`;
  }
  function mountQuotes(live){
    const mount = q('[data-quotes-page]');
    if (!mount) return;
    const ticker = (new URLSearchParams(location.search).get('ticker') || 'ibov').toLowerCase();
    const meta = {
      ibov: ['Ibovespa', `${INT.format(Number(live?.indices?.ibov||128450))} pts`, 'Ãndice de referÃªncia do mercado acionÃ¡rio brasileiro.'],
      selic: ['Selic', `${safe(live?.indices?.selic,10.5)}%`, 'Taxa bÃ¡sica de juros.'],
      cdi: ['CDI', `${safe(live?.indices?.cdi,10.4)}%`, 'ReferÃªncia para renda fixa e crÃ©dito.'],
      ipca: ['IPCA', `${safe(live?.indices?.ipca,4.2)}%`, 'InflaÃ§Ã£o oficial acompanhada pelo mercado.'],
      dolar: ['DÃ³lar', CURRENCY.format(Number(live?.rates?.usd||5.2)), 'CotaÃ§Ã£o de referÃªncia em reais.'],
      euro: ['Euro', CURRENCY.format(Number(live?.rates?.eur||5.7)), 'CotaÃ§Ã£o de referÃªncia em reais.'],
      bitcoin: ['Bitcoin', BIG_CURRENCY.format(Number(live?.rates?.btc||380000)), 'Criptoativo acompanhado no Radar OVC.'],
      ouro: ['Ouro', 'US$ 2.380', 'ProteÃ§Ã£o e referÃªncia internacional.'],
      usd: ['DÃ³lar', CURRENCY.format(Number(live?.rates?.usd||5.2)), 'CotaÃ§Ã£o de referÃªncia em reais.'],
      btc: ['Bitcoin', BIG_CURRENCY.format(Number(live?.rates?.btc||380000)), 'Criptoativo acompanhado no Radar OVC.']
    };
    const chosen = meta[ticker] || meta.ibov;
    const list = [
      ['DÃ³lar', CURRENCY.format(Number(live?.rates?.usd||5.2)), 'dolar'],
      ['Euro', CURRENCY.format(Number(live?.rates?.eur||5.7)), 'euro'],
      ['Bitcoin', BIG_CURRENCY.format(Number(live?.rates?.btc||380000)), 'bitcoin'],
      ['Ibovespa', `${INT.format(Number(live?.indices?.ibov||128450))} pts`, 'ibov'],
      ['Selic', `${safe(live?.indices?.selic,10.5)}%`, 'selic'],
      ['CDI', `${safe(live?.indices?.cdi,10.4)}%`, 'cdi'],
      ['IPCA', `${safe(live?.indices?.ipca,4.2)}%`, 'ipca']
    ];
    mount.innerHTML = `
      <section class="ovc-data-layout">
        <div class="ovc-panel ovc-hero"><span class="ovc-badge">Dados OVC</span><h1>${chosen[0]}</h1><p>${chosen[2]}</p><div class="ovc-quote-hero">${chosen[1]}</div></div>
        <section class="ovc-panel"><h3>Painel de cotaÃ§Ãµes</h3><div class="ovc-live-list">${list.map(item => `<a class="ovc-live-link" href="/dados/cotacoes/?ticker=${item[2]}"><strong>${item[0]}</strong><span>${item[1]}</span></a>`).join('')}</div></section>
      </section>`;
  }
  function mountImpostometro(live){
    const mount = q('[data-impostometro-page]');
    if (!mount) return;
    mount.innerHTML = `
      <section class="ovc-panel ovc-hero"><span class="ovc-badge">Fiscal</span><h1>ImpostÃ´metro</h1><p>Leitura fiscal em atualizaÃ§Ã£o contÃ­nua para compor a experiÃªncia editorial do portal.</p></section>
      <section class="ovc-live-card-grid" style="margin-top:18px">
        <article class="ovc-data-card ovc-stat"><div class="ovc-kicker">Acumulado</div><strong>${BIG_CURRENCY.format(Number(live?.impostometro||0))}</strong><p>Estimativa exibida no portal em tempo real.</p></article>
        <a class="ovc-data-card ovc-stat" href="/economia/minuto-fiscal/"><div class="ovc-kicker">Editorial</div><strong>Minuto Fiscal</strong><p>Contexto e interpretaÃ§Ã£o para o usuÃ¡rio final.</p></a>
        <a class="ovc-data-card ovc-stat" href="/dados/agenda-economica/"><div class="ovc-kicker">Agenda</div><strong>PrÃ³ximos eventos</strong><p>Gatilhos econÃ´micos, fiscais e monetÃ¡rios.</p></a>
      </section>`;
  }
  async function init(){
    const live = await loadLive();
    mountStandardRail();
    mountTV(live || {}); mountRadio(live || {}); mountRadar(live || {}); mountQuotes(live || {}); mountImpostometro(live || {});
    mountStandardRail();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
