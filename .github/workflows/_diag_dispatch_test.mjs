// Teste real end-to-end da ponte Vercel→GitHub (dispatch_reels_workflow).
// Chama a ação de produção (GET, mesmo formato usado pelo cron da Vercel)
// e imprime a resposta crua — sem suposição, evidência real.
const res = await fetch(
  "https://www.ovalorcapital.com.br/api/manage?action=dispatch_reels_workflow&pass=ovc-admin-2026-secreto",
  { method: "GET" }
);
const text = await res.text();
console.log("HTTP_STATUS:", res.status);
console.log("BODY:", text);
