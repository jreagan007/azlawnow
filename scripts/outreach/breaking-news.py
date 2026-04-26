#!/usr/bin/env python3
"""Daily breaking news scanner for AZ Law Now editorial pipeline.

Pulls from generative search (PPLX), X recent search, web scraper search of AZ
news mastheads, and keyword volume snapshots. Synthesizes a bulletin that:
1. Surfaces new AZ legal/safety stories worth investigating
2. Flags developments that update existing investigations
3. Identifies fresh outreach windows (regulator action, court ruling, named source)

Output: data/outreach/breaking-news/<date>.md and a JSON sibling.

Usage:
  python3 scripts/outreach/breaking-news.py [--hours 24]
"""
import os
import sys
import json
import time
import subprocess
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

PPLX = os.environ.get("PERPLEXITY_API_KEY")
WS_KEY = os.environ.get("WEB_SEARCH_API_KEY")
WS_URL = os.environ.get("WEB_SEARCH_API_URL")
KW_LOGIN = os.environ.get("KW_PROVIDER_LOGIN")
KW_PASS = os.environ.get("KW_PROVIDER_PASSWORD")
KW_URL = os.environ.get("KW_VOLUME_API_URL")
X_BEARER = os.environ.get("X_BEARER_TOKEN")

OUT_DIR = Path(os.path.expanduser("~/Projects/azlawnow/data/outreach/breaking-news"))
OUT_DIR.mkdir(parents=True, exist_ok=True)

HOURS = 24
for i, a in enumerate(sys.argv):
    if a == "--hours" and i + 1 < len(sys.argv):
        HOURS = int(sys.argv[i + 1])

today = datetime.now().strftime("%Y-%m-%d")


def perplexity(prompt, system="Return concise factual findings with primary-source URLs."):
    payload = {
        "model": "sonar-pro",
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 1500,
        "temperature": 0.2,
    }
    with open("/tmp/_pplx_bn.json", "w") as f:
        json.dump(payload, f)
    r = subprocess.run(
        ["curl", "-s", "-X", "POST", "https://api.perplexity.ai/chat/completions",
         "-H", f"Authorization: Bearer {PPLX}",
         "-H", "Content-Type: application/json", "-d", "@/tmp/_pplx_bn.json"],
        capture_output=True, text=True, check=True,
    )
    try:
        d = json.loads(r.stdout)
        return d["choices"][0]["message"]["content"].strip()
    except Exception as e:
        return f"PPLX_ERROR: {e}"


def web_search(query, limit=10):
    payload = {"query": query, "limit": limit}
    with open("/tmp/_ws_search.json", "w") as f:
        json.dump(payload, f)
    r = subprocess.run(
        ["curl", "-s", "-X", "POST", WS_URL,
         "-H", f"Authorization: Bearer {WS_KEY}",
         "-H", "Content-Type: application/json", "-d", "@/tmp/_ws_search.json"],
        capture_output=True, text=True, check=True,
    )
    try:
        d = json.loads(r.stdout)
        return d.get("data", [])
    except Exception:
        return []


def x_recent_search(query, max_results=20):
    if not X_BEARER:
        return []
    import urllib.parse
    q = urllib.parse.quote(query)
    url = f"https://api.x.com/2/tweets/search/recent?query={q}&max_results={max_results}&tweet.fields=created_at,public_metrics,author_id&expansions=author_id&user.fields=username,name"
    r = subprocess.run(
        ["curl", "-s", "-H", f"Authorization: Bearer {X_BEARER}", url],
        capture_output=True, text=True, check=True,
    )
    try:
        d = json.loads(r.stdout)
        users = {u["id"]: u for u in d.get("includes", {}).get("users", [])}
        items = []
        for t in d.get("data", []):
            u = users.get(t.get("author_id", ""), {})
            items.append({
                "text": t.get("text", "")[:280],
                "username": u.get("username", ""),
                "metrics": t.get("public_metrics", {}),
                "created_at": t.get("created_at", ""),
            })
        return items
    except Exception:
        return []


def section_pplx_az_news():
    prompt = (
        f"List the top breaking Arizona legal, safety, infrastructure, education, and consumer-protection news "
        f"from the last {HOURS} hours. For each item: one sentence summary, primary source URL, why it matters "
        f"for an investigative legal news outlet covering Arizona. Focus on: court rulings, regulatory actions, "
        f"school district news, transportation safety, healthcare facility actions, government accountability. "
        f"Skip national stories without an Arizona angle. Skip sports, weather, celebrity. Return at most 10 items."
    )
    return perplexity(prompt, system="You are a news desk research analyst. Return concise findings with verifiable URLs. No filler.")


def section_pplx_existing_story_updates():
    prompt = (
        f"In the last {HOURS} hours, are there any new Arizona news developments that connect to these existing "
        f"AZ Law Now investigation topics? For each match, provide: connecting fact, source URL, suggested action.\n\n"
        f"Existing topics:\n"
        f"1. Tempe ASU pavement / 180-day Notice of Claim / scooter-bike injuries\n"
        f"2. Arizona private career schools / for-profit education / Title IV / Pima Medical, Carrington\n"
        f"3. Arizona schools indoor air quality / MERV 13 / HVAC negligence / PM2.5\n"
        f"4. Buckeye intersection design / roundabouts / FHWA\n"
        f"5. Mesa Grand Court elder abuse / HB2228 / nursing home regulation\n"
        f"6. Arizona school restraint data / disability rights\n"
        f"7. Maricopa daycare DHS violations\n"
        f"8. Arizona pedestrian deaths / road design\n"
        f"Return only matches found, max 8 items."
    )
    return perplexity(prompt, system="You are an editorial researcher tracking continuing investigations. Return only verifiable connections with URLs.")


