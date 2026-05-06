# AZ Law Now Investigation Runbook

> Canonical operating procedure for autonomous publication and outreach on AZ Law Now.
> Read top to bottom before any autonomous run. Every step has a tool, an
> input, an output, and a failure mode.

**Last updated:** 2026-05-05
**Maintainer:** Brendan Franks editorial desk (autonomous plus Jared oversight)
**Voice memory:** `~/.claude/projects/-Users-taqticlaw/memory/reference_outreach-playbook.md`
**Latest session log:** `docs/sessions/2026-05-05-embed-bait-visual-program.md`

---

## End-to-end pipeline (one investigation, start to finish)

```
[1]  IDEATION          propose-investigations.py       -> proposals/<date>.md
[2]  BREAKING NEWS     breaking-news.py                -> breaking-news/<date>.md
[3]  RESEARCH          research subagent (Agent tool)  -> research/<slug>-dossier.md
[4]  FACT-CHECK        fact-check subagent             -> PASS or FAIL with diff list
[5]  DRAFT             Write MDX with strict cite      -> src/content/investigations/<slug>.mdx
[6]  IMAGES            gen-<slug>-images.ts            -> hero.webp + og.png
[7]  BUILD GATE        npm run build (3 checks)        -> pass or block
[8]  COMMIT + PUSH     git add + commit + git push     -> Netlify deploy
[9]  LIVE QA           curl 200 check + spot-render    -> go / no-go
[10] SOCIAL            post-x + post-fb + post-ig      -> 3 posts on @azlawnow
[11] CONTENT-ASSETS    insert into outreach DB         -> story routable
[12] HARVEST           harvest subagent                -> targets/<slug>.json
[13] ENRICH HOOK       enrich-targets.py               -> hook + clean_hook
[14] ENRICH LINKEDIN   enrich-linkedin.py              -> linkedin_url per contact
[15] PREVIEW           preview-story.py                -> email to jared@taqtics.com
[16] WAIT FOR SHIP     inbox check                     -> ship / hold / drop X@
[17] SEND              send-story.py                   -> Resend, BCC, per-send commit
[18] ENGAGEMENT        engagement-report.py --days 1   -> clicks + auto-DNC bounces
[18b] WARM FOLLOWUP    warm-followup.py --days 7       -> Slack click-report + Phase 2 preview
[19] LINKEDIN OUTBOX   linkedin-outbox.py              -> daily worklist
[20] X FOLLOWS         x-follow-targets.py             -> recommended-follow list

[21] ELIGIBILITY SCORE score-investigation-eligibility.py -> data/research/<date>.json
[22] CHART BUILD       gen-<slug>-chart.ts             -> public/embeds/<slug>-master + variants
[23] EMBED LOCKUP      EmbedAsset.astro in MDX         -> #chart anchor + Copy embed code
[24] CHART SOCIAL      post-x + post-fb + post-ig with chart -> 3 platform posts with the asset
[25] CHART FOLLOWUP    embed-pitch.py (per-recipient)  -> obligate-grade pitch with embed code
```

Stages 1 through 9 produce a publishable investigation. Stages 10 through 20 produce engaged outreach.
Stages 21 through 25 produce embed-bait charts that earn backlinks (Tynski-applied doctrine).

---

## Stage details

### [1] Ideation, propose-investigations.py

```
python3 scripts/outreach/propose-investigations.py --count 8
```

**Input:** existing investigation titles read from `src/content/investigations/*.mdx` frontmatter to avoid duplication.
**Output:** `data/outreach/proposals/<date>-proposals.md`. Each proposal includes title, slug, hook, core_finding (with primary-source URL), primary_data_sources list, arizona_hook, target_segments, brandon_contribution (legal companion sketch), stephanie_contribution (family-facing companion sketch), urgency_window.
**Tool:** Perplexity sonar-pro single call. About $0.03 per run.
**Known weakness:** placeholder figures (`$X million`) and partisan-source citations sneak in. Stage [3] research must verify or replace.

### [2] Breaking news, breaking-news.py

```
python3 scripts/outreach/breaking-news.py --hours 48
```

**Input:** existing investigation list (for cross-reference).
**Output:** `data/outreach/breaking-news/<date>.md` plus sibling `.json`. Five sections: PPLX AZ news scan, PPLX existing-story updates, X recent search, web search masthead hits, keyword volume snapshot.
**Tools used:** Perplexity sonar-pro, X API recent-search, web-search via configured provider, KW provider.
**Cadence:** daily at 8am via launchd (when wired). Manual run any time.

