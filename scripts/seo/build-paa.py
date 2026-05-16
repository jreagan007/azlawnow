#!/usr/bin/env python3
"""AZ Law Now — People Also Ask harvester.

For every AZ-relevant query in the keyword universe, pull the live Google
SERP from DataForSEO and extract the People Also Ask block: the verbatim
questions, Google's expanded answer snippet, and the cited source URL.

PAA questions are the highest-signal input for FAQ blocks and content-gap
discovery: they are the exact phrasings Google surfaces in-SERP, and
matching them verbatim as H2s / FAQ entries is the documented fix for PAA
click-stealing (see docs/seo-framing-decisions.md + serp-audit.py).

Scope: az_relevant == true (~990 queries). Long-tail / competitor-only
junk is excluded — PAA there does not inform our content.

Batched 10 keywords per POST to keep round-trips ~100 instead of ~990.
Checkpointed to _raw/paa-serp-{date}.json so a mid-run failure resumes
instead of re-billing completed keywords.

Inputs:
  data/research/keyword-universe.json

Outputs:
  data/research/_raw/paa-serp-{date}.json  raw DFS responses (checkpoint)
  data/research/paa-{date}.json            structured PAA per query
  data/research/paa-{date}.md              content-ready, grouped by page
"""
from __future__ import annotations

import base64
import json
import os
import sys
import time
import urllib.request
from collections import defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RESEARCH_DIR = ROOT / "data" / "research"
UNIVERSE = RESEARCH_DIR / "keyword-universe.json"
RAW = RESEARCH_DIR / "_raw"
BATCH = 10
LOCATION = "Phoenix,Arizona,United States"


