# Tier-7 Full-Corpus Fact-Check Sweep — Findings Worklist

> Working remediation list. NOT committed to content. Each confirmed
> citation-number error gets fixed + `updatedAt` bumped in one consolidated
> commit after all sweep agents report. Conservative rule: fix only where the
> cited value clearly contradicts the ARS citation bank or is internally
> self-contradicted; for genuinely unsettled legal nuance, add a conservative
> safety caveat — never invent law.

## CONFIRMED FIXES (clear citation-number / factual errors)

| # | file | locus | wrong | correct | severity |
|---|---|---|---|---|---|
| 1 | client-guides/hit-by-drunk-driver.mdx | FAQ line 29 | wrongful-death SOL "under ARS 12-542" | ARS 12-611 | CRITICAL |
| 2 | investigations/phoenix-dui-crashes-data.mdx | ~line 182 | min liability "A.R.S. 28-4135" | ARS 28-4009 | MEDIUM |
| 3 | legal-guides/arizona-dram-shop-liability.mdx | line 104 | wrongful-death "two years to file under ARS 12-542" | ARS 12-611 | HIGH |
| 4 | legal-guides/arizona-truck-accident-law.mdx | line 50 KeyFacts | "$750,000 ... trucks under 10,001 lbs" (inverted; own DataTable L156 says $300k under / $750k over) | "$750,000 ... over 10,001 lbs" | HIGH |

## CONSERVATIVE CAVEAT EDITS (accurate clarification, not invented law)

| # | file | locus | issue | action |
|---|---|---|---|---|
| 5 | investigations/grand-court-mesa-elder-abuse-hb2228.mdx | FAQ ~line 28 | applies ARS 12-821.01 (180-day public-entity notice) to "any state-licensed entity" — private nursing homes are NOT public entities (2-yr ARS 12-542 applies) | narrow wording: 12-821.01 only when defendant is a public entity; private facility = 2-yr SOL |
| 6 | legal-guides/arizona-daycare-negligence-law.mdx | line 139 + FAQ ~28 | minority-tolling "age 20" framing omits that a public-entity daycare's 180-day ARS 12-821.01 notice is NOT tolled by minority | add public-entity caveat (notice not tolled by age) |
| 7 | legal-guides/suing-school-district-arizona.mdx | lines ~120-126 | says ARS 12-502 "may toll" the 1-yr ARS 12-821 suit window — genuinely unsettled in AZ courts; current framing risks false security | keep "may" (do not assert unsettled rule); strengthen safety advice to treat both deadlines as running from injury + consult attorney immediately |

## FLAGGED — ATTORNEY VERIFY (do NOT auto-edit; possibly correct, out of bank scope)

- client-guides/educator-harmed-my-child-arizona.mdx:109 — "ARS 12-514" for individual educator claim. Not in citation bank. ARS 12-514 is plausibly AZ's childhood-sexual-abuse extended SOL (also referenced in school-abuse.mdx:131). Do not change a possibly-correct cite; route to human/attorney verification.

## CLEAN (no action)

- investigations 20-37: all PASS except #2,#5 above (16 of 18 clean)
- legal-guides: all PASS except #3,#4,#6,#7 above; arizona-pedestrian-law.mdx re-verified CLEAN post-correction (1-yr ARS 12-821 present)
- client-guides: all PASS except #1 above; child-injured-at-school.mdx confirmed correct (notice not tolled by age — stated correctly)

## PENDING AGENTS

- investigations 1-19 (af9641)
- practice-areas (re-verify wrongful-death.mdx + school-abuse.mdx corrections clean)
- glossary 77 entries
