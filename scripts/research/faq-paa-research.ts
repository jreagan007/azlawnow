#!/usr/bin/env npx tsx
/**
 * FAQ vs Google "People Also Ask" alignment audit for AZ Law Now investigations.
 *
 * For each investigation MDX file, pulls Google PAA questions for the page's
 * primary legal keyword, compares them against the current frontmatter faqs[],
 * and writes a per-slug audit report showing:
 *   - which PAA questions are covered by current FAQs
 *   - which PAA questions are missing (suggested additions)
 *   - which current FAQs don't match any PAA query (candidates to rewrite)
 *
 * The azlawnow keyword strategy: tags like "car-accidents", "maricopa",
 * "bnsf" are expanded into real Google queries using the primaryKeyword
 * frontmatter field when present, else derived from tags + location context.
 *
 * Setup:
 *   .env must contain DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD
 *
 * Usage:
 *   npx tsx scripts/research/faq-paa-research.ts                  # all investigations
 *   npx tsx scripts/research/faq-paa-research.ts --slug=<slug>    # one investigation
 *   npx tsx scripts/research/faq-paa-research.ts --pa             # practice areas
 *   npx tsx scripts/research/faq-paa-research.ts --json           # JSON to stdout
 *
 * Cost: ~$0.003 per query via DataForSEO live/advanced SERP.
 * Cache: raw PAA JSON saved to data/seo/paa-pulls/<slug>.json so re-runs
 * don't re-pay. Pass --no-cache to force a fresh pull.
 *
 * Output:
 *   data/audits/faq-paa/<slug>.md       per-page audit
 *   data/audits/faq-paa/_summary.md     roll-up
 */

import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

config({ path: path.join(PROJECT_ROOT, '.env') });

const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN || '';
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD || '';

if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
  console.error('Missing DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD in .env');
  process.exit(1);
}

const args = process.argv.slice(2);
const slugArg = args.find((a) => a.startsWith('--slug='))?.split('=')[1];
const isPracticeAreas = args.includes('--pa');
const jsonOnly = args.includes('--json');
const noCache = args.includes('--no-cache');
const dryRun = args.includes('--dry-run');

const CONTENT_DIR = isPracticeAreas
  ? path.join(PROJECT_ROOT, 'src/content/practice-areas')
  : path.join(PROJECT_ROOT, 'src/content/investigations');

const PAA_CACHE_DIR = path.join(PROJECT_ROOT, 'data/seo/paa-pulls');
const AUDIT_DIR = path.join(PROJECT_ROOT, 'data/audits/faq-paa');
fs.mkdirSync(PAA_CACHE_DIR, { recursive: true });
fs.mkdirSync(AUDIT_DIR, { recursive: true });

// ── Keyword derivation ─────────────────────────────────────────────────────
// AZ law tags are like: "car-accidents", "bnsf", "sr-347", "maricopa", etc.
// We want real Google queries like "BNSF railroad crossing accident Arizona"
// not "bnsf maricopa" which is too vague.

const LOCATION_TAGS = new Set([
  'maricopa', 'phoenix', 'buckeye', 'goodyear', 'avondale', 'chandler',
  'mesa', 'tempe', 'scottsdale', 'gilbert', 'glendale', 'peoria',
  'pinal-county', 'maricopa-county', 'arizona', 'west-valley',
]);

