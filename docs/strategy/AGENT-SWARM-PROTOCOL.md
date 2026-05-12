# AZ Law Now Agent Swarm Protocol

**Compiled:** 2026-05-12
**Source doctrine:** ported from `mesowatchorg/docs/strategy/SESSION-HANDOFF-2026-05-11-NIGHT.md` and adapted for AZ's editorial team + branch hygiene.
**Purpose:** how Opus orchestrates the agent swarm to build a Tier-S piece end-to-end without losing context across handovers.

---

## 1. The orchestration model

**Opus is the orchestrator.** Decisions, quality gate, voice audit, strategic sequence. Never executes long-running operations. Always coordinates.

**Sonnet specialists are the executors.** Each runs in a worktree-isolated background task, owns one phase, reports back through the structured handover doc, never touches another agent's files mid-flight.

**The handover doc is the only context that survives.** Every material decision lives in `docs/strategy/SESSION-HANDOFF-<YYYY-MM-DD>.md` or `docs/strategy/<slug>-build-log.md` (Tier-S piece-specific). Chat history compacts; the doc does not.

---

## 2. The roster (10 agents)

| Agent | Phase | Owns | Reads from | Writes to | Tools |
|---|---|---|---|---|---|
| **Researcher** | Phase 1 | Mass site-scrape + Perplexity harvest of AZ data | source list, fact-check discipline doc | `data/research/fact-bundles/<slug>.json` | site scrape API, Perplexity sonar-pro, Bash for sqlite cross-ref |
| **Investigative Writer** | Phase 2 | MDX draft of pillar + spokes | fact-bundle JSON ONLY | `src/content/investigations/<slug>.mdx` | Read, Edit, Write |
| **Editorial Polish Pass** | Phase 2.5 | Pull-quotes, selective-bold, H2 lead-ins, statgrid density, H3 anchors | published MDX from Writer | edits to same MDX | Read, Edit |
| **Visual Builder** | Phase 3 | Composite long-scroll Figma build + cut-asset exports | fact-bundle + design brief | `public/images/infographics/<slug>/*` | Figma MCP, Bash for sharp |
| **Pull-Quote Card Generator** | Phase 3 (parallel) | 3-5 social cards × 7 platforms | fact-bundle + voice guide | `public/images/social/<slug>-card-<N>-<platform>.png` | Bash, sharp |
| **Outreach Orchestrator** | Phase 4 | Pitch drafts from byline alias, 5-leg structure, ≤50 char subject | matrix doc + JOURNALIST-SOCIAL-HANDLES + composite URL | `data/outreach/drafts/<YYYY-MM-DD>/` | Read, Edit, Write, site-scrape for fresh byline verification |
| **Social Cascade Agent** | Phase 5 | Reads `viralTier` from frontmatter, fires per-tier cascade | published MDX + cascade matrix | `data/social/<slug>-cascade-fired.json` | Bash + Graph API, X API, LinkedIn API |
| **Paid Social Briefer** | Phase 6 (Tier-S only) | After first Tier-1 placement, generates FB/LinkedIn ad copy + targeting + budget | composite URL + matrix doc | `data/social/paid-briefs/<slug>.md` | Read, Write |
| **Embed Detection Scraper** | Phase 7 (weekly) | Find third-party sites that embedded the composite | composite URL + outreach list | `data/outreach/secured-backlinks.json` | site-scrape, WebSearch |
| **QA Gate Auditor** | Cross-phase | Runs every gate in `TIER-QA-GATE-MATRIX.md` | the piece + matrix | audit report inline | Bash for all npm scripts, Read |

---

## 3. The fire-order (Tier-S example)

Each phase has an explicit input artifact, output artifact, and Opus checkpoint.

### Phase 0 — Initiation
**Trigger:** Jared picks an ideation from `TIER-S-IDEATIONS-AZ.md` and says "build it."
**Opus does:**
1. Create the feature branch: `git checkout -b tier-s-<slug>`
2. Open `docs/strategy/<slug>-build-log.md` with the §0 LIVE STATE block at top
3. Update todos
4. Dispatch Researcher (Phase 1)

