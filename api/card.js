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

  // Template JPEG fixo — nunca muda, hospedado no Supabase
  const TEMPLATE = "https://bfsegqdgscudtdgwdyci.supabase.co/storage/v1/object/public/cards/template-ovc.jpg";
  const proxyImg = img ? `/api/imgproxy?url=${encodeURIComponent(img)}&q=${encodeURIComponent(q)}` : "";

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;background:#000;font-family:'Arial Black',Arial,sans-serif}
.wrap{position:relative;width:1080px;height:1350px}

/* TEMPLATE JPEG FIXO - ocupa 100% do card, nunca muda */
.template{position:absolute;top:0;left:0;width:1080px;height:1350px;object-fit:cover;z-index:1}

/* FOTO DA NOTÍCIA - sobreposta na área central do template */
.photo{position:absolute;top:220px;left:0;width:1080px;height:560px;object-fit:cover;object-position:center top;z-index:2}
.photo-overlay{position:absolute;top:220px;left:0;width:1080px;height:560px;background:linear-gradient(to bottom,rgba(0,0,0,0.0) 0%,rgba(0,0,0,0.0) 50%,rgba(0,0,0,0.85) 100%);z-index:3}

/* TAG - centralizada na transição foto/preto */
.tag{position:absolute;top:726px;left:50%;transform:translateX(-50%);background:${color};padding:18px 52px;z-index:10;white-space:nowrap}
.tag span{color:#fff;font-size:54px;font-weight:900;letter-spacing:2px}

/* RESUMO - centralizado abaixo da tag */
.resumo{position:absolute;top:840px;left:60px;right:60px;color:#fff;font-size:52px;font-weight:800;line-height:1.2;text-align:center;letter-spacing:1px;text-transform:uppercase;z-index:10}
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
