# AZ Law Now — Full AIO Dial-In Program (2026-05-16)

> Runnable playbook. Pull this on the Mac Mini (where the DataForSEO PAA
> data already lives) and execute. Mirrors the mesowatchorg SEO/AIO
> operation, adapted to az-law-now's gates and the Laws-framing decision.
>
> Tell Claude: "read `docs/sessions/2026-05-16-aio-dialin-plan.md` and run
> the full program" — the framing + no-trailer rules auto-load from memory.

---

## 0. Why this exists / what "dialed in" means

Google's AI-optimization guide
(https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
is explicit about what it is **not**: no `llms.txt`, no chunking content
for AI, no writing "for AI," no scaled query-variant pages, no mandatory
schema. It rewards: **unique non-commodity content with a point of view**,
indexable + crawlable, semantic HTML with real headings/sections, fresh,
people-first, internally coherent.

We already own the hard part — proprietary AZ data journalism (37
investigations, primary-source crash/violation/settlement data). The work
is to make it **maximally legible to AI surfaces + classic SERP**:

1. On-page FAQs aligned **verbatim** to the actual People Also Ask
   questions Google surfaces (the documented PAA click-stealing fix).
2. Clean technical hygiene: schema type + dates, internal linking,
   dedup, semantic structure, title/meta CTR.
3. Fill the content gaps our own data earns but we don't yet cover.
4. Ship the net-new Waymo/AV-liability story while the recall is fresh.

Evidence base on the Mac Mini:
- DataForSEO PAA harvest (the data Jared confirmed exists locally there;
  regenerate with `python3 scripts/seo/build-paa.py` if missing —
  ~990 AZ queries, ~$2-3, checkpointed/resumable).
- GSC 28-day pulls: `docs/gsc-reports/2026-05-11-web.json` (+ 04-15 for
  trend). Refresh first if >7 days stale:
  `cd ~/Projects/taqticscom && npx tsx scripts/gsc-pull.ts --client=azlawnow --days=28`
- `data/research/investigation-keyword-extrapolation-2026-05-16.md` —
  the 6-theme, ~140-target, Top-25 map.
- `data/research/serpfox-tracking-2026-05-16.csv` — the 1k monitor list.

---

## Mesowatchorg patterns to mirror (proven playbook)

From `~/Projects/mesowatchorg` commit history + `.claude/skills/
programmatic-seo-remediation/SKILL.md`. Port these patterns (adapt paths;
az-law-now gates are `check:quality:strict`, `check:sources:strict`,
`check:og`, `build` — NOT mesowatchorg's script names):

- **FAQ↔PAA realignment** — single biggest lever. On-page FAQ questions
  rewritten to match real PAA phrasing; answers 40-60 words; deduped
  across the corpus; visible component (not schema-only).
- **GSC as the SERP evidence base** — every realignment decision keys off
  actual impression/position data, not guesses.
- **P0 batch fixes** — schema `@type` + `datePublished`/`dateModified`,
  author tags, duplicate-FAQ guard, headline/meta length.
- **Audit suite** — port the spirit of: `audit-ai-language`,
  `audit-claim-inventory` (every stat traced to a source),
  `audit-internal-links`, `audit-title-meta-ctr`, `check-faq-duplicates`.
- **Sonnet swarms** for the breadth work; Opus leads for net-new content
  + integration judgment.

---

## Workstreams (all 4 — Jared approved full scope)

### A. Evidence base (serial, FIRST, ~20 min)
1. Confirm/refresh GSC (skip if `2026-05-11` ≤7 days old at run time).
2. Confirm PAA data present locally; else run `scripts/seo/build-paa.py`
   (background) and gate B on its completion.
3. Build a per-page target sheet: for every practice-area +
   legal-guide + investigation page, join {primary keyword, top GSC
   queries 28d, top PAA questions, extrapolation-map targets}. Write
   `data/research/per-page-aio-targets-2026-05-16.json`.

### B. FAQ↔PAA realignment (Sonnet swarm, 1 agent per ~6 files)
For every practice-area, legal-guide, and investigation page:
- Replace/extend frontmatter `faqs:` so questions match the **verbatim**
  top PAA phrasings for that page (from A's target sheet), keeping the
  page's real legal substance. 6-10 FAQs/page.
- Answers 40-60 words, contraction-correct, no em/en-dash, ARS-cited
  where the page already establishes the statute.
- Dedup questions across the whole corpus (no two pages competing on the
  same PAA string — assign each to its best-fit page).
- Do NOT touch title/description (already at the ≤60/≤160 Laws-framed
  state from the 05-11 fix — re-verify, don't regress).

### C. Gap content (Opus lead + targeted Sonnet support)
Net-new, each with our proprietary data as the proof spine:
1. **Railroad-crossing accidents** — practice-area page; spine = BNSF
   "AUTO PRECEDED THE GATES" Phoenix Subdivision corpus.
2. **Workers' comp / heat** — practice-area page; spine = 602 Maricopa
   heat deaths + no AZ heat standard + the workers-comp denial-rate piece.
3. **180-day Notice of Claim** — standalone legal-guide; spine = the
   Tempe/ASU pavement claim-clock piece. Cross-link every govt-defendant
   page to it.
4. **Waymo / AV liability** — **net-new investigation** in
   `src/content/investigations/`, our data-journalism voice, weaving the
   2026-05-12 Waymo recall
   (https://www.azcentral.com/story/cars/recalls/2026/05/12/waymo-car-recall/90042845007/)
   into AZ autonomous-vehicle liability (Tempe/Chandler/Phoenix Waymo
   operations, ARS 28-9701 et seq. AV framework, the Uber Tempe 2018
   fatality precedent). PLUS a cross-linked AV-liability section added to
   `practice-areas/rideshare-accidents.mdx`. (Recommended default: "Both"
   — investigation is the ranking asset, the practice section captures
   commercial intent. Override here if Jared says otherwise.)

### D. Technical AIO hygiene (Sonnet swarm + audits)
- Port adapted audits → `scripts/seo/`: claim-inventory (every stat → a
  source line), internal-link graph (orphan + thin interlink fix),
  title-meta-CTR report, FAQ-duplicate guard.
- Fix P0s found: schema `@type`/`datePublished`/`dateModified`, missing
  author tags, internal-link gaps from investigations → money pages,
  semantic-heading structure where prose lacks H2 scaffolding.
- Add a `check:faq-dupes` style gate so realignment can't regress.

---

## HARD GUARDRAILS (non-negotiable — we got burned twice on 05-11)

1. **Every content-touching agent** runs, and only returns green on:
   `npm run check:quality:strict && npm run check:sources:strict && npm run check:og && npm run build`
   No commit on red. The 05-11 break was titles >60 / desc >160 /
   em-dashes / word-count floors — these gates catch all of it.
2. **No `Co-Authored-By` / `🤖` / Anthropic trailers** in any commit.
   `.githooks/commit-msg` hard-blocks it (`core.hooksPath=.githooks`);
   agents must still write clean messages. Commits hit client Slack.
3. **No force-push, no history rewrite, no `git filter-branch`.**
   `git pull --rebase` only. One integration commit per workstream, by
   the lead, after the full gate passes.
4. **Agents work in isolated git worktrees.** Lead integrates serially
   to avoid clobbering (the 05-11 stash/rebase pain).
5. **DataForSEO budget ceiling: $10.** build-paa.py is ~$2-3; nothing
   else should call paid APIs without saying so.
6. Lead re-runs the full gate before every push. Report deploy state
   from Netlify, not just local (`netlify api listSiteDeploys`).

---

## Suggested agent topology

- **Opus Lead 1 — Content & Gaps:** owns A + C. Builds the target sheet,
  writes the 4 net-new pieces, drives a small Sonnet pair for research
  fact-pulls. Integrates C.
- **Opus Lead 2 — Realignment & Hygiene:** owns B + D. Dispatches the
  FAQ↔PAA Sonnet swarm (1 agent / ~6 files, ~14 agents), ports the
  audits, fixes P0s. Integrates B then D.
- Leads coordinate: B+D content edits and C net-new files rarely collide;
  integrate in order A → B → D → C, gate between each, push between each.

## Resume / run command (on Mac Mini)

```bash
cd ~/Projects/az-law-now && git pull --rebase
# 1. evidence base
ls -lt docs/gsc-reports/ | head        # refresh if >7d stale
ls data/research/paa-*.json 2>/dev/null || python3 scripts/seo/build-paa.py
# 2. then: "read docs/sessions/2026-05-16-aio-dialin-plan.md and run the
#    full program" — dispatch the two Opus leads per the topology above.
```

## Open decision (default chosen, override if needed)

- Waymo piece: defaulting to **Both** (net-new investigation +
  rideshare-accidents AV section). Change in Workstream C if undesired.

---

## Done so far (context for the run)

- 05-11: Laws-framing titles+desc (32 pages), component sweep (56 files),
  redirects→`_redirects`, outreach per-send-commit killed, build fixed,
  trailers stripped, commit-msg hook added.
- 05-16: 1k SerpFox list, investigation→keyword extrapolation map,
  `build-paa.py` harvester shipped.
- Provisional Laws-framing re-eval still due 2026-07-11 (60-day data).
