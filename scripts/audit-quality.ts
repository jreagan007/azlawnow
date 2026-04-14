/**
 * Content Quality Audit — AZ Law Now
 * Checks all MDX files for style, frontmatter, and writing rules.
 *
 * Usage:
 *   npx tsx scripts/audit-quality.ts            # advisory (exit 0 on warnings)
 *   npx tsx scripts/audit-quality.ts --strict   # CI mode (warnings fail build)
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';

// ── Flags ───────────────────────────────────────────────

const STRICT = process.argv.includes('--strict');

// ── Config ──────────────────────────────────────────────

interface CollectionConfig {
  dir: string;
  label: string;
  minWords: number;
  /** Collection uses a non-standard taxonomy field instead of `tags` (e.g. practice-areas use primaryKeyword + cluster). */
  taxonomyField?: string;
  skipContentRules?: boolean;
}

const collections: CollectionConfig[] = [
  { dir: './src/content/insights', label: 'Insights', minWords: 2500 },
  { dir: './src/content/legal-guides', label: 'Legal Guides', minWords: 1800 },
  { dir: './src/content/client-guides', label: 'Client Guides', minWords: 1800 },
  { dir: './src/content/practice-areas', label: 'Practice Areas', minWords: 1200, taxonomyField: 'primaryKeyword' },
];

// Specificity gate kicks in on files at/above this word count.
const SPECIFICITY_WORD_FLOOR = 1500;

// Phrase tells — AI-speak that should be rewritten. Warning severity.
const AI_PHRASES: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bcommitted to\b/gi, reason: 'show, don\'t declare commitment' },
  { pattern: /\bstrive to\b/gi, reason: 'say what you do' },
  { pattern: /\bwe believe\b/gi, reason: 'state the claim directly' },
  { pattern: /\bto the best of our knowledge\b/gi, reason: 'AI hedge' },
  { pattern: /\bgenuinely\b/gi, reason: 'AI intensifier' },
  { pattern: /\btime matters\b/gi, reason: 'AI filler' },
  { pattern: /\binherent in\b/gi, reason: 'AI filler' },
  { pattern: /\bchange everything\b/gi, reason: 'AI filler' },
  { pattern: /\bhelp you understand\b/gi, reason: 'AI filler' },
  { pattern: /\bexplain your options\b/gi, reason: 'AI filler' },
  { pattern: /\bwhen it comes to\b/gi, reason: 'AI filler — use "for" or cut' },
  { pattern: /\bmoving forward\b/gi, reason: 'AI filler' },
  { pattern: /\bit is important to note\b/gi, reason: 'throat-clearing' },
  { pattern: /\bit should be noted\b/gi, reason: 'throat-clearing' },
  { pattern: /\bnavigating the complexities\b/gi, reason: 'AI cliché' },
  { pattern: /\bat the end of the day\b/gi, reason: 'AI filler' },
  { pattern: /\bin today's world\b/gi, reason: 'AI filler' },
  { pattern: /\bin the realm of\b/gi, reason: 'AI filler' },
];

// ── Types ───────────────────────────────────────────────

type Severity = 'error' | 'warning' | 'pass';

interface CheckResult {
  severity: Severity;
  message: string;
}

interface ArticleAudit {
  file: string;
  collection: string;
  checks: CheckResult[];
  passed: number;
  warnings: number;
  errors: number;
}

// ── Helpers ─────────────────────────────────────────────

function parseFrontmatter(content: string): Record<string, any> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const yaml = match[1];
  const data: Record<string, any> = {};

  for (const line of yaml.split('\n')) {
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      let val: any = kvMatch[2].trim();

      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }

      if (val.startsWith('[') && val.endsWith(']')) {
        val = val.slice(1, -1).split(',').map((s: string) =>
          s.trim().replace(/^["']|["']$/g, '')
        );
      }

      data[key] = val;
    }
  }

  return data;
}

function getBody(content: string): string {
  const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return match ? match[1] : content;
}

function stripMdxComponents(body: string): string {
  let text = body.replace(/^import\s+.*$/gm, '');
  text = text.replace(/<[A-Z][^>]*\/>/g, '');

  let prev = '';
  while (prev !== text) {
    prev = text;
    text = text.replace(/<([A-Z][a-zA-Z]*)[^>]*>([^<]*(?:<(?![A-Z/])[^<]*)*)<\/\1>/g, '$2');
  }

  text = text.replace(/<\/?[A-Z][a-zA-Z]*[^>]*>/g, '');
  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/\{[^}]*\}/g, '');

  return text.trim();
}

function countWords(text: string): number {
  const cleaned = stripMdxComponents(text);
  const words = cleaned.split(/\s+/).filter((w) => w.length > 0);
  return words.length;
}

// ── Checks ──────────────────────────────────────────────

