# Component Sweep — 2026-05-11

Five parallel Sonnet agents scanned all 83 MDX files in `src/content/` for raw
markdown that should be styled components.

**Total findings: ~85 fixes across 31 files.**

Bug type breakdown:
- **74 markdown tables** → should be `<DataTable>`
- **5 prose stat clusters** → should be `<StatGrid>`
- **4 numbered step lists** → should be `<Timeline>` (client-guides)
- **2 bare blockquotes** → should be `<Callout>` or `<Quote>`

---

## practice-areas (14 issues, 6 files)

| File | Line | Type | Snippet |
|---|---:|---|---|
| `daycare-negligence.mdx` | 49 | DataTable | `\| Age Group \| Arizona Ratio \| National Recommended \|` |
| `daycare-negligence.mdx` | 69 | DataTable | `\| Violation \| Pattern \|` |
| `daycare-negligence.mdx` | 93 | DataTable | `\| Injury type \| Facility duty \|` |
| `dog-bite.mdx` | 79 | DataTable | `\| Exception \| How it works \|` |
| `dog-bite.mdx` | 97 | DataTable | `\| Injury type \| Long-term impact \|` |
| `dog-bite.mdx` | 114 | DataTable | `\| Severity tier \| Typical range \| What drives the value \|` |
| `elder-abuse.mdx` | 51 | DataTable | `\| Category \| Definition \|` |
| `elder-abuse.mdx` | 114 | DataTable | `\| Defendant \| Basis for liability \|` |
| `rideshare-accidents.mdx` | 47 | DataTable | `\| Tier \| Driver status \| Required coverage \|` |
| `rideshare-accidents.mdx` | 93 | DataTable | `\| Additional wrinkle \| Why it matters \|` |
| `rideshare-accidents.mdx` | 100 | DataTable | `\| Scenario \| How the crash happens \|` |
| `school-abuse.mdx` | 101 | DataTable | `\| Claim type \| Legal theories \|` |
| `wrongful-death.mdx` | 57 | DataTable | `\| Damage category \| What's covered \|` |
| `wrongful-death.mdx` | 85 | DataTable | `\| Case type \| Key data and law \|` |

---

## legal-guides (29 issues, 10 files)

Heaviest offenders:
- `suing-school-district-arizona.mdx` — 6 tables
- `arizona-wrong-way-crash-law.mdx` — 5 tables
- `arizona-truck-accident-law.mdx` — 4 tables
- `arizona-wrongful-death-statute.mdx` — 3 tables
- `arizona-car-accident-law.mdx` — 3 tables
- `arizona-pedestrian-law.mdx` — 2 tables
- `arizona-elder-abuse-law.mdx` — 2 tables
- `arizona-drowsy-driving-law.mdx` — 2 tables
- `arizona-daycare-negligence-law.mdx` — 1 table
- `arizona-hit-and-run-law.mdx` — 1 table

Plus 1 bare `>` blockquote of ARS 12-821.01 in `arizona-educator-misconduct-civil-claims.mdx` line 53 → should be `<Callout type="info">` or `<Quote>`.

---

## client-guides (~32 issues, 11 files)

Most files have 2–4 markdown tables. Notable patterns beyond tables:
- `hit-and-run-victim-guide.mdx` line 130 — 10-step action list → `<Timeline>`
- `hit-by-drunk-driver.mdx` lines 34, 79, 111 — three numbered step sequences → `<Timeline>`
- `how-to-vet-arizona-daycare.mdx` line 97 — 10-question list → `<KeyFacts>` or `<Timeline>`
- `truck-crash-action-plan.mdx` line 122 — numbered first-week checklist → `<Timeline>`

Files with NO issues: `car-accident-first-48-hours`, `educator-harmed-my-child-arizona`, `flashbacks-after-arizona-car-crash`, `motorcycle-crash-action-plan`, `psychological-recovery-after-arizona-crash`, `survivors-guilt-after-a-crash`.

