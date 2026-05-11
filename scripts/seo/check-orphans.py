#!/usr/bin/env python3
"""AZ Law Now orphan URL HTTP checker.

For every URL that DFS/GSC shows ranking but isn't in our current src/content,
hit the live site with curl HEAD and record the status. Tags each as:

  200      — page exists and is serving content; either we missed it in our IA
             inventory, or it's a route Astro generates from a dynamic [...slug]
  301/302  — already redirected; verify the destination is correct
  404      — gone; needs a 301 to a canonical or a 410-gone
  500/etc  — server error; investigate

Inputs:
  data/research/keyword-universe.json
  data/research/content-plan-{date}.json

Output:
  data/research/orphan-triage-{date}.md
"""
from __future__ import annotations

import json
import subprocess
import sys
import urllib.parse
from collections import defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RESEARCH_DIR = ROOT / "data" / "research"
SITE = "https://azlawnow.com"


def latest_plan() -> Path:
    files = sorted(RESEARCH_DIR.glob("content-plan-*.json"))
    if not files:
        sys.exit("No content-plan found. Run plan-content.py first.")
    return files[-1]


def head(url: str, timeout: int = 10) -> tuple[int, str]:
    """Curl HEAD the URL. Return (status_code, final_url)."""
    """Two-step: first record the FIRST-HOP status, then follow to capture
    final URL so we can see WHERE redirects land."""
    try:
        # 1) First-hop status (no -L) so we see 301 vs 200
        r1 = subprocess.run(
            ["curl", "-sS", "-o", "/dev/null", "-w", "%{http_code}",
             "-I", "--max-time", str(timeout),
             "-A", "Mozilla/5.0 (compatible; azlaw-orphan-checker/1.0)",
             url],
            capture_output=True, text=True, timeout=timeout + 5,
        )
        first_status = int(r1.stdout.strip() or 0)
        # 2) Follow redirects to capture final URL for ALL responses
        r2 = subprocess.run(
            ["curl", "-sS", "-o", "/dev/null",
             "-w", "%{url_effective}",
             "-I", "-L", "--max-time", str(timeout),
             "-A", "Mozilla/5.0 (compatible; azlaw-orphan-checker/1.0)",
             url],
            capture_output=True, text=True, timeout=timeout + 5,
        )
        final = r2.stdout.strip()
        return first_status, final
    except (subprocess.TimeoutExpired, ValueError, FileNotFoundError):
        return 0, ""


