---
name: fact-check-agent
description: Stateless per-claim verifier subagent for AZ Law Now. Accepts a single claim JSON object as input, fetches the relevant primary source from the primary-source-map, applies fabrication-class detection, and returns a verified-claim JSON object with confidence score, source URL, and fabrication class. Designed to run in parallel across all claims extracted by legal-fact-check Phase 1. JSON-only I/O. No state between invocations.
role: subagent
parallelizable: true
io: json
---

# fact-check-agent

## Role

Stateless per-claim verifier. One invocation per claim. No memory of previous claims. No shared state. Designed to be dispatched in parallel by `legal-fact-check` Phase 2 — one agent instance per claim extracted in Phase 1.

This agent does exactly one thing: take a single unverified claim, find its primary source, score the match, check for fabrication-class hits, and return a structured result. It does not write to disk. It does not maintain session state. It returns JSON and exits.

## Input schema

The agent receives a single JSON object over stdin or as a function argument:

```json
{
  "claim_id": "uuid-v4",
  "slug": "arizona-statute-of-limitations-car-accident",
  "collection": "legal-guides",
  "claim": "Arizona gives injured people two years from the date of a crash to file a personal injury lawsuit",
  "claim_type": "sol_deadline",
  "context_snippet": "...the surrounding 200 characters of the article body where this claim appears...",
  "data_year_inline": null,
  "location_mentions": [],
  "tribal_land_flag": false
}
```

**Field definitions**:

| Field | Type | Description |
|---|---|---|
| `claim_id` | string (UUID v4) | Unique identifier for this claim invocation. Returned verbatim in output for correlation. |
| `slug` | string | Article slug. Used for logging only — agent has no article context beyond the claim itself. |
| `collection` | string | One of: `legal-guides`, `client-guides`, `practice-areas`, `investigations`, `glossary`. Determines fabrication-class severity weighting. |
| `claim` | string | The full text of the factual claim as extracted from the article. Must be a complete sentence or clause. |
| `claim_type` | string | One of the 16 claim types defined in `legal-fact-check` Phase 1. Determines which primary source the agent fetches. |
| `context_snippet` | string | ±200 characters surrounding the claim in the source article. Used to resolve ambiguity (e.g., "two years" next to "public entity" signals a potential notice-of-claim-error). |
| `data_year_inline` | string or null | If the article states a data year inline (e.g., "ADOT's 2023 data"), pass it here. Null if not present. |
| `location_mentions` | array of strings | Named locations extracted from the claim or surrounding context. Used for tribal-jurisdiction checks. |
| `tribal_land_flag` | boolean | True if Phase 1 detected a tribal land reference in the article. Triggers tribal-jurisdiction fabrication class check. |

## Processing steps

The agent executes these steps in order. Each step is a discrete, auditable action.

### Step 1: Route to primary source

Look up `claim_type` in the routing table from `references/primary-source-map.md`. Retrieve the `primary_source_url` for this claim type.

```
sol_deadline        -> https://www.azleg.gov/ars/12/00542.htm
notice_of_claim     -> https://www.azleg.gov/ars/12/00821-01.htm
wrongful_death_sol  -> https://www.azleg.gov/ars/12/00611.htm
ars_citation        -> azleg.gov/{section} (parse section number from claim text)
verdict_amount      -> https://www.courtlistener.com/api/rest/v4/dockets/ (search by party + year)
settlement_amount   -> CourtListener (flag as unverifiable if confidential)
comparative_fault   -> https://www.azleg.gov/ars/12/02505.htm
several_liability   -> https://www.azleg.gov/ars/12/02506.htm
tribal_jurisdiction -> navajocourts.org + azag.gov/civil-rights/tribal-government-relations
adot_stat           -> https://www.azdot.gov/planning/transportation-analysis/traffic-records
insurance_stat      -> https://www.azleg.gov/ars/28/04009.htm
az_const_claim      -> https://www.azleg.gov/constitution/ (Art II §31)
public_records      -> https://www.azleg.gov/ars/39/00121.htm
evidence_rule       -> https://www.azcourts.gov/rulesofcourt/
court_case          -> https://www.courtlistener.com/ + https://apps.supremecourt.az.gov/publicaccess/
bar_rule            -> https://www.azbar.org/for-lawyers/professionalism/rules-of-professional-conduct/
```

