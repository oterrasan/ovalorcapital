import { run_pipeline } from "../core/pipeline";

export default async function handler(req, res) {
  try {
    const result = await run_pipeline();
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
