# Drip-Drain Send Plan: BNSF Notice / 27th & Thomas (Celius Coverage Warm-Call Set)

**Status:** STAGED, GATED ON BRANDON MILLAM J.D. CLEARANCE
**Companion docs:** `docs/strategy/bnsf-notice-27th-thomas-CLIENT-HOLD.md`, `docs/strategy/bnsf-notice-27th-thomas-build-log.md`
**Date:** 2026-05-13

This plan is the day-by-day fire order for the AZ Law Now drip-drain pipeline. It cannot fire until Brandon clears the six items in the CLIENT-HOLD memo.

---

## The warm-call set (already covered Sonja Celius)

Send these first. They wrote the human story; the federal-record extension is the natural follow-on. Highest reply probability in the matrix.

| Tier | Recipient | Outlet | Pitch draft |
|---|---|---|---|
| Warm 1 | Mickaela Castillo | Arizona's Family (KPHO/KTVK) | `warm-calls/01-mickaela-castillo-azfamily.md` |
| Warm 1 | Angel Saunders | People Magazine | `warm-calls/02-angel-saunders-people.md` |
| Warm 2 | FOX 10 Phoenix assignment desk | KSAZ | `warm-calls/03-fox10-12news-abc15-az-locals.md` (section 1) |
| Warm 2 | 12 News KPNX newsroom | KPNX-NBC Phoenix | `warm-calls/03-fox10-12news-abc15-az-locals.md` (section 2) |
| Warm 2 | ABC15 Investigators | KNXV | `warm-calls/03-fox10-12news-abc15-az-locals.md` (section 3) |
| Warm 2 | BlackNews.com | Black press, national | `warm-calls/05-blacknews-dante-lee.md` |
| Reach via warm 1 | Gray Local Media network (~13+ O&O stations) | KPHO/AZ Family origin | `warm-calls/04-gray-syndication-via-mickaela.md` (NOT direct; reached through Mickaela follow-on) |

## The cold-beat set (didn't cover this story but cover this beat)

84 prospects staged in `data/outreach/bnsf-notice-27th-thomas/drafts-pending-brandon/`. Distribution:

- general-az-news: 60 prospects (AZ Republic Metro desk, AZ Mirror, 12 News, KJZZ, Fox 10, AZ Family, AZCIR)
- data-investigations: 20 prospects (Cronkite News, Phoenix New Times, Capitol Times, Luminaria, Joan Meiners at AZ Republic)
- courts-legal: 2 prospects
- transit-infrastructure: 1 prospect
- pedestrian-safety: 1 prospect (Bree Burkitt AZ Republic public safety)

The cold-beat pitches use the template-stub draft (`_master.csv`). Each prospect gets the LedeTime per-prospect rewrite before send if VOYAGE_API_KEY is provisioned. Without it, manual review by Brandon and Brendan per pitch before send.

---

## Day-by-day drip schedule (after Brandon clearance, "Day 0" = first cleared send day)

### Day 0 (Tuesday or Thursday, 8-9 AM Phoenix time)

Fire warm-call tier 1 only. Two emails.

1. Mickaela Castillo, Arizona's Family (KPHO/KTVK)
2. Angel Saunders, People Magazine

**Why two only on Day 0:** these are the broadest-reach recipients. Mickaela's follow-on reaches the Gray Local syndication network automatically. Angel's follow-on reaches the People/AOL/MSN/Yahoo syndication network. Single highest-reach pair in the matrix. Don't dilute their attention with parallel pitches to the same beat.

### Day 1 (next morning, same Tuesday-Thursday window)

Fire warm-call tier 2. Four emails.

3. FOX 10 Phoenix assignment desk
4. 12 News KPNX newsroom
5. ABC15 Investigators desk
6. BlackNews.com editorial

**Hold the Gray syndication backup.** Do not direct-pitch Gray O&O stations on Day 1. Wait for Mickaela to engage. If Day 5 elapses without Mickaela response, fire the Gray News national desk backup pitch.

### Day 2

No new sends. Monitor replies. Update `data/outreach/bnsf-notice-27th-thomas/replies/` with any inbound. Brandon triages legal-side replies (ER 4.2 monitoring). Brendan handles editorial replies.

