import json

conteudo = open(
    "scripts/one-off/taisa-fonseca-empreendedorismo-identidade-fix.html", encoding="utf-8"
).read()

payload = {
    "action": "editar_aprovar",
    "token": "ovc-admin-2026-secreto",
    "id": "c8d23fad-c8cd-4f3e-8136-3563040054c6",
    "conteudo": conteudo,
}

with open("/tmp/payload_fix.json", "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False)
