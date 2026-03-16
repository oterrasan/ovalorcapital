export function getAdminPassword(){ return process.env.ADMIN_TOKEN || 'ovc-admin'; }
export function requireAdmin(req,res){ const expected=getAdminPassword(); const authHeader=req.headers.authorization||''; const provided=authHeader.replace(/^Bearer\s+/i,'').trim(); if(provided!==expected){ res.status(401).json({ok:false,error:'Não autorizado'}); return false;} return true; }
