#!/usr/bin/env bash
set -euo pipefail
# Usage: ./submit_damrev.sh <jwt-token>
# Or set environment variable JWT and run without args.

TOKEN="${1:-${JWT:-}}"
API_URL="${API_URL:-https://usestellarwavehub.vercel.app}"

if [ -z "$TOKEN" ]; then
  echo "Usage: $0 <jwt-token>  (or set JWT env var)"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAYLOAD="$SCRIPT_DIR/damrev_project.json"

if [ ! -f "$PAYLOAD" ]; then
  echo "Missing payload: $PAYLOAD"
  exit 1
fi

echo "Posting DAMREV project to $API_URL/api/projects"
curl -sS -X POST "$API_URL/api/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "@$PAYLOAD" \
  -w "\nHTTP_CODE:%{http_code}\n"
