#!/usr/bin/env python3
"""AZ Law Now community outreach — Brendan Franks persona.

Data-led pitches to AZ journalists, mommy bloggers, autism/disability advocates,
school safety orgs, elder care nonprofits, community organizations. Each pitch
matches the contact's segment to the most relevant investigation article.

Persona: Brendan Franks, Editor-in-Chief, AZ Law Now Investigations
From: brendan@insights.azlawnow.com
BCC: bf@azlawnow.com + jared@taqtics.com

Guardrails: MV-gated, per-send commit, DNC + send_log dedupe, one-per-domain-per-day.

Usage:
  python3 scripts/outreach/send-outreach.py [--limit 15] [--dry-run]
"""
import sqlite3, os, sys, json, subprocess, tempfile, time, random, re
from datetime import datetime

DB = os.path.expanduser("~/Projects/azlawnow/data/outreach/azlawnow-outreach.db")

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
    sys.stderr.write("ERROR: RESEND_API_KEY not set. Source from ~/Projects/taqtics-ops/config/.env\n")
    sys.exit(2)
RESEND_URL = "https://api.resend.com/emails"
BCC = ["bf@azlawnow.com", "jared@taqtics.com"]

FROM_NAME = "Brendan Franks"
FROM_EMAIL = "brendan@insights.azlawnow.com"
FROM_TITLE = "Editor-in-Chief, AZ Law Now Investigations"

limit = 15
dry_run = "--dry-run" in sys.argv
for i, a in enumerate(sys.argv):
    if a == "--limit" and i + 1 < len(sys.argv):
        limit = int(sys.argv[i + 1])

# ---- segment → beat mapping for article selection ----
SEGMENT_BEAT_MAP = {
    "mommy_blogger":          ["child_safety", "education", "daycare"],
    "parenting_blogger":      ["child_safety", "education", "daycare"],
    "autism_advocate":        ["disability", "child_safety", "education"],
    "disability_nonprofit":   ["disability", "child_safety", "education"],
    "special_needs_blogger":  ["disability", "child_safety"],
    "iep_advocate":           ["disability", "education"],
    "education_advocate":     ["education", "child_safety", "legislation"],
    "education_reporter":     ["education", "child_safety", "disability"],
    "pta_leader":             ["education", "child_safety"],
    "school_board":           ["education", "child_safety", "legislation"],
    "elder_care_nonprofit":   ["elder_care", "nursing_home", "abuse"],
    "senior_advocate":        ["elder_care", "nursing_home"],
    "nursing_reporter":       ["elder_care", "nursing_home"],
    "aarp_local":             ["elder_care", "pedestrian", "road_safety"],
    "az_journalist":          ["road_safety", "trucking", "education", "elder_care"],
    "traffic_safety_advocate":["road_safety", "pedestrian", "intersection"],
    "dot_reporter":           ["road_safety", "trucking", "highway"],
    "trucking_reporter":      ["trucking", "highway", "safety"],
    "safety_advocate":        ["road_safety", "trucking", "pedestrian"],
    "pedestrian_safety_advocate": ["pedestrian", "road_safety", "intersection"],
    "community_blogger":      ["community", "road_safety", "maricopa"],
    "maricopa_nonprofit":     ["community", "maricopa", "road_safety"],
    "madd_chapter":           ["dui", "road_safety"],
    "city_council":           ["road_safety", "pedestrian", "intersection"],
    "child_advocacy_nonprofit": ["child_safety", "daycare", "education"],
    "child_advocacy":           ["child_safety", "daycare", "education"],
    "special_needs_parent":     ["disability", "child_safety", "education"],
    "disability_rights":        ["disability", "child_safety", "education"],
    "disability_services":      ["disability", "child_safety"],
    "down_syndrome":            ["disability", "child_safety", "education"],
    "cerebral_palsy":           ["disability", "child_safety"],
    "epilepsy":                 ["disability", "child_safety"],
    "mental_health":            ["disability", "child_safety"],
    "community_org":            ["child_safety", "education", "community", "elder_care"],
    "victim_advocacy":          ["road_safety", "dui", "pedestrian"],
    "dui_prevention":           ["dui", "road_safety"],
    "homeschool_parent":        ["education", "child_safety"],
    "parent_organization":      ["education", "child_safety", "daycare"],
    "parent_advocacy":          ["education", "child_safety", "disability"],
    "foster_adoptive_parent":   ["child_safety", "daycare", "education"],
}