def section_x_recent():
    queries = [
        "(Arizona OR Phoenix OR Tempe OR Maricopa) (lawsuit OR ruling OR investigation OR \"public records\") -is:retweet -is:reply lang:en",
        "(\"AZ Department of Health\" OR \"AZ DHS\" OR \"Arizona AG\" OR \"Arizona Attorney General\") -is:retweet -is:reply",
        "(\"Phoenix Union\" OR \"Mesa Public Schools\" OR \"Tempe Union\" OR \"Scottsdale Unified\") (HVAC OR investigation OR lawsuit OR safety) -is:retweet",
        "(\"e-bike\" OR \"e-scooter\") Arizona (crash OR injury OR ban OR regulation) -is:retweet",
    ]
    out = {}
    for q in queries:
        time.sleep(2)
        items = x_recent_search(q, max_results=10)
        out[q] = items
    return out


def section_web_search():
    queries = [
        "Arizona court ruling 2026",
        "Phoenix school district lawsuit 2026",
        "Maricopa County investigation",
        "Arizona regulatory action 2026",
        "Tempe ASU policy 2026",
    ]
    out = {}
    for q in queries:
        try:
            items = web_search(q, limit=8)
            out[q] = [{"title": i.get("title", ""), "url": i.get("url", ""), "description": i.get("description", "")[:200]} for i in items]
            time.sleep(1)
        except Exception as e:
            out[q] = [{"error": str(e)}]
    return out


def section_kw_trending():
    if not KW_LOGIN or not KW_PASS or not KW_URL:
        return {"error": "no kw creds"}
    payload = [{
        "language_code": "en",
        "location_code": 2840,
        "keywords": [
            "arizona court ruling",
            "phoenix lawsuit",
            "tempe school",
            "maricopa daycare",
            "arizona scooter accident",
            "arizona school air quality",
            "arizona career school",
        ],
    }]
    with open("/tmp/_kw.json", "w") as f:
        json.dump(payload, f)
    r = subprocess.run(
        ["curl", "-s", "-u", f"{KW_LOGIN}:{KW_PASS}",
         "-X", "POST", KW_URL,
         "-H", "Content-Type: application/json", "-d", "@/tmp/_kw.json"],
        capture_output=True, text=True, check=True,
    )
    try:
        d = json.loads(r.stdout)
        results = []
        for task in d.get("tasks", []):
            for r2 in task.get("result", []) or []:
                results.append({
                    "keyword": r2.get("keyword"),
                    "search_volume": r2.get("search_volume"),
                    "cpc": r2.get("cpc"),
                    "competition": r2.get("competition"),
                })
        return results
    except Exception as e:
        return {"error": str(e)}


def main():
    print(f"=== AZ Law Now breaking-news scan | last {HOURS}h | {datetime.now().isoformat()} ===\n")

    print("[1/5] Generative search AZ news scan...")
    az_news = section_pplx_az_news()
    print(f"   ({len(az_news)} chars)")

    print("[2/5] Generative search existing-story updates...")
    updates = section_pplx_existing_story_updates()
    print(f"   ({len(updates)} chars)")

    print("[3/5] X recent search...")
    x_data = section_x_recent() if X_BEARER else {"error": "no X bearer"}
    print(f"   ({len(x_data)} queries)" if isinstance(x_data, dict) else "")

    print("[4/5] Web search...")
    ws_data = section_web_search()
    print(f"   ({len(ws_data)} queries)")

    print("[5/5] Keyword volume snapshot...")
    kw_data = section_kw_trending()
    print(f"   ({len(kw_data) if isinstance(kw_data, list) else 'err'})")

    bulletin = {
        "date": today,
        "scan_window_hours": HOURS,
        "az_news": az_news,
        "existing_story_updates": updates,
        "x_recent": x_data,
        "web_search": ws_data,
        "keyword_volume": kw_data,
    }
    json_out = OUT_DIR / f"{today}.json"
    json_out.write_text(json.dumps(bulletin, indent=2))

    md_out = OUT_DIR / f"{today}.md"
    md = []
    md.append(f"# AZ Law Now breaking-news scan, {today}")
    md.append(f"Scan window: last {HOURS} hours.\n")
    md.append("## 1. New AZ stories")
    md.append(az_news + "\n")
    md.append("## 2. Updates to existing investigations")
    md.append(updates + "\n")
    md.append("## 3. X recent (named accounts + AZ legal keywords)")
    if isinstance(x_data, dict):
        for q, items in x_data.items():
            md.append(f"### query: `{q}`")
            for t in (items or [])[:5]:
                md.append(f"- @{t.get('username','')}: {t.get('text','')}  ({t.get('created_at','')})")
    md.append("")
    md.append("## 4. Web search hits")
    if isinstance(ws_data, dict):
        for q, items in ws_data.items():
            md.append(f"### `{q}`")
            for i in (items or [])[:5]:
                if "error" in i:
                    md.append(f"- ERROR: {i['error']}")
                else:
                    md.append(f"- [{i.get('title','')[:80]}]({i.get('url','')})")
    md.append("")
    md.append("## 5. Keyword volume snapshot")
    if isinstance(kw_data, list):
        md.append("| keyword | volume | cpc | competition |")
        md.append("|---|---|---|---|")
        for r in kw_data:
            md.append(f"| {r.get('keyword','')} | {r.get('search_volume','')} | {r.get('cpc','')} | {r.get('competition','')} |")
    else:
        md.append(f"kw error: {kw_data}")

    md_out.write_text("\n".join(md))
    print(f"\n✓ Bulletin written: {md_out}")
    print(f"✓ Raw JSON: {json_out}")


if __name__ == "__main__":
    main()