function checkEmDashes(body: string): CheckResult {
  const emDash = body.includes('\u2014');
  const enDash = body.includes('\u2013');
  if (emDash || enDash) {
    const types = [emDash && 'em dash', enDash && 'en dash'].filter(Boolean).join(', ');
    return { severity: 'error', message: `Contains ${types}` };
  }
  return { severity: 'pass', message: 'No em/en dashes' };
}

function checkContractions(body: string): CheckResult {
  // Strip component markup, then strip quoted strings so direct quotes and
  // literal signage copy ("DO NOT ENTER", "We are double the national average")
  // don't get flagged. Quotes exist verbatim for fidelity; they're the author's
  // choice, not a voice-rules violation.
  let text = stripMdxComponents(body);
  text = text.replace(/"[^"]*"/g, ' ');
  text = text.replace(/\u201C[^\u201D]*\u201D/g, ' ');
  const patterns = [
    { regex: /\bdo not\b/gi, fix: "don't" },
    { regex: /\bcan not\b/gi, fix: "can't" },
    { regex: /\bcannot\b/gi, fix: "can't" },
    { regex: /\bwill not\b/gi, fix: "won't" },
    { regex: /\bit is\b/gi, fix: "it's" },
    { regex: /\bdoes not\b/gi, fix: "doesn't" },
    { regex: /\bis not\b/gi, fix: "isn't" },
    { regex: /\bare not\b/gi, fix: "aren't" },
    { regex: /\bwe are\b/gi, fix: "we're" },
    { regex: /\byou are\b/gi, fix: "you're" },
    { regex: /\bthey are\b/gi, fix: "they're" },
  ];

  const found: string[] = [];
  for (const { regex, fix } of patterns) {
    const matches = text.match(regex);
    if (matches) {
      found.push(`"${matches[0]}" → ${fix}`);
    }
  }

  if (found.length > 0) {
    return { severity: 'error', message: `Uncontracted forms: ${found.slice(0, 5).join('; ')}` };
  }
  return { severity: 'pass', message: 'Contractions used' };
}

function checkWordCount(body: string, minWords: number): CheckResult {
  const count = countWords(body);
  if (count < minWords) {
    return { severity: 'error', message: `Word count ${count} < minimum ${minWords}` };
  }
  return { severity: 'pass', message: `Word count: ${count}` };
}

function checkAuthor(data: Record<string, any>): CheckResult {
  if (!data.author || data.author.trim().length === 0) {
    return { severity: 'error', message: 'Missing author field' };
  }
  return { severity: 'pass', message: `Author: ${data.author}` };
}

function checkPublishedAt(data: Record<string, any>): CheckResult {
  if (!data.publishedAt || data.publishedAt.trim().length === 0) {
    return { severity: 'error', message: 'Missing publishedAt field' };
  }
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(data.publishedAt)) {
    return { severity: 'error', message: `Invalid publishedAt format: ${data.publishedAt}` };
  }
  return { severity: 'pass', message: `Published: ${data.publishedAt}` };
}

function checkTags(data: Record<string, any>, collection: CollectionConfig): CheckResult {
  const field = collection.taxonomyField ?? 'tags';
  const val = data[field];
  if (field === 'tags') {
    if (!val || (Array.isArray(val) && val.length === 0)) {
      return { severity: 'error', message: 'No tags defined' };
    }
    const count = Array.isArray(val) ? val.length : 1;
    return { severity: 'pass', message: `Tags: ${count}` };
  }
  // Non-standard taxonomy (practice-areas use primaryKeyword).
  if (!val || (typeof val === 'string' && val.trim().length === 0)) {
    return { severity: 'error', message: `Missing ${field}` };
  }
  return { severity: 'pass', message: `${field}: ${val}` };
}

function checkDescription(data: Record<string, any>): CheckResult {
  if (!data.description) {
    return { severity: 'error', message: 'Missing description' };
  }
  const len = data.description.length;
  if (len > 160) {
    return { severity: 'error', message: `Description too long: ${len} chars (max 160)` };
  }
  return { severity: 'pass', message: `Description: ${len} chars` };
}

// AI phrase tells.
function checkAiPhrases(body: string): CheckResult {
  const text = stripMdxComponents(body);
  const hits: string[] = [];
  for (const { pattern, reason } of AI_PHRASES) {
    const matches = text.match(pattern);
    if (matches) {
      hits.push(`"${matches[0]}" (${reason})`);
    }
  }
  if (hits.length > 0) {
    return { severity: 'warning', message: `AI phrase tells: ${hits.slice(0, 4).join('; ')}${hits.length > 4 ? ` + ${hits.length - 4} more` : ''}` };
  }
  return { severity: 'pass', message: 'No AI phrase tells' };
}

