#!/usr/bin/env tsx
/**
 * AZ-PI Claim Inventory — AZ Law Now
 *
 * Scans all MDX files in the 5 content collections (investigations,
 * legal-guides, client-guides, practice-areas, glossary) and extracts
 * every factual claim of the 9 AZ-PI claim types enumerated in
 * BUILD-SPEC.md §D.
 *
 * Claim types:
 *   sol_deadline          — statutes of limitations (ARS 12-542, 12-821.01, etc.)
 *   notice_of_claim       — ARS 12-821.01 notice-of-claim references
 *   ars_citation          — any ARS / A.R.S. citation
 *   verdict_amount        — dollar figure near plaintiff/court/judgment context
 *   adot_stat             — ADOT statistic or data reference
 *   court_case            — case citation ("X v. Y")
 *   insurance_stat        — AZ insurance rates, uninsured/underinsured stats
 *   comparative_fault_pct — comparative-fault percentage (ARS 12-2505)
 *   tribal_jurisdiction   — tribal jurisdiction references
 *
 * Priority scoring: CRITICAL types (sol_deadline, notice_of_claim) score
 * highest. Files with high-risk pattern (verdicts, SOL, notice) score higher.
 *
 * Advisory: always exits 0 (human-review output — never blocks build).
 * Output: data/audits/claim-inventory.json
 *
 * Usage:
 *   npx tsx scripts/audit-claim-inventory.ts             # full scan
 *   npx tsx scripts/audit-claim-inventory.ts --json      # JSON to stdout only
 *   npx tsx scripts/audit-claim-inventory.ts --slug bnsf # filter by slug substring
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const OUT_PATH = path.join(ROOT, 'data/audits/claim-inventory.json');

// ── Arg parsing ──────────────────────────────────────────

const args = process.argv.slice(2);
const JSON_OUT = args.includes('--json');

const SLUG_ARG = args.indexOf('--slug');
const SLUG_FILTER = SLUG_ARG >= 0 ? args[SLUG_ARG + 1] : null;

// ── Collection directories ───────────────────────────────

const CONTENT_DIRS = [
  path.join(ROOT, 'src/content/investigations'),
  path.join(ROOT, 'src/content/legal-guides'),
  path.join(ROOT, 'src/content/client-guides'),
  path.join(ROOT, 'src/content/practice-areas'),
  path.join(ROOT, 'src/content/glossary'),
];

// ── Claim types ──────────────────────────────────────────

type ClaimType =
  | 'sol_deadline'
  | 'notice_of_claim'
  | 'ars_citation'
  | 'verdict_amount'
  | 'adot_stat'
  | 'court_case'
  | 'insurance_stat'
  | 'comparative_fault_pct'
  | 'tribal_jurisdiction';

interface Claim {
  file: string;
  collection: string;
  line: number;
  claim_text: string;
  claim_type: ClaimType;
  priority_score: number;
  reason: string;
}

// ── File walking ─────────────────────────────────────────

function walk(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, acc);
    } else if (entry.name.endsWith('.mdx')) {
      acc.push(full);
    }
  }
  return acc;
}

// ── Frontmatter parser ───────────────────────────────────

function parseFrontmatter(content: string): {
  frontmatter: Record<string, string>;
  body: string;
  bodyStartLine: number;
} {
  const fm: Record<string, string> = {};
  if (!content.startsWith('---')) {
    return { frontmatter: fm, body: content, bodyStartLine: 1 };
  }
  const endIdx = content.indexOf('\n---', 3);
  if (endIdx === -1) {
    return { frontmatter: fm, body: content, bodyStartLine: 1 };
  }
  const fmText = content.slice(3, endIdx);
  const bodyStart = endIdx + 4;
  const bodyStartLine = content.slice(0, bodyStart).split('\n').length;
  for (const rawLine of fmText.split('\n')) {
    const m = rawLine.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (m) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      fm[m[1]] = v;
    }
  }
  return { frontmatter: fm, body: content.slice(bodyStart), bodyStartLine };
}

// ── Collection label ─────────────────────────────────────

function labelCollection(filePath: string): string {
  if (filePath.includes('/investigations/')) return 'investigations';
  if (filePath.includes('/legal-guides/')) return 'legal-guides';
  if (filePath.includes('/client-guides/')) return 'client-guides';
  if (filePath.includes('/practice-areas/')) return 'practice-areas';
  if (filePath.includes('/glossary/')) return 'glossary';
  return 'unknown';
}

// ── Helpers ──────────────────────────────────────────────

function getLineNumber(body: string, charIndex: number, bodyStartLine: number): number {
  let line = bodyStartLine;
  for (let i = 0; i < charIndex; i++) {
    if (body[i] === '\n') line++;
  }
  return line;
}

function truncate(s: string, n = 240): string {
  s = s.replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n) + '...' : s;
}

function getContext(body: string, idx: number, matchLen: number, before = 60, after = 150): string {
  const start = Math.max(0, idx - before);
  const end = Math.min(body.length, idx + matchLen + after);
  return truncate(body.slice(start, end));
}

// ── Regex catalogue ──────────────────────────────────────

// ARS citation: "ARS 12-542", "A.R.S. § 12-821.01", "A.R.S. 12-2505"
const ARS_RE = /\bA\.?R\.?S\.?\s*(?:§\s*)?\d{1,2}-\d{3,4}(?:\.\d+)?\b|\bARS\s+(?:§\s*)?\d{1,2}-\d{3,4}(?:\.\d+)?\b/g;

// SOL deadline: matches ARS 12-542, 12-543, 12-611, 12-612, 12-821.01
// plus any "X-year statute of limitations" / "X years to file" text
const SOL_ARS_RE = /\bA\.?R\.?S\.?\s*(?:§\s*)?12-(?:542|543|611|612|821(?:\.01)?)\b|\bARS\s+(?:§\s*)?12-(?:542|543|611|612|821(?:\.01)?)\b/g;
const SOL_TEXT_RE = /\b(?:two|2|three|3|one|1|four|4)\s*[\-–]?\s*year\s+(?:statute\s+of\s+limitations?|SOL|deadline|time\s+limit|filing\s+deadline|window)\b|\b(?:statute\s+of\s+limitations?|SOL)\s+(?:is|of|expires?|runs?)\s+(?:two|2|three|3|one|1|four|4)\b|\b(?:you\s+have|have\s+only|only\s+have)\s+(?:two|2|three|3|one|1)\s+years?\s+to\s+(?:file|sue|bring|pursue)\b/gi;

// Notice of claim: ARS 12-821.01, "notice of claim", "180-day"
const NOTICE_ARS_RE = /\bA\.?R\.?S\.?\s*(?:§\s*)?12-821(?:\.01)?\b|\bARS\s+(?:§\s*)?12-821(?:\.01)?\b/g;
const NOTICE_TEXT_RE = /\b(?:notice\s+of\s+claim|notice-of-claim|180-day\s+notice|180\s+day\s+notice|file\s+(?:a\s+)?notice\s+(?:of\s+claim\s+)?(?:with|against)\s+(?:the\s+)?(?:city|county|state|municipality|public\s+entity|government))\b/gi;

// Verdict / dollar figure near case context
const DOLLAR_RE = /\$[0-9]+(?:\.[0-9]+)?\s*(?:million|billion|thousand|M\b|B\b|K\b)/gi;
const VERDICT_CONTEXT_RE = /\b(?:verdict|judgment|jury\s+awarded|settlement|damages?\s+of|won|awarded|recovered)\b/i;

// ADOT stat: any sentence containing "ADOT" + a number/percentage, or "Arizona Department of Transportation" + stat
const ADOT_STAT_RE = /\bADOT\b[^.!?\n]{0,200}\b(?:\d+(?:\.\d+)?(?:\s*%|\s*(?:crashes?|fatalities?|deaths?|injuries?|collisions?|incidents?)))\b|\b(?:Arizona\s+Department\s+of\s+Transportation)[^.!?\n]{0,200}\b\d+\b/gi;

// Court case citation: "X v. Y" (capitalized)
const CASE_RE = /\b([A-Z][A-Za-z\-'&. ]{1,40})\s+v\.\s+([A-Z][A-Za-z\-'&. ]{1,40})/g;

// Named AZ court
const AZ_COURT_RE = /\b(?:Maricopa|Pima|Yavapai|Pinal|Coconino|Mohave|Yuma|Navajo|Apache|Graham|Greenlee|La\s+Paz|Santa\s+Cruz)\s+County\s+Superior\s+Court\b|\bArizona\s+Court\s+of\s+Appeals\b|\bArizona\s+Supreme\s+Court\b|\bPhoenix\s+Municipal\s+Court\b|\bTucson\s+City\s+Court\b/gi;

// Insurance stat: uninsured/underinsured rates, AZ min limits
const INSURANCE_STAT_RE = /\b(?:25\/50\/15|UM\/UIM|uninsured\s+(?:motorist|driver|rate)|underinsured\s+(?:motorist|driver)|approximately\s+\d+(?:\.\d+)?\s*%\s+(?:of\s+)?(?:Arizona|AZ)\s+(?:driver|motorist|vehicle)|Arizona\s+minimum\s+(?:coverage|limits?|insurance\s+requirement)|~?\s*1[0-9](?:\.\d+)?\s*%\s+uninsured|\b12(?:\.\d+)?\s*%\s+(?:of\s+)?(?:Arizona|AZ)?\s*(?:drivers?|motorists?))\b/gi;

// Comparative fault %: any percentage + comparative/contributory fault context
const COMP_FAULT_RE = /\b\d{1,3}(?:\.\d+)?\s*%\s+(?:at\s+fault|fault|liable|negligent)\b|\b(?:pure\s+)?comparative\s+(?:fault|negligence)[^.!?\n]{0,100}\b\d{1,3}(?:\.\d+)?\s*%\b|\b\d{1,3}(?:\.\d+)?\s*%\s+comparative\b|\bARS\s+12-2505\b|\bA\.R\.S\.?\s*(?:§\s*)?12-2505\b/gi;

// Tribal jurisdiction
const TRIBAL_RE = /\b(?:Navajo\s+Nation|Tohono\s+O[''']odham|Fort\s+McDowell\s+(?:Yavapai\s+)?Nation|SRPMIC|Salt\s+River\s+Pima[- ]Maricopa|Ak-Chin\s+Indian\s+Community|Gila\s+River\s+Indian\s+Community|Colorado\s+River\s+Indian\s+Tribes?|White\s+Mountain\s+Apache\s+Tribe|Hopi\s+Tribe|tribal\s+(?:jurisdiction|land|court|sovereign|immunity)|sovereign\s+immunity\s+(?:of|on)\s+(?:tribal|reservation))\b/gi;

// ── Scoring ───────────────────────────────────────────────

/**
 * Priority rubric (0-10):
 *   sol_deadline:         base 9 — reader misses filing window (CRITICAL)
 *   notice_of_claim:      base 9 — 180d bar (CRITICAL)
 *   comparative_fault_pct: base 7 — pure vs modified confusion (HIGH)
 *   tribal_jurisdiction:  base 6 — jurisdiction gap (MEDIUM)
 *   verdict_amount:       base 6 — unverified amount (MEDIUM)
 *   ars_citation:         base 5 — citation number error (MEDIUM)
 *   adot_stat:            base 5 — data-year mismatch (MEDIUM)
 *   insurance_stat:       base 5 — wrong rate (MEDIUM)
 *   court_case:           base 4 — low (LOW)
 */
