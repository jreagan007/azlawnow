# Session log: 2026-05-05, embed-bait visual program

> **Purpose:** record what shipped, why it ships this way, and where to pick up tomorrow.
> **Reader:** anyone resuming this work, including a fresh agent loaded with the AZ Law Now context.
> **RUNBOOK reference:** stages 21 through 25.

## What shipped today

1. **Two greenlit investigations published** with strict quality gates. arizona-workers-comp-heat-denials (Tier A, 22 of 30) and arizona-nursing-homes-billing-fraud-and-abuse (Tier B, 13 of 30). Both committed to main, both on Cloudflare CDN.

2. **First-touch outreach drained for both fresh stories.** 24 sends total (10 workers comp, 14 nursing homes), 0 errors, all gates passed (locality, beat-content, hook, voice, DNC, dedup, per-domain cap).

3. **Tynski-applied doctrine adopted as the AZ Law Now editorial discipline.** Source: `~/Projects/taqticscom/docs/research/clients/azlawnow/TYNSKI-APPLIED.md`. Rules locked: 3 charts max per investigation, stat-leads-chart pattern, kebab-case captions, closing thesis instead of CTA, two-track outreach, stat-lede subject lines.

4. **Sister-property memo written** at `~/Projects/taqticscom/docs/research/clients/aeelaw/AZLAWNOW-APPROACH-MEMO.md` for the AEELaw team to read what we're doing and what they could adopt.

5. **Eligibility scoring system** built (`scripts/score-investigation-eligibility.py`) and run across all 35 published investigations. Output ranked Tier S/A/B/C in `data/research/investigation-eligibility-scored-2026-05-05.json`. Top of the list: buckeye-durango-yuma-roundabout-rejected (26 of 30), hit-and-run-maricopa-county-data (24 of 30), arizona-school-bus-seat-belts (23), arizona-325-educator-discipline-2024 (23), arizona-workers-comp-heat-denials (22).

6. **Locked chart token system** at `scripts/lib/azlawnow-chart-tokens.ts`. Pulls Sunset Editorial colors directly from `src/styles/theme.ts`. No new colors invented. Three derived sub-palettes: categorical (5 in-brand series), sequential (light to dark), diverging (positive, neutral, negative).

7. **EmbedAsset Astro component** at `src/components/mdx/EmbedAsset.astro`. Renders the chart with a white inner card (1px hairline border plus soft drop shadow that lifts cream chart off cream page), an `id="chart"` anchor for `/<slug>/#chart` deep-linking, scroll-margin-top so the anchor jump clears the sticky header, and a "Copy embed code" button that puts pre-formatted HTML on the journalist's clipboard with a do-follow link to the investigation.

8. **Three production charts built** with the new methodology, each with 4 native variants (no auto-cropping):
   - `buckeye-roundabout` (master 1200x675, fb 1200x630, ig-square 1080, ig-portrait 1080x1350). Bomb stat: 41.7% vs 15.4% injury-crash reduction. Chart shipped to live page, posted to X plus FB plus IG.
   - `career-schools` (same 4 variants). Bomb stat: 237 licensed, 37 adverse, 9 closed. Chart in MDX, social drops queued (fb-azln-14, ig-azln-09, azln-28).
   - `daycare-violations` (same 4 variants). Bomb stat: 51 facilities cited 3+ times across 4 West Valley cities. Chart in MDX, social drops queued (fb-azln-15, ig-azln-10, azln-29).

9. **Embed-bait follow-up email script** built (`scripts/outreach/embed-pitch.py`). Targets prior recipients of a story (those already in `send_log`), generates a Tynski-style pitch with the chart embed code plus the `?#chart` deep-link, includes editorial-freedom framing (no anchor-text ask), respects per-domain 3/day cap, commits per send.

10. **Morning push scheduled** via launchd at 06:00 daily (`~/Library/LaunchAgents/com.taqtics.azlawnow.morning-push.plist`). Script at `scripts/fire-morning-push-2026-05-06.sh`. Fires: token sanity check, FB plus IG posts for the 2 new charts, X threads for both, embed-pitch follow-ups for all 3 stories. Output logs to `data/outreach/morning-push-<date>.log` and `morning-push-launchd.log`.

11. **Buckeye chart already posted live to all 3 platforms** (X azln-27, FB fb-azln-13, IG ig-azln-08). All three with chart image, caption, and source attribution.

12. **Token chain for FB and IG posting** wired: short-lived user token exchanged for AZ Law Now Page token. Saved to `~/Projects/taqtics-ops/config/.env` as `AZLAW_FB_PAGE_TOKEN`, `AZLAW_FB_PAGE_ID`, `AZLAW_IG_TOKEN`, `AZLAW_IG_USER_ID`, `AZLAW_IG_BUSINESS_ID`. Linked IG account: @azlawnow (id 17841447928878292).

## Pickup notes for tomorrow

### Confirmed live and working

- Buckeye chart on `https://azlawnow.com/investigations/buckeye-durango-yuma-roundabout-rejected/#chart` with Copy embed code button
- Career-schools chart on `https://azlawnow.com/investigations/arizona-career-schools-37-adverse-actions/#chart` (deploys with next push)
- Daycare chart on `https://azlawnow.com/investigations/arizona-daycare-violations/#chart` (deploys with next push)
- All chart images on Cloudflare CDN at `/embeds/<slug>-master-1200x675.png` and platform variants
- launchd agent loaded for daily 06:00 morning push

### Open follow-ups that need Jared

1. **Long-lived FB plus IG page token.** The current token expires 23:00 PT today (May 5). If not renewed before then, tomorrow's morning push will fail at the FB plus IG steps (X will still work, embed-pitch emails will still work). Generate via Meta Business Suite: Settings, System Users, AZ Law Now System User, Generate Token, select page and scopes (`pages_show_list, pages_read_engagement, pages_manage_posts, instagram_basic, instagram_content_publish`), expiry: Never. Drop the new token at me; I'll re-run the exchange script.

