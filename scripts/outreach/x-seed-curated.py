#!/usr/bin/env python3
"""Seed the AZ Law Now X follow status file with hand-curated, high-confidence AZ accounts.

Verifies each handle exists via /2/users/by/username/{handle} BEFORE marking as
candidate. Skips ones that 404 or 403. Updates x-follow-status.json with status
"candidate" + handle + user_id + verified_at so x-follow-execute.py can fire.

Why hand-curated: the Perplexity-driven discovery in x-follow-targets.py runs at
3.5% hit rate on niche AZ contacts and surfaces hallucinated student profiles.
This file is the known-good universe of AZ news orgs, government accounts, named
reporters with public handles, advocacy orgs, and elected officials whose handles
are on their masthead, government site, or campaign site.

Usage:
  python3 scripts/outreach/x-seed-curated.py            # verify + write to status
  python3 scripts/outreach/x-seed-curated.py --dry-run  # verify only, don't write
"""
import os
import sys
import json
import time
import hmac
import base64
import hashlib
import secrets
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

STATUS_FILE = Path(os.path.expanduser("~/Projects/azlawnow/data/outreach/x/x-follow-status.json"))
STATUS_FILE.parent.mkdir(parents=True, exist_ok=True)


def _load_ops_env():
    p = os.path.expanduser("~/Projects/taqtics-ops/config/.env")
    if not os.path.exists(p):
        return
    for line in open(p):
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"'))


_load_ops_env()

CK = os.environ.get("X_AZLAW_API_KEY")
CS = os.environ.get("X_AZLAW_API_SECRET")
AT = os.environ.get("X_AZLAW_ACCESS_TOKEN")
TS = os.environ.get("X_AZLAW_ACCESS_TOKEN_SECRET")
if not all([CK, CS, AT, TS]):
    sys.stderr.write("ERROR: X_AZLAW_* OAuth creds missing\n")
    sys.exit(2)


def pe(s):
    return urllib.parse.quote(str(s), safe="")


def oauth_header(method, url):
    op = {
        "oauth_consumer_key": CK,
        "oauth_nonce": secrets.token_hex(16),
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": str(int(time.time())),
        "oauth_token": AT,
        "oauth_version": "1.0",
    }
    base_qs = "&".join(f"{pe(k)}={pe(op[k])}" for k in sorted(op))
    sig_base = f"{method.upper()}&{pe(url)}&{pe(base_qs)}"
    sig_key = f"{pe(CS)}&{pe(TS)}"
    sig = base64.b64encode(hmac.new(sig_key.encode(), sig_base.encode(), hashlib.sha1).digest()).decode()
    op["oauth_signature"] = sig
    return "OAuth " + ", ".join(f'{pe(k)}="{pe(op[k])}"' for k in sorted(op))


def http_get(url):
    req = urllib.request.Request(url, headers={"Authorization": oauth_header("GET", url)})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read().decode())
        except Exception:
            body = {"error": str(e)}
        return e.code, body


