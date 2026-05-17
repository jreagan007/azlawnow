---
name: legal-fact-check
description: Pre-publish gate for any AZ Law Now AI-assisted legal content. Four-phase pipeline — claim extraction → primary-source retrieval → fabrication detection → block/pass — verifying every factual claim against azleg.gov, CourtListener, azcourts.gov, ADOT, FRA, AZAHCCCS, and the Arizona AG. Encodes exact ARS statutes, AZ constitutional guarantees, tribal-jurisdiction rules, and ADOT data-lag constraints. Reader protection: a wrong statute of limitations in a published article can cost an injured Arizonan their entire claim.
when-to-use: |
  Pre-publish gate on:
  - Any /mode-discover investigation (Brendan voice, mandatory)
  - Any /mode-legal article (Brandon voice, mandatory)
  - Any /mode-client guide that includes a deadline, statute, or dollar figure (Stephanie voice, mandatory)
  - Any practice-area page being created or materially updated
  - Any glossary entry referencing an ARS section
  - Any social card or OG image that includes a legal claim, verdict figure, or deadline
  Block-level dependency. If this skill fails, the piece does not publish.
tier: S
---

# legal-fact-check

## When to invoke

Pre-publish gate on:

- Any `/mode-discover` investigation (Brendan Franks voice) — mandatory
- Any `/mode-legal` article (Brandon Millam J.D. voice) — mandatory
- Any `/mode-client` guide containing a deadline, statute reference, or dollar figure (Stephanie Ramirez voice) — mandatory
- Any practice-area page being created or materially updated
- Any glossary entry that includes an `arsReference` field
- Any social card or OG image containing a legal claim, verdict figure, or filing deadline

Mandatory. Block-level dependency. If this skill fails, the piece does not publish.

A wrong statute of limitations is not a quality problem on AZ Law Now. It is a reader harm pathway. An injured Arizonan who reads that they have two years to file against a municipality — when the actual notice deadline is 180 days — may lose their entire claim before they contact an attorney. A fabricated verdict figure in a practice-area page violates ER 7.1 and subjects the firm to bar discipline. The four-phase verification pipeline below makes these failures mechanical to catch before they reach production.

## Inputs

- File path to MDX or markdown content (required)
- Strictness level: `strict` (default for all legal content — blocks on MEDIUM confidence), `standard` (advisory review only — blocks on LOW confidence only)
- Optional: `--collection` flag to constrain claim types checked (`investigations`, `legal-guides`, `client-guides`, `practice-areas`, `glossary`)

```bash
npx tsx scripts/legal-fact-check/check-claims.ts --file src/content/legal-guides/arizona-statute-of-limitations.mdx --strict
npx tsx scripts/legal-fact-check/check-claims.ts --file src/content/investigations/sr-347-corridor.mdx --strict
npx tsx scripts/legal-fact-check/check-claims.ts --batch src/content/ --strict
```

## Phase 1: Claim extraction

Claude Sonnet 4.6 parses the MDX (frontmatter + body, including `faqs[]`, `keyTakeaway`, and `dataSources` arrays) and extracts every factual claim into a structured list. A "factual claim" is any assertion that includes a number, a named statute, a filing deadline, a jurisdiction, a verdict or settlement amount, a named court, a percentage, a named entity, or a data attribution.

Claim types extracted:

| Type | Examples |
|---|---|
| `sol_deadline` | "you have two years to file", "ARS 12-542", "statute of limitations is X" |
| `notice_of_claim` | "180-day notice", "ARS 12-821.01", "file with the city clerk within X days" |
| `wrongful_death_sol` | "ARS 12-611", "ARS 12-612", "eligible survivors", "wrongful death SOL" |
| `ars_citation` | Any ARS section number paired with a legal principle or deadline |
| `verdict_amount` | "$X million verdict", "$X,000 award", "jury awarded X" |
| `settlement_amount` | "$X settlement", "resolved for X", "case settled" |
| `comparative_fault` | "pure comparative", "99% at fault", "ARS 12-2505", "fault percentage" |
| `several_liability` | "ARS 12-2506", "each defendant pays their share", "no joint liability" |
| `tribal_jurisdiction` | Navajo Nation, Tohono O'odham, Fort McDowell, SRPMIC, Ak-Chin, reservation |
| `adot_stat` | Crash counts, fatality rates, corridor statistics, data year citations |
| `insurance_stat` | "AZ minimum limits 25/50/15", "uninsured rate", "underinsured" |
| `az_const_claim` | AZ Const Art 2 §31, damages caps, constitutional rights assertions |
| `public_records` | ARS 39-121, public records requests, ADOT data sourcing |
| `evidence_rule` | AZ Rule of Evidence 803(6), business records, inspection records |
| `court_case` | Named case, docket number, court name, appellate status, cite |
| `bar_rule` | ER 7.1–7.5, "specialist", superlatives, "no fee unless you win" |

