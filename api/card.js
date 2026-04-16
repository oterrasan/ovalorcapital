export default async function handler(req, res) {
  const tag = String(req.query.tag || "").toUpperCase();
  const tema = String(req.query.tema || "sociedade").toLowerCase();
  const resumo = String(req.query.resumo || "").toUpperCase();
  const img = String(req.query.img || "");

  const COLORS = {
    politica:"#c81e1e",crime:"#c81e1e",justica:"#c81e1e",corrupcao:"#c81e1e",
    economia:"#e85d00",financas:"#e85d00",mercado:"#e85d00",
  };
  const color = COLORS[tema] || "#ffc800";
  const textColor = color === "#ffc800" ? "#000000" : "#ffffff";
  const LOGO = "https://raw.githubusercontent.com/oterrasan/ovalorcapital/main/public/assets/vc-logo.png";

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;font-family:Arial,sans-serif;background:#000}
.wrap{position:relative;width:1080px;height:1350px}
.bg{position:absolute;inset:0;background:#0d1b2a}
.photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.overlay{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.5) 0%,rgba(0,0,0,0.2) 35%,rgba(0,0,0,0.8) 100%)}
.logo-top{position:absolute;top:55px;left:50%;transform:translateX(-50%);text-align:center}
.logo-top img{width:150px;display:block;margin:0 auto}
.logo-top span{display:block;color:#fff;font-size:22px;font-weight:700;letter-spacing:3px;margin-top:8px}
.tag{position:absolute;top:510px;left:50%;transform:translateX(-50%);background:${color};padding:18px 44px;border-radius:6px;white-space:nowrap}
.tag span{color:${textColor};font-size:52px;font-weight:800;letter-spacing:2px}
.resumo{position:absolute;top:640px;left:50px;right:50px;color:#fff;font-size:72px;font-weight:800;line-height:1.15;text-align:left}
.footer{position:absolute;bottom:40px;left:0;right:0;text-align:center;border-top:1px solid rgba(255,255,255,0.2);padding-top:20px}
.footer img{width:70px;margin:0 auto 8px;display:block}
.footer .name{color:#fff;font-size:24px;font-weight:700;letter-spacing:2px}
.footer .tag1{color:rgba(255,255,255,0.75);font-size:20px;margin-top:4px}
.footer .tag2{color:rgba(255,255,255,0.6);font-size:18px;margin-top:3px}
.footer .site{color:rgba(255,255,255,0.5);font-size:16px;margin-top:3px}
</style>
</head>
<body>
<div class="wrap">
  <div class="bg"></div>
  ${img ? `<img class="photo" src="${img}" crossorigin="anonymous"/>` : ""}
  <div class="overlay"></div>
  <div class="logo-top">
    <img src="${LOGO}" crossorigin="anonymous"/>
    <span>O VALOR CAPITAL</span>
  </div>
  <div class="tag"><span>${tag}</span></div>
  <div class="resumo">${resumo}</div>
  <div class="footer">
    <img src="${LOGO}" crossorigin="anonymous"/>
    <div class="name">O VALOR CAPITAL</div>
    <div class="tag1">Siga @ovalorcapital</div>
    <div class="tag2">Liberdade econômica, família &amp; patrimônio</div>
    <div class="site">www.ovalorcapital.com.br</div>
  </div>
</div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(200).send(html);
}
