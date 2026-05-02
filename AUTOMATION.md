# AZ Law Now Automation Stack

> What runs autonomously, what's scheduled, what needs Jared's hand to wake.

## Live local launchd (already running)

| Plist | Schedule | Purpose |
|---|---|---|
| `com.azlawnow.heartbeat-slack.plist` | Daily 9am PT | Daily morning Slack heartbeat (engagement summary, queue health). |
| `com.taqtics.azlaw-heartbeat.plist` | Daily | Cross-property heartbeat. |

## Local launchd staged (file exists, not loaded, needs Jared restore)

| Plist | Schedule | Purpose |
|---|---|---|
| `~/Library/LaunchAgents/com.azlawnow.outreach-cycle.plist.PAUSED-2026-04-25` | **8/10/12/14/16/18/20 PT** (7 cycles/day, was 4) | Email send cycle. `verify-emails.py --limit 50` then `send-outreach.py --limit 12`. Per-cycle 3-per-domain-per-day cap stays in place. ~84 sends/day max. |
| `~/Library/LaunchAgents/PAUSED-staged/com.azlawnow.x-follow-execute.plist.STAGED` | Weekday 10am PT | `x-follow-execute.py --live --limit 25`. Identity verified via `/users/me` before each follow. 35s delay between follows, ~14 min per run. |
| `~/Library/LaunchAgents/PAUSED-staged/com.azlawnow.x-search-harvest.plist.STAGED` | Weekday 2pm PT | `x-search-harvest.py`. Discovers new candidates via X recent-search across 8 AZ-keyword queries. Auto-demotes to `review_required` (manual triage). |

### Restore commands (run when ready)

```bash
# Outreach cycle (the big one, 7x/day mail drain)
mv ~/Library/LaunchAgents/com.azlawnow.outreach-cycle.plist.PAUSED-2026-04-25 \
   ~/Library/LaunchAgents/com.azlawnow.outreach-cycle.plist
launchctl load -w ~/Library/LaunchAgents/com.azlawnow.outreach-cycle.plist

# X follow execution (weekday 10am PT)
mv ~/Library/LaunchAgents/PAUSED-staged/com.azlawnow.x-follow-execute.plist.STAGED \
   ~/Library/LaunchAgents/com.azlawnow.x-follow-execute.plist
launchctl load -w ~/Library/LaunchAgents/com.azlawnow.x-follow-execute.plist

# X recent-search harvest (weekday 2pm PT)
mv ~/Library/LaunchAgents/PAUSED-staged/com.azlawnow.x-search-harvest.plist.STAGED \
   ~/Library/LaunchAgents/com.azlawnow.x-search-harvest.plist
launchctl load -w ~/Library/LaunchAgents/com.azlawnow.x-search-harvest.plist

# Verify all loaded
launchctl list | grep azlaw
```

## Remote routines (Anthropic cloud)

| Routine | ID | Schedule | Purpose |
|---|---|---|---|
| AZ Law Now daily editorial briefing + ideation | `trig_011LmKgsVEdDHsBGYk4dhRFy` | Daily 8am PT (15:00 UTC) | Reads existing investigations, scans AZ news via WebSearch, writes briefing markdown + ideation file, opens PR (when GitHub auth wired). |
| One-shot today's briefing (already fired 2026-05-02) | `trig_01WEhv7S2EvUZjoqyXRDxko7` | Fired 2026-05-02T19:57Z | Same as daily. |

**One-time setup needed:**
- `/web-setup` to give the daily routine GitHub access for commits + PRs. Without it, the routine writes to its sandbox checkout only and the work surfaces in the routine run log.

## Cred dependency map

| Tool | Where it reads from | Status |
|---|---|---|
| Local Python scripts (enrich, send, verify, propose, breaking-news) | `~/Projects/taqtics-ops/config/.env` | OK if .env has the keys. |
| Local TypeScript scripts (post-x, post-fb, post-ig) | Same `.env` plus `process.env` fallback | OK. |
| Local x-follow-execute.py | `X_AZLAW_*` from `.env` | OK. |
| Remote routines | NO local file access. Web only. | Cannot send email, cannot post to X, cannot enrich. Only research + write briefings. |

## End-state autonomous flow (all plists awake + GitHub auth wired)

```
8:00am PT  | outreach-cycle: verify 50 + send 12 (cycle 1)
8:00am PT  | (remote) editorial-briefing: writes today's briefing + ideations,
           |   opens PR with strongest 3 stories + 3 fresh proposals
9:00am PT  | heartbeat-slack: daily morning report
10:00am PT | outreach-cycle: send 12 (cycle 2)
10:00am PT | x-follow-execute: 25 follows from candidate queue
12:00pm PT | outreach-cycle: send 12 (cycle 3)
2:00pm PT  | outreach-cycle: send 12 (cycle 4)
2:00pm PT  | x-search-harvest: discover new candidates, demote to review
4:00pm PT  | outreach-cycle: send 12 (cycle 5)
6:00pm PT  | outreach-cycle: send 12 (cycle 6)
8:00pm PT  | outreach-cycle: send 12 (cycle 7)
```

Daily theoretical max: 84 emails + 25 X follows + 1 editorial briefing PR.
Actual sends gated by per-domain 3/day cap, hook-fail gate, beat-fit gate, locality gate, MillionVerifier dedupe, and DNC.

## Manual bootstrap (Jared's job once)

1. **Restore outreach-cycle launchd**: command above. Sends start firing at the next cycle (8/10/12/14/16/18/20 PT).
2. **Restore x-follow-execute launchd**: command above. First fire next weekday 10am PT.
3. **Restore x-search-harvest launchd**: command above. First fire next weekday 2pm PT.
4. **`/web-setup` for the daily editorial routine**: gives the remote routine GitHub commit access.
5. **Triage 60 X review_required candidates** in `data/outreach/x/x-follow-status.json`. Promote real AZ figures back to `candidate`. Their handles will fire on the next x-follow-execute cycle.
6. **Connect Chrome MCP extension** when ready, to unlock KJZZ + AZ Mirror + Tucson Sentinel email obfuscation harvest.
