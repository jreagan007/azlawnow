#!/usr/bin/env python3
"""Daily LinkedIn outreach outbox for AZ Law Now.

Reads all per-story targets files, surfaces contacts with a verified linkedin_url
and a non-completed linkedin_status, drafts a per-contact connection note that
references the relevant story + their personalization_hook, and writes a
markdown outbox file Jared can work through manually each morning.

Tracks state in a sibling file: linkedin-status.json (keyed by linkedin_url).

Usage:
  python3 scripts/outreach/linkedin-outbox.py [--limit N]
"""
import os
import sys
import json
import sqlite3
from datetime import datetime
from pathlib import Path

TARGETS_DIR = Path(os.path.expanduser("~/Projects/azlawnow/data/outreach/targets"))
OUT_DIR = Path(os.path.expanduser("~/Projects/azlawnow/data/outreach/linkedin"))
OUT_DIR.mkdir(parents=True, exist_ok=True)
STATUS_FILE = OUT_DIR / "linkedin-status.json"
DB = os.path.expanduser("~/Projects/azlawnow/data/outreach/azlawnow-outreach.db")


def parse_args():
    limit = 30
    for i, a in enumerate(sys.argv):
        if a == "--limit" and i + 1 < len(sys.argv):
            limit = int(sys.argv[i + 1])
    return limit


def load_status():
    if STATUS_FILE.exists():
        return json.loads(STATUS_FILE.read_text())
    return {}


def save_status(status):
    STATUS_FILE.write_text(json.dumps(status, indent=2))


def main():
    limit = parse_args()
    status = load_status()

    # Map slug -> article title from DB so we can reference the right piece in the note
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    articles = {r["slug"]: dict(r) for r in conn.execute("SELECT * FROM content_assets")}

    items = []
    for f in sorted(TARGETS_DIR.glob("*.json")):
        slug = f.stem
        targets = json.loads(f.read_text())
        for t in targets:
            url = (t.get("linkedin_url") or "").strip()
            if not url:
                continue
            if status.get(url, {}).get("status") in ("connection_sent", "connected", "messaged", "replied", "declined", "skip"):
                continue
            if not t.get("personalization_hook"):
                continue
            article = articles.get(slug, {})
            items.append({
                "name": t.get("name", ""),
                "outlet": t.get("outlet", ""),
                "role": t.get("role", ""),
                "beat": t.get("beat", ""),
                "linkedin_url": url,
                "personalization_hook": t.get("personalization_hook", ""),
                "story_slug": slug,
                "story_title": article.get("title", slug),
                "story_url": article.get("url", ""),
            })

    items = items[:limit]
    if not items:
        print("No LinkedIn outreach items pending.")
        return

    today = datetime.now().strftime("%Y-%m-%d")
    out = OUT_DIR / f"{today}.md"
    md = [
        f"# AZ Law Now LinkedIn Outbox, {today}",
        f"Brendan Franks, Editor-in-Chief, AZ Law Now Investigations.",
        "",
        f"**{len(items)} pending connection requests.** Send manually from the @azlawnow Brendan persona LinkedIn account.",
        "",
        "Process: open each LinkedIn URL, click Connect, click Add a note, paste the note. After sending, mark the row complete in `data/outreach/linkedin/linkedin-status.json` (set `status` to `connection_sent`).",
        "",
        "---",
        "",
    ]
    for i, item in enumerate(items, 1):
        note = (
            f"Hi {item['name'].split()[0] if item['name'] else 'there'}, "
            f"{item['personalization_hook']} "
            f"Brendan Franks at AZ Law Now. We just published \"{item['story_title']}\" and I'm "
            f"connecting with people working this beat. Open to questions if useful."
        )
        if len(note) > 290:
            # LinkedIn connection-note cap is 300 chars; keep room for safety
            note = note[:286] + "..."
        md.append(f"## {i}. {item['name']} — {item['role']} at {item['outlet']}")
        md.append(f"- LinkedIn: <{item['linkedin_url']}>")
        md.append(f"- Story: [{item['story_title']}]({item['story_url']})")
        md.append(f"- Beat: {item['beat']}")
        md.append("")
        md.append("**Connection note (copy/paste):**")
        md.append("")
        md.append(f"> {note}")
        md.append("")
        md.append("---")
        md.append("")

    out.write_text("\n".join(md))
    print(f"✓ Outbox: {out}")
    print(f"  pending: {len(items)} connection requests")
    print(f"  status file: {STATUS_FILE}")


if __name__ == "__main__":
    main()