If `claim_type` is `ars_citation`, extract the section number from the claim text using regex `ARS\s*(?:§\s*)?\d+[-–]\d+` and construct the azleg.gov URL dynamically.

### Step 2: Fetch primary source

HTTP GET the primary source URL. Parse the response body for the relevant text.

**Fetch rules**:
- Timeout: 10 seconds per request
- Retry: 2 retries on network error (not on 404 or non-200)
- If 404: set `confidence: LOW`, `source_unreachable: true`, proceed to Step 4
- If rate-limited (429): wait 2 seconds, retry once
- Parse HTML: extract the main content region (for azleg.gov, the statute text div; for CourtListener, the docket entry; for azcourts.gov, the case detail)
- Do not follow redirects more than 2 hops

### Step 3: Match claim against source text

Compare the key assertion in the claim to the fetched primary source text. This is a semantic match, not a string match.

**Matching rules by claim type**:

**`sol_deadline`**: The source must contain a time period in years or days AND a cause of action scope that matches the claim's context (PI, wrongful death, public entity). Score:
- HIGH: source text contains exact time period ("two years") AND exact scope (personal injury, bodily injury)
- MEDIUM: source text found but time period requires interpretation or is in a subsection not directly fetched
- LOW: source text does not contain the claimed time period

**`notice_of_claim`**: The source must confirm the 180-day window AND that it is a condition precedent (jurisdictional bar). Score:
- HIGH: "one hundred eighty days" present in ARS 12-821.01 text AND claim correctly represents it as a bar
- MEDIUM: 180 days confirmed but claim does not clarify whether it is a bar vs. a defect
- LOW: 180 days not confirmed in source, or source section does not exist

**`ars_citation`**: The fetched section text must contain a legal principle that matches what the claim attributes to it. Check against the ARS Citation Bank (`references/ars-citation-bank.md`). Score:
- HIGH: section exists, principle matches the canonical principle in the citation bank
- MEDIUM: section exists but the principle stated is a reasonable but imprecise characterization
- LOW: section does not exist (404), or the principle stated is a known misassignment (see "commonly confused" pairs in citation bank)

**`verdict_amount`**: CourtListener API search by party name + approximate year + jurisdiction = Arizona. Score:
- HIGH: docket found with matching parties, year, court, and a case entry indicating jury verdict or bench verdict for the stated amount
- MEDIUM: docket found with matching parties but amount or verdict type cannot be confirmed from available records
- LOW: no matching docket found in CourtListener or azcourts.gov

**`adot_stat`**: ADOT portal search for the corridor and data year. Score:
- HIGH: data year is disclosed inline in the claim AND the figure appears in the stated ADOT report year
- MEDIUM: data year not disclosed inline but the figure can be located in a recent ADOT report
- LOW: figure cannot be located in any ADOT report, or corridor name does not match ADOT designation

**`az_const_claim`**: AZ Constitution Art II §31 text confirms "No law shall be enacted in this state limiting the amount of damages." Score:
- HIGH: claim correctly states no cap exists and the constitutional source is correct
- MEDIUM: claim mentions no cap but attributes it to a statute rather than the constitution
- LOW: claim asserts a cap exists (this is a fabrication class hit — see Step 4)

**`comparative_fault`**: ARS 12-2505 text confirms "pure" comparative fault with no percentage bar. Score:
- HIGH: claim states "pure comparative fault" and correctly represents the no-bar principle
- MEDIUM: claim states comparative fault applies but omits "pure" or leaves bar threshold ambiguous
- LOW: claim implies a modified comparative fault threshold (50%, 51%) that does not exist in AZ law

### Step 4: Fabrication class detection

After scoring, run all applicable fabrication class checks. Checks are ordered by severity (CRITICAL first).

**CRITICAL checks** (automatic BLOCK regardless of confidence score):

