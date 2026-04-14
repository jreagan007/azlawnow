/**
 * Internal Link Health — AZ Law Now
 *
 * Walks every MDX and .astro file. Extracts internal hrefs. Resolves each
 * to a real page in src/pages or a content collection entry. Flags any
 * internal link that doesn't land on anything.
 *
 * Usage:
 *   npx tsx scripts/check-sources.ts            # advisory
 *   npx tsx scripts/check-sources.ts --strict   # CI mode (any broken link fails)
 *
 * What it skips:
 *   - External links (http://, https://, mailto:, tel:)
 *   - Anchor-only links (#foo)
 *   - Asset paths (/images/, /fonts/, /favicons/, /og/, /robots.txt, etc.)
 *   - Data URIs and protocol-relative links
 *
 * What it checks:
 *   - /about/, /contact/, /buckeye/, etc. → src/pages/*.astro
 *   - /insights/foo/ → src/content/insights/foo.mdx
 *   - /client-guides/foo/, /legal-guides/foo/, /practice-areas/foo/, /glossary/foo/
 *   - Fragments and query strings are stripped before resolution
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join, extname, relative } from 'path';

const STRICT = process.argv.includes('--strict');
const ROOT = process.cwd();

const COLLECTION_DIRS: Record<string, string> = {
  insights: join(ROOT, 'src/content/insights'),
  'client-guides': join(ROOT, 'src/content/client-guides'),
  'legal-guides': join(ROOT, 'src/content/legal-guides'),
  'practice-areas': join(ROOT, 'src/content/practice-areas'),
  glossary: join(ROOT, 'src/content/glossary'),
};

const PAGES_DIR = join(ROOT, 'src/pages');

// Asset prefixes that resolve against /public/ at runtime. Treat as pass.
const ASSET_PREFIXES = [
  '/images/',
  '/fonts/',
  '/favicons/',
  '/og/',
  '/logos/',
  '/robots.txt',
  '/site.webmanifest',
  '/sitemap',
  '/favicon.',
];

interface Finding {
  severity: 'error';
  file: string;
  href: string;
  line: number;
  message: string;
}

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

function extractHrefs(source: string): Array<{ href: string; line: number }> {
  const hits: Array<{ href: string; line: number }> = [];
  const lines = source.split('\n');

  // Markdown link: [text](/path)
  const mdPattern = /\]\((\/[^)\s]+)\)/g;
  // HTML/JSX href: href="/path" or href='/path'
  const hrefPattern = /\bhref=["'](\/[^"']+)["']/g;
  // to="/path" (Astro <a> and components)
  const toPattern = /\bto=["'](\/[^"']+)["']/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const re of [mdPattern, hrefPattern, toPattern]) {
      let m: RegExpExecArray | null;
      const local = new RegExp(re.source, re.flags);
      while ((m = local.exec(line)) !== null) {
        hits.push({ href: m[1], line: i + 1 });
      }
    }
  }
  return hits;
}

function isAsset(href: string): boolean {
  return ASSET_PREFIXES.some(prefix => href.startsWith(prefix));
}

function isExternal(href: string): boolean {
  return (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('//') ||
    href.startsWith('data:')
  );
}

/**
 * Resolve an internal href to a filesystem target.
 * Strips query and fragment first. Returns true if the target exists.
 */
function resolveInternal(href: string, pageRoutes: Set<string>, collectionEntries: Set<string>): boolean {
  // Strip fragment and query.
  let path = href.split('#')[0].split('?')[0];
  // Normalize trailing slash: both /foo and /foo/ should resolve the same.
  if (path.endsWith('/') && path.length > 1) path = path.slice(0, -1);
  if (path === '' || path === '/') return true; // homepage

  // Collection route? /insights/foo
  const segments = path.slice(1).split('/');
  if (segments.length >= 2 && COLLECTION_DIRS[segments[0]]) {
    const key = `${segments[0]}/${segments.slice(1).join('/')}`;
    return collectionEntries.has(key);
  }

  // Collection hub? /insights, /client-guides, etc. These are rendered by
  // pages (src/pages/insights/index.astro, or by collection route files).
  if (segments.length === 1 && COLLECTION_DIRS[segments[0]]) {
    return pageRoutes.has(path) || pageRoutes.has(`${path}/`) || pageRoutes.has(segments[0]);
  }

  // Static page? Check src/pages/.
  return pageRoutes.has(path) || pageRoutes.has(`${path}/`);
}

