#!/usr/bin/env python3
"""Build data/outreach/targets/bnsf-phoenix-subdivision-corpus.json from the
84-prospect _master.csv that was staged for the case-gated 27th-ave piece.

Re-skins each prospect with a corpus-piece subject + personalization_hook that
makes ZERO mention of Sonja Celius and points only at the public-record FRA
corpus finding. Safe to fire without Brandon ER clearance because the corpus
piece is explicitly NOT case-gated.

Per-segment hooks are tailored. The corpus piece works for all 5 segments in
the staged matrix (data-investigations, transit-infrastructure, pedestrian-
safety, courts-legal, general-az-news).
"""
import csv
import json
import os
from pathlib import Path

ROOT = Path(os.path.expanduser("~/Projects/azlawnow"))
SRC = ROOT / "data/outreach/bnsf-notice-27th-thomas/drafts-pending-brandon/_master.csv"
DST = ROOT / "data/outreach/targets/bnsf-phoenix-subdivision-corpus.json"

# Per-segment personalization hook (≥30 chars, no Sonja, no case angle)
HOOKS_BY_SEGMENT = {
    "data-investigations": "We just published a corpus pull of FRA Office of Safety Analysis records for all 82 BNSF Phoenix Subdivision at-grade public crossings in Arizona. Single phrase, AUTO PRECEDED THE GATES, appears at three of them across five filings between November 2017 and January 2026.",
    "transit-infrastructure": "Pulled the FRA per-crossing accident PDFs for all 82 BNSF Phoenix Subdivision at-grade public crossings in Arizona. Federal-record finding: same narrative phrase at three crossings inside a 4.2-mile west Phoenix arterial corridor. None have channelizing medians per FRA inventory.",
    "pedestrian-safety": "Federal-record corpus piece on the BNSF Phoenix Subdivision in Arizona. Same phrase at three crossings. None have channelizing medians, four-quadrant gates, or any of the supplementary safety measures specified in 49 CFR Part 222 Appendix A.",
    "courts-legal": "Editorial commentary on FRA Form 6180.57 records along a 4.2-mile west Phoenix arterial corridor. Five BNSF filings, three crossings, identical narrative phrase. The form itself is restricted under 49 USC 20903; the underlying public-record facts aren't.",
    "general-az-news": "AZ Law Now just published a corpus pull of FRA accident records on the BNSF Phoenix Subdivision in Arizona. Same phrase at three different crossings inside a 4.2-mile west Phoenix arterial corridor. Public records, federal docket.",
}

SUBJECT = "BNSF Wrote the Same Phrase at Three Phoenix Crossings"

with open(SRC) as f:
    src_rows = list(csv.DictReader(f))

targets = []
for r in src_rows:
    email = (r.get("email") or "").strip().lower()
    if not email or "@" not in email:
        continue
    segment = (r.get("segment") or "general-az-news").strip()
    hook = HOOKS_BY_SEGMENT.get(segment, HOOKS_BY_SEGMENT["general-az-news"])
    targets.append({
        "email": email,
        "name": r.get("name", "").strip(),
        "first_name": r.get("first_name", "").strip(),
        "outlet": r.get("outlet", "").strip(),
        "role": r.get("beat", "").strip(),
        "beat": r.get("beat", "").strip(),
        "segment": segment,
        "category": segment,
        "state": "Arizona",
        "national_clearance": False,
        "story_target": "bnsf-phoenix-subdivision-corpus",
        "story_relevance_note": "Public-record federal-document finding. Five FRA Form 6180.57 filings BNSF Railway Company submitted across three Phoenix Subdivision grade crossings, same narrative phrase. Corridor-pattern story, NOT case-gated, no living person named.",
        "personalization_hook": hook,
    })

DST.parent.mkdir(parents=True, exist_ok=True)
DST.write_text(json.dumps(targets, indent=2, ensure_ascii=False))
print(f"Wrote {len(targets)} targets to {DST}")
print(f"Segments: { {s: sum(1 for t in targets if t['segment']==s) for s in set(t['segment'] for t in targets)} }")
