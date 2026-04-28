#!/usr/bin/env python3
"""Phase 2 warm-lead follow-up for confirmed clickers, Brendan Franks voice.

Reads send_log, queries Resend for clicks in a window, filters scanner-pattern
intake addresses + DNC + already-phase2'd, builds per-recipient Phase 2 emails:
  1. Acknowledges the click on their original story (subject: Re: <orig>)
  2. Offers a concrete next-step resource: raw dataset, county cut, records pull
  3. No ask, peer-to-peer voice, sender-friendly
  4. Voice gate

Posts a Slack click-report to the channel BEFORE any send so Jared sees the
warm-lead board. Then renders a combined preview to jared@taqtics.com.

Usage:
  python3 scripts/outreach/warm-followup.py [--days 14] [--dry-run] [--send-live]

Default: post Slack click report + email preview to Jared. Do NOT send live to
recipients. --send-live fires the actual outreach (after Jared's ship sign-off).
"""
import os
import sys
import json
import re
import sqlite3
import subprocess
import tempfile
import time
import hashlib
from pathlib import Path
from datetime import datetime

ROOT = Path(os.path.expanduser("~/Projects/azlawnow"))
DB = str(ROOT / "data" / "outreach" / "azlawnow-outreach.db")
OUT_DIR = ROOT / "data" / "outreach" / "preview"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def _load_ops_env():
    p = os.path.expanduser("~/Projects/taqtics-ops/config/.env")
    if not os.path.exists(p):
        sys.stderr.write(f"ERROR: ops env not found at {p}\n")
        sys.exit(2)
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

DAYS = 14
DRY = "--dry-run" in sys.argv
SEND_LIVE = "--send-live" in sys.argv
for i, a in enumerate(sys.argv):
    if a == "--days" and i + 1 < len(sys.argv):
        DAYS = int(sys.argv[i + 1])

FROM = "Brendan Franks <brendan@insights.azlawnow.com>"
BCC = ["bf@azlawnow.com", "jared@taqtics.com"]
REVIEW_TO = "jared@taqtics.com"
REVIEW_FROM = "AZ Law Now Review <brendan@insights.azlawnow.com>"

SCANNER_LOCAL_PARTS = re.compile(
    r"^(info|press|news|hello|tips|monitors|events|complaints|whatson|"
    r"editor|editorial|newsroom|tipsline|letters|opinion|sales|mail|admin|"
    r"customerservice|corrections|deals|opinions|expertanalysis|pitches|"
    r"media|community|communications|breaking|publisher|hq|"
    r"newstips|publicnotices|investigators|investigates|programming|"
    r"assignmentdesk|pressoffice|pressinquiry|aginfo|complaints)",
    re.I,
)


VOICE_BANNED = {
    "leverage", "utilize", "solutions", "synergy", "robust", "holistic",
    "passionate", "empower", "innovative", "cutting-edge", "best-in-class", "seamless",
}
THROAT_CLEAR = ("it is worth", "in today's world", "at the end of the day",
                "when it comes to", "i hope this finds", "i wanted to reach")


def voice_check(text):
    issues = []
    if "—" in text or "–" in text:
        issues.append("em-dash or en-dash")
    low = text.lower()
    for w in VOICE_BANNED:
        if w in low:
            issues.append(f"banned: {w}")
    for phrase in THROAT_CLEAR:
        if phrase in low:
            issues.append(f"throat-clear: {phrase}")
    return issues


def is_scanner(email):
    local = email.split("@", 1)[0].lower()
    if SCANNER_LOCAL_PARTS.match(local):
        return True
    return False


