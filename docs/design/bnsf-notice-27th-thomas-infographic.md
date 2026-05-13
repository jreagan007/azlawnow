# Design Brief: BNSF Notice at 27th & Thomas (Composite Long-Scroll)

**Companion to:** `docs/strategy/bnsf-notice-27th-thomas-build-log.md`, `docs/strategy/bnsf-notice-27th-thomas-investigation-refocus.md`, `docs/drafts/bnsf-notice-27th-thomas-WORKING-DRAFT.mdx`, `data/research/fra-pulls/`.
**Date:** 2026-05-13
**Stage:** Design brief, ready for human-in-the-loop Figma build per `viral-infographic-az` skill protocol.
**HOLD:** No Figma build, no PNG export, no asset commits until Brandon Millam J.D. clears the publication question. See `docs/strategy/bnsf-notice-27th-thomas-CLIENT-HOLD.md`.

---

## 1. The asset

One 1500x2400 composite long-scroll in the AZ Law Now Sunset Editorial palette (Newsprint background, Headline Black headings, Golden Hour accent, Alert Vermillion urgent highlights, Burnt Sienna warm secondary, Dusk Slate body text). Embed-ready, UTM-tagged anchor link to the investigation. Seven panels.

The asset carries the story BNSF wrote on itself. The federal record. The structural failure modes in BNSF's own words. The 131-day gap. The mitigations specified by 49 CFR Part 222 and MUTCD Part 8 that were not installed.

The asset does NOT carry: any legal-conclusion language ("BNSF was on notice"), any litigation-theory framing, any pedestrian-fatality fear-baiting, any Sonja Celius photograph. The asset is factual reporting on a public record.

---

## 2. Type stack

| Use | Family | Weight | Size |
|---|---|---|---|
| Hero headline | Cormorant Garamond | Bold | 56px (1500w canvas) |
| Section headlines | Cormorant Garamond | Bold | 36px |
| Subheads | DM Sans | Semi Bold | 22px |
| Body | DM Sans | Regular | 18px |
| Pull-quote / BNSF narrative | DM Sans | Medium Italic | 24px |
| Captions / source attribution | JetBrains Mono | Regular | 14px |
| Brand strip | Cormorant Garamond | Bold | 22px tracking 2px |

Selective-bold pattern: every panel headline lifts load-bearing nouns into DM Sans Bold inside the Semi Bold sentence. Reference: the recall-pillar 7-panel composite at mesowatchorg as the discipline anchor.

---

## 3. Color palette (locked from src/styles/theme.ts)

| Element | Token | Hex |
|---|---|---|
| Page background | Newsprint | #FAF5ED |
| Headline + nav | Headline Black | #1A1A1A |
| Body text | Dusk Slate | #4A5859 |
| Primary accent | Golden Hour | #D4943A |
| Hover accent | Gold Hover | #C2842E |
| Urgent / alert / pull-quote bar | Alert Vermillion | #C23B22 |
| Warm secondary | Burnt Sienna | #8B4513 |
| Hairline grid | Neutral 200 | #E8DFD0 |
| Panel borders | Neutral 300 | #D4C9B8 |

One-accent-per-panel discipline. Golden Hour is the panel accent for the FRA Form panels (panels 3, 4, 5). Alert Vermillion is reserved for Panel 6 (mitigations-not-installed table). Burnt Sienna is the brand-strip accent.

---

## 4. Brand messaging layer

Three surfaces locked, always present on every Tier-S long-scroll.

### Top banner (above Panel 1)

`AZ LAW NOW · YOU GET ANSWERS`

Cormorant Garamond Bold uppercase, Newsprint #FAF5ED text on Headline Black #1A1A1A strip, 22px, tracking 2px. Hairline Golden Hour vertical separators between the words.

### Mid-scroll micro-anchor (between Panels 3 and 4)

`Independent data journalism on Arizona public records.`

DM Sans Medium 22px, Dusk Slate #4A5859 on Newsprint.

### Closing band (top of Panel 7)

`Arizona families deserve answers on what the public record says.`

