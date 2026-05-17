---
name: az-bar-ethics-guard
description: Pre-publish ER 7.1–7.5 scan of any AZ Law Now MDX file or template. Encodes the Arizona Rules of Professional Conduct Rules 7.1 through 7.5 as a pattern-matching rule map. Emits BLOCK (exit 1) on hard violations and WARN on soft violations. JSON + human-readable diff output. Mandatory on all practice-area pages, legal guides, and any content containing verdicts, superlatives, testimonials, or fee arrangements.
when-to-use: |
  Pre-publish gate on:
  - Any practice-area MDX file (mandatory)
  - Any legal-guide MDX file (mandatory)
  - Any client-guide MDX file containing result references, fee language, or attorney credentials
  - Any page template (.astro) with visible marketing copy
  - Any hero copy, CTA copy, or OG description field before it goes live
  - After any AI-assisted draft to catch ER 7.1 superlatives and guarantee language
tier: S
---

# az-bar-ethics-guard

## When to invoke

Pre-publish gate on:

- Any practice-area MDX (mandatory — LegalService schema pages are the highest ER 7.1 exposure surface)
- Any legal-guide MDX (mandatory — Brandon voice with verdict references, superlatives, and comparison language)
- Any client-guide MDX that contains result references, fee arrangement language, or credential claims
- Any `.astro` page template with visible marketing copy (hero text, CTA buttons, footer disclaimers)
- Any OG description or meta description field before publish
- After any AI-assisted draft — LLMs consistently hallucinate superlatives and guarantee framing that violates ER 7.1

Mandatory. Block-level dependency for BLOCK-class violations. WARN-class violations may proceed with editorial sign-off but must be logged.

**Why this matters**: Arizona State Bar discipline is a consequential business risk. ER 7.1–7.5 violations can result in public censure, suspension, or disbarment. A practice-area page that says the firm is "the best car accident attorney in Phoenix" is an ER 7.1 violation. A page that says "we'll get you maximum compensation" is an ER 7.1 violation. A page calling an attorney a "specialist" without AZ Bar certification is an ER 7.4 violation. These are not style preferences — they are mandatory compliance requirements.

## Inputs

- File path to MDX, markdown, or `.astro` template (required)
- Optional: `--frontmatter-only` to scan frontmatter fields only (for rapid OG/meta checks)
- Optional: `--body-only` to skip frontmatter
- Optional: `--collection` flag for collection-specific rule weighting

```bash
npx tsx scripts/az-bar-ethics-guard/scan-ethics.ts --file src/content/practice-areas/car-accident.mdx
npx tsx scripts/az-bar-ethics-guard/scan-ethics.ts --batch src/content/practice-areas/
npx tsx scripts/az-bar-ethics-guard/scan-ethics.ts --file src/pages/index.astro --frontmatter-only
```

## Phase 1: File parsing and scope detection

The scanner ingests the full file (frontmatter + body). It separates:
- **Frontmatter fields**: `title`, `description`, `headline`, `heroTitle`, `heroSubtitle`, `keyTakeaway`, `faqs[].question`, `faqs[].answer`
- **MDX body**: all visible text, stripped of import statements, JSX component tags, and Markdown syntax
- **Component prop strings**: quoted string values inside JSX component props (e.g., `<StatGrid label="We've won X cases" ...>` is visible to users and scanned)

Scope detection: the scanner identifies the collection type (`practice-areas`, `legal-guides`, `client-guides`, `investigations`) from the file path and applies collection-specific rule weighting. Practice-area pages get stricter superlative and result-framing checks than investigations.

## Phase 2: ER 7.1–7.5 Rule Map Scan

### ER 7.1 — False or Misleading Communications

**Rule summary**: A lawyer shall not make a false or misleading communication about the lawyer or the lawyer's services. A communication is false or misleading if it contains a material misrepresentation of fact or law, omits a fact necessary to make the statement not materially misleading, or is likely to create an unjustified expectation about results.

**BLOCK patterns** (exit 1, must be resolved before publish):

