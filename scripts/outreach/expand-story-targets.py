#!/usr/bin/env python3
"""
Expand per-story targets files with Hunter contacts from the DB.

For each of the 8 drainable stories, pull unsent, non-DNC contacts
whose segment overlaps the article's target segments, attach a
per-segment personalization_hook (bomb_stat anchored, >=30 chars,
no em-dashes, contractions, person-first), and append to the
existing targets/<slug>.json file without duplicating existing emails.

Usage:
    python3 scripts/outreach/expand-story-targets.py
"""
import json
import os
import sqlite3
from pathlib import Path

ROOT = Path(os.path.expanduser("~/Projects/azlawnow"))
DB = ROOT / "data/outreach/azlawnow-outreach.db"
TARGETS_DIR = ROOT / "data/outreach/targets"

# The 8 stories to expand tonight
STORIES = [
    "arizona-mayes-ice-surprise-detention-lawsuit",
    "walgreens-350m-arizona-opioid-stores",
    "arizona-schools-merv-13-filter-bypass",
    "arizona-pedestrian-deaths-road-design",
    "aps-korman-heat-disconnect-7m-settlement",
    "arizona-nursing-homes-billing-fraud-and-abuse",
    "grand-court-mesa-elder-abuse-hb2228",
    "arizona-school-restraint-data",
    "bnsf-phoenix-subdivision-corpus",
]