def main() -> None:
    plan_path = latest_plan()
    plan = json.loads(plan_path.read_text())

    # Combine review-orphan + 301-merge "from" URLs + fix-snippet-orphan
    targets: dict[str, dict] = {}
    for action in ("review-orphan", "301-merge", "fix-snippet-orphan"):
        for p in plan.get("by_action", {}).get(action, []):
            rec = p["recommendation"]
            u = rec.get("from_url") or rec.get("target_url")
            if not u:
                continue
            # Strip UTM params for the actual HTTP check, but report the indexed form
            base = u.split("?")[0]
            if base in targets:
                # accumulate sample data
                targets[base]["queries"].append(p["query"])
                targets[base]["impressions"] = max(
                    targets[base]["impressions"],
                    rec.get("gsc_impressions") or p.get("search_volume", 0) or 0,
                )
                continue
            targets[base] = {
                "url": base,
                "action": action,
                "queries": [p["query"]],
                "best_position": p.get("our_position"),
                "impressions": rec.get("gsc_impressions") or p.get("search_volume", 0) or 0,
                "suggested_canonical": rec.get("to_url"),
            }

    print(f"Checking {len(targets)} unique orphan URLs via curl HEAD...")

    results = []
    for i, (url, meta) in enumerate(sorted(targets.items(),
                                           key=lambda x: -x[1]["impressions"])):
        code, final = head(url)
        meta["status"] = code
        meta["final_url"] = final
        results.append(meta)
        if (i + 1) % 20 == 0:
            print(f"  {i+1}/{len(targets)}...")

    # Bucket by status
    buckets: dict[str, list[dict]] = defaultdict(list)
    for r in results:
        c = r["status"]
        if c == 200:
            buckets["200_live"].append(r)
        elif c in (301, 302, 307, 308):
            # determine if final URL is acceptable (azlawnow.com vs. elsewhere)
            same = "azlawnow.com" in (r["final_url"] or "")
            buckets["3xx_redirect" if same else "3xx_offsite"].append(r)
        elif c == 404:
            buckets["404_gone"].append(r)
        elif c == 0:
            buckets["error"].append(r)
        else:
            buckets[f"{c}_other"].append(r)

    today = datetime.now().strftime("%Y-%m-%d")
    out = RESEARCH_DIR / f"orphan-triage-{today}.md"

    md = [
        f"# Orphan URL Triage — {today}",
        "",
        f"Source: `{plan_path.relative_to(ROOT)}` — combined `review-orphan` + ",
        f"`301-merge` + `fix-snippet-orphan` buckets. **{len(results)} unique URLs** checked.",
        "",
        "## Summary",
        "",
        "| Status | Count | Action |",
        "|---|---:|---|",
        f"| **200 Live** — page exists, missing from IA inventory | {len(buckets['200_live'])} | Decide: keep, redirect, or de-index |",
        f"| **3xx → azlawnow** — already redirected correctly | {len(buckets['3xx_redirect'])} | Verify destination is canonical |",
        f"| **3xx → offsite** — redirected away from our domain | {len(buckets['3xx_offsite'])} | 🔴 Investigate immediately |",
        f"| **404 Gone** — dead URL still indexed | {len(buckets['404_gone'])} | Add 301 to canonical |",
        f"| **Error / timeout** | {len(buckets['error'])} | Re-run; investigate if persistent |",
        "",
        "---",
        "",
    ]

    for bucket_name, label in [
        ("404_gone", "## 🔴 404 Gone — Dead URLs Still Indexed (highest priority)"),
        ("200_live", "## 🟡 200 Live — Pages we forgot were live"),
        ("3xx_redirect", "## ✅ 3xx → azlawnow — Already redirecting correctly"),
        ("3xx_offsite", "## ⛔ 3xx → Offsite — Redirecting OFF our domain"),
        ("error", "## ⚠️ Error / Timeout"),
    ]:
        rows = buckets.get(bucket_name, [])
        if not rows:
            continue
        rows.sort(key=lambda r: -r["impressions"])
        md += [
            "",
            label,
            "",
            "| Vol/Impr | URL | Final URL | Sample query | Action |",
            "|---:|---|---|---|---|",
        ]
        for r in rows[:50]:
            u = r["url"].replace(SITE, "")
            final = (r["final_url"] or "").replace(SITE, "") or "—"
            sample = r["queries"][0] if r["queries"] else "—"
            action = ""
            if bucket_name == "404_gone":
                action = f"301 → `{(r.get('suggested_canonical') or '').replace(SITE,'') or 'TBD'}`"
            elif bucket_name == "200_live":
                action = "Add to IA inventory OR 301 to canonical"
            elif bucket_name == "3xx_redirect":
                action = "Verify destination"
            elif bucket_name == "3xx_offsite":
                action = "🔴 Investigate — should never redirect offsite"
            else:
                action = "Re-run curl"
            md.append(f"| {r['impressions']} | `{u}` | `{final}` | {sample[:40]} | {action} |")

    md += [
        "",
        "---",
        "",
        "## Next steps",
        "",
        "1. **All 404s** → add to `netlify.toml` as `[[redirects]]` with `status = 301`",
        "   using the suggested canonical, OR `status = 410` if no canonical exists.",
        "2. **All 200 lives** — decide: are these meant to be in the new IA? If yes,",
        "   add to `src/content/` so they're tracked. If no, 301 them to the canonical.",
        "3. **Any 3xx offsite** — investigate immediately. There should never be a redirect",
        "   from our own domain to another site.",
        "4. Re-run `scripts/seo/build-redirects.py` after deciding the 404 destinations to",
        "   regenerate `proposed-redirects-{date}.toml`.",
    ]

    out.write_text("\n".join(md))
    print(f"\n✓ Wrote {out.relative_to(ROOT)}")
    print(f"\n=== Triage summary ===")
    for k, v in buckets.items():
        print(f"  {k:18}  {len(v):>3}")


if __name__ == "__main__":
    main()
