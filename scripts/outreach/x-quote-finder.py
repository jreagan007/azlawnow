#!/usr/bin/env python3
"""Find recent tweets from accounts @azlawnow follows that match our beats.

Pulls each followed account's last 10 tweets via /2/users/{id}/tweets,
filters for keywords matching our published investigations, and prints
candidate quote-tweet targets with suggested quote-tweet drafts.

Output is a markdown brief for manual review. We do NOT auto-quote-tweet
because (a) X spam-detection on rapid quote-tweets is harsh, (b) every
quote-tweet should add real editorial value (not auto-spam), and (c) the
target's tweet might be tone-deaf to quote.

Usage:
  python3 scripts/outreach/x-quote-finder.py [--hours 48]
"""
import os
import sys
import json
import time
import hmac
import base64
import hashlib
import secrets
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

STATUS_FILE = Path(os.path.expanduser("~/Projects/azlawnow/data/outreach/x/x-follow-status.json"))
OUT_DIR = Path(os.path.expanduser("~/Projects/azlawnow/data/outreach/x"))
USER_ID = "2042351967956013056"


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

CK = os.environ['X_AZLAW_API_KEY']
CS = os.environ['X_AZLAW_API_SECRET']
AT = os.environ['X_AZLAW_ACCESS_TOKEN']
TS = os.environ['X_AZLAW_ACCESS_TOKEN_SECRET']


def pe(s):
    return urllib.parse.quote(str(s), safe="")


def oauth(method, url, params=None):
    op = {
        "oauth_consumer_key": CK,
        "oauth_nonce": secrets.token_hex(16),
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": str(int(time.time())),
        "oauth_token": AT,
        "oauth_version": "1.0",
    }
    all_p = {**op, **(params or {})}
    bq = "&".join(f"{pe(k)}={pe(all_p[k])}" for k in sorted(all_p))
    sb = f"{method.upper()}&{pe(url)}&{pe(bq)}"
    sig = base64.b64encode(hmac.new(f"{pe(CS)}&{pe(TS)}".encode(), sb.encode(), hashlib.sha1).digest()).decode()
    op["oauth_signature"] = sig
    return "OAuth " + ", ".join(f'{pe(k)}="{pe(op[k])}"' for k in sorted(op))


def http_get(url, params=None):
    full = url + ("?" + urllib.parse.urlencode(params) if params else "")
    req = urllib.request.Request(full, headers={"Authorization": oauth("GET", url, params)})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read().decode())
        except Exception:
            body = {"error": str(e)}
        return e.code, body


# Map of beat keywords to which of our investigations the quote should link to
BEATS = {
    "asu-prep-related-party-lease": ["asu prep", "charter school", "education finance", "990", "esa voucher"],
    "walgreens-350m-arizona-opioid-stores": ["opioid", "walgreens", "pharmacy", "fentanyl", "overdose", "controlled substance", "doj settlement", "walgreens settlement"],
    "arizona-mayes-ice-surprise-detention-lawsuit": ["surprise", "ice detention", "rinchem", "nepa", "1,500-bed", "mass detention", "homan", "lyons", "mullin"],
    "arizona-pedestrian-deaths-road-design": ["pedestrian", "vision zero", "road safety", "fhwa", "complete streets", "bike lane", "crosswalk"],
    "arizona-schools-merv-13-filter-bypass": ["merv", "iaq", "school air", "ashrae", "pm2.5", "indoor air quality"],
    "arizona-325-educator-discipline-2024": ["educator misconduct", "teacher discipline", "ars 15-514", "school board of education", "sexual misconduct"],
    "arizona-school-restraint-data": ["school restraint", "seclusion", "iep", "504 plan", "ars 15-105", "disability rights"],
    "arizona-career-schools-37-adverse-actions": ["career school", "private postsecondary", "for-profit", "title iv", "corinthian", "esser deadline"],
    "grand-court-mesa-elder-abuse-hb2228": ["elder abuse", "nursing home", "hb2228", "long-term care", "dementia", "grand court"],
    "arizona-daycare-violations": ["daycare", "child care", "azdhs licensing", "in-home daycare", "coolidge daycare"],
    "tempe-asu-pavement-180-day-claim-clock": ["tempe pavement", "abor", "notice of claim", "180-day", "ars 12-821", "asu bike"],
    "buckeye-durango-yuma-roundabout-rejected": ["buckeye intersection", "durango", "yuma road", "roundabout", "fhwa countermeasure"],
    "aps-korman-heat-disconnect-7m-settlement": ["aps", "heat disconnect", "korman", "95-degree", "consumer fraud", "utility shutoff"],
}

URL_BASE = "https://azlawnow.com/investigations"


def match_story(text):
    text = text.lower()
    matches = []
    for slug, kws in BEATS.items():
        for kw in kws:
            if kw in text:
                matches.append((slug, kw))
                break
    return matches


