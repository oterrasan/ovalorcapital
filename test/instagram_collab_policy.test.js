import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCollabPolicy, shouldAutoAcceptCollab } from "../core/instagram_collab_policy.js";

test("Valor Capital e Brasil On podem ser aceitos pelos destinatarios configurados", () => {
  const policy = normalizeCollabPolicy({ recipients: ["conta_teste"] });
  assert.equal(shouldAutoAcceptCollab({ recipient: "@conta_teste", source: "@ovalorcapital", policy }), true);
  assert.equal(shouldAutoAcceptCollab({ recipient: "conta_teste", source: "obrasilon", policy }), true);
});

test("O Terrasan nunca aceita automaticamente e nunca e origem autorizada", () => {
  const policy = normalizeCollabPolicy({ recipients: ["oterrasan", "conta_teste"], sources: ["ovalorcapital", "obrasilon", "oterrasan"] });
  assert.equal(shouldAutoAcceptCollab({ recipient: "oterrasan", source: "ovalorcapital", policy }), false);
  assert.equal(shouldAutoAcceptCollab({ recipient: "conta_teste", source: "oterrasan", policy }), false);
});

test("Lista vazia permanece vazia e origens desconhecidas sao recusadas", () => {
  const empty = normalizeCollabPolicy({ recipients: [] });
  assert.deepEqual(empty.recipients, []);
  const policy = normalizeCollabPolicy({ recipients: ["conta_teste"], sources: ["perfil_desconhecido"] });
  assert.equal(shouldAutoAcceptCollab({ recipient: "conta_teste", source: "perfil_desconhecido", policy }), false);
});
