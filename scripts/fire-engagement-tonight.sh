#!/usr/bin/env bash
# Fire 5 engagement tweets sequentially at 5-min spacing
# Save 3 more (eng-azln-06/07/08) for tomorrow.

set -e
cd "$(dirname "$0")/.."

DELAY=300  # 5 min between fires (organic, off spam radar)

for ID in eng-azln-01 eng-azln-02 eng-azln-03 eng-azln-04 eng-azln-05; do
  echo ""
  echo "=== Firing $ID at $(date +%H:%M:%S) ==="
  npx tsx scripts/post-x-azlaw.ts --id "$ID"
  if [ "$ID" != "eng-azln-05" ]; then
    echo "Sleeping ${DELAY}s before next..."
    sleep "$DELAY"
  fi
done

echo ""
echo "=== 5 engagement tweets fired. eng-azln-06/07/08 held for tomorrow. ==="