2. **Apollo credit topup.** 57 candidates from May 5 harvest are saved to `data/outreach/apollo-stories-2026-05-05-candidates.json` with names, orgs, and titles but no unlocked emails. Topup unlocks them.

3. **Resend webhook to send_log.** We don't currently have open or click data because the Resend webhook isn't wired into our DB. That's why we follow up everyone, not just openers. Wiring the webhook would tighten the pipeline.

### Tomorrow morning, after the 06:00 push fires

1. Check `data/outreach/morning-push-2026-05-06.log` for the run summary.
2. Check `data/outreach/azlawnow-outreach.db` send_log for the day's `embed_pitch_v1` rows.
3. For any FB plus IG failures: refresh token (see #1 above), re-fire the failed `--id` directly.
4. Verify socials posted: check @azlawnow on X, FB, IG.

### Next charts to build (per eligibility scoring)

Top stories by combined eligibility plus follow-up universe size:

- arizona-school-bus-seat-belts (Tier A 23 of 30, 27 prior recipients), high-impact policy chart candidate
- arizona-325-educator-discipline-2024 (Tier A 23 of 30, 17 prior recipients)
- hit-and-run-maricopa-county-data (Tier S 24 of 30, 3 prior recipients), needs more outreach before chart pays off
- arizona-school-restraint-data (Tier B 17 of 30, 55 prior recipients), lower data score but biggest follow-up universe after career-schools
- arizona-schools-merv-13-filter-bypass (Tier B 17 of 30, 48 prior recipients)

For each: clone the buckeye chart-gen pattern (`scripts/gen-buckeye-roundabout-chart.ts`), swap in the data, headlines, and caption-slug, render 4 variants, save platform images to `public/ig/` plus `public/fb/`, drop the EmbedAsset into the MDX, add social drops, append to the embed-pitch.py STORIES dict, schedule the next morning push.

### Refactor opportunity (not blocking)

Three chart-gen scripts now exist (buckeye, career-schools, daycare) with substantial layout duplication. Extract a `scripts/lib/gen-chart.ts` helper that takes a data spec plus layout config and emits the 4 variants. Reduces per-story chart build to about 30 lines instead of 200.

## Files referenced

```
~/Projects/azlawnow/
  RUNBOOK.md                                            canonical 25-stage pipeline (now)
  src/components/mdx/EmbedAsset.astro                   the embed widget
  src/styles/theme.ts                                   locked Sunset Editorial palette
  src/content/investigations/
    buckeye-durango-yuma-roundabout-rejected.mdx
    arizona-career-schools-37-adverse-actions.mdx
    arizona-daycare-violations.mdx
    arizona-workers-comp-heat-denials.mdx                today's #1 ship
    arizona-nursing-homes-billing-fraud-and-abuse.mdx    today's #2 ship
  scripts/lib/azlawnow-chart-tokens.ts                  locked chart tokens
  scripts/gen-buckeye-roundabout-chart.ts               POC chart, all 4 variants
  scripts/gen-career-schools-chart.ts                   3-bar funnel
  scripts/gen-daycare-violations-chart.ts               4-city horizontal bars
  scripts/score-investigation-eligibility.py            35-story eligibility scorer
  scripts/outreach/embed-pitch.py                       follow-up sender
  scripts/fire-morning-push-2026-05-06.sh               daily morning push
  data/research/investigation-eligibility-scored-2026-05-05.json
  public/embeds/<slug>-{master,fb-feed,ig-square,ig-portrait}-*.png
  public/ig/ig-<slug>-2026-05.jpg                       IG public-URL fetch
  public/fb/fb-<slug>-2026-05.png                       FB binary upload

~/Projects/taqticscom/docs/research/
  TYNSKI-MASTER-DOSSIER.md
  TYNSKI-FINDINGS-SCORED.md
  TYNSKI-OUTREACH-VIZ-MESSAGING.md
  clients/azlawnow/TYNSKI-APPLIED.md                    the doctrine source
  clients/aeelaw/TYNSKI-APPLIED.md
  clients/aeelaw/AZLAWNOW-APPROACH-MEMO.md              sister-property memo

~/Library/LaunchAgents/
  com.taqtics.azlawnow.morning-push.plist               daily 06:00 schedule
```

## Lessons learned (added to RUNBOOK register)

11. Sunset Editorial palette is intentionally NOT dark-mode tech-deck. Cream, ink, vermillion, slate, gold is the locked AZ Law Now identity (NYT Upshot, Pudding, 538 references, not Fractl). Charts on cream need a white inner card with hairline border plus soft drop shadow to lift them off the page background.

12. Meta caches 404 responses. If you hit an IG image URL before the file is live on Cloudflare, Meta's content fetcher caches the failure and rejects subsequent fetches even after the file deploys. Cache-bust with a query string (`?v=2`) to force a re-fetch.

13. Page tokens inherit the source user token's expiry. A short-lived user token (expires same day) produces a page token that also expires same day. For permanent posting, the source user token must be a long-lived one (60-day) generated through the App Secret exchange, OR a System User token from Meta Business Suite.

14. Per-domain 3/day cap is the right ceiling for a journalist universe. Many large orgs (azfamily.com, asu.edu, azcentral.com) have 4+ contacts in our DB; the cap stops us from saturating any one outlet's spam filter on a single send wave.

15. Stat-leads-chart pattern is non-negotiable. The headline serif sentence must contain the bomb stat in prose. The chart is the proof, not the announcement. Charts that lead a section without a stat in the prose above them get skipped by skim-readers.