// More-specific tags come before generic ones -- the map is checked in tag-array order
// so we need to sort/prioritize specific slugs first. We do that in deriveKeyword().
const TAG_TO_QUERY: Record<string, string> = {
  // Specific investigation topics (checked first)
  'bnsf': 'BNSF railroad crossing accident Arizona',
  'rail-safety': 'railroad crossing accident lawsuit Arizona',
  'fra-grade-crossings': 'FRA grade crossing railroad accident lawsuit',
  'sr-347': 'SR-347 Maricopa highway crash lawyer',
  'wrong-way-crashes': 'wrong-way driver crash lawsuit Arizona',
  'chameleon-carriers': 'unregistered carrier trucking accident lawsuit',
  'hours-of-service': 'fatigued truck driver accident Arizona',
  'heat-illness': 'Arizona heat illness workers compensation claim',
  'workers-comp': 'Arizona workers compensation heat denial',
  'adosh': 'Arizona OSHA heat violation workers comp',
  'utility-disconnects': 'APS utility disconnection death lawsuit Arizona',
  'heat-deaths': 'Arizona heat death utility shutoff lawsuit',
  'opioid-crisis': 'Arizona pharmacy opioid lawsuit',
  'dui': 'Arizona DUI crash injury lawsuit',
  'drunk-driving': 'Arizona drunk driving accident lawyer',
  'hit-and-run': 'Arizona hit and run crash lawyer',
  'hb2228': 'Arizona nursing home HB2228 elder abuse law',
  'nursing-home-abuse': 'Arizona nursing home abuse lawsuit',
  'medicaid-fraud': 'Arizona nursing home billing fraud Medicaid',
  'elder-care': 'Arizona elder care negligence lawsuit',
  'daycare-negligence': 'Arizona daycare negligence lawsuit',
  'child-abuse': 'Arizona child abuse negligence lawsuit',
  'school-abuse': 'Arizona school abuse restraint lawsuit',
  'school-restraint': 'Arizona school physical restraint injury lawsuit',
  'school-bus-accidents': 'Arizona school bus accident safety',
  'charter-schools': 'Arizona charter school fraud negligence',
  'educator-misconduct': 'Arizona teacher misconduct lawsuit',
  'career-schools': 'Arizona vocational school fraud lawsuit',
  'ice-detention': 'Arizona immigration detention rights lawsuit',
  'roundabouts': 'Arizona intersection design roundabout accident',
  'intersection-crashes': 'Arizona dangerous intersection crash lawyer',
  'intersection-safety': 'Arizona intersection crash injury lawyer',
  'e-scooter': 'e-scooter accident injury claim Arizona',
  'notice-of-claim': 'Arizona government injury notice of claim ARS 12-821',
  'premises-liability': 'Arizona premises liability lawyer',
  'indoor-air-quality': 'Arizona school air quality injury lawsuit',
  'picacho-water': 'Arizona water utility rate hike Picacho',
  'arizona-corporation-commission': 'Arizona utility rate hike consumer rights',
  // Generic legal topics (checked last for investigations)
  'car-accidents': 'Arizona car accident law',
  'truck-accidents': 'Arizona truck accident lawsuit',
  'i-10': 'I-10 Arizona crash injury lawyer',
  'wrongful-death': 'Arizona wrongful death claim',
  'pedestrian-accidents': 'Arizona pedestrian accident lawyer',
  'bicycle-accidents': 'Arizona bicycle accident lawyer',
  'motorcycle-accidents': 'Arizona motorcycle accident lawyer',
  'slip-and-fall': 'Arizona slip and fall injury claim',
  'medical-negligence': 'Arizona medical malpractice attorney',
  'rideshare-accidents': 'Arizona Uber Lyft accident lawyer',
  'dog-bite': 'Arizona dog bite lawyer',
  'bus-accidents': 'Arizona bus accident lawyer',
  'elder-abuse': 'Arizona elder abuse lawyer',
  'nursing-home': 'Arizona nursing home neglect lawyer',
  'fraud': 'Arizona consumer fraud lawsuit',
  'aps': 'APS Arizona utility consumer lawsuit',
};