| Pattern | Reason | Example violation |
|---|---|---|
| `/\b(best|top|#1|number one|leading|premier|finest|greatest)\b.{0,30}\b(attorney|lawyer|firm|accident|injury|law firm)\b/gi` | Unverified superlative — ER 7.1(a) | "Phoenix's best car accident attorney" |
| `/\b(guarantee|guaranteed|ensure you (get|receive|win)|we will (win|get you|recover|secure))\b/gi` | Result guarantee — ER 7.1(b) | "We guarantee you'll receive maximum compensation" |
| `/\b(maximum compensation|biggest settlement|highest recovery)\b/gi` | Implied result guarantee — ER 7.1(b) | "We fight to get you maximum compensation" |
| `/\bno fee unless (you|we) win\b.{0,100}$/gim` | Incomplete contingency fee statement — ER 7.1 requires disclosure that client may still be responsible for costs and expenses even if no recovery | "No fee unless you win" without cost disclosure |
| `/\byou (will|are going to|are entitled to) (receive|get|recover|collect)\b/gi` | Promise of specific outcome — ER 7.1(b) | "You will receive compensation for your injuries" |
| `/\b(proven track record|unmatched results|exceptional outcomes)\b/gi` | Unverifiable comparative claim — ER 7.1(a) | "Our proven track record of exceptional outcomes" |
| `/\bmore (experienced|qualified|skilled|successful) than\b/gi` | Comparative claim without basis — ER 7.1(a) | "More experienced than other Phoenix firms" |

**WARN patterns** (exit 0, flagged for editorial review):

| Pattern | Reason | Example |
|---|---|---|
| `/\b(aggressive|relentless|fierce|tough|powerful)\b.{0,20}\b(advocate|representation|attorney|lawyer|fighter)\b/gi` | Overstatement tendency — not per se violations but flag for tone review | "aggressive advocate for injury victims" |
| `/\b(millions? (recovered|won|secured|obtained))\b/gi` | Aggregate result without per-result context — ER 7.1 requires context; WARN if no disclaimer present | "We've recovered millions for our clients" |
| `/\b(award.winning|recognized|rated|ranked)\b/gi` | Credential claim — WARN if no source for the recognition is cited | "Award-winning personal injury attorneys" |
| `/\b(most (cases|clients|verdicts)|largest (firm|team))\b/gi` | Comparative size claim — WARN if not verifiable | "We handle the most car accident cases in Phoenix" |

### ER 7.2 — Attorney Advertising

**Rule summary**: Subject to ER 7.1, a lawyer may advertise services through written, recorded, or electronic communication, including public media. Any advertisement must include the name and office address of at least one lawyer or law firm responsible for its content.

**BLOCK patterns**:

| Pattern | Reason |
|---|---|
| Any web page or MDX file published under the firm's domain with marketing content that lacks attorney identification in the template footer or schema | ER 7.2(c) requires responsible attorney identification on all ads |
| `/\bpay (us|me)\b.{0,30}\b(referral|if you refer)\b/gi` | Prohibited referral fee language — ER 7.2(b) bars referral fees to non-lawyers |

**WARN patterns**:

| Pattern | Reason |
|---|---|
| Marketing content on practice-area pages lacking "Attorney Advertising" or equivalent disclosure label | ER 7.2 advisory; AZ Bar may require disclosure on certain media |

### ER 7.3 — Solicitation of Clients

**Rule summary**: A lawyer shall not solicit professional employment from a prospective client by in-person, live telephone, or real-time electronic contact when a significant motive for doing so is the lawyer's pecuniary gain, unless the contacted person is a lawyer or has a family or prior professional relationship with the lawyer.

**BLOCK patterns**:

| Pattern | Reason |
|---|---|
| `/\b(call us (right now|immediately|today) if you (were|are|got|have been))\b/gi` | Direct solicitation language targeting recently-injured persons — ER 7.3 | "Call us right now if you were injured in a crash" |
| `/\b(we (saw|heard about|read about) your (accident|crash|injury))\b/gi` | Reference to a specific known incident — ER 7.3 in-person solicitation equivalent | "We heard about your accident on SR-347" |
| `/\b(contact us before you talk to the insurance company)\b/gi` | Solicitation targeting a person in a specific known situation with pecuniary motive | Aggressive solicitation framing |

**WARN patterns**:

| Pattern | Reason |
|---|---|
| `/\b(were you (injured|hurt|involved) in (a|an) .{0,40}(crash|accident|incident))\b.*\b(call|contact|reach out)\b/gi` | Conditional solicitation targeting a class of people — WARN; not per se 7.3 but review intent | "Were you injured in an I-10 crash? Call us." |

### ER 7.4 — Communication of Fields of Practice and Specialization

**Rule summary**: A lawyer shall not state or imply that a lawyer is a specialist in a particular field of law, except: (1) a lawyer admitted to engage in patent practice before the U.S. Patent and Trademark Office may use "Patent Attorney" or equivalent; (2) a lawyer engaged in admiralty practice may use "Admiralty" or equivalent; (3) a lawyer certified as a specialist by the State Bar of Arizona or an organization accredited by the State Bar may communicate the specialization.

**BLOCK patterns**:

