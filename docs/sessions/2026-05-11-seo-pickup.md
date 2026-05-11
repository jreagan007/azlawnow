# AZ Law Now — Where to Pick Back Up (2026-05-11)

> Last working session: SEO keyword universe + GSC ingest + component sweep.
> Next session: open this file first.

---

## What's done

### Scripts shipped to `scripts/seo/`
| Script | Purpose | Run when |
|---|---|---|
| `build-keyword-universe.py` | Pulls DataForSEO ranked_keywords for azlawnow + lernerandrowe; classifies intent/cluster/collection/gap_type/priority | Weekly |
| `ingest-gsc.py` | Layers GSC 28-day clicks/impressions onto the universe; adds `impression_loser` + `gsc_only` gap types | After every GSC pull |
| `cannibalization-scan.py` | Flags queries where 2+ of our pages topically overlap (structural) + 301-merge candidates | Weekly |
| `ia-coverage-map.py` | Owning / partial / uncovered status for every IA page; surfaces orphan URLs | Weekly |
| `plan-content.py` | Synthesizes everything into a ranked publish/update/redirect queue | Weekly |
| `audit-pages.py` | Per-page audit: current title/desc vs proposed (Laws framing) + top GSC queries | After title/desc changes |
| `build-redirects.py` | Emits ready-to-paste netlify redirect block from content-plan | Ad-hoc |
| `check-orphans.py` | curl-HEADs orphan URLs; tags 200/301/404 | Ad-hoc |
| `serp-audit.py` | DFS SERP feature check (Local Pack, AI Overview, etc.) on impression-losers | Ad-hoc |
| `toml-to-redirects.py` | **NOT YET RUN.** Converts netlify.toml [[redirects]] → public/_redirects | Once |

### Decisions saved (permanent, version-controlled)
- **`docs/seo-framing-decisions.md`** — "Laws not Lawyer" framing, evidence (13× CTR), title pattern, where it applies / doesn't
- Memory: `project_seo-laws-framing.md` (autoloads in future Claude sessions)

### Data artifacts in `data/research/` (all dated 2026-05-10 or -11)
| File | What it contains |
|---|---|
| `keyword-universe.json` + `.csv` | **THE** canonical 3,869-row keyword universe (DFS + GSC merged) |
| `keyword-universe-{date}.json` | Daily snapshot for trend |
| `_raw/dfs-ranked-{date}.json` | Raw DataForSEO responses |
| `_raw/serp-audit-{date}.json` | Raw SERP feature data |
| `cannibalization-2026-05-10.md` | 33 structural overlaps + 16 legacy 301-merges (all already in netlify.toml) |
| `ia-coverage-2026-05-10.md` | Per-page coverage status + 53 orphan URLs (88% redirecting correctly) |
| `content-plan-2026-05-10.md` + `.json` | Ranked publish queue (now ~26 fix-snippet + 24 update + 16 301-merge) |
| `serp-audit-2026-05-10.md` | **Key finding:** Local Pack on 10/10 head-term SERPs; AI Overview on 0/10 |
| `proposed-redirects-2026-05-10.toml` | 0 new (9 already present) |
| `orphan-triage-2026-05-10.md` | 88 orphans: 83 already 301'ing, 5 actual live pages |
| `page-audit-2026-05-11.md` + `.json` | 160 pages audited; 24 title + 30 description changes proposed |
| `component-sweep-2026-05-11.md` | 85 malformed-markup findings across 31 files (74 tables → DataTable, 5 prose-stat → StatGrid, 4 numbered lists → Timeline, 2 blockquotes → Callout/Quote) |
| `azlawnow-rankings-2026-05-11.csv` | All 253 DFS-tracked terms with GSC + competitor joins (also on Desktop) |

### GSC plumbing
- Service-account impersonation (`taqtics-ops@taqtics-ops.iam.gserviceaccount.com`)
- Set up in taqticscom repo: `~/Projects/taqticscom/scripts/gsc-pull.ts`
- ADC token refreshed today; lasts ~7 days before next `gcloud auth application-default login`
- Run: `cd ~/Projects/taqticscom && npx tsx scripts/gsc-pull.ts --client=azlawnow --days=28`

### Edits already committed-pending in working tree
- `src/content/practice-areas/bus-accidents.mdx` — title rewritten to Laws framing + markdown table → `<DataTable>` + `updatedAt` bumped to 2026-05-11

