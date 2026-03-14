export default async function handler(req, res) {
  try {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysPassed = Math.floor((now - startOfYear) / msPerDay);
    const daysInYear = 365;

    // Meta 2026: R$ 3.1 trilhões
    const metaAnual = 3100000000000;
    const arrecadado = (metaAnual / daysInYear) * daysPassed + ((now.getHours() * 60 + now.getMinutes()) / 1440) * (metaAnual / daysInYear);

    res.setHeader('Cache-Control', 'public, s-maxage=60');
    res.status(200).json({
      ok: true,
      arrecadado: Math.floor(arrecadado),
      metaAnual: metaAnual,
      percentual: ((arrecadado / metaAnual) * 100).toFixed(2),
      updatedAt: now.toISOString()
    });
  } catch (error) {
    console.error('[API] Impostômetro error:', error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}
