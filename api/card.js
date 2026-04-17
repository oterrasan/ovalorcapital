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
  const TEMPLATE = "https://bfsegqdgscudtdgwdyci.supabase.co/storage/v1/object/public/cards/template-ovc.jpg";
  const proxyImg = img ? `/api/imgproxy?url=${encodeURIComponent(img)}&q=${encodeURIComponent(q)}` : "";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;background:#000;font-family:'Arial Black',Arial,sans-serif}
.wrap{position:relative;width:1080px;height:1350px}

/* FOTO DA NOTICIA - ocupa 100% do card, de canto a canto */
.photo{
  position:absolute;top:0;left:0;
  width:1080px;height:1350px;
  object-fit:cover;object-position:center top;
  z-index:1
}

/* GRADIENTE ESCURO - cobre parte inferior da foto */
.gradient{
  position:absolute;top:0;left:0;
  width:1080px;height:1350px;
  background:linear-gradient(
    to bottom,
    rgba(0,0,0,0.0) 0%,
    rgba(0,0,0,0.0) 25%,
    rgba(0,0,0,0.4) 50%,
    rgba(0,0,0,0.85) 70%,
    rgba(0,0,0,0.97) 100%
  );
  z-index:2
}

/* TEMPLATE - sobreposto com blend mode para preservar logo e rodapé */
.template{
  position:absolute;top:0;left:0;
  width:1080px;height:1350px;
  object-fit:cover;
  z-index:3;
  mix-blend-mode:multiply;
  opacity:0.0
}

/* TAG - centralizada */
.tag{
  position:absolute;top:726px;left:0;right:0;
  display:flex;justify-content:center;z-index:10
}
.tag-inner{background:${color};padding:18px 52px}
.tag-inner span{color:#fff;font-size:54px;font-weight:900;letter-spacing:2px;white-space:nowrap}

/* RESUMO */
.resumo{
  position:absolute;top:840px;left:60px;right:60px;
  color:#fff;font-size:52px;font-weight:800;
  line-height:1.2;text-align:center;
  letter-spacing:1px;text-transform:uppercase;z-index:10
}

/* LOGO TOPO - replicado do template */
.logo-top{
  position:absolute;top:48px;left:0;right:0;
  display:flex;flex-direction:column;align-items:center;gap:10px;z-index:10
}
.logo-img{width:96px;height:auto}
.logo-name{color:#fff;font-size:28px;font-weight:800;letter-spacing:4px;text-shadow:0 2px 8px rgba(0,0,0,0.8)}

/* RODAPÉ - replicado do template */
.footer{
  position:absolute;bottom:48px;left:0;right:0;
  display:flex;flex-direction:column;align-items:center;gap:5px;z-index:10
}
.footer .fi{width:52px;height:auto;margin-bottom:4px}
.footer .fn{color:#fff;font-size:19px;font-weight:800;letter-spacing:2px}
.footer .fs{color:rgba(255,255,255,0.75);font-size:16px}
.footer .ft{color:rgba(255,255,255,0.6);font-size:15px}
.footer .fw{color:rgba(255,255,255,0.5);font-size:14px}

</style>
</head>
<body>
<div class="wrap">

  <!-- FOTO OCUPA TODO O CARD DE CANTO A CANTO -->
  ${proxyImg
    ? `<img class="photo" src="${proxyImg}" crossorigin="anonymous" onerror="this.src='${TEMPLATE}'"/>`
    : `<img class="photo" src="${TEMPLATE}" crossorigin="anonymous"/>`
  }

  <!-- GRADIENTE ESCURO SOBRE A FOTO -->
  <div class="gradient"></div>

  <!-- LOGO TOPO -->
  <div class="logo-top">
    <img class="logo-img" src="https://raw.githubusercontent.com/oterrasan/ovalorcapital/main/public/assets/vc-logo.png" crossorigin="anonymous"/>
    <div class="logo-name">O VALOR CAPITAL</div>
  </div>

  <!-- TAG -->
  <div class="tag"><div class="tag-inner"><span>${tag}</span></div></div>

  <!-- RESUMO -->
  <div class="resumo">${resumo}</div>

  <!-- RODAPÉ -->
  <div class="footer">
    <img class="fi" src="https://raw.githubusercontent.com/oterrasan/ovalorcapital/main/public/assets/vc-logo.png" crossorigin="anonymous"/>
    <div class="fn">O VALOR CAPITAL</div>
    <div class="fs">Siga @ovalorcapital</div>
    <div class="ft">Liberdade econômica, família &amp; patrimônio</div>
    <div class="fw">www.ovalorcapital.com.br</div>
  </div>

</div>
</body></html>`;

  res.setHeader("Content-Type","text/html");
  res.setHeader("Cache-Control","public, max-age=3600");
  res.setHeader("Access-Control-Allow-Origin","*");
  return res.status(200).send(html);
}
