#!/usr/bin/env python3
"""Verify contact emails via MillionVerifier for azlawnow outreach.

Catch-all results are recorded as `email_verified='catch_all'` but NOT added
to do_not_contact. National press domains (NYT, WaPo, Axios, Wired, ProPublica)
universally use catch-all servers; auto-DNC of catch_all silently destroyed
press batches. The downstream `send-story.py --allow-catch-all` flag handles
the press exemption at send time, which is the right layer for the gate.

API key reads from ops `.env` (MILLIONVERIFIER_API_KEY) per the per-client
credential-naming rule. Falls back to the legacy inline value with a warning
if the env var is missing, so existing crons keep running until rotated.
"""
import sqlite3, json, os, sys, subprocess, time


def _load_ops_env():
    p = os.path.expanduser("~/Projects/taqtics-ops/config/.env")
    if not os.path.exists(p):
        return
    for line in open(p):
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"'))


_load_ops_env()

DB = os.path.expanduser("~/Projects/azlawnow/data/outreach/azlawnow-outreach.db")
MV_KEY = os.environ.get("MILLIONVERIFIER_API_KEY") or os.environ.get("MV_API_KEY")
if not MV_KEY:
    sys.stderr.write("ERROR: MILLIONVERIFIER_API_KEY not set in ops .env\n")
    sys.exit(2)

limit = 200
for i, a in enumerate(sys.argv):
    if a == "--limit" and i + 1 < len(sys.argv):
        limit = int(sys.argv[i + 1])


def verify_single(email):
    r = subprocess.run(
        ["curl", "-s", f"https://api.millionverifier.com/api/v3/?api={MV_KEY}&email={email}"],
        capture_output=True, text=True, timeout=30)
    try:
        d = json.loads(r.stdout)
        return d.get("result", "error"), d.get("quality", "unknown"), d.get("credits", 0)
    except:
        return "error", "unknown", 0


conn = sqlite3.connect(DB)
conn.row_factory = sqlite3.Row
targets = conn.execute(
    "SELECT id, email FROM contacts WHERE email IS NOT NULL AND email != '' AND (email_verified IS NULL OR email_verified = '') LIMIT ?",
    (limit,)).fetchall()

print(f"Verifying {len(targets)} emails...")
good, catch_all, bad, credits = 0, 0, 0, 0
for t in targets:
    result, quality, credits = verify_single(t["email"])
    conn.execute("UPDATE contacts SET email_verified=? WHERE id=?", (result, t["id"]))
    if result == "ok":
        good += 1
    elif result == "catch_all":
        catch_all += 1
    else:
        bad += 1
        conn.execute("INSERT OR IGNORE INTO do_not_contact (email, reason) VALUES (?, ?)",
                     (t["email"].lower(), f"MV: {result}"))
    if (good + catch_all + bad) % 10 == 0:
        conn.commit()
    time.sleep(0.3)

conn.commit()
conn.close()
print(f"\nGood: {good} | Catch-all (kept, sender-gated): {catch_all} | Bad (auto-DNC): {bad} | Credits left: {credits}")
