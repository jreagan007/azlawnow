# Orphan URL Triage — 2026-05-10

Source: `data/research/content-plan-2026-05-10.json` — combined `review-orphan` + 
`301-merge` + `fix-snippet-orphan` buckets. **88 unique URLs** checked.

## Summary

| Status | Count | Action |
|---|---:|---|
| **200 Live** — page exists, missing from IA inventory | 5 | Decide: keep, redirect, or de-index |
| **3xx → azlawnow** — already redirected correctly | 83 | Verify destination is canonical |
| **3xx → offsite** — redirected away from our domain | 0 | 🔴 Investigate immediately |
| **404 Gone** — dead URL still indexed | 0 | Add 301 to canonical |
| **Error / timeout** | 0 | Re-run; investigate if persistent |

---


## 🟡 200 Live — Pages we forgot were live

| Vol/Impr | URL | Final URL | Sample query | Action |
|---:|---|---|---|---|
| 390 | `/about/` | `/about/` | brandon law | Add to IA inventory OR 301 to canonical |
| 140 | `/contact/` | `/contact/` | az law now injury attorneys | Add to IA inventory OR 301 to canonical |
| 140 | `/glossary/` | `/glossary/` | ars 12-341 | Add to IA inventory OR 301 to canonical |
| 140 | `/legal-guides/` | `/legal-guides/` | ars 28-729 | Add to IA inventory OR 301 to canonical |
| 0 | `/reviews/` | `/reviews/` | my arizona lawyers google reviews | Add to IA inventory OR 301 to canonical |

## ✅ 3xx → azlawnow — Already redirecting correctly