// Structural AI patterns Ahrefs keys on.
function checkStructuralTells(body: string): CheckResult {
  const lines = body.split('\n');
  const hits: string[] = [];

  // 1. Bold-label-colon paragraph runs (3+ consecutive non-empty paragraphs
  //    opening with **Label:**). Trigger pattern from aee's flagged pages.
  const paragraphs = body.split(/\n\s*\n/);
  let labelRun = 0;
  let labelRunStart = 0;
  let worstLabelRun = 0;
  let worstLabelRunStart = 0;
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i].trim();
    if (/^\*\*[^*\n]{1,60}:\*\*/.test(p)) {
      if (labelRun === 0) labelRunStart = i;
      labelRun++;
      if (labelRun > worstLabelRun) {
        worstLabelRun = labelRun;
        worstLabelRunStart = labelRunStart;
      }
    } else {
      labelRun = 0;
    }
  }
  if (worstLabelRun >= 3) {
    hits.push(`${worstLabelRun} consecutive **Label:** paragraphs (mix in prose to break the uniform rhythm)`);
  }

  // 2. Abstract-noun H3 runs — 3+ consecutive short (<=3 word) H3 headings.
  const h3s: Array<{ line: number; text: string }> = [];
  lines.forEach((line, idx) => {
    const m = line.match(/^###\s+(.+?)\s*$/);
    if (m) h3s.push({ line: idx, text: m[1] });
  });
  let shortH3Run = 0;
  let worstShortH3Run = 0;
  for (const h of h3s) {
    const wordCount = h.text.split(/\s+/).length;
    if (wordCount <= 3) {
      shortH3Run++;
      if (shortH3Run > worstShortH3Run) worstShortH3Run = shortH3Run;
    } else {
      shortH3Run = 0;
    }
  }
  if (worstShortH3Run >= 3) {
    hits.push(`${worstShortH3Run} consecutive short (<=3 word) H3s — abstract-noun run is an AI tell`);
  }

  // 3. Symmetric "What We X / What We Don't X" heading pairs.
  const headings = lines
    .map((l) => l.match(/^#{2,4}\s+(.+?)\s*$/))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => m[1].toLowerCase());
  const symmetricPatterns = [
    /what we (?:do|cover|handle|offer)/,
    /what we (?:don't|do not) (?:do|cover|handle|offer)/,
  ];
  const hasDo = headings.some((h) => symmetricPatterns[0].test(h));
  const hasDont = headings.some((h) => symmetricPatterns[1].test(h));
  if (hasDo && hasDont) {
    hits.push('Symmetric "What We X / What We Don\'t X" heading pair — classic LLM reflex');
  }

  // 4. Parallel short bold-lead-in paragraphs (3+ consecutive paragraphs
  //    that are single sentences AND open with **bold**). Distinct from #1
  //    because the label here is a bolded fragment, not a "Label:" colon.
  let boldSentenceRun = 0;
  let worstBoldSentenceRun = 0;
  for (const p of paragraphs) {
    const trimmed = p.trim();
    const startsBold = /^\*\*[^*\n]+\*\*/.test(trimmed);
    const sentenceCount = (trimmed.match(/[.!?](?:\s|$)/g) || []).length;
    const isShort = sentenceCount <= 2 && trimmed.length < 280;
    if (startsBold && isShort && !/^\*\*[^*\n]{1,60}:\*\*/.test(trimmed)) {
      boldSentenceRun++;
      if (boldSentenceRun > worstBoldSentenceRun) worstBoldSentenceRun = boldSentenceRun;
    } else {
      boldSentenceRun = 0;
    }
  }
  if (worstBoldSentenceRun >= 3) {
    hits.push(`${worstBoldSentenceRun} consecutive short **bold**-lead paragraphs — parallel structure is an AI tell`);
  }

  if (hits.length > 0) {
    return { severity: 'warning', message: `Structural tells: ${hits.join('; ')}` };
  }
  return { severity: 'pass', message: 'No structural AI tells' };
}

// Arizona-specificity gate on long-form content.
function checkArizonaSpecificity(body: string, wordCount: number): CheckResult {
  if (wordCount < SPECIFICITY_WORD_FLOOR) {
    return { severity: 'pass', message: `Specificity gate skipped (${wordCount} < ${SPECIFICITY_WORD_FLOOR} words)` };
  }

  const text = stripMdxComponents(body);
  const signals: string[] = [];

  // Dollar figure tied to a case / outcome ($X,000 or $X million).
  if (/\$\s?\d[\d,]*(?:\s?(?:million|thousand|k|m)\b)?/i.test(text)) {
    signals.push('$ figure');
  }

  // Arizona statute citation — matches "ARS 12-2506", "A.R.S. § 28-672", "A.R.S. 12-2506".
  if (/\bA\.?R\.?S\.?\s*(?:§\s*)?\d+[-\u2010-\u2015]?\d*\b/i.test(text)) {
    signals.push('A.R.S. citation');
  }

  // Named AZ court.
  if (/\b(?:Maricopa|Pima|Yavapai|Pinal|Coconino|Mohave|Yuma|Navajo)\s+County\s+Superior\s+Court\b/i.test(text)
      || /\bArizona\s+Court\s+of\s+Appeals\b/i.test(text)
      || /\bArizona\s+Supreme\s+Court\b/i.test(text)
      || /\bPhoenix\s+Municipal\s+Court\b/i.test(text)
      || /\bTucson\s+City\s+Court\b/i.test(text)) {
    signals.push('named AZ court');
  }

  // Direct-experience framing.
  if (/\b(?:in our experience|in my \d+ years|we(?:'ve| have) (?:seen|handled|tried))\b/i.test(text)) {
    signals.push('experience framing');
  }

  if (signals.length === 0) {
    return {
      severity: 'error',
      message: `Long-form (${wordCount} words) missing all Arizona-specificity signals. Need at least one of: $ figure, A.R.S. citation, named AZ court, or "in our experience"-style framing.`,
    };
  }
  return { severity: 'pass', message: `Specificity signals: ${signals.join(', ')}` };
}

// ── Main ────────────────────────────────────────────────

function auditArticle(filePath: string, collection: CollectionConfig): ArticleAudit {
  const content = readFileSync(filePath, 'utf-8');
  const data = parseFrontmatter(content);
  const body = getBody(content);
  const wordCount = countWords(body);

  const checks: CheckResult[] = [
    checkAuthor(data),
    checkPublishedAt(data),
    checkTags(data, collection),
    checkDescription(data),
    checkWordCount(body, collection.minWords),
    checkEmDashes(body),
    checkContractions(body),
    checkAiPhrases(body),
    checkStructuralTells(body),
    checkArizonaSpecificity(body, wordCount),
  ];

  return {
    file: basename(filePath),
    collection: collection.label,
    checks,
    passed: checks.filter((c) => c.severity === 'pass').length,
    warnings: checks.filter((c) => c.severity === 'warning').length,
    errors: checks.filter((c) => c.severity === 'error').length,
  };
}

function run() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║    AZ Law Now — Content Quality Audit        ║');
  console.log(`║    Mode: ${STRICT ? 'STRICT (warnings fail build)     ' : 'advisory                          '}║`);
  console.log('╚══════════════════════════════════════════════╝\n');

  const results: ArticleAudit[] = [];
  let totalPassed = 0;
  let totalWarnings = 0;
  let totalErrors = 0;

  for (const collection of collections) {
    if (!existsSync(collection.dir)) {
      console.log(`⚠  ${collection.label}: directory not found (${collection.dir})\n`);
      continue;
    }

    const files = readdirSync(collection.dir).filter((f) => f.endsWith('.mdx'));
    if (files.length === 0) {
      console.log(`⚠  ${collection.label}: no MDX files found\n`);
      continue;
    }

    console.log(`── ${collection.label} (${files.length} articles) ──────────────────\n`);

    for (const file of files) {
      const audit = auditArticle(join(collection.dir, file), collection);
      results.push(audit);
      totalPassed += audit.passed;
      totalWarnings += audit.warnings;
      totalErrors += audit.errors;

      const hasIssues = audit.errors > 0 || audit.warnings > 0;
      const icon = audit.errors > 0 ? '✗' : audit.warnings > 0 ? '!' : '✓';
      const status = audit.errors > 0 ? 'FAIL' : audit.warnings > 0 ? 'WARN' : 'PASS';
      console.log(`  ${icon} ${status}  ${audit.file}  (${audit.passed}/${audit.checks.length} pass, ${audit.warnings} warn, ${audit.errors} err)`);

      if (hasIssues) {
        for (const check of audit.checks) {
          if (check.severity === 'error') {
            console.log(`           ✗ ${check.message}`);
          } else if (check.severity === 'warning') {
            console.log(`           ! ${check.message}`);
          }
        }
      }
      console.log('');
    }
  }

  // Summary
  console.log('── Summary ──────────────────────────────────\n');
  console.log(`  Articles:   ${results.length}`);
  console.log(`  Passed:     ${totalPassed}`);
  console.log(`  Warnings:   ${totalWarnings}`);
  console.log(`  Errors:     ${totalErrors}`);

  const failBuild = totalErrors > 0 || (STRICT && totalWarnings > 0);
  console.log(`  Status:     ${failBuild ? '✗ FAIL' : '✓ PASS'}${STRICT ? ' (strict)' : ''}\n`);

  if (failBuild) {
    process.exit(1);
  }
}

run();
