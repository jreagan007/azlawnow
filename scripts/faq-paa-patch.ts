#!/usr/bin/env npx tsx
/**
 * FAQ-PAA patcher — AZ Law Now
 *
 * Appends PAA-aligned FAQs to MDX frontmatter faqs[] without touching any
 * other frontmatter field. Uses raw-text injection (no gray-matter.stringify)
 * so inline tags: ["a","b"] format is preserved exactly.
 *
 * Reads:  data/audits/faq-paa/<slug>.md  (pre-built audit reports)
 * Writes: src/content/<dir>/<slug>.mdx
 *
 * Usage:
 *   npx tsx scripts/faq-paa-patch.ts --dry-run
 *   npx tsx scripts/faq-paa-patch.ts --slug=coolidge-daycare-19-families-lawsuit
 *   npx tsx scripts/faq-paa-patch.ts --limit=5
 *   npx tsx scripts/faq-paa-patch.ts --pa           # practice-areas mode
 *   npx tsx scripts/faq-paa-patch.ts                # all audited investigations
 */

import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

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

// Cap from task instructions
const MAX_TOTAL_FAQS = 12;
// Max new FAQs per page per run
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

// ── Perplexity ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an editorial researcher for AZ Law Now, an Arizona personal injury journalism and law firm site. Write the answer to the user's FAQ question in 3 to 5 sentences. Hard rules:
- NEVER use em-dashes. Use commas, periods, or parentheses instead.
- Contractions always: don't, won't, it's, we're.
- Active voice. No throat-clearing.
- Cite Arizona statutes (ARS), ADOT, FMCSA, or other primary sources inline when relevant.
- Person-first language: "people injured" not "victims."
- No directive legal advice. Report what Arizona law allows.
- No marketing language.
- Do not restate the question. Start the answer directly.
- Keep answers factual and evidence-based. Tie to real Arizona data where possible.
- Reference year (2024 or 2025) when you cite a statistic.
- Answer must be 60 to 180 words. Aim for 90 to 130 words.`;

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
      max_tokens: 350,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Perplexity ${res.status}: ${text.slice(0, 200)}`);
  }

  const json: any = await res.json();
  const raw = String(json?.choices?.[0]?.message?.content || '').trim();
  const answer = scrubAnswer(raw);
  const citations = (json?.citations || []) as string[];
  return { answer, citations, generated_at: new Date().toISOString() };
}

function scrubAnswer(a: string): string {
  return a
    .replace(/\[\d+\](?:\[\d+\])*/g, '')
    .replace(/\s+/g, ' ')
    .replace(/—/g, ', ')  // em-dash to comma+space
    .replace(/–/g, ' to ')  // en-dash to " to "
    .replace(/ +\./g, '.')
    .replace(/cannot\b/gi, "can't")
    .replace(/\bdo not\b/gi, "don't")
    .replace(/\bwill not\b/gi, "won't")
    .replace(/\bit is\b(?! worth)/gi, "it's")
    .replace(/\bdoes not\b/gi, "doesn't")
    .replace(/\bis not\b/gi, "isn't")
    .replace(/\bare not\b/gi, "aren't")
    .replace(/\bwe are\b/gi, "we're")
    .trim();
}

// ── Audit parser ───────────────────────────────────────────────────────────

