// /api/live-data — cotações reais, sem rate limit, 100% gratuito
//
// USD/EUR/GBP: Banco Central do Brasil PTAX (oficial, sem chave, sem limite)
//   — busca janela de 10 dias úteis, sempre retorna o fechamento mais recente
//   — funciona fins de semana, feriados e fora do horário PTAX
// ARS/BTC: Yahoo Finance + CoinGecko (sem chave, sem limite prático)
// IBOV/NASDAQ/DOW/IFIX: Yahoo Finance com variação real calculada
// Impostômetro: ACSP oficial (impostometro.com.br)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=55");

  // Janela de 10 dias corridos para garantir retorno mesmo em feriados
  const hoje = new Date();
  const d2 = fmtBcb(hoje);
  const d1 = fmtBcb(new Date(hoje - 10 * 86400000));

  function fmtBcb(dt) {
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${m}-${d}-${dt.getFullYear()}`;
  }

  // BCB PTAX — dólar com janela (sempre retorna algo)
  async function bcbUSD() {
    try {
      const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@d1,dataFinalCotacao=@d2)?@d1='${d1}'&@d2='${d2}'&$format=json&$select=cotacaoCompra,cotacaoVenda,dataHoraCotacao&$orderby=dataHoraCotacao%20desc&$top=2`;
      const r = await fetch(url, { signal: AbortSignal.timeout(7000) });
      const d = await r.json();
      const vals = d?.value;
      if (!vals || vals.length === 0) return { valor: 0, variacao: 0 };
      const atual  = parseFloat(vals[0].cotacaoVenda);
      const anterior = vals[1] ? parseFloat(vals[1].cotacaoVenda) : atual;
      return { valor: atual, variacao: anterior ? parseFloat(((atual - anterior) / anterior * 100).toFixed(2)) : 0 };
    } catch { return { valor: 0, variacao: 0 }; }
  }

  // BCB PTAX — outras moedas com janela
  async function bcbMoeda(sigla) {
    try {
      const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaPeriodo(moeda=@m,dataInicial=@d1,dataFinalCotacao=@d2)?@m='${sigla}'&@d1='${d1}'&@d2='${d2}'&$format=json&$select=cotacaoCompra,cotacaoVenda,dataHoraCotacao&$orderby=dataHoraCotacao%20desc&$top=2`;
      const r = await fetch(url, { signal: AbortSignal.timeout(7000) });
      const d = await r.json();
      const vals = d?.value;
      if (!vals || vals.length === 0) return { valor: 0, variacao: 0 };
      const atual    = parseFloat(vals[0].cotacaoVenda);
      const anterior = vals[1] ? parseFloat(vals[1].cotacaoVenda) : atual;
      return { valor: atual, variacao: anterior ? parseFloat(((atual - anterior) / anterior * 100).toFixed(2)) : 0 };
    } catch { return { valor: 0, variacao: 0 }; }
  }

  // Yahoo Finance — cotação + variação real
  async function yahoo(symbol) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(7000) });
      const d = await r.json();
      const result = d?.chart?.result?.[0];
      const meta   = result?.meta;
      if (!meta?.regularMarketPrice) return { valor: 0, variacao: 0 };
      const price  = parseFloat(meta.regularMarketPrice);
      const closes = (result?.indicators?.quote?.[0]?.close || []).filter(Boolean);
      const prev   = closes.length >= 2 ? closes[closes.length - 2] : price;
      const variacao = prev ? parseFloat(((price - prev) / prev * 100).toFixed(2)) : 0;
      return { valor: price, variacao };
    } catch { return { valor: 0, variacao: 0 }; }
  }

  // Bitcoin — CoinGecko público (sem chave)
  async function bitcoin() {
    try {
      const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl&include_24hr_change=true", { signal: AbortSignal.timeout(7000) });
      const d = await r.json();
      return {
        valor: parseFloat(d?.bitcoin?.brl || 0),
        variacao: parseFloat((d?.bitcoin?.brl_24h_change || 0).toFixed(2))
      };
    } catch { return { valor: 0, variacao: 0 }; }
  }

  // Impostômetro — ACSP oficial
  async function impostometro() {
    try {
      const r = await fetch("https://impostometro.com.br/Contador/Brasil", {
        headers: { "X-Requested-With": "XMLHttpRequest", "Referer": "https://impostometro.com.br/widget/contador" },
        signal: AbortSignal.timeout(7000)
      });
      const d = await r.json();
      const base = parseFloat(d.Valor || 0);
      const inc  = parseFloat(d.Incremento || 0);
      const segs = Math.max(0, (new Date() - new Date(d.Data)) / 1000);
      return Math.round(base + inc * segs);
    } catch { return 0; }
  }

  // Tudo em paralelo
  const [usd, eur, gbp, ars, btc, ibov, nasdaq, dow, ifix, impost] = await Promise.all([
    bcbUSD(),
    bcbMoeda("EUR"),
    bcbMoeda("GBP"),
    yahoo("ARSBRL=X"),   // ARS não existe no BCB — Yahoo Finance
    bitcoin(),
    yahoo("^BVSP"),
    yahoo("^IXIC"),
    yahoo("^DJI"),
    yahoo("^IFIX.SA"),
    impostometro()
  ]);

  return res.status(200).json({
    usd, eur, gbp, ars, btc,
    ibov, nasdaq, dow, ifix,
    impostometro: impost,
    // Compatibilidade legado (home.js usa data.tax.usd e data.indices.ibov)
    tax: { usd: usd.valor, eur: eur.valor, btc: btc.valor },
    indices: { ibov: ibov.valor, nasdaq: nasdaq.valor },
    updated_at: new Date().toISOString()
  });
}
