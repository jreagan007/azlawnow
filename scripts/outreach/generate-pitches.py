#!/usr/bin/env python3
"""
generate-pitches.py

Per-prospect subject line + pitch hook generation for AZ Law Now earned-media outreach.
Reads enriched-prospects.jsonl (output of enrich-journalists.py), embeds the asset URL,
scores cosine similarity per prospect, and calls Claude Sonnet 4.6 to generate
a per-prospect personalization paragraph + validated subject line.

Outputs Apollo-ready CSVs, one per recommended track plus a rejected list.

Usage:
  python3 scripts/outreach/generate-pitches.py \\
    --enriched-jsonl data/outreach/enriched-prospects.jsonl \\
    --asset-url https://azlawnow.com/investigations/heat-deaths-maricopa/ \\
    --asset-stat "Maricopa County recorded 645 heat-associated deaths in 2023, up 52 percent year over year" \\
    --vertical az-heat-vulnerability \\
    --output-csv data/outreach/az-campaign/heat-deaths

  --enriched-jsonl   Path to JSONL output from enrich-journalists.py
  --asset-url        The live AZ Law Now URL being pitched
  --asset-stat       The bomb stat to lead the pitch (quoted string)
  --vertical         Framing slug: az-pedestrian-safety | az-heat-vulnerability |
                     az-immigration-civil-rights | az-school-safety | az-elder-care |
                     az-utility-accountability | az-crash-corridors | insurance-trade
  --output-csv       Base path for output CSVs (no extension; script appends per-segment files)
  --min-score        Minimum cosine similarity to include prospect (default: 0.55)
  --dry-run          Generate pitches but do not write output files
"""

import argparse
import csv
import json
import math
import os
import sys
import time
from pathlib import Path

import httpx

# ---------------------------------------------------------------------------
# Load secrets
# ---------------------------------------------------------------------------

def _load_ops_env():
    env_path = Path("/Users/taqticlaw/Projects/taqtics-ops/config/.env")
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

_load_ops_env()

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
VOYAGE_API_KEY = os.environ.get("VOYAGE_API_KEY", "")
FIRECRAWL_API_KEY = os.environ.get("FIRECRAWL_API_KEY", "")
FIRECRAWL_BASE = "https://api.firecrawl.dev"
VOYAGE_BASE = "https://api.voyageai.com/v1"
VOYAGE_MODEL = "voyage-3-large"
CLAUDE_MODEL = "claude-sonnet-4-6"
MIN_SCORE_DEFAULT = 0.55

# ---------------------------------------------------------------------------
# Subject line pattern definitions
# ---------------------------------------------------------------------------

SUBJECT_PATTERNS = {
    "stat-lede": "Opens with one specific number or rate. No editorial commentary before the stat. Example: '645 heat-associated deaths, 52% jump year over year'",
    "contrarian-declarative": "Picks a fight with received wisdom. States the opposite of what a reader would assume. Example: 'The Maricopa heat data ADOT dashboards don't show'",
    "categorical-question": "Poses a question the reader must answer by opening the email. Example: 'Why do heat deaths cluster on five Phoenix corridors?'",
    "counterintuitive-directive": "Reverses a common assumption with a why/how framing. Example: 'Why APS disconnect data understates the heat-mortality risk'",
    "industry-state-declarative": "Names an unresolved condition or gap in coverage. Example: 'Maricopa heat-related fatalities: the ZIP-level data the public dashboard leaves out'",
}

