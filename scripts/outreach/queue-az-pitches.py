#!/usr/bin/env python3
"""
queue-az-pitches.py

Builds Apollo-ready outreach CSVs for AZ Law Now campaigns WITHOUT
calling any LLM. For each asset in the manifest, for each prospect in the
journalist CSV whose segment matches the asset's primary_segment list,
emits a row with the LedeTime template variant chosen by segment, a
templated subject line built from the bomb stat, and a per-prospect
personalization paragraph stub that the next-step LLM step can replace
once VOYAGE_API_KEY + ANTHROPIC_API_KEY are wired.

Output: data/outreach/az-campaign/{asset-slug}-{segment}.csv plus a
combined master CSV that can drop straight into Apollo.

Usage:
  python3 scripts/outreach/queue-az-pitches.py \\
    --manifest data/outreach/az-campaign/asset-manifest.json \\
    --journalists data/outreach/az-journalists.csv \\
    [--max-per-asset 60]

The script is deterministic and read-only relative to remote APIs. It
exists to let an AZ Law Now batch leave the runway in a defensible,
auditable form even when LLM keys are unavailable.
"""

import argparse
import csv
import json
import sys
import time
from pathlib import Path

# ---------------------------------------------------------------------------
# Subject line templates by segment
# Each pulls the bomb stat into the subject in a way that feels like the
# prospect's beat. Under 12 words. No em-dashes. No "expert" / "specialist".
# ---------------------------------------------------------------------------

SUBJECT_TEMPLATES = {
    "az-news": "Data: {short_stat}",
    "az-region": "Regional data: {short_stat}",
    "safety-blogger": "Vision Zero AZ data: {short_stat}",
    "legal-trade": "Practice note: {short_stat}",
    "transportation": "ADOT data: {short_stat}",
    "immigration": "ICE detention data: {short_stat}",
    "education": "AzDE data: {short_stat}",
    "elder-care": "ASBN data: {short_stat}",
    "insurance": "Claims data: {short_stat}",
}

