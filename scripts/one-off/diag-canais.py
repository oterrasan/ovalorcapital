import json
import datetime
import urllib.request

SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40"
HEADERS = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}


def rest(path):
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{path}", headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


now_utc = datetime.datetime.now(datetime.timezone.utc)
print("agora UTC:", now_utc.isoformat(), "| BRT:", (now_utc - datetime.timedelta(hours=3)).isoformat())

canais = ["portal", "esportes_radar", "brasilon",
          "jovempan_politica", "internacional", "economia_mercado", "fofocas"]

print("\n=== ULTIMO POST REAL DE CADA CANAL AUTOMATICO ===")
for m in canais:
    rows = rest(f"posts?select=created_at,titulo,status&publish_method=eq.{m}&order=created_at.desc&limit=1")
    if rows:
        r = rows[0]
        created = r.get("created_at")
        try:
            dt = datetime.datetime.fromisoformat(created)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=datetime.timezone.utc)
            idade_min = (now_utc - dt).total_seconds() / 60
        except Exception:
            idade_min = None
        print(f"{m}: {created} | idade={idade_min:.0f}min | status={r.get('status')} | {(r.get('titulo') or '')[:50]}" if idade_min else f"{m}: {created} | {r}")
    else:
        print(f"{m}: NENHUM POST ENCONTRADO")

print("\n=== TOTAL DE POSTS POR CANAL NAS ULTIMAS 24H ===")
cutoff = (now_utc - datetime.timedelta(hours=24)).isoformat()
for m in canais:
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/posts?select=id&publish_method=eq.{m}&created_at=gte.{cutoff}",
        headers={**HEADERS, "Prefer": "count=exact", "Range": "0-0"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        cr = r.headers.get("Content-Range")
        print(f"{m}: Content-Range={cr}")

print("\nFIM DO DIAGNOSTICO")