// Priority score for keyword lookup: higher = more specific (wins over generic).
// Tags not in this map score 0. Generic legal topics score 1. Specific topics
// score 2+. The tag with the highest score wins.
const TAG_PRIORITY: Record<string, number> = {
  // Score 3: hyper-specific (event/entity-level)
  'bnsf': 3, 'fra-grade-crossings': 3, 'rail-safety': 3, 'sr-347': 3,
  'hb2228': 3, 'chameleon-carriers': 3, 'hours-of-service': 3, 'adosh': 3,
  'utility-disconnects': 3, 'heat-deaths': 3, 'opioid-crisis': 3,
  'dui': 3, 'drunk-driving': 3, 'hit-and-run': 3, 'wrong-way-crashes': 3,
  'school-restraint': 3, 'school-bus-accidents': 3, 'charter-schools': 3,
  'educator-misconduct': 3, 'career-schools': 3, 'ice-detention': 3,
  'roundabouts': 3, 'intersection-crashes': 3, 'intersection-safety': 3,
  'e-scooter': 3, 'notice-of-claim': 3, 'indoor-air-quality': 3,
  'picacho-water': 3, 'arizona-corporation-commission': 3,
  'medicaid-fraud': 3, 'billing-fraud': 3,
  // Score 2: topic-level
  'workers-comp': 2, 'heat-illness': 2, 'nursing-home-abuse': 2,
  'elder-care': 2, 'daycare-negligence': 2, 'child-abuse': 2,
  'school-abuse': 2, 'premises-liability': 2, 'slip-and-fall': 2,
  'medical-negligence': 2, 'rideshare-accidents': 2, 'dog-bite': 2,
  'bus-accidents': 2, 'elder-abuse': 2, 'nursing-home': 2, 'fraud': 2,
  // Score 1: generic (only used if nothing more specific)
  'car-accidents': 1, 'truck-accidents': 1, 'i-10': 1,
  'wrongful-death': 1, 'pedestrian-accidents': 1, 'bicycle-accidents': 1,
  'motorcycle-accidents': 1, 'aps': 1,
};

function deriveKeyword(frontmatter: Record<string, any>): string {
  // 1. Explicit primaryKeyword wins
  if (frontmatter.primaryKeyword && typeof frontmatter.primaryKeyword === 'string') {
    return frontmatter.primaryKeyword.trim();
  }

  const tags: string[] = (frontmatter.tags || []).map((t: string) => String(t));

  // 2. Pick the tag with the highest priority score that has a query mapping
  let bestTag = '';
  let bestScore = -1;
  for (const tag of tags) {
    const score = TAG_PRIORITY[tag] ?? 0;
    if (score > bestScore && TAG_TO_QUERY[tag]) {
      bestScore = score;
      bestTag = tag;
    }
  }
  if (bestTag) return TAG_TO_QUERY[bestTag];

  // 3. Fallback: humanize the non-location tags + "Arizona injury lawyer"
  const topicTags = tags
    .filter((t) => !LOCATION_TAGS.has(t))
    .slice(0, 2)
    .map((t) => t.replace(/-/g, ' '));

  if (topicTags.length > 0) {
    return topicTags.join(' ') + ' Arizona injury lawyer';
  }

  // 4. Last resort: title
  return ((frontmatter.title as string) || '').replace(/[.,:;!?]/g, '').slice(0, 80);
}

// ── DataForSEO PAA fetch ───────────────────────────────────────────────────
interface CachedPAA {
  keyword: string;
  pulled_at: string;
  questions: string[];
}

