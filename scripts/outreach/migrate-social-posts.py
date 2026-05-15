#!/usr/bin/env python3
"""
migrate-social-posts.py

One-time migration: adds social_posts and heartbeat tables to azlawnow-outreach.db.
Safe to re-run (CREATE TABLE IF NOT EXISTS).

Also adds an index on (platform, drop_id) for the upsert key.

Usage:
  python3 scripts/outreach/migrate-social-posts.py
"""

import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
DB_PATH = ROOT / 'data' / 'outreach' / 'azlawnow-outreach.db'


def main():
    if not DB_PATH.exists():
        print(f'DB not found: {DB_PATH}', file=sys.stderr)
        sys.exit(1)

    conn = sqlite3.connect(str(DB_PATH))

    print('Adding social_posts table...')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS social_posts (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            platform    TEXT NOT NULL CHECK(platform IN ('x', 'fb', 'ig')),
            drop_id     TEXT NOT NULL,
            topic       TEXT,
            story_slug  TEXT,
            post_id     TEXT,
            post_url    TEXT,
            posted_at   TEXT NOT NULL,
            raw_payload TEXT,
            UNIQUE(platform, drop_id)
        )
    ''')
    conn.execute('''
        CREATE INDEX IF NOT EXISTS idx_social_posts_platform_drop
            ON social_posts(platform, drop_id)
    ''')
    conn.execute('''
        CREATE INDEX IF NOT EXISTS idx_social_posts_posted_at
            ON social_posts(posted_at)
    ''')

    print('Adding heartbeat table...')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS heartbeat (
            service           TEXT PRIMARY KEY,
            last_run          TEXT NOT NULL,
            last_status       TEXT NOT NULL,
            last_payload_size INTEGER NOT NULL DEFAULT 0
        )
    ''')

    conn.commit()
    conn.close()

    print('Migration complete.')
    print(f'  DB: {DB_PATH}')
    print('  Tables added: social_posts, heartbeat')
    print('  Run sync-social-posts.py to backfill from existing JSON logs.')


if __name__ == '__main__':
    main()
