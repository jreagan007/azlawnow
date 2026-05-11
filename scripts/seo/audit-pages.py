#!/usr/bin/env python3
"""AZ Law Now per-page audit.

For every published MDX page, join against keyword-universe.json (DFS+GSC) and
produce:
  - Current title / description / updatedAt
  - Top 10 GSC queries firing the page (impressions, position, clicks)
  - Top DFS-ranking queries on the URL
  - Proposed new title using the "Laws" framing (see docs/seo-framing-decisions.md)
  - Proposed new description hitting top 3 query patterns
  - Staleness flag if updatedAt > 30 days
  - Cannibalization flag if a sister URL is ranking for the same queries

Outputs:
  data/research/page-audit-{date}.md   (review doc, sorted by GSC impressions)
  data/research/page-audit-{date}.json (machine-readable for batch-apply)

Inputs:
  data/research/keyword-universe.json
  src/content/**/*.mdx
"""
from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from datetime import datetime, date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
UNIVERSE = ROOT / "data" / "research" / "keyword-universe.json"
CONTENT_DIR = ROOT / "src" / "content"
SITE = "https://azlawnow.com"
TODAY = date.today()

# Framing rules per collection — see docs/seo-framing-decisions.md
FRAMING = {
    "practice-areas": "laws",       # "Arizona [X] Laws: ..."
    "legal-guides": "laws",         # "Arizona [X] Laws: ..."
    "investigations": "narrative",  # keep editorial headline
    "client-guides": "action",      # keep second-person action verb
    "glossary": "term",             # term-as-title
}

STALE_DAYS = 30


# ---------------------------------------------------------------- frontmatter

FM_RE = re.compile(r'^---\s*\n(.*?)\n---\s*\n', re.DOTALL)


def parse_frontmatter(text: str) -> dict:
    m = FM_RE.match(text)
    if not m:
        return {}
    fm: dict = {}
    for line in m.group(1).splitlines():
        m2 = re.match(r'^([a-zA-Z][a-zA-Z0-9_]*):\s*(.+?)\s*$', line)
        if not m2:
            continue
        k = m2.group(1)
        v = m2.group(2).strip().strip('"').strip("'")
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


# ---------------------------------------------------------------- universe join

def load_universe() -> dict:
    return json.loads(UNIVERSE.read_text())


def index_by_url(universe: list[dict]) -> dict[str, list[dict]]:
    """Build {normalized-url → [rows]} index from DFS our_url AND GSC gsc_url."""
    idx: dict[str, list[dict]] = defaultdict(list)
    for r in universe:
        for key in ("our_url", "gsc_url"):
            u = r.get(key)
            if not u:
                continue
            base = u.split("?")[0].rstrip("/")
            # Avoid double-adding the same row to the same URL
            existing = idx.get(base, [])
            if r not in existing:
                idx[base].append(r)
    return idx


# ---------------------------------------------------------------- proposal logic

LEGAL_VERTICAL_TOKENS = {
    "law", "laws", "statute", "ars",
    "claim", "claims", "settlement", "compensation", "damages",
    "deadline", "notice", "immunity", "fault", "comparative",
    "liability", "negligence", "duty",
}

# Map common practice-area slugs to "Laws topic" phrasing
PA_LAWS_TOPIC = {
    "car-accidents":         "Car Accident",
    "truck-accidents":       "Truck Accident",
    "motorcycle-accidents":  "Motorcycle",
    "bicycle-accidents":     "Bicycle Accident",
    "bus-accidents":         "Bus Accident",
    "rideshare-accidents":   "Rideshare Accident",
    "pedestrian-accidents":  "Pedestrian Accident",
    "child-abuse":           "Child Abuse",
    "school-abuse":          "School Abuse",
    "daycare-negligence":    "Daycare Negligence",
    "elder-abuse":           "Elder Abuse",
    "nursing-home-abuse":    "Nursing Home Abuse",
    "medical-negligence":    "Medical Negligence",
    "dog-bite":              "Dog Bite",
    "slip-and-fall":         "Slip and Fall",
    "premises-liability":    "Premises Liability",
    "wrongful-death":        "Wrongful Death",
}