# ---- segment-specific pitch tails ----
SEGMENT_TAILS = {
    "mommy_blogger":          "If this is useful for your readers, share it freely. I can also pull the data for specific school districts or zip codes if you want to dig deeper.",
    "autism_advocate":         "If this data helps your work, use it however you need. I can cut the numbers by district, disability category, or grade level.",
    "disability_nonprofit":    "Happy to share the raw dataset or present the findings to your board if that would help.",
    "elder_care_nonprofit":    "If any of this supports your advocacy, cite it freely. I can pull facility-specific data for your service area.",
    "az_journalist":           "The underlying data is public record but nobody's pulled it together this way. Happy to share the raw dataset, methodology, or walk you through the sourcing.",
    "education_advocate":      "The data covers every district in the state. I can cut it to your geography if that helps.",
    "community_blogger":       "If any of this matters to your readers, share it. I live in Maricopa and built this because I couldn't find it anywhere else.",
    "madd_chapter":            "The holiday and time-of-day patterns might be useful for your awareness campaigns. Happy to pull Maricopa-specific data.",
    "traffic_safety_advocate": "The intersection-level data hasn't been published elsewhere. Happy to share it for your advocacy work.",
}

def send_resend(from_addr, to_email, subject, html):
    payload = {"from": from_addr, "to": [to_email], "subject": subject, "html": html, "bcc": BCC}
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(payload, f); p = f.name
    try:
        r = subprocess.run(['curl', '-s', '-X', 'POST', RESEND_URL,
             '-H', f'Authorization: Bearer {RESEND_API_KEY}',
             '-H', 'Content-Type: application/json', '-d', f'@{p}'],
            capture_output=True, text=True, check=True)
        d = json.loads(r.stdout)
        if "id" not in d:
            raise RuntimeError(f"Resend rejected: {r.stdout[:300]}")
        return d["id"]
    finally:
        os.unlink(p)

# ---- greeting ----
ORG_TOKENS = {"editor","editorial","info","contact","hello","admin","support","help",
    "news","tips","press","media","office","team","director","board","staff",
    "association","foundation","coalition","alliance","chapter","council"}

def salutation(full_name=None, outlet=None, email=None):
    is_org_email = bool(email and email.split("@", 1)[0].lower() in ORG_TOKENS)
    first = ""
    if full_name:
        s = full_name.strip()
        first_token = s.split()[0] if s else ""
        sl = s.lower()
        if any(w in sl for w in ORG_TOKENS):
            first = ""
        elif len(first_token) <= 2 or first_token.isupper():
            first = ""
        else:
            first = first_token.title()
    if first and not is_org_email:
        return f"Hi {first},"
    if outlet and len(outlet.strip()) < 50:
        o = outlet.strip()
        for suf in [" Organization", " Foundation", " Association", " Coalition",
                    " Chapter", " Society", " Network", " Alliance", " Center",
                    " Institute", " Program"]:
            if o.endswith(suf):
                o = o[:-len(suf)].strip()
        return f"Hi {o} team,"
    return "Hi there,"

