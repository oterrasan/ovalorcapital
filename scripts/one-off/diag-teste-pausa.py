import json, urllib.request, urllib.error, datetime

BASE = "https://www.ovalorcapital.com.br"
PASS = "ovc-admin-2026-secreto"

now_utc = datetime.datetime.now(datetime.timezone.utc)
now_brt = now_utc - datetime.timedelta(hours=3)
print("AGORA BRT:", now_brt.isoformat(), "(deve estar dentro de 00h-06h = pausa)")

canais = ["materias", "futebol", "outros_esportes", "brasilon",
          "jovempan_politica", "internacional", "economia_mercado", "fofocas"]

for c in canais:
    url = f"{BASE}/api/run_portal?tipo={c}&force=true&count=1&pass={PASS}"
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            body = r.read().decode()
            print(f"{c}: HTTP {r.status} -> {body[:200]}")
    except urllib.error.HTTPError as e:
        print(f"{c}: HTTP {e.code} -> {e.read().decode()[:200]}")
    except Exception as e:
        print(f"{c}: ERRO {e}")
