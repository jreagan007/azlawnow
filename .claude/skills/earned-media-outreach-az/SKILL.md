---
name: earned-media-outreach-az
description: LedeTime-style per-journalist personalization layer for AZ Law Now outreach. Takes a target list + an asset URL, scrapes each prospect's last 25 articles via site-scrape API, embeds via Voyage AI (when provisioned) or skips embed and uses outlet + beat + segment heuristics as a fallback, scores relevance via Claude Sonnet 4.6, generates per-prospect subject lines + hook paragraphs in the verified Fractl patterns. Outputs Apollo-ready CSV for sequence enrollment.
---

# earned-media-outreach-az

## When to invoke

- After any Tier-S or Tier-A pillar publishes
- After a fact-bundle update on a published Tier-A piece warrants re-pitch
- Quarterly evergreen re-pitch for Tier-S pieces 60-90 days post-publish (data freshness drives the new ask)

## Inputs

| Param | Required | Description |
|---|---|---|
| Asset URL | Yes | The live AZ Law Now URL being pitched. Must be a published investigation. |
| Target list CSV | Yes | Columns: `name, outlet, beat, email, twitter, segment`. Segment must be one of `az-news | education | elder-care | labor-safety | public-health | family-blog | disability-advocacy | civic-advocacy`. |
| `--vertical` | Yes | Slug controlling framing: `az-heat-disconnect | az-pedestrian-safety | az-school-safety | az-elder-care | az-daycare-safety | az-rail-safety | az-hit-run | az-esa-fraud | az-workers-comp-heat | az-ice-litigation` |
| `--byline` | Yes | One of `brendan-franks | brandon-millam | stephanie-ramirez`. Drives sender alias. |
| `--max-prospects` | No | Default 50 for general press, 15 for Tier-1 medical/legal trade |
| `--cache-dir` | No | Path to site-scrape + embedding cache. Default `cache/journalist-corpus/` |

## Phase 1: Target enrichment

For each prospect in the target list:

1. Site-scrape the prospect's last 25 articles by author name or beat keyword. Use the API's batch endpoint with `onlyMainContent: true`. Max concurrency 50.
2. **If `VOYAGE_API_KEY` is provisioned:** embed each article via Voyage AI `voyage-3-large`. Build a per-journalist corpus centroid by averaging per-article embeddings. Cache the centroid keyed by `email + scrape_date`. TTL 14 days.
3. **If `VOYAGE_API_KEY` is missing:** fall back to outlet + beat + segment heuristics for the cosine-replacement scoring. Note in the output: "score: heuristic (no embeddings)".
4. Output per-prospect: `{name, outlet, beat, email, last_25_article_summaries, coverage_themes, corpus_centroid_embedding | null}` to `data/outreach/enriched-prospects-<slug>.jsonl`.

## Phase 2: Asset embedding + scoring

1. Embed the asset URL's pillar MDX via Voyage AI (or skip if missing).
2. Compute cosine similarity per prospect (or rank by heuristic).
3. Drop prospects below `min-score` threshold (default 0.55 with embeddings, top 30 by heuristic without).
4. Output ranked list: `data/outreach/ranked-prospects-<slug>.jsonl`.

## Phase 3: Per-prospect pitch generation (Claude Sonnet 4.6)

For each surviving prospect, call Claude with this prompt scaffold:

```
You are Brendan Franks (or Brandon Millam or Stephanie Ramirez, per --byline), the byline on this AZ Law Now investigation: <asset URL>.

The pitch fires from <byline alias>@azlawnow.com to a journalist who covers <beat> at <outlet>.

The journalist's recent coverage clusters around: <top 3 themes from corpus centroid summary>.

Write a pitch following the 5-leg Fractl structure:
1. Opening (1 sentence): byline reference to the journalist's specific recent piece (URL inline). Identify the news peg in their coverage that aligns with the AZ data.
2. Bomb stat (1 sentence): the headline stat verbatim from the asset.
3. Stake (2-3 sentences): why this matters now, for their audience.
4. Methodology (1 paragraph): N, sample frame, time window, primary source agency.
5. Offering (1 paragraph): dataset + methodology snapshot + walkthrough offer + per-outlet custom cut (e.g., Maricopa-only for Arizona Republic, Tucson-only for AZ Daily Star).
6. Closing: soft ask. "Useful for [their beat]?" Not a CTA.
7. Sign-off: byline alias.

Rules:
- Subject line ≤ 50 characters, stat-lede pattern. Verbatim from asset bomb stat. 3 ranked alternatives in frontmatter; option 1 in body.
- No em-dashes. Periods, commas, colons, parens.
- No "expert" or "specialist" for attorneys.
- Anchor-text discipline: include "link to whatever page is most useful for your readers"
- No flattery. Don't say "thought you'd find this interesting."
- Under 170 words total.
- Active voice 80% minimum.
```

Output per-prospect: `data/outreach/drafts/<YYYY-MM-DD>/<NN>-<outlet>-<journalist>.md`.

## Phase 4: CSV export + Apollo handoff

Build the Apollo CSV with columns:
- email, first_name, last_name, name, outlet, beat, twitter
- subject_line (≤ 50 chars)
- personalization_paragraph
- cosine_score (or "heuristic")
- segment, asset_url, asset_stat, vertical
- ready_to_send = "no" (gate: never autonomous)
- subject_pattern (for A/B reference)

Output to `data/outreach/az-campaign/<slug>-<segment>.csv` + a combined `_master.csv`.

## Phase 5: Per-piece send sequence (Jared executes after review)

| Day | Template | Sequence step |
|---|---|---|
| 0 | E1 pitch (5-leg) | Initial send (Tier-1 first, 72hr exclusivity) |
| 3 | FU1 (data-pain follow-up) | Same thread; one new data angle |
| 7 | FU2 (close + walkthrough offer) | Shortest email; calendar link |
| Day 14+ | Stop | Max 3 touches |

Hard rules on send:
- Tuesday-Thursday, 8-9 AM Phoenix time (MST), lands in inbox by 9 AM journalist check
- Never send Friday
- Single sender max 50/day after warm-up (10 → 25 → 50)
- Millionverifier email gate on every send
- DNC list check before every send

## Hard rules (NO SLOP)

- Subject lines ≤ 50 characters
- Body ≤ 170 words
- No em-dashes
- No "expert" or "specialist"
- No flattery
- No CTA at the end ("just data and a conversation" or soft "useful?" close)
- 3-touch max cadence (0, 3, 7)
- Tuesday-Thursday send window
- One byline alias per pitch (Brendan / Brandon / Stephanie)
- Anchor-text discipline: never push publishers on anchor text
- Update `docs/strategy/<slug>-build-log.md` §0 LIVE STATE after every material decision

## Verification: did the skill work?

- `data/outreach/enriched-prospects-<slug>.jsonl` exists and validates
- `data/outreach/ranked-prospects-<slug>.jsonl` exists with cosine or heuristic score per row
- `data/outreach/drafts/<YYYY-MM-DD>/` has one MD per prospect + INDEX.md with send-order constraints
- `data/outreach/az-campaign/<slug>-<segment>.csv` files + `_master.csv` all have `ready_to_send: "no"`
- Every subject line ≤ 50 chars (verify with a one-line awk over the master CSV)
- Every body ≤ 170 words

When all six are true, the skill ran clean.