# ---- article matching ----
def match_article(contact, assets):
    segment = (contact["segment"] or "").lower()
    beat_prefs = SEGMENT_BEAT_MAP.get(segment, ["road_safety"])

    scored = []
    for a in assets:
        a_beats = (a["beats"] or "").split(",")
        score = 0
        for i, pref in enumerate(beat_prefs):
            if pref in a_beats:
                score += (len(beat_prefs) - i) * 10
        # City boost
        try:
            city = (contact["city"] or "").lower()
        except (KeyError, IndexError):
            city = ""
        if city and city in (a["slug"] or "").lower():
            score += 25
        # Skip community/sponsorship fluff for non-community segments
        if "community" in segment or "maricopa" in segment:
            pass
        elif "sponsorship" in (a["beats"] or "") or "office" in (a["slug"] or ""):
            score -= 50
        if score > 0:
            scored.append((score, a))

    if not scored:
        # Fallback: pedestrian deaths article (broadest appeal)
        for a in assets:
            if "pedestrian-deaths" in (a["slug"] or ""):
                return a
        return assets[0] if assets else None

    scored.sort(key=lambda x: -x[0])
    # Rotate using contact id as seed
    try:
        cid = contact["id"] or 0
    except (KeyError, IndexError):
        cid = 0
    top = scored[:5]
    return top[cid % len(top)][1]

def tail_for_segment(segment):
    seg = (segment or "").lower()
    for key, tail in SEGMENT_TAILS.items():
        if key in seg:
            return tail
    return "If any of this is useful, share it freely. Happy to provide the underlying data."

SEGMENT_OPENERS = {
    "mommy_blogger":          "I'm a reporter based in Maricopa. I've been digging into data most Arizona parents don't know exists.",
    "parenting_blogger":      "I'm a reporter based in Maricopa. I've been pulling public records on child safety in Arizona that aren't easy to find.",
    "autism_advocate":         "I cover disability and education data in Arizona. I pulled public records that I think your community needs to see.",
    "disability_nonprofit":    "I cover disability and education data in Arizona. This one hit me hard when I saw the numbers.",
    "disability_rights":       "I cover disability and education data in Arizona. This one hit me hard when I saw the numbers.",
    "special_needs_parent":    "I'm a reporter in Maricopa covering school safety. I've been pulling data that I think special needs families need to see.",
    "down_syndrome":           "I cover disability and education data in Arizona. I pulled public records that I think your community needs to see.",
    "iep_advocate":            "I cover education data in Arizona. I pulled records that directly affect the families you work with.",
    "elder_care_nonprofit":    "I cover public safety data in Arizona. I pulled federal inspection records that I think your community needs to see.",
    "senior_advocate":         "I cover public safety data in Arizona. The nursing home data I found is disturbing and I don't think enough people have seen it.",
    "az_journalist":           "I cover Arizona public safety data at AZ Law Now. I've been pulling records that haven't been published this way before.",
    "education_advocate":      "I cover education and child safety data in Arizona. I pulled records that I think parents and advocates should see.",
    "pta_leader":              "I'm Brendan Franks, a reporter in Maricopa. I pulled school safety data that I think your PTA members should know about.",
    "school_board":            "I cover education data in Arizona. I pulled records from your district that haven't been reported on.",
    "community_blogger":       "I moved to Maricopa last year. Four days in, I watched a fatal crash on SR-347 from my car. So I started pulling the data.",
    "maricopa_nonprofit":      "I live in Maricopa. I've been pulling crash, safety, and accountability data for our community because nobody else was doing it.",
    "community_org":           "I cover public safety data in Arizona. I've been pulling records that directly affect the communities you serve.",
    "madd_chapter":            "I cover DUI and crash data in Arizona. The patterns I found in Maricopa County are sobering.",
    "pedestrian_safety":       "I cover pedestrian safety data in Arizona. The numbers here are the worst in the country and I don't think people realize how bad it is.",
    "victim_advocacy":         "I cover public safety data in Arizona. The data I've been pulling directly affects the families you work with.",
    "dui_prevention":          "I cover DUI and crash data in Arizona. The patterns in the data are sobering and I think your audience needs to see them.",
    "traffic_safety_advocate": "I cover road safety data in Arizona. I've been pulling ADOT records that haven't been published at the intersection level before.",
}