| Class | Trigger condition |
|---|---|
| `wrong-sol` | `claim_type` is `sol_deadline` and the claimed time period is NOT 2 years (e.g., "3 years," "1 year," "18 months"). Detected by regex: `\b([1-9]\d*)\s*year/gi` where the matched number is not 2. |
| `notice-of-claim-error` | `claim_type` is `notice_of_claim` or `context_snippet` contains reference to a public entity defendant, AND the claim either (a) omits the 180-day requirement or (b) treats 180 days as the full filing window rather than a notice-only requirement. |
| `wrongful-death-cap-claim` | `claim_type` is `az_const_claim` or `wrongful_death_sol`, AND the claim text contains any variant of "cap," "limit," "maximum damages," or "cannot exceed" in proximity to damages. |
| `tribal-jurisdiction-ignored` | `tribal_land_flag` is true AND the article does not address which sovereign law governs (detected by absence of "tribal," "sovereign," "nation," "reservation," or "jurisdiction" in the claim or `context_snippet`). |

**HIGH checks**:

| Class | Trigger condition |
|---|---|
| `verdict-as-settlement` | `claim_type` is `verdict_amount` or `settlement_amount`, AND the claim text uses "verdict" and "settlement" interchangeably, OR uses "verdict" for an amount that CourtListener records indicate was a settlement. |
| `ars-citation-number-error` | `claim_type` is `ars_citation`, AND the section number in the claim is listed in the Citation Bank's "commonly confused" pairs with a different principle than what the claim attributes to it. E.g., claim attributes the 2-year wrongful death SOL to ARS 12-542 instead of 12-611. |
| `comparative-fault-misquote` | `claim_type` is `comparative_fault`, AND the claim implies a percentage threshold that bars recovery. Detected by: `\b(more than|over|exceeds?|above)\s*\d+\s*%\s*(at fault|fault)` in claim or context_snippet. |
| `unverified-verdict-amount` | `claim_type` is `verdict_amount` AND confidence is MEDIUM or LOW AND no CourtListener docket URL is present. |
| `er7-1-violation` | `claim_type` is `bar_rule`, OR the claim text contains any of the BLOCK-class patterns from `az-bar-ethics-guard` ER 7.1 rule map. |

**MEDIUM checks**:

| Class | Trigger condition |
|---|---|
| `adot-data-year-mismatch` | `claim_type` is `adot_stat` AND `data_year_inline` is null (data year not stated inline). |

### Step 5: Assemble and return output

Return a single JSON object. No other output. No logging to stdout except the JSON result.

## Output schema

```json
{
  "claim_id": "uuid-v4",
  "slug": "arizona-statute-of-limitations-car-accident",
  "collection": "legal-guides",
  "claim": "Arizona gives injured people two years from the date of a crash to file a personal injury lawsuit",
  "claim_type": "sol_deadline",
  "confidence": "HIGH",
  "source_url": "https://www.azleg.gov/ars/12/00542.htm",
  "source_label": "ARS § 12-542",
  "source_excerpt": "There shall be commenced and prosecuted within two years after the cause of action accrues...",
  "source_unreachable": false,
  "fabrication_class_hit": false,
  "fabrication_class": null,
  "fabrication_severity": null,
  "gate_result": "PASS",
  "action_required": "none",
  "notes": "Claim correctly states 2-year PI SOL under ARS 12-542. Accrual from date of crash is correct for manifest injuries. No tribal jurisdiction concern. No public entity defendant referenced."
}
```

**Field definitions**:

| Field | Type | Values |
|---|---|---|
| `claim_id` | string | Echoed from input |
| `slug` | string | Echoed from input |
| `collection` | string | Echoed from input |
| `claim` | string | Echoed from input |
| `claim_type` | string | Echoed from input |
| `confidence` | string | `HIGH`, `MEDIUM`, `LOW` |
| `source_url` | string or null | URL of the primary source fetched. Null if source unreachable. |
| `source_label` | string or null | Human-readable label for the source (e.g., "ARS § 12-542") |
| `source_excerpt` | string or null | Relevant excerpt from the source text (max 300 chars). Null if source unreachable. |
| `source_unreachable` | boolean | True if the primary source URL returned a 404 or timed out |
| `fabrication_class_hit` | boolean | True if any fabrication class fired |
| `fabrication_class` | string or null | The fabrication class label if `fabrication_class_hit` is true |
| `fabrication_severity` | string or null | `CRITICAL`, `HIGH`, or `MEDIUM` if `fabrication_class_hit` is true |
| `gate_result` | string | `PASS`, `MISSING_PRIMARY_SOURCE`, `WEAK_MATCH`, or `FABRICATION_CLASS_HIT` |
| `action_required` | string | `none`, `add_citation`, `rewrite`, `delete`, or `attorney_review` |
| `notes` | string | Human-readable explanation of the result. Required — always populated. |

