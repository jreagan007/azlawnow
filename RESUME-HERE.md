# Resume Here

**Last session:** 2026-05-13 14:55 MST
**Active campaign:** Tier-S BNSF Notice at 27th & Thomas (Celius corridor)
**Branch:** `tier-s-bnsf-notice-27th-thomas`
**Agent identity:** Pimp Daddy (ops) <ops@azlawnow.com> (fallback: notifications@taqtics.com)

When you (the next session) open this repo, read in this order. Five files. Ten minutes. You'll be fully oriented.

## 1. Build log Section 0 LIVE STATE

`docs/strategy/bnsf-notice-27th-thomas-build-log.md` (section 0 only)

The newest entries at the top tell you every material decision since the case-sign on 2026-05-12. The handoff doctrine (per `docs/strategy/SESSION-HANDOFF-TEMPLATE.md`) says every material decision lands here BEFORE the next tool call. Read it and you know the state.

## 2. Team-update log

`az-law-operations/team-updates/live.md`

Casual Brendan-voice team-talk. Newest at top. Captures decisions, insights, blockers, status checks in real words. The 4-question status check from end-of-session is the last block.

## 3. Cockpit state.json

`az-law-operations/cockpit/state.json`

Machine-readable snapshot. Regenerate by running:

```bash
cd ~/Projects/azlawnow
python3 ./az-law-operations/cockpit/collect-state.py
```

Tells you: campaign status, send-window posture, draft counts, reply heartbeat freshness, all 5 blockers, recent updates.

Visual version: open `http://localhost:8765/dashboard.html` (start the server with `python3 -m http.server 8765` in the `cockpit/` dir).

## 4. Client hold memo

`docs/strategy/bnsf-notice-27th-thomas-CLIENT-HOLD.md`

The four ER questions Brandon Millam J.D. needs to clear. P0 master gate. Until cleared:
- No publish of the rewritten investigation
- No cascade fire
- No outreach send (5 warm-call + 85 cold-beat drafts all gated)
- No paid social
- No filing of the 5 records requests

## 5. Git log on this branch

```bash
cd ~/Projects/azlawnow
git log --oneline -10
```

Shows what landed:
- `8fe69f9` ideations: 15 new Tier-S candidates (25-piece bench total)
- `eb50d35` case-acceptance follow-up piece + updated warm-call interview offers
- `83450b8` Celius-coverage warm-call set + drip-drain send plan
- `478ff08` tier-s phase-2: client-of-record hold + staged build artifacts
- `8a04c11` tier-s build-log: BNSF post-gate notice at 27th & Thomas

## What's running between sessions

| Service | Status | Cadence | Output |
|---|---|---|---|
| `com.azlawnow.reply-heartbeat` LaunchAgent | LOADED | every 10 min | posts state changes to `team-updates/live.md`, writes `team-updates/logs/heartbeat.stdout` |
| Resend inbound | not yet wired | TBD | reply routing manual via `bf@azlawnow.com` for now |
| Slack webhook | not yet provisioned | TBD | `slack-vote.sh` ready to fire once webhook lands in ops env |

## The 5 open blockers

1. **P0 MASTER GATE**: Brandon ER review of CLIENT-HOLD memo (gates EVERYTHING downstream)
2. Celius family written informed consent for continued publication
3. Mickaela Castillo email Million Verifier check
4. LLM rewrite pass on 84 staged pitches (`VOYAGE_API_KEY` required)
5. Slack `#azlawnow-inbox` webhook provisioning

## The 4 fast actions that unblock the rest

1. Brandon: 30 min on CLIENT-HOLD memo (4 ER questions)
2. Jared: verify `azlawnow.com` in Resend (enables on-domain + inbound)
3. Jared: provision Slack webhook for `#az-law-now-ops`, drop in ops env
4. Jared or BF: run `./az-law-operations/pipelines/dryrun-mickaela.sh` to preview the warm-call in your own inbox

