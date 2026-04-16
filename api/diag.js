export default async function handler(req, res) {
  const results = {};
  try { await import("../core/db.js"); results.db = "ok"; } catch(e) { results.db = e.message; }
  try { await import("../core/rss.js"); results.rss = "ok"; } catch(e) { results.rss = e.message; }
  try { await import("../core/ai.js"); results.ai = "ok"; } catch(e) { results.ai = e.message; }
  try { await import("sharp"); results.sharp = "ok"; } catch(e) { results.sharp = e.message; }
  try { await import("../core/card.js"); results.card = "ok"; } catch(e) { results.card = e.message; }
  try { await import("../core/storage.js"); results.storage = "ok"; } catch(e) { results.storage = e.message; }
  try { await import("../core/pipeline.js"); results.pipeline = "ok"; } catch(e) { results.pipeline = e.message; }
  return res.status(200).json(results);
}
