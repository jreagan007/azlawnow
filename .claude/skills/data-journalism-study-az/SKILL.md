---
name: data-journalism-study-az
description: End-to-end pipeline for AZ Law Now Tier-S data-journalism studies using the Fractl narrative arc. Takes a research question, runs Perplexity + DataForSEO + public-records harvest, builds the fact-bundle JSON, and produces the MDX draft with bomb-stat lede + methodology paragraph + 3 findings + 3 charts max + closing thesis + no body CTA. Two-phase Researcher to Writer separation (the writer reads ONLY the fact-bundle JSON, never the harvest sources directly). Use for: AZ heat-disconnect study, AZ school-restraint study, AZ nursing-home concentration study, any signature AZ data piece following the Fractl narrative arc.
---

# data-journalism-study-az

## When to invoke

- A new AZ Tier-S piece is greenlit per `TIER-S-IDEATIONS-AZ.md`
- An existing AZ Tier-A piece earns promotion to Tier-S (Tier-1 placement landed, engagement spike, or new data)
- A signature data piece on AZ injury, civic accountability, or consumer safety needs the Fractl narrative arc

## Inputs

- `--slug <slug>` (required): pillar slug matching the fact-bundle filename + content collection entry
- `--vertical <vertical>` (required): one of `az-heat-disconnect | az-pedestrian-safety | az-school-safety | az-elder-care | az-daycare-safety | az-rail-safety | az-hit-run | az-esa-fraud | az-workers-comp-heat | az-ice-litigation`
- `--byline <author>` (required): one of `brendan-franks | brandon-millam | stephanie-ramirez`
- `--ideation-card <path>` (optional): path to the ideation card in `TIER-S-IDEATIONS-AZ.md` for context

## Phase 1: Researcher harvest

The Researcher runs in a background-isolated worktree. Owns:

1. **Perplexity primary-source harvest** via sonar-pro. One query per finding-hypothesis from the ideation card. Output every cited URL to `data/research/<slug>-source-trace.md`.
2. **DataForSEO PAA harvest** for 5-7 SERP-intent keywords. Output to `data/research/<slug>-paa.md`.
3. **Public-records harvest** via site-scrape API. Government databases, court filings, FOIA-archived correspondence. Output raw scrapes to `data/research/<slug>-raw/`.
4. **Cross-reference** with existing AZ Law Now investigations via the local sqlite DB.
5. **Fact-bundle assembly**: write to `data/research/fact-bundles/<slug>.json` with schema:

```json
{
  "slug": "<slug>",
  "vertical": "<vertical>",
  "viralTier": "S",
  "viralRationale": "<one sentence>",
  "byline": "<author-slug>",
  "headline_stat": "<verbatim sentence; one number; active voice; AZ-specific>",
  "stake": "<2-3 sentences on why this matters now>",
  "methodology": {
    "N": "<sample frame>",
    "time_window": "<start to end date>",
    "primary_source_agencies": ["<agency 1>", "<agency 2>"],
    "excluded": "<what was deliberately excluded and why>"
  },
  "findings": [
    {
      "id": "finding-1",
      "claim": "<claim sentence>",
      "qualifier": "<qualifier phrase>",
      "supporting_stat": "<stat>",
      "source": "<URL>",
      "entities": ["<entity 1>", "<entity 2>"]
    }
  ],
  "entities": [
    {
      "name": "<entity>",
      "type": "regulator | manufacturer | defendant | agency | statute | facility",
      "source_url": "<URL>"
    }
  ],
  "sources": [
    {
      "title": "<source title>",
      "publisher": "<publisher>",
      "date": "<YYYY-MM-DD>",
      "url": "<URL>",
      "perplexity_query": "<the query that surfaced this source>"
    }
  ],
  "quotes": [
    {
      "speaker": "<name>",
      "role": "<title, org>",
      "context": "<source + date>",
      "text": "<verbatim quote>",
      "source_url": "<URL>",
      "lift_priority": 1
    }
  ],
  "paa_queries": [
    {
      "query": "<verbatim PAA question>",
      "keyword_that_surfaced_it": "<keyword>",
      "position": 1
    }
  ],
  "unknowns": [
    "<anything the stakeholder remembered but the source didn't confirm>"
  ],
  "internal_links": [
    {
      "anchor_text": "<text>",
      "url": "<existing AZ Law Now investigation URL>"
    }
  ]
}
```

