---
name: pi-cluster-architect
description: |
  Plan and ship a content cluster (pillar + spokes) for AZ Law Now using a structured
  Discovery → Positioning → Engineering → Verification protocol. Use this skill before
  starting any multi-article cluster expansion involving ≥2 related articles across the
  five content collections (investigations, legal-guides, client-guides, practice-areas,
  glossary). Trigger when: a request involves planning a cluster, when ranking recovery
  requires topical authority depth, when ADOT corridor data supports a new practice-area
  pillar, when city-page programmatic value is in question, or when a four-way anchor
  cross-link gap is identified. The four-way anchor (Brendan investigation + Brandon
  legal guide + Stephanie client guide + practice-area page) is the AZ Law Now cluster
  atom — it is not optional.
---

# PI Cluster Architect — AZ Law Now Content Cluster Discipline

## When to invoke

Invoke this skill before planning any cluster of related articles. A cluster is two or
more articles in a related topical area that are intended to share internal links and
support a common ranking target. Single articles use the voice-specific workflow
(pi-investigation for Brendan, mode-legal for Brandon, mode-client for Stephanie).

The skill is gated. Do not skip a phase. The phases exist because clusters that skip
Discovery ship content that is internally consistent but does not differentiate against
what already ranks. In the AZ PI space, every competitor has a car-accident page. The
question is whether ours has a finding and a data backbone that theirs does not.

---

## AZ-PI Cluster Topology

### Practice cluster topology

| Cluster slug | Practice areas covered | Brandon anchor | Brendan anchor | Stephanie anchor |
|---|---|---|---|---|
| `vehicle-crashes` | Car accidents, truck, motorcycle, pedestrian, rideshare, bus, bicycle | arizona-car-accident-law (LG) | ADOT corridor study (INV) | after-crash-checklist (CG) |
| `abuse-negligence` | Nursing home, daycare, school/educator, elder abuse | nursing-home-negligence-law (LG) | AHCCCS/CMS deficiency report (INV) | nursing-home-complaint-guide (CG) |
| `other-claims` | Dog bite, premises liability, slip-and-fall, wrongful death, workers comp | wrongful-death-law-arizona (LG) | Municipal liability corridor or public-entity study (INV) | wrongful-death-process-guide (CG) |

### Geographic topology

| Region | Priority tier | City pages | ADOT corridors |
|---|---|---|---|
| PHX Metro | Tier 1 | Phoenix, Mesa, Chandler, Glendale, Scottsdale, Tempe | I-10, I-17, SR-202, SR-101, SR-51 |
| West Valley | Tier 1 | Buckeye, Maricopa, Goodyear, Surprise, Peoria | I-10 West, SR-303, SR-347, SR-85 |
| East Valley | Tier 2 | Gilbert, Queen Creek, Apache Junction | US-60, SR-24 |
| Tucson Metro | Tier 2 | Tucson, Oro Valley, Marana | I-10 (Tucson segment), SR-77 |
| Northern AZ | Tier 3 | Flagstaff, Prescott, Sedona, Kingman | I-40, I-17 North, SR-89 |
| Yuma | Tier 3 | Yuma | I-8, SR-95 |

### Wrongful-death cluster shape

Wrongful-death stories span all three cluster types and require special handling. When
a cluster involves a fatality, the wrongful-death cluster shape applies:

- Brendan: person-first investigation, person named in lede, FRA/ADOT/AHCCCS data
  proving systemic context.
- Brandon: wrongful-death law explainer (ARS 12-611/612, eligible survivors, damages,
  AZ no-cap rule, ARS 12-821.01 notice if public entity involved).
- Stephanie: wrongful-death process guide (documentation steps, notice-of-claim
  timeline, probate vs wrongful-death action distinction, "first 30 days" checklist).
- Practice area: link to the wrongful-death practice-area page and to the relevant
  primary practice area (car accidents, nursing home, etc.).

---

## The 4-Phase Protocol (gated — do not skip)

### Phase 1 — Cluster Discovery

