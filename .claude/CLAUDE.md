# AZ Law Now — Project Instructions

> **All universal Taqtics infrastructure lives in `taqticscom`.** This file holds only
> AZ Law Now-specific configuration, voice system, QA chain, commands, and constraints.
> When a rule here conflicts with the hub, this file wins for this project.

## Hub-and-Spoke Relationship

| Capability | Where it lives | How it runs |
|---|---|---|
| Schema check | taqticscom | `npx tsx ../taqticscom/scripts/check-schema.ts` |
| SERP evaluation | taqticscom | `npx tsx ../taqticscom/scripts/serp-eval.ts --client=azlawnow` |
| Meta audit | taqticscom | `npx tsx ../taqticscom/scripts/audit-meta.ts --suffix '| AZ Law Now'` |
| GSC pull | taqticscom | `npx tsx ../taqticscom/scripts/gsc-pull.ts --client=azlawnow` |
| Trend scanner | taqticscom | `npx tsx ../taqticscom/scripts/trend-scanner.ts --client=azlawnow` |
| QA orchestrator | az-law-now | `npm run qa` / `npm run qa:strict` |
| Content audits | az-law-now | `scripts/audit-quality.ts`, `scripts/audit-ai-patterns.ts`, `scripts/audit-claim-inventory.ts` |
| Image generation | az-law-now | `scripts/regen-single-card.ts`, `scripts/generate-og-image.ts` |
| OG guardrail | az-law-now | `scripts/og-guardrail.ts` |

Hub outputs land in `docs/trend-briefs/` and `docs/gsc-reports/`.
Scout briefs land in `docs/briefs/`.

## Three-Voice Editorial System

AZ Law Now publishes through three named voices. Every piece of content belongs to exactly
one voice. Routing is set at the draft stage, not the discovery stage.

| Voice | Person | Collection | URL root | POV | Beat |
|---|---|---|---|---|---|
| Brendan Franks | Editor-in-Chief | investigations | /insights/ | First person | ADOT/FRA/AHCCCS/ADE data, ARS 39-121 records, infrastructure accountability |
| Brandon Millam J.D. | Legal Editor | legal-guides + practice-areas | /legal-guides/ + /[pa]/ | Third person | ARS explainers, AZ case law, comparative fault, SOL/notice mechanics, wrongful death |
| Stephanie Ramirez | Client Resources | client-guides | /client-guides/ | Second person | Post-crash process, insurance checklists, what-to-do timelines, crisis FAQs |

**Voice routing by content type:**
- Public records data, corridor crash study, agency enforcement → **Brendan**
- ARS section explainer, court opinion analysis, practice-area hub → **Brandon**
- What-to-do guide, insurance checklist, first-48-hours timeline → **Stephanie**

When a topic could fit multiple voices, produce one piece per relevant voice with
cross-links — do not blend voices in a single piece.

## Collections and Word Count Floors

| Collection | Path | Min words | Key gate fields |
|---|---|---|---|
| investigations | `src/content/investigations/` | 400 | `dataSources ≥ 3`, `keyTakeaway` multi-para, `faqs ≥ 5` |
| legal-guides | `src/content/legal-guides/` | 1,500 | `reviewedBy`, ARS-density, SOL+notice disclosure |
| client-guides | `src/content/client-guides/` | 1,000 | SOL+notice disclosure, second person |
| practice-areas | `src/content/practice-areas/` | 1,100 | `primaryKeyword`, `cluster` enum, `check:programmatic` |
| glossary | `src/content/glossary/` | (none) | `arsReference`, `arsUrl`, `relatedTerms ≥ 2` |

## Commands Index

| Command | File | Use when |
|---|---|---|
| `/mode-audit` | `.claude/commands/mode-audit.md` | Running QA, pre-publish checks, Netlify chain |
| `/mode-discover` | `.claude/commands/mode-discover.md` | Writing a Brendan Franks investigation |
| `/mode-legal` | `.claude/commands/mode-legal.md` | Writing a Brandon Millam legal-guide or practice-area page |
| `/mode-client` | `.claude/commands/mode-client.md` | Writing a Stephanie Ramirez client-guide |

## Skills Index

| Skill | Path | Triggers |
|---|---|---|
| legal-fact-check | `.claude/skills/legal-fact-check/SKILL.md` | Pre-publish gate: any investigation, legal-guide, client-guide, or practice-area page |
| az-bar-ethics-guard | `.claude/skills/az-bar-ethics-guard/SKILL.md` | Pre-publish gate: any investigation, legal-guide, or practice-area page |
| pi-cluster-architect | `.claude/skills/pi-cluster-architect/SKILL.md` | Planning a new practice-area cluster or city-page expansion |
| pi-investigation | `.claude/skills/pi-investigation/SKILL.md` | Starting a new investigation: methodology, PRR templates, brandable types |
| content-gap-discover | `.claude/skills/content-gap-discover/SKILL.md` | GSC-driven keyword gap discovery, ADOT corridor query seeds |

Universal hub skills live in `taqticscom/.claude/skills/`.

## Agents Index

| Agent | File | Purpose |
|---|---|---|
| scout-agent | `.claude/agents/scout-agent.md` | Nightly ADOT/AZ-courts/AHCCCS/ADE monitor → `docs/briefs/` |
| fact-check-agent | `.claude/agents/fact-check-agent.md` | Stateless per-claim verifier, parallelizable, JSON output |

## QA Chain

Full chain (run before every push to main):

```bash
npm run check:quality:strict    # content quality — hard block
npm run check:sources:strict    # source validation — hard block
npm run check:ai-patterns       # AI-pattern scan — advisory until cycle 3
npm run check:og                # OG guardrail — hard block
npm run build                   # Astro build — hard block
npm run check:schema            # schema — non-strict until LegalService debt resolved
```

