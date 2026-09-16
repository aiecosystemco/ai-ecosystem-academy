#!/bin/sh
set -eu
cd /workspace
# Built-output QA on :8081 must never steal the live preview.
node scripts/preview.mjs stop || true
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
npm run dev >>/tmp/app-startup.log 2>&1 &
# Return fast; preview proxy retries until 8080 answers.
exit 0
