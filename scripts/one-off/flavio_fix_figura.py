import re
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
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
        },
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

    # Localiza o bloco <figure>...</figure> que contém a imagem do hangar
    figure_pattern = re.compile(r"<figure[^>]*>.*?</figure>", re.DOTALL)
    matches = figure_pattern.findall(conteudo)
    print("FIGURES_ENCONTRADAS", len(matches))
    for i, m in enumerate(matches):
        print(f"--- figure {i} (primeiros 300 chars) ---")
        print(m[:300])

    # Extrai a URL da imagem do figure que tem a legenda inventada (hangar)
    alvo = None
    for m in matches:
        if "hangar" in m.lower() or "visita tecnica" in m.lower() or "visita técnica" in m.lower() or "Esplanada" in m:
            alvo = m
            break
    if alvo is None and matches:
        # fallback: segundo figure (o primeiro geralmente é a imagem de capa/lab, se existir)
        alvo = matches[-1]

    if alvo is None:
        print("NENHUM FIGURE ENCONTRADO PARA CORRIGIR — abortando sem alterar nada")
        raise SystemExit(1)

    img_src_match = re.search(r'src="([^"]+)"', alvo)
    if not img_src_match:
        print("NAO ACHEI src NA FIGURE — abortando")
        raise SystemExit(1)
    img_url = img_src_match.group(1)
    print("IMG_URL", img_url)

    alt_match = re.search(r'alt="([^"]*)"', alvo)
    alt_text = alt_match.group(1) if alt_match else "Foto da matéria"

    # Novo bloco: SEM legenda inventada, largura contida (nao mais 100% solto)
    novo_figure = (
        '<figure style="margin:24px auto;max-width:640px;clear:both;">'
        f'<img src="{img_url}" alt="{alt_text}" '
        'style="width:100%;height:auto;max-width:640px;border-radius:12px;display:block;margin:0 auto;">'
        "</figure>"
    )

    novo_conteudo = conteudo.replace(alvo, novo_figure)
    if novo_conteudo == conteudo:
        print("SUBSTITUICAO NAO SURTIU EFEITO — abortando sem publicar")
        raise SystemExit(1)

    print("LEN_DEPOIS", len(novo_conteudo))
    print("--- trecho novo ---")
    print(novo_figure)

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