async function fetchPAA(keyword: string, cacheKey: string): Promise<string[]> {
  const cachePath = path.join(PAA_CACHE_DIR, `${cacheKey}.json`);

  if (!noCache && fs.existsSync(cachePath)) {
    const cached = JSON.parse(fs.readFileSync(cachePath, 'utf-8')) as CachedPAA;
    console.log(`    [cache] ${cached.questions.length} PAA questions`);
    return cached.questions;
  }

  const auth = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64');
  const body = [{
    keyword,
    language_code: 'en',
    location_code: 2840, // United States
    depth: 50,
    device: 'desktop',
    os: 'macos',
  }];

  const res = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error(`    DataForSEO error ${res.status}: ${await res.text().catch(() => '')}`);
    return [];
  }

  const data = (await res.json()) as any;
  const items = data?.tasks?.[0]?.result?.[0]?.items || [];

  const paa: string[] = [];
  for (const item of items) {
    if (item.type === 'people_also_ask' && Array.isArray(item.items)) {
      for (const el of item.items) {
        if (el?.title) paa.push(String(el.title).trim());
      }
    }
  }

  const unique = Array.from(new Set(paa));

  // Persist cache
  const cached: CachedPAA = {
    keyword,
    pulled_at: new Date().toISOString(),
    questions: unique,
  };
  fs.writeFileSync(cachePath, JSON.stringify(cached, null, 2));

  return unique;
}

// ── Similarity ────────────────────────────────────────────────────────────
const STOPWORDS = new Set([
  'the', 'a', 'an', 'of', 'and', 'or', 'is', 'are', 'was', 'were', 'in', 'on',
  'at', 'to', 'for', 'with', 'by', 'how', 'what', 'why', 'when', 'where',
  'who', 'which', 'this', 'that', 'these', 'those', 'do', 'does', 'did',
  'have', 'has', 'had', 'be', 'been', 'being', 'can', 'could', 'should',
  'would', 'may', 'might', 'will', 'about', 'from', 'into', 'after', 'before',
  'than', 'then', 'there', 'their', 'they', 'it', 'its',
]);

function tokenize(s: string): Set<string> {
  return new Set(
    s.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOPWORDS.has(t)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  const inter = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  return inter.size / union.size;
}

interface FAQ { question: string; answer: string }

function bestMatch(paaQ: string, faqs: FAQ[]): { faq: FAQ | null; score: number } {
  const paaTokens = tokenize(paaQ);
  let bestScore = 0;
  let best: FAQ | null = null;
  for (const f of faqs) {
    const score = jaccard(paaTokens, tokenize(f.question));
    if (score > bestScore) { bestScore = score; best = f; }
  }
  return { faq: best, score: bestScore };
}

// ── Audit ──────────────────────────────────────────────────────────────────
interface AuditRow {
  slug: string;
  keyword: string;
  paaCount: number;
  faqCount: number;
  coveredCount: number;
  missing: string[];
  unmatchedFaqs: string[];
}

const MATCH_THRESHOLD = 0.30; // slightly lower than meso (0.35) because legal queries are wordier

async function auditOne(slug: string): Promise<AuditRow> {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    return { slug, keyword: '', paaCount: 0, faqCount: 0, coveredCount: 0, missing: [], unmatchedFaqs: [] };
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data: fm } = matter(raw);
  const faqs: FAQ[] = (fm.faqs || []) as FAQ[];
  const keyword = deriveKeyword(fm);

  console.log(`\n▸ ${slug}`);
  console.log(`  keyword: ${keyword}`);
  console.log(`  current FAQs: ${faqs.length}`);

  const paaQuestions = await fetchPAA(keyword, slug);
  console.log(`  PAA returned: ${paaQuestions.length}`);

  const missing: string[] = [];
  const matchedFaqs = new Set<string>();

  for (const paaQ of paaQuestions) {
    const { faq, score } = bestMatch(paaQ, faqs);
    if (faq && score >= MATCH_THRESHOLD) {
      matchedFaqs.add(faq.question);
    } else {
      missing.push(paaQ);
    }
  }

  const unmatchedFaqs = faqs
    .filter((f) => !matchedFaqs.has(f.question))
    .map((f) => f.question);

  const row: AuditRow = {
    slug,
    keyword,
    paaCount: paaQuestions.length,
    faqCount: faqs.length,
    coveredCount: matchedFaqs.size,
    missing,
    unmatchedFaqs,
  };

  const md = renderReport(slug, keyword, paaQuestions, faqs, missing, unmatchedFaqs, matchedFaqs);
  fs.writeFileSync(path.join(AUDIT_DIR, `${slug}.md`), md);

  return row;
}

