import { requireAdmin } from '../../lib/auth.js';
import { readJson } from '../../lib/storage.js';
export default async function handler(req,res){ if(!requireAdmin(req,res)) return; const items=await readJson('data/newsletter.json',[]); res.status(200).json({ok:true,items}); }
