#!/usr/bin/env npx tsx
/**
 * Patch frontmatter faqs[] in AZ Law Now MDX files to align with real
 * Google PAA queries.
 *
 * Reads audit reports from data/audits/faq-paa/<slug>.md, which were
 * produced by faq-paa-research.ts. For each audit:
 *   - Replaces FAQs that don't match any PAA query with the top PAA
 *     queries that aren't yet covered (rewrite-to-PAA strategy).
 *   - Appends missing high-volume PAA queries up to the cap of 8 total.
 *   - Uses Perplexity sonar-pro to generate answers for any new questions.
 *
 * Voice: Brendan Franks, AZ Law Now editorial voice. Active voice,
 * contractions always, no em-dashes, no slogans, cite ARS statutes and
 * ADOT/FMCSA/AZ sources. Person-first language ("people who" not "victims").
 *
 * Usage:
 *   npx tsx scripts/research/faq-patch-from-paa.ts --dry-run         # preview only
 *   npx tsx scripts/research/faq-patch-from-paa.ts --slug=<slug>     # one file
 *   npx tsx scripts/research/faq-patch-from-paa.ts --limit=5         # first N
 *   npx tsx scripts/research/faq-patch-from-paa.ts                   # all audited
 *
 * Cache:
 *   data/audits/faq-paa/_perplexity-cache.json
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

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || '';
if (!PERPLEXITY_API_KEY) {
  console.error('Missing PERPLEXITY_API_KEY in .env');
  process.exit(1);
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const slugArg = args.find((a) => a.startsWith('--slug='))?.split('=')[1];
const limitArg = Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || '0');
const isPracticeAreas = args.includes('--pa');

const CONTENT_DIR = isPracticeAreas
  ? path.join(PROJECT_ROOT, 'src/content/practice-areas')
  : path.join(PROJECT_ROOT, 'src/content/investigations');

const AUDIT_DIR = path.join(PROJECT_ROOT, 'data/audits/faq-paa');
const CACHE_PATH = path.join(AUDIT_DIR, '_perplexity-cache.json');

const MAX_TOTAL_FAQS = 8;
const MAX_NEW_PER_PAGE = 4;

// ── Perplexity cache ───────────────────────────────────────────────────────
interface CacheEntry {
  answer: string;
  citations: string[];
  generated_at: string;
}
type Cache = Record<string, CacheEntry>;

function loadCache(): Cache {
  if (fs.existsSync(CACHE_PATH)) {
    try { return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8')); } catch {}
  }
  return {};
}

function saveCache(c: Cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(c, null, 2));
}

// ── Perplexity answer generation ───────────────────────────────────────────
const SYSTEM_PROMPT = `You are an editorial researcher for AZ Law Now, an Arizona personal injury journalism and law firm site. Write the answer to the user's FAQ question in 3 to 5 sentences. Hard rules:
- NEVER use em-dashes. Use commas, periods, or parentheses instead.
- Contractions always: don't, won't, it's, we're.
- Active voice. No throat-clearing ("It is worth noting that...").
- Cite Arizona statutes (ARS), ADOT, FMCSA, or other primary sources inline when relevant.
- Person-first language: "people injured" not "victims."
- No directive legal advice ("you should file"). Report what Arizona law allows.
- No marketing language. No "industry-leading," no "comprehensive," no "cutting-edge."
- Do not restate the question. Start the answer directly.
- Keep answers factual and evidence-based. Tie to real Arizona data where possible.
- Reference year (2024 or 2025) when you cite a statistic.`;

async function researchQuestion(question: string): Promise<CacheEntry> {
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: question },
      ],
      max_tokens: 300,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Perplexity ${res.status}: ${text.slice(0, 200)}`);
  }

  const json: any = await res.json();
  const answer = String(json?.choices?.[0]?.message?.content || '').trim();
  const citations = (json?.citations || []) as string[];
  return { answer: scrubAnswer(answer), citations, generated_at: new Date().toISOString() };
}

function scrubAnswer(a: string): string {
  // Strip citation numbers [1][2], collapse whitespace, replace any
  // stray em-dashes with a comma + space.
  return a
    .replace(/\[\d+\](?:\[\d+\])*/g, '')
    .replace(/\s+/g, ' ')
    .replace(/—/g, ', ')
    .replace(/ +\./g, '.')
    .trim();
}

// ── Audit report parser ────────────────────────────────────────────────────
interface AuditData {
  keyword: string;
  paa: string[];
  currentFaqs: string[];
  suggested: string[];
  unmatched: string[];
}

