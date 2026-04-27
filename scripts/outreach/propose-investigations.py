#!/usr/bin/env python3
"""Propose 3 new data-led investigation ideas for AZ Law Now.

Reads recent breaking-news bulletins (or runs a fresh scan if none today),
checks against existing investigations to avoid duplication, drafts 3 candidate
story angles. Each candidate includes: hook, primary data sources, suggested
supporting documents Brandon (legal editor) or Stephanie (paralegal) could
contribute, and target outreach segments.

Usage:
  python3 scripts/outreach/propose-investigations.py [--count 3]
"""
import os
import sys
import json
import sqlite3
import subprocess
from datetime import datetime
from pathlib import Path


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

PPLX = os.environ.get("PERPLEXITY_API_KEY")
if not PPLX:
    sys.stderr.write("ERROR: PERPLEXITY_API_KEY not set\n")
    sys.exit(2)

DB = os.path.expanduser("~/Projects/azlawnow/data/outreach/azlawnow-outreach.db")
INV_DIR = Path(os.path.expanduser("~/Projects/azlawnow/src/content/investigations"))
OUT_DIR = Path(os.path.expanduser("~/Projects/azlawnow/data/outreach/proposals"))
OUT_DIR.mkdir(parents=True, exist_ok=True)

today = datetime.now().strftime("%Y-%m-%d")
COUNT = 3
for i, a in enumerate(sys.argv):
    if a == "--count" and i + 1 < len(sys.argv):
        COUNT = int(sys.argv[i + 1])


def perplexity(prompt, system):
    payload = {
        "model": "sonar-pro",
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 3000,
        "temperature": 0.3,
    }
    with open("/tmp/_pplx_prop.json", "w") as f:
        json.dump(payload, f)
    r = subprocess.run(
        ["curl", "-s", "-X", "POST", "https://api.perplexity.ai/chat/completions",
         "-H", f"Authorization: Bearer {PPLX}",
         "-H", "Content-Type: application/json", "-d", "@/tmp/_pplx_prop.json"],
        capture_output=True, text=True, check=True,
    )
    try:
        d = json.loads(r.stdout)
        return d["choices"][0]["message"]["content"].strip()
    except Exception as e:
        return f"PPLX_ERROR: {e}"


def existing_titles():
    titles = []
    for f in sorted(INV_DIR.glob("*.mdx")):
        text = f.read_text(errors="ignore")
        for line in text.splitlines()[:30]:
            if line.startswith("title:"):
                titles.append(line.split(":", 1)[1].strip().strip('"').strip("'"))
                break
    return titles


def main():
    titles = existing_titles()
    print(f"=== Propose {COUNT} new investigations | {today} ===")
    print(f"Existing: {len(titles)} published")

    existing_block = "\n".join(f"- {t}" for t in titles)

    system = (
        "You are an investigative-news desk editor proposing data-led story angles for AZ Law Now, "
        "an Arizona-focused legal/safety/accountability outlet. Style: data-first, primary-source heavy, "
        "Brendan Franks editorial voice (no em-dashes, contractions, active voice, no banned words like "
        "'leverage' or 'utilize' or 'solutions'). Every proposed angle MUST be Arizona-specific or have a "
        "specific Arizona hook. Every angle MUST be supportable with public-records data (court dockets, "
        "regulatory action lists, board orders, CDC/NHTSA/HUD/EPA datasets, or AZ public records under "
        "ARS 39-121). Skip topics already published below."
    )

    prompt = f"""Propose {COUNT} new data-led investigation angles for AZ Law Now. Each must be NEW (no
duplication of the existing list).

EXISTING INVESTIGATIONS (do not duplicate):
{existing_block}

For EACH proposal return JSON-like blocks with these fields:
- title: working investigation title (under 90 chars, Brendan voice)
- slug: kebab-case slug
- hook: 2 to 3 sentence pitch
- core_finding: the central data fact the piece would land on, with primary source URL if known
- primary_data_sources: list of public records / datasets / reports that would feed the piece
- arizona_hook: one sentence on why this is AZ-specific or has a strong AZ angle
- target_segments: which outreach segments this would land for (az_journalist, education_advocate,
  city_council, disability_nonprofit, traffic_safety_advocate, elder_care_nonprofit, etc.)
- brandon_contribution: what attorney-reviewed supporting document Brandon Millam (legal editor, AZ J.D.,
  PI / abuse / negligence focus) could publish alongside as a companion legal explainer
- stephanie_contribution: what client-facing process / checklist / step-by-step Stephanie Ramirez
  (paralegal, client resources editor) could publish as a companion family-facing guide
- urgency_window: hours / days / weeks indicator on whether the story is time-sensitive (regulatory
  deadline, court hearing, legislative vote, news cycle)

Proposals should land in DIFFERENT topic areas (don't all be K-12 schools). Mix at least: one
infrastructure/transportation, one healthcare/disability, one regulatory/consumer-protection, OR
similar diversity.

Output as plain text, NOT JSON, in human-readable blocks separated by '---'.
"""

    out = perplexity(prompt, system)
    md_path = OUT_DIR / f"{today}-proposals.md"
    md = [
        f"# AZ Law Now Investigation Proposals, {today}",
        f"Brendan Franks editorial desk. {COUNT} proposed data-led angles.\n",
        "Existing investigations skipped from duplication:",
        ", ".join(titles) + "\n",
        "---\n",
        out,
    ]
    md_path.write_text("\n".join(md))
    print(f"\n✓ Proposals written: {md_path}")
    print(f"  ({len(out)} chars)")
    print()
    print("="*80)
    print(out[:5000])


if __name__ == "__main__":
    main()
