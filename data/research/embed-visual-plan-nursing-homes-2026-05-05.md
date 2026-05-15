# Embed-Bait Visual Plan: AZ Nursing Homes Investigation

**Investigation:** AZ Nursing Homes: Billing Audit Is Also a Care Audit
**Slug:** arizona-nursing-homes-billing-fraud-and-abuse
**Compiled:** 2026-05-05

---

## 1. Concept Ranking

### A. Geographic dot map: 52 of 142 AZ nursing homes carry a 1- or 2-star rating
- Insight: more than 1 in 3 CMS-rated AZ nursing homes underperform, clustered in Maricopa and Pima counties.
- Why embed: KJZZ, AZCIR, AZ Mirror, AZ Republic all run AZ-state explainers. A clean state map with named worst facilities slots into any elder-care, ALTCS, or APS story.
- Slot-in: KJZZ Davis-Young / Sanchez / Ritchie aging beat, AZCIR Demers, AARP Arizona blog, Disability Rights Arizona resource pages.
- Format: choropleth-free dot map, AZ TopoJSON.
- Difficulty: medium.

### B. APS substantiation gap bar chart: under 1% AZ vs 29-33% national
- Insight: a 30-fold structural undercount in vulnerable-adult abuse substantiation.
- Why embed: single number tells the whole oversight-failure story. Ombudsman programs, AARP, Consumer Voice will repost.
- Slot-in: any APS, elder-abuse-reporting, or HB2764 follow-up coverage.
- Format: two-bar comparison with annotation callout.
- Difficulty: low.

### C. Combined-frame Venn: billing-fraud citations x abuse/neglect citations x overlap
- Insight: same buildings cited under both systems in the same year.
- Why embed: visualizes the entire investigation thesis in one frame.
- Slot-in: policy explainers, plaintiff-attorney CLE decks, MFCU coverage.
- Format: 2-circle Venn with shaded intersection + facility names.
- Difficulty: low (after overlap list is verified).

### D. Allegiant Healthcare of Mesa timeline: 33 violations 2019-2025, $8,400 fine 2023
- Insight: a single named facility carries 33 deficiencies and continues to operate.
- Why embed: case-study journalism uses one anchor facility. Plaintiff firms link as proof point.
- Slot-in: Mesa local coverage, plaintiff-firm content marketing.
- Format: horizontal timeline with citation density bars.
- Difficulty: medium (depends on Form 2567 narrative pull).

### E. Two-system enforcement architecture flow: AHCCCS OPI vs DHS LTC Licensing
- Insight: the structural reason oversight gaps exist.
- Why embed: explainer-grade. Strong for AARP, Consumer Voice, ombudsman training.
- Format: two parallel column flow with statute anchors.
- Difficulty: low.

---

## 2. Top Pick: Concept A (geographic dot map)

Highest reciprocity, broadest slot-in, factually load-bearing, no FLAG dependencies.

- **Title:** 52 of Arizona's 142 Nursing Homes Carry Low CMS Ratings
- **Subtitle:** More than one in three CMS-rated AZ facilities sit at 1 or 2 stars, the lowest two tiers of the federal scale.
- **Data points:**
  - 142 CMS-registered AZ nursing homes (CMS Care Compare)
  - 52 facilities at 1- or 2-star (CMS Care Compare aggregator pull)
  - Named anchors plotted: Allegiant Healthcare of Mesa (Mesa), Allegiant Healthcare of Phoenix (Phoenix), Life Care Center of Tucson (Tucson), Arizona State Veteran Home (Phoenix), Winslow Campus of Care (Winslow)
  - Source line: CMS Care Compare, May 2026 pull
