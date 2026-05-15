# Tempe ASU Scooter & Pothole Dossier

Research layer for AZ Law Now investigation (Brendan Franks voice). Compiled 2026-04-23.
All facts cite a URL. Confidence tags: HIGH = primary doc retrieved and quoted, MEDIUM = secondary source or partial retrieval, LOW = generative summary without retrievable primary.

---

## 1. Tempe road condition + pothole data

**1.1 Tempe 311 is the public service-request channel; SeeClickFix also lives.**
Tempe runs "Tempe 311" (phone 480-350-4311, app, and web) as the intake for non-emergency issues including potholes, sidewalk/curb defects, and debris in the right-of-way. The Tempe 311 app ships on Google Play and the Apple store.
- Source: https://www.tempe.gov/i-want-to/contact-the-city
- Source: https://www.tempe.gov/i-want-to/report-a-water-leak ("Use to report pothole, sidewalk or curb issues, debris in street, or downed tree or limb in the right-of-way.")
- Source: https://seeclickfix.com/tempe
- Confidence: HIGH

**1.2 A public 311 dashboard exists but pothole-specific metrics are not published.**
Tempe's Data Academy hosts an operations dashboard for "311 Caller Wait Time" but a discrete pothole-volume or repair-time dashboard is NOT FOUND.
- Source: https://data-academy.tempe.gov/search?collection=appAndMap&layout=grid
- Source: https://data.tempe.gov/
- Average pothole repair time: NOT FOUND.
- Current open backlog count: NOT FOUND.
- Confidence: MEDIUM (we verified the dashboards exist, but repair time and backlog counts are not surfaced in the public portal)

**1.3 Tempe Pavement Management Program publishes on a 3-year cycle.**
Tempe's Pavement Management Program page states: "The city collects pavement condition data every three years. We use the information to prioritize paving schedules and determine what treatment will be used."
- Source: https://www.tempe.gov/government/public-works/engineering/pavement-management-program
- Confidence: HIGH

**1.4 Tempe's own tracking shows "large portions" of a major Tempe corridor in poor condition.**
The MAG ARRP 2026 grant application for Tempe Broadway Rd (55th St to Mill Ave) states: "Tempe's Pavement Quality Index tracking data shows large portions of the corridor are currently in poor condition (per ASTM classification)." This is Tempe Public Works writing in its own application document to the Maricopa Association of Governments.
- Source: https://azmag.gov/portals/0/Transportation/TIP/2025/ARRP-Applications/TMP-26-ARRP-001.pdf
- Confidence: HIGH

**1.5 No campus-segment PCI scores were retrievable.**
Street-level PCI scores for Mill Ave, University Dr, Rural Rd, Apache Blvd, College Ave, McAllister Ave, Forest Ave, or Lemon St were NOT FOUND on tempe.gov or in ADOT/IDEA statewide summaries. Tempe's Pavement Quality Index performance page exists but we did not surface segment-by-segment numeric scores.
- Source (performance page): https://performance.tempe.gov/pages/pavement-quality-index~f222847cc6cb42f48a8814be1d52bbae
- Source (statewide IDEA PCI dashboard, ADOT network): https://idea.appliedpavement.com/hosting/arizona/statewide-summary/condition-summary/statewide-pci-summary-charts.html
- Confidence: MEDIUM (page exists, data not publicly tabulated at segment level)

**1.6 FY 2024 to 2026 Tempe street-maintenance budget line items: NOT FOUND at the line-item level.**
The Tempe budget reports landing page moved during a CMS migration. The only pavement-adjacent funding verified is a $12.5 million federal grant for Baseline Road safety improvements (awarded Sept 2024).
- Source: https://azbex.com/planning-development/tempe-gets-12-5m-for-baseline-road-improvements/
- Source: https://www.kjzz.org/kjzz-news/2024-09-06/tempe-receives-12-million-to-make-baseline-road-safer
- Source (broken Tempe page, CMS migration): https://www.tempe.gov/government/financial-services/budget-reports
- Confidence: LOW (draft should say Tempe has not produced a discrete street-maintenance line item in a publicly-linked PDF; to be added via records request)

