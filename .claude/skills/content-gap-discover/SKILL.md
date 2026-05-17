---
name: content-gap-discover
description: |
  GSC-driven AZ PI keyword-gap discovery. Pulls Search Console data for
  azlawnow.com, identifies position 11–30 no-click opportunities and untargeted
  query clusters, maps them to the AZ-PI intent ladder, and produces prioritized
  content briefs by voice. Wires npx tsx ../taqticscom/scripts/gsc-pull.ts --client=azlawnow.
  Use when: monthly content calendar planning, pre-cluster scoping, ADOT corridor
  seasonality windows (monsoon Jul–Sep, Spring Break Mar, heat Jun–Sep), or any
  request to "find gaps" or "what should we write next."
---

# Content Gap Discovery — AZ Law Now GSC Demand-Gap Protocol

## When to invoke

Invoke at the start of any content calendar cycle, before scoping a new cluster, or
whenever the question is "what should we write next." Do not guess at keyword gaps
from training data — GSC is the arbiter. The gap discovery process produces ranked
briefs; the pi-cluster-architect skill takes those briefs and plans the cluster shape.

---

## Phase 0 — GSC pull

Run the canonical ops-hub pull:

```bash
cd ~/Projects/taqticscom
npx tsx scripts/gsc-pull.ts --client=azlawnow
```

This writes output to `docs/gsc-reports/azlawnow-<date>.json` (or CSV, per hub
config). The pull includes: query, URL, impressions, clicks, CTR, avg position,
for the trailing 28-day and 90-day windows.

If auth is not set up, see `taqticscom/docs/GCP-SHARED-AUTH.md`. The GSC property
is `sc-domain:azlawnow.com`.

---

## Phase 1 — Bucket classification

Load the GSC pull output. Bucket every query-URL pair using the following rules:

### Bucket A — Position 11–30, impressions ≥ 50, CTR < 2% (the primary gap signal)

These are queries where azlawnow.com appears on page 2 or low page 1 and gets almost
no clicks. They represent established demand the site is not capturing. This is the
highest-priority bucket — the site is already in the conversation; a targeted spoke
can move it into top-10 clicks range without starting from zero authority.

### Bucket B — Position 1–10, impressions ≥ 200, CTR < expected for position

Expected CTR benchmarks by position (conservative):
- Position 1: 25–35%
- Position 2: 12–18%
- Position 3: 8–11%
- Position 4–5: 5–8%
- Position 6–10: 2–5%

Underperformance at these positions indicates a title/description CTR problem (fix
meta) or a featured-snippet competitor (target FAQ schema). Flag for `check:meta`
and PAA enrichment before content creation.

### Bucket C — Queries with impressions ≥ 100, no existing azlawnow.com URL ranking

These are queries where GSC shows impressions (the page appeared in SERPs for related
searches) but no URL is consistently credited. This indicates a cluster gap — demand
exists but no owned page targets it. These become new-content briefs.

### Bucket D — Queries with impressions < 50 (low-signal / exploratory)

Park. Re-evaluate after 90 days. Do not build content targeting low-impression queries
without corroborating DataForSEO volume data.

---

## Phase 2 — AZ-PI intent ladder mapping

For every query in Buckets A and C, classify by intent ladder position:

| Level | Intent shape | Example queries | Content type |
|---|---|---|---|
| **Informational** | "how does X work," "what is ARS X," "explain X" | "how does comparative fault work in arizona," "what is a notice of claim arizona" | Brandon legal-guide spoke or glossary term |
| **Research** | "X statistics," "X corridor data," "X vs Y," "X for [condition]" | "sr-347 crash statistics," "arizona nursing home violations 2024," "phoenix pedestrian deaths" | Brendan investigation |
| **Action** | "X attorney," "X lawyer," "X law firm," "hire X" | "car accident lawyer phoenix," "wrongful death attorney arizona" | Practice-area page (Brandon anchor) |
| **Local** | "X attorney [city]," "X crash [city]," "lawyer near [city]" | "car accident lawyer buckeye," "truck accident attorney west valley" | City-page or practice-area spoke (geo-targeted) |
| **Process** | "what to do after X," "how to file X," "X checklist," "X guide" | "what to do after a car crash in arizona," "how to file a notice of claim" | Stephanie client-guide |

