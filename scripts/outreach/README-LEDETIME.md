# LedeTime per-journalist personalization (AZ Law Now)

LedeTime-style earned-media outreach pipeline for AZ Law Now, ported from the AEE Law Insights toolkit and originally from MesoWatch's `earned-media-outreach` work.

Two scripts. One pipeline:

1. `enrich-journalists.py`, scrapes each prospect's recent articles, embeds via Voyage AI, builds a corpus centroid per journalist. Outputs `enriched-prospects.jsonl`.
2. `generate-pitches.py`, embeds the asset URL, scores cosine similarity per prospect, calls Claude Sonnet 4.6 to generate per-prospect subject lines + hook paragraphs. Outputs Apollo-ready CSVs split by beat segment.

A third deterministic fallback, `queue-az-pitches.py`, runs the full pipeline without any LLM call. It pairs each asset to its matching segment, builds a templated subject + paragraph stub per prospect, and writes per-asset per-segment CSVs plus a master CSV. Use when LLM keys are unavailable or you want a defensible audit-trail snapshot of the queue before the LLM rewrite step.

---

## Environment variables

All secrets live in `~/Projects/taqtics-ops/config/.env`. Both scripts load from there automatically.

| Variable | Purpose |
|---|---|
| `FIRECRAWL_API_KEY` | Firecrawl v2 API key (corpus scrape) |
| `VOYAGE_API_KEY` | Voyage AI embeddings (`voyage-3-large`) |
| `ANTHROPIC_API_KEY` | Claude Sonnet 4.6 for pitch generation |

---

## Python dependencies

Both scripts use only the standard library plus `httpx`. The reference deployment runs against:

- `httpx` >= 0.27
- Python 3.11+

If `httpx` isn't already installed in this repo's Python environment:

```bash
pip install httpx
```

No new requirements file is created; install in whatever venv you use for the other `scripts/outreach/*.py` scripts.

---

## Beat segments

The pipeline buckets prospects by the `segment` column in the target CSV. Use one of:

| Segment | Audience |
|---|---|
| `az-news` | Arizona Republic, AZ Central, ABC15, Fox 10 Phoenix, 12 News, AZ Family general-news desks |
| `legal-trade` | Law360, AZ legal industry trades |
| `safety-blogger` | Independent Vision Zero AZ and road-safety bloggers |
| `az-region` | Tucson, Flagstaff, Yuma, Tribal coverage, East Valley, West Valley, statewide outlets |
| `transportation` | ADOT, DPS, AZDPS, transit, rideshare, BNSF crossing, and corridor coverage |
| `immigration` | ICE detention, civil-rights, Maricopa County, AG Mayes beats |
| `education` | AzDE, school safety, ESA accountability, IAQ in schools |
| `elder-care` | Aging, nursing homes, assisted living, ALTCS, ASBN |

`generate-pitches.py` writes one CSV per segment that has at least one above-threshold prospect.

### Arizona regional outlets (for `az-region` segment)

| Region | Outlets |
|---|---|
| Phoenix metro | Arizona Republic, AZ Central, ABC15, Fox 10 Phoenix, 12 News, AZ Family |
| Tucson | Arizona Daily Star, KGUN9, Tucson Sentinel |
| Flagstaff / Northern AZ | Arizona Daily Sun, KNAU |
| Yuma / Western AZ | Yuma Sun |
| Tribal / Indigenous coverage | Indian Country Today, Navajo Times |
| East Valley | East Valley Tribune, Tempe Republic, Mesa Tribune |
| West Valley | West Valley View, Goodyear coverage |
| Statewide | Arizona Mirror, AZPM, KJZZ, Arizona Capitol Times, Republic statewide |

---

## Verticals (asset framing)

Choose the `--vertical` flag that matches the AZ Law Now asset you're pitching:

- `az-pedestrian-safety`
- `az-heat-vulnerability`
- `az-immigration-civil-rights`
- `az-school-safety`
- `az-elder-care`
- `az-utility-accountability`
- `az-crash-corridors`
- `insurance-trade`

The vertical sets the system-prompt framing the LLM uses to tailor copy.

---

## Quickstart: Maricopa heat-deaths push

**Step 1: Build the target CSV**

Create `data/outreach/az-journalists.csv` with the header `name,outlet,beat,email,twitter,segment`. Verify current email assignments at each outlet before adding (Perplexity sonar-pro is the agency standard for journalist contact verification).

Example rows:
```
name,outlet,beat,email,twitter,segment
Stephanie Innes,Arizona Republic,health and aging,stephanie.innes@arizonarepublic.com,@stephanieinnes,az-news
Ray Stern,Arizona Republic,investigations,ray.stern@arizonarepublic.com,@raystern,az-news
Tim Vetscher,ABC15,heat and utilities,tim.vetscher@abc15.com,@timvetscher,az-news
```

**Step 2: Enrich the list**

```bash
python3 scripts/outreach/enrich-journalists.py \
  --target-list data/outreach/az-journalists.csv \
  --cache-dir cache/journalist-corpus/ \
  --max-prospects 50 \
  --segment all
```

Or filter to a single segment:

```bash
python3 scripts/outreach/enrich-journalists.py \
  --target-list data/outreach/az-journalists.csv \
  --segment safety-blogger
```

Output: `data/outreach/enriched-prospects.jsonl`

**Step 3: Generate pitches**

```bash
python3 scripts/outreach/generate-pitches.py \
  --enriched-jsonl data/outreach/enriched-prospects.jsonl \
  --asset-url https://azlawnow.com/investigations/heat-deaths-maricopa/ \
  --asset-stat "Maricopa County recorded 645 heat-associated deaths in 2023, up 52 percent year over year" \
  --vertical az-heat-vulnerability \
  --output-csv data/outreach/az-campaign/heat-deaths
```

