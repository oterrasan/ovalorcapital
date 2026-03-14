export function requireAdmin(req, res) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return true;

  const authHeader = req.headers.authorization;
  const providedToken = authHeader?.replace(/^Bearer\s+/i, "");

  if (!providedToken || providedToken !== token) {
    res.status(401).json({ error: "Não autorizado" });
    return false;
  }
  return true;
}
