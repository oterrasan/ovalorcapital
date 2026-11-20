// scripts/instagram-login.mjs — login compartilhado da "conta de captura"
// do Instagram (instagram-private-api). Reusado por capture-link-jobs.mjs
// (1 link avulso, colado por Roberto) e instagram-robo-descobrir.mjs
// (varredura automática de perfis monitorados) — mesma sessão salva em
// config IG_CAPTURA_SESSAO, pra nunca logar duas vezes nem os dois
// brigarem por login simultâneo.
//
// Extraído de capture-link-jobs.mjs em 20/11/2026 (Roberto: "Encontre uma
// forma do nosso sistema conseguir capturar videos do instagram") — antes
// a função vivia só lá, duplicá-la pro robô novo arriscaria os dois
// ficarem fora de sincronia depois de algum ajuste. Extrair é seguro aqui
// porque os dois chamadores são scripts Node simples, rodados sozinhos no
// runner (nenhum risco de bundling/cold-start de function serverless —
// essa cautela documentada em core/storage.js é só pra api/*.js).
//
// `api` é a mesma função POST (config IG_CAPTURA_CONTA/IG_CAPTURA_SESSAO,
// ver handleLinkCapturaConta/handleLinkCapturaSessao em api/run_portal.js)
// que cada chamador já define — injetada aqui em vez de reimportar, pra
// não precisar duplicar TOKEN/API_URL nem criar outro módulo só pra isso.
export async function igCliente(api) {
  const conta = await api({ action: "link_captura_conta" });
  if (!conta.ok || !conta.username || !conta.password) {
    throw new Error("Nenhuma conta de captura do Instagram cadastrada. Admin → Reescrita por Link → Conta de captura do Instagram.");
  }
  const { IgApiClient } = await import("instagram-private-api");
  const ig = new IgApiClient();
  ig.state.generateDevice(conta.username);
  let logado = false;
  if (conta.session) {
    try { await ig.state.deserialize(conta.session); await ig.account.currentUser(); logado = true; }
    catch (_) { console.log("sessão salva expirou — fazendo login de novo"); }
  }
  if (!logado) {
    await ig.account.login(conta.username, conta.password);
    const estado = await ig.state.serialize();
    delete estado.constants;
    await api({ action: "link_captura_sessao", session: estado });
  }
  return ig;
}
