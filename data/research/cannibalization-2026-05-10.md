# AZ Law Now Cannibalization Scan — 2026-05-10

Source: `data/research/keyword-universe.json` + structural title/slug overlap.
Two flag types: (1) **Structural** — multiple of our pages topically target the same query.
(2) **Legacy-flat** — a pre-IA flat-slug URL is the one ranking, but a newer collection page exists.

- Structural cannibalization candidates: **33**
- Legacy 301-merge candidates: **16**

---

## 1. Structural cannibalization — multiple pages target same query

Each row: a query where 2+ of our published pages have strong title/slug overlap.
Picks the most senior page as canonical and redirects/de-optimizes the rest.

| Vol | Pos | Query | # URLs | Top matches |
|---:|---:|---|---:|---|
| 720 | 70 | attorney bad faith | 2 | `/glossary/` — insurance-bad-faith-arizona<br>`/glossary/` — bad-faith |
| 590 | 98 | 3rd party insurance claim | 2 | `/glossary/` — third-party-claim<br>`/glossary/` — first-party-claim |
| 320 | 60 | ars hit-and-run | 3 | `/legal-guides/` — Arizona Hit-and-Run Law: ARS 28-661 Through 28-665<br>`/investigations/` — Hit-and-Run in Maricopa County: 16,000 Crashes, 90% Uns<br>`/client-guides/` — Hit-and-Run in Arizona: A Guide for Victims |
| 320 | 89 | hit by an uninsured motorist | 2 | `/legal-guides/` — Arizona Uninsured + Underinsured Motorist Law<br>`/glossary/` — uninsured-motorist |
| 260 | 71 | after car crash symptoms | 2 | `/client-guides/` — Flashbacks After a Car Crash in Arizona: What Helps<br>`/client-guides/` — Your First 48 Hours After an Arizona Car Crash |
| 170 | 37 | car crash effects | 2 | `/client-guides/` — Flashbacks After a Car Crash in Arizona: What Helps<br>`/client-guides/` — Your First 48 Hours After an Arizona Car Crash |
| 140 | 35 | statute of limitations for medical malpractice in arizona | 2 | `/practice-areas/` — Arizona Medical Malpractice Attorneys | AZ Law Now<br>`/glossary/` — statute-of-limitations |
| 140 | 45 | uninsured motorist hit me | 2 | `/legal-guides/` — Arizona Uninsured + Underinsured Motorist Law<br>`/glossary/` — uninsured-motorist |
| 90 | 55 | uninsured motorist driving my car | 2 | `/legal-guides/` — Arizona Uninsured + Underinsured Motorist Law<br>`/glossary/` — uninsured-motorist |
| 70 | 52 | do you need uninsured motorist coverage if you have collision | 3 | `/client-guides/` — Fatigued Trucker Crash in Arizona: What You Need to Kno<br>`/legal-guides/` — Arizona Uninsured + Underinsured Motorist Law<br>`/glossary/` — uninsured-motorist |
| 70 | 39 | does collision insurance cover uninsured motorist | 2 | `/legal-guides/` — Arizona Uninsured + Underinsured Motorist Law<br>`/glossary/` — uninsured-motorist |
| 70 | 83 | uninsured motorist accidents | 2 | `/legal-guides/` — Arizona Uninsured + Underinsured Motorist Law<br>`/glossary/` — uninsured-motorist |
| 70 | 96 | uninsured motorist coverage hit and run | 5 | `/investigations/` — Hit-and-Run in Maricopa County: 16,000 Crashes, 90% Uns<br>`/client-guides/` — Hit-and-Run in Arizona: A Guide for Victims<br>`/legal-guides/` — Arizona Uninsured + Underinsured Motorist Law |
| 70 | 43 | uninsured motorist coverage hit-and-run | 5 | `/investigations/` — Hit-and-Run in Maricopa County: 16,000 Crashes, 90% Uns<br>`/client-guides/` — Hit-and-Run in Arizona: A Guide for Victims<br>`/legal-guides/` — Arizona Uninsured + Underinsured Motorist Law |
| 50 | 22 | can you sue a daycare for negligence | 3 | `/investigations/` — 19 Families Sue 1 Coolidge In-Home Daycare<br>`/practice-areas/` — Arizona Daycare Negligence Attorneys | AZ Law Now<br>`/legal-guides/` — Arizona Daycare Negligence Law: Liability and Duty of C |
| 50 | 17 | negligence premises liability | 3 | `/practice-areas/` — Arizona Premises Liability Attorneys | AZ Law Now<br>`/legal-guides/` — Arizona Daycare Negligence Law: Liability and Duty of C<br>`/glossary/` — premises-liability |
| 50 | 16 | premises liability vs negligence | 3 | `/practice-areas/` — Arizona Premises Liability Attorneys | AZ Law Now<br>`/legal-guides/` — Arizona Daycare Negligence Law: Liability and Duty of C<br>`/glossary/` — premises-liability |
| 50 | 49 | bad faith insurance attorney arizona | 2 | `/glossary/` — insurance-bad-faith-arizona<br>`/glossary/` — bad-faith |
| 50 | 80 | car crash side effects | 2 | `/client-guides/` — Flashbacks After a Car Crash in Arizona: What Helps<br>`/client-guides/` — Your First 48 Hours After an Arizona Car Crash |
| 50 | 36 | daycare negligence | 2 | `/practice-areas/` — Arizona Daycare Negligence Attorneys | AZ Law Now<br>`/legal-guides/` — Arizona Daycare Negligence Law: Liability and Duty of C |
| 40 | 15 | can i sue daycare for negligence | 3 | `/investigations/` — 19 Families Sue 1 Coolidge In-Home Daycare<br>`/practice-areas/` — Arizona Daycare Negligence Attorneys | AZ Law Now<br>`/legal-guides/` — Arizona Daycare Negligence Law: Liability and Duty of C |
| 40 | 5 | can i sue a daycare for negligence | 3 | `/investigations/` — 19 Families Sue 1 Coolidge In-Home Daycare<br>`/practice-areas/` — Arizona Daycare Negligence Attorneys | AZ Law Now<br>`/legal-guides/` — Arizona Daycare Negligence Law: Liability and Duty of C |
| 40 | 69 | is uninsured motorist coverage required in arizona | 2 | `/legal-guides/` — Arizona Uninsured + Underinsured Motorist Law<br>`/glossary/` — uninsured-motorist |
| 40 | 42 | underinsured motorist coverage arizona | 2 | `/legal-guides/` — Arizona Uninsured + Underinsured Motorist Law<br>`/glossary/` — underinsured-motorist |
| 30 | 12 | daycare negligence lawsuit | 3 | `/investigations/` — 19 Families Sue 1 Coolidge In-Home Daycare<br>`/practice-areas/` — Arizona Daycare Negligence Attorneys | AZ Law Now<br>`/legal-guides/` — Arizona Daycare Negligence Law: Liability and Duty of C |
| 30 | 11 | sue daycare for negligence | 3 | `/investigations/` — 19 Families Sue 1 Coolidge In-Home Daycare<br>`/practice-areas/` — Arizona Daycare Negligence Attorneys | AZ Law Now<br>`/legal-guides/` — Arizona Daycare Negligence Law: Liability and Duty of C |
| 30 | 4 | suing a daycare for negligence | 3 | `/practice-areas/` — Arizona Daycare Negligence Attorneys | AZ Law Now<br>`/legal-guides/` — Suing a Restaurant for Negligence in Arizona: A Legal G<br>`/legal-guides/` — Arizona Daycare Negligence Law: Liability and Duty of C |
| 30 | 74 | elder financial abuse arizona | 3 | `/investigations/` — Mesa Grand Court Elder Abuse + Arizona HB2228<br>`/practice-areas/` — Arizona Elder Abuse Attorneys | AZ Law Now<br>`/legal-guides/` — Arizona Elder Abuse Law: ARS 46-451 |
| 30 | 36 | progressive hit and run parked car | 3 | `/investigations/` — Hit-and-Run in Maricopa County: 16,000 Crashes, 90% Uns<br>`/client-guides/` — Hit-and-Run in Arizona: A Guide for Victims<br>`/legal-guides/` — Arizona Hit-and-Run Law: ARS 28-661 Through 28-665 |
| 30 | 34 | progressive hit-and-run parked car | 3 | `/investigations/` — Hit-and-Run in Maricopa County: 16,000 Crashes, 90% Uns<br>`/client-guides/` — Hit-and-Run in Arizona: A Guide for Victims<br>`/legal-guides/` — Arizona Hit-and-Run Law: ARS 28-661 Through 28-665 |
| 30 | 3 | suing daycare for negligence | 3 | `/practice-areas/` — Arizona Daycare Negligence Attorneys | AZ Law Now<br>`/legal-guides/` — Suing a Restaurant for Negligence in Arizona: A Legal G<br>`/legal-guides/` — Arizona Daycare Negligence Law: Liability and Duty of C |
| 20 | 22 | how to sue a daycare for negligence | 3 | `/investigations/` — 19 Families Sue 1 Coolidge In-Home Daycare<br>`/practice-areas/` — Arizona Daycare Negligence Attorneys | AZ Law Now<br>`/legal-guides/` — Arizona Daycare Negligence Law: Liability and Duty of C |
| 20 | 73 | does uninsured motorist cover someone driving my car | 2 | `/legal-guides/` — Arizona Uninsured + Underinsured Motorist Law<br>`/glossary/` — uninsured-motorist |

