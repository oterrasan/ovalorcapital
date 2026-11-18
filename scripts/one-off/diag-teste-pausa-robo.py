import json
import urllib.request
import urllib.error
import datetime

BASE = "https://www.ovalorcapital.com.br"
TOKEN = "ovc-admin-2026-secreto"

now_utc = datetime.datetime.now(datetime.timezone.utc)
now_brt = now_utc - datetime.timedelta(hours=3)
print("AGORA BRT:", now_brt.isoformat(), "(deve estar dentro de 00h-06h = pausa)")
print()


def post(path, payload):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:500]


print("=== 1) robo TikTok (metropoles_tiktok_registrar) ===")
code, body = post(
    "/api/run_portal",
    {"action": "metropoles_tiktok_registrar", "token": TOKEN, "user": "metropolesoficial", "videos": []},
)
print(f"HTTP {code} -> {body}")

print()
print("=== 2) fila de captura (link_jobs_pendentes) ===")
code, body = post("/api/run_portal", {"action": "link_jobs_pendentes", "token": TOKEN, "peek": True})
print(f"HTTP {code} -> {body}")

print()
print("=== 3) render de Reel (reels_render_job) ===")
code, body = post("/api/manage", {"action": "reels_render_job", "token": TOKEN})
print(f"HTTP {code} -> {body}")
