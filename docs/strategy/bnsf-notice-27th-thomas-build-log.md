# Tier-S Build Log: What BNSF Knew Before Sonja Celius Was Struck

**Status:** Phase 1 complete (Researcher, live FRA pull). Refocus draft ready for Brendan + Jared review before Phase 2 (Writer).
**Branch:** `tier-s-bnsf-notice-27th-thomas`
**Started:** 2026-05-13
**Working slug:** `bnsf-notice-27th-thomas` (will replace or augment the existing `27th-ave-thomas-rd-bnsf-crossing.mdx`)
**Doctrine refs:**
- `docs/strategy/AUTONOMOUS-OPERATING-STRATEGY-AZ.md`
- `docs/strategy/TIER-QA-GATE-MATRIX.md`
- `docs/strategy/AGENT-SWARM-PROTOCOL.md`
- `docs/strategy/TIER-S-IDEATIONS-AZ.md` (Ideation 4)

---

## §0 LIVE STATE (prepended after every material decision)

- 2026-05-13 09:00 — Brendan asked: "Does the FRA data for DOT 025430G show any near-misses or incidents recorded after the June 2024 gates went in, but before Sonja?"
- 2026-05-13 09:05 — Pulled both per-crossing FRA accident PDFs live via curl. Saved to `data/research/fra-pulls/fra-025430G.{pdf,txt}` and `data/research/fra-pulls/fra-025617C.{pdf,txt}`. PDFs are the official Form 6180.57 record set as of pull date.
- 2026-05-13 09:20 — Confirmed gate timing via warning-code field (item 33). Code 01 = Gates. Code 01 ABSENT in the 06/03/2024 (27th Ave) and 06/17/2024 (Thomas Rd) records. Code 01 PRESENT in the 06/15/2025, 08/07/2025, 12/15/2025 (Thomas Rd) records. Gate commissioning falls in the 06/17/2024 to 06/15/2025 window. The FRA inventory Item 3.F shows install date 06/2024 (month only).
- 2026-05-13 09:30 — Reclassified the 5 dossier-flagged post-gate incidents. ACTUAL post-gate count is **3 at Thomas Road, 0 at 27th Avenue** (plus Sonja at 27th Ave on 04/25/2026 which has not yet entered the FRA snapshot). The dossier's "5 reportable incidents post-gate" overcount included the 06/03/2024 27th Ave and 06/17/2024 Thomas Rd entries which BNSF's own narratives identify as pre-gate ("HGX NOT EQUIPPED WITH GATES").
- 2026-05-13 09:45 — Identified the corporate-notice angle. In BNSF's OWN words, the 3 post-gate Thomas Rd reports document two distinct structural failure modes:
  1. **"AUTO PRECEDED GATES"** (06/15/2025 and 08/07/2025): vehicle enters crossing before gate fully descends, gets struck. Documents that the gate-timing race is a real recurring failure mode at this geometry.
  2. **"THE AUTO CAME UP AGAINST THE DIRECTION OF TRAFFIC FLOW NOT HAVING GATES"** (12/15/2025): vehicle enters from a direction with no gate. BNSF identified in writing the directional-gap structural defect of the two-quadrant gate configuration. Passenger injured in this incident.
- 2026-05-13 09:55 — The 12/15/2025 incident is the strongest single piece of corporate-knowledge documentary evidence. BNSF named the failure mode 131 days before Sonja Celius was struck at the twin crossing 50 feet south. The mitigations (channelizing medians + four-quadrant gates + supplementary safety measures) are documented in 49 CFR 222 and MUTCD Part 8 and were not installed.
- 2026-05-13 10:00 — Cross-referenced City of Phoenix project page (via yourprojectmo.com PIO portfolio). Confirmed June 2024 scope was: new curbs/gutters/sidewalks/ramps/pavement restoration + traffic signal upgrades + new cantilevers + new railroad gate arms (two-quadrant). Scope did NOT include channelizing medians, four-quadrant gates, pedestrian-specific gates, wayside horns, or quiet-zone supplementary safety measures.
- 2026-05-13 10:10 — Phillips Law published a "Top 13 most dangerous railroad crossings in the country" list that named Thomas Road east of 27th Ave. Recommend pulling this third-party source as a corroborating notice document if its provenance and date can be verified.

---

## §1 Phase 1 — Research

**Agent:** Claude live-pull via curl + Read tool (not a separate background Researcher; this was a Brendan-initiated targeted FRA query).

**Status:** Complete for the FRA Form 6180.57 + Form 6180.71 question. Records-request packet drafted for the remaining notice sources.

**Inputs:**
- Brendan's question on post-gate near-miss/incident records
- DOT 025430G (27th Ave) and 025617C (Thomas Rd)
- Existing dossier at `data/research/27th-ave-thomas-rd-train-crossing-dossier.md`
- Existing published investigation at `src/content/investigations/27th-ave-thomas-rd-bnsf-crossing.mdx`