const BASE_SCORES: Record<ClaimType, number> = {
  sol_deadline: 9,
  notice_of_claim: 9,
  comparative_fault_pct: 7,
  tribal_jurisdiction: 6,
  verdict_amount: 6,
  ars_citation: 5,
  adot_stat: 5,
  insurance_stat: 5,
  court_case: 4,
};

function scoreClaim(
  claimType: ClaimType,
  filePath: string,
): { score: number; reason: string } {
  let score = BASE_SCORES[claimType];
  const reasons: string[] = [`base:${score}`];

  // Boost if file is in a high-trust collection
  if (filePath.includes('/legal-guides/') || filePath.includes('/practice-areas/')) {
    score = Math.min(10, score + 1);
    reasons.push('legal-collection:+1');
  }

  // Boost if slug suggests SOL / notice / verdict content
  if (/sol|deadline|statute|notice|claim|verdict|settlement|award/.test(path.basename(filePath))) {
    score = Math.min(10, score + 1);
    reasons.push('high-risk-slug:+1');
  }

  // Glossary entries score lower (definitional, lower fabrication risk)
  if (filePath.includes('/glossary/')) {
    score = Math.max(0, score - 2);
    reasons.push('glossary:-2');
  }

  return { score, reason: reasons.join('; ') };
}

