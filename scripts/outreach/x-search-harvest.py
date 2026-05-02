#!/usr/bin/env python3
"""Harvest X handles from recent AZ-relevant tweets.

Uses /2/tweets/search/recent to find tweets matching AZ-keyword filters,
extracts @author and @mentions from each tweet, verifies each handle via
/2/users/by/username, and adds new ones to x-follow-status.json as candidates.

Hard caps to stay safe:
- 8 search queries max per run
- Up to 100 tweets per query (max for free tier)
- 1.0s sleep between API calls
- Each new handle goes through /by/username verification before being marked
  as candidate (catches deleted / suspended accounts).

Usage:
  python3 scripts/outreach/x-search-harvest.py            # full run, write to status
  python3 scripts/outreach/x-search-harvest.py --dry-run  # search only, don't verify
"""
import os
import sys
import json
import time
import re
import hmac
import base64
import hashlib
import secrets
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

STATUS_FILE = Path(os.path.expanduser("~/Projects/azlawnow/data/outreach/x/x-follow-status.json"))


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

CK = os.environ.get("X_AZLAW_API_KEY")
CS = os.environ.get("X_AZLAW_API_SECRET")
AT = os.environ.get("X_AZLAW_ACCESS_TOKEN")
TS = os.environ.get("X_AZLAW_ACCESS_TOKEN_SECRET")
if not all([CK, CS, AT, TS]):
    sys.stderr.write("ERROR: X_AZLAW_* OAuth creds missing\n")
    sys.exit(2)


def pe(s):
    return urllib.parse.quote(str(s), safe="")


def oauth_header(method, url, params=None):
    """OAuth 1.0a with optional URL query params (must be included in signature base string)."""
    op = {
        "oauth_consumer_key": CK,
        "oauth_nonce": secrets.token_hex(16),
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": str(int(time.time())),
        "oauth_token": AT,
        "oauth_version": "1.0",
    }
    all_params = {**op, **(params or {})}
    base_qs = "&".join(f"{pe(k)}={pe(all_params[k])}" for k in sorted(all_params))
    sig_base = f"{method.upper()}&{pe(url)}&{pe(base_qs)}"
    sig_key = f"{pe(CS)}&{pe(TS)}"
    sig = base64.b64encode(hmac.new(sig_key.encode(), sig_base.encode(), hashlib.sha1).digest()).decode()
    op["oauth_signature"] = sig
    return "OAuth " + ", ".join(f'{pe(k)}="{pe(op[k])}"' for k in sorted(op))


def http_get(url, params=None):
    full_url = url
    if params:
        full_url = f"{url}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(full_url, headers={"Authorization": oauth_header("GET", url, params)})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read().decode())
        except Exception:
            body = {"error": str(e), "status": e.code}
        return e.code, body


# AZ-relevant search queries. Each runs once.
QUERIES = [
    "(\"Kris Mayes\" OR \"AG Mayes\" OR \"Arizona Attorney General\") -is:retweet -is:reply lang:en",
    "(\"Arizona\" OR \"AZ\") (lawsuit OR ruling OR \"public records\" OR investigation) (charter OR education OR school) -is:retweet -is:reply lang:en",
    "(\"Arizona\" OR \"AZ\") (opioid OR pharmacy OR \"controlled substance\" OR DEA) -is:retweet -is:reply lang:en",
    "(\"Arizona\" OR \"AZ\") (\"nursing home\" OR \"elder abuse\" OR \"long-term care\" OR HB2228) -is:retweet -is:reply lang:en",
    "(\"Arizona\" OR \"AZ\") (\"ICE detention\" OR Surprise OR Florence OR \"asylum seeker\") -is:retweet -is:reply lang:en",
    "(\"Arizona\" OR \"AZ\") (pedestrian OR bicyclist OR \"hit and run\" OR ADOT OR \"road safety\") -is:retweet -is:reply lang:en",
    "(\"Arizona\" OR \"AZ\") (daycare OR \"child care\" OR DHS) -is:retweet -is:reply lang:en",
    "(\"Arizona\" OR \"AZ\") (\"public records request\" OR ARS OR \"open records\" OR \"sunshine law\") -is:retweet -is:reply lang:en",
]

EXCLUDE_HANDLES = {"azlawnow"}  # don't follow ourselves


def search_recent(query, max_results=100):
    url = "https://api.x.com/2/tweets/search/recent"
    params = {
        "query": query,
        "max_results": str(min(max_results, 100)),
        "tweet.fields": "author_id,entities,created_at",
        "expansions": "author_id",
        "user.fields": "username,name,description",
    }
    return http_get(url, params)


def verify_user(handle):
    url = f"https://api.x.com/2/users/by/username/{handle}"
    return http_get(url)