function parseAudit(slug: string): AuditData | null {
  const auditPath = path.join(AUDIT_DIR, `${slug}.md`);
  if (!fs.existsSync(auditPath)) return null;

  const text = fs.readFileSync(auditPath, 'utf-8');

  const extractKeyword = (): string => {
    const m = text.match(/Primary keyword:\s*`([^`]+)`/);
    return m ? m[1] : '';
  };

  const extractSection = (heading: string): string[] => {
    const re = new RegExp(`## ${heading}\\s*\\n+([\\s\\S]*?)(?:\\n## |$)`);
    const m = text.match(re);
    if (!m) return [];
    const out: string[] = [];
    for (const line of m[1].split('\n')) {
      // "N. OK Question" | "N. UNMATCHED Question" | "N. **Question**"
      const lm = line.match(/^\d+\.\s+(?:OK\s+|UNMATCHED\s+|\*\*)?(.+?)(?:\*\*)?\s*$/);
      if (lm && lm[1]) out.push(lm[1].trim());
    }
    return out;
  };

  return {
    keyword: extractKeyword(),
    paa: extractSection('Google PAA questions for this topic'),
    currentFaqs: extractSection('Current FAQs'),
    suggested: extractSection('Suggested additions -- PAA queries not covered'),
    unmatched: extractSection("Candidates to revise -- FAQs that don't match any PAA query"),
  };
}

// ── YAML frontmatter patcher ───────────────────────────────────────────────
interface FAQ { question: string; answer: string }

function patchFrontmatterFaqs(slug: string, newFaqs: FAQ[]): boolean {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return false;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = matter(raw);

  parsed.data.faqs = newFaqs;

  // Stringify back preserving the body. gray-matter's stringify() handles
  // YAML frontmatter correctly and won't corrupt MDX body content.
  const updated = matter.stringify(parsed.content, parsed.data);

  if (!dryRun) {
    fs.writeFileSync(filePath, updated, 'utf-8');
  }

  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const allSlugs = slugArg
    ? [slugArg]
    : fs.readdirSync(AUDIT_DIR)
        .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
        .map((f) => f.replace(/\.md$/, ''))
        .sort();

  const slugs = limitArg > 0 ? allSlugs.slice(0, limitArg) : allSlugs;
  const cache = loadCache();

  console.log(`Patch candidates: ${slugs.length} page(s)`);
  if (dryRun) console.log('DRY RUN -- no files will be written');

  let perplexityCalls = 0;
  let pagesPatched = 0;
  let faqsAdded = 0;
  let faqsRealigned = 0;

  for (const slug of slugs) {
    // Only patch files that exist in the target content directory
    const contentPath = path.join(CONTENT_DIR, `${slug}.mdx`);
    if (!fs.existsSync(contentPath)) continue;

    const audit = parseAudit(slug);
    if (!audit) {
      console.log(`\n${slug}: no audit file, skipping`);
      continue;
    }

    if (audit.paa.length === 0) {
      console.log(`\n${slug}: no PAA returned, skipping`);
      continue;
    }

    // Load current FAQs from the actual file
    const raw = fs.readFileSync(contentPath, 'utf-8');
    const { data: fm } = matter(raw);
    const currentFaqs: FAQ[] = (fm.faqs || []) as FAQ[];

    const headroom = MAX_TOTAL_FAQS - currentFaqs.length;

    // Determine PAA gaps: preferred = audit.suggested (already Jaccard-filtered)
    const candidates = audit.suggested.length > 0
      ? audit.suggested
      : audit.paa.filter((q) => !audit.currentFaqs.includes(q));

    if (candidates.length === 0 && audit.unmatched.length === 0) {
      console.log(`\n${slug}: all FAQs aligned, no gap`);
      continue;
    }

    const take = Math.min(headroom, MAX_NEW_PER_PAGE, candidates.length);
    const toAdd = candidates.slice(0, take);

    console.log(`\n▸ ${slug}`);
    if (toAdd.length > 0) console.log(`  adding ${toAdd.length} PAA-aligned FAQ(s)`);
    if (audit.unmatched.length > 0) console.log(`  ${audit.unmatched.length} existing FAQ(s) not PAA-matched (keeping for editorial continuity)`);

    // Generate answers for new questions
    const newFaqBlocks: FAQ[] = [];
    for (const q of toAdd) {
      let entry = cache[q];
      if (!entry) {
        console.log(`    fetch: ${q}`);
        try {
          entry = await researchQuestion(q);
          cache[q] = entry;
          perplexityCalls++;
          saveCache(cache);
        } catch (err: any) {
          console.error(`    error: ${q} -- ${err.message}`);
          continue;
        }
      } else {
        console.log(`    cached: ${q.slice(0, 70)}...`);
      }
      newFaqBlocks.push({ question: q, answer: entry.answer });
    }

    if (newFaqBlocks.length === 0) continue;

    // Append new FAQs to existing list
    const updatedFaqs = [...currentFaqs, ...newFaqBlocks];

    if (patchFrontmatterFaqs(slug, updatedFaqs)) {
      pagesPatched++;
      faqsAdded += newFaqBlocks.length;
      faqsRealigned += audit.unmatched.length; // FAQs that were unmatched (noted but kept)
      console.log(`  patched: ${updatedFaqs.length} total FAQs${dryRun ? ' (dry-run)' : ''}`);
    }
  }

  console.log(`\nDone.`);
  console.log(`Pages patched: ${pagesPatched}`);
  console.log(`FAQs added: ${faqsAdded}`);
  console.log(`Perplexity calls: ${perplexityCalls} (cache had ${Object.keys(cache).length} entries)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