# Per-story, per-segment personalization hooks.
# Rules: >=30 chars, no em-dashes, contractions, person-first, bomb_stat anchored.
HOOKS = {
    "arizona-mayes-ice-surprise-detention-lawsuit": {
        "az_journalist": "AG Mayes' April 2026 federal suit over the Surprise detention site is worth a look: the government paid $70M for a warehouse directly across from a chlorine and hydrofluoric-acid storage facility, and the EPA Risk Management Plan was filed three weeks before the federal purchase.",
        "national_consumer": "Arizona's AG is suing to block a 1,500-bed federal detention facility because the proposed site sits across from a warehouse storing chlorine and hydrofluoric acid. The EPA RMP was filed January 1, 2026, three weeks before the federal purchase.",
        "national_tech": "Arizona's AG filed a NEPA challenge to a 1,500-bed ICE facility in Surprise after the federal government paid $70M for a site directly across from a Rinchem chlorine and hydrofluoric-acid warehouse. RMP timing overlap is the central factual hook.",
        "community_org": "AG Mayes filed State of Arizona v. Mullin in April 2026 over a proposed 1,500-bed ICE facility in Surprise. The federal site sits across from a chlorine and hydrofluoric-acid storage warehouse, and three other states already won or filed similar suits in 2026.",
        "elder-care": "Arizona's AG sued DHS over a 1,500-bed detention site in Surprise that sits across the street from a chlorine and hydrofluoric-acid warehouse. The federal purchase was $70M. Clean Air Act, NEPA, and INA claims.",
        "elder_care_nonprofit": "The proposed 1,500-bed ICE facility in Surprise sits across from a Rinchem warehouse storing chlorine, hydrofluoric acid, and fluorine. AG Mayes filed a federal suit April 24, 2026, citing NEPA and Clean Air Act violations.",
        "victim_advocacy": "Arizona filed suit April 24, 2026 to block a 1,500-bed ICE detention facility in Surprise. The site is directly across from a chlorine and hydrofluoric-acid warehouse, and the EPA Risk Management Plan was filed three weeks before the federal purchase.",
        "traffic_safety_advocate": "AG Mayes' suit over the Surprise ICE facility includes Clean Air Act claims tied to a hydrofluoric-acid and chlorine warehouse directly across the street. Three other state AGs filed similar suits in 2026, one with a TRO win in March.",
    },
    "walgreens-350m-arizona-opioid-stores": {
        "az_journalist": "Walgreens settled up to $350M with DOJ-EDNY in April 2025 for filling unlawful opioid prescriptions. The specific Arizona store locations tied to the settlement aren't in any public filing we could find. We mapped them from DEA registration data.",
        "national_consumer": "Walgreens agreed to pay up to $350M to DOJ in April 2025 for dispensing unlawful opioid prescriptions. We pulled DEA records to identify which Arizona Walgreens locations were part of the pattern.",
        "national_tech": "Walgreens' $350M DOJ settlement covers unlawful opioid dispensing. The underlying DEA registrant data isn't in the settlement documents, so we cross-referenced federal pharmacy records to surface the Arizona store list.",
        "healthcare_advocate": "Walgreens' $350M DOJ-EDNY settlement for filling unlawful opioid prescriptions doesn't name the specific Arizona locations. We traced DEA registration records and published the store-level breakdown for Arizona.",
        "community_org": "Walgreens settled for $350M over unlawful opioid prescriptions in April 2025. We used DEA data to build out which Arizona locations were in scope, since the federal settlement doesn't list them by state.",
        "az_journalist_health": "Walgreens' April 2025 opioid settlement with DOJ-EDNY tops $350M. No public document names the Arizona stores, so we cross-referenced DEA dispensing registrations to surface the location list.",
        "elder-care": "Walgreens settled up to $350M with federal prosecutors for filling unlawful opioid prescriptions. We mapped which Arizona locations were part of the pattern using DEA records, since the settlement itself doesn't name them.",
        "education_advocate": "Walgreens agreed to pay up to $350M for filling unlawful opioid prescriptions. We pulled DEA records to publish the Arizona-specific store breakdown that's missing from the settlement documents.",
        "elder_care_nonprofit": "Walgreens' $350M DOJ settlement for unlawful opioid dispensing doesn't identify which Arizona locations were involved. We mapped them from federal DEA registration data.",
    },
    "arizona-schools-merv-13-filter-bypass": {
        "az_journalist": "Arizona school districts bought MERV 13 filters, but ASHRAE 241-2023 says the filters don't work if the housing isn't sealed. Maricopa County is in serious PM2.5 non-attainment, EPA tightened the annual standard to 9 micrograms in February 2024, and no district publishes its own readings.",
        "education_advocate": "ASHRAE's 2023 standard says MERV 13 filters are only as good as the housing seal around them. Arizona districts bought the filters, but none publish PM2.5 readings, and Maricopa is already in serious non-attainment under EPA's tightened 9 microgram standard.",
        "education_reporter": "Arizona school districts installed MERV 13 filters after COVID, but ASHRAE 241-2023 says air that bypasses a leaky housing performs as if a lower MERV were installed. No district in Maricopa, which is in PM2.5 serious non-attainment, has published indoor air readings.",
        "school_board": "ASHRAE 241-2023 is plain about it: air that goes around the filter housing doesn't get cleaned. Arizona districts bought MERV 13 filters, but EPA tightened the PM2.5 standard to 9 micrograms in February 2024, and Maricopa is in serious non-attainment. No district publishes readings.",
        "community_org": "Arizona school districts bought MERV 13 filters, but none publish PM2.5 readings. ASHRAE 241-2023 says the system performs as if a lower-grade filter is installed when housing isn't sealed. Maricopa is in serious non-attainment under EPA's current 9 microgram standard.",
        "child_advocacy_nonprofit": "Studies in NEJM, PNAS, and JAMA Psychiatry link PM2.5 to autism and IQ loss. Arizona school districts bought MERV 13 filters, but ASHRAE 241-2023 says they only work if the housing is sealed. Maricopa is in PM2.5 serious non-attainment. No district publishes its air readings.",
        "disability_rights": "ASHRAE 241-2023 says air bypassing a leaky filter housing performs as if a lower MERV were installed. Maricopa County is in PM2.5 serious non-attainment, EPA's annual standard is 9 micrograms, and peer-reviewed studies link PM2.5 to autism and IQ loss. No Arizona school district publishes its readings.",
        "homeschool_parent": "Arizona districts bought MERV 13 filters, but ASHRAE 241-2023 says the filtration is only as good as the housing seal. EPA tightened the PM2.5 annual limit to 9 micrograms in February 2024. Maricopa is in serious non-attainment and no district publishes air quality data.",
        "mommy_blogger": "Arizona school districts installed MERV 13 air filters, but ASHRAE says they don't work if the housing leaks. Maricopa County is in PM2.5 serious non-attainment under the EPA's 2024 standard, and no district publishes its own indoor air readings.",
        "national_consumer": "ASHRAE 241-2023 says MERV 13 filters perform as if lower-grade when housing isn't sealed. Maricopa County is in PM2.5 serious non-attainment. EPA tightened the annual limit to 9 micrograms in 2024. No Arizona school district publishes indoor PM2.5 readings.",
        "national_tech": "ASHRAE 241-2023 defines the filtration bypass problem in plain English: air around a leaky housing isn't cleaned. Arizona school districts bought MERV 13 filters after COVID. Maricopa is in PM2.5 serious non-attainment. No district publishes air quality data.",
        "public_health_official": "ASHRAE 241-2023 is clear that MERV 13 filtration is only as good as the housing seal. Maricopa County is in PM2.5 serious non-attainment under EPA's 9 microgram annual standard. NEJM, PNAS, and JAMA Psychiatry studies link PM2.5 to respiratory, cognitive, and developmental harm.",
    },
    "arizona-pedestrian-deaths-road-design": {
        "az_journalist": "Arizona's pedestrian death rate is nearly twice the national average. 263 people were killed walking in 2024. The data points at arterial road design: stroads built for cars, not people on foot.",
        "national_consumer": "263 pedestrians were killed in Arizona in 2024. The state's rate is nearly twice the national average, and the design of arterial roads is a structural driver, not just driver behavior.",
        "community_org": "Arizona recorded 263 pedestrian deaths in 2024, a rate nearly double the national average. The pattern ties to how arterial roads were designed: wide, fast, and with minimal protection for people crossing on foot.",
        "traffic_safety_advocate": "Arizona's pedestrian fatality rate is almost twice the national average. 263 people were killed on foot in 2024. The road design data points at high-speed arterials built without crosswalk infrastructure or pedestrian signal timing.",
        "pedestrian_safety_advocate": "263 pedestrians were killed in Arizona in 2024. The state's rate is nearly twice the national average. We mapped the fatality data by road type and found the arterial design pattern driving it.",
        "az_journalist_transport": "Arizona's 2024 pedestrian death toll hit 263, nearly twice the national rate per capita. The road design literature and ADOT crash data both point to the same corridors: fast arterials with no median refuges and no countdown signals.",
        "education_reporter": "263 pedestrians were killed in Arizona in 2024. The state's rate is nearly double the national average. Road design is the structural driver: wide, high-speed arterials with minimal infrastructure for people crossing on foot.",
        "elder-care": "Arizona's pedestrian death rate is nearly twice the national average. 263 people were killed walking in 2024. Older adults are disproportionately represented in the fatality data on arterials designed without adequate crossing infrastructure.",
        "elder_care_nonprofit": "263 pedestrians were killed in Arizona in 2024, nearly twice the national rate. Older adults are over-represented in the data on arterials that lack median refuges, leading pedestrian intervals, and adequate signal timing.",
        "national_tech": "Arizona's pedestrian fatality rate is nearly double the national average. 263 deaths in 2024. The road design data shows the arterial corridor pattern, not random distribution, which is the structural fix angle.",
    },
    "aps-korman-heat-disconnect-7m-settlement": {
        "az_journalist": "AG Mayes settled for $7M with APS over the May 19, 2024 heat death of Katherine Korman, 82, in Sun City West. APS had dropped the 95-degree heat hold three days before her power was cut. The settlement restores that protection as a binding obligation.",
        "elder-care": "Katherine Korman, 82, died in Sun City West on May 19, 2024, six days after APS cut power and three days after the utility dropped its own 95-degree heat hold. AG Mayes settled for $7M. The settlement reinstates the heat hold as a binding obligation.",
        "elder_care_nonprofit": "APS dropped its 95-degree heat hold three days before cutting power to Katherine Korman's home in Sun City West. She was 82. She died six days later. AG Mayes secured a $7M settlement that reinstates the heat protection as a contractual obligation.",
        "healthcare_advocate": "Arizona AG Mayes' $7M APS settlement came after the 2024 heat death of an 82-year-old Sun City West woman. APS had unilaterally dropped its 95-degree heat hold shortly before disconnecting her service. The settlement reinstates the protection as binding.",
        "national_consumer": "APS dropped its own 95-degree heat hold before cutting power to an 82-year-old Sun City West woman in May 2024. She died six days later. AG Mayes settled for $7M and reinstated the heat protection as a binding utility obligation.",
        "community_org": "Arizona AG secured $7M from APS after the May 2024 heat death of an 82-year-old Sun City West woman. APS had dropped the 95-degree heat hold protocol three days before cutting her power. Settlement terms restore the protection.",
        "public_health_official": "APS settled for $7M after a Sun City West woman, 82, died in the heat six days after the utility cut her power and three days after APS dropped its own heat-hold protocol. The settlement reinstates the 95-degree protection as a binding obligation.",
        "ombudsman": "APS dropped its internal 95-degree heat hold protocol before disconnecting power to an 82-year-old Sun City West resident in May 2024. She died six days later. AG Mayes settled for $7M. The settlement reinstates the heat protection as a binding obligation.",
        "victim_advocacy": "Arizona AG settled for $7M with APS after the May 2024 heat death of an 82-year-old woman in Sun City West. The utility had dropped its own 95-degree heat hold three days before cutting her power. The settlement reinstates that protection.",
        "labor_advocate": "APS cut power to an 82-year-old Sun City West woman after dropping its 95-degree heat hold protocol. She died six days later in May 2024. AG Mayes settled for $7M. The settlement reinstates the heat protection as a binding utility obligation.",
        "medicaid_advocate": "Arizona's $7M APS settlement came after an 82-year-old Sun City West woman died in the heat six days after her power was cut. APS had dropped its own 95-degree heat hold days before the disconnect. The settlement restores that protection as binding.",
    },
    "arizona-nursing-homes-billing-fraud-and-abuse": {
        "az_journalist": "52 of 142 CMS-rated Arizona nursing homes carry 1- or 2-star ratings. APS substantiates under 1% of investigated elder-abuse reports, versus a national rate of 29-33%. Allegiant Healthcare of Mesa has 33 violations since 2019.",
        "elder-care": "52 of 142 CMS-rated Arizona nursing homes carry 1- or 2-star ratings. APS substantiates under 1% of investigated reports, far below the national 29-33% rate. The billing-fraud audit is a care-quality audit running in parallel.",
        "elder_care_nonprofit": "Arizona's Adult Protective Services substantiates under 1% of investigated elder-abuse reports, versus 29-33% nationally. 52 of 142 CMS-rated Arizona nursing homes are 1- or 2-star. Allegiant Healthcare of Mesa has 33 CMS violations since 2019.",
        "healthcare_advocate": "52 of 142 CMS-rated Arizona nursing homes carry 1- or 2-star ratings. APS substantiates under 1% of investigated reports vs a national benchmark of 29-33%. The gap between billing audits and care audits is the structural story.",
        "national_consumer": "Arizona APS substantiates under 1% of elder-abuse reports it investigates, compared to 29-33% nationally. 52 of 142 CMS-rated Arizona nursing homes are 1- or 2-star. The billing-fraud and care-quality failures are linked.",
        "community_org": "52 of 142 CMS-rated Arizona nursing homes carry 1- or 2-star ratings. Arizona APS substantiates under 1% of investigated elder-abuse reports, far below the national rate. Allegiant Healthcare of Mesa has 33 CMS violations since 2019.",
        "ombudsman": "Arizona APS substantiates under 1% of investigated elder-abuse reports versus a 29-33% national benchmark. 52 of 142 CMS-rated Arizona nursing homes are 1- or 2-star facilities. Allegiant Healthcare of Mesa: 33 violations since 2019.",
        "medicaid_advocate": "52 of 142 CMS-rated AZ nursing homes carry 1- or 2-star ratings. APS substantiates under 1% of investigated reports, versus 29-33% nationally. The billing-fraud data and care-quality data point at the same 52 facilities.",
        "victim_advocacy": "Arizona's Adult Protective Services substantiates under 1% of elder-abuse reports, versus 29-33% nationally. 52 of 142 CMS-rated Arizona nursing homes are 1- or 2-star. The billing-fraud audit is also a care audit.",
    },
    "grand-court-mesa-elder-abuse-hb2228": {
        "az_journalist": "60% of nursing home sexual-abuse victims have dementia. 80% of perpetrators are caregivers. Only 30% of cases reach law enforcement. The Grand Court Mesa arrest drove HB2228 this session.",
        "elder-care": "60% of nursing home sexual-abuse victims have dementia. 80% of perpetrators are caregivers. Only 30% of cases reach law enforcement. The Grand Court Mesa case and HB2228 are the Arizona anchors.",
        "elder_care_nonprofit": "Only 30% of elder sexual-abuse cases in care facilities reach law enforcement. 60% of victims have dementia. 80% of perpetrators are caregivers. A Mesa arrest this year is the backdrop to HB2228.",
        "healthcare_advocate": "Nationally, 60% of sexual-abuse victims in nursing facilities have dementia, 80% of perpetrators are caregivers, and only 30% of cases reach law enforcement. A Grand Court Mesa arrest this year drove HB2228 in the Arizona Legislature.",
        "community_org": "60% of nursing home sexual-abuse victims have dementia, 80% of perpetrators are caregivers, and only 30% of cases reach law enforcement. A Mesa arrest this year is the direct driver of HB2228.",
        "national_consumer": "Only 30% of elder sexual-abuse cases in nursing facilities reach law enforcement. 60% of victims have dementia. 80% of perpetrators are caregivers. Arizona's HB2228 came directly out of a Grand Court Mesa arrest.",
        "victim_advocacy": "60% of nursing home sexual-abuse victims have dementia. 80% of perpetrators are caregivers. Only 30% of cases reach law enforcement. The Grand Court Mesa arrest this year drove HB2228 in the Arizona Legislature.",
        "education_advocate": "60% of nursing-facility sexual-abuse victims have dementia. 80% of perpetrators are caregivers. Only 30% of cases reach law enforcement. Arizona's HB2228 came out of a Grand Court Mesa arrest this year.",
    },
    "arizona-school-restraint-data": {
        "az_journalist": "Arizona schools reported more than 4,200 student-restraint incidents last year. The data is public record but almost never aggregated. We pulled it at the school level and found the concentration in Maricopa.",
        "education_advocate": "Arizona schools reported more than 4,200 student-restraint incidents last year. Kids with IEPs and 504 plans are over-represented. The data is public but has never been published at the school level until now.",
        "education_reporter": "Arizona reported 4,200+ student-restraint incidents last year. We pulled the school-level data from ADE and aggregated by district. The concentration is in Maricopa County, and kids on IEPs are disproportionately affected.",
        "school_board": "Arizona schools reported more than 4,200 restraint incidents last year. The school-level data from ADE shows where the concentration is and which districts are outliers. Kids with IEPs and 504 plans are over-represented.",
        "child_advocacy_nonprofit": "Arizona reported 4,200+ student-restraint incidents last year. Kids with IEPs and 504 plans are over-represented in the data. We published the school-level breakdown for Maricopa County.",
        "disability_rights": "More than 4,200 restraint incidents were reported in Arizona schools last year. Kids with IEPs and 504 plans are disproportionately affected. We pulled the school-level data from ADE and published it.",
        "disability_services": "Arizona schools reported 4,200+ restraint incidents last year. Students with IEPs and 504 plans are over-represented in the data. We pulled and published the school-level breakdown from ADE records.",
        "mommy_blogger": "Arizona schools reported more than 4,200 student-restraint incidents last year. Kids on IEPs are disproportionately affected. We pulled the data at the school level and published it, because it wasn't anywhere in one place.",
        "national_consumer": "Arizona schools reported 4,200+ restraint incidents last year. The data is public record but has never been aggregated at the school level. We pulled it from ADE and published the breakdown.",
        "national_tech": "4,200+ student-restraint incidents reported by Arizona schools last year. The data exists in ADE public records but has never been aggregated. We pulled and published the school-level data for Maricopa County.",
        "community_org": "Arizona schools reported more than 4,200 restraint incidents in the most recent school year. We pulled the school-level ADE data and found the concentration in Maricopa. Kids with IEPs are over-represented.",
        "homeschool_parent": "Arizona schools reported 4,200+ student-restraint incidents last year. Kids with IEPs are over-represented. The data is in public ADE records, but we aggregated it at the school level for the first time.",
        "public_health_official": "Arizona schools reported 4,200+ restraint incidents last year. Students with IEPs are over-represented. The school-level data from ADE has never been aggregated and published until now.",
    },
    "bnsf-phoenix-subdivision-corpus": {
        "az_journalist": "BNSF wrote AUTO PRECEDED THE GATES in 5 federal Form 6180.57 filings at 3 different Phoenix Subdivision grade crossings between November 2017 and January 2026. The crossings span a 4.2-mile west Phoenix corridor. None have channelizing medians or four-quadrant gates per the FRA inventory.",
        "national_consumer": "We pulled the FRA Office of Safety Analysis per-crossing accident PDFs for all 82 BNSF Phoenix Subdivision at-grade public crossings in Arizona. Same phrase, AUTO PRECEDED THE GATES, repeats at three of them across five separate filings. Federal record, fully public.",
        "national_tech": "Federal-record corpus analysis: we extracted text from 82 FRA Form 6180.57 PDFs and found one phrase, AUTO PRECEDED THE GATES, at three crossings across five filings on the BNSF Phoenix Subdivision. The methodology is reproducible. All source documents are public.",
        "community_org": "BNSF Railway Company filed the same phrase, AUTO PRECEDED THE GATES, in 5 federal accident reports at 3 west Phoenix grade crossings between 2017 and 2026. None of the three has channelizing medians per the FRA inventory. Records are public.",
        "rail-safety": "Federal-record corpus on BNSF Phoenix Subdivision: 5 Form 6180.57 filings, 3 crossings, identical narrative phrase. The 4.2-mile corridor lacks channelizing medians, four-quadrant gates, and the supplementary safety measures specified by 49 CFR Part 222 Appendix A.",
        "transit-infrastructure": "BNSF wrote AUTO PRECEDED THE GATES in 5 federal accident filings across 3 crossings on a 4.2-mile west Phoenix arterial corridor. The federal mitigations specified by 49 CFR 222 Appendix A weren't installed at any of the three per the most recent FRA inventory.",
        "pedestrian-safety": "BNSF's own federal filings document the same failure phrase at 3 Phoenix grade crossings: AUTO PRECEDED THE GATES. The corridor lacks channelizing medians and four-quadrant gates per the FRA inventory revised July 2025. Public-record finding.",
        "data-investigations": "Pulled all 82 BNSF Phoenix Subdivision per-crossing accident PDFs from FRA. Extracted text, searched for the phrase AUTO PRECEDED THE GATES. Found it at exactly three crossings, five filings, between 2017 and 2026. The methodology is reproducible from the public FRA query interface.",
        "courts-legal": "Editorial commentary on FRA Form 6180.57 records across a 4.2-mile west Phoenix arterial corridor. The form itself isn't admissible under 49 USC 20903, but the underlying public-record facts are. Five BNSF filings, three crossings, identical narrative phrase.",
        "general-az-news": "AZ Law Now just published a corpus pull of FRA Office of Safety Analysis records on the BNSF Phoenix Subdivision in Arizona. The same narrative phrase, AUTO PRECEDED THE GATES, appears at three crossings across five filings. Public records, federal docket.",
    },
}