def main():
    dry = "--dry-run" in sys.argv

    # Load existing status
    if STATUS_FILE.exists():
        status = json.loads(STATUS_FILE.read_text())
    else:
        status = {}

    seen_handles = {v.get("handle", "").lower() for v in status.values() if v.get("handle")}

    print("=== X recent-search harvest ===")
    print(f"Mode: {'DRY-RUN' if dry else 'WRITE to status'}")
    print(f"Queries: {len(QUERIES)} | Already-known handles: {len(seen_handles)}")
    print()

    discovered = {}  # handle (lowercase) -> {handle, name, source_query, mentioned_in_tweet, etc}
    blocked_by_api = False

    for q_i, query in enumerate(QUERIES, 1):
        print(f"[{q_i}/{len(QUERIES)}] query: {query[:80]}")
        code, data = search_recent(query)
        if code == 401:
            print(f"  ✗ 401 — recent-search not available on this X tier. Aborting.")
            blocked_by_api = True
            break
        if code == 429:
            print(f"  ✗ 429 — rate limited. Stopping.")
            break
        if code != 200:
            print(f"  ✗ {code}: {json.dumps(data)[:200]}")
            time.sleep(2)
            continue

        users = {u["id"]: u for u in (data.get("includes", {}).get("users", []))}
        tweets = data.get("data", []) or []
        print(f"  ✓ {len(tweets)} tweets, {len(users)} authors")

        for t in tweets:
            # Author
            author = users.get(t.get("author_id"))
            if author:
                h = author["username"]
                lh = h.lower()
                if lh not in EXCLUDE_HANDLES and lh not in seen_handles and lh not in discovered:
                    discovered[lh] = {
                        "handle": h,
                        "user_id": author["id"],
                        "name": author.get("name", ""),
                        "description": (author.get("description") or "")[:140],
                        "source_query": query[:80],
                        "discovery": "tweet_author",
                    }

            # @mentions in tweet entities
            ents = t.get("entities") or {}
            for m in (ents.get("mentions") or []):
                h = m.get("username", "")
                if not h:
                    continue
                lh = h.lower()
                if lh in EXCLUDE_HANDLES or lh in seen_handles or lh in discovered:
                    continue
                discovered[lh] = {
                    "handle": h,
                    "user_id": m.get("id"),
                    "name": "",
                    "description": "",
                    "source_query": query[:80],
                    "discovery": "mention",
                }

        time.sleep(1.5)

    if blocked_by_api:
        print()
        print("Search endpoint not available. Recent-search requires Pro tier on X API.")
        print("Falling back: nothing to add. Use scripts/outreach/x-seed-curated.py for curated growth.")
        return

    print()
    print(f"=== Discovery summary ===")
    print(f"New handles discovered: {len(discovered)}")
    if dry:
        for lh, info in list(discovered.items())[:25]:
            print(f"  @{info['handle']:30s} {info['name'][:40]}")
        return

    # Verify each via /by/username (gets us follower count, name, profile, last-active)
    # NOTE: we already have user_id from search, but a fresh /by/username confirms account exists right now
    #       and filters out suspended/deleted between search-time and follow-time.
    print()
    print("Verifying discovered handles (this also enriches with display name)...")
    added = 0
    skipped = 0
    for i, (lh, info) in enumerate(discovered.items(), 1):
        if i > 60:  # don't burn rate budget on huge harvests
            print(f"  Cap hit at 60 verifications this run.")
            break
        code, data = verify_user(info["handle"])
        if code == 429:
            print(f"  rate-limited at #{i}, stopping verify")
            break
        if code != 200:
            skipped += 1
            time.sleep(0.7)
            continue
        u = data.get("data", {})
        if not u.get("id"):
            skipped += 1
            time.sleep(0.7)
            continue
        key = f"x-search:{u['username'].lower()}|{info['discovery']}"
        if key in status:
            skipped += 1
            time.sleep(0.7)
            continue
        status[key] = {
            "status": "candidate",
            "handle": u["username"],
            "user_id": u["id"],
            "display_name": u.get("name", ""),
            "discovery": info["discovery"],
            "source_query": info["source_query"],
            "source": "x_search",
            "verified_at": datetime.now().isoformat(),
        }
        added += 1
        STATUS_FILE.write_text(json.dumps(status, indent=2))
        if i <= 25:
            print(f"  [{i}] @{u['username']:25s} ✓ {u.get('name','')[:35]}")
        time.sleep(0.7)

    print()
    print(f"Added new candidates: {added} | Skipped (404/dup): {skipped}")
    candidates_total = sum(1 for v in status.values() if v.get("status") == "candidate")
    print(f"Active candidates total: {candidates_total}")


if __name__ == "__main__":
    main()
