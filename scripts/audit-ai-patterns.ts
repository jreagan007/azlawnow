#!/usr/bin/env tsx
/**
 * AI-Pattern Diagnostic — AZ Law Now
 *
 * Orchestrates ai-pattern-rules.ts across all 5 content collections
 * (investigations, legal-guides, client-guides, practice-areas, glossary)
 * plus src/pages/**\/*.astro. Uses walk() dir traversal (not glob package).
 *
 * Usage:
 *   npx tsx scripts/audit-ai-patterns.ts               # full report
 *   npx tsx scripts/audit-ai-patterns.ts --top 30      # top 30 worst files
 *   npx tsx scripts/audit-ai-patterns.ts --json        # machine-readable stdout
 *   npx tsx scripts/audit-ai-patterns.ts --file PATH   # single file (relative or absolute)
 *   npx tsx scripts/audit-ai-patterns.ts --slug bnsf-corridor  # match by slug substring
 *   npx tsx scripts/audit-ai-patterns.ts --strict      # exit 2 on any findings
 *   npx tsx scripts/audit-ai-patterns.ts --fix         # en-dash sweep + updatedAt bump
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'fs';
import { join, relative, extname } from 'path';
import {
  validatePhrases,
  validateStructure,
  validateSpecificity,
  type Issue,
} from './lib/ai-pattern-rules.js';

const ROOT = process.cwd();

// ── Arg parsing ─────────────────────────────────────────

const args = process.argv.slice(2);

const topArg = args.indexOf('--top');
const TOP = topArg >= 0 ? parseInt(args[topArg + 1], 10) || 0 : 0;

const JSON_OUT = args.includes('--json');
const STRICT = args.includes('--strict');
const FIX = args.includes('--fix');

const FILE_ARG = args.indexOf('--file');
const SINGLE_FILE = FILE_ARG >= 0 ? args[FILE_ARG + 1] : null;

const SLUG_ARG = args.indexOf('--slug');
const SLUG_FILTER = SLUG_ARG >= 0 ? args[SLUG_ARG + 1] : null;

// ── Paths ────────────────────────────────────────────────

const CONTENT_DIRS = [
  join(ROOT, 'src/content/investigations'),
  join(ROOT, 'src/content/legal-guides'),
  join(ROOT, 'src/content/client-guides'),
  join(ROOT, 'src/content/practice-areas'),
  join(ROOT, 'src/content/glossary'),
];

const PAGES_DIR = join(ROOT, 'src/pages');

const EXCLUDE_PAGES = /\/(?:404|thank-you|sitemap|contact|privacy|terms|disclaimer|methodology|index)\.(astro|mdx)$/;

const OUT_PATH = join(ROOT, 'data/audits/ai-patterns-diagnostic.json');

// ── Types ────────────────────────────────────────────────

interface FileReport {
  path: string;
  collection: string;
  issues: Issue[];
  counts: {
    forbiddenPhrase: number;
    azPiPhraseTell: number;
    enDash: number;
    structural: number;
    specificity: number;
    total: number;
  };
  score: number; // higher = worse
}

// ── Walk (no glob package) ───────────────────────────────

function walk(dir: string, exts: string[], files: string[] = []): string[] {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, exts, files);
    else if (exts.includes(extname(entry))) files.push(p);
  }
  return files;
}

// ── Content stripping ────────────────────────────────────

function stripFrontmatter(content: string): string {
  if (content.startsWith('---')) {
    const end = content.indexOf('\n---', 3);
    if (end > 0) return content.slice(end + 4);
  }
  return content;
}

function stripCodeRegions(content: string): string {
  content = content.replace(/^---[\s\S]*?^---/m, '');
  content = content.replace(/^import\s+[^\n;]+;?\s*$/gm, '');
  content = content.replace(/```[\s\S]*?```/g, '');
  content = content.replace(/`[^`\n]+`/g, '');
  return content;
}

// ── Collection labelling ─────────────────────────────────

function labelCollection(filePath: string): string {
  if (filePath.includes('/investigations/')) return 'investigations';
  if (filePath.includes('/legal-guides/')) return 'legal-guides';
  if (filePath.includes('/client-guides/')) return 'client-guides';
  if (filePath.includes('/practice-areas/')) return 'practice-areas';
  if (filePath.includes('/glossary/')) return 'glossary';
  if (filePath.includes('/src/pages/')) return 'pages';
  return 'unknown';
}

// ── --fix helpers ────────────────────────────────────────

/**
 * Mechanical en-dash → hyphen sweep. Skips frontmatter and code blocks.
 */
