#!/usr/bin/env python3
"""One-shot: convert netlify.toml [[redirects]] blocks → public/_redirects.

Netlify's native `_redirects` format is plain text, one rule per line:
    /from-path  /to-path  301!

It parses ~5× faster at deploy time than TOML, and keeps `netlify.toml` focused
on build / headers / functions config only.

What this script does:
  1. Parse every [[redirects]] block from netlify.toml
  2. Convert to _redirects format (from + to + status[!])
  3. Preserve TOML comments that appear immediately above redirect blocks
  4. Write public/_redirects
  5. Rewrite netlify.toml with all [[redirects]] sections removed (preserving build/headers/functions)

Idempotent — running it twice produces the same output.

Usage:
  python3 scripts/seo/toml-to-redirects.py            # do it
  python3 scripts/seo/toml-to-redirects.py --dry-run  # show what would change
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
NETLIFY_TOML = ROOT / "netlify.toml"
REDIRECTS_FILE = ROOT / "public" / "_redirects"


def parse_redirects(text: str) -> tuple[list[dict], list[tuple[int, int]]]:
    """Return (redirects, ranges-to-strip).
    Each redirect: {from, to, status, force, comment, start_line, end_line}.
    """
    lines = text.splitlines()
    redirects: list[dict] = []
    strip_ranges: list[tuple[int, int]] = []  # inclusive start, exclusive end

    i = 0
    while i < len(lines):
        if lines[i].strip() == "[[redirects]]":
            block_start = i
            # Walk back to capture leading comments and blank lines that belong
            # to this block (until we hit another block or non-comment content).
            comment_start = i
            j = i - 1
            while j >= 0:
                stripped = lines[j].strip()
                if stripped == "" or stripped.startswith("#"):
                    comment_start = j
                    j -= 1
                else:
                    break
            # Don't claim the trailing blank line of the previous block —
            # only claim a comment run that's contiguous up to our block header.
            # Move comment_start forward past any leading blank lines so we
            # only keep the comment lines themselves.
            while comment_start < i and lines[comment_start].strip() == "":
                comment_start += 1

            comment = ""
            if comment_start < i:
                comment = "\n".join(lines[comment_start:i])

            # Parse the block body
            block = {"from": "", "to": "", "status": "", "force": False,
                     "comment": comment, "headers": {}}
            k = i + 1
            while k < len(lines):
                line = lines[k].strip()
                if not line or line.startswith("["):
                    break
                m = re.match(r'^([a-zA-Z_]+)\s*=\s*(.+?)\s*$', line)
                if not m:
                    k += 1
                    continue
                key, raw = m.group(1), m.group(2).strip()
                # Strip quotes from string values
                if raw.startswith('"') and raw.endswith('"'):
                    raw = raw[1:-1]
                elif raw.startswith("'") and raw.endswith("'"):
                    raw = raw[1:-1]
                if key == "from":
                    block["from"] = raw
                elif key == "to":
                    block["to"] = raw
                elif key == "status":
                    block["status"] = raw
                elif key == "force":
                    block["force"] = raw.lower() == "true"
                # ignore other keys (signed, conditions, etc. — could add later)
                k += 1
            block["start_line"] = comment_start
            block["end_line"] = k  # exclusive
            redirects.append(block)
            strip_ranges.append((comment_start, k))
            i = k
        else:
            i += 1

    return redirects, strip_ranges


def to_redirects_line(r: dict) -> str:
    """Emit Netlify _redirects-format line: `from to status[!]`."""
    status = r["status"] or "301"
    suffix = "!" if r["force"] else ""
    # _redirects uses whitespace as separator; pad for readability
    return f"{r['from']:<60}  {r['to']:<60}  {status}{suffix}"


def build_redirects_file(redirects: list[dict]) -> str:
    out = [
        "# AZ Law Now — Netlify _redirects",
        "#",
        "# Migrated from netlify.toml [[redirects]] on 2026-05-11 for parse-speed",
        "# and to keep netlify.toml focused on build/headers/functions config.",
        "#",
        "# Format: from-path  to-path  status[!]",
        "# The trailing ! makes the redirect a 'force' redirect that runs even",
        "# when a real file exists at the from path.",
        "#",
        "# Edits are managed by scripts/seo/build-redirects.py and",
        "# scripts/seo/toml-to-redirects.py. Manual edits are fine — both",
        "# scripts preserve hand-written comments.",
        "",
    ]
    for r in redirects:
        if r["comment"]:
            # Re-emit the comment block (already starts with #)
            out.append("")
            out.append(r["comment"])
        out.append(to_redirects_line(r))
    return "\n".join(out) + "\n"


def strip_redirect_blocks(toml_text: str, strip_ranges: list[tuple[int, int]]) -> str:
    """Remove the parsed [[redirects]] blocks (and their leading comments) from netlify.toml."""
    lines = toml_text.splitlines()
    keep = [True] * len(lines)
    for start, end in strip_ranges:
        for i in range(start, min(end, len(lines))):
            keep[i] = False
    result = [lines[i] for i in range(len(lines)) if keep[i]]
    # Collapse runs of >2 blank lines into 1
    cleaned = []
    blank_run = 0
    for line in result:
        if line.strip() == "":
            blank_run += 1
            if blank_run <= 1:
                cleaned.append(line)
        else:
            blank_run = 0
            cleaned.append(line)
    text = "\n".join(cleaned)
    # Inject a pointer comment so anyone reading netlify.toml knows where redirects live
    pointer = (
        "\n# All [[redirects]] rules live in public/_redirects (Netlify's native\n"
        "# plain-text redirect format). Edit there for new 301/302/410 rules.\n"
    )
    if "public/_redirects" not in text:
        # Insert pointer after [build.environment] section if present, else at top
        m = re.search(r"\n\[build\.environment\][^\[]*", text)
        if m:
            insert_at = m.end()
            text = text[:insert_at] + pointer + text[insert_at:]
        else:
            text = pointer + "\n" + text
    return text + "\n"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if not NETLIFY_TOML.exists():
        sys.exit(f"Missing {NETLIFY_TOML}")

    toml_text = NETLIFY_TOML.read_text()
    redirects, strip_ranges = parse_redirects(toml_text)

    print(f"Found {len(redirects)} [[redirects]] in netlify.toml")

    redirects_text = build_redirects_file(redirects)
    cleaned_toml = strip_redirect_blocks(toml_text, strip_ranges)

    if args.dry_run:
        print("\n--- DRY RUN ---")
        print(f"  Would write {REDIRECTS_FILE.relative_to(ROOT)} ({len(redirects_text)} bytes)")
        print(f"  Would shrink netlify.toml from {len(toml_text)} → {len(cleaned_toml)} bytes")
        print(f"\nSample _redirects output (first 25 lines):")
        for line in redirects_text.splitlines()[:25]:
            print(f"  {line}")
        return

    REDIRECTS_FILE.parent.mkdir(parents=True, exist_ok=True)
    REDIRECTS_FILE.write_text(redirects_text)
    NETLIFY_TOML.write_text(cleaned_toml)

    print(f"\n✓ Wrote {REDIRECTS_FILE.relative_to(ROOT)} ({len(redirects)} rules, {len(redirects_text):,} bytes)")
    print(f"✓ Rewrote {NETLIFY_TOML.relative_to(ROOT)} ({len(toml_text):,} → {len(cleaned_toml):,} bytes)")
    print(f"\nNext: review the diff, then commit.")


if __name__ == "__main__":
    main()