---

## 2. Legacy-flat 301-merge candidates

DFS shows a legacy flat-slug URL (pre-IA) ranking, and a newer collection page
covers the same topic. These are 301-redirect candidates — consolidate the link
equity onto the canonical page in the new IA.

| Vol | Pos | Query | Legacy URL (ranking) | → Canonical |
|---:|---:|---|---|---|
| 720 | 70 | attorney bad faith | `/arizona-bad-faith-insurance-attorney/` | `/glossary/insurance-bad-faith-arizona/` (glossary) |
| 720 | 32 | get insured now | `/hit-by-uninsured-driver-insured/` | `/client-guides/hit-by-drunk-driver/` (client-guides) |
| 590 | 9 | dog bite settlement calculator | `/dog-bite-settlement-calculator/` | `/dog-bite/` (practice-areas) |
| 390 | 76 | settlement examples | `/slip-and-fall-settlement-examples/` | `/slip-and-fall/` (practice-areas) |
| 390 | 49 | what happens if someone without insurance hits you | `/hit-by-uninsured-driver/` | `/client-guides/hit-by-drunk-driver/` (client-guides) |
| 260 | 19 | level 3 dog bite settlement amount | `/level-3-dog-bite-settlement-amounts-in-arizona-az-law-now/` | `/dog-bite/` (practice-areas) |
| 260 | 16 | million dollar slip and fall settlements | `/million-dollar-slip-fall-settlements/` | `/slip-and-fall/` (practice-areas) |
| 70 | 1 | how much money can you get from suing a restaurant | `/how-much-money-suing-restaurant/` | `/legal-guides/suing-a-restaurant-in-arizona/` (legal-guides) |
| 50 | 22 | can you sue a daycare for negligence | `/sue-daycare-for-negligence/` | `/investigations/coolidge-daycare-19-families-lawsuit/` (investigations) |
| 50 | 14 | daycare lawsuits | `/daycare-lawsuit-guide/` | `/investigations/coolidge-daycare-19-families-lawsuit/` (investigations) |
| 50 | 17 | negligence premises liability | `/premises-liability-vs-negligence/` | `/premises-liability/` (practice-areas) |
| 50 | 8 | suing a daycare | `/suing-daycare-for-negligence/` | `/daycare-negligence/` (practice-areas) |
| 50 | 38 | level 5 dog bite settlement examples | `/dog-bite-settlement-examples/` | `/dog-bite/` (practice-areas) |
| 40 | 77 | can you sue a store if you fall | `/suing-store-for-fall-guide/` | `/legal-guides/suing-a-restaurant-in-arizona/` (legal-guides) |
| 40 | 70 | slip and fall injury compensation | `/slip-fall-injury-settlement-amounts/` | `/slip-and-fall/` (practice-areas) |
| 30 | 36 | progressive hit and run parked car | `/parked-car-hit-by-uninsured-driver/` | `/client-guides/hit-by-drunk-driver/` (client-guides) |

---

## Recommended next moves

1. **Legacy 301-merge** (section 2) — pick the top 10 by volume, redirect the
   legacy URL to the canonical collection page. Keeps link equity, removes
   internal SERP competition.
2. **Structural review** (section 1) — for each query where 3+ pages match,
   declare a canonical and tighten the others (de-emphasize keyword in title,
   remove H2s targeting it, or merge content).
3. **Run `--confirm 50`** on the top-volume structural candidates to verify
   which are actually cannibalizing in the live SERP vs. just topical overlap.