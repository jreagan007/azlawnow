#!/usr/bin/env npx tsx
/**
 * SERP Competition Checker — AZ Law Now
 * Queries DataForSEO SERP API for Arizona PI keywords from keyword-seeds.json.
 *
 * Usage:
 *   npx tsx scripts/check-serp-competition.ts
 *   npx tsx scripts/check-serp-competition.ts --cluster vehicle-crashes
 *   npx tsx scripts/check-serp-competition.ts --limit 5
 *   npx tsx scripts/check-serp-competition.ts --client azlawnow
 *   npx tsx scripts/check-serp-competition.ts --json
 *
 * Reads DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD from env (via .env).
 * Graceful exit 0 if creds absent — never a build gate.
 */

import 'dotenv/config';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ── Flags ────────────────────────────────────────────

const args = process.argv.slice(2);

function flag(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : undefined;
}

const CLUSTER_FILTER = flag('cluster');
const LIMIT = parseInt(flag('limit') ?? '10', 10);
const CLIENT = flag('client') ?? 'azlawnow';
const JSON_MODE = args.includes('--json');

// ── Credentials ──────────────────────────────────────

const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;

if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
  if (!JSON_MODE) {
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║    AZ Law Now — SERP Competition Check       ║');
    console.log('╚══════════════════════════════════════════════╝\n');
    console.log('  ! DATAFORSEO_LOGIN or DATAFORSEO_PASSWORD not set.');
    console.log('  ! Add them to .env to run live SERP queries.');
    console.log('  ! Skipping — not a build gate.\n');
  } else {
    console.log(JSON.stringify({ status: 'skipped', reason: 'credentials absent' }));
  }
  process.exit(0);
}

const AUTH = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64');
const API_BASE = 'https://api.dataforseo.com/v3';

// Arizona / Phoenix market — DataForSEO location code for Arizona (2004)
// Phoenix metro DMA: 753. We use Arizona state (2004) for broadest coverage.
const AZ_LOCATION_CODE = 2004;
const LANGUAGE_CODE = 'en';
const SERP_DEPTH = 10;

// ── Types ────────────────────────────────────────────

interface KeywordSeed {
  keyword: string;
  intent: 'action' | 'research' | 'informational' | 'local' | 'process';
}

interface KeywordSeeds {
  clusters: Record<string, KeywordSeed[]>;
}

interface SerpItem {
  type: string;
  rank_absolute: number;
  url: string;
  title: string;
  description?: string;
}

interface CompetitorResult {
  cluster: string;
  keyword: string;
  intent: string;
  results: Array<{
    rank: number;
    domain: string;
    url: string;
    title: string;
  }>;
  error?: string;
}

// ── Seed loader ──────────────────────────────────────

const SEEDS_PATH = join(process.cwd(), 'scripts/seo/keyword-seeds.json');

function loadSeeds(): KeywordSeeds {
  if (!existsSync(SEEDS_PATH)) {
    console.error(`  ✗ keyword-seeds.json not found at ${SEEDS_PATH}`);
    process.exit(1);
  }
  const raw = readFileSync(SEEDS_PATH, 'utf-8');
  return JSON.parse(raw) as KeywordSeeds;
}

function getTargetKeywords(seeds: KeywordSeeds): Array<KeywordSeed & { cluster: string }> {
  const out: Array<KeywordSeed & { cluster: string }> = [];
  for (const [cluster, kws] of Object.entries(seeds.clusters)) {
    if (CLUSTER_FILTER && cluster !== CLUSTER_FILTER) continue;
    for (const kw of kws) {
      out.push({ ...kw, cluster });
    }
  }
  return out.slice(0, LIMIT);
}

// ── DataForSEO SERP call ─────────────────────────────

