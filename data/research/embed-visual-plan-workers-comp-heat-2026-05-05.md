# Embed-Bait Visual Plan: AZ Heat Workers Comp Denial Rate

Compiled 2026-05-05. Built for journalist reciprocity (one-line embed, do-follow back to azlawnow.com).

## 1. Concept ranking

### A. The Standards Gap Map (TOP PICK)
US heat-map (50 states) color-coded by codified workplace heat standard status. Insight: only 4 states have enforceable standards (CA, OR, WA, MN-pending). AZ is shaded "guidance only" alongside TX/FL preemption-red.
- Why a journalist embeds it: every AZ heat story needs the "where does AZ rank" visual. None exist that are press-ready.
- Slots into: KJZZ Davis-Young pieces, AZ Mirror "extreme heat protections" coverage, Cronkite News April 20 piece.
- Format: choropleth map. Difficulty: medium.

### B. The Standard vs. Death Toll bar pair
Two stacked bars side-by-side: AZ (602 Maricopa heat deaths 2024, zero codified standard) vs. CA (~1,000 claims processed, two codified standards).
- Why embed: single-frame contradiction. Reader gets the asymmetry instantly.
- Slots into: any climate/labor story comparing red-state vs blue-state worker protections.
- Format: dual bar. Difficulty: low.

### C. The 21-Day Clock Timeline
Horizontal timeline showing ARS 23-1061(M) clock vs. typical heat-death timeline (exposure → collapse → death often same day, before clock attaches).
- Why embed: explains the structural reason fatality denials are easier than back-injury denials.
- Slots into: any individual heat-death case story (Perez, Mendoza, Boni).
- Format: annotated timeline. Difficulty: medium.

### D. The Six Named Decedents grid
Headshot-free card grid: 6 names, ages, jobs, cities, dates, employers. Citation: KJZZ.
- Why embed: humanizes the abstract policy. Print-ready sidebar.
- Slots into: anniversary coverage, summer 2026 heat-season previews.
- Format: 2x3 card grid. Difficulty: low.

### E. The Penalty Math callout
ARS 23-930 illustrated: $200K wrongful-death claim × 25% = $50K penalty. Shows lever vs. wholesale carrier behavior.
- Why embed: rare clean explainer of an obscure statute.
- Slots into: any bad-faith carrier story.
- Format: equation card. Difficulty: low.

## 2. TOP PICK Spec: Standards Gap Map

**Title:** "Four States Have Enforceable Workplace Heat Standards. Arizona Doesn't."
**Subtitle:** "Cal/OSHA processes 1,000 heat-illness claims a year. Arizona doesn't publish a count."

**Data points (each cited inline at bottom of map):**
- CA: codified standards (T8 CCR 3395 outdoor since 2005, 3396 indoor 7/23/2024). Source: Cal/OSHA.
- OR: OAR 437-002-0156 (2022). Source: Oregon OSHA.
- WA: WAC 296-307-097 (2008, amended 2023). Source: WA L&I.
- MN: pending rule. Source: MN OSHA.
- AZ: ICA Heat Guidelines 4/9/2026, guidance only. Source: ICA proceedings.
- TX: HB 2127 (2023) preempts local ordinances. Source: TX Legislature.
- FL: HB 433 (2024) preempts local ordinances. Source: FL Legislature.
- 43 other states: no standard.

**Visual structure:** US choropleth, Albers projection. Four-tier legend (codified, guidance only, preempted, none). Color encoding: gold = codified, sienna = guidance, deep navy = preempted, light navy = none.

**Brand bug:** logo-light-hz.png bottom-left at 220px. Bottom-right text block (Inter 14px white): "Source: AZ Law Now investigation, May 2026 / azlawnow.com/investigations/arizona-workers-comp-heat-denials". Left edge: 5px C23B22 sienna stripe.

**Output formats:** PNG 1200x675 (embed), 1080x1080 (IG), OG 1200x630, transparent PNG (Twitter card).

**Embed code:**
```html
<a href="https://azlawnow.com/investigations/arizona-workers-comp-heat-denials/" rel="dofollow">
  <img src="https://azlawnow.com/embeds/heat-standards-map-2026-05.png"
       alt="Map of US workplace heat standards: 4 states codified, Arizona guidance only"
       width="1200" height="675" loading="lazy" />
</a>
<p><small>Source: <a href="https://azlawnow.com/investigations/arizona-workers-comp-heat-denials/" rel="dofollow">AZ Law Now investigation</a>, May 2026.</small></p>
```

## 3. Brand spec lockup
Title: Georgia 700, 52px, white. Subtitle: Inter 22px, #F5E6D3 warm gold. Background: deep navy (#0A1628) flat fill behind map; map fills warmed via overlay. 5px sienna (#C23B22) left stripe. Logo bottom-left, source bottom-right (Inter 14px, white 80% opacity).

## 4. Build path
**Sharp + SVG composition.** Same toolkit as `gen-arizona-workers-comp-heat-denials-images.ts`. Use `d3-geo` to project TopoJSON US states, render to SVG string, hand to Sharp for raster + brand chrome composite. Single Node script: `scripts/gen-heat-standards-map.ts`. Estimated 90 minutes from scaffold to four-format export.