### [3] Research, Agent tool dispatch

**One subagent per story.** Each gets full toolkit plus 8-minute hard cap plus strict primary-source rule.

Required dossier fields:
- Numerical claims with primary-source URL, NOT secondary news.
- Names of people, companies, boards from public documents only.
- Verification confidence per claim: HIGH / MEDIUM / LOW.
- Any proposal hook figure that doesn't verify gets flagged "PROPOSAL UNSUPPORTED" with the verified replacement number.

**Output:** `data/research/<slug>-dossier.md` (5000 to 6000 words, dense, cited).

**Failure mode:** PPLX returns hallucinated citation or partisan source. Mitigation: fact-check stage [4] catches it.

### [4] Fact-check, Agent tool dispatch (separate subagent)

**Inputs:** the draft MDX plus the research dossier.
**Output:** PASS or FAIL with line-by-line diff list. Issues categorized: numerical mismatch, citation drift, statutory citation error, ASHRAE quote drift, district-list overclaim.
**Verdict:** PASS commits, FAIL blocks the commit. Must-fix items numbered.
**Reference:** the MERV 13 piece (2026-04-25) caught 3 must-fix items pre-commit (the `22 million Medicare beneficiaries` figure, the FEMA / White House attribution, the ESSER sensors claim).

### [5] Draft, direct Write of MDX

Pattern follows `tempe-asu-pavement-180-day-claim-clock.mdx`:
- Frontmatter with title, description (160 chars or fewer), author=brendan-franks, category, ogImage, image, keyTakeaway (800 chars or more), schemaType=NewsArticle, tags, publishedAt, updatedAt, featured, relatedPracticeAreas, relatedInsights, locations, faqs (5 to 7 questions), dataSources (10 to 15 with full URLs), readingTime.
- Imports: KeyFacts/Fact, Callout, StatBlock, FAQ.
- Body: KeyFacts block, opening prose (no heading), StatBlock, asymmetric sections, 1 to 2 Callouts, closing.
- Voice: no em-dashes, contractions, 5 lines or fewer per paragraph, 20 words or fewer per sentence, 2 or more fragments, no banned words, person-first.

### [6] Images, scripts/gen-<slug>-images.ts

Pattern follows `gen-buckeye-durango-hero.ts`:
- Imagen 4 16:9 hero generation with documentary style suffix.
- Sharp resize to 1200x675 hero (webp q88) and 1200x630 OG (PNG with brand overlay).
- OG composite: gradient plus vermillion accent bar plus Georgia serif headline plus AZ Law Now logo.

Memory rule: **visually inspect every Gemini PNG against prompt intent BEFORE committing** (`feedback_gemini-image-qc-mandatory.md`).

### [7] Build gate, Netlify-mirroring local build

```
npm run check:quality:strict
npm run check:sources:strict
npm run check:og
npm run build
```

Pre-push hook runs all four. Common gates:
- description over 160 chars triggers fail
- uncontracted forms (cannot, does not, is not, are not, it is) triggers fail
- broken internal links triggers fail
- OG missing brand overlay triggers fail

Fix in MDX, re-run.

### [8] Commit + push

```
git add src/content/investigations/<slug>.mdx public/images/heroes/<hero>.webp public/og/<og>.png scripts/gen-<slug>-images.ts
git commit -m "investigation: <slug short summary>"
git push
```

**Hard rule:** before `git add` on any previously-untracked source file, grep for `re_/sk_/pplx-/fc-/AAAA/EAA/xox/ghp_` patterns (`feedback_secret-scan-before-git-add.md`).

### [9] Live QA, curl plus spot render

```
for i in 1 2 3 4 5 6 7 8 9 10; do
  CODE=$(curl -sI -o /dev/null -w "%{http_code}" https://azlawnow.com/investigations/<slug>/);
  echo "try $i: $CODE";
  if [ "$CODE" = "200" ]; then break; fi;
  sleep 30;
done
```

Open in browser. Confirm: hero loads, KeyFacts render, links work, no [N] citation markers anywhere, OG card looks clean when shared.

### [10] Social

