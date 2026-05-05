import asyncio
import os
import json
import random
import shutil
from pathlib import Path
import urllib.request
from flask import Flask, request, jsonify
from playwright.async_api import async_playwright

app = Flask(__name__)

@app.after_request
def cors(r):
    r.headers["Access-Control-Allow-Origin"] = "*"
    r.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    r.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return r

SUPA_URL = os.environ.get("SUPABASE_URL", "")
SUPA_KEY = os.environ.get("SUPABASE_KEY", "")
SESSION_FILE = Path("/tmp/ig_session.json")
IMG_PATH = Path("/tmp/post_image.jpg")

def load_session_from_db():
    try:
        req = urllib.request.Request(
            f"{SUPA_URL}/rest/v1/config?key=eq.IG_SESSION&select=value",
            headers={"Authorization": f"Bearer {SUPA_KEY}", "apikey": SUPA_KEY}
        )
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read())
        if data and data[0].get("value"):
            session = json.loads(data[0]["value"])
            with open(SESSION_FILE, "w") as f:
                json.dump(session, f)
            return True
    except Exception as e:
        print(f"Erro ao carregar sessão do DB: {e}")
    return False

def save_session_to_db(session_data):
    try:
        req = urllib.request.Request(
            f"{SUPA_URL}/rest/v1/config?key=eq.IG_SESSION",
            method="DELETE",
            headers={"Authorization": f"Bearer {SUPA_KEY}", "apikey": SUPA_KEY, "Prefer": "return=minimal"}
        )
        urllib.request.urlopen(req, timeout=10)
        req2 = urllib.request.Request(
            f"{SUPA_URL}/rest/v1/config",
            method="POST",
            data=json.dumps({"key": "IG_SESSION", "value": json.dumps(session_data)}).encode(),
            headers={"Authorization": f"Bearer {SUPA_KEY}", "apikey": SUPA_KEY,
                     "Content-Type": "application/json", "Prefer": "return=minimal"}
        )
        urllib.request.urlopen(req2, timeout=10)
        return True
    except Exception as e:
        print(f"Erro ao salvar sessão no DB: {e}")
        return False

def has_session():
    if SESSION_FILE.exists():
        return True
    return load_session_from_db()

async def do_publish(image_path: str, caption: str):
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled",
                  "--disable-dev-shm-usage", "--disable-gpu", "--single-process"]
        )
        ctx = await browser.new_context(
            storage_state=str(SESSION_FILE),
            viewport={"width": 1280, "height": 900},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            locale="pt-BR"
        )
        page = await ctx.new_page()
        try:
            await page.goto("https://www.instagram.com/", wait_until="domcontentloaded", timeout=30000)
            await asyncio.sleep(3)
            if "accounts/login" in page.url:
                return False, "Sessão expirada — refaça o login"

            clicked = False
            for sel in ['svg[aria-label="Nova publicação"]', 'svg[aria-label="New post"]',
                        '[aria-label="Nova publicação"]', '[aria-label="New post"]']:
                try:
                    await page.locator(sel).first.click(timeout=8000)
                    clicked = True
                    break
                except Exception:
                    continue
            if not clicked:
                return False, "Botão de novo post não encontrado"

            await asyncio.sleep(random.uniform(2, 3))

            uploaded = False
            try:
                async with page.expect_file_chooser(timeout=10000) as fc_info:
                    for sel in ['button:has-text("Selecionar do computador")',
                                'button:has-text("Select from computer")']:
                        try:
                            await page.click(sel, timeout=5000)
                            break
                        except Exception:
                            continue
                fc = await fc_info.value
                await fc.set_files(image_path)
                uploaded = True
            except Exception:
                try:
                    fi = page.locator('input[type="file"]').first
                    await fi.set_input_files(image_path)
                    uploaded = True
                except Exception:
                    pass

            if not uploaded:
                return False, "Falha no upload da imagem"

            await asyncio.sleep(4)

            for _ in range(2):
                for sel in ['button:has-text("Avançar")', 'button:has-text("Next")',
                            '[role="button"]:has-text("Avançar")', '[role="button"]:has-text("Next")']:
                    try:
                        await page.click(sel, timeout=6000)
                        break
                    except Exception:
                        continue
                await asyncio.sleep(3)

            for sel in ['[aria-label="Escreva uma legenda..."]', '[aria-label="Write a caption..."]',
                        'div[role="textbox"]']:
                try:
                    campo = page.locator(sel).first
                    await campo.wait_for(state="visible", timeout=8000)
                    await campo.click()
                    await asyncio.sleep(0.5)
                    for chunk in [caption[i:i+40] for i in range(0, len(caption), 40)]:
                        await campo.type(chunk, delay=random.randint(30, 80))
                        await asyncio.sleep(0.1)
                    break
                except Exception:
                    continue

            await asyncio.sleep(2)

            for sel in ['button:has-text("Compartilhar")', 'button:has-text("Share")',
                        '[role="button"]:has-text("Compartilhar")', '[role="button"]:has-text("Share")']:
                try:
                    await page.click(sel, timeout=8000)
                    await asyncio.sleep(6)
                    return True, "Publicado com sucesso!"
                except Exception:
                    continue

            return False, "Botão Compartilhar não encontrado"

        except Exception as e:
            return False, str(e)
        finally:
            await ctx.close()
            await browser.close()

@app.route("/status")
def status():
    sessao = has_session()
    return jsonify({"ok": True, "sessao_salva": sessao,
                    "mensagem": "Sessão ativa" if sessao else "Sem sessão — faça login"})

@app.route("/login/upload", methods=["POST", "OPTIONS"])
def login_upload():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    data = request.get_json()
    if not data or "cookies" not in data:
        return jsonify({"ok": False, "message": "Dados inválidos"}), 400
    with open(SESSION_FILE, "w") as f:
        json.dump(data, f)
    save_session_to_db(data)
    cookies = len(data.get("cookies", []))
    return jsonify({"ok": True, "message": f"✅ Sessão salva! {cookies} cookies."})

@app.route("/publish", methods=["POST", "OPTIONS"])
def publish():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    data = request.get_json()
    if not data or "image_url" not in data or "caption" not in data:
        return jsonify({"ok": False, "error": "Informe image_url e caption"}), 400
    if not has_session():
        return jsonify({"ok": False, "error": "Sem sessão. Faça login primeiro."}), 401
    try:
        req = urllib.request.Request(data["image_url"], headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=20) as resp:
            with open(IMG_PATH, "wb") as f:
                shutil.copyfileobj(resp, f)
    except Exception as e:
        return jsonify({"ok": False, "error": f"Falha ao baixar imagem: {e}"}), 500
    try:
        ok, msg = asyncio.run(do_publish(str(IMG_PATH), data["caption"]))
        if ok:
            return jsonify({"ok": True, "message": msg})
        else:
            return jsonify({"ok": False, "error": msg}), 500
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

if __name__ == "__main__":
    load_session_from_db()
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, threaded=False)
