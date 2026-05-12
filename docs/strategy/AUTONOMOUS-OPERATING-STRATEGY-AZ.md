# AZ Law Now Autonomous Operating Strategy

**Compiled:** 2026-05-12
**Source doctrine:** ported from `mesowatchorg/docs/strategy/AUTONOMOUS-OPERATING-STRATEGY-2026-05-11.md` and adapted for AZ's voice, audience, and editorial team.
**Companion docs:** `TIER-QA-GATE-MATRIX.md`, `AGENT-SWARM-PROTOCOL.md`, `TIER-S-IDEATIONS-AZ.md`, `SESSION-HANDOFF-TEMPLATE.md`
**Status:** Internal operating playbook. Read this before any cascade, outreach, or content push.
**Supersedes:** prior ad-hoc per-piece workflows. Every Tier S build now follows the protocols below.

---

## 1. The thesis

AZ Law Now has 36 investigations published, 3 verified editorial bylines (Brendan Franks, Brandon Millam J.D., Stephanie Ramirez), a 487-contact outreach DB segmented across az-news, education, elder-care, labor-safety, public-health, family-blog, disability-advocacy, civic-advocacy, and a Sunset Editorial brand voice locked in `src/styles/theme.ts`. The Tier-S parity port from MesoWatch (data-viz components, InvestigationOutreachBlock, schema upgrade, magazine-grid index, LedeTime scripts) shipped on the `mesowatch-parity-port` branch.

The gap is **doctrine repeatable across sessions without context compaction loss**. This doc closes it.

Every investigation classifies into one of four tiers at publish time. Each tier has a fixed cascade. Cascades fire from triggers. Jared reviews at three checkpoints. The Slack inbox closes the reply loop. The session handoff doc updates after every material decision so the next session resumes from on-disk state, not from a compacted summary.

---

## 2. Content tier model

### Tier S — Viral candidate (paid amplification justified)

**Profile:** Arizona consumer safety, regulator-named, structured table data, broad audience beyond the legal vertical. Children, elders, veterans, working people, or schools as the affected cohort. Story would air on consumer/parenting/elder-care media if surfaced.

**AZ archetypes:** elder-disconnect heat deaths, school restraint and seclusion data, daycare DHS violation rollup, ESA grand-jury fraud bundle, hit-and-run unsolved-rate cohort, AZ pedestrian death-rate-second-highest concentration story.

**Cascade (T = publish moment):**

| Surface | What fires | When |
|---|---|---|
| Article | Pillar piece with full structured table + composite infographic | T=0 |
| Pull-quote cards (3-5) | 1200x675 X, 1080x1080 IG, 1200x630 FB, 1200x627 LinkedIn, 1080x1920 IG Story | T+0 |
| Composite long-scroll infographic | 1500x2400 embeddable, Newsprint bg, Sunset palette accents, AZ Law Now lockup | T+0 |
| Press kit anchor (`#press-kit`) | InvestigationPressKit component + download composite + embed snippet HTML | T+0 |
| FB organic post | Long-form, 320-380 words, pull-quote card + link preview | T+30 min |
| X thread | 6-tweet chain with stat 1, table preview, composite image, sources, attribution | T+60 min |
| LinkedIn carousel | 6-slide concentration story | T+90 min |
| IG square + Story | Branded card + 3-frame Story (URL in comment per IG rules) | T+2h (after CDN cutover) |
| Bluesky | Mirror of X tweet 1 | T+1h |
| Reddit (1 sub max) | r/arizona, r/phoenix, or r/maricopa, customized title, resource framing | T+24h |
| Newsletter pitches | AARP Arizona, Arizona Mirror, Capitol Times, regional advocacy newsletters | T+24h |
| Tier-1 outreach | Arizona Republic, AZ Mirror, ABC15 investigations desk, KJZZ, Texas Tribune (cross-border) | T+24h, 72-hour exclusivity |
| Tier-2 outreach | Regional + advocacy press (Tucson Sentinel, Cronkite, ProPublica AZ, Indian Country Today) | T+72h after Tier-1 lands |
| **Paid social** | FB $300-800 lookalike from site visitors + AZ-injury-search retargeting; LinkedIn $200-500 elder-care + safety-policy targeting; X $50-100 promoted to AZ journalist accounts | T+24h after first Tier-1 placement |
| 30-day evergreen repost | ~10 different social cuts of the same data, scheduled across FB / X / LinkedIn / Bluesky with different bomb stat per cut | T+0 through T+30 |

**Paid timing rule:** never fire paid before a Tier-1 placement lands. "As reported by [outlet]" social proof carries cold audiences.