## The voice the agent uses

Casual. Lowercase fine. Real words. Like Brendan texting Jared, like Jared texting Brandon. Not corporate. Not formal. See `az-law-operations/team-updates/README.md` for the voice spec.

The agent's send-from identity is **Pimp Daddy (ops)** at the user's instruction. Don't be precious about it; it's friendly cover for an autonomous operator.

## Where the work is in flight

- `docs/drafts/bnsf-notice-27th-thomas-WORKING-DRAFT.mdx`: the rewrite of the live piece with the corporate-notice lede. **Brandon-gated.**
- `docs/drafts/bnsf-notice-27th-thomas-FOLLOWUP-DRAFT.mdx`: the editor's note announcing Brandon's representation + interview offer. **Brandon-gated.**
- `data/outreach/bnsf-notice-27th-thomas/drafts-pending-brandon/`: 5 warm-call pitches (Mickaela, Angel Saunders, FOX 10/12 News/ABC15 trio, BlackNews) + 85 cold-beat rows in `_master.csv`. **All Brandon-gated.**
- `data/outreach/records-requests/bnsf-notice-27th-thomas-records-packet.md`: 5 ARS 39-121 + FOIA requests under Brandon's signature. **Filing held.**

## When the master gate clears

```bash
# create the clearance file
echo "Brandon Millam J.D. cleared the ER stack on $(date)" > \
  ~/Projects/azlawnow/az-law-operations/clearance/bnsf-notice-27th-thomas.brandon-cleared

# refresh cockpit
python3 ~/Projects/azlawnow/az-law-operations/cockpit/collect-state.py

# fire the dry-run to internal inboxes
~/Projects/azlawnow/az-law-operations/pipelines/dryrun-mickaela.sh

# fire the case-acceptance disclosure
~/Projects/azlawnow/az-law-operations/pipelines/notify-case-accepted.sh

# fire the daily pipeline (case-gated mode reads the clearance file)
~/Projects/azlawnow/az-law-operations/pipelines/daily-pipeline.sh --case-gated --dry-run    # preview
~/Projects/azlawnow/az-law-operations/pipelines/daily-pipeline.sh --case-gated              # real send Tue-Thu 8-9 AM

# fire the production send to Mickaela
~/Projects/azlawnow/az-law-operations/pipelines/send-mickaela-production.sh
```

## The 7 S-tier pieces in priority order

1. **ACTIVE**: BNSF Notice at 27th & Thomas (Celius)
2. Phoenix-summer disconnect deaths (3-ACC concentration; extends Korman)
3. School restraint district concentration (Maricopa 71%)
4. Nursing-home parent-company concentration (6 parents, 23-state pattern)
5. BNSF "AUTO PRECEDED GATES" corpus, Phoenix Subdivision-wide
6. OSHA Region IX + ICA heat-illness crosswalk (Hobbs EO peg)
7. MAG + ADOT + Phoenix RSAP overlap test

Vote-email at Resend id `850d5187` asks Jared + BF to rank 2 through 7. Reply lands in inbox; manually paste to `live.md` until Resend Inbound is wired.

## The on-disk artifacts that survive context compaction

Everything you need is on disk. The chat is ephemeral. The files are durable:

- `docs/strategy/bnsf-notice-27th-thomas-build-log.md` (the Section 0 LIVE STATE)
- `docs/strategy/bnsf-notice-27th-thomas-CLIENT-HOLD.md` (the master gate)
- `docs/strategy/bnsf-notice-27th-thomas-investigation-refocus.md` (the strategic spec)
- `az-law-operations/team-updates/live.md` (the running conversation)
- `az-law-operations/cockpit/state.json` (the machine snapshot)
- `az-law-operations/playbooks/` (the 7 operating playbooks)
- The git log on `tier-s-bnsf-notice-27th-thomas`

Read those, you're current. The agent's casual voice continues. The work continues.

Pimp Daddy (ops)
