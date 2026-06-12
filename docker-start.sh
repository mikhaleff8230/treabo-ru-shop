#!/bin/sh
set -eu

cd /app

if [ ! -f .next/BUILD_ID ]; then
  echo "FATAL: .next/BUILD_ID missing — run npm run build in the image" >&2
  ls -la .next 2>&1 || true
  exit 1
fi

echo "Starting Next.js on 0.0.0.0:${PORT:-3000} (BUILD_ID=$(cat .next/BUILD_ID))"
exec npx next start -H 0.0.0.0 -p "${PORT:-3000}"
