# Mode: Site Audit — AZ Law Now

You are now in **audit mode** for AZ Law Now quality assurance. This mode covers all five
content collections (investigations, legal-guides, client-guides, practice-areas, glossary),
plus the Netlify build chain. Run checks in order. Fast content gates first, build last.

---

## Netlify Build Chain (run in this exact order before every push)

```bash
npm run check:quality:strict    # 1. Content quality — hard block
npm run check:sources:strict    # 2. Source validation — hard block
npm run check:ai-patterns       # 3. AI-pattern scan — advisory until cycle 3, then hard
npm run check:og                # 4. OG guardrail — hard block
npm run build                   # 5. Astro build — hard block
npm run check:schema            # 6. Schema — non-strict until LegalService @id debt cleared
```

**Never reorder or skip.** AI-patterns runs before build because MDX parse errors surface
earlier. Schema runs post-build because it reads the compiled output. `check:claims` and
`check:serp` are advisory and never in this chain.

**LegalService note:** `check:schema:strict` is blocked until the location pages and
`/reviews/` page carry distinct `@id` values inside a proper `@graph`. Do not pass
`--strict` to schema until that is resolved.

---

## Audit 1 — Writing Quality

```bash
npm run check:quality           # advisory (shows counts + file paths)
npm run check:quality:strict    # hard block (exit 1 on any violation)
```

**Enforced by `scripts/audit-quality.ts`:**

| Check | Threshold | Hard? |
|---|---|---|
| Em-dashes | 0 | Yes |
| Passive voice | ≤ 20% | Warn |
| Flesch reading ease | 50–60 (warn < 25) | Warn |
| Active voice ratio | ≥ 80% | Warn |
| Paragraph length | ≤ 5 lines | Warn |
| No "accident" (use "crash") | 0 | Yes |
| No "victims" for people | 0 | Yes |
| No "specialist" without AZ Bar cert | 0 | Yes |
| No unverified superlatives (ER 7.1) | 0 | Yes |

---

## Audit 2 — Source Validation

```bash
npm run check:sources           # duplicate titles, blocked domains
npm run check:sources:strict    # exit 1 on any failure
```

**Checks for:**
- Broken `dataSources` URLs (HTTP 404 / non-2xx)
- Duplicate article titles across collections
- Blocked source domains (competitor law firms, lead-gen sites)
- Missing `dataSources` on investigations (required), legal-guides (required),
  client-guides (required), practice-areas (required); glossary exempt

**Blocked domain patterns (never cite):**
- Any `.com`/`.net`/`.org` law firm or lead-gen site that is not a primary government
  or court record source
- Specifically: any domain that is not azleg.gov, azcourts.gov, adot.gov, fra.dot.gov,
  courtlistener.com, pacer.uscourts.gov, azag.gov, azdhs.gov, ade.az.gov, azahcccs.gov,
  fra.dot.gov, bls.gov, census.gov, cdc.gov, nih.gov, pubmed.ncbi.nlm.nih.gov,
  or a peer-reviewed DOI link

---

## Audit 3 — AI Pattern Scan

```bash
npm run check:ai-patterns       # scans all 5 collections + pages/
```

**Enforced by `scripts/audit-ai-patterns.ts`:**

| Pattern | Examples | Status |
|---|---|---|
| Confident-hedge | "it's worth noting," "it's important to remember" | Block |
| AI throat-clears | "certainly," "absolutely," "of course," "definitely" | Block |
| Empty intensifiers | "truly," "really," "very important" (standalone) | Block |
| Sycophantic openers | "Great question," "Excellent point" | Block |
| Em-dash (double catch) | `—` | Block |
| Banned disaster framing | "shocking," "alarming," "staggering" before a stat | Block |
| Guarantee language (ER 7.1) | "will recover," "guaranteed," "you'll win" | Block |
| Solicitation language (ER 7.3) | "call us now" in body copy (not CTA zone) | Block |

Collections scanned: `src/content/investigations/**/*.mdx`,
`src/content/legal-guides/**/*.mdx`, `src/content/client-guides/**/*.mdx`,
`src/content/practice-areas/**/*.mdx`, `src/content/glossary/**/*.mdx`,
`src/pages/**/*.astro`, `src/pages/**/*.mdx`

---

## Audit 4 — OG Guardrail

```bash
npm run check:og
```

Verifies every published MDX file has a matching OG image at the declared `ogImage` path.
Fails on missing or zero-byte files. Run before build; build does not catch missing OG.

---

## Audit 5 — Image Audit

```bash
npm run check:images            # advisory
npm run check:images:strict     # hard block
```

