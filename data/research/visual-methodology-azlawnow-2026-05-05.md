# AZ Law Now Editorial Visual Methodology

**Compiled 2026-05-05.** A methodology document for embed-bait visuals across 35+ stories. Built to survive social-platform crops, carry a single insight in 3 seconds, and remain attributable in screenshots. Reference target: replace the v2 Standards Gap split layout with a v3 anchored on the same data but built to this discipline.

___

## 1. Comparable references

Seven specific pieces from the editorial / civic data viz canon that we model.

**1. ProPublica, "Miseducation" (2018, Annie Waldman + Sisi Wei).** A school-segregation explorer where each district page leads with one number set huge against a deep neutral field, then a single supporting chart. Lesson: *the anchor stat is the visual.* The chart serves it. We treat 602 the same way the Miseducation pages treat the disparity index. https://projects.propublica.org/miseducation/

**2. NYT Upshot, "Extensive Data Shows Punishing Reach of Racism for Black Boys" (2018, Badger / Miller / Pearce / Quealy).** The signature move is a single ridge of dots tracking life-outcome trajectories across a clean horizontal field. Lesson: *one chart type, used cleanly, beats four chart types stacked.* Our current v2 splits attention between map + stat + names + penalty math. Pick one.

**3. FiveThirtyEight, "How Shocking Were Trump's Tweets?" charts (Bialik / Mehta).** Anchor stat at 200pt+ with a small contextual bar chart to the right. Type hierarchy ratio of roughly 6:1 between the anchor number and the supporting label. Lesson: *if the anchor is doing the work, give it 60-80% of the visual mass.* Our 602 is at 86pt. It needs to be 200pt+.

**4. Reuters Graphics, "The collapse of insurance for older U.S. homes" (2024).** A choropleth-driven story where the map sits as a *secondary* explainer below an anchor stat lockup. The stat answers the question; the map shows where. Lesson: *map below stat, not beside it.* Side-by-side splits the 3-second read into a left-right sweep.

**5. Bloomberg Visual Data, "America's Heat Map" series (Eric Roston, Akshat Rathi).** Heat-themed editorial uses a deep navy field, single warm-orange accent color, and serif numerals for stats. Lesson: *one accent color carries the meaning.* Our current v2 has gold for codified, sienna for guidance, deep navy for preempted, light navy for none. Four colors dilute the message. Two colors (codified vs. not codified) carry it.

**6. Axios Visuals (Kavya Beheraj, Will Chase).** The Axios "Smart Brevity" applied to charts: one chart, one annotation, one source line, one brand bug. Average chart loads in under 700px tall. Lesson: *the visual ships at one canvas size and crops cleanly to all socials.* Their charts are 1200x675 with deliberate empty space top and bottom so LinkedIn's 1200x627 and Facebook's 1200x630 crops both preserve the headline and the brand bug.

**7. The Pudding, "Where Slang Comes From" (2017, Russell Goldenberg).** The brand bug never moves: bottom-right, consistent placement on every visual across the publication. Lesson: *recognition compounds when placement is locked.* AZ Law Now should put the logo bottom-left at consistent 48px-from-edge across every embed asset, full stop.

**Honorable mention: AZCIR (Arizona Center for Investigative Reporting).** Their "Profiting from Misery" project uses oversized serif pull-quotes and a single accent color (sienna-adjacent rust) against off-white. The closest in-state precedent for AZ Law Now's positioning. Worth scanning before any redesign pass.

___

## 2. AZ Law Now visual methodology principles

