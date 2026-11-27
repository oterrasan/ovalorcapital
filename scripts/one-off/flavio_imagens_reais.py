"""
Roberto deletou o post anterior do Instagram e mandou 2 fotos reais
(visita oficial a laboratorio -- mesmo tema da coluna do Flavio) pra
usar de verdade:
  - imagem 1 (flavio-capa-lab-equipe.webp): capa do post + Instagram
  - imagem 2 (flavio-hangar-brasilia.webp): inserida no meio do texto,
    como <figure> full-width (nunca float -- pedido explicito de nao
    desformatar o texto)

1. sobe as 2 imagens reais (ja redimensionadas/comprimidas localmente,
   WebP q82, max 1600px) pro Storage via REST, mesmo bucket/padrao ja
   usado pelo resto do pipeline (post-images/imagens/...).
2. reinsere a figure da imagem 2 no HTML, logo apos a secao 1 (tema
   batendo: Esplanada/Brasilia).
3. grava via editar_aprovar (imagem=capa, conteudo atualizado).
4. publica de novo no Instagram (ig_publish reusa post.imagem = capa,
   que e exatamente a 1a imagem, como pedido).
"""
import json
import os
import urllib.request
import urllib.parse

BASE = "https://www.ovalorcapital.com.br"
ADMIN_TOKEN = "ovc-admin-2026-secreto"
POST_ID = "f28b38af-0dcf-4451-8ec4-2842f868197c"
ARTICLE_URL = "https://www.ovalorcapital.com.br/colunistas/o-tubo-de-ensaio-o-governo-descobre-que-a-ciencia-exist-f28b38af/"

SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co"
SUPABASE_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ."
    "BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40"
)
BUCKET = "post-images"

HERE = os.path.dirname(os.path.abspath(__file__))
IMG1_LOCAL = os.path.join(HERE, "images", "flavio-capa-lab-equipe.webp")
IMG2_LOCAL = os.path.join(HERE, "images", "flavio-hangar-brasilia.webp")


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


def upload_to_storage(local_path, storage_path):
    with open(local_path, "rb") as f:
        data = f.read()
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{storage_path}"
    req = urllib.request.Request(
        url, data=data, method="POST",
        headers={
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "apikey": SUPABASE_KEY,
            "Content-Type": "image/webp",
            "x-upsert": "true",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            code, body = r.getcode(), r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        code, body = e.code, e.read().decode("utf-8", "replace")
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{storage_path}"
    return code, body, public_url


def get_current_conteudo():
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/posts?id=eq.{POST_ID}&select=conteudo",
        headers={"Authorization": f"Bearer {SUPABASE_KEY}", "apikey": SUPABASE_KEY},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        rows = json.loads(r.read().decode("utf-8"))
    return rows[0]["conteudo"] if rows else None


FIGURE_HTML = (
    '<figure style="margin:24px 0;">'
    '<img src="{url}" alt="Autoridades e equipe tecnica durante visita a laboratorio de pesquisa em Brasilia" style="width:100%;height:auto;border-radius:8px;display:block;">'
    '<figcaption style="font-size:13px;color:#666;margin-top:8px;text-align:center;">'
    "Autoridades durante visita tecnica a um laboratorio de pesquisa em Brasilia — mesma Esplanada que a coluna comenta."
    "</figcaption>"
    "</figure>"
)

ANCHOR = "<h3>2. O Prêmio Mulheres Inovadoras: Onde a Inteligência Artificial Encontra a Competência Real</h3>"


def main():
    print("== 1) subindo as 2 imagens reais pro Storage ==")
    code1, body1, img1_url = upload_to_storage(IMG1_LOCAL, "imagens/flavio-capa-lab-equipe.webp")
    print("IMG1:", code1, body1[:200])
    print("IMG1_URL:", img1_url)
    code2, body2, img2_url = upload_to_storage(IMG2_LOCAL, "imagens/flavio-hangar-brasilia.webp")
    print("IMG2:", code2, body2[:200])
    print("IMG2_URL:", img2_url)

    if code1 not in (200, 201) or code2 not in (200, 201):
        print("FALHA no upload -- abortando antes de tocar no post.")
        return

    print()
    print("== 2) montando o conteudo com a figure inserida ==")
    conteudo = get_current_conteudo()
    if not conteudo:
        print("Nao consegui ler o conteudo atual do post -- abortando.")
        return
    figure = FIGURE_HTML.format(url=img2_url)
    if ANCHOR in conteudo:
        novo_conteudo = conteudo.replace(ANCHOR, figure + "\n" + ANCHOR, 1)
        print("figure inserida antes da secao 2 (ancora encontrada).")
    else:
        novo_conteudo = conteudo + "\n" + figure
        print("ancora nao encontrada -- figure anexada ao final (fallback).")

    print()
    print("== 3) gravando capa + conteudo atualizado (editar_aprovar) ==")
    code, body = http_post_json(f"{BASE}/api/manage", {
        "action": "editar_aprovar",
        "token": ADMIN_TOKEN,
        "id": POST_ID,
        "imagem": img1_url,
        "conteudo": novo_conteudo,
    })
    print("HTTP", code, body)

    print()
    print("== 4) publicando de novo no Instagram (ig_publish, usa a capa = imagem 1) ==")
    code, body = http_post_json(f"{BASE}/api/manage", {"action": "ig_publish", "post_id": POST_ID})
    print("HTTP", code, body)

    print()
    print("== 5) confirmando a pagina real ==")
    code, body = http_get(ARTICLE_URL)
    print("HTTP", code, "len=", len(body))
    print("tem a 1a imagem no corpo?", img1_url in body)
    print("tem a 2a imagem no corpo?", img2_url in body)


if __name__ == "__main__":
    main()