function mechanicalFix(content: string): { newContent: string; changes: number } {
  let changes = 0;
  let i = 0;
  let out = '';

  const frontmatterEnd = content.startsWith('---') ? content.indexOf('\n---', 3) + 4 : 0;
  if (frontmatterEnd > 0) {
    out += content.slice(0, frontmatterEnd);
    i = frontmatterEnd;
  }

  while (i < content.length) {
    if (content.slice(i, i + 3) === '```') {
      const end = content.indexOf('```', i + 3);
      if (end === -1) { out += content.slice(i); break; }
      out += content.slice(i, end + 3);
      i = end + 3;
      continue;
    }
    if (content[i] === '`') {
      const end = content.indexOf('`', i + 1);
      if (end === -1) { out += content.slice(i); break; }
      out += content.slice(i, end + 1);
      i = end + 1;
      continue;
    }
    if (content.charCodeAt(i) === 0x2013) { // en-dash
      out += '-';
      changes++;
      i++;
      continue;
    }
    out += content[i];
    i++;
  }

  return { newContent: out, changes };
}

/**
 * Bump the updatedAt frontmatter field to today.
 */
function bumpUpdatedAt(content: string): string {
  const today = new Date().toISOString().slice(0, 10);
  if (!content.startsWith('---')) return content;
  const fmEnd = content.indexOf('\n---', 3);
  if (fmEnd < 0) return content;

  const frontmatter = content.slice(0, fmEnd + 4);
  const rest = content.slice(fmEnd + 4);

  if (/updatedAt\s*:/.test(frontmatter)) {
    const updated = frontmatter.replace(
      /(updatedAt\s*:\s*['"]?)[^\n'"]+(['"]?)/,
      `$1${today}$2`,
    );
    return updated + rest;
  }

  const insertAt = frontmatter.lastIndexOf('\n---');
  return (
    frontmatter.slice(0, insertAt) +
    `\nupdatedAt: '${today}'` +
    frontmatter.slice(insertAt) +
    rest
  );
}

// ── Audit one file ────────────────────────────────────────

function auditFile(filePath: string): FileReport {
  const raw = readFileSync(filePath, 'utf-8');
  const prose = stripCodeRegions(stripFrontmatter(raw));

  const issues: Issue[] = [];

  // Phrase + AZ-PI tells + en-dash on prose
  issues.push(...validatePhrases(prose));

  // Structural on raw (needs full HTML + MDX context)
  issues.push(...validateStructure(raw));

  // Specificity on raw (names/numbers may be in frontmatter or FAQs)
  const specIssue = validateSpecificity(filePath, raw);
  if (specIssue) issues.push(specIssue);

  const counts = {
    forbiddenPhrase: issues.filter(i => i.type === 'forbidden-phrase').length,
    azPiPhraseTell: issues.filter(i => i.type === 'az-pi-phrase-tell').length,
    enDash: issues.filter(i => i.type === 'en-dash').length,
    structural: issues.filter(i => i.type.startsWith('ai-')).length,
    specificity: issues.filter(i => i.type === 'missing-specificity').length,
    total: issues.length,
  };

  // Weighted score: structural patterns carry most weight (Ahrefs correlation),
  // AZ-PI voice tells next (ER/voice-rules violations), specificity gap next,
  // generic phrases last.
  const score =
    counts.structural * 10 +
    counts.azPiPhraseTell * 8 +
    counts.specificity * 6 +
    counts.forbiddenPhrase * 2 +
    counts.enDash * 0.5;

  return {
    path: relative(ROOT, filePath),
    collection: labelCollection(filePath),
    issues,
    counts,
    score,
  };
}

// ── Reporting helpers ────────────────────────────────────

function groupIssues(issues: Issue[]): Record<string, Issue[]> {
  const out: Record<string, Issue[]> = {};
  for (const i of issues) {
    (out[i.type] ||= []).push(i);
  }
  return out;
}

function summarize(reports: FileReport[]) {
  const total = reports.length;
  const withIssues = reports.filter(r => r.counts.total > 0).length;
  const clean = total - withIssues;

  const byType = {
    structural: reports.reduce((s, r) => s + r.counts.structural, 0),
    azPiPhraseTell: reports.reduce((s, r) => s + r.counts.azPiPhraseTell, 0),
    specificity: reports.reduce((s, r) => s + r.counts.specificity, 0),
    forbiddenPhrase: reports.reduce((s, r) => s + r.counts.forbiddenPhrase, 0),
    enDash: reports.reduce((s, r) => s + r.counts.enDash, 0),
  };

  const high = reports.filter(r => r.score >= 20).length;
  const mid = reports.filter(r => r.score >= 8 && r.score < 20).length;
  const low = reports.filter(r => r.score > 0 && r.score < 8).length;

  return { total, withIssues, clean, byType, high, mid, low };
}

function pct(n: number, total: number): string {
  if (!total) return '0%';
  return `${((n / total) * 100).toFixed(1)}%`;
}

function printSummary(s: ReturnType<typeof summarize>, total: number) {
  console.log('='.repeat(60));
  console.log('AI-PATTERN DIAGNOSTIC — AZ Law Now');
  console.log('='.repeat(60));
  console.log(`Files audited:       ${total}`);
  console.log(`Clean:               ${s.clean}`);
  console.log(`With issues:         ${s.withIssues}  (${pct(s.withIssues, total)})`);
  console.log('');
  console.log('Severity buckets:');
  console.log(`  High   (≥20):      ${s.high}`);
  console.log(`  Medium (8–19):     ${s.mid}`);
  console.log(`  Low    (1–7):      ${s.low}`);
  console.log('');
  console.log('Issue totals:');
  console.log(`  Structural AI patterns:  ${s.byType.structural}`);
  console.log(`  AZ-PI phrase tells:      ${s.byType.azPiPhraseTell}`);
  console.log(`  Missing AZ specificity:  ${s.byType.specificity}`);
  console.log(`  Forbidden phrases:       ${s.byType.forbiddenPhrase}`);
  console.log(`  En-dashes:               ${s.byType.enDash}`);
}

