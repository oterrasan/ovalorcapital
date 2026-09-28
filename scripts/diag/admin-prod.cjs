const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
  await ctx.addInitScript(() => localStorage.setItem('ovc_auth', '1'));
  const p = await ctx.newPage();
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('CONSOLE', m.type(), m.text().slice(0, 400)); });
  p.on('pageerror', e => console.log('PAGEERROR', String(e && e.stack || e).slice(0, 800)));
  p.on('requestfailed', r => console.log('REQFAIL', r.url().slice(0, 200), r.failure() && r.failure().errorText));
  p.on('response', r => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url().slice(0, 200)); });
  await p.goto('https://www.ovalorcapital.com.br/admin/?v=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForTimeout(12000);
  console.log('MAIN_TEXT_INICIO:', (await p.evaluate(() => (document.querySelector('.main, main, .content') || document.body).innerText)).slice(0, 600));
  const itens = await p.$$eval('.nav-item', els => els.map(e => e.innerText.trim()));
  console.log('MENU:', JSON.stringify(itens));
  for (let i = 0; i < itens.length; i++) {
    const els = await p.$$('.nav-item');
    await els[i].click().catch(e => console.log('CLICKERR', e.message));
    await p.waitForTimeout(6000);
    const t = await p.evaluate(() => { const m = document.querySelector('.main, main, .content'); return (m || document.body).innerText; });
    console.log('=== ' + itens[i] + ' ===\n' + t.slice(0, 500).replace(/\n+/g, ' | '));
  }
  await p.screenshot({ path: 'admin.png' });
  await b.close();
})();