Goal: ground-truth the AZ PI territory before deciding angle.

Run these queries using Perplexity, DataForSEO, or GSC pull. Do not synthesize from
Claude training data. Each answer is data.

1. **Query universe**: list the top 25 commercial and informational queries in this
   cluster. Group by the AZ-PI intent ladder:
   - Informational: "how does Arizona comparative fault work," "what is ARS 12-821.01"
   - Research: "I-10 crash statistics Arizona," "Phoenix nursing home ratings 2024"
   - Action: "car accident lawyer Phoenix," "nursing home attorney Tucson"
   - Local: "car accident lawyer Buckeye," "truck accident attorney West Valley"
   Record search volume if available via DataForSEO.

2. **Competitor depth**: who ranks top 3 for the head queries? How many spoke articles
   do they have? What's their citation density — do they cite ARS sections, ADOT Crash
   Facts, FRA data, CMS Care Compare? Are they law-firm marketing pages, aggregators
   (Avvo, FindLaw), or genuine journalism? Law-firm marketing + aggregator-heavy SERPs
   are where AZ Law Now's data-first positioning wins.

3. **Existing AZ Law Now coverage**: list every URL on azlawnow.com that touches this
   cluster. Use `grep -rn "[keyword]" src/content/` and the GSC pull output. Quantify
   gaps — queries not currently addressed, intent levels under-served, spokes that
   don't link back to a pillar, four-way anchors that are incomplete.

4. **Primary source inventory**: list every primary source for this cluster. If fewer
   than five distinct authoritative sources exist (ADOT, FRA, CMS, ARS sections, AZ
   courts, AHCCCS, FMCSA), flag the cluster as low-defensibility and reconsider scope.
   The primary-source floor is non-negotiable for AZ Law Now — generic PI content with
   no Arizona-specific data backbone does not differentiate.

