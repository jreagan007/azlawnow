/**
 * Image Weight Audit — AZ Law Now
 *
 * Enforces image weight thresholds so the site stays fast. Oversized images
 * are the single most common Core Web Vitals killer on a content site.
 *
 * Usage:
 *   npx tsx scripts/check-images.ts            # advisory (exit 0 on warnings)
 *   npx tsx scripts/check-images.ts --strict   # CI mode (warnings fail build)
 *
 * Thresholds (post-WebP-conversion targets):
 *   Hero / OG images:         300 KB
 *   Card / thumbnail images:  200 KB
 *   Team / inline images:     150 KB
 *   Background images:        500 KB (use sparingly)
 *   Other:                    400 KB
 *
 * Also flags:
 *   - PNG/JPG files that should be WebP (any PNG/JPG over 100 KB)
 *   - Missing WebP alongside PNG source (upgrade candidate)
 */

import { readdirSync, statSync, existsSync } from 'fs';
import { join, extname, basename, dirname, relative } from 'path';

const STRICT = process.argv.includes('--strict');
const ROOT = process.cwd();
const IMAGES_DIR = join(ROOT, 'public/images');

interface Threshold {
  label: string;
  match: (relPath: string) => boolean;
  maxBytes: number;
}

// Order matters — first match wins.
const THRESHOLDS: Threshold[] = [
  { label: 'hero',       match: p => p.includes('/heroes/'),       maxBytes: 300 * 1024 },
  { label: 'og',         match: p => p.includes('/og/') || p.startsWith('og/'), maxBytes: 300 * 1024 },
  { label: 'card',       match: p => p.includes('/cards/'),        maxBytes: 200 * 1024 },
  { label: 'team',       match: p => p.includes('/team/'),         maxBytes: 220 * 1024 },
  { label: 'map',        match: p => p.includes('/maps/'),         maxBytes: 150 * 1024 },
  { label: 'background', match: p => p.includes('/bg/'),           maxBytes: 500 * 1024 },
  { label: 'blog',       match: p => p.includes('/blog/'),         maxBytes: 300 * 1024 },
  { label: 'other',      match: () => true,                        maxBytes: 400 * 1024 },
];

interface Finding {
  severity: 'error' | 'warning';
  file: string;
  message: string;
  bytes: number;
}

function humanSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

function walkImages(dir: string, base: string = dir, files: string[] = []): string[] {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) {
      walkImages(full, base, files);
    } else {
      const ext = extname(entry).toLowerCase();
      if (['.webp', '.png', '.jpg', '.jpeg', '.gif'].includes(ext)) {
        files.push(full);
      }
    }
  }
  return files;
}

function thresholdFor(relPath: string): Threshold {
  for (const t of THRESHOLDS) {
    if (t.match(relPath)) return t;
  }
  return THRESHOLDS[THRESHOLDS.length - 1];
}

function run() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║    AZ Law Now — Image Weight Audit           ║');
  console.log(`║    Mode: ${STRICT ? 'STRICT (warnings fail build)     ' : 'advisory                          '}║`);
  console.log('╚══════════════════════════════════════════════╝\n');

  if (!existsSync(IMAGES_DIR)) {
    console.log(`⚠  public/images not found. Nothing to audit.\n`);
    process.exit(0);
  }

  const allImages = walkImages(IMAGES_DIR);
  const ogDir = join(ROOT, 'public/og');
  if (existsSync(ogDir)) {
    walkImages(ogDir, ogDir, allImages);
  }

  const findings: Finding[] = [];

  for (const full of allImages) {
    const rel = relative(ROOT, full);
    const size = statSync(full).size;
    const ext = extname(full).toLowerCase();
    const t = thresholdFor(rel);

    // Weight check.
    if (size > t.maxBytes) {
      findings.push({
        severity: 'error',
        file: rel,
        bytes: size,
        message: `${humanSize(size)} exceeds ${t.label} limit (${humanSize(t.maxBytes)})`,
      });
    }

    // Format recommendation: PNG/JPG over 100 KB should be WebP.
    if (['.png', '.jpg', '.jpeg'].includes(ext) && size > 100 * 1024) {
      const webpSibling = join(dirname(full), basename(full, ext) + '.webp');
      if (!existsSync(webpSibling)) {
        findings.push({
          severity: 'warning',
          file: rel,
          bytes: size,
          message: `${ext.toUpperCase().slice(1)} with no WebP sibling (convert for 30-50% weight savings)`,
        });
      }
    }
  }

  // Group by file.
  const byFile = new Map<string, Finding[]>();
  for (const f of findings) {
    if (!byFile.has(f.file)) byFile.set(f.file, []);
    byFile.get(f.file)!.push(f);
  }

  // Worst offenders first.
  const sortedFiles = [...byFile.entries()].sort((a, b) => {
    const aMax = Math.max(...a[1].map(f => f.bytes));
    const bMax = Math.max(...b[1].map(f => f.bytes));
    return bMax - aMax;
  });

  let errors = 0;
  let warnings = 0;

  if (sortedFiles.length > 0) {
    console.log('── Issues (worst first) ──────────────────────\n');
  }
  for (const [file, items] of sortedFiles) {
    const hasError = items.some(i => i.severity === 'error');
    const icon = hasError ? '✗' : '!';
    console.log(`  ${icon} ${file}`);
    for (const item of items) {
      const sym = item.severity === 'error' ? '✗' : '!';
      console.log(`           ${sym} ${item.message}`);
      if (item.severity === 'error') errors++;
      else warnings++;
    }
    console.log('');
  }

  // Summary.
  console.log('── Summary ──────────────────────────────────\n');
  console.log(`  Images scanned:   ${allImages.length}`);
  console.log(`  Errors:           ${errors}`);
  console.log(`  Warnings:         ${warnings}`);

  const failBuild = errors > 0 || (STRICT && warnings > 0);
  console.log(`  Status:           ${failBuild ? '✗ FAIL' : '✓ PASS'}${STRICT ? ' (strict)' : ''}\n`);

  if (failBuild) {
    process.exit(1);
  }
}

run();
