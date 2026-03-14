const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'ARS', 'CHF', 'CAD', 'AUD', 'NZD'];

async function fetchPtax(code, date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  const dateStr = `${mm}-${dd}-${yyyy}`;

  const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?@moeda='${code}'&@dataCotacao='${dateStr}'&$format=json`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    const value = data?.value?.[0];
    if (!value) return null;

    return {
      code,
      buy: Number(value.cotacaoCompra),
      sell: Number(value.cotacaoVenda),
      date: value.dataHoraCotacao
    };
  } catch (error) {
    return null;
  }
}

async function getLatestPtax(code) {
  const now = new Date();
  for (let i = 0; i <= 7; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const data = await fetchPtax(code, date);
    if (data && data.sell > 0) return data;
  }
  return null;
}

export default async function handler(req, res) {
  try {
    const rates = {};

    for (const code of CURRENCIES) {
      const data = await getLatestPtax(code);
      if (data) rates[code] = data;
    }

    res.setHeader('Cache-Control', 'public, s-maxage=300');
    res.status(200).json({ ok: true, rates, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('[API] PTAX error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}
