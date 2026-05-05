#!/usr/bin/env python3
"""
OVC Instagram — Captura de Sessão
Execute no seu Mac para fazer login e salvar os cookies.
Depois execute enviar_sessao.py para enviar ao servidor.
"""

import asyncio
import json
import sys

async def main():
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("Instalando Playwright...")
        import subprocess
        subprocess.run([sys.executable, "-m", "pip", "install", "playwright"], check=True)
        subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"], check=True)
        from playwright.async_api import async_playwright

    print("\n=== OVC Instagram — Captura de Sessão ===")
    print("Abrindo Chrome com Instagram...")
    print("Faça o login normalmente.")
    print("Quando ver o feed do Instagram, volte aqui e pressione ENTER.\n")

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=False,
            args=["--no-sandbox", "--start-maximized"]
        )
        ctx = await browser.new_context(
            viewport={"width": 1280, "height": 900},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            locale="pt-BR"
        )
        page = await ctx.new_page()
        await page.goto("https://www.instagram.com/accounts/login/", wait_until="networkidle")

        print("Chrome aberto. Faça o login no Instagram...")
        input("Pressione ENTER após ver o feed do Instagram: ")

        storage = await ctx.storage_state()
        with open("sessao_instagram.json", "w") as f:
            json.dump(storage, f, indent=2)

        print(f"\n✅ Sessão salva em: sessao_instagram.json")
        print(f"   Cookies: {len(storage.get('cookies', []))}")
        print("\nAgora execute: python3 enviar_sessao.py")

        await browser.close()

asyncio.run(main())