def extract_hooks(top_queries: list[dict]) -> list[str]:
    """Find distinctive hook phrases from queries — ARS statutes, deadline numbers,
    specific case types — for the Laws-pattern subtitle."""
    hooks = []
    seen = set()
    for q in top_queries:
        text = q["query"].lower()
        # ARS statute extraction
        m = re.search(r"\b(ars\s*\d{1,2}[-\s]?\d{3,5}(?:\.\d+)?)\b", text)
        if m and m.group(1).upper() not in seen:
            hooks.append(m.group(1).upper().replace(" ", " "))
            seen.add(m.group(1).upper())
        # Deadlines / day counts
        m = re.search(r"\b(\d{2,4})[-\s]?day\b", text)
        if m and f"{m.group(1)}-day" not in seen:
            hooks.append(f"{m.group(1)}-Day Deadline")
            seen.add(f"{m.group(1)}-day")
        # Common hook words
        for kw in ("comparative", "no-fault", "immunity", "settlement",
                   "deadline", "calculator", "notice of claim", "uninsured"):
            if kw in text and kw not in seen:
                hooks.append(kw.title())
                seen.add(kw)
        if len(hooks) >= 4:
            break
    return hooks


def propose_title(page: dict, top_queries: list[dict]) -> str:
    collection = page["collection"]
    slug = page["slug"]
    current = page.get("title", "")

    framing = FRAMING.get(collection, "term")

    if framing == "narrative":
        # Investigations — leave alone
        return current
    if framing == "action":
        # Client-guides — leave alone
        return current
    if framing == "term":
        return current

    # Laws framing for practice-areas + legal-guides
    if collection == "practice-areas":
        topic = PA_LAWS_TOPIC.get(slug, slug.replace("-", " ").title())
        hooks = extract_hooks(top_queries)
        # Take 2-3 hooks if available
        if hooks:
            hook_str = " + ".join(hooks[:2])
            return f"Arizona {topic} Laws: {hook_str}"
        return f"Arizona {topic} Laws"

    if collection == "legal-guides":
        # Legal-guide titles often already match "Arizona X Law" — preserve title
        # but ensure it's "Laws" plural and has a colon-hook
        cur = re.sub(r"\s*\|\s*AZ Law Now\s*$", "", current).strip()
        # If already follows pattern, keep
        if re.search(r"Arizona .+ Laws?:", cur, re.I):
            return cur
        # Try to derive from slug
        cleaned = slug.replace("-law", "").replace("arizona-", "")
        topic = cleaned.replace("-", " ").title()
        hooks = extract_hooks(top_queries)
        if hooks:
            return f"Arizona {topic} Laws: {' + '.join(hooks[:2])}"
        return f"Arizona {topic} Laws"

    return current


def propose_description(page: dict, top_queries: list[dict]) -> str:
    collection = page["collection"]
    current = page.get("description", "")

    framing = FRAMING.get(collection, "term")
    if framing in ("narrative", "action", "term"):
        return current

    # Practice-areas / legal-guides — build new description from top queries
    if not top_queries:
        return current

    top_phrase = top_queries[0]["query"]
    hooks = extract_hooks(top_queries)

    # Build: "Arizona [topic] laws explained: [hook 1]; [hook 2]. [proof point]. (602) 654-0202."
    slug = page["slug"]
    if collection == "practice-areas":
        topic = PA_LAWS_TOPIC.get(slug, slug.replace("-", " "))
        intro = f"Arizona {topic.lower()} laws explained:"
    else:
        cleaned = slug.replace("-law", "").replace("arizona-", "").replace("-", " ")
        intro = f"Arizona {cleaned} laws explained:"

    # Add 1-2 hook phrases from queries
    hook_part = ""
    if hooks:
        hook_part = " " + ", ".join(hooks[:2]) + "."
    elif top_phrase:
        hook_part = f" Covers {top_phrase}."

    intake = " Statewide intake (602) 654-0202."

    proposed = (intro + hook_part + intake).strip()
    # Cap at ~160 chars per SEO best practice
    if len(proposed) > 160:
        proposed = proposed[:157].rstrip() + "..."
    return proposed


