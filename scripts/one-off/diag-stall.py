import json
import datetime
import urllib.request
import urllib.error

SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40"

HEADERS = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}


def rest(path):
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{path}", headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


print("=== POSTS RECENTES (confirma o stall de verdade) ===")
posts = rest("posts?select=id,titulo,created_at,published_at,publish_method,status&order=created_at.desc&limit=10")
for p in posts:
    print(p.get("created_at"), "|", p.get("publish_method"), "|", p.get("status"), "|", (p.get("titulo") or "")[:60])

now_utc = datetime.datetime.now(datetime.timezone.utc)
print("\nagora (UTC):", now_utc.isoformat())
if posts:
    last = posts[0].get("created_at")
    print("ultimo post (created_at):", last)

print("\n=== FLAGS DE AUTOMACAO ===")
flags = rest("config?select=key,value&key=in.(AUTOMATION,IG_AUTOMATION_ENABLED,SISTEMA_LIGADO,REELS_AUTOMATION_ENABLED,BON_IG_ENABLED,BON_REEL_ENABLED)")
for f in flags:
    print(f.get("key"), "=", f.get("value"))

print("\n=== CHAVES GEMINI CADASTRADAS (so nome + tamanho + prefixo, NUNCA o valor completo) ===")
gkeys = rest("config?select=key,value&key=like.GEMINI_API_KEY*")
real_keys = []
for g in gkeys:
    v = g.get("value") or ""
    print(g.get("key"), "len=", len(v), "prefix=", v[:6]+"..." if v else "(vazio)")
    if v:
        real_keys.append((g.get("key"), v))

# conta orcamento gasto hoje (BRT) pro modelo atual
hoje_brt = (now_utc - datetime.timedelta(hours=3)).strftime("%Y%m%d")
print(f"\n=== ORCAMENTO GEMINI GASTO HOJE (dia BRT={hoje_brt}) ===")
try:
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/config?select=key&key=like.GEMINI_BUDGET_{hoje_brt}_*",
        headers={**HEADERS, "Prefer": "count=exact", "Range": "0-0"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        cr = r.headers.get("Content-Range")
        print("Content-Range:", cr)
except Exception as e:
    print("erro ao contar orcamento:", e)

print("\n=== TESTE REAL DE CADA CHAVE GEMINI CONTRA A API DO GOOGLE ===")
MODEL = "gemini-flash-lite-latest"
for name, key in real_keys:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={key}"
    body = json.dumps({"contents":[{"parts":[{"text":"diga apenas: ok"}]}]}).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type":"application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            print(name, "-> HTTP", r.status, "(OK)")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode(errors="replace")[:400]
        print(name, f"-> HTTP {e.code}:", err_body)
    except Exception as e:
        print(name, "-> ERRO:", repr(e))

print("\nFIM DO DIAGNOSTICO")
