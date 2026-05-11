# Proposed 301 Redirects — 2026-05-10

Source: `data/research/content-plan-2026-05-10.json`
Existing redirects in `netlify.toml`: **329** (skipped)

Review each row. When ready, copy the TOML block from
`data/research/proposed-redirects-2026-05-10.toml` into `netlify.toml` at the bottom
of the `[[redirects]]` section, commit, deploy.

| # | Vol | Pos | Query | From → To | Status |
|---:|---:|---:|---|---|---|
| 1 | 590 | 9 | dog bite settlement calculator | `/dog-bite-settlement-calculator/` → `/dog-bite/` | _already in netlify.toml_ |
| 2 | 260 | 19 | level 3 dog bite settlement amount | `/level-3-dog-bite-settlement-amounts-in-arizona-az-law-now/` → `/dog-bite/` | _already in netlify.toml_ |
| 3 | 260 | 16 | million dollar slip and fall settlements | `/million-dollar-slip-fall-settlements/` → `/slip-and-fall/` | _already in netlify.toml_ |
| 4 | 50 | 17 | negligence premises liability | `/premises-liability-vs-negligence/` → `/premises-liability/` | _already in netlify.toml_ |
| 5 | 40 | 27 | ars 46-454 | `/premises-liability/failure-to-report-abuse/` → `/glossary/ars-46-454/` | _already in netlify.toml_ |
| 6 | 40 | 15 | can i sue daycare for negligence | `/suing-daycare-for-negligence/` → `/investigations/coolidge-daycare-19-families-lawsuit/` | _already in netlify.toml_ |
| 7 | 30 | 23 | how to sue a restaurant for negligence | `/lawyer-sue-fast-food/` → `/legal-guides/suing-a-restaurant-in-arizona/` | _already in netlify.toml_ |
| 8 | 30 | 4 | suing a daycare for negligence | `/suing-daycare-for-negligence/` → `/daycare-negligence/` | _already in netlify.toml_ |
| 9 | 20 | 22 | how to sue a daycare for negligence | `/sue-daycare-for-negligence/` → `/investigations/coolidge-daycare-19-families-lawsuit/` | _already in netlify.toml_ |

**Generated 0 new redirects; 9 already present.**

## How to apply

```bash
# Review the proposed block
cat data/research/proposed-redirects-2026-05-10.toml

# Append to netlify.toml (after manual review)
cat data/research/proposed-redirects-2026-05-10.toml >> netlify.toml

# Commit + deploy
git add netlify.toml
git commit -m "Add 0 301-merges for legacy flat-slug URLs"
git push
```

After deploy, re-run `gsc-pull.ts` in 14 days to confirm impressions
moved to the canonical URLs.