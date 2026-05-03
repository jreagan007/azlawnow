#!/usr/bin/env python3
"""AZ Law Now content-gap ranking analysis.

Pulls azlawnow.com's current ranking keywords from DataForSEO Labs.
Identifies "almost there" opportunities (positions 11 to 30) where small
content pushes can move us into the top 10.

Also pulls competitor (lernerandrowe.com) ranking keywords and finds the
ones they rank for that we don't, filtered to AZ-legal-vertical relevance.

Output: markdown brief at data/research/content-gap-2026-05-02.md.

Usage:
  python3 scripts/outreach/content-gap-analysis.py
"""
import os
import sys
import json
import base64
import urllib.request
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

LOGIN = os.environ.get("DATAFORSEO_LOGIN")
PASSWORD = os.environ.get("DATAFORSEO_PASSWORD")
if not LOGIN or not PASSWORD:
    sys.stderr.write("ERROR: DATAFORSEO_LOGIN/PASSWORD missing\n")
    sys.exit(2)

AUTH = base64.b64encode(f"{LOGIN}:{PASSWORD}".encode()).decode()


def post(endpoint, body):
    url = f"https://api.dataforseo.com/v3{endpoint}"
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers={
        "Authorization": f"Basic {AUTH}",
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode()) if e.fp else {"error": str(e)}


def get_ranked_keywords(domain, limit=500):
    """Get top ranked keywords for a domain on Google US."""
    body = [{
        "target": domain,
        "language_code": "en",
        "location_code": 2840,  # US
        "limit": limit,
    }]
    code, data = post("/dataforseo_labs/google/ranked_keywords/live", body)
    if code != 200:
        sys.stderr.write(f"DFS error {code}: {json.dumps(data)[:300]}\n")
        return []
    try:
        items = data["tasks"][0]["result"][0]["items"]
        return items or []
    except (KeyError, IndexError, TypeError):
        return []


AZ_GEO_KEYWORDS = [
    "arizona", "phoenix", "tucson", "mesa", "tempe", "scottsdale", "chandler",
    "glendale", "gilbert", "maricopa", "pima", "yuma", "buckeye", "goodyear",
    "avondale", "surprise", "queen creek", "casa grande", "flagstaff",
    "asu", "u of a", "u of arizona",
    " az ", " az,", "az.com",
    "ars 12-", "ars 13-", "ars 15-", "ars 28-", "ars 36-", "ars 32-",
]


def is_az_relevant(kw):
    kw_l = " " + kw.lower() + " "
    return any(m in kw_l for m in AZ_GEO_KEYWORDS)


