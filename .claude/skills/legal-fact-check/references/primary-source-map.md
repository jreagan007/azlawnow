# Primary Source Map — AZ Law Now Legal Fact-Check

> Routing table for `legal-fact-check` Phase 2. Every claim type maps to its authoritative source URL, verification method, and known failure modes. Updated 2026-05-17.

## How to use this map

1. `legal-fact-check` Phase 1 extracts a claim and assigns a `claim_type`
2. Phase 2 looks up the claim type in this table
3. Phase 2 fetches the primary source URL listed and applies the verification method
4. Confidence is scored HIGH / MEDIUM / LOW per the criteria in each row
5. If the primary source fails (404, captcha, rate limit), use the fallback listed

---

## Statute of Limitations (Personal Injury)

**Claim type**: `sol_deadline`

| Field | Value |
|---|---|
| Primary source | `https://www.azleg.gov/ars/12/00542.htm` |
| Source label | Arizona Revised Statutes § 12-542 |
| What to verify | Text reads: "There shall be commenced and prosecuted within two years after the cause of action accrues, and not afterward, the following actions: 1. For injuries done to the person of another..." |
| Correct principle | 2-year SOL for personal injury. Accrual begins on the date of injury (or discovery, for latent injuries). |
| Common errors to catch | "3 years," "1 year," "from the date of accident" when latent discovery applies, conflating with criminal statutes |
| Fallback | AZ Legislature full-text search: `https://www.azleg.gov/arstitle/` → Title 12 → Chapter 5 |
| Data freshness | Statute text; verify for any recent legislative amendments via azleg.gov session laws |

---

## Notice of Claim (Public Entity Defendants)

**Claim type**: `notice_of_claim`

| Field | Value |
|---|---|
| Primary source | `https://www.azleg.gov/ars/12/00821-01.htm` |
| Source label | Arizona Revised Statutes § 12-821.01 |
| What to verify | (A): "Persons who have claims against a public entity or a public employee shall file claims with the person or persons authorized to accept service for the public entity or public employee as set forth in the Arizona rules of civil procedure within one hundred eighty days after the cause of action accrues." |
| Correct principle | 180-day notice of claim is a CONDITION PRECEDENT (jurisdictional bar), not a statute of limitations. Failure to timely file the notice extinguishes the right to sue — it is not a mere procedural defect that can be excused. The 2-year SOL under ARS 12-821 still runs after the notice is timely filed. |
| Common errors to catch | "You have 180 days to sue" (wrong — 180 days to file notice, 2 years to file suit after notice); treating the notice period as the SOL; omitting the notice requirement entirely when discussing ADOT, city, or school district defendants |
| Which entities trigger this | ADOT, Arizona Department of Public Safety, cities, counties, school districts, community college districts, state universities (ASU, UA, NAU), any Arizona public entity |
| Fallback | Arizona AG guidance on public entity claims: `https://www.azag.gov/` + ARS 12-821 (the companion statute for the actual 1-year suit deadline against public entities — note: different from the general 2-year PI SOL under 12-542) |
| Critical note | ARS 12-821 (1-year suit window for public entities) and ARS 12-821.01 (180-day notice) must both be cited when the defendant is a public entity. Using only one creates a dangerously incomplete picture. |

---

## Wrongful Death — SOL and Eligible Survivors

**Claim type**: `wrongful_death_sol`

| Field | Value |
|---|---|
| Primary source (SOL) | `https://www.azleg.gov/ars/12/00611.htm` |
| Primary source (survivors) | `https://www.azleg.gov/ars/12/00612.htm` |
| Source labels | ARS § 12-611 (wrongful death action), ARS § 12-612 (who may sue) |
| What to verify (12-611) | "When death of a person is caused by wrongful act, neglect or default, and the act, neglect or default is such as would, if death had not ensued, have entitled the party injured to maintain an action to recover damages in respect thereof, then, and in every such case, the person who or the corporation which would have been liable if death had not ensued shall be liable to an action for damages..." |
| What to verify (12-612) | Lists who can bring the action: surviving husband or wife, children, or parents, or if none, surviving siblings. The personal representative may also file. |
| Correct principle | 2-year SOL, same as PI under ARS 12-542. Survivors enumerated in 12-612. No damages cap (see AZ Const Art 2 §31 below). |
| Common errors to catch | "3-year wrongful death SOL," claiming only a spouse can sue, claiming damages are capped, omitting parent/sibling survivor rights |
| Fallback | AZ Courts self-help center: `https://www.azcourts.gov/selfservicecenter/` |

