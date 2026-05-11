#!/usr/bin/env python3
"""De-duplicate the sources/references blocks across investigations.

The bug: 18 of 36 investigations render TWO sources blocks on the live page.
- The frontmatter `dataSources:` field is auto-rendered by ArticleSources.astro
- A hand-written `<div class="references">` block in the MDX body renders again
Same data twice, different formats.

The fix is NOT to strip the body block naively (it contains unique URLs
the frontmatter doesn't have). The fix is:
1. Parse both lists.
2. Merge any body citation whose URL isn't already in frontmatter.
3. Strip the body `<div class="references">` block.
4. Now frontmatter is the single source of truth + ArticleSources renders
   it once per page.

Usage:
  python3 scripts/dedupe-sources-blocks.py --dry-run       # show diffs
  python3 scripts/dedupe-sources-blocks.py                 # write changes
  python3 scripts/dedupe-sources-blocks.py --slug X        # single file
"""
from __future__ import annotations
import os, re, sys
from pathlib import Path

CONTENT_DIRS = [
    Path("/Users/taqticlaw/Projects/azlawnow/src/content/investigations"),
    Path("/Users/taqticlaw/Projects/azlawnow/src/content/legal-guides"),
    Path("/Users/taqticlaw/Projects/azlawnow/src/content/client-guides"),
    Path("/Users/taqticlaw/Projects/azlawnow/src/content/practice-areas"),
]

DRY_RUN = "--dry-run" in sys.argv
ONE_SLUG = None
for i, a in enumerate(sys.argv):
    if a == "--slug" and i + 1 < len(sys.argv):
        ONE_SLUG = sys.argv[i + 1]


def normalize_url(u: str) -> str:
    """Normalize a URL for comparison (strip trailing punctuation, normalize trailing slash)."""
    u = u.strip().rstrip(".,);")
    return u.lower().rstrip("/")


def parse_frontmatter_dataSources(fm: str) -> tuple[list[str], int, int]:
    """Return (citations, start_line_in_fm, end_line_in_fm) for the dataSources: block.
    citations is the list of full citation strings (each as it appears, minus YAML quoting)."""
    lines = fm.splitlines()
    citations: list[str] = []
    start_idx = -1
    end_idx = -1
    in_block = False
    for i, line in enumerate(lines):
        if not in_block:
            if re.match(r"^dataSources:\s*$", line):
                in_block = True
                start_idx = i
                continue
        else:
            m = re.match(r'^\s+-\s+"(.*)"\s*$', line) or re.match(r"^\s+-\s+(.+)$", line)
            if m:
                citations.append(m.group(1).strip().strip('"'))
                end_idx = i
            else:
                # block ended at previous line
                break
    return citations, start_idx, end_idx


def parse_body_references(body: str) -> tuple[list[str], int, int]:
    """Return (citations, start_char, end_char) of the body <div class="references"> block.
    citations are the full citation strings (without the leading "N. ")."""
    m = re.search(r'<div class="references">[\s\S]*?</div>', body)
    if not m:
        return [], -1, -1
    block = m.group(0)
    # Match lines like "1. Author. (Year). Title. https://..."
    citations = []
    for line_match in re.finditer(r"^\s*\d+\.\s+(.+?)\s*$", block, re.M):
        cit = line_match.group(1).strip()
        if cit and "http" in cit:
            citations.append(cit)
    return citations, m.start(), m.end()


def url_from_citation(cit: str) -> str | None:
    m = re.search(r"https?://[^\s\)\]\"]+", cit)
    return normalize_url(m.group(0)) if m else None


def yaml_escape(s: str) -> str:
    """YAML-escape a string for use inside double quotes."""
    return s.replace("\\", "\\\\").replace('"', '\\"')


def process_file(path: Path) -> dict:
    raw = path.read_text()
    fm_match = re.match(r"^(---\n)([\s\S]*?)(\n---\n)([\s\S]*)$", raw)
    if not fm_match:
        return {"path": path, "skipped": "no frontmatter"}
    fm_open, fm_body, fm_close, body = fm_match.groups()

    fm_cits, fm_start, fm_end = parse_frontmatter_dataSources(fm_body)
    body_cits, body_start, body_end = parse_body_references(body)

    if not body_cits:
        return {"path": path, "skipped": "no body references block"}

    fm_urls = {url_from_citation(c) for c in fm_cits if url_from_citation(c)}
    new_to_add: list[str] = []
    for bc in body_cits:
        u = url_from_citation(bc)
        if u and u not in fm_urls:
            new_to_add.append(bc)
            fm_urls.add(u)

    # Build new frontmatter: replace the dataSources: block with merged list
    fm_lines = fm_body.splitlines()
    if fm_start >= 0:
        # Replace lines [fm_start ... fm_end] with new dataSources block
        new_ds_lines = ["dataSources:"]
        for c in fm_cits + new_to_add:
            new_ds_lines.append(f'  - "{yaml_escape(c)}"')
        fm_lines = fm_lines[:fm_start] + new_ds_lines + fm_lines[fm_end + 1 :]
    else:
        # No existing dataSources field. Insert one before the close.
        new_ds_lines = ["dataSources:"]
        for c in body_cits:
            new_ds_lines.append(f'  - "{yaml_escape(c)}"')
        fm_lines = fm_lines + new_ds_lines

    new_fm_body = "\n".join(fm_lines)
    # Strip body block + the surrounding blank lines (one before, none after)
    new_body = body[:body_start].rstrip() + "\n" + body[body_end:].lstrip()

    new_raw = fm_open + new_fm_body + fm_close + new_body

    return {
        "path": path,
        "fm_count_before": len(fm_cits),
        "body_count": len(body_cits),
        "merged_in": len(new_to_add),
        "fm_count_after": len(fm_cits) + len(new_to_add),
        "merged_citations": new_to_add,
        "new_raw": new_raw,
    }


def main():
    files = []
    for d in CONTENT_DIRS:
        files.extend(sorted(d.glob("*.mdx")))
    if ONE_SLUG:
        files = [f for f in files if f.stem == ONE_SLUG]
    affected = []
    for f in files:
        r = process_file(f)
        if r.get("skipped"):
            continue
        affected.append(r)

    print(f"Affected files: {len(affected)}")
    for r in affected:
        slug = r["path"].stem
        print(f"\n  {slug}")
        print(f"    fm before: {r['fm_count_before']}  body: {r['body_count']}  merged-in: {r['merged_in']}  fm after: {r['fm_count_after']}")
        if r["merged_in"] and DRY_RUN:
            for c in r["merged_citations"][:3]:
                print(f"      + {c[:120]}")

    if DRY_RUN:
        print("\nDRY RUN — no files written.")
        return

    for r in affected:
        r["path"].write_text(r["new_raw"])
    print(f"\n✓ Wrote {len(affected)} files.")


if __name__ == "__main__":
    main()
