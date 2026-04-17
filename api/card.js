export default async function handler(req, res) {
  const tag = String(req.query.tag || "").toUpperCase();
  const tema = String(req.query.tema || "sociedade").toLowerCase();
  const resumo = String(req.query.resumo || "").toUpperCase();
  const img = String(req.query.img || "");
  const q = String(req.query.q || tag);

  const COLORS = {
    politica:"#c81e1e", crime:"#c81e1e", justica:"#c81e1e", corrupcao:"#c81e1e",
    economia:"#e85d00", financas:"#e85d00", mercado:"#e85d00",
  };
  const color = COLORS[tema] || "#e85d00";

  const LOGO = "https://raw.githubusercontent.com/oterrasan/ovalorcapital/main/public/assets/vc-logo.png";
  const proxyImg = img ? `/api/imgproxy?url=${encodeURIComponent(img)}&q=${encodeURIComponent(q)}` : "";

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;background:#000;font-family:'Arial Black',Arial,sans-serif}
.wrap{position:relative;width:1080px;height:1350px;display:flex;flex-direction:column}

/* FOTO - ocupa topo, 58% do card */
.photo-area{position:relative;width:1080px;height:783px;flex-shrink:0;overflow:hidden;background:#0d1b2a}
.photo{width:100%;height:100%;object-fit:cover;object-position:center top;display:block}
/* Overlay gradiente sobre a foto - escurece de cima p/ baixo */
.photo-overlay{
  position:absolute;inset:0;
  background:linear-gradient(
    to bottom,
    rgba(0,0,0,0.25) 0%,
    rgba(0,0,0,0.15) 30%,
    rgba(0,0,0,0.5) 65%,
    rgba(0,0,0,0.92) 100%
  )
}

/* LOGO TOPO - centralizado sobre a foto */
.logo-top{
  position:absolute;top:48px;left:0;right:0;
  display:flex;flex-direction:column;align-items:center;gap:10px;z-index:10
}
.logo-top img{width:100px;height:auto;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.6))}
.logo-top .name{
  color:#fff;font-size:28px;font-weight:800;
  letter-spacing:4px;text-align:center;
  text-shadow:0 2px 8px rgba(0,0,0,0.8)
}

/* ÁREA INFERIOR - fundo preto, 42% do card */
.bottom-area{
  flex:1;background:#000;
  display:flex;flex-direction:column;
  align-items:center;justify-content:flex-start;
  padding:0 60px;position:relative
}

/* TAG - fica na transição, metade em cima metade embaixo */
.tag-wrap{
  position:absolute;top:-36px;left:0;right:0;
  display:flex;justify-content:center;z-index:20
}
.tag{
  background:${color};
  padding:20px 52px;
  display:inline-block
}
.tag span{
  color:#fff;font-size:54px;font-weight:900;
  letter-spacing:2px;white-space:nowrap
}

/* RESUMO */
.resumo{
  margin-top:60px;
  color:#fff;font-size:52px;font-weight:800;
  line-height:1.2;text-align:center;
  letter-spacing:1px;word-spacing:4px;
  text-transform:uppercase
}

/* RODAPÉ */
.footer{
  position:absolute;bottom:48px;left:0;right:0;
  display:flex;flex-direction:column;align-items:center;gap:6px
}
.footer img{width:56px;height:auto;margin-bottom:4px}
.footer .fn{color:#fff;font-size:20px;font-weight:800;letter-spacing:2px}
.footer .fs{color:rgba(255,255,255,0.7);font-size:17px;font-weight:400}
.footer .ft{color:rgba(255,255,255,0.6);font-size:16px;font-weight:400}
.footer .fw{color:rgba(255,255,255,0.5);font-size:15px;font-weight:400}
</style>
</head>
<body>
<div class="wrap">

  <!-- FOTO COM OVERLAY -->
  <div class="photo-area">
    ${proxyImg ? `<img class="photo" src="${proxyImg}" crossorigin="anonymous" onerror="this.style.background='#0d1b2a'"/>` : `<div style="width:100%;height:100%;background:linear-gradient(180deg,#0d2137 0%,#000 100%)"></div>`}
    <div class="photo-overlay"></div>
    <!-- LOGO TOPO -->
    <div class="logo-top">
      <img src="${LOGO}" crossorigin="anonymous"/>
      <div class="name">O VALOR CAPITAL</div>
    </div>
  </div>

  <!-- ÁREA INFERIOR PRETA -->
  <div class="bottom-area">
    <!-- TAG NA TRANSIÇÃO -->
    <div class="tag-wrap">
      <div class="tag"><span>${tag}</span></div>
    </div>
    <!-- RESUMO -->
    <div class="resumo">${resumo}</div>
    <!-- RODAPÉ -->
    <div class="footer">
      <img src="${LOGO}" crossorigin="anonymous"/>
      <div class="fn">O VALOR CAPITAL</div>
      <div class="fs">Siga @ovalorcapital</div>
      <div class="ft">Liberdade econômica, família &amp; patrimônio</div>
      <div class="fw">www.ovalorcapital.com.br</div>
    </div>
  </div>

</div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(200).send(html);
}