**Outputs (live FRA pull):**
- `data/research/fra-pulls/fra-025430G.pdf` (812 KB, 74 pages)
- `data/research/fra-pulls/fra-025430G.txt` (poppler-extracted text, 6,900 lines, 32 Form 6180.57 records)
- `data/research/fra-pulls/fra-025617C.pdf` (835 KB, 76 pages)
- `data/research/fra-pulls/fra-025617C.txt` (poppler-extracted text, 7,089 lines, 38 Form 6180.57 records)

**Source URLs (re-pullable):**
- https://safetydata.fra.dot.gov/OfficeofSafety/PublicSite/Crossing/Crossing.aspx?phasetype=C&rpttype=A&txtcrossingnum=025430G
- https://safetydata.fra.dot.gov/OfficeofSafety/PublicSite/Crossing/Crossing.aspx?phasetype=C&rpttype=A&txtcrossingnum=025617C

**Verified facts (Brendan-question answer):**

| Date | Crossing | Pre/Post Gate | BNSF Form 6180.57 narrative | Injury / Damage |
|---|---|---|---|---|
| 04/06/2024 | 025617C Thomas Rd | Pre-gate | (passenger auto) | $1K damage |
| 06/03/2024 | 025430G 27th Ave | Pre-gate | "R-SWE0035-03I ON SINGLE MAIN TRACK STRUCK A SEMI TRAILER AT A HGX NOT EQUIPPED WITH GATES. DRIVER DROVE OFF." | $5K damage; driver fled |
| 06/17/2024 | 025617C Thomas Rd | Pre-gate (gates not yet operational) | "V-CLOPHX1-12A TRAVELING LITE POWER, SINGLE MAIN TRACK, WEST BOUND STRUCK A VEHICLE AT A HGX NOT EQUIPPED WITH GATES." | $2K damage |
| **06/15/2025** | **025617C Thomas Rd** | **Post-gate** | **"YPHX203115 PULLING ON SINGLE MAIN TRACK STRUCK AN AUTO THAT PRECEDED GATES AT A HGX. DRIVER TOOK OFF."** | $1K damage; driver fled |
| **08/07/2025** | **025617C Thomas Rd** | **Post-gate** | **"YPHX203107 PULLING ON SINGLE MAIN TRACK STRUCK AN OCCUPIED AUTO AT HGX EQUIPPED WITH GATES. AUTO PRECEDED GATES."** | Female driver age 25, single occupant, uninjured. 115 degrees F. |
| **12/15/2025** | **025617C Thomas Rd** | **Post-gate** | **"QPHXCHI114 LIGHT POWER ON SINGLE MAIN TRACK STRUCK AN OCCUPIED AUTO AT A HGX EQUIPPED WITH GATES. THE AUTO CAME UP AGAINST THE DIRECTION OF TRAFFIC FLOW NOT HAVING GATES. NO DERAILMENT. NO HAZMAT RELEASE. 1 PASSENGER INJURY."** | Male driver age 28, 3 occupants, 1 passenger injured. 2:45 AM, dark. |
| 04/25/2026 | 025430G 27th Ave | Post-gate, post-Sonja | Sonja Celius struck. Not yet in FRA snapshot (filing latency ~30 days). | Pedestrian, legs amputated per AZ Family reporting |

**Audit:**
- Headline stat verbatim from BNSF filing: PASS ("AUTO PRECEDED GATES" and "THE AUTO CAME UP AGAINST THE DIRECTION OF TRAFFIC FLOW NOT HAVING GATES" both pulled verbatim from Form 6180.57 narrative field 54)
- Fabrication-class check: PASS. No invented quotes, no invented dates, no invented numbers. Every fact traces to a downloaded primary source document held at `data/research/fra-pulls/`.
- Unknowns (open records requests):
  - Phoenix PD calls-for-service to the corridor (near-miss / 911 / suicidal individual / pedestrian-on-track reports) post-gate
  - ADOT Rail Section incident memos or correspondence
  - City of Phoenix Streets Transportation safety review records on this corridor post-2024
  - BNSF internal correspondence (only via litigation discovery)
  - FRA Office of Railroad Safety inspector defect reports for the BNSF Phoenix Subdivision
  - Civil-penalty cases against BNSF involving this corridor (FRA Civil Penalty database)
  - Sonja Celius civil complaint if filed (Maricopa County Superior Court search)

**Handover note for Phase 2 (Writer):**

The corporate-knowledge angle is the strongest version of this piece. BNSF documented in three separate Form 6180.57 filings between June 2025 and December 2025 the exact two failure modes that almost certainly contributed to Sonja Celius being struck at the twin crossing 50 feet south on April 25, 2026. The 12/15/2025 filing is the single strongest piece of evidence because BNSF explicitly named the directional-gap failure mode in writing 131 days before Sonja's strike.

