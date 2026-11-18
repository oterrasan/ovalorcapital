import json, urllib.request, urllib.parse, os

SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_KEY") or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40"


def get(path, params=None):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params, safe=",.*()")
    h = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
    req = urllib.request.Request(url, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:500]


print("=== POSTS RECENTES publish_method=link_manual ===")
code, posts = get("posts", {
    "select": "id,titulo,publish_method,status,created_at,metrics,subcategoria",
    "order": "created_at.desc",
    "limit": "15",
    "publish_method": "eq.link_manual",
})
print("HTTP", code)
if code == 200:
    for p in posts:
        m = p.get("metrics") or {}
        if isinstance(m, str):
            try:
                m = json.loads(m)
            except Exception:
                m = {}
        print(f"- {p['created_at']} | {p['titulo'][:55]!r} | status={p['status']} | video_only={m.get('video_only')} | fonte={str(m.get('fonte_link_manual',''))[:70]}")
else:
    print(posts)

print()
print("=== CONFIG FLAGS AGORA ===")
for k in ["AUTOMATION", "SISTEMA_LIGADO", "REELS_AUTOMATION_ENABLED", "IG_AUTOMATION_ENABLED", "BON_IG_ENABLED", "BON_REEL_ENABLED"]:
    code, rows = get("config", {"select": "value,updated_at", "key": f"eq.{k}"})
    print(f"- {k}: HTTP {code} -> {rows}")

print()
print("=== TIKTOK_ROBO_TT__ marcas recentes (robo discovery, prova de atividade) ===")
code, marcas = get("config", {"select": "key,updated_at", "key": "like.TIKTOK_ROBO_TT__*", "order": "updated_at.desc", "limit": "15"})
print("HTTP", code)
if code == 200:
    for m in marcas:
        print(f"- {m}")

print()
print("=== LINK_JOB__ pendentes/recentes agora ===")
code, jobs = get("config", {"select": "key,value,updated_at", "key": "like.LINK_JOB__*", "limit": "15"})
print("HTTP", code)
if code == 200:
    for j in jobs:
        v = j.get("value")
        try:
            v = json.loads(v)
        except Exception:
            pass
        print(f"- {j['key']} | updated={j['updated_at']} | {v}")