---

## AZ Constitution — No Damages Cap

**Claim type**: `az_const_claim`

| Field | Value |
|---|---|
| Primary source | `https://www.azleg.gov/constitution/` → Article II § 31 |
| Source label | Arizona Constitution, Article II, Section 31 |
| What to verify | "No law shall be enacted in this state limiting the amount of damages to be recovered for causing the death or injury of any person." |
| Correct principle | Arizona has NO cap on personal injury or wrongful death damages. Any claim to the contrary (e.g., "Arizona caps damages at $X") is a fabrication class hit. Guard the inverse too: any article that implies a cap exists (e.g., "your damages may be limited by state law") is flagged. |
| Common errors to catch | Confusing AZ with states that have tort reform caps (TX, CA, FL); implying pain and suffering has a cap; confusing punitive damage guidance with hard caps |
| Fallback | AZ AG constitutional opinions: `https://www.azag.gov/opinions` |

---

## Comparative Fault

**Claim type**: `comparative_fault`

| Field | Value |
|---|---|
| Primary source | `https://www.azleg.gov/ars/12/02505.htm` |
| Source label | Arizona Revised Statutes § 12-2505 |
| What to verify | Arizona is a PURE comparative fault state. A plaintiff's recovery is reduced by their percentage of fault, but there is NO threshold that bars recovery. A plaintiff 99% at fault may still recover 1% of their damages. |
| Common errors to catch | "If you're more than 50% at fault you can't recover" (that is modified comparative fault, NOT Arizona law); "contributory negligence bars your claim" (that is contributory negligence, NOT Arizona law); omitting that pure comparative applies to ALL defendants |
| Fallback | Jury instructions: `https://www.azcourts.gov/rulesofcourt/` → RAJI (Recommended Arizona Jury Instructions) |

---

## Several Liability (No Joint-and-Several for Non-Intentional Torts)

**Claim type**: `several_liability`

| Field | Value |
|---|---|
| Primary source | `https://www.azleg.gov/ars/12/02506.htm` |
| Source label | Arizona Revised Statutes § 12-2506 |
| What to verify | Each defendant is liable only for the portion of the plaintiff's damages proportionate to that defendant's percentage of fault. Arizona abolished joint-and-several liability for most tort claims in 1987. Exceptions apply for intentional torts and certain other conduct. |
| Common errors to catch | "All defendants are jointly liable for the full amount" (false for most AZ tort claims); failing to note the intentional-tort exception |
| Fallback | Same as § 12-2505 — AZ comparative fault statutes |

---

## Tribal Jurisdiction

**Claim type**: `tribal_jurisdiction`

