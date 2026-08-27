#!/usr/bin/env python3
"""One-off: verifica o estado real da conta/token do Instagram salvo em
ig_accounts (Supabase), sem nunca expor o token completo em log."""
import json
import os
import urllib.request

SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co"
SUPABASE_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6"
    "InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6"
    "MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQ"
    "ManVelxS1-pO40"
)


def sb_get(path):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{path}",
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())


def redact(tok):
    if not tok:
        return None
    return {"length": len(tok), "prefix": tok[:6], "suffix": tok[-6:]}


rows = sb_get("ig_accounts?select=id,username,ig_user_id,active,posts_today,created_at,token")
print("=== ig_accounts (Supabase) ===")
print(json.dumps([{**{k: v for k, v in r.items() if k != "token"}, "token": redact(r.get("token"))} for r in rows], indent=2, ensure_ascii=False))

for r in rows:
    tok = r.get("token")
    if not tok:
        continue
    print(f"\n=== debug_token para conta {r.get('username')} (id={r.get('id')}) ===")
    try:
        url = f"https://graph.facebook.com/debug_token?input_token={tok}&access_token={tok}"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode())
        print(json.dumps(data, indent=2, ensure_ascii=False))
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        print(f"HTTP_ERROR {e.code}: {body}")
    except Exception as e:
        print(f"ERRO: {e}")
