# Session Handoff Template

**Purpose:** every Tier-S build (and every multi-session work block) gets its own session-handoff doc. The doc is the only artifact that survives context compaction with 100% fidelity. Chat history compresses. This doc does not. Update it after every material decision, before the next tool call.

**Source doctrine:** `mesowatchorg/docs/strategy/LESSONS-LEARNED-2026-05-12-TIER-S-FIRST-RUN.md` §2.11 (context-crunch via session-summary).

---

## Where to file the doc

- Tier-S piece-specific: `docs/strategy/<slug>-build-log.md`
- Multi-piece session: `docs/strategy/SESSION-HANDOFF-<YYYY-MM-DD>.md`
- General operational session: `docs/strategy/SESSION-REPORT-<YYYY-MM-DD>.md`

---

## The template

Copy below into the new file. Fill the metadata block. Open §0 LIVE STATE empty. The session begins by reading the rest of the doc (§1+ historical) and growing §0 from the top.

```markdown
# <Piece name or session title> Build Log

**Status:** <Phase number / session phase>
**Branch:** <feature branch name>
**Started:** <YYYY-MM-DD>
**Owner:** Jared (review checkpoint) + Opus (orchestrator) + Sonnet (executor pool)
**Doctrine refs:**
- `docs/strategy/AUTONOMOUS-OPERATING-STRATEGY-AZ.md`
- `docs/strategy/TIER-QA-GATE-MATRIX.md`
- `docs/strategy/AGENT-SWARM-PROTOCOL.md`
- `docs/strategy/TIER-S-IDEATIONS-AZ.md`
- (piece-specific) `docs/design/<slug>-infographic.md`

---

## §0 LIVE STATE (prepended after every material decision)

> Rule: every material decision goes here BEFORE the next tool call.
> "Material" = a decision that would cost > 5 minutes to re-derive.

- <timestamp> — <decision>
- <timestamp> — <decision>
- <timestamp> — <decision>

---

## §1 Phase 1 — Research

**Agent:** Researcher
**Status:** <not-started | in-flight | complete | blocked>
**Inputs:**
- <ideation card from TIER-S-IDEATIONS-AZ.md>
- <list of primary source URLs targeted>

**Outputs:**
- `data/research/fact-bundles/<slug>.json`
- `data/research/<slug>-source-trace.md` (Perplexity query log)

**Audit:**
- Headline stat verbatim verification: <pass / fail>
- Fabrication-class check: <pass / fail with notes>
- Unknowns: <list>

**Handover note:**
- <one paragraph summarizing what the next phase needs to know>

---

## §2 Phase 2 — Writing

**Agent:** Investigative Writer
**Status:** <state>
**Inputs:**
- `data/research/fact-bundles/<slug>.json` ONLY

**Outputs:**
- `src/content/investigations/<slug>.mdx`

**Audit:**
- Word count: <n>
- writing-style audit: <pass / fail>
- voice + tone: <pass / fail>
- fact-trace to bundle: <pass / fail>

**Handover note:**
- <state>

---

## §2.5 Phase 2.5 — Editorial polish

**Agent:** Editorial Polish Pass
**Status:** <state>
**Inputs:**
- Writer's MDX

**Outputs:**
- Edited MDX with pull-quote density ≥ 3, selective-bold, H2 lead-ins, statgrid density, H3 anchors

**Audit:**
- Pull-quote count: <n>
- H2 lead-in coverage: <n / N>
- H3 anchor coverage: <list>

---

## §3 Phase 3 — Visual asset

**Agent (parallel):** Visual Builder + Pull-Quote Card Generator
**Status:** <state>
**Inputs:**
- fact-bundle
- design brief at `docs/design/<slug>-infographic.md`

**Outputs:**
- `public/images/infographics/<slug>/composite-1500w.png`
- `public/images/infographics/<slug>/<panel>-<platform>.png` (per-platform cuts)
- `public/images/social/<slug>-card-<N>-<platform>.png`
- `data/social/embed-snippets/<slug>-embed.html`

**Audit:**
- Cross-panel consistency: <pass / fail>
- Brand-strip on every panel: <pass / fail>
- Visual-layout audit: <exit 0 / fail with details>

---

## §4 Phase 4 — Outreach drafting

**Agent:** Outreach Orchestrator
**Status:** <state>
**Inputs:**
- press-target matrix from the ideation card
- `data/outreach/azlawnow-outreach.db` per-segment contacts
- byline-author alias

**Outputs:**
- `data/outreach/drafts/<YYYY-MM-DD>/<NN>-<outlet>-<journalist>.md` (per-pitch)
- `data/outreach/drafts/<YYYY-MM-DD>/INDEX.md` (send-order constraints)

**Audit:**
- Subject lines ≤ 50 chars: <list, pass / fail>
- 5-leg structure: <pass / fail>
- Byline reference verification: <pass / fail>

---

## §5 Phase 5 — Cascade fire

**Agent:** Social Cascade Agent
**Trigger:** Jared flips `newsEligible: true` after Phase 4 review
**Status:** <state>
**Outputs:**
- FB long-post + X thread + LinkedIn carousel + IG card + Bluesky + Reddit hold + newsletter drafts
- `data/social/<slug>-cascade-fired.json`

---

## §6 Phase 6 — Paid social (Tier-S only)

**Trigger:** first Tier-1 placement lands
**Agent:** Paid Social Briefer
**Status:** <state>
**Outputs:**
- `data/social/paid-briefs/<slug>.md`

---

## §7 Phase 7 — Engagement + embed detection (weekly)

**Status:** <weekly cadence>
**Outputs:**
- `data/outreach/secured-backlinks.json`
- `data/social/engagement-<slug>.json`

---

## QA gate ledger

Tier-S matrix from `TIER-QA-GATE-MATRIX.md`. Mark each gate at the time it passes.

| Gate | Status | Timestamp | Notes |
|---|---|---|---|
| writing-style audit | ❌ | | |
| long-paragraph (3-4 lines max) | ❌ | | |
| enumeration-to-list discipline | ❌ | | |
| semantic unit per paragraph | ❌ | | |
| chart safe-zone | ❌ | | |
| composite infographic | ❌ | | |
| cross-panel consistency | ❌ | | |
| pull-quote density (≥ 3) | ❌ | | |
| H2 + selective-bold lead-in | ❌ | | |
| multi-entity → H3 children | ❌ | | |
| comma-list (5+) → `<ul>` | ❌ | | |
| H3 anchor coverage | ❌ | | |
| pre-ship visual-layout audit | ❌ | | |
| editorial polish layer | ❌ | | |
| `newsEligible: true` flip | ❌ | | |
| cut-asset matrix exports (all platforms) | ❌ | | |
| embed-snippet HTML | ❌ | | |
| outreach matrix mapped (5-leg) | ❌ | | |
| paid social brief (after Tier-1) | ❌ | | |
| component reuse vs invented styles | ❌ | | |
| slug keyword-friendliness | ❌ | | |
| Netlify secrets-scan compliance | ❌ | | |
| FAQ-PAA coverage (≥ 70%) | ❌ | | |
| Researcher → Writer two-phase | ❌ | | |
| Every claim → Perplexity-cited source | ❌ | | |

---

## Open decisions for Jared

1. <decision needed>
2. <decision needed>

---

## Lessons captured this session (post-mortem after merge)

- <lesson>: <protocol upgrade>
- <lesson>: <protocol upgrade>

---

*End of template. Replace placeholders. Update §0 every material decision.*
```

---

## The discipline rule

Update §0 LIVE STATE **before the next tool call** after every material decision. The §0 block grows downward (newest decision at top). Phases §1+ stay stable and serve as the on-disk record of what's done.

The §0 block is the single most important artifact for session-to-session continuity. The chat compactor cannot preserve all of it. The handoff doc can.

If a session ends mid-phase, the next session opens by:
1. Reading the handoff doc top-to-bottom
2. Reading the §0 LIVE STATE block fully
3. Reading the most recent agent output file
4. Running `git status` and `git log -10 --oneline` to confirm working-tree state matches the doc

Only then does the next session execute.

---

*End of doc.*
