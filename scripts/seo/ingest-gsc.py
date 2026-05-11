#!/usr/bin/env python3
"""AZ Law Now GSC ingest — layer Search Console click/impression data onto
the DataForSEO keyword universe.

GSC is ground truth: "what queries actually fired our pages in the last 28 days
and how many users clicked." DataForSEO Labs gives us a theoretical SERP-rank
view, but heavily under-reports for new domains and never reflects actual CTR.
The two together: DFS for competitor + volume context, GSC for what's converting.

What this does:
  1. Reads the latest `docs/gsc-reports/*-web.json` (or specific dated file).
  2. For every universe row, fills in: gsc_clicks_28d, gsc_impressions_28d,
     gsc_ctr_28d, gsc_position_28d, gsc_url (page GSC attributes the query to).
  3. Adds NEW rows for queries GSC sees but DFS doesn't — these are the
     3,000+ queries DFS Labs missed for our young domain.
  4. Recomputes gap_type and priority_score to incorporate impression data.
     New gap_type: `impression_loser` (impressions >= 50, clicks == 0) —
     the page is visible but the title/snippet isn't earning the click.
  5. Writes back to `data/research/keyword-universe.json` + dated snapshot.

Usage:
  python3 scripts/seo/ingest-gsc.py
  python3 scripts/seo/ingest-gsc.py --gsc docs/gsc-reports/2026-05-11-web.json
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.parse
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
UNIVERSE_PATH = ROOT / "data" / "research" / "keyword-universe.json"
GSC_DIR = ROOT / "docs" / "gsc-reports"
OUT_DIR = ROOT / "data" / "research"


# ---------------------------------------------------------------- classifiers (mirror universe builder)

CITY_SLUGS = {
    "phoenix", "mesa", "tempe", "scottsdale", "chandler", "buckeye",
    "goodyear", "avondale", "maricopa", "tucson", "yuma", "glendale",
    "gilbert", "surprise", "queen creek", "casa grande", "flagstaff",
    "peoria",
}

PRACTICE_AREA_SLUGS = {
    "car-accidents", "truck-accidents", "motorcycle-accidents",
    "bicycle-accidents", "bus-accidents", "rideshare-accidents",
    "pedestrian-accidents", "child-abuse", "school-abuse",
    "daycare-negligence", "elder-abuse", "nursing-home-abuse",
    "medical-negligence", "dog-bite", "slip-and-fall",
    "premises-liability", "wrongful-death",
}

VEHICLE_TOKENS = (
    "car", "auto", "truck", "motorcycle", "bicycle", "bus", "rideshare",
    "uber", "lyft", "pedestrian", "dui", "crash", "accident",
)
ABUSE_TOKENS = (
    "abuse", "neglect", "elder", "nursing", "daycare", "school", "educator",
    "malpractice",
)
OTHER_CLAIM_TOKENS = ("dog bite", "slip", "premises", "wrongful death")
COMPETITOR_BRANDS = (
    "lerner and rowe", "lerner & rowe", "lernerandrowe",
    "lamber goodnow", "lamber-goodnow",
    "phillips law", "breyer law", "torgenson",
)
AZ_STATUTE_PREFIXES = ("ars 12-", "ars 13-", "ars 15-", "ars 28-",
                       "ars 32-", "ars 36-", "ars 46-")


def _q(s: str) -> str:
    return " " + s.lower().strip() + " "


def is_az_relevant(kw: str) -> bool:
    q = _q(kw)
    if any(g in q for g in (" arizona ", " az ", " az,")):
        return True
    if any(f" {c} " in q for c in CITY_SLUGS):
        return True
    if any(p in q for p in AZ_STATUTE_PREFIXES):
        return True
    return False


def classify_intent(kw: str) -> str:
    q = _q(kw)
    if any(b in q for b in COMPETITOR_BRANDS):
        return "branded"
    if re.search(r"\b(what to do|after a|after an|first steps|how to|do i need|should i|signs of)\b", q):
        return "navigational"
    if re.search(r"\b(lawyers?|attorneys?|law\s+firms?|legal\s+help|near\s+me|best|top|cost|hire)\b", q):
        return "commercial"
    if re.search(r"\b(law|statute|ars|rate|data|statistics|deaths?|fatalit|violation|study|report|how\s+much|how\s+long)\b", q):
        return "informational"
    if any(f" {c} " in q for c in CITY_SLUGS):
        return "local"
    return "informational"


def classify_cluster(kw: str) -> str:
    q = _q(kw)
    if any(b in q for b in COMPETITOR_BRANDS):
        return "branded"
    if any(t in q for t in VEHICLE_TOKENS):
        return "vehicle-crashes"
    if any(t in q for t in ABUSE_TOKENS):
        return "abuse-negligence"
    if any(t in q for t in OTHER_CLAIM_TOKENS):
        return "other-claims"
    return "unknown"


def classify_collection(url: str | None) -> str:
    if not url:
        return "none"
    # strip query strings (GSC URLs sometimes carry utm params)
    try:
        parsed = urllib.parse.urlparse(url)
        path = parsed.path.rstrip("/")
    except Exception:
        return "other"
    if not path:
        return "home"
    parts = path.strip("/").split("/")
    head = parts[0]
    if head == "investigations":
        return "investigation"
    if head == "legal-guides":
        return "legal-guide"
    if head == "client-guides":
        return "client-guide"
    if head == "glossary":
        return "glossary"
    if head in PRACTICE_AREA_SLUGS:
        return "practice-area"
    if head in CITY_SLUGS:
        return "city"
    if head in {"abuse-negligence", "vehicle-crashes", "other-claims"}:
        return "category"
    if len(parts) == 1:
        return "legacy-flat"
    return "other"


# ---------------------------------------------------------------- gap + priority (GSC-aware)

LEVERAGE = {
    "almost": 1.00,
    "defend": 0.70,
    "pure_gap": 0.50,
    "deep_back": 0.30,
    "head_commercial": 0.20,
    "ranking": 0.10,
    "branded_competitor": 0.05,
    "impression_loser": 1.20,   # highest leverage — already visible, just fix title/snippet
    "gsc_only": 0.40,           # we have clicks but DFS doesn't see us
}


def classify_gap_with_gsc(our_pos: int | None, comp_pos: int | None,
                          intent: str, volume: int,
                          gsc_impressions: int, gsc_clicks: int) -> str:
    # Impression loser dominates — if we're showing on 50+ impressions and getting
    # zero clicks, that's the most fixable thing.
    if gsc_impressions >= 50 and gsc_clicks == 0:
        return "impression_loser"
    # We rank in DFS
    if our_pos is not None:
        if our_pos <= 3:
            return "ranking"
        if our_pos <= 10:
            return "defend"
        if our_pos <= 30:
            return "almost"
        return "deep_back"
    # No DFS position but GSC sees us
    if gsc_impressions > 0:
        return "gsc_only"
    # No signal anywhere
    if intent == "branded":
        return "branded_competitor"
    if volume >= 1000 and intent == "commercial":
        return "head_commercial"
    return "pure_gap"


def priority(volume: int, gap_type: str, az: bool, intent: str,
             gsc_impressions: int, gsc_clicks: int) -> float:
    base_volume = max(volume, gsc_impressions * 4)  # if DFS volume is 0 but we have impressions
    base = base_volume * LEVERAGE.get(gap_type, 0.1)
    if az:
        base *= 1.25
    if intent == "navigational":
        base *= 1.10
    # Impression-volume boost — pages already visible get extra leverage
    if gsc_impressions >= 100:
        base *= 1.5
    return round(base, 1)


# ---------------------------------------------------------------- main

def latest_gsc() -> Path:
    files = sorted(GSC_DIR.glob("*-web.json"))
    if not files:
        sys.exit(f"No GSC files in {GSC_DIR}. Run scripts/gsc-pull.ts first.")
    return files[-1]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--gsc", type=str, default=None, help="path to GSC web JSON; default=latest")
    args = ap.parse_args()

    gsc_path = Path(args.gsc) if args.gsc else latest_gsc()
    if not gsc_path.is_absolute():
        gsc_path = ROOT / gsc_path
    print(f"GSC source: {gsc_path.relative_to(ROOT)}")

    if not UNIVERSE_PATH.exists():
        sys.exit(f"Missing {UNIVERSE_PATH}. Run build-keyword-universe.py first.")

    universe_blob = json.loads(UNIVERSE_PATH.read_text())
    universe = universe_blob["rows"]
    gsc_blob = json.loads(gsc_path.read_text())

    # GSC rows: keys=[page, query], clicks, impressions, ctr, position
    # Aggregate by query (sum across pages; record best page per query)
    by_query: dict[str, dict] = {}
    for r in gsc_blob.get("rows", []):
        page, query = r["keys"][0], r["keys"][1]
        e = by_query.setdefault(query, {
            "clicks": 0, "impressions": 0,
            "best_page": page, "best_page_clicks": 0,
            "best_page_impressions": 0, "best_page_position": r["position"],
            "ctr_weighted": 0.0,
        })
        e["clicks"] += r["clicks"]
        e["impressions"] += r["impressions"]
        # Attribute the URL to whichever page gets the most impressions for that query
        if r["impressions"] > e["best_page_impressions"]:
            e["best_page"] = page
            e["best_page_clicks"] = r["clicks"]
            e["best_page_impressions"] = r["impressions"]
            e["best_page_position"] = r["position"]
    # Final CTR per query
    for e in by_query.values():
        e["ctr"] = (e["clicks"] / e["impressions"]) if e["impressions"] else 0

    print(f"GSC queries: {len(by_query)}  | clicks: {gsc_blob['totals']['clicks']}  | "
          f"impressions: {gsc_blob['totals']['impressions']:,}")

    # --- merge into universe ---
    existing_queries = {r["query"]: r for r in universe}

    enriched = 0
    new_rows = 0
    for query, gsc in by_query.items():
        gsc_fields = {
            "gsc_clicks_28d": gsc["clicks"],
            "gsc_impressions_28d": gsc["impressions"],
            "gsc_ctr_28d": round(gsc["ctr"], 4),
            "gsc_position_28d": round(gsc["best_page_position"], 1),
            "gsc_url": gsc["best_page"],
        }
        if query in existing_queries:
            existing_queries[query].update(gsc_fields)
            enriched += 1
        else:
            # New row — GSC sees this query, DFS doesn't
            intent = classify_intent(query)
            cluster = classify_cluster(query)
            collection = classify_collection(gsc["best_page"])
            az = is_az_relevant(query)
            row = {
                "query": query,
                "cluster": cluster,
                "intent": intent,
                "az_relevant": az,
                "search_volume": 0,   # DFS doesn't see it
                "cpc": 0.0,
                "competition_level": "?",
                "keyword_difficulty": None,
                "our_position": None,
                "our_url": gsc["best_page"],
                "our_collection": collection,
                "competitor_position": None,
                "competitor_url": None,
                "competitor_domain": None,
                **gsc_fields,
            }
            universe.append(row)
            existing_queries[query] = row
            new_rows += 1

    # Set GSC defaults on rows GSC doesn't see (so the field is always present)
    for r in universe:
        r.setdefault("gsc_clicks_28d", 0)
        r.setdefault("gsc_impressions_28d", 0)
        r.setdefault("gsc_ctr_28d", 0.0)
        r.setdefault("gsc_position_28d", None)
        r.setdefault("gsc_url", None)

    # Recompute gap_type + priority_score with GSC signals folded in
    for r in universe:
        r["gap_type"] = classify_gap_with_gsc(
            r.get("our_position"), r.get("competitor_position"),
            r.get("intent"), r.get("search_volume", 0),
            r.get("gsc_impressions_28d", 0), r.get("gsc_clicks_28d", 0),
        )
        r["priority_score"] = priority(
            r.get("search_volume", 0), r["gap_type"], r.get("az_relevant", False),
            r.get("intent"),
            r.get("gsc_impressions_28d", 0), r.get("gsc_clicks_28d", 0),
        )

    # Re-sort by priority
    universe.sort(key=lambda r: -r["priority_score"])

    # --- write back ---
    universe_blob["rows"] = universe
    universe_blob["row_count"] = len(universe)
    universe_blob["gsc_ingested_at"] = datetime.now().strftime("%Y-%m-%d")
    universe_blob["gsc_source"] = str(gsc_path.relative_to(ROOT))
    universe_blob["gsc_totals"] = gsc_blob.get("totals", {})

    UNIVERSE_PATH.write_text(json.dumps(universe_blob, indent=2))
    dated = OUT_DIR / f"keyword-universe-{datetime.now().strftime('%Y-%m-%d')}.json"
    dated.write_text(json.dumps(universe_blob, indent=2))

    print(f"\n✓ Universe enriched: {enriched} rows updated, {new_rows} new rows added")
    print(f"✓ Wrote {UNIVERSE_PATH.relative_to(ROOT)}")
    print(f"✓ Wrote {dated.relative_to(ROOT)}")

    # Summary
    from collections import Counter
    gap_counts = Counter(r["gap_type"] for r in universe)
    print("\n=== GSC-aware gap distribution ===")
    for g, c in gap_counts.most_common():
        print(f"  {g:20}  {c:>5}")

    losers = [r for r in universe if r["gap_type"] == "impression_loser"]
    losers.sort(key=lambda r: -r["gsc_impressions_28d"])
    print(f"\n=== Top 15 impression-losers (visible, 0 clicks) ===")
    for r in losers[:15]:
        pos = r.get("gsc_position_28d")
        pos_str = f"{pos:.1f}" if pos else "?"
        print(f"  impr={r['gsc_impressions_28d']:>5}  pos={pos_str:>5}  "
              f"{r['query'][:50]:50}  → {(r.get('gsc_url') or '').replace('https://azlawnow.com','')[:50]}")


if __name__ == "__main__":
    main()