### Principle 1: One insight per visual.
*Every embed asset answers exactly one question that a journalist would ask.* The current v2 tries to answer three (where does AZ rank, who died, what's the penalty). Each of those is a separate visual. The Standards Gap is one. The Six Decedents grid is one. The ARS 23-930 penalty math is one. A journalist embeds the one that fits their angle. Multi-insight visuals get embedded by nobody because they don't fit any single paragraph.

### Principle 2: Hierarchy ratio of 8:3:1.
*Anchor stat at 200pt+. Headline at 60-80pt. Supporting chart and labels at 20-28pt. Source line at 11-13pt.* A reader's eye locks the largest element first. If the anchor stat and the chart are sized within 2x of each other, the eye doesn't know what to lock on and the visual reads as "busy" rather than "single insight." The 8:3:1 ratio (200pt anchor / 70pt headline / 24pt chart label) gives the eye a clear path. The current v2 has a 32pt headline and an 86pt anchor stat, a ratio under 3:1. The anchor is undersold.

### Principle 3: One accent color carries the meaning.
*Sienna #C23B22 is reserved for the single cell that carries the editorial point. Everything else is navy or gold.* In a Standards Gap visual, sienna marks Arizona because Arizona is the story. Codified states are gold because they're the comparison. Preempted states are deep navy because they're context, not story. If two colors do editorial work in the same visual, the reader has to decode which carries the headline. Pick one.

### Principle 4: Type system, two families, four sizes.
*Georgia 700 for headlines and numerals (200pt anchor / 70pt headline / 28pt secondary stat). Inter 400-600 for everything else (24pt chart label / 18pt callout / 13pt source line / 11pt eyebrow caps with 2px letter-spacing).* Georgia carries the editorial weight; Inter carries the data. No third family. No italics except for citation context. This is the same system the existing `gen-arizona-workers-comp-heat-denials-images.ts` script uses, we're locking it.

### Principle 5: Safe-area discipline, 96px from every edge.
*The data and the brand bug live inside a 1008x483 safe rectangle centered on the 1200x675 canvas, with 96px buffer on all four sides.* That buffer is the largest single-edge crop any major social platform applies to a 1200x675 master:
- LinkedIn 1200x627 crops 24px top + 24px bottom.
- Facebook OG 1200x630 crops 22px top + 23px bottom.
- Twitter card 1200x675 (no crop on this aspect).
- Instagram square 1080x1080 from a 1200x675 master crops 287px off each side.
- Instagram portrait 1080x1350 cropped from a 1200x675 master crops 264px off the left/right and adds 337px of background top/bottom.
- TikTok / Reels portrait 1080x1920 crops out 444px of bottom or top depending on source orientation.

The 96px universal safe area is conservative for the 1200x675 to 1200x627/630 case (we only need 24px) but tight for the 1080x1080 case (we need 287px to be airtight). Resolution: master at 1200x675 with 96px safe area for the embed and OG variants, then *re-render* the IG square and IG portrait from a different layout that recomposes the elements rather than cropping. Cropping a single master to four formats with one safe rectangle is the wrong abstraction. Re-layout per format using shared tokens.

### Principle 6: Brand bug bottom-left, 48px from edge, every visual.
*Logo `logo-light-hz.png` at 180-220px width sits bottom-left, 48px from left edge and 16-20px from bottom. The URL line sits bottom-right at Inter 11px white-65%, also 48px from right edge.* Locked placement across every asset. When a screenshot of the visual gets reposted on Reddit or LinkedIn, the brand bug travels with it. When the IG square gets cropped from a 1200x675, the bug must end up inside the crop, which means the IG layout re-renders the bug at the new bottom-left rather than relying on crop math.

### Principle 7: Source attribution is a do-follow link rendered as text.
*Bottom-right URL: `azlawnow.com/investigations/[slug]`. Inter 11px, white at 65% opacity. Always present. The HTML embed snippet wraps the `<img>` in `<a href="https://azlawnow.com/investigations/[slug]/" rel="dofollow">`.* The URL is on the asset so a screenshot still cites us; the dofollow link is in the snippet so the SEO benefit accrues. These two are non-negotiable. The "AZ Law Now" wordmark in the bottom-left logo plus the URL in the bottom-right is a doubled brand citation that survives any platform that strips the embed snippet.

### Principle 8: Aspect-ratio strategy is one editorial canvas plus three re-layouts.
*Master canvas: 1200x675 (16:9), the embed-and-OG format. Re-layouts: 1080x1080 IG square (anchor stat dominates, supporting chart drops), 1080x1350 IG portrait (anchor stat top, chart middle, brand bug bottom), 1200x627 LinkedIn (just the master, 24px crop each side, safe area handles it).* Don't auto-crop. Re-render. Each format gets its own composition function in the build script, sharing the same data, tokens, and assets.

___

## 3. Layout templates

Four templates cover 90%+ of editorial embed-bait visuals. Each is described as a 1200x675 master with explicit coordinates.

### Template A: Anchor Stat + Supporting Chart

```
+------------------------------------------------------------+
| [eyebrow caps 11pt sienna, 2px letter-spacing]  y=72       |
|                                                            |
| [HEADLINE Georgia 700 64-80pt, max 2 lines]   y=120-200    |
|                                                            |
|   [ANCHOR STAT Georgia 700 200-260pt gold]    y=240-440    |
|                                                            |
|   [stat label Inter 24pt white, 2 lines]      y=470-510    |
|                                                            |
|   [supporting chart, 480x80, full-width bar   y=540-580    |
|    or sparkline, sienna fill on the AZ data point]         |
|                                                            |
| [logo 180px]                       [URL Inter 11pt white]  |
|                                                  y=H-32    |
+------------------------------------------------------------+
```

Safe area: 96px buffer all edges. Headline left-aligned at x=96. Anchor stat left-aligned at x=96. Chart spans x=96 to x=1104. Logo at (48, H-64). URL at (W-48, H-30) right-aligned.

When to use: any "one number" story. The 602 deaths visual. The Korman 7M settlement. Pedestrian death rates. Heat-illness DAFW counts. This is the workhorse.

### Template B: Two-Panel Comparison

```
+----------------------------+-------------------------------+
| [eyebrow caps]   y=72      | [eyebrow caps]   y=72         |
|                            |                               |
| [LEFT LABEL Georgia 36pt   | [RIGHT LABEL Georgia 36pt     |
|  e.g. "Arizona"]  y=130    |  e.g. "California"]  y=130    |
|                            |                               |
| [LEFT STAT Georgia 700     | [RIGHT STAT Georgia 700       |
|  180pt sienna]   y=210-380 |  180pt gold]   y=210-380      |
|                            |                               |
| [stat label Inter 22pt     | [stat label Inter 22pt        |
|  white, 2 lines]  y=410    |  white, 2 lines]  y=410       |
|                            |                               |
| [supporting bar/icon       | [supporting bar/icon          |
|  small, sienna] y=500-570  |  small, gold]  y=500-570      |
|                            |                               |
| [logo 180px]               |  [URL Inter 11pt white]       |
|                            |                       y=H-32  |
+----------------------------+-------------------------------+
```

Vertical center divider at x=600, 1px white at 12% opacity. 96px buffer all edges. Each side reads as its own anchor-stat panel.

When to use: the AZ vs. CA heat standards comparison. Any "before vs. after" or "us vs. them" story. The MCDPH 2023 vs. 2024 deaths comparison.

### Template C: Annotated Map

```
+------------------------------------------------------------+
| [eyebrow caps]   y=72                                      |
|                                                            |
| [HEADLINE Georgia 700 56pt, 1 line]   y=120                |
|                                                            |
|   [MAP, full-bleed inside safe area, x=96-1104,            |
|    y=180-540, AZ rendered in sienna at 2x stroke,          |
|    other states in flat tone, single annotation arrow      |
|    + callout pointing to AZ with the anchor number         |
|    inline, e.g., "602 deaths"]                             |
|                                                            |
| [legend Inter 13pt 3 items, horizontal]   y=580            |
|                                                            |
| [logo 180px]                       [URL Inter 11pt white]  |
|                                                  y=H-32    |
+------------------------------------------------------------+
```

Map dominates. Anchor stat lives *on the map* as an annotation, not in a side panel. Single annotation arrow from AZ to a callout box. The map serves the stat by locating it geographically. 96px safe area still applies; the map is *contained inside* the safe rectangle.

When to use: any state-level comparison where geography matters. Standards gap. State-by-state heat fatality rates. State-by-state preemption status.

### Template D: Timeline

```
+------------------------------------------------------------+
| [eyebrow caps]   y=72                                      |
|                                                            |
| [HEADLINE Georgia 700 56pt, 1 line]   y=120                |
|                                                            |
| [SUBHEAD Inter 18pt warm gold]   y=160                     |
|                                                            |
|   [TIMELINE AXIS, x=96 to 1104, y=320, 4-5 markers,        |
|    each marker has a year label above and event text       |
|    below. AZ entries in sienna, others in white-70%.       |
|    Critical event (e.g., AZ 2026 guidance) marked          |
|    with a sienna pin and the anchor stat inline.]          |
|                                                            |
| [single explanatory line below the timeline]   y=520       |
|                                                            |
| [logo 180px]                       [URL Inter 11pt white]  |
|                                                  y=H-32    |
+------------------------------------------------------------+
```

Horizontal timeline. The anchor stat is the *gap* between two markers (e.g., "21 years between CA codifying 2005 and AZ guidance 2026"), rendered as a sienna highlight band spanning those two markers.

When to use: the 21-year codification gap story. The ARS 23-1061(M) 21-day clock vs. day-of-exposure heat death timeline. Any "the gap is the story" framing.

___

## 4. Specific recipe for the Workers Comp Standards Gap visual (v3)

### Template
**Template A: Anchor Stat + Supporting Chart.** Not Template C (the map). The map is the wrong primary visual for this story because the story isn't geographic, it's that AZ is one of 46 states with no codified standard while having the country's heaviest occupational heat-death load. Geography doesn't carry that contradiction; the number does.

### The single sentence the visual makes readable in 3 seconds
**"Arizona had 602 confirmed heat deaths in 2024 and zero codified workplace heat standard."**

That's the story. The map of which 4 states *do* have standards is supporting context, not the headline.

### Layout (1200x675 master)

```
+------------------------------------------------------------+
| ARIZONA, 2024            (Inter 11pt sienna, 2px ls)  y=72 |
|                                                            |
| 602                      (Georgia 700 240pt gold) y=120-360|
|                                                            |
| confirmed heat deaths in Maricopa County alone             |
|                          (Inter 24pt white)  y=395         |
|                                                            |
| Arizona has zero codified workplace heat standard.         |
|                          (Georgia 700 36pt warm gold) y=445|
|                                                            |
| Four other states do.    (Inter 18pt white-80%)  y=485     |
|                                                            |
| [Mini state grid: 4 gold pills (CA 2005, OR 2022, WA 2008, |
|  MN pending) + 1 sienna pill (AZ 2026 guidance only),      |
|  Inter 12pt, y=540-580]                                    |
|                                                            |
| [logo 180px @ y=H-64]    azlawnow.com/investigations/...   |
|                                       (Inter 11pt) y=H-32  |
+------------------------------------------------------------+
```

### Specific tokens

**Colors:**
- Background: `#0A1628` (deep navy, flat fill, no panel split).
- 602 numeral: `#D4A24C` (gold). Carries the human anchor.
- Sienna `#C23B22`: reserved for the AZ pill in the state grid and the 4px left accent stripe.
- Headline + body white: `#FFFFFF`.
- Warm gold `#F5E6D3`: subhead "Arizona has zero codified workplace heat standard."
- Muted text `#9BA8BD`: eyebrow caps + URL + state-grid year labels.

**Type:**
- Eyebrow: Inter 11pt, 2px letter-spacing, sienna `#C23B22`, uppercase.
- Anchor 602: Georgia 700, 240pt, gold.
- Anchor label: Inter 400, 24pt, white.
- Headline: Georgia 700, 36pt, warm gold.
- Subhead: Inter 400, 18pt, white at 80% opacity.
- State grid pills: Inter 600, 12pt, deep navy text on gold or sienna fill.
- Logo + URL footer: Inter 11pt, white at 65% opacity.

**Spacing:**
- Safe area: 96px from all edges.
- Anchor stat baseline at y=360 (centered vertically in the upper 53% of canvas).
- Brand bug: logo at (48, H-64), URL at (W-48, H-30) right-aligned.

### What gets cut from v2

- The full US choropleth. It dilutes the anchor and doesn't survive a square crop. Replaced by a single-row state pill grid.
- The 6 named decedents block. Becomes its own standalone visual (Template A variant: the names are the anchor, not 602).
- The ARS 23-930 penalty math. Becomes its own standalone visual (Template A variant: "$50,000" anchor stat against the wrongful-death penalty math).
- The right-side panel split. Single full-width navy field reads cleaner and crops cleaner.

### Per-format re-layouts

**1200x627 LinkedIn:** Use the 1200x675 master directly. 96px safe area absorbs the 24px crop on each side.

**1080x1080 IG square:** Re-render with anchor stat at center, headline below, state grid below that, brand bug bottom. Drop the eyebrow.

**1080x1350 IG portrait:** Re-render with eyebrow + anchor stat in upper half, headline mid, state grid lower-mid, brand bug bottom. More vertical space for the state grid.

**Transparent PNG (Twitter):** Anchor stat + headline + state grid + logo. No background fill. White text + warm gold subhead. For embedded use in screenshots and threads where the recipient supplies the background.

___

## 5. Build path

The existing `gen-heat-standards-map.ts` script is the right toolchain. Refactor into:

1. `scripts/lib/brand-tokens.ts`, single source of truth for colors, type sizes, spacing.
2. `scripts/lib/layouts/`, one file per template (A, B, C, D), each exporting a function `(data, canvasWidth, canvasHeight) => svgString`.
3. `scripts/lib/render.ts`, Sharp wrapper that takes an SVG string + canvas size + format name and emits the PNG variant.
4. `scripts/embeds/heat-standards-2026-05.ts`, the per-story script that imports tokens, picks Template A, supplies data, calls render for all four formats.

Existing `gen-heat-standards-map.ts` becomes the v2 archive; v3 ships from the new structure.

___

## 6. What this methodology buys us

- **Embed survival.** Every visual carries the brand bug and the URL inside the safe area, so screenshots cite us. The dofollow embed snippet handles the SEO; the on-canvas brand handles the social-proof loop.
- **3-second read.** One anchor, one headline, one supporting element. A journalist scanning a press release knows what they'd embed within 3 seconds.
- **Consistency at scale.** 35+ stories shipping over the next 12 months. Same templates, same tokens, same chrome. By visual 5, journalists recognize an AZ Law Now embed before they read the URL.
- **Re-pitch friendly.** Data-bound builds mean a one-line edit to the data file regenerates all four formats consistently when, say, MN's heat standard moves from "pending" to "codified."

___

**End of methodology. Compiled 2026-05-05 by AZ Law Now visual desk.**
