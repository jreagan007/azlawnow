#!/usr/bin/env python3
"""AZ Law Now keyword universe builder.

Pulls DataForSEO Labs ranked_keywords for azlawnow.com and lernerandrowe.com
(top 1000 each, all positions) and merges them into a single canonical
keyword universe. Each row is classified for:

  - intent          (commercial / informational / navigational / local / branded)
  - cluster         (vehicle-crashes / abuse-negligence / other-claims / meta / branded / unknown)
  - our_url         (where DFS shows azlawnow.com ranking, or None)
  - our_collection  (practice-area / investigation / legal-guide / client-guide / glossary / city / home / other)
  - gap_type        (ranking / defend / almost / deep_back / pure_gap / branded_competitor / head_commercial)
  - az_relevant     (boolean, geographic / statute relevance)
  - priority_score  (volume * leverage_factor — leverage depends on gap_type)

Outputs:
  - data/research/keyword-universe.json   (canonical, overwritten each run)
  - data/research/keyword-universe.csv    (spreadsheet-friendly, overwritten)
  - data/research/keyword-universe-{date}.json  (dated snapshot)

Usage:
  python3 scripts/seo/build-keyword-universe.py
  python3 scripts/seo/build-keyword-universe.py --limit 1000
  python3 scripts/seo/build-keyword-universe.py --dry-run   # uses cached raw if present
"""
from __future__ import annotations

import argparse
import base64
import csv
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Any


# ---------------------------------------------------------------- env / auth