function collectPageRoutes(): Set<string> {
  const routes = new Set<string>();
  const pageFiles = walk(PAGES_DIR, ['.astro']);
  for (const p of pageFiles) {
    const rel = relative(PAGES_DIR, p).replace(/\\/g, '/');
    // src/pages/foo.astro          -> /foo
    // src/pages/foo/index.astro    -> /foo
    // src/pages/foo/bar.astro      -> /foo/bar
    // src/pages/[...slug].astro    -> skip (dynamic)
    if (rel.includes('[') || rel.includes(']')) continue;
    let route = '/' + rel.replace(/\.astro$/, '');
    route = route.replace(/\/index$/, '');
    if (route === '/index') route = '/';
    routes.add(route);
  }
  return routes;
}

function collectCollectionEntries(): Set<string> {
  const entries = new Set<string>();
  for (const [name, dir] of Object.entries(COLLECTION_DIRS)) {
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir).filter(f => f.endsWith('.mdx'));
    for (const f of files) {
      entries.add(`${name}/${f.replace(/\.mdx$/, '')}`);
    }
  }
  return entries;
}

function run() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║    AZ Law Now — Internal Link Audit          ║');
  console.log(`║    Mode: ${STRICT ? 'STRICT (broken links fail build) ' : 'advisory                          '}║`);
  console.log('╚══════════════════════════════════════════════╝\n');

  const pageRoutes = collectPageRoutes();
  const collectionEntries = collectCollectionEntries();

  const contentFiles = [
    ...walk(join(ROOT, 'src/content'), ['.mdx']),
    ...walk(PAGES_DIR, ['.astro']),
  ];

  const findings: Finding[] = [];
  let totalLinks = 0;
  let externalLinks = 0;
  let assetLinks = 0;
  let internalLinks = 0;

  for (const filePath of contentFiles) {
    const content = readFileSync(filePath, 'utf-8');
    const hrefs = extractHrefs(content);
    const rel = relative(ROOT, filePath);

    for (const { href, line } of hrefs) {
      totalLinks++;
      if (isExternal(href)) {
        externalLinks++;
        continue;
      }
      if (isAsset(href)) {
        assetLinks++;
        continue;
      }
      internalLinks++;
      if (!resolveInternal(href, pageRoutes, collectionEntries)) {
        findings.push({
          severity: 'error',
          file: rel,
          href,
          line,
          message: `Broken internal link: ${href}`,
        });
      }
    }
  }

  // Group findings by file.
  const byFile = new Map<string, Finding[]>();
  for (const f of findings) {
    if (!byFile.has(f.file)) byFile.set(f.file, []);
    byFile.get(f.file)!.push(f);
  }

  if (findings.length > 0) {
    console.log('── Broken internal links ──────────────────────\n');
    for (const [file, items] of byFile) {
      console.log(`  ✗ ${file}`);
      for (const item of items) {
        console.log(`           ✗ line ${item.line}: ${item.href}`);
      }
      console.log('');
    }
  }

  console.log('── Summary ──────────────────────────────────\n');
  console.log(`  Files scanned:    ${contentFiles.length}`);
  console.log(`  Routes indexed:   ${pageRoutes.size} pages, ${collectionEntries.size} collection entries`);
  console.log(`  Links found:      ${totalLinks}  (${internalLinks} internal, ${externalLinks} external, ${assetLinks} assets)`);
  console.log(`  Broken internal:  ${findings.length}`);

  const failBuild = findings.length > 0;
  console.log(`  Status:           ${failBuild ? '✗ FAIL' : '✓ PASS'}${STRICT ? ' (strict)' : ''}\n`);

  if (failBuild && STRICT) {
    process.exit(1);
  }
  if (failBuild) {
    // Advisory mode: exit 0 even with broken links, but report loudly.
    process.exit(0);
  }
}

run();