// ── Extraction ────────────────────────────────────────────

interface FileContext {
  relPath: string;
  collection: string;
  body: string;
  bodyStartLine: number;
}

function pushClaim(
  claims: Claim[],
  seen: Set<string>,
  ctx: FileContext,
  idx: number,
  matchLen: number,
  type: ClaimType,
): void {
  const context = getContext(ctx.body, idx, matchLen);
  const line = getLineNumber(ctx.body, idx, ctx.bodyStartLine);
  const { score, reason } = scoreClaim(type, ctx.relPath);
  const key = `${ctx.relPath}::${line}::${type}::${context.slice(0, 60)}`;
  if (seen.has(key)) return;
  seen.add(key);
  claims.push({
    file: ctx.relPath,
    collection: ctx.collection,
    line,
    claim_text: context,
    claim_type: type,
    priority_score: score,
    reason,
  });
}

function extractClaims(absPath: string): Claim[] {
  const relPath = path.relative(ROOT, absPath);
  const collection = labelCollection(absPath);
  const content = fs.readFileSync(absPath, 'utf-8');
  const { body, bodyStartLine } = parseFrontmatter(content);

  // Strip fenced code blocks (keep byte positions with spaces)
  const cleanBody = body.replace(/```[\s\S]*?```/g, (m) => ' '.repeat(m.length));

  const ctx: FileContext = { relPath, collection, body: cleanBody, bodyStartLine };
  const claims: Claim[] = [];
  const seen = new Set<string>();

  // --- sol_deadline (ARS citations first, then textual tells) ---
  for (const m of cleanBody.matchAll(SOL_ARS_RE)) {
    pushClaim(claims, seen, ctx, m.index!, m[0].length, 'sol_deadline');
  }
  // Reset regex state is handled by matchAll
  for (const m of cleanBody.matchAll(SOL_TEXT_RE)) {
    pushClaim(claims, seen, ctx, m.index!, m[0].length, 'sol_deadline');
  }

  // --- notice_of_claim ---
  for (const m of cleanBody.matchAll(NOTICE_ARS_RE)) {
    pushClaim(claims, seen, ctx, m.index!, m[0].length, 'notice_of_claim');
  }
  for (const m of cleanBody.matchAll(NOTICE_TEXT_RE)) {
    // Avoid double-counting matches already captured as sol_deadline via ARS 12-821.01
    pushClaim(claims, seen, ctx, m.index!, m[0].length, 'notice_of_claim');
  }

  // --- ars_citation (all ARS cites not already captured as sol/notice) ---
  for (const m of cleanBody.matchAll(ARS_RE)) {
    pushClaim(claims, seen, ctx, m.index!, m[0].length, 'ars_citation');
  }

  // --- verdict_amount ---
  for (const m of cleanBody.matchAll(DOLLAR_RE)) {
    const context = getContext(cleanBody, m.index!, m[0].length);
    if (VERDICT_CONTEXT_RE.test(context)) {
      pushClaim(claims, seen, ctx, m.index!, m[0].length, 'verdict_amount');
    }
  }

  // --- adot_stat ---
  for (const m of cleanBody.matchAll(ADOT_STAT_RE)) {
    pushClaim(claims, seen, ctx, m.index!, m[0].length, 'adot_stat');
  }

  // --- court_case ---
  for (const m of cleanBody.matchAll(CASE_RE)) {
    pushClaim(claims, seen, ctx, m.index!, m[0].length, 'court_case');
  }
  for (const m of cleanBody.matchAll(AZ_COURT_RE)) {
    pushClaim(claims, seen, ctx, m.index!, m[0].length, 'court_case');
  }

  // --- insurance_stat ---
  for (const m of cleanBody.matchAll(INSURANCE_STAT_RE)) {
    pushClaim(claims, seen, ctx, m.index!, m[0].length, 'insurance_stat');
  }

  // --- comparative_fault_pct ---
  for (const m of cleanBody.matchAll(COMP_FAULT_RE)) {
    pushClaim(claims, seen, ctx, m.index!, m[0].length, 'comparative_fault_pct');
  }

  // --- tribal_jurisdiction ---
  for (const m of cleanBody.matchAll(TRIBAL_RE)) {
    pushClaim(claims, seen, ctx, m.index!, m[0].length, 'tribal_jurisdiction');
  }

  return claims;
}

