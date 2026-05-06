#!/usr/bin/env python3
"""Score the 35 published AZ Law Now investigations on Tynski-doctrine eligibility for the
3-chart editorial treatment.

Each investigation is scored 1-10 on three axes:
  - bomb_stat: does the MDX (or dossier) contain a single quotable bomb stat that could
    anchor a stat-leads-chart pattern?
  - chart_data: is there tabular data, breakdown, or comparison that maps to one of the
    three approved chart types (horizontal bar sorted, scatter quadrant, comparison table)?
  - closing_thesis: is there a candidate one-sentence closing thesis (under 15 words,
    comparison framing) that could replace any current CTA?

Plus a binary flag:
  - has_dossier: do we have a verification-tagged dossier for this story (HIGH/MEDIUM/FLAG)

Total out of 30. Tier S = 24+. Tier A = 18-23. Tier B = 12-17. Tier C = below 12.
"""
import os, re, json, sys
from pathlib import Path

INV_DIR = Path("/Users/taqticlaw/Projects/azlawnow/src/content/investigations")
DOSSIER_DIR = Path("/Users/taqticlaw/Projects/azlawnow/data/research")

# Heuristics
DOLLAR_PATTERN = re.compile(r"\$[\d.]+\s*(?:M|B|K|million|billion|thousand)?", re.I)
PERCENT_PATTERN = re.compile(r"\b\d{1,3}(?:\.\d+)?%\b")
COUNT_PATTERN = re.compile(r"\b\d{2,5}\b")  # 2-5 digit counts
RATIO_PATTERN = re.compile(r"\b\d+\s*(?:in|of|to|out\s+of|per)\s*\d+\b", re.I)
BIG_NUMBER_PATTERN = re.compile(r"\b\d{1,3}(?:,\d{3})+\b")
COMPARISON_WORDS = ["vs", "versus", "compared to", "against", "while", "but", "but only", "than"]
CHART_DATA_HINTS = ["per facility", "per county", "per district", "per year", "by county", "by year", "by district",
                    "by carrier", "by agency", "by category", "rate", "%", "percent", "average", "median",
                    "ratio", "breakdown", "distribution", "ranking", "top \\d", "first \\d"]
TABLE_PATTERN = re.compile(r"^\|.*\|.*\|", re.M)
KEYFACTS_PATTERN = re.compile(r"<KeyFacts>", re.I)
STATBLOCK_PATTERN = re.compile(r"<StatBlock", re.I)


def load_mdx(slug: str) -> dict:
    f = INV_DIR / f"{slug}.mdx"
    if not f.exists():
        return {"title": "", "body": "", "frontmatter": {}}
    raw = f.read_text()
    m = re.match(r"^---\n([\s\S]*?)\n---\n([\s\S]*)$", raw)
    if not m:
        return {"title": "", "body": raw, "frontmatter": {}}
    fm_raw, body = m.group(1), m.group(2)
    fm = {}
    title_match = re.search(r'^title:\s*"?([^"\n]+)"?', fm_raw, re.M)
    if title_match:
        fm["title"] = title_match.group(1).strip().strip('"')
    return {"title": fm.get("title", ""), "body": body, "frontmatter": fm}


def score_bomb_stat(text: str) -> tuple[int, list[str]]:
    """Score 1-10 on whether there's a quotable bomb stat lurking."""
    findings = []
    score = 1
    # Search the first 600 chars + key takeaway + first H2 for stat candidates
    head = text[:1500]
    dollars = DOLLAR_PATTERN.findall(head)
    percents = PERCENT_PATTERN.findall(head)
    big_nums = BIG_NUMBER_PATTERN.findall(head)
    ratios = RATIO_PATTERN.findall(head)
    if dollars:
        findings.append(f"$-figure: {dollars[0]}"); score += 3
    if percents:
        findings.append(f"%-figure: {percents[0]}"); score += 3
    if big_nums:
        findings.append(f"big-num: {big_nums[0]}"); score += 2
    if ratios:
        findings.append(f"ratio: {ratios[0]}"); score += 2
    # Check for KeyFacts / StatBlock components — indicates structured stat presence
    if KEYFACTS_PATTERN.search(text):
        findings.append("KeyFacts component"); score += 1
    if STATBLOCK_PATTERN.search(text):
        findings.append("StatBlock component"); score += 1
    return min(score, 10), findings


