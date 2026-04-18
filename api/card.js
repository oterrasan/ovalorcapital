export default async function handler(req, res) {
  try {
    const { tag, resumo, img, tema } = req.query;
    const safeTag = (tag || "").substring(0, 40);
    const safeResumo = (resumo || "").substring(0, 120);
    let color = "#FFD60A";
    if (tema === "politica") color = "#FF3B30";
    if (tema === "economia") color = "#FF9500";
    const imageUrl = img
      ? `/api/imgproxy?url=${encodeURIComponent(img)}`
      : "/assets/template-ovc.jpg";
    res.setHeader("Content-Type", "text/html");
    res.end(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body {
  width:1080px;
  height:1350px;
  position:relative;
  background:#000;
  font-family: Arial, sans-serif;
  overflow:hidden;
}
.bg {
  position:absolute;
  width:100%;
  height:100%;
  object-fit:cover;
  z-index:1;
}
.overlay {
  position:absolute;
  width:100%;
  height:100%;
  z-index:2;
  background: linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.3));
}
.tag {
  position:absolute;
  top:500px;
  left:50%;
  transform:translateX(-50%);
  background:${color};
  color:#fff;
  padding:14px 34px;
  font-size:44px;
  font-weight:bold;
  z-index:3;
}
.headline {
  position:absolute;
  top:630px;
  left:50%;
  transform:translateX(-50%);
  width:820px;
  text-align:center;
  color:#fff;
  font-size:40px;
  font-weight:bold;
  line-height:1.2;
  z-index:3;
}
.template {
  position:absolute;
  width:100%;
  height:100%;
  z-index:4;
}
</style>
</head>
<body>
  <img class="bg" src="${imageUrl}" />
  <div class="overlay"></div>
  <div class="tag">${safeTag}</div>
  <div class="headline">${safeResumo}</div>
  <img class="template" src="/assets/template-ovc.jpg" />
</body>
</html>
`);
  } catch (err) {
    res.status(500).json({
      error: "CARD_ERROR",
      message: err.message,
    });
  }
}
