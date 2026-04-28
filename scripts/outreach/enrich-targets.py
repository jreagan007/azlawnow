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


import re

CITATION_RE = re.compile(r"\s*\[\d+\](?:\[\d+\])*")
SOURCE_TRAILER_RE = re.compile(r"\s*\(?(?:source|sources|reference|via|per)[^)]*\)?\s*$", re.I)
EM_DASH_RE = re.compile(r"\s*[—–]\s*")


def clean_hook(text):
    """Strip Perplexity citation markers, em-dashes, verbose trailers from the hook."""
    if not text:
        return ""
    text = CITATION_RE.sub("", text)
    text = EM_DASH_RE.sub(", ", text)
    text = SOURCE_TRAILER_RE.sub("", text)
    text = text.strip().strip('"').strip("'")
    if text.endswith(",") or text.endswith(":") or text.endswith(";"):
        text = text[:-1]
    if text and text[-1] not in ".!?":
        text += "."
    return text


def perplexity_query(prompt):
    payload = {
        "model": "sonar-pro",
        "messages": [
            {"role": "system", "content": (
                "You return one clean sentence about a person's recent professional work. The sentence "
                "MUST contain at least one of: (a) a date, (b) a quoted article title, (c) a named "
                "program / law / case / board action. Generic phrasing like 'your work on X' without "
                "a specific anchor is REJECTED. No preamble. No filler. No citation brackets like [1] or [2]. "
                "No trailing source notes. Under 35 words. If you cannot anchor the sentence to a specific "
                "verifiable date / title / program, reply exactly: NO_RECORD."
            )},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 300,
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
        raw = data["choices"][0]["message"]["content"].strip()
        if raw.startswith("NO_RECORD"):
            return raw
        return clean_hook(raw)
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
    "arizona-mayes-ice-surprise-detention-lawsuit": (
        "Arizona AG Mayes filed State of Arizona v. Mullin on April 24, 2026, suing DHS and ICE "
        "to block a 1,500-bed detention facility in Surprise. Across the street: Rinchem stores "
        "chlorine, hydrofluoric acid, and fluorine. Rinchem RMP filed Jan 1, 2026, three weeks "
        "before the federal warehouse purchase. NEPA + INA + Clean Air Act claims. Maryland TRO "
        "won March 11. Arizona is the fourth state on this fact pattern."
    ),
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
    "arizona-325-educator-discipline-2024": (
        "The Arizona State Board of Education adjudicated 325 educator disciplinary actions in 2024, "
        "a 491% increase from 2012. Sexual misconduct is the largest cumulative category at 36% of "
        "1,876 cases since 2012. Maricopa County drove 55.6% of cases Jan 2023 to Dec 2024. Voluntary "
        "surrender is the dominant outcome at 39%. The piece walks the ARS 12-514 12-year SOL and "
        "ARS 12-821.01 180-day Notice of Claim clocks, plus six theories of district recovery."
    ),
    "arizona-schools-merv-13-filter-bypass": (
        "Arizona school districts bought MERV 13 filters and called the air hospital-grade. "
        "ASHRAE 52.2 tests the filter media in a sealed apparatus, not the housing seal in the field. "
        "ASHRAE 241-2023 says air bypassing an unsealed filter performs as a lower MERV. "
        "EPA tightened PM2.5 NAAQS to 9 micrograms in 2024. Maricopa is in serious PM10 non-attainment."
    ),
    "buckeye-durango-yuma-roundabout-rejected": (
        "Buckeye's own engineering report projected a roundabout would cut serious-injury crashes 41.7% "
        "at Durango and Yuma. The City picked a signalized design that cuts them 15.4%. The construction "
        "savings was $1.4 million. FHWA Proven Safety Countermeasures show 46% fatal-and-serious-injury "
        "reductions when signalized intersections convert to roundabouts."
    ),
    "grand-court-mesa-elder-abuse-hb2228": (
        "A Mesa Grand Court Senior Living staff member was arrested April 21, 2026 for alleged sexual "
        "abuse of a wheelchair-bound dementia patient after the family caught it on video. HB2228 is "
        "advancing in the Arizona Senate to strengthen the state's elder abuse central registry and "
        "mandatory reporting. National data: 60% of nursing-home sexual-abuse victims have dementia, "
        "80% of perpetrators are caregivers, only 30% of incidents reach law enforcement."
    ),
    "arizona-school-restraint-data": (
        "Arizona school districts restrained students 4,200+ times in a single school year. Disability "
        "Rights Arizona's data shows the practice concentrates on students with IEPs and 504 plans. "
        "ARS 15-105 governs restraint and seclusion in AZ schools. The federal IDEA private right of "
        "action applies. The discipline data is publicly reported but rarely covered."
    ),
    "arizona-daycare-violations": (
        "Maricopa County daycares racked up the most AZDHS Bureau of Child Care Licensing violations "
        "in the state. The piece names the worst-violator facilities by count of substantiated "
        "complaints and tracks repeat offenders. Parents have public access to the AZDHS facility "
        "search but most don't know it exists."
    ),
    "arizona-school-bus-seat-belts": (
        "Arizona school districts continue to operate bus fleets without lap-and-shoulder seat belts "
        "even though NHTSA recommends them. ADE Pupil Transportation oversight is thin. The piece "
        "covers the federal-to-state standard gap, the per-district fleet ages, and what families can "
        "ask their school board to fix."
    ),
    "arizona-pedestrian-deaths-road-design": (
        "Arizona's pedestrian fatality rate runs nearly twice the national average. The piece maps "
        "the worst corridors against ADOT and MAG road-design decisions. Vision Zero adoption across "
        "AZ municipalities is uneven. The federal FHWA Proven Safety Countermeasures menu shows what "
        "redesigns work, and which AZ cities have or haven't picked them up."
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