### Tier A — Quality data investigation (organic + outreach, no paid)

**Profile:** Regional or professional angle, narrower audience, primary-source-anchored. Earns AZ trade/civic citation and SEO ranking, not consumer virality.

**AZ archetypes:** corridor crash data (SR-347, I-10, US-60), nursing-home violation rollups, AZ workers-comp denial patterns, ASU-prep related-party lease, school MERV-13 filter bypass, ASBN discipline data.

**Cascade:**

| Surface | What fires | When |
|---|---|---|
| Article | Investigation with 3 charts max, headline stat, methodology snapshot, press kit | T=0 |
| Pull-quote cards (3) | One headline stat, one quote, one implication | T+0 |
| FB long-post + X thread | 1/UTC-day X gating, FB queue-fed | T+30 min |
| IG card + Story | Branded card (3-frame Story optional per piece) | T+2h |
| Bluesky + LinkedIn | Mirror with beat-appropriate framing | T+1h |
| Tier-1 outreach | Per matrix doc, Arizona Republic, AZ Mirror, AZ Daily Star, KJZZ, Capitol Times | T+24h |
| Tier-2 outreach | Regional + trade press | T+72h after Tier-1 |
| Reddit | One sub max, customized title | T+48h |
| Newsletter pitches | Beat-specific newsletters | T+72h |
| **NO paid** | Audience too narrow. Paid burns budget on people who can't act on the story. | — |

### Tier B — Reference / evergreen

**Profile:** AZ statute explainers, ARS reference profiles, jurisdiction comparisons, historical case-law data. Earns SEO ranking + tip-line citation, not personalized journalist coverage.

**AZ archetypes:** ARS 12-2603 + 12-2604 statute profiles, dram-shop liability landscape, recovery rules per practice area, AZ-specific MIST defense playbooks.

**Cascade:**

| Surface | What fires | When |
|---|---|---|
| Article | Pillar reference with data tables, source citations, every claim sourced | T=0 |
| FB + X one post each | Lower frequency, no cascade structure | T+1 |
| Internal linking | Heavy, Phase 2 inbound from related investigations | T+0 |
| Tip-line outreach | Law360, AZ Attorney magazine, AZ Bar publications | T+24h |
| **NO personalized pitch, NO paid** | Reference content earns links via internal cluster + SEO. | — |

### Tier C — Daily news

**Profile:** Wire-style coverage of AZ court rulings, executive orders, agency actions, verdict announcements, breaking AZ incident reports.

**Cascade:**

| Surface | What fires | When |
|---|---|---|
| Article | News template, 1 headline stat, 1-2 sources, 3 FAQs | T=0 |
| Google News sitemap | Auto via path `news/YYYY/MM/slug` | T+0 |
| Single FB post | Auto-queue, posts within 24h | T<24h |
| Single X post | Standalone, not threaded | T<24h |
| **NO IG, NO LinkedIn, NO outreach, NO paid** | News volume too high for personalized push per piece. | — |

---

## 3. Classification field (frontmatter)

Add to investigations schema (next pass):

```yaml
viralTier: S | A | B | C
viralRationale: 'One sentence explaining the tier assignment'
newsEligible: false   # default; flips to true ONLY after Tier-S visual + writing QA passes
```

When a piece publishes with `viralTier: S`, the cascade orchestrator fires the full S cascade. Same for A. B and C fire reduced cascades.

**Classification rubric (Jared sets at publish):**
- **S** if: AZ consumer safety, named entities (regulators, manufacturers, retailers, agencies), structured-table data, audience extends beyond legal vertical
- **A** if: primary-source data investigation, regional or professional angle, journalist beat match
- **B** if: reference / evergreen content, statute or ARS profile, no live news peg
- **C** if: daily news, wire-style, single event

---

## 4. The editorial sender architecture

Every outreach pitch fires from the byline author's `@azlawnow.com` alias.

| Alias | Author | Content category | Role |
|---|---|---|---|
| `brendan@` | Brendan Franks, Editor-in-Chief | investigations, crash data, safety analysis, civic accountability | editor |
| `brandon@` | Brandon Millam, J.D., Legal Editor | legal guides, statute explainers, case-law commentary | attorney |
| `stephanie@` | Stephanie Ramirez, Paralegal | client guides, process walk-throughs, paperwork explainers | paralegal |

Routing rule: read the investigation's MDX frontmatter `author:` and route pitches from that alias. Never `info@` or `notifications@` for outreach.

Replies land in Slack `#azlawnow-inbox` via the inbound Resend webhook (TODO: provision, same pattern as `taqtics.com/api/resend-inbound`). Jared reads in Slack. Jared pastes reply + note into Claude Code chat. Claude revises pitch or drafts the response.

