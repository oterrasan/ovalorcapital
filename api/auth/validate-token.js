
import { readBearerToken, resolveRole } from '../../lib/security.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  const body = req.body || {};
  const token = body.token || readBearerToken(req);
  const result = resolveRole(token);
  return res.status(200).json({ valid: result.valid, role: result.role });
}
