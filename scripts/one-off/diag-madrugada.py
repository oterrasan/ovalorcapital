import json, urllib.request, urllib.parse, datetime, os

SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_KEY") or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40"

def get(path, headers_extra=None):
    h = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    if headers_extra:
        h.update(headers_extra)
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{path}", headers=h)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, json.loads(r.read().decode()), dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:500], {}

now_utc = datetime.datetime.now(datetime.timezone.utc)
now_brt = now_utc - datetime.timedelta(hours=3)
print("AGORA UTC:", now_utc.isoformat(), "| AGORA BRT:", now_brt.isoformat())

# Janela de pausa de hoje: 00h-06h BRT = 03h-09h UTC
hoje_brt = now_brt.date()
pausa_inicio_brt = datetime.datetime.combine(hoje_brt, datetime.time(0,0,0))
pausa_fim_brt = datetime.datetime.combine(hoje_brt, datetime.time(6,0,0))
pausa_inicio_utc = pausa_inicio_brt + datetime.timedelta(hours=3)
pausa_fim_utc = pausa_fim_brt + datetime.timedelta(hours=3)
print(f"JANELA DE PAUSA HOJE (00h-06h BRT) = UTC {pausa_inicio_utc.isoformat()} a {pausa_fim_utc.isoformat()}")

ini_enc = urllib.parse.quote(pausa_inicio_utc.isoformat(), safe="")
fim_enc = urllib.parse.quote(pausa_fim_utc.isoformat(), safe="")

print("\n=== POSTS CRIADOS NA JANELA DE PAUSA (00h-06h BRT) DE HOJE, POR CANAL ===")
status, data, _ = get(f"posts?select=id,titulo,created_at,publish_method,status&created_at=gte.{ini_enc}&created_at=lte.{fim_enc}&order=created_at.asc&limit=200")
print("HTTP", status)
if isinstance(data, list):
    print(f"TOTAL ENCONTRADO: {len(data)}")
    for p in data:
        print(f"  {p['created_at']} | {p.get('publish_method')} | {p.get('status')} | {p.get('titulo','')[:60]}")
else:
    print(data)

print("\n=== metrics.instagram / instagram_reel PUBLICADOS NA JANELA (via updated_at/metrics) ===")
status, data, _ = get(f"posts?select=id,titulo,metrics,updated_at&updated_at=gte.{ini_enc}&updated_at=lte.{fim_enc}&order=updated_at.asc&limit=200")
print("HTTP", status)
if isinstance(data, list):
    ig_hits = []
    for p in data:
        m = p.get("metrics") or {}
        ig = m.get("instagram") or {}
        reel = m.get("instagram_reel") or {}
        pub_at_feed = ig.get("published_at")
        pub_at_reel = reel.get("published_at")
        if pub_at_feed or pub_at_reel:
            ig_hits.append((p['updated_at'], p.get('titulo','')[:50], pub_at_feed, pub_at_reel))
    print(f"Posts com metrics.instagram/instagram_reel tocados nessa janela: {len(ig_hits)}")
    for h in ig_hits:
        print("  updated_at=", h[0], "| titulo=", h[1], "| ig_feed_pub=", h[2], "| ig_reel_pub=", h[3])
else:
    print(data)

print("\n=== CONFIG RELEVANTE AGORA ===")
for k in ["AUTOMATION","SISTEMA_LIGADO","IG_AUTOMATION_ENABLED","REELS_AUTOMATION_ENABLED",
          "BON_IG_ENABLED","BON_REEL_ENABLED"]:
    status, data, _ = get(f"config?select=value&key=eq.{k}")
    v = data[0]['value'] if isinstance(data, list) and data else "(ausente)"
    print(f"  {k} = {v}")
