#!/bin/bash
# One-off: status real e completo do Brasil ON — HTTP da home, favicon novo,
# status de sync (contagem por categoria), pra responder "tem pendência?"
set -uo pipefail

echo "=== HTTP homepage www.obrasilon.com.br ==="
curl -s --max-time 15 -o /tmp/home.html -w "HTTP_CODE:%{http_code}\n" "https://www.obrasilon.com.br/"
echo "--- título + favicon ---"
grep -o '<title>[^<]*</title>' /tmp/home.html | head -1
grep -o '<link rel="icon"[^>]*>' /tmp/home.html | head -1

echo
echo "=== action=status (sync/contagem por categoria) ==="
curl -s --max-time 20 "https://www.obrasilon.com.br/api/manage?action=status" | head -c 2000
echo

echo
echo "=== sitemap.xml (existe?) ==="
curl -s --max-time 10 -o /dev/null -w "HTTP_CODE:%{http_code}\n" "https://www.obrasilon.com.br/sitemap.xml"

echo
echo "=== páginas de categoria (HTTP) ==="
for p in brasil-on futebol politica policia; do
  code=$(curl -s --max-time 10 -o /dev/null -w "%{http_code}" "https://www.obrasilon.com.br/$p/")
  echo "/$p/ -> $code"
done
