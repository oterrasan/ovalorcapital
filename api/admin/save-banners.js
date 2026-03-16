import { requireAdmin } from '../../lib/auth.js';
import { writeJson } from '../../lib/storage.js';
export default async function handler(req,res){ if(req.method!=='POST') return res.status(405).json({ok:false,error:'Método não permitido'}); if(!requireAdmin(req,res)) return; const payload=req.body?.items || req.body?.data || req.body || []; await writeJson('data/banners.json', payload, 'Atualiza banners.json'); res.status(200).json({ok:true}); }
