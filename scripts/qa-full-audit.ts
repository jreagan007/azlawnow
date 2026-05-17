#!/usr/bin/env tsx
/**
 * Full QA Orchestrator — AZ Law Now
 *
 * Built bespoke for the 5-collection topology. Runs the full QA check
 * chain in the correct order, aggregates results, and emits a summary
 * table. NOT a port of mesowatch's qa-full-audit.ts (which was
 * mesowatch-specific); this is a clean orchestrator for az-law-now.
 *
 * Chain order (matches Netlify intent from BUILD-SPEC §D):
 *   1. check:quality        — writing style, voice rules, word counts
 *   2. check:sources        — internal link health
 *   3. check:ai-patterns    — AI-pattern diagnostic
 *   4. check:og             — OG image guardrail
 *   5. check:images         — image asset existence
 *   6. check:programmatic   — programmatic page value gate
 *   7. check:claims         — factual claim inventory (advisory, never fails)
 *
 * NOT included here (network / CI-only):
 *   check:schema, check:serp, check:meta
 *
 * AZ-PI notes vs mesowatch:
 *   - No medicallyReviewed check (field not in AZ-PI schemas)
 *   - Glossary collection: word-count gate skipped (short-form definitional)
 *   - ARS-specificity awareness comes from check:quality + check:ai-patterns
 *   - check:claims is always advisory (human-review, never a build gate)
 *
 * Usage:
 *   npx tsx scripts/qa-full-audit.ts              # advisory (exit 0 on warns)
 *   npx tsx scripts/qa-full-audit.ts --strict     # CI mode (warns fail)
 *   npx tsx scripts/qa-full-audit.ts --fix        # pass --fix to ai-patterns
 *   npx tsx scripts/qa-full-audit.ts --skip-claims # omit claim inventory
 *
 * Exit codes:
 *   0 = all checks pass (or advisory with only warnings)
 *   1 = one or more checks failed
 */

import { execSync } from 'child_process';

const ROOT = process.cwd();

// ── Arg parsing ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const FIX = args.includes('--fix');
const SKIP_CLAIMS = args.includes('--skip-claims');

// ── Types ────────────────────────────────────────────────────────────────────

interface CheckResult {
  name: string;
  command: string;
  status: 'pass' | 'fail' | 'warn' | 'skip' | 'advisory';
  exitCode: number;
  durationMs: number;
  advisory: boolean;
  output: string;
}

// ── Check runner ─────────────────────────────────────────────────────────────

