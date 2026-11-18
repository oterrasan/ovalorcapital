import json
import datetime
import urllib.request
import urllib.parse

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
cutoff = urllib.parse.quote((now_utc - datetime.timedelta(hours=24)).isoformat(), safe="")
for m in canais:
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/posts?select=id&publish_method=eq.{m}&created_at=gte.{cutoff}",
        headers={**HEADERS, "Prefer": "count=exact", "Range": "0-0"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        cr = r.headers.get("Content-Range")
        print(f"{m}: Content-Range={cr}")

print("\n=== FOFOCAS/GIRO — ULTIMOS 5 POSTS (independente de status) ===")
rows = rest("posts?select=created_at,titulo,status&publish_method=eq.fofocas&order=created_at.desc&limit=5")
for r in rows:
    print(r.get("created_at"), "|", r.get("status"), "|", (r.get("titulo") or "")[:60])
if not rows:
    print("NENHUM POST ENCONTRADO PARA fofocas EM TODA A HISTORIA")

print("\n=== CONFIG DE LIMITE DIARIO (confirma hipotese de cota esgotada) ===")
cfg = rest("config?select=key,value&key=in.(OVC_LIMITE_DIARIO_TOTAL,ESPORTES_LIMITE_DIARIO)")
for c in cfg:
    print(c.get("key"), "=", c.get("value"))
if not any(c.get("key") == "OVC_LIMITE_DIARIO_TOTAL" for c in cfg):
    print("OVC_LIMITE_DIARIO_TOTAL = (nao definido no banco -> usa default do codigo, 80)")

print("\n=== TOTAL DOS 6 CANAIS DE 'PAUTA' (nao-esportes) DESDE A MEIA-NOITE BRT MAIS RECENTE ===")
now_brt = now_utc - datetime.timedelta(hours=3)
meia_noite_brt = now_brt.replace(hour=0, minute=0, second=0, microsecond=0)
meia_noite_utc = meia_noite_brt + datetime.timedelta(hours=3)
print("meia-noite BRT mais recente, em UTC:", meia_noite_utc.isoformat())
cutoff_meia_noite = urllib.parse.quote(meia_noite_utc.isoformat(), safe="")
canais_cota = ["portal", "brasilon", "jovempan_politica", "internacional", "economia_mercado", "fofocas"]
for m in canais_cota:
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/posts?select=id&publish_method=eq.{m}&created_at=gte.{cutoff_meia_noite}",
        headers={**HEADERS, "Prefer": "count=exact", "Range": "0-0"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        cr = r.headers.get("Content-Range")
        print(f"{m} (desde a ultima meia-noite BRT): Content-Range={cr}")

print("\nFIM DO DIAGNOSTICO")
