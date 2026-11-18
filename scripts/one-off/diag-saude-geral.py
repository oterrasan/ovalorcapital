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


def http_check(url, label):
    req = urllib.request.Request(url, headers={"User-Agent": "diag-saude-geral"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            print(f"{label} -> HTTP {r.status}")
    except urllib.error.HTTPError as e:
        print(f"{label} -> HTTP {e.code}")
    except Exception as e:
        print(f"{label} -> ERRO: {repr(e)}")


now_utc = datetime.datetime.now(datetime.timezone.utc)
now_brt = now_utc - datetime.timedelta(hours=3)
print("=== HORA ATUAL ===")
print("UTC:", now_utc.isoformat())
print("BRT:", now_brt.isoformat())

print("\n=== SITE E ADMIN NO AR ===")
http_check("https://www.ovalorcapital.com.br/", "OVC home")
http_check("https://www.ovalorcapital.com.br/admin/", "OVC admin")
http_check("https://www.obrasilon.com.br/", "Brasil ON home")

print("\n=== FLAGS DE AUTOMACAO (config) ===")
flags = rest(
    "config?select=key,value&key=in.(AUTOMATION,SISTEMA_LIGADO,IG_AUTOMATION_ENABLED,"
    "REELS_AUTOMATION_ENABLED,BON_IG_ENABLED,BON_REEL_ENABLED,ESPORTES_LIMITE_DIARIO,"
    "OVC_LIMITE_DIARIO_TOTAL,MAX_POSTS_DIA)"
)
for f in flags:
    print(f.get("key"), "=", f.get("value"))

print("\n=== ULTIMOS 10 POSTS PUBLICADOS (confirma o pause real, sem assumir) ===")
posts = rest(
    "posts?select=id,titulo,created_at,publish_method,status"
    "&order=created_at.desc&limit=10"
)
for p in posts:
    print(p.get("created_at"), "|", p.get("publish_method"), "|", p.get("status"), "|", (p.get("titulo") or "")[:55])

print("\n=== CHAVES GEMINI (so nome + tamanho + prefixo) ===")
gkeys = rest("config?select=key,value&key=like.GEMINI_API_KEY*")
real_keys = []
for g in gkeys:
    v = g.get("value") or ""
    print(g.get("key"), "len=", len(v), "prefix=", v[:6] + "..." if v else "(vazio)")
    if v and (g.get("key"), v) not in real_keys:
        real_keys.append((g.get("key"), v))

print("\n=== TESTE REAL DE CADA CHAVE UNICA CONTRA A API DO GOOGLE ===")
seen = set()
MODEL = "gemini-flash-lite-latest"
for name, key in real_keys:
    if key in seen:
        continue
    seen.add(key)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={key}"
    body = json.dumps({"contents": [{"parts": [{"text": "diga apenas: ok"}]}]}).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            print(name, "-> HTTP", r.status, "(OK)")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode(errors="replace")[:200]
        print(name, f"-> HTTP {e.code}:", err_body.replace("\n", " "))
    except Exception as e:
        print(name, "-> ERRO:", repr(e))

print("\nFIM DO DIAGNOSTICO")