**Pre-send gate:** every alias must show clean delivery in a Resend live re-verify pass before it can be used for outreach. See `EMAIL-PROVISIONING-AZ.md` (TODO) for the AZ-specific provisioning trace.

---

## 5. Infographic skill module

**Status:** ported via `viral-infographic` skill spec (see `.claude/skills/viral-infographic-az/SKILL.md`).

### Style library (5 styles)

| Style | When to use | Reference |
|---|---|---|
| Data-dense table | Violation rollups, named-defendant lists, statute crosswalks | meso recall pillar |
| Editorial chart | Investigation headline stats, single-finding visualizations | KFF Health News, NEJM figures |
| Hero stat | Single bomb stat for social cards | Golden Hour `#D4943A` accent on Newsprint |
| Comparison before/after | Pre/post statute change, before/after recall, year-over-year trends | Sorted bar pairs |
| Pillar long-form | Tier-S consolidation pieces | 1500x2400 vertical scroll, embed-ready |

### Format matrix (per platform, safe areas)

| Platform | Dimensions | Safe area | Text size floor | Brand mark placement |
|---|---|---|---|---|
| X/Twitter post | 1200x675 | 24px all sides, 100px top for header | 24px body | Bottom strip, 40px, Headline Black bg |
| LinkedIn post | 1200x627 | 24px all sides | 24px body | Bottom strip |
| IG square | 1080x1080 | 40px all sides | 28px body | Bottom strip, 60px |
| IG Story | 1080x1920 | 80px top + 220px bottom (nav + sticker zone) | 32px body | Bottom strip above 220px floor |
| Bluesky | 1200x675 | Same as X | 24px body | Bottom strip |
| Pillar embed | 1500x2400 | 60px all sides | 18px body | Top + bottom strips |
| Facebook link card | 1200x630 | 40px all sides | 24px body | Bottom strip |

### Sunset Editorial palette (locked from `src/styles/theme.ts`)

- Page background: Newsprint `#FAF5ED` (cream)
- Headline / nav / dark backgrounds: Headline Black `#1A1A1A`
- Primary accent: Golden Hour `#D4943A`
- Gold hover: `#C2842E`
- Urgent / underline / alert accent: Alert Vermillion `#C23B22`
- Warm secondary: Burnt Sienna `#8B4513`
- Body text / muted: Dusk Slate `#4A5859`
- Grid lines / hairline borders: neutral 200 `#E8DFD0`
- Headings: Cormorant Garamond
- Body: DM Sans
- Mono (citation / embed code): JetBrains Mono
- Brand strip on cuts: Headline Black bg, Newsprint text "AZ Law Now · azlawnow.com"

### Composability rule

One data source -> generator produces all 7 platform formats from one input. No per-platform redraw.

### Brand logo composition (Tier-S only)

Tier-S pieces often need third-party logos (agencies, manufacturers, defendants, regulators). Workflow:

- Jared sources logos manually (official press kits → Wikipedia SVG → outlet brand pages → Brand New). Drops into Figma for normalization.
- Exports normalized PNG/SVG to `public/images/infographics/logos/<slug>/<brand>.png` (transparent bg, 300x300 max, consistent baseline)
- The generator reads from that directory and composites the logos into the appropriate slots per layout
- Logo manifest per piece: `data/infographics/<slug>-logos.json` with brand name, file path, source URL, fair-use rationale
- Fair use is editorial. The brand mention is factual reporting, not endorsement.

### Embed-code generation

Every Tier-S infographic is **embeddable**. Generator outputs a paired `embed.html` snippet alongside the image:

```html
<a href="https://azlawnow.com/investigations/<slug>/?utm_source=embed&utm_medium=infographic&utm_campaign=<slug>-<YYYY-MM>">
  <img src="https://azlawnow.com/images/infographics/<slug>/composite-1500w.png" alt="<headline-stat-sentence>" width="1500" />
</a>
<p style="font-size:11px;color:#6b7280;margin:8px 0 0;">
  Source: <a href="https://azlawnow.com/investigations/<slug>/">AZ Law Now</a>. Free to embed with credit.
</p>
```

Embedded URL carries UTM so the team measures where re-embeds land in GA4. The infographic is the asset; the link in the embed is the backlink. Every outlet that embeds = one inbound backlink earned without us writing.

---

## 6. What's built today