# Story -> relevant segments (drawn from content_assets.segments + extended set)
STORY_SEGMENTS = {
    "arizona-mayes-ice-surprise-detention-lawsuit": [
        "az_journalist", "community_org", "national_consumer", "national_tech",
        "victim_advocacy", "traffic_safety_advocate",
    ],
    "walgreens-350m-arizona-opioid-stores": [
        "az_journalist", "national_consumer", "national_tech", "healthcare_advocate",
        "community_org", "elder-care", "elder_care_nonprofit",
    ],
    "arizona-schools-merv-13-filter-bypass": [
        "az_journalist", "education_advocate", "education_reporter", "school_board",
        "community_org", "child_advocacy_nonprofit", "disability_rights",
        "homeschool_parent", "mommy_blogger", "national_consumer", "national_tech",
        "public_health_official",
    ],
    "arizona-pedestrian-deaths-road-design": [
        "az_journalist", "national_consumer", "community_org", "traffic_safety_advocate",
        "pedestrian_safety_advocate", "elder-care", "elder_care_nonprofit",
        "education_reporter", "national_tech",
    ],
    "aps-korman-heat-disconnect-7m-settlement": [
        "az_journalist", "elder-care", "elder_care_nonprofit", "healthcare_advocate",
        "national_consumer", "community_org", "public_health_official", "ombudsman",
        "victim_advocacy", "labor_advocate", "medicaid_advocate",
    ],
    "arizona-nursing-homes-billing-fraud-and-abuse": [
        "az_journalist", "elder-care", "elder_care_nonprofit", "healthcare_advocate",
        "national_consumer", "community_org", "ombudsman", "medicaid_advocate",
        "victim_advocacy",
    ],
    "grand-court-mesa-elder-abuse-hb2228": [
        "az_journalist", "elder-care", "elder_care_nonprofit", "healthcare_advocate",
        "community_org", "national_consumer", "victim_advocacy", "education_advocate",
    ],
    "arizona-school-restraint-data": [
        "az_journalist", "education_advocate", "education_reporter", "school_board",
        "child_advocacy_nonprofit", "disability_rights", "disability_services",
        "mommy_blogger", "national_consumer", "national_tech", "community_org",
        "homeschool_parent", "public_health_official",
    ],
    "bnsf-phoenix-subdivision-corpus": [
        "az_journalist", "national_consumer", "national_tech", "community_org",
        "rail-safety", "transit-infrastructure", "pedestrian-safety",
        "data-investigations", "courts-legal", "general-az-news",
    ],
}

