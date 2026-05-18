---
name: pi-investigation
description: |
  End-to-end Brendan Franks data-journalism protocol for src/content/investigations/.
  Covers ADOT corridor studies, FRA grade-crossing histories, AHCCCS/CMS nursing-home
  violation audits, DCS daycare records, ADE school-discipline data, and municipal
  hot-spot analyses. Use this skill before writing any investigation-bylined piece.
  Pre-publish gate: legal-fact-check must run and exit 0 before commit.
  Trigger: any Brendan-voice investigation, any public-records-driven piece,
  any data-first ARS 39-121 request, any Finding Gate evaluation.
---

# PI Investigation — Brendan Franks Data-Journalism Protocol

## When to invoke

Invoke this skill before authoring any `src/content/investigations/` MDX file. It is
the production protocol for every Brendan Franks byline. Single-source news briefs that
lack an original data finding are NOT investigations — they belong in a different
collection or a shorter news brief format.

The skill is gated. Do not skip a phase to ship faster. The phases exist because the
2026-04 wave of PI content that skipped the Finding Gate shipped pieces that summarized
publicly available ADOT tables without original synthesis. They ranked for nothing and
added no accountability value.

---

## Brandable investigation types

The following types have proven ADOT/FRA/agency data backbones. Match every story to
one type before proceeding — this determines data sources, request templates, and the
Finding Gate criteria.

| Type | Primary agencies | Data backbone | Finding shape |
|---|---|---|---|
| **ADOT corridor study** | ADOT, FHWA, MAG | Crash Facts tables + intersection logs + CIP records | Corridor-level rate vs statewide rate; before/after infrastructure change |
| **FRA grade-crossing history** | FRA, BNSF/UP/ARZC, city streets | FRA Form 6180.57 per-crossing accident PDFs + crossing inventory | Incident pattern vs upgrade timeline |
| **AHCCCS / CMS nursing-home** | CMS Care Compare, AHCCCS, AZDHS | Survey deficiencies + penalty records + staffing data | Repeat-deficiency pattern or staffing floor violations |
| **DCS / daycare violations** | AZ DCS, ADE Child Care Licensing | Inspection reports, license sanctions | Named licensed facility with documented pattern |
| **ADE school discipline / educator** | ADE Educator Misconduct Portal, APS | Adverse-action records, AZDPS background-check logs | Systemic gap between substantiation and disclosure |
| **Municipal hot-spot** | City traffic eng., ADOT, MAG | City crash data, CIP project records, ARS 39-121 emails | Named intersection, documented city knowledge, gap in response |
| **Commercial trucking / ghost fleet** | FMCSA SAFER, DOT MCMIS | Carrier safety ratings, inspection OOS rates, chameleon-carrier reincorporation records | Identity chain across at-fault carriers |
| **Public-entity liability** | ADOT, city engineering depts., school districts | ARS 39-121 records, CIP project lists, notice-of-claim filings | Government knowledge documented before incident |

---

## Phase 1 — Public-records scoping

Goal: establish the evidentiary floor before writing a word.

### 1a. Primary source inventory

List every primary source relevant to the story type. Do not proceed if fewer than three
distinct government or institutional sources exist. The minimum-source rule prevents
investigation labels on pieces that are really news summaries.

Authoritative sources by type (non-exhaustive):

- **ADOT data**: adot.gov/traffic/safety/research (Crash Facts, by-county tables,
  by-route tables, by-intersection tables). Data lag is 18–24 months. Always cite the
  data year, not the publication year. Separate `2024 Crash Facts (data year 2024,
  published 2025)` from the narrative present.
- **FRA grade crossings**: safetydata.fra.dot.gov — Highway-Rail Grade Crossing
  Inventory (per-crossing) + Office of Safety Analysis per-crossing accident query
  (Form 6180.57 PDFs). Both are public, no login required.
- **CMS Care Compare**: data.cms.gov/provider-data/dataset/4pq5-n9py (nursing home
  inspections, deficiencies, penalties, staffing). Updated quarterly.
- **ADE Educator Misconduct**: ade.az.gov/educator-misconduct (public adverse-action
  database). Match to AZDPS record when available.
- **DCS child care licensing**: dcs.az.gov/child-care/licensing/reports (inspection
  reports, license actions).