# Per-article Phase 2 offers. Each offer is a concrete next-step resource.
PHASE2_OFFER = {
    "arizona-325-educator-discipline-2024": (
        "I've got the per-county breakdown of the 597 cases, the year-over-year "
        "category mix, and the cumulative voluntary-surrender pattern in a clean "
        "spreadsheet. Happy to send if it fits whatever you're working on next."
    ),
    "arizona-schools-merv-13-filter-bypass": (
        "I can pull the public-records request templates we drafted for HVAC service "
        "invoices, pressure differential logs, and ESSER spending breakdowns by "
        "district. If you want a specific district cut I'll run it."
    ),
    "arizona-career-schools-37-adverse-actions": (
        "Happy to send the FY25 PPSE adverse-action breakdown, the federal 60% rule "
        "primary text, and the AZ tort theory pull (Pruitt v. Pavelin plus the consumer "
        "fraud statute) if it helps your next piece."
    ),
    "tempe-asu-pavement-180-day-claim-clock": (
        "I can share the Tempe MAG ARRP grant filings, the ABOR service rule citation, "
        "the Fong v. Phoenix 2024 opinion, and the 180-day Notice of Claim primary text. "
        "Just say what cut would help."
    ),
    "buckeye-durango-yuma-roundabout-rejected": (
        "I've got the full Crash Modification Factor analysis from the Buckeye engineering "
        "report plus the FHWA conversion data in a clean format. If you want population "
        "growth correlation I can pull that too."
    ),
    "grand-court-mesa-elder-abuse-hb2228": (
        "Happy to share the AZDHS facility inspection data, the HB2228 statutory text, and "
        "the national long-term-care complaint trend. If your piece needs facility-specific "
        "numbers I can pull them."
    ),
    "arizona-pedestrian-deaths-road-design": (
        "I can send the per-corridor fatality cuts, the road-design factors per ADOT, and "
        "the year-over-year trend back to 2018. Just say what borough or county would help."
    ),
    "arizona-school-restraint-data": (
        "Happy to pull a district-level cut, the disability-category breakdown, or the "
        "training-compliance numbers if your next piece needs specifics."
    ),
    "arizona-school-bus-seat-belts": (
        "I've got the federal NHTSA standard versus AZ's status, the per-district fleet "
        "data, and the budget line items. Send me an angle and I'll pull what fits."
    ),
    "arizona-daycare-violations": (
        "I can send the AZDHS facility-by-facility violation history, the citation severity "
        "breakdown, and the geographic concentration. Just say what cut works."
    ),
    "arizona-nursing-home-violations": (
        "Happy to share the CMS five-star ratings cross-referenced with state-level "
        "deficiency citations, plus the federal-to-state enforcement timeline by facility."
    ),
    "phoenix-dui-crashes-data": (
        "I can pull the DUI fatality trend by zip, the time-of-day pattern, and the "
        "holiday-window concentration if your audience cares about prevention angles."
    ),
    "default": (
        "I've got the underlying public records cleaned up. If your next piece needs a "
        "specific county, district, or corridor cut, just say the word and I'll pull it."
    ),
}


def hash_email(email):
    return hashlib.md5(email.lower().encode()).hexdigest()[:12]


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


def first_name_from(name):
    if not name:
        return ""
    parts = name.strip().split()
    if not parts:
        return ""
    fn = parts[0]
    if len(fn) <= 2 or fn.isupper() or "-" in fn:
        return ""
    return fn.title()


def post_slack(text):
    """Post the click-report to the daily Slack channel."""
    p = ROOT / "scripts" / "outreach" / "heartbeat-slack.py"
    if not p.exists():
        return False
    content = p.read_text()
    m = re.search(r'SLACK_WEBHOOK\s*=\s*"([^"]+)"', content)
    if not m:
        return False
    webhook = m.group(1)
    try:
        subprocess.run(
            ["curl", "-s", "-o", "/dev/null", "-X", "POST", webhook,
             "-H", "Content-Type: application/json", "-d", json.dumps({"text": text})],
            check=False, capture_output=True, timeout=10,
        )
        return True
    except Exception:
        return False


def build_phase2_email(target):
    name = target["name"]
    first = first_name_from(name)
    email = target["email"]
    article_title = target["article_title"]
    article_slug = target["article_slug"]
    article_url = target["article_url"]
    original_subject = target.get("original_subject", article_title)

    greeting = f"Hi {first}," if first else "Hi there,"
    contact_id = hash_email(email)
    url = (
        f"{article_url}?utm_source=email_brendan_azlawnow_phase2"
        f"&utm_medium=email"
        f"&utm_campaign=warm_followup_{article_slug}"
        f"&utm_term={contact_id}"
    )

    offer = PHASE2_OFFER.get(article_slug, PHASE2_OFFER["default"])

    subject = original_subject
    if not subject.lower().startswith("re:"):
        subject = "Re: " + subject
    if len(subject) > 78:
        subject = subject[:75] + "..."

    body_text = (
        f"{greeting}\n\n"
        f"Saw you took a look at the {article_title.rstrip('.')} piece earlier this week, "
        f"appreciated you giving it a read.\n\n"
        f"{offer}\n\n"
        f"Link to the piece again in case it's useful: {url}\n\n"
        f"Brendan Franks\nEditor, AZ Law Now"
    )

    issues = voice_check(body_text)
    if issues:
        raise RuntimeError(f"voice gate failed for {email}: {issues}")

    html = (
        f"<p>{greeting}</p>"
        f"<p>Saw you took a look at the <a href=\"{url}\">{article_title.rstrip('.')}</a> "
        f"piece earlier this week, appreciated you giving it a read.</p>"
        f"<p>{offer}</p>"
        f"<p>Brendan Franks<br>Editor, AZ Law Now</p>"
    )
    return subject, html


