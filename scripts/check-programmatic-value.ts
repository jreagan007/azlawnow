#!/usr/bin/env npx tsx
/**
 * Programmatic Value Checker — AZ Law Now
 * Flags city .astro pages and practice-areas/*.mdx that lack unique data signals.
 *
 * Runs 8 detectors on each file:
 *   1. ADOT reference (adot.gov, "ADOT", "Arizona Department of Transportation", "Crash Facts")
 *   2. Dollar figure ($X,XXX or $X million)
 *   3. Named road or intersection (common AZ roads / generic intersection pattern)
 *   4. ARS citation (ARS / A.R.S. + section number)
 *   5. Named court case (v. / vs. in citation context)
 *   6. Non-trivial keyTakeaway (frontmatter keyTakeaway present and substantial)
 *   7. dataSources >= 2 entries in frontmatter
 *   8. Named AZ city in body copy
 *
 * Usage:
 *   npx tsx scripts/check-programmatic-value.ts
 *   npx tsx scripts/check-programmatic-value.ts --strict   # exit 1 on zero-signal pages
 *   npx tsx scripts/check-programmatic-value.ts --slug phoenix
 *   npx tsx scripts/check-programmatic-value.ts --json
 *
 * Utility pages skipped by name: index, 404, contact, thank-you, privacy,
 * terms, disclaimer, editorial-policy, reviews, tips, faq, free-case-review,
 * news-sitemap, about.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';

// ── Flags ────────────────────────────────────────────

const args = process.argv.slice(2);

function flag(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : undefined;
}

const STRICT = args.includes('--strict');
const JSON_MODE = args.includes('--json');
const SLUG_FILTER = flag('slug');

// ── Config ───────────────────────────────────────────

const ROOT = process.cwd();

// City .astro pages live at src/pages/*.astro (top-level only, not subdirs).
// We identify them as non-utility .astro files at the pages root.
const PAGES_DIR = join(ROOT, 'src/pages');
const PRACTICE_AREAS_DIR = join(ROOT, 'src/content/practice-areas');

// Utility slugs — skip these; they're not programmatic content pages.
const UTILITY_SLUGS = new Set([
  'index',
  '404',
  'contact',
  'thank-you',
  'thankyou',
  'thank_you',
  'privacy',
  'privacy-policy',
  'terms',
  'terms-of-service',
  'disclaimer',
  'editorial-policy',
  'reviews',
  'tips',
  'faq',
  'free-case-review',
  'news-sitemap',
  'about',
  'case-results',
]);

// Subdirectories in src/pages that contain collection route files — not city pages.
const PAGE_SUBDIR_EXCLUSIONS = new Set([
  'investigations',
  'legal-guides',
  'client-guides',
  'practice-areas',
  'glossary',
  'about',
  'abuse-negligence',
  'other-claims',
  'vehicle-crashes',
]);

// ── Detectors ─────────────────────────────────────────

// 1. ADOT reference
const ADOT_RE = /adot\.gov|arizona department of transportation|\bADOT\b|crash facts/i;

// 2. Dollar figure
const DOLLAR_RE = /\$\s?\d[\d,]*(?:\s?(?:million|thousand|k|m)\b)?/i;

// 3. Named road or intersection
const ROAD_RE =
  /\b(?:I-\d+|SR-\d+|AZ-\d+|US-\d+|Loop\s+\d+|Route\s+\d+|Highway\s+\d+|Interstate\s+\d+|McDowell\s+Road|Camelback\s+Road|Indian\s+School\s+Road|Bell\s+Road|Peoria\s+Ave(?:nue)?|Glendale\s+Ave(?:nue)?|Dunlap\s+Ave(?:nue)?|Thomas\s+Road|Van\s+Buren\s+St(?:reet)?|Buckeye\s+Road|Baseline\s+Road|Elliot\s+Road|Ray\s+Road|Chandler\s+Blvd|Alma\s+School|Gilbert\s+Road|Power\s+Road|Dobson\s+Road|Scottsdale\s+Road|Pima\s+Road|Shea\s+Blvd|Greenway\s+(?:Pkwy|Parkway|Road)|Cave\s+Creek\s+Road|7th\s+(?:Ave(?:nue)?|St(?:reet)?)|19th\s+Ave(?:nue)?|35th\s+Ave(?:nue)?|43rd\s+Ave(?:nue)?|51st\s+Ave(?:nue)?|59th\s+Ave(?:nue)?|67th\s+Ave(?:nue)?|75th\s+Ave(?:nue)?|83rd\s+Ave(?:nue)?|91st\s+Ave(?:nue)?|99th\s+Ave(?:nue)?|107th\s+Ave(?:nue)?|115th\s+Ave(?:nue)?|Estrella\s+Pkwy|Litchfield\s+Road|Dysart\s+Road|Sarival\s+Ave(?:nue)?|Jackrabbit\s+Trail|Watson\s+Road|Miller\s+Road|Maricopa-Casa\s+Grande\s+Hwy|Pinal\s+Ave(?:nue)?|Speedway\s+Blvd|Broadway\s+Blvd|22nd\s+St(?:reet)?|Grant\s+Road|Kolb\s+Road|Tanque\s+Verde|Oracle\s+Road|Flowing\s+Wells\s+Road|Miracle\s+Mile|Congress\s+St(?:reet)?)\b/i;

// Intersection pattern: "[Road] and [Road]"
const INTERSECTION_RE = /\b\w[\w\s]{3,30}\s+and\s+\w[\w\s]{3,30}(?:Road|Ave(?:nue)?|Blvd|Drive|Street|Way|Pkwy|Trail|Lane)\b/i;

// 4. ARS citation
const ARS_RE = /\bA\.?R\.?S\.?\s*(?:§\s*)?\d+[-‐-―]?\d*\b/i;

// 5. Named case (v. / vs. citation)
const CASE_RE = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+v(?:s?\.)\s+[A-Z][a-z]+/;

// 6. Non-trivial keyTakeaway: present + length >= 120 chars
function detectKeyTakeaway(text: string): boolean {
  // Check frontmatter for keyTakeaway field
  const match = text.match(/^keyTakeaway:\s*["']?([\s\S]{120,}?)["']?\s*(?:\n[a-zA-Z]|\n---)/m);
  if (match) return true;
  // Also catch multi-line YAML block scalar
  const blockMatch = text.match(/^keyTakeaway:\s*\|\s*\n([\s\S]{120,}?)(?:\n[a-zA-Z\-]|\n---)/m);
  return !!blockMatch;
}

// 7. dataSources >= 2
function detectDataSources(text: string): boolean {
  // Count lines that look like dataSources list entries: "  - " inside dataSources block
  const dsBlock = text.match(/^dataSources:\s*\n((?:  -[^\n]*\n?)+)/m);
  if (!dsBlock) return false;
  const entries = (dsBlock[1].match(/^\s+-\s+/gm) ?? []).length;
  return entries >= 2;
}

// 8. Named AZ city in body copy
const AZ_CITIES_RE =
  /\b(?:Phoenix|Tucson|Mesa|Chandler|Scottsdale|Tempe|Glendale|Peoria|Surprise|Goodyear|Avondale|Buckeye|Gilbert|Maricopa|Casa\s+Grande|Yuma|Flagstaff|Prescott|Sedona|Lake\s+Havasu\s+City|Kingman|Sierra\s+Vista|San\s+Tan\s+Valley|Queen\s+Creek|Fountain\s+Hills|El\s+Mirage|Tolleson|Laveen|Litchfield\s+Park|Anthem|Sun\s+City|Sun\s+City\s+West|Wickenburg|Payson|Show\s+Low|Winslow|Holbrook|Williams|Bullhead\s+City|Parker|Ajo|Coolidge|Florence|Eloy|Safford|Douglas|Nogales|Bisbee|Fort\s+McDowell|Ak-Chin|Estrella)\b/i;

// ── Types ────────────────────────────────────────────

type SignalKey =
  | 'adot'
  | 'dollarFigure'
  | 'namedRoad'
  | 'arsCitation'
  | 'namedCase'
  | 'keyTakeaway'
  | 'dataSources2'
  | 'azCity';

interface SignalResult {
  adot: boolean;
  dollarFigure: boolean;
  namedRoad: boolean;
  arsCitation: boolean;
  namedCase: boolean;
  keyTakeaway: boolean;
  dataSources2: boolean;
  azCity: boolean;
}

interface PageReport {
  file: string;
  slug: string;
  type: 'city-page' | 'practice-area';
  signalCount: number;
  signals: SignalResult;
  zeroSignal: boolean;
}

// ── Helpers ──────────────────────────────────────────

function walk(dir: string, ext: string, results: string[] = []): string[] {
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) {
      // Skip utility subdirectories (collection route dirs)
      if (!PAGE_SUBDIR_EXCLUSIONS.has(entry)) {
        walk(p, ext, results);
      }
    } else if (extname(entry) === ext) {
      results.push(p);
    }
  }
  return results;
}

function slugFrom(filePath: string): string {
  return basename(filePath, extname(filePath));
}

function detectSignals(text: string): SignalResult {
  return {
    adot: ADOT_RE.test(text),
    dollarFigure: DOLLAR_RE.test(text),
    namedRoad: ROAD_RE.test(text) || INTERSECTION_RE.test(text),
    arsCitation: ARS_RE.test(text),
    namedCase: CASE_RE.test(text),
    keyTakeaway: detectKeyTakeaway(text),
    dataSources2: detectDataSources(text),
    azCity: AZ_CITIES_RE.test(text),
  };
}

function countSignals(signals: SignalResult): number {
  return Object.values(signals).filter(Boolean).length;
}

// ── City page discovery ───────────────────────────────

function discoverCityPages(): string[] {
  if (!existsSync(PAGES_DIR)) return [];
  // Only top-level .astro files in src/pages/ — not in subdirectories
  return readdirSync(PAGES_DIR)
    .filter(entry => {
      const p = join(PAGES_DIR, entry);
      if (!statSync(p).isFile()) return false;
      if (extname(entry) !== '.astro') return false;
      const slug = slugFrom(p);
      if (UTILITY_SLUGS.has(slug)) return false;
      return true;
    })
    .map(entry => join(PAGES_DIR, entry));
}

// ── Audit ────────────────────────────────────────────

function auditFile(filePath: string, type: 'city-page' | 'practice-area'): PageReport {
  const text = readFileSync(filePath, 'utf-8');
  const slug = slugFrom(filePath);
  const signals = detectSignals(text);
  const signalCount = countSignals(signals);

  return {
    file: filePath.replace(ROOT + '/', ''),
    slug,
    type,
    signalCount,
    signals,
    zeroSignal: signalCount === 0,
  };
}

// ── Reporter ─────────────────────────────────────────

const SIGNAL_LABELS: Record<SignalKey, string> = {
  adot: 'ADOT ref',
  dollarFigure: '$ figure',
  namedRoad: 'named road/intersection',
  arsCitation: 'ARS citation',
  namedCase: 'named case',
  keyTakeaway: 'keyTakeaway (substantial)',
  dataSources2: 'dataSources ≥ 2',
  azCity: 'named AZ city',
};

function renderReport(reports: PageReport[]): void {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║  AZ Law Now — Programmatic Value Check       ║');
  console.log(`║  Mode: ${STRICT ? 'STRICT (zero-signal exits 1)       ' : 'advisory (exit 0 on warnings)      '}║`);
  console.log('╚══════════════════════════════════════════════╝\n');

  const cityPages = reports.filter(r => r.type === 'city-page');
  const practiceAreas = reports.filter(r => r.type === 'practice-area');
  const zeroSignal = reports.filter(r => r.zeroSignal);
  const lowSignal = reports.filter(r => !r.zeroSignal && r.signalCount <= 2);

  if (cityPages.length > 0) {
    console.log(`── City Pages (${cityPages.length}) ──────────────────────────\n`);
    for (const r of cityPages) {
      const icon = r.zeroSignal ? '✗' : r.signalCount <= 2 ? '!' : '✓';
      const label = r.zeroSignal ? 'ZERO ' : r.signalCount <= 2 ? 'LOW  ' : 'PASS ';
      console.log(`  ${icon} ${label}  ${r.file}  [${r.signalCount}/8 signals]`);
      if (r.zeroSignal || r.signalCount <= 2) {
        const missing = (Object.keys(r.signals) as SignalKey[])
          .filter(k => !r.signals[k])
          .map(k => SIGNAL_LABELS[k]);
        console.log(`           Missing: ${missing.join(', ')}`);
      }
      console.log('');
    }
  }

  if (practiceAreas.length > 0) {
    console.log(`── Practice Areas (${practiceAreas.length}) ──────────────────────\n`);
    for (const r of practiceAreas) {
      const icon = r.zeroSignal ? '✗' : r.signalCount <= 2 ? '!' : '✓';
      const label = r.zeroSignal ? 'ZERO ' : r.signalCount <= 2 ? 'LOW  ' : 'PASS ';
      console.log(`  ${icon} ${label}  ${r.file}  [${r.signalCount}/8 signals]`);
      if (r.zeroSignal || r.signalCount <= 2) {
        const missing = (Object.keys(r.signals) as SignalKey[])
          .filter(k => !r.signals[k])
          .map(k => SIGNAL_LABELS[k]);
        console.log(`           Missing: ${missing.join(', ')}`);
      }
      console.log('');
    }
  }

  console.log('── Summary ──────────────────────────────────\n');
  console.log(`  City pages scanned:     ${cityPages.length}`);
  console.log(`  Practice areas scanned: ${practiceAreas.length}`);
  console.log(`  Zero-signal pages:      ${zeroSignal.length}${zeroSignal.length > 0 ? ' ← programmatic thin-content risk' : ''}`);
  console.log(`  Low-signal pages (≤2):  ${lowSignal.length}`);

  const failBuild = STRICT && zeroSignal.length > 0;
  console.log(`  Status:                 ${failBuild ? '✗ FAIL (strict: zero-signal pages found)' : zeroSignal.length > 0 ? '! WARN (advisory)' : '✓ PASS'}\n`);

  if (failBuild) {
    process.exit(1);
  }
}

function renderJson(reports: PageReport[]): void {
  console.log(
    JSON.stringify(
      {
        runAt: new Date().toISOString(),
        strict: STRICT,
        slugFilter: SLUG_FILTER ?? null,
        total: reports.length,
        zeroSignal: reports.filter(r => r.zeroSignal).length,
        lowSignal: reports.filter(r => !r.zeroSignal && r.signalCount <= 2).length,
        pages: reports,
      },
      null,
      2
    )
  );

  if (STRICT && reports.some(r => r.zeroSignal)) {
    process.exit(1);
  }
}

// ── Main ─────────────────────────────────────────────

function run() {
  // Collect city pages
  const cityPagePaths = discoverCityPages();

  // Collect practice-area mdx files
  const practiceAreaPaths = walk(PRACTICE_AREAS_DIR, '.mdx');

  let allPaths: Array<{ path: string; type: 'city-page' | 'practice-area' }> = [
    ...cityPagePaths.map(p => ({ path: p, type: 'city-page' as const })),
    ...practiceAreaPaths.map(p => ({ path: p, type: 'practice-area' as const })),
  ];

  // Apply --slug filter
  if (SLUG_FILTER) {
    allPaths = allPaths.filter(({ path }) => slugFrom(path) === SLUG_FILTER);
    if (allPaths.length === 0) {
      if (!JSON_MODE) {
        console.log(`\n  ! No page found matching slug: ${SLUG_FILTER}\n`);
      } else {
        console.log(JSON.stringify({ status: 'no-match', slug: SLUG_FILTER }));
      }
      process.exit(0);
    }
  }

  const reports: PageReport[] = allPaths.map(({ path, type }) => auditFile(path, type));

  if (JSON_MODE) {
    renderJson(reports);
  } else {
    renderReport(reports);
  }
}

run();
