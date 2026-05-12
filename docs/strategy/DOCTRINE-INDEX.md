# AZ Law Now Doctrine Index

**Compiled:** 2026-05-12
**Audience:** every Opus or Sonnet session that touches AZ Law Now content, outreach, or infrastructure.

Read this file first when opening a new session. The Fractl synthesis, autonomous strategy, tier matrix, agent swarm protocol, ideations, and session-handoff template form a single doctrine stack. Any session that fires a Tier-S build or runs the outreach pipeline reads every doc below.

---

## The five core docs

| Doc | Purpose | When to load |
|---|---|---|
| `AUTONOMOUS-OPERATING-STRATEGY-AZ.md` | The operating playbook: 4-tier classification, per-tier cascade, infographic specs, build queue, fire-order | Every session, before any agent dispatch |
| `TIER-QA-GATE-MATRIX.md` | Acceptance thresholds for every quality gate at every tier | Before audit + before publish |
| `AGENT-SWARM-PROTOCOL.md` | How Opus orchestrates 10 specialist agents through a Tier-S build | Before dispatching any agent |
| `TIER-S-IDEATIONS-AZ.md` | 10 candidate Tier-S investigations with bomb stats, structural findings, press matrix, panel structure | When picking the next Tier-S piece |
| `SESSION-HANDOFF-TEMPLATE.md` | The handoff-doc template + §0 LIVE STATE pattern that prevents context-crunch | When opening a new piece-build session |

## The four skill packages (in `.claude/skills/`)

| Skill | Purpose |
|---|---|
| `data-journalism-study-az` | Two-phase Researcher → Writer pipeline. Produces fact-bundle JSON + MDX pillar following the Fractl narrative arc. |
| `viral-infographic-az` | Composite long-scroll for AZ Tier-S, Sunset Editorial palette, brand-strip composition, embed snippet generation. |
| `earned-media-outreach-az` | LedeTime per-journalist personalization. Site-scrape + Voyage AI corpus centroid + Claude Sonnet 4.6 pitch hook. |
| `pillar-architect-az` | Plan multi-article clusters (pillar + spokes). 4-phase gated protocol: Discovery, Positioning, Engineering, Verification. |

## The five non-negotiables

1. **Researcher → Writer two-phase separation.** Writer never reads the source documents; only the fact-bundle JSON. Prevents fabrication.
2. **Update `§0 LIVE STATE` after every material decision, before the next tool call.** The handoff doc is the only artifact that survives context compaction.
3. **Branch hygiene.** Every Tier-S build on its own `tier-s-<slug>` branch. Doctrine work on a doctrine branch. Never push directly to main.
4. **Editorial sender per piece.** Every outreach pitch fires from the byline-author's `@azlawnow.com` alias. Pre-send delivery verification required.
5. **Jared reviews before send.** Three checkpoints per Tier-S piece: pre-cascade, pre-outreach, pre-paid. Never autonomous sends.

## Source doctrine (parent docs in MesoWatch)

The AZ doctrine ports + adapts from MesoWatch's working playbook. For the original sources:

- `mesowatchorg/docs/strategy/AUTONOMOUS-OPERATING-STRATEGY-2026-05-11.md` (operating strategy parent)
- `mesowatchorg/docs/strategy/FRACTL-SYNTHESIS-2026-05-11.md` (Fractl synthesis parent)
- `mesowatchorg/docs/strategy/FRACTL-MECHANICS-EXAMPLES.md` (mechanics parent)
- `mesowatchorg/docs/strategy/LESSONS-LEARNED-2026-05-12-TIER-S-FIRST-RUN.md` (post-mortem + protocol upgrades from the first end-to-end Tier-S run)
- `mesowatchorg/.claude/skills/viral-infographic/SKILL.md` (skill parent)
- `mesowatchorg/.claude/skills/data-journalism-study/SKILL.md` (skill parent)
- `mesowatchorg/.claude/skills/earned-media-outreach/SKILL.md` (skill parent)
- `mesowatchorg/.claude/skills/pillar-architect/SKILL.md` (skill parent)

## The next session opens by

1. Reading this index
2. Reading `AUTONOMOUS-OPERATING-STRATEGY-AZ.md` top-to-bottom
3. Reading `TIER-QA-GATE-MATRIX.md` and `AGENT-SWARM-PROTOCOL.md`
4. Reading `TIER-S-IDEATIONS-AZ.md` and picking the next piece
5. Creating the `tier-s-<slug>` branch
6. Creating `docs/strategy/<slug>-build-log.md` from `SESSION-HANDOFF-TEMPLATE.md`
7. Dispatching the Researcher

That's the cold-start. Every subsequent session re-reads the piece-specific build log first, then this index, then resumes from the §0 LIVE STATE block.

---

*End of index. Update when a new doc joins the doctrine stack.*
