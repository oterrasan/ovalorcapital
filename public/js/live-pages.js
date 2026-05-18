(function(){
  const CURRENCY = new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:2 });
  const BIG_CURRENCY = new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:0 });
  const INT = new Intl.NumberFormat('pt-BR');
  function q(sel,root=document){ return root.querySelector(sel); }
  function qa(sel,root=document){ return Array.from(root.querySelectorAll(sel)); }
  function pct(v){ return `${v>0?'+':''}${Number(v).toFixed(2).replace('.',',')}%`; }
  function safe(v, fallback='—'){ return (v===undefined||v===null||v==='') ? fallback : v; }
  async function loadLive(){
    try { return await OVC.fetchJSON('/api/live-data'); } catch { return null; }
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
          <p>Central de transmissões públicas, institucionais e econômicas selecionadas pelo OVC.</p>
          <div class="ovc-live-frame">${hero.url ? `<iframe src="${hero.url}" title="${hero.label}" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>` : '<div class="ovc-live-fallback">Canal em preparação.</div>'}</div>
        </div>
        <aside class="ovc-panel ovc-live-side">
          <h3>Canais disponíveis</h3>
          <div class="ovc-live-list">${channels.map(item => `<a class="ovc-live-link" href="${item.url}" target="_blank" rel="noopener"><strong>${item.label}</strong><span>${safe(item.group,'ao vivo')}</span></a>`).join('')}</div>
          <div class="ovc-banner-slot"><div><strong>Slot premium discreto</strong><span>Patrocínio para plataformas financeiras, dados e parceiros institucionais.</span></div></div>
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
          <div class="ovc-kicker">Rádio OVC</div>
          <h1>${safe(radio.name,'Rádio OVC')}</h1>
          <p>Boletins, programas curtos, cobertura de mercado e faixas especiais em áudio.</p>
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
      'Copa do Mundo','Fórmula 1','Campeonato Brasileiro Série A','Libertadores',
      'Sul-Americana','Campeonatos Europeus','Campeonato Brasileiro Série B',
      'Olimpíadas','Tênis','Basquete','MMA & UFC',
      'Cinema & Streaming','Música','Games & E-sports','Viagens & Turismo',
      'Corrupção','Fiscalização & Controle','Fiscalização de Políticos','Eleições',
      'Dólar & Câmbio','Real & Economia Doméstica','Automóveis & Lançamentos',
      'Imóvel & Casa','Impostos & Fiscal'
    ];
    const cards = [
      ['IBOV', `${INT.format(Number(live?.indices?.ibov||128450))} pts`, '/dados/cotacoes/?ticker=ibov'],
      ['Selic', `${safe(live?.indices?.selic,10.5)}%`, '/dados/cotacoes/?ticker=selic'],
      ['CDI', `${safe(live?.indices?.cdi,10.4)}%`, '/dados/cotacoes/?ticker=cdi'],
      ['IPCA', `${safe(live?.indices?.ipca,4.2)}%`, '/dados/cotacoes/?ticker=ipca'],
      ['Dólar', CURRENCY.format(Number(live?.rates?.usd||5.2)), '/dados/cotacoes/?ticker=dolar'],
      ['Euro', CURRENCY.format(Number(live?.rates?.eur||5.7)), '/dados/cotacoes/?ticker=euro'],
      ['Bitcoin', BIG_CURRENCY.format(Number(live?.rates?.btc||380000)), '/dados/cotacoes/?ticker=bitcoin'],
      ['Impostômetro', BIG_CURRENCY.format(Number(live?.impostometro||0)), '/ferramentas/impostometro/']
    ];
    mount.innerHTML = `
      <section class="ovc-panel ovc-hero"><span class="ovc-badge">Radar OVC</span><h1>Radar OVC</h1><p>Painel de indicadores, notícias e atalhos editoriais do portal.</p></section>
      <section class="ovc-live-card-grid">${cards.map(([label,val,href]) => `<a class="ovc-data-card ovc-stat" href="${href}"><div class="ovc-kicker">Indicador</div><strong>${label}</strong><p>${val}</p></a>`).join('')}</section>
      <div id="radar-news-panels" style="margin-top:28px"><p style="color:#888;text-align:center;padding:32px 0">Carregando notícias…</p></div>`;
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
      panelsEl.innerHTML = `<p style="color:#888;text-align:center;padding:40px 0">Nenhuma notícia disponível ainda. Aguarde a próxima geração do Radar.</p>`;
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
      ibov: ['Ibovespa', `${INT.format(Number(live?.indices?.ibov||128450))} pts`, 'Índice de referência do mercado acionário brasileiro.'],
      selic: ['Selic', `${safe(live?.indices?.selic,10.5)}%`, 'Taxa básica de juros.'],
      cdi: ['CDI', `${safe(live?.indices?.cdi,10.4)}%`, 'Referência para renda fixa e crédito.'],
      ipca: ['IPCA', `${safe(live?.indices?.ipca,4.2)}%`, 'Inflação oficial acompanhada pelo mercado.'],
      dolar: ['Dólar', CURRENCY.format(Number(live?.rates?.usd||5.2)), 'Cotação de referência em reais.'],
      euro: ['Euro', CURRENCY.format(Number(live?.rates?.eur||5.7)), 'Cotação de referência em reais.'],
      bitcoin: ['Bitcoin', BIG_CURRENCY.format(Number(live?.rates?.btc||380000)), 'Criptoativo acompanhado no Radar OVC.'],
      ouro: ['Ouro', 'US$ 2.380', 'Proteção e referência internacional.'],
      usd: ['Dólar', CURRENCY.format(Number(live?.rates?.usd||5.2)), 'Cotação de referência em reais.'],
      btc: ['Bitcoin', BIG_CURRENCY.format(Number(live?.rates?.btc||380000)), 'Criptoativo acompanhado no Radar OVC.']
    };
    const chosen = meta[ticker] || meta.ibov;
    const list = [
      ['Dólar', CURRENCY.format(Number(live?.rates?.usd||5.2)), 'dolar'],
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
        <section class="ovc-panel"><h3>Painel de cotações</h3><div class="ovc-live-list">${list.map(item => `<a class="ovc-live-link" href="/dados/cotacoes/?ticker=${item[2]}"><strong>${item[0]}</strong><span>${item[1]}</span></a>`).join('')}</div></section>
      </section>`;
  }
  function mountImpostometro(live){
    const mount = q('[data-impostometro-page]');
    if (!mount) return;
    mount.innerHTML = `
      <section class="ovc-panel ovc-hero"><span class="ovc-badge">Fiscal</span><h1>Impostômetro</h1><p>Leitura fiscal em atualização contínua para compor a experiência editorial do portal.</p></section>
      <section class="ovc-live-card-grid" style="margin-top:18px">
        <article class="ovc-data-card ovc-stat"><div class="ovc-kicker">Acumulado</div><strong>${BIG_CURRENCY.format(Number(live?.impostometro||0))}</strong><p>Estimativa exibida no portal em tempo real.</p></article>
        <a class="ovc-data-card ovc-stat" href="/economia/minuto-fiscal/"><div class="ovc-kicker">Editorial</div><strong>Minuto Fiscal</strong><p>Contexto e interpretação para o usuário final.</p></a>
        <a class="ovc-data-card ovc-stat" href="/dados/agenda-economica/"><div class="ovc-kicker">Agenda</div><strong>Próximos eventos</strong><p>Gatilhos econômicos, fiscais e monetários.</p></a>
      </section>`;
  }
  async function init(){
    const live = await loadLive();
    mountTV(live || {}); mountRadio(live || {}); mountRadar(live || {}); mountQuotes(live || {}); mountImpostometro(live || {});
  }
  document.addEventListener('DOMContentLoaded', init);
})();
