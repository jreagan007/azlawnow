#!/usr/bin/env bash
# Fire 6 ESA tweets sequentially at 4-min spacing.
# 2 story drops + 4 mentions = ~24 min total run.
# Identity verify in code per post-x-azlaw.ts.
set -e
cd "$(dirname "$0")/.."

DELAY=240

IDS=(azln-23 azln-24 ment-azln-10 ment-azln-11 ment-azln-12 ment-azln-13)
LAST=${IDS[-1]}
for ID in "${IDS[@]}"; do
  echo ""
  echo "=== Firing $ID at $(date +%H:%M:%S) ==="
  npx tsx scripts/post-x-azlaw.ts --id "$ID" || echo "(soft fail, continuing)"
  if [ "$ID" != "$LAST" ]; then
    sleep "$DELAY"
  fi
done
echo ""
echo "=== ESA push complete: 6 tweets fired ==="
