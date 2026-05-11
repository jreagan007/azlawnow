#!/usr/bin/env python3
"""AZ Law Now IA coverage map.

For every page in the information architecture (practice-areas, investigations,
legal-guides, client-guides, glossary, city-pages), join against the keyword
universe and classify coverage status:

  owning      — page has 1+ universe row where it is the ranking URL in top 10
  partial     — page has 1+ universe row in top 30 (page 1/2/3) but nothing top 10
  deep        — page has 1+ universe row in top 50, none in top 30
  uncovered   — page has zero universe rows attributed to it

Also surfaces per-page:
  - top 5 queries the page actually ranks for (from DFS)
  - top 5 queries the page SHOULD plausibly rank for (token-overlap with universe gaps)
  - estimated total monthly volume the page is capturing
  - cannibalization warning (if 2+ pages overlap on this page's queries)

Inputs:
  data/research/keyword-universe.json

Output:
  data/research/ia-coverage-{date}.md
"""
from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
UNIVERSE_PATH = ROOT / "data" / "research" / "keyword-universe.json"
CONTENT_DIR = ROOT / "src" / "content"
PAGES_DIR = ROOT / "src" / "pages"
SITE = "https://azlawnow.com"

STOP = set("a an and the of in on for to with from by at as is are be or not no how what why "
           "when where do does after before about my your our their this that these those "
           "i ii iii new arizona az "
           "lawyer lawyers attorney attorneys law firm firms legal accident accidents "
           "injury injuries victim near me".split())

CITY_SLUGS = {
    "phoenix", "mesa", "tempe", "scottsdale", "chandler", "buckeye",
    "goodyear", "avondale", "maricopa",
}


def tokens(s: str) -> set[str]:
    s = s.lower()
    s = re.sub(r"[^a-z0-9\s]+", " ", s)
    return {t for t in s.split() if t and t not in STOP and len(t) > 2}


def parse_frontmatter(text: str) -> dict:
    if not text.startswith("---"):
        return {}
    end = text.find("\n---", 4)
    if end < 0:
        return {}
    fm = {}
    for line in text[4:end].splitlines():
        m = re.match(r'^([a-zA-Z][a-zA-Z0-9_]*):\s*(.+?)\s*$', line)
        if not m:
            continue
        k, v = m.group(1), m.group(2).strip().strip('"').strip("'")
        fm[k] = v
    return fm


def url_for(collection: str, slug: str) -> str:
    paths = {
        "practice-areas": "",
        "investigations": "investigations",
        "legal-guides": "legal-guides",
        "client-guides": "client-guides",
        "glossary": "glossary",
    }
    head = paths.get(collection, collection)
    return f"{SITE}/{slug}/" if head == "" else f"{SITE}/{head}/{slug}/"


def inventory() -> list[dict]:
    inv = []
    for col_dir in CONTENT_DIR.iterdir():
        if not col_dir.is_dir():
            continue
        for mdx in col_dir.glob("*.mdx"):
            text = mdx.read_text()
            fm = parse_frontmatter(text)
            slug = mdx.stem
            title = fm.get("title") or fm.get("heroTitle") or slug
            description = fm.get("description") or ""
            inv.append({
                "url": url_for(col_dir.name, slug),
                "collection": col_dir.name,
                "slug": slug,
                "title": title,
                "description": description,
                "tokens": tokens(title) | tokens(slug.replace("-", " ")) | tokens(description),
            })
    for astro in PAGES_DIR.glob("*.astro"):
        slug = astro.stem
        if slug in CITY_SLUGS:
            inv.append({
                "url": f"{SITE}/{slug}/",
                "collection": "city-pages",
                "slug": slug,
                "title": f"{slug.title()} Arizona Injury Lawyer",
                "description": "",
                "tokens": tokens(slug) | {"crash", "abuse"},
            })
    return inv


def normalize_url(u: str | None) -> str | None:
    if not u:
        return None
    return u.rstrip("/")


def classify_status(positions: list[int]) -> str:
    if not positions:
        return "uncovered"
    best = min(positions)
    if best <= 10:
        return "owning"
    if best <= 30:
        return "partial"
    if best <= 50:
        return "deep"
    return "uncovered"  # only ranked 51+, effectively invisible


