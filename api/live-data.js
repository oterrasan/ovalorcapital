// /api/live/data — cotações reais + impostômetro real
// Cotações: HG Brasil API (gratuita, sem key em trial)
// Impostômetro: impostometro.com.br/Contador/Brasil (ACSP oficial)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=55"); // cache 55s — atualiza ~1x/min

  try {
    const [hgRes, impostRes] = await Promise.allSettled([
      fetch("https://api.hgbrasil.com/finance?format=json&key=trial", { signal: AbortSignal.timeout(6000) }),
      fetch("https://impostometro.com.br/Contador/Brasil", {
        headers: { "X-Requested-With": "XMLHttpRequest", "Referer": "https://impostometro.com.br/widget/contador" },
        signal: AbortSignal.timeout(6000)
      })
    ]);

    // --- Cotações HG Brasil ---
    let currencies = {}, stocks = {};
    if (hgRes.status === "fulfilled" && hgRes.value.ok) {
      const hg = await hgRes.value.json();
      currencies = hg?.results?.currencies || {};
      stocks     = hg?.results?.stocks     || {};
    }

    // --- Impostômetro ACSP ---
    let impostometro = 0;
    if (impostRes.status === "fulfilled" && impostRes.value.ok) {
      const imp = await impostRes.value.json();
      // imp.Valor = valor base | imp.Incremento = R$/segundo
      // Calcular valor atual: base + incremento * segundos desde Data
      const base      = parseFloat(imp.Valor || 0);
      const inc       = parseFloat(imp.Incremento || 0);
      const dataBase  = new Date(imp.Data);
      const agora     = new Date();
      const segs      = Math.max(0, (agora - dataBase) / 1000);
      impostometro    = Math.round(base + inc * segs);
    }

    // --- Montar resposta ---
    const get = (obj, key, field = "buy") => parseFloat(obj[key]?.[field] || 0) || null;
    const variation = (obj, key) => parseFloat(obj[key]?.variation || 0) || 0;

    return res.status(200).json({
      // Moedas
      usd:     { valor: get(currencies, "USD"), variacao: variation(currencies, "USD") },
      eur:     { valor: get(currencies, "EUR"), variacao: variation(currencies, "EUR") },
      gbp:     { valor: get(currencies, "GBP"), variacao: variation(currencies, "GBP") },
      ars:     { valor: get(currencies, "ARS"), variacao: variation(currencies, "ARS") },
      btc:     { valor: get(currencies, "BTC"), variacao: variation(currencies, "BTC") },
      // Bolsas
      ibov:    { valor: parseFloat(stocks.IBOVESPA?.points || 0) || null, variacao: variation(stocks, "IBOVESPA") },
      nasdaq:  { valor: parseFloat(stocks.NASDAQ?.points   || 0) || null, variacao: variation(stocks, "NASDAQ") },
      dow:     { valor: parseFloat(stocks.DOWJONES?.points || 0) || null, variacao: variation(stocks, "DOWJONES") },
      ifix:    { valor: parseFloat(stocks.IFIX?.points     || 0) || null, variacao: variation(stocks, "IFIX") },
      // Impostômetro
      impostometro,
      // Compat legado (home.js lê data.tax.usd e data.indices.ibov)
      tax: {
        usd: get(currencies, "USD"),
        eur: get(currencies, "EUR"),
        btc: get(currencies, "BTC"),
      },
      indices: {
        ibov:   parseFloat(stocks.IBOVESPA?.points || 0) || null,
        nasdaq: parseFloat(stocks.NASDAQ?.points   || 0) || null,
      },
      updated_at: new Date().toISOString()
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