def _load_env_files() -> None:
    """Load credentials from known .env locations (first hit wins per key)."""
    candidates = [
        os.path.expanduser("~/Projects/taqtics-ops/config/.env"),
        os.path.expanduser("~/Projects/taqticscom/.env"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../.env"),
    ]
    for p in candidates:
        p = os.path.abspath(p)
        if not os.path.exists(p):
            continue
        for line in open(p):
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


_load_env_files()

LOGIN = os.environ.get("DATAFORSEO_LOGIN")
PASSWORD = os.environ.get("DATAFORSEO_PASSWORD")
if not LOGIN or not PASSWORD:
    sys.stderr.write("ERROR: DATAFORSEO_LOGIN/PASSWORD missing in env\n")
    sys.exit(2)

AUTH = base64.b64encode(f"{LOGIN}:{PASSWORD}".encode()).decode()

OUR_DOMAIN = "azlawnow.com"
COMPETITORS = ["lernerandrowe.com"]  # extend later

ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT / "data" / "research" / "_raw"
OUT_DIR = ROOT / "data" / "research"


# ---------------------------------------------------------------- DFS client

def post(endpoint: str, body: list | dict) -> tuple[int, dict]:
    url = f"https://api.dataforseo.com/v3{endpoint}"
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers={
        "Authorization": f"Basic {AUTH}",
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else str(e)
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"error": body}


def fetch_ranked_keywords(domain: str, limit: int = 1000) -> list[dict]:
    """Pull top-N ranked keywords for a domain on Google US."""
    body = [{
        "target": domain,
        "language_code": "en",
        "location_code": 2840,  # US
        "limit": limit,
        "order_by": ["keyword_data.keyword_info.search_volume,desc"],
    }]
    code, data = post("/dataforseo_labs/google/ranked_keywords/live", body)
    if code != 200:
        sys.stderr.write(f"DFS error {code} for {domain}: {json.dumps(data)[:300]}\n")
        return []
    try:
        items = data["tasks"][0]["result"][0]["items"] or []
    except (KeyError, IndexError, TypeError):
        items = []
    return items


# ---------------------------------------------------------------- classifiers

CITY_SLUGS = {
    "phoenix", "mesa", "tempe", "scottsdale", "chandler", "buckeye",
    "goodyear", "avondale", "maricopa", "tucson", "yuma", "glendale",
    "gilbert", "surprise", "queen creek", "casa grande", "flagstaff",
    "peoria",
}

# Practice-area slugs (also their /<slug>.astro page slugs)
PRACTICE_AREA_SLUGS = {
    "car-accidents", "truck-accidents", "motorcycle-accidents",
    "bicycle-accidents", "bus-accidents", "rideshare-accidents",
    "pedestrian-accidents", "child-abuse", "school-abuse",
    "daycare-negligence", "elder-abuse", "nursing-home-abuse",
    "medical-negligence", "dog-bite", "slip-and-fall",
    "premises-liability", "wrongful-death",
}

VEHICLE_TOKENS = (
    "car", "auto", "truck", "semi", "18 wheeler", "motorcycle", "bike",
    "bicycle", "bus", "rideshare", "uber", "lyft", "pedestrian",
    "dui", "drunk", "wrong way", "wrong-way", "hit and run", "hit-and-run",
    "drowsy", "fatigued", "crash", "accident", "collision", "rollover",
)
ABUSE_TOKENS = (
    "abuse", "neglect", "elder", "nursing home", "nursing-home",
    "daycare", "child care", "childcare", "school", "educator",
    "teacher misconduct", "medical malpractice", "malpractice",
    "doctor negligence", "hospital negligence",
)
OTHER_CLAIM_TOKENS = (
    "dog bite", "dog-bite", "slip and fall", "slip-and-fall",
    "premises", "wrongful death", "wrongful-death", "negligent security",
)
META_TOKENS = (
    " law", " statute", " ars ", "ars 12-", "ars 13-", "ars 28-", "ars 36-",
    "code of ", "title 12", "title 13", "rate", "data", "statistics",
    "deaths", "fatalit", "violation",
)

COMPETITOR_BRANDS = (
    "lerner and rowe", "lerner & rowe", "lernerandrowe",
    "lamber goodnow", "lamber-goodnow",
    "phillips law group", "breyer law", "torgenson law",
)

AZ_GEO_TERMS = {
    "arizona", " az ", " az,", "az.com", "azlaw",
    *CITY_SLUGS,
}
AZ_STATUTE_PREFIXES = ("ars 12-", "ars 13-", "ars 15-", "ars 28-", "ars 32-", "ars 36-", "ars 46-")


def _q(s: str) -> str:
    return " " + s.lower().strip() + " "


def is_az_relevant(kw: str) -> bool:
    q = _q(kw)
    if any(g in q for g in (" arizona ", " az ", " az,")):
        return True
    if any(c in q for c in (f" {c} " for c in CITY_SLUGS)):
        return True
    if any(p in q for p in AZ_STATUTE_PREFIXES):
        return True
    return False


def classify_intent(kw: str) -> str:
    q = _q(kw)
    if any(b in q for b in (f" {b} " for b in COMPETITOR_BRANDS)):
        return "branded"
    if any(b in q for b in COMPETITOR_BRANDS):
        return "branded"
    # navigational / action — "what to do", "after a", "first steps", "how to"
    if re.search(r"\b(what to do|after a|after an|first steps|how to|do i need|should i|signs of)\b", q):
        return "navigational"
    # commercial — lawyer/attorney/firm/best/near me (incl. plurals)
    if re.search(r"\b(lawyers?|attorneys?|law\s+firms?|legal\s+help|near\s+me|best|top|cost|hire)\b", q):
        return "commercial"
    # informational — law/statute/data/rate/deaths/violation
    if re.search(r"\b(law|statute|ars|rate|data|statistics|deaths?|fatalit|violation|study|report|how\s+much|how\s+long)\b", q):
        return "informational"
    # local heuristic — bare city + topic
    if any(f" {c} " in q for c in CITY_SLUGS):
        return "local"
    return "informational"  # default safe bucket


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
    if any(t in q for t in META_TOKENS):
        return "meta"
    return "unknown"


def classify_collection(url: str | None) -> str:
    """Map a ranking URL on our domain to a content collection."""
    if not url:
        return "none"
    try:
        path = urllib.parse.urlparse(url).path.rstrip("/")
    except Exception:
        return "other"
    if not path or path == "":
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
    # Anything else on our domain is a legacy flat-slug page (pre-IA).
    # We still classify by parsed path so cannibalization scan can flag overlap.
    if len(parts) == 1:
        return "legacy-flat"
    return "other"


def classify_gap(our_pos: int | None, comp_pos: int | None, intent: str, volume: int) -> str:
    """Bucket a row by leverage opportunity."""
    if our_pos is not None:
        if our_pos <= 3:
            return "ranking"
        if our_pos <= 10:
            return "defend"
        if our_pos <= 30:
            return "almost"
        return "deep_back"
    # we don't rank; they do
    if intent == "branded":
        return "branded_competitor"
    if volume >= 1000 and intent == "commercial":
        return "head_commercial"
    return "pure_gap"


# leverage factor by gap_type — multiplied by search volume for priority_score
LEVERAGE = {
    "almost": 1.00,
    "defend": 0.70,
    "pure_gap": 0.50,
    "deep_back": 0.30,
    "head_commercial": 0.20,
    "ranking": 0.10,
    "branded_competitor": 0.05,
}


def priority(volume: int, gap_type: str, az: bool, intent: str) -> float:
    base = volume * LEVERAGE.get(gap_type, 0.1)
    if az:
        base *= 1.25
    if intent == "navigational":
        base *= 1.10  # action-intent converts harder, easier to win
    return round(base, 1)


# ---------------------------------------------------------------- extraction

def extract(item: dict) -> dict | None:
    try:
        kw = item["keyword_data"]["keyword"]
        info = item["keyword_data"].get("keyword_info") or {}
        serp = item["ranked_serp_element"]["serp_item"]
        return {
            "query": kw,
            "position": serp.get("rank_group"),
            "url": serp.get("url"),
            "volume": info.get("search_volume") or 0,
            "cpc": info.get("cpc") or 0.0,
            "competition_level": info.get("competition_level") or "?",
            "kd": info.get("keyword_difficulty"),
        }
    except (KeyError, TypeError):
        return None


# ---------------------------------------------------------------- main

def build_universe(our_items: list[dict], comp_items_by_domain: dict[str, list[dict]]) -> list[dict]:
    rows: dict[str, dict] = {}

    for raw in our_items:
        e = extract(raw)
        if not e:
            continue
        kw = e["query"]
        rows.setdefault(kw, {"query": kw})
        r = rows[kw]
        r["our_position"] = e["position"]
        r["our_url"] = e["url"]
        r["search_volume"] = e["volume"]
        r["cpc"] = e["cpc"]
        r["competition_level"] = e["competition_level"]
        r["keyword_difficulty"] = e["kd"]

    for domain, items in comp_items_by_domain.items():
        for raw in items:
            e = extract(raw)
            if not e:
                continue
            kw = e["query"]
            rows.setdefault(kw, {"query": kw})
            r = rows[kw]
            # take best (lowest) competitor position across competitors
            cur = r.get("competitor_position")
            if cur is None or e["position"] < cur:
                r["competitor_position"] = e["position"]
                r["competitor_url"] = e["url"]
                r["competitor_domain"] = domain
            # backfill volume/cpc from competitor row if we never ranked
            r.setdefault("search_volume", e["volume"])
            r.setdefault("cpc", e["cpc"])
            r.setdefault("competition_level", e["competition_level"])
            r.setdefault("keyword_difficulty", e["kd"])

    out: list[dict] = []
    for kw, r in rows.items():
        intent = classify_intent(kw)
        cluster = classify_cluster(kw)
        collection = classify_collection(r.get("our_url"))
        az = is_az_relevant(kw)
        vol = r.get("search_volume") or 0
        gap = classify_gap(r.get("our_position"), r.get("competitor_position"), intent, vol)
        score = priority(vol, gap, az, intent)
        out.append({
            "query": kw,
            "cluster": cluster,
            "intent": intent,
            "az_relevant": az,
            "search_volume": vol,
            "cpc": r.get("cpc") or 0.0,
            "competition_level": r.get("competition_level") or "?",
            "keyword_difficulty": r.get("keyword_difficulty"),
            "our_position": r.get("our_position"),
            "our_url": r.get("our_url"),
            "our_collection": collection,
            "competitor_position": r.get("competitor_position"),
            "competitor_url": r.get("competitor_url"),
            "competitor_domain": r.get("competitor_domain"),
            "gap_type": gap,
            "priority_score": score,
        })

    out.sort(key=lambda r: -r["priority_score"])
    return out


def write_outputs(rows: list[dict], today: str, raw_blob: dict) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    canonical = OUT_DIR / "keyword-universe.json"
    dated = OUT_DIR / f"keyword-universe-{today}.json"
    csv_out = OUT_DIR / "keyword-universe.csv"
    raw_out = RAW_DIR / f"dfs-ranked-{today}.json"

    payload = {
        "generated_at": today,
        "source": "dataforseo-labs:ranked_keywords/live",
        "our_domain": OUR_DOMAIN,
        "competitors": COMPETITORS,
        "row_count": len(rows),
        "rows": rows,
    }
    canonical.write_text(json.dumps(payload, indent=2))
    dated.write_text(json.dumps(payload, indent=2))
    raw_out.write_text(json.dumps(raw_blob, indent=2))

    # CSV
    fields = [
        "query", "cluster", "intent", "az_relevant", "gap_type",
        "search_volume", "cpc", "competition_level", "keyword_difficulty",
        "our_position", "our_collection", "our_url",
        "competitor_position", "competitor_domain", "competitor_url",
        "priority_score",
    ]
    with csv_out.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in fields})

    print(f"\n✓ Wrote {canonical.relative_to(ROOT)}")
    print(f"✓ Wrote {dated.relative_to(ROOT)}")
    print(f"✓ Wrote {csv_out.relative_to(ROOT)}")
    print(f"✓ Wrote {raw_out.relative_to(ROOT)}  (raw DFS responses)")


