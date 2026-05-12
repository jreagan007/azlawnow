#!/usr/bin/env python3
"""
enrich-journalists.py

LedeTime-style journalist corpus enrichment for AZ Law Now earned-media outreach.

For each prospect in the target list:
  1. Firecrawl batch scrape of the journalist's last 25 articles
  2. Voyage AI voyage-3-large embedding per article
  3. Corpus centroid embedding (average of per-article embeddings)
  4. Cache results with 14-day TTL
  5. Output enriched-prospects.jsonl

Usage:
  python3 scripts/outreach/enrich-journalists.py \\
    --target-list data/outreach/az-journalists.csv \\
    --cache-dir cache/journalist-corpus/ \\
    --max-prospects 50 \\
    --segment all

  --target-list   Path to CSV with columns: name,outlet,beat,email,twitter,segment
  --cache-dir     Path to SQLite cache directory (default: cache/journalist-corpus/)
  --max-prospects Max prospects to process (default: 50)
  --segment       Filter by segment slug: az-news | legal-trade | safety-blogger |
                  az-region | transportation | immigration | education | elder-care |
                  all (default: all)
  --dry-run       Print what would be scraped without calling Firecrawl or Voyage AI
"""

import argparse
import asyncio
import csv
import hashlib
import json
import os
import sqlite3
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import httpx

# ---------------------------------------------------------------------------
# Load secrets from ops env
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

FIRECRAWL_API_KEY = os.environ.get("FIRECRAWL_API_KEY", "")
VOYAGE_API_KEY = os.environ.get("VOYAGE_API_KEY", "")
FIRECRAWL_BASE = "https://api.firecrawl.dev"
VOYAGE_BASE = "https://api.voyageai.com/v1"
VOYAGE_MODEL = "voyage-3-large"
CACHE_TTL_DAYS = 14
MAX_CONCURRENT_FIRECRAWL = 50
POLL_INTERVAL_SECONDS = 3
MAX_POLL_ATTEMPTS = 60  # 3 min max wait per batch

VALID_SEGMENTS = {
    "az-news",
    "legal-trade",
    "safety-blogger",
    "az-region",
    "transportation",
    "immigration",
    "education",
    "elder-care",
}

# ---------------------------------------------------------------------------
# Cache (SQLite)
# ---------------------------------------------------------------------------

def init_cache(cache_dir: str) -> sqlite3.Connection:
    Path(cache_dir).mkdir(parents=True, exist_ok=True)
    db_path = Path(cache_dir) / "corpus-cache.db"
    conn = sqlite3.connect(str(db_path))
    conn.execute("""
        CREATE TABLE IF NOT EXISTS corpus_cache (
            cache_key TEXT PRIMARY KEY,
            enriched_json TEXT NOT NULL,
            scraped_at TEXT NOT NULL
        )
    """)
    conn.commit()
    return conn


def cache_key_for(email: str) -> str:
    return hashlib.sha256(email.lower().strip().encode()).hexdigest()[:24]


def cache_get(conn: sqlite3.Connection, email: str) -> Optional[dict]:
    key = cache_key_for(email)
    row = conn.execute(
        "SELECT enriched_json, scraped_at FROM corpus_cache WHERE cache_key = ?",
        (key,)
    ).fetchone()
    if not row:
        return None
    scraped_at = datetime.fromisoformat(row[1])
    if datetime.utcnow() - scraped_at > timedelta(days=CACHE_TTL_DAYS):
        conn.execute("DELETE FROM corpus_cache WHERE cache_key = ?", (key,))
        conn.commit()
        return None
    return json.loads(row[0])


def cache_set(conn: sqlite3.Connection, email: str, enriched: dict):
    key = cache_key_for(email)
    conn.execute(
        "INSERT OR REPLACE INTO corpus_cache (cache_key, enriched_json, scraped_at) VALUES (?, ?, ?)",
        (key, json.dumps(enriched), datetime.utcnow().isoformat())
    )
    conn.commit()


