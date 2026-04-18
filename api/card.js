export default async function handler(req, res) {
  try {
    const { tag, resumo, img, tema } = req.query;

    const safeTag = (tag || "").substring(0, 60);
    const safeResumo = (resumo || "").substring(0, 180);

    let color = "#FFD60A";
    if (tema === "politica") color = "#FF3B30";
    if (tema === "economia") color = "#FF9500";

    const imageUrl = img
      ? `/api/imgproxy?url=${encodeURIComponent(img)}`
      : "/assets/template-ovc.jpg";

    res.setHeader("Content-Type", "text/html");

    res.end(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"/><style>
body { width: 1080px; height: 1350px; position: relative; font-family: Arial, sans-serif; background: #000; overflow: hidden; }
.bg { position: absolute; width: 100%; height: 100%; object-fit: cover; }
.overlay { position: absolute; width: 100%; height: 100%; background: linear-gradient( to top, rgba(0,0,0,0.90), rgba(0,0,0,0.40), rgba(0,0,0,0.10) ); }
.header { position: absolute; top: 60px; width: 100%; text-align: center; color: white; }
.header img { width: 90px; }
.header span { display: block; margin-top: 12px; font-size: 30px; letter-spacing: 1px; }
.tag { position: absolute; top: 46%; left: 50%; transform: translate(-50%, -50%); background: ${color}; color: white; padding: 18px 42px; font-size: 52px; font-weight: bold; text-align: center; white-space: nowrap; }
.headline { position: absolute; top: 60%; left: 10%; width: 80%; text-align: center; color: white; font-size: 44px; font-weight: bold; line-height: 1.25; }
.footer { position: absolute; bottom: 90px; width: 100%; text-align: center; color: white; font-size: 20px; }
.footer img { width: 55px; margin-bottom: 12px; }
.footer div { margin-top: 4px; }
</style></head><body>
<img class="bg" src="${imageUrl}"/>
<div class="overlay"></div>
<div class="header">
  <img src="https://bfsegqdgscudtdgwdyci.supabase.co/storage/v1/object/public/cards/vc-logo.png"/>
  <span>O VALOR CAPITAL</span>
</div>
<div class="tag">${safeTag}</div>
<div class="headline">${safeResumo}</div>
<div class="footer">
  <img src="https://bfsegqdgscudtdgwdyci.supabase.co/storage/v1/object/public/cards/vc-logo.png"/>
  <div>O VALOR CAPITAL</div>
  <div>Siga @ovalorcapital</div>
  <div>Liberdade econômica, família &amp; patrimônio</div>
  <div>www.ovalorcapital.com.br</div>
</div>
</body></html>`);
  } catch (err) {
    res.status(500).send(err.message);
  }
}