def summarize(rows: list[dict]) -> None:
    by_gap: dict[str, int] = {}
    by_collection: dict[str, int] = {}
    by_intent: dict[str, int] = {}
    az_count = 0
    for r in rows:
        by_gap[r["gap_type"]] = by_gap.get(r["gap_type"], 0) + 1
        by_collection[r["our_collection"]] = by_collection.get(r["our_collection"], 0) + 1
        by_intent[r["intent"]] = by_intent.get(r["intent"], 0) + 1
        if r["az_relevant"]:
            az_count += 1
    print("\n=== Universe summary ===")
    print(f"  Total rows: {len(rows)}")
    print(f"  AZ-relevant: {az_count}")
    print(f"  By gap_type: {dict(sorted(by_gap.items(), key=lambda x: -x[1]))}")
    print(f"  By intent:   {dict(sorted(by_intent.items(), key=lambda x: -x[1]))}")
    print(f"  Where we rank, by collection: {dict(sorted(by_collection.items(), key=lambda x: -x[1]))}")
    top = [r for r in rows if r["gap_type"] in ("almost", "defend") and r["az_relevant"]][:10]
    if top:
        print("\n  Top 10 leverage rows (almost/defend, AZ-relevant):")
        for r in top:
            print(f"    {r['our_position']:>3}  vol={r['search_volume']:>5}  {r['query'][:60]}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=1000)
    ap.add_argument("--dry-run", action="store_true",
                    help="use cached _raw/dfs-ranked-{today}.json if present")
    args = ap.parse_args()

    today = datetime.now().strftime("%Y-%m-%d")
    cache_path = RAW_DIR / f"dfs-ranked-{today}.json"

    if args.dry_run and cache_path.exists():
        print(f"DRY RUN: loading cached {cache_path}")
        raw_blob = json.loads(cache_path.read_text())
        our_items = raw_blob[OUR_DOMAIN]
        comp_items = {d: raw_blob[d] for d in COMPETITORS if d in raw_blob}
    else:
        print(f"Pulling DataForSEO ranked_keywords (limit={args.limit})...")
        print(f"  - {OUR_DOMAIN}")
        our_items = fetch_ranked_keywords(OUR_DOMAIN, limit=args.limit)
        print(f"    {len(our_items)} rows")
        comp_items = {}
        for d in COMPETITORS:
            print(f"  - {d}")
            comp_items[d] = fetch_ranked_keywords(d, limit=args.limit)
            print(f"    {len(comp_items[d])} rows")
        raw_blob = {OUR_DOMAIN: our_items, **comp_items}

    rows = build_universe(our_items, comp_items)
    write_outputs(rows, today, raw_blob)
    summarize(rows)


if __name__ == "__main__":
    main()