```
npx tsx scripts/post-x-azlaw.ts --id <azln-N>          # X (verified @azlawnow before post)
npx tsx scripts/post-fb-azlaw.ts --id <fb-azln-N>      # FB (verified @azlawnow page before post)
npx tsx scripts/post-ig-azlaw.ts --id <ig-azln-N>      # IG (verified @azlawnow before post)
```

Drops live in `scripts/x-drops.json`, `scripts/fb-drops.json`, `scripts/ig-drops.json`. Each drop is the headline thread plus reply with the article URL plus optional mentions.

X account locked in via `X_AZLAW_*` env vars (verified `/users/me` returns @azlawnow user_id 2042351967956013056).

### [11] Content-assets DB insert

```
sqlite3 ~/Projects/azlawnow/data/outreach/azlawnow-outreach.db "
INSERT INTO content_assets (slug, title, description, stat_hook, beats, segments, url, cta_offer)
VALUES (?, ?, ?, ?, ?, ?, ?, ?);"
```

Beats = comma-separated topic keywords (used by send-story.py beat-content gate).
Segments = comma-separated segment matches (informational, not enforcing).
**cta_offer** is the per-story journalist-peer offer, not a generic records line.

### [12] Harvest, Agent tool dispatch

Subagent brief:
- AZ-only or AZ-coverage-explicit.
- Each contact must have evidence_url pointing at the masthead or staff page where the email is published.
- NO pattern-derived emails (the bounced-superintendent lesson).
- 15 to 25 named contacts ideal.
- Diverse domains.

Output: `data/outreach/targets/<slug>.json` with `name, email, outlet, role, beat, city, state, segment, story_target, evidence_url, story_relevance_note` per row.

### [13] Enrich hook, enrich-targets.py

```
python3 scripts/outreach/enrich-targets.py <slug> --max 30
```

For each contact, calls Perplexity sonar-pro with system prompt requiring date OR quoted title OR named program in the response. `clean_hook()` strips citation markers `[N]`. NO_RECORD returns get tagged `enrichment_status: no_record` so they skip at send.

### [14] Enrich LinkedIn, enrich-linkedin.py (optional, parallel track)

```
python3 scripts/outreach/enrich-linkedin.py <slug> --max 30
```

Adds `linkedin_url` field per contact. Feeds LinkedIn outbox flow.

### [15] Preview, preview-story.py

```
python3 scripts/outreach/preview-story.py <slug>
```

Renders every email that would fire (full HTML plus recipient details plus hook plus subject plus gate-pass status), bundles into one email to **jared@taqtics.com**.

### [16] Wait for ship, inbox

Reply rules in the email:
- `ship` to fire all on that story
- `ship N` to fire only the first N
- `hold` to abort
- `drop X@domain.com` to DNC that one and ship the rest

Autonomous mode: if the queue is small (8 or fewer) and no contact in the queue is a top-tier named target (defined as: any AZ Senate or House education committee chair, any superintendent of a top-5 district, any agency director), the loop can auto-ship after 30 minutes if no reply. Otherwise hold for explicit ship.

### [17] Send, send-story.py

```
python3 scripts/outreach/send-story.py <slug> --limit 30
```

Three send-time gates: locality, beat-content, hook 30 chars or longer. Voice gate inside `build_email` raises if rendered body has em-dash, banned word, or throat-clearing pattern.

Per-recipient UTM via md5(email)[:12]. BCC to bf@azlawnow.com plus jared@taqtics.com. Per-send commit on the targets file as a tracking artifact. 1.2s delay between sends (gentle on Resend rate-limits).

### [18] Engagement, engagement-report.py

```
python3 scripts/outreach/engagement-report.py --days 1
```

Iterates send_log.resend_id (per memory: never list endpoint, last_event is one-state-per-email, roll up clicks > opens > delivered). Auto-DNC anything bounced. Surface clickers as warm leads.

Per memory `feedback_resend-tracking-policy.md`: opens are intentionally OFF (Apple MPP distortion). Clicks are the signal.

### [18b] Warm-followup, warm-followup.py

```
python3 scripts/outreach/warm-followup.py --days 7
```

Scans send_log + Resend last_event for confirmed clicks in the window. Filters
out scanner-pattern intake addresses (info@, press@, newsroom@, tips@, etc),
DNC, and recipients who already received a Phase 2 follow-up.

