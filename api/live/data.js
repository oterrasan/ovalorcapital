
import { loadResource } from '../../lib/store.js';

async function getPtax() {
  try {
    const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL');
    if (!response.ok) throw new Error('fail');
    const data = await response.json();
    return {
      usd: Number(data.USDBRL?.bid || 5.2),
      eur: Number(data.EURBRL?.bid || 5.7),
      btc: Number(data.BTCBRL?.bid || 380000)
    };
  } catch {
    return { usd: 5.2, eur: 5.7, btc: 380000 };
  }
}

function estimateImpostometro() {
  const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();
  const elapsed = Date.now() - yearStart;
  const perMs = 4_650_000; // valor estimado por minuto dividido em ms, fallback visual
  return Math.floor(1_200_000_000_000 + elapsed * perMs);
}

export default async function handler(req, res) {
  const [rates, liveConfig] = await Promise.all([
    getPtax(),
    loadResource('live-config', {})
  ]);
  const indices = {
    ibov: 128450,
    selic: 10.5,
    cdi: 10.4,
    ipca: 4.2
  };
  return res.status(200).json({
    ok: true,
    rates,
    indices,
    impostometro: estimateImpostometro(),
    tv: liveConfig.tv || [],
    radio: liveConfig.radio || {},
    updatedAt: new Date().toISOString()
  });
}
