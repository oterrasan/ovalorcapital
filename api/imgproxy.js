export default async function handler(req, res) {
  const url = String(req.query.url || "");
  const query = String(req.query.q || "");

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=86400");

  // 1. Tentar imagem original
  if (url) {
    try {
      const r = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; OVCBot/1.0)" },
        redirect: "follow",
        signal: AbortSignal.timeout(6000)
      });
      if (r.ok) {
        const buf = await r.arrayBuffer();
        const ct = r.headers.get("content-type") || "image/jpeg";
        if (ct.startsWith("image/")) {
          res.setHeader("Content-Type", ct);
          return res.status(200).send(Buffer.from(buf));
        }
      }
    } catch(_) {}
  }

  // 2. Busca inteligente por query
  if (query) {
    // Tentar Unsplash (gratuito, sem auth para source)
    try {
      const unsplashUrl = `https://source.unsplash.com/1080x1350/?${encodeURIComponent(query)}`;
      const r = await fetch(unsplashUrl, {
        redirect: "follow",
        signal: AbortSignal.timeout(8000)
      });
      if (r.ok) {
        const buf = await r.arrayBuffer();
        res.setHeader("Content-Type", "image/jpeg");
        return res.status(200).send(Buffer.from(buf));
      }
    } catch(_) {}

    // Fallback: Picsum com seed baseado na query
    try {
      const seed = query.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 1000;
      const picsumUrl = `https://picsum.photos/seed/${seed}/1080/1350`;
      const r = await fetch(picsumUrl, {
        redirect: "follow",
        signal: AbortSignal.timeout(6000)
      });
      if (r.ok) {
        const buf = await r.arrayBuffer();
        res.setHeader("Content-Type", "image/jpeg");
        return res.status(200).send(Buffer.from(buf));
      }
    } catch(_) {}
  }

  // 3. Retornar pixel transparente como último recurso
  res.setHeader("Content-Type", "image/gif");
  return res.status(200).send(Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"));
}
