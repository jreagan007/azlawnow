#!/usr/bin/env python3
"""Daily Resend engagement report for AZ Law Now Brendan outreach.

Iterates send_log.resend_id (per memory: never use the list endpoint, last_event
is one-state-per-email so roll up clicks->opens->delivered).

Usage:
  python3 scripts/outreach/engagement-report.py [--days 7]
"""
import os
import sys
import json
import sqlite3
import subprocess
from datetime import datetime
from pathlib import Path

DB = os.path.expanduser("~/Projects/azlawnow/data/outreach/azlawnow-outreach.db")
OUT_DIR = Path(os.path.expanduser("~/Projects/azlawnow/data/outreach/engagement"))
OUT_DIR.mkdir(parents=True, exist_ok=True)


def _load_ops_env():
    p = os.path.expanduser("~/Projects/taqtics-ops/config/.env")
    if not os.path.exists(p):
        return
    for line in open(p):
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"'))
_load_ops_env()

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
if not RESEND_API_KEY:
    sys.stderr.write("ERROR: RESEND_API_KEY not set\n")
    sys.exit(2)


def fetch_event(resend_id):
    r = subprocess.run(
        ["curl", "-s", "-H", f"Authorization: Bearer {RESEND_API_KEY}",
         f"https://api.resend.com/emails/{resend_id}"],
        capture_output=True, text=True, check=True,
    )
    try:
        return json.loads(r.stdout)
    except Exception:
        return {}


def main():
    days = 7
    for i, a in enumerate(sys.argv):
        if a == "--days" and i + 1 < len(sys.argv):
            days = int(sys.argv[i + 1])

    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    rows = list(conn.execute(
        "SELECT to_email, subject, resend_id, article_slug, sent_at FROM send_log "
        "WHERE persona='brendan' AND date(sent_at) >= date('now', ? || ' days') "
        "ORDER BY sent_at DESC",
        (f"-{days}",),
    ))

    print(f"=== Resend engagement, last {days} days, {len(rows)} sends ===")
    counts = {"clicked": 0, "opened": 0, "delivered": 0, "bounced": 0, "complained": 0,
              "delivery_delayed": 0, "sent": 0, "unknown": 0}
    by_story = {}
    clicked_addrs = []

    for row in rows:
        rid = row["resend_id"]
        if not rid:
            continue
        data = fetch_event(rid)
        last = (data.get("last_event") or "").lower()
        slug = row["article_slug"] or "unknown"
        by_story.setdefault(slug, {"sent": 0, "clicked": 0, "opened": 0, "bounced": 0})
        by_story[slug]["sent"] += 1

        if last in counts:
            counts[last] += 1
            if last == "clicked":
                by_story[slug]["clicked"] += 1
                clicked_addrs.append({"to": row["to_email"], "subject": row["subject"], "slug": slug})
            elif last == "opened":
                by_story[slug]["opened"] += 1
            elif last == "bounced":
                by_story[slug]["bounced"] += 1
        else:
            counts["unknown"] += 1

    print("\nRollup (per memory: clicks > opens > delivered, last_event is one-state-per-email):")
    for k, v in counts.items():
        print(f"  {k}: {v}")
    print()
    print("By story:")
    for slug, c in by_story.items():
        print(f"  {slug}: sent={c['sent']} clicks={c['clicked']} opens={c['opened']} bounces={c['bounced']}")

    if clicked_addrs:
        print("\nClicked recipients (warm leads):")
        for c in clicked_addrs:
            print(f"  ✓ {c['to']:<40} | {c['slug']:<50} | {c['subject'][:60]}")

    today = datetime.now().strftime("%Y-%m-%d")
    out = OUT_DIR / f"{today}.json"
    out.write_text(json.dumps({
        "date": today,
        "scan_window_days": days,
        "sends": len(rows),
        "rollup": counts,
        "by_story": by_story,
        "clicked": clicked_addrs,
    }, indent=2))
    print(f"\n✓ Engagement JSON: {out}")


if __name__ == "__main__":
    main()
