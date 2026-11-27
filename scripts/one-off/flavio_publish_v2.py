"""
Continuação do flavio_publish.py (v1 já rodou com sucesso: coluna
publicada no portal, id f28b38af-0dcf-4451-8ec4-2842f868197c -- a busca
de imagem, porém, voltou null na única consulta tentada, e por isso
ig_publish nunca foi chamado).

Este script:
1. tenta várias consultas de imagem diferentes até achar uma real
   (action=buscar_imagem) -- nunca inventa imagem nenhuma, só tenta
   frases de busca distintas pro mesmo tema.
2. se achar, atualiza o post já publicado (direto via tabela posts, não
   existe action pra só trocar a imagem de um post já criado -- mesmo
   schema de handleAdminColunistaPost) e então chama ig_publish.
3. confirma com HTTP real que a URL final do artigo está no ar.
"""
import json
import urllib.request
import urllib.parse
import sys

BASE = "https://www.ovalorcapital.com.br"
ADMIN_TOKEN = "ovc-admin-2026-secreto"
POST_ID = "f28b38af-0dcf-4451-8ec4-2842f868197c"
ARTICLE_URL = "https://www.ovalorcapital.com.br/colunistas/o-tubo-de-ensaio-o-governo-descobre-que-a-ciencia-exist-f28b38af/"

QUERIES = [
    "cientista laboratorio microscopio",
    "laboratorio pesquisa cientifica",
    "pesquisador ciencia tecnologia",
    "ciencia inovacao tecnologia Brasil",
    "universidade pesquisa cientifica",
    "biotecnologia laboratorio pesquisa",
]


def http_get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "ovc-oneoff/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.getcode(), r.read().decode("utf-8", "replace")


def http_post_json(url, payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=data, method="POST",
        headers={"Content-Type": "application/json", "User-Agent": "ovc-oneoff/1.0"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.getcode(), r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")


def main():
    print("== 0) confirmando a URL real do artigo ja publicado ==")
    code, body = http_get(ARTICLE_URL)
    print("HTTP", code, "len(body)=", len(body))
    print("tem 'Flavio' no corpo?", "Flávio" in body or "Flavio" in body)
    print("tem o titulo no corpo?", "Tubo de Ensaio" in body)

    print()
    print("== 1) tentando varias buscas de imagem ==")
    img_url = None
    for q in QUERIES:
        qenc = urllib.parse.quote(q)
        code, body = http_get(f"{BASE}/api/run_portal?action=buscar_imagem&q={qenc}&categoria=tecnologia")
        try:
            url = json.loads(body).get("url")
        except Exception:
            url = None
        print(f"  q={q!r} -> HTTP {code} url={url}")
        if url:
            img_url = url
            break

    if not img_url:
        print()
        print("NENHUMA busca retornou imagem real -- mantendo a coluna so no portal, sem Instagram.")
        return

    print()
    print("IMAGEM ENCONTRADA:", img_url)
    print()
    print("== 2) gravando a imagem no post ja publicado (action=editar_aprovar) ==")
    code, body = http_post_json(f"{BASE}/api/manage", {
        "action": "editar_aprovar",
        "token": ADMIN_TOKEN,
        "id": POST_ID,
        "imagem": img_url,
    })
    print("HTTP", code, body)

    print()
    print("== 3) publicando no Instagram (ig_publish) ==")
    code, body = http_post_json(f"{BASE}/api/manage", {"action": "ig_publish", "post_id": POST_ID})
    print("HTTP", code, body)


if __name__ == "__main__":
    main()