---

## What's NOT done (pickup list)

### Immediate (highest leverage, lowest effort)

1. **Decide on TOML → _redirects split.** Run `python3 scripts/seo/toml-to-redirects.py` to convert 329 redirects from `netlify.toml` (42KB) → `public/_redirects` (~44KB plain text, faster parse). Dry-run already verified clean conversion. Will shrink netlify.toml from 42662 → 1054 bytes.

2. **Top-10 page rewrites (Laws framing).** Hand-write polished titles for the 10 highest-impression pages (auto-titles from `audit-pages.py` are mediocre). Already done: `/bus-accidents/`. Queue:
   - `/elder-abuse/` — 721 impr
   - `/legal-guides/arizona-car-accident-law/` — 716 impr
   - `/legal-guides/arizona-hit-and-run-law/` — 701 impr
   - `/legal-guides/arizona-motorcycle-law/` — 667 impr
   - `/child-abuse/` — 478 impr
   - `/motorcycle-accidents/` — 444 impr
   - `/slip-and-fall/` — 208 impr
   - `/medical-negligence/` — 187 impr
   - `/legal-guides/arizona-uninsured-motorist-law/` — 158 impr
   - `/wrongful-death/` — 142 impr

3. **Component sweep — apply the 85 fixes from `component-sweep-2026-05-11.md`.** Same pattern as the bus-accidents proof of concept. Recommend dispatching another Sonnet swarm: 1 agent per file (~30 files), each given the file + components list, performs the conversion + commits. ~30 mins parallel runtime.

### Medium-term

4. **Orphan triage decision** — the 5 actually-live orphans (`/about/`, `/contact/`, `/glossary/`, `/legal-guides/`, `/reviews/`) all look correct as-is. Confirm they're meant to stay; no action expected.

5. **`/locations/maricopa-injury-lawyer/`** — pos 1 with ~4,400 impressions/month, 3 clicks. Legacy URL. Currently 301'd to `/maricopa/`. Worth checking that the new `/maricopa/` page is doing the page-title + Laws-framing equivalent of what's working on the legacy URL.

6. **GBP optimization** — SERP audit proved Local Pack steals all "lawyer" head-term clicks. Out-of-scope for code; needs marketing-ops decision on whether to invest in GBP / Local Services Ads.

### Maintenance

7. **Weekly cron** — wrap the 5 core scripts in `scripts/seo/run-weekly.sh`:
   ```bash
   #!/bin/bash
   cd ~/Projects/az-law-now
   python3 scripts/seo/build-keyword-universe.py
   (cd ~/Projects/taqticscom && npx tsx scripts/gsc-pull.ts --client=azlawnow --days=28)
   python3 scripts/seo/ingest-gsc.py
   python3 scripts/seo/cannibalization-scan.py
   python3 scripts/seo/ia-coverage-map.py
   python3 scripts/seo/plan-content.py
   python3 scripts/seo/audit-pages.py
   ```
   Run weekly. Each script writes a dated snapshot → trend automatic.

8. **Re-evaluate "Laws" framing on 2026-07-11** — provisional pending 60-day data per `docs/seo-framing-decisions.md`.

---

## Open questions for next session

- Run the TOML → _redirects conversion? (✓ recommended)
- Dispatch Sonnet swarm to apply the 85 component fixes? (✓ recommended)
- Hand-write the 10 top-priority title rewrites, or run a Sonnet swarm for those too?
- Should `scripts/seo/run-weekly.sh` actually be wired into launchd or just docs?

---

## Resume command

When VSCode comes back, in this directory:

```bash
# Refresh the data
python3 scripts/seo/build-keyword-universe.py
(cd ~/Projects/taqticscom && npx tsx scripts/gsc-pull.ts --client=azlawnow --days=28)
python3 scripts/seo/ingest-gsc.py
python3 scripts/seo/plan-content.py
python3 scripts/seo/audit-pages.py

# Then open this file + the latest page-audit and pick next move
open docs/sessions/2026-05-11-seo-pickup.md
open data/research/page-audit-2026-05-11.md
```

Or just tell Claude "read `docs/sessions/2026-05-11-seo-pickup.md` and continue" — the framing decision auto-loads from memory.
