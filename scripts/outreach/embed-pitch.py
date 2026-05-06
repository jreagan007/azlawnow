#!/usr/bin/env python3
"""Embed-bait follow-up pitch for AZ Law Now investigations.

For each story slug, finds prior outreach recipients (in send_log), filters
out DNC / dupes / domain-cap excess, sends a tight Tynski-style pitch with
the chart embed code + #chart deep-link.

Subject line is stat-lede (never agency-name prefix). Body offers the
ready-to-paste embed code, with editorial-freedom framing (no anchor-text
ask). BCCs Brendan + Jared. Commit-per-send.

Usage:
  python3 scripts/outreach/embed-pitch.py <story-slug> [--limit N] [--dry-run]
"""
import sqlite3, os, sys, json, subprocess, tempfile, hashlib, time
from pathlib import Path

DB = os.path.expanduser("~/Projects/azlawnow/data/outreach/azlawnow-outreach.db")
DOMAIN_CAP = 3
SUFFIX = "embed_pitch_v1"  # subject log marker so we never re-send the same pitch


def load_env(path):
    if not os.path.exists(path): return
    for line in open(path):
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line: continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"'))
load_env(os.path.expanduser("~/Projects/taqtics-ops/config/.env"))

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
if not RESEND_API_KEY:
    sys.stderr.write("ERROR: RESEND_API_KEY not set\n"); sys.exit(2)

RESEND_URL = "https://api.resend.com/emails"
BCC = ["bf@azlawnow.com", "jared@taqtics.com"]
FROM = "Brendan Franks <brendan@insights.azlawnow.com>"


# Per-story embed config: subject, body lede, bomb-stat anchor, chart filename.
STORIES = {
    "buckeye-durango-yuma-roundabout-rejected": {
        "subject_stat": "Buckeye picked the design that prevents fewer injury crashes",
        "lede": "Buckeye's own engineering report projected a roundabout would cut serious-injury crashes 41.7% at Durango and Yuma. The City picked the signalized design (15.4% reduction) for $1.4M in concrete savings.",
        "embed_image": "https://azlawnow.com/embeds/buckeye-roundabout-master-1200x675.png",
        "alt": "Buckeye Durango and Yuma intersection: roundabout would have reduced injury crashes 41.7%, signalized design chosen reduces them 15.4%",
        "topic_tag": "AZ infrastructure / road safety",
    },
    "arizona-career-schools-37-adverse-actions": {
        "subject_stat": "237 AZ private career schools, 37 adverse actions in FY25",
        "lede": "Arizona's Board for Private Postsecondary Education licensed 237 private career schools in FY25, issued 37 adverse actions, and assisted 9 closures. Most affected students never see the audit-stage paperwork.",
        "embed_image": "https://azlawnow.com/embeds/career-schools-master-1200x675.png",
        "alt": "Arizona licensed 237 private career schools, issued 37 adverse actions and assisted 9 closures in fiscal year 2025",
        "topic_tag": "AZ higher ed / career training oversight",
    },
    "arizona-daycare-violations": {
        "subject_stat": "51 AZ West Valley daycares cited 3+ times in 3 years",
        "lede": "51 daycare facilities across Buckeye, Goodyear, Avondale, and Surprise were cited 3 or more times by AZ DHS between 2023 and 2025. Staff-ratio violations are 40% of all West Valley citations.",
        "embed_image": "https://azlawnow.com/embeds/daycare-violations-master-1200x675.png",
        "alt": "51 Maricopa County daycare facilities cited 3 or more times across Buckeye, Goodyear, Avondale, and Surprise, 2023 to 2025",
        "topic_tag": "AZ child safety / daycare regulation",
    },
}


def parse_args():
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: embed-pitch.py <story-slug> [--limit N] [--dry-run]\n"); sys.exit(1)
    slug = sys.argv[1]
    limit = 50
    dry_run = "--dry-run" in sys.argv
    for i, a in enumerate(sys.argv):
        if a == "--limit" and i + 1 < len(sys.argv):
            limit = int(sys.argv[i + 1])
    return slug, limit, dry_run


def hash_email(email):
    return hashlib.md5(email.lower().encode()).hexdigest()[:12]


