import { db } from "../core/db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const { id, ids, action } = req.body || {};
  try {
    if (action === "retry" && id) {
      const result = await db.retry(id);
      return res.status(200).json(result);
    }
    if (ids && Array.isArray(ids)) {
      const results = await db.approveBatch(ids);
      return res.status(200).json({ status: "batch", results });
    }
    if (id) {
      const result = await db.approve(id);
      return res.status(200).json(result);
    }
    return res.status(400).json({ error: "missing_id" });
  } catch(e) {
    return res.status(200).json({ ok: false, error: e.message });
  }
}