VERTICAL_FRAMING = {
    "az-pedestrian-safety": "This pitch goes to Arizona reporters covering pedestrian safety, Vision Zero AZ, and ADOT. Frame the data around intersection-level crash records, time-of-day clustering, and the specific Maricopa intersections / Phoenix Road Safety Action Plan corridors. Use crash data terms (KSI, fatality rate, left-turn share). Named corridors include Goodyear, Buckeye, SR 347. Person-first: 'people struck while crossing,' not 'pedestrian victims.'",
    "az-heat-vulnerability": "This pitch goes to Arizona reporters covering heat deaths, utility policy, and public-health vulnerability. Frame around heat-associated mortality data, APS and SRP disconnection records, mobile-home park exposure, and HB 2168 / Korman shutoff-protections context. Person-first: 'people who died after losing power,' not 'heat victims.'",
    "az-immigration-civil-rights": "This pitch goes to Arizona reporters covering ICE detention, civil rights, and the Mayes AG office. Frame around Maricopa County detention practices, immigration-court backlogs, and named civil-rights cases. Person-first throughout. No partisan register.",
    "az-school-safety": "This pitch goes to Arizona education reporters and parent-blog audiences. Frame around AzDE restraint/seclusion data, school-bus crash records, MERV-13 IAQ filtration, and ESA accountability gaps. Named districts and named complaints.",
    "az-elder-care": "This pitch goes to reporters covering aging, nursing homes, and assisted-living regulation. Frame around ASBN inspection records, Arizona Long Term Care (ALTCS) data, named facilities, and billing-abuse patterns. Person-first: 'people in residential care,' not 'elderly residents.'",
    "az-utility-accountability": "This pitch goes to Arizona reporters covering utility policy, the Arizona Corporation Commission (ACC), and rate-case journalism. Frame around ACC dockets, named rate hikes, disconnect data, and HB 2168 shutoff-protection coverage.",
    "az-crash-corridors": "This pitch goes to Arizona reporters covering traffic, ADOT, and DPS. Frame around named corridors (I-10, SR 347, US 60, Loop 101), BNSF crossings, fatal-crash clustering, and time-of-day patterns. Includes wrong-way and rollover trend data.",
    "insurance-trade": "This pitch goes to insurance trade publications. Frame around no-fault, PIP, policy-limit data, comparative negligence, and litigation-cost trends in Arizona's market. Trade register throughout. The asset is a data journalism resource, not a consumer-facing advocacy piece.",
}

# ---------------------------------------------------------------------------
# Utility: cosine similarity
# ---------------------------------------------------------------------------

def cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(x * x for x in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)

# ---------------------------------------------------------------------------
# Firecrawl single-page scrape for asset
# ---------------------------------------------------------------------------

