#!/bin/bash
# One-off diagnostic: confere DNS + status real do portal Brasil ON
# (obrasilon.com.br) e do projeto brasilon.vercel.app, e roda um sync manual.
set -uo pipefail

echo "=== DNS ==="
getent hosts obrasilon.com.br || echo "obrasilon.com.br: NAO RESOLVE"
getent hosts www.obrasilon.com.br || echo "www.obrasilon.com.br: NAO RESOLVE"

echo
echo "=== HTTP obrasilon.com.br (raiz) ==="
curl -s -o /dev/null -w "status=%{http_code} time=%{time_total}s\n" --max-time 15 "https://obrasilon.com.br/" || echo "FALHOU"

echo
echo "=== HTTP www.obrasilon.com.br (raiz) ==="
curl -s -o /dev/null -w "status=%{http_code} time=%{time_total}s\n" --max-time 15 "https://www.obrasilon.com.br/" || echo "FALHOU"

echo
echo "=== HTTP brasilon.vercel.app (raiz, projeto Vercel direto) ==="
curl -s -o /dev/null -w "status=%{http_code} time=%{time_total}s\n" --max-time 15 "https://brasilon.vercel.app/" || echo "FALHOU"

echo
echo "=== action=status (via www.obrasilon.com.br) ==="
curl -s --max-time 15 "https://www.obrasilon.com.br/api/manage?action=status" || echo "FALHOU"
echo

echo
echo "=== action=status (via brasilon.vercel.app, direto) ==="
curl -s --max-time 15 "https://brasilon.vercel.app/api/manage?action=status" || echo "FALHOU"
echo

echo
echo "=== Disparando sync manual (via www.obrasilon.com.br) ==="
curl -s --max-time 20 -X POST "https://www.obrasilon.com.br/api/manage?action=sync&pass=ovc-admin-2026-secreto" || echo "FALHOU"
echo

echo
echo "=== action=status pos-sync (via www.obrasilon.com.br) ==="
curl -s --max-time 15 "https://www.obrasilon.com.br/api/manage?action=status" || echo "FALHOU"
echo
