import json
import urllib.request
import urllib.error
import urllib.parse
import datetime

BASE = "https://www.ovalorcapital.com.br"
TOKEN = "ovc-admin-2026-secreto"
SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40"

now_utc = datetime.datetime.now(datetime.timezone.utc)
now_brt = now_utc - datetime.timedelta(hours=3)
print("AGORA BRT:", now_brt.isoformat())
print()


def sb_get(path, params=None):
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


def post(path, payload):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{BASE}{path}", data=data, headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:600]


print("=== 1) CONFIG FLAGS AGORA ===")
for k in ["AUTOMATION", "SISTEMA_LIGADO", "IG_AUTOMATION_ENABLED", "REELS_AUTOMATION_ENABLED", "BON_IG_ENABLED", "BON_REEL_ENABLED"]:
    code, rows = sb_get("config", {"select": "value,updated_at", "key": f"eq.{k}"})
    print(f"- {k}: HTTP {code} -> {rows}")

print()
print("=== 2) POSTS CRIADOS NAS ULTIMAS 2 HORAS (geral, todos os canais) ===")
dois_h_atras = (now_utc - datetime.timedelta(hours=2)).isoformat()
code, posts = sb_get(
    "posts",
    {
        "select": "id,titulo,publish_method,status,created_at",
        "order": "created_at.desc",
        "limit": "20",
        "created_at": f"gte.{dois_h_atras}",
    },
)
print(f"HTTP {code} — total encontrado: {len(posts) if code == 200 else '?'}")
if code == 200:
    for p in posts:
        print(f"- {p['created_at']} | {p['publish_method']} | {p['status']} | {p['titulo'][:55]!r}")

print()
print("=== 3) ULTIMAS PUBLICACOES REAIS NO INSTAGRAM (metrics.instagram presente) ===")
code, ig_posts = sb_get(
    "posts",
    {
        "select": "id,titulo,metrics,updated_at",
        "order": "updated_at.desc",
        "limit": "500",
        "metrics": "not.is.null",
    },
)
if code == 200:
    achou = 0
    for p in ig_posts:
        m = p.get("metrics") or {}
        if isinstance(m, str):
            try:
                m = json.loads(m)
            except Exception:
                m = {}
        ig = m.get("instagram") or {}
        reel = m.get("instagram_reel") or {}
        pub_at = ig.get("published_at") or reel.get("published_at")
        if pub_at:
            print(f"- {pub_at} | {'feed' if ig.get('published_at') else 'reel'} | {p['titulo'][:50]!r}")
            achou += 1
            if achou >= 10:
                break
    if achou == 0:
        print("(nenhuma publicacao real encontrada nos 500 posts mais recentes atualizados)")
else:
    print("HTTP", code, ig_posts)

print()
print("=== 4) LOGS RECENTES (ultimas 50, nivel + mensagem) ===")
code, logs = sb_get("logs", {"select": "level,message,created_at", "order": "created_at.desc", "limit": "50"})
if code == 200:
    for lg in logs:
        print(f"- {lg['created_at']} | {lg['level']} | {lg['message'][:140]}")
else:
    print("HTTP", code, logs)

print()
print("=== 5) GATES DA PAUSA NOTURNA AGORA (deve estar LIBERADO — fora da janela 00h-06h) ===")
code, body = post("/api/run_portal", {"action": "metropoles_tiktok_registrar", "token": TOKEN, "user": "metropolesoficial", "videos": []})
print(f"robo tiktok -> HTTP {code} -> {body}")
code, body = post("/api/manage", {"action": "reels_render_job", "token": TOKEN})
print(f"reels_render_job -> HTTP {code} -> {body}")

print()
print("=== 6) status geral do portal (home + admin respondendo?) ===")
for path in ["/", "/admin"]:
    req = urllib.request.Request(f"{BASE}{path}", method="GET")
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            print(f"{path} -> HTTP {r.status}")
    except urllib.error.HTTPError as e:
        print(f"{path} -> HTTP {e.code}")
    except Exception as e:
        print(f"{path} -> ERRO {e}")
