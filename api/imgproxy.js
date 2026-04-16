export default async function handler(req, res) {
  const url = String(req.query.url || "");
  if (!url) return res.status(400).send("Missing url");
  
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; OVCBot/1.0)" },
      redirect: "follow"
    });
    if (!r.ok) return res.status(404).send("Not found");
    
    const buf = await r.arrayBuffer();
    const ct = r.headers.get("content-type") || "image/jpeg";
    
    res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).send(Buffer.from(buf));
  } catch(e) {
    return res.status(500).send(e.message);
  }
}