---

## investigations (16 issues, 11 files)

**DataTables needed (8):**
- `arizona-325-educator-discipline-2024.mdx:82` — misconduct category breakdown
- `arizona-daycare-violations.mdx:94` — west-valley facilities table
- `arizona-daycare-violations.mdx:230` — DCS code reference table
- `arizona-nursing-home-violations.mdx:131` — CMS data section table
- `arizona-school-bus-seat-belts.mdx:161` — 8 states with seat-belt laws
- `arizona-school-restraint-data.mdx:136` — west-valley district restraint rates
- `buckeye-durango-yuma-roundabout-rejected.mdx:86` — crash-reduction comparison
- `hit-and-run-maricopa-county-data.mdx:125` — felony classification table
- `west-valley-dangerous-intersections.mdx:140` — 5-intersection comparison
- `west-valley-dangerous-intersections.mdx:210` — interventions/impact table

**StatGrid needed (5):**
- `arizona-325-educator-discipline-2024.mdx:96` — county case counts
- `grand-court-mesa-elder-abuse-hb2228.mdx:83` — 9-stat bullet block
- `aps-korman-heat-disconnect-7m-settlement.mdx:75` — settlement allocation
- `asu-prep-related-party-lease.mdx:86` — federal pandemic funds
- `arizona-workers-comp-heat-denials.mdx:113` — 6 named heat-death victims

**Other (3):**
- `truck-crashes-maricopa-county-data.mdx:74` — corridor truck percentages → StatGrid
- `truck-crashes-maricopa-county-data.mdx:113` — violation breakdowns → DataTable
- `truck-crashes-maricopa-county-data.mdx:130` — Sun Belt VMT rates → DataTable
- `tempe-asu-pavement-180-day-claim-clock.mdx:95,124` — 2 raw blockquotes → `<Quote>`

---

## How to fix

For each issue:
1. Read the page, locate the snippet at the noted line
2. Import the component at the top of the file if not already imported (e.g., `import { DataTable } from '@/components/mdx/DataTable';`)
3. Replace the markdown with the corresponding component
4. For DataTable: `headers={[...]} rows={[[...], [...]]}`
5. For StatGrid: feed the stat values as props
6. For Timeline: convert numbered list into `events={[{date, title, description}, ...]}`
7. Bump `updatedAt` in frontmatter to today

Bus-accidents.mdx was the proof-of-concept fix (commit pending). Pattern is identical for all the rest.

---

## Prioritized fix order (by GSC impressions per `page-audit-2026-05-11.md`)

Highest-impression pages with component issues — fix these first:

| Impr 28d | File | Issues |
|---:|---|---:|
| 909 | `practice-areas/bus-accidents.mdx` | ✅ done |
| 721 | `practice-areas/elder-abuse.mdx` | 2 tables |
| 716 | `legal-guides/arizona-car-accident-law.mdx` | 3 tables |
| 701 | `legal-guides/arizona-hit-and-run-law.mdx` | 1 table |
| 667 | `legal-guides/arizona-motorcycle-law.mdx` | (clean — no issues) |
| 478 | `practice-areas/child-abuse.mdx` | (clean) |
| 444 | `practice-areas/motorcycle-accidents.mdx` | (clean) |
| 345 | `investigations/arizona-motorcycle-fatality-report.mdx` | (clean) |
| 208 | `practice-areas/slip-and-fall.mdx` | (clean) |
| 187 | `practice-areas/medical-negligence.mdx` | (clean) |
| 158 | `legal-guides/arizona-uninsured-motorist-law.mdx` | (clean) |
| 149 | `legal-guides/arizona-elder-abuse-law.mdx` | 2 tables |
| 142 | `practice-areas/wrongful-death.mdx` | 2 tables |
| 137 | `legal-guides/suing-school-district-arizona.mdx` | 6 tables |
