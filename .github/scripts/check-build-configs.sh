#!/usr/bin/env bash
# Fail if a build-time config file contains hidden or dynamic code.
#
# These files execute on every `npm run dev` / `npm run build` (locally and in
# CI), which makes them a target for malicious PRs: several contributions have
# hidden an obfuscated payload after hundreds of tabs on the last line of
# web/postcss.config.mjs. This runs before `npm ci` so nothing from the PR has
# executed yet.
set -euo pipefail
cd "$(dirname "$0")/../.."

status=0
for f in web/*.config.* ; do
  [ -f "$f" ] || continue
  if awk 'length($0) > 300 { found = 1 } END { exit !found }' "$f"; then
    echo "::error file=$f::line longer than 300 characters (possible hidden payload)"; status=1
  fi
  if grep -nP '\S[\t ]{40,}\S' "$f" >/dev/null; then
    echo "::error file=$f::long whitespace run inside a line (possible hidden payload)"; status=1
  fi
  if grep -nE 'createRequire|child_process|\beval\(|new Function|fromCharCode|\\u00[0-9a-fA-F]{2}' "$f" >/dev/null; then
    echo "::error file=$f::dynamic code execution primitive in a build config"; status=1
  fi
done
exit $status
