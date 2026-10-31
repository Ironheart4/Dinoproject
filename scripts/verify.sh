#!/usr/bin/env bash
set -uo pipefail
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

FAILED=()
step() {
  local name="$1"
  shift
  echo "==> $name"
  if "$@"; then
    echo "OK: $name"
  else
    echo "FAIL: $name"
    FAILED+=("$name")
  fi
}

step "backend typecheck" npx tsc --noEmit -p .
step "route documentation" bash scripts/check-docs.sh
step "backend tests" npm test --silent
step "backend build" npm run build --silent

if [ -d frontend ]; then
  step "frontend build" npm --prefix frontend run build --silent
fi
if [ -d admin ] && [ -f admin/package.json ]; then
  step "admin build" npm --prefix admin run build --silent
fi

if [ "${#FAILED[@]}" -eq 0 ]; then
  echo "VERIFY PASSED"
  exit 0
fi

echo "VERIFY FAILED: ${FAILED[*]}"
exit 1
