import { readJson } from '../../lib/storage.js';
export default async function handler(req,res){ const items=await readJson('data/articles.json',[]); res.status(200).json({ok:true,items}); }
