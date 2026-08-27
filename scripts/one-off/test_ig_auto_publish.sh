#!/bin/bash
# One-off: dispara 2 chamadas reais de ig_auto_publish em produção, pra
# confirmar se o deploy que carrega essa ação já foi ao ar (Vercel vinha
# falhando por cota diária) e, se sim, gerar os 2 posts de teste que
# Roberto pediu.
set -uo pipefail

for i in 1 2; do
  echo "=== Chamada $i ==="
  curl -s --max-time 25 -w "\nHTTP_CODE:%{http_code}\n" -X POST \
    "https://www.ovalorcapital.com.br/api/manage" \
    -H "Content-Type: application/json" \
    -d '{"action":"ig_auto_publish","token":"ovc-admin-2026-secreto"}'
  echo
done