def main():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row

    rows = list(conn.execute(
        """
        SELECT sl.to_email, sl.subject AS original_subject, sl.resend_id,
               sl.sent_at, sl.article_slug,
               ca.title AS article_title, ca.url AS article_url,
               c.name AS contact_name, c.outlet, c.role
        FROM send_log sl
        LEFT JOIN content_assets ca ON ca.slug = sl.article_slug
        LEFT JOIN contacts c ON LOWER(c.email) = LOWER(sl.to_email)
        WHERE sl.persona = 'brendan'
          AND date(sl.sent_at) >= date('now', ? || ' days')
        ORDER BY sl.sent_at DESC
        """,
        (f"-{DAYS}",),
    ))
    print(f"scanning {len(rows)} sends in last {DAYS} days for click events")

    dnc = {r[0].lower() for r in conn.execute("SELECT email FROM do_not_contact")}
    phase2_already = {
        r[0].lower() for r in conn.execute(
            "SELECT to_email FROM send_log WHERE persona='brendan' AND subject LIKE 'Re: %'"
        )
    }

    warm_leads = []
    skipped_scanner = 0
    skipped_no_article = 0
    skipped_dnc = 0
    skipped_phase2_already = 0

    for row in rows:
        rid = row["resend_id"]
        if not rid:
            continue
        event = fetch_event(rid)
        last = (event.get("last_event") or "").lower()
        if last != "clicked":
            continue
        email = row["to_email"].lower().strip()
        if is_scanner(email):
            skipped_scanner += 1
            continue
        if not row["article_slug"]:
            skipped_no_article += 1
            continue
        if email in dnc:
            skipped_dnc += 1
            continue
        if email in phase2_already:
            skipped_phase2_already += 1
            continue
        warm_leads.append(dict(row))
        time.sleep(0.15)

    seen = set()
    deduped = []
    for w in warm_leads:
        e = w["to_email"].lower()
        if e in seen:
            continue
        seen.add(e)
        deduped.append(w)
    warm_leads = deduped

    print(f"warm leads: {len(warm_leads)} | filtered: scanner={skipped_scanner}, no_article={skipped_no_article}, dnc={skipped_dnc}, phase2_already={skipped_phase2_already}")

    # Slack click-report regardless of whether we send
    today = datetime.now().strftime("%Y-%m-%d")
    if warm_leads:
        slack_lines = [f"*AZ Law Now warm-lead board, {today}*", ""]
        slack_lines.append(f"Last {DAYS} days: *{len(warm_leads)} confirmed real-human clickers*. Scanner-pattern intakes filtered. Already-phase2'd recipients skipped.")
        slack_lines.append("")
        for w in warm_leads:
            name = w.get("contact_name") or "(unknown)"
            outlet = w.get("outlet") or ""
            slack_lines.append(f":mag: *{name}* at {outlet} (`{w['to_email']}`) clicked _{w['article_title']}_")
        slack_lines.append("")
        slack_lines.append(f"Phase 2 follow-ups drafted, preview en route to <mailto:jared@taqtics.com|jared@taqtics.com>. Reply `ship` on the preview email to fire all {len(warm_leads)} live.")
        slack_text = "\n".join(slack_lines)
    else:
        slack_text = f"*AZ Law Now warm-lead board, {today}*\n\nNo new clickers in the last {DAYS} days that pass scanner / DNC / phase2 filters."
    if post_slack(slack_text):
        print("ok slack click-report posted")
    else:
        print("warn slack click-report not posted (webhook unavailable)")

    if not warm_leads:
        print("no warm leads matched. exiting.")
        return

    rendered = []
    for w in warm_leads:
        target = {
            "email": w["to_email"],
            "name": w.get("contact_name") or "",
            "outlet": w.get("outlet") or "",
            "role": w.get("role") or "",
            "article_title": w["article_title"] or w["article_slug"],
            "article_slug": w["article_slug"],
            "article_url": w["article_url"] or f"https://azlawnow.com/investigations/{w['article_slug']}/",
            "original_subject": w["original_subject"] or w["article_title"] or w["article_slug"],
        }
        try:
            subject, html = build_phase2_email(target)
            rendered.append({**target, "subject": subject, "html": html})
        except Exception as e:
            print(f"  voice fail {w['to_email']}: {e}")

    summary = (
        f"<p><strong>Phase 2 warm-lead follow-up</strong>, ready on your <code>ship</code> reply.</p>"
        f"<p>Last {DAYS} days, {len(warm_leads)} confirmed real-human clickers. Scanner intake filtered. Already-phase2'd skipped.</p>"
        f"<p>Each opens with peer acknowledgment, cites the article they clicked, offers a concrete next-step resource. "
        f"Subject is <code>Re: &lt;original&gt;</code> so it threads with the first email.</p>"
        f"<p>Reply <code>ship</code> to fire all {len(rendered)}. Reply <code>ship N</code> for first N. <code>hold</code> to abort.</p>"
        f"<hr>"
    )
    parts = [summary]
    for i, r in enumerate(rendered, 1):
        parts.append(
            f"<h3>{i}. {r['name'] or '(no name)'}, {r['email']}</h3>"
            f"<p><strong>Outlet:</strong> {r['outlet']} &nbsp;<strong>Role:</strong> {r['role']}</p>"
            f"<p><strong>Original article they clicked:</strong> {r['article_title']}</p>"
            f"<p><strong>Subject:</strong> {r['subject']}</p>"
            f"<div style='border-left: 3px solid #C23B22; padding-left: 14px; margin: 10px 0; "
            f"background: #fafafa; padding-top: 8px; padding-bottom: 8px;'>"
            f"{r['html']}"
            f"</div><hr>"
        )
    body = (
        "<html><body style='font-family: -apple-system, BlinkMacSystemFont, sans-serif; "
        "max-width: 760px; margin: 0 auto; padding: 24px; color: #222;'>"
        + "".join(parts)
        + "</body></html>"
    )

    local = OUT_DIR / "warm-followup-preview.html"
    local.write_text(body)
    print(f"local preview HTML: {local}")

    if not SEND_LIVE:
        payload = {
            "from": REVIEW_FROM,
            "to": [REVIEW_TO],
            "subject": f"[REVIEW] AZ Law Now phase 2 warm-followup, {len(rendered)} clickers ready",
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
            print(f"ok preview to {REVIEW_TO}: {d['id']}")
        finally:
            os.unlink(p)
        return

    sent = 0
    errs = 0
    for r in rendered:
        if DRY:
            print(f"DRY: {r['email']} | {r['subject'][:60]}")
            sent += 1
            continue
        payload = {
            "from": FROM, "to": [r["email"]], "subject": r["subject"],
            "html": r["html"], "bcc": BCC,
        }
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(payload, f)
            p = f.name
        try:
            res = subprocess.run(
                ["curl", "-s", "-X", "POST", "https://api.resend.com/emails",
                 "-H", f"Authorization: Bearer {RESEND_API_KEY}",
                 "-H", "Content-Type: application/json", "-d", f"@{p}"],
                capture_output=True, text=True, check=True,
            )
            d = json.loads(res.stdout)
            if "id" not in d:
                raise RuntimeError(f"Resend rejected: {res.stdout[:300]}")
            conn.execute(
                "INSERT INTO send_log (to_email, from_email, persona, subject, resend_id, article_slug) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (r["email"], "brendan@insights.azlawnow.com", "brendan", r["subject"], d["id"], r["article_slug"]),
            )
            conn.commit()
            print(f"  ok {r['email']:40} | {d['id']}")
            sent += 1
            time.sleep(1.2)
        except Exception as e:
            print(f"  err {r['email']}: {e}")
            errs += 1
        finally:
            os.unlink(p)
    print(f"\nphase2 sent={sent} errs={errs}")


if __name__ == "__main__":
    main()