def main():
    hours = 48
    for i, a in enumerate(sys.argv):
        if a == "--hours" and i + 1 < len(sys.argv):
            hours = int(sys.argv[i + 1])

    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    cutoff_iso = cutoff.isoformat()

    # Get list of accounts we follow
    print(f"=== X quote-tweet finder ===")
    print(f"Looking back {hours} hours (since {cutoff_iso})")
    print()

    # Pull /following list, paginate
    followed = []
    next_token = None
    page = 0
    while True:
        page += 1
        params = {"max_results": "100", "user.fields": "username,name"}
        if next_token:
            params["pagination_token"] = next_token
        code, data = http_get(f"https://api.x.com/2/users/{USER_ID}/following", params)
        if code != 200:
            print(f"following list err {code}: {json.dumps(data)[:200]}")
            break
        for u in data.get("data", []):
            followed.append(u)
        next_token = data.get("meta", {}).get("next_token")
        if not next_token or page >= 3:
            break
        time.sleep(1)

    print(f"Following: {len(followed)} accounts. Scanning recent tweets...")
    print()

    candidates = []
    scanned = 0
    rate_limited = False

    for u in followed:
        scanned += 1
        if scanned > 60:  # rate-limit protection
            print(f"Cap hit at {scanned} scans. Re-run with subset for more.")
            break
        url = f"https://api.x.com/2/users/{u['id']}/tweets"
        params = {
            "max_results": "10",
            "tweet.fields": "created_at,public_metrics,text",
            "exclude": "retweets,replies",
        }
        code, data = http_get(url, params)
        if code == 429:
            print(f"  rate-limited at @{u['username']}, stopping")
            rate_limited = True
            break
        if code != 200:
            time.sleep(0.5)
            continue
        for t in data.get("data", []) or []:
            if t.get("created_at", "") < cutoff_iso:
                continue
            text = t.get("text", "")
            matches = match_story(text)
            if not matches:
                continue
            slug, kw = matches[0]
            pm = t.get("public_metrics", {})
            candidates.append({
                "tweet_id": t["id"],
                "tweet_url": f"https://x.com/{u['username']}/status/{t['id']}",
                "author_handle": u["username"],
                "author_name": u.get("name", ""),
                "text": text[:280],
                "created_at": t.get("created_at", ""),
                "matched_slug": slug,
                "matched_keyword": kw,
                "story_url": f"{URL_BASE}/{slug}/",
                "metrics": pm,
            })
        time.sleep(1.0)

    print(f"Scanned {scanned} accounts. Found {len(candidates)} candidate tweets.")
    print()

    if not candidates:
        print("No matches in the window. Re-run with --hours 168 for a full week.")
        return

    # Sort by metrics.like_count desc so the best engagement candidates surface first
    candidates.sort(key=lambda c: c.get("metrics", {}).get("like_count", 0), reverse=True)

    today = datetime.now().strftime("%Y-%m-%d-%H%M")
    out_path = OUT_DIR / f"quote-candidates-{today}.md"
    md = [
        f"# AZ Law Now quote-tweet candidates, {today}",
        f"Window: last {hours} hours. Scanned {scanned} accounts. {len(candidates)} matches.",
        "",
        "Manual review pattern:",
        "1. Read each tweet. Tone-check (skip if angry political dunk; we want substantive AZ news).",
        "2. Draft quote-tweet that ADDS our angle. Lead with our number. Link the story in the quote text (not a reply).",
        "3. Voice rules: contractions, no em-dashes, no banned words, lead with named entity or number.",
        "4. Post via x.com manual quote OR build a one-shot poster.",
        "",
        "---",
        "",
    ]
    for c in candidates:
        pm = c["metrics"]
        md.append(f"## @{c['author_handle']} ({c['author_name']})")
        md.append(f"**Posted:** {c['created_at'][:19]}")
        md.append(f"**Engagement:** {pm.get('like_count',0)} likes, {pm.get('retweet_count',0)} RTs, {pm.get('reply_count',0)} replies, {pm.get('impression_count',0)} impressions")
        md.append(f"**Tweet:** {c['tweet_url']}")
        md.append("")
        md.append(f"> {c['text']}")
        md.append("")
        md.append(f"**Matches:** `{c['matched_slug']}` (keyword: `{c['matched_keyword']}`)")
        md.append(f"**Our story to link:** {c['story_url']}")
        md.append("")
        md.append("**Suggested quote-tweet draft:**")
        md.append("(write your own, this is a placeholder)")
        md.append("```")
        md.append(f"[Lead with our data point]. {c['story_url']}")
        md.append("```")
        md.append("")
        md.append("---")
        md.append("")

    if rate_limited:
        md.append("\n_Note: rate-limited mid-scan, re-run later for full coverage._")

    out_path.write_text("\n".join(md))
    print(f"✓ Wrote {out_path} with {len(candidates)} candidates.")


if __name__ == "__main__":
    main()
