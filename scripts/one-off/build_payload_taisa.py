import json

conteudo = open(
    "scripts/one-off/taisa-fonseca-empreendedorismo-identidade.html", encoding="utf-8"
).read()

payload = {
    "action": "admin_colunista_post",
    "pass": "ovc-admin-2026-secreto",
    "nome_colunista": "Taisa da Fonseca",
    "titulo": "O empreendedorismo começa pela identidade",
    "conteudo": conteudo,
    "imagem": "https://www.ovalorcapital.com.br/img/colunistas/taisa-fonseca-proverbios-para-mulheres.jpg",
    "comentario_fixado": (
        "Taísa da Fonseca entrevista Flávia Abeche sobre identidade, autocuidado e "
        "confiança como pilares do empreendedorismo feminino contemporâneo."
    ),
}

with open("/tmp/payload.json", "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False)
