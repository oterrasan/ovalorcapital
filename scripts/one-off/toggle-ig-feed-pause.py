import json
import os
import sys
import urllib.request
import urllib.error

SUPABASE_URL = "https://yntwvfcxjardzafdqanj.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_KEY") or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHd2ZmN4amFyZHphZmRxYW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDM1NTMwMywiZXhwIjoyMDk1OTMxMzAzfQ.BX1N_0wHoICwK5V8-96KXaMMbA8tQManVelxS1-pO40"

ACTION = sys.argv[1] if len(sys.argv) > 1 else "pause"  # "pause" ou "resume"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}


def req(method, path, body=None, extra_headers=None):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    data = json.dumps(body).encode() if body is not None else None
    headers = dict(HEADERS)
    if extra_headers:
        headers.update(extra_headers)
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=20) as resp:
            raw = resp.read().decode()
            return resp.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def read_flag(key):
    code, data = req("GET", f"config?key=eq.{key}&select=key,value&order=updated_at.desc.nullslast&limit=1")
    if isinstance(data, list) and data:
        return data[0]["value"]
    return None


def set_flag(key, value):
    req("DELETE", f"config?key=eq.{key}")
    code, data = req("POST", "config", {"key": key, "value": value})
    return code


print(f"ACAO: {ACTION}")
print()
print("ANTES:")
print("  IG_AUTOMATION_ENABLED (OVC) =", read_flag("IG_AUTOMATION_ENABLED"))
print("  BON_IG_ENABLED (Brasil On) =", read_flag("BON_IG_ENABLED"))
print()

if ACTION == "pause":
    set_flag("IG_AUTOMATION_ENABLED", "off")
    set_flag("BON_IG_ENABLED", "off")
elif ACTION == "resume":
    set_flag("IG_AUTOMATION_ENABLED", "on")
    set_flag("BON_IG_ENABLED", "on")
else:
    print("acao desconhecida, use 'pause' ou 'resume'")
    sys.exit(1)

print("DEPOIS:")
print("  IG_AUTOMATION_ENABLED (OVC) =", read_flag("IG_AUTOMATION_ENABLED"))
print("  BON_IG_ENABLED (Brasil On) =", read_flag("BON_IG_ENABLED"))