**Checks for:**
- Hero image declared in `image:` frontmatter exists at path
- OG image declared in `ogImage:` frontmatter exists at path (1200×630 PNG)
- No zero-byte images
- Hero images are webp format

---

## Audit 6 — Claim Inventory (advisory / human review)

```bash
npm run check:claims            # NOT in Netlify chain
```

Outputs a JSON manifest of all extractable claims by type. Review before publishing any
investigation or legal-guide. Do not block CI on this; human review is required.

**Claim types extracted:**
- `sol_deadline` — ARS 12-542 (2yr PI), ARS 12-611 (2yr wrongful death)
- `notice_of_claim` — ARS 12-821.01 (180 days, public entity)
- `ars_citation` — any ARS §§ reference
- `verdict_amount` — dollar figures near verdict/settlement language
- `adot_stat` — ADOT crash figures with data year
- `court_case` — case name + court references
- `insurance_stat` — uninsured rate claims
- `comparative_fault_pct` — fault percentage figures
- `tribal_jurisdiction` — any reference to tribal land or tribal defendants

---

## Audit 7 — Programmatic Value Gate (advisory)

```bash
npm run check:programmatic      # NOT in Netlify chain; run before new city-page commits
```

Verifies each practice-area and city page has real ADOT data, not boilerplate.
Flags pages that share identical body copy patterns across ≥ 3 city variants.

---

## Audit 8 — Full QA Suite

```bash
npm run qa                      # all audits in sequence (non-strict; for local review)
npm run qa:strict               # strict mode; mirrors Netlify chain
```

---

## Per-Collection Checklists

### Investigations (`src/content/investigations/`)

Every Brendan Franks investigation before push:

**Frontmatter requirements:**
- [ ] `author: brendan-franks`
- [ ] `schemaType: NewsArticle`
- [ ] `category` is one of: `corridor-study`, `negligence-report`, `public-records`, `data-investigation`, `infrastructure-accountability`
- [ ] `keyTakeaway` is multi-paragraph (≥ 2 sentences, ≥ 40 words)
- [ ] `dataSources` array has ≥ 3 entries, each with full APA-style citation + URL
- [ ] `faqs` array has ≥ 5 entries with substantive answers (≥ 50 words each)
- [ ] `locations` array populated (at minimum one Arizona city or region)
- [ ] `ogImage` and `image` paths declared and files exist
- [ ] `publishedAt` is today's date; `updatedAt` set
- [ ] `featured` field set (`true` or `false` — not omitted)
- [ ] `insightSchema` fields present if applicable: `category`, `dataSources`, `keyTakeaway`, `faqs`

**Content requirements:**
- [ ] Lede opens with a specific sourced data point (number, date, record count) — not a framing sentence
- [ ] Original finding is stated in first 200 words — not a summary of existing coverage
- [ ] ADOT/FRA/ADE/DHS/AHCCCS data year cited in body wherever stat appears
- [ ] Publication year ≠ data year — both explicit in text
- [ ] No directive legal advice in body (Brendan is journalist, not attorney)
- [ ] Person-first language throughout: "people killed" not "fatality victims"
- [ ] Road/intersection/corridor named specifically — no generic "Arizona roads"
- [ ] ≥ 1 internal link to a Brandon legal-guide
- [ ] ≥ 1 internal link to a Stephanie client-guide
- [ ] ARS 39-121 public records request documented if data obtained via PRR
- [ ] Tribal jurisdiction flagged if incident location is on or near tribal land
- [ ] `npm run check:claims` output reviewed — no unverified verdict amounts
- [ ] Skills run: `legal-fact-check` + `az-bar-ethics-guard`
- [ ] `npm run check:quality:strict` — 0 violations
- [ ] `npm run check:ai-patterns` — 0 blocks
- [ ] OG image generated: `npm run gen:og`
- [ ] `npm run build` passes locally

**Banned list for investigations:**
- "accident" — use "crash"
- "victims" for people — use "the family," "the driver," "the child"
- "shocking," "alarming," "staggering" before any statistic
- em-dashes
- directive legal advice: "you should file," "consult an attorney" — Brendan does not give legal advice
- unverified verdict or settlement dollar amounts — attribute to court record or "publicly reported"
- ADOT data without citing the specific annual report and data year
- "specialist" or "expert attorney" language

---

### Legal Guides (`src/content/legal-guides/`)

Every Brandon Millam legal-guide before push:

