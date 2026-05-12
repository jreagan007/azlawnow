---
name: viral-infographic-az
description: |
  Visual asset production for AZ Law Now Tier-S pillars using the Fractl composite-long-scroll methodology, themed for the Sunset Editorial palette (Newsprint cream, Golden Hour accent, Alert Vermillion urgent, Burnt Sienna warm secondary, Headline Black, Dusk Slate body). Takes a fact-bundle slug + byline + psychographic primary audience, produces a canonical design brief at docs/design/<slug>-infographic.md for the human-in-the-loop Figma build, then orchestrates the critique to v1 to cut-asset to embed pipeline. Bakes in AZ Law Now brand-messaging integration (You Get Answers tagline, AZ Law Now lockup placement, Cormorant Garamond headings, DM Sans body), viral guardrails (no manufactured fear, no legal CTA on visual, person-first across alt text), and psychographic discipline per audience. Use this skill whenever building the visual asset for an AZ Tier-S piece classified per docs/strategy/AUTONOMOUS-OPERATING-STRATEGY-AZ.md. Triggers for "build the infographic for X," "Fractl visual for X," "composite long-scroll for X," "design brief for X," any request involving the embed-bait visual on an AZ Tier-S pillar.
---

# viral-infographic-az

## When to invoke

Invoke for AZ Tier-S pillars only. Tier-A gets one Astro `<BarChart>` inline. Tier-B and Tier-C do not earn an infographic per the operating strategy.

The pillar must already have:
- A published fact-bundle at `data/research/fact-bundles/<slug>.json`
- A pillar MDX at `src/content/investigations/<slug>.mdx` (or a clear plan for one)
- A confirmed `viralTier: S` classification in frontmatter

Do not invoke if any of the three is missing. Run `data-journalism-study-az` or `pillar-architect-az` first.

## Inputs

- `--slug <slug>` (required): the pillar slug, matching the fact-bundle filename.
- `--audience <key>` (required): the psychographic primary audience. Locked vocabulary:
  - `phoenix-families` — heat-disconnect, school safety, daycare, child-safety
  - `arizona-elders` — nursing home, elder abuse, elder caregivers
  - `arizona-workers` — labor safety, heat workers, workers comp, OSHA
  - `arizona-pedestrians` — corridor crashes, hit-and-run, road design
  - `arizona-veterans` — VA, military, defense-base exposure
  - `arizona-civic-readers` — agency accountability, ESA fraud, ICE detention, ACC regulation
  - `arizona-rural-tribal` — borderlands, tribal land, rural transit, hospital access
- `--byline <author-slug>` (required): one of `brendan-franks | brandon-millam | stephanie-ramirez`. Drives the design-brief sender-mapping for downstream outreach.
- `--canonical-figma <fileKey>` (optional): defaults to the AZ Law Now master Figma file (TODO: lock in `data/site-config.ts`).

## Output

1. `docs/design/<slug>-infographic.md` — the canonical design brief
2. `data/infographics/<slug>-spec.json` — the structured spec the design brief encodes (re-readable by future cut-asset re-renders)
3. `data/infographics/<slug>-logos.json` — the v1 logo-harvest manifest (blank until logos are sourced)
4. `data/social/embed-snippets/<slug>-embed.html` — generated when the canonical PNG lands at `public/images/infographics/<slug>/composite-1500w.png`

## The 5-Phase Protocol

Gated. Do not skip a phase.

### Phase 1 — Synthesis (Claude, no human input)

Read in order, in full:
1. `data/research/fact-bundles/<slug>.json` — the data
2. `src/content/investigations/<slug>.mdx` — the prose (gives the headline stat the pillar already commits to + the Fractl narrative arc)
3. `docs/strategy/AUTONOMOUS-OPERATING-STRATEGY-AZ.md` Section 5 — infographic style library, format matrix, Sunset Editorial palette, brand-strip composition rule
4. `docs/strategy/TIER-QA-GATE-MATRIX.md` — Tier-S row requirements
5. `docs/strategy/AGENT-SWARM-PROTOCOL.md` — handover discipline
6. `docs/strategy/SESSION-HANDOFF-TEMPLATE.md` — §0 LIVE STATE update rule
7. `src/styles/theme.ts` — the locked palette + type stack

Output a one-page synthesis at `data/infographics/<slug>-synthesis.md`:
- The bomb stat (verbatim from fact-bundle + pillar MDX, do not re-invent)
- The 2-3 structural findings the visual must carry
- The narrative arc: hero → methodology → finding 1 → finding 2 → finding 3 → closing thesis
- The psychographic audience + the emotional resonance rules (see Phase 2)

### Phase 2 — Psychographic + brand-messaging integration

For the `--audience` value, lock the emotional resonance map:

