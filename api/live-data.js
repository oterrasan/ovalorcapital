// /api/live-data — cotações reais sem rate limit
// USD/EUR/GBP/ARS: Banco Central do Brasil (PTAX oficial, sem limite)
// BTC: CoinGecko API pública (sem chave, sem limite prático)
// IBOV/NASDAQ/DOW/IFIX: Yahoo Finance (sem limite prático)
// Impostômetro: ACSP oficial (impostometro.com.br)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=55");

  const hoje = new Date();
  const dataHoje = hoje.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }).replace(/\//g, "-");
  const dataOntem = new Date(hoje - 86400000).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }).replace(/\//g, "-");

  async function bcbMoeda(sigla, data) {
    try {
      const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@m,dataCotacao=@d)?@m='${sigla}'&@d='${data}'&$format=json&$select=cotacaoCompra,cotacaoVenda&$top=1`;
      const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
      const d = await r.json();
      const vals = d?.value;
      if (vals && vals.length > 0) {
        const last = vals[vals.length - 1];
        return parseFloat(last.cotacaoVenda);
      }
      return null;
    } catch { return null; }
  }

  async function bcbDolar(data) {
    try {
      const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@d)?@d='${data}'&$format=json&$select=cotacaoCompra,cotacaoVenda&$top=1`;
      const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
      const d = await r.json();
      const vals = d?.value;
      if (vals && vals.length > 0) {
        const last = vals[vals.length - 1];
        return parseFloat(last.cotacaoVenda);
      }
      return null;
    } catch { return null; }
  }

  async function yahooQuote(symbol) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
      const r = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(6000)
      });
      const d = await r.json();
      const meta = d?.chart?.result?.[0]?.meta;
      if (meta?.regularMarketPrice) {
        const price = parseFloat(meta.regularMarketPrice);
        const prev = parseFloat(meta.chartPreviousClose || meta.previousClose || price);
        const variacao = prev ? parseFloat(((price - prev) / prev * 100).toFixed(2)) : 0;
        return { valor: price, variacao };
      }
      return null;
    } catch { return null; }
  }

  async function bitcoin() {
    try {
      const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl&include_24hr_change=true", { signal: AbortSignal.timeout(6000) });
      const d = await r.json();
      return {
        valor: parseFloat(d?.bitcoin?.brl || 0),
        variacao: parseFloat((d?.bitcoin?.brl_24h_change || 0).toFixed(2))
      };
    } catch { return null; }
  }

  async function impostometro() {
    try {
      const r = await fetch("https://impostometro.com.br/Contador/Brasil", {
        headers: { "X-Requested-With": "XMLHttpRequest", "Referer": "https://impostometro.com.br/widget/contador" },
        signal: AbortSignal.timeout(6000)
      });
      const d = await r.json();
      const base = parseFloat(d.Valor || 0);
      const inc  = parseFloat(d.Incremento || 0);
      const segs = Math.max(0, (new Date() - new Date(d.Data)) / 1000);
      return Math.round(base + inc * segs);
    } catch { return 0; }
  }

  // Buscar tudo em paralelo — BCB tenta hoje, fallback ontem
  const [
    usdHoje, eurHoje, gbpHoje, arsHoje,
    usdOntem, eurOntem, gbpOntem, arsOntem,
    btcData, ibovData, nasdaqData, dowData, ifixData, impostData
  ] = await Promise.all([
    bcbDolar(dataHoje),
    bcbMoeda("EUR", dataHoje),
    bcbMoeda("GBP", dataHoje),
    bcbMoeda("ARS", dataHoje),
    bcbDolar(dataOntem),
    bcbMoeda("EUR", dataOntem),
    bcbMoeda("GBP", dataOntem),
    bcbMoeda("ARS", dataOntem),
    bitcoin(),
    yahooQuote("^BVSP"),
    yahooQuote("^IXIC"),
    yahooQuote("^DJI"),
    yahooQuote("^IFIX.SA"),
    impostometro()
  ]);

  // Usar hoje, fallback para ontem se PTAX ainda não fechou
  const usd = usdHoje || usdOntem || 0;
  const eur = eurHoje || eurOntem || 0;
  const gbp = gbpHoje || gbpOntem || 0;
  const ars = arsHoje || arsOntem || 0;

  return res.status(200).json({
    usd:     { valor: usd, variacao: 0 },
    eur:     { valor: eur, variacao: 0 },
    gbp:     { valor: gbp, variacao: 0 },
    ars:     { valor: ars, variacao: 0 },
    btc:     btcData  || { valor: 0, variacao: 0 },
    ibov:    ibovData || { valor: 0, variacao: 0 },
    nasdaq:  nasdaqData || { valor: 0, variacao: 0 },
    dow:     dowData  || { valor: 0, variacao: 0 },
    ifix:    ifixData || { valor: 0, variacao: 0 },
    impostometro: impostData,
    // Compat legado
    tax: { usd, eur, btc: btcData?.valor || 0 },
    indices: { ibov: ibovData?.valor || 0, nasdaq: nasdaqData?.valor || 0 },
    updated_at: new Date().toISOString()
  });
}