### Phase 1 — Research
**Agent:** Researcher
**Input:** the ideation card + `docs/FACT-CHECK-DISCIPLINE.md` (TODO port)
**Output:** `data/research/fact-bundles/<slug>.json` with:
- `headline_stat` (verbatim, one number, one sentence)
- `findings[]` (2-3 structural findings)
- `entities[]` (named regulators, agencies, manufacturers, defendants)
- `sources[]` (every claim traced to a Perplexity-cited primary source URL)
- `quotes[]` (per `LESSONS-LEARNED-2026-05-12-TIER-S-FIRST-RUN.md` §4.2b schema, with `lift_priority: 1 | 2`)
- `paa_queries[]` (FAQ-PAA harvest per §4.2c, 5-7 SERP-intent keywords)
- `unknowns[]` (anything stakeholder remembers but the source doesn't confirm)
**Opus checkpoint:** read the fact-bundle, audit for fabrication classes, decide if writer can proceed.
**Handover update:** append "Phase 1 complete. Fact-bundle at `<path>`. Headline stat: `<verbatim>`. Stuck on: `<unknowns[]>`."

### Phase 2 — Writing
**Agent:** Investigative Writer
**Input:** fact-bundle JSON ONLY. Writer is forbidden from adding any named person, dollar amount, year, court, agency, statute, or stat not in the JSON.
**Output:** `src/content/investigations/<slug>.mdx` with:
- Frontmatter: `viralTier: S`, `viralRationale`, `newsEligible: false` (flip later), `methodology`, `embeddableCharts[]`, `relatedInvestigations[]`, `reviewedBy`, `status: published`
- Body: headline stat in first sentence, methodology paragraph, 2-3 findings each with H2 + selective-bold lead-in, multi-entity sections use H3 children
- 3-5 `<Quote>` blocks from `fact_bundle.quotes[]`
- At least one `<StatGrid>` or `<KeyFacts>` per major section
- Closing thesis, no body CTA
**Opus checkpoint:** voice audit, fact-trace audit (every claim → fact-bundle field), TIER-QA-GATE-MATRIX hard-blocks for Tier-S.
**Handover update:** append "Phase 2 complete. MDX at `<path>`. Word count: `<n>`. Audit status: `<pass/fail with rows>`."

### Phase 2.5 — Editorial polish
**Agent:** Editorial Polish Pass
**Input:** the Writer's MDX
**Output:** edited MDX with pull-quote density ≥ 3, selective-bold on lead-noun phrases, H2 + bold lead-ins, statgrid density, H3 anchors on every multi-entity section, comma-enumerations of 5+ items as `<ul>`.
**Opus checkpoint:** re-run audit. Visual-layout audit on rendered HTML.

### Phase 3 — Visual asset build
**Agents (parallel):**
- Visual Builder (composite long-scroll in Figma)
- Pull-Quote Card Generator (3-5 cards × 7 platforms)
**Inputs:** fact-bundle + design brief at `docs/design/<slug>-infographic.md` + Sunset Editorial palette
**Outputs:**
- `public/images/infographics/<slug>/composite-1500w.png` (canonical)
- `public/images/infographics/<slug>/<panel>-<platform>-<dimensions>.png` (per-platform cuts)
- `public/images/social/<slug>-card-<N>-<platform>.png` (pull-quote cards)
- `data/social/embed-snippets/<slug>-embed.html`
**Opus checkpoint:** visual critique on every panel, brand-strip verification, cross-panel consistency (numbers used across panels share one fact-bundle value).
**Handover update:** "Phase 3 complete. Composite at `<path>`. Embed snippet ready."

### Phase 4 — Outreach drafting
**Agent:** Outreach Orchestrator
**Input:** matrix doc (AZ journalists) + `JOURNALIST-SOCIAL-HANDLES-AZ.md` (TODO build) + composite URL + byline-author alias
**Output:** `data/outreach/drafts/<YYYY-MM-DD>/<NN>-<outlet>-<journalist>.md` with:
- Subject line ≤ 50 chars (stat-lede pattern)
- Opening sentence = byline reference + news peg
- Second sentence = headline stat
- 2-3 sentence stake
- One paragraph methodology
- Offering paragraph (dataset + methodology snapshot + walkthrough)
- Soft ask (not a CTA)
- Sender = byline-author alias
- Anchor-text-discipline line: "link to whatever page is most useful for your readers"
**Opus checkpoint:** Jared reviews each draft in chat. No autonomous sends.
**Handover update:** "Phase 4 complete. <N> pitches staged. Awaiting Jared approval per draft."

### Phase 5 — Cascade fire
**Agent:** Social Cascade Agent
**Trigger:** Jared flips `newsEligible: true` after Phase 4 review passes
**Output:** FB long-post, X thread, LinkedIn carousel, IG card + Story, Bluesky, Reddit hold, newsletter pitches drafted
**Opus checkpoint:** read `data/social/<slug>-cascade-fired.json` and confirm every surface fired.

### Phase 6 — Paid social (Tier-S only)
**Trigger:** first Tier-1 placement lands. NEVER before.
**Agent:** Paid Social Briefer
**Output:** `data/social/paid-briefs/<slug>.md` with FB / LinkedIn / X ad copy + targeting + budget
**Opus checkpoint:** Jared approves before any spend.

### Phase 7 — Engagement + embed detection (weekly)
**Agents:**
- Embed Detection Scraper (weekly site-scrape + Google search for composite URL)
- Engagement tracker (FB Insights + X Analytics)
**Output:** `data/outreach/secured-backlinks.json`, `data/social/engagement-<slug>.json`

---

## 4. Handover discipline (the rule that prevents context-crunch)

**The rule:** every material decision goes into the handover doc BEFORE the next tool call. "Material" = a decision that would cost > 5 minutes to re-derive.

Material decisions include:
- Style locks (palette, typography, palette deviations)
- File-path commitments (where the fact-bundle lives, where the composite renders)
- Deprecated rules (drop-shadow rule, em-dash, "expert" word)
- Refactors in-flight (renamed file, renamed schema field)
- Outreach send orders (which pitch fires Day 1 vs Day 2)
- Audit exceptions (WARN-with-reason on a Tier-A piece, document the reason)
- Empirical findings (fact-bundle didn't confirm a stakeholder-remembered number, document `found_X_reference: false` with the search trace)

**The structure of the handover doc:**

```markdown
# Tier-S Build Log — <slug>

**Status:** <Phase N>
**Branch:** tier-s-<slug>
**Started:** <date>

## §0 LIVE STATE (current session decisions, prepended after every material call)

- 2026-05-12 14:35 — locked composite font to Cormorant Garamond bold for hero, DM Sans semi-bold body. Burnt Sienna left rail accent on every panel.
- 2026-05-12 14:42 — fact-bundle pivoted: ADOT 2024 confirmed 263 pedestrian deaths but the 76% darkness figure is from 2024 ADOT crash facts table 14, not the GHSA report. Updated `headline_stat` source.
- 2026-05-12 15:08 — Writer agent surfaced 4 long-paragraph warnings on Finding 2. Tier-S HARD-BLOCK. Editorial Polish Pass dispatched to split.

## §1 Phase 1 complete (Researcher)

- Fact-bundle at `data/research/fact-bundles/<slug>.json`
- Headline stat: "<verbatim>"
- 2-3 findings: ...
- Sources: <N> primary citations, all Perplexity-traced
- Unknowns: <list>

## §2 Phase 2 complete (Writer)

...

## §3 Phase 3 in-flight (Visual Builder + Pull-Quote Card Generator)

...

## Audit gate status

- writing-style: pass
- visual-layout: TBD (Phase 3 not done)
- FAQ-PAA coverage: 78% (pass)
- ...

## Open decisions for Jared

1. ...
```

**§0 grows downward, prepended each session.** Phases 1-N stay stable.

---

## 5. Branch hygiene

- Each Tier-S piece on its own branch: `tier-s-<slug>`
- Every commit ends with the trailer `Build-log: docs/strategy/<slug>-build-log.md`
- The branch merges to `main` only after the matrix gates pass and Jared approves
- Tag the merge commit with `tier-s-<slug>-v1` for easy rollback
- Subsequent v2 / v3 builds go on `tier-s-<slug>-v2` etc.

---

## 6. Parallel vs serial dispatch

**Serial dependencies:**
- Researcher → Writer (Writer needs the fact-bundle)
- Writer → Editorial Polish Pass (Polish edits the Writer's MDX)
- Writer → Visual Builder (Visual Builder needs the headline stat verbatim from the published MDX)
- Visual Builder → Outreach Orchestrator (Outreach needs the composite URL for Leg 3)

**Parallelizable:**
- Visual Builder + Pull-Quote Card Generator (both read the fact-bundle, write to different paths)
- Outreach Orchestrator + QA Gate Auditor (after Writer + Visual Builder)
- Social Cascade Agent + Newsletter pitch drafter (after Outreach Orchestrator)

**Rule:** spawn parallel agents in a single tool-call block when work is non-overlapping. Background-mode (`run_in_background: true`) when wall-clock matters.

---

## 7. Failure modes + recovery

| Failure | Recovery |
|---|---|
| Agent stalls (no progress 600s) | Read the agent's output file head, decide whether to continue manually or re-dispatch. Update §0 LIVE STATE with the stall + recovery decision. |
| Agent fabricates (introduces a claim not in fact-bundle) | Hard-block the commit. Open a `feedback_<agent>-fabrication-<date>.md` memory file. Re-write with stricter prompt + writer-reads-only-JSON enforcement. |
| Build breaks on push | Check `npm run build` output. Most likely cause: schema validation on new frontmatter field. Defensive `(entry.data as any).field` reads required when adding fields ahead of schema. |
| Push blocked by hook | Likely direct-to-main attempt. Check branch. Switch to feature branch. |
| Push fails with 408 timeout | Retry. The push usually succeeded on the first try; retry is idempotent. Verify with `git ls-remote`. |
| Schema validation fails post-merge | The defensive `as any` casts mean the build won't break, but the schema fields won't validate. Add to the next schema update commit. |
| Visual asset doesn't render embed | Check the embed snippet HTML, UTM, composite path on production. Embed-detection scraper catches this. |
| Outreach reply requires revision | Jared pastes reply + note into chat. Opus revises the pitch, restages in the same drafts dir. |

---

## 8. The hard rules (per-agent prompt header)

Every agent prompt MUST include this header verbatim:

> **Hard rules (NO SLOP):**
> - Person-first language in body copy
> - No em-dashes anywhere. Periods, commas, colons, parens only.
> - No "expert" or "specialist" for attorneys (AZ Bar advertising rule equivalents apply)
> - % symbol, not "percent"
> - Oxford comma always
> - No "shocking" / "alarming" / "staggering" before stats. The stat does the work.
> - No transactional CTA in body. Closing thesis only.
> - No future-dated `publishedAt`
> - Every factual claim sources to a Perplexity-cited primary source URL. No claims from training data.
> - Description ≤ 160 chars (schema validation)
> - Subject lines ≤ 50 chars (Fractl doctrine)
> - No defensive framing ("we're not a law firm"). Say what we ARE.
> - No internal-strategy comments in client-shipped code. Sweep before commit.
> - Stay on the feature branch. Never push to main.
> - Update `docs/strategy/<slug>-build-log.md` §0 LIVE STATE block after every material decision, before the next tool call.

---

## 9. Doctrine docs to load first (read before any swarm fires)

1. `docs/strategy/AUTONOMOUS-OPERATING-STRATEGY-AZ.md` (operating playbook)
2. `docs/strategy/TIER-QA-GATE-MATRIX.md` (acceptance thresholds)
3. `docs/strategy/AGENT-SWARM-PROTOCOL.md` (this doc)
4. `docs/strategy/TIER-S-IDEATIONS-AZ.md` (candidate Tier-S targets)
5. `docs/strategy/SESSION-HANDOFF-TEMPLATE.md` (handover-doc template)
6. The piece-specific `docs/strategy/<slug>-build-log.md` (current state)

---

*End of doc. Update when the swarm gets a new role or the protocol shifts.*