**Frontmatter requirements:**
- [ ] `author: brandon-millam`
- [ ] `reviewedBy` field present (`brendan-franks` or another named reviewer)
- [ ] `schemaType: Article`
- [ ] `category: legal-guide`
- [ ] `keyTakeaway` summarizes the key statute + deadline (≥ 40 words)
- [ ] `dataSources` array ≥ 3 entries; every ARS citation has an azleg.gov URL
- [ ] `faqs` array ≥ 5 entries
- [ ] Word count ≥ 1,500
- [ ] `ogImage` and `image` declared and files exist

**Mandatory disclosure pattern — every legal-guide must contain all three:**

```
SOL disclosure (verbatim pattern — adapt dates only):
"The statute of limitations for [claim type] in Arizona is [N] years from [trigger date]
under ARS [section]. Missing this deadline permanently bars the claim."

Notice-of-claim disclosure (required on any guide touching public entities):
"If the at-fault party is a government entity — a city, county, ADOT, a public school
district, or any other public body — ARS 12-821.01 requires a notice of claim served
within 180 days of the injury or death. The notice must state the amount of damages.
This is not the lawsuit deadline. It is a condition precedent. Missing the 180-day window
bars recovery regardless of the underlying merits."

ARS 12-821.01 is not a defect or technicality — frame it as the hard bar it is.
Never write "some entities require notice" — the 180-day rule applies to all AZ public entities.
```

**Tribal jurisdiction warning (required when guide topic touches roads or facilities that
may cross tribal land — I-40, SR-89, SR-64, US-160, US-163, SR-87 near Ft. McDowell, US-93
near Ak-Chin, and any route through Navajo Nation, Tohono O'odham, SRPMIC, Fort McDowell
Yavapai, or Ak-Chin):**

```
"If the crash occurred on tribal land or a road maintained by a tribal nation, Arizona
state statutes of limitations and notice-of-claim rules may not apply. Tribal sovereign
immunity, tribal court jurisdiction, and separate notice requirements vary by nation.
This is not a technicality — it can bar an otherwise valid claim. Speak with an attorney
who handles tribal jurisdiction matters before the state SOL expires."
```

**Content requirements:**
- [ ] Every legal claim cites the specific ARS section — no paraphrase without citation
- [ ] ARS 12-2505 (pure comparative fault) cited whenever fault is discussed
- [ ] ARS 12-2506 (several-only liability) cited when multiple defendants discussed
- [ ] AZ Const Art 2 §31 cited when discussing damages caps — "Arizona has no cap on PI or wrongful-death damages"
- [ ] Wrongful death survivors correctly enumerated per ARS 12-611/12-612
- [ ] No claim that AZ follows modified comparative fault (it is pure — recovery available at any fault percentage)
- [ ] No claim that AZ has a damages cap — it does not; guard the inverse error too
- [ ] ARS citation numbers verified against azleg.gov before publish
- [ ] No "specialist" without AZ Bar cert in copy
- [ ] ≥ 1 internal link to a Brendan investigation
- [ ] ≥ 1 internal link to a Stephanie client-guide
- [ ] ≥ 1 internal link to a relevant practice-area page
- [ ] Skills run: `legal-fact-check` + `az-bar-ethics-guard`
- [ ] `npm run check:quality:strict` — 0 violations
- [ ] `npm run check:ai-patterns` — 0 blocks
- [ ] `npm run build` passes locally

---

### Client Guides (`src/content/client-guides/`)

Every Stephanie Ramirez client-guide before push:

**Frontmatter requirements:**
- [ ] `author: stephanie-ramirez`
- [ ] `schemaType: Article`
- [ ] `category: client-guide`
- [ ] `dataSources` array present (minimum ARS citations for any deadline mentioned)
- [ ] `faqs` array ≥ 4 entries written in second person
- [ ] Word count ≥ 1,000
- [ ] `ogImage` and `image` declared and files exist

**Mandatory SOL / notice disclosure phrasing for any guide that discusses timelines:**

```
SOL disclosure (client-friendly register):
"You have two years from the date of the crash to file a personal injury lawsuit in
Arizona (ARS 12-542). For wrongful death, the two-year clock runs from the date of
death (ARS 12-611). Don't wait — evidence disappears and memories fade."

Notice-of-claim disclosure (when a government vehicle or road defect is possible):
"If a city bus, government vehicle, or road hazard caused the crash, you have only 180 days
to serve a notice of claim on the government agency under ARS 12-821.01. This is separate
from and much shorter than the two-year lawsuit deadline. If you miss the 180-day window,
the claim is permanently barred."
```