| Field | Value |
|---|---|
| Primary sources | Navajo Nation Code: `https://navajocourts.org/` + Tohono O'odham Nation: `https://www.tonation-nsn.gov/` + Fort McDowell Yavapai Nation + SRPMIC: `https://www.srpmic-nsn.gov/` + Ak-Chin Indian Community: `https://www.ak-chin.nsn.us/` |
| What to verify | Whether the incident occurred on tribal land; whether tribal sovereign immunity applies; whether AZ state courts have jurisdiction; whether tribal court must be the exclusive forum; which SOL and notice rules govern (tribal law vs. AZ state law) |
| Correct principle | Arizona state courts do NOT automatically have jurisdiction over personal injury claims arising on Indian Country. Tribal sovereign immunity may bar suit in state court. The applicable SOL and notice rules are governed by tribal law, not ARS 12-542 or 12-821.01, unless the tribe has waived immunity or consented to state court jurisdiction. This is a CRITICAL check because the Navajo Nation alone covers a vast area of northeastern Arizona including US-160, US-191, and SR-264. |
| Common errors to catch | Applying AZ SOL to a crash on a reservation without noting jurisdictional issue; claiming immunity is waived without a source; failing to mention tribal jurisdiction at all |
| AG resource | `https://www.azag.gov/civil-rights/tribal-government-relations` |
| Federal resource | Bureau of Indian Affairs: `https://www.bia.gov/` for tribal land status questions |
| Fallback flag | If uncertain whether a location is Indian Country: flag the claim as `tribal_jurisdiction_flag: true` and require attorney review before publish |

---

## ADOT Crash Statistics

**Claim type**: `adot_stat`

| Field | Value |
|---|---|
| Primary source | `https://www.azdot.gov/planning/transportation-analysis/traffic-records` |
| Source label | ADOT Arizona Traffic Crash Facts Report |
| What to verify | (1) The cited crash count, fatality rate, or metric appears in the named ADOT report year. (2) The data year is disclosed inline in the article ("ADOT's 2023 crash data shows..."). (3) The corridor name matches ADOT's official corridor designation (e.g., I-10, SR-347, not generic "the Maricopa Highway"). |
| Data lag rule | ADOT crash data is typically published 18–24 months after the data collection year. A 2026 article must cite ADOT data from 2023 or 2024 at the latest. "Last year" is ambiguous and blocked in strict mode — the year must be explicit. |
| Common errors to catch | Citing "2025 ADOT data" when the 2025 report hasn't been published; omitting the data year; using ADOT fatality totals from a different corridor than the article discusses |
| Grade crossing data | FRA Crossing Inventory: `https://safetydata.fra.dot.gov/officeofsafety/publicsite/crossing.aspx` — use for railroad crossing claims specifically |
| Fallback | ADOT AHART (Arizona Highway Accident Reporting Tool): `https://ahart.azdot.gov/` for corridor-specific crash data |

---

## Arizona Minimum Insurance Limits

**Claim type**: `insurance_stat`

| Field | Value |
|---|---|
| Primary source | `https://www.azleg.gov/ars/28/04009.htm` |
| Source label | Arizona Revised Statutes § 28-4009 |
| What to verify | Arizona minimum liability limits: $25,000 per person / $50,000 per accident / $15,000 property damage (commonly written 25/50/15). |
| Uninsured rate source | Insurance Research Council (IRC) reports; cite year explicitly. AZ has historically high uninsured rates (~12% range as of available data — always cite the specific IRC report year, not a memorized percentage). |
| Common errors to catch | Stating 25/50/15 without noting these are minimums (not adequate for serious injury); claiming a specific uninsured percentage without a dated source; stating the "required" limits as if they cover all situations |
| Fallback | Arizona Department of Insurance: `https://difi.az.gov/` |

---

## Public Records

**Claim type**: `public_records`

| Field | Value |
|---|---|
| Primary source | `https://www.azleg.gov/ars/39/00121.htm` |
| Source label | Arizona Revised Statutes § 39-121 |
| What to verify | Arizona public records law requires government agencies to promptly disclose public records. "Promptly" has been interpreted as 10 business days by the AG's office. Journalism fee waivers are available when the request serves the public interest and the requester is a media organization. |
| Common errors to catch | Claiming a specific response deadline that is not in the statute (the "promptly" language is interpreted, not a hard deadline in the statute itself); omitting the fee waiver option for journalism requests |
| AG guidance | `https://www.azag.gov/open-government` |

---

## Arizona Rules of Evidence 803(6) — Business Records

**Claim type**: `evidence_rule`

