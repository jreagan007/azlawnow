/**
 * Content Quality Audit — AZ Law Now
 * Checks all MDX files for style, frontmatter, and writing rules.
 *
 * Usage: npx tsx scripts/audit-quality.ts
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';

// ── Config ──────────────────────────────────────────────

interface CollectionConfig {
  dir: string;
  label: string;
  minWords: number;
}

const collections: CollectionConfig[] = [
  { dir: './src/content/resources', label: 'Resources', minWords: 2500 },
  { dir: './src/content/legal-guides', label: 'Legal Guides', minWords: 1800 },
  { dir: './src/content/client-guides', label: 'Client Guides', minWords: 1800 },
];

// ── Types ───────────────────────────────────────────────

interface CheckResult {
  pass: boolean;
  message: string;
}

interface ArticleAudit {
  file: string;
  collection: string;
  checks: CheckResult[];
  passed: number;
  failed: number;
}

// ── Helpers ─────────────────────────────────────────────

function parseFrontmatter(content: string): Record<string, any> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const yaml = match[1];
  const data: Record<string, any> = {};

  // Simple YAML parser for flat keys + arrays
  for (const line of yaml.split('\n')) {
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      let val: any = kvMatch[2].trim();

      // Strip quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }

      // Inline array
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
  // Remove import lines
  let text = body.replace(/^import\s+.*$/gm, '');

  // Remove self-closing JSX tags (single line): <Component foo="bar" />
  text = text.replace(/<[A-Z][^>]*\/>/g, '');

  // Remove paired JSX tags and their content (non-greedy, line by line)
  // Handles multi-line component blocks like <KeyFacts>.....</KeyFacts>
  let prev = '';
  while (prev !== text) {
    prev = text;
    // Remove innermost paired tags first (no nested capital-letter tags inside)
    text = text.replace(/<([A-Z][a-zA-Z]*)[^>]*>([^<]*(?:<(?![A-Z/])[^<]*)*)<\/\1>/g, '$2');
  }

  // Remove any remaining opening/closing component tags
  text = text.replace(/<\/?[A-Z][a-zA-Z]*[^>]*>/g, '');

  // Remove markdown heading markers
  text = text.replace(/^#{1,6}\s+/gm, '');

  // Remove JSX curly expressions
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
    return { pass: false, message: `Contains ${types}` };
  }
  return { pass: true, message: 'No em/en dashes' };
}

function checkContractions(body: string): CheckResult {
  // Only check outside of component tags and code blocks
  const text = stripMdxComponents(body);
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
    return { pass: false, message: `Uncontracted forms: ${found.slice(0, 5).join('; ')}` };
  }
  return { pass: true, message: 'Contractions used' };
}

function checkWordCount(body: string, minWords: number): CheckResult {
  const count = countWords(body);
  if (count < minWords) {
    return { pass: false, message: `Word count ${count} < minimum ${minWords}` };
  }
  return { pass: true, message: `Word count: ${count}` };
}

function checkAuthor(data: Record<string, any>): CheckResult {
  if (!data.author || data.author.trim().length === 0) {
    return { pass: false, message: 'Missing author field' };
  }
  return { pass: true, message: `Author: ${data.author}` };
}

function checkPublishedAt(data: Record<string, any>): CheckResult {
  if (!data.publishedAt || data.publishedAt.trim().length === 0) {
    return { pass: false, message: 'Missing publishedAt field' };
  }
  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(data.publishedAt)) {
    return { pass: false, message: `Invalid publishedAt format: ${data.publishedAt}` };
  }
  return { pass: true, message: `Published: ${data.publishedAt}` };
}

function checkTags(data: Record<string, any>): CheckResult {
  const tags = data.tags;
  if (!tags || (Array.isArray(tags) && tags.length === 0)) {
    return { pass: false, message: 'No tags defined' };
  }
  const count = Array.isArray(tags) ? tags.length : 1;
  return { pass: true, message: `Tags: ${count}` };
}

function checkDescription(data: Record<string, any>): CheckResult {
  if (!data.description) {
    return { pass: false, message: 'Missing description' };
  }
  const len = data.description.length;
  if (len > 160) {
    return { pass: false, message: `Description too long: ${len} chars (max 160)` };
  }
  return { pass: true, message: `Description: ${len} chars` };
}

// ── Main ────────────────────────────────────────────────

function auditArticle(filePath: string, collection: CollectionConfig): ArticleAudit {
  const content = readFileSync(filePath, 'utf-8');
  const data = parseFrontmatter(content);
  const body = getBody(content);

  const checks: CheckResult[] = [
    checkAuthor(data),
    checkPublishedAt(data),
    checkTags(data),
    checkDescription(data),
    checkWordCount(body, collection.minWords),
    checkEmDashes(body),
    checkContractions(body),
  ];

  return {
    file: basename(filePath),
    collection: collection.label,
    checks,
    passed: checks.filter((c) => c.pass).length,
    failed: checks.filter((c) => !c.pass).length,
  };
}

function run() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║    AZ Law Now — Content Quality Audit        ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  const results: ArticleAudit[] = [];
  let totalPassed = 0;
  let totalFailed = 0;

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
      totalFailed += audit.failed;

      const status = audit.failed === 0 ? 'PASS' : 'FAIL';
      const icon = audit.failed === 0 ? '✓' : '✗';
      console.log(`  ${icon} ${status}  ${audit.file}  (${audit.passed}/${audit.checks.length})`);

      for (const check of audit.checks) {
        if (!check.pass) {
          console.log(`           ✗ ${check.message}`);
        }
      }
      console.log('');
    }
  }

  // Summary
  const totalChecks = totalPassed + totalFailed;
  const allClean = totalFailed === 0;

  console.log('── Summary ──────────────────────────────────\n');
  console.log(`  Articles:  ${results.length}`);
  console.log(`  Checks:    ${totalChecks}  (${totalPassed} passed, ${totalFailed} failed)`);
  console.log(`  Status:    ${allClean ? '✓ ALL CLEAN' : '✗ ISSUES FOUND'}\n`);

  if (!allClean) {
    process.exit(1);
  }
}

run();