**First action:** posts a `warm-lead board` to the Slack channel listing each
clicker (name, outlet, the article they clicked) so the team has the report
before any send.

**Second action:** drafts a per-recipient Phase 2 email. Subject is `Re: <original>`
so it threads naturally with the first email. Body opens with peer acknowledgment
("Saw you took a look at the X piece earlier this week"), offers a concrete
next-step resource per article (per-county breakdown, public records request
templates, primary-source pulls), and signs off as Brendan.

**Third action:** renders the full preview to jared@taqtics.com. Reply `ship` /
`ship N` / `hold`. Add `--send-live` flag to fire after sign-off.

Per-article offers live in the `PHASE2_OFFER` dict in the script, keyed by
content_assets slug. New investigations should add their offer to the dict at
ship time.

### [19] LinkedIn outbox, linkedin-outbox.py

```
python3 scripts/outreach/linkedin-outbox.py --limit 30
```

Daily markdown of pending LinkedIn connection requests with copy-paste connection notes. State tracked in `data/outreach/linkedin/linkedin-status.json` keyed by linkedin_url.

### [20] X follows, x-follow-targets.py

```
python3 scripts/outreach/x-follow-targets.py --limit 30
```

Recommended-follow list for the @azlawnow account. Manual click-through to stay under spam thresholds. State in `data/outreach/x/x-follow-status.json`.

---

## Reply heartbeat (real-time)

```
Recipient hits Reply
  -> Resend webhooks POST -> aeelaw.com/.netlify/functions/resend-inbound
    -> verifyWebhook() validates Svix HMAC signature
    -> fetch /emails/{id}/content for full body, classify intent
    -> THREE outputs fire in parallel:
       (a) Discord channel DISCORD_AZLAW_REPLIES (real-time bot post + thread)
       (b) Slack channel via SLACK_AZLAWNOW_REPLIES_WEBHOOK (env-var enable)
       (c) Email forward to jared@taqtics.com (always-on fallback)
```

Plus daily Slack heartbeat at 9am via `com.azlawnow.heartbeat-slack` launchd.

---

## Autonomous mode boundaries

The loop runs autonomously through stages [1] through [16]. Stage [17] requires Jared sign-off when the queue contains top-tier named targets. Stages [18] through [20] resume autonomously.

**Hard manual gates:**
- Stage [4] FAIL with critical issues (named persons, wrong statutory cite, hallucinated quote)
- Stage [9] live QA fails after 5 minutes
- Stage [16] no reply on a top-tier-target preview
- Any voice-gate raise on more than 30% of a send batch (signals systemic prompt issue)

**Soft gates (Discord notification, log, continue):**
- Stage [4] FAIL with cosmetic issues (auto-fix and re-check)
- Stage [13] over 50% NO_RECORD rate (re-harvest with tighter brief, continue)
- Stage [18] over 5% bounce rate (auto-DNC, continue)

---

## Tool inventory

| Tool | Purpose | Env var(s) |
|---|---|---|
| Perplexity sonar-pro | Generative search, hooks, fact-check | `PERPLEXITY_API_KEY` |
| Web scraper provider | Site scrape, search, MX checks | `WEB_SEARCH_API_KEY`, `WEB_SEARCH_API_URL` |
| Keyword research provider | Volume + CPC + SERP | `KW_PROVIDER_LOGIN/PASSWORD`, `KW_VOLUME_API_URL` |
| Resend | Send + inbound webhook | `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET` |
| MillionVerifier | Email format validation | `MILLIONVERIFIER_API_KEY` |
| Imagen 4 (Gemini) | Hero + OG generation | `GEMINI_API_KEY` |
| X API v2 | Posts + recent search + verify | `X_AZLAW_*` (per-account) |
| Meta Graph | FB + IG posts | `AZLAW_FB_PAGE_TOKEN`, `AZLAW_IG_ACCOUNT_ID` |
| Discord (bot) | Reply forum + slash commands | `DISCORD_BOT_TOKEN`, `DISCORD_AZLAW_REPLIES` |
| Slack (incoming webhooks) | Mirror replies + daily heartbeat | `SLACK_AZLAWNOW_REPLIES_WEBHOOK` |

---

## Skill / agent inventory