def score_chart_data(text: str) -> tuple[int, list[str]]:
    """Score 1-10 on whether there's chart-mappable data."""
    findings = []
    score = 1
    # Look for tables (even partial markdown tables), breakdowns, distributions
    if TABLE_PATTERN.search(text):
        findings.append("markdown table"); score += 4
    chart_hint_count = 0
    for hint in CHART_DATA_HINTS:
        if re.search(r"\b" + hint + r"\b", text, re.I):
            chart_hint_count += 1
    if chart_hint_count >= 4:
        findings.append(f"{chart_hint_count} chart-data hints"); score += 4
    elif chart_hint_count >= 2:
        findings.append(f"{chart_hint_count} chart-data hints"); score += 2
    elif chart_hint_count >= 1:
        findings.append(f"{chart_hint_count} chart-data hint"); score += 1
    # Multiple counts of the same kind suggest a series
    percent_count = len(PERCENT_PATTERN.findall(text))
    dollar_count = len(DOLLAR_PATTERN.findall(text))
    if percent_count >= 4:
        findings.append(f"{percent_count} percentages (series candidate)"); score += 1
    if dollar_count >= 3:
        findings.append(f"{dollar_count} dollar figures (series candidate)"); score += 1
    return min(score, 10), findings


def score_closing_thesis(text: str) -> tuple[int, list[str]]:
    """Score 1-10 on closing-thesis candidate presence."""
    findings = []
    score = 1
    # Look at the last 400 chars (closing area) for a quotable line
    closing = text[-1000:]
    # Comparison framing
    has_comparison = any(w in closing.lower() for w in COMPARISON_WORDS)
    if has_comparison:
        findings.append("comparison phrasing in closing"); score += 3
    # Short sentences in the closing block
    sentences = re.split(r"[.!?]\s+", closing)
    short_punchy = [s for s in sentences if 30 < len(s.strip()) < 100 and not s.strip().startswith("<")]
    if short_punchy:
        findings.append(f"{len(short_punchy)} punchy short sentences in closing")
        score += min(len(short_punchy), 4)
    # Existing CTA pattern (this is a NEGATIVE — we'd be replacing it)
    if "contact us" in closing.lower() or "schedule" in closing.lower() or "learn more" in closing.lower():
        findings.append("⚠️ existing CTA to remove")
    # If there's a Callout type=info at the end (the standard editorial closing), count it
    if "<Callout" in closing:
        findings.append("Callout closing block (existing pattern)"); score += 2
    return min(score, 10), findings


def has_dossier(slug: str) -> bool:
    return (DOSSIER_DIR / f"{slug}-dossier.md").exists()


def score_investigation(slug: str) -> dict:
    data = load_mdx(slug)
    text = data["body"]
    bs, bs_findings = score_bomb_stat(text)
    cd, cd_findings = score_chart_data(text)
    ct, ct_findings = score_closing_thesis(text)
    total = bs + cd + ct
    if total >= 24:
        tier = "S"
    elif total >= 18:
        tier = "A"
    elif total >= 12:
        tier = "B"
    else:
        tier = "C"
    return {
        "slug": slug,
        "title": data["title"],
        "has_dossier": has_dossier(slug),
        "scores": {"bomb_stat": bs, "chart_data": cd, "closing_thesis": ct, "total": total},
        "tier": tier,
        "findings": {"bomb_stat": bs_findings, "chart_data": cd_findings, "closing_thesis": ct_findings},
    }


def main():
    slugs = sorted([f.stem for f in INV_DIR.glob("*.mdx")])
    results = [score_investigation(s) for s in slugs]
    results.sort(key=lambda r: (-r["scores"]["total"], r["slug"]))

    print(f"{'TIER':<4} {'TOT':<4} {'BS':<3} {'CD':<3} {'CT':<3} {'DOSSIER':<8} SLUG")
    print("-" * 100)
    for r in results:
        s = r["scores"]
        d = "yes" if r["has_dossier"] else ""
        print(f"{r['tier']:<4} {s['total']:<4} {s['bomb_stat']:<3} {s['chart_data']:<3} {s['closing_thesis']:<3} {d:<8} {r['slug']}")

    print("\n" + "=" * 60)
    print("TIER S (run first):")
    for r in [r for r in results if r["tier"] == "S"]:
        print(f"  {r['slug']} (total={r['scores']['total']})")
        print(f"    bomb-stat findings: {r['findings']['bomb_stat']}")
        print(f"    chart-data findings: {r['findings']['chart_data']}")
        print(f"    closing-thesis findings: {r['findings']['closing_thesis']}")

    print("\nTIER A (run after S):")
    for r in [r for r in results if r["tier"] == "A"]:
        print(f"  {r['slug']} (total={r['scores']['total']})")

    out_path = "/Users/taqticlaw/Projects/azlawnow/data/research/investigation-eligibility-scored-2026-05-05.json"
    json.dump(results, open(out_path, "w"), indent=2)
    print(f"\nSaved: {out_path}")


if __name__ == "__main__":
    main()