5. **Voice assignment**: which voice owns the cluster anchor?
   - Data backbone → Brendan investigation (always the first piece built)
   - ARS explainer → Brandon legal guide
   - Process guide → Stephanie client guide
   - Who is `reviewedBy: brandon-millam` on the investigation? (Always Brandon for any
     piece with ARS citations in the FAQ block, even on Brendan's byline.)

**Discovery gate**: produce `cluster-diagnosis.md` under
`docs/cluster-plans/<cluster-slug>/` with answers to all five. Do not proceed without
it.

---

### Phase 2 — Strategic Positioning

Goal: name the angle that makes the cluster materially different from the AZ PI SERP.

AZ Law Now's positioning: public-records-driven, ADOT/FRA/CMS-data-first,
"You Get Answers" — closer to ProPublica than billboard-attorney voice. The positioning
question per cluster:

**"What does AZ Law Now's cluster have that no competitor's coverage has?"**

Answers that qualify:
- "The only SERP result that cross-references FRA Form 6180.57 accident PDFs with
  the city's CIP project timeline to show the upgrade-to-incident gap on SR-347."
- "The only nursing-home cluster that maps AHCCCS survey deficiencies against
  staffing-hours data from CMS Care Compare for facilities in the Phoenix metro — no
  competitor has computed the per-facility staffing floor."
- "The only car-accident cluster that distinguishes the ARS 12-821.01 180-day notice
  bar for public-entity crashes from the ARS 12-542 two-year SOL, with a named
  example of a case where the notice was missed."

Answers that do not qualify:
- "Comprehensive coverage of Arizona car accident law." (Every competitor claims this.)
- "Updated with 2025 data." (Every competitor claims this.)
- "Written by a real attorney." (Every law-firm site claims this.)
- "Easy to understand." (Irrelevant to positioning.)

**Negative scope**: what will this cluster NOT cover? Keeping negative scope explicit
prevents the cluster from sprawling into thin territory. Examples:
- "This cluster does NOT cover motorcycle-specific injuries — that is a separate cluster."
- "This cluster does NOT cover federal court litigation — Brandon's guides stay in
  Arizona state law."
- "This cluster does NOT aggregate FindLaw-style state comparisons — everything is
  Arizona-specific."

**Positioning gate**: produce `cluster-positioning.md` under the same path with:
(a) the specific differentiation statement, (b) the proof/evidence AZ Law Now can
offer, (c) negative scope.

---

### Phase 3 — Engineering

Goal: ship spoke articles that execute on the positioning.

#### Article brief (required before authoring)

For each spoke, produce a brief before writing. The brief contains:

1. **Target query and intent level** (from the AZ-PI intent ladder).
2. **Voice assignment**: Brendan / Brandon / Stephanie. Each voice has its own protocol.
   - Brendan → pi-investigation skill
   - Brandon → mode-legal workflow (ARS citations required, reviewedBy:brandon-millam
     on the finished piece if co-reviewed)
   - Stephanie → mode-client workflow (second person, SOL disclosure mandatory on any
     timeline content)
3. **Three primary sources** (verified URLs before writing starts).
4. **Two differentiation anchors** from Phase 2 positioning.
5. **Four-way anchor cross-link plan** (see below — this is gated).
6. **Word count target**: Brendan investigations 800–2,000 (data-driven); Brandon legal
   guides 1,200–2,000 (ARS density requirement); Stephanie client guides 800–1,400
   (second-person, process-focused); practice-area pages 900–1,400 (CRO + legal-fact
   floor).

#### Four-way anchor cross-link gate (HARD-BLOCK before engineering)

Before writing any spoke, verify the four-way anchor is achievable for this cluster.
All four anchor positions must have a real or planned article:

| Anchor position | Role | Requirement |
|---|---|---|
| Brendan Franks investigation | Data backbone, ADOT/FRA/CMS-sourced | Must be the first spoke built in a new cluster |
| Brandon Millam legal guide | ARS explainer, bar-compliant CRO | `reviewedBy: brandon-millam` required |
| Stephanie Ramirez client guide | Process / checklist / what-to-do | Second-person, SOL+notice disclosure if timeline content |
| Practice-area page | Cluster hub, cross-links to all three voices | `cluster` enum must match cluster slug |

If the Brendan investigation does not yet exist, build it first. The data backbone
drives the other three pieces' differentiation.

Internal link minimums per spoke:
- ≥ 1 link to each of the other three anchor positions (or to a spoke in that voice)
- ≥ 1 link from the practice-area page back to the spoke
- All links must resolve (run `check:links` before commit)

#### Title construction

Format: `<specific noun phrase>: <descriptor that proves expertise or specificity>`

Examples that qualify:
- "SR-347 Corridor Crashes: What 6 Years of ADOT Data Show About the Maricopa
  Overpass Approach"
- "Arizona Wrongful Death Law: Who Can File, Two-Year Deadline, and the AZ No-Cap Rule"
- "After a Nursing Home Incident: A Step-by-Step Guide for Arizona Families (First
  30 Days)"

Examples that fail:
- "Arizona Nursing Home Abuse" (no specificity, no expertise signal)
- "Car Accident Guide" (competitor-indistinguishable)
- "What to Do After a Car Crash" (generic, no Arizona marker)

#### Programmatic city-page value gate (HARD-BLOCK)

City pages generated programmatically (any page at `/[city]/` or `/[city]/[practice-
area]/`) must pass the programmatic value gate before commit:

- Real ADOT crash data for that city or corridor, cited to the data year.
- At minimum one named intersection, corridor, or road within the city.
- At minimum one ARS section relevant to the city-specific fact pattern (public-entity
  notice if the city owns a road involved in crashes, for example).
