#!/usr/bin/env python3
"""
OVC Instagram — Envia sessão para o servidor
Execute após capturar a sessão com capturar_sessao.py
"""

import json
import sys
import urllib.request

# Cole aqui a URL do seu serviço após o deploy
URL_SERVICO = "https://ovc-instagram-bot-production.up.railway.app"

try:
    with open("sessao_instagram.json") as f:
        sessao = json.load(f)
except FileNotFoundError:
    print("❌ Arquivo sessao_instagram.json não encontrado.")
    print("   Execute primeiro: python3 capturar_sessao.py")
    sys.exit(1)

print(f"Enviando sessão para {URL_SERVICO}...")

req = urllib.request.Request(
    f"{URL_SERVICO}/login/upload",
    method="POST",
    data=json.dumps(sessao).encode(),
    headers={"Content-Type": "application/json"}
)

try:
    resp = urllib.request.urlopen(req, timeout=15)
    data = json.loads(resp.read())
    print(f"✅ {data.get('message', 'Sessão enviada com sucesso!')}")
except Exception as e:
    print(f"❌ Erro: {e}")