| Audience | Lean into (true, accurate) | Banned framings |
|---|---|---|
| `phoenix-families` | Recognition (this is in my neighborhood), agency (here's the list, here's the action), community trust (a neighbor sharing is doing the work the regulator should) | "every parent's worst nightmare," "could your kid be next," time-pressure language, crying-child photos, legal-CTA copy |
| `arizona-elders` | Recognition of risk, agency (ACC has rules, here's how to confirm coverage), peer trust (other AZ elders have prevailed) | "your parents are dying alone," scared-elder photos, fear-baiting on heat or cold |
| `arizona-workers` | Recognition of trade exposure (heat, scaffolding, OSHA-eligibility), workers-comp access, peer-network amplification (union halls, trade press, Spanish-language reach) | "the boss knew" without case-specific evidence, anti-immigrant framing, legal-CTA in body |
| `arizona-pedestrians` | Recognition of corridor pattern (Hylan, Northern, US-60, SR-347), agency (RSAP investments, voter advocacy windows) | jaywalking-blame, distracted-pedestrian framing without ADOT-cited evidence, victim-blaming |
| `arizona-veterans` | Service-era exposure framing, PACT Act eligibility, peer trust (other veterans have filed) | "the government failed you," service-betrayal narratives |
| `arizona-civic-readers` | Structural finding (agency-level concentration, cross-state coalition, regulator coordination gap), Fractl-canonical methodology, cited primary sources every panel | Partisan signaling, activist framing, advocacy-press rhetoric |
| `arizona-rural-tribal` | Recognition of structural neglect, tribal-sovereignty respect, multi-language reach, cross-border framing | Stereotypes, savior framing, monolithic-community language |

Apply the resonance map to every panel.

**Brand-messaging surfaces (locked, always present on every Tier-S long-scroll):**

1. **Top banner** (above Panel 1): `AZ LAW NOW · YOU GET ANSWERS` — Cormorant Garamond Bold uppercase, Newsprint `#FAF5ED` on Headline Black `#1A1A1A` strip, 22px, tracking 2px, hairline Golden Hour vertical separators.
2. **Mid-scroll micro-anchor** (between findings panels): `Independent data journalism on Arizona injury cases.` — DM Sans Medium 22px, Dusk Slate `#4A5859` on Newsprint.
3. **Closing-band statement** (top of final panel): "Arizona families deserve answers." — selective-bold on **answers.** Adapt the verb-noun pair per pillar while preserving the rhythm.
   - Heat pillar: "No Arizona elder should be disconnected from the grid **without protection.**"
   - School-restraint pillar: "No Arizona family should hear about restraint **from a lawsuit.**"
   - Daycare pillar: "No Arizona parent should learn about violations **after the fact.**"
4. **AZ Law Now lockup** on every cut-asset (lower-right preferred). Reuse the lockup from `public/assets/logos/`.

### Phase 3 — Design brief production

Generate the canonical design brief at `docs/design/<slug>-infographic.md` matching the meso recall-pillar structure. Required sections:

1. **The asset** — one-paragraph summary of the canonical long-scroll
2. **Type stack** — Cormorant Garamond + DM Sans + JetBrains Mono, locked
3. **Color palette** — Sunset Editorial from `src/styles/theme.ts`, note any one-off accent and justify
4. **Brand messaging layer** — three surfaces from Phase 2, verbatim copy
5. **Psychographic primary audience** — apply the resonance map
6. **Viral guardrails** — no manufactured fear, no legal CTA on visual, person-first
7. **Selective-bold pattern** — load-bearing nouns in DM Sans Bold inside the SemiBold sentence
8. **Panel-by-panel spec** — usually 5-7 panels (hero / methodology / finding 1 / finding 2 / finding 3 / absence-or-counterfactual / source-and-lockup), each with:
   - Background color
   - Section anchor label (uppercase, Golden Hour, tracking 2px)
   - Headline (verbatim, with `**bold**` spans marked for selective-bold)
   - Hero number / chart data / table rows (verbatim from fact-bundle)
   - Source line (verbatim from fact-bundle `sources[]`)
9. **Cut-asset matrix** — platform-specific dimensions
10. **v1 enrichment briefs** — scraping commissions for logos, product photos, agency seals, map bases
11. **Acceptance criteria** — the Opus critique checklist
12. **Embed snippet HTML** — generated at Phase 5 when the canonical PNG lands
13. **Iteration loop with Opus** — the human-in-the-loop critique cycle

The brief is the canonical artifact handed to the designer.

### Phase 3.5 — Asset harvest into a designer-ready folder

Before the designer opens Figma, every external asset the long-scroll needs lands in one organized folder.

```
public/images/infographics/<slug>/figma-assets/
  README.md
  manifest.json
  01-azlawnow-brand/                # AZ Law Now logo, color swatches, type-spec card
  02-agency-seals/                  # AZ state agency seals (ACC, AzDE, ICA, etc.)
  03-corporate-logos/               # Named defendant / chain / parent-company logos
  04-county-maps/                   # AZ county base SVGs (Wikipedia, public domain)
  05-arterial-maps/                 # Phoenix / Tucson stroad reference imagery
  06-document-icons/                # FOIA seal, indictment cover, regulator notice
  07-product-photos/                # Optional, from gov regulator notice pages
  08-icons-noun-project/            # NEEDED.md with concept queries Jared resolves manually
```

Manifest schema (`manifest.json`, one row per asset):

```json
{
  "category": "agency-seal | corporate-logo | county-map | document-icon | arterial-photo | azlawnow-brand | icon",
  "slug": "<file-base>",
  "display_name": "<human readable>",
  "file_path": "<folder>/<file>",
  "source_url": "<verifiable primary source>",
  "fair_use_rationale": "<one line — usually 'Factual attribution. Not endorsement.' for corp logos, 'Public domain' for agency seals + maps>",
  "format": "svg | png | jpg",
  "license": "trademark holder | public domain | CC BY-SA",
  "harvested_at": "<ISO timestamp>",
  "status": "ready | manual-harvest-needed"
}
```

### Phase 4 — Human-in-the-loop Figma build + Opus critique

Designer (Jared or commissioned partner) opens the canonical Figma file and creates a new page titled `<slug>-composite-v0`. Builds the long-scroll per the brief. Drops the Figma URL in chat.

Claude fetches via `mcp__claude_ai_Figma__get_design_context` + `get_screenshot`. Runs the acceptance criteria from Phase 3. Surfaces critique notes back. Designer iterates. Repeat until every acceptance row passes.

**v1 enrichment** runs parallel to v0 critique. Background-mode site-scrape of logos, agency seals, county maps, arterial photos per the briefs.

**Anti-patterns** (these break the discipline):
- Claude rendering programmatic SVG as the canonical asset — never. Claude produces content-validation drafts only.
- Designer building without the brief — the brief is the contract.
- Skipping v0 critique to "save time" — every Fractl-canonical asset clears critique before v1.

### Phase 5 — Embed snippet + cut-asset wiring + pillar integration

When the canonical 1500w PNG lands:

1. Generate `data/social/embed-snippets/<slug>-embed.html` with UTM tracking. Alt text is person-first, no em-dashes, traces to the headline stat. Anchor href carries `utm_source=embed&utm_medium=infographic&utm_campaign=<slug>-<YYYY-MM>`.
2. Update the pillar MDX to inline-render the composite as the first major asset + per-finding-section inline cuts via `<ShareableFigure>` (TODO port from meso).
3. Update spoke MDX files (the related investigations around the pillar) to embed the same canonical composite + add an in-body anchor sentence linking to the pillar.
4. Commit: pillar + spoke updates + composite PNGs + cut PNGs + embed snippet HTML + populated `<slug>-logos.json` manifest. One batch commit. One Netlify deploy.
5. Verify the embed snippet works by copy-pasting into a fresh sandbox HTML.

### Phase 5.5 — MCP-resilient Figma build pattern (from meso 2026-05-12 lessons)

- Batch `use_figma` writes ≤ 8 per cycle, ideally 3-5
- Load all fonts at top of every call: `[["Cormorant Garamond","Bold"], ["DM Sans","Bold"], ["DM Sans","Semi Bold"], ["DM Sans","Regular"], ["DM Sans","Medium"]]`
- Default to `get_screenshot` (lightweight) for visual critique. `get_metadata` only on small pages.
- ≤ 3 patches per page before rebuild. Patch-pattern is fine for ≤ 3 incremental tweaks; rebuild-pattern is right for everything else.
- For large pages, use `use_figma` JS to enumerate top-level children only.

## Hard rules (NO SLOP)

- Person-first language in body copy + alt text
- No em-dashes anywhere. Periods, commas, colons, parens.
- No "expert" or "specialist" for attorneys
- % symbol, not "percent"
- No "shocking" / "alarming" / "staggering" before stats
- No transactional CTA in body. Closing thesis only.
- Every factual claim sources to a Perplexity-cited primary source URL
- Description ≤ 160 chars
- Subject lines ≤ 50 chars
- No defensive framing. Say what we ARE.
- No internal-strategy comments in client-shipped code. Sweep before commit.
- Stay on the feature branch. Never push to main.
- Update `docs/strategy/<slug>-build-log.md` §0 LIVE STATE after every material decision, before the next tool call.

## Verification: did the skill work?

- `docs/design/<slug>-infographic.md` exists and lists all sections
- `data/infographics/<slug>-spec.json` is valid JSON and matches the brief
- `public/images/infographics/<slug>/composite-1500w.png` renders at 1500x2400 with brand strip top + bottom
- `data/social/embed-snippets/<slug>-embed.html` carries UTM + accessibility attributes
- The pillar MDX inline-renders the composite + per-finding cuts
- Pre-ship visual-layout audit exits 0

When all six are true, the skill ran clean.