# Story -> relevance note for new contacts
RELEVANCE_NOTES = {
    "arizona-mayes-ice-surprise-detention-lawsuit": "AG Mayes' federal suit blocks 1,500-bed ICE facility in Surprise over chemical hazard proximity. NEPA, Clean Air Act, INA claims. $70M federal purchase. Chlorine/HF warehouse across the street.",
    "walgreens-350m-arizona-opioid-stores": "Walgreens $350M DOJ-EDNY settlement for unlawful opioid dispensing. Store-level Arizona breakdown built from DEA records. Missing public record angle.",
    "arizona-schools-merv-13-filter-bypass": "ASHRAE 241-2023 bypass problem in Arizona schools. Maricopa in PM2.5 serious non-attainment. No district publishes indoor air data. Studies link PM2.5 to autism and IQ loss.",
    "arizona-pedestrian-deaths-road-design": "263 pedestrian deaths in Arizona in 2024, nearly twice the national average. Road design is the structural driver.",
    "aps-korman-heat-disconnect-7m-settlement": "APS $7M settlement after 82-year-old Sun City West woman died in heat six days after disconnect. 95-degree heat hold reinstated as binding obligation.",
    "arizona-nursing-homes-billing-fraud-and-abuse": "52 of 142 CMS-rated AZ nursing homes are 1- or 2-star. APS substantiates under 1% of investigated abuse reports vs 29-33% nationally. Allegiant Healthcare Mesa: 33 violations.",
    "grand-court-mesa-elder-abuse-hb2228": "60% of nursing home sexual-abuse victims have dementia, 80% of perpetrators are caregivers, only 30% reach law enforcement. Grand Court Mesa arrest drove HB2228.",
    "arizona-school-restraint-data": "4,200+ student-restraint incidents in Arizona schools. Kids with IEPs are over-represented. School-level data aggregated for the first time.",
    "bnsf-phoenix-subdivision-corpus": "Federal-record corpus on BNSF Phoenix Subdivision: 5 Form 6180.57 accident filings, 3 grade crossings, identical phrase AUTO PRECEDED THE GATES, between Nov 2017 and Jan 2026. 4.2-mile west Phoenix arterial corridor, no channelizing medians per FRA inventory. Editorial commentary on public records, NOT case-gated.",
}


