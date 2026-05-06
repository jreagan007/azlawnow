#!/usr/bin/env bash
# Morning push 2026-05-06: 3 stories, embed-bait visual program
#
# Order:
#   1. Verify FB + IG token (will fail loudly if expired)
#   2. Post FB + IG for career-schools chart (buckeye already posted yesterday)
#   3. Post FB + IG for daycare-violations chart
#   4. Post X thread for career-schools chart (azln-28)
#   5. Post X thread for daycare-violations chart (azln-29)
#   6. Send embed-pitch follow-ups for buckeye prior recipients (3 emails)
#   7. Send embed-pitch follow-ups for career-schools prior recipients (~19 emails, domain-capped)
#   8. Send embed-pitch follow-ups for daycare prior recipients (~32 emails, domain-capped)
#
# All within outreach guardrails: per-domain 3/day cap, DNC check, dedup,
# voice gate, commit-per-send.

set -e
cd "$(dirname "$0")/.."

LOG="data/outreach/morning-push-$(date +%Y-%m-%d).log"
mkdir -p data/outreach

echo "=== AZ Law Now Morning Push $(date '+%Y-%m-%d %H:%M:%S %Z') ===" | tee -a "$LOG"

# ── 1. Token sanity check ──────────────────────────────────
echo "" | tee -a "$LOG"
echo "[1] FB token sanity check" | tee -a "$LOG"
if [ -f /Users/taqticlaw/Projects/taqtics-ops/config/.env ]; then
  source /Users/taqticlaw/Projects/taqtics-ops/config/.env
  if [ -n "$AZLAW_FB_PAGE_TOKEN" ] && [ -n "$AZLAW_FB_PAGE_ID" ]; then
    PROBE=$(curl -s "https://graph.facebook.com/v18.0/${AZLAW_FB_PAGE_ID}?fields=id,name&access_token=${AZLAW_FB_PAGE_TOKEN}" | head -c 200)
    if echo "$PROBE" | grep -q '"name"'; then
      echo "  ✓ token valid for page id ${AZLAW_FB_PAGE_ID}" | tee -a "$LOG"
    else
      echo "  ⛔ token rejected by Meta. FB+IG posts will fail." | tee -a "$LOG"
      echo "  Refresh: see RUNBOOK section 'Token chain for FB and IG posting'" | tee -a "$LOG"
    fi
  else
    echo "  ⛔ AZLAW_FB_PAGE_TOKEN or AZLAW_FB_PAGE_ID missing from ops/.env" | tee -a "$LOG"
  fi
fi

# ── 2-3. Social posts (FB + IG) for the 2 new charts ───────
for SLUG in career-schools daycare-violations; do
  echo "" | tee -a "$LOG"
  echo "[2-3] FB + IG: $SLUG chart" | tee -a "$LOG"

  # FB
  case "$SLUG" in
    career-schools)      FB_ID="fb-azln-14"; IG_ID="ig-azln-09" ;;
    daycare-violations)  FB_ID="fb-azln-15"; IG_ID="ig-azln-10" ;;
  esac
  echo "  FB $FB_ID" | tee -a "$LOG"
  npx tsx scripts/post-fb-azlaw.ts --id "$FB_ID" 2>&1 | tail -5 | tee -a "$LOG" || echo "  (FB soft-fail, continuing)" | tee -a "$LOG"
  sleep 8
  echo "  IG $IG_ID" | tee -a "$LOG"
  npx tsx scripts/post-ig-azlaw.ts --id "$IG_ID" 2>&1 | tail -5 | tee -a "$LOG" || echo "  (IG soft-fail, continuing)" | tee -a "$LOG"
  sleep 8
done

# ── 4-5. X threads for the 2 new charts ────────────────────
echo "" | tee -a "$LOG"
echo "[4-5] X threads: azln-28 (career-schools), azln-29 (daycare)" | tee -a "$LOG"
for X_ID in azln-28 azln-29; do
  echo "  X $X_ID" | tee -a "$LOG"
  npx tsx scripts/post-x-azlaw.ts --id "$X_ID" 2>&1 | tail -5 | tee -a "$LOG" || echo "  (X soft-fail, continuing)" | tee -a "$LOG"
  sleep 60
done

# ── 6-8. Embed-pitch follow-ups for each story ─────────────
echo "" | tee -a "$LOG"
echo "[6-8] Embed-pitch follow-ups (per-domain 3/day cap enforced inside script)" | tee -a "$LOG"
for SLUG in buckeye-durango-yuma-roundabout-rejected arizona-career-schools-37-adverse-actions arizona-daycare-violations; do
  echo "" | tee -a "$LOG"
  echo "  embed-pitch $SLUG" | tee -a "$LOG"
  python3 scripts/outreach/embed-pitch.py "$SLUG" 2>&1 | tail -8 | tee -a "$LOG" || echo "  (pitch soft-fail, continuing)" | tee -a "$LOG"
done

echo "" | tee -a "$LOG"
echo "=== Morning push complete $(date '+%Y-%m-%d %H:%M:%S %Z') ===" | tee -a "$LOG"