- **FMCSA SAFER**: safer.fmcsa.dot.gov (carrier name, DOT number, safety rating, OOS
  rate, crash history).
- **City of Phoenix open data**: phoenixopendata.com (crash data, code enforcement).
- **MAG regional planning**: azmag.gov (Top 100 Crash-Risk Intersections reports).
- **AZ Courts / CourtListener**: azcourts.gov public docket + courtlistener.com (case
  citations, if applicable).
- **ARS 39-121 records** (see Phase 2 for request protocol).

### 1b. Story type assignment

Assign one type from the Brandable investigation types table above. If the story
genuinely spans two types (e.g., a grade crossing involving public-entity engineering
decisions), name the primary type and list the secondary; the Finding Gate applies to
the primary.

### 1c. ADOT data-year citation rule (HARD enforcement)

Every ADOT statistic must carry a parenthetical data-year cite: `(ADOT 2024 Crash
Facts, data year 2024)`. The publication year is not the data year. Omitting this is
the ADOT-data-year-mismatch fabrication class flagged in legal-fact-check.

---

## Phase 2 — ARS 39-121 public-records requests

When primary data is not publicly available on agency portals, file formal requests.
See `references/records-request-templates.md` for agency-specific templates.

### When to file vs. when to retrieve online

| Source | File request? | Notes |
|---|---|---|
| FRA Form 6180.57 crossing accidents | No | Public via safetydata.fra.dot.gov |
| ADOT statewide Crash Facts | No | Public PDF download |
| ADOT project-specific records (CIP items, safety study reports) | Yes | ARS 39-121 to ADOT Public Records Office |
| City of Phoenix intersection improvement records | Yes | ARS 39-121 to PHX Streets Transportation Dept |
| CMS Care Compare deficiencies | No | Public via data.cms.gov |
| AZDHS long-term care survey reports | Sometimes | Facility-level PDFs sometimes require request |
| DCS inspection reports | Yes | ARS 39-121 to DCS Communications |
| ADE educator adverse-action narratives | Sometimes | Summary public; full narrative may require request |
| FMCSA carrier records | No | Public via safer.fmcsa.dot.gov |

### Filing protocol