def cache_prune(conn: sqlite3.Connection):
    cutoff = (datetime.utcnow() - timedelta(days=CACHE_TTL_DAYS)).isoformat()
    deleted = conn.execute(
        "DELETE FROM corpus_cache WHERE scraped_at < ?", (cutoff,)
    ).rowcount
    conn.commit()
    if deleted:
        print(f"[cache] Pruned {deleted} stale entries older than {CACHE_TTL_DAYS} days.")

# ---------------------------------------------------------------------------
# URL discovery for journalist bylines
# ---------------------------------------------------------------------------

def build_byline_search_urls(prospect: dict, max_articles: int = 25) -> list[str]:
    """
    Build a list of candidate URLs to search for a journalist's recent articles.
    Returns search result URLs for Firecrawl to scrape. Customize per outlet as needed.
    """
    name = prospect.get("name", "").strip()
    outlet = prospect.get("outlet", "").strip()

    # Outlet-specific byline URL patterns (Arizona news, transit, safety, civil-rights beats)
    outlet_patterns = {
        # Phoenix metro
        "Arizona Republic": f"https://www.azcentral.com/search/?q={name.replace(' ', '%20')}",
        "AZ Central": f"https://www.azcentral.com/search/?q={name.replace(' ', '%20')}",
        "azcentral": f"https://www.azcentral.com/search/?q={name.replace(' ', '%20')}",
        "ABC15": f"https://www.abc15.com/search?q={name.replace(' ', '+')}",
        "Fox 10": f"https://www.fox10phoenix.com/search?q={name.replace(' ', '+')}",
        "Fox 10 Phoenix": f"https://www.fox10phoenix.com/search?q={name.replace(' ', '+')}",
        "12 News": f"https://www.12news.com/search?q={name.replace(' ', '+')}",
        "AZ Family": f"https://www.azfamily.com/search/?q={name.replace(' ', '+')}",
        # Tucson
        "Arizona Daily Star": f"https://tucson.com/search/?q={name.replace(' ', '+')}",
        "Tucson.com": f"https://tucson.com/search/?q={name.replace(' ', '+')}",
        "KGUN9": f"https://www.kgun9.com/search?q={name.replace(' ', '+')}",
        "KGUN": f"https://www.kgun9.com/search?q={name.replace(' ', '+')}",
        "Tucson Sentinel": f"https://www.tucsonsentinel.com/search/?q={name.replace(' ', '+')}",
        # Flagstaff / Northern AZ
        "Arizona Daily Sun": f"https://azdailysun.com/search/?q={name.replace(' ', '+')}",
        "KNAU": f"https://www.knau.org/search/{name.replace(' ', '%20')}",
        # Yuma / Western AZ
        "Yuma Sun": f"https://www.yumasun.com/search/?q={name.replace(' ', '+')}",
        # Tribal / Indigenous coverage
        "Indian Country Today": f"https://ictnews.org/?s={name.replace(' ', '+')}",
        "ICT News": f"https://ictnews.org/?s={name.replace(' ', '+')}",
        "Navajo Times": f"https://navajotimes.com/?s={name.replace(' ', '+')}",
        # East Valley
        "East Valley Tribune": f"https://www.eastvalleytribune.com/search/?q={name.replace(' ', '+')}",
        "Tempe Republic": f"https://www.azcentral.com/search/?q={name.replace(' ', '%20')}",
        "Mesa Tribune": f"https://www.eastvalleytribune.com/search/?q={name.replace(' ', '+')}",
        # West Valley
        "West Valley View": f"https://www.westvalleyview.com/search/?q={name.replace(' ', '+')}",
        # Statewide
        "Arizona Mirror": f"https://azmirror.com/?s={name.replace(' ', '+')}",
        "AZPM": f"https://www.azpm.org/s/?q={name.replace(' ', '+')}",
        "KJZZ": f"https://kjzz.org/search?keyword={name.replace(' ', '+')}",
        "Arizona Capitol Times": f"https://azcapitoltimes.com/?s={name.replace(' ', '+')}",
        "Capitol Times": f"https://azcapitoltimes.com/?s={name.replace(' ', '+')}",
        # Legal + insurance trade
        "Law360": f"https://www.law360.com/search?q={name.replace(' ', '+')}",
        "Insurance Journal": f"https://www.insurancejournal.com/?s={name.replace(' ', '+')}",
    }

    urls = []
    # Try outlet-specific pattern first
    for outlet_key, url in outlet_patterns.items():
        if outlet_key.lower() in outlet.lower():
            urls.append(url)
            break

    # Fallback: generic Google site: search
    if not urls:
        outlet_domain = outlet.lower().replace(" ", "").replace("the", "")
        urls.append(f"https://www.google.com/search?q=site:{outlet_domain}.com+\"{name}\"&num={max_articles}")

    return urls[:3]  # Cap to 3 search entry points per journalist

