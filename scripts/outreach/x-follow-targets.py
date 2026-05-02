#!/usr/bin/env python3
"""Build a recommended-follow list of X handles for AZ Law Now's Brendan persona.

Reads all per-story targets files, infers X handles via Perplexity for each
named journalist or advocate, writes a markdown list of recommended follows.
Does NOT auto-follow (follow rate-limit and spam detection require careful
pacing). Jared does the actual follows from the @azlawnow account.

Tracks state in x-follow-status.json so we don't re-recommend handles already
followed or skipped.

Usage:
  python3 scripts/outreach/x-follow-targets.py [--limit N]
"""
import os
import sys
import json
import re
import time
import subprocess
from datetime import datetime
from pathlib import Path

TARGETS_DIR = Path(os.path.expanduser("~/Projects/azlawnow/data/outreach/targets"))
OUT_DIR = Path(os.path.expanduser("~/Projects/azlawnow/data/outreach/x"))
OUT_DIR.mkdir(parents=True, exist_ok=True)
STATUS_FILE = OUT_DIR / "x-follow-status.json"


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

PPLX_KEY = os.environ.get("PERPLEXITY_API_KEY")
if not PPLX_KEY:
    sys.stderr.write("ERROR: PERPLEXITY_API_KEY not set\n")
    sys.exit(2)

HANDLE_RE = re.compile(r"@?([A-Za-z0-9_]{1,15})")


def load_status():
    if STATUS_FILE.exists():
        return json.loads(STATUS_FILE.read_text())
    return {}


def save_status(s):
    STATUS_FILE.write_text(json.dumps(s, indent=2))


def query_handle(name, outlet, role):
    prompt = (
        f"What is the verified X (Twitter) handle for {name} who works as {role} at {outlet}? "
        f"Reply with ONLY the handle starting with @, like @username. "
        f"If unsure, reply NO_RECORD. No commentary."
    )
    payload = {
        "model": "sonar-pro",
        "messages": [
            {"role": "system", "content": "Return only an X/Twitter handle starting with @ or NO_RECORD."},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 50,
        "temperature": 0.1,
    }
    with open("/tmp/_pplx_x.json", "w") as f:
        json.dump(payload, f)
    r = subprocess.run(
        ["curl", "-s", "-X", "POST", "https://api.perplexity.ai/chat/completions",
         "-H", f"Authorization: Bearer {PPLX_KEY}",
         "-H", "Content-Type: application/json", "-d", "@/tmp/_pplx_x.json"],
        capture_output=True, text=True, check=True,
    )
    try:
        d = json.loads(r.stdout)
        raw = d["choices"][0]["message"]["content"].strip()
        if "NO_RECORD" in raw.upper():
            return None
        m = HANDLE_RE.search(raw)
        if m:
            handle = m.group(1)
            if handle.lower() in {"the", "and", "or", "username", "handle", "twitter", "x"}:
                return None
            return handle
        return None
    except Exception:
        return None


def main():
    limit = 30
    for i, a in enumerate(sys.argv):
        if a == "--limit" and i + 1 < len(sys.argv):
            limit = int(sys.argv[i + 1])

    status = load_status()
    contacts = []
    for f in sorted(TARGETS_DIR.glob("*.json")):
        slug = f.stem
        if slug.startswith("_meta"):
            continue
        targets = json.loads(f.read_text())
        if not isinstance(targets, list):
            continue
        for t in targets:
            if not isinstance(t, dict):
                continue
            name = t.get("name", "")
            if not name or "@" in name:  # skip generic intake addresses
                continue
            seg = (t.get("segment") or "").lower()
            if "journalist" not in seg and "reporter" not in seg and "advocate" not in seg:
                continue
            key = f"{name.lower()}|{(t.get('outlet') or '').lower()}"
            if status.get(key, {}).get("status") in ("followed", "skip", "no_record"):
                continue
            contacts.append({
                "key": key,
                "name": name,
                "outlet": t.get("outlet", ""),
                "role": t.get("role", ""),
                "beat": t.get("beat", ""),
                "story_slug": slug,
            })

    contacts = contacts[:limit]
    if not contacts:
        print("No new X follow candidates.")
        return

    today = datetime.now().strftime("%Y-%m-%d")
    out = OUT_DIR / f"{today}.md"
    md = [
        f"# AZ Law Now Recommended X Follows, {today}",
        f"Account: @azlawnow (Brendan Franks persona, verified user_id 2042351967956013056).",
        "",
        f"**{len(contacts)} candidates.** Pace follows at <= 50 per day to stay under spam thresholds.",
        "",
        "Process: open each X profile, click Follow. After following, mark as `followed` in `data/outreach/x/x-follow-status.json`.",
        "",
        "---",
        "",
    ]
    found = 0
    none = 0
    for c in contacts:
        h = query_handle(c["name"], c["outlet"], c["role"])
        if h:
            md.append(f"- [@{h}](https://x.com/{h}) — {c['name']}, {c['role']} at {c['outlet']}, beat: {c['beat']}")
            status[c["key"]] = {"status": "candidate", "handle": h, "found_at": today}
            found += 1
        else:
            status[c["key"]] = {"status": "no_record", "found_at": today}
            none += 1
        save_status(status)
        time.sleep(0.6)

    md.append("")
    md.append(f"_Found {found} verified handles, {none} not found in public sources._")
    out.write_text("\n".join(md))
    print(f"✓ Recommended-follow list: {out}")
    print(f"  found={found} | no_record={none}")


if __name__ == "__main__":
    main()
