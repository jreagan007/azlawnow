# AZ Law Now Tier QA Gate Matrix

**Compiled:** 2026-05-12
**Source:** ported from `mesowatchorg/docs/strategy/LESSONS-LEARNED-2026-05-12-TIER-S-FIRST-RUN.md` §4.2.
**Purpose:** define the acceptance thresholds for every quality gate at every tier. A Tier-S piece does not ship until every Tier-S row passes. A Tier-A piece passes a relaxed bar. Tier-B and Tier-C have correspondingly lower gates.

---

## The matrix

| Quality gate | Tier S | Tier A | Tier B | Tier C |
|---|---|---|---|---|
| Writing-style audit (`npm run audit:style`) | 0 violations required | 0 violations required | 0 violations required | 0 violations required |
| Long-paragraph audit (max lines per paragraph at typical mobile viewport) | HARD-BLOCK on > 3-4 lines | HARD-BLOCK on > 5 lines | Warning only | Skip |
| Enumeration to list discipline (5+ comma-list items become a `<ul>`) | HARD-BLOCK | Recommended | Optional | Wire-style OK to keep inline |
| Semantic unit per paragraph (one finding / one quote / one cluster per paragraph) | HARD-BLOCK | Recommended | Optional | Wire-style flexible |
| Chart safe-zone audit (no element overflows `inv-content`) | HARD-BLOCK | Warning only | Skip | Skip |
| Composite-infographic asset (Figma-canonical) | Required | Optional | None | None |
| Cross-panel consistency (numbers used across multiple panels share one fact-bundle value) | Required | N/A | N/A | N/A |
| Pull-quote density | At least 3 `<Quote>` blocks if source data has them | At least 1 if available | Optional | None |
| H2 + selective-bold lead-in (every H2 opens with `**bold spine sentence**`) | HARD-BLOCK | Recommended | Optional | None |
| Multi-entity enumeration becomes H3 children | HARD-BLOCK at 3+ entities | Optional at 5+ | None | None |
| Comma-enumeration of 5+ proper nouns becomes `<ul>` block | HARD-BLOCK | WARN | Optional | None |
| H3 anchor coverage (every named cluster has its own H3 `#anchor`) | Required | Optional | None | None |
| Pre-ship visual-layout audit (`scripts/audit-tier-s-visual-layout.ts`) | Exit 0 required | Recommended | Optional | None |
| Editorial-polish layer (pull-quotes, selective-bold, H2 lead-ins, statgrid density) | Required | Recommended | Optional | None |
| News-XML opt-in (`newsEligible: true`) | Required after QA passes | Optional | No | Auto (type:news) |
| Cut-asset matrix exports (all 6+ platform formats) | Required | None | None | None |
| Embed-snippet HTML generated | Required | Optional | None | None |
| Outreach matrix mapped (5-leg pitch per journalist) | Required | Required (2-leg pitch) | Tip-line only | Auto-cascade |
| Paid social brief (after first Tier-1 placement lands) | Required | Skip | Skip | Skip |
| Component reuse vs invented styles (no inline `<div class="..."` or `<div style="..."`; every class resolves in `mdx-components.css`) | HARD-BLOCK | WARN | Optional | None |
| Slug keyword-friendliness (no `-pillar` suffix; leads with high-intent search term + product/topic + action verb) | HARD-BLOCK before outreach fires | Recommended | Optional | None |
| Netlify secrets-scan compliance (public IDs covered by `SECRETS_SCAN_OMIT_KEYS`; legitimate audit/queue files in `SECRETS_SCAN_OMIT_PATHS`) | Required | Required | Required | Required |
| FAQ-PAA coverage (`npm run research:faq-paa`) | ≥ 70% PAA coverage | ≥ 40% | ≥ 20% | Skip |
| Fact-bundle two-phase pattern (Researcher JSON, then Writer-only-reads-JSON) | Required | Required | Optional | Skip |
| Sources every claim (Perplexity-cited primary source URL) | Required | Required | Required | Required |
| Description ≤ 160 chars | Required | Required | Required | Required |
| Subject lines on outreach ≤ 50 chars | Required | Required | N/A | N/A |
| No em-dashes anywhere in body + frontmatter + outreach | Required | Required | Required | Required |
| No "expert" / "specialist" referring to attorneys | Required | Required | Required | Required |

---

## How to read the matrix

- **HARD-BLOCK** = ship gate. If the row fails, the piece does not ship. Fix and re-audit before retry.
- **WARN** = surfaces in the audit output, ship decision is Jared's, but it should be a deliberate exception not a passive ignore.
- **Recommended** = encouraged, not blocking. Skip with reason noted.
- **Optional** = nice-to-have.
- **Skip** = the gate does not apply at this tier.
- **N/A** = the gate is structurally inapplicable (e.g., cross-panel consistency on a single-chart Tier-A piece).

---

## Pre-ship audit sequence (Tier S)

Run in order. Stop at first hard-block failure. Fix. Re-run from the failing gate.

1. `npm run audit:style` (no violations)
2. `npm run audit:tier-s-visual-layout` (TODO: build, see `AUTONOMOUS-OPERATING-STRATEGY-AZ.md` build queue)
3. `npm run research:faq-paa -- --slug=<slug>` (≥ 70% PAA coverage for Tier S)
4. `npm run build` (clean exit, all 208+ pages render)
5. Visual spot-check on rendered HTML at 1200px, 800px, 600px viewport widths
6. Cross-panel consistency manual review
7. Outreach matrix mapping in `data/outreach/<slug>-pitches.md`
8. `newsEligible: true` flip (only after 1-7 pass)
9. Commit + push + Netlify deploy
10. Live URL spot-check on production after deploy

---

## When to relax a gate

Never on Tier-S. The matrix is a ratchet. If a gate fails on Tier-S, the piece either ships as Tier-A (relax the gate, but downgrade the cascade) or doesn't ship.

For Tier A and below, Jared can WARN-with-reason on any row. Document the reason in the commit message.

---

## Tier reclassification rules

A piece can be reclassified after publish based on engagement signals or new data.

- **Tier-A → Tier-S promotion:** allowed when (a) a Tier-1 outlet covers the piece, (b) engagement on FB or X exceeds 10x the AZ baseline, OR (c) a new fact emerges that adds the consumer-safety angle. Trigger: build the composite, fire the cascade, run the missing QA gates, then flip.
- **Tier-S → Tier-A demotion:** allowed when the data thins out post-publish or the outreach pass fails. No paid spend goes live until the demotion check completes.
- **Tier-C → Tier-A promotion:** allowed when a wire piece accrues 5x the typical Tier-C traffic in week 1. Re-classify, re-write to Tier-A bar, re-fire the cascade.

---

*End of doc.*
