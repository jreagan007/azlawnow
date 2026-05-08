#!/usr/bin/env bash
# drip-drain-embed-pitch.sh
#
# Slow + steady follow-up email drain. Fires every 2 hours via launchd, sends
# a small batch (5 per story) per run. Per-domain cap (3/day) inside embed-pitch.py
# is the secondary ceiling. Each send uses a 30-second human-pace pause.
#
# Stories: append new slugs to STORIES as they ship.
# Already-pitched recipients are auto-skipped by embed-pitch.py.

set -e
cd "$(dirname "$0")/.."

LOG="data/outreach/drip-drain-$(date +%Y-%m-%d).log"
mkdir -p data/outreach

STORIES=(
  buckeye-durango-yuma-roundabout-rejected
  arizona-career-schools-37-adverse-actions
  arizona-daycare-violations
  arizona-school-bus-seat-belts
  arizona-school-restraint-data
  arizona-schools-merv-13-filter-bypass
  27th-ave-thomas-rd-bnsf-crossing
)

PER_RUN_LIMIT=5

echo "=== drip-drain $(date '+%Y-%m-%d %H:%M:%S %Z') ===" | tee -a "$LOG"
echo "stories: ${#STORIES[@]} | per-run limit: $PER_RUN_LIMIT" | tee -a "$LOG"

for SLUG in "${STORIES[@]}"; do
  echo "" | tee -a "$LOG"
  echo "--- $SLUG ---" | tee -a "$LOG"
  python3 scripts/outreach/embed-pitch.py "$SLUG" --limit "$PER_RUN_LIMIT" 2>&1 | tail -8 | tee -a "$LOG" || \
    echo "  (soft fail, continuing)" | tee -a "$LOG"
done

echo "" | tee -a "$LOG"
echo "=== drip-drain complete $(date '+%Y-%m-%d %H:%M:%S %Z') ===" | tee -a "$LOG"
