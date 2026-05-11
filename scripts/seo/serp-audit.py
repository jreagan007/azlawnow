#!/usr/bin/env python3
"""AZ Law Now SERP audit — diagnose 0% CTR.

For each high-impression head term where the home page or a legacy URL ranks
top 3 with zero clicks, fetch the actual mobile SERP from DataForSEO and
record which SERP features are present (AI Overview, Local Pack, Featured
Snippet, Knowledge Panel, People Also Ask, Image/Video Pack).

These features are the most common click-stealers when an organic listing
ranks pos 1 but gets 0 CTR.

Inputs:
  data/research/keyword-universe.json (top impression-loser queries)

Output:
  data/research/serp-audit-{date}.md
"""
from __future__ import annotations

import base64
import json
import os
import sys
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RESEARCH_DIR = ROOT / "data" / "research"
UNIVERSE = RESEARCH_DIR / "keyword-universe.json"
RAW = RESEARCH_DIR / "_raw"


def _load_env() -> None:
    for p in [os.path.expanduser("~/Projects/taqticscom/.env"),
              os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../.env")]:
        if not os.path.exists(p):
            continue
        for line in open(p):
            if "=" not in line or line.startswith("#"):
                continue
            k, v = line.strip().split("=", 1)
            os.environ.setdefault(k, v.strip('"').strip("'"))


_load_env()
LOGIN = os.environ.get("DATAFORSEO_LOGIN")
PASSWORD = os.environ.get("DATAFORSEO_PASSWORD")
if not LOGIN or not PASSWORD:
    sys.exit("DATAFORSEO creds missing")
AUTH = base64.b64encode(f"{LOGIN}:{PASSWORD}".encode()).decode()


def serp_call(keyword: str, location_name: str = "Phoenix,Arizona,United States") -> dict:
    body = [{
        "keyword": keyword,
        "language_code": "en",
        "location_name": location_name,
        "device": "mobile",
        "depth": 20,
        "calculate_rectangles": False,
    }]
    req = urllib.request.Request(
        "https://api.dataforseo.com/v3/serp/google/organic/live/advanced",
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Basic {AUTH}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.loads(r.read().decode())


def analyze_items(items: list[dict]) -> dict:
    """Tabulate SERP item types and find our position."""
    types = {}
    our_organic_pos = None
    our_organic_url = None
    serp_features = []
    items_pre_organic = []  # everything before our first organic position

    organic_seen = 0
    for it in items or []:
        t = it.get("type", "?")
        types[t] = types.get(t, 0) + 1
        if t == "organic":
            organic_seen += 1
            url = it.get("url", "")
            if "azlawnow.com" in url and our_organic_pos is None:
                our_organic_pos = organic_seen
                our_organic_url = url
        else:
            # non-organic SERP feature
            if our_organic_pos is None:
                items_pre_organic.append(t)
            if t not in serp_features:
                serp_features.append(t)
    return {
        "types": types,
        "our_organic_pos": our_organic_pos,
        "our_organic_url": our_organic_url,
        "features_present": serp_features,
        "features_above_our_listing": items_pre_organic,
    }


# Click-stealer feature names (DFS taxonomy)
CLICK_STEALERS = {
    "ai_overview": "AI Overview (SGE)",
    "knowledge_graph": "Knowledge Panel",
    "local_pack": "Local Pack (maps 3-pack)",
    "featured_snippet": "Featured Snippet",
    "answer_box": "Answer Box",
    "people_also_ask": "People Also Ask",
    "images": "Image Pack",
    "video": "Video Pack",
    "top_stories": "Top Stories",
    "paid": "Paid Ad",
    "shopping": "Shopping Pack",
}


def main() -> None:
    if not UNIVERSE.exists():
        sys.exit(f"Missing {UNIVERSE}")
    universe = json.loads(UNIVERSE.read_text())["rows"]

    # Pick top impression-losers with gsc_impressions >= 200
    candidates = [r for r in universe
                  if r.get("gap_type") == "impression_loser"
                  and (r.get("gsc_impressions_28d") or 0) >= 200
                  and (r.get("gsc_clicks_28d") or 0) == 0]
    candidates.sort(key=lambda r: -(r.get("gsc_impressions_28d") or 0))

    # Cap to top 10 to keep API cost trivial (~$0.005 each)
    if len(candidates) > 10:
        candidates = candidates[:10]
    print(f"Auditing {len(candidates)} top impression-losers...")

    RAW.mkdir(parents=True, exist_ok=True)
    audits = []
    for i, row in enumerate(candidates, 1):
        kw = row["query"]
        print(f"  [{i}/{len(candidates)}] {kw[:50]:50} (impr={row.get('gsc_impressions_28d',0)})")
        try:
            data = serp_call(kw)
            items = data["tasks"][0]["result"][0]["items"] or []
        except Exception as e:
            print(f"    FAILED: {e}")
            continue

        analysis = analyze_items(items)
        audits.append({
            "query": kw,
            "gsc_impressions": row.get("gsc_impressions_28d", 0),
            "gsc_clicks": row.get("gsc_clicks_28d", 0),
            "gsc_position": row.get("gsc_position_28d"),
            "gsc_url": row.get("gsc_url"),
            "serp_organic_pos": analysis["our_organic_pos"],
            "serp_organic_url": analysis["our_organic_url"],
            "features_present": analysis["features_present"],
            "features_above_listing": analysis["features_above_our_listing"],
            "all_types": analysis["types"],
        })

    today = datetime.now().strftime("%Y-%m-%d")
    (RAW / f"serp-audit-{today}.json").write_text(json.dumps(audits, indent=2))

    md_path = RESEARCH_DIR / f"serp-audit-{today}.md"
    md = [
        f"# SERP Audit — Why pos 1 = 0 clicks ({today})",
        "",
        f"Mobile SERP for Phoenix,Arizona. Top **{len(audits)}** impression-losers from",
        "GSC where we have ≥200 impressions and 0 clicks in the last 28 days.",
        "",
        "For each query we capture: every SERP feature present, the features ranked",
        "ABOVE our organic listing (the actual click-stealers), and our true organic",
        "position. **GSC position 1.x can hide everything above the organic block.**",
        "",
        "---",
        "",
        "## Per-query breakdown",
        "",
    ]
    for a in audits:
        feats = a["features_above_listing"]
        unique_above = []
        for f in feats:
            if f not in unique_above:
                unique_above.append(f)
        pretty_above = [CLICK_STEALERS.get(f, f) for f in unique_above]
        md += [
            f"### `{a['query']}`",
            "",
            f"- **GSC**: {a['gsc_impressions']} impressions, {a['gsc_clicks']} clicks, "
            f"avg pos {a['gsc_position']}",
            f"- **DFS organic pos**: {a['serp_organic_pos'] or 'NOT IN TOP 20'}",
            f"- **Our URL**: `{(a.get('serp_organic_url') or '').replace('https://','')[:80]}`",
            f"- **Features ABOVE our organic listing**: "
            f"{', '.join(pretty_above) if pretty_above else '(none)'}",
            f"- **All SERP features on page**: "
            f"{', '.join(f'{k}({v})' for k, v in sorted(a['all_types'].items()))}",
            "",
        ]

    # Aggregate diagnosis
    feature_counts: dict[str, int] = {}
    for a in audits:
        seen = set()
        for f in a["features_above_listing"]:
            if f in seen:
                continue
            seen.add(f)
            feature_counts[f] = feature_counts.get(f, 0) + 1

    md += [
        "---",
        "",
        "## Aggregate diagnosis — what's stealing the clicks",
        "",
        "Counted by: number of audited queries where this feature appears ABOVE our",
        "organic listing. Higher count = more impressions stolen.",
        "",
        "| Feature | Queries above us | Likely fix |",
        "|---|---:|---|",
    ]
    fixes = {
        "ai_overview": "Optimize for SGE citations: short answer paragraph at top of page, exact-match query as H2",
        "knowledge_graph": "Strengthen Organization schema; claim Wikidata / Wikipedia entry",
        "local_pack": "Google Business Profile optimization — primary lever, not on-site",
        "featured_snippet": "Add a definition box with exact-match query as H2 + 40-60 word answer",
        "answer_box": "Same as featured_snippet",
        "people_also_ask": "Add the PAA questions verbatim as H2s + 50-word answers",
        "images": "Add a hero image with descriptive alt + filename matching the query",
        "video": "Add YouTube embed + VideoObject schema",
        "top_stories": "Apply for Google News inclusion (different from Discover)",
        "paid": "Paid ads displacing organic — invest in GBP / paid search",
    }
    for f, c in sorted(feature_counts.items(), key=lambda x: -x[1]):
        md.append(f"| **{CLICK_STEALERS.get(f, f)}** | {c} | {fixes.get(f, 'TBD')} |")

    md += [
        "",
        "## Verdict",
        "",
        "Look at the top row. If it says **AI Overview**, the click-stealer is Google",
        "answering questions in-SERP and citing us without sending traffic. The fix is",
        "SGE optimization (answer-first content patterns), not rankings work.",
        "",
        "If it says **Local Pack**, the fix is Google Business Profile, not on-site SEO.",
        "",
        "If multiple features dominate, the SERP is over-saturated with click-stealers",
        "and recovering organic CTR is structurally hard — pivot to (a) GBP, (b) paid,",
        "or (c) different keyword targets where the SERP is cleaner.",
    ]

    md_path.write_text("\n".join(md))
    print(f"\n✓ Wrote {md_path.relative_to(ROOT)}")
    print(f"✓ Wrote raw responses: data/research/_raw/serp-audit-{today}.json")
    print("\n=== Click-stealer frequency (features above our listing) ===")
    for f, c in sorted(feature_counts.items(), key=lambda x: -x[1]):
        print(f"  {c:>2}x  {CLICK_STEALERS.get(f, f)}")


if __name__ == "__main__":
    main()