| Pattern | Reason |
|---|---|
| `/\b(specialist|specializes in|specialty in|specialized in)\b/gi` when NOT paired with AZ Bar certification reference | ER 7.4 prohibits "specialist" without AZ Bar certification | "Car accident specialist" / "We specialize in truck accidents" |
| `/\b(board certified|certified specialist)\b/gi` when the certification is not AZ Bar-accredited | ER 7.4 — only AZ Bar-approved certifications qualify | "Board certified injury specialist" without basis |
| `/\bcertified (personal injury|truck accident|car accident) (attorney|lawyer)\b/gi` | ER 7.4 — AZ does not certify personal injury as a specialty absent specific AZ Bar program | "Certified personal injury attorney" |

**WARN patterns**:

| Pattern | Reason |
|---|---|
| `/\b(focuses on|concentrates in|dedicated to|exclusively handles)\b/gi` | These are permissible descriptions of field of practice under ER 7.4(d) but flag for review to ensure they don't cross into "specialist" language | "Focuses on personal injury" — permissible |

### ER 7.5 — Firm Names and Letterhead

**Rule summary**: A lawyer shall not use a firm name, letterhead, or other professional designation that violates ER 7.1. A trade name may be used by a lawyer in private practice if it does not imply a connection with a government agency or with a public or charitable legal services organization and is not otherwise in violation of ER 7.1.

**BLOCK patterns**:

| Pattern | Reason |
|---|---|
| `/\b(Arizona State Bar|AZ Bar Association|State Bar)\b/gi` used in firm name or as apparent affiliation | ER 7.5 — firm name may not imply government or bar affiliation | "Arizona Bar Injury Attorneys" (implies bar affiliation) |
| `/\b(Legal Aid|Public Defender|Prosecutor)\b/gi` in firm branding | ER 7.5 — trade name may not imply connection with public legal services organization | |

**WARN patterns**:

| Pattern | Reason |
|---|---|
| Any firm name variation not matching the registered firm name as filed with the AZ Bar | ER 7.5 — consistency check; WARN if the site uses informal shorthand that diverges from the official name | "AZ Law Now" vs. the registered name |

## Phase 3: Verdict and Result Framing Check

Every verdict or settlement figure in the content is extracted and checked against three criteria:

1. **Is it labeled correctly?** A jury verdict must be called a "verdict." A negotiated resolution must be called a "settlement." Mixing the terms violates ER 7.1.
2. **Is context provided?** ER 7.1 requires that results in advertising not create an unjustified expectation. A verdict figure must be accompanied by language like "past results do not guarantee future outcomes" or equivalent context. Bare dollar figures without context are a BLOCK.
3. **Is the amount verifiable?** If the amount is not verifiable via a CourtListener docket, court filing, or press release with a case number, it is flagged as `unverified-verdict-amount` (see `legal-fact-check` fabrication class 9).

Result context check patterns:

| Condition | Gate result |
|---|---|
| Verdict or settlement dollar figure appears in body or frontmatter WITHOUT any form of "past results don't guarantee" disclaimer on the page | BLOCK — ER 7.1(b) requires context to prevent unjustified expectation |
| "No fee unless you win" appears WITHOUT disclosure that the client may owe costs/expenses even if no recovery | BLOCK — incomplete contingency fee statement |
| Verdict figure appears with case number or CourtListener URL in `dataSources` | PASS |
| Verdict figure appears without any source reference | WARN — route to `legal-fact-check` for `unverified-verdict-amount` check |

## Phase 4: Block or Pass

**BLOCK** (exit code 1) — must be resolved before publish:
- Any BLOCK-class pattern match from ER 7.1–7.5 rule map
- Result figure without context disclaimer
- "No fee unless you win" without cost disclosure
- "Specialist" without AZ Bar certification

**WARN** (exit code 0, logged) — may proceed with editorial sign-off:
- Any WARN-class pattern match from rule map
- Aggregate result claims without per-result source
- Award claims without cited source
- Conditional solicitation-adjacent language