- No boilerplate-only city pages ("Phoenix is a large city in Arizona with many car
  accidents"). That is the scaled-content-abuse pattern.
- Run `npm run check:programmatic` before committing any city-page batch.

#### reviewedBy requirement

`reviewedBy: brandon-millam` is required on:
- All legal-guides
- All practice-areas
- Any investigation MDX that includes ARS citations in the FAQ block or body

`reviewedBy` is optional on:
- Client guides (Stephanie voice, no legal conclusions)
- Investigations that are purely data-descriptive with no ARS citations

---

### Phase 4 — Verification

Goal: catch what engineering missed before shipping.

Run in this order for every spoke before committing:

1. **Four-way anchor self-check**: grep the new MDX for links to all three other
   anchor voices. If any anchor link is missing, add it before proceeding.

2. **Schema compliance** — run `npx astro check` (0 errors required).

3. **Content quality audit**:
   ```bash
   npx tsx scripts/audit-quality.ts --slug=<slug>
   ```
   No em-dashes. Contractions present. Flesch 50–60. 80%+ active voice.

4. **AI-pattern audit**:
   ```bash
   npx tsx scripts/audit-ai-patterns.ts --slug=<slug>
   ```
   Must pass with 0 issues.

5. **Claim inventory** (Brandon + investigation spokes only):
   ```bash
   npx tsx scripts/audit-claim-inventory.ts --slug=<slug>
   ```
   Every ARS citation verified against azleg.gov.

6. **Legal fact-check gate** (Brendan investigations and Brandon legal guides only):
   Run `legal-fact-check` skill. Exit 0 required.

7. **Source check**:
   ```bash
   npm run check:sources
   ```
   All `dataSources` URLs must resolve.

8. **OG image check**:
   ```bash
   npm run check:images
   ```
   Every spoke needs an OG image and hero image.

9. **Programmatic value gate** (city pages and practice-area pages):
   ```bash
   npm run check:programmatic
   ```

10. **Internal links**:
    ```bash
    npm run check:links
    ```
    Broken: 0.

11. **Cross-cluster consistency scan**: for any factual claim that appears in this
    cluster AND in existing articles (SOL years, notice-of-claim windows, ARS section
    numbers, verdict amounts), grep the full content tree and confirm every mention
    agrees. Example: if the new investigation says "180 days" for the ARS 12-821.01
    notice, every other article on the site must say the same number.

12. **Local build**:
    ```bash
    npm run build
    ```
    Must succeed with 0 errors.

**Verification gate**: any failure halts the cluster. Do not push partial. Fix the
failure, then re-run the full sequence.

---

## AZ-PI SOUL test (replaces MesoWatch 7-Q test)

Before a cluster ships, apply these seven questions to the pillar article:

1. Would this help an injured Arizonan who just searched for answers about what happened
   to them or a family member?
2. Is the Arizona-specific primary source (ADOT, ARS, FRA, CMS, azleg.gov, azcourts.gov)
   visible and verifiable — not just cited in a footnote?
3. Does the piece name the road, the intersection, the facility, the statute — or does
   it hide behind generic geography and vague law?
4. Does the investigation have an original finding, or is it a repackaging of what the
   agency's own press release already says?
5. Is the language person-first? Are injured people named, not numbered?
6. Are we citing what we know, not implying what the reader should do about it?
7. Could a quality rater or a reporter from AZ Republic check our claim against a
   primary source in 60 seconds?

If any answer is no, the cluster is not ready to ship.

---

## Output paths

```
docs/cluster-plans/<cluster-slug>/
  cluster-diagnosis.md
  cluster-positioning.md
  briefs/
    <article-slug>.md         # one brief per spoke

src/content/investigations/<slug>.mdx
src/content/legal-guides/<slug>.mdx
src/content/client-guides/<slug>.mdx
src/content/practice-areas/<slug>.mdx
```

---

## What this skill does not do

- It does not write the articles. Each voice has its own writing workflow.
- It does not generate images.
- It does not run legal-fact-check. That skill runs as a gate in Phase 4.
- It does not handle GSC gap discovery. Use `content-gap-discover` for that.
- It does not handle social distribution.
- It does not auto-generate city pages. City pages require programmatic value gate
  compliance before any new batch is committed.

The skill's only job is the planning discipline before content gets written. Do that
work, and the cluster ships with a data backbone that competitors don't have. Skip it,
and the cluster ships as yet another Phoenix PI law page.
