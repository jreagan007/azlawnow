#!/usr/bin/env python3
"""Story-specific personalized sender for AZ Law Now Brendan Franks outreach.

Reads a per-story targets file with pre-enriched personalization_hook per recipient,
applies three pre-send gates (locality, beat-content, hook), sends one personalized
email per contact with a per-recipient UTM, BCCs Brendan and Jared, logs to send_log.

Usage:
  python3 scripts/outreach/send-story.py <story-slug> [--limit N] [--dry-run]

Targets file: data/outreach/targets/<story-slug>.json
"""
import sqlite3
import os
import sys
import json
import subprocess
import tempfile
import hashlib
import time
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

RESEND_URL = "https://api.resend.com/emails"
BCC = ["bf@azlawnow.com", "jared@taqtics.com"]
FROM_NAME = "Brendan Franks"
FROM_EMAIL = "brendan@insights.azlawnow.com"
FROM_TITLE = "Editor-in-Chief, AZ Law Now Investigations"
FROM = f"{FROM_NAME} <{FROM_EMAIL}>"


def parse_args():
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: send-story.py <story-slug> [--limit N] [--dry-run]\n")
        sys.exit(1)
    slug = sys.argv[1]
    limit = 50
    dry_run = "--dry-run" in sys.argv
    for i, a in enumerate(sys.argv):
        if a == "--limit" and i + 1 < len(sys.argv):
            limit = int(sys.argv[i + 1])
    return slug, limit, dry_run


def load_targets(slug):
    f = TARGETS_DIR / f"{slug}.json"
    if not f.exists():
        sys.stderr.write(f"ERROR: targets file not found: {f}\n")
        sys.exit(1)
    return json.loads(f.read_text())


def load_article(conn, slug):
    row = conn.execute("SELECT * FROM content_assets WHERE slug = ?", (slug,)).fetchone()
    if not row:
        sys.stderr.write(f"ERROR: article {slug} not in content_assets table\n")
        sys.exit(1)
    return dict(row)


def hash_email(email):
    return hashlib.md5(email.lower().encode()).hexdigest()[:12]


def gate_locality(target):
    """Skip out-of-state contacts unless explicitly cleared as national."""
    state = (target.get("state") or "").strip().lower()
    if target.get("national_clearance"):
        return True
    return state in ("arizona", "az", "")


def gate_beat_content(target, article):
    """Reject if article keywords don't appear in target's beat or relevance note."""
    beat = (target.get("beat") or "").lower()
    note = (target.get("story_relevance_note") or "").lower()
    article_text = (article.get("title", "") + " " + article.get("description", "") + " " + article.get("beats", "")).lower()
    article_keywords = [k for k in article.get("beats", "").split(",") if k.strip()]
    for kw in article_keywords:
        if kw.strip() in beat or kw.strip() in note:
            return True
    return False


def gate_hook(target):
    """Require a personalization_hook before send."""
    hook = (target.get("personalization_hook") or "").strip()
    return len(hook) >= 30


def build_email(target, article):
    name = target.get("name", "").strip()
    first = name.split()[0] if name else ""
    email = target["email"].lower().strip()
    is_org_email = email.split("@", 1)[0] in {
        "info", "editor", "editorial", "contact", "hello", "press", "tips",
        "media", "office", "team", "director", "board", "staff",
    }
    if first and not is_org_email:
        greeting = f"Hi {first},"
    else:
        outlet = (target.get("outlet") or "").strip()
        greeting = f"Hi {outlet} team," if outlet else "Hi there,"

    hook = target["personalization_hook"].strip()
    if hook[-1] not in ".!?":
        hook += "."

    title = article["title"]
    slug = article["slug"]
    contact_id = hash_email(email)

    url = (
        f"{article['url']}?utm_source=email_brendan_azlawnow"
        f"&utm_medium=email"
        f"&utm_campaign=story_{slug}"
        f"&utm_content={slug}"
        f"&utm_term={contact_id}"
    )

    stat_hook = (article.get("stat_hook") or "").strip()
    if stat_hook and stat_hook[-1] not in ".!?":
        stat_hook += "."

    subject = title
    if len(subject) > 78:
        subject = subject[:75] + "..."

    html = (
        f"<p>{greeting}</p>"
        f"<p>{hook}</p>"
        f"<p>I'm Brendan Franks at AZ Law Now Investigations. We just published a piece that I think connects to your work.</p>"
        f"<p>{stat_hook}</p>"
        f"<p>The full investigation is here: <a href=\"{url}\">{title}</a></p>"
        f"<p>Happy to share the underlying records, methodology, or sources if any of this is useful for your reporting or advocacy.</p>"
        f"<p>Brendan Franks<br>{FROM_TITLE}<br>"
        f"<a href=\"https://azlawnow.com/investigations/?utm_source=email_brendan_azlawnow&utm_medium=email&utm_campaign=signature\">azlawnow.com/investigations</a></p>"
    )
    return subject, html