| Surface | Status | File / proof |
|---|---|---|
| Content classifier (S/A/B/C) | ❌ Missing | frontmatter field not added yet |
| Investigations schema (methodology, embeddableCharts, datasetUrl) | ✅ On `mesowatch-parity-port` branch | `src/content.config.ts` |
| InvestigationOutreachBlock component | ✅ On parity branch | `src/components/investigations/InvestigationOutreachBlock.astro` |
| InvestigationPressKit component (Tier-S press kit anchor) | ❌ TODO port from meso | should land before first Tier-S build |
| ShareableFigure component (inline-share per panel cut) | ❌ TODO port from meso | should land before first Tier-S build |
| Data-viz components (BarChart, DonutChart, TrendLineChart, StatCard, StatBlock) | ✅ On parity branch | `src/components/data-viz/*.astro` |
| Magazine-grid investigations index | ✅ On parity branch | `src/pages/investigations/index.astro` |
| Sticky TOC + reading progress bar on detail | ✅ On parity branch | `src/layouts/ArticleLayout.astro` |
| Editorial sender per-byline (`brendan@`, `brandon@`, `stephanie@`) | ⚠️ Aliases not provisioned in Resend yet | TODO: provision + verify delivery |
| LedeTime per-journalist personalization scripts | ✅ On parity branch | `scripts/outreach/enrich-journalists.py`, `generate-pitches.py` |
| Outreach DB | ✅ Built | `data/outreach/azlawnow-outreach.db` (487 contacts) |
| Memorial Day queue (300 prospects, 12 CSVs) | ✅ On parity branch | `data/outreach/az-campaign/` |
| Composite infographic skill (port from meso `viral-infographic`) | ❌ TODO | `.claude/skills/viral-infographic-az/SKILL.md` |
| Social cascade orchestrator | ❌ TODO port + AZ-retarget | `netlify/functions/social-cron-az.ts` |
| FB / X / IG / LinkedIn / Bluesky fires | ⚠️ FB + X have basic scripts; cascade not wired | `scripts/outreach/x-post-execute.py`, etc. |
| Paid social briefer | ❌ TODO | `.claude/skills/social-ad-copywriter-az/SKILL.md` |
| Engagement tracking | ❌ TODO | TBD |

---

## 7. Build queue (priority order)

1. **Merge `mesowatch-parity-port` to main.** Foundation for everything below.
2. **Add `viralTier` + `viralRationale` + `newsEligible` fields** to investigations schema. Backfill the 5 enriched Tier-S candidates from the parity port.
3. **Port `InvestigationPressKit` + `ShareableFigure` components** from mesowatchorg to azlawnow, retheme to Sunset Editorial.
4. **Provision `brendan@azlawnow.com`, `brandon@azlawnow.com`, `stephanie@azlawnow.com`** via Resend. Verify delivery. Document in `docs/strategy/EMAIL-PROVISIONING-AZ.md`.
5. **First AZ Tier-S pillar build.** Pick from `TIER-S-IDEATIONS-AZ.md`. Run the full agent swarm per `AGENT-SWARM-PROTOCOL.md`.
6. **Composite infographic skill port** to `.claude/skills/viral-infographic-az/SKILL.md` with Sunset Editorial palette + AZ audience resonance maps.
7. **Social cascade orchestrator** Netlify scheduled function + Blobs persistence. Reads `viralTier` from frontmatter and fires per-tier cascade. FB + X first; IG / LinkedIn / Bluesky as separate adds.
8. **Repost scheduler** for 30-day evergreen Tier-S amplification.
9. **Paid social briefer** skill, fires after first Tier-1 placement lands.
10. **Embed-detection scraper** weekly pass to count secured backlinks.
11. **Engagement tracking** pulls (FB Insights, X Analytics, LinkedIn).
12. **Reply-loop tightening:** Slack inbox → Claude chat → revision.

---

## 8. The autonomous fire-order (Tier-S worked example)

**Day -7 (research):** Researcher agent writes Tier-S piece using Perplexity + site-scrape. Two-phase fact-check pattern. JSON fact-bundle at `data/research/fact-bundles/<slug>.json`. Writer agent reads only the JSON.

**Day -3 (production):** Visual builder agent generates the composite long-scroll in Figma per the design brief (`docs/design/<slug>-infographic.md`). 7 platform format cuts. 3-5 pull-quote cards. Press-kit anchor wired.

**Day -1 (review):** Jared reviews infographics, pull-quotes, press copy. Approves or sends back. Visual audit script runs (`scripts/audit-tier-s-visual-layout.ts`) and must exit clean.