**`gate_result` logic**:
- `PASS`: confidence is HIGH and no fabrication class fired
- `MISSING_PRIMARY_SOURCE`: confidence is LOW (regardless of fabrication class)
- `WEAK_MATCH`: confidence is MEDIUM and no fabrication class fired
- `FABRICATION_CLASS_HIT`: any fabrication class fired (overrides confidence)

**`action_required` mapping**:

| Condition | Action |
|---|---|
| `gate_result: PASS` | `none` |
| `gate_result: MISSING_PRIMARY_SOURCE` | `add_citation` — find and add the primary source URL to `dataSources` |
| `gate_result: WEAK_MATCH`, no fabrication class | `add_citation` — strengthen the source reference |
| `fabrication_class: wrong-sol` | `delete` then `rewrite` — the claim is factually wrong; delete before rewriting from the statute |
| `fabrication_class: notice-of-claim-error` | `attorney_review` — scope of fix requires J.D. review; do not self-clear |
| `fabrication_class: wrongful-death-cap-claim` | `delete` — the AZ constitutional prohibition makes this uncorrectable with a simple rewrite |
| `fabrication_class: tribal-jurisdiction-ignored` | `attorney_review` — tribal jurisdiction scope requires J.D. review |
| `fabrication_class: verdict-as-settlement` | `rewrite` — correct the label and add the CourtListener URL |
| `fabrication_class: ars-citation-number-error` | `rewrite` — replace the cited section with the correct one from the Citation Bank |
| `fabrication_class: comparative-fault-misquote` | `rewrite` — remove percentage threshold language; replace with ARS 12-2505 pure comparative description |
| `fabrication_class: unverified-verdict-amount` | `add_citation` — add CourtListener docket URL or remove the dollar figure |
| `fabrication_class: adot-data-year-mismatch` | `rewrite` — add explicit data year inline |
| `fabrication_class: er7-1-violation` | `rewrite` — see `az-bar-ethics-guard` for the specific rewrite guidance |

## Parallelization

The agent is designed for parallel dispatch. `legal-fact-check` Phase 2 dispatches one agent instance per extracted claim using `Promise.allSettled()` (TypeScript) or `asyncio.gather()` (Python). Results are collected and correlated by `claim_id`.

**Concurrency limits**: Respect per-domain rate limits to avoid IP bans:
- `azleg.gov`: 2 concurrent requests, 500ms between requests to the same URL
- `courtlistener.com`: 3 concurrent requests, per API rate-limit headers
- `azcourts.gov`: 2 concurrent requests
- `adot.gov`: 2 concurrent requests
- All other domains: 1 concurrent request per domain

The dispatcher enforces these limits via a per-domain semaphore. Individual agent instances do not enforce limits themselves — they assume the dispatcher has already acquired the appropriate semaphore before invocation.

## Error handling

The agent never throws. On any unhandled error, it returns:

```json
{
  "claim_id": "uuid-v4",
  "claim": "...",
  "claim_type": "...",
  "confidence": "LOW",
  "source_url": null,
  "source_unreachable": true,
  "fabrication_class_hit": false,
  "fabrication_class": null,
  "fabrication_severity": null,
  "gate_result": "MISSING_PRIMARY_SOURCE",
  "action_required": "add_citation",
  "notes": "Agent error: [error message]. Primary source could not be fetched. Manual verification required.",
  "agent_error": true
}
```

The `agent_error: true` field signals to the dispatcher that this claim requires manual review — it is not treated as a PASS.

## References

- Claim types: `legal-fact-check` SKILL.md Phase 1
- Primary source routing: `references/primary-source-map.md`
- ARS citation canonical principles: `references/ars-citation-bank.md`
- Fabrication class definitions: `legal-fact-check` SKILL.md Phase 3
- ER 7.1–7.5 rule map: `az-bar-ethics-guard` SKILL.md Phase 2