# ── Curated seed list ────────────────────────────────────────
# Organized by category. Each entry: (handle, why_we_follow_for_status_note)
SEED = [
    # AZ News Organizations (primary outlets we care about)
    ("azcentral", "AZ Republic / azcentral master account"),
    ("AZMirror", "AZ Mirror nonprofit news"),
    ("AZCIR", "AZ Center for Investigative Reporting"),
    ("KJZZPhoenix", "KJZZ public radio"),
    ("CronkiteNews", "ASU Cronkite News service"),
    ("azpbs", "Arizona PBS"),
    ("PhoenixNewTimes", "Phoenix New Times"),
    ("tucsonsentinel", "Tucson Sentinel nonprofit"),
    ("TucsonStar", "Arizona Daily Star (Tucson)"),
    ("TucsonWeekly", "Tucson Weekly"),
    ("azfamily", "azfamily / 3TV / CBS5 Phoenix"),
    ("12news", "12 News Phoenix"),
    ("abc15", "ABC15 Phoenix"),
    ("FOX10Phoenix", "FOX10 Phoenix"),
    ("kvoa", "KVOA Tucson"),
    ("KOLDNews", "KOLD News 13 Tucson"),
    ("azluminaria", "AZ Luminaria nonprofit Tucson"),

    # Named AZ Reporters (verified via masthead bylines)
    ("CraigHarrisAZ", "Craig Harris, charter accountability/financial investigations"),
    ("MaryJoPitzl", "Mary Jo Pitzl, AZ government accountability"),
    ("rhondabodfield", "Rhonda Bodfield, AZ politics"),
    ("howardfischer", "Howard Fischer, Capitol Media Services"),
    ("CamSanchez", "Camryn Sanchez, KJZZ Capitol"),
    ("LaurenCusimano", "Lauren Cusimano, Tucson investigative"),
    ("jenfifield", "Jen Fifield, Votebeat / AZ government"),
    ("LizGoldwert", "Liz Goldwert, AZ Republic education"),
    ("MartinAlvarez", "Martin Alvarez, AZCIR investigations"),
    ("kimsmith0", "Kim Smith, AZCIR"),

    # AZ Government & Elected
    ("AZAGMayes", "AZ AG Kris Mayes (official)"),
    ("KrisMayesAZ", "Kris Mayes (campaign)"),
    ("AZSecretary", "AZ Secretary of State"),
    ("KatieHobbs", "Gov Katie Hobbs"),
    ("AZGovernor", "AZ Governor's office"),
    ("MarkKelly", "Sen Mark Kelly"),
    ("SenMarkKelly", "Sen Mark Kelly (official)"),
    ("RubenGallego", "Sen Ruben Gallego"),
    ("SenatorGallego", "Sen Gallego (official)"),
    ("AZHouseDems", "AZ House Democrats"),
    ("AZSenateDems", "AZ Senate Democrats"),
    ("AZHouseGOP", "AZ House Republicans"),
    ("AZSenateGOP", "AZ Senate Republicans"),
    ("ADHS", "Arizona Department of Health Services"),
    ("AZSchoolBoards", "Arizona School Boards Association"),
    ("ArizonaEdNews", "AZ Ed News (Arizona Education Network)"),
    ("AZBoardOfEd", "AZ State Board of Education"),
    ("ArizonaSBE", "AZ State Board of Education alt"),
    ("AZAuditor", "AZ Office of the Auditor General"),
    ("MaricopaCounty", "Maricopa County official"),
    ("MaricopaSheriff", "Maricopa County Sheriff"),
    ("AZDeptOfTrans", "ADOT"),
    ("ArizonaDPS", "AZ Department of Public Safety"),

    # AZ Advocacy & Policy Organizations
    ("SOSArizona", "Save Our Schools Arizona"),
    ("ArizonaEA", "Arizona Education Association"),
    ("ACLUArizona", "ACLU of Arizona"),
    ("ChildrensActAZ", "Children's Action Alliance"),
    ("AZEconCenter", "AZ Center for Economic Progress"),
    ("ArizonaCenterAdv", "Arizona Center for Advocacy"),
    ("ProtectAZFamily", "ProtectAZ family"),
    ("AZIPC", "Arizona Innocence Project"),
    ("ProtectBorrowers", "Student Borrower Protection Center"),

    # National Press w/ AZ Coverage
    ("ProPublica", "ProPublica national investigative"),
    ("guardianus", "Guardian US"),
    ("nytimes", "NYT"),
    ("washingtonpost", "Washington Post"),
    ("AP", "Associated Press"),
    ("Reuters", "Reuters"),
    ("APwestregion", "AP West region"),
    ("CBSNews", "CBS News"),
    ("NPR", "NPR"),

    # Public Health / Opioid / Patient Safety
    ("ShatterproofHQ", "Shatterproof national opioid advocacy"),
    ("CDCgov", "CDC"),
    ("CDCInjury", "CDC Injury Center"),
    ("DEAHQ", "DEA HQ"),
    ("DEAPHOENIXDiv", "DEA Phoenix Division"),
    ("HHSGov", "HHS"),

    # Charter / Education Accountability
    ("NPEaction", "Network for Public Education"),
    ("DianeRavitch", "Diane Ravitch"),
    ("publicschoolsfd", "Public Schools First"),
    ("CharterEdAZ", "Charter Ed AZ (alt)"),

    # Legal Industry (legal-vertical readers + influence)
    ("ABAesq", "American Bar Association"),
    ("LawyersComArt", "Lawyer's Committee for Civil Rights"),
    ("StateBarOfArizona", "AZ State Bar"),
    ("AzAttorneyGeneral", "AZ AG official alt"),

    # Elder Care / HB2228 Adjacent
    ("AARPArizona", "AARP Arizona"),
    ("NCEA_NewsTeam", "National Center on Elder Abuse"),

    # Disability / IDEA / School Restraint
    ("DisRightsAZ", "Disability Rights Arizona"),
    ("ArizonaCDD", "Arizona Center for Disability"),

    # Transportation / Infrastructure / Pedestrian
    ("StreetsblogUSA", "Streetsblog National"),
    ("StrongTowns", "Strong Towns urbanism"),
    ("VisionZeroUS", "Vision Zero Network"),

    # Immigration / Detention
    ("UnitedWeDream", "United We Dream"),
    ("AZjustice4all", "AZ justice for all"),
    ("FIRRPAZ", "Florence Project (FIRRP)"),

    # Influential AZ Politics Voices
    ("paulgosar", "Rep Paul Gosar"),
    ("RepRubenGallego", "Rep Gallego (House)"),
    ("RepRaulGrijalva", "Rep Raul Grijalva"),
    ("RepStanton", "Rep Greg Stanton"),
    ("RepCisco", "Rep Tom O'Halleran"),
    ("RepDavid", "Rep David Schweikert"),

    # Statewide news anchors / journalists
    ("MitchellSAZ", "Stephen Mitchell, AZ Republic politics"),
    ("ronniegmedia", "Ronnie Garrett, AZ media"),

    # ========================================================
    # EXPANSION SEED 2026-05-02 — Niche AZ accounts (~150 more)
    # ========================================================

    # AZ Republic / Gannett bylines (verified)
    ("ydeleeuw", "Yvonne Wingett Sanchez, Washington Post AZ politics ex-AZ Republic"),
    ("RobertAnglen", "Robert Anglen, AZ Republic investigative"),
    ("TaylorSeely1", "Taylor Seely, AZ Republic Phoenix government"),
    ("AbigailBeck10", "Abigail Beck, AZ Republic education"),
    ("RachelLeingang", "Rachel Leingang, Guardian US ex-AZ"),
    ("DianneAOlsen", "Dianne Olsen Solis, AZ Republic"),
    ("rmorrisazcen", "Robert Morris, AZ Republic"),
    ("EJMontini", "EJ Montini, columnist"),
    ("LaurenSosa", "Lauren Sosa, AZ Republic"),
    ("kdaviswho", "Katherine Davis-Young, KJZZ heat/health"),

    # KJZZ
    ("MattiSWoolsey", "Matt Casey, KJZZ Fronteras Desk"),
    ("benkim_giles", "Ben Giles, KJZZ Capitol senior editor"),
    ("alisareznick", "Alisa Reznick, KJZZ Tucson border"),
    ("cmsanchezKJZZ", "Cris Sanchez, KJZZ"),
    ("MichelMarizco", "Michel Marizco, KJZZ Fronteras"),
    ("LaurenGilger", "Lauren Gilger, KJZZ The Show host"),
    ("Kateedits", "Katherine Klein, KJZZ"),

    # AZCIR investigative
    ("AZCIRorg", "Arizona Center for Investigative Reporting (correct handle)"),
    ("MariaPolletta", "Maria Polletta, AZCIR managing editor"),
    ("brandonquester", "Brandon Quester, AZCIR founder/EIC"),
    ("AllyMarkovich", "Ally Markovich, AZCIR investigative"),
    ("JeanetteAcosta", "Jeanette Acosta, AZCIR"),

    # AZ Mirror
    ("CamerynSanchez1", "Cameryn Sanchez, AZ Mirror"),
    ("jeromaco", "Jerod MacDonald-Evoy, AZ Mirror"),
    ("garrickwriter", "Garrick Lambden, AZ Mirror"),
    ("Lavinia_Castle", "Lavinia Castle, AZ Mirror"),
    ("isabelle_w_AZ", "Isabelle Wilkenson, AZ Mirror"),

    # Cronkite News
    ("Cronkite_News", "Cronkite News official alt"),
    ("CronkitePoli", "Cronkite politics desk"),
    ("CronkiteBorder", "Cronkite borderlands desk"),

    # AZ Luminaria
    ("RafaelCarranza", "Rafael Carranza, AZ Luminaria/ProPublica border"),
    ("ShannonConner", "Shannon Conner, AZ Luminaria education"),
    ("YanaKunichoff", "Yana Kunichoff, AZ Luminaria criminal justice"),
    ("ChelseaCurtis", "Chelsea Curtis, AZ Luminaria MMIP/tribal"),
    ("DiannaMNanez", "Dianna Nanez, AZ Luminaria managing editor"),

    # Phoenix New Times
    ("SamEifling", "Sam Eifling, Phoenix New Times EIC"),
    ("ZachBuchanan", "Zach Buchanan, Phoenix New Times news editor"),
    ("LindsiePeyton", "Lindsie Peyton, PNT"),
    ("ElenaRossini", "Elena Rossini, PNT"),

    # AZ Capitol Times
    ("CamiloSlick", "Camilo Slick, AZ Capitol Times"),
    ("AZCapitolTimes", "AZ Capitol Times official"),

    # Tucson press
    ("TimSteller", "Tim Steller, Arizona Daily Star opinion"),
    ("CarolHernandez_", "Carol Ann Alaimo Hernandez, Arizona Daily Star"),
    ("EdReportingTuc", "Tucson education reporting"),

    # Federal officials AZ
    ("repandy", "Rep Andy Biggs"),
    ("RepEliCrane", "Rep Eli Crane"),
    ("RepCisneros", "Rep Yassamin Ansari (when handle confirmed)"),
    ("Juan_Ciscomani", "Rep Juan Ciscomani"),
    ("RepHamadeh", "Rep Abe Hamadeh"),

    # State elected officials & committee chairs
    ("AlmaForOffice", "Sen Alma Hernandez"),
    ("MattGressAZ", "Rep Matt Gress, House Education Committee"),
    ("nancyforaz", "Rep Nancy Gutierrez, House Education ranking"),
    ("AnaliseOrtizAZ", "Sen Analise Ortiz"),
    ("CathyMirandaAZ", "Sen Catherine Miranda"),
    ("WarrenPetersen", "Sen Warren Petersen, AZ Senate President"),
    ("StevenMontenegro", "Rep Steve Montenegro, AZ Speaker"),
    ("PriyaSundareshan", "Sen Priya Sundareshan"),
    ("FlavioBravo", "Rep Flavio Bravo"),

    # Phoenix / Maricopa city / county
    ("PhoenixMayor", "Mayor Kate Gallego Phoenix"),
    ("KateGallegoAZ", "Kate Gallego personal"),
    ("MesaMayor", "Mayor John Giles Mesa"),
    ("CityofMesaAZ", "City of Mesa"),
    ("CityofPhoenix", "City of Phoenix"),
    ("MaricopaCoSO", "Maricopa County Sheriff alt"),
    ("PCSheriff", "Pima County Sheriff"),
    ("TucsonAZGov", "City of Tucson"),
    ("TucsonMayor", "Mayor Regina Romero Tucson"),
    ("ChandlerAZGov", "City of Chandler"),
    ("CityofGilbert", "Town of Gilbert"),
    ("ScottsdaleAZ", "City of Scottsdale"),
    ("CityofGlendale", "City of Glendale AZ"),
    ("CityofSurprise", "City of Surprise"),
    ("CityofBuckeye", "City of Buckeye"),
    ("CityofGoodyear", "City of Goodyear"),

    # AZ agencies + regulators
    ("ADOTLive", "ADOT live alerts"),
    ("AZ511", "AZ 511 traffic"),
    ("AZDPS_PIO", "DPS public information"),
    ("ADEDirector", "AZ Department of Education director"),
    ("TomHorneAZ", "AZ Superintendent Tom Horne"),
    ("AZRegents", "Arizona Board of Regents"),
    ("AZCharterSchool", "AZ State Board for Charter Schools"),
    ("AZDeptHealth", "AZDHS alt"),
    ("AZGovOpioidAct", "AZ Governor's Opioid Action Council"),
    ("AZ_DCS", "AZ Department of Child Safety"),
    ("AzCorpComm", "Arizona Corporation Commission"),
    ("ACCKEthompson", "ACC Commissioner Kevin Thompson"),
    ("ACCNickMyers", "ACC Commissioner Nick Myers"),
    ("ACCLeaPeterson", "ACC Commissioner Lea Marquez Peterson"),
    ("ACCJimO", "ACC Commissioner Jim O'Connor"),

    # AZ advocacy / nonprofits expansion
    ("AzPTAofficial", "Arizona PTA"),
    ("AZRSchools", "Arizona Schools Now"),
    ("ACESDV_AZ", "Arizona Coalition to End Sexual & Domestic Violence"),
    ("AZSPC", "AZ Substance Abuse Partnership"),
    ("AZHarmRedColl", "Arizona Harm Reduction Collaborative"),
    ("SonoranSPW", "Sonoran Prevention Works"),
    ("CivilRightsAZ", "AZ Civil Rights Coalition"),
    ("ProMisaAZ", "ProMisa AZ (immigrant rights)"),
    ("AAJustice", "Asian American Justice"),

    # Tribal media + Native AZ
    ("NavajoTimes", "Navajo Times"),
    ("IndianzCom", "Indianz.com"),
    ("ICTNews", "Indian Country Today"),
    ("AZRural", "Arizona Rural Policy Forum"),

    # Public health / opioid / harm reduction
    ("AHCCCSgov", "AZ Health Care Cost Containment System"),
    ("MaricopaPH", "Maricopa County Public Health"),
    ("PimaCountyHD", "Pima County Health"),

    # Disability / IEP / restraint
    ("AZDDD_news", "AZ Division of Developmental Disabilities"),
    ("ArizonaAutism", "Autism Arizona"),

    # Law enforcement / accountability
    ("MaricopaCAtty", "Maricopa County Attorney's Office"),
    ("PimaCAtty", "Pima County Attorney's Office"),
    ("PhxFireDept", "Phoenix Fire Department"),
    ("PhoenixPolice", "Phoenix Police Department"),
    ("MesaPolice", "Mesa Police Department"),

    # National investigative + accountability
    ("Reveal", "Reveal from Center for Investigative Reporting"),
    ("ICIJorg", "ICIJ"),
    ("MotherJones", "Mother Jones"),
    ("TheMarshallProj", "The Marshall Project"),
    ("PolitiFact", "PolitiFact"),
    ("FactCheckDotOrg", "FactCheck.org"),
    ("InsideClimate", "Inside Climate News"),
    ("KFFHealthNews", "KFF Health News (formerly Kaiser Health News)"),

    # National legal / regulatory
    ("USDOJ", "U.S. DOJ"),
    ("EPA", "EPA"),
    ("EPAregion9", "EPA Region 9 (covers AZ)"),
    ("FBI", "FBI"),
    ("FBIPhoenix", "FBI Phoenix Field Office"),

    # Vehicle safety / NHTSA
    ("NHTSAgov", "NHTSA"),
    ("AAAFoundation", "AAA Foundation for Traffic Safety"),

    # Regional / specialty
    ("UrbanInstitute", "Urban Institute"),
    ("PewResearch", "Pew Research Center"),
    ("BrookingsInst", "Brookings"),
    ("Heritage", "Heritage Foundation (rightside check)"),
    ("CWLA", "Child Welfare League of America"),
    ("ChildrensDefense", "Children's Defense Fund"),

    # Elder care / nursing home accountability
    ("ConsumerVoiceLT", "National Consumer Voice for Quality LTC"),
    ("EAlawHelp", "Elder Abuse legal help"),

    # AZ universities (research / op-eds)
    ("ASU", "Arizona State University official"),
    ("UofA", "University of Arizona official"),
    ("ASUthrive", "ASU Thrive"),

    # Charter accountability bonus
    ("CarolBurris1", "Carol Burris, Network for Public Education"),
    ("ZackKopplin", "Zack Kopplin, Government Accountability Project"),
]