// ── Main ─────────────────────────────────────────────────

function main() {
  // Collect files
  const mdxFiles: string[] = [];
  for (const dir of CONTENT_DIRS) {
    walk(dir, mdxFiles);
  }

  // --slug filter
  const filtered = SLUG_FILTER
    ? mdxFiles.filter(f => f.includes(SLUG_FILTER))
    : mdxFiles;

  if (SLUG_FILTER && filtered.length === 0) {
    console.error(`No files matched slug filter: "${SLUG_FILTER}"`);
    process.exit(0); // advisory: always exit 0
  }

  const allClaims: Claim[] = [];
  const errors: string[] = [];
  let totalFilesScanned = 0;

  const perFile = new Map<string, {
    claim_count: number;
    max_priority: number;
    sum_priority: number;
  }>();

  for (const absPath of filtered) {
    const relPath = path.relative(ROOT, absPath);
    try {
      const claims = extractClaims(absPath);
      totalFilesScanned++;
      for (const c of claims) {
        allClaims.push(c);
        const agg = perFile.get(c.file) || { claim_count: 0, max_priority: 0, sum_priority: 0 };
        agg.claim_count++;
        agg.sum_priority += c.priority_score;
        if (c.priority_score > agg.max_priority) agg.max_priority = c.priority_score;
        perFile.set(c.file, agg);
      }
      if (!perFile.has(relPath)) {
        perFile.set(relPath, { claim_count: 0, max_priority: 0, sum_priority: 0 });
      }
    } catch (e) {
      errors.push(`${relPath}: ${(e as Error).message}`);
    }
  }

  // Summaries
  const byType: Record<string, number> = {};
  const byPriority: Record<string, number> = { 'CRITICAL(9-10)': 0, 'HIGH(7-8)': 0, 'MEDIUM(5-6)': 0, 'LOW(0-4)': 0 };

  for (const c of allClaims) {
    byType[c.claim_type] = (byType[c.claim_type] || 0) + 1;
    if (c.priority_score >= 9) byPriority['CRITICAL(9-10)']++;
    else if (c.priority_score >= 7) byPriority['HIGH(7-8)']++;
    else if (c.priority_score >= 5) byPriority['MEDIUM(5-6)']++;
    else byPriority['LOW(0-4)']++;
  }

  // Top 50 files by weighted priority (claim_count * avg_priority)
  const topFiles = [...perFile.entries()]
    .filter(([, v]) => v.claim_count > 0)
    .map(([file, v]) => ({
      file,
      claim_count: v.claim_count,
      max_priority: v.max_priority,
      avg_priority: v.sum_priority / v.claim_count,
      weighted: v.claim_count * (v.sum_priority / v.claim_count),
    }))
    .sort((a, b) => b.weighted - a.weighted)
    .slice(0, 50)
    .map(({ file, claim_count, max_priority, avg_priority }) => ({
      file,
      claim_count,
      max_priority,
      avg_priority: Math.round(avg_priority * 10) / 10,
    }));

  const out = {
    generated_at: new Date().toISOString(),
    total_files_scanned: totalFilesScanned,
    total_claims: allClaims.length,
    by_type: byType,
    by_priority: byPriority,
    top_priority_files: topFiles,
    claims: allClaims,
    errors,
  };

  if (JSON_OUT) {
    process.stdout.write(JSON.stringify(out, null, 2));
    // Advisory: always exit 0
    return;
  }

  // Ensure output dir exists
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));

  // Console summary
  console.log('='.repeat(72));
  console.log('AZ-PI CLAIM INVENTORY SUMMARY — AZ Law Now');
  console.log('='.repeat(72));
  console.log(`Generated:          ${out.generated_at}`);
  console.log(`Files scanned:      ${out.total_files_scanned}`);
  console.log(`Total claims:       ${out.total_claims}`);
  console.log('');
  console.log('By type:');
  for (const [t, n] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t.padEnd(26)} ${n}`);
  }
  console.log('');
  console.log('By priority bucket:');
  for (const [b, n] of Object.entries(byPriority)) {
    console.log(`  ${b.padEnd(18)} ${n}`);
  }
  console.log('');
  console.log('TOP 20 FILES BY WEIGHTED PRIORITY (human-review queue):');
  console.log('-'.repeat(72));
  for (const f of topFiles.slice(0, 20)) {
    console.log(
      `  [max:${String(f.max_priority).padStart(2)} avg:${String(f.avg_priority).padStart(4)}] ` +
      `${String(f.claim_count).padStart(3)} claims  ${f.file}`,
    );
  }

  if (errors.length) {
    console.log('');
    console.log('ERRORS:');
    for (const e of errors) console.log(`  ${e}`);
  }

  console.log('');
  console.log(`Wrote: ${path.relative(ROOT, OUT_PATH)}`);
  // Advisory: always exit 0
}

main();
