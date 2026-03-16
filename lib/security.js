export function getAdminTokens() {
  return {
    admin: process.env.ADMIN_TOKEN || 'ovc-admin',
    master: process.env.ADMIN_MASTER_TOKEN || process.env.ADMIN_TOKEN || 'ovc-admin'
  };
}

export function readBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

export function resolveRole(token) {
  const { admin, master } = getAdminTokens();
  if (!token) return { valid: false, role: 'guest' };
  if (token === master) return { valid: true, role: 'master' };
  if (token === admin) return { valid: true, role: 'editor' };
  return { valid: false, role: 'guest' };
}

export function requireAdmin(req) {
  const token = readBearerToken(req);
  return resolveRole(token);
}
