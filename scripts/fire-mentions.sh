#!/usr/bin/env bash
# Fire the 5 strategic mention tweets sequentially, 4 min between each
# so they look organic in Mayes / SOSArizona / Shatterproof / AZMirror notifications.
# Run this AFTER x-follow-execute.py completes so mentioned accounts already see
# "AZ Law Now followed you" before the @-mention notification lands.
#
# Each mention is a 2-tweet thread (main mention + reply with link).
# Identity verification via /users/me runs inside post-x-azlaw.ts before each.
#
# Usage:
#   bash scripts/fire-mentions.sh

set -e
cd "$(dirname "$0")/.."

DELAY=240  # 4 minutes between mention threads (organic-pace, off spam radar)

for ID in ment-azln-01 ment-azln-02 ment-azln-03 ment-azln-04 ment-azln-05; do
  echo ""
  echo "=== Firing $ID at $(date +%H:%M:%S) ==="
  npx tsx scripts/post-x-azlaw.ts --id "$ID"
  if [ "$ID" != "ment-azln-05" ]; then
    echo "Sleeping ${DELAY}s before next mention..."
    sleep "$DELAY"
  fi
done

echo ""
echo "=== All 5 mention tweets fired ==="