def scrape_asset(asset_url: str) -> str:
    if not FIRECRAWL_API_KEY:
        raise RuntimeError("FIRECRAWL_API_KEY not set.")
    headers = {
        "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "url": asset_url,
        "formats": ["markdown"],
        "onlyMainContent": True,
        "blockAds": True,
        "removeBase64Images": True,
    }
    resp = httpx.post(f"{FIRECRAWL_BASE}/v2/scrape", json=payload, headers=headers, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    return data.get("data", {}).get("markdown", "") or data.get("markdown", "")

# ---------------------------------------------------------------------------
# Voyage embedding (sync for asset, since we only do this once)
# ---------------------------------------------------------------------------

def voyage_embed_sync(texts: list[str]) -> list[list[float]]:
    if not VOYAGE_API_KEY:
        raise RuntimeError("VOYAGE_API_KEY not set.")
    headers = {
        "Authorization": f"Bearer {VOYAGE_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": VOYAGE_MODEL,
        "input": texts,
        "input_type": "document",
    }
    resp = httpx.post(f"{VOYAGE_BASE}/embeddings", json=payload, headers=headers, timeout=120)
    resp.raise_for_status()
    data = resp.json()
    return [item["embedding"] for item in data["data"]]

# ---------------------------------------------------------------------------
# Claude: per-prospect pitch generation
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are a data journalism outreach editor for AZ Law Now, the data journalism arm of AZ Law Now Injury Attorneys that publishes original Arizona injury, civil-rights, heat-vulnerability, and worksite-safety research. Your job is to write per-journalist pitch personalization for earned-media outreach.

Voice rules (non-negotiable):
- Contractions always (don't, won't, it's, we're, that's)
- No em-dashes. Rewrite instead.
- Active voice 80% minimum
- Person-first language: "people struck while crossing" not "pedestrian victims"
- Never refer to attorneys as "expert" or "specialist"
- Never use: "shocking," "alarming," "battle," "warrior," "fight," "comprehensive," "navigate" (metaphorical), "landscape" (metaphorical), "journey" (metaphorical), "leverage," "utilize," "robust," "holistic," "expert," "specialist"
- No anchor-text suggestions to the publisher. Editorial freedom is the rule.
- Calm, precise, data-first register. The stat does the emotional work. No amplifiers before numbers.
- Do not name the scraping tool or the embedding model in pitch copy. Internal only.

The pitch comes from AZ Law Now as a data journalism unit. Sender is Brendan Franks, On Record, AZ Law Now, brendan@azlawnow.com. The frame is open data offered to working reporters who cover the relevant beat. Not a marketing pitch. Not a law-firm sales touch."""

def generate_pitch(
    prospect: dict,
    enriched: dict,
    asset_url: str,
    asset_stat: str,
    asset_body_excerpt: str,
    vertical: str,
) -> dict:
    """Call Claude Sonnet 4.6 to generate subject line + personalization paragraph."""
    if not ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY not set.")

    name = prospect.get("name", "")
    outlet = prospect.get("outlet", "")
    beat = prospect.get("beat", "")
    themes = enriched.get("coverage_themes", [])
    article_summaries = enriched.get("last_25_article_summaries", [])

    vertical_context = VERTICAL_FRAMING.get(vertical, "")
    pattern_descriptions = "\n".join([f"- {k}: {v}" for k, v in SUBJECT_PATTERNS.items()])

    summaries_text = "\n".join(article_summaries[:5]) if article_summaries else "No articles found."

    user_message = f"""Generate a personalized pitch for this journalist:

JOURNALIST: {name}
OUTLET: {outlet}
BEAT: {beat}
COVERAGE THEMES (from their recent articles): {', '.join(themes) if themes else 'not available'}
RECENT ARTICLE EXCERPTS (use for personalization):
{summaries_text}

THE ASSET WE'RE PITCHING:
URL: {asset_url}
HEADLINE STAT: {asset_stat}
EXCERPT FROM THE PIECE:
{asset_body_excerpt[:800]}

VERTICAL FRAMING FOR THIS CAMPAIGN:
{vertical_context}

OUTPUT REQUIRED (JSON only, no markdown, no preamble):
{{
  "subject_line": "...",
  "subject_pattern": "<one of: stat-lede | contrarian-declarative | categorical-question | counterintuitive-directive | industry-state-declarative>",
  "personalization_paragraph": "..."
}}

RULES FOR subject_line:
{pattern_descriptions}
- No agency name in subject line
- No "I" to start the subject
- Max 90 characters
- Must fit one of the 5 patterns above

RULES FOR personalization_paragraph:
- 2-3 sentences
- Reference the journalist's specific coverage (use their themes or article excerpts above)
- Frame the AZ Law Now asset as a logical data resource for their existing beat
- Do NOT summarize their work at length, reference it briefly and pivot to the asset
- Never suggest anchor text to the journalist
- Never say "I thought of you," "I came across your work," "Hope you're doing well," "I wanted to reach out," "I'd love to chat"
- Start directly: name their coverage, connect it to the data we have"""

    headers = {
        "x-api-key": ANTHROPIC_API_KEY,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
    }
    payload = {
        "model": CLAUDE_MODEL,
        "max_tokens": 512,
        "system": SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": user_message}],
    }

    for attempt in range(3):
        try:
            resp = httpx.post(
                "https://api.anthropic.com/v1/messages",
                json=payload,
                headers=headers,
                timeout=60
            )
            resp.raise_for_status()
            content = resp.json()["content"][0]["text"].strip()

            # Parse JSON
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            result = json.loads(content)

            # Validate subject pattern
            pattern = result.get("subject_pattern", "")
            if pattern not in SUBJECT_PATTERNS:
                print(f"  [warn] Invalid subject pattern '{pattern}' for {name}. Regenerating (attempt {attempt + 1}/3).")
                if attempt == 2:
                    result["subject_pattern"] = "needs_manual_subject"
                    result["ready_to_send"] = False
                continue

            return result

        except (json.JSONDecodeError, KeyError) as e:
            print(f"  [warn] Claude parse error for {name} (attempt {attempt + 1}/3): {e}")
            time.sleep(2)

    return {
        "subject_line": f"[NEEDS MANUAL REVIEW] {asset_stat}",
        "subject_pattern": "needs_manual_subject",
        "personalization_paragraph": "[Generation failed. Write manually.]",
    }

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Generate per-prospect pitches for AZ Law Now earned-media outreach.")
    parser.add_argument("--enriched-jsonl", required=True, help="Path to enriched-prospects.jsonl from enrich-journalists.py")
    parser.add_argument("--asset-url", required=True, help="The live AZ Law Now URL being pitched")
    parser.add_argument("--asset-stat", required=True, help="The headline stat (quoted string) to lead the pitch")
    parser.add_argument("--vertical", required=True, choices=list(VERTICAL_FRAMING.keys()), help="Vertical framing slug")
    parser.add_argument("--output-csv", required=True, help="Base output path (no extension). Script writes one CSV per segment.")
    parser.add_argument("--min-score", type=float, default=MIN_SCORE_DEFAULT, help=f"Min cosine similarity to include (default: {MIN_SCORE_DEFAULT})")
    parser.add_argument("--dry-run", action="store_true", help="Generate but don't write output files")
    args = parser.parse_args()

    # Validate inputs
    enriched_path = Path(args.enriched_jsonl)
    if not enriched_path.exists():
        print(f"ERROR: enriched JSONL not found: {enriched_path}", file=sys.stderr)
        sys.exit(1)

    print("Step 1: Scraping asset URL for content embedding...")
    print(f"  URL: {args.asset_url}")
    try:
        asset_body = scrape_asset(args.asset_url)
        if not asset_body:
            print("  [warn] Asset scrape returned empty body. Subject-line generation will use --asset-stat only.")
    except Exception as e:
        print(f"  [warn] Asset scrape failed ({e}). Proceeding with --asset-stat only.")
        asset_body = ""

    print("Step 2: Embedding asset content...")
    asset_text = f"{args.asset_stat}\n\n{asset_body[:3000]}"
    try:
        asset_embeddings = voyage_embed_sync([asset_text])
        asset_embedding = asset_embeddings[0]
    except Exception as e:
        print(f"  [warn] Voyage embedding failed for asset ({e}). Score-based ranking disabled.")
        asset_embedding = []

    print(f"Step 3: Loading enriched prospects from {enriched_path}")
    enriched_records = []
    with open(enriched_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                enriched_records.append(json.loads(line))

    print(f"  Loaded {len(enriched_records)} enriched prospects.")

    # Score each prospect
    scored = []
    for rec in enriched_records:
        centroid = rec.get("corpus_centroid_embedding", [])
        score = cosine_similarity(asset_embedding, centroid) if asset_embedding and centroid else 0.0
        scored.append((score, rec))

    scored.sort(key=lambda x: x[0], reverse=True)

    above = [(s, r) for s, r in scored if s >= args.min_score]
    below = [(s, r) for s, r in scored if s < args.min_score]

    print(f"  Above threshold ({args.min_score}): {len(above)}")
    print(f"  Below threshold (rejected): {len(below)}")

    if below:
        rejected_path = enriched_path.parent / "rejected-low-relevance.csv"
        with open(rejected_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["name", "outlet", "beat", "email", "score"])
            writer.writeheader()
            for s, r in below:
                meta = r.get("prospect_meta", {})
                writer.writerow({
                    "name": meta.get("name", ""),
                    "outlet": meta.get("outlet", ""),
                    "beat": meta.get("beat", ""),
                    "email": meta.get("email", ""),
                    "score": round(s, 4),
                })
        print(f"  Rejected prospects logged to {rejected_path}")

    # Bucket pitches by segment
    rows_by_segment: dict[str, list[dict]] = {}

    print("\nStep 4: Generating per-prospect pitches via Claude Sonnet 4.6...")
    for rank, (score, rec) in enumerate(above, start=1):
        meta = rec.get("prospect_meta", {})
        name_p = meta.get("name", "")
        segment = (meta.get("segment", "") or "unsegmented").strip().lower() or "unsegmented"

        print(f"  [{rank}/{len(above)}] {name_p} ({meta.get('outlet', '')}) score={score:.4f} segment={segment}")

        pitch = generate_pitch(
            prospect=meta,
            enriched=rec,
            asset_url=args.asset_url,
            asset_stat=args.asset_stat,
            asset_body_excerpt=asset_body[:1200],
            vertical=args.vertical,
        )

        ready = pitch.get("subject_pattern", "") != "needs_manual_subject"

        # Split name into first/last for Apollo
        parts = name_p.split(" ", 1)
        first_name = parts[0] if parts else ""
        last_name = parts[1] if len(parts) > 1 else ""

        row = {
            "email": meta.get("email", ""),
            "first_name": first_name,
            "last_name": last_name,
            "name": name_p,
            "outlet": meta.get("outlet", ""),
            "beat": meta.get("beat", ""),
            "twitter": meta.get("twitter", ""),
            "subject_line": pitch.get("subject_line", ""),
            "personalization_paragraph": pitch.get("personalization_paragraph", ""),
            "cosine_score": round(score, 4),
            "segment": segment,
            "asset_url": args.asset_url,
            "asset_stat": args.asset_stat,
            "subject_pattern": pitch.get("subject_pattern", ""),
            "ready_to_send": "TRUE" if ready else "FALSE",
        }

        rows_by_segment.setdefault(segment, []).append(row)

        time.sleep(1.5)

    if args.dry_run:
        print("\n[dry-run] No files written.")
        for seg, rows in rows_by_segment.items():
            print(f"\nSegment '{seg}' ({len(rows)} prospects):")
            for r in rows:
                print(f"  {r['name']} | {r['outlet']} | score={r['cosine_score']}")
                print(f"  Subject: {r['subject_line']}")
                print(f"  Hook: {r['personalization_paragraph'][:120]}...")
        return

    # Write output CSVs (Apollo-ready)
    fieldnames = [
        "email", "first_name", "last_name", "name", "outlet", "beat", "twitter",
        "subject_line", "personalization_paragraph", "cosine_score", "segment",
        "asset_url", "asset_stat", "subject_pattern", "ready_to_send",
    ]
    base = Path(args.output_csv)
    base.parent.mkdir(parents=True, exist_ok=True)

    written = []
    for seg, rows in rows_by_segment.items():
        out_path = base.parent / f"{base.name}-{seg}.csv"
        with open(out_path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=fieldnames)
            w.writeheader()
            w.writerows(rows)
        written.append((seg, len(rows), out_path))

    print("\nDone.")
    for seg, count, path in written:
        print(f"  Segment '{seg}' ({count} prospects): {path}")
    print("\nNext step: Import CSVs into Apollo. Map 'email' to Contact Email,")
    print("'subject_line' to Custom Field 'Pitch Subject', 'personalization_paragraph' to 'Personalization Hook'.")
    print("Then route through send-outreach.py with --dry-run to confirm before live send.")


if __name__ == "__main__":
    main()
