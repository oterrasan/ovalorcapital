
(function(){
  const CURRENCY = new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:2 });
  const BIG_CURRENCY = new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:0 });
  const INT = new Intl.NumberFormat('pt-BR');
  function q(sel,root=document){ return root.querySelector(sel); }
  function qa(sel,root=document){ return Array.from(root.querySelectorAll(sel)); }
  function pct(v){ return `${v>0?'+':''}${Number(v).toFixed(2).replace('.',',')}%`; }
  function safe(v, fallback='—'){ return (v===undefined||v===null||v==='') ? fallback : v; }
  async function loadLive(){
    try { return await OVC.fetchJSON('/api/live/data'); } catch { return null; }
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
  function mountRadar(live){
    const mount = q('[data-radar-page]');
    if (!mount) return;
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
      <section class="ovc-panel ovc-hero"><span class="ovc-badge">Radar OVC</span><h1>Radar OVC</h1><p>Painel rápido com indicadores, atalhos editoriais e destinos internos úteis.</p></section>
      <section class="ovc-live-card-grid">${cards.map(([label,val,href]) => `<a class="ovc-data-card ovc-stat" href="${href}"><div class="ovc-kicker">Indicador</div><strong>${label}</strong><p>${val}</p></a>`).join('')}</section>
      <section class="ovc-grid" style="margin-top:18px">
        <div class="ovc-story-stack">
          <section class="ovc-panel ovc-story-list"><h3>Monitor central</h3><div class="ovc-mini-list">
            <article class="ovc-mini-item"><div><h4><a href="/dados/cotacoes/">Cotações em foco</a></h4><p>Moedas, índices, inflação e juros organizados no ambiente de dados.</p></div></article>
            <article class="ovc-mini-item"><div><h4><a href="/dados/agenda-economica/">Agenda econômica</a></h4><p>Próximos gatilhos para mercado, política monetária e atividade.</p></div></article>
            <article class="ovc-mini-item"><div><h4><a href="/tv-ovc/">TV OVC</a></h4><p>Acompanhe as transmissões públicas e institucionais mais relevantes.</p></div></article>
          </div></section>
        </div>
        <aside class="ovc-right-rail">
          <section class="ovc-panel ovc-rail-card"><h3>Atalhos úteis</h3><div class="ovc-mini-list">
            <article class="ovc-mini-item"><div><h4><a href="/ferramentas/impostometro/">Impostômetro</a></h4><p>Leitura fiscal em ambiente próprio.</p></div></article>
            <article class="ovc-mini-item"><div><h4><a href="/radio-ovc/">Rádio OVC</a></h4><p>Boletins e faixas em áudio.</p></div></article>
          </div></section>
        </aside>
      </section>`;
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
    if (!live) return;
    mountTV(live); mountRadio(live); mountRadar(live); mountQuotes(live); mountImpostometro(live);
  }
  document.addEventListener('DOMContentLoaded', init);
})();