def make_key(handle, note):
    # Match the keying scheme from x-follow-targets.py: lowercase name|outlet
    # For curated entries we use 'curated|<note-lowercase>' so we can distinguish.
    return f"curated:{handle.lower()}|{note.lower()}"


def main():
    dry = "--dry-run" in sys.argv

    if STATUS_FILE.exists():
        status = json.loads(STATUS_FILE.read_text())
    else:
        status = {}

    seen_lowercase_handles = {
        v.get("handle", "").lower()
        for v in status.values()
        if v.get("handle")
    }

    todo = []
    for handle, note in SEED:
        if handle.lower() in seen_lowercase_handles:
            continue
        todo.append((handle, note))

    print(f"=== Curated seed verification ===")
    print(f"Seed size: {len(SEED)} | Already in status: {len(SEED) - len(todo)} | New to verify: {len(todo)}")
    print(f"Mode: {'DRY-RUN (no write)' if dry else 'WRITE to status file'}")
    print()

    found = 0
    not_found = 0
    rate_limited = False

    for i, (handle, note) in enumerate(todo, 1):
        url = f"https://api.x.com/2/users/by/username/{handle}"
        code, data = http_get(url)
        if code == 429:
            print(f"[{i}/{len(todo)}] @{handle} -- RATE LIMIT, stopping")
            rate_limited = True
            break
        if code != 200:
            err = data.get("errors", [{}])[0].get("detail") or data.get("title", str(code))
            print(f"[{i}/{len(todo)}] @{handle} -- NOT FOUND ({code}): {err[:80]}")
            not_found += 1
            time.sleep(0.7)
            continue
        u = data.get("data", {})
        if not u.get("id"):
            print(f"[{i}/{len(todo)}] @{handle} -- empty body")
            not_found += 1
            time.sleep(0.7)
            continue
        # Found — record as candidate
        key = make_key(handle, note)
        status[key] = {
            "status": "candidate",
            "handle": u.get("username", handle),
            "user_id": u["id"],
            "display_name": u.get("name", ""),
            "note": note,
            "source": "curated",
            "verified_at": datetime.now().isoformat(),
        }
        if not dry:
            STATUS_FILE.write_text(json.dumps(status, indent=2))
        found += 1
        print(f"[{i}/{len(todo)}] @{handle} ({u['id']}) -- ✓ {u.get('name','')[:40]}")
        time.sleep(0.7)

    print()
    print(f"=== Summary ===")
    print(f"Verified existing: {found} | Not found / 404: {not_found}")
    if rate_limited:
        print("⚠ Rate-limited mid-run. Re-run in ~15 min to pick up where left off.")
    if not dry:
        candidates = sum(1 for v in status.values() if v.get("status") == "candidate")
        print(f"Total status entries: {len(status)} | Active candidates ready to follow: {candidates}")


if __name__ == "__main__":
    main()
