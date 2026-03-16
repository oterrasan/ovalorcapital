import { getAdminPassword } from '../../lib/auth.js';
export default async function handler(req,res){ const token=req.method==='POST'?req.body?.token:req.query?.token; res.status(200).json({ok:true, valid: token===getAdminPassword()}); }