Exit codes:
- `0`: no BLOCK-class violations (WARN items logged but don't fail build)
- `1`: one or more BLOCK-class violations

## Outputs

Every run produces three artifacts in `scripts/az-bar-ethics-guard/output/`:

**`ethics_scan_results.json`** — machine-readable result:

```json
{
  "file": "src/content/practice-areas/car-accident.mdx",
  "collection": "practice-areas",
  "pass": false,
  "exit_code": 1,
  "violations": [
    {
      "rule": "ER 7.1",
      "class": "BLOCK",
      "pattern": "maximum compensation",
      "matched_text": "fight to get you maximum compensation",
      "location": "body paragraph 3",
      "reason": "Implied result guarantee. Rewrite to: 'work to recover the full compensation the evidence supports'",
      "action_required": "rewrite"
    },
    {
      "rule": "ER 7.4",
      "class": "BLOCK",
      "pattern": "specialist",
      "matched_text": "car accident specialists",
      "location": "frontmatter heroSubtitle",
      "reason": "ER 7.4 prohibits 'specialist' without AZ Bar certification in that field.",
      "action_required": "replace with 'attorneys who focus on car accident claims' or similar permissible framing"
    }
  ],
  "warnings": [
    {
      "rule": "ER 7.1",
      "class": "WARN",
      "pattern": "millions recovered",
      "matched_text": "We've recovered millions for injured Arizonans",
      "location": "body paragraph 1",
      "reason": "Aggregate result claim. Add source and context: case-specific results listed in dataSources, plus disclaimer that past results don't guarantee future outcomes.",
      "action_required": "add disclaimer or remove aggregate claim"
    }
  ],
  "block_count": 2,
  "warn_count": 1
}
```

**`ethics_scan_diff.md`** — human-readable diff for editorial review:

```
BLOCK  ER 7.1 — "fight to get you maximum compensation"
       Location: body paragraph 3
       Pattern:  implied result guarantee
       Fix:      "work to recover the full compensation the evidence supports"

BLOCK  ER 7.4 — "car accident specialists"
       Location: frontmatter heroSubtitle
       Pattern:  "specialist" without AZ Bar certification
       Fix:      "attorneys who focus on car accident claims"

WARN   ER 7.1 — "We've recovered millions for injured Arizonans"
       Location: body paragraph 1
       Pattern:  aggregate result claim without context
       Action:   add past-results disclaimer + source URL for referenced verdicts
```

**Exit code 0 or 1** — wired into the build pipeline.

## Wiring into the build pipeline

Add to `package.json` scripts (alongside existing `check:quality:strict`):

```json
{
  "scripts": {
    "check:ethics": "npx tsx scripts/az-bar-ethics-guard/scan-ethics.ts --batch src/content/",
    "check:ethics:practice-areas": "npx tsx scripts/az-bar-ethics-guard/scan-ethics.ts --batch src/content/practice-areas/ --collection practice-areas",
    "preflight:ethics": "npx tsx scripts/az-bar-ethics-guard/scan-ethics.ts --file"
  }
}
```

`check:ethics` runs after `check:quality:strict` and before `build` in the Netlify chain. It is an advisory-but-logged gate: BLOCK violations fail the build; WARN violations log to `scripts/az-bar-ethics-guard/output/ethics_scan_results.json` for editorial review.

## Escalation path

When a BLOCK fires:

1. Read `ethics_scan_diff.md` for the specific violation and suggested rewrite
2. Apply the fix to the MDX file — do NOT acknowledge and proceed; the build fails until the pattern is removed
3. For ER 7.1 superlatives: replace with specific, verifiable claims ("We've handled over 500 car accident cases in Maricopa County" — if true and verifiable — not "We're the best")
4. For ER 7.4 "specialist": replace with permissible framing ("attorneys who focus on," "legal team concentrating in," "dedicated to representing")
5. For result guarantee language: rewrite using results-framed-as-information, not promises ("Our clients have recovered X in cases involving Y" — with source — not "We'll get you X")
6. For "no fee unless you win" without cost disclosure: add "You won't pay attorney fees unless we recover compensation. You may be responsible for case costs and expenses regardless of outcome."
7. Re-run `check:ethics` — must exit 0 before the article proceeds to `check:claims` and then `build`

## Notes on AZ-specific context

Arizona's ER rules track the ABA Model Rules closely but with AZ-specific amendments. The AZ Bar's ethics opinions add interpretive guidance:

- **Verdicts in advertising**: AZ Bar has held that displaying verdicts and settlements in advertising is permissible under ER 7.1 if each result is accurate, includes context (case type, not a guarantee), and the attorney is identified. A page with 10 verdict figures and no "past results do not guarantee future outcomes" disclaimer violates ER 7.1.
- **"No fee unless you win"**: The AZ Bar has interpreted this phrase as incomplete unless it clarifies whether costs (filing fees, expert fees, deposition costs) are also contingent. Best practice: add "No attorney fee unless we win. Case costs may apply."
- **Internet advertising**: All website content is considered "advertising" under ER 7.2, including blog posts, guides, and practice-area pages. The attorney-advertising obligation applies site-wide.
- **Testimonials**: Client testimonials are permissible under AZ ER 7.1 if accurate and non-misleading. They require written client consent for use. A WARN fires on any testimonial-style block (direct quote from a named person about their experience) — editorial must confirm written consent exists.