**Content requirements:**
- [ ] Second person throughout ("you," "your") — no third-person detachment
- [ ] No legal advice — distinguish "here is what the law says" from "you should do X"
- [ ] No directive advice that substitutes for attorney consultation
- [ ] Contractions used (Stephanie's voice is warm and plain-spoken)
- [ ] "My" in button/CTA text; "Your" in headlines
- [ ] No em-dashes
- [ ] "crash" not "accident"
- [ ] Flesch reading ease ≥ 50 (Stephanie writes for readability)
- [ ] ≥ 1 internal link to a Brandon legal-guide for the relevant topic
- [ ] ≥ 1 internal link to the relevant practice-area page
- [ ] `npm run check:quality:strict` — 0 violations
- [ ] `npm run check:ai-patterns` — 0 blocks
- [ ] `npm run build` passes locally

---

### Practice Areas (`src/content/practice-areas/`)

Every practice-area page before push:

**Frontmatter requirements:**
- [ ] `author: brandon-millam`
- [ ] `practiceArea` field (display name, e.g., "Car Accidents")
- [ ] `cluster` field (one of: `vehicle-crashes`, `abuse-negligence`, `wrongful-death`, `public-entity`, `premises`)
- [ ] `clusterLabel` and `clusterOrder` set
- [ ] `primaryKeyword` set (target head term)
- [ ] `locations` array populated
- [ ] `faqs` array ≥ 8 entries
- [ ] `dataSources` array ≥ 3 entries
- [ ] Word count ≥ 1,100
- [ ] `ogImage` and `image` declared and files exist

**Content requirements:**
- [ ] SOL and notice-of-claim disclosed using the legal-guide mandatory patterns above
- [ ] ARS 12-2505 (pure comparative fault) cited
- [ ] ARS 12-2506 (several-only liability) cited where relevant
- [ ] No damages cap claim — AZ has none
- [ ] AZ minimum insurance (25/50/15 + ~12% uninsured rate) cited where relevant
- [ ] `npm run check:programmatic` passes (real ADOT data, not boilerplate)
- [ ] Four-way internal linking: ≥ 1 Brendan investigation + ≥ 1 Brandon legal-guide + ≥ 1 Stephanie client-guide + at least 2 other practice-area pages in same cluster
- [ ] Skills run: `legal-fact-check` + `az-bar-ethics-guard` + `pi-cluster-architect` (gate)
- [ ] `npm run check:quality:strict` — 0 violations
- [ ] `npm run check:ai-patterns` — 0 blocks
- [ ] `npm run build` passes locally

---

### Glossary (`src/content/glossary/`)

Every glossary term before push:

**Frontmatter requirements:**
- [ ] `term` set (display name, title-case)
- [ ] `category` set (one of: `liability`, `procedure`, `damages`, `insurance`, `evidence`, `jurisdiction`)
- [ ] `definition` set (one-sentence definition, ≤ 50 words)
- [ ] `arizonaContext` set (AZ-specific application)
- [ ] `arsReference` and `arsUrl` set when an ARS section governs the term
- [ ] `relatedTerms` array populated (≥ 2 slugs)

**Content requirements:**
- [ ] Word count is short-form — no minimum; no word-count gate applied
- [ ] `arsReference` is verified against azleg.gov before publish
- [ ] No legal advice — purely definitional
- [ ] `npm run check:quality:strict` — 0 violations
- [ ] `npm run build` passes locally

---

## Common Issues

| Problem | Fix |
|---|---|
| Em-dash in copy | Rewrite the sentence. Never use find-replace to remove alone. |
| Missing OG image | `npm run gen:og` — verify 1200×630 PNG exists at declared path |
| ARS citation number wrong | Verify at azleg.gov before editing — wrong numbers are a critical error |
| `check:quality:strict` fails on "accident" | Global replace "accident" → "crash" in the file |
| SOL disclosure missing | Add using the mandatory pattern from the relevant collection checklist |
| notice-of-claim missing on public-entity content | Add the full ARS 12-821.01 disclosure block |
| Tribal jurisdiction not flagged | Add the tribal jurisdiction warning block if route touches tribal land |
| `check:schema` fails on LegalService | Do not pass `--strict` until location page @id debt is resolved |
| Verdict dollar amount not sourced | Attribute to "publicly reported case outcomes" or remove |
| ADOT stat without data year | Add the ADOT report year in parentheses after the figure |
| `check:ai-patterns` blocks on "it's worth noting" | Delete the sentence; the underlying point stands alone |
| Any content body/frontmatter edited (esp. fact-check fix) | MANDATORY: set `updatedAt` to today in the same commit — `dateModified` derives from it; a stale `updatedAt` on a corrected file is an incomplete fix (CLAUDE.md Project Constraints) |
