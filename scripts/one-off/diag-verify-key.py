import json
import urllib.request
import urllib.error

SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40"

HEADERS = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}


def rest(path):
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{path}", headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


print("=== CHAVES GEMINI CADASTRADAS AGORA (so nome + tamanho + prefixo, NUNCA o valor completo) ===")
gkeys = rest("config?select=key,value&key=like.GEMINI_API_KEY*")
real_keys = []
for g in gkeys:
    v = g.get("value") or ""
    print(g.get("key"), "len=", len(v), "prefix=", v[:6] + "..." if v else "(vazio)")
    if v:
        real_keys.append((g.get("key"), v))

print("\n=== TESTE REAL DE CADA CHAVE CONTRA A API DO GOOGLE ===")
MODEL = "gemini-flash-lite-latest"
for name, key in real_keys:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={key}"
    body = json.dumps({"contents": [{"parts": [{"text": "diga apenas: ok"}]}]}).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            resp = json.loads(r.read().decode())
            text = resp.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            print(name, "-> HTTP", r.status, "(OK) resposta:", text.strip()[:60])
    except urllib.error.HTTPError as e:
        err_body = e.read().decode(errors="replace")[:400]
        print(name, f"-> HTTP {e.code}:", err_body)
    except Exception as e:
        print(name, "-> ERRO:", repr(e))

print("\nFIM DO DIAGNOSTICO")