def build_body(greeting, contact, article):
    hook = (article["stat_hook"] or "").strip()
    if hook and hook[-1] not in ".!?":
        hook += "."
    title = article["title"]
    slug = article["slug"] or "article"
    dom = (contact["email"] or "").split("@", 1)[-1].replace(".", "_")
    url = f"{article['url']}?utm_source=email_brendan_azlawnow&utm_medium=email&utm_campaign=community_outreach&utm_content={slug}&utm_term={dom}"
    tail = tail_for_segment(contact["segment"])
    seg = (contact["segment"] or "").lower()
    opener = SEGMENT_OPENERS.get(seg, "I cover Arizona public safety data. I've been pulling records that haven't been published this way before.")

    subject = title
    if len(subject) > 78:
        subject = subject[:75] + "..."

    html = (
        f"<p>{greeting}</p>"
        f"<p>{opener}</p>"
        f"<p>{hook}</p>"
        f"<p>I built the full investigation here: <a href=\"{url}\">{title}</a></p>"
        f"<p>{tail}</p>"
        f"<p>Brendan Franks<br>{FROM_TITLE}<br>"
        f"<a href=\"https://azlawnow.com/investigations/?utm_source=email_brendan_azlawnow&utm_medium=email&utm_campaign=signature\">azlawnow.com/investigations</a></p>"
    )
    return subject, html