Output: one CSV per segment, e.g. `data/outreach/az-campaign/heat-deaths-az-news.csv`, `heat-deaths-safety-blogger.csv`, etc.

**Step 4: Import to Apollo, route to send pipeline**

1. Import the per-segment CSV into Apollo. Map `email` to Contact Email, `subject_line` to Custom Field "Pitch Subject", `personalization_paragraph` to Custom Field "Personalization Hook".
2. Enroll in the AZ Law Now press sequence using one of the three LedeTime body templates in `scripts/outreach/templates/`:
   - `journalist-data-share-letime.j2`, frames the asset as a free dataset for their next piece.
   - `journalist-study-finds-letime.j2`, frames as fresh original research with the bomb stat.
   - `journalist-resource-suggest-letime.j2`, frames as a citable source for their existing beat.
3. Verify current email addresses at each outlet before sending. Confirmed contacts must be re-verified inside the standard 7-day window.

---

## CSV output schema (Apollo-ready)

The per-segment CSVs include the following columns in order:

| Column | Source |
|---|---|
| `email` | Target CSV |
| `first_name` | Split from `name` |
| `last_name` | Split from `name` |
| `name` | Target CSV |
| `outlet` | Target CSV |
| `beat` | Target CSV |
| `twitter` | Target CSV |
| `subject_line` | LLM-generated |
| `personalization_paragraph` | LLM-generated |
| `cosine_score` | Asset centroid vs corpus centroid |
| `segment` | Target CSV |
| `asset_url` | CLI flag |
| `asset_stat` | CLI flag |
| `subject_pattern` | LLM-selected (one of 5 patterns) |
| `ready_to_send` | TRUE if pattern validated, FALSE if generation hit retry cap |

Rows where `ready_to_send = FALSE` are still emitted, but flagged for manual subject-line review.

---

## Cache behavior

Corpus scrapes are cached per journalist email with a 14-day TTL in `cache/journalist-corpus/corpus-cache.db`. Re-runs within 14 days skip scraping and load from cache. Cache pruning runs automatically at the start of each enrichment run.

Cost: roughly $12 to $16 per 100 prospects for a full fresh run. Re-runs within 14 days cost only Claude API fees (about $1 to $3 per 50 prospects).

---

## Deterministic fallback: queue-az-pitches.py

When LLM keys are unavailable, `queue-az-pitches.py` builds the same per-asset per-segment CSVs from an asset manifest plus the journalist CSV. No Firecrawl, no Voyage, no Claude call.

```bash
python3 scripts/outreach/queue-az-pitches.py \
  --manifest data/outreach/az-campaign/asset-manifest.json \
  --journalists data/outreach/az-journalists.csv \
  --max-per-asset 60
```

The manifest is a JSON file with a `sender` block (name, email), a `campaign` label, a `send_window`, and an `assets` array. Each asset entry includes:

```json
{
  "slug": "heat-deaths-maricopa",
  "url": "https://azlawnow.com/investigations/heat-deaths-maricopa/",
  "bomb_stat": "Maricopa County recorded 645 heat-associated deaths in 2023, up 52 percent year over year",
  "vertical": "az-heat-vulnerability",
  "primary_segment": ["az-news", "az-region", "safety-blogger"],
  "chart_id": "maricopa-heat-deaths-2023"
}
```

Output rows are flagged `ready_to_send=no` and `needs_llm_rewrite=yes`. They never go out raw. Pass them through `generate-pitches.py` once the keys are wired.

---

## Anti-anchor-text rule

Never push publishers on anchor text. No generated pitch should suggest specific anchor text to the journalist. The journalist links how they want. Relationship is the scarce asset. If you see a generated `subject_line` or `personalization_paragraph` suggesting specific link text to the outlet, delete it and regenerate.

---

## Dry-run mode

Both LLM scripts support `--dry-run`. Use it to validate the pipeline before spending API credits.

```bash
python3 scripts/outreach/enrich-journalists.py \
  --target-list data/outreach/az-journalists.csv \
  --dry-run

python3 scripts/outreach/generate-pitches.py \
  --enriched-jsonl data/outreach/enriched-prospects.jsonl \
  --asset-url https://azlawnow.com/investigations/heat-deaths-maricopa/ \
  --asset-stat "Maricopa County recorded 645 heat-associated deaths in 2023, up 52 percent year over year" \
  --vertical az-heat-vulnerability \
  --output-csv data/outreach/az-campaign/heat-deaths \
  --dry-run
```

---

## Integration with existing send pipeline

The AZ Law Now `scripts/outreach/send-outreach.py` handles delivery, rate limiting, DNC, dedupe, and commit-per-send. The LedeTime pipeline only generates the personalization layer.

1. Run `enrich-journalists.py` and `generate-pitches.py` to produce per-segment CSVs with `personalization_paragraph` and `subject_line` per contact.
2. In the send script, load the CSV, render the chosen LedeTime template, and inject `personalization_paragraph` + `subject_line` per row.
3. All existing guardrails stay unchanged: MillionVerifier gating, commit-per-send, DNC check, one-per-domain-per-day cap.

---

## Sender persona

All LedeTime pitches sign off as:

> Brendan Franks
> On Record, AZ Law Now
> brendan@azlawnow.com

The framing is open-data offered to working reporters who cover the relevant beat. Not a marketing pitch. Not a law-firm sales touch.