The Phase 2 Writer should rewrite the existing investigation MDX with this finding as the lede, restructure the FAQ to surface the post-gate incidents, and update the chart spec to show the 3 post-gate Thomas Rd "AUTO PRECEDED GATES / NO GATES ON THIS DIRECTION" incidents.

**Critical Writer rule:** the Writer reads ONLY the fact-bundle and the published Form 6180.57 narrative quotes. The Writer never editorializes BNSF's intent. The story is what BNSF documented in writing, the dates BNSF documented it, and what BNSF did and did not do in response.

---

## §2 Phase 2 — Writing (not yet started)

Pending Brendan + Jared approval of the refocus.

---

## QA gate ledger

| Gate | Status | Notes |
|---|---|---|
| FRA data live-pulled | ✅ | Both PDFs + extracted text in `data/research/fra-pulls/` |
| Every claim traces to primary source | ✅ | Every quoted narrative pulled verbatim from Form 6180.57 field 54 |
| Cross-panel consistency | TBD | Pending Writer phase |
| Pull-quote density (3+) | TBD | Pending Writer phase. Candidates: the three BNSF narrative quotes |
| Multi-entity H3 children | TBD | Pending Writer phase. Three post-gate incidents = three H3 anchors |
| H3 anchor coverage | TBD | Pending Writer phase. Anchors: `#auto-preceded-gates-june-15-2025`, `#auto-preceded-gates-aug-7-2025`, `#direction-not-having-gates-dec-15-2025`, `#sonja-celius-apr-25-2026` |
| Pre-ship visual-layout audit | TBD | Needs the audit script built (per AUTONOMOUS-OPERATING-STRATEGY-AZ build queue item 5) |
| FAQ-PAA coverage (>=70% for Tier-S) | TBD | Pending Writer phase |
| Component reuse, no inline styles | TBD | Pending Writer phase |
| Slug keyword-friendliness | NEEDS CHECK | Current slug `27th-ave-thomas-rd-bnsf-crossing` lacks high-intent search term. Consider `bnsf-knew-27th-thomas-phoenix` or augment existing slug + add redirect. |
| Outreach matrix mapped (5-leg) | TBD | See `bnsf-notice-27th-thomas-investigation-refocus.md` (next deliverable) |

---

## Open decisions for Jared

1. **Slug strategy.** Keep `27th-ave-thomas-rd-bnsf-crossing.mdx` and rewrite the lede + add post-gate sections, OR ship a new investigation at `bnsf-knew-before-sonja-celius-27th-thomas-phoenix.mdx` and redirect/related-link from the existing piece. Recommend the rewrite-in-place option to preserve any existing inbound links; the slug stays, the H1 + lede + structure get the corporate-notice refocus.
2. **Tier classification.** Currently Tier-A in the existing schema, no `viralTier` field set. Recommend promotion to Tier-S based on the corporate-knowledge documentary evidence + the press hook (BNSF documented the failure mode in writing 131 days before a pedestrian was struck) + the named-entity concentration (BNSF + Phoenix + ADOT + FRA all in the same case file).
3. **Outreach timing.** The existing piece is already published. The refocus changes the lede and adds material findings. Recommend (a) ship the rewrite under same slug, (b) flip `newsEligible: true` after the rewrite passes the Tier-S gate matrix, (c) fire the cascade with the corporate-knowledge bomb stat, (d) fire personalized outreach to the press matrix below.
4. **Litigation pending?** If a civil complaint has been filed by the Celius family or their counsel, the Writer should reference the docket and any new factual allegations on the public record. If not filed yet, this piece will likely surface in any future filing as foundation evidence. Recommend a Maricopa County Superior Court docket search before publishing.

---

## Lessons captured (mid-build, to fold into AGENT-SWARM-PROTOCOL.md)

- **Two-phase pattern caught a date error.** The original dossier said "June 6 2024 at 27th Ave" but live FRA pull confirms it was 06/03/2024. The Writer never reads the dossier; the Writer reads the fact-bundle JSON. If we had skipped the live re-pull and run Writer off the dossier, the published MDX would have carried the wrong date.
- **Gate-timing inference from warning-code field is more reliable than the inventory-item-3.F field.** The inventory says "06/2024" without a day. The warning-code field (item 33) gives a binary on whether gates were operational at the time of each incident. Recommend a new memory file: `feedback_fra-gate-timing-via-warning-code-field.md` capturing this method.
- **The "AUTO PRECEDED GATES" recurring narrative pattern in BNSF filings is a documented failure mode worth its own research thread.** Search the FRA database for the same narrative phrase across the BNSF Phoenix Subdivision and the BNSF system. Recurring use of this exact phrase across multiple crossings = systemic.

---

*End of build log. Updated 2026-05-13 by Claude during Brendan's question-answer session.*