| Vol/Impr | URL | Final URL | Sample query | Action |
|---:|---|---|---|---|
| 368000 | `/locations/maricopa-injury-lawyer/` | `/maricopa/` | injury lawyer near me | Verify destination |
| 49500 | `/personal-injury/motorcycle-accident-lawyer-buckeye/` | `/motorcycle-accidents/` | motorcycle accident lawyer near me | Verify destination |
| 22200 | `/suing-store-for-fall-guide/` | `/premises-liability/` | slip and fall attorneys near me | Verify destination |
| 9900 | `/personal-injury/rideshare-accidents/` | `/rideshare-accidents/` | rideshare accident attorney | Verify destination |
| 1900 | `/slip-fall-injury-settlement-amounts/` | `/slip-and-fall/` | car lawyer | Verify destination |
| 1300 | `/arizona-partial-fault-accident/` | `/legal-guides/arizona-car-accident-law/` | arizona auto accident laws | Verify destination |
| 880 | `/premises-liability/negligent-hiring-or-training/` | `/premises-liability/` | negligent hiring | Verify destination |
| 720 | `/arizona-bad-faith-insurance-attorney/` | `/legal-guides/arizona-uninsured-motorist-law/` | attorney bad faith | Verify destination |
| 590 | `/civil-lawyers-who-work-on-contingency/` | `/faq/` | contingency attorney | Verify destination |
| 590 | `/dog-bite-settlement-calculator/` | `/dog-bite/` | dog bite settlement calculator | Verify destination |
| 390 | `/locations/` | `/` | solutions now law firm | Verify destination |
| 390 | `/personal-injury/truck-accident/` | `/truck-accidents/` | arizona truck accident attorney | Verify destination |
| 390 | `/about/team/` | `/about/#the-editors` | knowles law firm | Verify destination |
| 390 | `/slip-and-fall-settlement-examples/` | `/slip-and-fall/` | settlement examples | Verify destination |
| 390 | `/hit-by-uninsured-driver/` | `/legal-guides/arizona-uninsured-motorist-law/` | what happens if someone without insuranc | Verify destination |
| 320 | `/premises-liability/failure-to-report-abuse/` | `/school-abuse/` | failed to report | Verify destination |
| 260 | `/premises-liability/negligent-supervision/` | `/premises-liability/` | failure to supervise | Verify destination |
| 260 | `/symptoms-car-accident-trauma/` | `/client-guides/psychological-recovery-after-arizona-crash/` | after car crash symptoms | Verify destination |
| 260 | `/million-dollar-slip-fall-settlements/` | `/slip-and-fall/` | what to do with a million dollar settlem | Verify destination |
| 260 | `/level-3-dog-bite-settlement-amounts-in-arizona-az-law-now/` | `/dog-bite/` | dog bite insurance claims settlement | Verify destination |
| 210 | `/why-you-dont-have-to-pay-your-doctors-right-away-after-a-car-accident/` | `/car-accidents/` | accident doctors pay $0 car accidents fi | Verify destination |
| 210 | `/estimate-settlement/` | `/tips/` | compensation for car accident calculator | Verify destination |
| 185 | `/flashbacks-of-car-accident/` | `/client-guides/flashbacks-after-arizona-car-crash/` | moments before the accident explained | Verify destination |
| 170 | `/psychological-effects-car-accidents/` | `/client-guides/psychological-recovery-after-arizona-crash/` | car crash effects | Verify destination |
| 170 | `/hit-by-uninsured-driver-insured/` | `/legal-guides/arizona-uninsured-motorist-law/` | uninsured driver in insured car | Verify destination |
| 110 | `/can-you-sue-for-verbal-abuse-or-being-yelled-at-in-arizona/` | `/tips/` | can you sue someone for verbal abuse | Verify destination |
| 70 | `/abuse/elder-abuse/` | `/elder-abuse/` | ars 46-456 | Verify destination |
| 70 | `/abuse/sexual-abuse/` | `/child-abuse/` | sexual assault lawyer arizona | Verify destination |
| 70 | `/personal-injury/premises-liability/` | `/premises-liability/` | repeated acts of violence in the case of | Verify destination |
| 66 | `/personal-injury/bus-accidents/` | `/bus-accidents/` | bus accident injury | Verify destination |
| 64 | `/premises-liability-settlement-amounts/` | `/` | premises liability settlement amounts | Verify destination |
| 61 | `/lyft-accident-attorney-west-phoenix/` | `/rideshare-accidents/` | phoenix lyft accident lawyer | Verify destination |
| 50 | `/abuse/school-abuse/` | `/school-abuse/` | assault in schools | Verify destination |
| 50 | `/daycare-lawsuit-guide/` | `/daycare-negligence/` | daycare lawsuits | Verify destination |
| 50 | `/premises-liability/improper-use-of-restraints/` | `/school-abuse/` | unnecessary restraint is | Verify destination |
| 50 | `/suing-daycare-for-negligence/` | `/daycare-negligence/` | daycare negligence | Verify destination |
| 50 | `/dog-bite-settlement-examples/` | `/dog-bite/` | level 5 dog bite settlement examples | Verify destination |
| 50 | `/sue-daycare-for-negligence/` | `/daycare-negligence/` | can i sue for daycare abuse | Verify destination |
| 50 | `/premises-liability-vs-negligence/` | `/` | negligence premises liability | Verify destination |
| 40 | `/foreign-object-in-food-settlements/` | `/legal-guides/suing-a-restaurant-in-arizona/` | glass found in food compensation | Verify destination |
| 40 | `/uninsured-drivers-accident/` | `/legal-guides/arizona-uninsured-motorist-law/` | you are hit in an accident by another dr | Verify destination |
| 40 | `/personal-injury/bicycle-accidents/` | `/bicycle-accidents/` | ars 28-815 | Verify destination |
| 40 | `/premises-liability/negligent-security/` | `/premises-liability/` | inadequate security lawsuit | Verify destination |
| 30 | `/insurance-claim-lawyer-cost/` | `/car-accidents/` | how much does an insurance lawyer cost | Verify destination |
| 30 | `/abuse/caregiver-abuse/` | `/elder-abuse/` | which caregiver behavior is consistent w | Verify destination |
| 30 | `/lawyer-sue-fast-food/` | `/legal-guides/suing-a-restaurant-in-arizona/` | lawyers for suing restaurants | Verify destination |
| 20 | `/collect-money-uninsured-driver/` | `/legal-guides/arizona-uninsured-motorist-law/` | how to collect money from uninsured driv | Verify destination |
| 0 | `/locations/buckeye-injury-lawyer/` | `/buckeye/` | buckeye domestic violence lawyer | Verify destination |
| 0 | `/bad-faith-lawyers-help/` | `/legal-guides/arizona-uninsured-motorist-law/` | dealing with bad faith insurance | Verify destination |
| 0 | `/abuse/child-abuse/` | `/child-abuse/` | arizona child abuse defense attorney | Verify destination |

---

## Next steps

1. **All 404s** → add to `netlify.toml` as `[[redirects]]` with `status = 301`
   using the suggested canonical, OR `status = 410` if no canonical exists.
2. **All 200 lives** — decide: are these meant to be in the new IA? If yes,
   add to `src/content/` so they're tracked. If no, 301 them to the canonical.
3. **Any 3xx offsite** — investigate immediately. There should never be a redirect
   from our own domain to another site.
4. Re-run `scripts/seo/build-redirects.py` after deciding the 404 destinations to
   regenerate `proposed-redirects-{date}.toml`.