# ---------------------------------------------------------------------------
# Firecrawl async batch scrape
# ---------------------------------------------------------------------------

async def firecrawl_batch_scrape(urls: list[str], client: httpx.AsyncClient) -> list[dict]:
    """Submit a batch scrape job and poll until complete. Returns list of result objects."""
    if not FIRECRAWL_API_KEY:
        raise RuntimeError("FIRECRAWL_API_KEY not set. Check taqtics-ops/config/.env.")

    payload = {
        "urls": urls,
        "maxConcurrency": MAX_CONCURRENT_FIRECRAWL,
        "ignoreInvalidURLs": True,
        "formats": ["markdown"],
        "onlyMainContent": True,
        "timeout": 30000,
        "blockAds": True,
        "removeBase64Images": True,
        "location": {"country": "US", "languages": ["en-US"]},
    }

    headers = {
        "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
        "Content-Type": "application/json",
    }

    # Submit batch
    resp = await client.post(f"{FIRECRAWL_BASE}/v2/batch/scrape", json=payload, headers=headers, timeout=60)
    resp.raise_for_status()
    job_id = resp.json().get("id")
    if not job_id:
        raise RuntimeError(f"Firecrawl batch submit returned no job ID: {resp.text}")

    # Poll for completion
    for attempt in range(MAX_POLL_ATTEMPTS):
        await asyncio.sleep(POLL_INTERVAL_SECONDS)
        poll = await client.get(
            f"{FIRECRAWL_BASE}/v2/batch/scrape/{job_id}",
            headers=headers,
            timeout=30
        )
        poll.raise_for_status()
        data = poll.json()
        status = data.get("status", "")
        if status == "completed":
            return data.get("data", [])
        if status == "failed":
            raise RuntimeError(f"Firecrawl batch {job_id} failed: {data}")
        # Still running, keep polling

    raise TimeoutError(f"Firecrawl batch {job_id} did not complete after {MAX_POLL_ATTEMPTS * POLL_INTERVAL_SECONDS}s")


def extract_articles_from_batch(results: list[dict]) -> list[str]:
    """Pull article body markdown from Firecrawl batch results."""
    articles = []
    for r in results:
        md = r.get("markdown", "").strip()
        if md and len(md) > 200:
            articles.append(md[:8000])
    return articles

# ---------------------------------------------------------------------------
# Voyage AI embeddings
# ---------------------------------------------------------------------------

async def voyage_embed(texts: list[str], client: httpx.AsyncClient) -> list[list[float]]:
    """Embed a list of texts using Voyage AI voyage-3-large."""
    if not VOYAGE_API_KEY:
        raise RuntimeError("VOYAGE_API_KEY not set. Check taqtics-ops/config/.env.")

    headers = {
        "Authorization": f"Bearer {VOYAGE_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": VOYAGE_MODEL,
        "input": texts,
        "input_type": "document",
    }

    resp = await client.post(f"{VOYAGE_BASE}/embeddings", json=payload, headers=headers, timeout=120)
    resp.raise_for_status()
    data = resp.json()
    return [item["embedding"] for item in data["data"]]