Advisory (never in Netlify chain):
```bash
npm run check:claims            # human-review claim inventory
npm run check:serp              # network-dependent; run locally before major keyword pushes
npm run check:meta              # meta length advisory
npm run check:programmatic      # run before new city-page or practice-area commits
```

## Universal Voice Rules (all collections)

These apply across every mode. Individual mode files add collection-specific rules on top.

- "crash" not "accident" — always
- "families" / "the driver" / "the child" — not "victims"
- Contractions always (all three voices)
- No em-dashes — rewrite the sentence; audit-quality hard-blocks on em-dash
- Data-first — state the number or finding before the context
- Name the road, city, or intersection — no generic "Arizona roads"
- Every claim sourced — no unverifiable assertions
- Flesch reading ease 50–60 target (warn if < 25)
- ≥ 80% active voice
- No "specialist" without AZ Bar certification (ER 7.4 hard rule)
- No unverified verdict or settlement amounts — attribute to court record or "publicly reported"
- ADOT data year cited explicitly wherever an ADOT stat appears
- SOL + notice-of-claim disclosure mandatory on any timeline content
- Topic-cluster cross-linking: each published piece links to ≥ 1 piece from each other voice

## Critical AZ-PI Risk Register

Severity levels drive pre-publish attention. The `legal-fact-check` skill enforces these gates.

| Risk | Severity | Fabrication class |
|---|---|---|
| Wrong SOL deadline (e.g., 3yr instead of 2yr) | CRITICAL | `wrong-sol` |
| ARS 12-821.01 notice missed or misframed | CRITICAL | `notice-of-claim-error` |
| ER 7.1–7.5 ethics violation | HIGH | `er7.1-violation` |
| Wrongful death damages cap claimed (AZ has none) | HIGH | `wrongful-death-cap-claim` |
| Tribal jurisdiction ignored | MEDIUM | `tribal-jurisdiction-ignored` |
| ADOT data year mismatch | MEDIUM | `adot-data-year-mismatch` |
| Verdict amount stated as fact without court record | MEDIUM | `unverified-verdict-amount` |
| ARS citation number error | MEDIUM | `ars-citation-number-error` |
| Comparative fault misquoted (modified vs pure) | MEDIUM | `comparative-fault-misquote` |
| Programmatic thin content (boilerplate city pages) | MEDIUM | `programmatic-thin-content` |
| "accident" instead of "crash" | LOW | style |
| Commit trailer visible in client Slack | LOW | ongoing |

## Project Constraints

**updatedAt is mandatory on every content change (NON-NEGOTIABLE).** Any time
a published `.mdx` body or frontmatter is modified — especially a
legal-fact-check correction, a WEAK/FAIL remediation, a statute fix, or any
substantive edit — its `updatedAt` frontmatter MUST be set to the date of the
edit in the same commit. Schema `dateModified` derives from `updatedAt` via
`getArticleSchema`, so a stale `updatedAt` publishes a false freshness signal
and understates a corrected legal claim. A fact-check fix that does not bump
`updatedAt` is an incomplete fix. The legal-fact-check escalation path and
every mode-audit per-collection checklist enforce this. `audit-ai-patterns.ts
--fix` bumps it automatically; manual corrections must do it explicitly.

**No Co-Authored-By trailer.** Commits from this repo hit client-facing Slack.
Do not append any `Co-Authored-By` or Claude attribution trailer to commit messages.

**check:quality:strict hard-blocks Netlify.** The quality gate is the floor, not a
suggestion. Fix content; never weaken the gate. If audit-quality.ts is failing on a
legitimate editorial choice, document the exception in `scripts/lib/` — do not lower
the threshold.

**Growth mandate.** Scout and discover modes surface every signal. Pre-filtering at
discovery is prohibited. Editorial triage happens at the brief stage, not the scan stage.
No voice-rule pre-filtering at scout or discover.

**Zero training-data claims.** Every factual claim in every collection must trace to
a verifiable primary source. No "commonly known" assertions. No paraphrased statistics
without the original source URL in `dataSources`.

**check:schema is LOCAL/pre-push ONLY — never in netlify.toml.** It runs the
shared hub guardrail at `../taqticscom/scripts/check-schema.ts`, which exists
only in the local monorepo checkout. Netlify checks out this repo alone, so
any `check:schema` step in the Netlify build command hard-fails every deploy
(this regression occurred in 9bc6484, fixed in fa56c52). Run it locally before
pushing; do not wire it into the Netlify chain even after the debt below is
resolved. **check:schema:strict** is likewise blocked until the location pages
and `/reviews/` page carry distinct `@id` values inside a proper `@graph` — and
when unblocked, `--strict` is promoted only in the local/pre-push gate, never
in netlify.toml.

**Statewide reach.** Office in Buckeye/Maricopa does not limit editorial scope.
Statewide marketing. Statewide case acceptance. Phoenix, Tucson, Mesa, Flagstaff,
Prescott, Sedona, Yuma, northern AZ — all in scope. No geographic pre-filtering.

## Quick Reference

```bash
# Start a new investigation (Brendan) — read /mode-discover first
npm run check:claims            # after draft: review claim inventory
npm run check:quality:strict    # must pass before OG generation
npm run gen:og                  # generate OG image
npm run check:og                # verify OG exists
npm run check:sources:strict    # verify all dataSources URLs
npm run build                   # local build verification

# Full pre-push QA chain
npm run check:quality:strict && npm run check:sources:strict && npm run check:ai-patterns && npm run check:og && npm run build && npm run check:schema
```