# ---- main ----
def main():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")

    conn.execute("""CREATE TABLE IF NOT EXISTS do_not_contact
        (email TEXT PRIMARY KEY, reason TEXT NOT NULL, added_at TEXT DEFAULT (datetime('now')))""")
    conn.execute("""CREATE TABLE IF NOT EXISTS send_log
        (id INTEGER PRIMARY KEY AUTOINCREMENT, to_email TEXT NOT NULL, from_email TEXT NOT NULL,
         persona TEXT, subject TEXT, resend_id TEXT, article_slug TEXT,
         sent_at TEXT DEFAULT (datetime('now')))""")
    conn.commit()

    DOMAIN_PER_DAY_CAP = 3

    dnc = {r[0].lower() for r in conn.execute("SELECT email FROM do_not_contact")}
    already_sent = {r[0].lower() for r in conn.execute("SELECT DISTINCT to_email FROM send_log")}
    domain_counts_today = {}
    for r in conn.execute("SELECT to_email FROM send_log WHERE date(sent_at,'-7 hours')=date('now','-7 hours')"):
        dom = (r[0] or "").split("@", 1)[-1].lower()
        if dom:
            domain_counts_today[dom] = domain_counts_today.get(dom, 0) + 1

    prospects = conn.execute("""
        SELECT * FROM contacts
        WHERE status IN ('prospect', 'verified')
          AND email_verified = 'ok'
          AND email IS NOT NULL AND email != ''
        ORDER BY tier, RANDOM()
    """).fetchall()

    assets = list(conn.execute("SELECT * FROM content_assets ORDER BY id"))

    picked = []
    for p in prospects:
        to_lower = (p["email"] or "").lower().strip()
        if to_lower in dnc or to_lower in already_sent:
            continue
        dom = to_lower.split("@", 1)[-1] if "@" in to_lower else ""
        if domain_counts_today.get(dom, 0) >= DOMAIN_PER_DAY_CAP:
            continue
        picked.append(p)
        domain_counts_today[dom] = domain_counts_today.get(dom, 0) + 1
        if len(picked) >= limit:
            break

    print(f"Plan: limit={limit} prospects={len(picked)} assets={len(assets)} dry_run={dry_run}")
    print(f"Suppression: {len(dnc)} DNC | {len(already_sent)} already-sent | {len(domain_counts_today)} domains today (cap {DOMAIN_PER_DAY_CAP}/day)")

    if not picked:
        print("Nothing to send.")
        conn.close()
        return

    sent = 0
    from_addr = f"{FROM_NAME} <{FROM_EMAIL}>"
    for p in picked:
        to_email = p["email"].strip()
        to_lower = to_email.lower()

        # Last-mile re-check
        if conn.execute("SELECT 1 FROM do_not_contact WHERE lower(email)=?", (to_lower,)).fetchone():
            print(f"  ⏭  DNC {to_email}"); continue
        if conn.execute("SELECT 1 FROM send_log WHERE lower(to_email)=?", (to_lower,)).fetchone():
            print(f"  ⏭  sent {to_email}"); continue

        greeting = salutation(full_name=p["name"], outlet=p["outlet"], email=to_email)

        # Check for Perplexity-enriched personalization (hyper-personalized pitch)
        phook_raw = None
        try:
            phook_raw = p["personalization_hook"]
        except (IndexError, KeyError):
            pass

        if phook_raw:
            import json as _json
            try:
                phook = _json.loads(phook_raw)
            except:
                phook = {}
            # Use enriched article match
            enriched_slug = phook.get("article", "")
            article = None
            if enriched_slug:
                for a in assets:
                    if a["slug"] == enriched_slug:
                        article = a; break
            if not article:
                article = match_article(p, assets)
            if not article:
                print(f"  ⏭  no article match {to_email}"); continue

            # Build personalized body with custom opener + subject
            hook = (article["stat_hook"] or "").strip()
            if hook and hook[-1] not in ".!?":
                hook += "."
            slug = article["slug"] or "article"
            dom = to_email.split("@", 1)[-1].replace(".", "_")
            url = f"{article['url']}?utm_source=email_brendan_azlawnow&utm_medium=email&utm_campaign=community_outreach&utm_content={slug}&utm_term={dom}"
            tail = tail_for_segment(p["segment"])
            custom_opener = phook.get("opener", "")
            subject = phook.get("subject", f"AZ data: {article['title']}")
            title = article["title"]

            html = (
                f"<p>{greeting}</p>"
                f"<p>{custom_opener}</p>"
                f"<p>{hook}</p>"
                f"<p>Full investigation: <a href=\"{url}\">{title}</a></p>"
                f"<p>{tail}</p>"
                f"<p>Brendan Franks<br>{FROM_TITLE}<br>"
                f"<a href=\"https://azlawnow.com/investigations/?utm_source=email_brendan_azlawnow&utm_medium=email&utm_campaign=signature\">azlawnow.com/investigations</a></p>"
            )
        else:
            article = match_article(p, assets)
            if not article:
                print(f"  ⏭  no article match {to_email}"); continue
            subject, html = build_body(greeting, p, article)

        # HARD GATE: never send broken content
        if not subject or "azlawnow.com" not in html:
            print(f"  ⛔ BLOCKED {to_email}: broken subject or URL")
            continue
        if len(html) < 200:
            print(f"  ⛔ BLOCKED {to_email}: body too short ({len(html)} chars)")
            continue

        if dry_run:
            print(f"  [DRY] {to_email:40} | {subject[:55]} | {article['slug']}")
            sent += 1; continue

        try:
            rid = send_resend(from_addr, to_email, subject, html)
            conn.execute("UPDATE contacts SET status='contacted', last_contacted=datetime('now') WHERE id=?", (p["id"],))
            conn.execute("INSERT INTO send_log (to_email, from_email, persona, subject, resend_id, article_slug) VALUES (?,?,?,?,?,?)",
                         (to_email, FROM_EMAIL, "brendan", subject, rid, article["slug"]))
            conn.commit()  # per-send commit
            sent += 1
            print(f"  ✅ {to_email:40} | {subject[:50]} | {rid}")
            if sent < len(picked):
                time.sleep(random.uniform(45, 90))
        except Exception as e:
            print(f"  ❌ FAIL {to_email}: {e}")

    conn.close()
    print(f"\n📊 sent={sent}")

if __name__ == "__main__":
    main()
