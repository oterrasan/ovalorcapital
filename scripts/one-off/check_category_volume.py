#!/usr/bin/env python3
"""One-off diagnostic: média diária de publicações por categoria (últimos 7 dias).
Rodado via .github/workflows/diag-once.yml (armado/desarmado manualmente).
Lê SUPA_URL/SUPA_KEY do ambiente. user_tags é TEXT (JSON array), então o
filtro correto é LIKE, nunca .contains() (ver CLAUDE.md regra #14)."""
import json
import os
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

SUPA_URL = os.environ["SUPA_URL"]
SUPA_KEY = os.environ["SUPA_KEY"]

CATEGORIAS = ["politica", "economia", "financas", "brasil-on"]
DIAS = 7


def count(path):
    req = urllib.request.Request(
        f"{SUPA_URL}{path}",
        headers={
            "apikey": SUPA_KEY,
            "Authorization": f"Bearer {SUPA_KEY}",
            "Prefer": "count=exact",
            "Range": "0-0",
        },
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        content_range = resp.headers.get("Content-Range", "")
        # formato: "0-0/123"
        if "/" in content_range:
            total = content_range.split("/")[-1]
            return int(total) if total.isdigit() else 0
        return 0


def main():
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=DIAS)
    cutoff_iso = cutoff.strftime("%Y-%m-%dT%H:%M:%S")

    print(f"=== Volume por categoria — últimos {DIAS} dias ({cutoff_iso} até agora) ===\n")

    total_geral = 0
    for cat in CATEGORIAS:
        tag_encoded = urllib.parse.quote(f'*"{cat}"*')
        path = (
            f"/rest/v1/posts?select=id&status=eq.publicado"
            f"&published_at=gte.{cutoff_iso}"
            f"&user_tags=like.{tag_encoded}"
        )
        try:
            n = count(path)
        except Exception as e:
            print(f"{cat}: ERRO — {e}")
            continue
        media_dia = n / DIAS
        total_geral += n
        print(f"{cat:12s}  total={n:4d}  média/dia={media_dia:.1f}")

    print(f"\nTotal combinado (soma das 4): {total_geral} em {DIAS} dias — média/dia={total_geral/DIAS:.1f}")

    # Total geral do portal (todas categorias, mesmo período) pra dar contexto
    path_total = f"/rest/v1/posts?select=id&status=eq.publicado&published_at=gte.{cutoff_iso}"
    try:
        n_total = count(path_total)
        print(f"Total do portal (todas categorias) no período: {n_total} — média/dia={n_total/DIAS:.1f}")
    except Exception as e:
        print("Total do portal: ERRO —", e)


if __name__ == "__main__":
    main()
