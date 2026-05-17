# package.json scripts patch

Copy-paste this JSON snippet and merge the keys into the existing `"scripts"` object in `package.json`. Do NOT replace the whole object — append these entries alongside the existing ones.

```json
{
  "check:ai-patterns":       "npx tsx scripts/audit-ai-patterns.ts",
  "check:ai-patterns:strict":"npx tsx scripts/audit-ai-patterns.ts --strict",
  "check:claims":            "npx tsx scripts/audit-claim-inventory.ts",
  "check:serp":              "npx tsx scripts/check-serp-competition.ts --client azlawnow",
  "check:programmatic":      "npx tsx scripts/check-programmatic-value.ts",
  "check:programmatic:strict":"npx tsx scripts/check-programmatic-value.ts --strict",
  "check:meta":              "npx tsx ../taqticscom/scripts/audit-meta.ts --suffix '| AZ Law Now'",
  "qa":                      "npx tsx scripts/qa-full-audit.ts",
  "qa:strict":               "npx tsx scripts/qa-full-audit.ts --strict"
}
```

## Notes

- `check:claims` is **advisory only** — never add to the Netlify build chain.
- `check:serp` requires `DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD` in `.env`. Run manually, not in CI.
- `check:meta` wires the hub script (`../taqticscom`). Confirm the relative path matches your monorepo layout before running.
- `check:ai-patterns` starts advisory; promote to `check:ai-patterns:strict` in Netlify after two clean cycles.
- `check:programmatic` is advisory by default; `check:programmatic:strict` for gating once baseline is clean.
- Netlify chain target (from BUILD-SPEC §D, after debt cleared):
  ```
  check:quality:strict && check:sources:strict && check:ai-patterns && check:og && build && check:schema
  ```
  Add `check:programmatic:strict` after programmatic baseline is clean (separate PR).
