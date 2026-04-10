#!/usr/bin/env python3
"""
Convert <Sources>/<Source> React component blocks to AEE-style
<div class="references"> blocks with flat URLs.

Removes the Sources/Source import line and replaces the JSX block
with a numbered list including visible flat URLs.
"""

import re
import glob
import os

CONTENT_DIRS = [
    'src/content/insights',
    'src/content/legal-guides',
    'src/content/client-guides',
]

# Match a <Source ... /> with self-closing tag, captures attributes
SOURCE_RE = re.compile(
    r'<Source\s+((?:[^>]|>(?!\s*</))*?)\s*/>',
    re.DOTALL
)

ATTR_RE = re.compile(r'(\w+)="([^"]*)"')


def parse_sources(block_text: str):
    """Parse a <Sources>...</Sources> block into a list of dicts."""
    sources = []
    for m in SOURCE_RE.finditer(block_text):
        attrs = dict(ATTR_RE.findall(m.group(1)))
        if attrs.get('url'):
            sources.append(attrs)
    return sources


def format_apa(source: dict, idx: int) -> str:
    """Format one source as a numbered APA-style reference with flat URL."""
    parts = []
    org = source.get('org', '').strip()
    date = source.get('date', '').strip()
    title = source.get('title', '').strip()
    url = source.get('url', '').strip()

    if org:
        parts.append(f"{org}.")
    if date:
        parts.append(f"({date}).")
    if title:
        parts.append(f"{title}.")
    if url:
        parts.append(url)

    return f"{idx}. {' '.join(parts)}"


def convert_file(path: str) -> bool:
    """Convert one MDX file. Returns True if changed."""
    with open(path) as f:
        content = f.read()

    # Find <Sources>...</Sources> block
    sources_match = re.search(
        r'<Sources>(.*?)</Sources>',
        content,
        re.DOTALL,
    )
    if not sources_match:
        return False

    block_text = sources_match.group(1)
    sources = parse_sources(block_text)
    if not sources:
        return False

    # Build the references block (AEE format)
    lines = ['<div class="references">', '<span class="references-label">References</span>', '']
    for i, source in enumerate(sources, start=1):
        lines.append(format_apa(source, i))
        lines.append('')
    lines.append('</div>')
    new_block = '\n'.join(lines)

    # Replace the <Sources>...</Sources> block
    content = content[:sources_match.start()] + new_block + content[sources_match.end():]

    # Remove the Sources/Source import line if present
    content = re.sub(
        r"^import\s*\{\s*Sources\s*,\s*Source\s*\}\s*from\s*['\"][^'\"]+['\"]\s*;?\s*\n",
        '',
        content,
        flags=re.MULTILINE,
    )

    with open(path, 'w') as f:
        f.write(content)

    return True


def main():
    converted = 0
    for d in CONTENT_DIRS:
        for path in sorted(glob.glob(os.path.join(d, '*.mdx'))):
            if convert_file(path):
                converted += 1
                print(f'  ✓ {path}')
    print(f'\nDone. {converted} files converted.')


if __name__ == '__main__':
    main()