# ---------------------------------------------------------------- main

def main() -> None:
    if not UNIVERSE.exists():
        sys.exit(f"Missing {UNIVERSE}")

    universe = load_universe()["rows"]
    by_url = index_by_url(universe)

    pages = []
    for col_dir in sorted(CONTENT_DIR.iterdir()):
        if not col_dir.is_dir() or col_dir.name == "research":
            continue
        for mdx in sorted(col_dir.glob("*.mdx")):
            text = mdx.read_text()
            fm = parse_frontmatter(text)
            slug = mdx.stem
            url = url_for(col_dir.name, slug)
            key = url.rstrip("/")

            rows = by_url.get(key, [])
            # GSC top
            gsc_rows = [r for r in rows if (r.get("gsc_impressions_28d") or 0) > 0]
            gsc_rows.sort(key=lambda r: -(r.get("gsc_impressions_28d") or 0))

            # DFS top (ranking <= 100)
            dfs_rows = [r for r in rows if r.get("our_position") is not None]
            dfs_rows.sort(key=lambda r: r["our_position"])

            total_impr = sum((r.get("gsc_impressions_28d") or 0) for r in gsc_rows)
            total_clk = sum((r.get("gsc_clicks_28d") or 0) for r in gsc_rows)

            # Staleness
            updated_str = fm.get("updatedAt") or fm.get("publishedAt")
            stale_days = None
            stale = False
            if updated_str:
                try:
                    upd = datetime.strptime(updated_str, "%Y-%m-%d").date()
                    stale_days = (TODAY - upd).days
                    stale = stale_days > STALE_DAYS
                except ValueError:
                    pass

            top_for_proposal = gsc_rows[:10] or dfs_rows[:10]

            page = {
                "file": str(mdx.relative_to(ROOT)),
                "url": url,
                "collection": col_dir.name,
                "slug": slug,
                "title": fm.get("title", ""),
                "description": fm.get("description", ""),
                "updatedAt": updated_str,
                "stale_days": stale_days,
                "stale": stale,
                "total_impr_28d": total_impr,
                "total_clicks_28d": total_clk,
                "ctr_28d": (total_clk / total_impr) if total_impr else 0.0,
                "top_gsc": [
                    {"query": r["query"],
                     "impressions": r.get("gsc_impressions_28d") or 0,
                     "clicks": r.get("gsc_clicks_28d") or 0,
                     "position": r.get("gsc_position_28d")}
                    for r in gsc_rows[:10]
                ],
                "top_dfs": [
                    {"query": r["query"],
                     "position": r["our_position"],
                     "volume": r.get("search_volume") or 0}
                    for r in dfs_rows[:5]
                ],
                "proposed_title": "",
                "proposed_description": "",
            }
            page["proposed_title"] = propose_title(page, top_for_proposal)
            page["proposed_description"] = propose_description(page, top_for_proposal)
            page["title_changed"] = page["proposed_title"] != page["title"]
            page["description_changed"] = page["proposed_description"] != page["description"]
            pages.append(page)

    # Sort by GSC impressions desc — biggest opportunities first
    pages.sort(key=lambda p: -p["total_impr_28d"])

    today = TODAY.strftime("%Y-%m-%d")
    json_path = ROOT / "data" / "research" / f"page-audit-{today}.json"
    md_path = ROOT / "data" / "research" / f"page-audit-{today}.md"

    json_path.write_text(json.dumps({
        "generated_at": today,
        "framing_doc": "docs/seo-framing-decisions.md",
        "page_count": len(pages),
        "pages": pages,
    }, indent=2))

    # --- markdown review doc ---
    md = [
        f"# AZ Law Now — Per-Page Audit ({today})",
        "",
        f"Source: `data/research/keyword-universe.json` joined to `{CONTENT_DIR.relative_to(ROOT)}/*.mdx`.",
        f"Framing rules: `docs/seo-framing-decisions.md` (Laws-not-Lawyer for practice-areas + legal-guides).",
        "",
        f"- Pages audited: **{len(pages)}**",
        f"- Pages with GSC impressions (28d): **{sum(1 for p in pages if p['total_impr_28d'] > 0)}**",
        f"- Pages with proposed title change: **{sum(1 for p in pages if p['title_changed'])}**",
        f"- Pages with proposed description change: **{sum(1 for p in pages if p['description_changed'])}**",
        f"- Stale pages (>{STALE_DAYS} days since updatedAt): **{sum(1 for p in pages if p['stale'])}**",
        "",
        "Pages sorted by GSC impressions (last 28 days) — biggest opportunity first.",
        "",
        "---",
        "",
    ]
    for p in pages:
        if p["total_impr_28d"] == 0 and not (p["title_changed"] or p["description_changed"]):
            continue  # skip pages with no data + no proposed changes
        url_short = p["url"].replace(SITE, "")
        stale_tag = f" 🟡 stale {p['stale_days']}d" if p["stale"] else ""
        md += [
            f"## `{url_short}` — impr {p['total_impr_28d']} · clicks {p['total_clicks_28d']} · CTR {p['ctr_28d']*100:.2f}%{stale_tag}",
            "",
            f"**File:** `{p['file']}`",
            f"**Collection:** {p['collection']}  ·  **updatedAt:** {p['updatedAt'] or '—'}",
            "",
            "### Current",
            f"- **Title:** `{p['title']}`",
            f"- **Description:** {p['description']}",
            "",
        ]
        if p["title_changed"]:
            md += [
                "### Proposed (Laws framing)",
                f"- **Title:** `{p['proposed_title']}`",
            ]
        if p["description_changed"]:
            md += [
                f"- **Description:** {p['proposed_description']}",
                "",
            ]
        else:
            md += [""]

        if p["top_gsc"]:
            md += [
                "### Top GSC queries (28d)",
                "",
                "| Impr | Pos | Clk | Query |",
                "|---:|---:|---:|---|",
            ]
            for q in p["top_gsc"]:
                pos = f"{q['position']:.1f}" if q["position"] else "—"
                md.append(f"| {q['impressions']} | {pos} | {q['clicks']} | {q['query']} |")
            md.append("")

        if p["top_dfs"]:
            md += [
                "### Top DFS rankings",
                "",
                "| Pos | Vol | Query |",
                "|---:|---:|---|",
            ]
            for q in p["top_dfs"]:
                md.append(f"| {q['position']} | {q['volume']} | {q['query']} |")
            md.append("")

        md.append("---")
        md.append("")

    md_path.write_text("\n".join(md))

    print(f"\n✓ Wrote {json_path.relative_to(ROOT)}")
    print(f"✓ Wrote {md_path.relative_to(ROOT)}")
    print(f"\n=== Audit summary ===")
    print(f"  Pages audited:                {len(pages)}")
    print(f"  With GSC impressions (28d):   {sum(1 for p in pages if p['total_impr_28d'] > 0)}")
    print(f"  Proposed title changes:       {sum(1 for p in pages if p['title_changed'])}")
    print(f"  Proposed description changes: {sum(1 for p in pages if p['description_changed'])}")
    print(f"  Stale pages:                  {sum(1 for p in pages if p['stale'])}")
    # Top 10 by impressions
    print(f"\n  Top 10 by GSC impressions (28d):")
    for p in pages[:10]:
        print(f"    {p['total_impr_28d']:>5} impr  ctr {p['ctr_28d']*100:>5.2f}%  {p['url'].replace(SITE,'')}")


if __name__ == "__main__":
    main()