| Field | Value |
|---|---|
| Primary source | `https://www.azcourts.gov/rulesofcourt/` → Arizona Rules of Evidence → Rule 803(6) |
| Source label | Arizona Rule of Evidence 803(6) |
| What to verify | Business records exception to the hearsay rule. Applies to records of a regularly conducted activity kept in the ordinary course of business. Relevant for ADOT crash reports, trucking company inspection records, nursing home incident logs, daycare records, hospital records used as evidence. |
| Common errors to catch | Claiming ADOT crash data is automatically admissible without noting the foundation requirements; omitting that the records must be authenticated |

---

## Arizona Bar Ethics Rules (ER 7.1–7.5)

**Claim type**: `bar_rule`

> See `az-bar-ethics-guard` skill for the full ER 7.1–7.5 scan. This section covers source routing for bar-rule claims that appear in content.

| Rule | What it governs | Primary source |
|---|---|---|
| ER 7.1 | False or misleading communications about legal services; unverified superlatives; result guarantees; result-without-context framing | `https://www.azbar.org/for-lawyers/professionalism/rules-of-professional-conduct/` → Rule 7.1 |
| ER 7.2 | Attorney advertising; required attorney-advertising labels on paid communications | azbar.org ER 7.2 |
| ER 7.3 | Solicitation; no in-person, live telephone, or real-time electronic contact soliciting professional employment from a prospective client known to need legal services | azbar.org ER 7.3 |
| ER 7.4 | Communication of fields of practice; "specialist" requires AZ Bar certification in that field; "certified specialist" triggers strict verification | azbar.org ER 7.4 |
| ER 7.5 | Firm names and letterhead; firm name must accurately reflect the firm composition | azbar.org ER 7.5 |

---

## Verdict and Case Law Verification

**Claim type**: `verdict_amount`, `court_case`

| Source | URL | What it provides |
|---|---|---|
| CourtListener (primary) | `https://www.courtlistener.com/` | Full-text opinions, dockets, party names, outcome, appellate status for AZ cases |
| CourtListener AZ API | `https://www.courtlistener.com/api/rest/v4/dockets/?court=azsuperct` | AZ Superior Court docket search |
| AZ Courts case lookup | `https://apps.supremecourt.az.gov/publicaccess/` | AZ Supreme Court + Court of Appeals case status |
| Maricopa Superior Court | `https://superiorcourt.maricopa.gov/online-services/case-information/` | Maricopa County civil case lookup by party name or case number |
| PACER (federal) | `https://pacer.uscourts.gov/` | Federal district and appellate cases (9th Circuit for AZ federal appeals) |

Verdict verification protocol:
1. Search CourtListener by plaintiff surname + approximate year + "Arizona"
2. Confirm case exists with the stated parties
3. Confirm the amount was a jury verdict or bench verdict (not a settlement)
4. Confirm the appellate status — reversed or vacated verdicts may not be cited as positive outcomes
5. Add the CourtListener docket URL to article `dataSources`

If the verdict is from a confidential settlement: label it `settlement_amount`, note it's unverifiable, and do not state the amount unless the client has provided a press release or case number.

---

## AHCCCS (Medicaid) and Nursing Home Violation Data

**Claim type**: `adot_stat` (repurposed for facility data)

| Field | Value |
|---|---|
| Primary source | `https://www.azahcccs.gov/` |
| CMS nursing home compare | `https://www.medicare.gov/care-compare/` |
| AZ DHS inspection reports | `https://www.azdhs.gov/licensing/long-term-care/` |
| What to verify | Nursing home star ratings, inspection deficiencies, staffing levels cited in abuse-negligence investigations. Data year must be disclosed. CMS data updates quarterly — cite the specific report period. |

---

## Arizona Attorney General

**Claim type**: General legal authority, AG opinions, public-records guidance

| Field | Value |
|---|---|
| Primary source | `https://www.azag.gov/` |
| AG opinions | `https://www.azag.gov/opinions` |
| What to verify | AG opinions on public records, tribal relations, consumer protection, or any AZ-specific legal question where a formal AG opinion exists. AG opinions are persuasive but not binding — note the distinction. |
