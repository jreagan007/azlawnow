# AZ Law Now Q2 2026 Summer Data Push

> **Status:** Queued, not sent. LLM personalization pass pending VOYAGE_API_KEY provisioning.
> **Queued:** 2026-05-11
> **Send window:** 2026-05-13 through 2026-06-13

---

## What's here

300 rows across 5 Tier S Arizona investigations, 17 asset+segment CSVs, one combined `_master.csv`. Built deterministically from `asset-manifest.json` plus `aee-style-journalists.csv` (250 A and B tier prospects from the AZ Law Now outreach DB, segmented).

| Asset | Total | Segments |
|---|---|---|
| arizona-pedestrian-deaths-road-design | 60 | az-news 40, public-health 10, family-blog 6, civic-advocacy 4 |
| aps-korman-heat-disconnect-7m-settlement | 60 | az-news 34, elder-care 12, public-health 10, civic-advocacy 4 |
| arizona-nursing-home-violations | 60 | az-news 33, elder-care 12, public-health 10, disability-advocacy 5 |
| hit-and-run-maricopa-county-data | 60 | az-news 42, labor-safety 14, civic-advocacy 4 |
| sr-347-crash-corridor | 60 | az-news 54, civic-advocacy 6 |

Each row carries:

- Apollo-ready contact fields (`email`, `first_name`, `last_name`, `outlet`, `beat`, `twitter`)
- Template-substituted `subject_line`
- Stub `personalization_paragraph` (vertical + segment template, ~50-70 words)
- Asset link, bomb stat, chart id, sender info (Brendan Franks)
- `ready_to_send: "no"` (hard gate, LLM rewrite required first)
- `needs_llm_rewrite: "yes"`

## Why `ready_to_send` is `"no"`

The template stubs route Memorial Day batch traffic through an auditable shape, but the actual hook paragraph for each journalist needs the LedeTime personalization pass:

1. **Full LedeTime path (preferred):** `scripts/outreach/enrich-journalists.py` + `scripts/outreach/generate-pitches.py`. Requires `VOYAGE_API_KEY` in `~/Projects/taqtics-ops/config/.env`. Site-scrapes each prospect's recent articles, embeds via Voyage AI, scores cosine similarity to the asset, then calls Claude Sonnet 4.6 for the per-prospect hook + subject.

2. **No-embed fallback:** `scripts/outreach/queue-az-pitches.py` (this script). Deterministic templates, no API calls. Good for a fast preview of the queue shape.

After either path produces a ready CSV, flip `ready_to_send` to `"yes"` and route through the existing AZ send pipeline (`scripts/outreach/send-outreach.py`).

## Send cadence

| Day | Template | Touches |
|---|---|---|
| 0 | `journalist-study-finds-letime.j2` | 1 |
| 5-7 | followup-1 | 2 |
| 12-14 | followup-2 | 3 |
| 14+ | stop | max 3 |

5-day minimum between touches. 3 total maximum. Hard stop on "not interested" replies.

## Send window rationale

- **Pedestrian-deaths-road-design** and **APS-Korman heat** peg to the start of Phoenix heat season (May 15 first 100-degree day forecast).
- **SR-347 crash corridor** pegs to Memorial Day travel coverage.
- **Nursing-home violations** and **hit-and-run Maricopa** are evergreen accountability anchors.

## How to rerun

```bash
cd ~/Projects/azlawnow
python3 scripts/outreach/queue-az-pitches.py \
  --manifest data/outreach/az-campaign/asset-manifest.json \
  --journalists data/outreach/az-campaign/aee-style-journalists.csv \
  --max-per-asset 60
```

To regenerate the journalist CSV from the live AZ outreach DB:

```bash
sqlite3 data/outreach/azlawnow-outreach.db <<'SQL' > data/outreach/az-campaign/aee-style-journalists.csv
.mode csv
.headers on
SELECT
  COALESCE(name, '') AS name,
  COALESCE(outlet, '') AS outlet,
  COALESCE(beat, role, '') AS beat,
  email,
  '' AS twitter,
  CASE
    WHEN segment = 'az_journalist' THEN 'az-news'
    WHEN segment = 'education_reporter' OR segment = 'education_advocate' OR segment = 'school_board' OR segment = 'homeschool_parent' THEN 'education'
    WHEN segment = 'elder_care_nonprofit' OR segment = 'elder_advocate' OR segment = 'medicaid_advocate' OR segment = 'ombudsman' OR segment = 'nursing_home_attorney' THEN 'elder-care'
    WHEN segment = 'labor_advocate' OR segment = 'worker_safety_org' OR segment = 'osha_advocate' OR segment = 'workers_comp_attorney' THEN 'labor-safety'
    WHEN segment = 'disability_rights' OR segment = 'disability_nonprofit' OR segment = 'disability_services' OR segment = 'down_syndrome' OR segment = 'special_needs_parent' THEN 'disability-advocacy'
    WHEN segment = 'mommy_blogger' OR segment = 'family_lifestyle' OR segment = 'childcare' OR segment = 'child_safety' OR segment = 'child_advocacy' OR segment = 'child_advocacy_nonprofit' THEN 'family-blog'
    WHEN segment = 'public_health_official' OR segment = 'healthcare_advocate' OR segment = 'patient_advocate' OR segment = 'victim_advocacy' THEN 'public-health'
    WHEN segment = 'community_org' OR segment = 'city_council' OR segment = 'pedestrian_safety_advocate' OR segment = 'dui_prevention' THEN 'civic-advocacy'
    ELSE 'az-news'
  END AS segment,
  '' AS da
FROM contacts
WHERE email IS NOT NULL AND email <> ''
  AND status = 'prospect'
  AND tier IN ('A','B')
ORDER BY tier, name
LIMIT 250;
SQL
```