Selective-bold on "**answers**." Cormorant Garamond Bold 36px, Headline Black, on Newsprint.

### AZ Law Now lockup (every panel)

Lower-right corner of each panel. Brand asset from `public/assets/logos/`. White or Newsprint version depending on panel background.

---

## 5. Psychographic audience: `arizona-civic-readers`

Per `.claude/skills/viral-infographic-az/SKILL.md` Phase 2 emotional resonance map.

**Lean into:** structural finding (the FRA filings document the failure mode), Fractl-canonical methodology (every claim traces to a primary source), cited primary sources every panel, public-record framing.

**Banned framings:** "BNSF was on notice," "every parent's nightmare," service-betrayal narratives, partisan signaling, attorney-advocacy rhetoric, pedestrian-fatality fear photos, manufactured urgency.

---

## 6. Viral guardrails

- No manufactured fear
- No legal CTA on the visual
- Person-first in alt text and captions
- No quoting Sonja Celius directly (no client confidences)
- No photograph of Sonja Celius
- No naming Phoenix PD officers, BNSF dispatchers, or BNSF engineers
- No locomotive serial numbers (the train designations in BNSF's filings are operating designators, those are public)
- The BNSF narratives quoted verbatim; nothing paraphrased
- Every BNSF narrative quote tagged "FRA Form 6180.57 narrative, BNSF Railway Company, [date], DOT 025617C"

---

## 7. Panel-by-panel spec

### Panel 1: Hero

- Background: Newsprint #FAF5ED
- Top banner: AZ LAW NOW · YOU GET ANSWERS
- Headline (Cormorant Bold 56px): "**Four months** before Sonja Celius was struck at 27th Avenue, BNSF told the FRA in writing that vehicles were entering the twin crossing at Thomas Road from a direction that did not have gates."
- Subhead (DM Sans Semi Bold 22px): "The federal record on a Phoenix grade-crossing corridor and the two-quadrant gate retrofit that did not include the mitigations specified by 49 CFR Part 222."
- Bottom strip: source line + AZ Law Now lockup

### Panel 2: The geometry

- Background: Newsprint
- Section anchor (Golden Hour uppercase tracking 2px): "THE TWIN CROSSINGS"
- Aerial diagram of 27th Avenue + Thomas Road grade crossings. Single BNSF Phoenix Subdivision main, mileposts 189.580 to 189.615. Two crossings approximately 50 feet apart. Annotated:
  - DOT 025430G = 27th Avenue
  - DOT 025617C = Thomas Road
  - BNSF Phoenix Subdivision, single main track
  - 12 trains per day, max timetable 40 mph
  - Combined AADT above 70,000 vehicles
- Footer caption (JetBrains Mono 14px): "Source: FRA Highway-Rail Grade Crossing Inventory, Form 6180.71 last revised 2025-07-18"

### Panel 3: The timing race ("AUTO PRECEDED GATES")

- Background: Newsprint, Golden Hour accent bar at top
- Section anchor: "THE TIMING RACE"
- Headline: "BNSF wrote 'AUTO PRECEDED GATES' twice in two months at the same crossing."
- Diagram: two-quadrant gate timing sequence. Show the interval between first flash and gate fully down. Annotated 49 CFR Part 234 reference.
- Pull-quote block 1 (Alert Vermillion bar, DM Sans Medium Italic 24px):
  > "YPHX203115 PULLING ON SINGLE MAIN TRACK STRUCK AN AUTO THAT PRECEDED GATES AT A HGX. DRIVER TOOK OFF."

  Attribution caption: "FRA Form 6180.57 narrative, BNSF Railway Company, 2025-06-15, DOT 025617C"
- Pull-quote block 2:
  > "YPHX203107 PULLING ON SINGLE MAIN TRACK STRUCK AN OCCUPIED AUTO AT HGX EQUIPPED WITH GATES. AUTO PRECEDED GATES."

  Attribution: "FRA Form 6180.57 narrative, BNSF Railway Company, 2025-08-07, DOT 025617C"
- Footer caption: source URL for both FRA pulls

### Panel 4: The directional gap

- Background: Newsprint, Golden Hour accent bar at top
- Section anchor: "THE DIRECTIONAL GAP"
- Headline: "**BNSF identified a directional defect** of the two-quadrant gate configuration. In writing."
- Cross-section diagram: two-quadrant gate placement vs four-quadrant gate placement. Arrow annotation showing the direction of approach without gate coverage.
- Pull-quote (large, Alert Vermillion bar):
  > "QPHXCHI114 LIGHT POWER ON SINGLE MAIN TRACK STRUCK AN OCCUPIED AUTO AT A HGX EQUIPPED WITH GATES. THE AUTO CAME UP AGAINST THE DIRECTION OF TRAFFIC FLOW NOT HAVING GATES. NO DERAILMENT. NO HAZMAT RELEASE. 1 PASSENGER INJURY."

  Attribution: "FRA Form 6180.57 narrative, BNSF Railway Company, 2025-12-15, DOT 025617C"
- Footer: "1 passenger injured. 28-year-old male driver. 2:45 AM. Dark."

### Panel 5: The chronology

- Background: Newsprint
- Section anchor: "THE CHRONOLOGY"
- Vertical timeline, top-to-bottom. Sunset palette: pre-gate entries in Dusk Slate, post-gate entries in Alert Vermillion or Golden Hour.
  - 03/20/2021: Fatal pedestrian (Thomas Rd)
  - 02/17/2022: Fatal pedestrian (Thomas Rd)
  - 11/04/2022: Wheelchair user injured
  - 10/01/2023: Fatal pedestrian (27th Ave)
  - 10/12/2023, 11/25/2023: Injured pedestrians
  - 06/2024: BNSF + City of Phoenix install two-quadrant gates
  - **06/15/2025: Auto preceded gates (Thomas Rd)**
  - **08/07/2025: Auto preceded gates (Thomas Rd)**
  - **12/15/2025: Direction not having gates, 1 passenger injured (Thomas Rd)**
  - 04/25/2026: Sonja Celius struck (27th Ave)
- Footer caption: "FRA Form 6180.57 records, DOT 025430G and DOT 025617C. April 25, 2026 incident not yet in FRA snapshot (Form 6180.57 filing latency approximately 30 days)."

### Panel 6: Mitigations not installed

- Background: Newsprint, Alert Vermillion accent bar at top
- Section anchor: "MITIGATIONS NOT INSTALLED"
- Headline: "Four federal mitigations specified by 49 CFR Part 222 and MUTCD Part 8. None at this corridor."
- Side-by-side table:

| Mitigation | Specified by | At 27th Ave | At Thomas Rd |
|---|---|---|---|
| Channelizing medians | 49 CFR 222 Appendix A | No | No |
| Four-quadrant gates | 49 CFR 222 Appendix A | No | No |
| Pedestrian-specific gates | MUTCD Part 8 | No | No |
| Wayside horns | 49 CFR 222 Appendix E | No | No |
| Quiet-zone designation | 49 CFR 222 Subpart B | No (WHISTBAN=0) | No (WHISTBAN=0) |

- Footer caption: "FRA Highway-Rail Grade Crossing Inventory, Form 6180.71 last revised 2025-07-18"

### Panel 7: Closing band + lockup

- Background: Newsprint
- Closing-band statement: "Arizona families deserve **answers** on what the public record says."
- Three-line sub-block (DM Sans Regular 18px, Dusk Slate):
  - "AZ Law Now built this report from primary sources."
  - "The FRA records are public. The records-request packet is filed."
  - "Cite the public records. Embed this report with credit. The dataset travels with the link."
- AZ Law Now lockup, bottom center
- Footer: "AZLAWNOW.COM/INVESTIGATIONS/27TH-AVE-THOMAS-RD-BNSF-CROSSING"
- ALN counsel-of-record disclaimer (small, JetBrains Mono 11px): "AZ Law Now is counsel of record for Sonja Celius. This editorial reports on public records. Nothing here is an extrajudicial statement on the merits of any underlying claim."

---

## 8. Cut-asset matrix

| Platform | Dimensions | Cut from |
|---|---|---|
| Master pillar embed | 1500x2400 | All 7 panels stacked |
| X / Twitter post | 1200x675 | Panel 1 hero |
| X / Twitter post | 1200x675 | Panel 4 directional-gap diagram |
| X / Twitter post | 1200x675 | Panel 5 chronology |
| Facebook link card | 1200x630 | Panel 1 hero |
| LinkedIn post | 1200x627 | Panel 6 mitigations-not-installed table |
| IG square | 1080x1080 | Panel 4 + pull-quote |
| IG Story | 1080x1920 | 3-frame Story: Panel 1 hook + Panel 4 pull-quote + Panel 7 lockup |
| Bluesky | 1200x675 | Panel 4 |

---

## 9. v1 enrichment briefs (asset harvest)

Per `viral-infographic-az` skill Phase 3.5. Drop into `public/images/infographics/bnsf-notice-27th-thomas/figma-assets/`.

- `01-azlawnow-brand/`: AZ Law Now logo (dark + light), color swatches, type-spec card
- `02-agency-seals/`: FRA seal, City of Phoenix seal, ADOT seal (all public-domain government seals)
- `03-corporate-logos/`: BNSF Railway Company logo (factual attribution, not endorsement)
- `04-county-maps/`: Maricopa County base map SVG (Wikipedia public domain)
- `05-arterial-maps/`: Phoenix street grid reference, BNSF Phoenix Subdivision alignment
- `06-document-icons/`: FRA Form 6180.57 sample header icon, FOIA seal icon
- `07-product-photos/`: Aerial photograph of the 27th Ave + Thomas Rd intersection (Google Earth or aerial provider, dated, with attribution)
- `08-icons-noun-project/`: Concepts: train, gate arm, crossbuck, pedestrian, wheelchair user, calendar, location pin, document

---

## 10. Acceptance criteria (Opus critique gates)

Per `TIER-QA-GATE-MATRIX.md` Tier-S column.

- [ ] All 7 panels present, sequence locked
- [ ] Brand strip + AZ Law Now lockup on every panel
- [ ] One accent per panel (Golden Hour OR Alert Vermillion OR Burnt Sienna, not multiple)
- [ ] Selective-bold pattern on every headline
- [ ] BNSF narratives quoted verbatim from `data/research/fra-pulls/fra-025617C.txt`
- [ ] Every footer caption traces to a primary source URL
- [ ] Mitigations table column values match FRA Form 6180.71 inventory revision 2025-07-18
- [ ] Cross-panel consistency: dates, DOT numbers, mile-post values match across all panels
- [ ] No em-dashes anywhere
- [ ] Counsel-of-record disclaimer present on Panel 7
- [ ] No Sonja Celius photograph
- [ ] No legal-conclusion language
- [ ] Person-first alt text on every image

---

## 11. Embed snippet (generated at Phase 5 when canonical PNG lands)

```html
<a href="https://azlawnow.com/investigations/27th-ave-thomas-rd-bnsf-crossing/?utm_source=embed&utm_medium=infographic&utm_campaign=bnsf-notice-27th-thomas-2026-05" target="_blank" rel="noopener">
  <img src="https://azlawnow.com/images/infographics/bnsf-notice-27th-thomas/composite-1500w.png" alt="The federal record on the 27th Avenue and Thomas Road BNSF grade crossings in west Phoenix. Three BNSF Form 6180.57 accident filings in 2025 document two structural failure modes of the June 2024 two-quadrant gate retrofit." width="1500" loading="lazy" style="width:100%;height:auto;" />
</a>
<p style="font-size:11px;color:#6b7280;margin:0.5rem 0 0;">Source: <a href="https://azlawnow.com/investigations/27th-ave-thomas-rd-bnsf-crossing/">AZ Law Now</a>. Free to embed with credit. AZ Law Now is counsel of record for Sonja Celius. Editorial commentary on public records.</p>
```

---

*End of design brief. HOLD until Brandon clears the publication question. Pre-build asset harvest can proceed in parallel under the harvest-only flag.*