def send_resend(to_email, subject, html):
    payload = {
        "from": FROM, "to": [to_email], "subject": subject,
        "html": html, "bcc": BCC,
    }
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump(payload, f)
        p = f.name
    try:
        r = subprocess.run(
            [
                "curl", "-s", "-X", "POST", RESEND_URL,
                "-H", f"Authorization: Bearer {RESEND_API_KEY}",
                "-H", "Content-Type: application/json", "-d", f"@{p}",
            ],
            capture_output=True, text=True, check=True,
        )
        d = json.loads(r.stdout)
        if "id" not in d:
            raise RuntimeError(f"Resend rejected: {r.stdout[:300]}")
        return d["id"]
    finally:
        os.unlink(p)


def commit_per_send(slug, to_email, resend_id):
    """Per-send commit on the targets file as a tracking artifact."""
    try:
        subprocess.run(
            ["git", "-C", os.path.expanduser("~/Projects/azlawnow"),
             "add", f"data/outreach/targets/{slug}.json"],
            check=False, capture_output=True,
        )
        subprocess.run(
            ["git", "-C", os.path.expanduser("~/Projects/azlawnow"),
             "commit", "-m", f"send: {slug} -> {to_email} ({resend_id[:8]})",
             "--allow-empty"],
            check=False, capture_output=True,
        )
    except Exception:
        pass


def main():
    slug, limit, dry_run = parse_args()
    targets = load_targets(slug)
    print(f"=== story: {slug} | targets in file: {len(targets)} | dry_run: {dry_run} ===")

    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    article = load_article(conn, slug)

    dnc = {r[0].lower() for r in conn.execute("SELECT email FROM do_not_contact")}
    already_sent = {r[0].lower() for r in conn.execute("SELECT DISTINCT to_email FROM send_log")}

    counts = {"locality_fail": 0, "beat_fail": 0, "hook_fail": 0, "dnc": 0, "sent_already": 0, "send_ok": 0, "send_err": 0}
    sent = 0

    for t in targets:
        if sent >= limit:
            break
        email = (t.get("email") or "").lower().strip()
        if not email or "@" not in email:
            continue
        if email in dnc:
            counts["dnc"] += 1
            continue
        if email in already_sent:
            counts["sent_already"] += 1
            continue
        if not gate_locality(t):
            counts["locality_fail"] += 1
            print(f"  ⛔ locality: {email} state={t.get('state')}")
            continue
        if not gate_beat_content(t, article):
            counts["beat_fail"] += 1
            print(f"  ⛔ beat-fit: {email} beat={t.get('beat')}")
            continue
        if not gate_hook(t):
            counts["hook_fail"] += 1
            print(f"  ⛔ no hook: {email}")
            continue

        subject, html = build_email(t, article)
        if dry_run:
            print(f"  📝 DRY: {email} | {subject[:60]}")
            counts["send_ok"] += 1
            sent += 1
            continue
        try:
            rid = send_resend(email, subject, html)
            conn.execute(
                "INSERT INTO send_log (to_email, from_email, persona, subject, resend_id, article_slug) VALUES (?, ?, ?, ?, ?, ?)",
                (email, FROM_EMAIL, "brendan", subject, rid, slug),
            )
            conn.commit()
            commit_per_send(slug, email, rid)
            print(f"  ✅ {email:<42}| {rid}")
            counts["send_ok"] += 1
            sent += 1
            time.sleep(1.2)
        except Exception as e:
            print(f"  ❌ {email}: {e}")
            counts["send_err"] += 1

    print(f"\n📊 sent={sent} | gates: {counts}")


if __name__ == "__main__":
    main()