# Personalization paragraph stubs by (vertical, segment).
# These are deterministic openers. The LLM pass will rewrite each one
# against the prospect's actual corpus once VOYAGE_API_KEY is provisioned.
PARAGRAPH_STUBS = {
    ("az-pedestrian-safety", "az-news"): (
        "Maricopa pedestrian deaths cluster on a handful of named arterials, but the citywide "
        "headline doesn't capture the intersection pattern. The data breaks out left-turn fatalities, "
        "wide-arterial clusters, and the corridors where ADOT redesigns haven't moved the curve."
    ),
    ("az-pedestrian-safety", "az-region"): (
        "Phoenix Road Safety Action Plan data with the intersection-level breakdown for your coverage "
        "area. Named streets, ADOT redesign status, and the corridors that recur in fatal-crash records."
    ),
    ("az-pedestrian-safety", "safety-blogger"): (
        "Vision Zero AZ tracking with the intersection-level data. Left-turn crash share, named arterials "
        "in Maricopa, and the corridors where Phoenix Road Safety Action Plan investment hasn't shifted the "
        "fatality rate."
    ),
    ("az-pedestrian-safety", "legal-trade"): (
        "Arizona pedestrian fatality data with the comparative-negligence context. Statute of limitations "
        "posture, intersection-level contributing factors, and the named-corridor patterns driving settlements."
    ),
    ("az-pedestrian-safety", "transportation"): (
        "ADOT crash data with the corridor breakdown. SR 347, US 60, Loop 101, and the named-arterial "
        "patterns where left-turn deaths cluster across the Phoenix metro."
    ),
    ("az-heat-vulnerability", "az-news"): (
        "Maricopa County heat-associated deaths jumped sharply year over year. The data names "
        "the ZIP-level concentrations, the APS and SRP disconnection patterns, and the gap between "
        "the public dashboard and what the death records show."
    ),
    ("az-heat-vulnerability", "az-region"): (
        "Heat-mortality data with the ZIP-level breakdown for your coverage area. Mobile-home park exposure, "
        "named neighborhoods, and the APS / SRP disconnect records tied to the worst weeks."
    ),
    ("az-heat-vulnerability", "safety-blogger"): (
        "Heat-associated death data with the methodology and the underlying CSVs. Korman bill context, "
        "HB 2168 shutoff-protection coverage, and the named ZIPs where the curve hasn't flattened."
    ),
    ("az-heat-vulnerability", "legal-trade"): (
        "Heat-mortality data with the utility-accountability legal posture. APS / SRP disconnect records, "
        "HB 2168 enforcement gaps, and the comparative-negligence treatment in heat-exposure cases."
    ),
    ("az-immigration-civil-rights", "az-news"): (
        "Maricopa County ICE detention records with the AG Mayes context. Named cases, length-of-detention "
        "patterns, and the civil-rights complaints that surfaced after the AG took office."
    ),
    ("az-immigration-civil-rights", "immigration"): (
        "ICE detention data with the named-facility breakdown. Maricopa County intake patterns, "
        "AG Mayes civil-rights filings, and the immigration-court backlog data behind the headlines."
    ),
    ("az-school-safety", "az-news"): (
        "AzDE restraint and seclusion data with the named-district breakdown. School-bus crash records, "
        "MERV-13 IAQ filtration gaps, and the ESA accountability questions raised in recent complaints."
    ),
    ("az-school-safety", "education"): (
        "Department of Education restraint, seclusion, and IAQ records. Named districts, complaint patterns, "
        "and the ESA accountability gaps documented in recent inspections."
    ),
    ("az-elder-care", "az-news"): (
        "ASBN inspection data and Arizona Long Term Care (ALTCS) records with the named-facility breakdown. "
        "Billing-abuse patterns, memory-care complaints, and the regulatory gaps the inspection record makes visible."
    ),
    ("az-elder-care", "elder-care"): (
        "ASBN inspection records and ALTCS data with the named-facility breakdown. Billing patterns, "
        "memory-care complaints, and the regulatory record behind the headlines."
    ),
    ("az-utility-accountability", "az-news"): (
        "Arizona Corporation Commission docket data with the rate-case timeline. APS and SRP disconnect "
        "records, named rate hikes, and the HB 2168 enforcement record on shutoff protections."
    ),
    ("az-utility-accountability", "transportation"): (
        "Utility-policy data tied to transportation electrification. ACC docket history, named rate cases, "
        "and the disconnect-records pattern in the same ZIPs where ADOT crash deaths cluster."
    ),
    ("az-crash-corridors", "az-news"): (
        "Arizona corridor crash data with named-highway breakdowns. I-10, SR 347, US 60, Loop 101, "
        "BNSF crossings, AZDPS fatal-crash records, and the wrong-way trend pattern by time of day."
    ),
    ("az-crash-corridors", "transportation"): (
        "ADOT and AZDPS corridor crash data with the named-highway breakdown. BNSF crossing records, "
        "wrong-way trend lines, and the time-of-day clustering in the fatal-crash data."
    ),
}


def _short_stat(stat: str, max_words: int = 9) -> str:
    """Trim the bomb stat into a 9-word subject-line fragment."""
    s = stat.replace("\n", " ").strip()
    # take first clause before comma if it carries the lead number
    for sep in [",", ";", "."]:
        if sep in s:
            first = s.split(sep, 1)[0].strip()
            if any(ch.isdigit() for ch in first):
                s = first
                break
    words = s.split()
    if len(words) <= max_words:
        return s
    return " ".join(words[:max_words]).rstrip(",.;:")


