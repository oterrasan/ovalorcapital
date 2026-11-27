import json
import re
import urllib.request
import urllib.error

POST_ID = "f28b38af-0dcf-4451-8ec4-2842f868197c"
SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co"
SUPABASE_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ."
    "BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40"
)
SITE_BASE = "https://www.ovalorcapital.com.br"
ADMIN_TOKEN = "ovc-admin-2026-secreto"


def http(method, url, headers=None, data=None):
    req = urllib.request.Request(url, method=method, data=data)
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8")


def get_current_conteudo():
    url = f"{SUPABASE_URL}/rest/v1/posts?id=eq.{POST_ID}&select=id,titulo,conteudo"
    status, body = http(
        "GET", url,
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
    )
    print("GET_STATUS", status)
    if status != 200:
        print(body[:2000])
        raise SystemExit(1)
    rows = json.loads(body)
    if not rows:
        print("POST NAO ENCONTRADO")
        raise SystemExit(1)
    return rows[0]["conteudo"]


def main():
    conteudo = get_current_conteudo()
    print("LEN_ANTES", len(conteudo))

    # 1) Sobrenome no cabecalho
    if "COLUNA DO FLÁVIO BREGHIROLI" not in conteudo:
        conteudo = conteudo.replace(
            "<p><strong>COLUNA DO FLÁVIO</strong>",
            "<p><strong>COLUNA DO FLÁVIO BREGHIROLI</strong>",
            1,
        )
        print("SOBRENOME: aplicado")
    else:
        print("SOBRENOME: ja estava correto")

    # 2) Imagem do meio: remove o <figure> solto (centralizado, com style
    # inline) e usa exatamente o MESMO markup/classe ja estabelecido pra
    # capa (.ovc-art-img, float:left, sem <figure>, sem legenda) -- nao
    # inventa um padrao novo, reusa o que ja existe e ja funciona.
    figure_pattern = re.compile(r"<figure[^>]*>\s*<img([^>]*)>\s*</figure>", re.DOTALL)
    m = figure_pattern.search(conteudo)
    if m:
        img_attrs = m.group(1)
        src_m = re.search(r'src="([^"]+)"', img_attrs)
        alt_m = re.search(r'alt="([^"]*)"', img_attrs)
        src = src_m.group(1) if src_m else ""
        alt = alt_m.group(1) if alt_m else "Foto da matéria"
        novo_img = f'<img src="{src}" class="ovc-art-img" alt="{alt}">'
        conteudo = conteudo[: m.start()] + novo_img + conteudo[m.end():]
        print("IMAGEM: figure solto substituido por .ovc-art-img (mesmo padrao da capa)")
        print("--- novo markup da imagem ---")
        print(novo_img)
    else:
        print("IMAGEM: nenhum <figure> encontrado -- ja deve estar no padrao certo, nao mexe")

    print("LEN_DEPOIS", len(conteudo))

    payload = json.dumps(
        {
            "action": "editar_aprovar",
            "token": ADMIN_TOKEN,
            "id": POST_ID,
            "conteudo": conteudo,
        }
    ).encode("utf-8")

    status, body = http(
        "POST", f"{SITE_BASE}/api/manage",
        headers={"Content-Type": "application/json"},
        data=payload,
    )
    print("EDITAR_APROVAR_STATUS", status)
    print(body[:2000])
    if status != 200:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
