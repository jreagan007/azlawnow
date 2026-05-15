#!/usr/bin/env python3
"""Import harvested contacts from JSON files into azlawnow outreach DB.
Dedupes against existing contacts + DNC + send_log."""
import sqlite3, json, os, glob

DB = os.path.expanduser("~/Projects/azlawnow/data/outreach/azlawnow-outreach.db")
HARVEST_DIR = os.path.expanduser("~/Projects/azlawnow/data/outreach")

conn = sqlite3.connect(DB)
conn.row_factory = sqlite3.Row
existing = {r[0].lower() for r in conn.execute("SELECT email FROM contacts WHERE email IS NOT NULL")}
dnc = set()
try:
    dnc = {r[0].lower() for r in conn.execute("SELECT email FROM do_not_contact")}
except:
    pass

imported = 0
skipped = 0
for fpath in sorted(glob.glob(os.path.join(HARVEST_DIR, "harvest-*.json"))):
    fname = os.path.basename(fpath)
    try:
        data = json.load(open(fpath))
    except:
        print(f"  ⚠  bad JSON: {fname}"); continue

    if isinstance(data, dict):
        rows = data.get("contacts") or data.get("results") or data.get("rows") or []
    elif isinstance(data, list):
        rows = data
    else:
        print(f"  ⚠  unrecognized shape: {fname}"); continue

    rows = [r for r in rows if isinstance(r, dict)]
    print(f"=== {fname}: {len(rows)} rows ===")
    for row in rows:
        email = (row.get("email") or "").lower().strip()
        if not email or "@" not in email:
            continue
        if email in existing or email in dnc:
            skipped += 1; continue

        # Map fields
        name = row.get("name", "")
        outlet = row.get("outlet") or row.get("name") or ""
        role = row.get("role", "")
        beat = row.get("beat", "")
        city = row.get("city", "")
        segment = row.get("segment", "community_blogger")
        source = f"firecrawl-harvest-{fname}"
        url = row.get("url", "")

        conn.execute("""INSERT OR IGNORE INTO contacts
            (name, email, outlet, role, beat, city, tier, segment, persona, status, source, notes)
            VALUES (?,?,?,?,?,?,'B',?,'brendan','prospect',?,?)""",
            (name, email, outlet, role, beat, city, segment, source, f"discovered via {url}"))
        existing.add(email)
        imported += 1

conn.commit()
conn.close()
print(f"\nImported: {imported} | Skipped (dupe/DNC): {skipped}")