- **Visual structure:** AZ state outline with county lines (light navy stroke). Dot per low-rated facility, sienna for 1-star, gold for 2-star. Larger dots for facilities with documented abuse/neglect citations. Top-right inset legend. Bottom: count callout "52 / 142".
- **Brand bug:** logo-light-hz.png bottom-left at 220px width. Bottom-right "Source: AZ Law Now investigation, May 2026 - azlawnow.com". Sienna (#C23B22) 5px left accent stripe.
- **Outputs:**
  - PNG 1200x675 (embed)
  - 1080x1080 (IG)
  - 1200x630 (OG)
  - 1500x500 transparent (Twitter)
- **Embed code:**
```html
<a href="https://azlawnow.com/investigations/arizona-nursing-homes-billing-fraud-and-abuse/" rel="dofollow">
  <img src="https://azlawnow.com/embeds/az-nursing-homes-low-rated-map.png"
       alt="Map of 52 Arizona nursing homes with 1- or 2-star CMS ratings, May 2026"
       width="1200" height="675" loading="lazy" />
</a>
<p><small>Source: <a href="https://azlawnow.com/investigations/arizona-nursing-homes-billing-fraud-and-abuse/" rel="dofollow">AZ Law Now investigation</a>, CMS Care Compare data.</small></p>
```

## 3. Brand Spec
Georgia 700 title 46-52px. Inter 400 body 18-22px. Palette: navy #0E1B2C shadows, sienna #C23B22 accent, gold #D4A24C highlights, off-white #F4EFE6 background. Sienna 5px left stripe. Logo bottom-left, source attribution bottom-right.

## 4. Build Path
Sharp + SVG composition matching `scripts/gen-arizona-nursing-homes-billing-fraud-and-abuse-images.ts`. For the map: D3 d3-geo + AZ TopoJSON rendered via `d3-node` to SVG, then composite with Sharp. Single TS script outputs all four sizes.

## 5. Distribution
1. Embed at top of investigation page above first H2.
2. Standalone landing at `/investigations/arizona-nursing-homes-billing-fraud-and-abuse/embed/` with one-click copy embed widget.
3. Pitch-followup email body includes embed code + 1200x675 inline preview.
4. Social: 1080x1080 to IG, 1200x675 to LinkedIn (Davis-Young, Demers, Sanchez, Ritchie tagged), Twitter card to AARP-AZ + Consumer Voice + Disability Rights AZ + ombudsman handles.

---

## 6. Stack Decision

Three production paths evaluated against the five visual concepts ranked in Section 1.

### Path 1: Figma-driven export

**Use case fit:** Concept B (APS bar chart), Concept E (two-system flow). Both are layout-led, low-data-density, and benefit from designer-grade typography and the existing brand component library on the AZ Law Now Brand Exploration board. The 5px sienna left stripe, Georgia 700 lockup, logo bug, and source attribution are already wired as Figma components, so a new asset starts at 80% complete.

**Time to first asset:** 25 to 40 minutes. Open Figma, duplicate a chart frame, swap data labels, export PNG/SVG at 4 sizes via Figma's export presets. Slowest step is the manual export and rename loop unless we wire the Figma REST API.

**Brand consistency:** Highest possible. Color tokens, type ramps, logo placement, source attribution all enforced as instance overrides of master components. Zero drift risk.

**Attribution / embed code:** Manual. After export, we hand-write the embed snippet (or reuse the template in Section 2). Asset URL pattern: `azlawnow.com/embeds/<slug>.png`.

**Programmatic regeneration on data update:** Weak. The 142/52 numbers live as text layers in Figma. A quarterly CMS refresh requires opening the file, editing labels, re-exporting. The Figma REST API can read and write text layers programmatically (we have GEMINI/Anthropic experience but would need to build a small node script that hits `PATCH /v1/files/:key/nodes` with new label values, then triggers PNG export via `GET /v1/images/:key`). Roughly a one time 4 hour build to make Figma-sourced assets regenerate on data change. Worth it only if we plan to ship 6+ Figma-sourced visuals.

### Path 2: Sharp + SVG programmatic

**Use case fit:** Concept A (geographic dot map), Concept D (Allegiant timeline). Anything with a geographic projection or a data-bound coordinate system is dramatically faster in code than in Figma. Matches the existing `scripts/gen-arizona-nursing-homes-billing-fraud-and-abuse-images.ts` pattern, so the brand chrome (logo, sienna stripe, source bug, four output sizes) is already a function call.

**Time to first asset:** 90 to 150 minutes for the first map (writing the d3-geo + AZ TopoJSON + dot-overlay code). Subsequent regenerations are seconds. Concept D timeline would be 60 to 90 minutes since it reuses bar/box primitives.

**Brand consistency:** Approximated, not pixel-matched. We codify the same hex values (#0E1B2C, #C23B22, #D4A24C, #F4EFE6), the same Georgia 700 / Inter pairing, the same 5px stripe and logo placement, but we are reimplementing the Figma component spec in TypeScript rather than referencing it. Risk of drift is real if the Figma board updates and the TS doesn't. Mitigation: extract a `lib/brand-tokens.ts` shared module the gen scripts all import.

**Attribution / embed code:** Fully scripted. The gen script writes the four PNG sizes to `public/embeds/` and writes the embed HTML snippet to a sibling `.html` file. The `/embed/` standalone page reads from those artifacts.

**Programmatic regeneration on data update:** Strongest of the three. Re-run `pnpm tsx scripts/gen-az-nursing-homes-low-rated-map.ts --refresh` after a CMS Care Compare pull. Quarterly cadence is exactly what this path is built for. Wire it to a cron-shaped scheduled task and the asset never goes stale.

### Path 3: Claude Design / Imagen

**Use case fit:** None of the five Section 1 concepts. Image-gen models are strong for emotional cover art, hero scenes, and stylized illustrations where exact data fidelity is not required. Every concept in Section 1 is data-load-bearing: a hallucinated facility location, a wrong "52" label, or a misshaped Arizona state outline torpedoes journalist trust and kills the embed proposition. Imagen would be the right path for a separate "people who live in these facilities" emotional cover image to sit above the investigation H1, but not for the embed-bait visual itself.

**Time to first asset:** 5 to 10 minutes per generation, but multiply by N attempts to get geographic accuracy and brand fidelity (N is high, usually 8 to 15 attempts, often unsuccessful for state-shape precision).

**Brand consistency:** Approximate. We can pass a brand reference image and a tight color/typography prompt, but the model will interpret rather than enforce. Acceptable for emotional imagery, unacceptable for an asset that sits in a journalist's article as a chart.

**Attribution / embed code:** Manual. Same as Figma path.

**Programmatic regeneration on data update:** Effectively no. Each refresh is a new generation with new variance. Cannot promise visual continuity quarter to quarter.

### Decision: Path 2 (Sharp + SVG programmatic) for the top-pick visual

The top pick is Concept A, the geographic dot map of 52 of 142 low-rated AZ nursing homes. It is data-load-bearing (the 52/142 ratio and the named anchor facilities are the embed proposition), it requires geographic precision (AZ state shape, county lines, Maricopa/Pima clustering), and the source data refreshes quarterly with CMS Care Compare. Path 2 is the only path that satisfies all three constraints without manual intervention per refresh, and it cleanly extends the existing `gen-arizona-nursing-homes-billing-fraud-and-abuse-images.ts` pattern. Brand consistency drift is the one weakness, mitigated by extracting `lib/brand-tokens.ts` from the Figma board on first build and pinning the AZ Law Now Brand Exploration node IDs in a comment for future audits. We reserve Figma for the lower-data-density companions (Concept B bar chart, Concept E flow diagram) and reserve Imagen for non-data emotional imagery elsewhere on the investigation page.
