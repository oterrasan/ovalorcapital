
import { getAdminTokens } from '../../lib/security.js';

export default async function handler(req, res) {
  const tokens = getAdminTokens();
  return res.status(200).json({
    adminToken: tokens.admin,
    masterToken: tokens.master,
    envAdminToken: process.env.ADMIN_TOKEN || 'NOT_SET',
    envMasterToken: process.env.ADMIN_MASTER_TOKEN || 'NOT_SET'
  });
}
