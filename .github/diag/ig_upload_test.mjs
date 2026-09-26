// Só cria container + envia bytes + consulta status. NUNCA publica.
import { createReelContainerResumable, checkReelStatus } from "../../core/instagram.js";
import { readFileSync, statSync } from "node:fs";
const arquivo = process.argv[2];
const c = await createReelContainerResumable("teste tecnico, nao publicar", null);
const size = statSync(arquivo).size;
const r = await fetch(c.upload_url, { method: "POST", headers: { Authorization: `OAuth ${c.upload_token}`, offset: "0", file_size: String(size), "Content-Type": "application/octet-stream" }, body: readFileSync(arquivo) });
console.log(`${arquivo} size=${size} upload_http=${r.status} ${(await r.text()).slice(0, 200)}`);
if (r.ok) for (let i = 0; i < 6; i++) { await new Promise((x) => setTimeout(x, 20000)); const s = await checkReelStatus(c.creation_id, c.account_id); console.log(`  status: ${JSON.stringify(s)}`); if (s?.status_code !== "IN_PROGRESS") break; }
