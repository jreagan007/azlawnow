#!/usr/bin/env python3
"""Preview-to-Jared review gate for personalized story outreach.

Renders every email that send-story.py would fire and bundles them into a single
HTML preview that gets emailed to jared@taqtics.com BEFORE any live send hits a
real recipient. Jared reviews, replies "ship," then send-story.py runs live.

Usage:
  python3 scripts/outreach/preview-story.py <story-slug> [--limit N]
"""
import os
import sys
import json
import subprocess
import tempfile
import sqlite3
import hashlib
from pathlib import Path

DB = os.path.expanduser("~/Projects/azlawnow/data/outreach/azlawnow-outreach.db")
TARGETS_DIR = Path(os.path.expanduser("~/Projects/azlawnow/data/outreach/targets"))


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

# Re-implement the same gates and renderer from send-story.py so the preview
# matches what would actually fire. Keeps the source of truth in send-story.py.
sys.path.insert(0, str(Path(__file__).parent))
from send_story import build_email, gate_locality, gate_beat_content, gate_hook, hash_email, load_targets, load_article  # noqa: E402

REVIEW_TO = "jared@taqtics.com"
REVIEW_FROM = "AZ Law Now Review <brendan@insights.azlawnow.com>"


def parse_args():
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: preview-story.py <story-slug> [--limit N]\n")
        sys.exit(1)
    slug = sys.argv[1]
    limit = 50
    for i, a in enumerate(sys.argv):
        if a == "--limit" and i + 1 < len(sys.argv):
            limit = int(sys.argv[i + 1])
    return slug, limit


def main():
    slug, limit = parse_args()
    targets = load_targets(slug)
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    article = load_article(conn, slug)

    dnc = {r[0].lower() for r in conn.execute("SELECT email FROM do_not_contact")}
    already_sent = {r[0].lower() for r in conn.execute("SELECT DISTINCT to_email FROM send_log")}

    rendered = []
    blocked = {"locality": [], "beat": [], "hook": [], "dnc": [], "already_sent": []}

    for t in targets:
        if len(rendered) >= limit:
            break
        email = (t.get("email") or "").lower().strip()
        if not email or "@" not in email:
            continue
        if email in dnc:
            blocked["dnc"].append(email)
            continue
        if email in already_sent:
            blocked["already_sent"].append(email)
            continue
        if not gate_locality(t):
            blocked["locality"].append(f"{email} (state={t.get('state')})")
            continue
        if not gate_beat_content(t, article):
            blocked["beat"].append(f"{email} (beat={t.get('beat')})")
            continue
        if not gate_hook(t):
            blocked["hook"].append(email)
            continue

        subject, html = build_email(t, article)
        rendered.append({
            "email": email,
            "name": t.get("name", ""),
            "outlet": t.get("outlet", ""),
            "role": t.get("role", ""),
            "beat": t.get("beat", ""),
            "hook": t.get("personalization_hook", ""),
            "subject": subject,
            "html": html,
        })

    summary = (
        f"<p><strong>Story:</strong> {article['title']}</p>"
        f"<p><strong>URL:</strong> <a href=\"{article['url']}\">{article['url']}</a></p>"
        f"<p><strong>Targets in file:</strong> {len(targets)}</p>"
        f"<p><strong>Would send:</strong> {len(rendered)}</p>"
        f"<p><strong>Blocked by gate:</strong></p>"
        f"<ul>"
        f"<li>locality: {len(blocked['locality'])}</li>"
        f"<li>beat-content: {len(blocked['beat'])}</li>"
        f"<li>missing personalization hook: {len(blocked['hook'])}</li>"
        f"<li>already sent: {len(blocked['already_sent'])}</li>"
        f"<li>DNC: {len(blocked['dnc'])}</li>"
        f"</ul>"
        f"<p><strong>To approve:</strong> reply 'ship' to fire all {len(rendered)} live. "
        f"Reply 'ship N' to fire only the first N. Reply 'hold' to abort.</p>"
        f"<hr>"
    )

    parts = [summary]
    for i, r in enumerate(rendered, 1):
        parts.append(
            f"<h3>{i}. {r['name'] or '(no name)'} — {r['email']}</h3>"
            f"<p><strong>Outlet:</strong> {r['outlet']} &nbsp;<strong>Role:</strong> {r['role']}</p>"
            f"<p><strong>Beat:</strong> {r['beat']}</p>"
            f"<p><strong>Hook:</strong> <em>{r['hook']}</em></p>"
            f"<p><strong>Subject:</strong> {r['subject']}</p>"
            f"<div style=\"border-left: 3px solid #ccc; padding-left: 12px; margin: 8px 0; background: #fafafa;\">"
            f"{r['html']}"
            f"</div><hr>"
        )

    body = (
        "<html><body style=\"font-family: -apple-system, BlinkMacSystemFont, sans-serif; "
        "max-width: 720px; margin: 0 auto; padding: 20px;\">"
        + "".join(parts)
        + "</body></html>"
    )

    payload = {
        "from": REVIEW_FROM,
        "to": [REVIEW_TO],
        "subject": f"[REVIEW] {slug} — {len(rendered)} sends ready to ship",
        "html": body,
    }
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump(payload, f)
        p = f.name
    try:
        r = subprocess.run(
            ["curl", "-s", "-X", "POST", "https://api.resend.com/emails",
             "-H", f"Authorization: Bearer {RESEND_API_KEY}",
             "-H", "Content-Type: application/json", "-d", f"@{p}"],
            capture_output=True, text=True, check=True,
        )
        d = json.loads(r.stdout)
        if "id" not in d:
            raise RuntimeError(f"Resend rejected: {r.stdout[:300]}")
        print(f"✓ Review email sent to {REVIEW_TO}: {d['id']}")
        print(f"  rendered={len(rendered)} | blocked={ {k: len(v) for k,v in blocked.items()} }")
        print(f"  After Jared replies 'ship': python3 scripts/outreach/send-story.py {slug}")
    finally:
        os.unlink(p)


if __name__ == "__main__":
    main()
