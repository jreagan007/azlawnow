#!/usr/bin/env python3
"""Execute X follows for AZ Law Now @azlawnow account.

Reads candidate handles from data/outreach/x/x-follow-status.json (entries with
status="candidate"), looks up each handle's user_id via /2/users/by/username/{},
then POSTs to /2/users/{source_id}/following to follow.

Hard safety rails:
- Verifies @azlawnow identity via /users/me before any follow.
- Hard cap: --limit N (default 25, max 50/day per X spam thresholds).
- 35s delay between follows (under 2/min, well below spam-detection floor).
- Dry-run mode prints handles + lookup but does not POST follows.
- Per-follow status updates to x-follow-status.json so reruns skip done.

Usage:
  python3 scripts/outreach/x-follow-execute.py --dry-run [--limit N]
  python3 scripts/outreach/x-follow-execute.py --live --limit 25
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
from pathlib import Path
from datetime import datetime

STATUS_FILE = Path(os.path.expanduser("~/Projects/azlawnow/data/outreach/x/x-follow-status.json"))
LOG_FILE = Path(os.path.expanduser("~/Projects/azlawnow/data/outreach/x/x-follow-execute.log"))

EXPECTED_USERNAME = "azlawnow"
EXPECTED_USER_ID = "2042351967956013056"
HARD_DAILY_CAP = 50
DEFAULT_LIMIT = 25
DELAY_SECONDS = 35


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
    sys.stderr.write("ERROR: X_AZLAW_* OAuth creds missing in env\n")
    sys.exit(2)


def pe(s):
    return urllib.parse.quote(str(s), safe="")


def oauth_header(method, url, params=None):
    params = params or {}
    op = {
        "oauth_consumer_key": CK,
        "oauth_nonce": secrets.token_hex(16),
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": str(int(time.time())),
        "oauth_token": AT,
        "oauth_version": "1.0",
    }
    all_params = {**op, **params}
    base_qs = "&".join(f"{pe(k)}={pe(all_params[k])}" for k in sorted(all_params))
    sig_base = f"{method.upper()}&{pe(url)}&{pe(base_qs)}"
    sig_key = f"{pe(CS)}&{pe(TS)}"
    sig = base64.b64encode(hmac.new(sig_key.encode(), sig_base.encode(), hashlib.sha1).digest()).decode()
    op["oauth_signature"] = sig
    return "OAuth " + ", ".join(f'{pe(k)}="{pe(op[k])}"' for k in sorted(op))


def http_get(url):
    req = urllib.request.Request(url, headers={"Authorization": oauth_header("GET", url)})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read().decode())
        except Exception:
            body = {"error": str(e)}
        return e.code, body


def http_post(url, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers={
        "Authorization": oauth_header("POST", url),
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read().decode())
        except Exception:
            body = {"error": str(e)}
        return e.code, body


def verify_identity():
    code, data = http_get("https://api.x.com/2/users/me")
    if code != 200:
        sys.stderr.write(f"FATAL: /users/me returned {code}: {json.dumps(data)[:300]}\n")
        sys.exit(3)
    u = data.get("data", {})
    if u.get("username", "").lower() != EXPECTED_USERNAME or u.get("id") != EXPECTED_USER_ID:
        sys.stderr.write(f"FATAL: identity mismatch: got @{u.get('username')} (id {u.get('id')}), expected @{EXPECTED_USERNAME} (id {EXPECTED_USER_ID})\n")
        sys.exit(3)
    print(f"✓ Identity verified: @{u['username']} (id {u['id']})")


def lookup_user_id(handle):
    url = f"https://api.x.com/2/users/by/username/{handle}"
    code, data = http_get(url)
    if code != 200:
        return None, data
    return data.get("data", {}).get("id"), data


def follow(target_id):
    url = f"https://api.x.com/2/users/{EXPECTED_USER_ID}/following"
    return http_post(url, {"target_user_id": target_id})


def parse_args():
    args = sys.argv[1:]
    dry = "--dry-run" in args
    live = "--live" in args
    limit = DEFAULT_LIMIT
    for i, a in enumerate(args):
        if a == "--limit" and i + 1 < len(args):
            limit = int(args[i + 1])
    if not dry and not live:
        sys.stderr.write("ERROR: must pass --dry-run or --live\n")
        sys.exit(1)
    if limit > HARD_DAILY_CAP:
        sys.stderr.write(f"ERROR: --limit {limit} exceeds HARD_DAILY_CAP {HARD_DAILY_CAP}\n")
        sys.exit(1)
    return dry, limit


def append_log(line):
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a") as f:
        f.write(f"{datetime.now().isoformat()} {line}\n")


def main():
    dry, limit = parse_args()
    if not STATUS_FILE.exists():
        sys.stderr.write(f"ERROR: status file not found: {STATUS_FILE}. Run x-follow-targets.py first.\n")
        sys.exit(1)

    status = json.loads(STATUS_FILE.read_text())
    todo = [(k, v) for k, v in status.items() if v.get("status") == "candidate" and v.get("handle")]
    todo.sort(key=lambda x: x[1].get("found_at", ""))
    todo = todo[:limit]

    if not todo:
        print("No candidate handles to follow.")
        return

    print(f"=== AZ Law Now X follow execution ===")
    print(f"Mode: {'DRY-RUN' if dry else 'LIVE'} | Candidates queued: {len(todo)} | Cap: {limit}")
    print()

    verify_identity()
    print()

    followed = 0
    failed = 0
    skipped = 0

    for i, (key, entry) in enumerate(todo, 1):
        handle = entry["handle"]
        print(f"[{i}/{len(todo)}] @{handle} ({key.split('|')[0]})")

        target_id, lookup = lookup_user_id(handle)
        if not target_id:
            err = lookup.get("errors", [{}])[0].get("detail") or lookup.get("title", "lookup failed")
            print(f"  SKIP: {err}")
            status[key]["status"] = "no_user_id"
            status[key]["error"] = err[:200]
            STATUS_FILE.write_text(json.dumps(status, indent=2))
            append_log(f"SKIP @{handle}: {err}")
            skipped += 1
            continue

        if dry:
            print(f"  [dry-run] would follow target_id={target_id}")
            followed += 1
            time.sleep(0.5)
            continue

        code, resp = follow(target_id)
        if code in (200, 201):
            data = resp.get("data", {})
            ok = data.get("following", False)
            print(f"  ✓ followed (target_id={target_id}, following={ok})")
            status[key]["status"] = "followed"
            status[key]["target_id"] = target_id
            status[key]["followed_at"] = datetime.now().isoformat()
            STATUS_FILE.write_text(json.dumps(status, indent=2))
            append_log(f"FOLLOW @{handle} target_id={target_id}")
            followed += 1
        else:
            err = resp.get("errors", [{}])[0].get("detail") or resp.get("title") or str(resp)[:200]
            print(f"  ✗ FAIL ({code}): {err}")
            status[key]["status"] = "follow_failed"
            status[key]["error"] = err[:300]
            status[key]["error_code"] = code
            STATUS_FILE.write_text(json.dumps(status, indent=2))
            append_log(f"FAIL @{handle} ({code}): {err}")
            failed += 1
            if code == 429:
                print("  Rate-limit hit. Stopping.")
                break

        if i < len(todo):
            time.sleep(DELAY_SECONDS)

    print()
    print(f"=== Summary ===")
    print(f"{'Would follow' if dry else 'Followed'}: {followed} | Skipped: {skipped} | Failed: {failed}")


if __name__ == "__main__":
    main()