def corpus_centroid(embeddings: list[list[float]]) -> list[float]:
    """Average a list of embedding vectors into a single centroid."""
    if not embeddings:
        return []
    dim = len(embeddings[0])
    centroid = [0.0] * dim
    for emb in embeddings:
        for i, v in enumerate(emb):
            centroid[i] += v
    n = len(embeddings)
    return [v / n for v in centroid]


def cluster_coverage_themes(articles: list[str]) -> list[str]:
    """
    Simple keyword-frequency theme extraction from article corpus.
    Returns the top 5 most-recurring topic phrases.
    Full semantic clustering handled later in generate-pitches.py by Claude.
    """
    import re
    from collections import Counter

    # Topic signal phrases common in Arizona injury, civil-rights, transit,
    # heat-vulnerability, school-safety, elder-care, and utility-accountability coverage.
    theme_signals = [
        # AZ pedestrian + Vision Zero
        "Vision Zero", "pedestrian", "crosswalk", "Maricopa intersections",
        "ADOT", "Phoenix Road Safety", "Goodyear", "Buckeye", "SR 347",
        # AZ heat vulnerability
        "heat death", "heat-related", "APS", "SRP", "utility disconnection",
        "Korman", "HB 2168", "cooling center", "extreme heat",
        # AZ crash corridors
        "I-10", "US 60", "Loop 101", "Loop 202", "BNSF", "AZDPS", "DPS",
        "fatal crash", "rollover", "wrong-way",
        # AZ elder care
        "nursing home", "assisted living", "ASBN", "Arizona Long Term Care",
        "ALTCS", "memory care",
        # AZ school safety
        "AzDE", "Department of Education", "restraint", "seclusion",
        "school bus", "MERV-13", "ESA", "Empowerment Scholarship",
        # AZ immigration + civil rights
        "ICE detention", "Maricopa County", "Mayes", "civil rights",
        "border patrol", "asylum", "sanctuary",
        # AZ utility accountability
        "ACC", "Arizona Corporation Commission", "rate hike",
        "disconnect", "shutoff", "KPUC",
        # Statewide legal + safety
        "OSHA", "workers comp", "premises liability", "comparative negligence",
        "no-fault", "policy limit", "uninsured motorist",
        # Geography
        "Phoenix", "Tucson", "Flagstaff", "Yuma", "Mesa", "Tempe",
        "Glendale", "Scottsdale", "Chandler", "Gilbert", "Surprise",
        "Navajo Nation", "Hopi", "Tohono O'odham", "Salt River",
    ]

    combined = " ".join(articles).lower()
    counts = Counter()
    for phrase in theme_signals:
        hits = len(re.findall(re.escape(phrase.lower()), combined))
        if hits > 0:
            counts[phrase] = hits

    return [phrase for phrase, _ in counts.most_common(5)]

# ---------------------------------------------------------------------------
# Main enrichment loop
# ---------------------------------------------------------------------------

async def enrich_prospect(prospect: dict, cache_conn: sqlite3.Connection, client: httpx.AsyncClient, dry_run: bool) -> dict:
    email = prospect.get("email", "").strip()
    name = prospect.get("name", "").strip()

    # Cache hit?
    cached = cache_get(cache_conn, email)
    if cached:
        print(f"  [cache hit] {name} <{email}>")
        return cached

    print(f"  [scraping] {name} <{email}> @ {prospect.get('outlet', '')}")

    if dry_run:
        return {
            "prospect_meta": prospect,
            "last_25_article_summaries": ["[dry-run: no articles scraped]"],
            "coverage_themes": ["[dry-run]"],
            "corpus_centroid_embedding": [],
            "enriched_at": datetime.utcnow().isoformat(),
            "dry_run": True,
        }

    # Build URLs
    urls = build_byline_search_urls(prospect)

    # Firecrawl
    try:
        batch_results = await firecrawl_batch_scrape(urls, client)
        articles = extract_articles_from_batch(batch_results)
    except Exception as e:
        print(f"  [warn] Firecrawl error for {name}: {e}")
        articles = []

    if not articles:
        print(f"  [warn] No articles found for {name}. Marking as no-corpus.")
        enriched = {
            "prospect_meta": prospect,
            "last_25_article_summaries": [],
            "coverage_themes": [],
            "corpus_centroid_embedding": [],
            "enriched_at": datetime.utcnow().isoformat(),
            "corpus_found": False,
        }
        cache_set(cache_conn, email, enriched)
        return enriched

    # Voyage embeddings
    try:
        embeddings = await voyage_embed(articles, client)
        centroid = corpus_centroid(embeddings)
    except Exception as e:
        print(f"  [warn] Voyage embedding error for {name}: {e}")
        centroid = []

    themes = cluster_coverage_themes(articles)

    enriched = {
        "prospect_meta": prospect,
        "last_25_article_summaries": [a[:500] for a in articles[:25]],
        "coverage_themes": themes,
        "corpus_centroid_embedding": centroid,
        "enriched_at": datetime.utcnow().isoformat(),
        "corpus_found": True,
        "articles_scraped": len(articles),
    }

    cache_set(cache_conn, email, enriched)
    return enriched