def stub_or_default(vertical: str, segment: str, bomb_stat: str) -> str:
    if (vertical, segment) in PARAGRAPH_STUBS:
        return PARAGRAPH_STUBS[(vertical, segment)]
    # default opener: lead with stat, second sentence on what's in it for press
    return (
        f"{bomb_stat}. The data file pairs the headline finding with the named-corridor "
        "breakdown, methodology, and the raw records behind it."
    )


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--manifest", default="data/outreach/az-campaign/asset-manifest.json", help="Asset manifest JSON")
    ap.add_argument("--journalists", default="data/outreach/az-journalists.csv", help="Journalist CSV")
    ap.add_argument("--max-per-asset", type=int, default=60, help="Max prospects per asset")
    ap.add_argument("--out-dir", default="data/outreach/az-campaign", help="Output dir")
    args = ap.parse_args()

    manifest = json.loads(Path(args.manifest).read_text())
    journalists = []
    with Path(args.journalists).open() as f:
        for row in csv.DictReader(f):
            if not row.get("email"):
                continue
            journalists.append(row)

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    sender = manifest["sender"]
    master_rows = []
    summary = {}

    for asset in manifest["assets"]:
        slug = asset["slug"]
        url = asset["url"]
        bomb_stat = asset["bomb_stat"]
        vertical = asset["vertical"]
        primary_segments = asset["primary_segment"]
        chart_id = asset.get("chart_id", "")

        # filter prospects to this asset's primary segments
        prospects = [p for p in journalists if p.get("segment") in primary_segments]
        prospects = prospects[: args.max_per_asset]

        per_segment = {}
        for p in prospects:
            seg = p.get("segment", "az-news") or "az-news"
            template_pattern = SUBJECT_TEMPLATES.get(seg, SUBJECT_TEMPLATES["az-news"])
            short = _short_stat(bomb_stat)
            subject_line = template_pattern.format(short_stat=short)
            personalization = stub_or_default(vertical, seg, bomb_stat)

            name = (p.get("name") or "").strip()
            parts = name.split()
            first = parts[0] if parts else ""
            last = " ".join(parts[1:]) if len(parts) > 1 else ""

            row = {
                "email": p["email"],
                "first_name": first,
                "last_name": last,
                "name": name,
                "outlet": p.get("outlet", ""),
                "beat": p.get("beat", ""),
                "twitter": p.get("twitter", ""),
                "subject_line": subject_line,
                "personalization_paragraph": personalization,
                "cosine_score": "",
                "segment": seg,
                "asset_slug": slug,
                "asset_url": url,
                "asset_stat": bomb_stat,
                "chart_id": chart_id,
                "vertical": vertical,
                "template_pattern": template_pattern,
                "needs_llm_rewrite": "yes",  # flag for the LLM-enhanced second pass
                "sender_name": sender["name"],
                "sender_email": sender["email"],
                "ready_to_send": "no",  # gate: do not send raw template rows; LLM pass first
                "queued_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }
            per_segment.setdefault(seg, []).append(row)
            master_rows.append(row)

        # write per-asset per-segment CSVs
        for seg, rows in per_segment.items():
            out_path = out_dir / f"{slug}-{seg}.csv"
            with out_path.open("w", newline="") as f:
                w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
                w.writeheader()
                w.writerows(rows)
            summary[f"{slug}/{seg}"] = len(rows)
            print(f"wrote {len(rows)} -> {out_path}", file=sys.stderr)

    # master CSV: all assets, all segments
    if master_rows:
        master_path = out_dir / "_master.csv"
        with master_path.open("w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=list(master_rows[0].keys()))
            w.writeheader()
            w.writerows(master_rows)
        print(f"\nwrote master ({len(master_rows)} rows) -> {master_path}", file=sys.stderr)

    # summary report
    summary_path = out_dir / "_queue-summary.json"
    summary_path.write_text(json.dumps({
        "queued_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "campaign": manifest.get("campaign", ""),
        "send_window": manifest.get("send_window", ""),
        "total_rows": len(master_rows),
        "by_asset_segment": summary,
        "next_step": (
            "Pass the master CSV through scripts/outreach/generate-pitches.py once "
            "VOYAGE_API_KEY is provisioned. Until then, ready_to_send remains 'no'."
        ),
    }, indent=2))
    print(f"summary -> {summary_path}", file=sys.stderr)

    print("\nDone.")


if __name__ == "__main__":
    main()