## Phase 2: Writer (reads ONLY the fact-bundle)

The Writer runs after Researcher complete + Jared approves the fact-bundle. Reads ONLY:
- `data/research/fact-bundles/<slug>.json`
- `docs/SOUL.md` (TODO port to AZ) for voice
- `docs/WRITING-STYLE-RULES.md` (TODO port to AZ) for mechanics
- `src/content/investigations/_template.mdx` for frontmatter scaffold

Writer is FORBIDDEN from adding any named person, dollar amount, year, court, agency, statute, or stat not in the fact-bundle.

Outputs `src/content/investigations/<slug>.mdx` with structure:

1. **Frontmatter** (per current schema + Tier-S fields):
   - `title`, `description ≤ 160 chars`, `headline`, `author`, `reviewedBy`, `category`, `tags`, `publishedAt`, `image`, `ogImage`, `readingTime`
   - `viralTier: S`, `viralRationale`, `newsEligible: false`
   - `keyTakeaway`, `faqs[]` (5+ for Tier-S, ≥ 70% PAA coverage)
   - `dataSources[]`, `relatedInvestigations[]`, `relatedInsights[]`, `relatedGuides[]`, `relatedPracticeAreas[]`, `locations[]`
   - `methodology` object (dataSources, processing, limitations, peerReview, lastUpdated)
   - `embeddableCharts[]` (registered chart slots, populated at Phase 3 visual build)
   - `hasDataset: true` (Tier-S earns dataset offer)
   - `status: published`

2. **Body** (Fractl narrative arc):
   - Bomb stat in first sentence (verbatim from fact-bundle)
   - 2-sentence stake
   - **Methodology** as ONE paragraph (N, sample frame, time window, source agency, what was excluded)
   - **Finding 1, 2, 3** each with:
     - H2 + selective-bold lead-in sentence
     - Multi-entity sections use H3 children (not inline-bold `**Country.**` patterns)
     - Stat in prose immediately above each chart
     - 1 `<StatGrid>` or `<KeyFacts>` per major section
     - 1 `<Quote>` from `fact_bundle.quotes[lift_priority: 1]`
     - Inline ShareableFigure for any panel from the composite (per `viral-infographic-az` skill)
   - **What this means for Arizonans** (2-3 implication paragraphs; AZ-specific: streets, statutes, agencies, regions)
   - **Closing thesis** (single quotable sentence under 15 words)
   - Author + reviewer card (auto-rendered from frontmatter)
   - NO body CTA. Conversion lives in nav.

3. **FAQ section** (Tier-S earns ≥ 70% PAA coverage):
   - 5+ FAQs from `paa_queries[]`
   - Each answer 2-4 sentences
   - Statute citations inline (ARS §X-XXX format)
   - Person-first language

## Phase 3: Audit pass

Run in order, per `TIER-QA-GATE-MATRIX.md`:

1. `npm run audit:style` (TODO if not built, port from azlawnow `audit-content-style.js`)
2. `npm run build` (clean exit)
3. Long-paragraph audit (Tier-S 3-4 line max)
4. Multi-entity H3 audit
5. Comma-list 5+ → `<ul>` audit
6. Cross-panel consistency audit
7. FAQ-PAA coverage audit (`npm run research:faq-paa -- --slug=<slug>`, TODO port)

## Hard rules (NO SLOP)

- Researcher and Writer are separate agents
- Writer NEVER reads anything but the fact-bundle JSON
- Person-first language
- No em-dashes
- No "expert" or "specialist" for attorneys
- % symbol
- Oxford comma
- No "shocking" / "alarming" / "staggering" before stats
- No CTA in body; closing thesis only
- No future-dated publishedAt
- Subject lines on outreach ≤ 50 chars
- Description ≤ 160 chars
- Active voice 80% minimum
- AZ-specific in every finding
- Stay on the feature branch
- Update `docs/strategy/<slug>-build-log.md` §0 LIVE STATE after every material decision

## Verification: did the skill work?

- `data/research/fact-bundles/<slug>.json` validates against the schema
- `data/research/<slug>-source-trace.md` lists every Perplexity query + cited URL
- `src/content/investigations/<slug>.mdx` builds clean (npm run build)
- Every claim in the MDX traces to a fact-bundle field
- 0 writing-style audit violations
- ≥ 70% PAA coverage on FAQ
- Tier-S matrix gates all pass

When all six are true, the skill ran clean.