Phase 1 output: raw claim list in `scripts/legal-fact-check/output/verified_claims.json` with `status: pending` for each.

The ARS citation bank at `references/ars-citation-bank.md` is the ground-truth anchor for all `ars_citation`, `sol_deadline`, and `notice_of_claim` claim types. Any claim matching a section number in that bank gets auto-verified against the canonical principle before touching any external source.

## Phase 2: Primary-source retrieval (per claim)

For each extracted claim, query the relevant primary source using the routing table in `references/primary-source-map.md`. No vector embeddings — AZ legal claims route deterministically by claim type to the authoritative URL.

Claim type to source routing:

| Claim type | Primary source | Verification method |
|---|---|---|
| `sol_deadline` | azleg.gov ARS 12-542 | Fetch statute text; confirm "two years" + cause of action scope |
| `notice_of_claim` | azleg.gov ARS 12-821.01 | Fetch statute text; confirm 180-day window, "claim accrues" language |
| `wrongful_death_sol` | azleg.gov ARS 12-611, 12-612 | Confirm SOL period + eligible survivor enumeration |
| `ars_citation` | azleg.gov for the cited section | Confirm section exists; confirm legal principle stated matches text |
| `verdict_amount` | CourtListener + azcourts.gov | Docket lookup by party name + year + court; confirm amount + verdict-not-settlement |
| `settlement_amount` | CourtListener; if confidential, flag | Confirm case exists; flag if settlement amount is unverifiable |
| `comparative_fault` | azleg.gov ARS 12-2505 | Confirm "pure comparative fault", no bar at any percentage |
| `several_liability` | azleg.gov ARS 12-2506 | Confirm several-only, no joint-and-several for non-intentional torts |
| `tribal_jurisdiction` | Tribal codes (Navajo Nation Code, Tohono O'odham Code) + azag.gov | Confirm which sovereign law applies; flag if AZ SOL applied uncritically |
| `adot_stat` | adot.gov crash data + fra.dot.gov grade crossing data | Confirm data year; flag ADOT 18–24 month lag; confirm corridor name |
| `insurance_stat` | azleg.gov ARS 28-4009 (min limits); IRC reports for uninsured rate | Confirm 25/50/15 min limits; confirm uninsured rate data year and source |
| `az_const_claim` | azleg.gov AZ Constitution Art 2 §31 | Confirm no damages cap; flag any claim that suggests a cap exists |
| `public_records` | azleg.gov ARS 39-121 | Confirm 10-business-day response window; journalism fee waiver text |
| `evidence_rule` | azcourts.gov AZ Rules of Evidence 803(6) | Confirm business records exception language |
| `court_case` | CourtListener + azcourts.gov case lookup | Confirm case exists, parties, outcome, appellate status |
| `bar_rule` | azbar.org ER text (7.1–7.5) | Confirm rule text; cross-check claim against rule language |

Confidence scoring per claim:

- **HIGH**: primary source URL confirmed, statute text or case record matches the claim as stated, no ambiguity
- **MEDIUM**: primary source found but wording differs, or data year lag applies, or case found but amount unverifiable as verdict vs settlement
- **LOW**: no primary source URL found for the specific number or principle stated, or statute section does not exist, or case cannot be located

## Phase 3: 10-class fabrication detection

All 10 fabrication classes run as negative constraints on every claim. The first four (wrong-SOL, notice-of-claim-error, wrongful-death-cap-claim, tribal-jurisdiction-ignored) are CRITICAL — they directly cause reader harm by creating false legal expectations. They run first.

| Class | Detection method | Severity |
|---|---|---|
| 1. `wrong-sol` | Claim states an SOL that does not match ARS 12-542 (2yr PI) or ARS 12-821.01 (180-day notice for public entities). E.g., "3 years to file" or "one year" or conflating 180-day notice with 2-year suit deadline. | CRITICAL |
| 2. `notice-of-claim-error` | Claim omits the 180-day notice requirement when discussing public-entity defendants (ADOT, city, school district, county), or treats the notice period as the full filing window. ARS 12-821.01 notice is a bar, not a defect — the article must say so explicitly. | CRITICAL |
| 3. `wrongful-death-cap-claim` | Any assertion that Arizona caps wrongful death damages. AZ Const Art 2 §31 prohibits damages caps. The inverse error (claiming no cap when there is one) is also flagged, but in AZ the no-cap direction is correct — flag any claim suggesting otherwise. | CRITICAL |
| 4. `tribal-jurisdiction-ignored` | Any crash, injury, or death claim with facts pointing to a reservation or tribal land (Navajo Nation, Tohono O'odham, Fort McDowell, SRPMIC, Ak-Chin) that does not address whether AZ state SOL and notice rules apply. Tribal courts and sovereign law may govern; silence = implied applicability of AZ rules = reader harm. | CRITICAL |
| 5. `verdict-as-settlement` | Claim describes a settlement as a "verdict" or "award" or vice versa. CourtListener case-type field cross-check. Verdict = jury or bench decision on the merits. Settlement = agreed resolution before or during trial. They are not interchangeable. ER 7.1 requires result-framing verifiability. | HIGH |
| 6. `adot-data-year-mismatch` | ADOT crash data cited without a data year, or the stated year does not match the ADOT report year for that corridor or metric. ADOT data runs 18–24 months behind publication date. A 2026 article citing "last year" ADOT data is almost certainly citing 2023 or 2024 data, not 2025. | MEDIUM |
| 7. `ars-citation-number-error` | ARS section number cited for a principle that does not match the actual section in the citation bank. E.g., citing ARS 12-542 for wrongful death SOL (correct section is 12-611/612) or citing ARS 12-2506 for comparative fault (correct section is 12-2505). | HIGH |
| 8. `comparative-fault-misquote` | Claim misstates AZ comparative fault. ARS 12-2505 is PURE comparative fault — a plaintiff 99% at fault may still recover 1% of damages. Any language suggesting a percentage bar (e.g., "if you're more than 50% at fault you can't recover") is a fabrication class hit. | HIGH |
| 9. `unverified-verdict-amount` | Verdict amount or settlement figure stated without a verifiable primary source (CourtListener docket, press release with case number, or court filing). Ranges without a source URL are automatic flags. ER 7.1 compliance requires verifiable result context. | HIGH |
| 10. `er7-1-violation` | Unverified superlatives ("best," "top," "most experienced"), guarantees of outcome ("you will receive," "we will win"), or results-without-context framing that violates ER 7.1. Also flags "specialist" without AZ Bar certification (ER 7.4) and in-person solicitation language (ER 7.3). See `az-bar-ethics-guard` for the full ER 7.1–7.5 scan. | HIGH |

When a fabrication class fires on a claim, that claim receives `fabrication_class_hit: true` and a `fabrication_class` label. It is an automatic BLOCK in both strict and standard modes.

## Phase 4: Block or pass

Gate behavior by mode:

**strict mode** (required for all legal content):
- Any `LOW` confidence claim: BLOCK with `MISSING_PRIMARY_SOURCE`
- Any `MEDIUM` confidence claim: BLOCK with `WEAK_MATCH` unless the claim exactly matches the ARS citation bank or ADOT data year is disclosed inline
- Any `fabrication_class_hit`: BLOCK with `FABRICATION_CLASS_HIT` — regardless of confidence
- Any `adot-data-year-mismatch` where the data year is not disclosed in the article text: BLOCK

**standard mode** (advisory review only — not for production legal content):
- Any `LOW` confidence claim: BLOCK with `MISSING_PRIMARY_SOURCE`
- Any `MEDIUM` confidence claim: WARNING logged, article may proceed with editorial review
- Any `fabrication_class_hit`: BLOCK with `FABRICATION_CLASS_HIT`

Exit codes:
- `0`: all claims pass at threshold
- `1`: one or more claims blocked

The article does not proceed until exit code is `0`. Not a warning to acknowledge. A build failure.

## Tech stack

- **Claim extraction**: Claude Sonnet 4.6 via Anthropic SDK with structured JSON output
- **ARS verification**: azleg.gov statute fetch (HTML scrape of chapter/section text)
- **Case lookup**: CourtListener REST API (free, rate-limited; see `~/.env` for key)
- **Court records**: azcourts.gov case lookup + CourtListener AZ state court index
- **ADOT data**: adot.gov crash data portal (CSV exports by corridor + year)
- **FRA grade crossing**: fra.dot.gov Crossing Inventory API
- **AHCCCS**: azahcccs.gov provider/facility lookup
- **AG opinions**: azag.gov opinion search
- **AZ Bar**: azbar.org ethics rules text (static scrape; update quarterly)
- **httpx + asyncio**: parallel source fetching with per-domain rate limits

All keys in `~/Projects/taqtics-ops/config/.env`. See `scripts/legal-fact-check/README.md` for setup.

## Fact-bundle JSON schema

The two-phase researcher → writer pattern produces a `fact-bundle.json` per article slug. This skill extends that schema with AZ-PI-specific fields:

```json
{
  "slug": "arizona-statute-of-limitations-car-accident",
  "collection": "legal-guides",
  "voice": "brandon-millam",
  "claims": [
    {
      "claim": "Arizona gives injured people two years from the date of a crash to file a personal injury lawsuit",
      "claim_type": "sol_deadline",
      "source_url": "https://www.azleg.gov/ars/12/00542.htm",
      "primary_source": "azleg.gov",
      "confidence": "high",
      "fabrication_class_risk": null,
      "data_year": null,
      "tribal_jurisdiction_flag": false,
      "verified": true
    },
    {
      "claim": "When the at-fault driver works for a city or county, an injured person must file a notice of claim within 180 days",
      "claim_type": "notice_of_claim",
      "source_url": "https://www.azleg.gov/ars/12/00821-01.htm",
      "primary_source": "azleg.gov",
      "confidence": "high",
      "fabrication_class_risk": "notice-of-claim-error",
      "data_year": null,
      "tribal_jurisdiction_flag": false,
      "verified": true
    }
  ],
  "disallowed_claims": [
    "We settled this type of case for $X — unverifiable without client consent and case number"
  ],
  "fabrication_flags": [],
  "adot_data_year_disclosed": true,
  "tribal_jurisdiction_addressed": false
}
```

The writer reads only the fact-bundle. No training-data legal facts may appear in published content.

## Outputs

Every run produces three artifacts in `scripts/legal-fact-check/output/`:

**`verified_claims.json`** — machine-readable result per claim:

```json
{
  "article": "src/content/legal-guides/arizona-statute-of-limitations-car-accident.mdx",
  "collection": "legal-guides",
  "mode": "strict",
  "pass": false,
  "exit_code": 1,
  "claims": [
    {
      "claim": "Arizona gives injured people two years to file a personal injury lawsuit",
      "claim_type": "sol_deadline",
      "confidence": "HIGH",
      "source_url": "https://www.azleg.gov/ars/12/00542.htm",
      "fabrication_class_hit": false,
      "fabrication_class": null,
      "gate_result": "PASS",
      "action_required": "none"
    },
    {
      "claim": "Victims have up to three years to pursue wrongful death claims",
      "claim_type": "wrongful_death_sol",
      "confidence": "LOW",
      "source_url": null,
      "fabrication_class_hit": true,
      "fabrication_class": "wrong-sol",
      "gate_result": "FABRICATION_CLASS_HIT",
      "action_required": "delete — ARS 12-611 is 2yr not 3yr; replace with correct statute cite"
    }
  ],
  "blocked_count": 1,
  "warning_count": 0,
  "tribal_jurisdiction_coverage": "not_applicable",
  "adot_data_year_inline": null
}
```

**`verified_claims_diff.md`** — human-readable diff for editorial review:

```
PASS   "Arizona gives injured people two years to file a personal injury lawsuit"
       Matched: ARS 12-542 (azleg.gov, direct statute text)
       Source:  https://www.azleg.gov/ars/12/00542.htm

BLOCK  "Victims have up to three years to pursue wrongful death claims"
       FABRICATION_CLASS_HIT — class: wrong-sol
       ARS 12-611/12-612 establish a 2-year wrongful death SOL, not 3 years.
       Action: delete claim; replace with "ARS 12-611 gives surviving family
               members two years from the date of death to file a wrongful
               death lawsuit in Arizona."
       Source to cite: https://www.azleg.gov/ars/12/00611.htm

WARN   "ADOT data shows 847 crashes on I-10 last year"
       MEDIUM confidence — ADOT data year not disclosed in article text.
       ADOT data runs 18-24 months behind publication. "Last year" is ambiguous.
       Action: replace with "ADOT's [YEAR] crash data shows 847 crashes on I-10"
               and add the report URL to dataSources frontmatter.
```

**Exit code 0 or 1** — wired into the build pipeline.

## Wiring into the build pipeline

Add to `package.json` scripts (alongside existing `check:quality:strict`):

```json
{
  "scripts": {
    "check:claims": "npx tsx scripts/legal-fact-check/check-claims.ts --batch src/content/",
    "check:claims:strict": "npx tsx scripts/legal-fact-check/check-claims.ts --batch src/content/ --strict",
    "preflight:legal": "npx tsx scripts/legal-fact-check/check-claims.ts --strict --file"
  }
}
```

`check:claims` is advisory (exit 0 on MEDIUM, block on LOW and fabrication hits).
`check:claims:strict` is the production gate — required before any legal-guide or practice-area publish.

The `/mode-audit` pipeline calls `check:claims:strict` before any article enters the publish queue. It runs after `check:quality:strict` (fast content gate) and before `build`.

## Escalation path

When an article blocks:

1. Editorial review of `verified_claims_diff.md`
2. If the claim is valid but the primary source URL is missing: add the verified URL to the fact-bundle JSON manually and re-run
3. If the claim is a `wrong-sol` or `notice-of-claim-error` hit: delete the claim from the article immediately; do not attempt to "fix" by rewording — look up the correct ARS section in `references/ars-citation-bank.md` and write from the statute
4. If a `verdict-as-settlement` hit fires: correct the label and add the CourtListener docket URL to `dataSources`
5. If a `tribal-jurisdiction-ignored` hit fires: either (a) add a dedicated paragraph addressing which sovereign law governs or (b) remove the tribal-land reference if the facts are unclear
6. Fabrication class hits on CRITICAL classes (wrong-sol, notice-of-claim-error, wrongful-death-cap-claim, tribal-jurisdiction-ignored) must be resolved by Brandon Millam J.D. review before re-run — not self-cleared by the writer
7. **Bump `updatedAt` (mandatory).** Any file whose body or frontmatter was changed to resolve a finding MUST have `updatedAt` set to the correction date in the same commit. `dateModified` derives from it. A correction committed with a stale `updatedAt` is an incomplete fix and must not ship. This is non-negotiable — see CLAUDE.md Project Constraints.

See `scripts/legal-fact-check/README.md` for operational runbooks.

## Special rules by collection

**legal-guides**: every ARS citation required; `reviewedBy: brandon-millam` must be set; SOL + notice-of-claim disclosure mandatory on any timeline content. Strict mode always.

**practice-areas**: every verdict or settlement figure requires a CourtListener or press-release source URL in `dataSources`. No unverified ranges. `check:claims:strict` required.

**client-guides**: any mention of deadlines triggers `sol_deadline` and `notice_of_claim` claim extraction regardless of specificity. Stephanie's voice does not give legal advice — but deadline figures still need verified sources. Strict mode always.

**investigations**: ADOT data year must be disclosed inline (e.g., "ADOT's 2023 crash report"). Data-year mismatch blocks. Tribal jurisdiction addressed if any crash location touches a reservation. Strict mode always.

**glossary**: `arsReference` field cross-checked against citation bank. Any definition that implies a deadline or cap is checked. Standard mode (advisory).