function renderReport(
  slug: string,
  keyword: string,
  paa: string[],
  faqs: FAQ[],
  missing: string[],
  unmatchedFaqs: string[],
  matchedFaqs: Set<string>,
): string {
  const today = new Date().toISOString().slice(0, 10);
  let md = `# FAQ vs PAA audit -- ${slug}\n\n`;
  md += `Generated: ${today}\n`;
  md += `Primary keyword: \`${keyword}\`\n`;
  md += `PAA questions returned: ${paa.length}\n`;
  md += `Current FAQs: ${faqs.length}\n`;
  md += `FAQs matching a PAA query (Jaccard >= ${MATCH_THRESHOLD}): ${matchedFaqs.size} / ${faqs.length}\n\n`;

  md += `## Google PAA questions for this topic\n\n`;
  if (paa.length === 0) {
    md += `No PAA returned.\n\n`;
  } else {
    md += paa.map((q, i) => `${i + 1}. ${q}`).join('\n') + '\n\n';
  }

  md += `## Current FAQs\n\n`;
  faqs.forEach((f, i) => {
    const matched = matchedFaqs.has(f.question);
    md += `${i + 1}. ${matched ? 'OK' : 'UNMATCHED'} ${f.question}\n`;
  });
  md += '\n';

  md += `## Suggested additions -- PAA queries not covered\n\n`;
  if (missing.length === 0) {
    md += `All PAA queries are covered.\n\n`;
  } else {
    md += missing.map((q, i) => `${i + 1}. **${q}**`).join('\n') + '\n\n';
  }

  md += `## Candidates to revise -- FAQs that don't match any PAA query\n\n`;
  if (unmatchedFaqs.length === 0) {
    md += `All FAQs match a PAA query.\n\n`;
  } else {
    md += unmatchedFaqs.map((q, i) => `${i + 1}. ${q}`).join('\n') + '\n\n';
  }

  return md;
}

function renderSummary(rows: AuditRow[]): string {
  const today = new Date().toISOString().slice(0, 10);
  let md = `# FAQ vs PAA coverage -- all pages\n\nGenerated: ${today}\n\n`;
  md += `| Slug | Keyword | PAA | FAQs | Covered | Missing |\n`;
  md += `|---|---|---:|---:|---:|---:|\n`;
  for (const r of rows.sort((a, b) => a.slug.localeCompare(b.slug))) {
    md += `| [${r.slug}](./${r.slug}.md) | ${r.keyword} | ${r.paaCount} | ${r.faqCount} | ${r.coveredCount} | ${r.missing.length} |\n`;
  }
  return md;
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const slugs = slugArg
    ? [slugArg]
    : fs.readdirSync(CONTENT_DIR)
        .filter((f) => f.endsWith('.mdx'))
        .map((f) => f.replace(/\.mdx$/, ''))
        .sort();

  console.log(`Auditing ${slugs.length} page(s) (${isPracticeAreas ? 'practice-areas' : 'investigations'})`);
  if (dryRun) console.log('DRY RUN');

  const rows: AuditRow[] = [];
  for (const slug of slugs) {
    try {
      rows.push(await auditOne(slug));
    } catch (err) {
      console.error(`Error on ${slug}:`, (err as Error).message);
    }
  }

  fs.writeFileSync(path.join(AUDIT_DIR, '_summary.md'), renderSummary(rows));

  if (jsonOnly) {
    process.stdout.write(JSON.stringify(rows, null, 2) + '\n');
  } else {
    console.log(`\nDone. ${rows.length} audit(s) written to ${AUDIT_DIR}/`);
    const totalMissing = rows.reduce((n, r) => n + r.missing.length, 0);
    console.log(`Total PAA queries not yet covered: ${totalMissing}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