| Skill / Agent | Where | When |
|---|---|---|
| Research subagent (general-purpose Agent) | dispatched per story in stage [3] | once per investigation |
| Fact-check subagent | dispatched in stage [4] | once per draft |
| Harvest subagent | dispatched in stage [12] | once per story, plus pass-2 if needed |
| Voice gate | inline in `send-story.py` | per send, raises on em-dash / banned word |
| Citation strip | inline in `enrich-targets.py` | per Perplexity response |
| Auto-DNC | inline in `engagement-report.py` | per bounce |
| Domain-cap (3/day) | inline in `send-story.py` | per send batch |

---

## Embed-bait visual program (Stages 21-25)

**Doctrine source:** `taqticscom/docs/research/clients/azlawnow/TYNSKI-APPLIED.md`
**Memo for sister properties:** `taqticscom/docs/research/clients/aeelaw/AZLAWNOW-APPROACH-MEMO.md`
**Locked palette:** `src/styles/theme.ts` Sunset Editorial (cream, ink, vermillion, slate, gold)
**Chart token system:** `scripts/lib/azlawnow-chart-tokens.ts`

### [21] Eligibility scoring

```bash
python3 scripts/score-investigation-eligibility.py
```

Scores all published investigations on three axes (1 to 10 each):
- **bomb_stat:** quotable stat in MDX or dossier
- **chart_data:** tabular data, breakdowns, comparisons that map to the 3 approved chart types
- **closing_thesis:** candidate one-sentence thesis (under 15 words, comparison framing)

Output: `data/research/investigation-eligibility-scored-<date>.json` ranked Tier S/A/B/C. Tier S+A get the 3-chart treatment first.

### [22] Chart build

For each high-eligibility story, build a chart generator script in the existing pattern. Reference: `scripts/gen-buckeye-roundabout-chart.ts`.

```bash
npx tsx scripts/gen-<slug>-chart.ts
```

Renders 4 native variants per chart (no auto-cropping):
- `master-1200x675` for in-article embed plus LinkedIn plus X
- `fb-feed-1200x630` for Facebook feed
- `ig-square-1080` for Instagram grid
- `ig-portrait-1080x1350` for Instagram feed (max-reach format)

Chart types limited to three (per Tynski doctrine):
- horizontal bar (sorted)
- scatter quadrant (2-axis)
- comparison table

Style discipline: cream `#FAF5ED` background, vermillion `#C23B22` reserved for the bomb stat or highlighted bar, slate `#4A5859` for muted secondaries. Hairline grid `#D4C9B8`. Top and bottom hairlines on the chart only, no boxes. Eyebrow in vermillion small caps. Kebab-case caption plus italic source line plus reporting byline. NYT Upshot, The Pudding, FiveThirtyEight references.

### [23] Embed lockup in MDX

Drop the chart into the MDX after the StatBlock using the `EmbedAsset` component:

```mdx
import EmbedAsset from '@/components/mdx/EmbedAsset.astro';

<EmbedAsset
  src="/embeds/<slug>-master-1200x675.png"
  alt="<descriptive alt with the bomb stat>"
  storyUrl="https://azlawnow.com/investigations/<slug>/"
  caption="<kebab-case-caption>"
  source="<primary source citation>"
  width={1200}
  height={675}
/>
```

The component renders:
- White inner card with 1px hairline border plus soft drop shadow (lifts cream chart off cream page)
- `id="chart"` anchor for direct linking via `/<slug>/#chart`
- `scroll-margin-top: 6rem` so the anchor jump clears the sticky header
- "Copy embed code" button that puts pre-formatted HTML on the journalist's clipboard, including a do-follow link back to the investigation

### [24] Chart social fire

After publication and Cloudflare deploy, post the chart to all three platforms.

```bash
# X: text-only thread (X poster does not yet support media upload, story link previews the OG card)
npx tsx scripts/post-x-azlaw.ts --id <next-azln-id>

# FB: chart image plus text (uses public/fb/fb-<slug>.png as binary upload)
npx tsx scripts/post-fb-azlaw.ts --id <next-fb-id>

# IG: chart image plus caption plus first comment (Meta fetches public URL at public/ig/ig-<slug>.jpg)
npx tsx scripts/post-ig-azlaw.ts --id <next-ig-id>
```

**Important:** IG image must be at a public HTTPS URL Meta can fetch. If Meta returns "media could not be fetched" right after deploy, the URL is cache-busted with `?v=<n>` (Meta caches 404s from pre-deploy attempts).