function runCheck(
  name: string,
  command: string,
  opts: { advisory?: boolean; skip?: boolean } = {},
): CheckResult {
  if (opts.skip) {
    return { name, command, status: 'skip', exitCode: 0, durationMs: 0, advisory: opts.advisory ?? false, output: '' };
  }

  const start = Date.now();
  let exitCode = 0;
  let output = '';

  try {
    output = execSync(command, {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['inherit', 'pipe', 'pipe'],
    });
  } catch (e: any) {
    exitCode = e.status ?? 1;
    output = (e.stdout ?? '') + (e.stderr ?? '');
  }

  const durationMs = Date.now() - start;

  let status: CheckResult['status'];
  if (exitCode === 0) {
    status = 'pass';
  } else if (opts.advisory) {
    // Advisory checks never hard-fail the orchestrator regardless of exit code
    status = 'advisory';
  } else {
    // exit 2 from ai-patterns --strict = flagged but non-fatal in non-strict mode
    status = (exitCode === 2 && !STRICT) ? 'warn' : 'fail';
  }

  return { name, command, status, exitCode, durationMs, advisory: opts.advisory ?? false, output };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function icon(s: CheckResult['status']): string {
  switch (s) {
    case 'pass':     return '✓';
    case 'fail':     return '✗';
    case 'warn':     return '!';
    case 'advisory': return 'i';
    case 'skip':     return '-';
  }
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}

// ── Summary table ────────────────────────────────────────────────────────────

function printSummary(results: CheckResult[]) {
  const line = '-'.repeat(74);
  console.log('\n' + line);
  console.log('AZ Law Now -- QA Full Audit Summary');
  console.log(line);
  console.log(`${pad('Check', 28)} ${pad('Status', 12)} ${pad('Time', 7)} Command`);
  console.log(line);

  for (const r of results) {
    const ic = icon(r.status);
    const labelRaw = r.status === 'advisory'
      ? 'advisory'
      : r.status === 'skip'
        ? 'skipped'
        : r.status.toUpperCase();
    const label = r.advisory && r.status !== 'skip' ? labelRaw + '*' : labelRaw;
    const timeStr = r.status === 'skip' ? '--' : `${(r.durationMs / 1000).toFixed(1)}s`;
    console.log(`${ic} ${pad(r.name, 26)} ${pad(label, 12)} ${pad(timeStr, 7)} ${r.command}`);
  }

  console.log(line);

  const passes   = results.filter(r => r.status === 'pass').length;
  const fails    = results.filter(r => r.status === 'fail').length;
  const warns    = results.filter(r => r.status === 'warn').length;
  const skips    = results.filter(r => r.status === 'skip').length;
  const advs     = results.filter(r => r.status === 'advisory').length;

  console.log(`  Passed:    ${passes}`);
  console.log(`  Failed:    ${fails}`);
  console.log(`  Warned:    ${warns}  (* advisory — will not block build)`);
  console.log(`  Advisory:  ${advs}  (* see claim-inventory.json for human review)`);
  console.log(`  Skipped:   ${skips}`);
  console.log('');

  const hasFail      = results.some(r => r.status === 'fail');
  const hasHardWarn  = STRICT && results.some(r => r.status === 'warn');

  let finalStatus: string;
  if (hasFail || hasHardWarn) {
    finalStatus = '✗ FAIL' + (hasHardWarn && !hasFail ? ' (strict -- warnings treated as errors)' : '');
  } else if (warns > 0) {
    finalStatus = '! WARN (advisory -- re-run with --strict to enforce)';
  } else {
    finalStatus = '✓ PASS';
  }

  console.log(`  Status:    ${finalStatus}\n`);

  if (advs > 0) {
    console.log('  Advisory checks (marked *) are never build gates:');
    console.log('    check:claims   -> data/audits/claim-inventory.json  (human review)');
    console.log('    check:ai-patterns -> advisory until 2 clean cycles; then promote to strict');
    console.log('');
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║    AZ Law Now -- Full QA Audit               ║');
  console.log(`║    Mode: ${STRICT ? 'STRICT (warnings fail build)     ' : 'advisory                          '}║`);
  console.log(`║    ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC                   ║`);
  console.log('╚══════════════════════════════════════════════╝\n');

  const strictFlag = STRICT ? ' --strict' : '';
  const fixFlag    = FIX    ? ' --fix'    : '';

  // Ordered check chain. advisory:true means the check's exit code never
  // contributes to the orchestrator's own exit code.
  const checks: Array<[string, string, { advisory?: boolean; skip?: boolean }]> = [
    ['quality',          `npx tsx scripts/audit-quality.ts${strictFlag}`,        { advisory: false }],
    ['sources',          `npx tsx scripts/check-sources.ts${strictFlag}`,         { advisory: false }],
    ['ai-patterns',      `npx tsx scripts/audit-ai-patterns.ts${strictFlag}${fixFlag}`, { advisory: !STRICT }],
    ['og',               `npx tsx scripts/og-guardrail.ts`,                       { advisory: false }],
    ['images',           `npx tsx scripts/check-images.ts${strictFlag}`,          { advisory: false }],
    ['programmatic',     `npx tsx scripts/check-programmatic-value.ts${strictFlag}`, { advisory: !STRICT }],
    ['claims (advisory)', `npx tsx scripts/audit-claim-inventory.ts`,             { advisory: true, skip: SKIP_CLAIMS }],
  ];

  const results: CheckResult[] = [];

  for (const [name, command, opts] of checks) {
    process.stdout.write(`  Running ${pad(name + '...', 28)}`);
    const result = runCheck(name, command, opts);
    results.push(result);

    const ic = icon(result.status);
    const timeStr = result.status === 'skip' ? '' : ` (${(result.durationMs / 1000).toFixed(1)}s)`;
    const label = result.status === 'skip' ? 'SKIPPED' : result.status.toUpperCase();
    console.log(`${ic} ${label}${timeStr}`);

    // Print tail of output immediately on hard failures so dev sees context
    if (result.status === 'fail') {
      const lines = result.output.split('\n');
      const tail = lines.slice(Math.max(0, lines.length - 20));
      console.log(tail.map(l => '    ' + l).join('\n'));
      console.log('');
    }
  }

  printSummary(results);

  const hasFail     = results.some(r => r.status === 'fail');
  const hasStrictW  = STRICT && results.some(r => r.status === 'warn');

  if (hasFail || hasStrictW) {
    process.exit(1);
  }
}

main();