**Day 0 (publish):** Article goes live. Schema validates. The cascade orchestrator reads `viralTier: S` and fires:
- FB long-post (T+30)
- X thread (T+60)
- LinkedIn carousel (T+90)
- IG card + Story (T+2h after CDN)
- Bluesky (T+1h)
- Reddit hold (T+24h, manual)
- Newsletter pitches drafted (T+24h)

**Day 1 (outreach):** Outreach orchestrator drafts pitches from the byline-author alias with 5-leg structure + social handles inlined. Stages to `data/outreach/drafts/YYYY-MM-DD/`. Jared reviews each draft.

**Day 1 + Jared-approved:** Test batch of 2-3 pitches fires via existing sender scripts. Replies route to Slack inbox.

**Day 2 (reply triage):** Jared reads Slack reply. Pastes reply + note into Claude Code. Claude drafts the response or revises follow-up.

**Day 4 (FU1):** 3-day mark per Fractl cadence. FU1 fires if no reply.

**Day 8 (FU2):** 7-day mark. Final touch.

**Day 10 (Tier-2 broadens):** If Tier-1 placement landed, paid social fires with "As reported in [outlet]" social proof. Tier-2 outreach broadens to regional press.

**Day 14 (retro):** Engagement metrics + placement count + reply count + new-backlink count logged. Tier classification reviewed: was Tier S the right call?

---

## 9. The feedback loop

| Signal | Surface | Routes to |
|---|---|---|
| New journalist reply | Resend webhook → Slack `#azlawnow-inbox` | Jared reads, pastes into Claude chat |
| Pitch revision needed | Jared's note in chat | Claude drafts revision, restages in `data/outreach/drafts/` |
| Backlink secured | Manual surfacing until embed-detection scraper lands | Logged in `data/outreach/secured-backlinks.json` |
| Engagement spike | FB Insights + X Analytics (when wired) | Triggers paid social briefer for Tier S |
| New investigation idea | Slack `#research-leads` (if created) | Pushed to `docs/strategy/RESEARCH-QUEUE-AZ.md` |

---

## 10. The non-negotiables

- **Read doctrine first.** Before drafting any pitch, content, or infra plan, read this doc + `TIER-QA-GATE-MATRIX.md` + `AGENT-SWARM-PROTOCOL.md` in full.
- **Live-verify over doc-trust.** When user instinct contradicts a doc, fire the live API or run the command. The doc is the suspect, not the user.
- **One step at a time.** Propose ONE next step + execute. Multi-option forks only for irreversible actions.
- **No invented urgency.** No "this week," no "Memorial Day window," no calendar pressure unless quoted from a verified source.
- **Editorial sender per piece.** Every outreach pitch fires from the byline-author's `@azlawnow.com` alias.
- **Jared reviews before send.** Every pitch staged for review. No autonomous sends. Three review checkpoints per Tier-S piece: pre-cascade, pre-outreach, pre-paid.
- **No em-dashes anywhere.** Period, comma, colon, or parens.
- **No "expert" or "specialist" for attorneys.** AZ State Bar advertising rule equivalents apply.
- **Person-first language** in body copy.
- **`npm run build` before push.** The schema + check pipeline is non-optional.
- **Update session-handoff doc after every material decision.** Not at session end. The doc is the only artifact that survives context compaction with 100% fidelity. See `SESSION-HANDOFF-TEMPLATE.md`.
- **`docs/strategy/` is the source of truth.** Memory files capture cross-session rules. Handoff docs capture in-session state. Don't conflate.
- **Branch hygiene:** every Tier-S build on a feature branch, never directly on `main`.

---

## 11. Open decisions for Jared

1. **Resend alias provisioning for AZ.** Need `brendan@`, `brandon@`, `stephanie@` provisioned + delivery-verified before any Tier-S outreach fires.
2. **AZ Slack workspace + `#azlawnow-inbox` channel.** Where do replies route to? Same workspace as the meso `#taqtics-team`, or separate?
3. **Paid social budget envelope per AZ Tier-S piece.** FRACTL-MECHANICS-EXAMPLES suggests `$300-800 FB + $200-500 LinkedIn + $50-100 X = ~$1000 per Tier-S`. Monthly cap?
4. **First AZ Tier-S target.** Pick from the 10 ideations in `TIER-S-IDEATIONS-AZ.md`. The strongest candidates (highest stat density + clearest Arizona-only angle + AZ regulator named): the elder-disconnect heat death pillar (extends the Korman investigation), school restraint and seclusion data rollup, or the AZ pedestrian death-rate concentration story.
5. **Reddit posting cadence.** One sub per piece per playbook. Bluesky considered another channel: same rule or higher cadence?

---

*End of doc. Update when build queue advances. Reference for every cascade fire.*
