export default async function handler(req, res) {
  const { tag = "", tema = "sociedade", resumo = "", img = "" } = req.query;

  const COLORS = {
    politica: "#c81e1e", crime: "#c81e1e", justica: "#c81e1e", corrupcao: "#c81e1e",
    economia: "#e85d00", financas: "#e85d00", mercado: "#e85d00",
    sociedade: "#ffc800", cultura: "#ffc800", saude: "#ffc800", educacao: "#ffc800",
  };

  const color = COLORS[tema?.toLowerCase()] || "#ffc800";
  const textColor = color === "#ffc800" ? "#000000" : "#ffffff";

  const esc = (s) => (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  // Quebrar resumo em linhas de ~22 chars
  const words = (resumo||"").toUpperCase().split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > 22 && line) { lines.push(line); line = w; }
    else line = (line ? line + " " + w : w);
  }
  if (line) lines.push(line);
  const resumoLines = lines.slice(0, 4);

  const LOGO_URL = "https://raw.githubusercontent.com/oterrasan/ovalorcapital/main/public/assets/vc-logo.png";

  // Tag width baseado no texto
  const tagW = Math.min(960, Math.max(300, tag.length * 40 + 80));
  const tagX = (1080 - tagW) / 2;

  const svg = `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="overlay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,0,0,0.55)"/>
      <stop offset="40%" stop-color="rgba(0,0,0,0.3)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.88)"/>
    </linearGradient>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0d1b2a"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>
    <clipPath id="imgClip"><rect width="1080" height="1350"/></clipPath>
  </defs>

  <!-- Fundo -->
  <rect width="1080" height="1350" fill="url(#bgGrad)"/>

  <!-- Imagem de fundo -->
  ${img ? `<image href="${esc(img)}" x="0" y="0" width="1080" height="1350" preserveAspectRatio="xMidYMid slice" clip-path="url(#imgClip)"/>` : ""}

  <!-- Overlay -->
  <rect width="1080" height="1350" fill="url(#overlay)"/>

  <!-- Logo topo -->
  <image href="${LOGO_URL}" x="460" y="55" width="160" height="100" preserveAspectRatio="xMidYMid meet"/>

  <!-- Tag colorida -->
  <rect x="${tagX}" y="500" width="${tagW}" height="88" rx="6" fill="${color}"/>
  <text x="540" y="558" font-size="52" font-weight="bold" fill="${textColor}" font-family="Arial, sans-serif" text-anchor="middle">${esc(tag.toUpperCase())}</text>

  <!-- Resumo -->
  ${resumoLines.map((l, i) => `<text x="50" y="${650 + i * 82}" font-size="68" font-weight="bold" fill="#ffffff" font-family="Arial, sans-serif" text-anchor="start">${esc(l)}</text>`).join("
  ")}

  <!-- Linha separadora rodapé -->
  <line x1="50" y1="1140" x2="1030" y2="1140" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>

  <!-- Logo rodapé -->
  <image href="${LOGO_URL}" x="500" y="1155" width="80" height="50" preserveAspectRatio="xMidYMid meet"/>

  <!-- Textos rodapé -->
  <text x="540" y="1230" font-size="26" font-weight="bold" fill="#ffffff" font-family="Arial, sans-serif" text-anchor="middle">O VALOR CAPITAL</text>
  <text x="540" y="1262" font-size="22" fill="rgba(255,255,255,0.75)" font-family="Arial, sans-serif" text-anchor="middle">Siga @ovalorcapital</text>
  <text x="540" y="1290" font-size="20" fill="rgba(255,255,255,0.6)" font-family="Arial, sans-serif" text-anchor="middle">Liberdade econômica, família &amp; patrimônio</text>
  <text x="540" y="1315" font-size="18" fill="rgba(255,255,255,0.5)" font-family="Arial, sans-serif" text-anchor="middle">www.ovalorcapital.com.br</text>
</svg>`;

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.status(200).send(svg);
}