function parseSuggestedFromAudit(slug: string): string[] {
  const auditPath = path.join(AUDIT_DIR, `${slug}.md`);
  if (!fs.existsSync(auditPath)) return [];

  const text = fs.readFileSync(auditPath, 'utf-8');
  const questions: string[] = [];

  // Find the "Suggested additions" section
  const sectionMatch = text.match(/## Suggested additions[^\n]*\n+([\s\S]*?)(?:\n## |$)/);
  if (!sectionMatch) return [];

  const section = sectionMatch[1];
  if (section.includes('All PAA queries are covered')) return [];

  for (const line of section.split('\n')) {
    // Match "1. **Question text?**" or "1. Question text?"
    const m = line.match(/^\d+\.\s+(?:\*\*)?(.+?)(?:\*\*)?\s*$/);
    if (m && m[1]) {
      questions.push(m[1].trim());
    }
  }

  return questions;
}

// ── MDX frontmatter raw-text patcher ──────────────────────────────────────

interface FAQ {
  question: string;
  answer: string;
}

/**
 * Count existing FAQs by counting "  - question:" lines in frontmatter.
 * Uses raw text to avoid gray-matter dependency.
 */
function countExistingFaqs(raw: string): number {
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return 0;
  const fm = fmMatch[1];
  const matches = fm.match(/^\s{2,}- question:/gm);
  return matches ? matches.length : 0;
}

/**
 * Escape a string for YAML double-quoted scalar.
 * Only escapes backslash and double-quote.
 */
function yamlEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Build a YAML FAQ block line for appending.
 * Format matches the existing Wave 1 convention:
 *   - question: "..."
 *     answer: "..."
 */
function faqToYaml(faq: FAQ): string {
  return `  - question: "${yamlEscape(faq.question)}"\n    answer: "${yamlEscape(faq.answer)}"`;
}

/**
 * Append new FAQ entries to the MDX file using raw-text injection.
 * Finds the last existing FAQ entry (or the "faqs:" header if no entries)
 * and splices in the new lines. Never touches tags or any other field.
 */
function appendFaqsToFile(filePath: string, newFaqs: FAQ[]): boolean {
  if (newFaqs.length === 0) return false;

  const raw = fs.readFileSync(filePath, 'utf-8');

  // Locate the frontmatter block
  const fmEndMatch = raw.match(/^---\n[\s\S]*?\n---/);
  if (!fmEndMatch) {
    console.error(`  Cannot find frontmatter in ${path.basename(filePath)}`);
    return false;
  }

  const fmBlock = fmEndMatch[0];

  // Strategy: find the last "  - question:" or "    answer:" line in the frontmatter,
  // then find the end of that answer line, and inject new FAQs after it.
  // We look for the answer line that follows the last question entry.

  // Split frontmatter into lines to find insertion point
  const fmLines = fmBlock.split('\n');
  let lastFaqLineIdx = -1;

  for (let i = 0; i < fmLines.length; i++) {
    if (/^\s{2,}- question:/.test(fmLines[i]) || /^\s{4,}answer:/.test(fmLines[i])) {
      lastFaqLineIdx = i;
    }
  }

  let insertAfterLine: number;

  if (lastFaqLineIdx === -1) {
    // No existing FAQs, find the "faqs:" line
    const faqsLineIdx = fmLines.findIndex((l) => /^faqs:\s*$/.test(l));
    if (faqsLineIdx === -1) {
      console.error(`  No faqs: field in ${path.basename(filePath)}`);
      return false;
    }
    insertAfterLine = faqsLineIdx;
  } else {
    insertAfterLine = lastFaqLineIdx;
  }

  // Build the new FAQ YAML lines
  const newLines = newFaqs.map(faqToYaml).join('\n');

  // Reconstruct frontmatter with new lines injected
  const before = fmLines.slice(0, insertAfterLine + 1).join('\n');
  const after = fmLines.slice(insertAfterLine + 1).join('\n');

  const newFmBlock = before + '\n' + newLines + '\n' + after;

  // Replace the original frontmatter block in the full file
  const updatedRaw = raw.replace(fmBlock, newFmBlock);

  if (!dryRun) {
    fs.writeFileSync(filePath, updatedRaw, 'utf-8');
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

  console.log(`Patch candidates: ${slugs.length} audit file(s)`);
  console.log(`Content dir: ${CONTENT_DIR}`);
  if (dryRun) console.log('DRY RUN -- no files will be written');

  let perplexityCalls = 0;
  let pagesPatched = 0;
  let faqsAdded = 0;

  for (const slug of slugs) {
    const contentPath = path.join(CONTENT_DIR, `${slug}.mdx`);
    if (!fs.existsSync(contentPath)) {
      continue; // silently skip slugs not in this content dir
    }

    const suggested = parseSuggestedFromAudit(slug);
    if (suggested.length === 0) {
      console.log(`\n${slug}: no suggested additions, skipping`);
      continue;
    }

    const raw = fs.readFileSync(contentPath, 'utf-8');
    const currentCount = countExistingFaqs(raw);
    const headroom = MAX_TOTAL_FAQS - currentCount;

    if (headroom <= 0) {
      console.log(`\n${slug}: already at cap (${currentCount} FAQs)`);
      continue;
    }

    const take = Math.min(headroom, MAX_NEW_PER_PAGE, suggested.length);
    const toAdd = suggested.slice(0, take);

    console.log(`\n${slug} (${currentCount} existing, adding ${toAdd.length})`);

    const newFaqBlocks: FAQ[] = [];
    for (const q of toAdd) {
      let entry = cache[q];
      if (!entry) {
        console.log(`  fetch: ${q.slice(0, 75)}`);
        try {
          entry = await researchQuestion(q);
          cache[q] = entry;
          perplexityCalls++;
          saveCache(cache);
        } catch (err: any) {
          console.error(`  error on "${q}": ${err.message}`);
          continue;
        }
      } else {
        console.log(`  cached: ${q.slice(0, 75)}`);
      }
      newFaqBlocks.push({ question: q, answer: entry.answer });
    }

    if (newFaqBlocks.length === 0) {
      console.log(`  no answers generated, skipping`);
      continue;
    }

    if (appendFaqsToFile(contentPath, newFaqBlocks)) {
      pagesPatched++;
      faqsAdded += newFaqBlocks.length;
      console.log(`  patched: ${currentCount + newFaqBlocks.length} total FAQs${dryRun ? ' (dry-run)' : ''}`);
    }
  }

  console.log(`\nDone.`);
  console.log(`Pages patched: ${pagesPatched}`);
  console.log(`FAQs added: ${faqsAdded}`);
  console.log(`Perplexity calls (live): ${perplexityCalls} (cache had ${Object.keys(cache).length} entries)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
