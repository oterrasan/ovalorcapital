export default function handler(req, res) {
  try {
    const tag = (req.query && req.query.tag) || "OVC";
    const tema = (req.query && req.query.tema) || "sociedade";
    const resumo = (req.query && req.query.resumo) || "";
    const img = (req.query && req.query.img) || "";

    const COLORS = {
      politica: "#c81e1e", crime: "#c81e1e", justica: "#c81e1e", corrupcao: "#c81e1e",
      economia: "#e85d00", financas: "#e85d00", mercado: "#e85d00",
    };
    const color = COLORS[String(tema).toLowerCase()] || "#ffc800";
    const textColor = color === "#ffc800" ? "#000000" : "#ffffff";
    const esc = (s) => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

    const words = String(resumo).toUpperCase().split(" ");
    const lines = [];
    let line = "";
    for (const w of words) {
      if ((line + " " + w).trim().length > 22 && line) { lines.push(line); line = w; }
      else line = (line ? line + " " + w : w);
    }
    if (line) lines.push(line);
    const resumoLines = lines.slice(0, 4);

    const LOGO = "https://raw.githubusercontent.com/oterrasan/ovalorcapital/main/public/assets/vc-logo.png";
    const tagW = Math.min(960, Math.max(300, String(tag).length * 40 + 80));
    const tagX = (1080 - tagW) / 2;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<defs>
<linearGradient id="ov" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="rgba(0,0,0,0.55)"/>
<stop offset="40%" stop-color="rgba(0,0,0,0.3)"/>
<stop offset="100%" stop-color="rgba(0,0,0,0.88)"/>
</linearGradient>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="#0d1b2a"/>
<stop offset="100%" stop-color="#000000"/>
</linearGradient>
</defs>
<rect width="1080" height="1350" fill="url(#bg)"/>
${img ? `<image href="${esc(img)}" x="0" y="0" width="1080" height="1350" preserveAspectRatio="xMidYMid slice"/>` : ""}
<rect width="1080" height="1350" fill="url(#ov)"/>
<image href="${LOGO}" x="460" y="55" width="160" height="100" preserveAspectRatio="xMidYMid meet"/>
<rect x="${tagX}" y="500" width="${tagW}" height="88" rx="6" fill="${color}"/>
<text x="540" y="558" font-size="52" font-weight="bold" fill="${textColor}" font-family="Arial, sans-serif" text-anchor="middle">${esc(String(tag).toUpperCase())}</text>
${resumoLines.map((l, i) => `<text x="50" y="${650 + i * 82}" font-size="68" font-weight="bold" fill="#ffffff" font-family="Arial, sans-serif">${esc(l)}</text>`).join("")}
<line x1="50" y1="1140" x2="1030" y2="1140" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
<image href="${LOGO}" x="500" y="1155" width="80" height="50" preserveAspectRatio="xMidYMid meet"/>
<text x="540" y="1230" font-size="26" font-weight="bold" fill="#ffffff" font-family="Arial, sans-serif" text-anchor="middle">O VALOR CAPITAL</text>
<text x="540" y="1262" font-size="22" fill="rgba(255,255,255,0.75)" font-family="Arial, sans-serif" text-anchor="middle">Siga @ovalorcapital</text>
<text x="540" y="1290" font-size="20" fill="rgba(255,255,255,0.6)" font-family="Arial, sans-serif" text-anchor="middle">Liberdade economica, familia &amp; patrimonio</text>
<text x="540" y="1315" font-size="18" fill="rgba(255,255,255,0.5)" font-family="Arial, sans-serif" text-anchor="middle">www.ovalorcapital.com.br</text>
</svg>`;

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).send(svg);
  } catch(e) {
    return res.status(200).json({ error: e.message });
  }
}