def _load_env() -> None:
    for p in [
        os.path.expanduser("~/Projects/taqtics-ops/config/.env"),
        os.path.expanduser("~/Projects/taqticscom/.env"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../.env"),
    ]:
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
    sys.exit("DATAFORSEO_LOGIN/PASSWORD missing in env")
AUTH = base64.b64encode(f"{LOGIN}:{PASSWORD}".encode()).decode()


def serp_batch(keywords: list[str]) -> list[dict]:
    """One POST, many tasks. Returns the tasks array (1 task per keyword)."""
    body = [
        {
            "keyword": kw,
            "language_code": "en",
            "location_name": LOCATION,
            "device": "mobile",
            "depth": 20,
            "calculate_rectangles": False,
        }
        for kw in keywords
    ]
    req = urllib.request.Request(
        "https://api.dataforseo.com/v3/serp/google/organic/live/advanced",
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Basic {AUTH}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.loads(r.read().decode()).get("tasks", [])


def extract_paa(items: list[dict]) -> list[dict]:
    """Pull every PAA question + expanded answer + source from SERP items."""
    out: list[dict] = []
    for it in items or []:
        if it.get("type") != "people_also_ask":
            continue
        for el in it.get("items", []) or []:
            q = (el.get("title") or "").strip()
            if not q:
                continue
            ans, src, src_title = "", "", ""
            for ex in el.get("expanded_element", []) or []:
                ans = (ex.get("description") or "").strip()
                src = (ex.get("url") or "").strip()
                src_title = (ex.get("title") or "").strip()
                if ans:
                    break
            out.append({"question": q, "answer": ans, "source": src, "source_title": src_title})
    return out


def main() -> None:
    if not UNIVERSE.exists():
        sys.exit(f"Missing {UNIVERSE}")
    rows = json.loads(UNIVERSE.read_text())["rows"]

    targets = [r for r in rows if r.get("az_relevant")]
    # Stable order, dedupe queries (universe has dupes across competitor joins)
    seen, queue = set(), []
    for r in targets:
        q = r["query"]
        if q in seen:
            continue
        seen.add(q)
        queue.append(r)
    print(f"PAA harvest: {len(queue)} unique AZ-relevant queries")

    RAW.mkdir(parents=True, exist_ok=True)
    today = datetime.now().strftime("%Y-%m-%d")
    checkpoint = RAW / f"paa-serp-{today}.json"

    done: dict[str, list[dict]] = {}
    if checkpoint.exists():
        done = json.loads(checkpoint.read_text())
        print(f"  resuming — {len(done)} queries already harvested")

    pending = [r for r in queue if r["query"] not in done]
    print(f"  {len(pending)} remaining; {len(pending)//BATCH + 1} batches")

    for bi in range(0, len(pending), BATCH):
        chunk = pending[bi : bi + BATCH]
        kws = [r["query"] for r in chunk]
        n = bi // BATCH + 1
        try:
            tasks = serp_batch(kws)
        except Exception as e:
            print(f"  batch {n} FAILED: {e} — checkpointing + continuing")
            checkpoint.write_text(json.dumps(done, indent=2))
            time.sleep(5)
            continue
        for kw, task in zip(kws, tasks):
            try:
                items = task["result"][0]["items"] or []
            except Exception:
                items = []
            done[kw] = extract_paa(items)
        if n % 5 == 0 or bi + BATCH >= len(pending):
            checkpoint.write_text(json.dumps(done, indent=2))
            got = sum(1 for v in done.values() if v)
            print(f"  batch {n}: {len(done)}/{len(queue)} done, {got} with PAA")
        time.sleep(0.5)

    checkpoint.write_text(json.dumps(done, indent=2))

    # ── Structured output: per query, joined back to cluster + our page ──
    by_query = {r["query"]: r for r in queue}
    structured = []
    for q, paa in done.items():
        if not paa:
            continue
        row = by_query.get(q, {})
        structured.append(
            {
                "query": q,
                "cluster": row.get("cluster"),
                "intent": row.get("intent"),
                "our_collection": row.get("our_collection"),
                "our_url": row.get("our_url") or row.get("gsc_url"),
                "search_volume": row.get("search_volume"),
                "gsc_impressions_28d": row.get("gsc_impressions_28d"),
                "paa": paa,
            }
        )
    structured.sort(key=lambda s: -(s.get("gsc_impressions_28d") or 0))
    (RESEARCH_DIR / f"paa-{today}.json").write_text(json.dumps(structured, indent=2))

    # ── Markdown: grouped by our page so it's directly content-actionable ──
    total_q = sum(len(s["paa"]) for s in structured)
    uniq_q = len({p["question"].lower() for s in structured for p in s["paa"]})
    by_page: dict[str, list[dict]] = defaultdict(list)
    for s in structured:
        key = s["our_url"] or f"(unmapped · cluster: {s.get('cluster') or '—'})"
        by_page[key].append(s)

    md = [
        f"# People Also Ask — Harvest {today}",
        "",
        f"DataForSEO live mobile SERP, Phoenix AZ. Harvested PAA for "
        f"**{len(done)}** AZ-relevant queries; **{len(structured)}** returned a "
        f"PAA block. **{total_q}** total questions, **{uniq_q}** unique.",
        "",
        "PAA questions are verbatim Google phrasings. The documented fix for PAA "
        "click-stealing is to add the question as an H2 / FAQ entry with a tight "
        "40-60 word answer (see `docs/seo-framing-decisions.md`).",
        "",
        "Grouped by the page that ranks for the seed query, highest GSC "
        "impressions first. Unmapped queries are content-gap candidates.",
        "",
        "---",
        "",
    ]
    page_order = sorted(
        by_page.items(),
        key=lambda kv: -max((s.get("gsc_impressions_28d") or 0) for s in kv[1]),
    )
    for page, seeds in page_order:
        md += [f"## {page}", ""]
        seen_q: set[str] = set()
        for s in sorted(seeds, key=lambda x: -(x.get("gsc_impressions_28d") or 0)):
            md.append(
                f"<!-- seed: \"{s['query']}\" · vol {s.get('search_volume') or '—'} · "
                f"GSC impr {s.get('gsc_impressions_28d') or 0} -->"
            )
            for p in s["paa"]:
                ql = p["question"].lower()
                if ql in seen_q:
                    continue
                seen_q.add(ql)
                ans = p["answer"] or "_(no expanded snippet)_"
                src = f" — source: {p['source']}" if p["source"] else ""
                md += [f"- **{p['question']}**", f"  {ans}{src}"]
            md.append("")
        md.append("")

    (RESEARCH_DIR / f"paa-{today}.md").write_text("\n".join(md))
    print(f"\n✓ data/research/paa-{today}.json  ({len(structured)} queries with PAA)")
    print(f"✓ data/research/paa-{today}.md   ({uniq_q} unique questions)")
    print(f"✓ data/research/_raw/paa-serp-{today}.json (checkpoint/raw)")


if __name__ == "__main__":
    main()
