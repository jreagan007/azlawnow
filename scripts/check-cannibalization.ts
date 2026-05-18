#!/usr/bin/env tsx
/**
 * Cannibalization Guardrail — AZ Law Now
 *
 * Catches keyword/title cannibalization BEFORE it ships: two pages in
 * DIFFERENT collections chasing the same SERP query (near-identical titles
 * or identical primaryKeyword). This is distinct from the intentional
 * four-way-anchor model (pi-cluster-architect) where a topic legitimately
 * has a practice-area + legal-guide + client-guide + investigation — that
 * is fine SO LONG AS their titles target different intents (commercial
 * "Lawyers" vs informational "Laws/statute" vs process vs data).
 *
 * What it flags:
 *   1. Cross-collection title pairs with significant-token Jaccard >= 0.50
 *   2. Identical primaryKeyword across two pages
 *   3. A NEW file colliding with the inventoried/known set
 *
 * The 2026-05-17 sweep resolved 7 known pairs (wrongful-death + the 6
 * severe practice-area/legal-guide pairs). This guard exists so a new
 * investigation or page never re-creates one. Run it in the local
 * pre-push sequence and before publishing any new investigation
 * (see .claude/commands/mode-discover.md + .claude/skills/pi-investigation).
 *
 * Usage:
 *   npx tsx scripts/check-cannibalization.ts            # advisory (exit 0)
 *   npx tsx scripts/check-cannibalization.ts --strict   # exit 1 on any collision
 *   npx tsx scripts/check-cannibalization.ts --json
 *   npx tsx scripts/check-cannibalization.ts --file src/content/investigations/new.mdx
 *       # only flag collisions involving this new/changed file
 *
 * Advisory by default; never wire into netlify.toml (local/pre-push gate,
 * same policy as check:schema — see CLAUDE.md Project Constraints).
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, basename, relative } from 'path';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const JSON_OUT = args.includes('--json');
const fileArg = args.indexOf('--file');
const ONLY_FILE = fileArg >= 0 ? args[fileArg + 1] : null;

const THRESHOLD = 0.5; // significant-token Jaccard at/above which titles collide

// Collections that compete in organic search. Glossary is definitional
// short-form (different SERP surface) and is intentionally excluded.
const COLLECTIONS = ['practice-areas', 'legal-guides', 'client-guides', 'investigations'];

// Filler stripped before computing the topic signature. Intent markers
// (lawyer/laws/statute/guide/checklist) are deliberately KEPT — they are
// exactly what differentiates a commercial page from an informational one,
// so two pages that differ only by intent marker score low and pass.
const STOPWORDS = new Set([
  'arizona', 'az', 'the', 'a', 'an', 'and', 'or', 'of', 'in', 'to', 'for',
  'your', 'you', 'we', 'our', 'with', 'plus', 'free', 'review', 'case',
  'ars', 'no', 'cap', 'rules', 'rule', 'explained', 'what', 'how', 'is',
  'guide', // 'guide' alone is not a topic token
]);

type Intent = 'commercial' | 'informational' | 'process' | 'data';

interface Page {
  collection: string;
  slug: string;
  path: string;
  title: string;
  primaryKeyword: string;
  sigTokens: Set<string>;
  intent: Intent;
}

// The four-way-anchor model (pi-cluster-architect) WANTS one topic covered by
// a practice-area + legal-guide + client-guide + investigation. That is not
// cannibalization — provided each targets a different search intent. We only
// flag when two cross-collection pages share BOTH the topic AND the intent.
function classifyIntent(title: string, collection: string): Intent {
  const t = title.toLowerCase();
  if (/\b(lawyer|lawyers|attorney|attorneys|free (case )?review|near me)\b/.test(t)) return 'commercial';
  if (/\b(law|laws|statute|limitations|liability|rule|rules|ars)\b/.test(t)) return 'informational';
  if (/\b(guide|checklist|steps?|what to do|after|first \d+|victims?|how to)\b/.test(t)) return 'process';
  if (collection === 'investigations') return 'data';
  if (collection === 'client-guides') return 'process';
  if (collection === 'practice-areas') return 'commercial';
  return 'informational';
}

function field(text: string, key: string): string {
  const m = text.match(new RegExp('^' + key + ':\\s*"?(.*?)"?\\s*$', 'm'));
  return m ? m[1].trim() : '';
}

function signature(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

function loadPages(): Page[] {
  const pages: Page[] = [];
  for (const c of COLLECTIONS) {
    const dir = join(ROOT, 'src/content', c);
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir)) {
      if (!entry.endsWith('.mdx')) continue;
      const p = join(dir, entry);
      if (!statSync(p).isFile()) continue;
      const text = readFileSync(p, 'utf8');
      const title = field(text, 'title');
      if (!title) continue;
      pages.push({
        collection: c,
        slug: basename(entry, '.mdx'),
        path: relative(ROOT, p),
        title,
        primaryKeyword: field(text, 'primaryKeyword').toLowerCase(),
        sigTokens: signature(title),
        intent: classifyIntent(title, c),
      });
    }
  }
  return pages;
}

interface Collision {
  reason: 'title-overlap' | 'identical-primaryKeyword';
  score: number;
  a: Page;
  b: Page;
}

function detect(pages: Page[]): Collision[] {
  const out: Collision[] = [];
  for (let i = 0; i < pages.length; i++) {
    for (let j = i + 1; j < pages.length; j++) {
      const a = pages[i];
      const b = pages[j];
      if (a.collection === b.collection) continue; // intra-collection handled elsewhere
      // Identical primaryKeyword always collides regardless of intent.
      if (a.primaryKeyword && a.primaryKeyword === b.primaryKeyword) {
        out.push({ reason: 'identical-primaryKeyword', score: 1, a, b });
        continue;
      }
      // Different search intent => intentional four-way-anchor coverage, not
      // cannibalization. Only same-intent + same-topic competes for one SERP.
      if (a.intent !== b.intent) continue;
      const j2 = jaccard(a.sigTokens, b.sigTokens);
      if (j2 >= THRESHOLD) {
        out.push({ reason: 'title-overlap', score: Number(j2.toFixed(2)), a, b });
      }
    }
  }
  return out.sort((x, y) => y.score - x.score);
}

function main() {
  const pages = loadPages();
  let collisions = detect(pages);

  if (ONLY_FILE) {
    const rel = ONLY_FILE.replace(ROOT + '/', '');
    collisions = collisions.filter((c) => c.a.path === rel || c.b.path === rel);
  }

  if (JSON_OUT) {
    console.log(JSON.stringify({
      pagesScanned: pages.length,
      collisions: collisions.map((c) => ({
        reason: c.reason, score: c.score,
        a: c.a.path, aTitle: c.a.title,
        b: c.b.path, bTitle: c.b.title,
      })),
    }, null, 2));
    process.exit(STRICT && collisions.length ? 1 : 0);
  }

  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║  AZ Law Now — Cannibalization Guardrail      ║');
  console.log(`║  Mode: ${STRICT ? 'STRICT (collision fails build)     ' : 'advisory                          '}║`);
  console.log('╚══════════════════════════════════════════════╝\n');
  console.log(`  Pages scanned: ${pages.length}  (${COLLECTIONS.join(', ')})`);
  console.log(`  Title-overlap threshold: Jaccard >= ${THRESHOLD}\n`);

  if (collisions.length === 0) {
    console.log('  ✓ No cross-collection cannibalization detected.\n');
    process.exit(0);
  }

  console.log(`  ✗ ${collisions.length} potential cannibalization pair(s):\n`);
  for (const c of collisions) {
    const tag = c.reason === 'identical-primaryKeyword'
      ? 'IDENTICAL primaryKeyword'
      : `title overlap ${c.score}`;
    console.log(`  [${tag}]  (both intent: ${c.a.intent})`);
    console.log(`    ${c.a.path}`);
    console.log(`      "${c.a.title}"`);
    console.log(`    ${c.b.path}`);
    console.log(`      "${c.b.title}"`);
    console.log(`    Fix: differentiate by intent — practice-area = commercial`);
    console.log(`         ("Arizona X Lawyers"), legal-guide = informational`);
    console.log(`         ("Arizona X Laws/Statute"), and cross-link them.\n`);
  }

  console.log(`  Status: ${STRICT ? '✗ FAIL (strict)' : '! WARN (advisory — re-run with --strict to enforce)'}\n`);
  process.exit(STRICT ? 1 : 0);
}

main();
