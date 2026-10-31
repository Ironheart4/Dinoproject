#!/usr/bin/env bash
set -uo pipefail
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

DOC="docs/api-reference.md"
if [ ! -f "$DOC" ]; then
  echo "SKIP: $DOC is local-only and not present in this checkout"
  exit 0
fi

paths="$(grep -rhoE '\.(get|post|put|delete|patch)\("/[^\"]*"' server.ts routes --include='*.ts' 2>/dev/null \
  | sed -E 's/^\.[a-z]+\("//; s/"$//' | sort -u)"
missing=0
while IFS= read -r path; do
  [ -z "$path" ] && continue
  if ! grep -qF "\`$path\`" "$DOC"; then
    echo "UNDOCUMENTED ROUTE: $path"
    missing=1
  fi
done <<< "$paths"

if [ "$missing" -eq 0 ]; then
  echo "DOCS CHECK PASSED"
  exit 0
fi

echo "DOCS CHECK FAILED"
exit 1
