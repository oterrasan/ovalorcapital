#!/usr/bin/env python3
"""One-off diagnostic: confirma se alguma publicação real já saiu no Instagram.
Rodado via .github/workflows/diag-once.yml (armado/desarmado manualmente, não
faz parte do pipeline). Lê SUPA_URL/SUPA_KEY do ambiente."""
import json
import os
import urllib.request

SUPA_URL = os.environ["SUPA_URL"]
SUPA_KEY = os.environ["SUPA_KEY"]


def fetch(path):
    req = urllib.request.Request(
        f"{SUPA_URL}{path}",
        headers={"apikey": SUPA_KEY, "Authorization": f"Bearer {SUPA_KEY}"},
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    print("=== ultimos 30 posts atualizados ===")
    rows = fetch(
        "/rest/v1/posts?select=id,titulo,status,updated_at,metrics"
        "&order=updated_at.desc&limit=30"
    )
    if isinstance(rows, dict):
        print("ERRO:", rows)
    else:
        found = False
        for r in rows:
            m = r.get("metrics")
            if isinstance(m, str):
                try:
                    m = json.loads(m)
                except Exception:
                    m = {}
            ig = (m or {}).get("instagram")
            if ig:
                found = True
                print("---")
                print("id:", r.get("id"))
                print("titulo:", r.get("titulo"))
                print("status:", r.get("status"))
                print("updated_at:", r.get("updated_at"))
                print("ig:", json.dumps(ig, ensure_ascii=False))
        if not found:
            print("NENHUM post com metrics.instagram encontrado nos ultimos 30 atualizados")
            print("Primeiros 3 pra referencia:")
            for r in rows[:3]:
                print(r.get("id"), "-", r.get("titulo"), "-", r.get("status"), "-", r.get("updated_at"))

    print()
    print("=== contas ig_accounts ===")
    accounts = fetch(
        "/rest/v1/ig_accounts?select=id,username,active,posts_hoje,"
        "ultima_atividade,distribuicao_automatica,limite_diario"
    )
    print(json.dumps(accounts, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