## 5. Distribution
1. Embed in MDX after the StatBlock at line 71 of the investigation.
2. Standalone page `/investigations/arizona-workers-comp-heat-denials/embed/` with one-click copy embed code (drives the do-follow link).
3. Pitch follow-up email (Cole Bennett A3) with embed code in body to KJZZ Davis-Young, Cronkite News, AZ Mirror, AZCIR, ABC15, AZ Capitol Times, AZ Republic environmental and labor desks.
4. Twitter/LinkedIn share with transparent PNG variant; tag @azpbs @kjzzphoenix.
5. Re-pitch quarterly (June heat-season open, July peak, September shoulder, December task-force anniversary).

## 6. Stack Decision

### Path comparison

**Path 1: Figma-driven export (from the AZ Law Now Brand Exploration board)**
- Recommended use case: visuals where pixel-level brand fidelity is the deliverable. Logo lockup wall, the Decedents grid (Concept D, where typography and card composition carry the emotion), any social hero where the artwork ships standalone. Best fit when the visual is mostly typography + tokens + photography, not data-bound.
- Time to first asset: 2 to 4 hours for the Standards Gap Map. Choropleth has to be built as a Figma component (paste US states SVG, restyle each fill, add legend, add brand chrome) and then exported. Subsequent variants (1080x1080, OG 1200x630) are 5 to 10 minutes each via Frame variants + export presets.
- Brand consistency: highest. Source of truth lives in the file. Color tokens, type styles, logo lockup, sienna stripe, gold accent, all already locked in components. Drift is structurally hard.
- Attribution / embed code: manual. Embed page HTML written by hand in the MDX file or in a sibling `.astro` page. No coupling between the Figma asset and the generated embed snippet.
- Programmatic regeneration on data updates: poor. If CA's claim count changes or a new state codifies a standard, a human has to open the file, retint the state, retype the legend number, and re-export. Figma REST API can read frame contents but writing data-driven updates back is brittle and rate-limited.

**Path 2: Sharp + SVG programmatic (matches `gen-arizona-workers-comp-heat-denials-images.ts`)**
- Recommended use case: anything data-bound and likely to update. The Standards Gap Map (Concept A), the Standard vs. Death Toll bar pair (Concept B), the Penalty Math callout (Concept E). Also right for the multi-format export problem: PNG 1200x675, IG 1080x1080, OG 1200x630, transparent PNG variant, all from one script run.
- Time to first asset: 90 minutes for the Standards Gap Map per the existing plan. Reuse the gradient + accent stripe + title SVG + logo composite pattern already in the gen script. New work is the d3-geo projection of TopoJSON US states into a fill-colored SVG string, then drop into the existing composite chain. Subsequent variants are loop iterations over a `formats` array, no extra hand work.
- Brand consistency: high but approximated. Color hexes, font sizes, padding, stripe widths are constants imported from a `brand.ts` token file or hardcoded. Drift risk shows up if the Figma board updates a token and the constant in code doesn't get synced. Mitigated by exporting tokens from Figma to JSON once and importing into the gen script.
- Attribution / embed code: trivial to auto-generate. The same script that writes the PNG can write a sibling `.html` snippet (or stamp the embed code into the MDX page) with the correct image URL, alt text, dimensions, and `rel="dofollow"` link. Single source of truth.
- Programmatic regeneration on data updates: best. New state codifies a standard, edit one entry in a `states.ts` data file, rerun the script, all four output formats regenerate consistently. Versionable in git. Reproducible by Cole Bennett or any agent without design tooling.

**Path 3: Claude Design / Imagen (Gemini imagen-4.0 already wired in the existing gen script)**
- Recommended use case: emotional hero photography with no data overlay. The investigation hero already uses this path (the empty Phoenix loading dock at 110 degrees). Right for any visual where the goal is mood and the data sits in adjacent text, not on the image. Wrong for choropleths, bar charts, equations, and named-decedent grids where numbers and names must be exact.
- Time to first asset: 2 to 5 minutes per generation, 15 to 30 minutes including prompt iteration to land the brand mood. Fastest creative loop in the stack.
- Brand consistency: approximate. Style prompt enforces Kodak Portra 400 + navy/sienna/gold palette + documentary aesthetic, but each generation drifts. Cannot guarantee the exact deep navy `#0A1628` background or the 5px sienna `#C23B22` stripe. Brand chrome (logo, source line, accent stripe) still has to be composited on top via Sharp, so this path always pairs with Path 2 for the lockup layer.
- Attribution / embed code: same as Path 2 since the brand chrome and embed snippet generation happen in the wrapping Sharp script. Imagen only contributes the base image bytes.
- Programmatic regeneration on data updates: not applicable. Imagen does not encode data. If the underlying story changes, the hero photo doesn't need to change.

### Decision: Path 2 (Sharp + SVG programmatic) for the Standards Gap Map

The top-pick visual is a 50-state choropleth where four cells are gold, two are deep navy, one is sienna, and 43 are light navy, with a four-tier legend and a per-state citation footer. Every one of those visual decisions is data-bound, every output format (1200x675 embed, 1080x1080 IG, 1200x630 OG, transparent PNG) needs to ship in lockstep, and the embed snippet itself needs to be machine-generated alongside the asset so the journalist-facing embed page stays in sync with the file URL. Path 1 buys brand fidelity we don't need at the cost of regeneration speed we do need (this map gets re-pitched quarterly through December 2026 and the underlying state-by-state codification status will change). Path 3 cannot represent the data at all. Path 2 reuses the proven `gen-arizona-workers-comp-heat-denials-images.ts` composition chain (gradient overlay, sienna accent stripe, Georgia title SVG, logo composite), adds d3-geo + TopoJSON for the map layer, ships in 90 minutes, and on every quarterly re-pitch a one-line edit to a `states.ts` data file regenerates all four formats plus the embed HTML.