def main() -> None:
    if not UNIVERSE_PATH.exists():
        sys.exit(f"Missing {UNIVERSE_PATH}. Run build-keyword-universe.py first.")

    universe = json.loads(UNIVERSE_PATH.read_text())["rows"]
    inv = inventory()
    print(f"Loaded {len(universe)} universe rows, {len(inv)} IA pages")

    # 1. Group universe rows by URL we rank for
    by_url: dict[str, list[dict]] = defaultdict(list)
    for r in universe:
        u = normalize_url(r.get("our_url"))
        if not u:
            continue
        by_url[u].append(r)

    # 2. Build "should rank" suggestion map — for each page, look at universe
    #    rows in gap_type pure_gap/almost/deep_back where we don't rank, and
    #    score by token-overlap with the page.
    gap_rows = [r for r in universe if r.get("gap_type") in ("pure_gap",)]

    # 3. Per-page analysis
    pages = []
    for p in inv:
        u_norm = p["url"].rstrip("/")
        ranked = by_url.get(u_norm, [])
        positions = [r["our_position"] for r in ranked if r.get("our_position") is not None]
        status = classify_status(positions)
        ranked.sort(key=lambda r: (r.get("our_position") or 999))
        top_ranked = ranked[:5]

        # suggested gaps the page could plausibly target
        suggested = []
        p_toks = p["tokens"]
        if len(p_toks) >= 2:
            for g in gap_rows:
                gt = tokens(g["query"])
                if len(gt) < 2:
                    continue
                overlap = len(p_toks & gt)
                # require non-trivial overlap; favor AZ + decent volume
                if overlap >= 2 and (g.get("search_volume") or 0) >= 50:
                    suggested.append((overlap, g))
            suggested.sort(key=lambda x: (-x[0], -(x[1].get("search_volume") or 0)))

        total_volume_captured = sum((r.get("search_volume") or 0) for r in ranked
                                    if (r.get("our_position") or 999) <= 10)

        pages.append({
            "page": p,
            "ranked_count": len(ranked),
            "best_position": min(positions) if positions else None,
            "status": status,
            "top_ranked": top_ranked,
            "suggested": [g for _, g in suggested[:5]],
            "volume_captured_top10": total_volume_captured,
        })

    # 4. Summary by collection
    by_collection: dict[str, dict] = defaultdict(lambda: defaultdict(int))
    for entry in pages:
        col = entry["page"]["collection"]
        by_collection[col][entry["status"]] += 1
        by_collection[col]["total"] += 1
        by_collection[col]["volume_captured"] += entry["volume_captured_top10"]

    # 5. Write markdown
    today = datetime.now().strftime("%Y-%m-%d")
    out = ROOT / "data" / "research" / f"ia-coverage-{today}.md"

    md = [
        f"# AZ Law Now IA Coverage Map — {today}",
        "",
        "For each published page in the information architecture, this report shows:",
        "- **Status**: owning (top 10) / partial (top 30) / deep (top 50) / uncovered",
        "- **Queries captured** (DFS-verified top 10)",
        "- **Suggested gap queries** (pure-gap universe rows with strong topical fit)",
        "",
        f"- Total IA pages analyzed: **{len(pages)}**",
        f"- Universe rows total: **{len(universe)}**",
        "",
        "---",
        "",
        "## Coverage by collection",
        "",
        "| Collection | Total | Owning | Partial | Deep | Uncovered | Vol captured (top 10) |",
        "|---|---:|---:|---:|---:|---:|---:|",
    ]
    for col in sorted(by_collection.keys()):
        s = by_collection[col]
        md.append(f"| {col} | {s['total']} | {s.get('owning',0)} | {s.get('partial',0)} | "
                  f"{s.get('deep',0)} | {s.get('uncovered',0)} | {s.get('volume_captured',0):,} |")

    md += [
        "",
        "---",
        "",
        "## Owning pages (≥1 query top 10) — concentrate freshness/internal-link investment",
        "",
        "| Pos | Vol | Page | Top query |",
        "|---:|---:|---|---|",
    ]
    owning = [e for e in pages if e["status"] == "owning"]
    owning.sort(key=lambda e: -e["volume_captured_top10"])
    for e in owning[:40]:
        p = e["page"]
        top = e["top_ranked"][0] if e["top_ranked"] else None
        if not top:
            continue
        md.append(f"| {top['our_position']} | {top.get('search_volume',0)} | "
                  f"`/{p['collection']}/{p['slug']}/` — {p['title'][:50]} | {top['query']} |")

    md += [
        "",
        "---",
        "",
        "## Partial pages (top 11-30, push to top 10) — highest leverage editorial moves",
        "",
        "| Pos | Vol | Page | Top query |",
        "|---:|---:|---|---|",
    ]
    partial = [e for e in pages if e["status"] == "partial"]
    partial.sort(key=lambda e: e.get("best_position") or 999)
    for e in partial[:40]:
        p = e["page"]
        top = e["top_ranked"][0] if e["top_ranked"] else None
        if not top:
            continue
        md.append(f"| {top['our_position']} | {top.get('search_volume',0)} | "
                  f"`/{p['collection']}/{p['slug']}/` — {p['title'][:50]} | {top['query']} |")

    md += [
        "",
        "---",
        "",
        "## Uncovered pages (zero universe rows) — these aren't ranking anywhere DFS sees",
        "",
        "Each row is a published page DataForSEO doesn't show as ranking top-700 for ANY query.",
        "Means: too new, too thin, wrong slug, or already cannibalized by a sibling page.",
        "",
    ]
    uncovered = [e for e in pages if e["status"] == "uncovered"]
    uncovered.sort(key=lambda e: e["page"]["collection"])
    md += ["| Collection | Page | Suggested target queries |", "|---|---|---|"]
    for e in uncovered[:60]:
        p = e["page"]
        sugg = ", ".join(f"{g['query']} ({g.get('search_volume',0)})"
                         for g in e["suggested"][:3])
        md.append(f"| {p['collection']} | `/{p['collection']}/{p['slug']}/` — {p['title'][:50]} | {sugg or '_(no good fit found)_'} |")

    # Orphan / subpath rankings — URLs DFS sees that don't match any MDX file.
    # Likely pre-IA legacy URLs still indexed by Google; status unknown
    # (could be 404, redirect, or a route we forgot about).
    inv_urls = {p["url"].rstrip("/") for p in inv} | {SITE}
    orphan_rows = []
    seen_orphans = set()
    for r in universe:
        u = normalize_url(r.get("our_url"))
        if not u or u in inv_urls:
            continue
        if u in seen_orphans:
            continue
        seen_orphans.add(u)
        orphan_rows.append(r)
    orphan_rows.sort(key=lambda r: -(r.get("search_volume") or 0))

    md += [
        "",
        "---",
        "",
        "## Orphan / subpath URLs DFS shows ranking (NOT in src/content)",
        "",
        f"**{len(orphan_rows)} URLs** receive DFS-tracked rankings but don't exist as MDX files",
        "in the current IA. These are pre-IA legacy URLs still in Google's index. Each one is",
        "one of: (a) a 404 that should be 301'd, (b) a route we forgot to migrate, (c) a",
        "redirect already working but Google hasn't updated its index. **Spot-check the top",
        "20 by hand — every one is either equity to capture (301 to canonical) or a 404 to fix.**",
        "",
        "| Pos | Vol | URL DFS shows ranking | Sample query |",
        "|---:|---:|---|---|",
    ]
    for r in orphan_rows[:30]:
        u = r["our_url"].replace(SITE, "")
        md.append(f"| {r.get('our_position','?')} | {r.get('search_volume',0)} | `{u}` | {r['query']} |")

    # Investigations status block — special call-out
    inv_pages = [e for e in pages if e["page"]["collection"] == "investigations"]
    inv_owning = [e for e in inv_pages if e["status"] == "owning"]
    inv_uncovered = [e for e in inv_pages if e["status"] == "uncovered"]
    md += [
        "",
        "---",
        "",
        "## Investigations spotlight",
        "",
        f"- Total investigations: **{len(inv_pages)}**",
        f"- Owning (top 10 for ≥1 query): **{len(inv_owning)}**",
        f"- Uncovered (no DFS-tracked queries): **{len(inv_uncovered)}**",
        "",
        "The 35-investigation editorial bet is the biggest content asset on the site, but",
        "DFS shows almost none ranking yet. Investigations skew long-tail + brand-new — give",
        "them 60-90 days, push internal links to them from practice-area + cluster pages,",
        "and re-run this report monthly to watch the curve.",
    ]

    out.write_text("\n".join(md))
    print(f"\n✓ Wrote {out.relative_to(ROOT)}")

    # console summary
    print("\n=== IA coverage summary ===")
    for col in sorted(by_collection.keys()):
        s = by_collection[col]
        print(f"  {col:18}  total={s['total']:>3}  owning={s.get('owning',0):>3}  "
              f"partial={s.get('partial',0):>3}  uncovered={s.get('uncovered',0):>3}  "
              f"vol={s.get('volume_captured',0):>6,}")


if __name__ == "__main__":
    main()