// ── Main ─────────────────────────────────────────────────

async function main() {
  let targets: string[];

  if (SINGLE_FILE) {
    const abs = SINGLE_FILE.startsWith('/') ? SINGLE_FILE : join(ROOT, SINGLE_FILE);
    targets = [abs];
  } else {
    // Walk content collections
    const contentFiles: string[] = [];
    for (const dir of CONTENT_DIRS) {
      walk(dir, ['.mdx'], contentFiles);
    }

    // Walk pages
    const pageFiles = walk(PAGES_DIR, ['.astro', '.mdx']);

    targets = [
      ...contentFiles,
      ...pageFiles.filter(t => !EXCLUDE_PAGES.test(t)),
    ];
  }

  // --slug filter
  if (SLUG_FILTER) {
    targets = targets.filter(t => t.includes(SLUG_FILTER));
    if (targets.length === 0) {
      console.error(`No files matched slug filter: "${SLUG_FILTER}"`);
      process.exit(1);
    }
  }

  const reports: FileReport[] = [];
  for (const file of targets) {
    try {
      reports.push(auditFile(file));
    } catch (e) {
      process.stderr.write(`Failed ${file}: ${(e as Error).message}\n`);
    }
  }

  reports.sort((a, b) => b.score - a.score);

  // --fix: en-dash sweep + updatedAt bump on touched .mdx files
  if (FIX) {
    let touched = 0;
    let enDashesFixed = 0;
    for (const r of reports) {
      if (r.counts.enDash === 0) continue;
      const absPath = join(ROOT, r.path);
      const original = readFileSync(absPath, 'utf-8');
      const { newContent, changes } = mechanicalFix(original);
      if (changes === 0) continue;
      const final = absPath.endsWith('.mdx') ? bumpUpdatedAt(newContent) : newContent;
      writeFileSync(absPath, final);
      touched++;
      enDashesFixed += changes;
    }
    console.log(`--fix complete: ${enDashesFixed} en-dashes replaced across ${touched} files`);
    console.log('Re-running audit to verify...\n');

    const after: FileReport[] = [];
    for (const file of targets) {
      try { after.push(auditFile(file)); } catch {}
    }
    after.sort((a, b) => b.score - a.score);
    const remaining = after.reduce((s, r) => s + r.counts.enDash, 0);
    console.log(`Post-fix en-dash count: ${remaining} (was ${reports.reduce((s, r) => s + r.counts.enDash, 0)})`);
    return;
  }

  if (JSON_OUT) {
    process.stdout.write(JSON.stringify({ reports, summary: summarize(reports) }, null, 2));
    return;
  }

  const summary = summarize(reports);
  printSummary(summary, reports.length);

  const toShow = TOP > 0 ? reports.slice(0, TOP) : reports.filter(r => r.counts.total > 0);

  if (toShow.length === 0) {
    console.log('\nNo issues found.');
    return;
  }

  console.log(`\n=== ${TOP > 0 ? `Top ${TOP}` : 'All flagged'} files (sorted by severity score) ===\n`);
  for (const r of toShow) {
    if (r.counts.total === 0) continue;
    console.log(`\n${r.path}  [${r.collection}]  [score: ${r.score.toFixed(1)}]`);
    console.log(
      `  structural: ${r.counts.structural}  az-pi-tells: ${r.counts.azPiPhraseTell}  ` +
      `specificity: ${r.counts.specificity}  phrases: ${r.counts.forbiddenPhrase}  en-dash: ${r.counts.enDash}`,
    );
    const grouped = groupIssues(r.issues);
    for (const [type, items] of Object.entries(grouped)) {
      console.log(`  • ${type} (${items.length}):`);
      const sample = items.slice(0, 3);
      for (const it of sample) {
        const loc = it.line ? `L${it.line}` : '';
        console.log(`      ${loc} "${it.match.slice(0, 80)}" — ${it.message.slice(0, 100)}`);
      }
      if (items.length > 3) console.log(`      ...and ${items.length - 3} more`);
    }
  }

  // Write full machine-readable report
  try {
    mkdirSync(join(ROOT, 'data/audits'), { recursive: true });
    writeFileSync(OUT_PATH, JSON.stringify({ reports, summary }, null, 2));
    console.log(`\nFull report written to ${relative(ROOT, OUT_PATH)}`);
  } catch (e) {
    process.stderr.write(`Could not write report: ${(e as Error).message}\n`);
  }

  if (STRICT && summary.withIssues > 0) {
    console.log(`\n--strict: ${summary.withIssues} files flagged. Exit 2.`);
    process.exit(2);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