def load_existing_emails(slug):
    path = TARGETS_DIR / f"{slug}.json"
    if not path.exists():
        return set(), []
    data = json.loads(path.read_text())
    return {c["email"].lower() for c in data if c.get("email")}, data


def get_unsent_contacts_for_segments(conn, segments):
    """Pull contacts from DB: correct segments, MV ok/catch_all, not DNC (non-catch_all), not yet sent."""
    placeholders = ",".join("?" * len(segments))
    rows = conn.execute(f"""
        SELECT c.name, c.email, c.outlet, c.role, c.beat, c.city, c.state, c.segment,
               c.email_verified
        FROM contacts c
        WHERE c.segment IN ({placeholders})
          AND c.email_verified IN ('ok', 'catch_all')
          AND c.email NOT IN (
              SELECT email FROM do_not_contact WHERE reason != 'MV: catch_all'
          )
          AND c.email NOT IN (SELECT to_email FROM send_log)
        ORDER BY c.email_verified, c.segment, c.email
    """, segments).fetchall()
    return [dict(r) for r in rows]


def build_targets_for_story(conn, slug):
    segments = STORY_SEGMENTS[slug]
    hooks = HOOKS[slug]
    relevance_note = RELEVANCE_NOTES[slug]

    existing_emails, existing_targets = load_existing_emails(slug)
    contacts = get_unsent_contacts_for_segments(conn, segments)

    new_targets = []
    skipped_no_hook = 0
    skipped_already_in_file = 0

    for c in contacts:
        email = (c.get("email") or "").lower().strip()
        if not email or "@" not in email:
            continue
        if email in existing_emails:
            skipped_already_in_file += 1
            continue
        segment = c.get("segment", "")
        hook = hooks.get(segment, "")
        if len(hook) < 30:
            skipped_no_hook += 1
            continue

        new_targets.append({
            "name": c.get("name", "").strip(),
            "email": email,
            "outlet": c.get("outlet", "").strip(),
            "role": (c.get("role") or "").strip(),
            "beat": (c.get("beat") or "").strip(),
            "city": (c.get("city") or "").strip(),
            "state": c.get("state") or "Arizona",
            "segment": segment,
            "category": segment,
            "story_target": slug,
            "story_relevance_note": relevance_note,
            "personalization_hook": hook,
        })
        existing_emails.add(email)

    merged = existing_targets + new_targets
    path = TARGETS_DIR / f"{slug}.json"
    path.write_text(json.dumps(merged, indent=2, ensure_ascii=False))

    print(f"  {slug}")
    print(f"    existing={len(existing_targets)}, new={len(new_targets)}, total={len(merged)}")
    print(f"    skipped_already_in_file={skipped_already_in_file}, skipped_no_hook={skipped_no_hook}")
    return len(new_targets)


def main():
    conn = sqlite3.connect(str(DB))
    conn.row_factory = sqlite3.Row
    total_new = 0
    for slug in STORIES:
        n = build_targets_for_story(conn, slug)
        total_new += n
    print(f"\nTotal new targets appended across all 8 stories: {total_new}")
    conn.close()


if __name__ == "__main__":
    main()
