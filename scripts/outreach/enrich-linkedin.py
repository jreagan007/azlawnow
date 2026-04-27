#!/usr/bin/env python3
"""Find LinkedIn profile URLs for outreach contacts via Perplexity sonar-pro.

Reads a story-specific targets file, for each contact without linkedin_url it
queries Perplexity for the public LinkedIn URL, validates the response shape,
writes back to the file. Used to power LinkedIn outreach inventory and follow
flows.

Usage:
  python3 scripts/outreach/enrich-linkedin.py <story-slug> [--max N]
"""
import os
import sys
import json
import re
import time
import subprocess
from pathlib import Path

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

PPLX_KEY = os.environ.get("PERPLEXITY_API_KEY")
if not PPLX_KEY:
    sys.stderr.write("ERROR: PERPLEXITY_API_KEY not set\n")
    sys.exit(2)

LINKEDIN_RE = re.compile(r"https?://(?:www\.)?linkedin\.com/in/[A-Za-z0-9\-_%]+/?")


def parse_args():
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: enrich-linkedin.py <story-slug> [--max N]\n")
        sys.exit(1)
    slug = sys.argv[1]
    max_count = 9999
    for i, a in enumerate(sys.argv):
        if a == "--max" and i + 1 < len(sys.argv):
            max_count = int(sys.argv[i + 1])
    return slug, max_count


def query(name, outlet, role):
    prompt = (
        f"Return ONLY the public LinkedIn profile URL for {name} who works as "
        f"{role} at {outlet}. Format: https://www.linkedin.com/in/<slug>/. "
        f"If you can't find a verifiable LinkedIn URL for THIS person at THIS "
        f"organization, reply exactly: NO_RECORD."
    )
    payload = {
        "model": "sonar-pro",
        "messages": [
            {"role": "system", "content": "Return only a LinkedIn URL or NO_RECORD. No commentary."},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 100,
        "temperature": 0.1,
    }
    with open("/tmp/_pplx_li.json", "w") as f:
        json.dump(payload, f)
    r = subprocess.run(
        ["curl", "-s", "-X", "POST", "https://api.perplexity.ai/chat/completions",
         "-H", f"Authorization: Bearer {PPLX_KEY}",
         "-H", "Content-Type: application/json", "-d", "@/tmp/_pplx_li.json"],
        capture_output=True, text=True, check=True,
    )
    try:
        d = json.loads(r.stdout)
        raw = d["choices"][0]["message"]["content"].strip()
        if "NO_RECORD" in raw.upper():
            return None
        m = LINKEDIN_RE.search(raw)
        return m.group(0) if m else None
    except Exception:
        return None


def main():
    slug, max_count = parse_args()
    f = TARGETS_DIR / f"{slug}.json"
    if not f.exists():
        sys.stderr.write(f"ERROR: targets file not found: {f}\n")
        sys.exit(1)

    targets = json.loads(f.read_text())
    print(f"=== LinkedIn enrichment | {slug} | targets: {len(targets)} ===")
    found, skipped, none = 0, 0, 0
    for t in targets:
        if found >= max_count:
            break
        if t.get("linkedin_url"):
            skipped += 1
            continue
        if not t.get("name") or not t.get("outlet"):
            skipped += 1
            continue
        url = query(t.get("name", ""), t.get("outlet", ""), t.get("role", ""))
        if url:
            t["linkedin_url"] = url
            t.setdefault("linkedin_status", "not_attempted")
            found += 1
            print(f"  ✓ {t['name'][:30]:<30} | {url}")
        else:
            t["linkedin_url"] = None
            t["linkedin_status"] = "no_record"
            none += 1
            print(f"  ⚠ no record: {t.get('name', '')}")
        f.write_text(json.dumps(targets, indent=2))
        time.sleep(0.8)

    print(f"\n📊 found={found} | skipped={skipped} | no_record={none}")


if __name__ == "__main__":
    main()