async def run(args):
    # Load target list
    target_path = Path(args.target_list)
    if not target_path.exists():
        print(f"ERROR: target list not found: {target_path}", file=sys.stderr)
        sys.exit(1)

    with open(target_path, newline="", encoding="utf-8") as f:
        prospects = list(csv.DictReader(f))

    # Validate required columns
    required_cols = {"name", "outlet", "beat", "email", "segment"}
    actual_cols = set(prospects[0].keys()) if prospects else set()
    missing = required_cols - actual_cols
    if missing:
        print(f"ERROR: target list missing columns: {missing}", file=sys.stderr)
        sys.exit(1)

    # Segment filter
    if args.segment != "all":
        prospects = [p for p in prospects if p.get("segment", "").strip().lower() == args.segment.lower()]

    prospects = [p for p in prospects if p.get("email", "").strip()]
    prospects = prospects[:args.max_prospects]

    print(f"Enriching {len(prospects)} prospects (segment={args.segment}, dry_run={args.dry_run})")

    # Init cache
    cache_conn = init_cache(args.cache_dir)
    cache_prune(cache_conn)

    # Output path
    output_path = Path(args.output) if args.output else target_path.parent / "enriched-prospects.jsonl"

    enriched_all = []
    async with httpx.AsyncClient() as client:
        for prospect in prospects:
            enriched = await enrich_prospect(prospect, cache_conn, client, args.dry_run)
            enriched_all.append(enriched)
            if not args.dry_run:
                await asyncio.sleep(1)

    # Write JSONL
    with open(output_path, "w", encoding="utf-8") as f:
        for record in enriched_all:
            f.write(json.dumps(record) + "\n")

    print(f"\nDone. {len(enriched_all)} prospects enriched.")
    print(f"Output: {output_path}")
    cache_conn.close()


def main():
    parser = argparse.ArgumentParser(description="Enrich AZ Law Now journalist prospect list with Firecrawl + Voyage AI corpus embeddings.")
    parser.add_argument("--target-list", required=True, help="Path to target CSV (name,outlet,beat,email,twitter,segment)")
    parser.add_argument("--cache-dir", default="cache/journalist-corpus/", help="Cache directory for corpus embeddings")
    parser.add_argument("--max-prospects", type=int, default=50, help="Max prospects to process (default: 50)")
    parser.add_argument(
        "--segment",
        default="all",
        help="Filter by beat segment: az-news, legal-trade, safety-blogger, az-region, transportation, immigration, education, elder-care, or all",
    )
    parser.add_argument("--output", default=None, help="Output JSONL path (default: <target-list-dir>/enriched-prospects.jsonl)")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be done without calling APIs")
    args = parser.parse_args()

    # Validate segment
    seg = args.segment.lower()
    if seg != "all" and seg not in VALID_SEGMENTS:
        print(
            f"ERROR: invalid segment '{args.segment}'. Choose from: all, {', '.join(sorted(VALID_SEGMENTS))}",
            file=sys.stderr,
        )
        sys.exit(1)
    args.segment = seg

    asyncio.run(run(args))


if __name__ == "__main__":
    main()
