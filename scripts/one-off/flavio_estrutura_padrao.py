import json
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

LABEL = "COLUNA DO FLÁVIO"
HANDLE = "com.flavio.breghiroli.garcia"
DATA_EXTENSO = "27 de novembro de 2026"


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
        "GET",
        url,
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

    if conteudo.strip().startswith(f"<p><strong>{LABEL}</strong>"):
        print("JA TEM O CABECALHO PADRAO -- nao duplica, abortando sem alterar nada")
        return

    cabecalho = f"<p><strong>{LABEL}</strong> · {DATA_EXTENSO}</p><p>@{HANDLE} · @ovalorcapital</p>"
    rodape = (
        "<p><em>A opinião dos colunistas não necessariamente reflete a opinião "
        "deste veículo — responsabilidade integral do colunista.</em></p>"
    )
    novo_conteudo = cabecalho + conteudo.strip() + rodape
    print("LEN_DEPOIS", len(novo_conteudo))
    print("--- cabecalho ---")
    print(cabecalho)
    print("--- rodape ---")
    print(rodape)

    payload = json.dumps(
        {
            "action": "editar_aprovar",
            "token": ADMIN_TOKEN,
            "id": POST_ID,
            "conteudo": novo_conteudo,
        }
    ).encode("utf-8")

    status, body = http(
        "POST",
        f"{SITE_BASE}/api/manage",
        headers={"Content-Type": "application/json"},
        data=payload,
    )
    print("EDITAR_APROVAR_STATUS", status)
    print(body[:2000])
    if status != 200:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