### Day 3 (Day 0 + 3)

Fire Day 0 follow-ups (FU1). Two emails.

1. Mickaela follow-up 1
2. Angel follow-up 1

Same thread. Short. One new data angle each.

### Day 4 (Day 1 + 3)

Fire Day 1 follow-ups (FU1). Four emails.

3. FOX 10 FU1
4. 12 News FU1
5. ABC15 FU1
6. BlackNews FU1

### Day 5

Trigger: if Mickaela has not engaged, fire the Gray News national desk backup pitch.
Begin cold-beat tier 1 sends (5 emails/day cap during warm-up):

- Joan Meiners, AZ Republic (data journalism, transit)
- Caitlin McGlade, AZ Republic (elder care, vulnerable adults)
- Jim Small, AZ Mirror (civic accountability)
- Bree Burkitt, AZ Republic (public safety / crime)
- Lauren Gilger, KJZZ (politics + policy)

### Day 6 to Day 10

Continue cold-beat tier 1 sends at 5 to 10 per day per warm-up cadence. Day 7 of any thread = FU2 final touch and stop.

### Day 7 (Day 0 + 7)

Fire FU2 on Mickaela + Angel threads. Shortest email. The close. Stop.

### Day 8 (Day 1 + 7)

Fire FU2 on FOX 10, 12 News, ABC15, BlackNews threads. Stop.

### Day 10 onward

Cold-beat tier 2 sends:

- Cronkite News data desk
- Phoenix New Times civic desk
- Capitol Times civic desk
- Arizona Luminaria
- Arizona Center for Investigative Reporting
- Arizona Daily Star Phoenix bureau
- Trains.com industry desk
- Railway Age industry desk
- Streetsblog USA national
- ProPublica national rail-safety
- Bloomberg CityLab urban transit

5 to 10 per day. Same 3-touch cadence. Tuesday-Thursday only.

### Day 14 onward

Tier-3 newsletter pitches:

- Operation Lifesaver Arizona
- Disability Rights Arizona

Plus the embed-offer cold lane: outlets that have NOT been pitched but published on grade-crossing safety in the prior 12 months. The offer is "here is an embed snippet, free to use with credit."

---

## Send infrastructure

Every send goes through:

1. **Million Verifier** email-validation gate. Reject if disposable / invalid / catch-all.
2. **DNC check** against `data/outreach/azlawnow-outreach.db` `do_not_contact` table.
3. **One-per-domain-per-day** cap. No two journalists at same outlet on same day.
4. **Post-2026-04-10 incident send rules** per `feedback_outreach-send-guardrails.md` (the Memorial Day window rule, the warm-up cadence, the time-of-day window).
5. **Per-client credential naming**: AZ_RESEND_API_KEY or AZ_APOLLO_API_KEY in `~/Projects/taqtics-ops/config/.env`.
6. **Commit-per-send**: each successful send writes an entry to `data/outreach/bnsf-notice-27th-thomas/send-log.json` and triggers a git commit on this branch.

## Reply triage

Inbound replies route via Resend webhook to Slack `#azlawnow-inbox` (TODO: provision channel; same pattern as the meso `#taqtics-team`). Brendan reads, classifies, pastes into Claude Code for revision drafting. Brandon reviews any reply that touches the legal-ethics question or that includes BNSF-counsel communication.

## Stop conditions

Any pitch thread stops if:

- Recipient replies "not interested" or asks to be removed (mark `do_not_contact`)
- Recipient publishes a piece citing the data (we've won; stop pitching, monitor)
- Brandon flags legal-ethics concern
- Recipient bounces (mark `bounced`, do not retry)

Max 3 touches per thread. No exceptions.

---

## Daily-brief integration

The drip-drain heartbeat runs from `scripts/outreach/heartbeat.py` if AZ Law Now has the LaunchAgent provisioned. Verify with `launchctl list | grep azlawnow`. If running, the warm-call schedule above lives in `data/outreach/drip-drain-state.json` and the daily fires on its own. If not running, manual cron via `scripts/outreach/daily-pipeline.py`.

---

*End of drip-drain plan. HOLD until Brandon clears the publication question + the four ER reviews in `docs/strategy/bnsf-notice-27th-thomas-CLIENT-HOLD.md`.*
