# AZ Law Now — SEO Framing Decisions

> Source-of-truth for editorial + SEO framing decisions. Every script, agent, and
> human editor should read this before proposing titles, metas, or H1s. Updates
> to this file get versioned with `docs/seo-framing-decisions-{date}.md` snapshots.

---

## Decision 2026-05-11 — "Laws" not "Lawyer" in titles

**The decision.** Practice-area and legal-guide page titles use the pattern
`Arizona [Topic] Laws: ...` instead of `Arizona [Topic] Lawyer | ...` or
`Arizona [Topic] Attorneys | ...`.

### Evidence (GSC last 28d, pulled 2026-05-11)

| Query type | Query count | Impressions | Clicks | CTR |
|---|---:|---:|---:|---:|
| "law" / "laws" queries | 357 | 5,203 | **34** | **0.65%** |
| "lawyer" / "attorney" queries | 1,273 | 41,791 | 21 | 0.05% |

**Laws CTR is 13× higher than Lawyer CTR.** The same site, the same authority,
the same content — the difference is **the SERP environment for each query type**.

### Why

1. **SERP environment.** SERP audit on 10 head-term "lawyer" queries
   (`data/research/serp-audit-2026-05-10.md`) showed Local Pack on 10/10 SERPs
   above our organic listing. The 3-pack steals the click on commercial queries.
   Informational "laws" SERPs don't have Local Pack — users are reading, not
   hiring yet.
2. **Brand fit.** AZ Law Now → "Arizona [X] Laws" reads as a literal extension
   of the domain. Every competitor (Lerner & Rowe, Phillips Law Group, Lamber
   Goodnow) is "Lawyer/Attorney." We own a different lane.
3. **Funnel value.** Users searching "arizona bus accident laws" are
   pre-purchase / info-seeking. They convert later but qualified. The bottom of
   the funnel can be captured via the page itself — top of the page H1 + the
   intake Callout at the bottom.
4. **DFS confirms.** Of 253 ranking terms, 44 contain "law/laws" vs. 25 contain
   "lawyer/attorney." We're already ranking better on Laws queries.

### Title pattern (use this template)

```
Arizona [Topic] Laws: [Specific Hook] + [Optional Modifier]
```

Examples:
- `Arizona Bus Accident Laws: Claims, Deadlines + Government Immunity`
- `Arizona Car Accident Laws: Fault, Deadlines + Comparative Negligence`
- `Arizona Hit-and-Run Laws: ARS 28-661 Through 28-665 Explained`

**Do NOT** end every title with `| AZ Law Now`. Google often truncates suffixes
and the brand is in the URL bar anyway. Save the characters for hooks.

### Meta description pattern

```
Arizona [Topic] laws explained: [primary value]. ARS [X] [what it does]; ARS
[Y] [what it does]. [Distinctive proof point]. Statewide intake (602) 654-0202.
```

Examples:
- `Arizona bus accident laws explained: school bus, public transit, and commercial bus crashes. ARS 12-821.01 sets a 180-day notice deadline against government entities; ARS 12-820 governs immunity. $800K precedent in school-bus emotional trauma. Statewide intake (602) 654-0202.`

### Where this DOES apply

- `src/content/practice-areas/*.mdx` — all 17 pages
- `src/content/legal-guides/*.mdx` — all 15 pages
- `src/pages/<practice-area>.astro` — title meta tags on the page itself
- City pages (`/phoenix/`, `/mesa/`, etc.) — adapt to `Arizona [Topic] Laws in [City]`

### Where this DOES NOT apply

- **Investigations** keep their narrative titles (`"Arizona Pedestrian Deaths: 2× National Average"`).
  Investigations target news/discovery, not legal explainer SERPs.
- **Client-guides** keep their second-person action titles (`"Your First 48 Hours After an Arizona Car Crash"`).
  Client-guides target navigational intent, where action verbs win.
- **Glossary** entries keep their term-as-title (`"Statute of Limitations"`).
  Glossary serves snippet inclusion + sidebar references.
- **Home page + city pages** — TBD; SERP audit recommended before rewrites.

### How to verify a title proposal

Before applying a new title to any page, the script
`scripts/seo/audit-pages.py` shows the actual GSC queries firing the page in
the last 28 days. The new title should contain phrases that match the
**top 3 highest-impression queries** for that page. If the proposed title
doesn't include any of the top queries, the proposal is bad — regenerate.

### Loop

This decision is **provisional pending 60-day data**. Re-run on 2026-07-11:
1. Pull fresh GSC, re-compute Laws-vs-Lawyer CTR
2. If Laws CTR stays > Lawyer CTR, lock the pattern in permanently
3. If Laws CTR collapses below Lawyer CTR, revert and document why

---

## Related artifacts

- `data/research/keyword-universe.json` — universe of every query DFS + GSC see
- `data/research/serp-audit-2026-05-10.md` — proof of Local Pack click-stealing
- `data/research/content-plan-2026-05-10.md` — full priority queue
- `scripts/seo/audit-pages.py` — page-by-page rewrite proposals (next)
- `scripts/seo/build-keyword-universe.py` + `ingest-gsc.py` — data refresh loop
