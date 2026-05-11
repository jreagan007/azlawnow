#!/usr/bin/env python3
"""AZ Law Now structural cannibalization scan.

Detects queries in the keyword universe where TWO OR MORE of our published
pages plausibly target the same query. Two detection modes:

  STRUCTURAL (default, no API spend):
    Walks src/content/{practice-areas,investigations,legal-guides,client-guides,glossary}
    and src/pages/*.astro to enumerate every published URL with its title/slug
    tokens. For each universe query, scores each URL by token-overlap with the
    title/slug. Queries with >=2 URLs scoring above the threshold are flagged.
    Bonus pass: where DFS shows a legacy-flat URL ranking AND a newer collection
    URL exists with strong title overlap, flag as a 301-merge candidate.

  SERP-CONFIRM (opt-in, --confirm N):
    For the top N flagged queries, hit DataForSEO serp/google/organic/live and
    confirm whether 2+ azlawnow.com URLs actually appear in the top 30.
    Costs ~ $0.0006/SERP per DFS pricing. 50 SERPs = ~$0.03.

Inputs:
    data/research/keyword-universe.json
    src/content/**/*.mdx, src/pages/*.astro

Output:
    data/research/cannibalization-{date}.md
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import re
import sys
import urllib.request
from collections import defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
UNIVERSE_PATH = ROOT / "data" / "research" / "keyword-universe.json"
CONTENT_DIR = ROOT / "src" / "content"
PAGES_DIR = ROOT / "src" / "pages"
SITE = "https://azlawnow.com"

# ---------------------------------------------------------------- env / auth (optional, only for --confirm)

def _load_env_files() -> None:
    candidates = [
        os.path.expanduser("~/Projects/taqtics-ops/config/.env"),
        os.path.expanduser("~/Projects/taqticscom/.env"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../.env"),
    ]
    for p in candidates:
        if not os.path.exists(p):
            continue
        for line in open(p):
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


_load_env_files()


# ---------------------------------------------------------------- URL inventory

STOP = set("a an and the of in on for to with from by at as is are be or not no how what why "
           "when where do does after before about my your our their this that these those "
           "i ii iii new arizona az "
           # generic legal-services tokens — common to every practice-area title,
           # would inflate overlap scores on noise queries
           "lawyer lawyers attorney attorneys law firm firms legal accident accidents "
           "injury injuries victim near me".split())


def tokens(s: str) -> set[str]:
    s = s.lower()
    s = re.sub(r"[^a-z0-9\s]+", " ", s)
    return {t for t in s.split() if t and t not in STOP and len(t) > 2}


def parse_frontmatter(text: str) -> dict:
    """Tiny YAML-frontmatter parser — handles top-level scalar keys only."""
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
    if head == "":
        return f"{SITE}/{slug}/"
    return f"{SITE}/{head}/{slug}/"


CITY_SLUGS = {
    "phoenix", "mesa", "tempe", "scottsdale", "chandler", "buckeye",
    "goodyear", "avondale", "maricopa",
}


def inventory_urls() -> list[dict]:
    """Return list of {url, collection, slug, title, tokens}."""
    inv = []
    for col_dir in CONTENT_DIR.iterdir():
        if not col_dir.is_dir():
            continue
        for mdx in col_dir.glob("*.mdx"):
            text = mdx.read_text()
            fm = parse_frontmatter(text)
            slug = mdx.stem
            title = fm.get("title") or fm.get("heroTitle") or slug
            inv.append({
                "url": url_for(col_dir.name, slug),
                "collection": col_dir.name,
                "slug": slug,
                "title": title,
                "tokens": tokens(title) | tokens(slug.replace("-", " ")),
            })
    # city pages (single-file astro pages at /<city>/)
    for astro in PAGES_DIR.glob("*.astro"):
        slug = astro.stem
        if slug in CITY_SLUGS:
            inv.append({
                "url": f"{SITE}/{slug}/",
                "collection": "city",
                "slug": slug,
                "title": f"{slug.title()} Arizona Injury Lawyer",
                "tokens": tokens(slug) | {"arizona", "lawyer", "attorney"},
            })
    return inv


# ---------------------------------------------------------------- structural scan

def score_overlap(query_toks: set[str], url_toks: set[str]) -> int:
    """Return integer overlap count (after stop removal)."""
    return len(query_toks & url_toks)


def find_candidates(universe: list[dict], inv: list[dict], min_overlap: int = 2,
                    min_volume: int = 10, ranking_only: bool = True) -> list[dict]:
    """For each query, find URLs whose tokens overlap the query.

    ranking_only=True (default) — only flag queries where we actually rank somewhere.
    Otherwise we get noise from generic-overlap on queries we don't compete on.
    """
    flagged = []
    for row in universe:
        q = row["query"]
        vol = row.get("search_volume", 0) or 0
        if vol < min_volume:
            continue
        if ranking_only and row.get("our_position") is None:
            continue
        q_toks = tokens(q)
        if len(q_toks) < 2:
            continue
        matches = []
        for u in inv:
            o = score_overlap(q_toks, u["tokens"])
            if o >= min_overlap:
                matches.append({
                    "url": u["url"], "collection": u["collection"],
                    "title": u["title"], "overlap": o,
                })
        if len(matches) < 2:
            continue
        matches.sort(key=lambda m: -m["overlap"])
        flagged.append({
            "query": q,
            "search_volume": vol,
            "our_position": row.get("our_position"),
            "our_url_dfs": row.get("our_url"),
            "our_collection_dfs": row.get("our_collection"),
            "intent": row.get("intent"),
            "az_relevant": row.get("az_relevant"),
            "match_count": len(matches),
            "matches": matches[:5],
        })
    flagged.sort(key=lambda f: -f["search_volume"])
    return flagged


# ---------------------------------------------------------------- legacy-flat merge candidates

def find_legacy_redirect_candidates(universe: list[dict], inv: list[dict]) -> list[dict]:
    """Legacy flat-slug URL ranks, but a newer collection page targets same topic."""
    by_token_set = defaultdict(list)
    for u in inv:
        by_token_set[frozenset(u["tokens"])].append(u)
    cands = []
    for row in universe:
        if row.get("our_collection") != "legacy-flat":
            continue
        ranking_url = row.get("our_url")
        if not ranking_url:
            continue
        slug = ranking_url.rstrip("/").split("/")[-1]
        slug_toks = tokens(slug.replace("-", " "))
        if len(slug_toks) < 2:
            continue
        # find inv items with high token overlap
        best = []
        for u in inv:
            if u["url"].rstrip("/") == ranking_url.rstrip("/"):
                continue
            o = len(slug_toks & u["tokens"])
            if o >= max(2, len(slug_toks) // 2):
                best.append((o, u))
        if not best:
            continue
        best.sort(key=lambda x: -x[0])
        cands.append({
            "legacy_url": ranking_url,
            "query": row["query"],
            "our_position": row.get("our_position"),
            "search_volume": row.get("search_volume"),
            "best_canonical": best[0][1]["url"],
            "best_canonical_collection": best[0][1]["collection"],
            "best_canonical_title": best[0][1]["title"],
            "overlap": best[0][0],
        })
    cands.sort(key=lambda c: -(c.get("search_volume") or 0))
    # dedupe by (legacy_url, best_canonical)
    seen = set()
    out = []
    for c in cands:
        k = (c["legacy_url"], c["best_canonical"])
        if k in seen:
            continue
        seen.add(k)
        out.append(c)
    return out


# ---------------------------------------------------------------- SERP confirm (opt-in)

def confirm_serp(queries: list[str]) -> dict[str, list[str]]:
    LOGIN = os.environ.get("DATAFORSEO_LOGIN")
    PASSWORD = os.environ.get("DATAFORSEO_PASSWORD")
    if not (LOGIN and PASSWORD):
        sys.stderr.write("ERROR: DATAFORSEO creds missing for --confirm\n")
        return {}
    auth = base64.b64encode(f"{LOGIN}:{PASSWORD}".encode()).decode()
    out: dict[str, list[str]] = {}
    for q in queries:
        body = [{
            "keyword": q,
            "language_code": "en",
            "location_code": 2840,
            "depth": 30,
            "device": "desktop",
        }]
        req = urllib.request.Request(
            "https://api.dataforseo.com/v3/serp/google/organic/live/regular",
            data=json.dumps(body).encode(),
            headers={"Authorization": f"Basic {auth}", "Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                data = json.loads(r.read().decode())
            items = data["tasks"][0]["result"][0]["items"] or []
            urls = []
            for it in items:
                u = it.get("url") or ""
                if "azlawnow.com" in u:
                    urls.append(u)
            out[q] = urls
            print(f"  [{q[:50]:50}] {len(urls)} of our URLs in top 30")
        except Exception as e:
            print(f"  [{q[:50]:50}] FAILED {e}")
            out[q] = []
    return out


# ---------------------------------------------------------------- main

def write_markdown(flagged: list[dict], legacy: list[dict], confirmed: dict, today: str) -> Path:
    out_path = ROOT / "data" / "research" / f"cannibalization-{today}.md"
    md = [
        f"# AZ Law Now Cannibalization Scan — {today}",
        "",
        "Source: `data/research/keyword-universe.json` + structural title/slug overlap.",
        "Two flag types: (1) **Structural** — multiple of our pages topically target the same query.",
        "(2) **Legacy-flat** — a pre-IA flat-slug URL is the one ranking, but a newer collection page exists.",
        "",
        f"- Structural cannibalization candidates: **{len(flagged)}**",
        f"- Legacy 301-merge candidates: **{len(legacy)}**",
        "",
        "---",
        "",
        "## 1. Structural cannibalization — multiple pages target same query",
        "",
        "Each row: a query where 2+ of our published pages have strong title/slug overlap.",
        "Picks the most senior page as canonical and redirects/de-optimizes the rest.",
        "",
    ]
    # Group by cluster lookahead — just show top 40 by volume
    md += [
        "| Vol | Pos | Query | # URLs | Top matches |",
        "|---:|---:|---|---:|---|",
    ]
    for f in flagged[:40]:
        urls_short = "<br>".join(
            f"`/{m['collection']}/` — {m['title'][:55]}" for m in f["matches"][:3]
        )
        pos = f["our_position"] or "—"
        md.append(f"| {f['search_volume']} | {pos} | {f['query']} | {f['match_count']} | {urls_short} |")

    md += [
        "",
        "---",
        "",
        "## 2. Legacy-flat 301-merge candidates",
        "",
        "DFS shows a legacy flat-slug URL (pre-IA) ranking, and a newer collection page",
        "covers the same topic. These are 301-redirect candidates — consolidate the link",
        "equity onto the canonical page in the new IA.",
        "",
        "| Vol | Pos | Query | Legacy URL (ranking) | → Canonical |",
        "|---:|---:|---|---|---|",
    ]
    for c in legacy[:30]:
        leg = c["legacy_url"].replace(SITE, "")
        can = c["best_canonical"].replace(SITE, "")
        vol = c.get("search_volume") or 0
        pos = c.get("our_position") or "—"
        md.append(f"| {vol} | {pos} | {c['query']} | `{leg}` | `{can}` ({c['best_canonical_collection']}) |")

    if confirmed:
        md += [
            "",
            "---",
            "",
            "## 3. SERP-confirmed cannibalization (top N from above)",
            "",
            "For each query, the actual azlawnow.com URLs Google surfaces in top 30.",
            "2+ URLs = confirmed live cannibalization.",
            "",
            "| Query | URLs ranking |",
            "|---|---|",
        ]
        for q, urls in confirmed.items():
            if len(urls) < 2:
                continue
            urls_short = "<br>".join(u.replace(SITE, "") for u in urls)
            md.append(f"| {q} | {urls_short} |")

    md += [
        "",
        "---",
        "",
        "## Recommended next moves",
        "",
        "1. **Legacy 301-merge** (section 2) — pick the top 10 by volume, redirect the",
        "   legacy URL to the canonical collection page. Keeps link equity, removes",
        "   internal SERP competition.",
        "2. **Structural review** (section 1) — for each query where 3+ pages match,",
        "   declare a canonical and tighten the others (de-emphasize keyword in title,",
        "   remove H2s targeting it, or merge content).",
        "3. **Run `--confirm 50`** on the top-volume structural candidates to verify",
        "   which are actually cannibalizing in the live SERP vs. just topical overlap.",
    ]
    out_path.write_text("\n".join(md))
    return out_path


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--min-overlap", type=int, default=2)
    ap.add_argument("--min-volume", type=int, default=10)
    ap.add_argument("--confirm", type=int, default=0,
                    help="run SERP confirm on top N candidates (costs ~$0.0006 each)")
    args = ap.parse_args()

    if not UNIVERSE_PATH.exists():
        sys.exit(f"Missing {UNIVERSE_PATH}. Run build-keyword-universe.py first.")

    universe = json.loads(UNIVERSE_PATH.read_text())["rows"]
    inv = inventory_urls()
    print(f"Loaded {len(universe)} universe rows, {len(inv)} published URLs")

    flagged = find_candidates(universe, inv, args.min_overlap, args.min_volume)
    legacy = find_legacy_redirect_candidates(universe, inv)
    print(f"  Structural candidates: {len(flagged)}")
    print(f"  Legacy 301-merge candidates: {len(legacy)}")

    confirmed = {}
    if args.confirm > 0:
        top_queries = [f["query"] for f in flagged[:args.confirm]]
        print(f"\nRunning SERP confirm on top {len(top_queries)} queries...")
        confirmed = confirm_serp(top_queries)

    today = datetime.now().strftime("%Y-%m-%d")
    out = write_markdown(flagged, legacy, confirmed, today)
    print(f"\n✓ Wrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
