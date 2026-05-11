#!/usr/bin/env python3
"""AZ Law Now content planning pipeline.

Synthesizes the keyword universe + cannibalization signals + IA coverage into
a single weekly publish queue. Four output sections:

  1. UPDATE QUEUE     — pages we already rank 11-30, push to top 10
                        (highest leverage, cheapest moves)
  2. NEW CONTENT QUEUE — universe gaps clustered into proposed page briefs
                        with suggested collection + slug + title
  3. 301-MERGE QUEUE  — legacy-flat URLs ranking but with newer canonical
                        page; redirect to consolidate equity
  4. ORPHAN AUDIT     — URLs DFS shows ranking that aren't in src/content
                        (likely 404s or untracked legacy routes)

Each row gets a priority_score (higher = do first).

Inputs:
  data/research/keyword-universe.json
  src/content/**/*.mdx

Outputs:
  data/research/content-plan-{date}.md  (human-reviewable plan)
  data/research/content-plan-{date}.json (machine-readable for downstream tools)
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


# ---------------------------------------------------------------- inventory

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
        fm[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    return fm


def url_for(collection: str, slug: str) -> str:
    paths = {"practice-areas": "", "investigations": "investigations",
             "legal-guides": "legal-guides", "client-guides": "client-guides",
             "glossary": "glossary"}
    head = paths.get(collection, collection)
    return f"{SITE}/{slug}/" if head == "" else f"{SITE}/{head}/{slug}/"


def inventory() -> list[dict]:
    inv = []
    for col_dir in CONTENT_DIR.iterdir():
        if not col_dir.is_dir():
            continue
        for mdx in col_dir.glob("*.mdx"):
            fm = parse_frontmatter(mdx.read_text())
            slug = mdx.stem
            title = fm.get("title") or fm.get("heroTitle") or slug
            inv.append({
                "url": url_for(col_dir.name, slug),
                "collection": col_dir.name,
                "slug": slug,
                "title": title,
                "tokens": tokens(title) | tokens(slug.replace("-", " ")),
            })
    for astro in PAGES_DIR.glob("*.astro"):
        slug = astro.stem
        if slug in CITY_SLUGS:
            inv.append({
                "url": f"{SITE}/{slug}/", "collection": "city-pages",
                "slug": slug, "title": f"{slug.title()} AZ",
                "tokens": tokens(slug),
            })
    # Home page (src/pages/index.astro)
    inv.append({
        "url": f"{SITE}/", "collection": "home", "slug": "",
        "title": "AZ Law Now — Arizona Injury Lawyers",
        "tokens": tokens("arizona injury lawyer accident"),
    })
    return inv


# ---------------------------------------------------------------- recommendation logic

# Map intent → likely collection target
INTENT_TO_COLLECTION = {
    "commercial": "practice-area",       # "phoenix car accident lawyer"
    "local": "city-page",                # "tempe injury lawyer"
    "navigational": "client-guide",      # "what to do after a car crash"
    "informational": "legal-guide",      # "arizona car accident law"
    "branded": "skip",                   # don't chase competitor brand queries
}

# Map cluster → existing practice-area slug (for assignment)
CLUSTER_TO_PRACTICE_AREA = {
    "vehicle-crashes": None,             # disambiguate further by tokens
    "abuse-negligence": None,
    "other-claims": None,
    "meta": None,
}

PRACTICE_AREA_TOKEN_MAP = [
    (("car", "auto", "automobile"), "car-accidents"),
    (("truck", "semi", "18", "fmcsa"), "truck-accidents"),
    (("motorcycle", "helmet", "biker"), "motorcycle-accidents"),
    (("bicycle", "bike", "cyclist"), "bicycle-accidents"),
    (("bus",), "bus-accidents"),
    (("rideshare", "uber", "lyft"), "rideshare-accidents"),
    (("pedestrian", "crosswalk", "walker"), "pedestrian-accidents"),
    (("dog", "bite"), "dog-bite"),
    (("slip", "fall"), "slip-and-fall"),
    (("premises",), "premises-liability"),
    (("nursing", "home"), "nursing-home-abuse"),
    (("elder", "elderly"), "elder-abuse"),
    (("daycare", "childcare"), "daycare-negligence"),
    (("school", "educator", "teacher"), "school-abuse"),
    (("child",), "child-abuse"),
    (("medical", "malpractice", "doctor", "hospital"), "medical-negligence"),
    (("wrongful", "death"), "wrongful-death"),
]


def map_to_practice_area(toks: set[str]) -> str | None:
    for tokens_set, pa in PRACTICE_AREA_TOKEN_MAP:
        if any(t in toks for t in tokens_set):
            return pa
    return None


# Any query that doesn't touch one of these legal-vertical tokens is off-topic.
# Catches noise like "lifetime fitness scottsdale" or "lowe's phoenix" which show
# up as AZ-relevant + commercial intent but have nothing to do with PI law.
LEGAL_VERTICAL_TOKENS = {
    "lawyer", "lawyers", "attorney", "attorneys", "firm", "firms",
    "law", "legal", "statute", "statutes", "ars",
    "lawsuit", "lawsuits", "claim", "claims", "settlement", "settlements",
    "damages", "compensation", "verdict", "verdicts",
    "injury", "injuries", "injured", "negligence", "negligent",
    "abuse", "neglect", "fraud", "malpractice",
    "accident", "accidents", "crash", "crashes", "collision", "collisions",
    "wreck", "wrecks", "crashed", "rollover",
    "death", "deaths", "fatality", "fatalities", "wrongful",
    "discrimination", "harassment", "assault", "battery",
    "fault", "liable", "liability", "liabilities",
    "insurance", "insurer", "underinsured", "uninsured",
    "court", "judge", "jury", "deposition", "discovery",
    "ticket", "violation", "violations", "citation",
    "dui", "duii", "duii", "homicide", "manslaughter",
    "helmet", "seatbelt", "restraint",
    "report", "reporter", "mandated", "mandatory",
    "duty", "warn", "supervise", "supervision",
    "premises", "trespass",
    "abuse", "victim", "victims",
}


def is_topically_legal(query: str) -> bool:
    # Don't use the cannibalization-grade tokens() here — it strips legal vocab as
    # stop words. Use a fresh tokenization that keeps every word.
    raw_toks = {t for t in re.split(r"[^a-z0-9]+", query.lower()) if t}
    if raw_toks & LEGAL_VERTICAL_TOKENS:
        return True
    # statute prefix check
    q = query.lower()
    if re.search(r"\bars[-\s]?\d", q):
        return True
    return False


def suggest_slug(query: str) -> str:
    slug = re.sub(r"[^a-z0-9\s]+", " ", query.lower())
    slug = re.sub(r"\s+", "-", slug.strip())
    return slug[:80]


def recommend_action(row: dict, inv_by_url: dict[str, dict]) -> dict:
    """Decide: update / publish-new / 301-merge / skip."""
    gap = row.get("gap_type")
    intent = row.get("intent")
    pos = row.get("our_position")
    our_url = (row.get("our_url") or "").rstrip("/")
    collection = row.get("our_collection")
    query = row["query"]

    # Skip branded competitor queries
    if intent == "branded":
        return {"action": "skip", "reason": "branded competitor query"}

    # Skip topically off-mission queries (rental cars, gyms, retailers that just
    # happen to share a city name with our market).
    if not is_topically_legal(query):
        return {"action": "skip", "reason": "off-topic — not a legal query"}

    # Already winning — monitor only
    if gap == "ranking":
        return {"action": "monitor", "reason": "top 3 already"}

    # Impression loser — page is being SHOWN to users but getting 0 clicks.
    # This is the highest-leverage fix on the site. Title/snippet/schema work.
    if gap == "impression_loser":
        gsc_url = row.get("gsc_url") or ""
        # Strip UTM params for matching to inventory
        clean_url = gsc_url.split("?")[0].rstrip("/")
        target = inv_by_url.get(clean_url)
        if target:
            return {
                "action": "fix-snippet",
                "target_url": clean_url,
                "target_collection": target["collection"],
                "target_title": target["title"],
                "gsc_impressions": row.get("gsc_impressions_28d", 0),
                "gsc_position": row.get("gsc_position_28d"),
                "reason": (f"GSC: {row.get('gsc_impressions_28d',0)} impressions, "
                           f"{row.get('gsc_clicks_28d',0)} clicks at pos "
                           f"{row.get('gsc_position_28d','?')}"),
            }
        return {
            "action": "fix-snippet-orphan",
            "target_url": gsc_url,
            "gsc_impressions": row.get("gsc_impressions_28d", 0),
            "reason": (f"impression-loser on non-IA URL: "
                       f"{row.get('gsc_impressions_28d',0)} impressions, 0 clicks"),
        }

    # GSC-only — GSC sees us, DFS doesn't. Long-tail queries with real impressions.
    # If on a real IA page, mark as "expand" (page works, just amplify); otherwise
    # treat like an orphan.
    if gap == "gsc_only":
        gsc_url = (row.get("gsc_url") or "").split("?")[0].rstrip("/")
        target = inv_by_url.get(gsc_url)
        if target:
            return {
                "action": "expand",
                "target_url": gsc_url,
                "target_collection": target["collection"],
                "target_title": target["title"],
                "reason": f"GSC long-tail: {row.get('gsc_impressions_28d',0)} impressions",
            }
        return {
            "action": "review-orphan",
            "from_url": row.get("gsc_url"),
            "reason": f"GSC-only orphan: {row.get('gsc_impressions_28d',0)} impressions",
        }

    # Update existing page
    if gap in ("defend", "almost"):
        target = inv_by_url.get(our_url)
        if target:
            return {
                "action": "update",
                "target_url": our_url,
                "target_collection": target["collection"],
                "target_title": target["title"],
                "reason": f"pos {pos} → push to top 10",
            }
        # ranking URL is orphan (not in MDX) — 301-merge candidate
        toks = tokens(query)
        best = None
        best_overlap = 0
        for u in inv_by_url.values():
            o = len(toks & u["tokens"])
            if o > best_overlap and o >= 2:
                best_overlap = o
                best = u
        if best:
            return {
                "action": "301-merge",
                "from_url": row.get("our_url"),
                "to_url": best["url"],
                "to_collection": best["collection"],
                "reason": f"orphan URL ranks pos {pos}; consolidate to canonical",
            }
        return {"action": "review-orphan",
                "from_url": row.get("our_url"),
                "reason": f"orphan URL ranks pos {pos}; no clear canonical"}

    # Deep back — page exists but ranks 31+. Worth updating only if good overlap.
    if gap == "deep_back" and our_url:
        target = inv_by_url.get(our_url)
        if target:
            return {
                "action": "update",
                "target_url": our_url,
                "target_collection": target["collection"],
                "target_title": target["title"],
                "reason": f"pos {pos} → expand/refresh content",
            }
        return {"action": "review-orphan",
                "from_url": row.get("our_url"),
                "reason": f"orphan ranking pos {pos}"}

    # We don't rank — pure gap. Publish new content.
    if gap in ("pure_gap", "head_commercial"):
        # Geographic mismatch — out-of-market head terms (Houston, Las Vegas, etc.)
        # We're an Arizona firm; any volume >500 query that isn't AZ-relevant is off-mission.
        if row.get("search_volume", 0) > 500 and not row.get("az_relevant"):
            return {"action": "skip", "reason": "out-of-market or generic head term"}
        # Branded competitor head terms — usually high-volume "phoenix injury attorney"
        # These are long-haul; deprioritize unless AZ-relevant and reasonably specific.
        if gap == "head_commercial" and row.get("search_volume", 0) > 1000:
            return {"action": "skip", "reason": "high-volume head term — long-haul, not a weekly move"}

        suggested_collection = INTENT_TO_COLLECTION.get(intent, "client-guide")
        toks = tokens(query)
        pa = map_to_practice_area(toks)

        if suggested_collection == "practice-area":
            if pa:
                target_url = f"{SITE}/{pa}/"
                if target_url.rstrip("/") in inv_by_url:
                    # we already have a practice-area page — update it
                    return {
                        "action": "update",
                        "target_url": target_url,
                        "target_collection": "practice-areas",
                        "target_title": inv_by_url[target_url.rstrip("/")]["title"],
                        "reason": "no DFS rank yet, but matching practice-area page exists",
                    }
            return {
                "action": "publish-new",
                "suggested_collection": "practice-area",
                "suggested_slug": pa or suggest_slug(query),
                "suggested_title": f"Arizona {query.title()}",
                "reason": "commercial intent, no matching practice-area page",
            }

        if suggested_collection == "city-page":
            return {
                "action": "publish-new",
                "suggested_collection": "city-page",
                "suggested_slug": suggest_slug(query),
                "suggested_title": query.title(),
                "reason": "local intent — city page",
            }

        if suggested_collection == "client-guide":
            return {
                "action": "publish-new",
                "suggested_collection": "client-guide",
                "suggested_slug": suggest_slug(query),
                "suggested_title": query[0].upper() + query[1:],
                "reason": "navigational intent — action-oriented guide",
            }

        # informational → legal-guide
        return {
            "action": "publish-new",
            "suggested_collection": "legal-guide",
            "suggested_slug": suggest_slug(query),
            "suggested_title": f"Arizona {query.title()}",
            "reason": "informational intent — legal explainer",
        }

    return {"action": "skip", "reason": "no match"}


# ---------------------------------------------------------------- main

def main() -> None:
    if not UNIVERSE_PATH.exists():
        sys.exit(f"Missing {UNIVERSE_PATH}. Run build-keyword-universe.py first.")

    universe = json.loads(UNIVERSE_PATH.read_text())["rows"]
    inv = inventory()
    inv_by_url = {p["url"].rstrip("/"): p for p in inv}

    # Recommend an action for every universe row
    planned = []
    for row in universe:
        rec = recommend_action(row, inv_by_url)
        planned.append({
            "query": row["query"],
            "search_volume": row.get("search_volume", 0),
            "priority_score": row.get("priority_score", 0),
            "az_relevant": row.get("az_relevant", False),
            "intent": row.get("intent"),
            "cluster": row.get("cluster"),
            "gap_type": row.get("gap_type"),
            "our_position": row.get("our_position"),
            "our_url": row.get("our_url"),
            "recommendation": rec,
        })

    # Bucket by action
    by_action: dict[str, list[dict]] = defaultdict(list)
    for p in planned:
        by_action[p["recommendation"]["action"]].append(p)

    # Sort each bucket by priority_score
    for k in by_action:
        by_action[k].sort(key=lambda p: -p["priority_score"])

    today = datetime.now().strftime("%Y-%m-%d")
    md_path = ROOT / "data" / "research" / f"content-plan-{today}.md"
    json_path = ROOT / "data" / "research" / f"content-plan-{today}.json"

    # --- markdown ---
    md = [
        f"# AZ Law Now Content Plan — {today}",
        "",
        "Synthesized from `keyword-universe.json`. Every universe row has been classified",
        "into one of: **update** existing page · **publish-new** content · **301-merge**",
        "legacy URL · **monitor** (already winning) · **review-orphan** · **skip**.",
        "",
        f"- **Fix-snippet queue**: **{len(by_action.get('fix-snippet', []))}** GSC impression-losers on real pages",
        f"- **Fix-snippet-orphan**: **{len(by_action.get('fix-snippet-orphan', []))}** impression-losers on non-IA URLs",
        f"- Update queue: **{len(by_action.get('update', []))}** queries on existing pages",
        f"- Expand queue: **{len(by_action.get('expand', []))}** GSC long-tail amplification",
        f"- Publish-new queue: **{len(by_action.get('publish-new', []))}** gap queries",
        f"- 301-merge queue: **{len(by_action.get('301-merge', []))}** orphan-with-canonical",
        f"- Review-orphan: **{len(by_action.get('review-orphan', []))}** orphan-no-canonical",
        f"- Monitor (top 3): **{len(by_action.get('monitor', []))}**",
        f"- Skipped (branded/head): **{len(by_action.get('skip', []))}**",
        "",
        "---",
        "",
        "## 🎯 This Week — Top 10 highest-leverage moves",
        "",
        "Mixed-action queue sorted by priority_score. Do these first.",
        "",
        "| Score | Vol | Pos | Action | Query | Target |",
        "|---:|---:|---:|---|---|---|",
    ]
    # combine all real-action buckets, sort by priority
    leverage = (by_action.get("fix-snippet", []) + by_action.get("update", [])
                + by_action.get("301-merge", []) + by_action.get("expand", [])
                + by_action.get("publish-new", []))
    leverage.sort(key=lambda p: -p["priority_score"])
    for p in leverage[:10]:
        rec = p["recommendation"]
        if rec["action"] in ("update", "fix-snippet", "expand"):
            target = rec.get("target_url", "").replace(SITE, "")
        elif rec["action"] == "301-merge":
            target = f"{rec.get('from_url','').replace(SITE,'')} → {rec.get('to_url','').replace(SITE,'')}"
        else:
            target = f"new {rec.get('suggested_collection','?')}: {rec.get('suggested_slug','?')}"
        pos = p["our_position"] or "—"
        md.append(f"| {p['priority_score']:.0f} | {p['search_volume']} | {pos} | "
                  f"**{rec['action']}** | {p['query']} | {target} |")

    # --- fix-snippet queue (GSC impression-losers) ---
    md += [
        "",
        "---",
        "",
        "## 0. Fix-Snippet Queue — pages getting impressions, zero clicks",
        "",
        "**These are the highest-leverage fixes on the site.** GSC shows the page being",
        "served to real users in real SERPs, but nobody clicks. Three usual causes:",
        "(1) title tag doesn't match query intent, (2) snippet is generic boilerplate,",
        "(3) SERP feature (knowledge panel / maps pack) is stealing the click. Fix the",
        "title + description first; that's a 5-minute edit.",
        "",
        "| Impressions | Pos | Query | Page | Title shown |",
        "|---:|---:|---|---|---|",
    ]
    fix_snippet = by_action.get("fix-snippet", [])
    # Dedupe by page — pick the highest-impression query per page
    seen_pages = {}
    for p in fix_snippet:
        url = p["recommendation"].get("target_url", "")
        if url not in seen_pages or p["recommendation"].get("gsc_impressions", 0) > \
                seen_pages[url]["recommendation"].get("gsc_impressions", 0):
            seen_pages[url] = p
    page_dedupe = sorted(seen_pages.values(),
                         key=lambda p: -p["recommendation"].get("gsc_impressions", 0))
    for p in page_dedupe[:25]:
        rec = p["recommendation"]
        url = rec.get("target_url", "").replace(SITE, "")
        pos = rec.get("gsc_position")
        pos_str = f"{pos:.1f}" if pos else "?"
        title = (rec.get("target_title") or "")[:50]
        md.append(f"| {rec.get('gsc_impressions',0)} | {pos_str} | {p['query']} | `{url}` | {title} |")

    # --- fix-snippet-orphan: impression-losers on URLs not in our IA ---
    orphan_losers = by_action.get("fix-snippet-orphan", [])
    if orphan_losers:
        orphan_losers.sort(key=lambda p: -p["recommendation"].get("gsc_impressions", 0))
        # dedupe by base URL (strip UTM)
        seen_o = {}
        for p in orphan_losers:
            base = (p["recommendation"].get("target_url", "") or "").split("?")[0]
            if base not in seen_o or p["recommendation"].get("gsc_impressions", 0) > \
                    seen_o[base]["recommendation"].get("gsc_impressions", 0):
                seen_o[base] = p
        md += [
            "",
            "### 0a. Fix-snippet on URLs NOT in current IA",
            "",
            "These are getting impressions on URLs that aren't current content pages —",
            "legacy URLs, UTM-tagged variants, or routes we forgot. Each is either a",
            "canonical-tag bug (we're feeding Google the wrong URL) or a 301 candidate.",
            "",
            "| Impressions | Pos | Query | URL Google indexed |",
            "|---:|---:|---|---|",
        ]
        for p in sorted(seen_o.values(),
                        key=lambda p: -p["recommendation"].get("gsc_impressions", 0))[:15]:
            rec = p["recommendation"]
            url = (rec.get("target_url", "") or "").replace(SITE, "")
            # truncate UTM
            if "?" in url:
                url = url.split("?")[0] + "?…"
            md.append(f"| {rec.get('gsc_impressions',0)} | "
                      f"{p.get('our_position') or '?'} | {p['query']} | `{url}` |")

    md += [
        "",
        "---",
        "",
        "## 1. Update Queue — existing pages, push to top 10",
        "",
        "Each row is an existing page with a query already ranking pos 11–30 (almost-there)",
        "or pos 4–10 (defend). Cheapest moves on the whole plan. Add: FAQ section using the",
        "exact query phrasing, a StatBlock with a fresh AZ stat, a freshness-dated intro,",
        "or an internal link from a higher-PR page.",
        "",
        "| Score | Vol | Pos | Query | Page to update |",
        "|---:|---:|---:|---|---|",
    ]
    for p in by_action.get("update", [])[:30]:
        rec = p["recommendation"]
        url = rec.get("target_url", "").replace(SITE, "")
        md.append(f"| {p['priority_score']:.0f} | {p['search_volume']} | "
                  f"{p['our_position'] or '—'} | {p['query']} | `{url}` |")

    # --- 301-merge queue ---
    md += [
        "",
        "---",
        "",
        "## 2. 301-Merge Queue — consolidate orphan URLs",
        "",
        "Each row is a legacy URL ranking in DFS top-50 with a clear canonical successor in",
        "the new IA. 301-redirect to consolidate link equity. Add the redirects to",
        "`netlify.toml` or `_redirects`.",
        "",
        "| Vol | Pos | Query | Redirect from → to |",
        "|---:|---:|---|---|",
    ]
    for p in by_action.get("301-merge", [])[:30]:
        rec = p["recommendation"]
        f = rec.get("from_url", "").replace(SITE, "")
        t = rec.get("to_url", "").replace(SITE, "")
        md.append(f"| {p['search_volume']} | {p['our_position'] or '—'} | "
                  f"{p['query']} | `{f}` → `{t}` |")

    # --- publish-new queue, grouped by collection ---
    md += [
        "",
        "---",
        "",
        "## 3. Publish-New Queue — new content briefs (grouped by collection)",
        "",
        "Each row is a query we don't yet rank for, with a recommended collection +",
        "slug + title. Editor decides which to commission. Priority_score weights by",
        "volume × leverage × AZ-relevance.",
        "",
    ]
    pub = by_action.get("publish-new", [])
    by_col_pub: dict[str, list[dict]] = defaultdict(list)
    for p in pub:
        by_col_pub[p["recommendation"].get("suggested_collection", "?")].append(p)

    for col in ("practice-area", "legal-guide", "client-guide", "city-page"):
        rows = by_col_pub.get(col, [])
        if not rows:
            continue
        md += [
            f"### {col} ({len(rows)} candidates)",
            "",
            "| Score | Vol | Query | Suggested slug / title |",
            "|---:|---:|---|---|",
        ]
        for p in rows[:15]:
            rec = p["recommendation"]
            md.append(f"| {p['priority_score']:.0f} | {p['search_volume']} | {p['query']} | "
                      f"`{rec.get('suggested_slug','?')}` — {rec.get('suggested_title','')[:60]} |")
        md.append("")

    # --- review-orphan ---
    md += [
        "---",
        "",
        "## 4. Review-Orphan Queue — DFS-ranking URLs we can't auto-route",
        "",
        "These URLs rank in DFS but have no clear canonical in the new IA. Manual review:",
        "is the page (a) gone from the build (→ 410 or redirect to nearest topic), or",
        "(b) actually still live and we just didn't classify it? Top by volume:",
        "",
        "| Vol | Pos | Query | Orphan URL |",
        "|---:|---:|---|---|",
    ]
    seen = set()
    for p in by_action.get("review-orphan", []):
        u = p["recommendation"].get("from_url", "")
        if u in seen:
            continue
        seen.add(u)
        md.append(f"| {p['search_volume']} | {p['our_position'] or '—'} | "
                  f"{p['query']} | `{u.replace(SITE,'')}` |")
        if len(seen) >= 30:
            break

    md += [
        "",
        "---",
        "",
        "## How to run this loop weekly",
        "",
        "```",
        "python3 scripts/seo/build-keyword-universe.py    # fresh DFS pull",
        "python3 scripts/seo/cannibalization-scan.py      # structural overlap",
        "python3 scripts/seo/ia-coverage-map.py           # IA gap surface",
        "python3 scripts/seo/plan-content.py              # synthesize this plan",
        "```",
        "",
        "Then triage the top 10 leverage queue at the top of this doc into the editorial",
        "calendar. Re-run weekly; the dated snapshots in `data/research/` provide trend.",
    ]

    md_path.write_text("\n".join(md))

    # --- json ---
    json_path.write_text(json.dumps({
        "generated_at": today,
        "totals": {k: len(v) for k, v in by_action.items()},
        "by_action": dict(by_action),
    }, indent=2))

    print(f"\n✓ Wrote {md_path.relative_to(ROOT)}")
    print(f"✓ Wrote {json_path.relative_to(ROOT)}")

    print("\n=== Content plan summary ===")
    for k in ("update", "publish-new", "301-merge", "review-orphan", "monitor", "skip"):
        print(f"  {k:15}  {len(by_action.get(k, [])):>4}")


if __name__ == "__main__":
    main()