Assign one primary intent level per query. If a query spans two levels (e.g., "arizona
car accident statute of limitations" is research + action), assign the higher-funnel
level (research) as primary and note the secondary.

---

## Phase 3 — ADOT corridor + seasonal query seeds

AZ Law Now has a natural data advantage on corridor-specific queries because Brendan
can publish ADOT Crash Facts analysis that competitors can't replicate. These are the
high-priority corridor and seasonal seed clusters to check in every GSC pull:

### Corridor seeds (check every pull)

| Corridor | Primary queries to check | ADOT data backbone |
|---|---|---|
| I-10 Phoenix / West Valley | "i-10 crash statistics arizona," "i-10 accident buckeye," "i-10 west valley crash" | ADOT Crash Facts route-level tables |
| SR-347 / Maricopa | "sr-347 crashes," "maricopa highway accident," "state route 347 dangerous" | ADOT corridor study, FHWA HSIP records |
| SR-303 / Loop 303 | "loop 303 crash," "sr-303 accident," "goodyear highway accident" | ADOT, MAG Top 100 intersections |
| I-17 Phoenix north | "i-17 accident phoenix," "interstate 17 crashes arizona" | ADOT Crash Facts |
| SR-101 / Loop 101 | "loop 101 crash," "sr-101 accident scottsdale" | ADOT, MAG |
| US-60 East Valley | "us-60 accident mesa," "superstition freeway crash" | ADOT |
| I-40 Northern AZ | "i-40 accident flagstaff," "interstate 40 arizona crash" | ADOT |
| I-8 / Yuma | "i-8 crash yuma," "yuma highway accident" | ADOT |
| SR-89 Prescott / Sedona | "sr-89 crash," "prescott highway accident" | ADOT |
| FRA grade crossings (statewide) | "train accident phoenix," "railroad crossing death arizona," "bnsf crossing accident" | FRA Form 6180.57 + crossing inventory |

### Seasonal query seeds (check at seasonal window)

AZ PI query demand has measurable seasonal patterns. Check these query clusters at the
indicated windows:

| Season | Window | Seed queries | Content angle |
|---|---|---|---|
| **Monsoon** | Jul 1 – Sep 30 | "monsoon driving safety arizona," "dust storm accident arizona," "haboob crash," "rain slick road accident phoenix," "flash flood car accident" | Brendan: ADOT monsoon-season crash rate by corridor; Stephanie: monsoon driving checklist |
| **Spring Break** | Mar 1 – Apr 15 | "spring break crash arizona," "drunk driving crash phoenix," "dui accident scottsdale spring break" | Brendan: DUI-related crash data, I-17 / SR-89 bar-corridor data; Brandon: DUI liability ARS explainer |
| **Extreme heat** | Jun 1 – Sep 30 | "heat stroke pedestrian arizona," "construction worker heat death arizona," "extreme heat car malfunction crash" | Brendan: OSHA heat-fatality data + AHCCCS ER admissions; Brandon: workers comp heat injury law |
| **Holiday traffic** | Nov 20 – Jan 5 | "holiday dui checkpoint arizona," "thanksgiving crash arizona," "new year's eve dui arizona" | Brendan: ADOT holiday-weekend crash data; Stephanie: holiday-travel safety checklist |
| **School year start** | Aug 1 – Sep 15 | "school zone accident arizona," "child pedestrian crash phoenix," "bus accident arizona school" | Brendan: ADE / Phoenix USD pedestrian-safety data; Brandon: school district liability |
| **Wrong-way crashes** | Year-round (spike Jan–Mar) | "wrong-way driver arizona," "wrong-way crash i-10," "wrong-way driver death phoenix" | Brendan: ADOT wrong-way crash data by route and hour |

---

## Phase 4 — Untargeted cluster detection

Beyond individual query gaps, identify topical clusters where AZ Law Now has no owned
page targeting the cluster's head query. Pattern:

1. Find 5+ queries in the GSC pull that share a topical root (e.g., "nursing home,"
   "daycare," "pedestrian," "rideshare") with impressions ≥ 50 each.
2. Check whether any `src/content/` page targets the cluster head query as
   `primaryKeyword` (practice-areas) or in the `title` + `description`.
3. If no page exists: flag as a new-cluster gap. Log to the content calendar.
4. If a page exists but ranks position 11–30: flag as a spoke-enrichment gap. Log
   for pi-cluster-architect Phase 3 engineering.

### Wrongful death cluster (always check)

The wrongful-death cluster is the highest-value PI cluster by case value. Check every
pull for:
- "wrongful death lawyer arizona"
- "wrongful death attorney phoenix"
- "arizona wrongful death law"
- "wrongful death claim arizona how long"
- "arizona wrongful death damages cap"

If any of these are in Bucket A or C, the wrongful-death cluster is a priority gap.
The cluster shape requires: Brandon legal guide (ARS 12-611/612, no-cap rule, eligible
survivors), Brendan investigation (wrongful-death crash data by ADOT corridor or
AHCCCS facility), Stephanie client guide (wrongful-death process, 180-day notice if
public entity, probate coordination), and practice-area page.

---

## Phase 5 — Prioritization and brief output

Score every Bucket A and Bucket C gap query using this formula:

```
priority_score = (impressions * 0.4) + (12 - position) * 5 + (intent_weight)
```

Intent weights:
- Action: +20
- Local: +15
- Research: +10
- Process: +8
- Informational: +5

Sort descending. The top 10 scores become the next content cycle's brief queue.

### Brief format

For each top-10 gap, produce a brief in `docs/gsc-reports/briefs/azlawnow-<date>/`:

```markdown
## Gap Brief: [query]

**GSC signal:** [impressions] impressions, position [X], CTR [Y]%
**Intent level:** [informational / research / action / local / process]
**Recommended voice:** [Brendan / Brandon / Stephanie] + [collection]
**Four-way anchor status:**
  - Brendan investigation: [exists at /insights/slug | MISSING]
  - Brandon legal guide: [exists at /legal-guides/slug | MISSING]
  - Stephanie client guide: [exists at /client-guides/slug | MISSING]
  - Practice-area page: [exists at /practice-area-slug/ | MISSING]
**Recommended title:** [draft title following voice-specific title rules]
**Primary sources:** [3 verifiable sources with URLs]
**ADOT / FRA / CMS data backbone:** [yes — source | no — flag]
**Seasonal window:** [if applicable]
**Cluster slug:** [vehicle-crashes / abuse-negligence / other-claims / new-cluster]
**Differentiation note:** [one sentence on what AZ Law Now can publish that competitors can't]
**Next step:** [pi-cluster-architect / pi-investigation / mode-legal / mode-client]
```

---

## Phase 6 — Reporting output

Write a summary report to `docs/gsc-reports/azlawnow-gap-report-<date>.md`:

```markdown
# AZ Law Now GSC Gap Report — <date>

## Pull window: [dates]

## Bucket A (position 11–30, impressions ≥ 50, CTR < 2%)
[N] queries. Top opportunities:
1. [query] — [impressions] impr, position [X] — [recommended voice]
2. ...

## Bucket C (no ranking URL, impressions ≥ 100)
[N] queries. Top gaps:
1. [query] — [impressions] impr — [recommended voice]
2. ...

## Corridor signals
[Table: corridor → impressions delta vs prior period → priority]

## Seasonal signals active this window
[List seasonal windows currently open or opening within 30 days]

## Wrongful-death cluster status
[Bucket A/C queries present? Four-way anchor complete?]

## Top 10 prioritized briefs
[Links to brief files in docs/gsc-reports/briefs/]

## Four-way anchor gap audit
[List clusters where one or more anchor positions are missing]
```

---

## Wiring notes

The GSC pull command requires the taqticscom ops hub and GCP auth:

```bash
# From the taqticscom repo root:
npx tsx scripts/gsc-pull.ts --client=azlawnow

# Output lands in:
~/Projects/taqticscom/docs/gsc-reports/azlawnow-<date>.json
```

The `clients.azlawnow` config in `taqticscom/clients.config.json` maps
`gscProperty: sc-domain:azlawnow.com`. If the property slug changes, update
`clients.config.json` — do not hardcode the property string in this skill.

---

## What this skill does not do

- It does not run SERP analysis. Use `check:serp` (`scripts/check-serp-competition.ts
  --client=azlawnow`) for competitor ranking data.
- It does not write content. Briefs feed into pi-cluster-architect and the voice-
  specific writing workflows.
- It does not replace legal-fact-check. Every content piece still runs the legal gate.
- It does not surface social signals or trends. Use the trend-scanner for that:
  `npx tsx scripts/trend-scanner.ts --client=azlawnow`.
- It does not handle DataForSEO volume pulls. Add `--dataseo` flag to gsc-pull if
  the hub script supports it; otherwise run a separate DataForSEO call for Bucket D
  validation.

---

## Failure modes to avoid

- **Guessing gaps from memory**: always run the GSC pull. Training-data impressions
  are not GSC impressions.
- **Building content for Bucket D queries**: impressions < 50 is exploratory. Do not
  assign writing resources until 90-day confirmation.
- **Ignoring the four-way anchor gap audit**: a single Stephanie guide without a
  Brendan investigation and Brandon legal guide is an incomplete cluster. Incomplete
  clusters rank below complete ones in topical-authority models.
- **Missing the seasonal window**: monsoon content published in October has missed its
  peak demand window by three months. Check seasonal signals in Phase 3 every month.
- **Treating position-1 CTR underperformance as a content gap**: if the site ranks #1
  and CTR is low, the problem is the title/description, not missing content. Run
  `check:meta` and add FAQ schema — do not publish a duplicate page.
