#!/usr/bin/env python3
"""
sync-resend-events.py

Reads new lines from aeelaw/data/resend-events.jsonl and writes them to
azlawnow-outreach.db send_log rows that match by resend_id.

Also writes a heartbeat row to the heartbeat table every run.

Architecture:
  Netlify function resend-events.js appends raw event JSON to the JSONL queue.
  This script runs every 60 seconds via launchd (com.azlawnow.sync-resend-events).
  It reads unprocessed lines, updates send_log, then truncates processed lines.

Usage:
  python3 sync-resend-events.py               # one run
  python3 sync-resend-events.py --loop        # keep running (for manual testing)
"""

import argparse
import json
import os
import sqlite3
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
OPS_ENV = Path.home() / 'Projects' / 'taqtics-ops' / 'config' / '.env'
DB_PATH = ROOT / 'data' / 'outreach' / 'azlawnow-outreach.db'
QUEUE_FILE = Path.home() / 'Projects' / 'aeelaw' / 'data' / 'resend-events.jsonl'
CURSOR_FILE = ROOT / 'data' / 'outreach' / 'sync-resend-cursor.json'

# Map event type to (column, fallback column). If mapped_event is 'bounced',
# we write bounced_at. For everything else we update last_event only.
BOUNCE_EVENTS = {'bounced', 'complained'}
REPLY_EVENTS = {'replied'}


def load_ops_env():
    if not OPS_ENV.exists():
        return
    for line in OPS_ENV.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        k, v = line.split('=', 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def get_db():
    if not DB_PATH.exists():
        print(f'DB not found: {DB_PATH}', file=sys.stderr)
        sys.exit(1)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def ensure_heartbeat_table(conn):
    conn.execute('''
        CREATE TABLE IF NOT EXISTS heartbeat (
            service TEXT PRIMARY KEY,
            last_run TEXT NOT NULL,
            last_status TEXT NOT NULL,
            last_payload_size INTEGER NOT NULL DEFAULT 0
        )
    ''')
    conn.commit()


def write_heartbeat(conn, status, payload_size):
    conn.execute('''
        INSERT INTO heartbeat (service, last_run, last_status, last_payload_size)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(service) DO UPDATE SET
            last_run = excluded.last_run,
            last_status = excluded.last_status,
            last_payload_size = excluded.last_payload_size
    ''', ('sync-resend-events', datetime.now(timezone.utc).isoformat(), status, payload_size))
    conn.commit()


def load_cursor():
    if CURSOR_FILE.exists():
        try:
            return json.loads(CURSOR_FILE.read_text()).get('byte_offset', 0)
        except Exception:
            return 0
    return 0


def save_cursor(offset):
    CURSOR_FILE.parent.mkdir(parents=True, exist_ok=True)
    CURSOR_FILE.write_text(json.dumps({'byte_offset': offset, 'updated': datetime.now(timezone.utc).isoformat()}))


def read_new_lines(cursor_offset):
    """Read new lines from the JSONL file starting at cursor_offset bytes.
    Returns (lines, new_offset).
    """
    if not QUEUE_FILE.exists():
        return [], cursor_offset

    with open(QUEUE_FILE, 'rb') as f:
        f.seek(0, 2)
        file_size = f.tell()

        if cursor_offset > file_size:
            # File was rotated or truncated. Reset to start.
            cursor_offset = 0

        if cursor_offset == file_size:
            return [], cursor_offset

        f.seek(cursor_offset)
        raw = f.read()
        new_offset = cursor_offset + len(raw)

    lines = []
    for raw_line in raw.decode('utf-8', errors='replace').splitlines():
        raw_line = raw_line.strip()
        if not raw_line:
            continue
        try:
            lines.append(json.loads(raw_line))
        except json.JSONDecodeError as e:
            print(f'warn: bad JSON line skipped: {e}', file=sys.stderr)

    return lines, new_offset


def process_events(conn, events):
    updated = 0
    skipped = 0
    for ev in events:
        resend_id = ev.get('resend_id')
        mapped_event = ev.get('mapped_event', '')
        occurred_at = ev.get('occurred_at', ev.get('queued_at', datetime.now(timezone.utc).isoformat()))

        if not resend_id:
            skipped += 1
            continue

        # Check the row exists
        row = conn.execute('SELECT id, last_event, replied_at, bounced_at FROM send_log WHERE resend_id = ?', (resend_id,)).fetchone()
        if not row:
            print(f'warn: no send_log row for resend_id={resend_id} event={mapped_event}')
            skipped += 1
            continue

        if mapped_event in BOUNCE_EVENTS:
            conn.execute(
                'UPDATE send_log SET bounced_at = COALESCE(bounced_at, ?), last_event = ? WHERE resend_id = ?',
                (occurred_at, mapped_event, resend_id)
            )
        elif mapped_event in REPLY_EVENTS:
            conn.execute(
                'UPDATE send_log SET replied_at = COALESCE(replied_at, ?), last_event = ? WHERE resend_id = ?',
                (occurred_at, mapped_event, resend_id)
            )
        else:
            conn.execute(
                'UPDATE send_log SET last_event = ? WHERE resend_id = ?',
                (mapped_event, resend_id)
            )
        updated += 1

    conn.commit()
    return updated, skipped


def run_once():
    load_ops_env()
    conn = get_db()
    ensure_heartbeat_table(conn)

    cursor_offset = load_cursor()
    events, new_offset = read_new_lines(cursor_offset)

    if not events:
        print(f'sync-resend-events: no new events. cursor={cursor_offset}')
        write_heartbeat(conn, 'ok-idle', 0)
        conn.close()
        save_cursor(new_offset)
        return

    updated, skipped = process_events(conn, events)
    print(f'sync-resend-events: {len(events)} events. updated={updated} skipped={skipped}')
    status = 'ok' if skipped == 0 else f'ok-with-{skipped}-skipped'
    write_heartbeat(conn, status, len(events))
    conn.close()
    save_cursor(new_offset)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--loop', action='store_true', help='keep polling')
    ap.add_argument('--every', type=int, default=60, help='seconds between polls (default 60)')
    args = ap.parse_args()

    if not args.loop:
        run_once()
        return

    print(f'sync-resend-events looping every {args.every}s. Ctrl-C to stop.')
    while True:
        try:
            run_once()
        except Exception as e:
            print(f'error: {e}', file=sys.stderr)
        time.sleep(args.every)


if __name__ == '__main__':
    main()
