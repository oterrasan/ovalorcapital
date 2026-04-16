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

  const TEMPLATE = "https://raw.githubusercontent.com/oterrasan/ovalorcapital/main/public/assets/template-ovc.jpg";

  // Proxy da imagem para evitar bloqueio de CORS
  let proxyImg = "";
  if (img) {
    proxyImg = `/api/imgproxy?url=${encodeURIComponent(img)}`;
  }

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;font-family:Arial,sans-serif}
.wrap{position:relative;width:1080px;height:1350px}
.template{position:absolute;inset:0;width:1080px;height:1350px;object-fit:cover}
.photo{position:absolute;left:0;top:230px;width:1080px;height:720px;object-fit:cover;object-position:center top}
.photo-overlay{position:absolute;left:0;top:230px;width:1080px;height:720px;background:linear-gradient(to bottom,rgba(0,0,0,0.05) 0%,rgba(0,0,0,0.5) 70%,rgba(8,8,20,0.95) 100%)}
.tag{position:absolute;top:580px;left:50px;background:${color};padding:12px 32px;border-radius:5px;display:inline-block;z-index:10}
.tag span{color:${textColor};font-size:36px;font-weight:800;letter-spacing:2px}
.resumo{position:absolute;top:650px;left:50px;right:50px;color:#fff;font-size:46px;font-weight:800;line-height:1.2;text-align:left;z-index:10;text-shadow:0 2px 6px rgba(0,0,0,0.9)}
</style>
</head>
<body>
<div class="wrap">
  <img class="template" src="${TEMPLATE}" crossorigin="anonymous"/>
  ${proxyImg ? `<img class="photo" src="${proxyImg}" crossorigin="anonymous" onerror="this.style.display='none'"/>
  <div class="photo-overlay"></div>` : ""}
  <div class="tag"><span>${tag}</span></div>
  <div class="resumo">${resumo}</div>
</div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(200).send(html);
}
