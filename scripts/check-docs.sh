#!/usr/bin/env bash
# Fails if an HTTP route declared in modules/ or app.ts is missing from docs/api-reference.md.
set -uo pipefail
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

DOC="docs/api-reference.md"
if [ ! -f "$DOC" ]; then
  echo "SKIP: $DOC not present in this checkout"
  exit 0
fi

# Route paths are string literals starting with /api or /health inside modules/**/*.routes.ts
paths="$( { grep -rhoE '"/(api|health)[^"]*"' modules --include='*.routes.ts' 2>/dev/null; } \
  | tr -d '"' | sort -u)"

if [ -z "$paths" ]; then
  echo "FAIL: found no routes under modules/ (is the folder layout still the same?)"
  exit 1
fi

missing=0
while IFS= read -r path; do
  [ -z "$path" ] && continue
  if ! grep -qF "\`$path\`" "$DOC"; then
    echo "UNDOCUMENTED ROUTE: $path"
    missing=1
  fi
done <<< "$paths"

if [ "$missing" -eq 0 ]; then
  echo "DOCS CHECK PASSED ($(echo "$paths" | wc -l | tr -d ' ') routes)"
  exit 0
fi

echo "DOCS CHECK FAILED: add the routes above to $DOC"
exit 1
