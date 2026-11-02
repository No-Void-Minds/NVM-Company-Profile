#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$root/backend"
unformatted="$(gofmt -l .)"
if [ -n "$unformatted" ]; then
  echo "gofmt perlu dijalankan pada:" >&2
  echo "$unformatted" >&2
  exit 1
fi
go vet ./...
go build ./...
go test ./...

cd "$root/frontend"
npx vue-tsc --noEmit
npx eslint .
npx prettier --check .

echo "check.sh: OK"