async function getSERP(keyword: string): Promise<SerpItem[]> {
  const response = await fetch(`${API_BASE}/serp/google/organic/live/regular`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${AUTH}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      {
        keyword,
        location_code: AZ_LOCATION_CODE,
        language_code: LANGUAGE_CODE,
        depth: SERP_DEPTH,
      },
    ]),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for keyword: ${keyword}`);
  }

  const data = (await response.json()) as {
    tasks?: Array<{ result?: Array<{ items?: SerpItem[] }> }>;
  };
  return data.tasks?.[0]?.result?.[0]?.items ?? [];
}

function parseDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// ── Competition classifier ───────────────────────────

function classify(domain: string): string {
  const legal = [
    'justia.com',
    'findlaw.com',
    'nolo.com',
    'lawyers.com',
    'avvo.com',
    'martindale.com',
    'superlawyers.com',
    'lawinfo.com',
    'hg.org',
    'legalmatch.com',
  ];
  const news = ['azcentral.com', 'azfamily.com', 'abc15.com', '12news.com', 'ktar.com'];
  const gov = ['.gov', 'azcourts.gov', 'azleg.gov', 'azdot.gov'];

  if (gov.some(g => domain.endsWith(g))) return 'gov';
  if (news.some(n => domain === n)) return 'news';
  if (legal.some(l => domain === l)) return 'directory';
  return 'firm/other';
}

// ── Main ─────────────────────────────────────────────

async function run() {
  const seeds = loadSeeds();
  const keywords = getTargetKeywords(seeds);

  if (!JSON_MODE) {
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║    AZ Law Now — SERP Competition Check       ║');
    console.log(`║    Client: ${CLIENT.padEnd(34)}║`);
    console.log(`║    Market: Arizona (location ${AZ_LOCATION_CODE})         ║`);
    console.log(`║    Keywords: ${String(keywords.length).padEnd(33)}║`);
    if (CLUSTER_FILTER) {
      console.log(`║    Cluster filter: ${CLUSTER_FILTER.padEnd(26)}║`);
    }
    console.log('╚══════════════════════════════════════════════╝\n');
  }

  const allResults: CompetitorResult[] = [];

  for (const kw of keywords) {
    if (!JSON_MODE) {
      console.log(`── "${kw.keyword}"  [${kw.cluster} / ${kw.intent}] ──────────────\n`);
    }

    let items: SerpItem[] = [];
    let error: string | undefined;

    try {
      items = await getSERP(kw.keyword);
      // Rate limit: 300ms between calls
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      if (!JSON_MODE) {
        console.log(`  ✗ Error: ${error}\n`);
      }
    }

    const organic = items.filter(i => i.type === 'organic').slice(0, SERP_DEPTH);
    const resultRows = organic.map(item => ({
      rank: item.rank_absolute,
      domain: parseDomain(item.url),
      url: item.url,
      title: item.title,
    }));

    allResults.push({
      cluster: kw.cluster,
      keyword: kw.keyword,
      intent: kw.intent,
      results: resultRows,
      ...(error ? { error } : {}),
    });

    if (!JSON_MODE && !error) {
      console.log('  Rank  Domain                           Type');
      console.log('  ────  ───────────────────────────────  ─────────────');
      for (const row of resultRows) {
        const type = classify(row.domain);
        const domainPad = row.domain.slice(0, 33).padEnd(33);
        const rankPad = String(row.rank).padStart(4);
        const marker =
          type === 'gov' ? '  gov ' :
          type === 'news' ? '  news' :
          type === 'directory' ? '  dir ' :
          '      ';
        console.log(`  ${rankPad}  ${domainPad}${marker} ${type}`);
      }

      // Opportunity summary: how many non-directory/non-gov positions in top 5
      const top5 = resultRows.slice(0, 5);
      const beatable = top5.filter(r => !['gov', 'directory'].includes(classify(r.domain)));
      if (beatable.length >= 3) {
        console.log(`\n  ✓ Opportunity: ${beatable.length}/5 top results are firm/news (beatable)`);
      } else if (beatable.length >= 1) {
        console.log(`\n  ! Moderate: ${beatable.length}/5 top results are firm/news`);
      } else {
        console.log(`\n  ✗ Tough: directories and gov dominate top 5`);
      }
      console.log('');
    }
  }

  if (JSON_MODE) {
    console.log(
      JSON.stringify(
        {
          client: CLIENT,
          market: 'Arizona',
          locationCode: AZ_LOCATION_CODE,
          runAt: new Date().toISOString(),
          cluster: CLUSTER_FILTER ?? 'all',
          limit: LIMIT,
          results: allResults,
        },
        null,
        2
      )
    );
    return;
  }

  // Summary
  console.log('── Summary ──────────────────────────────────\n');
  const success = allResults.filter(r => !r.error && r.results.length > 0);
  const errored = allResults.filter(r => r.error);
  const opportunities = success.filter(r => {
    const top5 = r.results.slice(0, 5);
    return top5.filter(row => !['gov', 'directory'].includes(classify(row.domain))).length >= 3;
  });

  console.log(`  Keywords queried: ${allResults.length}`);
  console.log(`  Successful:       ${success.length}`);
  console.log(`  Errored:          ${errored.length}`);
  console.log(`  Opportunities:    ${opportunities.length} keywords with ≥3 beatable top-5 slots`);
  console.log(`  Status:           ✓ PASS (advisory — not a build gate)\n`);
}

run().catch(err => {
  console.error(`\n  ✗ Fatal: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