Per-platform image organization (mirrors mesowatchorg pattern):
- `public/embeds/<slug>-master-1200x675.png` and other variants for in-article use
- `public/fb/fb-<slug>-<date>.png` for FB feed binary upload
- `public/ig/ig-<slug>-<date>.jpg` for IG public-URL fetch (must be JPEG, 1080x1350 portrait recommended)

### [25] Chart follow-up

Pitch the chart to journalists, bloggers, and advocates with the embed code and the deep-link to `#chart`. Pattern (under construction):

```bash
python3 scripts/outreach/embed-pitch.py <slug> --limit N
```

The pitch:
- Subject is stat-lede (never agency-name-led). Examples: "$2.3M in AZ nursing home billing recoveries, and the audits keep finding more"
- Open with the recipient's specific past coverage angle (LedeTime-style personalization)
- Include the ready-to-paste embed code in the email body
- Editorial-freedom note (do not push anchor text, per Tynski's load-bearing rule)
- Sign off with "this is yours to use" framing. No asks, no CTA, no "let us know what you think"
- BCC bf@azlawnow.com plus jared@taqtics.com

The reciprocity hook: "I built the chart for [their angle]. Embed code below, takes 5 seconds. Source line links back to the investigation. Use it however you want."

---

## Token chain for FB and IG posting

Both posters use the same Meta token chain. Saved keys in `~/Projects/taqtics-ops/config/.env`:
- `AZLAW_FB_PAGE_TOKEN` is the long-lived page access token (verify expiry monthly)
- `AZLAW_FB_PAGE_ID` is `395622053639601`
- `AZLAW_IG_TOKEN` is the same as the page token
- `AZLAW_IG_USER_ID` is `17841447928878292` (the IG Business Account linked to the AZ Law Now Page)
- `AZLAW_IG_BUSINESS_ID` is an alias of the above

To refresh: get a new short-lived user token from Meta Business Suite, save to `/tmp/az-fb-token-<date>.txt`, run `python3 /tmp/exchange-az-page-token.py` (or the equivalent script). The script exchanges the user token for a long-lived page token and updates ops/.env in place without echoing the token to transcript.

For a permanently-non-expiring page token, generate via Business Suite, System Users, AZ Law Now System User, Generate Token, select page plus scopes (`pages_show_list, pages_read_engagement, pages_manage_posts, instagram_basic, instagram_content_publish`), expiry: Never.

---

## Daily and weekly cadence (autonomous)

**Every morning (08:00 PT):**
1. `breaking-news.py --hours 24` produces today's bulletin.
2. `engagement-report.py --days 1` rolls up yesterday's Resend events, auto-DNCs bounces, surfaces clickers.
3. `linkedin-outbox.py` produces today's LinkedIn worklist.
4. Slack post: morning briefing.

**On-demand (when Jared picks an angle):**
- Stages [3] through [9]: about 25 to 40 minutes for one investigation, parallelizable across 3.

**After publication:**
- Stages [10] social fire within 5 minutes of go-live.
- Stage [12] harvest dispatched within an hour.
- Stages [13] through [15] enrichment plus preview within 6 hours.
- Stage [17] send fires after Jared's `ship` reply.

**Weekly (Sunday):**
- `propose-investigations.py --count 8` for next week's pipeline.
- Engagement summary across all stories.
- Memory plus skills review for any new lessons.

---

## Lessons-learned register (running)

1. No pattern-derived emails. Source from public masthead pages only (`feedback_outreach-quality-gates-2026-04-26.md`).
2. Strip Perplexity `[N]` citation markers in code, don't trust the system prompt alone.
3. Voice gate is a defense-in-depth check. Default sender templates drift toward flabby.
4. Auto-DNC bounced recipients within 24 hours of send. Burns sender reputation if you don't.
5. Per-story CTA in `content_assets.cta_offer` makes voice tight. Generic CTA reads robotic.
6. Apple Mail Privacy Protection distorts opens to about 100%. Clicks are the signal.
7. Beat-content gate at send time catches over-collected harvest sets without manual cleanup.
8. Pre-push hook mirrors Netlify build to catch quality, sources, OG issues before deploy.
9. Visually inspect every Gemini image against prompt intent before commit.
10. Verify X username via `/users/me` before any post.
