#!/usr/bin/env python3
"""De-duplicate FAQ blocks across all MDX collections.

Same bug class as dedupe-sources-blocks.py:
- Layout auto-renders frontmatter `faqs:` via <ArticleFAQ> in ArticleLayout.astro
- MDX bodies import {FAQ, Question} from '@/components/mdx/FAQ' and render
  the same questions inline. Result: every page shows TWO FAQ accordions.

Fix: parse body <FAQ><Question q="...">answer</Question></FAQ> block,
merge any question whose text isn't already in frontmatter into faqs[],
strip the body block, strip the now-unused FAQ import.

Usage:
  python3 scripts/dedupe-faq-blocks.py --dry-run        # show diffs
  python3 scripts/dedupe-faq-blocks.py                  # write changes
  python3 scripts/dedupe-faq-blocks.py --slug X         # single file
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


def normalize_q(q: str) -> str:
    return re.sub(r"\s+", " ", q.strip().lower()).rstrip("?!.")


def parse_frontmatter_faqs(fm: str) -> tuple[list[dict], int, int]:
    """Return (faqs, start_line_idx, end_line_idx) for the faqs: block.
    Each faq is {question: str, answer: str}. The block starts at "faqs:" and
    runs through all subsequent lines that look like YAML list items belonging
    to that block."""
    lines = fm.splitlines()
    faqs: list[dict] = []
    start_idx = -1
    end_idx = -1
    in_block = False
    current: dict | None = None
    for i, line in enumerate(lines):
        if not in_block:
            if re.match(r"^faqs:\s*$", line):
                in_block = True
                start_idx = i
                continue
        else:
            # New top-level key (no leading whitespace, ends with :) -> end of faqs block
            if re.match(r"^[A-Za-z_][\w-]*:\s*", line) and not line.startswith(" "):
                break
            # New list item starting a new question
            qm = re.match(r'^\s+-\s+question:\s+"(.*)"\s*$', line)
            if qm:
                if current:
                    faqs.append(current)
                current = {"question": qm.group(1), "answer": ""}
                end_idx = i
                continue
            # Answer line under current
            am = re.match(r'^\s+answer:\s+"(.*)"\s*$', line)
            if am and current is not None:
                current["answer"] = am.group(1)
                end_idx = i
                continue
            # Continuation of YAML block (indented) — count as still in block
            if line.startswith(" ") or line.strip() == "":
                end_idx = i
                continue
            break
    if current:
        faqs.append(current)
    return faqs, start_idx, end_idx


def parse_body_faq_block(body: str) -> tuple[list[dict], int, int]:
    """Return (faqs, start_char, end_char) of the body <FAQ>...</FAQ> block."""
    m = re.search(r"<FAQ>([\s\S]*?)</FAQ>", body)
    if not m:
        return [], -1, -1
    inner = m.group(1)
    faqs: list[dict] = []
    # Each Question element: <Question q="...">answer text</Question>
    for qm in re.finditer(r'<Question\s+q="([^"]*)">\s*([\s\S]*?)\s*</Question>', inner):
        q = qm.group(1).strip()
        a = qm.group(2).strip()
        a = re.sub(r"\s+", " ", a)
        if q:
            faqs.append({"question": q, "answer": a})
    return faqs, m.start(), m.end()


def yaml_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


def remove_faq_import(body: str) -> str:
    # Drop any line importing FAQ from mdx/FAQ
    lines = body.splitlines(keepends=True)
    new_lines = []
    for line in lines:
        if re.match(r"^\s*import\s*{[^}]*\bFAQ\b[^}]*}\s*from\s*['\"][^'\"]*mdx/FAQ['\"];?\s*$", line):
            continue
        new_lines.append(line)
    return "".join(new_lines)


def process_file(path: Path) -> dict:
    raw = path.read_text()
    fm_match = re.match(r"^(---\n)([\s\S]*?)(\n---\n)([\s\S]*)$", raw)
    if not fm_match:
        return {"path": path, "skipped": "no frontmatter"}
    fm_open, fm_body, fm_close, body = fm_match.groups()

    fm_faqs, fm_start, fm_end = parse_frontmatter_faqs(fm_body)
    body_faqs, body_start, body_end = parse_body_faq_block(body)

    if not body_faqs:
        return {"path": path, "skipped": "no body FAQ block"}

    fm_qs = {normalize_q(f["question"]) for f in fm_faqs}
    new_to_add: list[dict] = []
    for bf in body_faqs:
        if normalize_q(bf["question"]) not in fm_qs:
            new_to_add.append(bf)
            fm_qs.add(normalize_q(bf["question"]))

    fm_lines = fm_body.splitlines()
    new_faqs = fm_faqs + new_to_add
    new_block_lines = ["faqs:"]
    for f in new_faqs:
        new_block_lines.append(f'  - question: "{yaml_escape(f["question"])}"')
        new_block_lines.append(f'    answer: "{yaml_escape(f["answer"])}"')

    if fm_start >= 0:
        fm_lines = fm_lines[:fm_start] + new_block_lines + fm_lines[fm_end + 1 :]
    else:
        fm_lines = fm_lines + new_block_lines

    new_fm_body = "\n".join(fm_lines)
    new_body = body[:body_start].rstrip() + "\n" + body[body_end:].lstrip()
    new_body = remove_faq_import(new_body)

    new_raw = fm_open + new_fm_body + fm_close + new_body

    return {
        "path": path,
        "fm_count_before": len(fm_faqs),
        "body_count": len(body_faqs),
        "merged_in": len(new_to_add),
        "fm_count_after": len(fm_faqs) + len(new_to_add),
        "merged_questions": [f["question"][:80] for f in new_to_add],
        "new_raw": new_raw,
    }


def main():
    files: list[Path] = []
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
            for q in r["merged_questions"][:3]:
                print(f"      + {q}")

    if DRY_RUN:
        print("\nDRY RUN, no files written.")
        return

    for r in affected:
        r["path"].write_text(r["new_raw"])
    print(f"\n✓ Wrote {len(affected)} files.")


if __name__ == "__main__":
    main()