def build_email(slug, story_cfg, recipient):
    name = (recipient.get("name") or "").strip()
    first = name.split()[0] if name else ""
    email = recipient["email"].lower().strip()
    is_org_email = email.split("@", 1)[0] in {
        "info", "editor", "editorial", "contact", "hello", "press", "tips",
        "media", "office", "team", "director", "board", "staff", "newsroom",
    }
    if first and not is_org_email and not first.isupper():
        greeting = f"Hi {first},"
    else:
        outlet = (recipient.get("outlet") or "").strip()
        greeting = f"Hi {outlet} team," if outlet else "Hi there,"

    contact_id = hash_email(email)
    story_url = f"https://azlawnow.com/investigations/{slug}/"
    chart_url = f"{story_url}?utm_source=email_brendan_azlawnow&utm_medium=embed_pitch&utm_campaign={slug}&utm_content=chart_followup&utm_term={contact_id}#chart"

    embed_html = (
        f'<a href="{story_url}" rel="dofollow">'
        f'<img src="{story_cfg["embed_image"]}" alt="{story_cfg["alt"]}" width="1200" height="675" loading="lazy" />'
        f'</a>'
        f'<p><small>Source: <a href="{story_url}" rel="dofollow">AZ Law Now investigation</a>.</small></p>'
    )

    subject = story_cfg["subject_stat"]

    text = (
        f"{greeting}\n\n"
        f"{story_cfg['lede']}\n\n"
        f"I built a chart on this for you. Drop it into your piece, takes 5 seconds. "
        f"It's free for editorial reuse and the source line links back to the investigation.\n\n"
        f"Chart, ready to embed:\n{chart_url}\n\n"
        f"Or paste this snippet directly into your CMS:\n\n"
        f"{embed_html}\n\n"
        f"No need to ask, no anchor-text request, no follow-up obligation. Use it however you want.\n\n"
        f"Brendan Franks\nEditor, AZ Law Now"
    )

    html = (
        f"<p>{greeting}</p>"
        f"<p>{story_cfg['lede']}</p>"
        f'<p>I built a chart on this for you. Drop it into your piece, takes 5 seconds. '
        f"It's free for editorial reuse and the source line links back to the investigation.</p>"
        f'<p><strong>Chart, ready to embed:</strong><br/>'
        f'<a href="{chart_url}">{chart_url}</a></p>'
        f"<p><strong>Or paste this snippet directly into your CMS:</strong></p>"
        f'<pre style="white-space:pre-wrap;font-family:ui-monospace,Menlo,monospace;font-size:12px;background:#f5ede0;padding:12px;border:1px solid #d4c9b8;border-radius:4px;">{embed_html.replace("<", "&lt;").replace(">", "&gt;")}</pre>'
        f"<p>No need to ask, no anchor-text request, no follow-up obligation. Use it however you want.</p>"
        f"<p>Brendan Franks<br/>Editor, AZ Law Now</p>"
    )

    return subject, text, html


def send_resend(to_email, subject, text, html):
    payload = {
        "from": FROM, "to": [to_email], "subject": subject,
        "text": text, "html": html, "bcc": BCC,
        "reply_to": ["jared+brendan@taqtics.com"],
    }
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump(payload, f); p = f.name
    try:
        r = subprocess.run(
            ["curl", "-s", "-X", "POST", RESEND_URL,
             "-H", f"Authorization: Bearer {RESEND_API_KEY}",
             "-H", "Content-Type: application/json", "-d", f"@{p}"],
            capture_output=True, text=True, check=True,
        )
        d = json.loads(r.stdout)
        if "id" not in d:
            raise RuntimeError(f"Resend rejected: {r.stdout[:300]}")
        return d["id"]
    finally:
        os.unlink(p)


def commit_per_send(slug, to_email, resend_id):
    try:
        subprocess.run(
            ["git", "-C", os.path.expanduser("~/Projects/azlawnow"),
             "commit", "--allow-empty", "-m", f"embed-pitch: {slug} -> {to_email} ({resend_id[:8]})"],
            check=False, capture_output=True,
        )
    except Exception:
        pass


def main():
    slug, limit, dry_run = parse_args()
    cfg = STORIES.get(slug)
    if not cfg:
        sys.stderr.write(f"ERROR: no embed-pitch config for {slug}\n"); sys.exit(1)

    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row

    # Find prior recipients of this story slug
    rows = conn.execute("""
        SELECT DISTINCT s.to_email AS email,
                        c.name AS name,
                        c.outlet AS outlet,
                        c.beat AS beat,
                        c.segment AS segment
          FROM send_log s
     LEFT JOIN contacts c ON c.email = s.to_email
         WHERE s.article_slug = ?
    """, (slug,)).fetchall()

    dnc = {r[0].lower() for r in conn.execute("SELECT email FROM do_not_contact")}
    # Already-sent the embed-pitch? Check by slug + persona='embed_pitch'
    already_pitched = {r[0].lower() for r in conn.execute(
        "SELECT to_email FROM send_log WHERE article_slug=? AND persona=?", (slug, SUFFIX)
    )}

    print(f"=== embed-pitch | story: {slug} | prior recipients: {len(rows)} | dry_run: {dry_run} ===")

    domain_count = {}
    counts = {"dnc": 0, "already_pitched": 0, "domain_cap": 0, "send_ok": 0, "send_err": 0}
    sent = 0

    for r in rows:
        if sent >= limit: break
        email = (r["email"] or "").lower().strip()
        if not email or "@" not in email: continue
        if email in dnc:
            counts["dnc"] += 1; continue
        if email in already_pitched:
            counts["already_pitched"] += 1; continue
        domain = email.split("@", 1)[1]
        if domain_count.get(domain, 0) >= DOMAIN_CAP:
            counts["domain_cap"] += 1; continue

        subject, text, html = build_email(slug, cfg, dict(r))

        if dry_run:
            print(f"  📝 DRY: {email:<42}| {subject[:60]}")
            counts["send_ok"] += 1
            sent += 1
            domain_count[domain] = domain_count.get(domain, 0) + 1
            continue

        try:
            rid = send_resend(email, subject, text, html)
            conn.execute(
                "INSERT INTO send_log (to_email, from_email, persona, subject, resend_id, article_slug) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (email, "brendan@insights.azlawnow.com", SUFFIX, subject, rid, slug),
            )
            conn.commit()
            commit_per_send(slug, email, rid)
            print(f"  ✅ {email:<42}| {rid}")
            counts["send_ok"] += 1
            sent += 1
            domain_count[domain] = domain_count.get(domain, 0) + 1
            time.sleep(1.2)
        except Exception as e:
            print(f"  ❌ {email}: {e}")
            counts["send_err"] += 1

    print(f"\n📊 sent={sent} | gates: {counts}")


if __name__ == "__main__":
    main()
