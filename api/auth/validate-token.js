export default async function handler(req, res) {
  try {
    const { token } = req.query;
    const adminToken = process.env.ADMIN_TOKEN;

    if (!adminToken) {
      return res.status(200).json({ valid: true });
    }

    const valid = token === adminToken;
    res.status(200).json({ valid });
  } catch (error) {
    console.error('[API] Token validation error:', error);
    res.status(500).json({ valid: false });
  }
}
