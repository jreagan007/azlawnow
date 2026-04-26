#!/usr/bin/env python3
"""Per-target Perplexity enrichment for AZ Law Now Brendan Franks outreach.

Reads a story-specific targets file, looks up each contact's recent work via
Perplexity sonar-pro, writes a per-recipient personalization_hook back into
the file. The hook gets used in the email opener so each pitch references
the contact's specific work.

Usage:
  python3 scripts/outreach/enrich-targets.py <story-slug> [--max N]
"""
import os
import sys
import json
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

PPLX_URL = "https://api.perplexity.ai/chat/completions"


def parse_args():
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: enrich-targets.py <story-slug> [--max N]\n")
        sys.exit(1)
    slug = sys.argv[1]
    max_count = 9999
    for i, a in enumerate(sys.argv):
        if a == "--max" and i + 1 < len(sys.argv):
            max_count = int(sys.argv[i + 1])
    return slug, max_count


def perplexity_query(prompt):
    payload = {
        "model": "sonar-pro",
        "messages": [
            {"role": "system", "content": "You return one clean sentence about a person's recent professional work, with one specific reference (article title, program name, statute, board action, or named project). No preamble. No filler. Under 50 words. If no specific record is publicly verifiable, reply exactly: NO_RECORD."},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 200,
        "temperature": 0.2,
    }
    with open("/tmp/_pplx.json", "w") as f:
        json.dump(payload, f)
    r = subprocess.run(
        ["curl", "-s", "-X", "POST", PPLX_URL,
         "-H", f"Authorization: Bearer {PPLX_KEY}",
         "-H", "Content-Type: application/json",
         "-d", "@/tmp/_pplx.json"],
        capture_output=True, text=True, check=True,
    )
    try:
        data = json.loads(r.stdout)
        return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        return f"NO_RECORD ({e})"


def build_hook_prompt(target, story_essence):
    name = target.get("name") or ""
    outlet = target.get("outlet") or ""
    role = target.get("role") or ""
    beat = target.get("beat") or ""
    relevance = target.get("story_relevance_note") or ""
    return (
        f"I'm pitching {name}, who is {role} at {outlet}. Their beat: {beat}. "
        f"Why we're reaching out: {relevance}. Story we're pitching: {story_essence}. "
        f"Return one sentence I can drop in the email opener that shows I know their specific recent work. "
        f"Pattern: 'Saw your [specific work] on [specific topic]' or 'Caught your [piece title] in [outlet] on [date or topic]' or 'Your work on [specific program/law/initiative]'. "
        f"Must reference a SPECIFIC verifiable thing, not a generic compliment. Return only the sentence."
    )


STORY_ESSENCE = {
    "tempe-asu-pavement-180-day-claim-clock": (
        "Tempe pavement near ASU is failing per the city's own grant filings. "
        "Arizona's 180-day Notice of Claim clock under ARS 12-821.01 hits injured riders. "
        "The Arizona Board of Regents publicly says ASU can't accept service of claims. "
        "Fong v. City of Phoenix (2024) requires expert testimony on bike-lane defects."
    ),
    "arizona-career-schools-37-adverse-actions": (
        "Arizona's Private Postsecondary Education Board reports 237 licensed career schools, "
        "37 adverse actions, and 9 closures in FY25. Federal 60-percent rule under 34 CFR 668.22 "
        "creates structural pressure to keep students past the aid waterline. Corinthian and ITT "
        "discharges set the national precedent."
    ),
    "arizona-schools-merv-13-filter-bypass": (
        "Arizona school districts bought MERV 13 filters and called the air hospital-grade. "
        "ASHRAE 52.2 tests the filter media in a sealed apparatus, not the housing seal in the field. "
        "ASHRAE 241-2023 says air bypassing an unsealed filter performs as a lower MERV. "
        "EPA tightened PM2.5 NAAQS to 9 micrograms in 2024. Maricopa is in serious PM10 non-attainment."
    ),
}


def main():
    slug, max_count = parse_args()
    f = TARGETS_DIR / f"{slug}.json"
    if not f.exists():
        sys.stderr.write(f"ERROR: targets file not found: {f}\n")
        sys.exit(1)

    targets = json.loads(f.read_text())
    essence = STORY_ESSENCE.get(slug)
    if not essence:
        sys.stderr.write(f"ERROR: STORY_ESSENCE not defined for {slug}. Add to enrich-targets.py.\n")
        sys.exit(2)

    print(f"=== {slug} | targets: {len(targets)} ===")
    enriched = 0
    skipped = 0
    failed = 0

    for i, t in enumerate(targets):
        if enriched >= max_count:
            break
        existing = (t.get("personalization_hook") or "").strip()
        if existing and existing != "NO_RECORD" and len(existing) >= 30:
            skipped += 1
            continue
        prompt = build_hook_prompt(t, essence)
        try:
            hook = perplexity_query(prompt)
            if hook.startswith("NO_RECORD"):
                t["personalization_hook"] = ""
                t["enrichment_status"] = "no_record"
                failed += 1
                print(f"  ⚠ no record: {t.get('name')} ({t.get('email')})")
            else:
                hook = hook.strip().strip('"').strip("'")
                t["personalization_hook"] = hook
                t["enrichment_status"] = "ok"
                enriched += 1
                print(f"  ✓ {t.get('name'):<30} | {hook[:90]}")
            f.write_text(json.dumps(targets, indent=2))
            time.sleep(1.0)
        except Exception as e:
            failed += 1
            print(f"  ✗ {t.get('name')}: {e}")

    print(f"\n📊 enriched={enriched} | skipped={skipped} | failed={failed}")


if __name__ == "__main__":
    main()