**1.7 Tempe Council activity in the last 24 months flagging pavement: the e-scooter safety subcommittee, formed December 2025.**
On December 22, 2025 Tempe formed the "Motorized and Electric Mobility Device Safety Council Subcommittee" to analyze injury and crash data for e-bikes and scooters and to draft regulations. First meeting held January 2026.
- Source: https://www.tempe.gov/government/mayor-and-city-council/council-subcommittees/motorized-and-electric-mobility-device-safety-council-subcommittee
- Source: https://www.azcentral.com/story/news/local/tempe/2025/12/22/tempe-sets-first-meeting-for-new-electric-bicycles-devices-subcommittee/87865388007/
- Source: https://www.azfamily.com/2026/01/08/tempe-forms-committee-address-e-bike-scooter-safety-concerns/
- Confidence: HIGH

---

## 2. ASU student micromobility crash data

**2.1 ASU Clery report does not publish a crash/injury breakdown for bikes and e-scooters.**
The ASU Annual Security and Fire Safety Report exists and aggregates Clery crimes plus arrests. It is not structured to report micromobility crash counts; ASU's Crime Alert stream covers scooter thefts, not crash injuries. No 2024 or 2025 Clery report entry on bicycle or e-scooter crash volume was located on campus.
- Source (Clery landing): https://cfo.asu.edu/campuscrime
- Source (Crime Alert, scooter theft Aug 21 2024): https://cfo.asu.edu/ctw-theft-08-22-2024
- Confidence: MEDIUM (negative finding is itself the story: Clery doesn't capture the crash data)

**2.2 Tempe Police open-data crash portal exists; zip-filtered bike/e-scooter counts require raw download.**
Tempe publishes raw crash data at data.tempe.gov ("1.08 Crash Data Report Detail"). Zip-code-level pre-aggregations for 85281, 85282, 85287 and a pavement-condition contributing-factor flag are NOT pre-published. A reporter would need to download and aggregate.
- Source: https://data.tempe.gov/datasets/tempegov::1-08-crash-data-report-detail/about
- Source: https://data.tempe.gov/search?collection=dataset&tags=crash
- Source: https://open.tempe.gov/search?collection=dataset&tags=cyclist
- Confidence: HIGH (data exists) / LOW (specific counts not retrieved)

**2.3 National micromobility trend is steep: 118,485 e-scooter injuries in 2024 per CPSC NEISS.**
CPSC's National Electronic Injury Surveillance System reported 118,485 e-scooter injuries in 2024, an 80% increase from 64,329 in 2023. Head injuries were 20,960 cases (18.42% of all e-scooter injuries). Males were 67.7% of injuries. Children under 14 accounted for over 15% of injuries. CPSC recorded 111 e-scooter-related deaths from 2017 to 2022.
- Source (secondary-cited CPSC data): https://www.campussafetymagazine.com/insights/surge-in-electric-scooter-accidents-spurs-school-bans/176531/
- Source: https://www.smartcitiesdive.com/news/electric-scooter-injuries-increase/759357/
- Confidence: MEDIUM (CPSC primary NEISS export not fetched; trade press reported the numbers; the draft should verify via CPSC.gov query)

**2.4 NHTSA doesn't maintain dockless e-scooter crash records.**
NHTSA states e-scooter crashes are often coded as pedestrian crashes rather than separately categorized, which produces systemic undercount.
- Source: https://www.nhtsa.gov/book/countermeasures-that-work/bicycle-safety/emerging-issues
- Confidence: HIGH

**2.5 State Press reporting on scooters exists but doesn't cover pavement-related crashes.**
The State Press has archived editorial and news coverage of ASU's on-campus e-scooter ban (October 2023: "Opinion: ASU should actually enforce its scooter ban"). No State Press article in 2023-2026 specifically attributed a crash to pavement condition at ASU Tempe was surfaced.
- Source: https://www.statepress.com/article/2023/10/enforce-scooter-ban
- Source: https://www.statepress.com/section/community
- Confidence: MEDIUM (negative finding)

**2.6 Arizona Republic 2019 reported e-scooter accidents reached triple digits in Tempe.**
A January 2019 AZ Central story documented that Tempe e-scooter accidents reached triple digits; Tempe approved new regulations the same week.
- Source: https://www.azcentral.com/story/news/local/tempe/2019/01/11/electric-scooter-accidents-reach-triple-digits-metro-phoenix-tempe/2503557002/
- Confidence: HIGH (URL retrieved; draft should pull the exact 2019 figure from the article body)

**2.7 Cronkite News covered the Phoenix scooter pilot.**
Cronkite News produced video coverage of the Phoenix e-scooter pilot and ASU's on-campus ban enforcement; no pavement-condition reporting.
- Source: https://cronkitenews.azpbs.org/2024/04/29/tempe-car-free-culdesac-neighborhood-focuses-health/
- Confidence: MEDIUM

---

## 3. Tempe e-scooter operating agreements

**3.1 Tempe lowers the Arizona minimum age for e-scooter riders to 16.**
Arizona's statewide e-scooter rules apply to Tempe: 15 mph max, treated like a bicycle, not allowed on sidewalks or on streets over 25 mph / 4+ lanes. Tempe sets minimum rider age at 16.
- Source: https://unagiscooters.com/scooter-articles/electric-scooter-laws/
- Confidence: MEDIUM (draft should cite the Tempe municipal ordinance directly; the ordinance URL was NOT retrieved in this pass)

**3.2 Tempe hasn't published its operator agreement text, fleet caps, geofencing, or injury-reporting clauses on the public site.**
Current permit holders (Lime, Spin, Bird, Link, Veo, others), agreement text, operator injury-reporting requirements, pavement-condition notification clauses, and fleet-size caps are NOT FOUND on tempe.gov in this pass. The 2019 AZ Central article documented operator regulations going into effect immediately with a 30-day grace period for right-of-way compliance.
- Source (2019 ordinance reference): https://www.azcentral.com/story/news/local/tempe/2019/01/11/electric-scooter-accidents-reach-triple-digits-metro-phoenix-tempe/2503557002/
- Confidence: LOW (the 2026 permit-holder list will need a direct Public Records Request)

**3.3 December 2025 proposed rewrite would LOOSEN sidewalk bans for e-scooters up to 20 mph.**
Per the new Tempe subcommittee's draft (Dec 2025 / Jan 2026), "E-scooters will be able to travel at 20 mph on nearly all pedestrian sidewalks, walkways, and preserve trails." The committee was reported to propose "no safety" restrictions on sidewalk riding.
- Source: https://www.facebook.com/arizonasfamily/posts/the-city-of-tempe-has-formed-the-motorized-and-electric-mobility-device-safety-c/1341911984635282/
- Source: https://www.azfamily.com/2026/01/08/tempe-forms-committee-address-e-bike-scooter-safety-concerns/
- Confidence: MEDIUM (reported via TV station social posts; subcommittee minutes should be pulled by draft)

---

## 4. Jurisdictional map around ASU

**4.1 Verified public jurisdictional map of roads around ASU Tempe: NOT FOUND.**
No tempe.gov jurisdictional street map or ADOT overlay was retrievable that classifies each street named in the brief. The draft will need to identify jurisdiction segment-by-segment using ADOT's ATIS or a Tempe Public Works records request. Best existing workaround: ADOT public map experience and ADOT's state system designations.
- Source (ADOT pavement portal): https://experience.arcgis.com/experience/abb6a0ed15a545898cf8f6be55fde413
- Confidence: LOW (the map layer exists; specific per-street classification wasn't extracted)

**4.2 Known from state road classification (draft must verify each segment before publishing):**
- Apache Blvd between Loop 101 and Mill Ave is signed as business loop carrying the former US-60 alignment; it is STATE/ADOT-adjacent but primarily Tempe-maintained within the city limits. Draft should verify with ADOT.
- Mill Ave within Tempe is a City of Tempe arterial.
- Rural Rd, McClintock Dr, University Dr within Tempe are City of Tempe arterials.
- Scottsdale Rd north of Tempe city limits transitions to City of Scottsdale.
- US-60 and Loop 202 mainlines + frontages are ADOT.
- Tyler Mall, Orange St, and interior campus paths are ASU (Arizona Board of Regents) jurisdiction.
- S Farmer Ave, Forest Ave, College Ave, McAllister Ave, Lemon St inside Tempe are City of Tempe.
- Confidence: LOW (practitioner knowledge; draft must verify and NOT state as fact without a Tempe/ADOT map citation)

**4.3 ABOR is the jurisdictional owner for on-campus routes; ASU itself "is not authorized to accept service" of claims.**
Per ABOR's own service of process page, ASU (and NAU and UArizona) can't accept service of lawsuits or notices of claim. Claims must be served on the Arizona Board of Regents. This is the seam that hurts students: they file with ASU, which can't accept, and the 180-day clock keeps running.
- Source: https://www.azregents.edu/about/service-process
- Confidence: HIGH

---

## 5. Arizona statutory claim framework

**5.1 ARS 12-821.01 quoted verbatim from azleg.gov (retrieved 2026-04-23):**

> "A. Persons who have claims against a public entity, public school or a public employee shall file claims with the person or persons authorized to accept service for the public entity, public school or public employee as set forth in the Arizona rules of civil procedure within one hundred eighty days after the cause of action accrues. The claim shall contain facts sufficient to permit the public entity, public school or public employee to understand the basis on which liability is claimed. The claim shall also contain a specific amount for which the claim can be settled and the facts supporting that amount. Any claim that is not filed within one hundred eighty days after the cause of action accrues is barred and no action may be maintained thereon.
>
> B. For the purposes of this section, a cause of action accrues when the damaged party realizes he or she has been damaged and knows or reasonably should know the cause, source, act, event, instrumentality or condition that caused or contributed to the damage. [...]
>
> D. Notwithstanding subsection A, a minor or an insane or incompetent person may file a claim within one hundred eighty days after the disability ceases.
>
> E. A claim against a public entity or public employee filed pursuant to this section is deemed denied sixty days after the filing of the claim unless the claimant is advised of the denial in writing before the expiration of sixty days."

- Source: https://www.azleg.gov/ars/12/00821-01.htm
- Confidence: HIGH

**5.2 ARS 12-821 quoted verbatim:**

> "All actions against any public entity or public employee shall be brought within one year after the cause of action accrues and not afterward."

- Source: https://www.azleg.gov/ars/12/00821.htm
- Confidence: HIGH

**5.3 ARS 12-820 definition of "Maintenance" expressly excludes ordinary repair or upkeep:**

> "Maintenance means the establishment or continuation in existence of facilities, highways, roads, streets, bridges or rights-of-way by a public entity and does not mean or refer to ordinary repair or upkeep."

This definition feeds the affirmative-defense doctrine. A city can argue that pothole repair is "ordinary repair" and not actionable "maintenance" under the Actions Against Public Entities Act.
- Source: https://www.azleg.gov/ars/12/00820.htm
- Confidence: HIGH

**5.4 State Notice of Claim form: Arizona Department of Administration Risk Management.**
The state Notice of Claim form and instructions are hosted at the AZ Department of Administration Risk Management site. It states: "The statute requires the claim be filed with the State of Arizona within 180 days after the cause of action accrues."
- Source (PDF): https://staterisk.az.gov/sites/default/files/2023-03/Notice%20of%20Claim%20Form%20revised%2010_2020%20-%20AG%20ONLY%20website.pdf
- Source: https://staterisk.az.gov/resources/notice-claim-form
- Delivery address for ABOR/ASU: Office of the Attorney General, 2005 N. Central Avenue, Phoenix, AZ 85004 (per Staterisk).
- Confidence: HIGH

**5.5 ABOR policy 3-809 governs how contract claims against ABOR accrue; tort claims follow ARS 12-821.01.**
ABOR's own policy manual confirms the 180-day claim window (contract side). Tort claims for injured students go through AG Risk Management.
- Source: https://public.powerdms.com/ABOR/documents/1491879
- Source: https://www.azregents.edu/about/service-process
- Confidence: HIGH

**5.6 Arizona appellate case law: two cases matter.**

- **City of Phoenix v. Weedon, 71 Ariz. 259 (1951).** Arizona Supreme Court held that municipalities are liable for failure to keep streets and sidewalks reasonably safe, BUT a 3/4-inch pavement rise that had existed for years was "trivial as a matter of law" and supported directed verdict for the city. This is the doctrinal reason small potholes lose at summary judgment.
  - Source: https://www.casemine.com/judgement/us/5914cac3add7b049347fd401
  - Confidence: HIGH

- **Fong v. City of Phoenix, 1 CA-CV 23-0520 (Ariz. Ct. App. Div. 1, 2024).** Court of Appeals AFFIRMED summary judgment for the City of Phoenix and its contractor in a bicycle crash into an unbarricaded ditch in an active bike-lane excavation. Holding: expert testimony is required to establish prima facie negligence for failure to warn, barricade, or monitor excavation sites. This is recent, on point, and adverse to plaintiff cyclists.
  - Source: https://law.justia.com/cases/arizona/court-of-appeals-division-one-published/2024/1-ca-cv-23-0520.html
  - Confidence: HIGH

- No Arizona appellate opinion (2018-2026) squarely on an e-scooter pavement-defect crash was located. The Fong 2024 bike-lane ditch case is the closest analog. NOT FOUND for scooter-specific AZ precedent.

---

## 6. International student health insurance reality

**6.1 ASU mandatory F-1/J-1 plan 2025-2026: UnitedHealthcare Student Resources, $250 per-person per-year deductible.**
Plan year: August 16, 2025 to August 15, 2026. Platinum-level actuarial value 92.97%. Auto-enrollment for international students; no waiver unless sponsored. Plan covers inpatient and outpatient injury care (which includes e-scooter and bicycle injuries as general "injury" under the benefit schedule). Medical evacuation benefit $50,000; repatriation $25,000. Fall 2025 full-semester premium: $1,045 returning student / $1,258 new incoming.
- Source: https://eoss.asu.edu/health/billing-insurance/international-students
- Source (UHCSR 2025-2026 Benefit Summary PDF): https://www.uhcsr.com/uhcsrbrochures/Public/BenefitSummaryFlyers/2025-733-1%20Summary%20Flyer.pdf
- Confidence: HIGH (premiums and benefit summary retrieved)
- Limitations: specific ER copay and urgent-care copay amounts are NOT stated in the public flyer summary; the Certificate of Coverage contains those and would need to be pulled for exact numbers.

**6.2 National ER-visit cost benchmark:**
- $1,500 to $3,000 typical without insurance, UHC average $2,600.
  - Source: https://www.healthpartners.com/blog/emergency-room-visit-cost/
  - Source: https://integrityuc.com/cost-of-urgent-care-vs-emergency-room/
- HCUP 2021 data reports average treat-and-release ED visit cost of $750 (wholesale cost; patient-facing price is higher).
  - Source: https://hcup-us.ahrq.gov/reports/statbriefs/sb311-ED-visit-costs-2021.pdf
- Concussion ER work-up: $1,000+ base with CT scan adding $300-$3,000.
  - Source: https://www.bojatlaw.com/blog/concussion-treatment-costs-after-an-accident-who-covers-them/
- Confidence: MEDIUM (trade/legal secondary sources for headline figures; HCUP primary PDF for $750 wholesale)

**6.3 GoFundMe / student medical-debt trend data for ASU scooter injuries: NOT FOUND.**
No aggregated dataset of ASU-student-led GoFundMe campaigns for scooter injury medical bills was surfaced.

---

## 7. Comparable cities / best practice

**7.1 Austin (UT) has the AAA Bicycle Priority Network.**
Austin's Bicycle Priority Network plan calls for 1,200+ miles (250 miles complete as of source), with protected lanes using concrete barriers being phased in.
- Source: https://www.austintexas.gov/transportation-public-works/austin-bicycle-plan
- Confidence: HIGH

**7.2 Ann Arbor, Boulder, Madison, Davis campus-specific pavement-maintenance priority programs: NOT FOUND in this pass.**
Draft will need direct outreach or a municipal transportation dept. page retrieval for each.
- Confidence: LOW

**7.3 FHWA guidance is current; NACTO micromobility maintenance guidance: NOT FOUND.**
FHWA-SA-23-005, "Guide for Maintaining Active Transportation Infrastructure for Enhanced Safety" (2023), explicitly covers pavement maintenance for micromobility users alongside bicyclists and pedestrians and names maintaining good pavement quality as a micromobility safety measure.
- Source: https://www.pedbikeinfo.org/downloads/Guide_for_Maintaining_Active_Transportation_FHWA-SA-23-005_0.pdf
- Confidence: HIGH
- USDOT Shared Micromobility & Microtransit guide (2025) also relevant.
  - Source: https://www.transportation.gov/sites/dot.gov/files/2025-01/Shared%20Micromobility%20&%20Microtransit.pdf
  - Confidence: MEDIUM

---

## 8. Keyword validation (Phoenix metro / US English)

Google Ads volume endpoint returned null volumes for 7 of 8 terms (the API account returns null when the terms are ultra-low-volume or restricted). Bing volumes returned 0 across the board. This is a finding, not a failure: these are hyperlocal legal terms with tiny monthly search volume. That matches the thesis. Injured students aren't searching for them because they don't know what to search for. The play is topical authority and SEO for the story cluster ("asu scooter accident," "arizona 180 day claim") built up over time, not intent-capture on these exact heads.

| Keyword | Vol (Google Ads) | Vol (Bing) | Top 3 organic URLs |
|---|---|---|---|
| tempe scooter accident lawyer | null | 0 | sorensonlaw.net/tempe-injury/tempe-scooter-accident-lawyer ; yearinlaw.com/tempe-scooter-accident-lawyer ; toblerlaw.com/scooter-accident-attorney-tempe |
| asu scooter injury | null | 0 | reddit.com/r/ASU/comments/16u8kg6/scooters_are_a_disease ; instagram.com reel ; statepress.com/article/2023/10/enforce-scooter-ban |
| arizona notice of claim 180 days | null | 0 | azleg.gov/ars/12/00821-01.htm ; hartleylawusa.com/the-180-day-rule-claims-against-phoenix-government-agencies ; plattner-verderame.com/blog/how-arizonas-notice-of-claim-requirement-affects-lawsuits-against-public-entities |
| tempe pothole lawsuit | null | 0 | facebook.com/groups/tempeliving/posts/3230491967106108 ; tempe.gov/i-want-to/report-a-water-leak ; reddit.com/r/legaladvice/comments/m0ul81 |
| phoenix e scooter injury | null | 0 | fox10phoenix.com/news/doctors-warn-spike-e-bike-scooter-injuries-chandler-hospital ; plattner-verderame.com/practice-areas/e-scooter-injury ; (thin SERP) |
| arizona government claim form | null | 0 | staterisk.az.gov (Notice of Claim Form PDF) ; azdor.gov (unclaimed property, not relevant) ; staterisk.az.gov/resources/notice-claim-form |
| tempe bicycle accident attorney | 10 | 0 | phillipslaw.com/tempe-injury/bicycle-accident-lawyer ; kent-law.org/personal-injury/bicycle-accidents ; sorensonlaw.net/tempe-injury/bicycle-injury-attorney |
| asu student insurance scooter | null | 0 | cfo.asu.edu/bike ; cfo.asu.edu/vehicle-insurance ; cfo.asu.edu/claims |

- Source (keyword volume raw): /Users/taqticlaw/Projects/azlawnow/data/research/raw/kw_search_volume.json
- Source (SERP raw): /Users/taqticlaw/Projects/azlawnow/data/research/raw/serp_*.json
- Confidence: HIGH on SERP URLs; MEDIUM on volume because most returned null (low-volume suppression).

**Opportunity read:** every top-three organic for the legal intent terms is a PI law firm in a thin SERP. A journalism-voice article from Brendan Franks (editorial, not lawyer-advertorial) has a wide open lane to rank for the legal explainer cluster, especially "arizona notice of claim 180 days" and "asu student insurance scooter."

---

## 9. Named sources for outreach after publication

**9.1 Tempe Mayor and Council (verified from tempe.gov 2026-04-23):**

| Role | Name | Email | Direct |
|---|---|---|---|
| Mayor | Corey D. Woods (term 2028) | corey_woods@tempe.gov | 480-350-8793 |
| Vice Mayor | Doreen Garlid (term 2028) | doreen_garlid@tempe.gov | 480-350-8796 |
| Councilmember | Jennifer Adams (term 2026) | jennifer_adams@tempe.gov | 480-350-8835 |
| Councilmember | Nikki Amberg (term 2028) | nikki_amberg@tempe.gov | 480-350-8209 |
| Councilmember | Arlene Chin (term 2026) | arlene_chin@tempe.gov | 480-350-8797 |
| Councilmember | Berdetta Hodge (term 2026) | berdetta_hodge@tempe.gov | 480-350-8748 |
| Councilmember | Randy Keating (term 2028) | randy_keating@tempe.gov | 480-350-8798 |

- Group contact: councilcommunicator@tempe.gov
- Mayor/Council Relations Director: Tanya Chavez, tanya_chavez@tempe.gov, 480-858-2215
- Source: https://www.tempe.gov/government/mayor-and-city-council
- Confidence: HIGH

**9.2 Motorized and Electric Mobility Device Safety Subcommittee (formed Dec 2025):**
The subcommittee is the single highest-value outreach hook because it was formed in direct response to e-bike/scooter crash data and is actively drafting regulations. Member roster and meeting schedule are posted on the Tempe subcommittees page.
- Source: https://www.tempe.gov/government/mayor-and-city-council/council-subcommittees/motorized-and-electric-mobility-device-safety-council-subcommittee
- Confidence: HIGH (page exists; draft should pull specific member names from the page when writing)

**9.3 ASU Undergraduate Student Government (2025-2026 term, reported April 2025):**
- USG-Tempe President: Rishik Chaudhary
- VP Services: Martin Hammond
- VP Policy: Hillary Garcia
- USG-Downtown President: Laura Doyle
- USG-Polytechnic President: Shreya (freshman, fintech)
- USG-West President: Joshua Cole
- Source: https://www.statepress.com/article/2025/04/politics-usg-results-election-67ff1662ba688
- Source: https://www.asuusgt.org/copy-of-executives
- Confidence: MEDIUM (secondary reporting; confirm via current asuusgt.org roster)

**9.4 GPSA / graduate student leadership 2025-2026: NOT FOUND with verified source.**
The 2026-27 Associated Students of ASU election results (reported April 2026) show Tharun Goud Dasugari as GSG president; this is next-year leadership, not current.
- Source: https://www.statepress.com/article/2026/04/politics-asasu-election-results-2026
- Confidence: LOW

**9.5 ASU International Students and Scholars Center public contact: NOT FOUND in this pass.**
Draft should retrieve directly from goglobal.asu.edu when writing.
- Likely landing: https://goglobal.asu.edu/international/health

**9.6 Tempe Bicycle and Pedestrian Advisory Commission members: NOT FOUND in this pass.**
The Tempe boards-and-commissions landing returned a CMS 404 during retrieval. Draft will need a direct records request or fresh fetch.

**9.7 Journalism beat contacts:** NOT FOUND with verified current mastheads. Confirmed channels:
- The State Press masthead (current staff bylines accessible via author pages, e.g., /staff/carlyrae-jones, /staff/grace_lawrence; editor-in-chief masthead URL not extracted)
- Cronkite News via cronkitenews.azpbs.org (recent Tempe beat byline: Culdesac coverage)
- AZ Central reporters active on the Tempe beat via azcentral.com (2025 scooter-subcommittee byline not extracted by name in this pass)
- Confidence: LOW (draft should do a direct fetch of each masthead at write time for current editor names)

**9.8 Advocacy organizations and PI firms publicly marketing Tempe scooter/bike practice:**

PI firms marketing "Tempe scooter accident" or "Tempe bicycle accident":
- Sorenson Law Firm: sorensonlaw.net/tempe-injury/tempe-scooter-accident-lawyer ; 480-839-9500 ; 950 W Elliot Rd Suite 226, Tempe, AZ 85284
- Yearin Law Office: yearinlaw.com/tempe-scooter-accident-lawyer
- Tobler Law: toblerlaw.com/scooter-accident-attorney-tempe
- Bala Legal Services: balalegalservices.com/case-types/scooter-accident
- Plattner Verderame: plattner-verderame.com/practice-areas/e-scooter-injury ; 602-266-2002
- Klink Law: davidklink.com/personal-injury/scooter-share-injury-lawyer
- Lerner and Rowe: lernerandrowe.com/arizona/phoenix/scooter-accident-injuries ; 602-977-1900
- Victory Legal (Arizona e-scooter practice): victorylegalsolutions.net/legal-help-for-electric-scooter-accident-in-arizona
- Phillips Law Group: phillipslaw.com/tempe-injury/bicycle-accident-lawyer
- Kent Law: kent-law.org/personal-injury/bicycle-accidents

Advocacy orgs in Phoenix metro:
- Bike Tempe: biketempe.org (publishes annual Tempe Bike Count Report; the 2024 report PDF is at https://www.biketempe.org/wp-content/uploads/2024/07/Tempe-Bike-Count-Report-2024.pdf ). Active on council candidate questionnaires on cycling infrastructure and safety.
- Vision Zero Phoenix / regional advocacy: NOT FOUND with a verified primary contact in this pass.
- Confidence: HIGH (law firms) / MEDIUM (Bike Tempe) / LOW (Vision Zero specific org)

---

## 10. Dead ends and follow-up records requests

These items couldn't be retrieved in this pass and will need a phone call, records request, or direct scrape when the draft is written. The draft should either cite the gap honestly or defer the claim:

1. Tempe 311 pothole ticket volume, backlog, and average repair time. Needs a PRR to City of Tempe or a direct query of the Socrata endpoint behind data.tempe.gov.
2. Segment-by-segment PCI scores for streets named in the brief. Needs a Tempe Public Works records request.
3. FY 2024-2026 Tempe street-maintenance line-item budget figures. Tempe CMS migration broke the old budget landing; fresh fetch of the current budget PDF is needed.
4. Current Tempe scooter-operator permit list, agreement text, fleet caps, and injury-reporting clauses. PRR.
5. Verified Tempe/ADOT jurisdictional overlay showing who owns each named road.
6. Arizona appellate or trial-court opinion squarely on an e-scooter pavement-defect injury.
7. ASU International Students and Scholars Center direct public contact.
8. GPSA 2025-2026 current leadership verified via an asu.edu URL.
9. AZ Republic, Cronkite News, and State Press current mastheads (editor-in-chief names for outreach).
10. Tempe Bicycle and Pedestrian Advisory Commission roster.
11. UHCSR ASU plan Certificate of Coverage exact ER and urgent-care copay dollar figures.
12. ASU Clery Annual Security Report exact 2024 figures (the landing page exists; PDF not retrieved).
13. CPSC NEISS direct primary PDF for 118,485 figure (the number was cited via trade press; draft should verify via cpsc.gov query).

---

## Appendix: raw research artifacts

All primary retrieval outputs saved to:
- /Users/taqticlaw/Projects/azlawnow/data/research/raw/pplx_*.json (generative-search answers with citations)
- /Users/taqticlaw/Projects/azlawnow/data/research/raw/scrape_*.json (web scrapes of named URLs)
- /Users/taqticlaw/Projects/azlawnow/data/research/raw/search_*.json (web searches)
- /Users/taqticlaw/Projects/azlawnow/data/research/raw/serp_*.json (SERP top organic results per keyword)
- /Users/taqticlaw/Projects/azlawnow/data/research/raw/kw_search_volume.json (Google Ads volume)
- /Users/taqticlaw/Projects/azlawnow/data/research/raw/kw_bing.json (Bing volume)
- /Users/taqticlaw/Projects/azlawnow/data/research/raw/kw_kw4kw.json (Google Ads keywords-for-keywords)
