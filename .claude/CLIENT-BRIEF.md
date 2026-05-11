---
slug: azlawnow
name: AZ Law Now
gscProperty: sc-domain:azlawnow.com
siteUrl: https://azlawnow.com
practiceArea: Arizona statewide personal injury + public-records investigations
audience: injured Arizonans anywhere in AZ where the firm can take or co-counsel the case
editorialVoice: investigative, public-records-driven, "You Get Answers"
opsHubRepo: /Users/jaredreagan/Projects/taqticscom
commitPrefix: OpsHub
mode: growth
---

# AZ Law Now — Client Brief

> **Growth mode.** Ops tooling runs from taqticscom. See
> `taqticscom/docs/AGENT-PROMPTING-GUIDE.md` for how agents should frame work
> on this site.

## Growth mandate

AZ Law Now serves injured Arizonans across the entire state. Phoenix metro,
West Valley (offices in Buckeye, Maricopa), East Valley (Mesa, Chandler,
Gilbert, Scottsdale), Tucson metro, Flagstaff, Prescott, Sedona, Yuma, northern
AZ — anywhere the firm is licensed and can take or co-counsel a case.

**Office in Buckeye/Maricopa does NOT limit reach.** Statewide marketing.
Statewide case acceptance. Statewide signal.

## What this site is

- **Practice areas** — car, truck, motorcycle, pedestrian, dog bite, premises,
  wrongful death, rideshare, workers comp, abuse/negligence (nursing home,
  daycare, school), commercial trucking
- **City/metro pages** — Phoenix, Tucson, Mesa, Chandler, Glendale, Buckeye,
  Scottsdale, and more across AZ
- **Settlement calculators** — strong ranking assets (dog bite, slip-fall,
  premises liability)
- **Investigative insights** — 15+ published investigations in
  `src/content/insights/` (school restraint, nursing home violations, SR-347
  corridor, I-10 corridor, ghost fleets, wrong-way crashes, daycare violations,
  Maricopa hit-and-run)
- **Three-voice editorial system** — Brendan (investigations, 1st person),
  Brandon J.D. (legal, 3rd person), Stephanie (client guides, 2nd person)

## Topics worth covering (expand freely)

- Arizona Supreme Court + Court of Appeals PI decisions
- ADOT crash data (I-10, I-17, I-40, SR-347, SR-303, SR-202, SR-101, SR-51)
- City-level injury data (Phoenix, Tucson, Mesa, Chandler, Flagstaff, etc.)
- Arizona comparative fault (ARS 12-2505)
- Uninsured motorist claims (AZ has high uninsured rates)
- Statute of limitations (ARS 12-542, ARS 12-821.01 public entity)
- AZ Rule of Civil Procedure changes
- Rideshare insurance rules specific to AZ
- Monsoon, dust storm, extreme heat, wildfire incidents
- Nursing home, daycare, school negligence (abuse-negligence cluster)
- Ghost fleets / chameleon carrier commercial trucking abuse
- Wrongful death damages and cap cases
- Dog bite and premises liability (ranking-asset content)
- Public entity claims (ADOT, cities, school districts)
- Border region and northern AZ injury stories
- Native American jurisdictional issues (when relevant)

## Editorial quality floor (applied at draft, not discovery)

- **Three-voice routing** — trend-scanner outputs should flag recommended
  voice per topic:
  - Brendan → public-records / investigative
  - Brandon J.D. → legal doctrine / case analysis
  - Stephanie → client-facing step-by-step guides
- **"You Get Answers" positioning** — closer to ProPublica than billboard-
  attorney voice
- **Arizona specificity** — cite ARS sections, cite court case names, cite AZ
  agencies. Generic PI content doesn't differentiate.

## Running ops from this repo

All scans run from the ops hub:

```bash
cd ~/Projects/taqticscom
npx tsx scripts/trend-scanner.ts --client=azlawnow
npx tsx scripts/gsc-pull.ts --client=azlawnow
npx tsx scripts/run-all-clients.ts --clients=azlawnow
```

Outputs land here at `docs/trend-briefs/` and `docs/gsc-reports/`. Investigative
drafts should land in `src/content/insights/` to match the existing collection.

## Commit hygiene

Ops-hub outputs use `OpsHub:` prefix.

## Setup reference

- `taqticscom/docs/AGENT-PROMPTING-GUIDE.md` — how to prompt agents
- `taqticscom/docs/GCP-SHARED-AUTH.md` — auth setup
- `taqticscom/clients.config.json` under `clients.azlawnow` — live config
