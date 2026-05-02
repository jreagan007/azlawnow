#!/usr/bin/env bash
# Fire 12 engagement tweets at organic 35-min spacing for the entire afternoon.
# Total runtime: ~7 hours for all 12.
#
# Identity verify in code, plus the eng-azln-NN are already QC'd in
# x-engagement.json + x-engagement-afternoon.json.
#
# Usage:
#   bash scripts/fire-throughout-afternoon.sh                    # immediate start
#   bash scripts/fire-throughout-afternoon.sh --offset 1500      # wait 25 min before first

set -e
cd "$(dirname "$0")/.."

OFFSET=0
if [ "$1" = "--offset" ]; then OFFSET=${2:-0}; fi

if [ "$OFFSET" -gt 0 ]; then
  echo "Sleeping ${OFFSET}s before first fire..."
  sleep "$OFFSET"
fi

DELAY=2100  # 35 min between fires (organic, 12 fires = ~7h end-to-end)

IDS=(eng-azln-09 eng-azln-10 eng-azln-11 eng-azln-12 eng-azln-13 eng-azln-14 eng-azln-15 eng-azln-16 eng-azln-17 eng-azln-18 eng-azln-19 eng-azln-20)

LAST=${IDS[-1]}
for ID in "${IDS[@]}"; do
  echo ""
  echo "=== Firing $ID at $(date +%H:%M:%S) ==="
  npx tsx scripts/post-x-azlaw.ts --id "$ID" || echo "(soft fail, continuing)"
  if [ "$ID" != "$LAST" ]; then
    echo "Sleeping ${DELAY}s before next..."
    sleep "$DELAY"
  fi
done

echo ""
echo "=== Afternoon batch complete: 12 engagement tweets fired ==="
