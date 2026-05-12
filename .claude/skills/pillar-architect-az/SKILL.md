---
name: pillar-architect-az
description: Plan and ship a content cluster (pillar + spokes) for AZ Law Now using a structured Discovery to Positioning to Engineering to Verification protocol. Use before starting any multi-article cluster expansion (e.g., "build out the elder-care cluster," "expand school-restraint spokes," "deepen the corridor-crash cluster," "add 8 new ARS statute explainers"). Triggers when a request involves planning >2 articles in a related cluster, when ranking recovery requires topical authority depth, or when an existing cluster looks thin against competitor coverage.
---

# pillar-architect-az

## When to invoke

For a cluster of related articles, not a single article. Single articles use `data-journalism-study-az` or a writing-mode command. This skill is for the strategic shape: what cluster, why this cluster, how does it differentiate, what shape do the spokes take, what verifies it shipped at quality.

The skill is gated. Do not skip a phase. Each phase has a verification gate before proceeding.

## The 4-Phase Protocol

### Phase 1 — Cluster Discovery

Goal: ground-truth the territory before deciding angle.

Run these queries. Use Perplexity (not Claude memory, not WebFetch). Each answer is data; do not synthesize.

1. **Query universe**: list the top 25 commercial and informational queries in this cluster. Group by intent ladder. Record search volume via DataForSEO.
2. **Competitor depth**: who currently ranks top 3 for the head queries? How many spoke articles do they have on this cluster? What's their citation density? Are they AZ law-firm marketing, aggregators, or genuine journalism?
3. **Existing AZ Law Now coverage**: list every URL on azlawnow.com that touches this cluster. Quantify gaps — queries we don't currently address, intent levels we under-serve, spokes that don't link back to a pillar.
4. **Primary source inventory**: list every authoritative primary source for this cluster (ADOT, AzDE, ACC, ICA, MCSO, Maricopa County DPH, AZ AG, AZ Auditor General, AzDHS, courts, OSHA, NHTSA, etc.). If primary-source list is thin (< 5 authoritative sources), flag the cluster as low-defensibility.
5. **Authority alignment**: which AZ Law Now author profiled in `/about/` has direct expertise (or strongest topical match) for this cluster? Maps to the `reviewedBy` we'll use in `legalReviewer` schema.

**Discovery gate**: produce `data/cluster-plans/<cluster-slug>/diagnosis.md` containing answers to all five. Do not proceed without it.

### Phase 2 — Strategic Positioning

Goal: name the angle that makes our cluster materially different from the SERP.

The positioning question: **"What does AZ Law Now coverage of this cluster have that no competitor coverage has?"**

Examples that would qualify:
- "Per-district school-restraint data with parent-company crosswalk for AZ daycare chains, cross-referenced against the 19-families Coolidge lawsuit docket, with substantiated-violation rates per chain."
- "Three-orders concentration finding on AZ utility heat-disconnect rules, cross-state comparison, plus the Korman litigation trace."
- "Named-arterial corridor data with stroad-anatomy diagrams, mapped to per-corridor fatality rates and the named city RSAP investment status."

The angle must be:
1. Anchored in **structured-table data** that no competitor has assembled
2. Differentiated from **AZ law-firm marketing** (we are independent journalism, not lead-gen)
3. Connected to a **named entity** (regulator, agency, defendant, statute)
4. **Verifiable** via primary sources Jared can hand to a journalist on request

**Positioning gate**: produce `data/cluster-plans/<cluster-slug>/positioning.md` with the angle + 3 alternative angles considered + rationale.

### Phase 3 — Cluster Engineering

Goal: spec the pillar + spokes.

1. **Pillar piece** (Tier-S candidate): bomb stat, 3 findings, methodology paragraph, closing thesis. Composite long-scroll infographic. 5-leg outreach matrix.
2. **Spokes** (Tier-A or Tier-B):
   - Each spoke addresses one finding from the pillar in depth
   - Each spoke internal-links back to the pillar
   - Each spoke links to 2-3 sister spokes
   - Each spoke targets a specific intent (informational, comparison, action)
3. **Statute / reference pages** (Tier-B):
   - ARS reference profiles for any statute named in the cluster
   - Each statute page links to spokes that cite it
4. **Practice area integration**:
   - Update relevant `/abuse-negligence/`, `/vehicle-crashes/`, `/other-claims/` pages to link to the new pillar
   - Hub-and-spoke topology: pillar at center, spokes around, practice areas linking in
5. **City + region pages**:
   - For corridor or geography-specific pillars, update `/about/` regional pages or city-specific landing pages to surface the pillar

**Engineering gate**: produce `data/cluster-plans/<cluster-slug>/spec.md` with:
- Pillar specification (bomb stat, findings, methodology, target slug)
- Spoke list (slug, title, finding-covered, target word count)
- Statute reference list
- Practice area updates needed
- City / region page updates needed
- Total link count (internal density target: ~1 link per 130-150 words)

### Phase 4 — Verification

Goal: confirm the cluster ships at quality.

1. Run `npm run build` after every spoke commits. Schema validation, broken-link check, build success.
2. Run `npm run audit:style` after every spoke. 0 violations.
3. **Authority audit**: every spoke + pillar has the right `author:` + `reviewedBy:` for the cluster's topical expertise.
4. **Internal link audit**: pillar has links from every spoke; every spoke has links to pillar + 2-3 sisters; practice area pages have one link to pillar.
5. **Tier-S gate audit** (if pillar is Tier-S): every row in `TIER-QA-GATE-MATRIX.md` Tier-S column passes.

**Verification gate**: produce `data/cluster-plans/<cluster-slug>/verification.md` with audit results.

## Hard rules (NO SLOP)

- 4 phases, gated. Do not skip.
- Phase 1 Discovery uses Perplexity for ground truth, NOT Claude memory
- Phase 2 Positioning names the differentiator in one sentence
- Phase 3 Engineering specs every spoke before the first one is written
- Phase 4 Verification audits before declaring the cluster shipped
- No em-dashes anywhere
- No "expert" or "specialist" for attorneys
- Stay on the feature branch
- Update `docs/strategy/<slug>-build-log.md` §0 LIVE STATE after every material decision

## Verification: did the skill work?

- `data/cluster-plans/<cluster-slug>/diagnosis.md` exists
- `data/cluster-plans/<cluster-slug>/positioning.md` exists with 1 chosen angle + 3 alternatives
- `data/cluster-plans/<cluster-slug>/spec.md` lists pillar + every spoke + every statute reference
- `data/cluster-plans/<cluster-slug>/verification.md` audits show all gates pass
- The pillar + spokes build clean
- Every spoke links back to pillar + sisters

When all six are true, the skill ran clean.