def main():
    today = datetime.now().strftime("%Y-%m-%d")
    out_path = Path(f"data/research/content-gap-{today}.md")
    out_path.parent.mkdir(parents=True, exist_ok=True)

    print("=== AZ Law Now content-gap analysis ===")
    print(f"Pulling azlawnow.com ranked keywords from DataForSEO...")

    our_kws = get_ranked_keywords("azlawnow.com", limit=500)
    print(f"  azlawnow.com: {len(our_kws)} ranking keywords")

    print(f"Pulling lernerandrowe.com ranked keywords (competitor)...")
    comp_kws = get_ranked_keywords("lernerandrowe.com", limit=500)
    print(f"  lernerandrowe.com: {len(comp_kws)} ranking keywords")

    # Build position-keyword maps
    our_by_kw = {}
    for item in our_kws:
        try:
            kw = item["keyword_data"]["keyword"]
            pos = item["ranked_serp_element"]["serp_item"]["rank_group"]
            url = item["ranked_serp_element"]["serp_item"]["url"]
            vol = (item["keyword_data"]["keyword_info"] or {}).get("search_volume") or 0
            cpc = (item["keyword_data"]["keyword_info"] or {}).get("cpc") or 0
            kd = (item["keyword_data"]["keyword_info"] or {}).get("competition_level") or "?"
            our_by_kw[kw] = {
                "position": pos, "url": url, "volume": vol, "cpc": cpc, "competition": kd,
            }
        except (KeyError, TypeError):
            continue

    comp_by_kw = {}
    for item in comp_kws:
        try:
            kw = item["keyword_data"]["keyword"]
            pos = item["ranked_serp_element"]["serp_item"]["rank_group"]
            vol = (item["keyword_data"]["keyword_info"] or {}).get("search_volume") or 0
            comp_by_kw[kw] = {"position": pos, "volume": vol}
        except (KeyError, TypeError):
            continue

    # Bucket A: "Almost There" — we rank 11 to 30, AZ relevant, with volume
    almost = []
    for kw, d in our_by_kw.items():
        if 11 <= d["position"] <= 30 and is_az_relevant(kw) and d["volume"] >= 10:
            almost.append((kw, d))
    almost.sort(key=lambda x: (-x[1]["volume"], x[1]["position"]))

    # Bucket B: "Top of page 2" — positions 4 to 10 we should defend / lift to 1 to 3
    on_page1 = []
    for kw, d in our_by_kw.items():
        if 4 <= d["position"] <= 10 and is_az_relevant(kw) and d["volume"] >= 10:
            on_page1.append((kw, d))
    on_page1.sort(key=lambda x: (-x[1]["volume"], x[1]["position"]))

    # Bucket C: Competitor wins we don't have at all
    gaps = []
    for kw, d in comp_by_kw.items():
        if kw in our_by_kw:
            continue
        if d["position"] > 20:
            continue
        if not is_az_relevant(kw):
            continue
        if d["volume"] < 10:
            continue
        gaps.append((kw, d["position"], d["volume"]))
    gaps.sort(key=lambda x: -x[2])

    # Markdown output
    md = [
        f"# AZ Law Now Content-Gap Ranking Analysis, {today}",
        "",
        "Source: DataForSEO Labs Google US ranked-keywords for azlawnow.com plus",
        "lernerandrowe.com (top 500 each by search volume). AZ-relevance filter:",
        "keyword contains an AZ city, an AZ statute prefix, or an injury-vertical term.",
        "",
        f"- Our total ranking keywords (top 50): **{len(our_kws)}**",
        f"- Competitor (lernerandrowe.com) ranking keywords: **{len(comp_kws)}**",
        f"- Almost-there (we rank 11 to 30, lift to top 10): **{len(almost)}**",
        f"- Defend page-1 (we rank 4 to 10, push to top 3): **{len(on_page1)}**",
        f"- Pure gaps (competitor ranks, we don't): **{len(gaps)}**",
        "",
        "---",
        "",
        "## Bucket A: Almost There — we rank 11 to 30, content push moves us to page 1",
        "",
        "Each row is one keyword we already rank for. Adding a section, an FAQ,",
        "or a stat block referencing the keyword usually moves position 12 to 8.",
        "",
        "| Pos | Vol | KD | Keyword | Our URL |",
        "|---:|---:|:---:|---|---|",
    ]
    for kw, d in almost[:30]:
        md.append(f"| {d['position']} | {d['volume']} | {d['competition']} | {kw} | {d['url']} |")

    md += [
        "",
        "---",
        "",
        "## Bucket B: Defend Page 1 — we rank 4 to 10, push to top 3",
        "",
        "These are the wins we already have. A schema improvement, an internal",
        "link from a higher-PR page, or a freshness update moves position 7 to 3.",
        "",
        "| Pos | Vol | KD | Keyword | Our URL |",
        "|---:|---:|:---:|---|---|",
    ]
    for kw, d in on_page1[:20]:
        md.append(f"| {d['position']} | {d['volume']} | {d['competition']} | {kw} | {d['url']} |")

    md += [
        "",
        "---",
        "",
        "## Bucket C: Pure Content Gaps — competitor ranks, we don't",
        "",
        "Each row is a keyword lernerandrowe.com ranks top-20 for that we don't",
        "rank for at all. New investigation, new legal-guide, or new client-guide",
        "page targeting the keyword.",
        "",
        "| Comp Pos | Vol | Keyword |",
        "|---:|---:|---|",
    ]
    for kw, pos, vol in gaps[:30]:
        md.append(f"| {pos} | {vol} | {kw} |")

    md += [
        "",
        "---",
        "",
        "## Recommended editorial moves",
        "",
        "1. Pick the top 5 from Bucket A. Each is a 30-minute schema or content",
        "   tweak on an existing page that lifts a 15-place keyword into the top 10.",
        "2. Pick the top 3 from Bucket B with volume above 100. These are the",
        "   highest-leverage page-1 lifts. Add a FAQ, a StatBlock, or a fresh",
        "   intro paragraph dated this month.",
        "3. From Bucket C, pick 1 to 2 keywords per beat we don't already cover.",
        "   Those become next week's investigations or guides.",
    ]

    out_path.write_text("\n".join(md))
    print(f"\n✓ Wrote {out_path}")
    print(f"  Almost there: {len(almost)} | Defend page 1: {len(on_page1)} | Gaps: {len(gaps)}")


if __name__ == "__main__":
    main()