1. Send requests **in writing** (email to the agency's public records contact).
2. Use the templates in `references/records-request-templates.md`.
3. The statutory window is **10 business days** per ARS 39-121.01(D) for acknowledgment
   (not necessarily completion). Track the calendar.
4. Include the journalism/public-interest fee waiver language from the template. Fee
   waiver is not guaranteed; log whether the agency grants it.
5. Log all requests in `docs/records-requests/` with date, agency, request text,
   response status, and received documents.

---

## Phase 3 — Data aggregation and original finding

This is where an investigation earns its label. Aggregation must produce an original
finding the existing public record does not trivially state.

### Finding Gate (HARD-BLOCK before drafting)

Before writing the lede, state the finding in one sentence. Apply the following
auto-fail test. If any signature fires, STOP — rebuild or reclassify.

**Auto-fail signatures:**

- The one-sentence finding is something a lay reader could confirm in two minutes on the
  agency portal without any original synthesis. Example failure: "FRA records show
  multiple crashes occurred at this crossing." That is retrieval, not a finding.
- The piece concedes its own premise ("both sides have merit," "this is typical for
  crossings of this age," "no one is clearly at fault").
- The closing thesis is a project proposal ("the city should install channelizing
  medians," "more safety studies are needed") instead of a stated factual finding.
- Every fact is available in a single government database with no source conflict, no
  cross-agency synthesis, no before/after timeline the agency itself did not publish.
- The piece is hedge-qualified throughout ("may," "could suggest," "appears to indicate")
  with no concrete claim the data actually supports.

**Qualifying finding shapes** (examples from published investigations):

- "FRA Form 6180.57 records document four pedestrian fatalities at DOT crossings
  025430G and 025617C in the 30 months before BNSF installed active-warning gates — a
  period when agency records show BNSF was aware of the passive-crossbuck configuration."
- "Twenty-seven of the 37 Arizona career schools that received adverse actions from ADE
  between 2022 and 2024 continued enrolling students after the first substantiated
  violation, with a median delay of 11 months between first action and license
  suspension."
- "AHCCCS survey data shows that the four nursing facilities in the SR-303 corridor that
  received repeat Immediate Jeopardy citations between 2022 and 2025 averaged 3.1
  registered-nurse hours per resident day — 41% below the CMS proposed minimum."

State the finding before the brief. The piece is engineered to prove the finding, not to
discover it in the writing.

### Aggregation steps

1. **Pull data** — retrieve all primary-source records into `docs/investigations/<slug>/`
   (never in `src/`). Include raw downloads, 39-121 response documents, and PDFs.
2. **Build the claim inventory** — for each factual assertion the piece will make, log:
   `claim text | source URL | data year | confidence: high/medium/low`. Claims at
   `medium` or `low` require additional sourcing or must be cut.
3. **Cross-agency synthesis** — the finding must draw on at least two distinct agencies
   or data sets. Single-source pieces are news briefs, not investigations.
4. **Timeline construction** — for corridor/crossing/facility stories, build an explicit
   before/after timeline keyed to specific dates (agency action, incident, upgrade). The
   timeline is the narrative spine.
5. **Compute the rate** — wherever ADOT or FRA data allows, compute a per-unit rate
   (crashes per 100M VMT, injuries per 100 crossing-events, deficiencies per resident-
   year). Raw counts are weaker findings than rates.

---

## Phase 4 — Narrative draft (Brendan voice)

### Voice rules

- **First person, editorial.** Brendan is the narrator. "I requested records." "The
  FRA data shows." Not "our investigation found."
- **Data-first lede.** The finding or the key number goes in sentence one. Not
  background, not scene-setting prose, not a question. The number does the work.
- **Contractions always.** "It's," "don't," "weren't." Hard rule.
- **No em-dashes.** Hard-block. Use a comma, a colon, or split the sentence.
- **Crashes, not accidents.** Hard-block on "accident" as a noun for vehicle crashes.
- **Families, not victims.** In wrongful-death and serious-injury coverage, refer to
  "the family of [name]," "a mother of three," "a 57-year-old pedestrian." Not
  "the victim's family."
- **Person-first wrongful-death framing.** Name the person. Describe the person briefly
  (relationship, age, the detail the family disclosed). Then the data. Never lead with
  the agency or the statistic when a named person died.
- **No directive legal advice in the body.** Brendan can describe what the law requires
  ("ARS 12-821.01 requires a 180-day notice of claim against public entities"). He
  cannot advise the reader to file a specific claim or tell them what their case is
  worth. That's Brandon's lane.
- **Flesch 50–60 target.** Warn below 45. Hard-block below 25.
- **80%+ active voice.** Run a passive-voice count if the audit flags it.
- **Name the road, city, intersection.** "The I-10 westbound shoulder near Exit 112 in
  Buckeye" not "a major freeway in the West Valley."
- **ADOT data-year cite** on every statistic (see Phase 1c).
- **No legal advice framing.** The FAQ entry for "what should families do" can describe
  the ARS 12-821.01 notice window; it cannot say "you should file a claim."

### Structural template

```
[Lede — data-first finding sentence, then 1-2 human-stakes sentences if person-first]

[KeyFacts block — 3–4 facts, at least one variant="warning" for the most actionable finding]

[Paragraph 1 — person-first context OR corridor context, whichever applies. Name the road/facility/person.]

[## H2 — The Data / The Record / [Agency] History at This [Location]]

[Selective-bold spine sentence opening this section.]

[Data body — cite source inline, cite data year. At least one StatBlock or StatGrid per major H2.]

[## H2 — The Timeline / Before and After / What [Agency] Knew]

[Selective-bold spine sentence. Timeline of documented events, keyed to dates.]

[## H2 — What the Records Show (or equivalent finding-statement heading)]

[Selective-bold spine sentence stating the original finding explicitly.]

[Body proving the finding from the aggregated data.]

[## H2 — What This Means (implications, not directive advice)]

[2–3 paragraphs. No "you should." No "contact an attorney." Describe the structural gap the finding reveals.]

[Closing thesis — one quotable sentence under 15 words, comparison or contrast framing, no action prompt.]

[FAQ block — see below]
[Sources/dataSources frontmatter]
```

### Finding Gate for the closing thesis

The closing thesis must:
- State a finding, not propose an action.
- Be under 15 words.
- Not contain "should," "must," "need to," "call," "contact," or "speak with."
- Be checkable against the data in the piece.

Example pass: "Forty-three months of passive crossbucks at twin crossings three feet apart
predated the first gate by two federal safety review cycles."

Example fail: "Families injured at grade crossings should contact an attorney to learn
their rights." (Directive, not a finding — that's a body CTA, hard-banned.)

---

## Phase 5 — insightSchema compliance (HARD-BLOCK)

Every `src/content/investigations/` MDX must pass Zod validation against `insightSchema`
in `src/content.config.ts`. Check each field before commit:

| Field | Requirement | Notes |
|---|---|---|
| `title` | ≤ 60 chars | SERP title. Use `headline` for the long editorial H1. |
| `headline` | Optional, any length | The Brendan-voice H1. Can exceed 60 chars. |
| `description` | 140–160 chars | GSC meta description. Must include a stat or named location. |
| `author` | `"brendan-franks"` | Hard-coded for investigations. |
| `reviewedBy` | Optional string | Only if Brandon reviewed for legal accuracy. |
| `category` | One of the `insightSchema` enum values | `crash-data`, `safety-analysis`, `abuse-investigation`, `negligence-report`, `infrastructure`, `policy`, `firm-news`, `community`. |
| `ogImage` | Required | `/og/[slug].png`. Must exist. |
| `keyTakeaway` | Required, multi-paragraph | The finding stated for the reader. At least 3 sentences. |
| `dataSources` | ≥ 3 entries | Full citation: Author/Agency. Title. URL. Retrieved date. |
| `faqs` | ≥ 5 entries | See FAQ protocol below. |
| `relatedPracticeAreas` | ≥ 1 | Cross-link to Brandon's practice area. |
| `relatedInsights` | ≥ 1 if available | Cross-link to at least one other investigation. |
| `locations` | ≥ 1 | Arizona geography slugs: `arizona`, `phoenix`, `maricopa-county`, etc. |

`dataSources` citation format (mandatory):

```
Agency Name. (Year). Document Title. Retrieved [date] from https://url
```

Example:
```
Federal Railroad Administration. Highway-Rail Grade Crossing Inventory,
DOT crossing 025430G (27th Avenue, Phoenix). Retrieved May 8, 2026, from
https://safetydata.fra.dot.gov/officeofsafety/publicsite/crossing/crossing.aspx
```

### FAQ protocol (PAA-first)

Minimum 5 FAQs per investigation. At least 3 of the 5 must be verbatim or near-verbatim
People Also Ask phrasings for the story's primary keyword. Run `npx tsx
scripts/research/faq-paa-research.ts --slug=<slug>` after frontmatter is drafted to pull
actual PAA questions from the SERP.

FAQ rules specific to investigations:

- The "what should families do" FAQ entry is always the last FAQ. It describes process
  (ARS 12-821.01 notice window, documentation steps) without directing the reader to
  file a specific claim or call the firm. Brendan can describe the law; he cannot advise.
- No FAQ answer may assert a legal conclusion about the reader's specific situation.
- Every FAQ answer must be sourced to a named primary source or cite an ARS section.
- FAQs on wrongful-death stories must use person-first language: "what happened to
  [name]" not "what happened to the victim."

---

## Phase 6 — Pre-publish gate (legal-fact-check, HARD-BLOCK)

Run `legal-fact-check` on the completed MDX before any commit to the investigations
collection. The gate must exit 0. Any `confidence: low` claim in the fact-bundle JSON
blocks publish.

Investigation-specific claim types that must be verified:

| Claim type | Verification source | Severity |
|---|---|---|
| ARS citation number | azleg.gov — confirm section title + text match | CRITICAL |
| ARS 12-821.01 notice window | azleg.gov current text (confirm 180 days, not 2 years) | CRITICAL |
| SOL deadlines stated or implied | azleg.gov ARS 12-542, ARS 12-611 | CRITICAL |
| Named verdict or settlement amount | Court docket or contemporaneous news report with source | MEDIUM |
| Tribal jurisdiction scope | Specific tribe's jurisdictional agreement, not generic rule | MEDIUM |
| ADOT statistic | ADOT Crash Facts PDF, data year cited | MEDIUM |
| FRA incident record | FRA Form 6180.57 PDF, crossing ID cited | MEDIUM |
| Named facility deficiency | CMS Care Compare or AZDHS report, survey date cited | MEDIUM |
| Agency timeline (when upgrade occurred) | Primary agency document, not news report | MEDIUM |
| AZ Constitution Art 2 §31 (no damages cap) | azleg.gov AZ Constitution text | MEDIUM |

The `legal-fact-check` gate also enforces the ER 7.1 rule: the investigation body may
not contain unverified superlatives ("the most dangerous crossing in Arizona") without a
data source that specifically supports that superlative for that location.

---

## Phase 7 — Internal-linking gate (four-way anchor requirement)

Before commit, verify the four-way anchor cross-link is satisfied. Every investigation
must link to at least one article from each of the other three voices:

| Voice | Collection | Minimum 1 link to |
|---|---|---|
| Brandon Millam | legal-guides OR practice-areas | Relevant ARS explainer or practice-area page |
| Stephanie Ramirez | client-guides | Relevant client-process guide |
| Brendan Franks | investigations | At least 1 related investigation (relatedInsights) |

Internal links must resolve. Run `check:links` before commit.

---

## Phase 8 — Quality gate sequence

Run in this order before committing any investigation MDX:

```bash
# 0. Cannibalization gate (MANDATORY) — the new investigation must not
#    share topic + search intent with any existing page. Investigations
#    target data/finding intent, never the legal-guide "Arizona [Topic]
#    Laws" framing. This is the guardrail that stops a buried 8th pair.
npm run check:cannibalization:strict
npx tsx scripts/check-cannibalization.ts --file src/content/investigations/<slug>.mdx

# 1. Content quality (word count, no em-dash, Flesch, active voice)
npx tsx scripts/audit-quality.ts --slug=<slug>

# 2. AI-pattern audit (no forbidden phrases, no LLM-citation voice)
npx tsx scripts/audit-ai-patterns.ts --slug=<slug>

# 3. Schema validation
npx tsx scripts/audit-claim-inventory.ts --slug=<slug>

# 4. Source check (all dataSources URLs resolve)
npm run check:sources

# 5. OG image exists
npm run check:images

# 6. Legal fact-check (runs legal-fact-check skill, exits 1 on any CRITICAL or low-confidence claim)
# Run the legal-fact-check skill against the completed MDX.

# 7. Internal links
npm run check:links

# 8. Local build
npm run build
```

All must exit 0 before committing. Do not weaken a gate to pass — fix the content.

---

## File outputs per investigation

```
docs/investigations/<slug>/
  records-log.md           # ARS 39-121 requests filed + responses received
  claim-inventory.json     # claim text | source | data year | confidence
  fact-bundle.json         # legal-fact-check output (must be all high before commit)
  timeline.md              # chronological event log with sources

src/content/investigations/<slug>.mdx   # the published piece
public/og/<slug>.png                    # OG image (required, no draft-mode exception)
public/images/heroes/<slug>.webp        # hero image
```

---

## What this skill does not do

- It does not write the article. Phase 4 drafts; the writer reads ONLY the
  claim-inventory and fact-bundle. No training-data facts.
- It does not generate images. Use the site's image pipeline (`scripts/regen-single-card.ts`
  equivalent or manual Gemini generation).
- It does not run legal-fact-check. That skill runs as the pre-publish gate in Phase 6.
- It does not handle social distribution. Social posts follow publication.
- It does not cover Brandon or Stephanie content. Investigations are Brendan-only.

---

## Tone reference — read before every draft

The AZ Law Now investigations reader has just searched for information about a crash,
a nursing home, or a school incident that may have harmed someone they know. Before
writing a word, answer these questions:

1. Would this help a family trying to understand what happened and why?
2. Is the primary source visible and verifiable by the reader, not just by the author?
3. Does the piece say what it found, not what it thinks the reader should do about it?
4. Is every named person described with the same dignity the author would want for
   their own family member?
5. Would a quality rater be able to check every claim against a primary source in
   60 seconds?
6. Is there an original finding here — something the system could not answer before
   this piece existed?
7. Does the piece name the road, the city, the facility — or does it hide behind
   vague geography?

If any answer is no, revise before publishing.
